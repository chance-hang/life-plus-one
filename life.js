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
 timeline:'M12 8v5l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 mine:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
 search:'M16 16l6 6M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 plus:'M12 4v16M4 12h16', arrow:'M4 12h16m-6-6 6 6-6 6', back:'m15 4-8 8 8 8', close:'m6 6 12 12M6 18 18 6',
 heart:'M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-6 5 2 12 8 17 6-5 14-12 8-17Z',
 check:'m4 12 5 5L20 6', lock:'M6 10V7a6 6 0 0 1 12 0v3M4 10h16v12H4Zm8 5v3',
 moment:'M4 7h4l2-3h4l2 3h4v14H4ZM16 14a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 export:'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5', sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.moment}"/></svg>`;
const kinds = {first:['一个第一次','珍贵的初体验'],place:['一个地方','走过的城市与风景'],food:['一顿好吃的','记得那一口满足'],movie:['一部电影','收藏银幕里的故事'],wish:['一个愿望','让梦想更近一点'],moment:['其他瞬间','平凡也值得被记住']};
const labels = {first:'第一次',place:'去过的地方',food:'美食',movie:'电影',moment:'生活瞬间',wish:'愿望完成'};
const demoRecords = [
 {id:'sunset',type:'place',title:'在西湖边看了一次日落',date:'2026-09-12',city:'杭州',country:'中国',place:'西湖',note:'风把湖面吹皱了，也把今天的烦恼吹走了。',scene:0,first:false,companion:'朋友',favorite:true},
 {id:'hotpot',type:'food',title:'吃到了超好吃的重庆火锅',date:'2026-09-08',city:'重庆',country:'中国',place:'街角老火锅',note:'聊到店快打烊，下次还要一起吃。',scene:1,rating:5,companion:'老朋友'},
 {id:'snow',type:'place',title:'第一次独自去北海道旅行',date:'2026-01-25',city:'札幌',country:'日本',place:'北海道',note:'雪落下的时候，世界好像按下了静音键。',scene:2,first:true,companion:'自己'},
 {id:'camp',type:'first',title:'第一次在湖边醒来',date:'2025-05-01',city:'杭州',country:'中国',place:'千岛湖',note:'清晨六点，帐篷外是一整片蓝色。',scene:3,first:true,companion:'朋友'}
];
let storageIssue = false;
function read(key, fallback) { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { storageIssue=true; return fallback; } }
const oldRecords = read('life-plus-one-records', null);
const oldWishes = read('life-plus-one-wishes', null);
const stored = read('life-plus-one-v2', null);
let state = stored || {records:oldRecords || demoRecords,wishes:oldWishes || [{id:'wish-snow',title:'去北海道看雪',category:'想去',state:'想做',scene:2},{id:'wish-camp',title:'在湖边露营，看一场日出',category:'想体验',state:'进行中',scene:3},{id:'wish-film',title:'看一场露天电影',category:'想看',state:'想做',scene:0}], birthday:'',demo:!oldRecords};
state.records = (state.records || []).map(r => ({...r,id:r.id || uid(),first:!!r.first || r.type==='first'}));
state.wishes = (state.wishes || []).map(w => ({...w,id:w.id || uid()}));
let photoLoading=false, photoRequest=0;
let page=new URLSearchParams(location.search).get('view')==='home'?'home':'cover', filter='all', query='', wishFilter='全部', detailId='', modalReturn=null, pendingScene=null, pendingPhoto=null;
const app = $('#app');
function persist(next) { try { localStorage.setItem('life-plus-one-v2',JSON.stringify(next)); state=next; return true; } catch { toast('本机存储空间不足或不可用，请减少照片后重试'); return false; } }
const sorted = () => [...state.records].sort((a,b)=>b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
const distinct = field => new Set(state.records.map(r=>r[field]).filter(Boolean)).size;
const countFirst = () => state.records.filter(r=>r.first || r.type==='first').length;
const shortDate = date => date.replaceAll('-','.');
const brand = () => `<button class="brand" data-go="cover" aria-label="返回进入封面"><b>+1</b><span>Life Plus One<small>给人生，加点新东西。</small></span></button>`;
function picture(r,cls='') { if(r.photo && /^data:image\/(jpeg|png|webp);base64,/.test(r.photo)) return `<div class="photo ${cls}"><img src="${r.photo}" alt="${esc(r.title)}"/></div>`; return Number.isInteger(r.scene) ? `<div class="photo scene scene-${r.scene} ${cls}" role="img" aria-label="${esc(r.title)}的示例配图"></div>` : `<div class="photo photo-empty ${cls}">${icon(r.type || 'wish')}</div>`; }
function cover() { return `<section class="entrance"><div class="landscape" aria-hidden="true"></div><div class="cover-wash"></div><header class="cover-header">${brand()}<span class="cover-edition">YOUR LIFE, YOUR LITTLE WONDERS.</span><button class="quiet-link" data-go="home">进入我的人生 ${icon('arrow')}</button></header><div class="cover-main"><div class="hello-chip">${icon('sun')} 世界很大，今天也很值得</div><h1>给人生，<br/>加点<span>新东西<span class="title-spark">✧</span></span>。</h1><p>一个第一次，一段新风景，一件小小的心愿。<br/>把生活里的「+1」，慢慢收藏成自己。</p><button class="enter-button" data-go="home">开启我的人生 +1 ${icon('arrow')}</button><span class="cover-caption">A LITTLE MORE LIFE. A LITTLE MORE YOU.</span></div><div class="floating-memories" aria-hidden="true"><div class="memory-note note-a">${picture({scene:0,title:'日落'})}<span>把日落，也装进口袋。</span><i>HANGZHOU · A GOOD DAY</i></div><div class="memory-note note-b">${picture({scene:2,title:'第一次旅行'})}<span>第一次，一个人出发。</span><i>HOKKAIDO · MY FIRST TIME</i></div><span class="float-sticker sticker-one">${icon('first')} 人生 +1</span><span class="float-sticker sticker-two">${icon('heart')} 收藏此刻</span></div><div class="light-motes" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><footer class="cover-footer"><span>不必很精彩，也值得被记住。</span><span>${icon('lock')} 只属于你的人生收藏夹</span></footer></section>`; }
const nav = () => `<nav class="bottom-nav" aria-label="主导航">${[['home','首页'],['places','足迹'],['add','记录'],['timeline','时间轴'],['mine','我的']].map(([p,l])=>`<button class="nav-item ${page===p?'active':''} ${p==='add'?'nav-add':''}" ${p==='add'?'data-action="types"':`data-go="${p}"`} ${page===p?'aria-current="page"':''}>${icon(p==='add'?'plus':p==='places'?'place':p)}<span>${l}</span></button>`).join('')}</nav>`;
const heading = (title,subtitle) => `<header class="page-heading"><button class="icon-button" data-go="home" aria-label="返回首页">${icon('back')}</button><h1>${title}</h1><button class="icon-button" data-action="types" aria-label="新增记录">${icon('plus')}</button></header>${subtitle?`<p class="page-subtitle">${subtitle}</p>`:''}`;
const sectionHead = (title,target,label='查看全部') => `<div class="section-head"><h2>${title}</h2>${target?`<button class="text-button" data-go="${target}">${label} ${icon('arrow')}</button>`:''}</div>`;
function recordList(items) { return items.length ? `<div class="record-list">${items.map(r=>`<button class="record" data-detail="${esc(r.id)}">${picture(r)}<div class="record-copy"><h3>${esc(r.title)}</h3><p>${esc(labels[r.type] || '人生记录')} <span>·</span> ${shortDate(r.date)}${r.city?' · '+esc(r.city):''}</p>${r.note?`<small>${esc(r.note)}</small>`:''}</div>${icon('arrow','row-arrow')}</button>`).join('')}</div>` : `<div class="empty">${icon('moment')}<h3>这一页，等一个新的故事</h3><p>第一次不用伟大，小小的尝试也值得。</p><button class="text-button" data-action="types">记录一个瞬间 ${icon('plus')}</button></div>`; }
function home() { const days=state.birthday ? Math.floor((Date.parse(today())-Date.parse(state.birthday))/86400000)+1 : null; return `<header class="app-header">${brand()}<button class="icon-button" data-go="search" aria-label="搜索记录">${icon('search')}</button></header><div class="hello-line"><span>嗨，今天也很高兴见到你</span>${icon('sun')}</div><button class="life-banner" data-go="numbers"><div class="banner-copy"><span>${days?'你已经生活了':'你已经收藏了'}</span><div><strong>${(days || state.records.length).toLocaleString()}</strong> ${days?'天':'个人生瞬间'}<em>+1</em></div><p>仍有很多值得 +1 的瞬间，在路上。</p></div><span class="banner-caption">A More Colorful Life</span></button><section class="modules" aria-label="人生入口">${[['wishes','wish','人生清单',`${state.wishes.length} 件小小心愿`],['places','place','去过的地方',`${distinct('city')} 座城市的故事`],['first','first','第一次',`${countFirst()} 次勇敢尝试`],['food','food','美食',`${state.records.filter(r=>r.type==='food').length} 份味觉记忆`],['movie','movie','电影',`${state.records.filter(r=>r.type==='movie').length} 场光影之旅`],['numbers','numbers','人生数字','关于我的小小宇宙']].map(([p,i,t,s])=>`<button class="module ${i}" data-go="${p}"><span class="module-icon">${icon(i)}</span><strong>${t}</strong><small>${s}</small></button>`).join('')}</section>${sectionHead('最近的人生','timeline')}${recordList(sorted().slice(0,3))}<button class="revisit" data-go="wishes"><span class="revisit-icon">${icon('wish')}</span><div><strong>把向往，变成自己的故事。</strong><small>下一件想做的事，是什么？</small></div>${icon('arrow')}</button><p class="tiny-note">${state.demo?'正在体验示例人生 · 你添加的记录保存在本机':'记录保存在当前浏览器'} · 默认私密</p>`; }
function collection(kind) { const first=kind==='first'; const title=first?'1000 个第一次':kind==='food'?'私人美食档案':'电影记忆'; const data=sorted().filter(r=>first?r.first:r.type===kind); return `${heading(title,first?'每一个第一次，都是成长的证据。':kind==='food'?'记住的不止味道，还有那天一起吃饭的人。':'把故事留在银幕，把感受留给自己。')}<div class="collection-summary ${kind}">${icon(kind)}<strong>${data.length}</strong><span>${first?'次新的体验':kind==='food'?'份味觉记忆':'段光影记忆'}</span></div>${first?groupedRecords(data):recordList(data)}`; }
function wishesPage() { const done=state.wishes.filter(w=>w.state==='已完成').length; const items=state.wishes.filter(w=>wishFilter==='全部' || w.category===wishFilter); return `${heading('人生清单','把想去的地方，一个个变成去过的地方。')}<div class="chips">${['全部','想去','想吃','想看','想学','想体验','其他'].map(t=>`<button class="chip ${wishFilter===t?'selected':''}" data-wish-filter="${t}">${t}</button>`).join('')}</div><div class="wish-banner"><span>慢慢来，向往的生活正在发生。</span><strong>${done}<small> / ${state.wishes.length} 个愿望已实现</small></strong><progress max="${state.wishes.length || 1}" value="${done}"></progress></div><div class="wish-list">${items.map(w=>`<article class="wish-row">${picture(w)}<div><h3>${esc(w.title)}</h3><small>${esc(w.category)} · <span class="wish-state ${w.state==='已完成'?'done':''}">${esc(w.state)}</span></small></div><button class="pill ${w.state==='已完成'?'done':''}" ${w.state==='已完成'?'disabled':`data-complete="${esc(w.id)}"`}>${w.state==='已完成'?'已完成':'完成并记录'}</button></article>`).join('') || '<p class="empty">先写下一件你真的想做的事。</p>'}</div><button class="primary full" data-action="wish">${icon('plus')} 添加到我的清单</button>`; }
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
function placesPage() { const cities=[...new Set(state.records.map(r=>r.city).filter(Boolean))]; return `${heading('去过的地方','我的世界，就这样一点点变大。')}<div class="stats three">${[[distinct('country'),'个国家'],[cities.length,'座城市'],[distinct('place'),'个地点']].map(([n,t])=>`<div><b>${n}</b><span>${t}</span></div>`).join('')}</div><div class="places-landscape"><span>${icon('place')} 风景会记得，你来过。</span><small>城市足迹 · 列表预览</small></div>${sectionHead('我的城市')}<div class="city-list">${cities.map(c=>`<button data-city="${esc(c)}">${icon('place')}<strong>${esc(c)}</strong><span>${state.records.filter(r=>r.city===c).length} 段回忆</span>${icon('arrow')}</button>`).join('') || '<p class="empty">记录时补充城市，就能在这里点亮足迹。</p>'}</div><p class="tiny-note">地图定位接入前，以已填写的城市展示足迹。</p>`; }
function numbersPage() { return `${heading('人生数字博物馆','数字不是目标，是你认真生活的痕迹。')}<button class="number-hero" data-go="timeline" aria-label="查看全部人生瞬间"><span>我的人生，持续 +1 中</span><strong>${state.records.length}<small>个瞬间</small></strong><p>有些事很小，记下来就很重要。</p></button><div class="stats number-grid">${[[distinct('city'),'去过的城市','places'],[countFirst(),'记录的第一次','first'],[state.records.filter(r=>r.type==='food').length,'美食记忆','food'],[state.records.filter(r=>r.type==='movie').length,'电影记忆','movie'],[state.wishes.filter(w=>w.state==='已完成').length,'完成的愿望','wishes'],[state.records.filter(r=>r.favorite).length,'收藏的瞬间','favorites']].map(([n,t,p])=>`<button data-go="${p}"><b>${n}</b><span>${t}</span></button>`).join('')}</div><button class="revisit" data-action="birthday">${icon('sun')}<div><strong>${state.birthday?'更新我的出生日期':'看看我已经生活了多少天'}</strong><small>${state.birthday?esc(state.birthday):'填写生日后，首页会显示人生天数'}</small></div>${icon('arrow')}</button>`; }
function minePage() { return `${heading('我的人生收藏夹','好好生活，慢慢记录。')}<div class="profile"><span>+1</span><h2>生活的收藏家</h2><p>${state.records.length} 段经历 · ${countFirst()} 个第一次</p></div><div class="menu-list">${[['wishes','wish','人生清单'],['numbers','numbers','人生数字'],['favorites','heart','我的收藏'],['timeline','timeline','所有人生记录']].map(([p,i,t])=>`<button data-go="${p}">${icon(i)}<span>${t}</span>${icon('arrow')}</button>`).join('')}<button data-action="export">${icon('export')}<span>导出我的记录</span>${icon('arrow')}</button><button data-go="cover">${icon('home')}<span>回到进入封面</span>${icon('arrow')}</button></div><p class="privacy-copy">${icon('lock')} 这本人生收藏夹，只属于你。<small>体验版数据保存在当前浏览器，无账号与云同步。示例配图由 AI 生成。</small></p>`; }
function details() { const r=state.records.find(r=>r.id===detailId); if(!r)return heading('这条记录已不存在'); return `${heading('一个人生瞬间')}${picture(r,'detail-photo')}<div class="detail-body"><span class="tag">${esc(labels[r.type] || '生活瞬间')}${r.first?' · 第一次':''}</span><h2>${esc(r.title)}</h2><p class="detail-meta">${shortDate(r.date)}${r.place?' · '+esc(r.place):''}${r.city?' · '+esc(r.city):''}</p>${r.companion?`<p class="detail-meta">和 ${esc(r.companion)} 一起</p>`:''}${r.rating?`<p class="rating-display">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</p>`:''}<p class="detail-note">${esc(r.note || '那天的感受，留待下次慢慢补上。')}</p><div class="detail-actions"><button class="pill" data-favorite="${esc(r.id)}">${icon('heart')} ${r.favorite?'已收藏':'收藏这一刻'}</button><button class="text-button danger" data-delete="${esc(r.id)}">删除记录</button></div></div>`; }
function render() { closeModal(); document.body.classList.toggle('on-cover',page==='cover'); const views={home,first:()=>collection('first'),food:()=>collection('food'),movie:()=>collection('movie'),wishes:wishesPage,timeline:()=>timelinePage(),search:()=>timelinePage(true),places:placesPage,numbers:numbersPage,mine:minePage,detail:details,favorites:()=>heading('我的收藏','那些想要一看再看的片刻。')+recordList(sorted().filter(r=>r.favorite))}; app.innerHTML=page==='cover'?cover():`<div class="app-backdrop"></div><aside class="desktop-aside">${brand()}<h2>生活有很多种，<br/>喜欢的都算数。</h2><p>记下此刻，也收藏未来的自己。</p><span class="aside-script">A More Colorful Life</span></aside><div class="phone"><div class="page-content">${(views[page] || home)()}</div>${nav()}</div>`; }
function go(p) { page=p; render(); window.scrollTo(0,0); }
// Keep the homepage identity visible in the desktop panel without rerendering on scroll.
document.addEventListener('scroll',e=>{
 if(!e.target.matches?.('.page-content') || !matchMedia('(min-width:1100px)').matches)return;
 const header=e.target.querySelector('.app-header');
 if(!header)return;
 // Separate thresholds prevent the header's height change from toggling it repeatedly.
 if(e.target.scrollTop>48)header.classList.add('is-compact');
 else if(e.target.scrollTop<8)header.classList.remove('is-compact');
},{capture:true,passive:true});
function openModal(content, title='记录一个瞬间') { closeModal(); modalReturn=document.activeElement; app.inert=true; document.body.classList.add('modal-open'); const overlay=document.createElement('div'); overlay.id='overlay'; overlay.className='overlay'; overlay.innerHTML=`<section class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-handle"></div><button class="icon-button sheet-close" data-action="close" aria-label="关闭">${icon('close')}</button>${content}</section>`; document.body.append(overlay); requestAnimationFrame(()=>overlay.querySelector('input,button')?.focus()); }
function closeModal() { photoRequest++; photoLoading=false; $('#overlay')?.remove(); app.inert=false; document.body.classList.remove('modal-open'); modalReturn?.isConnected && modalReturn.focus(); }
function openTypes() { openModal(`<div class="sheet-title"><span class="handwritten">今天，</span><h2>想给人生加点什么？</h2><p>每一个小小的记录，都让生活更丰富。</p></div><div class="type-grid">${Object.entries(kinds).map(([k,[t,s]])=>`<button class="type-card ${k}" data-type="${k}"><span class="module-icon">${icon(k)}</span><strong>${t}</strong><small>${s}</small></button>`).join('')}</div><p class="sheet-foot">记录当下，也收藏未来的自己。</p>`,'选择记录类型'); }
function openForm(type,wishId='') { if(type==='wish'&&!wishId)return wishForm(); const wish=state.wishes.find(w=>w.id===wishId); pendingScene=wish?.scene ?? null; pendingPhoto=null; const day=today(); openModal(`<h2 class="form-title">${wish?'愿望完成，人生 +1':kinds[type]?.[0] || '记录一个瞬间'}</h2><p class="form-subtitle">${wish?'保存这段经历后，清单会自动标记完成。':'不必写很多，记住这一刻就好。'}</p><form id="record-form" data-type="${type}" data-wish="${esc(wishId)}"><label class="field">${type==='food'?'餐厅 / 标题':type==='movie'?'片名':'给这次经历起个标题'} <span>*</span><input name="title" required maxlength="30" placeholder="例如：第一次一个人去看海" value="${esc(wish?.title || '')}"/></label><div class="form-columns"><label class="field">发生日期 *<input type="date" name="date" required value="${day}" max="${day}"/></label><label class="field">和谁一起<input name="companion" maxlength="30" placeholder="自己 / 朋友 / 家人"/></label></div><div class="form-columns"><label class="field">城市${type==='place'?' *':''}<input name="city" ${type==='place'?'required':''} maxlength="40" placeholder="例如：杭州"/></label><label class="field">国家 / 地区<input name="country" maxlength="40" placeholder="例如：中国"/></label></div><label class="field">具体地点<input name="place" maxlength="60" placeholder="可手动填写，不需要定位权限"/></label><fieldset class="photo-picker"><legend>留下一张照片 <small>选填</small></legend><div class="sample-photos">${[0,1,2,3].map(n=>`<button type="button" class="scene scene-${n} sample-photo ${pendingScene===n?'picked':''}" data-scene="${n}" aria-label="选择示例照片 ${n+1}" aria-pressed="${pendingScene===n}"></button>`).join('')}<label class="upload-photo">${icon('plus')}<span>本机照片</span><input aria-label="选择一张本机照片" type="file" accept="image/jpeg,image/png,image/webp" id="photo-file"/></label></div><div class="photo-preview" id="photo-preview" hidden><img alt="所选照片预览"/><button type="button" class="text-button" data-action="remove-photo">移除照片</button></div><small id="photo-status" role="status">可选示例配图，或上传一张本机照片（最多 2MB）。</small></fieldset>${['food','movie'].includes(type)?`<label class="field">我的评分<select name="rating"><option value="">暂不评分</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${'★'.repeat(n)} ${n} 分</option>`).join('')}</select></label>`:''}<label class="toggle-row"><span>这是我的第一次<small>会同步出现在「1000 个第一次」</small></span><input type="checkbox" name="first" ${type==='first'?'checked':''}/></label><label class="field">一句话感受<textarea name="note" aria-describedby="note-count" maxlength="200" placeholder="此刻的感受，未来的自己会记得。"></textarea><small class="field-counter" id="note-count">0 / 200</small></label><p class="form-error" id="form-error" role="alert"></p><button class="primary full" type="submit">${icon('plus')} 保存这一刻</button><p class="tiny-note">仅自己可见 · 保存在本机</p></form>`,'新增人生记录'); }
function wishForm() { openModal(`<h2 class="form-title">先写下一件，真的想做的事。</h2><p class="form-subtitle">不着急完成，有向往就很好。</p><form id="wish-form"><label class="field">我的愿望 *<input name="title" required maxlength="30" placeholder="例如：去北海道看雪"/></label><label class="field">愿望分类<select name="category">${['想去','想吃','想看','想学','想体验','其他'].map(t=>`<option>${t}</option>`).join('')}</select></label><button class="primary full" type="submit">${icon('plus')} 添加到我的清单</button></form>`,'添加愿望'); }
function toast(text) { $('.toast')?.remove(); const el=document.createElement('div'); el.className='toast';el.role='status';el.textContent=text;document.body.append(el);setTimeout(()=>el.remove(),3200); }
document.addEventListener('click',event=>{ const b=event.target.closest('button,[data-city]'); if(!b){if(event.target.id==='overlay')closeModal();return;} const d=b.dataset;
 if(d.go)go(d.go);
 if(d.detail){detailId=d.detail;go('detail');}
 if(d.type)openForm(d.type);
 if(d.complete)openForm('place',d.complete);
 if(d.wishFilter){wishFilter=d.wishFilter;render();}
 if(d.filter){filter=d.filter;render();}
 if(d.city){query=d.city;filter='all';go('search');}
 if(d.scene!==undefined){photoRequest++;photoLoading=false;$('#photo-preview').hidden=true;$('#photo-file').value='';pendingScene=Number(d.scene);pendingPhoto=null;document.querySelectorAll('[data-scene]').forEach(el=>{el.classList.toggle('picked',el===b);el.setAttribute('aria-pressed',String(el===b));});$('#photo-status').textContent='已选择示例配图';}
 if(d.favorite){const next={...state,records:state.records.map(r=>r.id===d.favorite?{...r,favorite:!r.favorite}:r)};if(persist(next))render();}
 if(d.delete){openModal(`<h2 class="form-title">删除这个人生瞬间？</h2><p class="form-subtitle">删除后，时间轴和统计会同步更新。关联愿望会恢复为想做。此操作无法撤销。</p><button class="primary full" data-confirm-delete="${esc(d.delete)}">确认删除</button><button class="text-button full" data-action="close">保留这个瞬间</button>`,'确认删除');}
 if(d.confirmDelete){const r=state.records.find(r=>r.id===d.confirmDelete);const next={...state,records:state.records.filter(item=>item.id!==d.confirmDelete),wishes:state.wishes.map(w=>w.id===r?.wishId?{...w,state:'想做'}:w)};if(persist(next)){go('timeline');toast('记录已删除');}}
 if(d.action==='remove-photo'){photoRequest++;photoLoading=false;pendingPhoto=null;pendingScene=null;$('#photo-file').value='';$('#photo-preview').hidden=true;$('#photo-status').textContent='照片已移除，可以重新选择。';}
 if(d.action==='types')openTypes(); if(d.action==='close')closeModal(); if(d.action==='wish')wishForm();
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
document.addEventListener('change',e=>{
 if(e.target.id!=='photo-file')return;
 const f=e.target.files[0];if(!f)return;
 if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>2*1024*1024){
  $('#photo-status').textContent='请选择 2MB 以内的 JPG、PNG 或 WebP 图片';e.target.value='';return;
 }
 const request=++photoRequest;photoLoading=true;$('#photo-status').textContent='正在读取照片…';
 const reader=new FileReader();reader.onload=()=>{
  if(request!==photoRequest||!$('#record-form'))return;
  photoLoading=false;pendingPhoto=reader.result;pendingScene=null;
  document.querySelectorAll('[data-scene]').forEach(el=>{el.classList.remove('picked');el.setAttribute('aria-pressed','false');});
  const preview=$('#photo-preview');preview.hidden=false;preview.querySelector('img').src=pendingPhoto;
  $('#photo-status').textContent='已选择：'+f.name;
 };reader.onerror=()=>{if(request===photoRequest){photoLoading=false;$('#photo-status').textContent='照片读取失败，请重新选择；也可以先保存文字。';}};reader.readAsDataURL(f);
});
document.addEventListener('submit',async e=>{if(!['record-form','wish-form','birthday-form'].includes(e.target.id))return;e.preventDefault();const form=e.target;
 if(form.dataset.saving)return;
 if(photoLoading){$('#photo-status').textContent='照片还在读取，请稍候再保存。';return;}
 const f=new FormData(form),button=form.querySelector('button[type=submit],button.primary');
 const original=button.innerHTML;form.dataset.saving='true';form.setAttribute('aria-busy','true');button.disabled=true;button.textContent='正在保存…';
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 if(!form.isConnected)return;
 try {
 if(form.id==='record-form'){const title=f.get('title').trim(),date=f.get('date');if(!title||!date||date>today()||(form.dataset.type==='place'&&!f.get('city').trim())){$('#form-error').textContent='请填写标题、所需城市和不晚于今天的发生日期。';return;}const r={id:uid(),type:form.dataset.type,title,date,city:f.get('city').trim(),country:f.get('country').trim(),place:f.get('place').trim(),companion:f.get('companion').trim(),note:f.get('note').trim(),first:f.has('first'),rating:Number(f.get('rating')) || null,scene:pendingScene,photo:pendingPhoto,wishId:form.dataset.wish || null,createdAt:new Date().toISOString()};const next={...state,records:[...state.records,r],wishes:state.wishes.map(w=>w.id===r.wishId?{...w,state:'已完成'}:w)};if(persist(next)){go('home');toast(r.wishId?'愿望完成，人生 +1！':'已收藏这个瞬间，人生 +1！');}}
 if(form.id==='wish-form'){const title=f.get('title').trim();if(!title)return;const next={...state,wishes:[...state.wishes,{id:uid(),title,category:f.get('category'),state:'想做'}]};if(persist(next)){go('wishes');toast('小小的向往，已经收好。');}}
 if(form.id==='birthday-form'){if(persist({...state,birthday:f.get('birthday')})){go('home');toast('已更新你的人生天数');}}
 } finally {if(form.isConnected){delete form.dataset.saving;form.removeAttribute('aria-busy');button.disabled=false;button.innerHTML=original;}}
});
document.addEventListener('keydown',e=>{const overlay=$('#overlay');if(!overlay)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const focus=[...overlay.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled);const first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
render();
if(storageIssue)toast('已有数据暂时无法读取，请先检查浏览器存储设置');
