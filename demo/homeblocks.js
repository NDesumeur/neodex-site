'use strict';
/* L'accueil en blocs : les widgets des plugins, les raccourcis et l'agenda, dans l'ordre et à la taille choisis (bouton « Disposer »).
   Réglages : prefs.homeLayout [{id, size: 's'|'m'|'l', hidden}], prefs.homeWidgets (l'ordre des widgets) et prefs.homeWidgetSizes {id: 's'|'m'|'l'}.
   Un widget s'affiche si le plugin le propose (autorisation « widget », ou l'ancien « widget »: true) et que ce droit n'est pas refusé.
   Deux sortes : dessiné par le plugin (plugin.json « widget »: "widget.js", sa propre iframe, libre de son allure) ou en données (titre, lignes, jauge, boutons). */
const BLOCKS = {widgets: 'Widgets', shortcuts: 'Raccourcis', agenda: 'Agenda'};
const BLOCK_SIZES = {shortcuts: {s: 100, m: 118, l: 150}, agenda: {s: 30, m: 44, l: 62}};  // taille d'une tuile, hauteur d'une heure
const W_SIZES = {s: 'Petit', m: 'Moyen', l: 'Grand'};
const homeLayout = () => {
  const saved = Array.isArray(prefs.homeLayout) ? prefs.homeLayout.filter(b => BLOCKS[b?.id]) : [];
  return [...saved, ...Object.keys(BLOCKS).filter(id => !saved.some(b => b.id === id)).map(id => ({id, size: 'm'}))].map(b => ({id: b.id, size: W_SIZES[b.size] ? b.size : 'm', hidden: !!b.hidden}));
};
const widgetOffered = p => !!p && (p.widget || (p.permissions || []).includes('widget'));
const widgetAllowed = p => widgetOffered(p) && p.enabled && p.perms?.widget !== 'deny';
const widgetSize = id => W_SIZES[(prefs.homeWidgetSizes || {})[id]] ? prefs.homeWidgetSizes[id] : 'm';
const saveLayout = s => neo.setSettings(s).then(x => { prefs = x; applyLayout(); renderWidgets(); if (layoutPop.classList.contains('on')) layoutOpen(); });

function applyLayout() {
  homeLayout().forEach((b, i) => {
    const e = document.querySelector('[data-block="' + b.id + '"]'); if (!e) return;
    e.style.order = i; e.classList.toggle('lyOff', b.hidden);
    if (b.id === 'shortcuts') e.style.setProperty('--tile', BLOCK_SIZES.shortcuts[b.size] + 'px');
    if (b.id === 'agenda' && HPX !== BLOCK_SIZES.agenda[b.size]) { HPX = BLOCK_SIZES.agenda[b.size]; if (agenda?.events) renderAgenda(); }
  });
}

// a widget in data: the plugin gives a title, lines, a gauge, a picture and buttons, NeoDex draws them
function dataCard(c, id, x) {
  const head = el('div', 'nbWHead');
  if (x.img) { const i = el('img'); i.src = x.img; i.alt = ''; head.append(i); }
  head.append(el('b', '', x.title));
  const kids = [head, ...(x.lines || []).map(l => el('div', 'hint', l))];
  if (x.bar != null) { const g = el('div', 'nbWBar'); g.style.setProperty('--v', x.bar); kids.push(g); }
  if (x.actions?.length) {
    const row = el('div', 'nbWActs');
    for (const a of x.actions) {
      const b = el('button', 'btn', a.label);
      b.onclick = e => { e.stopPropagation(); const cmd = pluginInfo.get(id)?.commands?.find(k => k.id === a.command); if (cmd) runPluginCommand(id, cmd); };
      row.append(b);
    }
    kids.push(row);
  }
  c.replaceChildren(...kids);
}
// a widget the plugin draws itself: its own sandboxed iframe, created once (moving an iframe would reload it: the order is CSS)
function viewCard(c, p) {
  const f0 = c.querySelector('iframe');
  if (f0 && c.dataset.ver === p.version) return;
  if (f0) { for (const [w, e] of [...pluginFrames]) if (e.frame === f0) pluginFrames.delete(w); f0.remove(); }  // the plugin was updated: its new widget
  const f = el('iframe', 'nbWFrame'); f.setAttribute('sandbox', 'allow-scripts'); f.srcdoc = pluginBoot(p); f.title = p.name; f.name = p.id + ':widget';
  c.replaceChildren(f); c.dataset.ver = p.version;
  pluginFrames.set(f.contentWindow, {id: p.id, frame: f, widget: true});
}
// NeoDex's own widgets (id « nd:<key> »), switched on / off in « Disposer » (prefs.homeBuiltins); each card is drawn once and keeps its state
const wHead = t => { const h = el('div', 'nbWHead'); h.append(el('b', '', t)); return h; }, wRow = (...k) => { const r = el('div', 'nbWActs'); r.append(...k); return r; };
const pomo = {mode: 'work', left: 25 * 60, end: 0};  // a Pomodoro: 25 min of work, 5 min of break; end = when the running one stops
function pomoCard(c) {
  const time = el('div', 'wdBig'), what = el('div', 'hint'), go = el('button', 'btn px main'), reset = el('button', 'btn px', 'Remettre'), sw = el('button', 'btn px'), len = () => (pomo.mode === 'work' ? 25 : 5) * 60;
  const draw = () => {
    const s = pomo.end ? Math.max(0, Math.round((pomo.end - Date.now()) / 1000)) : pomo.left;
    if (pomo.end && !s) { pomo.end = 0; pomo.mode = pomo.mode === 'work' ? 'break' : 'work'; pomo.left = len(); sfx('notify'); toast(pomo.mode === 'break' ? 'Pomodoro fini : 5 minutes de pause' : 'Pause finie : on s\'y remet'); return draw(); }
    time.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    what.textContent = pomo.mode === 'work' ? 'Concentration · 25 min' : 'Pause · 5 min'; go.textContent = pomo.end ? 'Pause' : 'Démarrer'; sw.textContent = pomo.mode === 'work' ? 'Passer à la pause' : 'Passer au travail';
  };
  go.onclick = () => { if (pomo.end) { pomo.left = Math.max(0, Math.round((pomo.end - Date.now()) / 1000)); pomo.end = 0; } else pomo.end = Date.now() + pomo.left * 1000; draw(); };
  reset.onclick = () => { pomo.end = 0; pomo.left = len(); draw(); };
  sw.onclick = () => { pomo.mode = pomo.mode === 'work' ? 'break' : 'work'; reset.onclick(); };
  setInterval(() => pomo.end && draw(), 1000);
  c.replaceChildren(wHead('Minuteur Pomodoro'), time, what, wRow(go, reset, sw)); draw();
}
function noteCard(c) {
  const t = el('textarea', 'wdNote'); t.value = prefs.quickNote || ''; t.placeholder = 'Une idée, une liste de courses… (enregistré tout seul)'; t.spellcheck = true;
  t.oninput = () => { clearTimeout(t.s); t.s = setTimeout(() => neo.setSettings({quickNote: t.value}).then(s => { prefs = s; }), 600); };
  c.replaceChildren(wHead('Note rapide'), t);
}
function countCard(c) {
  const big = el('div', 'wdBig'), what = el('div', 'hint'), name = el('input'), when = el('input'), save = el('button', 'btn px main', 'OK'), edit = el('button', 'btn px', 'Modifier'), form = wRow(name, when, save);
  name.placeholder = 'Quoi ? (vacances, anniversaire…)'; name.maxLength = 60; when.type = 'datetime-local';
  const draw = () => {
    const cd = prefs.countdown || {}, at = Date.parse(cd.at), on = !!cd.at && !isNaN(at); form.style.display = on ? 'none' : ''; for (const e of [big, what, edit]) e.style.display = on ? '' : 'none';
    if (!on) return; const ms = at - Date.now(), d = Math.floor(Math.abs(ms) / 864e5), h = Math.floor(Math.abs(ms) % 864e5 / 36e5), m = Math.floor(Math.abs(ms) % 36e5 / 6e4);
    big.textContent = ms <= 0 ? 'C\'est le jour !' : d ? d + ' j ' + h + ' h' : h + ' h ' + String(m).padStart(2, '0');
    what.textContent = (cd.t || 'Compte à rebours') + ' · ' + new Date(at).toLocaleString('fr-FR', {weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'});
  };
  save.onclick = () => { if (!when.value) return toast('Choisis une date'); neo.setSettings({countdown: {t: name.value.trim(), at: when.value}}).then(s => { prefs = s; draw(); }); };
  edit.onclick = () => { name.value = prefs.countdown?.t || ''; when.value = prefs.countdown?.at || ''; form.style.display = ''; edit.style.display = 'none'; };
  setInterval(draw, 30000);
  c.replaceChildren(wHead('Compte à rebours'), big, what, form, wRow(edit)); draw();
}
let wkWx = {at: 0, key: '', d: null};  // the week's weather, asked again after 30 min or when the city changes
async function meteoCard(c) {
  if (!prefs.weatherCity) return c.replaceChildren(wHead('Météo de la semaine'), el('div', 'hint', 'Choisis ta ville dans Paramètres › Apparence (météo).'));
  const key = prefs.weatherLat + ',' + prefs.weatherLon;
  if (wkWx.key !== key || Date.now() - wkWx.at > 30 * 60000) try {
    wkWx = {at: Date.now(), key, d: (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${prefs.weatherLat}&longitude=${prefs.weatherLon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`).then(r => r.json())).daily};
  } catch { return c.replaceChildren(wHead('Météo de la semaine'), el('div', 'hint', 'Pas de connexion : la météo revient toute seule.')); }
  const w = wkWx.d, week = el('div', 'wdWeek');
  w.time.forEach((t, i) => {
    const k = wxKind(w.weather_code[i], 1), d = el('div'), ic = el('span'); ic.innerHTML = pixIcon(WX[k][1], 2); ic.style.color = WX[k][0]; d.title = WX_LABEL[k];
    d.append(el('small', '', i ? new Date(t + 'T12:00').toLocaleDateString('fr-FR', {weekday: 'short'}).replace('.', '') : 'auj.'), ic, el('b', '', Math.round(w.temperature_2m_max[i]) + '°'), el('small', '', Math.round(w.temperature_2m_min[i]) + '°'));
    week.append(d);
  });
  c.replaceChildren(wHead('Météo · ' + prefs.weatherCity), week);
}
const BUILTIN = {pomo: ['Minuteur Pomodoro', pomoCard], note: ['Note rapide', noteCard], count: ['Compte à rebours', countCard], meteo: ['Météo de la semaine', meteoCard]};
const builtinOn = () => (prefs.homeBuiltins || []).filter(k => BUILTIN[k]).map(k => 'nd:' + k);
setInterval(() => widgetCards.has('nd:meteo') && meteoCard(widgetCards.get('nd:meteo')), 30 * 60000);

const widgetCards = new Map();  // plugin id -> its card on the home page
function renderWidgets() {
  const box = $('homeWidgets'), grid = $('wGrid'), order = prefs.homeWidgets || [];
  const ids = [...builtinOn(), ...new Set([...Object.keys(pluginWidgets), ...[...pluginInfo.values()].filter(p => p.widgetView).map(p => p.id)])]
    .filter(id => id.startsWith('nd:') || widgetAllowed(pluginInfo.get(id)) && (pluginInfo.get(id).widgetView || pluginWidgets[id]?.title))
    .sort((a, b) => (order.indexOf(a) + 1 || 1e3) - (order.indexOf(b) + 1 || 1e3));
  for (const [id, c] of widgetCards) if (!ids.includes(id)) {
    for (const [w, e] of [...pluginFrames]) if (e.widget && e.id === id) pluginFrames.delete(w);
    c.remove(); widgetCards.delete(id);
  }
  ids.forEach((id, i) => {
    const p = pluginInfo.get(id); let c = widgetCards.get(id);
    if (id.startsWith('nd:')) {
      if (!c) { c = el('div', 'nbWidget px wdCard'); c.dataset.id = id; widgetCards.set(id, c); grid.append(c); BUILTIN[id.slice(3)][1](c); }
      c.style.order = i; c.dataset.size = widgetSize(id); return;
    }
    if (!c) {
      c = el('div', 'nbWidget px'); c.dataset.id = id; widgetCards.set(id, c); grid.append(c);
      c.onclick = e => { if (!p.widgetView && !e.target.closest('button')) newTab('plugin:' + id); };
    }
    c.style.order = i; c.classList.toggle('drawn', !!p.widgetView);
    if (c.dataset.size !== widgetSize(id)) { c.dataset.size = widgetSize(id); postToWidget(id, {t: 'widgetSize', size: c.dataset.size}); }
    if (p.widgetView) viewCard(c, p); else dataCard(c, id, pluginWidgets[id]);
  });
  box.hidden = !ids.length || !!$('search').value.trim();
  $('wCount').textContent = ids.length;
}

// « Disposer » : monter, descendre, taille et masquer pour chaque bloc ; ordre, taille et marche / arrêt pour chaque widget
const layoutPop = $('layoutPop');
function layoutOpen() {
  const rows = [], L = homeLayout(), icon = (pix, title, f, off) => { const b = el('button', 'gMove'); b.innerHTML = pixIcon(PIX[pix]); b.title = title; b.disabled = !!off; b.onclick = e => { e.stopPropagation(); f(); }; return b; };
  const move = (list, i, d) => { const a = list.slice(); [a[i], a[i + d]] = [a[i + d], a[i]]; return a; };
  const sizes = (cur, pick) => { const s = el('div', 'lySizes'); for (const k of Object.keys(W_SIZES)) { const b = el('button', 'btn px' + (cur === k ? ' main' : ''), k.toUpperCase()); b.title = W_SIZES[k]; b.onclick = e => { e.stopPropagation(); pick(k); }; s.append(b); } return s; };
  rows.push(el('div', 'label', 'BLOCS DE L\'ACCUEIL'));
  L.forEach((b, i) => {
    const r = el('div', 'lyRow' + (b.hidden ? ' off' : ''));
    r.append(el('span', '', BLOCKS[b.id]), BLOCK_SIZES[b.id] ? sizes(b.size, s => saveLayout({homeLayout: L.map(x => x === b ? {...x, size: s} : x)})) : el('small', '', 'taille : chaque widget'),
      icon(b.hidden ? 'eye' : 'eyeOff', b.hidden ? 'Montrer ce bloc' : 'Masquer ce bloc', () => saveLayout({homeLayout: L.map(x => x === b ? {...x, hidden: !b.hidden} : x)})),
      icon('up', 'Monter', () => saveLayout({homeLayout: move(L, i, -1)}), !i),
      icon('down', 'Descendre', () => saveLayout({homeLayout: move(L, i, 1)}), i === L.length - 1));
    rows.push(r);
  });
  // NeoDex's own widgets and the plugins' ones in one list (one order); a plugin's is cut by refusing its « widget » permission
  const bOn = prefs.homeBuiltins || [], order = prefs.homeWidgets || [];
  const offer = [...Object.entries(BUILTIN).map(([k, [name]]) => ({id: 'nd:' + k, name, on: bOn.includes(k), builtin: k})),
    ...[...pluginInfo.values()].filter(p => widgetOffered(p) && p.enabled).map(p => ({id: p.id, name: p.name, on: p.perms?.widget !== 'deny'}))];
  offer.sort((a, b) => (order.indexOf(a.id) + 1 || 1e3) - (order.indexOf(b.id) + 1 || 1e3));
  rows.push(el('div', 'label', 'WIDGETS'));
  offer.forEach((p, i) => {
    const on = p.on, r = el('div', 'lyRow' + (on ? '' : ' off')), ids = offer.map(x => x.id);
    const toggle = p.builtin ? () => saveLayout({homeBuiltins: on ? bOn.filter(k => k !== p.builtin) : [...bOn, p.builtin]})
      : () => neo.pluginsPermSet(p.id, 'widget', on ? 'deny' : 'allow').then(() => pluginsRefresh()).then(() => { renderWidgets(); layoutOpen(); });
    r.append(el('span', '', p.name + (p.builtin ? ' · NeoDex' : '')), sizes(widgetSize(p.id), s => saveLayout({homeWidgetSizes: {...prefs.homeWidgetSizes, [p.id]: s}})),
      icon(on ? 'eyeOff' : 'eye', on ? 'Couper ce widget' : 'Rallumer ce widget', toggle),
      icon('up', 'Monter', () => saveLayout({homeWidgets: move(ids, i, -1)}), !i),
      icon('down', 'Descendre', () => saveLayout({homeWidgets: move(ids, i, 1)}), i === offer.length - 1));
    rows.push(r);
  });
  layoutPop.replaceChildren(...rows);
}
$('layoutBtn').onclick = () => {
  const r = $('layoutBtn').getBoundingClientRect();
  layoutPop.style.top = r.bottom + 6 + 'px'; layoutPop.style.left = Math.max(8, Math.min(innerWidth - 520, r.left)) + 'px'; layoutPop.style.right = 'auto';
  if (!layoutPop.classList.toggle('on')) return;
  layoutOpen();
};
document.addEventListener('pointerdown', e => { if (!e.target.closest('#layoutPop, #layoutBtn')) layoutPop.classList.remove('on'); }, true);
applyLayout(); renderWidgets();
