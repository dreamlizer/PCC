// services/dataLoader.js
// 负责统一从云端加载题库，并在成功时写入本地缓存；
// 当云端不可用时回退至本地缓存，以保证离线可用与启动稳定性。
const app = getApp ? getApp() : null;
const {
  getCachedQuestions,
  setCachedQuestions,
  getQuestionsVersion,
  setQuestionsVersion,
} = require('../utils/storage');

// 简单哈希（DJB2）用于生成版本号；不依赖外部库，足够稳定。
function computeHash(obj) {
  const json = JSON.stringify(obj || '');
  let hash = 5381;
  for (let i = 0; i < json.length; i++) {
    hash = ((hash << 5) + hash) + json.charCodeAt(i);
    hash &= 0xffffffff; // 限定为 32 位
  }
  return String(hash >>> 0);
}

function pad3(n) {
  const s = String(n);
  if (s.length >= 3) return s;
  if (s.length === 2) return '0' + s;
  return '00' + s;
}

function normalizeQuestionList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(function(q, idx) {
    const fallbackId = 'q_' + pad3(idx + 1);
    const id = String((q && (q.id || q._id || q.number)) || fallbackId);
    return Object.assign({ id: id }, q);
  });
}

// 云端优先，但允许本地回退：避免网络或环境异常导致应用不可用

async function callCloudFunctionCompat(fnName) {
  // 兼容调用：优先使用标准参数 name，若出现 FunctionName 参数错误，再尝试 functionName
  try {
    return await wx.cloud.callFunction({ name: fnName });
  } catch (err) {
    const msg = (err && (err.errMsg || err.message)) || '';
    const code = err && (err.errCode || err.code);
    if (/FunctionName\s+parameter\s+could\s+not\s+be\s+found/i.test(msg)) {
      try {
        return await wx.cloud.callFunction({ functionName: fnName });
      } catch (err2) {
        throw err2;
      }
    }
    if (code === -401003 || /parameter\.name\s+should\s+be\s+string/i.test(msg)) {
      // 某些开发者工具/基础库版本要求使用 functionName 字段
      try {
        return await wx.cloud.callFunction({ functionName: fnName });
      } catch (err3) {
        throw err3;
      }
    }
    throw err;
  }
}

async function loadFromCloud() {
  // 仅从云端读取（通过云函数），失败则返回空
  if (!wx.cloud) {
    console.warn('wx.cloud 未初始化');
    return { framework: null, questions: [] };
  }

  let questions = [];

  // 打印环境ID，便于定位环境不一致问题
  try {
    const envId = (app && app.globalData && app.globalData.env) || '';
    console.log('[Cloud] envId =', envId);
  } catch (_) {}

  // 再拉题库（可选），失败忽略
  try {
    console.log('[Cloud] call pccQuestions');
    const qRes = await callCloudFunctionCompat('pccQuestions');
    const r2 = qRes && qRes.result;
    questions = (r2 && r2.ok ? r2.data : null) || r2 || [];
  } catch (errQ) {
    console.warn('云函数 pccQuestions 读取失败（可忽略）：', errQ);
  }

  // 题库兜底：云函数失败或返回空时，直接读数据库集合 ExamQuestions
  if (!Array.isArray(questions) || questions.length === 0) {
    try {
      console.log('[Cloud] fallback read DB collection ExamQuestions');
      const db = wx.cloud.database();
      const countRes = await db.collection('ExamQuestions').count();
      const total = countRes.total || 0;
      const batch = 20;
      const times = Math.ceil(total / batch) || 1;
      const tasks = [];
      for (let i = 0; i < times; i++) {
        tasks.push(db.collection('ExamQuestions').skip(i * batch).limit(batch).get());
      }
      const results = await Promise.all(tasks);
      const out = [];
      results.forEach(function(r) {
        const arr = (r && r.data) || [];
        for (let i = 0; i < arr.length; i++) out.push(arr[i]);
      });
      questions = out;
    } catch (e4) {
      console.warn('直接读取题库失败：', e4);
    }
  }

  // 统一题库结构：保证每题都有稳定的 id
  questions = normalizeQuestionList(questions);
  return { framework: null, questions };
}

async function loadAllDataOnce() {
  let { questions } = await loadFromCloud();

  // 云端成功时，写入本地缓存与版本号
  try {
    if (Array.isArray(questions) && questions.length > 0) {
      setCachedQuestions(questions);
      setQuestionsVersion(computeHash(questions));
    }
  } catch (e) {
    console.warn('写入本地缓存失败（可忽略）', e);
  }

  // 若云端缺失或失败，则回退至本地缓存（离线可用）
  if (!Array.isArray(questions) || questions.length === 0) {
    const cachedQs = getCachedQuestions();
    if (Array.isArray(cachedQs) && cachedQs.length) questions = cachedQs;
  }

  if (app) {
    app.globalData = app.globalData || {};
    app.globalData.framework = null;
    app.globalData.questionBank = questions;
    // 可选：暴露当前版本号，便于页面展示或调试
    try {
      app.globalData.dataVersion = {
        questions: getQuestionsVersion(),
      };
    } catch (_) {}
  }
  return { framework: null, questions };
}

module.exports = {
  loadAllDataOnce,
  callCloudFunctionCompat,
};
