/* ---------- plugins : chargeur isolé + enregistrement des applis plugin (moteur : app/plugins-main.js) ----------
   Chaque plugin tourne dans un <iframe sandbox="allow-scripts"> : il n'a PAS accès à window.neo ni au reste de
   NeoDex. Il dessine dans son propre document et demande tout (stockage, fichiers, réseau, fonctions du PC) par
   messages à l'hôte, qui vérifie l'autorisation avant de répondre. L'hôte attribue chaque message à l'identifiant
   du plugin d'après son iframe : un plugin ne peut pas se faire passer pour un autre.
   Dans le bac à sable, le plugin a les mêmes outils d'interface que NeoDex (ctx.host : style, boîtes de dialogue,
   sons, icônes), le style de NeoDex, et ctx.neo : les fonctions du PC, chacune derrière son autorisation (PLUGIN_CAPS). */
const permLabel = n => n === 'storage' ? 'garder ses données' : n === 'files' ? 'lire ses fichiers' : n === 'network' ? 'accéder à Internet' : n === 'clipboard' ? 'utiliser le presse-papiers' : n === 'notifications' ? 'afficher des notifications' : n === 'full' ? 'accès complet à NeoDex' : n.startsWith('data:') ? 'utiliser les données de « ' + n.slice(5) + ' »' : n;

// les fonctions du PC qu'un plugin du bac à sable peut appeler par ctx.neo.<nom>(…) : nom -> autorisation ('' = aucune, rien de personnel)
// une fonction absente de la liste n'existe pas pour un plugin
const PLUGIN_CAPS = {
  spellText: '', convCaps: '', musicCaps: '',
  officeImport: 'documents', officeExport: 'documents', pathOf: 'documents', openFile: 'documents', showFile: 'documents', places: 'documents',
  pdfPick: 'documents', pdfRead: 'documents', pdfFetch: 'documents', pdfSaveCopy: 'documents', pdfExport: 'documents', onPdfOpen: 'documents',
  paintPick: 'documents', paintSave: 'documents', convPick: 'documents', convRun: 'documents', onConvProgress: 'documents',
  clipImage: 'clipboard', clipImageData: 'clipboard', clipFile: 'clipboard',
  screenCapture: 'screen',
  sysStats: 'system:info', procList: 'system:info', tbInfo: 'system:info', pluginsUsage: 'system:info', pluginStop: 'system:processes',
  procEnd: 'system:processes', startupList: 'system:startup', startupSet: 'system:startup',
  termShells: 'system:terminal', termStart: 'system:terminal', termRun: 'system:terminal', termStop: 'system:terminal', onTermData: 'system:terminal',
  appInfo: 'system:update', appCheckUpdate: 'system:update', appInstallUpdate: 'system:update', appUpdateState: 'system:update', onAppUpdate: 'system:update', pluginsList: 'system:update', pluginsDiscover: 'system:update',
  tbPet: 'taskbar', tbPetImgs: 'taskbar', onTbPetPoke: 'taskbar', onTbPetHome: 'taskbar',
  pluginMain: 'system:main', onPluginMain: 'system:main',
  tadaoSearch: 'network', tadaoNext: 'network', tadaoTrip: 'network',
  // la bibliothèque de fichiers d'un outil (GIF & stickers : « gifs ») : seulement son propre dossier (PLUGIN_FILES_DIR)
  filesAdd: 'documents', filesAddData: '', filesFetch: 'network', filesRead: '', filesRemove: '', filesPrune: '',
  // faites par l'hôte (PLUGIN_PSEUDO) : l'icône d'un programme, une image du PC, en data: URL (le bac à sable n'a pas le serveur local)
  exeIcon: 'system:info', fileData: 'documents', musicBuffer: 'music',
  // ses propres données et fichiers (l'autorisation est vérifiée par le moteur, d'après l'identifiant)
  pluginFileRead: '', pluginFolder: '', pluginNet: '', pluginStorage: '', onPluginDataChanged: '', onDataChanged: '',
};
const OWN_ONLY = ['pluginFileRead', 'pluginFolder', 'pluginNet', 'pluginStorage'];
const PLUGIN_FILES_DIR = { gifstickers: 'gifs' };
const dataUrl = u => fetch(u).then(r => { if (!r.ok) throw new Error('introuvable'); return r.blob(); }).then(b => new Promise((ok, ko) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = ko; fr.readAsDataURL(b); }));
const PLUGIN_PSEUDO = { exeIcon: p => dataUrl(iconUrl(String(p))), fileData: p => dataUrl(fileUrl(String(p))),
  pluginStop: id => { if (!pluginInfo.has(String(id))) throw new Error('plugin inconnu'); unloadPlugin(String(id)); return true; },  // the task manager stops a plugin (it starts again when opened)
  musicBuffer: u => { u = String(u); if (!u.startsWith('neoplugin://neodex.music/')) throw new Error('pas un morceau de NeoMusic'); return fetch(u).then(r => { if (!r.ok) throw new Error('morceau introuvable'); return r.arrayBuffer(); }); } };
// les données d'avant les plugins que chaque ancienne appli reprend à sa première ouverture : en lecture seule, pour un plugin signé,
// et seulement les siennes (un jeu : les scores ; Budget : le budget…). Clé : le nom du plugin sans son préfixe.
const PLUGIN_LEGACY = {
  api: { budget: ['budget'], journal: ['journal'], anime: ['sortiesanime'], games: ['frappe'] },
  store: { tools: ['outilstexte', 'couleurs', 'gifstickers'], office: ['docs', 'sheets', 'slides'], pdf: ['pdf'], pet: ['neome'] },
  settings: { hasard: ['wheel'], horloge: ['worldClocks'], nba: ['nbaTeam'], transports: ['tadaoStops'] },
  local: { calculatrice: ['neoCalc'], hasard: ['neoWheel'] },
};
async function pluginLegacy(p, op, a) {
  const short = p.id.split('.').pop(), deny = () => { throw Object.assign(new Error('PERMISSION_DENIED : données d’avant non autorisées'), { code: 'PERMISSION_DENIED' }); };
  if (!p.approved) deny();
  if (op === 'api' || op === 'store') {
    const ok = (PLUGIN_LEGACY[op][a] || []).includes(short) || (a === 'games' && op === 'api' && p.category === 'Jeux');
    if (!ok) deny();
    return op === 'api' ? api(a) : neo.storeGet(a);
  }
  if (op === 'settings') { const keys = PLUGIN_LEGACY.settings[short] || [], all = await neo.getSettings(); return Object.fromEntries(keys.filter(k => k in all).map(k => [k, all[k]])); }
  if (op === 'local') { if (!(PLUGIN_LEGACY.local[short] || []).includes(a)) deny(); try { return localStorage.getItem(a); } catch { return null; } }
  deny();
}
for (const k of ['musicAddFile', 'musicArtist', 'musicCacheLoad', 'musicCacheSave', 'musicClearCache', 'musicCover', 'musicDeezer', 'musicDeleteFile', 'musicDownload', 'musicEntries', 'musicExists', 'musicExportCapsule', 'musicFiles', 'musicHotkeys', 'musicImportCapsule', 'musicImportMuPlayer', 'musicInfo', 'musicLoad', 'musicMix', 'musicRadar', 'musicResolve', 'musicReveal', 'musicSave', 'musicSearch', 'musicStorage', 'musicWeekly', 'musicXxx', 'onMusicProgress', 'onMusicHotkey']) PLUGIN_CAPS[k] = 'music';
const capAllowed = (p, fn, args) => {  // un appel du volet système : seulement le sien ou celui d'une dépendance déclarée
  if (fn === 'pluginFolder' && Object.keys(p.dependencies || {}).includes(args[0])) return true;  // le dossier d'une dépendance déclarée (Aquarium : celui de la Pêche)
  if (OWN_ONLY.includes(fn)) return args[0] === p.id;
  if (fn.startsWith('files')) return args[0] === PLUGIN_FILES_DIR[p.id.split('.').pop()];
  if (fn !== 'pluginMain') return true;
  return args[0] === p.id || Object.keys(p.dependencies || {}).includes(args[0]);
};

// le code du bac à sable (document de l'iframe) : aucun backtick ici pour rester dans un template littéral.
// Pas de Google Fonts : les polices de NeoDex arrivent avec son style (pluginCss, en data:) avant le code du plugin ; le lien vers Google
// retardait chaque ouverture (et ne marchait pas hors ligne).
const pluginBoot = p => {
  const net = (p.permissions || []).filter(n => n === 'network' || n.startsWith('network:')).map(n => n === 'network' ? 'https:' : 'https://' + n.slice(8));
  const img = ['data:', 'blob:', location.origin, 'https://raw.githubusercontent.com', ...net].join(' ');
  return `<!doctype html><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src ${img}; font-src data: https://fonts.gstatic.com; media-src ${img}">
<style id="neoCss"></style>
<body></body>
<script>
(function(){
  var pending={}, rid=0, openCbs=[], closeCbs=[], ran=false, on={}, neoCbs={}, hooks=null, searchFn=null, wdata, wsize;
  function call(t, extra){ return new Promise(function(res,rej){ var id=++rid; pending[id]={res:res,rej:rej}; var m={neoPlugin:true, rid:id, t:t}; if(extra) for(var k in extra) m[k]=extra[k]; parent.postMessage(m,'*'); }); }
  function post(t, extra){ var m={neoPlugin:true, t:t}; if(extra) for(var k in extra) m[k]=extra[k]; parent.postMessage(m,'*'); }
  function el(tag,cls,text){ var n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n; }
  function theme(d){ var r=document.documentElement; for(var k in d.vars||{}) r.style.setProperty(k, d.vars[k]); if(d.cls!=null) r.className=d.cls; if(d.style!=null){ r.dataset.style=d.style; r.dataset.plugin='1'; } }
  function pixIcon(rows, scale){ scale=scale||2; var d=''; rows.forEach(function(r,y){ r.split('').forEach(function(c,x){ if(c==='#') d+='M'+x+' '+y+'h1v1H'+x+'z'; }); }); var w=rows[0].length, h=rows.length;
    return '<svg viewBox="0 0 '+w+' '+h+'" width="'+(w*scale)+'" height="'+(h*scale)+'" shape-rendering="crispEdges" fill="currentColor"><path d="'+d+'"/></svg>'; }
  function oops(e){ console.error(e); post('err',{msg:String(e&&e.message||e)}); }
  function fire(list, a){ (list||[]).forEach(function(f){ try{ var r=f(a); if(r&&r.catch) r.catch(oops); }catch(e){ oops(e); } }); }
  // ce que le bac à sable interdit (stockage du navigateur, presse-papiers, réseau direct) passe par NeoDex
  var mem={}; try{ Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:function(k){ return k in mem?mem[k]:null; },setItem:function(k,v){ mem[k]=String(v); },removeItem:function(k){ delete mem[k]; },clear:function(){ mem={}; },key:function(i){ return Object.keys(mem)[i]||null; },get length(){ return Object.keys(mem).length; }}}); }catch(e){}
  try{ Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:function(t){ return call('clip',{text:String(t)}); },readText:function(){ return call('clip',{}); }}}); }catch(e){}
  window.fetch=function(u,o){ u=String(u&&u.url||u); o=o||{}; var h=o.headers; if(h&&typeof h.forEach==='function'&&!Array.isArray(h)){ var x={}; h.forEach(function(v,k){ x[k]=v; }); h=x; }
    if(/^neoplugin:/i.test(u)) return call('npf',{url:u,opts:{method:o.method,headers:h,body:typeof o.body==='string'?o.body:undefined}}).then(function(r){ return new Response(r.body,{status:r.status,headers:{'content-type':r.type||''}}); });
    return call('net',{url:u,opts:{method:o.method,headers:h,body:typeof o.body==='string'?o.body:undefined}}).then(function(r){ return new Response(r.body,{status:r.status||200}); }); };
  // ses erreurs remontent à NeoDex (journal du plugin, mode diagnostic)
  window.addEventListener('error', function(e){ post('err',{msg:String(e.message||e)+(e.lineno?' (ligne '+e.lineno+')':'')}); });
  window.addEventListener('unhandledrejection', function(e){ var r=e.reason; post('err',{msg:String(r&&r.message||r)}); });
  document.addEventListener('securitypolicyviolation', function(e){ post('err',{msg:'bloqué par le bac à sable : '+e.violatedDirective+' '+e.blockedURI}); });
  // les raccourcis de NeoDex (Ctrl+T, Ctrl+W, F11…) marchent aussi quand le plugin a le clavier
  document.addEventListener('keydown', function(e){ if((e.ctrlKey||e.altKey||e.metaKey||/^F\\d+$/.test(e.key))&&!e.defaultPrevented) post('key',{key:e.key,code:e.code,ctrlKey:e.ctrlKey,altKey:e.altKey,shiftKey:e.shiftKey,metaKey:e.metaKey}); });
  window.addEventListener('message', function(e){
    var d=e.data; if(!d||!d.neoHost) return;
    if(d.rid && pending[d.rid]){ var p=pending[d.rid]; delete pending[d.rid]; return d.error?p.rej(Object.assign(new Error(d.error),{code:d.code})):p.res(d.result); }
    if(d.t==='theme'){ theme(d); return; }
    if(d.t==='open'){ fire(openCbs); return; }
    if(d.t==='close'){ fire(closeCbs); return; }
    if(d.t==='vis'){ document.body.classList.toggle('on', !!d.on); document.body.classList.toggle('homeW', !!d.home); return; }
    if(d.t==='hkey'){ document.dispatchEvent(new KeyboardEvent(d.type,{key:d.key,code:d.code,shiftKey:d.shiftKey,repeat:d.repeat,bubbles:true,cancelable:true})); return; }
    if(d.t==='neoEvt'){ (neoCbs[d.fn]||[]).forEach(function(f){ try{ f.apply(null,d.args||[]); }catch(x){ console.error(x); } }); return; }
    if(d.t==='command'){ fire(on['command:'+d.id], d.arg); fire(on.command, d.id); return; }
    if(d.t==='files'){ fire(on.files, d.files); return; }
    if(d.t==='widgetData'){ wdata=d.data; fire(on.wdata, d.data); return; }
    if(d.t==='widgetSize'){ wsize=d.size; fire(on.wsize, d.size); return; }
    if(d.t==='share'){ fire(on.share, d.data); return; }
    if(d.t==='hook'){ try{ hooks&&hooks[d.name]&&hooks[d.name](d.arg); }catch(x){} return; }
    if(d.t==='searchQ'){ Promise.resolve(searchFn?searchFn(d.q):[]).then(function(r){ post('searchR',{qid:d.qid,items:(r||[]).slice(0,8).map(function(i){ return {title:String(i.title||''),hint:String(i.hint||''),id:String(i.id||'')}; })}); },function(){ post('searchR',{qid:d.qid,items:[]}); }); return; }
    if(d.t==='load' && !ran){ ran=true; if(d.en){ document.documentElement.lang='en'; try{ window.neoTr=(${i18nInstall})(d.en, document.documentElement); }catch(x){ console.error(x); } } document.getElementById('neoCss').textContent=(d.css||'')+(d.game?' canvas,img{filter:var(--appf,none)}':'')+(d.widget?' html,body{background:transparent!important;overflow:hidden!important;margin:0;height:100%}':''); theme(d); if(d.bodyId) document.body.id=d.bodyId; window.ART=d.art||{}; document.body.className=d.widget?'neoWidgetView':'appView on'; if(d.widget){ wdata=d.widget.data; wsize=d.widget.size; } run(d); }
  });
  // sur téléphone (d.save) : un lien « download » ne télécharge rien dans l'appli Android ; le fichier part chez NeoDex, qui l'enregistre
  function saveLinks(){ var blobs={}, mk=URL.createObjectURL, rm=URL.revokeObjectURL, click=HTMLAnchorElement.prototype.click;
    URL.createObjectURL=function(b){ var u=mk.call(URL,b); if(b instanceof Blob) blobs[u]=b; return u; };
    URL.revokeObjectURL=function(u){ delete blobs[u]; return rm.call(URL,u); };
    HTMLAnchorElement.prototype.click=function(){ var a=this, h=a.href||'', b=blobs[h];
      if(!a.hasAttribute('download')||!(b||/^data:/.test(h))) return click.call(a);
      var name=a.getAttribute('download')||'fichier';
      if(!b){ var i=h.indexOf(','), head=h.slice(5,i); return void call('save',{name:name,type:head.split(';')[0],b64:/;base64$/.test(head)?h.slice(i+1):btoa(unescape(encodeURIComponent(decodeURIComponent(h.slice(i+1)))))}).catch(oops); }
      var fr=new FileReader(); fr.onload=function(){ var u=fr.result; call('save',{name:name,type:b.type,b64:u.slice(u.indexOf(',')+1)}).catch(oops); }; fr.readAsDataURL(b); }; }
  function run(d){
    if(d.save) saveLinks();
    var host={ el:el, $:function(id){ return document.getElementById(id); }, pixIcon:pixIcon, PIX:d.pix||{}, WX:d.wx||{},
      toast:function(m,err){ return call('toast',{msg:String(m),err:!!err}); }, newTab:function(u){ return call('newTab',{url:String(u)}); },
      sfx:function(n){ post('ui',{op:'sfx',a:String(n)}); }, ask:function(t,v,h){ return call('ui',{op:'ask',a:[t,v,h]}); },
      confirm:function(m,o){ return call('ui',{op:'confirm',a:[String(m),o||{}]}); }, box:function(o){ return call('ui',{op:'box',a:o}); },
      tabLabel:function(l,t){ post('ui',{op:'tabLabel',a:[l,t]}); }, sky:function(){ return call('ui',{op:'sky'}); }, win:function(a){ post('ui',{op:'win',a:a}); }, float:function(r){ return call('ui',{op:'float',a:r||null}); }, statCount:function(k,n){ post('ui',{op:'stat',a:[k,n]}); },
      addStyle:function(css){ var st=document.getElementById('plugCss'); if(!st){ st=document.createElement('style'); st.id='plugCss'; document.head.append(st); } st.textContent=css; },
      agenda:{ sync:function(src,evs){ return call('agenda',{src:String(src),evs:evs}); } },
      hooks:function(h){ hooks=h||null; post('hooks',{has:Object.keys(h||{})}); }, playing:function(on){ post('playing',{on:!!on}); },
      settings:function(){ return Promise.resolve({}); }, pref:function(){ return undefined; },
      t:function(s,v){ if(window.neoTr) return window.neoTr.t(s,v); s=String(s); for(var k in v||{}) s=s.split('{'+k+'}').join(v[k]); return s; } };  // t('Il reste {n} jours', {n}) : une phrase entière de locales/en.json (canvas, texte construit)
    var neo=new Proxy({},{get:function(_,fn){ if(typeof fn!=='string'||fn==='then') return undefined;
      if(/^on[A-Z]/.test(fn)) return function(cb){ (neoCbs[fn]=neoCbs[fn]||[]).push(cb); call('neoOn',{fn:fn}).catch(function(e){ console.error(e); }); };
      return function(){ return call('neo',{fn:fn,args:Array.prototype.slice.call(arguments)}); }; }});
    window.neo=neo;  // le même pont que ctx.neo : chaque fonction derrière son autorisation (le code écrit pour la page de NeoDex marche tel quel)
    var ctx={ id:d.id, version:d.version, icon:d.icon, view:document.body, el:el, host:host, t:host.t, neo:neo,
      ui:{ toast:host.toast, newTab:host.newTab, pixIcon:pixIcon },
      storage:{ get:function(){ return call('storage',{}); }, set:function(data){ return call('storage',{data:data}); } },
      folder:{ read:function(n){ return call('folder',{op:'read',a:n}); }, write:function(n,d){ return call('folder',{op:'write',a:n,b:d}); }, remove:function(n){ return call('folder',{op:'remove',a:n}); }, list:function(){ return call('folder',{op:'list'}); },
        readFile:function(n){ return call('folder',{op:'readFile',a:n}); }, writeFile:function(n,b64){ return call('folder',{op:'writeFile',a:n,b:b64}); }, removeFile:function(n){ return call('folder',{op:'removeFile',a:n}); }, listFiles:function(){ return call('folder',{op:'listFiles'}); } },
      files:{ read:function(rel){ return call('fileRead',{rel:rel}).then(function(b64){ return Uint8Array.from(atob(b64),function(c){return c.charCodeAt(0)}); }); } },
      net:function(url,opts){ return call('net',{url:url,opts:opts}); },
      data:{ get:function(other){ return call('other',{other:other}); }, set:function(other,v){ return call('other',{other:other,data:v}); } },
      permission:function(name,why){ return call('request',{name:name,why:why}); },
      notifications:{ send:function(n){ return call('notify',{n:n}); } },
      commands:{ on:function(id,f){ (on['command:'+id]=on['command:'+id]||[]).push(f); }, run:function(id){ return call('api',{op:'command',a:String(id)}); } },
      onFiles:function(f){ (on.files=on.files||[]).push(f); }, onShare:function(f){ (on.share=on.share||[]).push(f); },
      share:function(data){ return call('api',{op:'share',a:data}); },
      search:{ provide:function(f){ searchFn=f; return call('request',{name:'search'}); } },
      widget:d.widget ? {  // dans l'iframe du widget de l'accueil : ce que le plugin lui envoie (ctx.widget.set({data})), sa taille, ses boutons
        onData:function(f){ (on.wdata=on.wdata||[]).push(f); if(wdata!==undefined) fire([f], wdata); }, size:function(){ return wsize; }, onSize:function(f){ (on.wsize=on.wsize||[]).push(f); },
        command:function(id){ return call('api',{op:'command',a:String(id)}); }, open:function(){ return call('newTab',{url:'plugin:'+d.id}); } }
        : { set:function(w){ return call('api',{op:'widget',a:w}); }, clear:function(){ return call('api',{op:'widget',a:null}); } },
      background:{ every:function(min,f){ return call('request',{name:'background'}).then(function(ok){ if(!ok) return false; setInterval(function(){ fire([f]); }, Math.max(1,+min||1)*60000); return true; }); } },
      backup:{ list:function(){ return call('api',{op:'backups'}); }, restore:function(name){ return call('api',{op:'restore',a:String(name)}); } },
      legacy:{ api:function(n){ return call('legacy',{op:'api',a:String(n)}); }, settings:function(){ return call('legacy',{op:'settings'}); }, local:function(k){ return call('legacy',{op:'local',a:String(k)}); } },
      onOpen:function(f){ openCbs.push(f); }, onClose:function(f){ closeCbs.push(f); } };
    var done=function(){ post('started'); fire(openCbs); };
    try{
      var u=URL.createObjectURL(new Blob([d.code],{type:'text/javascript'}));
      import(u).then(function(mod){ URL.revokeObjectURL(u); return (mod.default||function(){})(ctx); }).then(done, fail);
    }catch(e){ fail(e); }
    function fail(e){ post('started'); post('err',{msg:'au démarrage : '+(e&&e.message||e)}); document.body.append(el('div','hint', 'Plugin en erreur : '+(e&&e.message||e))); call('toast',{msg:'Plugin en erreur : '+(e&&e.message||e), err:true}); console.error(e); }
  }
  parent.postMessage({neoPlugin:true, ready:true}, '*');
})();
</script>`;
};

// un carré du ciel de l'accueil, tel qu'à l'écran (le Taquin en fait un puzzle)
function pluginSky() {
  const c = document.createElement('canvas'), s = Math.min(innerWidth, innerHeight); c.width = c.height = 480;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  for (const id of ['skyFar', 'sky']) { const cv = $(id); if (!cv) continue; const k = cv.width / innerWidth; g.drawImage(cv, (innerWidth - s) / 2 * k, (innerHeight - s) / 2 * k, s * k, s * k, 0, 0, 480, 480); }
  return c.toDataURL('image/jpeg', .9);
}
// le style et le thème de NeoDex, donnés au bac à sable : ses polices locales en data: (l'iframe n'a pas d'origine)
let pluginCssP = null;
// NeoDex's own styles, in page order: its .css files (base, store, apps) and the <style> tags, not those of plugins
const pageSheets = () => [...document.querySelectorAll('head > style:not([data-plugin]):not(#plugTint), head > link[rel=stylesheet][href$=".css"]')];
const pluginCss = () => pluginCssP ??= (async () => {
  let css = (await Promise.all(pageSheets().map(s => s.tagName === 'STYLE' ? s.textContent : fetch(s.href).then(r => r.text(), () => '')))).join('\n');
  for (const m of new Set(css.match(/url\(fonts\/[^)]+\)/g) || [])) {
    try { const b = await (await fetch(m.slice(4, -1))).blob(), d = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); }); css = css.split(m).join('url(' + d + ')'); } catch {}
  }
  return css.replace(/url\((?!data:|https?:|["']?data:)["']?([^)"']+)["']?\)/g, (_, u) => 'url(' + new URL(u, location.href).href + ')')
    + '\nhtml,body{height:100%;overflow:auto} body{overflow:auto} body::after{display:none}';
})();
let pluginVarNames = null;
const pluginTheme = () => {
  const root = document.documentElement, s = getComputedStyle(root), o = {};
  pluginVarNames ??= new Set(pageSheets().flatMap(st => [...(st.sheet?.cssRules || [])].map(r => r.cssText).join('\n').match(/--[\w-]+(?=\s*:)/g) || []));
  for (const v of new Set([...pluginVarNames, ...[...root.style].filter(k => k.startsWith('--'))])) { const x = s.getPropertyValue(v).trim(); if (x) o[v] = x; }
  return o;
};

const pluginFrames = new Map();   // contentWindow -> {id, frame}
const pluginInfo = new Map();     // id -> info renvoyée par neo.pluginsList()
const pluginLoaded = new Set();
const pluginStarted = new Set();  // plugins dont le code a fini de démarrer (les messages en attente partent alors)
const pluginErrors = new Map();   // id -> [{at, msg}] : les erreurs du plugin dans le bac à sable (mode diagnostic)
const pluginQueue = new Map();    // id -> messages à remettre au plugin dès qu'il a démarré
const pluginViewId = id => 'plug_' + id.replace(/[^\w]/g, '_');

function ensurePluginView(id) {
  const vid = pluginViewId(id); let v = $(vid);
  if (!v) { v = el('div', 'appView'); v.id = vid; $('bViews').append(v); }
  return v;
}
function loadPluginFrame(p) {
  if (pluginLoaded.has(p.id)) return;
  const v = ensurePluginView(p.id); v.innerHTML = '';
  const f = el('iframe', 'pluginFrame'); f.setAttribute('sandbox', 'allow-scripts allow-pointer-lock allow-downloads'); f.allow = 'fullscreen; gamepad'; f.srcdoc = pluginBoot(p); f.title = p.name; f.name = p.id;  // son nom : son identifiant (les tests retrouvent sa frame)
  v.append(f); pluginLoaded.add(p.id);
  pluginFrames.set(f.contentWindow, { id: p.id, frame: f });
}
// a theme change goes to the widgets too; the rest (open, commands, files…) is for the plugin itself
function postToPlugin(id, msg) { for (const [win, e] of pluginFrames) if (e.id === id && (!e.widget || msg.t === 'theme')) win.postMessage({ neoHost: true, ...msg }, '*'); }
function postToWidget(id, msg) { for (const [win, e] of pluginFrames) if (e.id === id && e.widget) win.postMessage({ neoHost: true, ...msg }, '*'); }
const frameOf = id => [...pluginFrames.values()].find(e => e.id === id && !e.widget)?.frame;

// --- plugins à accès complet : signés par NeoDex ET autorisés « full ». Ils tournent DANS la page, avec neo et les aides de NeoDex.
// Un plugin non signé ne reçoit jamais cet accès. Le bac à sable est la règle ; l'accès complet, l'exception qui disparaît. ---
const pluginHooks = new Map();  // id -> {audio(), mute(on), onClose(), onTabChange(), playing()}
const pluginTabChange = () => {
  // d'abord « ta vue est-elle affichée ? », ensuite onTabChange : un plugin du bac à sable qui regarde sa vue dans onTabChange la voit à jour (le petit lecteur de NeoMusic)
  // home: the home page is on screen with this plugin's widget (NeoMusic then keeps its mini player away). shortcut: told on tab changes only, not when the widget is cut or added in « Disposer »
  const homeW = id => !active && [...pluginFrames.values()].some(w => w.widget && w.id === id && w.frame.offsetParent);
  for (const e of pluginFrames.values()) { if (e.widget) continue; const on = !!e.frame.closest('.on'); if (on) pluginFloat(e.frame, null); postToPlugin(e.id, { t: 'vis', on, home: homeW(e.id) }); }
  pluginHooks.forEach(h => { try { h.onTabChange?.(); } catch {} });  // « ma vue est-elle affichée ? » (un plugin s'arrête quand on quitte son onglet)
};
// le petit lecteur d'un plugin du bac à sable (NeoMusic) : sa frame, sans bouger dans la page (elle se rechargerait), flotte dans un coin
// tant que son onglet n'est pas affiché. Petite taille, dans la fenêtre, et seulement si « petit lecteur » est permis dans les réglages.
// sur l'accueil, la zone des onglets est masquée : body.plugFloat la garde affichée, transparente, le temps qu'un petit lecteur flotte
const plugFloatSync = () => document.body.classList.toggle('plugFloat', !!document.querySelector('#bViews .pluginFrame.float'));
function pluginFloat(frame, a) {
  if (!a || frame.closest('.on') || prefs?.pip === false) { frame.classList.remove('float'); for (const k of ['left', 'top', 'width', 'height']) frame.style[k] = ''; plugFloatSync(); return null; }
  const w = Math.round(Math.min(460, Math.max(60, +a.w || 0))), h = Math.round(Math.min(220, Math.max(40, +a.h || 0)));
  const x = Math.round(Math.min(Math.max(typeof a.x === 'number' && isFinite(a.x) ? a.x : innerWidth - w - 24, 0), innerWidth - w));
  const y = Math.round(Math.min(Math.max(typeof a.y === 'number' && isFinite(a.y) ? a.y : innerHeight - h - 24, 46), innerHeight - h));
  Object.assign(frame.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); frame.classList.add('float'); plugFloatSync();
  return { x, y };
}
const pluginTabClosed = t => { if (t.app?.plugin) try { pluginHooks.get(t.app.plugin)?.onClose?.(); } catch {} };
const pluginPlaying = () => [...pluginHooks.values()].some(h => { try { return !!h.playing?.(); } catch { return false; } });
// les crochets d'un plugin du bac à sable : NeoDex lui écrit ; « en lecture » lui est dit par le plugin (ctx.host.playing(true))
const sandboxHooks = (id, has) => { const h = { _playing: false, playing: () => h._playing }; for (const n of has) if (n !== 'playing' && n !== 'audio') h[n] = arg => postToPlugin(id, { t: 'hook', name: n, arg }); return h; };
// une appli de NeoDex qui a son plugin installé : ouvrir l'ancienne ouvre le plugin (pas de doublon ; si le plugin part, l'ancienne revient)
const pluginFor = url => PLUGIN_OF[url] && APPS[PLUGIN_OF[url]] ? PLUGIN_OF[url] : url;
let pluginsReady = false;
function pluginRestoreTabs() {  // les onglets de plugins de la dernière session, une fois les plugins enregistrés
  if (!pluginsReady) return;
  const want = pluginTabsWanted; pluginTabsWanted = [];
  for (const u of want) if (APPS[u]) newTab(u, false);
}
const privCtx = new Map();  // id -> {openCbs, closeCbs, on}
// signé par NeoDex ET accès complet déclaré et accordé : le plugin peut tout faire, dans la page
const isPrivileged = p => p.approved && p.permissions?.includes('full') && p.perms?.full === 'allow';
const folderOf = id => ({
  read: n => neo.pluginFolder(id, 'read', n), write: (n, d) => neo.pluginFolder(id, 'write', n, d), remove: n => neo.pluginFolder(id, 'remove', n), list: () => neo.pluginFolder(id, 'list'),
  readFile: n => neo.pluginFolder(id, 'readFile', n), writeFile: (n, b64) => neo.pluginFolder(id, 'writeFile', n, b64), removeFile: n => neo.pluginFolder(id, 'removeFile', n), listFiles: () => neo.pluginFolder(id, 'listFiles'),
});
const pushCb = (rec, k, f) => (rec.on[k] ??= []).push(f);
function privilegedCtx(p, view) {
  const rec = { openCbs: [], closeCbs: [], on: {}, search: null }; privCtx.set(p.id, rec);
  return { id: p.id, version: p.version, view, icon: pluginIconUrl(p), token: TOKEN, neo: window.neo, t: (s, vars) => i18n(s, vars), el, $, toast, newTab, showTab, api, sfx, ask, APPS, pixIcon, PIX, fileUrl, artImg, iconEl, render, save,
    folder: folderOf(p.id),  // le dossier de données du plugin : sauvegardé par NeoDex (synchro cloud et sauvegardes)
    host: { el, toast, sfx, ask, newTab, t: (s, vars) => i18n(s, vars), pixIcon, PIX, WX, closeTab: t => closeTab(t), agenda: { sync: (src, evs) => agendaSync(src, evs) },  // l'emploi du temps : un plugin y met ses événements (remplacés à chaque appel)
      addStyle: css => { let st = document.querySelector('style[data-plugin="' + p.id + '"]'); if (!st) { st = document.createElement('style'); st.dataset.plugin = p.id; document.head.append(st); } st.textContent = css; },  // le style du plugin (il peut utiliser les variables du thème : --magenta, --win, --line2, --lilac…) ; retiré avec lui
      menuItem: (label, title, fn) => tbPop.append(tbItem(label, title, fn)), statCount: (k, n) => { if (typeof statCount === 'function') statCount(k, n); },  // compte l'usage pour Stats
      win: a => window.neo?.win(a),  // les outils d'interface de NeoDex
      hooks: h => pluginHooks.set(p.id, h), playing: () => {}, pref: k => prefs?.[k],  // hooks : voir pluginHooks · pref : un réglage de NeoDex, en lecture seule
      confirm: nbConfirm, box: nbBox,  // les boîtes de dialogue de NeoDex : confirm(message) renvoie une promesse true / false
      settings: () => neo.getSettings(),  // les réglages de NeoDex, en lecture seule (ex. « aux couleurs de NeoDex » de Discord)
      dockBadge: n => window.dockBadge?.('plugin:' + p.id, n),  // le nombre sur son icône de la barre de gauche (0 : rien)
      tabLabel: (label, title) => pluginTabLabel(p.id, label, title) },
    // les données d'avant les plugins (réglages, fichiers de l'ancien cœur) : lues UNE fois à la première ouverture pour reprendre ce que tu avais, jamais écrites
    legacy: { settings: () => neo.getSettings(), api: n => api(n), local: k => { try { return localStorage.getItem(k); } catch { return null; } } },
    storage: { get: () => neo.pluginStorage(p.id), set: d => neo.pluginStorage(p.id, d) },
    data: { get: o => neo.pluginOther(p.id, o), set: (o, v) => neo.pluginOther(p.id, o, v) }, permission: (n, why) => neo.pluginRequest(p.id, n, why),
    notifications: { send: n => neo.pluginNotify(p.id, n) },
    commands: { on: (id, f) => pushCb(rec, 'command:' + id, f), run: id => pluginApi(p, 'command', id) },
    onFiles: f => pushCb(rec, 'files', f), onShare: f => pushCb(rec, 'share', f), share: d => pluginApi(p, 'share', d),
    search: { provide: f => { rec.search = f; return neo.pluginRequest(p.id, 'search'); } },
    widget: { set: w => pluginApi(p, 'widget', w), clear: () => pluginApi(p, 'widget', null) },
    background: { every: async (min, f) => { if (!await neo.pluginRequest(p.id, 'background')) return false; const t = setInterval(() => { try { f(); } catch (e) { console.error(e); } }, Math.max(1, +min || 1) * 60000); rec.closeCbs.push(() => clearInterval(t)); return true; } },
    backup: { list: () => pluginApi(p, 'backups'), restore: n => pluginApi(p, 'restore', n) },
    onOpen: f => rec.openCbs.push(f), onClose: f => rec.closeCbs.push(f) };
}
const fireOpen = id => privCtx.get(id)?.openCbs.forEach(f => { try { const r = f(); if (r?.catch) r.catch(e => console.error('plugin ' + id + ' (ouverture) :', e)); } catch (e) { console.error('plugin ' + id + ' (ouverture) :', e); } });
async function loadPrivileged(p, quiet) {
  if (pluginLoaded.has(p.id)) return;
  const v = ensurePluginView(p.id); v.innerHTML = ''; pluginLoaded.add(p.id);
  let code; try { code = await neo.pluginsEntry(p.id); } catch (e) { return toast('Plugin illisible : ' + e.message, true); }
  if (I18N_LANG === 'en') { const en = await neo.pluginsLocale(p.id).catch(() => null); if (en) i18nAdd(en); }  // ses textes en anglais, comme dans un cadre
  const ctx = privilegedCtx(p, v);
  try { const u = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); const mod = await import(u); URL.revokeObjectURL(u); await (mod.default || (() => {}))(ctx); if (!quiet) fireOpen(p.id); }
  catch (e) { v.append(el('div', 'hint', 'Plugin en erreur : ' + e.message)); toast('Plugin en erreur : ' + e.message, true); }
  pluginStartedNow(p.id);
}
// un message pour un plugin (commande, fichiers à ouvrir, partage…) : remis tout de suite s'il tourne, sinon dès qu'il a démarré
function pluginDeliver(id, msg) {
  if (!pluginStarted.has(id)) { if (!pluginQueue.has(id)) pluginQueue.set(id, []); pluginQueue.get(id).push(msg); return; }
  const rec = privCtx.get(id);
  if (!rec) return postToPlugin(id, msg);
  const fire = (k, a) => (rec.on[k] || []).forEach(f => { try { f(a); } catch (e) { console.error(e); } });
  if (msg.t === 'command') { fire('command:' + msg.id, msg.arg); fire('command', msg.id); } else if (msg.t === 'files') fire('files', msg.files); else if (msg.t === 'share') fire('share', msg.data);
}
function pluginStartedNow(id) { pluginStarted.add(id); const q = pluginQueue.get(id) || []; pluginQueue.delete(id); for (const m of q) pluginDeliver(id, m); }
// les plugins qui demandent une autorisation forte la demandent à la première ouverture, avec ce que ça implique
const FIRST_OPEN_PERMS = ['full'];  // « system:main » ne bloque pas : la page s'ouvre, son volet système démarre quand tu l'accordes (demandé à son premier appel)
function openPlugin(id) {
  const p = pluginInfo.get(id); if (!p) return;
  const need = FIRST_OPEN_PERMS.filter(n => p.approved && p.permissions?.includes(n) && p.perms?.[n] === undefined);
  if (need.length) {
    (async () => { for (const n of need) if (!await neo.pluginRequest(id, n)) return toast('Sans cette autorisation, « ' + p.name + ' » ne peut pas s\'ouvrir', true); await pluginsRefresh(); openPlugin(id); })();
    return;
  }
  if (p.permissions?.includes('full') && !isPrivileged(p) && p.approved) return toast('« ' + p.name + ' » a besoin de l\'accès complet : accorde-le dans Autorisations', true);
  if (isPrivileged(p)) { if (!pluginLoaded.has(id)) loadPrivileged(p); else Promise.resolve().then(() => fireOpen(id)); return; }  // après showTab : la vue est alors affichée
  if (!pluginLoaded.has(id)) loadPluginFrame(p);           // le code démarre et déclenche son premier onOpen tout seul
  else postToPlugin(id, { t: 'theme', vars: pluginTheme(), cls: document.documentElement.className, style: document.documentElement.dataset.style || '' }), postToPlugin(id, { t: 'vis', on: true }), postToPlugin(id, { t: 'open' });  // affiché AVANT « open » : un plugin qui ne redessine que vue affichée (horloge, jeux) repart
  setTimeout(() => frameOf(id)?.focus());  // le clavier va au plugin (jeux, raccourcis)
}
function unloadPlugin(id) {
  pluginHooks.delete(id); pluginStarted.delete(id);
  const rec = privCtx.get(id); if (rec) { rec.closeCbs.forEach(f => { try { f(); } catch (e) {} }); privCtx.delete(id); }
  for (const [win, e] of [...pluginFrames]) if (e.id === id && !e.widget) pluginFrames.delete(win);  // its widget on the home page keeps running
  pluginLoaded.delete(id); const v = $(pluginViewId(id)); if (v) v.innerHTML = '';
  document.querySelector('style[data-plugin="' + id + '"]')?.remove();
  plugFloatSync();
}
const pluginTabLabel = (id, label, title) => { const t = tabs.find(o => o.app === APPS['plugin:' + id]); if (t) { t.btn.children[1].textContent = label; t.btn.title = title ?? label; } };

// --- les API communes aux deux modes : commandes, partage, widgets, sauvegardes ---
const pluginWidgets = (() => { try { return JSON.parse(localStorage.getItem('nbWidgets') || '{}'); } catch { return {}; } })();
async function pluginApi(p, op, a) {
  if (op === 'command') { const c = (p.commands || []).find(x => x.id === a); if (!c) throw new Error('commande inconnue : ' + a); return runPluginCommand(p.id, c), true; }
  if (op === 'share') return pluginShare(a, p.id);
  if (op === 'widget') {
    if (!widgetOffered(p)) throw new Error('widget non déclaré dans plugin.json (autorisation « widget »)');
    if (a == null) delete pluginWidgets[p.id];
    else if (p.widgetView) {  // a widget drawn by the plugin (plugin.json « widget »: "widget.js"): any data, passed to its iframe
      const json = JSON.stringify(a.data ?? null) || 'null'; if (json.length > 200e3) throw new Error('données du widget trop grosses (200 ko au plus)');
      pluginWidgets[p.id] = { data: JSON.parse(json), at: Date.now() }; postToWidget(p.id, { t: 'widgetData', data: pluginWidgets[p.id].data });
    } else pluginWidgets[p.id] = { title: String(a.title || p.name).slice(0, 40), lines: (Array.isArray(a.lines) ? a.lines : [a.text || '']).map(x => String(x).slice(0, 80)).slice(0, 4), at: Date.now(),
      // a gauge (0 to 1) and a small picture (an image the plugin drew or downloaded, as a data: address, at most 200 kB)
      bar: Number.isFinite(a.bar) ? Math.max(0, Math.min(1, a.bar)) : undefined,
      img: typeof a.img === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(a.img) && a.img.length < 270e3 ? a.img : undefined,
      // up to 3 buttons, each one runs a command the plugin declared (plugin.json « commands »)
      actions: (Array.isArray(a.actions) ? a.actions : []).filter(x => (p.commands || []).some(c => c.id === x?.command)).slice(0, 3).map(x => ({ label: String(x.label || x.command).slice(0, 24), command: String(x.command) })) };
    try { localStorage.setItem('nbWidgets', JSON.stringify(pluginWidgets)); } catch {}
    renderWidgets();
    return true;
  }
  if (op === 'backups') return neo.pluginBackup(p.id, 'list');
  if (op === 'restore') { const r = await neo.pluginBackup(p.id, 'restore', a); unloadPlugin(p.id); return r; }
  throw new Error('inconnu : ' + op);
}
// une commande déclarée par un plugin : ouvre le plugin (sauf « background ») puis lui dit laquelle
function runPluginCommand(id, c) {
  const p = pluginInfo.get(id); if (!p) return;
  if (c.background) { if (!pluginLoaded.has(id)) isPrivileged(p) ? loadPrivileged(p, true) : loadPluginFrame(p); } else newTab('plugin:' + id);
  pluginDeliver(id, { t: 'command', id: c.id });
}
// « ouvrir avec » : les plugins qui déclarent ouvrir cette extension (plugin.json « opens »)
const pluginsOpening = file => { const ext = '.' + String(file).split('.').pop().toLowerCase(); return [...pluginInfo.values()].filter(p => (p.opens || []).map(x => String(x).toLowerCase()).includes(ext)); };
function pluginOpenFiles(id, files) { newTab('plugin:' + id); pluginDeliver(id, { t: 'files', files: files.map(String) }); }
async function openWithPlugin(files, prefer) {
  const list = pluginsOpening(files[0]); if (!list.length) return false;
  let p = list.find(x => x.id === prefer) || list[0];
  if (list.length > 1 && !prefer) { const r = await nbBox({ title: 'Ouvrir avec…', text: String(files[0]).split(/[\\/]/).pop(), buttons: [...list.map(x => x.name), 'Annuler'] }); if (r.response >= list.length) return true; p = list[r.response]; }
  pluginOpenFiles(p.id, files); return true;
}
// partager un texte ou un lien : copier, ouvrir, ou l'envoyer à un plugin qui accepte ce genre de contenu (plugin.json « accepts »)
async function pluginShare(d, from) {
  d = { title: String(d?.title || '').slice(0, 120), text: String(d?.text || '').slice(0, 20000), url: /^https?:\/\//.test(d?.url || '') ? String(d.url) : '' };
  const kinds = [d.text && 'text', d.url && 'url'].filter(Boolean);
  const to = [...pluginInfo.values()].filter(p => p.id !== from && p.enabled && (p.accepts || []).some(k => kinds.includes(k)));
  const btns = ['Copier', ...d.url ? ['Ouvrir'] : [], ...to.map(p => p.name), 'Annuler'], r = (await nbBox({ title: 'Partager' + (d.title ? ' « ' + d.title + ' »' : ''), text: (d.url || d.text).slice(0, 300), buttons: btns, cancelId: btns.length - 1 })).response;
  const b = btns[r];
  if (b === 'Copier') { await navigator.clipboard.writeText(d.url || d.text); toast('Copié'); return 'copied'; }
  if (b === 'Ouvrir') { newTab(d.url); return 'opened'; }
  const p = to[r - btns.indexOf(to[0]?.name)]; if (!p || b === 'Annuler') return false;
  newTab('plugin:' + p.id); pluginDeliver(p.id, { t: 'share', data: d }); return p.id;
}
// la recherche de l'accueil : les commandes des plugins, et les résultats des plugins qui en proposent (autorisation « search »)
const pluginSearchWait = new Map();
let pluginQid = 0;
async function pluginSearch(q) {
  const out = [];
  for (const p of pluginInfo.values()) for (const c of p.commands || []) if ((c.title + ' ' + p.name).toLowerCase().includes(q)) out.push({ title: c.title, hint: p.name, run: () => runPluginCommand(p.id, c) });
  const asks = [];
  for (const p of pluginInfo.values()) {
    if (!p.permissions?.includes('search') || p.perms?.search !== 'allow' || !pluginStarted.has(p.id)) continue;
    const rec = privCtx.get(p.id);
    const got = rec ? Promise.resolve(rec.search ? rec.search(q) : []).catch(() => []) : new Promise(ok => { const qid = ++pluginQid; pluginSearchWait.set(qid, ok); postToPlugin(p.id, { t: 'searchQ', q, qid }); setTimeout(() => { pluginSearchWait.delete(qid); ok([]); }, 800); });
    asks.push(got.then(items => { for (const i of (items || []).slice(0, 8)) out.push({ title: String(i.title || ''), hint: p.name + (i.hint ? ' · ' + i.hint : ''), run: () => { newTab('plugin:' + p.id); pluginDeliver(p.id, { t: 'command', id: 'search', arg: String(i.id || '') }); } }); }));
  }
  await Promise.all(asks);
  return out;
}
// sur l'accueil, pendant une recherche : les résultats des plugins (les widgets ont leur bloc, homeblocks.js) ; appelé par render()
function pluginHome(groups, q) {
  const group = (title, items) => { const g = el('div', 'group'), h = el('div', 'groupHead'), grid = el('div', 'grid nbWidgets'); h.append(el('span', 'label', title), el('span', 'count', items.length)); grid.append(...items); g.append(h, grid); return g; };
  if (!q) return;
  pluginSearch(q).then(items => {
    if (!items.length || $('search').value.trim().toLowerCase() !== q) return;
    groups.querySelector('.empty')?.remove();
    groups.append(group('Dans tes plugins', items.map(i => { const b = el('button', 'nbWidget px'); b.append(el('b', '', i.title), el('div', 'hint', i.hint)); b.onclick = i.run; return b; })));
  });
}
// les raccourcis clavier des commandes (plugin.json « commands[].keys », ex. « Ctrl+Alt+M ») : dans NeoDex ; « global » : partout dans Windows (autorisation « shortcuts »)
const keyName = e => [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta', e.key.length === 1 ? e.key.toUpperCase() : e.key].filter(Boolean).join('+');
document.addEventListener('keydown', e => {
  if (!e.ctrlKey && !e.altKey && !e.metaKey) return;
  const k = keyName(e).toLowerCase();
  for (const p of pluginInfo.values()) for (const c of p.commands || []) if (c.keys && c.keys.toLowerCase().replace(/\s/g, '') === k) { e.preventDefault(); runPluginCommand(p.id, c); return; }
});
// le plugin affiché n'a pas le clavier (tu as cliqué ailleurs dans NeoDex) : la touche lui revient, et il reprend le clavier (jeux : D F J K, flèches…)
for (const type of ['keydown', 'keyup']) document.addEventListener(type, e => {
  if (e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented || /^F\d+$/.test(e.key) || e.target.closest?.('input,textarea,select,[contenteditable],#nbDialog') || document.querySelector('#nbDialog')) return;
  const f = [...pluginFrames.values()].find(x => !x.widget && x.frame.closest('.on'))?.frame; if (!f) return;
  postToPlugin(f.name, { t: 'hkey', type, key: e.key, code: e.code, shiftKey: e.shiftKey, repeat: e.repeat });
  if (type === 'keydown') { e.preventDefault(); f.focus(); }
});
window.neo?.onPluginShortcut?.(d => { const p = pluginInfo.get(d.id), c = p?.commands?.find(x => x.id === d.command); if (c) runPluginCommand(d.id, c); });
// les thèmes apportés par des plugins (plugin.json « themes ») : rangés avec ceux de NeoDex ; « style » : le décor et les polices d'un des styles de NeoDex
function pluginThemes(list) {
  if (typeof THEMES === 'undefined' || typeof palette !== 'function') return;
  for (const k of Object.keys(THEMES)) if (k.startsWith('plugin:')) delete THEMES[k];
  for (const p of list) if (p.enabled) for (const t of p.themes || []) {
    if (!/^#[0-9a-f]{6}$/i.test(t.accent || '') || !/^#[0-9a-f]{6}$/i.test(t.light || '') || !/^#[0-9a-f]{6}$/i.test(t.third || '')) continue;
    THEMES['plugin:' + p.id + ':' + t.id] = [String(t.name || t.id).slice(0, 24), Math.round(rgbHue(hex2rgb(t.accent)) - 300), 1, 0, 0, palette(+t.hue || 270, +t.sat || 40, t.accent, t.light, t.third), String(t.about || p.name || '').slice(0, 160), THEMES[t.style] && !String(t.style).startsWith('plugin:') ? t.style : 'nebula'];
  }
}

// a plugin's theme may bring its own decor (themes[].css): in the page only while that theme is on (cleaned in plugins-main.js: plugins:themeCss);
// and a style for NeoDex's taskbar (themes[].taskbar), sent to the bar with the colours (taskbar-host.js)
let plugThemeCssKey = '', plugThemeBarCss = '';
function pluginThemeCss(k) {
  const m = /^plugin:(.+):([\w-]+)$/.exec(k || ''), key = m ? k : ''; if (key === plugThemeCssKey) return; plugThemeCssKey = key;
  const bar = css => { plugThemeBarCss = css || ''; if (typeof tbSendLook === 'function') tbSendLook(); };
  if (!m) { bar(''); return document.getElementById('plugThemeCss')?.remove(); }
  neo.pluginsThemeCss(m[1], m[2]).then(css => {
    if (plugThemeCssKey !== k) return;
    const st = document.getElementById('plugThemeCss') || document.head.appendChild(Object.assign(document.createElement('style'), {id: 'plugThemeCss'})); st.textContent = css || '';
  }).catch(() => {});
  neo.pluginsThemeCss(m[1], m[2], 'taskbar').then(css => plugThemeCssKey === k && bar(css)).catch(() => bar(''));
}

window.addEventListener('message', async e => {
  const d = e.data; if (!d || !d.neoPlugin) return;
  const entry = pluginFrames.get(e.source); if (!entry) return;  // message d'un iframe inconnu : ignoré
  const { id, frame } = entry, win = frame.contentWindow, p = pluginInfo.get(id);
  if (d.ready) { try { const [code, css, en] = await Promise.all([neo.pluginsEntry(id, entry.widget ? 'widget' : undefined), pluginCss(), I18N_LANG === 'en' ? neo.pluginsLocale(id).catch(() => null) : null]); win.postMessage({ neoHost: true, t: 'load', id, en,
    widget: entry.widget ? { data: pluginWidgets[id]?.data, size: (prefs.homeWidgetSizes || {})[id] || 'm' } : undefined, version: p?.version || '', code, css, vars: pluginTheme(), cls: document.documentElement.className, style: document.documentElement.dataset.style || '', bodyId: pluginViewId(id), icon: p ? pluginIconUrl(p) : '', pix: PIX, wx: typeof WX === 'undefined' ? {} : WX, art: typeof ART === 'undefined' ? {} : ART, game: p?.category === 'Jeux' && id !== 'neodex.taquin', save: typeof neo.saveFile === 'function' }, '*'); } catch (err) { toast('Plugin illisible : ' + err.message, true); } return; }
  // sans réponse attendue
  if (entry.widget && ['started', 'hooks', 'playing', 'key'].includes(d.t)) return;  // the widget is not the plugin: it does not start it nor speak for it
  if (d.t === 'started') return pluginStartedNow(id);
  if (d.t === 'err') { const l = pluginErrors.get(id) || []; l.push({ at: Date.now(), msg: String(d.msg).slice(0, 300) }); pluginErrors.set(id, l.slice(-30)); console.warn('plugin ' + id + ' :', d.msg);
    // une mise à jour de moins de 7 jours qui plante au démarrage : retour à la version d'avant (gardée à l'installation)
    if (!entry.widget && /^au démarrage/.test(d.msg) && p?.previous && Date.now() - (p.updatedAt || 0) < 7 * 864e5) neo.pluginsRollback(id).then(async r => { if (!r) return; toast('Retour à la version d\'avant : ' + r.name + ' ' + r.to + ' (la ' + r.from + ' plantait)', true); unloadPlugin(id); await pluginsRefresh(); }).catch(() => {});
    return; }
  if (d.t === 'key') { if (frame.closest('.on')) document.dispatchEvent(new KeyboardEvent('keydown', { key: d.key, code: d.code, ctrlKey: d.ctrlKey, altKey: d.altKey, shiftKey: d.shiftKey, metaKey: d.metaKey, bubbles: true })); return; }
  if (d.t === 'hooks') return void pluginHooks.set(id, sandboxHooks(id, d.has || []));
  if (d.t === 'playing') { const h = pluginHooks.get(id); if (h) h._playing = !!d.on; return; }
  if (d.t === 'searchR') { const ok = pluginSearchWait.get(d.qid); if (ok) { pluginSearchWait.delete(d.qid); ok(d.items || []); } return; }
  if (d.t === 'ui' && !d.rid) {
    if (d.op === 'sfx') sfx(d.a); else if (d.op === 'tabLabel') pluginTabLabel(id, String(d.a?.[0] ?? ''), d.a?.[1]); else if (d.op === 'stat' && typeof statCount === 'function') statCount('plugin:' + id, +d.a?.[1] || 1);
    else if (d.op === 'win' && ['focus', 'fs'].includes(d.a)) neo.win(d.a);
    return;
  }
  const reply = (result, error) => win.postMessage({ neoHost: true, rid: d.rid, result, error: error ? String(error.message || error) : undefined, code: error?.code }, '*');
  try {
    let r;
    switch (d.t) {
      case 'toast': toast(d.msg, d.err); r = true; break;
      case 'save': {  // un fichier exporté par le plugin (lien download), sur téléphone seulement (neo.saveFile de mobile/shell/neo-mobile.js)
        if (typeof neo.saveFile !== 'function' || typeof d.b64 !== 'string') throw new Error('enregistrement impossible ici');
        if (d.b64.length > 140e6) throw new Error('fichier trop gros pour le téléphone (100 Mo au plus)');
        const s = await neo.saveFile(String(d.name || 'fichier').slice(0, 120), d.b64, String(d.type || '').slice(0, 100));
        toast('Enregistré' + (s?.where ? ' dans ' + s.where : '') + ' : ' + (s?.name || d.name)); r = true; break;
      }
      case 'newTab': newTab(d.url); r = true; break;
      case 'storage': r = d.data !== undefined ? await neo.pluginStorage(id, d.data) : await neo.pluginStorage(id); break;
      case 'folder': r = await neo.pluginFolder(id, d.op, d.a, d.b); break;
      case 'fileRead': r = await neo.pluginFileRead(id, d.rel); break;
      case 'net': r = await neo.pluginNet(id, d.url, d.opts); break;
      case 'npf': {  // son volet système (neoplugin://<id>/…), ou celui d'une dépendance déclarée
        const u = new URL(String(d.url)), o = d.opts || {};
        if (u.protocol !== 'neoplugin:' || !(u.hostname === id || Object.keys(p?.dependencies || {}).includes(u.hostname))) throw Object.assign(new Error('PERMISSION_DENIED : fichiers d\'un autre plugin'), { code: 'PERMISSION_DENIED' });
        const res = await fetch(u.href, { method: o.method || 'GET', headers: o.headers || undefined, body: o.body });
        r = { status: res.status, type: res.headers.get('content-type') || '', body: await res.arrayBuffer() };
        break;
      }
      case 'other': r = await neo.pluginOther(id, d.other, d.data); break;
      case 'request': r = await neo.pluginRequest(id, d.name, d.why); break;
      case 'notify': r = await neo.pluginNotify(id, d.n); break;
      case 'agenda': if (!await neo.pluginRequest(id, 'agenda')) throw Object.assign(new Error('PERMISSION_DENIED : agenda'), { code: 'PERMISSION_DENIED' }); r = await agendaSync('plugin:' + id + ':' + d.src, Array.isArray(d.evs) ? d.evs.slice(0, 500) : [], [String(d.src)]); break;  // [d.src] : son nom quand il tournait dans la page
      case 'clip':  // écrire dans le presse-papiers : sans autorisation (comme un bouton « Copier ») ; le lire : « clipboard »
        if (d.text !== undefined) { await navigator.clipboard.writeText(d.text); r = true; break; }
        if (!await neo.pluginRequest(id, 'clipboard')) throw Object.assign(new Error('PERMISSION_DENIED : clipboard'), { code: 'PERMISSION_DENIED' });
        r = await navigator.clipboard.readText(); break;
      case 'ui':
        if (d.op === 'ask') r = await ask(String(d.a?.[0] ?? ''), String(d.a?.[1] ?? ''), String(d.a?.[2] ?? ''));
        else if (d.op === 'confirm') r = await nbConfirm(d.a?.[0], { ok: d.a?.[1]?.ok, cancel: d.a?.[1]?.cancel, danger: d.a?.[1]?.danger });
        else if (d.op === 'sky') r = pluginSky();
        else if (d.op === 'float') r = pluginFloat(frame, d.a);
        else if (d.op === 'box') { const o = d.a || {}; r = await nbBox({ title: String(o.title || p?.name || ''), text: String(o.text || ''), buttons: (o.buttons || ['OK']).map(String).slice(0, 5), defaultId: o.defaultId, cancelId: o.cancelId, danger: !!o.danger, checkbox: o.checkbox ? String(o.checkbox) : '' }); }
        break;
      case 'api': r = await pluginApi(p, d.op, d.a); break;
      case 'legacy': r = await pluginLegacy(p, d.op, d.a); break;
      case 'neo': case 'neoOn': {
        let fn = String(d.fn), args = Array.isArray(d.args) ? d.args : [];
        // NeoMusic d'un autre plugin (Rythme, NeoTha…) : son volet système avec l'autorisation « music », pas « system:main » ; un morceau entier est lu par l'hôte
        const viaMusic = p.id !== 'neodex.music' && (fn === 'pluginMain' ? args[0] === 'neodex.music' : fn === 'onPluginMain' && 'neodex.music' in (p.dependencies || {}));
        if (viaMusic && fn === 'pluginMain' && args[1] === 'music:buffer') { fn = 'musicBuffer'; args = args.slice(2); }
        const perm = viaMusic ? 'music' : PLUGIN_CAPS[fn];
        if (fn === 'storeGet' && d.t === 'neo') { r = await pluginLegacy(p, 'store', String(args[0])); break; }  // ancienne façon de reprendre ses données
        if (perm === undefined || typeof (PLUGIN_PSEUDO[fn] || neo[fn]) !== 'function') throw new Error('« ' + fn + ' » n\'est pas disponible pour un plugin');
        if (!capAllowed(p, fn, args)) throw Object.assign(new Error('PERMISSION_DENIED : volet système d\'un autre plugin'), { code: 'PERMISSION_DENIED' });
        if (perm && !await neo.pluginRequest(id, perm)) throw Object.assign(new Error('PERMISSION_DENIED : « ' + id + ' » n\'a pas l\'autorisation « ' + perm + ' »'), { code: 'PERMISSION_DENIED' });
        if (d.t === 'neoOn') { pluginEvent(fn, id); r = true; } else r = await (PLUGIN_PSEUDO[fn] || neo[fn])(...args);
        break;
      }
      default: return;
    }
    reply(r);
  } catch (err) { reply(undefined, err); }
});
// un événement du PC (progression, données d'un terminal…) : écouté une fois, remis aux plugins qui s'y sont abonnés
const pluginEvents = new Map();  // nom -> Set(id)
function pluginEvent(fn, id) {
  if (!pluginEvents.has(fn)) {
    pluginEvents.set(fn, new Set());
    neo[fn]((...args) => { for (const pid of pluginEvents.get(fn)) {
      if (fn === 'onPluginDataChanged' && args[0]?.id !== pid) continue;
      if (fn === 'onPluginMain') { const q = pluginInfo.get(pid); if (!q || !(args[0]?.id === pid || Object.keys(q.dependencies || {}).includes(args[0]?.id))) continue; }  // les événements de son volet système, ou de celui d'une dépendance
      postToPlugin(pid, { t: 'neoEvt', fn, args });
    } });
  }
  pluginEvents.get(fn).add(id);
}

const pluginIconUrl = p => p.repo ? 'https://raw.githubusercontent.com/' + p.repo + '/main/icon.png' : artImg('plugin');
function registerPluginApp(p) {
  pluginInfo.set(p.id, p);
  ensurePluginView(p.id);
  APPS['plugin:' + p.id] = { name: p.name, cat: p.category, view: pluginViewId(p.id), icon: pluginIconUrl(p), plugin: p.id, open: () => openPlugin(p.id) };  // vraie icône du plugin (onglet + tuile)
}
// une tuile sur l'accueil (catégorie Général) pour chaque plugin activé ; retirée quand il part
let lastPluginList = [];
const pluginTilesAgain = () => { syncPluginTiles(lastPluginList, true); render(); };
function syncPluginTiles(list, again) {
  if (typeof links === 'undefined') return;
  if (!again) lastPluginList = list;
  const want = new Set(list.filter(p => p.enabled && p.type !== 'theme').map(p => 'plugin:' + p.id)); let changed = false, added = false;
  const home = (links.find(l => /^plugin:/.test(l.target) && l.cat) || {}).cat || 'NeoApps';  // a new plugin joins the others (NeoApps on a new PC)
  for (const l of links) { const p = PLUGIN_OF[l.target]; if (p && !APPS[l.target] && APPS[p]) { l.target = p; changed = true; } }  // une appli retirée du cœur : sa tuile passe à son plugin, au même endroit
  for (let i = links.length - 1; i >= 0; i--) { const t = links[i].target; if (/^plugin:/.test(t) && !want.has(t)) { links.splice(i, 1); changed = true; } }
  for (const p of list) if (want.has('plugin:' + p.id) && !links.some(l => l.target === 'plugin:' + p.id) && !links.some(l => PLUGIN_OF[l.target] === 'plugin:' + p.id)) { links.push({ name: p.name, target: 'plugin:' + p.id, cat: home }); changed = true; added = true; }  // même catégorie que tes autres applis ; pas de 2e tuile si l'ancienne appli a déjà la sienne
  if (added && typeof tab !== 'undefined') tab = null;  // pour que la nouvelle tuile se voie
  if (changed) save();
  render();  // toujours : les tuiles dessinées avant l'arrivée des plugins n'avaient que leur lettre
}
// le filtre de couleur du thème sur les jeux (comme pour les jeux du cœur) : les vues des plugins de la catégorie Jeux, et le Taquin
function pluginTint(list) {
  let st = document.getElementById('plugTint'); if (!st) { st = document.createElement('style'); st.id = 'plugTint'; document.head.append(st); }
  const v = id => '#' + pluginViewId(id), games = list.filter(p => p.enabled && p.category === 'Jeux');
  st.textContent = games.filter(isPrivileged).map(p => v(p.id) + ' canvas, ' + v(p.id) + ' img').join(', ') + '{filter:var(--appf, none)}';  // (dans le bac à sable, la règle est posée dans l'iframe)
}
// une donnée d'un plugin a changé sur un autre PC : le plugin relit son dossier (il se recharge ; s'il est devant, il se rouvre)
const pluginDataTimers = {};
window.neo?.onPluginDataChanged?.(d => {
  clearTimeout(pluginDataTimers[d.id]);
  pluginDataTimers[d.id] = setTimeout(() => {
    const p = pluginInfo.get(d.id); if (!p || !pluginLoaded.has(d.id)) return;
    const shown = $(pluginViewId(d.id))?.classList.contains('on');
    unloadPlugin(d.id);
    if (shown) openPlugin(d.id); else if (p.autoload) pluginAutoload(p);
  }, 1500);
});
// un plugin qui agit sans être ouvert (tâches de fond, NeoPDF qui reçoit les PDF des sites) : chargé au démarrage
const pluginAutoload = p => isPrivileged(p) ? loadPrivileged(p, true) : (p.permissions?.includes('background') && p.perms?.background === 'allow') || p.perms?.full === 'allow' ? loadPluginFrame(p) : null;
let pluginSafe;  // safe mode (crash-main.js): no plugin is loaded, their tiles and tabs are left as they are
async function pluginsRefresh() {
  if (!window.neo) return;
  if (pluginSafe ??= !!(await neo.crashState().catch(() => null))?.safe) { pluginsReady = true; return; }
  let list; try { list = await neo.pluginsList(); } catch { return; }
  const want = new Set(list.filter(p => p.enabled).map(p => p.id));
  for (const id of [...pluginInfo.keys()]) if (!want.has(id)) { delete APPS['plugin:' + id]; unloadPlugin(id); pluginInfo.delete(id); }  // désactivé ou désinstallé
  for (const p of list) if (p.enabled) {
    const was = pluginInfo.get(p.id);
    if (p.type === 'theme') { pluginInfo.set(p.id, p); continue; }  // un thème : rien à ouvrir
    registerPluginApp(p);
    if (was && (was.version !== p.version || isPrivileged(was) !== isPrivileged(p))) unloadPlugin(p.id);  // mis à jour ou changé de mode : recharge au prochain ouvrir
  }
  if (typeof links !== 'undefined') { try { await linksReady; } catch {} syncPluginTiles(list); }  // après le chargement des raccourcis, sinon ils écrasent nos tuiles
  pluginTint(list); pluginThemes(list);
  if (String(prefs.bgTheme).startsWith('plugin:')) applyTheme(prefs.bgTheme);  // a plugin's theme chosen before this launch: its colours only arrive now
  // téléphone : les plugins de fond (matchs dans l'agenda…) démarrent l'un après l'autre, après l'affichage de l'accueil, pas tous au lancement
  list.filter(p => p.enabled && p.autoload && !pluginLoaded.has(p.id)).forEach((p, i) => window.neo?.mobile ? setTimeout(() => { if (!pluginLoaded.has(p.id) && pluginInfo.has(p.id)) pluginAutoload(p); }, 4000 + i * 2000) : pluginAutoload(p));
  pluginsReady = true; pluginRestoreTabs();
  if (typeof storeOpen === 'function' && active?.app === APPS['neodex:store']) storeOpen();
}

// une autorisation demandée par un plugin à l'usage (ex. « data:neodex.calendrier »)
// demandée au moment où le plugin en a besoin, avec le contexte : ce qu'il veut faire, ce que ça permet, le risque. « Cette fois » vaut jusqu'à la fermeture de NeoDex.
const RISK_TXT = { faible: 'risque faible', moyen: 'risque moyen', 'élevé': 'RISQUE ÉLEVÉ' };
window.neo?.onPluginAskPerm(async d => {
  const lines = ['« ' + d.plugin + ' »' + (d.approved ? '' : ' (non vérifié)') + ' demande : ' + (d.label || d.name), d.sentence || '', d.why ? 'Pour : ' + d.why : '', (RISK_TXT[d.risk] || '') + (d.sensitive ? ' · accorde-la seulement si tu fais confiance à ce plugin' : '')].filter(Boolean);
  // sensible (accès complet, lancer un programme) : pas de « cette fois »
  const btns = d.sensitive ? ['Toujours', 'Refuser'] : ['Cette fois', 'Toujours', 'Refuser'];
  const { response } = await nbBox({ title: 'AUTORISATION', text: lines.join('\n'), buttons: btns, danger: d.risk === 'élevé' });
  const b = btns[response];
  neo.pluginPermAnswer(d.id, d.name, b === 'Refuser' ? false : b === 'Cette fois' ? 'once' : 'always');
});
window.neo?.onPluginsChanged(() => pluginsRefresh());
pluginsRefresh();

// --- mémoire : un plugin du bac à sable fermé ou caché depuis 5 minutes est déchargé (son cadre et son processus libérés) ; il redémarre à sa
// prochaine ouverture (showTab rappelle openPlugin). Restent chargés : celui qui est affiché, le petit lecteur qui flotte, un onglet qui joue du son,
// et les plugins qui ont le droit de travailler en arrière-plan (Sorties anime, Flux…) ou l'accès complet. Les plugins système tournent dans la page.
const pluginHiddenAt = new Map();
setInterval(() => {
  for (const { id, frame, widget } of [...pluginFrames.values()]) {
    if (widget) continue;
    const p = pluginInfo.get(id), tab = tabs.find(t => t.url === 'plugin:' + id);
    if (!p || frame.closest('.on') || frame.classList.contains('float') || tab?.audible || p.perms?.background === 'allow' || p.perms?.full === 'allow') { pluginHiddenAt.delete(id); continue; }
    if (!pluginHiddenAt.has(id)) { pluginHiddenAt.set(id, Date.now()); continue; }
    if (Date.now() - pluginHiddenAt.get(id) >= 5 * 60e3) { pluginHiddenAt.delete(id); unloadPlugin(id); }
  }
}, 30e3);

// les mises à jour des plugins approuvés, posées toutes seules (au démarrage puis toutes les 6 h) : sinon une correction publiée
// attend qu'on pense à ouvrir NeoStore. Jamais une mise à jour qui demande une autorisation de plus (elle reste dans « Mises à jour »),
// ni un plugin ouvert dans un onglet (il serait rechargé en pleine partie), ni ce que l'antivirus signale
async function pluginsAutoUpdate() {
  try {
    if ((await neo.getSettings()).pluginAutoUpdate === false) return;
    const mine = new Map((await neo.pluginsList()).map(p => [p.id, p])), d = await neo.pluginsDiscover(false), done = [];
    for (const a of d.approved) {
      const p = mine.get(a.id);
      if (!p || p.version === a.version || p.skip === a.version || tabs.some(t => t.url === 'plugin:' + a.id)) continue;
      try { const r = await neo.pluginsInstall({repo: a.repo, id: a.id, version: a.version}); if (r && !r.needsPermConsent && !r.needsConfirm) done.push(a.name + ' ' + a.version); } catch {}
    }
    if (done.length) { await pluginsRefresh(); toast('Plugins mis à jour : ' + done.join(', ')); }
  } catch (e) { console.warn('mise à jour des plugins :', e.message); }
}
setTimeout(pluginsAutoUpdate, 90e3); setInterval(pluginsAutoUpdate, 6 * 3600e3);
