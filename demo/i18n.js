/* NeoDex in English. The interface is written in French; when <html lang> says « en » (server-main.js: Paramètres › Langue, or the
   language of Windows), every French text of the page is replaced by its English one from locales/en.json, as it appears: the texts
   between tags and the title / placeholder / aria-label / alt of the elements. The plugins do the same in their frame with their own
   locales/en.json (pluginBoot in plugins.js reuses i18nInstall). Loaded in <head>, before the page is built, so French never shows.
   shortcut: a text built from pieces is translated only when each French piece is a known text (« Il reste » + n + « jours » needs « jours »),
   and dates keep the French format; new code uses i18n(sentence, {vars}) below: one key per sentence. */
// no backtick and no « < / script » here: pluginBoot pastes this function into the plugins' frame
function i18nInstall(dict, root) {
  var done = new WeakMap(), ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  // dates and numbers asked in French (toLocaleDateString('fr-FR'), Intl.DateTimeFormat('fr')…) come out in English
  var en = function (l) { return l == null || /^fr/i.test(String(l)) ? 'en-GB' : l; };
  [[Date.prototype, ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString']], [Number.prototype, ['toLocaleString']]].forEach(function (x) { x[1].forEach(function (m) { var f = x[0][m]; x[0][m] = function (l, o) { return f.call(this, en(l), o); }; }); });
  ['DateTimeFormat', 'DisplayNames', 'NumberFormat', 'RelativeTimeFormat', 'PluralRules', 'ListFormat'].forEach(function (k) { var C = Intl[k]; if (!C) return; var W = function (l, o) { return new C(en(l), o); }; W.prototype = C.prototype; W.supportedLocalesOf = C.supportedLocalesOf; Intl[k] = W; });
  var lc = String.prototype.localeCompare; String.prototype.localeCompare = function (b, l, o) { return lc.call(this, b, en(l), o); };
  // the code often shows a text in capitals (label.toUpperCase()): found without case, given back in capitals
  var FRW = /[àâçéèêëîïôûùœ]|^(de|la|le|les|un|une|des|et|pour|ton|ta|tes|ce|est|pas|du|sur|avec|dans|au|aux|plus|tu|par|sans|en|ou|qui|que|il|elle|on|son|sa|mon|ma|clic|droit|choisir|le|jour|jours)$/i;
  var FRA = /^(n|c|qu|l|d|j|s|m|t)['’]|^(rien|aucun|aucune|tout|tous|très|peut|sera|être|mais|donc|ici|chaque|encore|comme|ses|nos|vos|leur|cette|ces|ne|non|lue|lues)$/i;  // more French words: a piece left in French refuses the whole
  // the pieces of a sentence were written with their punctuation (« , et aucun autre site. »): also found without it
  var bare = function (s) { return s.replace(/^[\s,.:;·(—-]+|[\s:;·(—-]+$/g, ''); };
  var lower = {};
  function learn(d) { for (var key in d) { dict[key] = d[key]; var lk = key.toLowerCase(), bk = bare(lk); if (!(lk in lower)) lower[lk] = d[key]; if (bk && bk !== lk && !(bk in lower) && typeof d[key] === 'string') lower[bk] = bare(d[key]); } }
  dict = Object.assign({}, dict); learn(dict);
  function one(s) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), k = m[2].replace(/\s+/g, ' '), v = k && dict[k];
    if (typeof v !== 'string' && k) {
      v = lower[k.toLowerCase()];
      if (typeof v === 'string') v = k === k.toUpperCase() ? v.toUpperCase() : k[0] === k[0].toLowerCase() && v[1] === v[1].toLowerCase() ? v[0].toLowerCase() + v.slice(1) : v;  // « autorisations » -> « permissions », not « Permissions »
    }
    if (typeof v !== 'string' || !v) return null;
    return v === k ? s : m[1] + v + m[3];  // a word that is the same in English (« Aura », « par ») is still a known word, not French left over
  }
  // a word with punctuation stuck to it (« autorisations, »), a shortcut (« Ctrl+Maj+S »)
  var KEYS = { Maj: 'Shift', 'Échap': 'Esc', Suppr: 'Del', 'Entrée': 'Enter', Espace: 'Space', Inser: 'Ins' };
  function word(w) {
    if (/\+/.test(w) && /\b(Maj|Échap|Suppr|Entrée|Espace|Inser)\b/.test(w)) return w.replace(/(Maj|Échap|Suppr|Entrée|Espace|Inser)/g, function (x) { return KEYS[x]; });
    var m = /^([(«"']*)(.+?)([)»"',.;:!?…]*)$/.exec(w); if (!m || (!m[1] && !m[3])) return null;
    var t = one(m[2]); return t == null ? null : m[1] + t + m[3];
  }
  function tr(s) {
    if (!s || !/\p{L}/u.test(s)) return null;
    var v = one(s); if (v != null || s.length > 400) return v;
    // a text built from pieces (« Désactiver le bloqueur sur » + site, « Modifiée le » + date): the longest known pieces, word by word;
    // kept only when no French word is left over (a news title, a note of the user stay as they are)
    var toks = s.match(/\s+|\S+/g), out = '', i = 0, did = false;
    while (i < toks.length) {
      if (/^\s/.test(toks[i])) { out += toks[i++]; continue; }
      var hit = null;
      for (var j = Math.min(toks.length, i + 41); j > i; j--) { if (/^\s/.test(toks[j - 1])) continue; var t = one(toks.slice(i, j).join('')); if (t != null) { hit = [t, j]; break; } }
      if (hit) { out += hit[0]; i = hit[1]; did = true; continue; }
      var wd = word(toks[i]); if (wd != null) { out += wd; i++; did = true; continue; }
      var bw = toks[i].replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''); if (FRW.test(bw) || FRA.test(bw)) return null;
      out += toks[i++];
    }
    return did ? out : null;
  }
  function text(n) {
    var p = n.parentNode; if (!p || done.get(n) === n.nodeValue) return;
    if (/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/.test(p.nodeName) || p.isContentEditable || (p.closest && p.closest('[translate=no]'))) return;  // translate="no": names of languages, the user's own texts
    var v = tr(n.nodeValue); if (v != null && v !== n.nodeValue) n.nodeValue = v;  // never write the same value back: it would wake the observer again
    done.set(n, n.nodeValue);
  }
  function attrs(e) { for (var i = 0; i < ATTRS.length; i++) { var a = e.getAttribute(ATTRS[i]); if (a) { var v = tr(a); if (v != null && v !== a) e.setAttribute(ATTRS[i], v); } } if (e.nodeName === 'INPUT' && /^(button|submit)$/.test(e.type) && e.value) { var b = tr(e.value); if (b != null && b !== e.value) e.value = b; } }
  function walk(r) {
    if (r.nodeType === 3) return text(r);
    if (r.nodeType !== 1 && r.nodeType !== 9 && r.nodeType !== 11) return;
    if (r.nodeType === 1) attrs(r);
    var w = document.createTreeWalker(r, 5), n;  // elements and texts
    while ((n = w.nextNode())) { if (n.nodeType === 3) text(n); else attrs(n); }
  }
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) { var m = ms[i];
      if (m.type === 'childList') for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      else if (m.type === 'characterData') text(m.target);
      else attrs(m.target);
    }
    var t = tr(document.title); if (t != null && t !== document.title) document.title = t;
  }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  walk(root);
  // tr.add(dict): more texts (a plugin living in the page brings its own locales/en.json), the page translated again with them;
  // tr.t(sentence, {vars}): a text not in the page (drawn on a canvas, built in JS), its {vars} put in after translation
  tr.add = function (d) { learn(d || {}); walk(root); };
  tr.t = function (s, vars) { var v = Object.prototype.hasOwnProperty.call(dict, s) && typeof dict[s] === 'string' ? dict[s] : tr(s); v = v == null ? String(s) : v; for (var k in vars || {}) v = v.split('{' + k + '}').join(vars[k]); return v; };
  return tr;
}
// the page: its dictionary read now, from this computer (a few ms), so the observer is there before the first tag
const I18N_LANG = document.documentElement.lang === 'en' ? 'en' : 'fr';
// one key per sentence: i18n('« {name} » ajoutée', {name}) — the whole sentence is ONE entry of locales/en.json, and what changes ({name}, {n}…)
// is put in after translation, so each language orders its words freely. To be preferred to sentences built from pieces (see the shortcut above).
const i18nFill = (s, vars) => { for (const k in vars || {}) s = s.split('{' + k + '}').join(vars[k]); return s; };
let i18n = (s, vars) => i18nFill(s, vars), i18nAdd = () => {};  // i18nAdd(dict): a plugin's own texts, in English (loadPrivileged)
if (I18N_LANG === 'en') {
  try {
    const x = new XMLHttpRequest(); x.open('GET', 'locales/en.json', false); x.send();
    const tr = i18nInstall(JSON.parse(x.responseText), document.documentElement);
    i18n = tr.t; i18nAdd = tr.add;
  } catch (e) { console.error('locales/en.json', e); }
}
