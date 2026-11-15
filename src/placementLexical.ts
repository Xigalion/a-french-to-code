import type { SourceRange } from './translate.ts';

export type LexicalIssue = {
  code: 'TARGET_IN_COMMENT' | 'LEXICAL_CONTEXT_UNDETERMINED'
    | 'UNSUPPORTED_LINE_CONTINUATION' | 'UNSUPPORTED_TRIGRAPH' | 'UNSUPPORTED_DIRECTIVE';
  reason: 'unsafe-location' | 'unsupported-construct';
  message: string;
  range: SourceRange;
};

/** Only the prefix before the target line is inspected, never a C syntax tree. */
export function inspectPrefix(prefix: string): LexicalIssue | undefined {
  // These transformations precede comments and literals in C. Check them raw,
  // including inside otherwise valid comments, headers and escaped strings.
  const splice = /\\[ \t\v\f]*(?:\r\n|\n)/u.exec(prefix);
  const trigraph = /\?\?[=\/'()!<>-]/u.exec(prefix);
  if (trigraph && (!splice || trigraph.index < splice.index)) {
    return {
      code: 'UNSUPPORTED_TRIGRAPH', reason: 'unsupported-construct',
      message: 'Les trigraphes C17 avant la cible ne sont pas pris en charge dans ce lot.',
      range: { start: trigraph.index, end: trigraph.index + 3 },
    };
  }
  if (splice) {
    return {
      code: 'UNSUPPORTED_LINE_CONTINUATION', reason: 'unsupported-construct',
      message: 'Les continuations physiques de ligne avant la cible ne sont pas prises en charge dans ce lot.',
      range: { start: splice.index, end: splice.index + splice[0].length },
    };
  }
  const nul = prefix.indexOf('\0');
  if (nul !== -1) {
    return {
      code: 'LEXICAL_CONTEXT_UNDETERMINED', reason: 'unsupported-construct',
      message: 'Un caractère NUL avant la cible n’est pas pris en charge dans ce lot.',
      range: { start: nul, end: nul + 1 },
    };
  }

  let state: 'code' | 'line-comment' | 'block-comment' | 'string' | 'character' = 'code';
  let opening = 0;
  let lineStart = 0;
  let onlyTrivia = true;
  for (let i = 0; i < prefix.length; i++) {
    const char = prefix.charAt(i);
    const next = prefix.charAt(i + 1);
    if (state === 'line-comment') {
      if (char === '\n') { state = 'code'; onlyTrivia = true; lineStart = i + 1; }
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') { state = 'code'; i++; }
      else if (char === '\n') { onlyTrivia = true; lineStart = i + 1; }
      continue;
    }
    if (state === 'string' || state === 'character') {
      if (char === '\r' || char === '\n') {
        return {
          code: 'LEXICAL_CONTEXT_UNDETERMINED', reason: 'unsafe-location',
          message: 'Un littéral non terminé avant la cible empêche de déterminer un emplacement sûr.',
          range: { start: opening, end: i },
        };
      }
      if (char === '\\') { i++; continue; }
      if ((state === 'string' && char === '"') || (state === 'character' && char === "'")) state = 'code';
      continue;
    }

    if (char === '\n') { onlyTrivia = true; lineStart = i + 1; continue; }
    if (/[ \t\r\v\f]/u.test(char) || (i === 0 && char === '\ufeff')) continue;
    if (char === '/' && next === '/') { state = 'line-comment'; i++; continue; }
    if (char === '/' && next === '*') { state = 'block-comment'; opening = i; i++; continue; }
    if (onlyTrivia && (char === '#' || (char === '%' && next === ':'))) {
      const newline = prefix.indexOf('\n', i);
      const end = newline === -1 ? prefix.length : newline;
      const line = prefix.slice(lineStart, end).replace(/\r$/u, '');
      // Deliberately narrow header grammar: no escapes, embedded delimiters,
      // block comments, macro includes, or directives following a block comment.
      const include = /^[ \t]*#[ \t]*include[ \t]+(?:<[^<>"\\\r\n]+>|"[^"<>\\\r\n]+")[ \t]*(?:\/\/[^\r\n]*)?$/u;
      // Lot 23 widening, deliberately narrow: the three directives of a header
      // guard, and nothing else. An object-like `#define NAME` with NO
      // replacement list is accepted; `#define NAME value` stays refused,
      // because C-A does not expand macros and must not read code whose tokens
      // a macro could change.
      const guard = /^[ \t]*#[ \t]*(?:ifndef[ \t]+[A-Za-z_][A-Za-z0-9_]*|define[ \t]+[A-Za-z_][A-Za-z0-9_]*|endif)[ \t]*(?:\/\/[^\r\n]*)?$/u;
      if (!include.test(line) && !guard.test(line)) {
        return {
          code: 'UNSUPPORTED_DIRECTIVE', reason: 'unsupported-construct',
          message: 'Seules les inclusions directes simples avant la cible sont prises en charge dans ce lot.',
          range: { start: i, end: lineStart + line.length },
        };
      }
      i = end - 1;
      onlyTrivia = false;
      continue;
    }
    onlyTrivia = false;
    if (char === '"' || char === "'") {
      state = char === '"' ? 'string' : 'character'; opening = i;
    }
  }
  if (state === 'block-comment') {
    return {
      code: 'TARGET_IN_COMMENT', reason: 'unsafe-location',
      message: 'La ligne cible appartient à un commentaire multiligne.',
      range: { start: opening, end: opening + 2 },
    };
  }
  if (state === 'string' || state === 'character') {
    return {
      code: 'LEXICAL_CONTEXT_UNDETERMINED', reason: 'unsafe-location',
      message: 'Le contexte lexical avant la cible ne peut pas être établi.',
      range: { start: opening, end: prefix.length },
    };
  }
  return undefined;
}
