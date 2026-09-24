const autocannon = require('autocannon');
const http = require('http');

async function getAuthToken() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ name: "Administrator", role: "admin" });
        const req = http.request({
            hostname: 'localhost', port: 3001, path: '/api/auth/demo-login', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body).token));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function runAutocannon(url, method, payload, token, connections, duration) {
    return new Promise((resolve) => {
        const instance = autocannon({
            url,
            connections,
            duration,
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        instance.on('done', resolve);
    });
}

async function runLoadTests() {
    console.log("Acquiring Token...");
    const token = await getAuthToken();
    console.log("Token acquired.");

    const courseId = "LOAD-TEST-100";
    
    // Seed initial course
    console.log("Seeding base course for tests...");
    await new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost', port: 3001, path: '/api/v2/sync-full', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        }, resolve);
        req.write(JSON.stringify({ course: { courseId }}));
        req.end();
    });

    const fullPayload = {
        course: { courseId },
        marks: { "1": { "Q1": 10 } }
    };
    
    const patchPayload = {
        course: { courseId },
        selectedExamType: "Internal",
        marks: { "1": { "Q1": 10 } }
    };

    const levels = [100, 500, 1000];
    
    console.log("\n=================================");
    console.log("  LOAD TESTING COMPARISON");
    console.log("=================================\n");

    for (let c of levels) {
        console.log(`\n--- Concurrency: ${c} ---`);
        
        console.log(`Testing Legacy /sync-full...`);
        const fullRes = await runAutocannon('http://localhost:3001/api/v2/sync-full', 'POST', fullPayload, token, c, 5);
        console.log(`[FULL SYNC] Req/sec: ${fullRes.requests.average.toFixed(2)} | Latency Avg: ${fullRes.latency.average.toFixed(2)}ms | Errors: ${fullRes.errors}`);
        
        console.log(`Testing New /marks (PATCH)...`);
        const patchRes = await runAutocannon(`http://localhost:3001/api/v2/courses/${courseId}/marks`, 'PATCH', patchPayload, token, c, 5);
        console.log(`[PARTIAL SYNC] Req/sec: ${patchRes.requests.average.toFixed(2)} | Latency Avg: ${patchRes.latency.average.toFixed(2)}ms | Errors: ${patchRes.errors}`);
        
        // Let event loop breathe
        await new Promise(r => setTimeout(r, 1000));
    }
}

runLoadTests().catch(console.error);
