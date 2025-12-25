// pages/practice/detail.js
const { isFavorite, toggleFavorite, getFavorites } = require('../../utils/storage');
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

Page({
  behaviors: [require('../../behaviors/fade'), require('../../behaviors/share')],

  data: {
    questions: [],
    currentIndex: 0,
    question: null,
    questionTitle: '',
    optionsResolved: [],
    state: 'answer', // answer | analysis
    lang: 'zh', // zh | en（英文通过 E 尾号题实现）
    bestChoice: '',
    worstChoice: '',
    favoriteOn: false,
    analysisRecap: '',
    // 主题与语言相关
    theme: null,
    labels: {},
    hasEnglish: false,
    englishIndex: -1,
    fadeClass: '',
    fontScaleClass: ''
  },

  async onLoad(options) {
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    const bank = (app?.globalData?.questionBank) || [];
    this.bankQuestions = bank; // 全量题库，用于英文检索
    const theme = getCurrentTheme();

    // 构建导航集合：默认仅用基础题（88 道）；若 scope=favorites，则限定为收藏集（同样仅基础题）
    const favScope = options && options.scope === 'favorites';
    const extractNum = (val) => {
      const m = String(val == null ? '' : val).match(/\d+/);
      return m ? parseInt(m[0], 10) : NaN;
    };
    const sortBaseQuestions = (a, b) => {
      const aStr = String(a?.number != null ? a.number : a?.id);
      const bStr = String(b?.number != null ? b.number : b?.id);

      const aIsIcf = /^icf-/i.test(aStr);
      const bIsIcf = /^icf-/i.test(bStr);
      if (aIsIcf && !bIsIcf) return -1;
      if (!aIsIcf && bIsIcf) return 1;

      const an = extractNum(a?.number);
      const bn = extractNum(b?.number);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      if (!isNaN(an)) return -1;
      if (!isNaN(bn)) return 1;
      return aStr.localeCompare(bStr);
    };

    let navList = bank
      .filter(q => !isEnglishVariantNumber(q && q.number))
      .slice()
      .sort(sortBaseQuestions);

    if (favScope) {
      const favIds = getFavorites();
      navList = bank
        .filter(q => favIds.includes(q.id))
        .filter(q => !isEnglishVariantNumber(q && q.number)) // 收藏范围内仅保留基础题
        .slice()
        .sort(sortBaseQuestions);
    }
    this.setData({ questions: navList, theme, fontScaleClass: getFontScaleClassByStorage() });

    // 计算起始索引：优先使用传入的 favIndex；否则按 id/number 查找
    let startIndex = 0;
    if (favScope && options && options.favIndex != null) {
      const i = parseInt(options.favIndex, 10);
      if (!isNaN(i) && i >= 0 && i < navList.length) startIndex = i;
    } else if (options && (options.id || options.number)) {
      const target = options.id || options.number;
      const idx = navList.findIndex(q => String(q.id) === String(target) || String(q.number) === String(target));
      if (idx >= 0) startIndex = idx;
    }

    const q = navList[startIndex] || null;
    const favoriteOn = q ? isFavorite(q.id) : false;
    const state = (options && options.state === 'analysis') ? 'analysis' : 'answer';
    const { questionTitle, optionsResolved } = this.computeResolved(q, 'zh');
    const { hasEnglish, englishIndex } = this.locateEnglish(q, this.bankQuestions);
    const analysisRecap = state === 'analysis' ? this.buildAnalysisRecap({ question: q, optionsResolved, bestChoice: this.data.bestChoice, worstChoice: this.data.worstChoice, lang: 'zh' }) : '';
    this.setData({ currentIndex: startIndex, question: q, questionTitle, optionsResolved, lang: 'zh', favoriteOn, state, analysisRecap, theme, labels: this.getLabels('zh'), hasEnglish, englishIndex });
  },

  onShow() {
    this.applyFadeEnter();
    this.setData({ fontScaleClass: getFontScaleClassByStorage() });
  },

  // 语言按钮（EN/中文）：英文通过同编号的 EN 尾号题实现（兼容旧数据的 E 尾号）。英文检索基于全量题库。
  toggleLangE() {
    const { lang, hasEnglish, englishIndex } = this.data;
    if (lang === 'zh') {
      if (!hasEnglish || englishIndex < 0) return; // 不可点击
      const qERaw = this.bankQuestions[englishIndex];
      const qBase = this.data.question;

      let analyses = qERaw && qERaw.analyses;
      if (!analyses && qBase && qBase.analyses && Array.isArray(qERaw && qERaw.options) && Array.isArray(qBase.options)) {
        analyses = {};
        qERaw.options.forEach((optE, idx) => {
          const optBase = qBase.options[idx];
          if (optBase && qBase.analyses[optBase.id]) {
            analyses[optE.id] = qBase.analyses[optBase.id];
          }
        });
      }

      const qE = qERaw ? { ...qERaw, analyses } : qERaw;
      const { questionTitle, optionsResolved } = this.computeResolved(qE, 'en');
      const analysisRecap = this.data.state === 'analysis'
        ? this.buildAnalysisRecap({ question: qE, optionsResolved, bestChoice: this.data.bestChoice, worstChoice: this.data.worstChoice, lang: 'en' })
        : '';
      this.setData({ question: qE, questionTitle, optionsResolved, lang: 'en', labels: this.getLabels('en'), analysisRecap });
    } else {
      // 从英文切回中文：在当前导航集合（可能是收藏集）定位基础题
      const { baseIndex } = this.locateBase(this.data.question, this.data.questions);
      const qBase = baseIndex >= 0 ? this.data.questions[baseIndex] : this.data.question;
      const { questionTitle, optionsResolved } = this.computeResolved(qBase, 'zh');
      const { hasEnglish, englishIndex } = this.locateEnglish(qBase, this.bankQuestions);
      const analysisRecap = this.data.state === 'analysis' ? this.buildAnalysisRecap({ question: qBase, optionsResolved, bestChoice: this.data.bestChoice, worstChoice: this.data.worstChoice, lang: 'zh' }) : '';
      this.setData({ question: qBase, questionTitle, optionsResolved, lang: 'zh', labels: this.getLabels('zh'), hasEnglish, englishIndex, analysisRecap });
    }
  },

  pickBest(e) {
    const id = e.currentTarget.dataset.id;
    const updates = { bestChoice: id };
    if (this.data.worstChoice === id) updates.worstChoice = '';
    this.setData(updates);
    const labels = this.data.labels || {};
    wx.showToast({ title: labels.toastBest || 'Marked as Best', icon: 'success', duration: 800 });
  },
  pickWorst(e) {
    const id = e.currentTarget.dataset.id;
    const updates = { worstChoice: id };
    if (this.data.bestChoice === id) updates.bestChoice = '';
    this.setData(updates);
    const labels = this.data.labels || {};
    wx.showToast({ title: labels.toastWorst || 'Marked as Worst', icon: 'success', duration: 800 });
  },

  toggleFavorite() {
    const q = this.data.question;
    if (!q) return;
    const updated = toggleFavorite(q.id);
    this.setData({ favoriteOn: updated.includes(q.id) });
  },

  viewAnalysis() {
    if (!this.data.bestChoice || !this.data.worstChoice) {
      const labels = this.data.labels || {};
      wx.showToast({ title: labels.toastNeedSelect || 'Select best and worst first', icon: 'none' });
      return;
    }
    const analysisRecap = this.buildAnalysisRecap({
      question: this.data.question,
      optionsResolved: this.data.optionsResolved,
      bestChoice: this.data.bestChoice,
      worstChoice: this.data.worstChoice,
      lang: this.data.lang
    });
    this.setData({ state: 'analysis', analysisRecap });
  },

  returnToAnswer() {
    // 返回答题态，保留当前选择，便于复盘或更改
    this.setData({ state: 'answer' });
  },

  next() {
    let nextIdx = this.data.currentIndex + 1;
    // 跳过英文题（尾号 EN 或 E），仅在列表导航中不出现
    while (nextIdx < this.data.questions.length && isEnglishVariantNumber(this.data.questions[nextIdx]?.number)) {
      nextIdx++;
    }
    if (nextIdx >= this.data.questions.length) {
      const labels = this.data.labels || {};
      wx.showToast({ title: labels.toastLast || 'Last question reached', icon: 'none' });
      return;
    }
    const q = this.data.questions[nextIdx];
    const favoriteOn = isFavorite(q.id);
    const lang = 'zh';
    const { questionTitle, optionsResolved } = this.computeResolved(q, lang);
    const { hasEnglish, englishIndex } = this.locateEnglish(q, this.bankQuestions);
    const analysisRecap = '';
    this.setData({
      currentIndex: nextIdx,
      question: q,
      questionTitle,
      optionsResolved,
      lang,
      labels: this.getLabels(lang),
      bestChoice: '',
      worstChoice: '',
      favoriteOn,
      state: 'answer',
      analysisRecap,
      hasEnglish,
      englishIndex,
    });
  },

  prev() {
    let prevIdx = this.data.currentIndex - 1;
    // 跳过英文题（尾号 EN 或 E）
    while (prevIdx >= 0 && isEnglishVariantNumber(this.data.questions[prevIdx]?.number)) {
      prevIdx--;
    }
    if (prevIdx < 0) {
      const labels = this.data.labels || {};
      wx.showToast({ title: labels.toastFirst || 'Already at the first question', icon: 'none' });
      return;
    }
    const q = this.data.questions[prevIdx];
    const favoriteOn = isFavorite(q.id);
    const lang = 'zh';
    const { questionTitle, optionsResolved } = this.computeResolved(q, lang);
    const { hasEnglish, englishIndex } = this.locateEnglish(q, this.bankQuestions);
    const analysisRecap = '';
    this.setData({
      currentIndex: prevIdx,
      question: q,
      questionTitle,
      optionsResolved,
      lang,
      labels: this.getLabels(lang),
      bestChoice: '',
      worstChoice: '',
      favoriteOn,
      state: 'answer',
      analysisRecap,
      hasEnglish,
      englishIndex,
    });
  },

  goBackToList() {
    this.applyFadeLeaveThen(() => {
      const pages = getCurrentPages();
      if (pages && pages.length > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        wx.redirectTo({ url: '/pages/practice/index' });
      }
    }, 500);
  },

  computeResolved(q, lang) {
    if (!q) return { questionTitle: '', optionsResolved: [] };
    const questionTitle = resolveText(q.title, lang);
    const letters = ['A','B','C','D','E','F'];
    const optionsResolved = Array.isArray(q.options) ? q.options.map((opt, idx) => ({
      id: opt.id,
      letter: letters[idx] || String(idx + 1),
      textResolved: resolveText(opt.text, lang),
    })) : [];
    return { questionTitle, optionsResolved };
  },

  // 根据题号定位英文题（优先尾号 EN，兼容尾号 E）
  locateEnglish(q, list) {
    const base = stripEnglishSuffix(q?.number).toUpperCase();
    if (!base) return { hasEnglish: false, englishIndex: -1 };
    const idx = (list || []).findIndex(it => isEnglishVariantNumber(it?.number) && stripEnglishSuffix(it?.number).toUpperCase() === base);
    return { hasEnglish: idx >= 0, englishIndex: idx };
  },
  locateBase(q, list) {
    // 去除 EN 或 E 尾号，定位基础题
    const base = stripEnglishSuffix(q?.number).toUpperCase();
    if (!base) return { baseIndex: -1 };
    const idx = (list || []).findIndex(it => stripEnglishSuffix(it?.number).toUpperCase() === base && !isEnglishVariantNumber(it?.number));
    return { baseIndex: idx };
  },

  getLabels(lang) {
    if (lang === 'en') {
      return {
        best: 'Best Action',
        worst: 'Worst Action',
        analyze: 'Answer Analysis',
        returnToQuestion: 'Return to Question',
        backToList: 'Back to List',
        prev: 'Previous',
        next: 'Next',
        level: 'Level',
        summary: 'Summary',
        analysis: 'Analysis',
        counter: 'Question',
        toastBest: 'Marked as Best',
        toastWorst: 'Marked as Worst',
        toastNeedSelect: 'Select best and worst first',
        toastLast: 'Last question reached',
        toastFirst: 'Already at the first question'
      };
    }
    return {
      best: '最佳行动',
      worst: '最差行动',
      analyze: '答案解析',
      returnToQuestion: '返回题目',
      backToList: '返回列表',
      prev: '上一题',
      next: '下一题',
      level: '等级',
      summary: '总结',
      analysis: '解析',
      counter: '第',
      toastBest: '已选为最佳',
      toastWorst: '已选为最差',
      toastNeedSelect: '请先选择最佳与最差',
      toastLast: '已到最后一题',
      toastFirst: '已是第一题'
    };
  },

  buildAnalysisRecap({ question, optionsResolved, bestChoice, worstChoice, lang }) {
    if (!question) return '';
    const lettersMap = new Map(optionsResolved.map(o => [String(o.id), o.letter]));
    const bestLetter = lettersMap.get(String(question.answer?.best)) || '';
    const worstLetter = lettersMap.get(String(question.answer?.worst)) || '';
    const userBestLetter = bestChoice ? (lettersMap.get(String(bestChoice)) || '') : '';
    const userWorstLetter = worstChoice ? (lettersMap.get(String(worstChoice)) || '') : '';

    if (!bestChoice || !worstChoice) {
      return lang === 'en'
        ? `The best and worst actions are ${bestLetter} and ${worstLetter}.`
        : `最佳/最差行动分别是 ${bestLetter} 和 ${worstLetter}。`;
    }

    const bestCorrect = String(bestChoice) === String(question.answer?.best);
    const worstCorrect = String(worstChoice) === String(question.answer?.worst);

    if (bestCorrect && worstCorrect) {
      return lang === 'en'
        ? `The best and worst actions are ${bestLetter} and ${worstLetter}; your answers are correct.`
        : `最佳/最差行动分别是 ${bestLetter} 和 ${worstLetter}，你的回答是正确的。`;
    }

    const parts = [];
    if (lang === 'en') {
      parts.push(`Your selections are ${userBestLetter} and ${userWorstLetter}`);
      if (bestCorrect && !worstCorrect) {
        parts.push(`, best action is correct, worst action is incorrect. See the analysis below.`);
      } else if (!bestCorrect && worstCorrect) {
        parts.push(`, best action is incorrect, worst action is correct. See the analysis below.`);
      } else {
        parts.push(`, both best and worst are incorrect. See the analysis below.`);
      }
    } else {
      parts.push(`你的回答是 ${userBestLetter} 和 ${userWorstLetter}`);
      if (bestCorrect && !worstCorrect) {
        parts.push(`，最佳行动回答正确，最差答案回答错误，请参阅下面的解析。`);
      } else if (!bestCorrect && worstCorrect) {
        parts.push(`，最佳行动回答错误，最差答案回答正确，请参阅下面的解析。`);
      } else {
        parts.push(`，最佳与最差均回答错误，请参阅下面的解析。`);
      }
    }
    return parts.join('');
  }
});
