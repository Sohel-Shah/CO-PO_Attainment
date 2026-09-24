const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const POS  = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11'];
const PSOS = ['PSO1','PSO2','PSO3'];
const ALL_POS = [...POS, ...PSOS];

function generateStudents() {
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
  return raw.map(([roll, name]) => ({
    id: roll, roll, name,
    rollNo: roll,
    year: 'FY (Sem VII)',
    semester: 'VII',
    academicYear: '2026-27',
    email: `${name.toLowerCase().replace(/[' ]/g, '.')}@spit.ac.in`,
  }));
}

const COURSE_OUTCOMES = [
  { id: 'CO1', desc: 'Understand the working of Vapour Compression refrigeration system.', bloom: 'L2' },
  { id: 'CO2', desc: 'Design the Vapour Compression refrigeration system for various applications.', bloom: 'L3' },
  { id: 'CO3', desc: 'Apply the knowledge of HVAC for multi-pressure systems.', bloom: 'L3' },
  { id: 'CO4', desc: 'Able to understand and apply the Psychrometry for air conditioning applications.', bloom: 'L3' },
  { id: 'CO5', desc: 'Able to design the duct for various air conditioning systems.', bloom: 'L4' },
];

const PROGRAM_OUTCOMES = [
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

const COPO_MAP = {
  CO1: { PO1:2,PO2:3,PO3:1,PO4:2,PO5:3,PO6:1,PO7:2,PO8:3,PO9:1,PO10:2,PO11:3, PSO1:1,PSO2:2,PSO3:3 },
  CO2: { PO1:3,PO2:1,PO3:2,PO4:3,PO5:1,PO6:2,PO7:3,PO8:1,PO9:2,PO10:3,PO11:1, PSO1:2,PSO2:3,PSO3:1 },
  CO3: { PO1:1,PO2:2,PO3:3,PO4:1,PO5:2,PO6:3,PO7:1,PO8:2,PO9:3,PO10:1,PO11:2, PSO1:3,PSO2:1,PSO3:2 },
  CO4: { PO1:2,PO2:3,PO3:1,PO4:2,PO5:3,PO6:1,PO7:2,PO8:3,PO9:1,PO10:2,PO11:3, PSO1:1,PSO2:2,PSO3:3 },
  CO5: { PO1:3,PO2:1,PO3:2,PO4:3,PO5:1,PO6:2,PO7:3,PO8:1,PO9:2,PO10:3,PO11:1, PSO1:2,PSO2:3,PSO3:1 },
};

const UNITS = [
  { id:'U1', unit:'I',   name:'Refrigeration Systems',   topics:'Vapour Compression and Vapour Absorption Systems — Cycle analysis, COP, multi-stage compression, flash chambers.', cos:['CO1','CO2'], bloom:'L2/L3', lectures:12 },
  { id:'U2', unit:'II',  name:'Refrigerants & Components', topics:'Refrigerant designation, selection, environment-friendly refrigerants; Condensers, Evaporators and Expansion Devices — construction and working.', cos:['CO2','CO3'], bloom:'L2/L3', lectures:12 },
  { id:'U3', unit:'III', name:'Refrigerant Compressors',  topics:'Types of compressors — reciprocating, rotary, scroll, centrifugal; Performance, volumetric efficiency, capacity control.', cos:['CO3','CO4'], bloom:'L2/L4', lectures:12 },
  { id:'U4', unit:'IV',  name:'Psychrometrics',           topics:'Properties of moist air, Psychrometric chart, Psychrometric processes — Mixing, Heating, Cooling, Humidification; Comfort conditions for AC.', cos:['CO1','CO4'], bloom:'L3/L5', lectures:12 },
  { id:'U5', unit:'V',   name:'Load Calculation & Duct Design', topics:'Cooling-load estimation — CLTD/CLF method; Applied Psychrometrics for AHU selection; Duct design — equal friction & velocity reduction methods.', cos:['CO4','CO5'], bloom:'L4/L5', lectures:12 },
];

function tp(week, lec, unit, topic, co, bloom) {
  return { id: `tp_${String(week).padStart(2,'0')}`, week, lecture: lec, unit, topic, cos: [co], bloom, pedagogy: 'Interactive Lecture / Problem Solving', activity: 'Discussion / Calculation', assessment: 'Quiz / TA / Assignment', date: '', status: 'Not Started' };
}
const TEACHING_PLAN = [
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

const PEDAGOGY_TOOLS = [
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

const REFERENCES = {
  textbooks: ['Arora R.C., Refrigeration and Air Conditioning, PHI'],
  refBooks: [
    'Threlkeld J.L., Thermal Environmental Engineering, Prentice Hall Inc. New Delhi',
    'ASHRAE Handbook (HVAC Equipments)', 
    'Stocker W.F. and Jones J.W., Refrigeration and Air-conditioning, McGraw Hill'
  ],
  standards: ['BIS Codes, ASME Standards, ISO Standards (where applicable)'],
};

const EXAM_PAPERS = {
  T1: { label: 'T1', weight: 7, date: '2026-08-20', time: '10:00', durationMinutes: 60, questions: [
      { id:'T1Q1', no:'Q 1', subQuestion:'a', text:'Define COP. Derive expression for COP of VCRS.', max:3, cos:['CO1'], bloom:'L2' },
      { id:'T1Q2', no:'', subQuestion:'b', text:'Advantages of vapour compression over air refrigeration.', max:2, cos:['CO1'], bloom:'L2' },
      { id:'T1Q3', no:'', subQuestion:'c', text:'Classify refrigerants and list two examples.', max:2, cos:['CO2'], bloom:'L2' },
  ]},
  T2: { label: 'T2', weight: 7, date: '2026-09-18', time: '10:00', durationMinutes: 60, questions: [
      { id:'T2Q1', no:'Q 1', subQuestion:'a', text:'Working of a reciprocating compressor with sketch.', max:3, cos:['CO3'], bloom:'L2' },
      { id:'T2Q2', no:'', subQuestion:'b', text:'Define psychrometry. Explain any two processes.', max:2, cos:['CO4'], bloom:'L2' },
      { id:'T2Q3', no:'', subQuestion:'c', text:'What is relative humidity? Derive its relation.', max:2, cos:['CO4'], bloom:'L3' },
  ]},
  T3: { label: 'T3', weight: 6, date: '2026-10-22', time: '10:00', durationMinutes: 60, questions: [
      { id:'T3Q1', no:'Q 1', subQuestion:'a', text:'Explain CLTD/CLF method.', max:3, cos:['CO5'], bloom:'L3' },
      { id:'T3Q2', no:'', subQuestion:'b', text:'Compare equal friction and velocity reduction.', max:3, cos:['CO5'], bloom:'L4' },
  ]},
  MSE: { label: 'MSE', weight: 30, date: '2026-10-05', time: '09:30', durationMinutes: 150, questions: [
      { id:'MSQ1', no:'Q 1', subQuestion:'a', text:'', max:5, cos:['CO1'], bloom:'L2' },
      { id:'MSQ2', no:'', subQuestion:'b', text:'', max:5, cos:['CO1'], bloom:'L2' },
      { id:'MSQ3', no:'', subQuestion:'c', text:'', max:5, cos:['CO2'], bloom:'L3' },
      { id:'MSQ4', no:'Q 2', subQuestion:'a', text:'', max:5, cos:['CO2'], bloom:'L3' },
      { id:'MSQ5', no:'', subQuestion:'b', text:'', max:5, cos:['CO3'], bloom:'L2' },
      { id:'MSQ6', no:'', subQuestion:'c', text:'', max:5, cos:['CO3'], bloom:'L2' },
  ]},
  ESE: { label: 'ESE', weight: 50, date: '2026-11-28', time: '09:30', durationMinutes: 180, questions: [
      { id:'ESQ1', no:'Q 1', subQuestion:'a', text:'Explain vapour absorption system.', max:10, cos:['CO1'], bloom:'L2' },
      { id:'ESQ2', no:'', subQuestion:'b', text:'An ice plant produces 10 tonnes of ice.', max:10, cos:['CO2'], bloom:'L4' },
      { id:'ESQ3', no:'', subQuestion:'c', text:'Working of centrifugal compressor.', max:10, cos:['CO3'], bloom:'L2' },
      { id:'ESQ4', no:'Q 2', subQuestion:'a', text:'A room is maintained at 25C DBT.', max:10, cos:['CO4'], bloom:'L3' },
      { id:'ESQ5', no:'', subQuestion:'b', text:'Design a duct system.', max:10, cos:['CO5'], bloom:'L5' },
  ]}
};

function seedMarks(students, examPapers) {
  const marks = {};
  const lcg = (seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })(42);
  students.forEach((st, si) => {
    marks[st.id] = {};
    Object.entries(examPapers).forEach(([, exam]) => {
      exam.questions.forEach(q => {
        const tier = si < 10 ? 0.72 : si < 20 ? 0.58 : 0.42;
        const raw = Math.round((tier + (lcg() - 0.5) * 0.25) * q.max);
        marks[st.id][q.id] = Math.max(0, Math.min(q.max, raw));
      });
    });
  });
  return marks;
}

function generateAttendance() {
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

function generateFeedback() {
  const students = generateStudents();
  const lcg = (seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })(7);
  return students.map(st => ({
    id: `fb_${st.id}`, respondent: st.name,
    ratings: {
      CO1: Math.round(3 + lcg() * 2), CO2: Math.round(3 + lcg() * 2),
      CO3: Math.round(2.5 + lcg() * 2.5), CO4: Math.round(3 + lcg() * 2), CO5: Math.round(2.5 + lcg() * 2.5),
    },
  }));
}

const STUDENTS = generateStudents();
const ALL_MARKS = seedMarks(STUDENTS, EXAM_PAPERS);
const ATTENDANCE = generateAttendance();
const FEEDBACK = generateFeedback();

async function main() {
  console.log('Seeding data...');

  // 1. Faculty
  const faculty = await prisma.faculty.upsert({
    where: { email: 'a.sharma@spit.ac.in' },
    update: {},
    create: {
      name: 'Dr. A. Sharma',
      email: 'a.sharma@spit.ac.in',
      department: 'Mechanical Engineering (ME)'
    }
  });

  // 2. Course
  const courseIdStr = 'course_ME701_RAC';
  await prisma.course.deleteMany({ where: { courseId: courseIdStr } });

  const course = await prisma.course.create({
    data: {
      courseId: courseIdStr,
      name: 'Refrigeration and Air Conditioning',
      code: 'ME-701',
      programName: 'B.Tech Mechanical Engineering',
      semester: 'VII',
      academicYear: '2026-27',
      facultyId: faculty.id,
      credits: 3,
      courseType: 'PCC',
      department: 'Mechanical Engineering (ME)',
      totalStudents: 30,
      coTargetPct: 60,
      directWeight: 80,
      indirectWeight: 20,
      teachingPlan: TEACHING_PLAN,
      units: UNITS,
      pedagogyTools: PEDAGOGY_TOOLS,
      references: REFERENCES,
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
      }
    }
  });

  // 3. POs
  for (const po of PROGRAM_OUTCOMES) {
    await prisma.pO.upsert({
      where: { poId: po.id },
      update: {},
      create: { poId: po.id, description: po.desc, type: po.id.startsWith('PSO') ? 'PSO' : 'PO' }
    });
  }

  // 4. COs & COPOMappings
  const dbCOs = {};
  for (const co of COURSE_OUTCOMES) {
    const dbCo = await prisma.courseOutcome.create({
      data: { courseId: course.id, coNumber: co.id, description: co.desc, bloomLevel: co.bloom }
    });
    dbCOs[co.id] = dbCo.id;

    for (const poId of Object.keys(COPO_MAP[co.id])) {
      const val = COPO_MAP[co.id][poId];
      if (val > 0) {
        const dbPo = await prisma.pO.findUnique({ where: { poId: poId } });
        if (dbPo) {
          await prisma.cOPOMapping.create({
            data: { courseOutcomeId: dbCo.id, poId: dbPo.id, correlationLevel: val }
          });
        }
      }
    }
  }

  // 5. Students & Enrollments
  const dbStudents = {};
  for (const st of STUDENTS) {
    const student = await prisma.student.upsert({
      where: { rollNumber: st.roll },
      update: {},
      create: { rollNumber: st.roll, name: st.name, email: st.email, batchYear: st.academicYear }
    });
    dbStudents[st.id] = student.id;

    await prisma.enrollment.create({
      data: { studentId: student.id, courseId: course.id }
    });
  }

  // 6. Exams & QuestionPapers & Questions
  const dbQuestions = {}; // { q.id -> dbQ.id }
  for (const [key, ex] of Object.entries(EXAM_PAPERS)) {
    const dbExam = await prisma.exam.create({
      data: {
        courseId: course.id,
        title: ex.label,
        type: key,
        totalMarks: ex.weight,
        date: ex.date ? new Date(ex.date) : null,
        duration: `${ex.durationMinutes} min`,
        academicYear: course.academicYear
      }
    });

    const dbPaper = await prisma.questionPaper.create({
      data: {
        courseId: course.id,
        title: `${ex.label} Paper`,
        type: key,
        totalMarks: ex.weight,
        date: ex.date,
        duration: `${ex.durationMinutes} min`,
      }
    });

    for (const q of ex.questions) {
      const coDbId = dbCOs[q.cos[0]]; 
      const dbQ = await prisma.question.create({
        data: {
          examId: dbExam.id,
          label: q.no || "",
          subQuestion: q.subQuestion || null,
          maxMarks: q.max,
          questionText: q.text || "",
          bloomLevel: q.bloom || null,
          courseOutcomeId: coDbId
        }
      });
      
      await prisma.questionPaperQuestion.create({
        data: {
          paperId: dbPaper.id,
          section: 'Section A',
          label: q.no || null,
          subQuestion: q.subQuestion || null,
          questionText: q.text || "",
          bloomLevel: q.bloom || null,
          marks: q.max,
          type: 'short',
          courseOutcomeId: coDbId
        }
      });
      
      dbQuestions[q.id] = dbQ.id;
    }
  }

  // 7. Marks
  for (const stId of Object.keys(ALL_MARKS)) {
    for (const qId of Object.keys(ALL_MARKS[stId])) {
      const mark = ALL_MARKS[stId][qId];
      await prisma.mark.create({
        data: {
          studentId: dbStudents[stId],
          questionId: dbQuestions[qId],
          marksObtained: mark,
          academicYear: course.academicYear
        }
      });
    }
  }

  // 8. Attendance
  for (const tpId of Object.keys(ATTENDANCE)) {
    for (const stId of Object.keys(ATTENDANCE[tpId])) {
      const status = ATTENDANCE[tpId][stId];
      if (status) {
        await prisma.attendance.create({
          data: {
            courseId: course.id,
            studentId: dbStudents[stId],
            key: tpId,
            status: status
          }
        });
      }
    }
  }

  // 9. Feedback
  for (const fb of FEEDBACK) {
    const stId = fb.id.replace('fb_', '');
    for (const coId of Object.keys(fb.ratings)) {
      await prisma.feedback.create({
        data: {
          studentId: dbStudents[stId],
          courseOutcomeId: dbCOs[coId],
          rating: fb.ratings[coId],
          category: 'Course Exit'
        }
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
