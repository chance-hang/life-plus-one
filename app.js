const seedRecords = [
  { type: 'food', icon: '🍜', title: '巷口那碗热汤面', date: '2026-09-14', place: '西安', note: '下班后的热气，把今天接住了。' },
  { type: 'first', icon: '✦', title: '第一次一个人看展', date: '2026-09-08', place: '西安美术馆', note: '原来一个人也可以慢慢看完。' },
  { type: 'place', icon: '⌂', title: '沿着城墙走了一圈', date: '2026-08-30', place: '西安', note: '风很轻，城市比想象中更大。' }
];
const types = [
  ['first', '✦', '一个第一次'], ['place', '⌂', '一个地方'], ['food', '🍜', '一顿好吃的'],
  ['movie', '▣', '一部电影'], ['wish', '♡', '一个愿望'], ['moment', '＋', '其他瞬间']
];
let records = JSON.parse(localStorage.getItem('life-plus-one-records') || 'null') || seedRecords;
let wishes = JSON.parse(localStorage.getItem('life-plus-one-wishes') || 'null') || [
  { title: '去北海道看雪', category: '想去', state: '想做' },
  { title: '学会做一顿拿手菜', category: '想学', state: '进行中' },
  { title: '看一次露天电影', category: '想体验', state: '想做' }
];
let page = 'home';
const app = document.querySelector('#app');
const save = () => { localStorage.setItem('life-plus-one-records', JSON.stringify(records)); localStorage.setItem('life-plus-one-wishes', JSON.stringify(wishes)); };
const fmt = (d) => d.slice(5).replace('-', '月') + '日';
const nav = () => `<nav class="bottom-nav" aria-label="主导航">
  ${navItem('home', '⌂', '首页')} ${navItem('timeline', '◷', '时间轴')}
  <button class="nav-add" aria-label="新增记录" onclick="openTypes()">+</button>
  ${navItem('wishes', '♡', '清单')} ${navItem('mine', '○', '我的')}
</nav>`;
const navItem = (key, icon, label) => `<button class="nav-item ${page === key ? 'active' : ''}" onclick="go('${key}')"><span>${icon}</span><span>${label}</span></button>`;
const recordsView = (items = records.slice(0, 3)) => items.length ? `<div class="record-list">${items.map(r => `<article class="record"><div class="record-mark">${r.icon}</div><div><h3>${r.title}</h3><p>${r.place || '未填写地点'} · ${r.note || '留给未来的一个小记号'}</p></div><time>${fmt(r.date)}</time></article>`).join('')}</div>` : `<div class="empty">今天也可以成为未来会想起的一天。</div>`;
const home = () => `<div class="phone"><header class="topbar"><div class="wordmark"><span>+</span>1 Life Plus One</div><div class="top-actions"><button class="icon-button" aria-label="搜索" onclick="toast('搜索入口将在下一版开放')">⌕</button><button class="icon-button" aria-label="个人中心" onclick="go('mine')">○</button></div></header>
  <section class="hero"><div class="hero-kicker">LIFE PLUS ONE · 2026</div><h1>今天，也给人生加点新东西。</h1><p>你已经认真生活了 10,532 天</p></section>
  <section><div class="section-head"><h2>人生入口</h2><button class="text-button" onclick="openTypes()">＋ 记录一件事</button></div><div class="module-grid">${[['wishes','♡','人生清单',wishes.length+' 件愿望'],['timeline','◷','时间轴',records.length+' 段经历'],['mine','✦','1000 个第一次','记录 27 次'],['home','⌂','足迹','18 座城市'],['home','🍜','美食档案','126 次味道'],['home','▣','电影记忆','248 部电影']].map(([p,i,t,s]) => `<button class="module" onclick="go('${p}')"><span class="module-icon">${i}</span><strong>${t}</strong><small>${s}</small></button>`).join('')}</div></section>
  <section><div class="section-head"><h2>最近的人生</h2><button class="text-button" onclick="go('timeline')">查看全部</button></div>${recordsView()}</section>${nav()}</div>`;
const timeline = () => `<div class="phone"><div class="backbar"><button onclick="go('home')">‹</button><h1>时间轴</h1></div><p class="page-intro">把散落的片段放回时间里。每一条记录，都是你生活过的证据。</p><div class="timeline"><div class="timeline-year">2026</div>${recordsView(records)}</div>${nav()}</div>`;
const wishPage = () => `<div class="phone"><div class="backbar"><button onclick="go('home')">‹</button><h1>人生清单</h1></div><p class="page-intro">这里放未来想体验的事，不追赶进度，只保留向往。</p><div class="wish-list">${wishes.map((w,i) => `<article class="wish"><div><h3>${w.title}</h3><p>${w.category} · ${w.state}</p></div><button onclick="completeWish(${i})">${w.state === '已完成' ? '已完成' : '完成并记录'}</button></article>`).join('')}</div><button class="save-button" style="margin-top:18px" onclick="addWish()">＋ 添加到我的清单</button>${nav()}</div>`;
const mine = () => `<div class="phone"><div class="backbar"><button onclick="go('home')">‹</button><h1>我的人生数字</h1></div><p class="page-intro">数字不是目标，只是你留下过的生活痕迹。</p><div class="stat-strip"><div class="stat"><b>${records.length}</b><span>人生记录</span></div><div class="stat"><b>18</b><span>去过的城市</span></div><div class="stat"><b>${wishes.filter(w => w.state === '已完成').length}</b><span>完成愿望</span></div></div><section><div class="section-head"><h2>我的记录</h2></div>${recordsView()}</section><section><div class="section-head"><h2>隐私</h2></div><div class="empty">默认仅自己可见。分享和导出，会由你亲自决定。</div></section>${nav()}</div>`;
function render() { app.innerHTML = page === 'home' ? home() : page === 'timeline' ? timeline() : page === 'wishes' ? wishPage() : mine(); }
function go(p) { page = p; render(); window.scrollTo(0, 0); }
function openTypes() { document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="overlay" onclick="if(event.target===this)closeSheet()"><section class="sheet"><div class="grab"></div><h2>今天，想给人生加点什么？</h2><p class="sheet-sub">选一个轻松的入口，30 秒留住这一刻。</p><div class="type-grid">${types.map(([k,i,t]) => `<button class="type-choice" onclick="openForm('${k}')"><span>${i}</span><strong>${t}</strong></button>`).join('')}</div></section></div>`); }
function openForm(type) { const meta = types.find(t => t[0] === type); document.querySelector('#overlay').innerHTML = `<section class="sheet"><div class="grab"></div><h2>${meta[1]} ${meta[2]}</h2><p class="sheet-sub">先记下来，其他细节以后想补再补。</p><div class="field"><label for="title">标题</label><input id="title" maxlength="30" placeholder="例如：第一次一个人去看海" autofocus /></div><div class="field"><label for="date">发生日期</label><input id="date" type="date" value="${new Date().toISOString().slice(0,10)}" /></div><div class="field"><label for="place">地点 <span style="font-weight:400;color:var(--ink-faint)">选填</span></label><input id="place" maxlength="30" placeholder="城市或具体地点" /></div><div class="field"><label for="note">一句话感受 <span style="font-weight:400;color:var(--ink-faint)">选填</span></label><textarea id="note" maxlength="200" placeholder="给未来的自己留一句话"></textarea></div><button class="save-button" onclick="saveRecord('${type}','${meta[1]}')">保存记录</button></section>`; }
function closeSheet() { document.querySelector('#overlay')?.remove(); }
function saveRecord(type, icon) { const title = document.querySelector('#title').value.trim(); if (!title) return toast('先写下这件事的标题'); records.unshift({ type, icon, title, date: document.querySelector('#date').value, place: document.querySelector('#place').value.trim(), note: document.querySelector('#note').value.trim() }); save(); closeSheet(); render(); toast('保存成功，人生 +1'); }
function completeWish(i) { if (wishes[i].state === '已完成') return; wishes[i].state = '已完成'; save(); openForm('wish'); document.querySelector('#title').value = wishes[i].title; toast('愿望已带入记录'); }
function addWish() { const title = prompt('写下一件你真的想做的事'); if (title?.trim()) { wishes.push({ title: title.trim(), category: '其他', state: '想做' }); save(); render(); toast('已加入人生清单'); } }
function toast(message) { document.querySelector('.toast')?.remove(); document.body.insertAdjacentHTML('beforeend', `<div class="toast">${message}</div>`); setTimeout(() => document.querySelector('.toast')?.remove(), 2200); }
render();
