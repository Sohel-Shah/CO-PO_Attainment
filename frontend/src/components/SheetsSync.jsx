import React, { useState } from 'react';
import { S, I } from '../utils/ui-utils';
import { useToast } from '../context/ToastContext';
import { ALL_POS } from '../utils/attainmentCalculator';

function toTSV(rows) {
    return rows.map(r => r.map(v => (v === undefined || v === null ? '' : String(v)).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t')).join('\n');
}

function parseDelimited(text) {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const delim = lines[0].includes('\t') ? '\t' : ',';
    return lines.map(line => {
        if (delim === '\t') return line.split('\t').map(c => c.trim());
        
        const out = []; let cur = ''; let inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQ) {
                if (ch === '"') {
                    if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
                } else cur += ch;
            } else {
                if (ch === '"') inQ = true;
                else if (ch === ',') { out.push(cur.trim()); cur = ''; }
                else cur += ch;
            }
        }
        out.push(cur.trim());
        return out;
    });
}

export default function SheetsSync({ st, dispatch }) {
    const [importType, setImportType] = useState('students'); // students | copo | marks
    const [pastedText, setPastedText] = useState('');
    const [previewRows, setPreviewRows] = useState([]);
    
    const { addToast } = useToast();

    // Export Helpers
    const handleExport = async (type) => {
        let rows = [];
        let filename = '';

        if (type === 'students') {
            filename = 'student_roster';
            rows.push(['Roll Number', 'Full Name', 'Email', 'Batch Year']);
            (st.students || []).forEach(s => {
                rows.push([s.rollNo || s.roll || s.id, s.name, s.email || '', s.year || '']);
            });
        } else if (type === 'copo') {
            filename = 'copo_matrix';
            rows.push(['CO / PO', ...ALL_POS]);
            (st.courseOutcomes || []).forEach(co => {
                const coRow = [co.id];
                ALL_POS.forEach(po => {
                    coRow.push(st.copoMap?.[co.id]?.[po] || 0);
                });
                rows.push(coRow);
            });
        } else if (type === 'marks') {
            filename = `marks_entry_${st.selectedExamType.replace(/\s+/g, '_')}`;
            const activeExam = st.exams?.find(e => e.type === st.selectedExamType) || st.exams?.[0];
            if (!activeExam) return addToast("No active exam found to export marks.", "warning");
            
            const qLabels = (activeExam.questions || []).map(q => q.q);
            rows.push(['Roll Number', 'Student Name', ...qLabels]);

            (st.students || []).forEach(s => {
                const sRow = [s.rollNo || s.roll || s.id, s.name];
                (activeExam.questions || []).forEach(q => {
                    const mVal = st.marksState?.[s.id]?.[q.id] ?? '';
                    sRow.push(mVal);
                });
                rows.push(sRow);
            });
        }

        const tsvText = toTSV(rows);
        try {
            await navigator.clipboard.writeText(tsvText);
            addToast(`Successfully copied ${filename} to clipboard! Paste directly into Google Sheets.`, "success");
        } catch {
            addToast("Clipboard write failed. Copying fallback:\n" + tsvText, "error");
        }
    };

    const handlePreview = () => {
        if (!pastedText.trim()) return addToast("Please paste TSV or CSV data first.", "warning");
        const parsed = parseDelimited(pastedText.trim());
        setPreviewRows(parsed);
    };

    const handleImport = () => {
        if (previewRows.length < 2) return addToast("Pasted data is empty or missing headers.", "warning");

        const dataRows = previewRows.slice(1);

        if (importType === 'students') {
            // Mapping: Roll Number, Full Name, Email, Batch Year
            const parsedStudents = dataRows.map(r => {
                const roll = r[0] || '';
                const name = r[1] || '';
                const email = r[2] || '';
                const year = r[3] || '';
                return {
                    id: roll,
                    roll: roll,
                    rollNo: roll,
                    name: name,
                    email: email,
                    year: year
                };
            }).filter(s => s.roll);

            dispatch({ type: "SET_STUDENTS", payload: parsedStudents });
            addToast(`Imported ${parsedStudents.length} students into the registry!`, "success");

        } else if (importType === 'copo') {
            // Mapping: Header (CO / PO, PO1, PO2...)
            const parsedCopoMap = { ...(st.copoMap || {}) };
            dataRows.forEach(r => {
                const coId = r[0];
                if (!coId) return;
                parsedCopoMap[coId] = {};
                ALL_POS.forEach((po, idx) => {
                    const val = parseInt(r[idx + 1]) || 0;
                    parsedCopoMap[coId][po] = val;
                });
            });

            dispatch({ type: "SET_COPO_MAP", val: parsedCopoMap });
            addToast("Successfully imported CO-PO matrix correlations!", "success");

        } else if (importType === 'marks') {
            // Mapping: Roll Number, Student Name, Q1, Q2...
            const activeExam = st.exams?.find(e => e.type === st.selectedExamType) || st.exams?.[0];
            if (!activeExam) return addToast("No active exam setup to import marks into.", "warning");

            const parsedMarks = { ...(st.marksState || {}) };

            dataRows.forEach(r => {
                const roll = r[0];
                if (!roll) return;
                if (!parsedMarks[roll]) parsedMarks[roll] = {};
                
                (activeExam.questions || []).forEach((q, idx) => {
                    const val = r[idx + 2];
                    if (val !== undefined && val !== null && val !== '') {
                        parsedMarks[roll][q.id] = parseFloat(val) || 0;
                    }
                });
            });

            dispatch({ type: "SET_MARKS", val: parsedMarks });
            addToast(`Marks imported for ${dataRows.length} students!`, "success");
        }

        setPastedText('');
        setPreviewRows([]);
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 className="pagetitle">Google Sheets Sync Portal</h1>
                <p className="pagesub">Easily copy data out or parse Google Sheet tables directly back into the studio using clipboard copy-paste.</p>
            </div>

            <div style={{ marginTop: '24px', display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Left Card: Export Options */}
                <div className="card">
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy-2)", margin: "0 0 4px" }}>Export Data to Sheets</h3>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Select a table type below to copy the data as TSV (Tab Separated Values) for easy pasting.</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <button onClick={() => handleExport('students')} className="btn ghost">
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>Student Registry Table</span>
                            <span style={{ fontSize: 11, color: "var(--brand)" }}>Copy TSV &rarr;</span>
                        </button>
                        <button onClick={() => handleExport('copo')} className="btn ghost">
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>CO-PO Correlation Matrix</span>
                            <span style={{ fontSize: 11, color: "var(--brand)" }}>Copy TSV &rarr;</span>
                        </button>
                        <button onClick={() => handleExport('marks')} className="btn ghost">
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>Student Marks ({st.selectedExamType})</span>
                            <span style={{ fontSize: 11, color: "var(--brand)" }}>Copy TSV &rarr;</span>
                        </button>
                    </div>
                </div>

                {/* Right Card: Import Options */}
                <div className="card">
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy-2)", margin: "0 0 4px" }}>Import Data from Sheets</h3>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Paste TSV cells directly from a Google Sheet to overwrite current parameters.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                        <div className="field">
<label>Import Content Type</label>
                            <select  value={importType} onChange={e => { setImportType(e.target.value); setPreviewRows([]); }}>
                                <option value="students">Student Registry (4 cols: Roll, Name, Email, Year)</option>
                                <option value="copo">CO-PO Matrix (Headers: CO/PO, PO1, PO2...)</option>
                                <option value="marks">Marks Entry (Headers: Roll, Name, Q1, Q2...)</option>
                            </select>
                        </div>
                        <button onClick={handlePreview} className="btn teal">Analyze Paste</button>
                    </div>

                    <textarea
                        style={{ ...S.input, height: "100px", resize: "vertical", fontFamily: "monospace", fontSize: 11.5 }}
                        placeholder="Paste cells copied from Google Sheets / Excel here..."
                        value={pastedText}
                        onChange={e => setPastedText(e.target.value)}
                    />
                </div>
            </div>

            {/* Import Preview Area */}
            {previewRows.length > 0 && (
                <div className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--navy-2)", margin: 0 }}>Import Structure Preview ({previewRows.length - 1} rows detected)</h4>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={handleImport} className="btn teal">Commit Import</button>
                            <button onClick={() => setPreviewRows([])} className="btn ghost">Cancel</button>
                        </div>
                    </div>

                    <div style={{ overflowX: "auto", maxHeight: "250px", overflowY: "auto", background: "var(--bg-app)", borderRadius: 8, padding: 10 }}>
                        <div className="tablewrap"><table className="data">
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    {previewRows[0].map((h, i) => (
                                        <th key={i} style={{ padding: "6px 8px", color: "var(--navy)", fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewRows.slice(1, 6).map((row, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 1 ? "var(--bg-card)" : "transparent" }}>
                                        {row.map((cell, i) => (
                                            <td key={i} style={{ padding: "6px 8px", color: "var(--text-main)" }}>{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                                {previewRows.length > 6 && (
                                    <tr>
                                        <td colSpan={previewRows[0].length} style={{ padding: "8px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
                                            ... and {previewRows.length - 6} more rows.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table></div>
                    </div>
                </div>
            )}
        </div>
    );
}
