const express = require("express");
const cors = require("cors");
const prisma = require("../../shared/database");

const app = express();
app.use(cors());
app.use(express.json());

const { verifyToken } = require("../../shared/auth");
app.use("/api", verifyToken);

// ── Students ──
app.get("/api/students", async (req, res) => {
    try {
        const students = await prisma.student.findMany({ orderBy: { rollNumber: "asc" } });
        res.json(students);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/students", async (req, res) => {
    try {
        const { rollNumber, name, email, batchYear } = req.body;
        const student = await prisma.student.upsert({
            where: { rollNumber },
            update: { name, email, batchYear },
            create: { rollNumber, name, email, batchYear },
        });
        res.status(201).json(student);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Course Enrollments ──
app.get("/api/courses/:courseId/students", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: course.id },
            include: { student: true },
            orderBy: { student: { rollNumber: "asc" } },
        });
        res.json(enrollments.map(e => e.student));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/students/enroll", async (req, res) => {
    try {
        const { students } = req.body; // Array of { roll, name }
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) throw new Error("Course not found");

        const ops = [];
        for (const s of (students || [])) {
            const student = await prisma.student.upsert({
                where: { rollNumber: String(s.roll || s.rollNumber) },
                update: { name: s.name },
                create: { rollNumber: String(s.roll || s.rollNumber), name: s.name },
            });
            ops.push(prisma.enrollment.upsert({
                where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
                update: {},
                create: { studentId: student.id, courseId: course.id },
            }));
        }
        await Promise.all(ops);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3004, "0.0.0.0", () => console.log("Student Service running on port 3004"));
