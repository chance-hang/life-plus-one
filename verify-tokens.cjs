/* 设计令牌守卫
 * ─────────────────────────────────────────────────────────────
 * 目的：让"其它页面各写一套"这件事不可能再悄悄发生。
 *
 * 查四件事：
 *   1. 令牌层加载了吗（样式表 404 是静默失败，页面照常渲染、只是值全空）
 *   2. 旧变量别名最终解析出了值吗（防止别名链写错名字导致空值）
 *   3. 各路由关键组件的取值，等于令牌吗（跨页面一致性的硬证据）
 *   4. 页面上还有没有"野颜色"（不在令牌色板里的）
 *
 * 用法：node serve.cjs 后运行 node verify-tokens.cjs
 */
const assert = require('node:assert');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const URL = process.env.REVIEW_URL || 'http://127.0.0.1:4186/';

const VIEWS = ['home', 'timeline', 'places', 'wishes', 'mine', 'numbers', 'first'];

/* 关键令牌：这些必须能解析出值，否则全站的引用都会静默失效 */
const REQUIRED = [
  '--color-brand', '--color-brand-bright', '--color-brand-deep',
  '--color-brand-wash', '--color-brand-wash-2',
  '--color-canvas', '--color-surface', '--color-line',
  '--color-ink-1', '--color-ink-2', '--color-ink-3', '--color-ink-4', '--color-ink-5',
  '--text-display', '--text-title', '--text-heading', '--text-stat', '--text-section',
  '--text-card', '--text-body', '--text-secondary', '--text-meta', '--text-micro',
  '--text-signature',
  '--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6',
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-pill',
  '--shadow-card', '--shadow-raised', '--shadow-brand',
  '--ease-out', '--tap-min', '--nav-height', '--nav-clear', '--layout-page-pad',
];

/* 旧名字必须解析到与首页一致的值（这几个历史上被重复定义过） */
const ALIAS_EXPECT = {
  '--pro-canvas': 'rgb(238, 244, 253)',   // #eef4fd
  '--pro-ink': 'rgb(34, 55, 79)',         // #22374f
  '--pro-sub': 'rgb(139, 155, 176)',      // #8b9bb0
  '--pro-blue': 'rgb(58, 140, 247)',      // #3a8cf7
  '--blue': 'rgb(50, 134, 238)',          // #3286ee
  '--ink': 'rgb(38, 62, 88)',             // #263e58
  '--muted': 'rgb(67, 93, 117)',          // #435d75 —— 曾被定义成两个值
  '--pro-title': null,                    // 只查非空
};

const readPaletteAndVars = () => {
  const cs = getComputedStyle(document.documentElement);
  const vars = {};
  for (const n of window.__REQUIRED__) vars[n] = cs.getPropertyValue(n).trim();
  const palette = new Set();
  for (const prop of cs) {
    if (!prop.startsWith('--')) continue;
    const v = cs.getPropertyValue(prop).trim();
    if (/^(rgb|rgba|#|hsl)/.test(v)) palette.add(v);
  }
  return { vars, palette: [...palette] };
};

const scanColors = () => {
  const out = [];
  for (const el of document.querySelectorAll('.page-content *, .bottom-nav *, .app-header *')) {
    if (el.closest('svg')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const cls = (el.className || '').toString().split(' ').filter(Boolean)[0] || el.tagName.toLowerCase();
    out.push({ cls, color: cs.color, bg: cs.backgroundColor });
  }
  return out;
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${URL}?view=home`, { waitUntil: 'networkidle' });

  // ── 1. 令牌层必须真的加载（404 的样式表会让 rules 数为 0） ──
  const sheets = await page.evaluate(() => [...document.styleSheets].map((s) => ({
    name: (s.href || 'inline').split('/').pop(),
    rules: (() => { try { return s.cssRules.length; } catch { return -1; } })(),
  })));
  const tok = sheets.find((s) => s.name === 'tokens.css');
  assert.ok(tok, 'tokens.css 没有加载 —— 检查 index.html 的 link 与 serve.cjs 的白名单');
  assert.ok(tok.rules > 0, `tokens.css 解析出 0 条规则（多半是 404，样式表 404 不报错、直接整份失效）`);
  const comp = sheets.find((s) => s.name === 'components.css');
  assert.ok(comp && comp.rules > 0, 'components.css 没有加载或解析为空');

  // ── 2. 关键令牌必须解析出值 ──
  await page.evaluate((r) => { window.__REQUIRED__ = r; }, REQUIRED);
  const { vars, palette } = await page.evaluate(readPaletteAndVars);
  for (const n of REQUIRED) {
    assert.ok(vars[n], `令牌 ${n} 解析为空 —— 检查 tokens.css 里有没有写，或别名链是不是写错了名字`);
  }
  for (const [n, want] of Object.entries(ALIAS_EXPECT)) {
    /* 不能直接读 getPropertyValue：别名的值形如 `var(--color-canvas)`，
     * 拿回来是替换后但未计算的 `#eef4fd`，比不出 rgb。
     * 把变量套到一个探针元素的 color 上，再读 computed，才是真正渲染用的值。 */
    const got = await page.evaluate((n) => {
      const d = document.createElement('div');
      d.style.color = `var(${n})`;
      document.body.append(d);
      const c = getComputedStyle(d).color;
      d.remove();
      return c;
    }, n);
    if (want) {
      assert.equal(got, want, `旧变量 ${n} 应解析为 ${want}（首页验收值），实际 ${got || '(空)'}`);
    } else {
      assert.ok(got, `旧变量 ${n} 解析为空`);
    }
  }

  // ── 3. 跨页面一致性：同一组件在不同路由取值必须相同 ──
  const key = async (sel, props) => {
    return page.evaluate(({ sel, props }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const o = {};
      for (const p of props) o[p] = cs[p];
      return o;
    }, { sel, props });
  };

  const statsByView = {};
  const stats4ByView = {};
  const chipsByView = {};
  const recordByView = {};
  for (const v of VIEWS) {
    await page.goto(`${URL}?view=home`, { waitUntil: 'networkidle' });
    await page.evaluate((v) => globalThis.go(v), v);
    await page.waitForTimeout(200);
    /* 3 列与 4 列是两个规格（4 列格子窄、数字退一档），分开比才有意义，
     * 混在一起比会永远失败，也会掩盖真正的不一致。 */
    statsByView[v] = await key('.stats:not(.four) b', ['fontSize', 'lineHeight', 'fontWeight', 'color']);
    stats4ByView[v] = await key('.stats.four b', ['fontSize', 'lineHeight', 'fontWeight', 'color']);
    chipsByView[v] = await key('.chip', ['fontSize', 'borderTopLeftRadius', 'color']);
    recordByView[v] = await key('.record, .wish-row', ['borderTopLeftRadius', 'paddingTop', 'backgroundColor']);
  }

  const uniq = (o) => [...new Set(Object.values(o).filter(Boolean).map((x) => JSON.stringify(x)))];
  for (const [name, map] of [['统计数字(3列)', statsByView], ['统计数字(4列)', stats4ByView],
    ['筛选 chip', chipsByView], ['卡片', recordByView]]) {
    const present = Object.entries(map).filter(([, v]) => v);
    if (present.length < 2) continue;
    const kinds = uniq(map);
    assert.equal(kinds.length, 1,
      `${name}在不同页面取值不一致：\n  ${present.map(([v, x]) => `${v}: ${JSON.stringify(x)}`).join('\n  ')}`);
  }

  // 统计数字必须落在 --text-stat / --text-stat-sm 这两档（不能是随手写的字号）
  const statSample = Object.values(statsByView).find(Boolean);
  if (statSample) {
    assert.equal(statSample.fontSize, '22px', `3 列统计数字字号应为 22px（--text-stat），实际 ${statSample.fontSize}`);
    assert.equal(statSample.fontWeight, '700', `统计数字字重应为 700，实际 ${statSample.fontWeight}`);
  }
  const stat4Sample = Object.values(stats4ByView).find(Boolean);
  if (stat4Sample) {
    assert.equal(stat4Sample.fontSize, '20px', `4 列统计数字字号应为 20px（--text-stat-sm），实际 ${stat4Sample.fontSize}`);
  }

  // ── 4. 野颜色扫描 ──
  /* 色板里是声明值（#rrggbb / rgba(…, .88)），页面上是计算值（rgb(…) / rgba(…, 0.88)）。
   * 两者只是写法不同，必须归一化后再比 —— 否则 .88 与 0.88 会被当成两种颜色。 */
  const norm = (s) => s.replace(/\s+/g, '').replace(/([(,])\./g, '$10.');
  const hexToRgb = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
  };
  const paletteSet = new Set();
  for (const p of palette) {
    paletteSet.add(norm(p));
    if (p.startsWith('#')) paletteSet.add(norm(hexToRgb(p)));
  }

  const wild = new Map();
  for (const v of VIEWS) {
    await page.goto(`${URL}?view=home`, { waitUntil: 'networkidle' });
    await page.evaluate((v) => globalThis.go(v), v);
    await page.waitForTimeout(200);
    const rows = await page.evaluate(scanColors);
    for (const r of rows) {
      for (const c of [r.color, r.bg]) {
        if (!c || c === 'rgba(0, 0, 0, 0)') continue;
        if (paletteSet.has(norm(c))) continue;
        if (!wild.has(c)) wild.set(c, new Set());
        wild.get(c).add(`${v}:${r.cls}`);
      }
    }
  }

  /* 白名单：装饰性渐变/玻璃底等"画出来"的颜色，逐个收进色板意义不大。
   * 现在是空的 —— 页面上出现的每一种颜色都已在 tokens.css 登记。
   * 真要再加，先问自己是不是真的需要一个新颜色，而不是顺手写个值。 */
  const LEGACY_ALLOW = new Set([]);
  const allow = new Set([...LEGACY_ALLOW].map(norm));
  const unexpected = [...wild.keys()].filter((c) => !allow.has(norm(c)));

  console.log('── 令牌层 ──');
  console.log(`  样式表：${sheets.map((s) => `${s.name}(${s.rules})`).join(' ')}`);
  console.log(`  色板：${palette.length} 个颜色令牌`);
  console.log('── 跨页面一致性 ──');
  console.log(`  统计数字 ${JSON.stringify(statSample)}`);
  console.log(`  chip     ${JSON.stringify(Object.values(chipsByView).find(Boolean))}`);
  console.log(`  卡片     ${JSON.stringify(Object.values(recordByView).find(Boolean))}`);
  console.log('── 野颜色 ──');
  if (unexpected.length === 0) {
    console.log('  无（已知遗留 ' + wild.size + ' 项在白名单内）');
  } else {
    for (const c of unexpected) console.log(`  ${c}  →  ${[...wild.get(c)].slice(0, 4).join(', ')}`);
  }

  assert.equal(errors.length, 0, `运行期报错：${errors.join(' | ')}`);
  assert.equal(unexpected.length, 0,
    `出现 ${unexpected.length} 个不在令牌色板里的颜色（上面已列出）。\n` +
    `要么把它们收进 tokens.css，要么确认是装饰性渐变并加入 LEGACY_ALLOW。`);

  await browser.close();
  console.log(`\nPASS 令牌守卫通过（${REQUIRED.length} 个关键令牌有效 · ${VIEWS.length} 个路由取值一致 · 无野颜色）`);
})().catch((e) => { console.error('\nFAIL ' + e.message); process.exit(1); });
