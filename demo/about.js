/* ---------- Mises à jour : le bandeau de l'accueil (la page « Mise à jour » est le plugin système neodex.miseajour) ---------- */
// le bandeau en haut de l'accueil : une nouvelle version est là, un clic la télécharge et redémarre NeoDex
function updRender(s) {
  let bar = document.getElementById('updBar');
  if (!s || s.state === 'none' || s.state === 'dev') { bar?.remove(); return; }
  if (!bar) { bar = el('div', 'px'); bar.id = 'updBar'; const wrap = neo.mobile ? document.body : document.querySelector('main .wrap') || document.querySelector('main'); wrap.prepend(bar); }   // téléphone : posé sur la page entière (mobile.css le fixe en bas), visible même dans une appli
  const txt = el('span', 'updTxt'), btn = el('button', 'btn main px'), later = el('button', 'btn ghost px', 'PLUS TARD');
  btn.onclick = () => { btn.disabled = true; neo.appInstallUpdate(); };
  later.onclick = () => bar.remove();
  if (s.state === 'available') { txt.textContent = 'NeoDex ' + s.version + ' est disponible.'; btn.textContent = neo.mobile ? 'INSTALLER' : 'TÉLÉCHARGER ET REDÉMARRER'; bar.replaceChildren(txt, btn, later); }
  else if (s.state === 'downloading') { txt.textContent = 'Téléchargement de NeoDex ' + s.version + ' : ' + (s.percent || 0) + ' %'; const g = el('div', 'updProg'), i = el('i'); i.style.width = (s.percent || 0) + '%'; g.append(i); bar.replaceChildren(txt, g); }
  else if (s.state === 'ready') { txt.textContent = 'NeoDex ' + s.version + ' est prête : redémarrage…'; bar.replaceChildren(txt); }
  else { txt.textContent = 'Mise à jour impossible : ' + (s.message || 'réseau indisponible'); btn.textContent = 'RÉESSAYER'; bar.replaceChildren(txt, btn, later); }
}
neo.onAppUpdate(updRender);
neo.appUpdateState().then(updRender).catch(() => {});
tbPop.append(tbItem('À propos · Mises à jour', 'version de NeoDex, vérifier les mises à jour', () => newTab(APPS['plugin:neodex.miseajour'] ? 'plugin:neodex.miseajour' : 'neodex:store')));
