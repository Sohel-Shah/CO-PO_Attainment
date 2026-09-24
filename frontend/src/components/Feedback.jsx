import React, { useState, useMemo } from 'react';
import { generateId } from '../utils/ui-utils';

export default function Feedback({ st, dispatch }) {
    const feedback = st?.feedback || [];
    const courseOutcomes = st?.courseOutcomes || [];
    const students = st?.students || [];

    // Modal state for adding a response
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalStudentRoll, setModalStudentRoll] = useState("");
    const [modalResponseText, setModalResponseText] = useState("Submitted");
    const [modalRatings, setModalRatings] = useState({});

    // Map responses directly from the active course student list (same as Mark Entry)
    const studentResponses = useMemo(() => {
        const fbList = st?.feedback || [];
        const studentsList = st?.students || [];

        return studentsList.map(student => {
            const roll = student.roll || student.rollNo || student.rollNumber || student.id;
            const name = student.name;

            // Find matching feedback for this student
            const matchedFb = fbList.find(fb =>
                (fb.studentId && (fb.studentId === roll || fb.studentId === student.id || fb.studentId === name)) ||
                (fb.id && (fb.id === `fb_${student.id}` || fb.id === `fb_${roll}`)) ||
                (fb.respondent && (fb.respondent === name || fb.respondent === roll || fb.respondent === student.id))
            );

            const ratings = {};
            if (matchedFb && matchedFb.ratings && typeof matchedFb.ratings === 'object') {
                Object.entries(matchedFb.ratings).forEach(([coKey, val]) => {
                    if (val !== undefined && val !== null && val !== "") {
                        ratings[coKey] = val;
                    }
                });
            }
            // Also check for individual CO feedback items if stored separately
            fbList.forEach(fb => {
                const matches = (fb.studentId && (fb.studentId === roll || fb.studentId === student.id || fb.studentId === name)) ||
                                (fb.id && (fb.id === `fb_${student.id}` || fb.id === `fb_${roll}`)) ||
                                (fb.respondent && (fb.respondent === name || fb.respondent === roll || fb.respondent === student.id));
                if (matches && fb.co && fb.rating !== undefined && fb.rating !== null && fb.rating !== "") {
                    ratings[fb.co] = fb.rating;
                }
            });

            const hasSubmitted = courseOutcomes.length > 0
                ? courseOutcomes.some(co => ratings[co.id] !== undefined && ratings[co.id] !== "" && ratings[co.id] !== null)
                : Object.keys(ratings).length > 0;

            const responseText = matchedFb?.response !== undefined 
                ? matchedFb.response 
                : (hasSubmitted ? "Submitted" : "");

            return {
                student,
                roll,
                name,
                ratings,
                hasSubmitted,
                responseText
            };
        });
    }, [st?.feedback, st?.students, st?.courseOutcomes]);

    const handleRatingChange = (student, coId, value) => {
        let newRating = value;
        if (value !== "") {
            const num = Number(value);
            if (isNaN(num)) return;
            newRating = String(Math.max(1, Math.min(5, num)));
        }
        const roll = student.roll || student.rollNo || student.rollNumber || student.id;
        const newFeedbackArray = [...feedback];
        
        const existingIdx = newFeedbackArray.findIndex(fb => 
            (fb.studentId && (fb.studentId === roll || fb.studentId === student.id || fb.studentId === student.name)) ||
            (fb.id && (fb.id === `fb_${student.id}` || fb.id === `fb_${roll}`)) ||
            (fb.respondent && (fb.respondent === student.name || fb.respondent === roll || fb.respondent === student.id))
        );
        
        if (existingIdx >= 0) {
            const existing = newFeedbackArray[existingIdx];
            if (existing.ratings && typeof existing.ratings === 'object') {
                newFeedbackArray[existingIdx] = { 
                    ...existing, 
                    studentId: roll,
                    respondent: student.name,
                    ratings: { ...existing.ratings, [coId]: newRating } 
                };
            } else {
                newFeedbackArray[existingIdx] = { 
                    ...existing, 
                    studentId: roll, 
                    respondent: student.name, 
                    ratings: { ...(existing.ratings || {}), [coId]: newRating } 
                };
            }
        } else {
            newFeedbackArray.push({
                id: `fb_${student.id || generateId()}`,
                studentId: roll,
                respondent: student.name,
                anonymous: false,
                ratings: { [coId]: newRating },
                category: "CourseExit"
            });
        }

        dispatch({ type: 'UPDATE_FEEDBACK', val: newFeedbackArray });
    };

    const handleResponseTextChange = (student, newText) => {
        const roll = student.roll || student.rollNo || student.rollNumber || student.id;
        const newFeedbackArray = [...feedback];
        
        const existingIdx = newFeedbackArray.findIndex(fb => 
            (fb.studentId && (fb.studentId === roll || fb.studentId === student.id || fb.studentId === student.name)) ||
            (fb.id && (fb.id === `fb_${student.id}` || fb.id === `fb_${roll}`)) ||
            (fb.respondent && (fb.respondent === student.name || fb.respondent === roll || fb.respondent === student.id))
        );
        
        if (existingIdx >= 0) {
            newFeedbackArray[existingIdx] = { 
                ...newFeedbackArray[existingIdx], 
                studentId: roll,
                respondent: student.name,
                response: newText
            };
        } else {
            newFeedbackArray.push({
                id: `fb_${student.id || generateId()}`,
                studentId: roll,
                respondent: student.name,
                response: newText,
                anonymous: false,
                ratings: {},
                category: "CourseExit"
            });
        }

        dispatch({ type: 'UPDATE_FEEDBACK', val: newFeedbackArray });
    };

    const openAddModal = () => {
        const unsubmitted = studentResponses.find(r => !r.hasSubmitted);
        const defaultStudent = unsubmitted || studentResponses[0];
        const defaultRoll = defaultStudent ? defaultStudent.roll : "";
        setModalStudentRoll(defaultRoll);
        setModalResponseText(defaultStudent ? (defaultStudent.responseText || "Submitted") : "Submitted");
        setModalRatings(defaultStudent ? { ...defaultStudent.ratings } : {});
        setShowAddModal(true);
    };

    const handleModalStudentChange = (roll) => {
        setModalStudentRoll(roll);
        const target = studentResponses.find(r => r.roll === roll);
        setModalResponseText(target ? (target.responseText || "Submitted") : "Submitted");
        setModalRatings(target ? { ...target.ratings } : {});
    };

    const handleModalRatingChange = (coId, val) => {
        setModalRatings(prev => ({ ...prev, [coId]: val }));
    };

    const handleModalSubmit = (e) => {
        e.preventDefault();
        if (!modalStudentRoll) return;
        const targetResp = studentResponses.find(r => r.roll === modalStudentRoll);
        if (!targetResp) return;
        
        const newFeedbackArray = [...feedback];
        const student = targetResp.student;
        const roll = modalStudentRoll;
        
        const existingIdx = newFeedbackArray.findIndex(fb => 
            (fb.studentId && (fb.studentId === roll || fb.studentId === student.id || fb.studentId === student.name)) ||
            (fb.id && (fb.id === `fb_${student.id}` || fb.id === `fb_${roll}`)) ||
            (fb.respondent && (fb.respondent === student.name || fb.respondent === roll || fb.respondent === student.id))
        );

        if (existingIdx >= 0) {
            const existing = newFeedbackArray[existingIdx];
            newFeedbackArray[existingIdx] = {
                ...existing,
                studentId: roll,
                respondent: student.name,
                response: modalResponseText,
                ratings: { ...(existing.ratings || {}), ...modalRatings }
            };
        } else {
            newFeedbackArray.push({
                id: `fb_${student.id || generateId()}`,
                studentId: roll,
                respondent: student.name,
                response: modalResponseText,
                anonymous: false,
                ratings: { ...modalRatings },
                category: "CourseExit"
            });
        }

        dispatch({ type: 'UPDATE_FEEDBACK', val: newFeedbackArray });
        setShowAddModal(false);
    };

    const calculateAverages = () => {
        const avgs = {};
        courseOutcomes.forEach(co => {
            const validRatings = studentResponses
                .map(r => r.ratings[co.id])
                .filter(val => val !== undefined && val !== null && val !== "" && !isNaN(Number(val)))
                .map(Number);
            avgs[co.id] = validRatings.length > 0 ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) : "0.0";
        });
        return avgs;
    };

    const averages = calculateAverages();

    return (
        <div style={{ paddingBottom: '40px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 className="pagetitle" style={{ margin: 0 }}>Course Exit Feedback</h1>
                    <div className="pagesub" style={{ marginTop: '8px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                        Indirect CO attainment tool — students self-rate how well each Course Outcome was achieved. Used alongside exam-based (direct) attainment.
                    </div>
                </div>
                <button 
                    onClick={openAddModal} 
                    style={{ background: '#328470', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                    + Add Response
                </button>
            </div>

            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', lineHeight: '1.6' }}>
                Typical use: at the end of the course, ask each student to rate their own achievement of every CO on a 1-5 scale (1 = not achieved, 5 = fully achieved). Enter ratings below for each student assigned to this course.
            </div>

            {/* Card 1: Survey Settings */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '16px' }}>Survey settings</h2>
                
                <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>RATING SCALE MAXIMUM (E.G. 5 FOR A 1-5 LIKERT SCALE)</label>
                <input type="text" defaultValue="5" readOnly style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#334155', background: '#f8fafc' }} />
            </div>

            {/* Card 2: Responses */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', margin: 0 }}>Responses ({studentResponses.length})</h2>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Showing student roster matching Mark Entry
                        </span>
                        <button onClick={openAddModal} style={{ background: '#328470', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Add Response</button>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1, minWidth: '160px', fontWeight: '600' }}>Student Name</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', minWidth: '120px', fontWeight: '600' }}>Roll No</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', minWidth: '150px', fontWeight: '600' }}>Response</th>
                            {courseOutcomes.map(co => (
                                <th key={co.id} style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                                    {co.id}<br />/5
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {studentResponses.length === 0 ? (
                            <tr>
                                <td colSpan={courseOutcomes.length + 3} style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b', background: '#f8fafc' }}>
                                    ⚠️ No students assigned to this subject yet. Please assign or import students in the "Student Registry" tab first.
                                </td>
                            </tr>
                        ) : (
                            studentResponses.map((r) => (
                                <tr key={r.roll} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #f1f5f9', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}>
                                        {r.name}
                                    </td>
                                    <td style={{ padding: '12px', color: '#64748b', borderRight: '1px solid #f1f5f9', fontSize: '13px', borderBottom: '1px solid #e2e8f0' }}>
                                        {r.roll}
                                    </td>
                                    <td style={{ padding: '8px 12px', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                        <input 
                                            type="text" 
                                            value={r.responseText || ""} 
                                            onChange={(e) => handleResponseTextChange(r.student, e.target.value)}
                                            placeholder="Enter response..."
                                            style={{ width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#1e293b', background: '#fff' }} 
                                        />
                                    </td>
                                    {courseOutcomes.map(co => (
                                        <td key={co.id} style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="5" 
                                                value={r.ratings[co.id] || ""} 
                                                onChange={(e) => handleRatingChange(r.student, co.id, e.target.value)}
                                                style={{ width: '60px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', textAlign: 'center' }} 
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Card 3: Indirect attainment summary */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '24px' }}>Indirect attainment summary</h2>

                {courseOutcomes.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>Define Course Outcomes first.</div>
                ) : (
                    <div style={{ display: 'flex', gap: '20px', height: '100px', alignItems: 'flex-end', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '24px', overflowX: 'auto' }}>
                        {courseOutcomes.map(co => (
                            <div key={co.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '40px' }}>
                                <div style={{ fontSize: '10px', color: '#1e293b', fontWeight: 'bold' }}>{averages[co.id]}</div>
                                <div style={{ width: '20px', height: `${Math.max(2, (Number(averages[co.id]) / 5) * 60)}px`, background: Number(averages[co.id]) > 0 ? '#328470' : '#e2e8f0', borderRadius: '2px' }}></div>
                                <div style={{ fontSize: '11px', color: '#475569' }}>{co.id}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for adding/editing a response */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '10px', width: '90%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: 'bold' }}>Add / Edit Response</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                        </div>

                        <form onSubmit={handleModalSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Select Student
                                </label>
                                <select 
                                    value={modalStudentRoll} 
                                    onChange={(e) => handleModalStudentChange(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#1e293b', background: '#fff', outline: 'none' }}
                                    required
                                >
                                    <option value="" disabled>-- Select a student --</option>
                                    {studentResponses.map(r => (
                                        <option key={r.roll} value={r.roll}>
                                            {r.roll} — {r.name}{r.responseText ? ` (${r.responseText})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Response
                                </label>
                                <input 
                                    type="text" 
                                    value={modalResponseText} 
                                    onChange={(e) => setModalResponseText(e.target.value)}
                                    placeholder="e.g., Submitted / Form #10"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#1e293b', background: '#fff', outline: 'none' }}
                                />
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>
                                    Enter CO Ratings (1 to 5)
                                </label>
                                {courseOutcomes.length === 0 ? (
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>No course outcomes defined yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '240px', overflowY: 'auto' }}>
                                        {courseOutcomes.map(co => (
                                            <div key={co.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a8a' }}>{co.id}</span>
                                                    <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }} title={co.desc}>
                                                        {co.desc || "Rating out of 5"}
                                                    </div>
                                                </div>
                                                <select 
                                                    value={modalRatings[co.id] || ""} 
                                                    onChange={(e) => handleModalRatingChange(co.id, e.target.value)}
                                                    style={{ width: '100px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', textAlign: 'center', fontWeight: '600', background: '#fff' }}
                                                >
                                                    <option value="">--</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddModal(false)} 
                                    style={{ padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    style={{ padding: '8px 18px', background: '#328470', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                >
                                    Save Response
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
