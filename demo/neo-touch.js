/* NeoDex sur téléphone : les gestes du doigt que la page du PC n'a pas.
   - Appui long : le « clic droit » du PC (oncontextmenu), sur n'importe quel élément ; sur une tuile il ouvre « Modifier le raccourci »
     (nom, catégorie, supprimer), qui gagne ici deux boutons pour la déplacer dans sa catégorie (sur PC on la glisse à la souris).
   - Glisser vite à gauche ou à droite sur la barre du haut : l'onglet d'à côté (l'accueil est le premier). */
(() => {
  // ---------- appui long = clic droit ----------
  const LONG = 500, SLOP = 10;
  let timer = 0, x0 = 0, y0 = 0, fired = 0;
  const skip = t => !t?.closest || t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], iframe');
  addEventListener('touchstart', e => {
    clearTimeout(timer); const t = e.target;
    if (e.touches.length !== 1 || skip(t)) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    timer = setTimeout(() => {
      fired = Date.now();
      navigator.vibrate?.(15);
      t.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x0, clientY: y0 }));
    }, LONG);
  }, { passive: true, capture: true });
  addEventListener('touchmove', e => { const p = e.touches[0]; if (p && Math.hypot(p.clientX - x0, p.clientY - y0) > SLOP) clearTimeout(timer); }, { passive: true, capture: true });
  addEventListener('touchend', () => clearTimeout(timer), { capture: true });
  addEventListener('touchcancel', () => clearTimeout(timer), { capture: true });
  // Android envoie parfois aussi son propre appui long : un seul des deux compte ; et le clic qui suit l'appui long n'ouvre pas la tuile
  addEventListener('contextmenu', e => {
    if (e.isTrusted) { if (Date.now() - fired < 1000) { e.preventDefault(); e.stopImmediatePropagation(); } else { clearTimeout(timer); fired = Date.now(); } }
  }, true);
  addEventListener('click', e => { if (Date.now() - fired < 700) { e.preventDefault(); e.stopImmediatePropagation(); fired = 0; } }, true);

  addEventListener('DOMContentLoaded', () => {
    // ---------- déplacer une tuile dans sa catégorie : « ◀ » et « ▶ » dans la fenêtre du raccourci (links, editing, catsOf, save, render : web/home.js) ----------
    const del = document.getElementById('mDel');
    if (del) {
      const move = d => {
        try {
          const i = editing; if (i == null || !links[i]) return;
          const c = catsOf(links[i])[0];
          let j = i + d; while (j >= 0 && j < links.length && !catsOf(links[j]).includes(c)) j += d;
          if (j < 0 || j >= links.length) return;
          [links[i], links[j]] = [links[j], links[i]]; editing = j; save(); render();
        } catch (e) { console.error(e); }
      };
      const mk = (txt, label, d) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn px mMove'; b.textContent = txt; b.setAttribute('aria-label', label); b.onclick = () => move(d); return b; };
      del.before(mk('◀', 'Déplacer avant', -1), mk('▶', 'Déplacer après', 1));
      const br = document.createElement('span'); br.className = 'mBreak'; document.getElementById('mCancel')?.before(br);   // Annuler et Enregistrer sur la ligne d'en dessous (mobile.css)
      // une tuile nouvelle (pas encore rangée) n'a rien à déplacer : les boutons suivent celui de suppression
      new MutationObserver(() => document.querySelectorAll('.mMove').forEach(b => { b.style.visibility = editing == null ? 'hidden' : 'visible'; })).observe(document.getElementById('modal'), { attributes: true, attributeFilter: ['class'] });
    }

    // ---------- glisser sur la barre du haut : l'onglet d'à côté ----------
    const bar = document.getElementById('tabstrip');
    if (!bar) return;
    let sx = 0, sy = 0, st = 0, sl = 0;
    bar.addEventListener('touchstart', e => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; st = Date.now(); sl = bar.scrollLeft; }, { passive: true });
    bar.addEventListener('touchend', e => {
      const p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dy) > 40 || Date.now() - st > 450 || Math.abs(bar.scrollLeft - sl) > 4) return;   // la rangée a défilé : c'était pour voir les onglets
      try {
        const list = [null, ...tabs], k = list.indexOf(typeof active === 'undefined' ? null : active), n = k + (dx < 0 ? 1 : -1);
        if (n < 0 || n >= list.length) return;
        showTab(list[n]); fired = Date.now();   // pas de clic sur l'onglet sous le doigt
      } catch (err) { console.error(err); }
    }, { passive: true });
  });
})();
