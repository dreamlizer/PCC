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
  return safeGet(KEYS.bossRushHistory, []);
}

function addBossRushRecord(record) {
  const list = getBossRushHistory();
  list.unshift(record);
  safeSet(KEYS.bossRushHistory, list);
  return list;
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
  clearBossRushHistory,
  getBossRushLastAnswers,
  setBossRushLastAnswers,
  // 离线缓存导出：题库
  getCachedQuestions: () => safeGet(KEYS.questionBankCache, []),
  setCachedQuestions: (list) => safeSet(KEYS.questionBankCache, Array.isArray(list) ? list : []),
  getQuestionsVersion: () => safeGet(KEYS.questionBankVersion, ''),
  setQuestionsVersion: (ver) => safeSet(KEYS.questionBankVersion, String(ver || '')),
};
