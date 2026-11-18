/* Translate the whole page of a tab into your language (translate-main.js): the texts are replaced in place, the page keeps working
   (logged in, forms, scripts); « Original » puts the page back. A page in another language offers it once per site. */
// a language's name, in NeoDex's language (i18n.js turns the French one into English)
const trName = l => { try { return new Intl.DisplayNames(['fr'], { type: 'language' }).of(l) || l; } catch { return l; } };
const trTarget = () => I18N_LANG;  // the language of NeoDex (i18n.js)
// in the tab: the text nodes worth translating (not code, fields, or what the page marks translate="no"), kept in window.__neoTr
const TR_COLLECT = `(() => {
  const skip = 'SCRIPT,STYLE,NOSCRIPT,CODE,PRE,TEXTAREA,INPUT,SELECT,OPTION,SVG,MATH,KBD,SAMP,VAR';
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => {
    const p = n.parentElement; if (!p || p.closest('[translate=no],.notranslate,[contenteditable=""],[contenteditable=true]') || skip.split(',').includes(p.tagName)) return NodeFilter.FILTER_REJECT;
    return /\\p{L}{2}/u.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  const nodes = []; while (w.nextNode() && nodes.length < 4000) nodes.push(w.currentNode);
  window.__neoTr = { nodes, orig: nodes.map(n => n.nodeValue) };
  return nodes.map(n => n.nodeValue.trim());
})()`;
async function trPage(t = active) {
  if (!t || t.app || t.lazy) return toast('La traduction marche sur les pages web', true);
  const to = trTarget();
  toast('Traduction de la page…');
  try {
    const texts = await t.v.executeJavaScript(TR_COLLECT);
    if (!texts.length) return toast('Rien à traduire sur cette page');
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');  // the endpoint reads html: plain text is escaped, and read back
    const { texts: done, from } = await neo.trBatch({ texts: texts.map(esc), to });
    const plain = done.map(s => { const d = new DOMParser().parseFromString('<!doctype html><body>' + (s || ''), 'text/html'); return d.body.textContent; });
    await t.v.executeJavaScript(`(() => { const T = window.__neoTr, d = ${JSON.stringify(plain)}; T.nodes.forEach((n, i) => { if (d[i]) { const o = T.orig[i]; n.nodeValue = o.match(/^\\s*/)[0] + d[i] + o.match(/\\s*$/)[0]; } }); document.documentElement.dataset.neoTr = ${JSON.stringify(to)}; })()`);
    t.translated = true;
    siteBar({ key: 'tr' + t.url, host: hostOf(t.url), icon: '文', tab: t, timeout: 20e3, text: ': traduite (' + (from ? trName(from) + ' → ' : '') + trName(to) + ').',
      actions: [{ label: 'Voir l\'original', run: () => trOriginal(t) }, { label: 'OK', main: true, run: () => {} }] });
  } catch (e) { toast('Traduction impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
}
async function trOriginal(t = active) {
  if (!t?.translated) return;
  await t.v.executeJavaScript(`(() => { const T = window.__neoTr; if (T) T.nodes.forEach((n, i) => n.nodeValue = T.orig[i]); delete document.documentElement.dataset.neoTr; })()`).catch(() => {});
  t.translated = false;
}
// a page in another language: offer it, once per site and per session
const trAsked = new Set();
function trOffer(t) {
  t.v.executeJavaScript('(document.documentElement.lang || "").slice(0, 2).toLowerCase()').then(lang => {
    t.translated = false;
    const host = hostOf(t.url), to = trTarget();
    if (!lang || lang === to || trAsked.has(host) || (prefs.trNever || []).includes(lang)) return;
    trAsked.add(host);
    siteBar({ key: 'trAsk' + host, host, icon: '文', tab: t, timeout: 30e3, text: ': cette page est en ' + trName(lang) + '. La traduire en ' + trName(to) + ' ?',
      actions: [{ label: 'Traduire', main: true, run: () => trPage(t) }, { label: 'Jamais pour cette langue', run: () => neo.setSettings({ trNever: [...prefs.trNever || [], lang] }).then(s => { prefs = s; }) }] });
  }, () => {});
}
// each website tab, once its page is loaded (newTab is wrapped: the tabs opened before this file was loaded are hooked by the loop)
{ const hook = t => { if (t && !t.app && !t.trHooked) { t.trHooked = true; t.v.addEventListener('did-finish-load', () => trOffer(t)); } };
  const real = newTab; newTab = function () { const t = real.apply(this, arguments); hook(t); return t; }; tabs.forEach(hook); }
tbPop.append(tbItem('Traduire la page', 'dans ta langue', () => active?.translated ? trOriginal() : trPage()));
