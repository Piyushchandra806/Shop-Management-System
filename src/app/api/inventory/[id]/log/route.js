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
    const itemId = id;

    const body = await req.json();
    const { action, quantityChange, note } = body;

    if (session.user.role === 'operator' && action !== 'used') {
      return NextResponse.json({ error: 'Forbidden: Operators can only record stock consumption' }, { status: 403 });
    }

    const change = parseFloat(quantityChange);
    if (isNaN(change) || change <= 0) {
      return NextResponse.json({ error: 'Quantity change must be greater than 0' }, { status: 400 });
    }

    const validActions = ['added', 'used', 'adjusted'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalQuantityChange = change;
      let quantityAfter = item.quantity;

      if (action === 'added') {
        quantityAfter += change;
      } else if (action === 'used') {
        quantityAfter = Math.max(0, item.quantity - change);
        finalQuantityChange = -change; // Store as negative for consumption log representation
      } else if (action === 'adjusted') {
        // In adjustment, quantityChange represents the new target quantity
        quantityAfter = change;
        finalQuantityChange = change - item.quantity;
      }

      // Update the item quantity
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: quantityAfter }
      });

      // Write inventory movement log
      const log = await tx.inventoryLog.create({
        data: {
          itemId,
          action,
          quantityChange: finalQuantityChange,
          quantityAfter,
          note: note || `Stock ${action} by ${session.user.name}.`,
          updatedById: session.user.id
        }
      });

      return { item: updatedItem, log };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST Inventory Log Error:', error);
    return NextResponse.json({ error: 'Failed to record inventory update' }, { status: 500 });
  }
}
