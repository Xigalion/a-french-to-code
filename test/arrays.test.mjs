import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression, parseIndexExpression } from '../src/numericExpression.ts';
import { parseCondition } from '../src/condition.ts';
import { MAX_EXPRESSION_TOKENS } from '../src/expressionCore.ts';

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', `${source} aurait dû être traduite : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', `${source} aurait dû être refusée`);
  assert.equal(result.diagnostics[0].code, code, source);
  if (range) assert.deepEqual(result.diagnostics[0].range, range, source);
  return result.diagnostics[0];
}
const PROFILES = [['numérique', parseNumericExpression], ['condition', parseCondition]];
function parsed(parse, source) {
  const result = parse(source, 0, source.length, () => undefined);
  assert.equal(result.status, 'parsed', `${source} aurait dû être analysée : `
    + (result.status === 'rejected' ? result.diagnostic.code : ''));
  return result;
}

// ---------------------------------------------------------------------------
// 1. Les cinq formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Déclare un tableau de type int nommé t de dimension 10.', 'int t[10];\n', 'ARRAY_DECL'],
  ['Affecte la valeur 5 à l’élément "0" de t.', 't[0] = 5;\n', 'ARRAY_ASSIGN_INT'],
  ["Affecte le caractère 'A' à l’élément \"0\" de t.", "t[0] = 'A';\n", 'ARRAY_ASSIGN_CHAR'],
  ['Affecte à l’élément "i" de t le résultat numérique de "a + 1".', 't[i] = (a + 1);\n', 'ARRAY_ASSIGN_EXPRESSION'],
  ['Affiche l’élément "0" de t.', 'printf("%d", t[0]);\n', 'ARRAY_PRINT'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 15 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].comment, `// ${source}`);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    // Simple instructions: no block, no cursor placed inside.
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 15 sortie exacte sans point final : ${source}`, () => {
    const without = source.slice(0, -1);
    assert.equal(translated(without).fragments[0].text, `// ${without}\n${code}`);
  });
}

test('les deux apostrophes désignent le même élément', () => {
  const typographic = translated('Affiche l’élément "0" de t');
  const typewriter = translated("Affiche l'élément \"0\" de t");
  assert.equal(typographic.fragments[0].code, typewriter.fragments[0].code);
  // The sentence itself is preserved exactly as typed, never normalized.
  assert.ok(typewriter.fragments[0].comment.includes("l'élément"));
});

test('la casse des mots fixes est libre, les accents sont exigés', () => {
  assert.equal(translated('DÉCLARE UN TABLEAU DE TYPE INT NOMMÉ t DE DIMENSION 3.').fragments[0].code, 'int t[3];\n');
  refused('Declare un tableau de type int nommé t de dimension 3.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. Types et dimensions
// ---------------------------------------------------------------------------

for (const [type, code] of [['int', 'int t[3];\n'], ['unsigned int', 'unsigned int t[3];\n'],
  ['float', 'float t[3];\n'], ['double', 'double t[3];\n'], ['char', 'char t[3];\n']]) {
  test(`tableau de type ${type}`, () => {
    assert.equal(translated(`Déclare un tableau de type ${type} nommé t de dimension 3.`).fragments[0].code, code);
  });
}
for (const type of ['long', 'short', 'unsigned char', 'signed char', 'void', 'long double', 'signed int']) {
  test(`type de tableau hors catalogue : ${type}`, () => {
    refused(`Déclare un tableau de type ${type} nommé t de dimension 3.`, 'UNSUPPORTED_NUMERIC_TYPE');
  });
}
for (const dimension of ['0', '-3', '+3', 'n', '3.5', '03', '0x10', 'trois']) {
  test(`dimension refusée : ${JSON.stringify(dimension)}`, () => {
    refused(`Déclare un tableau de type int nommé t de dimension ${dimension}.`, 'INVALID_ARRAY_DIMENSION');
  });
}
test('une grande dimension est conservée exactement, sans évaluation', () => {
  const size = '4294967296';
  assert.equal(translated(`Déclare un tableau de type int nommé t de dimension ${size}.`).fragments[0].code, `int t[${size}];\n`);
});
test('dimension absente', () => {
  const source = 'Déclare un tableau de type int nommé t.';
  refused(source, 'MISSING_ARRAY_DIMENSION', { start: source.length - 1, end: source.length - 1 });
});
test('type absent', () => {
  refused('Déclare un tableau de type nommé t de dimension 3.', 'MISSING_NUMERIC_TYPE');
});
test('nom de tableau invalide et mot-clé C17', () => {
  refused('Déclare un tableau de type int nommé 1t de dimension 3.', 'INVALID_IDENTIFIER');
  refused('Déclare un tableau de type int nommé int de dimension 3.', 'C_KEYWORD_IDENTIFIER');
});
test('aucune liste d’initialisation n’est ouverte', () => {
  refused('Déclare un tableau de type int nommé t de dimension 3 = {1, 2, 3}.', 'UNEXPECTED_TEXT');
  refused('Affecte à l’élément "0" de t le résultat numérique de "{1, 2}".', 'INVALID_EXPRESSION_TOKEN');
});

// ---------------------------------------------------------------------------
// 3. Indexation dans les expressions
// ---------------------------------------------------------------------------

const INDEXED = [
  ['Affecte à somme le résultat numérique de "somme + t[i]".', 'somme = (somme + t[i]);\n'],
  ['Crée un bloc si "t[i] > 0".', 'if (t[i] > 0) {\n    \n}\n'],
  ['Crée une boucle tant que "t[i] != 0".', 'while (t[i] != 0) {\n    \n}\n'],
  ['Retourne le résultat numérique de "t[0]".', 'return t[0];\n'],
  ['Appelle traiter avec "t[i]".', 'traiter(t[i]);\n'],
  ['Crée une variable de type int nommée v avec le résultat de "t[i + 1]".', 'int v = t[(i + 1)];\n'],
  ['Crée un bloc si "t[u[i]] > 0".', 'if (t[u[i]] > 0) {\n    \n}\n'],
];
for (const [source, code] of INDEXED) {
  test(`indexation en expression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('l’indexation s’attache au nom seul, dans les deux profils ouverts', () => {
  for (const [, parse] of PROFILES) {
    const result = parsed(parse, 't[i]');
    const node = result.expression ?? result.condition.expression;
    assert.equal(node.kind, 'index');
    assert.equal(node.array.kind, 'name');
    assert.equal(node.array.name, 't');
    assert.equal(node.index.kind, 'name');
    // The bracket range is the designation alone, not the whole element.
    assert.deepEqual(node.bracketRange, { start: 1, end: 4 });
    assert.deepEqual(node.range, { start: 0, end: 4 });
  }
});

test('le profil entier n’est pas ouvert : les deux enveloppes qui l’utilisent refusent', () => {
  refused('Affecte à x le résultat de "t[0]".', 'INVALID_EXPRESSION_TOKEN');
  refused('Retourne le résultat de "t[0]".', 'INVALID_EXPRESSION_TOKEN');
  const result = parseExpression('t[0]', 0, 4, () => undefined);
  assert.equal(result.status, 'rejected');
  assert.equal(result.diagnostic.code, 'INVALID_EXPRESSION_TOKEN');
  assert.deepEqual(result.diagnostic.range, { start: 1, end: 2 });
});

// ---------------------------------------------------------------------------
// 4. L’indice est une expression entière, quel que soit le profil englobant
// ---------------------------------------------------------------------------

for (const index of ['0', 'i', 'i + 1', '2 * i', '(i)', '-i', 'i % 3', 'u[i]']) {
  test(`indice accepté : ${JSON.stringify(index)}`, () => {
    for (const [name, parse] of PROFILES) assert.ok(parsed(parse, `t[${index}]`), name);
  });
}
for (const [index, code] of [['1.5', 'INVALID_EXPRESSION_TOKEN'], ['1e3', 'INVALID_EXPRESSION_TOKEN'],
  ['2u', 'INVALID_EXPRESSION_TOKEN'], ['(int) i', 'C_KEYWORD_IDENTIFIER'], ['i < 3', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['i && j', 'UNSUPPORTED_EXPRESSION_OPERATOR'], ['!i', 'UNSUPPORTED_EXPRESSION_OPERATOR'], ["'A'", 'INVALID_EXPRESSION_TOKEN']]) {
  test(`indice refusé : ${JSON.stringify(index)}`, () => {
    for (const [name, parse] of PROFILES) {
      const source = `t[${index}]`;
      const result = parse(source, 0, source.length, token => token.text === 'int'
        ? { code: 'C_KEYWORD_IDENTIFIER', category: 'understanding', severity: 'error', message: 'Mot-clé.', range: token.range }
        : undefined);
      assert.equal(result.status, 'rejected', `${name} / ${source}`);
      assert.equal(result.diagnostic.code, code, `${name} / ${source}`);
    }
  });
}
test('un indice flottant est refusé dans l’enveloppe aussi', () => {
  refused('Affiche l’élément "1.5" de t.', 'INVALID_EXPRESSION_TOKEN');
  refused('Affiche l’élément "(double) i" de t.', 'C_KEYWORD_IDENTIFIER');
});

// ---------------------------------------------------------------------------
// 5. Diagnostics de l’indexation, avec plages UTF-16
// ---------------------------------------------------------------------------

for (const [expression, code, start, end] of [
  ['t[]', 'MISSING_INDEX', 2, 2],
  ['t[ ]', 'MISSING_INDEX', 3, 3],
  ['t[0', 'MISSING_CLOSING_BRACKET', 3, 3],
  ['t[0 + ', 'MISSING_OPERAND', 6, 6],
  ['t[i][j]', 'UNSUPPORTED_ARRAY_DIMENSIONS', 4, 5],
  ['t[i] [j]', 'UNSUPPORTED_ARRAY_DIMENSIONS', 5, 6],
  ['t[i j]', 'MISSING_OPERATOR', 4, 4],
  ['1[t]', 'INVALID_EXPRESSION_TOKEN', 1, 2],
  ['(a + b)[0]', 'INVALID_EXPRESSION_TOKEN', 7, 8],
  ['t]', 'INVALID_EXPRESSION_TOKEN', 1, 2],
]) {
  test(`diagnostic d’indexation ${JSON.stringify(expression)}`, () => {
    for (const [name, parse] of PROFILES) {
      const result = parse(expression, 0, expression.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${expression}`);
      assert.equal(result.diagnostic.code, code, `${name} / ${expression}`);
      assert.deepEqual(result.diagnostic.range, { start, end }, `${name} / ${expression}`);
    }
  });
}

test('les plages sont absolues dans la phrase d’origine', () => {
  const source = 'Crée un bloc si "t[i][j] > 0".';
  const diagnostic = refused(source, 'UNSUPPORTED_ARRAY_DIMENSIONS');
  assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), '[');
  assert.equal(diagnostic.range.start, source.indexOf('[j]'));
});

for (const [source, code] of [
  ['Affiche l’élément de t.', 'MISSING_EXPRESSION_DELIMITER'],
  ['Affiche l’élément.', 'MISSING_INDEX'],
  ['Affiche l’élément "0 de t.', 'UNTERMINATED_EXPRESSION'],
  ['Affiche l’élément "" de t.', 'MISSING_INDEX'],
  ['Affiche l’élément "0" t.', 'UNKNOWN_FORMULATION'],
  ['Affiche l’élément "0" de.', 'INCOMPLETE_INSTRUCTION'],
  ['Affiche l’élément "0" de 1t.', 'INVALID_IDENTIFIER'],
  ['Affiche l’élément "0" de t encore.', 'UNEXPECTED_TEXT'],
  ['Affecte la valeur x à l’élément "0" de t.', 'INVALID_INTEGER'],
  ['Affecte à l’élément "0" de t le résultat de "1".', 'UNKNOWN_FORMULATION'],
  ['Affecte à l’élément "0" de t le résultat numérique de.', 'MISSING_EXPRESSION'],
  ["Affecte le caractère 'ab' à l’élément \"0\" de t.", 'INVALID_CHARACTER'],
]) {
  test(`diagnostic d’enveloppe : ${source}`, () => refused(source, code));
}

// ---------------------------------------------------------------------------
// 6. Rien des lots 16 à 18 n’est ouvert
// ---------------------------------------------------------------------------

// Codes differ between the two profiles for the operator families, exactly as
// they did before lot 15; indexing changed neither of them.
const STILL_REFUSED = [
  ['&a', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['&t[0]', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['* p', 'MISSING_OPERAND', 'MISSING_OPERAND'],
  ['p->x', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ["'A'", 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ["t['A']", 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ['"texte"', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
];
for (const [expression, ...codes] of STILL_REFUSED) {
  test(`lots 16 à 18 toujours fermés : ${JSON.stringify(expression)}`, () => {
    PROFILES.forEach(([name, parse], index) => {
      const result = parse(expression, 0, expression.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${expression}`);
      assert.equal(result.diagnostic.code, codes[index], `${name} / ${expression}`);
    });
  });
}
test('un accès à un membre reste hors catalogue', () => {
  refused('Affecte à x le résultat numérique de "t.x".', 'INVALID_IDENTIFIER');
});
test('aucune enveloppe ne produit une affectation globale de tableau', () => {
  refused('Affecte le tableau u à t.', 'UNKNOWN_FORMULATION');
  // C-A resolves no symbol, so it cannot know `t` names an array: the
  // historical scalar assignment still answers, unchanged. The guarantee of
  // this lot is that no formulation of its own ever produces `t = u;`.
  assert.equal(translated('Affecte à t le résultat numérique de "u".').fragments[0].code, 't = u;\n');
  for (const [, code] of EXACT) assert.ok(!/^[A-Za-z_]+ = /u.test(code) || code.includes('['), code);
});
test('aucun affichage de chaîne n’est ouvert par un tableau de char', () => {
  refused('Affiche la chaîne t.', 'UNKNOWN_FORMULATION');
  // %s is never produced: the element display is decimal, like PRINT_INT.
  assert.equal(translated('Affiche l’élément "0" de t.').fragments[0].code, 'printf("%d", t[0]);\n');
});

// ---------------------------------------------------------------------------
// 7. Informations pédagogiques passives
// ---------------------------------------------------------------------------

test('INDEX_NOT_CHECKED sur chaque forme indexée, en enveloppe et en expression', () => {
  for (const [source] of [...EXACT.slice(1), ...INDEXED]) {
    const entries = explainInstruction(translated(source));
    const index = entries.find(entry => entry.code === 'INDEX_NOT_CHECKED');
    assert.ok(index, source);
    assert.equal(index.severity, 'information');
    assert.match(index.message, /ne vérifie pas les bornes/u);
    assert.match(index.message, /comportement indéfini/u);
    // It must never claim to have found an overflow.
    assert.match(index.message, /Aucun dépassement n’est ici détecté ni exclu/u);
    assert.ok(!/dépassement détecté|hors des bornes ici|erreur/iu.test(index.message), source);
  }
});

test('INDEX_NOT_CHECKED pointe les délimiteurs de l’indice', () => {
  const quoted = 'Affiche l’élément "0" de t.';
  const [entry] = explainInstruction(translated(quoted));
  assert.equal(quoted.slice(entry.range.start, entry.range.end), '"0"');
  const bracketed = 'Crée un bloc si "t[i] > 0".';
  const [inside] = explainInstruction(translated(bracketed));
  assert.equal(bracketed.slice(inside.range.start, inside.range.end), '[i]');
});

test('les informations d’enveloppe survivent à l’indexation', () => {
  const codes = explainInstruction(translated('Crée une boucle tant que "t[i] != 0".')).map(entry => entry.code);
  assert.deepEqual(codes, ['INDEX_NOT_CHECKED', 'WHILE_PRETEST']);
  const call = explainInstruction(translated('Appelle traiter avec "t[i]".')).map(entry => entry.code);
  assert.deepEqual(call, ['INDEX_NOT_CHECKED', 'CALL_NOT_RESOLVED']);
  const logical = explainInstruction(translated('Crée un bloc si "t[i] > 0 && j < 2".')).map(entry => entry.code);
  assert.deepEqual(logical, ['INDEX_NOT_CHECKED', 'SHORT_CIRCUIT_AND']);
});

test('les deux informations de déclaration, et CHAR_ARRAY_NOT_STRING sur char seul', () => {
  const plain = explainInstruction(translated('Déclare un tableau de type int nommé t de dimension 3.'));
  assert.deepEqual(plain.map(entry => entry.code), ['ARRAY_NOT_ASSIGNABLE']);
  assert.match(plain[0].message, /ne s’affecte pas globalement/u);
  const characters = explainInstruction(translated('Déclare un tableau de type char nommé t de dimension 3.'));
  assert.deepEqual(characters.map(entry => entry.code), ['ARRAY_NOT_ASSIGNABLE', 'CHAR_ARRAY_NOT_STRING']);
  assert.match(characters[1].message, /caractère nul/u);
  assert.match(characters[1].message, /jamais|à aucun moment/u);
});

test('aucune information de tableau sur les instructions sans indice', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affiche la valeur de x.', 'Affecte la valeur 5 à x.',
    "Affecte le caractère 'A' à c.", 'Crée un bloc si "a > 0".', 'Retourne le résultat numérique de "a".']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    assert.ok(!codes.some(code => code === 'INDEX_NOT_CHECKED' || code.startsWith('ARRAY_') || code.startsWith('CHAR_ARRAY')), source);
  }
});

test('une information n’est jamais un avertissement', () => {
  const result = translated('Affiche l’élément "0" de t.');
  assert.deepEqual(analyzeCalculations(result).advisories, []);
  for (const entry of explainInstruction(result)) assert.equal(entry.severity, 'information');
});

test('un diviseur nul dans un indice reste un avertissement de calcul', () => {
  const source = 'Affiche l’élément "1 / 0" de t.';
  const advisories = analyzeCalculations(translated(source)).advisories;
  assert.equal(advisories.length, 1);
  assert.equal(advisories[0].code, 'INTEGER_ZERO_DIVISOR');
  assert.equal(advisories[0].severity, 'warning');
});

// ---------------------------------------------------------------------------
// 8. Limites partagées du noyau
// ---------------------------------------------------------------------------

test('le budget de jetons est global et compte les crochets', () => {
  const budget = { count: 0 };
  parseIndexExpression('i + 1', 0, 5, () => undefined, undefined, budget);
  assert.equal(budget.count, 3);
  parseNumericExpression('t[i]', 0, 4, () => undefined, undefined, budget);
  assert.equal(budget.count, 7);
});

test('une indexation très répétée dépasse le budget sans boucler', () => {
  const source = 't[' + Array.from({ length: MAX_EXPRESSION_TOKENS }, (_, index) => 'n' + index).join(' + ') + ']';
  for (const [name, parse] of PROFILES) {
    const result = parse(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', name);
    assert.equal(result.diagnostic.code, 'EXPRESSION_TOO_COMPLEX', name);
  }
});

test('l’imbrication d’indices est bornée en profondeur', () => {
  const depth = 70;
  const source = 't' + '[u'.repeat(depth) + '[0]' + ']'.repeat(depth);
  for (const [name, parse] of PROFILES) {
    const result = parse(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', name);
    assert.equal(result.diagnostic.code, 'EXPRESSION_TOO_COMPLEX', name);
  }
});

// ---------------------------------------------------------------------------
// 9. Placement
// ---------------------------------------------------------------------------

function applied(text, source, cursorOffset, indentUnit) {
  const translation = translated(source);
  const request = { document: { id: 'd', revision: 1, text }, cursorOffset, translation };
  if (indentUnit) request.indentUnit = indentUnit;
  const result = planPlacement(request);
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

for (const [label, text, offset] of [
  ['document vide', '', 0],
  ['ligne blanche en fin de fichier', 'int x;\n\n', 7],
  ['dans une fonction, LF', 'int main(void) {\n\n}\n', 17],
  ['dans une fonction, indentée', 'int main(void) {\n    \n}\n', 21],
  ['CRLF', 'int main(void) {\r\n    \r\n}\r\n', 22],
  ['indentation par tabulation', 'int main(void) {\n\t\n}\n', 18],
]) {
  test(`placement d’un tableau ${label}`, () => {
    const result = applied(text, 'Déclare un tableau de type int nommé t de dimension 3.', offset);
    assert.ok(result.includes('int t[3];'), result);
    assert.ok(result.includes('// Déclare un tableau de type int nommé t de dimension 3.'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

test('placement après un tableau déjà déclaré : les crochets ne piègent pas le balayage', () => {
  const document = 'int main(void) {\n    int t[3];\n    \n}\n';
  const result = applied(document, 'Affecte la valeur 5 à l’élément "0" de t.', document.lastIndexOf('\n    \n') + 1 + 4);
  assert.ok(result.includes('    t[0] = 5;'), result);
});

test('séquence complète déclaration, boucle, affectation, affichage : document final exact', () => {
  let document = 'int main(void) {\n    \n}\n';
  for (const source of [
    'Déclare un tableau de type int nommé t de dimension 3.',
    'Déclare un entier nommé i.',
    'Affecte la valeur 0 à l’élément "i" de t.',
    'Affiche l’élément "i" de t.',
  ]) {
    const blank = document.lastIndexOf('\n    \n');
    document = applied(document, source, blank + 1 + 4);
  }
  assert.equal(document, 'int main(void) {\n'
    + '    // Déclare un tableau de type int nommé t de dimension 3.\n    int t[3];\n'
    + '    // Déclare un entier nommé i.\n    int i;\n'
    + '    // Affecte la valeur 0 à l’élément "i" de t.\n    t[i] = 0;\n'
    + '    // Affiche l’élément "i" de t.\n    printf("%d", t[i]);\n'
    + '    \n}\n');
});

// ---------------------------------------------------------------------------
// 10. Non-régressions voisines
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Affecte la valeur 5 à x.', 'x = 5;\n'],
  ["Affecte le caractère 'A' à c.", "c = 'A';\n"],
  ['Affiche la valeur de x.', 'printf("%d", x);\n'],
  ['Affiche le caractère c.', 'printf("%c", c);\n'],
  ['Affiche x en décimal.', 'printf("%d", x);\n'],
  ['Déclare un entier nommé x.', 'int x;\n'],
  ['Déclare une variable de type int nommée x.', 'int x;\n'],
  ['Déclare un caractère nommé c.', 'char c;\n'],
  ['Affecte à x le résultat de "a + 1".', 'x = (a + 1);\n'],
  ['Affecte à x le résultat numérique de "a + 1".', 'x = (a + 1);\n'],
]) {
  test(`non-régression voisine : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('une phrase « élément » hors catalogue garde ses diagnostics historiques', () => {
  // The array module declines these, so the historical branches answer.
  refused("Affecte le caractère 'A' à 1c.", 'INVALID_IDENTIFIER');
  refused("Affecte le caractère 'A'.", 'INCOMPLETE_INSTRUCTION');
  refused('Affecte la valeur 5 à 1x.', 'INVALID_IDENTIFIER');
  refused('Affiche la valeur de 1x.', 'INVALID_IDENTIFIER');
  refused('Déclare un tableau nommé t.', 'UNKNOWN_FORMULATION');
});
