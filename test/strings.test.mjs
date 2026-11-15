import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { parseStringLiteral, renderStringLiteral } from '../src/stringLiteral.ts';
import { parseCharacterLiteral } from '../src/characterLiteral.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression, parseIndexExpression } from '../src/numericExpression.ts';
import { parseCondition } from '../src/condition.ts';

// A real backslash, never written through a shell or a template.
const B = String.fromCharCode(92);

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
// 1. Les trois enveloppes et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".', 'char s[6] = "hello";\n', 'STRING_INIT'],
  ['Affiche la chaîne s.', 'printf("%s", s);\n', 'PRINT_STRING'],
  ['Affiche le caractère de l’élément "i" de s.', 'printf("%c", s[i]);\n', 'ARRAY_PRINT_CHAR'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 16 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 16 sortie exacte sans point final : ${source}`, () => {
    const without = source.slice(0, -1);
    assert.equal(translated(without).fragments[0].text, `// ${without}\n${code}`);
  });
}

test('les deux apostrophes désignent le même élément', () => {
  assert.equal(translate("Affiche le caractère de l'élément \"i\" de s.").fragments[0].code, 'printf("%c", s[i]);\n');
});

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('AFFICHE LA CHAÎNE s.').fragments[0].code, 'printf("%s", s);\n');
  refused('Affiche la chaine s.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. La dimension doit loger le caractère nul
// ---------------------------------------------------------------------------

for (const [dimension, text, code] of [
  ['6', 'hello', 'char s[6] = "hello";\n'],
  ['7', 'hello', 'char s[7] = "hello";\n'],
  ['100', 'hello', 'char s[100] = "hello";\n'],
  ['1', '', 'char s[1] = "";\n'],
  ['2', 'a', 'char s[2] = "a";\n'],
]) {
  test(`dimension suffisante : ${dimension} pour ${JSON.stringify(text)}`, () => {
    assert.equal(translated(`Crée un tableau de type char nommé s de dimension ${dimension} avec le texte "${text}".`)
      .fragments[0].code, code);
  });
}
for (const [dimension, text] of [['5', 'hello'], ['1', 'a'], ['3', 'abc'], ['1', ' ']]) {
  test(`dimension insuffisante : ${dimension} pour ${JSON.stringify(text)}`, () => {
    const source = `Crée un tableau de type char nommé s de dimension ${dimension} avec le texte "${text}".`;
    const diagnostic = refused(source, 'INSUFFICIENT_ARRAY_DIMENSION');
    // The diagnostic points at the dimension, the part the student must change.
    assert.deepEqual(diagnostic.range, { start: source.indexOf(` ${dimension} avec`) + 1, end: source.indexOf(` ${dimension} avec`) + 1 + dimension.length });
    assert.match(diagnostic.message, /caractère nul final/u);
    assert.match(diagnostic.message, new RegExp(`${text.length} caractère`, 'u'));
  });
}
test('C17 autoriserait char s[5] = "hello" : le refus est pédagogique et le dit', () => {
  const diagnostic = refused('Crée un tableau de type char nommé s de dimension 5 avec le texte "hello".',
    'INSUFFICIENT_ARRAY_DIMENSION');
  assert.match(diagnostic.message, /doit aussi loger le caractère nul final/u);
  assert.match(diagnostic.message, /6 au minimum/u);
});

test('la longueur comptée est celle du texte décodé, pas celle du texte tapé', () => {
  // `a\nb` is three characters in C, not four, so four is enough.
  assert.equal(translated(`Crée un tableau de type char nommé s de dimension 4 avec le texte "a${B}nb".`)
    .fragments[0].code, `char s[4] = "a${B}nb";\n`);
  refused(`Crée un tableau de type char nommé s de dimension 3 avec le texte "a${B}nb".`, 'INSUFFICIENT_ARRAY_DIMENSION');
});

test('aucune dimension n’est déduite ni ajustée', () => {
  refused('Crée un tableau de type char nommé s avec le texte "hello".', 'UNKNOWN_FORMULATION');
  refused('Crée un tableau de type char nommé s de dimension avec le texte "hello".', 'INVALID_ARRAY_DIMENSION');
  // The dimension given is the dimension produced, never one computed.
  assert.ok(translated('Crée un tableau de type char nommé s de dimension 99 avec le texte "hello".')
    .fragments[0].code.includes('[99]'));
});

for (const type of ['int', 'unsigned int', 'float', 'double']) {
  test(`un texte n’initialise qu’un tableau de char : ${type}`, () => {
    const source = `Crée un tableau de type ${type} nommé t de dimension 6 avec le texte "hello".`;
    const diagnostic = refused(source, 'STRING_REQUIRES_CHAR');
    assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), type);
  });
}

test('les deux verbes gardent leur sens : Déclare n’écrit rien, Crée écrit', () => {
  refused('Déclare un tableau de type char nommé s de dimension 6 avec le texte "hello".', 'UNEXPECTED_TEXT');
  refused('Crée un tableau de type char nommé s de dimension 6.', 'INCOMPLETE_INSTRUCTION');
  assert.equal(translated('Déclare un tableau de type char nommé s de dimension 6.').fragments[0].code, 'char s[6];\n');
});

test('aucun initialiseur entre accolades n’est ouvert', () => {
  refused('Crée un tableau de type char nommé s de dimension 3 avec le texte {1, 2}.', 'UNKNOWN_FORMULATION');
  refused('Crée un tableau de type int nommé t de dimension 3 avec le résultat de "1".', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 3. Grammaire du texte, partagée avec « Affiche le texte »
// ---------------------------------------------------------------------------

for (const [written, decoded] of [['hello', 'hello'], ['', ''], ['a b', 'a b'],
  [`a${B}nb`, 'a\nb'], [`a${B}tb`, 'a\tb'], [`a${B}${B}b`, `a${B}b`], [`a${B}"b`, 'a"b'], ['é', 'é'], ['😀', '😀']]) {
  test(`texte accepté : ${JSON.stringify(written)}`, () => {
    const source = `"${written}"`;
    const result = parseStringLiteral(source, 0, source.length);
    assert.equal(result.status, 'parsed', written);
    assert.equal(result.literal.value, decoded);
    assert.equal(result.end, source.length);
    // Re-encoding is stable: what is read back is what is written out.
    assert.equal(parseStringLiteral(renderStringLiteral(decoded), 0, renderStringLiteral(decoded).length).literal.value, decoded);
  });
}
for (const [written, code] of [[`a${B}qb`, 'INVALID_STRING_ESCAPE'], [`a${B}0b`, 'INVALID_STRING_ESCAPE'],
  ['a??=b', 'UNSUPPORTED_STRING_CONTENT'], ['a\u0001b', 'UNSUPPORTED_STRING_CONTENT'], ['a\ud800b', 'UNSUPPORTED_STRING_CONTENT']]) {
  test(`texte refusé ${code} : ${JSON.stringify(written)}`, () => {
    refused(`Crée un tableau de type char nommé s de dimension 9 avec le texte "${written}".`, code);
  });
}
test('texte non terminé et délimiteur absent', () => {
  refused('Crée un tableau de type char nommé s de dimension 9 avec le texte "hello.', 'UNTERMINATED_STRING');
  refused('Crée un tableau de type char nommé s de dimension 9 avec le texte hello.', 'UNKNOWN_FORMULATION');
  refused('Crée un tableau de type char nommé s de dimension 9 avec le texte.', 'INCOMPLETE_INSTRUCTION');
});

test('« Affiche le texte » n’a pas changé en partageant le scanner', () => {
  assert.equal(translated('Affiche le texte "bonjour".').fragments[0].code, 'printf("%s", "bonjour");\n');
  assert.equal(translated(`Affiche le texte "a${B}nb".`).fragments[0].code, `printf("%s", "a${B}nb");\n`);
  refused('Affiche le texte "a" encore.', 'UNEXPECTED_TEXT');
  refused(`Affiche le texte "a${B}qb".`, 'INVALID_STRING_ESCAPE');
});

// ---------------------------------------------------------------------------
// 4. Le caractère nul
// ---------------------------------------------------------------------------

test(`'${B}0' est accepté par le scanner de littéral caractère`, () => {
  const source = `'${B}0'`;
  const result = parseCharacterLiteral(source, 0, source.length);
  assert.equal(result.status, 'parsed');
  // Kept as a spelling: never turned into the number zero.
  assert.equal(result.literal.text, source);
});

for (const [source, code] of [
  [`Crée un caractère nommé fin de valeur '${B}0'.`, `char fin = '${B}0';\n`],
  [`Affecte le caractère '${B}0' à fin.`, `fin = '${B}0';\n`],
  [`Affecte le caractère '${B}0' à l’élément "5" de s.`, `s[5] = '${B}0';\n`],
]) {
  test(`le caractère nul dans les enveloppes existantes : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
    assert.ok(!/\b0\b/u.test(translated(source).fragments[0].code.replace(/'..'/u, '')), 'aucun code numérique');
  });
}

test('les autres échappements inconnus restent refusés, et le message cite \\0', () => {
  for (const escape of ['q', 'r', '"', '1', 'x']) {
    const diagnostic = refused(`Crée un caractère nommé c de valeur '${B}${escape}'.`, 'INVALID_CHARACTER_ESCAPE');
    assert.match(diagnostic.message, /\\0/u);
  }
});

// ---------------------------------------------------------------------------
// 5. Littéraux caractères dans les expressions
// ---------------------------------------------------------------------------

const IN_EXPRESSION = [
  [`Crée un bloc si "s[i] != '${B}0'".`, `if (s[i] != '${B}0') {\n    \n}\n`],
  [`Crée une boucle tant que "s[i] != '${B}0'".`, `while (s[i] != '${B}0') {\n    \n}\n`],
  [`Crée un bloc si "c == 'A'".`, "if (c == 'A') {\n    \n}\n"],
  [`Affecte à n le résultat numérique de "'z' - 'a'".`, "n = ('z' - 'a');\n"],
  [`Affecte à n le résultat numérique de "' '".`, "n = ' ';\n"],
  [`Retourne le résultat numérique de "'A'".`, "return 'A';\n"],
  [`Appelle f avec "'A'".`, "f('A');\n"],
  // Each comparison is parenthesized inside the logical operand, and the
  // logical result again: the lot 9 rendering, unchanged by lot 16.
  [`Crée un bloc si "c >= 'a' && c <= 'z'".`, "if (((c >= 'a') && (c <= 'z'))) {\n    \n}\n"],
];
for (const [source, code] of IN_EXPRESSION) {
  test(`littéral caractère en expression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('un littéral caractère est un terme, jamais une valeur calculée', () => {
  for (const [, parse] of PROFILES) {
    const result = parsed(parse, "'A'");
    const node = result.expression ?? result.condition.expression;
    assert.equal(node.kind, 'character');
    assert.equal(node.value, "'A'");
    assert.deepEqual(node.range, { start: 0, end: 3 });
  }
  // `' '` holds a space: a token split would cut it in two. The comparison
  // belongs to the condition profile, the only one that declares logic.
  assert.ok(parsed(parseCondition, "' ' != 'A'"));
  assert.ok(parsed(parseNumericExpression, "' ' + 1"));
});

test('le profil entier et le profil d’indice restent fermés aux caractères', () => {
  for (const literal of ["'A'", `'${B}0'`, "' '"]) {
    const integer = parseExpression(literal, 0, literal.length, () => undefined);
    assert.equal(integer.status, 'rejected', literal);
    assert.equal(integer.diagnostic.code, 'INVALID_EXPRESSION_TOKEN', literal);
    const index = parseIndexExpression(literal, 0, literal.length, () => undefined);
    assert.equal(index.status, 'rejected', literal);
  }
  // An index stays an integer expression: a character code is not a position.
  for (const [name, parse] of PROFILES) {
    const source = "t['A']";
    const result = parse(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', name);
    assert.equal(result.diagnostic.code, 'INVALID_EXPRESSION_TOKEN', name);
  }
  refused(`Affecte à x le résultat de "'A'".`, 'INVALID_EXPRESSION_TOKEN');
  refused(`Affiche l’élément "'A'" de t.`, 'INVALID_EXPRESSION_TOKEN');
});

for (const [source, code, start, end] of [
  ["a 'A'", 'MISSING_OPERATOR', 2, 2],
  ["'A' 'B'", 'MISSING_OPERATOR', 4, 4],
  ["'ab'", 'INVALID_CHARACTER', 0, 4],
  ["''", 'INVALID_CHARACTER', 0, 2],
  [`'${B}q'`, 'INVALID_CHARACTER_ESCAPE', 1, 3],
  ["'a", 'UNTERMINATED_CHARACTER', 0, 2],
  ["'é'", 'UNSUPPORTED_CHARACTER_CONTENT', 1, 2],
]) {
  test(`diagnostic de littéral caractère en expression ${JSON.stringify(source)}`, () => {
    for (const [name, parse] of PROFILES) {
      const result = parse(source, 0, source.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${source}`);
      assert.equal(result.diagnostic.code, code, `${name} / ${source}`);
      assert.deepEqual(result.diagnostic.range, { start, end }, `${name} / ${source}`);
    }
  });
}

test('les plages sont absolues dans la phrase d’origine', () => {
  const source = `Crée un bloc si "s[i] != '${B}q'".`;
  const diagnostic = refused(source, 'INVALID_CHARACTER_ESCAPE');
  assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), `${B}q`);
});

// ---------------------------------------------------------------------------
// 6. Rien des lots 17 et 18 n’est ouvert
// ---------------------------------------------------------------------------

for (const [expression, numeric, condition] of [
  // `&s[0]` and `* p` left this list at lot 17 by decision D4.
  // `p->x` left this list at lot 20, which opened member access in the
  // numeric and condition profiles; the frozen profiles still refuse it.
  ['"texte"', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
]) {
  test(`lots 17 et 18 toujours fermés : ${JSON.stringify(expression)}`, () => {
    PROFILES.forEach(([name, parse], index) => {
      const result = parse(expression, 0, expression.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${expression}`);
      assert.equal(result.diagnostic.code, [numeric, condition][index], `${name} / ${expression}`);
    });
  });
}
test('ni string.h ni ses fonctions', () => {
  refused('Inclue la bibliothèque string.h.', 'UNSUPPORTED_HEADER');
  refused('Affecte à n le résultat numérique de "strlen(s)".', 'MISSING_OPERATOR');
});
test('aucune affectation globale de chaîne', () => {
  refused('Affecte le texte "autre" à s.', 'UNKNOWN_FORMULATION');
  refused('Affecte à s le texte "autre".', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 7. Informations pédagogiques passives
// ---------------------------------------------------------------------------

test('NULL_TERMINATOR et ARRAY_SIZE_VS_LENGTH sur une initialisation par texte', () => {
  const source = 'Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".';
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code), ['NULL_TERMINATOR', 'ARRAY_SIZE_VS_LENGTH']);
  assert.equal(source.slice(entries[0].range.start, entries[0].range.end), '"hello"');
  assert.equal(source.slice(entries[1].range.start, entries[1].range.end), '6');
  assert.match(entries[0].message, /caractère nul, de code zéro/u);
  assert.match(entries[0].message, /et non la dimension, qui marque la fin/u);
  assert.match(entries[1].message, /dimension 6 est la place réservée/u);
  assert.match(entries[1].message, /ici 5/u);
  for (const entry of entries) assert.equal(entry.severity, 'information');
});

test('CHAR_ARRAY_NOT_STRING ne porte que sur la déclaration sans texte', () => {
  const declared = explainInstruction(translated('Déclare un tableau de type char nommé s de dimension 6.'));
  assert.ok(declared.some(entry => entry.code === 'CHAR_ARRAY_NOT_STRING'));
  const initialised = explainInstruction(translated('Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".'));
  assert.ok(!initialised.some(entry => entry.code === 'CHAR_ARRAY_NOT_STRING'));
  assert.ok(!initialised.some(entry => entry.code === 'ARRAY_NOT_ASSIGNABLE'));
});

test('STRING_TERMINATOR_NOT_CHECKED n’annonce aucune vérification', () => {
  const source = 'Affiche la chaîne s.';
  const [entry] = explainInstruction(translated(source));
  assert.equal(entry.code, 'STRING_TERMINATOR_NOT_CHECKED');
  assert.equal(source.slice(entry.range.start, entry.range.end), 's');
  assert.match(entry.message, /jusqu’au premier caractère nul/u);
  assert.match(entry.message, /ne vérifie ni que ce tableau existe, ni qu’il en contient un/u);
  assert.ok(!/vérifié|garanti|valide/iu.test(entry.message.replace('ne vérifie', '')), entry.message);
});

test('ELEMENT_CHARACTER_FORMAT accompagne INDEX_NOT_CHECKED', () => {
  const codes = explainInstruction(translated('Affiche le caractère de l’élément "i" de s.')).map(entry => entry.code);
  // Lot 29 : un affichage d'élément n'écrit pas de séparateur non plus.
  assert.deepEqual(codes, ['INDEX_NOT_CHECKED', 'ELEMENT_CHARACTER_FORMAT', 'OUTPUT_HAS_NO_SEPARATOR']);
});

test('CHARACTER_IS_INTEGER sur un littéral écrit dans une expression', () => {
  const source = `Crée un bloc si "s[i] != '${B}0'".`;
  const entries = explainInstruction(translated(source));
  const entry = entries.find(item => item.code === 'CHARACTER_IS_INTEGER');
  assert.ok(entry);
  assert.equal(source.slice(entry.range.start, entry.range.end), `'${B}0'`);
  assert.match(entry.message, /a le type int, pas char/u);
  assert.match(entry.message, /Aucune valeur n’est calculée ici/u);
});

test('aucune information de chaîne sur les instructions voisines', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affiche la valeur de x.', 'Affiche le texte "a".',
    'Affiche le caractère c.', 'Affiche l’élément "0" de t.', 'Crée un bloc si "a > 0".']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['NULL_TERMINATOR', 'ARRAY_SIZE_VS_LENGTH', 'STRING_TERMINATOR_NOT_CHECKED',
      'ELEMENT_CHARACTER_FORMAT', 'CHARACTER_IS_INTEGER']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

test('une information n’est jamais un avertissement', () => {
  for (const [source] of EXACT) {
    const result = translated(source);
    assert.deepEqual(analyzeCalculations(result).advisories, []);
    for (const entry of explainInstruction(result)) assert.equal(entry.severity, 'information');
  }
});

// ---------------------------------------------------------------------------
// 8. Parcours composé, sans commande monolithique
// ---------------------------------------------------------------------------

function applied(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

test('parcours complet d’une chaîne : document final exact', () => {
  let document = 'int main(void) {\n    \n}\n';
  for (const source of [
    'Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".',
    'Déclare un entier nommé i.',
    'Affecte la valeur 0 à i.',
  ]) {
    document = applied(document, source, document.lastIndexOf('\n    \n') + 1 + 4);
  }
  document = applied(document, `Crée une boucle tant que "s[i] != '${B}0'".`, document.lastIndexOf('\n    \n') + 1 + 4);
  // The loop body is created empty; the student fills it, and the loop stays visible.
  const inside = document.indexOf('\n        \n');
  document = applied(document, 'Affiche le caractère de l’élément "i" de s.', inside + 1 + 8);
  document = applied(document, 'Affecte à i le résultat numérique de "i + 1".', document.indexOf('\n        \n') + 1 + 8);
  assert.equal(document, 'int main(void) {\n'
    + '    // Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".\n'
    + '    char s[6] = "hello";\n'
    + '    // Déclare un entier nommé i.\n    int i;\n'
    + '    // Affecte la valeur 0 à i.\n    i = 0;\n'
    + `    // Crée une boucle tant que "s[i] != '${B}0'".\n`
    + `    while (s[i] != '${B}0') {\n`
    + '        // Affiche le caractère de l’élément "i" de s.\n'
    + '        printf("%c", s[i]);\n'
    + '        // Affecte à i le résultat numérique de "i + 1".\n'
    + '        i = (i + 1);\n'
    // The loop block replaced the function's blank line, so the only blank
    // line left is the one inside the body, where the cursor waits.
    + '        \n    }\n}\n');
});

test('aucune commande de parcours monolithique n’existe', () => {
  for (const source of ['Parcours la chaîne s.', 'Affiche chaque caractère de s.',
    'Crée une boucle sur la chaîne s.', 'Calcule la longueur de s.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

for (const [label, text, offset] of [
  ['document vide', '', 0],
  ['ligne blanche en fin de fichier', 'int x;\n\n', 7],
  ['dans une fonction, indentée', 'int main(void) {\n    \n}\n', 21],
  ['CRLF', 'int main(void) {\r\n    \r\n}\r\n', 22],
]) {
  test(`placement d’une chaîne ${label}`, () => {
    const result = applied(text, 'Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".', offset);
    assert.ok(result.includes('char s[6] = "hello";'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

test('les guillemets d’un texte ne piègent pas le balayage contextuel', () => {
  const document = 'int main(void) {\n    char s[4] = "{}";\n    \n}\n';
  const result = applied(document, 'Affiche la chaîne s.', document.lastIndexOf('\n    \n') + 1 + 4);
  assert.ok(result.includes('    printf("%s", s);'), result);
});

// ---------------------------------------------------------------------------
// 9. Non-régressions voisines
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Affiche le texte "bonjour".', 'printf("%s", "bonjour");\n'],
  ['Affiche le caractère c.', 'printf("%c", c);\n'],
  ['Affiche l’élément "0" de t.', 'printf("%d", t[0]);\n'],
  ['Déclare un tableau de type char nommé t de dimension 10.', 'char t[10];\n'],
  ["Affecte le caractère 'A' à c.", "c = 'A';\n"],
  ["Crée un caractère nommé c de valeur 'A'.", "char c = 'A';\n"],
  ['Affecte à x le résultat de "a + 1".', 'x = (a + 1);\n'],
  ['Affecte à somme le résultat numérique de "somme + t[i]".', 'somme = (somme + t[i]);\n'],
]) {
  test(`non-régression voisine : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
