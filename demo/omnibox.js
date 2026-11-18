/* Suggestions under the address bar while typing: the open tabs (switch to it), your links and favorites, your history (the sites you
   visit most and most recently first), then the search itself. Arrows to choose, Enter to open, Escape to close; the mouse works too. */
const obBox = el('div', 'tbPop px'), obIn = $('bUrl');
obBox.id = 'omnibox'; obBox.setAttribute('role', 'listbox'); obBox.setAttribute('aria-label', 'Suggestions');
obIn.setAttribute('role', 'combobox'); obIn.setAttribute('aria-controls', 'omnibox'); obIn.setAttribute('aria-autocomplete', 'list'); obIn.setAttribute('aria-expanded', 'false');
document.body.append(obBox);
let obItems = [], obSel = -1, obHist = null;

// the history, one entry per address: how many visits and the last one (the score favours both)
async function obHistory() {
  if (obHist) return obHist;
  const by = new Map();
  for (const h of await neo.getHistory().catch(() => [])) { const k = h.url.replace(/#.*$/, ''), o = by.get(k); if (o) { o.n++; o.t = Math.max(o.t, h.t); } else by.set(k, { url: h.url, title: h.title, t: h.t, n: 1 }); }
  return obHist = [...by.values()];
}
const obScore = h => Math.log2(1 + h.n) * 10 - (Date.now() - h.t) / 864e5;  // a visit is worth about 10 days of age
const palNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');  // accents ignored (also used by the palette)
function obMatch(q, ...s) { const words = palNorm(q).split(/\s+/).filter(Boolean); const t = palNorm(s.join(' ')).replace(/^https?:\/\/(www\.)?/, ''); return words.every(w => t.includes(w)); }

async function obRender() {
  const q = obIn.value.trim(); if (!q || document.activeElement !== obIn) return obClose();
  const hist = await obHistory(); if (obIn.value.trim() !== q) return;
  const seen = new Set(), out = [], add = it => { const k = (it.url || '').replace(/\/$/, ''); if (it.url && seen.has(k)) return; seen.add(k); out.push(it); };
  for (const t of tabs) if (t !== active && !t.app && obMatch(q, t.title, t.url)) add({ kind: 'Onglet', title: t.title || t.url, url: t.url, run: () => showTab(t) });
  for (const l of links) if (isWeb(l.target) && obMatch(q, l.name, l.target)) add({ kind: l.fav ? 'Favori' : 'Lien', title: l.name, url: l.target });
  for (const h of hist.filter(h => obMatch(q, h.title, h.url)).sort((a, b) => obScore(b) - obScore(a)).slice(0, 8)) add({ kind: 'Historique', title: h.title || h.url, url: h.url });
  const direct = toUrl(q); out.splice(Math.min(out.length, 6));
  out.push({ kind: direct.startsWith(engine()) ? 'Recherche' : 'Adresse', title: q, url: direct });
  obItems = out; obSel = -1;
  obBox.replaceChildren(...out.map((it, i) => {
    const r = el('div', 'titem obRow'), ic = el('img');
    r.id = 'obO' + i; r.setAttribute('role', 'option');
    ic.alt = ''; ic.src = iconSrc(it.url); ic.onerror = () => ic.style.visibility = 'hidden';
    r.append(ic, el('span', 'tn', it.title), el('span', 'host', it.kind === 'Recherche' ? '' : hostOf(it.url)), el('span', 'tt', it.kind));
    r.onpointerdown = e => { e.preventDefault(); obGo(i); };  // before the input loses the focus
    return r;
  }));
  const b = obIn.getBoundingClientRect(); Object.assign(obBox.style, { left: b.left + 'px', top: b.bottom + 4 + 'px', width: b.width + 'px' });
  obBox.classList.add('on'); obIn.setAttribute('aria-expanded', 'true');
}
function obMark(i) {
  obSel = i;
  obBox.querySelectorAll('.obRow').forEach((r, j) => { r.classList.toggle('on', j === i); r.setAttribute('aria-selected', j === i); });
  if (i >= 0) { obIn.setAttribute('aria-activedescendant', 'obO' + i); obIn.value = obItems[i].kind === 'Recherche' ? obItems[i].title : obItems[i].url; }
}
function obGo(i) {
  const it = obItems[i]; obClose(); if (!it) return;
  if (it.run) return it.run();
  active ? onView(v => v.loadURL(it.url)) : newTab(it.url);
  active?.v.focus();
}
function obClose() { obBox.classList.remove('on'); obItems = []; obSel = -1; obIn.setAttribute('aria-expanded', 'false'); obIn.removeAttribute('aria-activedescendant'); }
obIn.addEventListener('input', () => obRender());
obIn.addEventListener('focus', () => { obHist = null; });  // read again: you browsed since
obIn.addEventListener('blur', () => setTimeout(obClose, 100));
// on the bar, before the address field's own Enter / Escape (bUrl.onkeydown in index.html)
obIn.parentElement.addEventListener('keydown', e => {
  if (e.target !== obIn || !obBox.classList.contains('on')) return;
  const n = obItems.length;
  if (e.key === 'ArrowDown') { e.preventDefault(); obMark((obSel + 1) % n); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); obMark(obSel <= 0 ? n - 1 : obSel - 1); }
  else if (e.key === 'Enter' && obSel >= 0) { e.preventDefault(); e.stopPropagation(); obGo(obSel); }
  else if (e.key === 'Escape') { e.stopPropagation(); obClose(); }
  else if (e.key === 'Enter') obClose();
}, true);
console.assert(obMatch('you vid', 'Vidéos', 'https://www.youtube.com/') && !obMatch('xyz', 'a', 'b'), 'barre d\'adresse : recherche');
