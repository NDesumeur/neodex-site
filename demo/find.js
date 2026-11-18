/* Find in page, shared by NeoDex and its private windows: every match highlighted at once (CSS Custom Highlight API, the page is not modified),
   the current one in pink, with case, whole-word and regular-expression options. neoFindRun runs in the page searched:
   in NeoDex itself for the apps, injected as text (neoFindRun.toString()) into a website tab. */
function neoFindRun(root, q, o, step) {
  const H = window.__neoFind ||= {ranges: [], i: -1, key: '', mirrors: []};
  if (!H.css) {  // a stylesheet object: a website's security rules may refuse a <style> added to its page
    const s = new CSSStyleSheet(); s.replaceSync('::highlight(neo-find){background:#ffd07a;color:#1a0630}::highlight(neo-find-cur){background:#ff5ad9;color:#fff}');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, s]; H.css = true;
  }
  const unmirror = () => { for (const m of H.mirrors) m.remove(); H.mirrors = []; if (H.place) { removeEventListener('scroll', H.place, true); removeEventListener('resize', H.place); H.place = null; } };
  const clear = () => { CSS.highlights.delete('neo-find'); CSS.highlights.delete('neo-find-cur'); unmirror(); H.ranges = []; H.i = -1; H.key = ''; };
  if (!q) { clear(); return {n: 0, i: -1}; }
  const key = q + '\u0000' + JSON.stringify(o);
  if (key !== H.key || step === 0) {
    let re;
    try {
      const src = o.regex ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      re = new RegExp(o.word ? '(?<![\\p{L}\\p{N}_])(?:' + src + ')(?![\\p{L}\\p{N}_])' : src, 'gu' + (o.caseSens ? '' : 'i'));
    } catch (e) { clear(); return {n: 0, i: -1, error: 'expression invalide'}; }
    unmirror();
    const ranges = [], seen = new Map(), visible = el => {  // hidden parts of the page are not searched
      if (!seen.has(el)) { const cs = getComputedStyle(el); seen.set(el, cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0); }
      return seen.get(el);
    };
    const scan = (n, field) => {
      re.lastIndex = 0;
      for (let m; (m = re.exec(n.data)) && ranges.length < 5000;) {
        if (!m[0].length) { re.lastIndex++; continue; }  // a regex matching the empty string would loop forever
        const r = new Range(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); if (field) { r.field = field; r.s = m.index; r.e = r.s + m[0].length; } ranges.push(r);
      }
    };
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: n => !n.data.trim() || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(n.parentNode.nodeName) || !visible(n.parentNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
    for (let n; (n = w.nextNode()) && ranges.length < 5000;) scan(n);
    // a text field holds its text outside the page: a copy of it lies over the field, transparent but for its highlights
    const fields = [...root.querySelectorAll('textarea')].filter(f => f.value && visible(f) && (re.lastIndex = 0, re.test(f.value)));
    for (const f of fields) {
      const m = document.createElement('div'), cs = getComputedStyle(f); m.textContent = f.value + '\n'; f.neoMirror = m;
      for (const k of ['font', 'lineHeight', 'letterSpacing', 'wordSpacing', 'tabSize', 'textIndent', 'textAlign', 'textTransform', 'wordBreak', 'overflowWrap', 'whiteSpace', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) m.style[k] = cs[k];
      Object.assign(m.style, {position: 'fixed', zIndex: 5, boxSizing: 'border-box', margin: 0, overflow: 'hidden', color: 'transparent', background: 'none', pointerEvents: 'none'});
      f.after(m); H.mirrors.push(m); f.addEventListener('input', () => m.remove(), {once: true});  // a field being edited no longer matches its copy
      scan(m.firstChild, f);
    }
    if (fields.length) {
      H.place = () => { for (const f of fields) { const b = f.getBoundingClientRect(), m = f.neoMirror; Object.assign(m.style, {left: b.left + f.clientLeft + 'px', top: b.top + f.clientTop + 'px', width: f.clientWidth + 'px', height: f.clientHeight + 'px'}); m.scrollTop = f.scrollTop; } };
      H.place(); addEventListener('scroll', H.place, true); addEventListener('resize', H.place);
    }
    H.ranges = ranges; H.key = key; H.i = -1;
    CSS.highlights.set('neo-find', new Highlight(...ranges));
    if (step === 0) step = 1;
  }
  const n = H.ranges.length;
  if (!n) { CSS.highlights.delete('neo-find-cur'); return {n: 0, i: -1}; }
  H.i = ((H.i + step) % n + n) % n;
  const r = H.ranges[H.i];
  CSS.highlights.set('neo-find-cur', new Highlight(r));
  if (r.field) {  // the selection waits for the field to get the focus; the keyboard stays in the find bar
    const f = r.field, m = f.neoMirror; r.field.setSelectionRange(r.s, r.e);
    f.scrollTop += r.getBoundingClientRect().top - m.getBoundingClientRect().top - f.clientHeight / 3; m.scrollTop = f.scrollTop;
    return {n, i: H.i};
  }
  const b = r.getBoundingClientRect();
  if (b.top < 60 || b.bottom > innerHeight - 40 || b.left < 0 || b.right > innerWidth) r.startContainer.parentElement?.scrollIntoView({block: 'center', inline: 'nearest'});
  return {n, i: H.i};
}
console.assert(typeof neoFindRun === 'function', 'neoFindRun');
