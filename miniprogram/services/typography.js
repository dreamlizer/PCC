// services/typography.js
// 字体缩放：提供 1-4 档的全局字号设置（通过 CSS 变量覆盖实现）

const KEY = 'pcc_font_scale';

// 统一为 4 档：1(小) 2(标准=默认) 3(大) 4(特大)
function clamp(n, min = 1, max = 4) {
  if (!Number.isFinite(n)) return 2;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function getFontScale() {
  try {
    const v = wx.getStorageSync(KEY);
    return clamp(Number(v) || 2);
  } catch (_) {
    return 2;
  }
}

function setFontScale(n) {
  const v = clamp(Number(n));
  try { wx.setStorageSync(KEY, v); } catch (_) {}
  return v;
}

function getFontScaleClass(scale) {
  const v = clamp(Number(scale) || getFontScale());
  return `font-scale-${v}`;
}

function getFontScaleClassByStorage() {
  return getFontScaleClass(getFontScale());
}

module.exports = {
  getFontScale,
  setFontScale,
  getFontScaleClass,
  getFontScaleClassByStorage,
};
