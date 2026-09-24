const express = require("express");
const cors = require("cors");
const prisma = require("../../shared/database");

const app = express();
app.use(cors());
app.use(express.json());

const { verifyToken } = require("../../shared/auth");
app.use("/api", verifyToken);

// ── Attainment Calculation Engine ─────────────────────────────────────

async function calculateCourseAttainment(courseId) {
    const course = await prisma.course.findUnique({
        where: { courseId },
        include: {
            courseOutcomes: {
                include: {
                    copoMappings: { include: { po: true } },
                    marks: { include: { question: true } },
                    feedbacks: true
                }
            }
        }
    });

    if (!course) return null;

    const TARGET_THRESHOLD = (course.coTargetPct ?? 60) / 100;
    const DIRECT_WEIGHT = (course.directWeight ?? 80) / 100;
    const INDIRECT_WEIGHT = (course.indirectWeight ?? 20) / 100;

    const outcomes = course.courseOutcomes.map(co => {
        // ── Direct Attainment ──
        const marks = co.marks.filter(m => m.question); // only marks associated with a question

        // Group marks by generic categories for display (Internal, Midterm, End Semester)
        const categories = {
            internal: marks.filter(m => m.examType === "Internal" || m.question?.exam?.type === "Internal"),
            midterm: marks.filter(m => m.examType === "Mid Semester" || m.question?.exam?.type === "Mid Semester"),
            assignment: marks.filter(m => m.examType === "Assignment" || m.question?.exam?.type === "Assignment"),
            ese: marks.filter(m => m.examType === "End Semester" || m.question?.exam?.type === "End Semester")
        };

        const calcCatPct = (catMarks) => {
            if (catMarks.length === 0) return 0;
            const aboveTargetCount = catMarks.filter(m => (m.marksObtained / m.question.maxMarks) >= TARGET_THRESHOLD).length;
            return Math.round((aboveTargetCount / catMarks.length) * 100);
        };

        const directScores = {
            internal: calcCatPct(categories.internal),
            midterm: calcCatPct(categories.midterm),
            assignment: calcCatPct(categories.assignment),
            ese: calcCatPct(categories.ese)
        };

        // Weighted Direct Attainment (e.g. 30% Internal, 50% Midterm, 20% Assignment if no ESE, or handle properly)
        // Simplified same as frontend for now
        const directAvg = (directScores.internal * 0.3 + directScores.midterm * 0.5 + directScores.assignment * 0.2);

        // ── Indirect Attainment (Feedback) ──
        const ratings = co.feedbacks.map(f => f.rating);
        const indirectAvg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / (ratings.length * 5)) * 100 : 0; // assuming scale of 5

        const overall = Math.round(directAvg * DIRECT_WEIGHT + indirectAvg * INDIRECT_WEIGHT);
        const level = overall >= 70 ? 3 : overall >= 55 ? 2 : overall >= 40 ? 1 : 0;

        return {
            id: co.coNumber,
            description: co.description,
            bloom: co.bloomLevel || "Apply",
            direct: directScores,
            indirect: Math.round(indirectAvg),
            overall,
            level,
            copoMap: Object.fromEntries(co.copoMappings.map(m => [m.po.poId, m.correlationLevel]))
        };
    });

    // ── PO Attainment ──
    const pos = await prisma.pO.findMany();
    const poAttainment = pos.map(po => {
        let sum = 0, wSum = 0;
        outcomes.forEach(co => {
            const w = co.copoMap[po.poId] || 0;
            if (w > 0) {
                sum += co.overall * w;
                wSum += w;
            }
        });
        const val = wSum > 0 ? Math.round(sum / wSum) : 0;
        const level = val >= 70 ? 3 : val >= 55 ? 2 : val >= 40 ? 1 : 0;
        return {
            id: po.poId,
            description: po.description,
            attainment: val,
            level
        };
    });

    return {
        course: { id: course.courseId, name: course.name, semester: course.semester, academicYear: course.academicYear },
        outcomes,
        poAttainment,
        config: { targetPct: TARGET_THRESHOLD * 100, directWeight: DIRECT_WEIGHT * 100, indirectWeight: INDIRECT_WEIGHT * 100 }
    };
}

// ── Endpoints ──

app.get("/api/report/courses/:courseId/attainment", async (req, res) => {
    try {
        const data = await calculateCourseAttainment(req.params.courseId);
        data ? res.json(data) : res.status(404).json({ error: "Course not found" });
    } catch (e) {
        console.error("Report Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(3007, "0.0.0.0", () => console.log("Report Service running on port 3007"));
