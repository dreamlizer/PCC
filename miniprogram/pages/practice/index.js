// pages/practice/index.js（列表页）
const { getFavorites } = require('../../utils/storage');
const { getCurrentTheme } = require('../../services/theme');
const { getFontScaleClassByStorage } = require('../../services/typography');

function isEnglishVariantNumber(num) {
  const s = String(num || '').trim();
  if (!s) return false;
  if (/[\(\（]\s*EN\s*[\)\）]$/i.test(s)) return true;
  if (/[\(\（]\s*E\s*[\)\）]$/i.test(s)) return true;
  return /(EN|E)$/i.test(s);
}

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    list: [], // { id, number, favored }
    theme: null,
    fadeClass: '',
    fontScaleClass: ''
  },

  buildList() {
    const app = getApp();
    const questions = (app?.globalData?.questionBank) || [];
    const favs = getFavorites();
    // 过滤：逐题列表不展示英文题（尾号 EN 或 E），仅保留基础题（如 "ICF-001"）
    const baseOnly = questions.filter(q => !isEnglishVariantNumber(q && q.number));
    // 排序规则：优先按题号中的数字部分升序（兼容如 "ICF-001"），
    // 若无法解析数字，则按字符串比较确保稳定顺序。
    const extractNum = (val) => {
      const m = String(val == null ? '' : val).match(/\d+/);
      return m ? parseInt(m[0], 10) : NaN;
    };
    const sorted = baseOnly.slice().sort((a, b) => {
      const aStr = String(a.number != null ? a.number : a.id);
      const bStr = String(b.number != null ? b.number : b.id);
      
      // Priority 1: ICF-001 series first
      const aIsIcf = /^icf-/i.test(aStr);
      const bIsIcf = /^icf-/i.test(bStr);
      if (aIsIcf && !bIsIcf) return -1;
      if (!aIsIcf && bIsIcf) return 1;

      // Priority 2: Numeric value
      const an = extractNum(a.number);
      const bn = extractNum(b.number);
      
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      if (!isNaN(an)) return -1;
      if (!isNaN(bn)) return 1;
      return aStr.localeCompare(bStr);
    });
    const list = sorted.map(q => ({ id: q.id, number: q.number != null ? q.number : q.id, favored: favs.includes(q.id) }));
    this.setData({ list });
  },

  onLoad() {
    const app = getApp();
    const self = this;
    
    let bootstrap;
    try { bootstrap = require('../../services/bootstrap'); } catch (e) {}

    const init = function() {
      self.setData({ theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
      self.buildList();
    };

    if (bootstrap && bootstrap.awaitReady) {
      bootstrap.awaitReady(app).then(init).catch(function() { init(); });
    } else {
      init();
    }
  },

  onShow() {
    const app = getApp();
    const self = this;
    
    let bootstrap;
    try { bootstrap = require('../../services/bootstrap'); } catch (e) {}

    const init = function() {
      self.setData({ theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
      if (self.applyFadeEnter) self.applyFadeEnter();
      self.buildList();
    };

    if (bootstrap && bootstrap.awaitReady) {
      bootstrap.awaitReady(app).then(init).catch(function() { init(); });
    } else {
      init();
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    this.applyFadeLeaveThen(() => {
      wx.navigateTo({ url: `/pages/practice/detail?id=${id}` });
    }, 500);
  }
});
