/* ---------- the main window's side of the taskbar (the bar itself is taskbar.html, a window of its own: taskbar-main.js):
   room at the bottom while it is shown, the NeoDex button brings NeoDex back on its home page, the MENU item that chooses when it
   shows, the theme's colours sent to the bar, and a video in full screen that makes the bar step aside. ---------- */
const TB_LABELS = {auto: 'quand NeoDex est en plein écran', always: 'toujours', off: 'jamais'}, TB_NEXT = {auto: 'always', always: 'off', off: 'auto'};
let tbMode = 'auto';
neo.getSettings().then(s => { tbMode = s.taskbar || 'auto'; });
neo.onTbState(s => { document.body.classList.toggle('tbOn', s.on); document.documentElement.style.setProperty('--tbH', s.height * innerHeight / outerHeight + 'px'); });  // the interface's zoom: a CSS pixel is not a screen pixel
addEventListener('scroll', () => scrollY && scrollTo(0, 0));  // a scrollIntoView would slide the whole page under the bars
neo.onTbHome(() => showTab(null));
tbPop.append(tbItem('Barre des tâches', 'plein écran · toujours · jamais', async () => { tbMode = await neo.tbMode(TB_NEXT[tbMode]); toast('Barre des tâches : ' + TB_LABELS[tbMode]); }));
// the theme (and the accessibility settings) change the variables of the page: the bar gets the same ones, and the style of the theme (its fonts and decor)
const TB_VARS = ['--bg0', '--line', '--line2', '--magenta', '--pink', '--violet', '--lilac', '--muted', '--shell', '--pkr', '--mgr', '--navy', '--out', '--d5', '--d8', '--d12', '--d19', '--title', '--text'];
let tbThemeSent = '', tbVfsSent = null;
function tbSendLook() {
  const cs = getComputedStyle(document.documentElement), t = Object.fromEntries(TB_VARS.map(v => [v, cs.getPropertyValue(v).trim()]).filter(([, v]) => v)); t.style = document.documentElement.dataset.style || ''; t.css = typeof plugThemeBarCss === 'string' ? plugThemeBarCss : ''; const k = JSON.stringify(t);
  if (k !== tbThemeSent) { tbThemeSent = k; neo.tbTheme(t); }
  const vfs = document.body.classList.contains('vfs') || !!document.fullscreenElement; if (vfs !== tbVfsSent) { tbVfsSent = vfs; neo.tbVfs(vfs); }
}
new MutationObserver(() => { clearTimeout(tbSendLook.t); tbSendLook.t = setTimeout(tbSendLook, 120); }).observe(document.documentElement, {attributes: true, subtree: false, attributeFilter: ['style', 'class', 'data-theme', 'data-style']});
new MutationObserver(() => tbSendLook()).observe(document.body, {attributes: true, attributeFilter: ['class']});
document.addEventListener('fullscreenchange', () => tbSendLook());  // le plein écran d'un plugin (son iframe) : la barre s'efface comme pour une vidéo
setTimeout(tbSendLook, 500);
// the calendar of the bar (the clock): one month of the agenda, the holidays and the next anime episodes; a day opens the agenda on its week
window.tbCalData = (y, m) => {
  const out = {}, hol = holidays(y), at = s => s || '';
  for (let d = 1, n = new Date(y, m + 1, 0).getDate(); d <= n; d++) {
    const day = new Date(y, m, d), list = out[ymd(day)] = hol.filter(h => h.date === ymd(day)).map(h => ({t: h.title, kind: 'holiday', at: ''}));
    for (const ev of agenda.events) if (occurs(ev, day) && !(ev.kind === 'task' && ev.done)) list.push({t: ev.title, kind: ev.kind || 'event', at: ev.allDay ? '' : at(ev.start), c: ev.color});
  }
  for (const l of Object.values(out)) l.sort((a, b) => a.at.localeCompare(b.at));
  return out;
};
window.tbCalOpen = day => { showTab(null); weekStart = mondayOf(parseDay(day)); renderAgenda(); $('agenda').scrollIntoView({block: 'start'}); };
