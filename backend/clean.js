const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const deleted = await prisma.course.deleteMany({
    where: {
      name: 'Automated Test Course'
    }
  });
  console.log('Deleted', deleted.count, 'courses');
}

clean().finally(() => prisma.$disconnect());
