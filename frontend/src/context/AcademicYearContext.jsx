import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AcademicYearContext = createContext();

export const normalizeYear = (yr) => {
  if (!yr) return '';
  return String(yr).replace(/[–—]/g, '-').trim();
};

export const getOffsetYear = (yearStr, offset = 0) => {
  if (!yearStr) return '';
  const match = String(yearStr).match(/(\d{4})/);
  if (!match) return yearStr;
  const start = parseInt(match[1], 10) - offset;
  const end = (start + 1) % 100;
  return `${start}–${String(end).padStart(2, '0')}`;
};

export const DEFAULT_ACADEMIC_YEARS = [
  { id: 'ay_2026_27', label: '2026–27', isActive: true },
  { id: 'ay_2025_26', label: '2025–26', isActive: false },
  { id: 'ay_2024_25', label: '2024–25', isActive: false },
];

export function AcademicYearProvider({ children, token: propToken }) {
  const [academicYears, setAcademicYearsState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_academic_years');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ACADEMIC_YEARS;
  });

  const [activeYearLabel, setActiveYearLabelState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_active_academic_year');
      if (saved) return saved;
    } catch {}
    return '2026–27';
  });

  const [activeYearId, setActiveYearIdState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_active_academic_year_id');
      if (saved) return saved;
    } catch {}
    return 'ay_2026_27';
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('app_active_academic_year', activeYearLabel);
      if (activeYearId) localStorage.setItem('app_active_academic_year_id', activeYearId);
      localStorage.setItem('app_academic_years', JSON.stringify(academicYears));
    } catch {}
  }, [activeYearLabel, activeYearId, academicYears]);

  // Fetch plan from backend
  const fetchAcademicPlan = useCallback(async () => {
    const token = propToken || localStorage.getItem('app_token');
    if (!token) return;
    try {
      const res = await fetch(`http://${window.location.hostname}:3001/api/v2/academic-planner`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.academicYears && Array.isArray(data.academicYears) && data.academicYears.length > 0) {
          setAcademicYearsState(data.academicYears);
          const activeObj = data.academicYears.find(y => y.isActive) || data.academicYears[0];
          if (activeObj) {
            setActiveYearLabelState(activeObj.label);
            setActiveYearIdState(activeObj.id);
          }
        }
      }
    } catch (e) {
      console.warn('AcademicYearProvider fetch error:', e);
    }
  }, [propToken]);

  useEffect(() => {
    fetchAcademicPlan();
  }, [fetchAcademicPlan]);

  const setActiveYear = useCallback(async (yearOrId) => {
    if (!yearOrId) return;
    const token = propToken || localStorage.getItem('app_token');
    const normTarget = normalizeYear(yearOrId);

    let resolvedLabel = '';
    let resolvedId = '';

    setAcademicYearsState(prev => {
      let matched = false;
      const updated = prev.map(y => {
        const isMatch = y.id === yearOrId || normalizeYear(y.label) === normTarget;
        if (isMatch) {
          matched = true;
          resolvedLabel = y.label;
          resolvedId = y.id;
          return { ...y, isActive: true };
        }
        return { ...y, isActive: false };
      });

      if (!matched) {
        resolvedLabel = yearOrId;
        resolvedId = `ay_${Date.now()}`;
        const newEntry = { id: resolvedId, label: yearOrId, isActive: true };
        setActiveYearLabelState(resolvedLabel);
        setActiveYearIdState(resolvedId);
        return [newEntry, ...prev.map(y => ({ ...y, isActive: false }))];
      }

      setActiveYearLabelState(resolvedLabel);
      setActiveYearIdState(resolvedId);
      return updated;
    });

    // Notify backend
    if (token) {
      try {
        await fetch(`http://${window.location.hostname}:3001/api/v2/academic-planner/set-active-year`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ year: resolvedLabel || yearOrId, id: resolvedId })
        });
      } catch (err) {
        console.warn('Failed to sync active year to backend:', err);
      }
    }
  }, [propToken]);

  const setAcademicYears = useCallback((yearsOrUpdater) => {
    setAcademicYearsState(prev => {
      const next = typeof yearsOrUpdater === 'function' ? yearsOrUpdater(prev) : yearsOrUpdater;
      return next;
    });
  }, []);

  const getDropdownOptions = useCallback(() => {
    const cay = activeYearLabel;
    const caym1 = getOffsetYear(activeYearLabel, 1);
    const caym2 = getOffsetYear(activeYearLabel, 2);

    const seen = new Set();
    const options = [];

    options.push({ value: 'ALL', label: 'All Academic Years' });

    // CAY
    options.push({ value: cay, label: `${cay} (CAY)` });
    seen.add(normalizeYear(cay));

    // CAYm1
    options.push({ value: caym1, label: `${caym1} (CAYm1)` });
    seen.add(normalizeYear(caym1));

    // CAYm2
    options.push({ value: caym2, label: `${caym2} (CAYm2)` });
    seen.add(normalizeYear(caym2));

    // Configured planner years
    (academicYears || []).forEach(y => {
      const label = y.label || y;
      const n = normalizeYear(label);
      if (!seen.has(n)) {
        seen.add(n);
        options.push({ value: label, label: label });
      }
    });

    // Common historical years fallback
    ['2023–24', '2022–23'].forEach(yr => {
      const n = normalizeYear(yr);
      if (!seen.has(n)) {
        seen.add(n);
        options.push({ value: yr, label: yr });
      }
    });

    return options;
  }, [activeYearLabel, academicYears]);

  const value = {
    academicYears,
    setAcademicYears,
    activeYear: activeYearId,
    activeYearLabel,
    setActiveYear,
    cayYear: activeYearLabel,
    caym1Year: getOffsetYear(activeYearLabel, 1),
    caym2Year: getOffsetYear(activeYearLabel, 2),
    getOffsetYear,
    getDropdownOptions,
    refreshAcademicPlan: fetchAcademicPlan
  };

  return (
    <AcademicYearContext.Provider value={value}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) {
    const defaultActive = '2026–27';
    return {
      academicYears: DEFAULT_ACADEMIC_YEARS,
      setAcademicYears: () => {},
      activeYear: 'ay_2026_27',
      activeYearLabel: defaultActive,
      setActiveYear: () => {},
      cayYear: defaultActive,
      caym1Year: getOffsetYear(defaultActive, 1),
      caym2Year: getOffsetYear(defaultActive, 2),
      getOffsetYear,
      getDropdownOptions: () => [
        { value: 'ALL', label: 'All Academic Years' },
        { value: defaultActive, label: `${defaultActive} (CAY)` },
        { value: '2025–26', label: '2025–26 (CAYm1)' },
        { value: '2024–25', label: '2024–25 (CAYm2)' },
      ],
      refreshAcademicPlan: () => {}
    };
  }
  return ctx;
}
