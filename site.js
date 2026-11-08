// le site de NeoDex : les vrais décors de l'appli (exportés en images) avec leurs étoiles qui scintillent, les icônes et la boutique
(async () => {
  const $ = id => document.getElementById(id), still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // icônes en grilles de pixels ('#' = un pixel), dessinées comme les boutons de NeoDex
  const PIX = {
    down: ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'],
    reload: ['..###.#', '.#...##', '#...###', '#......', '#.....#', '.#...#.', '..###..'],
    bag: ['..###..', '.#...#.', '#######', '#.....#', '#.#.#.#', '#.....#', '#######'],
    home: ['....#....', '...###...', '..#####..', '.#######.', '#########', '.#.....#.', '.#.##..#.', '.#.##..#.', '.#######.'],
    globe: ['..#####..', '.#..#..#.', '#..#.#..#', '#########', '#.#...#.#', '#########', '#..#.#..#', '.#..#..#.', '..#####..'],
    shield: ['#########', '#.......#', '#.....#.#', '#....##.#', '##..##..#', '.####..#.', '.#.#...#.', '..#...#..', '...###...'],
    key: ['.###.....', '#...#....', '#.#.#####', '#...#.#.#', '.###..#..', '.........', '.........', '.........', '.........'].slice(0, 5),
    sync: ['...####..', '..#....#.', '.#...####', '.#....##.', '.#.....#.', '.#.....#.', '.##....#.', '####...#.', '.#....#..', '..####...'],
    phone: ['.#####.', '#.....#', '#.###.#', '#.###.#', '#.###.#', '#.###.#', '#.....#', '#..#..#', '.#####.'],
    seal: ['..#####..', '.#.....#.', '#......##', '#.....#.#', '##...#..#', '#.#.#...#', '#..#....#', '.#.....#.', '..#####..', '..#...#..', '..#...#..'],
    cmd: ['.####....', '#....#...', '#....#...', '#....#...', '#....#...', '.####....', '.....##..', '......##.', '.......##'],
    trad: ['#####....', '..#......', '..#......', '..#..###.', '.....#.#.', '....#####', '....#...#', '....#...#', '.........'],
    bell: ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '#######', '#######', '.......', '...#...'],
    mini: ['#########', '#.......#', '#.......#', '#...#####', '#...#...#', '#...#...#', '#########'],
    dock: ['###......', '#.#.####.', '###......', '.........', '###......', '#.#.###..', '###......', '.........', '###......', '#.#.#####', '###......'],
    chest: ['.#######.', '#.......#', '#########', '#...#...#', '#..###..#', '#...#...#', '#########'],
    eye: ['.........', '..#####..', '.#.....#.', '#...#...#', '#..###..#', '#...#...#', '.#.....#.', '..#####..', '.........'],
    folder: ['####.....', '#...#####', '#.......#', '#########', '#.......#', '#.......#', '#.......#', '#########'],
    stats: ['.......##', '.......##', '....##.##', '....##.##', '.##.##.##', '.##.##.##', '.##.##.##', '#########'],
    theme: ['..#####..', '.#.....#.', '#..#..#.#', '#.......#', '#.##....#', '#.##...#.', '#.....#..', '.#...#...', '..###....'],
    lock: ['..###..', '.#...#.', '.#...#.', '#######', '#######', '###.###', '###.###', '#######'],
  };
  const pixSvg = (rows, s) => { let d = ''; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') d += `M${x} ${y}h1v1H${x}z`; }));
    const w = Math.max(...rows.map(r => r.length)), h = rows.length; return `<svg viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}" shape-rendering="crispEdges" fill="currentColor"><path d="${d}"/></svg>`; };
  document.querySelectorAll('[data-pix]').forEach(e => e.innerHTML = pixSvg(PIX[e.dataset.pix], e.classList.contains('big') ? 4 : 3));


  // ---------- le décor ----------
  // Comme dans NeoDex : les couches sont dessinées à la taille de l'écran (pixels du décor agrandis sans flou), pour que la dérive
  // glisse au pixel près. Une petite image agrandie par le CSS sauterait d'un gros pixel à l'autre et saccaderait.
  const meta = await fetch('img/decors/decors.json').then(r => r.json()), keys = Object.keys(meta);
  const far = $('skyFar'), sky = $('sky'), sx = sky.getContext('2d'), fxc = document.createElement('canvas'), g = fxc.getContext('2d');
  let cur = null, farImg = null, nearImg = null, tw = [], shooters = [], token = 0;
  const load = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function place() {
    if (!cur) return;
    const { w, h, p } = cur, S = Math.max(3, Math.ceil(innerWidth / (w - 2 * p)), Math.ceil(innerHeight / (h - 2 * p)));
    const D = Math.max(1, Math.min(Math.round(S * devicePixelRatio), Math.floor(Math.sqrt(9e6 / (w * h)))));  // plafond : une couche de 9 millions de pixels au plus (téléphones)
    for (const c of [far, sky]) {
      c.width = w * D; c.height = h * D;
      Object.assign(c.style, { width: w * S + 'px', height: h * S + 'px', left: Math.round((innerWidth - w * S) / 2) + 'px', top: Math.round((innerHeight - h * S) / 2) + 'px' });
    }
    const fg = far.getContext('2d'); fg.imageSmoothingEnabled = false; fg.drawImage(farImg, 0, 0, far.width, far.height);
    sx.imageSmoothingEnabled = false; paint(performance.now());
  }
  async function setDecor(k) {
    const t = ++token, [fi, ni] = await Promise.all([load(`img/decors/${k}-far.png`), load(`img/decors/${k}-near.png`)]);
    if (t !== token || !fi || !ni) return;  // un autre décor a été choisi entre-temps
    cur = meta[k]; farImg = fi; nearImg = ni; fxc.width = cur.w; fxc.height = cur.h; shooters = [];
    tw = cur.tw.map(([x, y, ph, sp, big, gl]) => ({ x, y, ph, sp, big, g: gl.map(c => `rgb(${c})`) }));
    try { localStorage.neoSiteDecor = k; } catch {}
    place(); document.querySelectorAll('#decTabs .tab').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  }
  const fill = (x, y, c, a) => { g.globalAlpha = a; g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); };
  function glowStar(x, y, c, b, spikes) {  // la même étoile que dans NeoDex : une croix douce, un cœur blanc et des branches qui s'allongent
    fill(x + 1, y + 1, c[0], b * .7); fill(x - 1, y - 1, c[0], b * .7); fill(x + 1, y - 1, c[0], b * .7); fill(x - 1, y + 1, c[0], b * .7);
    fill(x + 1, y, c[1], b); fill(x - 1, y, c[1], b); fill(x, y + 1, c[1], b); fill(x, y - 1, c[1], b);
    for (let k = 2; k <= spikes; k++) { const a = b * (1 - k / (spikes + 1)); fill(x + k, y, c[1], a); fill(x - k, y, c[1], a); fill(x, y + k, c[1], a); fill(x, y - k, c[1], a); }
    fill(x, y, '#fff', Math.min(1, b * 1.3));
  }
  function paint(t) {
    g.globalAlpha = 1; g.clearRect(0, 0, fxc.width, fxc.height); g.drawImage(nearImg, 0, 0);
    for (const s of tw) { const b = ((Math.sin(t / 1000 * s.sp + s.ph) + 1) / 2) ** 2; if (b > .05) glowStar(s.x, s.y, s.g, b, s.big ? Math.round(b * 4) : 0); }
    if (!still && cur.shooters && Math.random() < .005) { const dir = Math.random() < .5 ? 1 : -1, sp = 1 + Math.random() * 1.4; shooters.push({ x: (.1 + Math.random() * .8) * cur.w, y: Math.random() * .4 * cur.h, vx: dir * sp, vy: sp * (.35 + Math.random() * .25), life: 0, rare: Math.random() < .15 }); }
    shooters = shooters.filter(s => s.life++ < 42);
    for (const s of shooters) {  // les étoiles filantes, avec leur traînée qui s'efface
      s.x += s.vx; s.y += s.vy; const len = 32, n = Math.hypot(s.vx, s.vy), ux = s.vx / n, uy = s.vy / n, fade = Math.min(1, (42 - s.life) / 10);
      for (let j = len; j >= 0; j--) { const q = j / len; fill(s.x - ux * j, s.y - uy * j, q < .12 ? '#fff' : s.rare ? '#7fe0ee' : '#ff8ae2', (1 - q) * fade); }
    }
    g.globalAlpha = 1; sx.clearRect(0, 0, sky.width, sky.height); sx.drawImage(fxc, 0, 0, sky.width, sky.height);
  }
  let last = 0;
  function frame(t) { requestAnimationFrame(frame); if (document.hidden || t - last < 33 || !cur) return; last = t; paint(t); }  // les étoiles à 30 images par seconde ; la dérive, elle, est une animation CSS
  $('decTabs').append(...keys.map(k => { const b = Object.assign(document.createElement('button'), { className: 'tab px', textContent: meta[k].name, onclick: () => setDecor(k) }); b.dataset.k = k; return b; }));
  $('decCount').textContent = keys.length;
  let first; try { first = localStorage.neoSiteDecor; } catch {}
  setDecor(meta[first] ? keys[(keys.indexOf(first) + 1) % keys.length] : keys[Math.random() * keys.length | 0]);  // un autre décor à chaque visite, comme au lancement de NeoDex
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(place, 200); });
  if (!still) requestAnimationFrame(frame);

  // ---------- NeoStore ----------
  const [apps, icons] = await Promise.all([fetch('apps.json').then(r => r.json()), fetch('img/store/icons.json').then(r => r.json())]);
  document.querySelectorAll('[data-count]').forEach(e => e.textContent = apps.length);
  const fam = c => c.startsWith('Jeux') ? 'Jeux' : c;  // les genres de jeux sont réunis sous « Jeux » dans les étiquettes
  const cats = ['Tout', ...[...new Set(apps.map(a => fam(a.c)))].sort((a, b) => apps.filter(x => fam(x.c) === b).length - apps.filter(x => fam(x.c) === a).length)];
  const ico = c => 'img/store/' + (icons[c] || icons[fam(c)] || icons.Autre);
  let cat = 'Tout', all = false;
  $('chips').append(...cats.map(c => { const b = document.createElement('button'); b.className = 'chip' + (c === cat ? ' on' : ''); b.dataset.c = c;
    b.innerHTML = (c === 'Tout' ? '' : `<img src="${ico(c)}" alt="">`) + c; b.onclick = () => { cat = c; draw(); }; return b; }));
  const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function draw() {
    const q = norm($('q').value.trim());
    const list = apps.filter(a => (cat === 'Tout' || fam(a.c) === cat) && (!q || norm(a.n + ' ' + a.c + ' ' + a.d).includes(q)));
    const show = all || q || cat !== 'Tout' ? list : list.slice(0, 12);
    $('apps').innerHTML = show.map(a => `<article class="app"><img src="img/apps/${a.s}.png" alt="" loading="lazy" width="48" height="48"><b>${esc(a.n)}</b><small>${esc(a.c)}</small><p>${esc(a.d)}</p></article>`).join('')
      || '<p class="label">Aucune appli ne correspond.</p>';
    $('shown').textContent = list.length + (list.length > 1 ? ' applis' : ' appli');
    $('more').hidden = show.length === list.length;
    document.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.c === cat));
  }
  $('q').addEventListener('input', draw); $('more').onclick = () => { all = true; draw(); };
  draw();
})();
