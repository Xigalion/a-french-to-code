import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';

// Lots 30 et 31 — les lacunes démontrées par les campagnes 1 à 3, et rien
// d'autre. Chaque section nomme la lacune qu'elle ferme.

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', source + ' : ' + JSON.stringify(result));
  assert.deepEqual(result, translate(source));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  return result;
}
function refused(source, code) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', source + ' : ' + JSON.stringify(result));
  assert.ok(!('fragments' in result), 'aucun fragment partiel');
  assert.equal(result.diagnostics[0].code, code, source + ' : ' + JSON.stringify(result.diagnostics[0]));
  return result.diagnostics[0];
}
const Q = "'";
const CORPS = 'int main(void) {\n';
function placed(text, source) {
  return planPlacement({ document: { id: 'g.c', revision: 0, text }, cursorOffset: text.length,
    translation: translated(source) });
}

// ---------------------------------------------------------------------------
// 1. Lot 30 — MEMBER_ASSIGN_CHAR : un genre déclaré que rien n'atteignait
// ---------------------------------------------------------------------------

for (const [source, code] of [
  [`Affecte le caractère ${Q}A${Q} au champ initiale de e.`, "e.initiale = 'A';\n"],
  [`Affecte le caractère ${Q}A${Q} au champ initiale pointé par p.`, "p->initiale = 'A';\n"],
  [`Affecte le caractère ${Q} ${Q} au champ separateur de ligne.`, "ligne.separateur = ' ';\n"],
  [`Affecte le caractère ${Q}\\n${Q} au champ fin de ligne.`, "ligne.fin = '\\n';\n"],
  [`Affecte le caractère ${Q}\\0${Q} au champ fin pointé par q.`, "q->fin = '\\0';\n"],
]) {
  test(`lot 30 rendu : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, 'MEMBER_ASSIGN_CHAR');
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].comment, '// ' + source);
  });
}

test('lot 30 : le littéral est lu dans la source, pas dans les jetons', () => {
  // « ' ' » contient une espace : une lecture par jetons le couperait en deux.
  // C'est la raison du détour par les offsets, et ce test la fixe.
  const result = translated(`Affecte le caractère ${Q} ${Q} au champ c de s.`);
  assert.equal(result.instruction.parameters.literal, `${Q} ${Q}`);
  const range = result.instruction.parameters.literalRange;
  assert.equal(result.source.text.slice(range.start, range.end), `${Q} ${Q}`);
});

test('lot 30 : les formulations voisines sont intactes', () => {
  assert.equal(translated(`Affecte le caractère ${Q}A${Q} à c.`).instruction.kind, 'ASSIGN_CHAR');
  assert.equal(translated(`Affecte le caractère ${Q}A${Q} à l’élément "0" de t.`).instruction.kind, 'ARRAY_ASSIGN_CHAR');
  assert.equal(translated('Affecte la valeur 5 au champ x de p.').instruction.kind, 'MEMBER_ASSIGN_INT');
  assert.equal(translated('Affecte au champ x de p le résultat numérique de "a + 1".').instruction.kind,
    'MEMBER_ASSIGN_EXPRESSION');
});

test('lot 30 : les refus de cette formulation sont précis', () => {
  refused(`Affecte le caractère ${Q}AB${Q} au champ c de s.`, 'INVALID_CHARACTER');
  refused('Affecte le caractère au champ c de s.', 'MISSING_CHARACTER_DELIMITER');
  refused(`Affecte le caractère ${Q}A${Q} au champ de s.`, 'UNKNOWN_FORMULATION');
  refused(`Affecte le caractère ${Q}A${Q} au champ c de s et plus.`, 'UNEXPECTED_TEXT');
});

test('lot 30 : les informations sont celles des autres accès de membre', () => {
  const codes = explainInstruction(translated(`Affecte le caractère ${Q}A${Q} au champ initiale de e.`))
    .map(item => item.code);
  assert.deepEqual(codes, ['MEMBER_ACCESS_FORM', 'MEMBER_NOT_CHECKED']);
});

// ---------------------------------------------------------------------------
// 2. Lot 30 — arithmétique de pointeur : dite, pas vérifiée
// ---------------------------------------------------------------------------

test('lot 30 : l’absence d’arithmétique de pointeur est dite à la déclaration', () => {
  for (const source of ['Déclare un pointeur de type int nommé p.',
    'Crée un pointeur de type int nommé p avec l’adresse de x.',
    'Affecte l’adresse de x à p.']) {
    const items = explainInstruction(translated(source));
    const arithmetic = items.find(item => item.code === 'POINTER_ARITHMETIC_ABSENT');
    assert.ok(arithmetic, source);
    assert.equal(arithmetic.severity, 'information');
    assert.match(arithmetic.message, /\*\(nom \+ décalage entier\)/u);
    assert.match(arithmetic.message, /n’analyse aucune mémoire et ne signale rien/u);
    assert.match(arithmetic.message, /Ni « p - q », ni « \+\+ », ni « -- » n’existent/u);
  }
});

test('lot 30 : l’information ne simule aucune vérification mémoire', () => {
  const message = explainInstruction(translated('Déclare un pointeur de type int nommé p.'))
    .find(item => item.code === 'POINTER_ARITHMETIC_ABSENT').message;
  // Elle dit ce qui n'est PAS fait ; elle ne prétend rien détecter.
  assert.ok(!/détect|vérifié|analysé|contrôlé/iu.test(message.replace('n’analyse aucune mémoire', '')), message);
});

test('lot 30 : les calculs sur un pointeur restent acceptés sans avertissement', () => {
  // La lacune n'est PAS refermée, et ce test le dit : C-A est sans état, il
  // ne sait pas qu'un nom désigne un pointeur dans une expression.
  for (const source of ['Affecte à p le résultat numérique de "p + 1".',
    'Affecte à n le résultat numérique de "p - q".']) {
    const result = translated(source);
    assert.equal(result.diagnostics.length, 0, source);
    assert.deepEqual(explainInstruction(result), [], source);
  }
});

// ---------------------------------------------------------------------------
// 3. Lot 31 — définition de fonction interne : l'asymétrie du lot 23
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Crée une fonction interne nommée aide qui retourne un int.', 'static int aide(void) {\n    \n}\n'],
  ['Crée une fonction interne nommée aide qui ne retourne rien.', 'static void aide(void) {\n    \n}\n'],
  ['Crée une fonction interne nommée somme qui retourne un int et prend un int nommé a et un int nommé b.',
    'static int somme(int a, int b) {\n    \n}\n'],
  ['Crée une fonction interne nommée mesure qui retourne un double et prend un char nommé c.',
    'static double mesure(char c) {\n    \n}\n'],
]) {
  test(`lot 31 rendu : ${source.slice(0, 64)}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, 'FUNC_DEF');
    assert.equal(result.instruction.parameters.internal, true);
    assert.equal(result.fragments[0].code, code);
  });
}

test('lot 31 : la définition publique est inchangée', () => {
  const result = translated('Crée une fonction nommée aide qui retourne un int.');
  assert.equal(result.fragments[0].code, 'int aide(void) {\n    \n}\n');
  assert.equal(result.instruction.parameters.internal, false);
  // Et « Crée la fonction principale. » reste un genre à part.
  assert.equal(translated('Crée la fonction principale.').instruction.kind, 'MAIN');
});

test('lot 31 : prototype et définition internes s’accordent mot pour mot', () => {
  const tail = 'nommée aide qui retourne un int et prend un int nommé n.';
  const prototype = translated(`Déclare le prototype d’une fonction interne ${tail}`);
  const definition = translated(`Crée une fonction interne ${tail}`);
  assert.equal(prototype.fragments[0].code, 'static int aide(int n);\n');
  assert.equal(definition.fragments[0].code, 'static int aide(int n) {\n    \n}\n');
  // Même queue de phrase, donc mêmes paramètres — sauf les plages, qui
  // dépendent de la longueur de la phrase et diffèrent nécessairement.
  const sansPlages = ({ returnType, name, params, internal }) =>
    ({ returnType, name, internal, params: params.map(({ type, name: n }) => ({ type, name: n })) });
  assert.deepEqual(sansPlages(definition.instruction.parameters), sansPlages(prototype.instruction.parameters));
});

test('lot 31 : la définition interne émet INTERNAL_LINKAGE', () => {
  const codes = explainInstruction(translated('Crée une fonction interne nommée aide qui retourne un int.'))
    .map(item => item.code);
  assert.ok(codes.includes('INTERNAL_LINKAGE'), codes.join(', '));
});

test('lot 31 : une définition interne reste à la portée fichier', () => {
  assert.equal(placed('', 'Crée une fonction interne nommée aide qui retourne un int.').status, 'planned');
  const nested = placed(CORPS, 'Crée une fonction interne nommée aide qui retourne un int.');
  assert.equal(nested.status, 'rejected');
  assert.equal(nested.diagnostics[0].code, 'FUNCTION_DEFINITION_NESTED');
});

test('lot 31 : « interne » sans nom est refusé', () => {
  refused('Crée une fonction interne qui retourne un int.', 'UNKNOWN_FORMULATION');
  // Le moteur refuse sur « qui », là où le nom était attendu : plus précis
  // qu'un identifiant invalide, puisqu'il n'y a pas d'identifiant du tout.
  refused('Crée une fonction interne nommée qui retourne un int.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 4. Lot 31 — lecture de chaîne bornée : la borne est écrite, pas déduite
// ---------------------------------------------------------------------------

test('lot 31 rendu : lecture de chaîne bornée', () => {
  const result = translated('Lis une chaîne de dimension 32 depuis le fichier f dans s.');
  assert.equal(result.instruction.kind, 'FILE_READ_STRING');
  assert.equal(result.fragments[0].code, 'fgets(s, 32, f);\n');
  assert.equal(result.instruction.parameters.dimension, '32');
});

test('lot 31 : la grammaire de la dimension est celle des lots 15 et 27', () => {
  for (const bad of ['0', '-1', '01', '3.5', 'n', 'trente']) {
    refused(`Lis une chaîne de dimension ${bad} depuis le fichier f dans s.`, 'INVALID_ARRAY_DIMENSION');
  }
  refused('Lis une chaîne de dimension depuis le fichier f dans s.', 'INVALID_ARRAY_DIMENSION');
  refused('Lis une chaîne depuis le fichier f dans s.', 'UNKNOWN_FORMULATION');
  refused('Lis une chaîne de dimension 32 depuis le fichier f dans s et plus.', 'UNEXPECTED_TEXT');
});

test('lot 31 : la lecture d’entier est intacte', () => {
  const result = translated('Lis un entier depuis le fichier f dans x.');
  assert.equal(result.instruction.kind, 'FILE_READ_INT');
  assert.equal(result.fragments[0].code, 'fscanf(f, "%d", &x);\n');
});

test('lot 31 : deux informations, et la borne n’est pas présentée comme vérifiée', () => {
  const items = explainInstruction(translated('Lis une chaîne de dimension 32 depuis le fichier f dans s.'));
  assert.deepEqual(items.map(item => item.code), ['FGETS_KEEPS_NEWLINE', 'FGETS_BOUND_NOT_CHECKED']);
  for (const item of items) assert.equal(item.severity, 'information');
  assert.match(items[0].message, /conserve le retour à la ligne/u);
  assert.match(items[0].message, /renvoie NULL en fin de fichier/u);
  assert.match(items[1].message, /ne connaît pas la dimension du tableau de destination/u);
  assert.match(items[1].message, /une borne trop grande déborde, et rien ne le signale/u);
  // L'information porte sur le nombre écrit.
  const source = 'Lis une chaîne de dimension 32 depuis le fichier f dans s.';
  assert.deepEqual(items[1].range, { start: source.indexOf('32'), end: source.indexOf('32') + 2 });
});

test('lot 31 : rien ne relie la borne à la dimension déclarée du tableau', () => {
  // Le point essentiel : C-A accepte une borne qui déborde, parce qu'il ne
  // retient aucune dimension. Une forme acceptée ne garantit rien.
  assert.equal(translate('Déclare un tableau de type char nommé s de dimension 8.').status, 'translated');
  assert.equal(translate('Lis une chaîne de dimension 9999 depuis le fichier f dans s.').status, 'translated');
});

test('lot 31 : une lecture de chaîne est une instruction, donc hors portée fichier', () => {
  const source = 'Lis une chaîne de dimension 32 depuis le fichier f dans s.';
  const refus = placed('', source);
  assert.equal(refus.status, 'rejected');
  assert.equal(refus.diagnostics[0].code, 'STATEMENT_AT_FILE_SCOPE');
  assert.equal(placed(CORPS, source).status, 'planned');
});
