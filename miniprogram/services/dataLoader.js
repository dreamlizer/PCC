// services/dataLoader.js
const app = getApp ? getApp() : null;

function normalizeFrameworkDoc(doc) {
  // 将云端记录结构转换为页面需要的结构
  if (!doc) return null;
  let levels = Array.isArray(doc.levels) ? doc.levels.slice() : [];

  // 若无 0 级，则补充一个默认的 0 级
  const hasZero = levels.some(l => String(l.level) === '0' || (typeof l.level === 'number' && l.level === 0) || /(^|\b)0\b/.test(String(l.name || '')));
  if (!hasZero) {
    levels.unshift({
      level: 0,
      name: 'Aha 时刻',
      description: '瞬间的领悟或洞察，连接事实与意义，常带轻松与清晰感。作为进入探索的起点。'
    });
  }

  // 排序策略：若多数 level 可解析，则按数值排序，否则保留原始顺序
  const numericCount = levels.reduce((acc, l) => acc + (!isNaN(parseInt(l.level, 10)) ? 1 : 0), 0);
  if (numericCount >= Math.max(1, Math.floor(levels.length / 2))) {
    levels.sort((a, b) => {
      const na = parseInt(a.level, 10);
      const nb = parseInt(b.level, 10);
      const va = isNaN(na) ? 999 : na;
      const vb = isNaN(nb) ? 999 : nb;
      return va - vb;
    });
  }

  return {
    title: doc.title || '客户感受 9 级框架',
    sections: levels.map((lv, idx) => {
      const parsed = parseInt(lv.level, 10);
      const num = !isNaN(parsed) ? String(parsed) : String(idx);
      const name = lv.name || '';
      const hasName = name && String(name).trim().length > 0;
      const title = hasName ? `${num} 级：${name}` : `${num} 级`;
      return {
        title,
        text: lv.description || '',
        level: num
      };
    }),
  };
}

function normalizeQuestionList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q, idx) => {
    const id = String(q.id || q._id || q.number || `q_${String(idx + 1).padStart(3, '0')}`);
    return Object.assign({ id }, q);
  });
}

// 已移除本地回退逻辑：仅使用云端数据

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

  let framework = null;
  let questions = [];

  // 打印环境ID，便于定位环境不一致问题
  try {
    const envId = (app && app.globalData && app.globalData.env) || '';
    console.log('[Cloud] envId =', envId);
  } catch (_) {}

  // 先拉框架（必要），失败则数据库兜底
  try {
    console.log('[Cloud] call pccFramework');
    const fwRes = await callCloudFunctionCompat('pccFramework');
    const r = fwRes?.result;
    const fwData = (r && r.ok ? r.data : null) || r || [];
    const first = Array.isArray(fwData) && fwData.length ? fwData[0] : null;
    framework = normalizeFrameworkDoc(first) || null;
  } catch (errFw) {
    console.warn('云函数 pccFramework 读取失败，尝试数据库兜底：', errFw);
  }

  if (!framework) {
    try {
      console.log('[Cloud] fallback read DB collection framework');
      const db = wx.cloud.database();
      const dbRes = await db.collection('9Framework').limit(1).get();
      const first2 = Array.isArray(dbRes?.data) && dbRes.data.length ? dbRes.data[0] : null;
      framework = normalizeFrameworkDoc(first2) || null;
    } catch (e2) {
      console.warn('直接读取数据库失败：', e2);
    }
  }

  // 再拉题库（可选），失败忽略
  try {
    console.log('[Cloud] call pccQuestions');
    const qRes = await callCloudFunctionCompat('pccQuestions');
    const r2 = qRes?.result;
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
      questions = results.flatMap(r => r.data || []);
    } catch (e4) {
      console.warn('直接读取题库失败：', e4);
    }
  }

  // 统一题库结构：保证每题都有稳定的 id
  questions = normalizeQuestionList(questions);
  return { framework, questions };
}

async function loadAllDataOnce() {
  // 始终以云端为准，不使用本地缓存回退
  const global = app ? app.globalData || {} : {};

  const { framework, questions } = await loadFromCloud();
  if (app) {
    app.globalData = app.globalData || {};
    app.globalData.framework = framework;
    app.globalData.questionBank = questions;
  }
  return { framework, questions };
}

module.exports = {
  loadAllDataOnce,
};