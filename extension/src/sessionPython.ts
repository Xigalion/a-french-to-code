/** Session de traduction pour un fichier Python.
 *
 * Lot P4a. Classe **distincte** de `TranslationSession`, et c'est la décision 2
 * du socle appliquée à l'hôte : les deux placements ne sont pas unifiés, donc
 * les deux sessions ne le sont pas non plus. Elles partagent l'interface que
 * l'IHM appelle — saisie, aperçu, confirmation, insertion — et rien d'autre.
 *
 * Ce qui change par rapport à la session C :
 *   - le rendu passe par le **registre** (`rendre(PYTHON, …)`), qui peut
 *     refuser une intention ou une construction : c'est une étape de
 *     diagnostic de plus, `rendu`, que la session C n'a pas ;
 *   - le placement est celui par **indentation** ;
 *   - les avis de calcul ne sont pas repris : ils énoncent des règles de C17
 *     (division entière, modulo flottant) qui sont fausses en Python. Les dire
 *     ici serait pire que de se taire. Le canal des informations passives,
 *     lui, est propre à Python ;
 *   - la fraîcheur se vérifie en **replanifiant** et en comparant l'édition,
 *     faute d'un `validatePlan` pour ce placement.
 */
import { translate } from '../../src/translate.ts';
import type { SourceRange, TranslationResult } from '../../src/translate.ts';
import { normaliser } from '../../src/langue/variantes.ts';
import { rendre } from '../../src/langages/registre.ts';
import { PYTHON } from '../../src/langages/python/langage.ts';
import { expliquerPython } from '../../src/langages/python/informations.ts';
import { planifierPython } from '../../src/langages/python/placement.ts';
import type { PlanPython } from '../../src/langages/python/placement.ts';
import type { Normalisation, SessionDiagnostic, SessionOptions, TargetState, Preview } from './session.ts';

/** Ce que l'hôte applique. La forme est celle que l'IHM attend déjà, pour que
 * l'application et le placement du curseur ne soient pas réécrits. */
export type PlanApplicable = {
  edits: ReadonlyArray<{ range: SourceRange; newText: string }>;
  eol: '\n' | '\r\n';
  cursorAfter: number;
  /** La phrase de l'utilisateur, conservée dans le commentaire. */
  source: { text: string };
};
export type InformationAffichable = { code: string; severity: 'information'; range: SourceRange; message: string };

type Failure = { status: 'error'; diagnostic: SessionDiagnostic };
function integration(code: string, message: string): Failure {
  return { status: 'error', diagnostic: { stage: 'integration', code, message } };
}

type Lecture = {
  strict: TranslationResult;
  translation?: Extract<TranslationResult, { status: 'translated' }>;
  normalisation?: Normalisation;
  diagnostic?: SessionDiagnostic;
};

export class PythonTranslationSession {
  private readonly initial: TargetState;
  private pending: { token: number; plan: PlanApplicable; after: string;
    information: InformationAffichable[]; normalisation?: Normalisation } | undefined;
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
  get langage(): string { return PYTHON.nom; }
  /** Aucun avis de calcul : ceux de C17 seraient faux ici. */
  get advisories(): never[] { return []; }
  /** Jamais de cible contextuelle à montrer : le placement Python se décide
   * par l'indentation de la ligne, que l'utilisateur voit déjà. */
  get attachmentLabel(): undefined { return undefined; }

  get normalisation(): Normalisation | undefined {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return undefined;
    const valeur = this.pending?.normalisation ?? this.lire().normalisation;
    return valeur === undefined ? undefined : { ...valeur };
  }

  get information(): InformationAffichable[] {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return [];
    const valeurs = this.pending?.information
      ?? expliquerPython(this.lire().translation ?? translate(this.text));
    return valeurs.map(valeur => ({ ...valeur, range: { ...valeur.range } }));
  }

  /** Strict d'abord, exactement comme la session C : une phrase du catalogue
   * ne traverse jamais la couche de variantes. */
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

  updateText(text: string): void {
    if (['applying', 'done', 'cancelled'].includes(this.currentPhase)) return;
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
    if (['done', 'cancelled', 'applying'].includes(this.currentPhase)) return;
    this.invalidation = message;
    this.pending = undefined;
    this.counter++;
    this.currentPhase = 'stale';
  }

  observe(target: TargetState): void {
    if (!['applying', 'done', 'cancelled'].includes(this.currentPhase)) this.checkTarget(target);
  }

  /** Le pas d'indentation effectif de l'éditeur, en espaces. Une tabulation
   * n'est pas prise en charge : Python interdit de mélanger, et déduire une
   * largeur de tabulation serait inventer. */
  private static pas(target: TargetState): number | undefined {
    return /^ +$/u.test(target.indentUnit) ? target.indentUnit.length : undefined;
  }

  /** La seule fabrique de plan. Tout passe par là : diagnostic, aperçu et
   * revérification de fraîcheur, pour qu'aucun chemin ne diverge. */
  private planifier(target: TargetState):
  { status: 'planifie'; plan: PlanApplicable; after: string; information: InformationAffichable[];
    normalisation?: Normalisation }
  | Failure {
    const lecture = this.lire();
    if (lecture.diagnostic) return { status: 'error', diagnostic: lecture.diagnostic };
    const translated = lecture.translation;
    if (!translated) {
      const refus = lecture.strict;
      if (refus.status !== 'rejected') throw new Error('Invariant interne : refus attendu.');
      return { status: 'error', diagnostic: { stage: 'translation', ...refus.diagnostics[0] } };
    }
    const rendu = rendre(PYTHON, translated.instruction);
    if (rendu.status !== 'rendu') {
      return { status: 'error', diagnostic: { stage: 'rendu', code: rendu.code, message: rendu.raison } };
    }
    const pas = PythonTranslationSession.pas(target);
    if (pas === undefined) {
      return integration('INDENT_UNIT_NOT_SPACES',
        'C-A n’écrit pas de Python indenté par tabulations : Python interdit de mélanger espaces et '
        + 'tabulations, et deviner une largeur serait inventer. Réglez l’éditeur sur des espaces.');
    }
    const plan: PlanPython = planifierPython({
      document: { text: target.document.text }, cursorOffset: target.cursorOffset,
      comment: PYTHON.commentaire(this.text), code: rendu.code,
      kind: translated.instruction.kind, eol: target.eol, pas,
    });
    if (plan.status !== 'planifie') {
      return { status: 'error', diagnostic: { stage: 'placement', ...plan.diagnostics[0] } };
    }
    const edit = plan.edits[0];
    const texte = target.document.text;
    const after = texte.slice(0, edit.range.start) + edit.newText + texte.slice(edit.range.end);
    return {
      status: 'planifie',
      plan: { edits: plan.edits, eol: target.eol,
        cursorAfter: plan.cursor?.offset ?? edit.range.start + edit.newText.length,
        source: { text: this.text } },
      after,
      information: expliquerPython(translated),
      ...(lecture.normalisation ? { normalisation: lecture.normalisation } : {}),
    };
  }

  diagnose(target: TargetState): SessionDiagnostic | undefined {
    const failure = this.checkTarget(target);
    if (failure) return failure.diagnostic;
    const resultat = this.planifier(target);
    return resultat.status === 'planifie' ? undefined : resultat.diagnostic;
  }

  prepare(target: TargetState): { status: 'preview'; preview: Preview } | Failure {
    if (this.invalidation) return integration('STALE_PREVIEW', this.invalidation);
    if (this.currentPhase !== 'editing') {
      return integration('SESSION_NOT_EDITABLE', 'Cette session ne peut pas préparer un nouvel aperçu.');
    }
    const failure = this.checkTarget(target);
    if (failure) return failure;
    const resultat = this.planifier(target);
    if (resultat.status !== 'planifie') return { status: 'error', diagnostic: resultat.diagnostic };
    const token = ++this.counter;
    this.pending = { token, plan: resultat.plan, after: resultat.after, information: resultat.information,
      ...(resultat.normalisation ? { normalisation: resultat.normalisation } : {}) };
    this.currentPhase = 'preparing';
    return { status: 'preview',
      preview: { token, before: target.document.text, after: resultat.after, eol: target.eol } };
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

  beginApply(token: number, target: TargetState):
  { status: 'apply'; plan: PlanApplicable; expectedAfter: string } | Failure {
    if (this.currentPhase !== 'review' || this.pending?.token !== token) {
      return integration('PREVIEW_NOT_READY', 'Aucun aperçu actuel ne peut être confirmé.');
    }
    const failure = this.checkTarget(target);
    if (failure) return failure;
    const pending = this.pending;
    // Faute d'un validatePlan pour ce placement, on REPLANIFIE et on compare :
    // le plan appliqué doit être exactement celui qui a été montré.
    const frais = this.planifier(target);
    if (frais.status !== 'planifie'
      || JSON.stringify(frais.plan.edits) !== JSON.stringify(pending.plan.edits)
      || frais.after !== pending.after) {
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
