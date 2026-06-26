import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          select: { name: true }
        },
        items: {
          select: {
            description: true,
            quantity: true
          }
        },
        statusLogs: {
          select: {
            fromStatus: true,
            toStatus: true,
            note: true,
            changedAt: true
          },
          orderBy: {
            changedAt: 'asc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mask customer name for privacy (first name only)
    const fullName = order.customer.name || '';
    const firstName = fullName.split(' ')[0] || 'Customer';

    const progressMap = {
      'new': 0,
      'designing': 25,
      'printing': 50,
      'ready': 75,
      'delivered': 100
    };
    const progress = progressMap[order.status] || 0;

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      progress,
      deliveryDate: order.deliveryDate,
      customerFirstName: firstName,
      items: order.items,
      statusLogs: order.statusLogs,
      specialInstructions: order.specialInstructions
    });
  } catch (error) {
    console.error('GET Public Order Tracking Error:', error);
    return NextResponse.json({ error: 'Failed to fetch order tracking status' }, { status: 500 });
  }
}
