import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';

function success(input) {
  const result = translate(input);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.source.text, input);
  assert.equal(result.fragments.length, 1);
  const fragment = result.fragments[0];
  assert.equal(fragment.comment, `// ${input}`);
  assert.equal(fragment.text, `${fragment.comment}\n${fragment.code}`);
  assert.ok(fragment.code.endsWith('\n'));
  return result;
}

function rejected(input, code, range) {
  const result = translate(input);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.deepEqual(Object.keys(result).sort(), ['diagnostics', 'source', 'status']);
  assert.equal(result.source.text, input);
  assert.equal(result.diagnostics.length, 1);
  const diagnostic = result.diagnostics[0];
  assert.equal(diagnostic.code, code);
  assert.equal(diagnostic.category, 'understanding');
  assert.equal(diagnostic.severity, 'error');
  assert.ok(diagnostic.message.length > 0);
  assert.ok(diagnostic.range.start >= 0);
  assert.ok(diagnostic.range.end >= diagnostic.range.start);
  assert.ok(diagnostic.range.end <= input.length);
  if (range) assert.deepEqual(diagnostic.range, range);
  return result;
}

const examples = [
  ['Crée la fonction principale', 'MAIN', {}, 'int main(void) {\n    \n}\n'],
  ['Déclare un entier nommé age', 'DECL_INT', { name: 'age' }, 'int age;\n'],
  ['Crée un entier nommé age de valeur 20', 'INIT_INT', { name: 'age', value: '20' }, 'int age = 20;\n'],
  ['Affecte la valeur 25 à age', 'ASSIGN_INT', { name: 'age', value: '25' }, 'age = 25;\n'],
];

for (const [phrase, kind, parameters, code] of examples) {
  for (const period of ['', '.']) {
    test(`${kind}: sortie exacte, point ${period ? 'présent' : 'absent'}`, () => {
      const input = phrase + period;
      const result = success(input);
      assert.deepEqual(result.instruction, { kind, parameters });
      assert.equal(result.fragments[0].code, code);
      assert.equal(result.fragments[0].text, `// ${input}\n${code}`);
    });
  }
  test(`${kind}: mots fixes en majuscules`, () => {
    const input = phrase.toUpperCase();
    const result = success(input);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code.replaceAll('age', 'AGE'));
  });
  test(`${kind}: tabulations et conservation intégrale`, () => {
    const input = '\t  ' + phrase.replaceAll(' ', '\t \t') + '. \t';
    assert.equal(success(input).fragments[0].code, code);
  });
}

test('MAIN: curseur relatif après quatre espaces de la ligne intérieure', () => {
  const input = '\tCrÉe LA fonction PRINCIPALE\t';
  const fragment = success(input).fragments[0];
  assert.equal(fragment.cursor.offset, `// ${input}\nint main(void) {\n    `.length);
  assert.equal(fragment.text.slice(fragment.cursor.offset), '\n}\n');
  assert.ok(!fragment.code.includes('return'));
});

for (const name of ['a', 'Age', 'age', 'nombre_2', 'A0_', 'Int', 'MAIN', 'printf']) {
  test(`identifiant conservé: ${name}`, () => {
    assert.equal(success(`dÉcLaRe Un EnTiEr NoMmÉ ${name}`).fragments[0].code, `int ${name};\n`);
  });
}

// Independent full C17 keyword fixture, including the underscore-prefixed words.
const keywords = `auto break case char const continue default do double else enum extern
float for goto if inline int long register restrict return short signed sizeof static
struct switch typedef union unsigned void volatile while _Alignas _Alignof _Atomic
_Bool _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local`.split(/\s+/);
for (const keyword of keywords) {
  test(`mot-clé C17 refusé: ${keyword}`, () => {
    rejected(`Déclare un entier nommé ${keyword}.`, 'C_KEYWORD_IDENTIFIER', { start: 24, end: 24 + keyword.length });
  });
}

for (const name of ['_age', '2age', 'âge', 'a-b', 'a.b', '😀']) {
  test(`nom invalide: ${name}`, () => {
    rejected(`Déclare un entier nommé ${name}.`, 'INVALID_IDENTIFIER', { start: 24, end: 24 + name.length });
  });
}

for (const value of ['0', '-1', '32768', '-2147483649', '9007199254740993', '9'.repeat(500)]) {
  test(`entier préservé sans conversion: ${value.slice(0, 24)}`, () => {
    const init = success(`Crée un entier nommé Valeur de valeur ${value}`);
    const assign = success(`Affecte la valeur ${value} à inconnu.`);
    assert.deepEqual(init.instruction.parameters, { name: 'Valeur', value });
    assert.equal(init.fragments[0].code, `int Valeur = ${value};\n`);
    assert.equal(assign.fragments[0].code, `inconnu = ${value};\n`);
  });
}

for (const value of ['-0', '+5', '020', '00', '2.5', '2,5', 'vingt', '0x10', '1e3', '--1', '１２']) {
  test(`entier hors grammaire: ${value}`, () => {
    const prefix = 'Affecte la valeur ';
    rejected(`${prefix}${value} à age`, 'INVALID_INTEGER', { start: prefix.length, end: prefix.length + value.length });
  });
}

for (const input of ['', '   ', '\t \t']) {
  test(`saisie vide: ${JSON.stringify(input)}`, () => {
    rejected(input, 'EMPTY_INPUT', { start: input.length, end: input.length });
  });
}

for (const separator of ['\n', '\r', '\r\n', '\v', '\f', '\u00a0', '\u2028', '\u2029', '\ufeff']) {
  test(`séparateur interdit: ${JSON.stringify(separator)}`, () => {
    const input = `Crée${separator}la fonction principale`;
    rejected(input, 'INVALID_SEPARATOR', { start: 4, end: 5 });
  });
}

for (const input of [
  'Crée', 'Crée la fonction', 'Déclare un entier nommé',
  'Crée un entier nommé age de valeur', 'Affecte la valeur 25 à',
]) {
  test(`phrase incomplète: ${input}`, () => {
    rejected(input, 'INCOMPLETE_INSTRUCTION', { start: input.length, end: input.length });
  });
}

test('absence avant point final et espaces : position originale', () => {
  rejected('  Déclare un entier nommé.\t ', 'INCOMPLETE_INSTRUCTION', { start: 25, end: 25 });
});

for (const input of [
  'Bonjour', 'Declare un entier nommé age', 'Crée la procédure principale',
  'Montre la valeur de age.', 'Déclare un entier appelé age',
  'Crée une fonction nommée test sans paramètre retournant un entier.',
  'Cre\u0301e la fonction principale',
]) {
  test(`formulation inconnue: ${input}`, () => { rejected(input, 'UNKNOWN_FORMULATION'); });
}

for (const suffix of [' puis affiche age', ' .', ' !', ' // commentaire', ' \\', ' 😀']) {
  test(`suffixe refusé sans traduction partielle: ${suffix}`, () => {
    rejected(`Crée la fonction principale${suffix}`, 'UNEXPECTED_TEXT');
  });
}

test('deux phrases sur une même ligne : aucun fragment partiel', () => {
  rejected('Déclare un entier nommé age. Affecte la valeur 25 à age.', 'INVALID_IDENTIFIER');
});

test('ponctuation doublée refusée', () => {
  rejected('Crée la fonction principale..', 'UNKNOWN_FORMULATION', { start: 17, end: 28 });
});

test('ponctuation interdite attachée au mot fixe', () => {
  rejected('Crée la fonction principale;', 'UNKNOWN_FORMULATION', { start: 17, end: 28 });
});

test('intervalles UTF-16 avec caractère astral invalide', () => {
  rejected('Déclare un entier nommé 😀.', 'INVALID_IDENTIFIER', { start: 24, end: 26 });
  rejected('😀\n', 'INVALID_SEPARATOR', { start: 2, end: 3 });
});

test('positions après tabulations et espaces sans normalisation', () => {
  const input = '\t Déclare\t un  entier nommé\t2age. \t';
  rejected(input, 'INVALID_IDENTIFIER', { start: input.indexOf('2age'), end: input.indexOf('2age') + 4 });
});

test('suffixe supplémentaire : intervalle complet', () => {
  const input = 'Crée la fonction principale puis autre chose.';
  rejected(input, 'UNEXPECTED_TEXT', { start: 28, end: input.length - 1 });
});

test('paramètres validés dans chaque rôle du catalogue', () => {
  rejected('Crée un entier nommé int de valeur 2', 'C_KEYWORD_IDENTIFIER');
  rejected('Affecte la valeur 2 à int', 'C_KEYWORD_IDENTIFIER');
  rejected('Crée un entier nommé _age de valeur 2', 'INVALID_IDENTIFIER');
  rejected('Affecte la valeur 2 à _age', 'INVALID_IDENTIFIER');
  rejected('Crée un entier nommé age de valeur +2', 'INVALID_INTEGER');
});

test('absence de point n’autorise pas les suffixes dangereux dans le commentaire', () => {
  rejected('Déclare un entier nommé age\\', 'INVALID_IDENTIFIER');
  rejected('Déclare un entier nommé age??/', 'INVALID_IDENTIFIER');
  rejected('Crée la fonction principale\\', 'UNKNOWN_FORMULATION');
});

test('un diagnostic de séparateur interdit est prioritaire', () => {
  rejected('inconnu\n', 'INVALID_SEPARATOR', { start: 7, end: 8 });
});

test('aucune vérification de variable ou ajout de contexte', () => {
  const code = success('Affecte la valeur -25 à inconnu').fragments[0].code;
  assert.equal(code, 'inconnu = -25;\n');
  assert.ok(!code.includes('main') && !code.includes('#include'));
});

test('résultats déterministes et sérialisables', () => {
  for (const input of [...examples.map(example => example[0]), 'Déclare un entier nommé 😀', 'inconnu']) {
    const result = translate(input);
    for (let i = 0; i < 5; i++) assert.deepEqual(translate(input), result);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  }
});

test('les appels ne partagent aucun résultat mutable', () => {
  const original = translate('Déclare un entier nommé age');
  const modified = translate('Déclare un entier nommé age');
  modified.fragments[0].code = 'altéré';
  modified.instruction.parameters.name = 'autre';
  assert.deepEqual(translate('Déclare un entier nommé age'), original);
});

// Regression coverage for raw comments: a valid prefix never licenses a suffix.
for (const [phrase, kind] of examples) {
  for (const suffix of ['\\', ' \\ \t', '??/', ' /*', ' */', ' // code', '\r\nint injected;', '\u0000']) {
    test(`${kind}: suffixe dangereux refusé ${JSON.stringify(suffix)}`, () => {
      const result = translate(phrase + suffix);
      assert.equal(result.status, 'rejected');
      assert.ok(!Object.hasOwn(result, 'fragments'));
      assert.ok(!Object.hasOwn(result, 'instruction'));
    });
  }
  test(`${kind}: séparation autonome du commentaire et du code`, () => {
    const input = '\t' + phrase.toUpperCase().replaceAll(' ', '\t') + '\t ';
    const fragment = success(input).fragments[0];
    assert.equal(fragment.text.split('\n')[0], `// ${input}`);
    assert.equal(fragment.text.slice(fragment.comment.length + 1), fragment.code);
    assert.ok(!/[\r\n\\]/u.test(fragment.comment));
    assert.ok(!fragment.comment.includes('??/'));
    assert.ok(!fragment.comment.includes('/*') && !fragment.comment.includes('*/'));
  });
}

for (const name of ['e\u0301', 'A😀B', '\ud800', '\udc00', 'a\u200db', 'a\u202eb', 'a\u0085b', '\\u0061']) {
  test(`diagnostic Unicode sans normalisation: ${JSON.stringify(name)}`, () => {
    const input = `Déclare un entier nommé ${name}.`;
    const result = rejected(input, 'INVALID_IDENTIFIER', { start: 24, end: 24 + name.length });
    const { start, end } = result.diagnostics[0].range;
    assert.equal(input.slice(start, end), name);
  });
}

test('accent décomposé dans un mot fixe : intervalle original complet', () => {
  const input = 'Cre\u0301e la fonction principale';
  rejected(input, 'UNKNOWN_FORMULATION', { start: 0, end: 5 });
});

test('séparateur après plusieurs caractères astraux : offsets UTF-16', () => {
  rejected('😀😀\u2028', 'INVALID_SEPARATOR', { start: 4, end: 5 });
});

test('suffixe astral : intervalle original avec point exclu', () => {
  rejected('Crée la fonction principale 😀😀.', 'UNEXPECTED_TEXT', { start: 28, end: 32 });
});

test('mot manquant après tabulations : insertion avant le point', () => {
  const input = '\tAffecte\tla valeur 25 à.\t';
  const position = input.indexOf('.');
  rejected(input, 'INCOMPLETE_INSTRUCTION', { start: position, end: position });
});

test('entiers positifs et négatifs de 4096 chiffres : conservation exacte', () => {
  for (const value of ['7'.repeat(4096), '-' + '9'.repeat(4096)]) {
    for (const input of [`Crée un entier nommé n de valeur ${value}.`, `Affecte la valeur ${value} à n`]) {
      const result = success(input);
      assert.equal(result.instruction.parameters.value, value);
      assert.ok(result.fragments[0].code.includes(value + ';'));
      assert.equal(typeof result.instruction.parameters.value, 'string');
    }
  }
});

test('casse des identifiants réservés : int refusé mais INT conservé', () => {
  rejected('DÉCLARE UN ENTIER NOMMÉ int', 'C_KEYWORD_IDENTIFIER', { start: 24, end: 27 });
  assert.equal(success('DÉCLARE UN ENTIER NOMMÉ INT').fragments[0].code, 'int INT;\n');
});
