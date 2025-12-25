// pages/bossrush/report.js
const { getCurrentTheme } = require('../../services/theme');

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    mode: 'sequence',
    score: 0,
    bestRate: 0,
    worstRate: 0,
    duration: '00:00',
    total: 0,
    correctCount: 0,
    theme: null,
    fadeClass: ''
  },

  onLoad(options) {
    const { mode = 'sequence', score = 0, bestRate = 0, worstRate = 0, duration = '00:00', total = 0, correctCount = 0 } = options || {};
    this.setData({ 
      mode, 
      score: Number(score), 
      bestRate: Number(bestRate), 
      worstRate: Number(worstRate), 
      duration,
      total: Number(total),
      correctCount: Number(correctCount),
      theme: getCurrentTheme()
    });
  },
  onShow() {
    this.setData({ fadeClass: 'fade-enter' });
  },

  exit() {
    // 退出到主界面的“逐题练习”标签，避免回到 Boss Rush 再次进入答题态
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/practice/index' });
    }, 500);
  },
  gotoReview() {
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/bossrush/review' });
    }, 500);
  }
});
