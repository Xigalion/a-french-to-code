import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', `${source} aurait dû être traduite : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  return result;
}
function refused(source, code) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', `${source} aurait dû être refusée`);
  assert.equal(result.diagnostics[0].code, code, source);
  return result.diagnostics[0];
}
function applied(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

// ---------------------------------------------------------------------------
// 1. Les trois formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Inclue la bibliothèque assert.h.', '#include <assert.h>\n', 'INCLUDE_ASSERT'],
  ['Vérifie que "x > 0".', 'assert(x > 0);\n', 'ASSERT'],
  ['Déclare une constante de type int nommée MAX avec le résultat de "100".', 'const int MAX = 100;\n', 'CONST_DECL'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 25 sortie exacte : ${source.slice(0, 50)}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 25 sortie exacte sans point final : ${source.slice(0, 50)}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('VÉRIFIE QUE "x > 0".').fragments[0].code, 'assert(x > 0);\n');
  refused('Verifie que "x > 0".', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. L’assertion réutilise le profil condition du lot 10
// ---------------------------------------------------------------------------

for (const [condition, code] of [
  ['x > 0', 'assert(x > 0);\n'],
  ['p != 0 && n > 0', 'assert(((p != 0) && (n > 0)));\n'],
  ['!fini', 'assert((!fini));\n'],
  ['t[i] == 0', 'assert(t[i] == 0);\n'],
  ['p->x > 0', 'assert(p->x > 0);\n'],
  ['*p != 0', 'assert((*p) != 0);\n'],
  ["c == 'A'", "assert(c == 'A');\n"],
  ['n', 'assert(n);\n'],
]) {
  test(`condition d’assertion : ${condition}`, () => {
    assert.equal(translated(`Vérifie que "${condition}".`).fragments[0].code, code);
  });
}

test('l’assertion attrape le bug classique de l’affectation', () => {
  // `assert(x = 0)` is the mistake this refusal exists for, and the condition
  // profile of lot 10 already names it.
  refused('Vérifie que "x = 0".', 'ASSIGNMENT_IN_CONDITION');
  refused('Vérifie que "a == b == c".', 'CHAINED_COMPARISON');
  refused('Vérifie que "a & b".', 'UNSUPPORTED_CONDITION_OPERATOR');
});

test('diagnostics de l’assertion', () => {
  refused('Vérifie que.', 'MISSING_CONDITION');
  refused('Vérifie que x > 0.', 'MISSING_EXPRESSION_DELIMITER');
  refused('Vérifie que "x > 0.', 'UNTERMINATED_EXPRESSION');
  refused('Vérifie que "x > 0" encore.', 'UNEXPECTED_TEXT');
  refused('Vérifie "x > 0".', 'UNKNOWN_FORMULATION');
  refused('Vérifie que "1int".', 'UNSUPPORTED_NUMERIC_LITERAL');
});

test('un avertissement de calcul reste un avertissement dans une assertion', () => {
  // The condition of an assertion is a condition like any other, so the lot 8
  // advisories still apply to it.
  const advisories = analyzeCalculations(translated('Vérifie que "1 / 0 > 0".')).advisories;
  assert.equal(advisories.length, 1);
  assert.equal(advisories[0].code, 'INTEGER_ZERO_DIVISOR');
  assert.equal(advisories[0].severity, 'warning');
});

// ---------------------------------------------------------------------------
// 3. Constantes
// ---------------------------------------------------------------------------

for (const type of ['int', 'unsigned int', 'float', 'double', 'char']) {
  test(`constante de type ${type}`, () => {
    assert.equal(translated(`Déclare une constante de type ${type} nommée C avec le résultat de "1".`).fragments[0].code,
      `const ${type} C = 1;\n`);
  });
}
for (const type of ['long', 'short', 'unsigned char', 'void']) {
  test(`type de constante hors catalogue : ${type}`, () => {
    refused(`Déclare une constante de type ${type} nommée C avec le résultat de "1".`, 'UNSUPPORTED_NUMERIC_TYPE');
  });
}
for (const [expression, code] of [['100', 'const int MAX = 100;\n'], ['2 * 50', 'const int MAX = (2 * 50);\n'],
  ['n + 1', 'const int MAX = (n + 1);\n'], ['(int) 1.5', 'const int MAX = ((int) 1.5);\n']]) {
  test(`expression de constante : ${expression}`, () => {
    assert.equal(translated(`Déclare une constante de type int nommée MAX avec le résultat de "${expression}".`)
      .fragments[0].code, code);
  });
}
test('diagnostics de la constante', () => {
  refused('Déclare une constante de type int nommée MAX.', 'INCOMPLETE_INSTRUCTION');
  refused('Déclare une constante de type int nommée MAX avec le résultat de.', 'MISSING_EXPRESSION');
  refused('Déclare une constante de type int nommée 1MAX avec le résultat de "1".', 'INVALID_IDENTIFIER');
  refused('Déclare une constante de type nommée MAX avec le résultat de "1".', 'MISSING_NUMERIC_TYPE');
  refused('Déclare une constante nommée MAX avec le résultat de "1".', 'UNKNOWN_FORMULATION');
  refused('Déclare une constante de type int MAX avec le résultat de "1".', 'UNKNOWN_FORMULATION');
  refused('Déclare une constante de type int nommée MAX de valeur "1".', 'UNKNOWN_FORMULATION');
});
test('la déclaration de variable du lot 7 est intacte', () => {
  assert.equal(translated('Déclare une variable de type int nommée x.').fragments[0].code, 'int x;\n');
  assert.equal(translated('Crée une variable de type int nommée x avec le résultat de "1".').fragments[0].code,
    'int x = 1;\n');
});

// ---------------------------------------------------------------------------
// 4. Informations pédagogiques
// ---------------------------------------------------------------------------

test('les deux informations de l’assertion', () => {
  const source = 'Vérifie que "x > 0".';
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code), ['ASSERT_DISABLED_BY_NDEBUG', 'ASSERT_NOT_ERROR_HANDLING']);
  // The condition of an assertion is a condition: the lot 10 operator
  // informations apply to it, after the two facts about assert itself.
  assert.deepEqual(explainInstruction(translated('Vérifie que "a && b".')).map(entry => entry.code),
    ['ASSERT_DISABLED_BY_NDEBUG', 'ASSERT_NOT_ERROR_HANDLING', 'SHORT_CIRCUIT_AND']);
  assert.equal(source.slice(entries[0].range.start, entries[0].range.end), '"x > 0"');
  assert.match(entries[0].message, /disparaît entièrement si NDEBUG est défini/u);
  assert.match(entries[0].message, /n’est alors même pas évaluée/u);
  assert.match(entries[0].message, /jamais un calcul dont le programme a besoin/u);
  assert.match(entries[1].message, /erreur de programmation pendant la mise au point/u);
  assert.match(entries[1].message, /pas à traiter une erreur d’exécution attendue/u);
  assert.match(entries[1].message, /par une condition ordinaire/u);
  for (const entry of entries) assert.equal(entry.severity, 'information');
});

test('CONST_IS_NOT_A_MACRO distingue le qualificatif de la macro', () => {
  const [entry] = explainInstruction(translated('Déclare une constante de type int nommée MAX avec le résultat de "1".'));
  assert.equal(entry.code, 'CONST_IS_NOT_A_MACRO');
  assert.match(entry.message, /const qualifie un type/u);
  assert.match(entry.message, /il a une adresse et un type/u);
  assert.match(entry.message, /remplacement de texte/u);
  assert.match(entry.message, /comportement indéfini/u);
  assert.match(entry.message, /C-A ne vérifie aucun chemin/u);
});

test('l’inclusion d’assert.h ne porte aucune information', () => {
  // It states nothing the two assertion informations do not already say.
  assert.deepEqual(explainInstruction(translated('Inclue la bibliothèque assert.h.')), []);
});

test('aucune information du lot 25 sur les instructions voisines', () => {
  for (const source of ['Crée un bloc si "x > 0".', 'Déclare une variable de type int nommée x.',
    'Inclue la bibliothèque stdio.h.', 'Crée une boucle tant que "x > 0".']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['ASSERT_DISABLED_BY_NDEBUG', 'ASSERT_NOT_ERROR_HANDLING', 'CONST_IS_NOT_A_MACRO']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 5. Le conflit avec un instantané figé, et ce qui en découle
// ---------------------------------------------------------------------------

test('limits.h et float.h restent refusés, parce qu’un instantané les gèle', () => {
  // `test/lot6-compatibility.json` freezes both as refusals. Accepting them
  // would mean amending a frozen contract, which is a founder decision.
  // `assert.h` is not in any snapshot, which is why it could be delivered.
  for (const header of ['limits.h', 'float.h']) {
    const diagnostic = refused(`Inclue la bibliothèque ${header}.`, 'UNSUPPORTED_HEADER');
    assert.equal(diagnostic.message, 'Seul l’en-tête stdio.h, écrit exactement ainsi, est pris en charge.');
  }
  // And no formulation produces a limit macro, since its header cannot be
  // included: shipping one would produce C that cannot compile.
  for (const source of ['Affiche la limite maximale du type int.', 'Affiche la limite minimale du type int.',
    'Affecte à n la limite maximale du type int.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('les trois en-têtes livrés, et eux seuls', () => {
  for (const [header, code] of [['stdio.h', '#include <stdio.h>\n'], ['stdlib.h', '#include <stdlib.h>\n'],
    ['assert.h', '#include <assert.h>\n']]) {
    assert.equal(translated(`Inclue la bibliothèque ${header}.`).fragments[0].code, code);
  }
  for (const header of ['string.h', 'stddef.h', 'math.h', 'time.h', 'errno.h', 'stdint.h']) {
    refused(`Inclue la bibliothèque ${header}.`, 'UNSUPPORTED_HEADER');
  }
});

// ---------------------------------------------------------------------------
// 6. Hors périmètre
// ---------------------------------------------------------------------------

test('aucun test automatisé, aucun débogage, aucune mesure', () => {
  for (const source of ['Écris un test de la fonction somme.', 'Active le débogage.',
    'Mesure le temps de la fonction somme.', 'Compte les appels de la fonction somme.',
    'Vérifie la couverture du fichier.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('aucune vérification que l’assertion est atteignable ou vraie', () => {
  // A condition that is always false is translated as written.
  assert.equal(translated('Vérifie que "0".').fragments[0].code, 'assert(0);\n');
  // And assert.h is never added on its own.
  assert.ok(!translated('Vérifie que "x > 0".').fragments[0].code.includes('#include'));
});

// ---------------------------------------------------------------------------
// 7. Placement et séquence complète
// ---------------------------------------------------------------------------

test('une fonction défensive, document final exact', () => {
  let document = applied('\n', 'Inclue la bibliothèque assert.h.', 0);
  document += '\n';
  document = applied(document, 'Crée une fonction nommée moyenne qui retourne un int et prend un int nommé n.',
    document.length - 1);
  let at = document.indexOf('\n    \n') + 1 + 4;
  for (const source of ['Vérifie que "n > 0".',
    'Déclare une constante de type int nommée TOTAL avec le résultat de "100".',
    'Retourne le résultat numérique de "TOTAL / n".']) {
    document = applied(document, source, at);
    at = document.indexOf('\n    \n') + 1 + 4;
  }
  assert.equal(document, '// Inclue la bibliothèque assert.h.\n#include <assert.h>\n\n'
    + '// Crée une fonction nommée moyenne qui retourne un int et prend un int nommé n.\nint moyenne(int n) {\n'
    + '    // Vérifie que "n > 0".\n    assert(n > 0);\n'
    + '    // Déclare une constante de type int nommée TOTAL avec le résultat de "100".\n    const int TOTAL = 100;\n'
    + '    // Retourne le résultat numérique de "TOTAL / n".\n    return (TOTAL / n);\n'
    + '    \n}\n');
});

for (const [label, text, offset] of [
  ['document vide', '', 0],
  ['dans une fonction, indentée', 'int main(void) {\n    \n}\n', 21],
  ['CRLF', 'int main(void) {\r\n    \r\n}\r\n', 22],
]) {
  test(`placement d’une assertion ${label}`, () => {
    const result = applied(text, 'Vérifie que "x > 0".', offset);
    assert.ok(result.includes('assert(x > 0);'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

// ---------------------------------------------------------------------------
// 8. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Crée un bloc si "x > 0".', 'if (x > 0) {\n    \n}\n'],
  ['Crée une boucle tant que "x > 0".', 'while (x > 0) {\n    \n}\n'],
  ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
  ['Inclue la bibliothèque stdlib.h.', '#include <stdlib.h>\n'],
  ['Déclare une variable de type double nommée x.', 'double x;\n'],
  ['Déclare la variable externe de type int nommée v.', 'extern int v;\n'],
  ['Déclare le synonyme Noeud pour la structure Noeud.', 'typedef struct Noeud Noeud;\n'],
  ['Affecte à p l’allocation de 4 éléments de type int.', 'p = malloc(4 * sizeof(int));\n'],
]) {
  test(`non-régression : ${source.slice(0, 55)}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
