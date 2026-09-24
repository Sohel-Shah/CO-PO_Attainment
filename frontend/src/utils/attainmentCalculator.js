export const POS = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PO12'];
export const PSOS = ['PSO1','PSO2','PSO3'];
export const ALL_POS = [...POS, ...PSOS];

export function examQuestionsForCO(state, examKey, coId) {
  const exam = state.exams?.find(e => e.type === examKey || e.title === examKey);
  if (!exam) return [];
  return (exam.questions || []).filter(q => {
    const qCo = String(q.co || '').toUpperCase();
    return qCo === coId.toUpperCase();
  });
}

export function coMaxMarksInExam(state, examKey, coId) {
  return examQuestionsForCO(state, examKey, coId).reduce((s, q) => s + Number(q.marks || q.maxMarks || 0), 0);
}

export function studentCOMarksInExam(state, examKey, studentId, coId, precomputedQs = null) {
  const qs = precomputedQs || examQuestionsForCO(state, examKey, coId);
  const mrow = state.marksState?.[studentId] || {};
  return qs.reduce((s, q) => {
    const val = mrow[q.id] !== undefined ? mrow[q.id] : mrow[q.q];
    return s + Number(val || 0);
  }, 0);
}

export function levelFromPct(state, pct) {
  const levels = state.settings?.levels || [
    { level: 3, pct: 70 },
    { level: 2, pct: 60 },
    { level: 1, pct: 50 }
  ];
  const sorted = [...levels].sort((a, b) => b.pct - a.pct);
  for (const lv of sorted) {
    if (pct >= lv.pct) return lv.level;
  }
  return 0;
}

export function coLevelForExam(state, examKey, coId) {
  const maxMarks = coMaxMarksInExam(state, examKey, coId);
  const students = state.students || [];
  if (maxMarks <= 0 || students.length === 0) return null;

  const targetPct = state.settings?.targetPct ?? state.coTargetPct ?? 60;
  let attainedCount = 0;
  const qs = examQuestionsForCO(state, examKey, coId);
  
  students.forEach(st => {
    const marks = studentCOMarksInExam(state, examKey, st.id || st.roll || st.rollNo, coId, qs);
    const pct = (marks / maxMarks) * 100;
    if (pct >= targetPct) attainedCount++;
  });
  const pctAttained = (attainedCount / students.length) * 100;
  return {
    level: levelFromPct(state, pctAttained),
    pctAttained,
    maxMarks,
    n: students.length
  };
}

export function directCOAttainment(state, coId) {
  const taKeys = ['Internal Exam', 'Internal', 'T1', 'T2', 'T3'];
  const mseKey = 'Mid Semester Exam';
  const eseKey = 'End Semester Exam';

  const taComps = taKeys.map(k => coLevelForExam(state, k, coId)).filter(Boolean);
  const taWeight = state.exams?.find(e => e.type === 'Internal')?.totalMarks || 20; 
  const taLevel = taComps.length ? taComps.reduce((s, x) => s + x.level, 0) / taComps.length : null;
  const taPct = taComps.length ? taComps.reduce((s, x) => s + x.pctAttained, 0) / taComps.length : null;

  const mse = coLevelForExam(state, mseKey, coId) || coLevelForExam(state, 'Mid Semester', coId) || coLevelForExam(state, 'MSE', coId);
  const ese = coLevelForExam(state, eseKey, coId) || coLevelForExam(state, 'End Semester', coId) || coLevelForExam(state, 'ESE', coId);

  const comps = [];
  if (taLevel !== null) comps.push({ level: taLevel, pct: taPct, weight: taWeight });
  if (mse) comps.push({ level: mse.level, pct: mse.pctAttained, weight: mse.maxMarks });
  if (ese) comps.push({ level: ese.level, pct: ese.pctAttained, weight: ese.maxMarks });

  const totalWeight = comps.reduce((s, c) => s + c.weight, 0);
  const attainment = totalWeight > 0 ? comps.reduce((s, c) => s + c.level * c.weight, 0) / totalWeight : null;
  const attainmentPct = totalWeight > 0 ? comps.reduce((s, c) => s + c.pct * c.weight, 0) / totalWeight : null;

  return {
    attainment,
    attainmentPct,
    taLevel,
    mse,
    ese,
    assessed: comps.length > 0
  };
}

export function indirectCOAttainment(state, coId) {
  const scale = Number(state.feedback?.scale) || 5;
  const responses = state.feedback?.responses || [];
  if (responses.length > 0) {
    const vals = responses
      .map(r => r.ratings?.[coId])
      .filter(v => v !== undefined && v !== null && v !== '');
    if (vals.length > 0) {
      const avg = vals.reduce((s, v) => s + Number(v), 0) / vals.length;
      const pct = (avg / scale) * 100;
      return { avgRating: avg, pct, level: levelFromPct(state, pct), n: vals.length, scale };
    }
  }

  const fallback = state.coIndirect?.[coId];
  if (fallback !== undefined) {
    const pct = fallback;
    const avgRating = (pct / 100) * scale;
    return { avgRating, pct, level: levelFromPct(state, pct), n: state.students?.length || 0, scale };
  }

  return null;
}

export function combinedCOAttainment(state, coId) {
  const direct = directCOAttainment(state, coId);
  const indirect = indirectCOAttainment(state, coId);

  const wD = Number(state.settings?.weightDirect ?? state.directWeight ?? 80);
  const wI = Number(state.settings?.weightIndirect ?? state.indirectWeight ?? 20);

  if (direct.attainment === null && !indirect) {
    return { direct, indirect, overallLevel: null, overallPct: null };
  }
  if (!indirect) {
    return { direct, indirect, overallLevel: direct.attainment, overallPct: direct.attainmentPct };
  }
  if (direct.attainment === null) {
    return { direct, indirect, overallLevel: indirect.level, overallPct: indirect.pct };
  }

  const total = wD + wI || 100;
  const overallLevel = (direct.attainment * wD + indirect.level * wI) / total;
  const overallPct = (direct.attainmentPct * wD + indirect.pct * wI) / total;
  return { direct, indirect, overallLevel, overallPct };
}

export function directPOAttainment(state) {
  const results = {};
  const coCombined = {};
  
  const cos = state.courseOutcomes || [];
  cos.forEach(co => {
    coCombined[co.id] = combinedCOAttainment(state, co.id);
  });

  ALL_POS.forEach(po => {
    let num = 0, den = 0;
    cos.forEach(co => {
      const corr = Number(state.copoMap?.[co.id]?.[po] || 0);
      const d = coCombined[co.id];
      if (corr > 0 && d.overallLevel !== null) {
        num += d.overallLevel * corr;
        den += corr;
      }
    });
    results[po] = den > 0 ? (num / den) : null;
  });
  return { results, coCombined };
}

export function surveyPOLevel(state, surveyType, po) {
  const survey = state.poSurvey || {};
  const scale = Number(survey.scale) || 5;
  const responses = survey.responses?.[surveyType] || [];
  const vals = responses
    .map(r => r.ratings?.[po])
    .filter(v => v !== undefined && v !== null && v !== '');
  if (vals.length === 0) return null;
  const avg = vals.reduce((s, v) => s + Number(v), 0) / vals.length;
  const pct = (avg / scale) * 100;
  return { avgRating: avg, pct, level: levelFromPct(state, pct), n: vals.length };
}

export function indirectPOAttainment(state, po) {
  const w = state.settings?.poSurveyWeights || { alumni: 34, employer: 33, graduate: 33 };
  const comps = ['alumni', 'employer', 'graduate']
    .map(key => ({ key, res: surveyPOLevel(state, key, po), weight: Number(w[key] || 0) }))
    .filter(c => c.res !== null);
  if (comps.length === 0) return null;

  const totalWeight = comps.reduce((s, c) => s + c.weight, 0) || comps.length;
  const level = comps.reduce((s, c) => s + c.res.level * c.weight, 0) / totalWeight;
  const pct = comps.reduce((s, c) => s + c.res.pct * c.weight, 0) / totalWeight;
  return { level, pct, sources: comps.map(c => c.key) };
}

export function finalPOAttainment(state) {
  const { results: dResults, coCombined } = directPOAttainment(state);
  const wD = Number(state.settings?.weightDirectPO || 80);
  const wI = Number(state.settings?.weightIndirectPO || 20);

  const final = {};
  const indirect = {};

  ALL_POS.forEach(po => {
    const d = dResults[po];
    const ind = indirectPOAttainment(state, po);
    indirect[po] = ind;

    if (d === null && !ind) {
      final[po] = null;
    } else if (!ind) {
      final[po] = d;
    } else if (d === null) {
      final[po] = ind.level;
    } else {
      const total = wD + wI || 100;
      final[po] = (d * wD + ind.level * wI) / total;
    }
  });

  return { directResults: dResults, indirect, final, coCombined };
}
