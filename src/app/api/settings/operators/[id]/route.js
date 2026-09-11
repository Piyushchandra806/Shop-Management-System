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
    const operatorId = id;

    const body = await req.json();
    const { name, email, phone, role, isActive } = body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;

    if (role !== undefined) {
      if (role !== 'admin' && role !== 'operator') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      
      // If demoting from admin to operator, ensure we aren't demoting the last admin
      if (role === 'operator') {
        const targetUser = await prisma.user.findUnique({ where: { id: operatorId } });
        if (targetUser && targetUser.role === 'admin') {
          const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });
          if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot demote the last active administrator' }, { status: 400 });
          }
        }
      }
      data.role = role;
    }
    
    // Similarly, prevent deactivating the last admin
    if (isActive === false) {
      const targetUser = await prisma.user.findUnique({ where: { id: operatorId } });
      if (targetUser && targetUser.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'Cannot deactivate the last active administrator' }, { status: 400 });
        }
      }
    }

    const updatedOperator = await prisma.user.update({
      where: { id: operatorId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true
      }
    });

    return NextResponse.json(updatedOperator);
  } catch (error) {
    console.error('PUT Operator Error:', error);
    return NextResponse.json({ error: 'Failed to update operator details' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only access' }, { status: 403 });
    }

    const { id } = await params;
    const operatorId = id;

    // Check if trying to delete the last admin
    const targetUser = await prisma.user.findUnique({ where: { id: operatorId } });
    if (targetUser && targetUser.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin', isActive: true } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last active administrator' }, { status: 400 });
      }
    }

    // Soft delete / Deactivate operator account
    const deactivated = await prisma.user.update({
      where: { id: operatorId },
      data: { isActive: false },
      select: { id: true, name: true, role: true, isActive: true }
    });

    return NextResponse.json({ message: 'Operator deactivated successfully', operator: deactivated });
  } catch (error) {
    console.error('DELETE Operator Error:', error);
    return NextResponse.json({ error: 'Failed to deactivate operator account' }, { status: 500 });
  }
}
