const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log("--- Database Verification Report ---");
  
  const testCourses = await prisma.course.findMany({
    where: { name: { contains: 'Automated Test Course' } }
  });
  console.log(`Found ${testCourses.length} test courses.`);
  
  if (testCourses.length > 0) {
    const courseId = testCourses[0].id;
    
    // Check outcomes
    const cos = await prisma.courseOutcome.findMany({ where: { courseId } });
    console.log(`- Course Outcomes mapped: ${cos.length}`);
    
    // Check students
    const students = await prisma.student.findMany({
      where: { name: { contains: 'Automation Student' } }
    });
    console.log(`- Test Students found: ${students.length}`);
  } else {
    console.log("- No test courses found. Were they deleted or not created?");
  }
}

verify().catch(e => console.error(e)).finally(() => prisma.$disconnect());
