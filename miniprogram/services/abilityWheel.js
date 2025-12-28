function clamp(n, a, b) {
  const v = Number(n);
  if (isNaN(v)) return a;
  if (v < a) return a;
  if (v > b) return b;
  return v;
}

function pad2(n) {
  const s = String(n);
  return s.length >= 2 ? s : ('0' + s);
}

function normalizeText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '');
}

function parseHexColor(input, fallback) {
  const s = String(input || '').trim();
  const m = s.match(/^#([0-9a-f]{6})$/i);
  if (!m) return fallback;
  const hex = m[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function rgbToHex(rgb) {
  const to = function(x) {
    const v = Math.max(0, Math.min(255, Math.round(Number(x) || 0)));
    return pad2(v.toString(16));
  };
  return '#' + to(rgb.r) + to(rgb.g) + to(rgb.b);
}

function mixColor(c1, c2, t) {
  const k = clamp(t, 0, 1);
  return {
    r: c1.r + (c2.r - c1.r) * k,
    g: c1.g + (c2.g - c1.g) * k,
    b: c1.b + (c2.b - c1.b) * k
  };
}

function resolveColor(theme, name, fallback) {
  const hex = theme && theme[name];
  return parseHexColor(hex, fallback);
}

function defaultCompetencyDefs() {
  return [
    { key: 'growth', label: '促进客户成长', match: ['促进客户成长', 'facilitatesclientgrowth', 'clientgrowth'] },
    { key: 'mindset', label: '体现教练思维', match: ['体现教练思维', 'embodiesacoachingmindset', 'coachingmindset'] },
    { key: 'ethics', label: '展现道德实践', match: ['展现道德实践', 'demonstratesethicalpractice', 'ethicalpractice'] },
    { key: 'agreements', label: '建立维护协议', match: ['建立和维护协议', '建立维护协议', 'establishesandmaintainsagreements', 'maintainsagreements', 'agreements'] },
    { key: 'trust', label: '培养信任安全', match: ['培养信任和安全', '培养信任安全', 'cultivatestrustandsafety', 'trustandsafety'] },
    { key: 'presence', label: '保持同在感', match: ['保持同在感', 'maintainspresence', 'presence'] },
    { key: 'listening', label: '积极倾听', match: ['积极倾听', 'listensactively', 'activelylistens', 'listening'] },
    { key: 'awareness', label: '唤起觉察', match: ['唤起觉察', '唤起意识', 'evokesawareness', 'awareness'] },
  ];
}

function pickPercentByMatchers(abilityList, matchers) {
  let best = 0;
  const mList = (matchers || []).map(function(x) { return normalizeText(x); });
  for (let i = 0; i < (abilityList || []).length; i++) {
    const it = abilityList[i];
    const tag = normalizeText(it && it.tag);
    if (!tag) continue;
    for (let j = 0; j < mList.length; j++) {
      const m = mList[j];
      if (!m) continue;
      if (tag.indexOf(m) >= 0) {
        const p = clamp(it && it.percent, 0, 100);
        if (p > best) best = p;
        break;
      }
    }
  }
  return best;
}

function splitLabelLines(label) {
  const s = String(label || '');
  const len = s.length;
  if (len <= 4) return [s];
  if (len <= 6) return [s.slice(0, 3), s.slice(3)];
  return [s.slice(0, 4), s.slice(4)];
}

function computeTop2Index(values) {
  const arr = [];
  for (let i = 0; i < values.length; i++) arr.push({ i: i, v: values[i] });
  arr.sort(function(a, b) { return b.v - a.v; });
  const set = {};
  for (let k = 0; k < Math.min(2, arr.length); k++) set[arr[k].i] = true;
  return set;
}

function angleToPos(deg) {
  const d = (Number(deg) % 360 + 360) % 360;
  if (d < 45) return 'tr';
  if (d < 90) return 'r';
  if (d < 135) return 'br';
  if (d < 180) return 'b';
  if (d < 225) return 'bl';
  if (d < 270) return 'l';
  if (d < 315) return 'tl';
  return 't';
}

function buildAbilityWheelModel(abilityList, theme) {
  const defs = defaultCompetencyDefs();
  const items = defs.map(function(d) {
    return {
      key: d.key,
      label: d.label,
      value: pickPercentByMatchers(abilityList, d.match)
    };
  });

  const values = items.map(function(x) { return x.value; });
  const top2 = computeTop2Index(values);

  const N = items.length;
  const slotsMap = {};
  for (let i = 0; i < N; i++) {
    const midDeg = (i + 0.5) * (360 / N);
    const pos = angleToPos(midDeg);
    slotsMap[pos] = { pos: pos, key: items[i].key, lines: splitLabelLines(items[i].label) };
  }
  const slotsOrder = ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'];
  const slots = slotsOrder
    .map(function(pos) {
      return slotsMap[pos] || { pos: pos, key: pos, lines: [] };
    })
    .filter(function(x) { return x && x.lines && x.lines.length; });

  const heroFrom = resolveColor(theme, 'heroFrom', { r: 11, g: 31, b: 168 });
  const heroTo = resolveColor(theme, 'heroTo', { r: 9, g: 27, b: 144 });
  const gold = resolveColor(theme, 'accentFrom', { r: 245, g: 179, b: 53 });

  return {
    items: items,
    slots: slots,
    top2: top2,
    colors: {
      heroFrom: rgbToHex(heroFrom),
      heroTo: rgbToHex(heroTo),
      gold: rgbToHex(gold),
    }
  };
}

function drawSector(ctx, cx, cy, radius, start, end) {
  const offset = -Math.PI / 2;
  const a1 = start + offset;
  const a2 = end + offset;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, radius, a1, a2, false);
  ctx.closePath();
}

function drawAbilityWheel(canvas, sizePx, model, theme) {
  if (!canvas || !canvas.getContext) return false;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const sys = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { pixelRatio: 1 };
  const dpr = sys && sys.pixelRatio ? sys.pixelRatio : 1;
  const size = Math.max(1, Math.floor(Number(sizePx) || 0));

  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const items = (model && model.items) || [];
  const top2 = (model && model.top2) || {};
  const N = items.length || 8;
  const wedge = (Math.PI * 2) / N;

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.34;

  const sectorBg1 = '#EEF1FA';
  const sectorBg2 = '#E6EAF6';
  const outer = '#B9BDD1';
  const divider = '#FFFFFF';

  const heroFrom = resolveColor(theme, 'heroFrom', { r: 11, g: 31, b: 168 });
  const heroTo = resolveColor(theme, 'heroTo', { r: 9, g: 27, b: 144 });
  const gold = resolveColor(theme, 'accentFrom', { r: 245, g: 179, b: 53 });
  const blueLight1 = { r: 201, g: 214, b: 255 };
  const blueLight2 = { r: 195, g: 208, b: 255 };

  for (let i = 0; i < N; i++) {
    const start = i * wedge;
    const end = (i + 1) * wedge;

    ctx.fillStyle = (i % 2 === 0) ? sectorBg1 : sectorBg2;
    drawSector(ctx, cx, cy, R, start, end);
    ctx.fill();

    const v = clamp(items[i] && items[i].value, 0, 100);
    const rr = (v / 100) * R;
    const t = v / 100;
    const base = (i % 2 === 0) ? blueLight1 : blueLight2;
    const deep = (i % 2 === 0) ? heroFrom : heroTo;
    const fillRgb = mixColor(base, deep, 0.25 + 0.75 * t);
    ctx.fillStyle = rgbToHex(fillRgb);
    drawSector(ctx, cx, cy, rr, start, end);
    ctx.fill();

    if (top2[i]) {
      ctx.strokeStyle = rgbToHex(gold);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3;
      drawSector(ctx, cx, cy, R, start, end);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = rgbToHex(gold);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, R / 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, (2 * R) / 3, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = outer;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = divider;
  ctx.lineWidth = 4;
  for (let i = 0; i < N; i++) {
    const ang = i * wedge - Math.PI / 2;
    const x2 = cx + R * Math.cos(ang);
    const y2 = cy + R * Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  return true;
}

module.exports = {
  buildAbilityWheelModel: buildAbilityWheelModel,
  drawAbilityWheel: drawAbilityWheel,
};

