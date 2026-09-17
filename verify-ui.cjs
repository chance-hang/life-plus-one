/* 响应式布局与触控目标自查
 *
 * 为什么动它：原脚本前半段（9 路由 × 6 视口，无横向溢出 + 触控目标不小于 43.5px）
 * 依然是全套里唯一系统检查触控目标的一环，而且一直是绿灯；后半段依赖的
 * #note-count / #record-form / #photo-file / #photo-preview / [data-scene] 已被
 * experience.js 的 #experience-count / #experience-record / #experience-photo /
 * #editor-gallery / .sample-photo 整体替换，且相同覆盖在 verify-experience.cjs
 * 的 77 组里已经有了。所以这里收敛成「布局 + 触控」专项，重复的旧表单流程不再复查。
 *
 * 跑法：node verify-ui.cjs     （REVIEW_URL 可覆盖端口）
 */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const TOUCH_MIN=43.5;   // 移动端可点区域的下限（px）
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 // 端口与其它自查脚本对齐：默认 4186，可用 REVIEW_URL 覆盖
 await p.goto(process.env.REVIEW_URL||'http://127.0.0.1:4186/?view=home');
 let checked=0;
 for(const width of [320,375,390,460,768,1440]){
  await p.setViewportSize({width,height:900});
  for(const route of ['home','places','first','food','movie','numbers','wishes','timeline','mine']){
   await p.evaluate(route=>go(route),route);
   await p.waitForTimeout(620);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route} 在 ${width}px 下横向溢出`);
   const small=await p.locator('button').evaluateAll(els=>els.filter(el=>{
    const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.5||r.height<43.5);
   }).map(el=>({text:el.textContent.trim().slice(0,18),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
   assert.deepEqual(small,[],`${route} 在 ${width}px 下有小于 ${TOUCH_MIN}px 的可点区域`);
   checked++;
  }
 }

 // 页面滚到底时，最后一行内容不能被底部导航压住
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>go('home'));await p.waitForTimeout(400);
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(650);
 assert.equal(await p.locator('.tiny-note').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.bottom-nav').getBoundingClientRect().top),true,'首页滚到底最后一行被底部导航遮住');

 // 降低动效偏好：浮层也不该有进场动画
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.locator('.nav-add').click();
 await p.locator('.sheet').waitFor();
 assert.equal(await p.locator('.sheet').evaluate(el=>getComputedStyle(el).animationName),'none','开启减少动效后浮层仍有进场动画');
 // Esc 关闭浮层
 await p.keyboard.press('Escape');await p.waitForTimeout(300);
 assert.equal(await p.locator('#overlay').count(),0,'按 Esc 后浮层应关闭');

 assert.deepEqual(errors,[],`不应有运行时报错，实际：${JSON.stringify(errors)}`);
 console.log(`PASS: ${checked} 组「路由 × 视口」无横向溢出且触控目标均 ≥ ${TOUCH_MIN}px；底部内容不被导航遮挡；减少动效下降级生效；Esc 可关闭浮层；零运行时报错。`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
