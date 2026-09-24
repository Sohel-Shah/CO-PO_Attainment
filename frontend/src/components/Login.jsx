import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

export default function Login({ onLogin }) {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('faculty');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`http://${window.location.hostname}:3001/api/auth/email-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), role: role })
            });
            const data = await res.json();
            if (data.ok) {
                onLogin(data.user, data.token);
            } else {
                addToast(data.error || "Login failed.", "error");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            addToast("Network error. Please make sure the backend is running.", "error");
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', position: 'relative', background: '#f6f5f1' }}>
            {/* Navy blue left strip */}
            <div style={{ width: '25%', background: '#192b40', minHeight: '100vh' }}></div>
            
            {/* Main Login Card */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '12%',
                transform: 'translateY(-50%)',
                background: '#fff',
                borderRadius: '12px',
                padding: '35px',
                width: '420px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
            }}>
                <h1 style={{ fontFamily: 'var(--serif), serif', fontSize: '24px', color: '#192b40', margin: '0 0 10px', fontWeight: 'bold' }}>CO-PO Attainment Studio</h1>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 25px', lineHeight: '1.5' }}>
                    This workspace is shared across your department — course data is visible to everyone who opens it, filtered by the access each course owner grants. Sign in with your Email ID.
                </p>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block', fontWeight: '600' }}>EMAIL ID</label>
                    <input 
                        type="email" 
                        placeholder="e.g. faculty@coep.ac.in" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        onKeyDown={e => { if (e.key === 'Enter') handleLogin(e); }}
                        autoFocus
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', color: '#334155' }}
                    />
                </div>

                <div style={{ marginBottom: '28px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block', fontWeight: '600' }}>YOUR ROLE</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div 
                            onClick={() => setRole('faculty')}
                            style={{
                                flex: 1, 
                                padding: '14px 8px', 
                                borderRadius: '6px', 
                                border: role === 'faculty' ? '1px solid #328470' : '1px solid #e2e8f0', 
                                background: role === 'faculty' ? '#eaf5f2' : '#fff', 
                                cursor: 'pointer', 
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                            }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: role === 'faculty' ? '#328470' : '#64748b', marginBottom: '4px' }}>FACULTY</div>
                            <div style={{ fontSize: '9px', color: role === 'faculty' ? '#328470' : '#94a3b8', textTransform: 'uppercase' }}>ACCESS PER-COURSE, AS GRANTED</div>
                        </div>
                        <div 
                            onClick={() => setRole('admin')}
                            style={{
                                flex: 1, 
                                padding: '14px 8px', 
                                borderRadius: '6px', 
                                border: role === 'admin' ? '1px solid #328470' : '1px solid #e2e8f0', 
                                background: role === 'admin' ? '#eaf5f2' : '#fff', 
                                cursor: 'pointer', 
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                userSelect: 'none'
                            }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: role === 'admin' ? '#328470' : '#64748b', marginBottom: '4px' }}>ADMIN (HOD / IQAC)</div>
                            <div style={{ fontSize: '9px', color: role === 'admin' ? '#328470' : '#94a3b8', textTransform: 'uppercase' }}>FULL ACCESS, ALL COURSES</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <button 
                        onClick={handleLogin} 
                        disabled={loading || !email.trim()}
                        style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '6px', fontWeight: '600', background: '#328470', color: '#fff', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', opacity: (loading || !email.trim()) ? 0.7 : 1 }}
                    >
                        {loading ? 'Continuing...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
