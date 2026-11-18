/* ---------- websites: the bar that asks (permissions, saving a password, filling one), the "Sites et données" page (permissions,
   cookies, keep logged in) and the passwords of the vault. The passwords themselves never come into this page except when you ask
   to see one: filling goes straight from the vault to the website (sites-main.js). ---------- */
const SB_KINDS = {camera: 'Caméra', micro: 'Micro', notifications: 'Notifications', geolocation: 'Position', clipboard: 'Presse-papiers', midi: 'MIDI', external: 'Programmes du PC'};
const sbQueue = [];
// one question at a time at the top of the window; key: a newer question with the same key replaces the old one
function siteBar(q) {
  const i = sbQueue.findIndex(o => o.key && o.key === q.key); if (i >= 0) sbQueue.splice(i, 1, q); else sbQueue.push(q);
  sbShow();
}
function sbShow() {
  const bar = $('siteBar'), q = sbQueue[0];
  clearTimeout(sbShow.t);
  if (!q) { bar.classList.remove('on'); return; }
  const text = el('div', 'sbText'); text.append(el('b', '', q.host), ' ' + q.text);
  const acts = el('div', 'sbActs'); let input = null;
  if (q.password) { input = Object.assign(el('input', 'f'), {type: 'password', placeholder: 'Mot de passe du coffre'}); acts.append(input); input.onkeydown = e => { if (e.key === 'Enter') acts.querySelector('.main')?.click(); }; }
  for (const a of q.actions) {
    const b = el('button', 'btn px' + (a.main ? ' main' : ''), a.label);
    b.onclick = async () => {
      try { if (await a.run(input?.value) === false) return; } catch (e) { toast(e.message.replace(/^.*Error: /, ''), true); input?.select(); return; }
      sbDone(q);
    };
    acts.append(b);
  }
  const x = el('button', 'sbX', 'X'); x.title = 'Fermer'; x.onclick = () => { q.dismiss?.(); sbDone(q); };
  bar.replaceChildren(el('span', 'sbIcon', q.icon || '?'), text, acts, x); bar.classList.add('on');
  if (q.password) setTimeout(() => input.focus());
  if (q.timeout) sbShow.t = setTimeout(() => { q.dismiss?.(); sbDone(q); }, q.timeout);
}
const sbDone = q => { const i = sbQueue.indexOf(q); if (i >= 0) sbQueue.splice(i, 1); sbShow(); };
const tabOfWc = id => tabs.find(t => !t.app && !t.lazy && (() => { try { return t.v.getWebContentsId() === id; } catch { return false; } })());

// a site asks for the camera, the microphone, notifications, the location…
neo.onPermAsk(d => siteBar({key: 'perm' + d.id, host: d.host, icon: d.kinds.includes('camera') ? '◉' : d.kinds.includes('micro') ? '♪' : d.kinds.includes('geolocation') ? '⌖' : '!',
  text: 'veut utiliser ' + d.what + '.', actions: [{label: 'Autoriser', main: true, run: () => neo.permAnswer(d.id, true)}, {label: 'Bloquer', run: () => neo.permAnswer(d.id, false)}],
  dismiss: () => neo.permAnswer(d.id, false)}));
// a login was sent: keep the password in the vault?
neo.onPwAskSave(d => siteBar({key: 'save' + d.host, host: d.host, icon: '⚿', timeout: 120e3,
  text: (d.insecure ? ' (site NON sécurisé, en http : ce mot de passe a pu être lu sur le réseau, et NeoDex ne le remplira jamais ici)' : '') +
    (!d.exists ? ': enregistrer ce mot de passe ? Il faut d\'abord créer ton coffre.' : (d.update ? ': mettre à jour le mot de passe de « ' : ': enregistrer le mot de passe de « ') + (d.user || 'sans identifiant') + ' » dans le coffre ?'),
  password: d.exists && d.locked,
  actions: d.exists ? [{label: d.update ? 'Mettre à jour' : 'Enregistrer', main: true, run: pw => neo.pwSave({id: d.id, unlock: pw}).then(() => toast('Mot de passe gardé dans le coffre'))},
    {label: 'Jamais pour ce site', run: () => neo.pwNever(d.host)}] : [{label: 'Créer le coffre', main: true, run: () => newTab('neodex:vault')}]}));
// a login form: fill it from the vault (only for the tab it is in, while that tab is shown)
neo.onPwOffer(d => {
  const t = tabOfWc(d.wcId); if (!t) return;
  const fill = (user, pw) => neo.pwFill({wcId: d.wcId, host: d.host, user, unlock: pw});
  const q = d.locked ? {key: 'fill' + d.wcId, host: d.host, icon: '⚿', text: ': un mot de passe est dans le coffre.', password: true, timeout: 60e3, actions: [{label: 'Déverrouiller et remplir', main: true, run: pw => fill('', pw)}]}
    : {key: 'fill' + d.wcId, host: d.host, icon: '⚿', text: ': remplir avec le coffre ?', timeout: 60e3, actions: d.users.map((u, i) => ({label: u || 'sans identifiant', main: !i, run: () => fill(u)}))};
  q.tab = t; siteBar(q);
});
// a question about a tab goes with it: it waits while another tab is shown
{ const real = showTab; showTab = function (t) { real.apply(this, arguments); const q = sbQueue[0]; if (q?.tab && q.tab !== t) { sbQueue.push(sbQueue.shift()); } sbShow(); }; }

/* ---------- "Sites et données" ---------- */
let sitesFilter = '';
async function sitesOpen() {
  const [list, s] = await Promise.all([neo.sitesList(), neo.getSettings()]);
  $('stClearExit').checked = !!s.clearOnExit;
  const q = sitesFilter.toLowerCase(), rows = list.filter(x => x.host.includes(q)).sort((a, b) => (b.keep - a.keep) || (Object.keys(b.perms).length - Object.keys(a.perms).length) || b.cookies - a.cookies);
  $('stInfo').textContent = list.length + ' sites · ' + list.reduce((a, x) => a + x.cookies, 0) + ' cookies · ' + list.filter(x => x.keep).length + ' gardés connectés · ' + list.filter(x => Object.keys(x.perms).length).length + ' avec des autorisations';
  $('stList').replaceChildren(...(rows.length ? rows.map(x => {
    const r = el('div', 'stRow px' + (x.keep ? ' keep' : '')), name = el('div', 'stName'), perms = el('div', 'stPerms'), acts = el('div', 'stActs');
    const fav = el('img'); fav.src = 'https://www.google.com/s2/favicons?sz=32&domain=' + encodeURIComponent(x.host); fav.onerror = () => fav.remove();
    name.append(fav, el('b', '', x.host), el('small', '', x.cookies ? x.cookies + ' cookie' + (x.cookies > 1 ? 's' : '') + (x.expires ? ' · jusqu\'au ' + new Date(x.expires).toLocaleDateString('fr-FR') : '') : 'aucun cookie'));
    for (const [k, v] of Object.entries(x.perms)) {
      const c = el('button', 'stPerm ' + v, SB_KINDS[k] + (v === 'allow' ? ' ✓' : ' ✕'));
      c.title = (v === 'allow' ? 'Autorisé' : 'Bloqué') + ' · clic : oublier (le site redemandera)';
      c.onclick = () => neo.permSet({host: x.host, kind: k, value: null}).then(sitesOpen);
      c.oncontextmenu = e => { e.preventDefault(); neo.permSet({host: x.host, kind: k, value: v === 'allow' ? 'deny' : 'allow'}).then(sitesOpen); };
      perms.append(c);
    }
    const keep = el('button', 'btn px' + (x.keep ? ' main' : ''), x.keep ? 'GARDÉ CONNECTÉ' : 'GARDER CONNECTÉ');
    keep.title = 'Ses cookies ne sont jamais effacés par « Effacer les autres » ni à la fermeture'; keep.onclick = () => neo.sitesKeep({host: x.host, keep: !x.keep}).then(sitesOpen);
    const clear = el('button', 'btn px', 'EFFACER'); clear.title = 'Efface ses cookies et ses données (tu seras déconnecté de ce site)';
    clear.onclick = async () => { if (!await nbConfirm('Effacer les cookies et les données de ' + x.host + ' ? Tu seras déconnecté de ce site.')) return; const n = await neo.sitesClear(x.host); toast(x.host + ' : ' + n + ' cookie' + (n > 1 ? 's' : '') + ' effacé' + (n > 1 ? 's' : '')); sitesOpen(); };
    acts.append(keep, clear); r.append(name, perms, acts); return r;
  }) : [el('div', 'hint', q ? 'Aucun site ne correspond.' : 'Aucun site pour l\'instant.')]));
}
$('stSearch').oninput = e => { sitesFilter = e.target.value; sitesOpen(); };
$('stClearOthers').onclick = async () => {
  if (!await nbConfirm('Effacer les cookies et les données de tous les sites, sauf ceux gardés connectés ?')) return;
  const r = await neo.sitesClearOthers(); toast(r.sites + ' sites effacés (' + r.cookies + ' cookies)'); sitesOpen();
};
$('stClearExit').onchange = e => neo.sitesClearOnExit(e.target.checked);
neo.onSitesChanged(() => { if (active?.app === APPS['neodex:sites']) sitesOpen(); });

/* ---------- the passwords, in the vault app ---------- */
async function pwRender() {
  const card = $('vtPwCard'); if (!card) return;
  let list; try { list = await neo.pwList(); } catch { card.replaceChildren(); return; }
  const q = ($('vtPwSearch')?.value || '').toLowerCase();
  const head = el('div', 'row'), search = Object.assign(el('input', 'f'), {id: 'vtPwSearch', placeholder: 'Chercher un site…', value: q}), add = el('button', 'btn px', 'Ajouter…');
  search.oninput = () => { pwRender().then(() => { const s = $('vtPwSearch'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }); };
  add.onclick = async () => { const host = await ask('Site', '', 'par exemple twitch.tv'); if (!host) return; const user = await ask('Identifiant', '', 'e-mail ou pseudo'); if (user == null) return; const pass = await ask('Mot de passe', await neo.pwGenerate(), 'un mot de passe solide est déjà proposé'); if (!pass) return; try { await neo.pwAdd({host, user, pass}); pwRender(); } catch (e) { toast(e.message.replace(/^.*Error: /, ''), true); } };
  const check = el('button', 'btn px', 'Vérifier'), leaks = el('button', 'btn px', 'Chercher dans les fuites');
  check.title = 'Trop courts, trop simples, utilisés sur plusieurs comptes, pas changés depuis un an'; check.onclick = () => pwCheck(false);
  leaks.title = 'Demande à Have I Been Pwned si un de tes mots de passe est dans une fuite connue. Seuls les 5 premiers caractères de son empreinte SHA-1 sont envoyés : ni le mot de passe, ni son empreinte complète ne quittent ton PC.';
  leaks.onclick = () => pwCheck(true);
  head.append(el('span', 'label', 'Mots de passe · ' + list.length), search, add, check, leaks);
  const bad = p => pwIssues?.[p.id]?.length ? 0 : 1;  // after a check, the ones to change come first
  const rows = list.filter(p => (p.host + ' ' + p.user).toLowerCase().includes(q)).sort((a, b) => bad(a) - bad(b) || a.host.localeCompare(b.host)).map(p => {
    const r = el('div', 'txRow vtRow'), n = el('div', 'tn'), acts = el('div', 'dlInfo'), secret = el('code', 'vtSecret', '••••••••');
    n.append(p.host, el('small', '', (p.user || 'sans identifiant') + ' · gardé le ' + new Date(p.at).toLocaleDateString('fr-FR')), secret);
    const why = pwIssues?.[p.id]; if (why?.length) { r.classList.add('pwBad'); n.append(el('div', 'pwWhy', '⚠ ' + why.join(' · '))); } else if (why) n.append(el('div', 'pwOk', '✓ solide'));
    const act = (label, f) => { const b = el('button', '', label); b.onclick = f; acts.append(b); };
    act('VOIR', async () => { if (secret.textContent !== '••••••••') { secret.textContent = '••••••••'; return; } secret.textContent = await neo.pwReveal(p.id); setTimeout(() => secret.textContent = '••••••••', 15000); });
    act('COPIER', async () => { navigator.clipboard.writeText(await neo.pwReveal(p.id)); toast('Mot de passe copié'); });
    act('OUVRIR', () => newTab('https://' + p.host));
    act('SUPPRIMER', async () => { if (await nbConfirm('Supprimer le mot de passe de ' + (p.user || p.host) + ' sur ' + p.host + ' ?')) { await neo.pwRemove(p.id); pwRender(); } });
    r.append(n, acts); return r;
  });
  card.replaceChildren(head, ...(rows.length ? rows : [el('div', 'hint', list.length ? 'Aucun ne correspond.' : 'Aucun mot de passe. Connecte-toi sur un site : NeoDex propose de l\'enregistrer ici.')]));
}
tbPop.append(el('hr'), tbItem('Sites et données', 'cookies, autorisations', () => newTab('neodex:sites')), tbItem('Mots de passe', 'dans le coffre', () => newTab('neodex:vault')));

/* ---------- le VPN des sites est un plugin (NeoStore) depuis la 3.1.16 : à qui l'avait allumé, on le dit une fois ---------- */
setTimeout(() => neo.getSettings().then(s => { try { if (s.vpn && pluginsReady && !APPS['plugin:neodex.vpn'] && !localStorage.getItem('vpnMoved')) { localStorage.setItem('vpnMoved', '1'); toast('Le VPN est maintenant un plugin : installe « VPN » depuis NeoStore pour le retrouver', true); } } catch {} }), 15000);  // après le chargement des plugins
// le bloqueur de pubs aussi est devenu un plugin (NeoDex 3.2) : dit une fois à ceux qui l'avaient allumé
setTimeout(() => neo.getSettings().then(s => { try { if (s.adblock && pluginsReady && !APPS['plugin:neodex.adblock'] && !localStorage.getItem('adblockMoved')) { localStorage.setItem('adblockMoved', '1'); toast('Le bloqueur de pubs est maintenant un plugin : installe « Bloqueur de pubs » depuis NeoStore pour le retrouver (tes sites exclus sont gardés)', true); } } catch {} }), 16000);
