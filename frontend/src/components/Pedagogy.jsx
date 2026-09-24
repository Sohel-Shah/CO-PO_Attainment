import React, { useState } from 'react';
import { S, I, generateId } from '../utils/ui-utils';
import { useToast } from '../context/ToastContext';

export default function Pedagogy({ st, dispatch }) {
    const cp = st.coursePlan || {};
    const tools = cp.pedagogyTools || [];
    const cos = st.courseOutcomes || [];
    const { addToast, confirmAction } = useToast();

    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({ method: '', frequency: 0, units: [], topics: '', strategy: '', cos: [], bloom: 'L1-L2', evidence: '' });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newData, setNewData] = useState({ method: '', frequency: 5, units: [], topics: '', strategy: '', cos: [], bloom: 'L1-L2', evidence: '' });

    const startEdit = (t) => {
        setEditId(t.id);
        setEditData({
            method: t.method || '',
            frequency: t.frequency || 0,
            units: t.units || [],
            topics: t.topics || '',
            strategy: t.strategy || '',
            cos: t.cos || [],
            bloom: t.bloom || 'L1-L2',
            evidence: t.evidence || ''
        });
    };

    const saveEdit = (id) => {
        const updated = tools.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    method: editData.method,
                    frequency: Number(editData.frequency),
                    units: editData.units,
                    topics: editData.topics,
                    strategy: editData.strategy,
                    cos: editData.cos,
                    bloom: editData.bloom,
                    evidence: editData.evidence
                };
            }
            return t;
        });
        dispatch({ type: "SET_PEDAGOGY_TOOLS", val: updated });
        setEditId(null);
    };

    const deleteTool = async (id) => {
        if (!(await confirmAction("Are you sure you want to delete this pedagogy tool?"))) return;
        const updated = tools.filter(t => t.id !== id);
        dispatch({ type: "SET_PEDAGOGY_TOOLS", val: updated });
        addToast("Pedagogy tool deleted.", "success");
    };

    const addTool = () => {
        if (!newData.method) return addToast("Please enter method name", "warning");
        const nextId = `pd_${generateId()}`;
        const newTool = {
            id: nextId,
            method: newData.method,
            frequency: Number(newData.frequency),
            units: newData.units,
            topics: newData.topics,
            strategy: newData.strategy,
            cos: newData.cos,
            bloom: newData.bloom,
            evidence: newData.evidence
        };

        dispatch({ type: "SET_PEDAGOGY_TOOLS", val: [...tools, newTool] });
        setShowAddForm(false);
        setNewData({ method: '', frequency: 5, units: [], topics: '', strategy: '', cos: [], bloom: 'L1-L2', evidence: '' });
    };

    const toggleArrayItem = (item, key, isEdit) => {
        const data = isEdit ? editData : newData;
        const setData = isEdit ? setEditData : setNewData;
        const arr = data[key] || [];
        const nextArr = arr.includes(item)
            ? arr.filter(i => i !== item)
            : [...arr, item];
        setData({ ...data, [key]: nextArr });
    };

    const unitRomanLabels = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-main)", margin: "0 0 8px", fontFamily: "var(--font-serif, Georgia, serif)" }}>Pedagogy Tools — Unit-wise</h2>
                <p style={{ fontSize: 14, color: "var(--text-sub)", margin: 0 }}>Which teaching methods are used, how often, in which units, and how they map to COs and Bloom levels.</p>
            </div>

            {/* Add Tool Form */}
            {showAddForm && (
                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", marginBottom: 16 }}>Register Pedagogy Method</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 1.5fr", gap: 16, marginBottom: 16 }}>
                        <div className="field">
                            <label>Method / Tool Name</label>
                            <input placeholder="e.g. Flipped Classroom" value={newData.method} onChange={e => setNewData({ ...newData, method: e.target.value })} />
                        </div>
                        <div className="field">
                            <label>Frequency</label>
                            <input type="number" value={newData.frequency} onChange={e => setNewData({ ...newData, frequency: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="field">
                            <label>Bloom Target</label>
                            <input placeholder="e.g. L3-L4" value={newData.bloom} onChange={e => setNewData({ ...newData, bloom: e.target.value })} />
                        </div>
                        <div className="field">
                            <label>Evidence (Audit Proof)</label>
                            <input placeholder="e.g. Lab Records, PPT Slides" value={newData.evidence} onChange={e => setNewData({ ...newData, evidence: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div className="field">
                            <label>Strategy / Implementation details</label>
                            <input placeholder="e.g. Watch lecture video at home, solve assignments in class" value={newData.strategy} onChange={e => setNewData({ ...newData, strategy: e.target.value })} />
                        </div>
                        <div className="field">
                            <label>Topics Covered</label>
                            <input placeholder="e.g. Heat transfer conduction equations" value={newData.topics} onChange={e => setNewData({ ...newData, topics: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div className="field">
                            <label>Units Used In</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                                {unitRomanLabels.map(u => {
                                    const active = (newData.units || []).includes(u);
                                    return (
                                        <button key={u} onClick={() => toggleArrayItem(u, "units", false)} style={{
                                            border: active ? "1px solid var(--brand)" : "1px solid var(--border-color)",
                                            background: active ? "var(--bg-brand-trans)" : "transparent",
                                            color: active ? "var(--brand-light)" : "var(--text-sub)",
                                            padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer"
                                        }}>
                                            {u}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="field">
                            <label>Mapped COs</label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                                {cos.map(co => {
                                    const active = (newData.cos || []).includes(co.id);
                                    return (
                                        <button key={co.id} onClick={() => toggleArrayItem(co.id, "cos", false)} style={{
                                            border: active ? "1px solid var(--brand)" : "1px solid var(--border-color)",
                                            background: active ? "var(--bg-brand-trans)" : "transparent",
                                            color: active ? "var(--brand-light)" : "var(--text-sub)",
                                            padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer"
                                        }}>
                                            {co.id}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={addTool} className="btn teal">Register Tool</button>
                        <button onClick={() => setShowAddForm(false)} className="btn ghost">Cancel</button>
                    </div>
                </div>
            )}

            {/* Tools List */}
            <div className="card" style={{ padding: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-color)" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Pedagogical methods ({tools.length})</h3>
                    {!showAddForm && (
                        <button onClick={() => setShowAddForm(true)} className="btn ghost" style={{ fontSize: 12, padding: "6px 12px", border: "1px solid var(--border-color)", background: "#fff", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: 16, fontWeight: 400, lineHeight: 1 }}>+</span> Add method
                        </button>
                    )}
                </div>
                <div className="tablewrap">
                    <table className="data" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--bg-app)" }}>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", width: "40px" }}>#</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Method</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", width: "70px" }}>Freq.</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", width: "80px" }}>Unit(s)</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Suggested Topics</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Implementation Strategy</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", width: "110px" }}>CO Mapping</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", width: "80px" }}>Bloom</th>
                                <th style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Evidence (NBA/NAAC)</th>
                                <th style={{ padding: "12px 14px", width: "80px" }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tools.length === 0 ? (
                                <tr>
                                    <td colSpan={10} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                                        No methods yet.
                                    </td>
                                </tr>
                            ) : tools.map((t, index) => {
                                const isEditing = editId === t.id;
                                const coList = t.cos || [];
                                const unitList = t.units || [];

                                return (
                                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)", verticalAlign: "middle", background: index % 2 === 0 ? "transparent" : "var(--bg-app)" }}>
                                        {isEditing ? (
                                            <td colSpan={10} style={{ padding: 14, background: "var(--bg-app)" }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 100px 1fr 1fr 80px 1fr auto", gap: 10, alignItems: "end" }}>
                                                    <div className="field">
                                                        <label>Method</label>
                                                        <input value={editData.method} onChange={e => setEditData({ ...editData, method: e.target.value })} />
                                                    </div>
                                                    <div className="field">
                                                        <label>Freq</label>
                                                        <input type="number" value={editData.frequency} onChange={e => setEditData({ ...editData, frequency: parseInt(e.target.value) || 0 })} />
                                                    </div>
                                                    <div className="field">
                                                        <label>Bloom</label>
                                                        <input value={editData.bloom} onChange={e => setEditData({ ...editData, bloom: e.target.value })} />
                                                    </div>
                                                    <div className="field">
                                                        <label>Evidence</label>
                                                        <input value={editData.evidence} onChange={e => setEditData({ ...editData, evidence: e.target.value })} />
                                                    </div>
                                                    <div className="field">
                                                        <label>Strategy</label>
                                                        <input value={editData.strategy} onChange={e => setEditData({ ...editData, strategy: e.target.value })} />
                                                    </div>
                                                    <div className="field">
                                                        <label>Topics</label>
                                                        <input value={editData.topics} onChange={e => setEditData({ ...editData, topics: e.target.value })} />
                                                    </div>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button onClick={() => saveEdit(t.id)} className="btn teal">Save</button>
                                                        <button onClick={() => setEditId(null)} className="btn ghost">Cancel</button>
                                                    </div>
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 10 }}>
                                                    <div className="field">
                                                        <label>Units (Toggle)</label>
                                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                                            {unitRomanLabels.map(u => (
                                                                <button key={u} onClick={() => toggleArrayItem(u, "units", true)} style={{
                                                                    border: (editData.units || []).includes(u) ? "1px solid var(--brand)" : "1px solid var(--border-color)",
                                                                    background: (editData.units || []).includes(u) ? "var(--bg-brand-trans)" : "transparent",
                                                                    color: (editData.units || []).includes(u) ? "var(--brand-light)" : "var(--text-sub)",
                                                                    padding: "3px 8px", borderRadius: 5, fontSize: 10.5, cursor: "pointer"
                                                                }}>{u}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="field">
                                                        <label>COs (Toggle)</label>
                                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                                            {cos.map(co => (
                                                                <button key={co.id} onClick={() => toggleArrayItem(co.id, "cos", true)} style={{
                                                                    border: (editData.cos || []).includes(co.id) ? "1px solid var(--brand)" : "1px solid var(--border-color)",
                                                                    background: (editData.cos || []).includes(co.id) ? "var(--bg-brand-trans)" : "transparent",
                                                                    color: (editData.cos || []).includes(co.id) ? "var(--brand-light)" : "var(--text-sub)",
                                                                    padding: "3px 8px", borderRadius: 5, fontSize: 10.5, cursor: "pointer"
                                                                }}>{co.id}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-sub)" }}>{index + 1}</td>
                                                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-main)", fontWeight: 600 }}>{t.method}</td>
                                                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-main)" }}>{t.frequency}</td>
                                                <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-sub)" }}>
                                                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                                                        {unitList.map(u => <span key={u} style={{ background: "var(--bg-app)", padding: "2px 6px", borderRadius: 4, fontSize: 10.5, color: "var(--text-muted)" }}>{u}</span>)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text-sub)", maxWidth: "150px", whiteSpace: "normal" }}>
                                                    {t.topics}
                                                </td>
                                                <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text-sub)", maxWidth: "220px", whiteSpace: "normal" }}>
                                                    {t.strategy}
                                                </td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        {coList.map(c => <span key={c} style={S.tag("var(--bg-brand-trans)", "var(--brand-light)")}>{c}</span>)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "10px 14px", fontSize: 12.5 }}><span style={S.tag("rgba(245,158,11,0.15)", "#F59E0B")}>{t.bloom}</span></td>
                                                <td style={{ padding: "10px 14px", fontSize: 12.5, color: "var(--text-sub)" }}>{t.evidence}</td>
                                                <td style={{ padding: "10px 14px" }}>
                                                    <div style={{ display: "flex", gap: 8, opacity: 0.6 }}>
                                                        <button onClick={() => startEdit(t)} className="btn ghost" style={{ padding: "4px" }} title="Edit">✏️</button>
                                                        <button onClick={() => deleteTool(t.id)} className="btn ghost" style={{ padding: "4px" }} title="Delete">🗑️</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
