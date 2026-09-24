const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log("🚀 Starting Nuclear Cleanup V2...");

  // 1. Find the course
  const course = await prisma.course.findFirst({
    where: { 
      OR: [
        { courseId: "ME-25001" },
        { name: "Heat Transfer" }
      ]
    }
  });

  if (!course) {
    console.error("❌ Course ME-25001 not found!");
    return;
  }

  console.log(`📌 Found Course: ${course.name} (${course.id})`);

  // 2. Delete ALL existing exams and question papers for this course
  await prisma.exam.deleteMany({ where: { courseId: course.id } });
  await prisma.questionPaper.deleteMany({ where: { courseId: course.id } });

  console.log("🗑️ Deleted all existing exams and papers.");

  // 3. Create exactly the 3 requested exams
  const examsToCreate = [
    { title: "Internal Exam", type: "Internal", totalMarks: 40, duration: "1 hr" },
    { title: "End Semester Exam", type: "End Semester", totalMarks: 55, duration: "3 hr" },
    { title: "Mid Semester Exam", type: "Mid Semester", totalMarks: 30, duration: "2 hr" }
  ];

  for (const ex of examsToCreate) {
    await prisma.exam.create({
      data: {
        ...ex,
        courseId: course.id
      }
    });
    
    // Also create corresponding question papers so they stay synced
    await prisma.questionPaper.create({
      data: {
        ...ex,
        courseId: course.id
      }
    });
  }

  console.log("✅ Created 3 standard exams: Internal (40), End Sem (55), Mid Sem (30).");
  console.log("✨ Cleanup Complete!");
}

cleanup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
