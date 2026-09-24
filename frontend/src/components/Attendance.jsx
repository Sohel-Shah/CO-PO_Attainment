import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

export default function Attendance({ st = {}, dispatch }) {
    const { addToast } = useToast();
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT' | 'UNMARKED'

    const parseSemNumber = (semStr) => {
        if (!semStr) return -1;
        let s = String(semStr).toUpperCase().trim();
        s = s.replace(/^SEM(ESTER)?\s*/, '');
        const romanMap = { 'I':1, 'II':2, 'III':3, 'IV':4, 'V':5, 'VI':6, 'VII':7, 'VIII':8, 'IX':9, 'X':10 };
        if (romanMap[s]) return romanMap[s];
        const num = parseInt(s);
        return isNaN(num) ? -1 : num;
    };

    const courseSemNumber = parseSemNumber(st?.selectedSemester || st?.coursePlan?.semester || "1");
    const students = (st?.students || []).filter(s => parseSemNumber(s.semester) === courseSemNumber);
    const attendanceRecord = st?.attendance || {};
    const currentDayAttendance = attendanceRecord[selectedDate] || {};

    const getStudentRoll = (s) => String(s.misNo || s.mis || s.rollNo || s.roll || s.rollNumber || s.id || '');

    const getStatus = (student) => {
        const val = currentDayAttendance[getStudentRoll(student)];
        if (val === 'P' || val === 'Present') return 'Present';
        if (val === 'A' || val === 'Absent') return 'Absent';
        if (val === 'E' || val === 'Excused') return 'Excused';
        return '';
    };

    const handleStatusChange = (student, newStatus) => {
        const rollKey = getStudentRoll(student);
        const currentStatus = getStatus(student);
        const updatedDay = { ...currentDayAttendance };

        if (currentStatus === newStatus) {
            delete updatedDay[rollKey]; // Toggle off if clicked again
        } else {
            updatedDay[rollKey] = newStatus;
        }

        dispatch({
            type: "SET_ATTENDANCE",
            date: selectedDate,
            data: updatedDay
        });
    };

    const handleBulkAction = (actionStatus) => {
        if (students.length === 0) return;
        const updatedDay = { ...currentDayAttendance };

        students.forEach(s => {
            const rollKey = getStudentRoll(s);
            if (actionStatus === 'CLEAR') {
                delete updatedDay[rollKey];
            } else {
                updatedDay[rollKey] = actionStatus;
            }
        });

        dispatch({
            type: "SET_ATTENDANCE",
            date: selectedDate,
            data: updatedDay
        });

        if (actionStatus === 'Present') addToast(`Marked all ${students.length} students as Present for ${selectedDate}`, "success");
        if (actionStatus === 'Absent') addToast(`Marked all ${students.length} students as Absent for ${selectedDate}`, "success");
        if (actionStatus === 'CLEAR') addToast(`Cleared all attendance records for ${selectedDate}`, "info");
    };

    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;

    students.forEach(s => {
        const status = getStatus(s);
        if (status === 'Present') presentCount++;
        else if (status === 'Absent') absentCount++;
        else if (status === 'Excused') excusedCount++;
        else unmarkedCount++;
    });

    const totalStudents = students.length;
    const attendancePercent = totalStudents > 0 ? Math.round(((presentCount + excusedCount * 0.5) / totalStudents) * 100) : 0;

    const filteredStudents = students.filter(s => {
        const roll = getStudentRoll(s).toLowerCase();
        const name = String(s.name || '').toLowerCase();
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = !query || roll.includes(query) || name.includes(query);

        const status = getStatus(s);
        if (filterStatus === 'PRESENT' && status !== 'Present') return false;
        if (filterStatus === 'ABSENT' && status !== 'Absent') return false;
        if (filterStatus === 'UNMARKED' && status !== '') return false;

        return matchesQuery;
    });

    return (
        <div style={{ paddingBottom: '50px' }}>
            <h1 className="pagetitle" style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>Attendance Register</h1>
            <div className="pagesub" style={{ marginBottom: '24px', color: '#64748b', fontSize: '13px', lineHeight: '1.6' }}>
                Mark daily or lecture-wise attendance directly for all students enrolled in this course's <strong>Student Roster</strong>. Attendance statistics update in real-time and feed into course attainment analyses.
            </div>

            {students.length === 0 ? (
                <div className="card" style={{ background: '#fff', borderRadius: '10px', padding: '40px 24px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                    <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '8px' }}>No Students Found in Roster</h3>
                    <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                        Please navigate to the <strong>Student Roster</strong> tab to add or import students into this course before marking attendance.
                    </p>
                </div>
            ) : (
                <>
                    {/* Top Control Panel */}
                    <div className="card" style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                            {/* Left: Date Picker */}
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                    SELECT LECTURE DATE
                                </label>
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)} 
                                    style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', color: '#1e293b', fontWeight: '600', outline: 'none', cursor: 'pointer', background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                                />
                            </div>

                            {/* Center: Live Stats Summary */}
                            <div style={{ flex: '1 1 320px', background: '#f8fafc', padding: '12px 18px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>Daily Attendance Rate: <strong>{attendancePercent}%</strong></span>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                        <span style={{ color: '#059669', fontWeight: '600' }}>✓ {presentCount} Present</span>
                                        <span style={{ color: '#dc2626', fontWeight: '600' }}>✕ {absentCount} Absent</span>
                                        {excusedCount > 0 && <span style={{ color: '#d97706', fontWeight: '600' }}>● {excusedCount} Excused</span>}
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div style={{ width: '100%', background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                                    <div style={{ width: `${totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0}%`, background: '#10b981', transition: 'width 0.3s ease' }} title={`Present: ${presentCount}`} />
                                    <div style={{ width: `${totalStudents > 0 ? (excusedCount / totalStudents) * 100 : 0}%`, background: '#f59e0b', transition: 'width 0.3s ease' }} title={`Excused: ${excusedCount}`} />
                                    <div style={{ width: `${totalStudents > 0 ? (absentCount / totalStudents) * 100 : 0}%`, background: '#ef4444', transition: 'width 0.3s ease' }} title={`Absent: ${absentCount}`} />
                                </div>
                            </div>

                            {/* Right: Bulk Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                                    BULK ACTIONS ({selectedDate})
                                </span>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button 
                                        onClick={() => handleBulkAction('Present')}
                                        style={{ background: '#059669', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(5,150,105,0.2)' }}
                                    >
                                        ✓ All Present
                                    </button>
                                    <button 
                                        onClick={() => handleBulkAction('Absent')}
                                        style={{ background: '#fff', color: '#dc2626', border: '1px solid #fca5a5', padding: '7px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        ✕ All Absent
                                    </button>
                                    <button 
                                        onClick={() => handleBulkAction('CLEAR')}
                                        style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #cbd5e1', padding: '7px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                                        title="Clear all marked attendance for today"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Roster & Attendance Table Card */}
                    <div className="card" style={{ background: '#fff', borderRadius: '10px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        {/* Filter Bar & Search */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 'ALL', label: `All Students (${totalStudents})` },
                                    { id: 'PRESENT', label: `Present (${presentCount})` },
                                    { id: 'ABSENT', label: `Absent (${absentCount})` },
                                    { id: 'UNMARKED', label: `Unmarked (${unmarkedCount})` },
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setFilterStatus(tab.id)}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: filterStatus === tab.id ? '600' : '500',
                                            border: filterStatus === tab.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                            background: filterStatus === tab.id ? '#eff6ff' : '#f8fafc',
                                            color: filterStatus === tab.id ? '#1e40af' : '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ position: 'relative', width: '280px' }}>
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="🔍 Search MIS No. or Name..."
                                    style={{ width: '100%', padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', color: '#334155', background: '#f8fafc' }}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', color: '#475569', fontWeight: '700', width: '50px', textTransform: 'uppercase' }}>#</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#475569', fontWeight: '700', width: '150px', textTransform: 'uppercase' }}>MIS NO. / ROLL</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#475569', fontWeight: '700', minWidth: '180px', textTransform: 'uppercase' }}>STUDENT NAME</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', color: '#475569', fontWeight: '700', width: '110px', textTransform: 'uppercase' }}>SEMESTER</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11px', color: '#475569', fontWeight: '700', minWidth: '320px', textTransform: 'uppercase' }}>MARK ATTENDANCE ({selectedDate})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                                No students matching your search query or status filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((s, index) => {
                                            const status = getStatus(s);
                                            const isPresent = status === 'Present';
                                            const isAbsent = status === 'Absent';
                                            const isExcused = status === 'Excused';

                                            return (
                                                <tr key={s.id || index} style={{ borderBottom: index < filteredStudents.length - 1 ? '1px solid #f1f5f9' : 'none', background: isPresent ? '#f0fdf4' : isAbsent ? '#fef2f2' : isExcused ? '#fffbeb' : '#fff', transition: 'background-color 0.15s ease' }}>
                                                    <td style={{ padding: '14px', textAlign: 'center', fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>
                                                        {index + 1}
                                                    </td>
                                                    <td style={{ padding: '14px', fontSize: '13px', fontWeight: '600', color: '#1e293b', fontFamily: 'monospace' }}>
                                                        {getStudentRoll(s) || '—'}
                                                    </td>
                                                    <td style={{ padding: '14px', fontSize: '13.5px', color: '#334155', fontWeight: '500' }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{s.name || 'Unnamed Student'}</div>
                                                        {(s.mobile || s.email) && (
                                                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                                                                {[s.mobile, s.email].filter(Boolean).join(' • ')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px', textAlign: 'center', fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>
                                                        {s.semester || '—'}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                                            {/* Present Button */}
                                                            <button
                                                                onClick={() => handleStatusChange(s, 'Present')}
                                                                style={{
                                                                    padding: '8px 18px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12.5px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    border: isPresent ? '1px solid #059669' : '1px solid #cbd5e1',
                                                                    background: isPresent ? '#10b981' : '#f8fafc',
                                                                    color: isPresent ? '#fff' : '#475569',
                                                                    boxShadow: isPresent ? '0 2px 4px rgba(16,185,129,0.3)' : 'none',
                                                                    transition: 'all 0.15s ease',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                                title="Mark Present"
                                                            >
                                                                <span>✓</span>
                                                                <span>Present</span>
                                                            </button>

                                                            {/* Absent Button */}
                                                            <button
                                                                onClick={() => handleStatusChange(s, 'Absent')}
                                                                style={{
                                                                    padding: '8px 18px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '12.5px',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    border: isAbsent ? '1px solid #dc2626' : '1px solid #cbd5e1',
                                                                    background: isAbsent ? '#ef4444' : '#f8fafc',
                                                                    color: isAbsent ? '#fff' : '#475569',
                                                                    boxShadow: isAbsent ? '0 2px 4px rgba(239,68,68,0.3)' : 'none',
                                                                    transition: 'all 0.15s ease',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                                title="Mark Absent"
                                                            >
                                                                <span>✕</span>
                                                                <span>Absent</span>
                                                            </button>

                                                            {/* Excused Button */}
                                                            <button
                                                                onClick={() => handleStatusChange(s, 'Excused')}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11.5px',
                                                                    fontWeight: '500',
                                                                    cursor: 'pointer',
                                                                    border: isExcused ? '1px solid #d97706' : '1px solid #cbd5e1',
                                                                    background: isExcused ? '#f59e0b' : '#f8fafc',
                                                                    color: isExcused ? '#fff' : '#64748b',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                title="Mark Excused / Approved Leave"
                                                            >
                                                                Excused
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>💡 Tip: Clicking an already selected attendance status will unmark/reset that student's attendance for the selected day.</span>
                            <span>Showing {filteredStudents.length} of {totalStudents} students</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

