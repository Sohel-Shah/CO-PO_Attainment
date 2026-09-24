import React, { useState, useReducer, useEffect, Fragment, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useToast } from "./context/ToastContext";
import { INIT } from "./data";
import { I as baseI } from "./utils/ui-utils";
import ErrorBoundary from "./components/ErrorBoundary";
import Loader from "./components/Loader";
import CoursesList from "./components/CoursesList"; // Keep CoursesList eager for smooth landing

const Dashboard = React.lazy(() => import("./components/Dashboard"));
const Plans = React.lazy(() => import("./components/Plans"));
const Attendance = React.lazy(() => import("./components/Attendance"));
const Examinations = React.lazy(() => import("./components/Examinations"));
const Papers = React.lazy(() => import("./components/Papers"));
const MarkEntry = React.lazy(() => import("./components/MarkEntry"));
const Feedback = React.lazy(() => import("./components/Feedback"));
const Results = React.lazy(() => import("./components/Results"));
const COPOAttainment = React.lazy(() => import("./components/COPOAttainment"));
const Login = React.lazy(() => import("./components/Login"));
const Admin = React.lazy(() => import("./components/Admin"));
const StudentRegistry = React.lazy(() => import("./components/StudentRegistry"));
const Syllabus = React.lazy(() => import("./components/Syllabus"));
const Pedagogy = React.lazy(() => import("./components/Pedagogy"));
const References = React.lazy(() => import("./components/References"));
const POSurvey = React.lazy(() => import("./components/POSurvey"));
const AttainmentTrend = React.lazy(() => import("./components/AttainmentTrend"));
const SheetsSync = React.lazy(() => import("./components/SheetsSync"));
const IQACReport = React.lazy(() => import("./components/IQACReport"));
const AcademicPlanner = React.lazy(() => import("./components/AcademicPlanner"));

const I = {
  ...baseI,
  syllabus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  pedagogy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
  references: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5V4.5z" /></svg>,
  survey: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  trend: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  sheets: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" fill="currentColor" /></svg>,
  report: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
};

function reducer(state, action) {
  switch (action.type) {
    case "RESET_FOR_COURSE_SWITCH": return { ...state, students: [], marksState: {}, attendance: {}, exams: [], papers: [], feedback: [], lastChangedBy: 'switch' };
    case "ADD_PLAN": return { ...state, plans: [...(state.plans || []), action.payload], lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "UPDATE_TOPIC": {
      const units = state.coursePlan.units.map(u => ({
        ...u, topics: u.topics.map(t => t.id === action.topicId ? { ...t, ...action.data } : t)
      }));
      return { ...state, coursePlan: { ...state.coursePlan, units }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    }
    case "ADD_TOPIC": {
      const units = state.coursePlan.units.map(u => u.id === action.unitId ? { ...u, topics: [...u.topics, action.payload] } : u);
      return { ...state, coursePlan: { ...state.coursePlan, units }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    }
    case "ADD_STUDENT": return { ...state, students: [...(state.students || []), action.payload], lastChangedBy: 'user', lastChangedCategory: 'students' };
    case "SET_STUDENTS": return { ...state, students: action.payload, lastChangedBy: 'user', lastChangedCategory: 'students' };
    case "REMOVE_STUDENT": return { ...state, students: state.students.filter(s => s.id !== action.id), lastChangedBy: 'user', lastChangedCategory: 'students' };
    case "SET_ATTENDANCE": return { ...state, attendance: { ...state.attendance, [action.date]: action.data }, lastChangedBy: 'user', lastChangedCategory: 'attendance' };
    case "ADD_PAPER": return { ...state, papers: [...state.papers, action.payload], lastChangedBy: 'user', lastChangedCategory: 'exams' };
    case "UPDATE_PAPER": return { ...state, papers: state.papers.map(p => p.id === action.id ? { ...p, ...action.payload } : p), lastChangedBy: 'user', lastChangedCategory: 'exams' };
    case "UPDATE_PAPERS": return { ...state, papers: action.val, lastChangedBy: 'user', lastChangedCategory: 'exams' };
    case "ADD_FEEDBACK": return { ...state, feedback: [...state.feedback, action.payload], lastChangedBy: 'user', lastChangedCategory: 'feedback' };
    case "UPDATE_FEEDBACK": return { ...state, feedback: action.val, lastChangedBy: 'user', lastChangedCategory: 'feedback' };
    case "SET_COPO": return { ...state, copoMap: { ...state.copoMap, [action.co]: { ...state.copoMap[action.co], [action.po]: action.val } }, lastChangedBy: 'user', lastChangedCategory: 'outcomes' };
    case "SET_MIS": return { ...state, mis: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_CO_TARGET": return { ...state, coTargetPct: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_WEIGHTS": return { ...state, dw: action.dw, iw: action.iw, directWeight: action.dw, indirectWeight: action.iw, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_COURSE_OUTCOMES": return { ...state, courseOutcomes: action.val, lastChangedBy: 'user', lastChangedCategory: 'outcomes' };
    case "SET_COPO_MAP": return { ...state, copoMap: action.val, lastChangedBy: 'user', lastChangedCategory: 'outcomes' };
    case "SET_SELECTED_EXAM_TYPE": return { ...state, selectedExamType: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_SELECTED_EXAM_ID": return { ...state, selectedExamId: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_SELECTED_SEMESTER": return { ...state, selectedSemester: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_EXAMS": return { ...state, exams: action.val, lastChangedBy: 'user', lastChangedCategory: 'exams' };
    case "SET_MARKS": return { ...state, marksState: action.val, lastChangedBy: 'user', lastChangedCategory: 'marks' };
    case "UPDATE_MARKS": {
      const stuMarks = { ...(state.marksState?.[action.studentId] || {}) };
      if (action.questionId !== undefined) stuMarks[action.questionId] = action.val;
      if (action.questionLabel !== undefined) stuMarks[action.questionLabel] = action.val;
      return { ...state, marksState: { ...state.marksState, [action.studentId]: stuMarks }, lastChangedBy: 'user', lastChangedCategory: 'marks' };
    }
    case "SET_ACADEMIC_YEAR": return { ...state, academicYear: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_DEPARTMENT": return { ...state, department: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_PROGRAM_NAME": return { ...state, programName: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_FACULTY_NAME": return { ...state, facultyName: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_COURSE_NAME": return { ...state, coursePlan: { ...state.coursePlan, course: action.val }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_UNITS": return { ...state, coursePlan: { ...state.coursePlan, units: action.val }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_PEDAGOGY_TOOLS": return { ...state, coursePlan: { ...state.coursePlan, pedagogyTools: action.val }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_REFERENCES": return { ...state, coursePlan: { ...state.coursePlan, references: action.val }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_PO_SURVEY": return { ...state, coursePlan: { ...state.coursePlan, poSurvey: action.val }, poSurvey: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_REPORT": return { ...state, coursePlan: { ...state.coursePlan, report: action.val, settings: { ...(state.coursePlan?.settings || {}), report: action.val } }, report: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_SETTINGS": return { ...state, coursePlan: { ...state.coursePlan, settings: action.val }, settings: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_SYNC_STATUS": return { ...state, syncStatus: action.val };
    case "SET_STATE": {
      // If user has local changes that haven't been synced yet, don't overwrite with server state
      if (state.lastChangedBy === 'user' && !action.fromSync) return state;

      const { teachingPlan, marks, exams: incomingExams, ...rest } = action.payload;

      // Filter exams to only allowed types
      const filteredExams = (incomingExams || []).filter(e =>
        ["Internal", "Mid Semester", "End Semester", "T1", "T2", "T3", "MSE", "ESE", "Assignment"].includes(e.type) || ["T1", "T2", "T3", "MSE", "ESE"].includes(e.id) || e.title
      );

      // Transform marks array to marksState object if needed
      let serverMarksState = {};
      if (Array.isArray(marks)) {
        marks.forEach(m => {
          const sid = m.student?.rollNumber || m.studentId;
          const qid = m.questionId;
          const paperQid = m.paperQuestionId;
          const label = m.question?.label || m.question?.q || m.label;
          const qText = m.question?.questionText || m.question?.q;
          if (!serverMarksState[sid]) serverMarksState[sid] = {};
          if (qid) serverMarksState[sid][qid] = m.marksObtained;
          if (paperQid) serverMarksState[sid][paperQid] = m.marksObtained;
          if (label) serverMarksState[sid][label] = m.marksObtained;
          if (qText) serverMarksState[sid][qText] = m.marksObtained;
        });
      }

      // Merge: Start with current local state, then apply server state for what it knows
      const activeId = localStorage.getItem("active_course_id") || "default";
      let localSavedMarks = {};
      let localSavedFeedback = null;
      try {
        const saved = localStorage.getItem(`obc_saved_marks_state_${activeId}`);
        if (saved) localSavedMarks = JSON.parse(saved);
        const savedFb = localStorage.getItem(`obc_saved_feedback_${activeId}`);
        if (savedFb) localSavedFeedback = JSON.parse(savedFb);
      } catch (e) { }

      const finalMarksState = { ...(state.marksState || {}) };
      Object.keys(localSavedMarks).forEach(sid => {
        finalMarksState[sid] = { ...(finalMarksState[sid] || {}), ...localSavedMarks[sid] };
      });
      Object.keys(serverMarksState).forEach(sid => {
        finalMarksState[sid] = { ...(finalMarksState[sid] || {}), ...serverMarksState[sid] };
      });

      const finalCoursePlan = teachingPlan || state.coursePlan;

      return {
        ...state,
        ...rest,
        feedback: (rest.feedback && rest.feedback.length > 0) ? rest.feedback : (localSavedFeedback || rest.feedback || state.feedback),
        exams: filteredExams.length > 0 ? filteredExams : state.exams,
        marksState: finalMarksState || rest.marksState || state.marksState,
        coursePlan: finalCoursePlan ? {
          ...finalCoursePlan,
          course: rest.course?.name || finalCoursePlan.course,
          code: rest.course?.code || finalCoursePlan.code,
          credits: rest.course?.credits || finalCoursePlan.credits,
          category: rest.course?.courseType || finalCoursePlan.category,
          ltp: rest.course ? `${rest.course.L ?? (finalCoursePlan.ltp?.split('-')[0] || 0)}-${rest.course.T ?? (finalCoursePlan.ltp?.split('-')[1] || 0)}-${rest.course.P ?? (finalCoursePlan.ltp?.split('-')[2] || 0)}-${rest.course.S ?? (finalCoursePlan.ltp?.split('-')[3] || 0)}` : finalCoursePlan.ltp
        } : state.coursePlan,
        poSurvey: finalCoursePlan?.poSurvey || state.poSurvey,
        report: finalCoursePlan?.settings?.report || finalCoursePlan?.report || state.report,
        settings: finalCoursePlan?.settings || state.settings,
        selectedExamType: rest.selectedExamType || state.selectedExamType,
        selectedSemester: rest.course?.semester || rest.selectedSemester || state.selectedSemester,
        academicYear: rest.course?.academicYear || rest.academicYear || state.academicYear,
        programName: rest.course?.programName || rest.programName || state.programName,
        facultyName: rest.course?.faculty || rest.facultyName || state.facultyName,
        department: rest.course?.department || rest.department || state.department,
        mis: rest.course?.misNumber || rest.mis || state.mis,
        coTargetPct: rest.course?.coTargetPct ?? rest.targetPct ?? state.coTargetPct,
        directWeight: rest.course?.directWeight ?? rest.directWeight ?? state.directWeight,
        indirectWeight: rest.course?.indirectWeight ?? rest.indirectWeight ?? state.indirectWeight,
        dw: rest.course?.directWeight ?? rest.directWeight ?? state.dw,
        iw: rest.course?.indirectWeight ?? rest.indirectWeight ?? state.iw,
        lastChangedBy: 'server'
      };
    }
    case "SET_TAB": return { ...state, activeMainTab: action.val };
    case "SET_FIELD": return { ...state, [action.field]: action.val, lastChangedBy: 'user', lastChangedCategory: 'details' };
    case "SET_COURSE_FIELD": return { ...state, coursePlan: { ...state.coursePlan, [action.field]: action.val }, lastChangedBy: 'user', lastChangedCategory: 'details' };
    default: return state;
  }
}

const SectionLabel = ({ label }) => (
  <div className="section-label-header" style={{ padding: "16px 14px 6px", fontSize: 10, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "var(--font-title)" }}>
    {label}
  </div>
);

const Divider = () => (
  <div className="divider-line" style={{ height: 1, background: "var(--border-color)", margin: "8px 10px" }} />
);

const USE_PARTIAL_SYNC = false;
const USE_PARTIAL_SYNC_FOR_TESTING = true;

function getInitialState() {
  const activeId = localStorage.getItem("active_course_id") || "default";
  let initialMarks = { ...(INIT.marksState || {}) };
  let initialFeedback = [...(INIT.feedback || [])];
  let initialExamType = INIT.selectedExamType || "End Semester";
  try {
    const savedMarks = localStorage.getItem(`obc_saved_marks_state_${activeId}`);
    if (savedMarks) {
      const parsed = JSON.parse(savedMarks);
      Object.keys(parsed).forEach(sid => {
        initialMarks[sid] = { ...(initialMarks[sid] || {}), ...parsed[sid] };
      });
    }
    const savedFb = localStorage.getItem(`obc_saved_feedback_${activeId}`);
    if (savedFb) {
      const parsedFb = JSON.parse(savedFb);
      if (Array.isArray(parsedFb) && parsedFb.length > 0) initialFeedback = parsedFb;
    }
    const savedExamType = localStorage.getItem(`obc_saved_exam_type_${activeId}`);
    if (savedExamType) {
      initialExamType = savedExamType;
    }
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
  }
  return { ...INIT, marksState: initialMarks, feedback: initialFeedback, selectedExamType: initialExamType };
}

export default function TeachFlow() {
  const [st, dispatch] = useReducer(reducer, null, getInitialState);
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addToast, confirmAction } = useToast();
  // eslint-disable-next-line no-unused-vars
  const [theme, setTheme] = useState(() => localStorage.getItem("dashboard_theme") || "light");
  // eslint-disable-next-line no-unused-vars
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");

  // System-wide Global Theme Manager
  useEffect(() => {
    localStorage.setItem("dashboard_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Sidebar Collapsed Storage Sync
  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", sidebarCollapsed);
  }, [sidebarCollapsed]);



  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map pathname to tab ID
  const tab = location.pathname.substring(1) || "course";

  const setTab = (id) => {
    navigate(`/${id}`);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const [token, setToken] = useState(() => localStorage.getItem("app_token"));
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedToken = localStorage.getItem("app_token");
    return savedLoggedIn && !!savedToken;
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("app_user_data");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("isLoggedIn", isLoggedIn);
    if (token) localStorage.setItem("app_token", token);
    else localStorage.removeItem("app_token");
    if (user) localStorage.setItem("app_user_data", JSON.stringify(user));
    else localStorage.removeItem("app_user_data");
  }, [isLoggedIn, user, token]);

  useEffect(() => {
    if (st.activeMainTab && st.activeMainTab !== tab) {
      setTab(st.activeMainTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.activeMainTab]);

  const [activeCourseId, setActiveCourseId] = useState(() => localStorage.getItem("active_course_id"));

  useEffect(() => {
    if (activeCourseId) {
      localStorage.setItem("active_course_id", activeCourseId);
    } else {
      localStorage.removeItem("active_course_id");
    }
  }, [activeCourseId]);

  // Retain entered marks and feedback in localStorage across page refreshes
  useEffect(() => {
    if (st.marksState && Object.keys(st.marksState).length > 0) {
      const activeId = localStorage.getItem("active_course_id") || activeCourseId || "default";
      try {
        localStorage.setItem(`obc_saved_marks_state_${activeId}`, JSON.stringify(st.marksState));
      } catch (e) {
        console.error("Failed to save marks to localStorage:", e);
      }
    }
  }, [st.marksState, activeCourseId]);

  useEffect(() => {
    if (st.feedback && Array.isArray(st.feedback)) {
      const activeId = localStorage.getItem("active_course_id") || activeCourseId || "default";
      try {
        localStorage.setItem(`obc_saved_feedback_${activeId}`, JSON.stringify(st.feedback));
      } catch (e) {
        console.error("Failed to save feedback to localStorage:", e);
      }
    }
  }, [st.feedback, activeCourseId]);

  useEffect(() => {
    if (st.selectedExamType) {
      const activeId = localStorage.getItem("active_course_id") || activeCourseId || "default";
      try {
        localStorage.setItem(`obc_saved_exam_type_${activeId}`, st.selectedExamType);
      } catch (e) {
        console.error("Failed to save selected exam type to localStorage:", e);
      }
    }
  }, [st.selectedExamType, activeCourseId]);

  const TABS = [
    { id: 'course', label: 'Course & CO-PO Setup', path: '/course' },
    { id: 'students', label: 'Student Roster', path: '/students' },
    { id: 'syllabus', label: 'Unit-wise Syllabus', path: '/syllabus' },
    { id: 'teachingplan', label: 'Teaching Plan', path: '/teachingplan' },
    { id: 'pedagogy', label: 'Pedagogy Tools', path: '/pedagogy' },
    { id: 'attendance', label: 'Attendance', path: '/attendance' },
    { id: 'references', label: 'References', path: '/references' },
    { id: 'examinations', label: 'Examination Setup', path: '/examinations' },
    { id: 'papers', label: 'Question Papers', path: '/papers' },
    { id: 'marks', label: 'Marks Entry', path: '/marks' },
    { id: 'feedback', label: 'Course Exit Feedback', path: '/feedback' },
    { id: 'coattainment', label: 'Result Analysis', path: '/coattainment' },
    { id: 'alumnisurvey', label: 'Alumni/Employer/Grad Survey', path: '/alumnisurvey' },
    { id: 'copoattainment', label: 'CO-PO Attainment', path: '/copoattainment' },
    { id: 'trend', label: '3-Year Attainment Trend', path: '/trend' },
    { id: 'sync', label: 'Google Sheets Sync', path: '/sync' },
    { id: 'report', label: 'Final Report (IQAC)', path: '/report' }
  ];

  // Sync with backend when active course changes
  useEffect(() => {
    if (!isLoggedIn || !token || !activeCourseId) return;
    dispatch({ type: "RESET_FOR_COURSE_SWITCH" });
    fetch(`http://${window.location.hostname}:3001/api/v2/courses/${activeCourseId}/state`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401 || r.status === 403) {
          setIsLoggedIn(false);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (data) dispatch({ type: "SET_STATE", payload: data, fromSync: true });
      })
      .catch(err => console.error("Failed to fetch state:", err));
  }, [isLoggedIn, token, activeCourseId]);

  // Ensure course roster strictly reflects students assigned to this subject (removed automatic template student injection)


  // Automatic Syncing logic (Auto-Save)
  useEffect(() => {
    if (!isLoggedIn || !activeCourseId || st.lastChangedBy !== 'user' || st.syncStatus === 'syncing') return;

    const timer = setTimeout(async () => {
      if (!isLoggedIn || !activeCourseId || st.lastChangedBy !== 'user' || st.syncStatus === 'syncing') return;

      const courseId = activeCourseId;
      const fullPayload = {
        course: {
          courseId: courseId,
          name: st.coursePlan?.course || "",
          code: st.coursePlan?.code || courseId,
          courseType: st.coursePlan?.category || st.courseType || "PCC",
          semester: st.selectedSemester || "V",
          faculty: st.facultyName || "",
          academicYear: st.academicYear || "",
          misNumber: st.mis || "",
          department: st.department || "",
          programName: st.programName || "",
          credits: Number(st.coursePlan?.credits) || 0,
          lectureHrs: Number(st.coursePlan?.ltp?.split("-")[0]) || 0,
          tutorialHrs: Number(st.coursePlan?.ltp?.split("-")[1]) || 0,
          practicalHrs: Number(st.coursePlan?.ltp?.split("-")[2]) || 0,
          selfStudyHrs: Number(st.coursePlan?.ltp?.split("-")[3]) || 0,
          coTargetPct: Number(st.coTargetPct) || 60,
          directWeight: Number(st.directWeight ?? st.dw) || 80,
          indirectWeight: Number(st.indirectWeight ?? st.iw) || 20,
        },
        exams: st.exams || [],
        coStatements: st.courseOutcomes?.map(co => co.desc) || [],
        courseOutcomes: st.courseOutcomes || [],
        copoMap: st.copoMap || {},
        students: st.students || [],
        papers: st.papers || [],
        marks: st.marksState || {},
        selectedExamType: st.selectedExamType || "Internal",
        attendance: st.attendance || {},
        feedback: st.feedback || [],
        teachingPlan: st.coursePlan || null
      };

      try {
        dispatch({ type: "SET_SYNC_STATUS", val: "syncing" });

        let res;
        let usedPartial = false;

        // Try Partial Sync if testing is enabled or globally enabled and a specific category was changed
        if ((USE_PARTIAL_SYNC || USE_PARTIAL_SYNC_FOR_TESTING) && st.lastChangedCategory) {
          const category = st.lastChangedCategory;
          let partialPayload = { course: fullPayload.course }; // Always send course identifying info

          if (category === 'details') {
            // Include teachingPlan which contains units, pedagogyTools, references, and settings/report
            partialPayload.teachingPlan = fullPayload.teachingPlan;
          } else if (category === 'outcomes') {
            partialPayload.courseOutcomes = fullPayload.courseOutcomes;
            partialPayload.coStatements = fullPayload.coStatements;
            partialPayload.copoMap = fullPayload.copoMap;
          } else if (category === 'students') {
            partialPayload.students = fullPayload.students;
          } else if (category === 'exams') {
            partialPayload.exams = fullPayload.exams;
            partialPayload.papers = fullPayload.papers;
          } else if (category === 'marks') {
            partialPayload.marks = fullPayload.marks;
            partialPayload.selectedExamType = fullPayload.selectedExamType;
          } else if (category === 'attendance') {
            partialPayload.attendance = fullPayload.attendance;
          } else if (category === 'feedback') {
            partialPayload.feedback = fullPayload.feedback;
          }

          res = await fetch(`http://${window.location.hostname}:3001/api/v2/courses/${courseId}/${category}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(partialPayload)
          });

          if (res.ok) usedPartial = true;
          // If partial fails, it will fall through to the full sync below because usedPartial is false
        }

        // Fallback to Full Sync if partial was not used or if it failed
        if (!usedPartial) {
          res = await fetch(`http://${window.location.hostname}:3001/api/v2/sync-full`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fullPayload)
          });
        }

        if (res.ok) {
          const newState = await res.json();
          dispatch({ type: "SET_STATE", payload: newState, fromSync: true });
          dispatch({ type: "SET_SYNC_STATUS", val: "synced" });
          setTimeout(() => dispatch({ type: "SET_SYNC_STATUS", val: null }), 2000);
        } else {
          if (res.status === 401 || res.status === 403) {
            console.error("Authentication expired or invalid. Logging out.");
            setIsLoggedIn(false);
            setToken(null);
          }
          console.error("Auto-sync failed with status:", res.status);
          dispatch({ type: "SET_SYNC_STATUS", val: "error" });
        }
      } catch (e) {
        console.error("Auto-sync network error:", e);
        dispatch({ type: "SET_SYNC_STATUS", val: "error" });
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, isLoggedIn, token]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (st.lastChangedBy === 'user' || st.syncStatus === 'syncing') {
        const msg = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [st.lastChangedBy, st.syncStatus]);

  const NavBtn = ({ id, label, icon, indent = false }) => {
    const active = tab === id;
    if (indent && sidebarCollapsed && !isMobile) return null; // Hide sub-menus when collapsed
    return (
      <button onClick={() => setTab(id)} className="nav-btn" style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: indent ? "8px 12px 8px 24px" : "9px 12px",
        marginBottom: 2, borderRadius: 8, border: "none", cursor: "pointer",
        fontSize: 12.5, fontWeight: active ? 600 : 500,
        background: active ? "var(--bg-brand-trans)" : "transparent",
        color: active ? "var(--brand-light)" : "var(--text-sub)",
        transition: "var(--transition-normal)", position: "relative", textAlign: "left",
      }} title={sidebarCollapsed && !isMobile ? label : ""}>
        {active && <div style={{ position: "absolute", left: 0, top: "25%", height: "50%", width: 3, borderRadius: 4, background: "var(--brand)" }} />}
        <span style={{ display: "flex", opacity: active ? 1 : 0.6 }}>{icon}</span>
        <span className="nav-text">{label}</span>
      </button>
    );
  };



  const handleBackToHome = () => {
    setActiveCourseId(null);
    navigate("/");
  };

  const handleLogout = async () => {
    if (await confirmAction("Are you sure you want to logout?")) {
      setIsLoggedIn(false);
      setToken(null);
      setUser(null);
      setActiveCourseId(null);
    }
  };

  const exportJSON = () => {
    const data = activeCourseId ? st : {};
    const name = activeCourseId ? (st.coursePlan?.course || 'course') : 'all_courses';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/\s+/g, '_')}_attainment_data.json`;
    a.click();
  };

  const exportCSV = () => {
    if (!activeCourseId) return addToast("Please open a course to export its data to CSV.", "warning");

    // Prepare simple CSV format out of course outcomes, students, marks
    let csv = "Data Export for: " + (st.coursePlan?.course || 'course') + "\n\n";

    csv += "COURSE OUTCOMES\nCO,Description\n";
    (st.courseOutcomes || []).forEach(co => {
      csv += `"${co.id || co.coNumber || ''}","${(co.description || co.desc || '').replace(/"/g, '""')}"\n`;
    });

    csv += "\nSTUDENTS\nRoll No,Name\n";
    (st.students || []).forEach(s => {
      csv += `"${s.rollNumber || s.id || ''}","${(s.name || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(st.coursePlan?.course || 'course').replace(/\s+/g, '_')}_data.csv`;
    a.click();
  };

  const confirmReset = async () => {
    if (!activeCourseId) {
      if (user?.role !== 'admin') {
        addToast('Only an admin can reset the workspace courses', 'error');
        return;
      }
      addToast('Workspace reset action can be performed directly on courses.', 'info');
    } else {
      if (user?.role !== 'admin' && st.facultyName !== user?.name) {
        addToast('Only the course faculty or an admin can reset this course', 'error');
        return;
      }
      if (await confirmAction('Reset THIS course back to default? This cannot be undone.')) {
        dispatch({
          type: "SET_STATE", payload: {
            ...st,
            coursePlan: { ...st.coursePlan, units: [], pedagogyTools: [], references: { textbooks: [], refBooks: [] } },
            courseOutcomes: [],
            students: [],
            exams: [],
            marksState: {},
            attendance: {},
            feedback: []
          }, fromSync: false
        });
        addToast('Course state reset', 'success');
      }
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <Login onLogin={(u, t) => { setUser(u); setToken(t); setIsLoggedIn(true); }} />} />
          <Route path="/*" element={
            !isLoggedIn ? <Navigate to="/login" replace /> : (
              <div id="app">

                {/* Mobile Nav Toggle */}
                <div className="mobile-nav-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? '✕ Close' : '☰ Menu'}
                </div>

                {/* Sidebar */}
                <div id="sidebar" className={`no-print ${sidebarOpen ? 'open' : ''}`}>
                  <div className="brand">
                    <div className="mark">CO-PO Attainment Studio</div>
                    <div className="sub" id="brandCourse">
                      {!activeCourseId ? 'course dashboard' : `${st.coursePlan?.code || ''} - ${st.coursePlan?.course || 'course setup'}`}
                    </div>
                  </div>
                  <nav id="navList">
                    {!activeCourseId ? (
                      <>
                        <button
                          className={tab === '' ? 'active' : ''}
                          onClick={() => navigate('/')}
                        >
                          <span className="num">•</span>All Courses
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            className={tab === 'academic-planner' ? 'active' : ''}
                            onClick={() => setTab('academic-planner')}
                            title="Academic Planner — Admin Only"
                          >
                            <span className="num">▶</span>Academic Planner
                            <span style={{ fontSize: 10, marginLeft: 'auto', opacity: 0.7, background: 'var(--teal)', color: '#fff', padding: '1px 5px', borderRadius: 10 }}>Admin</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button onClick={handleBackToHome}>
                          <span className="num">←</span>All Courses
                        </button>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "6px 4px" }} />
                        {TABS.map((t, i) => (
                          <button
                            key={t.id}
                            className={tab === t.path.substring(1) ? 'active' : ''}
                            onClick={() => {
                              setTab(t.path.substring(1));
                            }}
                          >
                            <span className="num">{String(i + 1).padStart(2, "0")}</span>
                            {t.label}
                          </button>
                        ))}
                        {user?.role === 'admin' && (
                          <button
                            className={tab === 'admin' ? 'active' : ''}
                            onClick={() => setTab('admin')}
                          >
                            <span className="num">{String(TABS.length + 1).padStart(2, "0")}</span>
                            Admin Panel
                          </button>
                        )}
                      </>
                    )}
                  </nav>
                  <div className="side-footer">
                    <div id="whoami" style={{ marginBottom: 6 }}>
                      {user && (
                        <>
                          <span style={{ color: '#e7ecf3', marginRight: 6 }}>{user.name}</span>
                          <span className={`role-badge ${user.role || 'faculty'}`}>{user.role || 'faculty'}</span>
                        </>
                      )}
                    </div>
                    <div id="saveState">
                      {activeCourseId ? (
                        st.syncStatus === 'syncing' ? 'Saving…' : st.syncStatus === 'error' ? 'Save failed' : 'All changes saved'
                      ) : 'All changes saved'}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <button 
                        onClick={handleLogout} 
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          color: '#e7ecf3',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          width: '100%',
                          justifyContent: 'center',
                          transition: 'background 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div id="main" className={(!activeCourseId || user?.role === 'admin' || (st.course?.courseAccesses || []).some(a => a.userId === user?.id)) ? "" : "view-only"}>
                  {activeCourseId && user && user.role !== 'admin' && !(st.course?.courseAccesses || []).some(a => a.userId === user?.id) && (
                    <div className="view-only-banner no-print">
                      You are viewing this course setup in read-only mode (you are not assigned as owner). Changes will not be saved.
                    </div>
                  )}

                  <Routes>
                    <Route path="/" element={
                      activeCourseId ? <Navigate to="/course" replace /> : <CoursesList token={token} onOpen={(id) => { setActiveCourseId(id); navigate("/course"); }} user={user} />
                    } />
                    <Route path="/course" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Dashboard st={st} dispatch={dispatch} user={user} />
                    } />
                    <Route path="/teachingplan" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Plans st={st} dispatch={dispatch} />
                    } />
                    <Route path="/syllabus" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Syllabus st={st} dispatch={dispatch} />
                    } />
                    <Route path="/pedagogy" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Pedagogy st={st} dispatch={dispatch} />
                    } />
                    <Route path="/references" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <References st={st} dispatch={dispatch} />
                    } />
                    <Route path="/examinations" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Examinations st={st} dispatch={dispatch} />
                    } />
                    <Route path="/students" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <StudentRegistry st={st} dispatch={dispatch} />
                    } />
                    <Route path="/attendance" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Attendance st={st} dispatch={dispatch} />
                    } />
                    <Route path="/papers" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Papers st={{ ...st, mis: st.mis || "" }} dispatch={dispatch} />
                    } />
                    <Route path="/marks" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <MarkEntry st={st} dispatch={dispatch} />
                    } />
                    <Route path="/feedback" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Feedback st={st} dispatch={dispatch} />
                    } />
                    <Route path="/coattainment" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <Results st={st} dispatch={dispatch} />
                    } />
                    <Route path="/alumnisurvey" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <POSurvey st={st} dispatch={dispatch} />
                    } />
                    <Route path="/copoattainment" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <COPOAttainment st={st} dispatch={dispatch} user={user} />
                    } />
                    <Route path="/trend" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <AttainmentTrend st={st} />
                    } />
                    <Route path="/sync" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <SheetsSync st={st} />
                    } />
                    <Route path="/report" element={
                      !activeCourseId ? <Navigate to="/" replace /> : <IQACReport st={st} dispatch={dispatch} user={user} />
                    } />
                    <Route path="/admin" element={
                      user?.role !== 'admin' ? (
                        <div style={{ padding: 20 }}>
                          <h2>Access Denied</h2>
                          <p>You do not have permission to view this page.</p>
                        </div>
                      ) : !activeCourseId ? (
                        <Navigate to="/" replace />
                      ) : (
                        <Admin st={st} user={user} dispatch={dispatch} />
                      )
                    } />
                    <Route path="/academic-planner" element={
                      user?.role !== 'admin' ? (
                        <Navigate to="/" replace />
                      ) : (
                        <AcademicPlanner token={token} user={user} />
                      )
                    } />
                    <Route path="*" element={<div style={{ padding: 20 }}><h2>Page Not Found</h2></div>} />
                  </Routes>
                </div>
              </div>
            )
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}





