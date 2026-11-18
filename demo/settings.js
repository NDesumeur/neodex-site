// la fenêtre Paramètres, sortie de browser.js : chargée au premier clic sur PARAMÈTRES
// settings window: every change applies right away
const openSettings = () => {
  $('setSearch').value = prefs.search; $('setAntiTrack').checked = prefs.antiTrack; $('setLogin').checked = prefs.openAtLogin; $('setFull').checked = prefs.fullscreen;
  $('setRestore').checked = prefs.restoreTabs; $('setTray').checked = prefs.closeToTray; $('setBigText').checked = !!prefs.bigText; $('setPlugAuto').checked = prefs.pluginAutoUpdate !== false; $('setHotkey').checked = prefs.hotkey;
  $('setCity').value = prefs.weatherCity; $('setPip').checked = prefs.pip; $('setCursor').checked = prefs.pixelCursor; $('setLang').value = prefs.lang || ''; $('setGmail').checked = prefs.gmailSkin; $('setDiscord').checked = prefs.discordSkin !== false;
  $('setSounds').checked = prefs.sounds; $('setVol').value = prefs.soundVol; $('setTypeSounds').checked = prefs.typeSounds;
  $('setSyncState').textContent = prefs.syncFile ? 'Synchro active : ' + prefs.syncFile : 'Pas de synchro : tes données sont seulement sur ce PC.';
  $('setSyncStop').style.display = prefs.syncFile ? '' : 'none';
  neo.syncStatus().then(s => { if (s.file && s.last) $('setSyncState').textContent += ' · dernière synchro à ' + new Date(s.last).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) + (s.others.length ? ' · autres PC : ' + s.others.join(', ') : ''); });
  const tFavs = prefs.themeFavs || [];
  $('setBg').replaceChildren(...Object.entries({random: ['Aléatoire'], favs: ['★ Mes favoris'], ...THEMES}).map(([k, [name]]) => {
    const b = el('button', 'tab px' + (k === prefs.bgTheme ? ' on' : ''), name);
    // a small picture of NeoDex in the theme's colours (top bar, side bar, a window); no preview on hover: each theme has its fonts, the grid would jump
    if (THEMES[k]) { const v = themeVars(k), mini = el('span', 'thMini'); mini.style.cssText = ['--bg0', '--win', '--line', '--line2', '--magenta', '--pink', '--violet'].map(x => x + ':' + v[x]).join(';'); mini.append(el('b'), el('i'), el('u'), el('s')); b.prepend(mini); b.title = THEMES[k][6] || '';
      const star = el('span', 'scStar' + (tFavs.includes(k) ? ' on' : ''), tFavs.includes(k) ? '★' : '☆');  // the stars: « ★ Mes favoris » draws among them
      star.title = tFavs.includes(k) ? 'Retirer des favoris' : 'Ajouter aux favoris'; star.setAttribute('role', 'button');
      star.onclick = e => { e.stopPropagation(); setPref({themeFavs: tFavs.includes(k) ? tFavs.filter(x => x !== k) : [...tFavs, k]}); };
      b.prepend(star);
    } else if (k === 'favs') { b.prepend(el('span', 'thMini thRnd', '★')); b.title = 'Un de tes thèmes favoris, différent à chaque lancement'; }
    else { b.prepend(el('span', 'thMini thRnd', '?')); b.title = 'Un style différent à chaque lancement'; }
    b.onclick = () => { if (k === 'favs' && !tFavs.length) return toast('Mets d’abord une étoile sur tes thèmes préférés'); if (k === 'random' || k === 'favs') { launchTheme = ''; rerollNow = true; } applyTheme(k); rerollNow = false; prefs.bgTheme = k; setPref({bgTheme: k}); };
    return b;
  }));
  $('setWebColors').replaceChildren(...[['', 'Celles des sites'], ['dark', 'Sombres'], ['theme', 'Couleurs du thème']].map(([v, n]) => { const b = el('button', 'tab px' + ((prefs.webColors || '') === v ? ' on' : ''), n); b.onclick = () => setPref({webColors: v, ...webPalette()}); return b; }));
  const favs = prefs.sceneFavs || [];
  $('setScene').replaceChildren(...Object.entries({random: 'Aléatoire', favs: '★ Mes favoris (un par jour)', ...Object.fromEntries(Object.entries(SCENE_NAMES).filter(([k]) => k !== 'image')), image: SCENE_NAMES.image}).map(([k, name]) => {
    const b = el('button', 'tab px' + (k === prefs.bgScene ? ' on' : ''), name);
    b.onclick = () => { if (k === 'image' && !prefs.bgImage) return pickBg(); if (k === 'favs' && !favs.length) return toast('Mets d\'abord une étoile sur tes décors préférés'); setScene(k, true); setPref({bgScene: k}); };
    if (SCENE_NAMES[k] && k !== 'image') {
      const star = el('span', 'scStar' + (favs.includes(k) ? ' on' : ''), favs.includes(k) ? '★' : '☆');
      star.title = favs.includes(k) ? 'Retirer des favoris' : 'Ajouter aux favoris'; star.setAttribute('role', 'button');
      star.onclick = e => { e.stopPropagation(); setPref({sceneFavs: favs.includes(k) ? favs.filter(x => x !== k) : [...favs, k]}).then(() => prefs.bgScene === 'favs' && setScene('favs')); };
      b.prepend(star);
      b.onmouseenter = () => scenePeek(k, b); b.onmouseleave = scenePeekEnd;
    }
    return b;
  }), Object.assign(el('button', 'tab px', 'CHOISIR UNE IMAGE…'), {onclick: pickBg}), Object.assign(el('button', 'tab px', 'IMAGE : ' + (prefs.bgFit === 'fit' ? 'ENTIÈRE' : 'REMPLIT L\'ÉCRAN')), {onclick: async () => { await setPref({bgFit: prefs.bgFit === 'fit' ? 'fill' : 'fit'}); if (scene === 'image') { scene = ''; setScene('image'); } openSettings(); }}));
  $('setModal').classList.add('on');
};
const setPref = async s => { prefs = await neo.setSettings(s); openSettings(); updateShield(); };
// the decor under the mouse in the picker, moving, in a small box (drawn apart from the one on screen: sky.js skyState)
const peek = {k: '', st: new Map(), raf: 0, tm: 0, box: null};
const scenePeek = (k, b) => {
  clearTimeout(peek.tm); peek.k = k;
  peek.tm = setTimeout(async () => {
    const box = peek.box ??= el('canvas', 'scenePeek'), r = b.getBoundingClientRect(), w = 320, h = Math.round(w * innerHeight / innerWidth);
    box.width = w; box.height = h; box.style.left = Math.max(8, Math.min(innerWidth - w - 16, r.left)) + 'px'; box.style.top = (r.top > h + 24 ? r.top - h - 14 : r.bottom + 10) + 'px';
    document.body.append(box);
    let st = peek.st.get(k);
    if (!st) { st = await skyState(k, Math.ceil(innerWidth / S), Math.ceil(innerHeight / S)).catch(() => null); if (!st) return; if (peek.st.size > 5) peek.st.delete(peek.st.keys().next().value); peek.st.set(k, st); }
    cancelAnimationFrame(peek.raf);
    const loop = t => { if (peek.k !== k) return; skyPaint(st, t, box.getContext('2d'), w, h); peek.raf = requestAnimationFrame(loop); };
    if (peek.k === k) loop(performance.now());
  }, 300);
};
const scenePeekEnd = () => { clearTimeout(peek.tm); peek.k = ''; cancelAnimationFrame(peek.raf); peek.box?.remove(); };
// the decor on screen as the Windows wallpaper, drawn again at the exact size of the screen
const wallpaper = async () => {
  const k = document.body.dataset.scene, dpr = devicePixelRatio, w = Math.round(screen.width * dpr), h = Math.round(screen.height * dpr);
  if (!k || k === 'image') return toast('Choisis d\'abord un décor', true);
  toast('Fond d\'écran en préparation…');
  try {
    const st = await skyState(k, Math.ceil(screen.width / S), Math.ceil(screen.height / S)), c = el('canvas'); c.width = w; c.height = h;
    skyPaint(st, performance.now(), c.getContext('2d'), w, h);
    const f = await neo.saveWallpaper(c.toDataURL('image/png'), k, true);
    toast('Fond d\'écran changé. Image gardée dans ' + f);
  } catch (e) { toast('Fond d\'écran impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
};
// F9: nothing but the decor on screen, until a key or a click
const contemplate = () => {
  if (!document.body.classList.toggle('contemplate')) return;
  closeSettings(); if (active) showTab(null);
  const off = e => { if (e.key === 'F9') return; document.body.classList.remove('contemplate'); removeEventListener('keydown', off, true); removeEventListener('mousedown', off, true); e.preventDefault(); };
  setTimeout(() => { addEventListener('keydown', off, true); addEventListener('mousedown', off, true); }, 300);
};
$('setWall').onclick = wallpaper; $('setContemplate').onclick = contemplate;
const pickBg = async () => {
  const p = await browse('icon'); if (!p) return;
  try { prefs = await neo.setSettings({bgImage: await bgShrink(p), bgScene: 'image'}); setScene('image'); openSettings(); }
  catch (e) { toast('Image impossible à utiliser : ' + e.message, true); }
};
$('setPip').onchange = e => setPref({pip: e.target.checked});
let uiResetAt = 0;
$('setUiReset').onclick = async () => {  // a second click within 4 seconds confirms
  if (Date.now() - uiResetAt > 4000) { uiResetAt = Date.now(); return toast('Clique encore une fois pour restaurer l\'interface'); }
  await neo.setSettings({bgTheme: 'random', bgScene: 'random', themeId: '', fontScale: 1, contrast: false, readableFont: false, reduceMotion: false, bigCursor: false, pixelCursor: true, soundPack: 'retro', soundEvents: {}, sounds: true, soundVol: .6, typeSounds: false, pip: true, gmailSkin: true, discordSkin: true});
  await neo.tbMode?.('auto');
  try { delete localStorage.neoMini; delete localStorage.neoSplit; } catch {}
  location.reload();
};
$('setLang').onchange = e => setPref({lang: e.target.value}).then(() => location.reload());  // the server writes the language into <html lang>, i18n.js does the rest
$('setGmail').onchange = e => setPref({gmailSkin: e.target.checked});
$('setDiscord').onchange = e => setPref({discordSkin: e.target.checked});
$('setCursor').onchange = e => setPref({pixelCursor: e.target.checked}).then(() => applyCursor(prefs.pixelCursor));
$('setSounds').onchange = e => setPref({sounds: e.target.checked}).then(() => sfx('notify'));
$('setVol').onchange = e => setPref({soundVol: +e.target.value}).then(() => sfx('launch'));
$('setTypeSounds').onchange = e => setPref({typeSounds: e.target.checked});
$('setSoundTest').onclick = () => { const seq = ['open', 'launch', 'notify', 'close', 'error']; seq.forEach((n, i) => setTimeout(() => sfx(n), i * 350)); };
// the page reloads by itself once the data folder has changed
$('setSyncPick').onclick = () => neo.chooseSync().catch(e => toast('Synchro impossible : ' + e.message.replace(/^.*Error: /, ''), true));
$('setSyncStop').onclick = async () => {
  if (await nbConfirm('Arrêter la synchro sur ce PC ? Tes données restent ici, mais les changements des autres PC n\'arriveront plus.'))
    neo.stopSync().then(async () => { prefs = await neo.getSettings(); openSettings(); }).catch(e => toast('Impossible : ' + e.message.replace(/^.*Error: /, ''), true));
};
const closeSettings = () => { scenePeekEnd(); $('setModal').classList.remove('on'); };
$('bSettings').onclick = openSettings;
$('setSearch').onchange = e => setPref({search: e.target.value});
$('setAntiTrack').onchange = e => setPref({antiTrack: e.target.checked}).then(() => onView(v => v.reload()));
$('setLogin').onchange = e => setPref({openAtLogin: e.target.checked});
$('setFull').onchange = e => setPref({fullscreen: e.target.checked});
$('setRestore').onchange = e => setPref({restoreTabs: e.target.checked});
$('setCityOk').onclick = async () => {  // city name -> coordinates (Open-Meteo geocoding, no account needed)
  const q = $('setCity').value.trim();
  if (!q) return setPref({weatherCity: '', weatherLat: 0, weatherLon: 0}).then(loadWeather);
  try {
    const r = (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=fr&name=' + encodeURIComponent(q)).then(r => r.json())).results?.[0];
    if (!r) return toast('Ville introuvable : ' + q, true);
    await setPref({weatherCity: r.name, weatherLat: r.latitude, weatherLon: r.longitude});
    toast('Météo : ' + r.name + (r.admin1 ? ', ' + r.admin1 : '') + ', ' + r.country); loadWeather();
  } catch (e) { toast('Recherche de la ville impossible : ' + e.message, true); }
};
$('setCity').onkeydown = e => { if (e.key === 'Enter') $('setCityOk').click(); };

$('setTray').onchange = e => setPref({closeToTray: e.target.checked});
$('setBigText').onchange = e => setPref({bigText: e.target.checked});
$('setPlugAuto').onchange = e => setPref({pluginAutoUpdate: e.target.checked});
$('setHotkey').onchange = e => setPref({hotkey: e.target.checked});
$('setExport').onclick = async () => {
  let opts;
  if (neo.mobile) {  // téléphone : choisir ce qu'on emporte, et un mot de passe pour chiffrer le fichier (neo-mobile.js exportData)
    const groups = await neo.exportGroups();
    const r = await nbBox({title: 'Exporter les données du téléphone', text: 'Coche ce que le fichier emporte. Il ne contient que ce téléphone.', checks: groups, buttons: ['Continuer', 'Annuler'], cancelId: 1});
    if (r.response !== 0 || !r.checks.some(Boolean)) return;
    const pass = await askPass('Mot de passe du fichier', 'Laisse vide pour ne pas chiffrer. Sans ce mot de passe, le fichier ne pourra pas être réimporté.');
    if (pass === null) return;
    opts = {groups: groups.filter((_, i) => r.checks[i]), pass};
  }
  neo.exportData(opts).then(f => f && toast('Données exportées dans ' + f), e => toast('Export impossible : ' + e.message, true));
};
// ask() avec un champ masqué (le texte tapé ne s'affiche pas)
async function askPass(title, hint) { const i = $('askInput'); i.type = 'password'; try { return await ask(title, '', hint); } finally { i.type = 'text'; } }
window.__neoAskPass = () => askPass('Mot de passe de la sauvegarde', 'Le mot de passe choisi au moment de l’exportation.');
$('setImport').onclick = async () => {
  if (!await nbConfirm('Importer une sauvegarde remplace tes raccourcis, ton agenda, tes animes et tes paramètres actuels. Continuer ?')) return;
  neo.importData().catch(e => toast('Import impossible : ' + e.message.replace(/^.*Error: /, ''), true));  // success reloads the page
};
$('setClear').onclick = async () => {
  if (!await nbConfirm('Effacer les cookies, connexions et le cache de tous les sites ?\nTu seras déconnecté partout dans NeoDex.')) return;
  await neo.clearWebData(); tabs.forEach(t => { try { t.v.reload(); } catch {} });
  toast('Données de navigation effacées');
};
$('setClose').onclick = closeSettings;
$('setModal').onclick = e => { if (e.target.id === 'setModal') closeSettings(); };
$('setModal').onkeydown = e => { if (e.key === 'Escape') closeSettings(); };
