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
    const { note } = body;

    if (!note || note.trim() === '') {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const orderNote = await prisma.orderNote.create({
      data: {
        orderId,
        createdById: session.user.id,
        note: note.trim()
      },
      include: {
        createdBy: {
          select: { name: true, role: true }
        }
      }
    });

    return NextResponse.json(orderNote, { status: 201 });
  } catch (error) {
    console.error('POST Order Notes Error:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
