/* Paramètres › Extensions Chrome (extensions-main.js): add one from the Chrome Web Store (a link, or the short list), switch on/off, its
   settings page, remove. Electron runs only part of Chrome's extension API: an extension that fails says why and stays off. */
async function extRender() {
  const box = $('setExt'); if (!box) return;
  const { list, short } = await neo.extList();
  const input = Object.assign(el('input', 'f'), { placeholder: 'Lien de l\'extension sur le Chrome Web Store' }), addB = el('button', 'btn px', 'Ajouter');
  input.setAttribute('aria-label', 'Lien de l\'extension sur le Chrome Web Store');
  const add = async link => {
    addB.disabled = true; addB.textContent = '…';
    try { const e = await neo.extAdd(link); toast(e.error ? i18n('« {name} » ne marche pas dans NeoDex : {error}', {name: e.name, error: i18n(e.error)}) : i18n('« {name} » ajoutée : elle agit dans les onglets web', {name: e.name}), !!e.error); }
    catch (e) { toast(i18n('Extension impossible : {error}', {error: i18n(e.message.replace(/^.*Error: /, ''))}), true); }
    extRender();
  };
  addB.onclick = () => input.value.trim() && add(input.value.trim());
  input.onkeydown = e => { if (e.key === 'Enter') addB.click(); };
  const row = el('div', 'row'); row.append(input, addB);
  const quick = el('div', 'row extQuick');
  for (const s of short.filter(s => !list.some(e => e.id === s.id))) { const b = el('button', 'btn px', '+ ' + s.name); b.title = s.why; b.onclick = () => add(s.id); quick.append(b); }
  const rows = list.map(e => {
    const r = el('div', 'extRow'), on = Object.assign(el('input'), { type: 'checkbox', checked: e.on }), lab = el('label', 'check'), acts = el('span', 'dlInfo');
    const nm = el('span', '', e.name); nm.setAttribute('translate', 'no');  // its own name, never translated piece by piece
    lab.append(on, ' ', nm, ' ', el('small', '', e.version + (e.mv === 3 ? ' · MV3' : '')));
    on.onchange = async () => { const x = await neo.extToggle({ id: e.id, on: on.checked }); if (x?.error) toast(i18n('« {name} » ne marche pas dans NeoDex : {error}', {name: e.name, error: i18n(x.error)}), true); extRender(); };
    const b = (t, f) => { const x = el('button', '', t); x.onclick = f; acts.append(x); };
    if (e.on) b('RÉGLAGES', async () => { const u = await neo.extPage(e.id); u ? (closeSettingsBox(), newTab(u, true, true)) : toast('Cette extension n\'a pas de page de réglages'); });
    b('RETIRER', async () => { if (await nbConfirm(i18n('Retirer l\'extension « {name} » ?', {name: e.name}))) { await neo.extRemove(e.id); extRender(); } });
    r.append(lab, acts);
    if (e.error) { const w = el('div', 'pwWhy', i18n('⚠ ne marche pas dans NeoDex : {error}', {error: i18n(e.error)})); w.setAttribute('translate', 'no'); r.append(w); }  // already in your language: not retranslated on screen
    else if (e.blocks) r.append(el('div', 'pwWhy', '⚠ ses règles de blocage ne s\'appliquent pas dans NeoDex : cette partie ne fera rien.'));
    return r;
  });
  box.replaceChildren(el('span', 'label', 'Extensions Chrome'), row, ...(quick.children.length ? [quick] : []), ...rows,
    el('div', 'hint', 'Elles agissent dans les onglets web (pas dans les fenêtres privées). NeoDex ne fait tourner qu\'une partie des fonctions de Chrome : certaines extensions ne marchent pas, ou pas entièrement.'),
    el('div', 'hint', 'Testées et qui marchent : Dark Reader, SponsorBlock, Return YouTube Dislike.'),
    el('div', 'hint', 'Ne marchent pas : uBlock Origin (retiré du Chrome Web Store), uBlock Origin Lite (ne bloque rien dans NeoDex, remplacé par le plugin Bloqueur de pubs), Bitwarden (ne démarre pas, le Coffre fait la même chose), et en général les bloqueurs de pub récents et les extensions qui passent par leur bouton dans la barre de Chrome.'));
}
const closeSettingsBox = () => $('setModal').classList.remove('on');
neo.onExtChanged(() => { if ($('setModal').classList.contains('on')) extRender(); });
