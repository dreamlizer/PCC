const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

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
        const data = [];
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          const arr = (r && r.data) || [];
          for (let j = 0; j < arr.length; j++) data.push(arr[j]);
        }
        return { used: name, data };
      }
    } catch (_) {}
  }
  return { used: '', data: [] };
}

function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(function(it) {
      const id = String((it && (it.id || it._id)) || '');
      return {
        id: id,
        primary_tag: it && it.primary_tag,
        secondary_tag: it && it.secondary_tag,
        options: (it && it.options) || {}
      };
    })
    .filter(function(it) { return it && it.id; });
}

exports.main = async () => {
  try {
    const candidates = [
      'abilitylabels',
      'AbilityLabels',
      'ccranking',
      'CCRanking',
      'competencylabels',
      'CompetencyLabels',
      'corecompetencylabels',
      'CoreCompetencyLabels'
    ];
    const { used, data } = await readCollectionByCandidates(candidates);
    const normalized = normalize(data);
    return { ok: true, usedCollection: used, total: normalized.length, data: normalized };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
};

