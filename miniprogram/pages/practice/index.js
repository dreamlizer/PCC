// pages/practice/index.js（列表页）
const { getFavorites } = require('../../utils/storage');

Page({
  data: {
    list: [], // { id, number, favored }
  },

  buildList() {
    const app = getApp();
    const questions = (app?.globalData?.questionBank) || [];
    const favs = getFavorites();
    // 仅在存在 number 时参与排序；否则按 id 排
    const sorted = questions.slice().sort((a, b) => {
      const an = a.number != null ? String(a.number).padStart(3, '0') : String(a.id);
      const bn = b.number != null ? String(b.number).padStart(3, '0') : String(b.id);
      return an.localeCompare(bn);
    });
    const list = sorted.map(q => ({ id: q.id, number: q.number != null ? q.number : q.id, favored: favs.includes(q.id) }));
    this.setData({ list });
  },

  async onLoad() {
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    this.buildList();
  },

  async onShow() {
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    this.buildList();
    try {
      if (this.getTabBar && this.getTabBar()) {
        this.getTabBar().setSelected(1);
      }
    } catch (_) {}
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/practice/detail?id=${id}` });
  }
});