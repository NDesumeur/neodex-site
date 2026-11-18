/* ---------- Sécurité: what protects the PC, the rights given to NeoDex (with their reason, changeable), the files flagged and the quarantine,
   the state of NeoDex's parts, and what happened. The work is done in security-main.js. ---------- */
const SEC_DONE = {clean: 'Aucun problème trouvé', suspect: 'Suspect', danger: 'Dangereux', unknown: 'Vérification impossible'};
const secDay = t => new Date(t).toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
// a right is asked once, at first use, with what it is for
neo.onSecAsk(d => siteBar({key: 'sec' + d.id, host: d.name, icon: '!', text: ': NeoDex demande cette autorisation ' + d.why + ' ' + d.off,
  actions: [{label: 'Autoriser', main: true, run: () => neo.secAnswer(d.id, true)}, {label: 'Refuser', run: () => neo.secAnswer(d.id, false)}], dismiss: () => {}}));
// a flagged file: why, and your choice
function secAsk(r) {
  siteBar({key: 'alert' + r.sha256, host: r.name, icon: '!', text: (r.verdict === 'danger' ? 'semble dangereux. ' : 'semble suspect. ') + r.reasons.filter(x => x.level !== 'info').map(x => x.text).join(' '),
    actions: [{label: 'Quarantaine', main: true, run: () => neo.secAct('quarantine', r.path).then(() => toast('Mis en quarantaine'))}, {label: 'Supprimer', run: () => neo.secAct('delete', r.path).then(() => toast('Mis à la corbeille'))}, {label: 'Garder', run: () => neo.secAct('keep', r.path).then(() => toast('Fichier gardé'))}]});
}
neo.onSecAlert(secAsk);
neo.onSecBlocked(d => siteBar({key: 'block' + d.id, host: d.host, icon: '!', timeout: 60e3, text: 'a voulu télécharger ' + d.name + ' sans que tu cliques. Bloqué.',
  actions: [{label: 'Télécharger quand même', run: () => neo.secUnblock(d.id)}, {label: 'OK', main: true, run: () => {}}]}));
neo.onSecChanged(() => { if (active?.app === APPS['neodex:security']) secOpen(); });

function secRow(title, sub, ...btns) {
  const r = el('div', 'secRow'), t = el('div', 'secTxt'); t.append(el('b', '', title)); if (sub) t.append(el('small', '', sub));
  r.append(t, ...btns); return r;
}
const secBtn = (label, run, main) => { const b = el('button', 'btn px' + (main ? ' main' : ''), label); b.onclick = () => Promise.resolve(run()).catch(e => toast(e.message.replace(/^.*Error: /, ''), true)); return b; };
async function secOpen() {
  const s = await neo.secStatus();
  // les autorisations (de NeoDex et des plugins) vivent dans l'appli Autorisations : ici, juste un raccourci, pas de doublon
  $('scPerms').replaceChildren(secRow('Autorisations de NeoDex et des plugins', 'Gère au même endroit ce que NeoDex et chaque plugin ont le droit de faire.', secBtn('Ouvrir Autorisations', () => newTab('neodex:perms'), true)));
  $('scQuar').replaceChildren(...(s.quarantine.length ? s.quarantine.map(q => secRow(q.name, secDay(q.at) + ' · ' + (q.why || 'fichier signalé'), secBtn('Remettre', () => neo.secRestore(q.id).then(secOpen)), secBtn('Supprimer', () => neo.secForget(q.id).then(secOpen)))) : [el('div', 'hint', 'Aucun fichier en quarantaine.')]));
  $('scLog').replaceChildren(...(s.log.length ? s.log.slice(0, 30).map(l => secRow(l.text, secDay(l.at) + ' · ' + l.kind)) : [el('div', 'hint', 'Rien à signaler.')]));
  $('scInfo').textContent = s.trusted ? s.trusted + ' fichier(s) gardé(s) à ta demande' : '';
  secParts();
}
async function secParts() {
  const u = await neo.secUpdates(), active = u.av.filter(a => a.on), box = $('scShield');
  box.replaceChildren(active.length ? secRow('Antivirus actif : ' + active.map(a => a.name).join(', '), active.some(a => !a.fresh) ? 'Sa base de virus n\'est pas à jour.' : 'À jour. NeoDex le laisse travailler et ajoute ses vérifications sur les téléchargements.') : secRow('Aucun antivirus actif', 'Windows ne signale aucune protection en temps réel. Active Windows Defender dans les paramètres de Windows.'));
  $('scParts').replaceChildren(secRow('Moteur de NeoDex : Electron ' + u.electron, u.old ? 'Version ' + u.latest + ' disponible. La tienne ne reçoit plus de correctifs de sécurité : à mettre à jour.' : u.latest ? 'Encore suivie (dernière : ' + u.latest + ').' : 'Vérification impossible, pas de réseau ?'),
    secRow('Navigateur : Chromium ' + u.chrome, 'Suit Electron.'), secRow('Blocage des pubs et traqueurs', u.adblock ? 'Plugin Bloqueur de pubs : listes du ' + secDay(u.adblock) : 'Le plugin Bloqueur de pubs n’est pas installé (NeoStore), ou ses listes pas encore chargées. L’anti-pistage de NeoDex reste actif.'), secRow('NeoDex', 'Mis à jour à chaque lancement par ton dossier de synchro.'));
}
$('scCheck').onclick = async () => {
  const r = await neo.secRecheck(); if (!r) return;
  toast(r.name + ' : ' + SEC_DONE[r.verdict]);
  if (r.verdict === 'suspect' || r.verdict === 'danger') secAsk(r);
};
tbPop.append(tbItem('Sécurité', 'antivirus, autorisations, quarantaine', () => newTab('neodex:security')));
