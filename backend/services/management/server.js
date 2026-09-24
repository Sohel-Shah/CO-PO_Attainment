const express = require("express");
const cors = require("cors");
const prisma = require("../../shared/database");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const { verifyToken } = require("../../shared/auth");
const { z } = require("zod");

app.use("/api", verifyToken);

// Payload validation schema
const syncPayloadSchema = z.object({
    course: z.object({
        courseId: z.string(),
        name: z.string().optional().nullable(),
        code: z.string().optional().nullable(),
        academicYear: z.string().optional().nullable(),
        semester: z.string().optional().nullable(),
        misNumber: z.string().optional().nullable(),
        department: z.string().optional().nullable(),
        programName: z.string().optional().nullable(),
        credits: z.union([z.string(), z.number()]).optional().nullable(),
        lectureHrs: z.union([z.string(), z.number()]).optional().nullable(),
        tutorialHrs: z.union([z.string(), z.number()]).optional().nullable(),
        practicalHrs: z.union([z.string(), z.number()]).optional().nullable(),
        selfStudyHrs: z.union([z.string(), z.number()]).optional().nullable(),
        coTargetPct: z.union([z.string(), z.number()]).optional().nullable(),
        directWeight: z.union([z.string(), z.number()]).optional().nullable(),
        indirectWeight: z.union([z.string(), z.number()]).optional().nullable(),
        faculty: z.string().optional().nullable()
    }).passthrough(),
    teachingPlan: z.any().optional(),
    courseOutcomes: z.array(z.any()).optional(),
    coStatements: z.array(z.string()).optional(),
    copoMap: z.record(z.any()).optional(),
    students: z.array(z.any()).optional(),
    exams: z.array(z.any()).optional(),
    papers: z.array(z.any()).optional(),
    marks: z.record(z.any()).optional(),
    attendance: z.record(z.any()).optional(),
    feedback: z.array(z.any()).optional(),
    selectedExamType: z.string().optional()
}).passthrough();

// ── Aggregator Logic ──
async function getFullState(courseId) {
    const course = await prisma.course.findUnique({
        where: { courseId },
        include: {
            faculty: true,
            courseAccesses: true,
            courseOutcomes: { include: { copoMappings: { include: { po: true } } } },
            exams: { include: { questions: { include: { courseOutcome: true } } } }
        },
    });
    if (!course) return null;

    const cos = course.courseOutcomes;

    // Sort COs sequentially (CO1, CO2, CO3...) rather than lexicographically or insertion order
    cos.sort((a, b) => {
        const numA = parseInt(a.coNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.coNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
    });
    const pos = await prisma.pO.findMany();

    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: course.id },
        include: { student: true },
        orderBy: { student: { rollNumber: "asc" } },
    });
    const students = enrollments.map(e => e.student);

    const exams = await prisma.exam.findMany({
        where: { courseId: course.id },
        include: { questions: { include: { courseOutcome: true } } },
        orderBy: { createdAt: "asc" },
    });

    const papers = await prisma.questionPaper.findMany({
        where: { courseId: course.id },
        include: {
            questions: {
                orderBy: { createdAt: "asc" },
                include: { courseOutcome: true }
            }
        }
    });

    const qIds = exams.flatMap(e => e.questions.map(q => q.id));
    const marks = await prisma.mark.findMany({
        where: { questionId: { in: qIds } },
        include: { student: true, question: { include: { exam: true } } },
    });

    const attendance = await prisma.attendance.findMany({
        where: { courseId: course.id }
    });
    const attendMap = {};
    attendance.forEach(a => {
        const student = students.find(s => s.id === a.studentId);
        const roll = student?.rollNumber || a.studentId;
        if (!attendMap[a.key]) attendMap[a.key] = {};
        attendMap[a.key][roll] = a.status;
    });

    const feedbacks = await prisma.feedback.findMany({
        where: {
            OR: [
                { courseOutcomeId: { in: cos.map(c => c.id) } },
                { studentId: { in: students.map(s => s.id) } },
                { courseOutcomeId: null }
            ]
        },
        include: { student: true, courseOutcome: true }
    });

    const copoMap = {};
    cos.forEach(co => {
        copoMap[co.coNumber] = {};
        co.copoMappings.forEach(m => {
            copoMap[co.coNumber][m.po.poId] = m.correlationLevel;
        });
    });

    return {
        course: {
            courseId: course.courseId,
            name: course.name,
            code: course.code,
            courseType: course.courseType,
            department: course.department,
            semester: course.semester,
            credits: course.credits,
            L: course.lectureHrs,
            T: course.tutorialHrs,
            P: course.practicalHrs,
            S: course.selfStudyHrs,
            academicYear: course.academicYear,
            programName: course.programName,
            misNumber: course.misNumber,
            faculty: course.faculty?.name || "",
            coTargetPct: course.coTargetPct ?? 60,
            directWeight: course.directWeight ?? 80,
            indirectWeight: course.indirectWeight ?? 20,
            courseAccesses: course.courseAccesses || []
        },
        teachingPlan: {
            teachingPlan: course.teachingPlan,
            units: course.units,
            pedagogyTools: course.pedagogyTools,
            references: course.references,
            settings: course.settings
        },
        coStatements: cos.map(c => c.description),
        courseOutcomes: cos.map(c => ({ id: c.coNumber, desc: c.description, bloom: c.bloomLevel || "Apply" })),
        copoMap,
        students: students.map(s => ({
            id: s.rollNumber,
            roll: s.rollNumber,
            rollNo: s.rollNumber,
            misNumber: s.misNumber,
            name: s.name,
            year: s.batchYear,
            email: s.email,
            mobile: s.mobile,
            semester: s.semester,
            academicYear: s.academicYear
        })),
        exams: exams.map(e => ({
            id: e.id,
            type: e.type,
            title: e.title,
            totalMarks: e.totalMarks,
            duration: e.duration,
            date: e.date ? e.date.toISOString().split('T')[0] : null,
            questions: e.questions.map(q => ({ id: q.id, q: q.label || "", subQuestion: q.subQuestion || "", questionText: q.questionText || "", marks: q.maxMarks, co: q.courseOutcome?.coNumber || "", bloom: q.bloomLevel || "" }))
        })),
        marks: marks.map(m => {
            const matchingPaperQ = papers
                .flatMap(p => p.questions || [])
                .find(pq => pq.questionText === m.question?.questionText || pq.questionText === m.question?.label || (m.question?.questionText && pq.questionText?.includes(m.question.questionText)));
            return {
                ...m,
                paperQuestionId: matchingPaperQ ? matchingPaperQ.id : null
            };
        }),
        results: students.map(s => {
            const stuMarks = marks.filter(m => m.studentId === s.id || m.student?.rollNumber === s.rollNumber);
            const internal = stuMarks.filter(m => {
                const t = (m.question?.exam?.type || m.question?.exam?.title || "").toUpperCase();
                return t === "INTERNAL" || ["T1", "T2", "T3"].some(k => t.includes(k));
            }).reduce((acc, m) => acc + (m.marksObtained || 0), 0);
            const mid = stuMarks.filter(m => {
                const t = (m.question?.exam?.type || m.question?.exam?.title || "").toUpperCase();
                return t.includes("MID") || t.includes("MSE");
            }).reduce((acc, m) => acc + (m.marksObtained || 0), 0);
            const end = stuMarks.filter(m => {
                const t = (m.question?.exam?.type || m.question?.exam?.title || "").toUpperCase();
                return t.includes("END") || t.includes("ESE") || t.includes("ASSIGNMENT");
            }).reduce((acc, m) => acc + (m.marksObtained || 0), 0);
            return { studentId: s.rollNumber, id: s.rollNumber, rollNo: s.rollNumber, name: s.name, internal, midterm: mid, ese: end, assignment: end, total: internal + mid + end };
        }),
        attendance: attendMap,
        feedback: feedbacks.map(f => ({
            id: f.id,
            text: f.text,
            rating: f.rating,
            category: f.category,
            date: f.createdAt.toISOString().split('T')[0],
            anonymous: !f.studentId,
            studentId: f.student?.rollNumber || f.text || "Anonymous",
            respondent: f.student?.rollNumber || f.text || "Anonymous",
            co: f.courseOutcome?.coNumber || ""
        })),
        programOutcomes: pos.map(p => ({ id: p.poId, desc: p.description })),
        papers: papers.map(p => ({
            id: p.id, title: p.title, type: p.type, totalMarks: p.totalMarks, date: p.date, duration: p.duration,
            questions: p.questions.map(q => ({
                id: q.id,
                q: q.label !== null && q.label !== undefined ? q.label : (q.questionText || ""),
                subQuestion: q.subQuestion || "",
                questionText: q.questionText || "",
                marks: q.marks,
                co: q.courseOutcome?.coNumber || "",
                bloom: q.bloomLevel || ""
            })),
            sections: p.questions.reduce((acc, q) => {
                let sec = acc.find(s => s.name === q.section);
                if (!sec) {
                    sec = { name: q.section || "Section A", marks: 0, questions: [] };
                    acc.push(sec);
                }
                sec.questions.push({ id: q.id, q: q.label !== null && q.label !== undefined ? q.label : (q.questionText || ""), subQuestion: q.subQuestion || "", questionText: q.questionText || "", marks: q.marks, type: q.type, co: q.courseOutcome?.coNumber || "", bloom: q.bloomLevel || "" });
                sec.marks += q.marks;
                return acc;
            }, [])
        })),
        targetPct: course.coTargetPct ?? 60,
        directWeight: course.directWeight ?? 80,
        indirectWeight: course.indirectWeight ?? 20,
    };
}

// ── State Endpoints ──
app.get("/api/v2/courses/:courseId/state", async (req, res) => {
    try {
        const state = await getFullState(req.params.courseId);
        state ? res.json(state) : res.status(404).json({ error: "Course not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/state/:key", async (req, res) => {
    try {
        const state = await getFullState(req.params.key);
        state ? res.json({ value: state }) : res.status(404).json({ error: "Not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Utility to check if string is UUID
const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

app.get("/api/v2/students", async (req, res) => {
    try {
        const students = await prisma.student.findMany({
            orderBy: { rollNumber: "asc" }
        });
        res.json({
            students: students.map(s => ({
                id: s.id,
                roll: s.rollNumber,
                name: s.name,
                semester: s.semester || "1",
                acadYear: s.academicYear || s.batchYear || "2026-27",
                mobile: s.mobile
            }))
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/v2/students/bulk", async (req, res) => {
    try {
        const { students } = req.body;
        if (Array.isArray(students)) {
            // Validation step
            for (let i = 0; i < students.length; i++) {
                const s = students[i];
                const roll = String(s.roll || s.rollNo || s.rollNumber || s.id);
                const name = String(s.name || "");
                if (!roll) continue;

                const rollHasNumber = /[0-9]/.test(roll);
                const nameHasNumber = /[0-9]/.test(name);

                if (!rollHasNumber && nameHasNumber) {
                    return res.status(400).json({ error: `Validation Error at student ${i + 1}: Roll Number and Name appear swapped. Roll: "${roll}", Name: "${name}"` });
                }

                if (!/^[A-Za-z0-9-]+$/.test(roll) || !rollHasNumber) {
                    return res.status(400).json({ error: `Validation Error at student ${i + 1}: Invalid Roll Number "${roll}". Must contain numbers and no spaces.` });
                }

                if (nameHasNumber) {
                    return res.status(400).json({ error: `Validation Error at student ${i + 1}: Invalid Name "${name}". Name should not contain numbers.` });
                }
            }

            for (const s of students) {
                const roll = String(s.roll || s.rollNo || s.rollNumber || s.id);
                if (!roll) continue;
                await prisma.student.upsert({
                    where: { rollNumber: roll },
                    update: {
                        name: s.name,
                        batchYear: s.acadYear || s.batchYear || s.academicYear,
                        mobile: s.mobile || s.phone,
                        semester: s.semester,
                        academicYear: s.academicYear || s.acadYear
                    },
                    create: {
                        rollNumber: roll,
                        name: s.name,
                        batchYear: s.acadYear || s.batchYear || s.academicYear,
                        mobile: s.mobile || s.phone,
                        semester: s.semester,
                        academicYear: s.academicYear || s.acadYear
                    }
                });
            }
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});
async function resolveExamQuestionId(qId, courseRecord) {
    if (isUUID(qId)) {
        let question = await prisma.question.findUnique({ where: { id: qId }, include: { exam: true } });
        if (question) return { dbQId: question.id, question };

        const paperQ = await prisma.questionPaperQuestion.findUnique({ where: { id: qId }, include: { paper: true } });
        if (paperQ) {
            question = await prisma.question.findFirst({
                where: {
                    AND: [
                        { exam: { courseId: courseRecord.id } },
                        {
                            OR: [
                                { questionText: { equals: paperQ.questionText, mode: 'insensitive' } },
                                { label: { equals: paperQ.questionText, mode: 'insensitive' } }
                            ].filter(Boolean)
                        }
                    ]
                },
                include: { exam: true }
            });
            if (!question && paperQ.paper) {
                const exam = await prisma.exam.findFirst({
                    where: { courseId: courseRecord.id, type: paperQ.paper.type }
                });
                if (exam) {
                    question = await prisma.question.create({
                        data: {
                            examId: exam.id,
                            label: paperQ.section ? `${paperQ.section}-${paperQ.questionText.slice(0, 10)}` : "Q",
                            questionText: paperQ.questionText,
                            maxMarks: paperQ.marks || 0,
                            courseOutcomeId: paperQ.courseOutcomeId
                        },
                        include: { exam: true }
                    });
                }
            }
            if (question) return { dbQId: question.id, question };
        }
    }

    const match = String(qId).match(/(\d+)$/);
    const indexLabel = match ? `Q${match[1]}` : undefined;
    const question = await prisma.question.findFirst({
        where: {
            AND: [
                { exam: { courseId: courseRecord.id } },
                {
                    OR: [
                        { label: { equals: String(qId), mode: 'insensitive' } },
                        indexLabel ? { label: { equals: indexLabel, mode: 'insensitive' } } : undefined,
                        { label: { equals: String(qId).replace(/^q/i, 'Question '), mode: 'insensitive' } },
                        { label: { equals: String(qId).replace(/^q/i, 'Q'), mode: 'insensitive' } },
                        { label: { equals: `Q${qId}`, mode: 'insensitive' } },
                        { questionText: { equals: String(qId), mode: 'insensitive' } },
                        { questionText: { contains: String(qId), mode: 'insensitive' } }
                    ].filter(Boolean)
                }
            ]
        },
        include: { exam: true }
    });
    if (question) return { dbQId: question.id, question };
    return { dbQId: null, question: null };
}

app.post("/api/v2/sync-full", async (req, res) => {
    try {
        const payload = syncPayloadSchema.parse(req.body);
        const { course, coStatements, copoMap, students, exams, papers, marks, attendance, feedback } = payload;
        if (!course?.courseId) return res.status(400).json({ error: "courseId required" });

        // Authorization check: Verify if the user owns the course
        const existingCourse = await prisma.course.findUnique({ 
            where: { courseId: course.courseId }, 
            include: { courseAccesses: true } 
        });
        
        if (existingCourse && req.user && req.user.role !== "admin") {
            const hasAccess = existingCourse.courseAccesses.some(
                access => access.userId === req.user.id && access.accessLevel === "owner"
            );
            if (!hasAccess) {
                return res.status(403).json({ error: "Unauthorized: You do not have owner permission to modify this course." });
            }
        }

        const coursePlan = payload.teachingPlan || {};

        let facultyRecordId = undefined;
        if (course.faculty) {
            let f = await prisma.faculty.findFirst({ where: { name: course.faculty } });
            if (!f) f = await prisma.faculty.create({ data: { name: course.faculty } });
            facultyRecordId = f.id;
        }

        const courseRecord = await prisma.course.upsert({
            where: { courseId: course.courseId },
            update: {
                name: course.name,
                code: course.code,
                courseType: course.courseType !== undefined ? course.courseType : undefined,
                teachingPlan: coursePlan.teachingPlan,
                units: coursePlan.units,
                pedagogyTools: coursePlan.pedagogyTools,
                references: coursePlan.references,
                settings: coursePlan.settings,
                academicYear: course.academicYear,
                semester: course.semester,
                misNumber: course.misNumber,
                department: course.department,
                programName: course.programName,
                credits: course.credits !== undefined ? Number(course.credits) : undefined,
                lectureHrs: course.lectureHrs !== undefined ? Number(course.lectureHrs) : undefined,
                tutorialHrs: course.tutorialHrs !== undefined ? Number(course.tutorialHrs) : undefined,
                practicalHrs: course.practicalHrs !== undefined ? Number(course.practicalHrs) : undefined,
                selfStudyHrs: course.selfStudyHrs !== undefined ? Number(course.selfStudyHrs) : undefined,
                coTargetPct: course.coTargetPct !== undefined ? Number(course.coTargetPct) : undefined,
                directWeight: course.directWeight !== undefined ? Number(course.directWeight) : undefined,
                indirectWeight: course.indirectWeight !== undefined ? Number(course.indirectWeight) : undefined,
                facultyId: course.faculty ? (await prisma.faculty.findFirst({ where: { name: course.faculty } }))?.id : undefined
            },
            create: {
                courseId: course.courseId,
                name: course.name,
                code: course.code,
                courseType: course.courseType !== undefined ? course.courseType : "PCC",
                teachingPlan: payload.teachingPlan,
                academicYear: course.academicYear,
                semester: course.semester,
                misNumber: course.misNumber,
                department: course.department,
                programName: course.programName,
                credits: course.credits !== undefined ? Number(course.credits) : undefined,
                lectureHrs: course.lectureHrs !== undefined ? Number(course.lectureHrs) : undefined,
                tutorialHrs: course.tutorialHrs !== undefined ? Number(course.tutorialHrs) : undefined,
                practicalHrs: course.practicalHrs !== undefined ? Number(course.practicalHrs) : undefined,
                selfStudyHrs: course.selfStudyHrs !== undefined ? Number(course.selfStudyHrs) : undefined,
                coTargetPct: course.coTargetPct !== undefined ? Number(course.coTargetPct) : 60,
                directWeight: course.directWeight !== undefined ? Number(course.directWeight) : 80,
                indirectWeight: course.indirectWeight !== undefined ? Number(course.indirectWeight) : 20,
                facultyId: course.faculty ? (await prisma.faculty.findFirst({ where: { name: course.faculty } }))?.id : undefined
            }
        });

        if (Array.isArray(payload.courseOutcomes)) {
            for (const co of payload.courseOutcomes) {
                const coNumber = co.id || co.coNumber;
                const description = co.desc || co.description;
                const bloomLevel = co.bloom || co.bloomLevel || "Apply";
                if (coNumber && description) {
                    await prisma.courseOutcome.upsert({
                        where: { courseId_coNumber: { courseId: courseRecord.id, coNumber } },
                        update: { description, bloomLevel },
                        create: { courseId: courseRecord.id, coNumber, description, bloomLevel }
                    });
                }
            }
        } else if (Array.isArray(coStatements)) {
            for (let i = 0; i < coStatements.length; i++) {
                if (coStatements[i]) {
                    await prisma.courseOutcome.upsert({
                        where: { courseId_coNumber: { courseId: courseRecord.id, coNumber: `CO${i + 1}` } },
                        update: { description: coStatements[i] },
                        create: { courseId: courseRecord.id, coNumber: `CO${i + 1}`, description: coStatements[i], bloomLevel: "Apply" }
                    });
                }
            }
        }

        if (copoMap && typeof copoMap === "object") {
            const cos = await prisma.courseOutcome.findMany({ where: { courseId: courseRecord.id } });
            const pos = await prisma.pO.findMany();
            const poLookup = Object.fromEntries(pos.map(p => [p.poId, p.id]));
            const coLookup = Object.fromEntries(cos.map(c => [c.coNumber, c.id]));
            for (const [coNum, poLevels] of Object.entries(copoMap)) {
                const coDbId = coLookup[coNum];
                if (!coDbId) continue;
                for (const [poId, level] of Object.entries(poLevels)) {
                    const poDbId = poLookup[poId];
                    if (poDbId) {
                        await prisma.cOPOMapping.upsert({
                            where: { courseOutcomeId_poId: { courseOutcomeId: coDbId, poId: poDbId } },
                            update: { correlationLevel: Number(level) },
                            create: { courseOutcomeId: coDbId, poId: poDbId, correlationLevel: Number(level) }
                        });
                    }
                }
            }
        }

        if (Array.isArray(students)) {
            // Validation step
            for (let i = 0; i < students.length; i++) {
                const s = students[i];
                const roll = String(s.roll || s.rollNo || s.rollNumber || s.id);
                const name = String(s.name || "");
                if (!roll) continue;

                const rollHasNumber = /[0-9]/.test(roll);
                const nameHasNumber = /[0-9]/.test(name);

                if (!rollHasNumber && nameHasNumber) {
                    return res.status(400).json({ error: `Validation Error at student ${i + 1}: Roll Number and Name appear swapped. Roll: "${roll}", Name: "${name}"` });
                }

                if (!/^[A-Za-z0-9-]+$/.test(roll) || !rollHasNumber) {
                    return res.status(400).json({ error: `Validation Error at student ${i + 1}: Invalid Roll Number "${roll}". Must contain numbers and no spaces.` });
                }

                if (nameHasNumber) {
                    return res.status(400).json({ error: `Validation Error at student ${i + 1}: Invalid Name "${name}". Name should not contain numbers.` });
                }
            }

            // Identify all incoming roll numbers to determine who should remain enrolled
            const incomingRolls = students.map(s => String(s.roll || s.rollNo || s.rollNumber || s.id)).filter(Boolean);

            // Remove enrollments for students NOT in the incoming list for this specific course
            // This ensures that when a student is removed from the registry on the frontend,
            // they are also removed from the course enrollment in the database.
            await prisma.enrollment.deleteMany({
                where: {
                    courseId: courseRecord.id,
                    student: {
                        rollNumber: {
                            notIn: incomingRolls
                        }
                    }
                }
            });

            // Clean up marks for students who are no longer enrolled in this course
            const courseExams = await prisma.exam.findMany({ where: { courseId: courseRecord.id } });
            const courseQIds = (await prisma.question.findMany({
                where: { examId: { in: courseExams.map(e => e.id) } }
            })).map(q => q.id);

            if (courseQIds.length > 0) {
                await prisma.mark.deleteMany({
                    where: {
                        questionId: { in: courseQIds },
                        student: {
                            rollNumber: { notIn: incomingRolls }
                        }
                    }
                });
            }

            // Clean up attendance for students who are no longer enrolled
            await prisma.attendance.deleteMany({
                where: {
                    courseId: courseRecord.id,
                    student: {
                        rollNumber: { notIn: incomingRolls }
                    }
                }
            });

            for (const s of students) {
                const roll = String(s.misNo || s.mis || s.roll || s.rollNo || s.rollNumber || s.id);
                if (!roll) continue;
                const student = await prisma.student.upsert({
                    where: { rollNumber: roll },
                    update: {
                        name: s.name,
                        email: s.email || undefined,
                        batchYear: s.batchYear || s.admission || s.admissionYear || s.year || undefined,
                        misNumber: s.misNumber || s.misNo || s.mis || s.rollNo || s.roll || undefined,
                        mobile: s.mobile || s.phone || undefined,
                        semester: s.semester || undefined,
                        academicYear: s.academicYear || s.acadYear || undefined
                    },
                    create: {
                        rollNumber: roll,
                        name: s.name,
                        email: s.email || undefined,
                        batchYear: s.batchYear || s.admission || s.admissionYear || s.year || undefined,
                        misNumber: s.misNumber || s.misNo || s.mis || s.rollNo || s.roll || undefined,
                        mobile: s.mobile || s.phone || undefined,
                        semester: s.semester || undefined,
                        academicYear: s.academicYear || s.acadYear || undefined
                    }
                });
                await prisma.enrollment.upsert({
                    where: { studentId_courseId: { studentId: student.id, courseId: courseRecord.id } },
                    update: {},
                    create: { studentId: student.id, courseId: courseRecord.id }
                });
            }
        }

        if (Array.isArray(exams)) {
            const processedExamIds = [];
            for (const ex of exams) {
                let existingExam = isUUID(ex.id) ? await prisma.exam.findUnique({ where: { id: ex.id } }) : null;
                if (!existingExam) {
                    existingExam = await prisma.exam.findFirst({
                        where: { courseId: courseRecord.id, type: ex.type || "Internal", title: ex.title || ex.name }
                    });
                }

                const exDate = ex.date ? new Date(ex.date) : null;
                const isValidDate = exDate && !isNaN(exDate.getTime());

                if (existingExam) {
                    await prisma.exam.update({
                        where: { id: existingExam.id },
                        data: {
                            title: ex.title || ex.name,
                            totalMarks: Number(ex.totalMarks || 20),
                            duration: ex.duration || undefined,
                            date: isValidDate ? exDate : undefined,
                            academicYear: courseRecord.academicYear,
                            misNumber: courseRecord.misNumber
                        }
                    });
                } else {
                    await prisma.exam.create({
                        data: {
                            id: isUUID(ex.id) ? ex.id : undefined,
                            courseId: courseRecord.id,
                            title: ex.title || ex.name,
                            totalMarks: Number(ex.totalMarks || 20),
                            type: ex.type || "Internal",
                            duration: ex.duration || undefined,
                            date: isValidDate ? exDate : undefined,
                            academicYear: courseRecord.academicYear,
                            misNumber: courseRecord.misNumber
                        }
                    });
                }
                const exam = await prisma.exam.findFirst({ where: { courseId: courseRecord.id, type: ex.type || "Internal", title: ex.title || ex.name } });
                if (exam) {
                    processedExamIds.push(exam.id);
                }

                if (Array.isArray(ex.questions)) {
                    for (const q of ex.questions) {
                        let existingQ = isUUID(q.id) ? await prisma.question.findUnique({ where: { id: q.id } }) : null;
                        if (!existingQ) {
                            existingQ = await prisma.question.findFirst({
                                where: { label: q.q, examId: exam.id }
                            });
                        }

                        if (existingQ) {
                            await prisma.question.update({
                                where: { id: existingQ.id },
                                data: {
                                    questionText: q.q,
                                    maxMarks: Number(q.marks || q.maxMarks || 0),
                                    label: q.q,
                                    courseOutcomeId: q.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: q.co, courseId: courseRecord.id } }))?.id : undefined
                                }
                            });
                            // Sync the courseOutcomeId in marks
                            const updatedQ = await prisma.question.findUnique({ where: { id: existingQ.id } });
                            if (updatedQ?.courseOutcomeId) {
                                await prisma.mark.updateMany({
                                    where: { questionId: existingQ.id },
                                    data: { courseOutcomeId: updatedQ.courseOutcomeId }
                                });
                            }
                        } else {
                            await prisma.question.create({
                                data: {
                                    id: isUUID(q.id) ? q.id : undefined,
                                    questionText: q.q,
                                    maxMarks: Number(q.marks || q.maxMarks || 0),
                                    label: q.q,
                                    examId: exam.id,
                                    courseOutcomeId: q.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: q.co, courseId: courseRecord.id } }))?.id : undefined
                                }
                            });
                        }
                    }
                }
            }
        }

        if (attendance && typeof attendance === "object") {
            for (const [key, studentsAtt] of Object.entries(attendance)) {
                for (const [roll, status] of Object.entries(studentsAtt)) {
                    const student = await prisma.student.findUnique({ where: { rollNumber: roll } });
                    if (!student) continue;
                    await prisma.attendance.upsert({
                        where: { studentId_courseId_key: { studentId: student.id, courseId: courseRecord.id, key: String(key) } },
                        update: { status: String(status) },
                        create: { studentId: student.id, courseId: courseRecord.id, key: String(key), status: String(status) }
                    });
                }
            }
        }

        if (Array.isArray(feedback)) {
            for (const fb of feedback) {
                const respondentStr = String(fb.studentId || fb.respondent || fb.text || "Anonymous");
                const student = !fb.anonymous ? await prisma.student.findUnique({ where: { rollNumber: String(fb.roll || fb.studentRoll || fb.studentId) } }) : null;
                const studentId = student ? student.id : null;
                const coId = fb.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: fb.co, courseId: courseRecord.id } }))?.id : null;
                const rating = Number(fb.rating);
                if (isNaN(rating) && fb.rating !== "") continue;

                let existing = null;
                if (isUUID(fb.id)) {
                    existing = await prisma.feedback.findUnique({ where: { id: fb.id } });
                }
                if (!existing && coId) {
                    existing = await prisma.feedback.findFirst({
                        where: {
                            courseOutcomeId: coId,
                            OR: [
                                studentId ? { studentId: studentId } : undefined,
                                { text: respondentStr }
                            ].filter(Boolean)
                        }
                    });
                }

                if (existing) {
                    await prisma.feedback.update({
                        where: { id: existing.id },
                        data: { text: respondentStr, rating: isNaN(rating) ? 0 : rating, category: fb.category || "CourseExit", studentId, courseOutcomeId: coId }
                    });
                } else if (!isNaN(rating) && fb.rating !== "") {
                    await prisma.feedback.create({
                        data: { text: respondentStr, rating: rating, category: fb.category || "CourseExit", studentId, courseOutcomeId: coId }
                    });
                }
            }
        }

        // ── SYNC PAPERS ──
        if (Array.isArray(papers)) {
            for (const p of papers) {
                let existingPaper = isUUID(p.id) ? await prisma.questionPaper.findUnique({ where: { id: p.id } }) : null;
                if (!existingPaper) {
                    existingPaper = await prisma.questionPaper.findFirst({
                        where: { courseId: courseRecord.id, type: p.type || "Internal", title: p.title || "Question Paper" }
                    });
                }

                if (existingPaper) {
                    await prisma.questionPaper.update({
                        where: { id: existingPaper.id },
                        data: {
                            title: p.title,
                            type: p.type,
                            totalMarks: Number(p.totalMarks || 0),
                            date: p.date,
                            duration: p.duration
                        }
                    });
                } else {
                    await prisma.questionPaper.create({
                        data: {
                            id: isUUID(p.id) ? p.id : undefined,
                            courseId: courseRecord.id,
                            title: p.title || "Question Paper",
                            type: p.type || "Internal",
                            totalMarks: Number(p.totalMarks || 0),
                            date: p.date,
                            duration: p.duration
                        }
                    });
                }
                const paper = await prisma.questionPaper.findFirst({ where: { courseId: courseRecord.id, type: p.type || "Internal", title: p.title || "Question Paper" } });

                // Sync questions for this paper
                let questionsToSync = [];
                if (Array.isArray(p.questions)) {
                    questionsToSync = p.questions;
                } else if (Array.isArray(p.sections)) {
                    questionsToSync = p.sections.flatMap(sec =>
                        (sec.questions || []).map(q => ({ ...q, section: sec.name || q.section }))
                    );
                }

                if (questionsToSync.length > 0) {
                    // Simple approach: clear and recreate paper questions to ensure sync
                    // Alternative: Upsert based on some criteria. 
                    // Clear is safer for "Paper Setting" UI which is usually a single document.
                    await prisma.questionPaperQuestion.deleteMany({ where: { paperId: paper.id } });

                    let idx = 0;
                    for (const q of questionsToSync) {
                        const coId = q.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: q.co, courseId: courseRecord.id } }))?.id : null;
                        await prisma.questionPaperQuestion.create({
                            data: {
                                paperId: paper.id,
                                section: q.section || "Section A",
                                label: q.q !== null && q.q !== undefined ? q.q : (q.label || null),
                                subQuestion: q.subQuestion || null,
                                questionText: q.questionText || q.text || "",
                                bloomLevel: q.bloom || q.bloomLevel || null,
                                marks: Number(q.marks || 0),
                                type: q.type || "short",
                                courseOutcomeId: coId,
                                createdAt: new Date(Date.now() + idx * 10)
                            }
                        });
                        idx++;

                        // ── Mirror to Exam Questions (Crucial for Mark Entry) ──
                        const associatedExam = await prisma.exam.findFirst({
                            where: { courseId: courseRecord.id, type: paper.type }
                        });

                        if (associatedExam) {
                            const activeLabels = questionsToSync.map((q, qidx) => q.label || q.q || `Q${qidx + 1}`);
                            // Delete exam questions that are no longer present in the paper
                            await prisma.question.deleteMany({
                                where: {
                                    examId: associatedExam.id,
                                    label: { notIn: activeLabels }
                                }
                            });

                            const label = q.label || q.q || `Q${questionsToSync.indexOf(q) + 1}`;
                            const existingExamQ = await prisma.question.findFirst({
                                where: { examId: associatedExam.id, label: label }
                            });

                            if (existingExamQ) {
                                await prisma.question.update({
                                    where: { id: existingExamQ.id },
                                    data: { subQuestion: q.subQuestion || null, questionText: q.questionText || q.q || q.text || "", maxMarks: Number(q.marks || 0), courseOutcomeId: coId, bloomLevel: q.bloom || q.bloomLevel || null }
                                });
                                // Sync courseOutcomeId in marks
                                if (coId) {
                                    await prisma.mark.updateMany({
                                        where: { questionId: existingExamQ.id },
                                        data: { courseOutcomeId: coId }
                                    });
                                }
                            } else {
                                await prisma.question.create({
                                    data: { examId: associatedExam.id, label: label, subQuestion: q.subQuestion || null, questionText: q.questionText || q.q || q.text || "", maxMarks: Number(q.marks || 0), courseOutcomeId: coId, bloomLevel: q.bloom || q.bloomLevel || null }
                                });
                            }

                            // Update associatedExam's date and duration to match paper
                            const parsedDate = paper.date ? new Date(paper.date) : null;
                            const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
                            await prisma.exam.update({
                                where: { id: associatedExam.id },
                                data: {
                                    date: isValidDate ? parsedDate : undefined,
                                    duration: paper.duration
                                }
                            });
                        }
                    }
                }
            }
        }

        if (marks && typeof marks === "object") {
            console.log(`Syncing marks for ${Object.keys(marks).length} students...`);
            for (const [roll, qMarks] of Object.entries(marks)) {
                // Find student by roll number
                const student = await prisma.student.findUnique({ where: { rollNumber: String(roll) } });
                if (!student) {
                    console.warn(`Student not found for roll: ${roll}`);
                    continue;
                }

                for (const [qId, val] of Object.entries(qMarks)) {
                    if (val === "" || val === null || val === undefined) continue;

                    const { dbQId, question } = await resolveExamQuestionId(qId, courseRecord);

                    if (dbQId && question) {
                        const questionExists = await prisma.question.findUnique({ where: { id: dbQId } });
                        if (questionExists) {
                            await prisma.mark.upsert({
                                where: { studentId_questionId: { studentId: student.id, questionId: dbQId } },
                                update: {
                                    marksObtained: parseFloat(val) || 0,
                                    academicYear: courseRecord.academicYear,
                                    misNumber: courseRecord.misNumber,
                                    examType: question?.exam?.type || "Unknown",
                                    courseOutcomeId: question?.courseOutcomeId
                                },
                                create: {
                                    studentId: student.id,
                                    questionId: dbQId,
                                    marksObtained: parseFloat(val) || 0,
                                    academicYear: courseRecord.academicYear,
                                    misNumber: courseRecord.misNumber,
                                    examType: question?.exam?.type || "Unknown",
                                    courseOutcomeId: question?.courseOutcomeId
                                }
                            });
                        } else {
                            console.warn(`Question record ${dbQId} missing from database for qId: ${qId}. Skipping mark upsert.`);
                        }
                    } else {
                        console.warn(`Question not found for ID/Label: ${qId} in course ${courseRecord.id}`);
                    }
                }
            }
        }

        const newState = await getFullState(course.courseId);
        res.json(newState || { ok: true });
    } catch (e) {
        const fs = require('fs');
        const logMsg = `[${new Date().toISOString()}] Sync error: ${e.message}\n${e.stack}\nPayload: ${JSON.stringify(req.body).slice(0, 1000)}\n\n`;
        fs.appendFileSync('sync_errors.log', logMsg);
        console.error("Sync error:", e);
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});

// --- PARTIAL SYNC ROUTES ---

app.patch("/api/v2/courses/:courseId/details", async (req, res) => {
    try {
        const { courseId } = req.params;
        const payload = req.body;
        console.log("PATCH /details payload for course:", courseId);
        console.log(JSON.stringify(payload.teachingPlan?.settings, null, 2));
        const { course } = payload;
        if (!course) return res.status(400).json({ error: "course data required" });

        const existingCourse = await prisma.course.findUnique({ where: { courseId }, include: { faculty: true } });
        if (existingCourse && existingCourse.faculty && req.user && req.user.role !== "admin") {
            if (existingCourse.faculty.name !== req.user.name && existingCourse.faculty.email !== req.user.email) {
                return res.status(403).json({ error: "Unauthorized" });
            }
        }

        const coursePlan = payload.teachingPlan || {};

        let facultyRecordId = undefined;
        if (course.faculty) {
            let f = await prisma.faculty.findFirst({ where: { name: course.faculty } });
            if (!f) f = await prisma.faculty.create({ data: { name: course.faculty } });
            facultyRecordId = f.id;
        }

        await prisma.course.upsert({
            where: { courseId: courseId },
            update: {
                name: course.name,
                code: course.code,
                courseType: course.courseType !== undefined ? course.courseType : undefined,
                academicYear: course.academicYear,
                semester: course.semester,
                misNumber: course.misNumber,
                department: course.department,
                programName: course.programName,
                credits: course.credits !== undefined ? Number(course.credits) : undefined,
                lectureHrs: course.lectureHrs !== undefined ? Number(course.lectureHrs) : undefined,
                tutorialHrs: course.tutorialHrs !== undefined ? Number(course.tutorialHrs) : undefined,
                practicalHrs: course.practicalHrs !== undefined ? Number(course.practicalHrs) : undefined,
                selfStudyHrs: course.selfStudyHrs !== undefined ? Number(course.selfStudyHrs) : undefined,
                coTargetPct: course.coTargetPct !== undefined ? Number(course.coTargetPct) : undefined,
                directWeight: course.directWeight !== undefined ? Number(course.directWeight) : undefined,
                indirectWeight: course.indirectWeight !== undefined ? Number(course.indirectWeight) : undefined,
                teachingPlan: coursePlan.teachingPlan !== undefined ? coursePlan.teachingPlan : undefined,
                units: coursePlan.units !== undefined ? coursePlan.units : undefined,
                pedagogyTools: coursePlan.pedagogyTools !== undefined ? coursePlan.pedagogyTools : undefined,
                references: coursePlan.references !== undefined ? coursePlan.references : undefined,
                settings: coursePlan.settings !== undefined ? coursePlan.settings : undefined,
                facultyId: facultyRecordId !== undefined ? facultyRecordId : undefined
            },
            create: {
                courseId: courseId,
                name: course.name,
                code: course.code,
                courseType: course.courseType !== undefined ? course.courseType : "PCC",
                academicYear: course.academicYear,
                semester: course.semester,
                misNumber: course.misNumber,
                department: course.department,
                programName: course.programName,
                credits: course.credits !== undefined ? Number(course.credits) : undefined,
                lectureHrs: course.lectureHrs !== undefined ? Number(course.lectureHrs) : undefined,
                tutorialHrs: course.tutorialHrs !== undefined ? Number(course.tutorialHrs) : undefined,
                practicalHrs: course.practicalHrs !== undefined ? Number(course.practicalHrs) : undefined,
                selfStudyHrs: course.selfStudyHrs !== undefined ? Number(course.selfStudyHrs) : undefined,
                coTargetPct: course.coTargetPct !== undefined ? Number(course.coTargetPct) : 60,
                directWeight: course.directWeight !== undefined ? Number(course.directWeight) : 80,
                indirectWeight: course.indirectWeight !== undefined ? Number(course.indirectWeight) : 20,
                teachingPlan: coursePlan.teachingPlan !== undefined ? coursePlan.teachingPlan : null,
                units: coursePlan.units !== undefined ? coursePlan.units : null,
                pedagogyTools: coursePlan.pedagogyTools !== undefined ? coursePlan.pedagogyTools : null,
                references: coursePlan.references !== undefined ? coursePlan.references : null,
                settings: coursePlan.settings !== undefined ? coursePlan.settings : null,
                facultyId: course.faculty ? (await prisma.faculty.findFirst({ where: { name: course.faculty } }))?.id : undefined
            }
        });

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch("/api/v2/courses/:courseId/outcomes", async (req, res) => {
    try {
        const { courseId } = req.params;
        const payload = req.body;
        const { courseOutcomes, coStatements, copoMap } = payload;

        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!courseRecord) return res.status(404).json({ error: "Course not found" });

        if (Array.isArray(courseOutcomes)) {
            for (const co of courseOutcomes) {
                const coNumber = co.id || co.coNumber;
                const description = co.desc || co.description;
                const bloomLevel = co.bloom || co.bloomLevel || "Apply";
                if (coNumber && description) {
                    await prisma.courseOutcome.upsert({
                        where: { courseId_coNumber: { courseId: courseRecord.id, coNumber } },
                        update: { description, bloomLevel },
                        create: { courseId: courseRecord.id, coNumber, description, bloomLevel }
                    });
                }
            }
        } else if (Array.isArray(coStatements)) {
            for (let i = 0; i < coStatements.length; i++) {
                if (coStatements[i]) {
                    await prisma.courseOutcome.upsert({
                        where: { courseId_coNumber: { courseId: courseRecord.id, coNumber: `CO${i + 1}` } },
                        update: { description: coStatements[i] },
                        create: { courseId: courseRecord.id, coNumber: `CO${i + 1}`, description: coStatements[i], bloomLevel: "Apply" }
                    });
                }
            }
        }

        if (copoMap && typeof copoMap === "object") {
            const cos = await prisma.courseOutcome.findMany({ where: { courseId: courseRecord.id } });
            const pos = await prisma.pO.findMany();
            const poLookup = Object.fromEntries(pos.map(p => [p.poId, p.id]));
            const coLookup = Object.fromEntries(cos.map(c => [c.coNumber, c.id]));
            for (const [coNum, poLevels] of Object.entries(copoMap)) {
                const coDbId = coLookup[coNum];
                if (!coDbId) continue;
                for (const [poId, level] of Object.entries(poLevels)) {
                    const poDbId = poLookup[poId];
                    if (poDbId) {
                        await prisma.cOPOMapping.upsert({
                            where: { courseOutcomeId_poId: { courseOutcomeId: coDbId, poId: poDbId } },
                            update: { correlationLevel: Number(level) },
                            create: { courseOutcomeId: coDbId, poId: poDbId, correlationLevel: Number(level) }
                        });
                    }
                }
            }
        }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch("/api/v2/courses/:courseId/students", async (req, res) => {
    console.log("PATCH students called for course", req.params.courseId);
    try {
        const { courseId } = req.params;
        const payload = req.body;
        console.log("Students payload received:", payload.students?.length);
        const { students } = payload;

        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!courseRecord) return res.status(404).json({ error: "Course not found" });

        if (Array.isArray(students)) {
            const incomingRolls = students.map(s => String(s.roll || s.rollNo || s.rollNumber || s.id)).filter(Boolean);

            await prisma.enrollment.deleteMany({
                where: {
                    courseId: courseRecord.id,
                    student: { rollNumber: { notIn: incomingRolls } }
                }
            });

            for (const s of students) {
                const roll = String(s.misNo || s.mis || s.roll || s.rollNo || s.rollNumber || s.id);
                if (!roll) continue;
                const student = await prisma.student.upsert({
                    where: { rollNumber: roll },
                    update: {
                        name: s.name,
                        email: s.email || undefined,
                        batchYear: s.batchYear || s.admission || s.admissionYear || s.year || undefined,
                        misNumber: s.misNumber || s.misNo || s.mis || s.rollNo || s.roll || undefined,
                        mobile: s.mobile || s.phone || undefined,
                        semester: s.semester || undefined,
                        academicYear: s.academicYear || s.acadYear || undefined
                    },
                    create: {
                        rollNumber: roll,
                        name: s.name,
                        email: s.email || undefined,
                        batchYear: s.batchYear || s.admission || s.admissionYear || s.year || undefined,
                        misNumber: s.misNumber || s.misNo || s.mis || s.rollNo || s.roll || undefined,
                        mobile: s.mobile || s.phone || undefined,
                        semester: s.semester || undefined,
                        academicYear: s.academicYear || s.acadYear || undefined
                    }
                });
                await prisma.enrollment.upsert({
                    where: { studentId_courseId: { studentId: student.id, courseId: courseRecord.id } },
                    update: {},
                    create: { studentId: student.id, courseId: courseRecord.id }
                });
            }
        }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch("/api/v2/courses/:courseId/marks", async (req, res) => {
    try {
        const { courseId } = req.params;
        const payload = req.body;
        const { marks, selectedExamType } = payload;

        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!courseRecord) return res.status(404).json({ error: "Course not found" });

        if (marks && typeof marks === "object") {
            for (const [roll, qMarks] of Object.entries(marks)) {
                const student = await prisma.student.findUnique({ where: { rollNumber: String(roll) } });
                if (!student) continue;

                for (const [qId, val] of Object.entries(qMarks)) {
                    if (val === "" || val === null || val === undefined) continue;

                    const { dbQId, question } = await resolveExamQuestionId(qId, courseRecord);

                    if (dbQId && question) {
                        await prisma.mark.upsert({
                            where: { studentId_questionId: { studentId: student.id, questionId: dbQId } },
                            update: {
                                marksObtained: parseFloat(val) || 0,
                                academicYear: courseRecord.academicYear,
                                misNumber: courseRecord.misNumber,
                                examType: question?.exam?.type || "Unknown",
                                courseOutcomeId: question?.courseOutcomeId
                            },
                            create: {
                                studentId: student.id,
                                questionId: dbQId,
                                marksObtained: parseFloat(val) || 0,
                                academicYear: courseRecord.academicYear,
                                misNumber: courseRecord.misNumber,
                                examType: question?.exam?.type || "Unknown",
                                courseOutcomeId: question?.courseOutcomeId
                            }
                        });
                    }
                }
            }
        }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch("/api/v2/courses/:courseId/exams", async (req, res) => {
    try {
        const { courseId } = req.params;
        const payload = req.body;
        const { exams, papers } = payload;

        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!courseRecord) return res.status(404).json({ error: "Course not found" });

        if (Array.isArray(exams)) {
            const processedExamIds = [];
            for (const ex of exams) {
                let existingExam = isUUID(ex.id) ? await prisma.exam.findUnique({ where: { id: ex.id } }) : null;
                if (!existingExam) {
                    existingExam = await prisma.exam.findFirst({
                        where: { courseId: courseRecord.id, type: ex.type || "Internal", title: ex.title || ex.name }
                    });
                }

                const exDate = ex.date ? new Date(ex.date) : null;
                const isValidDate = exDate && !isNaN(exDate.getTime());

                if (existingExam) {
                    await prisma.exam.update({
                        where: { id: existingExam.id },
                        data: {
                            title: ex.title || ex.name,
                            totalMarks: Number(ex.totalMarks || 20),
                            duration: ex.duration || undefined,
                            date: isValidDate ? exDate : undefined,
                            academicYear: courseRecord.academicYear,
                            misNumber: courseRecord.misNumber
                        }
                    });
                } else {
                    await prisma.exam.create({
                        data: {
                            id: isUUID(ex.id) ? ex.id : undefined,
                            courseId: courseRecord.id,
                            title: ex.title || ex.name,
                            totalMarks: Number(ex.totalMarks || 20),
                            type: ex.type || "Internal",
                            duration: ex.duration || undefined,
                            date: isValidDate ? exDate : undefined,
                            academicYear: courseRecord.academicYear,
                            misNumber: courseRecord.misNumber
                        }
                    });
                }
                const exam = await prisma.exam.findFirst({ where: { courseId: courseRecord.id, type: ex.type || "Internal", title: ex.title || ex.name } });
                if (exam) {
                    processedExamIds.push(exam.id);
                }

                if (Array.isArray(ex.questions)) {
                    for (const q of ex.questions) {
                        let existingQ = isUUID(q.id) ? await prisma.question.findUnique({ where: { id: q.id } }) : null;
                        if (!existingQ) {
                            existingQ = await prisma.question.findFirst({
                                where: { label: q.q, examId: exam.id }
                            });
                        }

                        if (existingQ) {
                            await prisma.question.update({
                                where: { id: existingQ.id },
                                data: {
                                    questionText: q.q,
                                    maxMarks: Number(q.marks || q.maxMarks || 0),
                                    label: q.q,
                                    courseOutcomeId: q.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: q.co, courseId: courseRecord.id } }))?.id : undefined
                                }
                            });
                            const updatedQ = await prisma.question.findUnique({ where: { id: existingQ.id } });
                            if (updatedQ?.courseOutcomeId) {
                                await prisma.mark.updateMany({
                                    where: { questionId: existingQ.id },
                                    data: { courseOutcomeId: updatedQ.courseOutcomeId }
                                });
                            }
                        } else {
                            await prisma.question.create({
                                data: {
                                    id: isUUID(q.id) ? q.id : undefined,
                                    questionText: q.q,
                                    maxMarks: Number(q.marks || q.maxMarks || 0),
                                    label: q.q,
                                    examId: exam.id,
                                    courseOutcomeId: q.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: q.co, courseId: courseRecord.id } }))?.id : undefined
                                }
                            });
                        }
                    }
                }
            }

            // Delete exams that were removed from the frontend
            await prisma.exam.deleteMany({
                where: {
                    courseId: courseRecord.id,
                    id: { notIn: processedExamIds }
                }
            });
        }

        if (Array.isArray(papers)) {
            for (const p of papers) {
                let existingPaper = isUUID(p.id) ? await prisma.questionPaper.findUnique({ where: { id: p.id } }) : null;
                if (!existingPaper) {
                    existingPaper = await prisma.questionPaper.findFirst({
                        where: { courseId: courseRecord.id, type: p.type || "Internal", title: p.title || "Question Paper" }
                    });
                }

                if (existingPaper) {
                    await prisma.questionPaper.update({
                        where: { id: existingPaper.id },
                        data: {
                            title: p.title,
                            type: p.type,
                            totalMarks: Number(p.totalMarks || 0),
                            date: p.date,
                            duration: p.duration
                        }
                    });
                } else {
                    await prisma.questionPaper.create({
                        data: {
                            id: isUUID(p.id) ? p.id : undefined,
                            courseId: courseRecord.id,
                            title: p.title || "Question Paper",
                            type: p.type || "Internal",
                            totalMarks: Number(p.totalMarks || 0),
                            date: p.date,
                            duration: p.duration
                        }
                    });
                }
                const paper = await prisma.questionPaper.findFirst({ where: { courseId: courseRecord.id, type: p.type || "Internal", title: p.title || "Question Paper" } });

                let questionsToSync = [];
                if (Array.isArray(p.questions)) {
                    questionsToSync = p.questions;
                } else if (Array.isArray(p.sections)) {
                    questionsToSync = p.sections.flatMap(sec => (sec.questions || []).map(q => ({ ...q, section: sec.name || q.section })));
                }

                if (questionsToSync.length > 0) {
                    await prisma.questionPaperQuestion.deleteMany({ where: { paperId: paper.id } });

                    let idx = 0;
                    for (const q of questionsToSync) {
                        const coId = q.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: q.co, courseId: courseRecord.id } }))?.id : null;
                        await prisma.questionPaperQuestion.create({
                            data: {
                                paperId: paper.id,
                                section: q.section || "Section A",
                                label: q.q !== null && q.q !== undefined ? q.q : (q.label || null),
                                subQuestion: q.subQuestion || null,
                                questionText: q.questionText || q.text || "",
                                bloomLevel: q.bloom || q.bloomLevel || null,
                                marks: Number(q.marks || 0),
                                type: q.type || "short",
                                courseOutcomeId: coId,
                                createdAt: new Date(Date.now() + idx * 10)
                            }
                        });
                        idx++;

                        const associatedExam = await prisma.exam.findFirst({ where: { courseId: courseRecord.id, type: paper.type } });
                        if (associatedExam) {
                            const activeLabels = questionsToSync.map((q, qidx) => q.label || q.q || `Q${qidx + 1}`);
                            await prisma.question.deleteMany({
                                where: { examId: associatedExam.id, label: { notIn: activeLabels } }
                            });

                            const label = q.label || q.q || `Q${questionsToSync.indexOf(q) + 1}`;
                            const existingExamQ = await prisma.question.findFirst({ where: { examId: associatedExam.id, label: label } });

                            if (existingExamQ) {
                                await prisma.question.update({
                                    where: { id: existingExamQ.id },
                                    data: { subQuestion: q.subQuestion || null, questionText: q.questionText || q.q || q.text || "", maxMarks: Number(q.marks || 0), courseOutcomeId: coId, bloomLevel: q.bloom || q.bloomLevel || null }
                                });
                                if (coId) {
                                    await prisma.mark.updateMany({
                                        where: { questionId: existingExamQ.id },
                                        data: { courseOutcomeId: coId }
                                    });
                                }
                            } else {
                                await prisma.question.create({
                                    data: { examId: associatedExam.id, label: label, subQuestion: q.subQuestion || null, questionText: q.questionText || q.q || q.text || "", maxMarks: Number(q.marks || 0), courseOutcomeId: coId, bloomLevel: q.bloom || q.bloomLevel || null }
                                });
                            }

                            const parsedDate = paper.date ? new Date(paper.date) : null;
                            const isValidDate = parsedDate && !isNaN(parsedDate.getTime());
                            await prisma.exam.update({
                                where: { id: associatedExam.id },
                                data: { date: isValidDate ? parsedDate : undefined, duration: paper.duration }
                            });
                        }
                    }
                }
            }
        }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.patch("/api/v2/courses/:courseId/attendance", async (req, res) => {
    try {
        const { courseId } = req.params;
        const payload = req.body;
        const { attendance } = payload;

        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!courseRecord) return res.status(404).json({ error: "Course not found" });

        if (attendance && typeof attendance === "object") {
            for (const [key, studentsAtt] of Object.entries(attendance)) {
                for (const [roll, status] of Object.entries(studentsAtt)) {
                    const student = await prisma.student.findUnique({ where: { rollNumber: roll } });
                    if (!student) continue;
                    await prisma.attendance.upsert({
                        where: { studentId_courseId_key: { studentId: student.id, courseId: courseRecord.id, key: String(key) } },
                        update: { status: String(status) },
                        create: { studentId: student.id, courseId: courseRecord.id, key: String(key), status: String(status) }
                    });
                }
            }
        }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.patch("/api/v2/courses/:courseId/feedback", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { feedback } = req.body;

        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!courseRecord) return res.status(404).json({ error: "Course not found" });

        if (Array.isArray(feedback)) {
            for (const fb of feedback) {
                const respondentStr = String(fb.studentId || fb.respondent || fb.text || "Anonymous");
                const student = !fb.anonymous ? await prisma.student.findUnique({ where: { rollNumber: String(fb.roll || fb.studentRoll || fb.studentId) } }) : null;
                const studentId = student ? student.id : null;
                const coId = fb.co ? (await prisma.courseOutcome.findFirst({ where: { coNumber: fb.co, courseId: courseRecord.id } }))?.id : null;
                const rating = Number(fb.rating);
                if (isNaN(rating) && fb.rating !== "") continue;

                let existing = null;
                if (isUUID(fb.id)) {
                    existing = await prisma.feedback.findUnique({ where: { id: fb.id } });
                }
                if (!existing && coId) {
                    existing = await prisma.feedback.findFirst({
                        where: {
                            courseOutcomeId: coId,
                            OR: [
                                studentId ? { studentId: studentId } : undefined,
                                { text: respondentStr }
                            ].filter(Boolean)
                        }
                    });
                }

                if (existing) {
                    await prisma.feedback.update({
                        where: { id: existing.id },
                        data: { text: respondentStr, rating: isNaN(rating) ? 0 : rating, category: fb.category || "CourseExit", studentId, courseOutcomeId: coId }
                    });
                } else if (!isNaN(rating) && fb.rating !== "") {
                    await prisma.feedback.create({
                        data: { text: respondentStr, rating: rating, category: fb.category || "CourseExit", studentId, courseOutcomeId: coId }
                    });
                }
            }
        }

        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Academic Planner Routes (Admin-only) ──────────────────────────────────

const { isAdmin } = require("../../shared/auth");

// GET /api/v2/academic-planner/faculty — Fetch just the faculty list (public/authenticated)
app.get("/api/v2/academic-planner/faculty", verifyToken, async (req, res) => {
    try {
        const rows = await prisma.$queryRawUnsafe(
            `SELECT faculty FROM academic_plan WHERE department = $1 LIMIT 1`,
            'default'
        );
        if (rows && rows.length > 0 && rows[0].faculty) {
            res.json(rows[0].faculty);
        } else {
            res.json([]);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/v2/academic-planner/categories — Fetch the framework categories (public/authenticated)
app.get("/api/v2/academic-planner/categories", verifyToken, async (req, res) => {
    try {
        const rows = await prisma.$queryRawUnsafe(
            `SELECT framework FROM academic_plan WHERE department = $1 LIMIT 1`,
            'default'
        );
        if (rows && rows.length > 0 && rows[0].framework) {
            const fw = rows[0].framework;
            const ug = fw.ug || [];
            const pg = fw.pg || [];
            
            // Combine and deduplicate by category code
            const map = new Map();
            [...ug, ...pg].forEach(c => {
                if (c.category) map.set(c.category, c.label || c.category);
            });
            
            const categories = Array.from(map.entries()).map(([category, label]) => ({ category, label }));
            res.json(categories);
        } else {
            res.json([]);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/v2/academic-planner  — Fetch the department plan (all authenticated users)
app.get("/api/v2/academic-planner", verifyToken, async (req, res) => {
    try {
        const rows = await prisma.$queryRawUnsafe(
            `SELECT * FROM academic_plan WHERE department = $1 LIMIT 1`,
            'default'
        );
        if (!rows || rows.length === 0) {
            return res.json({
                department: "default",
                academicYears: [],
                versions: [],
                programs: [],
                faculty: [],
                timetable: [],
                framework: null,
                calendar: [],
                exportSettings: null
            });
        }
        const row = rows[0];
        // Prisma creates camelCase columns — parse safely
        const parse = (v) => {
            if (!v) return null;
            if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
            return v;
        };
        res.json({
            department: row.department || "default",
            academicYears:  parse(row.academicYears)  || [],
            versions:       parse(row.versions)        || [],
            programs:       parse(row.programs)        || [],
            faculty:        parse(row.faculty)         || [],
            timetable:      parse(row.timetable)       || [],
            framework:      parse(row.framework)       || null,
            calendar:       parse(row.calendar)        || [],
            exportSettings: parse(row.exportSettings)  || null
        });
    } catch (e) {
        console.error("Academic planner GET error:", e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/v2/academic-planner/set-active-year — Toggle active academic year across the app
app.post("/api/v2/academic-planner/set-active-year", verifyToken, async (req, res) => {
    try {
        const { year, id } = req.body;
        if (!year && !id) return res.status(400).json({ error: "Year or ID required" });

        const rows = await prisma.$queryRawUnsafe(
            `SELECT * FROM academic_plan WHERE department = $1 LIMIT 1`,
            'default'
        );
        let academicYears = [];
        if (rows && rows.length > 0 && rows[0].academicYears) {
            academicYears = typeof rows[0].academicYears === 'string'
                ? JSON.parse(rows[0].academicYears)
                : rows[0].academicYears;
        }

        const normTarget = String(year || id).replace(/[–—]/g, '-').trim();
        let matched = false;
        let updatedYears = (academicYears || []).map(y => {
            const normY = String(y.label || '').replace(/[–—]/g, '-').trim();
            if (y.id === id || normY === normTarget) {
                matched = true;
                return { ...y, isActive: true };
            }
            return { ...y, isActive: false };
        });

        if (!matched && year) {
            updatedYears = [{ id: id || `ay_${Date.now()}`, label: year, isActive: true }, ...updatedYears.map(y => ({ ...y, isActive: false }))];
        }

        const ayJson = JSON.stringify(updatedYears);
        await prisma.$executeRawUnsafe(`
            INSERT INTO academic_plan
                (id, department, "academicYears", "createdAt", "updatedAt")
            VALUES
                (gen_random_uuid(), 'default', $1::jsonb, NOW(), NOW())
            ON CONFLICT (department) DO UPDATE SET
                "academicYears" = EXCLUDED."academicYears",
                "updatedAt" = NOW()
        `, ayJson);

        res.json({ ok: true, activeYear: year || id, academicYears: updatedYears });
    } catch (e) {
        console.error("set-active-year error:", e);
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/v2/academic-planner  — Save / upsert the department plan
app.put("/api/v2/academic-planner", isAdmin, async (req, res) => {
    try {
        const {
            academicYears  = [],
            versions       = [],
            programs       = [],
            faculty        = [],
            timetable      = [],
            framework      = null,
            calendar       = [],
            exportSettings = null,
            department     = "default"
        } = req.body;

        // Stringify for JSONB cast
        const ayJson   = JSON.stringify(academicYears);
        const verJson  = JSON.stringify(versions);
        const progJson = JSON.stringify(programs);
        const facJson  = JSON.stringify(faculty);
        const ttJson   = JSON.stringify(timetable);
        const fwJson   = JSON.stringify(framework);
        const calJson  = JSON.stringify(calendar);
        const exJson   = JSON.stringify(exportSettings);

        // Use camelCase column names as Prisma created them
        await prisma.$executeRawUnsafe(`
            INSERT INTO academic_plan
                (id, department, "academicYears", versions, programs, faculty, timetable, framework, calendar, "exportSettings", "createdAt", "updatedAt")
            VALUES
                (gen_random_uuid(), $1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, NOW(), NOW())
            ON CONFLICT (department) DO UPDATE SET
                "academicYears"  = EXCLUDED."academicYears",
                versions         = EXCLUDED.versions,
                programs         = EXCLUDED.programs,
                faculty          = EXCLUDED.faculty,
                timetable        = EXCLUDED.timetable,
                framework        = EXCLUDED.framework,
                calendar         = EXCLUDED.calendar,
                "exportSettings" = EXCLUDED."exportSettings",
                "updatedAt"      = NOW()
        `,
            department,
            ayJson, verJson, progJson, facJson, ttJson, fwJson, calJson, exJson
        );

        res.json({ ok: true });
    } catch (e) {
        console.error("Academic planner PUT error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(3006, "0.0.0.0", () => console.log("Management Service running on port 3006"));
