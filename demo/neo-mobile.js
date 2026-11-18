/* NeoDex sur téléphone : la couche qui remplace Windows.
   La page de NeoDex (le dossier web/, le même que sur PC) ne touche jamais au système elle-même. Sur PC, elle passe par l'objet
   window.neo, que lui donne Electron (app/preload.js), et par les adresses /api/… du petit serveur local (app/server-main.js).
   Ici, on lui donne les mêmes deux choses, faites pour un téléphone :
     - window.neo : les fonctions utiles sur téléphone sont écrites ci-dessous (réglages, données, plugins…) ;
       celles qui n'ont pas de sens sur téléphone (barre des tâches Windows, terminal, explorateur…) répondent « rien » sans planter,
       et leur nom est noté dans window.__neoMissing pour savoir ce que la page a demandé ;
     - fetch('/api/…') : les données de l'accueil (liens, agenda, notes, stats) sont lues et écrites dans le stockage du téléphone.
   Ce fichier est chargé avant tous les autres scripts de la page (voir mobile/tools/build-www.js). */
(() => {
  // ---------- le stockage : IndexedDB (base « neodex-kv », une valeur JSON par nom), lu une seule fois au lancement dans `mem` ----------
  // load/save restent immédiats ; les écritures partent dans IndexedDB juste après (et tout de suite quand l'appli passe en arrière-plan).
  // Avant : localStorage, limité à environ 5 Mo, qui pouvait se remplir avec beaucoup de notes ou de données de plugins ; ses clés « neo:<nom> »
  // sont déplacées ici au premier lancement. Les appels de la page (window.neo, /api/…) attendent `ready`.
  const mem = new Map(), pend = new Set(), savedCbs = [];
  let db = null, flushT = 0, readyDone = false;   // db null après `ready` : IndexedDB manque, on écrit dans le stockage du navigateur
  const flush = () => new Promise(ok => {
    clearTimeout(flushT); flushT = 0;
    if (!pend.size || !readyDone) return ok();   // avant `ready`, rien n'est écrit : ready le fera
    if (!db) { for (const n of pend) try { mem.has(n) ? localStorage.setItem('neo:' + n, mem.get(n)) : localStorage.removeItem('neo:' + n); } catch (e) { console.error('stockage plein :', n, e); } pend.clear(); return ok(); }
    const tx = db.transaction('kv', 'readwrite'), os = tx.objectStore('kv');
    for (const n of pend) mem.has(n) ? os.put(mem.get(n), n) : os.delete(n);
    pend.clear(); tx.oncomplete = tx.onerror = tx.onabort = () => ok();
  });
  const ready = (async () => {
    try {
      const d = await new Promise((ok, ko) => { const r = indexedDB.open('neodex-kv', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
      // ce qui a été écrit avant la fin de la lecture (pend) est plus récent : gardé
      await new Promise((ok, ko) => { const tx = d.transaction('kv'), c = tx.objectStore('kv').openCursor(); c.onsuccess = () => { const k = c.result; if (k) { if (!pend.has(k.key)) mem.set(k.key, k.value); k.continue(); } }; tx.oncomplete = ok; tx.onerror = () => ko(tx.error); });
      db = d;
    } catch (e) { console.error('IndexedDB indisponible : stockage du navigateur', e); }
    const old = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('neo:')) old.push(k); } } catch {}
    for (const k of old) { const n = k.slice(4); if (!mem.has(n) && !pend.has(n)) { mem.set(n, localStorage.getItem(k)); if (db) pend.add(n); } }
    readyDone = true;
    await flush();
    if (db) for (const k of old) localStorage.removeItem(k);   // déplacées seulement une fois bien écrites dans IndexedDB
  })();
  const load = (name, def) => { let v = mem.get(name); if (v == null && !readyDone) try { v = localStorage.getItem('neo:' + name); } catch {} if (v == null) return def; try { return JSON.parse(v); } catch { return def; } };
  const save = (name, v) => {
    const s = JSON.stringify(v);
    if (s === undefined) mem.delete(name); else mem.set(name, s);
    pend.add(name); if (readyDone) flushT ||= setTimeout(flush, 250);
    for (const f of savedCbs) try { f(name); } catch {}
  };
  addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  // les morceaux d'une exportation (Paramètres › Données) : le premier motif qui va au nom de la valeur l'emporte, le reste va dans « Autres »
  const EXPORT_GROUPS = [['Raccourcis et sites', /^(api:links|sites)$/], ['Agenda et rappels', /^(api:agenda|notifs)$/], ['Notes, journal et budget', /^api:(notes|journal|budget)$/],
    ['Jeux et applis', /^(api:games|store:)/], ['Plugins', /^(plugins|pd\/|doc\/)/], ['Paramètres et synchro', /^(settings|sync|fix:)/]];
  const groupOf = k => (EXPORT_GROUPS.find(g => g[1].test(k)) || ['Autres'])[0];
  EXPORT_GROUPS.push(['Autres', /$^/]);
  addEventListener('pagehide', () => flush());

  const realFetch = window.fetch.bind(window);   // le vrai fetch, gardé avant qu'on intercepte /api/… plus bas

  // ---------- les événements : la page s'abonne par neo.onXxx(fonction) ; emit('onXxx', …) appelle ses fonctions ----------
  const subs = {};
  const emit = (name, ...args) => (subs[name] || []).forEach(cb => { try { cb(...args); } catch (e) { console.error(e); } });
  window.__neoEmit = emit;

  // ---------- les réglages : les valeurs par défaut du PC (recopiées de app/main.js par build-www.js), avec ce qui change sur téléphone ----------
  // les applis intégrées réservées au PC, jamais montrées sur téléphone : le volume du PC, l'explorateur de fichiers du PC, la protection de Windows (Defender,
  // quarantaine). fgestion (la synchro) a sa version téléphone : neo-sync.js ; « Sites et données » aussi : neo-browser.js.
  const PC_APPS = ['neodex:sound', 'neodex:files', 'neodex:security'];
  const settings = Object.assign({}, window.NEO_DEFAULTS, {
    dockOn: false, dock: [],            // pas de barre d'applis à gauche sur téléphone : la barre du haut la remplace
    pixelCursor: false, fullscreen: false, openAtLogin: false, closeToTray: false, hotkey: false, pip: false,
    clearOnExit: false,   // « Effacer à la fermeture » de Sites et données (sur PC : app/sites-main.js)
    restoreTabs: false,   // les onglets d'avant ne se rouvrent pas au lancement : chaque plugin rouvert tournait en fond et ralentissait le téléphone
    appTiles: [...PC_APPS],   // « déjà posées » : l'accueil n'ajoute pas tout seul les tuiles des applis réservées au PC
  });
  const keep = s => { for (const k of Object.keys(settings)) if (s && k in s && typeof s[k] === typeof settings[k]) settings[k] = s[k]; };   // la même règle que le PC : un réglage inconnu ou du mauvais type est ignoré
  const big = () => document.documentElement.classList.toggle('mBig', !!settings.bigText);   // « Texte plus grand » : voir html.mBig dans mobile.css
  ready.then(() => {
    keep(load('settings', {})); big();
    if (!load('fix:restoreTabs', false)) { settings.restoreTabs = false; save('settings', settings); save('fix:restoreTabs', true); }   // une fois : la valeur venue du PC par la synchro (avant qu'elle soit propre au téléphone)
  });

  // ---------- la mise à jour de l'appli, en un clic comme sur PC (app/autoupdate.js) ----------
  // On lit la dernière publication de NDesumeur/neodex-releases ; si elle contient un fichier .apk plus récent que cette appli, le bandeau
  // de l'accueil (web/about.js) propose de l'installer. L'installation elle-même est faite par le plugin Java « NeoUpdate » de l'appli Android
  // (télécharge l'apk et ouvre l'installeur d'Android) ; sans lui (navigateur de test), on ouvre simplement le lien de l'apk.
  let upd = { state: 'none' }, apk = '';
  const setUpd = s => { upd = s; emit('onAppUpdate', s); return s; };
  const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
  async function checkUpdate() {
    try {
      const r = await realFetch('https://api.github.com/repos/NDesumeur/neodex-releases/releases/latest', { signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error('GitHub répond ' + r.status);
      const rel = await r.json(), version = String(rel.tag_name || '').replace(/^v/, ''), a = (rel.assets || []).find(x => /\.apk$/i.test(x.name));
      apk = a ? a.browser_download_url : '';
      return setUpd(a && newer(version, window.NEO_MOBILE_VERSION || '0') ? { state: 'available', version } : { state: 'none' });
    } catch (e) { return upd; }   // pas de réseau : on ne dérange pas, on réessaiera au prochain lancement
  }
  async function installUpdate() {
    if (!apk) return checkUpdate();
    const nat = window.Capacitor?.Plugins?.NeoUpdate;
    if (!nat) { window.open(apk, '_blank'); return upd; }
    try {
      setUpd({ state: 'downloading', version: upd.version, percent: 0 });
      const sub = await nat.addListener('progress', p => setUpd({ state: 'downloading', version: upd.version, percent: p.percent }));
      try { await nat.install({ url: apk }); } finally { sub?.remove?.(); }   // Android affiche ensuite son écran « Mettre à jour cette appli ? »
      setUpd({ state: 'ready', version: upd.version });
    } catch (e) { setUpd({ state: 'error', version: upd.version, message: String(e.message || e) }); }
  }
  setTimeout(checkUpdate, 8000);

  const impl = {
    mobile: true,   // la page peut savoir qu'elle tourne sur téléphone
    getSettings: async () => settings,
    setSettings: async s => {
      const bad = Object.keys(s || {}).filter(k => !(k in settings) || typeof s[k] !== typeof settings[k]);
      if (bad.length) console.warn('réglage ignoré : ' + bad.join(', '));
      keep(s); save('settings', settings); big(); return settings;
    },
    // les données des applis intégrées (storeGet/storeSet sur PC : un fichier par nom dans le dossier de données)
    storeGet: async name => load('store:' + name, null),
    storeSet: async (name, data) => { save('store:' + name, data); return true; },
    appInfo: async () => ({ version: window.NEO_MOBILE_VERSION || '0', platform: 'android', mobile: true }),
    getHistory: async () => [],
    otherStats: async () => ({}),   // shortcut: les statistiques des autres appareils ne sont pas lues dans le fichier de synchro ; à faire si l'accueil du téléphone doit les montrer
    secStatus: async () => ({ perms: [], noAsk: {}, log: [] }),   // la protection de Windows (Defender, quarantaine) n'existe pas ici : l'appli Sécurité est cachée (PC_APPS), la page Autorisations lit seulement ces listes vides
    crashState: async () => ({ safe: false, unclean: false, recent: [] }),
    activity: async () => ({ focused: document.hasFocus(), idle: 0 }),
    appUpdateState: async () => upd,
    appCheckUpdate: () => checkUpdate(),
    appInstallUpdate: () => installUpdate(),
    extList: async () => ({ list: [], short: [] }),   // les extensions Chrome n'existent pas sur téléphone
    downloadsList: async () => [],   // les téléchargements du navigateur : pas de navigateur à onglets sur téléphone pour l'instant
    win: () => {}, zoom: () => {}, menuSize: () => {}, siteCursor: () => {},
    // un fichier « téléchargé » par la page ou un plugin (lien download) : rangé dans Téléchargements/NeoDex par NeoFile.saveDownload ;
    // dans un navigateur d'essai, un vrai téléchargement. Rend { name, where }
    saveFile: async (name, b64, mime) => {
      const nf = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.NeoFile;
      if (nf) return nf.saveDownload({ name: String(name || 'fichier').slice(0, 120), data: String(b64), mime: String(mime || '') });
      const a = Object.assign(document.createElement('a'), { href: 'data:' + (mime || 'application/octet-stream') + ';base64,' + b64, download: String(name || 'fichier') }); a.click();
      return { name: a.download, where: 'Téléchargements' };
    },
    // Paramètres › Données : « Exporter » range tout le stockage du téléphone dans Téléchargements/NeoDex ; « Importer » le remet (puis recharge).
    // Format propre au téléphone {neodexPhone: 1, data: {nom: JSON}} : une exportation du PC ne se lit pas ici (passer par la synchro).
    // opts (Paramètres sur téléphone, web/settings.js) : {groups: [noms de EXPORT_GROUPS à emporter], pass: mot de passe du fichier, vide = en clair}.
    // Un fichier par appareil : le téléphone n'emporte que son propre stockage, la synchro reste le seul chemin entre appareils.
    exportGroups: async () => EXPORT_GROUPS.map(g => g[0]),
    exportData: async (opts = {}) => {
      await flush();
      const keep = opts.groups ? new Set(opts.groups) : null, data = Object.fromEntries([...mem].filter(([k]) => !keep || keep.has(groupOf(k))));
      let text = JSON.stringify({ neodexPhone: 1, at: Date.now(), data });
      if (opts.pass) text = await window.NeoSyncCrypto.seal(text, String(opts.pass));   // même chiffrement que le fichier de synchro (renvoie déjà du JSON)
      const b = new TextEncoder().encode(text);
      let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      const r = await impl.saveFile('NeoDex-donnees-' + new Date().toISOString().slice(0, 10) + '.json', btoa(bin), 'application/json');
      return (r?.where || 'Téléchargements') + '/' + (r?.name || '');
    },
    importData: async () => {
      const nf = window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.NeoFile;
      if (!nf) throw new Error('l’import se fait dans l’appli du téléphone');
      const p = await nf.pick(); if (!p?.uri) return false;
      let o; try { o = JSON.parse((await nf.read({ uri: p.uri })).text); } catch { throw new Error('ce fichier n’est pas une exportation de NeoDex'); }
      if (window.NeoSyncCrypto?.sealed(o)) {
        const pass = await window.__neoAskPass?.(); if (!pass) return false;
        try { o = JSON.parse(await window.NeoSyncCrypto.open(o, pass)); } catch { throw new Error('mauvais mot de passe'); }
      }
      if (o?.neodexPhone !== 1 || !o.data || typeof o.data !== 'object') throw new Error('ce fichier n’est pas une exportation de NeoDex sur téléphone');
      for (const [k, v] of Object.entries(o.data)) if (typeof v === 'string') { mem.set(k, v); pend.add(k); }
      await flush(); location.reload(); return true;
    },
    clearWebData: async () => { await window.Capacitor?.Plugins?.NeoBrowser?.clearSites?.({ all: true }); return true; },
  };

  // les outils passés aux autres fichiers du téléphone (neo-plugins.js…) ; onSaved(f) : f(nom) après chaque écriture (la synchro s'en sert)
  window.__neoShell = { impl, realFetch, load, save, emit, ready, flush, onSaved: f => savedCbs.push(f) };

  const missing = window.__neoMissing = new Set(), waiting = new Map();
  let isReady = false; ready.then(() => { isReady = true; });
  window.neo = new Proxy(impl, {
    get(t, k) {
      // avant que le stockage soit lu, une fonction attend `ready` (après, elle est appelée directement : rien de plus lent)
      if (!isReady && typeof t[k] === 'function') { if (!waiting.has(k)) waiting.set(k, (...a) => ready.then(() => t[k](...a))); return waiting.get(k); }
      if (k in t || typeof k !== 'string') return t[k];
      if (/^on[A-Z]/.test(k)) return cb => { (subs[k] ||= []).push(cb); };   // un abonnement : on garde la fonction
      missing.add(k);
      return async () => undefined;                                           // une demande sans équivalent sur téléphone : « rien »
    },
  });

  // ---------- la barre du haut du téléphone : une maison sur le bouton Accueil, et un bouton NeoStore avant Menu ----------
  // icônes en grilles de pixels ('#' = un pixel), comme les boutons de NeoDex
  const PIX = {
    home: ['....#....', '...###...', '..#####..', '.#######.', '#########', '.#.....#.', '.#.##..#.', '.#.##..#.', '.#######.'],
    bag: ['..###..', '.#...#.', '#######', '#.....#', '#.#.#.#', '#.....#', '#######'],
  };
  const pix = rows => { let d = ''; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') d += `M${x} ${y}h1v1H${x}z`; }));
    return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" fill="currentColor"><path d="${d}"/></svg>`; };
  addEventListener('DOMContentLoaded', () => {
    const home = document.getElementById('bHomeTab'), menu = document.getElementById('bMenu');
    if (!home || !menu) return;
    home.insertAdjacentHTML('beforeend', pix(PIX.home)); home.setAttribute('aria-label', 'Accueil');
    const store = document.createElement('button'); store.id = 'mStore'; store.type = 'button'; store.setAttribute('aria-label', 'NeoStore'); store.innerHTML = pix(PIX.bag);
    store.onclick = () => window.newTab && window.newTab('neodex:store');
    menu.before(store);
    // les applis intégrées qui pilotent Windows (le volume du PC, l'explorateur de fichiers du PC) n'ont rien à montrer sur téléphone :
    // retirées de la liste des applis, des tuiles de l'accueil et de NeoStore (APPS, TILES et SYSTEM_PLUGINS sont les tables de web/home.js)
    for (const id of PC_APPS) {
      try { delete APPS[id]; } catch {} try { delete TILES[id]; } catch {}
      try { const i = SYSTEM_PLUGINS.indexOf(id); if (i >= 0) SYSTEM_PLUGINS.splice(i, 1); } catch {}
    }
    // l'onglet qu'on vient d'ouvrir est amené dans la partie visible de la rangée
    const tabs = document.getElementById('bTabs');
    if (tabs) new MutationObserver(() => tabs.querySelector('.btab.on')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })).observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    // Agenda : la semaine défile de côté sur téléphone (mobile.css) ; à chaque affichage, le jour d'aujourd'hui est amené à gauche (renderAgenda vient de web/agenda.js)
    if (typeof renderAgenda === 'function') { const draw = renderAgenda; window.renderAgenda = (...a) => { const r = draw(...a); document.querySelector('#agGrid .agDay.today')?.scrollIntoView({ inline: 'start', block: 'nearest' }); return r; }; }
    // Notes : un bouton pour revenir de la note à la liste (sur PC les deux sont côte à côte)
    const ed = document.getElementById('naEditor');
    if (ed) { const b = document.createElement('button'); b.id = 'mNaBack'; b.type = 'button'; b.className = 'btn px'; b.textContent = '‹ Notes'; b.onclick = () => ed.classList.remove('on'); ed.prepend(b); }
    // Paramètres : les rubriques qui ne concernent que le PC (extensions Chrome, démarrage avec Windows, vue scindée, barre des tâches…) sont cachées, pas retirées :
    // web/settings.js remplit leurs cases à chaque ouverture et planterait si elles n'existaient plus
    const PC_ONLY = /^(Extensions Chrome|Vue scindée|Barre latérale|Barre d'applis|Fenêtre de recherche|Inspecter la page|Barre des tâches|Palette de commandes|Mode sans échec|En fond d'écran Windows)/i;
    // les cases à cocher qui ne concernent que Windows ou la souris (par l'identifiant de leur case, dans web/index.html)
    const PC_CHECKS = ['setLogin', 'setFull', 'setTray', 'setHotkey', 'setPip', 'setCursor', 'setGmail', 'setDiscord', 'nfDndGame'];
    const hideChecks = () => PC_CHECKS.forEach(id => document.getElementById(id)?.closest('label')?.classList.add('mPcOnly'));
    hideChecks();
    const hideCursorLabel = () => document.querySelectorAll('#setModal .setSec > .label').forEach(l => { if (l.textContent.trim() === 'Curseur') l.classList.add('mPcOnly'); });   // ses réglages (.lkKinds, .lkTwo) sont cachés par mobile.css
    const hidePc = () => { hideCursorLabel(); for (const e of document.querySelectorAll('#setModal .setSec, #setModal .setNav>*, #setModal button, .tbPop .tbtn')) if (PC_ONLY.test((e.querySelector('.label') || e).textContent.trim())) e.classList.add('mPcOnly'); };
    for (const id of ['bSettings', 'bMenu']) document.getElementById(id)?.addEventListener('click', () => { hidePc(); setTimeout(hidePc, 400); });   // le menu et les onglets des Paramètres sont fabriqués à la première ouverture
  });

  // ---------- les textes : la page est écrite pour un PC (« clic droit », « Ctrl+K », « ce PC », « Windows »…) ----------
  // Chaque texte qui apparaît est relu et ses mots de PC sont remplacés par ceux du téléphone. Seulement en français : en anglais,
  // web/i18n.js traduit à partir du texte français d'origine et ne le reconnaîtrait plus (les textes anglais gardent donc leurs mots de PC).
  const PC_WORDS = /\(F\d|Ctrl|Maj\+|souris|clic|\bPC\b|Windows|clavier|curseur|Démarrage et fenêtre/i;
  const TXT = [
    [/\s*\((?:Ctrl|Alt|Maj)\+[^)]*\)/g, ''],                                   // « Nouvel onglet (Ctrl+T) » -> « Nouvel onglet »
    [/\s*\((F\d{1,2}\b[^)]*)\)/g, ''],                                          // « CONTEMPLER (F9) », « (F11 pour basculer) »
    [/Ctrl\+K → « (\w+) »/g, 'Menu → « $1 »'], [/Le seul raccourci à retenir : Ctrl\+K\. /g, ''],
    [/Passe la souris sur un décor pour le voir bouger\./g, ''], [/Passe la souris ici/g, 'Touche ici'], [/Passe la souris sur/g, 'Touche'],
    [/Curseur de souris en pixel art, avec un petit effet au clic/g, 'Petit effet quand tu touches l’écran'],
    [/Double-clic/g, 'Double appui'], [/double-clic/g, 'double appui'], [/Clic droit/g, 'Appui long'], [/clic droit/g, 'appui long'],
    [/\bClique\b/g, 'Appuie'], [/\bclique\b/g, 'appuie'], [/\bun clic\b/g, 'un appui'], [/\bUn clic\b/g, 'Un appui'], [/\bau clic\b/g, 'à l’appui'],
    [/celle de Windows/g, 'celle du téléphone'], [/Celui de Windows/g, 'Celui du téléphone'], [/au démarrage de Windows/g, 'au démarrage du téléphone'], [/sans bulle Windows/g, 'sans bulle'],
    [/Polices et curseur/g, 'Polices'], [/POLICES ET CURSEUR/g, 'POLICES'], [/Démarrage et fenêtre/g, 'Démarrage'], [/DÉMARRAGE ET FENÊTRE/g, 'DÉMARRAGE'],
    [/Synchronisation entre\s+PC/g, 'Synchronisation avec le PC'], [/SYNCHRONISATION ENTRE\s+PC/g, 'SYNCHRONISATION AVEC LE PC'],
    [/\bCE PC\b/g, 'CE TÉLÉPHONE'], [/\b(sur|de|à) ce PC\b/g, '$1 ce téléphone'], [/\bce PC\b/g, 'ce téléphone'], [/\bCe PC\b/g, 'Ce téléphone'],
    [/\bchaque PC\b/g, 'chaque appareil'], [/\bun autre PC\b/g, 'un autre appareil'], [/\b(des |les |aux )?autres PC\b/g, '$1autres appareils'], [/\bun PC\b/g, 'un appareil'],
    [/\bton PC\b/g, 'ton téléphone'], [/\bdu PC\b/g, 'du téléphone'], [/\btes PC et ton téléphone\b/g, 'ton PC et ton téléphone'],
    [/souris ou clavier/g, 'écran touché'],
  ];
  const fix = t => { if (!PC_WORDS.test(t)) return t; for (const [re, to] of TXT) t = t.replace(re, to); return t; };
  console.assert(fix('Nouvel onglet (Ctrl+T)') === 'Nouvel onglet' && fix('Automatique (celle de Windows)') === 'Automatique (celle du téléphone)' && fix('clic droit : cacher') === 'appui long : cacher' && fix('Bonjour') === 'Bonjour', 'textes');
  const ATTRS = ['title', 'placeholder', 'aria-label'];
  function fixNode(n) {
    if (n.nodeType === 3) { const v = fix(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'TEXTAREA') return;
    for (const a of ATTRS) { const v = n.getAttribute(a); if (v) { const f = fix(v); if (f !== v) n.setAttribute(a, f); } }
    for (const c of n.childNodes) fixNode(c);
  }
  addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.lang === 'en') return;
    fixNode(document.body);
    new MutationObserver(list => { for (const m of list) { if (m.type === 'characterData') fixNode(m.target); else if (m.type === 'attributes') fixNode(m.target); else m.addedNodes.forEach(fixNode); } })
      .observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  });

  // ---------- le bouton « retour » d'Android : il ferme ce qui est ouvert, du plus récent au plus ancien ----------
  // L'appli Android (MainActivity) appelle window.__neoBack() ; si elle répond false, il n'y a plus rien à fermer et l'appli passe en arrière-plan.
  window.__neoBack = () => {
    const view = document.getElementById('mVaultView'); if (view) { view.querySelector('.mClose').click(); return true; }   // l'aperçu d'un fichier du coffre
    const pop = document.querySelector('.tbPop.on'); if (pop) { document.body.click(); if (pop.classList.contains('on')) pop.classList.remove('on'); return true; }
    const dlg = [...document.querySelectorAll('#nbDialog.on, #modal.on, #evModal.on, #setModal.on, #histModal.on, #quitModal.on, #askModal.on')].pop();
    if (dlg) { (dlg.querySelector('.x, [id$=Close]') || dlg).click(); if (dlg.classList.contains('on')) dlg.classList.remove('on'); return true; }
    const note = document.querySelector('#naEditor.on'); if (note && note.offsetParent) { note.classList.remove('on'); return true; }   // d'une note à la liste des notes
    if (window.__neoWebBack?.()) return true;   // un onglet web : sa page d'avant (neo-browser.js)
    // l'onglet ouvert se ferme et l'accueil revient (choix de Nolan) ; sauf le plugin qui joue de la musique : il continue derrière l'accueil
    const t = typeof active !== 'undefined' ? active : null;
    if (t) { if (!(/^plugin:/.test(t.url || '') && window.__neoMusicPlaying?.())) closeTab(t); showTab(null); return true; }
    return false;
  };

  // ---------- /api/… : les données de l'accueil ----------
  const STORES = ['links', 'agenda', 'notes', 'stats', 'budget', 'journal', 'games'];
  const reply = (v, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (url, opts) => {
    if (typeof url !== 'string' || !url.startsWith('/api/')) return realFetch(url, opts);
    if (!isReady) await ready;
    const name = url.slice(5).split('?')[0];
    if (!STORES.includes(name)) { missing.add('api:' + name); return Promise.resolve(reply({ error: 'pas sur téléphone' }, 404)); }
    if (opts && opts.method === 'POST') { save('api:' + name, JSON.parse(opts.body)); return Promise.resolve(reply({ ok: true })); }
    let data = load('api:' + name, null);   // null = premier lancement, comme sur PC
    if (name === 'links' && Array.isArray(data)) data = data.filter(l => !PC_APPS.includes(l?.target));   // leurs tuiles déjà posées par une version d'avant disparaissent
    return Promise.resolve(reply(data));
  };
})();
