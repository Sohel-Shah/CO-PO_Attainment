const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const students = await prisma.student.findMany({
    take: 10
  });
  console.log("=== Sample Students ===");
  console.log(JSON.stringify(students, null, 2));

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      courseId: true,
      name: true,
      semester: true,
      academicYear: true
    }
  });
  console.log("=== Courses ===");
  console.log(JSON.stringify(courses, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
