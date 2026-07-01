import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const pendingPayments = searchParams.get('pendingPayments');
    const operatorId = searchParams.get('operatorId');
    const dashboardFilter = searchParams.get('dashboardFilter');

    const where = { NOT: { isDeleted: true } };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by operator
    if (operatorId) {
      where.createdById = operatorId;
    }

    // Filter by pending payments
    if (pendingPayments === 'true') {
      where.dueAmount = { gt: 0 };
    }

    // Filter by dashboard stat cards
    if (dashboardFilter === 'today') {
      where.createdAt = { gte: startOfToday };
    } else if (dashboardFilter === 'pending') {
      where.status = { not: 'delivered' };
    } else if (dashboardFilter === 'completedToday') {
      where.status = { in: ['ready', 'delivered'] };
      where.updatedAt = { gte: startOfToday };
    } else if (dashboardFilter === 'assignedToday') {
      where.assignedToId = session.user.id;
      where.createdAt = { gte: startOfToday };
    } else if (dashboardFilter === 'assignedPending') {
      where.assignedToId = session.user.id;
      where.status = { not: 'delivered' };
    } else if (dashboardFilter === 'assignedCompletedToday') {
      where.assignedToId = session.user.id;
      where.status = { in: ['ready', 'delivered'] };
      where.updatedAt = { gte: startOfToday };
    } else if (dashboardFilter === 'monthlyRevenue') {
      where.createdAt = { gte: startOfMonth };
    }

    // Search query matches order number or customer name/phone
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    // If operator, only show orders assigned to them or unassigned
    if (session.user.role === 'operator') {
      const hasAssignedFilter = dashboardFilter && dashboardFilter.startsWith('assigned');
      if (!hasAssignedFilter) {
        where.OR = [
          ...(where.OR || []),
          { assignedToId: session.user.id },
          { assignedToId: null }
        ];
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        items: true,
        createdBy: {
          select: { name: true, role: true }
        },
        assignedTo: {
          select: { name: true, role: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET Orders Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items, // array of { productId, description, quantity, unitPrice }
      deliveryDate,
      specialInstructions,
      assignedToId,
      advancePaymentAmount,
      advancePaymentMethod,
      orderPhoto
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }
    if (!deliveryDate) {
      return NextResponse.json({ error: 'Delivery date is required' }, { status: 400 });
    }

    // 1. Calculate totals
    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const quantity = parseInt(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;
      totalAmount += totalPrice;
      return {
        productId: item.productId || null,
        description: item.description || '',
        quantity,
        unitPrice,
        totalPrice
      };
    });

    const paidAmount = parseFloat(advancePaymentAmount) || 0;
    const dueAmount = totalAmount - paidAmount;

    // Use a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 2. Customer handling
      let finalCustomerId = customerId;
      if (!finalCustomerId) {
        // Create new customer
        const customer = await tx.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
            address: customerAddress || null
          }
        });
        finalCustomerId = customer.id;
      }

      // 3. Generate unique order number: ORD-YYYYMMDD-NNN
      const today = new Date();
      const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `ORD-${dateString}`;

      // Find the last created order for today to determine NNN
      const lastOrderToday = await tx.order.findFirst({
        where: {
          orderNumber: {
            startsWith: prefix
          }
        },
        orderBy: {
          orderNumber: 'desc'
        }
      });

      let nextSeq = 1;
      if (lastOrderToday) {
        const parts = lastOrderToday.orderNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
      const sequenceNum = String(nextSeq).padStart(3, '0');
      const orderNumber = `${prefix}-${sequenceNum}`;

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: finalCustomerId,
          createdById: session.user.id,
          assignedToId: assignedToId || null,
          status: 'new',
          deliveryDate: new Date(deliveryDate),
          totalAmount,
          paidAmount,
          dueAmount,
          orderPhoto: orderPhoto || null,
          specialInstructions: specialInstructions || null,
          items: {
            create: orderItemsData
          }
        }
      });

      // 5. Generate QR Code (Base64 data URL encoded link to public status page)
      // For now we encode the orderNumber to construct `/track/{orderNumber}` in client side
      const qrCodeData = await QRCode.toDataURL(orderNumber);
      
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { qrCodeData }
      });

      // 6. Create initial status log
      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          updatedById: session.user.id,
          fromStatus: 'none',
          toStatus: 'new',
          note: 'Order placed in system.'
        }
      });

      // 7. Create Payment if advance paid
      if (paidAmount > 0) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: paidAmount,
            method: advancePaymentMethod || 'cash',
            type: 'advance',
            note: 'Advance payment paid on creation.'
          }
        });
      }

      return updatedOrder;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST Orders Error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
