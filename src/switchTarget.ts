import type { SourceRange } from './translate.ts';
import { scanEnclosing, checkStatementPosition } from './enclosingStructures.ts';
import type { ContextIssue } from './enclosingStructures.ts';

export type SwitchTarget = { keywordRange: SourceRange; braceRange: SourceRange; loopsCrossed: number };
export type SwitchCode = 'SWITCH_TARGET_NOT_FOUND' | 'BREAK_TARGET_IS_LOOP' | 'UNBRACED_SWITCH_BODY'
  | 'NOT_A_STATEMENT_POSITION' | 'UNSUPPORTED_SWITCH_CONTEXT' | 'SWITCH_SCAN_LIMIT';
type Issue = { code: SwitchCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | ContextIssue;
export type SwitchResolution = { status: 'resolved'; target: SwitchTarget } | { status: 'rejected'; diagnostic: Issue };

/** The shared scan reports generic codes; this lot publishes its own, mapped
 * here rather than renaming anything an earlier contract published. */
function switchIssue(issue: ContextIssue): Issue {
  if (issue.code === 'CONTEXT_SCAN_LIMIT') return { ...issue, code: 'SWITCH_SCAN_LIMIT' };
  if (issue.code === 'UNSUPPORTED_ENCLOSING_CONTEXT') return { ...issue, code: 'UNSUPPORTED_SWITCH_CONTEXT' };
  return issue;
}

/** The enclosing switch of a label or of « Sors de l'aiguillage. ».
 *
 * C17: `break` leaves the smallest enclosing switch *or* loop. Lot 11D already
 * refuses « sors de la boucle » when a switch is nearer; this is the exact
 * mirror — a loop nearer than the switch makes the sentence false, and the
 * demand is refused rather than answered with a `break;` that does something
 * else. `labelOnly` skips that check, since a label is not a transfer.
 */
export function resolveSwitchTarget(text: string, lineStart: number, labelOnly: boolean): SwitchResolution {
  const scan = scanEnclosing(text, lineStart);
  if (scan.status === 'rejected') return { status: 'rejected', diagnostic: switchIssue(scan.diagnostic) };
  const position = checkStatementPosition(scan);
  if (position) {
    return { status: 'rejected', diagnostic: { reason: 'unsupported-construct', message: position.message, range: position.range,
      code: position.kind === 'unbraced-body' ? 'UNBRACED_SWITCH_BODY' : 'NOT_A_STATEMENT_POSITION' } };
  }
  let loopsCrossed = 0;
  for (let index = scan.frames.length - 1; index >= 0; index--) {
    const frame = scan.frames[index]!;
    if (frame.kind === 'unsupported') {
      return { status: 'rejected', diagnostic: { code: 'UNSUPPORTED_SWITCH_CONTEXT', reason: 'unsupported-construct',
        message: 'Une structure englobante de cette ligne n’est pas reconnue.', range: frame.braceRange } };
    }
    if (frame.kind === 'function') break;
    if (frame.kind === 'switch') {
      return { status: 'resolved', target: { keywordRange: { ...frame.keywordRange },
        braceRange: { ...frame.braceRange }, loopsCrossed } };
    }
    if (['while', 'for', 'do'].includes(frame.kind)) {
      if (!labelOnly) {
        return { status: 'rejected', diagnostic: { code: 'BREAK_TARGET_IS_LOOP', reason: 'unsafe-location',
          message: 'Une boucle englobe cette ligne plus près que l’aiguillage : « break » sortirait de la boucle, '
            + 'pas de l’aiguillage. Cette demande est refusée.', range: frame.keywordRange } };
      }
      loopsCrossed++;
    }
  }
  return { status: 'rejected', diagnostic: { code: 'SWITCH_TARGET_NOT_FOUND', reason: 'unsafe-location',
    message: 'Aucun aiguillage bracé n’englobe cette ligne.', range: { start: lineStart, end: lineStart } } };
}
