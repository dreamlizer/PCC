const AGENT_UI_REPO_URL =
  'https://gitee.com/TencentCloudBase/cloudbase-agent-ui/tree/main/apps/miniprogram-agent-ui/miniprogram/components/agent-ui';

const OFFICIAL_WEBSITE_URL = 'https://docs.cloudbase.net/toolbox/quick-start';

const DEFAULT_MODEL_CONFIG = {
  modelProvider: 'deepseek',
  quickResponseModel: 'deepseek-v3',
  logo: 'https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/2339414f-2c0d-4537-9618-1812bd14f4af.svg',
  welcomeMsg: '我是deepseek-v3，很高兴见到你！',
};

const AI_PAGE_CONFIG = `{
  "usingComponents": {
    "agent-ui":"/components/agent-ui/index"
  },
}`;

const AI_WXML_CONFIG =
  `&lt;agent-ui agentConfig="{{agentConfig}}" showBotAvatar="{{showBotAvatar}}" chatMode="{{chatMode}}" modelConfig="{{modelConfig}}""&gt;&lt;/agent-ui&gt;`;

const AI_DATA_CONFIG = `data: {
  chatMode: "bot", // bot 表示使用agent，model 表示使用大模型
  showBotAvatar: true, // 是否在对话框左侧显示头像
  agentConfig: {
    botId: "your agent id", // agent id,
    allowWebSearch: true, // 允许客户端选择展示联网搜索按钮
    allowUploadFile: true, // 允许客户端展示上传文件按钮
    allowPullRefresh: true, // 允许客户端展示下拉刷新
    allowUploadImage: true, // 允许客户端展示上传图片按钮
    allowMultiConversation: true, // 允许客户端展示查看会话列表/新建会话按钮
    showToolCallDetail: true, // 是否展示 mcp server toolCall 细节
    allowVoice: true, // 允许客户端展示语音按钮
    showBotName: true, // 允许展示bot名称
  },
  modelConfig: {
    modelProvider: "hunyuan-open", // 大模型服务厂商
    quickResponseModel: "hunyuan-lite", // 大模型名称
    logo: "", // model 头像
    welcomeMsg: "欢迎语", // model 欢迎语
  },
}`;

const OPEN_ID_CLOUD_CODE = `const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
// 获取openId云函数入口函数
exports.main = async (event, context) => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};`;

const OPEN_ID_CALL_CODE = `wx.cloud.callFunction({
  name: 'quickstartFunctions',
  data: {
    type: 'getOpenId'
  }
}).then((resp) => console.log(resp))`;

const MINI_PROGRAM_CODE_CLOUD_CODE = `const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
// 获取小程序二维码云函数入口函数
exports.main = async (event, context) => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: 'pages/index/index'
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: 'code.png',
    fileContent: buffer
  });
  return upload.fileID;
};
`;

const MINI_PROGRAM_CODE_CALL_CODE = `wx.cloud.callFunction({
  name: 'quickstartFunctions',
  data: {
    type: 'getMiniProgramCode'
  }
}).then((resp) => console.log(resp))`;

const CREATE_COLLECTION_CLOUD_CODE = `const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
// 创建集合云函数入口函数
exports.main = async (event, context) => {
  try {
    // 创建集合
    await db.createCollection('sales');
    return {
      success: true
    };
  } catch (e) {
    return {
      success: true,
      data: 'create collection success'
    };
  }
};`;

const UPLOAD_FILE_CODE = `wx.chooseMedia({
count: 1,
success: (chooseResult) => {
  // 将图片上传至云存储空间
  wx.cloud
    .uploadFile({
      // 指定上传到的云路径
      cloudPath: "my-photo.png",
      // 指定要上传的文件的小程序临时文件路径
      filePath: chooseResult.tempFiles[0].tempFilePath,
    })
    .then((res) => {
      console.log(res)
    })
    .catch((e) => {
      console.log('e', e)
    });
}
});`;

function buildCallCbrCode(env) {
  return `const c1 = new wx.cloud.Cloud({
  resourceEnv: ${env}
})
await c1.init()
const r = await c1.callContainer({
  path: '/api/users', // 此处填入业务自定义路径， /api/users 为示例路径
  header: {
    'X-WX-SERVICE': 'express-test', // 填入业务服务名称，express-test 为示例服务
  },
  // 其余参数同 wx.request
  method: 'GET',
})`;
}

function buildInitEnvCode(env) {
  return `wx.cloud.init({
  env: ${env},
  traceUser: true,
});`;
}

module.exports = {
  AGENT_UI_REPO_URL,
  OFFICIAL_WEBSITE_URL,
  DEFAULT_MODEL_CONFIG,
  AI_PAGE_CONFIG,
  AI_WXML_CONFIG,
  AI_DATA_CONFIG,
  OPEN_ID_CLOUD_CODE,
  OPEN_ID_CALL_CODE,
  MINI_PROGRAM_CODE_CLOUD_CODE,
  MINI_PROGRAM_CODE_CALL_CODE,
  CREATE_COLLECTION_CLOUD_CODE,
  UPLOAD_FILE_CODE,
  buildCallCbrCode,
  buildInitEnvCode,
};

