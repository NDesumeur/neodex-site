/* ---------- sharing the screen with a site (Discord, Meet…): NeoDex's picker of a screen or a window, with or without the computer's
   sound (sites-main.js gives the choice to the site). ---------- */
neo.onSharePick(d => {
  const m = $('shareModal'); let pick = null, tab = d.sources.some(s => s.screen) ? 'screen' : 'window';
  const answer = id => { m.classList.remove('on'); document.removeEventListener('keydown', esc, true); neo.shareAnswer({id: d.id, sourceId: id, audio: $('shAudio').checked}); };
  const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); answer(null); } };
  $('shTitle').textContent = (d.host || 'Ce site') + ' veut voir ton écran';
  $('shAudio').checked = d.audio;
  const draw = () => {
    $('shTabs').replaceChildren(...[['screen', 'Écrans'], ['window', 'Fenêtres']].map(([k, n]) => { const b = el('button', 'tab px' + (tab === k ? ' on' : ''), n + ' · ' + d.sources.filter(s => s.screen === (k === 'screen')).length); b.onclick = () => { tab = k; draw(); }; return b; }));
    $('shGrid').replaceChildren(...d.sources.filter(s => s.screen === (tab === 'screen')).map(s => {
      const c = el('button', 'shCard px' + (pick === s.id ? ' on' : '')), img = el('img'), name = el('span');
      img.src = s.thumb || ''; if (s.icon) { const i = el('img', 'shIcon'); i.src = s.icon; name.append(i); }
      name.append(s.screen ? s.name.replace(/^Screen (\d+)$/, 'Écran $1').replace(/^Entire screen$/i, 'Tout l\'écran') : s.name);
      c.append(img, name); c.onclick = () => { pick = s.id; draw(); }; c.ondblclick = () => answer(s.id);
      return c;
    }));
    $('shGo').disabled = !pick;
  };
  $('shGo').onclick = () => pick && answer(pick);
  $('shCancel').onclick = () => answer(null);
  document.addEventListener('keydown', esc, true);
  draw(); m.classList.add('on'); window.neo?.win('focus');
});
