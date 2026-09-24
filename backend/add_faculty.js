const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.faculty.upsert({
    where: { email: 'manish.attal@spit.ac.in' },
    update: {},
    create: {
      name: 'Prof Manish Attal',
      email: 'manish.attal@spit.ac.in',
      department: 'Mechanical Engineering (ME)'
    }
  });
  console.log('Added Prof Manish Attal to database');
}
run().finally(() => prisma.$disconnect());
