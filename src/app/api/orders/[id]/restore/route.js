import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const orderId = id;

    // Perform restore (undo soft delete)
    await prisma.order.update({
      where: { id: orderId },
      data: { isDeleted: false }
    });

    return NextResponse.json({ message: 'Order restored successfully' });
  } catch (error) {
    console.error('RESTORE Order Error:', error);
    return NextResponse.json({ error: 'Failed to restore order' }, { status: 500 });
  }
}
