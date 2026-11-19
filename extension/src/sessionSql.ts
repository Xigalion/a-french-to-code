/** Session de traduction pour un fichier SQL.
 *
 * Lot S10. Classe **distincte** des trois autres, et c'est la décision 2 du
 * socle appliquée une **quatrième** fois : les placements ne sont pas unifiés,
 * donc les sessions ne le sont pas non plus. Elles partagent l'interface que
 * l'IHM appelle — saisie, aperçu, confirmation, insertion — et rien d'autre.
 *
 * Ce qui change par rapport aux trois autres :
 *   - le catalogue partagé n'est **jamais** consulté. SQL-A ne porte aucune de
 *     ses 84 intentions (décision S1), donc l'interroger ne ferait que
 *     produire un rendu refusé, et son diagnostic parlerait de variables et de
 *     boucles à quelqu'un qui écrit une requête. C'est la seule session dans
 *     ce cas, et c'est le signe que SQL est un langage et non un dialecte ;
 *   - l'indentation n'est pas un paramètre : SQL-A écrit sa propre mise en
 *     page, imposée par la décision S5 — virgules et opérateurs en tête de
 *     ligne, seule disposition où ajouter un terme n'en modifie aucun ;
 *   - l'étiquette de rattachement dit si une **requête est ouverte**, parce
 *     que c'est ce qui décide si une clause peut s'insérer.
 */
import { normaliser } from '../../src/langue/variantes.ts';
import type { Arbitre } from '../../src/langue/variantes.ts';
import { SQL } from '../../src/langages/sql/langage.ts';
import { planifierSql, etatAvant } from '../../src/langages/sql/placement.ts';
import type { PlanSql } from '../../src/langages/sql/placement.ts';
import type { InformationAffichable, PlanApplicable } from './sessionPython.ts';
import type { Normalisation, SessionDiagnostic, SessionOptions, TargetState, Preview } from './session.ts';

type Failure = { status: 'error'; diagnostic: SessionDiagnostic };
function integration(code: string, message: string): Failure {
  return { status: 'error', diagnostic: { stage: 'integration', code, message } };
}

type Resolution =
  | { via: 'natif'; kind: string; code: string; informations: readonly InformationAffichable[] }
  | { via: 'refus'; diagnostic: SessionDiagnostic };

type Comprise = { kind: string; code: string; informations: readonly InformationAffichable[] };

/** L'arbitre de la couche de variantes **en SQL**.
 *
 * Il n'a qu'une voie — le catalogue natif —, et il **écarte** toute candidate
 * que SQL refusera : la couche ne doit jamais retenir une lecture que le
 * langage rejettera ensuite. Un refus *instruit* du catalogue, lui, remonte :
 * il vaut mieux que le « formulation inconnue » du départ.
 */
export function arbitreSql(): Arbitre<Comprise> {
  return (phrase) => {
    const natif = SQL.natif?.(phrase);
    if (natif === undefined) return { accepte: false };
    if (natif.status !== 'rendu') {
      return { accepte: false, diagnostic: { code: natif.code, message: natif.message } };
    }
    return { accepte: true,
      sens: 'natif:' + natif.kind + ':' + natif.code,
      intention: natif.kind,
      apercu: natif.code.replace(/\n$/u, ''),
      resultat: { kind: natif.kind, code: natif.code, informations: natif.informations } };
  };
}

export class SqlTranslationSession {
  private readonly initial: TargetState;
  private pending: { token: number; plan: PlanApplicable; after: string;
    information: InformationAffichable[]; normalisation?: Normalisation } | undefined;
  private counter = 0;
  private invalidation: string | undefined;
  private currentPhase: 'editing' | 'preparing' | 'review' | 'stale' | 'applying' | 'done' | 'cancelled' = 'editing';
  private text = '';
  private readonly souple: boolean;
  private normalisationCourante: Normalisation | undefined;

  constructor(target: TargetState, draft = '', options: SessionOptions = {}) {
    this.initial = { ...target, document: { ...target.document } };
    this.text = draft;
    this.souple = options.souple === true;
  }

  get phase(): string { return this.currentPhase; }
  get draft(): string { return this.text; }
  get flexible(): boolean { return this.souple; }
  get langage(): string { return SQL.nom; }
  /** Aucun avis de calcul : les informations passives de SQL-A les disent, et
   * ceux du C17 parlent d'arithmétique entière, qui n'est pas le sujet ici. */
  get advisories(): never[] { return []; }

  /** Dit si une **requête est ouverte** au point d'insertion. C'est
   * l'équivalent SQL de l'étiquette de rattachement du C — « cette clause ira
   * dans la requête ci-dessus » — et c'est utile précisément parce qu'une
   * clause n'a aucun sens hors d'une requête. */
  get attachmentLabel(): string | undefined {
    const etat = etatAvant(this.initial.document.text, this.initial.cursorOffset);
    return etat.ouverte ? 'requête ouverte' : undefined;
  }

  get normalisation(): Normalisation | undefined {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return undefined;
    const valeur = this.pending?.normalisation ?? (this.resoudre(), this.normalisationCourante);
    return valeur === undefined ? undefined : { ...valeur };
  }

  get information(): InformationAffichable[] {
    if (!['editing', 'preparing', 'review'].includes(this.currentPhase)) return [];
    const valeurs = this.pending?.information ?? this.informationsDe(this.resoudre());
    return valeurs.map(valeur => ({ ...valeur, range: { ...valeur.range } }));
  }

  private informationsDe(resolution: Resolution): readonly InformationAffichable[] {
    return resolution.via === 'natif' ? resolution.informations : [];
  }

  /** Les deux voies, dans l'ordre. **Pas trois** : le catalogue partagé n'est
   * pas consulté, parce que SQL n'en porte aucune intention. */
  private resoudre(): Resolution {
    const natif = SQL.natif?.(this.text);
    if (natif !== undefined) {
      this.normalisationCourante = undefined;
      if (natif.status === 'rendu') {
        return { via: 'natif', kind: natif.kind, code: natif.code, informations: natif.informations };
      }
      return { via: 'refus', diagnostic: {
        stage: natif.code === 'CONSTRUCTION_NON_PORTEE' ? 'rendu' : 'translation',
        code: natif.code, message: natif.message, range: natif.range } };
    }

    const inconnue: SessionDiagnostic = { stage: 'translation', code: 'SQL_FORMULATION_INCONNUE',
      message: 'Cette formulation n’appartient pas au catalogue SQL. Les phrases reconnues sont '
        + 'dans docs/CATALOGUE_SQL.md.' };
    if (!this.souple) { this.normalisationCourante = undefined; return { via: 'refus', diagnostic: inconnue }; }

    const verdict = normaliser<Comprise>(this.text, { arbitre: arbitreSql() });
    if (verdict.verdict === 'normalise' || verdict.verdict === 'resolu') {
      this.normalisationCourante = { source: verdict.source, canonique: verdict.canonique,
        lectures: verdict.lecturesEssayees };
      return { via: 'natif', kind: verdict.resultat.kind, code: verdict.resultat.code,
        informations: verdict.resultat.informations };
    }
    this.normalisationCourante = undefined;
    if (verdict.verdict === 'ambigu') {
      return { via: 'refus', diagnostic: { stage: 'variantes', code: verdict.code,
        message: verdict.message + ' Lectures possibles : '
          + verdict.lectures.map(lecture => `« ${lecture.phrase} » (${lecture.intention})`).join(' ; ') + '.' } };
    }
    if (verdict.verdict === 'refus' && verdict.diagnostic !== undefined) {
      return { via: 'refus', diagnostic: { stage: 'translation', ...verdict.diagnostic } };
    }
    return { via: 'refus', diagnostic: inconnue };
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
    // L'indentation est comparée bien qu'elle ne serve pas au placement SQL :
    // un réglage qui change pendant qu'un aperçu est ouvert signale que
    // l'utilisateur a touché à l'éditeur, et replanifier coûte moins cher
    // qu'insérer sur une cible qu'on ne regardait plus.
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
    const plan: PlanSql = planifierSql({
      document: { text: target.document.text }, cursorOffset: target.cursorOffset,
      comment: SQL.commentaire(this.text), code: resolution.code, kind: resolution.kind, eol: target.eol,
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
      ...(this.normalisationCourante ? { normalisation: this.normalisationCourante } : {}),
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
    // On REPLANIFIE et on compare : le plan appliqué doit être exactement
    // celui qui a été montré. Règle 8 — l'aperçu est la confirmation, donc il
    // doit être ce qui s'applique.
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
