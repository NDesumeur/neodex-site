/* ---------- first-launch tour: NeoMe shows the home page piece by piece (a spotlight on each part, a bubble with its face and a few words).
   Shown once (settings.tourDone), again from MENU → Visite guidée. NeoMe's faces come from its plugin when it is installed, else the logo. ---------- */
// the important things first: the one shortcut to remember, what protects you (ads, VPN, passwords, backups), then the rest
const TOUR = [
  [null, 25, 'Salut, moi c’est NeoMe ! Je te montre l’essentiel de NeoDex en une minute. (Flèches ou Entrée pour avancer, Échap pour arrêter.)'],
  [null, 22, 'Le seul raccourci à retenir : Ctrl+K. Tape ce que tu veux (un site, une appli, un réglage, « mots de passe », « traduire »…) et Entrée. Ça marche partout, même sur un site.'],
  ['#searchWrap', 22, 'Sur l’accueil, tape directement : tes raccourcis, tes applis et une recherche sur le web. Ctrl+Maj+F ouvre la recherche même quand NeoDex est caché.'],
  ['#tabs', 2, 'Tes raccourcis, rangés par catégories. + Ajouter en crée un, ★ en fait un favori.'],
  ['#bNew', 15, 'Les onglets : la barre d’adresse propose tes sites habituels. Pubs et traqueurs sont bloqués, et le plugin VPN (dans NeoStore) cache ton adresse. Une page en anglais ? NeoDex propose de la traduire.'],
  [null, 11, 'Le Coffre-fort garde tes mots de passe chiffrés et les remplit tout seul, crée un mot de passe solide quand tu t’inscris, affiche tes codes de double authentification et vérifie s’ils ont fuité. Ouvre-le avec Ctrl+K → « coffre ».'],
  [null, 17, 'Tes données sont sauvegardées toutes seules, chaque jour. Dans Paramètres → Synchronisation, choisis un dossier OneDrive : tes PC et ton téléphone gardent les mêmes notes, agenda et réglages. fgestion montre tout ça et restaure ce que tu veux.'],
  ['#dock', 9, 'La barre d’applis : tes applis et tes sites à un clic. + en ajoute un, ‹ la réduit. Pour en installer d’autres, NeoStore (dans MENU) est gratuit, et chaque plugin demande la permission avant d’utiliser ton micro, tes fichiers ou Internet.'],
  ['#agenda', 17, 'Ton agenda : cours, rendez-vous, sorties. Des plugins comme Football ou Formule 1 y ajoutent les matchs de ton équipe.'],
  ['#pet', 23, () => document.getElementById('pet') ? 'Et moi, je vis ici ! Nourris-moi, joue avec moi et je gagne des niveaux.' : 'Installe-moi depuis NeoStore et je viendrai vivre sur ton accueil !'],
  [null, 9, 'Si un jour NeoDex se ferme d’un coup, il te propose d’envoyer le rapport, puis de redémarrer sans plugins (mode sans échec) pour trouver le fautif.'],
  [null, 10, 'C’est parti ! Revois cette visite quand tu veux : Ctrl+K → « visite ».'],
];
let tourFaces = null;
async function tourFace(n) {
  if (!tourFaces) {
    tourFaces = {};
    if (window.neo?.pluginFileRead && typeof APPS !== 'undefined' && APPS['plugin:neodex.neome'])
      await Promise.all([...new Set(TOUR.map(s => s[1]))].map(k => neo.pluginFileRead('neodex.neome', 'img/' + k + '.png').then(b => { tourFaces[k] = 'data:image/png;base64,' + b; }, () => {})));
  }
  return tourFaces[n] || 'logo.png';
}
function tourStart() {
  document.getElementById('tour')?.remove();
  if (typeof showTab === 'function') showTab(null);
  const box = el('div', '', ''), spot = el('div', 'tourSpot'), bub = el('div', 'tourBub panel px'), face = el('img', 'tourFace'), txt = el('p'),
    nav = el('div', 'tourNav'), skip = el('button', 'btn px', 'Passer'), next = el('button', 'btn main px', 'Suivant ▶'), num = el('span', 'tourNum');
  box.id = 'tour'; nav.append(num, skip, next); face.alt = '';
  bub.setAttribute('role', 'dialog'); bub.setAttribute('aria-label', 'Visite guidée'); txt.setAttribute('aria-live', 'polite');  // a screen reader reads each step
  bub.append(face, el('div', '', ''), nav); bub.children[1].append(txt);
  box.append(spot, bub); document.body.append(box);
  let i = 0;
  const end = () => { box.remove(); removeEventListener('keydown', key, true); removeEventListener('resize', place); window.neo?.setSettings({tourDone: true}).then(s => { prefs = s; }); };
  const place = () => {
    const sel = TOUR[i][0], t = sel && document.querySelector(sel), r = t && t.getBoundingClientRect();
    // d'abord amener la partie à l'écran, puis la mesurer : avant, une partie plus bas dans l'accueil n'était jamais montrée
    if (r && r.width > 0 && (r.top < 0 || r.bottom > innerHeight)) t.scrollIntoView?.({block: r.height > innerHeight * .6 ? 'start' : 'center'});
    const q0 = r && r.width > 0 ? t.getBoundingClientRect() : null;
    // une page zoomée (le téléphone met zoom sur <html>) : les mesures sont en pixels de l'écran, les positions en pixels de la page
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1, W = innerWidth / z, H = innerHeight / z;
    const q = q0 && q0.bottom > 0 && q0.top < innerHeight ? {left: q0.left / z, top: q0.top / z, width: q0.width / z, height: q0.height / z, bottom: q0.bottom / z} : null;
    spot.style.cssText = q ? `left:${q.left - 6}px;top:${q.top - 6}px;width:${q.width + 12}px;height:${q.height + 12}px` : `left:50%;top:40%;width:0;height:0`;
    const bw = Math.min(460, W - 32), bh = bub.offsetHeight || 150;
    let x = q ? q.left + q.width / 2 - bw / 2 : (W - bw) / 2, y = q ? (q.bottom + 18 + bh < H ? q.bottom + 18 : q.top - 18 - bh) : H * .4 - bh / 2;
    x = Math.max(16, Math.min(W - bw - 16, x)); y = Math.max(16, Math.min(H - bh - 16, y));
    bub.style.cssText = `left:${x}px;top:${y}px;width:${bw}px`;
  };
  const go = async k => {
    if (k >= TOUR.length) return end();
    i = k; const [, f, t] = TOUR[i];
    txt.textContent = typeof t === 'function' ? t() : t; num.textContent = (i + 1) + ' / ' + TOUR.length;
    next.textContent = i === TOUR.length - 1 ? 'Terminer' : 'Suivant ▶'; skip.hidden = i === TOUR.length - 1;
    face.src = await tourFace(f); face.classList.remove('hop'); void face.offsetWidth; face.classList.add('hop');
    place(); next.focus({preventScroll: true}); if (typeof sfx === 'function') sfx('click');
  };
  const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(); } else if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(i + 1); } else if (e.key === 'ArrowLeft' && i) { e.preventDefault(); go(i - 1); } };
  next.onclick = () => go(i + 1); skip.onclick = end;
  addEventListener('keydown', key, true); addEventListener('resize', place);
  go(0);
}
tbPop.append(tbItem('Visite guidée', 'NeoMe', () => tourStart()));
// the first time: once the settings are known and the home page has settled
(function tourFirst(n = 0) {
  if (typeof prefs === 'undefined' || !window.neo || W2) return;
  if (prefs.tourDone === undefined && n < 40) return setTimeout(() => tourFirst(n + 1), 250);  // settings not loaded yet
  if (prefs.tourDone === false) setTimeout(tourStart, 1500);
})();
