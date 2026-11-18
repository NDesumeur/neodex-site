/* ---------- NeoStore : le décor en pixel art dessiné à la main — la devanture en bandeau, les cadres des cartes, l'auvent de « À la une » et une icône par catégorie ---------- */
const NSA_K = '#05010b';
const nsaCanvas = (w, h, s, draw) => { const c = document.createElement('canvas'); c.width = w * s; c.height = h * s; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(s, s); draw(g); return c; };
const nsaRect = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const nsaPut = (g, rows, x, y, pal) => rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = r[i] === 'k' ? pal.k || NSA_K : pal[r[i]]; if (c) nsaRect(g, c, x + i, y + j); } });
const nsaHash = n => (Math.imul(n | 0, 2654435761) >>> 0) / 4294967296;

// une icône par catégorie, 9 × 9
const NSA_ICONS = {
  '': [['kkkk.kkkk', 'kaak.kbbk', 'kaak.kbbk', 'kkkk.kkkk', '.........', 'kkkk.kkkk', 'kcck.kwwk', 'kcck.kwwk', 'kkkk.kkkk'], {a: '#ff4fa8', b: '#3fe0ff', c: '#ffd86b', w: '#9a6ac0'}],
  Jeux: [['.........', '.kkkkkkk.', 'kaaaaaaak', 'kawaaacak', 'kwwwaaack', 'kawaaaaak', 'kaakkkaak', '.kkk.kkk.', '.........'], {a: '#8a7ab0', w: '#ffffff', c: '#ff4a5a'}],
  'Jeux · Réflexion': [['..kkk....', '.kaaak...', '.kaaakkk.', 'kkaaaaaak', 'kaaaaaaak', 'kkaaaawak', '.kaaaaaak', '.kkkkkkkk', '.........'], {a: '#ffd84a', w: '#ffffff'}],
  'Jeux · Mots': [['kkkkkkkkk', 'kwwwkwwwk', 'kwkwkwkwk', 'kwwwkwwkk', 'kwkwkwkwk', 'kwkwkwwwk', 'kkkkkkkkk', '.........', '.........'], {w: '#ffffff'}],
  'Jeux · Cartes et plateau': [['.kkkkk...', '.kwwwkkk.', '.kwrwkwk.', '.kwrrkwk.', '.kwrwkwk.', '.kwwwkwk.', '.kkkkkwk.', '...kwwwk.', '...kkkkk.'], {w: '#ffffff', r: '#ff4a5a'}],
  'Jeux · Arcade': [['...krk...', '...krk...', '....k....', '....k....', '.kkkkkkk.', 'kaaaaaaak', 'kaykaaaak', 'kaaaaaaak', '.kkkkkkk.'], {a: '#8a7ab0', r: '#ff4a5a', y: '#ffd84a'}],
  'Jeux · Stratégie et gestion': [['k.k.k.k.k', 'kkkkkkkkk', '.kaaaaak.', '.kaakaak.', '.kaaaaak.', '.kaakaak.', '.kaakaak.', 'kkkkkkkkk', '.........'], {a: '#c8b8a0'}],
  'Jeux · Rythme': [['..kkkkkkk', '..kaaaaak', '..kakkkak', '..kak.kak', '..kak.kak', 'kkkak.kak', 'kaaakkaak', 'kaaak.kkk', '.kkk.....'], {a: '#ff4fa8'}],
  'Jeux · Aventure': [['.......kk', '......kwk', '.....kwk.', 'k...kwk..', 'kk.kwk...', '.kkwk....', '.kak.....', 'kak.k....', 'kk.......'], {w: '#e8e0ff', a: '#c08a40'}],
  'Jeux · Devinettes': [['..kkkkk..', '.kaaaaak.', '.kakkkak.', '..k..kak.', '....kaak.', '...kaak..', '...kkkk..', '...kaak..', '...kkkk..'], {a: '#3fe0ff'}],
  'Jeux · Infos': [['kkkkkkk..', 'kwwwwwkk.', 'kwkkkwkwk', 'kwwwwwkwk', 'kwkkkwkwk', 'kwwwwwkwk', 'kwkkkwkwk', 'kkkkkkkkk', '.........'], {w: '#ffffff'}],
  'Utilitaires': [['.kk...kk.', 'kaak.kaak', 'kaaakaaak', '.kaaaaak.', '..kaaak..', '..kaaak..', '..kaaak..', '..kaaak..', '..kkkkk..'], {a: '#c8c8d8'}],
  'Écriture et langues': [['......kkk', '.....kaak', '....kaak.', '...kaak..', '..kaak...', '.kwak....', '.kwk.....', 'kkk......', '.........'], {a: '#ffd84a', w: '#ffffff'}],
  Musique: [['...kkkkk.', '...kaaaak', '...kakkak', '...kak.kk', '...kak...', '.kkkak...', 'kaaaak...', 'kaaaak...', '.kkkk....'], {a: '#3fe0ff'}],
  'Système': [['.k.kkk.k.', 'kakbbbkak', '.kbbbbbk.', 'kbbbkbbbk', 'kbbk.kbbk', 'kbbbkbbbk', '.kbbbbbk.', 'kakbbbkak', '.k.kkk.k.'], {a: '#7a7090', b: '#b8b0d0'}],
  Outils: [['....kk.kk', '....kakak', '....kaaak', '...kaaak.', '..kaak...', '.kaak....', 'kaak.....', 'kak......', 'kk.......'], {a: '#c0c8d8'}],
  Sport: [['..kkkkk..', '.kaakaak.', 'kaaakaaak', 'kaaakaaak', 'kkkkkkkkk', 'kaaakaaak', 'kaaakaaak', '.kaakaak.', '..kkkkk..'], {a: '#ff8a3d'}],
  Internet: [['..kkkkk..', '.kabbaak.', 'kabbbaaak', 'kaabaabbk', 'kaaaaabbk', 'kabaaaabk', 'kabbaaaak', '.kabbaak.', '..kkkkk..'], {a: '#3f8aff', b: '#5fbf6a'}],
  Anime: [['....k....', '...kak...', 'kkkkakkkk', 'kaaaaaaak', '.kaaaaak.', '..kaaak..', '.kaakaak.', '.kak.kak.', '.kk...kk.'], {a: '#ffd86b'}],
  'Communauté': [['.kkk.kkk.', 'kaaakaaak', 'kaaakaaak', '.kkk.kkk.', 'kbbbkccck', 'kbbbkccck', 'kbbbkccck', 'kkkkkkkkk', '.........'], {a: '#ffd0a8', b: '#ff4fa8', c: '#3fe0ff'}],
  Communication: [['.kkkkkkk.', 'kwwwwwwwk', 'kwwwwwwwk', 'kwkwkwkwk', 'kwwwwwwwk', '.kkkkwkk.', '....kwk..', '.....kk..', '.........'], {w: '#ffffff'}],
  'Création': [['......kk.', '.....kcck', '....kakck', '...kaaak.', '..kaaak..', '.kwaak...', 'kwwkk....', 'kkk......', '.........'], {a: '#ffd86b', c: '#ff8ab0', w: '#f3e2b8'}],
  Finance: [['..kkkkk..', '.kaaaaak.', 'kaabbbaak', 'kaabaaaak', 'kaabbbaak', 'kaaaabaak', 'kaabbbaak', '.kaaaaak.', '..kkkkk..'], {a: '#ffd86b', b: '#c48a2c'}],
  NeoDle: [['kkkkkkkkk', 'kgggggggk', 'kgwgggwgk', 'kgwwggwgk', 'kgwgwgwgk', 'kgwggwwgk', 'kgwgggwgk', 'kgggggggk', 'kkkkkkkkk'], {g: '#5fbf6a', w: '#ffffff'}],
  Voyage: [['....k....', '...kwk...', '...kwk...', 'kkkkwkkkk', 'kwwwwwwwk', 'kkkkwkkkk', '...kwk...', '..kwwwk..', '..kkkkk..'], {w: '#ffffff'}],
  Autre: [['....k....', '...kak...', '..kaaak..', '.kaabaak.', 'kaabbbaak', '.kaabaak.', '..kaaak..', '...kak...', '....k....'], {a: '#3fe0ff', b: '#c8f8ff'}],
};
const nsaIcon = cat => { const [rows, pal] = NSA_ICONS[cat] || (cat.startsWith('Jeux') && NSA_ICONS.Jeux) || NSA_ICONS.Autre; const c = nsaCanvas(9, 9, 2, g => nsaPut(g, rows, 0, 0, pal)); c.className = 'nsChipIco'; return c; };

// les objets en vitrine, 8 de large
const NSA_ITEMS = {
  cart: ['.kkkkkk.', 'kggggggk', 'kgwwwwgk', 'kgwppwgk', 'kgwwwwgk', 'kggggggk', 'kgkkkkgk', 'kkk..kkk'],
  robot: ['....k...', '...kyk..', '.kkkkkk.', 'kscsscsk', 'kssssssk', '.kkkkkk.', '.kskksk.', '.kk..kk.'],
  potion: ['...kk...', '...kk...', '..kwwk..', '.kpwppk.', 'kppppppk', 'kppppppk', '.kppppk.', '..kkkk..'],
  floppy: ['kkkkkkk.', 'kbwwwbbk', 'kbwwwbbk', 'kbbbbbbk', 'kbkkkkbk', 'kbkwwkbk', 'kbkwwkbk', 'kkkkkkkk'],
};
const NSA_IPAL = {g: '#8a84a0', w: '#f3eef8', s: '#a8a0c0', c: '#3fe0ff', y: '#ffd86b', b: '#3f6aff'};
// les lettres de l'enseigne, 5 × 7
const NSA_FONT = {N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'], E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#']};

function nsaBanner() {  // la devanture, 320 × 64 : mur de briques, enseigne, auvent, vitrine et ses étagères, porte, caisses, lanternes, trottoir
  return nsaCanvas(320, 64, 1, g => {
    // le mur : briques décalées d'une rangée à l'autre, un peu plus sombres en haut
    nsaRect(g, '#1c0f2c', 0, 0, 320, 56);
    for (let row = 0; row < 14; row++) for (let bx = -10; bx < 320; bx += 10) {
      const x = bx + (row & 1) * 5, y = row * 4, n = nsaHash(row * 97 + bx);
      nsaRect(g, n < .3 ? '#34204e' : n > .85 ? '#40285e' : '#3a2258', x, y, 9, 3); nsaRect(g, '#4a2e6e', x, y, 9, 1);
    }
    for (let y = 0; y < 10; y++) for (let x = 0; x < 320; x++) if ((x + y) % 2 === 0 && y < 10 - (x * 7 + y * 3) % 4 * 2) nsaRect(g, '#1c0f2c', x, y);
    // les lanternes et leur halo tramé
    for (const lx of [58, 260]) {
      for (let y = -12; y <= 12; y++) for (let x = -12; x <= 12; x++) { const r = Math.hypot(x, y); if (r < 12 && (x + y) % 2 === 0 && r > 3) nsaRect(g, r < 7 ? '#6a4a6a' : '#4a3058', lx + x, 26 + y); }
      nsaPut(g, ['..k..', '.kkk.', 'kyyyk', 'kyYyk', 'kyyyk', '.kkk.', '..k..'], lx - 2, 22, {y: '#ffd86b', Y: '#fff4a0'});
      const dir = lx < 160 ? -1 : 1; nsaRect(g, NSA_K, dir < 0 ? lx - 6 : lx + 1, 21, 6, 1); nsaRect(g, NSA_K, dir < 0 ? lx - 6 : lx + 6, 21, 1, 4);  // la potence fixée au mur
    }
    // la vitrine : cadre de bois, verre sombre, étagères
    nsaRect(g, NSA_K, 69, 26, 182, 30); nsaRect(g, '#6a3a24', 70, 27, 180, 29); nsaRect(g, '#9a5a34', 70, 27, 180, 1); nsaRect(g, '#3e2016', 70, 54, 180, 2);
    nsaRect(g, NSA_K, 74, 29, 124, 23); nsaRect(g, '#1c1430', 75, 30, 122, 21);
    for (let y = 30; y < 36; y++) for (let x = 75; x < 197; x++) if ((x + y) % 2 === 0 && y < 30 + 6 - Math.abs(x - 136) / 12) nsaRect(g, '#3a2448', x, y);  // la lueur de la lampe de la boutique
    for (const [x0, len] of [[84, 9], [170, 7]]) for (let k = 0; k < len; k++) { nsaRect(g, '#2e2a52', x0 + k, 31 + k * 2, 1, 2); nsaRect(g, '#2e2a52', x0 + k + 3, 31 + k * 2, 1, 2); }  // reflets sur le verre
    for (const sy of [39, 49]) { nsaRect(g, '#8a5a34', 75, sy, 122, 1); nsaRect(g, '#5a3a20', 75, sy + 1, 122, 1); }
    nsaRect(g, '#8a809a', 72, 51, 128, 2); nsaRect(g, '#b8b0c8', 72, 51, 128, 1);  // le rebord de pierre
    const shelf = (y, list) => { let x = 77; for (const [kind, col] of list) {
      if (NSA_ITEMS[kind]) { nsaPut(g, NSA_ITEMS[kind], x, y - 8, {...NSA_IPAL, p: col}); x += 10; }
      else { const [rows, pal] = NSA_ICONS[kind]; nsaPut(g, rows, x, y - 9, pal); x += 11; }
    } };
    shelf(39, [['cart', '#ff4fa8'], ['Jeux'], ['Musique'], ['robot'], ['potion', '#ff4fa8'], ['floppy'], ['cart', '#3fe0ff'], ['Système'], ['Anime'], ['potion', '#3fe0ff'], ['cart', '#ffd86b']]);
    shelf(49, [['Internet'], ['cart', '#ffd86b'], ['Finance'], ['floppy'], ['NeoDle'], ['robot'], ['Création'], ['potion', '#ffd86b'], ['Voyage'], ['cart', '#ff4fa8'], ['Sport']]);
    // la porte : planches, petite fenêtre éclairée, poignée
    nsaRect(g, NSA_K, 203, 28, 42, 28); nsaRect(g, '#7a4a2c', 204, 29, 40, 27);
    for (let x = 208; x < 244; x += 5) nsaRect(g, '#5a3420', x, 29, 1, 27);
    nsaRect(g, NSA_K, 214, 32, 20, 10); nsaRect(g, '#ffd86b', 215, 33, 18, 8); nsaRect(g, '#ff9b3d', 215, 37, 18, 4); nsaRect(g, NSA_K, 223, 33, 2, 8);
    nsaRect(g, '#ffd86b', 238, 43, 2, 2); nsaRect(g, '#c48a2c', 239, 44, 1, 1);
    // l'auvent rayé, bord en festons
    const AX = 66, AW = 188; nsaRect(g, NSA_K, AX, 17, AW, 1);
    for (let i = 0; i < AW / 6; i++) {
      const x = AX + i * 6, on = i % 2 === 0, c = on ? '#ff4fa8' : '#ffd0f0', d = on ? '#c03a80' : '#e0a8d0';
      nsaRect(g, c, x, 18, 6, 6); nsaRect(g, d, x, 24, 6, 1); nsaRect(g, NSA_K, x, 25, 1, 1); nsaRect(g, d, x + 1, 25, 4, 1); nsaRect(g, NSA_K, x + 5, 25, 1, 1);
      nsaRect(g, NSA_K, x + 1, 26, 1, 1); nsaRect(g, d, x + 2, 26, 2, 1); nsaRect(g, NSA_K, x + 4, 26, 1, 1); nsaRect(g, NSA_K, x + 2, 27, 2, 1);
      if (on) nsaRect(g, '#ff8acb', x + 1, 18, 1, 6);
    }
    // l'enseigne suspendue
    for (let y = 0; y < 5; y++) { nsaRect(g, y % 2 ? '#4a4a60' : '#8a8aa0', 138, y); nsaRect(g, y % 2 ? '#4a4a60' : '#8a8aa0', 181, y); }
    nsaRect(g, NSA_K, 128, 4, 64, 13); nsaRect(g, '#6a3a24', 129, 5, 62, 11); nsaRect(g, '#9a5a34', 129, 5, 62, 1); nsaRect(g, '#3e2016', 129, 15, 62, 1);
    [...'NEOSTORE'].forEach((ch, i) => NSA_FONT[ch].forEach((r, y) => { for (let x = 0; x < 5; x++) if (r[x] === '#') {
      const px = 137 + i * 6 + x, py = 7 + y; nsaRect(g, '#2a1008', px + 1, py + 1); nsaRect(g, y > 4 ? '#e0a040' : '#ffd86b', px, py);
    } }));
    // les caisses à gauche, un tonneau et une plante à droite
    const crate = (x, y, w, h) => { nsaRect(g, NSA_K, x, y, w, h); nsaRect(g, '#8a5a34', x + 1, y + 1, w - 2, h - 2); nsaRect(g, '#5a3a20', x + 2, y + 2, w - 4, h - 4); nsaRect(g, '#8a5a34', x + 3, y + 3, w - 6, h - 6);
      for (let k = 0; k < w - 6; k++) { const yy = y + 3 + Math.round(k * (h - 7) / (w - 7)); nsaRect(g, '#5a3a20', x + 3 + k, yy); nsaRect(g, '#5a3a20', x + w - 4 - k, yy); } nsaRect(g, '#b07a48', x + 1, y + 1, w - 2, 1); };
    crate(18, 42, 16, 14); crate(36, 44, 14, 12); crate(24, 30, 14, 12);
    nsaRect(g, NSA_K, 266, 40, 14, 16); nsaRect(g, '#7a4a2c', 267, 41, 12, 14); for (const y of [43, 52]) nsaRect(g, '#8a8aa0', 267, y, 12, 1); nsaRect(g, '#9a5a34', 267, 41, 12, 1);
    nsaPut(g, ['..k.k.k...', '.kgkgkgk..', 'kgGgkgGgk.', '.kgGgGgk..', '..kkgkk...', '.kpppppk..', '.kpPpppk..', '..kpppk...', '..kkkkk...'], 284, 47, {g: '#5fbf6a', G: '#2e7a46', p: '#c4603a', P: '#e08a5a'});
    // la pancarte « OUVERT » accrochée à la porte, et le chat qui dort sur les caisses
    nsaRect(g, '#8a8aa0', 217, 42, 1, 2); nsaRect(g, '#8a8aa0', 230, 42, 1, 2);
    nsaRect(g, NSA_K, 210, 44, 28, 9); nsaRect(g, '#f3e2b8', 211, 45, 26, 7); nsaRect(g, '#c8a870', 211, 51, 26, 1);
    [...'OUVERT'].forEach((ch, i) => NSA_MINI[ch].forEach((r, y) => { for (let x = 0; x < 3; x++) if (r[x] === '#') nsaRect(g, '#c03a3a', 212 + i * 4 + x, 46 + y); }));
    nsaPut(g, NSA_CAT, 25, 23, NSA_CATPAL); nsaPut(g, ['###', '..#', '.#.', '###'].map(r => r.replace(/#/g, 'z')), 38, 15, {z: '#c8f8ff'});
    // le trottoir
    nsaRect(g, '#2a2238', 0, 56, 320, 8); nsaRect(g, '#4a4060', 0, 56, 320, 1);
    for (let x = 0; x < 320; x += 16) { nsaRect(g, '#1c1628', x, 57, 1, 3); nsaRect(g, '#1c1628', x + 8, 61, 1, 3); }
    nsaRect(g, '#1c1628', 0, 60, 320, 1);
  });
}
// le cadre des cartes, 12 × 12 découpé en 9 (coins crantés, lumière en haut à gauche, ombre en bas à droite, rivets)
const nsaFrame = (H, M, D, r) => nsaCanvas(12, 12, 2, g => nsaPut(g, ['..kkkkkkkk..', '.kHHHHHHHHk.', 'kHrMMMMMMrDk', 'kHM......MDk', 'kHM......MDk', 'kHM......MDk', 'kHM......MDk', 'kHM......MDk', 'kHM......MDk', 'kHrMMMMMMrDk', '.kDDDDDDDDk.', '..kkkkkkkk..'], 0, 0, {H, M, D, r})).toDataURL();
// l'auvent de « À la une » : bandes et festons, 12 × 7
const nsaAwning = () => nsaCanvas(12, 7, 2, g => nsaPut(g, ['kkkkkkkkkkkk', 'aAaaaabbBbbb', 'aAaaaabbBbbb', 'aAaaaabbBbbb', 'ddddddeeeeee', 'kddddkkeeeek', '.kkkk..kkkk.'], 0, 0, {a: '#ff4fa8', A: '#ff8acb', b: '#ffd0f0', B: '#ffffff', d: '#c03a80', e: '#e0a8d0'})).toDataURL();

// ---------- tout l'intérieur de la boutique : planches de bois, ardoise, étiquettes de prix, ruban, papier, cadre doré, étagère, papier peint, comptoir ----------
// la pancarte de la porte, en lettres de 3 × 5
const NSA_MINI = {O: ['###', '#.#', '#.#', '#.#', '###'], U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], E: ['###', '#..', '##.', '#..', '###'], R: ['##.', '#.#', '##.', '#.#', '#.#'], T: ['###', '.#.', '.#.', '.#.', '.#.']};
// le chat roux de la boutique, roulé en boule, l'œil fermé (de profil : un seul œil)
const NSA_CAT = ['........k..k.', '.......kokkok', '..kkkkkkooook', '.kooooooookok', 'kooOooooooook', 'kOOOOooooook.', '.kkkkkkkkkk..'];
const NSA_CATPAL = {o: '#e0904a', O: '#b0602a'};
const nsaURL = c => `url(${c.toDataURL()})`;
// une boîte 12 × 12 à découper en 9 : contour aux coins arrondis d'un pixel, lumière en haut à gauche, ombre en bas à droite, motif au centre (période 4), clous en option
const nsaBox = o => nsaCanvas(12, 12, 2, g => {
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const cx = Math.min(x, 11 - x), cy = Math.min(y, 11 - y); if (cx + cy < 1) continue;
    const c = cx === 0 || cy === 0 ? o.k : y === 1 || x === 1 ? o.hi : y === 10 || x === 10 ? o.lo : o.fill(x % 4, y % 4);
    if (c) nsaRect(g, c, x, y);
  }
  if (o.nail) for (const [x, y] of [[2, 2], [9, 2], [2, 9], [9, 9]]) nsaRect(g, o.nail, x, y);
});
const NSA_GRAIN = (x, y) => y === 1 && x === 0 ? '#5e321e' : y === 3 && x === 2 ? '#7a4a2c' : '#6a3a24';
// l'ardoise des champs de saisie : cadre de bois, filet sombre, ardoise poussiéreuse de craie
const nsaSlate = () => nsaCanvas(12, 12, 2, g => {
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const cx = Math.min(x, 11 - x), cy = Math.min(y, 11 - y), d = Math.min(cx, cy); if (cx + cy < 1) continue;
    nsaRect(g, d === 0 ? NSA_K : d === 1 ? ((cy === 1 && y < 6) || (cx === 1 && x < 6) ? '#b07a48' : '#6a3a24') : d === 2 ? '#4a2818' : d === 3 ? NSA_K : ((x % 4) * 3 + (y % 4) * 5) % 7 === 0 ? '#26342e' : '#18221e', x, y);
  }
});
// l'étiquette de prix des catégories : pointe à gauche, trou de ficelle, coin d'ombre
const nsaTag = (fill, hi, lo, k) => nsaCanvas(14, 12, 2, g => {
  for (let y = 0; y < 12; y++) { const left = Math.max(0, Math.floor(Math.abs(y - 5.5)) - 1); for (let x = left; x < 14; x++) {
    if (x === 13 && (y === 0 || y === 11)) continue;
    const c = x === left || y === 0 || y === 11 || x === 13 ? k : (x === 3 || x === 4) && (y === 5 || y === 6) ? k : y === 1 ? hi : y === 10 || x === 12 ? lo : fill;
    nsaRect(g, c, x, y);
  } }
});
// le ruban rouge à queues fourchues de « À la une »
const nsaRibbon = () => nsaCanvas(16, 9, 2, g => {
  for (let y = 0; y < 9; y++) { const xl = 4 - Math.abs(y - 4); for (let x = xl; x <= 15 - xl; x++) nsaRect(g, x === xl || x === 15 - xl || y === 0 || y === 8 ? NSA_K : y === 1 ? '#ff9aa0' : y === 7 ? '#a02030' : '#ff4a5a', x, y); }
});
// le cadre doré des captures : quatre filets, des coins plus clairs, centre vide
const nsaGold = () => nsaCanvas(12, 12, 2, g => {
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    const cx = Math.min(x, 11 - x), cy = Math.min(y, 11 - y), d = Math.min(cx, cy); if (d > 3 || cx + cy < 1) continue;
    nsaRect(g, d === 0 ? NSA_K : d === 1 ? '#fff4a0' : d === 2 ? (cx === cy ? '#ffffff' : '#ffd86b') : '#8a5a10', x, y);
  }
});
// l'étagère sous chaque rangée : planche, chant clair, équerre tous les 48 pixels, ombre tramée
const nsaShelf = () => nsaCanvas(24, 10, 2, g => {
  for (let x = 0; x < 24; x++) { nsaRect(g, NSA_K, x, 0); nsaRect(g, '#b07a48', x, 1); for (let y = 2; y < 5; y++) nsaRect(g, (x * 5 + y * 3) % 9 === 0 ? '#7a4a2c' : '#8a5a34', x, y); nsaRect(g, '#5a3420', x, 5); nsaRect(g, NSA_K, x, 6); for (let y = 7; y < 10; y++) if ((x + y) % 2) nsaRect(g, '#0a0414', x, y); }
  for (let y = 7; y < 10; y++) { const w = 6 - (y - 7) * 2; nsaRect(g, NSA_K, 2, y, w + 1, 1); nsaRect(g, '#5a3420', 3, y, Math.max(0, w - 1), 1); }
});
// le papier peint du mur : losanges sombres et une petite fleur dans chacun
const nsaWall = () => nsaCanvas(16, 16, 2, g => {
  nsaRect(g, '#130a22', 0, 0, 16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 16 === 0 || ((x - y) % 16 + 16) % 16 === 0) nsaRect(g, '#1c1030', x, y);
  nsaRect(g, '#2e1a48', 8, 0); nsaRect(g, '#241438', 7, 0); nsaRect(g, '#241438', 9, 0); nsaRect(g, '#241438', 8, 1); nsaRect(g, '#241438', 8, 15);
});
const nsaSprite = (rows, pal) => nsaCanvas(rows[0].length, rows.length, 2, g => nsaPut(g, rows, 0, 0, pal));
const NSA_CHALK = '#e8e0d0';
const NSA_SMALL = {  // petites icônes : loupe et flèche à la craie, coches des badges, punaise des avis
  mag: [['..kkk....', '.k.w.k...', 'k.w...k..', 'k.....k..', 'k.....k..', '.k...k...', '..kkkbk..', '.....kbk.', '......kbk'], {k: NSA_CHALK, w: '#ffffff', b: '#c8c0b0'}],
  arrow: [['ccccccc', '.ccccc.', '..ccc..', '...c...'], {c: NSA_CHALK}],
  ok: [['.......', '......c', '.....cc', 'c...cc.', 'cc.cc..', '.ccc...', '..c....'], {c: '#7fe0ee'}],
  warn: [['...o...', '..ooo..', '..oko..', '.ookoo.', '.ooooo.', 'ooookoo', 'ooooooo'], {o: '#ffb040', k: '#2a1408'}],
  sys: [['..l.l..', '.lllll.', 'lll.lll', 'll...ll', 'lll.lll', '.lllll.', '..l.l..'], {l: '#c8b8f0'}],
  cat: [['tttt...', 't.ttt..', 'tttttt.', '.tttttt', '..ttttt', '...ttt.', '....t..'], {t: '#f3e2b8'}],
  pin: [['..kkk..', '.krrrk.', 'krwrrrk', 'krrrrrk', '.krrrk.', '..kkk..', '...k...'], {r: '#ff4a5a', w: '#ffb0b0'}],
};
// les icônes des onglets : une étoile (découvrir), un carton (installées), une flèche (mises à jour)
const NSA_TABS = {
  discover: [['....k....', '...kyk...', 'kkkkyykkk', 'kyyyyyyyk', '.kyyYyyk.', '..kyyyk..', '.kyykyyk.', '.kyk.kyk.', '.kk...kk.'], {y: '#ffd86b', Y: '#fff4a0'}],
  installed: [['.........', '.kkkkkkk.', 'kbbbkbbbk', 'kkkkkkkkk', 'kbbbbbbbk', 'kbbbybbbk', 'kbbbbbbbk', 'kkkkkkkkk', '.........'], {b: '#c08a50', y: '#ffd86b'}],
  updates: [['....k....', '...kgk...', '..kgggk..', '.kgggggk.', 'kkkgggkkk', '..kgggk..', '..kgggk..', '..kgggk..', '..kkkkk..'], {g: '#5fdf6a'}],
};
const nsaTabIcon = k => { const [rows, pal] = NSA_TABS[k] || NSA_TABS.discover, c = nsaSprite(rows, pal); c.className = 'nsChipIco'; return c; };
// la toile d'araignée des étagères vides
const nsaWeb = () => nsaCanvas(16, 16, 2, g => {  // des fils droits depuis le coin, reliés par des fils qui pendent un peu, et l'araignée au bout de son fil
  const line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) nsaRect(g, '#6a6488', Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)); };
  const P = (k, R) => [R * Math.cos(k * Math.PI / 6), R * Math.sin(k * Math.PI / 6)];
  for (let k = 0; k <= 3; k++) line(0, 0, ...P(k, 15));
  for (const R of [6, 12]) for (let k = 0; k < 3; k++) { const [ax, ay] = P(k, R), [bx, by] = P(k + 1, R), [mx, my] = P(k + .5, R - 1.5); line(ax, ay, mx, my); line(mx, my, bx, by); }
  nsaRect(g, '#6a6488', 12, 9, 1, 3); nsaPut(g, ['k.k.k', '.kkk.', 'kkrkk', '.kkk.', 'k...k'], 10, 11, {k: '#05010b', r: '#ff4a5a'});
});
// le comptoir du bas de la boutique : caisse enregistreuse, sonnette, le chat qui dort, des livres, une plante
function nsaCounter() {
  const c = nsaCanvas(160, 52, 2, g => {
    nsaRect(g, NSA_K, 0, 20, 160, 1); nsaRect(g, '#b07a48', 0, 21, 160, 1); nsaRect(g, '#8a5a34', 0, 22, 160, 2); nsaRect(g, NSA_K, 0, 24, 160, 1);
    nsaRect(g, '#6a3a24', 0, 25, 160, 27);
    for (let x = 4; x < 160; x += 40) { nsaRect(g, NSA_K, x, 29, 32, 19); nsaRect(g, '#5a3420', x + 1, 30, 30, 17); nsaRect(g, '#7a4a2c', x + 1, 30, 30, 1); nsaRect(g, '#7a4a2c', x + 1, 30, 1, 17); nsaRect(g, '#ffd86b', x + 15, 37, 2, 2); }
    // la caisse : socle, corps en laiton, touches, tiroir, afficheur vert
    nsaRect(g, NSA_K, 10, 6, 32, 14); nsaRect(g, '#c48a2c', 11, 7, 30, 12); nsaRect(g, '#ffd86b', 11, 7, 30, 1); nsaRect(g, '#8a5a10', 11, 17, 30, 1);
    nsaRect(g, NSA_K, 16, 0, 16, 7); nsaRect(g, '#123222', 17, 1, 14, 5); nsaRect(g, '#5fdf6a', 19, 3, 2, 1); nsaRect(g, '#5fdf6a', 23, 3, 2, 1); nsaRect(g, '#5fdf6a', 27, 2, 2, 3);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 5; i++) { nsaRect(g, NSA_K, 13 + i * 5, 9 + j * 4, 4, 3); nsaRect(g, i === 4 ? '#ff4a5a' : '#f3e2b8', 14 + i * 5, 10 + j * 4, 2, 1); }
    // la sonnette
    nsaPut(g, ['....k....', '...kyk...', '..kyYyk..', '.kyYyyyk.', '.kyyyyyk.', 'kkkkkkkkk', '.kbbbbbk.'], 54, 13, {y: '#ffd86b', Y: '#fff4a0', b: '#5a3a1a'});
    // le chat et ses « z »
    nsaPut(g, NSA_CAT, 82, 13, NSA_CATPAL); nsaPut(g, ['zzz', '..z', '.z.', 'zzz'], 96, 6, {z: '#c8f8ff'}); nsaPut(g, ['zz', '.z', 'zz'], 101, 2, {z: '#8a84a0'});
    // deux livres et une plante
    nsaRect(g, NSA_K, 112, 12, 18, 9); nsaRect(g, '#3f6aff', 113, 13, 16, 3); nsaRect(g, '#ff4fa8', 113, 17, 16, 3); nsaRect(g, '#f3e2b8', 127, 13, 2, 3); nsaRect(g, '#f3e2b8', 127, 17, 2, 3);
    nsaPut(g, ['..k.k.k...', '.kgkgkgk..', 'kgGgkgGgk.', '.kgGgGgk..', '..kkgkk...', '.kpppppk..', '.kpPpppk..', '..kpppk...', '..kkkkk...'], 138, 11, {g: '#5fbf6a', G: '#2e7a46', p: '#c4603a', P: '#e08a5a'});
  });
  c.className = 'nsCounterArt'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Le comptoir de la boutique et son chat endormi'); return c;
}
function nsaInit() {
  const app = document.getElementById('storeApp'); if (!app || app.querySelector('.nsBanner')) return;
  const b = nsaBanner(); b.className = 'nsBanner'; b.setAttribute('role', 'img'); b.setAttribute('aria-label', 'La devanture du NeoStore');
  app.querySelector('.appWrap').prepend(b);
  const st = document.documentElement.style, set = (k, c) => st.setProperty(k, nsaURL(c));
  st.setProperty('--nsFrame', `url(${nsaFrame('#8a6ac8', '#5a3a8a', '#2e1a4e', '#ffd0f0')})`);
  st.setProperty('--nsFrameOn', `url(${nsaFrame('#ffb0e0', '#ff4fa8', '#a02870', '#ffffff')})`);
  st.setProperty('--nsAwn', `url(${nsaAwning()})`);
  set('--nsWood', nsaBox({k: NSA_K, hi: '#b07a48', lo: '#3e2016', fill: NSA_GRAIN, nail: '#ffd86b'}));
  set('--nsWoodBtn', nsaBox({k: NSA_K, hi: '#b07a48', lo: '#3e2016', fill: NSA_GRAIN}));
  set('--nsWoodHi', nsaBox({k: NSA_K, hi: '#e0a870', lo: '#5a3420', fill: (x, y) => y === 3 && x === 2 ? '#9a5a34' : '#8a5a34'}));
  set('--nsPink', nsaBox({k: NSA_K, hi: '#ffb0e0', lo: '#a02870', fill: (x, y) => y === 3 && x % 2 ? '#e83a94' : '#ff4fa8', nail: '#fff4a0'}));
  set('--nsBtn', nsaBox({k: NSA_K, hi: '#ffb0e0', lo: '#a02870', fill: (x, y) => y === 3 && x % 2 ? '#e83a94' : '#ff4fa8'}));
  set('--nsBtnHi', nsaBox({k: NSA_K, hi: '#ffe0f4', lo: '#c03a80', fill: () => '#ff6ab8'}));
  set('--nsSlate', nsaSlate()); set('--nsGold', nsaGold()); set('--nsShelf', nsaShelf()); set('--nsWall', nsaWall()); set('--nsRib', nsaRibbon()); set('--nsWeb', nsaWeb());
  set('--nsPaper', nsaBox({k: '#5a3a1a', hi: '#fff8e0', lo: '#c8a870', fill: (x, y) => y === 3 ? '#e2cc98' : '#f3e2b8'}));
  set('--nsTag', nsaTag('#f3e2b8', '#fff8e0', '#c8a870', '#3e2016')); set('--nsTagHi', nsaTag('#ffd86b', '#fff4a0', '#c48a2c', '#3e2016')); set('--nsTagOn', nsaTag('#ff4fa8', '#ffb0e0', '#a02870', NSA_K));
  for (const [k, [rows, pal]] of Object.entries(NSA_SMALL)) set('--nsI' + k, nsaSprite(rows, pal));
}
console.assert(NSA_CAT.every(r => r.length === 13) && Object.values(NSA_MINI).every(r => r.length === 5 && r.every(l => l.length === 3)) && Object.values(NSA_SMALL).every(([r]) => r.every(l => l.length === r[0].length)) && Object.values(NSA_TABS).every(([r]) => r.length === 9 && r.every(l => l.length === 9)), 'NeoStore : petits sprites bien formés');
console.assert(Object.values(NSA_ICONS).every(([r]) => r.length === 9 && r.every(l => l.length === 9)) && Object.values(NSA_ITEMS).every(r => r.length === 8 && r.every(l => l.length === 8)) && Object.values(NSA_FONT).every(r => r.length === 7 && r.every(l => l.length === 5)), 'NeoStore : sprites bien formés');
// the NeoStore art is drawn when the main page is idle, not during its start (about 40 ms nobody sees: the store is closed)
requestIdleCallback(nsaInit, { timeout: 3000 });
