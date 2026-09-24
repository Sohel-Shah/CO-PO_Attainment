import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useAcademicYear } from '../context/AcademicYearContext';

export default function CoursesList({ token, onOpen, user }) {
  const { addToast, confirmAction } = useToast();
  const [courses, setCourses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('faculty');
  const [addingUser, setAddingUser] = useState(false);
  
  const [assignCourseUser, setAssignCourseUser] = useState(null);
  const [selectedCourseToAssign, setSelectedCourseToAssign] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // ── Add-Course Modal (Faculty self-assignment from CAY catalog) ──
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [addCourseSearch, setAddCourseSearch] = useState('');
  const [addCourseLoading, setAddCourseLoading] = useState(false);
  const [addCourseAssigning, setAddCourseAssigning] = useState(null); // courseId being assigned

  const { activeYearLabel, setActiveYear, cayYear, caym1Year, caym2Year, getDropdownOptions } = useAcademicYear();

  const [cayAcadYear, setCayAcadYear] = useState(activeYearLabel || '2026–27');
  const [caySemester, setCaySemester] = useState('ALL');
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    if (cayAcadYear !== 'ALL' && activeYearLabel) {
      setCayAcadYear(activeYearLabel);
    }
  }, [activeYearLabel]);

  // Fetch the list of courses on mount
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://${window.location.hostname}:3001/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("app_token");
          window.location.reload();
          return;
        }
        setError("Failed to load courses");
      }

      const usersRes = await fetch(`http://${window.location.hostname}:3001/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch courses from academic microservice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!(await confirmAction("Are you sure you want to delete this user?"))) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsersList(prev => prev.filter(u => u.id !== userId));
        addToast("User deleted.", "success");
      } else {
        addToast("Failed to delete user.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Error deleting user.", "error");
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return addToast("Please enter a name and email for the user.", "warning");
    setAddingUser(true);

    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: newUserEmail.trim(), name: newUserName.trim(), role: newUserRole })
      });
      if (res.ok) {
        await res.json();
        fetchCourses(); // refresh lists
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('faculty');
        addToast(`User ${newUserEmail} added successfully!`, "success");
      } else {
        const errData = await res.json();
        addToast(errData.error || "Failed to add user", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Error adding user", "error");
    } finally {
      setAddingUser(false);
    }
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    if (!assignCourseUser || !selectedCourseToAssign) return addToast("Please select a course", "warning");
    const userId = assignCourseUser.id;
    try {
        const res = await fetch(`http://${window.location.hostname}:3001/api/users/${userId}/course-access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ courseId: selectedCourseToAssign, accessLevel: 'owner' })
        });
        if (res.ok) {
            addToast("Access granted", "success");
            setAssignCourseUser(null);
            setSelectedCourseToAssign('');
            fetchCourses(); // Refreshes users and courses
        } else {
            const err = await res.json();
            addToast(err.error || "Failed to assign course", "error");
        }
    } catch (error) {
        addToast("Network error", "error");
    }
  };

  const handleRevokeCourse = async (userId, courseId) => {
    try {
        const res = await fetch(`http://${window.location.hostname}:3001/api/users/${userId}/course-access/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            addToast("Access revoked", "success");
            fetchCourses();
        } else {
            const err = await res.json();
            addToast(err.error || "Failed to revoke access", "error");
        }
    } catch (error) {
        addToast("Network error", "error");
    }
  };

  // Open the searchable CAY catalog modal for faculty to self-assign
  const handleCreate = () => {
    setAddCourseSearch('');
    setShowAddCourseModal(true);
    handleFetchCatalog();
  };

  // Fetch all CAY courses from the catalog endpoint (visible to any logged-in user)
  const handleFetchCatalog = async () => {
    setAddCourseLoading(true);
    try {
      const res = await fetch(
        `http://${window.location.hostname}:3001/api/courses/catalog?academicYear=2026-27`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setCatalogCourses(Array.isArray(data) ? data : []);
      } else {
        addToast("Failed to load course catalog", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error loading catalog", "error");
    } finally {
      setAddCourseLoading(false);
    }
  };

  // Faculty self-assigns to a course from the CAY catalog
  const handleSelfAssign = async (courseDbId, courseName) => {
    setAddCourseAssigning(courseDbId);
    try {
      const res = await fetch(
        `http://${window.location.hostname}:3001/api/users/self/assign-course`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ courseId: courseDbId })
        }
      );
      if (res.ok) {
        addToast(`"${courseName}" added to your dashboard!`, "success");
        setShowAddCourseModal(false);
        // Re-fetch both courses list (CAY table) AND users list (Admin sync)
        fetchCourses();
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to assign course", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error during assignment", "error");
    } finally {
      setAddCourseAssigning(null);
    }
  };

  const handleDuplicate = async (sourceId) => {
    try {
      // 1. Fetch full state of source course
      const stateRes = await fetch(`http://${window.location.hostname}:3001/api/v2/courses/${sourceId}/state`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!stateRes.ok) throw new Error("Failed to load source course state");
      const sourceState = await stateRes.json();

      // 2. Generate copy fields
      const newCode = `${sourceId}-COPY-${Math.floor(100 + Math.random() * 900)}`;
      const newName = `${sourceState.course?.name || "Course"} (Copy)`;

      // 3. Assemble duplicated payload
      const duplicatePayload = {
        course: {
          ...sourceState.course,
          courseId: newCode,
          code: newCode,
          name: newName
        },
        exams: sourceState.exams || [],
        coStatements: sourceState.coStatements || [],
        copoMap: sourceState.copoMap || {},
        students: sourceState.students || [],
        papers: sourceState.papers || [],
        marks: sourceState.marks || sourceState.marksState || {},
        selectedExamType: sourceState.selectedExamType || "Internal",
        attendance: sourceState.attendance || {},
        feedback: sourceState.feedback || [],
        teachingPlan: sourceState.teachingPlan || null
      };

      // 4. Save using sync-full
      const syncRes = await fetch(`http://${window.location.hostname}:3001/api/v2/sync-full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(duplicatePayload)
      });

      if (syncRes.ok) {
        addToast(`Course duplicated successfully under code ${newCode}!`, "success");
        fetchCourses();
      } else {
        addToast("Failed to duplicate course", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Duplication failed: " + err.message, "error");
    }
  };

  const handleDelete = async (courseId) => {
    if (!(await confirmAction(`Are you sure you want to permanently delete course ${courseId}? This cannot be undone.`))) return;

    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Course deleted successfully!", "success");
        fetchCourses();
      } else {
        addToast("Failed to delete course", "error");
      }
    } catch (error) {
      console.error(error);
      addToast("Error deleting course", "error");
    }
  };

  const getRole = (c) => {
    // If the user has courseAccesses, they are an owner if they have 'owner' access.
    if (c.courseAccesses && c.courseAccesses.length > 0) {
      const access = c.courseAccesses.find(a => a.userId === user?.id);
      if (access) return access.accessLevel === 'owner' ? 'owner' : 'viewer';
    }
    
    // Fallback for legacy / admin 
    const isAssigned = c.faculty?.name === user?.name || c.facultyName === user?.name;
    return user?.role === 'admin' ? 'admin' : (isAssigned ? 'owner' : 'viewer');
  };

  if (loading) return <div style={{ padding: 20 }}><span className="skeleton" style={{ height: 40 }} /></div>;
  if (error) return <div style={{ padding: 20, color: 'var(--red)' }}>{error}</div>;

  const matchAcadYear = (course, filterVal) => {
    if (filterVal === 'ALL') return true;
    const ay = String(course.academicYear || '2026-27').replace(/–/g, '-').trim();
    const target = String(filterVal).replace(/–/g, '-').trim();
    return ay.startsWith(target);
  };

  const getSemNumber = (val) => {
    if (!val) return 0;
    const s = String(val).trim().toUpperCase();
    if (s.includes("8") || /\bVIII\b/.test(s) || s === "VIII" || s.endsWith("VIII") || s === "SEM8" || s === "8") return 8;
    if (s.includes("7") || /\bVII\b/.test(s) || s === "VII" || s.endsWith("VII") || s === "SEM7" || s === "7") return 7;
    if (s.includes("6") || /\bVI\b/.test(s) || s === "VI" || s.endsWith("VI") || s === "SEM6" || s === "6") return 6;
    if (s.includes("4") || /\bIV\b/.test(s) || s === "IV" || s.endsWith("IV") || s === "SEM4" || s === "4") return 4;
    if (s.includes("5") || /\bV\b/.test(s) || s === "V" || s.endsWith("V") || s === "SEM5" || s === "5") return 5;
    if (s.includes("3") || /\bIII\b/.test(s) || s === "III" || s.endsWith("III") || s === "SEM3" || s === "3") return 3;
    if (s.includes("2") || /\bII\b/.test(s) || s === "II" || s.endsWith("II") || s === "SEM2" || s === "2") return 2;
    if (s.includes("1") || /\bI\b/.test(s) || s === "I" || s.endsWith("I") || s === "SEM1" || s === "1") return 1;
    return 0;
  };

  const matchSemester = (course, filterVal) => {
    if (!filterVal || filterVal === 'ALL') return true;
    const targetSem = getSemNumber(filterVal);
    if (!targetSem) return true;
    const courseSem = getSemNumber(course.semester || course.selectedSemester || 'V');
    return courseSem === targetSem;
  };

  const matchSearch = (course, query) => {
    if (!query || !query.trim()) return true;
    const q = query.trim().toLowerCase();
    return [
      course.name,
      course.courseId,
      course.code,
      course.courseType,
      course.category,
      course.semester,
      course.selectedSemester,
      course.academicYear,
      course.facultyName,
      course.faculty?.name,
      course.programName,
      course.department,
    ].some(field => field && String(field).toLowerCase().includes(q));
  };

  const cayCourses = courses.filter(c => matchAcadYear(c, cayAcadYear === 'ALL' ? 'ALL' : cayYear) && matchSemester(c, caySemester) && matchSearch(c, courseSearch));
  const caym1Courses = courses.filter(c => matchAcadYear(c, caym1Year) && matchSemester(c, caySemester) && matchSearch(c, courseSearch));
  const caym2Courses = courses.filter(c => matchAcadYear(c, caym2Year) && matchSemester(c, caySemester) && matchSearch(c, courseSearch));

  const renderCourseTable = (title, coursesList) => (
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: coursesList.length > 0 ? 16 : 8 }}>
        <h2 style={{ fontSize: 16, color: 'var(--navy-2)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title} <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 'normal' }}>({coursesList.length} course{coursesList.length !== 1 ? 's' : ''})</span>
        </h2>

        {(title.includes('CAY (') || title.includes('Current Academic Year')) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Academic Year:</label>
              <select
                value={cayAcadYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setCayAcadYear(val);
                  if (val !== 'ALL') {
                    setActiveYear(val);
                  }
                }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#1e293b', backgroundColor: '#fff', fontWeight: 500, outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              >
                {getDropdownOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Year & Semester:</label>
              <select
                value={caySemester}
                onChange={(e) => setCaySemester(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', color: '#1e293b', backgroundColor: '#fff', fontWeight: 500, outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              >
                <option value="ALL">All Semesters</option>
                <optgroup label="FY — First Year">
                  <option value="SEM1">FY – Semester 1</option>
                  <option value="SEM2">FY – Semester 2</option>
                </optgroup>
                <optgroup label="SY — Second Year">
                  <option value="SEM3">SY – Semester 3</option>
                  <option value="SEM4">SY – Semester 4</option>
                </optgroup>
                <optgroup label="TY — Third Year">
                  <option value="SEM5">TY – Semester 5</option>
                  <option value="SEM6">TY – Semester 6</option>
                </optgroup>
                <optgroup label="Final Year">
                  <option value="SEM7">Final Year – Semester 7</option>
                  <option value="SEM8">Final Year – Semester 8</option>
                </optgroup>
              </select>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#94a3b8" strokeWidth="2.2"
                style={{ position: 'absolute', left: 9, pointerEvents: 'none', flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={courseSearch}
                onChange={e => setCourseSearch(e.target.value)}
                placeholder="Search name, ID, code, category, sem…"
                style={{
                  paddingLeft: 30, paddingRight: courseSearch ? 26 : 10,
                  paddingTop: 6, paddingBottom: 6,
                  width: 230,
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  fontSize: '12.5px',
                  color: '#1e293b',
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--teal, #0d9488)'; e.target.style.boxShadow = '0 0 0 2px rgba(13,148,136,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
              />
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch('')}
                  style={{
                    position: 'absolute', right: 7,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0,
                    display: 'flex', alignItems: 'center'
                  }}
                  title="Clear search"
                >×</button>
              )}
            </div>
          </div>
        )}
      </div>

      {coursesList.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0, paddingBottom: 4 }}>
          {courses.length === 0 && user?.role !== 'admin'
            ? 'Your account is registered, but no course access has been assigned. Please contact the Administrator.'
            : courseSearch.trim()
              ? `No courses match “${courseSearch.trim()}”. Try a different name, code, or category.`
              : 'No courses matching the selected filters or academic-year cycle. Use “Copy” on an existing course or reset your filters above.'}
        </p>
      ) : (
        <div className="tablewrap">
          <table className="data">
            <thead>
              <tr>
                <th className="left">Course</th>
                <th style={{ width: 80 }}>Course_ID</th>
                <th style={{ width: 80 }}>Code</th>
                <th style={{ width: 70 }}>Category</th>
                <th style={{ width: 70 }}>Credits</th>
                <th style={{ width: 90 }}>Acad. Year</th>
                <th style={{ width: 85 }}>Semester</th>
                <th style={{ width: 130 }}>Teaching Scheme<br /><span className="muted" style={{ fontWeight: 400 }}>L-P-T-S (hrs/wk)</span></th>
                <th style={{ width: 180 }}>Evaluation Scheme<br /><span className="muted" style={{ fontWeight: 400 }}>TA / MSE / ESE (%)</span></th>
                <th style={{ width: 80 }}>COs</th>
                <th style={{ width: 100 }}>Your Access</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {coursesList.map(c => {
                const role = getRole(c);
                const l = c.lectureHrs || 0;
                const p = c.practicalHrs || 0;
                const t = c.tutorialHrs || 0;
                const s = c.selfStudyHrs || 0;
                const te = c.theoryTE || 20;
                const mse = c.theoryMSE || 30;
                const ese = c.theoryESE || 50;
                const displaySemester = c.semester || c.selectedSemester || 'V';

                return (
                  <tr key={c.courseId} style={{ cursor: 'pointer' }} onClick={() => onOpen(c.courseId)}>
                    <td className="left">
                      <div style={{ fontWeight: 600, color: 'var(--navy-2)', fontSize: 12.5 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.programName || 'B.Tech'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.department || 'Mechanical Engineering'}</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ fontSize: 10, color: 'var(--navy-2)', padding: '2px 6px', background: 'rgba(50, 132, 112, 0.1)', borderRadius: 4 }}>
                          Faculty: {c.facultyName || c.faculty?.name || 'Unassigned'}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--navy-2)', padding: '2px 6px', background: 'rgba(30, 58, 138, 0.08)', border: '1px solid rgba(30, 58, 138, 0.15)', borderRadius: 4, fontWeight: 600 }}>
                          Sem: {displaySemester}
                        </span>
                      </div>
                    </td>
                    <td>{c.courseId.replace('course_ME', '') || '701'}</td>
                    <td className="mono">{c.code || 'TBD'}</td>
                    <td className="mono" title={c.courseType || c.category || 'PCC'}>
                      {(c.courseType || c.category || 'PCC').split(' — ')[0].split(' - ')[0].trim()}
                    </td>
                    <td className="mono">{c.credits || 3}</td>
                    <td className="mono">{c.academicYear}</td>
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--navy-2)' }}>{displaySemester}</td>
                    <td className="mono">{`${l}-${p}-${t}-${s}`}</td>
                    <td className="mono">{`${te}% / ${mse}% / ${ese}%`}</td>
                    <td className="mono">{(c.coStatements?.length === 5 ? 6 : c.coStatements?.length) || (c.courseOutcomes?.length === 5 ? 6 : c.courseOutcomes?.length) || 6}</td>
                    <td>
                      <span className={`role-badge ${role}`}>{role}</span>
                    </td>
                    <td>
                      <div className="rowflex" style={{ justifyContent: 'center', gap: 6 }}>
                        <button className="btn ghost small" onClick={(e) => { e.stopPropagation(); handleDuplicate(c.courseId); }}>Copy</button>
                        {(role === 'admin' || role === 'owner') && (
                          <button className="btn danger small" onClick={(e) => { e.stopPropagation(); handleDelete(c.courseId); }}>Del</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="pagetitle" style={{ fontSize: 26, fontWeight: 'bold', color: 'var(--navy)' }}>Your Courses</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '6px 0 16px 0' }}>Courses are grouped by academic-year cycle (CAY / CAYm1 / CAYm2) so you can maintain 3 years of the same course side by side, then compare attainment trends.</p>
        {user?.role !== 'admin' && (
          <button id="new-course-btn" className="btn teal" onClick={handleCreate}>+ New Course</button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="rowflex">
          <h2 style={{ margin: 0 }}>Users</h2>
          <div className="spacer"></div>
          <span className="muted" style={{ fontSize: 11.5 }}>{usersList.length || 1} in directory</span>
        </div>
        <div className="tablewrap" style={{ marginTop: 10 }}>
          <table className="data">
            <thead>
              <tr>
                <th className="left">Name</th>
                <th style={{ width: 120 }}>Role</th>
                <th style={{ width: 100 }}>Added</th>
                <th className="left">Assigned Courses</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <React.Fragment key={u.id || u.email}>
                  <tr>
                    <td className="left">
                      {u.name || u.email}
                      {u.email === user?.email && <span className="muted" style={{ fontSize: 10.5 }}> (you)</span>}
                      <div className="muted" style={{ fontSize: 10.5 }}>{u.email}</div>
                    </td>
                    <td>
                      {user?.role === 'admin' ? (
                        <select defaultValue={u.role || 'faculty'} style={{ margin: 0 }}>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`role-badge ${u.role || 'faculty'}`}>{u.role || 'faculty'}</span>
                      )}
                    </td>
                    <td className="mono muted">{u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</td>
                    <td className="left">
                        {(!u.courseAccesses || u.courseAccesses.length === 0) ? (
                            <span className="muted" style={{ fontSize: 11 }}>None</span>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {u.courseAccesses.map(access => {
                                    const courseObj = courses.find(c => c.id === access.courseId);
                                    const cName = courseObj?.name;
                                    const cCode = courseObj?.code || courseObj?.courseId;
                                    const displayLabel = cName ? (cCode ? `${cName} (${cCode})` : cName) : (cCode || access.courseId);
                                    return (
                                        <span key={access.courseId} className="role-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: 10, padding: '2px 6px' }}>
                                            {displayLabel}
                                            {user?.role === 'admin' && (
                                              <button 
                                                  onClick={() => handleRevokeCourse(u.id, access.courseId)}
                                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0, marginLeft: 4, fontSize: 10 }}
                                              >✕</button>
                                            )}
                                        </span>
                                    )
                                })}
                            </div>
                        )}
                    </td>
                    <td>
                      <div className="rowflex" style={{ gap: 6, justifyContent: 'flex-end' }}>
                        {user?.role === 'admin' && u.role !== 'admin' && (
                          <button className="btn l1 small" onClick={() => {
                              setAssignCourseUser(u);
                              setCourseSearchQuery('');
                          }}>Assign Course</button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn danger small" onClick={() => handleDeleteUser(u.id)}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td className="left">{user?.name || 'Kunal'} <span className="muted" style={{ fontSize: 10.5 }}>(you)</span></td>
                  <td>
                    {user?.role === 'admin' ? (
                      <select defaultValue="admin" style={{ margin: 0 }}>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`role-badge ${user?.role || 'faculty'}`}>{user?.role || 'faculty'}</span>
                    )}
                  </td>
                  <td className="mono muted">{new Date().toISOString().split('T')[0]}</td>
                  <td>
                    {user?.role === 'admin' && (
                      <button className="btn danger small">✕</button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {user?.role === 'admin' ? (
          <>
            <div className="rowflex" style={{ marginTop: 10, gap: 10 }}>
              <input type="text" placeholder="Full name" style={{ flex: 1, minWidth: 140 }} value={newUserName} onChange={e => setNewUserName(e.target.value)} />
              <input type="email" placeholder="Email ID" style={{ flex: 1, minWidth: 160 }} value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: 120 }}>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn teal small" onClick={handleAddUser} disabled={addingUser}>
                {addingUser ? 'Adding...' : '+ Add Faculty'}
              </button>
            </div>
            <div className="hint">Add colleagues here before they sign in, so a role is waiting for them. Assign courses using the "Assign Course" button.</div>
          </>
        ) : (
          <div className="hint">
            Only admins can add users or change roles here. Ask your HOD/IQAC coordinator if you need a role change.
          </div>
        )}
      </div>

      {renderCourseTable(`CAY (${cayYear}) — Current Academic Year`, cayCourses)}
      {renderCourseTable(`CAYm1 (${caym1Year}) — CAY minus 1 year`, caym1Courses)}
      {renderCourseTable(`CAYm2 (${caym2Year}) — CAY minus 2 years`, caym2Courses)}

      {/* Assign Course Modal */}
      {assignCourseUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '450px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginTop: 0, borderBottom: 'none' }}>Assign Course Access</h2>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>Faculty Name: {assignCourseUser.name || 'N/A'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Faculty Email: {assignCourseUser.email}</div>
                </div>

                <form onSubmit={handleAssignCourse}>
                    <div className="field" style={{ marginBottom: '24px' }}>
                        <label>Search and Select Course</label>
                        <input 
                            type="text" 
                            placeholder="Type course name or code..." 
                            value={courseSearchQuery}
                            onChange={e => setCourseSearchQuery(e.target.value)}
                            style={{ marginBottom: '8px', padding: '6px 8px', fontSize: 13 }}
                        />
                        <select 
                            value={selectedCourseToAssign}
                            onChange={e => setSelectedCourseToAssign(e.target.value)}
                            required
                            style={{ height: 'auto', maxHeight: '150px' }}
                            size={5}
                        >
                            <option value="" disabled>-- Select a Course --</option>
                            {courses
                                .filter(c => !assignCourseUser.courseAccesses?.find(a => a.courseId === c.id))
                                .filter(c => {
                                    if (!courseSearchQuery) return true;
                                    const q = courseSearchQuery.toLowerCase();
                                    return (c.name && c.name.toLowerCase().includes(q)) || 
                                           (c.code && c.code.toLowerCase().includes(q)) || 
                                           (c.courseId && c.courseId.toLowerCase().includes(q));
                                })
                                .map(c => {
                                    const cName = c.name;
                                    const cCode = c.code || c.courseId;
                                    const displayLabel = cName ? (cCode ? `${cName} (${cCode})` : cName) : (cCode || c.id);
                                    return (
                                        <option key={c.id} value={c.id} style={{ padding: '6px' }}>{displayLabel}</option>
                                    );
                                })}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn" onClick={() => {
                            setAssignCourseUser(null);
                            setSelectedCourseToAssign('');
                            setCourseSearchQuery('');
                        }}>Cancel</button>
                        <button type="submit" className="btn teal">Grant Access</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ── Add Course Modal (Faculty self-assignment from CAY catalog) ── */}
      {showAddCourseModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 15, 30, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddCourseModal(false); }}
        >
          <div style={{
            background: 'var(--bg-card, #fff)',
            borderRadius: '14px',
            width: '620px',
            maxWidth: '96vw',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)',
            border: '1px solid var(--border-color, #e2e8f0)',
            overflow: 'hidden'
          }}>

            {/* Modal Header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
                  Add a Course to Your Dashboard
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted, #64748b)' }}>
                  Browse the Current Academic Year (2026–27) catalog and claim a course.
                </p>
              </div>
              <button
                onClick={() => setShowAddCourseModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted, #64748b)', fontSize: 20, lineHeight: 1,
                  padding: '2px 6px', borderRadius: 6,
                  transition: 'background 0.15s'
                }}
                title="Close"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt, #f1f5f9)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >✕</button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '14px 24px 10px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ position: 'relative' }}>
                <svg
                  width="15" height="15"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--muted, #64748b)', pointerEvents: 'none'
                  }}
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by course name, code, ID or semester…"
                  value={addCourseSearch}
                  onChange={e => setAddCourseSearch(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px 9px 36px',
                    border: '1.5px solid var(--border-color, #cbd5e1)',
                    borderRadius: 8, fontSize: 13.5,
                    color: 'var(--text, #1e293b)',
                    background: 'var(--bg-input, #f8fafc)',
                    outline: 'none',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal, #0d9488)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color, #cbd5e1)'}
                />
              </div>
            </div>

            {/* Catalog List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 16px' }}>
              {addCourseLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <div style={{
                    width: 32, height: 32, border: '3px solid var(--border-color)',
                    borderTopColor: 'var(--teal)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 12px'
                  }} />
                  Loading course catalog…
                </div>
              ) : (() => {
                const q = addCourseSearch.trim().toLowerCase();
                const filtered = catalogCourses.filter(c =>
                  !q ||
                  (c.name && c.name.toLowerCase().includes(q)) ||
                  (c.code && c.code.toLowerCase().includes(q)) ||
                  (c.courseId && c.courseId.toLowerCase().includes(q)) ||
                  (c.semester && c.semester.toLowerCase().includes(q))
                );

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                      {q
                        ? `No courses match "${addCourseSearch}". Try a different name or code.`
                        : 'No courses in the 2026–27 catalog yet. Ask your Admin to add courses.'}
                    </div>
                  );
                }

                return filtered.map(c => {
                  // Check if current user already owns this course
                  const alreadyOwned = c.courseAccesses?.some(a => a.userId === user?.id);
                  // Display assigned faculty info
                  const assignedFaculty = c.facultyName || c.faculty?.name ||
                    c.courseAccesses?.find(a => a.accessLevel === 'owner')?.user?.name ||
                    null;
                  const isAssigning = addCourseAssigning === c.id;

                  return (
                    <div
                      key={c.id || c.courseId}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 14,
                        padding: '12px 14px',
                        marginTop: 8,
                        borderRadius: 10,
                        border: `1.5px solid ${alreadyOwned ? 'rgba(13,148,136,0.3)' : 'var(--border-color, #e2e8f0)'}`,
                        background: alreadyOwned ? 'rgba(13,148,136,0.04)' : 'var(--bg-card, #fff)',
                        transition: 'border-color 0.15s, box-shadow 0.15s'
                      }}
                    >
                      {/* Course Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--navy, #1e3a5f)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {c.code && (
                            <span style={{ fontFamily: 'monospace', background: 'rgba(30,58,138,0.07)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>
                              {c.code}
                            </span>
                          )}
                          <span>AY: {c.academicYear || '2026–27'}</span>
                          {c.semester && <span>Sem: {c.semester}</span>}
                          {c.credits && <span>{c.credits} cr</span>}
                        </div>
                        <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {alreadyOwned ? (
                            <span style={{
                              fontSize: 10.5, padding: '2px 8px', borderRadius: 20,
                              background: 'rgba(13,148,136,0.12)', color: 'var(--teal, #0d9488)',
                              fontWeight: 700, border: '1px solid rgba(13,148,136,0.25)'
                            }}>✓ Already on your dashboard</span>
                          ) : (
                            <span style={{
                              fontSize: 10.5, padding: '2px 8px', borderRadius: 20,
                              background: assignedFaculty
                                ? 'rgba(234,179,8,0.1)'
                                : 'rgba(100,116,139,0.08)',
                              color: assignedFaculty ? '#92400e' : 'var(--muted)',
                              border: `1px solid ${assignedFaculty ? 'rgba(234,179,8,0.25)' : 'var(--border-color)'}`
                            }}>
                              Faculty: {assignedFaculty || 'Unassigned'}
                            </span>
                          )}
                          {c.courseType && (
                            <span style={{
                              fontSize: 10.5, padding: '2px 8px', borderRadius: 20,
                              background: 'rgba(30,58,138,0.07)', color: 'var(--navy)',
                              border: '1px solid rgba(30,58,138,0.12)'
                            }}>{c.courseType}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div style={{ flexShrink: 0 }}>
                        {alreadyOwned ? (
                          <span style={{ fontSize: 20, color: 'var(--teal, #0d9488)' }}>✓</span>
                        ) : (
                          <button
                            className="btn teal small"
                            disabled={!!addCourseAssigning}
                            onClick={() => handleSelfAssign(c.id, c.name)}
                            style={{
                              minWidth: 120,
                              opacity: addCourseAssigning && !isAssigning ? 0.6 : 1,
                              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
                            }}
                          >
                            {isAssigning ? (
                              <>
                                <div style={{
                                  width: 12, height: 12,
                                  border: '2px solid rgba(255,255,255,0.4)',
                                  borderTopColor: '#fff',
                                  borderRadius: '50%',
                                  animation: 'spin 0.7s linear infinite'
                                }} />
                                Adding…
                              </>
                            ) : '✚ Add to My Courses'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                {addCourseLoading ? 'Loading…' : `${catalogCourses.length} course${catalogCourses.length !== 1 ? 's' : ''} in CAY 2026–27 catalog`}
              </span>
              <button
                className="btn"
                onClick={() => setShowAddCourseModal(false)}
              >Cancel</button>
            </div>
          </div>

          {/* Inline keyframe for spinner */}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
