function stripLangSuffix(s) {
  let v = String(s || '').trim();
  if (!v) return '';
  v = v.replace(/[\(\（]\s*(EN|E|CN|ZH)\s*[\)\）]\s*$/i, '');
  v = v.replace(/(EN|E|CN|ZH)\s*$/i, '');
  return v.trim();
}

function pad3(n) {
  const s = String(n);
  if (s.length >= 3) return s;
  if (s.length === 2) return '0' + s;
  return '00' + s;
}

function normalizeQuestionKey(input) {
  if (!input) return '';
  const raw = typeof input === 'object'
    ? (input.number != null ? input.number : input.id)
    : input;

  let s = stripLangSuffix(raw);
  if (!s) return '';

  const icf = s.match(/^icf[\s\-_]*0*(\d{1,3})/i);
  if (icf) return 'ICF-' + pad3(parseInt(icf[1], 10));

  const num = s.match(/(\d{1,3})/);
  if (!num) return '';
  return pad3(parseInt(num[1], 10));
}

function buildLabelIndex(list) {
  const map = new Map();
  (list || []).forEach(function(it) {
    const key = normalizeQuestionKey(it && it.id);
    if (key) map.set(key, it);
  });
  return map;
}

function getOptionVals(label, optionId) {
  const key = String(optionId || '').trim().toLowerCase();
  if (!key) return { p: 0, s: 0, missing: true };
  const opt = label && label.options ? label.options[key] : null;
  if (!opt) return { p: 0, s: 0, missing: true };
  return {
    p: Number(opt.p_val) || 0,
    s: Number(opt.s_val) || 0,
    missing: false
  };
}

function computeAbilityScores(opts) {
  const lastAnswers = opts && opts.lastAnswers;
  const questionBank = opts && opts.questionBank;
  const labels = opts && opts.labels;
  const labelIndex = buildLabelIndex(labels);
  const questionMap = new Map();
  (questionBank || []).forEach(function(q) {
    questionMap.set(String(q && q.id), q);
  });

  const byKey = new Map();
  (lastAnswers || []).forEach(function(a) {
    const q = questionMap.get(String(a && a.id));
    const key = normalizeQuestionKey(q || a);
    if (!key) return;

    const bestChoice = a.bestChoice != null ? a.bestChoice : a.best;
    const worstChoice = a.worstChoice != null ? a.worstChoice : a.worst;
    const next = { id: a.id, key, bestChoice, worstChoice };

    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, next);
      return;
    }
    const prevComplete = !!(prev.bestChoice && prev.worstChoice);
    const nextComplete = !!(next.bestChoice && next.worstChoice);
    if (!prevComplete && nextComplete) byKey.set(key, next);
  });

  const scoreByTag = new Map();
  const maxByTag = new Map();
  let matchedCount = 0;
  let missingLabelCount = 0;
  let missingOptionCount = 0;

  function add(map, tag, delta) {
    if (!tag) return;
    map.set(tag, (map.get(tag) || 0) + (Number(delta) || 0));
  }

  byKey.forEach(function(a) {
    const q = questionMap.get(String(a.id));
    if (!q || !q.answer) return;

    const label = labelIndex.get(a.key);
    if (!label) {
      missingLabelCount++;
      return;
    }
    matchedCount++;

    const bestUser = a.bestChoice;
    const worstUser = a.worstChoice;
    const bestStd = q.answer.best;
    const worstStd = q.answer.worst;

    const userBestVals = getOptionVals(label, bestUser);
    const userWorstVals = getOptionVals(label, worstUser);
    const stdBestVals = getOptionVals(label, bestStd);
    const stdWorstVals = getOptionVals(label, worstStd);

    missingOptionCount += (userBestVals.missing ? 1 : 0) + (userWorstVals.missing ? 1 : 0);
    missingOptionCount += (stdBestVals.missing ? 1 : 0) + (stdWorstVals.missing ? 1 : 0);

    add(scoreByTag, label.primary_tag, userBestVals.p);
    add(scoreByTag, label.secondary_tag, userBestVals.s);
    add(scoreByTag, label.primary_tag, -userWorstVals.p);
    add(scoreByTag, label.secondary_tag, -userWorstVals.s);

    add(maxByTag, label.primary_tag, stdBestVals.p);
    add(maxByTag, label.secondary_tag, stdBestVals.s);
    add(maxByTag, label.primary_tag, -stdWorstVals.p);
    add(maxByTag, label.secondary_tag, -stdWorstVals.s);
  });

  const tagsMap = new Map();
  scoreByTag.forEach(function(_, tag) { tagsMap.set(tag, 1); });
  maxByTag.forEach(function(_, tag) { tagsMap.set(tag, 1); });

  const list = [];
  tagsMap.forEach(function(_, tag) {
    const score = Number((scoreByTag.get(tag) || 0).toFixed(3));
    const max = Number((maxByTag.get(tag) || 0).toFixed(3));
    const rawPercent = max > 0 ? (score / max) * 100 : 0;
    const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
    list.push({ tag: tag, score: score, max: max, percent: percent });
  });
  list.sort(function(a, b) { return b.percent - a.percent; });

  return {
    list,
    meta: {
      uniqueAnsweredCount: byKey.size,
      matchedCount,
      missingLabelCount,
      missingOptionCount
    }
  };
}

module.exports = {
  normalizeQuestionKey,
  computeAbilityScores
};
