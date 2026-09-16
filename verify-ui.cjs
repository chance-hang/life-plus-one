const {chromium}=require('C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4173/?view=home');
 for(const width of [320,375,390,460,768,1440]){
  await p.setViewportSize({width,height:900});
  for(const route of ['home','places','first','food','movie','numbers','wishes','timeline','mine']){
   await p.evaluate(route=>go(route),route);
   await p.waitForTimeout(620);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${route} overflow ${width}`);
   const small=await p.locator('button').evaluateAll(els=>els.filter(el=>{
    const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.5||r.height<43.5);
   }).map(el=>({text:el.textContent,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
   assert.deepEqual(small,[],`${route} small controls at ${width}`);
  }
 }
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>go('home'));
 await p.locator('.nav-add').click();await p.locator('[data-type=moment]').click();
 await p.locator('[name=note]').fill('今天值得记住');assert.equal(await p.locator('#note-count').textContent(),'6 / 200');
 await p.locator('#record-form button[type=submit]').click();assert.equal(await p.locator('[name=title]').getAttribute('aria-invalid'),'true');
 await p.locator('[name=title]').fill('视觉规范验证');
 await p.locator('#photo-file').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=','base64')});
 await p.locator('#photo-preview:not([hidden])').waitFor();assert.equal(await p.locator('#photo-preview img').evaluate(el=>el.naturalWidth>0),true);
 await p.locator('[data-action=remove-photo]').click();assert.equal(await p.locator('#photo-preview').isVisible(),false);
 await p.locator('[data-scene="0"]').click();assert.equal(await p.locator('[data-scene="0"]').getAttribute('aria-pressed'),'true');
 await p.screenshot({path:'verification/v11-form.png',fullPage:true});
 await p.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await p.locator('#record-form button[type=submit]').click();await p.locator('.toast').waitFor();
 assert.equal(await p.locator('[name=title]').inputValue(),'视觉规范验证');
 assert.equal(await p.locator('#record-form button[type=submit]').isEnabled(),true);
 await p.evaluate(()=>{Storage.prototype.setItem=window.originalSet;});
 await p.locator('#record-form button[type=submit]').click();await p.locator('#overlay').waitFor({state:'detached'});
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('life-plus-one-v2')).records.filter(r=>r.title==='视觉规范验证').length),1);
 await p.locator('.modules [data-go=first]').click();assert.ok(await p.locator('.timeline-year').count()>0);
 await p.screenshot({path:'verification/v11-first.png'});
 await p.evaluate(()=>go('home'));await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(650);
 assert.equal(await p.locator('.tiny-note').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.bottom-nav').getBoundingClientRect().top),true,'last content obscured');
 await p.screenshot({path:'verification/v11-bottom.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('.nav-add').click();
 assert.equal(await p.locator('.sheet').evaluate(el=>getComputedStyle(el).animationName),'none');
 await p.keyboard.press('Escape');assert.equal(await p.locator('#overlay').count(),0);
 assert.deepEqual(errors,[]);
 console.log('PASS: 54 route/viewport checks; button touch targets; photo preview/removal; character count; field error; storage-failure preservation/retry; one saved record; first-time grouping; bottom safety; reduced motion; keyboard close; no script errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});


