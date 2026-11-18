/* NeoDex sur téléphone : le navigateur à onglets. Sur PC, chaque onglet web est une balise <webview> d'Electron (web/browser.js).
   Ici, document.createElement('webview') rend une balise <webview> ordinaire (vide) à qui on ajoute ce qu'Electron lui donne :
   src, loadURL, goBack, canGoBack, reload, executeJavaScript… et ses événements (page-title-updated, did-navigate, did-finish-load…).
   Le site lui-même s'affiche dans une vraie WebView Android (NeoBrowserPlugin.java), posée par-dessus la page, à la place exacte de la
   balise : toutes les 200 ms on regarde où est la balise, si elle se voit, et si rien ne passe devant (menu, fenêtre) ; sinon la WebView
   est cachée. web/browser.js marche donc sans rien changer.
   Dans un navigateur d'essai (pas d'appli Android), le site s'affiche dans une iframe (beaucoup de sites la refusent : ça suffit pour essayer). */
(() => {
  const nb = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.NeoBrowser : null;
  const make = document.createElement.bind(document), views = new Map();
  let n = 0, timer = 0;

  document.createElement = function (tag, opts) {
    const e = make(tag, opts);
    if (String(tag).toLowerCase() === 'webview') wire(e);
    return e;
  };

  function wire(v) {
    const id = 'w' + (++n) + '-' + Date.now().toString(36), s = { url: 'about:blank', title: '', back: false, fwd: false, created: false, gone: 0, placed: '', frame: null };
    views.set(id, { v, s });
    const act = (what, extra = {}) => {
      if (!s.created) return Promise.resolve();
      if (nb) return nb.act({ id, what, ...extra });
      const f = s.frame;   // navigateur d'essai : l'iframe
      if (what === 'load') f.src = extra.url; else if (what === 'reload') f.src = f.src;   // pas de « retour » : l'iframe ne dit pas son historique
      return Promise.resolve();
    };
    Object.defineProperty(v, 'src', { configurable: true, get: () => s.url, set: u => { s.url = String(u); act('load', { url: s.url }); } });
    Object.assign(v, {
      loadURL: u => { s.url = String(u); return act('load', { url: s.url }); },
      goBack: () => act('back'), goForward: () => act('fwd'), reload: () => act('reload'), stop: () => act('stop'),
      canGoBack: () => s.back, canGoForward: () => s.fwd, getURL: () => s.url, getTitle: () => s.title, isLoading: () => false,
      getWebContentsId: () => 0, setAudioMuted: () => {}, isAudioMuted: () => false, focus: () => {}, openDevTools: () => window.toast?.('L’inspecteur n’existe pas sur téléphone', true),
      // le résultat du code dans la page du site (sans attendre une promesse, contrairement à Electron)
      executeJavaScript: code => nb && s.created ? nb.act({ id, what: 'eval', code: String(code) }).then(r => JSON.parse(r?.json ?? 'null')) : Promise.reject(new Error('page pas prête')),
    });
    tick();
  }
  const fire = (v, type, props = {}) => v.dispatchEvent(Object.assign(new Event(type), props));

  nb?.addListener('web', d => {
    const e = views.get(d.id); if (!e) return;
    const { v, s } = e;
    if (d.type === 'title') { s.title = d.title; fire(v, 'page-title-updated', { title: d.title }); }
    else if (d.type === 'icon') fire(v, 'page-favicon-updated', { favicons: [d.icon] });
    else if (d.type === 'nav' || d.type === 'load') {
      s.back = !!d.back; s.fwd = !!d.fwd;
      if (d.url && d.url !== s.url) { s.url = d.url; fire(v, 'did-navigate', { url: d.url }); }
      if (d.type === 'load') { fire(v, 'did-finish-load'); fire(v, 'did-stop-loading'); }
    }
    else if (d.type === 'full') fire(v, d.on ? 'enter-html-full-screen' : 'leave-html-full-screen');
    else if (d.type === 'popup') window.newTab?.(d.url, true, true);
    else if (d.type === 'download') window.toast?.(d.ok ? 'Téléchargement : ' + d.name + ' (dans Téléchargements/NeoDex)' : 'Téléchargement ouvert dans le navigateur du téléphone : ' + d.name);
  });

  // ---------- la place de chaque onglet : montré seulement s'il se voit et que rien ne passe devant ----------
  const inside = (v, x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === v || v.contains(h)); };
  function shown(v) {
    if (!v.isConnected || !v.offsetParent || getComputedStyle(v).visibility !== 'visible') return null;
    const r = v.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return null;
    const pts = [[.5, .5], [.1, .1], [.9, .1], [.1, .9], [.9, .9]];   // un menu, une fenêtre ou une notification devant : la WebView se cache
    if (!pts.every(([a, b]) => inside(v, r.left + r.width * a, r.top + r.height * b))) return null;
    return r;
  }
  function tick() {
    clearTimeout(timer); let any = false;
    for (const [id, { v, s }] of views) {
      if (!v.isConnected) {   // retirée de la page (onglet fermé) : détruite au bout d'une seconde, pas si elle revient tout de suite
        if (s.created && ++s.gone > 5) { views.delete(id); nb?.act({ id, what: 'destroy' }).catch(() => {}); }
        continue;
      }
      s.gone = 0;
      if (!s.created) {   // comme sur PC : le site commence à charger quand sa balise entre dans la page
        s.created = true;
        if (nb) nb.create({ id, url: s.url }).catch(() => {});
        else { s.frame = make('iframe'); s.frame.style.cssText = 'border:0;width:100%;height:100%;background:#fff'; s.frame.src = s.url; v.append(s.frame);
          s.frame.onload = () => { try { s.title = s.frame.contentDocument.title; } catch {} fire(v, 'did-finish-load'); }; }
      }
      if (!nb) continue;
      const r = shown(v); if (r) any = true;
      const key = r ? [r.left, r.top, r.width, r.height].map(Math.round).join() + ',' + innerWidth : 'x';
      if (key === s.placed) continue;
      s.placed = key;
      nb.place(r ? { id, show: true, x: r.left, y: r.top, w: r.width, h: r.height, pw: innerWidth } : { id, show: false }).catch(() => {});
    }
    // un onglet web à l'écran : on surveille vite (un menu qui passe devant doit le cacher tout de suite) ; sinon plus calmement,
    // et showTab (plus bas) relance tout de suite quand on change d'onglet
    if (views.size) timer = setTimeout(tick, any ? 200 : 700);
  }

  // ---------- « Sites et données » (web/sites.js, le même écran que sur PC) ----------
  // Android ne donne pas la liste des sites qui ont des cookies : on note ici chaque site ouvert dans un onglet (clé « sites » :
  // {hôte: {last, keep}}), et NeoBrowser.cookies compte ses cookies. Pas d'autorisations par site sur téléphone (Android les demande lui-même).
  const shell = window.__neoShell, { impl, load, save, emit } = shell;
  let sites = {};
  shell.ready.then(() => { sites = load('sites', {}); });
  const host = u => { try { const h = new URL(u).hostname; return /^https?:/.test(u) && h ? h.replace(/^www\./, '') : ''; } catch { return ''; } };
  const seen = u => { const h = host(u); if (!h) return; const s = sites[h] ||= {}; if (Date.now() - (s.last || 0) > 60e3) { s.last = Date.now(); save('sites', sites); } };
  nb?.addListener('web', d => { if (d.type === 'nav' && d.url) seen(d.url); });
  const both = h => [h, 'www.' + h];   // les cookies de « www.site » et de « site »
  const clear = async hs => (await nb?.clearSites({ hosts: hs.flatMap(both) }))?.cookies || 0;
  Object.assign(impl, {
    sitesList: async () => {
      const hs = Object.keys(sites), c = nb ? (await nb.cookies({ hosts: hs.flatMap(both) }).catch(() => null))?.counts || {} : {};
      return hs.map(h => ({ host: h, cookies: (c[h] || 0) + (c['www.' + h] || 0), expires: 0, keep: !!sites[h].keep, perms: {} }));
    },
    sitesClear: async h => { const n = await clear([String(h)]); emit('onSitesChanged'); return n; },
    sitesKeep: async ({ host: h, keep }) => { (sites[h] ||= {}).keep = !!keep; save('sites', sites); emit('onSitesChanged'); return true; },
    // « Effacer les autres » : rien de gardé → vraiment tout (même les sites ouverts avant que NeoDex les note)
    sitesClearOthers: async () => {
      const hs = Object.keys(sites).filter(h => !sites[h].keep), all = !Object.values(sites).some(s => s.keep);
      const cookies = all ? (await impl.sitesList()).reduce((a, x) => a + x.cookies, 0) : await clear(hs);
      if (all) await nb?.clearSites({ all: true });
      emit('onSitesChanged'); return { sites: hs.length, cookies };
    },
    sitesClearOnExit: async on => impl.setSettings({ clearOnExit: !!on }),
    permSet: async () => true,
  });
  // « Effacer à la fermeture » : sur téléphone on ne sait pas quand l'appli est fermée pour de bon ; c'est donc fait au lancement suivant
  shell.ready.then(async () => { if ((await impl.getSettings()).clearOnExit) impl.sitesClearOthers().catch(() => {}); });
  addEventListener('DOMContentLoaded', () => {
    if (typeof showTab === 'function') { const show = showTab; window.showTab = (...a) => { const r = show(...a); if (views.size) setTimeout(tick, 0); return r; }; }
  });
  addEventListener('DOMContentLoaded', () => {   // les textes de l'écran, écrits pour le PC
    const hint = document.querySelector('#stList + .hint');
    if (hint) hint.textContent = 'Chaque site ouvert dans un onglet est noté ici. « Effacer » retire ses cookies et ses données (tu seras déconnecté de ce site) ; « Garder connecté » le protège quand tu effaces les autres.';
    const lab = document.getElementById('stClearExit')?.parentNode, txt = lab && [...lab.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
    if (txt) txt.nodeValue = ' Au lancement de NeoDex, effacer les sites qui ne sont pas gardés connectés';
  });

  // le bouton « retour » d'Android (neo-mobile.js, __neoBack) : d'abord la vidéo en plein écran, puis la page d'avant de l'onglet
  window.__neoWebBack = () => {
    const t = typeof active !== 'undefined' ? active : null;   // l'onglet affiché (web/browser.js)
    if (!t || t.app || !t.v?.canGoBack) return false;
    if (document.body.classList.contains('vfs')) { t.v.goBack(); return true; }
    if (t.v.canGoBack()) { t.v.goBack(); return true; }
    return false;
  };
})();
