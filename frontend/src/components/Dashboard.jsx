import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import SyllabusUpload from './SyllabusUpload';

export default function Dashboard({ st, dispatch, user }) {
    const { addToast } = useToast();
    const [facultyList, setFacultyList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem("app_token") || "";
                
                // Fetch Faculty
                const facRes = await fetch(`http://${window.location.hostname}:3001/api/v2/academic-planner/faculty`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (facRes.ok) {
                    const data = await facRes.json();
                    setFacultyList(Array.isArray(data) ? data : []);
                }

                // Fetch Categories
                const catRes = await fetch(`http://${window.location.hostname}:3001/api/v2/academic-planner/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (catRes.ok) {
                    const data = await catRes.json();
                    setCategoryList(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard lookup data", err);
            }
        };
        loadData();
    }, []);

    const handleAddCO = () => {
        const newCO = { id: `CO${(st.courseOutcomes || []).length + 1}`, desc: '' };
        dispatch({ type: 'SET_COURSE_OUTCOMES', val: [...(st.courseOutcomes || []), newCO] });
    };

    const handleCOChange = (index, field, value) => {
        const updatedCos = [...(st.courseOutcomes || [])];
        updatedCos[index] = { ...updatedCos[index], [field]: value };
        dispatch({ type: 'SET_COURSE_OUTCOMES', val: updatedCos });
    };

    const handleDeleteCO = (index) => {
        const updatedCos = (st.courseOutcomes || []).filter((_, i) => i !== index);
        const renumberedCos = updatedCos.map((co, i) => ({ ...co, id: `CO${i + 1}`, coNumber: `CO${i + 1}` }));
        dispatch({ type: 'SET_COURSE_OUTCOMES', val: renumberedCos });
    };

    // Helper for controlled inputs
    const handleCourseChange = (field, val) => {
        dispatch({ type: 'SET_COURSE_FIELD', field, val });
    };
    const handleRootChange = (field, val) => {
        dispatch({ type: 'SET_FIELD', field, val });
    };

    const cos = st.courseOutcomes || [];

    const cleanMax = (val, max = 100) => {
        if (val === "" || val === null || val === undefined) return "";
        const cleaned = String(val).replace(/[^0-9.]/g, "");
        const num = Number(cleaned);
        if (!isNaN(num) && num > max) return String(max);
        if (!isNaN(num) && num < 0) return "0";
        return cleaned;
    };

    const getCompWeight = (comp) => st.coursePlan?.weightage?.[comp] || (comp === 'MSE' ? '30' : comp === 'ESE' ? '50' : '7');
    const updateCompWeight = (comp, val) => {
        let cleaned = cleanMax(val, 100);
        const currentWeights = { ...(st.coursePlan?.weightage || { T1: '7', T2: '7', T3: '6', MSE: '30', ESE: '50' }) };
        
        const components = ['T1', 'T2', 'T3', 'MSE', 'ESE'];
        const othersTotal = components.reduce((sum, key) => {
            if (key === comp) return sum;
            return sum + (parseInt(currentWeights[key] || 0, 10));
        }, 0);

        let requestedVal = cleaned === "" ? 0 : parseInt(cleaned || 0, 10);
        if (requestedVal + othersTotal > 100) {
            const maxAllowed = Math.max(0, 100 - othersTotal);
            cleaned = String(maxAllowed);
            if (requestedVal > maxAllowed) {
                addToast(`Maximum total weightage allowed across all components (T1, T2, T3, MSE, ESE) is 100%.\n\nSetting ${comp} to ${maxAllowed}% to prevent exceeding the total limit.`, "warning");
            }
        }

        currentWeights[comp] = cleaned;
        handleCourseChange('weightage', currentWeights);
    };

    const updateDirectWeight = (val) => {
        let cleaned = cleanMax(val, 100);
        const other = Number(st.indirectWeight || 20);
        const req = Number(cleaned || 0);
        if (req + other > 100) {
            cleaned = String(Math.max(0, 100 - other));
            addToast("Combined Direct and Indirect Attainment Weight % cannot exceed 100%.", "warning");
        }
        dispatch({ type: 'SET_WEIGHTS', dw: cleaned, iw: st.indirectWeight });
    };

    const updateIndirectWeight = (val) => {
        let cleaned = cleanMax(val, 100);
        const other = Number(st.directWeight || 80);
        const req = Number(cleaned || 0);
        if (req + other > 100) {
            cleaned = String(Math.max(0, 100 - other));
            addToast("Combined Direct and Indirect Attainment Weight % cannot exceed 100%.", "warning");
        }
        dispatch({ type: 'SET_WEIGHTS', iw: cleaned, dw: st.directWeight });
    };

    const updateDirectPoWeight = (val) => {
        let cleaned = cleanMax(val, 100);
        const other = Number(st.coursePlan?.indirectPoWeight || 20);
        const req = Number(cleaned || 0);
        if (req + other > 100) {
            cleaned = String(Math.max(0, 100 - other));
            addToast("Combined Direct and Indirect PO Weight % cannot exceed 100%.", "warning");
        }
        handleCourseChange('directPoWeight', cleaned);
    };

    const updateIndirectPoWeight = (val) => {
        let cleaned = cleanMax(val, 100);
        const other = Number(st.coursePlan?.directPoWeight || 80);
        const req = Number(cleaned || 0);
        if (req + other > 100) {
            cleaned = String(Math.max(0, 100 - other));
            addToast("Combined Direct and Indirect PO Weight % cannot exceed 100%.", "warning");
        }
        handleCourseChange('indirectPoWeight', cleaned);
    };

    const sumWeights = () => {
        const w = st.coursePlan?.weightage || { T1: '7', T2: '7', T3: '6', MSE: '30', ESE: '50' };
        return parseInt(w.T1 || 0) + parseInt(w.T2 || 0) + parseInt(w.T3 || 0) + parseInt(w.MSE || 0) + parseInt(w.ESE || 0);
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Course & CO-PO Setup</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px' }}>
                Course details, course outcomes, and the CO→PO/PSO articulation matrix. This feeds every calculation in the app.
            </div>

            {/* AI Syllabus Upload */}
            <SyllabusUpload st={st} dispatch={dispatch} />

            {/* Course Information */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Course information</h2>

                <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>COURSE NAME</label>
                        <input type="text" value={st.coursePlan?.course || ""} onChange={(e) => handleCourseChange('course', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="New Course" />
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>COURSE CODE</label>
                        <input type="text" value={st.coursePlan?.code || ""} onChange={(e) => handleCourseChange('code', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="Code" />
                    </div>

                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>COURSE CATEGORY CODE</label>
                        <select value={st.coursePlan?.category || ""} onChange={(e) => handleCourseChange('category', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff' }}>
                            <option value="">— Select Category —</option>
                            {categoryList.length > 0 ? categoryList.map(c => (
                                <option key={c.category} value={c.category}>{c.category} — {c.label}</option>
                            )) : (
                                <option value={st.coursePlan?.category}>{st.coursePlan?.category || 'Loading...'}</option>
                            )}
                        </select>
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>PROGRAMME</label>
                        <input type="text" value={st.programName || ""} onChange={(e) => handleRootChange('programName', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="B.Tech" />
                    </div>

                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>SEMESTER (E.G. I, II, .., VIII)</label>
                        <input type="text" value={st.selectedSemester || ""} onChange={(e) => handleRootChange('selectedSemester', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="I" />
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>COURSE NUMBER (WITHIN SEMESTER)</label>
                        <input type="text" value={st.coursePlan?.courseNumber || ""} onChange={(e) => handleCourseChange('courseNumber', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>

                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>COURSE_ID (AUTO — SEMESTER×100 + COURSE NUMBER)</label>
                        <input type="text" readOnly value={st.coursePlan?.code || ""} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc', color: '#94a3b8' }} />
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>ACADEMIC YEAR (CAY)</label>
                        <input type="text" value={st.academicYear || ""} onChange={(e) => handleRootChange('academicYear', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="2026-27" />
                    </div>

                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>FACULTY NAME</label>
                        <select value={st.facultyName || ""} onChange={(e) => handleRootChange('facultyName', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff' }}>
                            <option value="">— Select Faculty —</option>
                            {facultyList.length > 0 ? facultyList.map(f => (
                                <option key={f.id || f.name} value={f.name}>{f.name}</option>
                            )) : (
                                <option value={st.facultyName}>{st.facultyName || 'Loading...'}</option>
                            )}
                        </select>
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>CREDITS</label>
                        <input type="text" value={st.coursePlan?.credits || ""} onChange={(e) => handleCourseChange('credits', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="3" />
                    </div>
                </div>

                <div className="field" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>ACADEMIC YEAR CYCLE (FOR 3-YEAR ATTAINMENT TRACKING)</label>
                    <select value={st.coursePlan?.academicCycle || "CAY"} onChange={(e) => handleCourseChange('academicCycle', e.target.value)} style={{ width: '50%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff' }}>
                        <option value="CAY">CAY — Current Academic Year</option>
                        <option value="CAYm1">CAYm1 — CAY minus 1 year</option>
                        <option value="CAYm2">CAYm2 — CAY minus 2 years</option>
                    </select>
                </div>

                <div className="hint" style={{ marginBottom: '24px', color: '#64748b', fontSize: '11px', lineHeight: '1.6' }}>
                    Academic Year and Cycle are linked: enter the <strong>Academic Year on the CAY course</strong> (e.g. "2026-27") and its CAYm1/CAYm2 copies automatically show "2025-26" / "2024-25" — editing the CAY course's year also updates its linked copies. Changing a copy's Cycle dropdown re-derives its year from its CAY sibling. To keep 3 years of this course (for NBA/IQAC trend reporting): go to <strong>All Courses</strong>, click <strong>Copy</strong> on this course, then set the copy's Cycle to CAYm1 or CAYm2 — the year fills in automatically. Keep the <strong>same Course Code</strong> across all three copies so they stay linked and group together in the "3-Year Attainment Trend" tab.
                </div>

                <div className="field">
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>TEACHING SCHEME (HOURS/WEEK)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', width: '50%' }}>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>LECTURE (L)</label>
                            <input type="text" value={st.coursePlan?.ltp?.split('-')[0] || ""} onChange={(e) => handleCourseChange('ltp', `${e.target.value}-${st.coursePlan?.ltp?.split('-')[1] || '0'}-${st.coursePlan?.ltp?.split('-')[2] || '0'}-${st.coursePlan?.ltp?.split('-')[3] || '0'}`)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="3" />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>PRACTICAL (P)</label>
                            <input type="text" value={st.coursePlan?.ltp?.split('-')[2] || ""} onChange={(e) => handleCourseChange('ltp', `${st.coursePlan?.ltp?.split('-')[0] || '0'}-${st.coursePlan?.ltp?.split('-')[1] || '0'}-${e.target.value}-${st.coursePlan?.ltp?.split('-')[3] || '0'}`)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="0" />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>TUTORIAL (T)</label>
                            <input type="text" value={st.coursePlan?.ltp?.split('-')[1] || ""} onChange={(e) => handleCourseChange('ltp', `${st.coursePlan?.ltp?.split('-')[0] || '0'}-${e.target.value}-${st.coursePlan?.ltp?.split('-')[2] || '0'}-${st.coursePlan?.ltp?.split('-')[3] || '0'}`)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="0" />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>SELF-STUDY (S)</label>
                            <input type="text" value={st.coursePlan?.ltp?.split('-')[3] || ""} onChange={(e) => handleCourseChange('ltp', `${st.coursePlan?.ltp?.split('-')[0] || '0'}-${st.coursePlan?.ltp?.split('-')[1] || '0'}-${st.coursePlan?.ltp?.split('-')[2] || '0'}-${e.target.value}`)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} placeholder="0" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Outcomes (COs) */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Course Outcomes (COs)</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '80px', borderBottom: '1px solid #e2e8f0' }}>CO</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>DESCRIPTION</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', width: '40px', borderBottom: '1px solid #e2e8f0' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cos.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ padding: '20px', background: '#f1f5f9', textAlign: 'center', color: '#64748b' }}>No Course Outcomes added yet.</td>
                            </tr>
                        ) : (
                            cos.map((co, index) => (
                                <tr key={index}>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>{co.id || co.coNumber}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0' }}>
                                        <input
                                            type="text"
                                            value={co.description || co.desc || ""}
                                            onChange={(e) => handleCOChange(index, 'desc', e.target.value)}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                                            placeholder="Enter CO description"
                                        />
                                    </td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                                        <button onClick={() => handleDeleteCO(index)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <button onClick={handleAddCO} style={{ background: '#328470', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>+ Add CO</button>
            </div>

            {/* CO -> PO/PSO Articulation Matrix */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>CO → PO/PSO Articulation Matrix</h2>
                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '20px' }}>
                    Scale: 3 = Substantial, 2 = Moderate, 1 = Slight, 0/blank = No correlation.
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>CO</th>
                                {['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PSO1', 'PSO2', 'PSO3'].map(p => (
                                    <th key={p} style={{ padding: '10px 8px', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{p}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cos.map((co) => (
                                <tr key={co.id || co.coNumber}>
                                    <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#334155', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>{co.id || co.coNumber}</td>
                                    {['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PSO1', 'PSO2', 'PSO3'].map(p => (
                                        <td key={p} style={{ padding: '8px', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                            <input type="text" style={{ width: '30px', textAlign: 'center', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }} 
                                                   value={st.copoMap?.[co.id || co.coNumber]?.[p] || ""}
                                                   onChange={(e) => dispatch({ type: 'SET_COPO', co: (co.id || co.coNumber), po: p, val: cleanMax(e.target.value, 3) })}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {cos.length === 0 && (
                                <tr><td colSpan="15" style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>Add Course Outcomes to fill matrix</td></tr>
                            )}
                            <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#334155', borderRight: '1px solid #e2e8f0' }}>Average</td>
                                {['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PSO1', 'PSO2', 'PSO3'].map(p => {
                                    let sum = 0, count = 0;
                                    cos.forEach(co => {
                                        const v = parseInt(st.copoMap?.[co.id || co.coNumber]?.[p]);
                                        if (v > 0) { sum += v; count++; }
                                    });
                                    return (
                                        <td key={p} style={{ padding: '10px 8px', fontSize: '12px', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                                            {count > 0 ? (sum/count).toFixed(1) : "0.0"}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assessment weightage & targets */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>Assessment weightage & targets</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>COMPONENT</th>
                            {['T1', 'T2', 'T3', 'MSE', 'ESE', 'TOTAL'].map(c => (
                                <th key={c} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#334155' }}>Weightage %</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}><input type="text" value={getCompWeight('T1')} onChange={(e) => updateCompWeight('T1', e.target.value)} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }} /></td>
                            <td style={{ padding: '8px', textAlign: 'center' }}><input type="text" value={getCompWeight('T2')} onChange={(e) => updateCompWeight('T2', e.target.value)} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }} /></td>
                            <td style={{ padding: '8px', textAlign: 'center' }}><input type="text" value={getCompWeight('T3')} onChange={(e) => updateCompWeight('T3', e.target.value)} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }} /></td>
                            <td style={{ padding: '8px', textAlign: 'center' }}><input type="text" value={getCompWeight('MSE')} onChange={(e) => updateCompWeight('MSE', e.target.value)} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }} /></td>
                            <td style={{ padding: '8px', textAlign: 'center' }}><input type="text" value={getCompWeight('ESE')} onChange={(e) => updateCompWeight('ESE', e.target.value)} style={{ width: '50px', padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '4px' }} /></td>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: sumWeights() === 100 ? '#10b981' : '#ef4444' }}>{sumWeights()}</td>
                        </tr>
                    </tbody>
                </table>
                {sumWeights() !== 100 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c' }}>
                        ⚠️ <strong>Validation Warning:</strong> Assessment component weightages currently sum to {sumWeights()}%, but must equal exactly 100%.
                    </div>
                )}

                <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>STUDENT PASS THRESHOLD PER CO (% MARKS IN THAT CO'S QUESTIONS TO COUNT AS "ATTAINED")</label>
                        <input type="text" value={st.coursePlan?.passThreshold || "60"} onChange={(e) => handleCourseChange('passThreshold', cleanMax(e.target.value, 100))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>PO/PSO ATTAINMENT TARGET LEVEL (0-3 SCALE)</label>
                        <input type="text" value={st.coursePlan?.poTarget || "2"} onChange={(e) => handleCourseChange('poTarget', cleanMax(e.target.value, 3))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>

                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>DIRECT ATTAINMENT WEIGHT % (IN OVERALL CO ATTAINMENT)</label>
                        <input type="text" value={st.directWeight || "80"} onChange={(e) => updateDirectWeight(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>INDIRECT ATTAINMENT WEIGHT % (COURSE-EXIT FEEDBACK)</label>
                        <input type="text" value={st.indirectWeight || "20"} onChange={(e) => updateIndirectWeight(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>

                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>DIRECT PO WEIGHT % (IN FINAL PO ATTAINMENT)</label>
                        <input type="text" value={st.coursePlan?.directPoWeight || "80"} onChange={(e) => updateDirectPoWeight(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>
                    <div className="field">
                        <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>INDIRECT PO WEIGHT % (ALUMNI/EMPLOYER/GRAD SURVEYS)</label>
                        <input type="text" value={st.coursePlan?.indirectPoWeight || "20"} onChange={(e) => updateIndirectPoWeight(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                    </div>
                </div>

                <div className="field" style={{ marginTop: '24px' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>CO ATTAINMENT LEVEL BANDS (% OF CLASS CROSSING THE PASS THRESHOLD ABOVE)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '60%' }}>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>LEVEL 3 IF ≥</label>
                            <input type="text" value={st.coursePlan?.level3 || "70"} onChange={(e) => handleCourseChange('level3', cleanMax(e.target.value, 100))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>LEVEL 2 IF ≥</label>
                            <input type="text" value={st.coursePlan?.level2 || "60"} onChange={(e) => handleCourseChange('level2', cleanMax(e.target.value, 100))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                            <label style={{ display: 'block', fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>LEVEL 1 IF ≥</label>
                            <input type="text" value={st.coursePlan?.level1 || "50"} onChange={(e) => handleCourseChange('level1', cleanMax(e.target.value, 100))} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Access Control */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>Access Control</h2>
                <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '20px', lineHeight: '1.5' }}>
                    People listed here can open this course. <strong>Owner</strong> can also manage this list and delete the course; <strong>Editor</strong> can edit all data; <strong>Viewer</strong> can look but not change anything. Admins (HOD/IQAC) can always access every course regardless of this list.
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>NAME</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', width: '150px', borderBottom: '1px solid #e2e8f0' }}>ROLE</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', width: '50px', borderBottom: '1px solid #e2e8f0' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={st.facultyName || user?.name || 'Loading…'}
                                    title={st.facultyName || user?.name || ''}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc' }}
                                />
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                                <select style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#f8fafc' }} disabled>
                                    <option>Owner</option>
                                </select>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <button style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'not-allowed' }}>+ Add person (Coming soon)</button>

                <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '16px' }}>
                    Names auto-suggest from the workspace user directory (manage it on the Home page) — add someone there first if they're not showing up.
                </div>
            </div>
        </div>
    );
}
