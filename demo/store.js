/* ---------- NeoStore : installer, activer, mettre à jour les plugins. Les plugins non vérifiés sont montrés
   avec un avertissement et passent l'antivirus avant installation (moteur : app/plugins-main.js). ---------- */
const SYSTEM_DESC = {
  'neodex:security': 'Antivirus, quarantaine et état de NeoDex.',
  'neodex:notifs': 'Les notifications de NeoDex et des plugins, au même endroit.',
  'neodex:perms': 'Les autorisations de NeoDex et de chaque plugin.',
  'neodex:store': 'La boutique de plugins (cette appli).',
  'neodex:files': 'Explore les fichiers et dossiers du PC.',
  'neodex:viewer': 'Ouvre images, sons, vidéos et documents.',
  'neodex:fgestion': 'Gère la synchro, les conflits et les sauvegardes.',
  'neodex:notes': 'Prends des notes, synchronisées.',
  'neodex:vault': 'Un coffre-fort chiffré pour tes fichiers : le mot de passe n\'est jamais gardé.',
  'neodex:stats': 'Ton temps d\'écran par site et par programme.',
  'neodex:sites': 'Cookies, autorisations des sites et mots de passe.',
  'neodex:sound': 'Le volume du PC, la sortie audio et le volume de chaque programme.',
};
// les icônes et captures du catalogue : gardées une semaine sur ton PC (les redemander à chaque ouverture ferait vite atteindre les limites d'un hébergeur partagé)
const nsImgMem = new Map();
async function nsImg(url) {
  if (nsImgMem.has(url)) return nsImgMem.get(url);
  let out = url;
  try {
    const cache = await caches.open('neobase-store-v1'); let r = await cache.match(url);
    if (!r || Date.now() - (+r.headers.get('x-cached-at') || 0) > 7 * 864e5) { const f = await fetch(url); if (f.ok) { const blob = await f.blob(); await cache.put(url, new Response(blob, { headers: { 'x-cached-at': String(Date.now()), 'content-type': blob.type } })); r = await cache.match(url); } else if (!r) r = null; }
    if (r) out = URL.createObjectURL(await r.blob());
  } catch {}
  nsImgMem.set(url, out); return out;
}
const nsSrc = (img, url) => { nsImg(url).then(u => { img.src = u; }); };
const storeBadge = (txt, cls) => el('span', 'stBadge ' + cls, txt);
function storeIcon(p, big) {
  const box = el('div', 'stIcon' + (big ? ' big' : ''));
  const letter = () => { box.classList.remove('art'); let h = 0; for (const c of (p.id || p.name || '?')) h = (h * 31 + c.charCodeAt(0)) % 360; box.style.background = 'hsl(' + h + ' 62% 50%)'; box.style.boxShadow = 'inset -4px -4px 0 hsl(' + h + ' 60% 34%), inset 4px 4px 0 hsl(' + h + ' 70% 66%)'; box.replaceChildren(el('b', '', (p.name || '?').trim()[0].toUpperCase())); };
  if (p.builtinId && APPS[p.builtinId]?.icon) { const i = el('img'); i.src = APPS[p.builtinId].icon; box.append(i); box.classList.add('art'); return box; }
  if (p.repo) { const i = el('img'); box.classList.add('art'); i.onerror = letter; nsSrc(i, 'https://raw.githubusercontent.com/' + p.repo + '/main/icon.png'); box.append(i); return box; }  // l'icône vit dans le dépôt
  letter(); return box;
}
// une mise à jour qui demande plus d'autorisations que la version installée : NeoDex ne la pose qu'avec ton accord
async function stPermConsent(r, job) {
  const lines = r.added.map(d => '• ' + d.label + ' — ' + d.sentence + (d.risk === 'élevé' ? ' (RISQUE ÉLEVÉ)' : ''));
  const gone = r.removed?.length ? '\n\nNe demande plus :\n' + r.removed.map(d => '• ' + d.label).join('\n') : '';
  const verb = r.fresh ? 'Installer' : 'Mettre à jour';
  if (!await nbConfirm('« ' + r.name + ' » ' + r.version + (r.fresh ? ' a besoin de ces autorisations :\n' : ' demande de nouvelles autorisations :\n') + lines.join('\n') + gone + '\n\n' + verb + ' ?', { ok: verb, danger: r.added.some(d => d.risk === 'élevé') })) { toast((r.fresh ? 'Installation' : 'Mise à jour') + ' de « ' + r.name + ' » laissée de côté'); return null; }
  return neo.pluginsInstall({ ...job, acceptPerms: true, force: true });
}
async function stInstall(job, unverified) {
  if (unverified && !await nbConfirm('Installer un plugin non vérifié ?\nNeoDex ne l\'a pas examiné. Il passera l\'antivirus, mais installe-le seulement si tu as confiance en sa source.', { ok: 'Installer', danger: true })) return;
  try {
    let r = await neo.pluginsInstall(job);
    if (r && r.needsConfirm) {
      if (!await nbConfirm('Installer quand même ?\nL\'antivirus a signalé : ' + r.reason, { ok: 'Installer quand même', danger: true })) return;
      r = await neo.pluginsInstall({ ...job, force: true });
    }
    if (r && r.needsPermConsent && !(r = await stPermConsent(r, job))) return;
    toast('Installé : ' + (r.manifest?.name || job.repo) + (r.approved ? ' (approuvé)' : ' (non vérifié)') + (r.removed?.length ? ' · ne demande plus : ' + r.removed.map(d => d.label).join(', ') : ''));  // une mise à jour qui retire des autorisations le dit aussi
    await pluginsRefresh(); storeOpen();
  } catch (e) { toast(e.message.replace(/^.*Error: /, ''), true); }
}

const sxNorm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
let nsx = {tab: 'discover', open: null, items: [], byId: new Map(), info: '', err: ''};
const sxState = it => it.state;
// un plugin : tout ce que la boutique sait de lui, que ce soit installé, au catalogue ou seulement proposé
async function storeLoad(force) {
  const list = await neo.pluginsList(), byId = new Map(list.map(p => [p.id, p])), repos = new Set(list.map(p => p.repo).filter(Boolean)), items = [];
  for (const id of SYSTEM_PLUGINS) { const a = APPS[id]; if (a) items.push({id, name: a.name, description: SYSTEM_DESC[id], category: 'Système', builtin: true, builtinId: id, system: true, approved: true, state: 'inst', permissions: []}); }
  for (const p of list) items.push({...p, state: 'inst', ...(p.system ? {category: 'Système'} : {})});
  const info = (SYSTEM_PLUGINS.length + list.length) + ' applis · ' + list.length + ' ajoutée(s)';
  // after an action (install, enable…) the list is already shown: no short list of the installed apps in between, it would send the page back to the top
  const sc = $('storeApp'), top = sc ? sc.scrollTop : 0, had = !!nsx.items?.length, keep = () => { if (had && sc) sc.scrollTop = top; };
  nsx = {...nsx, items, byId, info, err: ''};
  if (!had) sxRender();
  let d; try { d = await neo.pluginsDiscover(force); } catch (e) { nsx.err = 'Catalogue indisponible : ' + e.message.replace(/^.*Error: /, ''); sxRender(); return keep(); }
  if (d.updated) nsx.info = info + ' · catalogue du ' + new Date(d.updated).toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
  const approvedRepos = new Set(d.approved.map(a => a.repo));
  for (const a of d.approved) {
    const mine = items.find(i => i.id === a.id);
    // la fiche du catalogue l'emporte : un plugin installé en vieille version gardait sa vieille catégorie (et le compteur des catégories avec)
    if (mine) { mine.latest = a; mine.state = mine.version !== a.version ? 'upd' : 'inst'; mine.dependencies = a.dependencies; mine.mobile = mine.mobile || a.mobile; mine.compatibility = a.compatibility || mine.compatibility; mine.category = mine.system ? mine.category : a.category || mine.category; mine.syncMode = a.syncMode || mine.syncMode; }
    else items.push({...a, approved: true, state: 'new'});
  }
  for (const r of d.proposed) { if (repos.has(r.repo) || approvedRepos.has(r.repo)) continue; items.push({id: r.repo, name: r.repo.split('/').pop(), repo: r.repo, description: r.description || '', approved: false, state: 'new', proposed: true, stars: r.stars || 0, category: 'Communauté'}); }
  // what the catalog's robot counted (store.json): downloads, reviews, English version; in English, the English name and description of every plugin, installed or not
  for (const i of items) { const s = d.stats?.[i.proposed ? i.repo : i.id]; if (!s) continue; Object.assign(i, {installs: s.installs, rating: s.rating, langs: s.langs, updated: s.updated}); if (i.proposed && s.stars) i.stars = s.stars; if (I18N_LANG === 'en' && s.en) { i.name = s.en.name || i.name; i.description = s.en.description || i.description; } }
  for (const r of d.proposed) { const i = items.find(x => x.proposed && x.repo === r.repo); if (i && r.name && i.name === r.repo.split('/').pop()) i.name = r.name; }
  for (const i of items) if (i.system) i.category = 'Système'; else if (i.type === 'theme') i.category = 'Thèmes';  // les applis système dans Système, les plugins de thèmes dans Thèmes
  nsx.items = items; sxRender(); keep();
}
const sxJob = it => it.proposed ? {repo: it.repo} : {repo: it.repo, id: it.id, version: (it.latest || it).version};
const sxPrimary = (it, big) => {
  const go = (label, fn, main = true) => { const b = secBtn(label, async () => { b.disabled = true; b.textContent = /METTRE|INSTALLER/.test(label) ? 'EN COURS…' : label; try { return await fn(); } finally { b.disabled = false; b.textContent = label; } }, main); b.classList.add('sxBtn'); if (big) b.classList.add('big'); const run = b.onclick; b.onclick = ev => { ev.stopPropagation(); return run(ev); }; return b; };
  if (it.builtin) return go('OUVRIR', () => newTab(it.builtinId));
  if (it.state === 'new') return go('INSTALLER', () => stInstall(sxJob(it), !it.approved));
  if (it.state === 'upd') return go('METTRE À JOUR', () => stInstall(sxJob(it), false));
  return go('OUVRIR', () => newTab('plugin:' + it.id));
};
const sxMatch = it => {
  const q = sxNorm($('nsSearch').value.trim()), cat = $('nsCat').value, state = $('nsState').value, kind = $('nsKind').value, sync = $('nsSync').value;
  return (!q || sxNorm(it.name + ' ' + (it.description || '') + ' ' + (it.category || '') + ' ' + (it.repo || '')).includes(q))
    && (!cat || (it.category || 'Autre') === cat)
    && (!state || it.state === state || (state === 'inst' && it.state === 'upd'))
    && (!kind || (kind === 'ok' ? it.approved : kind === 'warn' ? !it.approved : kind === 'offline' ? sxOffline(it) : kind === 'pad' ? !!it.gamepad : !!it.mobile))
    && (!sync || (!it.builtin && (it.syncMode || 'fusion') === sync));
};
// works without internet: a plugin that asks for no network access at all (a built-in app or an unexamined one: not known)
const sxOffline = it => !it.builtin && !it.proposed && !(it.permissions || []).some(p => /^network/.test(String(p?.id || p)));
const sxAuthor = it => it.author || (it.repo || '').split('/')[0] || 'NeoDex';
// the badges every app row and page shows after its status: category, update, mobile, offline, gamepad
const sxMoreBadges = (b, it) => { if (it.mobile) b.append(storeBadge('mobile', 'cat')); if (sxOffline(it)) b.append(storeBadge('marche hors ligne', 'cat')); if (it.gamepad) b.append(storeBadge('🎮 manette', 'cat')); };
const SX_SORT = {updated: (a, b) => (b.updated || '').localeCompare(a.updated || ''), installs: (a, b) => (b.installs || 0) - (a.installs || 0), name: (a, b) => a.name.localeCompare(b.name, 'fr')};
const sxFrOnly = it => !it.builtin && !it.approved && it.langs && !it.langs.includes('en');  // an unverified plugin without locales/en.json
const sxStatusBadge = it => it.builtin ? storeBadge('intégré', 'sys') : it.approved ? storeBadge('approuvé', 'ok') : storeBadge(sxFrOnly(it) ? 'non vérifié · français seulement' : 'non vérifié', 'warn');
// « ★ 4,5 · 285 installations »: the reviews and downloads the robot counted
const sxStats = it => [it.rating?.count ? '★ ' + it.rating.average.toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' (' + it.rating.count + ')' : '', it.installs ? it.installs.toLocaleString('fr-FR') + ' installation' + (it.installs > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
function sxOpen(it) { nsx.open = it.id; sxRender(); document.getElementById('storeApp')?.scrollTo?.(0, 0); }
function sxCard(it) {
  const c = el('div', 'sxCard'); c.dataset.app = it.id; c.onclick = () => sxOpen(it);
  const th = el('div', 'sxThumb none'); th.append(storeIcon(it, true));
  const head = el('div', 'sxCardHead'), names = el('div', 'sxCardNames'); names.append(el('b', 'sxName', it.name), el('small', 'sxCat', [it.category || '', sxStats(it)].filter(Boolean).join(' · ') + (it.state === 'upd' ? ' · mise à jour' : '')));
  head.append(storeIcon(it), names);
  const foot = el('div', 'sxCardFoot'); foot.append(it.state === 'inst' && !it.builtin ? el('span', 'stDone', '✓ installé') : it.state === 'upd' ? el('span', 'stDone warn', 'mise à jour') : el('span', 'sxFree', it.builtin ? 'intégré' : it.approved ? '✓ approuvé' : sxFrOnly(it) ? 'non vérifié · français seulement' : 'non vérifié'), sxPrimary(it));
  c.append(th, head, el('div', 'sxDesc', it.description || ''), foot);
  return c;
}
function sxHero(it) {
  const h = el('div', 'sxHero'); h.dataset.app = it.id; h.onclick = () => sxOpen(it);
  const m = el('div', 'sxHeroTxt'); m.append(el('small', 'sxKick', 'À LA UNE'), el('b', 'sxHeroT', it.name), el('div', 'sxHeroD', it.description || ''), sxPrimary(it, true));
  h.append(storeIcon(it, true), m);
  return h;
}
function sxRow(it) {
  const r = el('div', 'sxRow'); r.dataset.app = it.id; r.onclick = () => sxOpen(it);
  const m = el('div', 'stMeta'), t = el('div', 'stTitle'); t.append(it.name); if (it.version) t.append(el('small', '', ' v' + it.version));
  const b = el('div', 'stBadges'); b.append(sxStatusBadge(it)); if (it.category) b.append(storeBadge(it.category, 'cat')); if (it.state === 'upd') b.append(storeBadge('mise à jour ' + it.latest.version, 'warn')); sxMoreBadges(b, it);
  m.append(t, b, el('div', 'stDesc', it.description || ''));
  r.append(storeIcon(it, true), m, sxPrimary(it)); return r;
}
async function sxUninstall(it) {
  const a = await nbBox({ title: 'Désinstaller « ' + it.name + ' » ?', text: 'Ses données (dans son dossier) peuvent rester : elles reviennent si tu le réinstalles, et restent dans ta synchro et tes sauvegardes.', buttons: ['Désinstaller, garder les données', 'Désinstaller et tout effacer', 'Annuler'], defaultId: 2, cancelId: 2, danger: true });
  if (a.response === 2) return;
  await neo.pluginsUninstall(it.id, a.response === 0); await pluginsRefresh(); nsx.open = null; storeLoad();
}
// un README en blocs de texte : titres, paragraphes, listes ; jamais de HTML du dépôt dans la page (elle a les droits de NeoDex)
function sxMarkdown(md) {
  const box = el('div', 'sxMd'), clean = s => s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '').replace(/[*_`]{1,3}([^*_`]+)[*_`]{1,3}/g, '$1').trim();
  let para = [], list = null, code = false;
  const flush = () => { if (para.length) box.append(el('p', '', para.join(' '))); para = []; list = null; };
  for (const raw of md.split(/\r?\n/)) {
    if (/^\s*```/.test(raw)) { flush(); code = !code; continue; }
    if (code) continue;  // les blocs de code (commandes de build) n'intéressent pas qui installe
    const h = /^#{1,6}\s+(.*)/.exec(raw), li = /^\s*(?:[-*+]|\d+\.)\s+(.*)/.exec(raw);
    if (h) { flush(); const t = clean(h[1]); if (t) box.append(el('h4', '', t)); }
    else if (li) { if (para.length) flush(); if (!list) { list = el('ul'); box.append(list); } const t = clean(li[1]); if (t) list.append(el('li', '', t)); }
    else if (!raw.trim()) flush();
    else { list = null; const t = clean(raw); if (t) para.push(t); }
  }
  flush(); return box;
}
console.assert(sxMarkdown('# T\n\nUn **mot** [lien](x)\n- a\n- b\n<script>x</script>').querySelectorAll('h4,p,li,script').length === 5, 'sxMarkdown');
// l'aperçu : preview.gif du dépôt s'il existe (quelques secondes du jeu), sinon l'icône qui bouge
function sxPreview(it) {
  const box = el('div', 'sxPreview'), anim = () => box.replaceChildren(storeIcon(it, true));
  if (!it.repo) { anim(); return box; }
  const g = el('img', 'gif'); g.alt = 'Aperçu de ' + it.name; g.onerror = anim; nsSrc(g, 'https://raw.githubusercontent.com/' + it.repo + '/HEAD/preview.gif'); box.append(g);
  return box;
}
function sxDetail(it) {
  const w = el('div', 'sxDetail'), back = el('button', 'sxBack', '‹ Boutique'); back.onclick = () => { nsx.open = null; sxRender(); };
  const head = el('div', 'sxHead'), meta = el('div', 'sxHeadMeta'), act = el('div', 'sxHeadAct');
  const b = el('div', 'stBadges'); b.append(sxStatusBadge(it)); if (it.system) b.append(storeBadge('système', 'sys')); if (it.category) b.append(storeBadge(it.category, 'cat')); sxMoreBadges(b, it);
  const by = el('button', 'sxAuthor', sxAuthor(it)); by.title = 'Toutes les applis de ' + sxAuthor(it); by.onclick = () => { nsx.open = null; nsx.author = sxAuthor(it); sxRender(); };
  const line = el('small', 'sxCat'); line.append(by, it.version ? ' · version ' + it.version : '');
  meta.append(el('div', 'sxHeroT', it.name), line, b);
  act.append(sxPrimary(it, true));
  const mine = nsx.byId.get(it.id);
  if (mine && !mine.system) {
    const sm = (label, fn, cls = '') => { const x = secBtn(label, fn); x.classList.add('sxSm'); if (cls) x.classList.add(cls); return x; }, manage = el('div', 'sxManage');
    manage.append(sm(mine.enabled ? 'Désactiver' : 'Activer', () => neo.pluginsEnable(mine.id, !mine.enabled).then(() => pluginsRefresh()).then(() => storeLoad())), sm('Autorisations', () => newTab('neodex:perms')), sm('Désinstaller', () => sxUninstall(it), 'danger'));
    act.append(manage);
  }
  head.append(storeIcon(it, true), meta, act);
  const perms = it.permissions || [], permBox = el('div', 'sxPerms');
  if (it.builtin) permBox.append(el('div', 'hint', 'Fait partie de NeoDex : livrée avec l\'appli, de confiance, non désinstallable.'));
  else if (it.proposed) permBox.append(el('div', 'hint', 'Autorisations inconnues : NeoDex n\'a pas examiné ce plugin. Il passera l\'antivirus avant d\'être installé.'));
  else if (!perms.length) permBox.append(el('div', 'hint', 'Aucune autorisation particulière.'));
  else for (const n of perms) permBox.append(el('div', 'sxPerm' + (n === 'full' ? ' warn' : ''), (n === 'full' ? '⚠ ' : '• ') + (n === 'full' ? 'Accès complet à NeoDex (comme une appli intégrée ; demandé à la première ouverture, signé par NeoDex)' : permLabel(n))));
  const dep = it.dependencies && Object.keys(it.dependencies).length ? Object.keys(it.dependencies).map(d => (nsx.items.find(i => i.id === d)?.name || d)).join(', ') : '';
  const info = el('div', 'sxInfo');
  for (const [k, v] of [['Version', it.version || '—'], ['Catégorie', it.category || '—'], ['Vérification', it.builtin ? 'intégrée à NeoDex' : it.approved ? 'approuvé et signé par NeoDex' : 'non vérifié'], ['Marche sur', (it.compatibility || ['windows', ...(it.mobile ? ['android'] : []), ...((it.permissions || []).some(p => ['system:main', 'system:startup', 'system:processes'].includes(String(p?.id || p))) ? [] : ['linux'])]).map(o => ({windows: 'Windows', android: 'Android', linux: 'Linux'})[o] || o).join(', ')], ['Dépôt', it.repo || 'NeoDex'], ['Nécessite', dep || 'rien d\'autre'], ['Données', it.builtin ? 'dans NeoDex' : 'dans le dossier du plugin, sauvegardé avec NeoDex']]) info.append(el('span', 'sxK', k), el('span', 'sxV', v));
  const left = el('div', 'sxLeft'), side = el('div', 'sxSide');
  const about = el('div'), notes = el('div');
  left.append(sxPreview(it), notes, el('div', 'label', 'À propos'), el('div', 'stDesc sxAbout', it.description || ''), about, el('div', 'label', 'Autorisations'), permBox);
  // le README du dépôt, et les notes de la version (celle à installer si une mise à jour attend)
  const ver = (it.latest || it).version;
  if (it.repo && !it.builtin) neo.pluginsDoc(it.repo, it.proposed ? '' : ver).then(d => {
    if (d.readme) about.append(sxMarkdown(d.readme));
    if (d.at) info.append(el('span', 'sxK', 'Mise à jour'), el('span', 'sxV', new Date(d.at).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})));
    if (d.notes) { const n = el('div', 'sxNotes'); n.append(el('b', '', (it.state === 'upd' ? 'Ce que change la version ' : 'Nouveautés de la version ') + ver), sxMarkdown(d.notes)); notes.append(n); }
  }).catch(() => {});
  // avis : des issues GitHub (formulaire prérempli) ; un plugin intégré à NeoDex n'en a pas
  if (!it.builtin) {
    const rv = el('div', 'sxReviews'), stars = n => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
    const give = secBtn('Donner mon avis', () => newTab('https://github.com/NDesumeur/neodex-store-catalog/issues/new?template=avis.yml&labels=avis&title=' + encodeURIComponent('[' + it.id + '] ' + it.name) + '&plugin=' + encodeURIComponent(it.id)));
    give.classList.add('sxSm'); rv.append(el('div', 'hint', 'Chargement des avis…'));
    left.append(el('div', 'label', 'Avis'), rv);
    neo.pluginsReviews(it.id).then(r => {
      rv.replaceChildren();
      const top = el('div', 'sxRvTop');
      top.append(r.list.length ? el('b', 'sxRvAvg', stars(r.average) + ' ' + r.average.toFixed(1).replace('.', ',') + ' · ' + r.list.length + ' avis') : el('span', 'hint', 'Pas encore d’avis.'), give);
      rv.append(top);
      for (const x of r.list.slice(0, 20)) { const c = el('div', 'sxRv'); c.append(el('div', 'sxRvHead', stars(x.stars) + '  ' + x.who + ' · ' + new Date(x.at).toLocaleDateString('fr-FR')), ...(x.text ? [el('div', 'stDesc', x.text)] : [])); rv.append(c); }
      rv.append(el('div', 'hint', 'Un compte GitHub suffit pour donner ton avis.'));
    }).catch(() => rv.replaceChildren(el('div', 'hint', 'Avis indisponibles pour le moment.'), give));
  }
  side.append(el('div', 'label', 'Informations'), info);
  const cols = el('div', 'sxCols'); cols.append(left, side);
  w.append(back, head, cols);
  return w;
}
function sxRender() {
  const body = $('nsBody'); if (!body) return;
  $('nsInfo').textContent = nsx.info;
  const items = nsx.items, nUpd = items.filter(i => i.state === 'upd').length, nInst = items.filter(i => i.state !== 'new').length;
  $('nsTabs').replaceChildren(...[['discover', 'Découvrir'], ['installed', 'Installées · ' + nInst], ['updates', 'Mises à jour' + (nUpd ? ' · ' + nUpd : '')]].map(([k, l]) => { const b = el('button', 'tab px' + (nsx.tab === k && !nsx.open ? ' on' : ''), l); if (typeof nsaTabIcon === 'function') b.prepend(nsaTabIcon(k)); b.onclick = () => { nsx.tab = k; nsx.open = null; ['nsSearch'].forEach(i => $(i).value = ''); ['nsCat', 'nsState', 'nsKind', 'nsSync', 'nsSort'].forEach(i => $(i).value = ''); nsx.author = ''; sxRender(); }; return b; }));
  const cats = [...new Set(items.map(i => i.category || 'Autre'))].sort((a, b) => a.localeCompare(b, 'fr')), keep = $('nsCat').value;
  $('nsCat').replaceChildren(Object.assign(el('option', '', 'Toutes les catégories'), {value: ''}), ...cats.map(c => Object.assign(el('option', '', c), {value: c}))); $('nsCat').value = cats.includes(keep) ? keep : '';
  const chips = $('nsChips'), cur = $('nsCat').value, all = items.length, nOf = c => items.filter(i => (i.category || 'Autre') === c).length;
  chips.replaceChildren(...[['', 'Tout · ' + all], ...cats.map(c => [c, c + ' · ' + nOf(c)])].map(([c, l]) => { const b = el('button', 'nsChip' + (cur === c ? ' on' : ''), l); if (typeof nsaIcon === 'function') b.prepend(nsaIcon(c)); b.onclick = () => { nsx.open = null; $('nsCat').value = c; if (nsx.tab === 'discover' || c) sxRender(); }; return b; }));
  chips.style.display = nsx.open ? 'none' : '';
  if (nsx.open) { const it = items.find(i => i.id === nsx.open); if (it) { $('nsCount').textContent = ''; return body.replaceChildren(sxDetail(it)); } nsx.open = null; }
  // the page of an author: every app of theirs, the most recently updated first
  if (nsx.author) {
    const list = items.filter(i => sxAuthor(i) === nsx.author).sort(SX_SORT.updated), back = el('button', 'sxBack', '‹ Boutique'); back.onclick = () => { nsx.author = ''; sxRender(); };
    const head = el('div', 'sxRowT'); head.append(el('b', '', 'Applis de ' + nsx.author + ' · ' + list.length));
    $('nsCount').textContent = ''; chips.style.display = 'none'; return body.replaceChildren(back, head, ...list.map(sxRow));
  }
  const sort = $('nsSort').value, filtering = $('nsSearch').value.trim() || $('nsCat').value || $('nsState').value || $('nsKind').value || $('nsSync').value || sort;
  const nodes = [];
  if (nsx.err) nodes.push(el('div', 'hint', nsx.err));
  if (filtering) {
    const found = items.filter(sxMatch); if (sort) found.sort(SX_SORT[sort]); $('nsCount').textContent = found.length + ' résultat(s)';
    nodes.push(...(found.length ? found.map(sxRow) : [el('div', 'hint nsEmpty', 'Aucune appli ne correspond : cette étagère est vide.')]));
  } else {
    $('nsCount').textContent = '';
    if (nsx.tab === 'installed') {
      const sec = (label, list) => { if (list.length) { const t = el('div', 'sxRowT'); t.append(el('b', '', label + ' · ' + list.length)); nodes.push(t, ...list.map(sxRow)); } }, inst = items.filter(i => i.state !== 'new');
      sec('Mises à jour disponibles', inst.filter(i => i.state === 'upd')); sec('Mes plugins', inst.filter(i => i.state === 'inst' && !i.builtin)); sec('Système', inst.filter(i => i.builtin));
    }
    else if (nsx.tab === 'updates') {
      const up = items.filter(i => i.state === 'upd');
      if (up.length) { const all = secBtn('TOUT METTRE À JOUR', async () => { for (const i of up) { const r = await neo.pluginsInstall(sxJob(i)); if (r?.needsPermConsent) await stPermConsent(r, sxJob(i)); } await pluginsRefresh(); toast('Mises à jour installées'); storeLoad(); }, true); nodes.push(all, ...up.map(sxRow)); }
      else nodes.push(el('div', 'hint', 'Tout est à jour.'));
    } else {
      const apps = items.filter(i => !i.proposed), fresh = apps.filter(i => i.state === 'new' && i.approved), pool = fresh.length ? fresh : apps.filter(i => !i.builtin);
      if (pool.length) nodes.push(sxHero(pool[Math.floor(Date.now() / 864e5) % pool.length]));
      // les plus installés (compteurs des Releases GitHub, relevés chaque heure par le robot du catalogue)
      const top = apps.filter(i => i.installs > 0).sort((a, b) => b.installs - a.installs).slice(0, 10);
      if (top.length >= 3) { const head = el('div', 'sxRowT'); head.append(el('b', '', 'Les plus installés')); const row = el('div', 'sxScroll'); row.append(...top.map(sxCard)); nodes.push(head, row); }
      // pour toi : des applis approuvées pas encore installées, dans les catégories où tu en as déjà le plus (les plus installées d'abord)
      const mine = new Map(); for (const i of apps) if (i.state !== 'new' && !i.builtin && i.category) mine.set(i.category, (mine.get(i.category) || 0) + 1);
      const reco = apps.filter(i => i.state === 'new' && i.approved && mine.has(i.category)).sort((a, b) => mine.get(b.category) - mine.get(a.category) || (b.installs || 0) - (a.installs || 0)).slice(0, 12);
      if (reco.length >= 3) { const head = el('div', 'sxRowT'); head.append(el('b', '', 'Pour toi')); const row = el('div', 'sxScroll'); row.append(...reco.map(sxCard)); nodes.push(head, row); }
      const groups = new Map(); for (const i of items) { const c = i.category || 'Autre'; if (!groups.has(c)) groups.set(c, []); groups.get(c).push(i); }
      for (const [c, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
        const head = el('div', 'sxRowT'), more = el('button', 'btn px', 'TOUT VOIR'); more.onclick = () => { $('nsCat').value = c; sxRender(); };
        head.append(el('b', '', c + ' · ' + list.length), more);
        const row = el('div', 'sxScroll'); row.append(...list.slice(0, 14).map(sxCard)); nodes.push(head, row);
      }
      { const txt = 'Les plugins approuvés sont vérifiés par NeoDex. Les autres sont « non vérifiés » : ils passent l\'antivirus avant installation ; installe-les seulement si tu as confiance en leur source.';
        if (typeof nsaCounter === 'function') { const c = el('div', 'nsCounter'); c.append(nsaCounter(), el('div', 'nsBoard', txt)); nodes.push(c); } else nodes.push(el('div', 'hint', txt)); }
    }
  }
  body.replaceChildren(...nodes);
}
async function storeOpen() { await storeLoad(); }
['nsSearch'].forEach(i => $(i).oninput = () => { nsx.open = null; sxRender(); });
for (const i of ['nsCat', 'nsState', 'nsKind', 'nsSync', 'nsSort']) $(i).onchange = () => { nsx.open = null; nsx.author = ''; sxRender(); };
neo.onPluginsChanged(() => { if (active?.app === APPS['neodex:store']) storeLoad(); });
$('nsRefresh').onclick = () => storeLoad(true);  // ACTUALISER : on redemande au serveur (sans coût si rien n'a changé)
