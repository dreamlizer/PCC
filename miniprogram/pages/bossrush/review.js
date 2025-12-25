// pages/bossrush/review.js
const { getCurrentTheme } = require('../../services/theme');
const { getBossRushLastAnswers } = require('../../utils/storage');
const { getFontScaleClassByStorage } = require('../../services/typography');

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    list: [], // { id, title, isBestCorrect, isWorstCorrect }
    showWrongOnly: false,
    theme: null,
    fadeClass: '',
    fontScaleClass: ''
  },

  onLoad() {
    const answers = getBossRushLastAnswers();
    const app = getApp();
    const self = this;
    
    // 兼容处理
    let bootstrap;
    try { bootstrap = require('../../services/bootstrap'); } catch (e) {}

    const render = function() {
      const questions = (app && app.globalData && app.globalData.questionBank) || [];
      const list = answers.map(function(a) {
        const q = questions.find(function(x) { return x.id === a.id; });
        const title = q ? (typeof q.title === 'string' ? q.title : ((q.title && q.title.zh) || '')) : '';
        return {
          id: a.id,
          title: title,
          isBestCorrect: a.isBestCorrect,
          isWorstCorrect: a.isWorstCorrect,
          wrong: !(a.isBestCorrect && a.isWorstCorrect),
        };
      });
      self.setData({ list: list, theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
      if (self.applyFadeEnter) self.applyFadeEnter();

      // 若本次只做了一道题，直接进入该题的“答案解析”界面
      // 移至此处（onLoad/render）执行，避免 onShow 中的无限循环
      if (list.length === 1) {
        const only = list[0];
        // 延迟一点执行，让页面先显示出来，避免视觉突变
        setTimeout(function() {
          self.applyFadeLeaveThen(function() {
            wx.navigateTo({ url: `/pages/practice/detail?id=${only.id}&state=analysis` });
          }, 500);
        }, 300);
      }
    };

    if (bootstrap && bootstrap.awaitReady) {
      bootstrap.awaitReady(app).then(render).catch(function() { render(); });
    } else {
      render();
    }
  },

  toggleWrongOnly() {
    this.setData({ showWrongOnly: !this.data.showWrongOnly });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    const self = this;
    self.applyFadeLeaveThen(function() {
      wx.navigateTo({ url: `/pages/practice/detail?id=${id}&state=analysis` });
    }, 500);
  }
});
