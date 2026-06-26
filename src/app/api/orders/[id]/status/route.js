import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = id;

    const body = await req.json();
    const { status, note } = body;

    const validStatuses = ['new', 'designing', 'printing', 'ready', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role check: Operators can only update status of orders assigned to them or created by them
    if (session.user.role === 'operator' && order.assignedToId !== session.user.id && order.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only update orders assigned to you or created by you' }, { status: 403 });
    }

    const fromStatus = order.status;

    // Strict 1-step progressive flow validation (cannot skip steps; can only move forward 1 step or back 1 step)
    const currentIdx = validStatuses.indexOf(fromStatus);
    const newIdx = validStatuses.indexOf(status);

    if (newIdx !== currentIdx + 1 && newIdx !== currentIdx - 1) {
      return NextResponse.json({ 
        error: `Invalid status transition. You can only move forward to '${validStatuses[currentIdx + 1]}' or back to '${validStatuses[currentIdx - 1]}'` 
      }, { status: 400 });
    }

    // Do update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status }
      });

      // Write status log entry
      await tx.orderStatusLog.create({
        data: {
          orderId,
          updatedById: session.user.id,
          fromStatus,
          toStatus: status,
          note: note || `Order status updated to ${status}.`
        }
      });

      return updatedOrder;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT Order Status Error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
