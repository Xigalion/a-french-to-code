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
function record(stage, input, a, b) {
  checked++;
  if (a === b) return;
  divergences.push(divergences.length < 10 ? { stage, input, before: a, after: b } : { stage, input });
}

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
  for (const text of ['Bonjour\\n', 'a\\"b', 'a\\\\b', 'a\\tb', 'a\\qb', '']) yield `Affiche le texte "${text}".`;
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
const PLACED = ['Crée un entier nommé age de valeur 20.', 'Crée la fonction principale.',
  'Crée un bloc si "a < 3".', 'Ajoute une branche sinon.', 'Sors de la boucle la plus intérieure.',
  'Retourne la valeur 0.', 'Crée une fonction nommée f qui retourne un int.',
  'Affecte à x le résultat de "a + b".', 'Crée une boucle tant que "i < 3".'];

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
console.log(`référence comparée : ${reference}`);
console.log(`comparaisons       : ${checked}`);
console.log(`divergences        : ${divergences.length}`);
for (const divergence of divergences.slice(0, 10)) console.log(JSON.stringify(divergence).slice(0, 1500));
process.exit(divergences.length ? 1 : 0);
