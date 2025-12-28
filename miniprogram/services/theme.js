// 主题管理（代码分离）：统一维护主题列表与选择状态
// 提供：listThemes, getCurrentTheme, setCurrentTheme

const STORAGE_KEY = 'pcc_theme_id';
const DEFAULT_THEME_ID = 'navyGold';

// 2 套主题（默认 + 墨绿珊瑚）
const THEMES = [
  {
    id: 'navyGold',
    name: '默认',
    heroFrom: '#060E9F',
    heroTo: '#0F4C81',
    heroRgb: '6, 14, 159',
    accentFrom: '#FFBF3F',
    accentTo: '#FFD36A',
    accentRgb: '255, 191, 63',
    accentShadow: 'rgba(255, 191, 63, 0.18)',
    pageBg: '#FFFFFF',
    badgeBg: '#060E9F',
    cardBorder: '#FFBF3F',
    questionBg: '#EEF2F8'
  },
  {
    id: 'forestCoral',
    name: '墨绿珊瑚',
    heroFrom: '#0F3D2E',
    heroTo: '#0F3D2E',
    heroRgb: '15, 61, 46',
    accentFrom: '#E76F51',
    accentTo: '#E76F51',
    accentRgb: '231, 111, 81',
    accentShadow: 'rgba(231, 111, 81, 0.18)',
    pageBg: '#FFFFFF',
    badgeBg: '#0F3D2E',
    cardBorder: '#E76F51',
    questionBg: '#FFFFFF'
  }
];

function listThemes() {
  return THEMES.slice();
}

function getCurrentTheme() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY);
    const savedId = saved ? String(saved) : '';
    const canUseSaved = !!(savedId && THEMES.some(t => t.id === savedId));
    const id = canUseSaved ? savedId : DEFAULT_THEME_ID;
    return THEMES.find(t => t.id === id) || THEMES[0];
  } catch (_) {
    return THEMES[0];
  }
}

function setCurrentTheme(id) {
  const found = THEMES.find(t => t.id === id);
  if (!found) return false;
  try {
    wx.setStorageSync(STORAGE_KEY, id);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = {
  listThemes,
  getCurrentTheme,
  setCurrentTheme,
};
