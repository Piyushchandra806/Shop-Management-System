import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const operators = await prisma.user.findMany({
      where: {
        role: 'operator'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(operators);
  } catch (error) {
    console.error('GET Operators Error:', error);
    return NextResponse.json({ error: 'Failed to fetch operators' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const operator = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'operator',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json(operator, { status: 201 });
  } catch (error) {
    console.error('POST Operator Error:', error);
    return NextResponse.json({ error: 'Failed to create operator account' }, { status: 500 });
  }
}
