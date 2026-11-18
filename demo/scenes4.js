/* ---------- 22 more decors (Paramètres > Décor): Pâques, Plage, Pluie, Savane, Lavande, Automne, Orage, Fuji, Synthwave, Cristaux, Récif, Banquise, Château,
   Mars, Marais, Nuit étoilée, Galion, Fête foraine, Trou noir, Bambouseraie (scenes5.js) and two redrawn ones: Toits la nuit and Cascade.
   Built like scenes2.js / scenes3.js (1/S resolution, limited palettes, ordered dithering, far + near layers, an fx layer) but each in its own colours:
   they are listed in RAW_SCENES (index.html), so the colour themes do not recolour them. This file: the toolkit and the first decors. ---------- */
const hx4 = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
const sh4 = (c, k) => c.map(v => Math.max(0, Math.min(255, v * k | 0)));
const mix4 = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rect4 = (img, x, y, w, h, c) => { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(img, x + i, y + j, c); };
const disc4 = (img, cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) put(img, cx + x, cy + y, c); };
// gradient of a ramp from row y0 (value a) to row hz (value b), and below
function sky4(img, hz, rp, a = 0, b = 1, y0 = 0) { for (let y = y0; y < GH; y++) { const v = a + (b - a) * clamp((y - y0) / Math.max(1, hz - y0)); for (let x = 0; x < GW; x++) put(img, x, y, dith(rp, v, x, y)); } }
function stars4(img, maxY, n, rp = STAR) { for (let i = 0; i < n; i++) { const y = R(0, maxY); put(img, R(0, GW), y, rp[Math.floor(rnd() ** 4 * (rp.length - .01) * (1 - y / maxY * .7))]); } }
// a lit disc (sun, moon, planet) with a dithered halo: rp from dark to light, hr = halo radius
function sun4(img, cx, cy, r, rp, hr, flat) {
  cx = Math.round(cx); cy = Math.round(cy); const seed = R(0, 99);
  for (let y = -r - hr; y <= r + hr; y++) for (let x = -r - hr; x <= r + hr; x++) {
    const d = Math.hypot(x, y), X = cx + x, Y = cy + y;
    if (d <= r) put(img, X, Y, dith(rp, flat ? .9 - d / r * .1 : .95 - smooth(.55, .7, fbm(x / (r * .4) + seed, y / (r * .4), 3)) * .25 - (x + y) / r * .12, X, Y));
    else if (d < r + hr && BAYER[(Y & 3) * 4 + (X & 3)] < .6 * (1 - (d - r) / hr) ** 1.4) put(img, X, Y, rp[Math.min(2, rp.length - 1)]);
  }
}
// clouds: a noisy mask in a band of rows, lit from above
function clouds4(img, y0, y1, rp, thr, sc, seed, vt = .95, vb = .3, stretch = 3.2) {
  for (let y = Math.max(0, y0 | 0); y < Math.min(GH, y1); y++) for (let x = 0; x < GW; x++) {
    const n = fbm(x / (sc * stretch) + seed, y / sc + seed * .3, 4);
    if (n > thr) { const up = fbm(x / (sc * stretch) + seed, (y + 2.5 * K) / sc + seed * .3, 3); put(img, x, y, dith(rp, vb + (vt - vb) * clamp(.45 + (n - up) * 7 + (1 - (n - thr) * 3) * .1), x, y)); }
  }
}
// ground / hills / peaks under a noisy skyline, any palette; tex: grain size of a texture; rim: a lit top edge; returns the top row of each column
function land4(img, base, amp, sc, rp, v0, v1, o = {}) {
  const seed = R(0, 400), top = [], oct = o.oct || 5;
  for (let x = 0; x < GW; x++) {
    let n = fbm(x / sc + seed, seed, oct); if (o.sharp) n = (1 - Math.abs(2 * n - 1)) ** 1.5;
    const t = Math.round(base - amp * n); top[x] = t;
    for (let y = Math.max(0, t); y < GH; y++) {
      let v = v0 + (v1 - v0) * clamp((y - t) / (o.depth || GH * .45));
      if (o.rim && y - t < K) v += .2;
      if (o.tex) v += (fbm(x / (o.tex * K), y / (o.tex * K * .8), 2) - .5) * .3;
      put(img, x, y, dith(rp, v, x, y));
    }
  }
  return top;
}
// still water below row hz: the picture above, mirrored, dimmed, rippled and tinted
function reflect4(img, hz, dim, tint = [3, 5, 16]) {
  const d = img.data, s = R(0, 99);
  for (let y = hz; y < GH; y++) {
    const sy = Math.max(0, 2 * hz - y - 1), deep = (y - hz) / (GH - hz), q = dim * (1 - deep * .35);
    for (let x = 0; x < GW; x++) {
      const off = Math.round(Math.sin(y * .7 + s + fbm(x / (20 * K), y / (2 * K) + s, 2) * 4) * (1 + deep * 2 * K)), k = (sy * GW + Math.min(GW - 1, Math.max(0, x + off))) * 4;
      put(img, x, y, [Math.round(d[k] * q + tint[0]), Math.round(d[k + 1] * q + tint[1]), Math.round(d[k + 2] * q + tint[2])]);
    }
  }
}
// grass / reeds / blades standing on a profile (the array land4 returned)
function blades4(img, top, rp, n, h0, h1, v = .6) {
  for (let i = 0; i < n; i++) {
    const x = R(0, GW) | 0, h = R(h0, h1) * K, lean = R(-.35, .35), y0 = top[x] ?? GH - 1, c = rp[Math.min(rp.length - 1, Math.floor(clamp(v + R(-.3, .3)) * rp.length))];
    for (let j = 0; j < h; j++) put(img, x + lean * j * (1 + j / h), y0 - j, j > h * .8 ? rp[rp.length - 1] : c);
  }
}
// a round tree: trunk, then a noisy crown of leaves in a palette
function tree4(img, x, base, h, rp, trunk, crown = 1) {
  x = Math.round(x); const tw = Math.max(1, Math.round(h * .07)), ch = h * .62 * crown;
  for (let y = 0; y < h * .6; y++) for (let i = 0; i < tw; i++) put(img, x + i - (tw >> 1) + Math.round(Math.sin(y / 9) * .8), base - y, trunk);
  blob(img, x, base - h + ch * .5, ch * .95, ch * .62, rp, .25, .92, R(0, 99), .4);
}
// small flat shapes
const glyph4 = (rows, x, y, k, f) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') f(Math.round(x + i * k), Math.round(y + j * k), r[i]); });
const sprite4 = (img, rows, x, y, k, map) => glyph4(rows, x, y, k, (X, Y, ch) => { const c = map[ch]; if (c) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) put(img, X + a, Y + b, c); });
// particles on the fx layer: rain, snow, petals, leaves, embers… each one drifting down or up with a sway
function drift4(n, o) {
  const mk = first => ({x: R(0, GW), y: first ? R(0, GH) : R(-30, 0), s: R(.7, 1.3), p: R(0, 6.28), c: o.colors[rnd() * o.colors.length | 0]});
  const ps = Array.from({length: n}, () => mk(true));
  return t => {
    for (const p of ps) {
      p.y += o.vy * p.s; p.x += (o.vx || 0) * p.s + Math.sin(t / 700 + p.p) * (o.sway || 0);
      if (o.vy > 0 ? p.y > GH + 6 : p.y < -6) Object.assign(p, mk(false), o.vy > 0 ? {} : {y: GH + 4});
      if (p.x < -10) p.x = GW + 8; if (p.x > GW + 10) p.x = -8;
      const s = o.size || 1, a = o.alpha ?? .9;
      if (o.streak) for (let i = 0; i < o.streak; i++) fill(p.x - (o.vx || 0) * i * .7, p.y - o.vy * i * .7, p.c, a * (1 - i / o.streak));
      else { for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) fill(p.x + i, p.y + j, p.c, a); }
    }
  };
}

/* ---------- 1. Pâques: a pastel meadow, painted eggs hidden in the grass, a rabbit, tulips, butterflies ---------- */
const EGGC = ['#ff8fb8', '#ffd45e', '#7fd6ff', '#b69cff', '#7fe0a8', '#ff9e7a', '#ffffff', '#ffb0e0'];
function egg4(img, cx, by, h, pat, c1, c2, c3) {
  const r = h * .38, a = hx4(c1), b = hx4(c2), c = hx4(c3);
  for (let j = 0; j < h; j++) {
    const t = j / h, w = r * Math.sqrt(Math.max(0, 1 - ((t - .56) / .56) ** 2)) * (1 - .16 * (1 - t));  // wider at the bottom
    for (let i = -Math.ceil(w); i <= w; i++) {
      const X = cx + i, Y = by - h + j; let col = a;
      if (pat === 0 && j % 7 < 2) col = b;                                   // bands
      else if (pat === 1 && ((i + j * 2) % 8 + 8) % 8 < 2) col = b;           // zigzag
      else if (pat === 2 && (X * 7 + Y * 13) % 11 === 0) col = c;             // dots
      else if (pat === 3 && Math.abs(j - h * .5) < h * .09) col = b;          // one stripe + dots above
      else if (pat === 3 && j < h * .4 && ((i + 20) % 5 === 0) && j % 3 === 1) col = c;
      else if (pat === 4 && Math.abs(Math.sin(i * .9 + j * .3)) > .85) col = b; // waves
      const nx = i / Math.max(1, w), ny = (t - .5) * 2, l = -nx * .65 - ny * .45, lit = Math.abs(i) > w - 1 || j === h - 1 ? .7 : l > .45 ? 1.14 : l > -.05 ? 1 : l > -.5 ? .88 : .78;
      put(img, X, Y, sh4(col, lit));
    }
  }
  for (let k = 0; k < 3; k++) put(img, cx - Math.round(r * .45), by - Math.round(h * .76) + k, [255, 255, 255]); put(img, cx - Math.round(r * .45) + 1, by - Math.round(h * .76), [255, 255, 255]);
}
function paques(fImg, nImg) {
  const hz = Math.round(GH * R(.5, .56));
  sky4(fImg, hz + 10 * K, ramp('#7fa4ee', '#9ab4f4', '#b8c2f6', '#d8cdf6', '#f2d4ee', '#ffdcd8', '#ffe8c4', '#fff4d0'), 0, 1);
  const sunx = R(.68, .86) * GW, suny = hz * R(.5, .7), lit = 1;
  sun4(fImg, sunx, suny, 9 * K, ramp('#ffc85a', '#ffd878', '#ffe79c', '#fff3c4', '#fffbe6'), 16 * K, true);
  clouds4(fImg, hz * .06, hz * .8, ramp('#c8c0e6', '#dcd2f0', '#f0e6f8', '#fff4fb', '#ffffff'), .56, 13 * K, R(0, 99), .98, .35);
  land4(fImg, hz + 2 * K, 26 * K, 110 * K, ramp('#9a8cd0', '#aa9cd8', '#bcaee2', '#d0c6ee'), .1, .85, {depth: 30 * K});     // lavender hills far away
  const mint = land4(fImg, hz + 12 * K, 20 * K, 80 * K, ramp('#6cc4a0', '#82d2ac', '#9ee0bc', '#bcecce'), .2, .9, {depth: 40 * K, tex: 5});  // mint
  // orchards in bloom along the mint hills: small round trees, white, pink, a few fresh green
  const BLOOM = [ramp('#c88ab8', '#e0a8cc', '#f2c6de', '#fde2ee', '#ffffff'), ramp('#d0b8e0', '#e6d4ee', '#f6ecf8', '#ffffff'), ramp('#6cb070', '#88c884', '#a8dc9c', '#c8eeb8')];
  for (let x = R(0, 10) * K; x < GW; x += R(8, 20) * K) if (fbm(x / (60 * K), 7, 2) > .45) tree4(fImg, x, mint[Math.round(Math.min(GW - 1, x))] + R(3, 9) * K, R(10, 16) * K, BLOOM[rnd() < .2 ? 2 : rnd() * 2 | 0], [120, 96, 120]);
  const mid = land4(fImg, hz + 26 * K, 22 * K, 70 * K, ramp('#3f8a52', '#52a05e', '#6cb86c', '#88cc7c', '#a6dc8c'), .1, .9, {depth: GH * .5, tex: 4, rim: true});
  // a sandy path winding down through the meadow
  const px0 = R(.35, .65) * GW, pph = R(0, 6.28);
  for (let y = mid[Math.round(px0)]; y < GH; y++) { const q = (y - hz) / (GH - hz), c = px0 + Math.sin(q * 4 + pph) * GW * .12 * q, hw = (1 + q * 9) * K; for (let x = Math.round(c - hw); x <= c + hw; x++) { const e = Math.abs(x - c) / hw; put(fImg, x, y, e > .85 ? [150, 170, 110] : bay(x, y) < .15 ? [214, 196, 160] : [232, 216, 180]); } }
  // flowers in drifts, each drift mostly one colour, bigger as they come near
  const FC = ['#ffffff', '#ffd1e8', '#ffe36e', '#b9a6ff', '#ff9cc2', '#9fe0ff'].map(hx4), fs = R(0, 99);
  for (let i = 0; i < GW * GH / (40 * K * K); i++) {
    const x = R(0, GW) | 0, y = mid[x] + R(2, 70) * K * rnd(); if (y >= GH) continue;
    const m = fbm(x / (30 * K) + fs, y / (10 * K), 3); if (m < .5) continue;
    const c = FC[Math.floor(fbm(x / (70 * K) + fs, y / (30 * K) + 9, 2) * 12) % 6], q = (y - hz) / (GH - hz);
    if (q < .35) { put(fImg, x, y, c); continue; }
    put(fImg, x, y, c); put(fImg, x + 1, y, c); put(fImg, x - 1, y, c); put(fImg, x, y - 1, c); put(fImg, x, y + 1, sh4(c, .8)); put(fImg, x, y, [255, 214, 70]);
  }
  // in front: the grass, eggs hidden in it with their shadows, a wicker basket, tulips, the rabbit
  const top = land4(nImg, GH * .84, 18 * K, 60 * K, ramp('#2e7040', '#3c8650', '#4d9c5a', '#62b266', '#7ac676'), .05, .9, {depth: GH * .2, tex: 3, rim: true});
  const shadow = (cx, cy, rx, ry) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) put(nImg, cx + x, cy + y, [40, 100, 56]); };
  const rbx = Math.round(R(.2, .4) * GW), rby = top[rbx] + 8 * K, bkx = Math.round(R(.6, .8) * GW), bky = top[bkx] + 10 * K;
  for (let i = 0; i < 14; i++) {  // tulips: a cup of three petals on a curving stem, two broad leaves
    const x = R(0, GW) | 0, h = R(16, 28) * K, y0 = top[x] + R(4, 14) * K, c = hx4(['#ff5c8a', '#ffd23f', '#ff8a3d', '#ffffff', '#c06bff'][rnd() * 5 | 0]), bend = R(-2, 2) * K;
    if (Math.abs(x - rbx) < 16 * K || Math.abs(x - bkx) < 16 * K) continue;
    for (let j = 0; j < h; j++) put(nImg, x + bend * (j / h) ** 2, y0 - j, [60, 150, 70]);
    for (const s of [-1, 1]) { const L = h * R(.45, .6); for (let j = 0; j < L; j++) { const w = Math.sin(j / L * Math.PI) * 1.8 * K; for (let k = 0; k < w; k++) put(nImg, x + s * (k + j * .25), y0 - j, k > w - 1 ? [110, 196, 110] : [70, 166, 80]); } }
    const hx = x + bend, hy = y0 - h, cw = 3 * K, ch = 6 * K;
    for (let j = 0; j < ch; j++) { const hw = j < ch * .35 ? cw * (.7 + j / ch) : cw * Math.sqrt(1 - ((j - ch * .35) / (ch * .65)) ** 2); for (let k = -hw; k <= hw; k++) { const notch = j < K * 1.5 && Math.abs(Math.abs(k) - cw * .45) < K * .6; if (notch) continue; put(nImg, hx + k, hy - ch + j, sh4(c, Math.abs(k) < cw * .3 && j < ch * .6 ? 1.12 : k * lit > 0 ? 1.05 : .82)); } }
  }
  blades4(nImg, top, ramp('#1c5028', '#2a6636', '#3a8046', '#52a05a'), GW / 2, 5, 15, .55);
  const eggs = [];  // eggs hidden in the grass: never touching, the far ones drawn first, a tuft of grass in front of each
  for (let tries = 0; eggs.length < 8 && tries < 60; tries++) { const x = R(.04, .96) * GW | 0, h = R(11, 19) * K, y = top[x] + R(3, 14) * K; if (Math.abs(x - rbx - 2 * K) < 26 * K || Math.abs(x - bkx) < 22 * K || eggs.some(e => Math.abs(e.x - x) < (e.h + h) * .5 && Math.abs(e.y - y) < (e.h + h) * .7)) continue; eggs.push({x, y, h}); }
  eggs.sort((a, b) => a.y - b.y);
  for (const {x, y, h} of eggs) {
    shadow(x + 2 * K, y, h * .45, h * .12); egg4(nImg, x, y, h, rnd() * 5 | 0, EGGC[rnd() * 8 | 0], EGGC[rnd() * 8 | 0], '#ffffff');
    for (let i = 0; i < 7; i++) { const bx = x + R(-.5, .5) * h * .8, L = R(1.5, 4) * K, lean = R(-.4, .4); for (let j = 0; j < L; j++) put(nImg, bx + lean * j, y + K - j, j > L - K ? [98, 178, 102] : [58, 140, 74]); }
  }
  { const W = 18 * K, H = 9 * K, WK = [[120, 70, 36], [168, 108, 56], [206, 150, 86], [232, 190, 120]];  // the basket: woven sides, eggs heaped in it, a handle
    shadow(bkx + 3 * K, bky + K, W * .65, 2.5 * K);
    for (let i = 0; i < 3; i++) egg4(nImg, bkx + (i - 1) * 5 * K, bky - H + 3 * K + (i % 2) * K, R(8, 10) * K, rnd() * 5 | 0, EGGC[rnd() * 8 | 0], EGGC[rnd() * 8 | 0], '#ffffff');
    for (let y = 0; y < H; y++) { const hw = W / 2 - y * .25; for (let x = -hw; x <= hw; x++) { const weave = ((Math.floor((x + W) / (2 * K)) + Math.floor(y / (1.5 * K))) % 2), X = bkx + x | 0, Y = bky - H + y; put(nImg, X, Y, y < K ? WK[3] : WK[(x * lit > hw * .5 ? 2 : 1) + weave - (y > H - K ? 1 : 0)]); } }
    for (let a = Math.PI; a <= 2 * Math.PI; a += .01) for (let k = 0; k < K; k++) put(nImg, bkx + Math.cos(a) * (W / 2 - K), bky - H + Math.sin(a) * (W * .55) - k, k ? WK[1] : WK[2]);
    for (let a = 0; a < 6.28; a += .3) put(nImg, bkx + W * .3 + Math.cos(a) * K, bky - H - W * .5 + Math.sin(a) * K, [255, 140, 180]); }  // a ribbon on the handle
  { const F = [[255, 252, 248], [232, 226, 238], [196, 184, 212], [150, 136, 170]], r = 1;  // the rabbit, sitting in profile, lit by the sun from the right
    shadow(rbx + 3 * K, rby, 13 * K, 2.5 * K);
    const body = (cx, cy, rx, ry) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1) put(nImg, rbx + cx + x, rby + cy + y, F[d > .8 && x * lit < 0 ? 2 : (x * lit + -y) / (rx + ry) > .2 ? 0 : 1]); } };
    body(0, -8 * K, 10 * K, 8 * K);          // the body, round
    body(-6 * K, -5 * K, 6 * K, 5 * K);      // the haunch
    body(8 * K, -18 * K, 5.5 * K, 5 * K);    // the head, forward and up
    for (const [ex, back] of [[5 * K, 1], [8 * K, 0]]) for (let j = 0; j < 12 * K; j++) { const w = Math.sin((j + 2 * K) / (14 * K) * Math.PI) * 1.8 * K; for (let k = -w; k <= w; k++) put(nImg, rbx + ex - j * .25 + k, rby - 22 * K - j, back ? F[2] : Math.abs(k) < w * .45 && j > K && j < 10 * K ? [255, 186, 206] : F[k * lit > 0 ? 0 : 1]); }  // the ears, the far one in shade
    for (let y = -K; y <= K; y++) for (let x = -K; x <= K; x++) if (x * x + y * y <= K * K) put(nImg, rbx + 10 * K + x, rby - 19 * K + y, [44, 30, 52]);  // one eye, seen from the side
    put(nImg, rbx + 10 * K + K * .4, rby - 19 * K - K * .4, [255, 255, 255]);
    for (let k = 0; k < K; k++) { put(nImg, rbx + 13 * K + k, rby - 16.5 * K, [255, 140, 170]); put(nImg, rbx + 13 * K + k, rby - 16 * K, [255, 140, 170]); }  // the nose
    body(-12 * K, -6 * K, 2.5 * K, 2.5 * K);  // the tail
    for (let k = 0; k < 6 * K; k++) put(nImg, rbx + 4 * K + k, rby - K, F[2]);  // the front paw
  }
  const flies = Array.from({length: 5}, () => ({x: R(0, GW), y: R(hz, GH * .9), p: R(0, 6.28), c: ['#ff8fb8', '#ffd45e', '#7fd6ff', '#fff'][rnd() * 4 | 0]}));
  const petals = drift4(26, {colors: ['#ffd1e8', '#ffffff', '#ffe9f4'], vy: .35, vx: .25, sway: .5});
  const birds = Array.from({length: 4}, () => ({x: R(-50, GW), y: R(.08, .35) * hz, v: R(.35, .6), p: R(0, 6)}));
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    petals(t);
    for (const f of flies) { f.x += Math.sin(t / 900 + f.p) * .7 + .15; f.y += Math.cos(t / 700 + f.p * 2) * .5; if (f.x > GW + 5) f.x = -5; const up = Math.sin(t / 70 + f.p) > 0 ? 1 : 0; fill(f.x, f.y, f.c); fill(f.x - 1, f.y - up, f.c); fill(f.x + 1, f.y - up, f.c); fill(f.x - 2, f.y - 1 - up, f.c, .8); fill(f.x + 2, f.y - 1 - up, f.c, .8); }
    for (const b of birds) { b.x += b.v; if (b.x > GW + 10) b.x = -20; const up = Math.sin(t / 200 + b.p) > 0 ? 1 : 0; for (const [i, j] of [[0, 0], [-1, -up], [1, -up], [-2, -2 * up + 1], [2, -2 * up + 1]]) fill(b.x + i, b.y + j, '#6a5a98'); }
  }};
}

/* ---------- 2. Plage tropicale: a low sun, a glowing sea, waves rolling in, palms, a crab ---------- */
// a palm against the sunset: a curved trunk in rings with a warm rim on the sun's side, drooping fronds with leaflets, coconuts under the crown
function palm4(img, x, base, h, lean, sunL) {
  const TR = [[34, 20, 30], [52, 30, 38], [200, 110, 80]], LF = [[20, 26, 34], [30, 38, 46], [210, 120, 90]], pts = [];
  for (let i = 0; i <= h; i++) { const q = i / h; pts.push([x + lean * q * q * h * .45, base - i]); }
  for (let i = 0; i < pts.length; i++) { const [px, py] = pts[i], q = i / h, w = K * (2.6 - q * 1.2); for (let k = -w / 2; k <= w / 2; k++) put(img, px + k, py, k * sunL > w / 2 - 1 ? TR[2] : i % (2 * K) < 1 ? TR[0] : TR[1]); }
  const [tx, ty] = pts[pts.length - 1];
  for (let f = 0; f < 11; f++) {
    const a = -Math.PI + f * (Math.PI / 10) + R(-.12, .12), len = h * R(.42, .56), droop = R(1, 1.6);
    let prev = null;
    for (let i = 0; i < len; i++) {
      const q = i / len, X = tx + Math.cos(a) * i, Y = ty + Math.sin(a) * i * .55 + q * q * len * droop * .7;
      put(img, X, Y, LF[1]);
      if (i % 2 === 0 && q > .08) { const L = (1 - q * .7) * 5 * K + K, dir = Math.cos(a) < 0 ? -1 : 1; for (const s of [-1, 1]) for (let k = 1; k < L; k++) put(img, X - dir * k * .35, Y + s * k * .5 + k * .45, s < 0 && k < 2 ? (Math.cos(a) * sunL > 0 ? LF[2] : LF[1]) : LF[0]); }
      prev = [X, Y];
    }
  }
  for (const [i, j] of [[-1, 2], [1, 2], [0, 3]]) disc4(img, tx + i * 2 * K * .7, ty + j * K, K * 1.2, [60, 36, 30]);
}
function plage(fImg, nImg) {
  const hz = Math.round(GH * R(.5, .55)), SUN = ramp('#b03a28', '#e0602e', '#ff9a3c', '#ffc25e', '#ffe6a0', '#fff6d8');
  const SKYR = ramp('#2a2a78', '#4a3a8e', '#7a4a9a', '#b25a8c', '#e07a76', '#ff9a64', '#ffc27a', '#ffe0a0');
  sky4(fImg, hz, SKYR, 0, 1);
  const sx = R(.3, .7) * GW, sy = hz - 6 * K, sunL = sx < GW / 2 ? -1 : 1;
  sun4(fImg, sx, sy, 12 * K, SUN, 26 * K, true);
  clouds4(fImg, hz * .12, hz * .85, ramp('#5a2a6a', '#8e3e7a', '#c05a78', '#f08a74', '#ffc08a'), .58, 12 * K, R(0, 99), .9, .15);
  stars4(fImg, hz * .35, GW * GH / (400 * K * K));
  // two islands, the farther one paler, the near one with its crest lit and a few palms on it
  land4(fImg, hz, 6 * K, 90 * K, ramp('#5a3a7a', '#6a4486', '#7a4e90'), .2, .8, {depth: 10 * K, sharp: true});
  const isl = land4(fImg, hz, 14 * K, 60 * K, ramp('#241a50', '#321e5a', '#46266a'), .2, .8, {depth: 16 * K, sharp: true});
  for (let x = 0; x < GW; x++) if (isl[x] < hz - 2 * K) put(fImg, x, isl[x], [200, 110, 110]);
  // the sea: the sky's colours near the horizon, deeper blue toward the shore, crests of the swell catching the light, the sun's path
  const SEA = ramp('#10205a', '#1a3a82', '#2a5ea0', '#4a86b8', '#7ab4c8', '#ffd890', '#fff0c0');
  for (let y = hz; y < GH; y++) for (let x = 0; x < GW; x++) {
    const deep = (y - hz) / (GH * .5), glit = Math.exp(-(((x - sx) / (22 * K * (1 + deep * 2))) ** 2)) * (.45 + .55 * fbm(x / (5 * K), y / (1.1 * K), 2));
    put(fImg, x, y, deep < .12 && bay(x, y) < (.12 - deep) * 5 ? SKYR[5] : dith(SEA, clamp(.12 + (1 - deep) * .18 + glit * (.9 - deep * .4)), x, y));
  }
  for (let y = hz + 2 * K; y < GH; y += Math.max(3, Math.round((y - hz) / 6))) { const deep = (y - hz) / (GH - hz), L = (2 + deep * 12) * K; for (let x = R(0, L * 6); x < GW; x += R(L * 3, L * 9)) { const near = Math.abs(x - sx) < 30 * K * (1 + deep * 2); for (let k = 0; k < L; k++) put(fImg, x + k, y + Math.round(Math.sin(k / L * Math.PI) * -1), near ? SUN[5] : deep < .3 ? [200, 130, 140] : [80, 130, 190]); } }  // crests
  { const bx = (sx + (rnd() < .5 ? -1 : 1) * R(.18, .3) * GW), by = hz + 3 * K;  // a sailboat far out, a black shape against the glow
    for (let k = -5 * K; k <= 5 * K; k++) for (let j = 0; j < K + (Math.abs(k) < 4 * K ? K : 0); j++) put(fImg, bx + k, by - j, [30, 20, 50]);
    for (let j = 0; j < 14 * K; j++) { put(fImg, bx, by - 2 * K - j, [30, 20, 50]); for (let k = 1; k < (14 * K - j) * .5; k++) put(fImg, bx + k, by - 2 * K - j, [40, 26, 62]); for (let k = 1; k < (14 * K - j) * .25; k++) put(fImg, bx - k, by - 4 * K - j * .8, [40, 26, 62]); } }
  // the shore: lacy foam, a band of wet sand mirroring the sky, then dry sand rippled by the wind
  const shore = Math.round(GH * .78), sandRp = ramp('#7a5a40', '#a07a54', '#c89a6a', '#e4b884', '#f6d4a0'), top = [], fs = R(0, 99);
  for (let x = 0; x < GW; x++) {
    top[x] = Math.round(shore + Math.sin(x / (26 * K)) * 3 * K + fbm(x / (30 * K), 3, 3) * 6 * K);
    for (let y = top[x]; y < GH; y++) {
      const d = y - top[x], wet = d < 6 * K, rip = Math.sin((y + fbm(x / (20 * K), y / (8 * K), 2) * 6 * K) / (1.4 * K)) > .75;
      put(nImg, x, y, wet ? (Math.abs(x - sx) < (6 + d / K) * K && bay(x, y) < .5 ? SUN[4] : dith(ramp('#6a4a5a', '#8a5a64', '#b07a70', '#d09a80'), .3 + d / (6 * K) * .5 + (fbm(x / (8 * K), y / K, 2) - .5) * .3, x, y)) : dith(sandRp, .35 + d / (GH * .22) * .5 + (rip ? .12 : 0) + (fbm(x / (2 * K), y / (2 * K), 2) - .5) * .25, x, y));
    }
  }
  for (let x = 0; x < GW; x++) for (let k = -2 * K; k < 3 * K; k++) { const n = fbm(x / (3 * K) + fs, k / K + fs, 2); if (k < 0 ? n > .55 : n > .35 - k / (3 * K) * .1) put(nImg, x, top[x] - k, k > 2 * K ? [200, 225, 240] : [240, 250, 255]); }  // the foam, full of holes
  for (let x = 0; x < GW; x++) if (fbm(x / (12 * K) + fs, 9, 2) > .5) put(nImg, x, top[x] + 6 * K + Math.round(Math.sin(x / (14 * K)) * K), [214, 196, 186]);  // the line the last wave left
  // rocks at one end with the surf around them
  const rx = sunL > 0 ? R(.02, .12) * GW : R(.88, .98) * GW;
  for (let i = 0; i < 4; i++) { const cx = rx + R(-14, 14) * K, cy = top[Math.max(0, Math.min(GW - 1, cx | 0))] + R(-2, 4) * K, rr = R(5, 10) * K; for (let y = -rr * .8; y <= rr * .2; y++) for (let x = -rr; x <= rr; x++) { const d = (x / rr) ** 2 + (y / (rr * .8)) ** 2 + (fbm((cx + x) / (3 * K), (cy + y) / (3 * K), 2) - .5) * .6; if (d < 1) put(nImg, cx + x, cy + y, x * sunL > rr * .4 && y < 0 ? [170, 100, 90] : y > -K ? [36, 26, 40] : [62, 46, 62]); } for (let k = -rr - 2 * K; k <= rr + 2 * K; k++) if (bay(cx + k | 0, cy | 0) < .5) put(nImg, cx + k, cy + R(0, 2) * K, [240, 250, 255]); }
  // palms, backlit: ringed trunks with a warm rim, feathered fronds, coconuts
  const pS = sunL > 0 ? -1 : 1, px0 = pS < 0 ? R(.04, .2) * GW : R(.8, .96) * GW;
  palm4(nImg, px0, top[px0 | 0] + 8 * K, R(80, 96) * K, -pS * R(.5, .8), sunL);
  palm4(nImg, px0 + pS * -R(14, 22) * K, top[Math.max(0, Math.min(GW - 1, px0 + pS * -18 * K | 0))] + 10 * K, R(60, 72) * K, -pS * R(.8, 1.1), sunL);
  { const qx = R(.4, .6) * GW < sx ? R(.75, .9) * GW : R(.1, .25) * GW; if (Math.abs(qx - px0) > 50 * K) palm4(nImg, qx, top[qx | 0] + 6 * K, R(44, 56) * K, R(-.4, .4), sunL); }
  // shells, a starfish, footprints toward the water
  for (let i = 0; i < 30; i++) { const x = R(0, GW) | 0, y = top[x] + R(8, 30) * K; put(nImg, x, y, [240, 220, 200]); put(nImg, x + 1, y, [200, 160, 140]); }
  { const x = R(.3, .7) * GW, y = top[x | 0] + R(14, 22) * K; for (let a = 0; a < 5; a++) for (let k = 0; k < 3.5 * K; k++) { const an = a / 5 * 6.283 - 1.57; for (let w = -(1 - k / (3.5 * K)) * K; w <= (1 - k / (3.5 * K)) * K; w++) put(nImg, x + Math.cos(an) * k - Math.sin(an) * w, y + Math.sin(an) * k * .7 + Math.cos(an) * w * .7, k < K ? [250, 140, 90] : [230, 110, 80]); } }
  { let x = R(.3, .7) * GW; for (let y = GH - 2 * K, i = 0; y > shore + 8 * K; y -= R(5, 7) * K, i++) { x += R(-1, 1) * K; for (let j = 0; j < 1.5 * K; j++) for (let k = 0; k < K * (1 + (GH - y) / GH); k++) put(nImg, x + (i % 2 ? 3 * K : 0) + k, y + j, [150, 110, 80]); } }
  const crab = {x: R(.2, .8) * GW, d: 1, y: top[Math.round(R(.2, .8) * GW)] + 9 * K};
  const waves = Array.from({length: 4}, (_, i) => ({o: i * 1.6}));
  const birds = Array.from({length: 5}, () => ({x: R(0, GW), y: R(.15, .45) * hz, v: R(.3, .6), p: R(0, 6)}));
  twinkles = makeTwinkles(GW * hz / (3000 * K * K), hz * .4);
  return {flares: false, shooters: true, draw: t => {
    for (const w of waves) { const ph = (t / 2600 + w.o) % 6.4, y = hz + 6 * K + ph * ((shore - hz) / 6.4), a = Math.sin(ph / 6.4 * Math.PI) * .5; for (let x = 0; x < GW; x += 2) fill(x, y + Math.sin(x / (9 * K) + t / 700) * 1.4, '#e8f6ff', a); }
    for (let k = 0; k < 2; k++) for (let x = 0; x < GW; x += 3) { const y = hz + 2 + Math.floor(rnd() * (shore - hz)); if (rnd() < .02) fill(x, y, '#fff3c8', .8); }  // sparkles
    crab.x += crab.d * .25; if (crab.x < 0 || crab.x > GW) crab.d *= -1; const cx = crab.x | 0, cy = crab.y | 0;
    for (const [i, j] of [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, -1], [0, -1], [1, -1], [-3, -1], [3, -1]]) fill(cx + i, cy + j, '#d84a2a'); fill(cx - 1, cy - 2, '#fff'); fill(cx + 1, cy - 2, '#fff');
    for (const b of birds) { b.x += b.v; if (b.x > GW + 10) b.x = -20; const up = Math.sin(t / 220 + b.p) > 0 ? 1 : 0; for (const [i, j] of [[0, 0], [-1, -up], [1, -up], [-2, -2 * up + 1], [2, -2 * up + 1]]) fill(b.x + i, b.y + j, '#2a1a4a'); }
  }};
}

/* ---------- 3. Pluie sur la ville: a wet night street, neon signs mirrored in the puddles, rain, a lit window or two ---------- */
function pluie(fImg, nImg) {
  const NEON = [[255, 60, 140], [60, 220, 255], [255, 200, 60], [150, 90, 255], [80, 255, 160]], WARM = [[255, 200, 120], [255, 170, 90], [255, 226, 160]];
  const hz = Math.round(GH * .5), st = Math.round(GH * .78), curb = st + 7 * K;
  // a low sky lit from below by the city, heavy clouds
  sky4(fImg, hz, ramp('#04050e', '#080a1c', '#0e1228', '#161a36', '#222446', '#34325a', '#4a3e6a', '#66507a'), 0, 1);
  clouds4(fImg, 0, hz * .9, ramp('#080a18', '#101428', '#1a1e38', '#262a4a', '#3a3456'), .5, 16 * K, R(0, 99), .7, .1);
  // the far city, half lost in the rain: grey towers, a few dim windows, red lights on the tallest
  const blink = [];
  for (let x = R(-10, 0) * K; x < GW; x += R(8, 20) * K) { const w = Math.round(R(10, 22) * K), top = Math.round(hz - R(10, 60) * K); for (let y = top; y < st; y++) for (let X = x; X < x + w; X++) put(fImg, X, y, dith(ramp('#141830', '#1c2038', '#262844'), .5 - (y - top) / GH * .5, X | 0, y)); for (let y = top + 3 * K; y < st; y += 3 * K) for (let X = x + 2 * K; X < x + w - 2 * K; X += 3 * K) if (rnd() < .12) put(fImg, X, y, [120, 104, 90]); if (top < hz - 40 * K) { for (let j = 0; j < 8 * K; j++) put(fImg, x + w / 2, top - j, [40, 40, 66]); blink.push([x + w / 2 | 0, top - 8 * K]); } }
  mist4(fImg, hz - 10 * K, 30 * K, [60, 56, 90], .5);
  // the street front: facades of brick, stone and painted plaster, lit windows with curtains, shops with awnings and neon signs at street level
  const lights = [], neons = [], WALLS = [ramp('#1a0e14', '#26141a', '#341c22', '#44262a'), ramp('#12141c', '#1a1d28', '#242836', '#303446'), ramp('#0e1420', '#141c2c', '#1c2638', '#263246')];
  for (let x = R(-30, 0) * K; x < GW;) {
    const w = Math.round(R(44, 80) * K), x0 = Math.round(x), top = Math.round(GH * R(.12, .38)), wp = WALLS[rnd() * 3 | 0], brick = rnd() < .4;
    for (let y = top; y < st; y++) for (let X = x0; X < x0 + w; X++) { const j = y - top, mortar = brick && (j % (2 * K) === 0 || (X + (Math.floor(j / (2 * K)) % 2) * 2 * K) % (4 * K) === 0); put(fImg, X, y, X < x0 + K ? wp[3] : X >= x0 + w - K ? wp[0] : mortar ? wp[0] : dith(wp, .5 + (fbm(X / (4 * K), y / (8 * K), 2) - .5) * .4, X, y)); }
    // the roof: a cornice, then a slate mansard with dormers, or a flat roof with a water tank and chimneys
    for (let X = x0 - K; X < x0 + w + K; X++) for (let j = 0; j < 2 * K; j++) put(fImg, X, top + j, j ? wp[0] : wp[3]);
    if (rnd() < .45) { const mh = 10 * K; for (let j = 0; j < mh; j++) for (let X = x0 + j * .4; X < x0 + w - j * .4; X++) put(fImg, X, top - j, j % (2 * K) === 0 ? [20, 22, 36] : [34, 38, 58]); for (let X = x0 + 8 * K; X < x0 + w - 10 * K; X += 14 * K) { const on = rnd() < .35; for (let j = 0; j < 7 * K; j++) for (let k = 0; k < 5 * K; k++) put(fImg, X + k, top - 2 * K - j, j > 5 * K ? [44, 48, 70] : j > K && j < 5 * K && k >= K && k < 4 * K ? (on ? [200, 150, 90] : [30, 34, 56]) : [24, 26, 40]); } }
    else { for (let k = 0; k < 2; k++) { const cx = x0 + R(4, w / K - 8) * K; for (let j = 0; j < 6 * K; j++) for (let q = 0; q < 3 * K; q++) put(fImg, cx + q, top - j, j > 5 * K ? wp[3] : wp[1]); } if (rnd() < .6) { const tx = x0 + R(6, w / K - 16) * K; for (let j = 0; j < 9 * K; j++) for (let q = 0; q < 8 * K; q++) put(fImg, tx + q, top - 6 * K - j, j > 7 * K ? [30, 26, 34] : q % (2 * K) === 0 ? [36, 30, 34] : [50, 40, 42]); for (const q of [K, 6 * K]) for (let j = 0; j < 6 * K; j++) put(fImg, tx + q, top - j, [20, 18, 26]); } }
    // the floors: each building its own rhythm of windows; lintels and sills in stone, a few balconies, shutters on some; most windows dark and holding a little of the sky, a few lit with the curtains half drawn
    const ww = Math.round(R(4, 6)) * K, wh = Math.round(R(7, 10)) * K, gapX = ww + Math.round(R(4, 7)) * K, gapY = wh + Math.round(R(6, 8)) * K, shut = rnd() < .35, balc = rnd() < .4, n = Math.max(1, Math.floor((w - 6 * K) / gapX)), ox = x0 + Math.round((w - (n * gapX - (gapX - ww))) / 2);
    for (let y = top + 7 * K, floor = 0; y + wh < st - 28 * K; y += gapY, floor++) for (let i = 0; i < n; i++) {
      const X = ox + i * gapX, on = rnd() < .28, c = WARM[rnd() * 3 | 0], cur = R(.15, .4);
      for (let j = 0; j < wh; j++) for (let k = 0; k < ww; k++) {
        const u = k / ww, glow = 1 - Math.abs(u - .5) * 1.2 - j / wh * .3, sky = 1 - j / wh;
        put(fImg, X + k, y + j, on ? (u < cur || u > 1 - cur * .8 ? sh4(c, .5) : sh4(c, .6 + glow * .4)) : j < wh * .35 ? [30, 34, 56] : j < wh * .6 ? [20, 22, 40] : [14, 16, 28]);
      }
      if (ww > 4 * K) for (let j = 0; j < wh; j++) put(fImg, X + ww / 2, y + j, on ? sh4(c, .35) : [8, 10, 18]);  // the mullion
      for (let k = -K; k < ww + K; k++) { put(fImg, X + k, y - K, wp[3]); put(fImg, X + k, y + wh, [96, 100, 124]); }  // lintel and wet sill
      if (shut) for (const s of [-1, 1]) for (let j = 0; j < wh; j++) for (let k = 0; k < 2 * K; k++) put(fImg, s < 0 ? X - 2 * K - K + k : X + ww + K + k, y + j, j % (2 * K) === 0 ? [16, 24, 22] : [30, 46, 40]);
      if (balc && floor % 2 === 1 && i % 2 === 0) { for (let k = -2 * K; k < ww + 2 * K; k++) { put(fImg, X + k, y + wh + K, [70, 72, 92]); put(fImg, X + k, y + wh - 3 * K, [40, 42, 60]); if ((k + 2 * K) % (2 * K) === 0) for (let j = -3 * K; j < K; j++) put(fImg, X + k, y + wh + j, [40, 42, 60]); } }
      if (on && rnd() < .2) for (let j = Math.round(wh * .35); j < wh; j++) for (let k = Math.round(ww * .4); k < ww * .7; k++) if ((k - ww * .55) ** 2 + (j - wh * .45) ** 2 < 1.4 * K * K || j > wh * .6) put(fImg, X + k, y + j, sh4(c, .3));  // someone at the window
    }
    // the shop: a lit window, a door, a striped awning, sometimes a neon sign
    const sc = rnd() < .3 ? NEON[rnd() * 5 | 0] : WARM[rnd() * 3 | 0], sx0 = x0 + 4 * K, sw = w - 16 * K;
    for (let y = st - 18 * K; y < st - 2 * K; y++) for (let X = sx0; X < sx0 + sw; X++) { const mull = (X - sx0) % (8 * K) < 1; const shelf = (y - st + 18 * K) % (5 * K) < K && (X - sx0) % (8 * K) > K; put(fImg, X, y, mull ? wp[0] : shelf ? sh4(sc, .25) : dith([sh4(sc, .25), sh4(sc, .45), sh4(sc, .65), sh4(sc, .85)], .85 - (y - st + 18 * K) / (16 * K) * .5 + (fbm(X / (3 * K), y / (3 * K), 2) - .5) * .4, X, y)); }
    for (let y = st - 16 * K; y < st; y++) for (let X = sx0 + sw + 2 * K; X < sx0 + sw + 8 * K; X++) put(fImg, X, y, y < st - 15 * K ? wp[3] : [16, 12, 18]);
    const ac = NEON[rnd() * 5 | 0];
    for (let j = 0; j < 5 * K; j++) for (let X = sx0 - K - j * .5; X < sx0 + sw + K + j * .5; X++) put(fImg, X, st - 23 * K + j, j === 5 * K - 1 ? [20, 16, 24] : (Math.floor((X - sx0) / (3 * K)) % 2) ? sh4(ac, .45) : [200, 200, 210].map(v => v * .5 | 0));
    lights.push([sx0 + sw / 2, sw * .45, sc, .45]);
    if (rnd() < .65) {  // a neon sign: a glowing outline, a shape inside
      const nc = NEON[rnd() * 5 | 0], nw = R(14, 24) * K, nh = 8 * K, nx = x0 + R(6, w - nw - 6), ny = st - 23 * K - nh - 5 * K;
      for (let j = -3 * K; j < nh + 3 * K; j++) for (let k = -3 * K; k < nw + 3 * K; k++) { const out = Math.max(-j, j - nh, -k, k - nw, 0); if (out > 0 && bay(nx + k | 0, ny + j) < .3 * (1 - out / (3 * K))) put(fImg, nx + k, ny + j, sh4(nc, .5)); }
      for (let k = 0; k < nw; k++) { put(fImg, nx + k, ny, nc); put(fImg, nx + k, ny + nh - 1, nc); } for (let j = 0; j < nh; j++) { put(fImg, nx, ny + j, nc); put(fImg, nx + nw - 1, ny + j, nc); }
      const shp = rnd() * 3 | 0, cx = nx + nw / 2, cy = ny + nh / 2;
      if (shp === 0) for (let a = 0; a < 6.28; a += .1) put(fImg, cx + Math.cos(a) * 2.5 * K, cy + Math.sin(a) * 2.5 * K, [255, 255, 255]);
      else if (shp === 1) for (let k = -nw * .3; k < nw * .3; k++) put(fImg, cx + k, cy + Math.sin(k / K) * K, [255, 255, 255]);
      else for (let k = 0; k < 3 * K; k++) { put(fImg, cx - 3 * K + k * 2, cy - k * .7, [255, 255, 255]); put(fImg, cx - 3 * K + k * 2, cy + k * .7, [255, 255, 255]); }
      neons.push([nx, ny, nw, nh, nc]); lights.push([cx, nw * .4, nc, .6]);
    }
    x += w + R(0, 4) * K;
  }
  // the pavement and the road, wet: slabs, the kerb, each light drawn down into the asphalt in broken vertical streaks
  for (let y = st; y < GH; y++) for (let x = 0; x < GW; x++) {
    const side = y < curb, n = fbm(x / (9 * K), y / (2 * K), 2);
    put(nImg, x, y, side ? ((x % (14 * K) < 1 || (y - st) === 4 * K) ? [20, 22, 34] : dith(ramp('#181a28', '#22243a', '#2c2e48', '#3a3c58'), .4 + (n - .5) * .3, x, y)) : y < curb + K ? [96, 100, 130] : dith(ramp('#04050c', '#0a0c18', '#12162a', '#1c2038', '#2a2e4a'), .2 + (y - curb) / (GH - curb) * .25 + (n - .5) * .3, x, y));
  }
  for (const [lx, w0, c, a0] of lights) for (let y = st + K; y < GH; y++) { const q = (y - st) / (GH - st), w = w0 * (.4 + q * .5), a = a0 * (1 - q * .7); for (let x = -w; x <= w; x++) { const streak = fbm((lx + x) / (1.2 * K), y / (5 * K), 2); if (bay(lx + x | 0, y) < a * (1 - Math.abs(x) / w) * (streak > .5 ? 1 : .2)) put(nImg, lx + x, y, sh4(c, y < curb ? .6 : .75)); } }
  for (let x = R(0, 20) * K; x < GW; x += 40 * K) for (let k = 0; k < 18 * K; k++) for (let j = 0; j < K; j++) put(nImg, x + k, Math.round(GH * .93) + j, [90, 92, 110]);  // the lane markings
  // street lamps with a pool of light under them, a passer-by under an umbrella, a parked car with its tail lights
  const lamps = [];
  for (let x = R(30, 80) * K; x < GW; x += R(150, 220) * K) {
    const lx = Math.round(x), top = st - 64 * K;
    for (let y = top; y < curb; y++) for (let k = 0; k < 1.5 * K; k++) put(nImg, lx + k, y, [14, 16, 28]);
    for (let k = -8 * K; k < K; k++) put(nImg, lx + k, top - Math.round(Math.abs(k) * .1), [14, 16, 28]);
    for (let j = 0; j < 2 * K; j++) for (let k = -10 * K; k < -5 * K; k++) put(nImg, lx + k, top + j, j ? [255, 230, 170] : [24, 26, 40]);
    lamps.push([lx - 7.5 * K, top + 2 * K]);
    for (let y = st; y < curb + 6 * K; y++) for (let k = -20 * K; k < 20 * K; k++) { const d = Math.hypot(k / (20 * K), (y - st - 3 * K) / (6 * K)); if (d < 1 && bay(lx - 7 * K + k | 0, y) < (1 - d) * .45) put(nImg, lx - 7 * K + k, y, [150, 130, 100]); }
    lights.push([lx - 7 * K, 6 * K, [255, 220, 150], .5]);
  }
  { const [lx] = lamps[rnd() * lamps.length | 0] || [GW / 2], px = lx + R(8, 20) * K, py = st + 5 * K;  // the passer-by
    for (let y = 0; y < 16 * K; y++) { const hw = y < 3 * K ? 1.5 * K : y < 12 * K ? 2.5 * K + (y - 3 * K) * .15 : K; for (let k = -hw; k <= hw; k++) if (!(y >= 12 * K && Math.abs(k) < K * .5)) put(nImg, px + k, py - 16 * K + y, [10, 10, 18]); }
    for (let y = 0; y < 6 * K; y++) for (let k = -9 * K; k <= 9 * K; k++) if ((k / (9 * K)) ** 2 + ((6 * K - y) / (6 * K)) ** 2 <= 1) put(nImg, px + k, py - 24 * K + y, y < K ? [60, 50, 80] : k < -6 * K ? [40, 30, 60] : [22, 18, 36]);
    for (let j = 0; j < 8 * K; j++) put(nImg, px, py - 18 * K + j, [10, 10, 18]); }
  { const cx = R(.2, .8) * GW, cy = curb + 16 * K, cw = 46 * K;  // the car
    for (let y = 0; y < 10 * K; y++) for (let k = 0; k < cw; k++) { const roof = y < 5 * K; if (roof && (k < 10 * K + y * .4 || k > cw - 8 * K - y * .3)) continue; put(nImg, cx + k, cy - 10 * K + y, roof && y > K && k > 13 * K && k < cw - 11 * K ? [50, 60, 96] : y === 0 || y === 5 * K ? [110, 120, 160] : y < 7 * K ? [34, 30, 54] : [22, 20, 36]); }
    for (const wx of [8 * K, cw - 9 * K]) for (let y = -3 * K; y <= 3 * K; y++) for (let k = -3 * K; k <= 3 * K; k++) if (y * y + k * k <= 9 * K * K) put(nImg, cx + wx + k, cy + y, [6, 6, 10]);
    for (let j = 0; j < 2 * K; j++) for (let k = 0; k < 2 * K; k++) put(nImg, cx + k, cy - 5 * K + j, [255, 50, 60]);
    lights.push([cx + K, 2 * K, [255, 50, 60], .6]);
    for (let y = cy + 3 * K; y < GH; y++) for (let k = -2 * K; k < 3 * K; k++) if (bay(cx + k | 0, y) < .5 * (1 - (y - cy) / (GH - cy))) put(nImg, cx + k, y, [180, 40, 50]); }
  const rain = drift4(260, {colors: ['#7a90c8', '#9ab0e0', '#5a70a8'], vy: 7, vx: -1.4, streak: 5, alpha: .5}), rip = [];
  const flick = neons[rnd() * neons.length | 0];
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    rain(t);
    for (const [lx, ly] of lamps) for (let i = 0; i < 10; i++) { const d = R(0, 1), y = ly + d * (st - ly), x = lx + R(-1, 1) * d * 18 * K; fxc.globalAlpha = .5 * (1 - d * .6); fxc.fillStyle = '#fff0c8'; fxc.fillRect(x | 0, y | 0, 1, 3 * K); }  // rain caught in the lamp light
    for (const [x, y] of blink) if (Math.sin(t / 600 + x) > .3) fill(x, y, '#ff3040');
    if (flick && Math.sin(t / 90) * Math.sin(t / 37) > .6) { fxc.globalAlpha = .7; fxc.fillStyle = '#05060e'; fxc.fillRect(flick[0], flick[1], flick[2], flick[3]); }  // one sign stutters
    if (rnd() < .6) rip.push({x: R(0, GW), y: R(st + 4, GH), r: 0, a: .6});
    for (const r of rip) { r.r += .25; r.a -= .02; for (let a = 0; a < 6.28; a += .5) fill(r.x + Math.cos(a) * r.r * 2.2, r.y + Math.sin(a) * r.r * .5, '#9ab0e0', Math.max(0, r.a)); }
    while (rip.length && rip[0].a <= 0) rip.shift();
    if (rnd() < .0025) { fxc.globalAlpha = .12; fxc.fillStyle = '#c8d8ff'; fxc.fillRect(0, 0, GW, GH); }  // far lightning
  }};
}

// silhouettes for the savanna: shapes are gathered as sets of pixels, then painted dark with a rim of light on the top and on the side facing the sun
function add4(S, X, Y) { X = Math.round(X); Y = Math.round(Y); if (X >= 0 && X < GW && Y >= 0 && Y < GH) S.add(Y * GW + X); }
function seg4(S, x0, y0, x1, y1, w0, w1) {
  const L = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= L; i += .5) {
    const q = i / L, px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q, r = (w0 + (w1 - w0) * q) / 2;
    add4(S, px, py); for (let a = -r; a <= r; a += .5) for (let b = -r; b <= r; b += .5) if (a * a + b * b <= r * r + .3) add4(S, px + a, py + b);
  }
}
function sil4(img, S, c, rim, sx) {
  for (const p of S) { const X = p % GW, Y = p / GW | 0, sd = X < sx ? 1 : -1; put(img, X, Y, rim && (!S.has(p - GW) || !S.has(p - K * GW) && rnd() < .5 || !S.has(p + sd)) ? rim : c); }
}
// an umbrella-thorn acacia: a trunk that forks into a fan of limbs, the crown a few flat slabs with gaps of sky
function acacia4(S, x, base, h) {
  const lean = R(-.2, .2) * h, tw = Math.max(K, h * .05), fork = base - h * R(.38, .5), fx = x + lean * .5, cw = h * R(.95, 1.25), cy = base - h;
  seg4(S, x, base, fx, fork, tw * 1.3, tw);
  const n = R(3, 6) | 0;
  for (let i = 0; i < n; i++) { const tx = fx + lean * .5 + (i / (n - 1) - .5) * cw * .75 + R(-.04, .04) * cw, ty = cy + R(.04, .14) * h, mx = (fx + tx) / 2 + R(-.05, .05) * h, my = (fork + ty) / 2 - h * .04; seg4(S, fx, fork, mx, my, tw * .8, tw * .55); seg4(S, mx, my, tx, ty, tw * .55, Math.max(1, tw * .3)); }
  for (let l = 0; l < 3; l++) {
    const lw = cw * (1 - l * .25) * .5, ly = cy + h * .05 - l * h * .075, lx = fx + lean * .5 + R(-.1, .1) * cw, th = h * R(.07, .1), sd = R(0, 99);
    for (let X = -lw; X <= lw; X++) {
      const e = 1 - (X / lw) ** 2; if (e <= 0) continue;
      const tH = th * (.35 + .65 * Math.sqrt(e)) * (.6 + .8 * fbm(X / (3 * K) + sd, sd, 2)), bH = th * .45 * Math.sqrt(e) * (.5 + fbm(X / (4 * K) + sd, 3 + sd, 2));
      for (let j = -tH; j <= bH; j++) if (Math.abs(j) < th * .3 || fbm((lx + X) / (1.6 * K) + sd, (ly + j) / K, 2) > .32) add4(S, lx + X, ly + j);
    }
  }
}
// a giraffe in profile, d = facing direction; graze bends the neck down toward a tree or the grass
function giraffe4(S, x, base, s, d, graze) {
  const g = (u0, v0, u1, v1, w0, w1) => seg4(S, x + d * u0 * s, base - v0 * s, x + d * u1 * s, base - v1 * s, w0 * s, w1 * s);
  for (const [u, ph] of [[-.75, .14], [-.5, -.12], [.55, .1], [.8, -.08]]) { g(u, 3, u + ph, 1.5, .3, .15); g(u + ph, 1.5, u + ph * .4, 0, .13, .11); }
  g(-.85, 3.1, .85, 3.45, 1.1, 1.25); g(-.95, 3.25, -1.15, 2.1, .07, .05);
  const hx = graze ? 2.3 : 1.6, hy = graze ? 4.3 : 5.8;
  g(.65, 3.6, hx, hy, .8, .28); g(hx, hy, hx + .5 * (graze ? .6 : 1), hy - .35, .34, .2);
  g(hx - .05, hy + .15, hx - .1, hy + .5, .09, .09); g(hx - .22, hy + .1, hx - .3, hy + .45, .09, .09); g(hx - .1, hy, hx - .5, hy + .08, .14, .05);
}
// an elephant in profile; drink lowers the trunk to the water
function elephant4(S, x, base, s, d, drink) {
  const g = (u0, v0, u1, v1, w0, w1) => seg4(S, x + d * u0 * s, base - v0 * s, x + d * u1 * s, base - v1 * s, w0 * s, w1 * s);
  for (const u of [-.7, -.4, .35, .62]) g(u, 1.3, u + R(-.05, .05), 0, .4, .36);
  g(-.75, 1.95, .55, 2.05, 1.55, 1.5); g(-.2, 2.5, .2, 2.55, .7, .7);
  g(.85, 2.45, 1.05, 2.15, .95, .75); g(.62, 2.55, .58, 1.6, .7, .45);
  if (drink) { g(1.2, 2, 1.45, 1.1, .34, .24); g(1.45, 1.1, 1.55, -.1, .24, .18); } else { g(1.2, 2, 1.35, 1, .34, .24); g(1.35, 1, 1.45, .4, .24, .18); g(1.45, .4, 1.6, .45, .18, .16); }
  g(-.97, 2.3, -1.06, 1.3, .07, .07);
}
/* ---------- 4. Savane: a huge sun sinking behind barred clouds, Kilimanjaro's snows, acacias, giraffes and elephants at a water hole ---------- */
function savane(fImg, nImg) {
  const hz = Math.round(GH * R(.6, .64)), sx = R(.36, .64) * GW, sy = hz - R(6, 14) * K;
  const SKYR = ramp('#2e1648', '#4e1e56', '#7a2858', '#ac3a50', '#d85a3e', '#f48234', '#ffaa3e', '#ffd06a', '#fff0b0');
  sky4(fImg, hz, SKYR, 0, 1);
  clouds4(fImg, hz * .08, hz * .62, ramp('#3a1648', '#6a2452', '#a83c50', '#e07048', '#ffb064'), .62, 11 * K, R(0, 99), .95, .1, 5);
  sun4(fImg, sx, sy, 28 * K, ramp('#c03a1e', '#e8622a', '#ff8e34', '#ffb84a', '#ffe08a'), 40 * K, true);
  for (let i = 0; i < 4; i++) {  // long thin bars of cloud across the sun's face
    const by = sy + R(-.8, .5) * 26 * K | 0, bl = R(70, 160) * K, bx = sx + R(-50, 50) * K - bl / 2, th = R(1.2, 3) * K;
    for (let x = bx; x < bx + bl; x++) { const tp = 1 - ((x - bx) / bl * 2 - 1) ** 4; for (let j = 0; j < th * tp; j++) put(fImg, x, by + j, j < K && Math.abs(x - sx) < 30 * K ? [255, 196, 110] : j < K ? [210, 90, 70] : [130, 40, 64]); }
  }
  // Kilimanjaro: a broad flat-topped mountain away from the sun, snowfields catching the last pink light
  const mx = sx < GW / 2 ? R(.7, .86) * GW : R(.14, .3) * GW, MW = R(.2, .27) * GW, MH = R(.2, .26) * hz, ms = R(0, 99), lit = mx < sx ? 1 : -1;
  const ROCK = ramp('#4a2050', '#5e2a5e', '#72366a', '#884676');
  for (let x = Math.max(0, mx - MW | 0); x < Math.min(GW, mx + MW); x++) {
    const u = Math.abs(x - mx) / MW, h = MH * Math.min(1, Math.max(0, 1 - u) ** 1.8 * 1.4) + (fbm(x / (6 * K) + ms, ms, 3) - .5) * 4 * K, t = hz - h;
    for (let y = Math.max(0, t | 0); y < hz; y++) {
      const f = clamp(.5 + (x - mx) * lit / MW * 2.2), snow = h > MH * .55 && y - t < (h - MH * .55) * .9 + (fbm(x / (2 * K) + ms, y / (6 * K), 3) - .45) * 8 * K;
      put(fImg, x, y, snow ? dith([[110, 72, 124], [150, 100, 150], [200, 130, 160], [240, 170, 170], [255, 206, 186]], .1 + f * .75 + (1 - (y - t) / (MH * .3)) * .15, x, y) : dith(ROCK, .15 + f * .35 + (y - t) / MH * .3 + (fbm(x / (3 * K), y / (5 * K), 2) - .5) * .3, x, y));
    }
  }
  // a hazy line of far land with tiny acacias on it, then the plain glowing under the sun
  land4(fImg, hz, 5 * K, 60 * K, ramp('#5a2654', '#6a2e5a', '#7a385e'), .3, .8, {depth: 10 * K});
  const far = new Set(); for (let i = 0; i < 12; i++) acacia4(far, R(0, GW), hz + R(0, 3) * K, R(6, 12) * K); sil4(fImg, far, [84, 40, 76], null, sx);
  const PL = ramp('#3a1a2c', '#562632', '#783634', '#a05036', '#c87040', '#ec9c50', '#ffcc7a', '#ffe8a8');
  for (let y = hz + 3 * K; y < GH; y++) for (let x = 0; x < GW; x++) {
    const d = (y - hz) / (GH - hz), glow = Math.exp(-(((x - sx) / (90 * K * (1 + d))) ** 2)) * Math.max(0, 1 - d * 2.4);
    put(fImg, x, y, dith(PL, .62 - d * .5 + glow * .4 + (fbm(x / (16 * K), y / (2 * K), 3) - .5) * .25, x, y));
  }
  // the water hole below the sun, mirroring it
  const wx = sx + R(-.12, .12) * GW, wy = hz + R(18, 26) * K, rx = R(55, 80) * K, ry = rx * .11, ws = R(0, 99);
  const inW = (X, Y) => ((X - wx) / rx) ** 2 + ((Y - wy) / ry) ** 2 < .85 + (fbm(X / (5 * K) + ws, ws, 2) - .5) * .5;
  for (let y = wy - ry * 1.3 | 0; y < wy + ry * 1.3; y++) for (let x = wx - rx * 1.3 | 0; x < wx + rx * 1.3; x++) if (inW(x, y)) {
    const glow = Math.exp(-(((x - sx) / (16 * K)) ** 2)), rip = Math.sin(y * 1.7 + fbm(x / (6 * K), y, 2) * 6) > .7;
    put(fImg, x, y, dith(SKYR, .55 + glow * .45 - (y - wy + ry) / ry * .12 - (rip ? .15 : 0), x, y));
  }
  // a family of elephants drinking on the far bank, their reflections in the water
  const ele = new Set(), ed = rnd() < .5 ? 1 : -1, eb = wy - ry * .8;
  for (let i = 0; i < 3; i++) { const s = (i === 2 ? R(3, 3.6) : R(5, 6)) * K; elephant4(ele, wx - ed * (rx * .5 - i * 3.4 * 5.5 * K), eb + (i === 2 ? K : 0), s, -ed, i !== 1); }
  for (const p of ele) { const X = p % GW, Y = p / GW | 0, Y2 = 2 * eb - Y; if (inW(X, Y2) && Y2 % 2 && Y2 - eb < 3 * ry) put(fImg, X, Y2, [150, 60, 64]); }
  sil4(fImg, ele, [40, 16, 34], [255, 170, 90], sx);
  // acacias across the plain, giraffes among them, one reaching into a crown
  const mid = new Set(), trees = [];
  for (let i = 0; i < 4; i++) { let x = R(.04, .96) * GW; if (Math.abs(x - wx) < rx + 20 * K) x = (x + GW * .5) % GW; const b = hz + R(4, 12) * K, h = R(26, 42) * K; acacia4(mid, x, b, h); trees.push([x, b, h]); }
  { const [tx, tb, th] = trees[rnd() * trees.length | 0], gd = tx < GW / 2 ? -1 : 1; giraffe4(mid, tx + gd * th * R(.4, .55), tb + 2 * K, th * .14, -gd, false); }
  const gd = wx < GW / 2 ? 1 : -1; let gx = wx + gd * (rx + R(20, 40) * K);
  for (let i = 0; i < 3; i++) { giraffe4(mid, gx, hz + R(10, 16) * K, R(4.6, 6) * K * (i === 2 ? .7 : 1), gd, i === 1); gx += gd * R(14, 22) * K; }
  sil4(fImg, mid, [46, 18, 34], [255, 160, 84], sx);
  // the near bank: a big acacia and a termite mound at the edges, tall grass with seed heads lit from behind
  const top = land4(nImg, GH * .88, 8 * K, 60 * K, ramp('#140810', '#1e0c14', '#2a1018', '#361418'), .1, .8, {depth: 30 * K, tex: 3});
  const fore = new Set(), side = rnd() < .5, ax = side ? R(.04, .16) * GW : R(.84, .96) * GW;
  acacia4(fore, ax, top[ax | 0] + 6 * K, R(80, 96) * K);
  { const tx = (side ? R(.82, .94) : R(.06, .18)) * GW, b = top[tx | 0] + 4 * K, mh = R(20, 30) * K, mw = R(8, 11) * K, sd = R(0, 99);
    for (let j = 0; j < mh; j++) { const q = j / mh, w = mw * (1 - q) ** .7 * (.8 + .4 * fbm(j / (3 * K) + sd, sd, 2)), o = Math.sin(q * 3 + sd) * 2 * K; for (let k = -w; k <= w; k++) add4(fore, tx + o + k, b - j); }
    seg4(fore, tx + mw * .5, b - mh * .4, tx + mw * .9, b - mh * .7, 3 * K, K); }
  sil4(nImg, fore, [20, 8, 14], [255, 176, 90], sx);
  for (let i = 0; i < GW * .45; i++) {
    const x = R(0, GW) | 0, h = R(8, 26) * K, lean = R(-.7, .7), y0 = top[x] + R(0, 4) * K, near = Math.abs(x - sx) < GW * .3, tip = near ? [255, 196, 100] : [210, 120, 70];
    for (let j = 0; j < h; j++) { const q = j / h; put(nImg, x + lean * q * q * h * .5, y0 - j, q > .82 ? tip : [34 + q * 30 | 0, 14 + q * 10 | 0, 18]); }
    if (rnd() < .3) { const hx = x + lean * h * .5, hy = y0 - h; for (let k = 0; k < 3 * K; k++) { put(nImg, hx + lean * k * .4, hy - k, tip); if (k % 2 === 0) put(nImg, hx + lean * k * .4 + 1, hy - k + 1, near ? [255, 220, 150] : tip); } }
  }
  const herd = Array.from({length: 16}, (_, i) => ({x: -i * R(8, 14) * K, y: hz + 5 * K + R(-1, 1) * K, l: R(0, 6)}));
  const WB = ['......o.o..', '..ooooooo..', '.oooooooooo', 'o.ooooo..oo', '..o.o.o.o..', '.o..o..o.o.'];
  const flock = Array.from({length: 9}, (_, i) => ({u: (i + 1 >> 1) * (i % 2 ? 1 : -1)})), fl = {x: R(0, GW), y: R(.15, .35) * hz};
  const dust = drift4(60, {colors: ['#ffd890', '#ffb868', '#fff0c0'], vy: -.08, vx: .25, sway: .25, alpha: .4});
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    dust(t);
    for (const h of herd) { h.x += .14; if (h.x > GW + 30) h.x = -40 - R(0, 60); const st = Math.sin(h.x / 2 + h.l) > 0 ? 4 : 5; for (let j = 0; j < 5; j++) { const row = j < 4 ? WB[j] : WB[st]; for (let i = 0; i < row.length; i++) if (row[i] === 'o') fill(h.x + i, h.y - 5 + j, '#3a1426'); } }
    fl.x += .3; if (fl.x > GW + 40) fl.x = -40;
    for (const b of flock) { const x = fl.x - Math.abs(b.u) * 5, y = fl.y + b.u * 3, up = Math.sin(t / 240 + b.u) > 0 ? 1 : 0; for (const [i, j] of [[0, 0], [-1, -up], [1, -up], [-2, 1 - 2 * up], [2, 1 - 2 * up]]) fill(x + i, y + j, '#2a1022'); }
  }};
}

/* ---------- 5. Champs de lavande: rows of lavender running to the horizon, a wheat field and a stone farmhouse, a perched village with its bell tower, dusk ---------- */
// a cypress: a tall dark flame, a little light on the sun's side
function cypress4(img, x, base, h, sd) {
  const w = h * R(.13, .17), seed = R(0, 99);
  for (let j = 0; j < h; j++) { const q = j / h, hw = w * Math.sin(Math.PI * Math.min(1, (1 - q) ** .8 * 1.05)) * (.85 + .3 * fbm(j / (2 * K) + seed, seed, 2)) * (q < .08 ? .7 : 1); for (let k = -hw; k <= hw; k++) put(img, x + k, base - j, k * sd > hw * .45 ? [62, 74, 58] : (k + j) % 3 === 0 ? [20, 30, 30] : [30, 42, 40]); }
}
// a Provençal house seen three-quarters: a long front wall and a gable end on the sun's side, a low roof of round tiles over a pale eave, windows with shutters, some lit
function mas4(img, x, base, w, h, sd, lit) {
  x = Math.round(x); w = Math.round(w); h = Math.round(h); base = Math.round(base);
  const sw = Math.round(w * .32), rh = Math.max(2 * K, Math.round(sw * .45)), top = base - h, gx = sd > 0 ? x + w : x - sw, big = w > 16 * K;
  const FRONT = [[150, 108, 104], [176, 128, 114], [196, 146, 122]], GABLE = [[206, 156, 124], [228, 180, 138], [244, 204, 156]];
  const wall = (X, Y, rp, v) => put(img, X, Y, dith(rp, v + (fbm(X / (3 * K), Y / (3 * K), 2) - .5) * .25, X, Y));
  for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) wall(x + k, base - j, FRONT, .3 + j / h * .4);
  for (let k = 0; k < sw; k++) { const q = sd > 0 ? k / sw : 1 - k / sw, gt = top - rh * (1 - Math.abs(q * 2 - 1)); for (let Y = gt; Y < base; Y++) wall(gx + k, Y, GABLE, .35 + (base - Y) / h * .5); }
  // the roof: a band over the front wall rising to the ridge, its far edge following the gable's slope; rows of round tiles, a pale eave below
  const r0 = sd > 0 ? x - K : x - sw / 2, r1 = sd > 0 ? x + w + sw / 2 : x + w + K;
  for (let X = r0; X < r1; X++) {
    const over = sd > 0 ? X - (x + w) : x - X, bot = over > 0 ? top - rh * over / (sw / 2) : top + K;
    for (let Y = top - rh; Y < bot; Y++) { const row = (Y - (top - rh)) % (2 * K), ch = (X + (row < K ? 0 : K)) % (2 * K); put(img, X, Y, row === 0 ? [120, 52, 44] : ch < K ? [206, 104, 74] : [178, 82, 60]); }
    if (over <= 0) { put(img, X, top + K, [236, 214, 186]); put(img, X, top + 2 * K - 1, [110, 80, 84]); }
  }
  for (let X = r0; X < r1; X++) put(img, X, top - rh, [96, 44, 44]);  // ridge
  // windows with their shutters, and a door on the bigger houses
  const ww = 2 * K, wh = Math.round(Math.min(h * .3, 4 * K)), gap = big ? 8 * K : 5 * K, n = Math.max(1, Math.floor((w - 2 * K) / gap)), ox = x + Math.round((w - (n - 1) * gap - ww) / 2);
  const door = big ? ox + Math.floor(n / 2) * gap : -1;
  for (const Y of big && h >= 14 * K ? [top + 3 * K, base - wh - 2 * K] : [top + Math.round((h - wh) / 2) + K]) for (let i = 0; i < n; i++) {
    const X = ox + i * gap; if (X === door && Y > top + 3 * K) continue;
    const on = rnd() < lit;
    for (let j = 0; j < wh; j++) for (let k = 0; k < ww; k++) put(img, X + k, Y + j, on ? (j < wh / 2 ? [255, 220, 140] : [240, 170, 90]) : [52, 40, 52]);
    if (big) for (const s of [-1, 1]) for (let j = 0; j < wh; j++) for (let k = 0; k < K; k++) put(img, s < 0 ? X - K + k : X + ww + k, Y + j, j % K === 0 && k === 0 ? [80, 90, 120] : [106, 118, 150]);
  }
  if (big) for (let j = 0; j < 6 * K; j++) for (let k = 0; k < 3 * K; k++) if (j < 5 * K || Math.abs(k - 1.5 * K + .5) < K * 1.2) put(img, door + k - K / 2, base - j, j > 5.5 * K ? [60, 40, 44] : [92, 60, 52]);
}
function lavande(fImg, nImg) {
  const hz = Math.round(GH * R(.42, .47)), sx = R(.15, .85) * GW, sd = sx > GW / 2 ? 1 : -1;
  const SKYL = ramp('#2a2266', '#3e2e7e', '#5a3c92', '#7c4c9e', '#a65ea4', '#d47aa4', '#f29c9c', '#ffc296', '#ffe2b0');
  sky4(fImg, hz, SKYL, 0, 1);
  stars4(fImg, hz * .3, GW * GH / (700 * K * K));
  sun4(fImg, sx, hz - 2 * K, 10 * K, ramp('#f08060', '#ffa070', '#ffc890', '#ffe6b8', '#fff6e0'), 30 * K, true);
  clouds4(fImg, hz * .08, hz * .7, ramp('#3e2e78', '#6a428e', '#a85c96', '#e88a92', '#ffc4a0'), .64, 12 * K, R(0, 99), .95, .12, 5);
  // layered hills fading into the dusk, the village on the nearest crest
  land4(fImg, hz, 12 * K, 120 * K, ramp('#7a5498', '#8a60a0', '#9c6ca8'), .3, .7, {depth: 20 * K});
  land4(fImg, hz + 4 * K, 18 * K, 90 * K, ramp('#5a4488', '#684e94', '#7858a0'), .2, .7, {depth: 30 * K});
  const vh = land4(fImg, hz + 16 * K, 30 * K, 80 * K, ramp('#3e3672', '#4a4080', '#584a8c', '#665696'), .15, .8, {depth: 40 * K, tex: 5});
  let px = GW * .25; for (let x = GW * .25 | 0; x < GW * .75; x++) if (vh[x] < vh[px | 0]) px = x;
  { const top = vh[px | 0], HR = ramp('#3e3672', '#4a4080', '#584a8c', '#665696');  // a rounded knoll for the village to sit on
    for (let x = Math.max(0, px - 60 * K | 0); x < Math.min(GW, px + 60 * K); x++) { const t = Math.round(top - 6 * K + ((x - px) / (60 * K)) ** 2 * 30 * K); if (t < vh[x]) { for (let y = t; y < vh[x] + 4 * K; y++) put(fImg, x, y, dith(HR, .4 + (y - t) / (30 * K) * .3 + ((x - px) * sd > 0 ? .15 : 0), x, y)); vh[x] = t; } } }
  const houses = [];
  for (let i = 0; i < 26; i++) { const x = px + R(-1, 1) * R(10, 46) * K | 0; if (x > 0 && x < GW - 1 && vh[x] - vh[px] < 8 * K) houses.push([x, vh[x] + R(3, 7) * K, R(7, 13) * K, R(6, 10) * K]); }
  houses.sort((a, b) => a[1] - b[1]);
  { const tx = px - 3 * K, tb = vh[px] + 4 * K, th = 30 * K;  // the bell tower and its wrought-iron campanile
    for (let j = 0; j < th; j++) for (let k = 0; k < 7 * K; k++) put(fImg, tx + k, tb - j, j > th - 9 * K && j < th - 3 * K && k > 2 * K && k < 5 * K ? [40, 30, 50] : dith([[150, 112, 108], [196, 150, 130], [236, 196, 160]], (sd > 0 ? k / (7 * K) : 1 - k / (7 * K)) * .8, tx + k, tb - j));
    for (let k = -K; k < 8 * K; k++) put(fImg, tx + k, tb - th, [120, 90, 96]);
    for (let a = 0; a <= Math.PI; a += .05) put(fImg, tx + 3.5 * K + Math.cos(a) * 3.5 * K, tb - th - Math.sin(a) * 6 * K, [40, 30, 50]);
    for (let j = 0; j < 9 * K; j++) put(fImg, tx + 3.5 * K, tb - th - j, [40, 30, 50]); }
  for (const [x, b, w, h] of houses) mas4(fImg, x - w / 2, b, w, h, sd, .3);
  for (let i = 0; i < 6; i++) { const x = px + R(-1, 1) * R(30, 60) * K | 0; if (x > 0 && x < GW && vh[x] - vh[px] < 14 * K) cypress4(fImg, x, vh[x] + 6 * K, R(14, 22) * K, sd); }
  mist4(fImg, vh[px] + 34 * K, 8 * K, [150, 110, 170], .6);
  // an olive grove on a meadow at dusk: rows of silvery trees on twisted trunks, a dry-stone wall along the lavender, a stone farmhouse between two cypresses
  const fy = Math.round(hz + R(40, 48) * K), wy = fy - R(10, 14) * K, MEAD = ramp('#3a3a62', '#4a4a6a', '#5a5a6e', '#727068', '#9a8a70');
  for (let y = wy - 4 * K; y < fy + 6 * K; y++) for (let x = 0; x < GW; x++) { const t = wy + Math.round((fbm(x / (40 * K), 7, 2) - .5) * 6 * K); if (y >= t) put(fImg, x, y, dith(MEAD, .25 + (y - t) / (fy - wy) * .3 + Math.exp(-(((x - sx) / (70 * K)) ** 2)) * .3 + (fbm(x / (4 * K), y / (2 * K), 2) - .5) * .2, x, y)); }
  const OLIVE = ramp('#2a2e4c', '#3e4660', '#58626e', '#7a8480', '#a2a890');
  for (let row = 0; row < 3; row++) { const y = wy + row * 4 * K + 3 * K, sc = .7 + row * .2, step = R(18, 24) * K * sc; for (let x = R(0, step); x < GW; x += step * R(.85, 1.15)) {
    const h = 9 * K * sc, X = x + (row % 2) * step / 2;
    for (let j = 0; j < h * .5; j++) for (let k = -K * sc * .6; k <= K * sc * .6; k++) put(fImg, X + k + Math.sin(j / (2 * K)) * K, y - j, [44, 34, 44]);
    blob(fImg, X, y - h * .7, h * .75, h * .42, OLIVE, .15, .8, R(0, 99), .6); } }
  { const fx0 = (sd > 0 ? R(.1, .3) : R(.7, .9)) * GW; cypress4(fImg, fx0 - 6 * K, wy + 4 * K, 28 * K, sd); mas4(fImg, sd > 0 ? fx0 - 10 * K : fx0 + 24 * K, wy + 5 * K, 14 * K, 8 * K, -sd, .2); mas4(fImg, fx0, wy + 5 * K, 26 * K, 15 * K, sd, .5); cypress4(fImg, fx0 + 40 * K, wy + 4 * K, 24 * K, sd); }
  // the lavender: rows converging on a point on the horizon; first the bare furrows, then each clump from far to near
  const vx = R(.35, .65) * GW, vy = fy - R(26, 34) * K, rowU = R(.22, .28), off = R(0, 1);
  const LAV = ramp('#1e1040', '#2e1858', '#462474', '#62328e', '#8048a8', '#a066c0', '#c48ad4', '#e2b0e2');
  const edge = Array.from({length: GW}, (_, x) => fy + (fbm(x / (25 * K), 3.3, 3) - .5) * 6 * K);
  for (let y = fy - 4 * K; y < GH; y++) for (let x = 0; x < GW; x++) { if (bay(x, y) > (y - edge[x]) / (8 * K)) continue; const d = y - vy, ph = ((x - vx) / d / rowU + off) % 1; put(nImg, x, y, dith(ramp('#1a1024', '#2a1a2a', '#3e2830', '#5a3a36'), .15 + (y - fy) / (GH - fy) * .4 + (Math.abs((ph + 1) % 1 - .5) < .1 ? .15 : 0), x, y)); }
  const clumps = [];
  for (let y = fy - 3 * K; y < GH + 30 * K; ) {
    const d = y - vy, hw = rowU * d * .42, h = hw * .85, step = Math.max(1, h * .32);
    for (let r = Math.floor(-vx / (rowU * d) - off) - 1; r <= Math.ceil((GW - vx) / (rowU * d) - off) + 1; r++) { const cx = vx + (r + .5 - off) * rowU * d + R(-.08, .08) * hw, cy = y + R(0, step); if (cy > edge[Math.max(0, Math.min(GW - 1, cx | 0))] - 2 * K || rnd() < .3) clumps.push([cx, cy, hw * R(.85, 1.1), h * R(.8, 1.15)]); }
    y += step;
  }
  clumps.sort((a, b) => a[1] - b[1]);
  for (const [cx, cy, hw, h] of clumps) {
    const seed = R(0, 99), near = hw > 9 * K;
    for (let X = -hw; X <= hw; X++) {
      const e = Math.sqrt(Math.max(0, 1 - (X / hw) ** 2)), stalk = near && (Math.round(cx + X) % Math.max(2, Math.round(hw / 6))) === 0, top = h * e * (.8 + .4 * fbm(X / Math.max(1, hw * .15) + seed, seed, 2)) + (stalk ? h * .2 : 0);
      for (let j = 0; j < top; j++) {
        const q = j / top, lit = X * sd > 0 ? .12 : -.05, glow = Math.exp(-(((cx + X - sx) / (80 * K)) ** 2)) * .12;
        put(nImg, cx + X, cy - j, q < .22 ? (bay(cx + X | 0, cy - j | 0) < .5 ? [40, 60, 52] : LAV[1]) : dith(LAV, .15 + q * .6 + lit + glow + (near && (cx + X | 0) % 3 === 0 ? -.12 : 0), cx + X, cy - j));
      }
    }
    if (hw > 14 * K) for (let i = 0; i < hw / (2 * K); i++) {  // spikes standing out of the near clumps: a green stem and a head of tiny flowers
      const X = cx + R(-.8, .8) * hw, base = cy - h * Math.sqrt(Math.max(0, 1 - ((X - cx) / hw) ** 2)) * .8, L = h * R(.3, .55), lean = R(-.15, .15);
      for (let j = 0; j < L; j++) { const q = j / L, Y = base - j, xx = X + lean * j; if (q < .55) put(nImg, xx, Y, [56, 84, 66]); else { put(nImg, xx, Y, LAV[(j & 1) ? 5 : 7]); if (j % 2 === 0) { put(nImg, xx - 1, Y, LAV[4]); put(nImg, xx + 1, Y, (X - cx) * sd > 0 ? LAV[7] : LAV[5]); } } }
    }
  }
  const bees = Array.from({length: 6}, () => ({x: R(0, GW), y: R(fy + 10 * K, GH), p: R(0, 6.28)}));
  const flies = Array.from({length: 4}, () => ({x: R(0, GW), y: R(fy, GH - 20 * K), p: R(0, 6.28), c: rnd() < .5 ? '#fff6e0' : '#ffd860'}));
  const ffl = Array.from({length: 12}, () => ({x: R(0, GW), y: R(fy - 20 * K, GH), p: R(0, 6.28), s: R(.4, 1)}));
  twinkles = makeTwinkles(GW * hz / (3000 * K * K), hz * .3);
  return {flares: false, shooters: true, draw: t => {
    for (const b of bees) { b.x += Math.sin(t / 500 + b.p) * 1.2 + .1; b.y += Math.cos(t / 400 + b.p * 3) * .8; if (b.x > GW) b.x = 0; fill(b.x, b.y, '#ffd23f'); fill(b.x + 1, b.y, '#2a1a10'); fill(b.x, b.y - 1, '#fff', .6); }
    for (const f of flies) { f.x += Math.sin(t / 900 + f.p) * .6 + .15; f.y += Math.sin(t / 300 + f.p) * .5; if (f.x > GW + 4) f.x = -4; const o = Math.sin(t / 90 + f.p) > 0 ? 1 : 0; fill(f.x - 1 - o, f.y - o, f.c); fill(f.x + 1 + o, f.y - o, f.c); fill(f.x, f.y, '#3a2a30'); }
    for (const f of ffl) { f.x += Math.sin(t / 1400 + f.p) * .25; f.y += Math.cos(t / 1700 + f.p) * .18; const a = (Math.sin(t / 700 * f.s + f.p) + 1) / 2; fill(f.x, f.y, '#e8ffb0', a); fill(f.x + 1, f.y, '#a0ff80', a * .4); fill(f.x - 1, f.y, '#a0ff80', a * .4); }
  }};
}

/* ---------- 6. Automne: golden maples and oaks around a lake, falling leaves, a mist, a low gold sun ---------- */
function automne(fImg, nImg) {
  const hz = Math.round(GH * R(.55, .6)), warm = ['#c8301a', '#e8641c', '#f0a22a', '#d8c03a', '#a83a18'];
  sky4(fImg, hz, ramp('#3a4a78', '#5a6a94', '#8a86a0', '#c0a49c', '#e8b890', '#f8c88a', '#ffdc98', '#fff0b8'), 0, 1);
  sun4(fImg, R(.25, .75) * GW, hz - 14 * K, 11 * K, ramp('#e8902a', '#f8b44a', '#ffd070', '#ffe8a0', '#fff8d8'), 26 * K, true);
  clouds4(fImg, hz * .08, hz * .8, ramp('#9a8a9c', '#c4a8a4', '#e8c4a8', '#fff0d0'), .6, 13 * K, R(0, 99), .95, .25);
  land4(fImg, hz, 26 * K, 90 * K, ramp('#4a3a58', '#5e4a64', '#7a5e6e', '#98788a'), .1, .8, {depth: 40 * K, sharp: true});
  const far = land4(fImg, hz + 4 * K, 16 * K, 60 * K, ramp('#6a2a1a', '#8a3a1a', '#aa5a1e', '#c8821e', '#e0a830'), .15, .85, {depth: 36 * K, tex: 3});
  for (let i = 0; i < 400; i++) { const x = R(0, GW) | 0, y = far[x] + R(0, 24 * K); put(fImg, x, y, hx4(warm[rnd() * 5 | 0])); put(fImg, x + 1, y, hx4(warm[rnd() * 5 | 0])); }
  const wy = hz + 14 * K; reflect4(fImg, wy, .75, [20, 16, 24]);
  for (let y = wy; y < GH; y++) for (let x = 0; x < GW; x += 3) if (rnd() < .01) put(fImg, x, y, [255, 230, 180]);
  mist4(fImg, wy, 10 * K, [230, 200, 180], .5);
  const shore = land4(nImg, GH * .88, 14 * K, 60 * K, ramp('#2a1608', '#3a2008', '#5a3210', '#7a4a18'), .1, .8, {depth: 30 * K, tex: 3, rim: true});
  for (let i = 0; i < 5; i++) { const x = R(.03, .97) * GW | 0, h = R(55, 100) * K, kind = rnd() * 5 | 0; tree4(nImg, x, shore[x] + 6 * K, h, ramp('#3a1008', '#6a1c0c', '#a8301a', '#d8601c', '#f0a02a'), [40, 24, 14], 1.1); void kind; }
  for (let i = 0; i < 500; i++) { const x = R(0, GW) | 0, y = shore[x] + R(0, 22 * K); put(nImg, x, y, hx4(warm[rnd() * 5 | 0])); }   // a carpet of leaves
  blades4(nImg, shore, ramp('#3a2a0e', '#5a4414', '#8a6a1c'), GW / 3, 4, 12, .5);
  const leaves = drift4(70, {colors: warm, vy: .55, vx: -.2, sway: .7, size: 2});
  const birds = Array.from({length: 7}, (_, i) => ({x: -i * 14 * K, y: R(.1, .3) * hz, v: .55, p: R(0, 6)}));
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    leaves(t);
    for (const b of birds) { b.x += b.v; b.y += Math.sin(t / 900 + b.p) * .05; if (b.x > GW + 10) b.x = -30; const up = Math.sin(t / 240 + b.p) > 0 ? 1 : 0; for (const [i, j] of [[0, 0], [-1, -up], [1, -up], [-2, -2 * up + 1], [2, -2 * up + 1]]) fill(b.x + i, b.y + j, '#3a2230'); }
  }};
}
// a band of mist: dithered light haze in any colour
function mist4(img, y0, h, c, amt) {
  const seed = R(0, 400);
  for (let y = Math.max(0, Math.round(y0 - h)); y < Math.min(GH, y0 + h); y++) {
    const a = 1 - Math.abs(y - y0) / h;
    for (let x = 0; x < GW; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < a * amt * (.45 + .55 * fbm(x / (50 * K) + seed, y / (12 * K), 3))) put(img, x, y, c);
  }
}

/* ---------- 7. Orage sur la mer: a wall of storm clouds with a cold break of light on the horizon, rain curtains, heavy swell, a lighthouse on a headland sweeping its beam, lightning ---------- */
function orage(fImg, nImg) {
  const hz = Math.round(GH * R(.56, .62)), side = rnd() < .5 ? -1 : 1;
  sky4(fImg, hz, ramp('#05070e', '#090d18', '#0e1424', '#151d32', '#1e2a42', '#2c3a56', '#44546e', '#6a7a90', '#9aa8b8'), 0, 1);
  // the storm: a dark ceiling, a lower shelf of cloud with ragged lit edges, and below it a strip of cold clear sky
  clouds4(fImg, 0, hz * .7, ramp('#04060c', '#080c18', '#0e1424', '#18203a', '#26324c', '#3a4862'), .4, 20 * K, R(0, 99), .75, .05, 2.4);
  clouds4(fImg, hz * .35, hz * .99, ramp('#06080e', '#0c1220', '#162034', '#24304a', '#3a4a66', '#5e6e88'), .5, 12 * K, R(0, 99), .85, .05, 4);
  // rain curtains hanging from the shelf far out to sea
  for (let c = 0; c < 3; c++) { const cx = R(0, GW), cw = R(40, 90) * K, top = hz * R(.6, .75), sl = R(.25, .45);
    for (let y = top; y < hz; y++) for (let x = cx - cw; x < cx + cw; x++) { const q = (y - top) / (hz - top), e = 1 - Math.abs(x - cx) / cw; if (e > 0 && ((x + y * sl) | 0) % 3 === 0 && bay(x | 0, y | 0) < e * .7 * (.4 + q * .6)) put(fImg, x + q * 10 * K, y, [62, 74, 96]); } }
  // the sea: heavy swell, rows of waves growing toward us, the faces catching the pale light, broken foam on the crests
  const SEA = ramp('#03060a', '#060c14', '#0a1620', '#10222e', '#18323e', '#285058', '#4a7880', '#8ab0b4', '#d0e4e4'), ss = R(0, 99);
  for (let y = hz; y < GH; y++) { const deep = (y - hz) / (GH - hz); for (let x = 0; x < GW; x++) {
    const n = fbm(x / (18 * K * (1 + deep * 3)) + ss, y / (3 * K * (1 + deep)), 3), ph = Math.sqrt((y - hz) / K) * 1.7 + n * 2.6, s = ph - Math.floor(ph), crest = s > .9 && fbm(x / (3 * K * (1 + deep)) + ss, y / K, 2) > .55;
    const glow = Math.max(0, 1 - deep * 3) * .25;
    put(fImg, x, y, crest ? (bay(x, y) < .3 ? SEA[8] : SEA[6]) : dith(SEA, .12 + glow + s * .32 - deep * .08 + (n - .5) * .25, x, y));
  } }
  // a headland of black rock on one side, the lighthouse on its edge, the keeper's house beside it, surf breaking at its foot
  const cw = R(.24, .34) * GW, ch = R(28, 38) * K, cliff = [], cs = R(0, 99);
  for (let i = 0; i < GW; i++) { const x = side < 0 ? i : GW - 1 - i, q = i / cw; cliff[x] = q > 1.15 ? GH : Math.round(hz + 4 * K - ch * Math.min(1, (1.15 - q) * 2.2) ** .7 + (fbm(i / (5 * K) + cs, cs, 3) - .5) * 6 * K); }
  const ROCK = ramp('#06070c', '#0e1018', '#161c26', '#222a36', '#344050', '#4a586a');
  const base = x => { const q = (side < 0 ? x : GW - 1 - x) / cw; return Math.round(hz + (GH - hz) * (.22 + Math.max(0, 1.15 - q) * 1.1) + (fbm(x / (6 * K) + cs, 5, 2) - .5) * 4 * K); };
  for (let x = 0; x < GW; x++) for (let y = cliff[x]; y < Math.min(GH, base(x)); y++) put(fImg, x, y, dith(ROCK, .18 + (fbm(x / (4 * K), y / (6 * K), 3) - .5) * .55 + (y - cliff[x] < K ? .5 : 0) + (fbm(x / (12 * K), y / (1.5 * K), 2) > .62 ? .18 : 0), x, y));
  for (let x = 0; x < GW; x++) if (cliff[x] < GH) { const foot = base(x) - K; for (let j = -3 * K; j < 4 * K; j++) { const n = fbm(x / (2.5 * K) + cs, (foot + j) / K, 2); if (n > .45 + Math.abs(j) / (8 * K) && cliff[x] < foot + j) put(fImg, x, foot + j, n > .6 ? SEA[8] : SEA[7]); } }
  const lx = Math.round(side < 0 ? cw * R(.45, .6) : GW - cw * R(.45, .6)), lb = cliff[lx] + 2 * K, lh = R(46, 54) * K, top = lb - lh;
  for (let y = 0; y < lh; y++) { const hw = (5.5 - y / lh * 1.8) * K, band = Math.floor(y / (8 * K)) % 2 === 1; for (let k = -hw; k <= hw; k++) { const lit = .35 + .65 * Math.cos((k / hw + .35) * 1.2); put(fImg, lx + k, lb - y, (band ? [176, 44, 44] : [214, 214, 224]).map(v => v * Math.max(.18, lit) * .62 | 0)); } }
  for (let k = -6 * K; k <= 6 * K; k++) { put(fImg, lx + k, top, [20, 22, 30]); put(fImg, lx + k, top - K, [20, 22, 30]); if (k % (2 * K) === 0) for (let j = 2; j < 4 * K; j++) put(fImg, lx + k, top - j, [26, 28, 36]); }
  for (let k = -6 * K; k <= 6 * K; k++) put(fImg, lx + k, top - 4 * K, [26, 28, 36]);
  for (let j = 0; j < 6 * K; j++) for (let k = -3.5 * K; k <= 3.5 * K; k++) put(fImg, lx + k, top - 4 * K - j, Math.abs(k) % (2 * K) < 1 ? [60, 50, 30] : j > 4 * K || Math.abs(k) < 1.5 * K ? [255, 244, 190] : [255, 214, 120]);
  for (let j = 0; j < 3 * K; j++) for (let k = -(4 - j / K) * K; k <= (4 - j / K) * K; k++) put(fImg, lx + k, top - 10 * K - j, [18, 20, 28]);
  for (let j = 0; j < 4 * K; j++) put(fImg, lx, top - 13 * K - j, [18, 20, 28]);
  { const hx = lx + side * -14 * K, hb = cliff[hx] + 2 * K, hw = 14 * K, hh = 8 * K;
    for (let j = 0; j < hh; j++) for (let k = 0; k < hw; k++) put(fImg, hx - hw / 2 + k, hb - j, dith([[30, 32, 40], [56, 58, 70], [96, 98, 110]], .3 + (side * (k / hw - .5)) * .5, hx + k, hb - j));
    for (let j = 0; j < 4 * K; j++) for (let k = -j * 1.9 - K; k <= j * 1.9 + K; k++) put(fImg, hx + k, hb - hh - 4 * K + j, j === 0 ? [30, 22, 26] : [60, 30, 32]);
    for (let j = 0; j < 3 * K; j++) for (let k = 0; k < 3 * K; k++) put(fImg, hx - K + k, hb - 5 * K + j, [255, 200, 110]); }
  const lamp = [lx, top - 7 * K];
  // animated: the beam, rain, lightning with the clouds lit from inside, surf bursting on the rocks
  const rain = Array.from({length: 220}, () => ({x: R(0, GW), y: R(0, GH), v: R(5, 8)}));
  const surf = Array.from({length: 4}, (_, i) => ({x: side < 0 ? R(.6, 1.05) * cw : GW - R(.6, 1.05) * cw, t: i * 900 + R(0, 900)}));
  const bolts = []; let flash = 0, glowX = 0, glowY = 0;
  const bolt = () => { const pts = []; let x = R(.1, .9) * GW, y = hz * R(.3, .5); glowX = x; glowY = y; const tx = x + R(-60, 60) * K; while (y < hz + 2 * K) { pts.push([x, y]); y += R(3, 8) * K; x += (tx - x) * .12 + R(-5, 5) * K; } bolts.push({pts, life: 9, br: rnd() < .6 ? pts.slice(Math.floor(pts.length / 3)).map(([a, b], i) => [a + i * 4 * K * (rnd() < .5 ? 1 : -1), b]).slice(0, 6) : null}); flash = 1; };
  twinkles = [];
  return {flares: false, shooters: false, draw: t => {
    const a = t / 2600, c = Math.cos(a), dir = Math.sin(a) > 0 ? 1 : -1, L = GW * .9 * Math.abs(c), on = Math.abs(c) > .08;
    if (on) for (let i = 0; i < L; i += 2) { const sp = 1.5 * K + i * .07, al = .16 * (1 - i / L) * (.5 + Math.abs(c) * .5); fxc.globalAlpha = al; fxc.fillStyle = '#fff4c8'; fxc.fillRect(lamp[0] + dir * i, lamp[1] - sp, 2, sp * 2); }
    fxc.globalAlpha = .5 + .5 * Math.abs(c); fxc.fillStyle = '#fffbe0'; fxc.fillRect(lamp[0] - 2 * K, lamp[1] - 2 * K, 4 * K, 4 * K);
    if (rnd() < .006 && !bolts.length) bolt(); if (rnd() < .0015) bolt();
    flash *= .86;
    if (flash > .03) { fxc.globalAlpha = flash * .12; fxc.fillStyle = '#dce8ff'; fxc.fillRect(0, 0, GW, GH); for (let r = 80 * K; r > 0; r -= 10 * K) { fxc.globalAlpha = flash * .05; fxc.beginPath(); fxc.ellipse(glowX, glowY, r * 1.6, r * .6, 0, 0, 6.283); fxc.fill(); } }
    for (const b of bolts) { const al = b.life / 9; for (const path of b.br ? [b.pts, b.br] : [b.pts]) for (let i = 1; i < path.length; i++) { const [x0, y0] = path[i - 1], [x1, y1] = path[i], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let k = 0; k < n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; fill(x, y, '#ffffff', al); fill(x + 1, y, '#a8c8ff', al * .6); fill(x - 1, y, '#a8c8ff', al * .6); } } b.life--; }
    while (bolts.length && bolts[0].life <= 0) bolts.shift();
    for (const s of surf) { const p = ((t + s.t) % 3600) / 1200; if (p < 1) { const fy = hz + (GH - hz) * .24; for (let i = 0; i < 26; i++) { const an = -Math.PI * (i / 25), r = p * 18 * K * (.6 + .4 * Math.sin(i * 7.3)); fill(s.x + Math.cos(an) * r * 1.3, fy + Math.sin(an) * r * (1 - p * .3) + p * p * 10 * K, '#e8f4f8', (1 - p) * .8); } } }
    for (const d of rain) { d.y += d.v; d.x -= d.v * .35; if (d.y > GH) { d.y = -4; d.x = R(0, GW * 1.3); } fxc.globalAlpha = .28; fxc.fillStyle = '#9aaac8'; for (let k = 0; k < 4; k++) fxc.fillRect(d.x + k * .35, d.y - k, 1, 1); }
  }};
}

Object.assign(SCENES, {paques, plage, pluie, savane, lavande, automne, orage});
