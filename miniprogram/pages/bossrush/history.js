// pages/bossrush/history.js
const { getBossRushHistory, clearBossRushHistory, normalizeBossRushRecord } = require('../../utils/storage');
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
    const raw = getBossRushHistory();
    const list = (raw || []).map(function(r) {
      return normalizeBossRushRecord(r);
    });
    this.setData({ theme, list, fadeClass: 'fade-enter', fontScaleClass: getFontScaleClassByStorage() });
  },
  gotoReview(e) {
    const ts = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.ts : '';
    const rawHas = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.has : null;
    const has = rawHas === true || rawHas === 1 || rawHas === '1' || rawHas === 'true';
    if (!has) {
      wx.showToast({ title: '该记录暂无明细', icon: 'none' });
      return;
    }
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/bossrush/review?ts=' + ts });
    }, 500);
  },
  gotoWheel(e) {
    const ts = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.ts : '';
    const rawHas = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.has : null;
    const has = rawHas === true || rawHas === 1 || rawHas === '1' || rawHas === 'true';
    if (!has) {
      wx.showToast({ title: '该记录暂无明细', icon: 'none' });
      return;
    }
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/bossrush/report?view=ability&ts=' + ts });
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
