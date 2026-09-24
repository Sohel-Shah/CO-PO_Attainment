// ─────────────────────────────────────────────────────────────────────────────
//  server/index.js  —  Main API server entry point
//  Connects to PostgreSQL via Prisma and serves the React frontend (port 5173)
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const db = require("./relational_api");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors()); // Allow all origins in development to avoid port mismatch issues
app.use(express.json({ limit: "10mb" }));

// ── Request logger ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ════════════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/health", async (_req, res) => {
    try {
        await db.prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
    } catch (e) {
        res.status(503).json({ status: "error", db: "disconnected", message: e.message });
    }
});

// ════════════════════════════════════════════════════════════════════════════
//  FACULTY
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/faculty", async (_req, res) => {
    try { res.json(await db.getAllFaculty()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/faculty", async (req, res) => {
    try { res.status(201).json(await db.createFaculty(req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/faculty/:id", async (req, res) => {
    try {
        const f = await db.getFacultyById(req.params.id);
        f ? res.json(f) : res.status(404).json({ error: "Faculty not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  PROGRAM OUTCOMES  (PO / PSO)
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/pos", async (_req, res) => {
    try { res.json(await db.getAllPOs()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/pos", async (req, res) => {
    const { poId, description, type } = req.body;
    try { res.status(201).json(await db.upsertPO(poId, description, type)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  COURSES
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/courses", async (_req, res) => {
    try { res.json(await db.getAllCourses()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses", async (req, res) => {
    try { res.status(201).json(await db.upsertCourse(req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/courses/:courseId", async (req, res) => {
    try {
        const c = await db.getCourseById(req.params.courseId);
        c ? res.json(c) : res.status(404).json({ error: "Course not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/courses/:courseId", async (req, res) => {
    try { res.json(await db.upsertCourse({ ...req.body, courseId: req.params.courseId })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/courses/:courseId", async (req, res) => {
    try { res.json(await db.deleteCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Course Outcomes ────────────────────────────────────────────────────────
app.get("/api/courses/:courseId/outcomes", async (req, res) => {
    try { res.json(await db.getCOsForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/outcomes", async (req, res) => {
    const { coNumber, description, bloomLevel } = req.body;
    try { res.status(201).json(await db.upsertCO(req.params.courseId, coNumber, description, bloomLevel)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/courses/:courseId/outcomes", async (req, res) => {
    try { await db.deleteCOsForCourse(req.params.courseId); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CO-PO Mapping ──────────────────────────────────────────────────────────
app.get("/api/courses/:courseId/copo-map", async (req, res) => {
    try { res.json(await db.getCopoMapForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/copo-map", async (req, res) => {
    // body: { copoMap: { CO1: { PO1: 3, PO2: 2 }, CO2: { ... } } }
    try { res.json(await db.bulkSaveCopoMap(req.params.courseId, req.body.copoMap)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Students enrolled in a course ─────────────────────────────────────────
app.get("/api/courses/:courseId/students", async (req, res) => {
    try { res.json(await db.getStudentsForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/students/enroll", async (req, res) => {
    // body: { students: [{ roll, name }, ...] }
    try {
        await db.bulkEnrollStudents(req.body.students || [], req.params.courseId);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Exams ──────────────────────────────────────────────────────────────────
app.get("/api/courses/:courseId/exams", async (req, res) => {
    try { res.json(await db.getExamsForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/exams", async (req, res) => {
    try { res.status(201).json(await db.createExam(req.params.courseId, req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/exams/:examId", async (req, res) => {
    try { res.json(await db.updateExam(req.params.examId, req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/exams/:examId", async (req, res) => {
    try { res.json(await db.deleteExam(req.params.examId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Question Papers ────────────────────────────────────────────────────────
app.get("/api/courses/:courseId/papers", async (req, res) => {
    try { res.json(await db.getQuestionPapersForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/papers", async (req, res) => {
    try { res.status(201).json(await db.createQuestionPaper(req.params.courseId, req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/papers/:paperId", async (req, res) => {
    try { res.json(await db.updateQuestionPaper(req.params.paperId, req.body)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/papers/:paperId", async (req, res) => {
    try { res.json(await db.deleteQuestionPaper(req.params.paperId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Questions ──────────────────────────────────────────────────────────────
app.post("/api/exams/:examId/questions", async (req, res) => {
    const { label, maxMarks, coNumber, bloomLevel, unitNo, questionText } = req.body;
    try { res.status(201).json(await db.addQuestion(req.params.examId, label, maxMarks, coNumber, bloomLevel, unitNo, questionText)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Marks ──────────────────────────────────────────────────────────────────
app.get("/api/courses/:courseId/marks", async (req, res) => {
    try { res.json(await db.getMarksForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/marks", async (req, res) => {
    // body: { rollNumber, questionId, marksObtained }
    const { rollNumber, questionId, marksObtained } = req.body;
    try { res.json(await db.saveMark(rollNumber, questionId, marksObtained)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Feedback ───────────────────────────────────────────────────────────────
app.get("/api/courses/:courseId/feedback", async (req, res) => {
    try { res.json(await db.getFeedbackForCourse(req.params.courseId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/feedback", async (req, res) => {
    // body: { rollNumber, courseId, coNumber, rating }
    const { rollNumber, courseId, coNumber, rating } = req.body;
    try { res.json(await db.saveFeedback(rollNumber, courseId, coNumber, rating)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  V2 API  —  Full-state sync (used by the React frontend)
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/v2/courses/:courseId/state", async (req, res) => {
    try {
        const state = await db.getFullState(req.params.courseId);
        state ? res.json(state) : res.status(404).json({ error: "Course not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/v2/sync-full", async (req, res) => {
    try {
        const result = await db.syncFullState(req.body);
        if (result.ok) {
            const courseId = req.body.course?.courseId || req.body.coursePlan?.code;
            const newState = await db.getFullState(courseId);
            res.json(newState || { ok: true });
        } else {
            res.status(400).json(result);
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Legacy key-value state fallback ───────────────────────────────────────
app.get("/api/state/:key", async (req, res) => {
    try {
        const state = await db.getFullState(req.params.key);
        state ? res.json({ value: state }) : res.status(404).json({ error: "Not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  STUDENTS  (global, not course-scoped)
// ════════════════════════════════════════════════════════════════════════════
app.get("/api/students", async (_req, res) => {
    try { res.json(await db.getAllStudents()); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/students", async (req, res) => {
    const { rollNumber, name, email, batchYear } = req.body;
    try { res.status(201).json(await db.upsertStudent(rollNumber, name, email, batchYear)); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  AUTHENTICATION & ADMIN SECURITY
// ════════════════════════════════════════════════════════════════════════════
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.loginUser(email, password);
        result.ok ? res.json(result) : res.status(401).json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/auth/admin/password", async (req, res) => {
    const { email, password, updaterRole } = req.body;
    try {
        await db.adminUpdatePassword(email, password, updaterRole);
        res.json({ ok: true });
    } catch (e) { res.status(403).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  404 fallback
// ════════════════════════════════════════════════════════════════════════════
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ════════════════════════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════════════════════════
app.listen(PORT, async () => {
    await db.ensureAdminUser();
    console.log("─────────────────────────────────────────────");
    console.log(`  OBC Server running at http://localhost:${PORT}`);
    console.log(`  DB : ${process.env.DATABASE_URL?.split("@")[1] || "configured"}`);
    console.log("─────────────────────────────────────────────");
});

// Graceful shutdown
process.on("SIGINT", async () => { await db.prisma.$disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await db.prisma.$disconnect(); process.exit(0); });
