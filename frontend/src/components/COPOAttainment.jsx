import React, { useState, useEffect } from 'react';
import { S } from '../utils/ui-utils';
import { combinedCOAttainment, finalPOAttainment } from '../utils/attainmentCalculator';

const ACADEMIC_YEARS = ["2023–24", "2024–25", "2025–26", "2026–27", "2027–28", "2028–29"];
const SUBJECTS_BY_SEMESTER = {
    "I": ["Mathematics I", "Mathematics II", "Applied Science I (Engineering Physics)", "Applied Science II (Engineering Chemistry)", "Applied Science III", "Engineering Sciences I (Engg. Graphics)", "Engineering Sciences II (Workshop)", "Engineering Sciences III", "Vocational Skills Enhancement Courses", "Ability Enhancement Courses", "Co-curricular / Liberal Learning Courses"],
    "II": ["Mathematics III", "Mathematics IV", "Applied Science III (Engineering Physics Lab)", "Applied Science IV (Engineering Chemistry Lab)", "Applied Science V", "Engineering Sciences IV", "Program Core Course", "Vocational Skills Enhancement Courses", "Ability Enhancement Courses", "Indian Knowledge System", "Co-curricular / Liberal Learning Course"],
    "III": ["Community Engagement Activity", "Community Engagement Activity / Field Project", "Constitution of India & Universal Human Values", "Design Thinking", "Engineering Thermodynamics", "Environmental Studies", "Indian Language: Sanskrit/Pali", "Machine Drawing & Geometric Modeling", "Manufacturing Technology", "Open Elective-I", "Principles of Economics", "Solid Mechanics"],
    "IV": ["Constitution of India and Universal Human Values", "Design of Machine Elements", "Entrepreneurship", "Environmental Studies", "Fluid Mechanics", "Indian Language: Pali", "Indian Language: Sanskrit", "Indian Language: Sanskrit/Pali", "Kinematics of Machines", "Multidisciplinary Minor I", "Numerical Methods and Programming Language", "Open Elective-II", "Principles of Entrepreneurship"],
    "V": ["Data Analytics", "Deep Learning", "Dynamics of Machine", "Heat Transfer", "Internship 1#", "Introduction to Aerospace Engineering", "Metrology & Measurement", "Multidisciplinary Minor II", "Open Elective Course III", "Program Elective Course-I", "Project-I"],
    "VI": ["Computer Aided Design and Manufacturing", "Finite Element Analysis", "Fluid Machinery", "Generative Design", "Mechanical System Design", "Multidisciplinary Minor-III", "Program Elective Course-II", "Project-II"],
    "VII": ["Energy Conversion", "Internship 2", "Internship 2#", "Multidisciplinary Minor IV", "Program Elective Course-III", "Project-III", "Refrigeration and Air Conditioning", "Research Methodology and IPR", "Vibration and Acoustics"],
    "VIII": ["Automotive Control Systems", "Condition Monitoring", "Hybrid and Electric Vehicles", "Industrial Engineering", "Internship 3", "Internship 3#", "Program Elective Course-IV", "Program Specific Elective-V", "Program Specific Elective-VI"],
};




const SEMESTER_META = [
    { roman: "I", label: "Semester I", sub: "F.Y.B.Tech · Level 4.5 · UG Certificate" },
    { roman: "II", label: "Semester II", sub: "F.Y.B.Tech · Level 4.5 · UG Certificate" },
    { roman: "III", label: "Semester III", sub: "S.Y.B.Tech · Level 5   · UG Regular" },
    { roman: "IV", label: "Semester IV", sub: "S.Y.B.Tech · Level 5   · UG Regular" },
    { roman: "V", label: "Semester V", sub: "T.Y.B.Tech · Level 5.5 · UG" },
    { roman: "VI", label: "Semester VI", sub: "T.Y.B.Tech · Level 5.5 · UG" },
    { roman: "VII", label: "Semester VII", sub: "B.Tech · Level 6 · UG" },
    { roman: "VIII", label: "Semester VIII", sub: "B.Tech · Level 6 · UG" },
];

const _E = ["Apply", "Analyze", "Evaluate", "Create", "Remember", "Understand"];
const COURSE_KNOWLEDGE_BASE = {
    "Engineering Thermodynamics": {
        bloom: ["Understand", "Analyze", "Evaluate", "Apply", "Apply"],
        coStatements: [
            "Explain the fundamental concepts of thermodynamics, laws of thermodynamics and their applications.",
            "Analyze the properties of pure substances and ideal gases using thermodynamic tables and charts.",
            "Evaluate the performance of various power and refrigeration cycles.",
            "Apply the principles of psychrometry and chemical reactions in thermodynamic systems.",
            "Apply the concept of exergy and its application in analyzing real-world thermodynamic processes.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 2, PO3: 1, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 2, PSO2: 0, PSO3: 1 },
            CO2: { PO1: 3, PO2: 3, PO3: 0, PO4: 2, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 0, PSO3: 1 },
            CO3: { PO1: 3, PO2: 3, PO3: 2, PO4: 0, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 2, PSO3: 2 },
            CO4: { PO1: 2, PO2: 2, PO3: 3, PO4: 0, PO5: 0, PO6: 1, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 0, PSO3: 1 },
            CO5: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 1 },
        },
    },
    "Solid Mechanics": {
        bloom: ["Analyze", "Apply", "Evaluate", "Analyze", "Evaluate"],
        coStatements: [
            "Analyze internal forces and stresses in structural members under various loading conditions.",
            "Apply the concept of strain and deformation to determine structural integrity.",
            "Evaluate shear force and bending moment diagrams for different beam configurations.",
            "Determine the deflection of beams and analyze torsion in circular shafts.",
            "Understand the theory of failure and apply it to basic mechanical design.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 0, PSO3: 0 },
            CO2: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 2, PSO2: 0, PSO3: 0 },
            CO3: { PO1: 3, PO2: 3, PO3: 2, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 2, PSO2: 2, PSO3: 0 },
            CO4: { PO1: 3, PO2: 3, PO3: 2, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 2, PSO2: 1, PSO3: 0 },
            CO5: { PO1: 3, PO2: 3, PO3: 3, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 3, PSO3: 0 },
        },
    },
    "Manufacturing Technology": {
        bloom: ["Understand", "Analyze", "Apply", "Understand", "Apply"],
        coStatements: [
            "Explain various manufacturing processes like casting, welding, and metal forming.",
            "Analyze the mechanics of metal cutting and evaluate tool life and surface finish.",
            "Identify various machine tools and understand their operations (Lathe, Milling, Drilling).",
            "Understand the principles of unconventional machining processes.",
            "Apply the concepts of CNC machining and additive manufacturing in modern production.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 0, PO3: 2, PO4: 0, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 3, PSO3: 0 },
            CO2: { PO1: 3, PO2: 3, PO3: 0, PO4: 3, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 2, PSO2: 2, PSO3: 0 },
            CO3: { PO1: 3, PO2: 0, PO3: 0, PO4: 0, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 2, PSO3: 0 },
            CO4: { PO1: 2, PO2: 0, PO3: 2, PO4: 0, PO5: 0, PO6: 1, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 2, PSO3: 0 },
            CO5: { PO1: 3, PO2: 0, PO3: 3, PO4: 2, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 3, PSO3: 3 },
        },
    },
    "Fluid Mechanics": {
        bloom: ["Remember", "Analyze", "Apply", "Evaluate", "Understand"],
        coStatements: [
            "Identify various properties of fluids and understand fluid statics principles.",
            "Analyze fluid flow using kinematics and dynamics equations (Bernoulli's, Euler's).",
            "Apply dimensional analysis and similarity principles for hydraulic modeling.",
            "Evaluate head losses in pipe flows and analyze flow through various conduits.",
            "Understand boundary layer concepts and lift/drag forces on immersed bodies.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 0, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 0, PSO3: 2 },
            CO2: { PO1: 3, PO2: 3, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 2, PSO2: 0, PSO3: 3 },
            CO3: { PO1: 3, PO2: 3, PO3: 2, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 0, PSO3: 2 },
            CO4: { PO1: 2, PO2: 0, PO3: 0, PO4: 3, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 2, PSO3: 2 },
            CO5: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 0, PSO3: 3 },
        },
    },
    "Heat Transfer": {
        bloom: ["Apply", "Analyze", "Evaluate", "Create", "Apply"],
        coStatements: [
            "Apply the fundamental laws of heat conduction and solve 1D steady-state and transient heat conduction problems.",
            "Analyze convective heat transfer in internal and external flows using relevant empirical correlations.",
            "Evaluate radiation heat transfer between surfaces and apply view factor and enclosure radiation concepts.",
            "Design and analyze heat exchangers using LMTD and NTU-effectiveness methods.",
            "Apply the analogy between heat and mass transfer to solve integrated thermal system problems.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 2, PO3: 1, PO4: 1, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 2, PSO2: 0, PSO3: 3 },
            CO2: { PO1: 3, PO2: 3, PO3: 2, PO4: 2, PO5: 1, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 0, PO11: 0, PO12: 1, PSO1: 2, PSO2: 0, PSO3: 3 },
            CO3: { PO1: 3, PO2: 2, PO3: 2, PO4: 1, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 1, PSO2: 0, PSO3: 3 },
            CO4: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 3, PSO2: 1, PSO3: 3 },
            CO5: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 1, PO7: 1, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 2, PSO2: 1, PSO3: 3 },
        },
    },
    "Dynamics of Machine": {
        bloom: ["Understand", "Analyze", "Apply", "Analyze", "Evaluate"],
        coStatements: [
            "Understand the concepts of force analysis in mechanisms and machines.",
            "Analyze static and dynamic force distribution in machine components.",
            "Apply the principles of balancing of rotating and reciprocating masses.",
            "Analyze vibration characteristics of single degree of freedom systems.",
            "Evaluate gyroscopic effects and their applications in engineering systems.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 1, PSO3: 1 },
            CO2: { PO1: 3, PO2: 3, PO3: 1, PO4: 1, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 1, PSO3: 1 },
            CO3: { PO1: 3, PO2: 3, PO3: 2, PO4: 1, PO5: 1, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 1, PSO3: 0 },
            CO4: { PO1: 3, PO2: 3, PO3: 2, PO4: 1, PO5: 1, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 3, PSO2: 2, PSO3: 0 },
            CO5: { PO1: 3, PO2: 2, PO3: 3, PO4: 1, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 3, PSO2: 2, PSO3: 0 },
        },
    },
    "Refrigeration and Air Conditioning": {
        bloom: ["Understand", "Apply", "Analyze", "Evaluate", "Apply"],
        coStatements: [
            "Understand the principles of refrigeration and the various refrigeration cycles.",
            "Apply the concepts of vapour compression refrigeration system analysis.",
            "Analyze the psychometric properties of moist air for HVAC applications.",
            "Evaluate the performance of cooling and dehumidification systems.",
            "Apply refrigerant selection criteria and design of refrigeration components.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 0, PSO3: 3 },
            CO2: { PO1: 3, PO2: 3, PO3: 2, PO4: 1, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 1, PSO2: 0, PSO3: 3 },
            CO3: { PO1: 3, PO2: 2, PO3: 2, PO4: 2, PO5: 1, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 0, PSO1: 0, PSO2: 0, PSO3: 3 },
            CO4: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 1, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 1, PSO2: 0, PSO3: 3 },
            CO5: { PO1: 3, PO2: 2, PO3: 3, PO4: 1, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 0, PO11: 0, PO12: 1, PSO1: 1, PSO2: 0, PSO3: 3 },
        },
    },
    "Computer Aided Design and Manufacturing": {
        bloom: ["Understand", "Create", "Apply", "Apply", "Create"],
        coStatements: [
            "Explain the fundamentals of CAD, CAM, CNC and computer integrated manufacturing.",
            "Create 2D drawings and 3D solid models using CAD software.",
            "Apply geometric transformations, surface modelling and assembly modelling.",
            "Generate CNC programs and simulate machining operations using CAM software.",
            "Design and manufacture components using integrated CAD/CAM tools.",
        ],
        copoMap: {
            CO1: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
            CO2: { PO1: 3, PO2: 2, PO3: 3, PO4: 0, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
            CO3: { PO1: 2, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 0, PO7: 1, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
            CO4: { PO1: 2, PO2: 3, PO3: 2, PO4: 3, PO5: 3, PO6: 0, PO7: 2, PO8: 0, PO9: 1, PO10: 1, PO11: 2, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
            CO5: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 1, PO7: 2, PO8: 1, PO9: 2, PO10: 2, PO11: 2, PO12: 2, PSO1: 0, PSO2: 0, PSO3: 0 },
        },
    },
};

const SEM_MIS_PREFIX = {
    "I": "612410", "II": "612410",
    "III": "612510", "IV": "612510",
    "V": "612210", "VI": "612210",
    "VII": "612110", "VIII": "612110",
};
const SEM_ROMAN_TO_NUM = {
    "I": "01", "II": "02", "III": "03", "IV": "04",
    "V": "05", "VI": "06", "VII": "07", "VIII": "08",
};


export default function COPOAttainment({ st, dispatch }) {
    const [view, setView] = useState("mapping");
    const [qf, setQf] = useState({ academicYear: "", department: "Mechanical Engineering (ME)", program: "B.Tech", semester: st.selectedSemester || "Semester V", subject: "", faculty: "" });
    const [attainmentData, setAttainmentData] = useState(null);


    const isCadCam = qf.subject === "Computer Aided Design and Manufacturing" || st.coursePlan?.course === "Computer Aided Design and Manufacturing" || st.course?.name === "Computer Aided Design and Manufacturing";

    useEffect(() => {
        const fetchAttainment = async () => {
            try {
                const activeCourseId = localStorage.getItem("active_course_id");
                const res = await fetch(`http://${window.location.hostname}:3001/api/v2/courses/${activeCourseId}/state`);
                if (res.ok) {
                    const data = await res.json();
                    setAttainmentData(data);
                }
            } catch (err) {
                console.error("Failed to fetch attainment:", err);
            }
        };

        if (view !== "mapping") {
            fetchAttainment();
        }
    }, [view, st.coursePlan?.code]);

    // Sync Quick Fill with data from database if available
    useEffect(() => {
        if (st.course) {
            // eslint-disable-next-line
            setQf(p => ({
                ...p,
                academicYear: st.course.academicYear || p.academicYear,
                department: st.course.department || p.department,
                program: st.course.programName || p.program,
                semester: st.course.semester || p.semester,
                subject: st.course.name || p.subject,
                faculty: st.course.faculty || p.faculty
            }));
        }
    }, [st.course]);





    const cos = st.courseOutcomes || [];
    const pos = st.programOutcomes || [];
    const map = st.copoMap || {};

    const mapBg = v => v === 3 ? "var(--green-soft)" : v === 2 ? "var(--amber-soft)" : v === 1 ? "var(--teal-soft)" : "transparent";
    const mapColor = v => v === 3 ? "var(--green)" : v === 2 ? "var(--amber)" : v === 1 ? "var(--teal)" : "var(--muted)";

    const getAttData = coId => attainmentData?.outcomes?.find(o => o.id === coId);

    const directAtt = co => {
        const cal = combinedCOAttainment(st, co);
        if (cal.direct && cal.direct.attainmentPct !== null) {
            return +cal.direct.attainmentPct.toFixed(1);
        }
        const d = getAttData(co);
        if (d) return +(d.direct.internal * 0.3 + d.direct.midterm * 0.5 + d.direct.assignment * 0.2).toFixed(1);
        const fallback = st.coDirectScores?.[co];
        if (!fallback) return 0;
        return +(fallback.internal * 0.3 + fallback.midterm * 0.5 + fallback.assignment * 0.2).toFixed(1);
    };

    const overallCO = co => {
        const dir = directAtt(co);
        const ind = st.coIndirect?.[co] || 0;
        const dw = st.directWeight ?? 80;
        const iw = st.indirectWeight ?? 20;
        return +((dir * dw / 100) + (ind * iw / 100)).toFixed(1);
    };

    const attLevel = pct => pct >= 70 ? 3 : pct >= 55 ? 2 : pct >= 40 ? 1 : 0;
    const attLabel = lv => lv === 3 ? "High" : lv === 2 ? "Medium" : lv === 1 ? "Low" : "Not Attained";
    const attColor = lv => lv === 3 ? "var(--green)" : lv === 2 ? "var(--amber)" : lv === 1 ? "var(--teal)" : "var(--red)";
    const attBg = lv => lv === 3 ? "var(--green-soft)" : lv === 2 ? "var(--amber-soft)" : lv === 1 ? "var(--teal-soft)" : "var(--red-soft)";

    const poAttainment = poId => {
        let sum = 0, wSum = 0;
        cos.forEach(co => {
            const w = map[co.id]?.[poId] || 0;
            if (w > 0) { sum += overallCO(co.id) * w; wSum += w; }
        });
        return wSum > 0 ? +(sum / wSum).toFixed(1) : 0;
    };

    const cycleCopo = (co, po) => {
        const cur = map[co]?.[po] || 0;
        dispatch({ type: "SET_COPO", co, po, val: (cur + 1) % 4 });
    };

    const getBloomPillClass = (bloom) => {
        const bloomMap = {
            Create: 'pill l3',
            Apply: 'pill l3',
            Analyze: 'pill l2',
            Understand: 'pill l2',
            Evaluate: 'pill l1',
            Remember: 'pill l0'
        };
        return bloomMap[bloom] || 'pill l0';
    };

    const views = [
        { id: "mapping", label: "CO-PO Matrix" },
        { id: "direct", label: "Direct Attainment" },
        { id: "indirect", label: "Indirect Attainment" },
        { id: "overall", label: "Overall CO Attainment" },
        { id: "po", label: "PO Attainment" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* View Tabs & Actions Row */}
            <div className="examtabs" style={{ marginBottom: 20 }}>
                {views.map(v => (
                    <button 
                        key={v.id} 
                        onClick={() => setView(v.id)} 
                        className={view === v.id ? "active" : ""}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {/* ─── CO-PO MAPPING MATRIX ─── */}
            {
                view === "mapping" && (
                    <div>
                        <div className="card">
                            <h2>Course Outcomes</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {cos.map(co => (
                                    <div key={co.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#fdfcfa", border: "1px solid var(--line)", borderRadius: 6 }}>
                                        <span className="tag co" style={{ minWidth: 40, textAlign: 'center' }}>{co.id}</span>
                                        <span style={{ fontSize: 13, color: "var(--ink)", flex: 1 }}>{co.desc}</span>
                                        <span className={getBloomPillClass(co.bloom)}>{co.bloom}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                <h2>CO-PO Mapping Matrix</h2>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    {[["3 — High", "var(--green)"], ["2 — Medium", "var(--amber)"], ["1 — Low", "var(--teal)"], ["0 — None", "var(--muted)"]].map(([l, c], i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: 3, background: c, opacity: 0.7 }} />
                                            <span style={{ fontSize: 10, color: "var(--muted)" }}>{l}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 10px" }}>Click any cell to cycle through mapping levels (0 &rarr; 1 &rarr; 2 &rarr; 3 &rarr; 0)</p>
                            
                            <div className="tablewrap">
                                <table className="data">
                                    <thead>
                                        <tr>
                                            <th className="left" style={{ position: "sticky", left: 0, background: "#eef0e9", zIndex: 2, minWidth: 50 }}>CO / PO</th>
                                            {pos.map(po => <th key={po.id} style={{ minWidth: 44 }} title={po.desc}>{po.id}</th>)}
                                            <th style={{ color: "var(--amber)" }}>Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cos.map(co => {
                                            const vals = pos.map(po => map[co.id]?.[po.id] || 0);
                                            const mapped = vals.filter(v => v > 0);
                                            const avg = mapped.length ? (mapped.reduce((a, b) => a + b, 0) / mapped.length).toFixed(1) : "—";
                                            return (
                                                <tr key={co.id}>
                                                    <td className="left" style={{ fontWeight: 700, position: "sticky", left: 0, background: "#fff", zIndex: 1 }}>{co.id}</td>
                                                    {pos.map(po => {
                                                        const v = map[co.id]?.[po.id] || 0;
                                                        return (
                                                            <td key={po.id} onClick={() => cycleCopo(co.id, po.id)} style={{ cursor: "pointer", padding: 4 }}>
                                                                <div style={{ width: 36, height: 30, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: mapBg(v), color: mapColor(v), fontSize: 14, fontWeight: 700, margin: "0 auto", border: v > 0 ? "1px solid var(--line)" : "none" }}>
                                                                    {v || "—"}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{ fontWeight: 700, color: "var(--amber)" }}>{avg}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ borderTop: "2px solid var(--line)" }}>
                                            <td className="left" style={{ fontWeight: 700, color: "var(--amber)", position: "sticky", left: 0, background: "#fff" }}>Avg</td>
                                            {pos.map(po => {
                                                const vals = cos.map(co => map[co.id]?.[po.id] || 0).filter(v => v > 0);
                                                const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
                                                return <td key={po.id} style={{ fontWeight: 700, color: "var(--amber)" }}>{avg}</td>;
                                            })}
                                            <td />
                                        </tr>
                                    </tbody>
                                </table></div>
                            </div>

                        {isCadCam && (
                            <div className="card">
                                <h2>CAD/CAM PO-Activity Mapping Summary</h2>
                                <div className="tablewrap">
                                    <table className="data">
                                        <thead>
                                            <tr>
                                                <th className="left" style={{ width: "80px" }}>PO</th>
                                                <th className="left" style={{ width: "220px" }}>CAD/CAM Activity</th>
                                                <th className="left">Example</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { po: "PO1", activity: "Engineering knowledge", example: "Gear design using CAD" },
                                                { po: "PO2", activity: "Problem analysis", example: "Manufacturability analysis" },
                                                { po: "PO3", activity: "Design", example: "Lightweight bracket design" },
                                                { po: "PO4", activity: "Investigation", example: "Compare machining strategies" },
                                                { po: "PO5", activity: "Modern tools", example: "SolidWorks, CATIA, CAM software" },
                                                { po: "PO6", activity: "Society", example: "Safety guard design" },
                                                { po: "PO7", activity: "Sustainability", example: "Material waste reduction" },
                                                { po: "PO8", activity: "Ethics", example: "Licensed software and authentic reporting" },
                                                { po: "PO9", activity: "Team work", example: "Group CAD/CAM project" },
                                                { po: "PO10", activity: "Communication", example: "Engineering drawings and presentations" },
                                                { po: "PO11", activity: "Project management", example: "Cost estimation and production planning" },
                                                { po: "PO12", activity: "Lifelong learning", example: "Learning advanced CAD/CAM technologies" }
                                            ].map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="left" style={{ fontWeight: 700 }}>{row.po}</td>
                                                    <td className="left">{row.activity}</td>
                                                    <td className="left">{row.example}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* ─── DIRECT ATTAINMENT ─── */}
            {
                view === "direct" && (
                    <div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                            <div className="card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Target Threshold:</span>
                                <select
                                    value={st.coTargetPct || 60}
                                    onChange={e => dispatch({ type: "SET_CO_TARGET", val: parseInt(e.target.value) })}
                                    style={{
                                        background: "var(--bg)",
                                        border: "1px solid var(--line)",
                                        borderRadius: 6,
                                        color: "var(--navy)",
                                        fontSize: 16,
                                        fontWeight: 800,
                                        padding: "2px 8px",
                                        fontFamily: "inherit",
                                        cursor: "pointer",
                                        outline: "none"
                                    }}
                                >
                                    {[40, 50, 55, 60, 65, 70, 75, 80].map(v => (
                                        <option key={v} value={v} style={{ background: "var(--card-bg)", color: "var(--navy)" }}>{v}%</option>
                                    ))}
                                </select>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>of max marks</span>
                            </div>
                            <div className="card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Weights:</span>
                                <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Internal 30%</span>
                                <span style={{ fontSize: 12, color: "var(--line)" }}>&middot;</span>
                                <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 600 }}>Midterm 50%</span>
                                <span style={{ fontSize: 12, color: "var(--line)" }}>&middot;</span>
                                <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 600 }}>Assignment 20%</span>
                            </div>
                        </div>

                        <div className="card">
                            <h2>Direct Attainment Summary &mdash; % Students Scoring Above Target</h2>
                            <div className="tablewrap">
                                <table className="data">
                                    <thead>
                                        <tr>
                                            <th className="left">CO</th>
                                            <th>Internal (30%)</th>
                                            <th>Midterm (50%)</th>
                                            <th>Assignment (20%)</th>
                                            <th>Weighted Direct</th>
                                            <th>Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cos.map(co => {
                                            const d = st.coDirectScores?.[co.id] || { internal: 0, midterm: 0, assignment: 0 };
                                            const da = directAtt(co.id);
                                            const lv = attLevel(da);
                                            return (
                                                <tr key={co.id}>
                                                    <td className="left">
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{co.id}</div>
                                                        <div style={{ fontSize: 10, color: "var(--muted)", maxWidth: 200 }}>{co.desc.slice(0, 50)}...</div>
                                                    </td>
                                                    {["internal", "midterm", "assignment"].map(k => (
                                                        <td key={k}>
                                                            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{d[k]}%</div>
                                                            <div style={{ width: 60, height: 5, background: "var(--paper)", borderRadius: 3, margin: "4px auto 0" }}>
                                                                <div style={{ width: `${d[k]}%`, height: "100%", borderRadius: 3, background: d[k] >= st.coTargetPct ? "var(--green)" : "var(--red)" }} />
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td>
                                                        <div style={{ fontSize: 20, fontWeight: 800, color: attColor(lv) }}>{da}%</div>
                                                    </td>
                                                    <td>
                                                        <span className="pill l2" style={{ background: attBg(lv), color: attColor(lv) }}>{attLabel(lv)} ({lv})</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <h2>Direct Attainment Heatmap</h2>
                            <div style={{ display: "grid", gridTemplateColumns: "80px repeat(3,1fr)", gap: 6 }}>
                                <div />
                                {["Internal", "Midterm", "Assignment"].map(h => <div key={h} style={{ textAlign: "center", fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>{h}</div>)}
                                {cos.map(co => {
                                    const d = st.coDirectScores?.[co.id] || { internal: 0, midterm: 0, assignment: 0 };
                                    return [
                                        <div key={co.id + "l"} style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", display: "flex", alignItems: "center" }}>{co.id}</div>,
                                        ...["internal", "midterm", "assignment"].map(k => {
                                            const v = d[k];

                                            const heatBg = v >= 70 ? "var(--green-soft)" : v >= 55 ? "var(--amber-soft)" : "var(--red-soft)";
                                            const heatColor = v >= 70 ? "var(--green)" : v >= 55 ? "var(--amber)" : "var(--red)";
                                            return (
                                                <div key={co.id + k} style={{ padding: 10, borderRadius: 6, textAlign: "center", background: heatBg, border: "1px solid var(--line)" }}>
                                                    <div style={{ fontSize: 18, fontWeight: 800, color: heatColor }}>{v}%</div>
                                                </div>
                                            );
                                        })
                                    ];
                                })}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ─── INDIRECT ATTAINMENT ─── */}
            {
                view === "indirect" && (
                    <div>
                        <div className="section-note">
                            <b>Source:</b> Student Course-End Survey / Feedback &middot; Weight: {st.indirectWeight}%
                        </div>

                        <div className="card">
                            <h2>Indirect Attainment &mdash; Survey Results</h2>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {cos.map(co => {
                                    const v = st.coIndirect?.[co.id] || 0;
                                    const lv = attLevel(v);
                                    return (
                                        <div key={co.id} style={{ display: "grid", gridTemplateColumns: "50px 1fr 200px 60px 100px", gap: 12, alignItems: "center", padding: "12px 14px", background: "#fdfcfa", border: "1px solid var(--line)", borderRadius: 6 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{co.id}</span>
                                            <span style={{ fontSize: 12.5, color: "var(--ink)" }}>{co.desc}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ flex: 1, height: 8, background: "var(--paper)", borderRadius: 4 }}>
                                                    <div style={{ width: `${v}%`, height: "100%", borderRadius: 4, background: attColor(lv), transition: "width 0.4s" }} />
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 18, fontWeight: 800, color: attColor(lv), textAlign: "center" }}>{v}%</span>
                                            <span className="pill l2" style={{ background: attBg(lv), color: attColor(lv), textAlign: 'center', justifyContent: 'center' }}>{attLabel(lv)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 16 }}>
                            {[
                                ["Avg Indirect", (Object.values(st.coIndirect || {}).length ? (Object.values(st.coIndirect).reduce((a, b) => a + b, 0) / Object.values(st.coIndirect).length).toFixed(1) : "0.0") + "%", "var(--amber)"],
                                ["Highest", (Object.values(st.coIndirect || {}).length ? Math.max(...Object.values(st.coIndirect)) : 0) + "%", "var(--green)"],
                                ["Lowest", (Object.values(st.coIndirect || {}).length ? Math.min(...Object.values(st.coIndirect)) : 0) + "%", "var(--red)"],
                            ].map(([l, v, c], i) => (
                                <div key={i} className="card" style={{ borderTop: `3px solid ${c}`, textAlign: "center", marginBottom: 0 }}>
                                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{l}</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--navy)", marginTop: 4 }}>{v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* ─── OVERALL CO ATTAINMENT ─── */}
            {
                view === "overall" && (
                    <div>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                            <div className="card" style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>Formula:</span>
                                <span style={{ fontSize: 12, color: "var(--navy)", fontWeight: 600 }}>
                                    Overall = Direct &times; 
                                    <select
                                        value={st.directWeight || 80}
                                        onChange={e => {
                                            const dw = parseInt(e.target.value);
                                            dispatch({ type: "SET_WEIGHTS", dw: dw, iw: 100 - dw });
                                        }}
                                        style={{
                                            background: "var(--bg)",
                                            border: "1px solid var(--line)",
                                            borderRadius: 6,
                                            color: "var(--navy)",
                                            fontSize: 12,
                                            fontWeight: 800,
                                            padding: "1px 6px",
                                            margin: "0 4px",
                                            fontFamily: "inherit",
                                            cursor: "pointer",
                                            outline: "none"
                                        }}
                                    >
                                        {[50, 60, 70, 75, 80, 85, 90].map(v => (
                                            <option key={v} value={v} style={{ background: "var(--card-bg)", color: "var(--navy)" }}>{v}%</option>
                                        ))}
                                    </select>
                                    + Indirect &times; {(st.indirectWeight ?? 20)}%
                                </span>
                            </div>
                            <div className="card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
                                <span style={{ fontSize: 11, color: "var(--muted)" }}>Attainment Levels:</span>
                                {[[3, "High", "var(--green)", "≥70%"], [2, "Med", "var(--amber)", "≥55%"], [1, "Low", "var(--teal)", "≥40%"], [0, "None", "var(--red)", "<40%"]].map(([, l, c, r], i) => (
                                    <span key={i} className="pill l2" style={{ background: c + "15", color: c, fontSize: 10 }}>{l} {r}</span>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <h2>Overall CO Attainment Summary</h2>
                            <div className="tablewrap">
                                <table className="data">
                                    <thead>
                                        <tr>
                                            <th>CO</th>
                                            <th>Bloom's Level</th>
                                            <th>Direct ({st.directWeight}%)</th>
                                            <th>Indirect ({st.indirectWeight}%)</th>
                                            <th>Overall Attainment</th>
                                            <th>Level</th>
                                            <th>Target Met</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cos.map(co => {
                                            const da = directAtt(co.id);
                                            const ind = st.coIndirect?.[co.id] || 0;
                                            const oa = overallCO(co.id);
                                            const lv = attLevel(oa);
                                            const met = oa >= st.coTargetPct;
                                            return (
                                                <tr key={co.id}>
                                                    <td style={{ fontWeight: 700 }}>{co.id}</td>
                                                    <td><span className={getBloomPillClass(co.bloom)}>{co.bloom}</span></td>
                                                    <td style={{ fontSize: 15, fontWeight: 700 }}>{da}%</td>
                                                    <td style={{ fontSize: 15, fontWeight: 700 }}>{ind}%</td>
                                                    <td>
                                                        <div style={{ fontSize: 22, fontWeight: 800, color: attColor(lv) }}>{oa}%</div>
                                                        <div style={{ width: 80, height: 6, background: "var(--paper)", borderRadius: 3, margin: "4px auto 0" }}>
                                                            <div style={{ width: `${oa}%`, height: "100%", borderRadius: 3, background: attColor(lv), transition: "width 0.4s" }} />
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="pill l2" style={{ background: attBg(lv), color: attColor(lv) }}>{attLabel(lv)} ({lv})</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", background: met ? "var(--green-soft)" : "var(--red-soft)", color: met ? "var(--green)" : "var(--red)", fontSize: 16, fontWeight: 800 }}>
                                                            {met ? "✓" : "✗"}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginTop: 16 }}>
                            {cos.map(co => {
                                const oa = overallCO(co.id);
                                const lv = attLevel(oa);
                                return (
                                    <div key={co.id} className="card" style={{ padding: 16, textAlign: "center", borderTop: `3px solid ${attColor(lv)}`, marginBottom: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>{co.id}</div>
                                        <div style={{ fontSize: 26, fontWeight: 800, color: attColor(lv), margin: "6px 0 2px" }}>{oa}%</div>
                                        <div style={{ fontSize: 10, color: attColor(lv) }}>{attLabel(lv)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }

            {/* ─── PO ATTAINMENT ─── */}
            {
                view === "po" && (
                    <div>
                        <div className="section-note">
                            <b>PO Attainment:</b> Weighted average of CO attainments through CO-PO mapping
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                            {pos.map(po => {
                                const val = poAttainment(po.id);
                                const lv = attLevel(val);
                                const hasMapped = cos.some(co => (map[co.id]?.[po.id] || 0) > 0);
                                return (
                                    <div key={po.id} className="card" style={{ padding: 16, borderLeft: `4px solid ${hasMapped ? attColor(lv) : "var(--line)"}`, marginBottom: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>{po.id}</span>
                                            {hasMapped && <span className="pill l2" style={{ background: attBg(lv), color: attColor(lv) }}>{attLabel(lv)}</span>}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 8, minHeight: 28 }}>{po.desc}</div>
                                        {hasMapped ? (
                                            <div>
                                                <div style={{ fontSize: 24, fontWeight: 800, color: attColor(lv) }}>{val}%</div>
                                                <div style={{ width: "100%", height: 6, background: "var(--paper)", borderRadius: 3, marginTop: 6 }}>
                                                    <div style={{ width: `${val}%`, height: "100%", borderRadius: 3, background: attColor(lv), transition: "width 0.4s" }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>No CO mapped</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="card">
                            <h2>PO Attainment Summary Table</h2>
                            <div className="tablewrap">
                                <table className="data">
                                    <thead>
                                        <tr>
                                            <th>PO</th>
                                            <th className="left">Description</th>
                                            <th>Contributing COs</th>
                                            <th>Attainment %</th>
                                            <th>Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pos.map(po => {
                                            const val = poAttainment(po.id);
                                            const lv = attLevel(val);
                                            const contributing = cos.filter(co => (map[co.id]?.[po.id] || 0) > 0).map(co => `${co.id}(${map[co.id][po.id]})`);
                                            return (
                                                <tr key={po.id}>
                                                    <td style={{ fontWeight: 700 }}>{po.id}</td>
                                                    <td className="left">{po.desc}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                                                            {contributing.length > 0 ? contributing.map((c, i) => <span key={i} className="tag co">{c}</span>) : <span style={{ fontSize: 11, color: "var(--muted)" }}>&mdash;</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {contributing.length > 0 ? <span style={{ fontSize: 18, fontWeight: 800, color: attColor(lv) }}>{val}%</span> : <span style={{ color: "var(--muted)" }}>&mdash;</span>}
                                                    </td>
                                                    <td>
                                                        {contributing.length > 0 ? <span className="pill l2" style={{ background: attBg(lv), color: attColor(lv) }}>{attLabel(lv)}</span> : <span style={{ color: "var(--muted)" }}>&mdash;</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="card">
                            <h2>Gap Analysis &mdash; POs Below Target ({st.coTargetPct}%)</h2>
                            {(() => {
                                const gaps = pos.filter(po => { const v = poAttainment(po.id); return v > 0 && v < st.coTargetPct; });
                                if (gaps.length === 0) return <div style={{ padding: 16, textAlign: "center", color: "var(--green)", fontSize: 13 }}>All mapped POs meet the target threshold. No action needed.</div>;
                                return (
                                    <div style={{ display: "grid", gap: 8 }}>
                                        {gaps.map(po => {
                                            const v = poAttainment(po.id);
                                            const gap = (st.coTargetPct - v).toFixed(1);
                                            return (
                                                <div key={po.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--red-soft)", border: "1px solid var(--line)", borderRadius: 6 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red)" }}>{po.id}</span>
                                                    <span style={{ fontSize: 12.5, color: "var(--ink)", flex: 1 }}>{po.desc}</span>
                                                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red)" }}>{v}%</span>
                                                    <span style={{ fontSize: 11, color: "var(--red)", background: "rgba(165,64,58,0.15)", padding: "3px 10px", borderRadius: 6 }}>Gap: {gap}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
