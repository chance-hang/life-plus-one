/* 首页自查：无边框页眉品牌块 + 卡片两种格式
 * 照片版 = 收藏瞬间卡（你已经收藏了 N 个瞬间），简洁版 = 人生天数卡（你已经生活了 N 天 + 落款）
 * 两版内容刻意不同，但字体格式必须逐项一致
 * + 右上角双箭头切换（横向滑动、不整页刷新）+ 问候行常驻 + 六宫格文案
 * 用法：先启动 serve.cjs，再 node verify-home-cards.cjs
 * 输出：verification/home-photo.png、home-classic.png、home-swap-mid.png、home-375-{photo,classic}.png */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert');
const fs = require('node:fs');
const url = process.env.REVIEW_URL || 'http://127.0.0.1:4186/?view=home';

const read = () => {
  const q = s => document.querySelector(s);
  // 字体格式指纹：字号/行高/字重/字形/字体族，两版必须逐项一致
  const typeOf = el => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return `${cs.fontSize} | ${cs.lineHeight} | ${cs.fontWeight} | ${cs.fontStyle} | ${cs.fontFamily.split(',')[0]}`;
  };
  const panel = q('.phone').getBoundingClientRect();
  const mark = q('.phone .app-header .brand>b');
  const brandEl = q('.phone .app-header .brand');
  const brandCs = getComputedStyle(brandEl);
  const brandBox = brandEl.getBoundingClientRect();
  const markBox = mark.getBoundingClientRect();
  const hero = q('.life-banner');
  const strong = hero.querySelector('.banner-copy strong');
  const caption = hero.querySelector('.banner-caption');
  const badge = hero.querySelector('.banner-copy em');
  const wrap = q('.banner-wrap');
  const swap = q('.banner-swap');
  const heroBox = hero.getBoundingClientRect();
  // 「文字 → 卡片边缘」的距离。
  // 先临时去掉 rotate 再量：落款带 -7deg 旋转，直接量到的是旋转后的外接框，
  // 会比人眼看到的那一圈大，距离就失真了（transform 不参与布局，临时清掉是安全的）。
  const edgeOf = el => {
    if (!el) return null;
    const saved = el.style.transform;
    el.style.transform = 'none';
    const r = el.getBoundingClientRect();
    el.style.transform = saved;
    const n = v => Math.round(v * 10) / 10;
    return { left: n(r.left - heroBox.left), right: n(heroBox.right - r.right), top: n(r.top - heroBox.top), bottom: n(heroBox.bottom - r.bottom) };
  };
  const copyEl = hero.querySelector('.banner-copy');
  const metricsOf = el => { const cs = getComputedStyle(el); return `${cs.fontSize} | ${cs.lineHeight}`; };
  const swapBox = swap ? swap.getBoundingClientRect() : null;
  return {
    panel: [Math.round(panel.width), Math.round(panel.height)],
    brand: {
      markSize: getComputedStyle(mark).fontSize,
      markOffset: [Math.round(markBox.left - panel.left), Math.round(markBox.top - panel.top)],
      block: {
        size: [Math.round(brandBox.width), Math.round(brandBox.height)],
        offset: [Math.round(brandBox.left - panel.left), Math.round(brandBox.top - panel.top)],
        background: brandCs.backgroundColor,
        radius: brandCs.borderTopLeftRadius,
        shadow: brandCs.boxShadow,
        border: brandCs.borderTopWidth,
      },
    },
    hero: {
      classic: hero.classList.contains('style-classic'),
      height: Math.round(heroBox.height),
      strong: strong.textContent.trim(),
      strongColor: getComputedStyle(strong).color,
      label: hero.querySelector('.banner-copy > span').textContent.trim(),
      unit: hero.querySelector('.banner-unit')?.textContent.trim() || '',
      note: hero.querySelector('.banner-copy p').textContent.trim(),
      badgeText: badge ? badge.textContent.trim() : null,
      captionText: caption ? caption.textContent.trim() : null,
      captionShown: caption ? getComputedStyle(caption).display !== 'none' : false,
      badgeShown: badge ? getComputedStyle(badge).display !== 'none' : false,
      // 两版共有的四段文字，字体格式必须一模一样（落款只有天数卡有，单独看）
      type: {
        label: typeOf(hero.querySelector('.banner-copy > span')),
        strong: typeOf(strong),
        unit: typeOf(hero.querySelector('.banner-unit')),
        note: typeOf(hero.querySelector('.banner-copy p')),
      },
      captionType: typeOf(caption),
      // 落款允许斜体，但字号/行高/字体族必须和正文结语同一套（原来 Georgia serif 是差异来源）
      captionMetrics: caption ? `${metricsOf(caption)} | ${getComputedStyle(caption).fontFamily.split(',')[0]}` : null,
      // 文字到卡片四边的距离：两版、每个元素都要落在同一套内边距上
      geo: {
        copy: edgeOf(copyEl),
        label: edgeOf(hero.querySelector('.banner-copy > span')),
        numbers: edgeOf(hero.querySelector('.banner-copy > div')),
        note: edgeOf(hero.querySelector('.banner-copy p')),
        caption: edgeOf(caption),
      },
    },
    records: state.records.length,
    swap: {
      // 卡片右上角入口：位置贴右上角、双箭头图标、44px 触控区
      exists: Boolean(swap),
      insideCard: Boolean(wrap && swap && wrap.contains(swap)),
      inset: swapBox ? [Math.round(heroBox.right - swapBox.right), Math.round(swapBox.top - heroBox.top)] : null,
      size: swapBox ? [Math.round(swapBox.width), Math.round(swapBox.height)] : null,
      arrows: swap ? ((swap.querySelector('path')?.getAttribute('d') || '').match(/M/g) || []).length : 0,
      label: swap ? swap.getAttribute('aria-label') : null,
      // 图标外面那层视觉小圆底：少了它图标会直接压在照片上，容易看不清
      chip: (() => {
        const el = swap?.querySelector('span');
        if (!el) return null;
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return { size: [Math.round(r.width), Math.round(r.height)], background: cs.backgroundColor, radius: cs.borderTopLeftRadius };
      })(),
    },
    track: {
      exists: Boolean(q('.banner-track')),
      slides: q('.banner-track') ? q('.banner-track').querySelectorAll('.banner-slide').length : 0,
      style: wrap ? wrap.dataset.style : null,
      swapping: Boolean(q('.banner-track')?.dataset.swapping),
    },
    // 整页有没有被重绘：测试前打上的探针还在不在
    probe: {
      greeting: Boolean(q('.home-toolbar .hello-line[data-probe="1"]')),
      modules: Boolean(q('.modules[data-probe="1"]')),
      card: Boolean(q('.banner-slide[data-probe="1"]')),
    },
    toolbar: { greeting: Boolean(q('.home-toolbar .hello-line')) },
    modules: [...document.querySelectorAll('.module')].map(m => `${m.querySelector('strong').textContent}|${m.querySelector('small').textContent.trim()}`),
    style: homeStyle,
  };
};

const probe = () => {
  document.querySelector('.home-toolbar .hello-line')?.setAttribute('data-probe', '1');
  document.querySelector('.modules')?.setAttribute('data-probe', '1');
  document.querySelector('.banner-slide')?.setAttribute('data-probe', '1');
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [];
  try {
    fs.mkdirSync('verification', { recursive: true });
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1536, height: 703 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('.modules').waitFor();
    await page.evaluate(() => { try { localStorage.removeItem('life-plus-one-review-home-style'); } catch {} });
    await page.reload();
    await page.locator('.modules').waitFor();

    // —— 品牌：无边框，直接坐在页面底色上 ——
    const photo = await page.evaluate(read);
    await page.locator('.phone').screenshot({ path: 'verification/home-photo.png' });
    assert.equal(photo.brand.markSize, '28px', `品牌字号应为 28px，实际 ${photo.brand.markSize}`);
    assert.equal(photo.brand.block.background, 'rgba(0, 0, 0, 0)', `页眉不应再画框（背景透明），实际 ${photo.brand.block.background}`);
    assert.equal(photo.brand.block.radius, '0px', `页眉不应再有圆角框，实际 ${photo.brand.block.radius}`);
    assert.equal(photo.brand.block.shadow, 'none', `页眉不应再有投影，实际 ${photo.brand.block.shadow}`);
    assert.equal(photo.brand.block.border, '0px', `页眉不应再有描边，实际 ${photo.brand.block.border}`);
    assert(photo.brand.block.offset[0] <= 24, `品牌应贴齐页面左留白，实际 ${photo.brand.block.offset[0]}`);
    assert(photo.brand.markOffset[0] <= 30 && photo.brand.markOffset[1] <= 30, `品牌文字应贴近面板左上角，实际 ${photo.brand.markOffset}`);

    // —— 问候行常驻 + 卡片右上角双箭头切换入口 ——
    assert(photo.toolbar.greeting, '问候行应常驻显示（不随卡片样式切换）');
    assert(photo.swap.exists && photo.swap.insideCard, '卡片右上角应有切换按钮');
    assert.equal(photo.swap.arrows, 2, `切换按钮应为双箭头图标，实际 ${photo.swap.arrows} 个箭头`);
    assert(photo.swap.inset[0] <= 14 && photo.swap.inset[1] <= 14, `切换按钮应贴在卡片右上角，实际距右上角 ${photo.swap.inset}`);
    assert(photo.swap.size[0] >= 43.5 && photo.swap.size[1] >= 43.5, `切换按钮触控区应 ≥44px，实际 ${photo.swap.size}`);
    assert(photo.swap.chip && photo.swap.chip.size[0] >= 28, `切换按钮图标下应有一层小圆底，实际 ${JSON.stringify(photo.swap.chip)}`);
    assert(photo.swap.chip.background !== 'rgba(0, 0, 0, 0)', `切换按钮小圆底应有底色，否则图标压在照片上看不清，实际 ${photo.swap.chip.background}`);
    assert(parseFloat(photo.swap.chip.radius) >= 14, `切换按钮小圆底应为圆形，实际 ${photo.swap.chip.radius}`);
    assert(photo.track.exists && photo.track.slides === 1, `静止时轨道里应只有 1 张卡，实际 ${photo.track.slides}`);
    assert.equal(photo.track.style, 'photo');
    assert.equal(photo.style, 'photo');
    assert(!photo.hero.classic, '首次进入应为照片版卡片');
    // —— 照片版 = 收藏瞬间卡：讲「收藏了多少个瞬间」——
    assert.equal(photo.hero.label, '你已经收藏了', `照片版首行应为收藏口径，实际 ${photo.hero.label}`);
    assert.equal(photo.hero.unit, '个瞬间', `照片版单位应为「个瞬间」，实际 ${photo.hero.unit}`);
    assert.equal(photo.hero.note, '继续出发，去体验更多可能。', `照片版结语不符，实际 ${photo.hero.note}`);
    assert.equal(photo.hero.strong, photo.records.toLocaleString(), `照片版大数字应是收藏条数，实际 ${photo.hero.strong}`);
    assert(!photo.hero.badgeShown && !photo.hero.captionShown, '+1 徽标与落款属于人生天数卡，照片版不带');

    // 六宫格沿用 codex 的说明文案
    const expectModules = ['人生清单|3 件小小心愿', '去过的地方|3 座城市的故事', '第一次|2 次勇敢尝试', '美食|1 份味觉记忆', '电影|0 场光影之旅', '人生数字|关于我的小小宇宙'];
    assert.deepEqual(photo.modules, expectModules, `六宫格文案不符：${JSON.stringify(photo.modules)}`);

    // —— 切换：不整页刷新（探针存活）+ 结果正确（reduced motion 下即时切换） ——
    await page.evaluate(probe);
    await page.click('.banner-swap');
    await page.waitForTimeout(150);
    const classic = await page.evaluate(read);
    await page.locator('.phone').screenshot({ path: 'verification/home-classic.png' });
    assert(classic.hero.classic && classic.hero.captionShown && classic.hero.badgeShown, '简洁版应显示落款与 +1 徽标');
    assert.equal(classic.track.style, 'classic');
    assert.equal(classic.style, 'classic');
    assert.equal(classic.track.slides, 1, `切换结束后轨道里应只剩 1 张卡，实际 ${classic.track.slides}`);
    assert(classic.toolbar.greeting, '切换后问候行仍应常驻');
    assert(classic.probe.greeting && classic.probe.modules, '切换不应整页重绘：问候行/六宫格被替换了');
    assert.equal(classic.swap.label, '切换为照片版卡片', `切换后入口文案应更新，实际 ${classic.swap.label}`);
    assert.equal(classic.hero.strongColor, 'rgb(36, 108, 204)', `简洁版数字应为深蓝，实际 ${classic.hero.strongColor}`);
    assert.equal(classic.hero.height, photo.hero.height, `两种版本卡片高度应一致（滑轨统一高度）：${photo.hero.height} vs ${classic.hero.height}`);
    // —— 简洁版 = 人生天数卡：讲「你已经生活了 N 天」（codex 原版口径 + 落款 + +1 徽标）——
    assert.equal(classic.hero.label, '你已经生活了', `天数卡首行应为人生天数口径，实际 ${classic.hero.label}`);
    assert.equal(classic.hero.unit, '天', `天数卡单位应为「天」，实际 ${classic.hero.unit}`);
    assert.equal(classic.hero.note, '仍有很多值得 +1 的瞬间，在路上。', `天数卡结语不符，实际 ${classic.hero.note}`);
    assert(/^\d{1,3}(,\d{3})+$/.test(classic.hero.strong), `天数卡大数字应是带千分位的人生天数，实际 ${classic.hero.strong}`);
    assert(Number(classic.hero.strong.replace(/,/g, '')) > 10000, `示例数据应落在人生天数上，实际 ${classic.hero.strong}`);
    assert(classic.hero.badgeShown && classic.hero.badgeText === '+1', `天数卡应带 +1 徽标，实际 ${JSON.stringify([classic.hero.badgeShown, classic.hero.badgeText])}`);
    assert(classic.hero.captionShown && classic.hero.captionText === 'A More Colorful Life', `天数卡应带落款，实际 ${JSON.stringify([classic.hero.captionShown, classic.hero.captionText])}`);
    // 两版内容刻意不同：一张数瞬间、一张数天数
    assert.notEqual(classic.hero.unit, photo.hero.unit, `两版应是不同口径的内容，实际都是 ${classic.hero.unit}`);
    assert.notEqual(classic.hero.strong, photo.hero.strong, '两版的大数字不应相同（瞬间数 vs 人生天数）');
    // 但字体格式必须逐项一致：字号 / 行高 / 字重 / 字形 / 字体族
    assert.deepEqual(classic.hero.type, photo.hero.type,
      `两版字体格式必须完全一致：照片版 ${JSON.stringify(photo.hero.type)} vs 简洁版 ${JSON.stringify(classic.hero.type)}`);

    // —— 排版几何：文字到卡片四条边的距离，天数卡必须和瞬间卡一模一样 ——
    // 这段是「看着位置不对」的根因防线：任何一段文字自带了一套装边距，肉眼就会觉得歪。
    const inset = photo.hero.geo.copy.left; // 卡片统一内边距 --pro-inset
    assert.equal(inset, 20, `卡片内边距应为 20px（--pro-inset），实际 ${inset}`);
    // 每行要卡哪些边：copy / 数字行 / 结语是块级，会撑满内容宽度，左右都要贴住内边距；
    // 首行 label 是行内 <span>，盒子宽度跟着文字走，右边距是剩余空间，不能拿来比对。
    const geoEdges = { copy: 'left,top,right,bottom', label: 'left,top', numbers: 'left,top,right,bottom', note: 'left,top,right,bottom' };
    const geoKeys = Object.keys(geoEdges);
    const pick = (o, list) => Object.fromEntries(list.map(k => [k, o[k]]));
    for (const k of geoKeys) {
      const want = geoEdges[k].split(',');
      assert.deepEqual(pick(classic.hero.geo[k], want), pick(photo.hero.geo[k], want),
        `「${k}」到卡片边缘的距离两版必须一致：瞬间卡 ${JSON.stringify(pick(photo.hero.geo[k], want))} vs 天数卡 ${JSON.stringify(pick(classic.hero.geo[k], want))}`);
    }
    for (const [name, card] of [['瞬间卡', photo], ['天数卡', classic]]) {
      for (const k of geoKeys) {
        assert.equal(card.hero.geo[k].left, inset, `${name}「${k}」左边距应为 ${inset}px，实际 ${card.hero.geo[k].left}`);
        if (geoEdges[k].includes('right')) {
          assert.equal(card.hero.geo[k].right, inset, `${name}「${k}」右边距应为 ${inset}px，实际 ${card.hero.geo[k].right}`);
        }
      }
    }
    // 落款：只有天数卡有，所以它到边的距离必须等于内边距，而不是自己留的 16/14
    assert.equal(classic.hero.geo.caption.right, inset, `天数卡落款右边距应和正文一致（${inset}px），实际 ${classic.hero.geo.caption.right}`);
    assert.equal(classic.hero.geo.caption.bottom, inset, `天数卡落款下边距应和正文用同一套数值（${inset}px），实际 ${classic.hero.geo.caption.bottom}`);
    // 落款允许斜体，但字号/行高/字体族要和瞬间卡的结语同一套（原来 Georgia, serif 是差异来源）
    const noteParts = photo.hero.type.note.split(' | ');
    const expectCaptionMetrics = `${noteParts[0]} | ${noteParts[1]} | ${noteParts[4]}`;
    assert.equal(classic.hero.captionMetrics, expectCaptionMetrics,
      `落款的字号/行高/字体族应与结语一致：期望 ${expectCaptionMetrics}，实际 ${classic.hero.captionMetrics}`);

    // —— 横向滑动：动画中轨道里应同时存在两张卡，且轨道发生横向位移 ——
    const animated = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1536, height: 703 } });
    const page2 = await animated.newPage();
    page2.on('pageerror', e => errors.push(e.message));
    await page2.goto(url);
    await page2.locator('.modules').waitFor();
    await page2.click('.banner-swap');
    await page2.waitForTimeout(140);
    const mid = await page2.evaluate(() => {
      const track = document.querySelector('.banner-track');
      const slides = [...track.querySelectorAll('.banner-slide')];
      return {
        slides: slides.length,
        transform: getComputedStyle(track).transform,
        kinds: slides.map(s => s.querySelector('.life-banner').classList.contains('style-classic') ? 'classic' : 'photo'),
        heights: slides.map(s => Math.round(s.querySelector('.life-banner').getBoundingClientRect().height)),
        overflow: getComputedStyle(document.querySelector('.banner-wrap')).overflow,
      };
    });
    await page2.locator('.phone').screenshot({ path: 'verification/home-swap-mid.png' });
    await page2.waitForTimeout(600);
    const afterAnim = await page2.evaluate(read);
    await animated.close();
    assert.equal(mid.slides, 2, `滑动过程中轨道里应有两张卡，实际 ${mid.slides}`);
    assert(mid.kinds.includes('photo') && mid.kinds.includes('classic'), `滑动中应同时出现新旧两张卡，实际 ${mid.kinds}`);
    assert(mid.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(mid.transform), `轨道应产生横向位移，实际 ${mid.transform}`);
    assert.equal(mid.overflow, 'hidden', `卡片外层应裁切，否则滑动时会盖到别的模块，实际 ${mid.overflow}`);
    assert.equal(mid.heights[0], mid.heights[1], `两种版本身高应一致，否则收尾会跳一下：${mid.heights}`);
    assert.equal(afterAnim.track.slides, 1, `滑动结束后应清理掉旧卡，实际 ${afterAnim.track.slides}`);
    assert.equal(afterAnim.style, 'classic');
    assert.equal(afterAnim.hero.height, mid.heights[0], `滑动前后卡片高度应不变：${mid.heights[0]} → ${afterAnim.hero.height}`);

    // 刷新后保持选择
    await page.reload();
    await page.locator('.modules').waitFor();
    const after = await page.evaluate(read);
    assert.equal(after.style, 'classic', '刷新后应保持简洁版');
    assert(after.hero.classic, '刷新后卡片应为简洁版');

    // 375 手机视口两种格式
    await page.setViewportSize({ width: 375, height: 844 });
    for (const style of ['photo', 'classic']) {
      await page.evaluate(s => setHomeStyle(s), style);
      await page.locator('.modules').waitFor();
      await page.screenshot({ path: `verification/home-375-${style}.png`, fullPage: true });
    }
    const mobile = await page.evaluate(read);
    assert.equal(mobile.modules.length, 6);
    assert(mobile.swap.exists && mobile.swap.insideCard, '手机视口下切换按钮应仍在卡片右上角');

    // —— 回归：老示例数据（生日为空）要自动补上生日，卡片不能再退回「收藏了多少个瞬间」 ——
    const legacy = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1536, height: 703 } });
    const page3 = await legacy.newPage();
    page3.on('pageerror', e => errors.push(e.message));
    await page3.goto(url);
    await page3.locator('.modules').waitFor();
    await page3.evaluate(() => {
      // 模拟旧版本留在浏览器里的示例数据：有 4 条示例记录，但生日是空的
      localStorage.setItem('life-plus-one-review-experience-v1', JSON.stringify({ records: demoRecords, wishes: [], birthday: '', demo: true }));
    });
    await page3.reload();
    await page3.locator('.modules').waitFor();
    // 看人生天数卡（默认是照片版瞬间卡）
    await page3.evaluate(() => setHomeStyle('classic'));
    await page3.waitForTimeout(120);
    const migrated = await page3.evaluate(read);
    assert.equal(migrated.hero.label, '你已经生活了', `老示例数据应自动补上生日，实际 ${migrated.hero.label}`);
    assert.equal(migrated.hero.unit, '天', `迁移后单位应为「天」，实际 ${migrated.hero.unit}`);
    assert(/^\d{1,3}(,\d{3})+$/.test(migrated.hero.strong), `迁移后应显示人生天数，实际 ${migrated.hero.strong}`);
    await legacy.close();

    if (errors.length) throw new Error(`script errors: ${errors.join(' | ')}`);
    console.log('照片版  ', JSON.stringify(photo.hero), JSON.stringify(photo.brand.block), JSON.stringify(photo.swap));
    console.log('简洁版  ', JSON.stringify(classic.hero), JSON.stringify(classic.track));
    console.log('滑动中  ', JSON.stringify(mid));
    console.log('六宫格  ', photo.modules.join(' / '));
    console.log('PASS 首页卡片自查通过（无边框页眉 + 双箭头切换 + 横向滑动）');
  } finally { await browser.close(); }
})();
