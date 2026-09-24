const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const exams = await prisma.exam.findMany();
  console.log(JSON.stringify(exams, null, 2));
}

check()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
