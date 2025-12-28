const { applyCommonCloudFunctionError } = require('./cloudError');
const {
  MINI_PROGRAM_CODE_CLOUD_CODE,
  MINI_PROGRAM_CODE_CALL_CODE,
} = require('./snippets');

function getCodeSrc() {
  wx.showLoading({ title: '' });
  wx.cloud
    .callFunction({
      name: 'quickstartFunctions',
      data: { type: 'getMiniProgramCode' },
    })
    .then((resp) => {
      this.setData({
        haveGetCodeSrc: true,
        codeSrc: resp.result,
      });
      wx.hideLoading();
    })
    .catch((e) => {
      wx.hideLoading();
      applyCommonCloudFunctionError(this, e);
    });
}

function clearCodeSrc() {
  this.setData({
    haveGetCodeSrc: false,
    codeSrc: '',
  });
}

function getMiniProgramCode() {
  this.setData({
    callMiniProgramCode: MINI_PROGRAM_CODE_CLOUD_CODE,
    callFunctionCode: MINI_PROGRAM_CODE_CALL_CODE,
  });
}

module.exports = {
  getCodeSrc,
  clearCodeSrc,
  getMiniProgramCode,
};

