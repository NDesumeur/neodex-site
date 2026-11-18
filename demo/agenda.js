// part of the NeoDex page (index.html): classic script sharing its global scope, loaded in the order of the page
/* ---------- agenda ---------- */
// One event = {id, kind: event|cours|birthday, title, date: YYYY-MM-DD (first occurrence), allDay, start, end: HH:MM,
//              repeat: none|weekly|yearly, until (weekly only), place, color}
let HPX = 44;  // pixels per hour: the agenda block's size on the home page (homeblocks.js)
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const EV_COLORS = ['#8a5cf0', '#e01ec8', '#3fb8c8', '#e89a3a', '#46bfae', '#ff5ad9'];
const KIND_DEFAULT = {event: {repeat: 'none', color: '#3fb8c8'}, cours: {repeat: 'weekly', color: '#8a5cf0'}, birthday: {repeat: 'yearly', color: '#ff5ad9', allDay: true}, task: {repeat: 'none', color: '#ff4f6d'}};
// a task is an event {kind: 'task', date, start = deadline time, done}: shown as "À rendre" in the day header, never as a block
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const eur = v => v.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'});
const money = s => { const v = parseFloat(String(s).replace(/[\s  €]/g, '').replace(',', '.')); return isFinite(v) ? Math.round(v * 100) / 100 : NaN; };  // restés dans le cœur : Stats et d'autres applis s'en servent
const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const toHM = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
function easter(y) {  // Gregorian computus
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
console.assert(ymd(easter(2024)) === '2024-03-31' && ymd(easter(2025)) === '2025-04-20' && ymd(easter(2026)) === '2026-04-05', 'easter');
function holidays(y) {  // French public holidays + Christmas / New Year's eves
  const e = easter(y), f = (m, d) => new Date(y, m - 1, d);
  return [[f(1, 1), "Jour de l'an"], [addDays(e, 1), 'Lundi de Pâques'], [f(5, 1), 'Fête du travail'], [f(5, 8), 'Victoire 1945'],
    [addDays(e, 39), 'Ascension'], [addDays(e, 50), 'Lundi de Pentecôte'], [f(7, 14), 'Fête nationale'], [f(8, 15), 'Assomption'],
    [f(11, 1), 'Toussaint'], [f(11, 11), 'Armistice'], [f(12, 24), 'Réveillon de Noël'], [f(12, 25), 'Noël'], [f(12, 31), 'Réveillon']]
    .map(([d, title]) => ({date: ymd(d), title}));
}
function occurs(ev, day) {
  const s = parseDay(ev.date);
  if (ev.repeat === 'weekly') return day >= s && day.getDay() === s.getDay() && (!ev.until || day <= parseDay(ev.until));
  if (ev.repeat === 'yearly') return day.getFullYear() >= s.getFullYear() && day.getMonth() === s.getMonth() && day.getDate() === s.getDate();
  return ev.date === ymd(day);
}

let agenda = {events: []}, weekStart = mondayOf(new Date()), editingEv = null, evKind = 'event', evColor = EV_COLORS[0];
const saveAgenda = () => api('agenda', agenda).catch(e => toast('Sauvegarde impossible : ' + e.message, true));

function renderAgenda() {
  const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i)), today = ymd(new Date());
  const per = days.map(d => agenda.events.filter(ev => occurs(ev, d)));
  const hol = [...new Set([days[0].getFullYear(), days[6].getFullYear()])].flatMap(holidays);
  let h0 = 8, h1 = 20;  // visible hours, stretched to fit the week's events
  per.flat().filter(ev => !ev.allDay && ev.kind !== 'task').forEach(ev => { h0 = Math.min(h0, Math.floor(toMin(ev.start) / 60)); h1 = Math.max(h1, Math.ceil(toMin(ev.end) / 60)); });
  const fmt = (d, o) => d.toLocaleDateString('fr-FR', o);
  $('agRange').textContent = fmt(days[0], {day: 'numeric', month: 'long'}) + ' – ' + fmt(days[6], {day: 'numeric', month: 'long', year: 'numeric'});
  const g = $('agGrid'); g.innerHTML = ''; g.style.setProperty('--hpx', HPX + 'px');

  g.append(el('div'));
  days.forEach((d, i) => { const h = el('div', 'agDay' + (ymd(d) === today ? ' today' : '')); h.append(el('b', '', DAYS[i]), el('span', '', d.getDate())); g.append(h); });

  g.append(el('div', 'agAllLabel', 'jour'));
  days.forEach((d, i) => {
    const cell = el('div', 'agAll');
    hol.filter(h => h.date === ymd(d)).forEach(h => { const c = el('div', 'chip hol', '★ ' + h.title); c.style.setProperty('--ec', '#e89a3a'); cell.append(c); });
    per[i].filter(ev => ev.allDay && ev.kind !== 'task').forEach(ev => {
      const age = d.getFullYear() - parseDay(ev.date).getFullYear();
      const c = el('div', 'chip', ev.kind === 'birthday' ? 'Anniv. ' + ev.title + (age > 0 ? ' · ' + age + ' ans' : '') : ev.title);
      c.style.setProperty('--ec', ev.color); c.title = ev.place || ''; c.onclick = () => openEv(ev); cell.append(c);
    });
    per[i].filter(ev => ev.kind === 'task').forEach(t => {
      const c = el('div', 'chip' + (t.done ? ' done' : ''), 'À rendre : ' + t.title); c.style.setProperty('--ec', t.color); c.title = 'Avant ' + t.start; c.onclick = () => openEv(t); cell.append(c);
    });
    g.append(cell);
  });

  const H = (h1 - h0) * HPX, times = el('div', 'agTimes'); times.style.height = H + 'px';
  for (let h = h0 + 1; h < h1; h++) { const s = el('span', '', h + 'h'); s.style.top = (h - h0) * HPX + 'px'; times.append(s); }
  g.append(times);
  const cols = days.map(d => {
    const col = el('div', 'agCol' + (ymd(d) === today ? ' today' : '')); col.style.height = H + 'px'; col.title = 'Clic : ajouter ici';
    col.onclick = e => {
      if (e.target !== col) return;
      const m = Math.min(1380, Math.round((e.offsetY / HPX * 60 + h0 * 60) / 30) * 30);
      openEv(null, {date: ymd(d), start: toHM(m), end: toHM(m + 60)});
    };
    g.append(col); return col;
  });
  days.forEach((d, i) => {
    // overlapping events share the column side by side (lanes)
    const evs = per[i].filter(ev => !ev.allDay && ev.kind !== 'task').sort((a, b) => toMin(a.start) - toMin(b.start));
    let cluster = [], cEnd = -1;
    const close = () => { const n = Math.max(...cluster.map(p => p.lane)) + 1; cluster.forEach(p => p.n = n); cluster = []; cEnd = -1; };
    for (const ev of evs) {
      const s = toMin(ev.start), e = Math.max(toMin(ev.end), s + 15);
      if (cluster.length && s >= cEnd) close();
      const used = cluster.filter(p => p.e > s).map(p => p.lane);
      let lane = 0; while (used.includes(lane)) lane++;
      const p = {ev, s, e, lane}; cluster.push(p); cEnd = Math.max(cEnd, e);
      cols[i].append(evEl(p, i, cols, h0));
    }
    if (cluster.length) close();
  });
  // lanes are known only once each cluster closes, so widths are applied after
  g.querySelectorAll('.ev').forEach(e => { const p = e._p; e.style.left = `calc(${p.lane / p.n * 100}% + 2px)`; e.style.width = `calc(${100 / p.n}% - 4px)`; });

  const ti = days.findIndex(d => ymd(d) === today), now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
  if (ti >= 0 && nm >= h0 * 60 && nm <= h1 * 60) { const l = el('div', 'nowLine'); l.style.top = (nm - h0 * 60) / 60 * HPX + 'px'; cols[ti].append(l); }
  renderTop();
}

function evEl(p, di, cols, h0) {
  const {ev} = p, box = el('div', 'ev'), sm = el('small');
  box._p = p; box.style.setProperty('--ec', ev.color);
  const place = () => { box.style.top = (p.s - h0 * 60) / 60 * HPX + 'px'; box.style.height = Math.max(18, (p.e - p.s) / 60 * HPX - 2) + 'px'; };
  const label = () => sm.textContent = toHM(p.s) + '–' + toHM(p.e) + (ev.place ? ' · ' + ev.place : '');
  box.append(el('b', '', ev.title), sm, el('div', 'grip'));
  place(); label();
  // drag = move (also to another day), drag the bottom edge = resize, simple click = edit
  // with a finger: hold 1 s without moving first, otherwise the finger scrolls the page (touchmove below stops the scroll once armed)
  box.addEventListener('touchmove', t => { if (box.classList.contains('armed')) t.preventDefault(); }, {passive: false});
  box.onpointerdown = e => {
    if (e.button !== 0) return;
    const resize = e.target.classList.contains('grip'), x0 = e.clientX, y0 = e.clientY, s0 = p.s, e0 = p.e, touch = e.pointerType === 'touch';
    let moved = false, nd = di, armed = !touch;
    const hold = touch && setTimeout(() => { armed = true; box.classList.add('armed'); navigator.vibrate?.(20); }, 1000);
    const stop = () => { clearTimeout(hold); box.classList.remove('armed'); box.onpointermove = box.onpointerup = box.onpointercancel = null; };
    box.setPointerCapture(e.pointerId);
    box.onpointercancel = stop;   // the page started scrolling
    box.onpointermove = m => {
      if (!moved && Math.abs(m.clientX - x0) + Math.abs(m.clientY - y0) < (touch ? 10 : 5)) return;
      if (!armed) return stop();
      moved = true; box.classList.add('drag');
      const dm = Math.round((m.clientY - y0) / HPX * 4) * 15;  // 15-minute steps
      if (resize) p.e = Math.max(s0 + 15, Math.min(1439, e0 + dm));
      else {
        const c = cols.findIndex(c => { const r = c.getBoundingClientRect(); return m.clientX >= r.left && m.clientX < r.right; });
        if (c >= 0 && c !== nd) { nd = c; cols[c].append(box); box.style.left = '2px'; box.style.width = 'calc(100% - 4px)'; }
        p.s = Math.max(0, Math.min(1439 - (e0 - s0), s0 + dm)); p.e = p.s + (e0 - s0);
      }
      place(); label();
    };
    box.onpointerup = () => {
      stop();
      if (!moved) return openEv(ev);
      ev.start = toHM(p.s); ev.end = toHM(p.e);
      if (nd !== di) ev.date = ymd(addDays(parseDay(ev.date), nd - di));  // for a weekly course this moves the whole series
      saveAgenda(); renderAgenda();
    };
  };
  return box;
}

function openEv(ev, preset = {}) {
  editingEv = ev;
  const v = ev || {kind: 'event', title: '', date: ymd(new Date()), start: '18:00', end: '19:00', allDay: false, repeat: 'none', until: '', place: '', color: KIND_DEFAULT.event.color, ...preset};
  $('evTitle').textContent = ev ? 'MODIFIER' : 'NOUVEL ÉVÉNEMENT';
  $('evName').value = v.title; $('evDate').value = v.date; $('evStart').value = v.start || '18:00'; $('evEnd').value = v.end || '19:00';
  $('evAllDay').checked = !!v.allDay; $('evRepeat').value = v.repeat; $('evUntil').value = v.until || ''; $('evPlace').value = v.place || '';
  $('evDue').value = v.kind === 'task' ? v.start : '23:59'; $('evDone').checked = !!v.done;
  evKind = v.kind; evColor = v.color; syncEvForm();
  $('evDel').style.visibility = ev ? 'visible' : 'hidden';
  $('evModal').classList.add('on'); $('evName').focus();
}
function syncEvForm() {
  const task = evKind === 'task', show = (id, on) => $(id).style.display = on ? '' : 'none';
  $('evKind').querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.k === evKind));
  $('evDateLbl').textContent = task ? 'À rendre le' : 'Date';
  show('evDueF', task); show('evDoneL', task && editingEv);
  show('evRepeatF', !task); show('evAllDayL', !task); show('evPlaceF', !task);
  show('evTimes', !task && !$('evAllDay').checked);
  show('evUntilF', !task && $('evRepeat').value === 'weekly');
  $('evColors').replaceChildren(...EV_COLORS.map(c => { const s = el('div', 'sw' + (c === evColor ? ' on' : '')); s.style.setProperty('--ec', c); s.onclick = () => { evColor = c; syncEvForm(); }; return s; }));
}
$('evKind').onclick = e => {
  const k = e.target.closest('.tab')?.dataset.k; if (!k) return;
  const d = KIND_DEFAULT[k]; evKind = k; $('evRepeat').value = d.repeat; $('evAllDay').checked = !!d.allDay; evColor = d.color; syncEvForm();
};
$('evAllDay').onchange = $('evRepeat').onchange = syncEvForm;
const closeEv = () => $('evModal').classList.remove('on');
$('evCancel').onclick = $('evClose').onclick = closeEv;
$('evModal').onclick = e => { if (e.target.id === 'evModal') closeEv(); };
$('evModal').onkeydown = e => { if (e.key === 'Escape') closeEv(); if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') $('evSave').click(); };
$('evDel').onclick = async () => {
  if (!await nbConfirm('Supprimer « ' + editingEv.title + ' » ?' + (editingEv.repeat !== 'none' ? '\nToutes ses répétitions seront supprimées.' : ''))) return;
  agenda.events = agenda.events.filter(x => x !== editingEv); saveAgenda(); renderAgenda(); closeEv();
};
$('evSave').onclick = () => {
  const title = $('evName').value.trim(), date = $('evDate').value, allDay = $('evAllDay').checked, repeat = $('evRepeat').value;
  const start = $('evStart').value || '00:00', end = $('evEnd').value || start;
  if (!title) return toast('Il manque le titre', true);
  if (!date) return toast('Il manque la date', true);
  const id = editingEv?.id || crypto.randomUUID(), due = $('evDue').value || '23:59';
  const ev = evKind === 'task'
    ? {id, kind: 'task', title, date, allDay: false, start: due, end: due, repeat: 'none', until: '', place: '', color: evColor, done: $('evDone').checked}
    : {id, kind: evKind, title, date, allDay, start, end, repeat, until: repeat === 'weekly' ? $('evUntil').value : '', place: $('evPlace').value.trim(), color: evColor};
  if (ev.kind !== 'task' && !allDay && toMin(end) <= toMin(start)) return toast('La fin doit être après le début', true);
  if (editingEv) agenda.events[agenda.events.indexOf(editingEv)] = ev; else agenda.events.push(ev);
  saveAgenda(); renderAgenda(); closeEv();
};
$('agPrev').onclick = () => { weekStart = addDays(weekStart, -7); renderAgenda(); };
$('agNext').onclick = () => { weekStart = addDays(weekStart, 7); renderAgenda(); };
$('agToday').onclick = () => { weekStart = mondayOf(new Date()); renderAgenda(); };
$('agAdd').onclick = () => openEv(null);
// un plugin (sorties anime, matchs NBA…) y met ses événements : ils portent son nom (src) et il peut les remplacer à tout moment
// legacy : les noms qu'il portait avant (un plugin passé dans le bac à sable) ; ces événements-là, et ceux sans nom qui ont le même identifiant, s'en vont : pas de doublons
async function agendaSync(src, evs, legacy = []) {
  await agendaReady.catch(() => {}); if (!agenda || !Array.isArray(agenda.events)) return;
  const next = evs.map(e => ({repeat: 'none', until: '', place: '', allDay: false, kind: 'event', color: KIND_DEFAULT.event.color, ...e, src}));
  const ids = new Set(next.map(e => e.id).filter(Boolean)), stale = e => legacy.includes(e.src) || (!e.src && ids.has(e.id));
  const old = agenda.events.filter(e => e.src === src), key = e => JSON.stringify(e);
  if (old.length === next.length && old.every((e, i) => key(e) === key(next[i])) && !agenda.events.some(stale)) return;
  agenda.events = [...agenda.events.filter(e => e.src !== src && !stale(e)), ...next]; saveAgenda(); renderAgenda();
}
// un fichier agenda (.ics) : ses événements s'ajoutent aux tiens, sans rien enlever ni doubler
function parseIcs(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n'), out = []; let cur = null;
  for (const l of lines) {
    if (l.startsWith('BEGIN:VEVENT')) cur = {}; else if (l.startsWith('END:VEVENT')) { if (cur) out.push(cur); cur = null; }
    else if (cur) { const i = l.indexOf(':'); if (i > 0) { const [name, ...p] = l.slice(0, i).split(';'); cur[name.toUpperCase()] = {v: l.slice(i + 1), p: p.join(';')}; } }
  }
  return out;
}
const icsText = s => (s || '').replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
function icsWhen(f) {  // {date, min, day} : « 20261031 » = journée entière ; « …T…Z » est en UTC, les autres sont à l'heure locale
  if (!f) return null; const v = f.v.trim(); let m = /^(\d{4})(\d{2})(\d{2})$/.exec(v); if (m) return {date: m[1] + '-' + m[2] + '-' + m[3], day: true};
  m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v); if (!m) return null;
  const d = m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return {date: ymd(d), min: d.getHours() * 60 + d.getMinutes(), day: false};
}
function importIcs(text) {
  const have = new Set(agenda.events.map(e => e.date + '|' + (e.allDay ? '' : e.start) + '|' + e.title.toLowerCase())); let added = 0, skipped = 0;
  const add = ev => { const k = ev.date + '|' + (ev.allDay ? '' : ev.start) + '|' + ev.title.toLowerCase(); if (have.has(k)) { skipped++; return; } have.add(k); agenda.events.push(ev); added++; };
  for (const e of parseIcs(text)) {
    const title = icsText(e.SUMMARY?.v) || 'Sans titre', s = icsWhen(e.DTSTART), en = icsWhen(e.DTEND); if (!s) continue;
    const base = {id: crypto.randomUUID(), kind: 'event', title, allDay: s.day, place: icsText(e.LOCATION?.v), color: KIND_DEFAULT.event.color, repeat: 'none', until: '', imp: icsText(e.UID?.v)};
    const start = s.day ? '00:00' : toHM(s.min), end = s.day ? '23:59' : (en && !en.day && en.date === s.date && en.min > s.min ? toHM(en.min) : toHM(Math.min(1439, s.min + 60)));
    const rule = Object.fromEntries((e.RRULE?.v || '').split(';').map(x => x.split('='))), until = rule.UNTIL ? icsWhen({v: rule.UNTIL.replace(/Z$/, '').padEnd(15, '0')})?.date : '';
    if (rule.FREQ === 'WEEKLY' && !(+rule.INTERVAL > 1)) add({...base, date: s.date, start, end, repeat: 'weekly', until: until || ''});
    else if (rule.FREQ === 'YEARLY') add({...base, date: s.date, start, end, repeat: 'yearly'});
    else if (rule.FREQ === 'DAILY' || rule.FREQ === 'MONTHLY') {  // pas de répétition équivalente : on en pose les occurrences des 14 prochains mois
      const first = parseDay(s.date), step = (+rule.INTERVAL || 1), max = Math.min(+rule.COUNT || 9999, rule.FREQ === 'DAILY' ? 430 : 14);
      for (let n = 0, d = first; n < max; n++, d = rule.FREQ === 'DAILY' ? addDays(first, (n) * step) : new Date(first.getFullYear(), first.getMonth() + n * step, first.getDate())) {
        if (until && ymd(d) > until) break; if (ymd(d) > ymd(addDays(new Date(), 430))) break; add({...base, id: crypto.randomUUID(), date: ymd(d), start, end});
      }
    } else add({...base, date: s.date, start, end});
  }
  if (added) { saveAgenda(); renderAgenda(); }
  return {added, skipped};
}
$('agImport').onclick = () => $('agIcs').click();
$('agIcs').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { await agendaReady; const r = importIcs(await f.text()); toast(r.added + ' événement(s) ajouté(s) à ton agenda' + (r.skipped ? ' · ' + r.skipped + ' déjà présent(s)' : '') + ' · rien n\'a été enlevé'); }
  catch (err) { toast('Fichier agenda illisible : ' + err.message, true); }
};
setInterval(() => document.hidden || document.querySelector('.ev.drag') || renderAgenda(), 60000);  // keeps the "now" line moving
const agendaReady = api('agenda').then(d => {
  agenda = {events: [], ...d};
  if (agenda.tasks) {  // tasks from the short-lived separate panel become agenda tasks
    for (const t of agenda.tasks) agenda.events.push({id: t.id, kind: 'task', title: t.title, date: t.due || ymd(new Date()), allDay: false,
      start: t.dueTime || '23:59', end: t.dueTime || '23:59', repeat: 'none', until: '', place: '', color: KIND_DEFAULT.task.color, done: t.done});
    delete agenda.tasks; saveAgenda();
  }
  renderAgenda();
}).catch(e => toast('Agenda indisponible : ' + e.message, true));

/* ---------- top bar: today + deadlines ---------- */
const dueAt = t => { const d = parseDay(t.date), [h, m] = t.start.split(':').map(Number); d.setHours(h, m); return d; };
function until(ms) {  // "dans 3 j 4 h", "dans 1 h 30", "en retard de 2 j"
  const late = ms < 0, m = Math.round(Math.abs(ms) / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  const s = d >= 7 ? d + ' j' : d >= 1 ? d + ' j' + (h % 24 ? ' ' + h % 24 + ' h' : '') : h >= 1 ? h + ' h' + (m % 60 ? ' ' + pad(m % 60) : '') : m + ' min';
  return (late ? 'en retard de ' : 'dans ') + s;
}
console.assert(until(90 * 60000) === 'dans 1 h 30' && until(-2 * 86400000) === 'en retard de 2 j' && until(3 * 86400000 + 4 * 3600000) === 'dans 3 j 4 h' && until(10 * 86400000) === 'dans 10 j', 'until');
const urgency = ms => ms < 0 ? 'late' : ms < 86400000 ? 'urgent' : ms < 3 * 86400000 ? 'soon' : '';

function renderTop() {
  const bar = $('todayBar'), now = new Date(), today = ymd(now), nm = now.getHours() * 60 + now.getMinutes();
  bar.innerHTML = '';
  // today: holidays, all-day items, then timed events in order (tasks have their own card)
  const items = holidays(now.getFullYear()).filter(h => h.date === today).map(h => ({title: '★ ' + h.title, color: '#e89a3a', allDay: true}))
    .concat(agenda.events.filter(ev => ev.kind !== 'task' && occurs(ev, parseDay(today))).sort((a, b) => (b.allDay - a.allDay) || toMin(a.start) - toMin(b.start)));
  if (items.length) {
    const c = el('section', 'tcard px'); c.append(el('span', 'label', "Aujourd'hui"));
    for (const ev of items) {
      const r = el('div', 'titem'), dot = el('span', 'dot'); dot.style.setProperty('--ec', ev.color);
      let title = ev.title, badge = null;
      if (ev.kind === 'birthday') { const age = now.getFullYear() - parseDay(ev.date).getFullYear(); title = 'Anniv. ' + ev.title + (age > 0 ? ' · ' + age + ' ans' : ''); }
      if (!ev.allDay) {
        const s = toMin(ev.start), e = toMin(ev.end);
        if (nm >= e) r.classList.add('past');
        else badge = nm >= s ? el('span', 'badge now', 'en cours') : el('span', 'badge', until((s - nm) * 60000));
      }
      r.append(el('span', 'tt', ev.allDay ? 'JOUR' : ev.start), dot, el('span', 'tn', title + (ev.place ? ' · ' + ev.place : '')));
      if (badge) r.append(badge);
      if (ev.id) r.onclick = () => openEv(ev); else r.style.cursor = 'var(--ca, default)';
      c.append(r);
    }
    bar.append(c);
  }
  // deadlines: unfinished tasks, soonest first; the box marks one as done
  const due = agenda.events.filter(ev => ev.kind === 'task' && !ev.done).sort((a, b) => dueAt(a) - dueAt(b)).slice(0, 6);
  if (due.length) {
    const c = el('section', 'tcard px'); c.append(el('span', 'label', 'À rendre'));
    for (const t of due) {
      const ms = dueAt(t) - now, r = el('div', 'titem'), box = el('span', 'box');
      box.title = 'Marquer comme terminée';
      box.onclick = e => { e.stopPropagation(); t.done = true; saveAgenda(); renderAgenda(); toast('Bien joué : « ' + t.title + ' » terminée'); };
      r.append(box, el('span', 'tt', dueAt(t).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})), el('span', 'tn', t.title), el('span', 'badge ' + urgency(ms), until(ms)));
      r.onclick = () => openEv(t);
      c.append(r);
    }
    bar.append(c);
  }
}

