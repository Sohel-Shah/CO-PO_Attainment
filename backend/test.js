const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.course.findFirst({ where: { settings: { not: null } } });
  if (c) {
    console.log('SETTINGS:', JSON.stringify(c.settings, null, 2));
  } else {
    console.log('NO COURSE FOUND WITH SETTINGS');
  }
  await prisma.$disconnect();
}
run();
