const { OFFICIAL_WEBSITE_URL, buildCallCbrCode, buildInitEnvCode } = require('./snippets');

function clearCallContainerRes() {
  this.setData({
    haveGetCallContainerRes: false,
    callContainerResStr: '',
  });
}

function goOfficialWebsite() {
  const url = OFFICIAL_WEBSITE_URL;
  wx.navigateTo({ url: `../web/index?url=${url}` });
}

async function runCallContainer() {
  const app = getApp();
  const c1 = new wx.cloud.Cloud({ resourceEnv: app.globalData.env });
  await c1.init();
  const r = await c1.callContainer({
    path: '/api/users',
    header: {
      'X-WX-SERVICE': 'express-test',
    },
    method: 'GET',
  });
  this.setData({
    haveGetCallContainerRes: true,
    callContainerResStr: `${JSON.stringify(r.data.items, null, 2)}`,
  });
}

function getCallcbrCode() {
  const app = getApp();
  this.setData({
    callcbrCode: buildCallCbrCode(app.globalData.env),
  });
}

function getInitEnvCode() {
  const app = getApp();
  this.setData({
    initEnvCode: buildInitEnvCode(app.globalData.env),
  });
}

module.exports = {
  clearCallContainerRes,
  goOfficialWebsite,
  runCallContainer,
  getCallcbrCode,
  getInitEnvCode,
};

