/* NeoDex sur téléphone : le coffre-fort (fichiers chiffrés par un mot de passe).
   Version téléphone des fonctions « vault:… » de app/apps2-main.js : mêmes noms (neo.vaultXxx), mêmes réponses, pour que la page
   (web/vault-app.js) marche sans rien changer.
   Le chiffrement : la clé est tirée du mot de passe (PBKDF2, 600 000 tours, SHA-256), chaque fichier est chiffré en AES-256-GCM.
   Le PC utilise scrypt, que les navigateurs n'ont pas : un coffre de téléphone et un coffre de PC ne sont donc pas le même fichier
   (ils ne sont pas synchronisés de toute façon). Rien n'est gardé en clair : sans le mot de passe, les fichiers sont perdus.
   Rangement (base IndexedDB de neo-plugins.js) : vault/meta (sel + témoin), vault/index (liste chiffrée), vault/f/<id> (un fichier chiffré).
   Les codes à deux facteurs et les mots de passe de sites du coffre PC ne sont pas faits ici : leurs cartes restent vides. */
(() => {
  const { impl, files } = window.__neoShell, { fget, fput, fdel, fwipe } = files;
  let key = null, index = [];
  const rnd = n => crypto.getRandomValues(new Uint8Array(n));
  const kdf = async (pw, salt) => crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']), { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  // un bloc chiffré : 12 octets tirés au hasard (iv), puis le contenu chiffré et son sceau
  const seal = async (k, buf) => { const iv = rnd(12), body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, buf)), out = new Uint8Array(12 + body.length); out.set(iv); out.set(body, 12); return out; };
  const open = async (k, u8) => new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.subarray(0, 12) }, k, u8.subarray(12)));
  const needOpen = () => { if (!key) throw new Error('le coffre est fermé'); };
  const saveIndex = async () => fput('vault/index', await seal(key, new TextEncoder().encode(JSON.stringify(index))));
  const item = id => { needOpen(); const it = index.find(i => i.id === id); if (!it) throw new Error('introuvable'); return it; };
  const plain = async it => new Blob([await open(key, await fget('vault/f/' + it.id))], { type: it.type || 'application/octet-stream' });

  // choisir des fichiers : sur PC la page reçoit des chemins ; ici elle reçoit des jetons « pick:n » qui désignent les fichiers choisis
  const picked = new Map(); let seq = 0;
  const pick = () => new Promise(ok => {
    const i = Object.assign(document.createElement('input'), { type: 'file', multiple: true });
    i.onchange = () => ok([...i.files].map(f => { const t = 'pick:' + (++seq); picked.set(t, f); return t; }));
    i.oncancel = () => ok([]);
    i.click();
  });
  // montrer un fichier déchiffré sans le poser en clair sur le téléphone : image, vidéo, son et texte s'affichent dans la page ; le reste est proposé en téléchargement
  function show(blob, name) {
    const url = URL.createObjectURL(blob), t = blob.type, box = document.createElement('div');
    box.style.cssText = 'position:fixed;inset:0;z-index:99;background:rgba(0,0,0,.92);display:grid;place-items:center;padding:12px;overflow:auto';
    const el = /^image\//.test(t) ? Object.assign(new Image(), { src: url }) : /^video\//.test(t) ? Object.assign(document.createElement('video'), { src: url, controls: true }) : /^audio\//.test(t) ? Object.assign(document.createElement('audio'), { src: url, controls: true }) : null;
    if (!el && !/^text\/|json/.test(t)) { save(blob, name).catch(e => console.warn(e)); return; }
    const body = el || document.createElement('pre');
    if (!el) { body.style.cssText = 'color:#fff;white-space:pre-wrap;word-break:break-word;align-self:start;width:100%'; blob.text().then(x => { body.textContent = x.slice(0, 200000); }); }
    else body.style.cssText = 'max-width:100%;max-height:100%';
    box.append(body); box.onclick = e => { if (e.target === box || el instanceof Image) { box.remove(); URL.revokeObjectURL(url); } };
    const close = Object.assign(document.createElement('button'), { className: 'mClose', textContent: 'FERMER' });
    close.onclick = () => { box.remove(); URL.revokeObjectURL(url); };
    box.append(close); box.id = 'mVaultView'; document.body.append(box);
  }
  // un fichier déchiffré : rangé dans Téléchargements/NeoDex (impl.saveFile de neo-mobile.js)
  const save = async (blob, name) => { const u = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => ko(r.error); r.readAsDataURL(blob); });
    const r = await impl.saveFile(name, u.slice(u.indexOf(',') + 1), blob.type); return r?.name || name; };

  Object.assign(impl, {
    convPick: pick,
    vaultStatus: async () => ({ exists: !!await fget('vault/meta'), open: !!key }),
    vaultCreate: async pw => {
      if (await fget('vault/meta')) throw new Error('un coffre existe déjà');
      if (typeof pw !== 'string' || pw.length < 8) throw new Error('mot de passe trop court (8 caractères minimum)');
      const salt = rnd(16); key = await kdf(pw, salt); index = [];
      await fput('vault/meta', { v: 1, salt, check: await seal(key, new TextEncoder().encode('NeoDex')) }); await saveIndex(); return true;
    },
    vaultUnlock: async pw => {
      const m = await fget('vault/meta'); if (!m) throw new Error('pas de coffre');
      const k = await kdf(String(pw), m.salt);
      try { await open(k, m.check); } catch { throw new Error('mot de passe incorrect'); }
      key = k; const i = await fget('vault/index'); index = i ? JSON.parse(new TextDecoder().decode(await open(key, i))) : []; return true;
    },
    vaultLock: async () => { key = null; index = []; document.getElementById('mVaultView')?.remove(); return true; },
    vaultList: async () => { needOpen(); return index; },
    vaultAdd: async ({ paths }) => {
      needOpen(); const added = [];
      for (const t of paths || []) {
        const f = picked.get(t); if (!f) continue; picked.delete(t);
        if (f.size > 200 << 20) throw new Error('« ' + f.name + ' » est trop gros (200 Mo au plus sur téléphone)');
        const id = crypto.randomUUID(); await fput('vault/f/' + id, await seal(key, await f.arrayBuffer()));
        index.push({ id, name: f.name, size: f.size, type: f.type, added: Date.now() }); added.push(f.name);
      }
      await saveIndex(); return added;
    },
    vaultOpen: async id => { const it = item(id); show(await plain(it), it.name); return it.name; },
    vaultExport: async id => { const it = item(id); return save(await plain(it), it.name); },
    vaultRemove: async ids => { needOpen(); for (const id of ids) await fdel('vault/f/' + id); index = index.filter(i => !ids.includes(i.id)); await saveIndex(); return true; },
    // les deux cartes du coffre PC qui ne sont pas faites sur téléphone : la page les laisse vides quand ces appels échouent
    totpList: async () => { throw new Error('pas sur téléphone'); },
    pwList: async () => { throw new Error('pas sur téléphone'); },
  });
  window.__neoVaultTest = { wipe: () => fwipe('vault/') };

  // ---------- la Visionneuse et le choix d'une image (fond d'écran) : un fichier choisi sur le téléphone au lieu d'un chemin du PC ----------
  // Version téléphone de view:read / view:kind (app/viewer-main.js) pour les jetons « pick:n ». Mêmes réponses que le PC.
  const KINDS = { image: /\.(png|jpe?g|gif|webp|bmp|ico|svg|avif)$/i, audio: /\.(mp3|wav|ogg|oga|opus|m4a|aac|flac)$/i, video: /\.(mp4|m4v|webm|mov|mkv|ogv)$/i, pdf: /\.pdf$/i };
  const kindOf = f => Object.keys(KINDS).find(k => KINDS[k].test(f.name) || (f.type || '').startsWith(k + '/')) || 'other';
  const urls = new Map();   // un seul lien « blob: » par fichier choisi, gardé tant que la page est ouverte
  const urlOf = t => { if (!urls.has(t)) urls.set(t, URL.createObjectURL(picked.get(t))); return urls.get(t); };
  const fileOf = t => { const f = picked.get(t); if (!f) throw new Error('fichier introuvable : choisis-le de nouveau'); return f; };
  const MAX_TEXT = 5e6, HEX = 4096;
  const hexOf = b => { let s = ''; for (let i = 0; i < b.length; i += 16) { const row = [...b.subarray(i, i + 16)]; s += i.toString(16).padStart(8, '0') + '  ' + row.map(x => x.toString(16).padStart(2, '0')).join(' ').padEnd(48) + '  ' + row.map(x => x >= 32 && x < 127 ? String.fromCharCode(x) : '.').join('') + '\n'; } return s; };
  window.__neoFileUrl = p => /^data:image\//.test(p) ? p : picked.has(p) ? urlOf(p) : null;   // branché par build-www.js dans fileUrl() de web/home.js
  Object.assign(impl, {
    viewKind: async t => kindOf(fileOf(t)),
    viewRead: async t => {
      const f = fileOf(t), kind = kindOf(f), base = { name: f.name, path: t, size: f.size, siblings: [t] };
      if (kind === 'image' || kind === 'audio' || kind === 'video') return { ...base, kind, url: urlOf(t) };
      if (kind === 'pdf') return { ...base, kind: 'doc', html: '<p>Les PDF ne s\'ouvrent pas encore dans NeoDex sur téléphone.</p>' };
      const b = new Uint8Array(await f.slice(0, MAX_TEXT).arrayBuffer());
      if (b.subarray(0, 8192).includes(0)) return { ...base, kind: 'hex', text: hexOf(b.subarray(0, HEX)), cut: f.size > HEX };
      return { ...base, kind: 'text', text: new TextDecoder().decode(b).replace(/^﻿/, ''), cut: f.size > MAX_TEXT };
    },
    // le fond d'écran : sur PC l'image réduite est écrite dans le dossier de données ; ici on garde l'image elle-même (environ 200 Ko) dans les réglages
    bgSave: async d => { if (!/^data:image\/jpeg;base64,[\w+/=]+$/.test(String(d))) throw new Error('pas une image'); return d; },
    openFile: async () => 'Pas de programme pour ce fichier sur téléphone',
    viewOpenWith: async () => 'Pas de programme pour ce fichier sur téléphone',
    showFile: async () => {},
  });
  // browse() de web/home.js ouvre l'explorateur du PC : remplacé par le sélecteur de fichiers d'Android. Un dossier ne se choisit pas sur téléphone.
  addEventListener('DOMContentLoaded', () => {
    window.browse = async mode => {
      if (mode === 'folder') { window.toast?.('Choisir un dossier n\'existe pas sur téléphone', true); return ''; }
      const i = Object.assign(document.createElement('input'), { type: 'file' }); if (mode === 'icon') i.accept = 'image/*';
      return new Promise(ok => { i.onchange = () => { const f = i.files[0]; if (!f) return ok(''); const t = 'pick:' + (++seq); picked.set(t, f); ok(t); }; i.oncancel = () => ok(''); i.click(); });
    };
  });
})();
