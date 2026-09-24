const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log("Cleaning up extra exam types...");
  const allowedTypes = ["Internal", "Mid Semester", "End Semester"];
  
  const deleted = await prisma.exam.deleteMany({
    where: {
      type: {
        notIn: allowedTypes
      }
    }
  });
  
  console.log(`Deleted ${deleted.count} exams with invalid types.`);
  
  // Also clean up question papers of other types
  const deletedPapers = await prisma.questionPaper.deleteMany({
    where: {
      type: {
        notIn: allowedTypes
      }
    }
  });
  console.log(`Deleted ${deletedPapers.count} question papers with invalid types.`);

  // Optional: Set specific totals as per screenshot for existing exams
  await prisma.exam.updateMany({
    where: { type: "Internal" },
    data: { totalMarks: 40 }
  });
  await prisma.exam.updateMany({
    where: { type: "Mid Semester" },
    data: { totalMarks: 30 }
  });
  await prisma.exam.updateMany({
    where: { type: "End Semester" },
    data: { totalMarks: 55 }
  });
  
  console.log("Updated marks for remaining exams.");
}

cleanup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
