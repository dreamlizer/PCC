// pages/profile/index.js
const { getBossRushHistory, getFavorites } = require('../../utils/storage');
const { listThemes, getCurrentTheme, setCurrentTheme } = require('../../services/theme');
const { getFontScale, setFontScale, getFontScaleClassByStorage, getFontScaleClass } = require('../../services/typography');

Page({
  behaviors: [require('../../behaviors/share')],
  data: {
    history: [],
    favoritesCount: 0,
    themes: [],
    themeId: '',
    drawerVisible: false,
    theme: null,
    fadeClass: '',
    fontScale: 2,
    fontScaleClass: ''
  },

  onShow() {
    const history = getBossRushHistory();
    const favorites = getFavorites();
    const themes = listThemes();
    const current = getCurrentTheme();
    const fontScale = getFontScale();
    const fontScaleClass = getFontScaleClassByStorage();
    this.setData({ history, favoritesCount: favorites.length, themes, themeId: current.id, theme: current, fadeClass: 'fade-enter', fontScale, fontScaleClass });
  },

  openReview(e) {
    const idx = e.currentTarget.dataset.idx;
    // 跳转到复盘列表页（复用 Boss Rush 的 review 页面）
    // 改为进入“挑战记录”完整列表页，并加淡出过渡
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/bossrush/history' });
    }, 500);
  },

  openFavorites() {
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/profile/favorites' });
    }, 500);
  },

  openDrawer() { this.setData({ drawerVisible: true }); },
  onCloseDrawer() { this.setData({ drawerVisible: false }); },
  onSelectTheme(e) {
    const id = e.detail.id;
    if (setCurrentTheme(id)) {
      const current = getCurrentTheme();
      this.setData({ themeId: id, drawerVisible: false, theme: current });
      wx.showToast({ title: '主题已切换', icon: 'success' });
      const app = getApp();
      try { app.globalData.theme = getCurrentTheme(); } catch (_) {}
    } else {
      wx.showToast({ title: '切换失败', icon: 'error' });
    }
  },

  // 字体大小按钮：四档 (1-4)，默认 2
  onFontTap(e) {
    const v = Number(e.currentTarget.dataset.scale || 2);
    const scale = setFontScale(v);
    const cls = getFontScaleClass(scale);
    this.setData({ fontScale: scale, fontScaleClass: cls });
    // wx.showToast({ title: `字体：${scale}/4`, icon: 'none' });
  }
});
