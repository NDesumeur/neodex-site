/* ---------- Notifications : ce que NeoDex et les plugins ont à te dire, au même endroit (app/notifs-main.js).
   Un plugin envoie avec ctx.notifications.send({ title, body, open, image, type }) et l'autorisation « notifications ».
   Les types qu'il peut envoyer sont décrits dans son plugin.json (« notifications »: [{ type, name, description }]) ; chacun se coupe ici.
   La barre de gauche montre le nombre de non lues sur l'icône de chaque appli (dock.js : nfCountFor, nfDockPanel). ---------- */
let nfItems = [], nfFilter = '', nfMuted = {};
const nfApp = () => APPS['neodex:notifs'];
const nfMenu = tbItem('Notifications', 'ce que NeoDex et les plugins ont à te dire', () => newTab('neodex:notifs'));
tbPop.append(nfMenu);
// les types des applis du cœur (ceux des plugins viennent de leur plugin.json)
const NF_CORE = {
  'neodex:agenda': [{type: 'jour', name: 'Emploi du temps du jour', description: "Le matin, la liste de ce qui est prévu aujourd'hui."},
    {type: 'rappel', name: 'Rappel avant un événement', description: '10 minutes avant chaque cours ou événement à heure fixe.'}],
};
const nfOf = u => u === 'neodex:notifs' ? nfItems : nfItems.filter(n => n.app === u);  // l'icône Notifications de la barre : celles de toutes les applis
const nfCountFor = u => nfOf(u).filter(n => !n.read).length;
const nfIcon = n => (n.app && APPS[n.app]?.icon) || APPS['neodex:notifs']?.icon || '';
// le nombre de non lues : sur l'onglet Notifications, dans le menu et sur la barre de gauche
function nfBadge() {
  const n = nfItems.filter(x => !x.read).length, label = 'Notifications' + (n ? ' (' + n + ')' : '');
  for (const t of tabs.filter(o => o.app === nfApp())) t.btn.children[1].textContent = label;
  nfMenu.firstChild.textContent = label.toUpperCase();
  if (typeof dockDraw === 'function') dockDraw(true);
}
async function nfGo(n) {
  if (!n.read) await neo.notifsRead(n.id);
  if (n.open) newTab(n.open); else if (n.app) newTab(n.app);
}
function nfCard(n) {
  const c = el('div', 'nfCard' + (n.read ? '' : ' unread')), ic = el('img', 'ic'), top = el('div', 'nfTop'), act = el('div', 'nfAct');
  ic.src = nfIcon(n); ic.onerror = () => ic.style.visibility = 'hidden';
  top.append(el('b', '', n.title), el('span', 'nfFrom', (n.fromName || '').toUpperCase() + ' · ' + pmDay(n.at)));
  const b1 = el('button', '', n.read ? 'NON LUE' : 'LUE'), b2 = el('button', '', 'EFFACER');
  b1.onclick = e => { e.stopPropagation(); neo.notifsRead(n.id, !n.read); };
  b2.onclick = e => { e.stopPropagation(); neo.notifsRemove(n.id); };
  act.append(b1, b2);
  if (n.later) {  // l'agenda : ouvrir tout de suite, ou revoir le rappel dans 10 minutes
    const o = el('button', '', 'OUVRIR'), l = el('button', '', 'PLUS TARD');
    o.onclick = e => { e.stopPropagation(); nfGo(n); };
    l.onclick = e => { e.stopPropagation(); neo.notifsLater(n.id).then(() => toast('Rappel dans 10 minutes'), err => toast(err.message, true)); };
    act.prepend(o, l);
  }
  c.append(ic, top, act);
  if (n.body) c.append(el('div', 'nfBody', n.body));
  if (n.image) { const im = el('img', 'nfImg'); im.src = n.image; im.alt = ''; im.onerror = () => im.remove(); c.append(im); }
  c.onclick = () => nfGo(n);
  return c;
}
async function nfOpen() {
  nfItems = await neo.notifsList();
  const unread = nfItems.filter(x => !x.read).length;
  $('nfInfo').textContent = nfItems.length ? unread + ' non lue' + (unread > 1 ? 's' : '') + ' sur ' + nfItems.length : '';
  // un filtre par appli, avec son nombre de non lues
  const apps = [...new Set(nfItems.map(n => n.app || ''))];
  if (nfFilter && !apps.includes(nfFilter)) nfFilter = '';
  const chip = (u, name, icon, count) => {
    const b = el('button', 'nfChip' + (nfFilter === u ? ' on' : ''));
    if (icon) { const i = el('img'); i.src = icon; b.append(i); }
    b.append(el('span', '', name)); if (count) b.append(el('b', '', String(count)));
    b.onclick = () => { nfFilter = u; nfOpen(); }; return b;
  };
  $('nfApps').replaceChildren(...(apps.length > 1 ? [chip('', 'Toutes', '', unread), ...apps.map(u => chip(u, u ? APPS[u]?.name || nfItems.find(n => n.app === u).fromName : 'NeoDex', u && APPS[u]?.icon, nfItems.filter(n => !n.read && (n.app || '') === u).length))] : []));
  const shown = nfItems.filter(n => !nfFilter || n.app === nfFilter);
  // « Toutes » : regroupées par appli (la plus récente dépliée), sinon la liste de l'appli choisie
  const groups = nfFilter || apps.length < 2 ? null : nfGroups(shown);
  $('nfList').replaceChildren(...(!shown.length ? [el('div', 'hint', 'Aucune notification.')] : !groups ? shown.map(nfCard) : groups.map(([u, list], i) => {
    const d = el('details', 'nfGroup'), s = el('summary'), ic = el('img'), unread = list.filter(n => !n.read).length;
    ic.src = nfIcon(list[0]); ic.onerror = () => ic.style.visibility = 'hidden';
    s.append(ic, list.length + ' de ' + nfAppName(u, list[0]), el('small', '', unread ? unread + ' non lue' + (unread > 1 ? 's' : '') : 'lues'));
    d.open = !i || unread > 0; d.append(s, ...list.map(nfCard)); return d;
  })));
  nfBadge(); nfTypes(); nfDnd();
}
// les réglages : chaque appli et les types de notification qu'elle déclare
async function nfTypes() {
  nfMuted = await neo.notifsMuted().catch(() => ({}));
  let plugs = []; try { plugs = await neo.pluginsList(); } catch {}
  const groups = [...Object.entries(NF_CORE).map(([u, types]) => [u, APPS[u]?.name || u, APPS[u]?.icon, types]),
    ...plugs.filter(p => p.notifTypes?.length).map(p => ['plugin:' + p.id, p.name, APPS['plugin:' + p.id]?.icon, p.notifTypes])];
  $('nfTypes').replaceChildren(...groups.map(([u, name, icon, types]) => {
    const g = el('div', 'nfApp'), h = el('b'); if (icon) { const i = el('img'); i.src = icon; h.append(i); } h.append(name); g.append(h);
    for (const t of types) {
      const key = u + '|' + t.type, row = el('label', 'nfType'), cb = Object.assign(el('input'), {type: 'checkbox', checked: !nfMuted[key]});
      cb.onchange = async () => { nfMuted = await neo.notifsMute(key, !cb.checked); };
      row.append(cb, el('span', '', t.name)); if (t.description) row.append(el('small', '', t.description)); g.append(row);
    }
    return g;
  }), ...(groups.length ? [] : [el('div', 'hint', 'Aucune appli ne décrit encore ses notifications.')]));
}
const nfAppName = (u, n) => u ? APPS[u]?.name || n?.fromName || u : 'NeoDex';
// par appli, dans l'ordre de leur notification la plus récente
const nfGroups = list => { const g = new Map(); for (const n of list) { const k = n.app || ''; if (!g.has(k)) g.set(k, []); g.get(k).push(n); } return [...g]; };
// « Ne pas déranger » : les réglages, dans settings.json (main.js : quietNow)
async function nfDnd() {
  const s = await neo.getSettings(), set = o => neo.setSettings(o).catch(e => toast(e.message, true));
  $('nfDndGame').checked = !!s.dndGame; $('nfDndHours').checked = !!s.dndHours; $('nfDndFrom').value = s.dndFrom; $('nfDndTo').value = s.dndTo;
  $('nfDndGame').onchange = e => set({dndGame: e.target.checked});
  $('nfDndHours').onchange = e => set({dndHours: e.target.checked});
  $('nfDndFrom').onchange = e => e.target.value && set({dndFrom: e.target.value});
  $('nfDndTo').onchange = e => e.target.value && set({dndTo: e.target.value});
}
// la barre de gauche : « Accéder » puis les notifications de cette appli
function nfDockPanel(anchor, u, open) {
  const p = dkPop(anchor, 'dkNotif'), go = el('button', 'btn main px', 'ACCÉDER');
  p.append(go, el('span', 'label', 'Notifications'));
  const all = u === 'neodex:notifs', list = nfOf(u).slice(0, all ? 60 : 15), read = all ? 'all' : 'app:' + u;
  go.onclick = () => { p.remove(); neo.notifsRead(read); open(); };
  if (!list.length) p.append(el('div', 'hint', 'Aucune notification pour le moment.'));
  const row = n => {
    const r = el('button', 'nfRow' + (n.read ? '' : ' unread'));
    r.append(el('b', '', n.title), el('small', '', (all && n.fromName ? n.fromName + ' · ' : '') + pmDay(n.at)));
    if (n.body) r.append(el('span', '', n.body.length > 140 ? n.body.slice(0, 139) + '…' : n.body));
    if (n.image) { const im = el('img'); im.src = n.image; im.onerror = () => im.remove(); r.append(im); }
    r.onclick = () => { p.remove(); nfGo(n); };
    return r;
  };
  // toutes les applis : par appli, 3 chacune, le reste derrière « voir les N »
  if (!all) p.append(...list.map(row));
  else for (const [k, g] of nfGroups(list)) {
    p.append(el('span', 'label', g.length + ' de ' + nfAppName(k, g[0])), ...g.slice(0, 3).map(row));
    if (g.length > 3) { const m = el('button', 'tbtn nfMore', 'Voir les ' + (g.length - 3) + ' autres'); m.onclick = e => { e.stopPropagation(); m.replaceWith(...g.slice(3).map(row)); }; p.append(m); }
  }
  if (list.some(n => !n.read)) { const b = el('button', 'tbtn tbFull', 'Tout marquer lu'); b.onclick = () => { p.remove(); neo.notifsRead(read); }; p.append(b); }
}
$('nfAllRead').onclick = () => neo.notifsRead('all');
$('nfClear').onclick = async () => { if (await nbConfirm('Effacer toutes les notifications ?')) neo.notifsRemove('all'); };
neo.onNotifs(async () => {
  const before = new Set(nfItems.map(x => x.id));
  nfItems = await neo.notifsList();
  const fresh = nfItems.find(x => !before.has(x.id));
  if (fresh && !fresh.quiet && document.hasFocus() && active?.app !== nfApp()) toast(fresh.fromName + ' : ' + fresh.title);
  if (active?.app === nfApp()) nfOpen(); else nfBadge();
});
neo.onNotifsOpen(async id => { nfItems = await neo.notifsList(); const n = nfItems.find(x => x.id === id); if (n?.open || n?.app) nfGo(n); else newTab('neodex:notifs'); });
neo.notifsList().then(l => { nfItems = l; nfBadge(); });
// l'agenda : l'emploi du temps du jour (une fois, à partir de 7 h) et un rappel 10 min avant chaque événement à heure fixe
function nfAgenda() {
  if (typeof agenda === 'undefined' || !agenda.events) return;
  const now = new Date(), today = ymd(now), nm = now.getHours() * 60 + now.getMinutes();
  let sent; try { sent = JSON.parse(localStorage.nfAgenda || '{}'); } catch { sent = {}; }
  if (sent.day !== today) sent = {day: today, keys: []};
  const items = agenda.events.filter(ev => ev.kind !== 'task' && occurs(ev, parseDay(today))).sort((a, b) => (b.allDay - a.allDay) || toMin(a.start) - toMin(b.start));
  const send = (key, n) => { sent.keys.push(key); neo.notifsAdd({app: 'neodex:agenda', fromName: 'Agenda', open: 'neodex:agenda', later: true, ...n}).catch(() => {}); };
  if (now.getHours() >= 7 && items.length && !sent.keys.includes('jour'))
    send('jour', {type: 'jour', title: "Aujourd'hui : " + items.length + (items.length > 1 ? ' choses prévues' : ' chose prévue'), body: items.slice(0, 8).map(ev => (ev.allDay ? 'Journée' : ev.start) + ' · ' + ev.title + (ev.place ? ' (' + ev.place + ')' : '')).join('\n')});
  for (const ev of items) {
    if (ev.allDay || !ev.start) continue;
    const left = toMin(ev.start) - nm, key = 'r:' + (ev.id || ev.title) + ':' + ev.start;
    if (left >= 0 && left <= 10 && !sent.keys.includes(key)) send(key, {type: 'rappel', title: (left ? 'Dans ' + left + ' min : ' : 'Maintenant : ') + ev.title, body: ev.start + (ev.end ? ' – ' + ev.end : '') + (ev.place ? ' · ' + ev.place : '')});
  }
  try { localStorage.nfAgenda = JSON.stringify(sent); } catch {}
}
setInterval(nfAgenda, 30e3); setTimeout(nfAgenda, 8e3);
console.assert(typeof nfCountFor('x') === 'number', 'notifs');
