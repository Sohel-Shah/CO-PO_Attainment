const express = require("express");
const cors = require("cors");
const prisma = require("../../shared/database");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(cors());
app.use(express.json());

const { verifyToken } = require("../../shared/auth");
app.use("/api", verifyToken);

const upload = multer({ storage: multer.memoryStorage() });

// ── POs ──
app.get("/api/pos", async (req, res) => {
    try { res.json(await prisma.pO.findMany({ orderBy: { poId: "asc" } })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/pos", async (req, res) => {
    const { poId, description, type } = req.body;
    try { 
        const po = await prisma.pO.upsert({
            where: { poId },
            update: { description, type },
            create: { poId, description, type },
        });
        res.status(201).json(po);
    }
    catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Courses ──

// Catalog endpoint: returns ALL courses (not just user's own) for browsing
// Used by faculty to search and self-assign courses from the CAY catalog
app.get("/api/courses/catalog", async (req, res) => {
    try {
        const { academicYear } = req.query;

        // Build a filter — if academicYear is provided, filter by it (handle en-dash vs hyphen)
        const whereClause = {};
        if (academicYear) {
            const normalised = String(academicYear).replace(/–/g, '-').trim();
            // Match both em-dash and hyphen variants stored in DB
            whereClause.OR = [
                { academicYear: normalised },
                { academicYear: normalised.replace(/-/g, '–') }
            ];
        }

        const courses = await prisma.course.findMany({
            where: whereClause,
            include: {
                faculty: true,
                courseOutcomes: true,
                courseAccesses: { include: { user: { select: { id: true, name: true, email: true } } } }
            },
            orderBy: [{ academicYear: "desc" }, { semester: "asc" }, { name: "asc" }]
        });

        res.json(courses);
    } catch (e) {
        console.error("Catalog fetch error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/courses", async (req, res) => {
    try {
        let courses;
        if (req.user && req.user.role === "admin") {
            courses = await prisma.course.findMany({
                include: { faculty: true, courseOutcomes: true, courseAccesses: true },
                orderBy: { semester: "asc" },
            });
        } else if (req.user) {
            // Find courses where this user has access
            courses = await prisma.course.findMany({
                where: {
                    courseAccesses: {
                        some: { userId: req.user.id }
                    }
                },
                include: { faculty: true, courseOutcomes: true, courseAccesses: true },
                orderBy: { semester: "asc" },
            });
        } else {
            return res.status(401).json({ error: "Unauthorized" });
        }
        res.json(courses);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses", async (req, res) => {
    try {
        const { courseId, facultyName, ...rest } = req.body;
        let facultyId = undefined;
        if (facultyName) {
            const f = await prisma.faculty.findFirst({ where: { name: { contains: facultyName, mode: "insensitive" } } });
            if (f) facultyId = f.id;
        }
        const course = await prisma.course.upsert({
            where: { courseId },
            update: { ...rest, ...(facultyId && { facultyId }) },
            create: { courseId, ...rest, ...(facultyId && { facultyId }) },
        });

        // Automatically grant owner access to the user creating the course, if not admin
        if (req.user && req.user.role !== "admin") {
            await prisma.courseAccess.upsert({
                where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
                update: { accessLevel: "owner" },
                create: { userId: req.user.id, courseId: course.id, accessLevel: "owner" }
            });
        }

        res.status(201).json(course);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/courses/:courseId", async (req, res) => {
    try {
        const c = await prisma.course.findUnique({
            where: { courseId: req.params.courseId },
            include: { faculty: true, courseOutcomes: { include: { copoMappings: { include: { po: true } } } }, exams: { include: { questions: true } } },
        });
        c ? res.json(c) : res.status(404).json({ error: "Course not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/courses/:courseId", async (req, res) => {
    try {
        const { facultyName, ...rest } = req.body;
        let facultyId = undefined;
        if (facultyName) {
            const f = await prisma.faculty.findFirst({ where: { name: { contains: facultyName, mode: "insensitive" } } });
            if (f) facultyId = f.id;
        }
        const course = await prisma.course.update({
            where: { courseId: req.params.courseId },
            data: { ...rest, ...(facultyId && { facultyId }) }
        });
        res.json(course);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/courses/:courseId", async (req, res) => {
    try {
        await prisma.course.delete({ where: { courseId: req.params.courseId } });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/extract-syllabus", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No PDF file provided." });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.log("No GEMINI_API_KEY found. Returning mock data for testing.");
            // Return mock data for testing so frontend pipeline can be verified
            return res.json({
                course: {
                    courseName: "Software Engineering (MOCK)",
                    courseCode: "SE-101",
                    department: "Computer Science",
                    programName: "B.Tech",
                    academicYear: "2026-27",
                    semester: "V",
                    credits: 4,
                    lectureHrs: 3,
                    tutorialHrs: 0,
                    practicalHrs: 2,
                    selfStudyHrs: 0
                },
                courseOutcomes: [
                    { id: "CO1", desc: "Understand software life cycle models.", bloom: "L2" },
                    { id: "CO2", desc: "Design software architecture.", bloom: "L3" }
                ],
                units: [
                    { id: 1, unit: "I", name: "Introduction to SE", topics: "SDLC, Agile, Waterfall", bloomLevel: "L2", lectures: 8 },
                    { id: 2, unit: "II", name: "Software Design", topics: "UML diagrams, Design Patterns", bloomLevel: "L3", lectures: 10 }
                ],
                references: {
                    textbooks: ["Software Engineering by Ian Sommerville"],
                    refBooks: ["Design Patterns by Gang of Four"],
                    standards: []
                }
            });
        }

        // Parse PDF text
        const pdfData = await pdfParse(req.file.buffer);
        const pdfText = pdfData.text;

        if (!pdfText || pdfText.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from the provided PDF." });
        }

        if (!pdfText || pdfText.trim().length === 0) {
            return res.status(400).json({ error: "Could not extract text from the provided PDF." });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `
You are an expert academic curriculum parser. 
Analyze the following university syllabus/course curriculum text and extract the information into the exact JSON format specified below.
If any field is not found or cannot be determined from the text, set its value to null (do not guess or invent data).

JSON Schema to follow strictly:
{
  "course": {
    "courseName": "string | null",
    "courseCode": "string | null",
    "department": "string | null",
    "programName": "string | null",
    "academicYear": "string | null",
    "semester": "string | null",
    "credits": "number | null",
    "lectureHrs": "number | null",
    "tutorialHrs": "number | null",
    "practicalHrs": "number | null",
    "selfStudyHrs": "number | null"
  },
  "courseOutcomes": [
    {
      "id": "CO1",
      "desc": "string (outcome description)",
      "bloom": "string | null (e.g., 'L2' or 'L2/L3')"
    }
  ],
  "units": [
    {
      "id": 1,
      "unit": "string (e.g., 'I', 'II', 'III')",
      "name": "string (Unit title)",
      "topics": "string (Detailed topics, comma separated or continuous string)",
      "bloomLevel": "string | null (e.g., 'L2/L3')",
      "lectures": "number | null (hours allocated for the unit)"
    }
  ],
  "references": {
    "textbooks": ["string"],
    "refBooks": ["string"],
    "standards": ["string"]
  }
}

Syllabus Text:
${pdfText.substring(0, 30000)}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const extractedData = JSON.parse(response.text);
        res.json(extractedData);

    } catch (error) {
        console.error("PDF Extraction Error:", error);
        res.status(500).json({ error: "Failed to extract syllabus. " + error.message });
    }
});

// ── Course Outcomes (CO) ──
app.get("/api/courses/:courseId/outcomes", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const cos = await prisma.courseOutcome.findMany({
            where: { courseId: course.id },
            include: { copoMappings: { include: { po: true } } },
            orderBy: { coNumber: "asc" },
        });
        res.json(cos);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/outcomes", async (req, res) => {
    try {
        const { coNumber, description, bloomLevel } = req.body;
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) throw new Error("Course not found");

        const outcome = await prisma.courseOutcome.upsert({
            where: { courseId_coNumber: { courseId: course.id, coNumber } },
            update: { description, bloomLevel },
            create: { courseId: course.id, coNumber, description, bloomLevel: bloomLevel || "Apply" },
        });
        res.status(201).json(outcome);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/courses/:courseId/outcomes", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (course) await prisma.courseOutcome.deleteMany({ where: { courseId: course.id } });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CO-PO Mapping ──
app.get("/api/courses/:courseId/copo-map", async (req, res) => {
    try {
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) return res.json([]);
        const coIds = await prisma.courseOutcome.findMany({ where: { courseId: course.id }, select: { id: true } });
        const maps = await prisma.cOPOMapping.findMany({
            where: { courseOutcomeId: { in: coIds.map(c => c.id) } },
            include: { courseOutcome: true, po: true },
        });
        res.json(maps);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/courses/:courseId/copo-map", async (req, res) => {
    try {
        const { copoMap } = req.body; // { CO1: { PO1: 3, ... }, ... }
        const course = await prisma.course.findUnique({ where: { courseId: req.params.courseId } });
        if (!course) throw new Error("Course not found");

        const cos = await prisma.courseOutcome.findMany({ where: { courseId: course.id } });
        const pos = await prisma.pO.findMany();
        const poLookup = Object.fromEntries(pos.map(p => [p.poId, p.id]));
        const coLookup = Object.fromEntries(cos.map(c => [c.coNumber, c.id]));

        const ops = [];
        for (const [coNum, poLevels] of Object.entries(copoMap)) {
            const coDbId = coLookup[coNum];
            if (!coDbId) continue;
            for (const [poKey, level] of Object.entries(poLevels)) {
                const poDbId = poLookup[poKey];
                if (!poDbId) continue;
                ops.push(prisma.cOPOMapping.upsert({
                    where: { courseOutcomeId_poId: { courseOutcomeId: coDbId, poId: poDbId } },
                    update: { correlationLevel: Number(level) },
                    create: { courseOutcomeId: coDbId, poId: poDbId, correlationLevel: Number(level) }
                }));
            }
        }
        await prisma.$transaction(ops);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(3003, "0.0.0.0", () => console.log("Academic Service running on port 3003"));
