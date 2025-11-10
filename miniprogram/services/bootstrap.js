// services/bootstrap.js
// 统一的应用数据初始化入口：
// - 暴露 awaitReady()：页面等待数据就绪
// - 暴露 initOnce()：App.onLaunch 调用一次
// 说明：只负责协调初始化，不处理UI逻辑，避免上帝文件。

const { loadAllDataOnce } = require('./dataLoader');

let initialized = false;
let readyPromise = null;
const callbacks = [];

function initOnce(app) {
  if (initialized && readyPromise) return readyPromise;
  initialized = true;
  readyPromise = loadAllDataOnce()
    .then(({ framework, questions }) => {
      try {
        app.globalData = app.globalData || {};
        app.globalData.framework = framework;
        app.globalData.questionBank = questions;
      } catch (_) {}
      return { framework, questions };
    })
    .finally(() => {
      // 通知一次性回调
      while (callbacks.length) {
        const fn = callbacks.shift();
        try { fn(); } catch (_) {}
      }
    });
  // 让页面可访问
  try { app.globalData.dataReadyPromise = readyPromise; } catch (_) {}
  return readyPromise;
}

function awaitReady(app) {
  const p = (app && app.globalData && app.globalData.dataReadyPromise) || readyPromise;
  if (p) return p;
  return initOnce(app);
}

function onReady(callback) {
  if (typeof callback !== 'function') return;
  // 若已就绪，立即异步调用
  if (readyPromise) {
    readyPromise.then(() => { try { callback(); } catch (_) {} });
  } else {
    callbacks.push(callback);
  }
}

module.exports = { initOnce, awaitReady, onReady };