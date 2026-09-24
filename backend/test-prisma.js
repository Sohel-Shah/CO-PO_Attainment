const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.course.findFirst();
  if (!c) {
    console.log("No course found to test");
    return;
  }

  const coursePlan = {
    settings: {
      report: {
        institute: '',
        department: '',
        hodName: '',
        iqacCoordinator: '',
        remarks: ''
      }
    }
  };

  await prisma.course.upsert({
    where: { courseId: c.courseId },
    update: {
      settings: coursePlan.settings !== undefined ? coursePlan.settings : undefined,
    },
    create: {
      courseId: c.courseId,
      name: c.name,
      settings: coursePlan.settings !== undefined ? coursePlan.settings : null,
    }
  });

  const updated = await prisma.course.findUnique({ where: { courseId: c.courseId } });
  console.log("UPDATED SETTINGS:", JSON.stringify(updated.settings, null, 2));

  await prisma.$disconnect();
}
run();
