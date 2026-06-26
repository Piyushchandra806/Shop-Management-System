import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const { id } = await params;
    const itemId = id;

    const body = await req.json();
    const { name, category, minThreshold, unit } = body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (minThreshold !== undefined) data.minThreshold = parseFloat(minThreshold);
    if (unit !== undefined) data.unit = unit;

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('PUT Inventory Item Error:', error);
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const { id } = await params;
    const itemId = id;

    await prisma.inventoryItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('DELETE Inventory Item Error:', error);
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
