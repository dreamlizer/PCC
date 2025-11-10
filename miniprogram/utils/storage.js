// utils/storage.js
const KEYS = {
  favorites: 'favorites',
  bossRushHistory: 'bossRushHistory',
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

module.exports = {
  getFavorites,
  isFavorite,
  toggleFavorite,
  getBossRushHistory,
  addBossRushRecord,
};