// pages/bossrush/history.js
const { getBossRushHistory, clearBossRushHistory } = require('../../utils/storage');
const { getCurrentTheme } = require('../../services/theme');
const { getFontScaleClassByStorage } = require('../../services/typography');

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    list: [],
    theme: null,
    fadeClass: '',
    fontScaleClass: ''
  },
  onShow() {
    const theme = getCurrentTheme();
    const list = getBossRushHistory();
    this.setData({ theme, list, fadeClass: 'fade-enter', fontScaleClass: getFontScaleClassByStorage() });
  },
  gotoReview(e) {
    // 进入 Boss Rush 的复盘页面（按记录本身不传参，复盘页读取最新答题集）
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/bossrush/review' });
    }, 500);
  },

  onClear() {
    wx.showModal({
      title: '清空挑战记录',
      content: '确定要清空所有挑战记录吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#D32F2F',
      success: (res) => {
        if (res.confirm) {
          if (clearBossRushHistory()) {
            this.setData({ list: [] });
            wx.showToast({ title: '已清空', icon: 'success' });
          } else {
            wx.showToast({ title: '清空失败', icon: 'none' });
          }
        }
      }
    });
  }
});
