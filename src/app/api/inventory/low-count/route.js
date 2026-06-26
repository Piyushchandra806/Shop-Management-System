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

    // Load all inventory items to compare quantity with minThreshold in memory.
    // This avoids database-specific syntax limits (like column-to-column comparison).
    const items = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        quantity: true,
        minThreshold: true
      }
    });

    const lowStockCount = items.filter(
      (item) => item.quantity <= item.minThreshold
    ).length;

    return NextResponse.json({ lowStockCount });
  } catch (error) {
    console.error('GET Inventory Low Count Error:', error);
    return NextResponse.json({ error: 'Failed to fetch low stock count' }, { status: 500 });
  }
}
