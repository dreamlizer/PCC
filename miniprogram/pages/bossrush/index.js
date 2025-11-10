// pages/bossrush/index.js
const { addBossRushRecord } = require('../../utils/storage');

function resolveText(text, lang) {
  if (typeof text === 'string') return text;
  if (text && typeof text === 'object') return text[lang] || text.zh || '';
  return '';
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

Page({
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
  },

  onLoad() {
    const app = getApp();
    const questions = (app?.globalData?.questionBank) || [];
    this.setData({ questions });
  },
  onShow() {
    try {
      if (this.getTabBar && this.getTabBar()) {
        this.getTabBar().setSelected(2);
      }
    } catch (_) {}
  },

  startMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const order = mode === 'random' ? shuffle(this.data.questions.map(q => q.id)) : this.data.questions.map(q => q.id);
    const q0 = this.data.questions.find(q => q.id === order[0]);
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
    const timerId = setInterval(() => {
      const elapsed = fmt(Date.now() - this.data.startTs);
      this.setData({ elapsed });
    }, 1000);
    this.setData({ timerId });
  },

  switchLang() {
    if (!this.data.isBilingual) return;
    this.setData({ lang: this.data.lang === 'zh' ? 'en' : 'zh' });
  },

  pickBest(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ bestChoice: id });
  },
  pickWorst(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ worstChoice: id });
  },

  saveCurrentAnswer() {
    const q = this.data.question;
    if (!q) return;
    const answers = { ...this.data.answers };
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
    const q = this.data.questions.find(x => x.id === qId);
    const isBilingual = !!(q && q.title && typeof q.title === 'object' && q.title.en);
    this.setData({
      currentIndex: nextIdx,
      question: q,
      isBilingual,
      lang: 'zh',
      bestChoice: '',
      worstChoice: '',
    });
  },

  finish() {
    this.saveCurrentAnswer();
    if (this.data.timerId) clearInterval(this.data.timerId);
    const duration = fmt(Date.now() - this.data.startTs);
    const total = this.data.order.length;

    let correctBest = 0;
    let correctWorst = 0;
    let correctBoth = 0;
    const reviewList = this.data.order.map(id => {
      const q = this.data.questions.find(x => x.id === id);
      const sel = this.data.answers[id] || { best: '', worst: '' };
      const isBestCorrect = sel.best === q.answer.best;
      const isWorstCorrect = sel.worst === q.answer.worst;
      if (isBestCorrect) correctBest++;
      if (isWorstCorrect) correctWorst++;
      if (isBestCorrect && isWorstCorrect) correctBoth++;
      return { id, isBestCorrect, isWorstCorrect };
    });

    const overallScore = Math.round(((correctBest + correctWorst) / (2 * total)) * 100);
    const bestRate = Math.round((correctBest / total) * 100);
    const worstRate = Math.round((correctWorst / total) * 100);

    // 保存到历史
    addBossRushRecord({
      timestamp: Date.now(),
      mode: this.data.mode,
      score: overallScore,
      correct_count: correctBoth,
      total_count: total,
      duration,
    });

    // 暂存复盘数据
    try {
      wx.setStorageSync('bossrush_last_answers', reviewList);
    } catch (e) {}

    // 跳转战报页
    wx.navigateTo({
      url: `/pages/bossrush/report?mode=${this.data.mode}&score=${overallScore}&bestRate=${bestRate}&worstRate=${worstRate}&duration=${duration}`,
    });
  },

  // 辅助渲染函数
  resolve(text) { return resolveText(text, this.data.lang); }
});