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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const isOperator = session.user.role === 'operator';

    if (isOperator) {
      // 1. Operator: Today's Orders assigned to them
      const todayOrders = await prisma.order.count({
        where: {
          assignedToId: session.user.id,
          createdAt: { gte: startOfToday },
          NOT: { isDeleted: true }
        }
      });

      // 2. Operator: Pending Orders assigned to them (not delivered)
      const pendingOrders = await prisma.order.count({
        where: {
          assignedToId: session.user.id,
          status: { not: 'delivered' },
          NOT: { isDeleted: true }
        }
      });

      // 3. Operator: Completed Today (assigned to them, status is ready or delivered, updated today)
      const completedToday = await prisma.order.count({
        where: {
          assignedToId: session.user.id,
          status: { in: ['ready', 'delivered'] },
          updatedAt: { gte: startOfToday },
          NOT: { isDeleted: true }
        }
      });

      // 4. Operator: Orders by status (for their assigned orders only)
      const statuses = ['new', 'designing', 'printing', 'ready', 'delivered'];
      const ordersByStatus = {};
      for (const status of statuses) {
        ordersByStatus[status] = await prisma.order.count({
          where: {
            status,
            assignedToId: session.user.id,
            NOT: { isDeleted: true }
          }
        });
      }

      // 5. Operator: Recent Orders (last 5 assigned to them)
      const recentOrders = await prisma.order.findMany({
        where: {
          assignedToId: session.user.id,
          NOT: { isDeleted: true }
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          customer: {
            select: { name: true }
          },
          items: {
            select: { description: true }
          }
        }
      });

      return NextResponse.json({
        stats: {
          todayOrders,
          pendingOrders,
          completedToday,
          isOperator: true
        },
        ordersByStatus,
        recentOrders,
        lowStockItems: []
      });
    }

    // 1. Admin: Total orders today
    const totalOrdersToday = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfToday
        },
        NOT: { isDeleted: true }
      }
    });

    // 2. Admin: Pending orders (anything not delivered)
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: {
          not: 'delivered'
        },
        NOT: { isDeleted: true }
      }
    });

    // 3. Admin: Monthly revenue (sum of all payments received this month)
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });
    const monthlyRevenue = paymentsThisMonth._sum.amount || 0;

    // 4. Admin: Pending payments (total outstanding dues)
    const pendingDues = await prisma.order.aggregate({
      where: {
        dueAmount: {
          gt: 0
        },
        NOT: { isDeleted: true }
      },
      _sum: {
        dueAmount: true
      }
    });
    const totalPendingDues = pendingDues._sum.dueAmount || 0;

    // 5. Admin: Orders by status
    const statuses = ['new', 'designing', 'printing', 'ready', 'delivered'];
    const ordersByStatus = {};
    for (const status of statuses) {
      ordersByStatus[status] = await prisma.order.count({
        where: { status, NOT: { isDeleted: true } }
      });
    }

    // 6. Admin: Recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      where: { NOT: { isDeleted: true } },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        customer: {
          select: { name: true }
        },
        items: {
          select: { description: true }
        }
      }
    });

    // 7. Admin: Low stock items (filter in memory for database-agnostic safety)
    const allInventoryItems = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        name: true,
        quantity: true,
        minThreshold: true,
        unit: true
      }
    });
    const lowStockItems = allInventoryItems.filter(
      (item) => item.quantity <= item.minThreshold
    );

    // 8. Admin: Operator activity (orders taken by operators)
    const operatorsList = await prisma.user.findMany({
      where: { role: 'operator' },
      select: {
        id: true,
        name: true
      }
    });

    const operatorActivity = [];
    for (const op of operatorsList) {
      const orderCount = await prisma.order.count({
        where: { createdById: op.id, NOT: { isDeleted: true } }
      });

      const latestOrders = await prisma.order.findMany({
        where: { createdById: op.id, NOT: { isDeleted: true } },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          totalAmount: true,
          customer: {
            select: { name: true }
          },
          items: {
            select: {
              description: true,
              quantity: true
            }
          }
        }
      });

      operatorActivity.push({
        operatorId: op.id,
        operatorName: op.name,
        orderCount,
        latestOrders
      });
    }

    return NextResponse.json({
      stats: {
        todayOrders: totalOrdersToday,
        pendingOrders: pendingOrdersCount,
        monthlyRevenue,
        pendingPayments: totalPendingDues,
        isOperator: false
      },
      ordersByStatus,
      recentOrders,
      lowStockItems,
      operatorActivity
    });
  } catch (error) {
    console.error('GET Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Failed to compile dashboard stats' }, { status: 500 });
  }
}
