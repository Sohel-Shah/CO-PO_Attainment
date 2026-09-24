const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function nuclearCleanup() {
  console.log("Nuclear cleanup starting...");
  
  // 1. Delete Marks
  await prisma.mark.deleteMany({});
  console.log("Deleted all marks.");
  
  // 2. Delete Questions
  await prisma.question.deleteMany({});
  console.log("Deleted all questions.");
  
  // 3. Delete Question Paper Questions
  await prisma.questionPaperQuestion.deleteMany({});
  console.log("Deleted all question paper questions.");
  
  // 4. Delete Question Papers
  await prisma.questionPaper.deleteMany({});
  console.log("Deleted all question papers.");
  
  // 5. Delete Exams
  await prisma.exam.deleteMany({});
  console.log("Deleted all exams.");
  
  console.log("Cleanup complete. The next sync will repopulate with correct data.");
}

nuclearCleanup()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
