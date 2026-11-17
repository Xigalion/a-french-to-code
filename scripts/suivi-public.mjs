// Suivi des tickets et des contributions publiques, sans quitter le terminal.
//
//   node scripts/suivi-public.mjs            (tickets et PR ouverts)
//   node scripts/suivi-public.mjs --tout     (ajoute les fermés et l'activité)
//
// Lecture seule, API publique, **sans jeton** : 60 requêtes par heure
// suffisent largement. Si `GITHUB_TOKEN` existe dans l'environnement, il est
// utilisé pour monter la limite — il n'est jamais affiché ni enregistré.
//
// Ce script ne répond à rien et ne ferme rien : il montre ce qui attend une
// réponse, et rappelle le classement à appliquer. La méthode est dans
// docs/SUIVI_PUBLIC.md.

import { readFileSync } from 'node:fs';

const DEPOT = process.env.CA_DEPOT ?? 'Xigalion/c-a-french-to-c';
const API = 'https://api.github.com/repos/' + DEPOT;
const tout = process.argv.includes('--tout');

/** Les étiquettes que les modèles de tickets demandent. GitHub applique une
 * étiquette seulement si elle existe déjà : sans elles, le classement
 * automatique des formulaires est perdu en silence. */
const ATTENDUES = new Map([
  ['refus', 'un refus que le message n’a pas suffi à expliquer'],
  ['pédagogie', 'un message à revoir, pas un défaut du moteur'],
  ['moteur', 'un C produit faux, mal formé ou mal placé'],
  ['périmètre', 'une formulation absente du catalogue'],
]);

const entetes = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'curl' };
if (process.env.GITHUB_TOKEN) entetes.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;

async function api(chemin) {
  const reponse = await fetch(API + chemin, { headers: entetes });
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error(chemin + ' → HTTP ' + reponse.status + ' ' + reponse.statusText);
  return reponse.json();
}

const jours = (iso) => Math.floor((Date.now() - Date.parse(iso)) / 86400000);
const ligne = (n = 72) => console.log('─'.repeat(n));

const depot = await api('');
if (depot === null) {
  console.error('Dépôt introuvable ou privé : ' + DEPOT);
  process.exit(1);
}

console.log('C-A — suivi public de ' + depot.full_name + '  (' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ')');
ligne();
console.log('visibilité ' + depot.visibility + ' | licence ' + (depot.license?.spdx_id ?? '—')
  + ' | étoiles ' + depot.stargazers_count + ' | forks ' + depot.forks_count
  + ' | observateurs ' + depot.subscribers_count);
console.log('tickets ouverts (PR comprises) : ' + depot.open_issues_count
  + ' | dernier envoi : il y a ' + jours(depot.pushed_at) + ' j');

// 1. Étiquettes manquantes — la cause la plus discrète de classement perdu.
const etiquettes = new Set((await api('/labels?per_page=100') ?? []).map(e => e.name));
const manquantes = [...ATTENDUES.keys()].filter(nom => !etiquettes.has(nom));
ligne();
if (manquantes.length === 0) {
  console.log('étiquettes de classement : les ' + ATTENDUES.size + ' sont en place');
} else {
  console.log('ATTENTION — ' + manquantes.length + ' étiquette(s) demandée(s) par les modèles de');
  console.log('tickets n’existent pas, donc elles ne seront PAS appliquées :');
  for (const nom of manquantes) console.log('  - ' + nom + ' : ' + ATTENDUES.get(nom));
  console.log('Les créer : docs/SUIVI_PUBLIC.md §2.');
}

// 2. Ce qui attend une réponse.
const ouverts = await api('/issues?state=open&per_page=100') ?? [];
const tickets = ouverts.filter(i => !i.pull_request);
const pr = ouverts.filter(i => i.pull_request);

ligne();
console.log('TICKETS OUVERTS : ' + tickets.length);
for (const t of tickets) {
  const labels = t.labels.map(l => (typeof l === 'string' ? l : l.name)).join(', ') || 'sans étiquette';
  console.log('  #' + t.number + '  ' + t.title);
  console.log('        ' + labels + ' | ouvert il y a ' + jours(t.created_at) + ' j par '
    + t.user.login + ' | ' + t.comments + ' commentaire(s)');
  if (t.comments === 0) console.log('        → aucune réponse encore');
}
if (tickets.length === 0) console.log('  (aucun)');

ligne();
console.log('CONTRIBUTIONS OUVERTES : ' + pr.length);
for (const p of pr) {
  console.log('  #' + p.number + '  ' + p.title);
  console.log('        par ' + p.user.login + ' | ouverte il y a ' + jours(p.created_at)
    + ' j | ' + p.comments + ' commentaire(s)');
  console.log('        → avant tout avis : la lacune est-elle démontrée, le contrat écrit,');
  console.log('          le différentiel joint ? (CONTRIBUTING.md §3)');
}
if (pr.length === 0) console.log('  (aucune)');

// 3. Avec --tout : ce qui est déjà traité, et l'activité récente.
if (tout) {
  const fermes = await api('/issues?state=closed&per_page=30') ?? [];
  ligne();
  console.log('DERNIERS TICKETS FERMÉS : ' + fermes.length);
  for (const t of fermes.slice(0, 10)) {
    console.log('  #' + t.number + '  ' + t.title + '  (fermé il y a ' + jours(t.closed_at) + ' j)');
  }
  if (fermes.length === 0) console.log('  (aucun)');

  const forks = await api('/forks?per_page=20') ?? [];
  ligne();
  console.log('FORKS : ' + forks.length);
  for (const f of forks) {
    console.log('  ' + f.full_name + ' | poussé il y a ' + jours(f.pushed_at) + ' j');
  }
  if (forks.length === 0) console.log('  (aucun)');
}

// 4. Le classement à appliquer, rappelé là où on en a besoin.
ligne();
console.log('CLASSER, puis répondre — quatre catégories, une seule par ticket :');
console.log('  1 défaut du moteur      → test de reproduction d’abord, puis un lot nommé');
console.log('  2 défaut de l’hôte      → reproduire dans test/vscode, chercher la cause');
console.log('  3 erreur de formulation → montrer la phrase du catalogue ; compter les récidives');
console.log('  4 limitation volontaire → aucune correction ; vérifier qu’elle est documentée');
console.log('  (incompréhension pédagogique → proposer un message, ne pas le livrer seul)');
console.log('Trois occurrences de la même phrase inventée = la formulation n’est pas');
console.log('trouvable : ce n’est plus une erreur de l’utilisateur. docs/SUIVI_PUBLIC.md §3.');

// 5. Le reste à faire côté dépôt, s'il en reste.
const aFaire = [];
if ((depot.topics ?? []).length === 0) aFaire.push('aucun sujet GitHub : le dépôt est introuvable par recherche');
if (depot.has_projects) aFaire.push('onglet Projects actif mais non suivi : à désactiver');
if (!depot.description) aFaire.push('description absente');
try {
  const version = JSON.parse(readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8')).version;
  const derniere = await api('/releases/latest');
  if (derniere === null) aFaire.push('aucune release publiée : le .vsix n’est pas téléchargeable');
  else if (derniere.tag_name !== 'v' + version) {
    aFaire.push('release ' + derniere.tag_name + ' ≠ version locale ' + version);
  }
} catch { /* dépôt incomplet : rien à conclure */ }
if (aFaire.length > 0) {
  ligne();
  console.log('À FAIRE côté dépôt GitHub :');
  for (const item of aFaire) console.log('  - ' + item);
}
