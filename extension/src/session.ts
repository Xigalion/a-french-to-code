import { translate } from '../../src/translate.ts';
import { analyzeCalculations } from '../../src/calculationAdvisories.ts';
import type { CalculationAdvisory } from '../../src/calculationAdvisories.ts';
import { explainInstruction } from '../../src/pedagogicalInformation.ts';
import type { PedagogicalInformation } from '../../src/pedagogicalInformation.ts';
import { planPlacement, validatePlan } from '../../src/planPlacement.ts';
import { normaliser } from '../../src/langue/variantes.ts';
import type { DocumentSnapshot, PlacementPlan } from '../../src/planPlacement.ts';
import type { SourceRange, TranslationResult } from '../../src/translate.ts';

export type TargetState = {
  document: DocumentSnapshot;
  cursorOffset: number;
  singleCursor: boolean;
  indentUnit: string;
  indentSignature: string;
  eol: '\n' | '\r\n';
  open: boolean;
};
export type SessionDiagnostic = {
  stage: 'translation' | 'placement' | 'integration' | 'variantes';
  code: string;
  message: string;
  range?: SourceRange;
};
export type Preview = { token: number; before: string; after: string; eol: '\n' | '\r\n' };
/** What the flexibility layer did, when it did anything. Shown for review:
 * the user must see the catalogue sentence C-A understood, otherwise the
 * normalisation would be an implicit behaviour. */
export type Normalisation = { source: string; canonique: string; lectures: number };
/** Strict mode is the default. The flexible mode is opt-in, and it only ever
 * runs on a sentence the strict engine has already refused. */
export type SessionOptions = { souple?: boolean };
type Lecture = {
  /** What the strict engine answered on the user's own sentence. */
  strict: TranslationResult;
  /** The translation to build the plan from, strict or normalised. */
  translation?: Extract<TranslationResult, { status: 'translated' }>;
  normalisation?: Normalisation;
  /** A refusal the flexible layer produces and the strict engine cannot. */
  diagnostic?: SessionDiagnostic;
};
type Failure = { status: 'error'; diagnostic: SessionDiagnostic };

function integration(code: string, message: string): Failure {
  return { status: 'error', diagnostic: { stage: 'integration', code, message } };
}

/** The native UI and a future persistent UI share this session, not their widgets. */
export class TranslationSession {
  private readonly initial: TargetState;
  private pending: { token: number; plan: PlacementPlan; after: string; advisories: CalculationAdvisory[];
    information: PedagogicalInformation[]; normalisation?: Normalisation } | undefined;
  private counter = 0;
  private invalidation: string | undefined;
  private currentPhase: 'editing' | 'preparing' | 'review' | 'stale' | 'applying' | 'done' | 'cancelled' = 'editing';
  private text = '';
  private readonly souple: boolean;

  constructor(target: TargetState, draft = '', options: SessionOptions = {}) {
    this.initial = { ...target, document: { ...target.document } };
    this.text = draft;
    this.souple = options.souple === true;
  }

  get phase(): string { return this.currentPhase; }
  get draft(): string { return this.text; }
  get flexible(): boolean { return this.souple; }
  /** The normalisation the current draft would use, or undefined. */
  get normalisation(): Normalisation | undefined {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return undefined;
    const value = this.pending?.normalisation ?? this.lire().normalisation;
    return value === undefined ? undefined : { ...value };
  }

  /** The single place that decides WHICH sentence is translated.
   *
   * Strict first, always: a catalogue sentence never traverses the flexible
   * layer, so the strict mode is bit-for-bit what it was. The layer runs only
   * on a refusal, and only when the user turned it on. A refusal it cannot
   * resolve keeps the STRICT diagnostic: rule 5 says the diagnostic teaches,
   * and the strict one is the one that names what is missing.
   */
  private lire(): Lecture {
    const strict = translate(this.text);
    if (strict.status === 'translated') return { strict, translation: strict };
    if (!this.souple) return { strict };
    const verdict = normaliser(this.text);
    if (verdict.verdict === 'normalise' || verdict.verdict === 'resolu') {
      return { strict, translation: verdict.resultat,
        normalisation: { source: verdict.source, canonique: verdict.canonique, lectures: verdict.lecturesEssayees } };
    }
    if (verdict.verdict === 'ambigu') {
      return { strict, diagnostic: { stage: 'variantes', code: verdict.code,
        message: verdict.message + ' Lectures possibles : '
          + verdict.lectures.map(lecture => `« ${lecture.phrase} » (${lecture.intention})`).join(' ; ') + '.' } };
    }
    return { strict };
  }
  get information(): PedagogicalInformation[] {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return [];
    const values = this.pending?.information ?? explainInstruction(this.lire().translation ?? translate(this.text));
    return values.map(value => ({ ...value, range: { ...value.range } }));
  }
  /** The line the plan was proven to relate to: an if chain root, or the loop
   * a transfer controls, or the function a return leaves. Shown for review,
   * never used to choose a target.
   */
  get attachmentLabel(): string | undefined {
    const plan = this.pending?.plan;
    if (!plan?.attachment && !plan?.loopTarget && !plan?.functionContext) return undefined;
    const start = plan.attachment?.rootIfRange.start ?? plan.loopTarget?.keywordRange.start
      ?? plan.functionContext!.nameRange.start;
    const line = plan.base.text.slice(0, start).split('\n').length;
    const end = plan.base.text.indexOf('\n', start);
    return `Cible : ligne ${line} — ${plan.base.text.slice(start, end === -1 ? undefined : end).trim().slice(0, 120)}`;
  }

  get advisories(): CalculationAdvisory[] {
    if (this.currentPhase !== 'editing' && this.currentPhase !== 'preparing' && this.currentPhase !== 'review') return [];
    const values = this.pending?.advisories ?? analyzeCalculations(this.lire().translation ?? translate(this.text)).advisories;
    return values.map(value => ({ ...value, range: { ...value.range } }));
  }

  updateText(text: string): void {
    if (this.currentPhase === 'applying' || this.currentPhase === 'done' || this.currentPhase === 'cancelled') return;
    if (this.text !== text) {
      this.text = text;
      this.counter++;
      this.pending = undefined;
      this.currentPhase = this.invalidation ? 'stale' : 'editing';
    }
  }

  private checkTarget(target: TargetState): Failure | undefined {
    if (this.invalidation) return integration('STALE_PREVIEW', this.invalidation);
    const initial = this.initial;
    if (!target.open || !target.singleCursor || target.cursorOffset !== initial.cursorOffset
      || target.indentUnit !== initial.indentUnit || target.indentSignature !== initial.indentSignature
      || target.eol !== initial.eol
      || target.document.id !== initial.document.id || target.document.revision !== initial.document.revision
      || target.document.text !== initial.document.text) {
      this.invalidate('La cible, le document ou l’indentation a changé. Revenez au fichier et demandez un nouvel aperçu.');
      return integration('STALE_PREVIEW', this.invalidation ?? 'Aperçu périmé.');
    }
    return undefined;
  }

  invalidate(message: string): void {
    if (this.currentPhase === 'done' || this.currentPhase === 'cancelled' || this.currentPhase === 'applying') return;
    this.invalidation = message;
    this.pending = undefined;
    this.counter++;
    this.currentPhase = 'stale';
  }

  observe(target: TargetState): void {
    if (this.currentPhase !== 'applying' && this.currentPhase !== 'done' && this.currentPhase !== 'cancelled') this.checkTarget(target);
  }

  diagnose(target: TargetState): SessionDiagnostic | undefined {
    const failure = this.checkTarget(target);
    if (failure) return failure.diagnostic;
    const lecture = this.lire();
    if (lecture.diagnostic) return lecture.diagnostic;
    const translated = lecture.translation;
    if (!translated) {
      const refusal = lecture.strict;
      if (refusal.status !== 'rejected') throw new Error('Invariant interne : refus attendu.');
      return { stage: 'translation', ...refusal.diagnostics[0] };
    }
    const placed = planPlacement({ document: target.document, cursorOffset: target.cursorOffset,
      indentUnit: target.indentUnit, fallbackEol: target.eol, translation: translated,
      ...(lecture.normalisation ? { originalSentence: this.text } : {}) });
    if (placed.status === 'rejected') return { stage: 'placement', ...placed.diagnostics[0] };
    return undefined;
  }

  prepare(target: TargetState): { status: 'preview'; preview: Preview } | Failure {
    if (this.invalidation) return integration('STALE_PREVIEW', this.invalidation);
    if (this.currentPhase !== 'editing') return integration('SESSION_NOT_EDITABLE', 'Cette session ne peut pas préparer un nouvel aperçu.');
    const diagnostic = this.diagnose(target);
    if (diagnostic) return { status: 'error', diagnostic };
    const lecture = this.lire();
    const translated = lecture.translation;
    if (!translated) return integration('INTERNAL_ERROR', 'La traduction n’a pas pu être préparée.');
    const result = planPlacement({ document: target.document, cursorOffset: target.cursorOffset,
      indentUnit: target.indentUnit, fallbackEol: target.eol, translation: translated,
      ...(lecture.normalisation ? { originalSentence: this.text } : {}) });
    if (result.status !== 'planned') return integration('INTERNAL_ERROR', 'Le placement n’a pas pu être préparé.');
    const plan = result.plan;
    const edit = plan.edits[0];
    if (plan.edits.length !== 1 || !edit) return integration('INTERNAL_ERROR', 'Un plan à emplacement unique est requis.');
    const after = plan.base.text.slice(0, edit.range.start) + edit.newText + plan.base.text.slice(edit.range.end);
    const token = ++this.counter;
    this.pending = { token, plan, after, advisories: analyzeCalculations(translated).advisories,
      information: explainInstruction(translated),
      ...(lecture.normalisation ? { normalisation: lecture.normalisation } : {}) };
    this.currentPhase = 'preparing';
    return { status: 'preview', preview: { token, before: plan.base.text, after, eol: plan.eol } };
  }

  reviewReady(token: number, target: TargetState): boolean {
    if (this.currentPhase !== 'preparing' || this.pending?.token !== token || this.checkTarget(target)) return false;
    this.currentPhase = 'review';
    return true;
  }

  editAgain(): void {
    if (this.currentPhase !== 'review' && this.currentPhase !== 'preparing') return;
    this.pending = undefined;
    this.counter++;
    this.currentPhase = 'editing';
  }

  beginApply(token: number, target: TargetState): { status: 'apply'; plan: PlacementPlan; expectedAfter: string } | Failure {
    if (this.currentPhase !== 'review' || this.pending?.token !== token) {
      return integration('PREVIEW_NOT_READY', 'Aucun aperçu actuel ne peut être confirmé.');
    }
    const failure = this.checkTarget(target);
    if (failure) return failure;
    const pending = this.pending;
    const validation = validatePlan(pending.plan, target.document);
    if (validation.status !== 'current') {
      this.invalidate('Le plan est périmé. Demandez un nouvel aperçu.');
      return integration('STALE_PREVIEW', 'Le plan est périmé. Demandez un nouvel aperçu.');
    }
    this.currentPhase = 'applying';
    this.pending = undefined;
    return { status: 'apply', plan: pending.plan, expectedAfter: pending.after };
  }

  finishApply(success: boolean): void {
    if (this.currentPhase !== 'applying') return;
    this.currentPhase = success ? 'done' : 'editing';
  }

  cancel(): void {
    if (this.currentPhase === 'applying' || this.currentPhase === 'done') return;
    this.pending = undefined;
    this.counter++;
    this.currentPhase = 'cancelled';
  }
}
