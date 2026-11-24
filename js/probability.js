/* 牌阵定义 + 穷举概率模型。
 *
 * 一次占卜的结果 = 从 78 张牌中有序抽出 k 张放到 k 个位置上，且每张有正/逆两种朝向，
 * 共 78!/(78-k)! × 2^k 种等可能结果。每种结果按
 *     score = Σ 位置权重 × (牌的吉凶值 + 主题加成)
 * 打分。我们用「子集动态规划」精确统计全部结果的得分分布（等价于逐一枚举，
 * 但对凯尔特十字这种 4.7×10^21 种结果也能在一秒内完成），
 * 然后看本次结果在全体可能中的位置，得到事件成真的概率。
 */
(function (root) {
  'use strict';

  const SPREADS = {
    single: {
      name: '单张指引', desc: '一张牌，直指核心', positions: [
        { name: '指引', hint: '这张牌是此刻对你的问题最直接的回答', w: 3 },
      ],
    },
    three: {
      name: '时间之流', desc: '过去 · 现在 · 未来', positions: [
        { name: '过去', hint: '影响这件事的过往根源', w: 1 },
        { name: '现在', hint: '你当下所处的状态', w: 2 },
        { name: '未来', hint: '若保持现状，事情最可能的走向', w: 3 },
      ],
    },
    five: {
      name: '愿望之路', desc: '现状 · 阻碍 · 助力 · 建议 · 结果', positions: [
        { name: '现状', hint: '愿望目前的处境', w: 2 },
        { name: '阻碍', hint: '横在你与愿望之间的东西', w: 2 },
        { name: '助力', hint: '能帮助你的人或力量', w: 1 },
        { name: '建议', hint: '你接下来应当采取的态度', w: 1 },
        { name: '结果', hint: '这件事最终的结局', w: 3 },
      ],
    },
    celtic: {
      name: '凯尔特十字', desc: '十张牌，全方位解读', positions: [
        { name: '现状', hint: '问题的核心与当前处境', w: 2 },
        { name: '阻碍', hint: '横亘在面前的挑战', w: 2 },
        { name: '根基', hint: '事情深层的根源', w: 1 },
        { name: '过去', hint: '刚刚过去、正在远离的影响', w: 1 },
        { name: '目标', hint: '你意识层面的期望', w: 1 },
        { name: '近未来', hint: '即将发生的事', w: 2 },
        { name: '自我', hint: '你在这件事中的姿态', w: 1 },
        { name: '环境', hint: '周围的人和外在环境', w: 1 },
        { name: '希望与恐惧', hint: '你内心的期盼与担忧', w: 1 },
        { name: '最终结果', hint: '综合一切之后的结局', w: 3 },
      ],
    },
  };

  const THEMES = [
    { key: 'love', name: '感情', suit: 'cups', words: ['爱', '恋', '喜欢', '感情', '复合', '结婚', '婚', '表白', '对象', '男朋友', '女朋友', '男友', '女友', '暗恋', '前任', '脱单', '桃花', '他', '她', 'ta', 'TA', '心动', '分手', '约会'] },
    { key: 'money', name: '财富', suit: 'pentacles', words: ['钱', '财', '投资', '收入', '赚', '股票', '基金', '币', '买房', '房子', '工资', '薪', '彩票', '中奖', '理财', '债', '生意', '发财'] },
    { key: 'career', name: '事业', suit: 'wands', words: ['工作', '事业', 'offer', 'Offer', '面试', '升职', '加薪', '项目', '创业', '跳槽', '老板', '公司', '求职', '入职', '晋升', '比赛', '上线', '融资'] },
    { key: 'study', name: '学业', suit: 'swords', words: ['考试', '学习', '考研', '录取', '论文', '成绩', '留学', '申请', '考', '上岸', '毕业', '学校', '雅思', '托福', '高考', '答辩', '证书'] },
    { key: 'health', name: '健康', suit: 'wands', words: ['健康', '病', '身体', '手术', '康复', '恢复', '减肥', '睡眠', '怀孕', '医院'] },
  ];

  function detectTheme(wish) {
    if (!wish) return null;
    let best = null, bestHits = 0;
    for (const t of THEMES) {
      const hits = t.words.reduce((n, w) => n + (wish.includes(w) ? 1 : 0), 0);
      if (hits > bestHits) { best = t; bestHits = hits; }
    }
    return best;
  }

  // 牌在某朝向下的吉凶值（含主题加成：与愿望同元素的牌作用放大）
  function cardValue(card, reversed, theme) {
    let v = card.v[reversed ? 1 : 0];
    if (theme && card.suit === theme.suit) v += reversed ? -1 : 1;
    return v;
  }

  function scoreReading(draws, spread, theme) {
    return draws.reduce((s, d, i) => s + spread.positions[i].w * cardValue(d.card, d.reversed, theme), 0);
  }

  // 精确分布：dist[s + offset] = 得分为 s 的结果数（浮点计数，总和 = 78P k × 2^k）
  function distribution(cards, spread, theme) {
    const k = spread.positions.length;
    const ws = spread.positions.map((p) => p.w);
    let maxV = 0;
    for (const c of cards) for (const r of [0, 1]) maxV = Math.max(maxV, Math.abs(cardValue(c, r, theme)));
    const offset = ws.reduce((a, b) => a + b, 0) * maxV;
    const R = offset * 2 + 1;
    const full = (1 << k) - 1;
    const dp = new Float64Array((full + 1) * R);
    dp[offset] = 1;

    for (const c of cards) {
      const vals = [cardValue(c, 0, theme), cardValue(c, 1, theme)];
      // 掩码从大到小遍历，保证每张牌至多被放入一个位置（0/1 背包）
      for (let mask = full - 1; mask >= 0; mask--) {
        const base = mask * R;
        let lo = -1, hi = -1;
        for (let s = 0; s < R; s++) if (dp[base + s] !== 0) { if (lo < 0) lo = s; hi = s; }
        if (lo < 0) continue;
        for (let p = 0; p < k; p++) {
          if (mask & (1 << p)) continue;
          const tgt = (mask | (1 << p)) * R;
          for (let o = 0; o < 2; o++) {
            const delta = ws[p] * vals[o];
            for (let s = lo; s <= hi; s++) {
              const x = dp[base + s];
              if (x !== 0) dp[tgt + s + delta] += x;
            }
          }
        }
      }
    }
    return { counts: dp.slice(full * R, full * R + R), offset };
  }

  function totalOutcomes(n, k) {
    let t = 1n;
    for (let i = 0; i < k; i++) t *= BigInt(n - i);
    return t * (1n << BigInt(k));
  }

  function analyze(cards, spread, draws, theme) {
    const { counts, offset } = distribution(cards, spread, theme);
    const score = scoreReading(draws, spread, theme);
    let total = 0, below = 0, equal = 0, positive = 0, mean = 0;
    for (let i = 0; i < counts.length; i++) {
      const s = i - offset, c = counts[i];
      total += c; mean += s * c;
      if (s < score) below += c;
      if (s === score) equal += c;
      if (s > 0) positive += c;
    }
    mean /= total;
    const percentile = (below + equal / 2) / total;
    // 事件成真概率：本次牌面在全部可能结果中的相对位置，夹在 1%~99%（塔罗从不给出绝对结论）
    const probability = Math.min(0.99, Math.max(0.01, percentile));
    let minS = 0, maxS = 0;
    for (let i = 0; i < counts.length; i++) if (counts[i] > 0) { minS = i - offset; break; }
    for (let i = counts.length - 1; i >= 0; i--) if (counts[i] > 0) { maxS = i - offset; break; }
    return {
      score, counts, offset, total, mean, minS, maxS,
      below: below / total, equal: equal / total, positive: positive / total,
      percentile, probability,
      exact: totalOutcomes(cards.length, spread.positions.length),
    };
  }

  root.TarotProb = { SPREADS, THEMES, detectTheme, cardValue, scoreReading, distribution, analyze, totalOutcomes };
})(typeof window !== 'undefined' ? window : globalThis);
