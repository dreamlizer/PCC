// pages/bossrush/report.js
Page({
  data: {
    mode: 'sequence',
    score: 0,
    bestRate: 0,
    worstRate: 0,
    duration: '00:00',
  },

  onLoad(options) {
    const { mode = 'sequence', score = 0, bestRate = 0, worstRate = 0, duration = '00:00' } = options || {};
    this.setData({ mode, score: Number(score), bestRate: Number(bestRate), worstRate: Number(worstRate), duration });
  },

  exit() {
    wx.switchTab({ url: '/pages/bossrush/index' });
  },
  gotoReview() {
    wx.navigateTo({ url: '/pages/bossrush/review' });
  }
});