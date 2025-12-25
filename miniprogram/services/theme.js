// 主题管理（代码分离）：统一维护主题列表与选择状态
// 提供：listThemes, getCurrentTheme, setCurrentTheme

const STORAGE_KEY = 'pcc_theme_id';
const DEFAULT_THEME_ID = 'navyGold';

// 3 套主题（四字命名）
const THEMES = [
  {
    id: 'navyGold',
    name: '默认',
    heroFrom: '#060E9F',
    heroTo: '#0F4C81',
    accentFrom: '#FFBF3F',
    accentTo: '#FFD36A',
    accentShadow: 'rgba(255, 191, 63, 0.18)',
    pageBg: '#FFFFFF',
    badgeBg: '#060E9F',
    cardBorder: '#FFBF3F',
    questionBg: '#EEF2F8'
  },
  {
    id: 'sunrise',
    name: '朝晖流金',
    heroFrom: '#D35400',
    heroTo: '#F1C40F',
    accentFrom: '#FF6B35',
    accentTo: '#FF4D6D',
    accentShadow: 'rgba(255, 77, 109, 0.18)',
    pageBg: '#FFF8E6',
    badgeBg: '#8E4400',
    cardBorder: '#F1C40F',
    questionBg: '#FFF3E0'
  },
  {
    id: 'ink',
    name: '墨影云锦',
    heroFrom: '#232526',
    heroTo: '#414345',
    accentFrom: '#6C5CE7',
    accentTo: '#00D2D3',
    accentShadow: 'rgba(108, 92, 231, 0.22)',
    pageBg: '#F5F6F7',
    badgeBg: '#232526',
    cardBorder: '#7F8C8D',
    questionBg: '#FAFAFA'
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
