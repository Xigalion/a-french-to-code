/** Session de traduction pour un fichier Java.
 *
 * Lots J9 et J10. Classe **distincte** des deux autres, et c'est la décision 2
 * du socle appliquée une troisième fois : les placements ne sont pas unifiés,
 * donc les sessions ne le sont pas non plus. Elles partagent l'interface que
 * l'IHM appelle — saisie, aperçu, confirmation, insertion — et rien d'autre.
 *
 * Ce qui change par rapport à la session Python :
 *   - le placement est celui par **accolades**, avec ses QUATRE portées. Une
 *     instruction refusée ici l'est le plus souvent pour une raison de portée,
 *     pas d'indentation ;
 *   - la **tabulation est acceptée** : Java l'autorise, contrairement à
 *     Python, et refuser un fichier indenté par tabulations reviendrait à
 *     refuser un réglage d'éditeur légal ;
 *   - une intention native peut avoir besoin du **document** : un
 *     constructeur Java prend le nom de sa classe englobante, et la session
 *     est le seul endroit qui connaît le document. C'est elle qui le lit.
 *
 * Et ce qui ne change pas, volontairement : les avis de calcul de C17 ne sont
 * pas repris. Ils énoncent des règles qui sont, elles, **vraies** en Java — la
 * division entière tronque, le modulo suit le dividende — mais ce sont les
 * informations passives de Java-A qui les disent, dans ses propres termes et
 * sur son propre canal. Deux canaux qui disent la même chose en seraient un de
 * trop.
 */
import { translate } from '../../src/translate.ts';
import type { TranslationResult } from '../../src/translate.ts';
import { normaliser } from '../../src/langue/variantes.ts';
import type { Arbitre } from '../../src/langue/variantes.ts';
import { rendre } from '../../src/langages/registre.ts';
import { JAVA } from '../../src/langages/java/langage.ts';
import { expliquerJava } from '../../src/langages/java/informations.ts';
import { classeEnglobante, planifierJava } from '../../src/langages/java/placement.ts';
import type { PlanJava } from '../../src/langages/java/placement.ts';
import type { InformationAffichable, PlanApplicable } from './sessionPython.ts';
import type { Normalisation, SessionDiagnostic, SessionOptions, TargetState, Preview } from './session.ts';

type Failure = { status: 'error'; diagnostic: SessionDiagnostic };
function integration(code: string, message: string): Failure {
  return { status: 'error', diagnostic: { stage: 'integration', code, message } };
}

type Resolution =
  | { via: 'porte'; translation: Extract<TranslationResult, { status: 'translated' }>; normalisation?: Normalisation }
  | { via: 'natif'; kind: string; code: string; informations: readonly InformationAffichable[] }
  | { via: 'refus'; diagnostic: SessionDiagnostic };

type Comprise =
  | { via: 'porte'; translation: Extract<TranslationResult, { status: 'translated' }> }
  | { via: 'natif'; kind: string; code: string; informations: readonly InformationAffichable[] };

/** L'arbitre de la couche de variantes **en Java** : le catalogue partagé,
 * puis le catalogue natif. Sans lui, une reformulation d'une phrase native —
 * « Créer une classe nommée Eleve. » — ne serait pas reconnue alors que la
 * phrase canonique l'est.
 *
 * Il **écarte** toute candidate que Java refusera, et c'est sa raison d'être :
 * la couche ne doit jamais retenir une lecture que le langage rejettera
 * ensuite. Un refus *instruit* du catalogue natif, lui, remonte : il vaut
 * mieux que le « formulation inconnue » du départ.
 *
 * Il reçoit la classe englobante, parce qu'une candidate peut être un
 * constructeur : sans elle, la lecture serait écartée pour une raison qui
 * n'est pas linguistique. */
function arbitreJava(classe: string | undefined): Arbitre<Comprise> {
  return (phrase) => {
    const strict = translate(phrase);
    if (strict.status === 'translated') {
      const rendu = rendre(JAVA, strict.instruction);
      if (rendu.status !== 'rendu') return { accepte: false };
      return { accepte: true,
        sens: 'porte:' + JSON.stringify(strict.instruction),
        intention: strict.instruction.kind,
        apercu: rendu.code.replace(/\n$/u, ''),
        resultat: { via: 'porte', translation: strict } };
    }
    const natif = JAVA.natif?.(phrase, { ...(classe === undefined ? {} : { classeEnglobante: classe }) });
    if (natif === undefined) return { accepte: false };
    if (natif.status !== 'rendu') {
      return { accepte: false, diagnostic: { code: natif.code, message: natif.message } };
    }
    return { accepte: true,
      sens: 'natif:' + natif.kind + ':' + natif.code,
      intention: natif.kind,
      apercu: natif.code.replace(/\n$/u, ''),
      resultat: { via: 'natif', kind: natif.kind, code: natif.code, informations: natif.informations } };
  };
}

export class JavaTranslationSession {
  private readonly initial: TargetState;
  private pending: { token: number; plan: PlanApplicable; after: string;
    information: InformationAffichable[]; normalisation?: Normalisation } | undefined;
  private counter = 0;
  private invalidation: string | undefined;
  private currentPhase: 'editing' | 'preparing' | 'review' | 'stale' | 'applying' | 'done' | 'cancelled' = 'editing';
  private text = '';
  private readonly souple: boolean;
  private normalisationNative: Normalisation | undefined;

  constructor(target: TargetState, draft = '', options: SessionOptions = {}) {
    this.initial = { ...target, document: { ...target.document } };
    this.text = draft;
    this.souple = options.souple === true;
  }

  get phase(): string { return this.currentPhase; }
  get draft(): string { return this.text; }
  get flexible(): boolean { return this.souple; }
  get langage(): string { return JAVA.nom; }
  /** Aucun avis de calcul : les informations passives de Java-A les disent. */
  get advisories(): never[] { return []; }

  /** La classe englobante, montrée à l'utilisateur quand il y en a une. C'est
   * l'équivalent Java de l'étiquette de rattachement du C — « ce fragment ira
   * dans la classe Eleve » — et c'est utile précisément parce que le nom d'un
   * constructeur en dépend. */
  get attachmentLabel(): string | undefined {
    const classe = classeEnglobante(this.initial.document.text, this.initial.cursorOffset);
    return classe === undefined ? undefined : 'classe ' + classe;
  }

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
    if (resolution.via === 'porte') {
      return expliquerJava(resolution.translation.instruction.kind,
        { start: 0, end: this.text.length });
    }
    if (resolution.via === 'natif') return resolution.informations;
    return [];
  }

  /** Les trois voies, dans l'ordre. Seule fonction qui décide de quel
   * catalogue vient une phrase. */
  private resoudre(): Resolution {
    const classe = classeEnglobante(this.initial.document.text, this.initial.cursorOffset);
    // 1. Le catalogue PARTAGÉ d'abord, toujours. Une phrase qu'il accepte ne
    //    traverse ni le catalogue natif ni la couche de variantes.
    const strict = translate(this.text);
    if (strict.status === 'translated') return { via: 'porte', translation: strict };

    // 2. Le catalogue NATIF de Java.
    const natif = JAVA.natif?.(this.text,
      { ...(classe === undefined ? {} : { classeEnglobante: classe }) });
    if (natif !== undefined) {
      if (natif.status === 'rendu') {
        return { via: 'natif', kind: natif.kind, code: natif.code, informations: natif.informations };
      }
      return { via: 'refus', diagnostic: {
        stage: natif.code === 'CONSTRUCTION_NON_PORTEE' ? 'rendu' : 'translation',
        code: natif.code, message: natif.message, range: natif.range } };
    }

    const refusStrict: SessionDiagnostic = { stage: 'translation', ...strict.diagnostics[0] };
    // 3. La couche de variantes, et seulement si l'utilisateur l'a activée.
    if (!this.souple) return { via: 'refus', diagnostic: refusStrict };
    const verdict = normaliser<Comprise>(this.text, { arbitre: arbitreJava(classe) });
    if (verdict.verdict === 'normalise' || verdict.verdict === 'resolu') {
      const normalisation: Normalisation = { source: verdict.source, canonique: verdict.canonique,
        lectures: verdict.lecturesEssayees };
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
      const rendu = rendre(JAVA, resolution.translation.instruction);
      if (rendu.status !== 'rendu') {
        return { status: 'error', diagnostic: { stage: 'rendu', code: rendu.code, message: rendu.raison } };
      }
      code = rendu.code;
      kind = resolution.translation.instruction.kind;
    }
    // La tabulation est acceptée : Java l'autorise. `pas` sert alors à
    // l'intervalle annoncé, et `unite` à ce qui est écrit.
    const parEspaces = /^ +$/u.test(target.indentUnit);
    const plan: PlanJava = planifierJava({
      document: { text: target.document.text }, cursorOffset: target.cursorOffset,
      comment: JAVA.commentaire(this.text), code, kind, eol: target.eol,
      pas: parEspaces ? target.indentUnit.length : 4,
      ...(parEspaces ? {} : { unite: target.indentUnit }),
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
