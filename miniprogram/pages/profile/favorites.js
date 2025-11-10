// pages/profile/favorites.js
const { getFavorites } = require('../../utils/storage');

Page({
  data: {
    list: [], // { id, title }
  },

  async onShow() {
    const favs = getFavorites();
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    const questions = (app?.globalData?.questionBank) || [];
    const list = favs.map(id => {
      const q = questions.find(x => x.id === id);
      return { id, title: q ? (typeof q.title === 'string' ? q.title : (q.title?.zh || '')) : '' };
    });
    this.setData({ list });
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/practice/detail?id=${id}&state=analysis` });
  }
});