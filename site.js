// Le site de NeoDex, style « Borne ». Tout le texte fixe est dans index.html (français) et i18n.js (anglais) ;
// ce fichier s'occupe de ce qui bouge : la langue, le choix de l'écran, le menu au clavier, la carte des niveaux,
// l'inventaire, les thèmes, les décors, les versions lues sur GitHub, NeoStore et la fiche d'une appli.
(async () => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const ascii = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/’/g, "'").toUpperCase();   // la police d'arcade n'a pas les majuscules accentuées
  const HIDE = ['bestiaire', 'cartes', 'catacombes'];   // pas mis en avant sur l'accueil (ils restent dans NeoStore)

  // ---------- les données : les applis, les icônes des catégories, les décors ----------
  const [apps, icons, decors] = await Promise.all(['apps.json', 'img/store/icons.json', 'img/decors/decors.json'].map(u => fetch(u).then(r => r.json())));

  // ---------- la langue ----------
  let lang = 'fr'; try { lang = localStorage.neoSiteLang || ((navigator.language || 'fr').startsWith('fr') ? 'fr' : 'en'); } catch {}
  const FR = new Map();   // le français d'origine de chaque élément, pour y revenir
  const L = a => lang === 'en' ? { n: a.ne || a.n, c: a.ce || a.c, d: a.de || a.d } : { n: a.n, c: a.c, d: a.d };
  function applyLang() {
    document.documentElement.lang = lang; $('lang').textContent = lang === 'fr' ? 'EN' : 'FR';
    document.querySelectorAll('[data-t]').forEach(e => { if (!FR.has(e)) FR.set(e, e.innerHTML); e.innerHTML = (lang === 'en' && EN[e.dataset.t]) || FR.get(e); });
    document.querySelectorAll('[data-count]').forEach(e => e.textContent = apps.length);
    $('q').placeholder = UI[lang].qPh;
    dlInfo(); news(); chips(); sysChips(); draw(); themes(); stages(); invTell(invCur); route(false);
  }
  $('lang').onclick = () => { lang = lang === 'fr' ? 'en' : 'fr'; try { localStorage.neoSiteLang = lang; } catch {} applyLang(); };

  // ---------- les écrans : un à la fois, selon l'adresse (#store…). Une autre ancre (#niveaux, #scores) est un endroit de l'accueil. ----------
  const VIEWS = ['accueil', 'store', 'decors', 'nouveautes', 'questions', 'createurs', 'legal'];
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

  // ---------- l'inventaire de l'accueil : une case par appli ; la boîte du dessous décrit celle qu'on survole ; un clic ouvre sa fiche ----------
  let invCur = null;
  function invTell(a) {   // textContent partout : rien de ce qui vient des données n'est lu comme du HTML
    invCur = a; if (!a) return;
    const t = L(a); $('tkImg').src = `img/apps/${a.s}.png`; $('tkName').textContent = t.n; $('tkCat').textContent = ascii(t.c); $('tkText').textContent = t.d;
  }
  for (const a of apps.filter(a => !HIDE.includes(a.s)).slice(0, 84)) {
    const b = document.createElement('button'); b.type = 'button'; b.tabIndex = 0; b.title = a.n; b.setAttribute('aria-label', a.n);
    b.innerHTML = `<img src="img/apps/${a.s}.png" alt="" loading="lazy" width="48" height="48">`;
    b.onmouseenter = b.onfocus = () => { $('inv').querySelector('.on')?.classList.remove('on'); b.classList.add('on'); invTell(a); };
    b.onclick = () => sheet(a); b.onkeydown = e => { if (e.key === 'Enter') sheet(a); };
    $('inv').append(b);
  }

  // ---------- les 25 thèmes de NeoDex (NeoDyme/web/interface.js, table PAL) : nom, nom anglais, couleur, description, description anglaise ----------
  const THEMES = [
    ['Classique', 'Classic', '#e01ec8', 'Le violet et le rose du logo : le NeoDex d’origine.', 'The purple and pink of the logo: the original NeoDex.'],
    ['Terminal', 'Terminal', '#33ff66', 'Écran à phosphore vert : une seule police de console, du texte qui luit.', 'A green phosphor screen: one console font, glowing text.'],
    ['Console de poche', 'Handheld', '#9bbc0f', 'Les verts d’un écran de console portable, de gros pixels et une trame de points.', 'The greens of a handheld console screen, big pixels and a dot grid.'],
    ['Synthwave', 'Synthwave', '#ff3fa4', 'Coucher de soleil rétro : dégradés rose et orange, titres chromés.', 'A retro sunset: pink and orange gradients, chrome titles.'],
    ['Grimoire', 'Spellbook', '#e0a940', 'Les boîtes de dialogue d’un jeu de rôle : double cadre doré sur parchemin sombre.', 'Role-playing game dialogue boxes: a double gold frame on dark parchment.'],
    ['Verre dépoli', 'Frosted glass', '#7aa8ff', 'Moderne : panneaux translucides et flous, coins arrondis.', 'Modern: blurred see-through panels, rounded corners.'],
    ['Plan d’architecte', 'Blueprint', '#cfe6ff', 'Papier bleu quadrillé, traits fins en pointillés, tout en capitales.', 'Blue grid paper, thin dotted lines, all in capitals.'],
    ['Manga', 'Manga', '#ffffff', 'Noir et blanc, traits épais, ombres franches et trame de points.', 'Black and white, thick lines, hard shadows and dot shading.'],
    ['Sakura', 'Sakura', '#ff9ec7', 'Pastel doux, rose et vert tendre, coins ronds.', 'Soft pastel, pink and light green, round corners.'],
    ['Abysses', 'Abyss', '#21d4fd', 'Fond marin : bleus profonds et lueurs bioluminescentes.', 'The sea floor: deep blues and glowing sea life.'],
    ['Cyberpunk', 'Cyberpunk', '#fcee0a', 'Néon jaune et cyan sur béton nocturne : coins coupés, bandes de danger.', 'Yellow and cyan neon on night concrete: cut corners, hazard stripes.'],
    ['Forêt enchantée', 'Enchanted forest', '#b6e36b', 'Mousse et bois : cadres en bois, lueurs de lucioles.', 'Moss and wood: wooden frames, firefly lights.'],
    ['Borne d’arcade', 'Arcade cabinet', '#ff3b30', 'Une salle d’arcade : rouge, jaune et bleu francs, gros contours noirs.', 'An arcade hall: bold red, yellow and blue, thick black outlines.'],
    ['Tableau noir', 'Blackboard', '#f4f1e8', 'Un vrai tableau noir d’école : traits à la craie, cadre en bois.', 'A real school blackboard: chalk lines, a wooden frame.'],
    ['Vaporwave 95', 'Vaporwave 95', '#ff71ce', 'Un vieux bureau d’ordinateur en pastel : fenêtres en relief.', 'An old computer desktop in pastel: raised windows.'],
    ['Volcan', 'Volcano', '#ff5a1f', 'Obsidienne et lave : cadres qui rougeoient, titre en fusion.', 'Obsidian and lava: glowing frames, a molten title.'],
    ['Givre', 'Frost', '#bdf2ff', 'Tout est gelé : panneaux de glace, givre dans les coins.', 'Everything is frozen: ice panels, frost in the corners.'],
    ['Vieux film', 'Old film', '#e8c48a', 'Une pellicule des années 20 : sépia, rayures et grain.', 'A 1920s film reel: sepia, scratches and grain.'],
    ['Hologramme', 'Hologram', '#f7a8ff', 'Des reflets irisés qui changent de couleur.', 'Shimmering reflections that change colour.'],
    ['Cockpit', 'Cockpit', '#3ff5ff', 'L’affichage tête haute d’un vaisseau : lignes fines cyan, alertes orange.', 'A spaceship head-up display: thin cyan lines, orange alerts.'],
    ['Jardin fleuri', 'Flower garden', '#7ed957', 'Une prairie au bas de l’écran, des lianes le long des barres.', 'A meadow at the bottom of the screen, vines along the bars.'],
    ['Neige', 'Snow', '#cfe8ff', 'Un soir d’hiver : la neige tombe et s’entasse sur les panneaux.', 'A winter evening: snow falls and piles up on the panels.'],
    ['Aurore boréale', 'Northern lights', '#5cffb0', 'Une nuit polaire : des voiles verts et violets dans le ciel.', 'A polar night: green and purple veils in the sky.'],
    ['Steampunk', 'Steampunk', '#d9a441', 'Laiton, cuivre et rivets : des engrenages aux coins des panneaux.', 'Brass, copper and rivets: gears at the panel corners.'],
    ['Bonbons', 'Candy', '#ff7eb6', 'Une confiserie : rayures de sucre d’orge, couleurs acidulées.', 'A sweet shop: candy cane stripes, tangy colours.']];
  let thCur = 0;
  function thShow(i) {   // le thème choisi : son bouton allumé, son nom et sa description dessous
    thCur = i; const e = lang === 'en';
    [...$('pal').children].forEach((b, k) => b.classList.toggle('on', k === i));
    $('thName').textContent = THEMES[i][e ? 1 : 0]; $('thName').style.color = THEMES[i][2]; $('thText').textContent = THEMES[i][e ? 4 : 3];
  }
  function themes() {
    $('pal').innerHTML = THEMES.map(([n, ne, a], i) => `<button type="button" style="--a:${a}" data-i="${i}">${esc(ascii(lang === 'en' ? ne : n))}</button>`).join('');
    thShow(thCur);
  }
  $('pal').onclick = $('pal').onmouseover = $('pal').onfocusin = e => { const b = e.target.closest('button'); if (b && +b.dataset.i !== thCur) thShow(+b.dataset.i); };

  // ---------- les décors : les vrais décors de NeoDex (deux calques : loin, près), un grand écran et une vignette par décor ----------
  const DEC_EN = { Espace: 'Space', 'Ville néon': 'Neon city', 'Forêt': 'Forest', 'Crépuscule': 'Dusk', 'Mont Fuji': 'Mount Fuji', Automne: 'Autumn', 'Aurore boréale': 'Northern lights', Cerisiers: 'Cherry blossoms', 'Château': 'Castle',
    'Nuit étoilée': 'Starry night', Lanternes: 'Lanterns', Bambouseraie: 'Bamboo grove', Galion: 'Galleon', Banquise: 'Ice floe', Marais: 'Marsh', 'Récif de corail': 'Coral reef', Cristaux: 'Crystals', Lilas: 'Lilacs' };
  const dKeys = Object.keys(decors), dName = k => lang === 'en' ? DEC_EN[decors[k].name] || decors[k].name : decors[k].name;
  let dCur = dKeys[0]; try { if (decors[localStorage.neoSiteDecor]) dCur = localStorage.neoSiteDecor; } catch {}
  function stages() {
    $('decTabs').innerHTML = dKeys.map(k => `<button type="button" data-k="${k}" class="${k === dCur ? 'on' : ''}"><span style="background-image:url(img/decors/${k}-near.png),url(img/decors/${k}-far.png)"></span>${esc(ascii(dName(k)))}</button>`).join('');
    $('stFar').style.backgroundImage = `url(img/decors/${dCur}-far.png)`; $('stNear').style.backgroundImage = `url(img/decors/${dCur}-near.png)`; $('stName').textContent = ascii(dName(dCur));
    $('decCount').textContent = $('decCount2').textContent = dKeys.length;
  }
  $('decTabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; dCur = b.dataset.k; try { localStorage.neoSiteDecor = dCur; } catch {} stages(); };

  // ---------- la dernière version et les notes de version, lues sur GitHub à chaque visite ----------
  let rels = null;
  function dlInfo() {
    if (!rels || !rels.length) return;
    const r = rels[0], exe = (r.assets || []).find(a => /\.exe$/i.test(a.name)), v = r.tag_name.replace(/^v/, '');
    document.querySelectorAll('.dlInfo').forEach(e => e.textContent = UI[lang].ver + ' ' + v + (exe ? ' · ' + Math.round(exe.size / 1048576) + ' ' + UI[lang].size : ''));
    if (exe) document.querySelectorAll('[data-dl]').forEach(a => a.href = exe.browser_download_url);   // le bouton télécharge directement l'installateur
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
    $('apps').innerHTML = list.map(a => { const t = L(a); return `<button type="button" class="app" data-s="${a.s}"><img src="img/apps/${a.s}.png" alt="" loading="lazy" width="56" height="56"><b>${esc(t.n)}</b><small>${esc(ascii(t.c))}</small><p>${esc(short(t.d))}</p></button>`; }).join('')
      || `<p>${UI[lang].none}</p>`;
    $('shown').textContent = ascii(UI[lang].apps(list.length));
  }
  $('q').addEventListener('input', draw);
  $('apps').onclick = e => { const b = e.target.closest('.app'); if (b) sheet(apps.find(a => a.s === b.dataset.s)); };

  // ---------- la fiche d'une appli : description complète, capture, autorisations et version ----------
  function sheet(a) {
    const t = L(a), u = UI[lang];
    $('sheetBody').innerHTML = `<div class="shHead"><img src="img/apps/${a.s}.png" alt=""><div><h2>${esc(t.n)}</h2><small>${esc(ascii(t.c))}</small></div></div>`
      + (a.shot ? `<img class="shShot" src="img/shots/${a.s}.${a.shot}" alt="">` : '')
      + `<p class="shDesc">${esc(t.d)}</p><p class="shLabel">${esc(ascii(u.perms))}</p><ul class="shPerms">`
      + (a.pm || []).map(p => `<li><span class="risk ${esc(p.r)}">${esc(ascii(u.risk[p.r] || p.r))}</span><b>${esc(lang === 'en' ? p.le : p.l)}</b><p>${esc(lang === 'en' ? p.se : p.s)}</p></li>`).join('')
      + `</ul><div class="shMeta"><span>${esc(ascii(u.version))} ${esc(a.v)}</span><span>${esc(ascii(u.runs))} ${(a.pf || []).map(k => ascii(PF[k] || k)).join(' · ')}</span><span>${esc(ascii(u.getIt))}</span></div>`;
    $('sheet').showModal(); $('sheet').scrollTop = 0;
  }
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) $('sheet').close(); });   // un clic à côté ferme la fiche

  applyLang(); route();
})();
