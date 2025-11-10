// pages/profile/index.js
const { getBossRushHistory, getFavorites } = require('../../utils/storage');
const { listThemes, getCurrentTheme, setCurrentTheme } = require('../../services/theme');

Page({
  data: {
    history: [],
    favoritesCount: 0,
    themes: [],
    themeId: '',
    drawerVisible: false,
    theme: null
  },

  onShow() {
    const history = getBossRushHistory();
    const favorites = getFavorites();
    const themes = listThemes();
    const current = getCurrentTheme();
    this.setData({ history, favoritesCount: favorites.length, themes, themeId: current.id, theme: current });
    try {
      if (this.getTabBar && this.getTabBar()) {
        this.getTabBar().setSelected(3);
      }
    } catch (_) {}
  },

  openReview(e) {
    const idx = e.currentTarget.dataset.idx;
    // 跳转到复盘列表页（复用 Boss Rush 的 review 页面）
    wx.navigateTo({ url: '/pages/bossrush/review' });
  },

  openFavorites() {
    wx.navigateTo({ url: '/pages/profile/favorites' });
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
  }
});