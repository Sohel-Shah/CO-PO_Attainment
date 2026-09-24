const prisma = require('./shared/database.js');
const jwtLib = require('jsonwebtoken');
const http   = require('http');

const SECRET = 'cms_sohel_super_secret_jwt_key_2026_xK9mP3qR7nL2vT8';
const adminToken = jwtLib.sign(
  { id: 'test-admin', email: 'admin@test.com', role: 'admin', name: 'Admin' },
  SECRET, { expiresIn: '1h' }
);

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3001,
      path, method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type':  'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('\n══════════════════════════════════════════');
  console.log('    ACADEMIC PLANNER PERSISTENCE DIAGNOSIS');
  console.log('══════════════════════════════════════════\n');

  // 1. Check table exists and columns
  try {
    const tableCheck = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='academic_plan'"
    );
    console.log('1. Table "academic_plan" exists:', tableCheck.length > 0 ? '✅ YES' : '❌ NO');

    if (tableCheck.length > 0) {
      const cols = await prisma.$queryRawUnsafe(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='academic_plan' ORDER BY ordinal_position"
      );
      console.log('   Columns:', cols.map(c => `${c.column_name}(${c.data_type})`).join(', '));

      const count = await prisma.$queryRawUnsafe('SELECT COUNT(*) as n FROM academic_plan');
      console.log('   Existing rows:', count[0].n);
      
      // Show current data
      const rows = await prisma.$queryRawUnsafe('SELECT department, "updatedAt" FROM academic_plan LIMIT 5');
      console.log('   Rows:', JSON.stringify(rows));
    }
  } catch (e) {
    console.error('❌ DB direct query failed:', e.message);
  }

  // 2. Test GET API
  console.log('\n2. Testing GET /api/v2/academic-planner (admin token)...');
  try {
    const getResult = await apiCall('GET', '/api/v2/academic-planner', null, adminToken);
    console.log('   Status:', getResult.status, getResult.status === 200 ? '✅' : '❌');
    console.log('   Programs count:', getResult.body.programs?.length ?? 'N/A');
    console.log('   Faculty count:', getResult.body.faculty?.length ?? 'N/A');
  } catch (e) {
    console.error('   ❌ GET failed:', e.message);
  }

  // 3. Test PUT (save plan)
  console.log('\n3. Testing PUT /api/v2/academic-planner (save test data)...');
  const testPayload = {
    department: 'default',
    academicYears: [{ id: 'ay-diag-1', label: '2026-27 [DIAG TEST]' }],
    programs: [{
      id: 'prog-diag-1', name: 'B.Tech CE [DIAG]', type: 'UG4',
      major: 'Computer Engineering', totalTarget: 160, semMin: 20, semMax: 26, divisions: 2,
      semesters: [{ sem: 1, courses: [{ id: 'c-diag-1', title: 'Math I', code: 'MAT101', category: 'BSC', L: 3, T: 1, P: 0, S: 0, credits: 4 }] }]
    }],
    faculty: [{ id: 'fac-diag-1', name: 'Dr. Diagnostic Faculty', designation: 'Prof', maxLoad: 16 }],
    timetable: [], versions: [], framework: null, calendar: [], exportSettings: null
  };
  try {
    const putResult = await apiCall('PUT', '/api/v2/academic-planner', testPayload, adminToken);
    console.log('   Status:', putResult.status, putResult.status === 200 ? '✅' : '❌');
    console.log('   Response:', JSON.stringify(putResult.body));
  } catch (e) {
    console.error('   ❌ PUT failed:', e.message);
  }

  // 4. Verify DB was written (direct query)
  console.log('\n4. Verifying DB after PUT (direct Prisma query)...');
  try {
    const rows = await prisma.$queryRawUnsafe('SELECT id, department, programs, faculty, "updatedAt" FROM academic_plan WHERE department = $1 LIMIT 1', 'default');
    if (rows.length > 0) {
      const row = rows[0];
      const progs = typeof row.programs === 'string' ? JSON.parse(row.programs) : row.programs;
      const facs  = typeof row.faculty === 'string' ? JSON.parse(row.faculty) : row.faculty;
      console.log('   ✅ Row found in DB');
      console.log('   Programs in DB:', progs?.length ?? 0);
      console.log('   Faculty in DB:', facs?.length ?? 0);
      console.log('   Updated at:', row.updatedAt);
    } else {
      console.log('   ❌ NO ROW FOUND IN DB — data was NOT persisted!');
    }
  } catch (e) {
    console.error('   ❌ DB verify failed:', e.message);
  }

  // 5. Verify GET reads the written data
  console.log('\n5. Testing GET again after PUT...');
  try {
    const getResult2 = await apiCall('GET', '/api/v2/academic-planner', null, adminToken);
    console.log('   Status:', getResult2.status, getResult2.status === 200 ? '✅' : '❌');
    console.log('   Programs count after PUT:', getResult2.body.programs?.length ?? 'N/A');
    const hasDiagProg = getResult2.body.programs?.some(p => p.name?.includes('DIAG'));
    console.log('   Diagnostic program returned:', hasDiagProg ? '✅ YES' : '❌ NO');
  } catch (e) {
    console.error('   ❌ GET after PUT failed:', e.message);
  }

  // 6. Test security — non-admin should get 403
  console.log('\n6. Testing non-admin access (should be 403)...');
  const facultyToken = jwtLib.sign(
    { id: 'fac1', email: 'fac@test.com', role: 'faculty', name: 'Faculty' },
    SECRET, { expiresIn: '1h' }
  );
  try {
    const forbidResult = await apiCall('GET', '/api/v2/academic-planner', null, facultyToken);
    console.log('   Status:', forbidResult.status, forbidResult.status === 403 ? '✅ (403 as expected)' : `❌ Unexpected ${forbidResult.status}`);
  } catch (e) {
    console.error('   Error:', e.message);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('    DIAGNOSIS COMPLETE');
  console.log('══════════════════════════════════════════\n');
  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
