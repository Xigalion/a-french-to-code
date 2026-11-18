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
/** `main` existe-t-elle localement ?
 *
 * Un clone fait avec `--branch <autre>` ne l'a PAS, et les cinq contrôles qui
 * l'interrogent échouaient alors tous les cinq — pour une raison étrangère à
 * ce qu'ils vérifient. Un contrôle qui échoue pour une mauvaise raison est
 * trompeur : il fait croire à un dépôt sale là où il manque seulement une
 * branche. Ils sont désormais **non applicables**, et le verdict final dit
 * que l'audit est incomplet. Trouvé en vérifiant le paquet 0.6.0 depuis un
 * clone propre. */
let mainPresente = false;
try {
  execFileSync('git', ['rev-parse', '--verify', 'main'], { stdio: 'ignore' });
  mainPresente = true;
} catch { /* absente : les controles concernes le diront */ }
let nonApplicables = 0;
/** Les branches de travail declarees, imprimees apres les controles : ce
 * n'est pas un echec, c'est une information que le publieur doit voir. */
let branchesDeTravail = [];
/** `exigeMain` : le contrôle interroge la branche `main`. Sans elle, il est
 * annoncé NON APPLICABLE au lieu d'échouer. */
function controle(nom, fn, exigeMain = false) {
  if (exigeMain && !mainPresente) {
    nonApplicables++;
    resultats.push({ nom, ok: true, applicable: false,
      detail: 'non applicable : la branche « main » est absente de ce clone' });
    return;
  }
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
}, true);
// Une branche de travail est légitime ; une branche inconnue ne l'est pas.
// `push.default` n'envoie que la branche courante, mais le contrôle doit
// rester celui d'un envoi SANS SURPRISE : toute branche autre que `main`
// porte un nom déclaré, et le publieur sait pourquoi elle existe.
controle('aucune branche inattendue à côté de main', () => {
  const DECLAREES = /^(phase|lot|experience)-[a-z0-9-]+$/u;
  const branches = git('branch', '--format=%(refname:short)').split('\n').filter(Boolean);
  if (!branches.includes('main')) return 'branche main absente';
  const inattendues = branches.filter(nom => nom !== 'main' && !DECLAREES.test(nom));
  if (inattendues.length > 0) return 'branches inattendues : ' + inattendues.join(', ');
  branchesDeTravail = branches.filter(nom => nom !== 'main');
  return true;
}, true);
controle('aucune adresse personnelle dans l’auteur des commits de main', () => {
  const adresses = new Set(git('log', 'main', '--format=%ae%n%ce').split('\n').filter(Boolean));
  const suspectes = [...adresses].filter(adresse => !adresse.endsWith('users.noreply.github.com')
    && !adresse.endsWith('noreply@anthropic.com'));
  return suspectes.length === 0 ? true : suspectes.join(', ');
}, true);

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
// Les étiquettes de sauvegarde désignent l'historique d'AVANT le nettoyage,
// celui qui contient encore les chemins personnels. `git push --tags` les
// pousserait et publierait exactement ce que le nettoyage a retiré : le
// contrôle vérifie qu'elles sont identifiables et que la procédure ne dit
// nulle part de pousser toutes les étiquettes.
controle('les étiquettes hors de main sont des sauvegardes nommées', () => {
  const etiquettes = git('for-each-ref', '--format=%(refname:short) %(objectname)', 'refs/tags')
    .split('\n').filter(Boolean).map(ligne => ligne.split(' '));
  const horsMain = etiquettes.filter(([, objet]) => {
    const essai = spawnSync('git', ['merge-base', '--is-ancestor', objet, 'main']);
    return essai.status !== 0;
  }).map(([nom]) => nom);
  const inattendues = horsMain.filter(nom => !nom.startsWith('avant-'));
  return inattendues.length === 0 ? true : 'hors de main et non nommées « avant-… » : ' + inattendues.join(', ');
}, true);
controle('la procédure n’envoie pas toutes les étiquettes d’un coup', () => {
  const procedure = readFileSync('docs/PUBLICATION.md', 'utf8');
  const dangereuse = /git push [^\n]*--tags(?![^\n]*jamais)/u.test(procedure)
    && !/\*\*jamais\*\* `--tags`/u.test(procedure);
  return dangereuse ? 'docs/PUBLICATION.md contient « git push --tags »' : true;
});

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

// Ce contrôle existe parce que j'ai fait trois fois la même erreur : un `.pyc`
// retiré de TOUT l'historique avant la 0.5.0 parce qu'il portait le chemin
// absolu de la machine, puis cinq `.class` de l'exercice de clôture, puis un
// sixième oublié parce que le `.gitignore` est arrivé APRÈS son suivi. Un
// `.gitignore` ne retire pas ce qui est déjà suivi, et un artefact de
// compilation n'est jamais inerte : le premier portait un nom d'utilisateur.
controle('aucun artefact de compilation suivi', () => {
  const ARTEFACTS = /\.(class|pyc|pyo|o|obj|exe|dll|so|dylib|a|lib)$|(^|\/)__pycache__\//u;
  const mauvais = suivis.filter(chemin => ARTEFACTS.test(chemin));
  return mauvais.length === 0 ? true
    : mauvais.length + ' fichier(s) : ' + mauvais.slice(0, 5).join(', ');
});

// Les instructions de travail internes restent locales : ni suivies, ni
// présentes dans l'historique publié. Leur substance est publiée par
// docs/ETAT_DU_PROJET.md, et c'est la décision du 17 novembre 2026.
controle('instructions de travail internes hors du dépôt publié', () => {
  if (suivis.includes('CLAUDE.md')) return 'CLAUDE.md est encore suivi par git';
  const dansHistorique = git('log', 'main', '--oneline', '--', 'CLAUDE.md').trim();
  if (dansHistorique !== '') {
    return dansHistorique.split('\n').length + ' commit(s) de main contiennent encore CLAUDE.md';
  }
  const ignore = spawnSync('git', ['check-ignore', '-q', 'CLAUDE.md']).status === 0;
  return ignore ? true : 'CLAUDE.md n’est pas couvert par .gitignore : il reviendrait au premier « git add -A »';
}, true);

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
// GitHub ignore EN SILENCE un modèle de ticket mal formé : le formulaire
// n'apparaît pas, et rien ne le signale. Un modèle de ce dépôt l'a été —
// une valeur non citée contenant « : » que YAML lisait comme une sous-clé.
// Ce n'est pas un analyseur YAML (le projet n'a aucune dépendance) : c'est
// un contrôle des trois fautes qui cassent réellement ces fichiers.
controle('modèles de tickets structurellement sains', () => {
  const TYPES = ['markdown', 'textarea', 'input', 'dropdown', 'checkboxes'];
  const fautes = [];
  for (const [chemin, brut] of fichiersTexte) {
    if (!chemin.startsWith('.github/ISSUE_TEMPLATE') || !chemin.endsWith('.yml')) continue;
    const lignes = brut.toString('utf8').split('\n');
    const formulaire = !chemin.endsWith('config.yml');
    lignes.forEach((ligne, index) => {
      const valeur = /^\s*(label|description|about|name|title|placeholder|value):\s+(.*)$/u.exec(ligne);
      if (valeur && !/^["'|>]/u.test(valeur[2]) && /:\s/u.test(valeur[2])) {
        fautes.push(chemin + ':' + (index + 1) + ' valeur non citée contenant « : »');
      }
      const type = /^\s*-?\s*type:\s*(\S+)\s*$/u.exec(ligne);
      if (formulaire && type && !TYPES.includes(type[1].replace(/["']/gu, ''))) {
        fautes.push(chemin + ':' + (index + 1) + ' type inconnu « ' + type[1] + ' »');
      }
    });
    const texte = lignes.join('\n');
    if (formulaire) {
      for (const cle of ['name:', 'description:', 'body:']) {
        if (!texte.includes('\n' + cle) && !texte.startsWith(cle)) fautes.push(chemin + ' : clé ' + cle + ' absente');
      }
      const champs = (texte.match(/^ *- type:/gmu) ?? []).length;
      const identifiants = (texte.match(/^ *id:/gmu) ?? []).length;
      const marqueurs = (texte.match(/^ *- type: markdown$/gmu) ?? []).length;
      if (identifiants < champs - marqueurs) {
        fautes.push(chemin + ' : ' + (champs - marqueurs - identifiants) + ' champ(s) sans « id »');
      }
    }
  }
  return fautes.length === 0 ? true : fautes.join(' | ');
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
for (const { nom, ok, applicable, detail } of resultats) {
  const marque = applicable === false ? '  —    ' : ok ? '  OK   ' : '  ÉCHEC';
  console.log(marque + '  ' + nom.padEnd(largeur) + (detail ? '  → ' + detail : ''));
}
const echecs = resultats.filter(r => !r.ok).length;
console.log('');
if (branchesDeTravail.length > 0) {
  console.log('Branche(s) de travail presente(s), non publiee(s) : ' + branchesDeTravail.join(', '));
}
const appliques = resultats.length - nonApplicables;
if (nonApplicables > 0) {
  // Dire que l'audit est INCOMPLET, et pourquoi. Annoncer « publiable » sur un
  // audit partiel serait exactement le genre d'affirmation que ce script
  // existe pour empecher.
  console.log(nonApplicables + ' contrôle(s) NON APPLICABLE(S) : la branche « main » est absente de');
  console.log('ce clone. L’audit est donc INCOMPLET — relancez-le dans un dépôt qui l’a.');
}
console.log(echecs === 0
  ? (nonApplicables === 0
    ? 'Dépôt publiable selon ces ' + resultats.length + ' contrôles.'
    : 'Aucun échec sur les ' + appliques + ' contrôles applicables, mais l’audit est incomplet.')
  : echecs + ' contrôle(s) en échec sur ' + appliques + ' applicables.');
console.log('Ce que ces contrôles ne prouvent pas : qu’aucun secret n’a jamais existé');
console.log('dans l’historique, ni que la documentation dit vrai. Ils vérifient des');
console.log('motifs connus et des liens, pas le sens.');
process.exit(echecs === 0 ? 0 : 1);
