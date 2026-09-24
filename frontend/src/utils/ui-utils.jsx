/* eslint-disable react-refresh/only-export-components */
import React from 'react';

// Styling constants mapping directly to global CSS design tokens
export const generateId = () => Math.random().toString(36).substring(2, 9);

export const S = {
    card: {
        background: "var(--bg-card)",
        borderRadius: "var(--card-radius)",
        border: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-card)",
        transition: "var(--transition-normal)",
        padding: "20px"
    },
    input: {
        width: "100%",
        padding: "10px 14px",
        background: "var(--bg-app)",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        color: "var(--text-main)",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        transition: "var(--transition-normal)"
    },
    btnPrimary: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 22px",
        background: "linear-gradient(135deg, var(--brand), var(--brand-hover))",
        border: "none",
        borderRadius: 8,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        boxShadow: "0 4px 12px var(--bg-brand-trans)",
        transition: "var(--transition-normal)"
    },
    btnGhost: {
        padding: "8px 20px",
        background: "transparent",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        color: "var(--text-sub)",
        cursor: "pointer",
        fontSize: 13,
        transition: "var(--transition-normal)"
    },
    label: {
        fontSize: 11,
        color: "var(--text-muted)",
        display: "block",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        fontWeight: 600
    },
    tag: (bg, fg) => ({
        padding: "4px 10px",
        background: bg,
        color: fg,
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
        transition: "var(--transition-normal)"
    }),
};

// Icons
export const I = {
    plan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 3v18" /></svg>,
    att: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
    paper: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>,
    fb: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
    chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
    dash: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
    plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    chev: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>,
    copo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>,
    exam: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><line x1="8" y1="9" x2="10" y2="9" /></svg>,
    markentry: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
    unit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>,
    table: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg>,
};

export const Star = ({ filled }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2"><polygon points="12,2 15,9 22,9 17,14 18.5,21 12,17 5.5,21 7,14 2,9 9,9" /></svg>;

import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';

// ─── Mini Charts (Modernized with Professional Recharts) ────────────────────────────────────────────
export function BarChart({ data, h = 120, color = "var(--brand)" }) {
    const formattedData = data.map(d => ({
        name: d.l,
        value: d.v
    }));

    return (
        <div style={{ width: "100%", height: h, display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={formattedData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
                    <XAxis
                        dataKey="name"
                        tick={{ fill: "var(--text-muted)", fontSize: 10, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <RechartsTooltip
                        contentStyle={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            color: "var(--text-main)",
                            fontSize: "11px",
                            fontFamily: "var(--font-body)",
                            boxShadow: "var(--shadow-card)"
                        }}
                        cursor={{ fill: "var(--bg-brand-trans)" }}
                    />
                    <Bar
                        dataKey="value"
                        fill={color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                        animationDuration={800}
                    />
                </RechartsBarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function Donut({ data, size = 130 }) {
    const total = data.reduce((s, d) => s + d.v, 0);
    if (!total) return null;

    const formattedData = data.filter(d => d.v > 0).map(d => ({
        name: d.l,
        value: d.v,
        color: d.c
    }));

    return (
        <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RechartsPieChart width={size} height={size}>
                <Pie
                    data={formattedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={size * 0.28}
                    outerRadius={size * 0.44}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                >
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <RechartsTooltip
                    contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        color: "var(--text-main)",
                        fontSize: "11px",
                        fontFamily: "var(--font-body)",
                        boxShadow: "var(--shadow-card)"
                    }}
                />
            </RechartsPieChart>
            
            {/* Center Label HUD */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none"
            }}>
                <span style={{ fontSize: size * 0.14, fontWeight: "800", color: "var(--text-main)", fontFamily: "var(--font-title)", lineHeight: 1 }}>
                    {total}
                </span>
                <span style={{ fontSize: size * 0.075, fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>
                    students
                </span>
            </div>
        </div>
    );
}
