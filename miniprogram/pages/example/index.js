const openId = require('./modules/openId');
const miniProgramCode = require('./modules/miniProgramCode');
const records = require('./modules/records');
const upload = require('./modules/upload');
const cloudBaseRun = require('./modules/cloudBaseRun');
const snippets = require('./modules/snippets');

const pageConfig = {
  data: {
    type: '',
    envId: '',
    showTip: false,
    title: '',
    content: '',

    haveGetOpenId: false,
    openId: '',

    haveGetCodeSrc: false,
    codeSrc: '',

    haveGetRecord: false,
    record: [],

    haveGetImgSrc: false,
    imgSrc: '',

    modelConfig: snippets.DEFAULT_MODEL_CONFIG,
    callcbrCode: '',
    initEnvCode: '',
    callOpenIdCode: '',
    callMiniProgramCode: '',
    callFunctionCode: '',
    callCreateCollectionCode: '',
    callUploadFileCode: '',

    showInsertModal: false,
    insertRegion: '',
    insertCity: '',
    insertSales: '',

    haveGetCallContainerRes: false,
    callContainerResStr: '',

    ai_page_config: snippets.AI_PAGE_CONFIG,
    ai_wxml_config: snippets.AI_WXML_CONFIG,
    ai_data_config: snippets.AI_DATA_CONFIG,
  },

  onLoad(options) {
    console.log('options', options);
    const type = options && options.type ? String(options.type) : '';

    if (type === 'cloudbaserunfunction' || type === 'cloudbaserun') {
      this.getCallcbrCode();
    }
    if (type === 'getOpenId') {
      this.getOpenIdCode();
    }
    if (type === 'getMiniProgramCode') {
      this.getMiniProgramCode();
    }
    if (type === 'createCollection') {
      this.getCreateCollectionCode();
    }
    if (type === 'uploadFile') {
      this.getUploadFileCode();
    }

    this.setData({
      type,
      envId: options && options.envId ? String(options.envId) : '',
    });
  },

  copyUrl() {
    wx.setClipboardData({
      data: snippets.AGENT_UI_REPO_URL,
      success: function () {
        wx.showToast({ title: '复制成功', icon: 'success' });
      },
    });
  },

  getCreateCollectionCode() {
    this.setData({
      callCreateCollectionCode: snippets.CREATE_COLLECTION_CLOUD_CODE,
    });
  },
};

Object.assign(pageConfig, openId, miniProgramCode, records, upload, cloudBaseRun);
Page(pageConfig);
