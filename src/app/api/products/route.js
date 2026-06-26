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

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true';

    const where = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('GET Products Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const body = await req.json();
    const { name, category, basePrice, unit } = body;

    if (!name || !category || basePrice === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        basePrice: parseFloat(basePrice),
        unit,
        isActive: true
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('POST Product Error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
