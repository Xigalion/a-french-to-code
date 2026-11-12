import type { SourceRange } from './translate.ts';
import { scanEnclosing, checkStatementPosition } from './enclosingStructures.ts';
import type { ContextIssue } from './enclosingStructures.ts';

export type ReturnType = 'void' | 'int' | 'unsigned int' | 'float' | 'double';
export type FunctionContext = { returnType: ReturnType; nameRange: SourceRange; braceRange: SourceRange };
export type FunctionCode = 'NO_ENCLOSING_FUNCTION' | 'UNSUPPORTED_RETURN_TYPE' | 'FUNCTION_DEFINITION_NESTED';
export type FileScopeResolution = { status: 'resolved' } | { status: 'rejected'; diagnostic: Issue };

/** C17 has no nested function definitions, so a new definition belongs at file
 * scope only: no brace may still be open before the target line. This is a
 * local, structural check on one scan, not a scope analyser. Anything this
 * recognizer cannot classify is refused rather than assumed to be valid.
 */
export function resolveFileScope(text: string, lineStart: number): FileScopeResolution {
  const scan = scanEnclosing(text, lineStart);
  if (scan.status === 'rejected') return { status: 'rejected', diagnostic: scan.diagnostic };
  const position = checkStatementPosition(scan);
  if (position) {
    return { status: 'rejected', diagnostic: { code: 'NOT_A_STATEMENT_POSITION', reason: 'unsupported-construct',
      message: position.message, range: position.range } };
  }
  const nested = scan.frames.find(frame => frame.kind === 'function');
  if (nested) {
    return { status: 'rejected', diagnostic: { code: 'FUNCTION_DEFINITION_NESTED', reason: 'unsafe-location',
      message: 'En C17, une définition de fonction ne peut pas être imbriquée dans une autre : '
        + 'placez-la en dehors de tout corps de fonction.', range: { ...nested.keywordRange } } };
  }
  const open = scan.frames[scan.frames.length - 1];
  if (open) {
    return { status: 'rejected', diagnostic: { code: 'UNSUPPORTED_ENCLOSING_CONTEXT', reason: 'unsupported-construct',
      message: 'Une accolade encore ouverte précède cette ligne : la validité de cet emplacement '
        + 'pour une définition de fonction ne peut pas être établie.', range: { ...open.braceRange } } };
  }
  return { status: 'resolved' };
}
type Issue = { code: FunctionCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | ContextIssue;
export type FunctionResolution = { status: 'resolved'; context: FunctionContext } | { status: 'rejected'; diagnostic: Issue };

const SUPPORTED: readonly string[] = ['void', 'int', 'unsigned int', 'float', 'double'];

/** The function a target line belongs to, with the return type **as the author
 * declared it**. This reads one header syntactically; it is not a type checker
 * and says nothing about the type of any expression.
 */
export function resolveFunctionContext(text: string, lineStart: number): FunctionResolution {
  const scan = scanEnclosing(text, lineStart);
  if (scan.status === 'rejected') return { status: 'rejected', diagnostic: scan.diagnostic };
  const position = checkStatementPosition(scan);
  // An unbraced loop body is a legitimate place for a return: unlike a
  // transfer, a return never depends on which loop encloses it.
  if (position?.kind === 'not-statement') {
    return { status: 'rejected', diagnostic: { code: 'NOT_A_STATEMENT_POSITION', reason: 'unsupported-construct',
      message: position.message, range: position.range } };
  }
  for (let index = scan.frames.length - 1; index >= 0; index--) {
    const frame = scan.frames[index]!;
    if (frame.kind === 'unsupported') {
      return { status: 'rejected', diagnostic: { code: 'UNSUPPORTED_ENCLOSING_CONTEXT', reason: 'unsupported-construct',
        message: 'Une structure englobante de cette ligne n’est pas reconnue.', range: frame.braceRange } };
    }
    if (frame.kind !== 'function') continue;
    const declared = frame.returnType ?? '';
    if (!SUPPORTED.includes(declared)) {
      return { status: 'rejected', diagnostic: { code: 'UNSUPPORTED_RETURN_TYPE', reason: 'unsupported-construct',
        message: declared === ''
          ? 'Le type de retour de cette fonction n’est pas écrit : il ne peut pas être établi.'
          : `Le type de retour « ${declared} » de cette fonction n’est pas pris en charge.`,
        range: { ...frame.keywordRange } } };
    }
    return { status: 'resolved', context: { returnType: declared as ReturnType,
      nameRange: { ...frame.keywordRange }, braceRange: { ...frame.braceRange } } };
  }
  return { status: 'rejected', diagnostic: { code: 'NO_ENCLOSING_FUNCTION', reason: 'unsafe-location',
    message: 'Aucune fonction bracée prise en charge n’englobe cette ligne.', range: { start: lineStart, end: lineStart } } };
}
