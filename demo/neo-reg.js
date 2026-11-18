window.NEO_REG = (() => { const module = { exports: {} }, require = () => ({
  "registry": 2,
  "sdk": "2.1.0",
  "about": "Registre unique des autorisations de NeoDex. Source de vérité pour le SDK, le schéma plugin.schema.json, le moteur de plugins, NeoStore et l'appli Autorisations. Une autorisation absente de ce registre fait échouer la validation du plugin.",
  "risks": {
    "faible": "Ne touche qu'à ce qui appartient au plugin.",
    "moyen": "Sort du plugin : Internet, presse-papiers, données d'un autre plugin en lecture.",
    "élevé": "Peut modifier ce qui ne lui appartient pas, ou agir sur ton PC."
  },
  "permissions": [
    {
      "id": "storage",
      "label": "Ses données",
      "sentence": "Peut garder ses propres données (sauvegardées et synchronisées par NeoDex).",
      "risk": "faible",
      "scope": {
        "quota": "sans plafond pour un plugin signé, 1 Go pour tout le dossier d'un plugin non vérifié"
      }
    },
    {
      "id": "files",
      "label": "Ses fichiers",
      "sentence": "Peut lire les fichiers livrés avec le plugin (images, sons…), et rien d'autre sur ton PC.",
      "risk": "faible"
    },
    {
      "id": "notifications",
      "label": "Notifications",
      "sentence": "Peut t'envoyer des notifications dans le centre de notifications de NeoDex.",
      "risk": "faible"
    },
    {
      "id": "network:<domaine>",
      "pattern": "^network:(\\*\\.)?([a-z0-9-]+\\.)+[a-z]{2,}$",
      "label": "Internet ({domaine})",
      "sentence": "Peut contacter {domaine}, et aucun autre site.",
      "risk": "faible",
      "scope": {
        "domaine": "un nom de domaine ; *.exemple.org couvre aussi ses sous-domaines"
      }
    },
    {
      "id": "network",
      "label": "Internet (tous les sites)",
      "sentence": "Peut contacter n'importe quel site Internet.",
      "risk": "moyen"
    },
    {
      "id": "clipboard",
      "label": "Presse-papiers",
      "sentence": "Peut lire et écrire ce que tu as copié.",
      "risk": "moyen"
    },
    {
      "id": "data:<plugin>:read",
      "pattern": "^data:[a-z0-9]+(\\.[a-z0-9]+)+:read$",
      "label": "Lire les données de {plugin}",
      "sentence": "Peut lire les données que {plugin} partage.",
      "risk": "moyen",
      "scope": {
        "plugin": "l'identifiant de l'autre plugin, qui doit aussi le déclarer dans « exposes »"
      }
    },
    {
      "id": "data:<plugin>:write",
      "pattern": "^data:[a-z0-9]+(\\.[a-z0-9]+)+:write$",
      "label": "Modifier les données de {plugin}",
      "sentence": "Peut modifier les données que {plugin} partage.",
      "risk": "élevé",
      "scope": {
        "plugin": "l'identifiant de l'autre plugin, qui doit aussi le déclarer dans « exposes » avec « write »"
      }
    },
    {
      "id": "system:exec:<programme>",
      "pattern": "^system:exec:[A-Za-z0-9._-]+$",
      "label": "Lancer {programme}",
      "sentence": "Peut lancer le programme {programme} sur ton PC. Très sensible : accordé seulement aux plugins signés.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true,
      "scope": {
        "programme": "le nom exact du programme, pris dans une liste blanche"
      }
    },
    {
      "id": "documents",
      "label": "Tes documents",
      "sentence": "Peut ouvrir et enregistrer des fichiers sur ton PC : ceux que tu choisis dans une fenêtre, ou ceux qu'il a déjà ouverts.",
      "risk": "élevé"
    },
    {
      "id": "screen",
      "label": "Ton écran",
      "sentence": "Peut prendre une capture de ton écran.",
      "risk": "élevé"
    },
    {
      "id": "music",
      "label": "Ta bibliothèque NeoMusic",
      "sentence": "Peut lire et ajouter des morceaux dans ta bibliothèque de musique.",
      "risk": "moyen"
    },
    {
      "id": "agenda",
      "label": "Ton emploi du temps",
      "sentence": "Peut ajouter ses propres événements à l'emploi du temps de NeoDex.",
      "risk": "faible"
    },
    {
      "id": "taskbar",
      "label": "Barre des tâches",
      "sentence": "Peut afficher un compagnon animé sur la barre des tâches.",
      "risk": "faible"
    },
    {
      "id": "widget",
      "label": "Widget sur l'accueil",
      "sentence": "Peut afficher un petit aperçu en direct sur ton accueil (tu peux le couper ou le déplacer avec « Disposer »).",
      "risk": "faible"
    },
    {
      "id": "background",
      "label": "Tâches de fond",
      "sentence": "Peut tourner sans être ouvert, dès le démarrage de NeoDex.",
      "risk": "moyen"
    },
    {
      "id": "search",
      "label": "Recherche",
      "sentence": "Voit ce que tu tapes dans la recherche de l'accueil, pour te proposer ses résultats.",
      "risk": "moyen"
    },
    {
      "id": "shortcuts",
      "label": "Raccourcis globaux",
      "sentence": "Peut réagir à ses raccourcis clavier même quand NeoDex n'est pas au premier plan.",
      "risk": "moyen"
    },
    {
      "id": "system:info",
      "label": "Infos du PC",
      "sentence": "Peut voir le processeur, la mémoire et les programmes ouverts sur ton PC.",
      "risk": "moyen"
    },
    {
      "id": "system:processes",
      "label": "Arrêter des programmes",
      "sentence": "Peut forcer l'arrêt des programmes ouverts sur ton PC. Très sensible : accordé seulement aux plugins signés.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true
    },
    {
      "id": "system:startup",
      "label": "Démarrage de Windows",
      "sentence": "Peut choisir les programmes lancés au démarrage de Windows. Très sensible : accordé seulement aux plugins signés.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true
    },
    {
      "id": "system:terminal",
      "label": "Terminal",
      "sentence": "Peut lancer des commandes dans un terminal de ton PC. Très sensible : accordé seulement aux plugins signés.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true
    },
    {
      "id": "system:update",
      "label": "Mises à jour",
      "sentence": "Peut chercher et installer les mises à jour de NeoDex et de ses plugins. Très sensible : accordé seulement aux plugins signés.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true
    },
    {
      "id": "system:main",
      "label": "Volet système",
      "sentence": "A un volet qui tourne sur ton PC, hors du bac à sable (Node et Electron). Très sensible : accordé seulement aux plugins signés.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true
    },
    {
      "id": "full",
      "label": "Accès complet",
      "sentence": "Peut tout faire dans NeoDex, comme une appli intégrée : lire tes onglets, tes réglages et les données des autres plugins.",
      "risk": "élevé",
      "sensitive": true,
      "signedOnly": true
    }
  ],
  "execAllowed": [
    "explorer",
    "notepad",
    "winget",
    "warp-cli",
    "obs64",
    "Discord"
  ],
  "legacy": {
    "data:<plugin>": "data:<plugin>:read"
  },
  "risky": [
    {
      "all": [
        "network",
        "files"
      ],
      "why": "peut envoyer sur Internet les fichiers qu'il lit"
    },
    {
      "all": [
        "network",
        "clipboard"
      ],
      "why": "peut envoyer sur Internet ce que tu as copié"
    },
    {
      "all": [
        "network",
        "data:*:read"
      ],
      "why": "peut envoyer sur Internet les données d'un autre plugin"
    },
    {
      "all": [
        "network",
        "system:exec:*"
      ],
      "why": "peut télécharger puis lancer un programme"
    },
    {
      "all": [
        "network",
        "documents"
      ],
      "why": "peut envoyer sur Internet les fichiers de ton PC qu'il ouvre"
    },
    {
      "all": [
        "network",
        "screen"
      ],
      "why": "peut envoyer sur Internet des captures de ton écran"
    },
    {
      "all": [
        "network",
        "search"
      ],
      "why": "peut envoyer sur Internet ce que tu tapes dans la recherche"
    }
  ]
}
);
// Le registre des autorisations (permissions.json, copie de celui du SDK neodex-sdk) : la seule liste qui fait foi.
// Le moteur de plugins, NeoStore et l'appli Autorisations lisent tous ici ce qu'une autorisation veut dire et ce qu'elle risque.
const REG = require('./permissions.json');

const entries = REG.permissions.map(e => ({ ...e, rx: e.pattern ? new RegExp(e.pattern) : null }));
// les noms des paramètres d'une entrée (« data:<plugin>:read » -> ['plugin']) et leurs valeurs dans un nom d'autorisation
const params = (e, name) => {
  if (!e.rx) return {};
  const keys = [...e.id.matchAll(/<(\w+)>/g)].map(m => m[1]), parts = e.id.split(/<\w+>/);
  let rest = name, vals = [];
  for (let i = 0; i < parts.length; i++) {
    if (!rest.startsWith(parts[i])) return {};
    rest = rest.slice(parts[i].length);
    if (i < keys.length) { const end = parts[i + 1] ? rest.lastIndexOf(parts[i + 1]) : rest.length; vals.push(rest.slice(0, end)); rest = rest.slice(end); }
  }
  return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
};

// une ancienne autorisation (registre 1) devient son équivalent d'aujourd'hui : « data:<id> » -> « data:<id>:read »
function normalize(name) {
  name = String(name || '');
  if (/^data:[a-z0-9]+(\.[a-z0-9]+)+$/.test(name)) return { name: name + ':read', deprecated: true };
  return { name, deprecated: false };
}
function find(name) {
  name = normalize(name).name;
  const e = entries.find(x => x.rx ? x.rx.test(name) : x.id === name);
  return e ? { entry: e, params: params(e, name), name } : null;
}
// ce qu'on montre à l'utilisateur : libellé, phrase claire, risque ; nameOf traduit un identifiant de plugin en nom lisible
function describe(name, nameOf = x => x) {
  const f = find(name);
  if (!f) return { name, label: name, sentence: 'Autorisation inconnue.', risk: 'élevé', unknown: true };
  const fill = s => s.replace(/\{(\w+)\}/g, (_, k) => k === 'plugin' ? nameOf(f.params[k]) : f.params[k] ?? k);
  return { name: f.name, id: f.entry.id, label: fill(f.entry.label), sentence: fill(f.entry.sentence), risk: f.entry.risk, sensitive: !!f.entry.sensitive, signedOnly: !!f.entry.signedOnly };
}
// une autorisation déclarée par un plugin : connue du registre ; un programme lancé doit être dans la liste blanche
function check(name, { signed = true } = {}) {
  const f = find(name);
  if (!f) return 'permission inconnue : ' + name;
  if (f.entry.signedOnly && !signed) return 'réservée aux plugins signés : ' + name;
  if (f.entry.id === 'system:exec:<programme>' && !REG.execAllowed.includes(f.params.programme)) return 'programme hors liste blanche : ' + f.params.programme;
  return '';
}
// le site est-il couvert ? « network » = tous ; « network:exemple.org » = ce domaine ; « network:*.exemple.org » = lui et ses sous-domaines
function netPermFor(perms, host) {
  host = String(host || '').toLowerCase().replace(/\.$/, '');
  for (const p of perms) {
    const m = /^network:(\*\.)?(.+)$/.exec(p); if (!m) continue;
    if (host === m[2] || (m[1] && host.endsWith('.' + m[2]))) return p;
  }
  return perms.includes('network') ? 'network' : null;
}
// les combinaisons à surveiller (réseau + fichiers…), d'après le registre
function risky(perms) {
  const has = pat => perms.some(p => pat === 'network' ? p === 'network' || p.startsWith('network:') : pat.includes('*') ? new RegExp('^' + pat.replace(/[.]/g, '\\.').replace(/\*/g, '.+') + '$').test(p) : p === pat);
  return REG.risky.filter(r => r.all.every(has)).map(r => r.why);
}
module.exports = { REG, registry: REG.registry, normalize, find, describe, check, netPermFor, risky, list: () => REG.permissions };

return module.exports; })();