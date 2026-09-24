const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const students = await prisma.student.count();
  const marks = await prisma.mark.count();
  console.log('Students:', students);
  console.log('Marks:', marks);
  await prisma.$disconnect();
}
check();
