// ─────────────────────────────────────────────────────────────────────────────
//  server/relational_api.js
//  All database query logic — imported by index.js
// ─────────────────────────────────────────────────────────────────────────────
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════
//  FACULTY
// ═══════════════════════════════════════════════
async function getAllFaculty() {
    return prisma.faculty.findMany({ orderBy: { name: "asc" } });
}

async function createFaculty(data) {
    return prisma.faculty.create({ data });
}

async function getFacultyById(id) {
    return prisma.faculty.findUnique({ where: { id } });
}

// ═══════════════════════════════════════════════
//  PROGRAM OUTCOMES (PO / PSO)
// ═══════════════════════════════════════════════
async function getAllPOs() {
    return prisma.pO.findMany({ orderBy: { poId: "asc" } });
}

async function upsertPO(poId, description, type) {
    return prisma.pO.upsert({
        where: { poId },
        update: { description, type },
        create: { poId, description, type },
    });
}

// ═══════════════════════════════════════════════
//  COURSES
// ═══════════════════════════════════════════════
async function getAllCourses() {
    return prisma.course.findMany({
        include: { faculty: true, courseOutcomes: true },
        orderBy: { semester: "asc" },
    });
}

async function getCourseById(courseId) {
    return prisma.course.findUnique({
        where: { courseId },
        include: { faculty: true, courseOutcomes: { include: { copoMappings: { include: { po: true } } } }, exams: { include: { questions: true } } },
    });
}

async function upsertCourse(data) {
    const { courseId, facultyName, ...rest } = data;

    // Resolve faculty by name if provided
    let facultyId = undefined;
    if (facultyName) {
        const f = await prisma.faculty.findFirst({ where: { name: { contains: facultyName, mode: "insensitive" } } });
        if (f) facultyId = f.id;
    }

    return prisma.course.upsert({
        where: { courseId },
        update: { ...rest, ...(facultyId && { facultyId }) },
        create: { courseId, ...rest, ...(facultyId && { facultyId }) },
    });
}

async function deleteCourse(courseId) {
    return prisma.course.delete({ where: { courseId } });
}

// ═══════════════════════════════════════════════
//  COURSE OUTCOMES (CO)
// ═══════════════════════════════════════════════
async function getCOsForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    return prisma.courseOutcome.findMany({
        where: { courseId: course.id },
        include: { copoMappings: { include: { po: true } } },
        orderBy: { coNumber: "asc" },
    });
}

async function upsertCO(courseId, coNumber, description, bloomLevel) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new Error(`Course ${courseId} not found`);

    return prisma.courseOutcome.upsert({
        where: { courseId_coNumber: { courseId: course.id, coNumber } },
        update: { description, bloomLevel },
        create: { courseId: course.id, coNumber, description, bloomLevel: bloomLevel || "Apply" },
    });
}

async function deleteCOsForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return;
    await prisma.courseOutcome.deleteMany({ where: { courseId: course.id } });
}

// ═══════════════════════════════════════════════
//  CO-PO MAPPING
// ═══════════════════════════════════════════════
async function getCopoMapForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    const coIds = await prisma.courseOutcome.findMany({ where: { courseId: course.id }, select: { id: true } });
    return prisma.cOPOMapping.findMany({
        where: { courseOutcomeId: { in: coIds.map(c => c.id) } },
        include: { courseOutcome: true, po: true },
    });
}

async function upsertCopoMapping(courseOutcomeId, poId, correlationLevel) {
    return prisma.cOPOMapping.upsert({
        where: { courseOutcomeId_poId: { courseOutcomeId, poId: (await prisma.pO.findUnique({ where: { poId } }))?.id || poId } },
        update: { correlationLevel },
        create: { courseOutcomeId, poId: (await prisma.pO.findUnique({ where: { poId } }))?.id || poId, correlationLevel },
    });
}

async function bulkSaveCopoMap(courseId, copoMapObj) {
    // copoMapObj: { CO1: { PO1: 3, PO2: 2, ... }, CO2: { ... } }
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return;

    const cos = await prisma.courseOutcome.findMany({ where: { courseId: course.id } });
    const pos = await prisma.pO.findMany();
    const poLookup = Object.fromEntries(pos.map(p => [p.poId, p.id]));
    const coLookup = Object.fromEntries(cos.map(c => [c.coNumber, c.id]));

    const ops = [];
    for (const [coNum, poMap] of Object.entries(copoMapObj)) {
        const coDbId = coLookup[coNum];
        if (!coDbId) continue;
        for (const [poKey, level] of Object.entries(poMap)) {
            const poDbId = poLookup[poKey];
            if (!poDbId) continue;
            ops.push(
                prisma.cOPOMapping.upsert({
                    where: { courseOutcomeId_poId: { courseOutcomeId: coDbId, poId: poDbId } },
                    update: { correlationLevel: Number(level) },
                    create: { courseOutcomeId: coDbId, poId: poDbId, correlationLevel: Number(level) },
                })
            );
        }
    }
    return prisma.$transaction(ops);
}

// ═══════════════════════════════════════════════
//  STUDENTS
// ═══════════════════════════════════════════════
async function getAllStudents() {
    return prisma.student.findMany({ orderBy: { rollNumber: "asc" } });
}

async function getStudentsForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: { student: true },
        orderBy: { student: { rollNumber: "asc" } },
    });
    return enrollments.map(e => e.student);
}

async function upsertStudent(rollNumber, name, email, batchYear) {
    return prisma.student.upsert({
        where: { rollNumber },
        update: { name, email, batchYear },
        create: { rollNumber, name, email, batchYear },
    });
}

async function enrollStudent(rollNumber, courseId) {
    const student = await prisma.student.findUnique({ where: { rollNumber } });
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!student || !course) return null;
    return prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
        update: {},
        create: { studentId: student.id, courseId: course.id },
    });
}

async function bulkEnrollStudents(studentList, courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return;
    const ops = [];
    for (const s of studentList) {
        const student = await prisma.student.upsert({
            where: { rollNumber: s.roll || s.rollNumber },
            update: { name: s.name },
            create: { rollNumber: s.roll || s.rollNumber, name: s.name },
        });
        ops.push(
            prisma.enrollment.upsert({
                where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
                update: {},
                create: { studentId: student.id, courseId: course.id },
            })
        );
    }
    return Promise.all(ops);
}

// ═══════════════════════════════════════════════
//  EXAMS
// ═══════════════════════════════════════════════
async function getExamsForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    return prisma.exam.findMany({
        where: { courseId: course.id },
        include: { questions: { include: { courseOutcome: true } } },
        orderBy: { createdAt: "asc" },
    });
}

async function createExam(courseId, data) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) throw new Error(`Course ${courseId} not found`);

    // Map frontend fields (name/total) to database fields (title/totalMarks)
    const prismaData = {
        title: data.title || data.name || "Exam",
        type: data.type || "Internal",
        totalMarks: Number(data.totalMarks || data.total || 0),
        duration: data.duration || null,
        courseId: course.id
    };

    return prisma.exam.create({
        data: prismaData,
        include: { questions: true }
    });
}

async function updateExam(examId, data) {
    const prismaData = { ...data };
    if (data.name) { prismaData.title = data.name; delete prismaData.name; }
    if (data.total) { prismaData.totalMarks = Number(data.total); delete prismaData.total; }
    if (data.totalMarks) prismaData.totalMarks = Number(data.totalMarks);

    return prisma.exam.update({ where: { id: examId }, data: prismaData });
}

async function deleteExam(examId) {
    return prisma.exam.delete({ where: { id: examId } });
}

// ═══════════════════════════════════════════════
//  QUESTIONS
// ═══════════════════════════════════════════════
async function addQuestion(examId, label, maxMarks, coNumber, bloomLevel, unitNo, questionText) {
    // Resolve CO id from exam's course + coNumber
    const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { course: true } });
    let coDbId = null;
    if (coNumber && exam) {
        const co = await prisma.courseOutcome.findUnique({ where: { courseId_coNumber: { courseId: exam.courseId, coNumber } } });
        coDbId = co?.id || null;
    }
    return prisma.question.create({
        data: { examId, label, maxMarks, courseOutcomeId: coDbId, bloomLevel, unitNo, questionText },
    });
}

// ═══════════════════════════════════════════════
//  MARKS
// ═══════════════════════════════════════════════
async function getMarksForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    const exams = await prisma.exam.findMany({ where: { courseId: course.id }, select: { id: true } });
    const qIds = await prisma.question.findMany({ where: { examId: { in: exams.map(e => e.id) } }, select: { id: true } });
    return prisma.mark.findMany({
        where: { questionId: { in: qIds.map(q => q.id) } },
        include: { student: true, question: { include: { exam: true } } },
    });
}

async function saveMark(rollNumber, questionId, marksObtained) {
    const student = await prisma.student.findUnique({ where: { rollNumber } });
    if (!student) throw new Error(`Student ${rollNumber} not found`);
    return prisma.mark.upsert({
        where: { studentId_questionId: { studentId: student.id, questionId } },
        update: { marksObtained },
        create: { studentId: student.id, questionId, marksObtained },
    });
}

// ═══════════════════════════════════════════════
//  FEEDBACK
// ═══════════════════════════════════════════════
async function getFeedbackForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    const coIds = await prisma.courseOutcome.findMany({ where: { courseId: course.id }, select: { id: true } });
    return prisma.feedback.findMany({
        where: { courseOutcomeId: { in: coIds.map(c => c.id) } },
        include: { student: true, courseOutcome: true },
    });
}

async function saveFeedback(rollNumber, courseId, coNumber, rating) {
    const student = await prisma.student.findUnique({ where: { rollNumber } });
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!student || !course) return null;
    const co = await prisma.courseOutcome.findUnique({ where: { courseId_coNumber: { courseId: course.id, coNumber } } });
    if (!co) return null;
    return prisma.feedback.upsert({
        where: { studentId_courseOutcomeId: { studentId: student.id, courseOutcomeId: co.id } },
        update: { rating },
        create: { studentId: student.id, courseOutcomeId: co.id, rating },
    });
}

// ═══════════════════════════════════════════════
//  QUESTION PAPERS (UI "Question Paper Setting")
// ═══════════════════════════════════════════════
async function getQuestionPapersForCourse(courseId) {
    const course = await prisma.course.findUnique({ where: { courseId } });
    if (!course) return [];
    return prisma.questionPaper.findMany({
        where: { courseId: course.id },
        include: {
            questions: {
                orderBy: { createdAt: "asc" },
                include: { courseOutcome: true }
            }
        },
        orderBy: { createdAt: "desc" },
    });
}

async function createQuestionPaper(courseId, data) {
    const course = await prisma.course.findUnique({ where: { courseId }, include: { courseOutcomes: true } });
    if (!course) throw new Error(`Course ${courseId} not found`);

    // Normalize incoming data: handle 'sections' or 'questions'
    let flatQuestions = [];
    if (Array.isArray(data.questions)) {
        flatQuestions = data.questions;
    } else if (Array.isArray(data.sections)) {
        flatQuestions = data.sections.flatMap(sec =>
            (sec.questions || []).map(q => ({ ...q, section: sec.name || q.section }))
        );
    }

    const { questions: _unusedQ, sections: _unusedS, ...paperData } = data;
    const coLookup = Object.fromEntries(course.courseOutcomes.map(c => [c.coNumber, c.id]));

    return prisma.questionPaper.create({
        data: {
            ...paperData,
            title: data.title || data.name || "Question Paper",
            courseId: course.id,
            totalMarks: Number(data.totalMarks || data.total || 0),
            questions: {
                create: flatQuestions.map((q, idx) => {
                    let coId = q.courseOutcomeId || null;
                    if (!coId && q.co) coId = coLookup[q.co] || null;

                    return {
                        section: q.section || "Section A",
                        questionText: q.questionText || q.q || q.text || "",
                        marks: Number(q.marks || 0),
                        type: q.type || "short",
                        courseOutcomeId: coId,
                        createdAt: new Date(Date.now() + idx * 10),
                    };
                })
            }
        },
        include: { questions: true }
    });
}

async function updateQuestionPaper(paperId, data) {
    const course = await prisma.questionPaper.findUnique({
        where: { id: paperId },
        include: { course: { include: { courseOutcomes: true } } }
    });
    if (!course) throw new Error("Question Paper not found");

    // Normalize questions
    let flatQuestions = null;
    if (Array.isArray(data.questions)) {
        flatQuestions = data.questions;
    } else if (Array.isArray(data.sections)) {
        flatQuestions = data.sections.flatMap(sec =>
            (sec.questions || []).map(q => ({ ...q, section: sec.name || q.section }))
        );
    }

    const { questions: _unusedQ, sections: _unusedS, ...paperData } = data;
    if (paperData.name && !paperData.title) paperData.title = paperData.name;
    if (paperData.total && !paperData.totalMarks) paperData.totalMarks = Number(paperData.total);

    if (flatQuestions) {
        const coLookup = Object.fromEntries(course.course.courseOutcomes.map(c => [c.coNumber, c.id]));
        await prisma.questionPaperQuestion.deleteMany({ where: { paperId } });

        return prisma.questionPaper.update({
            where: { id: paperId },
            data: {
                ...paperData,
                questions: {
                    create: flatQuestions.map((q, idx) => {
                        let coId = q.courseOutcomeId || null;
                        if (!coId && q.co) coId = coLookup[q.co] || null;
                        return {
                            section: q.section || "Section A",
                            questionText: q.questionText || q.q || q.text || "",
                            marks: Number(q.marks || 0),
                            type: q.type || "short",
                            courseOutcomeId: coId,
                            createdAt: new Date(Date.now() + idx * 10),
                        };
                    })
                }
            },
            include: { questions: true }
        });
    }

    return prisma.questionPaper.update({
        where: { id: paperId },
        data: paperData,
        include: { questions: true }
    });
}

async function deleteQuestionPaper(paperId) {
    return prisma.questionPaper.delete({ where: { id: paperId } });
}

// ═══════════════════════════════════════════════
//  FULL STATE (sync-full)
// ═══════════════════════════════════════════════
async function syncFullState(payload) {
    const { course, coStatements, copoMap, students, exams, papers, marks } = payload;
    if (!course?.courseId) return { ok: false, error: "courseId required" };

    // 1. Upsert course
    const courseRecord = await upsertCourse({
        courseId: course.courseId,
        name: course.name || "",
        code: course.code || null,
        courseType: course.courseType || null,
        department: course.department || null,
        semester: course.semester || null,
        credits: course.credits ? Number(course.credits) : null,
        lectureHrs: course.L ? Number(course.L) : null,
        tutorialHrs: course.T ? Number(course.T) : null,
        practicalHrs: course.P ? Number(course.P) : null,
        selfStudyHrs: course.S ? Number(course.S) : null,
        academicYear: course.academicYear || null,
        programName: course.programName || null,
        misNumber: course.misNumber || null,
        facultyName: course.faculty || null,
        teachingPlan: payload.teachingPlan || null
    });

    // 2. Upsert COs
    if (Array.isArray(coStatements)) {
        for (let i = 0; i < coStatements.length; i++) {
            await upsertCO(course.courseId, `CO${i + 1}`, coStatements[i], null);
        }
    }

    // 3. Bulk save CO-PO map
    if (copoMap && typeof copoMap === "object") {
        await bulkSaveCopoMap(course.courseId, copoMap);
    }

    // 4. Enrol / upsert students
    if (Array.isArray(students) && students.length > 0) {
        await bulkEnrollStudents(students, course.courseId);
    }

    // 5. Sync Exams (Examination Setup)
    if (Array.isArray(exams)) {
        // We delete old exams only if we are syncing all of them
        await prisma.exam.deleteMany({ where: { courseId: courseRecord.id } });
        for (const ex of exams) {
            await createExam(course.courseId, {
                title: ex.title || ex.name || "Exam",
                type: ex.type,
                totalMarks: Number(ex.totalMarks || ex.total || 0),
                duration: ex.duration || null
            });
        }
    }

    // 6. Sync Question Papers
    if (Array.isArray(papers)) {
        await prisma.questionPaper.deleteMany({ where: { courseId: courseRecord.id } });
        for (const p of papers) {
            await createQuestionPaper(course.courseId, p);
        }
    }

    // 7. Sync Marks if provided
    if (marks && typeof marks === "object") {
        // marks format from frontend: { studentId: { questionIdx: value } }
        // or a flatter array. Let's assume the frontend sends what getFullState returns 
        // but often it's the raw state object.
        for (const [studentId, studentMarks] of Object.entries(marks)) {
            if (typeof studentMarks !== 'object') continue;
            for (const [qId, val] of Object.entries(studentMarks)) {
                try {
                    // if qId is a UUID, we can save it directly
                    if (qId.length > 30) {
                        await saveMark(studentId, qId, parseFloat(val) || 0);
                    }
                } catch (e) {
                    console.error("Failed to save individual mark", e);
                }
            }
        }
    }

    return { ok: true };
}

async function getFullState(courseId) {
    const course = await getCourseById(courseId);
    if (!course) return null;

    const cos = await getCOsForCourse(courseId);
    const students = await getStudentsForCourse(courseId);
    const exams = await getExamsForCourse(courseId);
    const marks = await getMarksForCourse(courseId);
    const feedback = await getFeedbackForCourse(courseId);
    const pos = await getAllPOs();
    const papers = await getQuestionPapersForCourse(courseId);

    // Reshape copoMap to { CO1: { PO1: 3, PO2: 2, ... }, ... }
    const copoMap = {};
    for (const co of cos) {
        copoMap[co.coNumber] = {};
        for (const m of co.copoMappings) {
            copoMap[co.coNumber][m.po.poId] = m.correlationLevel;
        }
    }

    return {
        course: { courseId: course.courseId, name: course.name, code: course.code, courseType: course.courseType, department: course.department, semester: course.semester, credits: course.credits, L: course.lectureHrs, T: course.tutorialHrs, P: course.practicalHrs, S: course.selfStudyHrs, academicYear: course.academicYear, programName: course.programName, misNumber: course.misNumber, faculty: course.faculty?.name || "" },
        teachingPlan: course.teachingPlan,
        coStatements: cos.map(c => c.description),
        courseOutcomes: cos.map(c => ({ id: c.coNumber, desc: c.description, bloom: c.bloomLevel || "Apply" })),
        copoMap,
        students: students.map(s => ({ id: s.rollNumber, roll: s.rollNumber, rollNo: s.rollNumber, name: s.name })),
        exams: exams,
        marks: marks,
        feedbackEntries: feedback.map(f => ({ studentRoll: f.student.rollNumber, co: f.courseOutcome.coNumber, rating: f.rating })),
        programOutcomes: pos.map(p => ({ id: p.poId, desc: p.description })),
        papers: papers.map(p => ({
            id: p.id,
            title: p.title,
            type: p.type,
            totalMarks: p.totalMarks,
            date: p.date,
            duration: p.duration,
            sections: p.questions.reduce((acc, q) => {
                let sec = acc.find(s => s.name === q.section);
                if (!sec) {
                    sec = { name: q.section || "Section A", marks: 0, questions: [] };
                    acc.push(sec);
                }
                sec.questions.push({ id: q.id, q: q.questionText, marks: q.marks, type: q.type, co: q.courseOutcome?.coNumber || "" });
                sec.marks += q.marks;
                return acc;
            }, [])
        })),
        targetPct: 60,
        directWeight: 80,
        indirectWeight: 20,
    };
}

module.exports = {
    prisma,
    getAllFaculty, createFaculty, getFacultyById,
    getAllPOs, upsertPO,
    getAllCourses, getCourseById, upsertCourse, deleteCourse,
    getCOsForCourse, upsertCO, deleteCOsForCourse,
    getCopoMapForCourse, bulkSaveCopoMap,
    getAllStudents, getStudentsForCourse, upsertStudent, enrollStudent, bulkEnrollStudents,
    getExamsForCourse, createExam, updateExam, deleteExam,
    addQuestion,
    getQuestionPapersForCourse, createQuestionPaper, updateQuestionPaper, deleteQuestionPaper,
    getMarksForCourse, saveMark,
    getFeedbackForCourse, saveFeedback,
    syncFullState, getFullState,
    // Authentication & Administration
    loginUser: async (email, password) => {
        const u = await prisma.user.findUnique({ where: { email } });
        if (u && u.password === password) {
            return { ok: true, user: { email: u.email, role: u.role, name: u.name } };
        }
        return { ok: false, error: "Incorrect email or password." };
    },
    adminUpdatePassword: async (email, newPass, updaterRole) => {
        if (updaterRole !== "admin") throw new Error("Unauthorized. Password changes are restricted to administrators.");
        return prisma.user.update({
            where: { email },
            data: { password: newPass }
        });
    },
    ensureAdminUser: async () => {
        // Default admin: admin@teachflow.com / password
        const count = await prisma.user.count({ where: { role: "admin" } });
        if (count === 0) {
            await prisma.user.create({
                data: { email: "admin@teachflow.com", password: "password", role: "admin", name: "Administrator" }
            });
        }
    }
};

