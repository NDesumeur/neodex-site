/* Le fichier de synchro chiffré, lu et écrit sur téléphone : le même format que app/sync-crypto.js du PC
   ({ neodexChiffre: 1, sel, iv, tag, data } en base64, AES-256-GCM, clé tirée du mot de passe par scrypt N=2^15, r=8, p=1).
   Le navigateur sait faire AES-GCM et PBKDF2 (crypto.subtle) mais pas scrypt : scrypt est écrit ici (RFC 7914), vérifié contre le PC par
   mobile/tools/test-sync-crypto.js. Marche aussi dans Node (pour ce test). */
(function (root) {
  const subtle = (root.crypto || globalThis.crypto).subtle, enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const pbkdf2 = async (pass, salt, len) => new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 1 }, await subtle.importKey('raw', pass, 'PBKDF2', false, ['deriveBits']), len * 8));

  function salsa(B) {   // Salsa20/8 sur 16 mots de 32 bits, en place
    const x = B.slice(), R = (a, b) => (a << b) | (a >>> (32 - b));
    for (let i = 0; i < 8; i += 2) {
      x[4] ^= R(x[0] + x[12], 7); x[8] ^= R(x[4] + x[0], 9); x[12] ^= R(x[8] + x[4], 13); x[0] ^= R(x[12] + x[8], 18);
      x[9] ^= R(x[5] + x[1], 7); x[13] ^= R(x[9] + x[5], 9); x[1] ^= R(x[13] + x[9], 13); x[5] ^= R(x[1] + x[13], 18);
      x[14] ^= R(x[10] + x[6], 7); x[2] ^= R(x[14] + x[10], 9); x[6] ^= R(x[2] + x[14], 13); x[10] ^= R(x[6] + x[2], 18);
      x[3] ^= R(x[15] + x[11], 7); x[7] ^= R(x[3] + x[15], 9); x[11] ^= R(x[7] + x[3], 13); x[15] ^= R(x[11] + x[7], 18);
      x[1] ^= R(x[0] + x[3], 7); x[2] ^= R(x[1] + x[0], 9); x[3] ^= R(x[2] + x[1], 13); x[0] ^= R(x[3] + x[2], 18);
      x[6] ^= R(x[5] + x[4], 7); x[7] ^= R(x[6] + x[5], 9); x[4] ^= R(x[7] + x[6], 13); x[5] ^= R(x[4] + x[7], 18);
      x[11] ^= R(x[10] + x[9], 7); x[8] ^= R(x[11] + x[10], 9); x[9] ^= R(x[8] + x[11], 13); x[10] ^= R(x[9] + x[8], 18);
      x[12] ^= R(x[15] + x[14], 7); x[13] ^= R(x[12] + x[15], 9); x[14] ^= R(x[13] + x[12], 13); x[15] ^= R(x[14] + x[13], 18);
    }
    for (let i = 0; i < 16; i++) B[i] = (B[i] + x[i]) | 0;
  }
  function blockMix(X, Y, r) {   // X (32·r mots) → Y, puis X = blocs pairs de Y suivis des impairs
    const T = X.slice((2 * r - 1) * 16, 2 * r * 16);
    for (let i = 0; i < 2 * r; i++) { for (let k = 0; k < 16; k++) T[k] ^= X[i * 16 + k]; salsa(T); Y.set(T, i * 16); }
    for (let i = 0; i < r; i++) { X.set(Y.subarray(2 * i * 16, 2 * i * 16 + 16), i * 16); X.set(Y.subarray((2 * i + 1) * 16, (2 * i + 2) * 16), (r + i) * 16); }
  }
  async function scrypt(pass, salt, N, r, p, len) {
    const B = await pbkdf2(pass, salt, p * 128 * r), W = new Uint32Array(B.buffer, B.byteOffset, B.length / 4);   // mots petit-boutistes (tous les téléphones et PC)
    const R32 = 32 * r, X = new Uint32Array(R32), Y = new Uint32Array(R32), V = new Uint32Array(R32 * N);
    for (let q = 0; q < p; q++) {
      X.set(W.subarray(q * R32, (q + 1) * R32));
      for (let i = 0; i < N; i++) { V.set(X, i * R32); blockMix(X, Y, r); }
      for (let i = 0; i < N; i++) { const j = X[(2 * r - 1) * 16] & (N - 1); for (let k = 0; k < R32; k++) X[k] ^= V[j * R32 + k]; blockMix(X, Y, r); }
      W.set(X, q * R32);
    }
    return pbkdf2(pass, B, len);
  }

  const keys = new Map();   // sel + mot de passe → clé : scrypt coûte une à deux secondes sur téléphone, une fois par sel
  async function keyOf(pass, salt) {
    const k = b64(salt) + '\0' + pass;
    if (!keys.has(k)) keys.set(k, scrypt(enc.encode(pass), salt, 1 << 15, 8, 1, 32).then(raw => subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])));
    return keys.get(k);
  }
  const mySalt = (root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(16));   // un sel par lancement, comme sur PC
  const sealed = o => !!o && typeof o === 'object' && o.neodexChiffre === 1;
  async function seal(text, pass) {
    const iv = (root.crypto || globalThis.crypto).getRandomValues(new Uint8Array(12));
    const out = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, await keyOf(pass, mySalt), enc.encode(text))), n = out.length - 16;
    return JSON.stringify({ neodexChiffre: 1, sel: b64(mySalt), iv: b64(iv), tag: b64(out.subarray(n)), data: b64(out.subarray(0, n)) });
  }
  async function open(o, pass) {
    try {
      const data = unb64(o.data), tag = unb64(o.tag), all = new Uint8Array(data.length + tag.length); all.set(data); all.set(tag, data.length);
      return dec.decode(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, await keyOf(pass, unb64(o.sel)), all));
    } catch { throw Object.assign(new Error('mot de passe de synchro incorrect'), { code: 'SYNC_PASS' }); }
  }
  const api = { sealed, seal, open, scrypt };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.NeoSyncCrypto = api;
})(typeof window !== 'undefined' ? window : globalThis);
