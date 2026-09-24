import React, { useState } from 'react';

export default function Papers({ st, dispatch }) {
    const tabs = (st?.exams || []).length > 0 
        ? st.exams.map(e => e.title || e.name || e.type) 
        : ['T1', 'T2', 'T3', 'MSE', 'ESE'];
    const [activeTab, setActiveTab] = useState(() => {
        if (!st?.selectedExamType) return 'T1';
        if (st.selectedExamType === "Internal") return "T1";
        if (st.selectedExamType === "Mid Semester") return "T3";
        if (st.selectedExamType === "End Semester") return "T2";
        return st.selectedExamType;
    });
    const [hoveredTab, setHoveredTab] = useState(null);

    // Get current paper for active tab or create default
    const papers = st?.papers || [];
    let currentPaper = papers.find(p => p.id === activeTab || p.type === activeTab || p.label === activeTab || p.title === activeTab || (activeTab === 'MSE' && p.type === 'Mid Semester') || (activeTab === 'ESE' && p.type === 'End Semester') || (activeTab.startsWith('T') && p.title?.startsWith(activeTab)));
    
    // Find corresponding exam in st.exams
    const matchingExam = (st?.exams || []).find(e => 
        e.title === activeTab || e.name === activeTab || e.type === activeTab ||
        (activeTab === 'T1' && e.type === 'Internal') ||
        (activeTab === 'T2' && e.type === 'End Semester') ||
        (activeTab === 'T3' && e.type === 'Mid Semester') ||
        (activeTab === 'MSE' && e.type === 'MSE') ||
        (activeTab === 'ESE' && e.type === 'ESE')
    );
    const fetchedTotalMarks = matchingExam ? (matchingExam.totalMarks ?? matchingExam.total ?? 0) : (currentPaper?.totalMarks ?? 0);
    const fetchedDuration = matchingExam ? (matchingExam.duration ?? "") : (currentPaper?.duration ?? "");
    
    // If it doesn't exist in global state yet, create a placeholder
    let isNewPaper = false;
    if (!currentPaper) {
        isNewPaper = true;
        currentPaper = {
            id: activeTab + '_new',
            title: `${activeTab} Exam`,
            type: activeTab,
            totalMarks: 0,
            duration: "90",
            questions: []
        };
    }

    if (isNewPaper && currentPaper.questions.length === 0 && fetchedTotalMarks > 0) {
        const autoQuestions = [];
        let marksToDistribute = fetchedTotalMarks;
        let qIndex = 1;
        while (marksToDistribute > 0) {
            const marksForThisQ = Math.min(5, marksToDistribute);
            autoQuestions.push({
                id: currentPaper.id + '_auto_' + qIndex,
                q: qIndex.toString(),
                subQuestion: "",
                questionText: "",
                marks: marksForThisQ,
                co: "",
                bloom: "L2"
            });
            marksToDistribute -= marksForThisQ;
            qIndex++;
        }
        currentPaper = { ...currentPaper, questions: autoQuestions };
    }

    const updatePaperAndExam = (updatedPaper) => {
        const calculatedTotal = updatedPaper.questions.reduce((sum, q) => sum + (Number(q.marks || q.max || q.maxMarks) || 0), 0);
        updatedPaper.totalMarks = calculatedTotal;

        const newPapers = papers.filter(p => p.id !== currentPaper.id);
        newPapers.push(updatedPaper);
        dispatch({ type: 'UPDATE_PAPERS', val: newPapers });

        if (matchingExam) {
            const updatedExams = (st.exams || []).map(e => e.id === matchingExam.id ? { ...e, totalMarks: calculatedTotal, total: calculatedTotal } : e);
            dispatch({ type: 'SET_EXAMS', val: updatedExams });
        }
    };

    const calculatedTotal = currentPaper.questions.reduce((sum, q) => sum + (Number(q.marks || q.max || q.maxMarks) || 0), 0);

    React.useEffect(() => {
        if (!matchingExam || isNewPaper) return;
        if (calculatedTotal === fetchedTotalMarks) return;
        if (fetchedTotalMarks <= 0) return;

        const hasUserText = currentPaper.questions.some(q => {
             const text = q.questionText !== null && q.questionText !== undefined ? q.questionText : (q.text || "");
             return text.toString().trim() !== "";
        });

        let newQuestions = [...currentPaper.questions];

        if (!hasUserText) {
            newQuestions = [];
            let marksToDistribute = fetchedTotalMarks;
            let qIndex = 1;
            while (marksToDistribute > 0) {
                const marksForThisQ = Math.min(5, marksToDistribute);
                newQuestions.push({
                    id: currentPaper.id + '_auto_' + qIndex + '_' + Date.now(),
                    q: qIndex.toString(),
                    subQuestion: "",
                    questionText: "",
                    marks: marksForThisQ,
                    co: "",
                    bloom: "L2"
                });
                marksToDistribute -= marksForThisQ;
                qIndex++;
            }
        } else {
            if (calculatedTotal < fetchedTotalMarks) {
                let needed = fetchedTotalMarks - calculatedTotal;
                let qIndex = newQuestions.length + 1;
                while (needed > 0) {
                    const marks = Math.min(5, needed);
                    newQuestions.push({
                        id: currentPaper.id + '_auto_' + Date.now() + '_' + qIndex,
                        q: `Q ${qIndex}`,
                        subQuestion: "a",
                        questionText: "",
                        marks: marks,
                        co: "",
                        bloom: "L2"
                    });
                    needed -= marks;
                    qIndex++;
                }
            } else {
                let current = calculatedTotal;
                while (current > fetchedTotalMarks && newQuestions.length > 0) {
                    const removed = newQuestions.pop();
                    current -= (Number(removed.marks || removed.max || removed.maxMarks) || 0);
                }
                if (current < fetchedTotalMarks) {
                    newQuestions.push({
                        id: currentPaper.id + '_auto_rem_' + Date.now(),
                        q: `Q ${newQuestions.length + 1}`,
                        subQuestion: "a",
                        questionText: "",
                        marks: fetchedTotalMarks - current,
                        co: "",
                        bloom: "L2"
                    });
                }
            }
        }

        const updatedPaper = { ...currentPaper, questions: newQuestions, totalMarks: fetchedTotalMarks };
        const newPapers = papers.filter(p => p.id !== currentPaper.id);
        newPapers.push(updatedPaper);
        dispatch({ type: 'UPDATE_PAPERS', val: newPapers });

        const updatedExams = (st.exams || []).map(e => e.id === matchingExam.id ? { ...e, totalMarks: fetchedTotalMarks, total: fetchedTotalMarks } : e);
        dispatch({ type: 'SET_EXAMS', val: updatedExams });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchedTotalMarks, calculatedTotal, matchingExam?.id, currentPaper.id]);

    const handleAddQuestion = () => {
        const mainQuestions = currentPaper.questions.filter(q => (q.q !== null && q.q !== undefined ? q.q : (q.no || "")).toString().trim() !== "");
        const nextQNo = `Q ${mainQuestions.length + 1}`;
        const newQuestion = {
            // eslint-disable-next-line react-hooks/purity
            id: Date.now().toString(),
            q: nextQNo,
            subQuestion: "a",
            questionText: "",
            marks: 5,
            co: "",
            bloom: "L2"
        };
        
        const updatedPaper = {
            ...currentPaper,
            questions: [...currentPaper.questions, newQuestion]
        };

        updatePaperAndExam(updatedPaper);
    };

    const handleAddSubQuestion = () => {
        if (currentPaper.questions.length === 0) {
            alert("Please add a main question first before adding a sub-question.");
            return;
        }
        const lastQ = currentPaper.questions[currentPaper.questions.length - 1];
        let nextSub = 'a';
        if (lastQ && lastQ.subQuestion && lastQ.subQuestion.toString().trim().length > 0) {
            const charCode = lastQ.subQuestion.toString().trim().toLowerCase().charCodeAt(0);
            if (charCode >= 97 && charCode < 122) {
                nextSub = String.fromCharCode(charCode + 1);
            }
        }
        const newQuestion = {
            // eslint-disable-next-line react-hooks/purity
            id: Date.now().toString(),
            q: "",
            subQuestion: nextSub,
            questionText: "",
            marks: 5,
            co: lastQ ? lastQ.co : "",
            bloom: lastQ ? (lastQ.bloom || "L2") : "L2"
        };
        
        const updatedPaper = {
            ...currentPaper,
            questions: [...currentPaper.questions, newQuestion]
        };

        updatePaperAndExam(updatedPaper);
    };

    const handleUpdateQuestion = (qId, field, value) => {
        let cleanVal = value;
        if (field === 'marks') {
            if (value === "") cleanVal = "";
            else {
                const num = Number(value);
                if (isNaN(num)) return;
                cleanVal = Math.max(0, num);
            }
        }

        const updatedQuestions = currentPaper.questions.map(q => 
            q.id === qId ? { ...q, [field]: cleanVal } : q
        );
        
        const updatedPaper = {
            ...currentPaper,
            questions: updatedQuestions
        };

        updatePaperAndExam(updatedPaper);
    };

    const handleUpdatePaperDetail = (field, value) => {
        let cleanValue = value;
        if (field === "duration" && value !== "") {
            const num = Number(value);
            if (isNaN(num) || num < 0) return;
            cleanValue = String(Math.max(0, num));
        }
        const updatedPaper = { ...currentPaper, [field]: cleanValue };
        updatePaperAndExam(updatedPaper);
    };

    const handleRemoveQuestion = (qId) => {
        const updatedQuestions = currentPaper.questions.filter(q => q.id !== qId);
        
        const updatedPaper = {
            ...currentPaper,
            questions: updatedQuestions
        };

        updatePaperAndExam(updatedPaper);
    };

    const getTitle = () => {
        if (activeTab.startsWith('T')) return `${activeTab} — TA-${activeTab.replace('T', '')}`;
        return activeTab;
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Question Papers — CO-wise</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                Build each exam's question list and tag every question with the CO(s) it assesses.
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
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>

                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', margin: 0, marginTop: '12px' }}>{getTitle()}</h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>DATE OF EXAM</label>
                            <input 
                                type="date" 
                                value={currentPaper.date ? currentPaper.date.split('T')[0] : ""}
                                onChange={(e) => handleUpdatePaperDetail("date", e.target.value)}
                                style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#334155' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>DURATION (MINUTES)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 90" 
                                value={fetchedDuration}
                                onChange={(e) => handleUpdatePaperDetail("duration", e.target.value)}
                                disabled={!!matchingExam}
                                style={{ 
                                    padding: '6px 8px', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '4px', 
                                    fontSize: '13px', 
                                    color: '#334155', 
                                    width: '80px',
                                    background: matchingExam ? '#f8fafc' : '#fff',
                                    cursor: matchingExam ? 'not-allowed' : 'text'
                                }} 
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginTop: '14px', marginLeft: '8px' }}>
                            <span>· Total Marks: {fetchedTotalMarks}</span>
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 -24px 24px -24px' }} />

                {currentPaper.questions.some(q => !q.questionText?.trim() || !q.co || !q.marks || Number(q.marks) <= 0) && (
                    <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#92400e' }}>
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                        <div>
                            <strong>Validation Notice:</strong> Certain questions are missing required OBE parameters (Question Text, Course Outcome mapping, or valid Marks). Please complete highlighted fields for accurate attainment evaluation.
                        </div>
                    </div>
                )}

                <h3 style={{ fontSize: '14px', color: '#334155', fontWeight: '600', marginBottom: '16px' }}>Questions</h3>
                
                {/* Questions Table Format matching MSE requirement */}
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', color: '#0f172a', fontWeight: '700' }}>
                                <th style={{ border: '1px solid #cbd5e1', padding: '12px 8px', textAlign: 'center', width: '75px' }}>Q. No.</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '12px 6px', textAlign: 'center', width: '45px' }}></th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '12px 16px', textAlign: 'center' }}>Questions</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '12px 8px', textAlign: 'center', width: '75px' }}>Marks</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '12px 8px', textAlign: 'center', width: '75px' }}>COs</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '10px 8px', textAlign: 'center', width: '80px', lineHeight: '1.2' }}>'L'<br/>level</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '12px 4px', width: '45px', background: '#fff', borderRight: 'none', borderTop: 'none' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPaper.questions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', border: '1px solid #cbd5e1' }}>
                                        No questions added yet.
                                    </td>
                                </tr>
                            ) : (
                                currentPaper.questions.map((q, idx) => {
                                    const missingText = !(q.questionText !== null && q.questionText !== undefined ? q.questionText : (q.text || "")).toString().trim();
                                    const missingCO = !(q.co || (Array.isArray(q.cos) ? q.cos[0] : "") || "");
                                    const invalidMark = !q.marks || Number(q.marks) <= 0;
                                    return (
                                    <tr key={q.id || idx}>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', background: '#fff' }}>
                                            <input 
                                                type="text" 
                                                value={q.q !== null && q.q !== undefined ? q.q : (q.no || "")} 
                                                onChange={(e) => handleUpdateQuestion(q.id, 'q', e.target.value)}
                                                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '14px', fontWeight: q.q ? '600' : 'normal', color: '#334155', outline: 'none' }} 
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', background: '#fff' }}>
                                            <input 
                                                type="text" 
                                                value={q.subQuestion || q.subNo || q.sub || ""} 
                                                onChange={(e) => handleUpdateQuestion(q.id, 'subQuestion', e.target.value)}
                                                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '14px', color: '#475569', outline: 'none' }} 
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', verticalAlign: 'middle', background: '#fff' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Required question text..."
                                                value={q.questionText !== null && q.questionText !== undefined ? q.questionText : (q.text || "")} 
                                                onChange={(e) => handleUpdateQuestion(q.id, 'questionText', e.target.value)}
                                                style={{ width: '100%', border: missingText ? '1px dashed #ef4444' : 'none', padding: '4px 6px', borderRadius: '4px', background: missingText ? '#fef2f2' : 'transparent', fontSize: '14px', color: '#334155', outline: 'none' }} 
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px 4px', textAlign: 'center', verticalAlign: 'middle', background: '#fff' }}>
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={q.marks ?? q.max ?? ""} 
                                                onChange={(e) => handleUpdateQuestion(q.id, 'marks', e.target.value)}
                                                style={{ width: '100%', border: invalidMark ? '1px dashed #ef4444' : 'none', padding: '4px 2px', borderRadius: '4px', background: invalidMark ? '#fef2f2' : 'transparent', textAlign: 'center', fontSize: '14px', color: '#334155', outline: 'none' }} 
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', background: '#fff' }}>
                                            <select 
                                                value={q.co || (Array.isArray(q.cos) ? q.cos[0] : "") || ""} 
                                                onChange={(e) => handleUpdateQuestion(q.id, 'co', e.target.value)}
                                                style={{ width: '100%', border: missingCO ? '1px dashed #ef4444' : 'none', padding: '4px 2px', borderRadius: '4px', background: missingCO ? '#fef2f2' : 'transparent', textAlign: 'center', fontSize: '14px', color: missingCO ? '#ef4444' : '#334155', outline: 'none', cursor: 'pointer' }}
                                            >
                                                <option value="">--</option>
                                                {(st?.courseOutcomes || []).map(co => (
                                                    <option key={co.id} value={co.id}>{co.id}</option>
                                                ))}
                                                {!st?.courseOutcomes?.some(c => c.id === (q.co || (Array.isArray(q.cos) ? q.cos[0] : ""))) && (q.co || (Array.isArray(q.cos) ? q.cos[0] : "")) && (
                                                    <option value={q.co || q.cos[0]}>{q.co || q.cos[0]}</option>
                                                )}
                                            </select>
                                        </td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', background: '#fff' }}>
                                            <select 
                                                value={q.bloom || q.bloomLevel || q.lLevel || ""} 
                                                onChange={(e) => handleUpdateQuestion(q.id, 'bloom', e.target.value)}
                                                style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '14px', color: '#334155', outline: 'none', cursor: 'pointer' }}
                                            >
                                                <option value="">--</option>
                                                {['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].map(lvl => (
                                                    <option key={lvl} value={lvl}>{lvl}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '6px', textAlign: 'center', verticalAlign: 'middle', border: 'none' }}>
                                            <button 
                                                onClick={() => handleRemoveQuestion(q.id)}
                                                style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                title="Remove Question"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={handleAddQuestion}
                        style={{ 
                            flex: 1,
                            background: '#fff', 
                            border: '1px solid #1e3a8a', 
                            padding: '10px 16px', 
                            borderRadius: '6px', 
                            color: '#1e3a8a', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        + Add Main Question
                    </button>
                    <button 
                        onClick={handleAddSubQuestion}
                        style={{ 
                            flex: 1,
                            background: '#1e3a8a', 
                            border: '1px solid #1e3a8a', 
                            padding: '10px 16px', 
                            borderRadius: '6px', 
                            color: '#fff', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        + Add Sub-question
                    </button>
                </div>
            </div>
        </div>
    );
}
