// pages/framework/index.js
Page({
  data: {
    title: 'MCC/PCC笔试9级框架',
    sections: [],
    theme: null
  },

  async onLoad() {
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    const framework = (app?.globalData?.framework) || null;
    if (framework && Array.isArray(framework.sections)) {
      const sections = framework.sections.map(s => {
        const t = String(s.title || '');
        const t2 = t.replace(/^\s*(\d+)\s*级/, (m, num) => `level-${num}`);
        return Object.assign({}, s, { title: t2 });
      });
      this.setData({ sections });
    }

    // 设置主题
    const { getCurrentTheme } = require('../../services/theme');
    this.setData({ theme: getCurrentTheme() });
  }
  ,
  onShow() {
    const { getCurrentTheme } = require('../../services/theme');
    this.setData({ theme: getCurrentTheme() });
    try {
      if (this.getTabBar && this.getTabBar()) {
        this.getTabBar().setSelected(0);
      }
    } catch (_) {}
  }
});