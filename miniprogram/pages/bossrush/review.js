// pages/bossrush/review.js
const { getCurrentTheme } = require('../../services/theme');
const { getBossRushLastAnswers, getBossRushRecordByTimestamp, normalizeBossRushRecord } = require('../../utils/storage');
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

  onLoad(options) {
    const ts = options && options.ts ? Number(options.ts) : 0;
    const rawRecord = ts ? getBossRushRecordByTimestamp(ts) : null;
    const record = rawRecord ? normalizeBossRushRecord(rawRecord) : null;
    if (ts && !record) {
      this.setData({ list: [], theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
      wx.showToast({ title: '记录不存在', icon: 'none' });
      return;
    }
    const answers = ts
      ? ((record && Array.isArray(record.answers)) ? record.answers : [])
      : getBossRushLastAnswers();
    const app = getApp();
    const self = this;
    
    // 兼容处理
    let bootstrap;
    try { bootstrap = require('../../services/bootstrap'); } catch (e) {}

    const render = function() {
      const questions = (app && app.globalData && app.globalData.questionBank) || [];
      if (ts && answers.length === 0) {
        wx.showToast({ title: '该记录暂无复盘明细', icon: 'none' });
      }
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
