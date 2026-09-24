import React, { useState } from 'react';
import { S, I, generateId } from '../utils/ui-utils';
import { useToast } from '../context/ToastContext';
import { ALL_POS, surveyPOLevel } from '../utils/attainmentCalculator';

export default function POSurvey({ st, dispatch }) {
    const survey = st.poSurvey || { scale: 5, responses: { alumni: [], employer: [], graduate: [] } };
    const responses = survey.responses || { alumni: [], employer: [], graduate: [] };
    const scale = survey.scale || 5;
    const { addToast, confirmAction } = useToast();

    const [activeSurvey, setActiveSurvey] = useState('alumni'); // alumni | employer | graduate
    const [respondentName, setRespondentName] = useState('');
    const [ratings, setRatings] = useState(() => {
        const r = {};
        ALL_POS.forEach(po => { r[po] = ''; });
        return r;
    });

    const [showSettings, setShowSettings] = useState(false);
    const [weights, setWeights] = useState(() => st.settings?.poSurveyWeights || { alumni: 34, employer: 33, graduate: 33 });

    const handleAdd = () => {
        if (!respondentName.trim()) return addToast("Please enter respondent name/identifier", "warning");
        if (Object.values(ratings).every(v => v === '' || v === null || v === undefined)) {
            return addToast("Please enter at least one PO rating before recording the evaluation.", "warning");
        }
        
        const newResponse = {
            id: `res_${generateId()}`,
            respondent: respondentName.trim(),
            ratings: {}
        };

        ALL_POS.forEach(po => {
            const val = ratings[po];
            if (val !== '' && val !== null && val !== undefined) {
                newResponse.ratings[po] = Number(val);
            }
        });

        const updatedResponses = {
            ...responses,
            [activeSurvey]: [...(responses[activeSurvey] || []), newResponse]
        };

        dispatch({
            type: "SET_PO_SURVEY",
            val: {
                ...survey,
                responses: updatedResponses
            }
        });

        setRespondentName('');
        const r = {};
        ALL_POS.forEach(po => { r[po] = ''; });
        setRatings(r);
    };

    const handleDelete = async (id) => {
        if (!(await confirmAction("Delete this stakeholder's response?"))) return;
        const updatedResponses = {
            ...responses,
            [activeSurvey]: (responses[activeSurvey] || []).filter(r => r.id !== id)
        };
        dispatch({
            type: "SET_PO_SURVEY",
            val: {
                ...survey,
                responses: updatedResponses
            }
        });
    };

    const handleSaveSettings = () => {
        const total = Number(weights.alumni) + Number(weights.employer) + Number(weights.graduate);
        if (total !== 100) {
            addToast(`Total survey weights must sum to exactly 100%. Currently: ${total}%`, "error");
            return;
        }

        dispatch({
            type: "SET_SETTINGS",
            val: {
                ...(st.settings || {}),
                poSurveyWeights: {
                    alumni: Number(weights.alumni),
                    employer: Number(weights.employer),
                    graduate: Number(weights.graduate)
                }
            }
        });
        setShowSettings(false);
    };

    const activeList = responses[activeSurvey] || [];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 className="pagetitle">Stakeholder PO Surveys</h1>
                    <p className="pagesub">Input and evaluate Alumni, Employer, and Graduate exit surveys to determine indirect PO attainment.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowSettings(!showSettings)} className="btn ghost">
                        {I.settings} Weights &amp; Scale
                    </button>
                </div>
            </div>

            {/* Scale and Weights Settings Panel */}
            {showSettings && (
                <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>Survey Weights &amp; Likert Scale</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "100px repeat(3, 1fr)", gap: 16, alignItems: "end", marginBottom: 16 }}>
                        <div className="field">
<label>Likert Scale Max</label>
                            <select  value={scale} onChange={e => {
                                dispatch({ type: "SET_PO_SURVEY", val: { ...survey, scale: parseInt(e.target.value) || 5 } });
                            }}>
                                <option value={3}>3 Point Scale</option>
                                <option value={5}>5 Point Scale</option>
                                <option value={10}>10 Point Scale</option>
                            </select>
                        </div>
                        <div className="field">
<label>Alumni Survey Weight (%)</label>
                            <input type="number"  value={weights.alumni} onChange={e => setWeights({ ...weights, alumni: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="field">
<label>Employer Survey Weight (%)</label>
                            <input type="number"  value={weights.employer} onChange={e => setWeights({ ...weights, employer: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="field">
<label>Graduate Exit Weight (%)</label>
                            <input type="number"  value={weights.graduate} onChange={e => setWeights({ ...weights, graduate: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleSaveSettings} className="btn teal">Save Settings</button>
                        <button onClick={() => { setShowSettings(false); setWeights(st.settings?.poSurveyWeights || { alumni: 34, employer: 33, graduate: 33 }); }} className="btn ghost">Cancel</button>
                    </div>
                </div>
            )}

            {/* Survey Tabs Switcher */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div className="examtabs">
                    {[
                        { id: 'alumni', label: 'Alumni Survey' },
                        { id: 'employer', label: 'Employer Survey' },
                        { id: 'graduate', label: 'Graduate Exit Survey' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveSurvey(tab.id)} className={activeSurvey === tab.id ? "active" : ""} style={{
                            padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                            fontWeight: 600, fontSize: 12, border: activeSurvey === tab.id ? "none" : "1px solid var(--border-color)"
                        }}>{tab.label}</button>
                    ))}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Total Survey Respondents: <b style={{ color: "var(--brand)" }}>{activeList.length}</b>
                </div>
            </div>

            {/* Entry Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
                
                {/* Left Card: Add Respondent */}
                <div className="card">
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Record Stakeholder Rating</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="field">
<label>Respondent Name / ID</label>
                            <input  placeholder="e.g. Alumnus 2024 (A)" value={respondentName} onChange={e => setRespondentName(e.target.value)} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "280px", overflowY: "auto", paddingRight: 4 }}>
                            {ALL_POS.map(po => (
                                <div key={po} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-main)" }}>{po}</span>
                                    <input
                                        type="number"
                                        style={{ ...S.input, width: "70px", padding: "6px 10px", textAlign: "center" }}
                                        placeholder={`1-${scale}`}
                                        min={1}
                                        max={scale}
                                        value={ratings[po]}
                                        onChange={e => {
                                            const v = e.target.value;
                                            if (v === '' || (Number(v) >= 1 && Number(v) <= scale)) {
                                                setRatings({ ...ratings, [po]: v });
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAdd} className="btn teal">
                            Submit Rating
                        </button>
                    </div>
                </div>

                {/* Right Card: Summary & Table */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    
                    {/* Survey Metrics Summary */}
                    <div className="card">
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Survey Mapped Attainment Levels</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10 }}>
                            {ALL_POS.map(po => {
                                const res = surveyPOLevel(st, activeSurvey, po);
                                const avg = res ? res.avgRating.toFixed(1) : '\u2014';
                                const lvl = res ? res.level : 0;
                                const colors = ["var(--error)", "var(--brand)", "var(--warning)", "var(--success)"];
                                return (
                                    <div key={po} style={{ background: "var(--bg-app)", borderRadius: 8, padding: 10, textAlign: "center", border: lvl > 0 ? `1px solid ${colors[lvl]}20` : "1px solid var(--border-color)" }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-main)" }}>{po}</div>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: lvl > 0 ? colors[lvl] : "var(--text-muted)", margin: "4px 0" }}>{avg}</div>
                                        <div style={{ fontSize: 9.5, fontWeight: 700, color: lvl > 0 ? colors[lvl] : "var(--text-muted)", textTransform: "uppercase" }}>Level {lvl}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Roster list */}
                    <div className="card">
                        <div className="tablewrap" style={{ maxHeight: "310px", overflowY: "auto" }}>
                            <div className="tablewrap"><table className="data">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-color)", background: "#eef0e9", position: "sticky", top: 0, zIndex: 1 }}>
                                        <th style={{ padding: "10px 12px", fontSize: 10.5, color: "var(--navy)", textTransform: "uppercase", fontWeight: 600 }}>Respondent</th>
                                        {ALL_POS.map(po => <th key={po} style={{ padding: "10px 8px", fontSize: 10.5, color: "var(--navy)", textTransform: "uppercase", textAlign: "center", fontWeight: 600 }}>{po}</th>)}
                                        <th style={{ padding: "10px 12px", fontSize: 10.5, color: "var(--navy)", textTransform: "uppercase", width: "80px", fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeList.length > 0 ? activeList.map((r, idx) => (
                                        <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 1 ? "var(--bg-app)" : "transparent" }}>
                                            <td style={{ padding: "8px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--text-main)" }}>{r.respondent}</td>
                                            {ALL_POS.map(po => {
                                                const val = r.ratings?.[po];
                                                return <td key={po} style={{ padding: "8px 6px", fontSize: 12.5, color: "var(--text-main)", textAlign: "center" }}>{val !== undefined ? val : '\u2014'}</td>;
                                            })}
                                            <td style={{ padding: "8px 12px" }}>
                                                <button onClick={() => handleDelete(r.id)} style={{ all: "unset", cursor: "pointer", color: "var(--error)", fontSize: 11.5, fontWeight: 600 }}>Delete</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={ALL_POS.length + 2} style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12.5, fontStyle: "italic" }}>
                                                No survey records submitted for {activeSurvey === 'alumni' ? 'Alumni' : activeSurvey === 'employer' ? 'Employers' : 'Graduate Exit'}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
