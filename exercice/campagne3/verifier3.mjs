// Campagne 3 — vérifie que les 19 compétences visées sont RÉELLEMENT
// employées par les programmes compilés, et que les sorties sont celles
// attendues.
//
//   node --experimental-strip-types exercice/campagne3/verifier3.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { CIBLES, REFUS_ATTENDUS } from './scenario3.mjs';

const Q = "'";

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const lines = [];
const say = (t) => { lines.push(t); console.log(t); };
let echecs = 0;

/** Le genre d'intention qui porte chaque compétence visée, et la phrase de
 * `scenario3.mjs` qui l'emploie. L'appariement est explicite : déduire le
 * genre du libellé serait une devinette. */
const PORTEUSES = [
  [1, 'INIT_INT', 'Crée un entier nommé base de valeur 20.'],
  [2, 'ASSIGN_EXPRESSION', 'Affecte à calcul le résultat de "base + 3 * 2".'],
  [3, 'PRINT_FORMATTED', 'Affiche calcul en hexadécimal.'],
  [4, 'ELSE_IF', 'Ajoute une branche sinon si "calcul > 20".'],
  [5, 'ELSE', 'Ajoute une branche sinon.'],
  [6, 'DO_WHILE', 'Crée une boucle avec test final tant que "i < 3".'],
  [7, 'FOR', 'Crée une boucle pour j de valeur initiale "0" tant que "j < 5" avec mise à jour "j + 1".'],
  [8, 'BREAK', 'Sors de la boucle la plus intérieure.'],
  [9, 'CONTINUE', 'Passe à l’itération suivante de la boucle la plus intérieure.'],
  [10, 'CASE_CHAR', 'Ajoute un cas pour le caractère \'A\'.'],
  [11, 'DECL_CHAR', 'Déclare un caractère nommé copie.'],
  [12, 'INIT_CHAR', 'Crée un caractère nommé lettre de valeur \'A\'.'],
  [13, 'PRINT_CHAR', 'Affiche le caractère copie.'],
  [14, 'ARRAY_PRINT', 'Affiche l’élément "0" de t.'],
  [15, 'ASSIGN_POINTED_INT', 'Affecte la valeur 5 à la valeur pointée par p.'],
  [16, 'STRUCT_VAR', 'Déclare une variable de type structure Point nommée centre.'],
  [17, 'REALLOCATE', 'Affecte à grand la réallocation de tab pour 4 éléments de type int.'],
  [18, 'FILE_READ_INT', 'Lis un entier depuis le fichier entree dans valeur.'],
  [19, 'FILE_AT_END', 'Crée un bloc si la fin du fichier entree est atteinte.'],
  // Ajoutées après les lots 30 et 31 : capacités neuves, qui avaient besoin
  // d'une preuve de compilation et d'exécution comme les autres.
  [20, 'FUNC_DEF', 'Crée une fonction interne nommée longueurMax qui retourne un int.'],
  [21, 'FILE_READ_STRING', 'Lis une chaîne de dimension 16 depuis le fichier entree dans ligne.'],
  [22, 'MEMBER_ASSIGN_CHAR', `Affecte le caractère ${Q}C${Q} au champ initiale de centre.`],
];

/** Sorties attendues, programme par programme, avec leur raison. */
const SORTIES = [
  ['classement', ['1a', 'moyen', '3', '023', 'B', '7', '5'], [
    '1a   : 20 + 3 * 2 = 26 en hexadécimal — la priorité du produit est respectée',
    'moyen: 26 > 100 faux, 26 > 20 vrai — la branche sinon si est prise',
    '3    : la boucle à test final incrémente i jusqu’à 3',
    '023  : la boucle pour saute j = 1 par continue et s’arrête à j = 4 par break',
    'B    : l’aiguillage prend le cas du caractère A, pas le cas par défaut',
    '7    : l’élément 0 du tableau',
    '5    : écrit par déréférencement, lu par le nom',
  ]],
  ['inventaire', ['3', '67', '9'], [
    '3  : champ x d’une variable de type structure',
    '67 : le champ initiale vaut \'C\', affiché avec « %d » — un caractère EST un entier',
    '9  : élément 2 du bloc réalloué, donc la réallocation a conservé le bloc',
  ]],
  ['journal', ['42', 'fin'], [
    '42  : entier écrit puis relu depuis le fichier',
    'fin : la fin de fichier est atteinte après la lecture',
  ]],
  ['texte', ['bonjour', '16'], [
    'bonjour : lu par fgets avec une borne écrite dans la phrase',
    '16      : retourné par une fonction à liaison interne, donc appelée',
  ]],
];

say('Campagne 3 — vérifications');
say('==========================');
say('');
say('--- 1. Les 19 compétences visées sont-elles EMPLOYÉES par les programmes ?');
say('');
const intentions = new Set(JSON.parse(readFileSync(root + 'journal/intentions.json', 'utf8')));
for (const [numero, kind, phrase] of PORTEUSES) {
  const translation = translate(phrase);
  const traduit = translation.status === 'translated' && translation.instruction.kind === kind;
  const employe = intentions.has(kind);
  const nom = CIBLES.find((c) => c[0] === numero)[1];
  const ok = traduit && employe;
  if (!ok) echecs++;
  say(`  ${ok ? 'EMPLOYÉE' : 'ÉCHEC   '} ${String(numero).padStart(2)}. ${nom.padEnd(34)} ${kind}`);
}

say('');
say('--- 2. Sorties observées, et ce qu’elles démontrent');
say('');
const journal = readFileSync(root + 'journal/compilation.txt', 'utf8');
for (const [prog, attendues, raisons] of SORTIES) {
  // Le journal contient « --- execution » À L'INTÉRIEUR de chaque section :
  // découper sur « --- » coupait avant les codes de sortie. On découpe donc
  // sur les en-têtes de section, en début de ligne seulement.
  const sections = journal.split(/^--- /mu);
  const section = sections.find((bloc) => bloc.startsWith(prog + '.c')) ?? '';
  const compile = /code de sortie du compilateur : 0/u.test(section);
  const execute = /code de sortie du programme : 0/u.test(section);
  if (!compile || !execute) { echecs++; say(`  ÉCHEC ${prog} : compilation ou exécution absente`); continue; }
  const manquantes = attendues.filter((v) => !section.includes(v));
  if (manquantes.length) { echecs++; say(`  ÉCHEC ${prog} : sorties absentes ${manquantes.join(', ')}`); continue; }
  say(`  ${prog}.c : compilation 0, exécution 0, ${attendues.length} sorties conformes`);
  for (const raison of raisons) say(`      ${raison}`);
}

say('');
say('--- 3. Refus attendus : les limites restent des limites');
say('');
for (const [label, phrase] of REFUS_ATTENDUS) {
  const translation = translate(phrase);
  if (translation.status === 'rejected') {
    say(`  REFUSÉ  ${translation.diagnostics[0].code.padEnd(24)} ${label}`);
  } else {
    say(`  ACCEPTÉ SANS AVERTISSEMENT       ${label}`);
    say(`          ${translation.fragments[0].code.trim()}`);
  }
}

say('');
say(echecs === 0 ? 'TOUTES LES VÉRIFICATIONS PASSENT.' : `${echecs} VÉRIFICATION(S) EN ÉCHEC.`);
writeFileSync(root + 'journal/verifications.txt', lines.join('\n') + '\n', 'utf8');
process.exitCode = echecs === 0 ? 0 : 1;
