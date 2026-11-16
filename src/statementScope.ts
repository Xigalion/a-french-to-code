import type { SourceRange } from './translate.ts';
import { scanEnclosing } from './enclosingStructures.ts';
import type { ContextIssue, FrameKind } from './enclosingStructures.ts';

export type ScopeCode = 'STATEMENT_AT_FILE_SCOPE';
type Issue = { code: ScopeCode; reason: 'unsafe-location'; message: string; range: SourceRange } | ContextIssue;
export type ScopeResolution = { status: 'resolved' } | { status: 'rejected'; diagnostic: Issue };

/** Intents whose C rendering is a declaration, a definition or a directive.
 * At file scope a declared object is a definition with static storage
 * duration, so these are valid there and their placement is untouched.
 */
export const DECLARATION_KINDS: readonly string[] = [
  'INCLUDE_STDIO', 'INCLUDE_STDLIB', 'INCLUDE_ASSERT', 'INCLUDE_LIMITS', 'INCLUDE_LOCAL',
  'GUARD_OPEN', 'GUARD_CLOSE',
  'DECL_INT', 'INIT_INT', 'DECL_CHAR', 'INIT_CHAR', 'NUMERIC_DECL', 'NUMERIC_INIT',
  'ARRAY_DECL', 'STRING_INIT', 'DECL_POINTER', 'INIT_POINTER', 'CONST_DECL',
  'STRUCT_DECL', 'STRUCT_VAR', 'STRUCT_POINTER', 'TYPE_ALIAS',
  'FUNC_PROTOTYPE', 'LINKAGE_DECL', 'FILE_DECL',
];

/** Intents whose C rendering is an executable statement, compound statements
 * included. C17 admits a statement only inside a function body.
 */
export const STATEMENT_KINDS: readonly string[] = [
  'ASSIGN_INT', 'ASSIGN_CHAR', 'ASSIGN_EXPRESSION', 'NUMERIC_ASSIGN', 'ASSIGN_ADDRESS',
  'ASSIGN_POINTED_INT', 'ASSIGN_POINTED_EXPRESSION',
  'ARRAY_ASSIGN_INT', 'ARRAY_ASSIGN_CHAR', 'ARRAY_ASSIGN_EXPRESSION',
  'MEMBER_ASSIGN_INT', 'MEMBER_ASSIGN_CHAR', 'MEMBER_ASSIGN_EXPRESSION',
  'PRINT_INT', 'PRINT_CHAR', 'PRINT_TEXT', 'PRINT_FORMATTED', 'PRINT_STRING',
  'PRINT_POINTED', 'NUMERIC_PRINT', 'ARRAY_PRINT', 'ARRAY_PRINT_CHAR',
  'MEMBER_PRINT', 'SIZEOF_PRINT', 'PRINT_NEWLINE',
  'CALL', 'CALL_ASSIGN', 'SIZEOF_ASSIGN',
  'ALLOCATE', 'REALLOCATE', 'FREE',
  'FILE_OPEN', 'FILE_CLOSE', 'FILE_READ_INT', 'FILE_READ_STRING', 'FILE_WRITE_INT', 'FILE_WRITE_TEXT',
  'ASSERT',
  'IF', 'WHILE', 'DO_WHILE', 'FOR', 'SWITCH', 'FILE_AT_END',
];

/** Intents whose enclosing context was already proven by a dedicated
 * recognizer before this lot. None of those checks is touched or doubled.
 */
export const CONTEXT_VERIFIED_KINDS: readonly string[] = [
  'RETURN', 'RETURN_INT', 'RETURN_EXPRESSION', 'RETURN_NUMERIC',
  'BREAK', 'CONTINUE',
  'CASE_INT', 'CASE_CHAR', 'CASE_DEFAULT', 'BREAK_SWITCH',
  'ELSE', 'ELSE_IF', 'STRUCT_FIELD', 'FUNC_DEF', 'MAIN',
];

/** Braces inside which a statement may appear. A `struct`, `union` or `enum`
 * body is classified `unsupported` by the shared scan and is not one.
 */
const STATEMENT_FRAMES: readonly FrameKind[] = ['function', 'block', 'if', 'else', 'while', 'for', 'do', 'switch'];

/** Whether an executable statement may stand on the target line. This answers
 * one structural question and is not a scope, symbol or type analyser: it says
 * nothing about whether the names the statement uses exist.
 */
export function resolveStatementScope(text: string, lineStart: number): ScopeResolution {
  const scan = scanEnclosing(text, lineStart);
  if (scan.status === 'rejected') return { status: 'rejected', diagnostic: scan.diagnostic };
  // checkStatementPosition is deliberately NOT applied: the unbraced body of a
  // loop or an `if` is a valid place for a statement, and refusing it would
  // remove a capability unrelated to scope. Same reasoning as the lot 12 return.
  const innermost = scan.frames[scan.frames.length - 1];
  if (!innermost) {
    return { status: 'rejected', diagnostic: { code: 'STATEMENT_AT_FILE_SCOPE', reason: 'unsafe-location',
      message: 'En C17, une instruction exécutable n’existe que dans le corps d’une fonction. '
        + 'À la portée fichier, seules les déclarations, les définitions et les directives sont valides.',
      range: { start: lineStart, end: lineStart } } };
  }
  if (!STATEMENT_FRAMES.includes(innermost.kind)) {
    return { status: 'rejected', diagnostic: { code: 'UNSUPPORTED_ENCLOSING_CONTEXT', reason: 'unsupported-construct',
      message: 'La structure englobante de cette ligne n’est pas un contexte où une instruction peut figurer.',
      range: { ...innermost.braceRange } } };
  }
  if (!scan.frames.some(frame => frame.kind === 'function')) {
    return { status: 'rejected', diagnostic: { code: 'STATEMENT_AT_FILE_SCOPE', reason: 'unsafe-location',
      message: 'Aucune fonction n’englobe cette ligne : une instruction exécutable ne peut pas y figurer.',
      range: { ...innermost.braceRange } } };
  }
  return { status: 'resolved' };
}
