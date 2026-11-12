import type { SourceRange } from './translate.ts';
import { inspectPrefix } from './placementLexical.ts';
import type { LexicalIssue } from './placementLexical.ts';

export const MAX_BRANCH_UNITS = 1_048_576;
export const MAX_BRANCH_TOKENS = 50_000;
export const MAX_BRANCH_DEPTH = 128;
export const MAX_CHAIN_BRANCHES = 64;
export type Attachment = { rootIfRange: SourceRange; tailBraceRange: SourceRange; branchCountBefore: number };
export type BranchCode = 'BRANCH_TARGET_NOT_FOUND' | 'BRANCH_TARGET_AMBIGUOUS' | 'BRANCH_NOT_AT_CHAIN_END'
  | 'BRANCH_AFTER_ELSE' | 'UNSUPPORTED_BRANCH_CONTEXT' | 'BRANCH_INDENT_MISMATCH' | 'BRANCH_SCAN_LIMIT';
type Issue = { code: BranchCode; reason: 'unsafe-location' | 'unsupported-construct'; message: string; range: SourceRange } | LexicalIssue;
export type BranchResolution = { status: 'resolved'; attachment: Attachment } | { status: 'rejected'; diagnostic: Issue };
type Token = { text: string; start: number; end: number; parens: number };

/** Source-only, deliberately bounded recognizer. Never expands macros or rewrites bodies. */
export function resolveBranchTarget(text: string, lineStart: number, lineEnd: number, indent: string): BranchResolution {
  const refuse = (code: BranchCode, message: string, range: SourceRange = { start: lineStart, end: lineStart },
    reason: 'unsafe-location' | 'unsupported-construct' = 'unsafe-location'): BranchResolution =>
    ({ status: 'rejected', diagnostic: { code, reason, message, range } });
  const limit = (at: number) => refuse('BRANCH_SCAN_LIMIT', 'La reconnaissance de cette chaîne dépasse les limites documentaires prises en charge.',
    { start: at, end: at }, 'unsupported-construct');
  if (lineStart > MAX_BRANCH_UNITS) return limit(MAX_BRANCH_UNITS);
  const lexical = inspectPrefix(text.slice(0, lineStart));
  if (lexical) return { status: 'rejected', diagnostic: lexical };
  let position = 0;
  let error: BranchResolution | undefined;
  let count = 0;
  const tokens: Token[] = [];
  const stack: number[] = [];
  const mates = new Map<number, number>();
  let parens = 0;
  function unsupported(at: number, end = at + 1): void {
    error ??= refuse('UNSUPPORTED_BRANCH_CONTEXT', 'Cette disposition ou ce contexte ne permet pas un rattachement pris en charge.',
      { start: at, end }, 'unsupported-construct');
  }
  function next(end: number, suffix: boolean): Token | undefined {
    while (position < end && !error) {
      if (position >= MAX_BRANCH_UNITS) { error = limit(position); return undefined; }
      const start = position;
      const char = text.charAt(position);
      if (suffix && /^\?\?[=/'()!<>-]/u.test(text.slice(position, position + 3))) { unsupported(start, start + 3); return undefined; }
      if (/[ \t\r\n]/u.test(char) || (position === 0 && char === '\ufeff')) { position++; continue; }
      if (text.startsWith('//', position)) {
        while (position < end && text.charAt(position) !== '\n') {
          if (position >= MAX_BRANCH_UNITS) { error = limit(position); return undefined; }
          if (suffix && (text.startsWith('??', position) || text.charAt(position) === '\\')) {
            unsupported(position); return undefined;
          }
          position++;
        }
        continue;
      }
      if (text.startsWith('/*', position)) {
        position += 2;
        while (position < end && !text.startsWith('*/', position)) {
          if (position >= MAX_BRANCH_UNITS) { error = limit(position); return undefined; }
          if (suffix && (text.startsWith('??', position) || text.charAt(position) === '\\')) { unsupported(position); return undefined; }
          position++;
        }
        if (position >= end) { unsupported(start, Math.min(start + 2, end)); return undefined; }
        position += 2;
        if (position > MAX_BRANCH_UNITS || (position === MAX_BRANCH_UNITS && end > position)) { error = limit(position); return undefined; }
        continue;
      }
      if (char === '#' || text.startsWith('%:', position)) {
        if (suffix) { unsupported(start); return undefined; }
        const beginning = text.lastIndexOf('\n', start - 1) + 1;
        if (char !== '#' || !/^[ \t]*$/u.test(text.slice(beginning, start))) { unsupported(start); return undefined; }
        // inspectPrefix already verified this is a direct, single-line include.
        const newline = text.indexOf('\n', position);
        position = newline === -1 ? end : newline + 1;
        continue;
      }
      if (['<%', '%>', '<:', ':>'].some(value => text.startsWith(value, position)) || char === '\\' || char === '\0') {
        unsupported(start); return undefined;
      }
      if (char === '"' || char === "'") {
        position++;
        while (position < end && text.charAt(position) !== char) {
          if (position >= MAX_BRANCH_UNITS) { error = limit(position); return undefined; }
          if (/[\r\n]/u.test(text.charAt(position))) { unsupported(start, position); return undefined; }
          if (text.charAt(position) === '\\') position++;
          position++;
        }
        if (position >= end) { unsupported(start, position); return undefined; }
        position++;
      } else {
        const word = /^[\p{L}\p{N}_]+/u.exec(text.slice(position, Math.min(end, MAX_BRANCH_UNITS)));
        position += word ? word[0].length : text.codePointAt(position)! > 0xffff ? 2 : 1;
      }
      if (position > MAX_BRANCH_UNITS || (position === MAX_BRANCH_UNITS && end > position)) { error = limit(position); return undefined; }
      if (++count > MAX_BRANCH_TOKENS) { error = limit(start); return undefined; }
      return { text: text.slice(start, position), start, end: position, parens };
    }
    return undefined;
  }
  while (position < lineStart && !error) {
    const token = next(lineStart, false);
    if (!token) break;
    const index = tokens.length;
    tokens.push(token);
    if (['(', '{', '['].includes(token.text)) {
      stack.push(index);
      if (token.text !== '{') parens++;
      if (stack.length > MAX_BRANCH_DEPTH) error = limit(token.start);
    } else if ([')', '}', ']'].includes(token.text)) {
      const opening = stack.pop();
      const expected = token.text === ')' ? '(' : token.text === '}' ? '{' : '[';
      if (opening === undefined || tokens[opening]?.text !== expected) { unsupported(token.start); break; }
      mates.set(opening, index);
      if (token.text !== '}') parens--;
    }
  }
  if (error) return error;
  const previousLineStart = lineStart > 1 ? text.lastIndexOf('\n', lineStart - 2) + 1 : 0;
  const previousLine = text.slice(previousLineStart, lineStart).replace(/\r?\n$/u, '');
  const closingLine = /^([ \t]*)\}[ \t]*$/u.exec(previousLine);
  if (!closingLine) return refuse('BRANCH_TARGET_NOT_FOUND', 'Aucune chaîne if prise en charge ne se termine juste avant cette ligne.');
  const tail = tokens.at(-1);
  if (!tail || tail.text !== '}') return refuse('BRANCH_TARGET_NOT_FOUND', 'Aucune chaîne if prise en charge ne se termine juste avant cette ligne.');

  type Chain = { root: number; tail: number; branches: number; finalElse: number | undefined };
  const candidates: Chain[] = [];
  function body(at: number, conditional: boolean): number | undefined {
    if (conditional) {
      if (tokens[at]?.text !== '(') return undefined;
      const closing = mates.get(at);
      if (closing === undefined) return undefined;
      at = closing + 1;
    }
    return tokens[at]?.text === '{' ? mates.get(at) : undefined;
  }
  for (let root = 0; root < tokens.length; root++) {
    const token = tokens[root]!;
    if (token.text !== 'if' || token.parens !== 0) continue;
    const rootLineStart = text.lastIndexOf('\n', token.start - 1) + 1;
    if (!/^[ \t]*$/u.test(text.slice(rootLineStart, token.start))) continue;
    const prior = tokens[root - 1];
    if (prior && !['{', '}', ';'].includes(prior.text)) continue;
    let end = body(root + 1, true);
    if (end === undefined) continue;
    let branches = 1;
    let finalElse: number | undefined;
    while (tokens[end + 1]?.text === 'else') {
      const elseIndex = end + 1;
      const conditional = tokens[elseIndex + 1]?.text === 'if';
      const closing = body(elseIndex + (conditional ? 2 : 1), conditional);
      if (closing === undefined) { end = undefined; break; }
      branches++;
      end = closing;
      if (!conditional) { finalElse = elseIndex; break; }
    }
    if (end === tokens.length - 1) candidates.push({ root, tail: end, branches, finalElse });
  }
  if (!candidates.length) return refuse('UNSUPPORTED_BRANCH_CONTEXT', 'La fermeture ne termine pas une chaîne if bracée à une frontière reconnue.',
    { start: tail.start, end: tail.end }, 'unsupported-construct');
  if (candidates.length !== 1) return refuse('BRANCH_TARGET_AMBIGUOUS', 'Le rattachement de cette branche ne peut pas être établi sans ambiguïté.');
  const chain = candidates[0]!;
  position = lineEnd;
  const following = next(text.length, true);
  if (error) return error;
  if (following?.text === 'else') return refuse('BRANCH_NOT_AT_CHAIN_END', 'Cette ligne se trouve avant une branche existante ; placez le curseur après la chaîne complète.',
    { start: following.start, end: following.end });
  if (chain.finalElse !== undefined) {
    const token = tokens[chain.finalElse]!;
    return refuse('BRANCH_AFTER_ELSE', 'Cette chaîne possède déjà une branche sinon finale.', { start: token.start, end: token.end });
  }
  if (chain.branches >= MAX_CHAIN_BRANCHES) return limit(tail.start);
  const root = tokens[chain.root]!;
  const rootLineStart = text.lastIndexOf('\n', root.start - 1) + 1;
  if (text.slice(rootLineStart, root.start) !== indent || closingLine[1] !== indent) {
    return refuse('BRANCH_INDENT_MISMATCH', 'L’indentation de la ligne cible ne correspond pas à celle de la chaîne.',
      { start: lineStart, end: lineStart + indent.length }, 'unsupported-construct');
  }
  return { status: 'resolved', attachment: { rootIfRange: { start: root.start, end: root.end },
    tailBraceRange: { start: tail.start, end: tail.end }, branchCountBefore: chain.branches } };
}
