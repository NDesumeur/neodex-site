/* NeoDex sur téléphone : les plugins (NeoStore, installation, données des plugins).
   C'est la version téléphone de app/plugins-main.js du PC : mêmes noms de fonctions (neo.pluginsXxx), mêmes réponses, pour que
   la page (web/store.js, web/plugins.js) marche sans rien changer. Chargé juste après neo-mobile.js, qui lui passe ses outils
   par window.__neoShell.

   Où sont rangées les choses :
     - la liste des plugins installés : stockage du téléphone, clé « neo:plugins » (petit) ;
     - les fichiers des plugins et leurs données : base IndexedDB « neodex », table « files » (pas de limite à 5 Mo) :
         plugin/<id>/<chemin>   un fichier du plugin (octets)
         doc/<id>/<nom>         un document du plugin (objet JSON) — « storage » est son document principal
         file/<id>/<nom>        un fichier de données du plugin (octets)

   Ce qui diffère du PC, et pourquoi :
     - l'antivirus : Windows Defender n'existe pas sur téléphone. Un plugin non vérifié passe quand même deux contrôles du PC
       (app/security-main.js) : la liste de virus connus en ligne (seule l'empreinte du fichier part) et les signes simples
       (nom piégé, programme caché dans l'archive). Voir scan() ;
     - les autorisations suivent les règles du PC (registre app/perm-registry.js, recopié tel quel par build-www.js dans window.NEO_REG) :
       les autorisations ordinaires sont accordées à l'installation, les sensibles sont demandées (à l'installation ou à l'usage)
       et réservées aux plugins signés. Mais ce qui a besoin de Windows (lancer un programme, terminal, volet système « main ») ne peut
       rien faire sur un téléphone, même accordé ;
     - un plugin qui ne dit pas marcher sur Android est refusé à l'installation (on lit son plugin.json après téléchargement). */
(() => {
  const { impl, realFetch, load, save, emit } = window.__neoShell;
  const REG = window.NEO_REG, PUBKEY = window.NEO_PUBKEY || '';   // recopiés du PC par build-www.js (app/perm-registry.js, app/plugin-keys.js)
  const GH_API = 'https://api.github.com', CATALOG = 'https://raw.githubusercontent.com/NDesumeur/neodex-store-catalog/main/';
  const REPO_RE = /^[\w.-]{1,100}\/[\w.-]{1,100}$/, ID_RE = /^[a-z0-9]+(\.[a-z0-9]+)+$/;

  // ---------- la base de fichiers (IndexedDB) ----------
  const db = new Promise((ok, ko) => { const r = indexedDB.open('neodex', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const tx = async (mode, fn) => { const d = await db; return new Promise((ok, ko) => { const t = d.transaction('files', mode), r = fn(t.objectStore('files')); t.oncomplete = () => ok(r && r.result); t.onerror = t.onabort = () => ko(t.error || new Error('stockage refusé')); }); };
  const range = prefix => IDBKeyRange.bound(prefix, prefix + '￿');
  const fget = k => tx('readonly', s => s.get(k)), fput = (k, v) => tx('readwrite', s => s.put(v, k)), fdel = k => tx('readwrite', s => s.delete(k));
  const fkeys = prefix => tx('readonly', s => s.getAllKeys(range(prefix))), fwipe = prefix => tx('readwrite', s => s.delete(range(prefix)));

  window.__neoShell.files = { fget, fput, fdel, fkeys, fwipe };   // la même base sert au coffre-fort (neo-vault.js)

  // ---------- octets, texte, base64 ----------
  const text = u8 => new TextDecoder().decode(u8);
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

  // ---------- Internet ----------
  // Sur le vrai téléphone, on passe par le téléchargeur natif de Capacitor (CapacitorHttp) : le fetch d'une page web est bloqué par
  // les règles « CORS » des sites (les archives des plugins sur github.com, par exemple). Dans un navigateur de test, il ne reste que fetch.
  const native = () => window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.CapacitorHttp : null;
  async function bytes(url) {
    const http = native();
    if (http) { const r = await http.get({ url, responseType: 'arraybuffer', headers: { 'User-Agent': 'NeoDex' } }); if (r.status >= 400) throw new Error('le serveur répond ' + r.status); return unb64(r.data); }
    let r; try { r = await realFetch(url, { signal: AbortSignal.timeout(60000) }); }
    catch {   // refusé par le site (CORS). En essai sur PC (page servie en http par mobile/tools/serve.js), on passe par son relais /__dl
      if (location.protocol !== 'http:') throw new Error('téléchargement impossible (' + new URL(url).hostname + ')');
      r = await realFetch('/__dl?u=' + encodeURIComponent(url), { signal: AbortSignal.timeout(60000) });
    }
    if (!r.ok) throw new Error('le serveur répond ' + r.status);
    return new Uint8Array(await r.arrayBuffer());
  }
  const json = async url => JSON.parse(text(await bytes(url)));
  // un JSON distant gardé 10 minutes en mémoire ; si le réseau lâche, la dernière copie connue
  const memo = new Map();
  async function cached(url, force) {
    const c = memo.get(url);
    if (c && !force && Date.now() - c.at < 600000) return c.data;
    try { const data = await json(url); memo.set(url, { at: Date.now(), data }); return data; } catch (e) { if (c) return c.data; throw e; }
  }

  // ---------- les plugins installés ----------
  const st = { installed: {} };
  window.__neoShell.ready.then(() => Object.assign(st, load('plugins', { installed: {} })));   // le stockage est lu au lancement (neo-mobile.js)
  const saveSt = () => { save('plugins', st); emit('onPluginsChanged'); };
  const permName = p => REG.normalize(String(p?.id || p).split(' ')[0]).name;
  const perms = m => (m.permissions || []).map(permName);
  const sensitive = n => !!REG.find(n)?.entry.sensitive;
  const pluginName = x => st.installed[x]?.manifest.name || x;
  // décision de Nolan : un plugin dont le code change pour téléphone a son propre dépôt « <dépôt>-phone » (même id) ;
  // catsync.js écrit sa dernière version publiée dans « phone » du catalogue, et le téléphone installe celle-là
  const phoneOf = p => typeof p.phone === 'string' && /^[\w.-]{1,40}$/.test(p.phone) ? { ...p, repo: p.repo + '-phone', version: p.phone } : p;
  const onAndroid = m => Array.isArray(m.compatibility) ? m.compatibility.includes('android') : !!m.mobile;   // la règle du PC (compatOf) : sans liste, « mobile: true » vaut Android
  const get = id => { const p = st.installed[id]; if (!p) throw new Error('plugin inconnu'); return p; };
  const pfile = (id, rel) => { rel = String(rel).replace(/\\/g, '/').replace(/^\.?\//, ''); if (rel.split('/').includes('..')) throw new Error('chemin interdit'); return 'plugin/' + id + '/' + rel; };
  const safe = n => { n = String(n); if (!/^[\w.\- ]{1,120}$/.test(n) || n.includes('..')) throw new Error('nom invalide'); return n; };

  const publicList = () => Object.entries(st.installed).map(([id, p]) => { const m = p.manifest; return {
    id, name: m.name, version: p.version, repo: p.repo, description: m.description || '', author: m.author || '', approved: p.approved, enabled: p.enabled, system: false,
    type: m.type, category: m.category, view: m.view, icon: m.icon, mobile: !!m.mobile, autoload: !!m.autoload, permissions: perms(m), uses: m.uses || [], perms: p.perms,
    used: {}, usedLog: [], net: [], session: [...session].filter(k => k.startsWith(id + '\0')).map(k => k.split('\0')[1]), sdk: m.sdk || '', dependencies: m.dependencies || {}, commands: m.commands || [], opens: m.opens || [], accepts: m.accepts || [],
    themes: m.themes || [], widget: !!m.widget, widgetView: typeof m.widget === 'string', syncMode: m.syncMode || (m.category === 'Jeux' ? 'progression' : 'fusion'), syncInfo: m.syncInfo || '',
    compatibility: m.compatibility || ['android'], previous: '', skip: '', updatedAt: p.installedAt || 0, notifTypes: (Array.isArray(m.notifications) ? m.notifications : []).filter(t => /^[a-z0-9-]{1,40}$/.test(t?.type || '')).slice(0, 20).map(t => ({ type: t.type, name: String(t.name || t.type).slice(0, 60), description: String(t.description || '').slice(0, 240) })) }; });   // notifTypes : les types de notification déclarés (plugin.json « notifications »), comme sur PC

  // ---------- NeoStore : le catalogue (copie de discover() du PC) ----------
  // approuvés : ceux du catalogue qui disent marcher sur Android. Proposés (hors catalogue, non vérifiés) : tous, car leur fiche ne dit pas
  // sur quoi ils marchent ; c'est à l'installation, en lisant leur plugin.json, qu'on refuse ceux qui ne sont pas faits pour Android.
  const catalog = force => cached(CATALOG + 'index.json', force);
  const storeList = force => cached(CATALOG + 'store.json', force).then(s => Array.isArray(s?.plugins) ? s.plugins : null, () => null);
  const isRevoked = (cat, id, version) => (cat.revoked || []).some(r => r.id === id && (r.version === '*' || r.version === version));
  async function discover(force) {
    const cat = await catalog(force), store = await storeList(force), stats = {};
    for (const id of Object.keys(st.installed)) if (isRevoked(cat, id, st.installed[id].version)) await uninstall(id, true);   // retiré du catalogue pour raison de sécurité : désinstallé (données gardées)
    for (const p of store || []) if (typeof p.id === 'string') stats[p.approved ? p.id : p.repo] = { updated: typeof p.updated === 'string' ? p.updated : '', installs: +p.installs || 0, stars: +p.stars || 0, rating: { average: +p.rating?.average || 0, count: +p.rating?.count || 0 }, langs: Array.isArray(p.langs) ? p.langs : ['fr'], en: p.en && typeof p.en.name === 'string' ? { name: String(p.en.name).slice(0, 80), description: String(p.en.description || '').slice(0, 600) } : null };
    const proposed = (store || []).filter(p => !p.approved && REPO_RE.test(p.repo || '')).map(p => ({ repo: p.repo, stars: +p.stars || 0, description: String(p.description || '').slice(0, 600), name: String(p.name || '').slice(0, 80) }));
    return { neobase: window.NEO_MOBILE_VERSION || '0', updated: cat.updated || '', approved: (cat.plugins || []).filter(onAndroid).map(phoneOf), proposed, revoked: cat.revoked || [], stats };
  }

  // la fiche d'un plugin : son README et les notes de sa version (copie de pluginDoc() du PC, sans la traduction automatique)
  async function pluginDoc(repo, version) {
    repo = String(repo); version = String(version || '');
    if (!REPO_RE.test(repo) || (version && !/^[\w.-]{1,40}$/.test(version))) throw new Error('dépôt invalide');
    const en = window.I18N_LANG === 'en', raw = f => realFetch('https://raw.githubusercontent.com/' + repo + '/HEAD/' + f, { signal: AbortSignal.timeout(15000) }).then(r => r.ok ? r.text() : '', () => '');
    const readme = (en && await raw('README.en.md')) || await raw('README.md');
    const rel = version ? await cached(GH_API + '/repos/' + repo + '/releases/tags/v' + version).catch(() => null) : null;
    const [fr, enNotes] = String(rel?.body || '').split('<!-- en -->');
    return { readme: readme.slice(0, 60000), at: rel?.published_at || '', notes: ((en && enNotes) || fr).trim().slice(0, 8000) };
  }
  // les avis : ceux que le robot du catalogue a rangés dans store.json (copie de reviews() du PC, sans le secours par l'API de GitHub)
  const REVIEWS_REPO = 'NDesumeur/neodex-store-catalog';
  async function reviews(id) {
    const s = (await storeList(false))?.find(p => p.id === id && p.approved), list = Array.isArray(s?.rating?.list) ? s.rating.list : [];
    return { repo: REVIEWS_REPO, list: list.slice(0, 20).map(r => ({ who: String(r.who || ''), stars: Math.min(5, Math.max(1, +r.stars || 1)), text: String(r.text || '').slice(0, 2000), at: String(r.at || ''), url: /^https:\/\/github\.com\//.test(r.url) ? r.url : '' })), average: +s?.rating?.average || 0 };
  }

  // ---------- vérifier une archive : son empreinte (sha256) et la signature de NeoDex (ed25519), comme verifyAttestation() du PC ----------
  const canon = o => JSON.stringify(Object.fromEntries(Object.keys(o).filter(k => k !== 'signature').sort().map(k => [k, o[k]])));
  async function verifyAttestation(att, sha) {
    if (!att || !att.signature) return 'non signé';
    if (!PUBKEY) return 'aucune clé officielle dans NeoDex';
    let ok; try {
      const key = await crypto.subtle.importKey('spki', unb64(PUBKEY.replace(/-----[^-]+-----|\s/g, '')), { name: 'Ed25519' }, false, ['verify']);
      ok = await crypto.subtle.verify('Ed25519', key, unb64(att.signature), new TextEncoder().encode(canon(att)));
    } catch { return 'signature illisible (ce téléphone ne sait pas la vérifier)'; }
    if (!ok) return 'signature invalide';
    if (att.sha256 !== sha) return 'le fichier ne correspond pas à l\'approbation';
    return 'ok';
  }

  // ---------- ouvrir une archive .zip : la liste des fichiers est à la fin ; chaque fichier est rangé tel quel (0) ou compressé (8) ----------
  const ZIP_MAX = 300 << 20;   // 300 Mo une fois ouvert : au-delà on refuse (archive piégée)
  async function unzip(u8) {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), out = {};
    let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('archive illisible');
    let p = dv.getUint32(e + 16, true), total = 0;
    for (let i = dv.getUint16(e + 10, true); i > 0; i--) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('archive illisible');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), at = dv.getUint32(p + 42, true);
      const name = text(u8.subarray(p + 46, p + 46 + nl)).replace(/\\/g, '/'); p += 46 + nl + xl + cl;
      if (name.endsWith('/')) continue;
      if (name.startsWith('/') || name.split('/').includes('..')) throw new Error('chemin interdit dans l\'archive');
      if ((total += usize) > ZIP_MAX) throw new Error('archive trop grosse');
      const from = at + 30 + dv.getUint16(at + 26, true) + dv.getUint16(at + 28, true), raw = u8.subarray(from, from + csize);
      if (method === 0) out[name] = raw.slice();
      else if (method === 8) out[name] = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      else throw new Error('archive illisible (compression inconnue)');
    }
    return out;
  }

  function validateManifest(m) {
    if (!m || typeof m !== 'object') throw new Error('plugin.json manquant');
    if (!ID_RE.test(m.id || '')) throw new Error('identifiant invalide');
    if (!/^\d+\.\d+\.\d+$/.test(m.version || '')) throw new Error('version invalide');
    if (!['app', 'mod', 'theme'].includes(m.type)) throw new Error('type inconnu');
    if (!m.name || (m.type !== 'theme' && (!m.entry || !m.view))) throw new Error('manifeste incomplet');
    if (!onAndroid(m)) throw new Error('« ' + m.name + ' » n\'est pas fait pour téléphone');
  }

  // ---------- l'antivirus des plugins non vérifiés (judge() et engines.online() de app/security-main.js, adaptés) ----------
  // 1. la liste de virus connus de Team Cymru : on envoie seulement l'empreinte de l'archive, par une question DNS posée en https
  //    (dns.google), car une page ne peut pas poser de question DNS directe comme le fait le PC ;
  // 2. les signes simples du PC, appliqués à chaque fichier de l'archive, plus un signe propre aux plugins : un plugin est fait de
  //    pages, d'images et de scripts ; un programme (.exe, .apk, .dll…) n'a rien à y faire.
  const RUN = /\.(exe|msi|bat|cmd|com|scr|pif|ps1|vbs|vbe|jse|wsf|hta|lnk|dll|sys|apk|dex|so|jar|sh)$/i;
  async function online(zip) {
    try {
      const sha1 = hex(await crypto.subtle.digest('SHA-1', zip));
      const r = await realFetch('https://dns.google/resolve?type=TXT&name=' + sha1 + '.hash.cymru.com', { signal: AbortSignal.timeout(5000) }); if (!r.ok) return null;
      const j = await r.json(); if (j.Status === 3 || !j.Answer) return j.Status === 0 || j.Status === 3 ? 0 : null;   // inconnu de la liste : 0 ; pas de réponse : null
      return +String(j.Answer[0].data).replace(/"/g, '').split(' ')[1] || 0;   // « date pourcentage » : la part des antivirus qui le connaissent
    } catch { return null; }
  }
  function judge(names, hits) {
    const r = [], add = (level, text) => r.push({ level, text });
    if (hits >= 20) add('danger', hits + ' % des antivirus le connaissent comme un virus.');
    else if (hits > 0) add('warn', hits + ' % des antivirus le signalent : c\'est peu, ça peut être une erreur.');
    for (const n of names) {
      const base = n.split('/').pop();
      if (/\u202e/.test(n)) add('danger', 'Le fichier « ' + base.replace(/\u202e/g, '') + ' » a un caractère invisible qui retourne le texte, pour cacher sa vraie extension.');
      else if (/\.(pdf|docx?|xlsx?|pptx?|txt|jpe?g|png|gif|mp[34]|mkv|avi)[\s.]*\.\w+$/i.test(n) && RUN.test(n)) add('danger', '« ' + base + ' » se fait passer pour un document alors que c\'est un programme.');
      else if (/\s{3,}\.\w+$/.test(n) && RUN.test(n)) add('danger', 'Le nom de « ' + base.trim() + ' » est rempli d\'espaces pour cacher son extension.');
      else if (RUN.test(n)) add('warn', 'L\'archive contient un programme (« ' + base + ' ») : un plugin n\'en a pas besoin.');
    }
    return { verdict: r.some(x => x.level === 'danger') ? 'danger' : r.some(x => x.level === 'warn') ? 'suspect' : 'clean', reasons: r, online: hits != null };
  }
  console.assert(judge(['index.js', 'img/a.png'], 0).verdict === 'clean' && judge(['photo.jpg.exe'], 0).verdict === 'danger' && judge(['bin/outil.apk'], 0).verdict === 'suspect' && judge(['a.js'], 5).verdict === 'suspect' && judge(['a.js'], 80).verdict === 'danger' && judge(['fac\u202egpj.exe'], null).verdict === 'danger', 'judge');
  const scan = async (zip, names) => judge(names, await online(zip));

  // ---------- installer (copie de install() du PC) : télécharge, vérifie, ouvre, contrôle, range ----------
  const installing = new Set();
  async function install({ id, repo, version, bundleUrl, attestation, force = false, acceptPerms = false, dep = false }) {
    const cat = await catalog();
    if (!bundleUrl && repo && id && version) {   // plugin du catalogue : l'adresse directe de ses fichiers, sans l'API de GitHub (60 demandes par heure)
      const base = 'https://github.com/' + repo + '/releases/download/v' + version + '/';
      bundleUrl = base + id + '-' + version + '.zip'; attestation = attestation ?? base + 'attestation.json';
    }
    if (!bundleUrl && repo) {   // plugin proposé : sa dernière publication
      if (!REPO_RE.test(repo)) throw new Error('dépôt invalide');
      const rel = await json(GH_API + '/repos/' + repo + '/releases/latest'), assets = rel.assets || [], zip = assets.find(a => /\.zip$/i.test(a.name)), a = assets.find(a => /attestation\.json$/i.test(a.name));
      if (!zip) throw new Error('la publication ne contient pas d\'archive .zip');
      bundleUrl = zip.browser_download_url; attestation = attestation ?? (a ? a.browser_download_url : null);
    }
    if (!bundleUrl) throw new Error('rien à installer');
    const zip = await bytes(bundleUrl), sha = hex(await crypto.subtle.digest('SHA-256', zip));
    if (id && isRevoked(cat, id, version)) throw new Error('Ce plugin a été retiré pour raison de sécurité.');
    const att = attestation ? (typeof attestation === 'object' ? attestation : await json(attestation).catch(() => null)) : null;
    const sig = att ? await verifyAttestation(att, sha) : 'non signé', approved = sig === 'ok';
    if (att && !approved) throw new Error('Approbation refusée : ' + sig);   // une attestation présente mais fausse : on bloque
    if (id && !approved) throw new Error('Approbation introuvable : ce plugin du catalogue n\'est pas signé');   // un plugin du catalogue est toujours signé

    const files = await unzip(zip);
    let verdict = 'approuvé';
    if (!approved) {   // plugin non vérifié : il passe l'antivirus avant d'être posé
      const s = await scan(zip, Object.keys(files)); verdict = s.verdict;
      if (s.verdict === 'danger') throw new Error('Installation refusée par l\'antivirus : ' + s.reasons[0].text);
      if (s.verdict === 'suspect' && !force) return { needsConfirm: true, verdict: 'suspect', reason: s.reasons[0].text };   // NeoStore demande confirmation puis renvoie force:true
    }
    if (!files['plugin.json']) throw new Error('plugin.json manquant');
    const manifest = JSON.parse(text(files['plugin.json']));
    validateManifest(manifest);
    if (id && manifest.id !== id) throw new Error('le plugin ne porte pas l\'identifiant attendu');
    if (version && manifest.version !== version) throw new Error('la version ne correspond pas à l\'approbation');
    if (approved && (att.pluginId !== manifest.id || att.version !== manifest.version)) throw new Error('l\'approbation est celle d\'un autre plugin');
    for (const n of perms(manifest)) { const bad = REG.check(n, { signed: true }); if (bad) throw new Error(bad); }
    // une mise à jour qui demande PLUS que la version installée, ou une première installation avec des autorisations sensibles : rien n'est posé
    // sans ton accord (NeoStore te montre quoi, puis renvoie acceptPerms). Un plugin non signé ne reçoit jamais une autorisation réservée aux signés.
    const before = st.installed[manifest.id], had = before ? perms(before.manifest) : [];
    const added = perms(manifest).filter(n => before ? !had.includes(n) : !dep && sensitive(n)).filter(n => approved || !REG.find(n)?.entry.signedOnly);
    const removed = had.filter(n => !perms(manifest).includes(n)).map(n => REG.describe(n, pluginName));
    if (added.length && !acceptPerms) return { needsPermConsent: true, fresh: !before, id: manifest.id, name: manifest.name, version: manifest.version, added: added.map(n => REG.describe(n, pluginName)), removed };
    // shortcut: une dépendance déjà installée est acceptée quelle que soit sa version ; comparer les versions (satisfies() du PC) quand un plugin mobile en dépendra vraiment
    for (const dep of Object.keys(manifest.dependencies || {})) {
      if (st.installed[dep]) continue;
      const c = (cat.plugins || []).map(phoneOf).find(x => x.id === dep);
      if (!c) throw new Error('dépend du plugin « ' + dep + ' », introuvable au catalogue');
      if (installing.has(dep)) throw new Error('dépendances circulaires avec « ' + dep + ' »');
      installing.add(dep); try { await install({ id: dep, repo: c.repo, version: c.version, force, dep: true }); } finally { installing.delete(dep); }
    }

    await fwipe('plugin/' + manifest.id + '/');
    for (const [name, data] of Object.entries(files)) await fput(pfile(manifest.id, name), data);
    // les autorisations ordinaires sont accordées à l'installation ; les sensibles seulement si tu viens de les accepter (sinon demandées à l'usage) ; tes choix d'avant sont gardés
    const prev = st.installed[manifest.id], acc = new Set(acceptPerms ? added : []), granted = {};
    for (const n of perms(manifest)) { if (prev?.perms?.[n]) granted[n] = prev.perms[n]; else if (acc.has(n) || !sensitive(n)) granted[n] = 'allow'; }
    st.installed[manifest.id] = { version: manifest.version, repo: repo || prev?.repo || '', approved, sha256: sha, enabled: prev ? prev.enabled : true, manifest, perms: granted, installedAt: Date.now() };
    saveSt();
    return { id: manifest.id, manifest, approved, version: manifest.version, scan: verdict, removed };
  }

  async function uninstall(id, keepData = false) {
    if (!st.installed[id]) return false;
    await fwipe('plugin/' + id + '/');
    if (!keepData) { await fwipe('doc/' + id + '/'); await fwipe('file/' + id + '/'); }
    delete st.installed[id]; saveSt(); return true;
  }

  // ---------- les autorisations (requestPerm(), needPerm() et setPerm() du PC) ----------
  // « allow » = toujours, « deny » = refusée, rien = à demander. « Cette fois » vaut jusqu'à la fermeture de l'appli (session).
  const session = new Set(), asking = new Map(), answers = new Map();
  const declared = (p, n) => perms(p.manifest).includes(n) || (n.startsWith('data:') && n.endsWith(':read') && (p.manifest.uses || []).includes(n.slice(5, -5)));
  const valid = n => !REG.check(n);
  function setPerm(id, name, state) {
    const n = permName(name), p = st.installed[id]; if (!p || !valid(n)) return false;
    session.delete(id + '\0' + n);
    if (state === 'ask') delete p.perms[n]; else p.perms[n] = state === 'allow' ? 'allow' : 'deny';
    saveSt(); return true;
  }
  function answer(id, name, allow) {   // la réponse à la fenêtre « AUTORISATION » de la page (web/plugins.js)
    const n = permName(name), k = id + '\0' + n, p = st.installed[id];
    if (!p || !valid(n) || !declared(p, n)) return;
    if (allow === 'once') session.add(k); else setPerm(id, n, allow ? 'allow' : 'deny');
    const f = answers.get(k); answers.delete(k); if (f) f(allow);
  }
  function request(id, name, why = '') {
    const n = permName(name), p = st.installed[id];
    if (!p || !valid(n) || !declared(p, n)) return Promise.resolve(false);   // jamais une autorisation que le plugin n'a pas déclarée
    if (REG.find(n).entry.signedOnly && !p.approved) return Promise.resolve(false);   // réservée aux plugins signés par NeoDex
    const k = id + '\0' + n;
    if (session.has(k)) return Promise.resolve(true);
    if (p.perms[n]) return Promise.resolve(p.perms[n] === 'allow');
    if (!asking.has(k)) asking.set(k, new Promise(ok => {
      const t = setTimeout(() => { asking.delete(k); ok(false); }, 120e3);   // sans réponse : refusé pour cette fois
      answers.set(k, allow => { clearTimeout(t); asking.delete(k); ok(!!allow); });
      emit('onPluginAskPerm', { ...REG.describe(n, pluginName), id, name: n, plugin: p.manifest.name, why: String(why).slice(0, 200), approved: p.approved });
    }));
    return asking.get(k);
  }
  const denied = (n, why) => Object.assign(new Error('PERMISSION_DENIED : ' + n + ' (' + why + ')'), { code: 'PERMISSION_DENIED' });
  async function need(id, name, why) {
    const n = permName(name), p = st.installed[id]; if (!p) throw denied(n, 'plugin inconnu');
    if (p.approved && p.perms.full === 'allow') return;   // « accès complet » (plugin signé) vaut toutes les autres
    if (!declared(p, n)) throw denied(n, 'non déclarée dans plugin.json');
    if (!await request(id, n, why)) throw denied(n, p.perms[n] === 'deny' ? 'refusée' : 'pas accordée');
  }

  // ---------- les données d'un plugin (folderOp() du PC) ----------
  async function folder(id, op, a, b) {
    await need(id, 'storage');
    switch (op) {
      case 'read': return (await fget('doc/' + id + '/' + safe(a))) ?? null;
      case 'write': await fput('doc/' + id + '/' + safe(a), b); return true;
      case 'remove': await fdel('doc/' + id + '/' + safe(a)); return true;
      case 'list': return (await fkeys('doc/' + id + '/')).map(k => k.slice(('doc/' + id + '/').length));
      case 'readFile': { const v = await fget('file/' + id + '/' + safe(a)); return v ? b64(v) : null; }
      case 'writeFile': { const v = unb64(String(b)); if (v.length > 15 << 20) throw new Error('fichier trop gros (15 Mo au plus)'); await fput('file/' + id + '/' + safe(a), v); return true; }
      case 'removeFile': await fdel('file/' + id + '/' + safe(a)); return true;
      case 'listFiles': return (await fkeys('file/' + id + '/')).map(k => k.slice(('file/' + id + '/').length));
    }
    throw new Error('opération inconnue');
  }

  // Internet pour un plugin : seulement les sites qu'il a déclarés, jamais une adresse du réseau de la maison
  const privateHost = h => h === 'localhost' || /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)/.test(h) || !h.includes('.');
  async function net(id, url, opts) {
    if (!/^https?:\/\//i.test(url)) throw new Error('lien invalide');
    const host = new URL(url).hostname, perm = REG.netPermFor(perms(get(id).manifest), host);
    await need(id, perm || 'network:' + host, perm ? '' : 'domaine non déclaré');
    if (privateHost(host)) throw new Error('adresse locale refusée : ' + host);
    const http = native();
    if (http) { const r = await http.request({ url, method: opts?.method || 'GET', headers: opts?.headers || {}, data: opts?.body, responseType: 'text' }); return { ok: r.status >= 200 && r.status < 300, status: r.status, body: typeof r.data === 'string' ? r.data : JSON.stringify(r.data) }; }
    const r = await realFetch(url, opts); return { ok: r.ok, status: r.status, body: await r.text() };
  }

  const fileText = async (id, rel) => { const v = await fget(pfile(id, rel)); if (!v) throw new Error('fichier introuvable : ' + rel); return text(v); };
  Object.assign(impl, {
    pluginsList: async () => publicList(),
    pluginsDiscover: force => discover(!!force),
    pluginsDoc: pluginDoc,
    pluginsReviews: id => reviews(String(id)),
    pluginsInstall: install,
    pluginsUninstall: uninstall,
    pluginsEnable: async (id, on) => { get(id).enabled = !!on; saveSt(); return true; },
    pluginsPermSet: async (id, name, state) => setPerm(id, name, state),
    pluginsPermReset: async id => { const p = get(id); p.perms = Object.fromEntries(perms(p.manifest).filter(n => !sensitive(n)).map(n => [n, 'allow'])); for (const k of [...session]) if (k.startsWith(id + '\0')) session.delete(k); saveSt(); return true; },
    pluginPermAnswer: (id, name, allow) => answer(String(id), String(name), allow),
    pluginsLog: async () => [],
    pluginNotify: async (id, n) => { await need(id, 'notifications', 'envoyer une notification'); return window.__neoShell.notify(n, id, pluginName(id)); },   // plugin:notify de app/main.js (le centre : neo-notifs.js)
    permsDescribe: async names => (names || []).map(n => REG.describe(n, pluginName)),   // comme perms:describe et perms:risky de app/plugins-main.js
    permsRisky: async names => REG.risky((names || []).map(permName)),
    pluginsEntry: async (id, kind) => { const p = get(id); if (!p.enabled) throw new Error('plugin désactivé'); const rel = kind === 'widget' ? p.manifest.widget : p.manifest.entry; if (typeof rel !== 'string') throw new Error('pas de widget à dessiner'); return fileText(id, rel); },
    pluginsLocale: async id => { try { const j = JSON.parse(await fileText(id, 'locales/en.json')); return j && typeof j === 'object' && !Array.isArray(j) ? j : null; } catch { return null; } },
    // le décor d'un thème apporté par un plugin, nettoyé comme sur PC pour ne rien charger d'Internet
    pluginsThemeCss: async (id, tid, part) => { const p = st.installed[id], t = p?.enabled ? (p.manifest.themes || []).find(x => x.id === tid) : null, f = t?.[part === 'taskbar' ? 'taskbar' : 'css']; if (!f) return '';
      return (await fileText(id, f)).slice(0, 400e3).replace(/\\/g, '').replace(/@import[^;]*;?/gi, '').replace(/url\(\s*(?!['"]?data:(?:image|font)\/)[^)]*\)/gi, 'none'); },
    pluginRequest: (id, name, why) => request(id, name, why),
    pluginStorage: async (id, data) => { await need(id, 'storage'); if (data === undefined) return (await fget('doc/' + id + '/storage')) ?? null; await fput('doc/' + id + '/storage', data); return true; },
    pluginFolder: folder,
    pluginFileRead: async (id, rel) => { await need(id, 'files'); const v = await fget(pfile(id, rel)); if (!v) throw new Error('fichier introuvable : ' + rel); return b64(v); },
    pluginNet: net,
  });
  window.__neoPluginsTest = { unzip, verifyAttestation, judge, online };   // pour l'essai du script mobile/tools/… et de la console
})();
