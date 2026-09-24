import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useAcademicYear, normalizeYear } from '../context/AcademicYearContext';
import * as XLSX from 'xlsx';

// ─── Utilities ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const toRoman = (n) => ROMAN[n - 1] || String(n);

const PROGRAM_TYPES = [
  { key: 'UG4', label: 'UG 4-year (B.E. / B.Tech)' },
  { key: 'UG3', label: 'UG 3-year (B.Sc / BCA / B.Com)' },
  { key: 'PG2', label: 'PG 2-year (M.E. / M.Tech / MBA / MCA)' },
  { key: 'PG1', label: 'PG 1-year (M.Sc)' },
  { key: 'PhD', label: 'Ph.D.' },
];

const COURSE_CATEGORIES = [
  'BSC', 'ESC', 'PCC', 'PEC', 'OE', 'HSS', 'AEC', 'LC', 'MDM', 'MINOR', 'HONORS', 'PROJECT', 'SEMINAR', 'AUDIT', 'MOOC'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];

const TABS = [
  { id: 'dept-setup', label: 'Department & Programs', icon: '🏛️' },
  { id: 'builder', label: 'Curriculum Builder', icon: '📚' },
  { id: 'validation', label: 'Validation Dashboard', icon: '✅' },
  { id: 'framework-ug', label: 'UG Credit Framework', icon: '📐' },
  { id: 'framework-pg', label: 'PG Credit Framework', icon: '📐' },
  { id: 'grading', label: 'Grading & Progression', icon: '📊' },
  { id: 'faculty', label: 'Faculty Directory', icon: '👥' },
  { id: 'load-dist', label: 'Load Distribution', icon: '⚖️' },
  { id: 'load-summary', label: 'Load Summary', icon: '📋' },
  { id: 'timetable', label: 'Timetable Board', icon: '📅' },
  { id: 'calendar', label: 'Academic Calendar', icon: '🗓️' },
  { id: 'export', label: 'Export / Print', icon: '📤' },
  { id: 'excel', label: 'Excel Import/Export', icon: '📊' },
];

const DEFAULT_UG_FRAMEWORK = [
  { category: 'BSC', label: 'Basic Science Courses', minCredits: 20 },
  { category: 'ESC', label: 'Engineering Science Courses', minCredits: 22 },
  { category: 'PCC', label: 'Programme Core Courses', minCredits: 40 },
  { category: 'PEC', label: 'Programme Elective Courses', minCredits: 15 },
  { category: 'OE', label: 'Open Elective Courses', minCredits: 9 },
  { category: 'HSS', label: 'Humanities & Social Sciences', minCredits: 6 },
  { category: 'AEC', label: 'Ability Enhancement Courses', minCredits: 4 },
  { category: 'LC', label: 'Language Courses', minCredits: 4 },
  { category: 'PROJ', label: 'Project / Dissertation', minCredits: 12 },
  { category: 'MDM', label: 'Multidisciplinary Minor', minCredits: 20 },
];

const DEFAULT_PG_FRAMEWORK = [
  { category: 'PCC', label: 'Programme Core Courses', minCredits: 24 },
  { category: 'PEC', label: 'Programme Elective Courses', minCredits: 12 },
  { category: 'OE', label: 'Open Elective Courses', minCredits: 6 },
  { category: 'PROJ', label: 'Project / Dissertation', minCredits: 20 },
  { category: 'SEMINAR', label: 'Seminar / Lab', minCredits: 4 },
  { category: 'AUDIT', label: 'Audit / MOOC Courses', minCredits: 4 },
];

const DEFAULT_GRADING = [
  { grade: 'O', points: 10, minPct: 91 },
  { grade: 'A+', points: 9, minPct: 81 },
  { grade: 'A', points: 8, minPct: 71 },
  { grade: 'B+', points: 7, minPct: 61 },
  { grade: 'B', points: 6, minPct: 51 },
  { grade: 'C', points: 5, minPct: 45 },
  { grade: 'P', points: 4, minPct: 40 },
  { grade: 'F', points: 0, minPct: 0 },
];

const DEFAULT_ACADEMIC_YEARS = [
  { id: uid(), label: '2026–27' },
  { id: uid(), label: '2025–26' },
  { id: uid(), label: '2024–25' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AcademicPlanner({ token, user }) {
  const { addToast, confirmAction } = useToast();
  const {
    academicYears: globalAcademicYears,
    setAcademicYears: setGlobalAcademicYears,
    activeYearLabel,
    setActiveYear: setGlobalActiveYear
  } = useAcademicYear();

  const [activeTab, setActiveTab] = useState('dept-setup');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─── Planner State ──────────────────────────────────────────────────────
  const [department, setDepartment] = useState({ name: '' });
  const [programs, setPrograms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [academicYears, setAcademicYears] = useState(globalAcademicYears || DEFAULT_ACADEMIC_YEARS);
  const [versions, setVersions] = useState([]);
  const [framework, setFramework] = useState({ ug: DEFAULT_UG_FRAMEWORK, pg: DEFAULT_PG_FRAMEWORK, grading: DEFAULT_GRADING });
  const [calendar, setCalendar] = useState([]);
  const [activeYear, setActiveYear] = useState(null);

  const API = `http://${window.location.hostname}:3001/api/v2/academic-planner`;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (activeYearLabel && academicYears?.length) {
      const match = academicYears.find(y => normalizeYear(y.label) === normalizeYear(activeYearLabel));
      if (match && match.id !== activeYear) {
        setActiveYear(match.id);
      }
    }
  }, [activeYearLabel, academicYears]);

  // ─── Load from API ─────────────────────────────────────────────────────
  const loadPlan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.programs?.length) setPrograms(data.programs);
        if (data.faculty?.length) setFaculty(data.faculty);
        if (data.timetable?.length) setTimetable(data.timetable);
        if (data.academicYears?.length) {
          setAcademicYears(data.academicYears);
          setGlobalAcademicYears(data.academicYears);
          const activeObj = data.academicYears.find(y => y.isActive) || data.academicYears[0];
          if (activeObj) {
            setActiveYear(activeObj.id);
            setGlobalActiveYear(activeObj.label);
          }
        }
        if (data.versions?.length) setVersions(data.versions);
        if (data.calendar?.length) setCalendar(data.calendar);
        if (data.framework) setFramework(data.framework);
        if (data.department && data.department !== 'default') setDepartment({ name: data.department });
      }
    } catch (e) {
      console.error('Failed to load academic plan:', e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  // ─── Save to API ───────────────────────────────────────────────────────
  const savePlan = useCallback(async (patch = {}) => {
    try {
      setSaving(true);
      const payload = {
        department: department.name || 'default',
        programs, faculty, timetable, academicYears, versions, framework, calendar,
        ...patch
      };
      const res = await fetch(API, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (res.ok) {
        addToast('Plan saved successfully.', 'success');
      } else {
        addToast('Failed to save plan.', 'error');
      }
    } catch (e) {
      addToast('Network error while saving.', 'error');
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, programs, faculty, timetable, academicYears, versions, framework, calendar, token]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading Academic Planner…</div>;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="pagetitle">Academic Planner</h1>
        <p className="pagesub">
          Department-level curriculum design, faculty load management, timetable, and academic calendar — admin only.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="examtabs" style={{ flexWrap: 'wrap', marginBottom: 22, gap: 6 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={activeTab === t.id ? 'active' : ''}
            onClick={() => setActiveTab(t.id)}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Save Bar */}
      <div className="rowflex" style={{ marginBottom: 16 }}>
        <div className="spacer" />
        <button
          className="btn teal small"
          onClick={() => savePlan()}
          disabled={saving}
        >
          {saving ? 'Saving…' : '💾 Save Plan'}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dept-setup' && <TabDeptSetup department={department} setDepartment={setDepartment} programs={programs} setPrograms={setPrograms} academicYears={academicYears} setAcademicYears={setAcademicYears} versions={versions} setVersions={setVersions} activeYear={activeYear} setActiveYear={setActiveYear} addToast={addToast} confirmAction={confirmAction} savePlan={savePlan} />}
      {activeTab === 'builder' && <TabCurriculumBuilder programs={programs} setPrograms={setPrograms} academicYears={academicYears} activeYear={activeYear} addToast={addToast} confirmAction={confirmAction} token={token} />}
      {activeTab === 'validation' && <TabValidation programs={programs} framework={framework} activeYear={activeYear} academicYears={academicYears} />}
      {activeTab === 'framework-ug' && <TabFramework type="ug" framework={framework} setFramework={setFramework} />}
      {activeTab === 'framework-pg' && <TabFramework type="pg" framework={framework} setFramework={setFramework} />}
      {activeTab === 'grading' && <TabGrading framework={framework} setFramework={setFramework} />}
      {activeTab === 'faculty' && <TabFaculty faculty={faculty} setFaculty={setFaculty} addToast={addToast} confirmAction={confirmAction} />}
      {activeTab === 'load-dist' && <TabLoadDist programs={programs} setPrograms={setPrograms} faculty={faculty} academicYears={academicYears} activeYear={activeYear} addToast={addToast} />}
      {activeTab === 'load-summary' && <TabLoadSummary programs={programs} faculty={faculty} activeYear={activeYear} academicYears={academicYears} />}
      {activeTab === 'timetable' && <TabTimetable timetable={timetable} setTimetable={setTimetable} programs={programs} faculty={faculty} addToast={addToast} confirmAction={confirmAction} />}
      {activeTab === 'calendar' && <TabCalendar calendar={calendar} setCalendar={setCalendar} academicYears={academicYears} activeYear={activeYear} addToast={addToast} confirmAction={confirmAction} />}
      {activeTab === 'export' && <TabExport programs={programs} faculty={faculty} timetable={timetable} academicYears={academicYears} department={department} />}
      {activeTab === 'excel' && <TabExcel programs={programs} setPrograms={setPrograms} faculty={faculty} setFaculty={setFaculty} timetable={timetable} setTimetable={setTimetable} addToast={addToast} />}
    </div>
  );
}

// ─── TAB: Department & Programs ───────────────────────────────────────────────
function TabDeptSetup({ department, setDepartment, programs, setPrograms, academicYears, setAcademicYears, versions, setVersions, activeYear, setActiveYear, addToast, confirmAction, savePlan }) {
  const { activeYearLabel, setActiveYear: setGlobalActiveYear, setAcademicYears: setGlobalAcademicYears } = useAcademicYear();
  const [editId, setEditId] = useState(null);
  const [deptName, setDeptName] = useState(department.name);
  const [form, setForm] = useState({ name: '', type: 'UG4', major: '', minor: '', totalTarget: 160, semMin: 20, semMax: 26, divisions: 1 });
  const [newYear, setNewYear] = useState('');

  const handleDeptSave = (e) => {
    e.preventDefault();
    setDepartment({ name: deptName });
    addToast('Department name saved.', 'success');
  };

  const handleProgSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return addToast('Programme title is required.', 'warning');
    const semesters = Array.from({ length: form.type.includes('4') ? 8 : form.type.includes('3') ? 6 : form.type.includes('2') ? 4 : 2 }, (_, i) => ({
      sem: i + 1, courses: []
    }));
    if (editId) {
      setPrograms(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p));
      setEditId(null);
      addToast('Programme updated.', 'success');
    } else {
      setPrograms(prev => [...prev, { id: uid(), ...form, semesters }]);
      addToast('Programme added.', 'success');
    }
    setForm({ name: '', type: 'UG4', major: '', minor: '', totalTarget: 160, semMin: 20, semMax: 26, divisions: 1 });
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({ name: p.name, type: p.type, major: p.major || '', minor: p.minor || '', totalTarget: p.totalTarget || 160, semMin: p.semMin || 20, semMax: p.semMax || 26, divisions: p.divisions || 1 });
  };

  const handleDelete = async (id) => {
    if (!(await confirmAction('Delete this programme and all its curriculum data?'))) return;
    setPrograms(prev => prev.filter(p => p.id !== id));
    addToast('Programme deleted.', 'success');
  };

  const addAcadYear = () => {
    if (!newYear.trim()) return;
    if (academicYears.find(y => normalizeYear(y.label) === normalizeYear(newYear.trim()))) return addToast('Year already exists.', 'warning');
    const y = { id: uid(), label: newYear.trim(), isActive: true };
    const updatedYears = [y, ...academicYears.map(item => ({ ...item, isActive: false }))];
    setAcademicYears(updatedYears);
    setGlobalAcademicYears(updatedYears);
    setActiveYear(y.id);
    setGlobalActiveYear(y.label);
    setNewYear('');
    addToast('Academic year added and marked ACTIVE.', 'success');
    if (savePlan) savePlan({ academicYears: updatedYears });
  };

  return (
    <div>
      {/* Department Name */}
      <div className="card">
        <h2>Department</h2>
        <form onSubmit={handleDeptSave}>
          <div className="field">
            <label>Department name</label>
            <input type="text" value={deptName} onChange={e => setDeptName(e.target.value)} placeholder="e.g. Department of Computer Science & Engineering" />
          </div>
          <button className="btn teal small" type="submit">Save Department</button>
        </form>
      </div>

      {/* Academic Years */}
      <div className="card">
        <h2>Academic Years</h2>
        <div className="rowflex" style={{ marginBottom: 12 }}>
          <input type="text" placeholder="e.g. 2027–28" value={newYear} onChange={e => setNewYear(e.target.value)} style={{ flex: 1, maxWidth: 200 }} />
          <button className="btn teal small" onClick={addAcadYear}>+ Add Year</button>
        </div>
        <div className="tablewrap">
          <table className="data">
            <thead><tr><th className="left">Academic Year</th><th style={{ width: 100 }}>Status</th><th style={{ width: 80 }}></th></tr></thead>
            <tbody>
              {academicYears.map(y => {
                const isItemActive = (y.id && y.id === activeYear) ||
                  y.isActive ||
                  (activeYearLabel && normalizeYear(y.label) === normalizeYear(activeYearLabel));
                return (
                  <tr key={y.id}>
                    <td className="left">{y.label}</td>
                    <td>
                      {isItemActive
                        ? <span className="role-badge admin" style={{ backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, letterSpacing: '0.5px' }}>ACTIVE</span>
                        : (
                          <button
                            className="btn ghost small"
                            onClick={async () => {
                              setActiveYear(y.id);
                              setGlobalActiveYear(y.label || y.id);
                              const updatedYears = academicYears.map(item => ({
                                ...item,
                                isActive: item.id === y.id
                              }));
                              setAcademicYears(updatedYears);
                              setGlobalAcademicYears(updatedYears);
                              addToast(`Academic Year set to ${y.label}`, 'success');
                              if (savePlan) savePlan({ academicYears: updatedYears });
                            }}
                          >
                            Set Active
                          </button>
                        )}
                    </td>
                    <td>
                      <button className="btn danger small" onClick={async () => {
                        if (!(await confirmAction(`Remove academic year ${y.label}?`))) return;
                        const nextYears = academicYears.filter(x => x.id !== y.id);
                        setAcademicYears(nextYears);
                        setGlobalAcademicYears(nextYears);
                        if (activeYear === y.id) setActiveYear(nextYears[0]?.id || null);
                        if (savePlan) savePlan({ academicYears: nextYears });
                      }}>✕</button>
                    </td>
                  </tr>
                );
              })}
              {academicYears.length === 0 && <tr><td colSpan={3} className="muted" style={{ textAlign: 'center', padding: 16 }}>No academic years defined.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Programmes */}
      <div className="card">
        <h2>Programmes <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>({programs.length} added)</span></h2>
        <form onSubmit={handleProgSave} style={{ marginBottom: 16 }}>
          <div className="grid2" style={{ gap: 10, marginBottom: 10 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Programme title</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. B.Tech Computer Engineering" required />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Programme type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {PROGRAM_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Major / Specialization</label>
              <input type="text" value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} placeholder="Computer Engineering" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Minor (optional)</label>
              <input type="text" value={form.minor} onChange={e => setForm(f => ({ ...f, minor: e.target.value }))} placeholder="Data Science" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Total target credits</label>
              <input type="number" value={form.totalTarget} onChange={e => setForm(f => ({ ...f, totalTarget: Number(e.target.value) }))} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Credits per sem (min–max)</label>
              <div className="rowflex">
                <input type="number" value={form.semMin} onChange={e => setForm(f => ({ ...f, semMin: Number(e.target.value) }))} style={{ width: 70 }} placeholder="Min" />
                <span className="muted">–</span>
                <input type="number" value={form.semMax} onChange={e => setForm(f => ({ ...f, semMax: Number(e.target.value) }))} style={{ width: 70 }} placeholder="Max" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Batches / Divisions</label>
              <input type="number" min="1" value={form.divisions} onChange={e => setForm(f => ({ ...f, divisions: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="rowflex">
            <button className="btn teal small" type="submit">{editId ? 'Update Programme' : '+ Add Programme'}</button>
            {editId && <button className="btn ghost small" type="button" onClick={() => { setEditId(null); setForm({ name: '', type: 'UG4', major: '', minor: '', totalTarget: 160, semMin: 20, semMax: 26, divisions: 1 }); }}>Cancel</button>}
          </div>
        </form>

        {programs.length > 0 && (
          <div className="tablewrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="left">Programme</th>
                  <th>Type</th>
                  <th>Major</th>
                  <th>Minor</th>
                  <th>Target Cr.</th>
                  <th>Sem Min</th>
                  <th>Sem Max</th>
                  <th>Divs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {programs.map(p => (
                  <tr key={p.id}>
                    <td className="left" style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="mono">{p.type}</td>
                    <td>{p.major || '—'}</td>
                    <td>{p.minor || '—'}</td>
                    <td className="mono">{p.totalTarget}</td>
                    <td className="mono">{p.semMin}</td>
                    <td className="mono">{p.semMax}</td>
                    <td className="mono">{p.divisions || 1}</td>
                    <td>
                      <div className="rowflex" style={{ gap: 6 }}>
                        <button className="btn ghost small" onClick={() => startEdit(p)}>Edit</button>
                        <button className="btn danger small" onClick={() => handleDelete(p.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {programs.length === 0 && <p className="muted hint">No programmes added yet. Add one above.</p>}
      </div>
    </div>
  );
}

// ─── TAB: Curriculum Builder ──────────────────────────────────────────────────
function TabCurriculumBuilder({ programs, setPrograms, academicYears, activeYear, addToast, confirmAction, reloadData, token }) {
  const [activeProg, setActiveProg] = useState(programs[0]?.id || null);
  const [activeSem, setActiveSem] = useState(1);
  const [builderTab, setBuilderTab] = useState('SEM'); // 'SEM' | 'MINOR' | 'HONORS'
  const [courseForm, setCourseForm] = useState({ title: '', code: '', category: 'PCC', L: 3, T: 1, P: 0, S: 0, credits: 4, electiveSlot: '', optionsCount: 3 });
  const [editCourseId, setEditCourseId] = useState(null);

  useEffect(() => { if (programs.length && !activeProg) setActiveProg(programs[0].id); }, [programs, activeProg]);

  const prog = programs.find(p => p.id === activeProg);
  const semCount = prog ? (prog.semesters?.length || (prog.type?.includes('4') ? 8 : prog.type?.includes('3') ? 6 : 4)) : 0;

  const semCourses = prog?.semesters?.find(s => s.sem === activeSem)?.courses || [];

  const addOrUpdateCourse = async () => {
    if (!courseForm.title.trim()) return addToast('Course title is required.', 'warning');
    if (!courseForm.code.trim()) return addToast('Course code is required.', 'warning');

    // Sync with Live Global Store
    try {
      const activeYearLabel = academicYears.find(y => y.id === activeYear)?.label || "2026-27 (CAY)";
      const payload = {
        courseId: courseForm.code,
        code: courseForm.code,
        name: courseForm.title,
        courseType: courseForm.category,
        semester: toRoman(activeSem),
        credits: courseForm.credits,
        lectureHrs: courseForm.L,
        tutorialHrs: courseForm.T,
        practicalHrs: courseForm.P,
        selfStudyHrs: courseForm.S,
        academicYear: activeYearLabel,
        programName: prog?.name || 'B.Tech'
      };

      const res = await fetch(`http://${window.location.hostname}:3001/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (reloadData) reloadData();
      } else {
        console.warn("Failed to sync course to global store.");
      }
    } catch (e) {
      console.error("Error syncing course to DB:", e);
    }

    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      const sems = (p.semesters || []).map(s => {
        if (s.sem !== activeSem) return s;
        let courses = s.courses || [];
        if (editCourseId) {
          courses = courses.map(c => c.id === editCourseId ? { ...c, ...courseForm } : c);
        } else {
          if (courses.find(c => c.code === courseForm.code)) {
            addToast(`Course code "${courseForm.code}" already exists in this programme.`, 'warning');
            return s;
          }
          const isBasket = ['OE', 'PEC', 'MDM'].includes(courseForm.category);
          let subCourses = [];
          if (isBasket) {
            subCourses = Array.from({ length: courseForm.optionsCount || 1 }).map((_, i) => ({
              id: uid(),
              title: `Option ${i + 1}`,
              code: `${courseForm.code}-OPT${i + 1}`,
              category: courseForm.category,
              L: courseForm.L, T: courseForm.T, P: courseForm.P, S: courseForm.S, credits: courseForm.credits
            }));
          }
          courses = [...courses, { id: uid(), ...courseForm, isBasket, subCourses }];
        }
        return { ...s, courses };
      });
      return { ...p, semesters: sems };
    }));
    setEditCourseId(null);
    setCourseForm({ title: '', code: '', category: 'PCC', L: 3, T: 1, P: 0, S: 0, credits: 4, electiveSlot: '', optionsCount: 3 });
    addToast(editCourseId ? 'Course updated globally.' : 'Course added globally.', 'success');
  };

  const deleteCourse = async (cid) => {
    if (!(await confirmAction('Remove this course from the curriculum?'))) return;

    const courseToDelete = semCourses.find(c => c.id === cid);
    if (courseToDelete && courseToDelete.code) {
      try {
        const res = await fetch(`http://${window.location.hostname}:3001/api/courses/${courseToDelete.code}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok && reloadData) {
          reloadData();
        }
      } catch (e) {
        console.error("Error deleting global course:", e);
      }
    }

    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      return { ...p, semesters: (p.semesters || []).map(s => s.sem === activeSem ? { ...s, courses: s.courses.filter(c => c.id !== cid) } : s) };
    }));
    addToast('Course removed globally.', 'success');
  };

  const startEditCourse = (c) => {
    setEditCourseId(c.id);
    setCourseForm({ title: c.title, code: c.code, category: c.category, L: c.L || 0, T: c.T || 0, P: c.P || 0, S: c.S || 0, credits: c.credits || 0, electiveSlot: c.electiveSlot || '', optionsCount: c.optionsCount || 3 });
  };

  const updateSubCourse = (parentCourseId, subCourseId, field, value) => {
    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      return {
        ...p, semesters: (p.semesters || []).map(s => {
          if (s.sem !== activeSem) return s;
          return {
            ...s, courses: (s.courses || []).map(c => {
              if (c.id !== parentCourseId) return c;
              return { ...c, subCourses: (c.subCourses || []).map(sc => sc.id === subCourseId ? { ...sc, [field]: value } : sc) };
            })
          };
        })
      };
    }));
  };

  const totalCredits = semCourses.reduce((sum, c) => sum + Number(c.credits || 0), 0);

  if (!programs.length) return <div className="section-note">No programmes defined. Go to <strong>Department &amp; Programs</strong> to add a programme first.</div>;

  return (
    <div>
      {/* Programme selector */}
      <div className="card">
        <div className="rowflex" style={{ marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label>Programme</label>
            <select value={activeProg || ''} onChange={e => { setActiveProg(e.target.value); setActiveSem(1); }}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Builder type tabs: SEM / MINOR / HONORS */}
        <div className="examtabs">
          {['SEM', 'MINOR', 'HONORS'].map(t => (
            <button key={t} className={builderTab === t ? 'active' : ''} onClick={() => setBuilderTab(t)}>
              {t === 'SEM' ? '📚 Semester Curriculum' : t === 'MINOR' ? '🔀 Minor Programme' : '⭐ Honors Programme'}
            </button>
          ))}
        </div>
      </div>

      {builderTab === 'SEM' && (
        <div>
          {/* Semester selector */}
          <div className="examtabs" style={{ marginBottom: 16 }}>
            {Array.from({ length: semCount }, (_, i) => i + 1).map(s => (
              <button key={s} className={activeSem === s ? 'active' : ''} onClick={() => setActiveSem(s)}>
                Sem {toRoman(s)}
              </button>
            ))}
          </div>

          {/* Add / Edit course form */}
          <div className="card">
            <h2>{editCourseId ? 'Edit Course' : `Add Course — Semester ${toRoman(activeSem)}`}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <div className="field" style={{ marginBottom: 0, gridColumn: '1/3' }}>
                <label>Course title</label>
                <input type="text" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Data Structures" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Code</label>
                <input type="text" value={courseForm.code} onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))} placeholder="CS301" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Category</label>
                <select value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))}>
                  {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {['L', 'T', 'P', 'S'].map(field => (
                <div key={field} className="field" style={{ marginBottom: 0 }}>
                  <label>{field} hrs</label>
                  <input type="number" min="0" value={courseForm[field]} onChange={e => setCourseForm(f => ({ ...f, [field]: Number(e.target.value) }))} style={{ width: '100%' }} />
                </div>
              ))}
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Credits</label>
                <input type="number" min="0" value={courseForm.credits} onChange={e => setCourseForm(f => ({ ...f, credits: Number(e.target.value) }))} style={{ width: '100%' }} />
              </div>
              {(['OE', 'PEC', 'MDM'].includes(courseForm.category)) && (
                <>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Elective Slot</label>
                    <input type="text" value={courseForm.electiveSlot} onChange={e => setCourseForm(f => ({ ...f, electiveSlot: e.target.value }))} placeholder="OE-1" />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>No. of Options</label>
                    <input type="number" min="1" max="20" value={courseForm.optionsCount} onChange={e => setCourseForm(f => ({ ...f, optionsCount: Number(e.target.value) }))} />
                  </div>
                </>
              )}
            </div>
            <div className="rowflex">
              <button className="btn teal small" onClick={addOrUpdateCourse}>{editCourseId ? 'Update Course' : '+ Add Course'}</button>
              {editCourseId && <button className="btn ghost small" onClick={() => { setEditCourseId(null); setCourseForm({ title: '', code: '', category: 'PCC', L: 3, T: 1, P: 0, S: 0, credits: 4, electiveSlot: '', optionsCount: 3 }); }}>Cancel</button>}
            </div>
          </div>

          {/* Courses table */}
          <div className="card">
            <div className="rowflex" style={{ marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Semester {toRoman(activeSem)} Courses</h2>
              <div className="spacer" />
              <span className="muted" style={{ fontSize: 12 }}>{semCourses.length} course{semCourses.length !== 1 ? 's' : ''} · {totalCredits} credits</span>
            </div>
            {semCourses.length > 0 ? (
              <div className="tablewrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th className="left">Title</th>
                      <th>Code</th>
                      <th>Category</th>
                      <th>L</th><th>T</th><th>P</th><th>S</th>
                      <th>Credits</th>
                      <th>Slot</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {semCourses.map(c => (
                      <tr key={c.id} style={c.isBasket ? { background: 'var(--navy-soft, #e9edf3)' } : {}}>
                        <td className="left">
                          <div style={{ fontWeight: c.isBasket ? 600 : 400 }}>{c.title}</div>
                          {c.isBasket && <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>↳ Basket: {c.subCourses?.length || 0} Options</div>}
                        </td>
                        <td className="mono">{c.code}</td>
                        <td><span className="tag co">{c.category}</span></td>
                        <td className="mono">{c.isBasket ? '—' : (c.L || 0)}</td>
                        <td className="mono">{c.isBasket ? '—' : (c.T || 0)}</td>
                        <td className="mono">{c.isBasket ? '—' : (c.P || 0)}</td>
                        <td className="mono">{c.isBasket ? '—' : (c.S || 0)}</td>
                        <td className="mono" style={{ fontWeight: 700 }}>{c.credits}</td>
                        <td className="muted">{c.electiveSlot || '—'}</td>
                        <td>
                          <div className="rowflex" style={{ gap: 6 }}>
                            <button className="btn ghost small" onClick={() => startEditCourse(c)}>Edit</button>
                            <button className="btn danger small" onClick={() => deleteCourse(c.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="left" colSpan={7} style={{ fontWeight: 700, fontSize: 12 }}>Total Semester Credits</td>
                      <td className="mono" style={{ fontWeight: 700 }}>{totalCredits}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : <p className="muted hint">No courses in Semester {toRoman(activeSem)} yet. Add one above.</p>}
          </div>

          {/* Dynamic Sub-Tables for Baskets */}
          {semCourses.filter(c => c.isBasket).map(basket => (
            <div className="card" key={`basket-${basket.id}`} style={{ borderLeft: '4px solid var(--teal)' }}>
              <div className="rowflex" style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Semester {toRoman(activeSem)} — {basket.title} Options</h3>
                <div className="spacer" />
                <span className="tag co">{basket.category}</span>
              </div>
              <p className="hint">Define the individual options available within this elective basket. Note: Total semester credits rely on the parent basket ({basket.credits} cr).</p>
              <div className="tablewrap" style={{ marginTop: 12 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th className="left">Option Title</th>
                      <th>Code</th>
                      <th>L</th><th>T</th><th>P</th><th>S</th>
                      <th>Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(basket.subCourses || []).map((sc, idx) => (
                      <tr key={sc.id}>
                        <td className="left">
                          <input type="text" value={sc.title} onChange={e => updateSubCourse(basket.id, sc.id, 'title', e.target.value)} style={{ width: '100%' }} />
                        </td>
                        <td>
                          <input type="text" value={sc.code} onChange={e => updateSubCourse(basket.id, sc.id, 'code', e.target.value)} style={{ width: 80, textAlign: 'center' }} className="mono" />
                        </td>
                        <td><input type="number" min="0" value={sc.L} onChange={e => updateSubCourse(basket.id, sc.id, 'L', Number(e.target.value))} style={{ width: 40, textAlign: 'center' }} /></td>
                        <td><input type="number" min="0" value={sc.T} onChange={e => updateSubCourse(basket.id, sc.id, 'T', Number(e.target.value))} style={{ width: 40, textAlign: 'center' }} /></td>
                        <td><input type="number" min="0" value={sc.P} onChange={e => updateSubCourse(basket.id, sc.id, 'P', Number(e.target.value))} style={{ width: 40, textAlign: 'center' }} /></td>
                        <td><input type="number" min="0" value={sc.S} onChange={e => updateSubCourse(basket.id, sc.id, 'S', Number(e.target.value))} style={{ width: 40, textAlign: 'center' }} /></td>
                        <td><input type="number" min="0" value={sc.credits} onChange={e => updateSubCourse(basket.id, sc.id, 'credits', Number(e.target.value))} style={{ width: 40, textAlign: 'center' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {(builderTab === 'MINOR' || builderTab === 'HONORS') && (
        <KindSectionBuilder kind={builderTab} prog={prog} setPrograms={setPrograms} activeProg={activeProg} addToast={addToast} confirmAction={confirmAction} />
      )}
    </div>
  );
}

// ─── Minor/Honors section ──────────────────────────────────────────────────────
function KindSectionBuilder({ kind, prog, setPrograms, activeProg, addToast, confirmAction }) {
  const key = kind === 'MINOR' ? 'minorCourses' : 'honorsCourses';
  const courses = prog?.[key] || [];
  const [form, setForm] = useState({ title: '', code: '', category: kind === 'MINOR' ? 'MINOR' : 'HONORS', L: 3, T: 0, P: 0, S: 0, credits: 3 });
  const [editId, setEditId] = useState(null);

  const save = () => {
    if (!form.title.trim() || !form.code.trim()) return addToast('Title and code are required.', 'warning');
    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      let list = p[key] || [];
      if (editId) {
        list = list.map(c => c.id === editId ? { ...c, ...form } : c);
      } else {
        if (list.find(c => c.code === form.code)) return addToast(`Code "${form.code}" already used.`, 'warning') || p;
        list = [...list, { id: uid(), ...form }];
      }
      return { ...p, [key]: list };
    }));
    setEditId(null);
    setForm({ title: '', code: '', category: kind === 'MINOR' ? 'MINOR' : 'HONORS', L: 3, T: 0, P: 0, S: 0, credits: 3 });
    addToast(editId ? 'Updated.' : 'Added.', 'success');
  };

  return (
    <div className="card">
      <h2>{kind === 'MINOR' ? 'Minor' : 'Honors'} Programme Courses</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="field" style={{ marginBottom: 0, gridColumn: '1/3' }}>
          <label>Title</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Course Title" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Code</label>
          <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="CS-MN1" />
        </div>
        {['L', 'T', 'P', 'S'].map(k => (
          <div key={k} className="field" style={{ marginBottom: 0 }}>
            <label>{k} hrs</label>
            <input type="number" min="0" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))} />
          </div>
        ))}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Credits</label>
          <input type="number" min="0" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="rowflex" style={{ marginBottom: 16 }}>
        <button className="btn teal small" onClick={save}>{editId ? 'Update' : '+ Add'}</button>
        {editId && <button className="btn ghost small" onClick={() => { setEditId(null); setForm({ title: '', code: '', category: kind === 'MINOR' ? 'MINOR' : 'HONORS', L: 3, T: 0, P: 0, S: 0, credits: 3 }); }}>Cancel</button>}
      </div>
      {courses.length > 0 ? (
        <div className="tablewrap">
          <table className="data">
            <thead>
              <tr><th className="left">Title</th><th>Code</th><th>L</th><th>T</th><th>P</th><th>S</th><th>Credits</th><th></th></tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td className="left">{c.title}</td>
                  <td className="mono">{c.code}</td>
                  <td className="mono">{c.L || 0}</td><td className="mono">{c.T || 0}</td>
                  <td className="mono">{c.P || 0}</td><td className="mono">{c.S || 0}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{c.credits}</td>
                  <td>
                    <div className="rowflex" style={{ gap: 6 }}>
                      <button className="btn ghost small" onClick={() => { setEditId(c.id); setForm({ title: c.title, code: c.code, category: c.category, L: c.L || 0, T: c.T || 0, P: c.P || 0, S: c.S || 0, credits: c.credits || 0 }); }}>Edit</button>
                      <button className="btn danger small" onClick={async () => { if (!(await confirmAction('Delete?'))) return; setPrograms(prev => prev.map(p => p.id !== activeProg ? p : { ...p, [key]: (p[key] || []).filter(x => x.id !== c.id) })); }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="muted hint">No {kind.toLowerCase()} courses added yet.</p>}
    </div>
  );
}

// ─── TAB: Validation Dashboard ─────────────────────────────────────────────────
function TabValidation({ programs, framework, activeYear, academicYears }) {
  const activeYearLabel = academicYears.find(y => y.id === activeYear)?.label || 'N/A';

  const validate = (prog) => {
    const issues = [];
    const fw = framework?.ug || DEFAULT_UG_FRAMEWORK;
    const allCourses = (prog.semesters || []).flatMap(s => s.courses || []);
    const totalCredits = allCourses.reduce((sum, c) => sum + Number(c.credits || 0), 0);
    if (totalCredits < prog.totalTarget) {
      issues.push({ type: 'warning', msg: `Total credits (${totalCredits}) is below target (${prog.totalTarget}).` });
    }
    fw.forEach(row => {
      const catCredits = allCourses.filter(c => c.category === row.category).reduce((sum, c) => sum + Number(c.credits || 0), 0);
      if (catCredits < row.minCredits) {
        issues.push({ type: 'warning', msg: `${row.label} (${row.category}): ${catCredits} credits — need at least ${row.minCredits}.` });
      }
    });
    (prog.semesters || []).forEach(s => {
      const semCr = (s.courses || []).reduce((sum, c) => sum + Number(c.credits || 0), 0);
      if (semCr < prog.semMin) issues.push({ type: 'info', msg: `Sem ${toRoman(s.sem)}: ${semCr} credits — below minimum ${prog.semMin}.` });
      if (semCr > prog.semMax) issues.push({ type: 'error', msg: `Sem ${toRoman(s.sem)}: ${semCr} credits — exceeds maximum ${prog.semMax}.` });
    });
    return { totalCredits, issues };
  };

  return (
    <div>
      <div className="section-note">Validation results for <strong>{activeYearLabel}</strong>. Fix issues in the <strong>Curriculum Builder</strong> tab.</div>
      {programs.length === 0 && <p className="muted hint">No programmes to validate.</p>}
      {programs.map(prog => {
        const { totalCredits, issues } = validate(prog);
        const ok = issues.filter(i => i.type === 'error').length === 0;
        return (
          <div className="card" key={prog.id} style={{ borderLeft: `4px solid ${ok ? 'var(--green)' : 'var(--red)'}` }}>
            <div className="rowflex">
              <h2 style={{ margin: 0 }}>{prog.name}</h2>
              <div className="spacer" />
              <span className={ok ? 'badge-ok' : 'badge-no'}>{ok ? '✓ Valid' : '✗ Issues Found'}</span>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 12 }}>
              Total: {totalCredits} / {prog.totalTarget} credits · {(prog.semesters || []).length} semesters
            </div>

            {/* Credit breakdown by category */}
            <div className="tablewrap" style={{ marginBottom: 12 }}>
              <table className="data">
                <thead><tr><th className="left">Category</th><th>Min Required</th><th>Actual Credits</th><th>Status</th></tr></thead>
                <tbody>
                  {(framework?.ug || DEFAULT_UG_FRAMEWORK).map(row => {
                    const actual = (prog.semesters || []).flatMap(s => s.courses || []).filter(c => c.category === row.category).reduce((sum, c) => sum + Number(c.credits || 0), 0);
                    const pass = actual >= row.minCredits;
                    return (
                      <tr key={row.category}>
                        <td className="left">{row.label} ({row.category})</td>
                        <td className="mono">{row.minCredits}</td>
                        <td className="mono">{actual}</td>
                        <td>{pass ? <span className="badge-ok">✓ OK</span> : <span className="badge-no">✗ Short by {row.minCredits - actual}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {issues.length > 0 && (
              <div>
                {issues.map((iss, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, fontSize: 12.5 }}>
                    <span>{iss.type === 'error' ? '🔴' : iss.type === 'warning' ? '🟡' : '🔵'}</span>
                    <span>{iss.msg}</span>
                  </div>
                ))}
              </div>
            )}
            {issues.length === 0 && <p className="muted" style={{ fontSize: 12 }}>No issues found. Curriculum meets all requirements.</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── TAB: Credit Framework (shared for UG & PG) ───────────────────────────────
function TabFramework({ type, framework, setFramework }) {
  const key = type; // 'ug' or 'pg'
  const rows = framework?.[key] || (type === 'ug' ? DEFAULT_UG_FRAMEWORK : DEFAULT_PG_FRAMEWORK);

  const updateRow = (i, field, val) => {
    const updated = rows.map((r, idx) => idx === i ? { ...r, [field]: field === 'minCredits' ? Number(val) : val } : r);
    setFramework(f => ({ ...f, [key]: updated }));
  };

  const addRow = () => setFramework(f => ({ ...f, [key]: [...(f[key] || []), { category: '', label: '', minCredits: 0 }] }));
  const delRow = (i) => setFramework(f => ({ ...f, [key]: (f[key] || []).filter((_, idx) => idx !== i) }));

  return (
    <div className="card">
      <h2>{type.toUpperCase()} Credit Framework Reference</h2>
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
        Define the minimum credit requirements per course category for {type === 'ug' ? 'undergraduate (UG)' : 'postgraduate (PG)'} programmes per NEP 2020 (Maharashtra).
      </p>
      <div className="tablewrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Category Code</th>
              <th className="left">Category Label</th>
              <th style={{ width: 120 }}>Min Credits</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <input type="text" value={row.category} onChange={e => updateRow(i, 'category', e.target.value)} style={{ width: '100%', fontFamily: 'var(--mono)', textTransform: 'uppercase' }} />
                </td>
                <td>
                  <input type="text" value={row.label} onChange={e => updateRow(i, 'label', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td>
                  <input type="number" min="0" value={row.minCredits} onChange={e => updateRow(i, 'minCredits', e.target.value)} style={{ width: '100%' }} />
                </td>
                <td>
                  <button className="btn danger small" onClick={() => delRow(i)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn ghost small" style={{ marginTop: 10 }} onClick={addRow}>+ Add Row</button>
    </div>
  );
}

// ─── TAB: Grading & Progression ───────────────────────────────────────────────
function TabGrading({ framework, setFramework }) {
  const rows = framework?.grading || DEFAULT_GRADING;

  const updateRow = (i, field, val) => {
    const updated = rows.map((r, idx) => idx === i ? { ...r, [field]: field === 'minPct' || field === 'points' ? Number(val) : val } : r);
    setFramework(f => ({ ...f, grading: updated }));
  };

  return (
    <div className="card">
      <h2>Grading Scale</h2>
      <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>Edit the grading scale used across all programmes. Changes apply to the Validation Dashboard.</p>
      <div className="tablewrap">
        <table className="data">
          <thead><tr><th>Grade</th><th>Grade Points</th><th>Min % Marks</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input type="text" value={r.grade} onChange={e => updateRow(i, 'grade', e.target.value)} style={{ width: 60, textAlign: 'center', fontFamily: 'var(--mono)' }} /></td>
                <td><input type="number" min="0" max="10" value={r.points} onChange={e => updateRow(i, 'points', e.target.value)} style={{ width: 70 }} /></td>
                <td><input type="number" min="0" max="100" value={r.minPct} onChange={e => updateRow(i, 'minPct', e.target.value)} style={{ width: 80 }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hint" style={{ marginTop: 10 }}>Rows are saved as part of the framework when you click "Save Plan" above.</div>
    </div>
  );
}

// ─── TAB: Faculty Directory ───────────────────────────────────────────────────
function TabFaculty({ faculty, setFaculty, addToast, confirmAction }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', designation: '', specialization: '', maxLoad: 16, email: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return addToast('Name is required.', 'warning');
    if (editId) {
      setFaculty(prev => prev.map(f => f.id === editId ? { ...f, ...form } : f));
      setEditId(null);
      addToast('Faculty updated.', 'success');
    } else {
      if (faculty.find(f => f.name.toLowerCase() === form.name.trim().toLowerCase())) return addToast('A faculty member with this name already exists.', 'warning');
      setFaculty(prev => [...prev, { id: uid(), ...form }]);
      addToast('Faculty added.', 'success');
    }
    setForm({ name: '', designation: '', specialization: '', maxLoad: 16, email: '' });
  };

  const startEdit = (f) => {
    setEditId(f.id);
    setForm({ name: f.name, designation: f.designation || '', specialization: f.specialization || '', maxLoad: f.maxLoad || 16, email: f.email || '' });
  };

  const handleDelete = async (id) => {
    if (!(await confirmAction('Delete this faculty member? Their assignments will also be removed.'))) return;
    setFaculty(prev => prev.filter(f => f.id !== id));
    addToast('Faculty deleted.', 'success');
  };

  return (
    <div>
      <div className="card">
        <h2>{editId ? 'Edit Faculty' : 'Add Faculty'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid2">
            <div className="field">
              <label>Full name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. A. B. Patil" required />
            </div>
            <div className="field">
              <label>Designation</label>
              <input type="text" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="Assistant Professor" />
            </div>
            <div className="field">
              <label>Specialisation</label>
              <input type="text" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} placeholder="Data Structures, DBMS" />
            </div>
            <div className="field">
              <label>Email (optional)</label>
              <input type="text" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="dr.patil@college.edu" />
            </div>
            <div className="field">
              <label>Max load (hrs/week)</label>
              <input type="number" min="1" max="40" value={form.maxLoad} onChange={e => setForm(f => ({ ...f, maxLoad: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="rowflex">
            <button className="btn teal small" type="submit">{editId ? 'Update Faculty' : '+ Add Faculty'}</button>
            {editId && <button className="btn ghost small" type="button" onClick={() => { setEditId(null); setForm({ name: '', designation: '', specialization: '', maxLoad: 16, email: '' }); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Faculty Directory <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>({faculty.length} members)</span></h2>
        {faculty.length > 0 ? (
          <div className="tablewrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="left">Name</th>
                  <th>Designation</th>
                  <th>Specialisation</th>
                  <th>Email</th>
                  <th>Max Load/wk</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f.id}>
                    <td className="left" style={{ fontWeight: 600 }}>{f.name}</td>
                    <td>{f.designation || '—'}</td>
                    <td>{f.specialization || '—'}</td>
                    <td className="muted">{f.email || '—'}</td>
                    <td className="mono">{f.maxLoad} hrs</td>
                    <td>
                      <div className="rowflex" style={{ gap: 6 }}>
                        <button className="btn ghost small" onClick={() => startEdit(f)}>Edit</button>
                        <button className="btn danger small" onClick={() => handleDelete(f.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted hint">No faculty added yet. Add faculty above.</p>}
      </div>
    </div>
  );
}

// ─── TAB: Load Distribution ───────────────────────────────────────────────────
function TabLoadDist({ programs, setPrograms, faculty, academicYears, activeYear, addToast }) {
  const [activeProg, setActiveProg] = useState(programs[0]?.id || null);
  const [activeSem, setActiveSem] = useState(1);
  const [filterSemType, setFilterSemType] = useState('all'); // 'all' | 'odd' | 'even'

  useEffect(() => { if (programs.length && !activeProg) setActiveProg(programs[0].id); }, [programs, activeProg]);

  const prog = programs.find(p => p.id === activeProg);
  const semCount = prog ? (prog.semesters?.length || 8) : 0;

  const filteredSems = Array.from({ length: semCount }, (_, i) => i + 1).filter(s => {
    if (filterSemType === 'odd') return s % 2 !== 0;
    if (filterSemType === 'even') return s % 2 === 0;
    return true;
  });

  const semCourses = prog?.semesters?.find(s => s.sem === activeSem)?.courses || [];

  const assignFaculty = (courseId, field, value) => {
    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      return {
        ...p,
        semesters: (p.semesters || []).map(s => {
          if (s.sem !== activeSem) return s;
          return {
            ...s,
            courses: s.courses.map(c => {
              if (c.id !== courseId) return c;
              const assignments = c.assignments || [];
              if (field === 'facultyId') {
                const existing = assignments.find(a => a.facultyId === value);
                if (existing) return c;
                return { ...c, assignments: [...assignments, { facultyId: value, L: 0, T: 0, P: 0 }] };
              }
              return c;
            })
          };
        })
      };
    }));
  };

  const updateAssignment = (courseId, facultyId, field, value) => {
    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      return {
        ...p,
        semesters: (p.semesters || []).map(s => {
          if (s.sem !== activeSem) return s;
          return {
            ...s,
            courses: s.courses.map(c => {
              if (c.id !== courseId) return c;
              return {
                ...c,
                assignments: (c.assignments || []).map(a =>
                  a.facultyId === facultyId ? { ...a, [field]: Number(value) } : a
                )
              };
            })
          };
        })
      };
    }));
  };

  const removeAssignment = (courseId, facultyId) => {
    setPrograms(prev => prev.map(p => {
      if (p.id !== activeProg) return p;
      return {
        ...p,
        semesters: (p.semesters || []).map(s => {
          if (s.sem !== activeSem) return s;
          return { ...s, courses: s.courses.map(c => c.id !== courseId ? c : { ...c, assignments: (c.assignments || []).filter(a => a.facultyId !== facultyId) }) };
        })
      };
    }));
  };

  if (!programs.length) return <div className="section-note">No programmes defined. Add programmes first.</div>;
  if (!faculty.length) return <div className="section-note">No faculty in directory. Add faculty in the <strong>Faculty Directory</strong> tab.</div>;

  return (
    <div>
      <div className="card">
        <div className="rowflex" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Programme</label>
            <select value={activeProg || ''} onChange={e => { setActiveProg(e.target.value); setActiveSem(1); }}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Semester type</label>
            <select value={filterSemType} onChange={e => setFilterSemType(e.target.value)}>
              <option value="all">All Semesters</option>
              <option value="odd">Odd Semesters (I, III, V, VII)</option>
              <option value="even">Even Semesters (II, IV, VI, VIII)</option>
            </select>
          </div>
        </div>

        <div className="examtabs">
          {filteredSems.map(s => (
            <button key={s} className={activeSem === s ? 'active' : ''} onClick={() => setActiveSem(s)}>
              Sem {toRoman(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Load Distribution — Semester {toRoman(activeSem)}</h2>
        {semCourses.length === 0
          ? <p className="muted hint">No courses in Semester {toRoman(activeSem)}. Add courses via Curriculum Builder.</p>
          : semCourses.map(c => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 14 }}>
              <div className="rowflex" style={{ marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{c.title}</span>
                  <span className="mono muted" style={{ fontSize: 11, marginLeft: 8 }}>{c.code}</span>
                  <span className="tag co" style={{ marginLeft: 8 }}>{c.category}</span>
                </div>
                <div className="spacer" />
                <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
                  <label style={{ marginBottom: 4 }}>Assign faculty</label>
                  <select onChange={e => { if (e.target.value) { assignFaculty(c.id, 'facultyId', e.target.value); e.target.value = ''; } }} defaultValue="">
                    <option value="">Select faculty to assign…</option>
                    {faculty.filter(f => !(c.assignments || []).find(a => a.facultyId === f.id)).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(c.assignments || []).length > 0 && (
                <div className="tablewrap">
                  <table className="data">
                    <thead><tr><th className="left">Faculty</th><th>L hrs</th><th>T hrs</th><th>P hrs</th><th>Total</th><th></th></tr></thead>
                    <tbody>
                      {c.assignments.map(a => {
                        const fac = faculty.find(f => f.id === a.facultyId);
                        return (
                          <tr key={a.facultyId}>
                            <td className="left">{fac?.name || 'Unknown'}</td>
                            {['L', 'T', 'P'].map(field => (
                              <td key={field}>
                                <input type="number" min="0" value={a[field] || 0} onChange={e => updateAssignment(c.id, a.facultyId, field, e.target.value)} style={{ width: 60 }} />
                              </td>
                            ))}
                            <td className="mono" style={{ fontWeight: 700 }}>{(a.L || 0) + (a.T || 0) + (a.P || 0)}</td>
                            <td><button className="btn danger small" onClick={() => removeAssignment(c.id, a.facultyId)}>✕</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {(c.assignments || []).length === 0 && <p className="muted" style={{ fontSize: 12, margin: 0 }}>No faculty assigned yet.</p>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── TAB: Load Summary ─────────────────────────────────────────────────────────
function TabLoadSummary({ programs, faculty, activeYear, academicYears }) {
  const activeYearLabel = academicYears.find(y => y.id === activeYear)?.label || 'All Years';

  // Aggregate load per faculty across all programs/semesters
  const summary = faculty.map(f => {
    let totalL = 0, totalT = 0, totalP = 0;
    const courses = [];
    programs.forEach(prog => {
      (prog.semesters || []).forEach(s => {
        (s.courses || []).forEach(c => {
          const a = (c.assignments || []).find(x => x.facultyId === f.id);
          if (a) {
            totalL += a.L || 0;
            totalT += a.T || 0;
            totalP += a.P || 0;
            courses.push({ prog: prog.name, sem: s.sem, course: c.title, L: a.L || 0, T: a.T || 0, P: a.P || 0 });
          }
        });
      });
    });
    const total = totalL + totalT + totalP;
    return { ...f, totalL, totalT, totalP, total, courses };
  });

  return (
    <div>
      <div className="section-note">Load summary for <strong>{activeYearLabel}</strong>. Faculty are shown as Over/Under-loaded based on their Max Load setting.</div>
      <div className="card">
        <h2>Faculty Load Summary</h2>
        {summary.length === 0 ? <p className="muted hint">No faculty in directory.</p> : (
          <div className="tablewrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="left">Faculty</th>
                  <th>Designation</th>
                  <th>Max Load</th>
                  <th>L hrs</th>
                  <th>T hrs</th>
                  <th>P hrs</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.map(f => {
                  const pct = f.maxLoad > 0 ? Math.round((f.total / f.maxLoad) * 100) : 0;
                  const ok = f.total <= f.maxLoad;
                  return (
                    <tr key={f.id}>
                      <td className="left" style={{ fontWeight: 600 }}>{f.name}</td>
                      <td>{f.designation || '—'}</td>
                      <td className="mono">{f.maxLoad}</td>
                      <td className="mono">{f.totalL}</td>
                      <td className="mono">{f.totalT}</td>
                      <td className="mono">{f.totalP}</td>
                      <td className="mono" style={{ fontWeight: 700 }}>{f.total}</td>
                      <td>
                        {f.total === 0
                          ? <span className="muted" style={{ fontSize: 11 }}>Unassigned</span>
                          : ok
                            ? <span className="badge-ok">✓ {pct}%</span>
                            : <span className="badge-no">⚠ {pct}% (over)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed breakdown */}
      {summary.filter(f => f.courses.length > 0).map(f => (
        <div className="card" key={f.id}>
          <h2>{f.name} — Detailed Assignment</h2>
          <div className="tablewrap">
            <table className="data">
              <thead><tr><th className="left">Programme</th><th>Sem</th><th className="left">Course</th><th>L</th><th>T</th><th>P</th><th>Total</th></tr></thead>
              <tbody>
                {f.courses.map((c, i) => (
                  <tr key={i}>
                    <td className="left muted">{c.prog}</td>
                    <td className="mono">{toRoman(c.sem)}</td>
                    <td className="left">{c.course}</td>
                    <td className="mono">{c.L}</td>
                    <td className="mono">{c.T}</td>
                    <td className="mono">{c.P}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{c.L + c.T + c.P}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="left" style={{ fontSize: 12 }}>TOTAL</td>
                  <td className="mono">{f.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB: Timetable Board ──────────────────────────────────────────────────────
function TabTimetable({ timetable, setTimetable, programs, faculty, addToast, confirmAction }) {
  const [activeProg, setActiveProg] = useState(programs[0]?.id || null);
  const [activeSem, setActiveSem] = useState(1);
  const [activeDivision, setActiveDivision] = useState('A');
  const [selected, setSelected] = useState(null); // { day, period }
  const [assignForm, setAssignForm] = useState({ courseId: '', facultyId: '', type: 'L' });

  useEffect(() => { if (programs.length && !activeProg) setActiveProg(programs[0].id); }, [programs, activeProg]);

  const prog = programs.find(p => p.id === activeProg);
  const semCourses = prog?.semesters?.find(s => s.sem === activeSem)?.courses || [];
  const divisions = Array.from({ length: prog?.divisions || 1 }, (_, i) => String.fromCharCode(65 + i));

  const getCell = (day, period) => timetable.find(t => t.progId === activeProg && t.sem === activeSem && t.division === activeDivision && t.day === day && t.period === period);

  const assignSlot = () => {
    if (!selected) return;
    if (!assignForm.courseId) return addToast('Select a course.', 'warning');
    const { day, period } = selected;
    const existing = getCell(day, period);
    const entry = { id: uid(), progId: activeProg, sem: activeSem, division: activeDivision, day, period, ...assignForm };
    if (existing) {
      setTimetable(prev => prev.map(t => t.id === existing.id ? { ...t, ...assignForm } : t));
    } else {
      setTimetable(prev => [...prev, entry]);
    }
    setSelected(null);
    addToast('Slot assigned.', 'success');
  };

  const clearSlot = async (day, period) => {
    if (!(await confirmAction('Clear this timetable slot?'))) return;
    setTimetable(prev => prev.filter(t => !(t.progId === activeProg && t.sem === activeSem && t.division === activeDivision && t.day === day && t.period === period)));
    addToast('Slot cleared.', 'success');
  };

  if (!programs.length) return <div className="section-note">No programmes defined. Add programmes first.</div>;

  const getCourseLabel = (id) => { const c = semCourses.find(x => x.id === id); return c ? `${c.code} – ${c.title.slice(0, 20)}` : id; };
  const getFacultyLabel = (id) => { const f = faculty.find(x => x.id === id); return f ? f.name.split(' ').slice(-1)[0] : id; };

  return (
    <div>
      <div className="card">
        <div className="rowflex" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Programme</label>
            <select value={activeProg || ''} onChange={e => { setActiveProg(e.target.value); setActiveSem(1); setSelected(null); }}>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Division</label>
            <select value={activeDivision} onChange={e => setActiveDivision(e.target.value)}>
              {divisions.map(d => <option key={d} value={d}>Division {d}</option>)}
            </select>
          </div>
        </div>
        <div className="examtabs">
          {Array.from({ length: prog?.semesters?.length || 8 }, (_, i) => i + 1).map(s => (
            <button key={s} className={activeSem === s ? 'active' : ''} onClick={() => { setActiveSem(s); setSelected(null); }}>
              Sem {toRoman(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="card">
        <h2>Timetable — Sem {toRoman(activeSem)}, Div {activeDivision}</h2>
        <div className="tablewrap">
          <table className="data" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>Day \ Period</th>
                {PERIODS.map(p => <th key={p} style={{ minWidth: 90 }}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td style={{ fontWeight: 700, fontSize: 11.5, background: '#eef0e9' }}>{day.slice(0, 3)}</td>
                  {PERIODS.map(period => {
                    const cell = getCell(day, period);
                    const isSelected = selected?.day === day && selected?.period === period;
                    return (
                      <td
                        key={period}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'var(--teal-soft)' : cell ? 'var(--amber-soft)' : '',
                          border: isSelected ? '2px solid var(--teal)' : '',
                          minHeight: 52, padding: 6, verticalAlign: 'top'
                        }}
                        onClick={() => setSelected({ day, period })}
                        onDoubleClick={() => cell && clearSlot(day, period)}
                        title="Click to assign. Double-click to clear."
                      >
                        {cell ? (
                          <div style={{ fontSize: 10.5 }}>
                            <div style={{ fontWeight: 700, color: 'var(--amber)' }}>{getCourseLabel(cell.courseId)}</div>
                            <div className="muted">{getFacultyLabel(cell.facultyId)} · {cell.type}</div>
                          </div>
                        ) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint">Click a cell to select it, then assign below. Double-click a filled cell to clear it.</p>
      </div>

      {/* Assignment Panel */}
      {selected && (
        <div className="card" style={{ borderLeft: '4px solid var(--teal)' }}>
          <h2>Assign Slot — {selected.day}, {selected.period}</h2>
          <div className="grid2">
            <div className="field">
              <label>Course</label>
              <select value={assignForm.courseId} onChange={e => setAssignForm(f => ({ ...f, courseId: e.target.value }))}>
                <option value="">Select course…</option>
                {semCourses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.title}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Faculty</label>
              <select value={assignForm.facultyId} onChange={e => setAssignForm(f => ({ ...f, facultyId: e.target.value }))}>
                <option value="">Select faculty…</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Type</label>
              <select value={assignForm.type} onChange={e => setAssignForm(f => ({ ...f, type: e.target.value }))}>
                <option value="L">L – Lecture</option>
                <option value="T">T – Tutorial</option>
                <option value="P">P – Practical</option>
              </select>
            </div>
          </div>
          <div className="rowflex">
            <button className="btn teal small" onClick={assignSlot}>Assign Slot</button>
            <button className="btn ghost small" onClick={() => setSelected(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB: Academic Calendar ───────────────────────────────────────────────────
const EVENT_TYPES = ['Holiday', 'Exam - MSE', 'Exam - ESE', 'Exam - Practical', 'Workshop', 'Event', 'Guest Lecture', 'Other'];

function TabCalendar({ calendar, setCalendar, academicYears, activeYear, addToast, confirmAction }) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [form, setForm] = useState({ date: '', title: '', type: 'Holiday', description: '' });
  const [editId, setEditId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date || !form.title.trim()) return addToast('Date and title are required.', 'warning');
    if (editId) {
      setCalendar(prev => prev.map(ev => ev.id === editId ? { ...ev, ...form } : ev));
      setEditId(null);
      addToast('Event updated.', 'success');
    } else {
      setCalendar(prev => [...prev, { id: uid(), ...form }]);
      addToast('Event added.', 'success');
    }
    setForm({ date: '', title: '', type: 'Holiday', description: '' });
    setShowAdd(false);
  };

  const startEdit = (ev) => {
    setEditId(ev.id);
    setForm({ date: ev.date, title: ev.title, type: ev.type, description: ev.description || '' });
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    if (!(await confirmAction('Remove this event?'))) return;
    setCalendar(prev => prev.filter(ev => ev.id !== id));
    addToast('Event removed.', 'success');
  };

  // Calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const monthEvents = calendar.filter(ev => {
    const d = new Date(ev.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
  const getEventsForDay = (day) => monthEvents.filter(ev => new Date(ev.date).getDate() === day);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const EVENT_COLORS = { 'Holiday': 'var(--red)', 'Exam - MSE': 'var(--amber)', 'Exam - ESE': 'var(--amber)', 'Exam - Practical': 'var(--amber)', 'Workshop': 'var(--teal)', 'Event': 'var(--navy)', 'Guest Lecture': 'var(--teal)', 'Other': 'var(--muted)' };

  return (
    <div>
      {/* Controls */}
      <div className="card">
        <div className="rowflex" style={{ flexWrap: 'wrap', gap: 12 }}>
          <button className="btn ghost small" onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }}>← Prev</button>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{monthLabel}</span>
          <button className="btn ghost small" onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }}>Next →</button>
          <div className="spacer" />
          <button className="btn teal small" onClick={() => { setShowAdd(!showAdd); setEditId(null); setForm({ date: '', title: '', type: 'Holiday', description: '' }); }}>
            {showAdd ? '✕ Cancel' : '+ Add Event'}
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="card" style={{ borderLeft: '4px solid var(--teal)' }}>
          <h2>{editId ? 'Edit Event' : 'Add Calendar Event'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid2">
              <div className="field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Event type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Diwali Holiday" required />
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional notes…" rows={2} />
              </div>
            </div>
            <div className="rowflex">
              <button className="btn teal small" type="submit">{editId ? 'Update Event' : '+ Add Event'}</button>
              {editId && <button className="btn ghost small" type="button" onClick={() => { setEditId(null); setShowAdd(false); setForm({ date: '', title: '', type: 'Holiday', description: '' }); }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <th key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontWeight: 700, borderBottom: '1px solid var(--line)' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) }, (_, week) => (
              <tr key={week}>
                {Array.from({ length: 7 }, (_, dayOfWeek) => {
                  const day = week * 7 + dayOfWeek - firstDay + 1;
                  const valid = day >= 1 && day <= daysInMonth;
                  const events = valid ? getEventsForDay(day) : [];
                  return (
                    <td key={dayOfWeek} style={{ border: '1px solid var(--line)', verticalAlign: 'top', padding: '4px 6px', minHeight: 70, width: '14.28%', background: !valid ? '#f9f8f4' : events.length ? '#fffdf5' : '' }}>
                      {valid && (
                        <>
                          <div style={{ fontSize: 11.5, fontWeight: day === new Date().getDate() && viewMonth === new Date().getMonth() && viewYear === new Date().getFullYear() ? 800 : 500, color: 'var(--navy)', marginBottom: 3 }}>{day}</div>
                          {events.map(ev => (
                            <div key={ev.id} onClick={() => startEdit(ev)} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, marginBottom: 2, cursor: 'pointer', background: EVENT_COLORS[ev.type] + '22', color: EVENT_COLORS[ev.type], fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={ev.title}>
                              {ev.title}
                            </div>
                          ))}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Events list */}
      <div className="card">
        <h2>All Events — {monthLabel}</h2>
        {monthEvents.length === 0
          ? <p className="muted hint">No events in {monthLabel}. Add events above.</p>
          : (
            <div className="tablewrap">
              <table className="data">
                <thead><tr><th style={{ width: 100 }}>Date</th><th>Type</th><th className="left">Title</th><th className="left">Description</th><th></th></tr></thead>
                <tbody>
                  {monthEvents.sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
                    <tr key={ev.id}>
                      <td className="mono">{ev.date}</td>
                      <td><span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: EVENT_COLORS[ev.type] + '22', color: EVENT_COLORS[ev.type], fontWeight: 600 }}>{ev.type}</span></td>
                      <td className="left">{ev.title}</td>
                      <td className="left muted" style={{ fontSize: 12 }}>{ev.description || '—'}</td>
                      <td>
                        <div className="rowflex" style={{ gap: 6 }}>
                          <button className="btn ghost small" onClick={() => startEdit(ev)}>Edit</button>
                          <button className="btn danger small" onClick={() => handleDelete(ev.id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

// ─── TAB: Export / Print ──────────────────────────────────────────────────────
function TabExport({ programs, faculty, timetable, academicYears, department }) {
  const [exportView, setExportView] = useState('curriculum');
  const [exportProg, setExportProg] = useState(programs[0]?.id || null);

  useEffect(() => { if (programs.length && !exportProg) setExportProg(programs[0].id); }, [programs, exportProg]);

  const handlePrint = () => window.print();

  const prog = programs.find(p => p.id === exportProg);

  return (
    <div>
      <div className="card no-print">
        <div className="rowflex" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="examtabs">
            {[
              { id: 'curriculum', label: '📚 Curriculum' },
              { id: 'load', label: '⚖️ Load Distribution' },
              { id: 'timetable', label: '📅 Timetable' },
            ].map(v => (
              <button key={v.id} className={exportView === v.id ? 'active' : ''} onClick={() => setExportView(v.id)}>{v.label}</button>
            ))}
          </div>
          {exportView !== 'load' && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Programme</label>
              <select value={exportProg || ''} onChange={e => setExportProg(e.target.value)}>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="spacer" />
          <button className="btn teal small" onClick={handlePrint}>🖨️ Print / Save PDF</button>
        </div>
      </div>

      {/* Curriculum export */}
      {exportView === 'curriculum' && prog && (
        <div className="card report-doc" id="export-area">
          <div className="report-cover">
            <div className="institute">{department.name || 'Department'}</div>
            <div className="doctitle">{prog.name} — Curriculum Plan</div>
            <div className="dept" style={{ marginTop: 6 }}>{prog.type} · {prog.major}{prog.minor ? ' · Minor: ' + prog.minor : ''}</div>
          </div>
          {(prog.semesters || []).map(s => {
            const credits = (s.courses || []).reduce((sum, c) => sum + Number(c.credits || 0), 0);
            return (
              <div key={s.sem} className="report-section">
                <h2>Semester {toRoman(s.sem)} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>— {credits} credits</span></h2>
                {(s.courses || []).length > 0 ? (
                  <table className="data">
                    <thead><tr><th className="left">Course Title</th><th>Code</th><th>Category</th><th>L</th><th>T</th><th>P</th><th>S</th><th>Credits</th></tr></thead>
                    <tbody>
                      {s.courses.map(c => (
                        <tr key={c.id}>
                          <td className="left">{c.title}</td>
                          <td className="mono">{c.code}</td>
                          <td>{c.category}</td>
                          <td className="mono">{c.L || 0}</td><td className="mono">{c.T || 0}</td>
                          <td className="mono">{c.P || 0}</td><td className="mono">{c.S || 0}</td>
                          <td className="mono" style={{ fontWeight: 700 }}>{c.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td className="left" colSpan={7} style={{ fontSize: 11.5 }}>Semester Total</td><td className="mono">{credits}</td></tr>
                    </tfoot>
                  </table>
                ) : <p className="muted" style={{ fontSize: 12 }}>No courses.</p>}
              </div>
            );
          })}
          <div className="sig-grid">
            <div className="sig-box"><div className="name">_________________</div><div className="role">Head of Department</div></div>
            <div className="sig-box"><div className="name">_________________</div><div className="role">IQAC Coordinator</div></div>
            <div className="sig-box"><div className="name">_________________</div><div className="role">Principal / Dean</div></div>
          </div>
        </div>
      )}

      {/* Load export */}
      {exportView === 'load' && (
        <div className="card report-doc">
          <div className="report-cover">
            <div className="institute">{department.name || 'Department'}</div>
            <div className="doctitle">Faculty Load Distribution</div>
          </div>
          <div className="report-section">
            <table className="data">
              <thead><tr><th className="left">Faculty</th><th>Designation</th><th>Total L</th><th>Total T</th><th>Total P</th><th>Grand Total</th></tr></thead>
              <tbody>
                {faculty.map(f => {
                  let L = 0, T = 0, P = 0;
                  programs.forEach(prog => (prog.semesters || []).forEach(s => (s.courses || []).forEach(c => {
                    const a = (c.assignments || []).find(x => x.facultyId === f.id);
                    if (a) { L += a.L || 0; T += a.T || 0; P += a.P || 0; }
                  })));
                  return <tr key={f.id}><td className="left">{f.name}</td><td>{f.designation || '—'}</td><td className="mono">{L}</td><td className="mono">{T}</td><td className="mono">{P}</td><td className="mono" style={{ fontWeight: 700 }}>{L + T + P}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timetable export */}
      {exportView === 'timetable' && prog && (
        <div className="card report-doc">
          <div className="report-cover">
            <div className="institute">{department.name || 'Department'}</div>
            <div className="doctitle">{prog.name} — Timetable</div>
          </div>
          {Array.from({ length: prog.semesters?.length || 8 }, (_, i) => i + 1).map(sem => {
            const semCourses = prog.semesters?.find(s => s.sem === sem)?.courses || [];
            return (
              <div key={sem} className="report-section">
                <h2>Semester {toRoman(sem)}</h2>
                <table className="data" style={{ fontSize: 11 }}>
                  <thead><tr><th>Day</th>{PERIODS.map(p => <th key={p}>{p}</th>)}</tr></thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day}>
                        <td style={{ fontWeight: 700 }}>{day.slice(0, 3)}</td>
                        {PERIODS.map(period => {
                          const cell = timetable.find(t => t.progId === activeProg && t.sem === sem && t.day === day && t.period === period);
                          const c = cell ? semCourses.find(x => x.id === cell.courseId) : null;
                          const f = cell ? faculty.find(x => x.id === cell.facultyId) : null;
                          return <td key={period} style={{ fontSize: 10 }}>{c ? <><div style={{ fontWeight: 600 }}>{c.code}</div><div className="muted">{f?.name?.split(' ').slice(-1)[0] || ''}</div></> : ''}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TAB: Excel Import / Export ───────────────────────────────────────────────
function TabExcel({ programs, setPrograms, faculty, setFaculty, timetable, setTimetable, addToast }) {
  const fileRef = useRef();

  const exportToCSV = (type) => {
    let csv = '';
    if (type === 'curriculum') {
      csv = 'Programme,Semester,Course Code,Course Title,Category,L,T,P,S,Credits\n';
      programs.forEach(prog => {
        (prog.semesters || []).forEach(s => {
          (s.courses || []).forEach(c => {
            csv += `"${prog.name}",${toRoman(s.sem)},"${c.code}","${c.title}","${c.category}",${c.L || 0},${c.T || 0},${c.P || 0},${c.S || 0},${c.credits}\n`;
          });
        });
      });
    } else if (type === 'faculty') {
      csv = 'Name,Designation,Specialisation,Email,Max Load (hrs/wk)\n';
      faculty.forEach(f => {
        csv += `"${f.name}","${f.designation || ''}","${f.specialization || ''}","${f.email || ''}",${f.maxLoad || 16}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `academic_planner_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addToast(`${type === 'curriculum' ? 'Curriculum' : 'Faculty'} data exported as CSV.`, 'success');
  };

  const exportFullJSON = () => {
    const data = { programs, faculty, timetable, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `academic_planner_full_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addToast('Full plan exported as JSON.', 'success');
  };

  const exportFullExcel = (isTemplate = false) => {
    const wb = XLSX.utils.book_new();

    // 1. Curriculum Data
    const curriculumHeaders = ["Programme", "Type", "Major", "Total Target Credits", "Semester", "Course Code", "Course Title", "Category", "L", "T", "P", "S", "Credits"];
    let currData = [curriculumHeaders];

    if (isTemplate) {
      currData.push(["B.Tech Computer Engineering", "UG4", "Computer Engineering", 160, 1, "MAT101", "Engineering Mathematics I", "BSC", 3, 1, 0, 0, 4]);
    } else {
      programs.forEach(prog => {
        (prog.semesters || []).forEach(s => {
          (s.courses || []).forEach(c => {
            currData.push([
              prog.name || '', prog.type || '', prog.major || '', prog.totalTarget || '',
              s.sem || '', c.code || '', c.title || '', c.category || '',
              c.L || 0, c.T || 0, c.P || 0, c.S || 0, c.credits || 0
            ]);

            if (c.isBasket && c.subCourses) {
              c.subCourses.forEach(sc => {
                currData.push([
                  prog.name || '', prog.type || '', prog.major || '', prog.totalTarget || '',
                  s.sem || '', sc.code || '', `  ↳ Option: ${sc.title}`, sc.category || '',
                  sc.L || 0, sc.T || 0, sc.P || 0, sc.S || 0, sc.credits || 0
                ]);
              });
            }
          });
        });
      });
    }
    const wsCurr = XLSX.utils.aoa_to_sheet(currData);
    XLSX.utils.book_append_sheet(wb, wsCurr, "Curriculum Data");

    // 2. Faculty Directory
    const facultyHeaders = ["Name", "Designation", "Specialisation", "Email", "Max Load (hrs/wk)"];
    let facData = [facultyHeaders];

    if (isTemplate) {
      facData.push(["Dr. Sample Faculty", "Associate Professor", "Computer Science", "sample@college.edu", 16]);
    } else {
      faculty.forEach(f => {
        facData.push([
          f.name || '', f.designation || '', f.specialization || '', f.email || '', f.maxLoad || 16
        ]);
      });
    }
    const wsFac = XLSX.utils.aoa_to_sheet(facData);
    XLSX.utils.book_append_sheet(wb, wsFac, "Faculty Directory");

    // 3. Timetable & Allocations
    const ttHeaders = ["Day", "Period", "Programme", "Semester", "Course Code", "Faculty Name", "Type"];
    let ttData = [ttHeaders];

    if (isTemplate) {
      ttData.push(["Monday", "P1", "B.Tech Computer Engineering", 1, "MAT101", "Dr. Sample Faculty", "L"]);
    } else {
      timetable.forEach(t => {
        const prog = programs.find(p => p.id === t.progId);
        const c = prog?.semesters?.find(s => s.sem === t.semId)?.courses?.find(x => x.id === t.courseId);
        const f = faculty.find(x => x.id === t.facultyId);
        if (c && f) {
          ttData.push([
            t.day || '', t.period || '', prog?.name || '', t.semId || '', c.code || '', f.name || '', t.type || ''
          ]);
        }
      });
    }
    const wsTT = XLSX.utils.aoa_to_sheet(ttData);
    XLSX.utils.book_append_sheet(wb, wsTT, "Timetable & Allocations");

    // Download
    const filename = isTemplate ? 'academic_planner_template.xlsx' : `academic_planner_full_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    addToast(isTemplate ? 'Excel Template downloaded.' : 'Full plan exported as Excel.', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.programs) setPrograms(data.programs);
          if (data.faculty) setFaculty(data.faculty);
          if (data.timetable) setTimetable(data.timetable);
          addToast('JSON Plan imported successfully. Review and save.', 'success');
        } catch {
          addToast('Invalid JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    }
    else if (file.name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          let newPrograms = [];
          let newFaculty = [];
          let newTimetable = [];

          // 1. Parse Faculty Directory
          const facSheet = workbook.Sheets["Faculty Directory"];
          if (facSheet) {
            const facRows = XLSX.utils.sheet_to_json(facSheet);
            newFaculty = facRows.map(row => ({
              id: uid(),
              name: row["Name"] || '',
              designation: row["Designation"] || '',
              specialization: row["Specialisation"] || '',
              email: row["Email"] || '',
              maxLoad: parseInt(row["Max Load (hrs/wk)"]) || 16
            })).filter(f => f.name.trim() !== '');
          }

          // 2. Parse Curriculum Data
          const currSheet = workbook.Sheets["Curriculum Data"];
          if (currSheet) {
            const currRows = XLSX.utils.sheet_to_json(currSheet);
            const progMap = {};

            currRows.forEach(row => {
              const pName = row["Programme"];
              if (!pName) return;

              if (!progMap[pName]) {
                progMap[pName] = {
                  id: uid(),
                  name: pName,
                  type: row["Type"] || 'UG4',
                  major: row["Major"] || '',
                  totalTarget: parseInt(row["Total Target Credits"]) || 160,
                  semMin: 20, semMax: 26, divisions: 1,
                  semesters: []
                };
              }

              const p = progMap[pName];
              const semNum = parseInt(row["Semester"]);
              if (!semNum) return;

              let semObj = p.semesters.find(s => s.sem === semNum);
              if (!semObj) {
                semObj = { sem: semNum, courses: [] };
                p.semesters.push(semObj);
              }

              semObj.courses.push({
                id: uid(),
                code: row["Course Code"] || '',
                title: row["Course Title"] || '',
                category: row["Category"] || 'PCC',
                L: parseInt(row["L"]) || 0,
                T: parseInt(row["T"]) || 0,
                P: parseInt(row["P"]) || 0,
                S: parseInt(row["S"]) || 0,
                credits: parseInt(row["Credits"]) || 0
              });
            });

            newPrograms = Object.values(progMap);
          }

          // 3. Parse Timetable
          const ttSheet = workbook.Sheets["Timetable & Allocations"];
          if (ttSheet && newPrograms.length > 0 && newFaculty.length > 0) {
            const ttRows = XLSX.utils.sheet_to_json(ttSheet);
            ttRows.forEach(row => {
              const day = row["Day"];
              const period = row["Period"];
              const progName = row["Programme"];
              const semNum = parseInt(row["Semester"]);
              const courseCode = row["Course Code"];
              const facName = row["Faculty Name"];
              const type = row["Type"];

              if (day && period && progName && semNum && courseCode && facName && type) {
                const prog = newPrograms.find(p => p.name === progName);
                if (prog) {
                  const course = prog.semesters.find(s => s.sem === semNum)?.courses.find(c => c.code === courseCode);
                  const fac = newFaculty.find(f => f.name === facName);
                  if (course && fac) {
                    newTimetable.push({
                      id: uid(),
                      day, period,
                      progId: prog.id,
                      semId: semNum,
                      courseId: course.id,
                      facultyId: fac.id,
                      type
                    });
                  }
                }
              }
            });
          }

          if (newPrograms.length > 0 || newFaculty.length > 0) {
            if (newPrograms.length > 0) setPrograms(newPrograms);
            if (newFaculty.length > 0) setFaculty(newFaculty);
            if (newTimetable.length > 0) setTimetable(newTimetable);
            addToast('Excel Plan imported successfully. Review and save.', 'success');
          } else {
            addToast('No valid data found in Excel sheets.', 'warning');
          }
        } catch (err) {
          console.error(err);
          addToast('Error parsing Excel file.', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      addToast('Unsupported file format. Please upload .json or .xlsx', 'error');
    }

    e.target.value = '';
  };

  const importTemplate = () => {
    const template = {
      programs: [{
        id: uid(), name: 'B.Tech Computer Engineering', type: 'UG4', major: 'Computer Engineering', minor: '', totalTarget: 160, semMin: 20, semMax: 26, divisions: 2,
        semesters: [
          { sem: 1, courses: [{ id: uid(), title: 'Engineering Mathematics I', code: 'MAT101', category: 'BSC', L: 3, T: 1, P: 0, S: 0, credits: 4 }] },
        ]
      }],
      faculty: [{ id: uid(), name: 'Dr. Sample Faculty', designation: 'Associate Professor', specialization: 'Computer Science', maxLoad: 16, email: 'sample@college.edu' }],
      timetable: [{ id: uid(), progId: 'prog1', semId: 1, courseId: 'course1', facultyId: 'fac1', day: 'Monday', period: 'P1', type: 'L' }]
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'academic_planner_template.json';
    a.click();
    addToast('JSON Template downloaded. Fill it in and import.', 'info');
  };

  return (
    <div>
      <div className="section-note">
        Export your Academic Planner data to CSV, JSON, or Excel for sharing. Import a previously exported JSON or Excel file to restore or migrate data.
      </div>

      {/* Export */}
      <div className="card">
        <h2>Export Data</h2>
        <div className="rowflex" style={{ flexWrap: 'wrap', gap: 10 }}>
          <button className="btn ghost small" onClick={() => exportToCSV('curriculum')}>📥 Export Curriculum (CSV)</button>
          <button className="btn ghost small" onClick={() => exportToCSV('faculty')}>📥 Export Faculty (CSV)</button>
          <button className="btn ghost small" onClick={exportFullJSON}>📥 Export Full Plan (JSON)</button>
          <button className="btn teal small" onClick={() => exportFullExcel(false)}>📥 Export Full Plan (.xlsx)</button>
        </div>
      </div>

      {/* Import */}
      <div className="card">
        <h2>Import Data</h2>
        <p className="hint">Import a full plan previously exported from this tool. This will <strong>replace</strong> existing programme and faculty data.</p>
        <div className="rowflex" style={{ flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          <button className="btn ghost small" onClick={() => fileRef.current?.click()}>📤 Import Plan (.json or .xlsx)</button>
          <input ref={fileRef} type="file" accept=".json, .xlsx" style={{ display: 'none' }} onChange={handleImport} />
          <button className="btn ghost small" onClick={importTemplate}>📋 Download JSON Template</button>
          <button className="btn ghost small" onClick={() => exportFullExcel(true)}>📋 Download Excel Template (.xlsx)</button>
        </div>
        <div className="hint" style={{ marginTop: 10 }}>After importing, click <strong>Save Plan</strong> (at the top of the page) to persist the imported data.</div>
      </div>

      {/* Statistics */}
      <div className="card">
        <h2>Current Plan Statistics</h2>
        <div className="grid2">
          <div style={{ padding: '14px 16px', background: 'var(--teal-soft)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--teal)' }}>{programs.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Programmes</div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--amber-soft)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--amber)' }}>{programs.reduce((sum, p) => sum + (p.semesters || []).reduce((s2, s) => s2 + (s.courses || []).length, 0), 0)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Total Courses</div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--navy-soft, #e9edf3)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>{faculty.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Faculty Members</div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--green-soft)', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{programs.reduce((sum, p) => sum + (p.semesters || []).reduce((s2, s) => s2 + (s.courses || []).reduce((s3, c) => s3 + Number(c.credits || 0), 0), 0), 0)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Total Credits</div>
          </div>
        </div>
      </div>
    </div>
  );
}
