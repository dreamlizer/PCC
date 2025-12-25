// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // env 参数说明：
      //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
      //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
      //   如不填则使用默认环境（第一个创建的环境）
      env: "cloud1-8gay4zt288916e1c",
      theme: null
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 集中初始化只读数据（题库），统一 Promise 机制
    const { initOnce } = require('./services/bootstrap');
    const { initUserDataIfNeeded } = require('./services/userData');
    const { getCurrentTheme } = require('./services/theme');
    initOnce(this).then(({ questions }) => {
      console.log('数据加载完成', { questionCount: questions?.length || 0 });
    }).catch((e) => {
      console.error('数据加载失败', e);
    });

    // 载入主题到全局
    try {
      this.globalData.theme = getCurrentTheme();
    } catch (e) {}

    // 首次运行时初始化用户数据集合并写入示例记录（如已初始化则跳过）
    initUserDataIfNeeded();
  },
});
