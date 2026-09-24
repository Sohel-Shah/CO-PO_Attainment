import React from 'react';

export default function Plans({ st, dispatch }) {
    const rows = st.coursePlan?.teachingPlan || [];

    const setRows = (newRows) => {
        dispatch({ type: 'SET_COURSE_FIELD', field: 'teachingPlan', val: newRows });
    };

    const handleAddRow = () => {
        const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
        const lastLec = rows.length > 0 ? Math.max(...rows.map(r => parseInt(r.lec) || 0)) : 0;
        const lastWeek = rows.length > 0 ? Math.max(...rows.map(r => parseInt(r.week) || 0)) : 0;
        
        setRows([
            ...rows,
            {
                id: newId,
                week: lastWeek + 1,
                lec: lastLec + 1,
                unit: "I",
                topic: "",
                cos: [],
                bloom: "",
                pedagogy: "",
                activity: "",
                assessment: "",
                date: ""
            }
        ]);
    };

    const handleRemoveRow = (id) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const handleChange = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleCoChange = (id, coNum) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                const hasCo = r.cos.includes(coNum);
                return {
                    ...r,
                    cos: hasCo ? r.cos.filter(c => c !== coNum) : [...r.cos, coNum]
                };
            }
            return r;
        }));
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Theory Teaching Plan</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                Week-by-week lecture plan: topic, CO, Bloom level, pedagogy, activity, assessment and progress tracking.
            </div>

            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>Lecture-wise plan ({rows.length} lectures)</h2>
                    <button onClick={handleAddRow} style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer' }}>+ Add lecture row</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>WEEK</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>LEC.#</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>UNIT</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>TOPIC</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>CO</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>BLOOM</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>PEDAGOGY</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>LEARNING<br/>ACTIVITY</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>PLANNED<br/>ASSESSMENT</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textTransform: 'uppercase' }}>DATE</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '9px', color: '#475569', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', width: '30px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                                        No lecture rows added yet.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id}>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="text" value={row.week} onChange={e => handleChange(row.id, 'week', e.target.value)} style={{ width: '40px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="text" value={row.lec} onChange={e => handleChange(row.id, 'lec', e.target.value)} style={{ width: '40px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <select value={row.unit} onChange={e => handleChange(row.id, 'unit', e.target.value)} style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#334155', background: '#fff' }}>
                                                <option value="I">I</option>
                                                <option value="II">II</option>
                                                <option value="III">III</option>
                                                <option value="IV">IV</option>
                                                <option value="V">V</option>
                                                <option value="VI">VI</option>
                                                <option value="VII">VII</option>
                                                <option value="VIII">VIII</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                                            <input type="text" value={row.topic} onChange={e => handleChange(row.id, 'topic', e.target.value)} style={{ width: '180px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', color: '#475569' }}>
                                                {[1, 2, 3, 4, 5, 6].map(coNum => (
                                                    <label key={coNum} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <input type="checkbox" checked={row.cos.includes(coNum)} onChange={() => handleCoChange(row.id, coNum)} style={{ width: '10px', height: '10px' }} />
                                                        CO{coNum}
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="text" value={row.bloom} onChange={e => handleChange(row.id, 'bloom', e.target.value)} style={{ width: '50px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="text" value={row.pedagogy} onChange={e => handleChange(row.id, 'pedagogy', e.target.value)} style={{ width: '120px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="text" value={row.activity} onChange={e => handleChange(row.id, 'activity', e.target.value)} style={{ width: '110px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="text" value={row.assessment} onChange={e => handleChange(row.id, 'assessment', e.target.value)} style={{ width: '110px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input type="date" value={row.date} onChange={e => handleChange(row.id, 'date', e.target.value)} style={{ width: '100px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center', fontSize: '10px', color: '#334155' }} />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <button onClick={() => handleRemoveRow(row.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
