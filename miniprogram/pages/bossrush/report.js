// pages/bossrush/report.js
const { getCurrentTheme } = require('../../services/theme');
const { getFontScaleClassByStorage } = require('../../services/typography');
const { getBossRushLastAnswers, getBossRushRecordByTimestamp, normalizeBossRushRecord } = require('../../utils/storage');
const { computeAbilityScores } = require('../../services/abilityScore');
const { getAbilityLabels } = require('../../services/abilityLabels');
const { buildAbilityWheelModel, drawAbilityWheel } = require('../../services/abilityWheel');

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    view: '',
    mode: 'sequence',
    isPartial: false,
    score: 0,
    bestRate: 0,
    worstRate: 0,
    duration: '00:00',
    total: 0,
    correctCount: 0,
    questionCount: 0,
    abilityList: [],
    abilityMeta: null,
    abilityWheel: null,
    abilityWheelSlots: [],
    theme: null,
    fadeClass: '',
    fontScaleClass: ''
  },

  onLoad(options) {
    const view = (options && options.view) ? String(options.view) : '';
    const ts = options && options.ts ? Number(options.ts) : 0;
    const theme = getCurrentTheme();
    const fontScaleClass = getFontScaleClassByStorage();

    if (view === 'ability') {
      try { wx.setNavigationBarTitle({ title: '能力平衡轮' }); } catch (_) {}
    }

    if (ts) {
      const rawRecord = getBossRushRecordByTimestamp(ts);
      if (!rawRecord) {
        wx.showToast({ title: '记录不存在', icon: 'none' });
        setTimeout(function() { wx.navigateBack({ delta: 1 }); }, 600);
        return;
      }
      const record = normalizeBossRushRecord(rawRecord);
      const total = Number(record && record.total_count) || 0;
      const questionCount = Number(record && record.question_count) || (total ? Math.round(total / 2) : 0);
      this._recordAnswers = (record && Array.isArray(record.answers)) ? record.answers : [];
      this.setData({
        view: view,
        mode: (record && record.mode) ? record.mode : 'sequence',
        isPartial: !!(record && record.is_partial),
        score: Number(record && record.score) || 0,
        bestRate: Number(record && record.best_rate) || 0,
        worstRate: Number(record && record.worst_rate) || 0,
        duration: (record && record.duration) ? record.duration : '00:00',
        total: total,
        correctCount: Number(record && record.correct_count) || 0,
        questionCount: questionCount,
        theme: theme,
        fontScaleClass: fontScaleClass
      });
    } else {
      const mode = options && options.mode ? options.mode : 'sequence';
      const score = options && options.score ? options.score : 0;
      const bestRate = options && options.bestRate ? options.bestRate : 0;
      const worstRate = options && options.worstRate ? options.worstRate : 0;
      const duration = options && options.duration ? options.duration : '00:00';
      const total = Number(options && options.total) || 0;
      const correctCount = Number(options && options.correctCount) || 0;
      const questionCount = Number(options && options.questionCount) || (total ? Math.round(total / 2) : 0);
      const isPartial = !!Number(options && options.isPartial);
      this._recordAnswers = null;
      this.setData({
        view: view,
        mode: mode,
        isPartial: isPartial,
        score: Number(score),
        bestRate: Number(bestRate),
        worstRate: Number(worstRate),
        duration: duration,
        total: total,
        correctCount: correctCount,
        questionCount: questionCount,
        theme: theme,
        fontScaleClass: fontScaleClass
      });
    }

    this.loadAbilityScores();
  },
  onShow() {
    this.setData({ fadeClass: 'fade-enter', fontScaleClass: getFontScaleClassByStorage() });
    this.drawAbilityWheelCanvas();
  },

  async loadAbilityScores() {
    const app = getApp();
    try {
      const bootstrap = require('../../services/bootstrap');
      if (bootstrap && bootstrap.awaitReady) {
        await bootstrap.awaitReady(app);
      }
    } catch (_) {}

    const questionBank = (app && app.globalData && app.globalData.questionBank) || [];
    const lastAnswers = this._recordAnswers !== null ? this._recordAnswers : getBossRushLastAnswers();
    if (this.data.view === 'ability' && Array.isArray(lastAnswers) && lastAnswers.length === 0) {
      wx.showToast({ title: '该记录暂无明细，无法生成平衡轮', icon: 'none' });
    }
    const labels = await getAbilityLabels({ preferCache: true });
    const res = computeAbilityScores({ lastAnswers, questionBank, labels });
    const theme = this.data.theme || getCurrentTheme();
    const wheel = buildAbilityWheelModel(res.list || [], theme);
    this.setData({ abilityList: res.list || [], abilityMeta: res.meta || null, abilityWheel: wheel, abilityWheelSlots: (wheel && wheel.slots) || [] });
    this.drawAbilityWheelCanvas();
  },

  drawAbilityWheelCanvas() {
    const self = this;
    if (!wx || !wx.createSelectorQuery) return;
    if (!this.data.abilityWheel || !this.data.abilityWheel.items) return;
    setTimeout(function() {
      try {
        wx.createSelectorQuery().in(self).select('.ability-wheel').boundingClientRect().select('#abilityWheel').node().exec(function(res) {
          if (!res || res.length < 2) return;
          const rect = res[0];
          const nodeRes = res[1];
          const canvas = nodeRes && nodeRes.node;
          const size = rect && rect.width ? rect.width : 0;
          if (!canvas || !size) return;
          drawAbilityWheel(canvas, size, self.data.abilityWheel, self.data.theme || getCurrentTheme());
        });
      } catch (_) {}
    }, 0);
  },

  exit() {
    // 从历史进入则返回上一页；从本次战报进入则回到主界面
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      if (this.data.view === 'ability') {
        wx.navigateBack({ delta: 1 });
      } else {
        wx.reLaunch({ url: '/pages/practice/index' });
      }
    }, 500);
  },
  gotoReview() {
    this.setData({ fadeClass: 'fade-leave' });
    setTimeout(() => {
      wx.navigateTo({ url: '/pages/bossrush/review' });
    }, 500);
  }
});
