// pages/competencies/index.js
Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    fadeClass: ''
  },
  onShow() {
    if (this.applyFadeEnter) this.applyFadeEnter();
  }
});
