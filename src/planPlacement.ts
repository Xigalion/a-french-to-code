import { translate, BLOCK_KINDS } from './translate.ts';
import type { Instruction, SourceRange, TranslationResult } from './translate.ts';
import { inspectPrefix } from './placementLexical.ts';
import { resolveBranchTarget } from './branchTarget.ts';
import type { Attachment, BranchCode } from './branchTarget.ts';
import { resolveLoopTarget } from './loopTarget.ts';
import type { LoopTarget, TransferCode } from './loopTarget.ts';
import { resolveSwitchTarget } from './switchTarget.ts';
import type { SwitchTarget, SwitchCode } from './switchTarget.ts';
import { resolveStructTarget } from './structTarget.ts';
import type { StructTarget, StructCode } from './structTarget.ts';
import type { ContextCode } from './enclosingStructures.ts';
import { resolveFunctionContext, resolveFileScope } from './functionContext.ts';
import type { FunctionContext, FunctionCode } from './functionContext.ts';

export type SuccessfulTranslation = Extract<TranslationResult, { status: 'translated' }>;
/** Intents whose placement must agree with the enclosing function's contract. */
const RETURN_KINDS: readonly string[] = ['RETURN', 'RETURN_INT', 'RETURN_EXPRESSION', 'RETURN_NUMERIC'];
/** Labels and the switch exit: each needs its enclosing switch proven first. */
const SWITCH_KINDS: readonly string[] = ['CASE_INT', 'CASE_CHAR', 'CASE_DEFAULT', 'BREAK_SWITCH'];
export type DocumentSnapshot = { id: string; revision: string | number; text: string };
export type PlacementRequest = {
  document: DocumentSnapshot;
  cursorOffset: number;
  translation: SuccessfulTranslation;
  indentUnit?: string;
  /** Used only when no line ending exists at or before the target. */
  fallbackEol?: '\n' | '\r\n';
};
export type PlacementDiagnostic = {
  code: BranchCode | TransferCode | SwitchCode | StructCode | ContextCode | FunctionCode
    | 'RETURN_NEEDS_VALUE' | 'RETURN_IN_VOID_FUNCTION' | 'INVALID_DOCUMENT' | 'INVALID_CURSOR' | 'INVALID_INDENT_UNIT' | 'INVALID_EOL'
    | 'INVALID_TRANSLATION_RESULT' | 'TARGET_LINE_NOT_BLANK'
    | 'TARGET_IN_COMMENT' | 'LEXICAL_CONTEXT_UNDETERMINED'
    | 'UNSUPPORTED_LINE_CONTINUATION' | 'UNSUPPORTED_TRIGRAPH'
    | 'UNSUPPORTED_DIRECTIVE' | 'UNSUPPORTED_LINE_ENDING' | 'STALE_PLAN';
  category: 'placement';
  reason: 'invalid-request' | 'unsafe-location' | 'unsupported-construct' | 'stale-plan';
  severity: 'error';
  message: string;
  range?: SourceRange;
};
export type PlacementPlan = {
  attachment?: Attachment;
  branchContext?: { indentUnit: string };
  /** Set for break/continue: the loop the transfer was proven to control. */
  loopTarget?: LoopTarget;
  switchTarget?: SwitchTarget;
  structTarget?: StructTarget;
  /** Set for a return: the function the line was proven to belong to. */
  functionContext?: FunctionContext;
  /** Captured when a contextual recognizer ran, so freshness can rebuild. */
  recognizerContext?: { indentUnit: string };
  base: { documentId: string; revision: string | number; text: string };
  source: { text: string; instruction: Instruction };
  edits: Array<{ range: SourceRange; newText: string }>;
  placedFragments: Array<{ fragmentId: string; range: SourceRange }>;
  cursorAfter: number;
  eol: '\n' | '\r\n';
};
type PlacementRejection = { status: 'rejected'; diagnostics: [PlacementDiagnostic] };
export type PlacementResult =
  | { status: 'planned'; plan: PlacementPlan; diagnostics: [] }
  | PlacementRejection;
export type PlanValidationResult = { status: 'current'; diagnostics: [] } | PlacementRejection;

function reject(
  code: PlacementDiagnostic['code'], reason: PlacementDiagnostic['reason'],
  message: string, range?: SourceRange,
): PlacementRejection {
  const diagnostic: PlacementDiagnostic = { code, category: 'placement', reason, severity: 'error', message };
  if (range !== undefined) diagnostic.range = range;
  return { status: 'rejected', diagnostics: [diagnostic] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Equality for the JSON-like, finite canonical translation shape, key-order independent. */
function sameData(received: unknown, canonical: unknown): boolean {
  if (received === canonical) return true;
  if (Array.isArray(canonical)) {
    return Array.isArray(received) && received.length === canonical.length
      && canonical.every((value, i) => sameData(received[i], value));
  }
  if (!isRecord(canonical) || !isRecord(received)) return false;
  const keys = Object.keys(canonical);
  return keys.length === Object.keys(received).length
    && keys.every(key => Object.hasOwn(received, key) && sameData(received[key], canonical[key]));
}

function canonicalTranslation(value: unknown): SuccessfulTranslation | undefined {
  if (!isRecord(value) || !isRecord(value.source) || typeof value.source.text !== 'string') return undefined;
  const canonical = translate(value.source.text);
  return canonical.status === 'translated' && sameData(value, canonical) ? canonical : undefined;
}

function validDocument(document: DocumentSnapshot): boolean {
  return isRecord(document) && typeof document.id === 'string' && document.id.length > 0
    && typeof document.text === 'string'
    && (typeof document.revision === 'string'
      || (typeof document.revision === 'number' && Number.isFinite(document.revision)));
}

/** Pure planning: all edit ranges refer to the original text; cursor/ranges to the result. */
export function planPlacement(request: PlacementRequest): PlacementResult {
  const { document, cursorOffset, translation } = request;
  if (!validDocument(document)) {
    return reject('INVALID_DOCUMENT', 'invalid-request', 'Un instantané de document valide est requis.');
  }
  const text = document.text;
  if (!Number.isSafeInteger(cursorOffset) || cursorOffset < 0 || cursorOffset > text.length) {
    const bound = Number.isNaN(cursorOffset) ? 0 : Math.max(0, Math.min(text.length, Math.trunc(cursorOffset)));
    return reject('INVALID_CURSOR', 'invalid-request', 'Le curseur doit être un offset UTF-16 entier dans le document.', { start: bound, end: bound });
  }
  const before = text.charCodeAt(cursorOffset - 1);
  const after = text.charCodeAt(cursorOffset);
  if ((text.charAt(cursorOffset - 1) === '\r' && text.charAt(cursorOffset) === '\n')
    || (before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff)) {
    return reject('INVALID_CURSOR', 'invalid-request', 'Le curseur coupe une fin de ligne CRLF ou une paire de surrogates.', { start: cursorOffset, end: cursorOffset });
  }
  const indentUnit = request.indentUnit === undefined ? '    ' : request.indentUnit;
  if (typeof indentUnit !== 'string' || !/^(?: +|\t)$/u.test(indentUnit)) {
    return reject('INVALID_INDENT_UNIT', 'invalid-request', 'Un niveau d’indentation doit être une tabulation ou un nombre non nul d’espaces.');
  }
  const fallbackEol = request.fallbackEol === undefined ? '\n' : request.fallbackEol;
  if (fallbackEol !== '\n' && fallbackEol !== '\r\n') {
    return reject('INVALID_EOL', 'invalid-request', 'La fin de ligne de repli doit être LF ou CRLF.');
  }
  // Re-translation verifies source, intent, exact parameters, comments, code,
  // fragment ID/role, terminal LF and relative cursor. Never repair received data.
  const canonical = canonicalTranslation(translation);
  const fragment = canonical?.fragments[0];
  if (!canonical || !fragment) {
    return reject('INVALID_TRANSLATION_RESULT', 'invalid-request', 'Le résultat doit être un résultat intégral non modifié de translate pour une intention du catalogue C-A.');
  }
  const bareCR = /\r(?!\n)/u.exec(text);
  if (bareCR) {
    return reject('UNSUPPORTED_LINE_ENDING', 'unsupported-construct', 'Les CR isolés ne sont pas pris en charge.', { start: bareCR.index, end: bareCR.index + 1 });
  }

  const lineStart = cursorOffset === 0 ? 0 : text.lastIndexOf('\n', cursorOffset - 1) + 1;
  const newline = text.indexOf('\n', cursorOffset);
  const contentEnd = newline === -1 ? text.length : text.charAt(newline - 1) === '\r' ? newline - 1 : newline;
  const lineEnd = newline === -1 ? text.length : newline + 1;
  const baseIndent = text.slice(lineStart, contentEnd);
  if (!/^[ \t]*$/u.test(baseIndent)) {
    return reject('TARGET_LINE_NOT_BLANK', 'unsafe-location', 'La ligne cible doit contenir uniquement des espaces ou des tabulations.', { start: lineStart, end: contentEnd });
  }
  const isBranch = canonical.instruction.kind === 'ELSE_IF' || canonical.instruction.kind === 'ELSE';
  const transfer = canonical.instruction.kind === 'BREAK' ? 'break'
    : canonical.instruction.kind === 'CONTINUE' ? 'continue' : undefined;
  const returning = RETURN_KINDS.includes(canonical.instruction.kind);
  // A C17 function definition belongs at file scope. MAIN is included by an
  // explicitly approved exception to its lot 2 contract: its translation is
  // untouched, only its placement rules are.
  const defining = canonical.instruction.kind === 'FUNC_DEF' || canonical.instruction.kind === 'MAIN';
  let attachment: Attachment | undefined;
  let loopTarget: LoopTarget | undefined;
  let switchTarget: SwitchTarget | undefined;
  let structTarget: StructTarget | undefined;
  let functionContext: FunctionContext | undefined;
  // A label or a switch exit is placed only once the switch it belongs to is
  // proven, never from brace depth and never from indentation.
  const inSwitch = SWITCH_KINDS.includes(canonical.instruction.kind);
  if (isBranch) {
    const resolved = resolveBranchTarget(text, lineStart, lineEnd, baseIndent);
    if (resolved.status === 'rejected') {
      const issue = resolved.diagnostic;
      return reject(issue.code, issue.reason, issue.message, issue.range);
    }
    attachment = resolved.attachment;
  } else if (transfer) {
    // A transfer is placed only once the loop it controls is proven, never
    // from brace depth alone and never from indentation.
    const resolved = resolveLoopTarget(text, lineStart, transfer);
    if (resolved.status === 'rejected') {
      const issue = resolved.diagnostic;
      return reject(issue.code, issue.reason, issue.message, issue.range);
    }
    loopTarget = resolved.target;
  } else if (inSwitch) {
    const resolved = resolveSwitchTarget(text, lineStart, canonical.instruction.kind !== 'BREAK_SWITCH');
    if (resolved.status === 'rejected') {
      const issue = resolved.diagnostic;
      return reject(issue.code, issue.reason, issue.message, issue.range);
    }
    switchTarget = resolved.target;
  } else if (canonical.instruction.kind === 'STRUCT_FIELD') {
    // A field is placed only once the structure that holds it is proven.
    const resolved = resolveStructTarget(text, lineStart);
    if (resolved.status === 'rejected') {
      const issue = resolved.diagnostic;
      return reject(issue.code, issue.reason, issue.message, issue.range);
    }
    structTarget = resolved.target;
  } else if (defining) {
    // C17 forbids nested function definitions, for MAIN as for any other.
    const scope = resolveFileScope(text, lineStart);
    if (scope.status === 'rejected') {
      const issue = scope.diagnostic;
      return reject(issue.code, issue.reason, issue.message, issue.range);
    }
  } else if (returning) {
    // A return is placed only once the function it leaves is established, and
    // only if the sentence agrees with the return type that function declares.
    const resolved = resolveFunctionContext(text, lineStart);
    if (resolved.status === 'rejected') {
      const issue = resolved.diagnostic;
      return reject(issue.code, issue.reason, issue.message, issue.range);
    }
    functionContext = resolved.context;
    const isVoid = functionContext.returnType === 'void';
    if (canonical.instruction.kind === 'RETURN' && !isVoid) {
      return reject('RETURN_NEEDS_VALUE', 'unsafe-location',
        `Cette fonction déclare retourner un ${functionContext.returnType} : « Retourne. » ne fournit aucune valeur.`,
        { ...functionContext.nameRange });
    }
    if (canonical.instruction.kind !== 'RETURN' && isVoid) {
      return reject('RETURN_IN_VOID_FUNCTION', 'unsafe-location',
        'Cette fonction déclare ne rien retourner : elle ne peut pas retourner une valeur.',
        { ...functionContext.nameRange });
    }
  } else {
    const lexical = inspectPrefix(text.slice(0, lineStart));
    if (lexical) return reject(lexical.code, lexical.reason, lexical.message, lexical.range);
  }

  const eol: '\n' | '\r\n' = newline !== -1
    ? text.charAt(newline - 1) === '\r' ? '\r\n' : '\n'
    : lineStart > 0 ? text.charAt(lineStart - 2) === '\r' ? '\r\n' : '\n' : fallbackEol;
  // Every block intent renders the same three lines: header, inner line and
  // closing line. No loop state is kept, and no body analyser is needed.
  const isBlock = BLOCK_KINDS.includes(canonical.instruction.kind);
  const codeLines = fragment.code.slice(0, -1).split('\n');
  const lines = [baseIndent + fragment.comment,
    ...codeLines.map((line, index) => baseIndent + (isBlock && index === 1 ? indentUnit : line))];
  const rendered = lines.join(eol) + eol;
  const newText = isBlock ? rendered : rendered + baseIndent + eol;
  const cursorAfter = isBlock
    ? lineStart + lines.slice(0, 2).reduce((length, line) => length + line.length + eol.length, 0) + baseIndent.length + indentUnit.length
    : lineStart + rendered.length + baseIndent.length;
  return {
    status: 'planned', diagnostics: [],
    plan: {
      ...(attachment ? { attachment, branchContext: { indentUnit } } : {}),
      ...(loopTarget ? { loopTarget } : {}),
      ...(switchTarget ? { switchTarget } : {}),
      ...(structTarget ? { structTarget } : {}),
      ...(functionContext ? { functionContext } : {}),
      ...(loopTarget || switchTarget || structTarget || functionContext || defining ? { recognizerContext: { indentUnit } } : {}),
      base: { documentId: document.id, revision: document.revision, text },
      source: { text: canonical.source.text, instruction: canonical.instruction },
      edits: [{ range: { start: lineStart, end: lineEnd }, newText }],
      placedFragments: [{ fragmentId: fragment.id, range: { start: lineStart, end: lineStart + rendered.length } }],
      cursorAfter, eol,
    },
  };
}

/** Call immediately before application. This checks freshness, not plan authenticity. */
export function validatePlan(plan: PlacementPlan, document: DocumentSnapshot): PlanValidationResult {
  if (!validDocument(document)) {
    return reject('INVALID_DOCUMENT', 'invalid-request', 'Un instantané de document valide est requis.');
  }
  if (plan.base.documentId !== document.id || plan.base.revision !== document.revision || plan.base.text !== document.text) {
    return reject('STALE_PLAN', 'stale-plan', 'Le document a changé : un nouveau plan et un nouvel aperçu sont nécessaires.');
  }
  const contextual = plan.loopTarget || plan.switchTarget || plan.structTarget || plan.functionContext
    || plan.source.instruction.kind === 'STRUCT_FIELD'
    || plan.source.instruction.kind === 'BREAK' || plan.source.instruction.kind === 'CONTINUE'
    || SWITCH_KINDS.includes(plan.source.instruction.kind)
    || plan.source.instruction.kind === 'FUNC_DEF' || plan.source.instruction.kind === 'MAIN'
    || RETURN_KINDS.includes(plan.source.instruction.kind);
  if (contextual) {
    const edit = plan.edits[0];
    if (!edit || plan.edits.length !== 1 || !plan.recognizerContext) return reject('STALE_PLAN', 'stale-plan', 'Le plan contextuel n’est plus valide.');
    const translation = translate(plan.source.text);
    if (translation.status !== 'translated') return reject('STALE_PLAN', 'stale-plan', 'La traduction du plan contextuel a changé.');
    const rebuilt = planPlacement({ document, cursorOffset: edit.range.start, translation,
      indentUnit: plan.recognizerContext.indentUnit, fallbackEol: plan.eol });
    // The structure is re-established on exactly the confirmed line.
    if (rebuilt.status !== 'planned' || !sameData(plan, rebuilt.plan)) {
      return reject('STALE_PLAN', 'stale-plan', 'La structure englobante a changé : demandez un nouvel aperçu.');
    }
  }
  if (plan.source.instruction.kind === 'ELSE' || plan.source.instruction.kind === 'ELSE_IF' || plan.attachment) {
    const edit = plan.edits[0];
    if (!edit || plan.edits.length !== 1 || !plan.branchContext) return reject('STALE_PLAN', 'stale-plan', 'Le plan de branche n’est plus valide.');
    const translation = translate(plan.source.text);
    if (translation.status !== 'translated') return reject('STALE_PLAN', 'stale-plan', 'La traduction du plan de branche a changé.');
    const rebuilt = planPlacement({ document, cursorOffset: edit.range.start, translation,
      indentUnit: plan.branchContext.indentUnit, fallbackEol: plan.eol });
    // Target identity is re-established on exactly the confirmed line, never relocated.
    if (rebuilt.status !== 'planned' || !sameData(plan, rebuilt.plan)) {
      return reject('STALE_PLAN', 'stale-plan', 'Le rattachement de la branche a changé : demandez un nouvel aperçu.');
    }
  }
  return { status: 'current', diagnostics: [] };
}
