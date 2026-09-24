const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log("=== Database Verification ===");
  
  const exams = await prisma.exam.findMany({ include: { questions: true } });
  console.log(`\nExams found: ${exams.length}`);
  exams.forEach(e => {
    console.log(` - Exam: ${e.title} (${e.type}), Questions: ${e.questions.length}`);
  });

  const papers = await prisma.questionPaper.findMany({ include: { questions: true } });
  console.log(`\nQuestion Papers found: ${papers.length}`);
  papers.forEach(p => {
    console.log(` - Paper: ${p.title} (${p.type}), Questions: ${p.questions.length}`);
  });

  const marks = await prisma.mark.findMany({ include: { student: true, question: true } });
  console.log(`\nMarks entries found: ${marks.length}`);
  
  const feedback = await prisma.feedback.findMany();
  console.log(`\nFeedback entries found: ${feedback.length}`);
  
  console.log("\n=== Done ===");
  await prisma.$disconnect();
}
verify().catch(console.error);
