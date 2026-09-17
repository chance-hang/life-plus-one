const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const paths = {
 home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
 place:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 first:'M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0',
 wish:'m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z',
 food:'M5 2v7m4-7v7M3 2v6a4 4 0 0 0 8 0V2M7 12v10M20 22V2c-5 2-5 12 0 12',
 movie:'M3 8h18v12H3ZM3 8V3h18v5M7 3l3 5m4-5 3 5m-7 4 5 3-5 3Z',
 numbers:'M4 21V12h3v9Zm7 0V4h3v17Zm7 0V8h3v13Z',
 // 时间轴用「竖轴 + 三个节点 + 刻度」，比原来的钟表更好认；页眉与底部导航共用
 timeline:'M6 3v18M4.4 7.5a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 1 1-3.2 0M4.4 12a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 1 1-3.2 0M4.4 16.5a1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 1 1-3.2 0M10.5 7.5H20M10.5 12h6.5M10.5 16.5H20',
 mine:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
 search:'M16 16l6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 plus:'M12 4v16M4 12h16', arrow:'M4 12h16m-6-6 6 6-6 6', back:'m15 4-8 8 8 8', close:'m6 6 12 12M6 18 18 6',
 // 双箭头（⇄）：首页卡片右上角用来切换卡片样式
 swap:'M3.5 8.5h14.5m-3.5-3.5 3.5 3.5-3.5 3.5M20.5 15.5H6m3.5-3.5-3.5 3.5 3.5 3.5',
 heart:'M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-6 5 2 12 8 17 6-5 14-12 8-17Z',
 check:'m4 12 5 5L20 6', lock:'M6 10V7a6 6 0 0 1 12 0v3M4 10h16v12H4Zm8 5v3',
 moment:'M4 7h4l2-3h4l2 3h4v14H4ZM16 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 export:'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5', bell:'M6 17h12l-1.5-2.2V10a4.5 4.5 0 0 0-9 0v4.8ZM10 20h4', sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.moment}"/></svg>`;
const kinds = {place:['一个地方','去看更大的世界'],food:['一种美食','吃出更多风景'],movie:['一部电影','让灵魂多一种视角'],first:['一个第一次','勇敢试试新鲜事'],wish:['一个心愿','把想做的事变成故事'],moment:['其他','更多可能…']};
const labels = {first:'第一次',place:'去过的地方',food:'美食',movie:'电影',moment:'生活瞬间',wish:'愿望完成'};
const demoRecords = [
 {id:'sunset',type:'place',title:'在西湖边看了一次日落',date:'2026-09-12',city:'杭州',country:'中国',place:'西湖',note:'风把湖面吹皱了，也把今天的烦恼吹走了。',mood:'平静',scene:0,first:false,companion:'朋友',favorite:true},
 {id:'hotpot',type:'food',title:'吃到了超好吃的重庆火锅',date:'2026-09-08',city:'重庆',country:'中国',place:'街角老火锅',note:'聊到店快打烊，下次还要一起吃。',mood:'开心',scene:1,rating:5,companion:'老朋友'},
 {id:'snow',type:'place',title:'第一次独自去北海道旅行',date:'2026-01-25',city:'札幌',country:'日本',place:'北海道',note:'雪落下的时候，世界好像按下了静音键。',mood:'惊艳',scene:2,first:true,companion:'自己'},
 {id:'camp',type:'first',title:'第一次在湖边醒来',date:'2025-05-01',city:'杭州',country:'中国',place:'千岛湖',note:'清晨六点，帐篷外是一整片蓝色。',mood:'难忘',scene:3,first:true,companion:'朋友'}
];
/* 示例数据的人物生日：让首页卡片直接落在「你已经生活了 N 天」上。
 * 只属于示例数据；用户自己填的生日永远不会被它覆盖（见下面的迁移判断）。 */
const DEMO_BIRTHDAY = '1996-03-19';
let storageIssue = false;
const STORAGE_KEY = 'life-plus-one-review-experience-v1';
function read(key, fallback) { try { const raw=localStorage.getItem(key); if(raw===null)return fallback; const data=JSON.parse(raw); if(!data || !Array.isArray(data.records) || !Array.isArray(data.wishes))throw Error('Invalid data'); return data; } catch { storageIssue=true; return fallback; } }
const oldRecords = null;
const oldWishes = null;
const stored = read(STORAGE_KEY, null);
let state = stored || {records:oldRecords || demoRecords,wishes:oldWishes || [{id:'wish-snow',title:'去北海道看雪',category:'想去',state:'想做',scene:2},{id:'wish-camp',title:'在湖边露营，看一场日出',category:'想体验',state:'进行中',scene:3},{id:'wish-film',title:'看一场露天电影',category:'想看',state:'想做',scene:0}], birthday:DEMO_BIRTHDAY,demo:!oldRecords};
state.records = (state.records || []).filter(r=>r && typeof r==='object').map(r => ({...r,id:r.id || uid(),date:typeof r.date==='string'?r.date:'',first:!!r.first || r.type==='first'}));
state.wishes = (state.wishes || []).filter(w=>w && typeof w==='object').map(w => ({...w,id:w.id || uid()}));
/* 老版本存在浏览器里的示例数据生日是空的，会把首页卡片退回「收藏了多少个瞬间」。
 * 只在「记录里全是示例那几条、自己没加过内容」时补上生日；一旦有自己的记录或生日，一律不动。 */
if(state.demo===true && !state.birthday && state.records.length>0 && state.records.every(r=>demoRecords.some(d=>d.id===r.id))){
 state = {...state,birthday:DEMO_BIRTHDAY};
 if(!storageIssue){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch {} }
}
let photoLoading=false, photoRequest=0;
let page=new URLSearchParams(location.search).get('view')==='home'?'home':'cover', filter='all', query='', wishFilter='全部', detailId='', modalReturn=null, pendingScene=null, pendingPhoto=null;
const app = $('#app');
function persist(next) { if(storageIssue){toast('存储数据无法读取，已停止保存以保护原数据。请先备份原数据。');return false;} try { localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); state=next; return true; } catch { toast('本机存储空间不足或不可用，请减少照片后重试'); return false; } }
const sorted = () => [...state.records].sort((a,b)=>String(b.date || '').localeCompare(String(a.date || '')) || (b.createdAt || '').localeCompare(a.createdAt || ''));
const distinct = field => new Set(state.records.map(r=>r[field]).filter(Boolean)).size;
const countFirst = () => state.records.filter(r=>r.first || r.type==='first').length;
const shortDate = date => String(date || '日期未填写').replaceAll('-','.');
const brand = () => `<button class="brand" data-go="cover" aria-label="返回进入封面"><b>+1</b><span>Life Plus One<small>给人生，加点新东西。</small></span></button>`;
function picture(r,cls='') { if(Media.valid(r.photo)) return `<div class="photo ${cls}"><img src="${r.photo}" alt="${esc(r.title)}"/></div>`; return Number.isInteger(r.scene) ? `<div class="photo scene scene-${r.scene} ${cls}" role="img" aria-label="${esc(r.title)}的示例配图"></div>` : `<div class="photo photo-empty ${cls}">${icon(r.type || 'wish')}</div>`; }
function cover() { return `<section class="entrance"><div class="landscape" aria-hidden="true"></div><div class="cover-wash"></div><header class="cover-header">${brand()}<span class="cover-edition">YOUR LIFE, YOUR LITTLE WONDERS.</span></header><div class="cover-main"><div class="hello-chip">${icon('sun')} 世界很大，今天也很值得</div><h1>给人生，<br/>加点<span>新东西<span class="title-spark">✧</span></span>。</h1><p>一个第一次，一段新风景，一件小小的心愿。<br/>把生活里的「+1」，慢慢收藏成自己。</p><button class="enter-button" data-go="home">开启我的人生 +1 ${icon('arrow')}</button><span class="cover-caption">A LITTLE MORE LIFE. A LITTLE MORE YOU.</span></div><div class="floating-memories" aria-hidden="true"><div class="memory-note note-a">${picture({scene:0,title:'日落'})}<span>把日落，也装进口袋。</span><i>HANGZHOU · A GOOD DAY</i></div><div class="memory-note note-b">${picture({scene:2,title:'第一次旅行'})}<span>第一次，一个人出发。</span><i>HOKKAIDO · MY FIRST TIME</i></div><span class="float-sticker sticker-one">${icon('first')} 人生 +1</span><span class="float-sticker sticker-two">${icon('heart')} 收藏此刻</span></div><div class="light-motes" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><footer class="cover-footer"><span>不必很精彩，也值得被记住。</span><span>${icon('lock')} 只属于你的人生收藏夹</span></footer><div class="cover-loading" aria-live="polite" aria-label="正在打开我的人生"><span class="loading-clock" aria-hidden="true"><svg viewBox="0 0 160 160"><g class="loading-ticks"><line x1="80" y1="13" x2="80" y2="19"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(30 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(60 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(90 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(120 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(150 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(180 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(210 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(240 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(270 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(300 80 80)"/><line x1="80" y1="13" x2="80" y2="19" transform="rotate(330 80 80)"/></g><circle class="loading-clock-track" cx="80" cy="80" r="56" pathLength="100"/><circle class="loading-clock-progress" cx="80" cy="80" r="56" pathLength="100"/><line class="loading-hand" x1="80" y1="80" x2="80" y2="31"/><circle class="loading-pin" cx="80" cy="80" r="2.2"/></svg><strong>+1</strong></span><strong>正在打开我的人生</strong><small>把生活里的 +1 收好</small></div></section>`; }
const nav = () => `<nav class="bottom-nav" aria-label="主导航">${[['home','首页'],['places','足迹'],['add','记录'],['timeline','时间轴'],['mine','我的']].map(([p,l])=>`<button class="nav-item ${page===p?'active':''} ${p==='add'?'nav-add':''}" ${p==='add'?'data-action="types"':`data-go="${p}"`} ${page===p?'aria-current="page"':''}>${icon(p==='add'?'plus':p==='places'?'place':p)}<span>${l}</span></button>`).join('')}</nav>`;
const heading = (title,subtitle) => `<header class="page-heading"><button class="icon-button" data-go="home" aria-label="返回首页">${icon('back')}</button><div class="heading-tools"><button class="icon-button" data-go="search" aria-label="搜索记录">${icon('search')}</button><button class="icon-button" data-action="types" aria-label="新增记录">${icon('plus')}</button></div><h1 class="page-title">${title}</h1></header>${subtitle?`<p class="page-subtitle">${subtitle}</p>`:''}`;
const sectionHead = (title,target,label='查看全部') => `<div class="section-head"><h2>${title}</h2>${target?`<button class="text-button" data-go="${target}">${label} ${icon('arrow')}</button>`:''}</div>`;
var recordList; // Registered by experience.js
const HOME_STYLE_KEY = 'life-plus-one-review-home-style';
const readHomeStyle = () => { try { return localStorage.getItem(HOME_STYLE_KEY)==='classic'?'classic':'photo'; } catch { return 'photo'; } };
let homeStyle = readHomeStyle();
const swapLabel = style => style==='classic' ? '切换为照片版卡片' : '切换为简洁版卡片';
/* 卡片文案：两版各说一件事，故意不同 ——
 * 照片版讲「收藏了多少个瞬间」，简洁版讲「你已经生活了 N 天」（codex 原版口径）。
 * 只有文案不同，字体格式两版完全一致（见 prototype.css 的 .banner-copy 一组规则）。 */
function bannerCopy(style) {
 if (style === 'classic' && state.birthday) {
  const days = Math.floor((Date.parse(today())-Date.parse(state.birthday))/86400000)+1;
  return { label:'你已经生活了', count:days.toLocaleString(), unit:'天', note:'仍有很多值得 +1 的瞬间，在路上。', badge:true, caption:true };
 }
 // 照片版固定讲收藏数量；简洁版在没填生日时也退回这套，避免出现一片空白
 return { label:'你已经收藏了', count:state.records.length.toLocaleString(), unit:'个瞬间', note:'继续出发，去体验更多可能。', badge:false, caption:false };
}
/* 一张卡（两种版本共用一个渲染函数，切换时只换这张卡，不动整页） */
function bannerCard(style) {
 const t = bannerCopy(style);
 const body = `<div class="banner-copy"><span>${t.label}</span><div><strong>${t.count}</strong><span class="banner-unit">${t.unit}</span>${t.badge?'<em>+1</em>':''}</div><p>${t.note}</p></div>${t.caption?'<span class="banner-caption">A More Colorful Life</span>':''}`;
 return `<button class="life-banner${style==='classic'?' style-classic':''}" data-go="numbers">${body}</button>`;
}
const bannerSlide = style => `<div class="banner-slide">${bannerCard(style)}</div>`;
/* 卡片外层：右上角一个双箭头按钮负责切换 */
// 图标外面那层 <span> 是视觉小圆底（按钮盒保持 44px 触控区，验收脚本会查）
const homeHero = () => `<div class="banner-wrap" data-style="${homeStyle}"><div class="banner-track">${bannerSlide(homeStyle)}</div><button class="banner-swap" data-action="home-swap" aria-label="${swapLabel(homeStyle)}"><span>${icon('swap')}</span></button></div>`;
function setHomeStyle(style) {
 const next = style==='classic'?'classic':'photo';
 if (next === homeStyle) return;
 homeStyle = next;
 try { localStorage.setItem(HOME_STYLE_KEY,homeStyle); } catch {}
 const wrap = $('.banner-wrap');
 if (!wrap) { render(); return; }          // 不在首页时退回整页渲染
 const track = wrap.querySelector('.banner-track');
 wrap.dataset.style = homeStyle;
 track.style.transition = 'none';
 track.style.transform = 'translateX(0)';
 track.innerHTML = bannerSlide(homeStyle);
 wrap.querySelector('.banner-swap')?.setAttribute('aria-label', swapLabel(homeStyle));
 requestAnimationFrame(()=>{ track.style.transition = ''; });
}
/* 右上角按钮：两张卡在轨道里横向滑动切换，不做整页刷新 */
function swapHomeStyle() {
 const next = homeStyle==='classic' ? 'photo' : 'classic';
 const wrap = $('.banner-wrap');
 const track = wrap && wrap.querySelector('.banner-track');
 const current = track && track.querySelector('.banner-slide');
 if (!track || !current) { setHomeStyle(next); return; }
 homeStyle = next;
 try { localStorage.setItem(HOME_STYLE_KEY,homeStyle); } catch {}
 wrap.dataset.style = homeStyle;
 wrap.querySelector('.banner-swap')?.setAttribute('aria-label', swapLabel(homeStyle));
 const incoming = document.createElement('div');
 incoming.className = 'banner-slide';
 incoming.innerHTML = bannerCard(homeStyle);
 const forward = homeStyle==='classic';   // 照片版 → 简洁版：新卡从右侧滑入，反之从左侧
 current.setAttribute('inert','');
 track.dataset.swapping = '1';
 if (forward) track.append(incoming);
 else { track.prepend(incoming); track.style.transition='none'; track.style.transform='translateX(-100%)'; void track.offsetWidth; }
 const settle = () => {
  if (track.dataset.swapping !== '1') return;
  delete track.dataset.swapping;
  track.style.transition = 'none';
  track.style.transform = 'translateX(0)';   // 旧卡移除后，新卡就停在原位
  current.remove();
  requestAnimationFrame(()=>{ track.style.transition = ''; });
 };
 if (matchMedia('(prefers-reduced-motion: reduce)').matches) { settle(); return; }
 requestAnimationFrame(()=>{
  track.style.transition = 'transform .42s cubic-bezier(.22, 1, .36, 1)';
  track.style.transform = forward ? 'translateX(-100%)' : 'translateX(0)';
 });
 setTimeout(settle, 520);
}
function home() {
 const countType=t=>state.records.filter(r=>r.type===t).length;
 const modules=[['wishes','wish','人生清单',state.wishes.length,'件小小心愿'],['places','place','去过的地方',distinct('city'),'座城市的故事'],['first','first','第一次',countFirst(),'次勇敢尝试'],['food','food','美食',countType('food'),'份味觉记忆'],['movie','movie','电影',countType('movie'),'场光影之旅'],['numbers','numbers','人生数字',null,'关于我的小小宇宙']];
 // 问候行常驻，不随卡片样式切换（卡片右上角的双箭头才是切换入口）
 const toolbar=`<div class="home-toolbar"><span class="hello-line">嗨，今天也很高兴见到你 ${icon('sun')}</span></div>`;
 return `<header class="app-header">${brand()}<div class="header-tools"><button class="icon-button" data-go="search" aria-label="搜索记录">${icon('search')}</button><button class="icon-button" data-go="timeline" aria-label="查看时间轴">${icon('timeline')}</button></div></header>${toolbar}${homeHero()}<section class="modules" aria-label="人生入口">${modules.map(([p,i,t,n,u])=>`<button class="module ${i}" data-go="${p}"><span class="module-icon">${icon(i)}</span><strong>${t}</strong><small>${n===null?'':`<b>${n}</b> `}${u}</small></button>`).join('')}</section>${sectionHead('最近的人生','timeline')}${recordList(sorted().slice(0,3))}<p class="tiny-note">${state.demo?'正在体验示例人生 · 你添加的记录保存在本机':'记录保存在当前浏览器'} · 默认私密</p>`;
}
let collectionFilter='all', collectionKind='';
function collection(kind) {
 if(collectionKind!==kind){collectionFilter='all';collectionKind=kind;}
 const first=kind==='first';
 const title=first?'1000 个第一次':kind==='food'?'私人美食档案':'私人电影记忆库';
 let data=sorted().filter(r=>first?r.first:r.type===kind);
 const tags=[...new Set(data.flatMap(r=>Array.isArray(r.tags)?r.tags:[]).filter(Boolean))].slice(0,4);
 if(!first){
  if(collectionFilter.startsWith('tag:')){const tag=collectionFilter.slice(4);data=data.filter(r=>(Array.isArray(r.tags)?r.tags:[]).includes(tag));}
  else if(collectionFilter==='high')data=data.filter(r=>Number(r.rating)>=4);
  else if(collectionFilter==='photo')data=data.filter(r=>Media.of(r).length>0);
 }
 const options=[['all','全部'],...tags.map(t=>['tag:'+t,t]),['high','高分'],['photo','有照片']];
 return `${heading(title)}${first?'':`<div class="chips">${options.map(([v,l])=>`<button class="chip ${collectionFilter===v?'selected':''}" data-collection-filter="${v}">${l}</button>`).join('')}</div>`}${first?groupedRecords(data):recordList(data)}`;
}
var wishesPage; // Registered by experience.js
function timelinePage(search=false) { return `${heading(search?'找回一个瞬间':'人生时间轴',search?'输入地点、标题或当时的感受。':'那些平凡日子里，闪闪发光的片刻。')}<label class="search-box">${icon('search')}<input id="search" type="search" placeholder="搜索我的人生记录" value="${esc(query)}" aria-label="搜索我的人生记录"/></label><div class="chips">${[['all','全部'],['first','第一次'],['place','地方'],['food','美食'],['movie','电影'],['moment','瞬间']].map(([v,l])=>`<button class="chip ${filter===v?'selected':''}" data-filter="${v}">${l}</button>`).join('')}</div><div id="results">${results()}</div>`; }
function groupedRecords(data) {
 if(!data.length)return recordList([]);
 const years=[...new Set(data.map(r=>r.date.slice(0,4)))];
 return years.map(year=>{
  const entries=data.filter(r=>r.date.startsWith(year));
  const months=[...new Set(entries.map(r=>r.date.slice(5,7)))];
  return '<section class="timeline-year"><h2><i></i>'+esc(year)+'<small>'+entries.length+' 个瞬间</small></h2>'+months.map(month=>'<section class="timeline-month"><h3>'+Number(month)+' 月</h3>'+recordList(entries.filter(r=>r.date.slice(5,7)===month))+'</section>').join('')+'</section>';
 }).join('');
}
function results() {
 const data=sorted().filter(r=>(filter==='all' || (filter==='first'?r.first:r.type===filter)) && [r.title,r.note,r.city,r.place,r.companion].join(' ').toLowerCase().includes(query.toLowerCase()));
 return groupedRecords(data);
}
let placeScope='world';
function placesPage() {
 const cities=[...new Set(state.records.map(r=>r.city).filter(Boolean))];
 const scopes=[['world','世界'],['china','中国'],['city','城市'],['list','列表']];
 const withPlace=sorted().filter(r=>r.city||r.place);
 const stats=[[distinct('country'),'国家'],[cities.length,'城市'],[distinct('place'),'地点']];
 const body=placeScope==='city'
  ? `<div class="city-list">${cities.map(c=>`<button data-city="${esc(c)}">${icon('place')}<strong>${esc(c)}</strong><span>${state.records.filter(r=>r.city===c).length} 段回忆</span>${icon('arrow')}</button>`).join('') || '<p class="empty">记录时补充城市，就能在这里点亮足迹。</p>'}</div>`
  : placeScope==='list'
   ? recordList(withPlace)
   : `<div class="places-landscape"><span>${icon('place')} 风景会记得，你来过。</span></div><div class="stats three">${stats.map(([n,t])=>`<div><b>${n}</b><span>${t}</span></div>`).join('')}</div>${sectionHead('最近去过','timeline')}${recordList(withPlace.slice(0,5))}`;
 return `${heading('去过的地方','去过的地方，会慢慢变成自己的一部分。')}<div class="chips">${scopes.map(([v,l])=>`<button class="chip ${placeScope===v?'selected':''}" data-place-scope="${v}">${l}</button>`).join('')}</div>${body}`;
}
var numbersPage; // Registered by experience.js
function minePage() {
 const since=(sorted().at(-1)?.date || today()).slice(0,4);
 const stats=[[state.records.length,'记录'],[distinct('city'),'城市'],[state.wishes.length,'清单'],[countFirst(),'第一次']];
 return `${heading('我的人生收藏夹')}<div class="profile-card"><span class="profile-avatar" role="img" aria-label="我的头像"></span><h2>生活的收藏家</h2><p>Life Plus One · Since ${since}</p><p class="profile-motto">去看更大的世界，也看见更大的自己。</p></div><div class="stats four">${stats.map(([n,t])=>`<div><b>${n}</b><span>${t}</span></div>`).join('')}</div><div class="menu-list">${[['wishes','wish','我的清单'],['favorites','heart','我的收藏'],['places','place','我的足迹'],['numbers','numbers','数据统计'],['timeline','timeline','所有人生记录']].map(([p,i,t])=>`<button data-go="${p}">${icon(i)}<span>${t}</span>${icon('arrow')}</button>`).join('')}<button data-action="export">${icon('export')}<span>导出我的记录</span>${icon('arrow')}</button><button data-go="cover">${icon('home')}<span>回到进入封面</span>${icon('arrow')}</button></div><p class="privacy-copy">${icon('lock')} 这本人生收藏夹，只属于你。<small>体验版数据保存在当前浏览器，无账号与云同步。示例配图由 AI 生成。</small></p>`;
}
var details; // Registered by experience.js
function render() { closeModal(); document.body.classList.toggle('on-cover',page==='cover'); const views={home,first:()=>collection('first'),food:()=>collection('food'),movie:()=>collection('movie'),wishes:wishesPage,timeline:()=>timelinePage(),search:()=>timelinePage(true),places:placesPage,numbers:numbersPage,mine:minePage,detail:details,favorites:()=>heading('我的收藏','那些想要一看再看的片刻。')+recordList(sorted().filter(r=>r.favorite))}; app.innerHTML=page==='cover'?cover():`<div class="app-backdrop"></div><aside class="desktop-aside">${brand()}<h2>生活有很多种，<br/>喜欢的都算数。</h2><p>记下此刻，也收藏未来的自己。</p><span class="aside-script">A More Colorful Life</span></aside><div class="phone"><div class="page-content${page==='home'?' page-home':''}">${(views[page] || home)()}</div>${nav()}</div>`; requestAnimationFrame(syncAppHeader); }
function go(p) { page=p; render(); window.scrollTo(0,0); }
// 首页页眉滚动收拢：桌面端滚动发生在 .page-content 内，手机端滚动发生在窗口上，两种都要认。
function headerScrollTop(){
 const host=document.querySelector('.phone > .page-content');
 if(host && host.scrollHeight>host.clientHeight+1)return host.scrollTop;
 return window.scrollY || document.documentElement.scrollTop || 0;
}
// 页面顶部可能压着一条固定的验收横幅（.review-banner），页眉贴顶时要避开它：
// 窗口滚动时按横幅实际高度下移；桌面面板内滚动时横幅不在面板上方，保持 0。
function headerStickyTop(){
 const host=document.querySelector('.phone > .page-content');
 if(host && host.scrollHeight>host.clientHeight+1)return 0;
 const banner=document.querySelector('.review-banner');
 return banner?Math.round(banner.getBoundingClientRect().height):0;
}
function syncAppHeader(){
 const header=document.querySelector('.phone .app-header');
 if(!header)return;
 document.documentElement.style.setProperty('--header-sticky-top',headerStickyTop()+'px');
 const y=headerScrollTop();
 // 两个阈值分开，避免页眉自身高度变化造成来回抖动。
 if(y>56)header.classList.add('is-compact');
 else if(y<12)header.classList.remove('is-compact');
}
syncAppHeader();
document.addEventListener('scroll',syncAppHeader,{capture:true,passive:true});
window.addEventListener('resize',syncAppHeader,{passive:true});
function openModal(content, title='记录一个瞬间') { closeModal(); modalReturn=document.activeElement; app.inert=true; document.body.classList.add('modal-open'); const overlay=document.createElement('div'); overlay.id='overlay'; overlay.className='overlay'; overlay.innerHTML=`<section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-handle"></div><button class="icon-button sheet-close" data-action="close" aria-label="关闭">${icon('close')}</button>${content}</section>`; document.body.append(overlay); requestAnimationFrame(()=>overlay.querySelector('input,button')?.focus()); }
function closeModal() { photoRequest++; photoLoading=false; $('#overlay')?.remove(); app.inert=false; document.body.classList.remove('modal-open'); modalReturn?.isConnected && modalReturn.focus(); }
function openTypes() { const shot=['place','food','movie','first']; openModal(`<div class="sheet-title"><span class="handwritten">今天，</span><h2>想给人生加点什么？</h2><p>每一个小小的体验，都是更丰富的你。</p></div><div class="type-grid">${Object.entries(kinds).map(([k,[t,s]])=>`<button class="type-card type-${k}" data-type="${k}"><span class="type-shot${shot.includes(k)?'':' shot-plain'}" aria-hidden="true">${shot.includes(k)?'':icon(k)}</span><span class="type-copy"><strong>${t}</strong><small>${s}</small></span></button>`).join('')}</div><p class="sheet-foot">记录当下，也收藏未来的自己。</p>`,'选择记录类型'); }
var openForm; // Registered by experience.js
var wishForm; // Registered by experience.js
function toast(text) { $('.toast')?.remove(); const el=document.createElement('div'); el.className='toast';el.role='status';el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),3200); }
document.addEventListener('click',event=>{ const b=event.target.closest('button,[data-city]'); if(!b){if(event.target.id==='overlay')closeModal();return;} const d=b.dataset;
 if(d.go)go(d.go);
 if(d.detail){detailId=d.detail;go('detail');}
 if(d.type)openForm(d.type);
 if(d.complete)openForm('place',d.complete);
 if(d.wishFilter){wishFilter=d.wishFilter;render();}
 if(d.filter){filter=d.filter;render();}
 if(d.collectionFilter){collectionFilter=d.collectionFilter;render();}
 if(d.placeScope){placeScope=d.placeScope;render();}
 if(d.city){query=d.city;filter='all';go('search');}
 if(d.scene!==undefined){photoRequest++;photoLoading=false;$('#photo-preview').hidden=true;$('#photo-file').value='';pendingScene=Number(d.scene);pendingPhoto=null;document.querySelectorAll('[data-scene]').forEach(el=>{el.classList.toggle('picked',el===b);el.setAttribute('aria-pressed',String(el===b));});$('#photo-status').textContent='已选择示例配图';}
 if(d.favorite){const next={...state,records:state.records.map(r=>r.id===d.favorite?{...r,favorite:!r.favorite}:r)};if(persist(next))render();}
 if(d.delete){openModal(`<h2 class="form-title">删除这个人生瞬间？</h2><p class="form-subtitle">删除后，时间轴和统计会同步更新。关联愿望会恢复为想做。此操作无法撤销。</p><button class="primary full" data-confirm-delete="${esc(d.delete)}">确认删除</button><button class="text-button full" data-action="close">保留这个瞬间</button>`,'确认删除');}
 if(d.confirmDelete){const r=state.records.find(r=>r.id===d.confirmDelete);const next={...state,records:state.records.filter(item=>item.id!==d.confirmDelete),wishes:state.wishes.map(w=>w.id===r?.wishId?{...w,state:'想做'}:w)};if(persist(next)){go('timeline');toast('记录已删除');}}
 if(d.action==='remove-photo'){photoRequest++;photoLoading=false;pendingPhoto=null;pendingScene=null;$('#photo-file').value='';$('#photo-preview').hidden=true;$('#photo-status').textContent='照片已移除，可以重新选择。';}
 if(d.action==='types')openTypes(); if(d.action==='close')closeModal(); if(d.action==='wish')wishForm();
 if(d.action==='home-swap')swapHomeStyle();
 if(d.action==='birthday')openModal(`<h2 class="form-title">你好，来到世界的那一天。</h2><form id="birthday-form"><label class="field">我的出生日期<input type="date" name="birthday" value="${esc(state.birthday)}" required max="${today()}" min="1900-01-01"/></label><button class="primary full">保存生日</button></form>`,'填写生日');
 if(d.action==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`life-plus-one-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出你的记录和愿望');}
});
document.addEventListener('input',e=>{if(e.target.name==='note'&&$('#note-count'))$('#note-count').textContent=e.target.value.length+' / 200';if(e.target.hasAttribute('aria-invalid')){e.target.removeAttribute('aria-invalid');e.target.closest('.field')?.querySelector('.field-error')?.remove();}if(e.target.id==='search'){query=e.target.value;$('#results').innerHTML=results();}});
document.addEventListener('invalid',e=>{
 if(!e.target.closest('.sheet'))return;
 e.target.setAttribute('aria-invalid','true');
 const field=e.target.closest('.field');
 if(field&&!field.querySelector('.field-error')){
  const error=document.createElement('small');error.className='field-error';error.role='alert';
  error.textContent=e.target.validity.valueMissing?'请填写这一项。':'请检查填写内容。';field.append(error);
 }
},true);
document.addEventListener('submit',async e=>{
 if(e.target.id!=='birthday-form')return;
 e.preventDefault();
 const form=e.target,button=form.querySelector('button');
 if(button.disabled)return;
 const birthday=new FormData(form).get('birthday');
 if(!safeDate(birthday)||birthday>today()){toast('请选择有效的出生日期');return;}
 button.disabled=true;button.textContent='正在保存…';
 await new Promise(resolve=>requestAnimationFrame(resolve));
 if(persist({...state,birthday})){go('home');toast('已更新你的人生天数');}
 else {button.disabled=false;button.textContent='重试保存生日';}
});
document.addEventListener('keydown',e=>{const overlay=$('#overlay');if(!overlay)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const focus=[...overlay.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled);const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
// experience.js registers the shared editor and views, then renders once.
