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
    const productId = id;

    const body = await req.json();
    const { name, category, basePrice, unit, isActive } = body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (basePrice !== undefined) data.basePrice = parseFloat(basePrice);
    if (unit !== undefined) data.unit = unit;
    if (isActive !== undefined) data.isActive = isActive;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('PUT Product Error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const { id } = await params;
    const productId = id;

    // Soft delete to maintain order references
    const softDeleted = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Product deactivated successfully', product: softDeleted });
  } catch (error) {
    console.error('DELETE Product Error:', error);
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }
}
