import React from 'react';

export default function References({ st, dispatch }) {
    const references = st.coursePlan?.references || {};
    const textbooks = references.textbooks || [];
    const referenceBooks = references.referenceBooks || [];
    const standards = references.standards || [];

    const updateReferences = (newRefs) => {
        dispatch({ type: 'SET_REFERENCES', val: newRefs });
    };

    const handleAdd = (key, state) => {
        const newId = state.length > 0 ? Math.max(...state.map(item => item.id)) + 1 : 1;
        updateReferences({ ...references, [key]: [...state, { id: newId, text: "" }] });
    };

    const handleRemove = (key, state, id) => {
        updateReferences({ ...references, [key]: state.filter(item => item.id !== id) });
    };

    const handleChange = (key, state, id, value) => {
        updateReferences({ ...references, [key]: state.map(item => item.id === id ? { ...item, text: value } : item) });
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 className="pagetitle">Reading Resources</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>
                Textbooks, reference books, and standards/codes for the course.
            </div>

            {/* Textbooks */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '16px' }}>Textbooks</h2>
                
                {textbooks.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input 
                            type="text" 
                            value={item.text} 
                            onChange={(e) => handleChange('textbooks', textbooks, item.id, e.target.value)} 
                            style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#334155' }} 
                        />
                        <button 
                            onClick={() => handleRemove('textbooks', textbooks, item.id)} 
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '36px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ×
                        </button>
                    </div>
                ))}

                <button 
                    onClick={() => handleAdd('textbooks', textbooks)} 
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' }}>
                    + Add entry
                </button>
            </div>

            {/* Reference Books */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '16px' }}>Reference Books</h2>
                
                {referenceBooks.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input 
                            type="text" 
                            value={item.text} 
                            onChange={(e) => handleChange('referenceBooks', referenceBooks, item.id, e.target.value)} 
                            style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#334155' }} 
                        />
                        <button 
                            onClick={() => handleRemove('referenceBooks', referenceBooks, item.id)} 
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '36px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ×
                        </button>
                    </div>
                ))}

                <button 
                    onClick={() => handleAdd('referenceBooks', referenceBooks)} 
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' }}>
                    + Add entry
                </button>
            </div>

            {/* Standards / Codes */}
            <div className="card" style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', color: '#1e3a8a', fontWeight: 'bold', marginBottom: '16px' }}>Standards / Codes</h2>
                
                {standards.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input 
                            type="text" 
                            value={item.text} 
                            onChange={(e) => handleChange('standards', standards, item.id, e.target.value)} 
                            style={{ flex: 1, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', color: '#334155' }} 
                        />
                        <button 
                            onClick={() => handleRemove('standards', standards, item.id)} 
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', width: '36px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ×
                        </button>
                    </div>
                ))}

                <button 
                    onClick={() => handleAdd('standards', standards)} 
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' }}>
                    + Add entry
                </button>
            </div>
        </div>
    );
}
