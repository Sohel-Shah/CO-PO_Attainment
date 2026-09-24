// ─────────────────────────────────────────────────────────────────────────────
//  server/prisma/seed.js  —  Populates the DB with initial data
//  Run with:  node prisma/seed.js   (from inside the server/ folder)
// ─────────────────────────────────────────────────────────────────────────────
require("dotenv").config({ path: __dirname + "/../.env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Program Outcomes ────────────────────────────────────────────────────────
const PROGRAM_OUTCOMES = [
    { poId: "PO1", description: "Engineering Knowledge", type: "PO" },
    { poId: "PO2", description: "Problem Analysis", type: "PO" },
    { poId: "PO3", description: "Design/Development of Solutions", type: "PO" },
    { poId: "PO4", description: "Conduct Investigations", type: "PO" },
    { poId: "PO5", description: "Modern Tool Usage", type: "PO" },
    { poId: "PO6", description: "Engineer and Society", type: "PO" },
    { poId: "PO7", description: "Environment & Sustainability", type: "PO" },
    { poId: "PO8", description: "Ethics", type: "PO" },
    { poId: "PO9", description: "Individual & Teamwork", type: "PO" },
    { poId: "PO10", description: "Communication", type: "PO" },
    { poId: "PO11", description: "Project Mgmt & Finance", type: "PO" },
    { poId: "PO12", description: "Life-long Learning", type: "PO" },
    { poId: "PSO1", description: "Mechanical Analysis & Design", type: "PSO" },
    { poId: "PSO2", description: "Manufacturing & Production", type: "PSO" },
    { poId: "PSO3", description: "Thermal & Fluid Systems", type: "PSO" },
];

// ── Faculty ─────────────────────────────────────────────────────────────────
const FACULTY = [
    { name: "Dr. Nagesh Ghougule", email: "nagesh.ghougule@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Dr. Anil Kumar", email: "anil.kumar@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Dr. Priya Sharma", email: "priya.sharma@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Prof. Rajesh Gupta", email: "rajesh.gupta@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Dr. Sneha Patil", email: "sneha.patil@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Prof. Manoj Deshmukh", email: "manoj.deshmukh@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Dr. Kavita Joshi", email: "kavita.joshi@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Prof. Suresh Reddy", email: "suresh.reddy@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Dr. Meena Iyer", email: "meena.iyer@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Prof. Vikram Singh", email: "vikram.singh@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Dr. Deepa Nair", email: "deepa.nair@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Rupali Sewane", email: "rupali.sewane@spit.ac.in", department: "Mechanical Engineering (ME)" },
    { name: "Prof Manish Attal", email: "manish.attal@spit.ac.in", department: "Mechanical Engineering (ME)" },
];

// ── Courses ─────────────────────────────────────────────────────────────────
const COURSES = [
    { courseId: "ME-24001", name: "Engineering Thermodynamics", code: "ME-24001", courseType: "PCC", semester: "III", credits: 4, lectureHrs: 3, tutorialHrs: 1, practicalHrs: 0, selfStudyHrs: 0, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24002", name: "Solid Mechanics", code: "ME-24002", courseType: "PCC", semester: "III", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24003", name: "Machine Drawing & Geometric Modeling", code: "ME-24003", courseType: "ESC", semester: "III", credits: 3, lectureHrs: 1, tutorialHrs: 0, practicalHrs: 4, selfStudyHrs: 1, labISE: 50, labESE: 50 },
    { courseId: "ME-24004", name: "Manufacturing Technology", code: "ME-24004", courseType: "PCC", semester: "III", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-24005", name: "Design Thinking", code: "ME-24005", courseType: "ESC", semester: "III", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24016", name: "Environmental Studies", code: "ME-24016", courseType: "HSMC", semester: "III", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24017", name: "Open Elective-I", code: "ME-24017", courseType: "OEC", semester: "III", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24018", name: "Principles of Economics", code: "ME-24018", courseType: "HSMC", semester: "III", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24019", name: "Community Engagement Activity", code: "ME-24019", courseType: "PROJ", semester: "III", credits: 2, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 4, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-24020", name: "Constitution of India & Universal Human Values", code: "ME-24020", courseType: "HSMC", semester: "III", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24021", name: "Indian Language: Sanskrit/Pali", code: "ME-24021", courseType: "HSMC", semester: "III", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24006", name: "Fluid Mechanics", code: "ME-24006", courseType: "PCC", semester: "IV", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-24007", name: "Design of Machine Elements", code: "ME-24007", courseType: "PCC", semester: "IV", credits: 3, lectureHrs: 2, tutorialHrs: 1, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24008", name: "Kinematics of Machines", code: "ME-24008", courseType: "PCC", semester: "IV", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-24009", name: "Constitution of India and Universal Human Values", code: "ME-24009", courseType: "HSMC", semester: "IV", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24010", name: "Indian Language: Pali", code: "ME-24010", courseType: "HSMC", semester: "IV", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24011", name: "Indian Language: Sanskrit", code: "ME-24011", courseType: "HSMC", semester: "IV", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24012", name: "Numerical Methods and Programming Language", code: "ME-24012", courseType: "ESC", semester: "IV", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-24013", name: "Principles of Entrepreneurship", code: "ME-24013", courseType: "HSMC", semester: "IV", credits: 2, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24014", name: "Open Elective-II", code: "ME-24014", courseType: "OEC", semester: "IV", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-24015", name: "Multidisciplinary Minor I", code: "ME-24015", courseType: "MDC", semester: "IV", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25001", name: "Heat Transfer", code: "ME-25001", courseType: "PCC", semester: "V", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-25002", name: "Dynamics of Machine", code: "ME-25002", courseType: "PCC", semester: "V", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 0, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-25003", name: "Metrology & Measurement", code: "ME-25003", courseType: "PCC", semester: "V", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-25004", name: "Data Analytics", code: "ME-25004", courseType: "PEC", semester: "V", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25005", name: "Deep Learning", code: "ME-25005", courseType: "PEC", semester: "V", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25006", name: "Internship 1#", code: "ME-25006", courseType: "INT", semester: "V", credits: 2, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 4, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-25007", name: "Introduction to Aerospace Engineering", code: "ME-25007", courseType: "OEC", semester: "V", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25008", name: "Multidisciplinary Minor II", code: "ME-25008", courseType: "MDC", semester: "V", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25009", name: "Open Elective Course III", code: "ME-25009", courseType: "OEC", semester: "V", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25010", name: "Program Elective Course-I", code: "ME-25010", courseType: "PEC", semester: "V", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-25011", name: "Project-I", code: "ME-25011", courseType: "PROJ", semester: "V", credits: 2, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 4, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-26001", name: "Mechanical System Design", code: "ME-26001", courseType: "PCC", semester: "VI", credits: 4, lectureHrs: 3, tutorialHrs: 1, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-26002", name: "Computer Aided Design and Manufacturing", code: "ME-26002", courseType: "PCC", semester: "VI", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-26003", name: "Fluid Machinery", code: "ME-26003", courseType: "PCC", semester: "VI", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-26004", name: "Finite Element Analysis", code: "ME-26004", courseType: "PCC", semester: "VI", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-26005", name: "Generative Design", code: "ME-26005", courseType: "PCC", semester: "VI", credits: 3, lectureHrs: 2, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-26006", name: "Program Elective Course-II", code: "ME-26006", courseType: "PEC", semester: "VI", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-26007", name: "Multidisciplinary Minor-III", code: "ME-26007", courseType: "MDC", semester: "VI", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-26008", name: "Project-II", code: "ME-26008", courseType: "PROJ", semester: "VI", credits: 4, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 8, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-27001", name: "Energy Conversion", code: "ME-27001", courseType: "PCC", semester: "VII", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-27002", name: "Refrigeration and Air Conditioning", code: "ME-27002", courseType: "PCC", semester: "VII", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-27003", name: "Vibration and Acoustics", code: "ME-27003", courseType: "PCC", semester: "VII", credits: 4, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 2, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50, labISE: 50, labESE: 50 },
    { courseId: "ME-27004", name: "Program Elective Course-III", code: "ME-27004", courseType: "PEC", semester: "VII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-27005", name: "Internship 2#", code: "ME-27005", courseType: "INT", semester: "VII", credits: 2, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 4, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-27006", name: "Research Methodology and IPR", code: "ME-27006", courseType: "HSMC", semester: "VII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-27007", name: "Multidisciplinary Minor IV", code: "ME-27007", courseType: "MDC", semester: "VII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-27008", name: "Project-III", code: "ME-27008", courseType: "PROJ", semester: "VII", credits: 4, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 8, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-28001", name: "Automotive Control Systems", code: "ME-28001", courseType: "PCC", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-28002", name: "Condition Monitoring", code: "ME-28002", courseType: "PCC", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-28003", name: "Hybrid and Electric Vehicles", code: "ME-28003", courseType: "PCC", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-28004", name: "Industrial Engineering", code: "ME-28004", courseType: "PCC", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-28005", name: "Internship 3#", code: "ME-28005", courseType: "INT", semester: "VIII", credits: 4, lectureHrs: 0, tutorialHrs: 0, practicalHrs: 8, selfStudyHrs: 2, labISE: 50, labESE: 50 },
    { courseId: "ME-28006", name: "Program Elective Course-IV", code: "ME-28006", courseType: "PEC", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-28007", name: "Program Specific Elective-V", code: "ME-28007", courseType: "PSE", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
    { courseId: "ME-28008", name: "Program Specific Elective-VI", code: "ME-28008", courseType: "PSE", semester: "VIII", credits: 3, lectureHrs: 3, tutorialHrs: 0, practicalHrs: 0, selfStudyHrs: 1, theoryMSE: 30, theoryTE: 20, theoryESE: 50 },
];

// ── Course Outcomes ─────────────────────────────────────────────────────────
const COURSE_OUTCOMES = {
    "ME-24001": [
        { coNumber: "CO1", description: "Explain the fundamental concepts of thermodynamics, laws of thermodynamics and their applications.", bloomLevel: "Understand" },
        { coNumber: "CO2", description: "Analyze the properties of pure substances and ideal gases using thermodynamic tables and charts.", bloomLevel: "Analyze" },
        { coNumber: "CO3", description: "Evaluate the performance of various power and refrigeration cycles.", bloomLevel: "Evaluate" },
        { coNumber: "CO4", description: "Apply the principles of psychrometry and chemical reactions in thermodynamic systems.", bloomLevel: "Apply" },
        { coNumber: "CO5", description: "Apply the concept of exergy and its application in analyzing real-world thermodynamic processes.", bloomLevel: "Apply" },
    ],
    "ME-25001": [
        { coNumber: "CO1", description: "Apply the fundamental laws of heat conduction and solve 1D steady-state and transient heat conduction problems.", bloomLevel: "Apply" },
        { coNumber: "CO2", description: "Analyze convective heat transfer in internal and external flows using relevant empirical correlations.", bloomLevel: "Analyze" },
        { coNumber: "CO3", description: "Evaluate radiation heat transfer between surfaces and apply view factor and enclosure radiation concepts.", bloomLevel: "Evaluate" },
        { coNumber: "CO4", description: "Design and analyze heat exchangers using LMTD and NTU-effectiveness methods.", bloomLevel: "Create" },
        { coNumber: "CO5", description: "Apply the analogy between heat and mass transfer to solve integrated thermal system problems.", bloomLevel: "Apply" },
    ],
    "ME-24006": [
        { coNumber: "CO1", description: "Identify various properties of fluids and understand fluid statics principles.", bloomLevel: "Remember" },
        { coNumber: "CO2", description: "Analyze fluid flow using kinematics and dynamics equations (Bernoulli's, Euler's).", bloomLevel: "Analyze" },
        { coNumber: "CO3", description: "Apply dimensional analysis and similarity principles for hydraulic modeling.", bloomLevel: "Apply" },
        { coNumber: "CO4", description: "Evaluate head losses in pipe flows and analyze flow through various conduits.", bloomLevel: "Evaluate" },
        { coNumber: "CO5", description: "Understand boundary layer concepts and lift/drag forces on immersed bodies.", bloomLevel: "Understand" },
    ],
    "ME-26002": [
        { coNumber: "CO1", description: "Explain the fundamentals of CAD, CAM, CNC and computer integrated manufacturing.", bloomLevel: "Understand" },
        { coNumber: "CO2", description: "Create 2D drawings and 3D solid models using CAD software.", bloomLevel: "Create" },
        { coNumber: "CO3", description: "Apply geometric transformations, surface modelling and assembly modelling.", bloomLevel: "Apply" },
        { coNumber: "CO4", description: "Generate CNC programs and simulate machining operations using CAM software.", bloomLevel: "Apply" },
        { coNumber: "CO5", description: "Design and manufacture components using integrated CAD/CAM tools.", bloomLevel: "Create" },
    ],
};

// ── CO-PO Mapping ────────────────────────────────────────────────────────────
const COPO_MAPS = {
    "ME-25001": {
        CO1: { PO1: 3, PO2: 2, PO3: 1, PO4: 1, PO5: 0, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 2, PSO2: 0, PSO3: 3 },
        CO2: { PO1: 3, PO2: 3, PO3: 2, PO4: 2, PO5: 1, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 0, PO11: 0, PO12: 1, PSO1: 2, PSO2: 0, PSO3: 3 },
        CO3: { PO1: 3, PO2: 2, PO3: 2, PO4: 1, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 1, PSO2: 0, PSO3: 3 },
        CO4: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 3, PSO2: 1, PSO3: 3 },
        CO5: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 1, PO7: 1, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 2, PSO2: 1, PSO3: 3 },
    },
    "ME-26002": {
        CO1: { PO1: 3, PO2: 2, PO3: 0, PO4: 0, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 0, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
        CO2: { PO1: 3, PO2: 2, PO3: 3, PO4: 0, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
        CO3: { PO1: 2, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 0, PO7: 1, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
        CO4: { PO1: 2, PO2: 3, PO3: 2, PO4: 3, PO5: 3, PO6: 0, PO7: 2, PO8: 0, PO9: 1, PO10: 1, PO11: 2, PO12: 1, PSO1: 0, PSO2: 0, PSO3: 0 },
        CO5: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 1, PO7: 2, PO8: 1, PO9: 2, PO10: 2, PO11: 2, PO12: 2, PSO1: 0, PSO2: 0, PSO3: 0 },
    },
};

// ── Students ─────────────────────────────────────────────────────────────────
const STUDENTS_TY = [
    { rollNumber: "612210001", name: "AAKRUTI TIWARI", batchYear: "2021" },
    { rollNumber: "612210002", name: "AARYA SANDEEP KENDALE", batchYear: "2021" },
    { rollNumber: "612210003", name: "ABHISHEK DESAI", batchYear: "2021" },
    { rollNumber: "612210004", name: "ADWAIT MILIND DIVEKAR", batchYear: "2021" },
    { rollNumber: "612210005", name: "AMBEKAR TEJ ANURAG", batchYear: "2021" },
    { rollNumber: "612210006", name: "ANIKET NARAYAN", batchYear: "2021" },
    { rollNumber: "612210007", name: "ANMOL RAINA", batchYear: "2021" },
    { rollNumber: "612210008", name: "ANSHIL EVEREN", batchYear: "2021" },
    { rollNumber: "612210009", name: "ARADHYA GIRISH ATUL", batchYear: "2021" },
    { rollNumber: "612210010", name: "ARYAN SURESH BHOSALE", batchYear: "2021" },
    { rollNumber: "612210011", name: "ATHARV RAJESH KULKARNI", batchYear: "2021" },
    { rollNumber: "612210012", name: "CHIRAG DILIP PATIL", batchYear: "2021" },
    { rollNumber: "612210013", name: "DEVRAJ ANAND SINGH", batchYear: "2021" },
    { rollNumber: "612210014", name: "DHRUV SANTOSH NAIR", batchYear: "2021" },
    { rollNumber: "612210015", name: "ESHAN VIJAY MEHTA", batchYear: "2021" },
    { rollNumber: "612210016", name: "GAURAV PRAKASH SHINDE", batchYear: "2021" },
    { rollNumber: "612210017", name: "HARSHIT RAJAN DESHMUKH", batchYear: "2021" },
    { rollNumber: "612210018", name: "ISHAAN KUMAR JOSHI", batchYear: "2021" },
    { rollNumber: "612210019", name: "JAY DEEPAK WAGHMARE", batchYear: "2021" },
    { rollNumber: "612210020", name: "KARAN SUNIL GHATE", batchYear: "2021" },
    { rollNumber: "612210021", name: "LAKSHYA ANIL THORAT", batchYear: "2021" },
    { rollNumber: "612210022", name: "MANISH RAJENDRA PAWAR", batchYear: "2021" },
    { rollNumber: "612210023", name: "NIKHIL ASHOK GAIKWAD", batchYear: "2021" },
    { rollNumber: "612210024", name: "OM SACHIN KATE", batchYear: "2021" },
    { rollNumber: "612210025", name: "PRANAV MILIND BORSE", batchYear: "2021" },
    { rollNumber: "612210026", name: "RAHUL VIJAY MANE", batchYear: "2021" },
    { rollNumber: "612210027", name: "RUSHIKESH PRADEEP SALUNKHE", batchYear: "2021" },
    { rollNumber: "612210028", name: "SAHIL RAMESH KADAM", batchYear: "2021" },
    { rollNumber: "612210029", name: "SIDDHARTH NITIN CHAVAN", batchYear: "2021" },
    { rollNumber: "612210030", name: "TANMAY SURESH JAGTAP", batchYear: "2021" },
    { rollNumber: "612210031", name: "UMESH DATTATRAY KALE", batchYear: "2021" },
    { rollNumber: "612210032", name: "VAIBHAV PANDURANG MORE", batchYear: "2021" },
    { rollNumber: "612210033", name: "YASH AVINASH SAWANT", batchYear: "2021" },
];

const STUDENTS_SY = [
    { rollNumber: "612510006", name: "SWAPNIL DILIP KHARAT", batchYear: "2022" },
    { rollNumber: "612510007", name: "ADITYA VITTHAL SHINDE", batchYear: "2022" },
    { rollNumber: "612510008", name: "SAHIL ASHISH BHADANG", batchYear: "2022" },
    { rollNumber: "612510009", name: "RAMESH PRABHANJAN WANDREKAR", batchYear: "2022" },
    { rollNumber: "612510010", name: "SAGAR VIJAY DULANI", batchYear: "2022" },
];

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    console.log("🌱  Seeding database...\n");

    // 1. Program Outcomes
    console.log("  → Seeding POs / PSOs...");
    for (const po of PROGRAM_OUTCOMES) {
        await prisma.pO.upsert({ where: { poId: po.poId }, update: po, create: po });
    }

    // 2. Faculty
    console.log("  → Seeding Faculty...");
    const facultyMap = {};
    for (const f of FACULTY) {
        const rec = await prisma.faculty.upsert({ where: { email: f.email }, update: f, create: f });
        facultyMap[f.name] = rec.id;
    }

    // 3. Courses
    console.log("  → Seeding Courses...");
    const courseMap = {};
    for (const c of COURSES) {
        const rec = await prisma.course.upsert({
            where: { courseId: c.courseId },
            update: { ...c, department: "Mechanical Engineering (ME)", academicYear: "2025–26", programName: "B.Tech" },
            create: { ...c, department: "Mechanical Engineering (ME)", academicYear: "2025–26", programName: "B.Tech" },
        });
        courseMap[c.courseId] = rec.id;
    }

    // 4. Course Outcomes
    console.log("  → Seeding Course Outcomes...");
    const coMap = {}; // courseId_coNumber → CO db id
    for (const [courseId, cos] of Object.entries(COURSE_OUTCOMES)) {
        const courseDbId = courseMap[courseId];
        if (!courseDbId) continue;
        for (const co of cos) {
            const rec = await prisma.courseOutcome.upsert({
                where: { courseId_coNumber: { courseId: courseDbId, coNumber: co.coNumber } },
                update: { description: co.description, bloomLevel: co.bloomLevel },
                create: { courseId: courseDbId, coNumber: co.coNumber, description: co.description, bloomLevel: co.bloomLevel },
            });
            coMap[`${courseId}_${co.coNumber}`] = rec.id;
        }
    }

    // 5. CO-PO Mappings
    console.log("  → Seeding CO-PO Mappings...");
    const poRecords = await prisma.pO.findMany();
    const poLookup = Object.fromEntries(poRecords.map(p => [p.poId, p.id]));
    for (const [courseId, copoMap] of Object.entries(COPO_MAPS)) {
        for (const [coNum, poMap] of Object.entries(copoMap)) {
            const coDbId = coMap[`${courseId}_${coNum}`];
            if (!coDbId) continue;
            for (const [poKey, level] of Object.entries(poMap)) {
                const poDbId = poLookup[poKey];
                if (!poDbId || level === 0) continue;
                await prisma.cOPOMapping.upsert({
                    where: { courseOutcomeId_poId: { courseOutcomeId: coDbId, poId: poDbId } },
                    update: { correlationLevel: level },
                    create: { courseOutcomeId: coDbId, poId: poDbId, correlationLevel: level },
                });
            }
        }
    }

    // 6. Students
    console.log("  → Seeding Students (TY + SY)...");
    const allStudents = [...STUDENTS_TY, ...STUDENTS_SY];
    const studentMap = {};
    for (const s of allStudents) {
        const rec = await prisma.student.upsert({
            where: { rollNumber: s.rollNumber },
            update: { name: s.name, batchYear: s.batchYear },
            create: s,
        });
        studentMap[s.rollNumber] = rec.id;
    }

    // 7. Enroll TY students in TY Core Courses (Heat Transfer, Dynamics of Machine, Metrology & Measurement, etc.)
    console.log("  → Enrolling TY students in TY Core Courses (Heat Transfer, Dynamics of Machine, etc.)...");
    const tyCourseCodes = ["ME-25001", "ME-25002", "ME-25003", "ME-26001", "ME-26002", "ME-26003", "ME-26004", "ME-26005"];
    for (const code of tyCourseCodes) {
        const courseDbId = courseMap[code];
        if (courseDbId) {
            for (const s of STUDENTS_TY) {
                const stuId = studentMap[s.rollNumber];
                if (!stuId) continue;
                await prisma.enrollment.upsert({
                    where: { studentId_courseId: { studentId: stuId, courseId: courseDbId } },
                    update: {},
                    create: { studentId: stuId, courseId: courseDbId },
                });
            }
        }
    }

    // 8. Enroll SY students in SY Core Courses (Engineering Thermodynamics, Solid Mechanics, Fluid Mechanics, etc.)
    console.log("  → Enrolling SY students in SY Core Courses (Engineering Thermodynamics, Fluid Mechanics, etc.)...");
    const syCourseCodes = ["ME-24001", "ME-24002", "ME-24003", "ME-24004", "ME-24005", "ME-24006", "ME-24007", "ME-24008", "ME-24012"];
    for (const code of syCourseCodes) {
        const courseDbId = courseMap[code];
        if (courseDbId) {
            for (const s of STUDENTS_SY) {
                const stuId = studentMap[s.rollNumber];
                if (!stuId) continue;
                await prisma.enrollment.upsert({
                    where: { studentId_courseId: { studentId: stuId, courseId: courseDbId } },
                    update: {},
                    create: { studentId: stuId, courseId: courseDbId },
                });
            }
        }
    }

    console.log("\n✅  Seed complete!");
    console.log(`    POs/PSOs:  ${PROGRAM_OUTCOMES.length}`);
    console.log(`    Faculty:   ${FACULTY.length}`);
    console.log(`    Courses:   ${COURSES.length}`);
    console.log(`    Students:  ${allStudents.length}`);
}

main()
    .catch(e => { console.error("❌  Seed failed:", e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
