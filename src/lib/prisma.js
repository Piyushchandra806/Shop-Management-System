import { PrismaClient } from '@prisma/client';

let prisma;

let dbUrl = process.env.DATABASE_URL;

// Fix for MongoDB Atlas DNS resolution issue on AWS/Render
if (dbUrl && dbUrl.includes('mongodb.net/') && !dbUrl.includes('mongodb.net./')) {
  dbUrl = dbUrl.replace('mongodb.net/', 'mongodb.net./');
}

const prismaConfig = dbUrl ? { datasources: { db: { url: dbUrl } } } : {};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(prismaConfig);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaConfig);
  }
  prisma = global.prisma;
}

export default prisma;
