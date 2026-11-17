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
import type { Arbitre } from '../../src/langue/variantes.ts';
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

/** Par quelle voie la phrase a été comprise. Les trois sont exclusives, et
 * leur ORDRE est la garantie du lot : le catalogue partagé d'abord — une
 * phrase qu'il accepte se comporte donc exactement comme en C17 —, puis le
 * catalogue natif de Python, puis, seulement si l'utilisateur l'a demandé, la
 * couche de variantes. */
type Resolution =
  | { via: 'porte'; translation: Extract<TranslationResult, { status: 'translated' }>; normalisation?: Normalisation }
  | { via: 'natif'; kind: string; code: string; informations: readonly InformationAffichable[] }
  | { via: 'refus'; diagnostic: SessionDiagnostic };

/** Ce qu'une phrase candidate peut valoir, pour la couche de variantes. */
type Comprise =
  | { via: 'porte'; translation: Extract<TranslationResult, { status: 'translated' }> }
  | { via: 'natif'; kind: string; code: string; informations: readonly InformationAffichable[] };

/** L'arbitre de la couche de variantes **en Python** : le catalogue partagé,
 * puis le catalogue natif. Sans lui, une reformulation ou un infinitif d'une
 * phrase native — « Créer une liste vide nommée notes. » — n'était pas
 * reconnu, alors que la phrase canonique l'est. C'est la lacune que le lot P4
 * avait annoncée, et elle ne demandait qu'un paramètre.
 *
 * `sens` est la clé d'identité de la lecture. Pour une intention portée, c'est
 * l'instruction entière, intervalles exclus ; pour une native, le genre et le
 * code produit — les deux représentations ne se comparent jamais entre elles,
 * et elles n'ont pas à le faire. */
const ARBITRE_PYTHON: Arbitre<Comprise> = (phrase) => {
  const strict = translate(phrase);
  if (strict.status === 'translated') {
    const rendu = rendre(PYTHON, strict.instruction);
    // Une intention que Python ne porte pas n'est pas une lecture valide :
    // la couche ne doit pas retenir une candidate que le langage refusera.
    if (rendu.status !== 'rendu') return { accepte: false };
    return { accepte: true,
      sens: 'porte:' + JSON.stringify(strict.instruction),
      intention: strict.instruction.kind,
      apercu: rendu.code.replace(/\n$/u, ''),
      resultat: { via: 'porte', translation: strict } };
  }
  const natif = PYTHON.natif?.(phrase);
  if (natif === undefined) return { accepte: false };
  if (natif.status !== 'rendu') {
    // Reconnue par le catalogue natif, et refusée pour une raison précise :
    // elle vaut mieux que le « formulation inconnue » du départ.
    return { accepte: false, diagnostic: { code: natif.code, message: natif.message } };
  }
  return { accepte: true,
    sens: 'natif:' + natif.kind + ':' + natif.code,
    intention: natif.kind,
    apercu: natif.code.replace(/\n$/u, ''),
    resultat: { via: 'natif', kind: natif.kind, code: natif.code, informations: natif.informations } };
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
  /** La normalisation d'une phrase reconnue par le catalogue NATIF : la voie
   * « natif » ne la transporte pas, et l'IHM doit pourtant la montrer. */
  private normalisationNative: Normalisation | undefined;

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
    const resolution = this.resoudre();
    const valeur = this.pending?.normalisation
      ?? (resolution.via === 'porte' ? resolution.normalisation
        : resolution.via === 'natif' ? this.normalisationNative : undefined);
    return valeur === undefined ? undefined : { ...valeur };
  }

  get information(): InformationAffichable[] {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return [];
    const valeurs = this.pending?.information ?? this.informationsDe(this.resoudre());
    return valeurs.map(valeur => ({ ...valeur, range: { ...valeur.range } }));
  }

  private informationsDe(resolution: Resolution): readonly InformationAffichable[] {
    if (resolution.via === 'porte') return expliquerPython(resolution.translation);
    if (resolution.via === 'natif') return resolution.informations;
    return [];
  }

  /** Les trois voies, dans l'ordre. C'est la seule fonction qui décide de
   * quel catalogue vient une phrase. */
  private resoudre(): Resolution {
    // 1. Le catalogue PARTAGÉ d'abord, toujours. Une phrase qu'il accepte ne
    //    traverse ni le catalogue natif ni la couche de variantes.
    const strict = translate(this.text);
    if (strict.status === 'translated') return { via: 'porte', translation: strict };

    // 2. Le catalogue NATIF de Python. `undefined` veut dire « ce n'est pas
    //    une de mes phrases » : le diagnostic du catalogue partagé est alors
    //    celui que l'utilisateur doit lire, et on le garde.
    const natif = PYTHON.natif?.(this.text);
    if (natif !== undefined) {
      if (natif.status === 'rendu') {
        return { via: 'natif', kind: natif.kind, code: natif.code, informations: natif.informations };
      }
      // Un refus du catalogue natif est un défaut de COMPRÉHENSION de la
      // phrase, sauf celui qui vient du rendu d'une construction.
      return { via: 'refus', diagnostic: {
        stage: natif.code === 'CONSTRUCTION_NON_PORTEE' ? 'rendu' : 'translation',
        code: natif.code, message: natif.message, range: natif.range } };
    }

    const refusStrict: SessionDiagnostic = { stage: 'translation', ...strict.diagnostics[0] };
    // 3. La couche de variantes, et seulement si l'utilisateur l'a activée.
    if (!this.souple) return { via: 'refus', diagnostic: refusStrict };
    const verdict = normaliser<Comprise>(this.text, { arbitre: ARBITRE_PYTHON });
    if (verdict.verdict === 'normalise' || verdict.verdict === 'resolu') {
      const normalisation: Normalisation = { source: verdict.source, canonique: verdict.canonique,
        lectures: verdict.lecturesEssayees };
      // La normalisation est portée par la voie « porte » ; pour une intention
      // native, l'appelant la relit par `this.normalisation`.
      if (verdict.resultat.via === 'natif') {
        this.normalisationNative = normalisation;
        return { via: 'natif', kind: verdict.resultat.kind, code: verdict.resultat.code,
          informations: verdict.resultat.informations };
      }
      this.normalisationNative = undefined;
      return { via: 'porte', translation: verdict.resultat.translation, normalisation };
    }
    this.normalisationNative = undefined;
    if (verdict.verdict === 'ambigu') {
      return { via: 'refus', diagnostic: { stage: 'variantes', code: verdict.code,
        message: verdict.message + ' Lectures possibles : '
          + verdict.lectures.map(lecture => `« ${lecture.phrase} » (${lecture.intention})`).join(' ; ') + '.' } };
    }
    // Un refus instruit remonté par la couche remplace le diagnostic de départ.
    if (verdict.verdict === 'refus' && verdict.diagnostic !== undefined) {
      return { via: 'refus', diagnostic: { stage: 'translation', ...verdict.diagnostic } };
    }
    return { via: 'refus', diagnostic: refusStrict };
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
    const resolution = this.resoudre();
    if (resolution.via === 'refus') return { status: 'error', diagnostic: resolution.diagnostic };
    let code: string;
    let kind: string;
    if (resolution.via === 'natif') {
      code = resolution.code;
      kind = resolution.kind;
    } else {
      const rendu = rendre(PYTHON, resolution.translation.instruction);
      if (rendu.status !== 'rendu') {
        return { status: 'error', diagnostic: { stage: 'rendu', code: rendu.code, message: rendu.raison } };
      }
      code = rendu.code;
      kind = resolution.translation.instruction.kind;
    }
    const pas = PythonTranslationSession.pas(target);
    if (pas === undefined) {
      return integration('INDENT_UNIT_NOT_SPACES',
        'C-A n’écrit pas de Python indenté par tabulations : Python interdit de mélanger espaces et '
        + 'tabulations, et deviner une largeur serait inventer. Réglez l’éditeur sur des espaces.');
    }
    const plan: PlanPython = planifierPython({
      document: { text: target.document.text }, cursorOffset: target.cursorOffset,
      comment: PYTHON.commentaire(this.text), code, kind, eol: target.eol, pas,
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
      information: [...this.informationsDe(resolution)],
      ...(resolution.via === 'porte' && resolution.normalisation
        ? { normalisation: resolution.normalisation }
        : resolution.via === 'natif' && this.normalisationNative
          ? { normalisation: this.normalisationNative } : {}),
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
