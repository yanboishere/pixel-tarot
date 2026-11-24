// 运行：node tests/verify.js
// 1) 校验牌数据与像素图尺寸；2) 用暴力枚举验证动态规划得到的分布完全一致。
'use strict';
const path = require('path');
const assert = require('assert');
for (const f of ['cards.js', 'sprites.js', 'probability.js']) require(path.join(__dirname, '..', 'js', f));
const { cards } = globalThis.TarotData;
const { MAJOR, PIPS, COURT } = globalThis.TarotSprites;
const P = globalThis.TarotProb;

assert.strictEqual(cards.length, 78, '应有 78 张牌');
assert.strictEqual(cards.filter((c) => c.arcana === 'major').length, 22);
for (const c of cards) {
  for (const k of ['name', 'kwUp', 'kwRev', 'up', 'rev']) assert.ok(c[k], `${c.id} 缺少 ${k}`);
  assert.ok(c.v.every((v) => Number.isInteger(v) && v >= -3 && v <= 3), `${c.name} 吉凶值越界`);
}
const checkGrid = (name, rows, w, h) => {
  assert.strictEqual(rows.length, h, `${name} 行数应为 ${h}`);
  rows.forEach((r, i) => assert.strictEqual(r.length, w, `${name} 第 ${i} 行宽度 ${r.length} ≠ ${w}`));
};
MAJOR.forEach((m, i) => checkGrid(`MAJOR[${i}]`, m, 15, 15));
Object.entries(PIPS).forEach(([k, m]) => checkGrid(`PIPS.${k}`, m, 7, 7));
Object.entries(COURT).forEach(([k, m]) => checkGrid(`COURT.${k}`, m, 11, 11));
console.log('✓ 78 张牌数据与像素图尺寸正确');

function brute(spread, theme) {
  const k = spread.positions.length;
  const map = new Map();
  const used = new Array(78).fill(false);
  const rec = (pos, score) => {
    if (pos === k) { map.set(score, (map.get(score) || 0) + 1); return; }
    for (let c = 0; c < 78; c++) {
      if (used[c]) continue;
      used[c] = true;
      for (const r of [0, 1]) rec(pos + 1, score + spread.positions[pos].w * P.cardValue(cards[c], r, theme));
      used[c] = false;
    }
  };
  rec(0, 0);
  return map;
}

for (const key of ['single', 'three']) {
  for (const theme of [null, P.THEMES[0], P.THEMES[1]]) {
    const spread = P.SPREADS[key];
    const t0 = Date.now();
    const bf = brute(spread, theme);
    const { counts, offset } = P.distribution(cards, spread, theme);
    let sum = 0;
    counts.forEach((c, i) => {
      sum += c;
      assert.strictEqual(c, bf.get(i - offset) || 0, `${key}/${theme && theme.key} 得分 ${i - offset} 不一致`);
    });
    assert.strictEqual(BigInt(sum), P.totalOutcomes(78, spread.positions.length));
    console.log(`✓ ${spread.name}（主题 ${theme ? theme.name : '无'}）：DP 与暴力枚举 ${sum} 种结果逐项一致（${Date.now() - t0}ms）`);
  }
}

for (const key of ['five', 'celtic']) {
  const spread = P.SPREADS[key];
  const t0 = Date.now();
  const { counts } = P.distribution(cards, spread, P.THEMES[2]);
  const sum = counts.reduce((a, b) => a + b, 0);
  const exact = Number(P.totalOutcomes(78, spread.positions.length));
  assert.ok(Math.abs(sum - exact) / exact < 1e-12, `${key} 总数不符`);
  console.log(`✓ ${spread.name}：覆盖全部 ${P.totalOutcomes(78, spread.positions.length)} 种结果（${Date.now() - t0}ms）`);
}
console.log('全部通过');
