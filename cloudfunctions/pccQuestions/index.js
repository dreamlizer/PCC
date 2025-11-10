const cloud = require('wx-server-sdk');

// 使用动态当前环境，避免硬编码环境ID
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function normalize(list) {
  if (!Array.isArray(list)) return [];
  const mapped = list.map((q, idx) => {
    const id = String(q._id || q.id || q.number || `q_${String(idx + 1).padStart(3, '0')}`);
    const num = q.number != null ? q.number : null;
    return {
      id,
      number: num,
      title: q.title,
      summary: q.summary,
      options: q.options,
      answer: q.answer,
      analyses: q.analyses,
    };
  });
  // 若存在 number 字段则按 number 升序排序
  mapped.sort((a, b) => {
    const an = a.number != null ? parseInt(String(a.number), 10) : Number.POSITIVE_INFINITY;
    const bn = b.number != null ? parseInt(String(b.number), 10) : Number.POSITIVE_INFINITY;
    return an - bn;
  });
  return mapped;
}

async function readCollectionByCandidates(names) {
  for (const name of names) {
    try {
      const countRes = await db.collection(name).count();
      const total = countRes.total || 0;
      if (total > 0) {
        const batch = 20;
        const times = Math.ceil(total / batch) || 1;
        const tasks = [];
        for (let i = 0; i < times; i++) {
          tasks.push(db.collection(name).skip(i * batch).limit(batch).get());
        }
        const results = await Promise.all(tasks);
        const data = results.flatMap(r => r.data || []);
        return { used: name, data };
      }
    } catch (_) {
      // 忽略错误，尝试下一个候选集合
    }
  }
  return { used: '', data: [] };
}

exports.main = async (event, context) => {
  try {
    // 兼容集合名大小写：优先小写，再尝试驼峰/首字母大写
    const candidates = ['examquestions', 'ExamQuestions', 'examQuestions'];
    const { used, data } = await readCollectionByCandidates(candidates);
    const normalized = normalize(data);
    return { ok: true, usedCollection: used, total: normalized.length, data: normalized };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
};