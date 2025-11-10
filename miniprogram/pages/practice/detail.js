// pages/practice/detail.js
const { isFavorite, toggleFavorite } = require('../../utils/storage');

function resolveText(text, lang) {
  if (typeof text === 'string') return text;
  if (text && typeof text === 'object') return text[lang] || text.zh || '';
  return '';
}

Page({
  data: {
    questions: [],
    currentIndex: 0,
    question: null,
    questionTitle: '',
    optionsResolved: [],
    bestAnswerText: '',
    worstAnswerText: '',
    state: 'answer', // answer | judge | analysis
    isBilingual: false,
    lang: 'zh',
    bestChoice: '',
    worstChoice: '',
    expandedOptionId: '',
    favoriteOn: false,
    summaryResolved: '',
    analysisRecap: '',
  },

  async onLoad(options) {
    const app = getApp();
    try { const { awaitReady } = require('../../services/bootstrap'); await awaitReady(app); } catch (_) {}
    const questions = (app?.globalData?.questionBank) || [];
    this.setData({ questions });

    let startIndex = 0;
    // 支持从参数加载：优先用 id，其次 number
    if (options && (options.id || options.number)) {
      const target = options.id || options.number;
      const idx = questions.findIndex(q => String(q.id) === String(target) || String(q.number) === String(target));
      if (idx >= 0) startIndex = idx;
    }

    const q = questions[startIndex] || null;
    const isBilingual = !!(q && q.title && typeof q.title === 'object' && q.title.en);
    const favoriteOn = q ? isFavorite(q.id) : false;
    const state = (options && options.state === 'analysis') ? 'analysis' : 'answer';
    const { questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved } = this.computeResolved(q, 'zh');
    const analysisRecap = state === 'analysis' ? this.buildAnalysisRecap({ question: q, optionsResolved, bestChoice: this.data.bestChoice, worstChoice: this.data.worstChoice }) : '';
    this.setData({ currentIndex: startIndex, question: q, questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved, isBilingual, lang: 'zh', favoriteOn, state, analysisRecap });
  },

  switchLang() {
    if (!this.data.isBilingual) return;
    const nextLang = this.data.lang === 'zh' ? 'en' : 'zh';
    const { questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved } = this.computeResolved(this.data.question, nextLang);
    const analysisRecap = this.data.state === 'analysis' ? this.buildAnalysisRecap({ question: this.data.question, optionsResolved, bestChoice: this.data.bestChoice, worstChoice: this.data.worstChoice }) : '';
    this.setData({ lang: nextLang, questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved, analysisRecap });
  },

  pickBest(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ bestChoice: id });
    wx.showToast({ title: '已选为最佳', icon: 'success', duration: 800 });
  },
  pickWorst(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ worstChoice: id });
    wx.showToast({ title: '已选为最差', icon: 'success', duration: 800 });
  },

  toggleFavorite() {
    const q = this.data.question;
    if (!q) return;
    const updated = toggleFavorite(q.id);
    this.setData({ favoriteOn: updated.includes(q.id) });
  },

  viewAnalysis() {
    if (!this.data.bestChoice || !this.data.worstChoice) {
      wx.showToast({ title: '请先选择最佳与最差', icon: 'none' });
      return;
    }
    const analysisRecap = this.buildAnalysisRecap({
      question: this.data.question,
      optionsResolved: this.data.optionsResolved,
      bestChoice: this.data.bestChoice,
      worstChoice: this.data.worstChoice,
    });
    this.setData({ state: 'analysis', analysisRecap });
  },

  returnToAnswer() {
    // 返回答题态，保留当前选择，便于复盘或更改
    this.setData({ state: 'answer' });
  },

  expandOption(e) {
    const id = e.currentTarget.dataset.id;
    const expanded = this.data.expandedOptionId === id ? '' : id;
    this.setData({ expandedOptionId: expanded, state: 'analysis' });
  },

  next() {
    const nextIdx = this.data.currentIndex + 1;
    if (nextIdx >= this.data.questions.length) {
      wx.showToast({ title: '已到最后一题', icon: 'none' });
      return;
    }
    const q = this.data.questions[nextIdx];
    const isBilingual = !!(q && q.title && typeof q.title === 'object' && q.title.en);
    const favoriteOn = isFavorite(q.id);
    const { questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved } = this.computeResolved(q, 'zh');
    const analysisRecap = '';
    this.setData({
      currentIndex: nextIdx,
      question: q,
      questionTitle,
      optionsResolved,
      bestAnswerText,
      worstAnswerText,
      summaryResolved,
      isBilingual,
      lang: 'zh',
      bestChoice: '',
      worstChoice: '',
      expandedOptionId: '',
      favoriteOn,
      state: 'answer',
      analysisRecap
    });
  },

  prev() {
    const prevIdx = this.data.currentIndex - 1;
    if (prevIdx < 0) {
      wx.showToast({ title: '已是第一题', icon: 'none' });
      return;
    }
    const q = this.data.questions[prevIdx];
    const isBilingual = !!(q && q.title && typeof q.title === 'object' && q.title.en);
    const favoriteOn = isFavorite(q.id);
    const { questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved } = this.computeResolved(q, 'zh');
    const analysisRecap = '';
    this.setData({
      currentIndex: prevIdx,
      question: q,
      questionTitle,
      optionsResolved,
      bestAnswerText,
      worstAnswerText,
      summaryResolved,
      isBilingual,
      lang: 'zh',
      bestChoice: '',
      worstChoice: '',
      expandedOptionId: '',
      favoriteOn,
      state: 'answer',
      analysisRecap
    });
  },

  goBackToList() {
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.redirectTo({ url: '/pages/practice/index' });
    }
  },

  computeResolved(q, lang) {
    if (!q) return { questionTitle: '', optionsResolved: [], summaryResolved: '' };
    const questionTitle = resolveText(q.title, lang);
    const letters = ['A','B','C','D','E','F'];
    const optionsResolved = Array.isArray(q.options) ? q.options.map((opt, idx) => ({
      id: opt.id,
      letter: letters[idx] || String(idx + 1),
      textResolved: resolveText(opt.text, lang),
    })) : [];
    const findText = (id) => {
      const t = optionsResolved.find(o => String(o.id) === String(id));
      return t ? t.textResolved : '';
    };
    const bestAnswerText = q?.answer ? findText(q.answer.best) : '';
    const worstAnswerText = q?.answer ? findText(q.answer.worst) : '';
    const summaryResolved = resolveText(q.summary, lang);
    return { questionTitle, optionsResolved, bestAnswerText, worstAnswerText, summaryResolved };
  },

  buildAnalysisRecap({ question, optionsResolved, bestChoice, worstChoice }) {
    if (!question) return '';
    const lettersMap = new Map(optionsResolved.map(o => [String(o.id), o.letter]));
    const bestLetter = lettersMap.get(String(question.answer?.best)) || '';
    const worstLetter = lettersMap.get(String(question.answer?.worst)) || '';
    const userBestLetter = bestChoice ? (lettersMap.get(String(bestChoice)) || '') : '';
    const userWorstLetter = worstChoice ? (lettersMap.get(String(worstChoice)) || '') : '';

    if (!bestChoice || !worstChoice) {
      return `最佳/最差行动分别是 ${bestLetter} 和 ${worstLetter}。`;
    }

    const bestCorrect = String(bestChoice) === String(question.answer?.best);
    const worstCorrect = String(worstChoice) === String(question.answer?.worst);

    if (bestCorrect && worstCorrect) {
      return `最佳/最差行动分别是 ${bestLetter} 和 ${worstLetter}，你的回答是正确的。`;
    }

    const parts = [];
    parts.push(`你的回答是 ${userBestLetter} 和 ${userWorstLetter}`);
    if (bestCorrect && !worstCorrect) {
      parts.push(`，最佳行动回答正确，最差答案回答错误，请参阅下面的解析。`);
    } else if (!bestCorrect && worstCorrect) {
      parts.push(`，最佳行动回答错误，最差答案回答正确，请参阅下面的解析。`);
    } else {
      parts.push(`，最佳与最差均回答错误，请参阅下面的解析。`);
    }
    return parts.join('');
  }
});