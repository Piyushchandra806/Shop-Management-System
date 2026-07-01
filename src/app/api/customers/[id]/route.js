import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customerId = id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            items: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('GET Customer Detail Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customerId = id;

    const body = await req.json();
    const { name, phone, email, address, notes } = body;

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name,
        phone,
        email: email !== undefined ? email : undefined,
        address: address !== undefined ? address : undefined,
        notes: notes !== undefined ? notes : undefined
      }
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('PUT Customer Error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only can delete customer accounts' }, { status: 403 });
    }

    const { id } = await params;
    const customerId = id;

    // Delete customer and cascade delete their orders and orders items, payments, etc in transaction
    await prisma.$transaction(async (tx) => {
      const customerOrders = await tx.order.findMany({
        where: { customerId }
      });
      const orderIds = customerOrders.map(o => o.id);

      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderStatusLog.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderNote.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { customerId } });
      }

      await tx.customer.delete({
        where: { id: customerId }
      });
    });

    return NextResponse.json({ message: 'Customer and all associated orders deleted successfully' });
  } catch (error) {
    console.error('DELETE Customer Error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
