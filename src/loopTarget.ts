import type { SourceRange } from './translate.ts';
import { scanEnclosing, checkStatementPosition, MAX_CONTEXT_UNITS, MAX_CONTEXT_TOKENS, MAX_CONTEXT_DEPTH } from './enclosingStructures.ts';
import type { ContextIssue, FrameKind } from './enclosingStructures.ts';

/** Kept for the published budget names of lot 11D; the scan is shared. */
export const MAX_TRANSFER_UNITS = MAX_CONTEXT_UNITS;
export const MAX_TRANSFER_TOKENS = MAX_CONTEXT_TOKENS;
export const MAX_TRANSFER_DEPTH = MAX_CONTEXT_DEPTH;

export type Transfer = 'break' | 'continue';
export type LoopForm = 'while' | 'for' | 'do';
export type LoopTarget = { form: LoopForm; keywordRange: SourceRange; braceRange: SourceRange; switchesCrossed: number };
export type TransferCode = 'LOOP_TARGET_NOT_FOUND' | 'BREAK_TARGET_IS_SWITCH' | 'UNBRACED_LOOP_BODY'
  | 'NOT_A_STATEMENT_POSITION' | 'UNSUPPORTED_LOOP_CONTEXT' | 'TRANSFER_SCAN_LIMIT';
type Issue = { code: TransferCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | ContextIssue;

/** The shared scan reports generic codes; lot 11D published its own, so they
 * are mapped here rather than changing an approved contract.
 */
function transferIssue(issue: ContextIssue): Issue {
  if (issue.code === 'CONTEXT_SCAN_LIMIT') return { ...issue, code: 'TRANSFER_SCAN_LIMIT' };
  if (issue.code === 'UNSUPPORTED_ENCLOSING_CONTEXT') return { ...issue, code: 'UNSUPPORTED_LOOP_CONTEXT' };
  return issue;
}
export type TransferResolution = { status: 'resolved'; target: LoopTarget } | { status: 'rejected'; diagnostic: Issue };

const LOOP_FORMS: readonly FrameKind[] = ['while', 'for', 'do'];

/** C17: `break` leaves the smallest enclosing switch *or* loop, `continue` the
 * smallest enclosing loop. A hand-written switch can therefore make `break;`
 * fail to mean « sors de la boucle » — that case is refused, never rewritten.
 */
export function resolveLoopTarget(text: string, lineStart: number, transfer: Transfer): TransferResolution {
  const scan = scanEnclosing(text, lineStart);
  if (scan.status === 'rejected') return { status: 'rejected', diagnostic: transferIssue(scan.diagnostic) };
  const position = checkStatementPosition(scan);
  if (position) {
    return { status: 'rejected', diagnostic: { reason: 'unsupported-construct', message: position.message, range: position.range,
      code: position.kind === 'unbraced-body' ? 'UNBRACED_LOOP_BODY' : 'NOT_A_STATEMENT_POSITION' } };
  }
  const refuse = (code: TransferCode, message: string, range: SourceRange = { start: lineStart, end: lineStart }): TransferResolution =>
    ({ status: 'rejected', diagnostic: { code, reason: 'unsafe-location', message, range } });

  // Innermost first, stopping at the enclosing function.
  let switchesCrossed = 0;
  for (let index = scan.frames.length - 1; index >= 0; index--) {
    const frame = scan.frames[index]!;
    if (frame.kind === 'unsupported') {
      return { status: 'rejected', diagnostic: { code: 'UNSUPPORTED_LOOP_CONTEXT', reason: 'unsupported-construct',
        message: 'Une structure englobante de cette ligne n’est pas reconnue.', range: frame.braceRange } };
    }
    if (frame.kind === 'function') break;
    if (LOOP_FORMS.includes(frame.kind)) {
      return { status: 'resolved', target: { form: frame.kind as LoopForm,
        keywordRange: { ...frame.keywordRange }, braceRange: { ...frame.braceRange }, switchesCrossed } };
    }
    if (frame.kind === 'switch') {
      // break would leave the switch, not the loop: the sentence would be false.
      if (transfer === 'break') {
        return refuse('BREAK_TARGET_IS_SWITCH',
          'Un switch englobe cette ligne : « break » en sortirait, pas de la boucle. Cette demande est refusée.',
          frame.keywordRange);
      }
      switchesCrossed++;
    }
  }
  return refuse('LOOP_TARGET_NOT_FOUND', transfer === 'break'
    ? 'Aucune boucle bracée prise en charge n’englobe cette ligne.'
    : 'Aucune boucle bracée prise en charge n’englobe cette ligne ; « continue » n’a pas de cible.');
}
