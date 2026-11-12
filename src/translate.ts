import { parseExpression, renderExpression } from './expression.ts';
import type { Expression } from './expression.ts';
import { renderNumericExpression, parseNumericExpression } from './numericExpression.ts';
import type { NumericExpression } from './numericExpression.ts';
import { analyzeNumericInstruction } from './numericInstructions.ts';
import type { NumericInstruction } from './numericInstructions.ts';
import { analyzeFunctionInstruction } from './functionInstructions.ts';
import type { FunctionInstruction } from './functionInstructions.ts';
import { parseCondition, renderCondition } from './condition.ts';
import type { Condition } from './condition.ts';

/** Half-open offsets in UTF-16 code units, relative to the original input. */
export type SourceRange = { start: number; end: number };

export type Instruction = NumericInstruction | FunctionInstruction
  | { kind: 'IF'; parameters: { condition: Condition } }
  | { kind: 'ELSE_IF'; parameters: { condition: Condition } }
  | { kind: 'ELSE'; parameters: Record<string, never> }
  | { kind: 'WHILE'; parameters: { condition: Condition } }
  | { kind: 'DO_WHILE'; parameters: { condition: Condition } }
  | { kind: 'FOR'; parameters: { name: string; initial: NumericExpression; condition: Condition; update: NumericExpression } }
  | { kind: 'BREAK'; parameters: Record<string, never> }
  | { kind: 'CONTINUE'; parameters: Record<string, never> }
  | { kind: 'MAIN'; parameters: Record<string, never> }
  | { kind: 'DECL_INT'; parameters: { name: string } }
  | { kind: 'INIT_INT'; parameters: { name: string; value: string } }
  | { kind: 'ASSIGN_INT'; parameters: { name: string; value: string } }
  | { kind: 'ASSIGN_EXPRESSION'; parameters: { name: string; expression: Expression } }
  | { kind: 'INCLUDE_STDIO'; parameters: Record<string, never> }
  | { kind: 'PRINT_INT'; parameters: { name: string } }
  | { kind: 'PRINT_FORMATTED'; parameters: { name: string; format: DisplayFormat } }
  | { kind: 'PRINT_TEXT'; parameters: { text: string } };

type DisplayFormat = 'decimal' | 'hexadecimal' | 'octal';

/** Intents rendered as a three-line block whose body is left empty, with the
 * cursor placed inside. Shared by the translator and the placement planner so
 * both stay in step.
 */
export const BLOCK_KINDS: readonly string[] = ['MAIN', 'IF', 'ELSE_IF', 'ELSE', 'WHILE', 'DO_WHILE', 'FOR', 'FUNC_DEF'];

/** Intents whose only parameter is a bounded condition of the lot 10 profile. */
export function instructionCondition(instruction: Instruction): Condition | undefined {
  switch (instruction.kind) {
    case 'IF': case 'ELSE_IF': case 'WHILE': case 'DO_WHILE': case 'FOR': return instruction.parameters.condition;
    default: return undefined;
  }
}

export type DiagnosticCode =
  | 'CONDITION_FORM_NOT_SUPPORTED'
  | 'MISSING_CONDITION'
  | 'MISSING_CONDITION_DELIMITER'
  | 'UNTERMINATED_CONDITION'
  | 'ASSIGNMENT_IN_CONDITION'
  | 'CHAINED_COMPARISON'
  | 'UNSUPPORTED_CONDITION_OPERATOR'
  | 'EMPTY_INPUT'
  | 'INVALID_SEPARATOR'
  | 'UNKNOWN_FORMULATION'
  | 'INCOMPLETE_INSTRUCTION'
  | 'MISSING_DISPLAY_FORMAT'
  | 'UNSUPPORTED_DISPLAY_FORMAT'
  | 'MISSING_EXPRESSION'
  | 'MISSING_EXPRESSION_DELIMITER'
  | 'UNTERMINATED_EXPRESSION'
  | 'MISSING_OPERAND'
  | 'MISSING_OPERATOR'
  | 'MISSING_CLOSING_PARENTHESIS'
  | 'UNEXPECTED_CLOSING_PARENTHESIS'
  | 'UNSUPPORTED_EXPRESSION_OPERATOR'
  | 'INVALID_EXPRESSION_TOKEN'
  | 'EXPRESSION_TOO_COMPLEX'
  | 'MISSING_NUMERIC_TYPE'
  | 'UNSUPPORTED_NUMERIC_TYPE'
  | 'MISSING_CAST_CLOSING_PARENTHESIS'
  | 'INCOMPLETE_NUMERIC_LITERAL'
  | 'UNSUPPORTED_NUMERIC_LITERAL'
  | 'MISSING_DISPLAY_PRECISION'
  | 'INVALID_DISPLAY_PRECISION'
  | 'INVALID_IDENTIFIER'
  | 'C_KEYWORD_IDENTIFIER'
  | 'INVALID_INTEGER'
  | 'UNSUPPORTED_HEADER'
  | 'UNTERMINATED_STRING'
  | 'INVALID_STRING_ESCAPE'
  | 'UNSUPPORTED_STRING_CONTENT'
  | 'UNEXPECTED_TEXT';

export type Diagnostic = {
  code: DiagnosticCode;
  category: 'understanding';
  severity: 'error';
  message: string;
  range: SourceRange;
};

/** Local fragment IDs are deterministic, not persistent provenance identifiers. */
export type Fragment = {
  id: string;
  role: 'primary';
  comment: string;
  code: string;
  text: string;
  /** Relative to text; not a position in a C document. */
  cursor?: { offset: number };
};

export type TranslationResult =
  | {
      status: 'translated';
      source: { text: string };
      instruction: Instruction;
      fragments: Fragment[];
      diagnostics: [];
    }
  | {
      status: 'rejected';
      source: { text: string };
      diagnostics: [Diagnostic];
    };

const C17_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline',
  'int', 'long', 'register', 'restrict', 'return', 'short', 'signed',
  'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
  'void', 'volatile', 'while', '_Alignas', '_Alignof', '_Atomic', '_Bool',
  '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert',
  '_Thread_local',
]);

type Token = { text: string; range: SourceRange };
type Parameter = { parameter: 'name' | 'value' | 'header' };
type Rule = { kind: Exclude<Instruction['kind'], 'IF' | 'ELSE_IF' | 'ELSE' | 'WHILE' | 'DO_WHILE' | 'FOR' | FunctionInstruction['kind'] | 'PRINT_TEXT' | 'PRINT_FORMATTED' | 'ASSIGN_EXPRESSION' | NumericInstruction['kind']>; parts: (string | Parameter)[] };

const RULES: [Rule, ...Rule[]] = [
  { kind: 'MAIN', parts: ['Crée', 'la', 'fonction', 'principale'] },
  { kind: 'DECL_INT', parts: ['Déclare', 'un', 'entier', 'nommé', { parameter: 'name' }] },
  { kind: 'INIT_INT', parts: ['Crée', 'un', 'entier', 'nommé', { parameter: 'name' }, 'de', 'valeur', { parameter: 'value' }] },
  { kind: 'ASSIGN_INT', parts: ['Affecte', 'la', 'valeur', { parameter: 'value' }, 'à', { parameter: 'name' }] },
  { kind: 'INCLUDE_STDIO', parts: ['Inclue', 'la', 'bibliothèque', { parameter: 'header' }] },
  { kind: 'PRINT_INT', parts: ['Affiche', 'la', 'valeur', 'de', { parameter: 'name' }] },
  { kind: 'BREAK', parts: ['Sors', 'de', 'la', 'boucle', 'la', 'plus', 'intérieure'] },
  { kind: 'CONTINUE', parts: ['Passe', 'à', 'l’itération', 'suivante', 'de', 'la', 'boucle', 'la', 'plus', 'intérieure'] },
];

/** Fixed words are compared case-insensitively, accents required. The two
 * apostrophe characters are the same character for a reader and depend only on
 * the keyboard layout, so they are not treated as a synonym tolerance.
 */
function sameWord(part: string, token: string): boolean {
  const normalize = (value: string): string => value.toLowerCase().replace(/'/gu, '’');
  return normalize(part) === normalize(token);
}

function reject(
  text: string,
  code: DiagnosticCode,
  message: string,
  range: SourceRange,
): TranslationResult {
  return {
    status: 'rejected',
    source: { text },
    diagnostics: [{ code, category: 'understanding', severity: 'error', message, range }],
  };
}

function render(text: string, instruction: Instruction): TranslationResult {
  let code: string;
  switch (instruction.kind) {
    case 'MAIN': code = 'int main(void) {\n    \n}\n'; break;
    case 'IF': code = `if (${renderCondition(instruction.parameters.condition)}) {\n    \n}\n`; break;
    case 'ELSE_IF': code = `else if (${renderCondition(instruction.parameters.condition)}) {\n    \n}\n`; break;
    case 'ELSE': code = 'else {\n    \n}\n'; break;
    // No semicolon after the header or the closing brace, and no counter,
    // initialisation or progression is ever generated with the loop.
    case 'WHILE': code = `while (${renderCondition(instruction.parameters.condition)}) {\n    \n}\n`; break;
    // The semicolon after the final condition is C syntax, not an added
    // statement: do/while is generated whole or not at all.
    case 'DO_WHILE': code = `do {\n    \n} while (${renderCondition(instruction.parameters.condition)});\n`; break;
    // The two header assignments render exactly the fields that were asked
    // for: no ++, no default initial value and no clause left empty.
    case 'FOR': {
      const { name, initial, condition, update } = instruction.parameters;
      code = `for (${name} = ${renderNumericExpression(initial)}; ${renderCondition(condition)}; `
        + `${name} = ${renderNumericExpression(update)}) {\n    \n}\n`;
      break;
    }
    case 'DECL_INT': code = `int ${instruction.parameters.name};\n`; break;
    case 'INIT_INT': code = `int ${instruction.parameters.name} = ${instruction.parameters.value};\n`; break;
    case 'ASSIGN_INT': code = `${instruction.parameters.name} = ${instruction.parameters.value};\n`; break;
    case 'ASSIGN_EXPRESSION': code = `${instruction.parameters.name} = ${renderExpression(instruction.parameters.expression)};\n`; break;
    case 'NUMERIC_DECL': code = `${instruction.parameters.type} ${instruction.parameters.name};\n`; break;
    case 'NUMERIC_INIT': code = `${instruction.parameters.type} ${instruction.parameters.name} = ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'NUMERIC_ASSIGN': code = `${instruction.parameters.name} = ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'NUMERIC_PRINT': {
      const parameters = instruction.parameters;
      const format = parameters.format === 'unsigned' ? '%u' : `%.${parameters.precision}${parameters.format === 'fixed' ? 'f' : 'e'}`;
      code = `printf("${format}", ${parameters.name});\n`;
      break;
    }
    // Neither has the meaning of return: the transfer stays inside the loop.
    case 'BREAK': code = 'break;\n'; break;
    case 'CONTINUE': code = 'continue;\n'; break;
    // A function body is created empty: no return is ever added implicitly,
    // and no parameter list is invented beyond the explicit « (void) ».
    case 'FUNC_DEF': code = `${instruction.parameters.returnType} ${instruction.parameters.name}(void) {\n    \n}\n`; break;
    case 'RETURN': code = 'return;\n'; break;
    case 'RETURN_INT': code = `return ${instruction.parameters.value};\n`; break;
    case 'RETURN_EXPRESSION': code = `return ${renderExpression(instruction.parameters.expression)};\n`; break;
    case 'RETURN_NUMERIC': code = `return ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'INCLUDE_STDIO': code = '#include <stdio.h>\n'; break;
    case 'PRINT_INT': code = `printf("%d", ${instruction.parameters.name});\n`; break;
    case 'PRINT_FORMATTED': {
      const specifiers: Record<DisplayFormat, string> = { decimal: '%d', hexadecimal: '%x', octal: '%o' };
      code = `printf("${specifiers[instruction.parameters.format]}", ${instruction.parameters.name});\n`;
      break;
    }
    case 'PRINT_TEXT': {
      const literal = instruction.parameters.text.replace(/[\\"\n\t]/gu, character => {
        switch (character) {
          case '\\': return '\\\\';
          case '"': return '\\"';
          case '\n': return '\\n';
          default: return '\\t';
        }
      });
      code = `printf("%s", "${literal}");\n`;
      break;
    }
  }
  const comment = `// ${text}`;
  const fragment: Fragment = {
    id: 'fragment-1', role: 'primary', comment, code, text: `${comment}\n${code}`,
  };
  if (BLOCK_KINDS.includes(instruction.kind)) {
    fragment.cursor = { offset: comment.length + 1 + code.indexOf('\n') + 1 + 4 };
  }
  return {
    status: 'translated', source: { text }, instruction,
    fragments: [fragment], diagnostics: [],
  };
}

// A missing parameter here is an internal grammar defect, not a user error.
function requiredParameter(value: string | undefined): string {
  if (value === undefined) throw new Error('Invariant interne : paramètre reconnu absent.');
  return value;
}

function identifierDiagnostic(token: Token): Diagnostic | undefined {
  if (C17_KEYWORDS.has(token.text)) return {
    code: 'C_KEYWORD_IDENTIFIER', category: 'understanding', severity: 'error',
    message: `« ${token.text} » est un mot-clé C17 et ne peut pas être utilisé comme nom.`, range: token.range,
  };
  if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(token.text)) return {
    code: 'INVALID_IDENTIFIER', category: 'understanding', severity: 'error',
    message: 'Le nom doit commencer par une lettre ASCII et contenir uniquement lettres ASCII, chiffres ou soulignements.', range: token.range,
  };
  return undefined;
}

/** IF envelope has its own delimiters; no changes to historical envelopes.
 * The loop intents reuse it unchanged, including the lot 10 condition profile:
 * a loop never gets a more permissive grammar, and quotes delimit a condition,
 * not a C string. Only the empty-condition wording differs.
 */
function translateIf(source: string, position: number, end: number, kind: 'IF' | 'ELSE_IF' | 'WHILE' | 'DO_WHILE' = 'IF'): TranslationResult {
  const missing = kind === 'IF' || kind === 'ELSE_IF' ? 'Il manque la condition du bloc.' : 'Il manque la condition de la boucle.';
  while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
  if (position === end) return reject(source, 'MISSING_CONDITION', missing, { start: end, end });
  if (source.charAt(position) !== '"') return reject(source, 'MISSING_CONDITION_DELIMITER',
    'La condition doit être entourée de guillemets ASCII.', { start: position, end: position });
  const opening = position;
  const closing = source.indexOf('"', opening + 1);
  let usefulEnd = source.length;
  while (usefulEnd > 0 && /[ \t]/u.test(source.charAt(usefulEnd - 1))) usefulEnd--;
  if (closing === -1) return reject(source, 'UNTERMINATED_CONDITION',
    'Il manque le guillemet fermant de la condition.', { start: opening, end: usefulEnd });
  let suffixEnd = usefulEnd;
  if (suffixEnd === closing + 2 && source.charAt(closing + 1) === '.') suffixEnd--;
  position = closing + 1;
  while (position < suffixEnd && /[ \t]/u.test(source.charAt(position))) position++;
  if (position < suffixEnd) return reject(source, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: position, end: suffixEnd });
  const result = parseCondition(source, opening + 1, closing, identifierDiagnostic, missing);
  if (result.status === 'rejected') return { status: 'rejected', source: { text: source }, diagnostics: [result.diagnostic] };
  return render(source, { kind, parameters: { condition: result.condition } });
}

/** FOR envelope: three explicitly delimited clauses, all required.
 * The counter must already be declared by the student: no declaration is
 * generated in the header, so no type is ever invented and the counter keeps
 * the scope the student gave it. The three clauses share one token budget, so
 * splitting an expression across them cannot bypass the global limit.
 */
function translateFor(source: string, position: number, end: number): TranslationResult {
  const budget = { count: 0 };
  const skip = (): void => { while (position < end && /[ \t]/u.test(source.charAt(position))) position++; };
  function word(expected: string): Diagnostic | undefined {
    skip();
    if (position === end) return {
      code: 'INCOMPLETE_INSTRUCTION', category: 'understanding', severity: 'error',
      message: `Instruction incomplète : « ${expected} » attendu.`, range: { start: end, end },
    };
    const start = position;
    while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
    if (source.slice(start, position).toLowerCase() !== expected) return {
      code: 'UNKNOWN_FORMULATION', category: 'understanding', severity: 'error',
      message: 'Cette formulation n’appartient pas au catalogue C-A.', range: { start, end: position },
    };
    return undefined;
  }
  /** One quoted clause. The optional period is only accepted on the last one. */
  function clause(missingCode: DiagnosticCode, delimiterCode: DiagnosticCode, unterminatedCode: DiagnosticCode,
    missingMessage: string, last: boolean): { opening: number; closing: number } | Diagnostic {
    skip();
    const useful = (): number => {
      let value = last ? source.length : end;
      while (value > position && /[ \t]/u.test(source.charAt(value - 1))) value--;
      return value;
    };
    if (position === end) return { code: missingCode, category: 'understanding', severity: 'error', message: missingMessage, range: { start: end, end } };
    if (source.charAt(position) !== '"') return { code: delimiterCode, category: 'understanding', severity: 'error',
      message: 'Cette partie doit être entourée de guillemets ASCII.', range: { start: position, end: position } };
    const opening = position;
    const closing = source.indexOf('"', opening + 1);
    if (closing === -1 || closing >= end) return { code: unterminatedCode, category: 'understanding', severity: 'error',
      message: 'Il manque le guillemet fermant.', range: { start: opening, end: useful() } };
    position = closing + 1;
    return { opening, closing };
  }
  skip();
  if (position === end) return reject(source, 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du compteur.', { start: end, end });
  const nameStart = position;
  while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
  const name = { text: source.slice(nameStart, position), range: { start: nameStart, end: position } };
  const invalidName = identifierDiagnostic(name);
  if (invalidName) return { status: 'rejected', source: { text: source }, diagnostics: [invalidName] };

  const parts: ({ opening: number; closing: number } | undefined)[] = [];
  for (const [index, words] of [['de', 'valeur', 'initiale'], ['tant', 'que'], ['avec', 'mise', 'à', 'jour']].entries()) {
    for (const expected of words) {
      const issue = word(expected);
      if (issue) return { status: 'rejected', source: { text: source }, diagnostics: [issue] };
    }
    const descriptors = [
      ['MISSING_EXPRESSION', 'MISSING_EXPRESSION_DELIMITER', 'UNTERMINATED_EXPRESSION', 'Il manque la valeur initiale du compteur.'],
      ['MISSING_CONDITION', 'MISSING_CONDITION_DELIMITER', 'UNTERMINATED_CONDITION', 'Il manque la condition de la boucle.'],
      ['MISSING_EXPRESSION', 'MISSING_EXPRESSION_DELIMITER', 'UNTERMINATED_EXPRESSION', 'Il manque la mise à jour du compteur.'],
    ][index] as [DiagnosticCode, DiagnosticCode, DiagnosticCode, string];
    const found = clause(descriptors[0], descriptors[1], descriptors[2], descriptors[3], index === 2);
    if (!('opening' in found)) return { status: 'rejected', source: { text: source }, diagnostics: [found] };
    parts.push(found);
  }
  // Only a period attached to the last closing quote belongs to this envelope.
  let suffixEnd = source.length;
  while (suffixEnd > position && /[ \t]/u.test(source.charAt(suffixEnd - 1))) suffixEnd--;
  if (suffixEnd === position + 1 && source.charAt(position) === '.') suffixEnd--;
  skip();
  if (position < suffixEnd) return reject(source, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: position, end: suffixEnd });

  const [initialPart, conditionPart, updatePart] = parts as [{ opening: number; closing: number },
    { opening: number; closing: number }, { opening: number; closing: number }];
  const initial = parseNumericExpression(source, initialPart.opening + 1, initialPart.closing, identifierDiagnostic,
    'Il manque la valeur initiale du compteur.', budget);
  if (initial.status === 'rejected') return { status: 'rejected', source: { text: source }, diagnostics: [initial.diagnostic] };
  const condition = parseCondition(source, conditionPart.opening + 1, conditionPart.closing, identifierDiagnostic,
    'Il manque la condition de la boucle.', budget);
  if (condition.status === 'rejected') return { status: 'rejected', source: { text: source }, diagnostics: [condition.diagnostic] };
  const update = parseNumericExpression(source, updatePart.opening + 1, updatePart.closing, identifierDiagnostic,
    'Il manque la mise à jour du compteur.', budget);
  if (update.status === 'rejected') return { status: 'rejected', source: { text: source }, diagnostics: [update.diagnostic] };
  return render(source, { kind: 'FOR', parameters: { name: name.text, initial: initial.expression,
    condition: condition.condition, update: update.expression } });
}

/** New envelope only; historical assignment grammar is intentionally untouched. */
function translateAssignmentExpression(source: string, tokens: Token[], end: number): TranslationResult {
  const name = tokens[2];
  if (!name) return reject(source, 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du résultat.', { start: end, end });
  const invalidName = identifierDiagnostic(name);
  if (invalidName) return { status: 'rejected', source: { text: source }, diagnostics: [invalidName] };
  let position = name.range.end;
  for (const word of ['le', 'résultat', 'de']) {
    while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
    if (position === end) return reject(source, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${word} » attendu.`, { start: end, end });
    const start = position;
    while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
    if (source.slice(start, position).toLowerCase() !== word) return reject(source, 'UNKNOWN_FORMULATION',
      'Cette formulation n’appartient pas au catalogue C-A.', { start, end: position });
  }
  while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
  if (position === end) return reject(source, 'MISSING_EXPRESSION', 'Il manque l’expression à calculer.', { start: end, end });
  if (source.charAt(position) !== '"') return reject(source, 'MISSING_EXPRESSION_DELIMITER',
    'Il manque le guillemet ouvrant de l’expression.', { start: position, end: position });
  const opening = position;
  const closing = source.indexOf('"', opening + 1);
  if (closing === -1 || closing >= end) return reject(source, 'UNTERMINATED_EXPRESSION',
    'Il manque le guillemet fermant de l’expression.', { start: opening, end });
  const parsed = parseExpression(source, opening + 1, closing, identifierDiagnostic);
  if (parsed.status === 'rejected') return { status: 'rejected', source: { text: source }, diagnostics: [parsed.diagnostic] };
  position = closing + 1;
  // Unlike generic fixed-word rules, only an attached closing-quote period
  // belongs to this envelope. Invalid suffix punctuation is kept whole.
  let suffixEnd = source.length;
  while (suffixEnd > closing && /[ \t]/u.test(source.charAt(suffixEnd - 1))) suffixEnd--;
  if (suffixEnd === closing + 2 && source.charAt(closing + 1) === '.') suffixEnd--;
  while (position < suffixEnd && /[ \t]/u.test(source.charAt(position))) position++;
  if (position < suffixEnd) return reject(source, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: position, end: suffixEnd });
  return render(source, { kind: 'ASSIGN_EXPRESSION', parameters: { name: name.text, expression: parsed.expression } });
}

/** Partial intent stays internal: it is never an insertable translation. */
type DisplayIntent = {
  name: Token | undefined;
  connector: Token | undefined;
  format: Token | undefined;
  extra: Token | undefined;
  last: Token;
  missingNameAt: number;
};

/** Dispatch without changing the historical fixed-prefix selection. */
function analyzeDisplay(tokens: Token[]): DisplayIntent | undefined {
  const name = tokens[1];
  const last = tokens.at(-1);
  if (tokens[0]?.text.toLowerCase() !== 'affiche' || !name || !last) return undefined;
  const connector = tokens[2];
  if (['la', 'le'].includes(name.text.toLowerCase()) && connector?.text.toLowerCase() !== 'en') return undefined;
  const missingName = name.text.toLowerCase() === 'en' && connector !== undefined && connector.text.toLowerCase() !== 'en';
  return {
    name: missingName ? undefined : name,
    connector: missingName ? name : connector,
    format: missingName ? connector : tokens[3],
    extra: tokens[4], last, missingNameAt: name.range.start,
  };
}

/** Level 1 requirements only; no defaults or future-level behavior. */
function translateDisplayLevel1(source: string, intent: DisplayIntent): TranslationResult {
  const { name, connector, format, extra, last } = intent;
  if (!name) return reject(source, 'INCOMPLETE_INSTRUCTION', 'Il manque le nom à afficher.', {
    start: intent.missingNameAt, end: intent.missingNameAt,
  });
  if (C17_KEYWORDS.has(name.text)) return reject(source, 'C_KEYWORD_IDENTIFIER',
    `« ${name.text} » est un mot-clé C17 et ne peut pas être utilisé comme nom.`, name.range);
  if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(name.text)) return reject(source, 'INVALID_IDENTIFIER',
    'Le nom doit commencer par une lettre ASCII et contenir uniquement lettres ASCII, chiffres ou soulignements.', name.range);
  if (connector && connector.text.toLowerCase() !== 'en') return reject(source, 'UNKNOWN_FORMULATION',
    'Cette formulation n’appartient pas au catalogue C-A.', connector.range);
  if (!format) return reject(source, 'MISSING_DISPLAY_FORMAT', 'Il manque le format d’affichage.', {
    start: last.range.end, end: last.range.end,
  });
  let selected: DisplayFormat;
  switch (format.text.toLowerCase()) {
    case 'décimal': selected = 'decimal'; break;
    case 'hexadécimal': selected = 'hexadecimal'; break;
    case 'octal': selected = 'octal'; break;
    default: return reject(source, 'UNSUPPORTED_DISPLAY_FORMAT', 'Ce format d’affichage n’est pas pris en charge.', format.range);
  }
  if (extra) return reject(source, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', {
    start: extra.range.start, end: last.range.end,
  });
  return render(source, { kind: 'PRINT_FORMATTED', parameters: { name: name.text, format: selected } });
}

/** Pure translation only: no document, I/O, symbol table or placement. */
export function translate(text: string): TranslationResult {
  const literalPrefix = /^[ \t]*Affiche[ \t]+le[ \t]+texte(?=[ \t]|$)/iu.exec(text);
  if (literalPrefix) {
    const lineBreak = /[\r\n\u2028\u2029]/u.exec(text);
    if (lineBreak) return reject(text, 'INVALID_SEPARATOR', 'Une instruction doit tenir sur une seule ligne.', { start: lineBreak.index, end: lineBreak.index + 1 });
    let literalEnd = text.length;
    while (literalEnd > 0 && /[ \t]/u.test(text.charAt(literalEnd - 1))) literalEnd--;
    if (text.charAt(literalEnd - 1) === '.' && text.charAt(literalEnd - 2) === '"') literalEnd--;
    return translateLiteral(text, literalPrefix[0].length, literalEnd);
  }
  // Detect separators before tokenization; indices remain those of the original.
  const invalidSeparator = /[^\S \t]/u.exec(text);
  if (invalidSeparator) {
    return reject(text, 'INVALID_SEPARATOR',
      'Instruction monoligne : utilisez uniquement des espaces ordinaires ou des tabulations comme séparateurs.',
      { start: invalidSeparator.index, end: invalidSeparator.index + invalidSeparator[0].length });
  }
  const start = text.search(/[^ \t]/u);
  if (start === -1) {
    return reject(text, 'EMPTY_INPUT', 'Saisissez une instruction.', { start: text.length, end: text.length });
  }
  let end = text.length;
  while (end > start && /[ \t]/u.test(text.charAt(end - 1))) end--;
  // Optional period must be attached to the final word/parameter.
  if (text.charAt(end - 1) === '.' && end > start + 1 && !/[ \t]/u.test(text.charAt(end - 2))) end--;

  const tokens: Token[] = Array.from(text.slice(start, end).matchAll(/[^ \t]+/gu), match => ({
    text: match[0],
    range: { start: start + match.index, end: start + match.index + match[0].length },
  }));

  if (['crée', 'un', 'bloc', 'si'].every((word, index) => tokens[index]?.text.toLowerCase() === word)) {
    return translateIf(text, tokens[3]!.range.end, end);
  }
  // Each loop form is selected on its own fixed words, never on a synonym.
  // « jusqu’à » is refused on purpose: turning a stop condition into a
  // continuation condition would mean applying a negation the user never wrote.
  if (['crée', 'une', 'boucle'].every((word, index) => tokens[index]?.text.toLowerCase() === word)) {
    if (tokens[3]?.text.toLowerCase() === 'pour') return translateFor(text, tokens[3].range.end, end);
    const forms = [
      { words: ['tant', 'que'], kind: 'WHILE' as const },
      { words: ['avec', 'test', 'final', 'tant', 'que'], kind: 'DO_WHILE' as const },
    ];
    const form = forms.find(candidate => candidate.words[0] === tokens[3]?.text.toLowerCase());
    if (!form) {
      return tokens[3]
        ? reject(text, 'UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', tokens[3].range)
        : reject(text, 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : la forme de la boucle est attendue.', { start: end, end });
    }
    for (const [offset, word] of form.words.entries()) {
      const token = tokens[3 + offset];
      if (!token) return reject(text, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${word} » attendu.`, { start: end, end });
      if (token.text.toLowerCase() !== word) {
        return reject(text, 'UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', token.range);
      }
    }
    return translateIf(text, tokens[2 + form.words.length]!.range.end, end, form.kind);
  }
  if (['ajoute', 'une', 'branche', 'sinon'].every((word, index) => tokens[index]?.text.toLowerCase() === word)) {
    if (tokens[4]?.text.toLowerCase() === 'si') return translateIf(text, tokens[4].range.end, end, 'ELSE_IF');
    if (tokens[4]) return reject(text, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté après sinon.', { start: tokens[4].range.start, end });
    return render(text, { kind: 'ELSE', parameters: {} });
  }

  const functions = analyzeFunctionInstruction(text, tokens, end, identifierDiagnostic);
  if (functions?.status === 'rejected') return { status: 'rejected', source: { text }, diagnostics: [functions.diagnostic] };
  if (functions?.status === 'recognized') return render(text, functions.instruction);

  const numeric = analyzeNumericInstruction(text, tokens, end, identifierDiagnostic);
  if (numeric?.status === 'rejected') return { status: 'rejected', source: { text }, diagnostics: [numeric.diagnostic] };
  if (numeric?.status === 'recognized') return render(text, numeric.instruction);

  if (tokens[0]?.text.toLowerCase() === 'affecte' && tokens[1]?.text.toLowerCase() === 'à') {
    return translateAssignmentExpression(text, tokens, end);
  }

  const display = analyzeDisplay(tokens);
  if (display) return translateDisplayLevel1(text, display);

  // Choose the exact fixed-word prefix, without fuzzy matching or inference.
  // Parameters occupy one token; validate only after selecting the best prefix.
  let rule = RULES[0];
  let bestScore = -1;
  for (const candidate of RULES) {
    let score = 0;
    for (const [i, part] of candidate.parts.entries()) {
      const token = tokens[i];
      if (!token) break;
      if (typeof part === 'string' && !sameWord(part, token.text)) break;
      score++;
    }
    if (score > bestScore) { bestScore = score; rule = candidate; }
  }

  const parameters: { name?: string; value?: string } = {};
  for (const [i, part] of rule.parts.entries()) {
    const token = tokens[i];
    if (!token) {
      const expected = typeof part === 'string' ? `« ${part} »` : part.parameter === 'name' ? 'un nom' : part.parameter === 'header' ? 'stdio.h' : 'un entier décimal';
      return reject(text, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : ${expected} attendu.`, { start: end, end });
    }
    if (typeof part === 'string') {
      if (!sameWord(part, token.text)) {
        return reject(text, 'UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', token.range);
      }
    } else if (part.parameter === 'name') {
      if (C17_KEYWORDS.has(token.text)) {
        return reject(text, 'C_KEYWORD_IDENTIFIER', `« ${token.text} » est un mot-clé C17 et ne peut pas être utilisé comme nom.`, token.range);
      }
      if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(token.text)) {
        return reject(text, 'INVALID_IDENTIFIER', 'Le nom doit commencer par une lettre ASCII et contenir uniquement lettres ASCII, chiffres ou soulignements.', token.range);
      }
      parameters.name = token.text;
    } else if (part.parameter === 'header') {
      if (token.text !== 'stdio.h') {
        return reject(text, 'UNSUPPORTED_HEADER', 'Seul l’en-tête stdio.h, écrit exactement ainsi, est pris en charge.', token.range);
      }
    } else {
      if (!/^(?:0|-?[1-9][0-9]*)$/u.test(token.text)) {
        return reject(text, 'INVALID_INTEGER', 'Un entier décimal sans signe + ni zéro initial est attendu.', token.range);
      }
      parameters.value = token.text;
    }
  }
  const extra = tokens[rule.parts.length];
  const last = tokens.at(-1);
  if (extra && last) {
    return reject(text, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', {
      start: extra.range.start, end: last.range.end,
    });
  }

  switch (rule.kind) {
    case 'MAIN': return render(text, { kind: 'MAIN', parameters: {} });
    case 'DECL_INT': return render(text, { kind: 'DECL_INT', parameters: { name: requiredParameter(parameters.name) } });
    case 'INIT_INT': return render(text, { kind: 'INIT_INT', parameters: { name: requiredParameter(parameters.name), value: requiredParameter(parameters.value) } });
    case 'ASSIGN_INT': return render(text, { kind: 'ASSIGN_INT', parameters: { name: requiredParameter(parameters.name), value: requiredParameter(parameters.value) } });
    case 'INCLUDE_STDIO': return render(text, { kind: 'INCLUDE_STDIO', parameters: {} });
    case 'PRINT_INT': return render(text, { kind: 'PRINT_INT', parameters: { name: requiredParameter(parameters.name) } });
    case 'BREAK': return render(text, { kind: 'BREAK', parameters: {} });
    case 'CONTINUE': return render(text, { kind: 'CONTINUE', parameters: {} });
  }
}

/** Finite escape grammar; all ranges refer to the untouched UTF-16 source. */
function translateLiteral(source: string, position: number, end: number): TranslationResult {
  while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
  if (position === end) {
    return reject(source, 'INCOMPLETE_INSTRUCTION', 'Un texte entre guillemets ASCII est attendu.', { start: end, end });
  }
  if (source.charAt(position) !== '"') {
    const width = source.codePointAt(position)! > 0xffff ? 2 : 1;
    return reject(source, 'UNKNOWN_FORMULATION', 'Le texte doit être entouré de guillemets ASCII.', { start: position, end: position + width });
  }
  const opening = position++;
  let value = '';
  while (position < end) {
    const current = source.charAt(position);
    if (current === '"') {
      position++;
      while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
      if (position !== end) return reject(source, 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: position, end });
      return render(source, { kind: 'PRINT_TEXT', parameters: { text: value } });
    }
    if (/^\?\?[=/'()!<>-]/u.test(source.slice(position, position + 3))) {
      return reject(source, 'UNSUPPORTED_STRING_CONTENT', 'Les trigraphes C ne sont pas pris en charge dans les textes.', { start: position, end: position + 3 });
    }
    if (current === '\\') {
      const next = source.charAt(position + 1);
      const escapes: Readonly<Record<string, string>> = { '"': '"', '\\': '\\', n: '\n', t: '\t' };
      const decoded = escapes[next];
      if (decoded === undefined) {
        const width = (source.codePointAt(position + 1) ?? 0) > 0xffff ? 2 : 1;
        return reject(source, 'INVALID_STRING_ESCAPE', 'Échappement attendu : \\" , \\\\ , \\n ou \\t.', { start: position, end: Math.min(position + 1 + width, end) });
      }
      value += decoded;
      position += 2;
      continue;
    }
    const point = source.codePointAt(position)!;
    const width = point > 0xffff ? 2 : 1;
    if (point <= 0x1f || (point >= 0x7f && point <= 0x9f) || (point >= 0xd800 && point <= 0xdfff)) {
      return reject(source, 'UNSUPPORTED_STRING_CONTENT', 'Caractère de contrôle ou Unicode invalide dans le texte.', { start: position, end: position + width });
    }
    value += source.slice(position, position + width);
    position += width;
  }
  return reject(source, 'UNTERMINATED_STRING', 'Le guillemet fermant du texte est absent.', { start: opening, end });
}
