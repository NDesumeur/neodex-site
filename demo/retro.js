// part of the NeoDex page (index.html): classic script sharing its global scope, loaded in the order of the page
/* ---------- retro sounds: square-wave blips made with Web Audio (no sound files), switched on / off in the settings ---------- */
let actx = null, sfxAt = 0;
const SFX = {  // notes played one after the other: [frequency in Hz, duration in s]
  click: [[1046, .025]], open: [[523, .04], [784, .04], [1046, .06]], close: [[784, .04], [523, .06]],
  launch: [[392, .03], [587, .03], [880, .03], [1318, .08]], notify: [[988, .06], [1318, .12]], error: [[196, .09], [147, .14]], type: [[2093, .008]],
};
function sfx(name) {
  if (typeof prefs === 'undefined' || !prefs?.sounds || (name === 'type' && !prefs.typeSounds) || performance.now() - sfxAt < 90) return;  // one sound at a time (a launch also opens a tab)
  sfxAt = performance.now();
  try {
    actx ??= new AudioContext();
    let t = actx.currentTime;
    for (const [f, d] of SFX[name]) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = name === 'type' ? 'triangle' : 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(.12 * prefs.soundVol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + .01); t += d;
    }
  } catch {}
}
document.addEventListener('click', e => { if (e.target.closest('button, .tab, .btab, .place, .fe, .naItem, .titem, .sysRow, .goal, input[type=checkbox]') && !e.target.closest('.tile')) sfx('click'); }, true);
document.addEventListener('keydown', e => { if (/INPUT|TEXTAREA/.test(e.target.tagName) && e.key.length === 1 && !e.ctrlKey) sfx('type'); }, true);

// small input window (Electron has no prompt()): resolves with the text typed, or null when cancelled
function ask(title, value = '', hint = '') {
  return new Promise(done => {
    const m = $('askModal'), inp = $('askInput');
    $('askTitle').textContent = title; $('askHint').textContent = hint; inp.value = value;
    m.classList.add('on'); window.neo?.win('focus'); setTimeout(() => { inp.focus(); inp.select(); });
    const end = v => { m.classList.remove('on'); $('askOk').onclick = $('askCancel').onclick = $('askX').onclick = inp.onkeydown = m.onclick = null; done(v); };
    $('askOk').onclick = () => end(inp.value);
    $('askCancel').onclick = $('askX').onclick = () => end(null);
    inp.onkeydown = e => { if (e.key === 'Enter') end(inp.value); if (e.key === 'Escape') end(null); };
    m.onclick = e => { if (e.target === m) end(null); };
  });
}

/* ---------- pixel art mouse cursor (settings.pixelCursor): drawn once into PNGs, used through the --ca / --cp CSS variables, plus a small burst on click ---------- */
const CURSORS = {
  text: [[3, 8], ['ooo.ooo', 'o##o##o', '.oo#oo.', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '..o#o..', '.oo#oo.', 'o##o##o', 'ooo.ooo']],
  arrow: [[1, 1], ['o........', 'oo.......', 'o#o......', 'o##o.....', 'o###o....', 'o####o...', 'o#####o..', 'o######o.', 'o#######o', 'o####oooo', 'o#o##o...', 'oo.o##o..', 'o..o##o..', '....o##o.', '....o##o.', '.....oo..']],
  grab: [[7, 6], ['.....oo.oo....', '....o##o##o...', '.oo.o##o##oo..', 'o##oo##o##o#o.', 'o###o##o##o#o.', '.o##o##o##o#o.', '.o##########o.', '..o#########o.', '..o#########o.', '...o#######o..', '...o#######o..', '....o######o..', '....oooooooo..']],
  grabbing: [[7, 5], ['...oo.oo.oo...', '..o##o##o##o..', '.oo##o##o##oo.', 'o#o########o#o', 'o############o', 'o############o', '.o##########o.', '..o########o..', '..o########o..', '...oooooooo...']],
  hand: [[5, 1], ['....oo........', '...o##o.......', '...o##o.......', '...o##o.......', '...o##ooo.....', '...o##o##ooo..', '.ooo##o##o##o.', 'o##o########o.', 'o###########o.', '.o##########o.',
    '.o#########o..', '..o########o..', '..o#######o...', '...o######o...', '...o######o...', '...oooooooo...']],
};
function cursorPng(rows, scale = 2) {  // white body, dark outline, magenta shadow one pixel down-right
  const c = document.createElement('canvas'); c.width = (rows[0].length + 1) * scale; c.height = (rows.length + 1) * scale;
  const g = c.getContext('2d'), at = (x, y) => rows[y]?.[x];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && (at(x + 1, y + 1) || '.') === '.') { g.fillStyle = '#e01ec8'; g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale); } }));
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = ch === 'o' ? '#130a20' : '#ffffff'; g.fillRect(x * scale, y * scale, scale, scale); } }));
  return c.toDataURL('image/png');
}
function applyCursor(on) {
  const root = document.documentElement;
  root.classList.toggle('pxc', on);
  if (!on) { root.style.removeProperty('--ca'); root.style.removeProperty('--cp'); window.neo?.siteCursor(null); return; }
  const v = ([[hx, hy], rows], fallback) => `url(${cursorPng(rows)}) ${hx * 2} ${hy * 2}, ${fallback}`;
  root.style.setProperty('--ca', v(CURSORS.arrow, 'default')); root.style.setProperty('--cp', v(CURSORS.hand, 'pointer'));
  window.neo?.siteCursor({arrow: v(CURSORS.arrow, 'auto'), hand: v(CURSORS.hand, 'pointer')});  // the websites get the same cursor and click
}
document.addEventListener('mousedown', e => {
  if (!prefs.pixelCursor || e.button) return;
  for (let i = 0; i < 6; i++) {
    const s = el('div', 'spark mini'), a = i / 6 * 6.28 + Math.random() * .5, d = 10 + Math.random() * 8;
    s.style.left = e.clientX - 1 + 'px'; s.style.top = e.clientY - 1 + 'px';
    s.style.background = ['#ff5ad9', '#d9c6ff', '#ffffff'][i % 3];
    s.style.setProperty('--dx', (Math.cos(a) * d | 0) + 'px'); s.style.setProperty('--dy', (Math.sin(a) * d | 0) + 'px');
    document.body.append(s); setTimeout(() => s.remove(), 400);
  }
}, true);

