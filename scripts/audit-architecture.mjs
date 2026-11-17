// Mesure l'architecture, au lieu de la décrire.
//
//   node --experimental-strip-types scripts/audit-architecture.mjs
//
// Produit docs/phase2/MESURES.md et les chiffres que l'audit cite. Tout ce
// que l'audit affirme sur la portabilité doit sortir d'ici : une estimation
// qui repose sur une impression ne vaut rien, et ce projet l'a déjà payé une
// fois avec une sortie prédite de mémoire.
//
// Trois mesures indépendantes :
//   1. les modules : taille, imports, densité de C dans le code ;
//   2. les 84 intentions : classées par portabilité, et la classe est
//      décidée par le CONCEPT, pas par le nom ;
//   3. les diagnostics, les informations pédagogiques et les règles de
//      placement : combien parlent de C, combien parlent de langue.

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { translate } from '../src/translate.ts';
import { GENRES } from '../src/langages/registre.ts';

const racine = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const sortie = join(racine, 'docs', 'phase2');
mkdirSync(sortie, { recursive: true });

// ---------------------------------------------------------------------------
// 1. Les modules : taille, imports, densité de C
// ---------------------------------------------------------------------------

/** Marqueurs de C17 dans le code source d'un module. Ce qu'on compte, c'est
 * la quantité de C **écrite en dur** : un module qui n'en contient pas est
 * candidat au socle commun sans retouche. */
const MARQUEURS_C = [
  /printf\(/gu, /scanf\(/gu, /fprintf\(/gu, /fopen\(/gu, /malloc\(/gu, /realloc\(/gu, /free\(/gu,
  /sizeof/gu, /#include/gu, /#ifndef/gu, /#define/gu, /#endif/gu,
  /\bint\b/gu, /\bchar\b/gu, /\bvoid\b/gu, /\bdouble\b/gu, /\bfloat\b/gu, /\bunsigned\b/gu,
  /\bstruct\b/gu, /\bstatic\b/gu, /\bextern\b/gu, /\btypedef\b/gu, /\bassert\b/gu,
  /%[dxosufce]/gu, /\bFILE\b/gu, /\bconst\b/gu,
];
/** Marqueurs de syntaxe C dans les chaînes produites : accolades de bloc,
 * point-virgule terminal, étoile de pointeur. */
const MARQUEURS_SYNTAXE = [/\{\\n/gu, /;\\n/gu, /\) \{/gu, /\*\$\{/gu, /\\n\}/gu];

const modules = [];
for (const dossier of [['src'], ['extension', 'src']]) {
  const chemin = join(racine, ...dossier);
  for (const nom of readdirSync(chemin).filter(n => n.endsWith('.ts'))) {
    const texte = readFileSync(join(chemin, nom), 'utf8');
    const lignes = texte.split('\n').length;
    const imports = [...texte.matchAll(/from '\.\/([A-Za-z]+)\.ts'/gu)].map(m => m[1]);
    const importeVscode = /from 'vscode'/u.test(texte);
    // Seules les CHAÎNES sont inspectées : dans le code TypeScript, « const »,
    // « void » ou « static » sont de la syntaxe TS, et un commentaire parle de
    // C sans en produire. Ce qu'on mesure, c'est le C que le module ÉCRIT.
    const litteraux = [...texte.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/gu)]
      .map(m => m[0]).join('\n');
    const compte = (motifs) => motifs.reduce((n, m) => n + (litteraux.match(m) ?? []).length, 0);
    modules.push({
      nom: dossier.join('/') + '/' + nom,
      court: nom.replace(/\.ts$/u, ''),
      lignes,
      imports: [...new Set(imports)],
      vscode: importeVscode,
      c: compte(MARQUEURS_C),
      syntaxe: compte(MARQUEURS_SYNTAXE),
    });
  }
}
const parNom = new Map(modules.map(m => [m.court, m]));
for (const m of modules) m.importePar = modules.filter(a => a.imports.includes(m.court)).map(a => a.court);

// ---------------------------------------------------------------------------
// 2. Les intentions : portabilité décidée par le concept
// ---------------------------------------------------------------------------

/** Quatre classes, et une seule par intention.
 *  'commune'   le concept existe dans tout langage impératif enseigné ;
 *  'adaptable' le concept existe ailleurs, mais la forme change (types,
 *              formats d'affichage, déclaration) ;
 *  'specifique' le concept est propre à C ou à une famille proche : rien à
 *              porter, et le forcer ailleurs serait une faute ;
 *  'structure' le concept existe, mais sa POSE dépend de la syntaxe de blocs
 *              du langage cible — c'est le placement qui change, pas l'idée.
 */
const CLASSES = {
  MAIN: 'adaptable', INCLUDE_STDIO: 'specifique', INCLUDE_STDLIB: 'specifique',
  INCLUDE_ASSERT: 'specifique', INCLUDE_LIMITS: 'specifique', INCLUDE_LOCAL: 'adaptable',
  GUARD_OPEN: 'specifique', GUARD_CLOSE: 'specifique',
  DECL_INT: 'adaptable', INIT_INT: 'commune', ASSIGN_INT: 'commune',
  ASSIGN_EXPRESSION: 'commune', NUMERIC_DECL: 'adaptable', NUMERIC_INIT: 'commune',
  NUMERIC_ASSIGN: 'commune',
  PRINT_INT: 'adaptable', PRINT_FORMATTED: 'adaptable', PRINT_TEXT: 'adaptable',
  NUMERIC_PRINT: 'adaptable', PRINT_NEWLINE: 'adaptable',
  IF: 'structure', ELSE_IF: 'structure', ELSE: 'structure',
  WHILE: 'structure', DO_WHILE: 'specifique', FOR: 'structure',
  BREAK: 'commune', CONTINUE: 'commune',
  SWITCH: 'adaptable', CASE_INT: 'adaptable', CASE_CHAR: 'adaptable',
  CASE_DEFAULT: 'adaptable', BREAK_SWITCH: 'specifique',
  FUNC_DEF: 'structure', FUNC_PROTOTYPE: 'specifique', LINKAGE_DECL: 'specifique',
  RETURN: 'commune', RETURN_INT: 'commune', RETURN_EXPRESSION: 'commune',
  RETURN_NUMERIC: 'commune', CALL: 'commune', CALL_ASSIGN: 'commune',
  DECL_CHAR: 'specifique', INIT_CHAR: 'adaptable', ASSIGN_CHAR: 'adaptable',
  PRINT_CHAR: 'adaptable',
  ARRAY_DECL: 'adaptable', ARRAY_ASSIGN_INT: 'commune', ARRAY_ASSIGN_CHAR: 'adaptable',
  ARRAY_ASSIGN_EXPRESSION: 'commune', ARRAY_PRINT: 'adaptable', ARRAY_PRINT_CHAR: 'adaptable',
  STRING_INIT: 'adaptable', PRINT_STRING: 'adaptable',
  DECL_POINTER: 'specifique', INIT_POINTER: 'specifique', ASSIGN_ADDRESS: 'specifique',
  PRINT_POINTED: 'specifique', ASSIGN_POINTED_INT: 'specifique',
  ASSIGN_POINTED_EXPRESSION: 'specifique',
  STRUCT_DECL: 'adaptable', STRUCT_FIELD: 'adaptable', STRUCT_VAR: 'adaptable',
  STRUCT_POINTER: 'specifique', MEMBER_ASSIGN_INT: 'commune',
  MEMBER_ASSIGN_CHAR: 'adaptable', MEMBER_ASSIGN_EXPRESSION: 'commune',
  MEMBER_PRINT: 'adaptable', TYPE_ALIAS: 'specifique',
  SIZEOF_PRINT: 'specifique', SIZEOF_ASSIGN: 'specifique', ALLOCATE: 'specifique',
  REALLOCATE: 'specifique', FREE: 'specifique',
  FILE_DECL: 'adaptable', FILE_OPEN: 'adaptable', FILE_CLOSE: 'adaptable',
  FILE_WRITE_TEXT: 'adaptable', FILE_WRITE_INT: 'adaptable',
  FILE_READ_INT: 'adaptable', FILE_READ_STRING: 'adaptable', FILE_AT_END: 'adaptable',
  ASSERT: 'adaptable', CONST_DECL: 'adaptable',
};

const CATALOGUE = readFileSync(join(racine, 'docs', 'CATALOGUE.md'), 'utf8');
const phrases = CATALOGUE.split('\n').filter(l => l.startsWith('| `'))
  .map(l => /^\| `(.+?)` \|/u.exec(l)?.[1]).filter(Boolean);
const genres = new Map();
for (const phrase of phrases) {
  const r = translate(phrase);
  if (r.status === 'translated' && !genres.has(r.instruction.kind)) genres.set(r.instruction.kind, phrase);
}
const inclassees = [...genres.keys()].filter(g => !(g in CLASSES));
const orphelines = Object.keys(CLASSES).filter(g => !genres.has(g));
// Lot P3 : une classe posee pour un nom qui N'EST PAS un genre est un
// FANTOME, pas un trou de catalogue. Le script le signalait sans echouer,
// et NUMERIC_CONVERT a donc vecu dans deux documents : la conversion n'est
// pas une intention, c'est un noeud `cast` dans une expression.
const fantomes = Object.keys(CLASSES).filter(g => !GENRES.has(g));

const parClasse = { commune: [], adaptable: [], structure: [], specifique: [] };
for (const genre of [...genres.keys()].sort()) {
  const classe = CLASSES[genre] ?? 'inclassee';
  (parClasse[classe] ??= []).push(genre);
}

// ---------------------------------------------------------------------------
// 3. Diagnostics, informations, placement
// ---------------------------------------------------------------------------

const translateSrc = readFileSync(join(racine, 'src', 'translate.ts'), 'utf8');
const bloc = /export type DiagnosticCode =([\s\S]*?);\n/u.exec(translateSrc)?.[1] ?? '';
const codes = [...bloc.matchAll(/'([A-Z_0-9]+)'/gu)].map(m => m[1]);
/** Un diagnostic parle de C si son nom nomme une notion de C ; il parle de
 * langue s'il nomme un défaut de la phrase. Le partage se fait sur des
 * racines, pas au cas par cas, pour que la mesure soit reproductible. */
const RACINES_C = ['POINTER', 'ARRAY', 'CHAR', 'STRUCT', 'MEMBER', 'FIELD', 'HEADER', 'GUARD',
  'FILE', 'SIZEOF', 'ALLOC', 'FREE', 'INCLUDE', 'RETURN', 'FUNCTION', 'SWITCH', 'CASE',
  'LOOP', 'BRANCH', 'STATEMENT', 'TYPE', 'NUMERIC', 'INTEGER', 'DIVISOR', 'KEYWORD',
  'DIMENSION', 'INDEX', 'STRING', 'ASSIGNMENT', 'EXPRESSION', 'OPERAND', 'OPERATOR', 'LINKAGE'];
const diagnostics = { langue: [], c: [] };
for (const code of codes) {
  (RACINES_C.some(r => code.includes(r)) ? diagnostics.c : diagnostics.langue).push(code);
}

const infoSrc = readFileSync(join(racine, 'src', 'pedagogicalInformation.ts'), 'utf8');
const blocInfo = /export type PedagogicalInformation = \{[\s\S]*?code:([\s\S]*?);\n/u.exec(infoSrc)?.[1] ?? '';
const infos = [...blocInfo.matchAll(/'([A-Z_0-9]+)'/gu)].map(m => m[1]);

const placementSrc = readFileSync(join(racine, 'src', 'enclosingStructures.ts'), 'utf8');
const accolades = (placementSrc.match(/[{}]'|'\{'|'\}'/gu) ?? []).length;
const placementModules = ['planPlacement', 'enclosingStructures', 'branchTarget', 'loopTarget',
  'switchTarget', 'structTarget', 'functionContext', 'placementLexical', 'statementScope'];
const lignesPlacement = placementModules.reduce((n, nom) => n + (parNom.get(nom)?.lignes ?? 0), 0);

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

const total = modules.filter(m => m.nom.startsWith('src/')).reduce((n, m) => n + m.lignes, 0);
const lignes = [];
const L = (...x) => lignes.push(...x);

L('# Phase 2 — mesures de l’architecture', '',
  'Produit par `node --experimental-strip-types scripts/audit-architecture.mjs`.',
  'Aucun chiffre de `docs/phase2/AUDIT_ARCHITECTURE.md` n’est écrit à la main.', '',
  '## 1. Modules du moteur', '',
  '`C` compte les marqueurs de C17 écrits en dur dans le module (noms de',
  'fonctions de la bibliothèque, mots-clés de type, formats). `Syntaxe` compte',
  'les motifs de syntaxe C dans les chaînes produites : accolade de bloc,',
  'point-virgule terminal, étoile de pointeur.', '',
  '| Module | Lignes | C | Syntaxe | Importe | Importé par |', '|---|---|---|---|---|---|');
for (const m of modules.filter(x => x.nom.startsWith('src/')).sort((a, b) => b.lignes - a.lignes)) {
  L('| `' + m.nom + '` | ' + m.lignes + ' | ' + m.c + ' | ' + m.syntaxe + ' | '
    + (m.imports.length || '—') + ' | ' + (m.importePar.length || '—') + ' |');
}
L('', '**Total moteur : ' + total + ' lignes** sur ' + modules.filter(m => m.nom.startsWith('src/')).length
  + ' modules.', '');

const sansC = modules.filter(m => m.nom.startsWith('src/') && m.c === 0 && m.syntaxe === 0);
const avecC = modules.filter(m => m.nom.startsWith('src/') && (m.c > 0 || m.syntaxe > 0));
L('| Partage | Modules | Lignes |', '|---|---|---|');
L('| **aucun marqueur de C** | ' + sansC.length + ' | ' + sansC.reduce((n, m) => n + m.lignes, 0) + ' |');
L('| au moins un marqueur | ' + avecC.length + ' | ' + avecC.reduce((n, m) => n + m.lignes, 0) + ' |');
L('', 'Modules sans aucun marqueur de C : ' + sansC.map(m => '`' + m.court + '`').join(', ') + '.', '');

L('## 2. Les ' + genres.size + ' intentions, par portabilité', '');
if (inclassees.length) L('**Intentions non classées : ' + inclassees.join(', ') + '** — le script échoue.', '');
if (orphelines.length) L('*Classes posées pour des genres absents du catalogue : ' + orphelines.join(', ') + '.*', '');
if (fantomes.length) L('**Classes posées pour des noms qui ne sont pas des genres : ' + fantomes.join(', ') + '** — le script échoue.', '');
L('| Classe | Nombre | Part |', '|---|---|---|');
for (const [classe, liste] of Object.entries(parClasse)) {
  L('| ' + classe + ' | **' + liste.length + '** | '
    + (Math.round((liste.length / genres.size) * 1000) / 10).toFixed(1).replace('.', ',') + ' % |');
}
L('');
for (const [classe, liste] of Object.entries(parClasse)) {
  L('**' + classe + '** (' + liste.length + ') : ' + liste.map(g => '`' + g + '`').join(', '), '');
}

L('## 3. Diagnostics', '',
  '| | Nombre |', '|---|---|',
  '| codes de diagnostic | **' + codes.length + '** |',
  '| nomment un défaut de **la phrase** | ' + diagnostics.langue.length + ' |',
  '| nomment une notion **du langage cible** | ' + diagnostics.c.length + ' |', '',
  'Défauts de la phrase : ' + diagnostics.langue.map(c => '`' + c + '`').join(', ') + '.', '');

L('## 4. Informations pédagogiques', '',
  '| | Nombre |', '|---|---|',
  '| codes d’information | **' + infos.length + '** |', '',
  'Elles sont, par construction, des leçons **sur le langage cible** : chacune',
  'nomme une notion de C17. Aucune n’est réutilisable telle quelle pour un',
  'autre langage ; leur **canal** et leur mécanique, eux, le sont.', '');

L('## 5. Placement', '',
  '| | |', '|---|---|',
  '| modules de placement | ' + placementModules.length + ' |',
  '| lignes | **' + lignesPlacement + '** (' + (Math.round((lignesPlacement / total) * 1000) / 10).toFixed(1).replace('.', ',') + ' % du moteur) |',
  '| occurrences d’accolades dans le balayage partagé | ' + accolades + ' |', '',
  'Le placement est **le point le plus couplé** : toute la reconnaissance de',
  'contexte repose sur les accolades `{` et `}`. Un langage à blocs',
  'indentés n’a pas ces jetons.', '');

L('## 6. Interface VS Code', '',
  '| Module | Lignes | importe `vscode` |', '|---|---|---|');
for (const m of modules.filter(x => x.nom.startsWith('extension/'))) {
  L('| `' + m.nom + '` | ' + m.lignes + ' | ' + (m.vscode ? 'oui' : 'non') + ' |');
}
const moteurVscode = modules.filter(m => m.nom.startsWith('src/') && m.vscode);
L('', 'Modules du **moteur** important `vscode` : **' + moteurVscode.length + '**.', '');

writeFileSync(join(sortie, 'MESURES.md'), lignes.join('\n') + '\n', 'utf8');

console.log('moteur            :', total, 'lignes sur', modules.filter(m => m.nom.startsWith('src/')).length, 'modules');
console.log('sans marqueur C   :', sansC.length, 'modules,', sansC.reduce((n, m) => n + m.lignes, 0), 'lignes');
console.log('intentions        :', genres.size);
for (const [classe, liste] of Object.entries(parClasse)) console.log('  ' + classe.padEnd(11), liste.length);
console.log('diagnostics       :', codes.length, '| phrase :', diagnostics.langue.length, '| langage cible :', diagnostics.c.length);
console.log('informations      :', infos.length);
console.log('placement         :', lignesPlacement, 'lignes');
console.log('moteur -> vscode  :', moteurVscode.length);
console.log('rapport           : docs/phase2/MESURES.md');
if (inclassees.length) { console.error('INTENTIONS NON CLASSÉES :', inclassees.join(', ')); process.exit(1); }
if (fantomes.length) { console.error('CLASSES POSÉES POUR DES NOMS QUI NE SONT PAS DES GENRES :', fantomes.join(', ')); process.exit(1); }
