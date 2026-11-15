import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { resolveStructTarget } from '../src/structTarget.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression, parseIndexExpression } from '../src/numericExpression.ts';
import { parseCondition } from '../src/condition.ts';

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
function planned(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  if (result.status !== 'planned') return { refused: result.diagnostics[0].code };
  const [edit] = result.plan.edits;
  return { text: text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end) };
}
function applied(text, source, cursorOffset) {
  const result = planned(text, source, cursorOffset);
  assert.ok(result.text, `${source} aurait dû être plaçable : ${result.refused}`);
  return result.text;
}
const PROFILES = [['numérique', parseNumericExpression], ['condition', parseCondition]];
const numeric = (expression) => `Affecte à n le résultat numérique de "${expression}".`;

// ---------------------------------------------------------------------------
// 1. Les huit formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Déclare une structure nommée Point.', 'struct Point {\n    \n};\n', 'STRUCT_DECL'],
  ['Ajoute un champ de type int nommé x.', 'int x;\n', 'STRUCT_FIELD'],
  ['Ajoute un champ de type structure Point nommé origine.', 'struct Point origine;\n', 'STRUCT_FIELD'],
  ['Déclare une variable de type structure Point nommée p.', 'struct Point p;\n', 'STRUCT_VAR'],
  ['Déclare un pointeur de type structure Point nommé q.', 'struct Point *q;\n', 'STRUCT_POINTER'],
  ['Affecte la valeur 5 au champ x de p.', 'p.x = 5;\n', 'MEMBER_ASSIGN_INT'],
  ['Affecte la valeur 5 au champ x pointé par q.', 'q->x = 5;\n', 'MEMBER_ASSIGN_INT'],
  ['Affecte au champ x de p le résultat numérique de "a + 1".', 'p.x = (a + 1);\n', 'MEMBER_ASSIGN_EXPRESSION'],
  ['Affiche le champ x de p.', 'printf("%d", p.x);\n', 'MEMBER_PRINT'],
  ['Affiche le champ x pointé par q.', 'printf("%d", q->x);\n', 'MEMBER_PRINT'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 20 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
  });
  test(`lot 20 sortie exacte sans point final : ${source}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('la définition de structure est un bloc, et son accolade porte le point-virgule', () => {
  const fragment = translated('Déclare une structure nommée Point.').fragments[0];
  assert.ok(fragment.code.endsWith('};\n'), fragment.code);
  assert.ok(fragment.cursor, 'le curseur doit être placé dans le bloc');
  // The other seven are plain statements.
  for (const [source] of EXACT.slice(1)) assert.equal(translated(source).fragments[0].cursor, undefined);
});

test('point et flèche sont écrits comme la phrase le demande, jamais substitués', () => {
  assert.equal(translated('Affiche le champ x de p.').fragments[0].code, 'printf("%d", p.x);\n');
  assert.equal(translated('Affiche le champ x pointé par p.').fragments[0].code, 'printf("%d", p->x);\n');
  // « pointée » is accepted too: the field may be feminine in French.
  assert.equal(translated('Affiche le champ valeur pointée par p.').fragments[0].code, 'printf("%d", p->valeur);\n');
});

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('DÉCLARE UNE STRUCTURE NOMMÉE Point.').fragments[0].code, 'struct Point {\n    \n};\n');
  refused('Declare une structure nommee Point.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. Types de champ, étiquettes et noms
// ---------------------------------------------------------------------------

for (const type of ['int', 'unsigned int', 'float', 'double', 'char']) {
  test(`champ de type ${type}`, () => {
    assert.equal(translated(`Ajoute un champ de type ${type} nommé v.`).fragments[0].code, `${type} v;\n`);
  });
}
for (const type of ['long', 'short', 'unsigned char', 'void', 'long double']) {
  test(`type de champ hors catalogue : ${type}`, () => {
    refused(`Ajoute un champ de type ${type} nommé v.`, 'UNSUPPORTED_NUMERIC_TYPE');
  });
}
test('un champ peut être une autre structure', () => {
  assert.equal(translated('Ajoute un champ de type structure Date nommé naissance.').fragments[0].code,
    'struct Date naissance;\n');
  refused('Ajoute un champ de type structure nommé x.', 'INVALID_IDENTIFIER');
});
test('étiquettes et noms invalides', () => {
  refused('Déclare une structure nommée 1Point.', 'INVALID_IDENTIFIER');
  refused('Déclare une structure nommée struct.', 'C_KEYWORD_IDENTIFIER');
  refused('Déclare une structure nommée.', 'INCOMPLETE_INSTRUCTION');
  refused('Déclare une structure Point.', 'UNKNOWN_FORMULATION');
  refused('Déclare une structure nommée Point encore.', 'UNEXPECTED_TEXT');
  refused('Ajoute un champ de type int nommé 1x.', 'INVALID_IDENTIFIER');
  refused('Ajoute un champ de type int nommé.', 'INCOMPLETE_INSTRUCTION');
  refused('Ajoute un champ de type nommé x.', 'MISSING_NUMERIC_TYPE');
  refused('Ajoute un champ int nommé x.', 'UNKNOWN_FORMULATION');
  refused('Déclare une variable de type structure Point p.', 'UNKNOWN_FORMULATION');
  refused('Déclare un pointeur de type structure nommé q.', 'INVALID_IDENTIFIER');
});
test('les déclarations scalaires et pointeurs des lots 7 et 17 sont intactes', () => {
  assert.equal(translated('Déclare une variable de type int nommée x.').fragments[0].code, 'int x;\n');
  assert.equal(translated('Déclare un pointeur de type int nommé p.').fragments[0].code, 'int *p;\n');
  refused('Déclare une variable de type long nommée x.', 'UNSUPPORTED_NUMERIC_TYPE');
});

// ---------------------------------------------------------------------------
// 3. Cibles de champ dans les enveloppes
// ---------------------------------------------------------------------------

test('diagnostics des cibles de champ', () => {
  refused('Affecte la valeur 5 au champ x.', 'INCOMPLETE_INSTRUCTION');
  refused('Affecte la valeur 5 au champ x de.', 'INCOMPLETE_INSTRUCTION');
  refused('Affecte la valeur 5 au champ x dans p.', 'UNKNOWN_FORMULATION');
  refused('Affecte la valeur 5 au champ x pointé p.', 'UNKNOWN_FORMULATION');
  refused('Affecte la valeur 5 au champ 1x de p.', 'INVALID_IDENTIFIER');
  refused('Affecte la valeur 5 au champ x de 1p.', 'INVALID_IDENTIFIER');
  refused('Affecte la valeur x au champ x de p.', 'INVALID_INTEGER');
  refused('Affiche le champ x de p encore.', 'UNEXPECTED_TEXT');
  refused('Affecte au champ x de p le résultat de "1".', 'UNKNOWN_FORMULATION');
  refused('Affecte au champ x de p le résultat numérique de.', 'MISSING_EXPRESSION');
});

// ---------------------------------------------------------------------------
// 4. Accès dans les expressions
// ---------------------------------------------------------------------------

const IN_EXPRESSION = [
  [numeric('p.x'), 'n = p.x;\n'],
  [numeric('q->x'), 'n = q->x;\n'],
  [numeric('p.a.b'), 'n = p.a.b;\n'],
  [numeric('q->a->b'), 'n = q->a->b;\n'],
  [numeric('q->a.b'), 'n = q->a.b;\n'],
  [numeric('t[i].x'), 'n = t[i].x;\n'],
  [numeric('p.x + 1'), 'n = (p.x + 1);\n'],
  [numeric('p.x * q->y'), 'n = (p.x * q->y);\n'],
  [numeric('-p.x'), 'n = (-p.x);\n'],
  ['Crée un bloc si "q->x > 0".', 'if (q->x > 0) {\n    \n}\n'],
  ['Crée une boucle tant que "q->x != 0".', 'while (q->x != 0) {\n    \n}\n'],
  ['Appelle traiter avec "p.x".', 'traiter(p.x);\n'],
  ['Retourne le résultat numérique de "p.x".', 'return p.x;\n'],
];
for (const [source, code] of IN_EXPRESSION) {
  test(`accès en expression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('le nœud produit porte l’objet, le champ et la forme', () => {
  for (const [, parse] of PROFILES) {
    const result = parse('q->x', 0, 4, () => undefined);
    assert.equal(result.status, 'parsed');
    const node = result.expression ?? result.condition.expression;
    assert.equal(node.kind, 'member');
    assert.equal(node.member, 'x');
    assert.equal(node.arrow, true);
    assert.equal(node.object.kind, 'name');
    assert.deepEqual(node.operatorRange, { start: 1, end: 3 });
  }
  const dotted = parseNumericExpression('p.x', 0, 3, () => undefined);
  assert.equal(dotted.expression.arrow, false);
  assert.deepEqual(dotted.expression.operatorRange, { start: 1, end: 2 });
});

for (const [source, code, start, end] of [
  ['p.', 'MISSING_MEMBER_NAME', 2, 2],
  ['p->', 'MISSING_MEMBER_NAME', 3, 3],
  // `p.1` is read as the name `p` followed by the numeric literal `.1`: the
  // dot only becomes the access operator when a digit does not follow it.
  ['p.1', 'MISSING_OPERATOR', 1, 1],
  ['p.+', 'MISSING_MEMBER_NAME', 2, 3],
  ['->x', 'UNSUPPORTED_EXPRESSION_OPERATOR', 0, 2],
  ['p.t[i]', 'INVALID_EXPRESSION_TOKEN', 3, 4],
]) {
  test(`diagnostic d’accès ${JSON.stringify(source)}`, () => {
    const result = parseNumericExpression(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', source);
    assert.equal(result.diagnostic.code, code, source);
    assert.deepEqual(result.diagnostic.range, { start, end }, source);
  });
}

test('un accès à un champ réservé est refusé comme nom', () => {
  const result = parseNumericExpression('p.int', 0, 5, token => token.text === 'int'
    ? { code: 'C_KEYWORD_IDENTIFIER', category: 'understanding', severity: 'error', message: 'Mot-clé.', range: token.range }
    : undefined);
  assert.equal(result.status, 'rejected');
  assert.equal(result.diagnostic.code, 'C_KEYWORD_IDENTIFIER');
});

test('les littéraux numériques ne sont pas cassés par le point', () => {
  for (const [expression, code] of [['1.5', 'n = 1.5;\n'], ['.5', 'n = .5;\n'], ['1.5 + .5', 'n = (1.5 + .5);\n'],
    ['1e3', 'n = 1e3;\n'], ['2.5f', 'n = 2.5f;\n']]) {
    assert.equal(translated(numeric(expression)).fragments[0].code, code, expression);
  }
  refused(numeric('1.5.2'), 'UNSUPPORTED_NUMERIC_LITERAL');
});

test('les profils gelés restent fermés à l’accès', () => {
  // The frozen profiles never break a name on a dot, so a dotted name stays
  // one malformed token and the name validator is what refuses it.
  const validate = (token) => /^[A-Za-z][A-Za-z0-9_]*$/u.test(token.text) ? undefined
    : { code: 'INVALID_IDENTIFIER', category: 'understanding', severity: 'error', message: 'Nom invalide.', range: token.range };
  for (const [source, code] of [['p.x', 'INVALID_IDENTIFIER'], ['q->x', 'UNSUPPORTED_EXPRESSION_OPERATOR']]) {
    for (const parse of [parseExpression, parseIndexExpression]) {
      const result = parse(source, 0, source.length, validate);
      assert.equal(result.status, 'rejected', source);
      assert.equal(result.diagnostic.code, code, source);
    }
  }
  refused('Affiche l’élément "p.x" de t.', 'INVALID_IDENTIFIER');
  refused('Affiche l’élément "q->x" de t.', 'UNSUPPORTED_EXPRESSION_OPERATOR');
});

// ---------------------------------------------------------------------------
// 5. Placement contextuel d’un champ
// ---------------------------------------------------------------------------

const STRUCT_DOC = 'struct Point {\n    \n};\n';

test('un champ se place dans une structure', () => {
  const result = applied(STRUCT_DOC, 'Ajoute un champ de type int nommé x.', 15);
  assert.ok(result.includes('    int x;'), result);
  // An anonymous structure is a target too.
  assert.ok(applied('struct {\n    \n};\n', 'Ajoute un champ de type int nommé x.', 9).includes('    int x;'));
});

test('un champ hors d’une structure est refusé', () => {
  for (const [text, offset] of [['int main(void) {\n    \n}\n', 21], ['\n', 0], ['int x;\n\n', 7],
    ['while (a) {\n    \n}\n', 16], ['switch (a) {\n    \n}\n', 17]]) {
    assert.equal(planned(text, 'Ajoute un champ de type int nommé x.', offset).refused, 'FIELD_OUTSIDE_STRUCT',
      JSON.stringify(text));
  }
});

test('le reconnaisseur rend l’étiquette de la structure englobante', () => {
  const resolution = resolveStructTarget(STRUCT_DOC, 15);
  assert.equal(resolution.status, 'resolved');
  assert.equal(resolution.target.tag, 'Point');
  assert.equal(STRUCT_DOC.slice(resolution.target.keywordRange.start, resolution.target.keywordRange.end), 'struct');
  const anonymous = resolveStructTarget('union {\n    \n};\n', 8);
  assert.equal(anonymous.status, 'resolved');
  assert.equal(anonymous.target.tag, undefined);
  // A function body is not a structure.
  assert.equal(resolveStructTarget('int main(void) {\n    \n}\n', 21).status, 'rejected');
});

test('structure complète : document final exact', () => {
  let document = applied('\n', 'Déclare une structure nommée Point.', 0);
  let at = document.indexOf('\n    \n') + 1 + 4;
  for (const source of ['Ajoute un champ de type int nommé x.', 'Ajoute un champ de type int nommé y.']) {
    document = applied(document, source, at);
    at = document.indexOf('\n    \n') + 1 + 4;
  }
  assert.equal(document, '// Déclare une structure nommée Point.\nstruct Point {\n'
    + '    // Ajoute un champ de type int nommé x.\n    int x;\n'
    + '    // Ajoute un champ de type int nommé y.\n    int y;\n'
    + '    \n};\n');
});

test('un champ se place dans une structure imbriquée dans une fonction', () => {
  const document = 'int main(void) {\n    struct Local {\n        \n    };\n}\n';
  const result = applied(document, 'Ajoute un champ de type double nommé v.', document.indexOf('\n        \n') + 1 + 8);
  assert.ok(result.includes('        double v;'), result);
});

// ---------------------------------------------------------------------------
// 6. Informations pédagogiques
// ---------------------------------------------------------------------------

test('les deux informations de la définition', () => {
  const source = 'Déclare une structure nommée Point.';
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code), ['STRUCT_TAG_NEEDS_KEYWORD', 'STRUCT_LAYOUT']);
  assert.equal(source.slice(entries[0].range.start, entries[0].range.end), 'Point');
  assert.match(entries[0].message, /ce nom est une étiquette/u);
  assert.match(entries[0].message, /aucun n’est créé ici/u);
  assert.match(entries[1].message, /du remplissage entre eux/u);
  assert.match(entries[1].message, /n’est pas la somme des tailles/u);
  for (const entry of entries) assert.equal(entry.severity, 'information');
});

test('les deux informations de l’accès, en enveloppe et en expression', () => {
  for (const source of ['Affiche le champ x de p.', 'Affecte la valeur 5 au champ x pointé par q.',
    numeric('p.x'), 'Crée un bloc si "q->x > 0".']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    assert.ok(codes.includes('MEMBER_ACCESS_FORM'), source);
    assert.ok(codes.includes('MEMBER_NOT_CHECKED'), source);
  }
  const [form, checked] = explainInstruction(translated('Affiche le champ x de p.'));
  assert.match(form.message, /le point s’applique à une structure, la flèche à un pointeur/iu);
  assert.match(form.message, /est exactement/u);
  assert.match(form.message, /n’en substitue jamais une à l’autre/u);
  assert.match(checked.message, /ni qu’elle possède ce champ/u);
  assert.match(checked.message, /Aucune déclaration n’est relue ici/u);
});

test('aucune information de structure sur les instructions voisines', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affiche la valeur de x.', numeric('a + 1'),
    'Déclare un pointeur de type int nommé p.', 'Affiche l’élément "0" de t.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['STRUCT_TAG_NEEDS_KEYWORD', 'STRUCT_LAYOUT', 'MEMBER_ACCESS_FORM', 'MEMBER_NOT_CHECKED']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 7. Hors périmètre, et ce qui n’est pas garanti
// ---------------------------------------------------------------------------

test('aucun typedef, aucune énumération, aucun champ de bits', () => {
  refused('Déclare un type nommé Point.', 'UNKNOWN_FORMULATION');
  refused('Déclare une énumération nommée Couleur.', 'UNKNOWN_FORMULATION');
  refused('Ajoute un champ de type int nommé x sur 3 bits.', 'UNEXPECTED_TEXT');
  refused('Déclare une union nommée Valeur.', 'UNKNOWN_FORMULATION');
});

test('aucune affectation globale de structure, aucune initialisation', () => {
  refused('Affecte la structure q à p.', 'UNKNOWN_FORMULATION');
  refused('Crée une variable de type structure Point nommée p avec le résultat de "1".', 'UNEXPECTED_TEXT');
  // C-A resolves no symbol: a struct-to-struct assignment written as two names
  // passes the historical envelope, and is legal C for structures.
  assert.equal(translated(numeric('q')).fragments[0].code, 'n = q;\n');
});

test('une forme acceptée ne garantit pas que le champ existe', () => {
  // Nothing is resolved: `p.inexistant` is translated and placed.
  assert.equal(translated(numeric('p.inexistant')).fragments[0].code, 'n = p.inexistant;\n');
  assert.ok(explainInstruction(translated(numeric('p.inexistant')))
    .some(entry => entry.code === 'MEMBER_NOT_CHECKED'));
  // And the two forms are never swapped, even if the sentence is wrong about
  // whether the object is a pointer.
  assert.equal(translated('Affiche le champ x pointé par p.').fragments[0].code, 'printf("%d", p->x);\n');
});

// ---------------------------------------------------------------------------
// 8. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Déclare un entier nommé x.', 'int x;\n'],
  ['Affiche la valeur de x.', 'printf("%d", x);\n'],
  ['Affecte à x le résultat de "a + 1".', 'x = (a + 1);\n'],
  [numeric('a & b'), undefined],
  ['Crée un aiguillage sur "jour".', 'switch (jour) {\n    \n}\n'],
  ['Affiche l’élément "i" de t.', 'printf("%d", t[i]);\n'],
  ['Affiche la valeur pointée par p.', 'printf("%d", *p);\n'],
  ['Affecte à n le résultat numérique de "*(t + i)".', 'n = (*(t + i));\n'],
  ['Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".', 'char s[6] = "hello";\n'],
]) {
  if (code === undefined) {
    test(`non-régression : ${source} reste refusée`, () => refused(source, 'UNSUPPORTED_EXPRESSION_OPERATOR'));
    continue;
  }
  test(`non-régression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
