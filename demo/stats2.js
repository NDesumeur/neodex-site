// le budget vit dans le dossier de son plugin : Stats lit son document, seulement si le plugin est installé et que tu lui as accordé ses droits (jamais de question surprise)
async function plugDoc(id, name) {
  try { const p = (await neo.pluginsList()).find(x => x.id === id); if (p?.enabled && (p.perms?.full === 'allow' || p.perms?.storage === 'allow')) return await neo.pluginFolder(id, 'read', name); } catch {}
  return null;
}
const budgetDoc = () => plugDoc('neodex.budget', 'budget');
const DLES_LIST = [{key: 'monodle', name: 'MonogatariDle'}, {key: 'apothecarydle', name: 'ApothecaryDle'}, {key: 'blackdle', name: 'BlackDle'}, {key: 'bleachdle', name: 'BleachDle'}, {key: 'durararadle', name: 'DurararaDle'}];
const GAME_PLUGINS = 'sautstellaire memoire cascade demineur fusionstellaire snuke meteores motdujour astropole cassebriques defensespatiale rythme pendu motsmeles sudoku taquin echecs dames peche frappe monodle apothecarydle blackdle bleachdle durararadle'.split(' ');
async function gamesAll() {  // les records et parties de tous les plugins de jeux, réunis comme dans l'ancien games.json
  const g = {best: {}, typing: []};
  for (const id of GAME_PLUGINS) { const d = await plugDoc('neodex.' + id, 'games'); if (!d) continue; Object.assign(g.best, d.best || {}); for (const [k, v] of Object.entries(d)) if (k !== 'best') g[k] = v; }
  return g;
}
/* Stats on everything: besides the screen time, the Stats app now counts tabs opened, searches, downloads and the use of the tools
   (statCount, kept per day in stats.json, which is synced per PC), and sums up every part of NeoDex for the chosen period:
   browsing (from the synced history), games and NeoDle, music, writing (notes, journal, office files), agenda, animes, budget and tools. */
function statCount(k, n = 1) { if (!stats) return; const c = statDay().counts ||= {}; c[k] = (c[k] || 0) + n; statsDirty = true; }
{  // new tabs and the searches typed in the address bar
  const newTab0 = newTab;
  newTab = (url, show, fresh, priv) => { const n = tabs.length, t = newTab0(url, show, fresh, priv); if (tabs.length > n && !APPS[url] && !priv) { statCount('tabs'); if (String(url).startsWith(engine())) statCount('searches'); } return t; };
  $('bUrl').addEventListener('keydown', e => { if (e.key === 'Enter' && active && toUrl(e.target.value.trim()).startsWith(engine())) statCount('searches'); });
  const done = new Set();
  window.neo?.onDownload(d => { if (d.state === 'completed' && !done.has(d.id)) { done.add(d.id); statCount('downloads'); } });
}
const stAll = el('div', 'stAll');
$('statsApp').querySelector('.appWrap').append(stAll);
{
  const render0 = renderStats;
  renderStats = () => { render0(); stRenderAll(); };
}
let stAllBusy = false;
async function stRenderAll() {
  if (stAllBusy || !stats) return; stAllBusy = true;
  try {
    const days = [...Array(stRange)].map((_, i) => ymd(addDays(new Date(), -i))), since = new Date(days.at(-1) + 'T00:00').getTime(), inDays = d => days.includes(d);
    const allDays = [stats, ...Object.values(otherPcs)].map(s => s?.days || {});
    const count = k => allDays.reduce((t, ds) => t + days.reduce((u, d) => u + (ds[d]?.counts?.[k] || 0), 0), 0);
    const per = stRange === 1 ? "aujourd'hui" : 'sur ' + stRange + ' jours';
    const card = (title, rows, extra = []) => { const c = el('div', 'sysCard px stCard'); c.append(el('span', 'label', title), ...rows.map(([l, v, h]) => { const r = el('div', 'stLine'); r.append(el('span', '', l), el('b', '', String(v))); if (h) r.title = h; return r; }), ...extra); return c; };
    const fmtN = n => Math.round(n).toLocaleString('fr-FR');
    // browsing: the history is merged between PCs
    const hist = (await window.neo.getHistory()).filter(h => h.t >= since), doms = {};
    for (const h of hist) { const d = hostOf(h.url); if (d) doms[d] = (doms[d] || 0) + 1; }
    const topDom = Object.entries(doms).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const nav = card('Navigation · ' + per, [['Pages visitées', fmtN(hist.length)], ['Sites différents', fmtN(Object.keys(doms).length)], ['Onglets ouverts', fmtN(count('tabs'))], ['Recherches', fmtN(count('searches'))], ['Téléchargements', fmtN(count('downloads'))]],
      topDom.length ? [el('span', 'hint', 'Les plus visités'), ...topDom.map(([d, n]) => barRow(d, n / topDom[0][1] * 100, n + ' pages', iconSrc('https://' + d)))] : []);
    // apps and games: their time, records, NeoDle, fishing, typing
    const appNames = new Set(Object.values(APPS).map(a => a.name)), time = {};
    for (const ds of allDays) for (const d of days) for (const [k, v] of Object.entries(ds[d]?.sites || {})) if (appNames.has(k)) time[k] = (time[k] || 0) + v;
    const gameNames = new Set(Object.values(APPS).filter(a => a.cat === 'Jeux' || a.cat === 'NeoDle').map(a => a.name));
    const gameTime = Object.entries(time).filter(([k]) => gameNames.has(k)).reduce((a, [, v]) => a + v, 0), topApps = Object.entries(time).filter(([k]) => k !== 'Accueil').sort((a, b) => b[1] - a[1]).slice(0, 5);
    const g = await gamesAll(), dles = DLES_LIST.map(d => [d.name, g[d.key]?.stats ? Object.values(g[d.key].stats).reduce((a, s) => ({w: a.w + s.wins, p: a.p + s.played, b: Math.max(a.b, s.bestStreak)}), {w: 0, p: 0, b: 0}) : null]).filter(([, s]) => s?.p);
    const fish = g.fish, typing = (g.typing || []).filter(t => t.t >= since);
    const play = card('Applis et jeux · ' + per, [['Temps dans les jeux', fmtDur(gameTime)], ['Records enregistrés', fmtN(Object.keys(g.best || {}).length), 'au total, tous jeux confondus'],
      ['Défis NeoDle gagnés', fmtN(dles.reduce((a, [, s]) => a + s.w, 0)) + ' / ' + fmtN(dles.reduce((a, [, s]) => a + s.p, 0)), 'au total'], ['Meilleure série NeoDle', fmtN(Math.max(0, ...dles.map(([, s]) => s.b)))],
      ['Poissons pêchés', fish ? fmtN(fish.total || 0) + ' (' + Object.keys(fish.dex || {}).length + ' espèces)' : '0', 'au total'], ['Tests de frappe', typing.length ? typing.length + ' · meilleur ' + Math.max(...typing.map(t => t.wpm)) + ' mots/min' : '0']],
      topApps.length ? [el('span', 'hint', 'Applis les plus utilisées'), ...topApps.map(([k, v]) => barRow(k, v / topApps[0][1] * 100, fmtDur(v), Object.values(APPS).find(a => a.name === k)?.icon || ''))] : []);
    // music: NeoMusic's own counters
    const mu = await neo.pluginMain('neodex.music', 'music:load').catch(() => null), ms = mu?.stats || null, mPlays = ms ? Object.entries(ms.daily || {}).filter(([d]) => inDays(d)).reduce((a, [, v]) => a + (+v || 0), 0) : 0;
    const topArt = ms ? Object.entries(ms.artists_time || ms.artists || {}).sort((a, b) => b[1] - a[1])[0] : null, nTracks = ms ? new Set(mu.playlists.flatMap(p => p.tracks.map(t => t.id || t.url || t.title))).size : 0;
    const music = card('Musique', [['Morceaux écoutés ' + per, ms ? fmtN(mPlays) : '—'], ['Lectures au total', ms ? fmtN(ms.plays || 0) : '—'], ["Temps d'écoute total", ms ? fmtDur(ms.seconds || 0) : '—'], ['Artiste préféré', topArt ? topArt[0] : '—'],
      ['Morceaux dans tes playlists', ms ? fmtN(nTracks) : '—']]);
    // writing: notes, journal, office files and the text tools
    const office = {files: (await Promise.all(['docs', 'sheets', 'slides'].map(async k => (await plugDoc('neodex.' + k, 'office'))?.files || []))).flat()}, journal = await plugDoc('neodex.journal', 'journal');
    const words = h => (String(h).replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length, of = office?.files || [];
    const kinds = k => of.filter(f => f.kind === k), changed = of.filter(f => f.t >= since).length;
    const write = card('Écriture et bureautique', [['Notes', fmtN(notes.length) + ' · ' + fmtN(notes.reduce((a, n) => a + words(n.text || n.body || ''), 0)) + ' mots'], ['Jours de journal ' + per, fmtN(Object.keys(journal?.entries || {}).filter(d => inDays(d) && journal.entries[d]?.text?.trim()).length)],
      ['Documents NeoDocs', fmtN(kinds('doc').length) + ' · ' + fmtN(kinds('doc').reduce((a, f) => a + words(f.data.html), 0)) + ' mots'], ['Classeurs NeoSheets', fmtN(kinds('sheet').length)], ['Présentations NeoSlides', fmtN(kinds('slides').length) + ' · ' + fmtN(kinds('slides').reduce((a, f) => a + f.data.slides.length, 0)) + ' diapositives'],
      ['Fichiers modifiés ' + per, fmtN(changed)], ['Textes comparés · vérifiés', fmtN(count('diffs')) + ' · ' + fmtN(count('spellChecks'))]]);
    // the rest of NeoDex
    const ev = (agenda?.events || []).filter(e => inDays(e.date)), eps = Object.values((await plugDoc('neodex.sortiesanime', 'anime'))?.watched || {}).reduce((a, w) => a + (w.ep || 0), 0);
    const ops = ((await budgetDoc())?.ops || []).filter(o => inDays(o.date)), spent = ops.filter(o => o.amount < 0 && !o.group).reduce((a, o) => a - o.amount, 0);
    const gifCount = ((await plugDoc('neodex.gifstickers', 'tools'))?.gifs?.items || []).length, pal = ((await plugDoc('neodex.couleurs', 'tools'))?.colors?.palettes || []).length;
    const life = card('Organisation et outils', [['Événements de l\'agenda ' + per, fmtN(ev.length)], ['Épisodes d\'animes vus', fmtN(eps), 'au total'], ['Opérations du budget ' + per, fmtN(ops.length) + (spent ? ' · ' + eur(spent) + ' dépensés' : '')],
      ['Raccourcis sur l\'accueil', fmtN(links.length)], ['Couleurs prises · palettes', fmtN(count('colors')) + ' · ' + fmtN(pal)], ['GIF copiés · dans la bibliothèque', fmtN(count('gifs')) + ' · ' + fmtN(gifCount)]]);
    stAll.replaceChildren(el('span', 'label stAllT', 'Tout NeoDex'), (() => { const g2 = el('div', 'stAllGrid'); g2.append(nav, play, music, write, life); return g2; })(),
      el('div', 'hint', 'Ces chiffres viennent de tes données synchronisées : ils tiennent compte de tes autres PC quand la synchro est active.'));
  } catch (e) { console.error('stats :', e); }
  finally { stAllBusy = false; }
}
