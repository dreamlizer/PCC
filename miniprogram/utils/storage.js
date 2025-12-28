// utils/storage.js
const KEYS = {
  favorites: 'favorites',
  bossRushHistory: 'bossRushHistory',
  bossRushLastAnswers: 'bossRushLastAnswers',
  legacyBossRushLastAnswers: 'bossrush_last_answers',
  // 离线缓存相关（题库）
  questionBankCache: 'questionBankCache',
  questionBankVersion: 'questionBankVersion',
};

const LIMITS = {
  bossRushHistoryMax: 50
};

function safeGet(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    return v !== undefined && v !== '' ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (e) {
    console.warn('写入本地缓存失败', key, e);
    return false;
  }
}

// Favorites
function getFavorites() {
  return safeGet(KEYS.favorites, []);
}

function isFavorite(id) {
  const favs = getFavorites();
  return favs.includes(id);
}

function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) {
    favs.splice(idx, 1);
  } else {
    favs.unshift(id);
  }
  safeSet(KEYS.favorites, favs);
  return favs;
}

// Boss Rush History
function getBossRushHistory() {
  const list = safeGet(KEYS.bossRushHistory, []);
  const max = Number(LIMITS.bossRushHistoryMax) || 50;
  if (Array.isArray(list) && list.length > max) {
    list.length = max;
    safeSet(KEYS.bossRushHistory, list);
  }
  return list;
}

function normalizeBossRushMode(mode, isPartial) {
  const raw = mode == null ? '' : String(mode);
  const lower = raw.toLowerCase();
  let normalizedMode = raw;
  if (raw === 'sequence' || raw === 'random') {
    normalizedMode = raw;
  } else if (lower.indexOf('random') >= 0) {
    normalizedMode = 'random';
  } else if (lower.indexOf('sequence') >= 0) {
    normalizedMode = 'sequence';
  } else {
    normalizedMode = 'sequence';
  }
  const normalizedPartial = !!isPartial || /partial/i.test(raw);
  return { mode: normalizedMode, is_partial: normalizedPartial };
}

function normalizeBossRushRecord(record) {
  const r = record || {};
  const total = Number(r && r.total_count) || 0;
  const answerLen = (r && Array.isArray(r.answers)) ? r.answers.length : 0;
  const questionCount = answerLen || Number(r && r.question_count) || (total ? Math.round(total / 2) : 0);
  const modeInfo = normalizeBossRushMode(r && r.mode, r && r.is_partial);
  const hasAnswers = !!(r && Array.isArray(r.answers) && r.answers.length);
  const out = Object.assign({}, r, modeInfo, { question_count: questionCount, has_answers: hasAnswers });
  if (r && Array.isArray(r.answers)) out.answers = r.answers;
  return out;
}

function addBossRushRecord(record) {
  const list = getBossRushHistory();
  list.unshift(normalizeBossRushRecord(record));
  const max = Number(LIMITS.bossRushHistoryMax) || 50;
  if (list.length > max) list.length = max;
  safeSet(KEYS.bossRushHistory, list);
  return list;
}

function getBossRushRecordByTimestamp(timestamp) {
  const ts = Number(timestamp);
  if (!ts) return null;
  const list = getBossRushHistory();
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item && Number(item.timestamp) === ts) return item;
  }
  return null;
}

function clearBossRushHistory() {
  return safeSet(KEYS.bossRushHistory, []);
}

// Boss Rush Last Answers (for review)
function getBossRushLastAnswers() {
  // 优先读取新键；若不存在则兼容旧键
  let v = safeGet(KEYS.bossRushLastAnswers, null);
  if (v === null) {
    try {
      const legacy = wx.getStorageSync(KEYS.legacyBossRushLastAnswers);
      v = Array.isArray(legacy) ? legacy : [];
    } catch (e) {
      v = [];
    }
  }
  return Array.isArray(v) ? v : [];
}

function setBossRushLastAnswers(list) {
  // 写入新键，并移除旧键，统一命名
  const ok = safeSet(KEYS.bossRushLastAnswers, Array.isArray(list) ? list : []);
  try { wx.removeStorageSync(KEYS.legacyBossRushLastAnswers); } catch (e) {}
  return ok;
}

module.exports = {
  getFavorites,
  isFavorite,
  toggleFavorite,
  getBossRushHistory,
  addBossRushRecord,
  getBossRushRecordByTimestamp,
  normalizeBossRushRecord,
  clearBossRushHistory,
  getBossRushLastAnswers,
  setBossRushLastAnswers,
  // 离线缓存导出：题库
  getCachedQuestions: () => safeGet(KEYS.questionBankCache, []),
  setCachedQuestions: (list) => safeSet(KEYS.questionBankCache, Array.isArray(list) ? list : []),
  getQuestionsVersion: () => safeGet(KEYS.questionBankVersion, ''),
  setQuestionsVersion: (ver) => safeSet(KEYS.questionBankVersion, String(ver || '')),
};
