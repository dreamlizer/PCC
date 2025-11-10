// 自定义底部 TabBar
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/framework/index', text: '框架学习' },
      { pagePath: '/pages/practice/index', text: '逐题练习' },
      { pagePath: '/pages/bossrush/index', text: 'Boss Rush' },
      { pagePath: '/pages/profile/index', text: '个人中心' },
    ],
  },
  methods: {
    onTap(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      this.setData({ selected: index });
      wx.switchTab({ url: item.pagePath });
    },
    setSelected(i) {
      this.setData({ selected: i });
    }
  }
});