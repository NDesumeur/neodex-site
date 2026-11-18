// part of the NeoDex page (index.html): classic script sharing its global scope, loaded in the order of the page
/* ---------- clock ---------- */
function tick() {
  const d = new Date();
  $('time').textContent = d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
  $('date').textContent = d.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
}
tick(); setInterval(() => document.hidden || tick(), 1000);

/* ---------- links ---------- */
let links = [], editing = null, dragFrom = null, tab = null;  // tab null = all categories
const FAV = '\u0000fav';  // the « ★ Favoris » tab / group: the shortcuts marked l.fav (kept in links.json)
const catOf = l => (l.cat || '').trim() || 'Général';
// plugins système intégrés : ils font partie de NeoDex (livrés avec l'appli, de confiance), non désinstallables
const SYSTEM_PLUGINS = ['neodex:security', 'neodex:perms', 'neodex:notifs', 'neodex:store', 'neodex:files', 'neodex:viewer', 'neodex:fgestion', 'neodex:notes', 'neodex:vault', 'neodex:stats', 'neodex:sites', 'neodex:sound'];
// les applis système (non désinstallables) et les plugins (qui se désinstallent depuis NeoStore) : leur tuile ne se supprime pas ici
const tileLocked = l => (SYSTEM_PLUGINS.includes(l.target) || /^plugin:/.test(l.target));
const catsOf = l => [catOf(l), ...l.cats || []];  // l.cat stays the main one (the phone and old copies read it), l.cats holds the others
const cats = () => [...new Set([...links.map(catOf), ...links.flatMap(l => l.cats || [])])];
function setCats(l, list) {
  let u = [...new Set(list.map(c => c.trim()).filter(Boolean))];
  if (u.length > 1) u = u.filter(c => c !== 'Général');
  l.cat = u[0] === 'Général' ? '' : u[0] || ''; l.cats = u.length > 1 ? u.slice(1) : undefined;
}
const catHidden = c => (prefs.catsHidden || []).includes(c);
async function toggleCat(c) {
  const on = catHidden(c), list = prefs.catsHidden || [];
  if (window.neo) prefs = await neo.setSettings({catsHidden: on ? list.filter(x => x !== c) : [...list, c]});
  toast(on ? 'Catégorie affichée' : '« ' + c + ' » est cachée de « Tout » : son onglet reste là'); render();
}
const isWeb = t => /^https?:\/\//i.test(t);
function normalize(t) {
  t = t.trim().replace(/^"(.*)"$/, '$1');
  // "youtube.com" -> https://youtube.com (not a path, not a scheme)
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t) && !/[\\]/.test(t) && /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(t)) t = 'https://' + t;
  return t;
}
function iconSrc(t) {
  if (APPS[t]) return APPS[t].icon;
  if (isWeb(t)) { try { return 'https://www.google.com/s2/favicons?sz=64&domain=' + new URL(t).hostname; } catch { return ''; } }
  if (/^[a-z]:\\|^\\\\/i.test(t)) return '/api/icon?t=' + TOKEN + '&p=' + encodeURIComponent(t);
  return '';
}
function iconEl(l) {
  const box = document.createElement('div'); box.className = 'ico';
  const letter = () => { box.innerHTML = ''; const b = document.createElement('b'); b.textContent = (l.name || '?')[0].toUpperCase(); box.append(b); };
  const src = l.icon ? fileUrl(l.icon) : iconSrc(l.target);
  if (!src) letter(); else { const img = new Image(); img.onerror = letter; img.src = src; if (l.icon) img.className = 'custom'; else if (APPS[l.target]) img.className = 'art'; box.append(img); }
  return box;
}
function tileEl(l, i) {
  const el = document.createElement('div');
  el.className = 'tile px'; el.draggable = true; el.title = l.target;
  const n = document.createElement('div'); n.className = 'name'; n.textContent = l.name;
  const star = document.createElement('button'); star.className = 'fav' + (l.fav ? ' on' : ''); star.innerHTML = pixIcon(PIX.star);
  star.title = l.fav ? 'Retirer des favoris' : 'Ajouter aux favoris';
  star.onclick = e => { e.stopPropagation(); l.fav = !l.fav || undefined; sfx('notify'); save(); render(); };
  el.append(iconEl(l), n, star);
  el.onclick = () => launch(l, el);
  el.oncontextmenu = e => { e.preventDefault(); openModal(i); };
  el.ondragstart = () => { dragFrom = i; el.classList.add('drag'); };
  el.ondragend = () => el.classList.remove('drag');
  el.ondragover = e => { e.preventDefault(); el.classList.add('over'); };
  el.ondragleave = () => el.classList.remove('over');
  el.ondrop = e => { e.preventDefault(); if (dragFrom === null || dragFrom === i) return render();
    const moved = links.splice(dragFrom, 1)[0]; if (!catsOf(moved).some(c => catsOf(l).includes(c))) setCats(moved, [catOf(l)]);  // dropping on a tile of another category moves it there
    links.splice(i, 0, moved); dragFrom = null; save(); render(); };
  return el;
}
function tabEl(c) {
  const b = document.createElement('button'); b.className = 'tab px' + (c === tab ? ' on' : '') + (c && catHidden(c) ? ' hid' : '');
  const n = document.createElement('span'); n.className = 'n';
  n.textContent = c === FAV ? links.filter(l => l.fav).length : c ? links.filter(l => catsOf(l).includes(c)).length : links.length;
  b.append(c === FAV ? '★ Favoris' : c ?? 'Tout', n);
  b.onclick = () => { tab = c; render(); };
  if (c && c !== FAV) {
    const recat = to => { links.forEach(l => { if (catsOf(l).includes(c)) setCats(l, catsOf(l).map(x => x === c ? to : x)); }); save(); render(); };
    b.title = 'Double-clic : renommer · clic droit : cacher ou montrer · Ctrl + déposer : ajouter à cette catégorie sans quitter l\'autre';
    b.oncontextmenu = e => { e.preventDefault(); toggleCat(c); };
    b.ondblclick = async () => {
      const to = (await ask('RENOMMER LA CATÉGORIE', c))?.trim();
      if (to && to !== c) { tab = to; recat(to === 'Général' ? '' : to); }
    };
    if (c !== 'Général') {
      const x = document.createElement('span'); x.className = 'del'; x.textContent = '×'; x.title = 'Supprimer la catégorie';
      x.onclick = async e => {
        e.stopPropagation();
        if (await nbConfirm('Supprimer la catégorie « ' + c + ' » ?\nSes raccourcis ne sont pas supprimés : ils passent dans « Général ».')) recat('');
      };
      b.append(x);
    }
    b.ondragover = e => { e.preventDefault(); b.classList.add('drop'); };
    b.ondragleave = () => b.classList.remove('drop');
    b.ondrop = e => { e.preventDefault(); if (dragFrom === null) return; const l = links[dragFrom]; setCats(l, e.ctrlKey ? [...catsOf(l), c] : [c, ...l.cats || []]); dragFrom = null; save(); render(); };
  }
  return b;
}
// a category moves up / down by moving all its shortcuts before / after the neighbour's: the order lives in links.json itself (synced, backed up)
function moveCat(c, d) {
  const order = cats(), j = order.indexOf(c) + d;
  if (j < 0 || j >= order.length) return;
  [order[j - d], order[j]] = [order[j], order[j - d]];
  links.sort((a, b) => order.indexOf(catOf(a)) - order.indexOf(catOf(b)));  // shortcut: a category that is never anyone's main one can't move (buttons off); the sort is stable
  sfx('notify'); save(); render();
}
// TRIER: puts the categories (and, if asked, the shortcuts inside them) in an order once; the arrows still move them afterwards
const SORTS = [
  ['Catégories de A à Z', 'ordre alphabétique', (a, b) => a.localeCompare(b, 'fr', {sensitivity: 'base'})],
  ['Catégories de Z à A', 'ordre alphabétique inversé', (a, b) => b.localeCompare(a, 'fr', {sensitivity: 'base'})],
  ["Les plus remplies d'abord", 'nombre de raccourcis', (a, b) => links.filter(l => catOf(l) === b).length - links.filter(l => catOf(l) === a).length],
  ['Général en premier, puis A à Z', 'la catégorie de base en tête', (a, b) => (b === 'Général') - (a === 'Général') || a.localeCompare(b, 'fr', {sensitivity: 'base'})],
];
function sortCats(cmp, inside) {
  const order = cats().sort(cmp), name = (a, b) => a.name.localeCompare(b.name, 'fr', {sensitivity: 'base', numeric: true});
  links.sort((a, b) => order.indexOf(catOf(a)) - order.indexOf(catOf(b)) || (inside ? name(a, b) : 0));  // stable: the tiles keep their order unless asked
  sfx('notify'); save(); render();
}
$('sortBtn').onclick = e => {
  e.stopPropagation();
  const pop = $('sortPop'), r = $('sortBtn').getBoundingClientRect();
  pop.replaceChildren(el('div', 'label', 'TRIER LES CATÉGORIES'), ...SORTS.map(([t, h, cmp]) => tbItem(t, h, () => sortCats(cmp))), el('hr'),
    tbItem('Raccourcis de A à Z', 'dans chaque catégorie, sans bouger les catégories', () => sortCats((a, b) => cats().indexOf(a) - cats().indexOf(b), true)));
  pop.style.top = r.bottom + 6 + 'px'; pop.style.left = r.left + 'px'; pop.style.right = 'auto';
  pop.classList.toggle('on');
};
$('sortPop').addEventListener('click', () => $('sortPop').classList.remove('on'));
document.addEventListener('pointerdown', e => { if (!e.target.closest('#sortPop, #sortBtn')) $('sortPop').classList.remove('on'); }, true);
function render() {
  const q = $('search').value.trim().toLowerCase(), all = cats(), groups = $('groups'), favs = links.some(l => l.fav);
  if (tab && !(tab === FAV ? favs : all.includes(tab))) tab = null;
  $('tabs').replaceChildren(...[null, ...favs ? [FAV] : [], ...all].map(tabEl));
  groups.innerHTML = '';
  let shown = 0;
  // favourites first (only on « Tout » without a search: then every shortcut is still in its own category below)
  for (const c of tab ? [tab] : [...favs && !q ? [FAV] : [], ...all.filter(c => q || !catHidden(c))]) {
    const items = links.map((l, i) => [l, i]).filter(([l]) => (c === FAV ? l.fav : catsOf(l).includes(c)) && (!q || (l.name + ' ' + l.target + ' ' + catsOf(l).join(' ')).toLowerCase().includes(q)));
    if (!items.length) continue;
    if (c !== FAV || tab) shown += items.length;
    const g = document.createElement('div'); g.className = 'group' + (c === FAV ? ' favs' : '');
    const h = document.createElement('div'); h.className = 'groupHead';
    const t = document.createElement('span'); t.className = 'label'; t.textContent = c === FAV ? '★ Favoris' : c;
    const n = document.createElement('span'); n.className = 'count'; n.textContent = items.length;
    const grid = document.createElement('div'); grid.className = 'grid';
    grid.append(...items.map(([l, i]) => { const e = tileEl(l, i); if (c === FAV) { e.draggable = false; e.ondrop = null; } return e; }));  // dropping there would change the tile's category
    h.append(t, n);
    if (c !== FAV && !q) {
      const b = document.createElement('button'); b.className = 'gMove'; b.innerHTML = pixIcon(PIX[catHidden(c) ? 'eye' : 'eyeOff']); b.title = catHidden(c) ? 'Montrer cette catégorie dans « Tout »' : 'Cacher cette catégorie de « Tout »';
      b.onclick = () => toggleCat(c); h.append(b);
    }
    if (c !== FAV && !tab && !q && all.length > 1) {
      const k = all.indexOf(c), main = x => links.some(l => catOf(l) === x);
      for (const [d, pix, title] of [[-1, 'up', 'Monter la catégorie'], [1, 'down', 'Descendre la catégorie']]) {
        const b = document.createElement('button'); b.className = 'gMove'; b.innerHTML = pixIcon(PIX[pix]); b.title = title;
        b.disabled = k + d < 0 || k + d >= all.length || !main(c) || !main(all[k + d]); b.onclick = () => moveCat(c, d);
        h.append(b);
      }
    }
    g.append(h, grid); groups.append(g);
  }
  if (!shown) {
    const e = document.createElement('div'); e.className = 'empty';
    if (q) e.textContent = 'Aucun résultat pour « ' + $('search').value.trim() + ' »';
    else { e.textContent = 'Aucun raccourci pour l\'instant.'; const b = $('addBtn').cloneNode(true); b.removeAttribute('id'); b.onclick = () => openModal(null); e.append(document.createElement('br'), b); }
    groups.append(e);
  }
  if (q) groups.querySelector('.tile')?.classList.add('sel');
  if (!tab && typeof pluginHome === 'function') pluginHome(groups, q);  // les résultats de recherche des plugins
  if (typeof renderWidgets === 'function') renderWidgets();  // le bloc des widgets se cache pendant une recherche
}
const save = () => api('links', links).catch(e => toast('Sauvegarde impossible : ' + e.message, true));

async function launch(l, el) {
  sfx('launch'); el.classList.remove('boom'); void el.offsetWidth; el.classList.add('boom');
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('div'); s.className = 'spark';
    s.style.left = r.left + r.width / 2 + 'px'; s.style.top = r.top + r.height / 2 - 10 + 'px';
    s.style.background = ['#ff5ad9', '#d9c6ff', '#ffffff', '#e01ec8'][i % 4]; const a = i / 10 * 6.28, d = 50 + Math.random() * 30;
    s.style.setProperty('--dx', (Math.cos(a) * d | 0) + 'px'); s.style.setProperty('--dy', (Math.sin(a) * d | 0) + 'px');
    document.body.append(s); setTimeout(() => s.remove(), 550);
  }
  countLaunch(l.name);
  const target = typeof pluginFor === 'function' ? pluginFor(l.target) : l.target;  // une appli retirée du cœur ouvre son plugin
  if (window.neo && (isWeb(target) || APPS[target])) return newTab(target);  // websites and the built-in apps open in a NeoDex tab
  if (typeof PLUGIN_OF !== 'undefined' && PLUGIN_OF[l.target] && !APPS[l.target]) { toast('« ' + l.name + ' » est un plugin : installe-le depuis NeoStore', true); return newTab('neodex:store'); }
  try { await api('open', {target: l.target}); toast('Lancement de ' + l.name); }
  catch (e) { toast('Impossible d\'ouvrir « ' + l.name + ' » : ' + e.message, true); }
}

let toastT;
function toast(msg, err) {
  if (typeof sfx === 'function') sfx(err ? 'error' : 'notify');   // un toast très tôt arrive avant retro.js
  const t = $('toast'); t.textContent = msg; t.className = 'px on' + (err ? ' err' : '');
  clearTimeout(toastT); toastT = setTimeout(() => t.className = 'px', err ? 4000 : 1800);
}

/* ---------- modal ---------- */
function openModal(i) {
  editing = i; const l = i === null ? {name: '', target: ''} : links[i];
  $('mTitle').textContent = i === null ? 'NOUVEAU RACCOURCI' : 'MODIFIER LE RACCOURCI';
  $('fName').value = l.name; $('fTarget').value = l.target;
  $('fCat').value = i === null ? (tab && tab !== FAV && tab !== 'Général' ? tab : '') : [l.cat || '', ...l.cats || []].filter(Boolean).join(', ');
  $('catList').replaceChildren(...cats().filter(c => c !== 'Général').map(c => new Option(c)));
  $('mDel').style.visibility = i === null || tileLocked(l) ? 'hidden' : 'visible';
  $('mUncat').parentNode.style.display = i !== null && l.cat ? '' : 'none';
  $('mUncat').textContent = 'Retirer de « ' + l.cat + ' »';
  editIcon = l.icon || ''; showIcon();
  $('modal').classList.add('on'); $('fName').focus();
}
const closeModal = () => $('modal').classList.remove('on');
async function pick(kind) {
  const path = await browse(kind);
  if (!path) return;
  $('fTarget').value = path;
  if (!$('fName').value) $('fName').value = path.split('\\').filter(Boolean).pop().replace(/\.(exe|lnk|url|bat)$/i, '');
  showIcon();
}
let editIcon = '';
function showIcon() {
  $('fIconPrev').replaceChildren(iconEl({name: $('fName').value.trim() || '?', target: normalize($('fTarget').value), icon: editIcon}));
  $('resetIcon').style.display = editIcon ? '' : 'none';
}
$('pickIcon').onclick = async () => {
  const p = await browse('icon');
  if (!p) return;
  try { editIcon = (await api('seticon', {path: p})).icon; showIcon(); }
  catch (e) { toast('Image impossible à utiliser : ' + e.message, true); }
};
$('resetIcon').onclick = () => { editIcon = ''; showIcon(); };
$('fTarget').onchange = $('fName').onchange = showIcon;
$('addBtn').onclick = () => openModal(null);
$('pickFile').onclick = () => pick('file');
$('pickFolder').onclick = () => pick('folder');
$('mClose').onclick = $('mCancel').onclick = closeModal;
$('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
$('mDel').onclick = async () => { if (tileLocked(links[editing])) return toast('Cette appli se désinstalle depuis NeoStore, ou fait partie de NeoDex', true); if (await nbConfirm('Supprimer « ' + links[editing].name + ' » ?')) { links.splice(editing, 1); save(); render(); closeModal(); } };
$('mUncat').onclick = () => { setCats(links[editing], links[editing].cats || []); save(); render(); closeModal(); };  // keeps the shortcut: its next category, or « Général »
$('mSave').onclick = () => {
  const target = normalize($('fTarget').value), name = $('fName').value.trim() || target;
  if (!target) return toast('Il manque la cible', true);
  const l = {...editing === null ? {} : links[editing], name, target, icon: editIcon};  // {...}: the star must survive an edit
  setCats(l, $('fCat').value.split(','));
  if (editing === null) links.push(l); else links[editing] = l;
  save(); render(); closeModal();
};
$('modal').onkeydown = e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') $('mSave').click(); if (e.key === 'Escape') closeModal(); };

/* ---------- in-app file manager ---------- */
const IMG_EXT = /\.(png|jpe?g|gif|webp|ico|bmp)$/i;
const FOLDER_SVG = '<svg width="38" height="32" viewBox="0 0 12 10" shape-rendering="crispEdges"><path fill="#6229b0" d="M0 1h5v1h7v8H0z"/><path fill="#a77ae8" d="M0 3h12v7H0z"/><path fill="#d9c6ff" d="M1 3h10v1H1z"/><path fill="#7446cc" d="M0 9h12v1H0z"/></svg>';
const fileUrl = p => window.__neoFileUrl?.(p) ?? '/api/file?t=' + TOKEN + '&p=' + encodeURIComponent(p);
// a decor is at most ~1300 art pixels wide: anything bigger would only weigh down the sync
const bgShrink = p => new Promise((ok, ko) => {
  const i = new Image(); i.onerror = () => ko(new Error('format non reconnu'));
  i.onload = () => { const k = Math.min(1, 1600 / i.width), c = document.createElement('canvas'); c.width = i.width * k; c.height = i.height * k; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); neo.bgSave(c.toDataURL('image/jpeg', .82)).then(ok, ko); };
  i.src = fileUrl(p);
});
const iconUrl = p => '/api/icon?t=' + TOKEN + '&p=' + encodeURIComponent(p);
let fm = null, places = null;
const lastDir = {};
function browse(mode) {  // mode: 'file' | 'folder' | 'icon'; resolves with the chosen path, or '' if cancelled
  return new Promise(async resolve => {
    fm = {mode, resolve, sel: '', path: '', parent: '', items: []};
    $('fmTitle').textContent = {file: 'CHOISIR UN FICHIER', folder: 'CHOISIR UN DOSSIER', icon: 'CHOISIR UNE IMAGE'}[mode];
    $('fmOk').textContent = mode === 'folder' ? 'Choisir ce dossier' : 'Choisir';
    $('fm').classList.add('on'); $('fmList').focus();
    try { places ??= await api('places'); } catch (e) { toast(e.message, true); }
    renderPlaces();
    go(lastDir[mode] || (mode === 'icon' ? places?.pictures : places?.desktop) || 'C:\\');
  });
}
function fmClose(path) { $('fm').classList.remove('on'); const r = fm?.resolve; fm = null; r?.(path || ''); }
function renderPlaces() {
  const nav = $('fmPlaces'); nav.innerHTML = '';
  if (!places) return;
  const head = t => { const d = document.createElement('div'); d.className = 'placeHead'; d.textContent = t; nav.append(d); };
  const add = (label, p) => { const b = document.createElement('button'); b.className = 'place'; b.textContent = label; b.title = b.dataset.p = p; b.onclick = () => go(p); nav.append(b); };
  head('ACCÈS RAPIDE');
  add('Bureau', places.desktop); add('Documents', places.documents); add('Téléchargements', places.downloads); add('Images', places.pictures);
  add('Programmes', places.programs); add('Programmes (tous)', places.commonPrograms);
  head('CE PC');
  places.drives.forEach(d => add('Disque ' + d.replace('\\', ''), d));
}
async function go(p) {
  if (!fm) return;
  try {
    const d = await api('ls?p=' + encodeURIComponent(p));
    if (!fm) return;
    Object.assign(fm, {path: d.path, parent: d.parent, sel: ''});
    fm.items = d.items.sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name, 'fr', {numeric: true}));
    lastDir[fm.mode] = d.path;
    $('fmPath').value = d.path; $('fmFilter').value = '';
    renderFm(); $('fmList').scrollTop = 0;
  } catch (e) { toast('Impossible d\'ouvrir ce dossier : ' + e.message, true); }
}
function renderFm() {
  const q = $('fmFilter').value.trim().toLowerCase(), list = $('fmList');
  $('fmPlaces').querySelectorAll('.place').forEach(b => b.classList.toggle('on', b.dataset.p === fm.path));
  $('fmUp').disabled = !fm.parent;
  const shown = fm.items.filter(it => (it.dir || fm.mode === 'file' || (fm.mode === 'icon' && IMG_EXT.test(it.name))) && (!q || it.name.toLowerCase().includes(q)));
  list.innerHTML = '';
  for (const it of shown.slice(0, 1500)) {  // shortcut: huge folders are cut at 1500 entries, add paging if it ever matters
    const el = document.createElement('div'); el.className = 'fe'; el.title = it.path;
    const fi = document.createElement('div'); fi.className = 'fi';
    if (it.dir) fi.innerHTML = FOLDER_SVG;
    else { const img = new Image(); img.loading = 'lazy'; img.src = IMG_EXT.test(it.name) ? fileUrl(it.path) : iconUrl(it.path); img.onerror = () => img.remove(); fi.append(img); }
    const n = document.createElement('span'); n.textContent = it.name;
    el.append(fi, n);
    el.onclick = () => it.dir ? go(it.path) : selectFile(it.path);
    el.ondblclick = () => { if (!it.dir) fmClose(it.path); };
    list.append(el);
  }
  if (!shown.length) list.innerHTML = '<div class="msg">' + (q ? 'Aucun résultat' : fm.mode === 'icon' ? 'Aucune image ici' : 'Dossier vide') + '</div>';
  updateSel();
}
function selectFile(p) { fm.sel = p; $('fmList').querySelectorAll('.fe').forEach(c => c.classList.toggle('sel', c.title === p)); updateSel(); }
function updateSel() {
  const p = fm.mode === 'folder' ? fm.path : fm.sel;
  $('fmSel').textContent = p || (fm.mode === 'icon' ? 'Clique sur une image' : 'Clique sur un fichier');
  $('fmOk').disabled = !p;
}
$('fmOk').onclick = () => fmClose(fm.mode === 'folder' ? fm.path : fm.sel);
$('fmCancel').onclick = $('fmClose').onclick = () => fmClose('');
$('fmUp').onclick = () => fm?.parent && go(fm.parent);
$('fmPath').onkeydown = e => { if (e.key === 'Enter') go($('fmPath').value.trim().replace(/^"(.*)"$/, '$1')); };
$('fmFilter').oninput = renderFm;
$('fm').onclick = e => { if (e.target.id === 'fm') fmClose(''); };
$('fm').onkeydown = e => {
  if (e.key === 'Escape') fmClose('');
  else if (e.key === 'Backspace' && e.target.tagName !== 'INPUT' && fm?.parent) go(fm.parent);
  else if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && !$('fmOk').disabled) $('fmOk').click();
};

