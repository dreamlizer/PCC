// pages/bossrush/review.js
Page({
  data: {
    list: [], // { id, title, isBestCorrect, isWorstCorrect }
    showWrongOnly: false,
  },

  async onLoad() {
    const answers = wx.getStorageSync('bossrush_last_answers') || [];
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    const questions = (app?.globalData?.questionBank) || [];
    const list = answers.map(a => {
      const q = questions.find(x => x.id === a.id);
      return {
        id: a.id,
        title: q ? (typeof q.title === 'string' ? q.title : (q.title?.zh || '')) : '',
        isBestCorrect: a.isBestCorrect,
        isWorstCorrect: a.isWorstCorrect,
        wrong: !(a.isBestCorrect && a.isWorstCorrect),
      };
    });
    this.setData({ list });
  },

  toggleWrongOnly() {
    this.setData({ showWrongOnly: !this.data.showWrongOnly });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/practice/detail?id=${id}&state=analysis` });
  }
});