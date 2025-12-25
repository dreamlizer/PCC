// 全局分享逻辑封装
// 使用 behavior 机制，让所有 Page 都能轻松混入

module.exports = Behavior({
  methods: {
    // 默认分享给好友
    onShareAppMessage() {
      return {
        title: 'PCC 模拟试题',
        path: '/pages/index/index'
      };
    },
    // 默认分享到朋友圈
    onShareTimeline() {
      return {
        title: 'PCC 模拟试题',
        query: ''
      };
    }
  }
});
