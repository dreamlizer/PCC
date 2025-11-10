// 主题管理（代码分离）：统一维护主题列表与选择状态
// 提供：listThemes, getCurrentTheme, setCurrentTheme

const STORAGE_KEY = 'pcc_theme_id';

// 5 套主题（四字命名）
const THEMES = [
  {
    id: 'forest',
    name: '松涛远翠',
    heroFrom: '#1F2A44',
    heroTo: '#2FB3A9',
    pageBg: '#F7F9FC',
    badgeBg: '#1F2A44',
    cardBorder: '#2FB3A9'
  },
  {
    id: 'ocean',
    name: '沧海晨光',
    heroFrom: '#0F4C81',
    heroTo: '#56CCF2',
    pageBg: '#F7FAFF',
    badgeBg: '#0F4C81',
    cardBorder: '#56CCF2'
  },
  {
    id: 'sunrise',
    name: '朝晖流金',
    heroFrom: '#D35400',
    heroTo: '#F1C40F',
    pageBg: '#FFF8E6',
    badgeBg: '#8E4400',
    cardBorder: '#F1C40F'
  },
  {
    id: 'violet',
    name: '霁蓝暮霞',
    heroFrom: '#1B2A49',
    heroTo: '#6C63FF',
    pageBg: '#F7F7FF',
    badgeBg: '#1B2A49',
    cardBorder: '#6C63FF'
  },
  {
    id: 'ink',
    name: '墨影云锦',
    heroFrom: '#232526',
    heroTo: '#414345',
    pageBg: '#F5F6F7',
    badgeBg: '#232526',
    cardBorder: '#7F8C8D'
  }
];

function listThemes() {
  return THEMES.slice();
}

function getCurrentTheme() {
  try {
    const id = wx.getStorageSync(STORAGE_KEY) || THEMES[0].id;
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