const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const meta = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mark'`;
  console.log('Columns in mark table:', meta);
  await prisma.$disconnect();
}
check();
