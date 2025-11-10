// 用户数据服务：封装云函数调用，便于前端使用与维护
function call(action, payload = {}) {
  return wx.cloud.callFunction({ name: 'pccUser', data: { action, payload } });
}

function initUserData() {
  return call('init');
}

function saveUserName(name) {
  return call('saveProfile', { name });
}

function addFavorite(question_id) {
  return call('addFavorite', { question_id });
}

function removeFavorite(question_id) {
  return call('removeFavorite', { question_id });
}

function listFavorites() {
  return call('listFavorites');
}

function addRecord(record) {
  return call('addRecord', record);
}

function listRecords() {
  return call('listRecords');
}

function initUserDataIfNeeded() {
  try {
    const key = 'pcc_user_init_done';
    const done = wx.getStorageSync(key);
    if (!done) {
      return initUserData().then(() => {
        wx.setStorageSync(key, Date.now());
        console.log('用户数据集合已初始化');
      }).catch(err => {
        console.warn('用户数据集合初始化失败', err);
      });
    }
  } catch (_) {}
  return Promise.resolve();
}

module.exports = {
  initUserData,
  initUserDataIfNeeded,
  saveUserName,
  addFavorite,
  removeFavorite,
  listFavorites,
  addRecord,
  listRecords
};