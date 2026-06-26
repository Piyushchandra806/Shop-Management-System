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

    const items = await prisma.inventoryItem.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Dynamically tag low stock items
    const processedItems = items.map(item => ({
      ...item,
      isLowStock: item.quantity <= item.minThreshold
    }));

    return NextResponse.json(processedItems);
  } catch (error) {
    console.error('GET Inventory Error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, quantity, unit, minThreshold } = body;

    if (!name || !category || quantity === undefined || !unit || minThreshold === undefined) {
      return NextResponse.json({ error: 'Missing required inventory fields' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        quantity: parseFloat(quantity),
        unit,
        minThreshold: parseFloat(minThreshold)
      }
    });

    // Log the initial inventory add
    await prisma.inventoryLog.create({
      data: {
        itemId: item.id,
        action: 'added',
        quantityChange: parseFloat(quantity),
        quantityAfter: parseFloat(quantity),
        note: 'Initial stock addition.',
        updatedById: session.user.id
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST Inventory Item Error:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
