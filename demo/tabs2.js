/* Browser additions: the MENU of the tab bar (downloads, history, settings and the new features in one list), the speaker of each tab that plays sound
   (click: mute / unmute), find in page (Ctrl+F: all matches highlighted, regex), split view (two tabs side by side, Ctrl+Shift+S),
   a right-click menu on the tabs, and private tabs (Ctrl+Shift+N, no history nor cookies kept, see private:open in main.js). */

/* ---------- MENU: the three buttons of the tab bar become a list ---------- */
const tbMenu = el('button', 'tbtn', 'MENU'), tbPop = el('div', 'tbPop px');
tbMenu.id = 'bMenu'; tbMenu.title = 'Téléchargements, historique, paramètres et outils du navigateur';
$('wMin').before(tbMenu); document.body.append(tbPop);
// keys: a shortcut is shown on the right, any other hint becomes the tooltip (the MENU stays two short columns)
const tbItem = (label, keys, f) => { const b = el('button', 'tbtn'), key = /^(Ctrl|Maj|Alt|F\d)/.test(keys || ''); b.append(el('span', '', label.toUpperCase()), el('small', '', key ? keys : '')); if (keys && !key) b.title = keys; b.onclick = f; return b; };
tbPop.append($('bDownloads'), $('bHistory'), $('bSettings'), el('hr'),
  tbItem('Rechercher dans la page', 'Ctrl+F', () => findOpen()),
  tbItem('Vue scindée', 'Ctrl+Maj+S', () => splitToggle()),
  tbItem('Onglet privé', 'Ctrl+Maj+N', () => privateWin()),
  tbItem('Fenêtre de recherche', 'Ctrl+Maj+F', () => window.neo?.searchOpen()),
  tbItem('Inspecter la page', 'F12', () => inspectTab()));
for (const b of [$('bDownloads'), $('bHistory'), $('bSettings')]) b.classList.add('tbFull');
// the entries used rarely go under « PLUS… » (they are added by several files, so they are sorted when the MENU opens)
const TB_MORE = ['INSPECTER LA PAGE', 'FENÊTRE DE RECHERCHE', 'MODE SANS ÉCHEC', 'SIGNALER UN PROBLÈME', 'À PROPOS · MISES À JOUR', 'BARRE DES TÂCHES', 'PALETTE DE COMMANDES'];
const tbMore = el('div', 'tbMore'), tbMoreBtn = el('button', 'tbtn tbFull tbMoreBtn', '+ PLUS');
tbMoreBtn.onclick = e => { e.stopPropagation(); tbPop.classList.toggle('more'); tbMoreBtn.textContent = tbPop.classList.contains('more') ? '- MOINS' : '+ PLUS'; };
tbMenu.onclick = e => {
  e.stopPropagation();
  for (const b of tbPop.querySelectorAll(':scope > .tbtn')) if (TB_MORE.includes(b.firstChild?.textContent?.trim())) tbMore.append(b);
  tbPop.append(tbMoreBtn, tbMore); tbPop.querySelectorAll(':scope > hr').forEach(h => { if (!h.nextElementSibling?.matches('.tbtn:not(.tbMoreBtn)')) h.remove(); });
  tbPop.classList.toggle('on');
};
tbPop.addEventListener('click', () => tbPop.classList.remove('on'));
document.addEventListener('pointerdown', e => { if (!e.target.closest('.tbPop, #bMenu')) tbPop.classList.remove('on'); }, true);
// a click in a web page, in an app (iframe) or anywhere outside NeoDex never reaches this document: the window losing focus closes the menus too
addEventListener('blur', () => { tbPop.classList.remove('on'); document.querySelector('.dkPop')?.remove(); for (const id of ['dlPanel', 'sortPop', 'layoutPop']) $(id)?.classList.remove('on'); });
// a running download shows on the MENU button too (its count is written in the Téléchargements item)
new MutationObserver(() => { const m = /\((\d+)\)/.exec($('bDownloads').textContent); tbMenu.textContent = m ? 'MENU (' + m[1] + ')' : 'MENU'; })
  .observe($('bDownloads'), {childList: true, characterData: true, subtree: true});
const inspectTab = (t = active) => { if (!t || t.app || t.lazy) return toast('L\'inspecteur marche sur les pages web, pas sur les applis de NeoDex', true); t.v.openDevTools(); };
const privateWin = () => window.neo?.privateOpen().then(part => newTab(new URL(SEARCH[prefs.search] || SEARCH.duckduckgo).origin, true, true, part)).catch(e => toast('Onglet privé impossible : ' + e.message, true));

/* ---------- a narrow window or many tabs: the tabs lose their margins, then their titles (tight / tiny), never MENU nor the window buttons ---------- */
{
  const strip = $('tabstrip'), fit = () => { strip.classList.remove('tight', 'tiny'); for (const c of ['tight', 'tiny']) { if (strip.scrollWidth <= strip.clientWidth) break; strip.classList.add(c); } };
  new ResizeObserver(fit).observe(strip); new MutationObserver(fit).observe($('bTabs'), {childList: true});
}

/* ---------- speaker on the tabs that play sound ---------- */
function tabAudio(t) {
  if (t.app?.plugin) return pluginHooks.get(t.app.plugin)?.audio?.() ?? null;
  if (t.app || t.lazy) return null;
  try { return {audible: !!t.audible, muted: t.muted ??= t.v.isAudioMuted()}; } catch { return null; }  // not attached yet ; t.audible : événements media-* (index.html)
}
function tabMute(t, on) {
  const a = tabAudio(t); if (!a) return;
  on ??= !a.muted;
  if (t.app?.plugin) pluginHooks.get(t.app.plugin)?.mute?.(on); else if (!t.app) { t.v.setAudioMuted(on); t.muted = on; }
  tabSpeakers();
}
function tabSpeakers() {
  for (const t of tabs) {
    const a = tabAudio(t);
    let s = t.btn.querySelector('.snd');
    if (!a || (!a.audible && !a.muted)) { s?.remove(); continue; }
    if (!s) { s = el('button', 'snd'); s.onclick = e => { e.stopPropagation(); tabMute(t); }; t.btn.querySelector('.x').before(s); }
    const k = a.muted ? 'mute' : 'sound';
    if (s.dataset.k !== k) { s.dataset.k = k; s.innerHTML = pixIcon(PIX[k]); s.title = a.muted ? 'Remettre le son' : 'Couper le son de cet onglet'; s.classList.toggle('muted', a.muted); }
  }
}
setInterval(() => document.hidden || tabSpeakers(), 2000);  // les plugins (pluginHooks.audio) n'ont pas d'événement : un coup d'œil toutes les 2 s

/* ---------- find in page ---------- */
const fb = {bar: el('div', 'findBar px'), input: el('input', 'f'), count: el('span', 'findCount'), opts: {caseSens: false, word: false, regex: false}, target: null, timer: null};
{
  fb.input.placeholder = 'Rechercher dans la page'; fb.input.spellcheck = false;
  const opt = (k, label, title) => { const b = el('button', 'findOpt', label); b.title = title; b.onclick = () => { fb.opts[k] = !fb.opts[k]; b.classList.toggle('on', fb.opts[k]); findGo(0); fb.input.focus(); }; return b; };
  const nav = (label, step, title) => { const b = el('button', 'findOpt', label); b.title = title; b.onclick = () => { findGo(step); fb.input.focus(); }; return b; };
  const x = el('button', 'findOpt', 'X'); x.title = 'Fermer (Échap)'; x.onclick = findClose;
  fb.bar.append(fb.input, fb.count, opt('caseSens', 'Aa', 'Respecter les majuscules'), opt('word', 'Mot', 'Mot entier'), opt('regex', '.*', 'Expression régulière'),
    nav('▲', -1, 'Précédent (Maj+Entrée)'), nav('▼', 1, 'Suivant (Entrée)'), x);
  document.body.append(fb.bar);
  fb.input.oninput = () => { clearTimeout(fb.timer); fb.timer = setTimeout(() => findGo(0), 140); };
  fb.input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); findGo(e.shiftKey ? -1 : 1); } if (e.key === 'Escape') findClose(); };
}
// where the search runs: the website of the tab, or the part of NeoDex on screen (an app, or the home page)
async function findIn(t, q, step) {
  const o = JSON.stringify(fb.opts), qs = JSON.stringify(q);
  if (t && !t.app) return t.lazy ? {n: 0, i: -1} : t.v.executeJavaScript(`(${neoFindRun})(document.body, ${qs}, ${o}, ${step})`).catch(() => ({n: 0, i: -1}));
  if (t?.app?.plugin && q && (pluginInfo.get(t.app.plugin)?.commands || []).some(c => c.id === 'find')) { pluginDeliver(t.app.plugin, { t: 'command', id: 'find' }); await new Promise(ok => setTimeout(ok, 300)); }  // a PDF is drawn: its text layer is what gets searched
  if (t?.app === APPS['neodex:notes'] && $('naSearch').value !== q) {  // every note, not only the open one: the list keeps the matches
    $('naSearch').value = q; renderNoteList();
    const l = q.toLowerCase(); if (q && !(curNote && (curNote.title + ' ' + curNote.text).toLowerCase().includes(l))) { const hit = notes.find(n => (n.title + ' ' + n.text).toLowerCase().includes(l)); if (hit) openNote(hit); }
  }
  return neoFindRun(t ? t.v : document.querySelector('main'), q, fb.opts, step);
}
async function findGo(step) {
  if (!fb.bar.classList.contains('on')) return;
  if (fb.target !== (active || 'home')) { if (fb.target) findIn(fb.target === 'home' ? null : fb.target, '', 0); fb.target = active || 'home'; step = 0; }
  const r = await findIn(active, fb.input.value, step);
  fb.count.textContent = r.error ? r.error : !fb.input.value ? '' : r.n ? (r.i + 1) + ' / ' + r.n + (r.n >= 5000 ? '+' : '') : 'aucun';
  fb.count.classList.toggle('none', !!fb.input.value && !r.n);
}
function findOpen() {
  const sel = String(getSelection());
  fb.bar.classList.add('on'); window.neo?.win('focus');
  if (sel && sel.length < 80 && !sel.includes('\n')) fb.input.value = sel;
  setTimeout(() => { fb.input.focus(); fb.input.select(); }, 30);
  fb.target = null; findGo(0);
}
function findClose() {
  if (fb.target) findIn(fb.target === 'home' ? null : fb.target, '', 0);
  fb.target = null; fb.bar.classList.remove('on'); fb.count.textContent = '';
}

/* ---------- split view: two tabs side by side, the one clicked last is the one the address bar acts on ---------- */
let split = null;  // {a, b}: left and right tab
let splitR = (() => { try { return Math.min(.85, Math.max(.15, +localStorage.neoSplit || .5)); } catch { return .5; } })();
const splitBar = el('div'); splitBar.id = 'splitBar';
{
  const btns = el('div', 'sbBtns'), swap = el('button', '', '⇄'), x = el('button', '', 'X');
  swap.title = 'Échanger les côtés'; x.title = 'Fermer la vue scindée';
  swap.onclick = e => { e.stopPropagation(); if (split) { split = {a: split.b, b: split.a}; splitApply(); } };
  x.onclick = e => { e.stopPropagation(); side ? sideUnpin() : splitClose(); };
  btns.append(swap, x); splitBar.append(btns); $('bViews').append(splitBar);
}
function splitApply() {
  const bv = $('bViews');
  bv.classList.toggle('split', !!split); bv.style.setProperty('--sr', splitR);
  for (const t of tabs) { t.v.classList.remove('sA', 'sB', 'sF'); t.btn.classList.remove('inSplit'); }
  if (!split) return;
  for (const [t, c] of [[split.a, 'sA'], [split.b, 'sB']]) {
    if (t.lazy) wakeTab(t, bv);
    t.v.classList.add(c); t.btn.classList.add('inSplit');
    if (t === active) t.v.classList.add('sF');
  }
}
function splitOpen(a, b) {
  if (!a || !b || a === b) return;
  if (mini === a || mini === b) unMini();
  split = {a, b};
  b.app?.open?.();
  if (active !== a && active !== b) showTab(a); else splitApply();
  sfx('open');
}
function splitClose() { if (!split) return; split = null; splitApply(); if (active) showTab(active); }
function splitToggle() {
  if (split) return splitClose();
  if (!active) return toast('Ouvre d\'abord un onglet à afficher à gauche', true);
  // which tab goes on the right
  const others = tabs.filter(t => t !== active), pop = el('div', 'tbPop tabPick px on');
  const pick = t => { pop.remove(); splitOpen(active, t); };
  pop.append(el('span', 'label', 'À droite de « ' + active.title.slice(0, 30) + ' »'),
    ...others.map(t => { const b = el('button', 'tbtn tbFull'); const ic = el('img'); ic.src = t.btn.querySelector('img').src; b.append(ic, el('span', '', t.title)); b.onclick = () => pick(t); return b; }),
    (() => { const b = el('button', 'tbtn tbFull', '+ Nouvel onglet'); b.onclick = () => { pop.remove(); const t = newTab(homeUrl(), false, true); splitOpen(active, t); }; return b; })());
  document.body.append(pop);
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', off, true); } }, true));
}
splitBar.onpointerdown = e => {
  if (e.target.closest('button')) return;
  const r = $('bViews').getBoundingClientRect();
  splitBar.setPointerCapture(e.pointerId); splitBar.classList.add('drag'); document.body.classList.add('splitDrag');
  splitBar.onpointermove = m => { splitR = Math.min(.85, Math.max(.15, (m.clientX - r.left) / r.width)); $('bViews').style.setProperty('--sr', splitR); };
  splitBar.onpointerup = () => {
    splitBar.onpointermove = splitBar.onpointerup = null; splitBar.classList.remove('drag'); document.body.classList.remove('splitDrag');
    try { localStorage.neoSplit = splitR; } catch {}
  };
};
// clicking into the other half makes it the active tab (address bar, keys, find)
const splitFocus = target => { if (!split) return; const t = [split.a, split.b].find(t => t.v === target || t.v.contains(target)); if (t && t !== active) showTab(t); };
$('bViews').addEventListener('focusin', e => splitFocus(e.target));
$('bViews').addEventListener('pointerdown', e => splitFocus(e.target), true);
/* ---------- side panel: a tab pinned on the right (Notes, Agenda, NeoMusic, Discord, any app or site) stays there whatever tab is shown on the left ---------- */
let side = null;
function sidePin(t) {
  if (!t) return;
  if (side) side.btn.classList.remove('pinned');
  side = t; t.btn.classList.add('pinned'); t.btn.title = t.title + ' · épinglé sur le côté';
  try { localStorage.neoSide = t.url; } catch {}
  const left = active && active !== t ? active : tabs.find(o => o !== t);
  if (left) splitOpen(left, t); else showTab(t);
  if (splitR > .75 || splitR < .6) { splitR = .68; splitApply(); }  // le côté prend un petit tiers
}
function sideUnpin() {
  if (!side) return;
  side.btn.classList.remove('pinned'); side.btn.title = side.title; side = null;
  try { localStorage.neoSide = ''; } catch {}
  splitClose();
}
function sidePicker() {  // ce qu'on peut mettre sur le côté : quelques applis, puis les onglets ouverts
  const pop = el('div', 'tbPop tabPick px on'), close = () => pop.remove();
  const appBtn = (url, name, icon) => { const b = el('button', 'tbtn tbFull'), ic = el('img'); ic.src = icon || ''; b.append(ic, el('span', '', name)); b.onclick = () => { close(); sidePin(newTab(url, false)); }; return b; };
  pop.append(el('span', 'label', 'Épingler sur le côté'), appBtn('neodex:notes', 'Notes', APPS['neodex:notes'].icon), appBtn('neodex:agenda', 'Agenda', APPS['neodex:agenda'].icon));
  for (const [id, n] of [['neodex.music', 'NeoMusic'], ['neodex.discord', 'Discord']]) { const a = APPS['plugin:' + id]; if (a) pop.append(appBtn('plugin:' + id, n, a.icon)); }  // s'ils sont installés
  const others = tabs.filter(t => t !== side);
  if (others.length) pop.append(el('span', 'label', 'Un onglet ouvert'), ...others.map(t => { const b = el('button', 'tbtn tbFull'), ic = el('img'); ic.src = t.btn.querySelector('img').src; b.append(ic, el('span', '', t.title)); b.onclick = () => { close(); sidePin(t); }; return b; }));
  if (side) { const b = el('button', 'tbtn tbFull', 'Détacher « ' + side.title.slice(0, 24) + ' »'); b.onclick = () => { close(); sideUnpin(); }; pop.append(b); }
  document.body.append(pop);
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('pointerdown', off, true); } }, true));
}
tbPop.append(tbItem('Barre latérale', 'Ctrl+Maj+B', () => sidePicker()));
addEventListener('keydown', e => { if (e.ctrlKey && e.shiftKey && e.code === 'KeyB') { e.preventDefault(); side ? sideUnpin() : sidePicker(); } });
// au démarrage : le côté épinglé la dernière fois revient (une appli de NeoDex, ou un onglet rouvert)
setTimeout(() => { let u = ''; try { u = localStorage.neoSide || ''; } catch {} if (!u || side) return; const t = tabs.find(o => o.url === u) || (/^(neodex|plugin):/.test(u) && APPS[u] ? newTab(u, false) : null); if (t && tabs.length > 1) sidePin(t); }, 2500);
// l'agenda vit sur l'accueil : un onglet Agenda le prend, l'accueil le récupère dès qu'il se réaffiche ou que l'onglet se ferme
const agHome = document.createComment('agenda');
$('agenda').before(agHome);
function agendaTab(inTab) {
  const a = $('agenda'), holder = $('agendaHolder');
  if (inTab && a.parentNode !== holder) holder.append(a);
  if (!inTab && a.parentNode === holder) agHome.after(a);
}
// showing another tab leaves the split view (unless a tab is pinned on the side); switching between the two halves must not send a video to the mini player
{
  const show0 = showTab, close0 = closeTab;
  showTab = t => {
    if (active) active.seen = Date.now();
    if (side && t && t !== side) split = {a: t, b: side};  // le côté épinglé reste à droite
    else if (split && t !== split.a && t !== split.b) split = null;
    if (!t) agendaTab(false);
    if (side && t && t !== side) side.app?.open?.();  // l'appli du côté se remet à jour (l'agenda revient de l'accueil)
    if (split) { const pip = prefs.pip; prefs.pip = false; try { show0(t); } finally { prefs.pip = pip; } } else show0(t);
    splitApply();
    if (fb.bar.classList.contains('on')) findGo(0);
  };
  closeTab = t => {
    if (t === side) { side = null; try { localStorage.neoSide = ''; } catch {} }
    if (t.app === APPS['neodex:agenda']) agendaTab(false);
    if (split && (t === split.a || t === split.b)) split = null;
    close0(t);
    if (side && active && active !== side && !split) split = {a: active, b: side};
    splitApply();
  };
}

/* ---------- dragging a tab: along the bar it changes place, out of the bar its page opens in a second NeoDex window ---------- */
$('bTabs').ondragstart = e => e.preventDefault();  // the icon is an image: dragging it would start the browser's own drag
$('bTabs').addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btab'), t = btn && tabs.find(o => o.btn === btn);
  if (!t || e.button || e.target.closest('button')) return;
  const sx = e.clientX, sy = e.clientY; let moved = false;
  btn.setPointerCapture(e.pointerId);
  btn.onpointermove = m => {
    if (!moved && Math.hypot(m.clientX - sx, m.clientY - sy) < 8) return;
    moved = true; btn.classList.add('drag');
    const over = tabs.find(o => { if (o === t) return false; const r = o.btn.getBoundingClientRect(); return m.clientX >= r.left && m.clientX <= r.right; });
    if (!over) return;
    const i = tabs.indexOf(t), j = tabs.indexOf(over);
    tabs.splice(i, 1); tabs.splice(j, 0, t);
    for (const o of tabs.slice(tabs.indexOf(t) + 1)) $('bTabs').append(o.btn);  // the others move: moving the dragged tab would end the drag
  };
  btn.onpointerup = btn.onpointercancel = m => {
    btn.onpointermove = btn.onpointerup = btn.onpointercancel = null; btn.classList.remove('drag');
    if (!moved) return;
    saveTabs();
    const out = m.clientY > 100 || m.clientY < 0 || m.clientX < 0 || m.clientX > innerWidth;
    if (out && m.type === 'pointerup' && !t.priv) { neo.win2({url: t.url, x: m.screenX, y: m.screenY}); closeTab(t); }  // a private tab stays here: its partition lives in this window
  };
});

/* ---------- memory: a website tab left alone 15 minutes gives its memory back (its page is destroyed), keeps its title, icon and place in the bar,
   and loads again where it was scrolled when it is shown. Tabs playing sound, shown, in the mini player or the split view are left alone. ---------- */
const tabBusy = t => t.app || t.lazy || t === active || t === mini || t === split?.a || t === split?.b;
async function sleepTab(t) {
  let at = null; try { at = await t.v.executeJavaScript('[scrollX, scrollY]'); } catch {}
  if (tabBusy(t)) return;  // shown meanwhile
  t.scroll = Array.isArray(at) ? at.map(n => Math.round(+n || 0)) : null;
  t.v.remove(); t.v.src = t.url; t.lazy = true;
}
setInterval(() => {
  for (const t of tabs) {
    if (tabBusy(t) || Date.now() - (t.seen || 0) < 15 * 60e3) continue;
    const a = tabAudio(t); if (a?.audible) continue;
    sleepTab(t);
  }
}, 60e3);

/* ---------- right-click menu of a tab ---------- */
$('bTabs').addEventListener('contextmenu', e => {
  const btn = e.target.closest('.btab'), t = btn && tabs.find(o => o.btn === btn);
  if (!t) return;
  e.preventDefault();
  document.querySelector('.tabMenu')?.remove();
  const m = el('div', 'tbPop tabMenu px on'), a = tabAudio(t), item = (label, f, ok = true) => { if (!ok) return; const b = el('button', 'tbtn tbFull', label); b.onclick = () => { m.remove(); f(); }; m.append(b); };
  item('Afficher à côté de l\'onglet actif', () => splitOpen(active, t), active && active !== t && !(split && (split.a === t || split.b === t)));
  item('Quitter la vue scindée', splitClose, !!split && (split.a === t || split.b === t) && !side);
  item('Épingler sur le côté', () => sidePin(t), t !== side);
  item('Détacher du côté', sideUnpin, t === side);
  item(a?.muted ? 'Remettre le son' : 'Couper le son', () => tabMute(t), !!a);
  item('Dupliquer l\'onglet', () => newTab(t.url, true, true), !t.app);
  item('Recharger', () => { try { t.v.reload(); } catch {} }, !t.app && !t.lazy);
  item('Inspecter', () => inspectTab(t), !t.app && !t.lazy);
  item('Fermer les autres onglets', () => tabs.filter(o => o !== t).forEach(closeTab), tabs.length > 1);
  item('Fermer', () => closeTab(t));
  m.style.left = Math.min(e.clientX, innerWidth - 260) + 'px'; m.style.top = '42px'; m.style.right = 'auto';
  document.body.append(m);
  setTimeout(() => document.addEventListener('pointerdown', function off(ev) { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('pointerdown', off, true); } }, true));
});

/* ---------- keys (they come from main.js, even when a website has the focus) ---------- */
window.neo?.onKey(k => ({'Ctrl+f': findOpen, 'Ctrl+Shift+N': privateWin, 'Ctrl+Shift+S': splitToggle, 'Ctrl+Shift+F': () => neo.searchOpen(), F12: () => inspectTab()})[k]?.());
// Alt+² (the key under Échap): the open apps and sites, most recently used first; each press with Alt held moves on, letting go of Alt opens it
let altSw = null;
const altEnd = () => { if (!altSw) return; const t = altSw.list[altSw.i]; altSw.box.remove(); clearTimeout(altSw.tm); altSw = null; showTab(t); };
const altStep = d => {
  if (!altSw) {
    const list = [...new Set([...tabMru, null, ...tabs])].filter(t => t === null || tabs.includes(t));
    if (list.length < 2) return;
    altSw = {i: 0, list, box: el('div', 'altSw')}; document.body.append(altSw.box);
  }
  altSw.i = (altSw.i + d + altSw.list.length) % altSw.list.length;
  altSw.box.replaceChildren(...altSw.list.map((t, i) => { const r = el('div', 'altIt' + (i === altSw.i ? ' on' : '')), ic = el('img'); ic.src = t ? (t.app ? t.app.icon : t.btn?.querySelector('img')?.src || '') : 'logo.png'; ic.onerror = () => ic.style.visibility = 'hidden'; r.append(ic, el('span', '', t ? t.title : 'Accueil')); return r; }));
  clearTimeout(altSw.tm); altSw.tm = setTimeout(altEnd, 4000);  // shortcut: the release of Alt missed (the window lost the focus), so it opens by itself after 4 s
};
window.neo?.onKey(k => ({'Alt+Backquote': () => altStep(1), 'Alt+Shift+Backquote': () => altStep(-1), AltUp: altEnd})[k]?.());
