import React, { useState } from 'react';

export default function MarkEntry({ st, dispatch }) {
    const tabs = ['T1', 'T2', 'T3', 'MSE', 'ESE'];
    const [activeTab, setActiveTab] = useState('T1');
    const [hoveredTab, setHoveredTab] = useState(null);

    const papers = st?.papers || [];
    const currentPaper = papers.find(p => p.id === activeTab || p.type === activeTab || p.label === activeTab || p.title === activeTab);
    const questions = currentPaper?.questions || [];
    const students = st?.students || [];
    const marksState = st?.marksState || {};

    const handleMarkChange = (studentId, questionId, value) => {
        if (value !== "" && isNaN(Number(value))) return;
        let val = value === "" ? "" : Number(value);
        const q = questions.find(q => q.id === questionId);
        if (q && val !== "") {
            if (val > Number(q.marks)) val = Number(q.marks);
            if (val < 0) val = 0;
        }
        dispatch({ type: 'UPDATE_MARKS', studentId, questionId, val: val });
    };

    const getStudentTotal = (studentId) => {
        let total = 0;
        const studentMarks = marksState[studentId] || {};
        questions.forEach(q => {
            const val = studentMarks[q.id] || 0;
            total += Number(val) || 0;
        });
        return total;
    };

    const getTitle = () => {
        if (activeTab.startsWith('T')) return `${activeTab} — TA-${activeTab.replace('T', '')}`;
        return activeTab;
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Marks Entry</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                Enter marks obtained by each student, question by question.
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {tabs.map(tab => {
                    const isActive = tab === activeTab;
                    const isHovered = tab === hoveredTab;
                    
                    let border = '1px solid #e2e8f0';
                    let background = '#fff';
                    let color = '#475569';
                    
                    if (isActive) {
                        border = '1px solid #1e3a8a';
                        background = '#1e3a8a';
                        color = '#fff';
                    } else if (isHovered) {
                        border = '2px solid #000';
                        color = '#1e3a8a';
                    } else {
                        color = '#1e3a8a';
                    }
                    
                    return (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            onMouseEnter={() => setHoveredTab(tab)}
                            onMouseLeave={() => setHoveredTab(null)}
                            style={{ 
                                padding: '6px 16px', 
                                borderRadius: '20px', 
                                border: border, 
                                background: background, 
                                color: color, 
                                fontSize: '12px', 
                                fontWeight: '500', 
                                cursor: 'pointer',
                                transition: 'all 0.1s'
                            }}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Card */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', margin: 0 }}>{getTitle()}</h2>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                        Exam Max Marks: <span style={{ fontWeight: 'bold' }}>{currentPaper?.totalMarks || 0}</span>
                    </div>
                </div>

                {/* Automatic Check Notification */}
                {(() => {
                    if (questions.length === 0 || students.length === 0) return null;
                    let missingCount = 0;
                    let invalidCount = 0;
                    students.forEach(student => {
                        const roll = student.roll || student.rollNo || student.rollNumber || student.id;
                        const studentMarks = marksState[roll] || {};
                        questions.forEach(q => {
                            const val = studentMarks[q.id] !== undefined ? studentMarks[q.id] : "";
                            if (val === "") {
                                missingCount++;
                            } else {
                                const numVal = Number(val);
                                if (numVal > Number(q.marks) || numVal < 0) invalidCount++;
                            }
                        });
                    });
                    
                    if (missingCount === 0 && invalidCount === 0) {
                        return (
                            <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #a7f3d0' }}>
                                <span>✅</span> All mark entries for this exam are complete and valid.
                            </div>
                        );
                    }
                    
                    return (
                        <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '6px', background: invalidCount > 0 ? '#fef2f2' : '#fffbeb', color: invalidCount > 0 ? '#991b1b' : '#92400e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', border: invalidCount > 0 ? '1px solid #fecaca' : '1px solid #fde68a' }}>
                            <span>⚠️</span> 
                            {invalidCount > 0 
                                ? `Attention: ${invalidCount} entry(s) exceed the maximum marks allowed or are invalid.` 
                                : `Attention: ${missingCount} mark entry(s) are currently blank.`}
                        </div>
                    );
                })()}

                {/* Body Content */}
                {questions.length === 0 || students.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '4px' }}>
                        {questions.length === 0 && <p style={{ margin: '0 0 8px 0' }}>⚠️ Add questions for this exam first, in the "Question Papers" tab.</p>}
                        {students.length === 0 && <p style={{ margin: 0 }}>⚠️ No students assigned to this subject yet. Please assign or import students in the "Student Registry" tab first.</p>}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>Student Name</th>
                                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600' }}>Roll No</th>
                                {questions.map(q => {
                                    const coValue = q.co || (Array.isArray(q.cos) && q.cos.length > 0 ? q.cos[0] : "");
                                    return (
                                        <th key={q.id} style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', minWidth: '80px' }}>
                                            {q.q || ""}{q.q && q.subQuestion ? " " : ""}{q.subQuestion ? `(${q.subQuestion})` : (!q.q ? q.id : "")}<br/>
                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Max: {q.marks}</span>
                                            {coValue && (
                                                <><br/><span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '700' }}>{coValue}</span></>
                                            )}
                                        </th>
                                    );
                                })}
                                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid #e2e8f0', color: '#1e3a8a', fontWeight: 'bold' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const roll = student.roll || student.rollNo || student.rollNumber || student.id;
                                const total = getStudentTotal(roll);
                                const isOverLimit = total > (currentPaper?.totalMarks || 0);

                                return (
                                    <tr key={roll} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #f1f5f9' }}>{student.name}</td>
                                        <td style={{ padding: '12px', color: '#64748b' }}>{roll}</td>
                                        {questions.map(q => {
                                            const studentMarks = marksState[roll] || {};
                                            const val = studentMarks[q.id] !== undefined ? studentMarks[q.id] : "";
                                            const invalidMark = Number(val) > Number(q.marks) || Number(val) < 0;

                                            return (
                                                <td key={q.id} style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                    <input 
                                                        type="number" 
                                                        value={val}
                                                        onChange={(e) => handleMarkChange(roll, q.id, e.target.value)}
                                                        style={{ 
                                                            width: '60px', 
                                                            padding: '6px', 
                                                            textAlign: 'center', 
                                                            border: invalidMark ? '1px solid #ef4444' : '1px solid #e2e8f0', 
                                                            borderRadius: '4px',
                                                            background: invalidMark ? '#fee2e2' : '#fff',
                                                            color: invalidMark ? '#ef4444' : '#334155'
                                                        }}
                                                        min="0"
                                                        max={q.marks}
                                                        title={invalidMark ? `Mark must be between 0 and ${q.marks}` : `Enter score up to ${q.marks}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: isOverLimit ? '#ef4444' : '#1e3a8a' }}>
                                            {total}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
