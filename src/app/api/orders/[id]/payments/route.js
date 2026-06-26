import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only can record payments' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = id;

    const body = await req.json();
    const { amount, method, type, note } = body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Do update and payment insert inside transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount: paymentAmount,
          method: method || 'cash',
          type: type || 'partial',
          note: note || null
        }
      });

      // Recalculate order payment fields
      const newPaidAmount = order.paidAmount + paymentAmount;
      const newDueAmount = Math.max(0, order.totalAmount - newPaidAmount);

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount
        }
      });

      return { payment, order: updatedOrder };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST Order Payments Error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
