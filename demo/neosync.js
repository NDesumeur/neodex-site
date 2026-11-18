/* ---------- NeoSync: the sync between all your PCs and phones, the same code on the PC (app/main.js) and on the phone (copied into
   mobile/www/js). ONE file in the cloud folder, holding one slot per device: each device writes only its own slot and reads the
   others'. A device that writes an old copy of the file never loses anything: the owner of a slot puts it back, and an old slot
   merged again changes nothing.
   Every piece of data (a setting, a note's text, an event, the presence of an item in a list…) carries a version vector: for each
   device, how many of its changes it contains. Merging another device's slot, piece by piece: the version that contains the other
   wins; when neither does, both devices changed it without seeing the other's change: a CONFLICT, nothing is overwritten, both
   versions are kept until you choose (fgestion), and your choice then wins on every device. Exact whatever the number of devices
   and the path a change took (the same method as the professional sync systems).
   Versions: FORMAT is the file's layout (a device that finds a newer one only reads), SCHEMA the data's (a slot with a newer one
   is not merged until this device is updated). ---------- */
(function (root) {
const FORMAT = 2, SCHEMA = 2;
const IDS = ['id', 'slug', 'url', 'name', 'title', 't'];  // what identifies an item in a list, the first one that works
// merged without asking (the newest device wins): caches, counters, game saves. A game's save is taken whole: half of two saves is a broken game.
const ATOMIC = /^(games\.[^.]+)$/;
const PROGRESS = /^(games|stats|pd\/)/;  // sections dont les conflits de chiffres se règlent tout seuls (voir merge)
let AUTO = /^(pet)(\.|$)/;
let UNION = /(?!)/;  // lists without ids that only grow: the union of both
let PROG = /(?!)/;  // plugins en mode « progression » : jamais de conflit, le meilleur chiffre, sinon l'appareil le plus récent
// the merge rules of the plugins' own data (their manifest's « sync »): regex sources, added to the built-in ones
const BASE = { auto: AUTO, union: UNION };
function setRules({ auto = [], union = [], progress = [] } = {}) {
  PROG = progress.length ? new RegExp(progress.join('|')) : /(?!)/;
  AUTO = auto.length ? new RegExp(BASE.auto.source + '|' + auto.join('|')) : BASE.auto;
  UNION = union.length ? new RegExp(BASE.union.source + '|' + union.join('|')) : BASE.union;
}
const ORDER = '#ordre';  // the order of a list is a piece of its own

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
// the same JSON whatever the order of the keys
const sorted = (k, x) => isObj(x) ? Object.fromEntries(Object.keys(x).sort().map(n => [n, x[n]])) : x;
const canon = v => v === undefined ? undefined : v === null || typeof v !== 'object' ? JSON.stringify(v) : JSON.stringify(v, sorted);
// the same reference or the same JSON in the same key order is equal at once (most pieces have not changed); only then sort the keys
const eq = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b) || canon(a) === canon(b);
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const K = path => JSON.stringify(path);

// a file written over a longer one by a cloud app that does not cut the end: the first JSON value, the rest is the old tail
function firstJson(text) {
  text = String(text).replace(/^﻿/, '');
  try { return JSON.parse(text); } catch (e) {
    let depth = 0, str = false, esc = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
      if (c === '"') str = true; else if (c === '{' || c === '[') depth++;
      else if ((c === '}' || c === ']') && --depth === 0) return JSON.parse(text.slice(0, i + 1));
    }
    throw e;
  }
}

function idKey(...lists) {
  lists = lists.filter(Array.isArray);
  const all = lists.flat();
  if (!all.length || !all.every(isObj)) return null;
  return IDS.find(k => all.every(x => x[k] != null && typeof x[k] !== 'object') && lists.every(l => new Set(l.map(x => canon(x[k]))).size === l.length)) || null;
}
// how a value is walked, the same way on both sides: an object by its keys, a list with ids by its items, anything else whole
const kind = (a, b, ps) => ATOMIC.test(ps) ? 'leaf' : isObj(a) && isObj(b) ? 'obj' : Array.isArray(a) && Array.isArray(b) && !UNION.test(ps) && idKey(a, b) ? 'list' : 'leaf';
const sub = (ps, k) => ps ? ps + '.' + k : k;

// version vectors
const vmax = (...vs) => { const o = {}; for (const v of vs) for (const [k, n] of Object.entries(v || {})) if (!(o[k] >= n)) o[k] = n; return o; };
const ge = (a = {}, b = {}) => Object.keys(b).every(k => (a[k] || 0) >= b[k]);
const under = (meta, P) => { const pre = P.slice(0, -1) + ','; return Object.keys(meta).filter(k => k === P || k.startsWith(pre)); };
const summary = (meta, P) => vmax(...under(meta, P).map(k => meta[k].vv));

// this device changed `a` into `b`: one more change of this device on every piece that differs
function edits(st, a, b, path = [], ps = '', now = Date.now()) {
  if (eq(a, b)) return;
  const bump = P => { st.meta[P] = {vv: {...(st.meta[P] && st.meta[P].vv), [st.id]: ++st.clock}}; };
  const kd = kind(a, b, ps);
  if (kd === 'obj') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) edits(st, a[k], b[k], [...path, k], sub(ps, k), now); return; }
  if (kd === 'list') {
    const k = idKey(a, b), A = new Map(a.map(x => [canon(x[k]), x])), B = new Map(b.map(x => [canon(x[k]), x]));
    for (const id of new Set([...A.keys(), ...B.keys()])) {
      const ip = [...path, {k, v: (A.get(id) || B.get(id))[k]}], IP = K(ip);
      if (A.has(id) && B.has(id)) edits(st, A.get(id), B.get(id), ip, ps, now);
      else if (B.has(id)) bump(IP);
      else {  // deleted: a tombstone that contains every change seen of it, so that a copy left elsewhere does not come back
        const vv = summary(st.meta, IP);
        for (const x of under(st.meta, IP)) delete st.meta[x];
        st.meta[IP] = {vv: {...vv, [st.id]: ++st.clock}, del: now};
      }
    }
    const ca = [...A.keys()].filter(i => B.has(i)), cb = [...B.keys()].filter(i => A.has(i));
    if (ca.join('\n') !== cb.join('\n')) bump(K([...path, ORDER]));
    return;
  }
  bump(K(path));
}

// cx: {mM, mT: the two sides' versions, conflicts, theirsNewer, item: the list item being merged}
function merge(m, t, cx, path = [], ps = '') {
  if (eq(m, t)) return m;
  const kd = kind(m, t, ps);
  if (kd === 'obj') {
    const out = {};
    for (const k of new Set([...Object.keys(m), ...Object.keys(t)])) { const v = merge(m[k], t[k], cx, [...path, k], sub(ps, k)); if (v !== undefined) out[k] = v; }
    return out;
  }
  if (kd === 'list') return mergeList(m, t, idKey(m, t), cx, path, ps);
  const P = K(path), a = summary(cx.mM, P), b = summary(cx.mT, P), ma = cx.mM[P], mb = cx.mT[P];
  if (ge(a, b) && !ge(b, a)) return m;
  if (ge(b, a) && !ge(a, b)) return t;
  if (UNION.test(ps) && Array.isArray(m) && Array.isArray(t)) { const seen = new Set(m.map(canon)); return [...m, ...t.filter(x => !seen.has(canon(x)))]; }
  // the same versions with different values (a device that joins), or never edited apart: the newest device
  if (ge(a, b) || cx.auto || ATOMIC.test(ps) || AUTO.test(ps)) return m === undefined ? t : t === undefined ? m : cx.theirsNewer ? t : m;  // with no version saying so, something absent was never deleted
  if (ma && ma.r && mb && mb.r) return mb.r > ma.r ? t : m;  // chosen in fgestion on two devices at once: the latest choice
  if (PROGRESS.test(String(path[0]))) {  // la progression (jeux, plugins, stats) ne se règle pas à la main : le meilleur chiffre, ce qui est débloqué sur l'un ou l'autre
    if (typeof m === 'number' && typeof t === 'number') return Math.max(m, t);
    if (typeof m === 'boolean' && typeof t === 'boolean') return m || t;
    if (Array.isArray(m) && Array.isArray(t) && [...m, ...t].every(x => x === null || typeof x !== 'object')) return [...new Set([...m, ...t])];
    if (PROG.test(ps)) return m === undefined ? t : t === undefined ? m : cx.theirsNewer ? t : m;
  }
  cx.conflicts.push({P, path, item: cx.item, mine: m, theirs: t, vvM: a, vvT: b});
  return m;
}
function mergeList(m, t, k, cx, path, ps) {
  const M = new Map(m.map(x => [canon(x[k]), x])), T = new Map(t.map(x => [canon(x[k]), x])), res = new Map();
  for (const id of new Set([...M.keys(), ...T.keys()])) {
    const ip = [...path, {k, v: (M.get(id) || T.get(id))[k]}], IP = K(ip), x = {...cx, item: cx.item || {path: ip, mine: M.get(id), theirs: T.get(id)}};
    let v;
    if (M.has(id) && T.has(id)) v = merge(M.get(id), T.get(id), x, ip, ps);
    else {  // on one side only: never seen by the other, or deleted there (its tombstone), or deleted here
      const has = M.has(id) ? 'm' : 't', tomb = has === 'm' ? cx.mT[IP] : cx.mM[IP];
      if (!tomb || !tomb.del) v = has === 'm' ? M.get(id) : T.get(id);
      else {
        const here = summary(has === 'm' ? cx.mM : cx.mT, IP);
        if (ge(tomb.vv, here)) v = undefined;                       // deleted after every change of it
        else if (ge(here, tomb.vv)) v = has === 'm' ? M.get(id) : T.get(id);  // added back after the deletion
        else if (cx.auto || ATOMIC.test(ps) || AUTO.test(ps)) v = cx.theirsNewer === (has === 't') ? (has === 'm' ? M.get(id) : T.get(id)) : undefined;
        else {  // deleted on one side, changed on the other: a conflict, kept for now
          const mine = M.get(id), theirs = T.get(id);
          cx.conflicts.push({P: IP, path: ip, item: x.item, mine, theirs, vvM: has === 'm' ? here : tomb.vv, vvT: has === 'm' ? tomb.vv : here, presence: true});
          v = mine;
        }
      }
    }
    if (v !== undefined) res.set(id, v);
  }
  // the order: the side whose order contains the other's changes, else the newest; the other side's items after their neighbour
  const OP = K([...path, ORDER]), oa = cx.mM[OP] && cx.mM[OP].vv, ob = cx.mT[OP] && cx.mT[OP].vv;
  const mineFirst = ge(oa, ob) && !ge(ob, oa) ? true : ge(ob, oa) && !ge(oa, ob) ? false : !cx.theirsNewer;
  const [first, other] = mineFirst ? [[...M.keys()], [...T.keys()]] : [[...T.keys()], [...M.keys()]];
  const out = first.filter(i => res.has(i));
  other.forEach((id, n) => {
    if (!res.has(id) || out.includes(id)) return;
    let p = n - 1; while (p >= 0 && !out.includes(other[p])) p--;
    out.splice(p < 0 ? 0 : out.indexOf(other[p]) + 1, 0, id);
  });
  return out.map(id => res.get(id));
}
// the versions after a merge: the highest of both everywhere, except a conflict still open (this side's stays, so it stays one)
// every piece present in the data, by its key: the same walk as edits() and merge()
function present(v, path = [], ps = '', out = new Set()) {
  out.add(K(path));
  const kd = kind(v, v, ps);
  if (kd === 'obj') for (const k of Object.keys(v)) present(v[k], [...path, k], sub(ps, k), out);
  else if (kd === 'list') { const k = idKey(v); out.add(K([...path, ORDER])); for (const x of v) present(x, [...path, {k, v: x[k]}], ps, out); }
  return out;
}
function mergeMeta(mM, mT, data, open, now) {
  const out = {}, has = present(data);
  for (const P of new Set([...Object.keys(mM), ...Object.keys(mT)])) {
    const a = mM[P], b = mT[P];
    if (open.has(P)) { if (a) out[P] = a; continue; }
    const there = has.has(P), path = there ? null : JSON.parse(P), last = path && path[path.length - 1];
    const del = !there && ((a && a.del) || (b && b.del));
    const e = {vv: vmax(a && a.vv, b && b.vv)};
    if (del) e.del = Math.max((a && a.del) || 0, (b && b.del) || 0);
    if ((a && a.r) || (b && b.r)) e.r = Math.max((a && a.r) || 0, (b && b.r) || 0);
    // kept: what is there, a recent tombstone, a removed key of an object still there (its removal must not come back)
    if (there || (del && now - e.del < 90 * 864e5) || (path.length && typeof last === 'string' && last !== ORDER && has.has(K(path.slice(0, -1))))) out[P] = e;
  }
  return out;
}

const getAt = (v, path) => { for (const s of path) { if (v == null) return undefined; v = typeof s === 'object' ? (Array.isArray(v) ? v.find(x => isObj(x) && canon(x[s.k]) === canon(s.v)) : undefined) : v[s]; } return v; };
// after: where a list item that is not there goes (the id before it, null = first; undefined = last)
function setAt(v, path, val, after) {
  if (!path.length) return clone(val);
  const [s, ...rest] = path;
  if (typeof s === 'object') {
    const a = Array.isArray(v) ? v.slice() : [], i = a.findIndex(x => isObj(x) && canon(x[s.k]) === canon(s.v)), n = setAt(i >= 0 ? a[i] : undefined, rest, val, after);
    if (n === undefined) { if (i >= 0) a.splice(i, 1); }
    else if (i >= 0) a[i] = n;
    else if (rest.length || after === undefined) a.push(n);
    else { const j = after === null ? -1 : a.findIndex(x => isObj(x) && canon(x[s.k]) === canon(after)); a.splice(j + 1, 0, n); }
    return a;
  }
  const o = isObj(v) ? {...v} : {}, n = setAt(o[s], rest, val, after);
  if (n === undefined) delete o[s]; else o[s] = n;
  return o;
}
// what fgestion shows: "notes › Ma note", "settings › bgTheme"
const label = (path, item) => path.map((s, i) => typeof s === 'object' ? String((i === path.length - 1 && item && (item.title || item.name)) || s.v) : s).join(' › ');

// the cloud file, from any version: none yet, the old one-copy-for-all format (1), or this one
function upgrade(file) {
  if (!file) return {neobase: 2, format: FORMAT, devices: {}, files: {}, icons: {}, history: {items: []}, stats: {}};
  if (file.neobase === 1) {
    const data = {};
    for (const [k, s] of Object.entries(file.sections || {})) if (s && s.data != null) data[k] = s.data;
    return {neobase: 2, format: FORMAT, devices: {}, legacy: {at: Date.now(), data}, files: file.files || {}, icons: file.icons || {}, history: file.history || {items: []}, stats: file.stats || {}};
  }
  return file;
}
const clean = data => Object.fromEntries(Object.entries(data || {}).filter(([, v]) => v != null));
// this device's sync state, kept on the device: its data as last merged, the versions of every piece, open conflicts, the journal
const newState = (id, name, kind) => ({id, name, kind, seq: 0, clock: 0, editAt: 0, data: null, written: '', meta: {}, seen: {}, conflicts: [], log: []});

/* One sync: `current` = this device's data now ({section: value}). Returns the merged data to apply here, and the file to write
   (null when nothing changed). `st` is updated in place and must be saved by the caller once the data is applied. */
function sync(st, file, current, opts = {}) {
  const now = opts.now || Date.now();
  file = upgrade(clone(file));
  if (file.format > FORMAT) return {data: clean(current), file: null, readOnly: true, conflicts: st.conflicts, outdated: [], changedBy: []};
  let data = clean(current);
  const others = Object.keys(file.devices).filter(id => id !== st.id);
  if (!st.data) {
    const old = file.legacy ? clean(file.legacy.data) : null;
    if (old && opts.migrated) {  // a device of the old sync: what differs from the old shared file is its change; a section it does not have was never deleted
      data = {...old, ...data};
      edits(st, old, data, [], '', now);
      st.editAt = 0;
    } else {  // a new device joins: nothing of it counts as a change, the others win on what differs (its own additions stay); the very first device is the reference
      if (old) data = {...data, ...old};
      st.editAt = old || others.length ? -1 : now;
    }
  } else if (!eq(data, st.data)) { edits(st, st.data, data, [], '', now); st.editAt = now; }
  const outdated = [], changedBy = [];
  for (const id of others) {
    const d = file.devices[id];
    if (!d || !d.data) continue;
    if ((d.schema || 0) > SCHEMA) { outdated.push(d.name); continue; }
    if (st.seen[id] && d.seq <= st.seen[id]) continue;  // already merged, or an old copy written back by another device
    const theirsNewer = (d.editAt || 0) > (st.editAt || 0) || ((d.editAt || 0) === (st.editAt || 0) && id > st.id);
    const cx = {mM: st.meta, mT: d.meta || {}, conflicts: [], theirsNewer, item: null, auto: !st.data && !file.legacy && !Object.keys(st.meta).length};
    const before = data;
    data = clean(merge(data, clean(d.data), cx));
    st.meta = mergeMeta(st.meta, d.meta || {}, data, new Set(cx.conflicts.map(c => c.P)), now);
    // the conflicts with that device, as fgestion shows them: one per item (all its pieces in conflict) or per setting
    st.conflicts = st.conflicts.filter(c => c.dev !== id);
    for (const c of cx.conflicts) {
      const g = c.item ? c.item.path : c.path, key = K(g);
      let e = st.conflicts.find(x => x.key === key && x.dev === id);
      if (!e) st.conflicts.push(e = {id: uid(), key, path: g, label: label(g, c.item ? (c.item.mine || c.item.theirs) : null), mine: c.item ? c.item.mine : c.mine, theirs: c.item ? c.item.theirs : c.theirs, dev: id, devName: d.name, at: now, leaves: []});
      e.leaves.push({P: c.P, path: c.path, mine: c.mine, theirs: c.theirs, vvT: c.vvT, presence: !!c.presence});
    }
    st.seen[id] = d.seq;
    const secs = [...new Set([...Object.keys(before), ...Object.keys(data)])].filter(k => !eq(before[k], data[k]));
    if (secs.length || cx.conflicts.length) { changedBy.push(d.name); st.log.unshift({at: now, dev: d.name, kind: d.kind, sections: secs, conflicts: cx.conflicts.length}); }
  }
  // a conflict settled meanwhile through another device: this side's version now contains the other one
  st.conflicts = st.conflicts.filter(c => c.leaves.some(l => !ge(st.meta[l.P] && st.meta[l.P].vv, l.vvT)));
  st.log = st.log.slice(0, 200);
  for (const [P, e] of Object.entries(st.meta)) if (e.del && now - e.del > 90 * 864e5) delete st.meta[P];
  // this device's slot: a new number whenever it changed, written when the file does not have it
  const mine = file.devices[st.id], sig = canon({data, meta: st.meta});
  if (mine && mine.seq > st.seq) st.seq = mine.seq;
  if (sig !== st.written) { st.seq++; st.written = sig; }
  st.data = clone(data);  // never the object handed back: the app may change it in place
  let write = !mine || mine.seq !== st.seq || mine.app !== opts.app;
  if (write) file.devices[st.id] = {name: st.name, kind: st.kind, app: opts.app || '', schema: SCHEMA, seq: st.seq, at: now, editAt: st.editAt, data, meta: st.meta};
  if (file.legacy && now - file.legacy.at > 90 * 864e5 && others.length) { delete file.legacy; write = true; }  // every device had the time to start from it
  return {data, file: write ? file : null, conflicts: st.conflicts, outdated, changedBy};
}

// your choice in fgestion: 'mine', 'theirs' or 'both' (a list item: yours stays, theirs comes as a copy). current: this device's data
// now. The choice gets a version that contains both sides', so it wins on every device. Returns the data to apply here, or false.
function resolve(st, id, choice, current, now = Date.now()) {
  const c = st.conflicts.find(x => x.id === id);
  if (!c || (choice === 'both' && !canKeepBoth(c))) return false;
  let data = clean(current || st.data);
  for (const l of c.leaves) {
    // mine: as it is now, with what changed here since
    const value = choice === 'theirs' ? l.theirs : getAt(data, l.path), P = l.P, vv = {...vmax(summary(st.meta, P), l.vvT), [st.id]: ++st.clock};
    if (l.presence && value === undefined) { data = setAt(data, l.path, undefined); for (const x of under(st.meta, P)) delete st.meta[x]; st.meta[P] = {vv, del: now, r: now}; continue; }
    let after;  // an item put back: at its place on the side chosen
    const last = l.path[l.path.length - 1];
    if (l.presence && typeof last === 'object' && getAt(data, l.path) === undefined) after = null;
    data = setAt(data, l.path, value, after);
    st.meta[P] = {vv, r: now};
  }
  if (choice === 'both') {
    const last = c.path[c.path.length - 1], copyId = last.k === 'id' ? uid() : last.v + ' (2)';
    data = setAt(data, [...c.path.slice(0, -1), {k: last.k, v: copyId}], {...c.theirs, [last.k]: copyId});
    st.meta[K([...c.path.slice(0, -1), {k: last.k, v: copyId}])] = {vv: {[st.id]: ++st.clock}};
  }
  st.conflicts = st.conflicts.filter(x => x.key !== c.key);
  st.data = clone(data); st.editAt = now;
  st.log.unshift({at: now, dev: 'Ton choix', kind: 'choix', sections: [String(c.path[0])], conflicts: 0, label: c.label, choice});
  return data;
}
// a slot made from an old-format file (a copy the cloud app kept): what it changed since `base` (the old shared file) is its own
function slotFrom(id, name, base, file, at) {
  const st = newState(id, name, 'copie'), data = clean((upgrade(clone(file)).legacy || {}).data);
  if (base) edits(st, clean(base), data, [], '', at);
  return {name, kind: 'copie', app: '', schema: SCHEMA, seq: 1, at, editAt: base ? at : -1, data, meta: st.meta};  // no base: it only adds what is missing here
}
const canKeepBoth = c => { const last = c.path[c.path.length - 1]; return typeof last === 'object' && ['id', 'name', 'title'].includes(last.k) && isObj(c.mine) && isObj(c.theirs); };

const api = {setRules, FORMAT, SCHEMA, firstJson, canon, eq, getAt, setAt, upgrade, newState, sync, resolve, canKeepBoth, slotFrom};
if (typeof module === 'object' && module.exports) module.exports = api; else root.NeoSync = api;
})(typeof window !== 'undefined' ? window : globalThis);
