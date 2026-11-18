// découpé de index.html : chargé à la même place que le code d'origine (mêmes variables globales, même ordre)
/* ---------- Notes app (notes.json, saved 0.6 s after the last keystroke), opened like a link from its "Notes" tile ---------- */
PIX.note = ['#######..', '#.....##.', '#.###.###', '#.......#', '#.#####.#', '#.......#', '#.####..#', '#.......#', '#########'];
PIX.chip = ['.#.#.#.#.', '#########', '.#.....#.', '##.###.##', '.#.#.#.#.', '##.###.##', '.#.....#.', '#########', '.#.#.#.#.'];
PIX.coin = ['..#####..', '.#.....#.', '#...###.#', '#.####..#', '#..#....#', '#.####..#', '#...###.#', '.#.....#.', '..#####..'];
PIX.ball = ['...###...', '.#..#..#.', '.#..#..#.', '#...#...#', '#########', '#...#...#', '.#..#..#.', '.#..#..#.', '...###...'];
PIX.conv = ['....#....', '...###...', '..#.#.#..', '....#....', '#########', '....#....', '..#.#.#..', '...###...', '....#....'];
PIX.book = ['.#######.', '#...#...#', '#.#.#.#.#', '#...#...#', '#.#.#.#.#', '#...#...#', '#.#.#.#.#', '#...#...#', '.###.###.'];
PIX.calc = ['#########', '#.......#', '#.#####.#', '#.......#', '#.#.#.#.#', '#.......#', '#.#.#.#.#', '#.......#', '#########'];
PIX.ruler = ['.........', '#########', '#.#.#.#.#', '#.#.#.#.#', '#.#...#.#', '#.......#', '#########', '.........', '.........'];
PIX.brush = ['.......##', '......###', '.....###.', '....###..', '...###...', '..##.....', '.###.....', '####.....', '##.......'];
PIX.power = ['....#....', '.#..#..#.', '#...#...#', '#...#...#', '#.......#', '#.......#', '.#.....#.', '..#####..', '.........'];
PIX.folder = ['.........', '####.....', '#..#####.', '#.......#', '#########', '#.......#', '#.......#', '#.......#', '#########'];
PIX.chart = ['.......##', '.......##', '....##.##', '....##.##', '.##.##.##', '.##.##.##', '.##.##.##', '.##.##.##', '#########'];
const pixImg = (rows, color) => 'data:image/svg+xml,' + encodeURIComponent(pixIcon(rows, 4).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace('currentColor', color));
// app logos: 12x12 multi-colour pixel art, outlines in a darker tone of each logo (a black one would vanish on the dark tiles), with a soft shadow one pixel down-right
const pixArt = (rows, pal, scale = 4) => {
  const colors = {o: '#130a20', ...pal}, w = rows[0].length, h = rows.length;
  let shadow = '', body = '';
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.') return;
    shadow += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
    body += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch] || '#fff'}"/>`;
  }));
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 1} ${h + 1}" width="${(w + 1) * scale}" height="${(h + 1) * scale}" shape-rendering="crispEdges"><g fill="#000" opacity=".45">${shadow}</g>${body}</svg>`);
};
const ART = {
  agenda: [{o: '#5e4d85', w: '#f3eaff', r: '#ff5ad9', d: '#b0288c', l: '#b9a8ff'}, ['.o..o..o..o.', 'oooooooooooo', 'orrrrrrrrrro', 'oddddddddddo', 'owwwwwwwwwwo', 'owlwlwlwlwwo', 'owwwwwwwwwwo', 'owlwlwrrlwwo', 'owwwwwrrwwwo', 'owlwlwlwlwwo', 'owwwwwwwwwwo', 'oooooooooooo']],
  notes: [{o: '#5e4d85', w: '#f3eaff', l: '#b9a8ff', p: '#ff5ad9', d: '#b0288c', y: '#ffd07a'}, ['oooooooo....', 'owwwwwwoo...', 'owllllwwoo..', 'owwwwwwwwo..', 'owllllllwo..', 'owwwwwwwwo.p', 'owllllllwopd', 'owwwwwwwopdo', 'owlllllopdo.', 'owwwwwwyoo..', 'oooooooyo...', '............']],
  system: [{o: '#4a3c86', b: '#8f7bb8', s: '#1c1238', g: '#7fe0ee'}, ['oooooooooooo', 'obbbbbbbbbbo', 'obssssssssbo', 'obsssssgssbo', 'obssssgsgsbo', 'obggsgsssgbo', 'obssgsssssbo', 'obssssssssbo', 'obbbbbbbbbbo', 'ooooobbooooo', '....obbo....', '...oooooo...']],
  stats: [{C: '#1f8098', c: '#7fe0ee', P: '#8a1a7a', p: '#ff5ad9', Y: '#b8641c', y: '#ffd07a'}, ['............', '........YYYY', '........YyyY', '....PPPPYyyY', '....PppPYyyY', '....PppPYyyY', 'CCCCPppPYyyY', 'CccCPppPYyyY', 'CccCPppPYyyY', 'CccCPppPYyyY', 'CCCCPPPPYYYY', '............']],
  budget: [{o: '#7a3c10', y: '#ffd07a', d: '#b8641c'}, ['...oooooo...', '.ooyyyyyyoo.', '.oyyyddddyo.', 'oyyydyyyyyyo', 'oyddddddyyyo', 'oyyydyyyyyyo', 'oyddddddyyyo', 'oyyydyyyyyyo', '.oyyyddddyo.', '.ooyyyyyyoo.', '...oooooo...', '............']],
  nba: [{o: '#6e3410', r: '#ff9a3c', l: '#6e3410'}, ['...oooooo...', '.oorrrlrroo.', '.olrrrlrrro.', 'orrlrrlrrlro', 'orrrlrlrrlro', 'olllllllllro', 'orrrlrlrrlro', 'orrlrrlrrlro', '.olrrrlrrro.', '.oorrrlrroo.', '...oooooo...', '............']],
  convert: [{C: '#1f8098', c: '#7fe0ee', P: '#8a1a7a', p: '#ff5ad9'}, ['........C...', 'CCCCCCCCcC..', 'CccccccccccC', 'CCCCCCCCcC..', '........C...', '............', '...P........', '..PpPPPPPPPP', 'PppppppppppP', '..PpPPPPPPPP', '...P........', '............']],
  journal: [{o: '#3e1f80', v: '#8a5cf0', h: '#b46aee', w: '#f3eaff', k: '#d9c6ff', p: '#ff5ad9'}, ['..ooooooooo.', '.ovvvvvvvvvo', '.ovhhvvvvvvo', '.ovvvvvvvvvo', '.ovvwwwwwvvo', '.ovvwwwwwvvo', '.ovvvvvvvvvo', '.ovvvvvvvvvo', '.ovvvvvvvpvo', '.okkkkkkkpko', '.oooooooopoo', '.........o..']],
  calc: [{o: '#4a3c86', b: '#2b2468', g: '#8ee8a0', k: '#d9c6ff', p: '#ff5ad9'}, ['.oooooooooo.', '.obbbbbbbbo.', '.obggggggbo.', '.obggggggbo.', '.obbbbbbbbo.', '.obkbkbkbbo.', '.obbbbbbbbo.', '.obkbkbkbbo.', '.obbbbbbbbo.', '.obkbkbppbo.', '.obbbbbbbbo.', '.oooooooooo.']],
  units: [{o: '#1f7a4a', g: '#8ee8a0', d: '#1f7a4a', h: '#5fbf85'}, ['............', '............', '............', 'oooooooooooo', 'ogdgdgdgdgdo', 'ogdgdgdgdgdo', 'ogdgggdgggdo', 'oggggggggggo', 'ohhhhhhhhhho', 'oooooooooooo', '............', '............']],
  paint: [{O: '#6e3410', h: '#e8b070', m: '#c9bdf0', P: '#8a1a7a', p: '#ff5ad9'}, ['.........OOO', '........OhhO', '.......OhhO.', '......OhhO..', '.....OhhO...', '....OmmO....', '...PppP.....', '..PpppP.....', '.PppppP.....', '.PpppP......', 'PppPP.......', 'PPP.........']],
  files: [{o: '#7a3c10', d: '#b8641c', y: '#ffd07a', k: '#fff0c8'}, ['............', 'oooo........', 'oddddo......', 'odddddooooo.', 'oddddddddddo', 'okkkkkkkkkko', 'oyyyyyyyyyyo', 'oyyyyyyyyyyo', 'oyyyyyyyyyyo', 'oyyyyyyyyyyo', 'oooooooooooo', '............']],
  startup: [{o: '#1f7a4a', g: '#2fbf71', w: '#e6fff4'}, ['...oooooo...', '.ooggggggoo.', '.ogggwwgggo.', 'oggwgwwgwggo', 'ogwggwwggwgo', 'ogwggggggwgo', 'ogwggggggwgo', 'oggwggggwggo', '.oggwwwwggo.', '.ooggggggoo.', '...oooooo...', '............']],
  translate: [{o: '#4a3c86', p: '#ff5ad9', w: '#ffffff', c: '#7fe0ee'}, ['ooooooo.....', 'opppppo.....', 'oppwppo.....', 'opwpwpo.....', 'opwwwpoooooo', 'opwpwpocccco', 'ooopooocwcco', '..oo.occwcco', '.....ocwwwco', '.....occccco', '.....oooocoo', '.........oo.']],
  typing: [{o: '#4a3c86', b: '#2b2468', w: '#d9c6ff', p: '#ff5ad9'}, ['............', '............', '............', 'oooooooooooo', 'obpbwbwbwbbo', 'obbbbbbbbbbo', 'obwbwbwbwbbo', 'obbbbbbbbbbo', 'obbwwwwwwbbo', 'obbbbbbbbbbo', 'oooooooooooo', '............']],
  runner: [{o: '#8a1a7a', p: '#ff5ad9', w: '#ffffff', k: '#b0288c', c: '#7fe0ee', g: '#8a5cf0'}, ['............', '..oooo......', '.oppppo.....', 'oppwpwpo....', 'oppppppo....', 'oppkkppo..c.', '.oppppo..ccc', '.op..po..ccc', '.oo..oo.cccc', '........cccc', 'gggggggggggg', '............']],
  memory: [{o: '#3e1f80', v: '#8a5cf0', w: '#f3eaff', p: '#ff5ad9'}, ['............', 'ooooo..ooooo', 'ovvvo..owwwo', 'owwvo..opwpo', 'ovvwo..opppo', 'ovwvo..owpwo', 'ovvvo..owwwo', 'ovwvo..owwwo', 'ovvvo..owwwo', 'ooooo..ooooo', '............', '............']],
  shooter: [{o: '#4a3c86', p: '#ff5ad9', w: '#ffffff', y: '#ffd07a', c: '#7fe0ee', d: '#b8641c'}, ['.........oo.', '........oddo', '........oddo', '.........oo.', '.....c......', '.....c......', '.....o......', '....opo.....', '....owo.....', '...opppo....', '..opppppo...', '..oo.y.oo...']],
  procs: [{o: '#4a3c86', b: '#1c1238', g: '#8ee8a0', p: '#ff5ad9', y: '#ffd07a', c: '#7fe0ee'}, ['oooooooooooo', 'obbbbbbbbbbo', 'obgggbbbbbbo', 'obbbbbbbbbbo', 'obpppppbbbbo', 'obbbbbbbbbbo', 'obyyybbbbbbo', 'obbbbbbbbbbo', 'obcccccccbbo', 'obbbbbbbbbbo', 'oooooooooooo', '............']],
  sound: [{o: '#4a3c86', w: '#d9c6ff', c: '#7fe0ee'}, ['............', '....oo......', '...owo...c..', 'oooowo.c..c.', 'owwwwo..c..c', 'owwwwo..c..c', 'owwwwo..c..c', 'oooowo.c..c.', '...owo...c..', '....oo......', '............', '............']],
  vault: [{o: '#7a3c10', m: '#c9bdf0', y: '#ffd07a', d: '#b8641c'}, ['...mmmmmm...', '..mm....mm..', '..m......m..', '..m......m..', 'oooooooooooo', 'oyyyyyyyyyyo', 'oyyyyooyyyyo', 'oyyyyooyyyyo', 'oyyyyyoyyyyo', 'oyyyyyyyyyyo', 'oddddddddddo', 'oooooooooooo']],
  terminal: [{o: '#4a3c86', t: '#8a5cf0', b: '#0b031c', g: '#8ee8a0'}, ['oooooooooooo', 'otttttttttto', 'oooooooooooo', 'obbbbbbbbbbo', 'obgbbbbbbbbo', 'obbgbbbbbbbo', 'obgbbbbbbbbo', 'obbbbggggbbo', 'obbbbbbbbbbo', 'oooooooooooo', '............', '............']],
  clock: [{o: '#4a3c86', w: '#f3eaff', p: '#e01ec8'}, ['...oooooo...', '.oowwwwwwoo.', '.owwwwpwwwo.', 'owwwwwpwwwwo', 'owwwwwpwwwwo', 'owwwwwpppwwo', 'owwwwwwwwwwo', 'owwwwwwwwwwo', '.owwwwwwwwo.', '.oowwwwwwoo.', '...oooooo...', '............']],
  bus: [{o: '#1f8098', y: '#7fe0ee', w: '#e0ffff', r: '#ff4f6d'}, ['............', '.oooooooooo.', 'ooyyyyyyyyoo', 'oywwywwywwyo', 'oywwywwywwyo', 'oyyyyyyyyyyo', 'oyyyyyyyyyyo', 'oyrryyyyrryo', 'oooooooooooo', '..oo....oo..', '............', '............']],
  random: [{o: '#5e4d85', w: '#f3eaff', p: '#e01ec8'}, ['.oooooooooo.', 'owwwwwwwwwwo', 'owppwwwwwwwo', 'owppwwwwwwwo', 'owwwwwwwwwwo', 'owwwwppwwwwo', 'owwwwppwwwwo', 'owwwwwwwwwwo', 'owwwwwwwppwo', 'owwwwwwwppwo', 'owwwwwwwwwwo', '.oooooooooo.']],
  breakout: [{p: '#ff5ad9', c: '#7fe0ee', y: '#ffd07a', w: '#ffffff', m: '#8a1a7a'}, ['............', 'pppp.cccc.yy', 'pppp.cccc.yy', '............', 'yy.pppp.cccc', 'yy.pppp.cccc', '............', '......ww....', '......ww....', '............', '...mpppppm..', '...mmmmmmm..']],
  defense: [{o: '#4a3c86', b: '#2b2468', y: '#ff5ad9', c: '#7fe0ee', g: '#8a5cf0'}, ['.....cc.....', '.....cc.....', '.....oo.....', '...oooooo...', '..obbbbbbo..', '.obbyyyybbo.', '.obyyyyyybo.', '.obbyyyybbo.', '..obbbbbbo..', '.oooooooooo.', 'oggggggggggo', 'oooooooooooo']],
  rhythm: [{o: '#3e1f80', p: '#ff5ad9', w: '#d9c6ff', c: '#7fe0ee', y: '#ffd07a', g: '#8ee8a0'}, ['.....ooooooo', '.....opppppo', '.....ooooooo', '.....o.....o', '.....o.....o', '.....o.....o', '..oooo..oooo', '.owwwo.owwwo', '.owwwo.owwwo', '..ooo...ooo.', '............', 'cccc.yyyy.gg']],
  sudoku: [{o: '#4a3c86', w: '#f3eaff', p: '#ff5ad9'}, ['............', '.oooooooooo.', '.owwowwoppo.', '.owwowwoppo.', '.oooooooooo.', '.oppowwowwo.', '.oppowwowwo.', '.oooooooooo.', '.owwoppowwo.', '.owwoppowwo.', '.oooooooooo.', '............']],
  chess: [{o: '#1c1238', w: '#f3eaff', s: '#c9bdf0', k: '#e01ec8'}, ['............', '.....oo.....', '....owwoo...', '...owkwwwo..', '..owwwwwwso.', '.owwwoowwso.', '.ooo.owwwso.', '....owwwso..', '...owwwwso..', '...owwwwwso.', '.owwwwwwwso.', '.oooooooooo.']],
  dames: [{o: '#05010b', w: '#ff5ad9', s: '#4a2d7a', d: '#3a1f66', h: '#2b1650', y: '#ffd07a'}, ['............', '...oooooo...', '..owwwwwwo..', '.owsssssswo.', '.owsyddyswo.', '.owsyyyyswo.', '.owsyyyyswo.', '.owsssssswo.', '..owwwwwwo..', '..ohhhhhho..', '...oooooo...', '............']],
  hangman: [{o: '#b8641c', w: '#c9bdf0', p: '#d9c6ff'}, ['.ooooooo....', '.o.....w....', '.o.....w....', '.o....ppp...', '.o....ppp...', '.o.....p....', '.o....ppp...', '.o...p.p.p..', '.o.....p....', '.o....p.p...', '.o...p...p..', 'ooooo.......']],
  words: [{o: '#4a3c86', w: '#f3eaff', k: '#5e4d85', p: '#ff5ad9'}, ['oooooooooooo', 'owwwwwwwwwwo', 'owkwkwkwkwwo', 'owwwwwwwwwwo', 'opppppppppwo', 'opkpkpkpkpwo', 'opppppppppwo', 'owwwwwwwwwwo', 'owkwkwkwkwwo', 'owwwwwwwwwwo', 'oooooooooooo', '............']],
  taquin: [{o: '#3e1f80', c: '#7fe0ee', y: '#ffd07a', p: '#ff5ad9'}, ['............', '.oooooooooo.', '.occoyyoppo.', '.occoyyoppo.', '.oooooooooo.', '.oppoccoyyo.', '.oppoccoyyo.', '.oooooooooo.', '.oyyoppo..o.', '.oyyoppo..o.', '.oooooooooo.', '............']],
  fishing: [{o: '#1f8098', c: '#7fe0ee', b: '#e0ffff', k: '#0b031c', w: '#ffffff', l: '#3a6aa8'}, ['............', '.....oooo...', '.o..occccoo.', 'oco.occccwco', 'occoccccckco', 'occcbbbbbbbo', 'oco.obbbbbo.', '.o...ooooo..', '............', 'll..lll..lll', '..ll...ll...', '............']],
  music: [{o: '#3e1f80', b: '#1c1238', g: '#5e4d85', p: '#C084FC', w: '#7DE2D1', k: '#05010b'}, ['...oooooo...', '.oobbbbbboo.', '.obgbbbbbbo.', 'obgbbppbbbbo', 'obbbpwwpbbbo', 'obbpwkkwpbbo', 'obbpwkkwpbbo', 'obbbpwwpbbbo', 'obbbbppbbbgo', '.obbbbbbbgo.', '.oobbbbbboo.', '...oooooo...']],
  docs: [{o: '#1f3a6a', w: '#f3f6ff', b: '#3a8ae0', s: '#c8d8f0'}, ['.oooooooo...', '.owwwwwwoo..', '.owbbbbwowo.', '.owwwwwwoooo', '.owbbbbbbbwo', '.owwwwwwwwwo', '.owbbbbbbbwo', '.owwwwwwwwwo', '.owbbbbbwwwo', '.owwwwwwwwso', '.oooooooooo.', '............']],
  sheets: [{o: '#14502a', w: '#e8fff0', g: '#3fbf6a', d: '#8ee8a0'}, ['oooooooooooo', 'oggggggggggo', 'odddoddddddo', 'oooooooooooo', 'owwwowwwwwwo', 'oooooooooooo', 'owwwowwwwwwo', 'oooooooooooo', 'owwwowwwwwwo', 'oooooooooooo', '............', '............']],
  slides: [{o: '#7a3c10', y: '#ffb060', w: '#fff3e0', r: '#e0402a'}, ['oooooooooooo', 'oyyyyyyyyyyo', 'oywwwwwwwwyo', 'oywwwwwwrwyo', 'oywwwwrwrwyo', 'oywwrwrwrwyo', 'oywwwwwwwwyo', 'oyyyyyyyyyyo', 'oooooooooooo', '.....oo.....', '...oooooo...', '............']],
  texttools: [{o: '#4a3c86', w: '#f3eaff', g: '#3fbf6a', r: '#ff4f6d'}, ['............', '.oooooooooo.', 'owwwwwwwwwwo', 'owrrrrrwwwwo', 'owwwwwwwwwwo', 'owggggggwwwo', 'owwwwwwwwwwo', 'owrrrwwwwwwo', 'owggggwwwwwo', 'owwwwwwwwwwo', '.oooooooooo.', '............']],
  colors: [{o: '#5a3a1a', w: '#e8c890', r: '#ff4f6d', g: '#3fbf6a', b: '#3a8ae0', y: '#ffd07a', p: '#e01ec8'}, ['...oooooo...', '..owwwwwwo..', '.owrrwwggwo.', 'owwrrwwggwwo', 'owwwwwwwwwwo', 'owbbwwwwoowo', 'owbbwwwo..o.', 'owwwwyyo....', '.owppwyyo...', '..owppwwo...', '...oooooo...', '............']],
  gifs: [{o: '#3e1f80', k: '#1c1238', w: '#f3eaff', p: '#ff5ad9'}, ['oooooooooooo', 'okkkkkkkkkko', 'okwwwkwkwwwo', 'okwkkkwkwkko', 'okwkwkwkwwko', 'okwkwkwkwkko', 'okwwwkwkwkko', 'okkkkkkkkkko', 'oppppppppppo', 'oooooooooooo', '............', '............']],
  apothecarydle: [{o: '#6b4a2a', w: '#eadcb8', s: '#c9b48a', g: '#4fcf6a', G: '#2a8a3a', p: '#b8865a'}, ['.....gg.....', '....gGGg....', '...gGGg..p..', '....gg..pp..', '.......pp...', 'oooooooooooo', 'owwwwwwwwwwo', 'owwwwwwwwwso', '.owwwwwwwso.', '..owwwwsso..', '...oooooo...', '..oooooooo..']],
  blackdle: [{y: '#d4a84a', b: '#16121e', g: '#4fcf6a', G: '#2a8a3a'}, ['.yyyyyyyyyy.', 'ybbbbbbbbbby', 'ybggbbbbggby', 'ybgggbbgggby', 'ybbggggggbby', 'ybbbbggbbbby', 'ybbggggggbby', 'ybgggbbgggby', 'ybggbGbbggby', 'ybbbbbGbbbby', 'ybbbbbbbbbby', '.yyyyyyyyyy.']],
  bleachdle: [{w: '#f3eaff', s: '#c9c3d6', r: '#e0324a', k: '#0b031c'}, ['...wwwwww...', '..wwwwwwww..', '.wwrwwwwrww.', '.wrkkwwkkrw.', '.wrkkwwkkrw.', '.wwrwwwwrws.', '.wwwwwwwwws.', '..wkwkwkwk..', '..kwkwkwkw..', '...wwwwws...', '....wwss....', '............']],
  durararadle: [{o: '#3a2a08', y: '#f2c230', Y: '#b88a10', k: '#141018', w: '#9a8cc0'}, ['.oo......oo.', '.oyo....oyo.', '.oyyooooyyo.', '.oyyyyyyyyo.', 'oyyyyyyyyyyo', 'okkkkkkkkkko', 'okwkkkkkkkko', 'okkkkkkkkkko', 'oyyyyyyyyyyo', '.oYYYYYYYYo.', '..oooooooo..', '............']],
  cascade: [{o: '#4a3c86', c: '#7fe0ee', y: '#ffd07a', g: '#8ee8a0', p: '#ff5ad9', m: '#b46aee'}, ['..cc........', '..cc........', '..c.........', '............', 'o..........o', 'o..........o', 'o.yy.......o', 'oyyy..gg...o', 'opppyggg.mmo', 'oppcccggmmmo', 'occcpppgmmmo', 'oooooooooooo']],
  mines: [{m: '#8f7bb8', w: '#ffffff', r: '#ff4f6d'}, ['.....mm.....', '.m..mmmm..m.', '..mmmmmmmm..', '..mwwmmmmm..', '.mmwwmmmmmm.', 'mmmmmmrmmmmm', 'mmmmmrrrmmmm', '.mmmmmrmmmm.', '..mmmmmmmm..', '..mmmmmmmm..', '.m..mmmm..m.', '.....mm.....']],
  fusion: [{y: '#ffd07a', w: '#fff8d0', b: '#4f9fe0', g: '#5fd08a', p: '#ff5ad9', l: '#a8dcff'}, ['.y........p.', 'yyy......ppp', '.y........p.', '....bbbb....', '...bblbbb...', '..bbggbbbb..', '..bbbbbggb..', '..bgbbbbbb..', '...bbbbgb...', '....bbbb....', '.w........y.', '..........w.']],
  snake: [{p: '#ff5ad9', d: '#c03aa8', w: '#ffffff', k: '#130a20', r: '#ff4f6d', g: '#5fd08a'}, ['..........g.', '.........rr.', '.........rr.', '............', '.dddddd.....', '.d....d.....', '.d....dppp..', '.d......pwk.', '.dddd...ppp.', '....d.......', '....dddd....', '............']],
  mots: [{r: '#d8344e', y: '#ffc23a', n: '#2a2440', w: '#ffffff', k: '#130a20'}, ['............', 'rrrr.yyy.nnn', 'rwwr.yky.nwn', 'rwrr.yky.nnn', 'rrrr.yyy.nnn', '............', 'nnnn.rrr.yyy', 'nwnn.rwr.yky', 'nwwn.rwr.yky', 'nnnn.rrr.yyy', '............', '............']],
  city: [{k: '#0b031c', y: '#ffd07a', c: '#7fe0ee', p: '#ff5ad9', w: '#ffffff', b: '#5e2aa0'}, ['........yy..', '.w.....yyyy.', '.......yyyy.', '....p...yy..', '....p.......', '...ppp...c..', '.c.ppp..ccc.', 'ccc.p.b.ccc.', 'cwc.p.b.cwc.', 'ccc.pbbbccc.', 'cccbpbwbccc.', 'bbbbbbbbbbbb']],
  aquarium: [{g: '#8f8fa8', w: '#4fd8cc', d: '#24a0ae', o: '#ff7a4f', y: '#ffd07a', s: '#c9b47a', p: '#5fd08a'}, ['gggggggggggg', 'gwwwwwwwwwwg', 'gwwwwwwwwwwg', 'gwwoooywwwwg', 'gwoowoowwwwg', 'gwwoooywwddg', 'gwwwwwwwdyyg', 'gwpwwwwwwddg', 'gwpwwwwwwwwg', 'gpwpwwwwwwwg', 'gsssssssssssg'.slice(0, 12), 'gggggggggggg']],
  viewer: [{o: '#130a20', c: '#ff5ad9', d: '#8a5cf0', w: '#ffffff'}, ['............', 'oooooooooooo', 'odddddddddco', 'odddwwwwddco', 'oddwwoowwdco', 'odwwoooowwco', 'oddwwoowwdco', 'odddwwwwddco', 'odddddddddco', 'occcccccccco', 'oooooooooooo', '............']],
  security: [{o: '#130a20', c: '#7fe0ee', d: '#3f9fd8', w: '#ffffff'}, ['.oooooooooo.', 'ocwccccddddo', 'ocwccccddddo', 'occcccdddddo', 'occcccdddddo', 'occcccdddddo', '.occccddddo.', '.occccddddo.', '..occcdddo..', '...occddo...', '....oddo....', '.....oo.....']],
  sites: [{k: '#130a20', c: '#7fe0ee', w: '#ffffff', g: '#5fd08a', y: '#ffd07a'}, ['....cccc....', '..cc.cc.cc..', '.c..c..c..c.', '.cccccccccc.', 'c...c..c...c', 'cccccccccccc', 'c...c..c...c', '.cccccccccc.', '.c..c..c.gg.', '..cc.cc.gwwg', '....cccc.gg.', '............']],
  pdf: [{r: '#ff4f6d', w: '#f6f0ff', g: '#a594d8', k: '#130a20', y: '#ffd07a'}, ['.wwwwwww....', '.wggggwww...', '.wwwwwwwww..', '.wggggggww..', '.wwwwwwwww..', '.wgggggyww..', '.wwwwwyyww..', '.rrrrryrrr..', '.rwrwrrwrr..', '.rwrwrwrrr..', '.rrrrrrrrr..', '.wwwwwwwww..']],
  discord: [{b: '#5865f2', w: '#ffffff', d: '#3c45a5'}, ['............', '..bb....bb..', '.bbbbbbbbbb.', '.bbbbbbbbbb.', 'bbbbbbbbbbbb', 'bbbwwbbwwbbb', 'bbbwwbbwwbbb', 'bbbbbbbbbbbb', 'bbbbdbbdbbbb', '.bbbbddbbbb.', '.bbb....bbb.', '............']],
  monodle: [{o: '#5a2a10', y: '#ffc85a', w: '#fff2b8', d: '#c9822c'}, ['....oooo....', '...owywyo...', '..owwywyo...', '.owyydyydo..', 'owyyyooywyo.', 'oyydo..oyydo', 'owwyo..owyyo', 'oyyyooooyyyo', 'oyydwywyyydo', '.ooyyyyyyoo.', '..oyydyydo..', '...oooooo...']],  // Shinobu's ring donut, a bite taken
  meteo: [{o: '#8f7bb8', Y: '#b8641c', y: '#ffd07a', w: '#f3eaff', c: '#c9bdf0'}, ['....y.......', '.y.YYY.y....', '..YyyyY.....', 'yYyyyooooo..', '.Yyyowwwwwo.', '.YYowwwwwwwo', 'owwwwwwwwwwo', 'owwccwwwwwwo', '.oooooooooo.', '............', '............', '............']],
  fgestion: [{o: '#3e1f80', p: '#ff5ad9', c: '#7fe0ee', w: '#ffffff'}, ['............', '.oo.....oo..', 'oppo...occo.', 'oppo...occo.', '.oo.....oo..', '.op....oc...', '.op...oc....', '.op..oc.....', '.opooc......', '.owwo.......', 'owwwwo......', '.oooo.......']],  // two branches merging, fgestion
  store: [{o: '#e01ec8', v: '#8a5cf0', w: '#ffffff'}, ['....oooo....', '...o....o...', '...o....o...', '.oooooooooo.', '.ovvvvvvvvo.', '.ovvvvvvvvo.', '.ovvwwwwvvo.', '.ovvvvvvvvo.', '.ovvvvvvvvo.', '.ovvvvvvvvo.', '.oooooooooo.', '............']],
  notifs: [{o: '#8a5cf0', w: '#f2c25b', c: '#ff7ab8'}, ['.....oo.....', '....owwo....', '...owwwwo...', '..owwwwwwo..', '..owwwwwwo..', '..owwwwwwo..', '..owwwwwwo..', '.owwwwwwwwo.', 'oooooooooooo', '.....cc.....', '.....cc.....', '............']],
  perms: [{o: '#8a5cf0', w: '#d9c6ff', c: '#7fe0ee'}, ['...oooooo...', '..owwwwwwo..', '.owwwwwwwwo.', '.owwwccwwwo.', '.owwccccwwo.', '.owwwccwwwo.', '.owwwccwwwo.', '.owwwwwwwwo.', '..owwwwwwo..', '...owwwwo...', '....oooo....', '............']],
  plugin: [{o: '#8a5cf0'}, ['oooooo......', 'o....o......', 'o....oooo...', 'o.......o...', 'o.......o...', 'o....oooo...', 'o....o......', 'oooooo......', '............', '............', '............', '............']],
};
console.assert(Object.values(ART).every(([, rows]) => rows.length === 12 && rows.every(r => r.length === 12)), 'ART: every logo is 12 x 12');
const artImg = k => pixArt(ART[k][1], ART[k][0]);
// built-in apps: their tile opens them in a tab like a website; view = the element shown in that tab, open = called when it is shown
const APPS = {
  'neodex:notes': {name: 'Notes', view: 'notesApp', icon: artImg('notes')},
  'neodex:stats': {name: 'Stats', view: 'statsApp', icon: artImg('stats'), open: () => renderStats()},
  'neodex:files': {name: 'Fichiers', view: 'filesApp', icon: artImg('files'), open: () => exOpen()},
  'neodex:sound': {name: 'Son', view: 'soundApp', icon: artImg('sound'), open: () => loadScript('sound-app').then(() => auOpen())},
  'neodex:vault': {name: 'Coffre-fort', view: 'vaultApp', icon: artImg('vault'), open: () => loadScript('vault-app').then(() => vtOpen())},
  'neodex:sites': {name: 'Sites et données', view: 'sitesApp', icon: artImg('sites'), open: () => sitesOpen()},
  'neodex:security': {name: 'Sécurité', view: 'securityApp', icon: artImg('security'), open: () => secOpen()},
  'neodex:store': {name: 'NeoStore', view: 'storeApp', icon: artImg('store'), open: () => needStore().then(() => storeOpen())},
  'neodex:notifs': {name: 'Notifications', view: 'notifsApp', icon: artImg('notifs'), open: () => nfOpen()},
  'neodex:agenda': {name: 'Agenda', view: 'agendaApp', icon: artImg('agenda'), open: () => agendaTab(true)},  // l'agenda de l'accueil, prêté à un onglet (et donc à la barre latérale)
  'neodex:perms': {name: 'Autorisations', view: 'permsApp', icon: artImg('perms'), open: () => permsOpen()},
  'neodex:viewer': {name: 'Visionneuse', view: 'viewerApp', icon: artImg('viewer'), open: () => vwOpen()},
  'neodex:fgestion': {name: 'fgestion', view: 'fgApp', icon: artImg('fgestion'), cat: 'Outils', open: () => fgOpen()},
};
let notes = [], notesTimer = null, curNote = null;
const saveNotes = () => { clearTimeout(notesTimer); notesTimer = setTimeout(() => { notesTimer = null; api('notes', notes).catch(e => toast('Sauvegarde des notes impossible : ' + e.message, true)); }, 600); };
addEventListener('pagehide', () => { if (notesTimer) navigator.sendBeacon('/api/notes?t=' + TOKEN, JSON.stringify(notes)); });  // last keystrokes when closing
const noteName = n => n.title.trim() || n.text.trim().split('\n')[0].slice(0, 80) || 'Nouvelle note';
const noteDate = t => new Date(t).toLocaleString('fr-FR', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
function renderNoteList() {
  const q = $('naSearch').value.trim().toLowerCase(), shown = notes.filter(n => !q || (n.title + ' ' + n.text).toLowerCase().includes(q));
  $('naList').replaceChildren(...(shown.length ? shown.map(n => {
    const r = el('div', 'naItem' + (n === curNote ? ' on' : ''));
    r.append(el('b', '', noteName(n)), el('span', '', noteDate(n.t) + (n.title.trim() && n.text.trim() ? ' · ' + n.text.trim().split('\n')[0] : '')));
    r.onclick = () => { openNote(n); $('naText').focus(); };
    return r;
  }) : [el('div', 'hint', q ? 'Aucune note trouvée.' : 'Aucune note. « + Note » en crée une.')]));
}
function openNote(n) {
  curNote = n;
  $('naEditor').classList.toggle('on', !!n);
  if (n) { $('naTitle').value = n.title; $('naText').value = n.text; $('naWhen').textContent = 'Modifiée le ' + noteDate(n.t); }
  renderNoteList();
}
$('naTitle').oninput = $('naText').oninput = () => {  // the note being edited moves to the top of the list
  const n = curNote;
  n.title = $('naTitle').value; n.text = $('naText').value; n.t = Date.now();
  $('naWhen').textContent = 'Modifiée le ' + noteDate(n.t);
  notes.splice(notes.indexOf(n), 1); notes.unshift(n);
  saveNotes(); renderNoteList();
};
$('naTitle').onkeydown = e => { if (e.key === 'Enter') $('naText').focus(); };
$('naSearch').oninput = renderNoteList;
$('naAdd').onclick = () => { const n = {id: crypto.randomUUID(), title: '', text: '', t: Date.now()}; notes.unshift(n); saveNotes(); $('naSearch').value = ''; openNote(n); $('naTitle').focus(); };
$('naDel').onclick = async () => {
  const n = curNote, i = notes.indexOf(n);
  if ((n.title || n.text) && !await nbConfirm('Supprimer la note « ' + noteName(n) + ' » ?')) return;
  notes.splice(i, 1); saveNotes(); openNote(notes[i] || notes[i - 1] || null);
};
// une note venue d'une synchro ou d'une ancienne version peut manquer de titre ou de texte : on la complète au lieu de planter
api('notes').then(d => { notes = (Array.isArray(d) ? d : []).filter(n => n && typeof n === 'object').map(n => ({...n, title: String(n.title ?? ''), text: String(n.text ?? '')})); openNote(notes[0] || null); }).catch(e => toast('Notes indisponibles : ' + e.message, true));

// one line of a list with a proportional bar: icon + name | bar | value (Système disks, Stats rankings)
function barRow(name, pct, value, src, warn) {
  const r = el('div', 'sysRow'), n = el('div', 'tn'), bar = el('div', 'dlBar'), f = el('i', warn ? 'warn' : '');
  if (src) { const im = el('img'); im.onerror = () => im.remove(); im.src = src; n.append(im); }
  n.append(name); n.title = name; f.style.width = Math.max(1, pct) + '%'; bar.append(f);
  r.append(n, bar, el('span', 'v', value));
  return r;
}
