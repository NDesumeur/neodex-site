// part of the NeoDex page (index.html): classic script sharing its global scope, loaded in the order of the page
/* ---------- integrated browser (Electron window only: window.neo comes from preload.js) ---------- */
const tabs = [];
let pluginTabsWanted = [];  // les onglets de plugins de la dernière session : rouverts quand les plugins sont enregistrés (plugins.js)
let active = null;  // null = the NeoDex home page
let tabMru = [null];  // the tabs from the last one shown to the oldest (null: home), for Alt+² (tabs2.js)
const SEARCH = {google: 'https://www.google.com/search?q=', duckduckgo: 'https://duckduckgo.com/?q=', bing: 'https://www.bing.com/search?q=', qwant: 'https://www.qwant.com/?q=', brave: 'https://search.brave.com/search?q='};
let prefs = {search: 'google', openAtLogin: true, fullscreen: true, tabs: []};  // real values come from settings.json (main.js)
const engine = () => SEARCH[prefs.search] || SEARCH.google, homeUrl = () => new URL(engine()).origin;
const toUrl = q => /^[a-z]+:\/\//i.test(q) ? q : /^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(q) ? 'https://' + q : engine() + encodeURIComponent(q);
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const W2 = new URLSearchParams(location.search).get('w2');  // a second window, made by dragging a tab out: it never touches the saved tabs
const saveTabs = () => window.neo && !W2 && neo.setSettings({tabs: tabs.filter(t => !t.priv).map(t => t.url)});  // reopened at next launch (not the private tabs)
const onView = f => { try { if (active) f(active.v); } catch {} };  // webview methods throw until it is attached
// show = false (tabs reopened at launch): the site only loads when its tab is first opened, so videos don't all start at once
function newTab(url, show = true, fresh = false, priv = '') {  // fresh: a new tab even if the site is already open (« + », Ctrl+T, Dupliquer, links opened in a new tab); priv: a private tab's in-memory session (main.js private:open)
  url = typeof pluginFor === 'function' ? pluginFor(url) : url;  // l'ancienne appli de NeoDex ouvre son plugin quand il est installé
  if (/^neodex:/.test(url) && !APPS[url]) { toast('Cette appli est un plugin : installe-la depuis NeoStore', true); url = 'neodex:store'; }
  const app = APPS[url], open = app && tabs.find(o => o.app && (o.app === app || o.url === url));  // a plugin's APPS entry is rebuilt on each refresh
  if (open) { if (show) showTab(open); return open; }  // a built-in app has a single tab
  const same = !app && !fresh && !priv && isWeb(url) && tabs.find(o => !o.app && !o.priv && hostOf(o.url) === hostOf(url));  // a site too: its tab is reused
  if (same) { if (show && same.url !== url) { same.url = url; same.v.src = url; } if (show) showTab(same); return same; }
  const v = app ? $(app.view) : document.createElement('webview'), t = {v, url, app, priv, title: app ? app.name : hostOf(url) || url, lazy: !show && !app};
  const b = el('div', 'btab' + (priv ? ' priv' : '')), ic = el('img'), tt = el('span', '', show && !app ? 'Chargement…' : t.title), x = el('button', 'x', 'X');
  ic.onerror = () => ic.style.visibility = 'hidden';
  ic.src = app ? app.icon : t.lazy ? iconSrc(url) : '';
  b.append(ic, tt, x); t.btn = b; b.title = t.title;
  b.onclick = () => showTab(t);
  b.onauxclick = e => e.button === 1 && closeTab(t);
  x.onclick = e => { e.stopPropagation(); closeTab(t); };
  if (!app) {
    v.setAttribute('partition', priv || 'persist:web');  // logins kept between launches; a private tab keeps nothing
    v.setAttribute('allowpopups', '');
    v.src = url;
    v.addEventListener('page-title-updated', e => { t.title = tt.textContent = b.title = e.title; });
    // le son de l'onglet : par événement (avant, chaque onglet était interrogé toutes les 0,8 s par un appel qui bloque la page)
    v.addEventListener('media-started-playing', () => { t.audible = true; tabSpeakers(); });
    v.addEventListener('media-paused', () => { t.audible = false; tabSpeakers(); });
    v.addEventListener('did-navigate', () => { if (t.audible) { t.audible = false; tabSpeakers(); } });
    v.addEventListener('page-favicon-updated', e => { ic.style.visibility = ''; ic.src = e.favicons[0] || ''; });
    const nav = e => { t.url = e.url; if (active === t) { $('bUrl').value = e.url; updateShield(); } saveTabs(); };
    v.addEventListener('did-navigate', nav);
    v.addEventListener('did-navigate-in-page', e => e.isMainFrame && nav(e));
    // un PDF ouvert dans un onglet web (le lecteur de Chromium) : le plugin qui ouvre les PDF le prend, l'onglet revient à sa page (ou se ferme)
    v.addEventListener('did-finish-load', () => typeof pluginsOpening === 'function' && pluginsOpening('x.pdf').length && v.executeJavaScript('document.contentType').then(ct => {
      if (ct !== 'application/pdf') return;
      neo.pdfFetch({wcId: v.getWebContentsId(), url: v.getURL()});
      if (v.canGoBack()) v.goBack(); else closeTab(t);
    }, () => {}));
    // une vidéo en plein écran : le curseur disparaît après 2 s sans bouger (shortcut: page principale seulement, pas dans une iframe ; à étendre aux frames si un site le demande)
    v.addEventListener('enter-html-full-screen', () => { document.body.classList.add('vfs'); v.executeJavaScript(`(() => { if (window.__neoCur) return; window.__neoCur = 1; let t; const s = document.createElement('style'); s.textContent = ':fullscreen, :fullscreen * { cursor: none !important }';
      const wake = () => { s.remove(); clearTimeout(t); if (document.fullscreenElement) t = setTimeout(() => document.documentElement.append(s), 2000); };
      addEventListener('mousemove', wake, true); addEventListener('mousedown', wake, true); document.addEventListener('fullscreenchange', wake); wake(); })()`).catch(() => {}); });
    v.addEventListener('leave-html-full-screen', () => document.body.classList.remove('vfs'));
    if (!t.lazy) $('bViews').append(v);  // a webview starts loading when it enters the page
  }
  $('bTabs').append(b); tabs.push(t);
  if (show) sfx('open');
  if (show) showTab(t);
  saveTabs();
  return t;
}
// Mini player: a video playing in the tab being left goes on in a small box in the corner, inside NeoDex
// (a Windows picture-in-picture window takes the focus away from NeoDex when clicked). The tab's own webview is
// shrunk, never moved (moving a webview reloads it), and the page shows only that video while it is small.
const MINI_IN = `(() => {
  const v = [...document.querySelectorAll('video')].find(v => !v.paused && !v.ended && v.readyState > 2 && v.videoWidth);
  if (!v) return false;
  if (!document.getElementById('neoMiniCss')) document.head.append(Object.assign(document.createElement('style'), {id: 'neoMiniCss', textContent:
    'html.neoMini{overflow:hidden!important} html.neoMini body *{visibility:hidden!important}' +
    'html.neoMini video[data-neo-mini]{visibility:visible!important;position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;' +
    'max-width:none!important;z-index:2147483647!important;object-fit:contain!important;background:#000!important;transform:none!important;margin:0!important}' +
    // a transform or contain on a parent (Twitch) would keep the fixed video inside its box, off screen, and the site would pause it
    'html.neoMini [data-neo-mini-up]{transform:none!important;contain:none!important;filter:none!important;perspective:none!important;will-change:auto!important;backdrop-filter:none!important}'}));
  v.dataset.neoMini = ''; for (let p = v.parentElement; p; p = p.parentElement) p.dataset.neoMiniUp = '';
  document.documentElement.classList.add('neoMini'); return true; })()`;
const MINI_OUT = `document.documentElement.classList.remove('neoMini'); document.querySelectorAll('video[data-neo-mini]').forEach(v => delete v.dataset.neoMini); document.querySelectorAll('[data-neo-mini-up]').forEach(e => delete e.dataset.neoMiniUp)`;
const MINI_PAUSE = `document.querySelectorAll('video').forEach(v => v.pause())`;
// a tab put to sleep (tabs2.js) wakes up where it was scrolled
function wakeTab(t, into) {
  t.lazy = false; into.append(t.v);
  const s = t.scroll; t.scroll = null;
  if (s && (s[0] || s[1])) t.v.addEventListener('did-finish-load', () => t.v.executeJavaScript(`scrollTo(${s[0]}, ${s[1]})`).catch(() => {}), { once: true });
}
const inView = (t, code) => { try { if (t && !t.app && !t.lazy) return t.v.executeJavaScript(code).catch(() => false); } catch {} return Promise.resolve(false); };
let mini = null;  // the tab shown in the mini player
function unMini(pause) {
  if (!mini) return;
  const t = mini; mini = null;
  t.v.classList.remove('mini'); document.body.classList.remove('hasMini');
  inView(t, pause ? MINI_PAUSE + ';' + MINI_OUT : MINI_OUT);
}
function toMini(t) {
  inView(t, MINI_IN).then(ok => {
    if (!ok || active === t || !tabs.includes(t)) return;
    unMini(true);  // one mini player at a time: the previous video stops
    mini = t; placeMini(); t.v.classList.add('mini'); document.body.classList.add('hasMini');
    $('mbTitle').textContent = t.title; miniPoll();
  });
}
// mini player controls: they act on the video marked by MINI_IN inside the tab's page
const miniDo = code => inView(mini, `(v => v ? (${code}) : null)(document.querySelector('video[data-neo-mini]'))`);
const miniToggle = () => miniDo('v.paused ? v.play() : v.pause(), 0');
const tc = s => isFinite(s) ? (s / 3600 >= 1 ? (s / 3600 | 0) + ':' : '') + String((s / 60 | 0) % 60).padStart(s >= 600 ? 2 : 1, '0') + ':' + String(s % 60 | 0).padStart(2, '0') : 'direct';
console.assert(tc(75) === '1:15' && tc(3725) === '1:02:05' && tc(Infinity) === 'direct', 'tc');
let miniPollT;
async function miniPoll() {  // refreshes the controls 3 times a second while the mini player is shown
  clearTimeout(miniPollT);
  if (!mini) return;
  miniPollT = setTimeout(miniPoll, 330);
  const s = await miniDo(`[v.paused, v.currentTime, v.duration, v.muted, v.volume, !!document.querySelector('.ytp-next-button:not([aria-disabled="true"])')]`);
  if (!s || !mini) return;  // closed while the page answered
  const [paused, cur, dur, muted, vol, next] = s, live = !isFinite(dur) || dur > 864000;  // a live stream (Twitch gives 2^30 s): nothing to seek
  $('miniBox').classList.toggle('live', live);
  $('mbPlay').innerHTML = pixIcon(PIX[paused ? 'play' : 'pause']);
  $('mbMute').innerHTML = pixIcon(PIX[muted || !vol ? 'mute' : 'sound']);
  $('mbSeek').firstChild.style.width = (dur && !live ? cur / dur * 100 : 100) + '%';
  $('mbTime').textContent = live ? 'EN DIRECT' : tc(cur) + ' / ' + tc(dur);
  $('mbVol').textContent = muted ? 'MUET' : 'VOL ' + Math.round(vol * 100) + ' %';
  $('mbNext').style.display = next ? '' : 'none';
  $('mbTitle').textContent = mini.title;
}
const act = (id, f) => $(id).onclick = e => { e.stopPropagation(); f(); setTimeout(miniPoll, 60); };
act('mbPlay', miniToggle);
act('mbRew', () => miniDo('v.currentTime = Math.max(0, v.currentTime - 10), 0'));
act('mbFwd', () => miniDo('v.currentTime = v.currentTime + 10, 0'));
act('mbNext', () => miniDo(`document.querySelector('.ytp-next-button')?.click(), 0`));
act('mbMute', () => miniDo('v.muted = !v.muted, 0'));
act('mbBack', () => mini && showTab(mini));
act('miniClose', () => unMini(true));
$('mbSeek').onclick = e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); miniDo(`isFinite(v.duration) ? (v.currentTime = v.duration * ${(e.clientX - r.left) / r.width}) : 0, 0`); setTimeout(miniPoll, 60); };
$('miniBox').onwheel = e => { e.preventDefault(); miniDo(`v.muted = false, v.volume = Math.min(1, Math.max(0, v.volume ${e.deltaY < 0 ? '+' : '-'} .05)), 0`); setTimeout(miniPoll, 60); };
$('miniBox').ondblclick = e => { if (!e.target.closest('button, #mbSeek, #mbResize')) mini && showTab(mini); };
// position and size (kept 16:9), remembered between launches; dragging the box moves it, its top-left corner resizes it
let mg = (() => { try { return JSON.parse(localStorage.neoMini) || {}; } catch { return {}; } })();
function placeMini() {
  const w = Math.round(Math.min(Math.max(mg.w || 448, 260), innerWidth * .7)), h = Math.round(w * 9 / 16);
  const H = document.body.clientHeight;
  mg = {w, x: Math.round(Math.min(Math.max(mg.x ?? innerWidth - w - 24, 0), innerWidth - w)), y: Math.round(Math.min(Math.max(mg.y ?? H - h - 24, 43), H - h))};
  const st = document.body.style;
  st.setProperty('--mx', mg.x + 'px'); st.setProperty('--my', mg.y + 'px'); st.setProperty('--mw', w + 'px'); st.setProperty('--mh', h + 'px');
}
$('miniBox').onpointerdown = e => {
  if (e.button || e.target.closest('button, #mbSeek')) return;
  const box = $('miniBox'), sx = e.clientX, sy = e.clientY, o = {...mg}, resize = e.target.id === 'mbResize';
  let moved = false;
  box.setPointerCapture(e.pointerId);
  box.onpointermove = m => {
    const dx = m.clientX - sx, dy = m.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < 4) return;  // under 4 px it is a click (pause / play), not a drag
    moved = true; box.classList.add('drag');
    if (resize) { const w = Math.min(Math.max(260, o.w - dx), innerWidth * .7); mg = {w, x: o.x + o.w - w, y: o.y + (o.w - w) * 9 / 16}; }  // the bottom-right corner stays put
    else mg = {w: o.w, x: o.x + dx, y: o.y + dy};
    placeMini();
  };
  box.onpointerup = () => {
    box.onpointermove = box.onpointerup = null; box.classList.remove('drag');
    if (moved) { try { localStorage.neoMini = JSON.stringify(mg); } catch {} }
    else if (!resize) { miniToggle(); setTimeout(miniPoll, 60); }
  };
};
addEventListener('resize', () => mini && placeMini());
function showTab(t) {
  if (active !== t) {
    if (t && t === mini) unMini();
    if (prefs.pip && active && active !== mini) toMini(active);
  }
  active = t; tabMru = [t, ...tabMru.filter(x => x !== t)].slice(0, 30);
  if (t?.lazy) wakeTab(t, $('bViews'));
  document.body.classList.toggle('browsing', !!t);
  document.body.classList.toggle('appTab', !!t?.app);
  t?.app?.open?.();
  $('bHomeTab').classList.toggle('on', !t);
  tabs.forEach(o => { o.btn.classList.toggle('on', o === t); o.v.classList.toggle('on', o === t); });
  if (t) { $('bUrl').value = t.url; t.v.focus(); updateShield(); }
  if (typeof pluginTabChange === 'function') pluginTabChange();
}
function closeTab(t) {
  const i = tabs.indexOf(t);
  if (t === mini) unMini(true);
  if (typeof pluginTabClosed === 'function') pluginTabClosed(t);
  sfx('close');
  tabs.splice(i, 1); t.btn.remove();
  if (t.app) t.v.classList.remove('on'); else t.v.remove();  // a built-in app's view stays in the page for next time
  if (t.priv && !tabs.some(o => o.priv === t.priv)) neo.privateDone(t.priv);  // the last private tab: its cookies and cache are wiped
  if (active === t) showTab(tabs[i] || tabs[i - 1] || null);
  saveTabs();
}
if (window.neo) {
  document.body.classList.add('electron');
  neo.onOpenTab((url, priv) => newTab(url, true, true, priv || ''));  // a pop-up of a private tab stays private
  neo.onPopupBlocked?.(h => toast('Pop-up bloquée : ' + h));
  const cycle = d => { const all = [null, ...tabs]; showTab(all[(all.indexOf(active) + d + all.length) % all.length]); };
  const focusUrl = () => { if (active) { $('bUrl').focus(); $('bUrl').select(); } };
  neo.onKey(k => ({
    'Ctrl+t': () => { newTab(homeUrl(), true, true); setTimeout(focusUrl, 50); },
    'Ctrl+w': () => active && closeTab(active),
    'Ctrl+l': focusUrl,
    'Ctrl+h': () => openHistory(),
    F9: () => $('setContemplate').click(),
    'Ctrl+Tab': () => cycle(1), 'Ctrl+Shift+Tab': () => cycle(-1),
    'Alt+ArrowLeft': () => onView(v => v.canGoBack() && v.goBack()),
    'Alt+ArrowRight': () => onView(v => v.canGoForward() && v.goForward()),
    'F5': () => active ? onView(v => v.reload()) : location.reload(),
    'Ctrl+r': () => active ? onView(v => v.reload()) : location.reload(),
  })[k]?.());
  $('bHomeTab').onclick = () => showTab(null);
  $('bNew').onclick = () => { newTab(homeUrl(), true, true); setTimeout(focusUrl, 50); };
  neo.getSettings().then(s => {
    prefs = s; applyTheme(s.bgTheme); setScene(s.bgScene); applyCursor(s.pixelCursor); if (typeof applyLayout === 'function') applyLayout();
    if (W2) newTab(W2); else if (s.restoreTabs) { s.tabs.filter(u => !/^plugin:/.test(u)).forEach(u => newTab(u, false)); pluginTabsWanted = s.tabs.filter(u => /^plugin:/.test(u)); if (typeof pluginRestoreTabs === 'function') pluginRestoreTabs(); }  // reopen last session's tabs, stay on home
    loadWeather();
    // each built-in app's tile is added once (next to the Notes tile); deleting one afterwards is respected
    const TILES = Object.fromEntries(Object.entries(APPS).filter(([u]) => !/^plugin:/.test(u)).map(([u, a]) => [u, a.name]));
    const missing = Object.keys(TILES).filter(u => !s.appTiles.includes(u) && !(u === 'neodex:notes' && s.notesTile));
    if (missing.length) linksReady.then(() => {
      const cat = links.find(l => APPS[l.target])?.cat || 'Système';
      for (const u of missing) if (!links.some(l => l.target === u)) links.push({name: TILES[u], target: u, cat: APPS[u]?.cat === 'Jeux' ? 'Jeux' : cat});  // games go to « Jeux »
      save(); render();
      neo.setSettings({appTiles: Object.keys(TILES)});
    }, () => {});
    linksReady.then(() => { const l = links.find(l => l.target === 'neodex:snake' && l.name === 'Serpentin'); if (l) { l.name = 'Snuke'; save(); render(); } }, () => {});  // the game was renamed
    if (!s.neodleCat) linksReady.then(() => {
      for (const l of links) if (APPS[l.target]?.cat === 'NeoDle') l.cat = 'NeoDle';
      save(); render(); neo.setSettings({neodleCat: true});
    }, () => {});
  });
  $('wMin').onclick = () => neo.win('min');
  // fullscreen: pressing the empty part of the tab bar and moving starts a drag, a double-click leaves fullscreen
  neo.onFullscreen(on => document.body.classList.toggle('fs', on));
  $('tabstrip').addEventListener('pointerdown', e => {
    if (e.button || e.target.closest('button, .btab')) return;
    const bar = $('tabstrip'), sx = e.clientX, sy = e.clientY;
    let dragging = false;
    bar.setPointerCapture(e.pointerId);
    bar.onpointermove = m => { if (!dragging && Math.hypot(m.clientX - sx, m.clientY - sy) > 5) { dragging = true; neo.win('fsdrag'); } };
    bar.onpointerup = bar.onpointercancel = () => {
      bar.onpointermove = bar.onpointerup = bar.onpointercancel = null;
      if (dragging) neo.win('fsdragEnd');
    };
  });
  $('tabstrip').addEventListener('dblclick', e => { if (!e.target.closest('button, .btab')) neo.win('max'); });
  $('wMax').onclick = () => neo.win('max');
  // the cross asks first: keep in the background (next to the clock) or really quit
  const closeQuit = () => $('quitModal').classList.remove('on');
  $('wClose').onclick = () => { if (W2) return neo.win('quit'); $('quitModal').classList.add('on'); $('qHide').focus(); };
  $('qHide').onclick = () => { closeQuit(); neo.win('hide'); };
  $('qQuit').onclick = () => neo.win('quit');
  $('qCancel').onclick = $('qCancelX').onclick = closeQuit;
  $('quitModal').onclick = e => { if (e.target.id === 'quitModal') closeQuit(); };
  $('quitModal').onkeydown = e => { if (e.key === 'Escape') closeQuit(); };

  // history: grouped by day, searchable, newest first
  let history = [];
  const dayLabel = t => { const d = ymd(new Date(t)), today = ymd(new Date()); return d === today ? "AUJOURD'HUI" : d === ymd(addDays(new Date(), -1)) ? 'HIER' : new Date(t).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}).toUpperCase(); };
  const renderHistory = () => {
    const q = $('hSearch').value.trim().toLowerCase(), list = $('histList');
    const rows = history.filter(h => !q || (h.title + ' ' + h.url).toLowerCase().includes(q)).slice(0, 400);  // shortcut: shows the 400 newest matches, search narrows the rest
    list.innerHTML = '';
    let day = '';
    for (const h of rows) {
      if (dayLabel(h.t) !== day) { day = dayLabel(h.t); list.append(el('div', 'hday', day)); }
      const r = el('div', 'titem'), ic = el('img'), x = el('button', 'x', 'X'), at = new Date(h.t);
      ic.src = iconSrc(h.url); ic.onerror = () => ic.style.visibility = 'hidden';
      x.title = "Retirer de l'historique";
      x.onclick = async e => { e.stopPropagation(); await neo.deleteHistory(h.t); history = history.filter(o => o !== h); renderHistory(); };
      r.append(el('span', 'tt', toHM(at.getHours() * 60 + at.getMinutes())), ic, el('span', 'tn', h.title), el('span', 'host', hostOf(h.url)), x);
      r.title = h.url; r.onclick = () => { $('histModal').classList.remove('on'); newTab(h.url); };
      list.append(r);
    }
    if (!rows.length) list.append(el('div', 'hint', q ? 'Aucun résultat' : 'Historique vide'));
  };
  const openHistory = async () => { history = await neo.getHistory(); $('hSearch').value = ''; renderHistory(); $('histModal').classList.add('on'); $('hSearch').focus(); };
  const closeHistory = () => $('histModal').classList.remove('on');
  $('bHistory').onclick = openHistory;
  $('hSearch').oninput = renderHistory;
  $('hClose').onclick = closeHistory;
  $('histModal').onclick = e => { if (e.target.id === 'histModal') closeHistory(); };
  $('histModal').onkeydown = e => { if (e.key === 'Escape') closeHistory(); };
  $('hClear').onclick = async () => { if (!await nbConfirm("Effacer tout l'historique de navigation ?")) return; await neo.clearHistory(); history = []; renderHistory(); };

  // the ad blocker is a plugin (« Bloqueur de pubs ») : called on each new page or tab, its button in the address bar replaces this
  window.updateShield = () => {};

  $('bSettings').onclick = () => loadScript('settings').then(() => openSettings());  // settings.js, fetched on first opening
  // settings changed on another PC (theme, decor, sounds, search engine, blocked sites…)
  neo.onSettingsChanged(async () => {
    prefs = await neo.getSettings();
    applyTheme(prefs.bgTheme); setScene(prefs.bgScene); applyCursor(prefs.pixelCursor); updateShield(); loadWeather(); applyLayout(); renderWidgets();
    if ($('setModal').classList.contains('on')) openSettings();
  });
  // another PC changed a shared file: reload that part (unless the change is this PC's own save)
  neo.onDataChanged(async name => {
    const d = await api(name).catch(() => undefined);
    if (d === undefined) return;
    const same = cur => JSON.stringify(cur) === JSON.stringify(d);
    let changed = true;
    if (name === 'links' && !same(links)) { links = d ?? []; if (typeof pluginTilesAgain === 'function') pluginTilesAgain(); else render(); }  // la synchro d'un autre PC ne doit pas faire disparaître les tuiles des plugins
    else if (name === 'agenda' && !same(agenda)) { agenda = {events: [], ...d}; renderAgenda(); for (const h of pluginHooks.values()) h.agendaChanged?.(); }  // les plugins remettent leurs événements
    else if (name === 'notes' && !notesTimer && !same(notes)) { const id = curNote?.id; notes = d ?? []; openNote(notes.find(n => n.id === id) || notes[0] || null); }
    else changed = false;
    if (changed) toast('Mis à jour depuis un autre PC');
  });
  // downloads panel
  const dls = new Map();  // id -> last known state
  const mb = b => (b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',') + ' Mo';
  const renderDownloads = () => {
    const all = [...dls.values()].reverse(), running = all.filter(d => d.state === 'progressing').length;
    $('bDownloads').textContent = 'TÉLÉCHARGEMENTS' + (running ? ' (' + running + ')' : '');
    $('dlList').replaceChildren(...(all.length ? all.map(d => {
      const r = el('div', 'dl'), bar = el('div', 'dlBar'), fill = el('i'), info = el('div', 'dlInfo');
      fill.style.width = (d.total ? d.received / d.total * 100 : d.state === 'completed' ? 100 : 0) + '%';
      bar.append(fill);
      info.append(el('span', '', {progressing: mb(d.received) + (d.total ? ' / ' + mb(d.total) : ''), completed: 'Terminé · ' + mb(d.received), cancelled: 'Annulé', interrupted: 'Échec'}[d.state]), el('span', '', d.scan ? ' · ' + {wait: 'vérification…', clean: 'vérifié', suspect: 'suspect', danger: 'dangereux', unknown: 'non vérifié'}[d.scan] : ''), el('span', 'sp'));
      const act = (label, f) => { const b = el('button', '', label); b.onclick = f; info.append(b); };
      if (d.state === 'progressing') act('ANNULER', () => neo.cancelDownload(d.id));
      if (d.state === 'completed' && !d.gone) { act('OUVRIR', () => viewFile(d.path)); act('DOSSIER', () => neo.showFile(d.path)); }
      if (d.gone) info.append(el('span', '', ' · fichier déplacé ou supprimé'));
      r.append(el('div', 'tn', d.name), bar, info);
      return r;
    }) : [el('div', 'hint', "Aucun téléchargement pour l'instant. Ils vont directement dans ton dossier Téléchargements.")]));
  };
  neo.onDownload(d => {
    const before = dls.get(d.id);
    dls.set(d.id, d);
    if (!before) $('dlPanel').classList.add('on');
    if (d.state === 'completed' && before?.state === 'progressing') toast('Téléchargé : ' + d.name);
    renderDownloads();
  });
  $('bDownloads').onclick = () => { $('dlPanel').classList.toggle('on'); renderDownloads(); };
  $('dlClear').onclick = () => { for (const [id, d] of dls) if (d.state !== 'progressing') dls.delete(id); neo.downloadsForget(); renderDownloads(); };
  $('dlFolder').onclick = () => neo.downloadsFolder();
  neo.downloadsList().then(l => { for (const d of l.reverse()) if (!dls.has(d.id)) dls.set(d.id, d); renderDownloads(); }).catch(() => {});  // ceux des fois précédentes
  document.addEventListener('mousedown', e => { if (!e.target.closest('#dlPanel, #bDownloads')) $('dlPanel').classList.remove('on'); });
  $('bBack').onclick = () => onView(v => v.canGoBack() && v.goBack());
  $('bFwd').onclick = () => onView(v => v.canGoForward() && v.goForward());
  $('bReload').onclick = () => onView(v => v.reload());
  $('bExt').onclick = () => active && api('open', {target: active.url}).catch(e => toast(e.message, true));
  $('bUrl').onkeydown = e => {
    if (e.key === 'Escape') { e.target.value = active?.url || ''; active?.v.focus(); }
    if (e.key !== 'Enter' || !e.target.value.trim()) return;
    const url = toUrl(e.target.value.trim());
    active ? onView(v => v.loadURL(url)) : newTab(url);
    active?.v.focus();
  };
}

const linksReady = api('links').then(d => {  // rejects if the links could not be read: nothing may then save over them
  links = d ?? [  // first launch: one link; the system apps (Système) and the plugins (NeoApps) add their own tiles
    {name: 'YouTube', target: 'https://www.youtube.com', cat: 'Liens'}
  ];
  if (d == null) save();
  render();
});
linksReady.catch(e => toast('Serveur injoignable : ' + e.message, true));
