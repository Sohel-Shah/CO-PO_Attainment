import React, { useState, useEffect } from 'react';
import { S, BarChart } from '../utils/ui-utils';
import { ALL_POS, finalPOAttainment } from '../utils/attainmentCalculator';

export default function AttainmentTrend({ st }) {
    const currentCourse = st.coursePlan || {};
    const courseName = currentCourse.course || st.course?.name || '';
    const courseCode = currentCourse.code || st.course?.code || '';
    const currentYear = st.academicYear || st.course?.academicYear || '';

    const [loading, setLoading] = useState(false);
    const [trendData, setTrendData] = useState([]); // [{ year: '2025-26', cycle: 'CAY', poAttainment: { PO1: 72, ... } }]

    useEffect(() => {
        const fetchTrend = async () => {
            setLoading(true);
            try {
                // 1. Fetch all courses
                const res = await fetch(`http://${window.location.hostname}:3001/api/courses`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("app_token")}` }
                });
                if (!res.ok) throw new Error("Failed to fetch courses");
                const allCourses = await res.json();

                // 2. Filter sibling courses (matching name or code)
                const siblings = allCourses.filter(c =>
                    (c.code && c.code === courseCode) ||
                    (c.name && c.name.toLowerCase() === courseName.toLowerCase())
                );

                // Let's identify CAY, CAYm1, CAYm2 based on sorted academic years
                // CAY is the active course's year.
                const cayYear = currentYear;

                // Parse year helper: e.g., "2025-26" -> 2025
                const getStartYear = (yrStr) => {
                    const match = String(yrStr).match(/^(\d{4})/);
                    return match ? parseInt(match[1]) : 0;
                };

                const activeStartYear = getStartYear(cayYear);
                const caym1Year = activeStartYear ? `${activeStartYear - 1}-${String(activeStartYear).slice(2, 4)}` : '';
                const caym2Year = activeStartYear ? `${activeStartYear - 2}-${String(activeStartYear - 1).slice(2, 4)}` : '';

                // Fetch attainment for the matched years
                const results = [];
                const targetYears = [
                    { year: cayYear, label: 'CAY (Current)' },
                    { year: caym1Year, label: 'CAY-1 (Previous)' },
                    { year: caym2Year, label: 'CAY-2 (Prior)' }
                ];

                for (const target of targetYears) {
                    if (!target.year) continue;
                    // Find the sibling course matching this year
                    const matchCourse = siblings.find(c => c.academicYear === target.year);
                    if (matchCourse) {
                        try {
                            // Fetch attainment from Report Service
                            const attRes = await fetch(`http://${window.location.hostname}:3001/api/report/courses/${matchCourse.courseId}/attainment`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem("app_token")}` }
                            });
                            if (attRes.ok) {
                                const att = await attRes.json();
                                const poMap = {};
                                (att.poAttainment || []).forEach(p => {
                                    poMap[p.id] = p.attainment;
                                });
                                results.push({
                                    year: target.year,
                                    label: target.label,
                                    courseId: matchCourse.courseId,
                                    poAttainment: poMap,
                                    hasData: true
                                });
                            }
                        } catch (e) {
                            console.error(`Failed to fetch attainment for ${target.year}:`, e);
                        }
                    }
                }

                // If active course's current unsaved state is not synced, calculate locally for CAY
                const activeInResults = results.find(r => r.year === cayYear);
                if (!activeInResults && st.students?.length > 0) {
                    const localPO = finalPOAttainment(st);
                    const poMap = {};
                    ALL_POS.forEach(po => {
                        // local level 0-3 converted to % scale matching report service (0-100%)
                        const level = localPO.final[po];
                        poMap[po] = level !== null ? Math.round((level / 3) * 100) : 0;
                    });
                    results.unshift({
                        year: cayYear,
                        label: 'CAY (Current - Local)',
                        courseId: currentCourse.code || 'ME-25001',
                        poAttainment: poMap,
                        hasData: true
                    });
                }

                setTrendData(results);
            } catch (err) {
                console.error("Failed to build attainment trend:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrend();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseCode, courseName, currentYear, st]);

    const getAverageAttainment = (entry) => {
        if (!entry || !entry.poAttainment) return 0;
        const vals = Object.values(entry.poAttainment).filter(v => v !== undefined && v !== null);
        return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '0.0';
    };

    const avgTrendChartData = trendData.map(d => ({
        l: d.year,
        v: parseFloat(getAverageAttainment(d))
    }));

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F1F5F9", margin: "0 0 6px" }}>3-Year Attainment Trend</h2>
                <p style={{ fontSize: 13, color: "var(--text-sub)", margin: 0 }}>Compare PO achievement values across three academic cycles to monitor continuous quality improvement.</p>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Calculating historical trends...</div>
            ) : trendData.length === 0 ? (
                <div className="card">
                    No sibling courses found for preceding academic years (e.g. CAY-1 or CAY-2) to establish a trend. Ensure courses exist in the system for previous years.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Average Progression Chart */}
                    <div className="card">
                        <h3 style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Overall PO Attainment Progression (%)</h3>
                        <BarChart data={avgTrendChartData} h={180} color="#10B981" />
                        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
                            {trendData.map(d => (
                                <div key={d.year} style={{ fontSize: 12.5, color: "var(--text-sub)" }}>
                                    {d.label} ({d.year}): <b style={{ color: "var(--text-main)" }}>{getAverageAttainment(d)}%</b>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed PO Grid Comparison */}
                    <div className="card">
                        <h3 style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>PO-by-PO Direct Year Comparison (%)</h3>
                        <div className="tablewrap"><table className="data">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-app)" }}>
                                    <th style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", textAlign: "left" }}>Program Outcome</th>
                                    {trendData.map(d => (
                                        <th key={d.year} style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>{d.label}<br /><span style={{ fontSize: 10, fontWeight: 500 }}>({d.year})</span></th>
                                    ))}
                                    <th style={{ padding: "10px 12px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Trend (CAY vs CAY-1)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ALL_POS.map(po => {
                                    const scores = trendData.map(d => d.poAttainment[po] || 0);
                                    const cayVal = scores[0] || 0;
                                    const cay1Val = scores[1] || 0;
                                    const diff = cayVal - cay1Val;

                                    return (
                                        <tr key={po} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                            <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: "var(--text-main)", textAlign: "left" }}>{po}</td>
                                            {scores.map((s, idx) => (
                                                <td key={idx} style={{ padding: "10px 12px", fontSize: 14, fontWeight: 800, color: s > 0 ? "var(--text-main)" : "var(--text-muted)" }}>
                                                    {s > 0 ? `${s}%` : `\u2014`}
                                                </td>
                                            ))}
                                            <td style={{ padding: "10px 12px" }}>
                                                {trendData.length > 1 && cayVal > 0 && cay1Val > 0 ? (
                                                    <span style={{
                                                        fontSize: 12, fontWeight: 700,
                                                        color: diff >= 0 ? "var(--success)" : "var(--error)",
                                                        background: diff >= 0 ? "var(--success-trans)" : "var(--error-trans)",
                                                        padding: "3px 8px", borderRadius: 6
                                                    }}>
                                                        {diff >= 0 ? `+${diff.toFixed(1)}% \u25B2` : `${diff.toFixed(1)}% \u25BC`}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)", fontSize: 12 }}>\u2014</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table></div>
                    </div>
                </div>
            )}
        </div>
    );
}
