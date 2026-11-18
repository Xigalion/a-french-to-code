import type { Instruction } from '../translate.ts';
import { CONTEXT_VERIFIED_KINDS, DECLARATION_KINDS, STATEMENT_KINDS } from '../statementScope.ts';
import { renderC17 } from './c17/rendu.ts';

/** Comment un langage délimite ses blocs. C'est une **étiquette**, pas une
 * abstraction : elle sélectionne une implémentation de placement, elle
 * n'essaie pas d'unifier les accolades et l'indentation. Décision 2 du socle. */
export type Blocs = 'accolades' | 'indentation';

/** Une intention non portée est un **refus nommé**, jamais un rendu
 * approximatif. Décision 3 du socle, et c'est elle qui empêche de forcer un
 * concept du C dans un langage qui ne l'a pas. */
export type RenduResultat =
  | { status: 'rendu'; code: string }
  // INTENTION_NON_PORTEE : le langage ne porte pas cette intention du tout.
  // CONSTRUCTION_NON_PORTEE (lot P3) : il la porte, mais ce qu'elle CONTIENT
  // n'a pas de sens dans ce langage — une division dont le sens change, un
  // pointeur dans une expression, un nom qui y est reserve. Les deux sont des
  // refus nommes ; les confondre cacherait laquelle des deux il faut traiter.
  | { status: 'refus'; code: 'INTENTION_NON_PORTEE' | 'CONSTRUCTION_NON_PORTEE'; raison: string };

/** Une information passive, quel que soit le langage. Les codes diffèrent
 * d'un langage à l'autre, et les réunir dans une seule union serait forcer
 * un langage dans le moule de l'autre. */
export type InformationLangage = {
  code: string; severity: 'information'; range: { start: number; end: number }; message: string;
};

/** Le résultat du catalogue **propre** à un langage : des intentions qui
 * n'existent pas dans le catalogue partagé.
 *
 * `undefined` signifie « cette phrase n'appartient pas à ce catalogue », et il
 * ne faut pas le confondre avec un refus : dans le premier cas, c'est le
 * diagnostic du catalogue partagé que l'utilisateur doit lire. */
export type ResultatNatif =
  | { status: 'rendu'; kind: string; code: string; informations: readonly InformationLangage[] }
  | { status: 'refus'; code: string; message: string; range: { start: number; end: number } };

/** Ce que le document apprend à un catalogue natif. Ajouté au lot J3, et
 * volontairement minimal : un seul renseignement, celui dont une intention
 * livrée a besoin. L'élargir « au cas où » ferait du registre un passe-plat. */
export type ContexteNatif = {
  /** Le nom de la classe ou de l'interface qui englobe le point d'insertion,
   * ou `undefined` si le curseur n'est dans aucune. */
  readonly classeEnglobante?: string;
};

export type Langage = {
  readonly nom: string;
  /** Extensions de fichier que ce langage reconnaît, point compris. */
  readonly extensions: readonly string[];
  readonly blocs: Blocs;
  /** Le commentaire de tracabilite, dans la syntaxe de CE langage. La regle 2
   * exige la phrase exacte au-dessus du fragment ; la facon de l'ecrire est
   * une propriete du langage, et l'hote n'a pas a la connaitre. */
  readonly commentaire: (phrase: string) => string;
  /** Les intentions que ce langage porte. Toute autre est refusée. */
  readonly portees: ReadonlySet<string>;
  /** Pourquoi une intention n'est pas portée. Une raison par intention
   * absente de `portees` : un refus sans raison n'apprend rien. */
  readonly raisons: ReadonlyMap<string, string>;
  readonly rendre: (instruction: Instruction) => RenduResultat;
  /** Le catalogue pédagogique propre au langage. `undefined` : le langage n'en
   * a pas, et C17 est dans ce cas — les 84 intentions ont été conçues pour
   * lui, il n'a rien à ajouter.
   *
   * `contexte` est **facultatif**, et il l'est pour une raison : certaines
   * intentions natives ne peuvent pas être rendues sans un renseignement que
   * seul le document porte. En Java, un constructeur prend le nom de sa
   * classe englobante — exactement comme un champ C prend sa structure
   * englobante depuis le lot 20. Sans ce contexte, le langage refuse avec une
   * raison nommée plutôt que d'inventer un nom. Un langage qui n'en a pas
   * besoin ignore le paramètre, et Python est dans ce cas. */
  readonly natif?: (text: string, contexte?: ContexteNatif) => ResultatNatif | undefined;
};

/** Tous les genres d'intention que le moteur publie. La liste vient de la
 * partition de `statementScope`, qu'un test impose exhaustive : le registre
 * ne tient donc pas son propre inventaire, qui divergerait. */
export const GENRES: ReadonlySet<string> = new Set([
  ...DECLARATION_KINDS, ...STATEMENT_KINDS, ...CONTEXT_VERIFIED_KINDS,
]);

/** C17 porte tout : c'est le langage pour lequel les 84 intentions ont été
 * conçues. Un langage qui en porte moins n'est pas un langage incomplet,
 * c'est un autre langage. */
export const C17: Langage = {
  nom: 'c17',
  extensions: ['.c', '.h'],
  blocs: 'accolades',
  commentaire: (phrase) => '// ' + phrase,
  portees: GENRES,
  raisons: new Map(),
  rendre: (instruction) => ({ status: 'rendu', code: renderC17(instruction) }),
};

const PAR_NOM = new Map<string, Langage>([[C17.nom, C17]]);

export const LANGAGES: ReadonlyMap<string, Langage> = PAR_NOM;

/** Inscrit un langage. Appelée par chaque module de langage, jamais par le
 * moteur : `src/` ne connaît pas la liste de ses langages cibles. */
export function inscrire(langage: Langage): void {
  if (PAR_NOM.has(langage.nom)) throw new Error('Langage déjà inscrit : ' + langage.nom);
  PAR_NOM.set(langage.nom, langage);
}

/** Le langage d'un fichier, par son extension. `undefined` si aucun : l'hôte
 * doit alors refuser la commande, et non choisir un langage par défaut. */
export function langagePour(extension: string): Langage | undefined {
  const cherchee = extension.toLowerCase();
  for (const langage of PAR_NOM.values()) if (langage.extensions.includes(cherchee)) return langage;
  return undefined;
}

/** Rend une intention dans un langage, ou dit pourquoi il ne la porte pas.
 * Aucun chemin ne produit un code vide : c'est un rendu ou un refus. */
export function rendre(langage: Langage, instruction: Instruction): RenduResultat {
  if (!langage.portees.has(instruction.kind)) {
    return {
      status: 'refus', code: 'INTENTION_NON_PORTEE',
      raison: langage.raisons.get(instruction.kind)
        ?? 'Le langage ' + langage.nom + ' ne porte pas cette intention, et aucune raison n’a été écrite : '
          + 'c’est un défaut du registre, pas une limite du langage.',
    };
  }
  return langage.rendre(instruction);
}
