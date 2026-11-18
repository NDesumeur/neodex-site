/* NeoDex sur téléphone : le centre de notifications. Version téléphone de app/notifs-main.js du PC : mêmes noms (neo.notifsXxx), mêmes règles
   (200 au plus, titre obligatoire, types coupés dans les réglages, « Plus tard » de l'agenda qui revient dans 10 minutes).
   Rangement : IndexedDB (load/save de neo-mobile.js), clés « notifs » (la liste) et « notifs-muted » (les types coupés), par load/save de neo-mobile.js.
   Quand NeoDex n'est pas à l'écran, une notification Android en plus (notifShow du plugin Java NeoFile, absent du navigateur de test). */
(() => {
  const { impl, load, save, emit, ready } = window.__neoShell;
  const MAX = 200, IMG_MAX = 400 * 1024;
  let list = [], muted = {};
  ready.then(() => { list = load('notifs', []); muted = load('notifs-muted', {}); });   // le stockage est lu au lancement (neo-mobile.js)
  const changed = () => { save('notifs', list); emit('onNotifs'); };
  const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const imageOf = s => typeof s !== 'string' ? '' : /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= IMG_MAX ? s : /^https:\/\/[^\s"'<>]{1,500}$/.test(s) ? s : '';
  // un rappel de l'agenda NeoDex en arrière-plan : c'est l'alarme d'Android qui le montre (NeoReminders.java, plus bas), pas deux fois
  const bubble = item => { if (item.app === 'neodex:agenda' && item.type === 'rappel' && window.Capacitor?.Plugins?.NeoFile?.reminders) return; try { window.Capacitor?.Plugins?.NeoFile?.notifShow({ title: item.fromName === 'NeoDex' ? item.title : item.fromName + ' · ' + item.title, body: item.body }); } catch {} };
  // n : { title, body, open, image, type, app, later } ; from : un plugin, ou « neobase » (les applis du cœur), comme sur PC
  function add(n, from = 'neobase', fromName = 'NeoDex') {
    const title = clip(n?.title, 120); if (!title) throw new Error('une notification a besoin d\'un titre');
    const open = typeof n.open === 'string' && /^(https?:\/\/|neodex:|plugin:)/.test(n.open) ? n.open.slice(0, 500) : '';
    const type = /^[a-z0-9-]{1,40}$/.test(n.type || '') ? n.type : '';
    const app = from === 'neobase' ? (/^neodex:[a-z]+$/.test(n.app || '') ? n.app : /^neodex:[a-z]+$/.test(open) ? open : '') : 'plugin:' + from;
    if (type && muted[(app || from) + '|' + type]) return '';
    const later = n.later && from === 'neobase' ? { title, body: clip(n.body, 500), open, type, app } : undefined;
    const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: Date.now(), title, body: clip(n.body, 500), open, image: imageOf(n.image), type, app, from, fromName: clip(n.fromName && from === 'neobase' ? n.fromName : fromName, 60), read: false, quiet: false, later };
    list.unshift(item); list.length = Math.min(list.length, MAX); changed();
    if (!n.silent) bubble(item);
    return item.id;
  }
  const mark = (id, on) => { for (const n of list) if (id === 'all' || n.id === id || n.app && id === 'app:' + n.app) n.read = on; changed(); };
  Object.assign(impl, {
    notifsList: async () => list,
    notifsRead: async (id, on = true) => mark(id, !!on),
    notifsRemove: async id => { list = id === 'all' ? [] : list.filter(n => n.id !== id); changed(); },
    notifsAdd: async n => add(n, 'neobase', 'NeoDex'),
    notifsLater: async id => {
      const n = list.find(x => x.id === id); if (!n?.later) throw new Error('rien à repousser');
      const again = { ...n.later, later: true, fromName: n.fromName };
      list = list.filter(x => x !== n); changed();
      setTimeout(() => { try { add(again, 'neobase', n.fromName); } catch {} }, 10 * 60e3);   // shortcut: oublié si l'appli est fermée avant (comme sur PC), suffisant pour un rappel de 10 min
    },
    notifsMuted: async () => muted,
    notifsMute: async (key, on) => {
      if (typeof key !== 'string' || !/^[\w.:-]{1,120}\|[a-z0-9-]{1,40}$/.test(key)) throw new Error('type invalide');
      if (on) muted[key] = true; else delete muted[key];
      save('notifs-muted', muted); return muted;
    },
  });
  window.__neoShell.notify = add;   // pour neo-plugins.js : pluginNotify (un plugin qui a l'autorisation « notifications »)

  // ---------- les rappels de l'agenda même NeoDex fermé, et le widget d'écran d'accueil ----------
  // Les rendez-vous à heure fixe des 7 prochains jours partent vers Android (NeoFile.reminders → NeoReminders.java), qui pose une alarme
  // 10 minutes avant chacun (le même rappel que web/notifs.js, « Dans 10 min : … »). Refait quand l'agenda change, et toutes les heures.
  const nf = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins?.NeoFile : null;
  const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  function upcoming(events, now = new Date()) {
    const out = [], today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let k = 0; k < 7; k++) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + k);
      for (const ev of events || []) {
        if (!ev || ev.kind === 'task' || ev.allDay || !/^\d\d:\d\d$/.test(ev.start || '') || !occurs(ev, day)) continue;
        const [h, m] = ev.start.split(':').map(Number), start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
        if (start <= now.getTime()) continue;
        out.push({ at: start - 10 * 60e3, start, title: 'Dans 10 min : ' + clip(ev.title, 100), body: ev.start + (ev.end ? ' – ' + ev.end : '') + (ev.place ? ' · ' + clip(ev.place, 80) : ''),
          when: (k === 0 ? 'Aujourd’hui' : k === 1 ? 'Demain' : DAY_FMT.format(day)) + ' ' + ev.start, name: clip(ev.title, 100) });
      }
    }
    return out.sort((a, b) => a.start - b.start).slice(0, 60);
  }
  let schedT = 0;
  const schedule = () => { clearTimeout(schedT); schedT = setTimeout(() => {
    try { if (typeof occurs === 'function') nf.reminders({ items: upcoming(load('api:agenda', {})?.events) }).catch(() => {}); } catch (e) { console.warn('rappels :', e); }
  }, 1500); };
  if (nf?.reminders) {
    window.__neoShell.ready.then(() => { setTimeout(schedule, 3000); setInterval(schedule, 3600e3); });
    window.__neoShell.onSaved(n => { if (n === 'api:agenda') schedule(); });
  }
  window.__neoRemindersTest = upcoming;
})();
