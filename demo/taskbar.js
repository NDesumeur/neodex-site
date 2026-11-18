/* ---------- the page of NeoDex's taskbar (taskbar.html, its own always-on-top window that never takes the focus; taskbar-main.js).
   Click: show the program, or minimize it if it is in front · several windows: their list · right click: pin, close · NEO: back to NeoDex. ---------- */
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
let data = {windows: [], pins: []}, busy = false, pvTimer = 0, pvOpen = false;
neo.onTbpOpen(on => { pvOpen = on; });
async function refresh(p) { if (busy && !p) return; busy = true; try { data = await (p || neo.tbList()); render(); } catch {} busy = false; }
const act = (cmd, h) => refresh(neo.tbAct({cmd, h}));
let lastSig = ''; const seen = new Map();
function render() {
  // nothing changed: the buttons stay (redrawing them under the mouse would lose the hover)
  const sig = JSON.stringify([data.windows.map(w => [w.h, w.t, w.fg, w.min]), data.pins.map(p => p.exe), data.neoFront]); if (sig === lastSig) return; lastSig = sig;
  const groups = new Map();
  for (const w of data.windows) { const k = (w.exe || w.t).toLowerCase(); if (!groups.has(k)) groups.set(k, {exe: w.exe, name: w.name, icon: w.icon, wins: []}); groups.get(k).wins.push(w); }
  for (const p of data.pins) { const k = p.exe.toLowerCase(); if (groups.has(k)) groups.get(k).pin = true; else groups.set(k, {...p, wins: [], pin: true}); }
  // pinned programs first, in the order they were pinned; then the others in the order they first appeared (Windows lists the program just used first: the buttons must not jump around)
  for (const k of [...data.pins.map(p => p.exe.toLowerCase()), ...groups.keys()]) if (!seen.has(k)) seen.set(k, seen.size);
  const order = [...groups].sort(([ka, a], [kb, b]) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || seen.get(ka) - seen.get(kb)).map(x => x[1]);
  $('apps').replaceChildren(...order.map(g => {
    const b = el('button', 'app' + (g.wins.some(w => w.fg && !w.min) ? ' fg' : '') + (g.wins.length ? ' run' : '') + (g.pin ? ' pin' : '') + (g.here === false ? ' gone' : ''));
    if (g.icon) { const i = el('img'); i.src = g.icon; i.alt = ''; b.append(i); } else b.append(el('span', 'letter', (g.name || '?')[0].toUpperCase()));
    if (g.wins.length > 1) b.append(el('span', 'count', String(g.wins.length)));
    b.title = g.wins.length ? '' : g.name + (g.here === false ? ' (introuvable sur ce PC)' : ' · cliquer pour lancer');  // open programs: the preview says it
    b.onmouseenter = () => { if (!g.wins.length) return; clearTimeout(pvTimer); pvTimer = setTimeout(() => { const r = b.getBoundingClientRect(); neo.tbPreview({g, x: r.left + r.width / 2}); }, pvOpen ? 60 : 400); };
    b.onmouseleave = () => { clearTimeout(pvTimer); neo.tbPreviewHide(); };
    b.onclick = () => {
      if (!g.wins.length) return neo.tbLaunch(g.exe);
      if (g.wins.length > 1) return neo.tbMenu({g, kind: 'list'});
      neo.tbPreviewHide(0); const w = g.wins[0]; act(w.fg && !w.min ? 'min' : 'focus', w.h);
    };
    b.oncontextmenu = e => { e.preventDefault(); neo.tbMenu({g, kind: 'ctx'}); };
    return b;
  }));
  $('start').classList.toggle('front', !!data.neoFront);
}
$('start').onclick = () => neo.tbHome().then(() => setTimeout(refresh, 300));
$('hide').onclick = () => neo.tbMode('off');
const tick = () => { const d = new Date(); $('clock').firstChild.textContent = d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}); $('clock').lastChild.textContent = d.toLocaleDateString('fr-FR', {weekday: 'short', day: '2-digit', month: '2-digit'}); };
tick(); setInterval(() => document.hidden || tick(), 1000);  // rien à redessiner quand NeoDex est caché
refresh(); setInterval(() => document.hidden || refresh(), 1200);
neo.onTbRefresh(() => refresh());
const centerX = b => { const r = b.getBoundingClientRect(); return r.left + r.width / 2; };
$('start').oncontextmenu = e => { e.preventDefault(); neo.tbStartMenu({x: centerX($('start'))}); };
// the sound: the speaker shows the general volume; click: the sound panel; wheel: louder / quieter
let master = null;
const volLevel = m => !m || m.mute || m.volume < .01 ? 0 : m.volume < .34 ? 1 : m.volume < .67 ? 2 : 3;
let volShown = -1; const volIcon = m => { const l = volLevel(m); if (l !== volShown) { volShown = l; $('vol').replaceChildren(TBI.sound(l)); } };
async function volRefresh() { try { master = (await neo.audioState()).master; volIcon(master); $('vol').title = 'Son : ' + Math.round(master.volume * 100) + ' %' + (master.mute ? ' (coupé)' : '') + ' · molette : volume'; } catch { volIcon({volume: 1}); } }
$('vol').onclick = () => neo.tbPanel({kind: 'volume', x: centerX($('vol'))});
$('clock').onclick = () => neo.tbPanel({kind: 'calendar', x: centerX($('clock'))});
$('net').onclick = () => neo.tbPanel({kind: 'net', x: centerX($('net'))});
// the network button: Wi-Fi, cable or nothing (main side: the connections that have an address)
let netShown = '';
const netIcon = async () => {
  const k = navigator.onLine ? await neo.tbNetKind().catch(() => 'cable') : 'off'; if (k === netShown) return; netShown = k;
  $('net').replaceChildren(k === 'cable' ? TBI.cable() : TBI.wifi(k === 'off'));
  $('net').title = (k === 'off' ? 'Pas de connexion' : k === 'wifi' ? 'Wi-Fi' : 'Câble') + ' · Réseau et Bluetooth';
};
// the battery (laptops only): its level, a bolt while charging, the percentage next to it
neo.tbHasBattery?.().then(has => has && navigator.getBattery?.().then(b => {
  const show = () => { const p = Math.round(b.level * 100); $('bat').replaceChildren(TBI.battery(b.level, b.charging), Object.assign(document.createElement('small'), {textContent: p + ' %'}));
    $('bat').title = 'Batterie : ' + p + ' %' + (b.charging ? ' · en charge' : b.dischargingTime < Infinity ? ' · environ ' + Math.round(b.dischargingTime / 60) + ' min restantes' : ''); $('bat').classList.toggle('low', !b.charging && p <= 15); $('bat').hidden = false; };
  ['levelchange', 'chargingchange', 'dischargingtimechange'].forEach(k => b.addEventListener(k, show)); show();
}));
addEventListener('online', netIcon); addEventListener('offline', netIcon); netIcon(); setInterval(() => document.hidden || netIcon(), 10000);
$('vol').onwheel = e => { if (!master) return; const v = Math.min(1, Math.max(0, master.volume + (e.deltaY < 0 ? .02 : -.02))); master.volume = v; volIcon(master); neo.audioSet({cmd: 'volume', pid: -1, value: v}).then(volRefresh); };
volRefresh(); setInterval(() => document.hidden || volRefresh(), 2500);
// the theme's colours, from the main window
neo.onTbTheme(t => { for (const [k, v] of Object.entries(t)) if (k === 'style') document.documentElement.dataset.style = v; else if (k === 'css') (document.getElementById('plugCss') || document.head.appendChild(Object.assign(document.createElement('style'), {id: 'plugCss'}))).textContent = v; else document.documentElement.style.setProperty(k, v); });  // css: the taskbar style of a plugin's theme (themes[].taskbar), already cleaned by plugins-main.js

// NeoMe, the pet, walking tiny in the free part of the bar (between the programs and the tray); pet.js decides when it is here
// and its mood. Click: a hop; double click: back to NeoDex's home page.
let PETIMG = {};  // les images de NeoMe, envoyées par son plugin
const PETF = {idle: 1, content: 2, sleep: 4, music: 9, wink: 10, sad: 8, bored: 21, cool: 15, curious: 22, hello: 25, love: 3, think: 17};
const lane = el('div'), tpi = el('img'); lane.id = 'petLane'; lane.style.display = 'none'; tpi.alt = ''; tpi.draggable = false; lane.append(tpi); document.body.append(lane);
neo.onTbPetImgs(m => { PETIMG = m || {}; tpFace = ''; });
let tp = {on: false, mood: 'idle'}, tpx = 0, tpDir = 1, tpPause = 0, tpFace = '', tpAnim = '', tpUntil = 0;
const tpShow = (face, anim) => {
  if (face !== tpFace) { tpi.src = PETIMG[PETF[face] || 1] || ''; tpFace = face; }
  if (anim !== tpAnim) { tpi.classList.remove('tp-' + tpAnim); void tpi.offsetWidth; tpi.classList.add('tp-' + anim); tpAnim = anim; }
};
neo.onTbPet(d => { tp = d || {on: false}; lane.style.display = tp.on ? '' : 'none'; if (tp.on) { tpShow('hello', 'hop'); tpUntil = Date.now() + 1500; } });
tpi.onclick = () => { tpShow('content', 'hop'); tpUntil = Date.now() + 900; neo.tbPetPoke(); };
tpi.ondblclick = () => neo.tbPetHome();
tpi.title = 'NeoMe · double-clic : le remettre sur l’accueil de NeoDex';
setInterval(() => {
  if (!tp.on || document.hidden) return;
  // the lane: from the last program's button to the tray
  const last = $('apps').lastElementChild, x0 = (last ? last.getBoundingClientRect().right : $('apps').getBoundingClientRect().left) + 12, x1 = $('tray').getBoundingClientRect().left - 8;
  Object.assign(lane.style, {left: x0 + 'px', width: Math.max(0, x1 - x0) + 'px'});
  const w = tpi.offsetWidth || 42, max = Math.max(0, x1 - x0 - w), now = Date.now();
  if (now < tpUntil) return;
  if (tp.mood === 'sleep' || tp.mood === 'music' || tp.mood === 'sad') { tpShow(tp.mood, tp.mood === 'music' ? 'dance' : tp.mood === 'sleep' ? 'sleep' : 'walk'); if (tp.mood !== 'sad') return; }
  // walking along, turning at the ends; now and then it stops and makes a face
  if (now < tpPause) return;
  if (Math.random() < .006) { tpPause = now + 1800 + Math.random() * 2500; tpShow(['wink', 'cool', 'curious', 'think', 'content', 'love'][Math.random() * 6 | 0], 'hop'); return; }
  tpx += tpDir * (tp.mood === 'sad' ? .5 : 1.1);
  if (tpx <= 0 || tpx >= max) { tpDir = -tpDir; tpx = Math.max(0, Math.min(max, tpx)); }
  tpi.style.left = Math.round(tpx) + 'px'; tpi.classList.toggle('left', tpDir < 0);
  tpShow(tp.mood === 'sad' ? 'sad' : tp.mood === 'bored' ? 'bored' : 'idle', 'walk');
}, 33);
// the sync between PCs: a little square near the clock, only when a sync folder is chosen
const syncDot = async () => {
  const s = await neo.syncStatus().catch(() => null), d = $('sync'); d.hidden = !s?.file; if (d.hidden) return;
  d.className = s.error ? 'err' : s.pending ? 'wait' : '';
  d.title = s.error ? 'Synchro en erreur : ' + s.error : s.pending ? 'Synchro en cours…' : 'Synchro à jour' + (s.last ? ' (' + new Date(s.last).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) + ')' : '');
};
syncDot(); setInterval(() => document.hidden || syncDot(), 3000);
