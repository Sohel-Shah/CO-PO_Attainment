import React, { useState, useEffect } from 'react';
import { S, I } from '../utils/ui-utils';
import { useToast } from '../context/ToastContext';

export default function Admin({ user }) {
    const { addToast } = useToast();
    const [targetEmail, setTargetEmail] = useState('');
    const [newPass, setNewPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);

    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState('faculty');

    const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
    const [assignCourseUser, setAssignCourseUser] = useState(null); // stores user obj when assigning
    const [selectedCourseToAssign, setSelectedCourseToAssign] = useState('');
    const [courseSearchQuery, setCourseSearchQuery] = useState('');

    const [coursesList, setCoursesList] = useState([]);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('app_token');
            const res = await fetch(`http://${window.location.hostname}:3001/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsersList(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('app_token');
            const res = await fetch(`http://${window.location.hostname}:3001/api/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCoursesList(data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchCourses();
    }, []);

    const toggleUserStatus = async (userId, currentStatus) => {
        if (userId === user.id) return addToast("You cannot disable your own account.", "warning");
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            const token = localStorage.getItem('app_token');
            const res = await fetch(`http://${window.location.hostname}:3001/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                addToast(`User marked as ${newStatus}`, "success");
                fetchUsers();
            } else {
                const err = await res.json();
                addToast(err.error || "Update failed", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const handleAssignCourse = async (e) => {
        e.preventDefault();
        if (!assignCourseUser || !selectedCourseToAssign) return addToast("Please select a course", "warning");
        const userId = assignCourseUser.id;
        try {
            const token = localStorage.getItem('app_token');
            const res = await fetch(`http://${window.location.hostname}:3001/api/users/${userId}/course-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ courseId: selectedCourseToAssign, accessLevel: 'owner' })
            });
            if (res.ok) {
                addToast("Access granted", "success");
                setAssignCourseUser(null);
                setSelectedCourseToAssign('');
                fetchUsers();
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
            const token = localStorage.getItem('app_token');
            const res = await fetch(`http://${window.location.hostname}:3001/api/users/${userId}/course-access/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                addToast("Access revoked", "success");
                fetchUsers();
            } else {
                const err = await res.json();
                addToast(err.error || "Failed to revoke access", "error");
            }
        } catch (error) {
            addToast("Network error", "error");
        }
    };

    const EyeIcon = ({ open }) => open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (user.role !== 'admin') {
            addToast("Unauthorized: Only administrators can modify security settings.", "error");
            return;
        }
        if (!targetEmail || !newPass) return addToast("All fields are required.", "warning");

        setLoading(true);
        try {
            const token = localStorage.getItem('app_token');
            const r = await fetch(`http://${window.location.hostname}:3001/api/auth/admin/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email: targetEmail, password: newPass, updaterRole: user.role })
            });
            const data = await r.json();
            if (r.ok) {
                addToast("Security updated: Password has been modified.", "success");
                setTargetEmail(''); setNewPass('');
            } else {
                addToast(data.error || "Update failed.", "error");
            }
        } catch {
            addToast("Server error. Check your connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (user.role !== 'admin') {
            addToast("Unauthorized: Only administrators can add users.", "error");
            return;
        }
        if (!newUserEmail) return addToast("Email is required.", "warning");
        
        setLoading(true);
        try {
            const token = localStorage.getItem('app_token');
            const r = await fetch(`http://${window.location.hostname}:3001/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ email: newUserEmail, name: newUserName, role: newUserRole })
            });
            const data = await r.json();
            if (r.ok) {
                addToast("User added successfully.", "success");
                setNewUserEmail(''); setNewUserName(''); setNewUserRole('faculty');
                setUsersList([...usersList, data]);
            } else {
                addToast(data.error || "Failed to add user.", "error");
            }
        } catch {
            addToast("Server error. Check your connection.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Modal overlay styles
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    };
    const modalStyle = {
        background: 'white', padding: '24px', borderRadius: '8px', 
        width: '400px', maxWidth: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    };

    return (
        <div>
            <h1 className="pagetitle">Admin Panel</h1>
            <p className="pagesub">System configuration and user management</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
                {[
                    { label: 'Total Users', value: fetchingUsers ? '...' : usersList.length, color: 'var(--brand)' },
                    { label: 'Active Sessions', value: '8', color: 'var(--success)' },
                    { label: 'System Health', value: '100%', color: 'var(--warning)' },
                    { label: 'DB Size', value: '124MB', color: 'var(--info)' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ borderTop: `4px solid ${stat.color}`, padding: '18px 20px', marginBottom: 0 }}>
                        <h3 style={{ margin: 0, marginBottom: '8px' }}>{stat.label}</h3>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy-2)' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid2">
                {/* User List */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0 }}>System Users</h2>
                        <button className="btn teal" onClick={() => setShowAddFacultyModal(true)}>+ Add Faculty</button>
                    </div>
                    <div className="tablewrap">
                        <table className="data">
                            <thead>
                                <tr>
                                    {['User', 'Role', 'Status', 'Assigned Courses', 'Actions'].map(h => (
                                        <th key={h} className="left">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {fetchingUsers ? (
                                    <tr>
                                        <td colSpan="5" className="center muted">Loading users...</td>
                                    </tr>
                                ) : usersList.map((u, i) => (
                                    <React.Fragment key={u.id || i}>
                                        <tr>
                                            <td className="left" style={{ fontWeight: 700 }}>
                                                {u.name || u.email.split('@')[0]}
                                                {u.id === user.id && <span className="muted" style={{ fontSize: 10, marginLeft: 6 }}>(you)</span>}
                                                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{u.email}</div>
                                            </td>
                                            <td className="left" style={{ textTransform: 'capitalize' }}>{u.role}</td>
                                            <td>
                                                <span className={`pill ${u.status === 'active' ? 'l3' : 'l1'}`}>
                                                    {u.status === 'active' ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="left">
                                                {u.role !== 'admin' && (
                                                    (!u.courseAccesses || u.courseAccesses.length === 0) ? (
                                                        <span className="muted" style={{ fontSize: 11 }}>None</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {u.courseAccesses.map(access => {
                                                                const courseObj = coursesList.find(c => c.id === access.courseId);
                                                                const cName = courseObj?.name;
                                                                const cCode = courseObj?.code || courseObj?.courseId;
                                                                const displayLabel = cName ? (cCode ? `${cName} (${cCode})` : cName) : (cCode || access.courseId);
                                                                return (
                                                                    <span key={access.courseId} className="pill" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2px 6px', fontSize: 10 }}>
                                                                        {displayLabel}
                                                                        <button 
                                                                            onClick={() => handleRevokeCourse(u.id, access.courseId)}
                                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0, marginLeft: 4, fontSize: 10 }}
                                                                        >✕</button>
                                                                    </span>
                                                                )
                                                            })}
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                            <td className="muted">
                                                <div className="rowflex" style={{ gap: 8 }}>
                                                    {u.role !== 'admin' && (
                                                        <button 
                                                            className="btn small l1"
                                                            onClick={() => {
                                                                setAssignCourseUser(u);
                                                                setSelectedCourseToAssign('');
                                                                setCourseSearchQuery('');
                                                            }}
                                                        >
                                                            Assign Course
                                                        </button>
                                                    )}
                                                    {u.id !== user.id && (
                                                        <button 
                                                            className={`btn small ${u.status === 'active' ? 'danger' : 'teal'}`}
                                                            onClick={() => toggleUserStatus(u.id, u.status)}
                                                        >
                                                            {u.status === 'active' ? 'Disable' : 'Enable'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                                {!fetchingUsers && usersList.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="center muted">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Password Configuration */}
                    <div className="card" style={{ marginBottom: 0 }}>
                    <h2>Security Configuration</h2>
                    <p className="muted" style={{ fontSize: '13px', marginBottom: '24px' }}>Set or modify user passwords. Access restricted to Admin only.</p>

                    <form onSubmit={handlePasswordChange}>
                        <div className="field">
                            <label>User Email</label>
                            <input
                                type="email"
                                placeholder="example@teachflow.com"
                                value={targetEmail}
                                onChange={e => setTargetEmail(e.target.value)}
                            />
                        </div>
                        <div className="field" style={{ marginBottom: '24px' }}>
                            <label>Set New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                    style={{ paddingRight: '44px', width: '100%', boxSizing: 'border-box' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: 'var(--muted)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', padding: 0
                                    }}
                                >
                                    <EyeIcon open={showPass} />
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn teal"
                            style={{ width: "100%", textAlign: "center" }}>
                            {loading ? "Syncing Authentication..." : "Configure New Password"}
                        </button>
                    </form>
                    </div>
                </div>
            </div>

            {/* Modal: Add Faculty */}
            {showAddFacultyModal && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h2 style={{ marginTop: 0 }}>Add Faculty</h2>
                        <p className="muted" style={{ fontSize: '13px', marginBottom: '24px' }}>Register a new faculty member using their college email ID.</p>
                        
                        <form onSubmit={(e) => {
                            handleAddUser(e).then(() => setShowAddFacultyModal(false))
                        }}>
                            <div className="field">
                                <label>Faculty Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Prof. R. K. Patil"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="field">
                                <label>College Email ID</label>
                                <input
                                    type="email"
                                    placeholder="faculty@coep.ac.in"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="field" style={{ marginBottom: '24px' }}>
                                <label>Role</label>
                                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                                    <option value="faculty">Faculty</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowAddFacultyModal(false)}>Cancel</button>
                                <button type="submit" disabled={loading} className="btn teal">
                                    {loading ? "Saving..." : "Save Faculty"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Assign Course */}
            {assignCourseUser && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h2 style={{ marginTop: 0 }}>Assign Course Access</h2>
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
                                    {coursesList
                                        .filter(c => !assignCourseUser.courseAccesses?.find(a => a.courseId === c.id))
                                        .filter(c => {
                                            if (!courseSearchQuery) return true;
                                            const q = courseSearchQuery.toLowerCase();
                                            return (c.name && c.name.toLowerCase().includes(q)) || 
                                                   (c.code && c.code.toLowerCase().includes(q));
                                        })
                                        .map(c => {
                                            const displayLabel = c.name ? (c.code ? `${c.name} (${c.code})` : c.name) : (c.code || c.id);
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
        </div>
    );
}
