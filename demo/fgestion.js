/* ---------- fgestion: the sync between your devices (app/main.js + neosync.js), seen and settled here. The conflicts (the same thing
   changed on two devices) side by side, your choice going to every device; the devices with their NeoDex version and last sync;
   the journal of what came from where; the backups, and restoring parts of one. A pill shows on every page while a conflict waits.
   ---------- */
let fg = null;
// small pixel icons of the lists (no emoji: the look of NeoDex)
const FG_ICONS = Object.fromEntries(Object.entries({
  pc: [{c: '#7fe0ee'}, ['oooooooo', 'occcccco', 'occcccco', 'occcccco', 'oooooooo', '...oo...', '.oooooo.', '........']],
  phone: [{c: '#b46aee', w: '#ffffff'}, ['.oooooo.', '.occcco.', '.occcco.', '.occcco.', '.occcco.', '.occcco.', '.oowwoo.', '.oooooo.']],
  got: [{c: '#7fe0ee'}, ['...cc...', '...cc...', '...cc...', '...cc...', '.cccccc.', '..cccc..', '...cc...', '........']],
  ok: [{g: '#5fd08a'}, ['........', '.......g', '......gg', 'g....gg.', 'gg..gg..', '.gggg...', '..gg....', '........']],
  warn: [{r: '#ff4f6d', w: '#ffffff'}, ['...rr...', '..rrrr..', '..rwwr..', '.rrwwrr.', '.rrwwrr.', 'rrrrrrrr', 'rrrwwrrr', 'rrrrrrrr']],
  box: [{y: '#ffd07a', w: '#ffffff'}, ['oooooooo', 'oyyyyyyo', 'oooooooo', 'oyyyyyyo', 'oyywwyyo', 'oyyyyyyo', 'oooooooo', '........']],
  up: [{c: '#7fe0ee'}, ['...cc...', '..cccc..', '.cccccc.', 'cccccccc', '..cccc..', '..cccc..', '..cccc..', '........']],
  merge: [{p: '#ff6ad5'}, ['p......p', 'pp....pp', '.pp..pp.', '..pppp..', '...pp...', '...pp...', '...pp...', '........']],
  lock: [{m: '#a090c8', d: '#5a4a80'}, ['..mmmm..', '.m....m.', '.m....m.', 'mmmmmmmm', 'mddddddm', 'mdd..ddm', 'mddddddm', 'mmmmmmmm']],
  clock: [{y: '#ffd07a', w: '#ffffff'}, ['..yyyy..', '.yw..wy.', 'y...w..y', 'y...w..y', 'y...ww.y', 'y......y', '.y....y.', '..yyyy..']],
}).map(([k, [pal, rows]]) => [k, pixArt(rows, pal, 3)]));
const fgIcon = k => { const i = el('img'); i.src = FG_ICONS[k]; i.alt = ''; return i; };
const SECTION_NAMES = {links: 'Raccourcis', agenda: 'Emploi du temps', notes: 'Notes', budget: 'Budget', journal: 'Journal', games: 'Jeux',
  plugins: 'Plugins installés', music: 'NeoMusic', office: 'Bureautique', tools: 'Outils', pdf: 'NeoPDF', pet: 'NeoMe', settings: 'Paramètres'};
const fgWhen = t => t ? new Date(t).toLocaleString('fr-FR', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'jamais';
const fgPathName = path => path.map(s => typeof s === 'object' ? null : SECTION_NAMES[s] || s).filter(Boolean).join(' › ');
// a value shown to a human: text as is, an item by its fields, a deletion said plainly
function fgShow(v, other) {
  const box = el('div', 'fgVal');
  if (v === undefined) { box.append(el('i', '', 'supprimé sur cet appareil')); return box; }
  if (v === null || typeof v !== 'object') { box.textContent = String(v); return box; }
  if (Array.isArray(v)) { box.textContent = v.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(', ') || '(vide)'; return box; }
  for (const [k, x] of Object.entries(v)) {
    if (k === 'id') continue;
    const line = el('div'), diff = other && typeof other === 'object' && JSON.stringify(other[k]) !== JSON.stringify(x);
    line.append(el('i', '', k + ' : '), diff ? el('mark', '', typeof x === 'object' ? JSON.stringify(x) : String(x)) : document.createTextNode(typeof x === 'object' ? JSON.stringify(x) : String(x)));
    box.append(line);
  }
  return box;
}
async function fgOpen() { try { fgRender(await neo.fgState()); } catch (e) { toast('fgestion : ' + e.message, true); } }
function fgRender(s) {
  fg = s; fgPill();
  $('fgStatus').textContent = !s.file ? 'Synchro désactivée (Paramètres › Synchro)' : 'Dernière synchro ' + fgWhen(s.last) + ' · ' + s.me.name;
  const alerts = [s.error, ...(s.outdated || []).map(n => n + ' utilise une version plus récente de NeoDex : ses changements arriveront quand ce PC sera mis à jour.')].filter(Boolean);
  $('fgAlert').hidden = !alerts.length; $('fgAlert').textContent = alerts.join('\n');
  // conflicts
  $('fgCount').textContent = s.conflicts.length || 'aucun'; $('fgCount').className = 'badge' + (s.conflicts.length ? ' urgent' : ' good');
  $('fgConflicts').replaceChildren(...(s.conflicts.length ? s.conflicts.map(c => {
    const box = el('div', 'fgConf'), h = el('h4', '', c.label); h.append(el('span', '', 'avec ' + c.devName + ' · ' + fgWhen(c.at)));
    const fields = el('div', 'hint', 'En conflit : ' + c.fields.map(f => f.presence ? 'supprimé d’un côté, modifié de l’autre' : fgPathName(f.path.slice(c.path.length)) || 'la valeur').join(', '));
    const sides = el('div', 'fgSides'), mine = el('div', 'fgSide'), theirs = el('div', 'fgSide');
    mine.append(el('b', '', 'Ce PC'), fgShow(c.mine, c.theirs)); theirs.append(el('b', '', c.devName), fgShow(c.theirs, c.mine)); sides.append(mine, theirs);
    const row = el('div', 'row');
    const choose = (choice, label, cls) => { const b = el('button', 'btn px ' + cls, label); b.onclick = () => neo.fgResolve(c.id, choice).then(st => { toast('Choix enregistré : il part sur tous les appareils'); fgRender(st); }, e => toast(e.message.replace(/^.*Error: /, ''), true)); return b; };
    row.append(choose('mine', 'Garder celle de ce PC', 'main'), choose('theirs', 'Garder celle de ' + c.devName, ''));
    if (c.both) row.append(choose('both', 'Garder les deux', 'ghost'));
    box.append(h, fields, sides, row);
    return box;
  }) : [el('div', 'hint', 'Aucun conflit : tout ce qui a changé sur tes appareils est fusionné.')]));
  // devices
  $('fgDevices').replaceChildren(...(s.devices.length ? s.devices.map(d => {
    const r = el('div', 'fgRow'); r.append(fgIcon(d.kind === 'phone' ? 'phone' : 'pc'));
    const t = el('div'); t.append(el('div', '', d.name + (d.me ? ' (ce PC)' : '')), el('small', '', (d.app || 'version inconnue') + ' · dernière synchro ' + fgWhen(d.at)));
    r.append(t, el('span', 'badge' + (d.newer ? ' urgent' : ''), d.newer ? 'plus récent' : 'ok'));
    return r;
  }) : [el('div', 'hint', 'Aucun appareil pour l’instant.')]), ...(s.apk ? [el('div', 'hint', 'Appli téléphone disponible : version ' + s.apk.name + ' (' + fgWhen(s.apk.at) + ')')] : []));
  // le bilan en haut : l'état, les appareils, la dernière synchro, les sauvegardes
  const n = s.conflicts.length, tile = (icon, label, value, cls = '') => { const t = el('div', 'fgTile ' + cls); t.append(fgIcon(icon), el('small', '', label), el('b', '', value)); return t; };
  $('fgSum').replaceChildren(
    tile(!s.file ? 'lock' : n ? 'warn' : 'ok', 'ÉTAT', !s.file ? 'Désactivée' : n ? n + (n > 1 ? ' conflits' : ' conflit') : 'Tout est à jour', !s.file ? '' : n ? 'bad' : 'good'),
    tile('pc', 'APPAREILS', String(s.devices.length)),
    tile('clock', 'DERNIÈRE SYNCHRO', fgWhen(s.last)),
    tile('box', 'SAUVEGARDES', String(s.backups.length)),
    tile('box', 'SAUVEGARDES : PLACE', fgSize(s.backupSize)));
  $('fgSum').lastChild.title = 'Sauvegardes sur ce PC : ' + fgSize(s.backupSize) + (s.file ? ' · fichiers de synchro dans le nuage : ' + fgSize(s.syncSize) : '');
  if (s.backups.length > 10) {
    const b = el('button', 'btn px', 'FAIRE DE LA PLACE'); $('fgSum').lastChild.append(b);
    b.onclick = async () => { if (await nbConfirm('Garder seulement les 10 sauvegardes les plus récentes, et effacer les autres ?\nCe qui est effacé ne pourra plus être restauré.')) neo.fgPrune().then(st => { fgRender(st); toast('Place faite'); }, e => toast(e.message, true)); };
  }
  fgCrypt(s);
  fgPlugs();
  // journal
  $('fgLog').replaceChildren(...(s.log.length ? s.log.map(l => {
    const r = el('div', 'fgRow'); r.append(fgIcon(l.kind === 'choix' ? 'ok' : l.conflicts ? 'warn' : 'got'));
    const what = l.kind === 'choix' ? 'Choix : ' + l.label + ' → ' + ({mine: 'version de ce PC', theirs: 'autre version', both: 'les deux'})[l.choice]
      : (l.sections.map(k => SECTION_NAMES[k] || k).join(', ') || 'rien de neuf') + (l.conflicts ? ' · ' + l.conflicts + ' conflit(s)' : '');
    const t = el('div'); t.append(el('div', '', what), el('small', '', (l.kind === 'choix' ? '' : 'de ' + l.dev + ' · ') + fgWhen(l.at)));
    r.append(t, el('span'));
    return r;
  }) : [el('div', 'hint', 'Rien de reçu des autres appareils pour l’instant.')]));
  // backups, par jour (seul le plus récent est déplié)
  const days = new Map();
  for (const b of s.backups) { const d = new Date(b.at).toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}); if (!days.has(d)) days.set(d, []); days.get(d).push(b); }
  $('fgBackups').replaceChildren(...(s.backups.length ? [...days].map(([day, list], i) => {
    const det = el('details', 'fgDay'), sum = el('summary', '', day.toUpperCase() + ' · ' + list.length); det.open = !i;
    det.append(sum, ...list.map(fgBackupRow)); return det;
  }) : [el('div', 'hint', 'Pas encore de sauvegarde.')]));
}
const fgSize = n => !n ? '0' : n < 1 << 20 ? Math.max(1, Math.round(n / 1024)) + ' Ko' : (n / (1 << 20)).toFixed(n < 10 << 20 ? 1 : 0) + ' Mo';
const fgAppName = k => SECTION_NAMES[k] || pluginInfo.get(k)?.name || k;
function fgBackupRow(b) {
    const wrap = el('div'), r = el('div', 'fgRow fgBackup');
    r.append(fgIcon('box'), el('div', '', new Date(b.at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) + '  ·  ' + b.name.replace(/\.neobase$/, '')), el('small', '', fgSize(b.size)));
    r.onclick = async () => {
      if (wrap.querySelector('.fgRestore')) return wrap.querySelector('.fgRestore').remove();
      const secs = await neo.fgBackup(b.name).catch(e => { toast(e.message.replace(/^.*Error: /, ''), true); return null; }); if (!secs) return;
      const box = el('div', 'fgRestore');
      secs.sort((a, b) => a.same - b.same || fgAppName(a.name).localeCompare(fgAppName(b.name)));
      const same = secs.filter(x => x.same);
      if (!secs.some(x => !x.same)) box.append(el('div', 'hint', 'Rien ne changerait : cette sauvegarde est identique à maintenant.'));
      for (const x of secs.filter(x => !x.same)) { const l = el('label'), c = el('input'); c.type = 'checkbox'; c.value = x.keys.join('\n'); c.dataset.app = x.name; c.disabled = x.same;
        l.append(c, ' ' + fgAppName(x.name) + (x.same ? ' — identique à maintenant' : ' — ' + (x.changes > 999 ? 'plus de 1000' : x.changes) + (x.changes > 1 ? ' éléments changeraient' : ' élément changerait'))); box.append(l); }
      if (same.length) { const h = el('div', 'hint', same.length + ' autre' + (same.length > 1 ? 's' : '') + ' identique' + (same.length > 1 ? 's' : '') + ' à maintenant : ' + same.map(x => fgAppName(x.name)).join(', ')); box.append(h); }
      const go = el('button', 'btn px main', 'Restaurer la sélection');
      go.onclick = async () => {
        const boxes = [...box.querySelectorAll('input:checked')], picked = boxes.flatMap(c => c.value.split('\n')), names = boxes.map(c => fgAppName(c.dataset.app));
        if (!picked.length) return toast('Coche ce qu’il faut restaurer', true);
        if (!await nbConfirm('Remettre ' + names.join(', ') + ' comme le ' + fgWhen(b.at) + ' ?\nUne sauvegarde de maintenant est faite avant, et le changement part sur tous les appareils.')) return;
        const done = await neo.fgRestore(b.name, picked).catch(e => { toast(e.message.replace(/^.*Error: /, ''), true); return null; });
        if (done) { toast('Restauré : ' + names.join(', ')); fgOpen(); }
      };
      box.append(go); wrap.append(box);
    };
    wrap.prepend(r);
    return wrap;
}
// le chiffrement de la synchro : un mot de passe par appareil, le même partout
function fgCrypt(s) {
  const box = $('fgCrypt'); box.hidden = !s.file; if (!s.file) return;
  const inp = el('input', 'f'); inp.type = 'password'; inp.placeholder = 'Mot de passe'; inp.autocomplete = 'new-password';
  const send = (pass, ok) => neo.fgSyncPass(pass).then(st => { fgRender(st); toast(ok); }, e => toast(e.message.replace(/^.*Error: /, ''), true));
  const go = el('button', 'btn px main', s.needPass ? 'DÉVERROUILLER' : s.encrypted ? 'CHANGER' : 'CHIFFRER LA SYNCHRO');
  go.onclick = () => inp.value.length < 8 ? toast('8 caractères au moins', true) : send(inp.value, s.encrypted ? 'Mot de passe changé : mets le même sur tes autres appareils' : 'Synchro chiffrée');
  inp.onkeydown = e => e.key === 'Enter' && go.click();
  const text = s.needPass ? 'Un autre appareil a chiffré la synchro. Entre le même mot de passe ici : rien n’est synchronisé en attendant.'
    : s.encrypted ? 'Synchro chiffrée : ton nuage ne voit qu’un fichier illisible. Chaque appareil doit avoir le même mot de passe.'
    : 'Le fichier de synchro est lisible par quiconque accède à ton nuage. Un mot de passe le chiffre (demandé une fois sur chaque appareil). Oublié, il n’est pas récupérable, mais tes données restent sur chaque appareil.';
  box.replaceChildren(fgIcon(s.encrypted && !s.needPass ? 'ok' : 'lock'), el('div', 'hint', text), inp, go);
  if (s.encrypted) { const off = el('button', 'btn px ghost', 'RETIRER'); off.onclick = async () => { if (await nbConfirm('Ne plus chiffrer la synchro sur ce PC ?\nSes fichiers repassent en clair dans le nuage.')) send('', 'Chiffrement retiré sur ce PC'); }; box.append(off); }
}
// les applis : comment chacune est synchronisée (champ « syncMode » de son plugin.json, expliqué par « syncInfo »), triées par mode
const FG_MODES = [['progression', 'Progression', 'up', '#7fe0ee', 'Le plus avancé gagne (niveau, record, déblocages). Jamais de conflit.'],
  ['fusion', 'Fusion', 'merge', '#ff6ad5', 'Les ajouts et suppressions des deux côtés sont gardés. Même chose changée des deux côtés : tu choisis.'],
  ['aucune', 'Pas synchronisée', 'lock', '#a090c8', 'Ses données restent sur ce PC.']];
let fgMode = '';
function fgPlugs() {
  const all = [...pluginInfo.values()], q = $('fgPlugQ').value.trim().toLowerCase(), mode = p => p.syncMode || 'fusion';
  $('fgModes').replaceChildren(...FG_MODES.map(([k, name, icon, c, why]) => {
    const b = el('button', 'fgMode' + (fgMode === k ? ' on' : '')); b.style.setProperty('--mc', c);
    b.append(fgIcon(icon), el('b', '', name.toUpperCase()), el('i', '', String(all.filter(p => mode(p) === k).length)), el('span', '', why));
    b.title = fgMode === k ? 'Revoir toutes les applis' : 'Ne voir que : ' + name;
    b.onclick = () => { fgMode = fgMode === k ? '' : k; fgPlugs(); };
    return b;
  }));
  const list = all.filter(p => (!fgMode || mode(p) === fgMode) && (!q || (p.name + ' ' + (p.syncInfo || '')).toLowerCase().includes(q)))
    .sort((a, b) => FG_MODES.findIndex(m => m[0] === mode(a)) - FG_MODES.findIndex(m => m[0] === mode(b)) || a.name.localeCompare(b.name));
  $('fgPlugins').replaceChildren(...(list.length ? list.map(p => {
    const m = FG_MODES.find(x => x[0] === mode(p)) || FG_MODES[1], r = el('div', 'fgRow'), t = el('div'), i = el('img'), tag = el('span', 'fgTag', m[1].toUpperCase());
    i.src = pluginIconUrl(p); i.alt = ''; tag.style.setProperty('--mc', m[3]);
    t.append(el('div', '', p.name), el('small', '', p.syncInfo || m[4])); t.title = p.syncInfo || m[4];
    r.append(i, t, tag); return r;
  }) : [el('div', 'hint', 'Aucune appli ne correspond.')]));
}
console.assert(FG_MODES.length === 3 && FG_ICONS.up && FG_ICONS.merge && FG_ICONS.lock && FG_ICONS.clock, 'fgestion');
// the pill on every page while a conflict waits
function fgPill() {
  let p = $('fgPill');
  const n = fg?.conflicts.length || 0;
  if (!n) return p?.remove();
  if (!p) { p = el('div'); p.id = 'fgPill'; p.onclick = () => newTab('neodex:fgestion'); document.body.append(p); }
  p.textContent = '! ' + n + (n > 1 ? ' conflits de synchro' : ' conflit de synchro') + ' · fgestion';
}
if (window.neo?.fgState) {
  $('fgPlugQ').oninput = () => fgPlugs();
  $('fgSyncNow').onclick = () => neo.fgSync().then(s => { fgRender(s); toast('Synchronisé'); }, e => toast(e.message, true));
  neo.onSyncChanged(() => neo.fgState().then(s => { if (active?.app === APPS['neodex:fgestion']) fgRender(s); else { fg = s; fgPill(); } }, () => {}));
  neo.onFgOpen(() => newTab('neodex:fgestion'));
  setTimeout(() => neo.fgState().then(s => { fg = s; fgPill(); }, () => {}), 4000);
}
