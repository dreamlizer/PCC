// pages/profile/favorites.js
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

function pad3(n) {
  const s = String(n);
  if (s.length >= 3) return s;
  if (s.length === 2) return '0' + s;
  return '00' + s;
}

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    list: [], // { id, number, display }
    theme: null,
    fadeClass: '',
    fontScaleClass: ''
  },

  onShow() {
    const favs = getFavorites();
    const app = getApp();
    const self = this;
    
    let bootstrap;
    try { bootstrap = require('../../services/bootstrap'); } catch (e) {}

    const render = function() {
      const questions = (app && app.globalData && app.globalData.questionBank) || [];
      const extractNum = function(val) {
        const m = String(val == null ? '' : val).match(/\d+/);
        return m ? parseInt(m[0], 10) : NaN;
      };
      // 仅保留基础题（排除 EN/E 尾号）；按题号数字升序展示 001/002...
      const items = favs
        .map(function(id) { return questions.find(function(x) { return x.id === id; }); })
        .filter(function(q) { return !!q && !isEnglishVariantNumber(q && q.number); })
        .sort(function(a, b) {
          const an = extractNum(a.number);
          const bn = extractNum(b.number);
          if (!isNaN(an) && !isNaN(bn)) return an - bn;
          if (!isNaN(an)) return -1;
          if (!isNaN(bn)) return 1;
          return String(a.number || a.id).localeCompare(String(b.number || b.id));
        })
        .map(function(q) {
          const numStr = String(q.number != null ? q.number : q.id);
          const m = numStr.match(/\d+/);
          const display = m ? pad3(parseInt(m[0], 10)) : numStr;
          return { id: q.id, number: q.number, display: display };
        });
      
      self.setData({ 
        list: items, 
        theme: getCurrentTheme(), 
        fadeClass: 'fade-enter', 
        fontScaleClass: getFontScaleClassByStorage() 
      });
    };

    if (bootstrap && bootstrap.awaitReady) {
      bootstrap.awaitReady(app).then(render).catch(function() { render(); });
    } else {
      render();
    }
  },

  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.idx;
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(function() {
      // 传递收藏上下文及索引，详情页将限制上一/下一在收藏集范围
      wx.navigateTo({ url: '/pages/practice/detail?id=' + id + '&state=analysis&scope=favorites&favIndex=' + idx });
    }, 500);
  }
});
