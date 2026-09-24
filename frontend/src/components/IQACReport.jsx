import React, { useState, useEffect } from 'react';
import { S, I } from '../utils/ui-utils';
import { useToast } from '../context/ToastContext';
import { ALL_POS, combinedCOAttainment, finalPOAttainment } from '../utils/attainmentCalculator';

export default function IQACReport({ st, dispatch, user }) {
    const cp = st.coursePlan || {};
    const cos = st.courseOutcomes || [];
    const currentYear = st.academicYear || '';
    const courseCode = cp.code || '';
    const courseName = cp.course || '';
    const { addToast } = useToast();

    // Load report fields
    const rConfig = st.report || {};
    const [inst, setInst] = useState(rConfig.institute ?? 'Sardar Patel Institute of Technology');
    const [dept, setDept] = useState(rConfig.department ?? 'Mechanical Engineering (ME)');
    const [hod, setHod] = useState(rConfig.hodName ?? 'Dr. Nagesh Ghougule');
    const [iqac, setIqac] = useState(rConfig.iqacCoordinator ?? '');
    const [rem, setRem] = useState(rConfig.remarks ?? '');

    // Sync with backend state when it loads
    useEffect(() => {
        if (st.report) {
            setInst(st.report.institute ?? 'Sardar Patel Institute of Technology');
            setDept(st.report.department ?? 'Mechanical Engineering (ME)');
            setHod(st.report.hodName ?? 'Dr. Nagesh Ghougule');
            setIqac(st.report.iqacCoordinator ?? '');
            setRem(st.report.remarks ?? '');
        }
    }, [st.report]);

    // 3-Year Trend loader (simple internal helper to query matching year attainments)
    const [trendData, setTrendData] = useState([]);
    useEffect(() => {
        const loadTrend = async () => {
            try {
                const res = await fetch(`http://${window.location.hostname}:3001/api/courses`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("app_token")}` }
                });
                if (res.ok) {
                    const all = await res.json();
                    const siblings = all.filter(c => 
                        (c.code && c.code === courseCode) || 
                        (c.name && c.name.toLowerCase() === courseName.toLowerCase())
                    );
                    const parsed = siblings.map(c => ({
                        year: c.academicYear,
                        id: c.courseId
                    })).sort((a,b) => b.year.localeCompare(a.year));
                    
                    const list = [];
                    for (const s of parsed.slice(0, 3)) {
                        const attRes = await fetch(`http://${window.location.hostname}:3001/api/report/courses/${s.id}/attainment`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem("app_token")}` }
                        });
                        if (attRes.ok) {
                            const att = await attRes.json();
                            const poMap = {};
                            (att.poAttainment || []).forEach(p => { poMap[p.id] = p.attainment; });
                            list.push({ year: s.year, poAttainment: poMap });
                        }
                    }
                    setTrendData(list);
                }
            } catch (e) {
                console.error("IQAC Trend loading error:", e);
            }
        };
        loadTrend();
    }, [courseCode, courseName]);

    // Save report data helper
    const handleSave = () => {
        if (!inst?.trim() || !dept?.trim() || !hod?.trim() || !iqac?.trim()) {
            addToast("Please fill all required header fields.", "error");
            return;
        }

        dispatch({
            type: "SET_REPORT",
            val: {
                institute: inst.trim(),
                department: dept.trim(),
                hodName: hod.trim(),
                iqacCoordinator: iqac.trim(),
                remarks: rem?.trim() || ''
            }
        });
        addToast("Report template meta-data updated!", "success");
    };

    // Calculate outcomes dynamically
    const coAttainments = cos.map(co => ({
        id: co.id,
        desc: co.desc,
        bloom: co.bloom,
        ...combinedCOAttainment(st, co.id)
    }));

    const poResults = finalPOAttainment(st);



    return (
        <div>
            {/* Header / Actions Row */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", margin: "0 0 6px" }}>IQAC Course Audit Report</h2>
                    <p style={{ fontSize: 13, color: "var(--text-sub)", margin: 0 }}>Configure and print the formal accreditation audit dossier for HOD and IQAC cell review.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleSave} className="btn ghost">
                        Save Header Info
                    </button>
                    <button onClick={() => window.print()} className="btn teal">
                        Print Document
                    </button>
                </div>
            </div>

            {/* Config Fields Card */}
            <div className="no-print card">
                <h3 style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>Configure Report Fields</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 180px", gap: 12, marginBottom: 12 }}>
                    <div className="field">
<label>Institute Name</label>
                        <input  value={inst} onChange={e => setInst(e.target.value)} />
                    </div>
                    <div className="field">
<label>Department Name</label>
                        <input  value={dept} onChange={e => setDept(e.target.value)} />
                    </div>
                    <div className="field">
<label>HOD Name</label>
                        <input  value={hod} onChange={e => setHod(e.target.value)} />
                    </div>
                    <div className="field">
<label>IQAC Coordinator</label>
                        <input  value={iqac} onChange={e => setIqac(e.target.value)} />
                    </div>
                </div>
                <div className="field">
<label>IQAC Auditor / Coordinator Remarks</label>
                    <textarea  rows={2} placeholder="Add comments regarding mapping gaps, low attainment actions, or syllabus deviation..." value={rem} onChange={e => setRem(e.target.value)} />
                </div>
            </div>

            {/* Printable Report Sheet Document */}
            <div style={{
                background: "#FFF",
                color: "#1B2430",
                padding: "40px",
                borderRadius: "10px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                fontFamily: "Georgia, serif",
                fontSize: "13.5px",
                lineHeight: "1.6"
            }}>
                <style>{`
                    @media print {
                        body { background: #FFF !important; color: #000 !important; }
                        .no-print { display: none !important; }
                        #app { display: block !important; }
                        #main { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
                    }
                `}</style>

                {/* Audit Cover Block */}
                <div style={{ textAlign: "center", borderBottom: "3px solid #1F3350", paddingBottom: 24, marginBottom: 24 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: "#1F3350" }}>{inst}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Department of {dept}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 20, color: "#2C4A73" }}>COURSE OUTCOME &amp; PROGRAM OUTCOME ATTAINMENT DOSSIER</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "#2F7D76" }}>{courseName} ({courseCode})</div>
                </div>

                {/* Course Metadata Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 30px", marginBottom: 24, fontSize: "13px", borderBottom: "1px solid #DEDAD0", paddingBottom: 16 }}>
                    <div><b>Academic Year:</b> {currentYear}</div>
                    <div><b>Semester:</b> {st.selectedSemester}</div>
                    <div><b>Faculty Coordinator:</b> {st.facultyName || user?.name || ''}</div>
                    <div><b>Course Structure (L-T-P-C):</b> {cp.ltp || '3-0-2-4'} ({cp.credits || 4} Credits)</div>
                </div>

                {/* Section A: CO Statements */}
                <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, borderBottom: "1px solid #1F3350", paddingBottom: 4, color: "#1F3350", fontWeight: 700 }}>SECTION A: COURSE OUTCOMES</h3>
                    <div className="tablewrap"><table className="data">
                        <thead>
                            <tr style={{ background: "#EEF0E9", borderBottom: "2px solid #1F3350" }}>
                                <th style={{ padding: "6px 8px", width: "60px", textAlign: "center" }}>CO</th>
                                <th style={{ padding: "6px 8px", textAlign: "left" }}>Course Outcome Description</th>
                                <th style={{ padding: "6px 8px", width: "90px", textAlign: "center" }}>Bloom Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cos.map(co => (
                                <tr key={co.id} style={{ borderBottom: "1px solid #DEDAD0" }}>
                                    <td style={{ padding: "8px", fontWeight: 700, textAlign: "center" }}>{co.id}</td>
                                    <td style={{ padding: "8px", textAlign: "left" }}>{co.desc}</td>
                                    <td style={{ padding: "8px", textAlign: "center", fontWeight: 600 }}>{co.bloom}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                </div>

                {/* Section B: CO-PO Matrix */}
                <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, borderBottom: "1px solid #1F3350", paddingBottom: 4, color: "#1F3350", fontWeight: 700 }}>SECTION B: CO-PO/PSO CORRELATION MATRIX</h3>
                    <div className="tablewrap"><table className="data">
                        <thead>
                            <tr style={{ background: "#EEF0E9", borderBottom: "2px solid #1F3350" }}>
                                <th style={{ padding: "6px 8px", textAlign: "left", width: "50px" }}>CO</th>
                                {ALL_POS.map(po => <th key={po} style={{ padding: "6px 4px" }}>{po}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {cos.map(co => (
                                <tr key={co.id} style={{ borderBottom: "1px solid #DEDAD0" }}>
                                    <td style={{ padding: "6px 8px", fontWeight: 700, textAlign: "left" }}>{co.id}</td>
                                    {ALL_POS.map(po => {
                                        const v = st.copoMap?.[co.id]?.[po] || 0;
                                        return <td key={po} style={{ padding: "6px 4px", fontWeight: v > 0 ? 600 : 400 }}>{v || '-'}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                </div>

                {/* Section C: CO Attainment Summary */}
                <div style={{ marginBottom: 28, pageBreakBefore: "always" }}>
                    <h3 style={{ fontSize: 15, borderBottom: "1px solid #1F3350", paddingBottom: 4, color: "#1F3350", fontWeight: 700 }}>SECTION C: COURSE OUTCOME ATTAINMENT LEVELS</h3>
                    <div className="tablewrap"><table className="data">
                        <thead>
                            <tr style={{ background: "#EEF0E9", borderBottom: "2px solid #1F3350" }}>
                                <th style={{ padding: "6px 8px", textAlign: "left" }}>CO</th>
                                <th style={{ padding: "6px 8px" }}>Direct Attainment Pct</th>
                                <th style={{ padding: "6px 8px" }}>Direct Level (0-3)</th>
                                <th style={{ padding: "6px 8px" }}>Indirect Attainment Pct</th>
                                <th style={{ padding: "6px 8px" }}>Indirect Level (0-3)</th>
                                <th style={{ padding: "6px 8px", fontWeight: 700 }}>Combined Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coAttainments.map(co => {
                                const directPct = co.direct?.attainmentPct ? co.direct.attainmentPct.toFixed(1) + '%' : '\u2014';
                                const directLvl = co.direct?.attainment ? co.direct.attainment.toFixed(1) : '\u2014';
                                const indirectPct = co.indirect?.pct ? co.indirect.pct.toFixed(1) + '%' : '\u2014';
                                const indirectLvl = co.indirect?.level !== undefined ? co.indirect.level : '\u2014';
                                const comb = co.overallLevel !== null ? co.overallLevel.toFixed(2) : '\u2014';
                                
                                return (
                                    <tr key={co.id} style={{ borderBottom: "1px solid #DEDAD0" }}>
                                        <td style={{ padding: "8px", fontWeight: 700, textAlign: "left" }}>{co.id}</td>
                                        <td style={{ padding: "8px" }}>{directPct}</td>
                                        <td style={{ padding: "8px" }}>{directLvl}</td>
                                        <td style={{ padding: "8px" }}>{indirectPct}</td>
                                        <td style={{ padding: "8px" }}>{indirectLvl}</td>
                                        <td style={{ padding: "8px", fontWeight: 700 }}>{comb}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                </div>

                {/* Section D: Final PO Attainment */}
                <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, borderBottom: "1px solid #1F3350", paddingBottom: 4, color: "#1F3350", fontWeight: 700 }}>SECTION D: PROGRAM OUTCOME ATTAINMENT</h3>
                    <div className="tablewrap"><table className="data">
                        <thead>
                            <tr style={{ background: "#EEF0E9", borderBottom: "2px solid #1F3350" }}>
                                <th style={{ padding: "6px 8px", textAlign: "left" }}>PO</th>
                                {ALL_POS.map(po => <th key={po} style={{ padding: "6px 4px" }}>{po}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: "1px solid #DEDAD0" }}>
                                <td style={{ padding: "8px 10px", fontWeight: 700, textAlign: "left" }}>Direct (CO)</td>
                                {ALL_POS.map(po => {
                                    const d = poResults.directResults[po];
                                    return <td key={po} style={{ padding: "8px 4px" }}>{d !== null ? d.toFixed(1) : '-'}</td>;
                                })}
                            </tr>
                            <tr style={{ borderBottom: "1px solid #DEDAD0" }}>
                                <td style={{ padding: "8px 10px", fontWeight: 700, textAlign: "left" }}>Indirect (Survey)</td>
                                {ALL_POS.map(po => {
                                    const ind = poResults.indirect[po];
                                    return <td key={po} style={{ padding: "8px 4px" }}>{ind ? ind.level.toFixed(1) : '-'}</td>;
                                })}
                            </tr>
                            <tr style={{ borderBottom: "2px solid #1F3350", fontWeight: 700 }}>
                                <td style={{ padding: "8px 10px", textAlign: "left" }}>Final Attained</td>
                                {ALL_POS.map(po => {
                                    const f = poResults.final[po];
                                    return <td key={po} style={{ padding: "8px 4px" }}>{f !== null ? f.toFixed(2) : '-'}</td>;
                                })}
                            </tr>
                        </tbody>
                    </table></div>
                </div>

                {/* Section E: 3-Year Trend */}
                {trendData.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                        <h3 style={{ fontSize: 15, borderBottom: "1px solid #1F3350", paddingBottom: 4, color: "#1F3350", fontWeight: 700 }}>SECTION E: 3-YEAR ATTAINMENT TRENDS (%)</h3>
                        <div className="tablewrap"><table className="data">
                            <thead>
                                <tr style={{ background: "#EEF0E9", borderBottom: "2px solid #1F3350" }}>
                                    <th style={{ padding: "6px 8px", textAlign: "left" }}>Academic Year</th>
                                    {ALL_POS.map(po => <th key={po} style={{ padding: "6px 4px" }}>{po}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {trendData.map(d => (
                                    <tr key={d.year} style={{ borderBottom: "1px solid #DEDAD0" }}>
                                        <td style={{ padding: "8px 10px", fontWeight: 700, textAlign: "left" }}>{d.year}</td>
                                        {ALL_POS.map(po => {
                                            const s = d.poAttainment[po];
                                            return <td key={po} style={{ padding: "8px 4px" }}>{s !== undefined ? `${s}%` : '-'}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                )}

                {/* Section F: Remarks & Audit Comments */}
                <div style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 15, borderBottom: "1px solid #1F3350", paddingBottom: 4, color: "#1F3350", fontWeight: 700 }}>SECTION F: IQAC COMMITTEE AUDIT REMARKS</h3>
                    <div style={{ border: "1px solid #DEDAD0", borderRadius: 6, padding: 14, minHeight: "80px", fontStyle: "italic", color: "#4B5563" }}>
                        {rem || "No comments recorded by the auditing team."}
                    </div>
                </div>

                {/* Signature Panel */}
                <div className="sig-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 30, marginTop: 40 }}>
                    <div className="sig-box" style={{ borderTop: "1px solid #000", textAlign: "center", paddingTop: 8 }}>
                        <div style={{ height: "40px" }} />
                        <div style={{ fontWeight: 700, color: "#1F3350" }}>{st.facultyName || user?.name || ''}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Faculty Coordinator</div>
                    </div>
                    <div className="sig-box" style={{ borderTop: "1px solid #000", textAlign: "center", paddingTop: 8 }}>
                        <div style={{ height: "40px" }} />
                        <div style={{ fontWeight: 700, color: "#1F3350" }}>{iqac}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Department IQAC Coordinator</div>
                    </div>
                    <div className="sig-box" style={{ borderTop: "1px solid #000", textAlign: "center", paddingTop: 8 }}>
                        <div style={{ height: "40px" }} />
                        <div style={{ fontWeight: 700, color: "#1F3350" }}>{hod}</div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Head of Department (HOD)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
