Component({
  properties: {
    // 左侧显示文本（计数/计时等），由页面传入已格式化字符串
    leftText: { type: String, value: '' },

    // 主题对象，用于渐变色（heroFrom/heroTo）
    theme: { type: Object, value: {} },

    // 右侧控件开关
    showStar: { type: Boolean, value: false },
    favoriteOn: { type: Boolean, value: false },

    showLang: { type: Boolean, value: false },
    langText: { type: String, value: 'EN' },
    langDisabled: { type: Boolean, value: false },

    showStop: { type: Boolean, value: false },
    stopText: { type: String, value: '结束' }
  },
  methods: {
    onStarTap() {
      this.triggerEvent('star');
    },
    onLangTap() {
      if (this.properties.langDisabled) return;
      this.triggerEvent('lang');
    },
    onStopTap() {
      this.triggerEvent('stop');
    }
  }
});
