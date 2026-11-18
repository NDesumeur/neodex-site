// découpé de index.html : chargé à la même place que le code d'origine (mêmes variables globales, même ordre)
/* ---------- Son app: master volume, output device and each program's volume (audio.ps1 through the main process) ---------- */
let auTimer = null, auBusy = false, auDrag = false;
async function auOpen(state) {
  clearTimeout(auTimer);
  if (active?.app !== APPS['neodex:sound']) return;
  auTimer = setTimeout(() => auOpen(), 3000);
  if (auDrag) return;
  let s = state; try { s ??= await neo.audioState(); } catch (e) { $('auList').replaceChildren(el('div', 'hint', 'Son indisponible : ' + e.message)); return; }
  $('auDevice').replaceChildren(...s.devices.map(d => new Option(d.name, d.id))); $('auDevice').value = s.devices.find(d => d.default)?.id || '';
  const row = (name, sub, icon, vol, mute, pid) => {
    const r = el('div', 'auRow' + (mute ? ' muted' : '')), ic = el('img'), n = el('div', 'tn'), sl = el('input'), m = el('button', 'btn px'), v = el('span', 'v', Math.round(vol * 100) + ' %');
    ic.src = icon || artImg('sound'); ic.onerror = () => ic.src = artImg('sound');
    n.append(name, el('small', '', sub));
    sl.type = 'range'; sl.min = 0; sl.max = 100; sl.value = Math.round(vol * 100);
    sl.onpointerdown = () => auDrag = true;
    sl.oninput = () => { v.textContent = sl.value + ' %'; clearTimeout(sl.t); sl.t = setTimeout(() => neo.audioSet({cmd: 'volume', pid, value: sl.value / 100}), 60); };
    sl.onchange = () => { auDrag = false; neo.audioSet({cmd: 'volume', pid, value: sl.value / 100}).then(auOpen); };
    m.innerHTML = pixIcon(PIX[mute ? 'mute' : 'sound']); m.title = mute ? 'Remettre le son' : 'Couper le son';
    m.onclick = () => neo.audioSet({cmd: 'mute', pid, value: !mute}).then(auOpen);
    r.append(ic, n, m, sl, v);
    return r;
  };
  $('auMaster').replaceChildren(row('Volume général', s.devices.find(d => d.default)?.name || '', artImg('sound'), s.master.volume, s.master.mute, -1));
  // one row per program (several sessions of the same program move together through its pid)
  $('auList').replaceChildren(...(s.sessions.length ? s.sessions.sort((a, b) => b.active - a.active || (a.name || '').localeCompare(b.name || '')).map(x =>
    row(x.system ? 'Sons système' : x.name || x.title || 'Programme ' + x.pid, x.active ? 'joue du son en ce moment' : 'silencieux', x.path ? '/api/icon?t=' + TOKEN + '&p=' + encodeURIComponent(x.path) : '', x.volume, x.mute, x.pid))
    : [el('div', 'hint', 'Aucun programme ne joue de son.')]));
}
$('auDevice').onchange = e => neo.audioSet({cmd: 'device', id: e.target.value}).then(s => { toast('Sortie audio : ' + e.target.selectedOptions[0].text); auOpen(s); }).catch(err => toast('Impossible : ' + err.message, true));
