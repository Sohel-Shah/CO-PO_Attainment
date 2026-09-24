const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getFullState(courseId) {
    const course = await prisma.course.findUnique({
        where: { courseId },
        include: {
            faculty: true,
            courseOutcomes: { include: { copoMappings: { include: { po: true } } } },
            exams: { include: { questions: { include: { courseOutcome: true } } } }
        },
    });
    if (!course) return null;

    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: { student: true },
        orderBy: { student: { rollNumber: "asc" } },
    });
    const students = enrollments.map(e => e.student);

    return {
        courseId: course.courseId,
        semester: course.semester,
        students: students.map(s => ({
            id: s.rollNumber,
            roll: s.rollNumber,
            rollNo: s.rollNumber,
            misNumber: s.misNumber,
            name: s.name,
            year: s.batchYear,
            email: s.email
        }))
    };
}

async function main() {
    console.log("State for ME-25001:");
    const state1 = await getFullState("ME-25001");
    console.log(JSON.stringify(state1, null, 2));

    console.log("\nState for ME-24001:");
    const state2 = await getFullState("ME-24001");
    console.log(JSON.stringify(state2, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
