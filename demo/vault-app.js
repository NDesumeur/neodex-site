// découpé de index.html : chargé à la même place que le code d'origine (mêmes variables globales, même ordre)
/* ---------- Coffre-fort app: the files are encrypted on this PC with a password that NeoDex never stores ---------- */
// le coffre en pixels : k = ouverture du couvercle (0 fermé, 1 ouvert) ; lock = l'anse du cadenas qui se lève ; drop = sa chute ; shake = secousse (mauvais code)
function vtChest(cv, k = 0, o = {}) {
  const g = cv.getContext('2d'), P = (c, x, y, w = 1, h = 1) => { if (w > 0 && h > 0) { g.fillStyle = c; g.fillRect(x, y, w, h); } };
  const O = '#1a0f08', W = '#8a5a34', WD = '#5a3a20', WL = '#b07a48', M = '#c9a24a', MD = '#8a6a20';
  g.clearRect(0, 0, 32, 28); g.save(); g.translate(o.shake ? Math.round(Math.sin(o.shake * 40)) : 0, 0);
  P('rgba(0,0,0,.35)', 5, 26, 22, 2);
  P(O, 3, 13, 26, 14); P(W, 4, 14, 24, 12); P(WL, 4, 14, 24, 1); P(WD, 4, 24, 24, 2); P(WD, 4, 18, 24, 1); P(WD, 4, 21, 24, 1);  // le corps, ses planches
  P(M, 8, 14, 2, 12); P(M, 22, 14, 2, 12); P(MD, 9, 14, 1, 12); P(MD, 23, 14, 1, 12);  // les ferrures
  const lh = Math.max(2, Math.round(7 - k * 5)), ly = 13 - lh - Math.round(k * 5);  // le couvercle monte et s'aplatit (vu par l'arrière)
  if (k > 0) { P('#2a160a', 4, ly + lh, 24, 14 - ly - lh); if (k > .5) { P('#ffe9a0', 6, 13, 20, 1); P('rgba(255,200,110,.18)', 6, ly - 3, 20, 3); } }  // l'intérieur, et sa lueur
  P(O, 3, ly - 1, 26, lh + 1); P(O, 5, ly - 2, 22, 1); P(W, 4, ly, 24, lh); P(WL, 5, ly - 1, 22, 1); P(WD, 4, ly + lh - 1, 24, 1);
  P(M, 8, ly - 1, 2, lh + 1); P(M, 22, ly - 1, 2, lh + 1);
  if (k < .3) { P(O, 14, 11, 4, 5); P(M, 15, 12, 2, 3); }  // le fermoir
  const lk = o.lock || 0, dy = Math.round(o.drop || 0);
  if (!o.noLock && dy < 16) {  // le cadenas : l'anse se lève, puis il tombe
    const y0 = 16 + dy, up = Math.round(lk * 2);
    P(O, 13, y0 - 4 - up, 6, 1); P(O, 13, y0 - 4 - up, 1, 4 + up); P(O, 18, y0 - 4 - up, 1, lk < .5 ? 4 + up : 2);
    P(O, 12, y0, 8, 7); P(o.bad ? '#ff4f6d' : '#ffd07a', 13, y0 + 1, 6, 5); P(o.bad ? '#a02840' : '#c48a2c', 13, y0 + 5, 6, 1); P('#fff0c8', 13, y0 + 1, 2, 1); P(O, 15, y0 + 2, 2, 2); P(O, 15, y0 + 4, 2, 1);
  }
  if (k >= 1) for (let i = 0; i < 5; i++) P('#fff0c8', 7 + i * 4, ly - 2 - Math.round((performance.now() / 120 + i * 3) % 6), 1, 1);  // des étincelles
  g.restore();
}
const vtAnim = (dur, f) => new Promise(res => { const t0 = performance.now(), step = t => { const p = Math.min(1, (t - t0) / dur); f(p); p < 1 ? requestAnimationFrame(step) : res(); }; requestAnimationFrame(step); });
async function vtOpenAnim() {  // le bon code : l'anse se lève, le cadenas tombe, le couvercle s'ouvre
  const cv = $('vtChest'); sfx('click');
  await vtAnim(260, p => vtChest(cv, 0, {lock: p}));
  await vtAnim(320, p => vtChest(cv, 0, {lock: 1, drop: p * p * 18}));
  sfx('launch'); await vtAnim(420, p => vtChest(cv, p, {noLock: true}));
  await vtAnim(300, () => vtChest(cv, 1, {noLock: true}));
}
async function vtOpen() {
  const st = await neo.vaultStatus();
  for (const id of ['vtCreate', 'vtUnlock', 'vtMain']) $(id).style.display = 'none';
  if (!st.open) pwIssues = null;  // the password check (vault2.js) is forgotten when the vault is locked
  if (!st.exists) { $('vtCreate').style.display = ''; vtChest($('vtChest2'), 1, {noLock: true}); return setTimeout(() => $('vtPw1').focus()); }
  if (!st.open) { $('vtUnlock').style.display = ''; vtChest($('vtChest'), 0); return setTimeout(() => $('vtPw').focus()); }
  $('vtMain').style.display = '';
  const list = await neo.vaultList();
  $('vtList').replaceChildren(...(list.length ? [...list].sort((a, b) => b.added - a.added).map(it => {
    const r = el('div', 'txRow vtRow'), n = el('div', 'tn'), acts = el('div', 'dlInfo');
    n.append(it.name, el('small', '', exSize(it.size) + ' · ajouté le ' + new Date(it.added).toLocaleDateString('fr-FR')));
    const act = (label, f) => { const b = el('button', '', label); b.onclick = f; acts.append(b); };
    act('OUVRIR', () => neo.vaultOpen(it.id).catch(e => toast(e.message, true)));
    act('SORTIR', () => neo.vaultExport(it.id).then(p => p && toast('Copie déchiffrée : ' + p)).catch(e => toast(e.message, true)));
    act('SUPPRIMER', async () => { if (!await nbConfirm('Supprimer « ' + it.name + ' » du coffre ? Il sera perdu définitivement (sauf si tu en as une autre copie).')) return; await neo.vaultRemove([it.id]); vtOpen(); });
    r.append(el('span', 'd', ''), n, acts);
    return r;
  }) : [el('div', 'hint', 'Le coffre est vide. Glisse des fichiers ici ou clique sur « Ajouter des fichiers… ».')]));
  totpRender(); pwRender();  // the codes (vault2.js) and the passwords (sites.js) under the files
}
async function vtAdd(paths) {
  if (!paths.length) return;
  try { const done = await neo.vaultAdd({paths, bin: $('vtBin').checked}); toast(done.length + ' fichier' + (done.length > 1 ? 's' : '') + ' chiffré' + (done.length > 1 ? 's' : '') + ' dans le coffre'); }
  catch (e) { toast('Impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
  vtOpen();
}
$('vtCreateBtn').onclick = async () => {
  const a = $('vtPw1').value, b = $('vtPw2').value;
  if (a.length < 8) return toast('Au moins 8 caractères', true);
  if (a !== b) return toast('Les deux mots de passe sont différents', true);
  try { await neo.vaultCreate(a); $('vtPw1').value = $('vtPw2').value = ''; vtOpen(); } catch (e) { toast(e.message.replace(/^.*Error: /, ''), true); }
};
$('vtUnlockBtn').onclick = async () => {
  try { await neo.vaultUnlock($('vtPw').value); } catch (e) { $('vtPw').select(); sfx('error'); toast(e.message.replace(/^.*Error: /, ''), true); await vtAnim(360, p => vtChest($('vtChest'), 0, {shake: p < 1 ? p : 0, bad: p < 1})); return; }
  $('vtPw').value = ''; await vtOpenAnim(); vtOpen();
};
$('vtPw').onkeydown = e => { if (e.key === 'Enter') $('vtUnlockBtn').click(); };
$('vtPw2').onkeydown = e => { if (e.key === 'Enter') $('vtCreateBtn').click(); };
$('vtLock').onclick = async () => { await neo.vaultLock(); vtOpen(); };
$('vtAddBtn').onclick = async () => vtAdd(await neo.convPick());
$('vaultApp').ondragover = e => e.preventDefault();
$('vaultApp').ondrop = e => { e.preventDefault(); if ($('vtMain').style.display !== 'none') vtAdd([...e.dataTransfer.files].map(f => neo.pathOf(f))); };
