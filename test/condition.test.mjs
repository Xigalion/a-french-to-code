import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const phrase = condition => `Crée un bloc si "${condition}".`;
function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.deepEqual(result, translate(source));
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.ok(!('fragments' in result) && !('instruction' in result));
  assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
  assert.equal(result.diagnostics[0].category, 'understanding');
  if (range) assert.deepEqual(result.diagnostics[0].range, range);
  assert.deepEqual(result, translate(source));
  return result.diagnostics[0];
}

const cases = [
  ...['==', '!=', '<', '>', '<=', '>='].map(op => [`age ${op} 18`, `age ${op} 18`]),
  ['actif', 'actif'], ['0', '0'], ['1', '1'], ['-2', '(-2)'],
  ['0.0', '0.0'], ['-0.0', '(-0.0)'], ['1u', '1u'], ['.5f', '.5f'],
  ['age + 1 >= seuil', '(age + 1) >= seuil'],
  ['((age >= 18))', 'age >= 18'], ['(age) >= (18)', 'age >= 18'],
  ['(double) total / nombre > 2.5', '(((double) total) / nombre) > 2.5'],
  ['(unsigned int) -1 < 1u', '((unsigned int) (-1)) < 1u'],
  ['-1 < 1u', '(-1) < 1u'], ['a * -b + c % 2 != 0', '((a * (-b)) + (c % 2)) != 0'],
  ['(int) (float) a', '((int) ((float) a))'], ['((a + 1))', '(a + 1)'],
  ['1e-9999 > -0.0F', '1e-9999 > (-0.0F)'],
  ['1' + '0'.repeat(4096) + ' == a', '1' + '0'.repeat(4096) + ' == a'],
];
for (const [condition, rendered] of cases) {
  for (const suffix of ['', '.']) {
    test(`IF rendu : ${condition.slice(0, 70)} / ${JSON.stringify(suffix)}`, () => {
      const source = `Crée un bloc si "${condition}"${suffix}`;
      const result = translated(source);
      assert.equal(result.instruction.kind, 'IF');
      assert.equal(result.fragments.length, 1);
      const code = `if (${rendered}) {\n    \n}\n`;
      const text = `// ${source}\n${code}`;
      assert.equal(result.fragments[0].code, code);
      assert.equal(result.fragments[0].text, text);
      assert.equal(text.slice(result.fragments[0].cursor.offset), '\n}\n');
      assert.ok(!code.includes('else') && !code.includes('return') && !code.includes('#include'));
    });
  }
}
test('IF préserve les espaces, casse, accents et tabulations de la phrase', () => {
  const source = '\tCRÉE\tun BLOC\tsi "Age\t>=\t18". \t';
  const result = translated(source);
  assert.equal(result.fragments[0].comment, '// ' + source);
  assert.equal(result.fragments[0].code, 'if (Age >= 18) {\n    \n}\n');
});

const failures = [
  ['Crée un bloc si', 'MISSING_CONDITION', [15, 15]],
  ['Crée un bloc si .', 'MISSING_CONDITION_DELIMITER', [16, 16]],
  [phrase(''), 'MISSING_CONDITION', [17, 17]],
  [phrase('  \t'), 'MISSING_CONDITION', [20, 20]],
  ['Crée un bloc si age', 'MISSING_CONDITION_DELIMITER', [16, 16]],
  ['Crée un bloc si "age >= 18', 'UNTERMINATED_CONDITION', [16, 26]],
  ['Crée un bloc si "age >= 18.', 'UNTERMINATED_CONDITION', [16, 27]],
  [phrase('age >'), 'MISSING_OPERAND', [22, 22]],
  [phrase('> age'), 'MISSING_OPERAND', [17, 17]],
  [phrase('age = 18'), 'ASSIGNMENT_IN_CONDITION', [21, 22]],
  [phrase('âge >= 18'), 'INVALID_IDENTIFIER', [17, 20]],
  [phrase('A😀B > 0'), 'INVALID_IDENTIFIER', [17, 21]],
  [phrase('e\u0301 > 0'), 'INVALID_IDENTIFIER', [17, 19]],
  [phrase('\ud800 > 0'), 'INVALID_EXPRESSION_TOKEN', [17, 18]],
  [phrase('a b'), 'MISSING_OPERATOR', [19, 19]],
  [phrase('a < b < c'), 'CHAINED_COMPARISON', [23, 24]],
  [phrase('(a < b) == 1'), 'CHAINED_COMPARISON', [25, 27]],
  [phrase('a < (b < c)'), 'CHAINED_COMPARISON', [24, 25]],
  [phrase('(a < b < c)'), 'CHAINED_COMPARISON', [24, 25]],
  [phrase('a > (b'), 'MISSING_CLOSING_PARENTHESIS', [23, 23]],
  [phrase('a > b)'), 'UNEXPECTED_CLOSING_PARENTHESIS', [22, 23]],
  [phrase('a +'), 'MISSING_OPERAND', [20, 20]],
  [phrase('int'), 'C_KEYWORD_IDENTIFIER', [17, 20]],
  [phrase('1e+'), 'INCOMPLETE_NUMERIC_LITERAL', [20, 20]],
];
for (const [source, code, range] of failures) {
  test(`IF refuse : ${JSON.stringify(source)}`, () => refused(source, code, { start: range[0], end: range[1] }));
}
// &&, || and ! become positive cases in lot 10; retain the remaining exclusions.
for (const operator of ['+=', '-=', '*=', '/=', '%=', '++', '--', '<<', '>>', '&', '|', '^', '~', '?', ':', '->', '**', '/*', '//']) {
  test(`IF opérateur exclu ${operator}`, () => {
    const source = phrase(`a ${operator} b`);
    const at = source.indexOf(operator, 17);
    refused(source, 'UNSUPPORTED_CONDITION_OPERATOR', { start: at, end: at + operator.length });
  });
}
for (const condition of ['f(a)', 'a[0]', '1,2', '"oui"', 'a; int injected', '(a < b) + 1', '(int)(a < b)', '-(a < b)', 'a == b == c']) {
  test(`IF pas de syntaxe hors contrat ${condition}`, () => {
    assert.equal(translate(phrase(condition)).status, 'rejected');
  });
}
for (const suffix of [' .', '..', ';', ' else', ' puis affiche age', ' \\', ' // x', ' 😀']) {
  test(`IF suffixe refusé ${JSON.stringify(suffix)}`, () => refused(`Crée un bloc si "age"${suffix}`, 'UNEXPECTED_TEXT'));
}
for (const separator of ['\n', '\r\n', '\u2028', '\u2029', '\u00a0']) {
  test(`IF séparateur refusé ${JSON.stringify(separator)}`, () => refused(phrase('a' + separator + '> 0'), 'INVALID_SEPARATOR'));
}
test('les grammaires historiques refusent encore les comparaisons', () => {
  for (const source of ['Affecte à r le résultat de "a < b".', 'Affecte à r le résultat numérique de "a == b".']) {
    refused(source, 'UNSUPPORTED_EXPRESSION_OPERATOR');
  }
});

for (const form of [n => '('.repeat(n) + 'a >= 0' + ')'.repeat(n), n => '- '.repeat(n) + 'a > 0', n => '(int) '.repeat(n) + 'a > 0']) {
  test('IF profondeur globale 64 acceptée et 65 refusée', () => {
    translated(phrase(form(64)));
    refused(phrase(form(65)), 'EXPRESSION_TOO_COMPLEX');
  });
}
test('IF les regroupements et casts partagent le budget de profondeur', () => {
  translated(phrase('('.repeat(32) + '(int) '.repeat(32) + 'a > 0' + ')'.repeat(32)));
  refused(phrase('('.repeat(32) + '(int) '.repeat(33) + 'a > 0' + ')'.repeat(32)), 'EXPRESSION_TOO_COMPLEX');
});
test('IF les opérandes et comparateur partagent le budget de 1024 tokens', () => {
  const left = Array(256).fill('a').join('+'); // 511
  const right = '- ' + Array(256).fill('b').join('+'); // 512
  translated(phrase(left + '<' + right));
  refused(phrase('- ' + left + '<' + right), 'EXPRESSION_TOO_COMPLEX');
});

function insert(document, cursorOffset, source, indentUnit = '    ', fallbackEol = '\n') {
  const input = { document, cursorOffset, translation: translated(source), indentUnit, fallbackEol };
  const original = structuredClone(input);
  const result = planPlacement(input);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.deepEqual(input, original);
  assert.deepEqual(planPlacement(input), result);
  const { plan } = result;
  assert.equal(validatePlan(plan, document).status, 'current');
  assert.equal(plan.edits.length, 1);
  const edit = plan.edits[0];
  const text = document.text.slice(0, edit.range.start) + edit.newText + document.text.slice(edit.range.end);
  assert.equal(text.slice(0, edit.range.start), document.text.slice(0, edit.range.start));
  assert.equal(text.slice(edit.range.start + edit.newText.length), document.text.slice(edit.range.end));
  const next = { ...document, text, revision: document.revision + 1 };
  assert.equal(validatePlan(plan, next).status, 'rejected');
  assert.equal(text.charAt(plan.cursorAfter), fallbackEol[0]);
  return { document: next, cursorOffset: plan.cursorAfter, plan };
}
for (const eol of ['\n', '\r\n']) {
  for (const unit of ['  ', '    ', '\t']) {
    test(`IF blocs imbriqués, curseurs et texte adjacent ${JSON.stringify([eol, unit])}`, () => {
      const prefix = '// 😀 avant\nint main(void) {\n'.replaceAll('\n', eol);
      const suffix = ('\n' + unit + 'printf("après");\n}\n// fin\n').replaceAll('\n', eol);
      let state = { document: { id: 'nested.c', revision: 0, text: prefix + unit + eol + suffix }, cursorOffset: prefix.length + unit.length };
      const operations = [phrase('a >= 0'), 'Déclare un entier nommé x', 'Affecte la valeur 1 à x', phrase('x == 1'), 'Affiche la valeur de x'];
      for (const source of operations) state = insert(state.document, state.cursorOffset, source, unit, eol);
      const expected = prefix
        + `${unit}// ${operations[0]}\n${unit}if (a >= 0) {\n`
          .replaceAll('\n', eol)
        + [`// ${operations[1]}`, 'int x;', `// ${operations[2]}`, 'x = 1;', `// ${operations[3]}`, 'if (x == 1) {'].map(line=>unit.repeat(2)+line+eol).join('')
        + unit.repeat(3) + `// ${operations[4]}` + eol + unit.repeat(3) + 'printf("%d", x);' + eol
        + unit.repeat(3) + eol + unit.repeat(2) + '}' + eol + unit + '}' + eol + suffix;
      assert.equal(state.document.text, expected);
      assert.equal(state.document.text.slice(state.cursorOffset), eol + unit.repeat(2) + '}' + eol + unit + '}' + eol + suffix);
    });
    for (const whitespace of ['', ' ', '\t']) {
      test(`IF EOF blanc sans EOL ${JSON.stringify([eol, unit, whitespace])}`, () => {
        const state = insert({ id: 'end.c', revision: 0, text: whitespace }, whitespace.length, phrase('1'), unit, eol);
        assert.equal(state.document.text, `${whitespace}// ${phrase('1')}${eol}${whitespace}if (1) {${eol}${whitespace}${unit}${eol}${whitespace}}${eol}`);
      });
    }
  }
  test(`IF MAIN puis blocs indépendants ${JSON.stringify(eol)}`, () => {
    let state = insert({ id: 'main.c', revision: 0, text: '' }, 0, 'Crée la fonction principale', '    ', eol);
    state = insert(state.document, state.cursorOffset, phrase('a'), '    ', eol);
    // User explicitly creates a blank line after the IF; no automatic relocation.
    const afterIf = state.document.text.indexOf('    }') + 5 + eol.length;
    state.document.text = state.document.text.slice(0, afterIf) + '    ' + eol + state.document.text.slice(afterIf);
    state.document.revision++;
    state = insert(state.document, afterIf + 4, phrase('b'), '    ', eol);
    assert.equal(state.document.text.split('    if (').length - 1, 2);
    assert.ok(!state.document.text.includes('        if ('));
  });
}
for (const field of ['code', 'comment', 'text', 'cursor', 'instruction']) {
  test(`IF fragment canonique falsifié : ${field}`, () => {
    const translation = translated(phrase('a'));
    if (field === 'instruction') translation.instruction.parameters.condition.range.start++;
    else if (field === 'cursor') translation.fragments[0].cursor.offset++;
    else translation.fragments[0][field] += 'inject';
    const result = planPlacement({ document: { id: 'x.c', revision: 0, text: '' }, cursorOffset: 0, translation });
    assert.equal(result.diagnostics[0].code, 'INVALID_TRANSLATION_RESULT');
  });
}
for (const [text, code] of [['int x;', 'TARGET_LINE_NOT_BLANK'], ['/* ouvert\n    ', 'TARGET_IN_COMMENT'], ['#define X 1\n    ', 'UNSUPPORTED_DIRECTIVE'], ['// x\\\n    ', 'UNSUPPORTED_LINE_CONTINUATION'], ['// ??/\n    ', 'UNSUPPORTED_TRIGRAPH']]) {
  test(`IF placement refusé ${code}`, () => {
    const result = planPlacement({ document: { id: 'x.c', revision: 0, text }, cursorOffset: text.length, translation: translated(phrase('a')) });
    assert.equal(result.status, 'rejected');
    assert.equal(result.diagnostics[0].code, code);
  });
}

for (const expression of ['7 / 0', 'a / 0', '1.0 / 0.0', '7 % 0.0', '(int)(7 / 0)', '7 / (1 - 1)', 'a / (int)0']) {
  for (const condition of [expression, expression + ' > 1', '1 < ' + expression]) {
    test(`IF avis locaux inchangés : ${condition}`, () => {
      const old = analyzeCalculations(translated(`Affecte à r le résultat numérique de "${expression}".`));
      const result = translated(phrase(condition));
      const original = structuredClone(result);
      const report = analyzeCalculations(result);
      assert.deepEqual(result, original);
      const offset = result.source.text.indexOf(expression) - old.source.text.indexOf(expression);
      assert.deepEqual(report.advisories, old.advisories.map(advice=>({...advice, range:{start:advice.range.start+offset,end:advice.range.end+offset}})));
    });
  }
}
test('IF avis des deux opérandes triés et non bloquants', () => {
  const result = translated(phrase('7 / 0 < 5.0 % 2'));
  const report = analyzeCalculations(result);
  assert.deepEqual(report.advisories.map(item=>item.code), ['INTEGER_ZERO_DIVISOR', 'FLOAT_REMAINDER_OPERAND']);
  assert.equal(planPlacement({ document:{id:'x.c',revision:0,text:''}, cursorOffset:0,translation:result }).status,'planned');
});
for (const change of ['text', 'cursor', 'indent', 'close']) {
  test(`IF session : aperçu périmé ${change}`, () => {
    const current = { document: { id: 'x.c', revision: 1, text: '' }, cursorOffset: 0,
      singleCursor:true, indentUnit:'  ', indentSignature:'true:2',eol:'\n',open:true };
    const session = new TranslationSession(current, phrase('7 / 0 > 1'));
    assert.equal(session.advisories.length,1);
    const prepared = session.prepare(current);
    assert.equal(prepared.status,'preview');
    session.reviewReady(prepared.preview.token,current);
    const changed=structuredClone(current);
    if(change==='text') {changed.document.text=' ';changed.document.revision++;}
    if(change==='cursor') changed.cursorOffset=1;
    if(change==='indent') changed.indentSignature='true:4';
    if(change==='close') changed.open=false;
    assert.equal(session.beginApply(prepared.preview.token,changed).status,'error');
    assert.equal(current.document.text,'');
  });
}
test('IF session : confirmation unique du plan exact et curseur intérieur', () => {
  const current = { document: { id: 'x.c', revision: 1, text: '' }, cursorOffset: 0,
    singleCursor:true, indentUnit:'\t', indentSignature:'false:4',eol:'\r\n',open:true };
  const session = new TranslationSession(current, phrase('1'));
  const prepared = session.prepare(current);
  assert.equal(prepared.status,'preview');
  assert.equal(session.beginApply(prepared.preview.token,current).status,'error');
  session.reviewReady(prepared.preview.token,current);
  const result=session.beginApply(prepared.preview.token,current);
  assert.equal(result.status,'apply');
  assert.equal(result.expectedAfter,prepared.preview.after);
  assert.equal(result.expectedAfter.slice(result.plan.cursorAfter),'\r\n}\r\n');
  assert.equal(session.beginApply(prepared.preview.token,current).status,'error');
});
