/* NeoDex sur téléphone : le service « musique » de l'hôte, pour tout plugin qui a l'autorisation « music » (aucun plugin en particulier).
   Sur PC le son d'un plugin vient de yt-dlp ; sur téléphone il n'y en a pas, et le bac à sable des plugins ne peut pas montrer le lecteur
   de YouTube (pas de frame-src). L'hôte offre donc :
     - neo.musicSearch(q, n) et neo.musicInfo(url) : la recherche YouTube et le titre d'un lien (noms déjà connus de PLUGIN_CAPS, autorisation « music ») ;
     - neo.musicPlayer({op: load|play|pause|stop|seek|volume|mute}) : le lecteur officiel de YouTube, caché dans la page de NeoDex ;
     - neo.onMusicPlayer(cb) : ses nouvelles (playing, paused, ended, meta, time, error) et les boutons de la notification ({t:'remote', action}).
   Décision de Nolan : pas d'adaptateur propre à un plugin dans l'appli. Un plugin qui veut jouer sur téléphone a sa version « -phone »
   (ex. neodex-plugin-music-phone) écrite pour ce service.
   La musique continue écran éteint grâce à NeoMusicService.java (notification, écran verrouillé), prévenu par NeoFile.musicState. */
(() => {
  const { impl, emit } = window.__neoShell;
  const native = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins : null;
  const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
  // lire une page de youtube.com : la page n'en a pas le droit (CORS), le téléphone si (CapacitorHttp) ; le serveur d'essai (tools/serve.js) relaie
  async function text(url) {
    // le cookie SOCS : sans lui, en Europe, YouTube répond par sa page « Avant d'accéder à YouTube » au lieu des résultats
    if (native?.CapacitorHttp) { const r = await native.CapacitorHttp.get({ url, responseType: 'text', headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9', Cookie: 'SOCS=CAI; CONSENT=YES+1' } }); if (r.status >= 400) throw new Error('YouTube injoignable (' + r.status + ')');
      return typeof r.data === 'string' ? r.data : JSON.stringify(r.data); }   // une réponse JSON (oembed) arrive déjà lue en objet
    const r = await fetch('/__dl?u=' + encodeURIComponent(url)); if (!r.ok) throw new Error('YouTube injoignable (' + r.status + ')'); return r.text();
  }
  const secs = s => String(s || '').split(':').reduce((a, v) => a * 60 + (+v || 0), 0);
  const ytId = url => (/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([\w-]{11})/.exec(url || '') || [])[1] || '';
  // la page de résultats de YouTube contient les résultats en JSON (ytInitialData) : les vidéos avec une durée, comme ytsearch de yt-dlp
  function parse(html) {
    const out = [], seen = new Set(), walk = o => {
      if (!o || typeof o !== 'object' || out.length >= 20) return;
      const v = o.videoRenderer;
      if (v?.videoId && !seen.has(v.videoId) && v.lengthText?.simpleText) { seen.add(v.videoId); out.push({ url: 'https://www.youtube.com/watch?v=' + v.videoId, title: v.title?.runs?.[0]?.text || '', author: (v.ownerText?.runs?.[0]?.text || '').replace(/\s*-\s*Topic$/, ''), duration: secs(v.lengthText.simpleText), thumbnail: 'https://i.ytimg.com/vi/' + v.videoId + '/hqdefault.jpg' }); }
      for (const k in o) walk(o[k]);
    };
    const a = html.indexOf('var ytInitialData = '); if (a < 0) { if (/consent\.youtube|Avant d.accéder à YouTube/i.test(html)) throw new Error('YouTube demande d’accepter ses cookies : réessaie'); return out; }
    let raw = html.slice(a + 20, html.indexOf(';</script>', a));
    if (raw[0] === "'") raw = raw.slice(1, -1).replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, '$1');   // la page pour mobile : le JSON est dans une chaîne échappée
    try { walk(JSON.parse(raw)); } catch { throw new Error('réponse de YouTube illisible'); }
    return out;
  }
  console.assert(parse("var ytInitialData = '\\x7b\\x22a\\x22:[\\x7b\\x22videoRenderer\\x22:\\x7b\\x22videoId\\x22:\\x22abcdefghijk\\x22,\\x22lengthText\\x22:\\x7b\\x22simpleText\\x22:\\x221:00\\x22\\x7d\\x7d\\x7d]\\x7d';</script>")[0]?.duration === 60, 'neo-music parse échappé');
  console.assert(parse('var ytInitialData = {"a":[{"videoRenderer":{"videoId":"abcdefghijk","title":{"runs":[{"text":"T"}]},"ownerText":{"runs":[{"text":"A - Topic"}]},"lengthText":{"simpleText":"3:20"}}}]};</script>')[0].duration === 200, 'neo-music parse');

  // ---------- 2. le lecteur YouTube caché, piloté par neo.musicPlayer, qui répond par neo.onMusicPlayer ----------
  let yt = null, ready = null, timer = null, meta = false, vol = 1, muted = false, vid = '';
  const send = s => emit('onMusicPlayer', s);
  const api = () => ready ??= new Promise((ok, ko) => {
    window.onYouTubeIframeAPIReady = ok;
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => { ready = null; ko(new Error('YouTube injoignable')); }; document.head.append(s);
  });
  const applyVol = () => { try { yt.setVolume(Math.round(Math.max(0, Math.min(1, vol)) * 100)); muted ? yt.mute() : yt.unMute(); } catch {} };
  const tick = () => { try { const cur = yt.getCurrentTime() || 0, dur = yt.getDuration() || 0; if (dur && !meta) { meta = true; send({ t: 'meta', dur }); } send({ t: 'time', cur, dur }); } catch {} };
  // ce qui joue, pour la notification et l'écran verrouillé (NeoMusicService.java) : sans elle, Android coupe le son écran éteint
  const state = () => { try { const d = yt?.getVideoData?.() || {}, playing = yt?.getPlayerState?.() === 1; native?.NeoFile?.musicState({ active: !!vid, playing, title: d.title || '', artist: d.author || '', art: vid ? 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg' : '', pos: yt?.getCurrentTime?.() || 0, dur: yt?.getDuration?.() || 0 }); } catch {} };
  setInterval(() => { if (yt?.getPlayerState?.() === 1) state(); }, 5000);   // la barre de progression de la notification
  async function load(url, autoplay = true) {
    vid = ytId(url); meta = false;
    if (!vid) throw new Error('ce morceau ne vient pas de YouTube : il ne se lit pas encore sur téléphone');
    await api();
    if (yt) { autoplay ? yt.loadVideoById(vid) : yt.cueVideoById(vid); return; }
    const box = document.createElement('div'); box.id = 'mYtBox'; document.body.append(box);
    await new Promise(ok => { yt = new YT.Player('mYtBox', { videoId: vid, playerVars: { autoplay: autoplay ? 1 : 0, playsinline: 1, controls: 0, origin: location.origin }, events: {
      onReady: e => { applyVol(); if (autoplay) e.target.playVideo(); ok(); },
      onStateChange: e => {
        if (e.data === 1) { send({ t: 'playing' }); clearInterval(timer); timer = setInterval(tick, 500); tick(); }
        else { clearInterval(timer); if (e.data === 2) send({ t: 'paused' }); if (e.data === 0) send({ t: 'ended' }); }
        state();
      },
      onError: e => send({ t: 'error', msg: [101, 150, 152, 153].includes(e.data) ? 'YouTube refuse que ce morceau soit lu dans une appli' : 'YouTube ne peut pas lire ce morceau' }),
    } }); });
  }
  impl.musicPlayer = async (o = {}) => {
    switch (o.op) {
      case 'load': return load(String(o.url || ''));
      case 'play': if (yt) yt.playVideo(); return true;
      case 'pause': if (yt) yt.pauseVideo(); return true;
      case 'stop': vid = ''; if (yt) yt.stopVideo(); state(); return true;
      case 'seek': if (yt) yt.seekTo(Math.max(0, +o.t || 0), true); return true;
      case 'volume': vol = +o.v; applyVol(); return true;
      case 'mute': muted = !!o.on; applyVol(); return true;
    }
    throw new Error('inconnu : ' + o.op);
  };
  // les boutons de la notification et de l'écran verrouillé
  native?.NeoFile?.addListener?.('music', d => {
    const a = String(d?.action || '');
    if (a.startsWith('seek:')) { yt?.seekTo?.(+a.slice(5) / 1000, true); return state(); }
    if (a === 'stop') { yt?.pauseVideo?.(); return; }
    if (['toggle', 'next', 'prev'].includes(a)) send({ t: 'remote', action: a });   // le plugin qui joue décide (morceau suivant de sa liste…)
  });
  // le lecteur passe par la même porte que musicSearch et musicInfo : l'autorisation « music » (table PLUGIN_CAPS de web/plugins.js)
  addEventListener('DOMContentLoaded', () => { try { PLUGIN_CAPS.musicPlayer = PLUGIN_CAPS.onMusicPlayer = 'music'; } catch {} });
  Object.assign(impl, {
    musicSearch: async (q, n = 5) => parse(await text('https://www.youtube.com/results?hl=fr&search_query=' + encodeURIComponent(String(q).slice(0, 200)))).slice(0, Math.min(+n || 5, 20)),
    musicInfo: async url => {
      const d = JSON.parse(await text('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(String(url))));
      return { title: d.title || 'Musique', author: d.author_name || '', url, thumbnail: ytId(url) ? 'https://i.ytimg.com/vi/' + ytId(url) + '/hqdefault.jpg' : d.thumbnail_url || '' };
    },
  });
  window.__neoMusicPlaying = () => !!vid && yt?.getPlayerState?.() === 1;   // le bouton retour d'Android ne ferme pas l'onglet qui joue (neo-mobile.js)
  window.__neoMusicTest = { parse, ytId };
})();