/* ---------- the viewer: pictures, sound, video, documents, and anything else as text or raw bytes (viewer-main.js reads the files) ---------- */
const vw = {path: '', list: [], i: 0, zoom: 1, x: 0, y: 0};
const vwSize = n => n < 1024 ? n + ' o' : n < 1048576 ? (n / 1024).toFixed(1) + ' Ko' : n < 1073741824 ? (n / 1048576).toFixed(1) + ' Mo' : (n / 1073741824).toFixed(2) + ' Go';
const vwSay = t => { const h = el('div', 'hint', t); h.style.padding = '24px'; return h; };
function vwOpen() { if (!$('vwBody').children.length) $('vwBody').append(vwSay('Choisis un fichier, ou dépose-le ici : image, son, vidéo, PDF, document, archive, ou n\'importe quel autre type.')); }
function vwTools(on) { for (const id of ['vwWin', 'vwWith', 'vwDir']) $(id).style.display = on ? '' : 'none'; }
function vwNav() { const many = vw.list.length > 1; $('vwPrev').style.display = $('vwNext').style.display = many ? '' : 'none'; }
function vwImage(src) {
  const box = el('div', 'vwPic'), img = new Image(), place = () => { img.style.transform = `translate(${vw.x}px,${vw.y}px) scale(${vw.zoom})`; };
  vw.zoom = 1; vw.x = vw.y = 0;
  img.onerror = () => box.replaceChildren(vwSay('Cette image ne peut pas être affichée ici.'));
  img.draggable = false; img.src = src; box.append(img);
  box.onwheel = e => { e.preventDefault(); vw.zoom = Math.min(16, Math.max(.1, vw.zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); place(); };
  box.ondblclick = () => { vw.zoom = 1; vw.x = vw.y = 0; place(); };
  box.onpointerdown = e => {
    box.setPointerCapture(e.pointerId);
    const x0 = e.clientX - vw.x, y0 = e.clientY - vw.y;
    box.onpointermove = m => { vw.x = m.clientX - x0; vw.y = m.clientY - y0; place(); };
    box.onpointerup = () => { box.onpointermove = null; };
  };
  return box;
}
function vwMedia(tag, src) {
  const m = el(tag, 'vwMedia'); m.controls = true; m.autoplay = true; m.src = src;
  m.onerror = () => m.replaceWith(vwSay('NeoDex ne sait pas lire ce format. « Ouvrir avec Windows » le confiera à ton lecteur habituel.'));
  return m;
}
// a document never runs in NeoDex: no scripts, nothing loaded from outside
function vwDoc(html) {
  const f = el('iframe', 'vwDoc'); f.sandbox = '';
  f.srcdoc = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>body{font:15px/1.5 Segoe UI,sans-serif;max-width:900px;margin:24px auto;padding:0 20px;color:#1a1426;background:#fff}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:3px 7px}img{max-width:100%}</style>${html}`;
  return f;
}
async function vwShow(p) {
  let r;
  try { r = await neo.viewRead(p); } catch (e) { return toast('Impossible de lire ce fichier : ' + e.message.replace(/^.*Error: /, ''), true); }
  if (r.kind === 'pdf') { return openWithPlugin([p]).then(ok => ok || toast('Installe NeoPDF depuis NeoStore pour ouvrir ce PDF', true)); }
  document.querySelectorAll('#vwBody audio, #vwBody video').forEach(m => m.pause());
  vw.path = p; vw.list = r.siblings || [p]; vw.i = vw.list.indexOf(p);
  vwTools(true); vwNav();
  $('vwInfo').textContent = r.name + ' · ' + vwSize(r.size) + (r.cut ? ' · début seulement' : '');
  const pre = t => { const e = el('pre', 'vwText'); e.textContent = t; return e; };
  $('vwBody').replaceChildren(
    r.kind === 'image' ? vwImage(r.url) : r.kind === 'audio' || r.kind === 'video' ? vwMedia(r.kind, r.url) : r.kind === 'doc' ? vwDoc(r.html) :
    r.kind === 'list' ? pre(r.text.trim() || 'Archive vide') : pre(r.text));
  if (r.kind === 'hex') $('vwBody').prepend(vwSay('Fichier binaire : voici ses premiers octets. « Ouvrir avec… » te laisse choisir un programme.'));
}
function vwUrl(url, kind) {  // a picture or a video of a website: nothing on disk, so no file buttons
  newTab('neodex:viewer'); vw.path = ''; vw.list = []; vwTools(false); vwNav();
  $('vwInfo').textContent = decodeURIComponent(url.split(/[?#]/)[0].split('/').pop()).slice(0, 80);
  $('vwBody').replaceChildren(kind === 'image' ? vwImage(url) : vwMedia(kind, url));
}
function vwStep(d) { if (vw.list.length > 1) vwShow(vw.list[(vw.i + d + vw.list.length) % vw.list.length]); }
// every « open this file » of NeoDex: programs start, what the viewer knows opens there, the rest goes to its Windows program and comes here if it has none
async function viewFile(p) {
  const k = await neo.viewKind(p);
  if (k === 'run' || k === 'other') {
    const err = await neo.openFile(p);
    if (!err || k === 'run') { if (err) toast(err, true); return; }
    if (err === 'Ouverture annulée') return;
  }
  if (k === 'pdf') { return openWithPlugin([p]).then(ok => ok || toast('Installe NeoPDF depuis NeoStore pour ouvrir ce PDF', true)); }
  newTab('neodex:viewer'); vwShow(p);
}
$('vwPick').onclick = async () => { const p = await browse('file'); if (p) { $('vwBody').replaceChildren(); vwShow(p); } };
$('vwPrev').onclick = () => vwStep(-1); $('vwNext').onclick = () => vwStep(1);
$('vwWin').onclick = async () => { const err = await neo.openFile(vw.path); if (err) toast(err, true); };
$('vwWith').onclick = async () => { const err = await neo.viewOpenWith(vw.path); if (err) toast(err, true); };
$('vwDir').onclick = () => neo.showFile(vw.path);
$('viewerApp').ondragover = e => e.preventDefault();
$('viewerApp').ondrop = e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) vwShow(neo.pathOf(f)); };
addEventListener('keydown', e => { if (active?.app === APPS['neodex:viewer'] && !e.target.closest('input, textarea') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) vwStep(e.key === 'ArrowLeft' ? -1 : 1); });
neo.onViewOpen(p => viewFile(p)); neo.onViewUrl(d => vwUrl(d.url, d.kind));
tbPop.append(tbItem('Visionneuse', 'images, son, vidéo, tout fichier', () => newTab('neodex:viewer')));
