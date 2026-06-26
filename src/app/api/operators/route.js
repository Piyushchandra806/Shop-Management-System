import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can see operator workload overview
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const operators = await prisma.user.findMany({
      where: {
        role: 'operator',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    const workloadData = await Promise.all(
      operators.map(async (operator) => {
        // Active orders (not delivered)
        const activeOrdersCount = await prisma.order.count({
          where: {
            assignedToId: operator.id,
            status: { not: 'delivered' }
          }
        });

        // Completed orders
        const completedOrdersCount = await prisma.order.count({
          where: {
            assignedToId: operator.id,
            status: 'delivered'
          }
        });

        // Group by status for active orders
        const statuses = ['new', 'designing', 'printing', 'ready'];
        const breakdown = {};
        for (const status of statuses) {
          breakdown[status] = await prisma.order.count({
            where: {
              assignedToId: operator.id,
              status
            }
          });
        }

        return {
          id: operator.id,
          name: operator.name,
          email: operator.email,
          phone: operator.phone,
          activeOrders: activeOrdersCount,
          completedOrders: completedOrdersCount,
          breakdown,
          isOverloaded: activeOrdersCount > 5
        };
      })
    );

    return NextResponse.json(workloadData);
  } catch (error) {
    console.error('GET Operators Workload Error:', error);
    return NextResponse.json({ error: 'Failed to fetch operator workload' }, { status: 500 });
  }
}
