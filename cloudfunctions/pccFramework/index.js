const cloud = require('wx-server-sdk');

// 使用动态当前环境，避免硬编码环境ID造成不一致
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 读取 framework 集合（至少应有一条主记录，包含 levels 数组）
    const res = await db.collection('9Framework').get();
    return { ok: true, data: res.data || [] };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
};