// part of the NeoDex page (index.html): classic script sharing its global scope, loaded in the order of the page
/* ---------- procedural pixel-art space: a new scene every launch ---------- */
// Drawn at 1/S resolution with a limited palette + ordered (Bayer) dithering, then scaled up crisp.
// Two layers drift slowly for parallax (CSS animation): far (nebula, galaxies, dim stars) and near (planets, bright stars).
const sky = $('sky'), sx = sky.getContext('2d'), S = 3, K = 6 / S, P = 16 * K;  // K: sizes below were tuned for S = 6
const rnd = Math.random, R = (a, b) => a + rnd() * (b - a), gauss = () => (rnd() + rnd() + rnd() - 1.5) * 1.4;
const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v, smooth = (a, b, v) => { v = clamp((v - a) / (b - a)); return v * v * (3 - 2 * v); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const ramp = (...c) => c.map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
const DARK = ['#05010f', '#0b0320', '#130630'];
const NEBV = ramp(...DARK, '#1f0b4a', '#2f1268', '#451a8a', '#6229b0', '#8a43d8', '#b46aee', '#dfa6ff');
const NEBM = ramp(...DARK, '#2a0a48', '#460e66', '#6e1584', '#9c1ca4', '#cc22be', '#f352d6', '#ffa6ea');
const GAL = [
  ramp('#2a1060', '#4a2296', '#7446cc', '#a37ae8', '#d2b8ff', '#f6eeff', '#ffffff'),
  ramp('#3a0d5e', '#6a1488', '#a01ca6', '#e030c8', '#ff7ae0', '#ffd0f4', '#ffffff'),
  ramp('#0a2a40', '#12506a', '#1f8098', '#3fb8c8', '#8ee8ee', '#e0ffff', '#ffffff'),   // rare: cyan
  ramp('#40200a', '#7a3c10', '#b8641c', '#e89a3a', '#ffd07a', '#fff0c8', '#ffffff')];  // rare: gold
const galRamp = () => rnd() < .12 ? 2 + (rnd() * 2 | 0) : rnd() < .5 ? 1 : 0;
const PLANETS = [
  ramp('#0d0423', '#1e0c48', '#35157a', '#5a28b0', '#8a4ee0', '#c08cf5', '#f0dcff'),
  ramp('#12031f', '#3a0a48', '#6e1474', '#a81ea0', '#e03cc8', '#ff8ae2', '#ffd8f6'),
  ramp('#07051a', '#151240', '#232066', '#38348f', '#5a56b8', '#8f8ce0', '#d0ceff')];
const PLANET_RARE = [ramp('#03141a', '#08303a', '#105a66', '#1f8a8a', '#46bfae', '#9ee8d0', '#e6fff4'),
  ramp('#1a0a03', '#3e1a08', '#6e3410', '#a8561a', '#e08a34', '#ffc070', '#fff0d0')];
const planetRamp = () => rnd() < .12 ? PLANET_RARE[rnd() * 2 | 0] : PLANETS[rnd() * 3 | 0];
const STAR = ramp('#2a1f55', '#4a3c86', '#7f70b8', '#c4b8ec', '#ffffff');
// star glow tints: [outer, inner, core-ish]; lilac and pink most of the time, rarely cyan or gold
const GLOW = [ramp('#1e1448', '#4e3e92', '#c8b8f4'), ramp('#2a0e3a', '#6e2c80', '#f4b0e6'), ramp('#0a2433', '#256c80', '#b0eef6'), ramp('#2e1c0c', '#7a5428', '#f6dca0')];
const glowRamp = () => GLOW[rnd() < .1 ? 2 + (rnd() * 2 | 0) : rnd() < .6 ? 0 : 1];
const WHITE = [255, 255, 255];
const dith = (rp, v, x, y) => rp[Math.min(rp.length - 1, Math.floor(clamp(v) * (rp.length - 1) + BAYER[(y & 3) * 4 + (x & 3)]))];

let perm;
const hash = (x, y) => perm[((x * 73856093) ^ (y * 19349663)) & 1023];
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return s / (1 - Math.pow(.5, o)); }
// separable box blur, radius r (one horizontal + one vertical pass)
function blur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -r; i <= r; i++) { const X = x + i; if (X >= 0 && X < w) s += src[y * w + X]; } tmp[y * w + x] = s / n; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let j = -r; j <= r; j++) { const Y = y + j; if (Y >= 0 && Y < h) s += tmp[Y * w + x]; } out[y * w + x] = s / n; }
  return out;
}

let W, H, GW, GH, near, fxCanvas, fxc, twinkles = [], shooters = [], flares = [];
// the mouse in decor pixels and when it last moved (Lilas comes to sit by it when it rests)
const skyMouse = {x: -1, y: -1, t: performance.now()};
addEventListener('mousemove', e => { skyMouse.x = e.clientX / S + P; skyMouse.y = e.clientY / S + P; skyMouse.t = performance.now(); }, {passive: true});
// scene: the decor drawn by generate() (space or a landscape); fx: what it animates on top of the twinkles
// shortcut: local copy of settings.bgScene, only so the first frame is already the right decor; "random": the one drawn at the last launch for this one
let scene = (() => { try { const k = localStorage.neoScene || 'random'; return k === 'random' || k === 'favs' ? eventScene(new Date()) || localStorage.neoNext || 'space' : k; } catch { return 'space'; } })();
let fx = {flares: true, shooters: true, draw: () => {}};
const put = (img, x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= GW || y >= GH) return; const d = img.data, k = (y * GW + x) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; };
const makeTwinkles = (n, maxY, ramp = glowRamp) => Array.from({length: Math.round(n)}, () => ({x: R(0, GW) | 0, y: R(0, maxY) | 0, p: R(0, 6.28), s: R(.3, 1.1),
  big: rnd() < .2, g: ramp().map(c => `rgb(${c})`)}));
const NEBC = ramp(...DARK, '#0c2140', '#123a5e', '#17567a', '#1f7896', '#2fa0b4', '#5fcad2', '#b8f2f0');  // rare: a cyan heart in the brightest cloud
const TEMP = ramp('#a8c0ff', '#e4eaff', '#fff4dc', '#ffd28c', '#ff9c80');  // star colours by temperature: blue, white, yellow, orange, red
const CORE = ramp('#2e1e48', '#6a4a7a', '#b88aa8', '#ecc8c0', '#fff0dc', '#ffffff');  // the warm, old heart of a big galaxy
function space(fImg, nImg) {
  // 1. nebula: domain-warped clouds along a random band, bright thin filaments where the gas is compressed, dark dust lanes cutting through
  const sc = R(30, 52) * K, ox = R(0, 400), oy = R(0, 400), hx = R(0, 400);
  const bx = R(.2, .8) * GW, by = R(.2, .8) * GH, ba = R(0, Math.PI), bw = R(.2, .45) * GH, ca = Math.cos(ba), sa = Math.sin(ba);
  const band = (x, y) => Math.exp(-((((x - bx) * sa - (y - by) * ca) / bw) ** 2));
  const hueBias = R(-.15, .15), cyan = rnd() < .35, neb = new Float32Array(GW * GH);
  let peak = 0;
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const wx = fbm(x / sc + ox, y / sc + oy, 3) * 2.2, wy = fbm(x / sc + oy, y / sc + ox, 3) * 2.2;
    const n = fbm(x / sc + wx + ox, y / sc + wy + oy), b = band(x, y);
    let d = smooth(.42, .88, n) * (.15 + .85 * b);
    d += (1 - Math.abs(2 * fbm(x / (sc * .6) + wx * .5 + hx, y / (sc * .6) + wy * .5 + oy, 4) - 1)) ** 7 * .6 * smooth(.35, .7, n) * b;
    d *= 1 - smooth(.54, .72, fbm(x / (sc * .45) + hx, y / (sc * .45) + ox, 4)) * .85;
    neb[y * GW + x] = d; if (d > peak) peak = d;
  }
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const d = neb[y * GW + x], vig = 1 - Math.min(1, Math.hypot(x / GW - .5, y / GH - .4) * 1.4);
    const magenta = fbm(x / (sc * 2) + hx, y / (sc * 2) + hx, 3) + hueBias + (BAYER[(y & 3) * 4 + (x & 3)] - .5) * .12 > .5;
    put(fImg, x, y, dith(cyan && d > peak * .8 ? NEBC : magenta ? NEBM : NEBV, vig * .18 + d * .72, x, y));
  }

  // 2. stars: a fine dust, denser along the band like a milky way; coloured stars by temperature; a soft glowing cluster now and then
  for (let i = 0; i < GW * GH / (12 * K * K); i++) { const x = R(0, GW), y = R(0, GH); if (rnd() < .3 + .7 * band(x, y)) put(fImg, x, y, STAR[Math.floor(rnd() ** 5 * 3.99)]); }
  for (let i = 0; i < GW * GH / (240 * K * K); i++) {
    const x = R(0, GW) | 0, y = R(0, GH) | 0, u = rnd(), c = TEMP[u < .3 ? 0 : u < .62 ? 1 : u < .82 ? 2 : u < .95 ? 3 : 4];
    put(fImg, x, y, c); if (rnd() < .25) for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(fImg, x + i, y + j, STAR[1]);
  }
  if (rnd() < .55) {  // an open cluster: a faint glow, then young blue-white stars, a few of them bright
    const cx = R(.1, .9) * GW, cy = R(.1, .9) * GH, s = R(3, 6) * K;
    for (let y = -3 * s; y <= 3 * s; y++) for (let x = -3 * s; x <= 3 * s; x++) { const X = Math.round(cx + x), Y = Math.round(cy + y), g = Math.exp(-(x * x + y * y) / (2 * s * s)); if (g > .15) put(fImg, X, Y, dith(NEBV, .12 + g * .2, X, Y)); }
    for (let i = 0; i < 70; i++) { const X = cx + gauss() * s, Y = cy + gauss() * s; put(fImg, X, Y, rnd() < .25 ? WHITE : TEMP[rnd() < .7 ? 0 : 1]); }
  }
  const star = (img, x, y, g, spikes) => {  // white core, tinted soft halo, optional thin fading spikes
    for (const [i, j] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) put(img, x + i, y + j, g[0]);
    for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(img, x + i, y + j, g[1]);
    for (let k = 2; k <= spikes; k++) { const c = g[k < spikes * .6 ? 1 : 0]; put(img, x + k, y, c); put(img, x - k, y, c); put(img, x, y + k, c); put(img, x, y - k, c); }
    put(img, x, y, WHITE);
  };
  for (let i = 0; i < GW * GH / (3500 * K * K); i++) star(nImg, R(0, GW), R(0, GH), glowRamp(), rnd() < .3 ? 3 + (rnd() * 4 | 0) : 0);

  // 3. a big spiral galaxy (rarely two): arms of stars with a dark dust lane on their inner edge, pink star-forming knots, a warm bulge
  const acc = new Float32Array(GW * GH), lane = new Float32Array(GW * GH), tint = new Uint8Array(GW * GH), knots = [];
  function galaxy(gx, gy, rad, arms, twist, tilt, rot, rp) {
    const cr = Math.cos(rot), sr = Math.sin(rot), at = (a, r, map, v) => {
      const lx = Math.cos(a) * r, ly = Math.sin(a) * r * tilt, X = Math.round(gx + lx * cr - ly * sr), Y = Math.round(gy + lx * sr + ly * cr);
      if (X >= 0 && Y >= 0 && X < GW && Y < GH) { map[Y * GW + X] += 1; if (v) tint[Y * GW + X] = v; } return [X, Y];
    };
    for (let i = 0, N = rad * rad * 3; i < N; i++) {
      const t = Math.pow(rnd(), .75), core = rnd() < .28;
      const arm = (rnd() * arms | 0) / arms * 6.283 + t * twist, a = core ? rnd() * 6.283 : arm + gauss() * .65 * (1.3 - t);
      const r = core ? Math.abs(gauss()) * rad * .2 : t * rad * (1 + gauss() * .08);
      at(a, r, acc, core && r < rad * .22 ? 7 : rp + 1);
      if (!core && t > .2) at(arm - Math.sign(twist) * .32 + gauss() * .12, r, lane);
      if (!core && t > .3 && t < .9 && rnd() < .004) knots.push(at(a, r, acc));
    }
  }
  for (let i = 0, k = rnd() < .2 ? 2 : 1; i < k; i++)
    galaxy(R(.1, .9) * GW, R(.15, .85) * GH, R(14, 26) * K, 2 + (rnd() * 3 | 0), R(3.5, 6.5) * (rnd() < .5 ? 1 : -1), R(.35, .85), R(0, 6.28), galRamp());
  const glow = blur(blur(acc, GW, GH, 2 * K), GW, GH, 2 * K), dust = blur(lane, GW, GH, K);
  for (let i = 0; i < GW * GH; i++) if (glow[i] > .02) {
    const x = i % GW, y = i / GW | 0, v = 1 - Math.exp(-(acc[i] * .16 + glow[i] * .3)) - Math.min(.35, dust[i] * .07);
    if (v > .1) { let m = tint[i]; for (let k = 1; !m && k < 4 * K; k++) m = tint[i - k] || tint[i + k] || tint[i - k * GW] || tint[i + k * GW]; put(fImg, x, y, dith(m === 7 ? CORE : GAL[(m || 1) - 1], v, x, y)); }
  }
  for (const [x, y] of knots) { put(fImg, x, y, GAL[1][5]); put(fImg, x + 1, y, GAL[1][4]); put(fImg, x, y + 1, GAL[1][3]); }
  // small distant galaxies: tilted discs with a bright core, some seen edge-on with their dust lane
  function mini(gx, gy, r, tilt, rot, rp, edge) {
    const cr = Math.cos(rot), sr = Math.sin(rot), th = edge ? .2 : tilt;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const lx = x * cr + y * sr, ly = -x * sr + y * cr, d = Math.hypot(lx, ly / th) / r;
      if (d > 1) continue;
      let v = (1 - d) ** 1.6 * .85 + (d < .15 ? .35 : 0);
      if (edge && Math.abs(ly) < .7 && d > .2 && d < .85) v *= .45;
      const X = Math.round(gx + x), Y = Math.round(gy + y); if (v > .14) put(fImg, X, Y, dith(rp, v, X, Y));
    }
  }
  for (let i = 0, k = 3 + (rnd() * 4 | 0); i < k; i++) mini(R(0, GW), R(0, GH), Math.round(R(2.5, 6) * K), R(.3, .8), R(0, 6.28), GAL[galRamp()], rnd() < .3);

  // 4. planets (near layer), all lit by the same star: banded sphere stirred by turbulence, sometimes a storm, soft terminator,
  // darker limb, thin lit rim, a hazy atmosphere fading out on the lit side, rings with gaps that fall into the planet's shadow
  const L = [R(-1, -.4), R(-.9, -.2), .6], ln = Math.hypot(...L); L.forEach((v, i) => L[i] = v / ln);
  const l2 = Math.hypot(L[0], L[1]);
  function planet(cx, cy, r, rp, ringed, rocky) {
    const ri = r * 1.4, ro = r * R(1.9, 2.4), rt = R(.2, .35), rr = R(-.5, .5), seed = R(0, 99), atm = 3 * K, ext = Math.ceil(ringed ? ro : r + atm);
    const ringRp = GAL[rnd() < .15 ? 2 + (rnd() * 2 | 0) : 0], storm = !rocky && rnd() < .4 ? {x: R(-.35, .35), y: R(-.45, .45), w: R(.16, .26), h: R(.07, .11)} : null;
    for (let y = -ext; y <= ext; y++) for (let x = -ext; x <= ext; x++) {
      const X = Math.round(cx + x), Y = Math.round(cy + y), dd = x * x + y * y;
      const qx = x * Math.cos(rr) + y * Math.sin(rr), qy = (-x * Math.sin(rr) + y * Math.cos(rr)) / rt, rd = Math.hypot(qx, qy);
      const inRing = ringed && rd > ri && rd < ro && fbm(rd * .7 / K + seed, 1, 2) > .36;
      if (dd <= r * r && !(inRing && qy > 0)) {
        const nx = x / r, ny = y / r, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), l = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        let tex;
        if (rocky) tex = .5 - smooth(.55, .7, fbm(nx * 2.5 + seed, ny * 2.5, 3)) * .5;
        else {
          tex = fbm(seed, (ny + (fbm(nx * 3 + seed, ny * 6, 3) - .5) * .22) * 4.5, 4);
          if (storm) { const e = ((nx - storm.x) / storm.w) ** 2 + ((ny - storm.y) / storm.h) ** 2; if (e < 1) tex = tex * .3 + .9 * (1 - e) ** .5; }
        }
        let v = Math.max(.1, .06 + l ** .8 * .78 + (tex - .5) * .6 * (.3 + l) - (1 - nz) * .1);  // the night side stays a dark disc, not a hole
        if (dd > (r - 1.2 * K) ** 2) v += l > .3 ? .22 : .07;  // lit rim, and a faint one on the night side so the outline reads
        put(nImg, X, Y, dith(rp, v, X, Y));
      } else if (inRing) {
        const shadow = Math.abs(x * L[1] - y * L[0]) / l2 < r && x * L[0] + y * L[1] < 0 && dd > r * r;
        put(nImg, X, Y, dith(ringRp, .22 + fbm(rd * 1.4 / K + seed, 3, 2) * .55 - (shadow ? .3 : 0), X, Y));
      } else if (dd < (r + atm) ** 2) {
        const d = (Math.sqrt(dd) - r) / atm, lit = (x * L[0] + y * L[1]) / Math.sqrt(dd) / l2;
        if (lit > -.15 && BAYER[(Y & 3) * 4 + (X & 3)] < (1 - d) * (.35 + .5 * lit)) put(nImg, X, Y, dith(rp, .2 + .2 * (1 - d), X, Y));
      }
    }
  }
  const side = () => rnd() < .5 ? R(.04, .2) * GW : R(.8, .96) * GW;
  if (rnd() < .8) {
    const pr = R(8, 16) * K, px0 = side(), py0 = R(.2, .85) * GH;
    planet(px0, py0, pr, planetRamp(), rnd() < .6, false);
    if (rnd() < .6) planet(px0 + (rnd() < .5 ? -1 : 1) * pr * R(2.4, 3.2), py0 + R(-1, 1) * pr * 1.5, R(2, 4) * K, PLANETS[2], false, true);
  }
  twinkles = makeTwinkles(GW * GH / (1100 * K * K), GH);
  // rare slow comets with a long tail, and satellites: one blinking dot crossing the screen
  let comets = [], sats = [];
  return {flares: true, shooters: true, draw: t => {
    if (rnd() < .0007 && !comets.length) { const dir = rnd() < .5 ? 1 : -1; comets.push({x: dir > 0 ? -20 : GW + 20, y: R(.05, .5) * GH, vx: dir * R(.5, .8) * K / 2, vy: R(.1, .25) * K / 2, life: 0}); }
    comets = comets.filter(c => c.life++ < 1400 && c.x > -60 && c.x < GW + 60 && c.y < GH + 60);
    for (const c of comets) {
      c.x += c.vx; c.y += c.vy;
      const n = Math.hypot(c.vx, c.vy), len = 40 * K, fade = Math.min(1, c.life / 60);
      for (let j = len; j >= 0; j--) { const q = j / len, w = Math.round((1 - q) * 1.5); for (let s = -w; s <= w; s++) fill(c.x - c.vx / n * j - c.vy / n * s, c.y - c.vy / n * j + c.vx / n * s, q < .05 ? '#fff' : q < .3 ? '#d9c6ff' : '#7fe0ee', (1 - q) ** 2 * .7 * fade); }
      glowStar(c.x, c.y, GLOW[2].map(v => `rgb(${v})`), fade, 2);
    }
    if (rnd() < .0015 && sats.length < 1) sats.push({x: -5, y: R(.05, .7) * GH, vx: R(.25, .45), vy: R(-.06, .06)});
    sats = sats.filter(s => (s.x += s.vx, s.y += s.vy, s.x < GW + 5));
    for (const s of sats) fill(s.x, s.y, '#fff', Math.sin(t / 250) > .3 ? .9 : .35);
  }};
}

/* ---------- landscape decors: same palette and dithering as the space sky (the colour themes recolour them too) ---------- */
const SKY = ramp('#04010d', '#08021a', '#0e0428', '#160738', '#200a48', '#2e0e58', '#401266', '#561572', '#70197c', '#8e2084', '#b02a88');  // zenith -> magenta haze
const SIL = ramp('#030008', '#07021a', '#0c0426', '#130833', '#1c0c42', '#281252', '#361a62', '#4a2474');  // silhouettes: near (dark) -> far (hazy)
const MOON = ramp('#3a2a6e', '#6a58a8', '#a594d8', '#d9ccf6', '#f6f0ff');
const WIN = [ramp('#3a0a48', '#a81ea0', '#ff8ae2'), ramp('#2a1f55', '#7f70b8', '#e6dcff'), ramp('#0a2a40', '#1f8098', '#8ee8ee'), ramp('#40200a', '#b8641c', '#ffd07a')];
const winRamp = () => WIN[rnd() < .1 ? 2 + (rnd() * 2 | 0) : rnd() < .55 ? 0 : 1];
function skyGrad(img, y1, a, b) { for (let y = 0; y < GH; y++) { const v = a + (b - a) * clamp(y / y1); for (let x = 0; x < GW; x++) put(img, x, y, dith(SKY, v, x, y)); } }
function skyStars(img, maxY, n) { for (let i = 0; i < n; i++) { const y = R(0, maxY); put(img, R(0, GW), y, STAR[Math.floor(rnd() ** 4 * 3.99 * (1 - y / maxY * .7))]); } }
function moon(img, cx, cy, r) {  // cratered disc lit from the upper left, with a dithered halo
  cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  const seed = R(0, 99), hr = 4 * K;
  for (let y = -r - hr; y <= r + hr; y++) for (let x = -r - hr; x <= r + hr; x++) {
    const d = Math.hypot(x, y), X = cx + x, Y = cy + y;
    if (d <= r) put(img, X, Y, dith(MOON, .95 - smooth(.55, .7, fbm(x / (r * .4) + seed, y / (r * .4), 3)) * .3 - (x + y) / r * .14 - smooth(.75, 1, d / r) * .2, X, Y));
    else if (d < r + hr && BAYER[(Y & 3) * 4 + (X & 3)] < .5 * (1 - (d - r) / hr)) put(img, X, Y, MOON[0]);
  }
}
// silhouette under a noisy skyline around row `base` (up to `amp` higher); sharp: mountain peaks with a lit rim instead of rolling hills
function ridge(img, base, amp, sc, v0, v1, sharp) {
  const seed = R(0, 400);
  for (let x = 0; x < GW; x++) {
    let n = fbm(x / sc + seed, seed, 5); if (sharp) n = (1 - Math.abs(2 * n - 1)) ** 1.5;
    const top = Math.round(base - amp * n);
    for (let y = Math.max(0, top); y < GH; y++) put(img, x, y, dith(SIL, v0 + (v1 - v0) * clamp((y - top) / (GH * .45)) + (sharp && y - top < K ? .2 : 0), x, y));
  }
}
function pine(img, x0, base, h, w, v, lit) {  // tiered fir; lit: -1 / 1 = moonlit left / right edge, 0 = none
  x0 = Math.round(x0); base = Math.round(base); h = Math.round(h);
  const tiers = 3 + (rnd() * 3 | 0), jag = R(0, 9);
  for (let r = 0; r < h; r++) {
    const q = r / h, Y = base - h + r;
    const hw = Math.round(Math.max(.5, w * (q * .55 + (q * tiers) % 1 * .45) * (.85 + .3 * vnoise(r / (2 * K) + jag, jag))));  // ragged branches
    for (let x = -hw; x <= hw; x++) put(img, x0 + x, Y, dith(SIL, v + ((lit < 0 && x <= -hw + 1) || (lit > 0 && x >= hw - 1) ? .22 : 0), x0 + x, Y));
  }
  for (let r = 0; r < h * .1; r++) put(img, x0, base + r, SIL[0]);
}
// a soft band of mist around row y0 (dithered, thicker where the noise says so)
function mist(img, y0, h, v, amt) {
  const seed = R(0, 400);
  for (let y = Math.max(0, Math.round(y0 - h)); y < Math.min(GH, y0 + h); y++) {
    const a = 1 - Math.abs(y - y0) / h;
    for (let x = 0; x < GW; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < a * amt * (.45 + .55 * fbm(x / (50 * K) + seed, y / (12 * K), 3))) put(img, x, y, dith(SIL, v, x, y));
  }
}

// a 3×5 pixel font for the neon signs (only the letters their words use)
const GLYPH = {A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', H: '101101111101101',
  I: '111010010010111', L: '100100100100111', N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110',
  T: '111010010010010', U: '101101101101111', X: '101101010101101', 2: '110001010100111', 4: '101101111001001'};
const SIGNS = ['NEO', 'DEX', 'BAR', 'HOTEL', 'CAFE', '24H', 'SUSHI', 'PIXEL', 'ARCADE', 'TAXI'];
function glyphs(img, word, x, y, c, vertical, z = 1) {  // letters of z×z pixels, one every 4z across or 6z down
  [...word].forEach((ch, n) => { const g = GLYPH[ch] || ''; for (let k = 0; k < 15; k++) if (g[k] === '1') for (let i = 0; i < z; i++) for (let j = 0; j < z; j++)
    put(img, x + (vertical ? 0 : n * 4 * z) + (k % 3) * z + i, y + (vertical ? n * 6 * z : 0) + (k / 3 | 0) * z + j, c); });
}
function city(fImg, nImg) {
  const hz = Math.round(GH * R(.6, .68)), tips = [], signs = [];
  skyGrad(fImg, hz, 0, 1);
  skyStars(fImg, hz * .55, GW * GH / (140 * K * K));
  moon(fImg, R(.1, .9) * GW, R(.08, .2) * GH, R(7, 11) * K);
  // thin clouds, lit from below by the city
  for (let c = 0, n = 2 + (rnd() * 3 | 0); c < n; c++) {
    const cy = hz * R(.12, .45), ch = R(3, 7) * K, seed = R(0, 400), x0 = R(-.2, .6) * GW, cw = R(.3, .7) * GW;
    for (let y = Math.round(cy - ch); y < cy + ch; y++) for (let x = Math.max(0, x0 | 0); x < Math.min(GW, x0 + cw); x++) {
      const e = 1 - Math.abs(y - cy) / ch, f = fbm(x / (18 * K) + seed, y / (5 * K), 4) * Math.min(1, (x - x0) / (cw * .2), (x0 + cw - x) / (cw * .2));
      if (f * e > .32) put(fImg, x, y, dith(SKY, .25 + (y - cy + ch) / (2 * ch) * .55 + (f - .5) * .3, x, y));
    }
  }
  // a tower: wall fading into the haze, moonlit left edge, window grid (whole rooms lit together), setbacks, roof details, signs
  const tower = (img, x0, w, top, v, haze, win, p, near) => {
    const rp = winRamp(), style = rnd(), glass = style < .25, deco = style > .8 && w > 10 * K, gx = win + Math.max(1, win), gy = win + Math.max(1, win) + (glass ? 0 : 1);
    const block = (a, b, t, rim) => {
      for (let y = t; y < GH; y++) {
        const hv = v + haze * clamp((y - hz * .75) / (GH - hz * .75));
        for (let X = a; X < b; X++) put(img, X, y, dith(SIL, hv + (X === a ? .12 : 0) + (rim && X === b - 1 ? .06 : 0) + (glass && (X - a) % (3 * K) === 0 ? .05 : 0), X, y));
      }
      for (let y = t + 2 * win, f = 0; y < GH; y += gy, f++) {
        const busy = rnd() < .08 ? 1 : p * R(0, 2.2), room = Math.max(1, Math.round(R(1, 4)));
        let lit = false;
        for (let X = a + win, c = 0; X + win <= b - win; X += gx, c++) {
          if (c % room === 0) lit = rnd() < busy;
          const col = lit ? rp[rnd() < .15 ? 2 : 1] : near ? SIL[Math.min(7, Math.round(v * 7) + 2)] : null;
          if (col) for (let i = 0; i < win; i++) for (let j = 0; j < (glass ? 1 : win); j++) put(img, X + i, y + j, col);
        }
      }
    };
    block(x0, x0 + w, top, true);
    let roof = top;
    if (deco) {  // art deco: two setbacks and a spire
      const s1 = Math.round(R(5, 9) * K), s2 = Math.round(R(4, 7) * K);
      block(Math.round(x0 + w * .15), Math.round(x0 + w * .85), top - s1, true);
      block(Math.round(x0 + w * .32), Math.round(x0 + w * .68), top - s1 - s2, true);
      roof = top - s1 - s2;
      const ax = Math.round(x0 + w / 2), ah = Math.round(R(8, 16) * K);
      for (let y = 0; y < ah; y++) { const hw = Math.round((1 - y / ah) * K); for (let i = -hw; i <= hw; i++) put(img, ax + i, roof - y, SIL[Math.min(7, Math.round(v * 7) + (i < 0 ? 1 : 0))]); }
      tips.push([ax, roof - ah, R(0, 6)]);
    } else if (w > 8 * K && rnd() < .35) { roof = Math.round(top - R(4, 12) * K); block(Math.round(x0 + w * .2), Math.round(x0 + w * .8), roof, true); }
    // roof clutter: antenna with a red light, a water tank on legs, air-conditioning boxes
    const rc = SIL[Math.round(v * 7)];
    if (!deco && rnd() < .4) { const ax = Math.round(x0 + w * R(.3, .7)), ah = Math.round(R(5, 14) * K); for (let y = 0; y < ah; y++) put(img, ax, roof - y, rc); tips.push([ax, roof - ah, R(0, 6)]); }
    if (!deco && rnd() < .4) { const tx = Math.round(x0 + R(.15, .55) * w), tw = 3 * K; for (let y = 0; y < 3 * K; y++) for (let i = 0; i < tw; i++) put(img, tx + i, roof - K - y + (i === 0 || i === tw - 1 ? 0 : 0), rc); for (let y = 0; y < K; y++) { put(img, tx, roof - 1 - y, rc); put(img, tx + tw - 1, roof - 1 - y, rc); } }
    if (near) for (let i = 0, n = rnd() * 3 | 0; i < n; i++) { const bx = Math.round(x0 + R(.1, .8) * w); for (let y = 1; y <= K; y++) for (let j = 0; j < 2 * K; j++) put(img, bx + j, top - y, rc); }
    // neon signs on the nearest towers: a vertical board on the side, or a lit word on the roof
    if (near && w > 14 * K && rnd() < .5) {
      const word = SIGNS[rnd() * SIGNS.length | 0], c = WIN[rnd() < .35 ? 2 : rnd() < .2 ? 3 : 0], vert = rnd() < .6;
      const z = K, nw = vert ? 3 * z + 4 : word.length * 4 * z - z + 4, nh = vert ? word.length * 6 * z - z + 4 : 5 * z + 4;
      const right = rnd() < .5, nx = vert ? (right ? x0 + w - 1 : x0 - nw + 1) : Math.round(x0 + (w - nw) / 2), ny = vert ? Math.round(R(top + 6 * K, Math.max(top + 7 * K, hz * .9))) : roof - nh - 2 * K;
      for (let y = -2 * K; y < nh + 2 * K; y++) for (let i = -2 * K; i < nw + 2 * K; i++) {
        const X = nx + i, Y = ny + y, inside = i >= 0 && i < nw && y >= 0 && y < nh, edge = inside && (i === 0 || i === nw - 1 || y === 0 || y === nh - 1);
        if (inside) put(img, X, Y, edge ? c[2] : SIL[1]);
        else if (BAYER[(Y & 3) * 4 + (X & 3)] < .3 * (1 - Math.max(Math.abs(i < 0 ? i : i - nw + 1), Math.abs(y < 0 ? y : y - nh + 1)) / (2 * K + 1))) put(img, X, Y, c[0]);
      }
      glyphs(img, word, nx + 2, ny + 2, c[2], vert, z);
      if (!vert) for (let y = 0; y < 2 * K; y++) { put(img, nx + 2, ny + nh + y, rc); put(img, nx + nw - 3, ny + nh + y, rc); }  // the roof sign's legs
      signs.push([nx, ny, nw, nh]);
    }
  };
  const row = (img, wMin, wMax, hMin, hMax, gap, v, win, p, haze, near) => {
    for (let x = R(-20, 0) * K; x < GW;) {
      const w = Math.round(R(wMin, wMax) * K), gp = R(0, gap) * K;
      tower(img, Math.round(x), w, Math.round(hz * (1 - R(hMin, hMax))), v, haze, win, p, near);
      x += w + (gp < 3 ? -1 : gp);  // a gap of one or two pixels would show the sky as a thin line: towers touch instead
    }
  };
  row(fImg, 5, 12, .05, .28, 0, .78, 1, .1, .2, false);  // the farthest row has no gaps: no strip of sky down to the street
  mist(fImg, hz * .92, 10 * K, .85, .6);
  row(fImg, 8, 18, .12, .5, 6, .5, 1, .14, .25, false);
  row(nImg, 14, 30, .15, .58, 22, .16, 2, .13, .12, true);
  // the street: light washing the foot of the towers, pink and cyan
  const st = GH - P - 22 * K;  // the layers are taller than the screen (they drift): the street sits at the bottom of what is seen
  for (let y = st; y < GH; y++) for (let x = 0; x < GW; x++) {
    const a = Math.min(1, (y - st) / (22 * K)), c = WIN[fbm(x / (30 * K), 7, 2) > .5 ? 0 : 2];
    if (BAYER[(y & 3) * 4 + (x & 3)] < a * a * .38) put(nImg, x, y, c[a > .75 && BAYER[(y & 3) * 4 + (x & 3)] < .06 ? 2 : a > .4 ? 1 : 0]);
  }
  twinkles = makeTwinkles(GW * hz / (2600 * K * K), hz * .45);
  // rain: thin slanted streaks over everything; flying cars: light dots crossing the sky above the towers
  const drops = Array.from({length: GW * GH / (550 * K * K) | 0}, () => ({x: R(0, GW), y: R(0, GH), v: R(3, 5) * K / 2, a: R(.1, .26)}));
  const cars = Array.from({length: 5}, () => ({x: R(0, GW), y: hz * R(.12, .38), v: R(.25, .6) * (rnd() < .5 ? 1 : -1), c: rnd() < .6 ? '#ff8ae2' : '#8ee8ee'}));
  return {flares: false, shooters: false, draw: t => {
    for (const [x, y, p] of tips) { const b = (Math.sin(t / 600 + p) + 1) / 2; if (b > .5) { fill(x, y, '#ff4f6d', b); fill(x - 1, y, '#ff4f6d', b * .4); fill(x + 1, y, '#ff4f6d', b * .4); } }
    for (const [x, y, w, h] of signs) if (Math.sin(t / 97 + x) > .985) { fxc.globalAlpha = .7; fxc.fillStyle = '#05010f'; fxc.fillRect(x, y, w, h); }  // a sign flickers now and then
    for (const c of cars) {
      c.x += c.v; if (c.x < -30 || c.x > GW + 30) { c.x = c.v > 0 ? -30 : GW + 30; c.y = hz * R(.12, .38); }
      for (let j = 0; j < 7 * K; j++) fill(c.x - Math.sign(c.v) * j, c.y, c.c, (1 - j / (7 * K)) * .6);
      fill(c.x, c.y, '#fff');
    }
    for (const d of drops) {
      d.y += d.v; d.x -= d.v * .25; if (d.y > GH) { d.y = -4 * K; d.x = R(0, GW + GH * .25); }
      for (let j = 0; j < 4 * K; j++) fill(d.x + j * .25, d.y - j, '#c8b8f4', d.a * (1 - j / (4 * K)));
    }
  }};
}

function forest(fImg, nImg) {
  const hz = Math.round(GH * R(.44, .5)), mx = R(.15, .85) * GW, my = R(.12, .26) * GH, mr = R(10, 15) * K, lit = mx < GW / 2 ? -1 : 1;
  skyGrad(fImg, hz + 20 * K, 0, 1);
  skyStars(fImg, hz * .85, GW * GH / (70 * K * K));
  // the moon's wide soft halo, then the moon
  for (let y = Math.round(my - mr * 4); y < my + mr * 4; y++) for (let x = Math.round(mx - mr * 4); x < mx + mr * 4; x++) {
    const d = Math.hypot(x - mx, y - my) / (mr * 4); if (d < 1 && x >= 0 && y >= 0 && x < GW && y < GH && BAYER[(y & 3) * 4 + (x & 3)] < (1 - d) ** 3 * .3) put(fImg, x, y, dith(SKY, .55 + (1 - d) * .3, x, y));
  }
  moon(fImg, mx, my, mr);
  ridge(fImg, hz, 26 * K, 90 * K, .98, .75);                // misty far hills
  mist(fImg, hz + 4 * K, 8 * K, 1, .7);
  ridge(fImg, hz + 16 * K, 18 * K, 60 * K, .8, .58);
  // three rows of firs, each darker and bigger, with mist between them
  for (let x = -10; x < GW + 10; x += R(2, 5) * K) pine(fImg, x, hz + R(22, 28) * K, R(10, 18) * K, R(2.5, 3.5) * K, .56, 0);
  mist(fImg, hz + 24 * K, 7 * K, .7, .8);
  for (let x = -10; x < GW + 10; x += R(3, 8) * K) pine(fImg, x, hz + R(34, 42) * K, R(18, 32) * K, R(3.5, 5.5) * K, .4, lit);
  mist(fImg, hz + 40 * K, 6 * K, .5, .6);
  const lt = Math.round(hz + 42 * K);                       // the far shore: a thin dark line of undergrowth
  ridge(fImg, lt - 2 * K, 2 * K, 20 * K, .3, .3);
  // the lake: the sky, the hills and the trees mirrored, darker, broken by ripples that widen towards us
  const lb = GH, d = fImg.data, mid = Math.round(GH - P - 14 * K);
  for (let y = lt; y < lb; y++) {
    const q = (y - lt) / (lb - lt), sy = Math.round(lt - 1 - (y - lt) * .9), off = Math.round(Math.sin(y * 1.7 / K + q * 9) * (.5 + q * 2.5) * K * .5);
    for (let x = 0; x < GW; x++) {
      const k = (y * GW + x) * 4, sx = Math.min(GW - 1, Math.max(0, x + off)), s = sy >= 0 ? (sy * GW + sx) * 4 : -1, line = (y + (x >> 4)) % (5 * K) === 0 && BAYER[(y & 3) * 4 + (x & 3)] < .5;
      const f = .8 - q * .25;
      if (s >= 0) { d[k] = d[s] * f + 6 + (line ? 14 : 0); d[k + 1] = d[s + 1] * f + 3 + (line ? 8 : 0); d[k + 2] = d[s + 2] * f + 14 + (line ? 22 : 0); d[k + 3] = 255; }
    }
    // the moon's path on the water: bright broken dashes under the moon, wider and sparser towards us
    const w = mr * (.8 + q * 3), seed = y * 7.3;
    for (let x = Math.round(mx - w); x < mx + w; x++) {
      const e = 1 - Math.abs(x - mx) / w;
      if (x >= 0 && x < GW && vnoise(x / (3 * K) + seed, y / K) * e > .42 - q * .1) put(fImg, x, y, MOON[Math.min(4, Math.round(e * 4 * (1 - q * .5)))]);
    }
  }
  // the near shore (near layer): a dark bank with rocks, grass and reeds, and big firs only on the sides, framing the lake
  ridge(nImg, mid, 5 * K, 40 * K, .1, 0);
  for (let i = 0, n = 3 + (rnd() * 4 | 0); i < n; i++) {  // rocks, rounded, with a moonlit top
    const cx = R(.1, .9) * GW, rw = R(4, 9) * K, rh = rw * R(.45, .7), cy = mid + R(1, 6) * K;
    for (let y = -rh; y <= 0; y++) for (let x = -rw; x <= rw; x++) if ((x / rw) ** 2 + (y / rh) ** 2 <= 1) put(nImg, cx + x, cy + y, SIL[(x * lit > rw * .2 && y < -rh * .45) ? 3 : y < -rh * .7 ? 2 : 1]);
  }
  for (let x = R(-10, 0) * K; x < GW + 20; x += R(10, 24) * K) {
    const edge = x < GW * .16 || x > GW * .84;
    if (edge && rnd() < .85) pine(nImg, x, GH - R(4, 10) * K, R(80, 140) * K, R(9, 14) * K, .12, lit);
  }
  for (let x = 0; x < GW; x++) {
    let y0 = Math.round(mid - 10 * K);
    while (y0 < GH - 1 && !nImg.data[(y0 * GW + x) * 4 + 3]) y0++;  // first opaque pixel: the ground (or a trunk, a rock)
    if (rnd() < .4) { const h = Math.round(R(1, 4) * K), lean = rnd() < .5 ? -1 : 1; for (let j = 0; j < h; j++) put(nImg, x + (j > h * .6 ? lean : 0), y0 - j, SIL[j === h - 1 ? 2 : 1]); }
    if (rnd() < .025) {  // a reed with its brown head
      const h = Math.round(R(8, 16) * K), lean = R(-.15, .15);
      for (let j = 0; j < h; j++) put(nImg, x + Math.round(j * lean), y0 - j, SIL[1]);
      for (let j = 0; j < 2.5 * K; j++) for (let i = 0; i < Math.max(2, K); i++) put(nImg, x + Math.round(h * lean) + i - (K >> 1), y0 - h - j, j === 0 ? SIL[3] : SIL[2]);
    }
  }
  twinkles = makeTwinkles(GW * hz / (1500 * K * K), hz * .8);
  const flies = Array.from({length: 40}, () => ({x: R(0, GW), y: R(lt, mid + 4 * K), p: R(0, 6.28), s: R(.4, 1)})), FLY = ['rgb(70,90,20)', 'rgb(200,235,100)'];
  return {flares: false, shooters: true, draw: t => {
    for (const f of flies) {
      f.x += Math.sin(t / 2100 * f.s + f.p) * .2; f.y += Math.cos(t / 2700 * f.s + f.p * 2) * .12;
      const b = ((Math.sin(t / 800 * f.s + f.p) + 1) / 2) ** 3;
      if (b > .05) { glowStar(f.x, f.y, FLY, b, 0); if (f.y > lt) fill(f.x, f.y + 5 * K, 'rgb(200,235,100)', b * .35); }  // and its reflection in the lake
    }
  }};
}

function ocean(fImg, nImg) {
  const hz = Math.round(GH * R(.55, .62)), mx = Math.round(R(.25, .75) * GW), my = R(.14, .28) * GH, mr = Math.round(R(10, 15) * K), seed = R(0, 400);
  skyGrad(fImg, hz, 0, 1);
  skyStars(fImg, hz * .9, GW * GH / (70 * K * K));
  // long thin clouds; the ones near the moon get a silver lining
  for (let c = 0, n = 2 + (rnd() * 3 | 0); c < n; c++) {
    const cy = hz * R(.15, .7), ch = R(5, 9) * K, cs = R(0, 400), x0 = R(-.2, .7) * GW, cw = R(.25, .6) * GW;
    for (let y = Math.round(cy - ch); y < cy + ch; y++) for (let x = Math.max(0, x0 | 0); x < Math.min(GW, x0 + cw); x++) {
      const e = 1 - Math.abs(y - cy) / ch, f = fbm(x / (20 * K) + cs, y / (4 * K), 4) * Math.min(1, (x - x0) / (cw * .2), (x0 + cw - x) / (cw * .2)) * e;
      if (f > .3) { const near = clamp(1 - Math.hypot(x - mx, y - my) / (mr * 9)), rim = f < .35 && y < cy; put(fImg, x, y, rim && near > .2 ? dith(MOON, near * .7, x, y) : dith(SKY, .2 + (y - cy + ch) / (2 * ch) * .35 + near * .3, x, y)); }
    }
  }
  moon(fImg, mx, my, mr);
  for (let i = 0; i < 3; i++) {  // islands on the horizon, with a lighter rim on the moon's side
    const cx = R(0, GW), w = R(25, 80) * K, h = R(4, 11) * K;
    for (let x = -w; x <= w; x++) { const top = hz - h * Math.sqrt(1 - (x / w) ** 2) * (.6 + .5 * fbm(x / (8 * K) + i * 9, 0, 3)); for (let y = top | 0; y < hz; y++) put(fImg, cx + x, y, dith(SIL, .6 + (y - (top | 0) < 1 && (x < 0) === (cx < mx) ? .25 : 0), cx + x, y)); }
  }
  if (rnd() < .7) {  // a sailboat far away: hull and two sails
    const bx = Math.round(R(.1, .9) * GW), s = K;
    for (let y = 0; y < 2 * s; y++) for (let x = -6 * s + y; x <= 6 * s - y; x++) put(fImg, bx + x, hz - 2 * s + y, SIL[3]);
    for (let y = 0; y < 14 * s; y++) { const w = Math.round(y / 14 * 5 * s); for (let x = 0; x <= w; x++) put(fImg, bx + x, hz - 3 * s - 14 * s + y, x === 0 ? SIL[2] : dith(MOON, .25 + x / (5 * s) * .2, bx + x, y)); }
    for (let y = 0; y < 10 * s; y++) { const w = Math.round(y / 10 * 3 * s); for (let x = 1; x <= w; x++) put(fImg, bx - x, hz - 3 * s - 10 * s + y, dith(MOON, .15, bx - x, y)); }
  }
  // sea: wave streaks stretched sideways (bigger towards the viewer), whitecaps, the moon's reflection widening down the screen
  const glints = [];
  for (let x = 0; x < GW; x++) put(fImg, x, hz, dith(SKY, .75, x, hz));  // the bright line of the horizon
  for (let y = hz + 1; y < GH; y++) {
    const q = (y - hz) / (GH - hz);
    for (let x = 0; x < GW; x++) {
      const wave = fbm(x / ((10 + 40 * q) * K) + seed, (y - hz) / ((.8 + 2.5 * q) * K), 3), col = Math.abs(x - mx) / (mr * (1 + q * 3));
      if (col < 1 && wave > .48 + col * .3) { put(fImg, x, y, dith(MOON, .7 - col * .5 - q * .35 + (wave - .5), x, y)); if (rnd() < .01) glints.push([x, y, R(0, 6.28), R(.6, 1.6)]); }
      else if (q > .25 && wave > .7 && BAYER[(y & 3) * 4 + (x & 3)] < (wave - .7) * 4) put(fImg, x, y, MOON[q > .6 && wave > .76 ? 1 : 0]);  // whitecaps
      else put(fImg, x, y, dith(SKY, .62 * (1 - q) ** 1.5 + (wave - .5) * .5 + (wave > .62 ? .08 : 0), x, y));
    }
  }
  // near: a rocky cape on one side, layered rock lit on the moon's side, foam at its foot, and a lighthouse on its top
  const left = rnd() < .5, cw = R(.2, .32) * GW, ch = R(60, 90) * K, foot = GH - P - 6 * K, tops = [], pl = Math.round(P + (cw - P) * R(.4, .55));
  for (let i = 0; i < cw; i++) {
    const k = (i - pl) / (cw - pl), prof = i < pl ? 1 : 1 - Math.sqrt(k);  // a flat headland, then a cliff dropping into the sea
    const X = left ? i : GW - 1 - i, top = Math.round(foot - ch * prof * (i < pl ? .95 + .08 * fbm(i / (10 * K) + seed, 3, 3) : .8 + .3 * fbm(i / (14 * K) + seed, 3, 4)));
    tops.push(top);
    const face = left ? 1 : -1, slope = i > 0 ? top - tops[i - 1] : 0, litSide = (mx > GW / 2) === left;  // the face turned to the moon catches light
    for (let y = top; y < GH; y++) {
      const strata = fbm(i / (30 * K) + seed, y / (3 * K), 3), crack = Math.abs(strata - .5) < .02;
      put(nImg, X, y, dith(SIL, .2 + (y - top < K ? .3 : 0) + (litSide && slope > 0 && y - top < 3 * K ? .15 : 0) + (crack ? -.08 : strata * .08), X, y));
    }
    if (top > foot - 30 * K) for (let y = top - 2 * K; y < top + 2 * K; y++) {  // surf: broken foam along the shore where the rock goes into the sea
      const f = fbm(i / (4 * K) + seed, y / K, 2) * (1 - Math.abs(y - top) / (2 * K)) * clamp((top - foot + 30 * K) / (10 * K));
      if (f > .3) put(nImg, X, y, MOON[f > .45 ? 3 : f > .37 ? 2 : 1]);
    }
  }
  const li = Math.round(P + (pl - P) * R(.45, .65)), lx = left ? li : GW - 1 - li, lb = Math.max(...tops.slice(li - 4 * K, li + 4 * K)),  // in the middle of the visible plateau, standing on its lowest point
    flip = mx > lx;  // drawn lit from the left; mirrored when the moon is on the right
  const block = (bx, by, c) => { for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) put(nImg, lx + (flip ? -bx - 1 : bx) * K + i, by * K + j, c); };
  const LH = {k: SIL[1], w: MOON[4], W: MOON[3], m: MOON[2], s: MOON[1], r: [224, 90, 120], R: [176, 42, 80], d: [122, 22, 56], D: [74, 12, 36], y: WIN[3][2], o: WIN[3][1]};
  const base = Math.round(lb / K), TH = 20;
  for (let r = 0; r < TH; r++) {  // the tower: tapered, shaded like a cylinder, two red bands, a door and a small window
    const hw = Math.round(3 + r / TH * 1.4), band = r >= 3 && r <= 6 || r >= 11 && r <= 14;
    for (let c = -hw; c <= hw; c++) {
      const u = (c + hw) / (2 * hw), t = u < .2 ? 0 : u < .5 ? 1 : u < .8 ? 2 : 3;
      let col = c === hw ? LH.k : band ? [LH.r, LH.R, LH.d, LH.D][t] : [LH.w, LH.W, LH.m, LH.s][t];
      if (c === 0 && (r >= TH - 3 || r === 8)) col = LH.k;
      block(c, base - TH + r, col);
    }
  }
  const TOP = ['......k......', '.....krk.....', '....krRdk....', '...krRRRdk...', '...kkkkkkk...', '...kwykyok...', '...kyykyok...', '.kkkkkkkkkkk.', '.k.kyykyok.k.', 'kkkkkkkkkkkkk', '..kdRRRRRdk..'];
  TOP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') block(c - 6, base - TH - TOP.length + r, LH[ch]); }));
  const lb2 = lb - (TH + TOP.length - 5.5) * K;
  const lamp = [lx + (flip ? -K : K) / 2, lb2], LAMP = GLOW[3].map(v => `rgb(${v})`);
  twinkles = makeTwinkles(GW * hz / (1500 * K * K), hz * .85);
  return {flares: false, shooters: true, draw: t => {
    for (const [x, y, p, s] of glints) { const b = ((Math.sin(t / 500 * s + p) + 1) / 2) ** 4; if (b > .1) fill(x, y, '#fff', b); }
    // the lighthouse beam turns: a long cone when it points sideways, a flash when it faces us
    const a = t / 2600, c = Math.cos(a), L = GW * .45 * Math.abs(c), sp = 6 * K + 20 * K * Math.abs(c);
    if (L > 4 * K) {
      const g = fxc.createLinearGradient(lamp[0], 0, lamp[0] + Math.sign(c) * L, 0); g.addColorStop(0, 'rgba(255,220,140,.35)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      fxc.globalAlpha = Math.abs(c); fxc.fillStyle = g;
      fxc.beginPath(); fxc.moveTo(lamp[0], lamp[1]); fxc.lineTo(lamp[0] + Math.sign(c) * L, lamp[1] - sp); fxc.lineTo(lamp[0] + Math.sign(c) * L, lamp[1] + sp * .6); fxc.fill();
    }
    const flash = Math.max(0, Math.sin(a)) ** 12;
    glowStar(lamp[0], lamp[1], LAMP, .4 + flash * .6, Math.round(flash * 6));
  }};
}

function mountains(fImg, nImg) {
  const hz = Math.round(GH * R(.5, .58));
  skyGrad(fImg, hz, .05, 1);
  skyStars(fImg, hz * .4, GW * GH / (110 * K * K));
  const SUN = ramp('#70197c', '#b02a88', '#e0408c', '#ff6a8a', '#ff9a80', '#ffd08a'), cx = Math.round(R(.3, .7) * GW), sr = Math.round(GH * R(.12, .16)), cy = hz - Math.round(sr * .6);
  const LITE = ramp('#361a62', '#5a2272', '#8a2c7c', '#c04a84', '#f07a88', '#ffb08a'), SNOW = ramp('#4a2f80', '#7c5aa8', '#b88ac8', '#f0b8d0', '#ffe2da');
  // the sky warms around the sun: a wide dithered glow
  for (let y = Math.max(0, cy - sr * 3); y < hz + GH * .2; y++) for (let x = 0; x < GW; x++) {
    const g = clamp(1 - Math.hypot((x - cx) / 3.2, (y - cy) * 1.2) / (sr * 1.6));
    if (g > 0 && BAYER[(y & 3) * 4 + (x & 3)] < g * g * .9) put(fImg, x, y, dith(SUN, g * .55, x, y));
  }
  // big sun sitting on the peaks, its lower half cut by bands that thicken downwards
  for (let y = -sr; y <= sr; y++) for (let x = -sr; x <= sr; x++) {
    if (x * x + y * y > sr * sr) continue;
    const q = y / sr;
    if (q > 0 && (y % (5 * K)) < q * 4 * K) continue;
    put(fImg, cx + x, cy + y, dith(SUN, 1 - (q + 1) / 2 * .85, cx + x, cy + y));
  }
  // a mountain range drawn peak by peak: each has a wandering ridgeline from its summit, the face towards the sun takes a warm light,
  // rock streaks radiate from the summit, snow covers the top down to a ragged line; smaller (nearer) peaks are drawn over taller ones
  const range = (img, base, amp, sc, v0, v1, light, snow) => {
    const peaks = [];
    for (let x = -sc; x < GW + sc; x += R(1, 1.7) * sc) peaks.push({px: x, h: amp * R(.35, 1), kl: R(.45, 1.1), kr: R(.45, 1.1), lean: R(-.25, .25), seed: R(0, 400)});
    peaks.sort((a, b) => b.h - a.h);
    for (const {px, h, kl, kr, lean, seed} of peaks) {
      const py = base - h, sunLeft = cx < px, x0 = Math.max(0, Math.floor(px - (GH - py) / kl)), x1 = Math.min(GW - 1, Math.ceil(px + (GH - py) / kr));
      for (let x = x0; x <= x1; x++) {
        const dx = x - px, top = Math.round(py + Math.abs(dx) * (dx < 0 ? kl : kr) + (fbm(x / (4 * K) + seed, 0, 3) - .5) * h * .18 * clamp(Math.abs(dx) / (4 * K)));
        const sn = h * (.18 + .12 * fbm(x / (5 * K) + seed, 3, 2));
        for (let y = Math.max(0, top); y < GH; y++) {
          const d = y - py, xr = px + d * lean + (fbm(y / (6 * K) + seed, 5, 2) - .5) * 4 * K * clamp(d / (10 * K)), left = x < xr;
          const lit = left === sunLeft, fade = clamp(1 - d / (h * 1.3)), streak = false;
          let c;
          if (snow && d < sn) c = dith(SNOW, (lit ? .55 + .45 * fade : .18) - (streak ? .15 : 0), x, y);
          else if (lit && light) c = dith(LITE, light * fade * (.6 + .4 * clamp(1 - Math.abs(x - xr) / (h * .8))) - (streak ? .18 : 0), x, y);
          else c = dith(SIL, v0 + (v1 - v0) * clamp((y - base + amp) / (GH * .5)) - (streak ? .05 : 0), x, y);
          if (y - top < 1 && !(snow && d < sn)) c = dith(SIL, v0 + .1, x, y);
          put(img, x, y, c);
        }
      }
    }
  };
  // glowing mist lying between the ranges, pink near the sun
  const glowMist = (img, y0, h, amt) => {
    const seed = R(0, 400);
    for (let y = Math.max(0, Math.round(y0 - h)); y < Math.min(GH, y0 + h); y++) {
      const a = 1 - Math.abs(y - y0) / h;
      for (let x = 0; x < GW; x++) if (BAYER[(y & 3) * 4 + (x & 3)] < a * amt * (.4 + .6 * fbm(x / (40 * K) + seed, y / (8 * K), 3))) put(img, x, y, dith(LITE, .25 + .4 * clamp(1 - Math.abs(x - cx) / (GW * .4)), x, y));
    }
  };
  range(fImg, hz, GH * .16, 70 * K, .95, .7, .6, true);
  glowMist(fImg, hz + GH * .06, 8 * K, .5);
  range(fImg, hz + GH * .1, GH * .16, 50 * K, .66, .4, .4, false);
  ridge(nImg, hz + GH * .26, GH * .16, 42 * K, .3, .05, true);
  twinkles = makeTwinkles(GW * hz / (2400 * K * K), hz * .4);
  const birds = Array.from({length: 7}, () => ({x: R(-60, 0) * K, y: hz * R(.35, .6), s: R(.14, .22) * K, p: R(0, 6.28)}));
  return {flares: false, shooters: true, draw: t => {
    for (const b of birds) {
      b.x += b.s; if (b.x > GW + 20) { b.x = R(-80, -10) * K; b.y = hz * R(.35, .6); }
      const up = Math.sin(t / 160 + b.p) > 0 ? 1 : 0;
      fill(b.x, b.y, '#0c0426'); fill(b.x - 1, b.y - up, '#0c0426'); fill(b.x + 1, b.y - up, '#0c0426'); fill(b.x - 2, b.y - 2 * up + (1 - up), '#0c0426'); fill(b.x + 2, b.y - 2 * up + (1 - up), '#0c0426');
    }
  }};
}
const SCENES = {space, city, forest, ocean, mountains};
const SCENE_NAMES = {space: 'Espace', city: 'Ville néon', forest: 'Forêt', ocean: 'Océan', mountains: 'Crépuscule',
  desert: 'Désert', aurora: 'Aurore boréale', sakura: 'Cerisiers', volcano: 'Volcan', abyss: 'Abysses', orbit: 'Station orbitale', rooftops: 'Toits la nuit', jungle: 'Cascade', floating: 'Îles flottantes', train: 'Train de nuit',
  halloween: 'Halloween', noel: 'Noël', newyear: 'Nouvel An', skylanterns: 'Lanternes', fireflies: 'Lucioles', image: 'Mon image',
  paques: 'Pâques', plage: 'Plage tropicale', pluie: 'Pluie sur la ville', savane: 'Savane', lavande: 'Champs de lavande', automne: 'Automne', orage: 'Orage sur la mer',
  fuji: 'Mont Fuji', synthwave: 'Synthwave', cristaux: 'Cristaux', recif: 'Récif de corail', banquise: 'Banquise', chateau: 'Château', mars: 'Mars', marais: 'Marais', vangogh: 'Nuit étoilée', galion: 'Galion', foire: 'Fête foraine', trounoir: 'Trou noir', bambou: 'Bambouseraie', lilas: 'Lilas'};
// the other decors are in scenes2-5.js, loaded only when one of them is drawn. The files share drawing tools (2 and 3 use each other's,
// 4 needs them, 5 needs 4's), so a decor brings the files it needs, in order; Cascade and Toits la nuit were redrawn in scenes5.js
const SCENE_FILES = {scenes2: ['desert', 'aurora', 'sakura', 'volcano', 'abyss', 'orbit', 'floating', 'train'], scenes3: ['halloween', 'noel', 'newyear', 'skylanterns', 'fireflies', 'image'],
  scenes4: ['paques', 'plage', 'pluie', 'savane', 'lavande', 'automne', 'orage'], scenes5: ['fuji', 'synthwave', 'cristaux', 'recif', 'banquise', 'chateau', 'mars', 'marais', 'vangogh', 'galion', 'foire', 'trounoir', 'bambou', 'lilas', 'jungle', 'rooftops']};
const SCENE_NEEDS = {scenes2: ['scenes2', 'scenes3'], scenes3: ['scenes2', 'scenes3'], scenes4: ['scenes2', 'scenes3', 'scenes4'], scenes5: ['scenes2', 'scenes3', 'scenes4', 'scenes5']};
// scripts fetched on first use (decors, NeoStore, palette, Chrome extensions): once each, in the order asked
const scriptLoads = {};
const loadScript = f => scriptLoads[f] ??= new Promise((ok, ko) => { const s = document.createElement('script'); s.src = f + '.js'; s.onload = ok; s.onerror = () => { delete scriptLoads[f]; ko(new Error(f + '.js introuvable')); }; document.head.append(s); });
async function needScene(k) { const f = Object.keys(SCENE_FILES).find(f => SCENE_FILES[f].includes(k)); if (f) for (const x of SCENE_NEEDS[f]) await loadScript(x); }
console.assert(Object.keys(SCENE_NAMES).every(k => SCENES[k] || Object.values(SCENE_FILES).some(l => l.includes(k))), 'décor sans fichier');

function generate() {
  if (!SCENES[scene] && SCENE_NAMES[scene]) return void needScene(scene).then(() => SCENES[scene] && generate(), e => console.warn(e));
  W = Math.ceil(innerWidth / S); H = Math.ceil(innerHeight / S);
  GW = W + 2 * P; GH = H + 2 * P;  // layers are bigger than the screen so they can drift
  perm = new Float32Array(1024).map(rnd);
  const fImg = new ImageData(GW, GH), nImg = new ImageData(GW, GH);
  shooters = []; flares = [];
  fx = (SCENES[scene] || space)(fImg, nImg);
  document.body.dataset.scene = SCENES[scene] ? scene : 'space';

  // On-screen canvases are at full screen resolution (art pixels pre-scaled with nearest-neighbour), so the CSS drift
  // can move them by sub-pixel amounts smoothly; a low-res canvas scaled by CSS would snap to whole art pixels.
  // téléphone : en pixels CSS, pas en pixels de l'écran (3 fois plus fin, donc 9 fois plus de pixels à redessiner à chaque image)
  const D = S * (window.neo?.mobile ? 1 : devicePixelRatio), small = () => { const k = document.createElement('canvas'); k.width = GW; k.height = GH; return k; };
  for (const c of [$('skyFar'), sky]) {
    c.width = Math.round(GW * D); c.height = Math.round(GH * D);
    Object.assign(c.style, {width: GW * S + 'px', height: GH * S + 'px', left: -P * S + 'px', top: -P * S + 'px'});
    c.getContext('2d').imageSmoothingEnabled = false;
  }
  const farSmall = small(); farSmall.getContext('2d').putImageData(fImg, 0, 0);
  $('skyFar').getContext('2d').drawImage(farSmall, 0, 0, sky.width, sky.height);
  near = small(); near.getContext('2d').putImageData(nImg, 0, 0);
  fxCanvas = small(); fxc = fxCanvas.getContext('2d');
}

const fill = (x, y, c, a = 1) => { fxc.globalAlpha = a; fxc.fillStyle = c; fxc.fillRect(x | 0, y | 0, 1, 1); };
function glowStar(x, y, g, b, spikes) {  // same shape as the static stars, brightness b in 0..1
  fill(x + 1, y + 1, g[0], b * .7); fill(x - 1, y - 1, g[0], b * .7); fill(x + 1, y - 1, g[0], b * .7); fill(x - 1, y + 1, g[0], b * .7);
  fill(x + 1, y, g[1], b); fill(x - 1, y, g[1], b); fill(x, y + 1, g[1], b); fill(x, y - 1, g[1], b);
  for (let k = 2; k <= spikes; k++) { const a = b * (1 - k / (spikes + 1)); fill(x + k, y, g[1], a); fill(x - k, y, g[1], a); fill(x, y + k, g[1], a); fill(x, y - k, g[1], a); }
  fill(x, y, '#fff', Math.min(1, b * 1.3));
}
let last = 0;
function drawSky(t) {
  requestAnimationFrame(drawSky);
  if (!near) return;  // not drawn yet (its decor's script is still loading)
  if (document.body.classList.contains('browsing') || document.fullscreenElement) return;  // hidden behind a website or a fullscreen game: save the CPU
  if (t - last < (window.neo?.mobile ? 66 : 33)) return; last = t;  // effects at ~30 fps, ~15 on a phone (the drift itself is a CSS animation)
  paintFx(t);
  sx.clearRect(0, 0, sky.width, sky.height); sx.drawImage(fxCanvas, 0, 0, sky.width, sky.height);
}
// one frame of the decor's moving layer (stars, flares, shooting stars, the decor's own animation) into fxCanvas
function paintFx(t) {
  fxc.globalAlpha = 1; fxc.clearRect(0, 0, GW, GH); fxc.drawImage(near, 0, 0);
  for (const s of twinkles) {
    const b = ((Math.sin(t / 1000 * s.s + s.p) + 1) / 2) ** 2;  // smooth twinkle, mostly dim
    if (b > .05) glowStar(s.x, s.y, s.g, b, s.big ? Math.round(b * 4) : 0);
  }
  // rare flares that bloom and fade
  if (fx.flares && rnd() < .0027) flares.push({x: R(0, GW) | 0, y: R(0, GH) | 0, age: 0, g: glowRamp().map(c => `rgb(${c})`)});
  flares = flares.filter(f => f.age++ < 75);
  for (const f of flares) { const b = Math.sin(f.age / 75 * Math.PI); glowStar(f.x, f.y, f.g, b, Math.round(b * 7)); }
  // shooting stars: continuous fading trail
  if (fx.shooters && rnd() < .005) { const dir = rnd() < .5 ? 1 : -1, sp = R(2, 3.4) * K / 2; shooters.push({x: R(.1, .9) * GW, y: R(0, .4) * GH, vx: dir * sp, vy: sp * R(.35, .6), life: 0, rare: rnd() < .15}); }
  shooters = shooters.filter(s => (s.life++ < 42) && s.x > -40 && s.x < GW + 40 && s.y < GH + 40);
  for (const s of shooters) {
    s.x += s.vx; s.y += s.vy;
    const len = 16 * K, n = Math.hypot(s.vx, s.vy), ux = s.vx / n, uy = s.vy / n, fade = Math.min(1, (42 - s.life) / 10);
    for (let j = len; j >= 0; j--) { const q = j / len; fill(s.x - ux * j, s.y - uy * j, q < .12 ? '#fff' : s.rare ? '#7fe0ee' : '#ff8ae2', (1 - q) * fade); }
  }
  fx.draw(t);
  fxc.globalAlpha = 1;
}
// another decor drawn apart from the one on screen (the preview in the decor picker, the Windows wallpaper): the drawing code works on
// globals, so they are swapped in for the time of a call and put back (one thread: nothing else runs in between)
const SKY_STATE = ['W', 'H', 'GW', 'GH', 'perm', 'fx', 'near', 'fxCanvas', 'fxc', 'twinkles', 'shooters', 'flares'];
const skyGet = () => ({W, H, GW, GH, perm, fx, near, fxCanvas, fxc, twinkles, shooters, flares});
const skySet = o => ({W, H, GW, GH, perm, fx, near, fxCanvas, fxc, twinkles, shooters, flares} = o);
async function skyState(k, w, h) {  // w, h: in decor pixels
  await needScene(k);
  const keep = skyGet();
  try {
    W = w; H = h; GW = W + 2 * P; GH = H + 2 * P; perm = new Float32Array(1024).map(rnd); shooters = []; flares = []; twinkles = [];
    const fImg = new ImageData(GW, GH), nImg = new ImageData(GW, GH), cv = () => { const k = document.createElement('canvas'); k.width = GW; k.height = GH; return k; };
    const f = SCENES[k](fImg, nImg), far = cv(), nr = cv(), fc = cv(); far.getContext('2d').putImageData(fImg, 0, 0); nr.getContext('2d').putImageData(nImg, 0, 0);
    return {...skyGet(), fx: f, near: nr, fxCanvas: fc, fxc: fc.getContext('2d'), far, raw: RAW_SCENES.includes(k) || EVENT_SCENES.includes(k)};
  } finally { skySet(keep); }
}
// draws state st at time t into ctx, filling w x h (the screen part only, without the drift margin)
function skyPaint(st, t, ctx, w, h) {
  const keep = skyGet();
  try { skySet(st); paintFx(t); } finally { skySet(keep); }
  ctx.imageSmoothingEnabled = false; ctx.filter = st.raw ? 'none' : skyTint.f || 'none';
  for (const c of [st.far, st.fxCanvas]) ctx.drawImage(c, P, P, st.W, st.H, 0, 0, w, h);
  ctx.filter = 'none';
}
// "random" (the default): a decor drawn at each launch among the ordinary ones; the holiday ones come by themselves on their dates
function eventScene(d) {  // also used for the very first frame, above: so its dates are inside it
  const y = d.getFullYear(), A = y % 19, B = (y / 100) | 0, C = y % 100, G = ((B - ((B + 8) / 25 | 0) + 1) / 3) | 0, H = (19 * A + B - (B / 4 | 0) - G + 15) % 30,  // Easter Sunday (Gauss' algorithm)
    L = (32 + 2 * (B % 4) + 2 * (C / 4 | 0) - H - C % 4) % 7, M = ((A + 11 * H + 22 * L) / 451) | 0, n = H + L - 7 * M + 114, em = (n / 31) | 0, ed = n % 31 + 1,
    p0 = new Date(y, em - 1, ed - 3), p1 = new Date(y, em - 1, ed + 1);  // Good Friday .. Easter Monday
  const md = (d.getMonth() + 1) * 100 + d.getDate(), E = {halloween: [1024, 1101], noel: [1201, 1226], newyear: [1227, 102], paques: [(p0.getMonth() + 1) * 100 + p0.getDate(), (p1.getMonth() + 1) * 100 + p1.getDate()]};  // month*100 + day, from .. to
  return Object.keys(E).find(k => { const [a, b] = E[k]; return a <= b ? md >= a && md <= b : md >= a || md <= b; }) || '';
}
// decors drawn in their own colours: the colour themes do not recolour them
const RAW_SCENES = ['paques', 'plage', 'pluie', 'savane', 'lavande', 'automne', 'orage', 'fuji', 'synthwave', 'cristaux', 'recif', 'banquise', 'chateau', 'mars', 'marais', 'vangogh', 'galion', 'foire', 'trounoir', 'bambou', 'lilas', 'rooftops', 'jungle'];
const EVENT_SCENES = ['halloween', 'noel', 'newyear', 'paques'];
console.assert(eventScene(new Date(2026, 9, 31)) === 'halloween' && eventScene(new Date(2026, 11, 24)) === 'noel' && eventScene(new Date(2027, 0, 1)) === 'newyear' && eventScene(new Date(2026, 5, 1)) === '' && eventScene(new Date(2026, 3, 5)) === 'paques' && eventScene(new Date(2027, 2, 28)) === 'paques' && eventScene(new Date(2027, 3, 3)) === '', 'eventScene');
const randomScene = not => { const pool = Object.keys(SCENE_NAMES).filter(k => !EVENT_SCENES.includes(k) && k !== not && k !== 'image'); return pool[Math.random() * pool.length | 0]; };
let launchScene = '';
function setScene(k, reroll) {
  try { localStorage.neoScene = k; } catch {}
  if (k === 'random' && reroll) launchScene = '';  // a click on « Aléatoire » draws another one right away
  if (k === 'favs') {  // « Mes favoris » : one of them, a different one each day
    const f = (prefs.sceneFavs || []).filter(x => SCENE_NAMES[x] && x !== 'image'), day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
    k = f.length ? f[(day * 7919 + 13) % f.length] : 'random';
  }
  if (k === 'random') {  // chosen once per launch: a settings sync from the other PC must not change it
    if (!launchScene) { launchScene = (!reroll && eventScene(new Date())) || (!reroll && SCENE_NAMES[scene] && !EVENT_SCENES.includes(scene) && scene !== 'image' ? scene : randomScene(scene)); try { localStorage.neoNext = randomScene(launchScene); } catch {} }
    k = launchScene;
  }
  if (k === 'image' && !SCENES.image) return void needScene('image').then(() => setScene(k));
  if (k === 'image' && bgPicSrc !== prefs.bgImage) return void bgLoad(prefs.bgImage).then(() => { scene = k; generate(); skyTint(); });
  if (k !== scene || document.body.dataset.scene !== k) { scene = k; generate(); }  // the first draw ran before scenes2-5.js added their decors: it fell back to space
  skyTint();
}
let resizeT;
addEventListener('resize', () => { clearTimeout(resizeT); if (!document.fullscreenElement) resizeT = setTimeout(generate, 250); });  // a game going fullscreen: nothing redrawn behind it (70 ms), leaving it resizes again
// the decor is drawn as soon as it is known (one of scenes2-5.js is fetched first when needed)
if (SCENE_NAMES[scene]) generate();
requestAnimationFrame(drawSky);

