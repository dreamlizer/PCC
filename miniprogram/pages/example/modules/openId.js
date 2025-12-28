const { applyCommonCloudFunctionError } = require('./cloudError');
const { OPEN_ID_CLOUD_CODE, OPEN_ID_CALL_CODE } = require('./snippets');

function getOpenId() {
  wx.showLoading({ title: '' });
  wx.cloud
    .callFunction({
      name: 'quickstartFunctions',
      data: { type: 'getOpenId' },
    })
    .then((resp) => {
      this.setData({
        haveGetOpenId: true,
        openId: resp.result.openid,
      });
      wx.hideLoading();
    })
    .catch((e) => {
      wx.hideLoading();
      applyCommonCloudFunctionError(this, e);
    });
}

function clearOpenId() {
  this.setData({
    haveGetOpenId: false,
    openId: '',
  });
}

function getOpenIdCode() {
  this.setData({
    callOpenIdCode: OPEN_ID_CLOUD_CODE,
    callFunctionCode: OPEN_ID_CALL_CODE,
  });
}

module.exports = {
  getOpenId,
  clearOpenId,
  getOpenIdCode,
};

