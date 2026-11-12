import type { SourceRange } from './translate.ts';
import { inspectPrefix } from './placementLexical.ts';
import type { LexicalIssue } from './placementLexical.ts';

/** Own budgets. The lot 10 branch recognizer keeps its own, as required: the
 * two recognizers answer different questions and must not share state.
 */
export const MAX_TRANSFER_UNITS = 1_048_576;
export const MAX_TRANSFER_TOKENS = 50_000;
export const MAX_TRANSFER_DEPTH = 128;

export type Transfer = 'break' | 'continue';
export type LoopForm = 'while' | 'for' | 'do';
export type LoopTarget = { form: LoopForm; keywordRange: SourceRange; braceRange: SourceRange; switchesCrossed: number };
export type TransferCode = 'LOOP_TARGET_NOT_FOUND' | 'BREAK_TARGET_IS_SWITCH' | 'UNBRACED_LOOP_BODY'
  | 'NOT_A_STATEMENT_POSITION' | 'UNSUPPORTED_LOOP_CONTEXT' | 'TRANSFER_SCAN_LIMIT';
type Issue = { code: TransferCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | LexicalIssue;
export type TransferResolution = { status: 'resolved'; target: LoopTarget } | { status: 'rejected'; diagnostic: Issue };

type Token = { text: string; start: number; end: number };
/** What an opening brace was proven to open. `unsupported` is not a failure by
 * itself: it only matters if it lies between the target and its loop.
 */
type FrameKind = 'while' | 'for' | 'do' | 'switch' | 'if' | 'else' | 'block' | 'function' | 'unsupported';
type Frame = { kind: FrameKind; keywordRange: SourceRange; braceRange: SourceRange };

const LOOP_FORMS: readonly FrameKind[] = ['while', 'for', 'do'];
const HEADER_KEYWORDS: readonly string[] = ['while', 'for', 'switch', 'if'];

/** Source-only, deliberately bounded recognizer of the enclosing structures of
 * a target line. It never expands macros, never rewrites bodies, and never
 * infers a target from indentation or from the last `while` word seen.
 *
 * C17: `break` leaves the smallest enclosing switch *or* loop, `continue` the
 * smallest enclosing loop. A hand-written switch can therefore make `break;`
 * fail to mean « sors de la boucle » — that case is refused, never rewritten.
 */
export function resolveLoopTarget(text: string, lineStart: number, transfer: Transfer): TransferResolution {
  const refuse = (code: TransferCode, message: string, range: SourceRange = { start: lineStart, end: lineStart },
    reason: 'unsafe-location' | 'unsupported-construct' = 'unsafe-location'): TransferResolution =>
    ({ status: 'rejected', diagnostic: { code, reason, message, range } });
  const limit = (at: number): TransferResolution => refuse('TRANSFER_SCAN_LIMIT',
    'La reconnaissance du contexte de cette ligne dépasse les limites documentaires prises en charge.',
    { start: at, end: at }, 'unsupported-construct');
  if (lineStart > MAX_TRANSFER_UNITS) return limit(MAX_TRANSFER_UNITS);
  const lexical = inspectPrefix(text.slice(0, lineStart));
  if (lexical) return { status: 'rejected', diagnostic: lexical };

  const tokens: Token[] = [];
  let position = 0;
  let unsupportedAt: number | undefined;
  while (position < lineStart) {
    if (position >= MAX_TRANSFER_UNITS) return limit(position);
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
    if (tokens.length > MAX_TRANSFER_TOKENS) return limit(start);
  }
  if (unsupportedAt !== undefined) {
    return refuse('UNSUPPORTED_LOOP_CONTEXT', 'Ce contexte ne permet pas d’établir la structure englobante.',
      { start: unsupportedAt, end: unsupportedAt + 1 }, 'unsupported-construct');
  }

  // Parenthesis mates, so a « ) { » can be traced back to its keyword.
  const mates = new Map<number, number>();
  const openings: number[] = [];
  const frames: Frame[] = [];
  for (const [index, token] of tokens.entries()) {
    if (token.text === '(' || token.text === '[') openings.push(index);
    else if (token.text === ')' || token.text === ']') {
      const opening = openings.pop();
      const expected = token.text === ')' ? '(' : '[';
      if (opening === undefined || tokens[opening]?.text !== expected) {
        return refuse('UNSUPPORTED_LOOP_CONTEXT', 'Les délimiteurs avant cette ligne ne s’apparient pas.',
          { start: token.start, end: token.end }, 'unsupported-construct');
      }
      mates.set(index, opening);
    } else if (token.text === '{') {
      frames.push({ kind: classify(tokens, index, mates, frames.length), keywordRange: keywordRange(tokens, index, mates), braceRange: { start: token.start, end: token.end } });
      if (frames.length > MAX_TRANSFER_DEPTH) return limit(token.start);
    } else if (token.text === '}') {
      if (!frames.pop()) {
        return refuse('UNSUPPORTED_LOOP_CONTEXT', 'Une accolade fermante avant cette ligne n’a pas d’ouvrante.',
          { start: token.start, end: token.end }, 'unsupported-construct');
      }
    }
  }
  if (openings.length) {
    const token = tokens[openings[openings.length - 1]!]!;
    return refuse('UNSUPPORTED_LOOP_CONTEXT', 'Un délimiteur ouvert avant cette ligne empêche d’établir la structure englobante.',
      { start: token.start, end: token.end }, 'unsupported-construct');
  }

  // The target line must be a statement position, and must not be the unbraced
  // body of a loop or a switch: such a body is the enclosing structure, and it
  // carries no brace this recognizer could have tracked.
  const last = tokens.at(-1);
  if (last) {
    if (last.text === 'do') return refuse('UNBRACED_LOOP_BODY',
      'Le corps de cette boucle n’est pas entre accolades : la structure visée ne peut pas être établie.',
      { start: last.start, end: last.end }, 'unsupported-construct');
    if (last.text === ')') {
      const opening = mates.get(tokens.length - 1);
      const keyword = opening === undefined ? undefined : tokens[opening - 1]?.text;
      if (keyword === 'while' || keyword === 'for' || keyword === 'switch') {
        return refuse('UNBRACED_LOOP_BODY',
          'Le corps de cette structure n’est pas entre accolades : la structure visée ne peut pas être établie.',
          { start: last.start, end: last.end }, 'unsupported-construct');
      }
      if (keyword !== 'if') {
        return refuse('NOT_A_STATEMENT_POSITION', 'Cette ligne n’est pas une position d’instruction reconnue.',
          { start: last.start, end: last.end }, 'unsupported-construct');
      }
    } else if (!['{', '}', ';', ':', 'else'].includes(last.text)) {
      return refuse('NOT_A_STATEMENT_POSITION', 'Cette ligne n’est pas une position d’instruction reconnue.',
        { start: last.start, end: last.end }, 'unsupported-construct');
    }
  }

  // Innermost first, stopping at the enclosing function.
  let switchesCrossed = 0;
  for (let index = frames.length - 1; index >= 0; index--) {
    const frame = frames[index]!;
    if (frame.kind === 'unsupported') {
      return refuse('UNSUPPORTED_LOOP_CONTEXT', 'Une structure englobante de cette ligne n’est pas reconnue.',
        frame.braceRange, 'unsupported-construct');
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

/** What the brace at `index` opens, proven from the tokens before it. */
function classify(tokens: Token[], index: number, mates: Map<number, number>, depth: number): FrameKind {
  const previous = tokens[index - 1];
  if (!previous) return 'block';
  if (previous.text === 'do') return 'do';
  if (previous.text === 'else') return 'else';
  if (['{', '}', ';', ':'].includes(previous.text)) return 'block';
  if (previous.text === ')') {
    const opening = mates.get(index - 1);
    if (opening === undefined) return 'unsupported';
    const keyword = tokens[opening - 1]?.text;
    if (keyword !== undefined && HEADER_KEYWORDS.includes(keyword)) return keyword as FrameKind;
    // A declarator followed by a block is a function definition, and only at
    // file scope. Anywhere else, this shape is not something to interpret.
    return depth === 0 && keyword !== undefined && /^[\p{L}_][\p{L}\p{N}_]*$/u.test(keyword) ? 'function' : 'unsupported';
  }
  return 'unsupported';
}

function keywordRange(tokens: Token[], index: number, mates: Map<number, number>): SourceRange {
  const previous = tokens[index - 1];
  if (previous && (previous.text === 'do' || previous.text === 'else')) return { start: previous.start, end: previous.end };
  if (previous?.text === ')') {
    const opening = mates.get(index - 1);
    const keyword = opening === undefined ? undefined : tokens[opening - 1];
    if (keyword) return { start: keyword.start, end: keyword.end };
  }
  const brace = tokens[index]!;
  return { start: brace.start, end: brace.end };
}
