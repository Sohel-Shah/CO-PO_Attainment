const express = require("express");
const cors = require("cors");
const prisma = require("../../shared/database");

const app = express();
app.use(cors());
app.use(express.json());

const bcrypt = require("bcryptjs");
const { generateToken, verifyToken, isAdmin } = require("../../shared/auth");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per window
    message: { error: "Too many authentication attempts from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Faculty ──
app.get("/api/faculty", async (req, res) => {
    try {
        const faculty = await prisma.faculty.findMany({ orderBy: { name: "asc" } });
        res.json(faculty);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Users ──
app.get("/api/users", verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, courseAccesses: true },
            orderBy: { createdAt: "asc" }
        });
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/users/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ ok: true, message: "User deleted successfully" });
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

app.post("/api/users", verifyToken, isAdmin, async (req, res) => {
    const { email, name, role } = req.body;
    try {
        if (!email) return res.status(400).json({ error: "Email is required" });
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "User already exists with this email" });

        const u = await prisma.user.create({
            data: { email, password: "demo", name: name || email.split('@')[0], role: role || "faculty", status: "active" }
        });
        res.status(201).json(u);
    } catch (e) { 
        res.status(500).json({ error: e.message }); 
    }
});

app.put("/api/users/:id", verifyToken, isAdmin, async (req, res) => {
    try {
        const { role, status } = req.body;
        // Prevent disabling self
        if (req.user.id === req.params.id && status === 'disabled') {
            return res.status(400).json({ error: "You cannot disable your own account." });
        }
        const updated = await prisma.user.update({
            where: { id: req.params.id },
            data: { 
                ...(role && { role }),
                ...(status && { status }) 
            }
        });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Self-assignment: any authenticated faculty user can claim a course from the catalog
// Uses JWT identity — users can only assign themselves, never another user
app.post("/api/users/self/assign-course", verifyToken, async (req, res) => {
    try {
        const { courseId } = req.body;
        if (!courseId) return res.status(400).json({ error: "courseId is required" });

        const userId = req.user.id;

        // Verify the course exists (Course model has no facultyName column — name comes from Faculty relation)
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return res.status(404).json({ error: "Course not found" });

        // Upsert CourseAccess — safe to call even if already assigned (idempotent)
        // This is sufficient: the frontend's getRole() and courseAccesses reflect ownership correctly.
        const access = await prisma.courseAccess.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: { accessLevel: "owner" },
            create: { userId, courseId, accessLevel: "owner" }
        });

        res.status(201).json({ ok: true, access, courseId, userId });
    } catch (e) {
        console.error("Self-assign error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/users/:id/course-access", verifyToken, isAdmin, async (req, res) => {
    try {
        const { courseId, accessLevel } = req.body;
        if (!courseId) return res.status(400).json({ error: "Course ID is required" });
        
        const access = await prisma.courseAccess.upsert({
            where: { userId_courseId: { userId: req.params.id, courseId } },
            update: { accessLevel: accessLevel || "owner" },
            create: { userId: req.params.id, courseId, accessLevel: accessLevel || "owner" }
        });
        res.status(201).json(access);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete("/api/users/:id/course-access/:courseId", verifyToken, isAdmin, async (req, res) => {
    try {
        await prisma.courseAccess.delete({
            where: { userId_courseId: { userId: req.params.id, courseId: req.params.courseId } }
        });
        res.json({ ok: true, message: "Course access revoked" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/faculty", verifyToken, isAdmin, async (req, res) => {
    try {
        const faculty = await prisma.faculty.create({ data: req.body });
        res.status(201).json(faculty);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/faculty/:id", async (req, res) => {
    try {
        const f = await prisma.faculty.findUnique({ where: { id: req.params.id } });
        f ? res.json(f) : res.status(404).json({ error: "Faculty not found" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
    const { email, password } = req.body;
    try {
        const u = await prisma.user.findUnique({ where: { email } });
        if (u) {
            // Check hashed or plain (for legacy/bootstrap migration)
            const isMatch = u.password.startsWith("$2b$")
                ? await bcrypt.compare(password, u.password)
                : u.password === password;

            if (isMatch) {
                const token = generateToken(u);
                res.json({ ok: true, token, user: { email: u.email, role: u.role, name: u.name } });
            } else {
                res.status(401).json({ ok: false, error: "Incorrect email or password." });
            }
        } else {
            res.status(401).json({ ok: false, error: "Incorrect email or password." });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/email-login", async (req, res) => {
    const { email, role } = req.body;
    try {
        let u = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!u) {
            return res.status(403).json({ 
                ok: false, 
                error: "Access Pending: Your email ID has not been granted access by the Administrator yet. Please contact your HoD/Admin." 
            });
        }

        if (u.status !== "active") {
            return res.status(403).json({ 
                ok: false, 
                error: "Account Disabled: Your account has been disabled by the Administrator." 
            });
        }
        
        // Optional: Update role if they log in with a different role and they are allowed (for legacy/demo purposes)
        if (u.role !== role && role) {
            u = await prisma.user.update({
                where: { email },
                data: { role: role }
            });
        }
        
        const token = generateToken(u);
        res.json({ ok: true, token, user: { id: u.id, email: u.email, role: u.role, name: u.name, status: u.status } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const u = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: role || "faculty" }
        });
        const token = generateToken(u);
        res.status(201).json({ ok: true, token, user: { email: u.email, role: u.role, name: u.name } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/logout", (req, res) => {
    res.json({ ok: true, message: "Logged out successfully" });
});

app.put("/api/auth/admin/password", verifyToken, isAdmin, async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!password || password.length < 4) {
            return res.status(400).json({ error: "Password must be at least 4 characters long." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        res.json({ ok: true, message: "Password updated successfully" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bootstrap Admin
const ensureAdmin = async () => {
    const users = [
        { email: "admin@teachflow.com", password: "password", role: "admin", name: "Administrator" },
        { email: "kunal@teachflow.com", password: "admin", role: "admin", name: "Kunal Admin" }
    ];

    for (const u of users) {
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (!exists) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await prisma.user.create({ data: { ...u, password: hashedPassword } });
            console.log(`Admin user created: ${u.email} / ${u.password}`);
        }
    }
};
ensureAdmin();

app.listen(3002, "0.0.0.0", () => console.log("Auth Service running on port 3002"));
