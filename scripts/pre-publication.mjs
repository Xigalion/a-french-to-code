// Contrôle d'avant publication. Un seul point d'entrée, et il échoue.
//
//   node scripts/pre-publication.mjs            (tout, tests compris)
//   node scripts/pre-publication.mjs --rapide   (sans la suite de tests)
//
// « Prêt à publier » doit être vérifiable, pas affirmé. Chaque contrôle
// ci-dessous a une raison née d'un vrai défaut trouvé dans ce dépôt :
// un nom d'utilisateur dans des journaux, deux octets nuls qui rendaient un
// fichier binaire pour git, un lien mort, une citation d'identifiant devenue
// fausse après une réécriture d'historique.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(racine);
const rapide = process.argv.includes('--rapide');

const resultats = [];
function controle(nom, fn) {
  let detail;
  let ok = false;
  try { detail = fn(); ok = detail === true || (typeof detail === 'string' && detail.length === 0); }
  catch (erreur) { detail = erreur instanceof Error ? erreur.message : String(erreur); }
  resultats.push({ nom, ok, detail: detail === true ? '' : String(detail ?? '') });
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const suivis = git('ls-files', '-z').split('\0').filter(Boolean);

function texteSuivi() {
  const sortie = [];
  for (const chemin of suivis) {
    if (!/\.(md|ts|mjs|cjs|json|c|h|txt|yml|cmd|gitignore|gitattributes)$/u.test(chemin)
      && !chemin.startsWith('.git')) continue;
    let contenu;
    try { contenu = readFileSync(chemin); } catch { continue; }
    sortie.push([chemin, contenu]);
  }
  return sortie;
}
const fichiersTexte = texteSuivi();

// 1. Données personnelles dans les fichiers suivis.
controle('aucun chemin personnel dans les fichiers suivis', () => {
  const utilisateur = basename(homedir());
  const motif = new RegExp('(?:[A-Za-z]:[\\\\/]Users[\\\\/]|/home/)' + utilisateur, 'iu');
  const touches = fichiersTexte.filter(([, contenu]) => motif.test(contenu.toString('utf8')));
  return touches.length === 0 ? true : touches.map(([c]) => c).join(', ');
});

// 2. Données personnelles dans l'HISTORIQUE destiné à être publié : c'est là
//    qu'un nettoyage de l'arbre courant ne suffit pas.
// L'historique PUBLIÉ est celui de `main` et des étiquettes : une sauvegarde
// locale (`refs/original/…`) n'est jamais poussée par un envoi explicite, et
// le contrôle des branches ci-dessous vérifie qu'aucune autre ne traîne.
controle('aucun nom d’utilisateur dans l’historique de main', () => {
  const utilisateur = basename(homedir());
  const trouve = git('log', 'main', '-S', utilisateur, '--oneline').trim();
  return trouve === '' ? true : trouve.split('\n').length + ' commit(s) : ' + trouve.split('\n')[0];
});
controle('une seule branche, donc un envoi explicite sans surprise', () => {
  const branches = git('branch', '--format=%(refname:short)').split('\n').filter(Boolean);
  return branches.length === 1 && branches[0] === 'main' ? true : 'branches : ' + branches.join(', ');
});
controle('aucune adresse personnelle dans l’auteur des commits de main', () => {
  const adresses = new Set(git('log', 'main', '--format=%ae%n%ce').split('\n').filter(Boolean));
  const suspectes = [...adresses].filter(adresse => !adresse.endsWith('users.noreply.github.com')
    && !adresse.endsWith('noreply@anthropic.com'));
  return suspectes.length === 0 ? true : suspectes.join(', ');
});

// 3. Aucun identifiant de commit cité : ils ne survivent pas à une réécriture.
controle('aucune citation de hachage dans les documents', () => {
  const touches = fichiersTexte.filter(([chemin, contenu]) => chemin.endsWith('.md')
    && /`[0-9a-f]{7}`/u.test(contenu.toString('utf8')));
  return touches.length === 0 ? true : touches.map(([c]) => c).join(', ');
});

// 4. Chaque étiquette citée par un document existe vraiment.
controle('chaque étiquette citée existe', () => {
  const etiquettes = new Set(git('tag', '-l').split('\n').filter(Boolean));
  const citees = new Set();
  for (const [chemin, contenu] of fichiersTexte) {
    if (!chemin.endsWith('.md')) continue;
    for (const trouve of contenu.toString('utf8').matchAll(/`((?:lot|lots|campagne|ref|v)[-0-9a-z.]*)`/gu)) {
      const nom = trouve[1];
      if (/^(lot|lots|campagne)-[0-9]/u.test(nom) || nom.startsWith('ref-') || /^v\d+\.\d+\.\d+$/u.test(nom)) {
        citees.add(nom);
      }
    }
  }
  const manquantes = [...citees].filter(nom => !etiquettes.has(nom));
  return manquantes.length === 0 ? true : 'étiquettes citées absentes : ' + manquantes.join(', ');
});

// 5. Hygiène des fichiers suivis.
controle('aucun fichier binaire ni volumineux suivi', () => {
  const mauvais = [];
  for (const chemin of suivis) {
    if (/\.(exe|o|obj|vsix|zip|dll)$/u.test(chemin)) mauvais.push(chemin + ' (binaire)');
    else if (statSync(chemin).size > 1024 * 1024) mauvais.push(chemin + ' (> 1 Mo)');
  }
  return mauvais.length === 0 ? true : mauvais.join(', ');
});
controle('aucun octet nul dans un fichier texte suivi', () => {
  const mauvais = fichiersTexte.filter(([, contenu]) => contenu.includes(0));
  return mauvais.length === 0 ? true : mauvais.map(([c]) => c).join(', ');
});
controle('aucun dossier de travail de compilation suivi', () => {
  const mauvais = suivis.filter(chemin => /(^|\/)(build|dist|node_modules|\.cache)\//u.test(chemin));
  return mauvais.length === 0 ? true : mauvais.slice(0, 5).join(', ');
});

// 6. Documentation publique et licence.
controle('documents publics présents', () => {
  const requis = ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'LICENSE', 'NOTICE',
    'docs/ETAT_DU_PROJET.md', 'docs/LIMITES_CONNUES.md', 'docs/CATALOGUE.md',
    'docs/REPERES_GIT.md', 'docs/PUBLICATION.md', '.github/ISSUE_TEMPLATE/config.yml'];
  const absents = requis.filter(chemin => !suivis.includes(chemin));
  return absents.length === 0 ? true : 'absents : ' + absents.join(', ');
});
controle('licence Apache-2.0 complète et cohérente', () => {
  const licence = readFileSync('LICENSE', 'utf8');
  const marqueurs = ['Apache License', 'Version 2.0, January 2004',
    'APPENDIX: How to apply the Apache License', 'Copyright [yyyy] [name of copyright owner]'];
  const manquants = marqueurs.filter(marqueur => !licence.includes(marqueur));
  if (manquants.length) return 'LICENSE incomplet : ' + manquants.join(' | ');
  const annonces = ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md']
    .filter(chemin => !readFileSync(chemin, 'utf8').includes('Apache'));
  return annonces.length === 0 ? true : 'licence non annoncée dans : ' + annonces.join(', ');
});
controle('aucun gabarit OWNER/REPO laissé dans les modèles de tickets', () => {
  const touches = fichiersTexte.filter(([chemin, contenu]) => chemin.startsWith('.github')
    && contenu.toString('utf8').includes('OWNER/REPO'));
  return touches.length === 0 ? true : touches.map(([c]) => c).join(', ');
});
controle('version de l’extension et du journal des versions accordées', () => {
  const manifeste = JSON.parse(readFileSync(join('extension', 'package.json'), 'utf8'));
  const journal = readFileSync('CHANGELOG.md', 'utf8');
  const premiere = /^## (\d+\.\d+\.\d+)/mu.exec(journal)?.[1];
  return premiere === manifeste.version ? true
    : 'extension ' + manifeste.version + ' vs CHANGELOG ' + premiere;
});

// 7. Liens internes.
controle('liens internes et chemins cités', () => {
  const sortie = spawnSync(process.execPath, ['scripts/liens.mjs'], { encoding: 'utf8' });
  return sortie.status === 0 ? true : (sortie.stdout ?? '').trim().split('\n').slice(-3).join(' | ');
});

// 8. Les tests, sauf en mode rapide.
if (!rapide) {
  controle('npm run check (typecheck + tests Node)', () => {
    const sortie = spawnSync('npm', ['run', 'check'], { encoding: 'utf8', shell: true });
    if (sortie.status === 0) return true;
    const lignes = ((sortie.stdout ?? '') + (sortie.stderr ?? '')).trim().split('\n');
    return lignes.slice(-5).join(' | ');
  });
}

const largeur = Math.max(...resultats.map(r => r.nom.length));
for (const { nom, ok, detail } of resultats) {
  console.log((ok ? '  OK   ' : '  ÉCHEC') + '  ' + nom.padEnd(largeur) + (detail ? '  → ' + detail : ''));
}
const echecs = resultats.filter(r => !r.ok).length;
console.log('');
console.log(echecs === 0
  ? 'Dépôt publiable selon ces ' + resultats.length + ' contrôles.'
  : echecs + ' contrôle(s) en échec sur ' + resultats.length + '.');
console.log('Ce que ces contrôles ne prouvent pas : qu’aucun secret n’a jamais existé');
console.log('dans l’historique, ni que la documentation dit vrai. Ils vérifient des');
console.log('motifs connus et des liens, pas le sens.');
process.exit(echecs === 0 ? 0 : 1);
