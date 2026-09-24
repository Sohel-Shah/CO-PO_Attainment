const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const httpProxy = require("express-http-proxy");
const path = require("path");
const fs = require("fs");

const app = express();

// Security Headers (relaxed contentSecurityPolicy for frontend SPA assets)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS Whitelist Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:3001", "http://127.0.0.1:3001", "http://127.0.0.1:5174"];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            callback(new Error("CORS policy violation: Origin not allowed."));
        }
    },
    credentials: true
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50000,
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", globalLimiter);
app.use(express.json({ limit: "20mb" }));

// Dynamic Service Mappings (Environment Variables with Local Development Defaults)
const services = {
    auth: process.env.AUTH_SERVICE_URL || "http://127.0.0.1:3002",
    academic: process.env.ACADEMIC_SERVICE_URL || "http://127.0.0.1:3003",
    student: process.env.STUDENT_SERVICE_URL || "http://127.0.0.1:3004",
    assessment: process.env.ASSESSMENT_SERVICE_URL || "http://127.0.0.1:3005",
    management: process.env.MANAGEMENT_SERVICE_URL || "http://127.0.0.1:3006",
    report: process.env.REPORT_SERVICE_URL || "http://127.0.0.1:3007",
    ui: process.env.UI_SERVICE_URL || "http://127.0.0.1:5174",
};

// Proxy Error Handler
const proxyErrorHandler = (err, res, next) => {
    console.error("Proxy Error:", err.message);
    res.status(503).json({
        error: "Service temporarily unavailable",
        details: "One of our microservices is down, but the gateway is running."
    });
};

// ── Service Micro-Routes ──────────────────────────────────────────────────

// Auth Service (3002)
app.use("/api/auth", httpProxy(services.auth, {
    proxyReqPathResolver: req => `/api/auth${req.url}`,
    proxyErrorHandler
}));
app.use("/api/faculty", httpProxy(services.auth, {
    proxyReqPathResolver: req => `/api/faculty${req.url}`,
    proxyErrorHandler
}));
app.use("/api/users", httpProxy(services.auth, {
    proxyReqPathResolver: req => `/api/users${req.url}`,
    proxyErrorHandler
}));

// Academic Service (3003)
app.use("/api/courses", httpProxy(services.academic, {
    proxyReqPathResolver: req => `/api/courses${req.url}`,
    proxyErrorHandler
}));
app.use("/api/pos", httpProxy(services.academic, {
    proxyReqPathResolver: req => `/api/pos${req.url}`,
    proxyErrorHandler
}));

// Student Service (3004)
app.use("/api/students", httpProxy(services.student, {
    proxyReqPathResolver: req => `/api/students${req.url}`,
    proxyErrorHandler
}));

// Assessment Service (3005)
app.use("/api/exams", httpProxy(services.assessment, {
    proxyReqPathResolver: req => `/api/exams${req.url}`,
    proxyErrorHandler
}));
app.use("/api/papers", httpProxy(services.assessment, {
    proxyReqPathResolver: req => `/api/papers${req.url}`,
    proxyErrorHandler
}));
app.use("/api/marks", httpProxy(services.assessment, {
    proxyReqPathResolver: req => `/api/marks${req.url}`,
    proxyErrorHandler
}));
app.use("/api/feedback", httpProxy(services.assessment, {
    proxyReqPathResolver: req => `/api/feedback${req.url}`,
    proxyErrorHandler
}));

// Management Service (3006)
app.use("/api/v2", httpProxy(services.management, {
    proxyReqPathResolver: req => `/api/v2${req.url}`,
    proxyErrorHandler
}));
app.use("/api/state", httpProxy(services.management, {
    proxyReqPathResolver: req => `/api/state${req.url}`,
    proxyErrorHandler
}));

// Report Service (3007)
app.use("/api/report", httpProxy(services.report, {
    proxyReqPathResolver: req => `/api/report${req.url}`,
    proxyErrorHandler
}));

// ── Health Probes ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        gateway: "running",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
});

// ── UI Serving Logic (Production Dist static vs Dev Proxy) ──────────────────
const distPath = path.resolve(__dirname, "../../frontend/dist");

if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
    console.log("Serving Production Static Assets from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
} else {
    // Development fallback to Vite proxy
    app.use("/", httpProxy(services.ui, {
        proxyErrorHandler: (err, res, next) => {
            if (fs.existsSync(distPath)) {
                res.sendFile(path.join(distPath, "index.html"));
            } else {
                res.status(503).send("Frontend service is unavailable and build artifact (dist) was not found.");
            }
        }
    }));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
    console.log("─────────────────────────────────────────────");
    console.log(`  API GATEWAY: http://0.0.0.0:${PORT}`);
    console.log(`  ENVIRONMENT: ${process.env.NODE_ENV || "development"}`);
    console.log("─────────────────────────────────────────────");
});
