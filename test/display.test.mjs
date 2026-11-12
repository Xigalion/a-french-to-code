import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';

const valid = [
  ['Inclue la bibliothèque stdio.h.', 'INCLUDE_STDIO', '#include <stdio.h>\n', {}],
  ['\tINCLUE\tLA BIBLIOTHÈQUE stdio.h\t', 'INCLUDE_STDIO', '#include <stdio.h>\n', {}],
  ['Affiche la valeur de Age.', 'PRINT_INT', 'printf("%d", Age);\n', { name: 'Age' }],
  ['affiche\tLA\tvaleur DE age', 'PRINT_INT', 'printf("%d", age);\n', { name: 'age' }],
  ['Affiche le texte "".', 'PRINT_TEXT', 'printf("%s", "");\n', { text: '' }],
  ['Affiche le texte "été 😀 100 % %n"', 'PRINT_TEXT', 'printf("%s", "été 😀 100 % %n");\n', { text: 'été 😀 100 % %n' }],
  ['\tAFFICHE\tle TEXTE "  Bonjour.  ". \t', 'PRINT_TEXT', 'printf("%s", "  Bonjour.  ");\n', { text: '  Bonjour.  ' }],
  [String.raw`Affiche le texte "Il dit \"oui\" : C:\\tmp\n\t".`, 'PRINT_TEXT', 'printf("%s", "Il dit \\"oui\\" : C:\\\\tmp\\n\\t");\n', { text: 'Il dit "oui" : C:\\tmp\n\t' }],
  ['Affiche le texte "a\u00a0b\ufeffc"', 'PRINT_TEXT', 'printf("%s", "a\u00a0b\ufeffc");\n', { text: 'a\u00a0b\ufeffc' }],
  ['Affiche le texte "// /* */ #include <x>"', 'PRINT_TEXT', 'printf("%s", "// /* */ #include <x>");\n', { text: '// /* */ #include <x>' }],
];
for (const [source, kind, code, parameters] of valid) {
  test(`lot 4 traduit exactement ${JSON.stringify(source)}`, () => {
    const result = translate(source);
    assert.equal(result.status, 'translated', JSON.stringify(result));
    assert.deepEqual(result.instruction, { kind, parameters });
    assert.equal(result.fragments.length, 1);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].comment, '// ' + source);
    assert.equal(result.fragments[0].text, '// ' + source + '\n' + code);
    assert.deepEqual(translate(source), result);
  });
  test(`lot 4 commentaire sûr pour insertion suivante ${JSON.stringify(source)}`, () => {
    const first = planPlacement({ document: { id: 'safe.c', revision: 0, text: '' }, cursorOffset: 0, translation: translate(source) });
    assert.equal(first.status, 'planned');
    const text = first.plan.edits[0].newText;
    const next = planPlacement({ document: { id: 'safe.c', revision: 1, text }, cursorOffset: first.plan.cursorAfter, translation: translate('Déclare un entier nommé suivant') });
    assert.equal(next.status, 'planned', JSON.stringify(next));
    assert.equal(text.slice(first.plan.cursorAfter), '\n');
  });
}

const invalid = [
  ['Inclue la bibliothèque STDIO.H.', 'UNSUPPORTED_HEADER', 'STDIO.H'],
  ['Inclue la bibliothèque <stdio.h>.', 'UNSUPPORTED_HEADER', '<stdio.h>'],
  ['Inclue la bibliothèque math.h', 'UNSUPPORTED_HEADER', 'math.h'],
  ['Inclue la bibliothèque', 'INCOMPLETE_INSTRUCTION', ''],
  ['Affiche la valeur de int', 'C_KEYWORD_IDENTIFIER', 'int'],
  ['Affiche la valeur de âge', 'INVALID_IDENTIFIER', 'âge'],
  ['Affiche la valeur de', 'INCOMPLETE_INSTRUCTION', ''],
  ['Affiche la valeur de age avec stdio.h', 'UNEXPECTED_TEXT', 'avec stdio.h'],
  ['Affiche le texte', 'INCOMPLETE_INSTRUCTION', ''],
  ['Affiche le texte bonjour', 'UNKNOWN_FORMULATION', 'b'],
  ['Affiche le texte 😀', 'UNKNOWN_FORMULATION', '😀'],
  [String.raw`Affiche le texte "été \😀"`, 'INVALID_STRING_ESCAPE', '\\😀'],
  ['Affiche le texte "été 😀', 'UNTERMINATED_STRING', '"été 😀'],
  [String.raw`Affiche le texte "été 😀\q"`, 'INVALID_STRING_ESCAPE', String.raw`\q`],
  ['Affiche le texte "abc\\', 'INVALID_STRING_ESCAPE', '\\'],
  ['Affiche le texte "a\tb"', 'UNSUPPORTED_STRING_CONTENT', '\t'],
  ['Affiche le texte "a\0b"', 'UNSUPPORTED_STRING_CONTENT', '\0'],
  ['Affiche le texte "a\u007fb"', 'UNSUPPORTED_STRING_CONTENT', '\u007f'],
  ['Affiche le texte "a\u0085b"', 'UNSUPPORTED_STRING_CONTENT', '\u0085'],
  ['Affiche le texte "a\ud800b"', 'UNSUPPORTED_STRING_CONTENT', '\ud800'],
  ['Affiche le texte "a\udc00b"', 'UNSUPPORTED_STRING_CONTENT', '\udc00'],
  ['Affiche le texte "a\nb"', 'INVALID_SEPARATOR', '\n'],
  ['Affiche le texte "a\r\nb"', 'INVALID_SEPARATOR', '\r'],
  ['Affiche le texte "a\u2028b"', 'INVALID_SEPARATOR', '\u2028'],
  ['Affiche le texte "a\u2029b"', 'INVALID_SEPARATOR', '\u2029'],
  ['Affiche le texte "ok" autre', 'UNEXPECTED_TEXT', 'autre'],
  ['Affiche le texte "ok" .', 'UNEXPECTED_TEXT', '.'],
  ['Affiche le texte "ok"..', 'UNEXPECTED_TEXT', '..'],
];
for (const sourceEscape of ['r', '0', 'x41', 'u0041', '?']) {
  invalid.push([`Affiche le texte "\\${sourceEscape}"`, 'INVALID_STRING_ESCAPE', '\\' + sourceEscape[0]]);
}
for (const final of ['=', '/', "'", '(', ')', '!', '<', '>', '-']) {
  invalid.push([`Affiche le texte "😀 ??${final}"`, 'UNSUPPORTED_STRING_CONTENT', '??' + final]);
}
for (const [source, code, token] of invalid) {
  test(`lot 4 refuse sans fragment ${JSON.stringify(source)}`, () => {
    const result = translate(source);
    assert.equal(result.status, 'rejected', JSON.stringify(result));
    assert.ok(!('fragments' in result));
    assert.equal(result.diagnostics[0].code, code);
    const start = token === '' ? source.length : source.lastIndexOf(token);
    assert.deepEqual(result.diagnostics[0].range, { start, end: start + token.length });
    assert.deepEqual(translate(source), result);
  });
}

export function example(eol = '\n') {
  let document = { id: 'example.c', revision: 0, text: '' };
  let cursorOffset = 0;
  const phrases = [
    'Inclue la bibliothèque stdio.h.', 'Inclue la bibliothèque stdio.h.',
    'Crée la fonction principale.', 'Crée un entier nommé age de valeur 20.',
    'Affiche le texte "Âge : ".', 'Affiche la valeur de age.',
    String.raw`Affiche le texte "\n".`,
  ];
  for (const phrase of phrases) {
    const translation = translate(phrase);
    const result = planPlacement({ document, cursorOffset, translation, fallbackEol: eol });
    assert.equal(result.status, 'planned', JSON.stringify(result));
    assert.deepEqual(planPlacement({ document, cursorOffset, translation, fallbackEol: eol }), result);
    const { plan } = result;
    assert.equal(validatePlan(plan, document).status, 'current');
    assert.equal(plan.edits.length, 1);
    const edit = plan.edits[0];
    const text = document.text.slice(0, edit.range.start) + edit.newText + document.text.slice(edit.range.end);
    document = { ...document, revision: document.revision + 1, text };
    assert.equal(validatePlan(plan, document).status, 'rejected');
    cursorOffset = plan.cursorAfter;
    assert.ok(cursorOffset >= 0 && cursorOffset <= text.length);
  }
  return { document, cursorOffset };
}
for (const eol of ['\n', '\r\n']) {
  test(`lot 4 parcours complet et inclusions répétées ${JSON.stringify(eol)}`, () => {
    const { document, cursorOffset } = example(eol);
    const expected = '// Inclue la bibliothèque stdio.h.\n#include <stdio.h>\n// Inclue la bibliothèque stdio.h.\n#include <stdio.h>\n// Crée la fonction principale.\nint main(void) {\n    // Crée un entier nommé age de valeur 20.\n    int age = 20;\n    // Affiche le texte "Âge : ".\n    printf("%s", "Âge : ");\n    // Affiche la valeur de age.\n    printf("%d", age);\n    // Affiche le texte "\\n".\n    printf("%s", "\\n");\n    \n}\n'.replaceAll('\n', eol);
    assert.equal(document.text, expected);
    assert.equal(document.text.slice(cursorOffset), eol + '}' + eol);
  });
}
for (const phrase of ['Affiche la valeur de absent.', 'Affiche le texte "😀".', 'Inclue la bibliothèque stdio.h.']) {
  test(`lot 4 placement fidèle et invariants : ${phrase}`, () => {
    const translation = translate(phrase);
    const request = { document: { id: 'x.c', revision: 0, text: '' }, cursorOffset: 0, translation };
    const result = planPlacement(request);
    assert.equal(result.status, 'planned');
    const code = result.plan.edits[0].newText;
    if (!phrase.startsWith('Inclue')) assert.ok(!code.includes('#include'));
    translation.fragments[0].code += 'int injection;\n';
    assert.equal(planPlacement(request).diagnostics[0].code, 'INVALID_TRANSLATION_RESULT');
  });
}

// Lot 5: explicit formats and pedagogical refusals.
import { readFileSync } from 'node:fs';
for (const { source, result } of JSON.parse(readFileSync(new URL('./lot4-compatibility.json', import.meta.url), 'utf8'))) {
  test(`lot 5 compatibilité exacte : ${JSON.stringify(source)}`, () => assert.deepEqual(translate(source), result));
}
const formats = [['décimal', 'decimal', '%d'], ['hexadécimal', 'hexadecimal', '%x'], ['octal', 'octal', '%o']];
for (const [word, format, specifier] of formats) {
  for (const name of ['age', 'Age_2', 'absent', 'la', 'le', 'en', 'Int', 'printf']) {
    for (const source of [`Affiche ${name} en ${word}`, `Affiche ${name} en ${word}.`, `\t AFFiCHE\t ${name}\t EN  ${word.toUpperCase()}. \t`]) {
      test(`lot 5 format exact : ${JSON.stringify(source)}`, () => {
        const result = translate(source);
        assert.equal(result.status, 'translated');
        assert.deepEqual(result.instruction, { kind: 'PRINT_FORMATTED', parameters: { name, format } });
        assert.deepEqual(result.diagnostics, []);
        assert.equal(result.source.text, source);
        assert.deepEqual(result.fragments, [{ id: 'fragment-1', role: 'primary', comment: '// ' + source,
          code: `printf("${specifier}", ${name});\n`, text: `// ${source}\nprintf("${specifier}", ${name});\n` }]);
        assert.deepEqual(translate(source), result);
      });
    }
  }
  for (const eol of ['\n', '\r\n']) {
    test(`lot 5 placement ${format} ${JSON.stringify(eol)}`, () => {
      const prefix = '// é😀' + eol + 'int main(void) {' + eol;
      const text = prefix + '    ' + eol + '}' + eol;
      const translation = translate(`Affiche absent en ${word}.`);
      const request = { document: { id: 'formats.c', revision: 1, text }, cursorOffset: prefix.length + 4, translation };
      const result = planPlacement(request);
      assert.equal(result.status, 'planned');
      const edit = result.plan.edits[0];
      const after = text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
      assert.equal(after, prefix + `    // Affiche absent en ${word}.` + eol + `    printf("${specifier}", absent);` + eol + '    ' + eol + '}' + eol);
      assert.equal(after.slice(result.plan.cursorAfter), eol + '}' + eol);
      const next = planPlacement({ document: { id: 'formats.c', revision: 2, text: after }, cursorOffset: result.plan.cursorAfter, translation });
      assert.equal(next.status, 'planned');
      for (const tamper of [value => { value.fragments[0].code += 'int injection;\n'; },
        value => { value.instruction.parameters.format = 'octal' === format ? 'decimal' : 'octal'; },
        value => { value.fragments[0].comment = '// modifié'; }]) {
        const altered = structuredClone(translation);
        tamper(altered);
        assert.equal(planPlacement({ ...request, translation: altered }).diagnostics[0].code, 'INVALID_TRANSLATION_RESULT');
      }
    });
  }
}
const missingMessage = 'Il manque le format d’affichage.';
const unsupportedMessage = 'Ce format d’affichage n’est pas pris en charge.';
const refusalCases = [
  ['Affiche age.', 'MISSING_DISPLAY_FORMAT', missingMessage, 11, 11],
  ['Affiche age en.', 'MISSING_DISPLAY_FORMAT', missingMessage, 14, 14],
  ['\t Affiche\tAge \t . \t', 'UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', 16, 17],
  ['\t Affiche\tAge. \t', 'MISSING_DISPLAY_FORMAT', missingMessage, 13, 13],
  ['Affiche en décimal.', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom à afficher.', 8, 8],
  ['Affiche age décimal.', 'UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', 12, 19],
];
for (const word of ['binaire', 'decimal', 'hexadecimal', 'hexa', 'de\u0301cimal', '😀', 'octal..', 'octal;']) {
  const token = word === 'octal..' ? 'octal.' : word;
  refusalCases.push([`Affiche age en ${word}`, 'UNSUPPORTED_DISPLAY_FORMAT', unsupportedMessage, 15, 15 + token.length]);
}
for (const word of ['la', 'le', 'en']) {
  refusalCases.push([`Affiche ${word} en.`, 'MISSING_DISPLAY_FORMAT', missingMessage, `Affiche ${word} en`.length, `Affiche ${word} en`.length]);
  refusalCases.push([`Affiche ${word} en binaire.`, 'UNSUPPORTED_DISPLAY_FORMAT', unsupportedMessage, `Affiche ${word} en `.length, `Affiche ${word} en binaire`.length]);
}
for (const name of ['_age', '2age', 'âge', 'a-b', 'a.b', '😀', 'a😀', '\ud800', 'a\u200bb', 'a\\', 'a??/']) {
  for (const suffix of ['.', ' en octal.']) refusalCases.push([`Affiche ${name}${suffix}`, 'INVALID_IDENTIFIER',
    'Le nom doit commencer par une lettre ASCII et contenir uniquement lettres ASCII, chiffres ou soulignements.', 8, 8 + name.length]);
}
for (const name of `auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Alignas _Alignof _Atomic _Bool _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local`.split(' ')) {
  refusalCases.push([`Affiche ${name} en octal.`, 'C_KEYWORD_IDENTIFIER', `« ${name} » est un mot-clé C17 et ne peut pas être utilisé comme nom.`, 8, 8 + name.length]);
}
for (const suffix of ['ensuite autre', '.', '// commentaire', '😀', '\\', '??/']) {
  refusalCases.push([`Affiche age en octal ${suffix}`, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', 21, 21 + suffix.length]);
}
for (const separator of ['\n', '\r\n', '\v', '\f', '\u00a0', '\u2028', '\u2029', '\ufeff']) {
  refusalCases.push([`Affiche${separator}age en octal`, 'INVALID_SEPARATOR',
    'Instruction monoligne : utilisez uniquement des espaces ordinaires ou des tabulations comme séparateurs.', 7, 8]);
}
for (const [source, code, message, start, end] of refusalCases) {
  test(`lot 5 diagnostic exact : ${JSON.stringify(source)}`, () => {
    const result = translate(source);
    assert.deepEqual(result, { status: 'rejected', source: { text: source }, diagnostics: [{ code, message,
      category: 'understanding', severity: 'error', range: { start, end } }] });
    assert.deepEqual(translate(source), result);
  });
}
