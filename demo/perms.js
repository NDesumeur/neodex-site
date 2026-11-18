/* ---------- Autorisations : ce que NeoDex et chaque plugin peuvent faire, en clair, modifiable à tout moment.
   Deux vues : par plugin (« que peut faire ce plugin ? ») et par autorisation (« qui peut aller sur Internet ? »).
   En tête, un bilan (ce qui est risqué, non vérifié, pas décidé, plus utilisé), une recherche et des filtres ; chaque plugin
   est une carte repliée qui montre ses autorisations en pastilles, les plus risqués en premier.
   Le sens de chaque autorisation et son risque viennent du registre (app/permissions.json, via perms:describe).
   Couper une autorisation la retire ; si le plugin en a besoin, il la redemande (plugins-main / security-main). ---------- */
const pmSize = b => b < 1024 ? i18n('{n} o', {n: b}) : b < 1048576 ? i18n('{n} Ko', {n: Math.round(b / 1024)}) : i18n('{n} Mo', {n: (b / 1048576).toFixed(1).replace('.', ',')});
const pmDay = t => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const pmAgo = t => { if (!t) return 'jamais utilisée'; const m = Math.round((Date.now() - t) / 60000); return 'utilisée ' + (m < 1 ? 'à l\'instant' : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.round(m / 60) + ' h' : 'le ' + pmDay(t)); };
const PM_RISK = { faible: ['FAIBLE', 'r0'], moyen: ['MOYEN', 'r1'], 'élevé': ['ÉLEVÉ', 'r2'] }, PM_ORDER = { 'élevé': 0, moyen: 1, faible: 2 };
const pmRisk = r => { const [t, c] = PM_RISK[r] || PM_RISK['élevé']; return el('span', 'pmRisk ' + c, t); };
const PM_IDLE = 30 * 864e5;  // une autorisation pas utilisée depuis 30 jours peut être reprise
let pmView = 'plugins', pmQuery = '', pmFilter = '', pmOpen = new Set();
// Oui / Non / Demander : un seul contrôle compact au lieu de trois gros boutons
function pmSeg(state, set) {
  const box = el('div', 'pmSeg');
  for (const [k, t] of [['allow', 'Oui'], ['deny', 'Non'], ['ask', 'Demander']]) {
    const b = el('button', 'btn px' + (state === k || (k === 'ask' && !state) ? ' main' : ''), t);
    b.onclick = () => Promise.resolve(set(k)).catch(e => toast(e.message.replace(/^.*Error: /, ''), true));
    box.append(b);
  }
  return box;
}
// l'état d'une autorisation d'un plugin : once (cette fois), full (comprise dans l'accès complet), allow, deny, '' (pas décidée)
const pmState = (p, n) => p.session.includes(n) ? 'once' : p.perms[n] || (p.perms.full === 'allow' && n !== 'full' ? 'full' : '');
const pmUsed = (p, n) => p.used[n] || (p.perms.full === 'allow' ? p.used.full : 0);
function pmPluginPerm(p, d, label) {
  const state = pmState(p, d.name), set = st => neo.pluginsPermSet(p.id, d.name, st).then(() => pluginsRefresh()).then(permsOpen);
  const r = secRow(label || d.sentence, (state === 'once' ? 'accordée cette fois · ' : state === 'full' ? 'comprise dans l\'accès complet · ' : state === '' ? 'pas encore décidée · ' : '') + pmAgo(pmUsed(p, d.name)), pmSeg(p.perms[d.name], set));
  r.querySelector('.secTxt b').prepend(pmRisk(d.risk), ' ');
  return r;
}
const pmWorst = (p, D) => Math.min(3, ...p.permissions.map(n => PM_ORDER[D.get(n)?.risk] ?? 0));
const pmIcon = p => { const a = APPS['plugin:' + p.id]; const i = el('img', 'pmIco'); i.alt = ''; if (a?.icon) i.src = a.icon; else i.classList.add('none'); return i; };
async function permsOpen() {
  // NeoDex lui-même (security-main) : programmes ouverts, aperçus, vérification en ligne
  const s = await neo.secStatus();
  $('pmNeo').replaceChildren(
    ...s.perms.map(p => secRow(p.name, 'Sert ' + p.why, pmSeg(p.state, st => neo.secPermSet(p.id, st === 'ask' ? '' : st).then(permsOpen)))),
    ...Object.entries(s.noAsk).map(([k, m]) => secRow('Sans confirmation : ' + m, 'Tu as coché « Ne plus demander ».', secBtn('Redemander', () => neo.secAskAgain(k).then(permsOpen)))));

  const list = await neo.pluginsList();
  const all = [...new Set(list.flatMap(p => p.permissions))], D = new Map((await neo.permsDescribe(all)).map(d => [d.name, d]));
  const desc = n => D.get(n) || { name: n, label: n, sentence: n, risk: 'élevé' };
  // le bilan : ce qui mérite un coup d'œil
  const granted = (p, n) => ['allow', 'full'].includes(pmState(p, n));
  const risky = list.filter(p => p.permissions.some(n => desc(n).risk === 'élevé' && granted(p, n)));
  const unverified = list.filter(p => !p.approved), pending = list.filter(p => p.permissions.some(n => !pmState(p, n)));
  const idle = list.flatMap(p => p.permissions.filter(n => desc(n).risk !== 'faible' && p.perms[n] === 'allow' && pmUsed(p, n) && Date.now() - pmUsed(p, n) > PM_IDLE).map(n => [p, n]));
  const sum = el('div', 'pmSum');
  const tile = (n, t, f, cls) => { const b = el('button', 'pmTile ' + cls + (f && pmFilter === f ? ' on' : '')); b.append(el('b', '', String(n)), el('span', '', t)); b.onclick = () => { pmFilter = pmFilter === f ? '' : f; pmView = 'plugins'; permsOpen(); }; return b; };
  sum.append(tile(list.length, 'plugins installés', '', ''), tile(risky.length, 'avec une autorisation à risque élevé', 'risky', risky.length ? 'r2' : ''),
    tile(unverified.length, 'non vérifiés par NeoDex', 'unverified', unverified.length ? 'r1' : ''), tile(pending.length, 'avec une autorisation pas encore décidée', 'pending', ''));
  const blocks = [sum];
  if (idle.length) blocks.push(secRow(idle.length + ' autorisation' + (idle.length > 1 ? 's' : '') + ' plus utilisée' + (idle.length > 1 ? 's' : '') + ' depuis 30 jours',
    idle.slice(0, 6).map(([p, n]) => p.name + ' : ' + desc(n).label).join(' · ') + (idle.length > 6 ? ' …' : '') + '. Les reprendre : le plugin redemandera s\'il en a besoin.',
    secBtn('Tout reprendre', async () => { for (const [p, n] of idle) await neo.pluginsPermSet(p.id, n, 'ask'); await pluginsRefresh(); toast(idle.length + ' autorisation(s) reprise(s)'); permsOpen(); }, true)));
  // la vue, la recherche
  const bar = el('div', 'pmBar'), tabs = el('div', 'sxTabs');
  for (const [k, t] of [['plugins', 'Par plugin'], ['perms', 'Par autorisation']]) { const b = el('button', 'btn px' + (pmView === k ? ' main' : ''), t); b.onclick = () => { pmView = k; permsOpen(); }; tabs.append(b); }
  const q = el('input', 'f pmQ'); q.type = 'search'; q.placeholder = 'Chercher un plugin ou une autorisation'; q.value = pmQuery;
  q.oninput = () => { pmQuery = q.value; clearTimeout(q.t); q.t = setTimeout(() => permsOpen().then(() => { const n = $('pmPlugins').querySelector('.pmQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }), 200); };
  bar.append(tabs, q); blocks.push(bar);
  const norm = t => sxNorm(t || ''), hit = p => !pmQuery || norm(p.name + ' ' + p.permissions.map(n => desc(n).label + ' ' + desc(n).sentence).join(' ')).includes(norm(pmQuery));
  const keep = p => hit(p) && (pmFilter === 'risky' ? risky.includes(p) : pmFilter === 'unverified' ? unverified.includes(p) : pmFilter === 'pending' ? pending.includes(p) : true);
  if (pmFilter) blocks.push(el('div', 'hint', 'Filtre : ' + { risky: 'risque élevé', unverified: 'non vérifiés', pending: 'pas encore décidées' }[pmFilter] + ' · clique à nouveau sur la case pour l\'enlever'));
  if (pmView === 'plugins') {
    // plugins système intégrés : partie de NeoDex, accès complet, non désinstallables
    const sys = (typeof SYSTEM_PLUGINS !== 'undefined' ? SYSTEM_PLUGINS : []).map(id => APPS[id]?.name).filter(Boolean);
    if (sys.length && !pmQuery && !pmFilter) blocks.push(secRow(sys.length + ' applis système', sys.join(', ') + ' : font partie de NeoDex, accès complet, non désinstallables.'));
    const shown = list.filter(keep).sort((a, b) => pmWorst(a, D) - pmWorst(b, D) || a.name.localeCompare(b.name, 'fr'));
    for (const p of shown) {
      const card = el('details', 'pmCard'); card.open = pmOpen.has(p.id) || !!pmQuery || shown.length === 1;
      card.ontoggle = () => card.open ? pmOpen.add(p.id) : pmOpen.delete(p.id);
      const head = el('summary', 'pmCardHead'), name = el('span', 'pmName', p.name + (p.enabled ? '' : ' · désactivé'));
      const chips = el('span', 'pmChips');
      for (const n of p.permissions.slice().sort((a, b) => (PM_ORDER[desc(a).risk] ?? 0) - (PM_ORDER[desc(b).risk] ?? 0))) {
        const st = pmState(p, n), c = el('span', 'pmChip ' + (PM_RISK[desc(n).risk] || PM_RISK['élevé'])[1] + (st === 'deny' ? ' off' : !st ? ' wait' : ''), desc(n).label);
        c.title = desc(n).sentence + ' · ' + (st === 'deny' ? 'refusée' : !st ? 'pas encore décidée' : 'accordée'); chips.append(c);
      }
      if (!p.permissions.length) chips.append(el('span', 'hint', 'aucune autorisation'));
      head.append(pmIcon(p), name, ...(p.approved ? [] : [el('span', 'pmRisk r1', 'NON VÉRIFIÉ')]), chips);
      const acts = el('div', 'pmActs');
      acts.append(secBtn(p.enabled ? 'Désactiver' : 'Réactiver', () => neo.pluginsEnable(p.id, !p.enabled).then(() => pluginsRefresh()).then(permsOpen)),
        secBtn('Réinitialiser', async () => { if (await nbConfirm('Remettre à zéro les autorisations de « ' + p.name + ' » ?\nCelles de base sont redonnées, les autres seront redemandées.')) { await neo.pluginsPermReset(p.id); await pluginsRefresh(); permsOpen(); } }));
      const body = el('div', 'pmCardBody');
      const warn = p.permissions.length ? await neo.permsRisky(p.permissions.filter(n => granted(p, n))) : [];
      for (const w of warn) body.append(el('div', 'pmWarn', '⚠ Combinaison à surveiller : ' + w));
      for (const n of p.permissions) body.append(pmPluginPerm(p, desc(n)));
      // le journal des 7 derniers jours : chaque autorisation utilisée, au plus une fois par heure
      const week = (p.usedLog || []).filter(([at]) => Date.now() - at < 7 * 864e5);
      // les sites joints depuis le démarrage de NeoDex : requêtes, volume, refus (un domaine non déclaré, une adresse du réseau local)
      const net = (p.net || []).slice().sort((a, b) => b.last - a.last);
      if (net.length) { const j = el('details', 'pmWeek'); j.append(el('summary', 'hint', i18n('Connexions Internet depuis le démarrage · {n}', {n: net.length})), ...net.map(h => { const r = el('div', 'hint'); r.append(Object.assign(el('b', '', h.host), {translate: false}), ' · ' + i18n('{n} requête(s)', {n: h.requests}) + ' · ' + pmSize(h.bytes)); if (h.refused) r.append(' · ', el('span', 'pmNetNo', i18n('{n} refusée(s)', {n: h.refused}))); r.append(' · ' + pmDay(h.last)); return r; })); body.append(j); }
      if (week.length) { const j = el('details', 'pmWeek'); j.append(el('summary', 'hint', 'Utilisées ces 7 derniers jours · ' + week.length), ...week.slice().reverse().slice(0, 50).map(([at, n]) => el('div', 'hint', pmDay(at) + ' · ' + desc(n).label))); body.append(j); }
      body.append(acts); card.append(head, body); blocks.push(card);
    }
    if (!shown.length) blocks.push(el('div', 'hint', list.length ? 'Aucun plugin ne correspond.' : 'Aucun plugin installé.'));
  } else {
    // par autorisation : qui peut faire quoi, de la plus risquée à la moins risquée
    for (const n of all.sort((a, b) => (PM_ORDER[desc(a).risk] ?? 0) - (PM_ORDER[desc(b).risk] ?? 0) || a.localeCompare(b))) {
      const d = desc(n), who = list.filter(p => p.permissions.includes(n) && keep(p));
      if (!who.length) continue;
      const card = el('details', 'pmCard'); card.open = pmOpen.has('perm:' + n) || !!pmQuery;
      card.ontoggle = () => card.open ? pmOpen.add('perm:' + n) : pmOpen.delete('perm:' + n);
      const head = el('summary', 'pmCardHead'); head.append(pmRisk(d.risk), el('span', 'pmName', d.label), el('span', 'hint', who.length + ' plugin' + (who.length > 1 ? 's' : '') + ' · ' + d.sentence));
      const body = el('div', 'pmCardBody');
      for (const p of who) body.append(pmPluginPerm(p, d, p.name + (p.approved ? '' : ' (non vérifié)')));
      card.append(head, body); blocks.push(card);
    }
    if (!all.length) blocks.push(el('div', 'hint', 'Aucun plugin ne demande d\'autorisation.'));
  }
  $('pmPlugins').replaceChildren(...blocks);

  // journal commun : installations, mises à jour, changements d'autorisation, révocations
  const plog = (await neo.pluginsLog()).map(l => ({ ...l, src: 'plugin' })), slog = s.log.map(l => ({ ...l, src: 'sécurité' }));
  const logs = [...plog, ...slog].sort((a, b) => b.at - a.at).slice(0, 40);
  $('pmLog').replaceChildren(...(logs.length ? logs.map(l => secRow(l.text, pmDay(l.at) + ' · ' + l.kind + ' · ' + l.src)) : [el('div', 'hint', 'Rien pour l\'instant.')]));
}
neo.onPluginsChanged(() => { if (active?.app === APPS['neodex:perms']) permsOpen(); });
neo.onSecChanged(() => { if (active?.app === APPS['neodex:perms']) permsOpen(); });
tbPop.append(tbItem('Autorisations', 'ce que NeoDex et les plugins peuvent faire', () => newTab('neodex:perms')));
