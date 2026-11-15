import type { SourceRange } from './translate.ts';
import { scanEnclosing } from './enclosingStructures.ts';
import type { ContextIssue } from './enclosingStructures.ts';

export type StructTarget = { tag: string | undefined; keywordRange: SourceRange; braceRange: SourceRange };
export type StructCode = 'FIELD_OUTSIDE_STRUCT' | 'STRUCT_SCAN_LIMIT' | 'UNSUPPORTED_STRUCT_CONTEXT';
type Issue = { code: StructCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | ContextIssue;
export type StructResolution = { status: 'resolved'; target: StructTarget } | { status: 'rejected'; diagnostic: Issue };

function structIssue(issue: ContextIssue): Issue {
  if (issue.code === 'CONTEXT_SCAN_LIMIT') return { ...issue, code: 'STRUCT_SCAN_LIMIT' };
  return issue;
}

/** The enclosing `struct`, `union` or `enum` definition of a field.
 *
 * The shared scan classifies such a brace as `unsupported`, because a tag
 * followed by a block is not a statement context and nothing before this lot
 * could be placed there. Rather than change that classification — which would
 * relax every other recognizer built on it — this reads the two tokens before
 * the innermost brace itself. The shared scan still does the bracing, the
 * comment and string skipping, and the budgets.
 */
export function resolveStructTarget(text: string, lineStart: number): StructResolution {
  const scan = scanEnclosing(text, lineStart);
  if (scan.status === 'rejected') return { status: 'rejected', diagnostic: structIssue(scan.diagnostic) };
  const innermost = scan.frames.at(-1);
  const refuse = (): StructResolution => ({ status: 'rejected', diagnostic: { code: 'FIELD_OUTSIDE_STRUCT',
    reason: 'unsafe-location', message: 'Un champ ne se déclare qu’à l’intérieur d’une structure.',
    range: { start: lineStart, end: lineStart } } });
  if (!innermost || innermost.kind !== 'unsupported') return refuse();
  // The tokens before the brace: `struct`, or `struct Tag`.
  const index = scan.tokens.findIndex(token => token.start === innermost.braceRange.start);
  if (index <= 0) return refuse();
  const before = scan.tokens[index - 1]!;
  const KEYWORDS = ['struct', 'union', 'enum'];
  if (KEYWORDS.includes(before.text)) {
    return { status: 'resolved', target: { tag: undefined,
      keywordRange: { start: before.start, end: before.end }, braceRange: { ...innermost.braceRange } } };
  }
  const keyword = scan.tokens[index - 2];
  if (!keyword || !KEYWORDS.includes(keyword.text) || !/^[A-Za-z][A-Za-z0-9_]*$/u.test(before.text)) return refuse();
  return { status: 'resolved', target: { tag: before.text,
    keywordRange: { start: keyword.start, end: keyword.end }, braceRange: { ...innermost.braceRange } } };
}
