// pages/bossrush/index.js
const { addBossRushRecord, setBossRushLastAnswers } = require('../../utils/storage');
const { getCurrentTheme } = require('../../services/theme');
const { getFontScaleClassByStorage } = require('../../services/typography');

function resolveText(text, lang) {
  if (typeof text === 'string') return text;
  if (text && typeof text === 'object') return text[lang] || text.zh || '';
  return '';
}

function isEnglishVariantNumber(num) {
  const s = String(num || '').trim();
  if (!s) return false;
  if (/[\(\（]\s*EN\s*[\)\）]$/i.test(s)) return true;
  if (/[\(\（]\s*E\s*[\)\）]$/i.test(s)) return true;
  return /(EN|E)$/i.test(s);
}

function stripEnglishSuffix(num) {
  let s = String(num || '').trim();
  if (!s) return '';
  s = s.replace(/[\(\（]\s*EN\s*[\)\）]$/i, '');
  s = s.replace(/[\(\（]\s*E\s*[\)\）]$/i, '');
  s = s.replace(/(EN|E)$/i, '');
  return s.trim();
}

function locateEnglishByNumber(baseQuestion, bank) {
  for (let i = 0; i < (bank || []).length; i++) {
    const cand = bank[i];
    if (!isEnglishVariantNumber(cand && cand.number)) continue;
    if (stripEnglishSuffix(cand.number).toUpperCase() === stripEnglishSuffix(baseQuestion && baseQuestion.number).toUpperCase()) {
      return cand;
    }
  }
  return null;
}

function mergeBilingualQuestion(qZh, qEn) {
  const merged = Object.assign({}, qZh);

  const zhTitle = resolveText(qZh && qZh.title, 'zh');
  const enTitle = qEn ? resolveText(qEn.title, 'en') : '';
  merged.title = enTitle ? { zh: zhTitle, en: enTitle } : (typeof (qZh && qZh.title) === 'object' ? qZh.title : zhTitle);

  if (Array.isArray(qZh && qZh.options)) {
    merged.options = qZh.options.map(function(opt, idx) {
      const zhText = resolveText(opt && opt.text, 'zh');
      const optEn = qEn && Array.isArray(qEn.options) ? qEn.options[idx] : null;
      const enText = optEn ? resolveText(optEn.text, 'en') : '';
      const nextOpt = Object.assign({}, opt);
      nextOpt.text = enText ? { zh: zhText, en: enText } : (typeof (opt && opt.text) === 'object' ? opt.text : zhText);
      return nextOpt;
    });
  }

  return merged;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function pad2(n) {
  const s = String(n);
  return s.length >= 2 ? s : ('0' + s);
}

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const mm = pad2(Math.floor(s / 60));
  const ss = pad2(s % 60);
  return mm + ':' + ss;
}

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],
  data: {
    phase: 'mode', // mode | answer
    mode: '', // sequence | random
    questions: [],
    order: [],
    currentIndex: 0,
    question: null,
    lang: 'zh',
    isBilingual: false,
    bestChoice: '',
    worstChoice: '',
    answers: {}, // id -> {best, worst}
    startTs: 0,
    elapsed: '00:00',
    timerId: 0,
    theme: null,
    fadeClass: '',
    fontScaleClass: ''
  },

  // 统一重置：离开页面或再次进入 Boss Rush 时均回到模式选择
  resetSession() {
    if (this.data.timerId) clearInterval(this.data.timerId);
    this.setData({
      phase: 'mode',
      mode: '',
      order: [],
      currentIndex: 0,
      question: null,
      lang: 'zh',
      isBilingual: false,
      bestChoice: '',
      worstChoice: '',
      answers: {},
      startTs: 0,
      elapsed: '00:00',
      timerId: 0,
    });
  },

  onLoad() {
    const app = getApp();
    const self = this;
    
    // 兼容处理：确保 Bootstrap 服务已加载
    let bootstrap;
    try {
      bootstrap = require('../../services/bootstrap');
    } catch (e) {
      console.error('Bootstrap load failed', e);
    }

    if (bootstrap && bootstrap.awaitReady) {
      bootstrap.awaitReady(app).then(function() {
        // 数据就绪后的逻辑
        const bank = (app && app.globalData && app.globalData.questionBank) || [];
        self.bankQuestions = bank;
        const questions = bank
          .filter(function(q) { return !isEnglishVariantNumber(q && q.number); })
          .map(function(q) { return mergeBilingualQuestion(q, locateEnglishByNumber(q, bank)); });
        self.setData({ 
          questions: questions, 
          theme: getCurrentTheme(), 
          fontScaleClass: getFontScaleClassByStorage() 
        });
      }).catch(function(err) {
        console.error('Data ready error', err);
        // 即使出错也尝试获取现有数据
        const bank = (app && app.globalData && app.globalData.questionBank) || [];
        self.bankQuestions = bank;
        const questions = bank
          .filter(function(q) { return !isEnglishVariantNumber(q && q.number); })
          .map(function(q) { return mergeBilingualQuestion(q, locateEnglishByNumber(q, bank)); });
        self.setData({ 
          questions: questions, 
          theme: getCurrentTheme(), 
          fontScaleClass: getFontScaleClassByStorage() 
        });
      });
    } else {
      // 降级处理
      const bank = (app && app.globalData && app.globalData.questionBank) || [];
      this.bankQuestions = bank;
      const questions = bank
        .filter(function(q) { return !isEnglishVariantNumber(q && q.number); })
        .map(function(q) { return mergeBilingualQuestion(q, locateEnglishByNumber(q, bank)); });
      this.setData({ 
        questions: questions, 
        theme: getCurrentTheme(), 
        fontScaleClass: getFontScaleClassByStorage() 
      });
    }
  },

  onShow() {
    this.setData({ theme: getCurrentTheme(), fontScaleClass: getFontScaleClassByStorage() });
    this.applyFadeEnter();
  },

  onHide() {
    // 页面不可见时重置为模式选择，避免用户回到答题中的残留状态
    this.resetSession();
  },

  onUnload() {
    if (this.data.timerId) clearInterval(this.data.timerId);
  },

  // 阶段控制
  startMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const all = this.data.questions.map(function(q) { return q.id; });
    const order = mode === 'random' ? shuffle(all) : all;
    const q0 = this.data.questions.find(function(q) { return q.id === order[0]; });
    const isBilingual = !!(q0 && q0.title && typeof q0.title === 'object' && q0.title.en);
    this.setData({
      phase: 'answer',
      mode,
      order,
      currentIndex: 0,
      question: q0,
      isBilingual,
      lang: 'zh',
      bestChoice: '',
      worstChoice: '',
      answers: {},
      startTs: Date.now(),
      elapsed: '00:00',
    });
    const self = this;
    const timerId = setInterval(function() {
      const elapsed = fmt(Date.now() - self.data.startTs);
      self.setData({ elapsed: elapsed });
    }, 1000);
    this.setData({ timerId });
  },

  switchLang() {
    if (!this.data.isBilingual) return;
    this.setData({ lang: this.data.lang === 'zh' ? 'en' : 'zh' });
  },

  pickBest(e) {
    const id = e.currentTarget.dataset.id;
    // 互斥逻辑：如果该选项已选为最差，则清除最差
    let updates = { bestChoice: id };
    if (this.data.worstChoice === id) {
      updates.worstChoice = '';
    }
    this.setData(updates);
  },
  pickWorst(e) {
    const id = e.currentTarget.dataset.id;
    // 互斥逻辑：如果该选项已选为最佳，则清除最佳
    let updates = { worstChoice: id };
    if (this.data.bestChoice === id) {
      updates.bestChoice = '';
    }
    this.setData(updates);
  },

  saveCurrentAnswer() {
    const q = this.data.question;
    if (!q) return;
    const answers = Object.assign({}, this.data.answers);
    answers[q.id] = { best: this.data.bestChoice, worst: this.data.worstChoice };
    this.setData({ answers });
  },

  next() {
    if (!this.data.bestChoice || !this.data.worstChoice) {
      wx.showToast({ title: '请选择最佳与最差', icon: 'none' });
      return;
    }
    this.saveCurrentAnswer();
    const nextIdx = this.data.currentIndex + 1;
    if (nextIdx >= this.data.order.length) {
      this.finish();
      return;
    }
    const qId = this.data.order[nextIdx];
    const q = this.data.questions.find(function(x) { return x.id === qId; });
    const isBilingual = !!(q && q.title && typeof q.title === 'object' && q.title.en);
    this.setData({
      currentIndex: nextIdx,
      question: q,
      isBilingual,
      lang: 'zh',
      bestChoice: '',
      worstChoice: '',
    });
    // Scroll to top
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  stopEarly() {
    const self = this;
    wx.showModal({
      title: '结束挑战',
      content: '确定要提前结束吗？将只统计已作答的题目。',
      success: function(res) {
        if (res.confirm) {
          self.saveCurrentAnswer();
          self.finish(true);
        }
      }
    });
  },

  finish(isEarly) {
    if (typeof isEarly === 'undefined') isEarly = false;
    if (!isEarly) this.saveCurrentAnswer();
    if (this.data.timerId) clearInterval(this.data.timerId);
    const duration = fmt(Date.now() - this.data.startTs);
    
    // Determine which questions were answered
    const answeredIds = Object.keys(this.data.answers);
    const questionCount = answeredIds.length;
    const totalAnswerCount = questionCount * 2; // 题目数 * 2 (最佳+最差)

    if (questionCount === 0) {
      wx.showToast({ title: '未作答任何题目', icon: 'none' });
      this.setData({ phase: 'mode' });
      return;
    }

    let correctBest = 0;
    let correctWorst = 0;
    // let correctBoth = 0; // 不再强调全对
    
    // Only review answered questions
    const self = this;
    const reviewList = answeredIds.map(function(id) {
      const q = self.data.questions.find(function(x) { return x.id === id; });
      const sel = self.data.answers[id];
      if (!q || !sel) return null;
      const isBestCorrect = sel.best === q.answer.best;
      const isWorstCorrect = sel.worst === q.answer.worst;
      if (isBestCorrect) correctBest++;
      if (isWorstCorrect) correctWorst++;
      // if (isBestCorrect && isWorstCorrect) correctBoth++;
      return {
        id,
        bestChoice: sel.best,
        worstChoice: sel.worst,
        isBestCorrect,
        isWorstCorrect
      };
    }).filter(function(x) { return !!x; });

    const totalCorrectAnswers = correctBest + correctWorst;
    const overallScore = Math.round((totalCorrectAnswers / totalAnswerCount) * 100);
    const bestRate = Math.round((correctBest / questionCount) * 100);
    const worstRate = Math.round((correctWorst / questionCount) * 100);

    // 保存到历史（包含答题明细，便于“挑战记录”里回看能力平衡轮/复盘）
    addBossRushRecord({
      timestamp: Date.now(),
      mode: this.data.mode,
      is_partial: !!isEarly,
      score: overallScore,
      best_rate: bestRate,
      worst_rate: worstRate,
      correct_count: totalCorrectAnswers,
      total_count: totalAnswerCount,
      question_count: questionCount,
      duration: duration,
      answers: reviewList
    });

    // 暂存复盘数据
    setBossRushLastAnswers(reviewList);

    // 重置为模式选择（即便用户通过返回回到本页，也从模式选择开始）
    this.resetSession();

    // 跳转战报页前淡出过渡
    this.applyFadeLeaveThen(function() {
      wx.navigateTo({
        url: '/pages/bossrush/report?mode=' + self.data.mode +
          '&score=' + overallScore +
          '&bestRate=' + bestRate +
          '&worstRate=' + worstRate +
          '&duration=' + duration +
          '&total=' + totalAnswerCount +
          '&correctCount=' + totalCorrectAnswers +
          '&questionCount=' + questionCount +
          '&isPartial=' + (isEarly ? 1 : 0),
      });
    }, 500);
  },

  // 辅助渲染函数
  resolve: function(text) { return resolveText(text, this.data.lang); }
});
