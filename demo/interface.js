// part of the NeoDex page (index.html): classic script sharing its global scope, loaded in the order of the page
/* ---------- search / keyboard ---------- */
$('search').oninput = render;
addEventListener('keydown', e => {
  if (active || document.querySelector('#modal.on,#evModal.on,#setModal.on,#histModal.on,#quitModal.on,#askModal.on,#fm.on') || (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target !== $('search'))) return;
  if (e.key === 'Escape') { $('search').value = ''; render(); return; }
  if (e.key === 'Enter') { const t = document.querySelector('#groups .tile'); if (t && $('search').value) t.click(); return; }
  if (e.key.length === 1 && !e.ctrlKey && !e.altKey && document.activeElement !== $('search')) $('search').focus();
});

/* ---------- pixel-art button icons: 7x7 grids, '#' = pixel, drawn 2x as crisp SVG into [data-pix] buttons ---------- */
const PIX = {
  min:    ['.......', '.......', '.......', '.......', '.......', '#######', '#######'],
  max:    ['#######', '#######', '#.....#', '#.....#', '#.....#', '#.....#', '#######'],
  close:  ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##'],
  back:   ['...##..', '..##...', '.##....', '##.....', '.##....', '..##...', '...##..'],
  fwd:    ['..##...', '...##..', '....##.', '.....##', '....##.', '...##..', '..##...'],
  reload: ['..###.#', '.#...##', '#...###', '#......', '#.....#', '.#...#.', '..###..'],
  ext:    ['...####', '.....##', '....#.#', '...#..#', '..#....', '.#.....', '#......'],
  plus:   ['...#...', '...#...', '...#...', '#######', '...#...', '...#...', '...#...'],
  play:   ['.#.....', '.##....', '.###...', '.####..', '.###...', '.##....', '.#.....'],
  pause:  ['.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.'],
  rew:    ['...#..#', '..##.##', '.######', '#######', '.######', '..##.##', '...#..#'],
  ffw:    ['#..#...', '##.##..', '######.', '#######', '######.', '##.##..', '#..#...'],
  next:   ['#....##', '##...##', '###..##', '####.##', '###..##', '##...##', '#....##'],
  sound:  ['...#...', '..##.#.', '####..#', '####..#', '####..#', '..##.#.', '...#...'],
  mute:   ['...#...', '..##...', '####.#.', '####..#', '####.#.', '..##...', '...#...'],
  up:     ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'],
  down:   ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'],
  eye:    ['.......', '..###..', '.#...#.', '#..#..#', '.#...#.', '..###..', '.......'],
  eyeOff: ['#......', '.####..', '.##..#.', '#..#..#', '.#..##.', '..####.', '......#'],
  star:   ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
};
const pixIcon = (rows, scale = 2) => {
  let d = '';
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') d += `M${x} ${y}h1v1H${x}z`; }));
  const w = rows[0].length, h = rows.length;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" shape-rendering="crispEdges" fill="currentColor"><path d="${d}"/></svg>`;
};
document.querySelectorAll('[data-pix]').forEach(b => b.innerHTML = pixIcon(PIX[b.dataset.pix]));

/* ---------- weather next to the clock (Open-Meteo, no account; city set in the settings) ---------- */
const WX = {  // 9x9 pixel icons + colour
  sun:    ['#ffd07a', ['....#....', '.#.....#.', '...###...', '..#####..', '#.#####.#', '..#####..', '...###...', '.#.....#.', '....#....']],
  moon:   ['#d9c6ff', ['...###...', '..##.....', '.##......', '.##......', '.##......', '.##......', '..##.....', '...####..', '.........']],
  partly: ['#ffd07a', ['.#...#...', '...##....', '..####...', '.#.####..', '..######.', '.########', '#########', '.#######.', '.........']],
  cloud:  ['#c9bdf0', ['.........', '...###...', '..#####..', '.########', '#########', '#########', '.#######.', '.........', '.........']],
  fog:    ['#9a8cc8', ['.........', '#######..', '.........', '..#######', '.........', '#######..', '.........', '..#######', '.........']],
  rain:   ['#7fe0ee', ['...###...', '..#####..', '.#######.', '#########', '.#######.', '.........', '.#..#..#.', '#..#..#..', '.........']],
  snow:   ['#ffffff', ['...###...', '..#####..', '.#######.', '#########', '.#######.', '.........', '.#..#..#.', '.........', '#..#..#..']],
  storm:  ['#ffd07a', ['...###...', '..#####..', '.#######.', '#########', '.#######.', '....##...', '...##....', '..####...', '....#....']],
};
const WX_LABEL = {sun: 'Ensoleillé', moon: 'Dégagé', partly: 'Éclaircies', cloud: 'Couvert', fog: 'Brouillard', rain: 'Pluie', snow: 'Neige', storm: 'Orage'};
const wxKind = (c, day) => c === 0 ? (day ? 'sun' : 'moon') : c <= 2 ? 'partly' : c === 3 ? 'cloud' : c <= 48 ? 'fog'
  : c <= 67 || (c >= 80 && c <= 82) ? 'rain' : c <= 77 || c === 85 || c === 86 ? 'snow' : 'storm';  // WMO weather codes
console.assert(wxKind(0, 1) === 'sun' && wxKind(0, 0) === 'moon' && wxKind(3, 1) === 'cloud' && wxKind(61, 1) === 'rain' && wxKind(81, 1) === 'rain' && wxKind(73, 1) === 'snow' && wxKind(95, 1) === 'storm', 'wxKind');
async function loadWeather() {
  const w = $('weather');
  if (!prefs.weatherCity) return w.replaceChildren();
  try {
    const d = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${prefs.weatherLat}&longitude=${prefs.weatherLon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`).then(r => r.json());
    const k = wxKind(d.current.weather_code, d.current.is_day), ic = el('span'), txt = el('div');
    ic.innerHTML = pixIcon(WX[k][1], 3); ic.style.color = WX[k][0];
    txt.append(el('div', 'wt', Math.round(d.current.temperature_2m) + '°'),
      el('div', 'label wl', prefs.weatherCity + ' · ' + Math.round(d.daily.temperature_2m_min[0]) + '° / ' + Math.round(d.daily.temperature_2m_max[0]) + '°'));
    w.replaceChildren(ic, txt); w.title = WX_LABEL[k];
  } catch { w.replaceChildren(); }  // offline: just no weather
}
setInterval(() => window.neo && loadWeather(), 30 * 60000);

/* ---------- appearance themes: each one is a style (fonts, frames, effects: styles.css, html[data-style]) and its palette ---------- */
// key, name, what it looks like, surface hue, surface saturation, accent, light accent, third colour (Classique, the base style, keeps the logo's colours)
const PAL = [
  ['terminal', 'Terminal', 'Écran à phosphore vert : une seule police de console, du texte qui luit, un balayage marqué.', 135, 45, '#33ff66', '#b4ffc8', '#ffd23f', .6],
  ['poche', 'Console de poche', 'Les verts d’un écran LCD de console portable, de gros pixels et une trame de points.', 85, 38, '#9bbc0f', '#d6e88a', '#e8c35a', 2.4],
  ['synthwave', 'Synthwave', 'Coucher de soleil rétro : dégradés rose et orange, titres chromés, grille d’horizon.', 268, 70, '#ff3fa4', '#ffb36b', '#38e8ff', 2],
  ['grimoire', 'Grimoire', 'Les boîtes de dialogue d’un jeu de rôle : double cadre doré sur parchemin sombre.', 28, 35, '#e0a940', '#f5dca0', '#d0603f', 1.8],
  ['verre', 'Verre dépoli', 'Moderne : panneaux translucides et flous, coins arrondis, texte net.', 228, 30, '#7aa8ff', '#d4e2ff', '#ff9ad5', 2.2],
  ['plan', 'Plan d’architecte', 'Papier bleu quadrillé, traits fins en pointillés, tout en capitales.', 212, 65, '#ffffff', '#cfe6ff', '#ffd23f', 3.4],
  ['manga', 'Manga', 'Noir et blanc, traits épais, ombres portées franches et trame de points.', 0, 0, '#ffffff', '#ffffff', '#ff3355', .4],
  ['sakura', 'Sakura', 'Pastel doux, rose et vert tendre, coins ronds, sans balayage.', 330, 34, '#ff9ec7', '#ffd6e8', '#9be8b4', 3],
  ['abysses', 'Abysses', 'Fond marin : bleus profonds, lueurs bioluminescentes, cadres fins.', 210, 62, '#21d4fd', '#9af0ff', '#b388ff', 1.6],
  ['cyber', 'Cyberpunk', 'Néon jaune et cyan sur béton nocturne : coins coupés, bandes de danger, texte qui grésille.', 190, 30, '#fcee0a', '#00f0ff', '#ff2a6d', 1.4],
  ['foret', 'Forêt enchantée', 'Mousse et bois : cadres en bois arrondis, lueurs de lucioles, vert profond.', 120, 32, '#b6e36b', '#f2e3a0', '#ffb347', 2],
  ['arcade', 'Borne d’arcade', 'Une salle d’arcade : rouge, jaune et bleu francs, gros contours noirs, chiffres à points.', 230, 45, '#ff3b30', '#ffd60a', '#2f8cff', 1.2],
  ['ardoise', 'Tableau noir', 'Un vrai tableau noir d’école : traits à la craie blanche, rose et bleue, cadre en bois, traces de chiffon.', 150, 4, '#f4f1e8', '#ffd1dc', '#9fd8ff', 3],
  ['vapor', 'Vaporwave 95', 'Un vieux bureau d’ordinateur en pastel : fenêtres en relief, barres de titre dégradées, grille rose à l’horizon.', 290, 40, '#ff71ce', '#01cdfe', '#b967ff', 2.6],
  ['lave', 'Volcan', 'Obsidienne et lave : cadres qui rougeoient, titre en fusion, chaleur qui monte du bas de l’écran.', 10, 40, '#ff5a1f', '#ffc04d', '#ff2d2d', .8],
  ['givre', 'Givre', 'Tout est gelé : panneaux de glace flous, givre dans les coins, éclats de neige.', 200, 45, '#bdf2ff', '#ffffff', '#7fb8ff', 2.4],
  ['sepia', 'Vieux film', 'Une pellicule des années 20 : sépia, rayures et grain qui tremblent, perforations de film autour des barres.', 35, 30, '#e8c48a', '#f6e7c8', '#b5835a', 1.8],
  ['holo', 'Hologramme', 'Des reflets irisés qui changent de couleur : cadres arc-en-ciel, titre holographique qui ondule.', 260, 30, '#f7a8ff', '#9df7e5', '#a8c8ff', 1.4],
  ['hud', 'Cockpit', 'L’affichage tête haute d’un vaisseau : coins de visée au lieu des cadres, lignes fines cyan, alertes orange.', 195, 50, '#3ff5ff', '#c8fdff', '#ff9f1c', .7],
  ['jardin', 'Jardin fleuri', 'Plantes et petites fleurs : une prairie au bas de l’écran, des lianes le long des barres, des fleurs aux coins des panneaux.', 110, 35, '#7ed957', '#ffb3d1', '#ffe066', 2.2],
  ['neige', 'Neige', 'Un soir d’hiver bien au chaud : la neige tombe doucement, et elle s’entasse sur les panneaux et les barres.', 215, 35, '#ffffff', '#cfe8ff', '#ff6b6b', 2.6],
  ['aurore', 'Aurore boréale', 'Une nuit polaire : des voiles verts et violets ondulent dans le ciel, les cadres luisent comme la glace.', 190, 45, '#5cffb0', '#b28dff', '#5ce1ff', 1.2],
  ['steampunk', 'Steampunk', 'Laiton, cuivre et rivets : des engrenages aux coins des panneaux, des barres en métal riveté.', 30, 35, '#d9a441', '#f0d6a0', '#b8653a', 1.6],
  ['bonbon', 'Bonbons', 'Une confiserie : rayures de sucre d’orge, coins tout ronds, couleurs acidulées, tuiles qui rebondissent.', 330, 40, '#ff7eb6', '#7ef5d2', '#ffe066', 2.8]];
const hsl2rgb = (h, s, l) => { s /= 100; l /= 100; const q = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - q * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)].map(v => Math.round(v * 255)); };
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const rgbHue = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); if (!d) return 0; const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60; };
const mixRgb = (c, k, to = 255) => c.map(v => Math.round(v + (to - v) * k));
function palette(h, s, acc, pink, third, lift = 1) {  // -> the interface colours (arrays), like the base theme's variables; lift: the backgrounds further from black
  const L = l => l * (1 + (lift - 1) * .45), bg = hsl2rgb(h, s, 4.5 * lift), btn = hsl2rgb(h, s * .85, L(13)), mg = hex2rgb(acc), pk = hex2rgb(pink), mu = hsl2rgb(h, s * .5, 62);
  return {'--bg0': bg, '--win': hsl2rgb(h, s, L(8.5)), '--field': hsl2rgb(h, s, 3 * lift), '--btn': btn, '--line': hsl2rgb(h, s * .8, L(19)), '--line2': hsl2rgb(h, s * .7, L(29)), '--navy': hsl2rgb(h, s, L(12)),
    '--shell': hsl2rgb(h, Math.min(60, s + 15), 95), '--lilac': hsl2rgb(h, Math.min(60, s), 82), '--muted': mu, '--magenta': mg, '--pink': pk, '--violet': hex2rgb(third),
    '--ink': mixRgb(bg, .4, 0), '--out': mixRgb(bg, .7, 0), '--btnh': mixRgb(btn, .12), '--mgl': mixRgb(mg, .35), '--mgh': mixRgb(mg, .12), '--mgr': mg, '--pkr': pk, '--ph': mixRgb(mu, .3, 0),
    '--d5': mixRgb(bg, .55, 0), '--d8': mixRgb(bg, .25, 0), '--d12': mixRgb(bg, .06), '--d19': mixRgb(bg, .14)};
}
const tinted = hex => { const c = hex2rgb(hex), mx = Math.max(...c); return mx > 0 && (mx - Math.min(...c)) / mx > .2; };  // a white or chalk accent has no real hue: the decor takes the background's
const THEMES = {nebula: ['Classique', 0, 1, 0, 0, null, 'Le style d’origine : pixels, lueurs magenta et lignes de balayage.']};
for (const [k, name, about, h, s, a, p, v, lift] of PAL) THEMES[k] = [name, Math.round((tinted(a) ? rgbHue(hex2rgb(a)) : h) - 300), s ? 1 : .12, 0, 0, palette(h, s, a, p, v, lift), about];  // [name, hue turn for the decor, saturation (a grey theme also greys the decor), -, -, colours]
const THEME_VARS = ['--bg0', '--ink', '--out', '--navy', '--line', '--line2', '--violet', '--magenta', '--pink', '--lilac', '--muted', '--shell',
  '--win', '--field', '--ph', '--btn', '--btnh', '--mgl', '--mgh', '--mgr', '--pkr', '--d5', '--d8', '--d12', '--d19'];
const BASE_COLORS = Object.fromEntries(THEME_VARS.map(v => [v, getComputedStyle(document.documentElement).getPropertyValue(v).trim()]));
function shiftColor([r, g, b], deg, sat) {  // through HSL: hue + deg, saturation x sat
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, l0 = l, d = mx - mn;
  let h = 0, s = d ? d / (1 - Math.abs(2 * l0 - 1)) : 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = ((h * 60 + deg) % 360 + 360) % 360; s = Math.min(1, s * sat);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = l - c / 2;
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [R, G, B].map(v => Math.round((v + m) * 255));
}
console.assert(shiftColor([224, 30, 200], 0, 1).join() === '224,30,200' && shiftColor([255, 0, 0], 120, 1).join() === '0,255,0', 'shiftColor');
// "random" (the default): a colour theme drawn once per launch, never the same twice in a row; on the holiday dates, the holiday's theme
// (the holiday decor itself keeps its own colours: skyTint)
const EVENT_THEMES = {halloween: 'synthwave', noel: 'grimoire', newyear: 'nebula', paques: 'sakura'};
let launchTheme = '', rerollNow = false;
const themeOf = k => {
  if (k !== 'random' && (THEMES[k] || String(k).startsWith('plugin:'))) return k;  // a theme of NeoDex 3.1 (there were ~70 colours) : drawn like « random »
  if (!launchTheme) {
    let last = ''; try { last = localStorage.neoLastTheme || ''; } catch {}
    // « favs » : drawn among the starred themes (shortcut: a plugin's starred theme counts only once its plugin has given it to THEMES)
    const favs = k === 'favs' && typeof prefs !== 'undefined' ? (prefs?.themeFavs || []).filter(t => THEMES[t]) : [], all = favs.length ? favs : Object.keys(THEMES);
    const pool = all.length > 1 ? all.filter(t => t !== last) : all;
    launchTheme = (!rerollNow && !favs.length && EVENT_THEMES[eventScene(new Date())]) || pool[Math.random() * pool.length | 0];
    try { localStorage.neoLastTheme = launchTheme; } catch {}
  }
  return launchTheme;
};
// the theme recolours the decor too, except a holiday decor, drawn in its own colours
function skyTint() { for (const c of [$('skyFar'), $('sky')]) c.style.filter = EVENT_SCENES.includes(scene) || RAW_SCENES.includes(scene) || scene === 'image' ? '' : skyTint.f || ''; }
const TRIPLES = new Set(['--mgr', '--pkr', '--d5', '--d8', '--d12', '--d19']);
function themeVars(k) {  // every variable of a theme, as the strings put on the page
  const [, deg, sat, , , pal] = THEMES[k] || THEMES.nebula, out = {};
  for (const [v, c] of Object.entries(BASE_COLORS)) {
    const hex = c[0] === '#', rgb = pal ? pal[v] : hex ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : c.split(',').map(Number), o = pal || !deg && sat === 1 ? rgb : shiftColor(rgb, deg, sat);
    out[v] = TRIPLES.has(v) || !hex && !pal ? o.join(',') : 'rgb(' + o + ')';
  }
  return out;
}
const webPalette = () => { const s = getComputedStyle(document.documentElement), hx = v => '#' + (s.getPropertyValue(v).match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join(''); return {webBg: hx('--win'), webFg: hx('--lilac'), webAcc: hx('--pink')}; };
function applyTheme(k, preview) {  // preview: a theme hovered in Paramètres, nothing saved
  k = themeOf(k);
  const [, deg, sat] = THEMES[k] || THEMES.nebula, root = document.documentElement.style;
  for (const [v, c] of Object.entries(themeVars(k))) root.setProperty(v, c);
  document.documentElement.dataset.style = THEMES[k] ? THEMES[k][7] || k : 'nebula';  // a plugin's theme: its colours, in the style it names (or the base one)
  if (typeof pluginThemeCss === 'function') pluginThemeCss(THEMES[k] ? k : '');  // and its own decor, if it brings one
  if (prefs.webColors === 'theme' && !preview) { const p = webPalette(); if (p.webBg !== prefs.webBg || p.webAcc !== prefs.webAcc) neo.setSettings(p).then(s => { prefs = s; }); }
  skyTint.f = deg || sat !== 1 ? `hue-rotate(${deg}deg) saturate(${sat})` : ''; skyTint();
}

// the games draw with NeoDex's base palette: their pictures get the hue / saturation shift that turns the base accent into the theme's
// (preset themes are exactly such a shift; for a custom theme it follows its accent colour). NeoMusic keeps its own themes.
const rgbOf = c => c[0] === '#' ? [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) : (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
const hslOf = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  const h = !d ? 0 : mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
};
function tintGames() {
  const [h0, s0] = hslOf(rgbOf(BASE_COLORS['--magenta'])), [h1, s1] = hslOf(rgbOf(getComputedStyle(document.documentElement).getPropertyValue('--magenta').trim()));
  const dh = Math.round(((h1 - h0) % 360 + 540) % 360 - 180), sat = +(s0 ? s1 / s0 : 1).toFixed(2), f = !dh && Math.abs(sat - 1) < .03 ? 'none' : `hue-rotate(${dh}deg) saturate(${sat})`;
  if (document.documentElement.style.getPropertyValue('--appf') !== f) document.documentElement.style.setProperty('--appf', f);
}
console.assert(Math.round(hslOf([255, 0, 0])[0]) === 0 && Math.round(hslOf([0, 0, 255])[0]) === 240, 'hslOf');
addEventListener('DOMContentLoaded', () => { const st = document.createElement('style');  // every game's view (APPS is complete once all the scripts ran), even the views built later
  st.textContent = Object.values(APPS).filter(a => a.cat === 'Jeux').map(a => `#${a.view} canvas, #${a.view} img`).join(', ') + ', #taquinApp:not(.perso) .tqTile, #taquinApp:not(.perso) #tqPreview{filter:var(--appf, none)}';
  document.head.append(st);
  new MutationObserver(() => tintGames()).observe(document.documentElement, {attributes: true, attributeFilter: ['style', 'class']}); tintGames(); });

