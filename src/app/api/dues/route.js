import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const filter = searchParams.get('filter'); // 'all' | 'zero_paid' | 'partial'

    // Find all orders with dues > 0
    const orderWhere = { dueAmount: { gt: 0 } };

    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by customer
    const customerMap = {};
    for (const order of orders) {
      const cId = order.customerId;
      if (!customerMap[cId]) {
        customerMap[cId] = {
          customer: order.customer,
          totalDue: 0,
          totalOrderAmount: 0,
          totalPaid: 0,
          dueOrders: [],
          zeroPaidOrders: 0,
        };
      }
      customerMap[cId].totalDue += order.dueAmount;
      customerMap[cId].totalOrderAmount += order.totalAmount;
      customerMap[cId].totalPaid += order.paidAmount;
      customerMap[cId].dueOrders.push(order);
      if (order.paidAmount === 0) {
        customerMap[cId].zeroPaidOrders += 1;
      }
    }

    let results = Object.values(customerMap);

    // Filter
    if (filter === 'zero_paid') {
      results = results.filter((r) => r.zeroPaidOrders > 0);
    } else if (filter === 'partial') {
      results = results.filter((r) => r.totalPaid > 0 && r.totalDue > 0);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.phone.includes(q)
      );
    }

    // Sort by total due descending (biggest defaulters first)
    results.sort((a, b) => b.totalDue - a.totalDue);

    // Summary stats
    const summary = {
      totalDefaulters: results.length,
      totalDueAmount: results.reduce((s, r) => s + r.totalDue, 0),
      totalZeroPaidCustomers: results.filter((r) => r.zeroPaidOrders > 0).length,
      totalDueOrders: results.reduce((s, r) => s + r.dueOrders.length, 0),
    };

    return NextResponse.json({ summary, customers: results });
  } catch (error) {
    console.error('GET Dues Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dues' }, { status: 500 });
  }
}
