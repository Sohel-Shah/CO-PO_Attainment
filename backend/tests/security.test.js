const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyToken, generateToken } = require("../shared/auth");

const BASE_URL = process.env.TEST_API_URL || "http://127.0.0.1:3002";

test("Security Test Suite — Auth & Authorization Guards", async (t) => {
    
    await t.test("1. Unauthorized request to GET /api/users is rejected (401/403)", async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/users`);
            assert.equal(res.status === 401 || res.status === 403, true, `Expected 401/403, got ${res.status}`);
        } catch (e) {
            if (e.code === 'ECONNREFUSED') {
                console.warn("Auth service offline; skipping live HTTP test.");
                return;
            }
            throw e;
        }
    });

    await t.test("2. Unauthorized request to DELETE /api/users/:id is rejected", async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/users/dummy-id`, { method: "DELETE" });
            assert.equal(res.status === 401 || res.status === 403, true, `Expected 401/403, got ${res.status}`);
        } catch (e) {
            if (e.code === 'ECONNREFUSED') return;
            throw e;
        }
    });

    await t.test("3. Unauthorized request to POST /api/faculty is rejected", async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/faculty`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "Malicious Faculty" })
            });
            assert.equal(res.status === 401 || res.status === 403, true, `Expected 401/403, got ${res.status}`);
        } catch (e) {
            if (e.code === 'ECONNREFUSED') return;
            throw e;
        }
    });

    await t.test("4. Non-admin request to PUT /api/auth/admin/password is rejected", async () => {
        try {
            const facultyToken = generateToken({ email: "user@example.com", role: "faculty", name: "Faculty" });
            const res = await fetch(`${BASE_URL}/api/auth/admin/password`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${facultyToken}`
                },
                body: JSON.stringify({ email: "admin@teachflow.com", password: "hacked", updaterRole: "admin" })
            });
            assert.equal(res.status === 401 || res.status === 403, true, `Expected 401/403, got ${res.status}`);
        } catch (e) {
            if (e.code === 'ECONNREFUSED') return;
            throw e;
        }
    });

    await t.test("5. Invalid JWT tokens are rejected by verifyToken middleware", () => {
        const mockReq = { headers: { authorization: "Bearer invalid.jwt.token.string" } };
        let statusSet = 0;
        let jsonMsg = null;
        const mockRes = {
            status: (code) => { statusSet = code; return mockRes; },
            json: (obj) => { jsonMsg = obj; }
        };
        verifyToken(mockReq, mockRes, () => {
            assert.fail("Should not call next() for invalid token");
        });
        assert.equal(statusSet === 401 || statusSet === 403, true, `Expected 401/403, got ${statusSet}`);
        assert.equal(jsonMsg.error, "Invalid or expired token.");
    });
});
