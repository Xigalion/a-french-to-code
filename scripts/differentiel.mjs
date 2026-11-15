// Differential non-regression harness.
//
//   node scripts/differentiel.mjs [ref]        (default: HEAD)
//
// Extracts the engine at a git reference into a temporary directory and runs it
// side by side with the working tree on a large generated corpus. Any difference
// in parsed tree, diagnostic code, message, UTF-16 range, token budget, produced
// fragment or placement plan is reported as a divergence.
//
// This answers a question the test suite cannot: a refactor that is supposed to
// change nothing is proved by comparing against the previous engine itself, not
// by the tests that engine already passed. It is a tool, not a test: it needs a
// git reference and is therefore absent from `npm test`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const reference = process.argv[2] ?? 'HEAD';
// An approved extension changes behaviour on purpose. It is still a divergence
// and is still printed; it simply does not fail the run. Everything the pattern
// does not cover is a regression. The pattern used is recorded in the lot bilan.
const flag = process.argv.indexOf('--extensions');
const extensions = flag === -1 ? undefined : new RegExp(process.argv[flag + 1], 'u');
// A pattern matched against the whole input over-captures: the random corpus
// contains `[` and `]` as ordinary atoms, so an approved bucket cannot simply
// be trusted. `--no-loss` audits what the bucket may contain: an extension is
// allowed to turn a refusal into an acceptance or into another refusal, never
// to take away something the previous engine accepted. Any entry whose BEFORE
// side was accepted is printed and fails the run.
// Stages a lot declares frozen: there, a matching input buys no indulgence and
// every divergence is a regression. Without this, a capability leaking into a
// profile the contract sealed would hide inside the approved bucket, because
// the input that reveals the leak matches the extension pattern too.
const frozenFlag = process.argv.indexOf('--frozen-stages');
const frozen = frozenFlag === -1 ? undefined : new RegExp(process.argv[frozenFlag + 1], 'u');
const noLoss = process.argv.includes('--no-loss');
const accepted = /"status":"(?:translated|planned|parsed)"/u;
const root = process.cwd();
const extracted = mkdtempSync(join(tmpdir(), 'ca-differentiel-'));
try {
  execFileSync('git', ['rev-parse', '--verify', reference + '^{commit}'], { cwd: root, stdio: 'ignore' });
} catch {
  console.error(`Référence git introuvable : ${reference}`);
  process.exit(2);
}
execFileSync('bash', ['-c', `git archive ${reference} src | tar -x -C "${extracted.replace(/\\/g, '/')}"`], { cwd: root, stdio: 'inherit' });

const load = async (base, file) => import(new URL(`src/${file}.ts`, pathToFileURL(base + '/')).href);
const sides = [];
for (const base of [extracted, root]) {
  sides.push({
    expression: await load(base, 'expression'),
    numeric: await load(base, 'numericExpression'),
    condition: await load(base, 'condition'),
    translate: await load(base, 'translate'),
    placement: await load(base, 'planPlacement'),
    advisories: await load(base, 'calculationAdvisories'),
    pedagogy: await load(base, 'pedagogicalInformation'),
  });
}
const [before, after] = sides;

const RESERVED = new Set(['int', 'char', 'unsigned', 'double', 'float', 'void', 'for', 'while', 'return', 'if', 'else']);
const validate = (token) => RESERVED.has(token.text)
  ? { code: 'C_KEYWORD_IDENTIFIER', category: 'understanding', severity: 'error', message: 'Mot-clé du langage C.', range: token.range }
  : undefined;

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stable(value[key]);
    return out;
  }
  return value;
}
function snapshot(run) {
  const budget = { count: 0 };
  try {
    return JSON.stringify({ result: stable(run(budget)), budget: budget.count });
  } catch (error) {
    return JSON.stringify({ thrown: String(error && error.message) });
  }
}

let checked = 0;
const divergences = [];
const approved = [];
function record(stage, input, a, b) {
  checked++;
  if (a === b) return;
  if (extensions?.test(input) && !frozen?.test(stage)) { approved.push({ stage, input, before: a, after: b }); return; }
  divergences.push(divergences.length < 10 ? { stage, input, before: a, after: b } : { stage, input });
}

const BS = String.fromCharCode(92);

const ATOMS = [
  'a', 'b', '_x', 'int', 'char', 'unsigned', 'double', 'A', '1', '0', '2', '42', '007',
  '2.5', '.5', '5.', '1e', '1e+', '1e5', '1E-3', '1u', '1U', '1f', '2.5F', '12abc', '0x1f',
  '+', '-', '*', '/', '%', '(', ')', '!', '&&', '||', '<', '>', '<=', '>=', '==', '!=',
  '=', '&', '|', '^', '~', '?', ':', '->', '++', '--', '<<', '>>', '+=', '/*', '//',
  ',', ';', '[', ']', '{', '}', '"', "'", '\\', '.', '😀', 'é', 'é', 'é',
  '\ud800', '\udc00', '‍', '‮', '\t', '  ',
];

function* fragments() {
  for (const atom of ATOMS) yield atom;
  for (const a of ATOMS) for (const b of ATOMS) { yield a + b; yield a + ' ' + b; }
  let seed = 123456789;
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
  for (let i = 0; i < 120000; i++) {
    const length = 3 + (next() % 5);
    let text = '';
    for (let j = 0; j < length; j++) text += ATOMS[next() % ATOMS.length] + (next() % 2 ? ' ' : '');
    yield text;
  }
  yield* ['', ' ', 'a'.repeat(5000), '('.repeat(70) + 'a' + ')'.repeat(70), '('.repeat(64) + 'a' + ')'.repeat(64),
    '-'.repeat(70) + 'a', '(int) a', '(unsigned int) a', '(unsigned) a', '(char) a', '(long long) a', '(int a', '(int)'];
  for (const count of [600, 1100]) yield Array.from({ length: count }, (_, i) => 'n' + i).join(' + ');
  yield Array.from({ length: 600 }, (_, i) => 'n' + i).join(' < ');
}

const PROFILES = [
  ['entier', (side) => side.expression.parseExpression, []],
  ['numérique', (side) => side.numeric.parseNumericExpression, ['Il manque l’expression à calculer.']],
  ['numérique-message', (side) => side.numeric.parseNumericExpression, ['Autre message.']],
  ['condition', (side) => side.condition.parseCondition, ['Il manque la condition du bloc.']],
  ['condition-message', (side) => side.condition.parseCondition, ['Autre message.']],
];
// Each input is parsed standalone and embedded, so absolute UTF-16 offsets are
// compared and not merely relative ones.
const PREFIX = 'Affecte à x le résultat de "';

for (const source of fragments()) {
  for (const [text, start, end] of [[source, 0, source.length], [PREFIX + source + '".', PREFIX.length, PREFIX.length + source.length]]) {
    for (const [name, pick, extra] of PROFILES) {
      record(`${name}${start ? ' (décalé)' : ''}`, source,
        snapshot((budget) => pick(before)(text, start, end, validate, ...extra, budget)),
        snapshot((budget) => pick(after)(text, start, end, validate, ...extra, budget)));
    }
  }
}

// The token allowance is global to one instruction: two sibling expressions must
// share it, and neither side may reset it.
for (const pair of [['a + b', 'c * d'], ['1 < 2', '3 > 4'], ['(int) a', 'b'], ['', 'a']]) {
  for (const [name, pick, extra] of PROFILES.slice(1)) {
    const run = (side) => {
      const budget = { count: 0 };
      const first = stable(pick(side)(pair[0], 0, pair[0].length, validate, ...extra, budget));
      const second = stable(pick(side)(pair[1], 0, pair[1].length, validate, ...extra, budget));
      return JSON.stringify({ first, second, budget: budget.count });
    };
    record(`${name} (budget partagé)`, pair.join(' | '), run(before), run(after));
  }
}

const NAMES = ['age', 'x', 'n', 'i', 'total', 'resultat', 'int', 'while', '_v', 'é', 'a1'];
const EXPRESSIONS = ['2 + 3 * 4', 'a + b', '-a', '(a + b) * c', 'a / 0', 'a % b', '1e5', '2.5', '.5', '1e',
  '(double) 7 / 2', '(unsigned int) a', '(char) a', '(long) a', 'a[0]', "'A'", '"t"', 'a & b',
  '* a', '&a', 'p->x', 'a == b', 'a < b && c', '!a', 'a = b', 'f(a)', '', '  ', 'a a', '((a)',
  // Lot 15 surface. Before that lot every index here is a refusal.
  't[i]', 't[0]', 't[i + 1]', 't[u[i]]', 't[i][j]', 't[]', 't[ ]', 't[0', 't]', '1[t]', '(a + b)[0]',
  't[1.5]', "t['A']", "'A'", "' '", "'"+BS+"0'", "'z' - 'a'", "s[i] != '"+BS+"0'", "c == 'A'", "'ab'", "'"+BS+"q'",
  "a 'A'", "'A' 'B'", "'a", "'", "t['"+BS+"0']", "-'A'", "('A')", "'A' + 1", 't[(int) i]', 't[i < 3]', 't[a && b]', '&t[0]', '* t[0]', 't[i] + t[j]', 't [i]',
  // Lot 17 surface.
  '&x', '*p', '&t[0]', '&t[i + 1]', '* *p', '& &x', '&*p', '*&x', '&5', '&(a + b)', '&-x', "&'A'",
  '*5', '*(p + 1)', '*t[0]', '*(p)', '(*p)', '&', '*', '*p + 1', '&x + 1', 'a * *b', '-*p', '!*p',
  '&&x', '**p', 'a & b', 'a && b', 'a ** b', '*p * 2', '&x == &y', '*p != 0',
  // Lot 18 surface.
  '*(t + i)', '*(t + 0)', '*(t + i * 2)', '*(t + (i + 1))', '*(t + u[i])', '*(t + -i)', '*(t + (i))',
  '*(t + i) + 1', '*(i + t)', '*(p + q)', '*(p - i)', '*(t + i + j)', '*(t * i)', '*(t / i)',
  '*(t + 1.5)', '*(t + 1e3)', '*(t + (int) 1)', "*(t + 'A')", '*(t + *q)', '*(t + &x)',
  '*(t[0] + i)', '*(-t + i)', '*((t) + i)', '*(t + i', '*(t + )', '*( + i)', '*(t +)',
  '*(t + i) + *(u + j)', '&*(t + i)', '* *(t + i)', 't[*(u + i)]',
  // Lot 20 surface.
  'p.x', 'q->x', 'p.a.b', 'q->a->b', 'q->a.b', 't[i].x', 'p.x + 1', 'p.x * q->y', '-p.x',
  'p.', 'p->', 'p.1', 'p.+', '->x', '.x', 'p.t[i]', 'p.int', 'a -> b', 'a . b', '1.5.2',
  'a +', '+ a', '1u', '2.5f', '0x1f', '12abc', 'a, b', 'a; b', '😀', 'a' + ' + a'.repeat(600)];
const TYPES = ['int', 'unsigned int', 'float', 'double', 'char', 'long'];
const FORMATS = ['décimal', 'hexadécimal', 'octal', 'décimal non signé', 'binaire'];

function* sentences() {
  yield* ['Crée la fonction principale.', 'Inclue la bibliothèque stdio.h.', 'Retourne.',
    'Ajoute une branche sinon.', 'Sors de la boucle la plus intérieure.',
    'Passe à l’itération suivante de la boucle la plus intérieure.', 'Appelle affiche.',
    '', '   ', 'Phrase inconnue.', 'Crée', 'Crée un entier',
    'CRÉE UN ENTIER NOMMÉ age DE VALEUR 20', 'crée un entier nommé age de valeur 20',
    'Cree un entier nomme age de valeur 20.', 'Passe à l\'itération suivante de la boucle la plus intérieure.'];
  for (const name of NAMES) {
    yield* [`Déclare un entier nommé ${name}.`, `Crée un entier nommé ${name} de valeur 20.`,
      `Affecte la valeur 25 à ${name}.`, `Affiche la valeur de ${name}.`, `Appelle ${name}.`,
      `Crée une fonction nommée ${name} qui ne retourne rien.`];
    for (const format of FORMATS) yield `Affiche ${name} en ${format}.`;
    for (const type of TYPES) {
      yield* [`Déclare une variable de type ${type} nommée ${name}.`,
        `Crée une fonction nommée ${name} qui retourne un ${type}.`,
        `Crée une fonction nommée ${name} qui retourne un ${type} et prend un ${type} nommé ${name}.`];
    }
  }
  for (const expression of EXPRESSIONS) {
    yield* [`Affecte à x le résultat de "${expression}".`, `Affecte à x le résultat numérique de "${expression}".`,
      `Crée une variable de type double nommée x avec le résultat de "${expression}".`,
      `Retourne le résultat de "${expression}".`, `Retourne le résultat numérique de "${expression}".`,
      `Appelle somme avec "${expression}".`, `Appelle somme avec "${expression}" et "${expression}".`,
      `Affecte à total le résultat de l’appel de somme avec "${expression}".`,
      `Crée un bloc si "${expression}".`, `Ajoute une branche sinon si "${expression}".`,
      `Crée une boucle tant que "${expression}".`, `Crée une boucle avec test final tant que "${expression}".`,
      `Crée une boucle pour i de valeur initiale "0" tant que "${expression}" avec mise à jour "i + 1".`];
  }
  // The text grammar is shared with the string initialiser since lot 16, so
  // it is exercised widely: a thin corpus would not guard the refactor.
  const TEXTS = ['Bonjour\\n', 'a\\"b', 'a\\\\b', 'a\\tb', 'a\\qb', '', 'a', ' ', '\\n', '\\t', '\\\\', '\\"',
    '\\n\\t\\\\\\"', 'a\\tb\\nc', 'a??=b', 'a??/b', 'a?b', '??', 'é', '😀', 'a b c', '{}', '[]', "'", "a'b",
    'a\\u0001b', 'a\u0001b', 'a\u007fb', 'a\ud800b', 'a\\', 'a\\0b', 'a\\rb', 'a\\vb', 'a\\xb', 'a\\1b'];
  for (const text of TEXTS) {
    yield `Affiche le texte "${text}".`;
    yield `Affiche le texte "${text}"`;
    yield `Affiche le texte "${text}" encore.`;
    yield `Crée un tableau de type char nommé s de dimension 64 avec le texte "${text}".`;
  }
  yield* ['Affiche le texte.', 'Affiche le texte "a', 'Affiche le texte a".', 'Affiche le texte ""'];
  // Lot 29 : la formulation du retour à la ligne, et les approximations
  // voisines qui doivent rester refusées, dont « Passe à la ligne. » qui
  // frôle « Passe à l'itération suivante… ».
  yield* ['Affiche un retour à la ligne.', 'Affiche un retour à la ligne',
    '  Affiche un retour à la ligne.  ', 'AFFICHE UN RETOUR À LA LIGNE.',
    'Passe à la ligne.', 'Affiche un retour.', 'Affiche un saut de ligne.',
    'Affiche la ligne.', 'Affiche un retour à la ligne maintenant.',
    'Affiche deux retours à la ligne.', 'Affiche un retour à la ligne et un espace.'];
  // Lot 14 surface. Before that lot every line here is a refusal, so each one
  // shows up as an approved extension rather than as silence.
  for (const literal of ["'A'", "'z'", "'0'", "' '", "'}'", "'" + BS + "n'", "'" + BS + "t'",
    "'" + BS + BS + "'", "'" + BS + "''", "''", "'ab'", "'" + BS + "q'", "'" + BS + "0'",
    "'é'", "'\u{1F600}'", "’A’", 'A', '"A"', "'a", "'"]) {
    yield `Crée un caractère nommé c de valeur ${literal}.`;
    yield `Affecte le caractère ${literal} à c.`;
  }
  for (const name of NAMES) {
    yield* [`Déclare un caractère nommé ${name}.`, `Affiche le caractère ${name}.`,
      `Déclare une variable de type char nommée ${name}.`,
      `Crée une fonction nommée ${name} qui retourne un char.`,
      `Crée une fonction nommée ${name} qui retourne un int et prend un char nommé ${name}.`];
  }
  yield* ['Crée un caractère.', 'Crée un caractère nommé.', 'Crée un caractère nommé c.',
    'Déclare un caractère.', 'Affiche le caractère.', "Affecte le caractère 'A'.",
    "Affecte le caractère 'A' a c.", 'Déclare une variable de type unsigned char nommée c.',
    'Affecte à n le résultat numérique de "(char) 65".', 'Crée un bloc si "(char) a < 5".',
    'Affiche le caractere c.', 'Affiche le texte "A".'];
  // Lot 15 surface. Before that lot every line here is a refusal too.
  for (const type of [...TYPES, 'unsigned char', 'void']) {
    for (const dimension of ['10', '1', '0', '-3', 'n', '3.5', '03', '']) {
      yield `Déclare un tableau de type ${type} nommé t de dimension ${dimension}.`;
    }
  }
  for (const index of ['0', 'i', 'i + 1', 'u[i]', '', ' ', '1.5', "'A'", '(int) i', 'i < 3', '1 / 0']) {
    yield* [`Affecte la valeur 5 à l’élément "${index}" de t.`,
      `Affecte la valeur 5 à l'élément "${index}" de t.`,
      `Affecte le caractère 'A' à l’élément "${index}" de t.`,
      `Affecte à l’élément "${index}" de t le résultat numérique de "a + 1".`,
      `Affiche l’élément "${index}" de t.`];
  }
  yield* ['Déclare un tableau.', 'Déclare un tableau de type int nommé t.',
    'Déclare un tableau de type nommé t de dimension 3.',
    'Déclare un tableau de type int nommé int de dimension 3.',
    'Déclare un tableau de type int nommé t de dimension 3 = {1, 2, 3}.',
    'Affiche l’élément.', 'Affiche l’élément de t.', 'Affiche l’élément "0 de t.',
    'Affiche l’élément "0" t.', 'Affiche l’élément "0" de.', 'Affiche l’élément "0" de t encore.',
    'Affecte la valeur x à l’élément "0" de t.', 'Affecte à l’élément "0" de t le résultat de "1".',
    "Affecte le caractère 'ab' à l’élément \"0\" de t.", "Affecte le caractère ' ' à l’élément \"0\" de t.",
    'Affecte le tableau u à t.', 'Affiche la chaîne t.', 'Affiche l’element "0" de t.'];
  // Lot 16 surface.
  for (const type of ['char', 'int']) {
    for (const dimension of ['6', '5', '7', '1', '0', 'n']) {
      for (const content in { 'hello': 1, '': 1, 'a': 1 }) {
        yield `Crée un tableau de type ${type} nommé s de dimension ${dimension} avec le texte "${content}".`;
        yield `Déclare un tableau de type ${type} nommé s de dimension ${dimension} avec le texte "${content}".`;
      }
    }
  }
  for (const content of ['hello', '', 'a'+BS+'nb', 'a'+BS+'qb', 'a??=b', 'a"b', 'a'+BS+BS+'b', 'é', 'hello']) {
    yield `Crée un tableau de type char nommé s de dimension 9 avec le texte "${content}".`;
    yield `Affiche le texte "${content}".`;
  }
  for (const name of NAMES) {
    yield* [`Affiche la chaîne ${name}.`, `Affiche le caractère de l’élément "0" de ${name}.`,
      `Affiche le caractère de l'élément "i" de ${name}.`];
  }
  for (const literal of ["'"+BS+"0'", "'A'", "' '"]) {
    yield* [`Crée un caractère nommé c de valeur ${literal}.`, `Affecte le caractère ${literal} à c.`,
      `Affecte le caractère ${literal} à l’élément "0" de s.`,
      `Crée un bloc si "s[i] != ${literal}".`, `Crée une boucle tant que "s[i] != ${literal}".`,
      `Affecte à n le résultat numérique de ${JSON.stringify(literal)}.`];
  }
  yield* ['Crée un tableau de type char nommé s de dimension 6.',
    'Crée un tableau de type char nommé s avec le texte "a".',
    'Crée un tableau de type char nommé s de dimension 6 avec le texte hello.',
    'Crée un tableau de type char nommé s de dimension 6 avec le texte.',
    'Crée un tableau de type char nommé s de dimension 6 avec le texte "hello.',
    'Affiche la chaîne.', 'Affiche la chaîne 1s.', 'Affiche la chaîne s encore.',
    'Affiche la chaine s.', 'Affiche le caractère de l’élément.',
    'Affiche le caractère de l’élément "0".', 'Affiche le tableau t.',
    'Déclare une chaîne nommée s.', 'Inclue la bibliothèque string.h.'];
  // Lot 17 surface.
  for (const type of [...TYPES, 'unsigned char', 'void', '']) {
    for (const name of ['p', 'int', '1p', '']) {
      yield `Déclare un pointeur de type ${type} nommé ${name}.`;
      yield `Crée un pointeur de type ${type} nommé ${name} avec l’adresse de x.`;
    }
  }
  for (const name of NAMES) {
    yield* [`Déclare un pointeur de type int nommé ${name}.`,
      `Affecte l’adresse de ${name} à p.`, `Affecte l'adresse de ${name} à p.`,
      `Affiche la valeur pointée par ${name}.`,
      `Affecte la valeur 5 à la valeur pointée par ${name}.`,
      `Affecte à la valeur pointée par ${name} le résultat numérique de "a + 1".`];
  }
  yield* ['Déclare un pointeur.', 'Déclare un pointeur de type int nommé.',
    'Déclare un pointeur de type nommé p.', 'Déclare un pointeur nommé p.',
    'Déclare un pointeur de type int * nommé p.', 'Déclare un pointeur de pointeur de type int nommé p.',
    'Crée un pointeur de type int nommé p.', 'Crée un pointeur de type int nommé p avec l’adresse.',
    'Crée un pointeur de type int nommé p avec l’adresse de.',
    'Affecte l’adresse de x à.', 'Affecte l’adresse à p.', 'Affecte l’adresse.',
    'Affiche la valeur pointée par.', 'Affiche la valeur pointee par p.',
    'Affiche la valeur pointée par p encore.', 'Affiche la valeur pointée.',
    'Affecte la valeur 5 à la valeur pointée par.', 'Affecte la valeur x à la valeur pointée par p.',
    'Affecte à la valeur pointée par p le résultat de "a".',
    'Affecte à la valeur pointée par p le résultat numérique de.',
    'Inclue la bibliothèque stddef.h.', 'Affecte à p le résultat numérique de "NULL".',
    'Crée une fonction nommée f qui retourne un pointeur de type int.'];
  // Lot 19 surface.
  for (const expression of ['jour', '5', 'jour + 1', '1.5', 'a > 0', "'A'", 't[i]', '*p', '']) {
    yield `Crée un aiguillage sur "${expression}".`;
  }
  for (const value of ['5', '0', '-1', '+1', '1.5', '007', '0x10', 'n', 'MAX', '']) {
    yield `Ajoute un cas pour la valeur ${value}.`;
  }
  for (const literal of ["'A'", "' '", "'" + BS + "0'", "'ab'", "''", 'A']) {
    yield `Ajoute un cas pour le caractère ${literal}.`;
  }
  yield* ['Ajoute le cas par défaut.', 'Sors de l’aiguillage.', "Sors de l'aiguillage.",
    'Ajoute un cas pour.', 'Ajoute un cas sur la valeur 5.', 'Ajoute le cas par defaut.',
    'Crée un aiguillage.', 'Crée un aiguillage sur jour.', 'Sors de l’aiguillage maintenant.',
    'Sors de la boucle la plus intérieure.'];
  // Lot 20 surface.
  for (const tag of ['Point', '1Point', 'struct', '']) {
    yield `Déclare une structure nommée ${tag}.`;
    yield `Déclare une variable de type structure ${tag} nommée p.`;
    yield `Déclare un pointeur de type structure ${tag} nommé q.`;
  }
  for (const type of [...TYPES, 'structure Point', 'unsigned char', '']) {
    yield `Ajoute un champ de type ${type} nommé v.`;
    // Lot 27 : la dimension optionnelle d'un champ, avec les formes valides et
    // les formes fautives, pour que le corpus couvre la capacité nouvelle.
    for (const dimension of ['32', '1', '0', '-1', '01', '3.5', 'n', '', '32 et plus']) {
      yield `Ajoute un champ de type ${type} nommé v de dimension ${dimension}.`;
    }
    yield `Ajoute un champ de type ${type} nommé v de taille 3.`;
    yield `Ajoute un champ pointeur de type ${type} nommé v de dimension 10.`;
  }
  for (const target of ['x de p', 'x pointé par q', 'x pointée par q', 'x de 1p', '1x de p', 'x', 'x de', 'x dans p']) {
    yield `Affecte la valeur 5 au champ ${target}.`;
    yield `Affiche le champ ${target}.`;
    yield `Affecte au champ ${target} le résultat numérique de "a + 1".`;
  }
  yield* ['Déclare une structure Point.', 'Ajoute un champ int nommé x.',
    'Déclare un type nommé Point.', 'Déclare une énumération nommée Couleur.',
    'Déclare une union nommée Valeur.', 'Affecte la structure q à p.'];
  // Lot 21 surface.
  for (const header of ['stdio.h', 'stdlib.h', 'string.h', 'stddef.h', 'stdlib', 'math.h']) {
    yield `Inclue la bibliothèque ${header}.`;
  }
  for (const type of [...TYPES, 'structure Point', 'unsigned char', '']) {
    yield* [`Affiche la taille du type ${type}.`, `Affiche la taille de type ${type}.`,
      `Affecte à n la taille du type ${type}.`,
      `Affecte à p l’allocation de 4 éléments de type ${type}.`,
      `Affecte à q la réallocation de p pour 8 éléments de type ${type}.`];
  }
  for (const count of ['1', '10', '0', '-1', '1.5', '007', 'n', '']) {
    yield `Affecte à p l’allocation de ${count} éléments de type int.`;
    yield `Affecte à p l’allocation de ${count} élément de type int.`;
  }
  yield* ['Libère la mémoire pointée par p.', 'Libère la mémoire de p.', 'Libère p.',
    'Libère la mémoire pointée par.', 'Affiche la taille.', 'Affiche la taille du type.',
    'Affecte à p l’allocation de 10 objets de type int.', 'Appelle calloc avec "10" et "4".',
    'Crée un bloc si "p == NULL".'];
  // Lot 22 surface.
  for (const mode of ['lecture', 'écriture', 'ajout', 'lecture binaire', 'écriture binaire',
    'ajout binaire', 'mise à jour', 'texte', '']) {
    yield `Affecte à f l’ouverture du fichier "d.txt" en ${mode}.`;
  }
  for (const path of ['d.txt', '', 'a b c', 'a' + BS + 'nb', 'a' + BS + 'qb', 'a??=b']) {
    yield `Affecte à f l’ouverture du fichier "${path}" en lecture.`;
    yield `Écris le texte "${path}" dans le fichier f.`;
  }
  for (const name of ['f', '1f', 'int', '']) {
    yield* [`Déclare un fichier nommé ${name}.`, `Ferme le fichier ${name}.`,
      `Écris la valeur de x dans le fichier ${name}.`,
      `Lis un entier depuis le fichier ${name} dans x.`,
      `Crée un bloc si la fin du fichier ${name} est atteinte.`];
  }
  yield* ['Déclare un fichier f.', 'Ferme le fichier.', 'Lis un entier du fichier f dans x.',
    'Lis une ligne depuis le fichier f dans s.', 'Vide le tampon du fichier f.',
    'Crée un bloc si la fin du fichier f est atteint.', 'Crée un bloc si "f == NULL".',
    'Crée un bloc si a > 0.', 'Crée un bloc si.', 'Crée un bloc si "a > 0" encore.'];
  // Lot 23 surface.
  for (const path of ['calcul.h', 'sous/d.h', 'mon dossier/c.h', '', 'a"b.h', 'a<b.h']) {
    yield `Inclue l’en-tête "${path}".`;
  }
  yield* ['Inclue l’en-tête calcul.h.', "Inclue l'en-tête \"calcul.h\".", 'Inclue l’en-tête.',
    'Inclue la bibliothèque "calcul.h".'];
  for (const macro of ['CALCUL_H', 'H', 'calcul_h', '1H', '_H', '']) {
    yield `Ouvre la protection d’en-tête nommée ${macro}.`;
  }
  yield* ['Ferme la protection d’en-tête.', 'Ferme la protection.', 'Ouvre la protection d’en-tête.',
    "Ferme la protection d'en-tête."];
  for (const tail of ['qui retourne un int', 'qui ne retourne rien', 'qui retourne un long',
    'qui retourne un int et prend un int nommé a', 'qui retourne un int et prend un int nommé a et un int nommé a', '']) {
    yield `Déclare le prototype d’une fonction nommée f ${tail}.`;
    yield `Déclare le prototype d’une fonction interne nommée f ${tail}.`;
    yield `Crée une fonction nommée f ${tail}.`;
  }
  for (const linkage of ['externe', 'interne', 'publique']) {
    for (const type of [...TYPES, '']) yield `Déclare la variable ${linkage} de type ${type} nommée v.`;
  }
  yield* ['Définis la constante TAILLE à 10.', 'Déclare un type nommé Entier.', 'Compile le fichier calcul.c.'];
  // Lot 24 surface.
  for (const tag of ['Noeud', '1N', '']) {
    yield* [`Déclare le synonyme ${tag} pour la structure Noeud.`,
      `Déclare le synonyme Noeud pour la structure ${tag}.`,
      `Déclare un tableau de type structure ${tag} nommé t de dimension 3.`,
      `Ajoute un champ pointeur de type structure ${tag} nommé suivant.`];
  }
  for (const type of [...TYPES, 'structure Point', 'unsigned char', '']) {
    yield `Ajoute un champ pointeur de type ${type} nommé p.`;
  }
  yield* ['Déclare le synonyme Entier pour le type int.', 'Déclare le synonyme.',
    'Déclare un tableau de pointeurs de type int nommé t de dimension 3.',
    'Ajoute un champ pointeur pointeur de type int nommé p.',
    'Crée un tableau de type structure Point nommé t de dimension 2 avec le texte "a".',
    'Échange les éléments "i" et "j" de t.', 'Trie le tableau t.'];
  // Lot 25 surface.
  for (const header of ['assert.h', 'limits.h', 'float.h', 'stddef.h', 'string.h']) {
    yield `Inclue la bibliothèque ${header}.`;
  }
  for (const condition of ['x > 0', 'p != 0 && n > 0', '!fini', 'x = 0', 'a == b == c', 'a & b', '0', '', '1int']) {
    yield `Vérifie que "${condition}".`;
  }
  yield* ['Vérifie que.', 'Vérifie que x > 0.', 'Vérifie "x > 0".', 'Vérifie que "x > 0" encore.'];
  for (const type of [...TYPES, '']) {
    yield `Déclare une constante de type ${type} nommée C avec le résultat de "1".`;
  }
  yield* ['Déclare une constante de type int nommée MAX.', 'Déclare une constante nommée MAX avec le résultat de "1".',
    'Déclare une constante de type int nommée MAX de valeur "1".',
    'Affiche la limite maximale du type int.', 'Affiche la limite minimale du type int.',
    'Écris un test de la fonction somme.', 'Active le débogage.', 'Mesure le temps de la fonction somme.'];
  for (const digits of ['0', '2', '17', '99', 'x']) {
    yield `Affiche x en notation fixe avec ${digits} décimales.`;
    yield `Affiche x en notation scientifique avec ${digits} décimales.`;
  }
}

for (const sentence of sentences()) {
  record('translate', sentence, snapshot(() => before.translate.translate(sentence)), snapshot(() => after.translate.translate(sentence)));
  // Advisories and pedagogy read the parsed trees, so they expose structural
  // drift that a rendered fragment could hide.
  record('analyzeCalculations', sentence,
    snapshot(() => before.advisories.analyzeCalculations(before.translate.translate(sentence))),
    snapshot(() => after.advisories.analyzeCalculations(after.translate.translate(sentence))));
  record('explainInstruction', sentence,
    snapshot(() => before.pedagogy.explainInstruction(before.translate.translate(sentence))),
    snapshot(() => after.pedagogy.explainInstruction(after.translate.translate(sentence))));
}

const DOCUMENTS = ['', '\n', '\n\n', 'int age;\n\n', '#include <stdio.h>\n\n',
  'int main(void) {\n\n}\n', 'int main(void) {\n  \n}\n', 'int main(void) {\n}\n\n',
  'if (a) {\n\n}\n', 'while (a) {\n\n}\n', 'do {\n\n} while (a);\n\n',
  'for (i = 0; i < 3; i = (i + 1)) {\n\n}\n', 'int somme(int a, int b) {\n\n}\n\n',
  '} } {\n', '/* { */\n\n', '"{"\n\n', "'{'\n\n", 'int t[3];\n\n', 'char s[6] = "hello";\n\n',
  'int* p;\n\n', 'void f(int t[], int n) {\n\n}\n\n', 'int a;\r\nint b;\r\n\r\n'];
const PLACED = ['Déclare un caractère nommé c.', "Affecte le caractère ' ' à c.",
  'Affiche le caractère c.', 'Crée un entier nommé age de valeur 20.', 'Crée la fonction principale.',
  'Crée un bloc si "a < 3".', 'Ajoute une branche sinon.', 'Sors de la boucle la plus intérieure.',
  'Retourne la valeur 0.', 'Crée une fonction nommée f qui retourne un int.',
  'Affecte à x le résultat de "a + b".', 'Crée une boucle tant que "i < 3".',
  'Déclare un tableau de type int nommé t de dimension 3.',
  'Affecte la valeur 5 à l’élément "0" de t.', 'Affiche l’élément "i" de t.',
  'Affecte à l’élément "i" de t le résultat numérique de "a + 1".',
  'Crée un bloc si "t[i] > 0".',
  'Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".',
  'Affiche la chaîne s.', 'Affiche le caractère de l’élément "i" de s.',
  `Crée une boucle tant que "s[i] != '${BS}0'".`,
  'Déclare un pointeur de type int nommé p.', 'Affecte l’adresse de x à p.',
  'Affecte la valeur 5 à la valeur pointée par p.', 'Affiche la valeur pointée par p.',
  'Affecte à n le résultat numérique de "*p + 1".',
  'Affecte à n le résultat numérique de "*(t + i)".',
  'Crée un bloc si "*(t + i) > 0".',
  'Crée un aiguillage sur "jour".', 'Ajoute un cas pour la valeur 1.',
  'Déclare une structure nommée Point.', 'Ajoute un champ de type int nommé x.',
  'Affiche le champ x de p.', 'Affecte à n le résultat numérique de "q->x".',
  'Inclue la bibliothèque stdlib.h.', 'Affecte à p l’allocation de 4 éléments de type int.',
  'Libère la mémoire pointée par p.', 'Affiche la taille du type int.',
  'Déclare un fichier nommé f.', 'Ferme le fichier f.',
  'Affecte à f l’ouverture du fichier "d.txt" en lecture.',
  'Crée un bloc si la fin du fichier f est atteinte.',
  'Inclue l’en-tête "calcul.h".', 'Ouvre la protection d’en-tête nommée H.',
  'Ferme la protection d’en-tête.', 'Déclare la variable externe de type int nommée v.',
  'Déclare le prototype d’une fonction nommée f qui retourne un int.',
  'Déclare le synonyme Noeud pour la structure Noeud.',
  'Ajoute un champ pointeur de type structure Noeud nommé suivant.',
  'Déclare un tableau de type structure Point nommé t de dimension 10.',
  'Inclue la bibliothèque assert.h.', 'Vérifie que "x > 0".',
  'Déclare une constante de type int nommée MAX avec le résultat de "100".',
  'Ajoute le cas par défaut.', 'Sors de l’aiguillage.'];

for (const text of DOCUMENTS) {
  for (const offset of new Set([0, text.length, Math.max(0, text.length - 1), Math.floor(text.length / 2)])) {
    for (const sentence of PLACED) {
      const run = (side) => {
        const translation = side.translate.translate(sentence);
        if (translation.status !== 'translated') return { translation };
        return { translation, plan: side.placement.planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset: offset, translation }) };
      };
      record('planPlacement', `${JSON.stringify(text)} @${offset} — ${sentence}`, snapshot(() => run(before)), snapshot(() => run(after)));
    }
  }
}

rmSync(extracted, { recursive: true, force: true });
console.log(`référence comparée     : ${reference}`);
console.log(`comparaisons           : ${checked}`);
if (extensions) console.log(`extensions approuvées  : ${approved.length}  (motif /${extensions.source}/)`);
console.log(`régressions            : ${divergences.length}`);
const unexplained = noLoss ? approved.filter(entry => accepted.test(entry.before)) : [];
if (noLoss) console.log(`capacités perdues      : ${unexplained.length}  (extensions dont l’entrée était acceptée avant)`);
for (const entry of unexplained.slice(0, 10)) console.log('PERTE ' + JSON.stringify(entry).slice(0, 1500));
for (const divergence of divergences.slice(0, 10)) console.log('RÉGRESSION ' + JSON.stringify(divergence).slice(0, 1500));
for (const extension of approved.slice(0, 6)) console.log('extension  ' + JSON.stringify(extension).slice(0, 600));
// --all lists every divergent input, so an extension pattern can be audited
// rather than trusted: a pattern that swallows a real regression is visible.
if (process.argv.includes('--all')) {
  for (const [label, list] of [['RÉGRESSION', divergences], ['PERTE', unexplained], ['extension', approved]]) {
    for (const entry of list) console.log(`${label}\t${entry.stage}\t${JSON.stringify(entry.input)}`);
  }
}
process.exit(divergences.length || unexplained.length ? 1 : 0);
