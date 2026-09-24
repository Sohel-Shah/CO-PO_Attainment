import React from 'react';

export default function Syllabus({ st, dispatch }) {
    const units = st.coursePlan?.units || [];

    const setUnits = (newUnits) => {
        dispatch({ type: 'SET_UNITS', val: newUnits });
    };

    const handleAddUnit = () => {
        const newId = units.length > 0 ? Math.max(...units.map(u => u.id)) + 1 : 1;
        // Simple roman numeral generator for default unit string (up to X for simplicity)
        const romanMap = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
        const newUnitStr = newId <= 10 ? romanMap[newId] : String(newId);

        setUnits([
            ...units,
            {
                id: newId,
                unit: newUnitStr,
                topics: '',
                coMapping: { CO1: false, CO2: false, CO3: false, CO4: false, CO5: false, CO6: false },
                bloomLevel: '',
                lectures: '0'
            }
        ]);
    };

    const handleRemoveUnit = (id) => {
        setUnits(units.filter(u => u.id !== id));
    };

    const handleChange = (id, field, value) => {
        setUnits(units.map(u => u.id === id ? { ...u, [field]: value } : u));
    };

    const handleCoChange = (id, co) => {
        setUnits(units.map(u => {
            if (u.id === id) {
                return {
                    ...u,
                    coMapping: {
                        ...u.coMapping,
                        [co]: !u.coMapping[co]
                    }
                };
            }
            return u;
        }));
    };

    const totalLectures = units.reduce((sum, u) => sum + (parseInt(u.lectures) || 0), 0);

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Unit-wise Syllabus</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                Syllabus broken down by unit, with the CO(s) it maps to, Bloom's level, and planned lecture count.
            </div>

            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '16px', color: '#1e293b' }}>Units</h2>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                        Total planned lectures: <span style={{ fontWeight: 'bold' }}>{totalLectures}</span>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '60px' }}>UNIT</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>TOPICS</th>
                                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '220px' }}>CO MAPPING</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '100px' }}>BLOOM LEVEL</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '80px' }}>LECTURES</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', width: '100px' }}>IN TEACHING<br/>PLAN</th>
                                <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', color: '#475569', borderBottom: '1px solid #e2e8f0', width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                                        No units added yet.
                                    </td>
                                </tr>
                            ) : (
                                units.map((u, index) => (
                                    <tr key={u.id}>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input 
                                                type="text" 
                                                value={u.unit} 
                                                onChange={(e) => handleChange(u.id, 'unit', e.target.value)}
                                                style={{ width: '40px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }} 
                                            />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', borderRight: '1px solid #e2e8f0' }}>
                                            <textarea 
                                                value={u.topics} 
                                                onChange={(e) => handleChange(u.id, 'topics', e.target.value)}
                                                style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', minHeight: '40px', fontSize: '13px', resize: 'vertical' }}
                                            />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', borderRight: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', color: '#475569' }}>
                                                {['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6'].map(co => (
                                                    <label key={co} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!u.coMapping?.[co]} 
                                                            onChange={() => handleCoChange(u.id, co)}
                                                        /> 
                                                        {co}
                                                    </label>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input 
                                                type="text" 
                                                value={u.bloomLevel} 
                                                onChange={(e) => handleChange(u.id, 'bloomLevel', e.target.value)}
                                                style={{ width: '60px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }} 
                                            />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                                            <input 
                                                type="text" 
                                                value={u.lectures} 
                                                onChange={(e) => handleChange(u.id, 'lectures', e.target.value)}
                                                style={{ width: '40px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }} 
                                            />
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#475569' }}>
                                            {u.lectures} rows
                                        </td>
                                        <td style={{ padding: '12px', borderBottom: index < units.length - 1 ? '1px solid #e2e8f0' : 'none', textAlign: 'center' }}>
                                            <button onClick={() => handleRemoveUnit(u.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <button onClick={handleAddUnit} style={{ background: '#328470', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', marginBottom: '8px' }}>+ Add unit</button>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                    *In teaching plan* cross-checks how many lecture rows in the Teaching Plan tab are currently tagged to this unit, so you can spot mismatches.
                </div>
            </div>
        </div>
    );
}
