// pages/index/index.js
Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    fadeClass: ''
  },

  onShow() {
    if (this.applyFadeEnter) this.applyFadeEnter();
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
