import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';

export default function SyllabusUpload({ st, dispatch }) {
    const { addToast } = useToast();
    const [isExtracting, setIsExtracting] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            addToast("Please upload a valid PDF file.", "error");
            return;
        }

        setIsExtracting(true);
        addToast("Uploading and extracting syllabus details... This may take a minute.", "info");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const host = window.location.hostname;
            const res = await fetch(`http://${host}:3003/api/courses/extract-syllabus`, {
                method: "POST",
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("app_token")}`
                }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to extract syllabus");
            }

            console.log("Extracted Data:", data);

            // Populate state with extracted data
            if (data.course) {
                if (data.course.courseName) dispatch({ type: 'SET_COURSE_FIELD', field: 'course', val: data.course.courseName });
                if (data.course.courseCode) dispatch({ type: 'SET_COURSE_FIELD', field: 'code', val: data.course.courseCode });
                if (data.course.credits !== null) dispatch({ type: 'SET_COURSE_FIELD', field: 'credits', val: String(data.course.credits) });
                
                // Root level fields in App.jsx state
                if (data.course.department) dispatch({ type: 'SET_FIELD', field: 'department', val: data.course.department });
                if (data.course.programName) dispatch({ type: 'SET_FIELD', field: 'programName', val: data.course.programName });
                if (data.course.academicYear) dispatch({ type: 'SET_FIELD', field: 'academicYear', val: data.course.academicYear });
                if (data.course.semester) dispatch({ type: 'SET_FIELD', field: 'selectedSemester', val: data.course.semester });
                
                // LTP parsing for lectureHrs
                if (data.course.lectureHrs !== null || data.course.tutorialHrs !== null || data.course.practicalHrs !== null || data.course.selfStudyHrs !== null) {
                    const l = data.course.lectureHrs || 0;
                    const t = data.course.tutorialHrs || 0;
                    const p = data.course.practicalHrs || 0;
                    const s = data.course.selfStudyHrs || 0;
                    dispatch({ type: 'SET_COURSE_FIELD', field: 'ltp', val: `${l}-${t}-${p}-${s}` });
                }
            }

            if (data.courseOutcomes && data.courseOutcomes.length > 0) {
                const currentCos = st.courseOutcomes || [];
                const mergedCos = data.courseOutcomes.map((extCo, i) => {
                    const id = extCo.id || `CO${i + 1}`;
                    return {
                        id,
                        coNumber: id,
                        desc: extCo.desc || "",
                        bloom: extCo.bloom || ""
                    };
                });
                dispatch({ type: 'SET_COURSE_OUTCOMES', val: mergedCos });
            }

            if (data.units && data.units.length > 0) {
                const mappedUnits = data.units.map((u, i) => ({
                    id: i + 1,
                    unit: u.unit || String(i + 1),
                    name: u.name || "",
                    topics: u.topics || "",
                    bloomLevel: u.bloomLevel || "",
                    lectures: u.lectures ? String(u.lectures) : "0",
                    coMapping: { CO1: false, CO2: false, CO3: false, CO4: false, CO5: false, CO6: false }
                }));
                dispatch({ type: 'SET_UNITS', val: mappedUnits });
            }

            if (data.references) {
                dispatch({ type: 'SET_REFERENCES', val: data.references });
            }

            addToast("Syllabus extracted successfully! Please review the populated fields below before saving.", "success");

        } catch (err) {
            console.error("Extraction error:", err);
            addToast(err.message || "An error occurred during extraction.", "error");
        } finally {
            setIsExtracting(false);
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px dashed #22c55e',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <h3 style={{ fontSize: '18px', color: '#166534', margin: '0 0 8px 0', fontWeight: '600' }}>
                AI Syllabus Auto-Extraction
            </h3>
            <p style={{ fontSize: '14px', color: '#15803d', margin: '0 0 16px 0', maxWidth: '500px' }}>
                Upload your official Subject Syllabus PDF. Our AI will automatically read the document and populate the fields below for you to review.
            </p>
            
            <input 
                type="file" 
                accept="application/pdf" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isExtracting ? '#94a3b8' : '#16a34a',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: isExtracting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)',
                    transition: 'all 0.2s'
                }}
            >
                {isExtracting ? (
                    <>
                        <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}>
                            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                        </svg>
                        Extracting...
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload PDF Syllabus
                    </>
                )}
            </button>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
