/* ---------- 13 more decors (Fuji, Synthwave, Cristaux, Récif, Banquise, Château, Mars, Marais, Nuit étoilée, Galion, Fête foraine, Trou noir, Bambouseraie)
   and two redrawn ones (Cascade = jungle, Toits la nuit = rooftops). Uses the toolkit of scenes4.js. ---------- */
const flock5 = (n, y0, y1, c, vmin = .3, vmax = .6) => { const bs = Array.from({length: n}, () => ({x: R(0, GW), y: R(y0, y1), v: R(vmin, vmax), p: R(0, 6)})); return t => { for (const b of bs) { b.x += b.v; if (b.x > GW + 10) b.x = -20; const up = Math.sin(t / 220 + b.p) > 0 ? 1 : 0; for (const [i, j] of [[0, 0], [-1, -up], [1, -up], [-2, -2 * up + 1], [2, -2 * up + 1]]) fill(b.x + i, b.y + j, c); } }; };

/* Mont Fuji: a snow cone over a mirror lake, sakura branches in front, a dawn sky */
function fuji(fImg, nImg) {
  const hz = Math.round(GH * R(.6, .66)), cx = R(.35, .65) * GW;
  sky4(fImg, hz, ramp('#2e3a7a', '#4a5a9a', '#7a78b0', '#b890b4', '#e8a8a8', '#ffc4a0', '#ffe0b0'), 0, 1);
  stars4(fImg, hz * .4, GW * GH / (500 * K * K));
  sun4(fImg, cx + R(-60, 60) * K, hz * .5, 12 * K, ramp('#ff8a6a', '#ffa882', '#ffc8a0', '#ffe4c4'), 22 * K, true);
  clouds4(fImg, hz * .1, hz * .75, ramp('#a890b4', '#d0a8b4', '#f0c4b4', '#fff0e0'), .6, 10 * K, R(0, 99), .95, .3, 5);
  land4(fImg, hz, 24 * K, 100 * K, ramp('#4a4a84', '#5e5a94', '#7a70a4'), .1, .7, {depth: 30 * K});
  const H = hz * .62, bw = 150 * K;   // the mountain: a concave cone, snow cap with a ragged edge
  for (let x = 0; x < GW; x++) {
    const d = Math.abs(x - cx) / bw; if (d > 1) continue;
    const top = Math.round(hz - H * (1 - d ** .75) * (1 - .0)), snowLine = hz - H * .72 + Math.sin(x * .35) * 3 * K + fbm(x / (6 * K), 5, 3) * 10 * K;
    for (let y = top; y < hz; y++) { const lit = (x < cx ? 1 : .62) * (1 - (y - top) / (H * 1.1)) , snow = y < snowLine + (x < cx ? 0 : 3 * K);
      put(fImg, x, y, snow ? dith(ramp('#9aa0cc', '#c4c8ea', '#eef0ff', '#ffffff'), lit * .9 + (x < cx ? .1 : -.1), x, y) : dith(ramp('#2a2e66', '#3a4084', '#505a9c', '#6c78b4'), lit * .9 + (fbm(x / (4 * K), y / (4 * K), 2) - .5) * .4, x, y)); }
  }
  land4(fImg, hz + 2 * K, 5 * K, 40 * K, ramp('#0e1a2a', '#16283a', '#223c4a'), .2, .8, {depth: 8 * K, oct: 3});
  for (let y = hz; y < GH; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, dith(ramp('#1a2a5a', '#2e3e7a', '#4a5a98', '#7a82b4'), .2 + (1 - (y - hz) / (GH - hz)) * .3, x, y));
  reflect4(fImg, hz, .8, [14, 18, 44]);
  const sak = ramp('#7a2a4a', '#c04a78', '#f07aa4', '#ffb0c8', '#ffe0ec');
  for (const sx of [0, GW]) { const dir = sx ? -1 : 1; for (let b = 0; b < 5; b++) { let x = sx, y = R(.02, .3) * GH; const a = R(.1, .5); for (let i = 0; i < GW * .5; i++) { x += dir * 1; y += Math.sin(i / 12 + b) * .5 + a * .3; put(nImg, x, y, [58, 34, 38]); put(nImg, x, y + 1, [38, 22, 26]); if (i % 5 === 0) blob(nImg, x, y - 2 * K, 6 * K, 3.5 * K, sak, .25, .95, R(0, 99), .5); } } }
  const petals = drift4(60, {colors: ['#ffc4d8', '#ffffff', '#ffa0c0'], vy: .4, vx: -.3, sway: .6, size: 2}), br = flock5(5, hz * .1, hz * .5, '#2a2a5a');
  twinkles = makeTwinkles(GW * hz / (3000 * K * K), hz * .4);
  return {flares: false, shooters: true, draw: t => { petals(t); br(t); }};
}

/* Synthwave: a banded sun over a soft neon grid, dark mountains with a glowing edge; calm (only the stars breathe) */
function synthwave(fImg, nImg) {
  const hz = Math.round(GH * R(.52, .58)), cx = R(.35, .65) * GW;
  sky4(fImg, hz, ramp('#0c0626', '#1a0c42', '#2e1260', '#4a1a78', '#6e2486', '#9a3092', '#c8449a', '#f0709a'), 0, 1);
  stars4(fImg, hz * .6, GW * GH / (500 * K * K));
  const r = 30 * K, sy = hz - r - 2 * K;   // the sun, cut by dark bands that widen downwards
  for (let k = 1; k < 26; k++) for (let a = 0; a < 6.28; a += .02) if (BAYER[(k & 3) * 4 + ((k * 3) & 3)] < .22 * (1 - k / 26) ** 1.5) put(fImg, cx + Math.cos(a) * (r + k * 1.5), sy + Math.sin(a) * (r + k * 1.5), [200, 70, 150]);
  for (let y = -r; y < r; y++) for (let x = -r; x < r; x++) if (x * x + y * y < r * r) { const t = (y + r) / (2 * r), band = t > .5 && ((y + r) % (9 * K)) < (t - .45) * 12 * K; if (!band) put(fImg, cx + x, sy + y, dith(ramp('#e8508a', '#f06a80', '#f88a6a', '#ffb060', '#ffd878'), 1 - t, cx + x, y)); }
  const mt = land4(fImg, hz, 22 * K, 80 * K, ramp('#0c0626', '#160a36', '#20104a'), .2, .9, {depth: 30 * K, sharp: true});
  for (let x = 0; x < GW; x++) put(fImg, x, mt[x], [150, 70, 190]);
  for (let y = hz; y < GH; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, dith(ramp('#080318', '#0e0626', '#160a34'), .4, x, y));
  for (let i = 1; i < 14; i++) { const q = i / 14, y = Math.round(hz + (GH - hz) * q ** 2); for (let x = 0; x < GW; x++) put(fImg, x, y, [190, 70, 200].map(v => v * (.18 + q * .32) | 0)); }
  for (let i = -20; i <= 20; i++) for (let y = hz; y < GH; y++) { const q = (y - hz) / (GH - hz), x = cx + i * 34 * K * q; put(fImg, x, y, [190, 70, 200].map(v => v * (.12 + q * .3) | 0)); }
  twinkles = makeTwinkles(GW * hz / (1800 * K * K), hz * .6);
  return {flares: false, shooters: false, draw: () => {}};
}

/* Cristaux: a cave whose rock is lit by the clusters of glowing crystals growing out of it, far pillars in the dark, a still pool mirroring the ceiling, drifting motes */
function cristaux(fImg, nImg) {
  const COLS = [ramp('#240a52', '#4a1c9a', '#7a3ae0', '#b078ff', '#e4c8ff'), ramp('#06324a', '#0a6a8a', '#14b4c8', '#5ae0e8', '#c8fbff'), ramp('#4a0a3a', '#9a1a6a', '#e0348e', '#ff7ac0', '#ffd0ea')];
  const ROCK = ramp('#05040c', '#0a0816', '#120e24', '#1c1632', '#2a2244', '#3a3058');
  const cl = [], fl = [], poolY = Math.round(GH * R(.78, .82)), px = R(.3, .7) * GW, pw = R(.18, .26) * GW;
  for (let x = 0; x < GW; x++) { cl[x] = Math.round(8 * K + fbm(x / (45 * K), 3, 4) * 36 * K); fl[x] = Math.round(GH - 12 * K - fbm(x / (55 * K), 9, 4) * 34 * K); }
  const spike = (arr, dir, n) => { for (let i = 0; i < n; i++) { const cx = R(0, GW) | 0, w = R(4, 12) * K, h = R(10, 34) * K; for (let d = -w; d <= w; d++) { const x = cx + d | 0; if (x < 0 || x >= GW) continue; const v = Math.round((dir > 0 ? cl[x] : fl[x]) + dir * h * (1 - Math.abs(d) / w)); arr[x] = dir > 0 ? Math.max(arr[x], v) : Math.min(arr[x], v); } } };
  spike(cl, 1, 20); spike(fl, -1, 16);
  for (let x = 0; x < GW; x++) { const e = 1 - ((x - px) / pw) ** 2; if (e > 0) fl[x] = Math.max(fl[x], Math.round(Math.min(GH, poolY + 4 * K + e ** .5 * (GH - poolY)))); }  // a hollow in the floor for the pool
  const clusters = [];
  for (let i = 0; i < 26; i++) { const up = i < 12; let x = R(.02, .98) * GW | 0; if (!up && Math.abs(x - px) < pw * .9) x = (x + GW / 2 | 0) % GW; clusters.push({x, up, rp: COLS[rnd() * 3 | 0], n: 3 + (rnd() * 4 | 0), y: up ? cl[x] : fl[x]}); }
  // light from the crystals at any point: a sum of soft pools of their colour
  const light = (x, y) => { let r = 0, g = 0, b = 0, s = 0; for (const c of clusters) { const d2 = ((x - c.x) ** 2 + ((y - c.y - (c.up ? 14 : -14) * K) * 1.3) ** 2) / (34 * K) ** 2; if (d2 < 4) { const w = Math.exp(-d2 * 1.6); r += c.rp[2][0] * w; g += c.rp[2][1] * w; b += c.rp[2][2] * w; s += w; } } return [r, g, b, Math.min(1, s)]; };
  const lit = (base, L, amt) => base.map((v, i) => Math.min(255, v + L[i] * amt * .55 | 0));
  // the back of the cave, then far pillars and stalactites in the dark blue, faintly lit
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const L = light(x, y); put(fImg, x, y, lit(dith(ramp('#03020a', '#070516', '#0d0a24', '#140e34'), .35 + .45 * fbm(x / (50 * K), y / (35 * K), 3), x, y), L, L[3] * .25)); }
  for (let i = 0; i < 5; i++) { const x0 = R(0, GW), w = R(6, 14) * K, sd = R(0, 99); for (let y = 0; y < GH; y++) { const q = y / GH, hw = w * (.6 + .8 * Math.abs(q - .5) * 2) * (.8 + .4 * fbm(y / (8 * K) + sd, sd, 2)); for (let k = -hw; k <= hw; k++) { const X = x0 + k + Math.sin(y / (20 * K) + sd) * 3 * K; if (X < 0 || X >= GW) continue; const L = light(X, y); put(fImg, X, y, lit(dith(ROCK, .45 + (k / hw) * .2 + (fbm(X / (4 * K), y / (6 * K), 2) - .5) * .4, X | 0, y), L, L[3] * .45)); } } }
  // soft glows around the clusters
  for (const c of clusters) { const cy = c.y + (c.up ? 16 : -16) * K, R0 = 30 * K; for (let y = -R0; y < R0; y++) for (let x = -R0; x < R0; x++) { const d = Math.hypot(x, y * 1.2) / R0; if (d < 1 && bay(c.x + x & 0xffff, cy + y & 0xffff) < .3 * (1 - d) ** 2) put(c.up ? fImg : nImg, c.x + x, cy + y, c.rp[1]); } }
  const crystal = (img, x, y, h, w, rp, dir, ang) => {   // a hexagonal prism growing from (x, y) outwards at an angle, pointed tip, lit left face, bright edge
    for (let j = 0; j < h; j++) { const q = j / h, ww = w * (q < .78 ? 1 : (1 - (q - .78) / .22)), cx = x + Math.sin(ang) * j, cy = y + dir * Math.cos(ang) * j;
      for (let i = -ww / 2; i <= ww / 2; i += .5) { const f = i < -ww * .15 ? 3 : i < ww * .3 ? 2 : 1; put(img, cx + i, cy, rp[Math.min(4, f + (Math.abs(i + ww * .12) < .8 ? 1 : 0) + (q > .85 ? 1 : 0))]); } }
  };
  // crystals start inside the rock, so the rock drawn over them hides their roots
  const draw = (img, list) => { for (const c of list) for (let k = 0; k < c.n; k++) crystal(img, c.x + R(-8, 8) * K, c.y - (c.up ? 8 : -8) * K, R(22, 58) * K * (k ? .7 : 1), R(4, 9) * K, c.rp, c.up ? 1 : -1, R(-.55, .55)); };
  const rock = (img, y0, y1, arr) => { for (let x = 0; x < GW; x++) for (let y = y0(x); y < y1(x); y++) { const d = Math.abs(y - arr[x]), L = light(x, y); put(img, x, y, lit(dith(ROCK, .15 + (fbm(x / (5 * K), y / (5 * K), 3) - .5) * .7 + (d < K ? .45 : d < 3 * K ? .2 : 0), x, y), L, L[3] * (d < 4 * K ? .9 : .5))); } };
  draw(fImg, clusters.filter(c => c.up));
  rock(fImg, () => 0, x => cl[x], cl);
  // the pool: the ceiling and its crystals mirrored, dimmed, with a few ripple lines
  { const d = fImg.data; for (let y = poolY; y < GH; y++) for (let x = Math.max(0, px - pw | 0); x < Math.min(GW, px + pw); x++) { const sy = 2 * poolY - y - 1, L = light(x, poolY - (y - poolY) * 3); if (sy < 0) continue; const k = (sy * GW + x + Math.round(Math.sin(y * .9) * (y - poolY) / (8 * K))) * 4; put(fImg, x, y, (y - poolY) % (4 * K) === 0 && bay(x, y) < .5 ? [90, 80, 140] : lit([d[k] * .5 + 4 | 0, d[k + 1] * .5 + 6 | 0, d[k + 2] * .55 + 16 | 0], L, L[3] * (((y + (x >> 3)) % (3 * K)) < K ? 1.4 : .7))); } }
  draw(nImg, clusters.filter(c => !c.up));
  rock(nImg, x => fl[x], () => GH, fl);
  const motes = drift4(70, {colors: ['#e4c8ff', '#8af0ff', '#ff9ad6'], vy: -.12, sway: .3, alpha: .7});
  const drips = Array.from({length: 4}, () => ({x: R(px - pw * .8, px + pw * .8), t: R(0, 5000)}));
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    motes(t);
    for (const c of clusters) { const a = (Math.sin(t / 1100 + c.x) + 1) / 5; fxc.globalAlpha = a * .5; fxc.fillStyle = 'rgb(' + c.rp[3] + ')'; fxc.fillRect(c.x - 2, c.y + (c.up ? 10 * K : -10 * K), 4, 4); }
    for (const d of drips) { const p = ((t + d.t) % 5000) / 5000; if (p > .97) d.x = R(px - pw * .8, px + pw * .8); const rr = p * 12 * K; for (let k = -rr; k <= rr; k += 2) fill(d.x + k, poolY + 4 * K + Math.sqrt(Math.max(0, rr * rr - k * k)) * .25, '#c8b8ff', (1 - p) * .5); }
  }};
}

/* Récif: coral gardens under a rippling surface, rays of light, a far reef in the blue haze, sand netted with caustics, staghorn, brain, table and fan corals, sponges and anemones, shoals of fish, a turtle */
function recif(fImg, nImg) {
  const WATER = ramp('#021a2e', '#04304a', '#06506a', '#0a7488', '#18a0a8', '#4ac8c0', '#9af0e0'), W = [10, 96, 120], sx = R(.25, .75) * GW;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const g = Math.exp(-(((x - sx) / (60 * K)) ** 2) - (y / (40 * K)) ** 2) * .3; put(fImg, x, y, dith(WATER, 1 - y / GH + g + (fbm(x / (60 * K), y / (30 * K), 2) - .5) * .25, x, y)); }
  for (let y = 0; y < 10 * K; y++) for (let x = 0; x < GW; x++) { const n = Math.sin(x / (5 * K) + fbm(x / (12 * K), y / (2 * K), 2) * 6) + Math.sin(y / K * 1.3); if (n > 1.3 - y / (10 * K) * .6) put(fImg, x, y, n > 1.7 ? [220, 255, 250] : [150, 230, 220]); }  // the underside of the surface
  for (let i = 0; i < 6; i++) { const x0 = sx + R(-.4, .4) * GW, w = R(6, 16) * K, sl = R(.15, .35); for (let y = 0; y < GH * .85; y++) for (let k = -w; k < w; k++) { const X = x0 + k + y * sl, a = (1 - y / (GH * .85)) * (1 - Math.abs(k) / w) * .16; if (bay(X & 0xffff, y) < a) put(fImg, X, y, [170, 240, 230]); } }  // rays of light
  const tint = (c, a) => c.map((v, i) => v + (W[i] - v) * a | 0);
  // a far reef, hazy, with the shapes of corals on it
  const far = land4(fImg, GH * .7, 16 * K, 50 * K, ramp('#0a5a70', '#0e6478', '#127080'), .2, .8, {depth: 30 * K});
  for (let i = 0; i < 26; i++) { const x = R(0, GW) | 0; blob(fImg, x, far[x] - R(0, 4) * K, R(4, 12) * K, R(3, 8) * K, ramp('#0c6276', '#14707e', '#1e7e88'), .2, .9, R(0, 99), .6); }
  // the sand, netted with light
  const sand = land4(fImg, GH * .82, 10 * K, 70 * K, ramp('#0e4a58', '#18606a', '#2a7a7a', '#4a9a8a', '#7abaa0'), .2, .7, {depth: 40 * K});
  for (let x = 0; x < GW; x++) for (let y = sand[x]; y < GH; y++) { const n = Math.abs(Math.sin(fbm(x / (6 * K), y / (3 * K), 3) * 14)); if (n < .12 && bay(x, y) < .7) put(fImg, x, y, [150, 220, 200]); }
  const CORAL = [ramp('#6a1a3a', '#b0306a', '#ff5a9a', '#ffa0c0', '#ffe0ec'), ramp('#7a3a0a', '#d06a14', '#ff9a2a', '#ffd070', '#fff0c0'), ramp('#2a1a6a', '#5a3ab0', '#9a7aff', '#d0c0ff', '#f0ecff'), ramp('#0a5a3a', '#14a068', '#3ae0a0', '#a0ffd0', '#e8fff4'), ramp('#6a5a1a', '#a89030', '#e0c450', '#fff090', '#fffad0')];
  const coral = (img, x, base, h, rp, kind, haze) => {
    const P = (X, Y, c) => put(img, X, Y, tint(c, haze));
    if (kind === 0) {  // staghorn: forking branches, tips pale
      const br = (X, Y, a, len, w, d) => { for (let i = 0; i < len; i++) { const q = i / len; X += Math.sin(a) * 1; Y -= Math.cos(a) * 1; for (let k = -w / 2; k <= w / 2; k++) P(X + k, Y, rp[Math.min(4, (k < 0 ? 1 : 2) + (d === 0 && q > .8 ? 2 : 0))]); } if (d > 0) { br(X, Y, a - R(.3, .6), len * .7, w * .8, d - 1); br(X, Y, a + R(.3, .6), len * .7, w * .8, d - 1); } };
      for (let b = 0; b < 3; b++) br(x + R(-3, 3) * K, base, R(-.5, .5), h * .4, 2 * K, 2);
    } else if (kind === 1) {  // brain coral: a dome with meandering grooves
      const r = h * .55, sd = R(0, 99); for (let j = 0; j < r; j++) for (let i = -r; i <= r; i++) { const e = (i / r) ** 2 + (j / (r * .8)) ** 2; if (e > 1) continue; const g = Math.sin((i + fbm(i / (4 * K) + sd, j / (4 * K), 2) * 8 * K) / (1.4 * K)) > .55; P(x + i, base - j, rp[g ? 0 : Math.min(4, 1 + Math.round((1 - e) * 1.5 + (i < 0 ? .5 : 0)))]); }
    } else if (kind === 2) {  // sea fan: a lattice spread on a fan of ribs
      for (let a = -1.3; a <= 1.3; a += .16) for (let j = 0; j < h; j++) P(x + Math.sin(a) * j * .75, base - Math.cos(a) * j * .9, rp[1 + (j / h * 3 | 0)]);
      for (let j = h * .3; j < h; j += 3 * K) for (let a = -1.3; a <= 1.3; a += .03) P(x + Math.sin(a) * j * .75, base - Math.cos(a) * j * .9, rp[2]);
    } else if (kind === 3) {  // table coral: a short stalk under a wide flat plate
      for (let j = 0; j < h * .3; j++) for (let k = -K; k <= K; k++) P(x + k, base - j, rp[1]);
      for (let l = 0; l < 2; l++) { const pw = h * (.5 - l * .16), py = base - h * (.3 + l * .12), sd = R(0, 99);
        for (let i = -pw; i <= pw; i++) { const th = (2 + 2.5 * Math.sqrt(1 - (i / pw) ** 2)) * K * (.7 + .6 * fbm(i / (2 * K) + sd, sd, 2)); for (let j = 0; j < th; j++) P(x + i, py - j + (Math.abs(i) / pw) ** 2 * 2 * K, rp[j < K ? 0 : j > th - K ? 4 : (i < 0 ? 3 : 2)]); } }
    } else if (kind === 4) {  // tube sponges
      for (let s = 0; s < 4; s++) { const tx = x + (s - 1.5) * 4 * K + R(-1, 1) * K, th = h * R(.4, .8), tw = R(1.5, 2.2) * K, bend = R(-.2, .2); for (let j = 0; j < th; j++) { const w = tw * (.8 + j / th * .4), cx = tx + bend * j * j / th; for (let k = -w; k <= w; k++) P(cx + k, base - j, j > th - 1.5 * K && Math.abs(k) < w - K ? rp[0] : rp[k < -w * .3 ? 3 : k > w * .5 ? 1 : 2]); } }
    } else {  // anemone: a fleshy base, a crown of swaying tentacles
      for (let j = 0; j < 3 * K; j++) for (let k = -4 * K; k <= 4 * K; k++) P(x + k, base - j, rp[1]);
      for (let a = -1.4; a <= 1.4; a += .14) { let X = x + Math.sin(a) * 3 * K, Y = base - 3 * K; for (let j = 0; j < h * .4; j++) { X += Math.sin(a) * .5 + Math.sin(j / 3 + a * 5) * .3; Y -= .8; P(X, Y, rp[j > h * .32 ? 4 : 3]); } }
    }
  };
  for (let i = 0; i < 18; i++) { const x = R(0, GW) | 0; if (rnd() < .5) blob(fImg, x, sand[x] + 2 * K, R(8, 16) * K, R(4, 8) * K, ramp('#123a44', '#1c4c54', '#2a5e64'), .2, .9, R(0, 99), .5); coral(fImg, x + R(-4, 4) * K, sand[x] + 4 * K, R(16, 34) * K, CORAL[rnd() * 5 | 0], rnd() * 6 | 0, .35); }
  const top = land4(nImg, GH * .92, 8 * K, 40 * K, ramp('#0a1c20', '#142e30', '#244844', '#3a6a5a'), .1, .8, {depth: 20 * K, tex: 3, rim: true});
  for (let i = 0; i < 6; i++) { const x = R(0, GW) | 0; blob(nImg, x, top[x] + 2 * K, R(14, 24) * K, R(6, 12) * K, ramp('#0e2428', '#183438', '#26484a', '#3a6460'), .15, .85, R(0, 99), .5); }
  for (let i = 0; i < 14; i++) { const x = R(0, GW) | 0; coral(nImg, x, top[x] + 4 * K, R(22, 52) * K, CORAL[rnd() * 5 | 0], rnd() * 6 | 0, 0); }
  for (let i = 0; i < 16; i++) { const x = R(0, GW) | 0, h = R(24, 50) * K; for (let j = 0; j < h; j++) { put(nImg, x + Math.sin(j / 9 + x) * 3 * K, top[x] - j, [20, 150 - j / h * 40 | 0, 90]); put(nImg, x + 1 + Math.sin(j / 9 + x) * 3 * K, top[x] - j, [14, 110, 70]); } }   // sea grass
  const FISH = [['#ffb02a', '#ff6a1a', '#fff0c0'], ['#4ac8ff', '#1a6aff', '#e0f8ff'], ['#ff5a9a', '#c01a6a', '#ffe0ec'], ['#a8ff6a', '#2ab04a', '#f0ffe0'], ['#ffe040', '#2a2a6a', '#fffad0']];
  const shoals = Array.from({length: 5}, (_, s) => ({n: 5 + s * 2, x: R(0, GW), y: R(.15, .65) * GH, v: R(.2, .5) * (rnd() < .5 ? 1 : -1), p: R(0, 6), c: FISH[s], sz: s < 2 ? 2 : 1}));
  const bubbles = drift4(40, {colors: ['#c8f4f0', '#ffffff'], vy: -.35, sway: .4, alpha: .6});
  const turtle = {x: R(0, GW), y: GH * R(.3, .45), v: .15};
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    bubbles(t);
    for (let i = 0; i < 3; i++) { const x0 = sx + Math.sin(t / 4000 + i * 2) * 60 * K + (i - 1) * 50 * K; fxc.fillStyle = '#e8ffff'; for (let y = 0; y < GH * .75; y += 2) { fxc.globalAlpha = .035 * (1 - y / (GH * .75)); fxc.fillRect(x0 + y * .25 - 6 * K, y, 12 * K + y * .06, 2); } }
    for (const s of shoals) { s.x += s.v; if (s.x > GW + 60) s.x = -60; if (s.x < -60) s.x = GW + 60; const d = s.v > 0 ? 1 : -1, z = s.sz;
      for (let i = 0; i < s.n; i++) { const fx = s.x - d * (i % 4) * 9 * z + Math.sin(i * 7) * 14, fy = s.y + Math.sin(t / 700 + i + s.p) * 5 + (i * 5 % 14) * z;
        for (let k = -2 * z; k <= 3 * z; k++) for (let j = -z; j <= z; j++) if (Math.abs(j) <= z * (1 - Math.abs(k - z * .5) / (3.5 * z)) + .3) fill(fx + d * k, fy + j, j < 0 ? s.c[0] : j > 0 ? s.c[1] : (k === z && z > 1 ? s.c[2] : s.c[0]));
        fill(fx - d * (3 * z), fy - z, s.c[1]); fill(fx - d * (3 * z), fy + z, s.c[1]); fill(fx - d * (2.5 * z), fy, s.c[1]); fill(fx + d * 2 * z, fy - (z > 1 ? 1 : 0), '#0a1a2a'); } }
    turtle.x += turtle.v; if (turtle.x > GW + 40) turtle.x = -40; const f = Math.sin(t / 600) * 3, tx = turtle.x, ty = turtle.y;
    for (const [i, j, s] of [[-4, -6, 1], [-4, 6, -1], [7, -5, 1], [7, 5, -1]]) for (let k = 0; k < 7; k++) fill(tx + i + k * (i > 0 ? .6 : -.4), ty + j + s * (k * .4) * (i > 0 ? 1 : .5) - s * f * k / 7, '#7aa04a');
    for (let i = -10; i <= 10; i++) for (let j = -6; j <= 6; j++) { const e = i * i / 100 + j * j / 36; if (e <= 1) fill(tx + i, ty + j, e > .75 ? '#3a5a1a' : ((i + 20) % 5 === 0 || (j + 20) % 4 === 0) ? '#4a6a22' : j < -2 ? '#8ab04a' : '#6a902e'); }
    for (const [i, j] of [[11, -1], [12, -1], [13, -1], [11, 0], [12, 0], [13, 0], [14, 0], [12, 1], [13, 1]]) fill(tx + i, ty + j, '#9ab85a'); fill(tx + 13, ty - 1, '#10200a');
  }};
}

/* Banquise: an ice floe under hanging curtains of aurora, snowy peaks, icebergs lit from above with their blue roots showing under the water, the aurora mirrored in the sea, a colony of emperor penguins with chicks, falling snow */
function banquise(fImg, nImg) {
  const hz = Math.round(GH * R(.56, .6));
  sky4(fImg, hz, ramp('#01040e', '#020818', '#04102a', '#08203e', '#0e3050', '#1a4862', '#2e6a7a'), 0, 1);
  stars4(fImg, hz * .9, GW * GH / (260 * K * K));
  // the aurora: curtains with a bright wavy hem, rays rising from it and fading, green turning blue then violet at the top
  const AUR = [[40, 255, 150], [90, 255, 190], [110, 200, 255], [190, 120, 255]], curt = [];
  for (let b = 0; b < 3; b++) { const o = R(0, 99), y0 = hz * R(.32, .55), amp = R(10, 22) * K, len = R(40, 80) * K * (1 - b * .2), x0 = R(-.2, .3) * GW, x1 = R(.7, 1.2) * GW;
    for (let x = Math.max(0, x0 | 0); x < Math.min(GW, x1); x++) {
      const e = Math.min(1, (x - x0) / (60 * K), (x1 - x) / (60 * K)), hem = y0 + Math.sin(x / (70 * K) + o) * amp + Math.sin(x / (23 * K) + o * 2) * amp * .3, ray = .3 + .7 * fbm(x / (2.5 * K) + o, o, 2) ** 1.5, L = len * (.6 + .6 * fbm(x / (20 * K), o + 5, 2));
      if (x % 4 === 0) curt.push([x, hem, L, b]);
      for (let k = -3 * K; k < L; k++) { const q = Math.max(0, k) / L, a = e * ray * (k < 0 ? (1 + k / (3 * K)) * .9 : (1 - q) ** 1.4 * (k < 2 * K ? 1.1 : .75)), y = Math.round(hem - k); if (y < 0 || a <= 0) continue;
        if (bay(x, y) < a * .85) put(fImg, x, y, AUR[Math.min(3, q * 3.2 + b * .4 | 0)].map(v => v * (.45 + a * .55) | 0)); }
    } }
  // snowy peaks far away, faintly green where the aurora lights them
  land4(fImg, hz, 26 * K, 100 * K, ramp('#0e2440', '#1c3a5a', '#3a6484', '#7aa8c0', '#c4e4ee'), .95, .1, {depth: 26 * K, sharp: true, rim: true});
  // icebergs: tabular or peaked, snow on top, faces in plates with fissures, lit from above
  const BERG = ramp('#16365a', '#285478', '#4a80a8', '#86bcd8', '#c8ecf8', '#f4fdff'), roots = [];
  for (let i = 0; i < 4; i++) {
    const x0 = R(.06, .94) * GW, w = R(24, 60) * K * (i ? 1 : 1.4), tab = rnd() < .45, h = w * (tab ? R(.35, .5) : R(.6, .9)), c = R(-.3, .3), sd = R(0, 99), top = [];
    for (let x = -w; x <= w; x++) { const u = x / w, n = fbm(u * 3 + sd, sd, 3) - .5;
      top.push(Math.max(0, h * (tab ? Math.min(1, (1 - Math.abs(u)) * 5) ** .5 * (.92 + n * .15) : Math.max(0, 1 - Math.abs(u - c) ** .9 * 1.1 + n * .35)))); }
    roots.push({x0, w, top});
    for (let i2 = 0; i2 < top.length; i2++) { const x = x0 - w + i2, t = top[i2]; if (t < K) continue; const slope = (top[i2 + 1] ?? t) - (top[i2 - 1] ?? t), plate = fbm(x / (6 * K) + sd, 1, 1);
      for (let y = Math.round(hz - t); y < hz; y++) { const d = y - (hz - t);
        let v = d < 1.5 * K ? .95 : .62 + (slope > 0 ? .15 : -.12) + (plate - .5) * .4 - d / h * .35 - (tab && Math.floor(d / (4 * K)) % 2 ? .06 : 0);
        if (fbm(x / (1.2 * K), y / (14 * K) + sd, 2) > .7) v -= .25;
        put(fImg, x, y, dith(BERG, v, x | 0, y)); } }
  }
  // the sea mirrors it all, then the bergs' roots glow turquoise under the water, a seam of light at the waterline, floating ice
  reflect4(fImg, hz, .5, [2, 10, 26]);
  for (const r of roots) for (let i = 0; i < r.top.length; i++) { const x = r.x0 - r.w + i, t = r.top[i] * .7 + 6 * K * Math.sqrt(Math.max(0, 1 - (i / r.top.length * 2 - 1) ** 2));
    for (let j = 0; j < t; j++) if (bay(x | 0, hz + j) < .3 * (1 - j / t)) put(fImg, x, hz + j, [60, 170, 190].map(v => v * (1 - j / t * .5) | 0));
    if (r.top[i] > K && bay(x | 0, hz) < .7) put(fImg, x, hz, [200, 240, 250]); }
  for (let i = 0; i < 9; i++) { const x = R(0, GW), y = hz + R(4, GH * .84 - hz - 4 * K), w = R(3, 9) * K * (1 + (y - hz) / (GH - hz));
    for (let k = -w; k <= w; k++) { const e = 1 - (k / w) ** 2; put(fImg, x + k, y - K, e > .3 ? [220, 244, 252] : [150, 200, 222]); put(fImg, x + k, y, [80, 140, 176]); if (bay(x + k | 0, y + K) < e * .5) put(fImg, x + k, y + 2 * K, [60, 110, 140]); } }
  // the near floe: snow with wind ridges, a crack or two, a faint green sheen from the sky
  const ice = land4(nImg, GH * .84, 6 * K, 70 * K, ramp('#2a5478', '#4a7ca4', '#86b8d4', '#c4e4f2', '#eef9ff'), .95, .55, {depth: 26 * K, tex: 5, rim: true});
  for (let i = 0; i < 40; i++) { const x0 = R(0, GW), y = R(ice[x0 | 0] + 3 * K, GH), L = R(8, 24) * K; for (let k = 0; k < L; k++) { const x = x0 + k, yy = y + Math.sin(k / (4 * K)) * K; if (bay(x | 0, yy | 0) < .7) { put(nImg, x, yy, [255, 255, 255]); put(nImg, x, yy + 1, [120, 168, 200]); } } }
  for (let c = 0; c < 2; c++) { let x = R(.1, .9) * GW, y = ice[x | 0] + 2 * K; while (y < GH) { put(nImg, x, y, [40, 80, 120]); put(nImg, x + 1, y, [200, 236, 250]); y += 1; x += R(-1.2, 1.2); } }
  for (let x = 0; x < GW; x++) for (let y = ice[x]; y < ice[x] + 14 * K; y++) if (bay(x, y) < .12 * (1 - (y - ice[x]) / (14 * K)) * fbm(x / (40 * K), 3, 2) * 2) put(nImg, x, y, [170, 240, 220]);
  // emperor penguins (one eye when seen in profile, none when facing us) and grey chicks, each with a soft shadow
  const peng = (x, base, s, d, chick) => {
    const H = (chick ? 10 : 18) * K * s, W = (chick ? 4.5 : 5.5) * K * s;
    for (let k = -W * 1.6; k <= W * 1.6; k++) for (let j = -K; j <= K; j++) if (bay(x + k | 0, base + j | 0) < .6 * (1 - (k / (W * 1.6)) ** 2)) put(nImg, x + k, base + j, [60, 104, 146]);
    for (let j = 0; j < H; j++) { const q = j / H, head = q > (chick ? .6 : .72), hw = head ? (chick ? W * .85 * Math.sqrt(Math.max(0, 1 - ((q - .8) / .2) ** 2)) : W * .62 * Math.sqrt(Math.max(0, 1 - ((q - .86) / .15) ** 2))) : W * Math.sqrt(Math.max(0, 1 - ((q - .36) / .4) ** 2)), off = head ? d * W * .2 : 0;
      for (let k = -hw; k <= hw; k++) { const u = k / Math.max(1, hw), f = u * d; let c;
        if (chick) c = head ? (q > .88 || (q > .8 && Math.abs(u) > .7) ? [26, 28, 36] : [236, 240, 246]) : (u > .35 ? [104, 110, 124] : [150, 156, 170]);
        else if (d) c = head ? (q < .84 && f > -.3 && f < .45 ? (q < .78 ? [255, 214, 100] : [255, 178, 60]) : [18, 20, 30])
          : f < -.2 ? (f < -.85 ? [52, 58, 80] : q > .3 && q < .62 && f > -.45 ? [34, 38, 56] : [20, 22, 34]) : q > .6 ? [255, 236, 176] : f > .8 ? [176, 192, 212] : [236, 240, 248];
        else c = Math.abs(u) > .62 || (head && !(q < .84 && Math.abs(u) > .35)) ? (head ? [18, 20, 30] : [22, 24, 36]) : head ? [255, 196, 80] : q > .6 ? [255, 236, 176] : u > .4 ? [184, 198, 216] : [236, 240, 248];
        put(nImg, x + k + off, base - j, c); } }
    if (!chick && d) { const hy = base - H * .85, hx = x + d * W * .2; for (let k = 0; k < W * .5; k++) { put(nImg, hx + d * (W * .55 + k), hy + k * .25, [34, 30, 40]); put(nImg, hx + d * (W * .55 + k), hy + k * .25 + 1, [240, 130, 70]); } put(nImg, hx + d * W * .25, base - H * .9, [210, 220, 236]); }
    if (!chick && !d) for (let j = 0; j < K * 1.5; j++) put(nImg, x, base - H * .8 + j, [240, 130, 70]);
  };
  const cx = R(.25, .75) * GW, colony = [];
  for (let i = 0; i < 18; i++) { const x = cx + (rnd() + rnd() - 1) * 130 * K, xi = Math.max(0, Math.min(GW - 1, x | 0)), y = ice[xi] + R(8 * K, GH - ice[xi] - 2 * K); colony.push({x, y, d: [-1, 1, 1, -1, 0][rnd() * 5 | 0], chick: i > 13}); }
  colony.sort((a, b) => a.y - b.y);
  for (const p of colony) { const xi = Math.max(0, Math.min(GW - 1, p.x | 0)); peng(p.x, p.y, .75 + (p.y - ice[xi]) / (GH - ice[xi]) * .55, p.chick ? 0 : p.d, p.chick); }
  const snow = drift4(110, {colors: ['#ffffff', '#c8e4f4', '#e8f4ff'], vy: .45, vx: -.2, sway: .4, size: 1}), shoot = flock5(0, 0, 1, '#fff');
  twinkles = makeTwinkles(GW * hz / (1800 * K * K), hz * .2);
  return {flares: false, shooters: true, draw: t => {
    // the curtains ripple: a slow wave of brightness travels along each hem
    for (const [x, hem, L, b] of curt) { const a = Math.max(0, Math.sin(t / 900 - x / (30 * K) + b * 2)) ** 3 * .14; if (a < .01) continue; fxc.globalAlpha = a; fxc.fillStyle = b === 2 ? '#a0ffd0' : '#7affb8'; fxc.fillRect(x, hem - L * .7, 2, L * .7); }
    snow(t); shoot(t);
  }};
}

/* Château: a medieval castle on a crag under a cratered full moon, round towers with red cone roofs and banners, a curtain wall with a lit gate, a dragon passing in front of the moon, fir forests, mist in the valley, torches */
function chateau(fImg, nImg) {
  const hz = Math.round(GH * .74);
  sky4(fImg, hz, ramp('#05030e', '#0a0620', '#140c36', '#201450', '#32206a', '#4a3080'), 0, 1);
  stars4(fImg, hz, GW * GH / (350 * K * K));
  const mx = R(.65, .85) * GW, my = hz * .28, mr = 24 * K;
  sun4(fImg, mx, my, mr, ramp('#a89ac0', '#c8bce0', '#e4daf4', '#f8f2ff'), 30 * K, false);
  for (let i = 0; i < 7; i++) { const a = R(0, 6.28), d = R(0, .7) * mr, cr = R(2, 6) * K, x0 = mx + Math.cos(a) * d, y0 = my + Math.sin(a) * d;  // maria and craters
    for (let y = -cr; y <= cr; y++) for (let x = -cr; x <= cr; x++) { const e = (x * x + y * y) / (cr * cr); if (e < 1 && Math.hypot(x0 + x - mx, y0 + y - my) < mr - K && bay(x0 + x | 0, y0 + y | 0) < (1 - e) * 1.4) put(fImg, x0 + x, y0 + y, e > .7 && x < 0 ? [250, 246, 255] : [184, 172, 210]); } }
  clouds4(fImg, hz * .3, hz * .9, ramp('#0a0620', '#1c1240', '#322460', '#5a4888'), .6, 10 * K, R(0, 99), .8, .1, 4);
  // far hills with a fringe of tiny firs, mist lying in the valley
  const far = land4(fImg, hz, 22 * K, 90 * K, ramp('#0c0a22', '#14102e', '#1e183c'), .2, .8, {depth: 40 * K, sharp: true});
  for (let x = 0; x < GW; x += R(1.5, 3) * K) { const h = R(4, 8) * K, b = far[x | 0] + 2 * K; for (let j = 0; j < h; j++) for (let k = -j * .3; k <= j * .3; k++) put(fImg, x + k, b - h + j, [10, 8, 26]); }
  mist4(fImg, hz + 2 * K, 10 * K, [120, 100, 170], .5);
  // the crag: cliffs lit on the moon's side, cracks, a few ledges
  const cx = R(.25, .45) * GW | 0, base = hz + 4 * K, ld = mx > cx ? 1 : -1, crag = [];
  const SW = ramp('#0a0818', '#16102a', '#241a3c', '#34284e', '#4a3c66', '#6a5a8a'), ROOF = ramp('#2a0a20', '#4a1430', '#6e2040', '#963050', '#c04a5e');
  for (let x = cx - 90 * K; x < cx + 90 * K; x++) { const d = Math.abs(x - cx) / (90 * K); crag[x] = Math.round(base - 44 * K * (1 - d ** 1.6) - fbm(x / (5 * K), 2, 3) * 8 * K); }
  for (let x = cx - 90 * K; x < cx + 90 * K; x++) { const sl = (crag[x + 4 * K] ?? crag[x]) - (crag[x - 4 * K] ?? crag[x]);
    for (let y = crag[x]; y < GH; y++) { const n = fbm(x / (3 * K), y / (5 * K), 3), d = y - crag[x];
      put(fImg, x, y, dith(SW, .12 + clamp(sl * -ld / (4 * K)) * .25 + (n - .5) * .5 + (d < K ? .35 : 0) + (fbm(x / (1.5 * K), y / (5 * K), 2) > .74 ? -.15 : 0) - d / (60 * K) * .2, x, y)); } }
  // round towers: stone courses shaded as a cylinder, a corbelled parapet, a tiled cone roof with a banner, glowing arched windows
  const wins = [], flags = [];
  const stone = (x, y, u, v0) => dith(SW, v0 + .38 * Math.max(0, u * ld) - .1 * Math.max(0, -u * ld) + ((y / (3 * K) | 0) % 1 === 0 && y % (3 * K) < 1 ? -.12 : 0) + (((x + ((y / (3 * K) | 0) % 2) * 2.5 * K) % (5 * K)) < 1 ? -.08 : 0), x | 0, y | 0);
  const tower = (x, w, h, roof) => {
    // the foot reaches the lowest rock under the tower and flares out (a battered base), so no tower floats over a slope
    let low = 0; for (let i = -w / 2 - 3 * K; i <= w / 2 + 3 * K; i++) low = Math.max(low, crag[Math.round(x + i)] ?? base);
    const y0 = (crag[Math.round(x)] ?? base) + 6 * K, top = y0 - h, foot = low + 3 * K;
    for (let y = top; y < foot; y++) { const fl = Math.max(0, (y - (foot - 12 * K)) / (12 * K)) * 3 * K; for (let i = -w / 2 - fl; i <= w / 2 + fl; i++) { const X = Math.round(x + i); if (y > (crag[X] ?? base) + 3 * K && y > top + h * .5) continue; put(fImg, X, y, stone(x + i, y, i / (w / 2 + fl), .32)); } }
    for (let y = top - 4 * K; y < top; y++) for (let i = -w / 2 - K; i <= w / 2 + K; i++) put(fImg, x + i, y, y - top + 4 * K < K ? SW[1] : stone(x + i, y, i / (w / 2 + K), .38));
    for (let i = -w / 2 - K; i <= w / 2 + K; i += 2 * K) if (((i / (2 * K)) | 0) % 2 === 0) put(fImg, x + i, top + K, SW[0]);   // corbels
    if (roof) { for (let j = 0; j < roof; j++) { const q = j / roof, ww = (w / 2 + 2.5 * K) * (1 - q); for (let i = -ww; i <= ww; i++) put(fImg, x + i, top - 4 * K - j, dith(ROOF, .3 + .5 * Math.max(0, i / Math.max(1, ww) * ld) + (j % (3 * K) < 1 ? -.15 : 0) + (q > .9 ? .2 : 0), x + i | 0, j)); }
      for (let j = 0; j < 6 * K; j++) put(fImg, x, top - 4 * K - roof - j, [30, 24, 40]); flags.push([x, top - 4 * K - roof - 6 * K]); }
    else for (let i = -w / 2 - K; i <= w / 2 + K; i++) if (((i + w) / (2 * K) | 0) % 2 === 0) for (let j = 0; j < 2 * K; j++) put(fImg, x + i, top - 4 * K - j, stone(x + i, top - 4 * K - j, i / (w / 2), .4));
    for (let k = 0; k < Math.max(1, (h - 14 * K) / (14 * K) | 0); k++) { const wy = top + (8 + k * 14) * K, wx = x + (k % 2 ? -1 : 1) * w * .12;
      for (let j = 0; j < 5 * K; j++) for (let i = -K; i <= K; i++) if (j > K || Math.abs(i) < K) put(fImg, wx + i, wy + j, j < 2 * K ? [255, 220, 130] : [240, 160, 70]);
      for (let j = -3 * K; j < 8 * K; j++) for (let i = -4 * K; i <= 4 * K; i++) { const e = 1 - Math.hypot(i / (4 * K), (j - 2.5 * K) / (5.5 * K)); if (e > 0 && (Math.abs(i) > K || j < 0 || j >= 5 * K) && bay(wx + i | 0, wy + j | 0) < e * .2) put(fImg, wx + i, wy + j, [120, 70, 70]); }
      wins.push([wx, wy]); }
  };
  // the curtain wall with merlons and the gatehouse, drawn first so the towers stand over it
  const wl = cx - 50 * K, wr = cx + 62 * K, wh = 22 * K;
  for (let x = wl; x < wr; x++) { const y0 = (crag[x] ?? base) + 6 * K, t = Math.min(y0 - wh, base - 40 * K);
    for (let y = t; y < y0; y++) put(fImg, x, y, stone(x, y, ld * .3, .26));
    if (((x - wl) / (3 * K) | 0) % 2 === 0) for (let j = 1; j <= 3 * K; j++) put(fImg, x, t - j, stone(x, t - j, ld * .3, .3));
    for (let j = 0; j < K; j++) put(fImg, x, t + j, SW[4]); }
  { const gx = cx - 29 * K, gy = (crag[gx] ?? base) + K, gw = 5 * K, gh = 12 * K;  // the gate: a pointed arch with a lit portcullis
    for (let j = 0; j < gh; j++) { const hw = j > gh - gw ? gw * Math.sqrt(Math.max(0, 1 - ((j - gh + gw) / gw) ** 2)) : gw; for (let i = -hw; i <= hw; i++) put(fImg, gx + i, gy - j, (Math.round(i) % (2 * K) === 0 || j % (3 * K) === 0) ? [60, 30, 30] : [255, 170, 80].map(v => v * (1 - j / gh * .4) | 0)); }
    for (let j = 0; j < 6 * K; j++) for (let i = -10 * K; i <= 10 * K; i++) { const e = 1 - Math.hypot(i / (10 * K), j / (6 * K)); if (e > 0 && bay(gx + i | 0, gy + j | 0) < e * .4) put(fImg, gx + i, gy + j, [140, 80, 60]); } }
  tower(cx - 50 * K, 20 * K, 52 * K, 22 * K); tower(cx + 30 * K, 20 * K, 60 * K, 22 * K); tower(cx + 62 * K, 14 * K, 40 * K, 0); tower(cx - 6 * K, 30 * K, 68 * K, 28 * K);
  // the near ground: dark firs in tiers with moonlit edges, torches on posts
  const ground = land4(nImg, GH * .9, 14 * K, 50 * K, ramp('#04030c', '#080618', '#100c26'), .1, .8, {depth: 20 * K, tex: 3});
  const fir = (x, b, h) => { const sd = R(0, 99); for (let j = 0; j < h; j++) { const q = j / h, tier = (q * 6 + fbm(sd, j / (6 * K), 1) * .3) % 1, w = h * .26 * (q * .85 + .15) * (.55 + .45 * tier); for (let k = -w; k <= w; k++) put(nImg, x + k, b - h + j, k * ld > w - 1.5 * K && tier > .3 ? [44, 48, 86] : k * ld > w * .4 ? [14, 20, 34] : [6, 10, 18]); }
    for (let j = 0; j < 4 * K; j++) for (let k = -K; k <= K; k++) put(nImg, x + k, b + j, [10, 8, 12]); };
  const firs = Array.from({length: 13}, () => { let x = R(0, GW) | 0; if (Math.abs(x - cx) < 80 * K) x = (x + GW / 2 | 0) % GW; return [x, ground[x] + R(4, 12) * K, R(28, 70) * K * (Math.abs(x - cx) < 100 * K ? .6 : 1)]; }).sort((a, b) => a[1] - b[1]);
  for (const [x, b, h] of firs) fir(x, b, h);
  const torches = [R(.05, .2) * GW, R(.8, .95) * GW].map(x => [x, ground[x | 0] - 10 * K]);
  for (const [x, y] of torches) { rect4(nImg, x, y, 2, 14 * K, [40, 24, 16]); for (let j = -10 * K; j < 10 * K; j++) for (let i = -12 * K; i <= 12 * K; i++) { const e = 1 - Math.hypot(i / (12 * K), j / (10 * K)); if (e > 0 && bay(x + i | 0, y + j | 0) < e * e * .5) put(nImg, x + i, y + j, [90, 50, 40]); } }
  const dragon = {x: R(0, GW), v: .45};
  twinkles = makeTwinkles(GW * hz / (1500 * K * K), hz * .7);
  return {flares: false, shooters: true, draw: t => {
    for (const [x, y] of wins) if (Math.sin(t / 500 + x) > .985) fill(x, y + 2 * K, '#2a1420');
    // banners waving on the spires
    for (const [x, y] of flags) for (let i = 0; i < 9; i++) for (let j = 0; j < 4 - i * .3; j++) fill(x + 1 + i, y + j + Math.sin(t / 200 - i * .6) * i * .25, i < 2 ? '#7a1428' : '#c02a40');
    // the dragon: a sinuous body, a long neck and tail, membranes beating, a silhouette against the moon
    dragon.x += dragon.v; if (dragon.x > GW + 90) dragon.x = -90;
    const dx = dragon.x, dy = my + Math.sin(dx / 120) * 14, fl = Math.sin(t / 260), C = '#0a0618';
    const sp = i => dy + Math.sin(i / 7 + t / 300) * 1.6 + (i > 10 ? -(i - 10) * .35 : 0);
    for (let i = -34; i <= 20; i++) { const th = i < -20 ? 1 : i < 8 ? 2 + (i > -8 && i < 4 ? 1 : 0) : 1.5; for (let k = 0; k < th; k++) fill(dx + i, sp(i) + k - th / 2, C); }
    for (let k = 0; k < 4; k++) { fill(dx + 21 + k, sp(20) - .5 + k * .2, C); fill(dx + 21 + k, sp(20) + .5, C); } fill(dx + 19, sp(20) - 2, C); fill(dx + 18, sp(20) - 3, C);
    for (let k = 0; k < 4; k++) { fill(dx - 34 - k, sp(-34) - k * .5, C); fill(dx - 34 - k, sp(-34) + k * .5, C); }
    const tipX = dx - 8, tipY = dy - 2 - fl * 16, tip2X = dx - 16, tip2Y = dy - fl * 10;
    for (let s = -6; s <= 6; s++) { const ax = dx + s, ay = sp(s) - 1, n = Math.ceil(Math.hypot(tipX - ax, tipY - ay)); for (let k = 0; k <= n; k++) { const q = k / n; fill(ax + (tipX - ax) * q + (s < 0 ? (tip2X - tipX) * q * (-s / 6) : 0), ay + (tipY - ay) * q + (s < 0 ? (tip2Y - tipY) * q * (-s / 6) : 0), C); } }
    for (let i = 0; i < 3; i++) { const lx = dx + 4 - i * 4, ly = sp(4 - i * 4); fill(lx, ly + 2, C); fill(lx - 1, ly + 3, C); }
    for (const [x, y] of torches) { fxc.globalAlpha = .12 + .05 * Math.sin(t / 70); fxc.fillStyle = '#ff9a40'; fxc.beginPath(); fxc.arc(x + 1, y - 6, 10 * K, 0, 6.283); fxc.fill();
      for (let k = 0; k < 4; k++) { fxc.globalAlpha = .9 - k * .2; fxc.fillStyle = ['#fff0a0', '#ffc030', '#ff7a1a', '#c0300a'][k]; fxc.fillRect(x - 1 + (Math.sin(t / 90 + k) > 0 ? 1 : 0), y - 4 - k * 3, 3 - (k > 1 ? 1 : 0), 3); } }
    for (let i = 0; i < 14; i++) { const x = ((i * 137 + t * .015 * (1 + i % 3 * .3)) % (GW + 200)) - 100, y = GH * .8 + Math.sin(i * 2.1) * 18 * K; fxc.globalAlpha = .05; fxc.fillStyle = '#b8a8e0'; fxc.beginPath(); fxc.ellipse(x, y, 60 * K, 6 * K, 0, 0, 6.283); fxc.fill(); }
  }};
}

/* Mars: a butterscotch sky with thin ice clouds, a small pale sun wrapped in the planet's blue glow, the two lumpy moons; far off a shield volcano and layered mesas in the haze, a great canyon wall with gullies and talus; a base of domes, a glowing greenhouse, a dish, solar panels and a rocket on its scorched pad; a crater with a central peak, dunes and pebbles, faceted boulders; an astronaut, a six-wheeled rover leaving tracks, a little helicopter, dust devils */
function mars(fImg, nImg) {
  const hz = Math.round(GH * .62), sx = R(.2, .8) * GW, sy = hz * R(.3, .45), ld = sx > GW / 2 ? 1 : -1;
  sky4(fImg, hz, ramp('#2a1008', '#4a1c10', '#7a3218', '#b04e28', '#d88050', '#f0b078', '#ffd8a8'), 0, 1);
  stars4(fImg, hz * .35, GW * GH / (1100 * K * K));
  clouds4(fImg, hz * .12, hz * .62, ramp('#d0845a', '#e09a6e', '#eeb48a', '#fad0a8'), .66, 9 * K, R(0, 99), .95, .4, 8);   // thin ice clouds, drawn long by the wind
  // around the sun the fine dust scatters blue, as it does on Mars
  for (let y = sy - 40 * K; y < sy + 40 * K; y++) for (let x = sx - 60 * K; x < sx + 60 * K; x++) { const d = Math.hypot((x - sx) / 1.4, y - sy) / (40 * K); if (d < 1 && bay(x | 0, y | 0) < (1 - d) ** 2 * .9) put(fImg, x, y, d < .4 ? [190, 200, 210] : [130, 150, 170]); }
  sun4(fImg, sx, sy, 6 * K, ramp('#c8d0d8', '#e8eef2', '#fffcf4'), 10 * K, true);
  // Phobos and Deimos: lumpy, lit on the sun's side, pitted with craters
  for (const [r, mx, my] of [[7 * K, (ld > 0 ? R(.08, .35) : R(.65, .92)) * GW, hz * R(.25, .4)], [3 * K, R(.1, .9) * GW, hz * R(.2, .3)]]) { const sd = R(0, 99);
    for (let y = -r * 1.3; y <= r * 1.3; y++) for (let x = -r * 1.6; x <= r * 1.6; x++) { const e = (x / (r * 1.4)) ** 2 + (y / r) ** 2 - (fbm(x / (2 * K) + sd, y / (2 * K), 2) - .5) * .5; if (e > 1) continue; const lit = x * ld / (r * 1.4) - y / r * .3;
      put(fImg, mx + x, my + y, dith(ramp('#3a2420', '#6a4636', '#9a6e54', '#c49a7a', '#e8c4a0'), .3 + lit * .5 + (fbm(x / K + sd, y / K, 2) < .32 ? -.3 : 0) + (e > .8 ? -.1 : 0), mx + x | 0, my + y | 0)); } }
  // far: the shield volcano, then mesas with layered cliffs and talus, softened by haze
  const vx = R(.2, .8) * GW;
  for (let x = 0; x < GW; x++) { const u = (x - vx) / (240 * K), h = Math.max(0, 1 - u * u) ** 1.5 * 22 * K; for (let y = hz - h; y < hz; y++) put(fImg, x, y, dith(ramp('#a85a3a', '#bc6c46', '#cc7e54'), .5 + (x - vx) * -ld / (480 * K), x, y | 0)); }
  const mesa = [];
  for (let x = 0; x < GW; x++) { const n = fbm(x / (40 * K), 7, 3); mesa[x] = hz + 2 * K - Math.round(clamp((n - .42) / .1) * (n > .52 ? 1 : .55) * 24 * K * (.6 + .5 * fbm(x / (150 * K), 3, 2))); }  // flat tops where the noise is high, talus slopes around them
  for (let x = 0; x < GW; x++) for (let y = mesa[x]; y < hz + 2 * K; y++) { const d = y - mesa[x], cliff = Math.abs((mesa[x + 2] ?? mesa[x]) - (mesa[x - 2] ?? mesa[x])) > 2 * K;
    put(fImg, x, y, dith(ramp('#6a2c1a', '#82381e', '#9a4826', '#b25a30', '#c8703e'), (d < K ? .9 : .45) + (Math.floor((y + fbm(x / (20 * K), 1, 2) * 3 * K) / (3 * K)) % 2 ? .1 : -.05) + (cliff ? -.2 : 0) + ((mesa[x + 2] ?? 0) < (mesa[x - 2] ?? 0) === (ld > 0) ? .1 : -.1), x, y)); }
  mist4(fImg, hz, 8 * K, [236, 160, 110], .55);
  // the plain: dunes with ripple lines
  const dunes = land4(fImg, hz + 6 * K, 10 * K, 70 * K, ramp('#4a1a0e', '#7a2e16', '#a84a22', '#c8683a', '#e08a54'), .9, .3, {depth: GH * .35, tex: 6, rim: true});
  for (let y = hz + 6 * K; y < GH * .88; y += 2 * K) { const q = (y - hz) / (GH - hz); for (let x = 0; x < GW; x++) if (y > dunes[x] + K && Math.sin(x / ((6 + q * 10) * K) + fbm(x / (30 * K), y / (8 * K), 2) * 6 + y) > .75 && bay(x, y) < .6) put(fImg, x, y, [228, 150, 96]); }
  // the canyon wall on the side away from the sun: its face turned to the light, layer upon layer, gullies running down, a fan of talus at its foot
  { const es = -ld, ce = R(.26, .34) * GW, foot = Math.round(hz + 16 * K), H = R(52, 64) * K, wt = [], out = [];
    for (let i = 0; i < GW; i++) { const x = es < 0 ? i : GW - 1 - i, e = (ce + (fbm(i / (30 * K), 11, 3) - .5) * 30 * K - i) / (22 * K); out[x] = Math.max(0, -e) * 22 * K; wt[x] = e <= 0 ? GH : Math.round(foot - H * Math.min(1, e) ** .6 * (.9 + .15 * fbm(i / (12 * K), 4, 2))); }
    for (let x = 0; x < GW; x++) { if (out[x] < 26 * K) { const tt = foot - 9 * K + out[x] * .45 + fbm(x / (3 * K), 8, 2) * 2 * K, tb = foot + 3 * K + fbm(x / (9 * K), 6, 2) * 5 * K;   // the talus fan spreading onto the plain
        for (let y = Math.round(tt); y < tb; y++) if (out[x] > 0 || y > foot - 9 * K) put(fImg, x, y, dith(ramp('#6a2812', '#8a3a1a', '#a84e26', '#c46634', '#dc8048'), .5 + (fbm(x / K, y / K, 2) - .5) * .7 + (y - tt < K ? .25 : 0) - (y - tt) / (14 * K) * .3, x, y)); }
      if (wt[x] >= GH) continue; const steep = Math.abs((wt[x + 3] ?? wt[x]) - (wt[x - 3] ?? wt[x])) / (6 * K), gully = fbm(x / (2.5 * K), 21, 2);
      for (let y = wt[x]; y < foot - 8 * K; y++) { const d = y - wt[x], band = Math.floor((y + fbm(x / (40 * K), 2, 2) * 6 * K) / (4 * K)), talus = y > foot - 8 * K;
        let v = .5 + (band % 3 === 0 ? .14 : band % 3 === 1 ? -.04 : .04) + (steep > .5 ? .12 : -.08) + (gully > .66 ? -.2 * Math.min(1, d / (8 * K)) : 0) + (d < K ? .3 : 0);
        if (talus) v = .55 + (fbm(x / K, y / K, 2) - .5) * .6 - (y - foot + 8 * K) / (12 * K) * .2;
        put(fImg, x, y, dith(ramp('#4a1a0c', '#6a2812', '#8a3a1a', '#a84e26', '#c46634', '#dc8048'), v, x, y)); } } }
  // a crater: an ejecta skirt, a raised rim, the inner wall lit on the far side, a central peak
  { const cx = R(.4, .6) * GW, cy = hz + R(.35, .5) * (GH * .88 - hz), cr = R(30, 46) * K, cv = cr * .26;
    for (let y = -cv * 2; y < cv * 2; y++) for (let x = -cr * 1.6; x < cr * 1.6; x++) { const e = Math.hypot(x / cr, y / cv), X = cx + x | 0, Y = cy + y | 0; if (e > 1.6) continue;
      if (e < .92) put(fImg, X, Y, dith(ramp('#3a140a', '#5a2210', '#7a3218', '#9c4824', '#bc6234', '#d87c46'), .45 + (x * -ld / cr) * .35 + (y / cv) * .12 + (e > .75 ? .15 * Math.sign(-x * ld) : 0), X, Y));
      else if (e < 1.08) put(fImg, X, Y, dith(ramp('#7a3218', '#a84a24', '#d0703c', '#f0a070'), .5 + (x * ld / cr) * .4 + (y < 0 ? .2 : -.1), X, Y));
      else if (bay(X, Y) < (1.6 - e) * 1.2 * (.5 + fbm(Math.atan2(y, x) * 3, 4, 2))) put(fImg, X, Y, [230, 150, 98]); }
    for (let j = 0; j < 4 * K; j++) for (let i = -(4 * K - j) * 1.4; i <= (4 * K - j) * 1.4; i++) put(fImg, cx + i, cy + cv * .1 - j, i * ld > 0 ? [220, 140, 90] : [110, 44, 22]); }
  // pebbles, thicker toward us
  for (let i = 0; i < GW * 1.2; i++) { const y = hz + 10 * K + (GH * .88 - hz - 10 * K) * Math.sqrt(rnd()), x = R(0, GW); if (y < dunes[x | 0] + K) continue; put(fImg, x, y, [70, 26, 12]); if (rnd() < .6) put(fImg, x + ld, y - 1, [236, 160, 110]); }
  // the base: tubes, geodesic domes, a greenhouse glowing green, a long habitat with an airlock, a dish, solar panels, a mast, crates, a rocket on a scorched pad
  const bx = Math.round(GW / 2 + ld * R(.05, .22) * GW), by = Math.round(hz + 8 * K), lights = [];
  const METAL = ramp('#3a3a50', '#5a5a70', '#8a8aa0', '#c0c0d0', '#eeeef6');
  const dome = (x, r, green) => { for (let y = 0; y < r * .8; y++) for (let i = -r; i <= r; i++) { const e = Math.hypot(i / r, y / (r * .8)); if (e > 1) continue; const lit = i * ld / r * .5 + y / r * .3, grid = (Math.round(i + r) % (3 * K) === 0 || Math.round(y) % (3 * K) === 0) && e < .97;
      put(fImg, x + i, by - y, grid ? METAL[1] : green ? (y < r * .35 && bay(x + i | 0, by - y) < .6 ? [60 + (i % 3) * 10, 170, 80] : dith(ramp('#2a6a5a', '#4a9a7a', '#8ad0a8', '#d0f4e0'), .4 + lit, x + i | 0, by - y)) : dith(METAL, .45 + lit, x + i | 0, by - y | 0)); }
    for (let i = -r * .3; i < r * .3; i++) put(fImg, x + i, by - K, green ? [190, 255, 190] : [255, 220, 150]); lights.push([x, by - K, 0, green]); };
  for (let i = -52 * K; i < 46 * K; i++) for (let j = 0; j < 2 * K; j++) put(fImg, bx + i, by - j, METAL[j ? 2 : 1]);
  dome(bx - 30 * K, 14 * K); dome(bx - 6 * K, 9 * K, true); dome(bx + 10 * K, 8 * K);
  for (let i = 20 * K; i < 42 * K; i++) for (let j = 0; j < 7 * K; j++) { const rnd2 = i > 38 * K; put(fImg, bx + i, by - j, rnd2 && j < 5 * K && i < 41 * K ? (j < 4 * K ? [60, 60, 80] : METAL[3]) : j > 6 * K ? METAL[4] : j % (3 * K) === K && (i / (3 * K) | 0) % 2 && !rnd2 ? [255, 210, 130] : dith(METAL, .5 + (j < 2 * K ? -.2 : 0), bx + i, by - j)); }
  for (let p = 0; p < 4; p++) { const px = bx - 64 * K - p * 9 * K; for (let i = 0; i < 7 * K; i++) for (let j = 0; j < 3 * K; j++) put(fImg, px + i + j * .6, by - 3 * K - j, (i % (2 * K) === 0) ? [40, 40, 70] : [70 + j * 6, 80 + j * 6, 140]); for (let j = 0; j < 3 * K; j++) put(fImg, px + 3 * K, by - j, [60, 50, 50]); }
  { const dx = bx - 46 * K; for (let j = 0; j < 6 * K; j++) put(fImg, dx, by - j, METAL[2]); for (let i = -5 * K; i <= 5 * K; i++) { const c = Math.abs(i) / (5 * K); for (let j = 0; j < 2 * K * (1 - c * c) + K; j++) put(fImg, dx + i * .8 + j * .3 * ld, by - 6 * K - 3 * K * c * c - j, j < K ? METAL[4] : METAL[2]); } put(fImg, dx + 2 * ld * K, by - 11 * K, METAL[4]); }   // the dish
  for (const [cx2, w, h, c] of [[bx + 44 * K, 3, 3, [180, 110, 60]], [bx + 48 * K, 4, 2.5, [200, 200, 210]], [bx + 47 * K, 2.5, 2, [180, 110, 60]]]) for (let i = 0; i < w * K; i++) for (let j = 0; j < h * K; j++) put(fImg, cx2 + i, by - j - (c[0] === 180 && cx2 === bx + 47 * K ? 2.5 * K : 0), j === 0 || i === 0 ? c.map(v => v * .6 | 0) : c);   // crates
  { const mx = bx + 54 * K; for (let j = 0; j < 22 * K; j++) put(fImg, mx, by - j, [180, 180, 190]); for (let k = -3 * K; k <= 3 * K; k++) put(fImg, mx + k, by - 22 * K + Math.abs(k) * .5, [200, 200, 210]); lights.push([mx, by - 23 * K, 1]); }
  { const rx = bx + (ld > 0 ? -94 : 82) * K, rh = 36 * K;  // the rocket: a pad with a scorch mark, landing legs, a white body with bands and a window, nose cone, fins
    for (let i = -14 * K; i < 14 * K; i++) for (let j = -K; j < 2 * K; j++) { const e = Math.hypot(i / (14 * K), j / (3 * K)); put(fImg, rx + i, by + j, e < .45 ? [40, 20, 16] : j < 0 ? [150, 140, 140] : [90, 80, 80]); }
    for (let j = 0; j < rh; j++) { const q = j / rh, w = q > .8 ? 3.5 * K * Math.sqrt(1 - (q - .8) / .2) : 3.5 * K; for (let i = -w; i <= w; i++) put(fImg, rx + i, by - 2 * K - j, (q > .55 && q < .59) || (q > .15 && q < .18) ? [60, 60, 80] : q > .66 && q < .7 && Math.abs(i) < K ? [120, 200, 255] : dith(METAL, .55 + i * ld / (3.5 * K) * .4, rx + i | 0, by - j)); }
    for (const s of [-1, 1]) { for (let j = 0; j < 8 * K; j++) for (let i = 0; i < (8 * K - j) * .5; i++) put(fImg, rx + s * (3.5 * K + i), by - 2 * K - j, METAL[1]); stroke(fImg, rx + s * 2 * K, by - 6 * K, rx + s * 8 * K, by, 1, METAL[0]); }
    for (let i = -K; i <= K; i++) for (let j = 0; j < 2 * K; j++) put(fImg, rx + i, by - j, [40, 40, 50]); }
  // the near ground: layered rock, angular boulders with flat lit facets, pits and shadows
  const top = land4(nImg, GH * .88, 16 * K, 55 * K, ramp('#3a140a', '#5a2210', '#823818', '#aa5424', '#cc7234'), .9, .2, {depth: GH * .2, tex: 4, rim: true});
  for (let x = 0; x < GW; x++) for (let y = top[x] + K; y < GH; y++) if ((Math.floor((y + fbm(x / (25 * K), 5, 2) * 4 * K) / (2.5 * K)) % 3) === 0 && bay(x, y) < .4) put(nImg, x, y, [80, 30, 14]);
  const ROCK = ramp('#2a0e06', '#4a1a0c', '#6e2c14', '#9a4622', '#c06a38', '#e08c52');
  const boulders = Array.from({length: 24}, (_, i) => { const x = R(0, GW) | 0; return {x, y: top[x] + R(3, 24) * K, r: R(1.5, 5) * K * (i < 5 ? 2.2 : 1), sd: R(0, 99)}; }).sort((a, b) => a.y - b.y);
  for (const {x, y, r, sd} of boulders) {
    for (let k = 0; k < r * 2.5; k++) if (bay(x - ld * k | 0, y | 0) < .75) for (let j = 0; j < K; j++) put(nImg, x - ld * (r * .6 + k), y + j, [42, 14, 8]);
    for (let j = 0; j < r * 1.5; j++) for (let k = -r * 1.4; k <= r * 1.4; k++) { const n = fbm(k / (r * .6) + sd, j / (r * .6), 2), e = (k / (r * 1.4)) ** 2 + ((j - r * .7) / (r * .8)) ** 2 + (n - .5) * .6; if (e > 1) continue;
      const facet = Math.round((k * ld / r * .9 + j / r * .7 + (n - .5)) * 2) / 2;   // a few flat planes, not a smooth blob
      put(nImg, x + k, y - j, fbm(k / K + sd, j / K, 2) < .25 ? ROCK[0] : dith(ROCK, .25 + facet * .3 + (e > .8 ? -.1 : 0), x + k | 0, y - j | 0)); } }
  // an astronaut standing on the near ground, looking toward the base: white suit, gold visor, backpack, a shadow
  { const ax = bx + R(-30, 30) * K, ay = top[Math.max(0, Math.min(GW - 1, ax | 0))] + R(10, 16) * K, f = bx > ax ? 1 : -1, S = K;
    for (let k = 0; k < 10 * S; k++) if (bay(ax - ld * k | 0, ay) < .7) put(nImg, ax - ld * (2 * S + k), ay, [42, 14, 8]);
    const P = (i, j, c) => put(nImg, ax + f * i, ay - j, c), SUIT = [[150, 150, 160], [210, 210, 218], [244, 244, 248]], s3 = i => SUIT[i * f * ld > 0 ? 2 : i * f * ld < -1 ? 0 : 1];
    for (let j = 0; j < 5 * S; j++) for (let i = -2 * S; i <= 2 * S; i++) if (Math.abs(i) > .5 * S) P(i + (j < S ? (i > 0 ? .5 : -.5) * S : 0), j, j < S ? [70, 60, 60] : s3(i));   // legs and boots
    for (let j = 5 * S; j < 10 * S; j++) for (let i = -2 * S; i <= 2 * S; i++) P(i, j, j === 7 * S && i > 0 ? [230, 120, 50] : s3(i));   // torso with an orange band
    for (let j = 5 * S; j < 11 * S; j++) for (let i = -4 * S; i < -2 * S; i++) P(i, j, SUIT[0]);   // backpack
    for (let j = 6 * S; j < 9.5 * S; j++) P(2.5 * S, j, s3(1));   // an arm
    for (let j = 0; j < 4 * S; j++) for (let i = -2 * S; i <= 2 * S; i++) if (Math.hypot(i, j - 2 * S) <= 2.2 * S) P(i, 10 * S + j, i > -.3 * S && j > S && j < 3.4 * S ? (j > 2.6 * S ? [255, 230, 140] : [220, 160, 40]) : s3(i)); }
  const rover = {x: R(.1, .6) * GW, v: .12}, ry = x => GH * .8 + Math.sin(x / 17) * 2, tracks = [];
  const devils = Array.from({length: 2}, () => ({x: R(0, GW), v: R(.1, .3), base: GH * R(.7, .78), h: R(30, 50) * K}));
  const dust = Array.from({length: 50}, () => ({x: R(0, GW), y: R(GH * .75, GH), v: R(.3, .9)})), heli = {x: R(0, GW), y: hz - R(14, 26) * K};
  twinkles = makeTwinkles(GW * hz / (2500 * K * K), hz * .3);
  return {flares: false, shooters: true, draw: t => {
    for (const d of devils) { d.x += d.v; if (d.x > GW + 40) d.x = -40; for (let j = 0; j < d.h; j++) { const q = j / d.h, w = 1.5 + q * q * 12 * K, xx = d.x + Math.sin(j / 6 + t / 180) * (2 + q * 6); fxc.globalAlpha = .14 * (1 - q * .6); fxc.fillStyle = j % 3 ? '#e8a870' : '#c8804a'; fxc.fillRect(xx - w, d.base - j, w * 2, 1); } fxc.globalAlpha = .1; fxc.fillStyle = '#d89060'; fxc.fillRect(d.x - 10 * K, d.base - 2, 20 * K, 3); }
    for (const p of dust) { p.x += p.v; if (p.x > GW) { p.x = 0; p.y = R(GH * .75, GH); } fill(p.x, p.y + Math.sin(t / 300 + p.x / 20), '#f0b080', .35); }
    // the little helicopter: a box body, legs, two rotors blurring
    heli.x += .25; if (heli.x > GW + 20) heli.x = -20; const hx = heli.x, hy = heli.y + Math.sin(t / 700) * 3;
    for (let i = -2; i <= 2; i++) for (let j = 0; j < 3; j++) fill(hx + i, hy + j, j ? '#c8c8d0' : '#e8e8f0'); fill(hx - 2, hy + 3, '#555'); fill(hx + 2, hy + 3, '#555'); fill(hx - 3, hy + 4, '#555'); fill(hx + 3, hy + 4, '#555');
    for (let j = -2; j < 0; j++) fill(hx, hy + j, '#888'); const rl = 5 + Math.sin(t / 30) * 2; for (let i = -rl; i <= rl; i++) { fill(hx + i, hy - 2, '#ddd', .45); fill(hx + i, hy - 3, '#ddd', .3); }
    rover.x += rover.v; if (rover.x > GW + 20) { rover.x = -20; tracks.length = 0; } const x = rover.x, y = ry(x);
    if (!tracks.length || x - tracks[tracks.length - 1] > 2) tracks.push(x);
    for (const tx of tracks) { fill(tx, ry(tx) + 2, '#5a2210', .5); fill(tx, ry(tx) + 4, '#5a2210', .5); }
    for (let i = 0; i < 14; i++) for (let j = 0; j < 3; j++) fill(x + i - 1, y - j - 4, j === 2 ? '#3a3a60' : j ? '#e8e8f0' : '#9a9aa8');
    for (let i = -2; i < 16; i++) fill(x + i, y - 7, '#2a2a58');
    for (const wx of [0, 5, 10]) { for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) fill(x + wx + a, y + b - 1, (a + b + Math.floor(t / 120)) % 2 ? '#1a1a1a' : '#3a3a3a'); fill(x + wx + 1, y - 2, '#6a6a70'); }
    for (let j = 0; j < 6; j++) fill(x + 11, y - 8 - j, '#aaa'); fill(x + 10, y - 14, '#ddd'); fill(x + 11, y - 14, '#ddd'); fill(x + 12, y - 14, '#ddd'); fill(x + 12, y - 13, Math.sin(t / 300) > 0 ? '#f44' : '#400');
    for (const [lx, ly, blink, green] of lights) if (!blink || Math.sin(t / 400) > .6) { fxc.globalAlpha = blink ? .9 : .25 + .1 * Math.sin(t / 900 + lx); fxc.fillStyle = blink ? '#ff5040' : green ? '#a0ffb0' : '#ffd890'; fxc.fillRect(lx - (blink ? 1 : 3), ly - 1, blink ? 2 : 6, 2); }
  }};
}

/* Marais: a swamp at night under a green moon, bald cypresses with flared trunks and knees in three layers of fog, Spanish moss hanging in strands, black water mirroring it all, lily pads and a glowing water lily, duckweed, a mossy log with glowing mushrooms, reeds and cattails, a frog that sings, will-o'-the-wisps, fireflies */
function marais(fImg, nImg) {
  const hz = Math.round(GH * .6), wy = hz + 6 * K, mx = R(.25, .75) * GW, my = hz * R(.25, .4);
  sky4(fImg, hz, ramp('#020a0a', '#041414', '#08221e', '#0e362e', '#1a5040', '#2a6a54'), 0, 1);
  stars4(fImg, hz * .6, GW * GH / (700 * K * K));
  for (let y = my - 60 * K; y < my + 60 * K; y++) for (let x = mx - 80 * K; x < mx + 80 * K; x++) { const d = Math.hypot((x - mx) / 1.3, y - my) / (60 * K); if (d < 1 && bay(x | 0, y | 0) < (1 - d) ** 2 * .7) put(fImg, x, y, [40, 96, 76]); }   // moon glow in the damp air
  sun4(fImg, mx, my, 11 * K, ramp('#a0c4b0', '#c4e4d0', '#e8fff0'), 20 * K, false);
  const mix = (a, b, f) => a.map((v, i) => Math.round(v + (b[i] - v) * f)), FOG = [96, 150, 126], MOSS = [92, 120, 92];
  // a bald cypress: a trunk flaring into buttresses, a few crooked limbs, flat crowns, moss hanging in strands, knees around its foot
  const cypress = (img, x, base, h, f, sd) => {
    const D = [mix([6, 16, 14], FOG, f), mix([12, 28, 22], FOG, f), mix([22, 44, 34], FOG, f), mix([36, 64, 48], FOG, f)], tw = h * .045, lean = R(-.08, .08), ends = [];
    for (let j = 0; j < h; j++) { const q = j / h, hw = tw * (1 + 2.6 * Math.max(0, 1 - q * 5) ** 2) * (1 - q * .4), cx = x + lean * j + Math.sin(j / (9 * K) + sd) * K;
      for (let k = -hw; k <= hw; k++) put(img, cx + k, base - j, D[k / hw > .45 ? 2 : fbm((cx + k) / K, j / (6 * K), 2) > .62 ? 0 : 1]); }
    const top = [x + lean * h, base - h];
    for (let b = 0; b < 5; b++) { const a = -Math.PI / 2 + R(-1.3, 1.3), y0 = base - h * R(.55, .95), x0 = x + lean * (base - y0), L = h * R(.18, .32), x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L * .5;
      stroke(img, x0, y0, x1, y1, Math.max(1, tw * .5), D[1]); ends.push([x1, y1]); }
    ends.push(top);
    for (const [ex, ey] of ends) { const rx = R(12, 22) * K * h / (90 * K), ry = rx * .38; blob(img, ex, ey, rx, ry, [D[0], D[1], D[2], D[3]], .1, .8, R(0, 99), .55);
      for (let m = 0; m < rx / K * .45; m++) { const sx = ex + R(-rx, rx) * .8, L = R(6, 24) * K * h / (90 * K), s0 = ey + ry * R(.2, .7); for (let j = 0; j < L; j++) for (let w = 0; w < (j < L * .4 ? 2 : 1); w++) if (bay(sx + w | 0, s0 + j | 0) < .9 - j / L * .6) put(img, sx + w + Math.sin(j / (3 * K) + sx) * .8, s0 + j, mix(MOSS, FOG, f * .8).map(v => v * (.7 + .3 * (1 - j / L)) | 0)); } }
    for (let n = 0; n < 4; n++) { const kx = x + R(-5, 5) * tw, kh = R(2, 5) * K * (1 - f * .5); for (let j = 0; j < kh; j++) for (let k = -(kh - j) * .4; k <= (kh - j) * .4; k++) put(img, kx + k, base + R(1, 4) * K * 0 + 2 * K - j, D[k > 0 ? 2 : 1]); }
  };
  // three layers of trees, each further one paler in the fog, with mist lying between them
  for (const [f, n, hs, dy] of [[.62, 9, .6, -2], [.36, 7, .85, 0], [.12, 5, 1.1, 2]]) {
    const xs = Array.from({length: n}, (_, i) => (i + R(.1, .9)) / n * GW * 1.1 - GW * .05);
    for (const x of xs) { if (Math.abs(x - mx) < 26 * K && f < .5) continue; cypress(fImg, x, wy + dy * K, R(70, 110) * K * hs, f, R(0, 99)); }
    mist4(fImg, wy - 4 * K + dy * K, 8 * K, FOG.map(v => v + 20), .45 - f * .2);
  }
  // the water: black, the trees and moon mirrored, a sheen of mist on it, duckweed, lily pads with one water lily lit from within
  reflect4(fImg, wy, .55, [2, 10, 8]);
  mist4(fImg, wy + 2 * K, 5 * K, [110, 170, 140], .5);
  for (let i = 0; i < 26; i++) { const cx = R(0, GW), cy = R(wy + 6 * K, GH * .95), r = R(6, 20) * K * (.4 + (cy - wy) / (GH - wy)); for (let k = 0; k < r * 3; k++) { const a = R(0, 6.28), d = Math.sqrt(rnd()) * r; put(fImg, cx + Math.cos(a) * d * 1.8, cy + Math.sin(a) * d * .35, rnd() < .3 ? [80, 150, 60] : [40, 100, 44]); } }
  const pads = [];
  for (let i = 0; i < 16; i++) { const cy = R(wy + 10 * K, GH * .9), s = .4 + (cy - wy) / (GH - wy), cx = R(.05, .95) * GW, r = R(4, 7) * K * s, notch = R(0, 6.28); pads.push([cx, cy, r]);
    for (let y = -r * .4; y <= r * .4; y++) for (let x = -r; x <= r; x++) { const e = (x / r) ** 2 + (y / (r * .4)) ** 2, an = Math.atan2(y / .4, x); if (e > 1 || Math.abs(((an - notch + 9.42) % 6.28) - 3.14) < .3) continue; put(fImg, cx + x, cy + y, e > .7 && y < 0 ? [70, 130, 70] : y > 0 ? [18, 56, 32] : [32, 86, 46]); } }
  const lily = pads[pads.length - 1];
  { const [cx, cy, r] = lily; for (let p = 0; p < 7; p++) { const a = -Math.PI + p / 6 * Math.PI, L = r * .7; for (let k = 0; k < L; k++) put(fImg, cx + Math.cos(a) * k * .8, cy - r * .2 + Math.sin(a) * k * .6, k > L * .6 ? [255, 236, 246] : [240, 180, 210]); } put(fImg, cx, cy - r * .3, [255, 230, 120]);
    for (let y = -r; y < r; y++) for (let x = -r * 1.5; x < r * 1.5; x++) { const d = Math.hypot(x / 1.5, y) / r; if (d < 1 && bay(cx + x | 0, cy + y | 0) < (1 - d) * .25) put(fImg, cx + x, cy + y - r * .3, [150, 200, 170]); } }
  // the near bank: mud, a mossy log with pale glowing mushrooms, reeds and cattails
  const top = land4(nImg, GH * .9, 10 * K, 40 * K, ramp('#020806', '#04100c', '#082018', '#10382a'), .1, .8, {depth: 20 * K, tex: 3});
  const shrooms = [];
  { const side = rnd() < .5 ? -1 : 1, x0 = side < 0 ? -10 * K : GW * R(.6, .7), x1 = side < 0 ? GW * R(.3, .4) : GW + 10 * K, r = 5 * K;
    for (let x = x0; x < x1; x++) { const y = top[Math.max(0, Math.min(GW - 1, x | 0))] - r + K; for (let j = -r; j <= r; j++) put(nImg, x, y + j, j < -r + K ? [50, 90, 50] : j < -r * .3 && fbm(x / (3 * K), 4, 2) > .45 ? [36, 70, 40] : fbm(x / (8 * K), j / (.8 * K), 2) > .58 ? [20, 16, 12] : j < -r * .3 ? [64, 50, 36] : j < r * .4 ? [46, 36, 26] : [28, 22, 16]);
      if (rnd() < .025) shrooms.push([x, y - r]); }
    { const ex = side < 0 ? x1 : x0, ey = top[Math.max(0, Math.min(GW - 1, ex | 0))] - r + K;   // the sawn end: pale wood in rings
      for (let j = -r; j <= r; j++) for (let k = -r * .5; k <= r * .5; k++) { const d = Math.hypot(k / (r * .5), j / r); if (d <= 1) put(nImg, ex + k, ey + j, d > .85 ? [44, 34, 24] : Math.round(d * 4) % 2 ? [120, 96, 64] : [150, 122, 84]); } }
    for (const [sx, sy] of shrooms) { const h = R(2, 4) * K; for (let j = 0; j < h; j++) put(nImg, sx, sy - j, [190, 230, 210]); for (let k = -1.5 * K; k <= 1.5 * K; k++) { put(nImg, sx + k, sy - h, [160, 255, 220]); if (Math.abs(k) < K) put(nImg, sx + k, sy - h - 1, [210, 255, 236]); } } }
  for (let i = 0; i < 46; i++) { const x = R(0, GW) | 0, h = R(14, 40) * K, bend = R(-.3, .3), cat = rnd() < .45; for (let j = 0; j < h; j++) put(nImg, x + bend * j * j / h, top[x] - j, j > h * .7 ? [30, 80, 54] : [14, 52, 36]);
    if (cat) { const tx = x + bend * h, ty = top[x] - h * .8; for (let j = 0; j < 4 * K; j++) for (let k = -K; k <= K * .5; k++) put(nImg, tx + k, ty - j, k < 0 ? [70, 36, 20] : [110, 60, 32]); }
    else for (let j = 0; j < h * .6; j++) put(nImg, x + R(-.2, .2) * j + 1, top[x] - j, [20, 64, 44]); }
  const frog = pads.slice(0, -1).filter(p => p[1] < GH * .8).sort((a, b) => b[2] - a[2])[0], fd = rnd() < .5 ? -1 : 1;
  const wisps = Array.from({length: 9}, () => ({x: R(0, GW), y: R(hz - 20 * K, GH * .85), p: R(0, 6.28), c: ['#aaffcc', '#88ffee', '#ccffaa'][rnd() * 3 | 0]}));
  const flies = drift4(34, {colors: ['#e8ffa0'], vy: -.05, sway: .3, alpha: .6}), rings = Array.from({length: 3}, () => ({x: R(0, GW), y: R(wy + 8 * K, GH * .88), t: R(0, 4000)}));
  twinkles = makeTwinkles(GW * hz / (4000 * K * K), hz * .4);
  return {flares: false, shooters: false, draw: t => {
    for (const r of rings) { const a = ((t + r.t) % 4000) / 4000; if (a > .98) { r.x = R(0, GW); r.y = R(wy + 8 * K, GH * .88); } const rr = a * 10 * K; for (let k = -rr; k <= rr; k += 2) fill(r.x + k, r.y + Math.sqrt(Math.max(0, rr * rr - k * k)) * .25, '#9ad0b8', (1 - a) * .4); }
    flies(t);
    for (const s of wisps) { s.x += Math.sin(t / 1800 + s.p) * .35; s.y += Math.cos(t / 1300 + s.p) * .22; const a = .5 + .5 * Math.sin(t / 500 + s.p); for (let k = 1; k < 7; k++) { fxc.globalAlpha = a * .12 / k * 3; fxc.fillStyle = s.c; fxc.fillRect(s.x - k, s.y - k, 2 * k, 2 * k); } fill(s.x, s.y, '#fff', a); fill(s.x, s.y + 6 + Math.sin(t / 400) , s.c, a * .3); }
    for (const [sx, sy] of shrooms) { fxc.globalAlpha = .1 + .06 * Math.sin(t / 900 + sx); fxc.fillStyle = '#a0ffd8'; fxc.beginPath(); fxc.ellipse(sx, sy - 3 * K, 5 * K, 3 * K, 0, 0, 6.283); fxc.fill(); }
    { const [lx, ly, lr] = lily; fxc.globalAlpha = .1 + .05 * Math.sin(t / 1200); fxc.fillStyle = '#ffd8ec'; fxc.beginPath(); fxc.ellipse(lx, ly - lr * .3, lr * 1.2, lr * .6, 0, 0, 6.283); fxc.fill(); }
    // the frog on its pad, seen from the side (one eye): a hunched body, a bulging eye, a throat that swells when it sings
    if (frog) { const [px, py] = frog, P = (i, j, c) => { for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) fill(px + fd * i * K + a, py - 2 * K + j * K + b, c); }, sing = Math.max(0, Math.sin(t / 260)) * (Math.sin(t / 2600) > .3 ? 1 : 0);
      for (let i = -4; i <= 4; i++) for (let j = -3; j <= 0; j++) if ((i / 4.5) ** 2 + ((j + 1) / 3) ** 2 < 1) P(i, j, j === -3 ? '#4aa050' : i > 1 && j > -2 ? '#9ad070' : '#2e7a3a');
      P(-5, 0, '#2e7a3a'); P(-5, -1, '#2e7a3a'); P(-3, 1, '#1e5a2a'); P(2, 1, '#1e5a2a'); P(3, 1, '#1e5a2a');
      P(2, -4, '#2e7a3a'); P(3, -4, '#ffe060'); P(3, -5, '#2e7a3a'); P(4, -3, '#3a8a40'); fill(px + fd * 3 * K + (fd > 0 ? K - 1 : 0), py - 6 * K, '#111');
      if (sing > .1) { const r = 1 + sing * 2; for (let i = 0; i <= r; i++) for (let j = 0; j <= r; j++) if (i * i + j * j <= r * r) P(3 + i * .7, -1 + j * .6, '#c8e8a0'); } }
    for (let i = 0; i < 16; i++) { const x = ((i * 157 + t * .012 * (1 + i % 3 * .3)) % (GW + 200)) - 100, y = wy - 6 * K + Math.sin(i * 2.3) * 14 * K; fxc.globalAlpha = .05; fxc.fillStyle = '#9ac8b0'; fxc.beginPath(); fxc.ellipse(x, y, 70 * K, 5 * K, 0, 0, 6.283); fxc.fill(); }
  }};
}

/* Nuit étoilée: a sky painted in short brush strokes that follow the wind and coil into great swirls, stars ringed with gold, a crescent moon in its halo, rolling hills in strokes, a village with a tall church spire and lit windows, a flame-like cypress, strokes of light drifting along the wind */
function vangogh(fImg, nImg) {
  const hz = Math.round(GH * .7), seed = R(0, 99);
  const BLUE = ramp('#0a1440', '#14287a', '#1e3e9e', '#2c5cc0', '#4a80d8', '#78a8e8', '#b0d4f4', '#e0f0ff'), GOLD = ramp('#9a8030', '#d0b040', '#f0d860', '#fff0a0', '#fffce8');
  // the vortices: two great swirls, every star, the moon
  const cyp = (rnd() < .5 ? R(.06, .24) : R(.76, .94)) * GW | 0, mx = cyp > GW / 2 ? R(.08, .2) * GW : R(.8, .92) * GW, my = hz * R(.16, .24), vort = [{x: R(.32, .5) * GW, y: hz * .38, r: 46 * K, d: 1}, {x: R(.56, .7) * GW, y: hz * .5, r: 30 * K, d: -1}], stars = [];
  for (let i = 0; i < 10; i++) { const x = R(.04, .96) * GW, y = R(.08, .55) * hz; if (Math.hypot(x - mx, y - my) < 40 * K || Math.abs(x - cyp) < 26 * K) continue; const r = R(3, 6) * K; stars.push({x, y, r}); vort.push({x, y, r: r * 3, d: 1}); }
  vort.push({x: mx, y: my, r: 26 * K, d: 1});
  const flow = (x, y) => { let a = Math.sin(x / (90 * K) + seed) * .35 + (fbm(x / (70 * K) + seed, y / (50 * K), 2) - .5) * 1.4, vx = Math.cos(a), vy = Math.sin(a);
    for (const v of vort) { const dx = (x - v.x) / 1.5, dy = y - v.y, d = Math.hypot(dx, dy) + .01, w = Math.exp(-((d / v.r) ** 2)) * 2.5; vx += -dy / d * w * v.d; vy += dx / d * w * v.d * .66; } return Math.atan2(vy, vx); };
  const glow = (x, y) => { let g = Math.exp(-((Math.hypot(x - mx, y - my) / (20 * K)) ** 2)) * 1.1; for (const s of stars) g += Math.exp(-((Math.hypot(x - s.x, y - s.y) / (s.r * 1.9)) ** 2)); return g; };
  const tone = (x, y) => { let v = .32 + .3 * fbm(x / (40 * K) + seed, y / (30 * K), 3) + (1 - y / hz) * .04; for (const w of vort.slice(0, 2)) { const d = Math.hypot((x - w.x) / 1.5, y - w.y) / w.r; if (d < 1.6) v += .22 * Math.sin(d * 9) * (1.6 - d) / 1.6 + (d < .3 ? .2 : 0); } return v; };
  const colAt = (x, y, j) => { const g = glow(x, y); return g > .55 + j * .25 ? GOLD[Math.min(4, Math.max(0, Math.round(g * 3 + j * 2)))] : BLUE[Math.min(7, Math.max(0, Math.round((tone(x, y) + j * .15) * 7)))]; };
  // the sky: an underpainting, then thousands of strokes laid along the flow
  for (let y = 0; y < hz; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, colAt(x, y, 0));
  const brush = (img, x, y, L, w, c, ang) => { for (let s = 0; s < L; s++) { const a = ang(x, y); for (let k = -w / 2; k < w / 2; k++) put(img, x - Math.sin(a) * k, y + Math.cos(a) * k, k < -w / 2 + 1 && s > 1 && s < L - 1 ? c.map(v => Math.min(255, v + 26)) : c); x += Math.cos(a); y += Math.sin(a); } };
  for (let i = 0; i < GW * hz / (14 * K * K); i++) { const x = R(0, GW), y = R(0, hz); brush(fImg, x, y, R(4, 9) * K, 1.5 * K, colAt(x, y, R(-1, 1)), flow); }
  // the stars: a hot core and rings of gold and white strokes; the moon: a crescent in a halo of rings
  for (const s of stars) { for (let ring = 1; ring < 4; ring++) { const rr = s.r * (.7 + ring * .55); for (let a = 0; a < 6.28; a += 1.6 / rr) if (fbm(a * 2 + s.x, ring, 1) > .35) put(fImg, s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr, ring === 1 ? GOLD[4] : ring === 2 ? GOLD[3] : GOLD[2]); }
    for (let y = -s.r; y <= s.r; y++) for (let x = -s.r; x <= s.r; x++) { const d = Math.hypot(x, y) / s.r; if (d < .6) put(fImg, s.x + x, s.y + y, d < .3 ? [255, 255, 240] : GOLD[3]); } }
  for (let ring = 0; ring < 6; ring++) { const rr = 14 * K + ring * 3 * K; for (let a = 0; a < 6.28; a += .8 / rr) if (bay(mx + Math.cos(a) * rr | 0, my + Math.sin(a) * rr | 0) < .9 - ring * .12) put(fImg, mx + Math.cos(a) * rr, my + Math.sin(a) * rr, ring % 2 ? GOLD[2] : GOLD[3]); }
  for (let y = -12 * K; y <= 12 * K; y++) for (let x = -12 * K; x <= 12 * K; x++) { const d = Math.hypot(x, y), d2 = Math.hypot(x - 6 * K, y - 3 * K); if (d < 12 * K) put(fImg, mx + x, my + y, d2 <= 10 * K ? ((x + 2 * y) % 7 < 3 ? BLUE[2] : BLUE[3]) : d > 10.5 * K ? GOLD[1] : (x + y) % 5 < 2 ? GOLD[4] : [250, 220, 100]); }
  // far mountains: a long blue range laid in strokes along its ridges, a seam of light on the crest
  const along = arr => (px, py) => Math.atan2((arr[Math.min(GW - 1, Math.max(0, (px | 0) + 4))] ?? hz) - (arr[Math.min(GW - 1, Math.max(0, (px | 0) - 4))] ?? hz), 8) + Math.sin(py / (6 * K) + px / (40 * K)) * .25;
  const mtn = []; for (let x = 0; x < GW; x++) mtn[x] = Math.round(hz - 4 * K - (fbm(x / (80 * K) + seed, 2, 3) * 26 + fbm(x / (25 * K), 5, 2) * 6) * K);
  const MTN = [[18, 40, 100], [26, 54, 124], [36, 70, 146], [52, 92, 168], [84, 124, 194]];
  for (let x = 0; x < GW; x++) for (let y = mtn[x]; y < hz + 4 * K; y++) put(fImg, x, y, MTN[1]);
  for (let i = 0; i < GW * 4; i++) { const x = R(0, GW), y = R(mtn[x | 0] + K, hz + 4 * K); brush(fImg, x, y, R(5, 10) * K, 1.5 * K, MTN[Math.min(4, Math.max(0, Math.round(2.6 + R(-1, 1) - (y - mtn[x | 0]) / (9 * K) + (fbm(x / (20 * K), y / (8 * K), 2) - .5) * 2)))], along(mtn)); }
  for (let x = 0; x < GW; x++) if (bay(x, mtn[x]) < .7) put(fImg, x, mtn[x], MTN[4]);
  // the hills: rolling ground laid in strokes that follow its curve, a field of pale wheat, olive trees
  const hills = land4(fImg, hz, 18 * K, 100 * K, ramp('#06122a', '#0a1c44', '#10285a', '#183a7a'), .2, .8, {depth: 40 * K});
  const HILL = [[8, 20, 48], [14, 32, 72], [22, 48, 102], [34, 68, 126], [40, 86, 108], [58, 100, 86]], WHEAT = [[70, 80, 70], [104, 106, 76], [140, 132, 84], [176, 160, 96]], fs = R(0, 99);
  for (let i = 0; i < GW * (GH - hz) / (10 * K * K); i++) { const x = R(0, GW), y = R(hills[x | 0], GH), q = (y - hz) / (GH - hz), wheat = q > .35 && fbm(x / (70 * K) + fs, y / (30 * K), 2) > .56;
    brush(fImg, x, y, R(5, 10) * K, 1.5 * K, wheat ? WHEAT[Math.min(3, Math.max(0, Math.round(1.6 + R(-1.2, 1.2))))] : HILL[Math.min(5, Math.max(0, Math.round(fbm(x / (30 * K), y / (12 * K), 2) * 5 + R(-1.2, 1.2) - q * 1.5)))], wheat ? (px, py) => -.5 + Math.sin(px / (9 * K)) * .3 : along(hills)); }
  // the village: houses seen a little from the side, walls in different tints, a shaded side wall, gable roofs, chimneys, warm windows haloed in gold, doors; round trees between them; a church with a needle spire
  const wins = [], OUT = [8, 10, 28];
  const WALLS = [[[46, 62, 112], [66, 86, 136], [92, 112, 158]], [[86, 84, 100], [118, 112, 122], [150, 142, 142]], [[70, 66, 112], [96, 90, 140], [126, 118, 166]], [[58, 80, 98], [84, 108, 122], [114, 136, 148]]];
  const ROOFS = [[[16, 22, 50], [30, 38, 74], [48, 58, 98]], [[52, 26, 36], [80, 42, 48], [110, 62, 60]]];
  const house = (x, w, h, rh, church) => {
    const y = hills[Math.max(0, Math.min(GW - 1, x + w / 2 | 0))] + 6 * K, W = church ? WALLS[1] : WALLS[rnd() * 4 | 0], RF = ROOFS[rnd() < .6 ? 0 : 1], sw = Math.round(w * .45);
    for (let i = 0; i < sw; i++) for (let j = 0; j < h; j++) put(fImg, x + w + i, y - i * .35 - j, i >= sw - 1 || j === 0 ? OUT : bay(x + w + i | 0, (y - j) / (2 * K) | 0) < .3 ? W[1] : W[0]);   // the side wall in shade
    for (let i = 0; i < sw; i++) for (let t = 0; t <= w; t++) { const px = x + w / 2 + t / 2, py = y - h - rh + rh * t / w; put(fImg, px + i, py - i * .35, i >= sw - 1 || t < 1 || t >= w ? OUT : RF[(Math.round(t / (1.5 * K)) % 2) + (i < 2 ? 1 : 0)]); }   // the roof slope over it
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(fImg, x + i, y - j, i === 0 || i >= w - 1 || j === 0 ? OUT : bay(x + i, (y - j) / (2 * K) | 0) < .35 ? W[2] : W[1]);   // the front wall, brushed
    for (let j = 0; j < rh; j++) { const hw = w / 2 * (1 - j / rh); for (let i = -hw; i <= hw; i++) put(fImg, x + w / 2 + i, y - h - j, Math.abs(i) > hw - 1.2 ? OUT : W[(j / (2 * K) | 0) % 2 ? 1 : 0]); }   // the gable
    if (!church && rnd() < .7) { const cx2 = x + w + sw * .4, cy2 = y - h - rh * .55 - sw * .4 * .35; for (let j = 0; j < 5 * K; j++) for (let i = 0; i < 2 * K; i++) put(fImg, cx2 + i, cy2 - j, i === 0 || j > 4 * K ? OUT : W[0]); }
    rect4(fImg, x + w / 2 - K, y - 4.5 * K, 2 * K, 4.5 * K, [30, 22, 30]);   // the door
    for (const wx of w > 12 * K ? [x + 2 * K, x + w - 4 * K] : [x + 2 * K]) { const wy = y - h + 2 * K; if (wx + 2 * K > x + w / 2 - K && wx < x + w / 2 + K) continue;
      for (let j = -2 * K; j < 5 * K; j++) for (let i = -2 * K; i < 4 * K; i++) if ((i < 0 || i >= 2 * K || j < 0 || j >= 3 * K) && bay(wx + i | 0, wy + j | 0) < .07) put(fImg, wx + i, wy + j, [250, 220, 110]);
      for (let j = 0; j < 3 * K; j++) for (let i = 0; i < 2 * K; i++) put(fImg, wx + i, wy + j, i === K || j === Math.round(1.5 * K) ? [120, 80, 40] : j < K ? [255, 236, 150] : [250, 200, 80]); wins.push([wx, wy]); }
    return y;
  };
  const cx = R(.4, .6) * GW | 0, cw = 14 * K;
  const spots = Array.from({length: 28}, () => R(.02, .94) * GW | 0).filter(x => Math.abs(x - cx) > 20 * K && Math.abs(x - cyp) > 22 * K).sort((a, b) => hills[a] - hills[b]);
  for (const x of spots) { if (rnd() < .28) { const y = hills[x] + 4 * K, r = R(4, 7) * K; blob(fImg, x, y - r, r, r * .9, [[6, 20, 30], [10, 34, 44], [18, 52, 60]], .2, .8, R(0, 99), .4); for (let n = 0; n < 8; n++) { const a = R(0, 6.28); brush(fImg, x + Math.cos(a) * r * .6, y - r + Math.sin(a) * r * .5, 3 * K, K, [24, 64, 70], () => a + 1.6); } continue; } house(x, R(10, 17) * K, R(7, 11) * K, R(4, 7) * K); }
  { const y = house(cx - cw / 2, cw, 14 * K, 6 * K, true), h = 14 * K, tx = cx + cw / 2 - 3 * K, th = 14 * K, sp = 34 * K;   // the church: nave, a tower, a needle spire
    for (let j = 0; j < h + th; j++) for (let i = 0; i < 6 * K; i++) put(fImg, tx + i, y - j, i === 0 || i >= 6 * K - 1 ? OUT : WALLS[1][i < 2 * K ? 0 : 1]);
    rect4(fImg, tx + 2 * K, y - h - th + 3 * K, 2 * K, 3 * K, [250, 210, 90]); wins.push([tx + 2 * K, y - h - th + 3 * K]);
    for (let j = 0; j < sp; j++) { const hw = 3.5 * K * (1 - j / sp); for (let i = -hw; i <= hw; i++) put(fImg, tx + 3 * K + i, y - h - th - j, Math.abs(i) > hw - 1 ? OUT : ROOFS[0][i < 0 ? 0 : 1]); } }
  // olive trees in the near fields: crooked trunks, round crowns of short silver-green strokes, outlined
  for (const o of Array.from({length: 6}, () => { const x = R(0, GW) | 0; return {x, y: R(hills[x] + 24 * K, GH - 6 * K)}; }).filter(o => Math.abs(o.x - cyp) > 30 * K).sort((a, b) => a.y - b.y)) {
    const s = .6 + (o.y - hz) / (GH - hz) * .8, r = 9 * K * s;
    stroke(fImg, o.x, o.y, o.x + R(-2, 2) * K, o.y - 6 * K * s, 2.2 * K * s, OUT); stroke(fImg, o.x + K, o.y - 3 * K * s, o.x + 3 * K * s, o.y - 8 * K * s, 1.4 * K * s, [30, 26, 40]);
    blob(fImg, o.x, o.y - 6 * K * s - r * .6, r * 1.15, r * .8, [OUT, OUT, OUT], .5, .5, R(0, 99), .3);
    for (let n = 0; n < 40 * s; n++) { const a = R(0, 6.28), d = Math.sqrt(rnd()) * r * .9; brush(fImg, o.x + Math.cos(a) * d * 1.1, o.y - 6 * K * s - r * .6 + Math.sin(a) * d * .7, R(2, 4) * K, K, [[28, 64, 72], [44, 92, 96], [72, 124, 112], [120, 160, 140]][Math.min(3, Math.max(0, Math.round(1.5 - Math.sin(a) * 1.2 + R(-.8, .8))))], () => a + 1.4); } }
  // the cypress: a dark green flame of strokes curling upward, outlined in black
  const H = R(150, 175) * K, shape = [];
  for (let j = 0; j < H; j++) { const q = j / H; shape[j] = [cyp + Math.sin(j / (22 * K) + seed) * 4 * K * q, (Math.sin(q * Math.PI * .97) ** .65) * 17 * K * (1 - q * .25) * (.85 + .3 * fbm(j / (10 * K), seed, 2)) + 1]; }
  const CYP = ramp('#020806', '#06140c', '#0c2a18', '#16422a', '#265a36', '#4a6a2a');
  for (let j = 0; j < H; j++) { const [c, w] = shape[j]; for (let i = -w - K; i <= w + K; i++) put(nImg, c + i, GH - j, OUT); }
  for (let n = 0; n < H * 3; n++) { const j = R(0, H) | 0, [c, w] = shape[j], i = R(-w, w), sp = i / w; let x = c + i, y = GH - j; const col = CYP[Math.min(5, Math.max(0, Math.round(2.2 + sp * -1.3 + R(-1, 1.4))))];
    for (let s = 0; s < R(5, 11) * K; s++) { const jj = Math.max(0, Math.min(shape.length - 1, GH - y | 0)), [cc, ww] = shape[jj]; if (Math.abs(x - cc) > ww) break; const a = -Math.PI / 2 + Math.sin(jj / (8 * K) + sp * 2) * .6 + sp * .5; for (let k = 0; k < 1.5 * K; k++) put(nImg, x + k, y, col); x += Math.cos(a); y += Math.sin(a); } }
  // strokes of light drifting along the wind
  const motes = Array.from({length: 70}, () => ({x: R(0, GW), y: R(0, hz), tr: []}));
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    for (const s of stars) { const a = .2 + .15 * Math.sin(t / 600 + s.x); fxc.globalAlpha = a; fxc.fillStyle = '#fff4a0'; fxc.beginPath(); fxc.arc(s.x, s.y, s.r * (1.6 + .3 * Math.sin(t / 900 + s.y)), 0, 6.283); fxc.fill(); }
    for (const m of motes) { const a = flow(m.x, m.y); m.x += Math.cos(a) * .5; m.y += Math.sin(a) * .5; m.tr.push([m.x, m.y]); if (m.tr.length > 14) m.tr.shift(); if (m.x < 0 || m.x > GW || m.y < 0 || m.y > hz - 4 * K) { m.x = R(0, GW); m.y = R(0, hz); m.tr = []; }
      m.tr.forEach(([x, y], i) => fill(x, y, glow(m.x, m.y) > .4 ? '#fff0a0' : '#b8d8ff', i / m.tr.length * .35)); }
    for (const [x, y] of wins) if (Math.sin(t / 700 + x * 3) > .97) fill(x, y, '#0a1024');
  }};
}

/* Galion: a pirate galleon under a moon breaking through storm clouds with silver edges, a heavy swell with a road of moonlight on it; the ship with a high stern castle and lit windows, gunports, wales, a bowsprit and jibs, three masts of bellied square sails, rigging, a crow's nest, a black flag, a lantern at the stern; a bow wave and a wake, a big wave rolling in front, gulls, spray, lightning far off */
function galion(fImg, nImg) {
  const hz = Math.round(GH * .62), mx = R(.2, .8) * GW, my = hz * R(.36, .46);
  sky4(fImg, hz, ramp('#04060c', '#0a1224', '#142038', '#24304c', '#3e4a68', '#6a7088'), 0, 1);
  stars4(fImg, hz * .5, GW * GH / (1500 * K * K));
  clouds4(fImg, hz * .05, hz * .92, ramp('#06080e', '#10182a', '#202c42', '#3a4862', '#6a7898'), .5, 14 * K, R(0, 99), .8, .1, 3);
  sun4(fImg, mx, my, 15 * K, ramp('#b0b8c8', '#d0d8e4', '#eef2fa'), 26 * K, false);
  { const d = fImg.data; for (let y = 0; y < hz; y++) for (let x = 0; x < GW; x++) { const r = Math.hypot((x - mx) / 1.5, y - my) / (60 * K); if (r > 1) continue; const k = (y * GW + x) * 4, lum = d[k] + d[k + 1] + d[k + 2];   // clouds near the moon get silver edges
      if (lum > 90 && lum < 400 && bay(x, y) < (1 - r) * .8) put(fImg, x, y, [Math.min(255, d[k] * 1.5 + 30), Math.min(255, d[k + 1] * 1.5 + 34), Math.min(255, d[k + 2] * 1.4 + 40)]); } }
  // the sea: rows of swell growing toward us, faces catching the moon, a road of light under it
  const SEA = ramp('#02060e', '#040c1c', '#08162c', '#0e2644', '#1a3c60', '#3a6088', '#7a98b8', '#d8e8f4'), ss = R(0, 99);
  for (let y = hz; y < GH; y++) { const deep = (y - hz) / (GH - hz); for (let x = 0; x < GW; x++) {
    const n = fbm(x / (16 * K * (1 + deep * 3)) + ss, y / (3 * K * (1 + deep)), 3), ph = Math.sqrt((y - hz) / K) * 1.6 + n * 1.5, s = ph - Math.floor(ph), road = Math.exp(-(((x - mx) / ((10 + deep * 40) * K)) ** 2));
    const v = .12 + s * .3 - deep * .05 + (n - .5) * .25 + road * (s > .5 ? .5 : .2), crest = s > .9 && fbm(x / (3 * K * (1 + deep)), y / K + ss, 2) > .45;
    put(fImg, x, y, crest ? (road > .3 || bay(x, y) < .4 ? SEA[7] : SEA[5]) : dith(SEA, v, x, y)); } }
  // the galleon
  const bd = mx > GW / 2 ? 1 : -1, sx = (mx > GW / 2 ? R(.18, .32) : R(.68, .82)) * GW, wl = Math.round(hz + 22 * K), L = 112 * K, X = u => sx + bd * u * L / 2;
  const WOOD = ramp('#120a08', '#20120c', '#321c10', '#4a2c18', '#664024', '#8a5a34'), lit = [];
  const deck = u => wl - 13 * K - u * u * 3 * K - (u < -.5 ? 12 * K * Math.min(1, (-.5 - u) / .12) : 0) - (u > .62 ? 5 * K * Math.min(1, (u - .62) / .1) : 0);
  const keel = u => wl + 3 * K - Math.max(0, u - .65) / .35 * 10 * K;
  // a dark wobbling reflection under the hull
  for (let i = -L / 2; i < L / 2; i++) { const u = i / (L / 2) * bd, x = sx + i; for (let j = 0; j < 14 * K; j++) if (bay(x | 0, wl + j) < .5 * (1 - j / (14 * K))) put(fImg, x + Math.sin(j / 1.5) * K, wl + 2 * K + j, [6, 10, 20]); }
  for (let i = 0; i <= L; i++) { const u = i / L * 2 - 1, x = X(u), top = Math.round(deck(u)), bot = Math.round(keel(u)), stern = u < -.5;
    for (let y = top; y < bot; y++) { const r = y - top, fromW = bot - y; let c;
      if (r < K) c = WOOD[5];
      else if (fromW > 5 * K && fromW < 6.5 * K || fromW > 10 * K && fromW < 11.5 * K && !stern) c = WOOD[0];   // the wales
      else if (fromW >= 7.5 * K && fromW < 9.5 * K && u > -.45 && u < .6 && ((i / (6 * K)) | 0) % 2 && i % (6 * K) > 2 * K) c = [24, 10, 8];   // gunports
      else if (fromW >= 9.5 * K && fromW < 10 * K && u > -.45 && u < .6 && ((i / (6 * K)) | 0) % 2 && i % (6 * K) > 2 * K) c = [120, 30, 24];   // their red lids
      else if (u < -.6 && r > 2 * K && r < 9 * K && u > -.96 && (i % (4 * K)) > 1.2 * K && (r % (4 * K)) > K) { c = [255, 200, 100]; lit.push([x, y]); }   // stern castle windows
      else c = dith(WOOD, .55 - r / (bot - top) * .35 + (y % (2 * K) < 1 ? -.12 : 0) + (u * bd * (mx > sx ? 1 : -1) > 0 ? .1 : 0), x | 0, y);
      put(fImg, x, y, c); }
    if (i % (3 * K) === 0) for (let j = 1; j < 3 * K; j++) put(fImg, x, top - j, WOOD[4]);   // rail posts
    put(fImg, x, top - 3 * K, WOOD[4]); }
  // bowsprit and jib sails, masts, yards, bellied square sails lit on the moon's side, a crow's nest, rigging
  const line1 = (x0, y0, x1, y1, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) if (i % 3 !== 2) put(fImg, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
  const SAIL = ramp('#3a3438', '#5e5658', '#8a807c', '#b4aaa0', '#ddd2c4', '#f2eade'), ms = (mx - sx) * bd > 0 ? 1 : -1, ROPE = [40, 34, 38];
  const bx0 = X(.98), by0 = deck(.98), bx1 = X(1.35), by1 = by0 - 12 * K; stroke(fImg, bx0, by0, bx1, by1, 1.5 * K, WOOD[1]);
  const masts = [[.42, 82 * K], [.02, 96 * K], [-.42, 70 * K]].map(([u, h]) => ({x: X(u), b: deck(u), h}));
  const tri = (ax, ay, bx2, by2, cx2, cy2) => { const minY = Math.min(ay, by2, cy2), maxY = Math.max(ay, by2, cy2); for (let y = minY; y <= maxY; y++) for (let x = Math.min(ax, bx2, cx2); x <= Math.max(ax, bx2, cx2); x++) { const s1 = (bx2 - ax) * (y - ay) - (by2 - ay) * (x - ax), s2 = (cx2 - bx2) * (y - by2) - (cy2 - by2) * (x - bx2), s3 = (ax - cx2) * (y - cy2) - (ay - cy2) * (x - cx2); if ((s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0)) put(fImg, x, y, dith(SAIL, .45 + (y - minY) / (maxY - minY + 1) * .2 + ms * .1, x | 0, y | 0)); } };
  const fm = masts[0]; tri(fm.x, fm.b - fm.h * .55, bx1, by1, X(1.02), deck(1) - K); tri(fm.x + bd * 2 * K, fm.b - fm.h * .78, bx1 - bd * 4 * K, by1 + K, fm.x + bd * 8 * K, fm.b - fm.h * .56);
  for (const m of masts) {
    for (let j = 0; j < m.h; j++) for (let k = -.8 * K; k <= .8 * K; k++) put(fImg, m.x + k, m.b - j, j > m.h * .7 && k > 0 ? WOOD[2] : WOOD[1]);
    const n = m.h > 80 * K ? 3 : 2, sh = m.h * .9 / n;
    for (let s = 0; s < n; s++) { const top = m.b - m.h * .95 + s * sh, w = (34 - (n - 1 - s) * 7) * K * (m.h / (90 * K)) ** .5, h = sh * .88;
      for (let k = -w / 2 - K; k <= w / 2 + K; k++) put(fImg, m.x + k, top, WOOD[1]);   // the yard
      for (let j = 1; j < h; j++) { const q = j / h, bulge = Math.sin(q * Math.PI) * 3 * K, ww = w * (1 + Math.sin(q * Math.PI) * .06);
        for (let k = -ww / 2; k <= ww / 2; k++) { const a = k / (ww / 2), sh2 = .5 + a * ms * .28 + Math.sin(q * Math.PI) * .12 - (j > h - K ? .25 : 0);
          const px = Math.round(m.x + k + bd * bulge * .6); put(fImg, px, top + j, dith(SAIL, sh2 + (1 - a * a) * .08, px, top + j | 0)); } } }
    if (m.h > 90 * K) { for (let k = -3 * K; k <= 3 * K; k++) for (let j = 0; j < 3 * K; j++) put(fImg, m.x + k, m.b - m.h * .78 - j, j === 0 ? WOOD[4] : WOOD[2]); }   // the crow's nest
    for (const e of [-1, 1]) line1(m.x, m.b - m.h * .95, m.x + e * 9 * K, m.b, ROPE);   // shrouds
  }
  for (let i = 0; i < 2; i++) line1(masts[i].x, masts[i].b - masts[i].h, masts[i + 1].x, masts[i + 1].b - masts[i + 1].h * .6, ROPE);
  line1(fm.x, fm.b - fm.h, bx1, by1, ROPE);
  const sternX = X(-1) - bd * K, lamp = [sternX - bd * 2 * K, deck(-1) - 6 * K]; for (let j = 0; j < 4 * K; j++) for (let k = -1.5 * K; k <= 1.5 * K; k++) put(fImg, lamp[0] + k, lamp[1] + j, Math.abs(k) > K || j < K ? [30, 20, 10] : [255, 210, 110]);
  const flag = [masts[1].x, masts[1].b - masts[1].h - 1];
  // foam: a bow wave and a wake trailing behind
  for (let i = 0; i < 70 * K; i++) { const u = 1 - i / (L / 2) * .4, x = X(1) - bd * i * .9, w = Math.max(0, 1 - i / (70 * K)); for (let j = -2 * K; j < 3 * K; j++) if (bay(x | 0, wl + j) < w * .8 * (1 - Math.abs(j) / (3 * K))) put(fImg, x, wl + j, [210, 226, 240]); }
  for (let i = 0; i < 160 * K; i++) { const x = X(-1) - bd * i, sp = 2 * K + i * .1; if (x < 0 || x >= GW) break; for (let s of [-1, 1]) if (bay(x | 0, wl + 3 * K + s * sp | 0) < .5 * (1 - i / (160 * K))) put(fImg, x, wl + 3 * K + s * sp * .4, [150, 180, 210]); }
  // a big wave in front: dark translucent body, a curling lit crest, foam
  const crest = []; for (let x = 0; x < GW; x++) crest[x] = Math.round(GH * .86 + Math.sin(x / (40 * K) + ss) * 6 * K + fbm(x / (20 * K), 4, 3) * 10 * K);
  for (let x = 0; x < GW; x++) { for (let y = crest[x]; y < GH; y++) { const r = (y - crest[x]) / (14 * K); put(nImg, x, y, r < .25 && bay(x, y) < .5 ? [40, 80, 110] : dith(ramp('#02040a', '#040a18', '#081628', '#102640', '#1c3a58'), .55 - r * .4 + Math.exp(-(((x - mx) / (30 * K)) ** 2)) * .3, x, y)); }
    for (let j = 0; j < 2 * K; j++) if (fbm(x / (4 * K), ss, 2) > .35 || j === 0) put(nImg, x, crest[x] - j + K, j ? [230, 240, 250] : [150, 190, 220]);
    if (fbm(x / (6 * K), 9, 2) > .58) for (let j = 0; j < 6 * K; j++) if (bay(x, crest[x] + j) < .5 * (1 - j / (6 * K))) put(nImg, x, crest[x] + j, [190, 214, 234]); }
  const gulls = flock5(4, hz * .1, hz * .6, '#d0d4de'), spray = drift4(50, {colors: ['#ffffff', '#b8d4ec'], vy: -.2, vx: .1, sway: .3, alpha: .5});
  const glints = Array.from({length: 40}, () => ({x: mx + R(-30, 30) * K, y: R(hz + 2 * K, GH * .85), p: R(0, 6.28)}));
  twinkles = makeTwinkles(GW * hz / (6000 * K * K), hz * .3);
  let flash = 0;
  return {flares: false, shooters: false, draw: t => {
    for (const g of glints) { const a = Math.max(0, Math.sin(t / 300 + g.p)); if (a > .6) fill(g.x + (g.y - hz) * .3 * Math.sin(g.p), g.y, '#eef6ff', (a - .6) * 2); }
    gulls(t); spray(t);
    // the black flag waving at the main mast head, a pale skull on it
    for (let i = 0; i < 10 * K; i++) for (let j = 0; j < 6 * K; j++) { const wv = Math.sin(t / 220 - i / (2.5 * K)) * i * .12, sk = Math.hypot(i - 5 * K, j - 2.6 * K) < 1.4 * K || (Math.abs(Math.abs(i - 5 * K) - (j - 3 * K) * 1.2) < .8 && j > 4 * K); fill(flag[0] + bd * i, flag[1] + j + wv, sk ? '#e8e4dc' : '#101014'); }
    for (let k = 1; k < 8; k++) { fxc.globalAlpha = .16 / k * 2; fxc.fillStyle = '#ffd070'; fxc.fillRect(lamp[0] - k * K, lamp[1] + 2 * K - k * K + Math.sin(t / 400) * .5, 2 * k * K, 2 * k * K); }
    for (const [x, y] of lit) if (((x * 7 + y) | 0) % 23 === 0) fill(x, y, Math.sin(t / 300 + x) > .9 ? '#fff0c0' : '#ffc860', .5);
    if (rnd() < .002) flash = 1; flash *= .85; if (flash > .03) { fxc.globalAlpha = flash * .12; fxc.fillStyle = '#cfe0ff'; fxc.fillRect(0, 0, GW, GH); }
  }};
}

/* Fête foraine: a fairground at night under a sky warmed by its lights, fireworks; a big wheel on lattice legs with a double rim of chasing bulbs and hanging gondolas; a carousel with a striped scalloped canopy and horses rising and falling as it turns; a roller coaster on braced trestles; striped stalls full of prizes; lamp posts pooling light on the path; strings of bulbs, a crowd walking, balloons */
function foire(fImg, nImg) {
  const hz = Math.round(GH * .7), B = [[255, 70, 90], [255, 200, 60], [90, 220, 255], [150, 255, 120], [220, 120, 255]], gy = Math.round(GH * .84);
  sky4(fImg, hz, ramp('#04030e', '#0c0a24', '#1a1240', '#2a1c5a', '#44286e', '#6a3a80'), 0, 1);
  stars4(fImg, hz * .55, GW * GH / (500 * K * K));
  for (let y = hz - 70 * K; y < gy; y++) for (let x = 0; x < GW; x++) { const a = (y - (hz - 70 * K)) / (70 * K) * .5; if (bay(x, y) < a * a) put(fImg, x, y, [120, 60, 110]); }   // the sky warmed from below by the lights
  land4(fImg, hz, 14 * K, 80 * K, ramp('#06041a', '#0e0a28', '#161238'), .1, .8, {depth: 30 * K});
  const line1 = (img, x0, y0, x1, y1, c) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) put(img, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
  const wx = R(.56, .76) * GW | 0, wr = 60 * K, wy = gy - wr - 12 * K, cx = R(.08, .24) * GW | 0, cw = 66 * K;
  // the roller coaster behind: braced trestles under a two-rail track with ties and little lights
  const trk = x => gy - 44 * K - (Math.sin(x / (34 * K)) * 22 + Math.sin(x / (13 * K) + 1) * 8) * K * .8 - Math.max(0, 40 - Math.abs(x - GW * .42) / (4 * K)) * K * .4;
  const cs = R(.22, .4) * GW | 0, ce = Math.min(GW - 4, cs + 270 * K);
  for (let x = cs; x < ce; x += 8 * K) { const y = trk(x), y2 = trk(x + 8 * K); line1(fImg, x, y + 2 * K, x, gy, [48, 40, 82]); if (x + 8 * K < ce) for (let yy = Math.max(y, y2) + 2 * K; yy < gy - 8 * K; yy += 12 * K) { line1(fImg, x, yy, x + 8 * K, yy + 12 * K, [38, 32, 68]); line1(fImg, x + 8 * K, yy, x, yy + 12 * K, [38, 32, 68]); } }
  for (let x = cs; x < ce; x++) { const y = trk(x); put(fImg, x, y, [130, 116, 180]); put(fImg, x, y + 2 * K, [96, 86, 140]); if ((x - cs) % (2 * K) === 0) for (let j = 0; j <= 2 * K; j++) put(fImg, x, y + j, [70, 62, 110]); if ((x - cs) % (10 * K) === 0) put(fImg, x, y - K, B[((x - cs) / (10 * K) | 0) % 5]); }
  // the big wheel's legs: two lattice A-frames, a hub, a ticket booth at the foot
  for (const s of [-1, 1]) { const fx = wx + s * wr * .5; for (const o of [-2 * K, -1.5 * K, 1.5 * K, 2 * K]) line1(fImg, fx + o, gy, wx + o * .3, wy, [120, 110, 170]); for (let q = 0; q < 1; q += .08) { const ax = fx + (wx - fx) * q, ay = gy + (wy - gy) * q, bx = fx + (wx - fx) * (q + .08), by = gy + (wy - gy) * (q + .08); line1(fImg, ax - 1.5 * K, ay, bx + 1.5 * K * .3, by, [90, 82, 136]); } }
  for (let j = -4 * K; j <= 4 * K; j++) for (let i = -4 * K; i <= 4 * K; i++) if (i * i + j * j <= 16 * K * K) put(fImg, wx + i, wy + j, i * i + j * j < 4 * K * K ? [200, 190, 230] : [90, 80, 130]);
  { const bw = 16 * K, bh = 12 * K; for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) put(fImg, wx - bw / 2 + i, gy - j, j > bh - 2 * K ? [200, 40, 60] : i > 3 * K && i < bw - 3 * K && j > 3 * K && j < bh - 4 * K ? [255, 220, 140] : [40, 30, 70]); }
  // the carousel: a skirted platform, a central column, a cone canopy in red and cream wedges with a scalloped edge, a finial and pennant; a warm lit interior
  const eave = gy - 30 * K, ccx = cx + cw / 2;
  for (let y = eave; y < gy - 6 * K; y++) for (let x = cx + 2 * K; x < cx + cw - 2 * K; x++) put(fImg, x, y, dith(ramp('#2a1428', '#4a2234', '#7a3a3e', '#a85a48'), .2 + (y - eave) / (24 * K) * .6, x, y));
  for (let j = 0; j < 6 * K; j++) for (let i = 0; i < cw; i++) put(fImg, cx + i, gy - j, j < K || j > 5 * K ? [220, 180, 90] : ((i / (6 * K)) | 0) % 2 ? [150, 30, 50] : [40, 90, 140]);
  for (let i = 3 * K; i < cw; i += 6 * K) put(fImg, cx + i, gy - 3 * K, [255, 230, 150]);
  for (let j = 0; j < 24 * K; j++) for (let i = -2 * K; i <= 2 * K; i++) put(fImg, ccx + i, gy - 6 * K - j, i < 0 ? [200, 160, 80] : [150, 110, 50]);
  const ch = 20 * K; for (let j = 0; j < ch; j++) { const hw = (cw / 2 + 3 * K) * (j / ch) + 2 * K; for (let i = -hw; i <= hw; i++) { const wedge = Math.floor((i / hw) * 6 + 6) % 2; put(fImg, ccx + i, eave - ch + j, j > ch - K ? [220, 180, 90] : wedge ? [200, 36, 56] : [244, 230, 214]); } }
  for (let i = -cw / 2 - 3 * K; i < cw / 2 + 3 * K; i++) { const k = ((i + cw) / (5 * K)) % 1, d = Math.sqrt(Math.max(0, 1 - (2 * k - 1) ** 2)) * 2.5 * K; for (let j = 0; j < d; j++) put(fImg, ccx + i, eave + j, (Math.floor((i + cw) / (5 * K)) % 2) ? [200, 36, 56] : [244, 230, 214]); }
  for (let j = 0; j < 8 * K; j++) put(fImg, ccx, eave - ch - j, [220, 190, 110]); for (let i = 0; i < 6 * K; i++) for (let j = 0; j < 3 * K * (1 - i / (6 * K)); j++) put(fImg, ccx + 1 + i, eave - ch - 8 * K + j, [255, 80, 100]);
  // stalls: posts, a lit back wall, prizes hanging in a row, a counter, a striped awning with a scalloped hem, a sign board
  const stalls = [];
  for (let i = 0, x = 4 * K; x < GW - 34 * K; i++, x += R(44, 64) * K) { const w = R(30, 40) * K, h = 24 * K, c1 = B[i % 5]; if (Math.abs(x + w / 2 - wx) < wr * .7 || (x + w > cx - 6 * K && x < cx + cw + 6 * K)) continue;
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) put(fImg, x + k, gy - j, k < 1.5 * K || k > w - 1.5 * K ? [60, 40, 50] : j < 7 * K ? (j < K ? sh4(c1, .9) : sh4(c1, .45)) : [255 * .85 | 0, 200, 140].map((v, n) => v * (1 - (j - 7 * K) / h * .5) | 0));
    for (let p = 0; p < (w - 6 * K) / (4 * K); p++) { const px = x + 3.5 * K + p * 4 * K, py = gy - h + 9 * K, pc = B[(p + i) % 5]; for (let jj = 0; jj < 2 * K; jj++) put(fImg, px, py - jj, [80, 60, 60]); for (let a = -1.5 * K; a <= 1.5 * K; a++) for (let b = 0; b < 3 * K; b++) if (a * a / (2.4 * K * K) + (b - 1.5 * K) ** 2 / (2.4 * K * K) < 1) put(fImg, px + a, py + b, pc.map(v => v * .8 | 0)); }
    for (let j = 0; j < 7 * K; j++) for (let k = -2 * K; k < w + 2 * K; k++) put(fImg, x + k, gy - h - 2 * K + j * .8, ((k + 2 * K) / (4 * K) | 0) % 2 ? sh4(c1, .85) : [236, 230, 240]);
    for (let k = -2 * K; k < w + 2 * K; k++) { const q = ((k + 2 * K) / (4 * K)) % 1, d = Math.sqrt(Math.max(0, 1 - (2 * q - 1) ** 2)) * 1.8 * K; for (let j = 0; j < d; j++) put(fImg, x + k, gy - h + 3.6 * K + j, ((k + 2 * K) / (4 * K) | 0) % 2 ? sh4(c1, .85) : [236, 230, 240]); }
    for (let j = 0; j < 5 * K; j++) for (let k = w * .2; k < w * .8; k++) put(fImg, x + k, gy - h - 3 * K - j, j === 0 || j === 5 * K - 1 || k < w * .2 + 1 || k > w * .8 - 1 ? [255, 220, 120] : j > K && j < 4 * K && (k | 0) % 3 && bay(k | 0, j + i) < .55 ? sh4(c1, .95) : [50, 20, 50]);
    stalls.push([x + w / 2, gy - h + 6 * K, c1, x, w]); }
  // lamp posts with globes, pools of light on the ground
  const lamps = Array.from({length: 4}, (_, i) => (i + R(.2, .8)) / 4 * GW);
  for (let y = gy; y < GH; y++) for (let x = 0; x < GW; x++) { let l = 0; for (const lx of lamps) l += Math.exp(-(((x - lx) / (26 * K)) ** 2 + ((y - gy - 6 * K) / (8 * K)) ** 2)); for (const s of stalls) l += .6 * Math.exp(-(((x - s[0]) / (20 * K)) ** 2 + ((y - gy - 2 * K) / (6 * K)) ** 2)); put(nImg, x, y, dith(ramp('#0a0818', '#161230', '#241c48', '#4a3050', '#8a5a50', '#c08a60'), .2 + (y - gy) / (GH - gy) * .3 + Math.min(.6, l * .55), x, y)); }
  for (const lx of lamps) { for (let j = 0; j < 30 * K; j++) for (let i = -K * .6; i <= K * .6; i++) put(nImg, lx + i, gy + 4 * K - j, [30, 26, 40]); for (let j = -2.5 * K; j <= 2.5 * K; j++) for (let i = -2.5 * K; i <= 2.5 * K; i++) if (i * i + j * j <= 6.25 * K * K) put(nImg, lx + i, gy - 28 * K + j, i * i + j * j < 2 * K * K ? [255, 250, 220] : [255, 214, 140]); }
  // strings of bulbs
  const bulbs = []; const string = (x0, y0, x1, y1, sag) => { const n = Math.hypot(x1 - x0, y1 - y0) / (5 * K) | 0; let px = x0, py = y0; for (let i = 0; i <= n; i++) { const q = i / n, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q + Math.sin(q * Math.PI) * sag; line1(fImg, px, py, x, y, [20, 16, 32]); px = x; py = y; bulbs.push([x, y, B[i % 5]]); } };
  string(0, gy - 70 * K, wx - 20 * K, gy - 90 * K, 14 * K); string(cx + cw, eave - 10 * K, wx - wr * .6, gy - 40 * K, 10 * K); string(ccx, eave - ch - 4 * K, cx - 30 * K, gy - 20 * K, 6 * K); string(ccx, eave - ch - 4 * K, cx + cw + 30 * K, gy - 22 * K, 6 * K); string(wx + 20 * K, gy - 80 * K, GW, gy - 60 * K, 12 * K);
  const crowd = Array.from({length: 24}, () => ({x: R(0, GW), v: R(.08, .22) * (rnd() < .5 ? 1 : -1), h: R(10, 16) * K, kid: rnd() < .2, hat: rnd() < .25, p: R(0, 6), bal: rnd() < .25 ? B[rnd() * 5 | 0] : null, dy: R(4, 10) * K}));
  crowd.forEach(p => { if (p.kid) p.h *= .6; }); crowd.sort((a, b) => a.dy - b.dy);
  const balls = Array.from({length: 7}, () => ({x: R(0, GW), y: R(GH * .2, GH * .6), c: B[rnd() * 5 | 0], p: R(0, 6.28), v: R(.1, .25)}));
  const fw = []; let nextFw = 1500;
  twinkles = makeTwinkles(GW * hz / (2500 * K * K), hz * .5);
  const rgb = c => `rgb(${c})`;
  return {flares: false, shooters: false, draw: t => {
    // fireworks: a rocket rises, bursts into a ring of falling sparks
    if (t > nextFw) { nextFw = t + R(1800, 4200); const c = B[rnd() * 5 | 0], x = R(.1, .9) * GW, y = R(.12, .4) * hz; for (let i = 0; i < 46; i++) { const a = i / 46 * 6.283, v = R(.6, 1.1); fw.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c}); } }
    for (let i = fw.length - 1; i >= 0; i--) { const f = fw[i]; f.x += f.vx; f.y += f.vy; f.vy += .012; f.vx *= .985; f.life -= .012; if (f.life <= 0) { fw.splice(i, 1); continue; } fill(f.x, f.y, f.life > .7 ? '#fff' : rgb(f.c), f.life); fill(f.x - f.vx * 2, f.y - f.vy * 2, rgb(f.c), f.life * .4); }
    // the wheel: a double rim with bracing, spokes, chasing bulbs, gondolas hanging level
    const ang = t / 7000;
    for (let a = 0; a < 6.283; a += .006) { fill(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, '#a49ad0'); fill(wx + Math.cos(a) * wr * .86, wy + Math.sin(a) * wr * .86, '#7a70a8'); }
    for (let s = 0; s < 36; s++) { const a0 = ang + s / 36 * 6.283, a1 = ang + (s + 1) / 36 * 6.283, r0 = s % 2 ? wr : wr * .86, r1 = s % 2 ? wr * .86 : wr; for (let q = 0; q <= 1; q += .08) fill(wx + Math.cos(a0 + (a1 - a0) * q) * (r0 + (r1 - r0) * q), wy + Math.sin(a0 + (a1 - a0) * q) * (r0 + (r1 - r0) * q), '#6a60a0'); }
    for (let s = 0; s < 12; s++) { const a = ang + s * Math.PI / 6; for (let r = 4 * K; r < wr * .86; r += 1) fill(wx + Math.cos(a) * r, wy + Math.sin(a) * r, '#8278b4'); }
    for (let s = 0; s < 48; s++) { const a = ang + s / 48 * 6.283, on = ((t / 160 | 0) + s) % 6 < 2; fill(wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, on ? '#fff6c0' : rgb(B[s % 5]), on ? 1 : .6); }
    for (let s = 0; s < 12; s++) { const a = ang + s * Math.PI / 6, x = wx + Math.cos(a) * wr, y = wy + Math.sin(a) * wr, c = B[s % 5], sw = Math.sin(t / 700 + s) * .8;
      for (let j = 0; j < 3 * K; j++) fill(x + sw * j / (3 * K), y + j, '#9a90c8');
      const gx = x + sw, gyy = y + 3 * K; for (let i = -4 * K; i <= 4 * K; i++) { fill(gx + i, gyy, '#2a2040'); fill(gx + i * .8, gyy + 1, '#2a2040'); }
      for (let i = -3.5 * K; i <= 3.5 * K; i++) for (let j = 2; j < 5 * K; j++) fill(gx + i, gyy + j, j < 2.5 * K && Math.abs(i) < 2.5 * K ? '#ffe8a0' : rgb(c));
      fxc.globalAlpha = .12; fxc.fillStyle = rgb(c); fxc.beginPath(); fxc.arc(gx, gyy + 3 * K, 7 * K, 0, 6.283); fxc.fill(); }
    // the carousel's horses, on brass poles, rising and falling; those behind the column drawn darker first
    const hs = Array.from({length: 8}, (_, i) => { const th = t / 2600 + i / 8 * 6.283; return {i, th, x: ccx + Math.cos(th) * cw * .4, front: Math.sin(th)}; }).sort((a, b) => a.front - b.front);
    for (const h of hs) { const up = Math.sin(t / 380 + h.i * 1.3) * 2.5 * K, by = gy - 14 * K + up, dark = h.front < 0, d = -Math.sin(h.th) > 0 ? 1 : -1, col = dark ? '#7a6050' : ['#f4eee4', '#e8c070', '#f0a0b0', '#a0d0f0'][h.i % 4], P = (i, j, c) => { for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) fill(h.x + d * i * K + a, by + j * K + b, c); };
      for (let j = eave + 2 * K; j < gy - 6 * K; j++) fill(h.x, j, dark ? '#8a6a30' : '#e8c060');
      for (let i = -5; i <= 5; i++) for (let j = -2; j <= 1; j++) P(i, j, col);   // body
      for (let j = -6; j <= -2; j++) { P(4 + (j + 6) * -.3, j, col); P(5 + (j + 6) * -.3, j, col); } P(6, -6, col); P(7, -5, col); P(7, -6, col); if (!dark) P(5, -6, '#222');   // neck, head, one eye
      for (let j = -6; j <= -3; j++) P(3 + (j + 6) * -.3, j, dark ? '#4a3020' : '#c05040');   // mane
      const g = Math.sin(t / 380 + h.i * 1.3); P(-4, 2, col); P(-4 - g, 3, col); P(4, 2, col); P(4 + g, 3, col); P(-6, -1, dark ? '#4a3020' : '#c05040'); P(-7, 0, dark ? '#4a3020' : '#c05040');
      if (!dark) P(-1, -2, rgb(B[h.i % 5])); }
    for (let i = 0; i < bulbs.length; i++) { const [x, y, c] = bulbs[i], on = ((t / 380 | 0) + i) % 3 === 0; fxc.globalAlpha = on ? 1 : .35; fxc.fillStyle = rgb(c); fxc.fillRect(x - 1, y - 1, 3, 3); if (on) { fxc.globalAlpha = .18; fxc.fillRect(x - 4, y - 4, 9, 9); } }
    for (const [x, y, c, sx2, w] of stalls) { fxc.globalAlpha = .1 + .04 * Math.sin(t / 500 + x); fxc.fillStyle = rgb(c); fxc.fillRect(sx2 - 4 * K, y - 8 * K, w + 8 * K, 22 * K); for (let k = -2 * K; k < w + 2 * K; k += 4 * K) fill(sx2 + k + 2 * K, y - 8 * K, ((t / 300 | 0) + k) % 2 ? '#fff4c0' : '#806040'); }
    for (const lx of lamps) { fxc.globalAlpha = .14 + .03 * Math.sin(t / 800 + lx); fxc.fillStyle = '#ffd890'; fxc.beginPath(); fxc.arc(lx, gy - 28 * K, 8 * K, 0, 6.283); fxc.fill(); }
    const tx = cs + ((t * .09) % (ce - cs)); for (let k = 0; k < 4; k++) { const x = tx - k * 7 * K, y = trk(Math.max(cs, x)) - 3 * K; if (x < cs) continue; for (let i = 0; i < 5 * K; i++) for (let j = 0; j < 3 * K; j++) fill(x + i, y + j, k ? '#ff9a3c' : '#ff4a6a'); fill(x + K, y - 1, '#2a1a30'); fill(x + 3 * K, y - 1, '#2a1a30'); }
    // the crowd: walking silhouettes, heads and shoulders, legs swinging, children with balloons
    for (const p of crowd) { p.x += p.v; if (p.x > GW + 10) p.x = -10; if (p.x < -10) p.x = GW + 10; const y = gy + p.dy, C = '#0a0618', Q = (i, j, c = C) => { for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) fill(p.x + Math.round(i * K) + a, y - Math.round(j * K) - b, c); };
      const Hb = Math.round(p.h / K), L = Math.round(Hb * .42), T = Math.max(2, Math.round(Hb * .36)), st = Math.sin(p.x / 4 + p.p) * .9;
      for (let j = 0; j < L; j++) { const o = st * (1 - j / L); Q(o, j); Q(1 - o, j); }
      for (let j = L; j < L + T; j++) for (let i = -.5; i <= 1.5; i++) Q(i, j);
      Q(0, L + T); Q(1, L + T); Q(0, L + T + 1); Q(1, L + T + 1); if (p.hat) for (let i = -.5; i <= 1.5; i++) Q(i, L + T + 2);
      if (p.bal) { for (let k = 0; k < 12; k++) Q(2, L + T - 1 + k * .5, '#9a90c8'); for (let i = -1; i <= 1; i++) for (let j = 0; j < 4; j++) if (i * i / 2 + (j - 1.5) ** 2 / 3 <= 1) Q(2 + i, L + T + 6 + j, i < 0 && j > 2 ? '#fff' : rgb(p.bal)); } }
    for (const b of balls) { b.y -= b.v; b.x += Math.sin(t / 1500 + b.p) * .2; if (b.y < -20) b.y = GH + 10; for (let i = -4; i <= 4; i++) for (let j = -5; j <= 5; j++) if (i * i / 16 + j * j / 25 <= 1) fill(b.x + i, b.y + j, i < -1 && j < -1 ? '#fff' : rgb(b.c), .9); for (let k = 0; k < 14; k++) fill(b.x + Math.sin(k / 3 + t / 300), b.y + 6 + k, '#ccd'); }
  }};
}

/* Trou noir: an accretion disc bending the stars behind it, a lone ship, a nebula */
function trounoir(fImg, nImg) {
  const cx = R(.4, .6) * GW, cy = GH * R(.4, .5), r = 28 * K;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, dith(ramp('#01000a', '#050218', '#0c0630', '#180a48'), .25 * fbm(x / (80 * K), y / (50 * K), 4) * 2.2, x, y));
  clouds4(fImg, 0, GH, ramp('#08021a', '#2a0a4a', '#5a1a6a', '#8a2a78'), .55, 40 * K, R(0, 99), .5, .1, 1.5);
  stars4(fImg, GH, GW * GH / (200 * K * K));
  // gravitational lensing: stars near the hole are pulled outwards (we shift the already drawn pixels radially)
  const d = fImg.data, src = new Uint8ClampedArray(d);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const dx = x - cx, dy = y - cy, dd = Math.hypot(dx, dy); if (dd < r * 3.2 && dd > 1) { const f = Math.max(0, 1 - (r * r) / (dd * dd) * 1.0) ** .5, sx = Math.round(cx + dx * f * .0 + dx / dd * Math.sqrt(Math.max(0, dd * dd - r * r))), sy = Math.round(cy + dy / dd * Math.sqrt(Math.max(0, dd * dd - r * r))), k = (Math.min(GH - 1, Math.max(0, sy)) * GW + Math.min(GW - 1, Math.max(0, sx))) * 4, o = (y * GW + x) * 4; d[o] = src[k]; d[o + 1] = src[k + 1]; d[o + 2] = src[k + 2]; } }
  const DISC = ramp('#4a0a08', '#9a2a0a', '#e05a14', '#ff9a2a', '#ffd870', '#fff6d0');
  const disc = (img, back) => { for (let y = -r * 2; y < r * 2; y++) for (let x = -r * 4; x < r * 4; x++) { const sy = y * 4.2, rr = Math.hypot(x, sy); let ok = rr > r * 1.15 && rr < r * 3.6; if (!ok) continue; const front = y > 0, a = Math.atan2(sy, x); if (back ? front : !front) continue; const t = (rr - r * 1.15) / (r * 2.45), v = (1 - t) ** 1.3 * (.7 + .3 * fbm(a * 3 + rr / (5 * K), rr / (6 * K), 3)) * (.55 + .45 * Math.cos(a - .5)); if (BAYER[((cy + y | 0) & 3) * 4 + ((cx + x | 0) & 3)] < Math.min(1, v * 1.6)) put(img, cx + x, cy + y, dith(DISC, v + .15, cx + x | 0, cy + y | 0)); } };
  disc(fImg, true);
  disc4(fImg, cx, cy, r, [0, 0, 0]);
  for (let a = 0; a < 6.28; a += .01) for (let k = 0; k < 3; k++) put(fImg, cx + Math.cos(a) * (r + k), cy + Math.sin(a) * (r + k), [255, 220 - k * 40, 140 - k * 30]);   // the photon ring
  disc(fImg, false);
  twinkles = makeTwinkles(GW * GH / (1500 * K * K), GH);
  const ship = {x: -20, y: GH * R(.7, .85)};
  return {flares: false, shooters: true, draw: t => { ship.x += .35; if (ship.x > GW + 20) { ship.x = -20; ship.y = GH * R(.7, .85); } for (let i = 0; i < 9; i++) fill(ship.x + i, ship.y - (i < 3 ? i : i > 6 ? 9 - i : 3) * .8, '#c8d0e0'); for (let i = 1; i < 14; i++) fill(ship.x - i, ship.y - 1, '#6ac8ff', 1 - i / 14); fill(ship.x + 8, ship.y - 1, '#fff'); for (let k = 1; k < 8; k++) { fxc.globalAlpha = .05; fxc.fillStyle = '#ff9a40'; fxc.fillRect(cx - r * 3 - k * 3, cy + r * .3, r * 6 + k * 6, 1); } }};
}

/* Bambouseraie: a gravel path running straight into a bamboo grove, the stalks walling it on both sides and leaning in overhead like a tunnel, a woven brushwood fence along each edge, a stone lantern, the light at the far end; sunbeams, falling leaves, motes */
function bambou(fImg, nImg) {
  const vpx = GW * R(.42, .58), vy = GH * .52, U = GW * .5, HG = GH - vy, side = rnd() < .5 ? -1 : 1;
  const FOG = [214, 236, 170], zb = new Float32Array(GW * GH).fill(1e9);
  // everything is placed in depth: a pixel is only drawn if it is nearer than what is already there
  const P = (x, y, c, z) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= GW || y >= GH) return; const i = y * GW + x; if (z >= zb[i]) return; zb[i] = z; put(fImg, x, y, c); };
  const fogR = (rp, Z) => { const a = Math.round(Math.min(.9, Math.max(0, 1 - Math.exp(-(Z - .6) / 5))) * 12) / 12; return rp.map(c => c.map((v, i) => Math.round(v + (FOG[i] - v) * a))); };
  // the light at the end of the path
  const BG = ramp('#1e4a24', '#3a7a34', '#6aa84a', '#a6d270', '#e0f2b0', '#fffce8');
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, dith(BG, 1.05 - Math.hypot((x - vpx) / GW, (y - vy * .8) / GH * 1.3) * 1.6 + (fbm(x / (40 * K), y / (40 * K), 3) - .5) * .25, x, y));
  // the ground: a pale gravel path with patches of sun, dark leaf litter on either side
  const PATH = ramp('#5a5644', '#7a745c', '#9c9478', '#beb696', '#ded6b6', '#f4eed4'), SOIL = ramp('#10200c', '#1c3414', '#2c4a1c', '#40622a', '#5a7c38');
  for (let y = Math.ceil(vy) + 1; y < GH; y++) { const s = (y - vy) / HG, Z = 1 / s, pr = fogR(PATH, Z), sr = fogR(SOIL, Z);
    for (let x = 0; x < GW; x++) { const X = (x - vpx) / (U * s), ax = Math.abs(X);
      if (ax < .26) P(x, y, dith(pr, .5 + (fbm(X * 25, Z * 5, 2) - .5) * .6 + (fbm(X * 3 + 9, Z * .8, 3) > .58 ? .15 : -.05) - (ax > .23 ? .2 : 0), x, y), Z);
      else P(x, y, dith(sr, .45 + (fbm(X * 12, Z * 4, 2) - .5) * .8 - (ax < .3 ? 0 : .15), x, y), Z); } }
  // one lance-shaped leaf: widest near its base, a dark midrib
  const LF = ramp('#06200c', '#103c16', '#226222', '#3e8a32', '#78b850');
  const leaf = (x, y, a, L, wd, lr, z) => { for (let k = 0; k < L; k++) { const f = k / L, hw = wd * (f < .25 ? f / .25 : (1 - f) / .75) ** .8, px = x + Math.cos(a) * k, py = y + Math.sin(a) * k;
    for (let t = -hw; t <= hw; t += .7) { const qx = px - Math.sin(a) * t, qy = py + Math.cos(a) * t; P(qx, qy, Math.abs(t) < .6 && f > .1 && f < .8 ? lr[0] : dith(lr, (t < 0 ? .8 : .5) + (1 - f) * .15, qx | 0, qy | 0), z); } } };
  // the stalks: rows receding on both sides, round and lit from the path, nodes at their own rhythm, leaning in overhead, leaves hanging from their tops
  const STK = ramp('#03140a', '#082a12', '#10461a', '#1c6a26', '#34903a', '#6abc56', '#b4e08a'), stalks = [];
  for (const sd of [-1, 1]) for (let Z = .55; Z < 18; Z *= 1.07) for (let n = 0; n < 5; n++) stalks.push({X: sd * (.36 + (n ? R(0, 4) : R(0, .25))), Z: Z * R(.97, 1.05)});
  for (const st of stalks) { const s = 1 / st.Z, gx = vpx + st.X * U * s, gy = vy + HG * s, w = Math.max(1, Math.round(.022 * U * s * R(.8, 1.2))), lean = -Math.sign(st.X) * R(.03, .1) * U * Math.min(1, s);
    if (gx < -w - Math.abs(lean) - 10 || gx > GW + Math.abs(lean) + 10) continue;
    const rp = fogR(STK, st.Z), lr = fogR(LF, st.Z), sp = 32 * s * R(.85, 1.15), off = R(0, sp), hl = st.X < 0 ? .7 : .3, at = y => gx + lean * ((gy - y) / GH) ** 2;
    for (let y = Math.min(GH - 1, gy | 0); y >= 0; y--) { const x = at(y), m = (gy - y + off) % sp, node = m < Math.max(1, sp * .06), ridge = !node && m < sp * .12;
      for (let i = node ? -1 : 0; i < w + (node && w > 2 ? 1 : 0); i++) { const u = (i + .5) / w; P(x + i - w / 2, y, node ? rp[1] : ridge ? rp[4] : dith(rp, Math.max(0, 1 - Math.abs(u - hl) * 1.9) * .7 + .12 + (w > 3 && (i <= 0 || i >= w - 1) ? -.25 : 0), x + i | 0, y), st.Z); } }
    const L0 = .05 * U * s; if (L0 < 2.5) continue;
    for (let n = 3 + (s > .5 ? 3 : 0); n > 0; n--) { const y0 = gy - R(.9, 3) * U * s; if (y0 < -L0) continue; const dir = rnd() < .7 ? -Math.sign(st.X) : Math.sign(st.X), x0 = at(y0) + dir * w / 2, tx = x0 + dir * .04 * U * s, ty = y0 + R(-.3, .5) * L0 * .4;
      for (let k = 0; k <= 8; k++) P(x0 + (tx - x0) * k / 8, y0 + (ty - y0) * k / 8, rp[1], st.Z);
      for (let l = R(4, 8) | 0; l > 0; l--) { const t = R(.3, 1), a = R(.3, 1.3); leaf(x0 + (tx - x0) * t, y0 + (ty - y0) * t, dir > 0 ? a : Math.PI - a, L0 * R(.8, 1.2), L0 * .13, lr, st.Z); } } }
  // a low fence of woven brushwood along each edge of the path, bound by two bamboo poles, a pole along its top
  const FEN = ramp('#3a2a14', '#5a4220', '#7a5c2e', '#9a7a40', '#bc9c5a', '#d8bc7c'), POLE = ramp('#2a3a14', '#4a6024', '#6e8a36', '#9ab44e'), XF = .3, FH = .17;
  for (const sd of [-1, 1]) for (let x = 0; x < GW; x++) { const s = (x - vpx) * sd / (XF * U); if (s < 1 / 18) continue; const Z = 1 / s, gy = vy + HG * s, top = gy - FH * U * s, fr = fogR(FEN, Z), pr = fogR(POLE, Z);
    for (let y = Math.max(0, top | 0); y <= Math.min(GH - 1, gy); y++) { const f = (gy - y) / (gy - top);
      P(x, y, f > .93 ? dith(pr, f > .97 ? .9 : .55, x, y) : Math.abs(f - .3) < .03 || Math.abs(f - .7) < .03 ? pr[1] : dith(fr, .35 + (fbm(x / 1.3, y / (8 * s + 2), 2) - .5) * 1.2 + f * .2, x, y), Z - .001); } }
  // a stone lantern on the edge of the path, a warm light in its window, moss on its ledges
  { const X = side * .2, Z = R(1.4, 1.8), s = 1 / Z, gx = vpx + X * U * s, gy = vy + HG * s, u = U * s, ST = fogR(ramp('#2a2c28', '#464a42', '#686c60', '#8c9080', '#b0b4a0'), Z), MOSS = fogR(ramp('#2a4a1a', '#4a7a2a'), Z);
    const box = (w, y0, h, v, top = w) => { for (let y = 0; y < h * u; y++) { const ww = (w + (top - w) * y / (h * u)) * u; for (let i = -ww / 2; i < ww / 2; i++) { const px = gx + i, py = gy - y0 * u - y; P(px, py, y >= h * u - 1.5 && bay(px | 0, py | 0) < .4 ? MOSS[1] : dith(ST, v - i / ww * side * .6, px | 0, py | 0), Z); } } };
    box(.09, 0, .025, .45); box(.035, .025, .1, .5); box(.1, .125, .02, .55); box(.065, .145, .055, .45); box(.16, .2, .035, .55, .05); box(.025, .235, .03, .6, .012);
    for (let y = 0; y < .028 * u; y++) for (let i = -.016 * u; i < .016 * u; i++) P(gx + i, gy - .158 * u - y, y < .01 * u ? [255, 236, 170] : [250, 196, 96], Z - .01); }
  const rays = Array.from({length: 7}, () => { const x = vpx + R(-.35, .35) * GW; return {x, s: (x - vpx) / GW * 1.2, w: R(8, 20) * K}; });
  const leaves = drift4(30, {colors: ['#a8e070', '#5ab04a', '#e8f0a0'], vy: .3, vx: -.15, sway: .8, size: 2}), flies = drift4(16, {colors: ['#ffffc0'], vy: -.04, sway: .4, alpha: .7});
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    for (const r of rays) { fxc.fillStyle = '#fff6c0'; for (let y = 0; y < GH; y += 2) { fxc.globalAlpha = .05 * (1 - y / GH) * (.7 + .3 * Math.sin(t / 2500 + r.x)); fxc.fillRect(r.x + y * r.s, y, r.w * (1 + y / GH), 2); } }
    fxc.globalAlpha = .08 + .03 * Math.sin(t / 1800); fxc.fillStyle = '#f4ffd0'; fxc.beginPath(); fxc.ellipse(vpx, vy, GW * .12, GH * .05, 0, 0, 6.283); fxc.fill();
    leaves(t); flies(t);
  }};
}

/* Lilas: a garden at golden hour, the low sun behind a line of trees: glare and long shadows coming toward us, grass tips and leaf edges lit from behind; tall lilac shrubs with grey stems, leafy clumps and plumes made of little bunches of florets; a black labrador shaped from soft blended forms (a sheen of sky on his coat, gold along the edges facing the sun) who runs after his tennis ball, brings it back, bows to play */
function lilas(fImg, nImg) {
  const sunR = rnd() < .5, sx = (sunR ? R(.58, .7) : R(.3, .42)) * GW, hz = Math.round(GH * .58), sy = hz - R(17, 25) * K;
  const HAZE = [255, 228, 194];
  const hash = (x, y) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
  // long ramps and a grain dither instead of the grid: soft like a painting, still made of pixels
  const grad = (n, ...hex) => { const c = ramp(...hex); return Array.from({length: n}, (_, i) => { const f = i / (n - 1) * (c.length - 1), j = Math.min(c.length - 2, f | 0); return mix4(c[j], c[j + 1], f - j); }); };
  const dn = (rp, v, x, y) => rp[Math.min(rp.length - 1, Math.floor(clamp(v) * (rp.length - 1) + hash(x, y)))];
  // the evening sky, golden around the sun, thin clouds lit from underneath
  const SKY = grad(20, '#7a8ec2', '#9ea4cf', '#c4aecf', '#e4bec2', '#f6ceae', '#ffdeb0', '#ffecc8', '#fff8e8');
  for (let y = 0; y < hz + 24 * K; y++) for (let x = 0; x < GW; x++) { const d = Math.hypot((x - sx) / GW, (y - sy) / GH * 1.6); put(fImg, x, y, dn(SKY, .12 + y / hz * .42 + Math.max(0, .5 - d) * 1.1, x, y)); }
  clouds4(fImg, GH * .05, GH * .4, grad(8, '#a898b8', '#c8a8bc', '#e8bcb8', '#ffd4b0', '#ffe8c4'), .63, 22 * K, R(0, 99), .3, .95, 7);
  sun4(fImg, sx, sy, 11, ramp('#fff0c8', '#fff6dc', '#fffbee', '#ffffff'), 0, true);
  // a line of trees, the far ones lost in the haze, the near ones dark against the light with a bright edge on the sun side
  const TREE = grad(14, '#18241c', '#202e22', '#2a3a28', '#36482e', '#445834', '#566a3a', '#6c7e42', '#88944c', '#a8a85a', '#cab870', '#e8d090');
  const crown = (cx, cy, rx, ry, fogA) => { const seed = R(0, 99), toward = Math.sign(sx - cx) || 1;
    const inside = (x, y) => Math.hypot((x - cx) / rx, (y - cy) / ry) < .8 + (fbm(x / (rx * .3) + seed, y / (ry * .3), 3) - .5) * .7;
    for (let y = Math.floor(cy - ry * 1.2); y < cy + ry * 1.2; y++) for (let x = Math.floor(cx - rx * 1.2); x < cx + rx * 1.2; x++) { if (!inside(x, y)) continue;
      const rim = inside(x + toward * 2, y) ? 0 : 1, clump = fbm(x / (rx * .18) + seed * 2, y / (ry * .18), 2);
      put(fImg, x, y, mix4(dn(TREE, .16 + clump * .32 - (y - cy) / ry * .08 + rim * .3, x, y), HAZE, fogA)); } };
  const trunk = (x, y0, w, fogA) => { for (let y = y0; y < hz + 2; y++) for (let i = 0; i < w; i++) put(fImg, x + i, y, mix4([46, 40, 38], HAZE, fogA)); };
  for (let x = -10 * K; x < GW + 10 * K; x += R(9, 16) * K) crown(x, hz - R(10, 18) * K, R(10, 15) * K, R(9, 13) * K, .52);
  for (let x = R(-10, 10) * K; x < GW + 10 * K; x += R(22, 40) * K) { if (Math.abs(x - sx) < 24 * K) continue; const pop = rnd() < .25, ry = pop ? R(22, 28) * K : R(13, 18) * K, cy = hz - (pop ? 30 : R(17, 25)) * K;
    trunk(x, cy + ry * .5, 2, .3); crown(x, cy, pop ? R(5, 7) * K : R(14, 20) * K, ry, .3); }
  for (let x = 0; x < GW + 8 * K; x += R(5, 9) * K) crown(x, hz - R(0, 2) * K, R(6, 10) * K, R(4, 6) * K, .2);
  // the glare of the sun spilling over the leaves
  { const d = fImg.data; for (let y = 0; y < hz + 20 * K; y++) for (let x = 0; x < GW; x++) { const a = .62 * Math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / (32 * K) ** 2); if (a < .02) continue; const k = (y * GW + x) * 4; put(fImg, x, y, mix4([d[k], d[k + 1], d[k + 2]], [255, 242, 212], Math.min(1, a + (hash(x, y) - .5) * .08))); } }
  // the far lilacs at the edge of the lawn; they cast long shadows toward us
  const casters = [], MAUVE = grad(14, '#2e1a3c', '#46284f', '#5e3a68', '#785084', '#9068a0', '#a882b8', '#be9ccc', '#d2b6dc', '#e4cee8', '#f2e4f2', '#fcf4fa'),
    PURPLE = grad(14, '#24102c', '#3a1a46', '#52265e', '#6c3678', '#864a92', '#9e62aa', '#b67ec0', '#cc9cd2', '#e0bce2', '#f0daf0'), WHITE = grad(14, '#5e5866', '#7a7482', '#98929e', '#b4aeb8', '#ccc6cc', '#e0dade', '#eee8e8', '#f8f4ee', '#fffdf8');
  const LAWN = grad(18, '#1d3214', '#294618', '#36591d', '#466e22', '#588429', '#6e9a32', '#88ae3e', '#a4c04e', '#c2d066', '#dcd888', '#f2e4b0');
  const shadowAt = (x, y) => { let s = y < hz + (4 + 4 * fbm(x / (18 * K), 1, 2)) * K ? .8 : 0;
    for (const c of casters) { const dy = y - c.y; if (dy < -2) continue; const len = 70 * K, ax = c.x + (c.x - sx) / Math.max(8, c.y - sy) * dy, hw = c.w * (.8 + dy / len * .5) * (1 - (dy / len) ** 2); if (dy < len && Math.abs(x - ax) < hw + (fbm(x / (6 * K), y / (3 * K), 2) - .5) * 6 * K) s = Math.max(s, .75 * (1 - dy / len * .5)); }
    return s; };
  const far = Array.from({length: 4}, (_, i) => ({x: (.12 + i * .25 + R(-.06, .06)) * GW, y: hz + R(3, 8) * K, w: R(14, 21) * K}));
  casters.push(...far);
  // the lawn, in perspective: broad patches far away, single tufts up close, glowing where it faces the sun, in the shadows the cool of the evening
  for (let y = hz; y < GH; y++) { const q = (y - hz) / (GH - hz), z = 1 / (q + .08);
    for (let x = 0; x < GW; x++) { const u = (x - GW / 2) / z / K, sh = shadowAt(x, y), gl = Math.exp(-(((x - sx) / (GW * .3)) ** 2)) * (1 - q) * (1 - sh);
      let c = dn(LAWN, .5 + (fbm(u * .06, z * .8, 3) - .5) * .45 + (fbm(u * .5 + 9, z * 5, 2) - .5) * .3 * q + gl * .35 - sh * .28, x, y);
      if (sh > .1) c = mix4(c, [40, 52, 72], sh * .18);
      put(fImg, x, y, mix4(c, HAZE, (1 - q) ** 5 * .5)); } }
  // one heart-shaped leaf; glow is how much sun shines through it
  const LEAF = grad(12, '#0c1e0e', '#14301a', '#1e4220', '#2a5626', '#386c2c', '#4a8232', '#5e9638', '#78aa40', '#98c04c', '#bcd660', '#dcea86');
  const leaf = (img, x, y, ang, L, W, glow, dark, haze) => { const ax = Math.cos(ang), ay = Math.sin(ang);
    for (let t = 0; t < L; t++) { const f = t / L, hw = W * (f < .35 ? Math.sqrt(f / .35) : (1 - f) / .65) ** .9;
      for (let s = -hw; s <= hw; s += .6) { const qx = x + ax * t - ay * s, qy = y + ay * t + ax * s;
        const v = .3 - dark + glow * (.45 + (1 - Math.abs(s) / (hw + .01)) * .15) + (s < 0 ? .08 : -.04) + (1 - f) * .05 - (Math.abs(s) < .5 && f > .12 && f < .85 ? .1 : 0);
        const c = dn(LEAF, v, qx | 0, qy | 0); put(img, qx, qy, haze ? mix4(c, HAZE, haze) : c); } } };
  // one plume: a cone of little rounded clusters stacked up a stem that bends a little; each cluster is a lump of four-petal florets, shaded as a volume (the side toward the sun bright, a pale glow on its sunlit edge)
  const plume = (img, x, y, h, w, ang, rp, haze) => {
    const bend = R(-.35, .35), ax = Math.cos(ang), ay = Math.sin(ang), px = -ay, py = ax, SL = Math.hypot(sx - x, sy - y) || 1, lx = (sx - x) / SL, ly = (sy - y) / SL;
    const at = t => [x + ax * t * h + px * bend * h * t * t * .4, y + ay * t * h + py * bend * h * t * t * .4];
    const prof = t => Math.sin(Math.min(1, (1 - t) * 1.5) * Math.PI / 2) * (t < .1 ? .7 + t * 3 : 1);   // t: 0 at the stem, 1 at the tip
    const col = (v, X, Y) => { const c = dn(rp, v, X, Y); return haze ? mix4(c, HAZE, haze) : c; };
    const sz = Math.max(.55, w / 13), lumps = [];
    for (let t = 0; t < .97; t += 1.7 * sz / h + .015) { const hw = prof(t) * w / 2, n = Math.max(1, Math.round(hw / (2.2 * sz))); for (let k = 0; k < n; k++) { const s = n === 1 ? R(-.2, .2) : -1 + 2 * k / (n - 1) + R(-.15, .15), r = Math.max(1.2, Math.min(hw / n * 1.1 + .4, 2.6 * sz));
      lumps.push({t: t + R(-.02, .02), s: Math.max(-1, Math.min(1, s)) * .85, r, z: Math.sqrt(Math.max(0, 1 - s * s * .72)) + R(-.1, .1)}); } }
    lumps.sort((a, b) => a.z - b.z);
    for (const L of lumps) { const [cx, cy] = at(L.t), hw = prof(L.t) * w / 2, bx = cx + px * L.s * hw, by = cy + py * L.s * hw, gx = px * L.s, gy = py * L.s;
      for (let j = -L.r - 1; j <= L.r + 1; j++) for (let i = -L.r - 1; i <= L.r + 1; i++) { const q = (i * i + j * j) / (L.r * L.r); if (q > 1.25) continue; const X = bx + i, Y = by + j;
        if (q > 1) { if (j > 0 && hash(X, Y) < .5) put(img, X, Y, col(.12, X | 0, Y | 0)); continue; }   // a little shade under each cluster
        const nz = Math.sqrt(1 - q), nx = i / L.r * .7 + gx * .5, ny = j / L.r * .7 + gy * .5, lit = nx * lx + ny * ly, v = .3 + lit * .3 + nz * .16 + L.z * .12 + (L.t > .85 ? .06 : 0);
        put(img, X, Y, col(v - .14, X | 0, Y | 0)); }
      // the florets on its face: four petals around a pale eye
      for (let f = Math.max(2, L.r * L.r * .7 | 0); f > 0; f--) { const a = R(0, 6.283), dd = Math.sqrt(rnd()) * L.r * .85, i = Math.cos(a) * dd, j = Math.sin(a) * dd, X = bx + i, Y = by + j, nz = Math.sqrt(Math.max(0, 1 - (dd / L.r) ** 2)), lit = (i / L.r * .7 + gx * .5) * lx + (j / L.r * .7 + gy * .5) * ly;
        const v = .36 + lit * .32 + nz * .16 + L.z * .12 + R(-.06, .06), glow = lit > .35 && L.z < .75; let c = col(v, X | 0, Y | 0), hi = col(v + .16, X | 0, Y | 0); if (glow) { c = mix4(c, [255, 222, 206], .3); hi = mix4(hi, [255, 240, 222], .4); }
        if (sz > .8) { put(img, X - 1, Y, c); put(img, X + 1, Y, c); put(img, X, Y - 1, c); put(img, X, Y + 1, c); }
        put(img, X, Y, rnd() < .18 ? mix4(hi, [255, 246, 214], .5) : hi); } } };
  // a lilac shrub: grey stems fanning from the ground, leafy clumps over a dome (far ones first), plumes rising from each clump
  const lilac = (img, bx, by, H, W, rp, size, haze) => {
    const cx = bx, cy = by - H * .55, lit = sx > bx ? 1 : -1;
    for (let i = 0; i < 7; i++) { const tx = cx + R(-.7, .7) * W, ty = cy + R(-.2, .5) * H * .4, x0 = bx + R(-.12, .12) * W;
      for (let k = 0; k <= 1; k += .5 / H) { const x = x0 + (tx - x0) * k + Math.sin(k * 6 + i) * 2 * size, y = by + (ty - by) * k, w = (3.4 - k * 2.4) * size * K * .7;
        for (let s = -w; s <= w; s += .6) put(img, x + s, y, mix4(s * lit > w * .3 ? [120, 106, 98] : hash(x | 0, y | 0) < .2 ? [84, 74, 68] : [58, 50, 48], HAZE, haze)); } }
    const LF = haze ? LEAF.map(c => mix4(c, HAZE, haze)) : LEAF;
    const cl = Array.from({length: Math.round(8 + size * 7)}, () => { const a = R(-Math.PI, 0), d = Math.sqrt(R(.12, 1)); return {x: cx + Math.cos(a) * W * d * .85, y: cy + Math.sin(a) * H * .45 * d + R(0, H * .42), r: R(.22, .34) * W, z: rnd()}; }).concat(Array.from({length: 3}, () => ({x: cx + R(-.6, .6) * W, y: by - H * R(.06, .22), r: R(.24, .34) * W, z: R(.5, 1)}))).sort((a, b) => a.z - b.z);
    for (const c of cl) {
      blob(img, c.x, c.y, c.r, c.r * .8, LF, .02, .22, R(0, 99), .35);
      for (let k = c.r * c.r * .09 / (size * size); k > 0; k--) { const a = R(0, 6.283), dd = Math.sqrt(rnd()), lx = c.x + Math.cos(a) * c.r * dd, ly = c.y + Math.sin(a) * c.r * .8 * dd;
        const sunward = (sx - lx) * Math.cos(a) + (sy - ly) * Math.sin(a) > 0, glow = dd > .6 && sunward ? R(.3, .75) : 0;
        leaf(img, lx, ly, a + R(-.7, .7), R(7, 12) * size, R(2.6, 3.8) * size, glow, (1 - dd) * .12 + (ly - c.y) / c.r * .08, haze); }
      for (let k = R(4, 8) | 0; k > 0; k--) { const a = R(-3.0, -.15), x0 = c.x + Math.cos(a) * c.r * R(.35, .9), y0 = c.y + Math.sin(a) * c.r * R(.25, .75), h = R(24, 40) * size;
        plume(img, x0, y0, h, h * R(.4, .5), -Math.PI / 2 + (x0 - cx) / W * .7 + R(-.3, .3), rp, haze); } } };
  for (const [i, b] of far.entries()) lilac(fImg, b.x, b.y, R(30, 42) * K, b.w, [MAUVE, WHITE, PURPLE, MAUVE][i], .42, .3);
  // grass blades, their tips lit gold where the sun comes through; daisies in drifts
  for (let i = 0; i < 4600; i++) { const y = hz + 2 + (GH - hz) * Math.sqrt(rnd()), q = (y - hz) / (GH - hz), x = R(0, GW), h = (1 + q * 7) * K * R(.4, 1), lean = R(-.4, .4), sh = shadowAt(x, y), gl = Math.exp(-(((x - sx) / (GW * .35)) ** 2)) * (1 - sh);
    for (let j = 0; j < h; j++) { const f = j / h, X = x + lean * j * (1 + f), Y = y - j; let c = dn(LAWN, .3 + q * .08 - sh * .16 + f * .22 + (f > .55 ? gl * .5 : 0), X | 0, Y | 0); if (f > .7 && gl > .3) c = mix4(c, [255, 226, 150], (f - .7) * gl * 1.6); put(fImg, X, Y, c); } }
  for (let i = 0; i < 1400; i++) { const x = R(0, GW), y = R(hz + 6 * K, GH), q = (y - hz) / (GH - hz); if (fbm(x / (26 * K), y / (9 * K) + 5, 2) < .6 || rnd() > .3) continue;
    const s = q > .55 ? 2 : 1, dim = 1 - shadowAt(x, y) * .3, pet = rnd() < .15 ? [250, 214, 70] : [252, 248, 238].map(v => v * dim | 0);
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) rect4(fImg, x + a * s, y + b * s, s, s, pet); rect4(fImg, x, y, s, s, [236, 180, 50]); }
  // the big lilac in the near corner, a smaller one across; petals fallen under them; tall grass along the bottom, dark against the light
  const edge = sunR ? R(.0, .08) * GW : R(.92, 1) * GW, across = sunR ? R(.93, 1.03) * GW : R(-.03, .07) * GW;
  for (const [x, rp] of [[edge, MAUVE], [across, MAUVE]]) for (let k = 0; k < 260; k++) { const px = x + R(-90, 90) * K * .6, py = R(GH * .8, GH); put(nImg, px, py, rp[6 + (rnd() * 4 | 0)]); put(nImg, px + 1, py, rp[5]); }
  lilac(nImg, edge, GH * 1.03, GH * 1.02, 78 * K, MAUVE, 1, 0);
  lilac(nImg, across, GH * .98, GH * .6, 44 * K, rnd() < .5 ? WHITE : PURPLE, .8, 0);
  for (let i = 0; i < 220; i++) { const x = R(0, GW), h = R(4, 15) * K * (rnd() < .2 ? 1.6 : 1), lean = R(-.5, .5), gl = Math.exp(-(((x - sx) / (GW * .4)) ** 2));
    for (let j = 0; j < h; j++) { const f = j / h, X = x + lean * j * f * 1.5, Y = GH - 1 - j; put(nImg, X, Y, dn(LAWN, .08 + f * .14, X | 0, Y)); if (f > .3 && gl > .2) put(nImg, X + (sx > x ? 1 : -1), Y, mix4(LAWN[6], [255, 220, 140], gl * .7)); } }

  // ---------- Lilas, the dog: soft forms in 3D (thighs into hips, neck into chest) blended into one body, turned the way she runs, lit by the low sun and the sky ----------
  // rig units: x forward, y down, z toward her right side; on screen each pixel keeps the nearest blended surface
  let SC = 1.4;   // set each frame from how far away she is
  const DW = 170, DH = 132, OX = 85, OY = 122, N = DW * DH, dcan = document.createElement('canvas'); dcan.width = DW; dcan.height = DH;
  const dctx = dcan.getContext('2d'), dimg = dctx.createImageData(DW, DH), Hn = new Float32Array(N), He = new Float32Array(N), Wn = new Int16Array(N), Tn = new Float32Array(N);
  const E3 = (cx, cy, cz, rx, ry, rz, side = 0) => ({e: 1, cx, cy, cz, rx, ry, rz, side}), C3 = (ax, ay, az, bx, by, bz, r1, r2, side = 0) => ({ax, ay, az, bx, by, bz, r1, r2, side});
  const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k / 4; };
  // turn the forms by her heading, then look at them from the front of the screen (z toward us)
  const turn = (P, c, sn) => P.map(p => p.e ? {e: 1, cx: p.cx * c - p.cz * sn, cy: p.cy, cz: p.cx * sn + p.cz * c, rx: Math.hypot(p.rx * c, p.rz * sn), ry: p.ry, th: Math.hypot(p.rx * sn, p.rz * c), side: p.side}
    : {ax: p.ax * c - p.az * sn, ay: p.ay, az: p.ax * sn + p.az * c, bx: p.bx * c - p.bz * sn, by: p.by, bz: p.bx * sn + p.bz * c, r1: p.r1, r2: p.r2, side: p.side});
  // the surface nearest to us at (x, y): [depth, position along a capsule], or null
  const front = (p, x, y) => {
    if (p.e) { const lx = (x - p.cx) / p.rx, ly = (y - p.cy) / p.ry, q = lx * lx + ly * ly; return q < 1 ? [p.cz + p.th * Math.sqrt(1 - q), 0] : null; }
    const dx = p.bx - p.ax, dy = p.by - p.ay, L2 = dx * dx + dy * dy, t = L2 < .5 ? (p.az > p.bz ? 0 : 1) : clamp(((x - p.ax) * dx + (y - p.ay) * dy) / L2), r = p.r1 + (p.r2 - p.r1) * t, d = Math.hypot(x - p.ax - dx * t, y - p.ay - dy * t);
    return d < r ? [p.az + (p.bz - p.az) * t + Math.sqrt(r * r - d * d), t] : null; };
  const raster = (H, list, W, T) => list.forEach((p, id) => {
    const m = p.e ? 0 : Math.max(p.r1, p.r2), x0 = p.e ? p.cx - p.rx : Math.min(p.ax, p.bx) - m, x1 = p.e ? p.cx + p.rx : Math.max(p.ax, p.bx) + m, y0 = p.e ? p.cy - p.ry : Math.min(p.ay, p.by) - m, y1 = p.e ? p.cy + p.ry : Math.max(p.ay, p.by) + m;
    for (let Y = Math.max(1, Math.floor(y0 * SC + OY) - 1); Y <= Math.min(DH - 2, Math.ceil(y1 * SC + OY) + 1); Y++) for (let X = Math.max(1, Math.floor(x0 * SC + OX) - 1); X <= Math.min(DW - 2, Math.ceil(x1 * SC + OX) + 1); X++) {
      const f = front(p, (X - OX + .5) / SC, (Y - OY + .5) / SC); if (!f) continue;
      const i = Y * DW + X, o = H[i], v = f[0] + 100; if (W && v > o) { W[i] = id; T[i] = f[1]; } H[i] = o > 0 ? smax(o, v, 2.5) : v; } });
  // a leg in three parts and a paw, on one side of her; angles from the vertical, positive = forward
  const leg = (x, y, z, as, L, Rr, side) => { const P = []; let px = x, py = y; for (let k = 0; k < 3; k++) { const nx = px + Math.sin(as[k]) * L[k], ny = py + Math.cos(as[k]) * L[k]; P.push(C3(px, py, z, nx, ny, z, Rr[k], Rr[k + 1], side)); px = nx; py = ny; } P.push(E3(px + 1.8, py - .2, z, 3.6, 2.3, 2.6, side)); return P; };
  // sit and lie (0..1) blend the standing pose into sitting (rump down, front legs straight) and lying asleep (sphinx, head on the paws)
  const mixA = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const pose = (mode, ph, t, bow, held, sit = 0, lie = 0) => {
    const run = mode === 'chase', trot = mode === 'carry', A = run ? 1 : trot ? .5 : 0, bd = bow * 10, rd = sit * 19;
    const by = (run ? -2.2 * Math.abs(Math.sin(ph)) : trot ? -.8 * Math.abs(Math.sin(ph * 2)) : Math.sin(t / 420) * .3) + lie * (18 + Math.sin(t / 700) * .5), flex = run ? Math.sin(ph) * 2.5 : 0;   // the gallop bunches and stretches the back
    const hipX = -18 - flex + sit * 5 + lie * 2, hipY = -31 + by + rd, shX = 14 + flex, shY = -33 + by + bd - sit * 2;
    const fr = o => { const s = Math.sin(ph + o), c = Math.max(0, Math.cos(ph + o)), a1 = -.35 + A * .5 * s, a2 = A * .45 * s + A * .25 * c, a3 = a2 + .12 - A * 1.6 * c; return mixA(mixA([a1 * (1 - bow) + .55 * bow, a2 * (1 - bow) + 1.45 * bow, a3 * (1 - bow) + 1.55 * bow], [-.08, 0, .06], sit), [.32, 1.5, 1.55], lie); };
    const bk = o => { const s = Math.sin(ph + o), c = Math.max(0, Math.cos(ph + o)); return mixA(mixA([.5 + A * .45 * s + A * .2 * c, -.8 + A * .3 * s - A * .45 * c, .05 + A * .5 * s + A * .4 * c], [1.75, -.9, 1.45], sit), [1.5, -1.35, -1.55], lie); };
    const FL = [12, 15, 5], FR = [6, 3.6, 2.9, 2.5], BL = [13, 12, 9], BR = [8.5, 4.4, 2.8, 2.5];
    const [nf, ff, nb, fb] = run ? [0, .6, Math.PI + .2, Math.PI + .9] : [0, Math.PI, Math.PI, 0];
    const hx = bow * 4 + (run ? 3 : 0) + lie * 3, hy = by + bd * 1.1 + (run ? 4 + Math.sin(ph + 1) * 1.2 : 0) + (mode === 'wait' && !bow ? Math.sin(t / 900) : 0) + lie * 16 - sit * 3;
    // the tail: thick at the root, curling up a little toward the tip with a slight corkscrew; the wag swings it side to side
    const wag = (mode === 'wait' ? Math.sin(t / 60) * .5 : run ? Math.sin(ph) * .15 : Math.sin(t / 130) * .25) * (1 - lie), tail = []; let tx = hipX - 9, ty = -38 + by + rd, tz = 0;
    for (let k = 0; k < 9; k++) { const a = -2.95 + wag * .3 - bow * .5 - (sit + lie) * .3 + (k * .04 + k * k * .016) * (1 - (sit + lie) * .7), w = wag * (.6 + k * .08) + Math.sin(k * 1.1 + t / 300) * .12, nx = tx + Math.cos(a) * Math.cos(w) * 2.9, ny = ty + Math.sin(a) * 2.9, nz = tz + Math.cos(a) * Math.sin(w) * 2.9;
      tail.push(C3(tx, ty, tz, nx, ny, nz, 5 - k * .46, 4.54 - k * .46)); tx = nx; ty = ny; tz = nz; }
    const neck = C3(shX + 2, -36 + by + bd, 0, 26 + hx, -48 + hy, 0, 9, 6.8), ear = (run ? Math.sin(ph) * 1.6 : 0) - bow * 1.5 - lie * 4;
    const body = [...leg(hipX + 1, hipY, 5.5, bk(nb), BL, BR, 1), ...leg(shX, shY, 4.5, fr(nf), FL, FR, 1), ...leg(hipX - 1, hipY - 1, -5.5, bk(fb), BL, BR, -1), ...leg(shX - 2, shY - 1, -4.5, fr(ff), FL, FR, -1),
      E3(hipX - 2, -33 + by + rd, 0, 11, 10, 9), C3(hipX + 2, -33.5 + by + rd, 0, shX - 2, -34 + by + bd * .7 - sit * 2, 0, 9.5, 10), C3(hipX + 6, -28 + by + rd * .9, 0, shX - 4, -26 + by + bd * .8, 0, 5, 8), E3(shX + 1, -29.5 + by + bd * .9 - sit * 2, 0, 10, 11.5, 8.5),
      neck, E3(28.5 + hx, -53.5 + hy, 0, 8.2, 7.2, 6.4), E3(32 + hx, -56.5 + hy, 0, 4.4, 3.2, 5), C3(33 + hx, -51.5 + hy, 0, 39.5 + hx, -50.5 + hy, 0, 5.6, 5), E3(36.5 + hx, -47.5 + hy, 0, 5.6, 3.2, 4.4), ...tail];
    const ears = [-1, 1].flatMap(sd => [C3(26.5 + hx, -59 + hy, sd * 5.4, 25 + hx + ear * .3 - lie * 4, -45 + hy + ear, sd * 6.4, 3, 4.2), E3(25.2 + hx + ear * .3 - lie * 4, -45.2 + hy + ear, sd * 6.4, 4.6, 3.2, 1.6)]);
    const over = [['nose', E3(43.2 + hx, -51.6 + hy, 0, 2.6, 2.3, 2.6)]];
    if (held) over.push(['ball', lie > .5 ? E3(shX + 33, -4.3, 0, 4.2, 4.2, 4.2) : E3(44 + hx, -47 + hy, 0, 4.2, 4.2, 4.2)]); else if (!trot && lie < .5) over.push(['tongue', C3(38.5 + hx, -47 + hy, 0, 40 + hx, -42.5 + hy + (run ? 0 : Math.sin(t / 110) * .8), 0, 2.1, 1.9)]);
    return {body, ears, over, sleep: lie > .7, neckId: body.indexOf(neck), eyes: [-1, 1].map(sd => [33.5 + hx, -55.2 + hy, sd * 3.8]), mouth: [35.5 + hx, 42.5 + hx, -46.8 + hy]};
  };
  const hit = (p, x, y) => { if (p.e) { const lx = (x - p.cx) / p.rx, ly = (y - p.cy) / p.ry, q = lx * lx + ly * ly; return q <= 1 ? [lx, ly, Math.sqrt(1 - q)] : null; }
    const dx = p.bx - p.ax, dy = p.by - p.ay, t = clamp(((x - p.ax) * dx + (y - p.ay) * dy) / (dx * dx + dy * dy || 1)), r = p.r1 + (p.r2 - p.r1) * t, ex = x - p.ax - dx * t, ey = y - p.ay - dy * t, d = Math.hypot(ex, ey);
    return d <= r ? [ex / r, ey / r, Math.sqrt(Math.max(0, 1 - (d / r) ** 2))] : null; };
  const COAT = [.1, .09, .11], RED = [.8, .12, .16];
  const renderDog = (pz, hd, sunX) => {
    const c = Math.cos(hd), sn = Math.sin(hd), B = turn(pz.body, c, sn), Er = turn(pz.ears, c, sn);
    Hn.fill(0); He.fill(0); raster(Hn, B, Wn, Tn); raster(He, Er);
    const d = dimg.data; d.fill(0); const Lx = sunX * .78, Ly = -.42, Lz = -.46;   // the low sun, behind her and to one side
    const light = (nx, ny, nz, alb, fur, gloss, rimK) => {
      const lam = Math.max(0, nx * Lx + ny * Ly + nz * Lz), sky = .35 + .45 * Math.max(0, -ny) + .2 * nz, bounce = Math.max(0, ny), sheen = gloss * Math.max(0, -2 * ny * nz) ** 2.5 * (.75 + fur * 1.3), rim = rimK * lam ** 2.2 * (.8 + fur);
      return [alb[0] * (150 * sky + 360 * lam + 70 * bounce) + 80 * sheen + 250 * rim, alb[1] * (150 * sky + 280 * lam + 110 * bounce) + 78 * sheen + 178 * rim, alb[2] * (195 * sky + 180 * lam + 50 * bounce) + 100 * sheen + 112 * rim]; };
    const set = (i, col, X, Y, k = 1) => { const o = i * 4, g = (hash(X, Y) - .5) * 7; for (let j = 0; j < 3; j++) d[o + j] = Math.max(0, Math.min(255, Math.round((col[j] * k + g) / 6) * 6)); d[o + 3] = 255; };
    const nrm = (H, i) => { const h = H[i], f = j => H[j] > 0 ? H[j] : h - 2.5, gx = (f(i + 1) - f(i - 1)) * SC * 1.2, gy = (f(i + DW) - f(i - DW)) * SC * 1.2, nl = Math.hypot(gx, gy, 1); return [-gx / nl, -gy / nl, 1 / nl]; };
    const empty = (H, i) => H[i - 1] <= 0 || H[i + 1] <= 0 || H[i - DW] <= 0 || H[i + DW] <= 0;
    for (let Y = 1; Y < DH - 1; Y++) for (let X = 1; X < DW - 1; X++) { const i = Y * DW + X; if (Hn[i] <= 0 || empty(Hn, i) && hash(X * 1.3, Y) < .4) continue;   // a ragged, furry edge
      const [nx, ny, nz] = nrm(Hn, i), far = B[Wn[i]].side * c < -.2, fur = fbm((X - OX) / SC * .45 + 40, (Y - OY) / SC * 1.9, 2) - .5, collar = Wn[i] === pz.neckId && Tn[i] > .1 && Tn[i] < .28;
      set(i, light(nx, ny, nz, collar ? RED : COAT, fur, collar ? .5 : 1, far ? 0 : 1), X, Y, far ? .6 : 1); }
    for (let Y = DH - 3; Y > 0; Y--) for (let X = 1; X < DW - 1; X++) { const i = Y * DW + X; if (Hn[i] > 0 && Hn[i + DW] <= 0 && d[(i + DW) * 4 + 3] === 0 && hash(X, Y * 1.7) < .22) set(i + DW, [12, 11, 14], X, Y + 1); }   // tufts under the belly and chest
    for (let Y = 1; Y < DH - 1; Y++) for (let X = 1; X < DW - 1; X++) { const i = Y * DW + X; if (He[i] <= 0 || Hn[i] > 0 && He[i] < Hn[i] - .5) continue;   // the ears, where they are in front of her head
      const [nx, ny, nz] = nrm(He, i); set(i, light(nx, ny, nz, COAT, 0, .8, 1), X, Y, empty(He, i) ? .3 : .8); }
    for (const [tag, p0] of pz.over) { const p = turn([p0], c, sn)[0]; for (let Y = 0; Y < DH; Y++) for (let X = 0; X < DW; X++) { const x = (X - OX + .5) / SC, y = (Y - OY + .5) / SC, f = front(p, x, y); if (!f) continue;
      const i = Y * DW + X; if (Hn[i] > 0 && f[0] + 100 < Hn[i] - 1) continue; const [nx, ny, nz] = hit(p, x, y) || [0, 0, 1];
      if (tag === 'nose') set(i, ny < -.5 && nz > .3 ? [96, 92, 110] : [14, 12, 16], X, Y);
      else if (tag === 'tongue') set(i, light(nx, ny, nz, [.95, .42, .5], 0, .6, 1), X, Y);
      else set(i, Math.abs(Math.sin((nx + ny * .4) * 4)) < .16 ? [236, 236, 214] : light(nx, ny, nz, [.85, .95, .3], 0, .5, 1), X, Y); } }
    // a point on her, if it is not hidden behind her: its pixel
    const seen = (x, y, z, slack) => { const X = Math.round((x * c - z * sn) * SC + OX - .5), Y = Math.round(y * SC + OY - .5), Z = x * sn + z * c; if (X < 1 || Y < 1 || X >= DW - 1 || Y >= DH - 1) return null; const i = Y * DW + X; return Hn[i] > 0 && Z + 100 >= Hn[i] - slack ? [X, Y] : null; };
    const pxl = (X, Y, col) => { if (X >= 0 && Y >= 0 && X < DW && Y < DH) set(Y * DW + X, col, X, Y); };
    // her eyes: warm brown, the sky caught in them; in profile only the near one shows
    for (const [ex, ey, ez] of pz.eyes) { const e = seen(ex, ey, ez, 3.5); if (!e) continue; const [X, Y] = e, k = SC > .9 ? 1 : 0;
      if (pz.sleep) { pxl(X, Y, [16, 10, 8]); if (k) pxl(X - 1, Y, [16, 10, 8]); continue; }   // asleep: the eye closed, a short dark line
      pxl(X, Y, [20, 10, 6]); if (k) { pxl(X - 1, Y - 1, [96, 56, 24]); pxl(X, Y - 1, [80, 44, 18]); pxl(X - 1, Y, [64, 36, 14]); pxl(X + 1, Y, [18, 10, 6]); pxl(X, Y + 1, [40, 22, 10]); } pxl(X + (c >= 0 ? 1 : -1) * k, Y - k, [236, 232, 250]); }
    const [m0, m1, my] = pz.mouth; for (const sd of [-1, 1]) for (let x = m0; x <= m1; x += .5) { const e = seen(x, my, sd * 2.6, 2); if (e) pxl(e[0], e[1], [6, 4, 8]); }
    dctx.putImageData(dimg, 0, 0);
  };
  const BALLC = ramp('#5e6c0c', '#92a81a', '#bcd232', '#dcea64', '#f8ffbc'), ballSpr = document.createElement('canvas'); ballSpr.width = ballSpr.height = 11; { const g = ballSpr.getContext('2d'), im = g.createImageData(11, 11);
    for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) { const nx = (x - 5) / 4.6, ny = (y - 5) / 4.6, q = nx * nx + ny * ny; if (q > 1) continue; const nz = Math.sqrt(1 - q), l = Math.max(0, -nx * .5 - ny * .6 + nz * .6), c = Math.abs(Math.sin((nx + ny * .4) * 4)) < .18 ? [244, 244, 222] : dith(BALLC, .2 + l * .8, x, y), k = (y * 11 + x) * 4; im.data.set([...c, 255], k); }
    g.putImageData(im, 0, 0); }
  // ---------- the game: she runs all over the lawn, far away (small) and up close (large), always the way she faces ----------
  const G0 = hz + 50, G1 = Math.round(GH * .93), sOf = gy => (gy - hz) / (G1 - hz), X0 = 60, X1 = GW - 60, DEP = .55;   // DEP: how much a step into the depth moves her up or down the screen
  const dog = {x: GW * .4, gy: G1 - 12, hd: 0, ph: 0, mode: 'chase', timer: 0, bow: 0, tx: 0, tg: 0, sit: 0, lie: 0, sleepy: false}, ball = {x: GW * .6, gy: G0 + 25, h: 30, vx: 1, vg: .4, vh: 2, held: false};
  const petals = drift4(36, {colors: ['#e0c4ec', '#c49ad6', '#f6ecfc', '#a472bc'], vy: .2, vx: sunR ? -.12 : .12, sway: .7, size: 2}), motes = drift4(30, {colors: ['#fff4c8', '#ffe8a8'], vy: -.05, sway: .5, alpha: .5});
  twinkles = [];
  return {flares: false, shooters: false, dog, ball, draw: t => {   // dog and ball: reachable for the self-tests
    // rays of light coming toward us between the trees
    fxc.save(); fxc.globalCompositeOperation = 'lighter'; fxc.fillStyle = '#ffdc98';
    for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + (i - 2.5) * .24 + Math.sin(t / 5000 + i) * .03; fxc.globalAlpha = .028 + .014 * Math.sin(t / 1900 + i * 2);
      fxc.beginPath(); fxc.moveTo(sx, sy); fxc.lineTo(sx + Math.cos(a - .05) * GW, sy + Math.sin(a - .05) * GW); fxc.lineTo(sx + Math.cos(a + .05) * GW, sy + Math.sin(a + .05) * GW); fxc.fill(); }
    fxc.restore(); fxc.globalAlpha = 1;
    motes(t); petals(t);
    const s = sOf(dog.gy); SC = 1.4 * s;
    const c = Math.cos(dog.hd), sn = Math.sin(dog.hd), dir = c < 0 ? -1 : 1, mouthX = () => dog.x + Math.cos(dog.hd) * 44 * SC, mouthG = () => dog.gy + Math.sin(dog.hd) * 44 * SC * DEP;
    // the ball: h is its height above the ground, gy where it touches the ground
    if (!ball.held) { const bs = sOf(ball.gy); ball.vh -= .12; ball.h += ball.vh; ball.x += ball.vx * bs; ball.gy += ball.vg;
      if (ball.h < 4.5) { ball.h = 4.5; ball.vh = Math.abs(ball.vh) > .7 ? -ball.vh * .55 : 0; ball.vx *= .97; ball.vg *= .97; }
      if (ball.x < X0 || ball.x > X1) { ball.vx = -ball.vx * .6; ball.x = Math.max(X0, Math.min(X1, ball.x)); }
      if (ball.gy < G0 || ball.gy > G1) { ball.vg = -ball.vg * .6; ball.gy = Math.max(G0, Math.min(G1, ball.gy)); } }
    // she turns toward where she wants to go (quickly when it is behind her, slowing down to turn) and runs the way she faces
    const steer = (des, rate) => { const dl = Math.atan2(Math.sin(des - dog.hd), Math.cos(des - dog.hd)); if (Math.abs(dl) > 1.2) rate = .14; dog.hd += Math.max(-rate, Math.min(rate, dl)); return dl; };
    const go = (tx, tg, sp) => { const dx = tx - dog.x, dg = (tg - dog.gy) / DEP, d = Math.hypot(dx, dg) || 1, dl = steer(Math.atan2(dg, dx), d < 40 ? .12 : .06); sp *= Math.max(.2, Math.cos(dl)); dog.x += Math.cos(dog.hd) * sp; dog.gy += Math.sin(dog.hd) * sp * DEP; return d; };
    // the mouse resting a few seconds: she trots over and sits by it; in the evening, left alone longer, she fetches her ball and falls asleep with it between her paws
    const idle = performance.now() - skyMouse.t, still = skyMouse.x >= 0 && idle > 5000, moved = idle < 400, hr = new Date().getHours();
    if (still && idle > 30000 && (hr >= 19 || hr < 6) && !dog.sleepy && dog.mode !== 'carry' && dog.mode !== 'up') { dog.sleepy = true; dog.mode = ball.held ? 'sleep' : 'chase'; }
    if (still && !dog.sleepy && (dog.mode === 'chase' || dog.mode === 'carry' || dog.mode === 'wait' && dog.timer < 40)) dog.mode = 'come';
    if (moved) { if (dog.mode === 'come') { dog.mode = ball.held ? 'wait' : 'chase'; dog.timer = 0; } else if (dog.mode === 'sit' || dog.mode === 'sleep') dog.mode = 'up'; else if (dog.sleepy) dog.sleepy = false; }
    const mx = Math.max(X0, Math.min(X1, skyMouse.x)), mg = Math.max(G0 + 4, Math.min(G1, skyMouse.y));
    if (dog.mode === 'come') { dog.ph += .15; if (go(mx - Math.sign(mx - dog.x || 1) * 30 * s, mg, 1.1 * s) < 14) { dog.mode = 'sit'; dog.timer = 0; } }
    else if (dog.mode === 'sit') { dog.ph = 0; steer(mx > dog.x ? .5 : Math.PI - .5, .04); dog.sit = Math.min(1, dog.sit + .04); }
    else if (dog.mode === 'sleep') { dog.ph = 0; steer(dog.x < GW / 2 ? 0 : Math.PI, .04); dog.sit = Math.max(0, dog.sit - .03); dog.lie = Math.min(1, dog.lie + .015); }
    else if (dog.mode === 'up') { dog.ph = 0; dog.sit = Math.max(0, dog.sit - .06); dog.lie = Math.max(0, dog.lie - .04); if (!dog.sit && !dog.lie) { dog.sleepy = false; dog.mode = ball.held ? 'wait' : 'chase'; dog.timer = 0; } }
    else if (dog.mode === 'chase') { go(ball.x - c * 44 * SC, ball.gy - sn * 44 * SC * DEP, 1.7 * s); dog.ph += .24; dog.bow = Math.max(0, dog.bow - .05);
      if (Math.hypot(ball.x - mouthX(), (ball.gy - mouthG()) / DEP) < 10 * s + 3 && ball.h < 22) { ball.held = true; dog.mode = dog.sleepy ? 'sleep' : 'carry'; dog.timer = 0;
        dog.tx = R(.25, .75) * GW; dog.tg = dog.gy > (G0 + G1) / 2 ? R(G0, G0 + 25) : R(G1 - 20, G1); } }   // she brings it somewhere else on the lawn, far or near
    else if (dog.mode === 'carry') { dog.ph += .15; if (go(dog.tx, dog.tg, .75 * s) < 20 || ++dog.timer > 420) { dog.mode = 'wait'; dog.timer = 0; } }
    else { dog.timer++; dog.ph = 0; if (dog.timer < 70) steer(dir > 0 ? 0 : Math.PI, .05);   // she turns side-on to play
      if (dog.timer === 40) { ball.held = false; ball.x = mouthX(); ball.gy = mouthG(); ball.h = 16 * s; ball.vx = dir * .5; ball.vg = 0; ball.vh = 0; }
      dog.bow = dog.timer > 70 && dog.timer < 150 ? Math.min(1, dog.bow + .06) : Math.max(0, dog.bow - .06);
      if (dog.timer === 170) { ball.x = mouthX(); ball.vx = dir * R(1.6, 3); if (dog.x + dir * 120 < X0 || dog.x + dir * 120 > X1) ball.vx = -ball.vx * .6; ball.vh = R(2.4, 3.6); ball.vg = (dog.gy > (G0 + G1) / 2 ? -1 : 1) * R(.25, .7); }
      if (dog.timer > 185) dog.mode = 'chase'; }
    renderDog(pose(dog.mode === 'come' ? 'carry' : dog.mode === 'chase' || dog.mode === 'carry' ? dog.mode : 'wait', dog.ph, t, dog.bow, ball.held, dog.sit, dog.lie), dog.hd, Math.sign(sx - dog.x) || 1);
    // shadows fall toward us, away from the sun
    const bs = sOf(ball.gy), gy = Math.round(dog.gy), ac = Math.abs(Math.cos(dog.hd)), as = Math.abs(Math.sin(dog.hd));
    fxc.globalAlpha = .32; fxc.fillStyle = '#14200c'; fxc.beginPath(); fxc.ellipse(dog.x + Math.cos(dog.hd) * 6 * s, gy + 4 * s, (46 * ac + 16 * as) * s, (7 + 6 * as) * s, 0, 0, 6.283); fxc.fill();
    if (!ball.held) { fxc.beginPath(); fxc.ellipse(ball.x, ball.gy + 2 * bs, 5 * bs, 2.2 * bs, 0, 0, 6.283); fxc.fill(); } fxc.globalAlpha = 1;
    fxc.imageSmoothingEnabled = false;
    const drawBall = () => { if (!ball.held) { const z = Math.max(.45, bs), by = ball.gy - ball.h * bs; fxc.drawImage(ballSpr, Math.round(ball.x - 5.5 * z), Math.round(by - 5.5 * z), Math.round(11 * z), Math.round(11 * z)); } };
    if (ball.gy < dog.gy) drawBall();   // the ball further away than her is hidden behind her
    fxc.drawImage(dcan, Math.round(dog.x - OX), gy - OY);
    if (ball.gy >= dog.gy) drawBall();
  }};
}

/* Cascade (redrawn): a jungle gorge, a three-step waterfall into a turquoise pool, mist, ferns, a parrot, a rainbow in the spray */
function jungle(fImg, nImg) {
  const cx = R(.4, .6) * GW | 0, ly = Math.round(GH * R(.26, .32)), py = Math.round(GH * .78), seed = R(0, 99);
  const SKYJ = ramp('#0c3a2a', '#1a5a3a', '#3a8a4a', '#78c060', '#c8f0a0', '#fffce0'), FAR = ramp('#1e5a48', '#2c7058', '#3e8a66', '#58a678');
  const ROCK = ramp('#07090c', '#11161a', '#1c242a', '#2a363c', '#3c4c50', '#56686a'), MOSS = ramp('#06200e', '#0c3a1a', '#145a28', '#1e7a32', '#34a044', '#5cc058');
  const WATER = ramp('#1a6a88', '#2a8aa8', '#58b8cc', '#98e0e8', '#d8fcff', '#ffffff'), POOL = ramp('#04282e', '#06383e', '#0a5a62', '#10848a', '#28b0b0', '#6ad8d0');
  // a bright, misty sky above the gorge, the light pouring in where the water falls
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, dith(SKYJ, .35 + (1 - y / ly) * .25 + Math.exp(-(((x - cx) / (50 * K)) ** 2)) * .4 * clamp(1.2 - y / GH), x, y));
  // the jungle far away beyond the lip, in two hazy rows of crowns
  for (const [base, v, sc] of [[ly - 16 * K, .75, 9], [ly - 4 * K, .35, 13]]) {
    const sd = R(0, 99);
    for (let x = 0; x < GW; x++) { const c = Math.abs(Math.sin(x / (sc * K) + sd)) * sc * .7 * K + fbm(x / (20 * K) + sd, 1, 3) * 10 * K, t = Math.round(base - c); for (let y = t; y < ly + 4 * K; y++) put(fImg, x, y, dith(FAR, v - (y - t) / (30 * K) * .3 + (y - t < K ? .15 : 0), x, y)); }
  }
  // the rock wall behind the fall, dark and wet, a mossy lip on top
  const gap = y => (30 + (y - ly) / GH * 20) * K;
  for (let y = ly; y < py; y++) for (let x = cx - gap(y) - 4 * K; x < cx + gap(y) + 4 * K; x++) put(fImg, x, y, dith(ROCK, .22 + (fbm(x / (5 * K), y / (12 * K) + seed, 3) - .5) * .4 - (y - ly) / GH * .2, x, y));
  for (let x = cx - gap(ly) - 6 * K; x < cx + gap(ly) + 6 * K; x++) { const h = Math.round(2 * K + fbm(x / (4 * K), seed, 2) * 3 * K); for (let j = -K; j < h; j++) put(fImg, x, ly + j, dith(MOSS, .7 - j / h * .5, x, ly + j)); }
  // the two cliffs: banded rock lit towards the gorge, cracks, ledges with moss draping down, ferns, the forest crowning their tops
  const edge = [];
  for (const sd of [-1, 1]) {
    const ss = R(0, 99);
    for (let y = 0; y < GH; y++) {
      const ex = Math.round(cx + sd * (gap(Math.max(y, ly)) + 4 * K + (fbm(y / (14 * K), ss, 3) - .5) * 14 * K + (y < ly ? (ly - y) * .15 : 0)));
      edge.push([sd, y, ex]);
      for (let x = ex; sd < 0 ? x >= 0 : x < GW; x += sd) {
        const d = Math.abs(x - ex), band = Math.sin((y + fbm(x / (20 * K), y / (20 * K) + ss, 3) * 18 * K) / (5 * K)), crack = fbm(x / (1.5 * K) + ss, y / (18 * K), 2) > .66;
        put(fImg, x, y, dith(ROCK, .3 + clamp(1 - d / (14 * K)) * .25 + (band > .8 ? .18 : band < -.7 ? -.1 : 0) - (crack ? .2 : 0) + (fbm(x / (8 * K), y / (8 * K) + ss, 3) - .5) * .25 - d / GW * .3, x, y));
      }
    }
    for (let i = 0; i < 8; i++) {  // a cushion of moss on a ledge, ragged on top, strands of different lengths hanging under it, a bush here and there
      const y = Math.round(R(.14, .72) * GH), x0 = Math.round(cx + sd * (gap(Math.max(y, ly)) + R(20, 110) * K)), w = R(40, 80) * K, ms = R(0, 99);
      if (x0 < 0 || x0 >= GW) continue;
      for (let k = -w / 2; k < w / 2; k++) {
        const X = Math.round(x0 + k), e = Math.min(1, (1 - Math.abs(k) / (w / 2)) * 4), up = Math.round(fbm(X / (3 * K), ms, 2) * 3 * K * e), h = Math.round(e * (K + fbm(X / (5 * K), ms + 5, 2) * 2 * K)), Y = y + Math.round((fbm(X / (25 * K), ms + 9, 2) - .5) * 8 * K);
        if (e < .05) continue; for (let j = -up; j < h; j++) put(fImg, X, Y + j, dith(MOSS, .8 - (j + up) / (h + up + 1) * .55, X, Y + j));
        const L = Math.round(fbm(X / (1.5 * K), ms + 3, 2) ** 3 * 22 * K * e);
        if (L > 2 * K) for (let j = 0; j < L; j++) put(fImg, X, Y + h + j, MOSS[j < L * .3 ? 3 : j < L * .7 ? 2 : 1]);
      }
    }
    for (let i = 0; i < 16; i++) { const x = cx + sd * R(gap(ly) + 14 * K, GW * .6), y = R(-.02, .1) * GH; blob(fImg, x, y, R(14, 26) * K, R(8, 12) * K, MOSS, .15, .95, R(0, 99), .45); }
  }
  // the fall: one sheet from a curved lip, streaked, thin and see-through at its edges; a rock half-way breaks it into foam
  const fw = R(16, 22) * K, brk = Math.round(ly + (py - ly) * R(.45, .58)), fwAt = y => fw * (1 + (y - ly) / (py - ly) * .4) + (y > brk ? 3 * K : 0);
  for (let y = ly - K; y < py; y++) {
    const w = fwAt(y);
    for (let x = -w; x <= w; x++) {
      const X = Math.round(cx + x), e = Math.abs(x) / w, streak = fbm(x / (1.3 * K) + (y > brk ? 7 : 0), y / (26 * K), 3), lip = y - ly < 3 * K;
      const rag = .82 - fbm(y / (6 * K), x > 0 ? 3 : 8, 2) * .2; if (e > rag && bay(X, y) > (1 - e) / (1 - rag)) continue;
      put(fImg, X, y, dith(WATER, lip ? .95 - (y - ly) / (3 * K) * .3 : .3 + streak * .65 - e * .25, X, y));
    }
  }
  for (let x = -fw - 6 * K; x < fw + 6 * K; x++) { const X = Math.round(cx + x), e = clamp(1 - Math.abs(x) / (fw + 6 * K)); for (let j = -4 * K; j < 4 * K; j++) if (bay(X, brk + j) < e * (1 - Math.abs(j) / (4 * K)) * 1.4 * (.6 + fbm(X / (2 * K), brk + j, 2) * .8)) put(fImg, X, brk + j, WATER[Math.abs(j) < 1.5 * K ? 5 : 4]); }  // the water bursts white where it strikes a hidden step
  // the pool: a mirror of the gorge, darker, broken by ripples, white foam and a bank of mist where the water lands
  const fd = fImg.data;
  for (let y = py; y < GH; y++) {
    const q = (y - py) / (GH - py), my = 2 * py - y - 1;
    for (let x = 0; x < GW; x++) {
      const wave = fbm(x / (18 * K), y / (1.5 * K) + seed, 3), k = (y * GW + x) * 4, m = (my * GW + Math.min(GW - 1, Math.max(0, x + Math.round((wave - .5) * 5 * K)))) * 4;
      fd[k] = fd[m] * .35 + 4; fd[k + 1] = fd[m + 1] * .5 + 40; fd[k + 2] = fd[m + 2] * .5 + 46; fd[k + 3] = 255;
      if (wave > .72 && bay(x, y) < .2 + q * .2) put(fImg, x, y, POOL[4 - (q > .5 ? 1 : 0)]);
      const f = clamp(1 - Math.hypot((x - cx) / (fw * 1.8), (y - py) / (6 * K)));
      if (f > 0 && bay(x, y) < f * 1.3) put(fImg, x, y, WATER[f > .5 ? 5 : 4]);
    }
  }
  for (let y = py - 14 * K; y < py + 6 * K; y++) for (let x = cx - 60 * K; x < cx + 60 * K; x++) { const a = clamp(1 - Math.hypot((x - cx) / (60 * K), (y - py + 2 * K) / (12 * K))) * fbm(x / (10 * K) + seed, y / (5 * K), 3); if (bay(x, y) < a * 1.1) put(fImg, x, y, WATER[a > .4 ? 5 : 4]); }
  // near: mossy rocks in the corners, big split leaves, heliconia flowers, lianas hanging from above
  const top = land4(nImg, GH - P - 4 * K, 8 * K, 30 * K, ramp('#04140a', '#08240e', '#0e3a18'), .1, .6, {depth: 20 * K, tex: 3});
  const leaf = (x, y, a, L, W) => {  // a broad leaf with a pale midrib and a few slits, lit on its upper edge
    for (let l = 0; l < L; l++) { const u = l / L, hw = Math.sin(Math.PI * Math.min(1, u * 1.1)) * W, px = x + Math.cos(a) * l + Math.sin(u * 3) * K, py2 = y + Math.sin(a) * l + u * u * L * .25;
      for (let s = -hw; s <= hw; s++) { const X = px - Math.sin(a) * s, Y = py2 + Math.cos(a) * s, slit = Math.abs(s) > hw * .35 && (l % (5 * K)) < 1; if (!slit) put(nImg, X, Y, s === 0 || Math.abs(s) < .6 ? MOSS[5] : dith(MOSS, .25 + (s < 0 ? .3 : 0) + (Math.abs(s) > hw - 1 ? .2 : 0), X | 0, Y | 0)); } }
  };
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? P : GW - P;
    for (let i = 0; i < 4; i++) leaf(bx + sd * -R(0, 20) * K, GH - R(0, 10) * K, (sd < 0 ? -Math.PI * .25 : -Math.PI * .75) + R(-.4, .4), R(40, 60) * K, R(7, 11) * K);
    for (let i = 0; i < 2; i++) { const hx = bx - sd * R(30, 70) * K | 0, hy = top[Math.max(0, Math.min(GW - 1, hx))]; for (let j = 0; j < 22 * K; j++) put(nImg, hx, hy - j, MOSS[2]); for (let b = 0; b < 4; b++) { const by = hy - 8 * K - b * 3.5 * K, dir = b % 2 ? 1 : -1; for (let k = 0; k < 4 * K; k++) for (let w = 0; w < K; w++) put(nImg, hx + dir * k, by + k * .5 + w, k > 3 * K ? [255, 210, 70] : [220, 40, 50]); } }
  }
  for (let i = 0; i < 3; i++) { const x0 = R(.05, .95) * GW, L = R(.25, .5) * GH, ph = R(0, 6); for (let j = 0; j < L; j++) { const X = x0 + Math.sin(j / (14 * K) + ph) * 4 * K; put(nImg, X, j, MOSS[2]); if (j % (5 * K) === 0) for (let k = 0; k < 3 * K; k++) put(nImg, X + (j / (5 * K) % 2 ? k : -k), j + k * .4, MOSS[4]); } }
  const bird = {x: -30, y: GH * .2, v: .55, p: 0}, mist = [];
  const drops = drift4(90, {colors: ['#e8ffff', '#b8f0f0', '#ffffff'], vy: 2.2, streak: 3, alpha: .45});
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    for (let i = 0; i < 40; i++) { const y = ly + ((i * 37 + t * .25) % (py - ly)), w = fwAt(y), x = cx - w + ((i * 53) % (2 * w)); fill(x, y, '#ffffff', .5); fill(x, y + 1, '#ffffff', .35); fill(x, y + 2, '#e8ffff', .2); }  // water sliding down
    drops(t);
    if (rnd() < .5) mist.push({x: cx + R(-1, 1) * fw * 1.5, y: py - R(0, 4) * K, a: .16, r: R(3, 6) * K});
    for (const m of mist) { m.y -= .25; m.a -= .0012; m.x += .08; m.r += .02; fxc.globalAlpha = Math.max(0, m.a); fxc.fillStyle = '#f0fff8'; fxc.beginPath(); fxc.arc(m.x, m.y, m.r, 0, 6.29); fxc.fill(); } while (mist.length && mist[0].a <= 0) mist.shift();
    for (let a = 0; a < 7; a++) { fxc.globalAlpha = .07; fxc.fillStyle = ['#ff5a5a', '#ffaa44', '#ffee66', '#66dd66', '#55bbff', '#6666ee', '#aa66dd'][a]; for (let k = 0; k < 160; k++) { const an = Math.PI * (1 + k / 160); fxc.fillRect(cx + Math.cos(an) * (50 * K + a * 1.4 * K), py + Math.sin(an) * (36 * K + a), 2, 2); } }
    bird.x += bird.v; bird.y += Math.sin(t / 800) * .3; if (bird.x > GW + 30) bird.x = -30; const f = Math.sin(t / 150) > 0 ? 1 : -1;
    for (let i = 0; i < 9; i++) fill(bird.x + i, bird.y + (i > 6 ? -(i - 6) : 0), '#e82a2a'); for (let i = 1; i < 6; i++) { fill(bird.x + 3 + i * .3, bird.y - i * f, i < 3 ? '#2a5aff' : '#ffd02a'); } fill(bird.x + 9, bird.y - 1, '#f8f8f8'); fill(bird.x + 10, bird.y, '#ffa020');
  }};
}

/* Toits la nuit (redrawn): chimney stacks and tiled roofs under a big moon, a cat, lit windows, smoke, a distant skyline and clock tower */
function rooftops(fImg, nImg) {
  const hz = Math.round(GH * .62);
  sky4(fImg, hz, ramp('#04061a', '#080e30', '#101a4a', '#1c2a66', '#2e4084', '#4a5aa0', '#7a80b8'), 0, 1);
  stars4(fImg, hz * .8, GW * GH / (320 * K * K));
  const mx = R(.15, .85) * GW, my = hz * R(.2, .4), lit = mx > GW / 2 ? 1 : -1;
  sun4(fImg, mx, my, 20 * K, ramp('#a0a8c8', '#c4cae4', '#e4e8f8', '#fffffc'), 13 * K, false);
  clouds4(fImg, hz * .25, hz * .95, ramp('#060a22', '#101a44', '#223268', '#4a5a92'), .62, 10 * K, R(0, 99), .8, .1, 4);
  const wins = [], WARM = [[255, 200, 100], [240, 170, 80], [255, 224, 150]];
  // the far city in two depths: pale blocks in the haze, darker ones in front, flat roofs, water tanks and small spires, few lights
  const block = (x0, w, h, rp, v, base, lights) => {
    x0 = Math.round(x0); w = Math.round(w);
    for (let x = x0; x < x0 + w; x++) for (let y = base - h; y < hz + 40 * K; y++) put(fImg, x, y, dith(rp, v + ((x - x0 === 0 && lit < 0) || (x - x0 === w - 1 && lit > 0) ? .18 : 0), x, y));
    const kind = rnd(); if (kind < .2) for (let j = 0; j < 4 * K; j++) rect4(fImg, x0 + w / 2 - 2 * K + j * 0, base - h - j, 4 * K, 1, rp[1]);
    else if (kind < .32) for (let j = 0; j < 10 * K; j++) put(fImg, x0 + w / 2, base - h - j, rp[1]);
    for (let y = base - h + 3 * K; y < hz + 6 * K; y += 4 * K) for (let x = x0 + 2 * K; x < x0 + w - 2 * K; x += 3 * K) if (rnd() < lights) rect4(fImg, x, y, K, 1.5 * K, rnd() < .8 ? [200, 170, 90] : [150, 170, 220]);
  };
  const HAZE5 = ramp('#0c1236', '#141c48', '#1e2a5c'), CITY5 = ramp('#04061a', '#080c2a', '#101842', '#1a2658');
  for (let x = -10 * K; x < GW; x += R(6, 14) * K) block(x, R(8, 18) * K, R(20, 54) * K, HAZE5, .35, hz, .12);
  // the clock tower: a lit edge towards the moon, cornices, slit windows, a glowing face, a slate spire
  const ct = Math.round(R(.2, .8) * GW), tw = 14 * K, th = 92 * K, TOWER = ramp('#06081e', '#0c1030', '#141a42', '#222c5c', '#3a4678');
  for (let x = ct; x < ct + tw; x++) for (let y = hz - th; y < hz + 40 * K; y++) put(fImg, x, y, dith(TOWER, .3 + ((x - ct) / tw - .5) * lit * .3 + ((y - hz + th) % (24 * K) < K ? .25 : 0), x, y));
  for (let j = 0; j < 16 * K; j++) { const w = tw * (1 - j / (16 * K)) + 2 * K; for (let k = 0; k < w; k++) { const X = Math.round(ct + tw / 2 - w / 2 + k); put(fImg, X, hz - th - j, dith(TOWER, .25 + ((k / w) - .5) * lit * .5 + (j % (2 * K) === 0 ? -.08 : 0), X, hz - th - j)); } }
  for (let k = -K; k < tw + K; k++) put(fImg, ct + k, hz - th, TOWER[4]);
  const cy = hz - th + 16 * K, ccx = ct + tw / 2;
  for (let y = -7 * K; y <= 7 * K; y++) for (let x = -7 * K; x <= 7 * K; x++) { const d = Math.hypot(x, y); if (d > 5 * K && d < 7 * K && bay(ccx + x | 0, cy + y | 0) < (7 * K - d) / (2 * K) * .6) put(fImg, ccx + x, cy + y, [120, 100, 70]); }
  disc4(fImg, ccx | 0, cy, 5 * K, [235, 220, 170]); disc4(fImg, ccx | 0, cy, 4 * K, [255, 236, 186]);
  for (let a = 0; a < 12; a++) put(fImg, ccx + Math.cos(a / 6 * Math.PI) * 3.4 * K, cy + Math.sin(a / 6 * Math.PI) * 3.4 * K, [60, 50, 50]);
  for (let i = 0; i < 3 * K; i++) put(fImg, ccx, cy - i, [30, 26, 40]); for (let i = 0; i < 2 * K; i++) put(fImg, ccx + i, cy, [30, 26, 40]);
  for (let y = cy + 12 * K; y < hz - 6 * K; y += 12 * K) rect4(fImg, ccx - K, y, 2 * K, 5 * K, rnd() < .4 ? [200, 170, 90] : [8, 10, 30]);
  for (let x = -6 * K; x < GW; x += R(8, 18) * K) if (Math.abs(x - ct) > 18 * K) block(x, R(10, 22) * K, R(8, 34) * K, CITY5, .3, hz + 6 * K, .28);
  // a row of zinc mansard roofs between the city and us: slopes with seams, dormers, chimney pots
  const ZINC = ramp('#0a0c24', '#141838', '#20264e', '#323a68', '#4c5684'), mb = hz + 30 * K, smokes = [];
  for (let x = R(-30, 0) * K; x < GW;) {
    const w = Math.round(R(36, 64) * K), top = Math.round(mb - R(14, 22) * K), x0 = Math.round(x), sl = 10 * K;
    for (let y = top; y < GH; y++) { const ins = y < top + sl ? Math.round((top + sl - y) * .55) : 0; for (let k = ins; k < w - ins; k++) { const seam = k % (3 * K) === 0 && y < top + sl; put(fImg, x0 + k, y, dith(ZINC, (y < top + sl ? .45 : .2) + (seam ? -.12 : 0) + (y === top ? .35 : 0) + (k === ins && lit < 0 || k === w - ins - 1 && lit > 0 ? .2 : 0) - (y - top) / (40 * K) * .2, x0 + k, y)); } }
    for (let d = x0 + 8 * K; d < x0 + w - 10 * K; d += R(12, 18) * K) { const on = rnd() < .45, dy = top + 3 * K; rect4(fImg, d, dy, 5 * K, 6 * K, ZINC[1]); for (let j = 0; j < 3 * K; j++) rect4(fImg, d + j * .8, dy - j, 5 * K - j * 1.6, 1, ZINC[3]); rect4(fImg, d + K, dy + K, 3 * K, 4 * K, on ? WARM[0] : [8, 10, 30]); if (on) wins.push([d + K, dy + K, 3 * K, 4 * K]); }
    const cx = Math.round(x0 + R(.15, .75) * w), ch = Math.round(R(8, 12) * K), cw = 7 * K;
    for (let j = 0; j < ch; j++) for (let k = 0; k < cw; k++) put(fImg, cx + k, top - j, dith(ramp('#1a0e1e', '#2e1a2c', '#4a2a3a'), .35 + (k < K && lit < 0 || k >= cw - K && lit > 0 ? .4 : 0) + ((j / (2 * K) | 0) % 2 && k % (3 * K) === 0 ? -.2 : 0), cx + k, top - j));
    for (let p = 0; p < 2; p++) { rect4(fImg, cx + K + p * 3 * K, top - ch - 2 * K, 2 * K, 2 * K, [120, 56, 40]); if (rnd() < .5) smokes.push([cx + 2 * K + p * 3 * K, top - ch - 2 * K, false]); }
    x += w + R(0, 3) * K;
  }
  // near: a big slate roof running down to us, rows of tiles growing as they come closer, a lit skylight, a ridge against the sky
  const gy = Math.round(GH * .75), SLATE = ramp('#06040e', '#0e0a1e', '#18122e', '#241c42', '#342a58', '#4a3e74');
  for (let y = gy; y < GH; y++) {
    const u = (y - gy) / (GH - gy), t = Math.sqrt(u) * 9, fr = t % 1, row = t | 0, tw2 = (4 + u * 6) * K;
    for (let x = 0; x < GW; x++) {
      const off = (row % 2) * tw2 / 2, joint = ((x + off) % tw2) < 1 + u * 1.5 && fr > .15, moonish = clamp(1 - Math.abs(x - mx) / (GW * .7));
      put(nImg, x, y, dith(SLATE, .3 + moonish * .15 + (fr < .12 ? .32 : 0) - (fr > .82 ? .18 : 0) + (joint ? -.28 : 0) - u * .15 + (fbm(x / (8 * K), row * 3, 2) - .5) * .12, x, y));
    }
  }
  for (let x = 0; x < GW; x++) for (let k = 0; k < 2 * K; k++) put(nImg, x, gy - k, k === 2 * K - 1 ? [110, 120, 180] : dith(SLATE, .45 + (x % (6 * K) < 1 ? -.2 : 0), x, gy - k));
  { const sx = Math.round((mx > GW / 2 ? R(.15, .35) : R(.65, .85)) * GW), sy = gy + Math.round((GH - gy) * .35), sw = 16 * K, sh = 9 * K;
    for (let j = -2 * K; j < sh + 2 * K; j++) for (let k = -3 * K; k < sw + 3 * K; k++) { const inside = j >= 0 && j < sh && k >= 0 && k < sw; if (!inside && bay(sx + k, sy + j) < .25) put(nImg, sx + k, sy + j, [90, 64, 50]); }
    for (let j = 0; j < sh; j++) for (let k = 0; k < sw; k++) { const frame = j < K || j >= sh - K || k < K || k >= sw - K || Math.abs(k - sw / 2) < K / 2; put(nImg, sx + k, sy + j, frame ? [30, 24, 44] : mix4([255, 210, 120], [200, 120, 70], j / sh)); }
    wins.push([sx + K, sy + K, sw / 2 - 1.5 * K, sh - 2 * K]); }
  // the houses that frame the view: plaster fronts, framed windows with sills, warm or dark, a cornice catching the moon
  const x0 = R(.1, .3) * GW | 0, x1 = R(.65, .9) * GW | 0, FACADE = ramp('#08061a', '#100c26', '#1a1434', '#261e44');
  const house = (x, w, hh, lt, side) => {
    for (let y = gy - hh; y < GH; y++) for (let k = 0; k < w; k++) put(nImg, x + k, y, dith(FACADE, .35 + (fbm((x + k) / (3 * K), y / (2 * K), 2) - .5) * .25 + (side === lit && (side > 0 ? k === w - 1 : k === 0) ? .3 : 0), x + k, y));
    for (let k = -K; k < w + K; k++) { put(nImg, x + k, gy - hh, [70, 76, 130]); put(nImg, x + k, gy - hh + 1, FACADE[3]); }
    for (let y = gy - hh + 5 * K; y < GH - 6 * K; y += 11 * K) for (let xx = x + 4 * K; xx < x + w - 7 * K; xx += 10 * K) {
      const on = rnd() < lt; rect4(nImg, xx - K, y - K, 6 * K, 8 * K, [10, 8, 22]);
      for (let j = 0; j < 6 * K; j++) for (let i = 0; i < 4 * K; i++) put(nImg, xx + i, y + j, on ? mix4(WARM[2], WARM[1], j / (6 * K)) : dith(ramp('#0a0c24', '#141c40', '#24305c'), .3 + (i + j < 2 * K ? .5 : 0), xx + i, y + j));
      rect4(nImg, xx + 2 * K, y, 1, 6 * K, [14, 10, 30]); rect4(nImg, xx, y + 3 * K, 4 * K, 1, [14, 10, 30]);
      rect4(nImg, xx - K, y + 6 * K, 6 * K, 1, [70, 66, 110]);
      if (on) wins.push([xx, y, 4 * K, 6 * K]);
    }
  };
  house(0, x0, 40 * K, .5, 1); house(x1, GW - x1, 50 * K, .5, -1);
  const chim = []; for (const x of [x0 + 20 * K, x1 - 30 * K, (x0 + x1) / 2 | 0]) {
    const h = 22 * K, cw = 8 * K;
    for (let j = 0; j < h; j++) for (let k = 0; k < cw; k++) put(nImg, x + k, gy - h + j, dith(ramp('#100814', '#1e1024', '#341a34', '#4e2a44'), .3 + (lit > 0 ? k >= cw - K : k < K) * .45 + ((j / (2 * K) | 0) % 2 === 0 && (k + (j / (2 * K) | 0) * 2 * K) % (4 * K) === 0 ? -.2 : 0) + (j % (2 * K) === 0 ? -.12 : 0), x + k, gy - h + j));
    rect4(nImg, x - K, gy - h - 2 * K, cw + 2 * K, 2 * K, [56, 40, 70]);
    for (const p of [1.5 * K, 4.5 * K]) { rect4(nImg, x + p, gy - h - 6 * K, 2 * K, 4 * K, [130, 60, 42]); rect4(nImg, x + p + (lit > 0 ? 1.5 * K : 0), gy - h - 6 * K, K / 2, 4 * K, [180, 96, 64]); chim.push([x + p + K, gy - h - 6 * K]); }
  }
  const cat = (x, y) => sprite4(nImg, ['.o..o...', '.oooo...', 'oowoow..', '.oooo...', '.ooooo..', 'oooooooo', 'oooooooo', 'oo.oo..o', 'oo.oo.oo'], x, y - 9 * K, K, {o: [8, 6, 18], w: [255, 230, 80]});
  const catX = (x0 + x1) / 2 + 24 * K | 0; cat(catX, gy - 2 * K);
  for (let j = 0; j < 9 * K; j++) put(nImg, catX + (lit > 0 ? 7 * K : 0), gy - 2 * K - 9 * K + j + K, [60, 64, 110]);  // moonlight on the cat's back
  const smoke = [], bats = flock5(5, hz * .1, hz * .6, '#06081a', .5, .9), all = chim.concat(smokes.map(([x, y]) => [x, y]));
  twinkles = makeTwinkles(GW * hz / (3000 * K * K), hz * .7);
  return {flares: false, shooters: true, draw: t => {
    bats(t);
    if (rnd() < .35) { const [x, y] = all[rnd() * all.length | 0]; smoke.push({x, y, a: .45, r: 1.5}); } for (const s of smoke) { s.y -= .35; s.x += .15 * lit * -1 + Math.sin(s.y / 9) * .15; s.r += .035; s.a -= .0035; fxc.globalAlpha = Math.max(0, s.a); fxc.fillStyle = '#9aa0c8'; fxc.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2); } while (smoke.length && smoke[0].a <= 0) smoke.shift();
    for (const [x, y, w, h] of wins) if (Math.sin(t / 1100 + x * .7 + y) > .985) { fxc.globalAlpha = 1; fxc.fillStyle = '#14182e'; fxc.fillRect(x, y, w, h); }
  }};
}

Object.assign(SCENES, {fuji, synthwave, cristaux, recif, banquise, chateau, mars, marais, vangogh, galion, foire, trounoir, bambou, lilas, jungle, rooftops});
