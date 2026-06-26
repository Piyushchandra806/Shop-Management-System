const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MongoDB database...');

  // Clear existing collections if they contain data (useful for clean rebuilds)
  try {
    await prisma.payment.deleteMany({});
    await prisma.orderStatusLog.deleteMany({});
    await prisma.orderNote.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.inventoryLog.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Cleared existing database collections.');
  } catch (err) {
    console.log('No existing collections or unable to clear:', err.message);
  }

  // 1. Create Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const operatorPasswordHash = await bcrypt.hash('operator123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Owner',
      email: 'admin@printpress.com',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true,
    },
  });

  const operator = await prisma.user.create({
    data: {
      name: 'Raju Operator',
      email: 'raju@printpress.com',
      phone: '9876543211',
      passwordHash: operatorPasswordHash,
      role: 'operator',
      isActive: true,
    },
  });

  console.log('Users created:', { admin: admin.email, operator: operator.email });

  // 2. Create Products
  const productData = [
    { name: 'Wedding Card', category: 'Cards', basePrice: 15.0, unit: 'per piece' },
    { name: 'Visiting Card', category: 'Cards', basePrice: 2.0, unit: 'per piece' },
    { name: 'Poster (A3)', category: 'Large Format', basePrice: 50.0, unit: 'per piece' },
    { name: 'Banner', category: 'Large Format', basePrice: 200.0, unit: 'per sq ft' },
    { name: 'Baby Birth Card', category: 'Cards', basePrice: 12.0, unit: 'per piece' },
    { name: 'Pamphlet', category: 'Marketing', basePrice: 3.0, unit: 'per piece' },
    { name: 'Letterhead', category: 'Stationery', basePrice: 5.0, unit: 'per piece' },
    { name: 'Bill Book', category: 'Stationery', basePrice: 80.0, unit: 'per piece' },
  ];

  const createdProducts = {};
  for (const prod of productData) {
    const p = await prisma.product.create({
      data: prod,
    });
    createdProducts[prod.name] = p;
  }
  console.log('Products seeded.');

  // 3. Create Inventory Items
  const inventoryItems = [
    { name: 'A4 Paper 80GSM', category: 'Paper', quantity: 500, unit: 'reams', minThreshold: 50 },
    { name: 'A3 Paper 100GSM', category: 'Paper', quantity: 200, unit: 'reams', minThreshold: 30 },
    { name: 'Wedding Card Stock (Gold)', category: 'Paper', quantity: 1000, unit: 'sheets', minThreshold: 100 },
    { name: 'Glossy Photo Paper A4', category: 'Paper', quantity: 150, unit: 'packs', minThreshold: 20 },
    { name: 'Black Ink (LaserJet)', category: 'Ink', quantity: 50, unit: 'liters', minThreshold: 10 },
    { name: 'Color Ink Set (CMYK)', category: 'Ink', quantity: 30, unit: 'liters', minThreshold: 5 },
    { name: 'Lamination Roll (Glossy)', category: 'Finishing', quantity: 100, unit: 'rolls', minThreshold: 15 },
    { name: 'Binding Rings (Metal)', category: 'Finishing', quantity: 500, unit: 'pieces', minThreshold: 50 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({
      data: item,
    });
  }
  console.log('Inventory items seeded.');

  // 4. Create a Sample Customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Ramesh Sharma',
      phone: '9988776655',
      email: 'ramesh@gmail.com',
      address: 'Shop No. 12, Main Bazar Road, Delhi',
      notes: 'Regular client for business cards and billing books',
    },
  });
  console.log('Sample customer created.');

  // 5. Create a Sample Order
  const orderNumber = 'ORD-20260615-001';
  
  // Use product IDs from createdProducts map
  const visitingCardProd = createdProducts['Visiting Card'];
  const billBookProd = createdProducts['Bill Book'];

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      createdById: admin.id,
      assignedToId: operator.id,
      status: 'designing',
      deliveryDate: new Date('2026-06-20T18:00:00.000Z'),
      totalAmount: 160.0,
      paidAmount: 100.0,
      dueAmount: 60.0,
      qrCodeData: `/track/${orderNumber}`,
      specialInstructions: 'Use premium gold foil border. Double-check text alignment.',
      items: {
        create: [
          {
            description: 'Visiting Cards - Premium Matte Finish',
            quantity: 500,
            unitPrice: 0.2, // 100 total
            productId: visitingCardProd ? visitingCardProd.id : null,
            totalPrice: 100.0,
          },
          {
            description: 'Bill Books - carbonless duplicator',
            quantity: 2,
            unitPrice: 30.0, // 60 total
            productId: billBookProd ? billBookProd.id : null,
            totalPrice: 60.0,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 100.0,
            method: 'upi',
            type: 'advance',
            note: 'Paid advance via GPay',
          },
        ],
      },
      statusLogs: {
        create: [
          {
            updatedById: admin.id,
            fromStatus: 'new',
            toStatus: 'designing',
            note: 'Order created and sent to design department.',
          },
        ],
      },
      notes: {
        create: [
          {
            createdById: admin.id,
            note: 'Customer wants layout proofs sent on WhatsApp before printing.',
          },
        ],
      },
    },
  });
  console.log('Sample order created successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
