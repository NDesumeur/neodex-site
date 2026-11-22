// Le site de NeoDex, style « Borne ». Tout le texte fixe est dans index.html (français) et i18n.js (anglais) ;
// ce fichier s'occupe de ce qui bouge : la langue, le choix de l'écran, le menu au clavier, la carte des niveaux,
// les décors, les versions lues sur GitHub, NeoStore et la fiche d'une appli.
(async () => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const ascii = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/’/g, "'").toUpperCase();   // la police d'arcade n'a pas les majuscules accentuées

  // ---------- les données : les applis, les icônes des catégories, les décors ----------
  const [apps, icons] = await Promise.all(['apps.json', 'img/store/icons.json'].map(u => fetch(u).then(r => r.json())));
  // le catalogue NeoStore tel qu'il est maintenant (refait chaque heure sur GitHub) : versions, descriptions et nouvelles applis sans republier le site.
  // apps.json reste la base (captures, autorisations, systèmes) et sert seul si GitHub ne répond pas (4 s au plus)
  try {
    const cat = await fetch('https://raw.githubusercontent.com/NDesumeur/neodex-store-catalog/main/store.json', { cache: 'no-cache', signal: AbortSignal.timeout(4000) }).then(r => r.json());
    const bySlug = new Map(apps.map(a => [a.s, a])), ceOf = new Map(apps.map(a => [a.c, a.ce]));
    for (const p of cat.plugins || []) {
      const m = /^NDesumeur\/neodex-plugin-([\w-]+)$/.exec(p.repo || ''); if (!m || !p.approved) continue;
      const fresh = { n: p.name, ne: p.en?.name || p.name, d: p.description, de: p.en?.description || '', v: p.version };
      const a = bySlug.get(m[1]);
      if (a) Object.assign(a, Object.fromEntries(Object.entries(fresh).filter(([, v]) => v)));
      else apps.push({ s: m[1], ...fresh, c: p.category || 'Autre', ce: ceOf.get(p.category) || p.category || 'Other', pm: [], shot: '', pf: ['windows'],
        ic: 'https://raw.githubusercontent.com/' + p.repo + '/HEAD/icon.png' });   // une appli toute neuve : son icône vient de son dépôt
    }
  } catch {}
  const iconOf = a => a.ic || 'img/apps/' + a.s + '.png';

  // ---------- la langue ----------
  let lang = 'fr'; try { lang = localStorage.neoSiteLang || ((navigator.language || 'fr').startsWith('fr') ? 'fr' : 'en'); } catch {}
  const FR = new Map();   // le français d'origine de chaque élément, pour y revenir
  const L = a => lang === 'en' ? { n: a.ne || a.n, c: a.ce || a.c, d: a.de || a.d } : { n: a.n, c: a.c, d: a.d };
  function applyLang() {
    document.documentElement.lang = lang; $('lang').textContent = lang === 'fr' ? 'EN' : 'FR';
    document.querySelectorAll('[data-t]').forEach(e => { if (!FR.has(e)) FR.set(e, e.innerHTML); e.innerHTML = (lang === 'en' && EN[e.dataset.t]) || FR.get(e); });
    document.querySelectorAll('[data-count]').forEach(e => e.textContent = apps.length);
    $('q').placeholder = UI[lang].qPh;
    document.querySelectorAll('.pubVid').forEach(v => { const f = 'img/neodex-demo-' + lang; if (!v.src.endsWith(f + '.mp4')) { v.poster = f + '.jpg'; v.src = f + '.mp4'; } });   // une vidéo par langue
    dlInfo(); news(); chips(); sysChips(); draw(); route(false);
  }
  $('lang').onclick = () => { lang = lang === 'fr' ? 'en' : 'fr'; try { localStorage.neoSiteLang = lang; } catch {} applyLang(); };

  // ---------- les écrans : un à la fois, selon l'adresse (#store…). Une autre ancre (#niveaux) est un endroit de l'accueil. ----------
  const VIEWS = ['accueil', 'store', 'nouveautes', 'questions', 'createurs', 'legal'];
  function route(move = true) {
    const h = location.hash.slice(1), v = VIEWS.includes(h) ? h : 'accueil';
    document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v));
    document.querySelectorAll('#nav a').forEach(e => e.classList.toggle('on', e.dataset.v === v));
    document.title = v === 'accueil' ? 'NeoDex' : 'NeoDex · ' + UI[lang].where[v];
    if (!move) return;
    const spot = !VIEWS.includes(h) && h && $(h);
    if (spot) spot.scrollIntoView(); else scrollTo({ top: 0, behavior: 'instant' });
  }
  addEventListener('hashchange', () => route());

  // ---------- le menu de l'écran de titre : flèches haut/bas pour déplacer le curseur, Entrée pour valider ----------
  const items = [...document.querySelectorAll('#menu a')]; let cur = 0;
  const pick = i => { cur = (i + items.length) % items.length; items.forEach((a, k) => a.classList.toggle('sel', k === cur)); };
  items.forEach((a, i) => a.onmouseenter = a.onfocus = () => pick(i));
  addEventListener('keydown', e => {
    // seulement sur l'accueil, en haut de page, et quand on n'est pas en train d'écrire ou de parcourir la page au clavier
    if (!$('v-accueil').classList.contains('on') || scrollY > innerHeight * .6 || e.ctrlKey || e.altKey || e.metaKey || $('sheet').open) return;
    if (e.key === 'ArrowDown') { pick(cur + 1); e.preventDefault(); } else if (e.key === 'ArrowUp') { pick(cur - 1); e.preventDefault(); }
    else if (e.key === 'Enter' && document.activeElement === document.body) items[cur].click();
  });

  // ---------- la carte des niveaux : un bouton par niveau, un seul texte montré, son image à droite ----------
  const tabs = [...$('map').children], levels = [...$('levels').children];
  function level(i) {
    tabs.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', k === i); });
    levels.forEach((a, k) => a.classList.toggle('on', k === i));
    $('lvPic').style.backgroundImage = `url(${levels[i].dataset.img})`; $('lvPic').setAttribute('aria-label', levels[i].querySelector('h3').textContent);
  }
  tabs.forEach((b, i) => { b.tabIndex = 0; b.onclick = () => level(i); b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { level(i); e.preventDefault(); } }; });
  level(0);


  // ---------- la dernière version et les notes de version, lues sur GitHub à chaque visite ----------
  let rels = null;
  function dlInfo() {
    if (!rels || !rels.length) return;
    const r = rels[0], exe = (r.assets || []).find(a => /\.exe$/i.test(a.name)), v = r.tag_name.replace(/^v/, '');
    document.querySelectorAll('.dlInfo').forEach(e => e.textContent = UI[lang].ver + ' ' + v + (exe ? ' · ' + Math.round(exe.size / 1048576) + ' ' + UI[lang].size : ''));
    if (exe) document.querySelectorAll('[data-dl]').forEach(a => a.href = exe.browser_download_url);   // le bouton télécharge directement l'installateur
    // l'appli Android et la version Linux : montrées seulement si la dernière version les contient
    document.querySelectorAll('[data-dl-os]').forEach(a => { const f = (r.assets || []).find(x => x.name.endsWith('.' + a.dataset.dlOs)); a.hidden = !f; if (f) a.href = f.browser_download_url; });
    document.querySelectorAll('.dlAlso').forEach(p => p.hidden = !p.querySelector('[data-dl-os]:not([hidden])'));
  }
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  // les notes de version : le français, puis l'anglais sous le repère <!-- en --> (les anciennes n'ont que le français)
  const part = body => (b => lang === 'en' && b[1] ? b[1] : b[0])(String(body || '').split('<!-- en -->'));
  function news() {
    if (rels === null) return;
    if (!rels.length) { $('news').innerHTML = `<p>${UI[lang].newsErr}</p>`; return; }
    $('news').innerHTML = rels.slice(0, 5).map((r, i) => {
      const lines = part(r.body).split(/\r?\n/).map(l => l.trim()).filter(l => /^[-*] /.test(l)).map(l => `<li>${md(l.slice(2))}</li>`).join('');
      const d = new Date(r.published_at).toLocaleDateString(UI[lang].date, { day: 'numeric', month: 'long', year: 'numeric' });
      return `<article class="rel frame${i ? '' : ' latest'}"><h3>NEODEX ${esc(r.tag_name.replace(/^v/, ''))}<span>${esc(ascii(d))}</span></h3>${lines ? `<ul>${lines}</ul>` : ''}</article>`;
    }).join('');
  }
  fetch('https://api.github.com/repos/NDesumeur/neodex-releases/releases?per_page=8', { headers: { Accept: 'application/vnd.github+json' } })
    .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(l => l.filter(r => !r.draft && !r.prerelease)).catch(() => [])
    .then(l => { rels = l; dlInfo(); news(); });

  // ---------- NeoStore : recherche, filtre par système, filtre par catégorie ----------
  const fam = c => c.startsWith('Jeux') ? 'Jeux' : c;   // les genres de jeux sont réunis sous « Jeux » dans les étiquettes
  const famLabel = c => c === 'Tout' ? UI[lang].all : c === 'Jeux' ? UI[lang].games : lang === 'en' ? (apps.find(a => a.c === c) || {}).ce || c : c;
  const count = c => apps.filter(x => fam(x.c) === c).length;
  const cats = ['Tout', ...[...new Set(apps.map(a => fam(a.c)))].sort((a, b) => count(b) - count(a))];
  const ico = c => 'img/store/' + (icons[c] || icons[fam(c)] || icons.Autre);
  const short = d => { let t = d.split(/(?<=[.!?])\s/)[0]; if (t.length > 110) t = t.slice(0, t.lastIndexOf(' ', 107)) + '…'; return t; };
  let cat = 'Tout';
  function chips() {
    $('chips').innerHTML = cats.map(c => `<button type="button" class="chip${c === cat ? ' on' : ''}" data-c="${esc(c)}" aria-pressed="${c === cat}">${c === 'Tout' ? '' : `<img src="${ico(c)}" alt="">`}${esc(ascii(famLabel(c)))}</button>`).join('');
  }
  $('chips').onclick = e => { const b = e.target.closest('.chip'); if (b) { cat = b.dataset.c; chips(); draw(); } };
  const PF = { windows: 'Windows', android: 'Android', linux: 'Linux' }; let sys = '';   // les systèmes où marche une appli (lus dans son plugin.json)
  function sysChips() { $('sys').innerHTML = [['', UI[lang].sys], ...Object.entries(PF)].map(([k, l]) => `<button type="button" class="chip${k === sys ? ' on' : ''}" data-k="${k}" aria-pressed="${k === sys}">${esc(ascii(l))}</button>`).join(''); }
  $('sys').onclick = e => { const b = e.target.closest('.chip'); if (b) { sys = b.dataset.k; sysChips(); draw(); } };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function draw() {
    const q = norm($('q').value.trim());
    const list = apps.filter(a => (cat === 'Tout' || fam(a.c) === cat) && (!sys || (a.pf || []).includes(sys)) && (!q || norm([a.n, a.ne, a.c, a.ce, a.d, a.de].join(' ')).includes(q)));
    $('apps').innerHTML = list.map(a => { const t = L(a); return `<button type="button" class="app" data-s="${a.s}"><img src="${esc(iconOf(a))}" alt="" loading="lazy" width="56" height="56"><b>${esc(t.n)}</b><small>${esc(ascii(t.c))}</small><p>${esc(short(t.d))}</p></button>`; }).join('')
      || `<p>${UI[lang].none}</p>`;
    $('shown').textContent = ascii(UI[lang].apps(list.length));
  }
  $('q').addEventListener('input', draw);
  $('apps').onclick = e => { const b = e.target.closest('.app'); if (b) sheet(apps.find(a => a.s === b.dataset.s)); };

  // ---------- la fiche d'une appli : description complète, capture, autorisations et version ----------
  function sheet(a) {
    const t = L(a), u = UI[lang];
    $('sheetBody').innerHTML = `<div class="shHead"><img src="${esc(iconOf(a))}" alt=""><div><h2>${esc(t.n)}</h2><small>${esc(ascii(t.c))}</small></div></div>`
      + (a.shot ? `<img class="shShot" src="img/shots/${a.s}.${a.shot}" alt="">` : '')
      + `<p class="shDesc">${esc(t.d)}</p><p class="shLabel">${esc(ascii(u.perms))}</p><ul class="shPerms">`
      + (a.pm || []).map(p => `<li><span class="risk ${esc(p.r)}">${esc(ascii(u.risk[p.r] || p.r))}</span><b>${esc(lang === 'en' ? p.le : p.l)}</b><p>${esc(lang === 'en' ? p.se : p.s)}</p></li>`).join('')
      + `</ul><div class="shMeta"><span>${esc(ascii(u.version))} ${esc(a.v)}</span><span>${esc(ascii(u.runs))} ${(a.pf || []).map(k => ascii(PF[k] || k)).join(' · ')}</span><span>${esc(ascii(u.getIt))}</span></div>`;
    $('sheet').showModal(); $('sheet').scrollTop = 0;
  }
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').close(); });   // un clic à côté ferme la fiche

  applyLang(); route();
})();
