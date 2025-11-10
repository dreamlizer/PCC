// 云函数：用户数据（姓名、收藏、挑战记录）统一入口
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COLLECTIONS = {
  profiles: 'UserProfiles',
  favorites: 'Favorites',
  records: 'ChallengeRecords',
};

async function ensureCollections(db) {
  const names = Object.values(COLLECTIONS);
  const results = [];
  for (const name of names) {
    try {
      const r = await db.createCollection(name);
      results.push({ name, created: true, details: r });
    } catch (e) {
      // 已存在会抛错，忽略
      results.push({ name, created: false, error: String(e && e.message || e) });
    }
  }
  return results;
}

async function upsertProfile(db, openid, name) {
  const col = db.collection(COLLECTIONS.profiles);
  const found = await col.where({ openid }).get();
  if (found && found.data && found.data.length) {
    const id = found.data[0]._id;
    await col.doc(id).update({ data: { name, updated_at: db.serverDate() } });
    return { upserted: false, updated: true };
  } else {
    await col.add({ data: { openid, name, created_at: db.serverDate() } });
    return { upserted: true, updated: false };
  }
}

exports.main = async (event, context) => {
  const db = cloud.database();
  const wxctx = cloud.getWXContext();
  const action = event && event.action;
  const payload = event && event.payload || {};

  if (!action) return { ok: false, error: 'NO_ACTION' };

  switch (action) {
    case 'init': {
      const ensure = await ensureCollections(db);
      // 示例数据：个人档案、收藏、挑战记录
      const sampleProfile = await upsertProfile(db, wxctx.OPENID, '示例用户');
      try {
        await db.collection(COLLECTIONS.favorites).add({
          data: {
            openid: wxctx.OPENID,
            question_id: 'sample-qid',
            note: '示例收藏',
            created_at: db.serverDate()
          }
        });
      } catch (_) {}
      try {
        await db.collection(COLLECTIONS.records).add({
          data: {
            openid: wxctx.OPENID,
            mode: 'sequence',
            score: 85,
            correct_count: 17,
            total_count: 20,
            duration: '3m21s',
            timestamp: Date.now(),
            created_at: db.serverDate()
          }
        });
      } catch (_) {}
      return { ok: true, env: wxctx.ENV, ensure, sampleProfile };
    }

    case 'saveProfile': {
      const name = String(payload.name || '').trim();
      if (!name) return { ok: false, error: 'NAME_REQUIRED' };
      const res = await upsertProfile(db, wxctx.OPENID, name);
      return { ok: true, result: res };
    }

    case 'addFavorite': {
      const qid = String(payload.question_id || '').trim();
      if (!qid) return { ok: false, error: 'QUESTION_ID_REQUIRED' };
      const col = db.collection(COLLECTIONS.favorites);
      await col.add({ data: { openid: wxctx.OPENID, question_id: qid, created_at: db.serverDate() } });
      return { ok: true };
    }

    case 'removeFavorite': {
      const qid = String(payload.question_id || '').trim();
      if (!qid) return { ok: false, error: 'QUESTION_ID_REQUIRED' };
      const col = db.collection(COLLECTIONS.favorites);
      await col.where({ openid: wxctx.OPENID, question_id: qid }).remove();
      return { ok: true };
    }

    case 'listFavorites': {
      const col = db.collection(COLLECTIONS.favorites);
      const r = await col.where({ openid: wxctx.OPENID }).orderBy('created_at', 'desc').get();
      return { ok: true, data: r.data || [] };
    }

    case 'addRecord': {
      const rec = {
        openid: wxctx.OPENID,
        mode: payload.mode || 'sequence',
        score: Number(payload.score || 0),
        correct_count: Number(payload.correct_count || 0),
        total_count: Number(payload.total_count || 0),
        duration: String(payload.duration || ''),
        timestamp: Date.now(),
        created_at: db.serverDate()
      };
      await db.collection(COLLECTIONS.records).add({ data: rec });
      return { ok: true };
    }

    case 'listRecords': {
      const col = db.collection(COLLECTIONS.records);
      const r = await col.where({ openid: wxctx.OPENID }).orderBy('timestamp', 'desc').get();
      return { ok: true, data: r.data || [] };
    }

    default:
      return { ok: false, error: 'UNKNOWN_ACTION' };
  }
}