/* The command palette (Ctrl+K, from anywhere in NeoDex, websites included): one box to type in, and everything NeoDex can open or do —
   the open tabs, the apps and plugins, the commands of the plugins (plugin.json « commands ») and what plugins find (permission « search »),
   the MENU items, the sections of Paramètres, your links, your history; Enter on anything else searches the web or opens the address. */
const palBox = el('div'), palIn = el('input', 'f'), palList = el('div');
palBox.id = 'palette'; palBox.setAttribute('role', 'dialog'); palBox.setAttribute('aria-modal', 'true'); palBox.setAttribute('aria-label', 'Palette de commandes');
palIn.id = 'palIn'; palIn.placeholder = 'Ouvrir, faire, chercher… (onglets, applis, plugins, réglages, historique)'; palIn.spellcheck = false;
palIn.setAttribute('role', 'combobox'); palIn.setAttribute('aria-expanded', 'true'); palIn.setAttribute('aria-controls', 'palList'); palIn.setAttribute('aria-autocomplete', 'list');
palList.id = 'palList'; palList.setAttribute('role', 'listbox'); palList.setAttribute('aria-label', 'Résultats');
{ const w = el('div', 'win px'); w.append(palIn, palList); palBox.append(w); document.body.append(palBox); }
palBox.onpointerdown = e => { if (e.target === palBox) palClose(); };
let palItems = [], palSel = 0, palHist = [], palSeq = 0;

// every word typed must be somewhere in the title or the hint; a title that starts with the text comes first
const palScore = (q, it) => { const t = palNorm(it.title), h = palNorm(it.hint); if (!q) return 1; if (!q.split(/\s+/).every(w => t.includes(w) || h.includes(w))) return 0; return t.startsWith(q) ? 3 : t.includes(q) ? 2 : 1; };

function palSources() {
  const out = [];
  for (const t of tabs) out.push({ kind: 'Onglet', title: t.title || t.url, hint: t.app ? '' : hostOf(t.url), icon: t.app?.icon || iconSrc(t.url), run: () => showTab(t) });
  out.push({ kind: 'Appli', title: 'Accueil', hint: 'NeoDex', run: () => showTab(null) });
  for (const [u, a] of Object.entries(APPS)) if (!/^plugin:/.test(u) || pluginInfo.get(u.slice(7))?.enabled) out.push({ kind: /^plugin:/.test(u) ? 'Plugin' : 'Appli', title: a.name, hint: a.cat || '', icon: a.icon, run: () => newTab(u) });
  for (const b of tbPop.querySelectorAll('button')) { const s = b.querySelectorAll('span,small'); out.push({ kind: 'Menu', title: s[0]?.textContent ? s[0].textContent[0] + s[0].textContent.slice(1).toLowerCase() : b.title || b.textContent, hint: s[1]?.textContent || '', run: () => b.click() }); }
  for (const s of document.querySelectorAll('#setModal .setSec')) { const l = s.querySelector('.label')?.textContent; if (l) out.push({ kind: 'Réglage', title: l, hint: 'Paramètres', run: () => { $('bSettings').click(); [...document.querySelectorAll('.setTabBtn')].find(b => b.textContent === l)?.click(); } }); }  // its tab in Paramètres (look.js)
  for (const l of links) out.push({ kind: 'Lien', title: l.name, hint: isWeb(l.target) ? hostOf(l.target) : l.target, icon: iconSrc(l.target), run: () => launch(l) });
  return out;
}

function palRender(q) {
  const seq = ++palSeq, nq = palNorm(q.trim());
  const scored = palSources().map(it => [palScore(nq, it), it]).filter(([s]) => s).sort((a, b) => b[0] - a[0]).map(([, it]) => it);
  const hist = nq ? palHist.filter(h => palNorm(h.title + ' ' + h.url).includes(nq)).slice(0, 6).map(h => ({ kind: 'Historique', title: h.title || h.url, hint: hostOf(h.url), icon: iconSrc(h.url), run: () => newTab(h.url, true, true) })) : [];
  const web = q.trim() ? [{ kind: 'Web', title: (/^[a-z]+:\/\//i.test(q.trim()) || /^[\w-]+(\.[\w-]+)+/.test(q.trim()) ? 'Ouvrir ' : 'Rechercher ') + '« ' + q.trim() + ' »', hint: 'nouvel onglet', run: () => newTab(toUrl(q.trim()), true, true) }] : [];
  palShow([...scored.slice(0, 40), ...hist, ...web]);
  if (nq && typeof pluginSearch === 'function') pluginSearch(nq).then(found => {  // the commands and results of the plugins arrive a bit later
    if (seq !== palSeq || !found.length) return;
    const extra = found.map(f => ({ kind: 'Plugin', title: f.title, hint: f.hint, run: f.run }));
    palShow([...palItems.slice(0, palItems.length - web.length), ...extra, ...web], true);
  });
}
function palShow(items, keep) {
  const cur = palItems[palSel]; palItems = items; palSel = keep ? Math.max(0, items.indexOf(cur)) : 0;
  palList.replaceChildren(...items.map((it, i) => {
    const r = el('div', 'titem palRow'), ic = el('img');
    r.id = 'palO' + i; r.setAttribute('role', 'option');
    if (it.icon) { ic.src = it.icon; ic.alt = ''; ic.onerror = () => ic.style.visibility = 'hidden'; } else ic.style.visibility = 'hidden';
    r.append(ic, el('span', 'tn', it.title), el('span', 'host', it.hint || ''), el('span', 'tt', it.kind));
    r.onpointerenter = () => palMark(i); r.onclick = () => palRun(i);
    return r;
  }));
  if (!items.length) palList.append(el('div', 'hint palEmpty', 'Rien trouvé'));
  palMark(palSel);
}
function palMark(i) {
  palSel = i;
  palList.querySelectorAll('.palRow').forEach((r, j) => { r.classList.toggle('on', j === i); r.setAttribute('aria-selected', j === i); });
  const r = palList.querySelector('#palO' + i); if (r) { palIn.setAttribute('aria-activedescendant', r.id); r.scrollIntoView({ block: 'nearest' }); }
}
function palRun(i) { const it = palItems[i]; if (!it) return; palClose(); sfx?.('open'); try { it.run(); } catch (e) { toast(e.message, true); } }
function palOpen() {
  if (palBox.classList.contains('on')) return palClose();
  palBox.classList.add('on'); palIn.value = ''; palRender(''); palIn.focus();
  neo.getHistory().then(h => { palHist = h; }, () => {});
}
function palClose() { palBox.classList.remove('on'); palHist = []; }
palIn.oninput = () => palRender(palIn.value);
palIn.onkeydown = e => {
  const n = palItems.length;
  if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); if (n) palMark((palSel + 1) % n); }
  else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) { e.preventDefault(); if (n) palMark((palSel - 1 + n) % n); }
  else if (e.key === 'Enter') { e.preventDefault(); palRun(palSel); }
  else if (e.key === 'Escape') { e.preventDefault(); palClose(); }
};
console.assert(palScore('note', { title: 'Notes', hint: '' }) === 3 && palScore('parametres son', { title: 'Sons', hint: 'Paramètres' }) && !palScore('xyz', { title: 'Notes', hint: '' }), 'palette : tri');
