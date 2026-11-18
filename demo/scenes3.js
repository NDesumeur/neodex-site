/* ---------- 5 more decors (Paramètres > Décor): Halloween, Noël, Nouvel An, Lanternes, Lucioles. Built like scenes2.js: drawn at 1/S
   resolution with limited palettes and ordered dithering, a far layer and a near layer that drift, an fx layer animated at 30 fps. ---------- */
const DUSKP = ramp('#06020e', '#120526', '#240a3a', '#3c0f46', '#5a164a', '#80224a', '#a83a3e', '#d0602e', '#f09a3a');
const PUMPK = ramp('#1a0600', '#4a1404', '#8a2c06', '#c8500a', '#f07c14', '#ffb040', '#ffe08a');
const HMOON = ramp('#5a1e08', '#a8441a', '#e07a2a', '#ffb860', '#ffe2a8');
const NIGHTP = ramp('#020414', '#050a24', '#0a1236', '#101c4a', '#18285c', '#22366e', '#2e4682');
const SNOWP = ramp('#1c2048', '#2e3668', '#46508a', '#6c78b4', '#9aa6d8', '#c8d2f2', '#f0f4ff');
const PINEP = ramp('#01060a', '#041016', '#081c22', '#0e2a2e', '#163a3a');
const WALLP = ramp('#120810', '#22121a', '#341c22', '#4a282a', '#603630');
const LDUSK = ramp('#04031a', '#0a0830', '#151046', '#24185a', '#3a2066', '#58286c', '#7e346a', '#a84a62', '#d0705a', '#f0a060');

// a big lit disc with a dithered halo, in any palette (the Halloween moon)
function orb(img, cx, cy, r, rp, hr) {
  const seed = R(0, 99);
  for (let y = -r - hr; y <= r + hr; y++) for (let x = -r - hr; x <= r + hr; x++) {
    const d = Math.hypot(x, y), X = cx + x, Y = cy + y;
    if (d <= r) put(img, X, Y, dith(rp, .92 - smooth(.5, .72, fbm(x / (r * .45) + seed, y / (r * .45), 3)) * .3 - (x + y) / r * .12 - smooth(.8, 1, d / r) * .15, X, Y));
    else if (d < r + hr && bay(X, Y) < .55 * (1 - (d - r) / hr)) put(img, X, Y, rp[0]);
  }
}
// rolling ground under a noisy skyline around row `base`, in any palette; returns the top row of each column
function hill(img, base, amp, sc, rp, v0, v1) {
  const s = R(0, 400), top = [];
  for (let x = 0; x < GW; x++) {
    top[x] = Math.round(base - amp * fbm(x / sc + s, s, 4));
    for (let y = Math.max(0, top[x]); y < GH; y++) put(img, x, y, dith(rp, v0 + (v1 - v0) * clamp((y - top[x]) / (GH * .4)), x, y));
  }
  return top;
}
// still water below row hz: the picture above, mirrored, darker and rippled
function reflectWater(img, hz, dim) {
  const d = img.data, s = R(0, 99);
  for (let y = hz; y < GH; y++) {
    const sy = Math.max(0, 2 * hz - y - 1), deep = (y - hz) / (GH - hz), q = dim * (1 - deep * .35);
    for (let x = 0; x < GW; x++) {
      const off = Math.round(Math.sin(y * .7 + s + fbm(x / (20 * K), y / (2 * K) + s, 2) * 4) * (1 + deep * 2 * K)), k = (sy * GW + Math.min(GW - 1, Math.max(0, x + off))) * 4;
      put(img, x, y, [Math.round(d[k] * q + 3), Math.round(d[k + 1] * q + 5), Math.round(d[k + 2] * q + 16)]);
    }
  }
}
// pixels of a small picture given as rows of characters, each one K art pixels wide
function glyph(rows, x, y, k, f) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') f(x + i * k, y + j * k, r[i]); }); }

/* ---------- 1. Halloween: a huge orange moon, a manor on the hill, dead trees, a graveyard with carved pumpkins; bats, a ghost and fog ---------- */
function deadTree(img, x, y, ang, len, w, depth, c) {
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
  stroke(img, x, y, x2, y2, w, c);
  if (depth <= 0 || len < 2 * K) return;
  const n = 2 + (rnd() < .4 ? 1 : 0);
  for (let i = 0; i < n; i++) deadTree(img, x2, y2, ang + R(-.6, .6) + (i - (n - 1) / 2) * .45, len * R(.55, .78), Math.max(1, w * .65), depth - 1, c);
}
function pumpkin(img, cx, cy, r, face) {
  const rx = r * 1.3;
  for (let y = -Math.ceil(r * 2.4); y <= r * 2; y++) for (let x = -Math.ceil(rx * 2); x <= rx * 2; x++) {  // its glow on the ground and the air around
    const d = Math.hypot(x / (rx * 2), y / (r * 2.2)), X = cx + x | 0, Y = cy + y | 0;
    if (d < 1 && bay(X, Y) < (1 - d) * .45) put(img, X, Y, PUMPK[1 + (d < .5 ? 1 : 0)]);
  }
  for (let y = -r; y <= r; y++) for (let x = -Math.ceil(rx); x <= rx; x++) {
    const d = (x / rx) ** 2 + (y / r) ** 2; if (d > 1) continue;
    const rib = Math.abs(Math.cos(x / rx * Math.PI * 2.5)), X = cx + x | 0, Y = cy + y | 0;
    put(img, X, Y, dith(PUMPK, .3 + (1 - d) * .32 - (x + y) / (r * 6) + rib * .1 - (y > r * .5 ? .12 : 0), X, Y));
  }
  for (let j = 0; j < r * .5; j++) for (let k = 0; k < K; k++) put(img, cx + j * .35 + k, cy - r - j + 1, [38, 52, 18]);  // the stem
  const lit = (x, y) => { put(img, x, y, PUMPK[6]); face.push([x | 0, y | 0]); }, e = Math.max(2, Math.round(r * .32));
  for (const s of [-1, 1]) for (let i = 0; i < e; i++) for (let k = -i; k <= i; k++) lit(cx + s * r * .48 + k, cy - r * .42 + i);  // triangle eyes
  for (let x = -Math.round(r * .75); x <= r * .75; x++) {  // the jagged grin
    const tooth = Math.floor((x + r) / Math.max(2, r * .3)) % 2, h = Math.round(r * .3 * (1 - (x / r) ** 2));
    for (let y = tooth ? 1 : 0; y <= h; y++) lit(cx + x, cy + r * .2 + y + (Math.abs(x) > r * .5 ? -1 : 0));
  }
}
function halloween(fImg, nImg) {
  const hz = Math.round(GH * R(.6, .66));
  grad(fImg, 0, hz + 8 * K, DUSKP, 0, 1);
  skyStars(fImg, hz * .45, GW * GH / (170 * K * K));
  const mr = Math.round(R(15, 21) * K), mx = Math.round(R(.15, .85) * GW), my = Math.round(R(.17, .27) * GH);
  orb(fImg, mx, my, mr, HMOON, 7 * K);
  // two long banks of cloud, dark against the dusk, their undersides lit orange by the moon or the last light
  const cs = R(0, 99), b1 = my + mr * R(.7, 1), b2 = hz * R(.5, .6);
  const cloud = (x, y) => fbm(x / (26 * K) + cs, y / (7 * K) + cs, 4) * Math.max(Math.exp(-(((y - b1) / (8 * K)) ** 2)), Math.exp(-(((y - b2) / (11 * K)) ** 2)) * .95) + (fbm(x / (70 * K) + cs, cs, 2) - .5) * .25;
  for (let y = Math.max(0, b1 - 14 * K); y < Math.min(hz, b2 + 18 * K); y++) for (let x = 0; x < GW; x++) {
    const n = cloud(x, y); if (n < .34) continue;
    const md = Math.hypot(x - mx, y - my) / (mr * 3.5), under = cloud(x, y + 1.5 * K) < .34, over = cloud(x, y - K) < .34;
    put(fImg, x, y, under ? (md < 1 ? HMOON[md < .5 ? 2 : 1] : DUSKP[Math.min(8, 3 + Math.round(y / hz * 5))]) : over && md < 1.4 ? HMOON[0] : dith(SIL, .64 - (n - .34) * .5 - (md < 1 ? 0 : .06), x, y));
  }
  // far hazy hills with a dead wood along their crest
  const hx = Math.round((mx < GW / 2 ? R(.6, .8) : R(.2, .4)) * GW), litS = mx < hx ? -1 : 1, hs = R(0, 99);
  const far = hill(fImg, hz + 4 * K, 12 * K, 60 * K, SIL, .66, .45);
  for (let i = 0; i < 26; i++) { const x = Math.round(R(0, GW)); if (Math.abs(x - hx) > 50 * K) deadTree(fImg, x, far[x] + K, -Math.PI / 2 + R(-.25, .25), R(2, 4.5) * K, K, 3, SIL[6]); }
  // the manor's hill: a mound rising out of the plain, its slope toward the moon lit along the crest
  const mt = [];
  for (let x = 0; x < GW; x++) mt[x] = Math.round(hz + 12 * K - 34 * K * Math.exp(-(((x - hx) / (75 * K)) ** 2)) - 5 * K * fbm(x / (22 * K) + hs, hs, 3));
  for (let x = 0; x < GW; x++) for (let y = mt[x]; y < GH; y++) { const d = y - mt[x], lit = (x - hx) * litS > 0 && d < K; put(fImg, x, y, lit ? SIL[6] : dith(SIL, .44 - d / (GH * .5) * .3 + ((x - hx) * litS > 0 ? .04 : 0), x, y)); }
  // the path winding down from the door, lanterns along it
  const by = mt[hx] + 2 * K, faces = [], wins = [];
  for (let t = 0; t <= 1; t += .002) { const px = hx + Math.sin(t * 7) * 16 * K * t, py = by + t * (GH - by) * .5; for (let k = -K - t * 2 * K; k <= K + t * 2 * K; k++) put(fImg, px + k, py, dith(SIL, .8 - t * .25, px + k | 0, py | 0)); }
  for (const t of [.25, .5, .78]) { const px = Math.round(hx + Math.sin(t * 7) * 16 * K * t + 4 * K), py = Math.round(by + t * (GH - by) * .5);
    for (let j = 0; j < 6 * K; j++) put(fImg, px, py - j, SIL[1]);
    for (let y = -4 * K; y <= 4 * K; y++) for (let x = -4 * K; x <= 4 * K; x++) { const d = Math.hypot(x, y) / (4 * K); if (d < 1 && bay(px + x, py - 7 * K + y) < (1 - d) * .4) put(fImg, px + x, py - 7 * K + y, PUMPK[2]); }
    for (let j = 0; j < 2 * K; j++) for (let k = -K; k < K; k++) put(fImg, px + k, py - 7 * K + j, PUMPK[5]); wins.push([px - K, py - 7 * K, 2 * K, 2 * K, 1]); }
  // the manor: a stone body with a floor band, a steep slate roof with dormers and chimneys, two towers of unequal height, gothic windows
  const bw = 22 * K, bh = 18 * K, rh = 15 * K;
  const wall = (x0, x1, y0, y1, v) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const lit = litS < 0 ? x < x0 + K : x >= x1 - K; put(fImg, x, y, lit ? SIL[5] : dith(SIL, v + ((y - y0) % (3 * K) === 0 ? -.04 : 0), x, y)); } };
  const spire = (cx, y1, w, h) => { for (let j = 0; j < h; j++) { const hw = w * j / h; for (let x = -hw; x <= hw; x++) put(fImg, cx + x, y1 - h + j, (x * litS > hw - K) ? SIL[5] : (j % (2 * K) === 0 ? SIL[1] : SIL[2])); } for (let j = 0; j < 3 * K; j++) put(fImg, cx, y1 - h - j, SIL[3]); };
  const gwin = (x, y, w, h, on) => {  // a pointed window: its top rows narrow to an arch, a dark mullion and transom when lit
    for (let j = 0; j < h; j++) { const hw = j < w / 2 ? Math.round(Math.sqrt(j / (w / 2)) * w / 2) : w / 2; for (let k = -hw; k < hw; k++) put(fImg, x + w / 2 + k, y + j, !on ? SIL[0] : (k === -1 || k === 0 && K > 1) || j === Math.round(h * .55) ? SIL[2] : PUMPK[j < h * .3 ? 6 : 5]); }
    if (on) wins.push([x, y, w, h]);
  };
  wall(hx - bw, hx + bw, by - bh, by + 2 * K, .14);
  for (let x = hx - bw - K; x < hx + bw + K; x++) put(fImg, x, by - bh * .5, SIL[3]);  // the floor band
  for (let j = 0; j < rh; j++) { const hw = bw + 2 * K - j * (bw + 2 * K) / rh; for (let x = -hw; x <= hw; x++) put(fImg, hx + x, by - bh - j, x * litS > hw - K ? SIL[5] : (j % (2 * K) === 0 ? SIL[1] : dith(SIL, .2, hx + x | 0, by - bh - j))); }
  for (const s of [-.45, .45]) { const dx = Math.round(hx + s * bw), dy = by - bh - 4 * K; for (let j = 0; j < 5 * K; j++) { const hw = 3 * K - j * .6; for (let x = -hw; x <= hw; x++) put(fImg, dx + x, dy - j, SIL[1]); } gwin(dx - K, dy - 2 * K, 2 * K, 3 * K, rnd() < .6); }
  for (const s of [-.6, .35]) { const cx = Math.round(hx + s * bw); wall(cx, cx + 3 * K, by - bh - rh * (1 - Math.abs(s) * .9) - 5 * K, by - bh - rh * (1 - Math.abs(s) * .9) + 2 * K, .16); for (let k = -K; k < 4 * K; k++) put(fImg, cx + k, by - bh - rh * (1 - Math.abs(s) * .9) - 5 * K, SIL[4]); }
  for (let y = -2 * K; y <= 2 * K; y++) for (let x = -2 * K; x <= 2 * K; x++) if (Math.hypot(x, y) <= 1.6 * K) put(fImg, hx + x, by - bh - rh * .4 + y, Math.hypot(x, y) < K * .6 || Math.abs(x) < 1 || Math.abs(y) < 1 ? SIL[2] : PUMPK[6]);  // the rose window in the gable
  for (let wy = by - bh + 3 * K; wy < by - 5 * K; wy += 9 * K) for (let wx = hx - bw + 4 * K; wx < hx + bw - 6 * K; wx += 7 * K) if (Math.abs(wx + 1.5 * K - hx) > 4 * K) gwin(wx, wy, 3 * K, 6 * K, rnd() < .55);
  for (let j = 0; j < 7 * K; j++) { const hw = j < 2 * K ? Math.round(Math.sqrt(j / (2 * K)) * 2.5 * K) : 2.5 * K; for (let k = -hw; k < hw; k++) put(fImg, hx + k, by - 5 * K + j, j < K ? SIL[3] : dith(PUMPK, .22, hx + k, by - 5 * K + j)); }  // the door, a warm glow behind it
  for (const [s, th] of [[-1, 30 * K], [1, 22 * K]]) { const tx = hx + s * (bw + 3 * K) * (litS < 0 ? -1 : 1) | 0; wall(tx - 5 * K, tx + 5 * K, by - bh - th + 12 * K, by + 2 * K, .12); for (let k = -6 * K; k < 6 * K; k++) for (let j = 0; j < K; j++) put(fImg, tx + k, by - bh - th + 12 * K + j, SIL[3]); spire(tx, by - bh - th + 12 * K, 6 * K, 16 * K); gwin(tx - K, by - bh - th + 16 * K, 2 * K, 5 * K, rnd() < .7); gwin(tx - K, by - bh + 4 * K, 2 * K, 5 * K, rnd() < .4); }
  // an iron fence along the crest of the hill
  for (let x = hx - 50 * K; x < hx + 50 * K; x++) { const y = mt[x] + 8 * K + Math.round(Math.abs(x - hx) / (50 * K) * 6 * K); if (Math.abs(x - hx) < 4 * K) continue; put(fImg, x, y - 3 * K, SIL[1]); if ((x - hx) % (3 * K) === 0) { for (let j = 0; j < 5 * K; j++) put(fImg, x, y - j, SIL[1]); put(fImg, x, y - 5 * K - 1, SIL[3]); } }
  for (let i = 0, n = 2 + (rnd() * 2 | 0); i < n; i++) { const x = Math.round(R(.05, .95) * GW); if (Math.abs(x - hx) > 55 * K) deadTree(fImg, x, mt[x] + 2 * K, -Math.PI / 2 + R(-.2, .2), R(9, 14) * K, 2 * K, 5, SIL[2]); }
  mist(fImg, hz + 8 * K, 9 * K, .7, .5);
  // the middle ground: the far end of the graveyard, small leaning stones and a gnarled tree, half lost in the fog
  const midY = Math.round(hz + (GH - hz) * .5), mid = hill(fImg, midY, 6 * K, 50 * K, SIL, .3, .12);
  for (let i = 0, n = 12 + (rnd() * 8 | 0); i < n; i++) { const x = Math.round(R(0, GW)), h = R(4, 7) * K, w = R(3, 4.5) * K, ln = R(-.2, .2); for (let j = 0; j < h; j++) { const hw = j > h - w / 2 ? Math.sqrt(Math.max(0, (w / 2) ** 2 - (j - h + w / 2) ** 2)) : w / 2; for (let k = -hw; k <= hw; k++) put(fImg, x + k + ln * j, mid[x] + K - j, k * litS > hw - K ? STONE[5] : STONE[3]); } }
  { const x = Math.round(hx + (litS < 0 ? 1 : -1) * R(.25, .4) * GW); if (x > 0 && x < GW) deadTree(fImg, x, mid[x] + 2 * K, -Math.PI / 2 + R(-.15, .15), R(14, 18) * K, 3.5 * K, 6, SIL[1]); }
  mist(fImg, midY + 2 * K, 7 * K, .55, .45);
  // the graveyard in front: big weathered stones lit on the moon's side with a carved cross, celtic crosses, moss at their foot, pumpkins glowing at different depths
  const near = hill(nImg, GH - 20 * K, 9 * K, 50 * K, SIL, .1, 0), MOSS = [[22, 30, 34], [34, 44, 40]];
  const stones = Array.from({length: 5 + (rnd() * 4 | 0)}, () => ({x: Math.round(R(.03, .97) * GW), h: Math.round(R(12, 20) * K), cross: rnd() < .3})).sort((a, b) => a.h - b.h);
  for (const {x, h, cross} of stones) {
    const y = near[x] + 3 * K, w = Math.round(h * R(.5, .6)), lean = R(-.12, .12);
    if (cross) {  // a celtic cross: shaft, arms, a ring
      for (let j = 0; j < h; j++) for (let k = -K; k <= K; k++) put(nImg, x + k + lean * j, y - j, k * litS >= K ? STONE[6] : STONE[3]);
      const cy = y - h * .72, ax = x + lean * h * .72;
      for (let k = -w / 2; k <= w / 2; k++) for (let j = -K; j <= K; j++) put(nImg, ax + k, cy + j, j === -K ? STONE[5] : STONE[3]);
      for (let a = 0; a < 6.28; a += .05) put(nImg, ax + Math.cos(a) * w * .32, cy + Math.sin(a) * w * .32, STONE[4]);
      continue;
    }
    for (let j = 0; j < h; j++) { const hw = j > h - w / 2 ? Math.sqrt(Math.max(0, (w / 2) ** 2 - (j - h + w / 2) ** 2)) : w / 2; for (let k = -hw; k <= hw; k++) {
      const X = x + k + lean * j | 0, Y = y - j, edge = k * litS > hw - K, top = j > h - w / 2 && k * litS > 0 && Math.hypot(k, j - h + w / 2) > w / 2 - K;
      put(nImg, X, Y, edge || top ? STONE[6] : j < 2 * K && bay(X, Y) < .6 - j / (4 * K) ? MOSS[bay(X, Y) < .3 ? 1 : 0] : dith(STONE, .36 - j / h * .12 + (fbm(X / (2 * K), Y / (2 * K), 2) - .5) * .25, X, Y)); } }
    const cx = x + lean * h * .65, cy = y - h * .62;  // the carved cross
    for (let j = 0; j < w * .5; j++) put(nImg, cx + lean * j, cy - w * .25 + j, STONE[1]);
    for (let k = -w * .15; k <= w * .15; k++) put(nImg, cx + k, cy - w * .1, STONE[1]);
  }
  for (let x = 0; x < GW; x++) if (rnd() < .25) { const h = R(1, 4) * K; for (let j = 0; j < h; j++) put(nImg, x + j * .3, near[x] + K - j, SIL[1]); }  // tufts of dead grass
  for (let i = 0, n = 4 + (rnd() * 4 | 0); i < n; i++) { const x = Math.round(R(.05, .95) * GW), r = Math.round(R(4, 7) * K); pumpkin(nImg, x, near[x] + R(2, 10) * K - r * .6, r, faces); }
  for (let i = 0; i < 2; i++) { const x = Math.round(i ? R(.82, .98) * GW : R(.02, .18) * GW); deadTree(nImg, x, near[x] + 4 * K, -Math.PI / 2 + R(-.15, .15), R(16, 24) * K, 3.5 * K, 6, SIL[0]); }
  twinkles = makeTwinkles(GW * hz / (3200 * K * K), hz * .4);
  const bats = Array.from({length: 9}, () => ({x: R(0, GW), y: R(.1, .5) * hz, v: R(.3, .7) * (rnd() < .5 ? -1 : 1), p: R(0, 6.28), s: rnd() < .3 ? 2 : 1}));
  const GHOST = ['...####...', '..######..', '.##.##.##.', '.##.##.##.', '##########', '.########.', '.########.', '.########.', '.#.##.##.#', '#..#...#..'];
  const ghost = {x: R(0, GW), y: midY - 14 * K, p: R(0, 6.28)};
  const fogSpr = spriteOf(GW, 20 * K, g => { const s = R(0, 99); g.fillStyle = '#b8a0d8'; for (let y = 0; y < 20 * K; y++) for (let x = 0; x < GW; x++) { const a = (1 - Math.abs(y / (10 * K) - 1)) * fbm(x / (30 * K) + s, y / (6 * K), 3); if (bay(x, y) < a * .8) g.fillRect(x, y, 1, 1); } });
  return {flares: false, shooters: false, draw: t => {
    const fl = .75 + .25 * Math.sin(t / 90) * Math.sin(t / 37);  // the candles inside the pumpkins and the lanterns
    for (const [x, y, w, h, lamp] of wins) if (lamp) { fxc.globalAlpha = .3 * fl; fxc.fillStyle = '#ffd07a'; fxc.fillRect(x, y, w, h); } else if (Math.sin(t / 4000 + x * 3) > .97) { fxc.globalAlpha = .8; fxc.fillStyle = '#0c0426'; fxc.fillRect(x, y, w, h); }  // a shadow passes behind a window
    for (const [x, y] of faces) fill(x, y, fl > .85 ? '#fff0b0' : '#ffb040', fl);
    for (const b of bats) {
      b.x += b.v; b.y += Math.sin(t / 300 + b.p) * .25; if (b.x < -10) b.x = GW + 10; if (b.x > GW + 10) b.x = -10;
      const up = Math.sin(t / 70 + b.p) > 0 ? 1 : 0, k = b.s;
      for (let i = -3 * k; i <= 3 * k; i++) fill(b.x + i, b.y - (up ? Math.abs(i) / k * .6 : -Math.abs(i) / k * .4) + (Math.abs(i) > 2 * k ? up : 0), '#0a0212');
      fill(b.x, b.y - 1, '#0a0212'); fill(b.x, b.y + 1, '#0a0212');
    }
    ghost.x += .18; if (ghost.x > GW + 20 * K) ghost.x = -20 * K;
    const ga = .25 + .2 * Math.sin(t / 1300 + ghost.p), gy = ghost.y + Math.sin(t / 700) * 3 * K;
    glyph(GHOST, ghost.x, gy, K, (x, y) => { fxc.globalAlpha = ga; fxc.fillStyle = '#e8e0ff'; fxc.fillRect(x | 0, y | 0, K, K); });
    fxc.globalAlpha = .16; const o = (t / 60) % GW;
    for (const [y, sp] of [[hz - 4 * K, 1], [GH - 26 * K, 1.6]]) { const oo = (o * sp) % GW; fxc.drawImage(fogSpr, -oo, y); fxc.drawImage(fogSpr, GW - oo, y); }
  }};
}

/* ---------- 2. Noël: a snowy village at night under the mountains, warm windows and smoking chimneys, a decorated fir with blinking lights, a snowman; it snows ---------- */
const PLASTER = ramp('#1e1a36', '#2c2848', '#3e3860', '#544c76', '#6c648e');
const WARMSNOW = ramp('#7a6e9a', '#a48c96', '#d0aa94', '#f0cc9c');
// a fir in snow: ragged tiers with drooping tips, snow lying on each tier, the moon's side lighter
function snowPine(img, x0, base, h, w, lit = -1) {
  const tiers = 3 + (rnd() * 3 | 0), s = R(0, 99);
  for (let r = 0; r < h; r++) {
    const q = r / h, inT = (q * tiers) % 1, Y = base - h + r, hw0 = w * (q * .55 + inT * .45);
    for (let x = -Math.ceil(hw0) - K; x <= hw0 + K; x++) {
      const ax = Math.abs(x), hw = Math.max(.5, hw0 + (fbm((x0 + x) / (1.5 * K) + s, Y / (2 * K), 2) - .5) * 2.4 * K * (.2 + inT));
      if (ax > hw) continue;
      const side = x * lit > 0, snow = inT < .12 + ax / hw * .22 + (fbm((x0 + x) / K + s, Y / K, 2) - .5) * .14;
      put(img, x0 + x, Y, snow ? SNOWP[side ? 6 : ax > hw * .6 ? 4 : 5] : dith(PINEP, .2 + (side ? .32 : 0) - (inT > .85 ? .12 : 0), x0 + x, Y));
    }
  }
  for (let r = 0; r < Math.min(h * .1, 4 * K); r++) for (let k = 0; k < Math.max(1, w / 6); k++) put(img, x0 + k, base + r, WALLP[1]);
}
// a cottage: timbered plaster or stone, a deep snowy roof with icicles, a capped chimney, lit windows with snow on their sills and their light lying on the snow
function cottage(img, x, base, w, h, smokes, lit) {
  x = Math.round(x); base = Math.round(base);
  const rh = Math.round(w * .5), timber = rnd() < .55, over = 2 * K;
  for (let y = base - h; y < base + 2 * K; y++) for (let k = 0; k < w; k++) {
    const X = x + k, edge = lit < 0 ? k < K : k >= w - K, j = y - base + h;
    let c;
    if (timber) c = (k < K || k >= w - K || j === Math.round(h * .45) || k % (5 * K) < 1) ? WALLP[edge ? 3 : 1] : dith(PLASTER, .55 + (edge ? .3 : 0) - j / h * .15, X, y);
    else c = (j % (2 * K) === 0 || (k + (Math.floor(j / (2 * K)) % 2) * 2 * K) % (4 * K) === 0) ? WALLP[0] : dith(WALLP, .5 + (edge ? .3 : 0) + (fbm(X / K, y / K, 2) - .5) * .3, X, y);
    put(img, X, y, c);
  }
  for (let j = 0; j < rh + 3 * K; j++) {  // the roof, snow heaped thick, its edge lumpy, a dark band of eave under it
    const yy = base - h - rh + j - 2 * K, hw = Math.min(w / 2 + over, (w / 2 + over) * (j + 2 * K) / (rh + 2 * K));
    for (let k = -hw; k <= hw; k++) { const lump = fbm((x + k) / (2 * K), 9, 2) * 2 * K; put(img, x + w / 2 + k, yy, j > rh + 2 * K - lump * .5 ? WALLP[0] : SNOWP[k * lit > hw - 2 * K ? 6 : j < 2 * K ? 6 : 5 - (j > rh ? 1 : 0)]); }
  }
  for (let k = -over; k < w + over; k += R(1, 3) * K) { const len = R(.5, 2.5) * K; for (let j = 0; j < len; j++) put(img, x + k, base - h + j, SNOWP[j < len * .5 ? 5 : 4]); }  // icicles
  smokes.push([x + w * .75 + K, base - h - rh * .75 - 2 * K]);
  for (let j = 0; j < rh * .7; j++) for (let k = 0; k < 2.5 * K; k++) put(img, x + w * .7 + k, base - h - rh * .5 - j, j > rh * .7 - 1.5 * K ? SNOWP[6] : (k < K) === (lit < 0) ? WALLP[3] : WALLP[1]);  // the chimney with its cap of snow
  const win = (wx, wy, ww, wh) => {
    for (let j = -1; j < wh + 1; j++) for (let k = -1; k < ww + 1; k++) put(img, wx + k, wy + j, j < 0 || k < 0 || j >= wh || k >= ww ? WALLP[0] : (k === ww >> 1 || j === wh >> 1) ? WALLP[1] : WIN[3][j < K ? 2 : 1]);
    for (let k = -K; k < ww + K; k++) put(img, wx + k, wy + wh + 1, SNOWP[6]);  // snow on the sill
    for (let y = 0; y < 7 * K; y++) for (let k = -ww; k < ww * 2; k++) { const d = Math.hypot((k - ww / 2) / (ww * 1.4), y / (7 * K)), X = wx + k, Y = base + 2 * K + y; if (d < 1 && bay(X, Y) < (1 - d) * .35) put(img, X, Y, WARMSNOW[d < .4 ? 1 : 0]); }  // its light on the snow
  };
  win(x + 2 * K, base - h + 3 * K, 4 * K, 4 * K); if (w > 14 * K) win(x + w - 6 * K, base - h + 3 * K, 4 * K, 4 * K);
  const dx = Math.round(x + w / 2 - 1.5 * K);
  for (let j = 0; j < 6 * K; j++) for (let k = 0; k < 3 * K; k++) put(img, dx + k, base - 4 * K + j, j < K ? WALLP[2] : WALLP[0]);  // the door and its wreath
  for (let a = 0; a < 6.28; a += .25) put(img, dx + 1.5 * K + Math.cos(a) * K, base - 1.5 * K + Math.sin(a) * K, [40, 110, 70]);
  put(img, dx + 1.5 * K, base - .5 * K, [210, 40, 60]);
}
// the church: a stone nave with tall stained windows, a square tower with a lit belfry, a slate spire white with snow and a cross
function church(img, x, base, lit, wins) {
  x = Math.round(x); base = Math.round(base);
  const nw = 26 * K, nh = 13 * K, tw = 8 * K, tx = lit < 0 ? x : x + nw - tw, th = 30 * K;
  const stone = (X, Y, x0, w, y0) => { const j = Y - y0, k = X - x0, edge = lit < 0 ? k < K : k >= w - K; return (j % (2 * K) === 0 || (k + (Math.floor(j / (2 * K)) % 2) * 2 * K) % (4 * K) === 0) ? PLASTER[0] : dith(PLASTER, .5 + (edge ? .35 : 0), X, Y); };
  for (let y = base - nh; y < base + 2 * K; y++) for (let X = x; X < x + nw; X++) put(img, X, y, stone(X, y, x, nw, base - nh));
  for (let j = 0; j < 11 * K; j++) { const hw = (nw / 2 + 2 * K) * (j + K) / (11 * K); for (let k = -hw; k <= hw; k++) put(img, x + nw / 2 + k, base - nh - 11 * K + j, j > 10 * K ? WALLP[0] : SNOWP[k * lit > hw - 2 * K || j < 2 * K ? 6 : 5]); }
  const GLASS = [[220, 60, 80], [60, 140, 220], [250, 200, 80], [90, 200, 120]];
  for (let wx = x + 4 * K; wx < x + nw - 4 * K; wx += 6 * K) { if (wx + 3 * K > tx && wx < tx + tw) continue; for (let j = 0; j < 8 * K; j++) { const hw = j < 1.5 * K ? Math.round(Math.sqrt(j / (1.5 * K)) * 1.5 * K) : 1.5 * K; for (let k = -hw; k < hw; k++) put(img, wx + 1.5 * K + k, base - nh + 2 * K + j, GLASS[(Math.floor(j / K) + Math.floor(k / K) + 8) % 4]); } }
  for (let y = base - th; y < base + 2 * K; y++) for (let X = tx; X < tx + tw; X++) put(img, X, y, stone(X, y, tx, tw, base - th));
  for (let j = 0; j < 5 * K; j++) for (let k = 0; k < 4 * K; k++) put(img, tx + 2 * K + k, base - th + 3 * K + j, j < 2 * K ? (Math.hypot(k - 2 * K, j - 2 * K) < 2 * K ? WIN[3][2] : PLASTER[2]) : k % (2 * K) === 0 ? WALLP[0] : WIN[3][1]);  // the belfry
  wins.push([tx + 2 * K, base - th + 3 * K]);
  for (let k = -K; k < tw + K; k++) put(img, tx + k, base - th, SNOWP[6]);
  for (let j = 0; j < 18 * K; j++) { const hw = (tw / 2 + K) * j / (18 * K); for (let k = -hw; k <= hw; k++) put(img, tx + tw / 2 + k, base - th - 18 * K + j, k * lit > 0 || j % (3 * K) < K ? SNOWP[k * lit > 0 ? 6 : 4] : PLASTER[1]); }
  for (let j = 0; j < 5 * K; j++) put(img, tx + tw / 2, base - th - 18 * K - j, PLASTER[3]); for (let k = -1.5 * K; k <= 1.5 * K; k++) put(img, tx + tw / 2 + k, base - th - 21.5 * K, PLASTER[3]);
  for (let j = 0; j < 7 * K; j++) for (let k = 0; k < 4 * K; k++) { const hw = j < 2 * K ? Math.round(Math.sqrt(j / (2 * K)) * 2 * K) : 2 * K; if (Math.abs(k - 2 * K) < hw) put(img, tx + tw / 2 - 2 * K + k, base - 5 * K + j, j < K ? WIN[3][2] : WIN[3][1]); }  // the open door, warm
}
function noel(fImg, nImg) {
  const hz = Math.round(GH * R(.55, .6)), smokes = [], wins = [];
  grad(fImg, 0, GH, NIGHTP, 0, .95);
  skyStars(fImg, hz * .8, GW * GH / (70 * K * K));
  const mx = R(.1, .9) * GW, my = R(.1, .22) * GH, lit = mx < GW / 2 ? -1 : 1; moon(fImg, mx, my, R(8, 12) * K);
  // snowy mountains: faces toward the moon bright, the others blue, dark rock showing on the steep parts
  const ms = R(0, 99), mt = [], pk = [], np = 4 + (rnd() * 3 | 0), peaks = Array.from({length: np}, (_, i) => ({x: (i + R(.1, .9)) / np * GW, h: R(28, 52) * K, s: R(.6, 1)}));
  for (let x = 0; x < GW; x++) { let best = -1e9; for (const p of peaks) { const v = p.h - Math.abs(x - p.x) * p.s; if (v > best) { best = v; pk[x] = p; } } mt[x] = hz - Math.max(4 * K, best) + (fbm(x / (6 * K) + ms, ms, 3) - .5) * 4 * K; }
  for (let x = 0; x < GW; x++) {
    const p = pk[x], face = (x - p.x) * lit < 0;
    for (let y = Math.round(mt[x]); y < hz + 10 * K; y++) {
      const d = (y - mt[x]) / (40 * K), gully = fbm((x + (y - mt[x]) * (x < p.x ? 1 : -1) * .8) / (3 * K) + ms, y / (14 * K), 3), rock = gully > .6 + d * .15;
      put(fImg, x, y, rock ? NIGHTP[face ? 4 : 3] : dith(SNOWP, (face ? .55 : .3) - d * .22 + (gully - .5) * .2, x, y));
    }
  }
  mist(fImg, hz, 10 * K, .9, .45);
  const far = hill(fImg, hz, 14 * K, 90 * K, SNOWP, .45, .2);
  for (let x = R(0, 4) * K; x < GW; x += R(3, 8) * K) snowPine(fImg, Math.round(x), far[Math.round(x)] + K + R(0, 4) * K, Math.round(R(7, 15) * K), R(2.5, 4) * K, lit);
  const mid = hill(fImg, hz + 18 * K, 10 * K, 80 * K, SNOWP, .62, .4);
  // the village: cottages along the middle slope, the church among them, lamps and a fence along the lane
  const ci = 1 + (rnd() * 3 | 0);
  for (let i = 0, x = R(.04, .14) * GW; x < GW * .92; i++) {
    if (i === ci) { church(fImg, x, mid[Math.min(GW - 1, Math.round(x + 13 * K))] + 2 * K, lit, wins); x += 26 * K + R(6, 14) * K; continue; }
    const w = Math.round(R(13, 20) * K), h = Math.round(R(9, 13) * K), bx = Math.round(x + w / 2);
    cottage(fImg, x, mid[Math.min(GW - 1, bx)] + 2 * K + R(0, 3) * K, w, h, smokes, lit);
    x += w + R(5, 18) * K;
    if (rnd() < .5) snowPine(fImg, Math.round(x - 3 * K), mid[Math.min(GW - 1, Math.round(x))] + 3 * K, Math.round(R(14, 22) * K), R(4, 6) * K, lit);
    else if (rnd() < .6) { const lx = Math.round(x - 3 * K), ly = mid[Math.min(GW - 1, lx)] + 8 * K; for (let j = 0; j < 10 * K; j++) put(fImg, lx, ly - j, WALLP[0]); for (let j = 0; j < 2 * K; j++) for (let k = -K; k < K; k++) put(fImg, lx + k, ly - 11 * K + j, WIN[3][2]); for (let k = -K; k < K; k++) put(fImg, lx + k, ly - 11 * K - 1, SNOWP[6]); wins.push([lx, ly - 10 * K]); for (let y = 0; y < 5 * K; y++) for (let k = -8 * K; k < 8 * K; k++) { const d = Math.hypot(k / (8 * K), y / (5 * K)); if (d < 1 && bay(lx + k, ly + y) < (1 - d) * .5) put(fImg, lx + k, ly + y, WARMSNOW[d < .4 ? 2 : 1]); } }
  }
  for (let x = 0; x < GW; x++) { const y = mid[x] + 14 * K; if (x % (6 * K) < K) for (let j = 0; j < 4 * K; j++) put(fImg, x, y - j, j > 3 * K ? SNOWP[6] : WALLP[1]); { put(fImg, x, y - 2.5 * K, WALLP[1]); put(fImg, x, y - 2.5 * K - 1, SNOWP[5]); } }  // the fence along the lane
  { const px = R(.3, .7) * GW, py = hz + 18 * K + (GH - 22 * K - hz - 18 * K) * .62, rx = R(55, 85) * K, ry = R(8, 11) * K;  // a frozen pond: pale ice, scratches of skates, the moon in it
    for (let y = -ry - K; y <= ry; y++) for (let x = -rx - 2 * K; x <= rx + 2 * K; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2, X = px + x | 0, Y = py + y | 0; if (d > 1.15) continue;
      put(fImg, X, Y, d > 1 ? SNOWP[6] : Math.abs(X - mx) < (1.5 + (y + ry) * .15) * K && fbm(X / (4 * K), Y / (.6 * K), 2) > .45 ? SNOWP[6] : fbm(X / (20 * K), Y / K, 2) > .66 ? SNOWP[5] : dith(NIGHTP, .7 + (y / ry) * .15, X, Y)); }
    for (let i = 0; i < 6; i++) { const a = R(0, 6.28), r0 = R(.2, .7); for (let t = 0; t < 1.2; t += .01) put(fImg, px + Math.cos(a + t) * rx * r0, py + Math.sin(a + t) * ry * r0, SNOWP[4]); } }
  // in front: deep snow in drifts, a trail of footprints, the big decorated fir with garlands, baubles and presents, a snowman
  const near = hill(nImg, GH - 22 * K, 10 * K, 60 * K, SNOWP, .95, .7), ds = R(0, 99);
  for (let x = 0; x < GW; x++) for (let y = near[x]; y < GH; y++) { const n = fbm(x / (40 * K) + ds, y / (5 * K), 3); if (n > .55 && n < .62) put(nImg, x, y, dith(SNOWP, .62, x, y)); else if (bay(x, y) < .02 && rnd() < .3) put(nImg, x, y, [255, 255, 255]); }  // blue shadows under the crests of the drifts, glints
  const tx = Math.round(rnd() < .5 ? R(.08, .22) * GW : R(.78, .92) * GW), th = Math.round(R(64, 80) * K), tw = R(20, 26) * K, tb = near[tx] + 4 * K, lights = [];
  snowPine(nImg, tx, tb, th, tw, lit);
  for (let g = 0; g < 4; g++) { const q0 = .3 + g * .17; for (let k = -1; k <= 1; k += .01) { const q = q0 + k * .06 + (1 - k * k) * .05, hw = tw * q * .7; put(nImg, tx + k * hw, tb - th + q * th, dith([[120, 80, 20], [220, 170, 60], [255, 230, 140]], .5 + k * lit * -.4, tx + k * hw | 0, tb - th + q * th | 0)); } }  // garlands
  const BAUB = [[[120, 20, 40], [220, 50, 70]], [[20, 60, 130], [70, 150, 240]], [[130, 100, 20], [250, 210, 80]], [[90, 30, 110], [200, 100, 220]]];
  for (let i = 0; i < 16; i++) { const q = R(.25, .9), hw = tw * q * .7, bx = tx + R(-hw, hw), by = tb - th + q * th, c = BAUB[i % 4]; for (let y = -K; y <= K; y++) for (let x = -K; x <= K; x++) if (x * x + y * y <= K * K + 1) put(nImg, bx + x, by + y, (x + y) * lit > 0 ? c[0] : c[1]); put(nImg, bx - lit * K * .5, by - K * .5, [255, 255, 255]); }
  for (let i = 0; i < 70; i++) { const q = R(.1, .96), hw = tw * q * .85; lights.push([tx + R(-hw, hw) | 0, tb - th + q * th | 0, i % 5, R(0, 6.28)]); }
  for (let i = 0, gx = tx - tw * .8; i < 4; i++) {  // presents under the tree
    const w = Math.round(R(5, 8) * K), h = Math.round(R(4, 7) * K), c = BAUB[(i + 1) % 4], gy = tb + 2 * K;
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) put(nImg, gx + k, gy - j, Math.abs(k - w / 2) < K * .5 || Math.abs(j - h / 2) < K * .5 ? [250, 230, 160] : (k < K) === (lit < 0) ? c[1] : c[0]);
    for (let k = -K; k <= K; k++) put(nImg, gx + w / 2 + k, gy - h - Math.abs(k) * .5, [250, 230, 160]);
    for (let k = 0; k < w; k++) put(nImg, gx + k, gy - h, SNOWP[6]);
    gx += w + R(1, 4) * K; if (i === 1) gx = tx + tw * .2;
  }
  const sm = Math.round((tx + GW / 2) % GW * .5 + GW * .25), sb = near[sm] + 2 * K;  // the snowman: three balls, stick arms, a hat, coal buttons, a scarf with its tail
  for (const [dy, r] of [[0, 7 * K], [-11 * K, 5 * K], [-19 * K, 3.6 * K]]) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) put(nImg, sm + x, sb + dy - r * .6 + y, dith(SNOWP, .95 + (x + y) * lit / r * .18 - (x * x + y * y > (r - K) ** 2 ? .15 : 0), sm + x, sb + dy + y | 0));
  for (const s of [-1, 1]) { stroke(nImg, sm + s * 4 * K, sb - 14 * K, sm + s * 10 * K, sb - 19 * K, K, WALLP[2]); stroke(nImg, sm + s * 8 * K, sb - 17.5 * K, sm + s * 9 * K, sb - 21 * K, K, WALLP[2]); }
  const hy = sb - 19 * K - 2.2 * K;
  for (let j = 0; j < 5 * K; j++) for (let k = -2.5 * K; k < 2.5 * K; k++) put(nImg, sm + k, hy - 3 * K - j, j < K ? [170, 30, 50] : WALLP[0]);
  for (let k = -4 * K; k < 4 * K; k++) put(nImg, sm + k, hy - 3 * K, WALLP[0]);
  put(nImg, sm - K, hy - K, WALLP[0]); put(nImg, sm + K, hy - K, WALLP[0]);
  for (let k = 0; k < 3 * K; k++) put(nImg, sm + k * lit, hy + K * .5, PUMPK[4]);  // the carrot
  for (let k = -5 * K; k < 5 * K; k++) for (let j = 0; j < 1.5 * K; j++) put(nImg, sm + k, sb - 15 * K + j, j < K * .5 ? [230, 70, 90] : [170, 30, 50]);  // the scarf
  for (let j = 0; j < 6 * K; j++) for (let k = 0; k < 1.5 * K; k++) put(nImg, sm + lit * 3 * K + k, sb - 14 * K + j, j % (2 * K) < K ? [230, 70, 90] : [170, 30, 50]);
  for (let i = 0; i < 3; i++) for (let y = 0; y < K; y++) for (let x = 0; x < K; x++) put(nImg, sm + x, sb - 9 * K + i * 3 * K + y, WALLP[0]);
  for (let i = 0; i < 14; i++) { const fx = sm + lit * (8 + i * 6) * K * .9, fy = sb - 2 * K + i * 1.2 * K + (i % 2) * K; for (let y = 0; y < K; y++) for (let x = 0; x < 2 * K; x++) put(nImg, fx + x, fy + y, SNOWP[3]); }  // footprints
  twinkles = makeTwinkles(GW * hz / (1600 * K * K), hz * .7);
  const flakes = Array.from({length: Math.round(GW * GH / (220 * K * K))}, () => ({x: R(0, GW), y: R(0, GH), v: R(.25, 1.1), p: R(0, 6.28)})), puffs = [];
  const COLS = ['#ff4f6d', '#ffd040', '#46e0ff', '#7cff7a', '#ff8ae2'];
  const SLEIGH = ['r.r.....r.r.....r.r..........', '.rr......rr......rr.....s....', '.rrrrr...rrrrr...rrrrr..ssss.', '.r..r....r..r....r..r..sssss', '...............ccccccccccccc'];
  let sleigh = null;
  return {flares: false, shooters: true, draw: t => {
    for (const [x, y] of smokes) if (rnd() < .1) puffs.push({x, y, a: .3, r: 1, v: R(.15, .3)});
    for (const p of puffs) { p.y -= p.v; p.x += .08 + Math.sin(p.y / 18) * .1; p.a -= .0018; p.r += .03; fxc.globalAlpha = Math.max(0, p.a); fxc.fillStyle = '#8a94c8'; fxc.fillRect(p.x - p.r / 2, p.y, p.r, p.r); }
    while (puffs.length && puffs[0].a <= 0) puffs.shift();
    for (const [x, y] of wins) fill(x, y, '#ffe8a0', .3 + .2 * Math.sin(t / 700 + x));
    for (const [x, y, c, p] of lights) { const b = .45 + .55 * Math.max(0, Math.sin(t / 500 + p)); fill(x, y, COLS[(c + Math.floor(t / 2000)) % 5], b); }
    glowStar(tx, tb - th - 2 * K, ['#8a6020', '#ffd040'], .7 + .3 * Math.sin(t / 400), 3 + Math.round(Math.sin(t / 400) + 1));
    if (!sleigh && rnd() < .0005) sleigh = {x: GW + 20 * K, y: R(.08, .3) * GH};
    if (sleigh) { sleigh.x -= .7; sleigh.y -= .05; glyph(SLEIGH, sleigh.x, sleigh.y, 1, (x, y) => fill(x, y, '#060a1e')); if (sleigh.x < -40) sleigh = null; }
    for (const f of flakes) {
      f.y += f.v * .6; f.x += Math.sin(t / 900 + f.p) * .25 * f.v; if (f.y > GH) { f.y = -2; f.x = R(0, GW); }
      fxc.globalAlpha = .55 + f.v * .35; fxc.fillStyle = '#f0f4ff'; const s = f.v > .9 ? 2 : 1; fxc.fillRect(f.x | 0, f.y | 0, s, s);
    }
  }};
}

/* ---------- 3. Nouvel An: fireworks over the city, mirrored in the river; a bridge, a clock at midnight, a big wheel, a crowd on the quay ---------- */
function newyear(fImg, nImg) {
  const hz = Math.round(GH * R(.58, .63)), blink = [], lamps = [];
  skyGrad(fImg, hz, 0, .95);
  skyStars(fImg, hz * .5, GW * GH / (200 * K * K));
  // the smoke of the fireworks hanging over the city, lit from below in their colours
  const ss = R(0, 99), HUES = [[180, 60, 160], [60, 120, 200], [200, 120, 60]];
  for (let y = Math.round(hz * .15); y < hz; y++) for (let x = 0; x < GW; x++) {
    const n = fbm(x / (40 * K) + ss, y / (10 * K) + ss, 4) * (1 - Math.abs(y / hz - .45) * 1.6);
    if (n > .34 && bay(x, y) < (n - .34) * 1.1) { const q = fbm(x / (160 * K) + ss, 5, 2) * 2.2 % 2, i = Math.floor(q), f = q - i, a = HUES[i], b = HUES[i + 1]; put(fImg, x, y, a.map((c, j) => Math.round((c + (b[j] - c) * f) * .3 + [20, 10, 40][j]))); }
  }
  // the far city: hazy blocks
  for (let x = R(-6, 0) * K; x < GW;) { const w = Math.round(R(6, 14) * K), h = Math.round(R(8, 26) * K); for (let y = hz - h; y < hz; y++) for (let k = 0; k < w; k++) put(fImg, x + k, y, dith(SIL, .5, x + k | 0, y)); for (let y = hz - h + 2 * K; y < hz - K; y += 2 * K) for (let k = K; k < w - K; k += 2 * K) if (rnd() < .2) put(fImg, x + k, y, WIN[1][1]); x += w + R(0, 2) * K; }
  // the near skyline: towers with setbacks, crowns and spires, window grids by floor, their edge toward the fireworks lit
  const tower = (x0, w, h, kind) => {
    const v = R(.12, .26), wc = WIN[rnd() * 4 | 0], fill_ = rnd() < .5 ? .45 : .25;
    const steps = kind === 1 ? [[0, w, h * .6], [K * 2, w - 4 * K, h * .85], [K * 4, w - 8 * K, h]] : [[0, w, h]];
    for (const [ox, sw, sh] of steps) for (let y = hz - sh; y < hz; y++) for (let k = 0; k < sw; k++) { const X = x0 + ox + k; put(fImg, X, y, k < K ? SIL[5] : k >= sw - K ? SIL[1] : dith(SIL, v, X, y)); }
    for (const [ox, sw, sh] of steps) for (let y = hz - sh + 2 * K; y < hz - K; y += 3 * K) for (let k = 2 * K; k < sw - 2 * K; k += 2 * K) if (rnd() < fill_) { put(fImg, x0 + ox + k, y, wc[1 + (rnd() < .3 ? 1 : 0)]); put(fImg, x0 + ox + k, y + 1, wc[1]); }
    const top = hz - h, cx = x0 + w / 2;
    if (kind === 2) { for (let j = 0; j < w / 2; j++) { const hw = Math.sqrt(Math.max(0, (w / 2) ** 2 - j * j)); for (let k = -hw; k <= hw; k++) put(fImg, cx + k, top - j, (k < -hw + K) ? SIL[5] : j % (2 * K) === 0 ? wc[1] : SIL[2]); } for (let j = 0; j < 8 * K; j++) put(fImg, cx, top - w / 2 - j, SIL[4]); blink.push([cx, top - w / 2 - 8 * K]); }
    else if (kind === 3) { for (let j = 0; j < 22 * K; j++) { const hw = Math.max(0, (w / 2 - 2 * K) * (1 - j / (22 * K))); for (let k = -hw; k <= hw; k++) put(fImg, cx + k, top - j, j % (3 * K) === 0 ? wc[2] : SIL[k < 0 ? 4 : 2]); } blink.push([cx, top - 22 * K]); }
    else if (h > 36 * K) { for (let j = 0; j < 12 * K; j++) put(fImg, cx, top - j, SIL[3]); blink.push([cx, top - 12 * K]); }
    for (let k = 0; k < w; k++) put(fImg, x0 + k, top, wc[1]);  // a lit crown along the roof
  };
  const cx0 = Math.round(R(.3, .7) * GW);
  for (let x = R(-8, 0) * K; x < GW;) {
    const w = Math.round(R(10, 22) * K), x0 = Math.round(x);
    if (Math.abs(x0 + w / 2 - cx0) < 12 * K) { x += 14 * K; continue; }
    const tall = rnd() < .18, kind = tall ? 1 + (rnd() * 3 | 0) : 0;
    tower(x0, w, Math.round(R(12, tall ? 72 : 40) * K), kind);
    x += w + R(0, 3) * K;
  }
  { const cw = 10 * K, ch = 58 * K, x0 = cx0 - cw / 2, top = hz - ch, cy = top + 8 * K;  // the clock tower, showing midnight
    for (let y = top; y < hz; y++) for (let k = 0; k < cw; k++) put(fImg, x0 + k, y, k < K ? SIL[5] : (y - top) % (6 * K) === 0 ? SIL[4] : dith(SIL, .22, x0 + k, y));
    for (let y = -4 * K; y <= 4 * K; y++) for (let x = -4 * K; x <= 4 * K; x++) { const d = Math.hypot(x, y); if (d <= 4 * K) put(fImg, cx0 + x, cy + y, d > 3.4 * K ? [200, 160, 80] : [255, 236, 180]); }
    for (let j = 0; j < 3 * K; j++) { put(fImg, cx0, cy - j, [40, 20, 30]); put(fImg, cx0 + 1, cy - j, [40, 20, 30]); }
    for (let j = 0; j < 16 * K; j++) { const hw = (cw / 2 + K) * (1 - j / (16 * K)); for (let k = -hw; k <= hw; k++) put(fImg, cx0 + k, top - j, k < 0 ? SIL[4] : SIL[2]); }
    blink.push([cx0, top - 16 * K]); }
  // the bridge across the river: a deck on piers, two towers and cables hung with lights
  const bY = hz + Math.round((GH - hz) * .2), bL = R(-.1, .2) * GW, bR = bL + R(.55, .8) * GW, tA = bL + (bR - bL) * .25, tB = bL + (bR - bL) * .75, tH = 40 * K;
  reflectWater(fImg, hz, .5);
  for (let x = Math.max(0, bL | 0); x < Math.min(GW, bR); x++) for (let j = 0; j < 2 * K; j++) put(fImg, x, bY + j, j < K ? SIL[4] : SIL[1]);
  for (const tx of [tA, tB]) { for (let y = bY - tH; y < bY + 10 * K; y++) for (let k = -K; k <= K; k++) put(fImg, tx + k, y, k < 0 ? SIL[4] : SIL[2]); blink.push([tx | 0, bY - tH - K]); }
  const cable = (x0, x1, y0, y1, sag) => { for (let x = Math.max(0, x0 | 0); x < Math.min(GW, x1); x++) { const q = (x - x0) / (x1 - x0), y = y0 + (y1 - y0) * q + Math.sin(q * Math.PI) * sag; put(fImg, x, y, SIL[4]); if (x % (4 * K) === 0) { lamps.push([x, y | 0]); for (let j = y + K; j < bY; j += 2) put(fImg, x, j, SIL[3]); } } };
  cable(bL, tA, bY - 2 * K, bY - tH, -6 * K); cable(tA, tB, bY - tH, bY - tH, 14 * K); cable(tB, bR, bY - tH, bY - 2 * K, -6 * K);
  for (let x = Math.max(0, bL | 0); x < Math.min(GW, bR); x += 3 * K) lamps.push([x, bY - 1]);
  // the big wheel at one end of the quay, its spokes and cabins lit
  const wx = Math.round(rnd() < .5 ? R(.06, .16) * GW : R(.84, .94) * GW), wr = 22 * K, wy = Math.round(GH - P - 14 * K - wr - 6 * K), cabins = [];
  // the quay: stone, a railing with lamp posts, the crowd watching with arms raised, a child on shoulders, phones glowing
  const qy = GH - P - 12 * K;  // P: the layers overflow the screen by P on each side
  for (let y = qy; y < GH; y++) for (let x = 0; x < GW; x++) put(nImg, x, y, y < qy + K ? SIL[4] : y > qy + 8 * K ? SIL[0] : dith(SIL, .2, x, y));
  for (let a = 0; a < 6.283; a += .004) put(nImg, wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, [140, 90, 200]);
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; stroke(nImg, wx, wy, wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, 1, [90, 60, 140]); cabins.push(a); }
  stroke(nImg, wx, wy, wx - 12 * K, qy, 2 * K, SIL[2]); stroke(nImg, wx, wy, wx + 12 * K, qy, 2 * K, SIL[2]);
  for (let x = 0; x < GW; x++) { put(nImg, x, qy - 6 * K, SIL[3]); put(nImg, x, qy - 3 * K, SIL[2]); if (x % (4 * K) < 1) for (let j = 0; j < 6 * K; j++) put(nImg, x, qy - j, SIL[3]); }
  for (let x = R(10, 30) * K; x < GW; x += R(60, 90) * K) { for (let j = 0; j < 22 * K; j++) put(nImg, x, qy - j, SIL[2]); lamps.push([x | 0, qy - 23 * K, 1]); for (let y = -2 * K; y <= K; y++) for (let k = -K; k <= K; k++) put(nImg, x + k, qy - 23 * K + y, WIN[3][2]); }
  const phones = [], person = (x, cy, hr, sh, arms, kid) => {
    for (let y = -hr; y <= hr; y++) for (let k = -hr; k <= hr; k++) if (k * k + y * y <= hr * hr) put(nImg, x + k, cy - sh - hr + y, SIL[0]);
    for (let y = 0; y < GH - cy + sh; y++) { const hw = Math.min(sh, hr + y * .8); for (let k = -hw; k <= hw; k++) put(nImg, x + k, cy - sh + y, SIL[0]); }
    if (arms) for (const s of arms) { stroke(nImg, x + s * sh * .8, cy - sh + K, x + s * (sh + 2 * K), cy - sh - hr * 3, K * 1.2, SIL[0]); if (rnd() < .4) phones.push([x + s * (sh + 2 * K) | 0, cy - sh - hr * 3 - K | 0]); }
    if (kid) { const kh = hr * .7; for (let y = -kh; y <= kh; y++) for (let k = -kh; k <= kh; k++) if (k * k + y * y <= kh * kh) put(nImg, x + k, cy - sh - hr * 2 - kh * 2.6 + y, SIL[0]); for (let y = 0; y < kh * 2; y++) for (let k = -kh; k <= kh; k++) put(nImg, x + k, cy - sh - hr * 2 - kh * 1.6 + y, SIL[0]); }
  };
  for (let x = R(0, 6) * K; x < GW; x += R(5, 9) * K) {
    const hr = Math.round(R(2, 3) * K), r = rnd();
    person(x, qy + R(4, 8) * K, hr, Math.round(R(4, 6) * K), r < .25 ? [-1, 1] : r < .4 ? [rnd() < .5 ? -1 : 1] : null, r > .95);
  }
  twinkles = makeTwinkles(GW * hz / (4000 * K * K), hz * .4);
  const SETS = [['#ff5ad9', '#ffd0f4'], ['#46e0ff', '#d0f8ff'], ['#ffd040', '#fff4c0'], ['#7cff7a', '#e0ffe0'], ['#ff6040', '#ffd0a0'], ['#b46aee', '#f0d8ff']];
  let rockets = [], sparks = [], finale = 0;
  const launch = (y0 = hz) => rockets.push({x: R(.1, .9) * GW, y: y0, vx: R(-.15, .15), vy: -R(2.6, 3.8) * K / 2, c: SETS[rnd() * SETS.length | 0], ring: rnd() < .3, glitter: rnd() < .3, willow: rnd() < .2});
  const burst = r => {
    const n = 60 + (rnd() * 60 | 0), sp = R(1.5, 2.5) * K / 2;
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R(-.05, .05), s = r.ring ? sp : sp * Math.sqrt(rnd()); sparks.push({x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: r.willow ? R(90, 130) : R(45, 75), c: r.willow ? ['#b8641c', '#ffd07a'] : r.c, g: r.glitter, w: r.willow}); }
  };
  for (let i = 0; i < 3; i++) { launch(); const r = rockets.pop(); r.y = R(.15, .4) * hz; burst(r); }  // the sky is never empty when the decor appears
  const water = (x, y, c, a) => { const ry = 2 * hz - y; if (ry > hz && ry < qy - K) fill(x + Math.sin(ry * .8) * K, ry, c, a * .3); };
  return {flares: false, shooters: false, draw: t => {
    for (const [x, y] of blink) if (Math.sin(t / 600 + x) > .2) fill(x, y, '#ff3040');
    for (const [x, y, big] of lamps) { fill(x, y, '#ffe0a0', .8); if (!big) water(x, y, '#ffd07a', 1.5); }
    for (const a of cabins) { const b = a + t / 9000, x = wx + Math.cos(b) * wr, y = wy + Math.sin(b) * wr; fill(x, y + 1, ['#ff5ad9', '#46e0ff', '#ffd040'][Math.floor(a * 3) % 3], .9); fill(x + 1, y + 1, '#fff4c0', .6); }
    for (const [x, y] of phones) fill(x, y, '#d0f0ff', .6 + .3 * Math.sin(t / 300 + x));
    if (rnd() < .05) launch();
    if (finale <= 0 && rnd() < .0008) finale = 60;  // now and then a salvo
    if (finale > 0 && finale-- % 6 === 0) launch();
    rockets = rockets.filter(r => {
      r.x += r.vx; r.y += r.vy; r.vy += .035;
      for (let j = 0; j < 4; j++) fill(r.x - r.vx * j, r.y - r.vy * j, j ? '#ffb070' : '#fff', 1 - j * .22);
      water(r.x, r.y, '#ffb070', 1);
      if (r.vy > -.3) { burst(r); return false; } return true;
    });
    sparks = sparks.filter(s => {
      s.x += s.vx; s.y += s.vy; s.vx *= s.w ? .95 : .97; s.vy = s.vy * (s.w ? .95 : .97) + (s.w ? .012 : .018); const q = s.life++ / s.max;
      if (s.g && rnd() < .4) return q < 1;  // glitter: flickers
      const c = q < .15 ? '#fff' : q < .5 ? s.c[1] : s.c[0], a = 1 - q * q;
      fill(s.x, s.y, c, a); if (q < .4) { fill(s.x + 1, s.y, c, a * .7); fill(s.x, s.y + 1, c, a * .7); } if (s.w) fill(s.x, s.y - 2, s.c[0], a * .4); water(s.x, s.y, s.c[0], a);
      return q < 1;
    });
  }};
}

/* ---------- 4. Lanternes: hundreds of sky lanterns rise from a mountain lake at dusk, past a pagoda and a torii in the water; reeds and a pier in front ---------- */
const LACQ = ramp('#1a0610', '#3a0c18', '#5e1420', '#82202a', '#a8343a');
// a pagoda: dark lacquered walls with warm lattice windows, wide eaves that turn up at the tips, their undersides lit, a little lantern under each tip, a spire with rings
function pagoda(img, x, base, tiers, w, glows) {
  let y = base;
  for (let i = 0; i < tiers; i++) {
    const wi = w * (1 - i * .15), bw = wi * .3, th = Math.round(6 * K);
    for (let j = 0; j < th; j++) for (let k = -bw; k <= bw; k++) put(img, x + k, y - j, k < -bw + K ? LACQ[3] : dith(LACQ, .35 - j / th * .2, x + k | 0, y - j));
    for (let k = -bw + 2 * K; k <= bw - 3 * K; k += 3.5 * K) for (let j = K; j < 4.5 * K; j++) for (let q = 0; q < 2 * K; q++) put(img, x + k + q, y - j, (q === K || j === Math.round(2.8 * K)) ? LACQ[1] : WIN[3][j < 2 * K ? 1 : 2]);
    for (let k = -bw - K; k <= bw + K; k++) put(img, x + k, y - th + K, LACQ[4]);  // the balcony rail
    y -= th;
    for (let j = 0; j < 3 * K; j++) for (let k = -wi / 2; k <= wi / 2; k++) {
      const up = ((Math.max(0, Math.abs(k) - wi * .3)) / (wi * .2)) ** 2 * 3.5 * K;
      put(img, x + k, y - j - up, j === 0 ? WIN[3][0] : j === 3 * K - 1 ? SIL[4] : j % K === 0 ? SIL[1] : SIL[2]);
    }
    for (const s of [-1, 1]) { const ex = x + s * wi / 2, ey = y - 3.5 * K + K; for (let j = 0; j < 2 * K; j++) for (let k = 0; k < K; k++) put(img, ex + k - K / 2, ey + j, [220, 70, 50]); glows.push([ex | 0, ey + K | 0]); }
    y -= 3 * K;
  }
  for (let j = 0; j < 14 * K; j++) put(img, x, y - j, SIL[3]);
  for (let r = 0; r < 5; r++) for (let k = -1.5 * K; k <= 1.5 * K; k++) put(img, x + k, y - 3 * K - r * 2 * K, SIL[4]);
}
function skylanterns(fImg, nImg) {
  const hz = Math.round(GH * R(.55, .6)), wl = hz + 4 * K, glows = [], floats = [];
  grad(fImg, 0, hz, LDUSK, 0, 1);
  skyStars(fImg, hz * .4, GW * GH / (220 * K * K));
  // long thin clouds lit pink from below by the set sun
  const cs = R(0, 99);
  for (let y = Math.round(hz * .3); y < hz * .6; y++) for (let x = 0; x < GW; x++) { const n = fbm(x / (70 * K) + cs, y / (5 * K) + cs, 4); if (n > .66) put(fImg, x, y, fbm(x / (70 * K) + cs, (y + K) / (5 * K) + cs, 4) < .66 ? LDUSK[Math.min(9, 6 + Math.round(y / hz * 3))] : dith(LDUSK, .35 + y / hz * .3, x, y)); }
  // three ranges of mountains, each paler with distance, their crests rimmed by the afterglow
  const range = (base, amp, sc, v, rim) => { const s = R(0, 99); for (let x = 0; x < GW; x++) { const top = Math.round(base - amp * (1 - Math.abs(fbm(x / sc + s, s, 4) * 2 - 1)) ** 1.4); for (let y = top; y < wl; y++) put(fImg, x, y, y - top < K * .8 ? rim : dith(LDUSK, v - (y - top) / (60 * K) * .2, x, y)); } };
  range(hz - 6 * K, R(38, 52) * K, 70 * K, .4, LDUSK[6]);
  mist(fImg, hz - 4 * K, 10 * K, 1.1, .45);
  range(hz, R(22, 34) * K, 45 * K, .24, LDUSK[5]);
  mist(fImg, hz + 2 * K, 6 * K, 1, .4);
  const shore = hill(fImg, hz + 2 * K, 10 * K, 40 * K, SIL, .3, .2);
  const px = Math.round(rnd() < .5 ? R(.12, .3) * GW : R(.7, .88) * GW);
  for (let x = 0; x < GW; x += R(3, 7) * K) { if (Math.abs(x - px) < 18 * K) continue; if (rnd() < .4) blob(fImg, x, shore[Math.round(x)] - R(2, 5) * K, R(4, 7) * K, R(3, 5) * K, SIL, .12, .28, R(0, 99), .4); else pine(fImg, x, shore[Math.round(x)] + 2 * K, R(8, 16) * K, R(2, 3.5) * K, .16, 0); }
  pagoda(fImg, px, shore[px] + K, 4 + (rnd() * 2 | 0), R(30, 38) * K, glows);
  reflectWater(fImg, wl, .55);
  for (let y = wl + 2 * K; y < GH; y += R(4, 9) * K) for (let x = 0; x < GW; x++) if (fbm(x / (25 * K), y, 2) > .7) put(fImg, x, y, LDUSK[4 + Math.round((y - wl) / (GH - wl) * 2)]);  // breeze lines on the lake
  // a torii standing in the shallows, away from the pagoda
  { const tx = Math.round(px < GW / 2 ? R(.6, .8) * GW : R(.2, .4) * GW), ty = wl + R(8, 14) * K, tw = 24 * K, th = 22 * K, TR = [[70, 16, 26], [120, 30, 36], [170, 60, 56]];
    for (const s of [-1, 1]) for (let j = 0; j < th; j++) for (let k = -K; k <= K; k++) put(fImg, tx + s * tw * .36 + k, ty - j, k === -K ? TR[2] : TR[1]);
    for (let k = -tw * .45; k <= tw * .45; k++) for (let j = 0; j < 1.5 * K; j++) put(fImg, tx + k, ty - th * .72 + j, TR[1]);
    for (let k = -tw * .62; k <= tw * .62; k++) { const up = Math.max(0, Math.abs(k) - tw * .4) * .35; for (let j = 0; j < 2.5 * K; j++) put(fImg, tx + k, ty - th - j - up, j < K ? TR[2] : j > 2 * K ? SIL[1] : TR[1]); }
    for (let j = 0; j < th * .7; j += 1) for (const s of [-1, 1]) if (bay(tx + s * tw * .36 | 0, ty + j) < .5 * (1 - j / (th * .7))) put(fImg, tx + s * tw * .36 + Math.sin(j * .7) * K, ty + j, TR[0]); }  // its legs in the water
  // floating lanterns on the water near the shore
  for (let i = 0; i < 9; i++) floats.push({x: R(0, GW), y: R(wl + 6 * K, GH - P - 12 * K), p: R(0, 6.28)});
  // reeds and cattails, a wooden pier with a lantern on its last post
  for (let x = 0; x < GW; x++) if (fbm(x / (30 * K), 3, 2) > .52 && rnd() < .2) {
    const h = R(8, 26) * K, b = R(-.25, .25), cat = rnd() < .2;
    for (let j = 0; j < h + P; j++) put(nImg, x + b * j / K, GH - P + 4 * K - j, SIL[0]);
    if (cat) for (let j = 0; j < 4 * K; j++) for (let k = -K * .6; k <= K * .6; k++) put(nImg, x + b * (h + P - j) / K + k, GH - P + 4 * K - h - P + j - 2 * K, [34, 16, 22]);
    else if (rnd() < .4) { const s = rnd() < .5 ? -1 : 1, L = R(8, 16) * K; for (let i = 0; i < L; i++) put(nImg, x + s * i * .6, GH - P - h * .4 - i * .9 + (i / L) ** 2 * L * .9, SIL[0]); }  // a long blade bending over
  }
  const pk = Math.round(R(.3, .6) * GW), py = GH - P - 8 * K, pl = 56 * K;
  for (let k = 0; k < pl; k++) for (let j = 0; j < 2 * K; j++) put(nImg, pk + k, py + j, k % (4 * K) < 1 ? SIL[0] : j === 0 ? SIL[3] : SIL[1]);
  for (let k = 0; k < pl; k += 11 * K) for (let j = -3 * K; j < 14 * K; j++) for (let q = 0; q < 1.5 * K; q++) put(nImg, pk + k + q, py + j, j < -2 * K ? SIL[2] : SIL[0]);
  const lpx = pk + pl - 1.5 * K; for (let j = 0; j < 10 * K; j++) put(nImg, lpx, py - j, SIL[0]); for (let k = 0; k < 4 * K; k++) put(nImg, lpx - k, py - 10 * K, SIL[0]);
  for (let j = 0; j < 3 * K; j++) for (let k = -K; k < K; k++) put(nImg, lpx - 4 * K + k, py - 9 * K + j, WIN[3][j < K ? 2 : 1]); glows.push([lpx - 4 * K, py - 8 * K]);
  twinkles = makeTwinkles(GW * hz / (3000 * K * K), hz * .35);
  // the sky lanterns: paper wider at the top, glowing brighter toward the flame at the bottom, a soft round halo
  const SPR = [1, 2, 3, 5].map(s => { const w = (s + 1) * K / 2 + 1, h = Math.round(w * 1.35), R0 = Math.round(w * 2.2);
    return {w, h, R0, lamp: spriteOf(w, h, g => { for (let y = 0; y < h; y++) { const q = y / h, hw = w / 2 * (1 - q * .22); for (let x = 0; x < w; x++) if (Math.abs(x + .5 - w / 2) <= hw) dot(g, x, y, y >= h - Math.max(1, h * .2) ? '#fff0c0' : q > .55 ? '#ffc060' : q > .25 ? '#f08a30' : '#c0501c'); } if (w > 4) for (let y = 1; y < h - 1; y++) dot(g, Math.round(w / 2) - 1, y, 'rgba(120,40,10,.35)'); }),
      glow: spriteOf(R0 * 2, R0 * 2, g => { for (let y = 0; y < R0 * 2; y++) for (let x = 0; x < R0 * 2; x++) { const d = Math.hypot(x - R0, y - R0) / R0; if (d < 1 && bay(x, y) < (1 - d) * .5) dot(g, x, y, '#ff9a30'); } })}; });
  const lamp = () => ({x: R(0, GW), y: R(hz - 6 * K, hz + 4 * K), v: R(.06, .2), p: R(0, 6.28), s: rnd() < .55 ? 0 : rnd() < .6 ? 1 : rnd() < .85 ? 2 : 3});
  const lamps = Array.from({length: 90}, () => { const l = lamp(); l.y = R(0, hz); return l; });
  return {flares: false, shooters: false, draw: t => {
    for (const [x, y] of glows) { const b = .55 + .2 * Math.sin(t / 170 + x); fxc.globalAlpha = b * .5; fxc.fillStyle = '#ffb040'; fxc.fillRect(x - K, y - K, 2 * K, 2 * K); fill(x, y, '#ffe8a0', b); }
    for (const f of floats) { const x = f.x + Math.sin(t / 3000 + f.p) * 2 * K, b = .7 + .3 * Math.sin(t / 200 + f.p);
      fxc.globalAlpha = .25 * b; fxc.fillStyle = '#ff9a30'; fxc.fillRect(x - 2 * K | 0, f.y - K | 0, 5 * K, 2 * K);
      fxc.globalAlpha = b; fxc.fillStyle = '#ffd07a'; fxc.fillRect(x | 0, f.y - K | 0, K, K); fxc.fillStyle = '#e06a3a'; fxc.fillRect(x - K | 0, f.y | 0, 3 * K, K * .5 + 1);
      for (let j = 1; j < 5; j++) { fxc.globalAlpha = .3 * b * (1 - j / 5); fxc.fillStyle = '#ffb040'; fxc.fillRect(x + Math.sin(j + t / 400) * K | 0, f.y + j * 1.5 * K | 0, K, 1); } }
    for (const l of lamps) {
      l.y -= l.v; l.x += Math.sin(t / 2500 + l.p) * .06; if (l.y < -12) Object.assign(l, lamp());
      const S = SPR[l.s], b = .8 + .2 * Math.sin(t / 160 + l.p * 5), far = clamp(1 - l.y / hz) * .5 + .5;
      fxc.globalAlpha = .35 * b; fxc.drawImage(S.glow, l.x + S.w / 2 - S.R0 | 0, l.y + S.h * .6 - S.R0 | 0);
      fxc.globalAlpha = b * far; fxc.drawImage(S.lamp, l.x | 0, l.y | 0);
      const ry = 2 * wl - l.y; if (ry < GH - P - 8 * K && ry > hz) { fxc.globalAlpha = .25 * b; fxc.fillStyle = '#ffb040'; fxc.fillRect(l.x + Math.sin(ry) * K | 0, ry | 0, S.w, Math.max(1, S.h / 2)); }
    }
  }};
}

/* ---------- 5. Lucioles: a meadow under the moon by a forest edge, a stream winding through it, an old oak, tall grass and flowers in front; fireflies drift and blink ---------- */
function fireflies(fImg, nImg) {
  const hz = Math.round(GH * R(.58, .64)), mx = R(.1, .9) * GW, my = R(.1, .25) * GH, lit = mx < GW / 2 ? -1 : 1;
  skyGrad(fImg, hz, 0, .8);
  skyStars(fImg, hz * .8, GW * GH / (60 * K * K));
  moon(fImg, mx, my, R(7, 11) * K);
  // the forest edge in two rows: firs and round broadleaves, the far row paler, the moon's side of each crown rimmed
  ridge(fImg, hz, 12 * K, 80 * K, .6, .4, false);
  for (const [v, h0, h1, dy] of [[.42, 10, 20, -3], [.24, 14, 30, 2]]) for (let x = R(0, 4) * K; x < GW; x += R(3, 7) * K) {
    if (rnd() < .35) { const r = R(5, 9) * K, cy = hz + dy * K - R(h0, h1) * K * .6; blob(fImg, x, cy, r, r * .85, SIL, v - .12, v + .1, R(0, 99), .45); for (let j = 0; j < hz + dy * K - cy; j++) put(fImg, x, cy + j, SIL[1]); }
    else pine(fImg, x, hz + dy * K + R(0, 4) * K, R(h0, h1) * K, R(3, 6) * K, v, lit);
  }
  mist(fImg, hz + 2 * K, 6 * K, .55, .5);
  // the meadow: rolling, its grass brushed by the moon in short strokes, thicker toward the front
  const mid = hill(fImg, hz + 8 * K, 6 * K, 90 * K, LEAF, .3, .1);
  for (let i = 0; i < GW * (GH - hz) / (5 * K * K); i++) { const x = R(0, GW) | 0, y = R(mid[x] || hz, GH) | 0, q = (y - hz) / (GH - hz), L = 1 + q * 3 * K, s = R(-.4, .4); for (let j = 0; j < L; j++) put(fImg, x + s * j, y - j, LEAF[(rnd() < .25 ? 4 : 3) + (j > L * .6 && rnd() < .3 ? 1 : 0)]); }
  // the stream: from the forest edge to the front, widening, the sky and the moon in it, dark banks with reeds
  const sx = R(.3, .7) * GW, ph = R(0, 6.28), sw = R(.12, .22) * GW;
  for (let y = (mid[sx | 0] || hz) + 2 * K; y < GH; y++) {
    const q = (y - hz) / (GH - hz), c = sx + Math.sin(q * 3.2 + ph) * sw * q, hw = (1 + q * 14) * K;
    for (let x = Math.round(c - hw - K); x <= c + hw + K; x++) {
      const e = Math.abs(x - c) / hw;
      if (e > 1) { put(fImg, x, y, LEAF[0]); continue; }
      const glint = Math.abs(x - mx) < (1 + q * 4) * K && fbm(x / (3 * K), y / (.8 * K), 2) > .45;
      put(fImg, x, y, glint ? MOON[q < .5 ? 3 : 2] : fbm(x / (12 * K), y / K, 2) > .68 ? SKY[4] : dith(SKY, .4 - q * .2 + (1 - e) * .1, x, y));
    }
    if (rnd() < .12 * q) for (const s of [-1, 1]) if (rnd() < .5) { const bx = c + s * (hw + K), h = R(2, 5) * K * (q + .3); for (let j = 0; j < h; j++) put(fImg, bx + s * j * .2, y - j, LEAF[1]); }
  }
  // the old oak: a gnarled trunk on spreading roots, crooked limbs, a crown of leaf clusters lit on top by the moon, gaps of sky between them
  const ox = Math.round(Math.abs(sx - GW * .2) > Math.abs(sx - GW * .8) ? R(.08, .3) * GW : R(.7, .92) * GW), ob = (mid[ox] || hz) + 4 * K, oh = R(50, 62) * K, tt = ob - oh * .42;
  const BARK = [SIL[0], SIL[1], SIL[2], SIL[4]];
  for (let y = tt; y < ob + 2 * K; y++) { const q = (y - tt) / (ob - tt), hw = 2.6 * K + q * q * 6 * K; for (let k = -hw; k <= hw; k++) { const X = ox + k + Math.sin(y / (6 * K)) * K, side = k * lit / hw; put(fImg, X, y, side > .75 ? BARK[3] : fbm(X / K, y / (4 * K), 2) > .6 ? BARK[0] : BARK[side > 0 ? 2 : 1]); } }
  const ends = [];
  const limb = (x, y, a, len, w, d) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; stroke(fImg, x, y, x2, y2, w, BARK[1]); if (d <= 0) { ends.push([x2, y2]); return; } limb(x2, y2, a + R(-.5, -.15), len * R(.6, .8), w * .65, d - 1); limb(x2, y2, a + R(.15, .5), len * R(.6, .8), w * .65, d - 1); };
  for (const a of [-2.6, -2.1, -1.6, -1.1, -.55]) limb(ox, tt + K, a + R(-.15, .15), R(10, 16) * K, 3 * K, 2);
  for (const [x, y] of ends) blob(fImg, x + R(-3, 3) * K, y - R(0, 3) * K, R(7, 11) * K, R(5, 8) * K, LEAF, .08, .62, R(0, 99), .5);
  for (let i = 0; i < 5; i++) blob(fImg, ox + R(-20, 20) * K, tt - R(18, 30) * K, R(9, 14) * K, R(6, 9) * K, LEAF, .1, .66, R(0, 99), .5);
  for (const s of [-1, 1]) stroke(fImg, ox + s * 6 * K, ob, ox + s * 13 * K, ob + 2 * K, 2 * K, BARK[1]);  // the roots
  // bushes and clumps of pale flowers scattered over the meadow
  for (let i = 0; i < 8; i++) { const x = R(0, GW) | 0, y = (mid[x] || hz) + R(4, 30) * K; if (Math.abs(x - ox) > 25 * K) blob(fImg, x, y, R(4, 8) * K, R(3, 5) * K, LEAF, .1, .45, R(0, 99), .4); }
  const FLOW = [[226, 222, 255], [190, 200, 255], [240, 200, 236], [255, 240, 170]];
  for (let i = 0; i < 26; i++) { const cx = R(0, GW), cy = R(hz + 14 * K, GH - 10 * K), c = FLOW[rnd() * 4 | 0], n = 6 + (rnd() * 12 | 0), q = (cy - hz) / (GH - hz); for (let j = 0; j < n; j++) put(fImg, cx + R(-8, 8) * K * (q + .3), cy + R(-2, 2) * K * (q + .3), c); }
  // in front: tall grass, its tips silver in the moonlight, daisies, foxgloves, a fern at each corner
  for (let x = 0; x < GW; x += R(.5, 1.5)) {
    const h = R(6, 26) * K * (.4 + fbm(x / (40 * K), 1, 2)), bend = R(-.5, .5) * K, c = LEAF[rnd() * 3 | 0];
    for (let j = 0; j < h + P; j++) put(nImg, x + bend * (j / (h + P)) ** 2 * 4, GH - j, j > h + P - 2 * K && rnd() < .5 ? LEAF[4] : c);
  }
  for (let i = 0; i < 14; i++) { const x = R(0, GW), h = R(8, 22) * K + P, b = R(-1, 1) * K; for (let j = 0; j < h; j++) put(nImg, x + b * (j / h) ** 2, GH - j, LEAF[2]); const fx = x + b, fy = GH - h; for (let dy = -2 * K; dy <= 2 * K; dy++) for (let dx = -2 * K; dx <= 2 * K; dx++) { const d = Math.hypot(dx, dy); if (d <= 2 * K) put(nImg, fx + dx, fy + dy * .7, d < K * .8 ? [250, 200, 70] : (Math.atan2(dy, dx) * 8 / 6.283 + 8) % 1 < .15 ? [180, 180, 210] : [236, 236, 250]); } }
  for (const s of [-1, 1]) { const fx = s < 0 ? R(0, 20) * K : GW - R(0, 20) * K; for (let f = 0; f < 6; f++) { const a = -Math.PI / 2 + (f - 2.5) * .35, L = R(18, 30) * K; for (let i = 0; i < L; i++) { const t = i / L, x = fx + Math.cos(a) * i + s * t * t * 6 * K, y = GH - P + 4 * K + Math.sin(a) * i + t * t * 10 * K, lw = (1 - t) * 3 * K; for (let k = -lw; k <= lw; k += K) put(nImg, x + k * .4, y + k, LEAF[k * s > 0 ? 3 : 2]); } } }
  twinkles = makeTwinkles(GW * hz / (1500 * K * K), hz * .7);
  const HALO = [3, 5].map(r0 => { const r = r0 * K; return spriteOf(r * 2 + 1, r * 2 + 1, g => { for (let y = 0; y <= r * 2; y++) for (let x = 0; x <= r * 2; x++) { const d = Math.hypot(x - r, y - r) / r; if (d < 1 && bay(x, y) < (1 - d) ** 1.5 * .7) dot(g, x, y, '#b8f050'); } }); });
  const flies = Array.from({length: 72}, () => ({x: R(0, GW), y: R(hz - 20 * K, GH - P), vx: 0, vy: 0, p: R(0, 6.28), sp: R(.6, 1.6)}));
  return {flares: false, shooters: true, draw: t => {
    for (const f of flies) {
      f.vx = clamp((f.vx + R(-.03, .03) + .25) / .5) * .5 - .25; f.vy = clamp((f.vy + R(-.03, .03) + .2) / .4) * .4 - .2;
      f.x += f.vx; f.y += f.vy; if (f.x < 0) f.x = GW; if (f.x > GW) f.x = 0; if (f.y < hz - 30 * K || f.y > GH - P) f.vy = -f.vy, f.y = Math.min(GH - P, Math.max(hz - 30 * K, f.y));
      const b = Math.max(0, Math.sin(t / (700 * f.sp) + f.p)) ** 3, near = (f.y - hz) / (GH - hz);
      if (b > .05) { const G = HALO[near > .5 ? 1 : 0]; fxc.globalAlpha = .55 * b; fxc.drawImage(G, f.x - G.width / 2 | 0, f.y - G.height / 2 | 0); glowStar(f.x, f.y, ['#4a7a18', '#d8ff70'], b, b > .6 ? 2 : 0); }
    }
  }};
}

// « Mon image »: any picture redrawn in the decor's own pixels: its light and shade, dithered on the sky's two ramps. skyTint then gives it the theme's colours.
// It fills the screen (bgFit 'fill', the default) or is shown whole (bgFit 'fit'): then what it leaves empty is the same picture, blurred and dark.
let bgPic = null, bgPicSrc = '';
const bgLoad = src => new Promise(ok => { const i = new Image(), done = p => { bgPic = p; bgPicSrc = src; ok(); }; i.onload = () => done(i); i.onerror = () => done(null); i.src = src ? fileUrl(src) : ''; if (!src) done(null); });
// ta photo en pixel art fidèle : ses propres couleurs (24 teintes calculées sur l'image), tramées, remplissant l'écran (ou entière avec « Ajuster »), à peine assombrie pour que le texte reste lisible
function image(fImg, nImg) {
  if (!bgPic) return space(fImg, nImg);  // not on this PC yet (still syncing), or no picture chosen
  const c = document.createElement('canvas'), x = c.getContext('2d', {willReadFrequently: true}), cover = Math.max(GW / bgPic.width, GH / bgPic.height);
  const fit = Math.min(GW / bgPic.width, GH / bgPic.height), draw = z => x.drawImage(bgPic, (GW - bgPic.width * z) / 2, (GH - bgPic.height * z) / 2, bgPic.width * z, bgPic.height * z);
  c.width = GW; c.height = GH; x.imageSmoothingQuality = 'high';
  x.filter = 'blur(10px) brightness(.45)'; draw(cover); x.filter = 'none'; draw((prefs.bgFit || 'fill') === 'fit' ? fit : cover);
  const d = x.getImageData(0, 0, GW, GH).data, n = GW * GH, dim = .8;
  // palette : des centres de couleurs (k-moyennes sur un échantillon), départ réparti selon la luminosité
  const smp = []; for (let i = 0; i < 4000; i++) { const p = (Math.random() * n | 0) * 4; smp.push([d[p], d[p + 1], d[p + 2]]); }
  smp.sort((u, v) => (u[0] + u[1] * 2 + u[2]) - (v[0] + v[1] * 2 + v[2]));
  let pal = Array.from({length: 24}, (_, i) => smp[Math.floor((i + .5) * smp.length / 24)].slice());
  for (let it = 0; it < 6; it++) {
    const sum = pal.map(() => [0, 0, 0, 0]);
    for (const s of smp) { let bi = 0, bd = 1e9; pal.forEach((q, i) => { const e = (q[0] - s[0]) ** 2 + (q[1] - s[1]) ** 2 + (q[2] - s[2]) ** 2; if (e < bd) { bd = e; bi = i; } }); const z = sum[bi]; z[0] += s[0]; z[1] += s[1]; z[2] += s[2]; z[3]++; }
    pal = pal.map((q, i) => sum[i][3] ? [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]] : q);
  }
  for (let y = 0; y < GH; y++) for (let X = 0; X < GW; X++) {
    const p = (y * GW + X) * 4, t = (BAYER[(y & 3) * 4 + (X & 3)] - .5) * 36;  // la trame : un décalage selon la position, puis la couleur la plus proche
    const r = d[p] + t, g = d[p + 1] + t, b = d[p + 2] + t;
    let bi = 0, bd = 1e9; for (let i = 0; i < pal.length; i++) { const q = pal[i], e = (q[0] - r) ** 2 + (q[1] - g) ** 2 + (q[2] - b) ** 2; if (e < bd) { bd = e; bi = i; } }
    const q = pal[bi]; put(fImg, X, y, [q[0] * dim | 0, q[1] * dim | 0, q[2] * dim | 0]);
  }
  twinkles = [];
  return {flares: false, shooters: false, draw: () => {}};
}

Object.assign(SCENES, {halloween, noel, newyear, skylanterns, fireflies, image});
if (SCENES[scene] && document.body.dataset.scene !== scene) generate();  // the first frame used a decor of this file before it was loaded
