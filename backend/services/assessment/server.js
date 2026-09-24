const express = require("express");
const cors = require("cors");
const prisma = require("../../shared/database");

const app = express();
app.use(cors());
app.use(express.json());

const { verifyToken } = require("../../shared/auth");
app.use("/api", verifyToken);

// ── Exams ──
app.get("/api/courses/:courseId/exams", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const exams = await prisma.exam.findMany({
            where: { courseId: course.id },
            include: { questions: { include: { courseOutcome: true } } },
            orderBy: { createdAt: "asc" },
        });
        res.json(exams);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/exams", async (req, res) => {
    try {
        const { title, name, totalMarks, total, type, duration } = req.body;
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) throw new Error("Course not found");

        const exam = await prisma.exam.create({
            data: {
                courseId: course.id,
                title: title || name || "Exam",
                type: type || "Internal",
                totalMarks: Number(totalMarks || total || 0),
                duration: duration || null
            },
            include: { questions: true }
        });
        res.status(201).json(exam);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/exams/:examId", async (req, res) => {
    try {
        const { title, name, totalMarks, total, ...rest } = req.body;
        const exam = await prisma.exam.update({
            where: { id: req.params.examId },
            data: {
                ...rest,
                title: title || name,
                totalMarks: totalMarks !== undefined ? Number(totalMarks) : (total !== undefined ? Number(total) : undefined)
            }
        });
        res.json(exam);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/exams/:examId", async (req, res) => {
    try {
        await prisma.exam.delete({ where: { id: req.params.examId } });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Question Papers ──
app.get("/api/courses/:courseId/papers", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const papers = await prisma.questionPaper.findMany({
            where: { courseId: course.id },
            include: { questions: { include: { courseOutcome: true } } },
            orderBy: { createdAt: "desc" },
        });
        res.json(papers);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/papers", async (req, res) => {
    try {
        const { title, name, totalMarks, total, sections, questions } = req.body;
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId }, include: { courseOutcomes: true } });
        if (!course) throw new Error("Course not found");

        const coLookup = Object.fromEntries(course.courseOutcomes.map(c => [c.coNumber, c.id]));
        let flatQuestions = [];
        if (Array.isArray(questions)) flatQuestions = questions;
        else if (Array.isArray(sections)) {
            flatQuestions = sections.flatMap(sec => (sec.questions || []).map(q => ({ ...q, section: sec.name || q.section })));
        }

        const paper = await prisma.questionPaper.create({
            data: {
                courseId: course.id,
                title: title || name || "Question Paper",
                totalMarks: Number(totalMarks || total || 0),
                questions: {
                    create: flatQuestions.map(q => ({
                        section: q.section || "Section A",
                        questionText: q.questionText || q.q || q.text || "",
                        marks: Number(q.marks || 0),
                        type: q.type || "short",
                        courseOutcomeId: q.courseOutcomeId || coLookup[q.co] || null
                    }))
                }
            },
            include: { questions: true }
        });
        res.status(201).json(paper);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Questions ──
app.post("/api/exams/:examId/questions", async (req, res) => {
    try {
        const { label, maxMarks, coNumber, bloomLevel, unitNo, questionText } = req.body;
        const exam = await prisma.exam.findUnique({ where: { id: req.params.examId }, include: { course: true } });
        if (!exam) throw new Error("Exam not found");

        let coId = null;
        if (coNumber) {
            const co = await prisma.courseOutcome.findUnique({ where: { courseId_coNumber: { courseId: exam.courseId, coNumber } } });
            coId = co?.id || null;
        }

        const q = await prisma.question.create({
            data: { examId: req.params.examId, label, maxMarks: Number(maxMarks), courseOutcomeId: coId, bloomLevel, unitNo, questionText }
        });
        res.status(201).json(q);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Marks ──
app.get("/api/courses/:courseId/marks", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const exams = await prisma.exam.findMany({ where: { courseId: course.id }, select: { id: true } });
        const qIds = await prisma.question.findMany({ where: { examId: { in: exams.map(e => e.id) } }, select: { id: true } });
        const marks = await prisma.mark.findMany({
            where: { questionId: { in: qIds.map(q => q.id) } },
            include: { student: true, question: { include: { exam: true } } },
        });
        res.json(marks);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/marks", async (req, res) => {
    try {
        const { rollNumber, questionId, marksObtained } = req.body;
        const student = await prisma.student.findUnique({ where: { rollNumber: String(rollNumber) } });
        if (!student) throw new Error("Student not found");

        const mark = await prisma.mark.upsert({
            where: { studentId_questionId: { studentId: student.id, questionId } },
            update: { marksObtained: Number(marksObtained) },
            create: { studentId: student.id, questionId, marksObtained: Number(marksObtained) },
        });
        res.json(mark);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Feedback ──
app.get("/api/courses/:courseId/feedback", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const coIds = await prisma.courseOutcome.findMany({ where: { courseId: course.id }, select: { id: true } });
        const fb = await prisma.feedback.findMany({
            where: { courseOutcomeId: { in: coIds.map(c => c.id) } },
            include: { student: true, courseOutcome: true },
        });
        res.json(fb);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/feedback", async (req, res) => {
    try {
        const { rollNumber, courseId, coNumber, rating } = req.body;
        const student = await prisma.student.findUnique({ where: { rollNumber: String(rollNumber) } });
        const courseRecord = await prisma.course.findUnique({ where: { courseId } });
        if (!student || !courseRecord) throw new Error("Student or Course not found");

        const co = await prisma.courseOutcome.findUnique({ where: { courseId_coNumber: { courseId: courseRecord.id, coNumber } } });
        if (!co) throw new Error("CO not found");

        const existing = await prisma.feedback.findFirst({
            where: { studentId: student.id, courseOutcomeId: co.id }
        });

        const feedback = existing
            ? await prisma.feedback.update({ where: { id: existing.id }, data: { rating: Number(rating) } })
            : await prisma.feedback.create({ data: { studentId: student.id, courseOutcomeId: co.id, rating: Number(rating) } });

        res.json(feedback);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3005, "0.0.0.0", () => console.log("Assessment Service running on port 3005"));
