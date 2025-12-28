const { callCloudFunctionCompat } = require('./dataLoader');
const fallbackLabels = require('./abilityScoreLabels');

const CACHE_KEY = 'pcc_ability_labels_cache_v1';
const CACHE_TS_KEY = 'pcc_ability_labels_cache_ts_v1';

function safeGet(key, fallback) {
  try {
    const v = wx.getStorageSync(key);
    return v !== undefined && v !== '' ? v : fallback;
  } catch (_) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (_) {
    return false;
  }
}

function normalize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(function(it) {
      return {
        id: it && it.id,
        primary_tag: it && it.primary_tag,
        secondary_tag: it && it.secondary_tag,
        options: (it && it.options) || {}
      };
    })
    .filter(function(it) { return it && it.id; });
}

function getCachedAbilityLabels() {
  const v = safeGet(CACHE_KEY, []);
  return Array.isArray(v) ? v : [];
}

function loadAbilityLabelsFromCloud() {
  if (!wx.cloud) return Promise.resolve([]);
  return callCloudFunctionCompat('pccAbilityLabels').then(function(res) {
    const r = res && res.result ? res.result : null;
    const data = (r && r.ok ? r.data : null) || r || [];
    return normalize(data);
  });
}

function getAbilityLabels(opts) {
  const preferCache = !(opts && opts.preferCache === false);

  if (preferCache) {
    const cached = getCachedAbilityLabels();
    if (cached && cached.length) return cached;
  }

  return loadAbilityLabelsFromCloud()
    .then(function(cloud) {
      if (cloud && cloud.length) {
        safeSet(CACHE_KEY, cloud);
        safeSet(CACHE_TS_KEY, Date.now());
        return cloud;
      }
      const cached = getCachedAbilityLabels();
      if (cached && cached.length) return cached;
      return fallbackLabels;
    })
    .catch(function() {
      const cached = getCachedAbilityLabels();
      if (cached && cached.length) return cached;
      return fallbackLabels;
    });
}

module.exports = {
  getAbilityLabels,
  getCachedAbilityLabels,
};
