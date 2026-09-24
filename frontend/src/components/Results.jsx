import React, { useState } from 'react';
import { S, Donut, BarChart } from '../utils/ui-utils';

export default function Results({ st, dispatch }) {
    const [sortBy, setSortBy] = useState("total");
    const [sortDir, setSortDir] = useState("desc");

    const getExamMax = (type, fallback) => {
        const papers = st.papers || st.exams || [];
        if (type === "Internal" || type === "TA") {
            const taPapers = papers.filter(p => ["T1", "T2", "T3", "INTERNAL", "TA"].some(k => (p.type || p.id || "").toUpperCase().includes(k)));
            const sum = taPapers.reduce((acc, p) => acc + Number(p.totalMarks || p.total || p.weight || 0), 0);
            return sum > 0 ? sum : 20;
        }
        if (type === "Midterm" || type === "MSE") {
            const msePaper = papers.find(p => ["MSE", "MID SEMESTER", "MIDTERM"].some(k => (p.type || p.id || "").toUpperCase().includes(k)));
            return msePaper ? Number(msePaper.totalMarks || msePaper.total || msePaper.weight || 30) : 30;
        }
        if (type === "Assignment" || type === "ESE") {
            const esePaper = papers.find(p => ["ESE", "END SEMESTER", "ASSIGNMENT"].some(k => (p.type || p.id || "").toUpperCase().includes(k)));
            return esePaper ? Number(esePaper.totalMarks || esePaper.total || esePaper.weight || 50) : 50;
        }
        return fallback || 100;
    };

    const rawStudents = (st.students && st.students.length > 0) 
        ? st.students 
        : (st.results || []).map(r => ({ id: r.studentId || r.id, name: r.name || r.studentId, roll: r.rollNo || r.studentId }));
    
    const res = rawStudents.map((stu, index) => {
        const sid = stu.id || stu.rollNumber || stu.rollNo;
        const roll = stu.roll || stu.rollNumber || stu.rollNo || sid || `STU-${index+1}`;
        const name = stu.name || roll;
        
        const mrow = st.marksState?.[sid] || st.marksState?.[roll] || {};
        const existing = (st.results || []).find(r => r.studentId === sid || r.studentId === roll || r.rollNo === roll || r.id === sid);
        
        const calcGroup = (keywords, fallbackVal) => {
            const papers = st.papers || st.exams || [];
            const matchedPapers = papers.filter(p => {
                const str = (p.type || p.id || p.title || p.label || '').toUpperCase();
                return keywords.some(k => str.includes(k.toUpperCase()));
            });
            const qs = matchedPapers.flatMap(p => p.questions || []);
            if (qs.length > 0 && Object.keys(mrow).length > 0) {
                return qs.reduce((sum, q) => {
                    const val = mrow[q.id] !== undefined ? mrow[q.id] : 0;
                    return sum + Number(val || 0);
                }, 0);
            }
            return fallbackVal !== undefined ? fallbackVal : 0;
        };

        const internal = Math.round(calcGroup(['T1', 'T2', 'T3', 'INTERNAL', 'TA'], existing?.internal));
        const midterm = Math.round(calcGroup(['MSE', 'MID SEMESTER', 'MIDTERM'], existing?.midterm));
        const assignment = Math.round(calcGroup(['ESE', 'END SEMESTER', 'ASSIGNMENT'], existing?.ese !== undefined ? existing.ese : existing?.assignment));
        const total = internal + midterm + assignment;
        
        return {
            studentId: sid || roll,
            rollNo: roll,
            name,
            internal,
            midterm,
            assignment,
            total
        };
    });

    const sorted = [...res].sort((a, b) => sortDir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]);
    const avg = k => (res.length > 0 ? (res.reduce((s, r) => s + (r[k] || 0), 0) / res.length).toFixed(1) : "0.0");
    const mx = k => (res.length > 0 ? Math.max(...res.map(r => r[k] || 0)) : 0);
    const mn = k => (res.length > 0 ? Math.min(...res.map(r => r[k] || 0)) : 0);
    const passCount = res.filter(r => (r.total || 0) >= 40).length;
    const toggleSort = k => { if (sortBy === k) setSortDir(d => d === "desc" ? "asc" : "desc"); else { setSortBy(k); setSortDir("desc"); } };

    const grades = [
        { l: "A+ (>80)", v: res.filter(r => r.total > 80).length, c: "var(--success)" },
        { l: "A (60-80)", v: res.filter(r => r.total > 60 && r.total <= 80).length, c: "var(--brand)" },
        { l: "B (40-60)", v: res.filter(r => r.total > 40 && r.total <= 60).length, c: "var(--warning)" },
        { l: "C (≤40)", v: res.filter(r => r.total <= 40).length, c: "var(--error)" },
    ];

    const compAvg = [
        { l: "TA / Internal", v: +avg("internal"), m: getExamMax("TA", 20) },
        { l: "MSE", v: +avg("midterm"), m: getExamMax("MSE", 30) },
        { l: "ESE", v: +avg("assignment"), m: getExamMax("ESE", 50) }
    ];
    const histData = Array.from({ length: 10 }, (_, i) => { const lo = i * 10, hi = (i + 1) * 10; return { l: `${lo}-${hi}`, v: res.filter(r => r.total >= lo && r.total < hi).length }; });

    const handleSeedDemoData = () => {
        if (!dispatch) return;
        const papers = st.papers || st.exams || [];
        const students = st.students || [];
        if (students.length === 0 || papers.length === 0) {
            alert("Please add students and assessment papers first before generating demo marks.");
            return;
        }
        const newMarksState = { ...(st.marksState || {}) };
        const lcg = (seed => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })(42);

        students.forEach((stu, si) => {
            const sid = stu.id || stu.rollNumber || stu.rollNo;
            if (!newMarksState[sid]) newMarksState[sid] = {};
            papers.forEach(p => {
                (p.questions || []).forEach(q => {
                    const max = Number(q.marks || q.maxMarks || q.max || 5);
                    const tier = si < students.length * 0.35 ? 0.78 : si < students.length * 0.75 ? 0.62 : 0.45;
                    const raw = Math.round((tier + (lcg() - 0.5) * 0.2) * max);
                    const score = Math.max(1, Math.min(max, raw));
                    if (q.id) newMarksState[sid][q.id] = score;
                });
            });
        });

        dispatch({ type: "SET_MARKS", val: newMarksState });
    };

    const allZero = res.length > 0 && res.every(r => r.total === 0);

    return (
        <div>
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h1 className="pagetitle">Result Analysis</h1>
                    <p className="pagesub">Visualize class performance trends, grade distributions, and component metrics.</p>
                </div>
                {dispatch && (
                    <button 
                        onClick={handleSeedDemoData} 
                        style={{ ...S.btnPrimary, background: allZero ? "linear-gradient(135deg, var(--brand), var(--brand-hover))" : "var(--bg-card)", color: allZero ? "#fff" : "var(--text-main)", border: allZero ? "none" : "1px solid var(--border-color)" }}
                        title="Generate demo marks across T1, T2, T3, MSE, and ESE for testing result analysis"
                    >
                        ⚡ Generate Demo Result Analysis
                    </button>
                )}
            </div>
            {allZero && (
                <div style={{ ...S.card, marginBottom: 20, background: "var(--bg-brand-trans)", border: "1px dashed var(--brand)", padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <div style={{ fontWeight: 700, color: "var(--brand)", fontSize: 14, marginBottom: 4 }}>No Assessment Marks Detected</div>
                            <div style={{ fontSize: 13, color: "var(--text-sub)" }}>Result Analysis is currently empty. Click "Generate Demo Result Analysis" to instantly populate sample marks for T1, T2, T3, MSE, and ESE.</div>
                        </div>
                        {dispatch && (
                            <button onClick={handleSeedDemoData} style={{ ...S.btnPrimary, whiteSpace: "nowrap" }}>
                                ⚡ Seed Demo Data
                            </button>
                        )}
                    </div>
                </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                    ["Class Avg", avg("total"), "#6366F1"], ["Highest", mx("total"), "#10B981"], ["Lowest", mn("total"), "#EF4444"],
                    ["Pass Rate", (res.length > 0 ? Math.round(passCount / res.length * 100) : 0) + "%", "#3B82F6"], ["Distinction", res.filter(r => r.total >= 75).length, "#F59E0B"], ["Failed", res.filter(r => r.total < 40).length, "#EF4444"],
                ].map(([l, v, c], i) => (
                    <div key={i} style={{ ...S.card, padding: "14px 16px", borderTop: `3px solid ${c}`, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{l}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy-2)", marginTop: 4 }}>{v}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div className="card">
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Grade Distribution</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <Donut data={grades} size={120} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {grades.map((g, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: g.c }} /><span style={{ fontSize: 11, color: "var(--text-muted)" }}>{g.l}: <b style={{ color: "var(--text-main)" }}>{g.v}</b></span></div>)}
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Average by Component</div>
                    <BarChart data={compAvg} h={100} color="var(--brand)" />
                    <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
                        {compAvg.map((d, i) => <span key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.v}/{d.m}</span>)}
                    </div>
                </div>
                <div className="card">
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Score Distribution</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 100 }}>
                        {histData.map((d, i) => {
                            const mxH = Math.max(...histData.map(h => h.v), 1);
                            const lo = i * 10;
                            return (
                                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                    {d.v > 0 && <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{d.v}</span>}
                                    <div style={{ width: "100%", borderRadius: 3, height: `${d.v > 0 ? (d.v / mxH) * 80 : 2}%`, minHeight: d.v > 0 ? 6 : 2, background: lo < 40 ? "var(--error)" : lo < 60 ? "var(--warning)" : lo < 80 ? "var(--brand)" : "var(--success)" }} />
                                    <span style={{ fontSize: 7, color: "var(--text-muted)" }}>{d.l}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Table */}
            <div className="card">
                <div className="tablewrap" style={{ overflowY: "auto", maxHeight: 380 }}>
                    <div className="tablewrap"><table className="data">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, background: "#eef0e9", zIndex: 1 }}>
                                {[["rollNo", "Roll No"], ["name", "Name"], ["internal", `TA / Internal (${getExamMax("TA", 20)})`], ["midterm", `MSE (${getExamMax("MSE", 30)})`], ["assignment", `ESE (${getExamMax("ESE", 50)})`], ["total", "Total (100)"], ["grade", "Grade"]].map(([k, l]) => (
                                    <th key={k} onClick={() => ["internal", "midterm", "assignment", "total"].includes(k) && toggleSort(k)} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, color: "var(--navy)", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5, cursor: ["internal", "midterm", "assignment", "total"].includes(k) ? "pointer" : "default" }}>
                                        {l} {sortBy === k ? (sortDir === "desc" ? "↓" : "↑") : ""}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((r, idx) => {
                                const grade = r.total > 80 ? "A+" : r.total > 60 ? "A" : r.total > 40 ? "B" : "F";
                                const gc = grade === "A+" ? "var(--success)" : grade === "A" ? "var(--brand)" : grade === "B" ? "var(--warning)" : "var(--error)";
                                return (
                                    <tr key={r.studentId} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 1 ? "var(--bg-app)" : "transparent" }}>
                                        <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{r.rollNo}</td>
                                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-main)", fontWeight: 700 }}>{r.name}</td>
                                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-muted)" }}>{r.internal}</td>
                                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-muted)" }}>{r.midterm}</td>
                                        <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-muted)" }}>{r.assignment}</td>
                                        <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-main)", fontWeight: 700 }}>{r.total}</td>
                                        <td style={{ padding: "10px 14px" }}><span style={S.tag(`var(--bg-brand-trans)`, gc)}>{grade}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                </div>
            </div>
        </div>
    );
}
