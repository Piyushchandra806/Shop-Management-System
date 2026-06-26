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
    const orderId = id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        statusLogs: {
          include: {
            updatedBy: {
              select: { name: true, role: true }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        },
        notes: {
          include: {
            createdBy: {
              select: { name: true, role: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        createdBy: {
          select: { name: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Restrict operator access to assigned, created by them, or unassigned orders only
    if (session.user.role === 'operator' && order.assignedToId !== session.user.id && order.createdById !== session.user.id && order.assignedToId !== null) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this order' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('GET Order Detail Error:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can edit order details' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = id;

    const body = await req.json();
    const { assignedToId, deliveryDate, specialInstructions } = body;

    const data = {};
    if (assignedToId !== undefined) {
      data.assignedToId = assignedToId || null;
    }
    if (deliveryDate) {
      data.deliveryDate = new Date(deliveryDate);
    }
    if (specialInstructions !== undefined) {
      data.specialInstructions = specialInstructions || null;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        customer: true,
        assignedTo: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('PUT Order Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = id;

    // SQLite cascade delete handled via schema definition onDelete: Cascade
    await prisma.order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('DELETE Order Error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
