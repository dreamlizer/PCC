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
  // 排序：提取题号中的数字部分进行升序；无法解析数字时按字符串比较
  const extractNum = (val) => {
    const m = String(val == null ? '' : val).match(/\d+/);
    return m ? parseInt(m[0], 10) : NaN;
  };
  mapped.sort((a, b) => {
    const an = extractNum(a.number);
    const bn = extractNum(b.number);
    const aStr = String(a.number != null ? a.number : a.id);
    const bStr = String(b.number != null ? b.number : b.id);
    if (!isNaN(an) && !isNaN(bn)) return an - bn;
    if (!isNaN(an)) return -1;
    if (!isNaN(bn)) return 1;
    return aStr.localeCompare(bStr);
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
