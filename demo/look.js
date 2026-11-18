/* Look and feel: the fonts and the pixel cursor (« Polices et curseur » in the settings), interface sound styles (several ready-made
   styles, or a style / your own sound file / silence for each kind of sound) and accessibility (interface size, readable font, fewer
   animations, big cursor). All of it is in the settings, so it follows you on every synced PC: settings.tfont, font, cursorKind,
   cursorBack (the colour behind the white), soundPack, soundEvents, fontScale, readableFont, reduceMotion, bigCursor (main.js); custom sound files in sounds/. */

const LK_TITLE_FONTS = ['Press Start 2P', 'Silkscreen', 'VT323', 'Pixelify Sans', 'Jersey 10', 'Tiny5', 'DotGothic16', 'Handjet', 'Segoe UI', 'Consolas', 'Georgia', 'Impact', 'Comic Sans MS'];
const LK_TEXT_FONTS = ['Pixelify Clair', 'Pixelify Sans', 'VT323', 'Silkscreen', 'Jersey 10', 'Tiny5', 'DotGothic16', 'Handjet', 'Segoe UI', 'Verdana', 'Consolas', 'Georgia', 'Trebuchet MS', 'Comic Sans MS'];
function lkApply() {  // a font chosen by hand wins; otherwise the colour theme's style gives them (styles.css)
  const root = document.documentElement.style;
  if (prefs.tfont) root.setProperty('--title', `'${prefs.tfont}',monospace`); else root.removeProperty('--title');
  if (prefs.font) root.setProperty('--text', `'${prefs.font}','Pixelify Sans','Consolas',monospace`); else root.removeProperty('--text');
  lkCursor();
}

/* ---------- cursors: the pixel arrow and hand, or one of these shapes; white, with a colour behind (its shadow: the theme's accent, or the one chosen) ---------- */
const LK_CURSORS = {
  classique: ['Flèche NeoDex', null],
  etoile: ['Étoile', [[5, 0], ['.....o.....', '....o#o....', '....o#o....', 'oooo###oooo', 'o#########o', '.o#######o.', '..o#####o..', '.o###o###o.', '.o##o.o##o.', 'o#oo...oo#o', 'oo.......oo']]],
  viseur: ['Viseur', [[5, 5], ['....ooo....', '....o#o....', '....o#o....', '...........', 'ooo.....ooo', 'o##..o..##o', 'ooo.....ooo', '...........', '....o#o....', '....o#o....', '....ooo....']]],
  coeur: ['Cœur', [[5, 2], ['..ooo.ooo..', '.o###o###o.', 'o#########o', 'o#########o', 'o#########o', '.o#######o.', '..o#####o..', '...o###o...', '....o#o....', '.....o.....']]],
  eclair: ['Éclair', [[5, 0], ['.....ooo.', '....o##o.', '...o##o..', '..o##o...', '.o###oooo', 'o#######o', 'oooo##oo.', '...o##o..', '..o##o...', '..o#o....', '..oo.....']]],
  diamant: ['Diamant', [[5, 0], ['...ooooo...', '..o#####o..', '.o#######o.', 'o#########o', 'oooooooooo.', '.o#######o.', '..o#####o..', '...o###o...', '....o#o....', '.....o.....']]],
  couronne: ['Couronne', [[5, 0], ['o....o....o', 'oo..ooo..oo', 'o#o.o#o.o#o', 'o#ooo#ooo#o', 'o#########o', 'o#########o', 'o#########o', 'ooooooooooo']]],
  pointe: ['Pointe', [[0, 0], ['o..........', 'oo.........', 'o#o........', 'o##o.......', 'o###o......', 'o####o.....', 'o#####o....', 'o######o...', 'o#######o..', 'oooooooooo.']]],
  epee: ['Épée', [[0, 0], ['oo.........', 'o#o........', '.o#o.......', '..o#o......', '...o#o.....', '....o#o....', '.....o#o.o.', '......o#o#o', '.......o#o.', '......o#o#o', '.......o.oo']]],
  lune: ['Lune', [[2, 5], ['...oooo....', '..o###o....', '.o##oo.....', 'o##o.......', 'o##o.......', 'o##o.......', 'o##o.......', '.o##oo.....', '..o###o....', '...oooo....']]],
  bulle: ['Bulle', [[1, 1], ['.ooooooo...', 'o#######o..', 'o#######o..', 'o#######o..', 'o#######o..', '.oo###ooo..', '...o#o.....', '...oo......']]],
};
// chaque curseur dessiné et encodé en PNG une seule fois par forme, taille et couleurs (avant : 80 ms à chaque lkCursor(), appelé plusieurs fois au démarrage)
const LK_PNG = new Map();
function lkCursorPng(rows, scale, fill, out, shadow) {
  const key = rows.join('/') + '|' + scale + fill + out + shadow;
  if (!LK_PNG.has(key)) LK_PNG.set(key, lkCursorDraw(rows, scale, fill, out, shadow));
  return LK_PNG.get(key);
}
function lkCursorDraw(rows, scale, fill, out, shadow) {
  const w = Math.max(...rows.map(r => r.length)), c = document.createElement('canvas'); c.width = (w + 1) * scale; c.height = (rows.length + 1) * scale; if (scale === 2) c.height = Math.min(c.height, 32);  // Chromium drops a cursor over 32 px near a window's edge, so everywhere in the taskbar. shortcut: the big cursor (scale 4) stays over it, there the bar shows the system cursor
  const g = c.getContext('2d'), at = (x, y) => rows[y]?.[x] || '.';
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && at(x + 1, y + 1) === '.') { g.fillStyle = shadow; g.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale); } }));
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.fillStyle = ch === 'o' ? out : fill; g.fillRect(x * scale, y * scale, scale, scale); } }));
  return c.toDataURL('image/png');
}
function lkCursor() {
  const root = document.documentElement, kind = prefs.cursorKind || 'classique', big = !!prefs.bigCursor, on = prefs.pixelCursor || big;
  root.classList.toggle('pxc', on);
  if (!on) { for (const k of ['--ca', '--cp', '--ct', '--cg', '--cgg']) root.style.removeProperty(k); window.neo?.siteCursor(null); return; }
  const scale = big ? 4 : 2, fill = '#ffffff', shadow = lkShadow();
  const v = ([[hx, hy], rows], fb) => `url(${lkCursorPng(rows, scale, fill, '#130a20', shadow)}) ${hx * scale} ${hy * scale}, ${fb}`;
  const set = LK_CURSORS[kind]?.[1], lit = getComputedStyle(root).getPropertyValue('--pink').trim() || '#ff5ad9', vl = ([[hx, hy], rows], fb) => `url(${lkCursorPng(rows, scale, lit, '#130a20', shadow)}) ${hx * scale} ${hy * scale}, ${fb}`;
  root.style.setProperty('--ca', v(set || CURSORS.arrow, 'default')); root.style.setProperty('--cp', set ? vl(set, 'pointer') : v(CURSORS.hand, 'pointer')); root.style.setProperty('--ct', v(CURSORS.text, 'text')); root.style.setProperty('--cg', v(CURSORS.grab, 'grab')); root.style.setProperty('--cgg', v(CURSORS.grabbing, 'grabbing'));
  window.neo?.siteCursor({arrow: v(set || CURSORS.arrow, 'auto'), hand: set ? vl(set, 'pointer') : v(CURSORS.hand, 'pointer'), text: v(CURSORS.text, 'text'), grab: v(CURSORS.grab, 'grab'), grabbing: v(CURSORS.grabbing, 'grabbing')});  // the websites get the same cursors
}
function lkShadow() { return prefs.cursorBack || getComputedStyle(document.documentElement).getPropertyValue('--magenta').trim() || '#e01ec8'; }  // the colour behind the white
applyCursor = () => lkCursor();  // the settings' "pixel cursor" checkbox goes through here too

/* ---------- interface sounds: styles made with Web Audio, or a sound file per event ---------- */
// each event: notes [frequency, duration, {to: slide towards, noise: filtered noise, w: wave}]
const LK_EVENTS = {click: 'Clic', open: 'Ouverture d\'onglet', close: 'Fermeture d\'onglet', launch: 'Lancement, victoire', notify: 'Notification', error: 'Erreur', type: 'Frappe au clavier'};
const LK_PACKS = {
  retro: {name: 'Rétro 8 bits', w: 'square', g: .12, ev: SFX},
  doux: {name: 'Doux', w: 'sine', g: .22, ev: {click: [[660, .05]], open: [[440, .08], [660, .12]], close: [[660, .08], [440, .12]], launch: [[523, .08], [659, .08], [784, .16]], notify: [[880, .1], [1175, .2]], error: [[220, .15], [196, .25]], type: [[1200, .015]]}},
  bulles: {name: 'Bulles', w: 'sine', g: .25, ev: {click: [[400, .06, {to: 900}]], open: [[300, .08, {to: 900}], [500, .08, {to: 1300}]], close: [[900, .1, {to: 300}]], launch: [[300, .07, {to: 800}], [500, .07, {to: 1100}], [700, .12, {to: 1600}]],
    notify: [[600, .08, {to: 1400}], [800, .12, {to: 1800}]], error: [[500, .2, {to: 120}]], type: [[700, .03, {to: 1400}]]}},
  cristal: {name: 'Cristal', w: 'triangle', g: .2, ev: {click: [[2093, .06]], open: [[1568, .08], [2093, .14]], close: [[2093, .08], [1568, .14]], launch: [[1319, .07], [1568, .07], [2093, .07], [2637, .2]], notify: [[2349, .12], [3136, .25]], error: [[740, .18], [622, .3]], type: [[3000, .012]]}},
  arcade: {name: 'Arcade', w: 'square', g: .1, ev: {click: [[1500, .02], [2000, .02]], open: [[400, .03], [600, .03], [800, .03], [1000, .05]], close: [[1000, .03], [700, .03], [400, .05]], launch: [[523, .04], [784, .04], [1047, .04], [1568, .04], [2093, .1]],
    notify: [[1319, .05], [1760, .05], [1319, .05], [1760, .1]], error: [[300, .06], [200, .06], [120, .15]], type: [[2600, .006]]}},
  machine: {name: 'Machine à écrire', w: 'square', g: .3, ev: {click: [[2500, .02, {noise: 1}]], open: [[1800, .03, {noise: 1}], [900, .06, {noise: 1}]], close: [[900, .03, {noise: 1}], [1800, .05, {noise: 1}]],
    launch: [[2400, .02, {noise: 1}], [2400, .02, {noise: 1}], [3600, .2, {w: 'sine'}]], notify: [[3600, .25, {w: 'sine'}]], error: [[400, .15, {noise: 1}]], type: [[3000, .015, {noise: 1}]]}},
  spatial: {name: 'Spatial', w: 'sawtooth', g: .07, ev: {click: [[1200, .05, {to: 2400}]], open: [[200, .2, {to: 1200}]], close: [[1200, .2, {to: 200}]], launch: [[150, .3, {to: 2000}]], notify: [[800, .08, {to: 1600}], [1600, .15, {to: 800}]], error: [[400, .3, {to: 60}]], type: [[1800, .01]]}},
  bois: {name: 'Bois', w: 'sine', g: .35, ev: {click: [[880, .03]], open: [[587, .04], [880, .07]], close: [[880, .04], [587, .07]], launch: [[440, .05], [587, .05], [740, .05], [880, .12]], notify: [[1175, .06], [880, .1]], error: [[196, .08], [147, .14]], type: [[1400, .01]]}},
  minimal: {name: 'Minimal', w: 'sine', g: .15, ev: {click: [[1000, .012]], open: [[1200, .02]], close: [[800, .02]], launch: [[1200, .02], [1600, .04]], notify: [[1500, .05]], error: [[300, .06]], type: [[1800, .005]]}},
  harpe: {name: 'Harpe', w: 'triangle', g: .22, ev: {click: [[784, .09]], open: [[523, .06], [659, .06], [784, .14]], close: [[784, .06], [659, .06], [523, .14]], launch: [[523, .05], [659, .05], [784, .05], [1047, .05], [1319, .05], [1568, .25]], notify: [[1047, .08], [1319, .08], [1568, .22]], error: [[392, .12], [370, .12], [349, .3]], type: [[1568, .02]]}},
  marimba: {name: 'Marimba', w: 'sine', g: .4, ev: {click: [[587, .05, {to: 560}]], open: [[392, .06, {to: 380}], [587, .1, {to: 570}]], close: [[587, .06, {to: 570}], [392, .1, {to: 380}]], launch: [[392, .06], [494, .06], [587, .06], [784, .18, {to: 760}]], notify: [[784, .07], [988, .16, {to: 960}]], error: [[247, .1], [196, .22, {to: 185}]], type: [[880, .015]]}},
  carillon: {name: 'Carillon', w: 'sine', g: .18, ev: {click: [[2637, .12]], open: [[1976, .1], [2637, .22]], close: [[2637, .1], [1976, .22]], launch: [[1568, .12], [1976, .12], [2349, .12], [3136, .4]], notify: [[2349, .18], [1760, .18], [2349, .35]], error: [[988, .2], [932, .4]], type: [[3520, .02]]}},
  laser: {name: 'Laser', w: 'sawtooth', g: .08, ev: {click: [[2400, .04, {to: 800}]], open: [[600, .08, {to: 2600}]], close: [[2600, .08, {to: 500}]], launch: [[300, .1, {to: 3000}], [3000, .12, {to: 1200}]], notify: [[2000, .05, {to: 3200}], [2000, .05, {to: 3200}]], error: [[1400, .25, {to: 90}]], type: [[3200, .01, {to: 1600}]]}},
  zen: {name: 'Zen', w: 'sine', g: .24, ev: {click: [[330, .08]], open: [[262, .12], [392, .2]], close: [[392, .12], [262, .2]], launch: [[262, .15], [330, .15], [392, .15], [523, .45]], notify: [[523, .25], [392, .4]], error: [[165, .3], [147, .45]], type: [[660, .02]]}},
  console: {name: 'Console de poche', w: 'square', g: .09, ev: {click: [[1760, .03]], open: [[1047, .04], [1568, .06]], close: [[1568, .04], [1047, .06]], launch: [[1047, .05], [1319, .05], [1568, .05], [2093, .05], [1568, .05], [2093, .16]], notify: [[1568, .06], [2093, .12]], error: [[220, .08, {noise: 1}], [147, .16]], type: [[2400, .008]]}},
};
const lkBuffers = {};
let lkNoise = null;
async function lkFileBuffer(name) {
  if (lkBuffers[name]) return lkBuffers[name];
  const b64 = await neo.filesRead('sounds', name), bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return lkBuffers[name] = await (actx ??= new AudioContext()).decodeAudioData(bin.buffer);
}
function lkPlay(pack, name) {
  const p = LK_PACKS[pack] || LK_PACKS.retro, notes = p.ev[name]; if (!notes) return;
  actx ??= new AudioContext();
  let t = actx.currentTime;
  for (const [f, d, o = {}] of notes) {
    const g = actx.createGain(); g.gain.setValueAtTime(p.g * prefs.soundVol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if (o.noise) {
      if (!lkNoise) { lkNoise = actx.createBuffer(1, actx.sampleRate * .3, actx.sampleRate); const ch = lkNoise.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const s = actx.createBufferSource(), bp = actx.createBiquadFilter(); s.buffer = lkNoise; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 3;
      s.connect(bp).connect(g).connect(actx.destination); s.start(t); s.stop(t + d + .01);
    } else {
      const osc = actx.createOscillator(); osc.type = o.w || (name === 'type' && pack === 'retro' ? 'triangle' : p.w); osc.frequency.setValueAtTime(f, t);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
      osc.connect(g).connect(actx.destination); osc.start(t); osc.stop(t + d + .01);
    }
    t += d;
  }
}
// what plays for an event: its own choice (a style, a file, nothing), else the style chosen for all
sfx = function (name) {
  if (!prefs.sounds || (name === 'type' && !prefs.typeSounds) || performance.now() - sfxAt < 90) return;
  sfxAt = performance.now();
  const ch = prefs.soundEvents?.[name] || prefs.soundPack || 'retro';
  try {
    if (ch === 'off') return;
    if (ch.startsWith('file:')) return void lkFileBuffer(ch.slice(5)).then(b => { const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = prefs.soundVol; s.buffer = b; s.connect(g).connect(actx.destination); s.start(); }).catch(() => lkPlay(prefs.soundPack, name));
    lkPlay(ch, name);
  } catch {}
};
function lkSoundsUi() {  // added to the « Sons » part of the settings
  const sec = $('setSounds').closest('.setSec'), box = el('div', 'lkSounds');
  sec.append(box);
  const draw = () => {
    const pack = el('select', 'f'); pack.append(...Object.entries(LK_PACKS).map(([k, p]) => Object.assign(el('option', '', p.name), {value: k}))); pack.value = prefs.soundPack || 'retro';
    pack.onchange = async () => { prefs = await neo.setSettings({soundPack: pack.value}); ['open', 'launch', 'notify'].forEach((n, i) => setTimeout(() => lkPlay(pack.value, n), i * 300)); };
    const top = el('div', 'row'); top.append(el('span', 'hint', 'Style des sons'), pack);
    const det = el('details', 'lkDetails'), sum = el('summary', '', 'Personnaliser chaque son'); det.append(sum);
    for (const [ev, label] of Object.entries(LK_EVENTS)) {
      const r = el('div', 'lkEv'), s = el('select', 'f'), play = el('button', 'btn px', '▶'), cur = prefs.soundEvents?.[ev] || '';
      s.append(Object.assign(el('option', '', 'Comme le style choisi'), {value: ''}), ...Object.entries(LK_PACKS).map(([k, p]) => Object.assign(el('option', '', p.name), {value: k})),
        Object.assign(el('option', '', 'Silence'), {value: 'off'}), ...(cur.startsWith('file:') ? [Object.assign(el('option', '', 'Fichier : ' + cur.slice(16)), {value: cur})] : []), Object.assign(el('option', '', 'Mon fichier son…'), {value: 'pick'}));
      s.value = cur;
      s.onchange = async () => {
        let v = s.value;
        if (v === 'pick') {
          const fi = Object.assign(el('input'), {type: 'file', accept: 'audio/*,.mp3,.wav,.ogg,.m4a'});
          fi.onchange = async () => { try { const n = await neo.filesAdd('sounds', neo.pathOf(fi.files[0])); await setEv(ev, 'file:' + n); sfxAt = 0; sfx(ev); } catch (e) { toast('Son refusé : ' + e.message.replace(/^.*Error: /, ''), true); draw(); } };
          fi.oncancel = draw; fi.click(); return;
        }
        await setEv(ev, v); sfxAt = 0; sfx(ev);
      };
      play.onclick = () => { sfxAt = 0; const was = prefs.sounds; prefs.sounds = true; sfx(ev); prefs.sounds = was; };
      r.append(el('span', '', label), s, play); det.append(r);
    }
    box.replaceChildren(top, det);
  };
  const setEv = async (ev, v) => {
    const evs = {...prefs.soundEvents}; if (v) evs[ev] = v; else delete evs[ev];
    prefs = await neo.setSettings({soundEvents: evs}); draw();
    neo.filesPrune('sounds', Object.values(evs).filter(x => x.startsWith('file:')).map(x => x.slice(5))).catch(() => {});
  };
  draw();
}

/* ---------- accessibility ---------- */
function applyA11y() {
  const r = document.documentElement.classList;
  r.toggle('a11yRead', !!prefs.readableFont); r.toggle('a11yCalm', !!prefs.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches);  // Windows' « reduce animations » too
  neo.zoom(Math.min(1.75, Math.max(.8, prefs.fontScale || 1)));
  lkCursor();
}
function lkA11yUi() {
  const look = $('setBg').closest('.setSec'), sec = el('div', 'setSec');
  look.after(sec);
  const check = (k, label) => { const l = el('label', 'check'), i = el('input'); i.type = 'checkbox'; i.checked = !!prefs[k]; i.onchange = async () => { prefs = await neo.setSettings({[k]: i.checked}); applyA11y(); }; l.append(i, ' ' + label); return l; };
  const size = Object.assign(el('input'), {type: 'range', min: .8, max: 1.75, step: .05, value: prefs.fontScale || 1}), val = el('b', '', Math.round((prefs.fontScale || 1) * 100) + ' %');
  size.style.cssText = 'flex:1;accent-color:var(--magenta)';
  size.oninput = () => { val.textContent = Math.round(size.value * 100) + ' %'; };
  size.onchange = async () => { prefs = await neo.setSettings({fontScale: +size.value}); applyA11y(); };
  const reset = el('button', 'btn px', '100 %'); reset.onclick = async () => { size.value = 1; val.textContent = '100 %'; prefs = await neo.setSettings({fontScale: 1}); applyA11y(); };
  const row = el('div', 'row'); row.append(el('span', 'hint', 'Taille de l\'interface'), size, val, reset);
  sec.append(el('span', 'label', 'Accessibilité'), row, check('readableFont', 'Police lisible à la place des polices pixel'), check('reduceMotion', 'Réduire les animations (décor, transitions, effets)'));
}
{  // a new theme brings its accent: the colour behind the cursor follows, unless one was chosen
  const a0 = applyTheme;
  applyTheme = (k, preview) => { a0(k, preview); if (typeof prefs !== 'undefined' && prefs && !prefs.cursorBack) lkCursor(); };
}
/* ---------- « Polices et curseur » in the settings: each font shown in itself, each cursor drawn as it will be, a corner to try it ---------- */
const LK_SWATCHES = ['#ff4d6d', '#ff9a3c', '#ffd23f', '#a8f04a', '#6bf08a', '#2ee6c9', '#4dc3ff', '#5a7bff', '#8a6cff', '#c084ff', '#ff7ad9', '#ff9ec0', '#a0a0ae', '#4a4a56', '#111111'];
function lkStyleUi() {
  const look = $('setBg').closest('.setSec'), sec = el('div', 'setSec');
  look.after(sec);
  const draw = () => {
    const set = async o => { prefs = await neo.setSettings(o); lkApply(); draw(); };
    // the fonts: a card per font, written in that font
    const fonts = (key, list, sample) => {
      const g = el('div', 'lkFonts');
      for (const f of ['', ...list]) {
        const b = el('button', 'lkFont' + ((prefs[key] || '') === f ? ' on' : '')), s = el('b', '', sample), n = el('span', '', f || 'Celle du thème');
        s.style.fontFamily = f ? "'" + f + "'" : (key === 'tfont' ? 'var(--title)' : 'var(--text)');
        b.append(s, n); b.onclick = () => set({[key]: f}); g.append(b);
      }
      return g;
    };
    // the cursors: each shape drawn white over the colour behind it, as big as on screen (or bigger with « Grand curseur »)
    const cur = prefs.cursorKind || 'classique', shadow = lkShadow(), on = prefs.pixelCursor || prefs.bigCursor;
    const kinds = el('div', 'lkKinds');
    for (const [k, [name, shape]] of Object.entries(LK_CURSORS)) {
      const b = el('button', 'lkKind' + (on && k === cur ? ' on' : '')), img = el('img'); img.src = lkCursorPng(shape ? shape[1] : CURSORS.arrow[1], 4, '#ffffff', '#130a20', shadow); img.style.imageRendering = 'pixelated';
      b.append(img, el('span', '', name)); b.onclick = () => set({cursorKind: k, pixelCursor: true}); kinds.append(b);
    }
    const sys = el('button', 'lkKind lkSys' + (on ? '' : ' on')); sys.append(el('i', '', '↖'), el('span', '', 'Celui de Windows')); sys.onclick = () => set({pixelCursor: false, bigCursor: false}); kinds.prepend(sys);
    const sw = el('div', 'lkSwRow'), auto = el('button', 'lkSw lkSwAuto' + (prefs.cursorBack ? '' : ' on'), 'A'); auto.title = 'L\'accent du thème (change avec lui)'; auto.style.background = getComputedStyle(document.documentElement).getPropertyValue('--magenta').trim(); auto.onclick = () => set({cursorBack: ''}); sw.append(auto);
    for (const c of LK_SWATCHES) { const b = el('button', 'lkSw' + (c === prefs.cursorBack ? ' on' : '')); b.style.background = c; b.title = c; b.onclick = () => set({cursorBack: c, pixelCursor: true}); sw.append(b); }
    const pick = Object.assign(el('input'), {type: 'color', value: shadow, title: 'Autre couleur'}); pick.onchange = () => set({cursorBack: pick.value, pixelCursor: true}); sw.append(pick);
    const sizes = el('div', 'row'); for (const [big, n] of [[false, 'Normal'], [true, 'Grand']]) { const b = el('button', 'tab px' + (!!prefs.bigCursor === big && on ? ' on' : ''), n); b.onclick = () => set({bigCursor: big, pixelCursor: true}); sizes.append(b); }
    const tryIt = el('div', 'lkTry'); tryIt.append(el('span', '', 'Passe la souris ici pour essayer'), Object.assign(el('button', 'btn px'), {textContent: 'UN BOUTON'}), Object.assign(el('input', 'f'), {placeholder: 'Un champ de texte'}));
    const two = el('div', 'lkTwo'), a = el('div', 'field'), b = el('div', 'field'); two.append(a, b);
    a.append(el('span', 'label', 'Couleur derrière le blanc'), sw); b.append(el('span', 'label', 'Taille'), sizes);
    sec.replaceChildren(el('span', 'label', 'Polices et curseur'),
      el('span', 'label', 'Police des titres'), fonts('tfont', LK_TITLE_FONTS, 'NeoDex 12:34'),
      el('span', 'label', 'Police du texte'), fonts('font', LK_TEXT_FONTS, 'Bonjour ! 0123'),
      el('span', 'label', 'Curseur'), kinds, two, tryIt);
  };
  draw();
}
function lkSettingsTabs() {
  const body = $('setModal').querySelector('.body'), secs = [...body.querySelectorAll(':scope>.setSec')], nav = el('nav', 'setNav'), pane = el('div', 'setPane');
  let last = ''; try { last = localStorage.neoSetTab || ''; } catch {}
  const show = i => { secs.forEach((s, j) => s.classList.toggle('on', i === j)); [...nav.children].forEach((b, j) => b.classList.toggle('on', i === j)); try { localStorage.neoSetTab = secs[i].dataset.tab; } catch {} pane.scrollTop = 0; };
  secs.forEach((s, i) => { const n = s.querySelector(':scope>.label')?.textContent || 'Autre'; s.dataset.tab = n; const b = el('button', 'setTabBtn', n); b.onclick = () => show(i); nav.append(b); });
  body.classList.add('setTabs'); pane.append(...secs); body.replaceChildren(nav, pane);
  show(Math.max(0, secs.findIndex(s => s.dataset.tab === last)));
}
window.neo?.onSettingsChanged(async () => { prefs = await neo.getSettings(); lkApply(); applyA11y(); });
window.neo?.getSettings().then(s => { prefs = s; lkApply(); applyA11y(); lkSoundsUi(); lkA11yUi(); lkStyleUi(); lkSettingsTabs(); });
