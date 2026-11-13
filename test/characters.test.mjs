import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { parseCharacterLiteral } from '../src/characterLiteral.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression } from '../src/numericExpression.ts';
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

// ---------------------------------------------------------------------------
// 1. Les quatre formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Déclare un caractère nommé c.', 'char c;\n', 'DECL_CHAR'],
  ["Crée un caractère nommé c de valeur 'A'.", "char c = 'A';\n", 'INIT_CHAR'],
  ["Affecte le caractère 'A' à c.", "c = 'A';\n", 'ASSIGN_CHAR'],
  ['Affiche le caractère c.', 'printf("%c", c);\n', 'PRINT_CHAR'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 14 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.instruction.kind, kind);
    // The comment keeps the sentence exactly, accents and all.
    assert.equal(result.fragments[0].comment, `// ${source}`);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    // Simple statements: no block, so no cursor is placed inside anything.
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 14 point final facultatif : ${source}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('lot 14 casse des mots fixes et accents exigés', () => {
  assert.equal(translated('AFFICHE LE CARACTÈRE c.').fragments[0].code, 'printf("%c", c);\n');
  assert.equal(translated('déclare un caractère nommé c.').fragments[0].code, 'char c;\n');
  refused('Affiche le caractere c.', 'UNKNOWN_FORMULATION');
  refused('Declare un caractère nommé c.', 'UNKNOWN_FORMULATION');
});

test('lot 14 nom conservé tel quel, sans normalisation', () => {
  assert.equal(translated('Déclare un caractère nommé maLettre.').fragments[0].code, 'char maLettre;\n');
  assert.equal(translated('Déclare un caractère nommé c_2.').fragments[0].code, 'char c_2;\n');
});

// ---------------------------------------------------------------------------
// 2. Grammaire du littéral caractère
// ---------------------------------------------------------------------------

const VALID = ['A', 'z', '0', ' ', '~', '!', '"', '%', B + 'n', B + 't', B + B, B + "'"];
for (const content of VALID) {
  const literal = `'${content}'`;
  test(`littéral accepté ${JSON.stringify(literal)}`, () => {
    // The literal is written back verbatim in all three envelopes that take one.
    assert.equal(translated(`Crée un caractère nommé c de valeur ${literal}.`).fragments[0].code, `char c = ${literal};\n`);
    assert.equal(translated(`Affecte le caractère ${literal} à c.`).fragments[0].code, `c = ${literal};\n`);
  });
}

test('le littéral n’est jamais évalué', () => {
  for (const source of ["Crée un caractère nommé c de valeur 'A'.", "Affecte le caractère 'A' à c."]) {
    const code = translated(source).fragments[0].code;
    assert.ok(!/65/u.test(code), `${source} ne doit produire aucun code numérique`);
    assert.ok(code.includes("'A'"));
  }
  // Nor does it reach the calculation advisories as a value.
  assert.deepEqual(analyzeCalculations(translate("Crée un caractère nommé c de valeur 'A'.")).advisories, []);
});

const LITERAL_REFUSALS = [
  ["''", 'INVALID_CHARACTER', 2],
  ["'ab'", 'INVALID_CHARACTER', 4],
  ["'abc'", 'INVALID_CHARACTER', 5],
  [`'${B}q'`, 'INVALID_CHARACTER_ESCAPE', 2, 1],
  [`'${B}0'`, 'INVALID_CHARACTER_ESCAPE', 2, 1],
  [`'${B}r'`, 'INVALID_CHARACTER_ESCAPE', 2, 1],
  [`'${B}"'`, 'INVALID_CHARACTER_ESCAPE', 2, 1],
  ["'é'", 'UNSUPPORTED_CHARACTER_CONTENT', 1, 1],
  ["'é'", 'UNSUPPORTED_CHARACTER_CONTENT', 1, 1],
  ['’A’', 'MISSING_CHARACTER_DELIMITER', 1],
  ['A', 'MISSING_CHARACTER_DELIMITER', 1],
  ['65', 'MISSING_CHARACTER_DELIMITER', 1],
  ['"A"', 'MISSING_CHARACTER_DELIMITER', 1],
];
for (const [literal, code, length, offset = 0] of LITERAL_REFUSALS) {
  test(`littéral refusé ${code} ${JSON.stringify(literal)}`, () => {
    const prefix = 'Crée un caractère nommé c de valeur ';
    const diagnostic = refused(`${prefix}${literal}.`, code);
    assert.deepEqual(diagnostic.range, { start: prefix.length + offset, end: prefix.length + offset + length }, literal);
  });
}

test('caractère astral refusé sur ses deux unités UTF-16', () => {
  const prefix = 'Crée un caractère nommé c de valeur ';
  const diagnostic = refused(`${prefix}'\u{1F600}'.`, 'UNSUPPORTED_CHARACTER_CONTENT');
  assert.deepEqual(diagnostic.range, { start: prefix.length + 1, end: prefix.length + 3 });
});

test('demi-codet isolé refusé sans normalisation', () => {
  const prefix = 'Crée un caractère nommé c de valeur ';
  const diagnostic = refused(`${prefix}'\uD800'.`, 'UNSUPPORTED_CHARACTER_CONTENT');
  assert.deepEqual(diagnostic.range, { start: prefix.length + 1, end: prefix.length + 2 });
});

test('littéral non terminé : plage de l’apostrophe ouvrante à la fin utile', () => {
  const prefix = 'Crée un caractère nommé c de valeur ';
  for (const literal of ["'a", "'", `'${B}`]) {
    const source = `${prefix}${literal}`;
    const diagnostic = refused(source, 'UNTERMINATED_CHARACTER');
    assert.deepEqual(diagnostic.range, { start: prefix.length, end: source.length }, literal);
  }
});

// The scanner is reachable on its own, with absolute offsets in any sentence.
test('parseCharacterLiteral : décalages absolus, aucune normalisation', () => {
  const source = "xxxx 'A' yyyy";
  const result = parseCharacterLiteral(source, 4, source.length);
  assert.equal(result.status, 'parsed');
  assert.equal(result.literal.text, "'A'");
  assert.deepEqual(result.literal.range, { start: 5, end: 8 });
  assert.equal(result.end, 8);
  assert.equal(parseCharacterLiteral('', 0, 0).diagnostic.code, 'MISSING_CHARACTER');
});

// ---------------------------------------------------------------------------
// 3. Diagnostics des enveloppes
// ---------------------------------------------------------------------------

const ENVELOPE_REFUSALS = [
  ['Crée un caractère.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée un caractère nommé.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée un caractère nommé c.', 'MISSING_CHARACTER'],
  ['Crée un caractère nommé c de.', 'MISSING_CHARACTER'],
  ['Crée un caractère nommé c de valeur.', 'MISSING_CHARACTER'],
  ['Crée un caractère nomme c de valeur.', 'UNKNOWN_FORMULATION'],
  ['Crée un caractère nommé int.', 'C_KEYWORD_IDENTIFIER'],
  ['Crée un caractère nommé 1c.', 'INVALID_IDENTIFIER'],
  ["Crée un caractère nommé c de valeur 'A' encore.", 'UNEXPECTED_TEXT'],
  ['Déclare un caractère.', 'INCOMPLETE_INSTRUCTION'],
  ['Déclare un caractère nommé.', 'INCOMPLETE_INSTRUCTION'],
  ['Déclare un caractère nommé int.', 'C_KEYWORD_IDENTIFIER'],
  ['Déclare un caractère nommé 1c.', 'INVALID_IDENTIFIER'],
  ['Déclare un caractère nommé c encore.', 'UNEXPECTED_TEXT'],
  ['Affecte le caractère.', 'MISSING_CHARACTER'],
  ['Affecte le caractère A à c.', 'MISSING_CHARACTER_DELIMITER'],
  ["Affecte le caractère 'A'.", 'INCOMPLETE_INSTRUCTION'],
  ["Affecte le caractère 'A' a c.", 'UNKNOWN_FORMULATION'],
  ["Affecte le caractère 'A' à.", 'INCOMPLETE_INSTRUCTION'],
  ["Affecte le caractère 'A' à int.", 'C_KEYWORD_IDENTIFIER'],
  ["Affecte le caractère 'A' à 1c.", 'INVALID_IDENTIFIER'],
  ["Affecte le caractère 'A' à c encore.", 'UNEXPECTED_TEXT'],
  ['Affiche le caractère.', 'INCOMPLETE_INSTRUCTION'],
  ['Affiche le caractère int.', 'C_KEYWORD_IDENTIFIER'],
  ['Affiche le caractère 1c.', 'INVALID_IDENTIFIER'],
  ['Affiche le caractère c encore.', 'UNEXPECTED_TEXT'],
];
for (const [source, code] of ENVELOPE_REFUSALS) {
  test(`enveloppe refusée ${code} : ${source}`, () => refused(source, code));
}

test('le nom cible garde sa plage exacte même après un littéral contenant une espace', () => {
  const source = "Affecte le caractère ' ' à 1c.";
  const diagnostic = refused(source, 'INVALID_IDENTIFIER');
  assert.deepEqual(diagnostic.range, { start: source.indexOf('1c'), end: source.indexOf('1c') + 2 });
});

test('instruction monoligne : le littéral ne contourne pas la règle', () => {
  refused("Crée un caractère nommé c de valeur 'A'.\nAffiche le caractère c.", 'INVALID_SEPARATOR');
});

// ---------------------------------------------------------------------------
// 4. char dans le système de types — décision D2
// ---------------------------------------------------------------------------

const TYPE_SYSTEM = [
  ['Déclare une variable de type char nommée c.', 'char c;\n'],
  ['Crée une variable de type char nommée c avec le résultat de "65".', 'char c = 65;\n'],
  ['Crée une fonction nommée lire qui retourne un char.', 'char lire(void) {\n    \n}\n'],
  ['Crée une fonction nommée f qui retourne un int et prend un char nommé c.', 'int f(char c) {\n    \n}\n'],
  ['Crée une fonction nommée g qui retourne un char et prend un char nommé a et un int nommé b.',
    'char g(char a, int b) {\n    \n}\n'],
  ['Affecte à n le résultat numérique de "(char) 65".', 'n = ((char) 65);\n'],
  ['Retourne le résultat numérique de "(char) a".', 'return ((char) a);\n'],
];
for (const [source, code] of TYPE_SYSTEM) {
  test(`D2 char dans le système de types : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('D2 n’ouvre que « char » : les types composés restent refusés', () => {
  for (const type of ['unsigned char', 'signed char', 'long', 'short']) {
    refused(`Déclare une variable de type ${type} nommée c.`, 'UNSUPPORTED_NUMERIC_TYPE');
    refused(`Crée une fonction nommée f qui retourne un ${type}.`, 'UNSUPPORTED_NUMERIC_TYPE');
  }
});

test('la conversion char est acceptée dans les deux profils qui déclarent la capacité', () => {
  for (const parse of [parseNumericExpression, parseCondition]) {
    const source = '(char) 65';
    assert.equal(parse(source, 0, source.length, () => undefined).status, 'parsed', source);
  }
});

// ---------------------------------------------------------------------------
// 5. Rien des lots 15 à 18 n’est ouvert
// ---------------------------------------------------------------------------

// `a[0]` left this list at lot 15, which opened indexing in the numeric
// profile by an approved extension; see arrays.test.mjs.
const STILL_REFUSED = [
  ['&a', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['* a', 'MISSING_OPERAND'],
  ['p->x', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ["'A'", 'INVALID_EXPRESSION_TOKEN'],
  [`'${B}n'`, 'INVALID_EXPRESSION_TOKEN'],
  ['"texte"', 'INVALID_EXPRESSION_TOKEN'],
];
for (const [expression, code] of STILL_REFUSED) {
  test(`lots 15 à 18 toujours fermés dans les expressions : ${expression}`, () => {
    for (const parse of [parseExpression, parseNumericExpression]) {
      const result = parse(expression, 0, expression.length, () => undefined);
      assert.equal(result.status, 'rejected', expression);
      assert.equal(result.diagnostic.code, code, expression);
    }
  });
}

test('un littéral caractère reste refusé dans toutes les enveloppes d’expression', () => {
  for (const source of [
    `Affecte à x le résultat de "'A'".`,
    `Affecte à x le résultat numérique de "'A'".`,
    `Crée un bloc si "c == 'A'".`,
    `Retourne le résultat de "'A'".`,
    `Appelle f avec "'A'".`,
  ]) {
    refused(source, 'INVALID_EXPRESSION_TOKEN');
  }
});

test('aucune formulation de chaîne n’est ouverte par le lot 14', () => {
  refused('Déclare une chaîne nommée s.', 'UNKNOWN_FORMULATION');
  refused('Affiche la chaîne s.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 6. Informations pédagogiques passives
// ---------------------------------------------------------------------------

const INFORMATION = [
  ["Crée un caractère nommé c de valeur 'A'.", 'CHARACTER_IS_INTEGER', "'A'"],
  ["Affecte le caractère 'A' à c.", 'CHARACTER_IS_INTEGER', "'A'"],
  ['Déclare un caractère nommé c.', 'CHARACTER_STORAGE', 'c'],
  ['Affiche le caractère c.', 'CHARACTER_FORMAT', 'c'],
];
for (const [source, code, anchor] of INFORMATION) {
  test(`information ${code} : ${source}`, () => {
    const result = translated(source);
    const entries = explainInstruction(result);
    assert.equal(entries.length, 1, source);
    assert.equal(entries[0].code, code);
    assert.equal(entries[0].severity, 'information');
    assert.equal(source.slice(entries[0].range.start, entries[0].range.end), anchor);
    // An information never becomes a warning and never carries a value.
    assert.ok(!/avertissement/iu.test(entries[0].message));
    assert.ok(!/\b65\b/u.test(entries[0].message));
  });
}

test('CHARACTER_IS_INTEGER dit le type exact de la constante en C17', () => {
  const [entry] = explainInstruction(translate("Crée un caractère nommé c de valeur 'A'."));
  assert.match(entry.message, /le type int, pas char/u);
});

test('aucune information caractère sur les autres intentions', () => {
  for (const source of ['Déclare un entier nommé age.', 'Crée un entier nommé age de valeur 20.',
    'Affiche la valeur de age.', 'Déclare une variable de type char nommée c.']) {
    const codes = explainInstruction(translate(source)).map(entry => entry.code);
    assert.ok(!codes.some(code => code.startsWith('CHARACTER_')), source);
  }
});

// ---------------------------------------------------------------------------
// 7. Placement
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
  test(`placement ${label}`, () => {
    const result = applied(text, 'Déclare un caractère nommé c.', offset);
    assert.ok(result.includes('char c;'), result);
    assert.ok(result.includes('// Déclare un caractère nommé c.'), result);
    // The document's own line ending is never converted.
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

test('séquence complète déclaration, affectation, affichage : document final exact', () => {
  let document = 'int main(void) {\n    \n}\n';
  for (const source of ['Déclare un caractère nommé c.', "Affecte le caractère 'A' à c.", 'Affiche le caractère c.']) {
    const blank = document.lastIndexOf('\n    \n');
    document = applied(document, source, blank + 1 + 4);
  }
  assert.equal(document,
    'int main(void) {\n'
    + '    // Déclare un caractère nommé c.\n'
    + '    char c;\n'
    + "    // Affecte le caractère 'A' à c.\n"
    + "    c = 'A';\n"
    + '    // Affiche le caractère c.\n'
    + '    printf("%c", c);\n'
    + '    \n}\n');
});

test('un littéral contenant une accolade ne trouble pas le placement', () => {
  const result = applied('int main(void) {\n\n}\n', "Affecte le caractère '}' à c.", 17);
  assert.ok(result.includes("c = '}';"), result);
});

// ---------------------------------------------------------------------------
// 8. Non-régression des voisins immédiats
// ---------------------------------------------------------------------------

test('les enveloppes voisines gardent leur sortie historique', () => {
  const unchanged = [
    ['Déclare un entier nommé age.', 'int age;\n'],
    ['Crée un entier nommé age de valeur 20.', 'int age = 20;\n'],
    ['Affecte la valeur 25 à age.', 'age = 25;\n'],
    ['Affiche la valeur de age.', 'printf("%d", age);\n'],
    ['Affiche age en décimal.', 'printf("%x", age);\n'.replace('%x', '%d')],
    ['Affiche le texte "Bonjour".', 'printf("%s", "Bonjour");\n'],
    ['Déclare une variable de type double nommée x.', 'double x;\n'],
  ];
  for (const [source, code] of unchanged) assert.equal(translated(source).fragments[0].code, code, source);
});
