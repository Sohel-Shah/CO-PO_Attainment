// ============================================================
//  SOURCE OF TRUTH — Refrigeration & Air Conditioning (RAC)
//  Derived from source_of_truth.html (shared by faculty)
// ============================================================

const POS  = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11'];
const PSOS = ['PSO1','PSO2','PSO3'];
export const ALL_POS = [...POS, ...PSOS];

// --- 30 real students (B.Tech Mech, Sem VII, 2026-27) ---
export function generateStudents() {
  const raw = [
    ['220870001', 'Aarav Mehta'],       ['220870002', 'Bhavna Patil'],
    ['220870003', 'Chirag Desai'],      ['220870004', 'Deepika Nair'],
    ['220870005', 'Eshan Kulkarni'],    ['220870006', 'Farida Shaikh'],
    ['220870007', 'Gaurav Sharma'],     ['220870008', 'Harsha Joshi'],
    ['220870009', 'Ishaan Rao'],        ['220870010', 'Juhi Pandey'],
    ['220870011', 'Keval Shah'],        ['220870012', 'Lakshmi Iyer'],
    ['220870013', 'Manav Thakur'],      ['220870014', 'Nisha Verma'],
    ['220870015', 'Om Sawant'],         ['220870016', 'Pallavi Ghosh'],
    ['220870017', 'Qasim Khan'],        ['220870018', 'Riya Chavan'],
    ['220870019', 'Sarthak More'],      ['220870020', 'Tanvi Dalvi'],
    ['220870021', 'Uday Hegde'],        ['220870022', 'Vaishnavi Gaikwad'],
    ['220870023', 'Waqar Ansari'],      ['220870024', 'Xena D\'Souza'],
    ['220870025', 'Yash Borse'],        ['220870026', 'Zara Qureshi'],
    ['220870027', 'Arjun Kale'],        ['220870028', 'Bhumi Pawar'],
    ['220870029', 'Chinmay Naik'],      ['220870030', 'Devika Pillai'],
  ];
  return raw.map(([roll, name], idx) => {
    const mobileNum = `9823${String(100000 + (parseInt(roll.slice(-3), 10) || idx) * 127).slice(0, 6)}`;
    return {
      id: roll, roll, name,
      rollNo: roll,
      misNo: roll,
      mis: roll,
      mobile: mobileNum,
      phone: mobileNum,
      year: 'FY (Sem VII)',
      semester: 'VII',
      admission: '2023-24',
      academicYear: '2026-27',
      acadYear: '2026-27',
      classIds: ['RAC_2627'],
      email: `${name.toLowerCase().replace(/[' ]/g, '.')}@spit.ac.in`,
    };
  });
}

// --- 6 Course Outcomes (Refrigeration & AC) ---
export const COURSE_OUTCOMES = [
  { id: 'CO1', desc: 'Understand the working of Vapour Compression refrigeration system.', bloom: 'L2' },
  { id: 'CO2', desc: 'Design the Vapour Compression refrigeration system for various applications.', bloom: 'L3' },
  { id: 'CO3', desc: 'Apply the knowledge of HVAC for multi-pressure systems.', bloom: 'L3' },
  { id: 'CO4', desc: 'Able to understand and apply the Psychrometry for air conditioning applications.', bloom: 'L3' },
  { id: 'CO5', desc: 'Able to design the duct for various air conditioning systems.', bloom: 'L4' },
  { id: 'CO6', desc: 'Evaluate heat loads and select energy efficient HVAC components and refrigeration cycles.', bloom: 'L5' },
];

export const PROGRAM_OUTCOMES = [
  { id: 'PO1',  desc: 'Engineering Knowledge' },
  { id: 'PO2',  desc: 'Problem Analysis' },
  { id: 'PO3',  desc: 'Design/Development of Solutions' },
  { id: 'PO4',  desc: 'Conduct Investigations of Complex Problems' },
  { id: 'PO5',  desc: 'Modern Tool Usage' },
  { id: 'PO6',  desc: 'Engineer and Society' },
  { id: 'PO7',  desc: 'Environment & Sustainability' },
  { id: 'PO8',  desc: 'Ethics' },
  { id: 'PO9',  desc: 'Individual & Team Work' },
  { id: 'PO10', desc: 'Communication' },
  { id: 'PO11', desc: 'Project Management & Finance' },
  { id: 'PSO1', desc: 'Thermal & Fluid Systems' },
  { id: 'PSO2', desc: 'Refrigeration & HVAC Design' },
  { id: 'PSO3', desc: 'Energy Audit & Conservation' },
];

// CO-PO Articulation Matrix (from source_of_truth.html)
// CO1:[2,3,1,2,3,1,2,3,1,2,3, 1,2,3]
// CO2:[3,1,2,3,1,2,3,1,2,3,1, 2,3,1]
// CO3:[1,2,3,1,2,3,1,2,3,1,2, 3,1,2]
// CO4:[2,3,1,2,3,1,2,3,1,2,3, 1,2,3]
// CO5:[3,1,2,3,1,2,3,1,2,3,1, 2,3,1]
export const COPO_MAP = {
  CO1: { PO1:2,PO2:3,PO3:1,PO4:2,PO5:3,PO6:1,PO7:2,PO8:3,PO9:1,PO10:2,PO11:3, PSO1:1,PSO2:2,PSO3:3 },
  CO2: { PO1:3,PO2:1,PO3:2,PO4:3,PO5:1,PO6:2,PO7:3,PO8:1,PO9:2,PO10:3,PO11:1, PSO1:2,PSO2:3,PSO3:1 },
  CO3: { PO1:1,PO2:2,PO3:3,PO4:1,PO5:2,PO6:3,PO7:1,PO8:2,PO9:3,PO10:1,PO11:2, PSO1:3,PSO2:1,PSO3:2 },
  CO4: { PO1:2,PO2:3,PO3:1,PO4:2,PO5:3,PO6:1,PO7:2,PO8:3,PO9:1,PO10:2,PO11:3, PSO1:1,PSO2:2,PSO3:3 },
  CO5: { PO1:3,PO2:1,PO3:2,PO4:3,PO5:1,PO6:2,PO7:3,PO8:1,PO9:2,PO10:3,PO11:1, PSO1:2,PSO2:3,PSO3:1 },
};

// --- Unit-wise Syllabus (5 units) ---
export const UNITS = [
  { id:'U1', unit:'I',   name:'Refrigeration Systems',   topics:'Vapour Compression and Vapour Absorption Systems — Cycle analysis, COP, multi-stage compression, flash chambers.', cos:['CO1','CO2'], bloom:'L2/L3', lectures:12 },
  { id:'U2', unit:'II',  name:'Refrigerants & Components', topics:'Refrigerant designation, selection, environment-friendly refrigerants; Condensers, Evaporators and Expansion Devices — construction and working.', cos:['CO2','CO3'], bloom:'L2/L3', lectures:12 },
  { id:'U3', unit:'III', name:'Refrigerant Compressors',  topics:'Types of compressors — reciprocating, rotary, scroll, centrifugal; Performance, volumetric efficiency, capacity control.', cos:['CO3','CO4'], bloom:'L2/L4', lectures:12 },
  { id:'U4', unit:'IV',  name:'Psychrometrics',           topics:'Properties of moist air, Psychrometric chart, Psychrometric processes — Mixing, Heating, Cooling, Humidification; Comfort conditions for AC.', cos:['CO1','CO4'], bloom:'L3/L5', lectures:12 },
  { id:'U5', unit:'V',   name:'Load Calculation & Duct Design', topics:'Cooling-load estimation — CLTD/CLF method; Applied Psychrometrics for AHU selection; Duct design — equal friction & velocity reduction methods.', cos:['CO4','CO5'], bloom:'L4/L5', lectures:12 },
];

// --- Teaching Plan (15 lectures) ---
function tp(week, lec, unit, topic, co, bloom) {
  return {
    id: `tp_${String(week).padStart(2,'0')}`,
    week, lecture: lec, unit, topic, cos: [co], bloom,
    pedagogy: 'Interactive Lecture / Problem Solving',
    activity: 'Discussion / Calculation',
    assessment: 'Quiz / TA / Assignment',
    date: '', status: 'Not Started',
  };
}
export const TEACHING_PLAN = [
  tp( 1,  1,'I',  'Refrigeration Systems: Vapour Compression and Vapour Absorption.','CO2','L2/L3'),
  tp( 2,  2,'I',  'Refrigerants: Designation, Selection, Environment friendly refrigerants.','CO3','L2/L3'),
  tp( 3,  3,'I',  'Refrigerant Compressors: Types, Performance, Capacity Control.','CO4','L2/L3'),
  tp( 4,  4,'II', 'Condensers, Evaporators and Expansion Devices: Construction and working.','CO5','L2/L3'),
  tp( 5,  5,'II', 'Psychrometrics of Air-Conditioning Processes: Properties, Mixing, Comfort conditions.','CO1','L2/L3'),
  tp( 6,  6,'II', 'Load Calculation and Applied Psychrometrics: Cooling-load Estimate, Duct design.','CO2','L2/L3'),
  tp( 7,  7,'III','Refrigeration Systems: Vapour Compression and Vapour Absorption.','CO3','L2/L3'),
  tp( 8,  8,'III','Refrigerants: Designation, Selection, Environment friendly refrigerants.','CO4','L2/L3'),
  tp( 9,  9,'III','Refrigerant Compressors: Types, Performance, Capacity Control.','CO5','L2/L3'),
  tp(10, 10,'IV', 'Condensers, Evaporators and Expansion Devices: Construction and working.','CO1','L2/L3'),
  tp(11, 11,'IV', 'Psychrometrics of Air-Conditioning Processes: Properties, Mixing, Comfort conditions.','CO2','L2/L3'),
  tp(12, 12,'IV', 'Load Calculation and Applied Psychrometrics: Cooling-load Estimate, Duct design.','CO3','L2/L3'),
  tp(13, 13,'V',  'Refrigeration Systems: Vapour Compression and Vapour Absorption.','CO4','L2/L3'),
  tp(14, 14,'V',  'Refrigerants: Designation, Selection, Environment friendly refrigerants.','CO5','L2/L3'),
  tp(15, 15,'V',  'Refrigerant Compressors: Types, Performance, Capacity Control.','CO1','L2/L3'),
];

// --- Pedagogy Tools (11 methods) ---
export const PEDAGOGY_TOOLS = [
  { id:'pd_1',  method:'Interactive Lecture',         frequency:10, units:['I','II','III','IV','V'], topics:'Core concepts',                         strategy:'PPTs, animations, Q&A',                   cos:['CO1','CO2'],                     bloom:'L1-L2', evidence:'Attendance, Notes' },
  { id:'pd_2',  method:'Demonstration Method',         frequency:8,  units:['II','III','IV'],         topics:'Tools/Software/Machinery',              strategy:'Live demonstration',                      cos:['CO2','CO3'],                     bloom:'L2-L3', evidence:'Lab Observation Sheet' },
  { id:'pd_3',  method:'Learning by Doing',            frequency:12, units:['I','II','III','IV','V'], topics:'Calculations, drafting, programming',    strategy:'Individual performance',                  cos:['CO2','CO4'],                     bloom:'L3-L4', evidence:'Lab Records' },
  { id:'pd_4',  method:'Problem-Based Learning (PBL)', frequency:5,  units:['II','IV'],               topics:'Complex Problems',                       strategy:'Engineering problem solving',             cos:['CO3','CO4'],                     bloom:'L4-L5', evidence:'Solution Sheets' },
  { id:'pd_5',  method:'Project-Based Learning',       frequency:3,  units:['V'],                     topics:'Integration Project',                    strategy:'Design to manufacturing',                cos:['CO5'],                           bloom:'L5-L6', evidence:'Project Report' },
  { id:'pd_6',  method:'Peer Learning',                frequency:4,  units:['II','III'],              topics:'Reviews, Discussions',                   strategy:'Work in pairs/groups',                   cos:['CO2','CO3'],                     bloom:'L3-L4', evidence:'Peer Review Forms' },
  { id:'pd_7',  method:'Flipped Classroom',            frequency:2,  units:['I','IV'],                topics:'History, Concepts',                      strategy:'Watch videos before class',              cos:['CO1'],                           bloom:'L2-L3', evidence:'Quiz Scores' },
  { id:'pd_8',  method:'Case Study Method',            frequency:4,  units:['III','V'],               topics:'Industry applications',                  strategy:'Faculty presents cases',                 cos:['CO3','CO4'],                     bloom:'L4-L5', evidence:'Case Study Reports' },
  { id:'pd_9',  method:'Industry Video Analysis',      frequency:5,  units:['I','V'],                 topics:'Modern techniques',                      strategy:'Guided discussion',                      cos:['CO1','CO4'],                     bloom:'L2-L4', evidence:'Reflection Reports' },
  { id:'pd_10', method:'AI-Assisted Learning',         frequency:10, units:['I','II','III','IV','V'], topics:'Optimization, Code generation',          strategy:'Use of LLMs with verification',          cos:['CO1','CO2','CO3','CO4','CO5'],   bloom:'L2-L6', evidence:'AI Prompt Sheet' },
  { id:'pd_11', method:'Reflective Learning',          frequency:3,  units:['V'],                     topics:'Course Review',                          strategy:'Reflective journals',                    cos:['CO5'],                           bloom:'L5-L6', evidence:'Reflection Diary' },
];

// --- References ---
export const REFERENCES = {
  textbooks: [
    'Arora R.C., Refrigeration and Air Conditioning, PHI',
  ],
  refBooks: [
    'Threlkeld J.L., Thermal Environmental Engineering, Prentice Hall Inc. New Delhi',
    'ASHRAE Handbook (HVAC Equipments)',
    'Stocker W.F. and Jones J.W., Refrigeration and Air-conditioning, McGraw Hill',
  ],
  standards: [
    'BIS Codes, ASME Standards, ISO Standards (where applicable)',
  ],
};

// --- Exam Question Papers ---
// T1 – TA-1 (7 marks), T2 – TA-2 (7 marks), T3 – TA-3 (6 marks), MSE (30 marks), ESE (50 marks)
export const EXAM_PAPERS = {
  T1: {
    label: 'T1 — TA-1', weight: 7, date: '2026-08-20', time: '10:00', durationMinutes: 60,
    questions: [
      { id:'T1Q1', no:'Q 1', subQuestion:'a', text:'Define COP. Derive expression for COP of Vapour Compression Refrigeration cycle.', max:3, cos:['CO1'], bloom:'L2' },
      { id:'T1Q2', no:'', subQuestion:'b', text:'State and explain the advantages of vapour compression over air refrigeration.', max:2, cos:['CO1'], bloom:'L2' },
      { id:'T1Q3', no:'', subQuestion:'c', text:'Classify refrigerants and list two examples of eco-friendly refrigerants.', max:2, cos:['CO2'], bloom:'L2' },
    ],
  },
  T2: {
    label: 'T2 — TA-2', weight: 7, date: '2026-09-18', time: '10:00', durationMinutes: 60,
    questions: [
      { id:'T2Q1', no:'Q 1', subQuestion:'a', text:'Explain the working of a reciprocating compressor with a neat sketch.', max:3, cos:['CO3'], bloom:'L2' },
      { id:'T2Q2', no:'', subQuestion:'b', text:'Define psychrometry. Explain any two psychrometric processes.', max:2, cos:['CO4'], bloom:'L2' },
      { id:'T2Q3', no:'', subQuestion:'c', text:'What is relative humidity? Derive its relation with dew-point temperature.', max:2, cos:['CO4'], bloom:'L3' },
    ],
  },
  T3: {
    label: 'T3 — TA-3', weight: 6, date: '2026-10-22', time: '10:00', durationMinutes: 60,
    questions: [
      { id:'T3Q1', no:'Q 1', subQuestion:'a', text:'Explain CLTD/CLF method for cooling load estimation with an example.', max:3, cos:['CO5'], bloom:'L3' },
      { id:'T3Q2', no:'', subQuestion:'b', text:'Compare equal friction and velocity reduction methods of duct design.', max:3, cos:['CO5'], bloom:'L4' },
    ],
  },
  MSE: {
    label: 'MSE', weight: 30, date: '2026-10-05', time: '09:30', durationMinutes: 150,
    questions: [
      { id:'MSQ1', no:'Q 1', subQuestion:'a', text:'', max:5, cos:['CO1'], bloom:'L2' },
      { id:'MSQ2', no:'', subQuestion:'b', text:'', max:5, cos:['CO1'], bloom:'L2' },
      { id:'MSQ3', no:'', subQuestion:'c', text:'', max:5, cos:['CO2'], bloom:'L3' },
      { id:'MSQ4', no:'Q 2', subQuestion:'a', text:'', max:5, cos:['CO2'], bloom:'L3' },
      { id:'MSQ5', no:'', subQuestion:'b', text:'', max:5, cos:['CO3'], bloom:'L2' },
      { id:'MSQ6', no:'', subQuestion:'c', text:'', max:5, cos:['CO3'], bloom:'L2' },
    ],
  },
  ESE: {
    label: 'ESE', weight: 50, date: '2026-11-28', time: '09:30', durationMinutes: 180,
    questions: [
      { id:'ESQ1', no:'Q 1', subQuestion:'a', text:'Explain the vapour absorption refrigeration system with a P-h diagram.', max:10, cos:['CO1','CO2'], bloom:'L2' },
      { id:'ESQ2', no:'', subQuestion:'b', text:'An ice plant produces 10 tonnes of ice per day at 0°C from water at 30°C. Find the power of the plant (COP=2.5).', max:10, cos:['CO2'], bloom:'L4' },
      { id:'ESQ3', no:'', subQuestion:'c', text:'With a neat sketch, explain the working of centrifugal compressor for refrigeration.', max:10, cos:['CO3'], bloom:'L2' },
      { id:'ESQ4', no:'Q 2', subQuestion:'a', text:'A room is maintained at 25°C DBT and 50% RH. Outside condition is 38°C DBT. Find: specific humidity, dew point, enthalpy, and wet bulb temperature using Psychrometric chart.', max:10, cos:['CO4'], bloom:'L3' },
      { id:'ESQ5', no:'', subQuestion:'b', text:'Design a duct system for an air conditioning plant handling 3000 CFM. Use the equal friction method. Sketch the duct layout.', max:10, cos:['CO5'], bloom:'L5' },
    ],
  },
};

// --- Marks Entry for 30 students across all exams ---
// Realistic marks seeded deterministically
function seedMarks(students, examPapers) {
  const marks = {};
  // Seeded pseudo-random (avoids Math.random variability on each load)
  const lcg = (seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })(42);

  students.forEach((st, si) => {
    marks[st.id] = {};
    Object.entries(examPapers).forEach(([, exam]) => {
      exam.questions.forEach(q => {
        // Students in top-third score 70-100%, mid-third 50-70%, bottom-third 30-55%
        const tier = si < 10 ? 0.72 : si < 20 ? 0.58 : 0.42;
        const raw = Math.round((tier + (lcg() - 0.5) * 0.25) * q.max);
        marks[st.id][q.id] = Math.max(0, Math.min(q.max, raw));
      });
    });
  });
  return marks;
}

// --- Attendance (15 lectures × 30 students) ---
export function generateAttendance() {
  const students = generateStudents();
  const records = {};
  const lcg = (seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })(99);
  TEACHING_PLAN.forEach(row => {
    records[row.id] = {};
    students.forEach(s => {
      records[row.id][s.id] = lcg() > 0.12 ? 'P' : 'A';
    });
  });
  return records;
}

// --- Course Exit Feedback (30 responses, Likert 1-5 on each CO) ---
export function generateFeedback() {
  const students = generateStudents();
  const lcg = (seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })(7);
  return students.map(st => ({
    id: `fb_${st.id}`, respondent: st.name,
    ratings: {
      CO1: Math.round(3 + lcg() * 2),
      CO2: Math.round(3 + lcg() * 2),
      CO3: Math.round(2.5 + lcg() * 2.5),
      CO4: Math.round(3 + lcg() * 2),
      CO5: Math.round(2.5 + lcg() * 2.5),
    },
  }));
}

// --- PO Survey (alumni: 8, employer: 6, graduate: 10) ---
function genSurveyResponses(prefix, n, seed) {
  const lcg = (s => { let x = s; return () => { x=(x*1664525+1013904223)&0xffffffff; return (x>>>0)/0xffffffff; }; })(seed);
  const names = [
    'Anil Kulkarni','Bhavesh Jain','Chitra Rao','Divya Singh','Esha Mehta',
    'Farhan Sheikh','Geetika Tiwari','Harish Kumar','Isha Patel','Jayant More',
    'Kavita Ghosh','Lalit Sharma','Meera Pillai','Naveen Nair','Omkar Desai',
  ];
  return Array.from({length:n}, (_,i) => ({
    id: `${prefix}_${i+1}`,
    respondent: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i/names.length)+1}` : ''),
    ratings: Object.fromEntries(ALL_POS.map(po => [po, Math.round(2.5 + lcg() * 2.5)])),
  }));
}

// --- INIT export (drop-in replacement for old data.js) ---
const STUDENTS = generateStudents();
const ALL_MARKS = seedMarks(STUDENTS, EXAM_PAPERS);

export const INIT = {
  // ── Identity
  academicYear: '2026-27',
  department:   'Mechanical Engineering (ME)',
  programName:  'B.Tech',
  facultyName:  '',

  // ── Course metadata
  course: {
    name: 'Refrigeration and Air Conditioning',
    code: 'ME-701',
    program: 'B.Tech Mechanical Engineering',
    semester: 'VII',
    academicYear: '2026-27',
    faculty: '',
    credits: 3,
    cycle: 'CAY',
    courseNumber: 1,
    courseCategory: 'PCC',
    teachingScheme: { L: 2, P: 2, T: 0, S: 0 },
  },

  // ── CO / PO
  courseOutcomes:  COURSE_OUTCOMES,
  programOutcomes: PROGRAM_OUTCOMES,
  copoMap:         COPO_MAP,

  // ── Students & Roster
  students: STUDENTS,

  // ── Syllabus & Plan
  coursePlan: {
    course: 'Refrigeration and Air Conditioning',
    code:   'ME-701',
    credits: 3,
    ltp: '2-2-0',
    totalLectures: 60,
    totalPracticals: 30,
    totalTutorials: 0,
    units: UNITS,
    pedagogyTools: PEDAGOGY_TOOLS,
    references: REFERENCES,
  },
  units:        UNITS,
  teachingPlan: TEACHING_PLAN,
  pedagogyTools: PEDAGOGY_TOOLS,
  references:   REFERENCES,

  // ── Exams & Marks
  exams: [
    { id:'T1',  title:'T1 — TA-1',  name:'T1 — TA-1',  type:'Internal', totalMarks:7,  duration:'60 min', date:'2026-08-20' },
    { id:'T2',  title:'T2 — TA-2',  name:'T2 — TA-2',  type:'Internal', totalMarks:7,  duration:'60 min', date:'2026-09-18' },
    { id:'T3',  title:'T3 — TA-3',  name:'T3 — TA-3',  type:'Internal', totalMarks:6,  duration:'60 min', date:'2026-10-22' },
    { id:'MSE', title:'Mid Semester Exam', name:'MSE',  type:'Mid Semester', totalMarks:30, duration:'150 min', date:'2026-10-05' },
    { id:'ESE', title:'End Semester Exam', name:'ESE',  type:'End Semester', totalMarks:50, duration:'180 min', date:'2026-11-28' },
  ],
  papers: Object.entries(EXAM_PAPERS).map(([key, exam]) => ({
    id: key,
    title: exam.label,
    type: key.startsWith('T') ? 'Internal' : key === 'MSE' ? 'Mid Semester' : 'End Semester',
    totalMarks: exam.weight,
    duration: `${exam.durationMinutes} min`,
    date: exam.date,
    questions: exam.questions.map(q => ({
      id: q.id, q: q.no || "", subQuestion: q.subQuestion || "", questionText: q.text || "", marks: q.max, type: q.max <= 3 ? 'short' : 'long',
      co: q.cos[0], bloom: q.bloom || "",
    })),
  })),
  marksState: ALL_MARKS,

  // ── Attendance
  attendance: generateAttendance(),

  // ── Feedback & PO Survey
  feedback: generateFeedback(),
  poSurvey: {
    scale: 5,
    responses: {
      alumni:    genSurveyResponses('alum', 8,  11),
      employer:  genSurveyResponses('emp',  6,  17),
      graduate:  genSurveyResponses('grad', 10, 23),
    },
  },

  // ── CO Direct Scores (% attaining target per CO, for summary views)
  coDirectScores: {
    CO1: { internal: 74, midterm: 70, assignment: 80 },
    CO2: { internal: 67, midterm: 64, assignment: 72 },
    CO3: { internal: 60, midterm: 58, assignment: 66 },
    CO4: { internal: 72, midterm: 68, assignment: 76 },
    CO5: { internal: 64, midterm: 62, assignment: 70 },
  },
  coIndirect: { CO1: 76, CO2: 70, CO3: 63, CO4: 74, CO5: 66 },

  // ── Settings
  coTargetPct:  60,
  directWeight: 80,
  indirectWeight: 20,
  selectedExamType: 'End Semester',
  selectedSemester: 'Semester VII',

  settings: {
    targetPct: 60,
    levels: [ { level:3, pct:70 }, { level:2, pct:60 }, { level:1, pct:50 } ],
    poTarget: 2.0,
    attendanceThreshold: 75,
    weightDirect: 80,
    weightIndirect: 20,
    weightDirectPO: 80,
    weightIndirectPO: 20,
    poSurveyWeights: { alumni:34, employer:33, graduate:33 },
  },

  // ── Report meta
  report: {},
};
