// tout le pixel art de la page : les petites icônes (dessinées case par case) et les décors animés (nuit, montagnes, village, lucioles)
(() => {
  const PAL = { k: '#120a20', w: '#ffffff', m: '#e9dcff', l: '#b58cff', p: '#7b3fe4', v: '#4b2380', y: '#ffd34d', o: '#e08a2e', g: '#5fd17a', G: '#2e8a4a',
    b: '#5ab4ff', B: '#2a6fc9', r: '#ff6b8b', n: '#8f5a33', N: '#43240f', c: '#f6e7c8' };
  const SPR = {
    home: ['.....kk.....', '....kyyk....', '...kyyyyk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kkkkkkkkkkkk', '.kmmmmmmmmk.', '.kmbbmmnnmk.', '.kmbbmmnnmk.', '.kmmmmmnnmk.', '.kmmmmmnnmk.', '.kkkkkkkkkk.'],
    globe: ['...kkkkkk...', '..kbbgbbbk..', '.kbggggbbbk.', 'kbbgggbbbbbk', 'kbbbggbbgggk', 'kbbbbbbbgggk', 'kbbbbbbbbggk', 'kbggbbbbbbbk', 'kbgggbbbbbbk', '.kbggbbbbbk.', '..kbbbbbbk..', '...kkkkkk...'],
    shield: ['.kkkkkkkkkk.', 'klllllpppppk', 'kllllllppwpk', 'klllllllwwpk', 'klwlllllwppk', 'kllwlllwwppk', '.klwwlwwppk.', '.kllwwwpppk.', '..kllwpppk..', '...klpppk...', '....kppk....', '.....kk.....'],
    key: ['............', '..kkkk......', '.kyyyyk.....', 'kyykkyyk....', 'kyk..kykkkkk', 'kyk..kyyyyyk', 'kyykkyykkyyk', '.kyyyyk.kyk.', '..kkkk..kyyk', '........kyk.', '........kkk.', '............'],
    cloud: ['............', '....kkkk....', '...kwwwwk...', '.kkwwwmmmkk.', 'kwwwwmmmmmmk', 'kwwmmmmmmmmk', 'kmmmmmmmlllk', '.kkkkkkkkkk.', '.....k......', '....kbk.....', '...kbbbk....', '....kbk.....'],
    phone: ['...kkkkkk...', '..kvvvvvvk..', '..kvbbbbvk..', '..kvbbbbvk..', '..kvbbbbvk..', '..kvbgbbvk..', '..kvbggbvk..', '..kvbbbbvk..', '..kvvvvvvk..', '..kvvmmvvk..', '..kvvvvvvk..', '...kkkkkk...'],
    note: ['....kkkkkkkk', '....kllllllk', '....kpkkkkpk', '....kpk..kpk', '....kpk..kpk', '....kpk..kpk', '.kkkkpk.kkpk', 'kppppk.kpppk', 'kppppk.kpppk', '.kkkk...kkk.', '............', '............'],
    pad: ['............', '............', '.kkkkkkkkkk.', 'kvvvvvvvvvvk', 'kvkvvvvvvrvk', 'kkkkvvvvrvgk', 'kvkvvvvvvbvk', 'kvvvvvvvvvvk', 'kvvvkkkkvvvk', '.kkk....kkk.', '............', '............'],
    bag: ['....kkkk....', '...kk..kk...', '...k....k...', '.kkkkkkkkkk.', '.kppppppppk.', '.kplppppppk.', '.kppkyykppk.', '.kppkyykppk.', '.kppppppppk.', '.kvvvvvvvvk.', '.kkkkkkkkkk.', '............'],
    cal: ['..k....k....', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.kkkkkkkkkk.', '.kmmmmmmmmk.', '.kmkmkmkmmk.', '.kmmmmmmmmk.', '.kmkmkmrrmk.', '.kmmmmmrrmk.', '.kmkmkmmmmk.', '.kkkkkkkkkk.', '............'],
    egg: ['.k........k.', '.kpk....kpk.', '..kpkkkkpk..', '..kvvvvvvk..', '.kvvvvvvvvk.', '.kvwwvvwwvk.', '.kvwkvvwkvk.', '.kvvvvvvvvk.', '.kvvvvvvvvk.', '..kvvvvvvk..', '...kkkkkk...', '............'],
    sword: ['..........kk', '.........kmk', '........kmk.', '.......kmk..', '......kmk...', '..k..kmk....', '..kkkmk.....', '...kyk......', '..kyykk.....', '.kyk..k.....', 'kkk.........', '............'],
    brush: ['.........kk.', '........kmmk', '.......kmmk.', '......kmmk..', '.....knnk...', '....knnk....', '...kook.....', '..kppk......', '.kpppk......', '.kppk.......', 'kkkk........', '............'],
    doc: ['.kkkkkkk....', '.kmmmmmkk...', '.kmmmmmkmk..', '.kmkkkmkkkk.', '.kmmmmmmmmk.', '.kmkkkkkkmk.', '.kmmmmmmmmk.', '.kmkkkkkkmk.', '.kmmmmmmmmk.', '.kmkkkkmmmk.', '.kmmmmmmmmk.', '.kkkkkkkkkk.'],
    fish: ['............', '.....kkkk...', 'k...kbbbbk..', 'kk.kbbbbbbk.', 'kbkbbbbbkbbk', 'kbbbbbbbbbbk', 'kbkbbbbbbbk.', 'kk.kBBBBBk..', 'k...kkkkk...', '............'],
    tool: ['.....kk.....', '..kk.kk.kk..', '..kllkkllk..', '...kllllk...', '.kkllkkllkk.', '.kllk..kllk.', '.kllk..kllk.', '.kkllkkllkk.', '...kllllk...', '..kllkkllk..', '..kk.kk.kk..', '.....kk.....'],
    seal: ['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', '.kyyyyyykyk.', '.kykyyykyyk.', '.kyykykyyyk.', '..kyykyyyk..', '...kkkkkk...', '...krk.krk..', '...krk.krk..', '...kk...kk..', '............'],
    lock: ['....kkkk....', '...kmmmmk...', '..kmk..kmk..', '..kmk..kmk..', '.kkkkkkkkkk.', '.kyyyyyyyyk.', '.kyyyykyyyk.', '.kyyykkkyyk.', '.kyyyykyyyk.', '.kook ooook.'.replace(' ', 'o'), '.kkkkkkkkkk.', '............'],
    up: ['.....kk.....', '....kggk....', '...kggggk...', '..kggggggk..', '.kkkkggkkkk.', '....kggk....', '....kggk....', '....kggk....', '....kGGk....', '....kkkk....', '.kkkkkkkkkk.', '.kmmmmmmmmk.'],
    dl: ['....NNNN....', '....NNNN....', '....NNNN....', '....NNNN....', '.NNNNNNNNNN.', '..NNNNNNNN..', '...NNNNNN...', '....NNNN....', '.....NN.....', '............', 'NNNNNNNNNNNN', 'NNNNNNNNNNNN'],
    cat: ['..k..k..........', '.kok.kok........', '.kooooook.......', '.kkokkoko.......', 'koooooookkkkkk..', 'kooooooooooooook', 'kooccooooooooook', 'koooooooooooook.', '.kkkkkkkkkkkkk..'],
  };
  const urls = {};
  const sprite = name => {
    if (urls[name]) return urls[name];
    const rows = SPR[name], w = Math.max(...rows.map(r => r.length)), c = document.createElement('canvas');
    c.width = w; c.height = rows.length; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
    return urls[name] = c.toDataURL();
  };
  document.querySelectorAll('.spr').forEach(e => e.style.backgroundImage = `url(${sprite(e.dataset.s)})`);
  const cat = document.querySelector('.counter .cat');
  if (cat) { cat.style.background = `url(${sprite('cat')}) 0 0 / 100% 100%`; cat.style.imageRendering = 'pixelated'; }

  // un hasard qui se répète : le même décor à chaque visite
  const rnd = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const hash = n => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scene(cv, seed) {
    let H = 180;
    const g = cv.getContext('2d');
    let W = 0, sky = null, stars = [], clouds = [], flies = [], shoot = null, t = 0, visible = true, last = 0;
    const SKY = ['#07040f', '#0d0719', '#140a24', '#1d1033', '#2c1650', '#40206e', '#5b2a8c', '#8a3f9c', '#c4609a'];
    // la forme des montagnes : des sinus mélangés, assez irréguliers pour ne pas se voir
    const ridge = (x, f, a, ph) => a * (Math.sin(x * f + ph) * .5 + Math.sin(x * f * 2.3 + ph * 1.7) * .3 + Math.sin(x * f * 5.1 + ph * .3) * .2);

    function build() {
      const r = cv.getBoundingClientRect(); H = Math.max(60, Math.round(r.height / 3)); W = Math.max(60, Math.ceil(r.width / 3));  // un pixel du décor = 3 pixels de l'écran, sur PC comme sur téléphone
      cv.width = W; cv.height = H; g.imageSmoothingEnabled = false;
      const R = rnd(seed), off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d'), img = o.createImageData(W, H), d = img.data;
      const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), cols = SKY.map(hex);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {  // le ciel en bandes, tramées entre elles comme sur les vieilles consoles
        const tt = Math.min(.999, y / (H * .82)) * (cols.length - 1), i = Math.floor(tt), f = tt - i;
        const c = cols[f * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? Math.min(i + 1, cols.length - 1) : i], k = (y * W + x) * 4;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
      }
      o.putImageData(img, 0, 0);
      // la lune : un halo tramé, des cratères et un côté dans l'ombre
      const mx = Math.round(W * .8), my = Math.round(H * .2), mr = Math.max(6, Math.round(H * .075));
      for (let y = -mr - 7; y <= mr + 7; y++) for (let x = -mr - 7; x <= mr + 7; x++) {
        const dd = Math.hypot(x, y);
        if (dd <= mr) {
          const crater = [[-.35, -.2, .28], [.3, .3, .2], [.15, -.45, .13], [-.2, .45, .12]].some(([cx, cy, cr]) => Math.hypot(x / mr - cx, y / mr - cy) < cr);
          o.fillStyle = Math.hypot(x + mr * .45, y - mr * .1) > mr * 1.05 ? '#a993d6' : crater ? '#cdbcf0' : '#f6efff'; o.fillRect(mx + x, my + y, 1, 1);
        } else if (dd <= mr + 7 && ((x + y) & 1) === 0 && (dd < mr + 3 || ((x * 7 + y * 3) & 3) === 0)) { o.fillStyle = 'rgba(233,220,255,.18)'; o.fillRect(mx + x, my + y, 1, 1); }
      }
      sky = off;
      stars = Array.from({ length: Math.round(W * H / 260) }, () => ({ x: R() * W | 0, y: R() * H * .62 | 0, p: R() * 7, s: R() < .08 ? 2 : 1, c: R() < .2 ? '#ffe9a8' : '#ffffff' }))
        .filter(s => Math.hypot(s.x - mx, s.y - my) > mr + 8);
      clouds = Array.from({ length: Math.max(2, W / 90 | 0) }, () => ({ x: R() * W, y: H * (.12 + R() * .3), w: 14 + R() * 26 | 0, v: .02 + R() * .04 }));
      flies = Array.from({ length: Math.max(6, W / 22 | 0) }, () => ({ x: R() * W, y: H * (.78 + R() * .17), p: R() * 9, v: .2 + R() * .5 }));
    }

    function cloud(c) {
      const x = Math.round(c.x), y = Math.round(c.y), w = c.w;
      g.fillStyle = 'rgba(181,140,255,.22)'; g.fillRect(x, y, w, 3); g.fillRect(x + 3, y - 2, w - 8, 2); g.fillRect(x + 6, y - 4, w * .4 | 0, 2);
      g.fillStyle = 'rgba(233,220,255,.18)'; g.fillRect(x + 4, y - 3, w * .35 | 0, 1);
    }
    function pine(x, base, h, dark) {
      g.fillStyle = dark; for (let i = 0; i < h; i++) { const w = 1 + Math.floor((i / h) * h * .45); g.fillRect(x - w, base - h + i, w * 2 + 1, 1); }
      g.fillStyle = '#0a0512'; g.fillRect(x, base, 1, 2);
    }
    function house(x, base) {  // une petite maison aux fenêtres allumées, avec sa fumée
      g.fillStyle = '#160b26'; g.fillRect(x, base - 10, 16, 10);
      for (let i = 0; i < 6; i++) g.fillRect(x - 1 + i, base - 10 - i, 18 - i * 2, 1);
      g.fillRect(x + 11, base - 17, 3, 5);
      const on = (Math.sin(t * .02 + x) > -.8);
      g.fillStyle = on ? '#ffd34d' : '#6b4a1a'; g.fillRect(x + 3, base - 7, 3, 3); g.fillRect(x + 10, base - 7, 3, 3);
      g.fillStyle = 'rgba(255,211,77,.15)'; g.fillRect(x + 2, base - 8, 5, 5); g.fillRect(x + 9, base - 8, 5, 5);
      g.fillStyle = 'rgba(233,220,255,.25)';
      for (let i = 0; i < 4; i++) { const k = (t * .15 + i * 5) % 20; g.fillRect(x + 12 + Math.round(Math.sin(k * .4 + i) * 2 + k * .3), base - 19 - k | 0, 2, 1); }
    }

    function draw() {
      g.drawImage(sky, 0, 0);
      for (const s of stars) {
        const b = Math.sin(t * .05 + s.p * 3); if (b < -.6) continue;
        g.globalAlpha = .45 + .55 * Math.max(0, b); g.fillStyle = s.c; g.fillRect(s.x, s.y, 1, 1);
        if (s.s === 2 && b > .5) { g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); }
      }
      g.globalAlpha = 1;
      if (!shoot && Math.random() < .006) shoot = { x: Math.random() * W * .7, y: Math.random() * H * .3, l: 0 };
      if (shoot) {  // une étoile filante
        shoot.l += 1;
        for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(255,255,255,${(1 - i / 10) * .9})`; g.fillRect(Math.round(shoot.x + shoot.l * 2.4 - i * 2), Math.round(shoot.y + shoot.l * 1.2 - i), 1, 1); }
        if (shoot.l > 30) shoot = null;
      }
      for (const c of clouds) { c.x += c.v; if (c.x > W + 10) c.x = -c.w - 10; cloud(c); }
      const layers = [
        { base: H * .62, a: H * .16, f: .021, ph: 1.3, sp: .03, col: '#2a1550', cap: '#9c7ad8' },
        { base: H * .74, a: H * .12, f: .034, ph: 4.1, sp: .07, col: '#1d0f38' },
        { base: H * .86, a: H * .06, f: .05, ph: 2.2, sp: .16, col: '#130a24', trees: true },
      ];
      for (const L of layers) {
        const off = t * L.sp;
        for (let x = 0; x < W; x++) {
          const wx = x + off, top = Math.round(L.base - ridge(wx, L.f, L.a, L.ph));
          g.fillStyle = L.col; g.fillRect(x, top, 1, H - top);
          if (L.cap && top < L.base - L.a * .45) { g.fillStyle = L.cap; g.fillRect(x, top, 1, Math.max(1, Math.round((L.base - L.a * .45 - top) * .5))); }
        }
        if (L.trees) {
          const first = Math.floor(off / 7) - 2;
          for (let c = first; c < first + W / 7 + 4; c++) {
            const h = hash(c * 31 + seed), x = Math.round(c * 7 - off);
            const ground = Math.round(L.base - ridge(c * 7, L.f, L.a, L.ph));
            if (c % 41 === 0) house(x - 8, ground + 1);
            else if (h < .55) pine(x, ground + 1, 6 + Math.round(h * 14), h < .25 ? '#0c0618' : '#100a1f');
          }
        }
      }
      for (const f of flies) {  // les lucioles
        f.p += .05; f.x += Math.sin(f.p) * f.v * .4 + .05; f.y += Math.cos(f.p * .7) * .15; if (f.x > W + 2) f.x = -2;
        const on = Math.sin(f.p * 2.3) > 0; if (!on) continue;
        g.fillStyle = 'rgba(255,211,77,.25)'; g.fillRect(Math.round(f.x) - 1, Math.round(f.y), 3, 1); g.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 3);
        g.fillStyle = '#fff3a0'; g.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      }
    }

    function loop(now) {
      if (visible && !document.hidden && now - last > 50) { last = now; t++; draw(); }  // 20 images par seconde, comme une vieille console
      requestAnimationFrame(loop);
    }
    build(); draw();
    addEventListener('resize', () => { build(); draw(); });
    new IntersectionObserver(e => visible = e[0].isIntersecting).observe(cv);
    if (!still) requestAnimationFrame(loop);
  }

  const hero = document.getElementById('scene'), mini = document.getElementById('mini');
  if (hero) scene(hero, 7);
  if (mini) scene(mini, 23);
})();
