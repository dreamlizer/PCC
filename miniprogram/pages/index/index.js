// pages/index/index.js
const { getCurrentTheme } = require('../../services/theme');
const { getFontScaleClassByStorage } = require('../../services/typography');

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    fadeClass: '',
    theme: null,
    fontScaleClass: ''
  },

  onShow() {
    if (this.applyFadeEnter) this.applyFadeEnter();
    this.setData({ theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
  },

  goExam() {
    this.applyFadeLeaveThen(() => {
      wx.navigateTo({ url: '/pages/bossrush/index' });
    }, 500);
  },

  goCompetencies() {
    this.applyFadeLeaveThen(() => {
      wx.navigateTo({ url: '/pages/competencies/index' });
    }, 500);
  },

  goPractice() {
    this.applyFadeLeaveThen(() => {
      wx.navigateTo({ url: '/pages/practice/index' });
    }, 500);
  },

  goProfile() {
    this.applyFadeLeaveThen(() => {
      wx.navigateTo({ url: '/pages/profile/index' });
    }, 500);
  }
});
