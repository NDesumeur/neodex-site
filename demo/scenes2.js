/* ---------- 10 more decors (Paramètres > Décor), built like the first five: drawn at 1/S resolution with the same limited palettes and
   ordered dithering, a far layer and a near layer that drift for parallax, and an fx layer animated at 30 fps on top. A new picture every launch. ---------- */
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const LAVA = ramp('#1a0410', '#3e0816', '#6e1018', '#a8201a', '#d8441c', '#f6782a', '#ffb44a', '#ffe48e');
const SMOKE = ramp('#07030f', '#0e0719', '#170d25', '#221432', '#301d40', '#40294f');
const HAZE = ramp('#04010d', '#0b0320', '#16052e', '#26073a', '#3c0a3e', '#560e3c', '#741636', '#962430');
const AUR = ramp('#03140f', '#06281e', '#0a4232', '#106650', '#1a9474', '#38c49a', '#86f0c8', '#dcfff0');
const BLOSSOM = ramp('#24061e', '#460c38', '#701654', '#a02472', '#d24494', '#f47cba', '#ffb8dc', '#ffe6f4');
const DEEP = ramp('#01020a', '#030617', '#050b26', '#081236', '#0d1c4a', '#13295e', '#1b3a76', '#284f90', '#3a68aa');
const LEAF = ramp('#010705', '#03120b', '#061e12', '#0b2c19', '#123e22', '#1b532c', '#286c38', '#3a8a46');
const SAND = ramp('#0a0316', '#160824', '#250f32', '#38183e', '#4e2448', '#683450', '#864656', '#a85c5a', '#cc7a62');
const OCEANP = ramp('#01040f', '#030c28', '#061a46', '#0c2e6a', '#164a8e', '#2a6cb0', '#4a90cc');
const LANDP = ramp('#070a06', '#111a0c', '#1e2c12', '#2e401a', '#445424', '#5e6a32', '#7c8044');
const STONE = ramp('#05020c', '#0d0719', '#170e26', '#221634', '#2f2042', '#3e2b52', '#503862');
const RED = ramp('#140108', '#2c0410', '#4a081a', '#700e26', '#9a1832', '#c42a3c');
// a small canvas drawn once, then copied by the fx layer every frame (cheaper than pixel by pixel)
const spriteOf = (w, h, f) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); const g = c.getContext('2d'); f(g); return c; };
const dot = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w, h); };
// a lit sphere: light from the upper left, noisy bands or surface, a thin bright rim
function spherePix(x, y, r, rp, seed, bands) {
  const nx = x / r, ny = y / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const light = clamp(-nx * .45 - ny * .55 + nz * .7), n = bands ? fbm(seed, ny * bands + fbm(nx * 2 + seed, ny * 2, 3) * .6, 3) : fbm(nx * 3 + seed, ny * 3, 4);
  return light * .85 + (n - .5) * .35 + (nx * nx + ny * ny > .9 ? .08 : 0);
}
// a dithered blob (cloud, foliage, smoke): noisy ellipse, lighter towards the top
function blob(img, cx, cy, rx, ry, rp, v0, v1, seed, rough = .35) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let y = -Math.ceil(ry * 1.4); y <= ry * 1.4; y++) for (let x = -Math.ceil(rx * 1.4); x <= rx * 1.4; x++) {
    const d = Math.hypot(x / rx, y / ry), n = fbm((cx + x) / (7 * K) + seed, (cy + y) / (7 * K), 4);
    if (d < 1 - rough + n * rough * 2) put(img, cx + x, cy + y, dith(rp, v0 + (v1 - v0) * clamp(.5 - y / ry * .5) + (n - .5) * .25, cx + x, cy + y));
  }
}
// a vertical gradient of any palette
function grad(img, y0, y1, rp, a, b) { for (let y = Math.max(0, y0 | 0); y < Math.min(GH, y1); y++) { const v = a + (b - a) * (y - y0) / (y1 - y0); for (let x = 0; x < GW; x++) put(img, x, y, dith(rp, v, x, y)); } }
// a line of any thickness, in art pixels
function stroke(img, x0, y0, x1, y1, w, c) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) + 1, r = w / 2;
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + .5) put(img, x + dx, y + dy, typeof c === 'function' ? c(x + dx, y + dy) : c); }
}
// a waterfall that flows: a tall striped picture scrolled down by the fx layer
function fallSprite(w, h) {
  return spriteOf(w, h * 2, g => { for (let x = 0; x < w; x++) { const s = R(0, 99), edge = Math.min(x, w - 1 - x) < 2; for (let y = 0; y < h * 2; y++) {
    const v = vnoise(x * .7 + s, (y % h) / (3 * K)) * .7 + (edge ? -.25 : 0) + .2; const c = v > .62 ? '#f6f0ff' : v > .45 ? '#a8c8f0' : v > .3 ? '#5a78b8' : '#2a3a78';
    g.fillStyle = c; g.globalAlpha = edge ? .55 : .85; g.fillRect(x, y, 1, 1); } } });
}
const flowFall = (spr, x, y, h, t, sp = .9) => { const o = Math.floor(t / 33 * sp) % (spr.height / 2); fxc.globalAlpha = 1; fxc.drawImage(spr, 0, spr.height / 2 - o, spr.width, h, x | 0, y | 0, spr.width, h); };

/* ---------- 1. Désert: dunes lit by a giant ringed planet, the Milky Way, cacti and a caravan; the wind lifts the sand ---------- */
function desert(fImg, nImg) {
  const hz = Math.round(GH * R(.56, .62)), seed = R(0, 99);
  skyGrad(fImg, hz, 0, .85);
  skyStars(fImg, hz * .85, GW * GH / (50 * K * K));
  const ma = R(-.6, .6);  // the Milky Way: a soft diagonal band of dust and stars
  for (let y = 0; y < hz; y++) for (let x = 0; x < GW; x++) {
    const d = ((y - hz * .4) - (x - GW / 2) * ma) / (GH * .13), n = fbm(x / (12 * K) + seed, y / (12 * K), 4), v = Math.exp(-d * d) * smooth(.3, .85, n) * (1 - smooth(.62, .75, fbm(x / (5 * K), y / (5 * K) + seed, 3)) * .7);
    if (v > .12 && bay(x, y) < v * .9) put(fImg, x, y, dith(NEBV, .35 + v * .5, x, y));
  }
  // the ringed planet, low on the horizon, half behind the dunes
  const pr = Math.round(GH * R(.14, .18)), pcx = Math.round(R(.2, .8) * GW), pcy = Math.round(hz - pr * R(.2, .6)), tilt = R(.2, .32), rot = R(-.35, .35), prp = PLANET_RARE[1], ps = R(0, 99);
  const ri = pr * 1.35, ro = pr * 2.3, cr = Math.cos(rot), sr = Math.sin(rot);
  for (let y = -Math.ceil(ro); y <= ro; y++) for (let x = -Math.ceil(ro); x <= ro; x++) {
    const u = x * cr + y * sr, w = (-x * sr + y * cr) / tilt, d = Math.hypot(u, w), ring = d > ri && d < ro, front = w > 0, inS = x * x + y * y < pr * pr, X = pcx + x, Y = pcy + y;
    if (inS && !(ring && front)) put(fImg, X, Y, dith(prp, spherePix(x, y, pr, prp, ps, 9) - (ring ? 0 : 0), X, Y));
    else if (ring) { const q = (d - ri) / (ro - ri); if (Math.abs(q - .6) > .045) put(fImg, X, Y, dith(prp, .22 + .5 * (.5 + .5 * Math.sin(q * 46 + ps)) * (1 - q * .45) + (front ? .12 : -.08) - (inS ? .2 : 0), X, Y)); }
  }
  // dunes, far to near: rolling crests; the slope facing the planet is lit, fading below the crest so no hard edges run down the sand
  const lightDir = pcx < GW / 2 ? -1 : 1, layers = [[hz, 10, 140, .62], [hz + 12 * K, 16, 110, .48], [hz + 30 * K, 22, 90, .34], [GH - 26 * K, 30, 70, .2]];
  const tops = [];
  layers.forEach(([base, amp, sc, v], li) => {
    const s = R(0, 400), img = li === 3 ? nImg : fImg, top = [];
    for (let x = 0; x < GW; x++) top[x] = base - amp * K * (.55 * Math.sin(x / (sc * K) * 3 + s) * .5 + .5 * fbm(x / (sc * K) + s, s, 3) + .25);
    for (let x = 0; x < GW; x++) {
      const sl = clamp(((top[Math.min(GW - 1, x + 2)] - top[Math.max(0, x - 2)]) / 4) * lightDir * .7 + .5);  // 0 = facing away from the planet, 1 = facing it
      const crest = x > 0 && x < GW - 1 && top[x] <= top[x - 1] && top[x] <= top[x + 1];
      for (let y = Math.max(0, Math.round(top[x])); y < GH; y++) {
        const d = y - top[x], dep = d / (GH * .3);
        let val = v * .85 + (sl - .5) * .5 * clamp(1 - d / (amp * K * 1.2)) - dep * .25 + (d < K ? .08 + (crest ? .1 : 0) : 0);
        if (li === 3 && Math.sin(d * .55 + x * .04 + fbm(x / (20 * K), y / (8 * K), 3) * 6) > .93) val += .1;  // ripples in the near sand
        put(img, x, y, dith(SAND, val, x, y));
      }
    }
    tops.push(top);
  });
  // saguaro cacti on the middle dunes: rounded trunk and arms, lit on the planet's side
  for (let i = 0, n = 2 + (rnd() * 3 | 0); i < n; i++) {
    const li = rnd() < .5 ? 1 : 2, x = Math.round(R(.05, .95) * GW), base = Math.round(tops[li][x]) + K, z = li === 2 ? 1.4 : 1, h = Math.round(R(12, 22) * K * z), w = Math.max(3, Math.round(2.4 * K * z));
    const dark = SAND[li === 2 ? 0 : 1], mid = SAND[li === 2 ? 2 : 3];
    const stem = (x0, y0, len) => { for (let y = 0; y < len; y++) for (let j = 0; j < w; j++) { const edge = (lightDir < 0 ? j === 0 : j === w - 1); if (y === len - 1 && (j === 0 || j === w - 1)) continue; put(fImg, x0 + j, y0 - y, edge ? mid : dark); } };
    stem(x, base, h);
    for (const side of [-1, 1]) if (rnd() < .75) {
      const ay = base - Math.round(h * R(.3, .55)), al = Math.round(R(2.5, 4.5) * K * z), ah = Math.min(Math.round(h * R(.25, .45)), h - (base - ay) - 2 * K), ax = side > 0 ? x + w + al - w : x - al;
      for (let j = 0; j < al; j++) for (let k = 0; k < w - 1; k++) put(fImg, side > 0 ? x + w + j : x - j - 1, ay - k, dark);
      stem(ax, ay, ah);
    }
  }
  const CAMEL = ['.......oo.', '..oo..ooo.', '.ooooooo..', 'ooooooooo.', '.oooooo...', '.o.o..o.o.', '.o.o..o.o.'];
  const cx0 = R(.1, .6) * GW, cz = Math.max(1, K >> 1) + 1;
  for (let i = 0; i < 5; i++) {
    const x = Math.round(cx0 + i * 14 * K), base = Math.round(tops[0][Math.min(GW - 1, Math.max(0, x + 5))]);
    CAMEL.forEach((r, j) => { for (let k = 0; k < r.length; k++) if (r[k] === 'o') for (let a = 0; a < cz; a++) for (let b = 0; b < cz; b++) put(fImg, x + k * cz + a, base - (CAMEL.length - j) * cz + b, SIL[1]); });
    if (i % 2 === 0) for (let y = 0; y < 3 * cz; y++) for (let a = 0; a < cz; a++) put(fImg, x + 4 * cz + a, base - (CAMEL.length + 1) * cz - y, SIL[1]);  // a rider
  }
  twinkles = makeTwinkles(GW * hz / (1400 * K * K), hz * .8);
  const sand = Array.from({length: 70}, () => ({x: R(0, GW), y: R(hz + 20 * K, GH), v: R(1, 2.4) * K, a: R(.15, .4)}));
  return {flares: false, shooters: true, draw: () => {
    for (const s of sand) {
      s.x += s.v; s.y += Math.sin(s.x / (20 * K)) * .3; if (s.x > GW + 10) { s.x = R(-40, 0); s.y = R(hz + 20 * K, GH); }
      for (let j = 0; j < 5 * K; j++) fill(s.x - j, s.y, '#cc7a62', s.a * (1 - j / (5 * K)));
    }
  }};
}

/* ---------- 2. Aurore boréale: curtains of light over snowy peaks, mirrored in a frozen lake; a cabin, snow falling ---------- */
function aurora(fImg, nImg) {
  const hz = Math.round(GH * R(.5, .56)), lake = Math.round(GH * R(.7, .76));
  skyGrad(fImg, hz, 0, .5);
  skyStars(fImg, hz, GW * GH / (55 * K * K));
  const curtains = Array.from({length: 3}, (_, i) => ({y: hz * R(.3, .55), amp: R(8, 22) * K, f: R(1.2, 3), ph: R(0, 6.28), len: R(30, 60) * K * (1 - i * .15), s: R(0, 99), pink: rnd() < .6}));
  const glowAt = new Float32Array(GW * GH), pinkAt = new Float32Array(GW * GH);
  const baseOf = (c, x) => c.y + Math.sin(x / GW * c.f * 6.28 + c.ph) * c.amp + (fbm(x / (40 * K) + c.s, c.s, 3) - .5) * 20 * K;
  for (const c of curtains) for (let x = 0; x < GW; x++) {
    const ray = smooth(.25, .8, fbm(x / (2.2 * K) + c.s, c.s * 2, 3)) * (.4 + .6 * smooth(.3, .7, fbm(x / (60 * K) + c.s, 1, 3))), b = baseOf(c, x);
    for (let y = Math.max(0, Math.round(b - c.len)); y < b && y < hz; y++) {
      const q = (b - y) / c.len, v = ray * (1 - q) ** 1.4 * Math.min(1, q * 12 + .2);
      glowAt[y * GW + x] += v; if (c.pink && q > .55) pinkAt[y * GW + x] += v * (q - .55) * 3;
    }
  }
  const auroraPix = (x, y, k) => { const i = y * GW + x, v = glowAt[i] * k, p = pinkAt[i] * k; if (v < .05) return null; return p > v * .5 ? dith(NEBM, .2 + p * .7, x, y) : dith(AUR, .08 + v * .7, x, y); };
  for (let y = 0; y < hz; y++) for (let x = 0; x < GW; x++) { const c = auroraPix(x, y, .8); if (c && bay(x, y) < glowAt[y * GW + x] * .85) put(fImg, x, y, c); }
  // snowy peaks: dark rock, snow on the slopes facing the aurora light, lit edges
  for (const [base, amp, sc, v] of [[hz, GH * .12, 60, .7], [hz + GH * .07, GH * .1, 45, .45]]) {
    const s = R(0, 400);
    for (let x = 0; x < GW; x++) {
      let n = fbm(x / (sc * K) + s, s, 5); n = (1 - Math.abs(2 * n - 1)) ** 1.4; const top = Math.round(base - amp * n), nb = fbm((x + 1) / (sc * K) + s, s, 5);
      for (let y = Math.max(0, top); y < lake; y++) {
        const depth = y - top, slopeLit = nb * 1 < n, snow = depth < amp * n * (slopeLit ? .5 : .28) && fbm(x / (6 * K), y / (2 * K) + s, 3) > .3 + depth / (amp * n + 1) * .5;
        put(fImg, x, y, snow ? dith(MOON, .45 + v * .3 - depth / amp * .4 + (depth < K ? .2 : 0), x, y) : dith(SIL, v - .1 + (depth < K ? .15 : 0), x, y));
      }
    }
  }
  // the frozen lake: the sky and the aurora upside down, broken by horizontal cracks in the ice
  for (let y = lake; y < GH; y++) for (let x = 0; x < GW; x++) {
    const my = Math.round(2 * lake - y - (lake - hz) * .9), q = (y - lake) / (GH - lake), crack = fbm(x / (30 * K), y / (1.2 * K), 3);
    const c = my >= 0 && my < hz ? auroraPix(Math.min(GW - 1, Math.max(0, x + Math.round((crack - .5) * 6 * K))), my, .55 * (1 - q)) : null;
    put(fImg, x, y, c && bay(x, y) < .6 ? c : dith(crack > .62 ? MOON : SKY, crack > .62 ? .25 : .55 - q * .4, x, y));
  }
  // the shore: snowy bank, firs, a cabin with a warm window
  const shore = Math.round(lake - 2 * K), side = rnd() < .5 ? -1 : 1;
  for (let x = 0; x < GW; x++) { const top = Math.round(shore - (fbm(x / (20 * K), 3, 3)) * 6 * K); for (let y = top; y < lake + K; y++) put(fImg, x, y, dith(MOON, .35 - (y - top) / (8 * K) * .2, x, y)); }
  // a log cabin, drawn block by block: stacked logs with round ends, a snowy roof with icicles, a stone chimney, a warm window and a door
  const cabX = Math.round(side < 0 ? R(.12, .3) * GW : R(.7, .88) * GW), cw = 18 * K, WOOD = ramp('#170a18', '#2a1424', '#3e1e2c', '#582a34'), STN = [MOON[0], SIL[6]];
  const blk = (bx, by, c) => { for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) put(fImg, cabX + bx * K + i, shore + by * K + j, c); };
  for (let by = -8; by < 0; by++) for (let bx = 0; bx < 18; bx++) blk(bx, by, (bx === 0 || bx === 17) ? (by % 2 ? WOOD[0] : WOOD[3]) : WOOD[by % 2 ? 1 : 2]);  // the logs
  for (let r = 0; r < 8; r++) for (let bx = 1 + r; bx < 17 - r; bx++) blk(bx, -9 - r, WOOD[r % 2 ? 2 : 1]);  // the gable
  for (let r = 0; r < 10; r++) for (let k = 0; k < 3; k++) { const c = k === 0 ? MOON[4] : k === 1 ? MOON[3] : MOON[1]; blk(-1 + r + k, -8 - r, c); blk(18 - r - k, -8 - r, c); }  // snow on the roof
  blk(8, -18, MOON[4]); blk(9, -18, MOON[4]);
  for (let x = -K; x < 19 * K; x += 1 + (rnd() * 3 | 0)) if (x < 3 * K || x > 15 * K) for (let j = 0, n = 1 + (rnd() * 2.5 * K | 0); j < n; j++) put(fImg, cabX + x, shore - 7 * K + j, MOON[j === n - 1 ? 1 : 2]);  // thin icicles under the eaves
  for (let by = -17; by <= -12; by++) for (let bx = 12; bx <= 13; bx++) blk(bx, by, STN[(bx + by) & 1]);  // stone chimney with a snow cap
  for (let bx = 11; bx <= 14; bx++) blk(bx, -18, MOON[3]);
  for (let by = -7; by <= -3; by++) for (let bx = 3; bx <= 7; bx++) blk(bx, by, WOOD[0]);  // window: frame, four warm panes, a snowy sill
  for (const [bx, by] of [[4, -6], [6, -6], [4, -4], [6, -4], [4, -5], [6, -5]]) blk(bx, by, WIN[3][by === -6 ? 2 : 1]);
  blk(5, -5, WIN[3][0]);
  for (let bx = 3; bx <= 7; bx++) blk(bx, -2, MOON[3]);
  for (let by = -6; by < 0; by++) for (let bx = 10; bx <= 12; bx++) blk(bx, by, bx === 10 ? WOOD[0] : WOOD[1]);  // door with its handle
  blk(12, -3, WIN[3][1]);
  for (let y = 0; y < 5 * K; y++) for (let x = -2 * K; x < 9 * K; x++) if (bay(cabX + 3 * K + x, shore + y) < .3 * (1 - y / (5 * K)) * (1 - Math.abs(x - 3.5 * K) / (6 * K))) put(fImg, cabX + 3 * K + x, shore + y, WIN[3][1]);  // warm light on the snow
  const cy = shore - 9 * K;
  for (let x = -10; x < GW + 10; x += R(4, 14) * K) if (Math.abs(x - cabX - cw / 2) > cw) pine(fImg, x, shore + R(0, 3) * K, R(10, 24) * K, R(2.5, 4) * K, .22, 0);
  ridge(nImg, GH - 8 * K, 4 * K, 30 * K, .08, 0);
  twinkles = makeTwinkles(GW * hz / (1800 * K * K), hz * .7);
  const rays = Array.from({length: 22}, () => { const c = curtains[rnd() * curtains.length | 0]; return {c, x: R(0, GW), v: R(-.15, .15), p: R(0, 6.28)}; });
  const snow = Array.from({length: 90}, () => ({x: R(0, GW), y: R(0, GH), v: R(.15, .5) * K, p: R(0, 6.28)})), smoke = [];
  return {flares: false, shooters: false, draw: t => {
    for (const r of rays) {  // shimmering rays running along the curtains
      r.x += r.v; if (r.x < 0) r.x += GW; if (r.x >= GW) r.x -= GW;
      const b = baseOf(r.c, r.x), len = r.c.len * (.6 + .4 * Math.sin(t / 900 + r.p)), a = .18 + .18 * Math.sin(t / 400 + r.p);
      for (let j = 0; j < len; j += 1) if (b - j < hz) fill(r.x, b - j, j > len * .6 && r.c.pink ? '#f352d6' : '#86f0c8', a * (1 - j / len));
    }
    if (rnd() < .3) smoke.push({x: cabX + 13 * K, y: shore - 19 * K, a: .4, r: 1});
    for (const s of smoke) { s.y -= .25; s.x += .12; s.a -= .003; s.r += .02; fxc.globalAlpha = Math.max(0, s.a); fxc.fillStyle = '#6a58a8'; fxc.fillRect(s.x, s.y, s.r, s.r); }
    while (smoke.length && smoke[0].a <= 0) smoke.shift();
    for (const f of snow) { f.y += f.v; f.x += Math.sin(t / 900 + f.p) * .2; if (f.y > GH) { f.y = -2; f.x = R(0, GW); } fill(f.x, f.y, '#f6f0ff', .75); }
    if (Math.sin(t / 1300) > .97) { fxc.globalAlpha = .5; fxc.fillStyle = '#ffd07a'; fxc.fillRect(cabX + 4 * K, shore - 6 * K, 3 * K, 3 * K); }  // the fire flickers behind the window
  }};
}

/* ---------- 3. Jardin de cerisiers: a pagoda on the hill, a torii, blossoming cherry trees, stone lanterns and a pond; petals fall ---------- */
function sakura(fImg, nImg) {
  const hz = Math.round(GH * R(.5, .55)), mx = R(.15, .85) * GW, pond = Math.round(GH * R(.66, .71));
  skyGrad(fImg, hz, 0, 1);
  skyStars(fImg, hz * .8, GW * GH / (80 * K * K));
  moon(fImg, mx, R(.1, .2) * GH, R(13, 18) * K);
  ridge(fImg, hz - 6 * K, 22 * K, 90 * K, .92, .72);
  mist(fImg, hz, 9 * K, 1, .7);
  // the pagoda on its hill: five roofs with upturned eaves, narrowing upwards, lit windows, a spire
  const px0 = Math.round(R(.2, .8) * GW), pBase = hz + 4 * K;
  ridge(fImg, hz + 6 * K, 10 * K, 50 * K, .62, .5);
  // five tiers kept as a dark silhouette: a few small warm windows, roofs whose eaves sweep up at the tips with a thin moonlit edge
  const ld = mx < px0 ? -1 : 1;  // the side the moon lights
  let y = pBase, w = 24 * K;
  for (let tier = 0; tier < 5; tier++) {
    const wall = Math.round(7 * K - tier * .6 * K), ww = Math.round(w * .5);
    for (let j = 0; j < wall; j++) for (let x = -ww; x <= ww; x++) put(fImg, px0 + x, y - j, SIL[x * ld > ww * .5 ? 3 : 2]);
    for (let x = -ww + 2 * K; x < ww - 2 * K; x += 4 * K) if (rnd() < .55) for (let j = Math.round(wall * .35); j < Math.round(wall * .35) + 2 * K; j++) for (let k = 0; k < 2 * K; k++) put(fImg, px0 + x + k, y - j, WIN[3][1]);
    y -= wall;
    const rh = Math.round(4.5 * K);
    for (let x = -w; x <= w; x++) {
      const u = Math.abs(x) / w, lift = Math.round(u ** 3 * 3 * K), bot = y - lift, top = Math.round(y - rh + u ** 1.6 * (rh - K) - lift), lit = x * ld > 0;
      for (let yy = top; yy <= bot; yy++) put(fImg, px0 + x, yy, yy === bot && lit ? MOON[0] : SIL[lit ? 3 : 2]);
    }
    y -= rh - K; w = Math.round(w * .8);
  }
  for (let j = 0; j < 14 * K; j++) for (let k = 0; k < K; k++) put(fImg, px0 + k - (K >> 1), y - j, SIL[3]);  // the spire with its rings and a jewel on top
  for (let r = 0; r < 5; r++) for (let k = -K - (K >> 1); k <= K + (K >> 1); k++) put(fImg, px0 + k, y - 3 * K - r * 2 * K, SIL[4]);
  for (let j = 0; j < K; j++) for (let k = -1; k <= 1; k++) put(fImg, px0 + k, y - 14 * K - j, MOON[2]);
  // the cherry trees: a branching trunk, clusters of blossom lit from the moon's side, loose petals around them
  const tree = (img, x0, base, h, v, s, a0 = -Math.PI / 2 + R(-.15, .15)) => {
    const ends = [], light = mx < x0 ? -1 : 1;
    const branch = (x, y, a, len, wd, d) => {
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; stroke(img, x, y, x1, y1, wd, SIL[Math.max(0, Math.round(v * 4))]);
      if (d > 4 || len < 4 * K) { ends.push([x1, y1]); return; }
      for (let i = 0, n = 2 + (rnd() < .4 ? 1 : 0); i < n; i++) branch(x1, y1, a + R(-.7, .7), len * R(.6, .78), Math.max(1, wd * .65), d + 1);
    };
    branch(x0, base, a0, h * .32, Math.max(2, h / 16), 0);
    const sz = h / (50 * K);
    for (const [ex, ey] of ends) {
      blob(img, ex + light * R(0, 2) * K * sz, ey, R(5, 8) * K * sz, R(3, 5) * K * sz, BLOSSOM, .15 + v, .55 + v, s + ex, .45);
      for (let i = 0; i < 5; i++) put(img, ex + R(-9, 9) * K * sz, ey + R(-6, 7) * K * sz, BLOSSOM[5 + (rnd() * 2 | 0)]);
    }
  };
  // the far shore: a low dark bank with cherry trees standing on it
  ridge(fImg, pond - 2 * K, 3 * K, 30 * K, .34, .3);
  for (let i = 0, n = 3 + (rnd() * 3 | 0); i < n; i++) {
    let x = R(.04, .96) * GW; if (Math.abs(x - px0) < 18 * K) x += 40 * K;
    tree(fImg, x, pond - R(1, 3) * K, R(34, 50) * K, .25, R(0, 99));
  }
  // the pond: a calm mirror of everything above, broken by soft ripples, with the moon's path
  const fd = fImg.data;
  for (let yy = pond; yy < GH; yy++) {
    const q = (yy - pond) / (GH - pond), my = 2 * pond - yy - 1, f = .62 - q * .25;
    for (let x = 0; x < GW; x++) {
      const wave = fbm(x / (25 * K), yy / (1.4 * K), 3), k = (yy * GW + x) * 4;
      if (my >= 0) { const m = (my * GW + Math.min(GW - 1, Math.max(0, x + Math.round((wave - .5) * 4 * K)))) * 4; fd[k] = fd[m] * f + 6; fd[k + 1] = fd[m + 1] * f + 3; fd[k + 2] = fd[m + 2] * f + 16; fd[k + 3] = 255; }
      const col = Math.abs(x - mx) / ((10 + q * 26) * K);
      if (col < 1 && wave > .52 + col * .3) put(fImg, x, yy, dith(MOON, .6 - col * .5 - q * .3, x, yy));
      else if (wave > .64 && bay(x, yy) < .3) put(fImg, x, yy, dith(SKY, .4 * (1 - q), x, yy));
    }
  }
  // the torii standing in the water, mirrored below its feet
  const tw = Math.round(R(30, 38) * K), tx = Math.round((px0 < GW / 2 ? R(.56, .64) : R(.4, .47)) * GW - tw / 2), th = Math.round(tw * .85), yb = Math.round(pond + R(8, 14) * K), tTop = yb - th;
  const painted = [], tp = (x, y, c) => { put(fImg, x, y, c); painted.push([x, y, c]); };
  const beam = (x0, y0, w, h, v) => { for (let yy = y0; yy < y0 + h; yy++) for (let k = x0; k < x0 + w; k++) tp(k, yy, dith(RED, v + (yy === y0 ? .2 : 0), k, yy)); };
  for (const px of [tx + 3 * K, tx + tw - 6 * K]) for (let yy = tTop; yy < yb; yy++) for (let k = 0; k < 3 * K; k++) tp(px + k, yy, yy > yb - 4 * K ? SIL[1] : dith(RED, .5 + (k < K ? .2 : 0), px + k, yy));
  beam(tx - K, tTop + 7 * K, tw + 2 * K, 2 * K, .45);
  beam(Math.round(tx + tw / 2 - K), tTop, 2 * K, 7 * K, .45);
  beam(tx - 2 * K, tTop - 2 * K, tw + 4 * K, 2 * K, .5);
  for (let k = -4 * K; k < tw + 4 * K; k++) {
    const lift = Math.round(Math.max(0, Math.abs(k - tw / 2) - tw * .36) ** 1.25 * .25);
    for (let j = 0; j < 3 * K; j++) tp(tx + k, tTop - 2 * K - j - lift - 1, j >= 2 * K ? SIL[1] : dith(RED, j === 0 ? .3 : .65, tx + k, tTop - j));
  }
  for (const [x, y0, c] of painted) {
    const ry = 2 * yb - y0, off = Math.round((fbm(ry / (1.4 * K), 3, 2) - .5) * 1.5 * K);
    if (ry < GH && bay(x, ry) < .85) put(fImg, x + off, ry, c.map(v => v * .5 + 8));
  }
  // near: a dark grassy bank, one big cherry tree rising on one side to frame the view, a stone lantern on the other
  const left = px0 > GW / 2;  // the big tree on the side away from the pagoda
  ridge(nImg, GH - P - 5 * K, 4 * K, 40 * K, .1, 0);
  tree(nImg, left ? P + R(4, 14) * K : GW - P - R(4, 14) * K, GH, R(110, 130) * K, .05, 3, -Math.PI / 2 + (left ? .3 : -.3));
  const lanterns = [];
  {
    const lx = Math.round(left ? R(.68, .85) * GW : R(.15, .32) * GW); let lb = Math.round(GH - P - 4 * K), ly = 0;
    for (const [w, h, v] of [[10, 2, .3], [4, 9, .25], [12, 3, .32], [8, 6, .28], [14, 3, .35], [3, 3, .3]]) { lb -= h * K; if (h === 6) ly = lb + 3 * K; for (let j = 0; j < h * K; j++) for (let k = -w * K / 2; k < w * K / 2; k++) put(nImg, lx + k, lb + j, dith(STONE, v, lx + k, lb + j)); }
    lanterns.push([lx, ly]);
    for (let j = -K; j < 2 * K; j++) for (let k = -2 * K; k < 2 * K; k++) put(nImg, lx + k, ly + j, LAVA[5]);
  }
  twinkles = makeTwinkles(GW * hz / (2200 * K * K), hz * .7);
  const petals = Array.from({length: 80}, () => ({x: R(0, GW), y: R(-GH, GH), v: R(.2, .5) * K / 2, p: R(0, 6.28), s: R(.5, 1.5)})), PC = ['#ffb8dc', '#f47cba', '#ffe6f4'];
  return {flares: false, shooters: true, draw: t => {
    for (const p of petals) {
      p.y += p.v; p.x += Math.sin(t / 700 * p.s + p.p) * .35 + .15; if (p.y > GH || p.x > GW + 5) { p.y = R(-20, 0); p.x = R(-GW * .2, GW); }
      const flip = Math.sin(t / 300 * p.s + p.p) > 0; fill(p.x, p.y, PC[(p.p * 3 | 0) % 3], .85); if (flip) fill(p.x + 1, p.y, PC[0], .6); else fill(p.x, p.y + 1, PC[1], .5);
    }
    for (const [x, y] of lanterns) { const b = .55 + .25 * Math.sin(t / 230 + x) + .15 * Math.sin(t / 77 + x); glowStar(x, y, ['rgb(110,40,20)', 'rgb(255,180,74)'], b, 3); }
  }};
}

/* ---------- 4. Volcan: a cone with a glowing crater, lava rivers, a plume of ash; embers rise, it erupts and the plume flashes ---------- */
function volcano(fImg, nImg) {
  const hz = Math.round(GH * R(.62, .7)), cx = Math.round(R(.3, .7) * GW), peak = Math.round(GH * R(.3, .38)), crater = Math.round(R(8, 14) * K), wind = rnd() < .5 ? -1 : 1;
  grad(fImg, 0, hz, HAZE, 0, 1);
  skyStars(fImg, hz * .45, GW * GH / (140 * K * K));
  // the sky reddens around the summit, as if lit by the fire under the smoke
  for (let y = 0; y < hz; y++) for (let x = 0; x < GW; x++) { const g = clamp(1 - Math.hypot((x - cx) / 1.7, y - peak) / (GH * .38)); if (g > 0 && bay(x, y) < g * g * .85) put(fImg, x, y, dith(HAZE, y / hz + g * .35, x, y)); }
  // two far ranges, the nearer one darker, a thin haze between them
  ridge(fImg, hz - 10 * K, 20 * K, 80 * K, .78, .62, true);
  mist(fImg, hz - 4 * K, 5 * K, .9, .6);
  ridge(fImg, hz - 2 * K, 10 * K, 45 * K, .58, .46, true);
  // the plume: puffs rising from the crater and bending with the wind; their undersides near the crater glow orange, fading to grey ash higher up
  const plume = [], WARM = ramp('#1c0a20', '#3a1028', '#5e1a2c', '#8a2a28', '#b84422', '#e0682a');
  for (let i = 0; i < 26; i++) { const q = i / 25, x = cx + wind * q * q * GW * .45 + R(-4, 4) * K, y = peak - q * (peak + 20 * K) * .95, r = (6 + q * 34) * K; plume.push([x, y, r, q]); }
  for (const [px, py, r, q] of [...plume].reverse()) {
    const sd = R(0, 99), X0 = Math.round(px), Y0 = Math.round(py), ry = r * .7;
    for (let y = -Math.ceil(ry * 1.4); y <= ry * 1.4; y++) for (let x = -Math.ceil(r * 1.4); x <= r * 1.4; x++) {
      const X = X0 + x, Y = Y0 + y, n = fbm(X / (7 * K) + sd, Y / (7 * K), 4);
      if (Math.hypot(x / r, y / ry) >= .6 + n * .8) continue;
      const v = .45 + .7 * clamp(.5 - y / ry * .5) + (n - .5) * .25, heat = clamp(1 - q * 2.2) * clamp(.35 + y / ry * .65) + (n - .5) * .3;
      put(fImg, X, Y, heat > .2 && bay(X, Y) < (heat - .2) * 2.2 ? dith(WARM, heat * 1.1, X, Y) : dith(SMOKE, v, X, Y));
    }
  }
  // the cone: steep under the summit, spreading at its foot, the flank out of the wind a little lighter, the rocks near the crater reddened by its glow
  const foot = hz + 10 * K, spread = GW * R(.09, .12), side = x => x < cx === (wind > 0) ? 1 : -1;
  const top = x => { const d = Math.abs(x - cx); if (d < crater) return peak + K; const u = d - crater; return Math.min(foot, peak + (foot - peak) * (1 - Math.exp(-u / spread)) + (fbm(x / (9 * K), 3, 4) - .5) * 6 * K * Math.min(1, u / (12 * K))); };
  const stoneV = (x, y, t0) => .45 - (y - t0) / (GH * .5) * .4 + clamp(Math.abs(x - cx) / (GW * .12)) * side(x) * .05 + (y - t0 < K ? .12 : 0);
  const tops = []; for (let x = 0; x < GW; x++) tops.push(Math.round(top(x)));
  for (let x = 0; x < GW; x++) for (let y = Math.max(0, tops[x]); y < GH; y++) {
    const glow = clamp(1 - Math.hypot((x - cx) / 1.4, y - peak) / (crater * 1.7));
    put(fImg, x, y, glow > 0 && bay(x, y) < glow * .6 ? LAVA[2 + (glow > .6 ? 1 : 0)] : dith(STONE, stoneV(x, y, tops[x]), x, y));
  }
  // gullies carved down the flanks, fanning out from the summit: a dark groove with a lit edge on the side out of the wind
  const hwAt = y => crater - spread * Math.log(Math.max(.02, 1 - (y - peak) / (foot - peak)));
  for (let i = 0, n = 13; i < n; i++) {
    const a = -.92 + 1.84 * (i + R(-.3, .3)) / (n - 1), y0 = peak + R(3, 14) * K, y1 = peak + (foot - peak) * R(.6, .95), sd = R(0, 99);
    for (let y = Math.round(y0); y < y1; y++) {
      const x = Math.round(cx + a * hwAt(y) + (fbm(y / (8 * K), sd, 2) - .5) * 3 * K), fade = 1 - (y - y0) / (y1 - y0);
      if (x < 1 || x >= GW - 1 || y < tops[x] + K) continue;
      put(fImg, x, y, dith(STONE, stoneV(x, y, tops[x]) - .17 * fade, x, y));
      const l = x + side(x); if (y >= tops[l] + K) put(fImg, l, y, dith(STONE, stoneV(l, y, tops[l]) + .1 * fade, l, y));
    }
  }
  // lava rivers fanning out from the rim in dark channels, a crust forming on them as they cool from yellow to red, stopping before the foot
  const lava = [], rivers = [], offs = rnd() < .5 ? [-.75, .7] : [-.8, .05, .8];
  for (const o of offs) {
    let x = cx + o * crater; const end = o === offs[0] ? foot - K : peak + (foot - peak) * R(.5, .9), s0 = R(0, 99), drift = o * .45, path = [];
    for (let y = peak + K; y < end; y++) {
      const u = (y - peak) / (end - peak), w = Math.max(1, Math.round(K * (1.6 - u))), X = Math.round(x + (fbm(y / (10 * K), s0, 3) - .5) * 9 * K * Math.sqrt(u));
      for (let k = -4 * w; k <= 4 * w; k++) if (Math.abs(k) > w + 1 && bay(X + k, y) < .4 * (1 - Math.abs(k) / (4 * w)) * (1 - u * .5)) put(fImg, X + k, y, LAVA[2 + (Math.abs(k) < 2 * w ? 1 : 0)]);
      put(fImg, X - w - 1, y, LAVA[1]); put(fImg, X + w + 1, y, LAVA[1]);
      for (let k = -w; k <= w; k++) { const crust = u > .35 && fbm((X + k) / (2 * K), y / (2 * K) + s0, 2) > .66 - u * .12; put(fImg, X + k, y, crust ? LAVA[1 + (u < .6 ? 1 : 0)] : LAVA[Math.round((Math.abs(k) < w ? 7 : 5) - u * 2.5)]); if (!crust) lava.push([X + k, y]); }
      path.push([X, y]); x += drift * (1 - u * .4) + (fbm(y / (24 * K), s0 + 7, 2) - .5) * .9;
    }
    rivers.push(path);
  }
  // the first river goes on across the plain and winds towards us, wider as it comes closer, its crust cracked over the glow
  {
    const path = [], [x0] = rivers[0][rivers[0].length - 1], sd = R(0, 99), amp = R(.08, .16) * GW, ph = R(0, 6.28), dir = x0 < GW / 2 ? 1 : -1;
    for (let y = foot - K; y < GH; y++) {
      const q = (y - foot) / (GH - foot), X = Math.round(x0 + dir * q * GW * .15 + Math.sin(q * 5 + ph) * amp * q + (fbm(y / (6 * K), sd, 2) - .5) * 4 * K), w = Math.round(K * (1 + q * 7));
      for (let k = -3 * w; k <= 3 * w; k++) if (Math.abs(k) > w + 1 && bay(X + k, y) < .35 * (1 - Math.abs(k) / (3 * w))) put(fImg, X + k, y, LAVA[2 + (Math.abs(k) < 1.6 * w ? 1 : 0)]);
      put(fImg, X - w - 1, y, LAVA[1]); put(fImg, X + w + 1, y, LAVA[1]);
      for (let k = -w; k <= w; k++) { const c = fbm((X + k) / ((1.5 + q * 4) * K), y / ((.8 + q * 2) * K) + sd, 3), crust = c > .5 + .14 * (1 - Math.abs(k) / w); put(fImg, X + k, y, crust ? LAVA[c > .66 ? 1 : 2] : LAVA[Math.abs(k) < w * .5 ? 5 : 4]); if (!crust) lava.push([X + k, y]); }
      path.push([X, y]);
    }
    rivers.push(path);
  }
  // the crater: a notch in the summit, its glowing lip and the light spilling up into the smoke
  for (let k = -crater; k <= crater; k++) {
    const e = 1 - Math.abs(k) / crater;
    put(fImg, cx + k, peak + K, LAVA[4 + Math.round(e * 3)]);
    for (let j = 0; j < 6 * K * e; j++) if (bay(cx + k, peak - j) < (1 - j / (6 * K * e)) * .6) put(fImg, cx + k, peak + K - 1 - j, LAVA[3 + (j < K ? 2 : 0)]);
  }
  // near: a field of cooled black lava broken into plates, the cracks between them still glowing, some already gone dark
  ridge(nImg, GH - 24 * K, 14 * K, 38 * K, .1, 0, true);
  const cell = 11 * K, pts = {}, pt = (i, j) => pts[i + ',' + j] || (pts[i + ',' + j] = [(i + R(.15, .85)) * cell, (j + R(.15, .85)) * cell / 1.7, rnd()]);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (!nImg.data[(y * GW + x) * 4 + 3]) continue;
    const ci = Math.floor(x / cell), cj = Math.floor(y * 1.7 / cell); let d1 = 1e9, d2 = 1e9, hot = 0;
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) { const [px, py, h] = pt(i, j), d = Math.hypot(x - px, (y - py) * 1.7); if (d < d1) { d2 = d1; d1 = d; hot = h; } else if (d < d2) d2 = d; }
    const e = d2 - d1, depth = clamp((y - (GH - 26 * K)) / (14 * K)), heat = fbm(x / (28 * K) + cx, y / (9 * K), 3) * 1.5 - .45, wd = (.6 + depth * 1.2) * K;
    if (heat > .3 && e < wd) { put(nImg, x, y, LAVA[Math.min(7, Math.round(3 + heat * 3 + (e < wd * .4 ? 1 : 0)))]); if (heat > .6 && rnd() < .3) lava.push([x, y]); }
    else if (heat > .2 && e < 4 * K && bay(x, y) < (heat - .2) * .9 * (1 - e / (4 * K)) * (.3 + depth)) put(nImg, x, y, LAVA[e < 1.8 * K ? 3 : 2]);
    else if (e < wd) put(nImg, x, y, SIL[0]); else if (e < wd + K && bay(x, y) < .3) put(nImg, x, y, STONE[1]);
  }
  twinkles = makeTwinkles(GW * hz / (4000 * K * K), hz * .35);
  const embers = [], bursts = []; let bolt = null;
  return {flares: false, shooters: false, draw: t => {
    for (const path of rivers) for (let i = 0; i < 4; i++) { const f = ((t / 9000 + i / 4 + path.length * .013) % 1) ** 1.4, [x, y] = path[(f * path.length) | 0]; fill(x, y, '#ffe48e', .7 * (1 - f)); fill(x, y - 1, '#ffb44a', .4 * (1 - f)); }  // brighter lava sliding down
    for (let i = 0; i < 120; i++) { const [x, y] = lava[(rnd() * lava.length) | 0] || [0, 0]; const b = .5 + .5 * Math.sin(t / 300 + y * .2); if (b > .7) fill(x, y, '#ffe48e', (b - .7) * 2); }  // the lava pulses
    if (rnd() < .5) embers.push({x: cx + R(-crater, crater), y: peak, vx: R(-.3, .3) + wind * .2, vy: -R(.4, 1.1), a: 1});
    if (rnd() < .0025) for (let i = 0; i < 60; i++) bursts.push({x: cx + R(-crater, crater), y: peak, vx: R(-1.4, 1.4), vy: -R(1.2, 3.2), a: 1});  // an eruption
    for (const p of embers) { p.x += p.vx; p.y += p.vy; p.vy *= .995; p.a -= .006; fill(p.x, p.y, p.a > .6 ? '#ffe48e' : '#f6782a', Math.max(0, p.a)); }
    for (const p of bursts) { p.x += p.vx; p.y += p.vy; p.vy += .035; p.a -= .008; fill(p.x, p.y, '#ffb44a', Math.max(0, p.a)); fill(p.x - p.vx, p.y - p.vy, '#d8441c', Math.max(0, p.a) * .5); }
    while (embers.length && embers[0].a <= 0) embers.shift(); while (bursts.length && bursts[0].a <= 0) bursts.shift();
    // volcanic lightning in the plume, now and then
    if (!bolt && rnd() < .0018) { const [x, y] = plume[8 + (rnd() * 10 | 0)], pts = [[x, y]]; for (let i = 0; i < 12; i++) pts.push([pts[i][0] + R(-5, 5) * K / 2, pts[i][1] + R(2, 5) * K / 2]); bolt = {pts, life: 8}; }
    if (bolt) { fxc.globalAlpha = bolt.life / 8; fxc.strokeStyle = '#e6dcff'; fxc.lineWidth = 1; fxc.beginPath(); bolt.pts.forEach(([x, y], i) => i ? fxc.lineTo(x, y) : fxc.moveTo(x, y)); fxc.stroke(); if (bolt.life > 6) { fxc.globalAlpha = .08; fxc.fillStyle = '#e6dcff'; fxc.fillRect(0, 0, GW, hz); } if (--bolt.life <= 0) bolt = null; }
  }};
}

/* ---------- 5. Abysses: rays from the surface, sunken columns, kelp swaying, glowing jellyfish, a whale passing far away ---------- */
function abyss(fImg, nImg) {
  const floor = Math.round(GH * R(.78, .84)), seed = R(0, 99), sx = R(.25, .75) * GW, water = y => 1 - y / GH;
  const SANDB = ramp('#04071a', '#0a1028', '#111a3a', '#1a284e', '#253862', '#334a76');
  grad(fImg, 0, GH, DEEP, 1, 0);
  // the surface far above: a shimmering ceiling of light, and shafts fanning down from it, fading with depth
  for (let y = 0; y < floor; y++) for (let x = 0; x < GW; x++) {
    const a = Math.atan2(x - sx, y + GH * .5), ray = smooth(.55, .88, fbm(a * 9 + seed, 1, 3)) * (1 - y / floor) ** 1.4;
    const cau = y < 14 * K ? smooth(.52, .7, fbm(x / (7 * K) + seed, y / (2.5 * K), 3)) * (1 - y / (14 * K)) : 0;
    if (cau > .05 && bay(x, y) < cau) put(fImg, x, y, DEEP[8]);
    else if (ray > .04 && bay(x, y) < ray * .85) put(fImg, x, y, dith(DEEP, water(y) + .1 + ray * .25, x, y));
  }
  // far seamounts, pale with distance, and a nearer, darker range; ruined columns standing on it
  const range = (base, amp, sc, f) => { const sd = R(0, 99), tops = []; for (let x = 0; x < GW; x++) { const t = Math.round(base - amp * fbm(x / sc + sd, 3, 4)); tops.push(t); for (let y = t; y < GH; y++) put(fImg, x, y, dith(DEEP, water(y) * f + (y - t < K ? .05 : 0), x, y)); } return tops; };
  range(floor - GH * .12, GH * .22, 60 * K, .78);
  const mid = range(floor - GH * .02, GH * .1, 35 * K, .6);
  for (let i = 0, n = 2 + (rnd() * 3 | 0); i < n; i++) {
    const x0 = Math.round(R(.05, .95) * GW), w = Math.round(R(5, 7) * K), base = mid[Math.min(GW - 1, x0 + (w >> 1))] + 2 * K, h = Math.round(R(22, 50) * K), broken = rnd() < .6, lit = sx > x0 ? 1 : -1;
    for (let k = 0; k < w; k++) {
      const hk = broken ? h - Math.round(fbm(k / K, i * 5, 2) * 6 * K) : h, f = (k / (w - 1) - .5) * 2 * lit;
      for (let y = 0; y < hk; y++) put(fImg, x0 + k, base - y, dith(DEEP, water(base - y) * .8 + f * .07 + (k % (2 * K) === 0 ? -.05 : 0), x0 + k, base - y));
    }
    if (!broken) for (let k = -K; k < w + K; k++) for (let j = 0; j < 2 * K; j++) put(fImg, x0 + k, base - h - j, dith(DEEP, water(base - h) * .8 + (j === 2 * K - 1 ? .06 : 0), x0 + k, base - h - j));
  }
  // a kelp forest in the distance: tall stalks with leaves, blue with the water between
  for (let i = 0, n = 7 + (rnd() * 6 | 0); i < n; i++) {
    const x0 = R(0, GW), h = R(.3, .6) * GH, ph = R(0, 6.28), f = R(.8, .88);
    for (let j = 0; j < h; j++) {
      const y = Math.round(floor - j), x = Math.round(x0 + Math.sin(j / (12 * K) + ph) * 2 * K), c = dith(DEEP, water(y) * f, x, y);
      put(fImg, x, y, c); put(fImg, x + 1, y, c);
      if (j % (5 * K) === 0 && j > 4 * K) { const sd = (j / (5 * K)) % 2 ? 1 : -1, L = 7 * K; for (let l = 1; l < L; l++) { const u = l / L, wd = Math.sin(Math.PI * u) * 1.6 * K; for (let d = -wd; d <= wd; d++) put(fImg, x + sd * l * .55, y - l * .85 + d, c); } }
    }
  }
  // the sea floor: blue sand with ripples catching the light, a few boulders lit on top
  const sand = []; for (let x = 0; x < GW; x++) sand.push(Math.round(floor - fbm(x / (30 * K) + seed, 5, 4) * 10 * K));
  for (let x = 0; x < GW; x++) for (let y = sand[x]; y < GH; y++) {
    const q = (y - sand[x]) / (GH - floor + 10 * K), rip = Math.sin((y + (fbm(x / (25 * K) + seed, y / (8 * K), 2) - .5) * 8 * K) / ((.5 + q * 1.2) * K) * 2);
    put(fImg, x, y, dith(SANDB, .55 - q * .45 + (rip > .8 ? .13 : rip < -.5 ? -.05 : 0) + (y - sand[x] < K ? .12 : 0), x, y));
  }
  for (let i = 0, n = 3 + (rnd() * 4 | 0); i < n; i++) { const x = R(0, GW), r = R(4, 10) * K; blob(fImg, x, sand[Math.max(0, Math.min(GW - 1, x | 0))] + r * .3, r, r * .6, SANDB, .15, 1.05, R(0, 99), .25); }
  // near: dark rock outcrops at the sides, a reef growing on them: branching corals lit from above, domes, a sea fan, anemones
  const rock = []; for (let x = 0; x < GW; x++) { const e = Math.min(x, GW - 1 - x) / GW; rock.push(Math.round(GH - P - 2 * K - Math.max(0, .26 - e) * GH * .9 * (.7 + .5 * fbm(x / (12 * K) + seed, 9, 3)))); }
  for (let x = 0; x < GW; x++) for (let y = rock[x]; y < GH; y++) put(nImg, x, y, dith(SANDB, .2 - (y - rock[x]) / (30 * K) * .2 + (y - rock[x] < K ? .25 : 0), x, y));
  const spot = () => { const left = rnd() < .5, x = Math.round(left ? R(P, GW * .22) : R(GW * .78, GW - P)); return [x, rock[Math.max(0, Math.min(GW - 1, x))] + K]; };
  const coral = (x, y, a, len, d, segs) => { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; segs.push([x, y, x1, y1, Math.max(1, 3 - d)]); if (d < 4) for (const da of [-.5, .4]) coral(x1, y1, a + da + R(-.2, .2), len * .72, d + 1, segs); };
  const REEF = [LAVA, BLOSSOM, AUR, NEBM];
  for (let i = 0; i < 6; i++) {
    const [x, y] = spot(), rp = REEF[i % 4], v = rp === NEBM ? .62 : .5, kind = i % 3;
    if (kind === 0) { const segs = []; coral(x, y, -Math.PI / 2 + R(-.3, .3), R(6, 10) * K, 0, segs); for (const [a, b2, c, d, w] of segs) stroke(nImg, a, b2, c, d, w, dith(rp, v - .25, x, y)); for (const [a, b2, c, d, w] of segs) stroke(nImg, a - .5, b2 - 1, c - .5, d - 1, Math.max(1, w - 1), rp[Math.round((rp.length - 1) * (v + .15))]); }
    else if (kind === 1) { const r = R(6, 10) * K; blob(nImg, x, y - r * .3, r, r * .65, rp, v - .4, v + .2, R(0, 99), .15); for (let g = 0; g < 4; g++) { const gy = y - r * .3 - r * .5 + g * r * .3; for (let k = -r * .8; k < r * .8; k += 1) if (bay(x + k | 0, gy | 0) < .5) put(nImg, x + k, gy + Math.sin(k / K) * K * .6, rp[1]); } }
    else { const fh = R(14, 22) * K; for (let r = 0; r < 26; r++) { const a = -Math.PI / 2 + (r / 25 - .5) * 1.7; let px = x, py = y; for (let l = 0; l < fh; l++) { px += Math.cos(a + Math.sin(l / (4 * K) + r) * .15); py += Math.sin(a); if (bay(px | 0, py | 0) < .55) put(nImg, px, py, RED[3 + (l > fh * .6 ? 1 : 0)]); } } }
  }
  for (let i = 0; i < 4; i++) { const [x, y] = spot(), cy = y - 2 * K; for (let k = -K; k <= K; k++) for (let j = 0; j < 2 * K; j++) put(nImg, x + k, y - j, BLOSSOM[3]); for (let t = 0; t < 7; t++) { const a = -Math.PI / 2 + (t / 6 - .5) * 1.8, cv = R(-.6, .6); let px = x + (t - 3) * K * .4, py = cy; for (let l = 0; l < 7 * K; l++) { const b = a + cv * l / (7 * K); px += Math.cos(b) * .8; py += Math.sin(b) * .8; put(nImg, px, py, l > 5 * K ? BLOSSOM[7] : t % 2 ? BLOSSOM[5] : BLOSSOM[6]); } } }
  twinkles = makeTwinkles(GW * GH / (900 * K * K), GH * .9, () => GLOW[2]);  // plankton that glows
  const kelp = Array.from({length: 5}, () => ({x: R(0, GW), h: R(.45, .8) * GH, ph: R(0, 6.28), s: R(.6, 1.2)}));
  const jellies = Array.from({length: 6}, () => ({x: R(0, GW), y: R(0, GH), r: R(4, 8) * K / 2, p: R(0, 6.28), c: rnd() < .5 ? ['#8ee8ee', '#e0ffff'] : ['#ff8ae2', '#ffd0f4']}));
  const snow = Array.from({length: 60}, () => ({x: R(0, GW), y: R(0, GH), v: R(.05, .2)}));
  const bubbles = [], vent = R(.1, .9) * GW;
  const WH = 140 * K / 2, whale = spriteOf(WH, WH * .32, g => {  // a whale, seen far away: dark, a lighter belly, a long fin
    for (let x = 0; x < WH; x++) { const q = x / WH, th = WH * .14 * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (q < .85 ? 1 : (1 - q) * 6); for (let y = -th; y < th * .8; y++) dot(g, x, WH * .16 + y, y > th * .3 ? '#1b3a76' : '#0d1c4a'); }
    for (let x = 0; x < WH * .2; x++) dot(g, WH * .35 + x, WH * .16 + WH * .09 + x * .35, '#0d1c4a', 1, 2);
  });
  let wx = -WH * 2, wy = GH * R(.25, .45);
  return {flares: false, shooters: false, draw: t => {
    wx += .12; if (wx > GW + WH * 6) { wx = -WH * 2; wy = GH * R(.2, .45); } fxc.globalAlpha = .55; fxc.drawImage(whale, wx | 0, (wy + Math.sin(t / 3000) * 3) | 0);
    for (const s of snow) { s.y += s.v; if (s.y > GH) { s.y = 0; s.x = R(0, GW); } fill(s.x, s.y, '#a8c8f0', .35); }
    for (const k of kelp) for (let j = 0; j < k.h; j += 1) {  // near kelp: a two-pixel stalk, long leaves on alternate sides with a float at their base, all swaying
      const sway = Math.sin(t / 1600 * k.s + k.ph + j / (14 * K)) * j / k.h * 9 * K, x = k.x + sway, y = GH - j, lit = ((j / 3 | 0) + (k.ph * 3 | 0)) % 3;
      fill(x, y, lit ? '#1b532c' : '#286c38', .95); fill(x + 1, y, '#123e22', .95);
      if (j % (8 * K) === 0 && j > 5 * K) { const sd = (j / (6 * K)) % 2 ? 1 : -1, lean = Math.sin(t / 1300 * k.s + j) * 2; fill(x + sd, y, '#5a9a4e'); for (let l = 2; l < 11 * K; l++) { const u = l / (11 * K), ly = y - l * .55 + u * u * 4 * K + lean * u, lx = x + sd * l * .7, wd = Math.round(Math.sin(Math.PI * u) * 1.4 * K); for (let d = -wd; d <= wd; d++) fill(lx, ly + d, d === 0 ? '#5a9a4e' : d < 0 ? '#3a8a46' : '#1b532c', .9); } }
    }
    for (const j of jellies) {
      j.y -= .12 + Math.max(0, Math.sin(t / 700 + j.p)) * .25; j.x += Math.sin(t / 2000 + j.p) * .1; if (j.y < -20 * K) { j.y = GH + 10; j.x = R(0, GW); }
      const pulse = 1 + Math.sin(t / 700 + j.p) * .2, rw = j.r * pulse, rh = j.r / pulse;
      for (let a = 0; a <= Math.PI; a += .25) for (let r = 0; r < 1; r += .34) fill(j.x + Math.cos(a) * rw * r, j.y - Math.sin(a) * rh * r, r > .6 ? j.c[1] : j.c[0], .55);
      for (let k = -1; k <= 1; k++) for (let i = 0; i < 6 * K; i++) fill(j.x + k * rw * .5 + Math.sin(t / 400 + i * .5 + k) * 1.5, j.y + i, j.c[0], .45 * (1 - i / (6 * K)));
      glowStar(j.x, j.y - rh * .4, ['rgb(10,40,60)', 'rgb(142,232,238)'], .25, 0);
    }
    if (rnd() < .25) bubbles.push({x: vent + R(-3, 3), y: GH - 6 * K, v: R(.4, .9)});
    for (const b of bubbles) { b.y -= b.v; b.x += Math.sin(b.y / 9) * .3; fill(b.x, b.y, '#e0ffff', .6); fill(b.x + 1, b.y, '#8ee8ee', .3); }
    while (bubbles.length && bubbles[0].y < 0) bubbles.shift();
  }};
}

/* ---------- 6. Station orbitale: the night side of a planet with its city lights, the dawn on its rim, the station's modules and solar wings ---------- */
function orbit(fImg, nImg) {
  const seed = R(0, 99), Rp = GW * R(.95, 1.25), pcx = R(.3, .7) * GW, pcy = GH + Rp * R(.55, .7), sunA = R(-.8, .8);
  // stars and a faint nebula behind
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const n = fbm(x / (40 * K) + seed, y / (40 * K), 4); if (n > .55) put(fImg, x, y, dith(NEBV, (n - .55) * 1.4, x, y)); }
  skyStars(fImg, GH, GW * GH / (45 * K * K));
  // the planet as a real sphere: the sun comes from one side, so a day side with a glint on the sea, a warm band at dusk, a night side with cities
  const s0 = sunA < 0 ? -1 : 1, L0 = [s0 * R(.75, .95), R(-.05, .15), R(.15, .4)], Ln = Math.hypot(...L0), L = L0.map(v => v / Ln), Hn = Math.hypot(L[0], L[1], L[2] + 1), H = [L[0] / Hn, L[1] / Hn, (L[2] + 1) / Hn];
  const ATM = ramp('#0a1440', '#1e3c8c', '#3c78d0', '#8cc8ff', '#e0f4ff'), DUSK = ramp('#1a0c2a', '#4a1c3c', '#90363c', '#d0663a', '#f4a45a'), DRY = ramp('#1a1408', '#3a2c14', '#5e4822', '#866a34', '#ae8e4c'), ICE = ramp('#2a3050', '#5a6890', '#a0b0d0', '#e8f0ff'), CLOUD = ramp('#2c3250', '#5c6688', '#9aa6c8', '#d4dcf0', '#f6f9ff');
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const dx = (x - pcx) / Rp, dy = (y - pcy) / Rp, d = Math.hypot(dx, dy);
    if (d > 1 + 6 * K / Rp) continue;
    if (d > 1) {  // the atmosphere seen edge-on: blue on the day side, orange where the sun sets, nothing at night
      const a = 1 - (d - 1) / (6 * K / Rp), lam = dx / d * L[0] + dy / d * L[1];
      if (lam > -.25 && bay(x, y) < a * a * clamp(lam * 2 + .5)) put(fImg, x, y, lam < .1 ? dith(DUSK, .5 + a * .4, x, y) : dith(ATM, .35 + a * .55, x, y));
      continue;
    }
    const nx = dx, ny = dy, nz = Math.sqrt(1 - d * d), lam = nx * L[0] + ny * L[1] + nz * L[2];
    const y2 = ny * Math.cos(-.45) - nz * Math.sin(-.45), z2 = ny * Math.sin(-.45) + nz * Math.cos(-.45), lat = Math.asin(clamp(-y2)), lon = Math.atan2(nx, z2) + seed, w = fbm(lon * 2, lat * 3, 3);
    const land = fbm(lon * 3 + w * .8, lat * 5 + 9, 5), dry = fbm(lon * 6 + 4, lat * 8, 3), cloud = fbm(lon * 5 + w * 1.6 + 3, lat * 9 - w, 5), cshad = fbm(lon * 5 + w * 1.6 + 3 - .03, lat * 9 - w + .05, 5);
    const ice = lat > .95 + (fbm(lon * 8, 5, 2) - .5) * .12, isLand = land > .56, haze = clamp((.25 - nz) * 4);
    let c;
    if (lam > .03) {  // day
      const li = clamp(.15 + lam * 1.6), sh = cshad > .6 && cloud <= .6 ? .2 : 0;
      if (cloud > .6) c = dith(CLOUD, li * .85 + (cloud - .6) * 1.5 - (cloud < .63 ? .15 : 0), x, y);
      else if (ice) c = dith(ICE, li * .9 - sh, x, y);
      else if (isLand) c = dry > .55 ? dith(DRY, li * .85 + (land - .56) * .8 - sh, x, y) : dith(LANDP, li * .9 + (land - .56) - sh, x, y);
      else { const spec = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]) ** 60; c = spec > .25 && bay(x, y) < spec * 1.2 ? MOON[4] : dith(OCEANP, li * .8 + (land > .5 ? .12 : 0) - sh, x, y); }
      if (haze > 0 && bay(x, y) < haze * .8) c = dith(ATM, .3 + li * .4, x, y);  // the air thickens towards the rim
      if (lam < .14 && bay(x, y) < (1 - (lam - .03) / .11) * .55) c = dith(DUSK, .45 + (cloud > .6 ? .4 : 0), x, y);  // the light turns warm towards dusk
    } else if (lam > -.05) {  // dusk: the clouds still catch the sun, the ground below is already in shadow
      const u = (lam + .05) / .08;
      c = cloud > .6 ? dith(DUSK, .25 + u * .75, x, y) : dith(DUSK, u * .3, x, y);
    } else {  // night: dark seas, clouds faintly grey, the lights of the cities clustered on the land
      const city = fbm(lon * 70, lat * 70, 2), lit = isLand && !ice && cloud < .62 && city > .64 && bay(x, y) < (city - .64) * 6;
      c = lit ? WIN[3][city > .74 ? 2 : 1] : cloud > .6 ? SIL[3] : isLand ? SIL[2] : dith(OCEANP, .08, x, y);
    }
    put(fImg, x, y, c);
  }
  // the station: a long truss, white modules ringed with seams, solar wings of blue cells, its lit side facing the sun
  const METAL = ramp('#141020', '#2a2638', '#46425a', '#6c6a84', '#a4a4bc', '#dcdcec'), CELL = ramp('#070a20', '#10163c', '#1a2462', '#28388a', '#3e54ae', '#6a84d0');
  const side = rnd() < .5 ? -1 : 1, sy = Math.round(GH * R(.18, .3)), x0 = Math.round(side < 0 ? -20 : GW * .42), x1 = Math.round(side < 0 ? GW * .58 : GW + 20), lights = [], litX = L[0] > 0 ? 1 : -1;
  for (let x = x0; x < x1; x++) {  // the truss: two rails and diagonals
    put(nImg, x, sy - K, METAL[4]); put(nImg, x, sy - K + 1, METAL[2]); put(nImg, x, sy + 2 * K, METAL[3]); put(nImg, x, sy + 2 * K + 1, METAL[1]);
    const m = ((x - x0) % (3 * K) + 3 * K) % (3 * K); put(nImg, x, sy - K + 2 + Math.round(m * (3 * K - 2) / (3 * K)), METAL[2]);
  }
  const wing = (wx, wy, dir) => {  // a solar wing: a mast and two blankets of cells, a sheen running across them
    const ww = 9 * K, wh = 26 * K;
    for (let j = 0; j < wh; j++) put(nImg, wx, wy + dir * j, METAL[3]);
    for (const off of [-ww - K, K]) for (let j = 2 * K; j < wh; j++) for (let k = 0; k < ww; k++) {
      const X = wx + off + k, Y = wy + dir * j, grid = k % (3 * K) === 0 || j % (2 * K) === 0, sheen = clamp(1 - Math.abs((k - j * .5 * litX + 20 * K) % (30 * K) - 15 * K) / (6 * K));
      put(nImg, X, Y, grid ? METAL[2] : dith(CELL, .35 + sheen * .4 + (k === 0 || k === ww - 1 ? .15 : 0), X, Y));
    }
  };
  for (const [f, len] of [[.3, 26 * K], [.7, 18 * K]]) {
    const mx = Math.round(x0 + (x1 - x0) * f), r = 4 * K, cyM = sy + K;
    wing(mx + len / 2 | 0, cyM - r - K, -1); wing(mx + len / 2 | 0, cyM + r + K, 1);
    for (let x = 0; x < len; x++) for (let y = -r; y <= r; y++) {  // a module: a cylinder lit from above, seams every few pixels, round ends
      const q = y / r, end = Math.min(x, len - 1 - x) < K && Math.abs(q) > .7;
      if (end) continue;
      const v = .55 - q * .35 - q * q * .15 + (x % (6 * K) < 1 ? -.25 : 0) + (x * litX > len / 2 * litX ? .05 : 0);
      put(nImg, mx + x, cyM + y, dith(METAL, v, mx + x, cyM + y));
    }
    for (let x = 3 * K; x < len - 3 * K; x += 6 * K) put(nImg, mx + x, cyM - K, WIN[3][rnd() < .7 ? 2 : 1]);
    for (let j = 0; j < 7 * K; j++) for (let k = 0; k < 5 * K; k++) put(nImg, mx + len - 6 * K + k + j * .4, cyM + r + j, k % (2 * K) ? METAL[4] : METAL[3]);  // a white radiator, angled
    lights.push([mx + len, cyM - r, '#ff4f6d'], [mx, cyM + r, '#8ee8a0']);
  }
  twinkles = makeTwinkles(GW * GH / (2500 * K * K), GH * .6);
  const sats = Array.from({length: 3}, () => ({a: R(0, 6.28), v: R(.0006, .0012) * (rnd() < .5 ? 1 : -1), r: Rp + R(8, 30) * K}));
  const SH = spriteOf(9, 4, g => { dot(g, 0, 1, '#d9ccf6', 6, 2); dot(g, 6, 0, '#a594d8', 3, 4); dot(g, 1, 1, '#7fe0ee', 1, 1); });
  let shuttle = 0;
  return {flares: true, shooters: false, draw: t => {
    for (const [x, y, c] of lights) if (Math.sin(t / 500 + x) > .6) glowStar(x, y, [c, c], .9, 2);
    for (const s of sats) { s.a += s.v; const x = pcx + Math.sin(s.a) * s.r, y = pcy - Math.cos(s.a) * s.r; if (y < GH && x > 0 && x < GW) fill(x, y, '#fff', Math.sin(t / 200) > 0 ? .9 : .4); }
    shuttle = (shuttle + .15) % (GW * 1.6); const sx = side < 0 ? x1 + 160 * K - shuttle * .5 : x0 - 160 * K + shuttle * .5;  // a shuttle coming to dock
    fxc.globalAlpha = 1; fxc.save(); fxc.translate(sx | 0, (sy + K) | 0); if (side > 0) fxc.scale(-1, 1); fxc.drawImage(SH, 0, 0); fxc.restore();
    if ((t / 120 | 0) % 2) fill(sx + (side < 0 ? 9 : -2), sy + K + 1, '#ffb44a', .9);
  }};
}

/* ---------- 7. Toits la nuit: zinc roofs, chimneys and dormers, a church in the distance, a cat on the ridge; smoke rises ---------- */
function rooftops(fImg, nImg) {
  const hz = Math.round(GH * R(.5, .56));
  skyGrad(fImg, hz + 20 * K, 0, 1);
  skyStars(fImg, hz * .8, GW * GH / (90 * K * K));
  moon(fImg, R(.1, .9) * GW, R(.1, .22) * GH, R(9, 13) * K);
  // the far city: blocks, a dome and a church spire, few lights
  for (let x = 0; x < GW;) { const w = R(6, 16) * K, h = R(4, 18) * K; for (let y = hz - h; y < GH; y++) for (let k = 0; k < w; k++) put(fImg, x + k, y, dith(SIL, .78 - (y - hz + h) / GH * .2, x + k | 0, y | 0)); for (let i = 0; i < w * h / (30 * K * K); i++) put(fImg, x + R(1, w - 1), hz - R(1, h), WIN[3][1]); x += w; }
  const spire = R(.1, .9) * GW; for (let y = 0; y < 40 * K; y++) { const w = Math.max(0, Math.round((y / (40 * K)) * 4 * K)); for (let k = -w; k <= w; k++) put(fImg, spire + k, hz - 40 * K + y, SIL[5]); }
  const dome = (spire + GW * .4) % GW; for (let y = 0; y < 14 * K; y++) { const w = Math.sqrt(1 - (y / (14 * K)) ** 2) * 12 * K; for (let k = -w; k <= w; k++) put(fImg, dome + k, hz - y, SIL[5]); }
  mist(fImg, hz + 4 * K, 8 * K, .9, .55);
  // two rows of mansard roofs, near ones in the near layer
  const smokes = [], wins = [];
  const roofs = (img, base, hMin, hMax, scale, v, near) => {
    for (let x = R(-30, 0) * K; x < GW;) {
      const w = Math.round(R(34, 70) * K * scale), top = Math.round(base - R(hMin, hMax) * K * scale), slope = Math.round(8 * K * scale), x0 = Math.round(x);
      for (let y = top; y < GH; y++) {
        const inset = y < top + slope * 1.6 ? Math.round((top + slope * 1.6 - y) * .6) : 0;  // the steep mansard slope
        for (let k = inset; k < w - inset; k++) { const seam = (k % Math.round(4 * K * scale)) === 0 && y < top + slope * 1.6; put(img, x0 + k, y, dith(SIL, v + (seam ? .1 : 0) + (y < top + K ? .14 : 0) - (y > top + slope * 1.6 ? .04 : 0), x0 + k, y)); }
      }
      for (let d = x0 + 8 * K * scale; d < x0 + w - 12 * K * scale; d += R(14, 22) * K * scale) {  // dormers, some lit
        const dw = Math.round(6 * K * scale), dy = top + Math.round(slope * .5), lit = rnd() < .45;
        for (let j = 0; j < dw; j++) for (let k = 0; k < dw; k++) put(img, d + k, dy + j, SIL[Math.round(v * 7) + 1]);
        for (let j = 0; j < dw / 2; j++) for (let k = j; k < dw - j; k++) put(img, d + k, dy - j, SIL[Math.round(v * 7) + 2]);
        for (let j = 2; j < dw - 1; j++) for (let k = 2; k < dw - 2; k++) put(img, d + k, dy + j, lit ? WIN[3][j < 3 ? 2 : 1] : SIL[1]);
        if (lit) wins.push([d + 2, dy + 2, dw - 4, dw - 3]);
      }
      for (let i = 0, n = 1 + (rnd() * 2 | 0); i < n; i++) {  // chimney stacks with their pots
        const cx = Math.round(x0 + R(.1, .8) * w), ch = Math.round(R(8, 14) * K * scale), cw = Math.round(R(6, 10) * K * scale);
        for (let j = 0; j < ch; j++) for (let k = 0; k < cw; k++) put(img, cx + k, top - j, dith(STONE, .35 + (k < K ? .15 : 0), cx + k, top - j));
        for (let p = 0, np = 1 + (rnd() * 3 | 0); p < np; p++) { const px = cx + Math.round((p + .5) * cw / np) - K; for (let j = 0; j < 3 * K * scale; j++) for (let k = 0; k < 2 * K; k++) put(img, px + k, top - ch - j, RED[3]); if (rnd() < .6) smokes.push([px + K, top - ch - 3 * K * scale, near]); }
        if (rnd() < .4) { const ax = cx + cw / 2; for (let j = 0; j < 14 * K * scale; j++) put(img, ax, top - ch - j, SIL[3]); for (let k = -5 * K * scale; k < 5 * K * scale; k++) put(img, ax + k, top - ch - 10 * K * scale, SIL[3]); }
      }
      x += w + R(0, 4) * K;
    }
  };
  roofs(fImg, hz + 22 * K, 6, 16, .7, .5, false);
  roofs(nImg, GH - 30 * K, 4, 14, 1.1, .16, true);
  // the cat, sitting on the nearest ridge, its tail moves
  const CAT = ['.o...o..', '.oo.oo..', '.ooooo..', '.o.o.o..', '.ooooo..', '..ooo...', '.ooooo..', 'ooooooo.', 'ooooooo.', 'ooooooo.'];
  let catX = Math.round(R(.2, .8) * GW), catY = GH - 1;
  for (let y = GH - 60 * K; y < GH; y++) if (nImg.data[(y * GW + catX) * 4 + 3]) { catY = y; break; }
  CAT.forEach((r, j) => { for (let k = 0; k < r.length; k++) if (r[k] === 'o') for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) put(nImg, catX + k * K + a, catY - (CAT.length - j) * K + b, SIL[0]); });
  put(nImg, catX + 2 * K, catY - 7 * K, MOON[3]); put(nImg, catX + 4 * K, catY - 7 * K, MOON[3]);
  twinkles = makeTwinkles(GW * hz / (2200 * K * K), hz * .6);
  const puffs = [];
  return {flares: false, shooters: true, draw: t => {
    for (const [x, y, near] of smokes) if (rnd() < .12) puffs.push({x, y, a: near ? .35 : .22, r: 1, v: R(.15, .3)});
    for (const p of puffs) { p.y -= p.v; p.x += .1 + Math.sin(p.y / 20) * .1; p.a -= .0018; p.r += .03; fxc.globalAlpha = Math.max(0, p.a); fxc.fillStyle = '#6a58a8'; fxc.fillRect(p.x - p.r / 2, p.y, p.r, p.r); }
    while (puffs.length && puffs[0].a <= 0) puffs.shift();
    for (const [x, y, w, h] of wins) if (Math.sin(t / 5000 + x * 7) > .985) { fxc.globalAlpha = .85; fxc.fillStyle = '#07021a'; fxc.fillRect(x, y, w, h); }  // someone switches off for a moment
    const sw = Math.sin(t / 600) * 3;  // the tail
    for (let i = 0; i < 6 * K; i++) fill(catX + 7 * K + i * .7, catY - K - Math.abs(Math.sin(i / (6 * K) * 2 + sw * .3)) * i * .6, '#030008');
    if (Math.sin(t / 2400) > .995) { fill(catX + 2 * K, catY - 7 * K, '#030008'); fill(catX + 4 * K, catY - 7 * K, '#030008'); }  // a blink
  }};
}

/* ---------- 8. Cascade dans la jungle: cliffs and vines, a temple on the edge, a waterfall that flows into a misty pool, giant leaves ---------- */
function jungle(fImg, nImg) {
  const hz = Math.round(GH * R(.42, .5)), seed = R(0, 99), fx = Math.round(R(.38, .62) * GW), fw = Math.round(R(14, 22) * K), lip = Math.round(GH * R(.28, .36)), pool = Math.round(GH * R(.8, .85));
  skyGrad(fImg, hz + 10 * K, 0, 1);
  skyStars(fImg, hz * .8, GW * GH / (90 * K * K));
  moon(fImg, R(.1, .9) * GW, R(.08, .18) * GH, R(8, 12) * K);
  ridge(fImg, hz, 30 * K, 80 * K, .95, .78, true);
  mist(fImg, hz + 6 * K, 10 * K, 1, .7);
  // cliffs on both sides of the fall, mossy, with hanging vines
  const cliff = (x, y) => { const e = fbm(y / (14 * K) + seed, 3, 4) * 20 * K; return x < fx - fw / 2 - 10 * K + e * .5 || x > fx + fw / 2 + 10 * K - e * .5 || y < lip - 2 * K; };
  for (let y = lip - 14 * K; y < pool; y++) for (let x = 0; x < GW; x++) {
    const d = Math.min(Math.abs(x - (fx - fw / 2)), Math.abs(x - (fx + fw / 2))), top = lip - 10 * K - fbm(x / (12 * K), seed, 4) * 26 * K * smooth(0, GW * .3, Math.abs(x - fx));
    if (y < top || !cliff(x, y)) continue;
    const moss = fbm(x / (5 * K), y / (5 * K) + seed, 3) > .7 - (y - top < 3 * K ? .25 : 0);
    put(fImg, x, y, moss ? dith(LEAF, .2 + (1 - d / GW) * .25, x, y) : dith(STONE, .32 - (y - lip) / GH * .3 + (fbm(x / (2 * K), y / (6 * K), 2) > .6 ? .1 : 0), x, y));
  }
  for (let i = 0; i < 26; i++) { const x = rnd() < .5 ? R(0, fx - fw) : R(fx + fw, GW), y0 = lip + R(-8, 20) * K, len = R(20, 80) * K; for (let j = 0; j < len; j++) { const X = x + Math.sin(j / (10 * K) + i) * 2 * K, Y = y0 + j; put(fImg, X, Y, LEAF[4]); if (j % (5 * K) === 0) { put(fImg, X + 1, Y, LEAF[6]); put(fImg, X - 1, Y + 1, LEAF[5]); } } }
  // the temple on the left edge: stepped, a dark door, vines over it
  const tx = Math.round(R(.05, .2) * GW), tb = Math.round(lip - 12 * K);
  for (let s = 0; s < 5; s++) { const w = (40 - s * 7) * K, h = 5 * K; for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) put(fImg, tx + s * 3.5 * K + k, tb - s * h - j, dith(STONE, .45 + (j === h - 1 ? .12 : 0), tx + k, tb - j)); }
  for (let j = 0; j < 6 * K; j++) for (let k = 0; k < 4 * K; k++) put(fImg, tx + 18 * K + k, tb - 25 * K + j - 6 * K, j < 2 * K ? WIN[3][1] : SIL[0]);
  // the pool: foam where the fall hits, the moon mirrored, ripples
  for (let y = pool; y < GH; y++) for (let x = 0; x < GW; x++) { const q = (y - pool) / (GH - pool), w = fbm(x / (16 * K), y / (1.5 * K), 3), foam = Math.abs(x - fx) < fw * (1.2 + q) && q < .35; put(fImg, x, y, foam && w > .4 ? dith(MOON, .7 - q, x, y) : dith(DEEP, .5 - q * .3 + (w - .5) * .4, x, y)); }
  // near: giant leaves in the corners (a midrib, slits)
  const leaf = (cx, cy, len, a, w) => { const ca = Math.cos(a), sa = Math.sin(a); for (let i = 0; i < len; i++) { const half = Math.sin(Math.PI * i / len) * w; for (let j = -half; j <= half; j++) { if (Math.abs(j) > 2 && (i + Math.abs(j) * 1.4) % (7 * K) < K) continue; const X = cx + ca * i - sa * j, Y = cy + sa * i + ca * j; put(nImg, X, Y, dith(LEAF, .22 + (Math.abs(j) < 1.2 ? .25 : 0) + (j < 0 ? .06 : 0), X | 0, Y | 0)); } } };
  for (let i = 0; i < 4; i++) leaf(-10 * K, GH - R(10, 60) * K, R(70, 120) * K, R(-.9, -.1), R(16, 26) * K);
  for (let i = 0; i < 4; i++) leaf(GW + 10 * K, GH - R(10, 60) * K, R(70, 120) * K, Math.PI + R(.1, .9), R(16, 26) * K);
  twinkles = makeTwinkles(GW * hz / (2000 * K * K), hz * .7);
  const fall = fallSprite(fw, pool - lip), mistP = [], flies = Array.from({length: 26}, () => ({x: R(0, GW), y: R(lip, GH), p: R(0, 6.28), s: R(.4, 1)}));
  return {flares: false, shooters: true, draw: t => {
    flowFall(fall, fx - fw / 2, lip, pool - lip, t, 1.4);
    for (let i = 0; i < 3; i++) mistP.push({x: fx + R(-fw, fw), y: pool + R(-2, 3) * K, vx: R(-.4, .4), vy: -R(.1, .4), a: .3});
    for (const m of mistP) { m.x += m.vx; m.y += m.vy; m.a -= .004; fxc.globalAlpha = Math.max(0, m.a); fxc.fillStyle = '#d9ccf6'; fxc.fillRect(m.x, m.y, 2, 2); }
    while (mistP.length && mistP[0].a <= 0) mistP.shift();
    for (const f of flies) { f.x += Math.sin(t / 2100 * f.s + f.p) * .25; f.y += Math.cos(t / 2700 * f.s + f.p * 2) * .15; const b = ((Math.sin(t / 800 * f.s + f.p) + 1) / 2) ** 3; if (b > .05) glowStar(f.x, f.y, ['rgb(70,90,20)', 'rgb(200,235,100)'], b, 0); }
  }};
}

/* ---------- 9. Îles flottantes: islands of rock and grass over a sea of clouds, falls pouring into the void, a rope bridge, an airship ---------- */
function floating(fImg, nImg) {
  const sea = Math.round(GH * R(.74, .8)), seed = R(0, 99), mx = R(.12, .88) * GW, my = R(.1, .22) * GH, litS = mx > GW / 2 ? 1 : -1;
  skyGrad(fImg, GH, .1, 1);
  skyStars(fImg, GH * .5, GW * GH / (110 * K * K));
  moon(fImg, mx, my, R(10, 14) * K);
  // long thin clouds high up, silver where they pass near the moon
  for (let c = 0; c < 3; c++) {
    const cy = R(.12, .5) * GH, ch = R(3, 6) * K, x0 = R(-.2, .7) * GW, cw = R(.25, .55) * GW, cs = R(0, 99);
    for (let y = Math.round(cy - ch); y < cy + ch; y++) for (let x = Math.max(0, x0 | 0); x < Math.min(GW, x0 + cw); x++) {
      const e = 1 - Math.abs(y - cy) / ch, f = fbm(x / (20 * K) + cs, y / (4 * K), 4) * Math.min(1, (x - x0) / (cw * .2), (x0 + cw - x) / (cw * .2)) * e;
      if (f > .3) { const near = clamp(1 - Math.hypot(x - mx, y - my) / (60 * K)); put(fImg, x, y, f < .36 && y < cy && near > 0 ? dith(MOON, near * 1.2, x, y) : dith(SKY, .25 + (y - cy + ch) / (2 * ch) * .3 + near * .3, x, y)); }
    }
  }
  // the sea of clouds: a far row of small billows, then big rounded ones lit on top, shadowed in the hollows between them
  const billows = (base, rMin, rMax, v0, hz) => {
    const domes = []; for (let x = -rMax * K; x < GW + rMax * K; x += R(.9, 1.5) * rMin * K) domes.push([x, R(rMin, rMax) * K]);
    for (let x = 0; x < GW; x++) {
      let t = base, rr = rMin * K, dcx = 0;
      for (const [dx, r] of domes) { const d = x - dx; if (Math.abs(d) < r) { const y = base - Math.sqrt(r * r - d * d) * .55; if (y < t) { t = y; rr = r; dcx = d; } } }
      t = Math.round(t);
      for (let y = t; y < GH; y++) {
        const into = (y - t) / (14 * K), side = dcx / rr * litS * clamp(1 - into);
        put(fImg, x, y, dith(MOON, v0 - clamp(into) * .3 - (y - base) / (GH * .6) * .2 + side * .14 + (y - t < K ? .15 : 0) + (fbm(x / (6 * K), y / (4 * K) + seed, 3) - .5) * .2 - hz * .4 * clamp((y - base) / (60 * K)), x, y));
      }
    }
  };
  billows(sea - 6 * K, 6, 12, .45, .1);
  billows(sea + 8 * K, 14, 26, .6, .45);
  // the islands: a grassy top seen a little from above, a body of banded rock tapering to a jagged point, lit on the moon's side,
  // roots and vines hanging from the rim, loose stones floating around; the far ones paler in the haze
  const isl = [], GRASS = ramp('#06140c', '#0c2614', '#143a1c', '#1e5226', '#2c6e30', '#44903c', '#6cb44c');
  const island = (img, cx, cy, w, depth, haze, big) => {
    const th = Math.round(w * .14), sd = R(0, 99);
    for (let x = -w; x <= w; x++) {
      const q = x / w, X = cx + x, rimY = cy + Math.round(Math.sqrt(1 - q * q) * th), topY = cy - Math.round(Math.sqrt(1 - q * q) * th * .6 + fbm(x / (6 * K) + sd, 1, 3) * K);
      const bot = rimY + depth * (1 - Math.abs(q)) ** 1.3 * (.6 + .6 * fbm(x / (4 * K) + sd, 2, 4));
      for (let y = topY; y < rimY; y++) put(img, X, y, dith(GRASS, .45 + (y - topY) / (rimY - topY + 1) * .25 + q * litS * .1 + haze + (fbm(X / (2 * K), y / (2 * K), 2) - .5) * .2, X, y));  // the top
      for (let y = rimY; y < bot; y++) {  // the rock body
        const u = (y - rimY) / depth, band = Math.sin((y - rimY) / (4 * K) + fbm(x / (12 * K) + sd, 3, 2) * 4), crev = fbm(x / (1.6 * K) + sd, y / (14 * K), 2) > .67;
        put(img, X, y, y - rimY < 2 * K ? dith(GRASS, .6 - (y - rimY) / (2 * K) * .3 + haze, X, y) : dith(STONE, .36 + q * litS * .22 - u * .3 + (band > .75 ? .1 : 0) - (crev ? .14 : 0) + haze, X, y));
      }
      if (rnd() < .06 && Math.abs(q) < .9) { const L = R(4, 18) * K; for (let j = 0; j < L; j++) put(img, X + Math.round(Math.sin(j / (3 * K)) * K * .6), rimY + 2 * K + j, j > L * .6 ? STONE[2] : GRASS[3]); }  // roots and vines
    }
    for (let i = 0; i < (big ? 4 : 2); i++) { const r = R(1.5, 4) * K, rx = cx + R(-1, 1) * w * 1.2, ry = rimY0(cy, th) + R(.3, 1) * depth; for (let y = -r; y < r; y++) for (let x = -r; x < r; x++) if (Math.hypot(x, y * 1.4) < r) put(img, rx + x, ry + y, dith(STONE, .4 - y / r * .25 + x / r * litS * .15 + haze, rx + x | 0, ry + y | 0)); }
    return th;
  };
  const rimY0 = (cy, th) => cy + th;
  for (let i = 0, n = 5 + (rnd() * 2 | 0); i < n; i++) {
    const big = i === 0, w = Math.round((big ? R(60, 76) : R(18, 42)) * K), cx = Math.round(big ? R(.32, .68) * GW : R(.03, .97) * GW), cy = Math.round(GH * (big ? R(.46, .52) : R(.18, .6))), depth = Math.min(w * R(.75, 1.05), (sea - cy) * .8);
    if (isl.some(o => Math.abs(o.cx - cx) < (o.w + w) * 1.05 && Math.abs(o.cy - cy) < (o.depth + depth) * .7)) continue;
    isl.push({cx, cy, w, depth, big, haze: big ? 0 : clamp((60 * K - w) / (60 * K)) * .25});
  }
  isl.sort((a, b) => a.w - b.w);
  for (const o of isl) {
    const img = o.big ? nImg : fImg;
    o.th = island(img, o.cx, o.cy, o.w, o.depth, o.haze, o.big);
    for (let k = 0, nt = o.big ? 5 : 1 + (rnd() * 2 | 0); k < nt; k++) { const tx = o.cx + R(-.75, .75) * o.w; if (o.big && Math.abs(tx - o.cx) < 14 * K) continue; if (rnd() < .5) pine(img, tx, o.cy + K, R(10, 18) * K * (o.big ? 1.2 : .8), R(2.5, 4) * K, .1 + o.haze, litS); else blob(img, tx, o.cy - 6 * K, R(4, 7) * K, R(4, 6) * K, GRASS, .3 + o.haze, .85 + o.haze, R(0, 99)); }
    if (o.big) {  // a cottage: stone walls, a red roof with a lit edge, two warm windows, a chimney, light spilling on the grass
      const hx = o.cx - 7 * K, hy = o.cy + K;
      for (let j = -2 * K; j < 2 * K; j++) for (let k = -6 * K; k < 20 * K; k++) if (bay(hx + k, hy + j) < .35 * (1 - Math.abs(k - 7 * K) / (13 * K))) put(img, hx + k, hy + j, GRASS[6]);
      for (let j = 0; j < 10 * K; j++) for (let k = 0; k < 14 * K; k++) put(img, hx + k, hy - j, dith(STONE, .45 + (litS > 0 ? k / (14 * K) : 1 - k / (14 * K)) * .2 + ((j / (2 * K) | 0) % 2 && k % (4 * K) === 0 ? -.15 : 0), hx + k, hy - j));
      for (let j = 0; j < 7 * K; j++) for (let k = -2 * K + j; k < 16 * K - j; k++) put(img, hx + k, hy - 10 * K - j, j === 0 || (litS > 0 ? k > 15 * K - j - K : k < -2 * K + j + K) ? RED[5] : RED[3 + (j % (2 * K) === 0 ? -1 : 0)]);
      for (let j = 0; j < 7 * K; j++) for (let k = 0; k < 2 * K; k++) put(img, hx + 10 * K + k, hy - 13 * K - j, STONE[3]);
      for (const wx of [2 * K, 9 * K]) { for (let j = 0; j < 3 * K; j++) for (let k = 0; k < 3 * K; k++) put(img, hx + wx + k, hy - 6 * K + j, WIN[3][j < K ? 2 : 1]); }
      o.chimney = [hx + 11 * K, hy - 20 * K];
    }
  }
  // a rope bridge with planks between the two nearest islands on the same side
  const byX = [...isl].sort((p, q) => p.cx - q.cx);
  for (let i = 0; i + 1 < byX.length; i++) {
    const a = byX[i], b = byX[i + 1]; if (b.cx - a.cx > GW * .45 || a.big === b.big && false) continue;
    const x0 = a.cx + a.w * .85, x1 = b.cx - b.w * .85, y0 = a.cy, y1 = b.cy; if (x1 <= x0) continue;
    for (let x = x0; x <= x1; x++) { const q = (x - x0) / (x1 - x0), y = y0 + (y1 - y0) * q + Math.sin(q * Math.PI) * 8 * K; put(fImg, x, y, STONE[5]); put(fImg, x, y - 4 * K, STONE[4]); if ((x | 0) % (2 * K) === 0) { put(fImg, x, y + 1, RED[2]); for (let j = 1; j < 4 * K; j++) if (j % 2) put(fImg, x, y - j, STONE[3]); } }
    break;
  }
  twinkles = makeTwinkles(GW * GH / (3500 * K * K), GH * .45);
  // waterfalls spilling off the smaller islands, thinning into mist long before they reach the clouds
  const falls = isl.filter(o => !o.big).slice(-2).map(o => { const x = o.cx + o.w * R(-.4, .4), y = o.cy + o.th, h = Math.round((sea - y) * R(.45, .6)); for (let j = -4 * K; j < 16 * K; j++) for (let k = -10 * K; k < 13 * K; k++) { const m = clamp(1 - Math.hypot((k - 1.5 * K) / (11 * K), (j - 2 * K) / (12 * K))) * fbm((x + k) / (4 * K), (y + h + j) / (4 * K), 2); if (bay(x + k | 0, y + h + j | 0) < m * 1.2) put(fImg, x + k, y + h + j, MOON[m > .35 ? 3 : 2]); } return {x, y, h, spr: fallSprite(Math.max(3, 4 * K), h)}; });
  const big = isl.find(o => o.big), smoke = [];
  const ship = spriteOf(44 * K / 2, 26 * K / 2, g => { const w = 44 * K / 2; for (let x = 0; x < w; x++) { const h = Math.sqrt(1 - ((x - w / 2) / (w / 2)) ** 2) * 7 * K / 2; dot(g, x, 8 * K / 2 - h, x < w * .3 ? '#a8307e' : '#701654', 1, h * 2); if (x % 5 === 0) dot(g, x, 8 * K / 2 - h, '#d24494', 1, h * 2); } dot(g, w * .3, 16 * K / 2, '#3e2b52', w * .4, 4 * K / 2); dot(g, w * .35, 17 * K / 2, '#ffd07a', 2, 2); dot(g, w * .55, 17 * K / 2, '#ffd07a', 2, 2); });
  let sx = -60 * K, sy = GH * R(.15, .3);
  const birds = Array.from({length: 5}, () => ({x: R(0, GW), y: R(.15, .5) * GH, s: R(.15, .3), p: R(0, 6.28)}));
  return {flares: false, shooters: true, draw: t => {
    for (const f of falls) { flowFall(f.spr, f.x, f.y, f.h, t, 1.1); for (let i = 0; i < 2; i++) fill(f.x + R(-3, 7), f.y + f.h - R(0, 4), '#f6f0ff', .5); }
    if (big && big.chimney && rnd() < .2) smoke.push({x: big.chimney[0], y: big.chimney[1], a: .4, r: 1.5});
    for (const s of smoke) { s.y -= .3; s.x += .12 + Math.sin(s.y / 9) * .12; s.r += .03; s.a -= .003; fxc.globalAlpha = Math.max(0, s.a); fxc.fillStyle = '#b8a8e0'; fxc.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2); } while (smoke.length && smoke[0].a <= 0) smoke.shift();
    sx += .18; if (sx > GW + 60 * K) { sx = -60 * K; sy = GH * R(.12, .3); }
    fxc.globalAlpha = 1; fxc.drawImage(ship, sx | 0, (sy + Math.sin(t / 1500) * 2) | 0); if ((t / 90 | 0) % 2) fill(sx - 1, sy + 8 * K / 2, '#ffd0f4', .8);
    for (const bd of birds) { bd.x += bd.s; if (bd.x > GW + 10) bd.x = -10; const up = Math.sin(t / 170 + bd.p) > 0 ? 1 : 0; fill(bd.x, bd.y, '#0c0426'); fill(bd.x - 1, bd.y - up, '#0c0426'); fill(bd.x + 1, bd.y - up, '#0c0426'); }
  }};
}

/* ---------- 10. Train de nuit: a lit train crossing a stone viaduct over a valley, a village and its river below ---------- */
function train(fImg, nImg) {
  const hz = Math.round(GH * R(.42, .48)), vy = Math.round(GH * R(.5, .56)), river = Math.round(GH * R(.8, .84)), mx = R(.1, .9) * GW, my = R(.1, .22) * GH, litS = mx > GW / 2 ? 1 : -1;
  skyGrad(fImg, hz + 20 * K, 0, 1);
  skyStars(fImg, hz * .9, GW * GH / (70 * K * K));
  moon(fImg, mx, my, R(9, 13) * K);
  ridge(fImg, hz - 6 * K, 26 * K, 110 * K, .95, .82, true);
  mist(fImg, hz - 2 * K, 7 * K, 1, .5);
  ridge(fImg, hz + 4 * K, 22 * K, 90 * K, .86, .72, true);
  mist(fImg, hz + 10 * K, 9 * K, .95, .6);
  ridge(fImg, hz + 22 * K, 16 * K, 60 * K, .7, .58);
  // the village on the bank: houses with lit roofs and warm windows, a church with its spire, round trees between them
  const vils = [], bank = river - K;
  for (let y = bank - 6 * K; y < river; y++) for (let x = 0; x < GW; x++) put(fImg, x, y, dith(SIL, .55 - (y - bank + 6 * K) / (6 * K) * .15, x, y));
  for (let x = R(0, 20) * K; x < GW; x += R(9, 18) * K) {
    if (rnd() < .25) { blob(fImg, x + 3 * K, bank - 6 * K, R(4, 6) * K, R(4, 5) * K, SIL, .35, .6, R(0, 99), .3); continue; }
    const w = Math.round(R(8, 13) * K), h = Math.round(R(6, 10) * K), base = Math.round(bank - R(0, 4) * K);
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) put(fImg, x + k, base - j, dith(SIL, .5 + (litS > 0 ? k > w - K : k < K) * .15, x + k, base - j));
    for (let j = 0; j < w / 2 + K; j++) for (let k = j - K; k < w - j + K; k++) put(fImg, x + k, base - h - j, (litS > 0 ? k >= w - j : k <= j - K + 1) ? SIL[7] : SIL[6]);
    for (let i = 0, n = 1 + (rnd() * 2 | 0); i < n; i++) if (rnd() < .7) { const wx = x + Math.round((i + .5) * w / n - K), wy = base - Math.round(h * .6); for (let j = 0; j < 2 * K; j++) for (let k = 0; k < 2 * K; k++) put(fImg, wx + k, wy + j, WIN[3][j < K ? 2 : 1]); vils.push([wx + K, wy + K]); }
  }
  { const bx = Math.round(R(.2, .8) * GW), base = bank - 2 * K;  // the church: nave, square tower, slate spire, a lit window
    for (let j = 0; j < 10 * K; j++) for (let k = -12 * K; k < 4 * K; k++) put(fImg, bx + k, base - j, SIL[5]);
    for (let j = 0; j < 6 * K; j++) for (let k = -13 * K + j; k < 4 * K - j; k++) put(fImg, bx + k, base - 10 * K - j, SIL[6]);
    for (let j = 0; j < 24 * K; j++) for (let k = 0; k < 6 * K; k++) put(fImg, bx + k, base - j, (litS > 0 ? k >= 5 * K : k < K) ? SIL[7] : SIL[5]);
    for (let j = 0; j < 16 * K; j++) { const w = Math.round((16 * K - j) / (16 * K) * 3.5 * K); for (let k = -w; k <= w; k++) put(fImg, bx + 3 * K + k, base - 24 * K - j, (k * litS > 0) ? SIL[7] : SIL[6]); }
    for (let j = 0; j < 3 * K; j++) for (let k = 0; k < 2 * K; k++) put(fImg, bx + 2 * K + k, base - 18 * K + j, WIN[3][1]);
    vils.push([bx + 3 * K, base - 17 * K]); }
  // the viaduct: a deck with a coping lit by the moon, piers of dressed stone, round arches with a ring of voussoirs; through them the valley
  const span = Math.round(R(36, 48) * K), off = R(0, span), deck = 5 * K, rA = span / 2 - 4 * K, spring = vy + deck + 8 * K + rA, ring = 3 * K, VIA = ramp('#0b0618', '#160d2a', '#24183c', '#342550', '#463566', '#5c4a7c', '#7a6698');
  for (let y = vy; y < river + K; y++) for (let x = 0; x < GW; x++) {
    const dx = ((x + off) % span + span) % span - span / 2, ad = Math.abs(dx), above = y < spring, r = above ? Math.hypot(dx, spring - y) : ad;
    if (y > vy + deck && r < rA) continue;  // the opening
    const inRing = r >= rA && r < rA + ring && y > vy + deck;
    let v = .5 - (y - vy) / GH * .4;
    if (inRing) { const a = Math.atan2(spring - y, dx); v += .08 + (Math.abs(a * rA / (2 * K)) % 1 < .18 ? -.14 : 0); }
    else { const row = Math.floor((y - vy) / (2 * K)), brick = ((x + off + (row % 2) * 2.5 * K) % (5 * K)) < 1, joint = (y - vy) % (2 * K) === 0; v += (brick || joint ? -.1 : 0) + (fbm(x / (3 * K), y / (3 * K), 2) - .5) * .12; }
    if (!above && ad >= rA && ad < rA + 2 * K) v += (dx * litS < 0 ? .1 : -.12);  // the inner faces of the piers, one lit, one in shade
    if (y < vy + K) v += .3; else if (y < vy + 2 * K) v -= .12;  // the coping and its shadow
    put(fImg, x, y, dith(VIA, v, x, y));
  }
  for (let x = 0; x < GW; x++) { if (x % (3 * K) < K) for (let j = 1; j < 3 * K; j++) put(fImg, x, vy - j, VIA[4]); put(fImg, x, vy - 3 * K, VIA[5]); }  // the railing
  for (let x = 0; x < GW; x += 24 * K) for (let j = 0; j < 16 * K; j++) put(fImg, x + 4 * K, vy - j, STONE[4]);  // the poles of the line
  for (let x = 0; x < GW; x++) put(fImg, x, vy - 15 * K + Math.round(Math.sin(((x % (24 * K)) / (24 * K)) * Math.PI) * K), STONE[3]);
  // the river: a dark mirror of the arches and the village, broken by slow ripples, with the moon's path and the lamps drawn out sideways
  const fd = fImg.data;
  for (let y = river; y < GH; y++) {
    const q = (y - river) / (GH - river), my2 = 2 * river - y - 1;
    for (let x = 0; x < GW; x++) {
      const w = fbm(x / (30 * K), y / (1.2 * K), 3), k = (y * GW + x) * 4, m = (my2 * GW + Math.min(GW - 1, Math.max(0, x + Math.round((w - .5) * 4 * K)))) * 4;
      fd[k] = fd[m] * .55 + 4; fd[k + 1] = fd[m + 1] * .55 + 3; fd[k + 2] = fd[m + 2] * .6 + 12; fd[k + 3] = 255;
      const col = Math.abs(x - mx) / ((10 + q * 30) * K);
      if (col < 1 && w > .48 + col * .3) put(fImg, x, y, dith(MOON, .55 - col * .4 - q * .3, x, y));
      else if (w > .66 && bay(x, y) < .25) put(fImg, x, y, dith(SKY, .5 * (1 - q), x, y));
    }
  }
  for (const [lx, ly] of vils) { const ry = 2 * river - ly; for (let j = 0; j < 4; j++) { const y = Math.round(ry - 3 * K + j * 3 * K + R(-1, 1)), len = (4 - j) * R(.5, 1.2) * K, dx = R(-1, 1) * K; if (y > river && y < GH) for (let k = -len; k < len; k++) put(fImg, lx + dx + k, y, WIN[3][j < 2 ? 1 : 0]); } }
  // near: a few dark firs at the sides only, rimmed on the moon's side, and a low bank
  for (const sd of [-1, 1]) for (let i = 0, n = 1 + (rnd() * 2 | 0); i < n; i++) { const x = sd < 0 ? R(-6, 40) * K : GW - R(-6, 40) * K; pine(nImg, x, GH - R(0, 4) * K, R(38, 66) * K, R(9, 13) * K, .14, litS); }
  ridge(nImg, GH - 6 * K, 4 * K, 30 * K, .06, 0);
  twinkles = makeTwinkles(GW * hz / (1800 * K * K), hz * .8);
  // the train, drawn once: a steam engine and its tender, then coaches with rounded roofs, framed warm windows, doors and bogies
  const carW = 30 * K, cars = 6, TH = 12 * K, LOCO = 34 * K, total = cars * (carW + K) + 16 * K + LOCO, BODY = '#1c0c42', LINE = '#c8a050';
  const trainSpr = spriteOf(total, TH + 2, g => {
    const wheel = (x, y, r, c) => { for (let a = 0; a < 6.28; a += .2) dot(g, x + Math.cos(a) * r, y + Math.sin(a) * r, c); dot(g, x - .5, y - .5, '#3e2b52', 1, 1); };
    for (let c = 0; c < cars; c++) {
      const x0 = c * (carW + K);
      dot(g, x0 + K, 1, '#2e1a52', carW - 2 * K, K); dot(g, x0, 1 + K, '#3e2468', carW, K);  // the rounded roof, lit on top
      dot(g, x0, 2 * K + 1, BODY, carW, 7 * K); dot(g, x0, 7 * K + 1, LINE, carW, 1);
      for (let w = 3 * K; w < carW - 4 * K; w += 4 * K) { const on = rnd() < .85; dot(g, x0 + w - 1, 3 * K, '#0c0426', 2.5 * K + 2, 3 * K + 2); dot(g, x0 + w, 3 * K + 1, on ? '#ffd07a' : '#3a2050', 2.5 * K, 3 * K); if (on) dot(g, x0 + w, 3 * K + 1, '#ffe8b0', 2.5 * K, 1); if (on && rnd() < .25) dot(g, x0 + w + K, 4 * K, '#7a4a30', K, 2 * K); }
      dot(g, x0 + carW - 2 * K, 3 * K, '#120830', 1.5 * K, 6 * K);
      dot(g, x0 + K, 9 * K + 1, '#0c0426', carW - 2 * K, K);
      for (const bx of [4 * K, carW - 4 * K]) { wheel(x0 + bx - 1.5 * K, 10.5 * K, K * .9, '#4a3a5a'); wheel(x0 + bx + 1.5 * K, 10.5 * K, K * .9, '#4a3a5a'); }
    }
    const t0 = cars * (carW + K);  // the tender, coal heaped on top
    dot(g, t0, 3 * K + 1, BODY, 15 * K, 6 * K); dot(g, t0, 3 * K, '#0c0816', 15 * K, K); dot(g, t0, 7 * K + 1, LINE, 15 * K, 1); for (const bx of [3 * K, 11 * K]) wheel(t0 + bx, 10.5 * K, K * .9, '#4a3a5a');
    const l0 = t0 + 16 * K;  // the engine: cab with a lit window, boiler with bands, dome, chimney, red wheels, the lamp in front
    dot(g, l0, 1, '#2e1a52', 10 * K, K); dot(g, l0, K + 1, BODY, 10 * K, 8 * K); dot(g, l0 + 3 * K, 3 * K, '#ffb04a', 4 * K, 3 * K);
    dot(g, l0 + 10 * K, 4 * K, '#2a1650', 20 * K, 5 * K); dot(g, l0 + 10 * K, 4 * K, '#4a2e78', 20 * K, K);
    for (let b = 13 * K; b < 30 * K; b += 5 * K) dot(g, l0 + b, 4 * K, LINE, 1, 5 * K);
    dot(g, l0 + 17 * K, 2.5 * K, '#3a2268', 3 * K, 1.5 * K); dot(g, l0 + 25 * K, 0, '#120830', 2.5 * K, 4 * K); dot(g, l0 + 24.5 * K, 0, '#2e1a52', 3.5 * K, K);
    dot(g, l0 + 30 * K, 5 * K, '#120830', 2 * K, 4 * K); dot(g, l0 + 30 * K, 5 * K, '#fff4c0', 1.5 * K, 1.5 * K);
    dot(g, l0 + 10 * K, 9 * K, '#0c0426', 22 * K, K);
    for (const bx of [14 * K, 20 * K]) { for (let r = 0; r < 1.8 * K; r += .5) wheel(l0 + bx, 10 * K, r, r > 1.3 * K ? '#a8303a' : '#2a1640'); }
    wheel(l0 + 27 * K, 10.5 * K, K * .9, '#4a3a5a'); wheel(l0 + 5 * K, 10.5 * K, K * .9, '#4a3a5a');
    dot(g, l0 + 14 * K, 10 * K, '#c8c0d8', 6 * K, 1);  // the coupling rod
    for (let k = 0; k < 3 * K; k++) dot(g, l0 + 32 * K + k * .3, 9 * K + k * .3, '#3e2b52', 1, 1);
  });
  let tx = R(-trainSpr.width, GW * .3); const steam = [];
  return {flares: false, shooters: true, draw: t => {
    tx += .55 * K; if (tx > GW + 400 * K) tx = -trainSpr.width - R(100, 600) * K;
    const ty = vy - TH - 1;
    fxc.globalAlpha = 1; fxc.drawImage(trainSpr, tx | 0, ty | 0);
    const head = tx + trainSpr.width - K;
    for (let i = 0; i < 40 * K; i++) { const a = .22 * (1 - i / (40 * K)); for (let j = -i * .15; j <= i * .15; j += 2) fill(head + i, ty + 6 * K + j, '#e6dcff', a * .5); }  // the headlight
    const chim = tx + trainSpr.width - 8 * K; if (rnd() < .35) steam.push({x: chim + R(-1, 1), y: ty - K, a: .4, r: K});  // steam rolling back over the coaches, silver in the moonlight
    for (const s of steam) { s.y -= .15; s.x -= .3; s.r += .09; s.a -= .0035; fxc.globalAlpha = Math.max(0, s.a); fxc.fillStyle = '#d8d0f0'; fxc.beginPath(); fxc.arc(s.x | 0, s.y | 0, s.r | 0, 0, 6.29); fxc.fill(); } while (steam.length && steam[0].a <= 0) steam.shift();
    for (let c = 0; c < cars; c++) { const x = tx + c * (carW + K) + carW / 2; if (x > 0 && x < GW) for (let j = 0; j < 6 * K; j++) fill(x + R(-carW / 3, carW / 3), river + 2 + j * 2, '#ffd07a', .22 * (1 - j / (6 * K))); }  // its windows in the river
    if (rnd() < .02) { const sx = tx + R(0, trainSpr.width); fill(sx, vy - 14 * K, '#8ee8ee'); fill(sx + 1, vy - 13 * K, '#e0ffff'); }  // a spark on the wire
    for (const [x, y] of vils) if (Math.sin(t / 3000 + x) > .99) fill(x, y, '#0c0426');
  }};
}

Object.assign(SCENES, {desert, aurora, sakura, volcano, abyss, orbit, rooftops, jungle, floating, train});
if (SCENES[scene] && document.body.dataset.scene !== scene) generate();  // the first frame used a decor of this file before it was loaded
