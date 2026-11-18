// découpé de index.html : chargé à la même place que le code d'origine (mêmes variables globales, même ordre)
/* ---------- Fichiers app: a file explorer (apps-main.js does the disk work; "Supprimer" sends to the Recycle Bin) ---------- */
const EX_FOLDER = artImg('files');
const EX_IMG = /\.(png|jpe?g|gif|webp|bmp|ico)$/i;
const ex = {dir: '', back: [], fwd: [], items: [], sel: new Set(), view: 'grid', sort: 'name', filter: '', clip: null, places: null, last: null};
const exSize = b => b < 1024 ? b + ' o' : b < 1048576 ? Math.round(b / 1024) + ' Ko' : b < 1073741824 ? (b / 1048576).toFixed(1).replace('.', ',') + ' Mo' : (b / 1073741824).toFixed(1).replace('.', ',') + ' Go';
async function exOpen() {
  ex.places ??= await neo.places();
  if (!ex.dir) return exGo(ex.places.home);
  exRender();
}
async function exGo(dir, push = true) {
  try { const r = await neo.fsList(dir); if (push && ex.dir && ex.dir !== r.path) { ex.back.push(ex.dir); ex.fwd = []; } ex.dir = r.path; ex.parent = r.parent; ex.items = r.items; ex.sel.clear(); ex.last = null; exRender(); }
  catch (e) { toast("Impossible d'ouvrir ce dossier : " + e.message.replace(/^.*Error: /, ''), true); }
}
const exRefresh = () => exGo(ex.dir, false);
function exSorted() {
  const q = ex.filter.trim().toLowerCase(), list = ex.items.filter(i => !q || i.name.toLowerCase().includes(q)), ext = n => n.includes('.') ? n.split('.').pop().toLowerCase() : '';
  const by = {name: (a, b) => a.name.localeCompare(b.name, 'fr', {numeric: true}), date: (a, b) => b.mtime - a.mtime, size: (a, b) => b.size - a.size, type: (a, b) => ext(a.name).localeCompare(ext(b.name)) || a.name.localeCompare(b.name, 'fr')}[ex.sort];
  return list.sort((a, b) => (b.dir - a.dir) || by(a, b));  // folders first
}
function exRender() {
  const pl = ex.places, place = (name, p) => { const b = el('button', 'place' + (ex.dir.toLowerCase() === p.toLowerCase() ? ' on' : ''), name); b.title = p; b.onclick = () => exGo(p); return b; };
  $('exPlaces').replaceChildren(el('div', 'placeHead', 'ACCÈS RAPIDE'), place('Dossier perso', pl.home), ...pl.known.map(k => place(k.name, k.path)), ...(pl.onedrive ? [place('OneDrive', pl.onedrive)] : []),
    el('div', 'placeHead', 'LECTEURS'), ...pl.drives.map(d => place('Disque ' + d.slice(0, 2), d)));
  $('exPath').value = ex.dir;
  $('exBack').disabled = !ex.back.length; $('exFwd').disabled = !ex.fwd.length; $('exUp').disabled = !ex.parent;
  const list = exSorted(), box = $('exList');
  box.className = ex.view === 'grid' ? 'exGrid' : 'exRows';
  box.replaceChildren(...(list.length ? [] : [el('div', 'hint', ex.filter ? 'Aucun élément ne correspond.' : 'Dossier vide.')]));
  if (ex.view === 'rows' && list.length) { const h = el('div', 'exRow head'); h.append(el('span'), el('span', '', 'Nom'), el('span', '', 'Modifié le'), el('span', '', 'Taille')); box.append(h); }
  for (const it of list) {
    const r = el('div', (ex.view === 'grid' ? 'exItem' : 'exRow') + (ex.sel.has(it.path) ? ' sel' : '') + (ex.clip?.move && ex.clip.paths.includes(it.path) ? ' cut' : '')), ic = el('img');
    ic.loading = 'lazy'; ic.src = it.dir ? EX_FOLDER : EX_IMG.test(it.name) ? fileUrl(it.path) : '/api/icon?t=' + TOKEN + '&p=' + encodeURIComponent(it.path);
    ic.onerror = () => { ic.src = EX_FOLDER; ic.style.opacity = .3; };
    if (EX_IMG.test(it.name)) ic.className = 'thumb';
    r.append(ic, el('span', 'tn', it.name));
    if (ex.view === 'rows') r.append(el('span', 'd', new Date(it.mtime).toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'})), el('span', 'd', it.dir ? '' : exSize(it.size)));
    r.title = it.name + (it.dir ? '' : ' · ' + exSize(it.size)) + ' · ' + new Date(it.mtime).toLocaleString('fr-FR');
    r.onclick = e => exSelect(it, e, list);
    r.ondblclick = () => exActivate(it);
    r.oncontextmenu = e => { e.preventDefault(); if (!ex.sel.has(it.path)) { ex.sel = new Set([it.path]); exRender(); } exMenu(e); };
    box.append(r);
  }
  const selItems = ex.items.filter(i => ex.sel.has(i.path)), total = selItems.reduce((s, i) => s + (i.dir ? 0 : i.size), 0);
  $('exStatus').textContent = list.length + ' élément' + (list.length > 1 ? 's' : '') + (selItems.length ? ' · ' + selItems.length + ' sélectionné' + (selItems.length > 1 ? 's' : '') + (total ? ' (' + exSize(total) + ')' : '') : '') + (ex.clip ? ' · ' + ex.clip.paths.length + (ex.clip.move ? ' à déplacer' : ' à copier') + ' : Ctrl+V pour coller' : '');
}
function exSelect(it, e, list) {
  if (e.shiftKey && ex.last) { const a = list.findIndex(i => i.path === ex.last), b = list.findIndex(i => i.path === it.path); ex.sel = new Set(list.slice(Math.min(a, b), Math.max(a, b) + 1).map(i => i.path)); }
  else if (e.ctrlKey) { ex.sel.has(it.path) ? ex.sel.delete(it.path) : ex.sel.add(it.path); ex.last = it.path; }
  else { ex.sel = new Set([it.path]); ex.last = it.path; }
  exRender();
}
const exActivate = it => it.dir ? exGo(it.path) : viewFile(it.path);
const exSelected = () => ex.items.filter(i => ex.sel.has(i.path));
const EX_ACT = {
  open: () => exSelected().forEach(exActivate),
  reveal: () => neo.showFile(exSelected()[0]?.path || ex.dir),
  rename: async () => {
    const it = exSelected()[0]; if (!it) return;
    const n = await ask('RENOMMER', it.name, ''); if (!n || n === it.name) return;
    try { await neo.fsRename({file: it.path, name: n}); exRefresh(); } catch (e) { toast('Renommage impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
  },
  copy: () => { ex.clip = {paths: [...ex.sel], move: false}; exRender(); },
  cut: () => { ex.clip = {paths: [...ex.sel], move: true}; exRender(); },
  paste: async () => {
    if (!ex.clip) return;
    try { const done = await neo.fsPaste({paths: ex.clip.paths, dest: ex.dir, move: ex.clip.move}); if (ex.clip.move) ex.clip = null; await exRefresh(); ex.sel = new Set(done); exRender(); toast(done.length + ' élément' + (done.length > 1 ? 's' : '') + ' collé' + (done.length > 1 ? 's' : '')); }
    catch (e) { toast('Impossible : ' + e.message.replace(/^.*Error: /, ''), true); exRefresh(); }
  },
  trash: async () => {
    const it = exSelected(); if (!it.length) return;
    if (!await nbConfirm('Mettre à la corbeille ' + (it.length > 1 ? 'ces ' + it.length + ' éléments' : '« ' + it[0].name + ' »') + ' ? (Tu pourras les récupérer depuis la corbeille de Windows.)')) return;
    try { await neo.fsTrash(it.map(i => i.path)); toast('Mis à la corbeille'); } catch (e) { toast('Impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
    exRefresh();
  },
  mkdir: async () => { const n = await ask('NOUVEAU DOSSIER', 'Nouveau dossier', ''); if (!n) return; try { const p = await neo.fsMkdir({dir: ex.dir, name: n}); await exRefresh(); ex.sel = new Set([p]); exRender(); } catch (e) { toast('Impossible : ' + e.message.replace(/^.*Error: /, ''), true); } },
  convert: () => { const files = exSelected().filter(i => !i.dir).map(i => i.path); if (!files.length) return; if (pluginInfo.has('neodex.convertir')) pluginOpenFiles('neodex.convertir', files); else toast('Installe Convertir depuis NeoStore', true); },
  paint: () => { const it = exSelected().find(i => EX_IMG.test(i.name)); if (it) { if (pluginInfo.has('neodex.paint')) pluginOpenFiles('neodex.paint', [it.path]); else toast('Installe Paint depuis NeoStore', true); } },
  shortcut: () => { for (const it of exSelected()) links.push({name: it.name.replace(/\.(lnk|exe|url)$/i, ''), target: it.path, cat: ''}); save(); render(); toast('Ajouté à tes raccourcis'); },
  all: () => { ex.sel = new Set(exSorted().map(i => i.path)); exRender(); },
};
function exMenu(e) {
  const it = exSelected(), m = $('exMenu'), one = it.length === 1, files = it.filter(i => !i.dir).length, img = it.some(i => EX_IMG.test(i.name));
  const entries = it.length ? [['open', 'Ouvrir', 'Entrée'], ['reveal', "Afficher dans l'Explorateur Windows"], null, ['copy', 'Copier', 'Ctrl+C'], ['cut', 'Couper', 'Ctrl+X'], ...(ex.clip ? [['paste', 'Coller ici', 'Ctrl+V']] : []),
    ...(one ? [['rename', 'Renommer', 'F2']] : []), ['trash', 'Mettre à la corbeille', 'Suppr'], null, ...(files ? [['convert', 'Convertir…']] : []), ...(img ? [['paint', 'Modifier dans Paint']] : []), ['shortcut', 'Ajouter aux raccourcis de l\'accueil']]
    : [...(ex.clip ? [['paste', 'Coller ici', 'Ctrl+V']] : []), ['mkdir', 'Nouveau dossier'], ['reveal', "Ouvrir dans l'Explorateur Windows"], ['all', 'Tout sélectionner', 'Ctrl+A']];
  m.replaceChildren(...entries.map(x => { if (!x) return el('hr'); const b = el('button'); b.append(el('span', '', x[1]), el('kbd', '', x[2] || '')); b.onclick = () => { m.classList.remove('on'); EX_ACT[x[0]](); }; return b; }));
  m.classList.add('on');
  m.style.left = Math.min(e.clientX, innerWidth - m.offsetWidth - 8) + 'px'; m.style.top = Math.min(e.clientY, document.body.clientHeight - m.offsetHeight - 8) + 'px';
}
document.addEventListener('mousedown', e => { if (!e.target.closest('#exMenu')) $('exMenu').classList.remove('on'); });
$('exList').oncontextmenu = e => { if (e.target === $('exList')) { e.preventDefault(); ex.sel.clear(); exRender(); exMenu(e); } };
$('exList').onclick = e => { if (e.target === $('exList')) { ex.sel.clear(); exRender(); } };
$('exBack').onclick = () => { const d = ex.back.pop(); if (d) { ex.fwd.push(ex.dir); exGo(d, false); } };
$('exFwd').onclick = () => { const d = ex.fwd.pop(); if (d) { ex.back.push(ex.dir); exGo(d, false); } };
$('exUp').onclick = () => ex.parent && exGo(ex.parent);
$('exRefresh').onclick = exRefresh;
$('exPath').onkeydown = e => { if (e.key === 'Enter') exGo(e.target.value.trim().replace(/^"(.*)"$/, '$1')); };
$('exFilter').oninput = e => { ex.filter = e.target.value; exRender(); };
$('exSort').onchange = e => { ex.sort = e.target.value; exRender(); };
$('exViewBtn').onclick = () => { ex.view = ex.view === 'grid' ? 'rows' : 'grid'; $('exViewBtn').textContent = ex.view === 'grid' ? 'LISTE' : 'ICÔNES'; exRender(); };
$('exNewDir').onclick = EX_ACT.mkdir;
document.addEventListener('keydown', e => {
  if (active?.app !== APPS['neodex:files'] || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('#askModal.on')) return;
  const k = e.key.toLowerCase(), act = f => { e.preventDefault(); EX_ACT[f](); };
  if (e.ctrlKey && k === 'c') act('copy'); else if (e.ctrlKey && k === 'x') act('cut'); else if (e.ctrlKey && k === 'v') act('paste'); else if (e.ctrlKey && k === 'a') act('all');
  else if (k === 'delete') act('trash'); else if (k === 'f2') act('rename'); else if (k === 'enter' && ex.sel.size) act('open');
  else if (k === 'backspace') { e.preventDefault(); $('exUp').click(); }
});
