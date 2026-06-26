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

    const { id } = await params;
    const orderId = id;

    const body = await req.json();
    const { type } = body; // 'confirm' or 'ready' or 'delivered'

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let noteText = '';
    if (type === 'confirm') {
      noteText = `[WhatsApp: Confirmation] Message link generated for order.`;
    } else if (type === 'ready') {
      noteText = `[WhatsApp: Ready Alert] Pickup message link generated for order.`;
    } else {
      noteText = `[WhatsApp: Custom] Message link generated for order.`;
    }

    // Save as order note
    const note = await prisma.orderNote.create({
      data: {
        orderId,
        createdById: session.user.id,
        note: noteText
      },
      include: {
        createdBy: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('POST WhatsApp Log Error:', error);
    return NextResponse.json({ error: 'Failed to record WhatsApp log' }, { status: 500 });
  }
}
