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
    pic: ['#########', '#.......#', '#.##....#', '#.##....#', '#.....#.#', '#....###.', '#...#####', '#########'],
    spark: ['....#....', '....#....', '...###...', '.#######.', '#########', '.#######.', '...###...', '....#....', '....#....'],
    ask: ['..#####..', '.##...##.', '.##...##.', '.....##..', '....##...', '....##...', '.........', '....##...', '....##...'],
    code: ['..#...#..', '.#.....#.', '#.......#', '.#.....#.', '..#...#..'],
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

  // ---------- NeoStore : les données ----------
  const [apps, icons] = await Promise.all([fetch('apps.json').then(r => r.json()), fetch('img/store/icons.json').then(r => r.json())]);

  // ---------- la langue ----------
  let lang = 'fr'; try { lang = localStorage.neoSiteLang || ((navigator.language || 'fr').startsWith('fr') ? 'fr' : 'en'); } catch {}
  const DEC_EN = { Espace: 'Space', 'Ville néon': 'Neon city', 'Forêt': 'Forest', 'Crépuscule': 'Dusk', 'Mont Fuji': 'Mount Fuji', Synthwave: 'Synthwave', Automne: 'Autumn', 'Aurore boréale': 'Northern lights', Cerisiers: 'Cherry blossoms', 'Château': 'Castle', Lanternes: 'Lanterns' };
  const FR = new Map();  // le français d'origine de chaque élément, pour y revenir
  function applyLang() {
    document.documentElement.lang = lang; $('lang').querySelector('b').textContent = lang === 'fr' ? 'EN' : 'FR';
    document.querySelectorAll('[data-t]').forEach(e => { if (!FR.has(e)) FR.set(e, e.innerHTML); e.innerHTML = (lang === 'en' && EN[e.dataset.t]) || FR.get(e); });
    document.querySelectorAll('[data-count]').forEach(e => e.textContent = apps.length);
    document.querySelectorAll('#decTabs .tab').forEach(b => b.textContent = lang === 'en' ? DEC_EN[meta[b.dataset.k].name] || meta[b.dataset.k].name : meta[b.dataset.k].name);
    $('q').placeholder = UI[lang].qPh;
    dlInfo(); news(); chips(); sysChips(); draw(); route();
  }
  $('lang').onclick = () => { lang = lang === 'fr' ? 'en' : 'fr'; try { localStorage.neoSiteLang = lang; } catch {} applyLang(); };

  // ---------- les pages : une à la fois, choisie dans la barre d'applis (l'adresse garde la page : #store…) ----------
  const VIEWS = ['accueil', 'store', 'decors', 'nouveautes', 'questions', 'createurs'];
  function route() {
    const h = location.hash.slice(1), v = VIEWS.includes(h) ? h : 'accueil';
    document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v));
    document.querySelectorAll('.dkI[data-v]').forEach(e => e.classList.toggle('on', e.dataset.v === v));
    $('where').textContent = UI[lang].where[v];
  }
  addEventListener('hashchange', () => { route(); scrollTo({ top: 0, behavior: 'instant' }); });

  // ---------- la dernière version et les notes de version, lues sur GitHub à chaque visite ----------
  let rels = null;
  function dlInfo() {
    if (!rels || !rels.length) return;
    const r = rels[0], exe = (r.assets || []).find(a => /\.exe$/i.test(a.name)), v = r.tag_name.replace(/^v/, '');
    document.querySelectorAll('.dlInfo').forEach(e => e.textContent = v + (exe ? ' · ' + Math.round(exe.size / 1048576) + ' ' + UI[lang].size : ''));
    if (exe) document.querySelectorAll('[data-dl]').forEach(a => a.href = exe.browser_download_url);  // le bouton télécharge directement l'installateur
  }
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  function news() {  // les notes de version, écrites en français dans les Releases
    if (rels === null) return;
    if (!rels.length) { $('news').innerHTML = `<p class="label">${UI[lang].newsErr}</p>`; return; }
    $('news').innerHTML = rels.slice(0, 5).map((r, i) => {
      const lines = (r.body || '').split(/\r?\n/).map(l => l.trim()).filter(l => /^[-*] /.test(l)).map(l => `<li>${md(l.slice(2))}</li>`).join('');
      const d = new Date(r.published_at).toLocaleDateString(UI[lang].date, { day: 'numeric', month: 'long', year: 'numeric' });
      return `<article class="rel px${i ? '' : ' latest'}"><h3>NeoDex ${esc(r.tag_name.replace(/^v/, ''))} <span class="label">${d}</span></h3>${lines ? `<ul>${lines}</ul>` : ''}</article>`;
    }).join('');
  }
  fetch('https://api.github.com/repos/NDesumeur/neodex-releases/releases?per_page=8', { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(l => l.filter(r => !r.draft && !r.prerelease)).catch(() => [])
    .then(l => { rels = l; dlInfo(); news(); });

  // ---------- NeoStore ----------
  const fam = c => c.startsWith('Jeux') ? 'Jeux' : c;  // les genres de jeux sont réunis sous « Jeux » dans les étiquettes
  const famLabel = c => c === 'Tout' ? UI[lang].all : c === 'Jeux' ? UI[lang].games : lang === 'en' ? (apps.find(a => a.c === c) || {}).ce || c : c;
  const cats = ['Tout', ...[...new Set(apps.map(a => fam(a.c)))].sort((a, b) => apps.filter(x => fam(x.c) === b).length - apps.filter(x => fam(x.c) === a).length)];
  const ico = c => 'img/store/' + (icons[c] || icons[fam(c)] || icons.Autre);
  const L = a => lang === 'en' ? { n: a.ne, c: a.ce, d: a.de || a.d } : { n: a.n, c: a.c, d: a.d };
  const short = d => { let t = d.split(/(?<=[.!?])\s/)[0]; if (t.length > 110) t = t.slice(0, t.lastIndexOf(' ', 107)) + '…'; return t; };
  let cat = 'Tout';
  function chips() {
    $('chips').innerHTML = cats.map(c => `<button class="chip${c === cat ? ' on' : ''}" data-c="${esc(c)}">${c === 'Tout' ? '' : `<img src="${ico(c)}" alt="">`}${esc(famLabel(c))}</button>`).join('');
  }
  $('chips').onclick = e => { const b = e.target.closest('.chip'); if (b) { cat = b.dataset.c; chips(); draw(); } };
  // le filtre par système : Windows, Android, Linux (lu dans le plugin.json de chaque appli)
  const PF = { windows: 'Windows', android: 'Android', linux: 'Linux' }; let sys = '';
  function sysChips() { $('sys').innerHTML = [['', UI[lang].sys], ...Object.entries(PF)].map(([k, l]) => `<button class="chip${k === sys ? ' on' : ''}" data-k="${k}" aria-pressed="${k === sys}">${esc(l)}</button>`).join(''); }
  $('sys').onclick = e => { const b = e.target.closest('.chip'); if (b) { sys = b.dataset.k; sysChips(); draw(); } };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function draw() {
    const q = norm($('q').value.trim());
    const list = apps.filter(a => (cat === 'Tout' || fam(a.c) === cat) && (!sys || (a.pf || []).includes(sys)) && (!q || norm([a.n, a.ne, a.c, a.ce, a.d, a.de].join(' ')).includes(q)));
    $('apps').innerHTML = list.map(a => { const t = L(a); return `<button class="app" data-s="${a.s}"><img src="img/apps/${a.s}.png" alt="" loading="lazy" width="48" height="48"><b>${esc(t.n)}</b><small>${esc(t.c)}</small><p>${esc(short(t.d))}</p></button>`; }).join('')
      || `<p class="label">${UI[lang].none}</p>`;
    $('shown').textContent = UI[lang].apps(list.length);
  }
  $('q').addEventListener('input', draw);

  // la fiche d'une appli, comme dans NeoStore : description complète, capture, autorisations et version
  function sheet(a) {
    const t = L(a), u = UI[lang];
    $('sheetBody').innerHTML = `<div class="shHead"><img src="img/apps/${a.s}.png" alt=""><div><h2>${esc(t.n)}</h2><small>${esc(t.c)}</small></div></div>`
      + (a.shot ? `<img class="shShot" src="img/shots/${a.s}.${a.shot}" alt="">` : '')
      + `<p class="shDesc">${esc(t.d)}</p><p class="label">${u.perms}</p><ul class="shPerms">`
      + a.pm.map(p => `<li><span class="risk ${p.r}">${esc(u.risk[p.r] || p.r)}</span><b>${esc(lang === 'en' ? p.le : p.l)}</b><p>${esc(lang === 'en' ? p.se : p.s)}</p></li>`).join('')
      + `</ul><div class="shMeta"><span class="count">${u.version} ${esc(a.v)}</span><span class="label">${u.runs} ${(a.pf || []).map(k => PF[k]).join(' · ')}</span><span class="label">${u.getIt}</span></div>`;
    $('sheet').showModal(); $('sheet').scrollTop = 0;
  }
  $('apps').onclick = e => { const b = e.target.closest('.app'); if (b) sheet(apps.find(a => a.s === b.dataset.s)); };
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').close(); });  // un clic à côté ferme la fiche

  applyLang();
})();
