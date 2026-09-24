const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log("--- Cleaning up dummy test data ---");
  
  // Find dummy students
  const dummyStudents = await prisma.student.findMany({
    where: { rollNumber: { contains: 'TEST' } }
  });
  console.log(`Found ${dummyStudents.length} dummy students to delete.`);
  for (const student of dummyStudents) {
    await prisma.student.delete({ where: { id: student.id } });
  }

  // Find dummy courses
  const dummyCourses = await prisma.course.findMany({
    where: { name: { contains: 'Automated Test Course' } }
  });
  console.log(`Found ${dummyCourses.length} dummy courses to delete.`);
  for (const course of dummyCourses) {
    await prisma.course.delete({ where: { id: course.id } });
  }

  // Find dummy exams (if any, although deleting course should cascade)
  
  console.log("Cleanup complete!");
}

cleanup().catch(e => console.error(e)).finally(() => prisma.$disconnect());
