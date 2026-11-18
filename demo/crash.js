/* After a crash (crash-main.js): offer to report it and to restart without plugins; in safe mode, a bar says so and brings normal mode back. */
const crashRestart = safe => neo.relaunch(safe).catch(e => toast(e.message, true));
neo.crashState().then(async s => {
  if (s.safe) {
    const bar = el('div'), b = el('button', 'btn px', 'Redémarrer normalement');
    bar.id = 'safeBar'; bar.setAttribute('role', 'status');
    bar.append(el('b', '', 'MODE SANS ÉCHEC'), el('span', '', 'aucun plugin ni extension n\'est chargé. Si le problème a disparu, désactive les plugins un par un dans NeoStore.'), b);
    b.onclick = () => crashRestart(false);
    document.body.append(bar);
  }
  if (!s.unclean || s.safe) return;
  const r = await nbBox({ title: 'NeoDex s\'est fermé brusquement', text: 'La dernière fois, NeoDex ne s\'est pas fermé normalement (plantage, coupure, ou arrêt forcé). Tu peux envoyer le rapport (tu le relis avant de l\'envoyer, ton nom n\'y figure pas), et redémarrer sans plugins pour voir si l\'un d\'eux est en cause.',
    buttons: ['Envoyer le rapport', 'Redémarrer sans plugins', 'Plus tard'], cancelId: 2 });
  if (r.response === 0) await neo.crashReport().catch(e => toast(e.message, true));
  else await neo.crashSeen();
  if (r.response === 1) crashRestart(true);
}, () => {});
tbPop.append(tbItem('Mode sans échec', 'redémarrer sans plugins', async () => { if (await nbConfirm('Redémarrer NeoDex sans aucun plugin ni extension ? Pratique pour savoir si l\'un d\'eux pose problème.')) crashRestart(true); }),
  tbItem('Signaler un problème', 'rapport prérempli, à relire', () => neo.crashReport().catch(e => toast(e.message, true))));
