import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const EXAM_TYPES = ["Internal", "Mid Semester", "End Semester", "MSE", "ESE"];

const inp = (extra = {}) => ({
    background: "#fff", border: "1px solid #cbd5e1", borderRadius: 4,
    color: "#334155", fontSize: 13, padding: "6px 8px", fontFamily: "inherit",
    outline: "none", ...extra,
});
const sel = { ...inp(), cursor: "pointer" };

export default function Examinations({ st, dispatch }) {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const exams = st.exams || [];

    useEffect(() => {
        if (exams.length === 0) {
            const defaultExams = [
                { id: 1, type: "Internal", title: "T1", name: "T1", duration: "1 hr", totalMarks: 20, isEditing: false },
                { id: 3, type: "End Semester", title: "T2", name: "T2", duration: "3 hr", totalMarks: 50, isEditing: false },
                { id: 2, type: "Mid Semester", title: "T3", name: "T3", duration: "1.5 hr", totalMarks: 30, isEditing: false },
                { id: 4, type: "MSE", title: "MSE", name: "MSE", duration: "1.5 hr", totalMarks: 0, isEditing: false },
                { id: 5, type: "ESE", title: "ESE", name: "ESE", duration: "1.5 hr", totalMarks: 0, isEditing: false },
            ];
            dispatch({ type: "SET_EXAMS", val: defaultExams });
        }
    }, [exams.length, dispatch]);

    const removeExam = (examId) => {
        const newExams = exams.filter(e => e.id !== examId);
        dispatch({ type: "SET_EXAMS", val: newExams });
    };

    const addExam = () => {
        const newId = Date.now().toString();
        const newExam = {
            id: newId,
            type: "Internal",
            title: "",
            name: "",
            duration: "1 hr",
            totalMarks: 0,
            isEditing: true
        };
        dispatch({ type: "SET_EXAMS", val: [...exams, newExam] });
    };

    const updateExam = (examId, field, value, manual = false) => {
        let finalValue = value;



        const newExams = exams.map(e => {
            if (e.id === examId) {
                let next = { ...e, [field]: finalValue };
                if (field === "type") {
                    if (value === "Internal") next.title = "T1";
                    else if (value === "Mid Semester") next.title = "T3";
                    else if (value === "End Semester") next.title = "T2";
                    else if (value === "MSE") next.title = "MSE";
                    else if (value === "ESE") next.title = "ESE";
                    next.name = next.title;
                    dispatch({ type: "SET_SELECTED_EXAM_TYPE", val: finalValue });
                }
                return next;
            }
            return e;
        });
        dispatch({ type: "SET_EXAMS", val: newExams, manual });

        if (field === "totalMarks") {
            const updatedExam = newExams.find(e => e.id === examId);
            if (st.papers && updatedExam) {
                const newPapers = st.papers.map(p =>
                    p.type === updatedExam.type ? { ...p, totalMarks: finalValue } : p
                );
                dispatch({ type: "UPDATE_PAPERS", val: newPapers, manual: false });
            }
        }

        if (field === "isEditing" && finalValue === false) {
            const exam = exams.find(e => e.id === examId);
            if (exam) {
                dispatch({ type: "SET_SELECTED_EXAM_TYPE", val: exam.type });
                navigate("/papers");
            }
        }
    };

    const displayExams = exams
        .filter(e => EXAM_TYPES.includes(e.type));

    const totalMarksSum = displayExams.reduce((sum, e) => sum + (e.totalMarks ?? e.total ?? 0), 0);

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Examination Setup</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                Configure the active examinations, their durations, and total marks limit.
            </div>

            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <h2 style={{ fontSize: '20px', color: '#1e3a8a', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: 0 }}>Active Exams</h2>
                        <button
                            onClick={addExam}
                            style={{
                                padding: "6px 14px", background: "#3b82f6", border: "none",
                                borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
                            onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
                        >
                            + Add Exam
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <div style={{
                            background: "#f8fafc", padding: "6px 12px", borderRadius: 6,
                            border: "1px solid #e2e8f0",
                            display: "flex", alignItems: "center", gap: 8
                        }}>
                            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>Total Marks:</span>
                            <span style={{
                                color: "#0f172a",
                                fontSize: 14, fontWeight: 800
                            }}>
                                {totalMarksSum}/100
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {displayExams.map(exam => {
                        const isActive = st.selectedExamType === exam.type;
                        return (
                            <div key={exam.id} style={{
                                background: isActive ? "#eff6ff" : "#fff",
                                border: isActive ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                                borderRadius: 8, padding: "16px 20px",
                                boxShadow: isActive ? "0 4px 6px -1px rgba(59, 130, 246, 0.1)" : "none",
                                transition: "all 0.2s ease",
                                position: "relative"
                            }}>
                                {isActive && (
                                    <div style={{
                                        position: "absolute", top: -8, left: 16, background: "#3b82f6",
                                        color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px",
                                        borderRadius: 12, textTransform: "uppercase", letterSpacing: 0.5
                                    }}>
                                        Active for Question Paper
                                    </div>
                                )}

                                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: isActive ? 4 : 0 }}>
                                    <input
                                        style={{ ...inp({ width: 220, fontWeight: 700, fontSize: 14, color: "#0f172a", border: isActive ? "1px solid #bfdbfe" : "1px solid #cbd5e1" }) }}
                                        value={exam.title || exam.name || ""}
                                        placeholder="Enter Exam Name"
                                        disabled={!exam.isEditing}
                                        onChange={e => updateExam(exam.id, "title", e.target.value)}
                                    />
                                    <select
                                        style={{
                                            ...sel, width: 140, fontWeight: 600,
                                            border: isActive ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
                                            display: exam.isEditing ? "block" : "none"
                                        }}
                                        value={exam.type}
                                        disabled={!exam.isEditing}
                                        onChange={e => updateExam(exam.id, "type", e.target.value)}
                                    >
                                        {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>

                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Duration</span>
                                        <input
                                            placeholder="e.g. 1 hr"
                                            style={{ ...inp({ width: 70 }), border: isActive ? "1px solid #bfdbfe" : "1px solid #cbd5e1" }}
                                            value={exam.duration || ""}
                                            disabled={!exam.isEditing}
                                            onChange={e => updateExam(exam.id, "duration", e.target.value)}
                                        />
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Total</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            style={{ ...inp({ width: 60, textAlign: "center", fontWeight: 700 }), border: isActive ? "1px solid #bfdbfe" : "1px solid #cbd5e1" }}
                                            value={exam.totalMarks ?? exam.total ?? 0}
                                            disabled={!exam.isEditing}
                                            onChange={e => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                if (val.length > 1) val = val.replace(/^0+/, '');
                                                const num = Math.max(0, parseInt(val) || 0);
                                                updateExam(exam.id, "totalMarks", num);
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }} />
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {isActive ? (
                                            <button
                                                onClick={() => {
                                                    navigate("/papers");
                                                }}
                                                style={{
                                                    padding: "6px 14px", background: "#dbeafe", border: "1px solid #bfdbfe",
                                                    borderRadius: 6, color: "#2563eb", fontSize: 12, fontWeight: 600,
                                                    cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#bfdbfe"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#dbeafe"}
                                            >
                                                View Paper
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    dispatch({ type: "SET_SELECTED_EXAM_TYPE", val: exam.type });
                                                    navigate("/papers");
                                                }}
                                                style={{
                                                    padding: "6px 14px", background: "#fef3c7", border: "1px solid #fde68a",
                                                    borderRadius: 6, color: "#d97706", fontSize: 12, fontWeight: 600,
                                                    cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#fde68a"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#fef3c7"}
                                            >
                                                Set Active
                                            </button>
                                        )}
                                        {exam.isEditing ? (
                                            <button
                                                onClick={() => updateExam(exam.id, "isEditing", false, true)}
                                                style={{
                                                    padding: "6px 14px", background: "#dcfce7", border: "1px solid #bbf7d0",
                                                    borderRadius: 6, color: "#16a34a", fontSize: 12, fontWeight: 600,
                                                    cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#bbf7d0"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#dcfce7"}
                                            >
                                                Save
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateExam(exam.id, "isEditing", true)}
                                                style={{
                                                    padding: "6px 14px", background: "#dbeafe", border: "1px solid #bfdbfe",
                                                    borderRadius: 6, color: "#2563eb", fontSize: 12, fontWeight: 600,
                                                    cursor: "pointer", transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#bfdbfe"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#dbeafe"}
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => removeExam(exam.id)}
                                            style={{
                                                padding: "6px 14px", background: "#fee2e2", border: "1px solid #fecaca",
                                                borderRadius: 6, color: "#dc2626", fontSize: 12, fontWeight: 600,
                                                cursor: "pointer", transition: "all 0.2s"
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#fecaca"}
                                            onMouseLeave={e => e.currentTarget.style.background = "#fee2e2"}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {displayExams.length === 0 && (
                        <div style={{ color: "#64748b", fontSize: 13, padding: 24, textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: 8 }}>
                            No exams configured yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
