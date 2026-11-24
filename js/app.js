(function () {
  'use strict';

  const { cards, SUITS } = window.TarotData;
  const S = window.TarotSprites;
  const P = window.TarotProb;
  const $ = (id) => document.getElementById(id);

  const state = { wish: '', theme: null, spreadKey: null, deck: [], picked: [], shuffles: 0, flipped: 0 };

  // ---------- 工具 ----------
  function randInt(n) { // 无偏的加密随机整数 [0, n)
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do crypto.getRandomValues(buf); while (buf[0] >= limit);
    return buf[0] % n;
  }
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
  const back = () => S.drawBack(document.createElement('canvas'));
  const face = (card) => S.drawFace(document.createElement('canvas'), card);
  const spread = () => P.SPREADS[state.spreadKey];

  function show(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('active', el.id === id));
    window.scrollTo({ top: 0 });
  }
  function stage(id) {
    document.querySelectorAll('.stage').forEach((el) => el.classList.toggle('active', el.id === id));
  }
  function wishHTML() {
    return state.wish ? `你的愿望：<b>「${esc(state.wish)}」</b>` : '未许愿 · 占卜<b>近期整体运势</b>';
  }

  // ---------- 1. 许愿 ----------
  (function hero() {
    const c = $('hero-card');
    let i = 0;
    const order = [19, 17, 18, 21, 0, 10];
    const draw = () => { S.drawFace(c, cards[order[i++ % order.length]]); };
    S.drawBack(c);
    setInterval(draw, 2200);
  })();

  $('btn-wish').addEventListener('click', () => {
    const w = $('wish').value.trim();
    if (!w) { $('wish').focus(); $('wish').placeholder = '先写下你的愿望，或者点「跳过」'; return; }
    startWith(w);
  });
  $('btn-skip').addEventListener('click', () => startWith(''));
  $('wish').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('btn-wish').click();
  });
  document.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));

  function startWith(wish) {
    state.wish = wish;
    state.theme = P.detectTheme(wish);
    $('wish-echo').innerHTML = wishHTML() + (state.theme ? ` · 识别为<b>${state.theme.name}</b>问题` : '');
    show('s-spread');
  }

  // ---------- 2. 牌阵 ----------
  const list = $('spread-list');
  Object.entries(P.SPREADS).forEach(([key, sp]) => {
    const b = document.createElement('button');
    b.className = 'spread-opt';
    b.innerHTML = `<span class="n">${sp.positions.length}</span><span class="t">${sp.name}</span><span class="d">${sp.desc}</span>` +
      `<span class="mini-pips">${'<i></i>'.repeat(sp.positions.length)}</span>`;
    b.addEventListener('click', () => { state.spreadKey = key; beginRitual(); });
    list.appendChild(b);
  });

  // ---------- 3. 洗牌 → 切牌 → 抽牌 ----------
  function beginRitual() {
    state.deck = cards.map((card) => ({ card, reversed: false }));
    state.picked = [];
    state.shuffles = 0;
    $('btn-to-cut').disabled = true;
    $('btn-shuffle').textContent = '洗牌';
    const pile = $('deck-pile');
    pile.innerHTML = '';
    for (let i = 0; i < 8; i++) { const c = back(); c.style.top = (16 - i * 2) + 'px'; c.style.left = (8 + i) + 'px'; pile.appendChild(c); }
    setRitualText('第 1 步 / 3', '洗牌', '一边洗牌一边默念你的问题。洗牌时部分牌会被翻转，这就是逆位的由来。至少洗一次。');
    stage('stage-shuffle');
    show('s-ritual');
  }
  function setRitualText(step, title, tip) { $('ritual-step').textContent = step; $('ritual-title').textContent = title; $('ritual-tip').textContent = tip; }

  $('btn-shuffle').addEventListener('click', () => {
    const d = state.deck;
    for (let i = d.length - 1; i > 0; i--) { const j = randInt(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
    d.forEach((x) => { if (randInt(2)) x.reversed = !x.reversed; });
    state.shuffles++;
    const pile = $('deck-pile');
    pile.classList.remove('shuffling'); void pile.offsetWidth; pile.classList.add('shuffling');
    $('btn-shuffle').textContent = `再洗一次（已洗 ${state.shuffles} 次）`;
    $('btn-to-cut').disabled = false;
  });

  $('btn-to-cut').addEventListener('click', () => {
    setRitualText('第 2 步 / 3', '切牌', '用左手把牌分成三叠。凭直觉选一叠，它会被放到最上面。');
    const wrap = $('cut-piles');
    wrap.innerHTML = '';
    const a = 10 + randInt(20), b = a + 10 + randInt(30);
    const piles = [state.deck.slice(0, a), state.deck.slice(a, b), state.deck.slice(b)];
    piles.forEach((p, i) => {
      const btn = document.createElement('button');
      btn.className = 'cut-pile';
      btn.setAttribute('aria-label', `第 ${i + 1} 叠，${p.length} 张`);
      const n = Math.max(2, Math.round(p.length / 8));
      for (let j = 0; j < n; j++) { const c = back(); c.style.top = (n - j) * 3 + 'px'; c.style.left = j * 2 + 'px'; btn.appendChild(c); }
      btn.insertAdjacentHTML('beforeend', `<div class="spacer"></div><span>${['左', '中', '右'][i]} · ${p.length} 张</span>`);
      btn.addEventListener('click', () => {
        state.deck = [p, ...piles.filter((_, k) => k !== i)].flat();
        beginPick();
      });
      wrap.appendChild(btn);
    });
    stage('stage-cut');
  });

  function beginPick() {
    const sp = spread();
    setRitualText('第 3 步 / 3', `抽 ${sp.positions.length} 张牌`, '牌已在你面前展开。跟随直觉，依次点选牌阵中每个位置的牌。');
    const slots = $('pick-slots');
    slots.innerHTML = sp.positions.map((p, i) => `<div class="slot-mini" id="mini-${i}"><div class="box"></div>${i + 1}.${p.name}</div>`).join('');
    const fan = $('fan');
    fan.innerHTML = '';
    state.deck.forEach((entry, i) => {
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', `第 ${i + 1} 张牌`);
      btn.appendChild(back());
      btn.addEventListener('click', () => pick(btn, entry));
      fan.appendChild(btn);
    });
    stage('stage-pick');
  }

  function pick(btn, entry) {
    const sp = spread();
    if (btn.classList.contains('taken') || state.picked.length >= sp.positions.length) return;
    btn.classList.add('taken');
    const idx = state.picked.length;
    state.picked.push(entry);
    const mini = $('mini-' + idx);
    mini.classList.add('filled');
    mini.querySelector('.box').appendChild(back());
    if (state.picked.length === sp.positions.length) setTimeout(beginReading, 500);
  }

  // ---------- 4. 翻牌与解读 ----------
  function beginReading() {
    const sp = spread();
    state.flipped = 0;
    $('reading-wish').innerHTML = wishHTML();
    $('reading-title').textContent = sp.name;
    $('reading-tip').textContent = '点击每张牌将它翻开';
    $('btn-flip-all').hidden = false;
    $('result').hidden = true;
    const board = $('board');
    board.className = 'spread-board ' + state.spreadKey;
    board.innerHTML = '';
    state.picked.forEach((d, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.style.gridArea = state.spreadKey === 'celtic' && i === 1 ? 'c1' : 'c' + (i + 1);
      const crossLabel = state.spreadKey === 'celtic' && i === 0 ? ` · <b>2</b> ${sp.positions[1].name}（横置）` : '';
      slot.innerHTML = `<div class="pos"><b>${i + 1}</b> ${sp.positions[i].name}${crossLabel}</div>`;
      const cardBtn = document.createElement('button');
      cardBtn.className = 'card3d';
      cardBtn.setAttribute('aria-label', `翻开「${sp.positions[i].name}」位置的牌`);
      cardBtn.innerHTML = `<div class="inner"><div class="face back"></div><div class="face front${d.reversed ? ' reversed' : ''}"></div></div>`;
      cardBtn.querySelector('.back').appendChild(back());
      cardBtn.querySelector('.front').appendChild(face(d.card));
      const name = document.createElement('div');
      name.className = 'cname';
      cardBtn.addEventListener('click', () => flip(cardBtn, name, d));
      slot.append(cardBtn, name);
      board.appendChild(slot);
    });
    show('s-reading');
  }

  function flip(btn, nameEl, d) {
    if (btn.classList.contains('flipped')) return;
    btn.classList.add('flipped');
    btn.setAttribute('aria-label', `${d.card.name}${d.reversed ? '（逆位）' : '（正位）'}`);
    nameEl.innerHTML = esc(d.card.name) + (d.reversed ? ' <em>逆</em>' : '');
    state.flipped++;
    if (state.flipped === state.picked.length) {
      $('btn-flip-all').hidden = true;
      $('reading-tip').textContent = '正在穷举全部可能的牌阵结果……';
      setTimeout(renderResult, 650);
    }
  }
  $('btn-flip-all').addEventListener('click', () => {
    document.querySelectorAll('#board .card3d:not(.flipped)').forEach((b, i) => setTimeout(() => b.click(), i * 120));
  });

  function verdictOf(p) {
    if (p >= 0.85) return ['大吉', '星辰为你让路，这件事成功的可能性非常高。'];
    if (p >= 0.65) return ['吉', '整体走势向好，保持行动，结果值得期待。'];
    if (p >= 0.45) return ['平', '成败参半，关键在于你接下来的选择。'];
    if (p >= 0.25) return ['小阻', '前路有阻碍，需要调整方法或多一些耐心。'];
    return ['逆风', '时机尚未成熟，与其强求，不如先积蓄力量。'];
  }

  function renderResult() {
    const sp = spread();
    const theme = state.theme;
    const draws = state.picked;
    const t0 = performance.now();
    const a = P.analyze(cards, sp, draws, theme);
    const ms = Math.round(performance.now() - t0);
    $('reading-tip').textContent = '牌已全部翻开';

    // 概率主卡
    $('prob-label').innerHTML = (state.wish ? `「<b>${esc(state.wish)}</b>」成真的概率` : '近期整体运势顺遂的概率');
    $('prob-value').textContent = pct(a.probability);
    $('meter-fill').style.width = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { $('meter-fill').style.width = pct(a.probability, 2); }));
    const [tag, text] = verdictOf(a.probability);
    $('verdict').innerHTML = `<span class="tag">${tag}</span>${text}`;

    // 逐张解读
    const ol = $('readings');
    ol.innerHTML = '';
    draws.forEach((d, i) => {
      const pos = sp.positions[i];
      const c = d.card;
      const li = document.createElement('li');
      const cv = face(c);
      if (d.reversed) cv.classList.add('reversed');
      const suit = c.suit ? SUITS[c.suit] : null;
      const notes = [];
      notes.push(`「${pos.name}」位：${pos.hint}。`);
      notes.push(suit ? `${suit.zh}属${suit.element}元素，对应${suit.domain}。` : '大阿卡纳，代表命运层面的重要课题。');
      if (theme && c.suit === theme.suit) notes.push(`这张牌与你的${theme.name}问题同属一个元素，影响力加倍。`);
      li.appendChild(cv);
      li.insertAdjacentHTML('beforeend',
        `<div><p class="h"><span class="pos">${i + 1}·${pos.name}</span>${c.name} <small>${c.en}</small> · ${d.reversed ? '<em>逆位</em>' : '正位'}</p>` +
        `<p class="kw">${d.reversed ? c.kwRev : c.kwUp}</p>` +
        `<p>${d.reversed ? c.rev : c.up}</p>` +
        `<p class="note">${notes.join('')}</p></div>`);
      ol.appendChild(li);
    });

    // 综合解读
    $('summary').innerHTML = synthesis(sp, draws, theme, a);

    // 统计
    const exactStr = a.exact.toLocaleString('en-US');
    const sci = Number(a.exact).toExponential(2).replace('e+', ' × 10^');
    const k = sp.positions.length;
    const stats = [
      ['全部可能结果', `${exactStr} 种`, `78 张牌有序抽 ${k} 张（${78}×…×${79 - k}）× 2^${k} 种正逆位`],
      ['本次牌面得分', `${a.score}`, `理论范围 ${a.minS} ~ ${a.maxS}，全体平均 ${a.mean.toFixed(2)}`],
      ['比本次更不利的结果', pct(a.below, 2), `与本次同分的结果占 ${pct(a.equal, 2)}`],
      ['随机一次占卜偏吉的概率', pct(a.positive, 2), '即全部结果中得分 > 0 的比例'],
      ['抽到完全相同牌面的概率', `1 / ${k > 3 ? sci : exactStr}`, '同样的牌、同样的位置、同样的正逆'],
      ['识别出的问题领域', theme ? `${theme.name}（${SUITS[theme.suit].zh}牌加权）` : '未指定 · 综合运势', `精确穷举耗时 ${ms}ms`],
    ];
    $('stats').innerHTML = stats.map(([kk, v, sub]) => `<div class="stat"><span class="k">${kk}</span><span class="v">${v}</span><span class="k">${sub}</span></div>`).join('');

    renderHisto(a);
    $('method').innerHTML = methodHTML(sp, theme, a);
    $('result').hidden = false;
  }

  function synthesis(sp, draws, theme, a) {
    const k = draws.length;
    const majors = draws.filter((d) => d.card.arcana === 'major').length;
    const revs = draws.filter((d) => d.reversed).length;
    const out = [];
    if (k > 1) {
      if (majors === 0) out.push('牌面中没有大阿卡纳，这件事更多取决于日常的选择与行动，<b>主动权在你手里</b>。');
      else if (majors / k >= 0.5) out.push(`${majors} 张大阿卡纳占了多数，这件事牵动着<b>更大的命运走向</b>，有些部分并不完全由你掌控。`);
      else out.push(`出现了 ${majors} 张大阿卡纳，事情中有值得重视的关键转折。`);
      const counts = {};
      draws.forEach((d) => { if (d.card.suit) counts[d.card.suit] = (counts[d.card.suit] || 0) + 1; });
      const top = Object.entries(counts).sort((x, y) => y[1] - x[1])[0];
      if (top && top[1] >= 2) out.push(`${SUITS[top[0]].zh}牌出现 ${top[1]} 次，提醒你重点关注<b>${SUITS[top[0]].domain}</b>。`);
      if (revs === 0) out.push('所有牌都是正位，能量流动顺畅。');
      else if (revs / k > 0.5) out.push(`逆位牌偏多（${revs}/${k}），说明能量受阻或向内收缩，先处理<b>内在的卡点</b>，外部才会松动。`);
      else out.push(`有 ${revs} 张逆位牌，提示局部存在需要留意的阻滞。`);
    }
    const lastIdx = sp.positions.length - 1;
    const last = draws[lastIdx];
    out.push(`最关键的「${sp.positions[lastIdx].name}」位置出现了 <b>${last.card.name}${last.reversed ? '（逆位）' : ''}</b>：${last.reversed ? last.card.rev : last.card.up}`);
    const p = a.probability;
    const [tag] = verdictOf(p);
    out.push(`综合全部牌面，在所有可能的抽牌结果中，你这一组胜过了 <b>${pct(a.percentile)}</b> 的结果（同分按一半计），判定为「<b>${tag}</b>」。` +
      (p >= 0.5 ? '顺势而为，同时别忘了行动本身才是让愿望成真的那一步。' : '牌面只反映当下的能量，改变做法，结局也会随之改变。'));
    return out.map((s) => `<p>${s}</p>`).join('');
  }

  function renderHisto(a) {
    const box = $('histo');
    box.innerHTML = '';
    const lo = a.minS + a.offset, hi = a.maxS + a.offset;
    let max = 0;
    for (let i = lo; i <= hi; i++) max = Math.max(max, a.counts[i]);
    let tip = document.querySelector('.histo-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'histo-tip'; tip.hidden = true; document.body.appendChild(tip); }
    for (let i = lo; i <= hi; i++) {
      const s = i - a.offset;
      const bar = document.createElement('div');
      bar.className = 'bar' + (s === a.score ? ' me' : '');
      const h = a.counts[i] / max;
      bar.style.height = a.counts[i] > 0 ? Math.max(1, h * 100) + '%' : '0';
      const label = `得分 ${s}：${pct(a.counts[i] / a.total, 3)} 的结果` + (s === a.score ? '（本次）' : '');
      bar.setAttribute('aria-label', label);
      bar.addEventListener('mousemove', (e) => { tip.hidden = false; tip.textContent = label; tip.style.left = e.clientX + 12 + 'px'; tip.style.top = e.clientY - 32 + 'px'; });
      bar.addEventListener('mouseleave', () => { tip.hidden = true; });
      box.appendChild(bar);
    }
    box.setAttribute('aria-label', `得分分布，从 ${a.minS} 到 ${a.maxS}，本次得分 ${a.score}`);
    $('axis-min').textContent = a.minS;
    $('axis-max').textContent = a.maxS;
  }

  function methodHTML(sp, theme, a) {
    const ws = sp.positions.map((p) => `${p.name}×${p.w}`).join('、');
    return `<ol>
      <li>每张牌按传统牌义赋予一个吉凶值（-3 ~ +3），正位与逆位各不相同，例如太阳正位 +3、高塔正位 -3、恶魔逆位 +1。</li>
      <li>${theme ? `你的愿望被识别为「${theme.name}」，与之同元素的${SUITS[theme.suit].zh}牌影响加倍：正位 +1、逆位 -1。` : '未识别出具体领域，所有花色同等看待。'}</li>
      <li>牌阵各位置有不同权重（${ws}），整组牌的得分 = Σ 位置权重 × 牌值。</li>
      <li>穷举 78 张牌有序抽取 ${sp.positions.length} 张、每张两种朝向的<b>全部 ${a.exact.toLocaleString('en-US')} 种</b>结果的得分。为了在浏览器里瞬间完成，使用「位置子集 × 得分」的动态规划精确计数，结果与逐一枚举完全相同（项目附带的测试对 3 张牌阵做了 365 万种结果的逐项暴力比对）。</li>
      <li>事件成真概率 = 得分低于本次的结果占比 + 同分结果占比 / 2，并限制在 1% ~ 99% 之间——塔罗从不给出绝对的答案。</li>
    </ol>`;
  }

  $('btn-again').addEventListener('click', beginRitual);
  $('btn-restart').addEventListener('click', () => { $('wish').value = ''; show('s-wish'); });
})();
