/* NeoDex sur téléphone : la synchro avec les PC (fgestion). Sur PC c'est app/sync-main.js ; ici, la même fusion (web/neosync.js) :
   - le téléphone est un appareil de la synchro, avec sa case dans le fichier commun « NeoDex-synchro.neodex » (le PC le garde à jour
     dès qu'un téléphone en fait partie). Ce fichier est choisi une fois dans Paramètres (Android garde le droit de le lire et l'écrire) ;
   - il emporte ce que le téléphone a : raccourcis, agenda, notes, budget, journal, jeux, bureautique, outils, NeoPDF, NeoMe, les réglages
     communs, et les données des plugins installés ici ('pd/<plugin>/<nom>', comme sur PC) ;
   - ce que le téléphone n'a pas (la liste des plugins du PC, les données d'un plugin pas installé ici, les tuiles des applis du PC) est
     renvoyé tel que les autres appareils l'ont mis : jamais effacé par le téléphone ;
   - chiffré si un appareil l'a chiffré (neo-sync-crypto.js, même format que le PC) : le mot de passe s'entre dans fgestion.
   Chargé après neo-plugins.js (il a besoin des fichiers et de la liste des plugins). */
(() => {
  const { impl, load, save, emit, files } = window.__neoShell, NS = window.NeoSync, SC = window.NeoSyncCrypto;
  if (!NS || !SC) return console.error('synchro : neosync.js ou neo-sync-crypto.js manquant');
  const nf = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.NeoFile : null;
  const io = () => nf || window.__neoSyncTestIO;   // le navigateur d'essai : un faux fichier posé par le test
  const STORES = ['links', 'agenda', 'notes', 'budget', 'journal', 'games'], MORE = ['office', 'tools', 'pdf', 'pet'];
  const NO_SYNC = ['v', 'tabs', 'syncFile', 'syncDir', 'vpn', 'vpnCountry', 'bigText', 'extensions'];   // comme app/sync-main.js
  const PHONE_ONLY = ['dockOn', 'dock', 'pixelCursor', 'fullscreen', 'openAtLogin', 'closeToTray', 'hotkey', 'pip', 'appTiles', 'restoreTabs', 'clearOnExit'];   // réglés pour le téléphone (neo-mobile.js) : ni envoyés, ni remplacés
  const PC_APPS = ['neodex:sound', 'neodex:files', 'neodex:security'];
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));
  let cfg = {}, st = null, pass = null, busy = null, again = false, info = { devices: [], outdated: [], error: '', needPass: false, apk: null }, last = 0;

  const plugins = async () => Object.fromEntries((await impl.pluginsList()).map(p => [p.id, p]));
  const shared = p => p && p.syncMode !== 'aucune';
  const state = async () => st ||= (await files.fget('sync/state')) || NS.newState(crypto.randomUUID(), 'Téléphone', 'phone');
  const getPass = async () => pass ??= (await files.fget('sync/pass')) || '';   // shortcut: le mot de passe est gardé en clair dans le stockage de l'appli (pas lisible par les autres applis) ; le passer au coffre Android (Keystore) si on veut mieux

  // ---------- ce que le téléphone a, section par section ----------
  async function local(base) {
    const s = clone(base || {}), pl = await plugins();
    for (const n of STORES) { const v = load('api:' + n, null); if (v != null) s[n] = v; }
    for (const n of MORE) { const v = load('store:' + n, null); if (v != null) s[n] = v; }
    // les raccourcis : ceux que le téléphone ne montre pas (applis du PC, plugins pas installés ici) gardent leur place, ceux du téléphone remplissent le reste
    if (Array.isArray(s.links)) {
      const hidden = l => PC_APPS.includes(l?.target) || (/^plugin:/.test(l?.target || '') && !pl[l.target.slice(7)]);
      const mine = s.links.filter(l => !hidden(l)), old = Array.isArray(base?.links) ? base.links : [];
      s.links = old.map(l => hidden(l) ? l : mine.shift()).filter(Boolean).concat(mine);
    }
    const set = await impl.getSettings();
    s.settings = { ...(base?.settings || {}), ...Object.fromEntries(Object.entries(set).filter(([k]) => !NO_SYNC.includes(k) && !PHONE_ONLY.includes(k))) };
    for (const k of await files.fkeys('doc/')) {   // doc/<plugin>/<nom>
      const [, id, name] = k.split('/');
      if (shared(pl[id])) s['pd/' + id + '/' + name] = await files.fget(k);
    }
    return s;   // shortcut: un document de plugin effacé sur le téléphone n'est pas effacé ailleurs (il est renvoyé tel quel) ; à faire si un plugin efface des documents
  }
  async function apply(data, had) {
    const pl = await plugins();
    for (const [k, v] of Object.entries(data)) {
      if (NS.eq(v, had[k] ?? undefined)) continue;
      if (STORES.includes(k) && v != null) { save('api:' + k, v); emit('onDataChanged', k); }
      else if (MORE.includes(k) && v != null) { save('store:' + k, v); emit('onDataChanged', k); }
      else if (k === 'settings' && v) {
        const set = await impl.getSettings(), ok = Object.fromEntries(Object.entries(v).filter(([n, x]) => !NO_SYNC.includes(n) && !PHONE_ONLY.includes(n) && n in set && typeof x === typeof set[n]));
        await impl.setSettings(ok); emit('onSettingsChanged');
      } else if (/^pd\/[^/]+\/[^/]+$/.test(k)) {
        const [, id, name] = k.split('/');
        if (!shared(pl[id])) continue;
        if (v == null) await files.fdel('doc/' + id + '/' + name); else await files.fput('doc/' + id + '/' + name, v);
        emit('onPluginDataChanged', { id, name });
      }   // 'plugins' : la liste des plugins du PC n'est jamais appliquée ici (les plugins du téléphone s'installent sur le téléphone)
    }
  }
  // les règles de fusion des plugins installés ici (app/plugins-main.js, syncRules)
  async function rules() {
    const pl = await plugins(), raw = load('plugins', { installed: {} }).installed, auto = [], union = [], progress = [];
    const rx = (id, d, p) => '^' + ('pd/' + id + '/' + d + '.' + p).replace(/[.+?^$|(){}\[\]\\\/]/g, '\\$&').replace(/\*/g, '[^.]+') + '$';
    for (const [id, p] of Object.entries(pl)) {
      if (p.syncMode === 'progression') progress.push('^pd/' + id.replace(/[.\-]/g, '\\$&') + '/');
      for (const [d, r] of Object.entries(raw[id]?.manifest?.sync || {})) { for (const x of r.union || []) union.push(rx(id, d, x)); for (const x of r.auto || []) auto.push(rx(id, d, x).replace(/\$$/, '') + '(\\.|$)'); }
    }
    return { auto, union, progress };
  }

  // ---------- une synchro ----------
  async function readFile() {
    const o = NS.firstJson((await io().read({ uri: cfg.uri })).text);
    if (!SC.sealed(o)) return o;
    if (!await getPass()) throw Object.assign(new Error('La synchro est chiffrée par un autre appareil : entre son mot de passe de synchro dans fgestion.'), { code: 'SYNC_PASS' });
    return JSON.parse(await SC.open(o, pass));
  }
  async function run(loud) {
    if (!cfg.uri || !io()) return;
    if (busy) { again = true; return busy; }
    return busy = (async () => {
      try {
        const remote = await readFile();
        if (remote?.neobase !== 1 && remote?.neobase !== 2) throw new Error('ce n’est pas un fichier de synchro NeoDex');
        await state();
        const before = st.conflicts.length, had = await local(st.data);
        NS.setRules(await rules());
        const r = NS.sync(st, remote, had, { app: 'Téléphone ' + (window.NEO_MOBILE_VERSION || '') });
        if (r.readOnly) throw new Error('Le fichier de synchro vient d’une version plus récente de NeoDex : mets l’appli à jour. Rien n’est écrit en attendant.');
        await apply(r.data, had);
        // chiffré si ce téléphone a un mot de passe (et réécrit chiffré s'il était encore en clair)
        if (r.file || (await getPass() && !SC.sealed(NS.firstJson((await io().read({ uri: cfg.uri })).text)))) {
          const text = JSON.stringify(r.file || NS.upgrade(remote));
          await io().write({ uri: cfg.uri, text: pass ? await SC.seal(text, pass) : text });
        }
        await files.fput('sync/state', st);
        const out = r.file || NS.upgrade(remote);
        info = { devices: Object.entries(out.devices).map(([id, d]) => ({ id, name: d.name, kind: d.kind, app: d.app, at: d.at, editAt: d.editAt, me: id === st.id, newer: (d.schema || 0) > NS.SCHEMA })),
          outdated: r.outdated, error: '', needPass: false, apk: out.apk || null };
        last = Date.now();
        if (r.changedBy.length || st.conflicts.length !== before) emit('onSyncChanged', st.conflicts.length);
        if (st.conflicts.length > before) window.toast?.(st.conflicts.length + ' conflit(s) de synchro : ouvre fgestion', true);
        else if (loud) window.toast?.('Synchronisé');
      } catch (e) {
        console.error('synchro :', e.message); info = { ...info, error: e.message, needPass: e.code === 'SYNC_PASS' };
        if (loud) window.toast?.('Synchro impossible : ' + e.message, true);
      } finally { busy = null; if (again) { again = false; run(); } }
    })();
  }
  // ce qui a été écrit ici depuis la dernière synchro (stockage du téléphone, documents des plugins) : sans ce repère, toutes les 20 s,
  // toutes les données étaient relues et comparées, ce qui faisait ramer le téléphone
  let dirty = true;
  window.__neoShell.ready.then(() => { cfg = load('sync', {}); });
  window.__neoShell.onSaved(n => { if (/^(api:|store:|settings$)/.test(n)) dirty = true; });
  for (const n of ['pluginFolder', 'pluginStorage']) { const f = impl[n]; if (f) impl[n] = async (...a) => { const r = await f(...a); if (n === 'pluginStorage' ? a[1] !== undefined : /^(write|remove)$/.test(a[1])) dirty = true; return r; }; }
  // toutes les 20 s : une synchro si quelque chose a changé ici, et au moins toutes les 2 minutes pour ce qui vient des autres
  async function tick() {
    try { if (cfg.uri && !document.hidden && (dirty || Date.now() - last > 120e3)) { dirty = false; await run(); } } catch {}
    setTimeout(tick, 20000);
  }
  setTimeout(tick, 5000);
  document.addEventListener('visibilitychange', () => { if (cfg.uri) run(); });   // en revenant dans l'appli, et en la quittant (pour envoyer ce qui vient d'être fait)

  // ---------- fgestion et Paramètres ----------
  // ne plante jamais sur un état de synchro abîmé ou d'une version d'avant (des listes manquantes) : fgestion doit toujours s'ouvrir
  const fgState = async () => {
    const s = await state();
    if (!Array.isArray(s.conflicts)) s.conflicts = [];
    if (!Array.isArray(s.log)) s.log = [];
    return { me: { id: s.id, name: s.name }, file: cfg.uri ? cfg.name || 'fichier de synchro' : '', last, ...info, readOnly: false, encrypted: !!await getPass().catch(() => ''), syncSize: 0, backupSize: 0,
      sections: [...STORES, 'plugins', ...MORE, 'settings'],
      conflicts: s.conflicts.filter(c => c && Array.isArray(c.leaves)).map(({ leaves, ...c }) => ({ ...c, fields: leaves.map(l => ({ path: l.path, mine: l.mine, theirs: l.theirs, presence: l.presence })), both: NS.canKeepBoth(c) })),
      log: s.log.slice(0, 120), backups: [] };
  };
  const pcOnly = async () => { throw new Error('les sauvegardes se font sur PC (fgestion du PC)'); };
  Object.assign(impl, {
    chooseSync: async () => {
      if (!io()) throw new Error('le choix du fichier se fait sur le téléphone');
      const r = await io().pick(); if (!r?.uri) return (await impl.getSettings()).syncFile;
      cfg = { uri: r.uri, name: r.name || 'NeoDex-synchro.neodex' }; save('sync', cfg);
      await impl.setSettings({ syncFile: cfg.name }); emit('onSettingsChanged');
      await run(true);
      return cfg.name;
    },
    stopSync: async () => { await run(); cfg = {}; save('sync', cfg); await impl.setSettings({ syncFile: '' }); info = { devices: [], outdated: [], error: '', needPass: false, apk: null }; return ''; },
    syncStatus: async () => ({ file: cfg.uri ? cfg.name : '', last, others: info.devices.filter(d => !d.me).map(d => d.name), pending: !!busy, error: info.error }),
    fgState,
    fgSync: async () => { await run(true); return fgState(); },
    fgSyncPass: async p => {
      p = String(p || '');
      if (p) {
        if (p.length < 8) throw new Error('8 caractères au moins');
        if (cfg.uri && io()) { const o = NS.firstJson((await io().read({ uri: cfg.uri })).text); if (SC.sealed(o)) await SC.open(o, p); }   // faux : « mot de passe de synchro incorrect »
        await files.fput('sync/pass', p);
      } else await files.fdel('sync/pass');
      pass = p; await run(); return fgState();
    },
    fgResolve: async (id, choice) => {
      if (!['mine', 'theirs', 'both'].includes(choice)) throw new Error('choix inconnu');
      const s = await state(), had = await local(s.data), data = NS.resolve(s, id, choice, had);
      if (!data) throw new Error('ce conflit est déjà réglé');
      await apply(data, had); await files.fput('sync/state', s);
      run(); return fgState();
    },
    fgBackup: pcOnly, fgRestore: pcOnly, fgPrune: pcOnly,
  });
  // le réglage d'une version d'avant (aucun fichier choisi) : « syncFile » vidé, pour que Paramètres ne dise pas « Synchro active »
  window.__neoShell.ready.then(async () => { if (!cfg.uri) { const s = await impl.getSettings(); if (s.syncFile) impl.setSettings({ syncFile: '' }); } });
})();
