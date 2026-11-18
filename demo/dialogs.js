/* ---------- les boîtes de dialogue de NeoDex, à la place de celles de Windows (confirm(), MessageBox) : même style que le reste, une seule à la fois ---------- */
const nbQueue = [];
let nbBusy = false;
// opts : {title, text, buttons: ['Garder', 'Effacer', 'Annuler'], defaultId, cancelId, danger, checkbox: 'Ne plus demander', checks: ['A', 'B'] (cochées au départ)} -> {response, checked, checks: [true, false]}
function nbBox(opts) {
  return new Promise(done => { nbQueue.push({ opts, done }); if (!nbBusy) nbNext(); });
}
function nbNext() {
  const job = nbQueue.shift(); if (!job) { nbBusy = false; return; }
  nbBusy = true;
  const { title = 'NeoDex', text = '', buttons = ['OK'], danger = false, checkbox = '', checks = [] } = job.opts;
  const cancelId = job.opts.cancelId ?? (buttons.length > 1 ? buttons.length - 1 : 0), defaultId = job.opts.defaultId ?? (danger ? cancelId : 0);
  const root = el('div'), win = el('div', 'win px'), head = el('div', 'winHead'), h = el('h2', '', title), x = el('button', 'x', 'X');
  root.id = 'nbDialog'; root.className = 'on'; x.setAttribute('aria-label', 'Annuler');
  head.append(h, x);
  const body = el('div', 'body');
  for (const para of String(text).split('\n')) body.append(el('div', para ? 'nbLine' : 'nbGap', para));
  let box = null;
  const many = checks.map(l => { const lab = el('label', 'check'), b = el('input'); b.type = 'checkbox'; b.checked = true; lab.append(b, ' ' + l); body.append(lab); return b; });
  if (checkbox) { const lab = el('label', 'check'); box = el('input'); box.type = 'checkbox'; lab.append(box, ' ' + checkbox); body.append(lab); }
  const foot = el('div', 'winFoot'); foot.style.justifyContent = 'flex-end';
  const end = r => { document.removeEventListener('keydown', key, true); root.remove(); job.done({ response: r, checked: !!box?.checked, checks: many.map(b => b.checked) }); nbNext(); };
  const btns = buttons.map((label, i) => {
    const b = el('button', 'btn px' + (i === defaultId && !danger ? ' main' : '') + (danger && i !== cancelId && i !== defaultId ? ' nbDanger' : ''), label);
    b.onclick = () => end(i); return b;
  });
  foot.append(...btns); win.append(head, body, foot); root.append(win); document.body.append(root);
  x.onclick = () => end(cancelId); root.onclick = e => { if (e.target === root) end(cancelId); };
  function key(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(cancelId); } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); e.stopPropagation(); end(defaultId); } }
  document.addEventListener('keydown', key, true);
  window.neo?.win('focus');  // reprend le clavier à un site avant de montrer la question
  setTimeout(() => btns[defaultId]?.focus());
}
// « Supprimer « x » ? » + éventuellement des lignes d'explication : la première ligne est la question. Renvoie true si l'utilisateur confirme.
async function nbConfirm(message, opts = {}) {
  const [title, ...rest] = String(message).split('\n'), first = title.split(' ')[0];
  const danger = opts.danger ?? /^(Supprimer|Effacer|Désinstaller|Mettre à la corbeille|Forcer|Arrêter)$/.test(first);
  const ok = opts.ok ?? (danger ? first : 'Continuer');
  return (await nbBox({ title, text: rest.join('\n'), buttons: [ok, opts.cancel ?? 'Annuler'], danger, defaultId: danger ? 1 : 0, cancelId: 1 })).response === 0;
}
// les questions du programme principal (antivirus, quarantaine, arrêt du PC…) arrivent ici au lieu d'une fenêtre Windows
window.neo?.onUiBox(async d => {
  const r = await nbBox({ title: d.message, text: d.detail || '', buttons: d.buttons, defaultId: d.defaultId, cancelId: d.cancelId, danger: d.type === 'warning' && d.buttons.length > 1 && (d.defaultId ?? 0) === (d.cancelId ?? 0), checkbox: d.checkboxLabel || '' });
  neo.uiBoxAnswer(d.id, { response: r.response, checkboxChecked: r.checked });
});
