// L'exercice de clôture de SQL-A : une bibliothèque de prêt.
//
//   node exercice/sql/cloture.mjs
//
// L'énoncé — douze scénarios et trois épreuves négatives — a été fixé AVANT
// l'implémentation, dans `docs/phase4/DECISIONS_SQL.md` §P5. C'est la règle
// apprise en phase 3 : un énoncé écrit après coup mesure ce qui a été fait,
// pas ce qui était voulu, et cinq des quinze défauts de Java n'étaient
// visibles pour aucun test unitaire.
//
// Chaque phrase passe par `analyserCatalogueSql` puis `rendreSqlNatif`, et le
// placement par `planifierSql` : le fichier est construit comme l'IHM le
// construirait, par INSERTIONS PURES sur des lignes blanches. **Aucune
// retouche manuelle n'est permise** : le script échoue si une phrase est
// refusée ou si une édition touche un caractère existant.
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { SQL } from '../../src/langages/sql/langage.ts';
import { planifierSql } from '../../src/langages/sql/placement.ts';
import * as postgres from '../../scripts/postgres.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');
const dossier = join(ici, 'ca');
const journal = join(ici, 'journal');

/** Un fichier de l'exercice : des phrases, dans l'ordre où un humain les
 * dicterait. `curseur` dit où poser le curseur : `fin` = après tout ce qui
 * est écrit, `bloc` = dans le bloc que la phrase précédente a ouvert. */
const FICHIERS = [
  {
    nom: '01-schema.sql',
    titre: 'Domaines 1 et 9 — les trois tables, et leur intégrité',
    phrases: [
      'Crée une table nommée livres avec une colonne entière nommée id.',
      'Ajoute à la table livres une colonne de texte nommée titre de longueur 80.',
      'Ajoute à la table livres une colonne de texte nommée auteur de longueur 60.',
      'Exige que id de la table livres ne soit jamais nulle.',
      'Fais de id la clé primaire de la table livres, sous la contrainte nommée pk_livres.',
      'Fais de id de la table livres une identité engendrée par défaut.',
      'Crée une table nommée lecteurs avec une colonne entière nommée id.',
      'Ajoute à la table lecteurs une colonne de texte nommée nom de longueur 60.',
      'Ajoute à la table lecteurs une colonne entière nommée age.',
      'Exige que id de la table lecteurs ne soit jamais nulle.',
      'Fais de id la clé primaire de la table lecteurs, sous la contrainte nommée pk_lecteurs.',
      'Exige que nom de la table lecteurs soit unique, sous la contrainte nommée uq_lecteurs_nom.',
      'Exige de la table lecteurs que "age >= 0", sous la contrainte nommée ck_lecteurs_age.',
      'Donne à age de la table lecteurs la valeur par défaut 0.',
      'Crée une table nommée emprunts avec une colonne entière nommée id.',
      'Ajoute à la table emprunts une colonne entière nommée livre.',
      'Ajoute à la table emprunts une colonne entière nommée lecteur.',
      'Ajoute à la table emprunts une colonne de date nommée pris.',
      'Ajoute à la table emprunts une colonne de date nommée rendu.',
      'Exige que id de la table emprunts ne soit jamais nulle.',
      'Fais de id la clé primaire de la table emprunts, sous la contrainte nommée pk_emprunts.',
      'Fais de livre une clé étrangère de la table emprunts vers id de la table livres, sous la contrainte nommée fk_emprunts_livre.',
      'Fais de lecteur une clé étrangère de la table emprunts vers id de la table lecteurs, sous la contrainte nommée fk_emprunts_lecteur.',
      'Crée un index nommé ix_emprunts_lecteur sur lecteur de la table emprunts.',
    ],
  },
  {
    nom: '02-donnees.sql',
    titre: 'Domaine 8 — les données de départ, apostrophes comprises',
    phrases: [
      'Insère dans la table livres une ligne dont id vaut 1 et titre vaut le texte "L’Étranger".',
      'Insère dans la table livres une ligne dont id vaut 2 et titre vaut le texte "La Peste".',
      'Insère dans la table livres une ligne dont id vaut 3 et titre vaut le texte "Le Rouge et le Noir".',
      'Insère dans la table livres une ligne dont id vaut 4 et titre vaut le texte "Nadja".',
      'Insère dans la table livres une ligne dont id vaut 5 et titre vaut le texte "Aurélia".',
      'Insère dans la table livres une ligne dont id vaut 6 et titre vaut le texte "Les Chants de Maldoror".',
      'Insère dans la table lecteurs une ligne dont id vaut 1 et nom vaut le texte "O\'Brien".',
      'Insère dans la table lecteurs une ligne dont id vaut 2 et nom vaut le texte "Zoe".',
      'Insère dans la table lecteurs une ligne dont id vaut 3 et nom vaut le texte "Ali".',
      'Insère dans la table lecteurs une ligne dont id vaut 4 et nom vaut le texte "Lou".',
      'Modifie la table lecteurs en donnant à age la valeur 34 là où "id = 1".',
      'Modifie la table lecteurs en donnant à age la valeur 20 là où "id = 2".',
      'Modifie la table lecteurs en donnant à age la valeur 51 là où "id = 3".',
      'Modifie la table lecteurs en donnant à age la valeur 17 là où "id = 4".',
      'Insère dans la table emprunts une ligne dont id vaut 1 et lecteur vaut 1.',
      'Insère dans la table emprunts une ligne dont id vaut 2 et lecteur vaut 1.',
      'Insère dans la table emprunts une ligne dont id vaut 3 et lecteur vaut 1.',
      'Insère dans la table emprunts une ligne dont id vaut 4 et lecteur vaut 2.',
      'Insère dans la table emprunts une ligne dont id vaut 5 et lecteur vaut 2.',
      'Insère dans la table emprunts une ligne dont id vaut 6 et lecteur vaut 3.',
      'Insère dans la table emprunts une ligne dont id vaut 7 et lecteur vaut 3.',
      'Modifie la table emprunts en donnant à livre la valeur 1 là où "id = 1".',
      'Modifie la table emprunts en donnant à livre la valeur 2 là où "id = 2".',
      'Modifie la table emprunts en donnant à livre la valeur 3 là où "id = 3".',
      'Modifie la table emprunts en donnant à livre la valeur 4 là où "id = 4".',
      'Modifie la table emprunts en donnant à livre la valeur 5 là où "id = 5".',
      'Modifie la table emprunts en donnant à livre la valeur 6 là où "id = 6".',
      'Modifie la table emprunts en donnant à livre la valeur 1 là où "id = 7".',
      // Cinq retours sur sept : c'est ce qui fait DIFFERER COUNT(*) de
      // COUNT(rendu), et le scenario 6 n'a de sens que si les deux diffèrent.
      'Modifie la table emprunts en donnant à rendu le texte "2026-01-05" là où "id = 1".',
      'Modifie la table emprunts en donnant à rendu le texte "2026-01-06" là où "id = 2".',
      'Modifie la table emprunts en donnant à rendu le texte "2026-01-07" là où "id = 4".',
      'Modifie la table emprunts en donnant à rendu le texte "2026-01-08" là où "id = 5".',
      'Modifie la table emprunts en donnant à rendu le texte "2026-01-09" là où "id = 6".',
    ],
  },
  {
    nom: '03-lectures.sql',
    titre: 'Domaines 2, 3 et 4 — projection, filtrage composé, tri et limitation',
    phrases: [
      // Scénario 3 : projection simple, alias, DISTINCT.
      'Crée une requête qui lit la colonne titre de la table livres.',
      'Crée une requête qui lit la colonne nom de la table lecteurs sous le nom lecteur.',
      'Crée une requête qui lit les valeurs distinctes de la colonne lecteur de la table emprunts.',
      // Scénario 4 : L'ÉPREUVE DE LA DÉCISION S2 — quatre insertions pures.
      { phrase: 'Crée une requête qui lit les colonnes nom et age de la table lecteurs.', bloc: true },
      { phrase: 'Ne garde que les lignes où "age > 18".', dansLeBloc: true },
      { phrase: 'Exige aussi que "age < 60".', dansLeBloc: true },
      { phrase: 'Ordonne les lignes par age en ordre décroissant.', dansLeBloc: true },
      { phrase: 'Ne garde que les 2 premières lignes.', dansLeBloc: true },
      // Scénario 9 : l'ordre des nuls, sans puis avec.
      { phrase: 'Crée une requête qui lit les colonnes id et rendu de la table emprunts.', bloc: true },
      { phrase: 'Ordonne les lignes par rendu en ordre croissant.', dansLeBloc: true },
      { phrase: 'Place les valeurs nulles en dernier.', dansLeBloc: true },
    ],
  },
  {
    nom: '04-agregats.sql',
    titre: 'Domaines 5 et 6 — agrégats, regroupement, jointures',
    phrases: [
      // Scénario 6 : COUNT(*) contre COUNT(colonne) — les deux chiffres diffèrent.
      'Crée une requête qui compte les lignes de la table emprunts.',
      'Crée une requête qui compte les valeurs non nulles de la colonne rendu de la table emprunts.',
      // Scénario 5 : décompte par lecteur, GROUP BY puis HAVING.
      { phrase: 'Crée une requête qui lit la colonne lecteur et le nombre de lignes de la table emprunts.', bloc: true },
      { phrase: 'Regroupe les lignes par lecteur.', dansLeBloc: true },
      { phrase: 'Ne garde que les groupes de plus de 2 lignes.', dansLeBloc: true },
      { phrase: 'Ordonne les lignes par lecteur en ordre croissant.', dansLeBloc: true },
      // Scénario 7 : jointure interne puis gauche — le lecteur sans emprunt.
      { phrase: 'Crée une requête qui lit la colonne lecteurs.nom de la table lecteurs.', bloc: true },
      { phrase: 'Joins la table emprunts sur "emprunts.lecteur = lecteurs.id".', dansLeBloc: true },
      { phrase: 'Ordonne les lignes par lecteurs.nom en ordre croissant.', dansLeBloc: true },
      { phrase: 'Crée une requête qui lit la colonne lecteurs.nom de la table lecteurs.', bloc: true },
      { phrase: 'Joins la table emprunts en gardant toutes les lignes de gauche sur "emprunts.lecteur = lecteurs.id".', dansLeBloc: true },
      { phrase: 'Ordonne les lignes par lecteurs.nom en ordre croissant.', dansLeBloc: true },
      'Crée une requête qui calcule la moyenne de la colonne age de la table lecteurs.',
      'Crée une requête qui cherche la plus grande valeur de la colonne age de la table lecteurs.',
      'Crée une requête qui cherche la plus petite valeur de la colonne age de la table lecteurs.',
      'Crée une requête qui somme la colonne age de la table lecteurs.',
    ],
  },
  {
    nom: '05-ensembles.sql',
    titre: 'Domaine 7 — sous-requêtes, expression de table, ensembles',
    phrases: [
      // Scénario 8 : IN, EXISTS, EXCEPT.
      { phrase: 'Crée une requête qui lit la colonne nom de la table lecteurs.', bloc: true },
      { phrase: 'Ne garde que les lignes où id figure parmi les lecteur de la table emprunts.', dansLeBloc: true },
      { phrase: 'Ordonne les lignes par nom en ordre croissant.', dansLeBloc: true },
      { phrase: 'Crée une requête qui lit la colonne lecteurs.nom de la table lecteurs.', bloc: true },
      { phrase: 'Ne garde que les lignes pour lesquelles il existe une ligne de la table emprunts où "emprunts.lecteur = lecteurs.id".', dansLeBloc: true },
      { phrase: 'Ordonne les lignes par lecteurs.nom en ordre croissant.', dansLeBloc: true },
      { phrase: 'Crée une requête qui lit la colonne id de la table lecteurs.', bloc: true },
      { phrase: 'Retire ce qui figure parmi les lecteur de la table emprunts.', dansLeBloc: true },
      { phrase: 'Crée une requête fondée sur l’expression de table nommée majeurs qui lit la colonne id de la table lecteurs.', bloc: true },
      'Crée une requête qui lit la colonne nom de la table lecteurs désignée par l.',
    ],
  },
  {
    nom: '06-modifications.sql',
    titre: 'Domaines 8 et 9 — modification, vue, transaction annulée',
    phrases: [
      // Scénario 10 : UPDATE filtré, DELETE filtré, puis UPDATE sur TOUTES.
      'Modifie la table lecteurs en donnant à age le résultat de "age + 1" là où "id = 2".',
      'Supprime de la table emprunts les lignes où "id = 7".',
      // Scénario 11 : une vue, puis une transaction ANNULÉE.
      { phrase: 'Crée une vue nommée titres qui lit la colonne titre de la table livres.', bloc: true },
      'Ouvre une transaction.',
      'Supprime toutes les lignes de la table emprunts.',
      'Annule la transaction.',
      'Crée une requête qui compte les lignes de la table emprunts.',
      'Supprime la vue titres.',
      'Crée un rôle nommé bibliothecaire.',
      'Accorde la lecture de la table livres au rôle bibliothecaire.',
      'Retire la lecture de la table livres au rôle bibliothecaire.',
    ],
  },
];

/** Les trois épreuves NÉGATIVES. Chacune doit ÉCHOUER au serveur, et le
 * script vérifie qu'elle échoue : un exercice qui ne fait que réussir ne
 * prouve que la moitié. */
const NEGATIVES = [
  { nom: 'n1-check.sql', attendu: 'ck_lecteurs_age',
    phrases: ['Insère dans la table lecteurs une ligne dont id vaut 99 et nom vaut le texte "Negatif".',
      'Modifie la table lecteurs en donnant à age la valeur -5 là où "id = 99".'] },
  { nom: 'n2-cle-etrangere.sql', attendu: 'fk_emprunts_livre',
    phrases: ['Insère dans la table emprunts une ligne dont id vaut 99 et livre vaut 4242.'] },
  { nom: 'n3-suppression-referencee.sql', attendu: 'fk_emprunts_lecteur',
    phrases: ['Supprime de la table lecteurs les lignes où "id = 1".'] },
];

let phrasesEcrites = 0;
let gestes = 0;
const refus = [];

/** Dicte un fichier : chaque phrase est traduite, placée, et l'édition est
 * appliquée. Toute édition qui toucherait un caractère non blanc fait échouer
 * le script — c'est la vérification de l'INSERTION PURE. */
function dicter(fichier) {
  let texte = '';
  let curseur = 0;
  for (const entree of fichier.phrases) {
    const phrase = typeof entree === 'string' ? entree : entree.phrase;
    const dansLeBloc = typeof entree === 'string' ? false : entree.dansLeBloc === true;

    const resultat = SQL.natif?.(phrase);
    if (resultat === undefined || resultat.status === 'refus') {
      refus.push(`${fichier.nom} : ${phrase}\n    ${resultat === undefined ? 'non reconnue' : resultat.code + ' — ' + resultat.message}`);
      continue;
    }
    if (!dansLeBloc) {
      // Une instruction nouvelle : ligne blanche à la fin du document.
      if (texte !== '' && !texte.endsWith('\n\n')) texte += texte.endsWith('\n') ? '\n' : '\n\n';
      curseur = texte.length;
      gestes++;
    }
    const plan = planifierSql({
      document: { text: texte }, cursorOffset: curseur,
      comment: SQL.commentaire(phrase), code: resultat.code, kind: resultat.kind, eol: '\n',
    });
    if (plan.status === 'refuse') {
      const diagnostic = plan.diagnostics[0];
      refus.push(`${fichier.nom} : ${phrase}\n    PLACEMENT ${diagnostic.code} — ${diagnostic.message}`);
      continue;
    }
    const edition = plan.edits[0];
    const remplace = texte.slice(edition.range.start, edition.range.end);
    if (remplace.trim() !== '') {
      throw new Error(`INSERTION IMPURE : l’édition remplacerait « ${remplace} » dans ${fichier.nom}`);
    }
    texte = texte.slice(0, edition.range.start) + edition.newText + texte.slice(edition.range.end);
    curseur = plan.cursor === undefined ? edition.range.start + edition.newText.length : plan.cursor.offset;
    phrasesEcrites++;
  }
  return texte.endsWith('\n') ? texte : texte + '\n';
}

rmSync(dossier, { recursive: true, force: true });
mkdirSync(dossier, { recursive: true });
mkdirSync(journal, { recursive: true });

const ecrits = [];
for (const fichier of [...FICHIERS, ...NEGATIVES]) {
  const texte = dicter(fichier);
  writeFileSync(join(dossier, fichier.nom), texte, 'utf8');
  ecrits.push({ nom: fichier.nom, lignes: texte.split('\n').length - 1 });
}

console.log('phrases dictées   : ' + phrasesEcrites);
console.log('gestes d’éditeur  : ' + gestes);
console.log('fichiers écrits   : ' + ecrits.length);
for (const { nom, lignes } of ecrits) console.log('  ' + nom.padEnd(32) + lignes + ' lignes');

if (refus.length > 0) {
  console.error('\n' + refus.length + ' phrase(s) refusée(s) — RETOUCHE MANUELLE INTERDITE, donc échec :');
  for (const message of refus) console.error('  - ' + message);
  process.exit(1);
}

// ----------------------------- exécution -----------------------------
const psql = postgres.outil('psql');
if (psql === undefined) {
  console.log('\nAucun serveur SQL : les fichiers sont écrits, rien n’est exécuté.');
  process.exit(0);
}

const base = postgres.BASE;
const commun = ['-h', '127.0.0.1', '-p', String(postgres.PORT), '-U', postgres.UTILISATEUR,
  '--set', 'ON_ERROR_STOP=1', '-q'];

/** `psql` prefixe ses erreurs du CHEMIN ABSOLU du script, donc du nom de
 * l'utilisateur. Le journal est versionne, et un controle de pre-publication
 * refuse tout chemin personnel dans un fichier suivi -- il a trouve celui-ci.
 * On anonymise a la SOURCE, pas apres coup : un nettoyage separe s'oublie. */
function anonymiser(texte) {
  // Par MOTIF et non par comparaison de chaines : `psql` ecrit « c:/Users/… »
  // en minuscule la ou `resolve` donne « C:\Users\… », et la comparaison
  // litterale echouait sur cette seule difference de casse.
  return texte.replace(/[A-Za-z]:[\/][^\s"]*?[\/](exercice[\/])/gu, '<depot>/$1');
}

function jouer(fichier, surBase = base) {
  try {
    const sortie = execFileSync(psql, [...commun, '-d', surBase, '-f', join(dossier, fichier)],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, sortie: anonymiser(sortie) };
  } catch (erreur) {
    return { code: erreur.status ?? 1,
      sortie: anonymiser((erreur.stdout ?? '') + (erreur.stderr ?? '')) };
  }
}

// Une base NEUVE à chaque passage : un exercice qui dépend de l'état laissé
// par le précédent ne prouve rien de reproductible.
execFileSync(psql, [...commun, '-d', 'postgres', '-c',
  `DROP DATABASE IF EXISTS ${base}`], { stdio: 'pipe' });
// Un ROLE appartient a l'amas, pas a la base : recreer la base ne le fait pas
// disparaitre, et le second passage echouait sur « role already exists ».
// Ce n'est pas un defaut du produit, c'est un defaut du harnais -- mais un
// exercice qui ne passe qu'une fois ne prouve rien de reproductible.
execFileSync(psql, [...commun, '-d', 'postgres', '-c',
  'DROP ROLE IF EXISTS bibliothecaire'], { stdio: 'pipe' });
execFileSync(psql, [...commun, '-d', 'postgres', '-c',
  `CREATE DATABASE ${base} ENCODING 'UTF8' TEMPLATE template0`], { stdio: 'pipe' });

const resultats = [];
let echecs = 0;
for (const fichier of FICHIERS) {
  const r = jouer(fichier.nom);
  resultats.push({ fichier: fichier.nom, titre: fichier.titre, code: r.code, sortie: r.sortie });
  console.log('\n=== ' + fichier.nom + ' — code ' + r.code + ' ===');
  if (r.code !== 0) { echecs++; console.error(r.sortie.slice(0, 1200)); }
  else if (r.sortie.trim() !== '') console.log(r.sortie.trimEnd());
}

console.log('\n=== les trois épreuves NÉGATIVES ===');
for (const negative of NEGATIVES) {
  const r = jouer(negative.nom);
  const attendue = r.code !== 0 && r.sortie.includes(negative.attendu);
  resultats.push({ fichier: negative.nom, code: r.code, sortie: r.sortie, negative: true, attendue });
  console.log(`  ${negative.nom.padEnd(30)} code ${r.code}  ${attendue ? 'ÉCHOUE comme prévu (' + negative.attendu + ')' : 'INATTENDU'}`);
  if (!attendue) { echecs++; console.error('    ' + r.sortie.slice(0, 500)); }
}

writeFileSync(join(journal, 'cloture.json'), JSON.stringify({
  date: new Date().toISOString().slice(0, 10),
  phrases: phrasesEcrites, gestes, fichiers: ecrits,
  postgres: postgres.version(), resultats,
}, null, 2) + '\n', 'utf8');

console.log('\njournal : exercice/sql/journal/cloture.json');
if (echecs > 0) { console.error(echecs + ' échec(s).'); process.exit(1); }
console.log('Exercice de clôture : tout est conforme.');
