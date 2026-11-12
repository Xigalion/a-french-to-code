import type { SourceRange } from './translate.ts';
import { inspectPrefix } from './placementLexical.ts';
import type { LexicalIssue } from './placementLexical.ts';

/** Shared budgets of the contextual recognizers. The lot 10 branch recognizer
 * keeps its own, separate ones: it answers a different question.
 */
export const MAX_CONTEXT_UNITS = 1_048_576;
export const MAX_CONTEXT_TOKENS = 50_000;
export const MAX_CONTEXT_DEPTH = 128;

export type ContextCode = 'CONTEXT_SCAN_LIMIT' | 'UNSUPPORTED_ENCLOSING_CONTEXT' | 'NOT_A_STATEMENT_POSITION';
export type ContextIssue = { code: ContextCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | LexicalIssue;

/** What an opening brace was proven to open. `unsupported` is not a failure by
 * itself: it only matters when it lies between the target and the structure
 * being looked for.
 */
export type FrameKind = 'while' | 'for' | 'do' | 'switch' | 'if' | 'else' | 'block' | 'function' | 'unsupported';
export type Frame = {
  kind: FrameKind;
  /** The keyword that introduced the structure, or the function name. */
  keywordRange: SourceRange;
  braceRange: SourceRange;
  /** Function frames only: the declared return type, exactly as written. */
  returnType?: string;
};
export type Token = { text: string; start: number; end: number };
export type Scan = { status: 'scanned'; frames: Frame[]; tokens: Token[]; mates: Map<number, number> }
  | { status: 'rejected'; diagnostic: ContextIssue };

const HEADER_KEYWORDS: readonly string[] = ['while', 'for', 'switch', 'if'];
/** Words a supported return type may be made of. Anything else makes the
 * declaration unreadable to this recognizer, which then says so.
 */
const TYPE_WORDS: readonly string[] = ['void', 'int', 'unsigned', 'signed', 'short', 'long', 'float', 'double',
  'char', 'const', 'static', 'extern', 'inline', '_Bool', 'struct', 'union', 'enum'];

/** Source-only, deliberately bounded scan of what encloses a target line.
 * It never expands macros, never rewrites bodies, and never infers anything
 * from indentation or from the last keyword seen.
 */
export function scanEnclosing(text: string, lineStart: number): Scan {
  const refuse = (code: ContextCode, message: string, range: SourceRange,
    reason: 'unsafe-location' | 'unsupported-construct' = 'unsupported-construct'): Scan =>
    ({ status: 'rejected', diagnostic: { code, reason, message, range } });
  const limit = (at: number): Scan => refuse('CONTEXT_SCAN_LIMIT',
    'La reconnaissance du contexte de cette ligne dépasse les limites documentaires prises en charge.',
    { start: at, end: at });
  if (lineStart > MAX_CONTEXT_UNITS) return limit(MAX_CONTEXT_UNITS);
  const lexical = inspectPrefix(text.slice(0, lineStart));
  if (lexical) return { status: 'rejected', diagnostic: lexical };

  const tokens: Token[] = [];
  let position = 0;
  let unsupportedAt: number | undefined;
  while (position < lineStart) {
    if (position >= MAX_CONTEXT_UNITS) return limit(position);
    const start = position;
    const char = text.charAt(position);
    if (/[ \t\r\n]/u.test(char) || (position === 0 && char === '﻿')) { position++; continue; }
    if (text.startsWith('//', position)) {
      while (position < lineStart && text.charAt(position) !== '\n') position++;
      continue;
    }
    if (text.startsWith('/*', position)) {
      position += 2;
      while (position < lineStart && !text.startsWith('*/', position)) position++;
      // inspectPrefix already refused a target inside an open block comment.
      if (position >= lineStart) return limit(start);
      position += 2;
      continue;
    }
    if (char === '#' || text.startsWith('%:', position)) {
      const beginning = text.lastIndexOf('\n', start - 1) + 1;
      if (char !== '#' || !/^[ \t]*$/u.test(text.slice(beginning, start))) { unsupportedAt ??= start; break; }
      // inspectPrefix already verified this is a direct, single-line include.
      const newline = text.indexOf('\n', position);
      position = newline === -1 ? lineStart : newline + 1;
      continue;
    }
    if (['<%', '%>', '<:', ':>'].some(value => text.startsWith(value, position)) || char === '\\' || char === '\0') {
      unsupportedAt ??= start;
      break;
    }
    if (char === '"' || char === "'") {
      position++;
      while (position < lineStart && text.charAt(position) !== char) {
        if (/[\r\n]/u.test(text.charAt(position))) { unsupportedAt ??= start; break; }
        if (text.charAt(position) === '\\') position++;
        position++;
      }
      if (unsupportedAt !== undefined) break;
      if (position >= lineStart) { unsupportedAt ??= start; break; }
      position++;
    } else {
      const word = /^[\p{L}\p{N}_]+/u.exec(text.slice(position, lineStart));
      position += word ? word[0].length : text.codePointAt(position)! > 0xffff ? 2 : 1;
    }
    tokens.push({ text: text.slice(start, position), start, end: position });
    if (tokens.length > MAX_CONTEXT_TOKENS) return limit(start);
  }
  if (unsupportedAt !== undefined) {
    return refuse('UNSUPPORTED_ENCLOSING_CONTEXT', 'Ce contexte ne permet pas d’établir la structure englobante.',
      { start: unsupportedAt, end: unsupportedAt + 1 });
  }

  // Delimiter mates, so a « ) { » can be traced back to its keyword or name.
  const mates = new Map<number, number>();
  const openings: number[] = [];
  const frames: Frame[] = [];
  for (const [index, token] of tokens.entries()) {
    if (token.text === '(' || token.text === '[') openings.push(index);
    else if (token.text === ')' || token.text === ']') {
      const opening = openings.pop();
      const expected = token.text === ')' ? '(' : '[';
      if (opening === undefined || tokens[opening]?.text !== expected) {
        return refuse('UNSUPPORTED_ENCLOSING_CONTEXT', 'Les délimiteurs avant cette ligne ne s’apparient pas.',
          { start: token.start, end: token.end });
      }
      mates.set(index, opening);
    } else if (token.text === '{') {
      frames.push(frame(tokens, index, mates, frames.length));
      if (frames.length > MAX_CONTEXT_DEPTH) return limit(token.start);
    } else if (token.text === '}') {
      if (!frames.pop()) {
        return refuse('UNSUPPORTED_ENCLOSING_CONTEXT', 'Une accolade fermante avant cette ligne n’a pas d’ouvrante.',
          { start: token.start, end: token.end });
      }
    }
  }
  if (openings.length) {
    const token = tokens[openings[openings.length - 1]!]!;
    return refuse('UNSUPPORTED_ENCLOSING_CONTEXT', 'Un délimiteur ouvert avant cette ligne empêche d’établir la structure englobante.',
      { start: token.start, end: token.end });
  }
  return { status: 'scanned', frames, tokens, mates };
}

/** The target line must be a statement position, and must not be the unbraced
 * body of a loop or a switch: such a body is the enclosing structure, and it
 * carries no brace a recognizer could have tracked.
 */
export type PositionIssue =
  | { kind: 'unbraced-body'; message: string; range: SourceRange }
  | { kind: 'not-statement'; message: string; range: SourceRange };

export function checkStatementPosition(scan: Extract<Scan, { status: 'scanned' }>): PositionIssue | undefined {
  const last = scan.tokens.at(-1);
  if (!last) return undefined;
  const range = { start: last.start, end: last.end };
  const unbraced: PositionIssue = { kind: 'unbraced-body', range,
    message: 'Le corps de cette structure n’est pas entre accolades : la structure visée ne peut pas être établie.' };
  const notStatement: PositionIssue = { kind: 'not-statement', range,
    message: 'Cette ligne n’est pas une position d’instruction reconnue.' };
  if (last.text === 'do') return unbraced;
  if (last.text === ')') {
    const opening = scan.mates.get(scan.tokens.length - 1);
    const keyword = opening === undefined ? undefined : scan.tokens[opening - 1]?.text;
    if (keyword === 'while' || keyword === 'for' || keyword === 'switch') return unbraced;
    return keyword === 'if' ? undefined : notStatement;
  }
  return ['{', '}', ';', ':', 'else'].includes(last.text) ? undefined : notStatement;
}

/** What the brace at `index` opens, proven from the tokens before it. */
function frame(tokens: Token[], index: number, mates: Map<number, number>, depth: number): Frame {
  const brace = tokens[index]!;
  const braceRange = { start: brace.start, end: brace.end };
  const previous = tokens[index - 1];
  if (!previous) return { kind: 'block', keywordRange: braceRange, braceRange };
  const previousRange = { start: previous.start, end: previous.end };
  if (previous.text === 'do') return { kind: 'do', keywordRange: previousRange, braceRange };
  if (previous.text === 'else') return { kind: 'else', keywordRange: previousRange, braceRange };
  if (['{', '}', ';', ':'].includes(previous.text)) return { kind: 'block', keywordRange: braceRange, braceRange };
  if (previous.text !== ')') return { kind: 'unsupported', keywordRange: braceRange, braceRange };
  const opening = mates.get(index - 1);
  if (opening === undefined) return { kind: 'unsupported', keywordRange: braceRange, braceRange };
  const head = tokens[opening - 1];
  if (head && HEADER_KEYWORDS.includes(head.text)) {
    return { kind: head.text as FrameKind, keywordRange: { start: head.start, end: head.end }, braceRange };
  }
  // A declarator followed by a block is a function definition, and only at file
  // scope. Anywhere else, this shape is not something to interpret.
  if (depth !== 0 || !head || !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(head.text)) {
    return { kind: 'unsupported', keywordRange: braceRange, braceRange };
  }
  // Walk back over the declared return type, exactly as the author wrote it.
  const words: string[] = [];
  for (let at = opening - 2; at >= 0 && tokens[at] && TYPE_WORDS.includes(tokens[at]!.text); at--) {
    words.unshift(tokens[at]!.text);
  }
  return { kind: 'function', keywordRange: { start: head.start, end: head.end }, braceRange,
    returnType: words.join(' ') };
}
