/* ---------- pixel-art icons of the taskbar and its panels (sound, network, lock), drawn as crisp SVG squares in the text colour ---------- */
const TBI = (() => {
  const svg = (w, h, pts) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.setAttribute('shape-rendering', 'crispEdges'); s.setAttribute('class', 'pxi'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = pts.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="currentColor"/>`).join('');
    return s;
  };
  const rows = r => r.flatMap((l, y) => [...l].flatMap((c, x) => c === '#' ? [[x, y]] : []));
  // pixels at distance r (rounded) from a centre, inside an angle range: the arcs of the sound waves and of the Wi-Fi
  const arc = (cx, cy, r, keep) => { const p = []; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.round(Math.hypot(x - cx, y - cy)) === r && keep(x - cx, y - cy)) p.push([x, y]); return p; };
  const SPK = rows(['....#', '...##', '#####', '#####', '#####', '#####', '#####', '...##', '....#']);
  const right = (dx, dy) => dx > 0 && Math.abs(dy) <= dx * 1.2;
  const up = (dx, dy) => dy < 0 && Math.abs(dx) <= -dy * 1.05;
  const sound = level => svg(13, 9, [...SPK, ...(level === 0 ? [[7, 2], [11, 2], [8, 3], [10, 3], [9, 4], [8, 5], [10, 5], [7, 6], [11, 6]]
    : [3, 5, 7].slice(0, level).flatMap(r => arc(3, 4, r, (dx, dy) => right(dx, dy) && dx >= 3)))]);
  const wifi = off => svg(13, 11, [...[2, 5, 8].flatMap(r => arc(6, 10, r, up)), [6, 10], [5, 10], [7, 10], ...(off ? [[9, 1], [12, 1], [10, 2], [11, 2], [10, 3], [11, 3], [9, 4], [12, 4]] : [])]);
  const cable = () => svg(11, 11, rows(['.#########.', '.#.......#.', '.#.......#.', '.#.......#.', '.#########.', '.....#.....', '...#####...', '.....#.....', '.....#.....', '###########', '#.........#']));
  const lock = () => svg(7, 9, rows(['.#####.', '#.....#', '#.....#', '#######', '###.###', '###.###', '#######', '#######', '.......']));
  const note = () => svg(8, 9, rows(['...#####', '...#####', '...#...#', '...#...#', '...#...#', '.###.###', '####.###', '####....', '.##.....']));
  // the battery: an outline and its tip, its level in 4 columns; while charging, a bolt instead of the level
  const BAT = rows(['#############..', '#...........#..', '#...........#..', '#...........###', '#...........###', '#...........###', '#...........#..', '#...........#..', '#############..']);
  const BOLT = rows(['...............', '........##.....', '.......##......', '......#####....', '........##.....', '.......##......', '......##.......', '......#........']);
  const battery = (lv, charging) => svg(15, 9, [...BAT, ...(charging ? BOLT : [0, 1, 2, 3].filter(i => lv > i * .25 + .05).flatMap(i => [2, 3, 4, 5, 6].flatMap(y => [[2 + i * 3, y], [3 + i * 3, y]])))]);
  return {sound, wifi, cable, lock, note, battery};
})();
