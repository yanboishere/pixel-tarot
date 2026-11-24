/* 像素牌面：全部由字符位图在 canvas 上逐像素绘制。 */
(function (root) {
  'use strict';

  const PAL = {
    k: '#1a1030', w: '#f4f0e0', y: '#ffd34e', o: '#f08a24', r: '#d8413a',
    p: '#b45cd6', b: '#4aa3df', n: '#2b5fb3', g: '#5cc46a', d: '#2e7a3c',
    s: '#a7b3c2', m: '#8a5a34', c: '#ffc9a8', h: '#8f2d56',
  };

  // 大阿卡纳图标（15×15）
  const MAJOR = [
    [ // 0 愚者：行囊与白玫瑰
      '..........rrr..', '.........rrrrr.', '.........rrwrr.', '.........mrrr..', '........m......',
      '.......m.......', '......m........', '.....m.........', '....m..........', '...m...........',
      '..m....w.w.....', '.m......y......', 'm......w.w.....', '........g......', 'dddddddd.......'],
    [ // 1 魔术师：∞ 与权杖
      '...yyy...yyy...', '..y...y.y...y..', '..y....y....y..', '..y...y.y...y..', '...yyy...yyy...',
      '...............', '.......w.......', '......wrw......', '.......r.......', '.......r.......',
      '.......r.......', '.......r.......', '......wrw......', '.......w.......', '.rrrrrrrrrrrrr.'],
    [ // 2 女祭司：黑白双柱与月亮
      'kkk...yyy...www', '.k..y........w.', '.k..y........w.', '.k...yyy.....w.', '.k...........w.',
      '.k....bbb....w.', '.k...bbbbb...w.', '.k...bwwwb...w.', '.k...bwkwb...w.', '.k...bwwwb...w.',
      '.k...bbbbb...w.', '.k...bbbbb...w.', '.k..bbbbbbb..w.', 'kkk.bbbbbbb.www', 'kkkkkkkkkwwwwww'],
    [ // 3 皇后：金星符号与麦田
      '...y...y...y...', '...............', '.....yyyyy.....', '....ycccccy....', '...ycccccccy...',
      '...ycccccccy...', '...ycccccccy...', '....ycccccy....', '.....yyyyy.....', '.......y.......',
      '.......y.......', '....yyyyyyy....', '.......y.......', '.......y.......', '.g.g.g.g.g.g.g.'],
    [ // 4 皇帝：王冠与王座
      '...............', '.y.....y.....y.', '.yy...yyy...yy.', '.yyy.yyyyy.yyy.', '.yyyyyyyyyyyyy.',
      '.yyrryybyyrryy.', '.yyyyyyyyyyyyy.', '...............', '..sssssssssss..', '..s.........s..',
      '..s..rrrrr..s..', '..s..rrrrr..s..', '..s.........s..', '..sssssssssss..', '.sssssssssssss.'],
    [ // 5 教皇：三重十字
      '.......y.......', '.....yyyyy.....', '.......y.......', '....yyyyyyy....', '.......y.......',
      '...yyyyyyyyy...', '.......y.......', '.......y.......', '.......y.......', '.......y.......',
      '.......y.......', '.......y.......', '.....mmmmm.....', '....mmmmmmm....', '...mmmmmmmmm...'],
    [ // 6 恋人：两颗心
      '...............', '.rr.rr.........', 'rrrrrrr........', 'rrrrrrr........', '.rrrrr.........',
      '..rrr..........', '...r....cc.cc..', '.......ccccccc.', '.......ccccccc.', '........ccccc..',
      '.........ccc...', '..........c....', '...............', '...y.......y...', '..yyy.....yyy..'],
    [ // 7 战车
      '..b.b.b.b.b.b..', '..bbbbbbbbbbb..', '...s.......s...', '...s...y...s...', '...s..yyy..s...',
      '...s...y...s...', '..sssssssssss..', '..sbbbbbbbbbs..', '..sbbbbybbbbs..', '..sbbbbbbbbbs..',
      '..sssssssssss..', '.mmm.......mmm.', 'mmymm.....mmymm', '.mmm.......mmm.', '...............'],
    [ // 8 力量：狮子与 ∞
      '....yy...yy....', '...y..y.y..y...', '....yy...yy....', '...ooooooooo...', '..ooyyyyyyyoo..',
      '.ooyyyyyyyyyoo.', '.ooykyyyyykyoo.', '.ooyyyyyyyyyoo.', '.ooyyyykyyyyoo.', '.ooyyyrrryyyoo.',
      '..ooyyyyyyyoo..', '...ooyyyyyoo...', '....ooooooo....', '.....ooooo.....', '...............'],
    [ // 9 隐者：提灯
      '.......m.......', '......mmm......', '.....sssss.....', '....s.....s....', '....s..y..s....',
      '....s.yyy.s....', '....syyyyys....', '....s.yyy.s....', '....s..y..s....', '....s.....s....',
      '.....sssss.....', '......sss......', '...............', '..o.........o..', '...............'],
    [ // 10 命运之轮
      '.....yyyyy.....', '...yy..y..yy...', '..y....y....y..', '.y.y...y...y.y.', '.y..y..y..y..y.',
      'y....y.y.y....y', 'y.....yyy.....y', 'yyyyyyyoyyyyyyy', 'y.....yyy.....y', 'y....y.y.y....y',
      '.y..y..y..y..y.', '.y.y...y...y.y.', '..y....y....y..', '...yy..y..yy...', '.....yyyyy.....'],
    [ // 11 正义：天平
      '.......y.......', '.......y.......', '.yyyyyyyyyyyyy.', '.y.....y.....y.', '.y.....y.....y.',
      'y.y....y....y.y', 'yyyyy..y..yyyyy', '.yyy...y...yyy.', '.......y.......', '.......y.......',
      '.......y.......', '.......y.......', '.....yyyyy.....', '....yyyyyyy....', '...............'],
    [ // 12 倒吊人
      'mmmmmmmmmmmmmmm', '.......m.......', '.......m.......', '......r.r......', '......rrr......',
      '......rr.......', '.......r.......', '.....bbbbb.....', '.....bbbbb.....', '....b.bbb.b....',
      '...b..bbb..b...', '.....yyyyy.....', '....ycccccy....', '....ycccccy....', '.....yyyyy.....'],
    [ // 13 死神：骷髅
      '...............', '....wwwwwww....', '...wwwwwwwww...', '..wwwwwwwwwww..', '..wwwwwwwwwww..',
      '..wkkkwwwkkkw..', '..wkkkwwwkkkw..', '..wwwwwkwwwww..', '...wwwwwwwww...', '....wkwkwkw....',
      '....wwwwwww....', '...............', '.ww.........ww.', '...ww.....ww...', '.....wwwww.....'],
    [ // 14 节制：两杯之间流动的水
      'yyyyy..........', '.yyy.b.........', '..y...b........', '.yyy...b.......', '........b......',
      '.........b.....', '..........b....', '...........b...', '...........b...', '............b..',
      '..........yyyyy', '...........yyy.', '............y..', '...........yyy.', '...............'],
    [ // 15 恶魔
      '.k...........k.', '.kk.........kk.', '..kk.......kk..', '...krrrrrrrk...', '...rrrrrrrrr...',
      '..rrrrrrrrrrr..', '..rryyrrryyrr..', '..rrrrrrrrrrr..', '..rrrrrkrrrrr..', '...rkkkkkkkr...',
      '...rwrrrrrwr...', '....rrrrrrr....', '.....rrrrr.....', '......rrr......', '.......r.......'],
    [ // 16 高塔：闪电
      '.y.............', '..y.....o.o....', '...y...ooroo...', '....y..rrrrr...', '.....y.sssss...',
      '......ysksks...', '.......sssss...', '.......skkks...', '.......sssss...', '.......sskss...',
      '.......sssss...', '.......skkks...', '......sssssss..', '.....mmmmmmmmm.', 'mmmmmmmmmmmmmmm'],
    [ // 17 星星
      '.......y.......', '......yyy......', '......yyy......', '.....yyyyy.....', 'yyyyyyyyyyyyyyy',
      '.yyyyyywyyyyyy.', '..yyyyyyyyyyy..', '...yyyyyyyyy...', '....yyyyyyy....', '....yyyyyyy....',
      '...yyyy.yyyy...', '...yyy...yyy...', '..yyy.....yyy..', '..yy.......yy..', '.y...........y.'],
    [ // 18 月亮
      '.....yyyy......', '...yyyy......w.', '..yyy..........', '.yyy...........', '.yyy......w....',
      'yyy............', 'yyy...........w', 'yyy............', 'yyy.....w......', 'yyy............',
      '.yyy...........', '.yyy.......w...', '..yyy..........', '...yyyy........', '.....yyyy......'],
    [ // 19 太阳
      '.......y.......', '.y.....y.....y.', '..y....y....y..', '...y.yyyyy.y...', '....yoooooy....',
      '...yoooooooy...', 'yyyookoookooyyy', '...ooooooooo...', 'yyyooorrroooyyy', '...yoooooooy...',
      '....yoooooy....', '...y.yyyyy.y...', '..y....y....y..', '.y.....y.....y.', '.......y.......'],
    [ // 20 审判：号角与旗帜
      'yy.............', 'yyy............', 'yyyy...........', '.yyyy..........', '..yyyy.........',
      '....yy.........', '.....yy........', '......yy.......', '.wwwww.yy......', '.wwrww..yy.....',
      '.wrrrw...yy....', '.wwrww....yy...', '.wwwww.....yy..', '.w...w......yy.', '.............y.'],
    [ // 21 世界：花环
      '.....ddddd.....', '...dd.....dd...', '..d.........d..', '.d...........d.', '.d.....y.....d.',
      'd.....yyy.....d', 'd..yyyyyyyyy..d', 'd...yyyyyyy...d', 'd....yyyyy....d', 'd....yy.yy....d',
      'd...yy...yy...d', '.d...........d.', '..d....r....d..', '...dd.rrr.dd...', '.....ddddd.....'],
  ];

  // 修正月亮：让月牙居中
  MAJOR[18] = MAJOR[18].map((row) => ('...' + row).slice(0, 15));

  const PIPS = {
    wands: ['...g...', '..gog..', '...o...', '...o.g.', '...o...', '...o...', '...m...'],
    cups: ['y.....y', 'ybbbbby', '.yyyyy.', '..yyy..', '...y...', '...y...', '.yyyyy.'],
    swords: ['...w...', '...w...', '...w...', '...w...', '.yyyyy.', '...m...', '...y...'],
    pentacles: ['.yyyyy.', 'yyyoyyy', 'yoooooy', 'yyoooyy', 'yoyyyoy', 'yyyyyyy', '.yyyyy.'],
  };

  const COURT = {
    11: ['...rrrrr...', '..rrrrrrr..', '...ccccc...', '...ckckc...', '...ccccc...', '....ccc....',
      '...ggggg...', '..ggggggg..', '..ggggggg..', '...g...g...', '...m...m...'],
    12: ['...ww......', '..wwww.....', '.wwwkww....', 'wwwwwwww...', 'ww..wwwww..', '.....wwwww.',
      '.....wwwwww', '....wwwwwww', '....wwwwww.', '...wwwwwww.', '..wwwwwwwww'],
    13: ['..y..y..y..', '..yyyyyyy..', '...ccccc...', '...ckckc...', '...ccccc...', '....ccc....',
      '..ppppppp..', '.ppppppppp.', '.ppppppppp.', 'ppppppppppp', 'ppppppppppp'],
    14: ['.y...y...y.', '.yyyyyyyyy.', '..ccccccc..', '..ckccckc..', '..ccccccc..', '..mmmmmmm..',
      '...mmmmm...', '.hhhhhhhhh.', 'hhhhhyhhhhh', 'hhhhhyhhhhh', 'hhhhhhhhhhh'],
  };

  // 3×5 像素小字
  const GLYPH = {
    0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
    2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'],
    4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'],
    8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
    I: ['111', '010', '010', '010', '111'], V: ['101', '101', '101', '101', '010'],
    X: ['101', '101', '010', '101', '101'], A: ['010', '101', '111', '101', '101'],
    P: ['110', '101', '110', '100', '100'], N: ['101', '111', '111', '111', '101'],
    Q: ['010', '101', '101', '110', '011'], K: ['101', '101', '110', '101', '101'],
  };

  const BG = {
    major: ['#2a1846', '#3d2466', '#ffd34e'],
    wands: ['#3a1c14', '#5a2c1c', '#f08a24'],
    cups: ['#142a46', '#1e3d66', '#4aa3df'],
    swords: ['#1e2a30', '#2f4048', '#a7b3c2'],
    pentacles: ['#1c3020', '#2a4a30', '#5cc46a'],
  };

  const W = 48, H = 80;

  function px(ctx, x, y, color, s) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, s || 1, s || 1);
  }

  function bitmap(ctx, rows, x0, y0, scale) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = PAL[row[x]];
        if (c) px(ctx, x0 + x * scale, y0 + y * scale, c, scale);
      }
    });
  }

  function text(ctx, str, cx, y, color) {
    const w = str.length * 4 - 1;
    let x = Math.round(cx - w / 2);
    for (const ch of str) {
      const g = GLYPH[ch];
      if (g) g.forEach((row, gy) => {
        for (let gx = 0; gx < 3; gx++) if (row[gx] === '1') px(ctx, x + gx, y + gy, color);
      });
      x += 4;
    }
  }

  function frame(ctx, pal) {
    ctx.fillStyle = '#1a1030';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pal[2];
    ctx.fillRect(1, 1, W - 2, H - 2);
    ctx.fillStyle = pal[0];
    ctx.fillRect(2, 2, W - 4, H - 4);
    ctx.fillStyle = pal[1];
    ctx.fillRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = pal[0];
    ctx.fillRect(5, 5, W - 10, H - 10);
    // 四角装饰
    [[3, 3], [W - 4, 3], [3, H - 4], [W - 4, H - 4]].forEach(([x, y]) => px(ctx, x, y, pal[2]));
  }

  // 数字牌的点位布局（单位：格），在 36×52 的区域中
  const LAYOUT = {
    2: [[1, 0], [1, 4]],
    3: [[1, 0], [1, 2], [1, 4]],
    4: [[0, 0], [2, 0], [0, 4], [2, 4]],
    5: [[0, 0], [2, 0], [1, 2], [0, 4], [2, 4]],
    6: [[0, 0], [2, 0], [0, 2], [2, 2], [0, 4], [2, 4]],
    7: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [0, 4], [2, 4]],
    8: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [1, 3], [0, 4], [2, 4]],
    9: [[0, 0], [2, 0], [0, 4 / 3], [2, 4 / 3], [1, 2], [0, 8 / 3], [2, 8 / 3], [0, 4], [2, 4]],
    10: [[0, 0], [2, 0], [1, 2 / 3], [0, 4 / 3], [2, 4 / 3], [0, 8 / 3], [2, 8 / 3], [1, 10 / 3], [0, 4], [2, 4]],
  };

  function drawFace(canvas, card) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const key = card.arcana === 'major' ? 'major' : card.suit;
    const pal = BG[key];
    frame(ctx, pal);
    text(ctx, card.label, W / 2, 8, pal[2]);

    if (card.arcana === 'major') {
      // 星点背景
      [[9, 18], [38, 22], [12, 62], [36, 66], [24, 15], [8, 40], [40, 44]].forEach(([x, y]) => px(ctx, x, y, '#6a52a0'));
      bitmap(ctx, MAJOR[card.number], 9, 24, 2);
      px(ctx, 23, 68, pal[2]); px(ctx, 24, 68, pal[2]); px(ctx, 23, 69, pal[2]); px(ctx, 24, 69, pal[2]);
      px(ctx, 21, 68, pal[2]); px(ctx, 26, 69, pal[2]);
    } else if (card.number === 1) {
      bitmap(ctx, PIPS[card.suit], 10, 26, 4);
    } else if (card.number <= 10) {
      LAYOUT[card.number].forEach(([gx, gy]) => {
        bitmap(ctx, PIPS[card.suit], Math.round(11 + gx * 9), Math.round(18 + gy * 11), 1);
      });
    } else {
      bitmap(ctx, COURT[card.number], 13, 20, 2);
      bitmap(ctx, PIPS[card.suit], 20, 62, 1);
    }
    return canvas;
  }

  function drawBack(canvas) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    frame(ctx, ['#241640', '#3d2466', '#ffd34e']);
    // 菱格纹
    for (let y = 6; y < H - 6; y++) {
      for (let x = 6; x < W - 6; x++) {
        if ((x + y) % 6 === 0 || (x - y + 120) % 6 === 0) px(ctx, x, y, '#33205a');
      }
    }
    // 中央太阳月亮
    const sun = MAJOR[19];
    ctx.fillStyle = '#241640';
    ctx.fillRect(14, 30, 20, 20);
    bitmap(ctx, sun, 16, 32, 1);
    px(ctx, 24, 12, '#ffd34e'); px(ctx, 23, 13, '#ffd34e'); px(ctx, 25, 13, '#ffd34e'); px(ctx, 24, 14, '#ffd34e');
    px(ctx, 24, 66, '#ffd34e'); px(ctx, 23, 67, '#ffd34e'); px(ctx, 25, 67, '#ffd34e'); px(ctx, 24, 68, '#ffd34e');
    return canvas;
  }

  root.TarotSprites = { drawFace, drawBack, MAJOR, PIPS, COURT, W, H };
})(typeof window !== 'undefined' ? window : globalThis);
