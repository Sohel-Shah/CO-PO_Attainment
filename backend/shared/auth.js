const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("FATAL ERROR: JWT_SECRET environment variable is not set!");
    process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-key-change-in-production";

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: "24h" }
    );
};

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: "Invalid or expired token." });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Require Administrator Role" });
    }
};

module.exports = { generateToken, verifyToken, isAdmin };
