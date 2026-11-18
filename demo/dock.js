/* Barre d'applis à gauche (comme Opera GX) : une colonne d'icônes, n'importe quelle appli de NeoDex, plugin ou site. Un clic ouvre l'appli,
   ou revient sur son onglet si elle est déjà ouverte ; glisser une icône la range ; clic droit : sur le côté, retirer, monter, descendre. L'icône Twitch montre les chaînes
   suivies en direct (main.js, twitch:live, avec la connexion Twitch des onglets). Réglages : dock (la liste), dockOn (main.js). */
const dock = el('div'); dock.id = 'dock';
// the number an app puts on its own icon (a plugin with full access: ctx.host.dockBadge(n), e.g. Discord's unread private messages)
const dkBadges = {};
window.dockBadge = (u, n) => { n = Math.max(0, Math.min(9999, Math.floor(+n) || 0)); if ((dkBadges[u] || 0) === n) return; dkBadges[u] = n; dockDraw(); };
document.body.append(dock);
const dkTwitch = u => /^https?:\/\/([\w-]+\.)?twitch\.tv(\/|$)/.test(u);
const dkInfo = u => APPS[u] ? {name: APPS[u].name, icon: APPS[u].icon} : isWeb(u) ? {name: hostOf(u), icon: iconSrc(u)} : null;
const dkTab = u => APPS[u] ? tabs.find(t => t.app === APPS[u]) : tabs.find(t => !t.app && hostOf(t.url) === hostOf(u));
const dkSave = list => neo.setSettings({dock: list}).then(s => { prefs = s; dockDraw(true); });
function dkOpen(u) {
  const t = dkTab(u);
  if (t) return showTab(t);
  newTab(u);
}
let dkSig = '', dkLive = null;  // dkLive : les chaînes en direct (null : pas encore demandé / pas connecté)
function dockDraw(force) {
  document.body.classList.toggle('dockOn', prefs.dockOn !== false); document.body.classList.toggle('dockMin', !!prefs.dockMin);
  const nfN = u => Math.max(typeof nfCountFor === 'function' ? nfCountFor(u) : 0, dkBadges[u] || 0);  // les notifications non lues de chaque appli (notifs.js), ou le nombre que l'appli donne elle-même (dockBadge)
  const list = (prefs.dock || []).filter(dkInfo), sig = list.join() + '|' + list.map(u => dkTab(u) ? 1 : 0).join('') + '|' + (active?.url || '') + '|' + (dkLive?.length ?? '-') + '|' + !!prefs.dockMin + '|' + list.map(nfN).join();
  if (!force && sig === dkSig) return;
  dkSig = sig;
  const tog = el('button', 'dkTog', prefs.dockMin ? '›' : '‹'); tog.title = prefs.dockMin ? 'Rouvrir la barre d\'applis' : 'Réduire la barre d\'applis';
  tog.onclick = () => neo.setSettings({dockMin: !prefs.dockMin}).then(s => { prefs = s; dockDraw(true); });
  if (prefs.dockMin) return dock.replaceChildren(tog);
  dock.replaceChildren(tog, ...list.map(u => {
    const i = dkInfo(u), b = el('button', 'dkI px'), ic = el('img'), t = dkTab(u);
    ic.src = i.icon || ''; ic.onerror = () => ic.style.visibility = 'hidden';
    b.append(ic); b.title = i.name + (dkTwitch(u) ? ' · chaînes suivies en direct' : '');
    b.classList.toggle('open', !!t); b.classList.toggle('on', !!t && t === active);
    if (dkTwitch(u) && dkLive?.length) b.append(el('span', 'dkN', String(dkLive.length)));
    const nn = nfN(u); if (nn) { b.append(el('span', 'dkN', nn > 99 ? '99+' : String(nn))); b.title += ' · ' + nn + ' notification' + (nn > 1 ? 's' : ''); }
    b.onclick = () => dkTwitch(u) ? twitchPanel(b, u) : u === 'neodex:notifs' || nfN(u) ? nfDockPanel(b, u, () => dkOpen(u)) : dkOpen(u);
    b.oncontextmenu = e => { e.preventDefault(); dkMenu(e, u, list); };
    // glisser-déposer pour ranger (Monter / Descendre restent dans le clic droit, au clavier)
    b.draggable = true;
    b.ondragstart = e => { e.dataTransfer.setData('neodex/dock', u); e.dataTransfer.effectAllowed = 'move'; b.classList.add('drag'); };
    b.ondragend = () => b.classList.remove('drag');
    b.ondragover = e => { if (e.dataTransfer.types.includes('neodex/dock')) { e.preventDefault(); b.classList.add('dropAt'); } };
    b.ondragleave = () => b.classList.remove('dropAt');
    b.ondrop = e => {
      e.preventDefault(); b.classList.remove('dropAt');
      const from = e.dataTransfer.getData('neodex/dock'); if (!from || from === u) return;
      const l = list.filter(x => x !== from); l.splice(l.indexOf(u) + (list.indexOf(from) < list.indexOf(u) ? 1 : 0), 0, from); dkSave(l);
    };
    return b;
  }), el('div', 'dkSep'), (() => { const b = el('button', 'dkI px dkAdd', '+'); b.title = 'Ajouter une appli ou un site'; b.onclick = () => dkPicker(b); return b; })());
}
const dkPop = (anchor, cls = '') => {
  document.querySelector('.dkPop')?.remove();
  const p = el('div', 'tbPop dkPop px on ' + cls), r = anchor.getBoundingClientRect();
  p.style.left = r.right + 10 + 'px'; p.style.right = 'auto'; p.style.top = Math.max(50, r.top - 8) + 'px';
  document.body.append(p);
  const fit = () => { const b = p.getBoundingClientRect(); if (b.bottom > innerHeight - 8) p.style.top = Math.max(50, innerHeight - 8 - b.height) + 'px'; if (b.right > innerWidth - 8) p.style.left = Math.max(8, innerWidth - 8 - b.width) + 'px'; };
  fit(); new ResizeObserver(fit).observe(p);  // toujours entier à l'écran, même quand son contenu arrive après
  setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener('pointerdown', off, true); } }, true));
  return p;
};
function dkMenu(e, u, list) {
  const m = dkPop(e.currentTarget), k = list.indexOf(u), t = dkTab(u);
  const item = (label, f, ok = true) => { if (!ok) return; const b = el('button', 'tbtn tbFull', label); b.onclick = () => { m.remove(); f(); }; m.append(b); };
  const move = d => { const l = list.slice(); [l[k], l[k + d]] = [l[k + d], l[k]]; dkSave(l); };
  item('Ouvrir', () => dkOpen(u));
  item('Épingler sur le côté', () => sidePin(t || newTab(u, false)), typeof sidePin === 'function');
  item('Monter', () => move(-1), k > 0);
  item('Descendre', () => move(1), k < list.length - 1);
  item('Retirer de la barre', () => dkSave(list.filter(x => x !== u)));
}
function dkPicker(anchor) {
  const p = dkPop(anchor, 'tabPick'), have = new Set(prefs.dock || []);
  const add = u => { p.remove(); if (!have.has(u)) dkSave([...(prefs.dock || []), u]); };
  const row = (u, name, icon) => { const b = el('button', 'tbtn tbFull'), ic = el('img'); ic.src = icon || ''; b.append(ic, el('span', '', name)); b.onclick = () => add(u); return b; };
  const f = Object.assign(el('input', 'f'), {placeholder: 'Adresse d\'un site (twitch.tv, …)', spellcheck: false});
  f.onkeydown = e => { if (e.key !== 'Enter' || !f.value.trim()) return; let u = f.value.trim(); if (!/^https?:\/\//.test(u)) u = 'https://' + u; if (isWeb(u)) add(u); else toast('Adresse invalide', true); };
  p.append(el('span', 'label', 'Ajouter à la barre'), f);
  if (active && !active.app && isWeb(active.url) && !have.has(active.url)) p.append(row(new URL(active.url).origin + '/', 'Ce site : ' + hostOf(active.url), iconSrc(active.url)));
  const apps = Object.entries(APPS).filter(([u]) => !have.has(u)).sort((a, b) => a[1].name.localeCompare(b[1].name));
  p.append(el('span', 'label', 'Les applis'), ...apps.map(([u, a]) => row(u, a.name, a.icon)));
  setTimeout(() => f.focus(), 30);
}
// Twitch : les chaînes suivies en direct, comme le panneau d'Opera GX ; un clic ouvre la chaîne dans un onglet
async function twitchLive() {
  try { const r = await neo.twitchLive(); dkLive = r.login ? r.live : null; return r; } catch (e) { return {login: false, error: e.message}; }
}
async function twitchPanel(anchor, u) {
  const p = dkPop(anchor, 'twPanel');
  p.append(el('span', 'label', 'Twitch · en direct'), el('div', 'hint', 'Chargement…'));
  const r = await twitchLive(); dockDraw();
  p.replaceChildren(el('span', 'label', 'Twitch · en direct'));
  const go = url => { p.remove(); newTab(url); };  // une chaîne précise : dans l'onglet Twitch déjà ouvert, s'il y en a un
  if (!r.login) {
    p.append(el('div', 'hint', 'Connecte-toi à Twitch : tes chaînes suivies en direct s\'afficheront ici. La connexion reste enregistrée dans NeoDex.'));
    const b = el('button', 'btn main px', 'SE CONNECTER À TWITCH'); b.onclick = () => go('https://www.twitch.tv/login'); p.append(b);
    return;
  }
  if (r.error) p.append(el('div', 'hint', 'Twitch ne répond pas : ' + r.error));
  else if (!r.live.length) p.append(el('div', 'hint', 'Aucune chaîne suivie n\'est en direct.'));
  for (const c of r.live) {
    const b = el('button', 'twRow'), av = el('img'), txt = el('div');
    av.src = c.avatar || ''; av.onerror = () => av.style.visibility = 'hidden';
    txt.append(el('b', '', c.name), el('small', '', c.game || ''), el('small', 'twT', c.title || ''));
    b.append(av, txt, el('span', 'twV', '● ' + (c.viewers >= 1000 ? (c.viewers / 1000).toFixed(1).replace('.0', '') + ' k' : c.viewers)));
    b.title = c.title || c.name; b.onclick = () => go('https://www.twitch.tv/' + c.login);
    p.append(b);
  }
  const all = el('button', 'tbtn tbFull', 'Tout voir sur Twitch'); all.onclick = () => go('https://www.twitch.tv/directory/following/live'); p.append(all);
}
// le nombre de chaînes en direct sur l'icône, mis à jour toutes les 3 min (seulement si Twitch est dans la barre)
setInterval(() => { if ((prefs.dock || []).some(dkTwitch) && document.visibilityState === 'visible') twitchLive().then(() => dockDraw()); }, 180e3);
// une fois : l'icône Notifications rejoint la barre de ceux qui l'avaient déjà réglée avant qu'elle y soit par défaut
setTimeout(() => { if (!prefs.dockNf) neo.setSettings({dockNf: true, dock: (prefs.dock || []).includes('neodex:notifs') ? prefs.dock : [...(prefs.dock || []).slice(0, 2), 'neodex:notifs', ...(prefs.dock || []).slice(2)]}).then(s => { prefs = s; dockDraw(true); }); }, 1500);
setTimeout(() => { if ((prefs.dock || []).some(dkTwitch)) twitchLive().then(() => dockDraw()); }, 5000);
// les onglets ouverts / l'onglet affiché (point devant l'icône) et les plugins chargés après coup
setInterval(() => !document.hidden && typeof prefs !== 'undefined' && prefs.dock && dockDraw(), 1000);
window.neo?.getSettings().then(s => { prefs = s; dockDraw(true); });
window.neo?.onSettingsChanged(async () => { prefs = await neo.getSettings(); dockDraw(true); });
tbPop.append(tbItem('Barre d\'applis', 'à gauche, afficher ou cacher', () => neo.setSettings({dockOn: prefs.dockOn === false}).then(s => { prefs = s; dockDraw(true); })));
