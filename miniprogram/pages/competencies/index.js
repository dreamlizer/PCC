// pages/competencies/index.js
const { getCurrentTheme } = require('../../services/theme');
const { getFontScaleClassByStorage } = require('../../services/typography');
const competenciesEn = require('./data.en');
const competenciesZh = require('./data.cn');

function getCopy(lang) {
  if (lang === 'en') {
    return {
      navTitle: 'Eight Core Competencies',
      pageTitle: 'Eight Core Competencies',
      pageSubtitle: 'Tap any competency to expand/collapse',
      definitionLabel: 'Definition: '
    };
  }
  return {
    navTitle: '八项核心能力',
    pageTitle: '八项核心能力',
    pageSubtitle: '点击任一核心能力可展开/折叠',
    definitionLabel: '定义：'
  };
}

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    fadeClass: '',
    theme: null,
    lang: 'zh',
    fontScaleClass: '',
    expandedId: '',
    labels: getCopy('zh'),
    competencies: competenciesZh
  },
  onShow() {
    if (this.applyFadeEnter) this.applyFadeEnter();
    this.setData({ theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
    wx.setNavigationBarTitle({ title: this.data.labels.navTitle });
  },
  toggleItem(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ expandedId: this.data.expandedId === id ? '' : id });
  },
  onLangTap() {
    const nextLang = this.data.lang === 'zh' ? 'en' : 'zh';
    const labels = getCopy(nextLang);
    this.setData({
      lang: nextLang,
      labels,
      competencies: nextLang === 'en' ? competenciesEn : competenciesZh
    });
    wx.setNavigationBarTitle({ title: labels.navTitle });
  }
});
