// découpé de index.html : chargé à la même place que le code d'origine (mêmes variables globales, même ordre)
/* ---------- Stats app: screen time per site / app, kept in stats.json as {days: {"2026-10-24": {sites: {name: seconds}, launches: {name: count}}}} ---------- */
let stats = null, statsDirty = false, stRange = 7;
const STAT_TICK = 5;  // seconds between two counts
api('stats').then(d => {
  stats = d?.days ? d : {days: {}};
  const old = ymd(addDays(new Date(), -90));
  for (const k of Object.keys(stats.days)) if (k < old) delete stats.days[k];  // keeps 3 months
}).catch(() => {});  // unreadable file: nothing is counted, so nothing is saved over it
const statDay = () => stats.days[ymd(new Date())] ??= {sites: {}, launches: {}};
const saveStats = () => { if (!stats || !statsDirty) return; statsDirty = false; api('stats', stats).catch(() => statsDirty = true); };
function countLaunch(name) { if (!stats) return; const l = statDay().launches; l[name] = (l[name] || 0) + 1; statsDirty = true; }
const playing = t => inView(t, "[...document.querySelectorAll('video')].some(v => !v.paused && !v.ended)");
setInterval(async () => {
  if (!stats || !window.neo || document.visibilityState !== 'visible') return;
  const a = await neo.activity();
  if (!a.focused || (a.idle > 300 && !(await playing(active)) && !(await playing(mini)))) return;  // away: only a playing video still counts
  const key = !active ? 'Accueil' : active.app ? active.app.name : hostOf(active.url) || 'Autre', s = statDay().sites;
  s[key] = (s[key] || 0) + STAT_TICK; statsDirty = true;
  if (active?.app === APPS['neodex:stats']) renderStats();
}, STAT_TICK * 1000);
setInterval(saveStats, 60000);
addEventListener('pagehide', () => { if (stats && statsDirty) navigator.sendBeacon('/api/stats?t=' + TOKEN, JSON.stringify(stats)); });
const fmtDur = s => s < 60 ? (s ? '< 1 min' : '0 min') : s < 3600 ? Math.round(s / 60) + ' min' : (s / 3600 | 0) + ' h ' + String(Math.round(s % 3600 / 60)).padStart(2, '0');
console.assert(fmtDur(0) === '0 min' && fmtDur(30) === '< 1 min' && fmtDur(600) === '10 min' && fmtDur(3900) === '1 h 05', 'fmtDur');
let otherPcs = {};  // screen time of the other synced PCs (from the sync file), added to this PC's
function renderStats() {
  if (!stats) return;
  window.neo?.otherStats().then(o => { if (JSON.stringify(o) !== JSON.stringify(otherPcs)) { otherPcs = o; renderStats(); } });
  const allDays = [stats, ...Object.values(otherPcs)].map(s => s?.days || {});
  const days = [...Array(Math.max(7, stRange))].map((_, i) => ymd(addDays(new Date(), -i))).reverse(), inRange = days.slice(-stRange);  // the chart shows at least a week
  const sum = key => { const o = {}; for (const days of allDays) for (const d of inRange) for (const [k, v] of Object.entries(days[d]?.[key] || {})) o[k] = (o[k] || 0) + v; return o; };
  const sites = sum('sites'), launches = sum('launches'), total = Object.values(sites).reduce((a, b) => a + b, 0);
  const used = inRange.filter(d => allDays.some(days => days[d])).length || 1;
  const tile = (label, value, hint) => { const c = el('div', 'sysCard px'); c.append(el('span', 'label', label), el('div', 'sysBig', value), el('div', 'hint', hint)); return c; };
  $('stTiles').replaceChildren(
    tile("Temps d'écran", fmtDur(total), stRange === 1 ? "aujourd'hui" : 'sur les ' + stRange + ' derniers jours'),
    tile('Moyenne par jour', fmtDur(Math.round(total / used)), 'les jours où NeoDex était ouvert'),
    tile('Sites différents', String(Object.keys(sites).filter(k => k.includes('.')).length), 'ouverts dans les onglets'),
    tile('Lancements', String(Object.values(launches).reduce((a, b) => a + b, 0)), 'depuis tes raccourcis'));
  document.querySelectorAll('#stRange .btn').forEach(b => b.classList.toggle('on', +b.dataset.d === stRange));
  const per = days.map(d => allDays.reduce((t, days) => t + Object.values(days[d]?.sites || {}).reduce((a, b) => a + b, 0), 0)), max = Math.max(3600, ...per);
  const note = $('stNote'); note.dataset.base ??= note.textContent;
  note.textContent = note.dataset.base + (Object.keys(otherPcs).length ? ' Temps cumulé sur ce PC et sur ' + Object.keys(otherPcs).join(', ') + '.' : '');
  $('stChart').replaceChildren(...days.map((d, i) => {
    const c = el('div', 'col' + (i === days.length - 1 ? ' today' : '')), b = el('div', 'bar'), dt = new Date(d + 'T12:00');
    b.style.height = per[i] / max * 140 + 'px';
    c.title = dt.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'}) + ' : ' + fmtDur(per[i]);
    c.append(b, el('span', '', days.length > 14 ? String(dt.getDate()) : dt.toLocaleDateString('fr-FR', {weekday: 'short'}).replace('.', '').toUpperCase()));
    return c;
  }));
  const ranked = (o, fmt, icon) => {
    const e = Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 12), top = e[0]?.[1] || 1;
    return e.length ? e.map(([k, v]) => barRow(k, v / top * 100, fmt(v), icon(k))) : [el('div', 'hint', 'Rien pour cette période.')];
  };
  const appIcon = k => Object.values(APPS).find(a => a.name === k)?.icon || (k === 'Accueil' ? 'NeoDex.ico' : k.includes('.') ? iconSrc('https://' + k) : '');
  const linkIcon = k => { const l = links.find(l => l.name === k); return l ? (l.icon ? fileUrl(l.icon) : iconSrc(l.target)) : ''; };
  $('stSites').replaceChildren(...ranked(sites, fmtDur, appIcon));
  $('stLaunch').replaceChildren(...ranked(launches, n => n + ' fois', linkIcon));
}
$('stRange').onclick = e => { const d = +e.target.dataset.d; if (d) { stRange = d; renderStats(); } };
