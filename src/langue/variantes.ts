import { translate } from '../translate.ts';
import type { TranslationResult } from '../translate.ts';

/** Souplesse linguistique déterministe — **indépendante du langage cible**.
 *
 * Ce module ne sait rien du C ni de Python : il travaille sur le **français**.
 * Il réécrit une phrase libre en phrases candidates du catalogue, et c'est le
 * moteur strict qui arbitre. Il n'est appelé par personne : la couche est
 * **désactivée par défaut** pendant sa validation, exactement comme la
 * décision 6 du socle le demande.
 *
 * Quatre propriétés, et ce sont elles qui séparent la souplesse linguistique
 * d'un relâchement pédagogique :
 *   - DÉTERMINISME : un lexique est une table, jamais une inférence ;
 *   - AUCUNE COMPLÉTION : une information absente le reste, et le refus le dit ;
 *   - MODE STRICT INTACT : une phrase du catalogue ne traverse pas la couche ;
 *   - TRAÇABILITÉ : la phrase de l'utilisateur est conservée telle quelle.
 */

export type Entree = {
  /** La suite de mots que l'utilisateur peut écrire. */
  readonly libre: string;
  /** Une ou plusieurs formes du catalogue. Plusieurs = homonyme. */
  readonly formes: readonly string[];
  /** Pourquoi cette entrée existe : une formulation rencontrée, pas une idée. */
  readonly motif: string;
};

export const LEXIQUE: readonly Entree[] = [
  { libre: 'créer', formes: ['Crée'], motif: 'infinitif' },
  { libre: 'créez', formes: ['Crée'], motif: 'impératif pluriel' },
  { libre: 'afficher', formes: ['Affiche'], motif: 'infinitif' },
  { libre: 'affichez', formes: ['Affiche'], motif: 'impératif pluriel' },
  { libre: 'déclarer', formes: ['Déclare'], motif: 'infinitif' },
  { libre: 'déclarez', formes: ['Déclare'], motif: 'impératif pluriel' },
  { libre: 'retourner', formes: ['Retourne'], motif: 'infinitif' },
  { libre: 'appelé', formes: ['nommé'], motif: 'synonyme' },
  { libre: 'appelée', formes: ['nommée'], motif: 'synonyme' },
  { libre: 'valant', formes: ['de valeur'], motif: 'synonyme' },
  { libre: 'initialisé à', formes: ['de valeur'], motif: 'synonyme' },
  { libre: 'nombre entier', formes: ['entier'], motif: 'périphrase' },
  { libre: 'sors de la boucle', formes: ['Sors de la boucle la plus intérieure'], motif: 'forme courte' },
  { libre: 'passe à l’itération suivante', formes: ['Passe à l’itération suivante de la boucle la plus intérieure'], motif: 'forme courte' },
  { libre: 'mets', formes: ['Affecte', 'Ajoute'], motif: 'homonyme : affecter ou ajouter' },
  { libre: 'montre', formes: ['Affiche la valeur de', 'Affiche le caractère'], motif: 'homonyme : %d ou %c' },
];

/** Bornes. `substitutions` est **évaluée sur corpus**, pas décidée a priori :
 * voir `docs/phase2/MESURES_SOUPLESSE.md`. Elle existe pour que la
 * combinatoire reste finie et la réponse prévisible. */
export const BUDGET = { substitutions: 4, candidates: 64 };

/** Les mots après lesquels le mot suivant est un **identifiant** de
 * l'utilisateur : il ne doit jamais être substitué, même s'il figure au
 * lexique. Une variable peut s'appeler « mets ». */
const AVANT_IDENTIFIANT = ['nommé', 'nommée', 'nommés', 'nommées', 'appelé', 'appelée', 'nom'];

export type Verdict =
  | { verdict: 'strict'; source: string; canonique: string; resultat: TranslationResult }
  | { verdict: 'normalise' | 'resolu'; source: string; canonique: string; resultat: TranslationResult;
    lecturesEssayees: number; lecturesValides: number }
  | { verdict: 'ambigu'; code: 'AMBIGUITE_NON_RESOLUE'; source: string; message: string;
    lectures: readonly { phrase: string; intention: string; code: string }[] }
  | { verdict: 'refus'; code: 'AUCUNE_VARIANTE_CONNUE' | 'TROP_DE_SUBSTITUTIONS' | 'TROP_DE_LECTURES'
    | 'AUCUNE_LECTURE_VALIDE'; source: string; message: string; essais?: readonly string[] };

const minuscule = (texte: string): string => texte.toLowerCase().replace(/'/gu, '’');

/** Les intervalles du texte où **aucune** substitution n'est permise :
 *  1. tout ce qui est entre guillemets ASCII — texte affiché, expression,
 *     indice, chemin de fichier : ce sont les mots de l'utilisateur ;
 *  2. tout ce qui est entre apostrophes simples — littéral caractère ;
 *  3. le mot qui suit « nommé », « appelé », « de nom » : un identifiant.
 */
export function zonesProtegees(phrase: string): { debut: number; fin: number }[] {
  const zones: { debut: number; fin: number }[] = [];
  for (const motif of [/"[^"]*"?/gu, /'[^']*'?/gu]) {
    for (const trouve of phrase.matchAll(motif)) {
      zones.push({ debut: trouve.index, fin: trouve.index + trouve[0].length });
    }
  }
  const bas = minuscule(phrase);
  for (const mot of AVANT_IDENTIFIANT) {
    let depuis = 0;
    for (;;) {
      const position = bas.indexOf(mot, depuis);
      if (position === -1) break;
      depuis = position + mot.length;
      // Le mot doit être entier, et suivi d'une espace puis d'un mot.
      const avant = position === 0 || /[^\p{L}]/u.test(phrase.charAt(position - 1));
      const suite = /^\s+([^\s.]+)/u.exec(phrase.slice(depuis));
      const identifiant = suite?.[1];
      if (!avant || suite === null || identifiant === undefined) continue;
      const debut = depuis + suite[0].length - identifiant.length;
      zones.push({ debut, fin: debut + identifiant.length });
    }
  }
  return zones;
}

const protege = (zones: { debut: number; fin: number }[], debut: number, fin: number): boolean =>
  zones.some(zone => debut < zone.fin && fin > zone.debut);

/** Les occurrences du lexique, hors zones protégées, de la plus longue à la
 * plus courte pour qu'une suite de mots gagne sur un mot seul. */
function trouver(phrase: string): { debut: number; fin: number; entree: Entree }[] {
  const bas = minuscule(phrase);
  const zones = zonesProtegees(phrase);
  const trouvees: { debut: number; fin: number; entree: Entree }[] = [];
  for (const entree of [...LEXIQUE].sort((a, b) => b.libre.length - a.libre.length)) {
    const cherche = minuscule(entree.libre);
    let depuis = 0;
    for (;;) {
      const position = bas.indexOf(cherche, depuis);
      if (position === -1) break;
      const fin = position + cherche.length;
      depuis = fin;
      // Mot entier : ni lettre avant, ni lettre après.
      const avant = position === 0 || !/\p{L}/u.test(phrase.charAt(position - 1));
      const apres = fin === phrase.length || !/\p{L}/u.test(phrase.charAt(fin));
      if (!avant || !apres) continue;
      if (protege(zones, position, fin)) continue;
      if (trouvees.some(t => position < t.fin && fin > t.debut)) continue;
      trouvees.push({ debut: position, fin, entree });
    }
  }
  return trouvees.sort((a, b) => a.debut - b.debut);
}

/** Les phrases candidates, par substitution, sans rien réordonner. */
function candidates(phrase: string, trouvees: { debut: number; fin: number; entree: Entree }[]): string[] {
  let liste = [phrase];
  for (const { debut, fin, entree } of [...trouvees].reverse()) {
    const suivantes: string[] = [];
    for (const partielle of liste) {
      for (const forme of entree.formes) suivantes.push(partielle.slice(0, debut) + forme + partielle.slice(fin));
    }
    liste = suivantes;
  }
  return [...new Set(liste)];
}

/** Deux lectures ont le même sens si leur instruction est identique,
 * paramètres compris. Les intervalles sont exclus : ils désignent des
 * positions dans des phrases différentes. */
function sens(resultat: TranslationResult): string {
  return JSON.stringify(resultat, (cle, valeur) =>
    (cle === 'range' || cle.endsWith('Range') || cle === 'source' || cle === 'fragments'
      ? undefined : valeur));
}

/** Le budget est un **paramètre**, pas une constante cachée : la mesure sur
 * corpus (`scripts/mesurer-souplesse.mjs`) doit pouvoir l'explorer sans
 * modifier le module. En usage, il vaut `BUDGET`. */
export function normaliser(phrase: string, budget: { substitutions: number; candidates: number } = BUDGET): Verdict {
  // 1. Le mode strict d'abord. Si la phrase est du catalogue, la couche ne
  //    fait rien du tout — et c'est ce qui la rend inoffensive.
  const directe = translate(phrase);
  if (directe.status === 'translated') {
    return { verdict: 'strict', source: phrase, canonique: phrase, resultat: directe };
  }

  const trouvees = trouver(phrase);
  if (trouvees.length === 0) {
    return { verdict: 'refus', code: 'AUCUNE_VARIANTE_CONNUE', source: phrase,
      message: 'Cette formulation n’appartient pas au catalogue, et aucun mot du lexique n’y figure '
        + 'hors des guillemets et des noms : il n’y a rien à normaliser. ' + directe.diagnostics[0].message };
  }
  if (trouvees.length > budget.substitutions) {
    return { verdict: 'refus', code: 'TROP_DE_SUBSTITUTIONS', source: phrase,
      message: trouvees.length + ' mots du lexique dans une seule phrase, au-delà des '
        + budget.substitutions + ' autorisés. Une phrase aussi éloignée du catalogue se reformule, '
        + 'elle ne se devine pas.' };
  }

  const essais = candidates(phrase, trouvees);
  if (essais.length > budget.candidates) {
    return { verdict: 'refus', code: 'TROP_DE_LECTURES', source: phrase,
      message: essais.length + ' lectures possibles, au-delà des ' + budget.candidates + ' autorisées.' };
  }

  // 2. Le moteur strict est l'arbitre : une candidate n'est retenue que s'il
  //    l'accepte. La couche ne décide jamais qu'une phrase est valide.
  const acceptees: { essai: string; resultat: TranslationResult; sens: string }[] = [];
  for (const essai of essais) {
    const resultat = translate(essai);
    if (resultat.status === 'translated') acceptees.push({ essai, resultat, sens: sens(resultat) });
  }

  if (acceptees.length === 0) {
    return { verdict: 'refus', code: 'AUCUNE_LECTURE_VALIDE', source: phrase, essais,
      message: 'Aucune des ' + essais.length + ' lectures du lexique n’appartient au catalogue. '
        + 'Ce qui manque n’est pas deviné : ' + directe.diagnostics[0].message };
  }

  const distincts = new Map<string, { essai: string; resultat: TranslationResult }>();
  for (const candidate of acceptees) if (!distincts.has(candidate.sens)) distincts.set(candidate.sens, candidate);
  if (distincts.size > 1) {
    return { verdict: 'ambigu', code: 'AMBIGUITE_NON_RESOLUE', source: phrase,
      lectures: [...distincts.values()].map(lecture => ({
        phrase: lecture.essai,
        intention: lecture.resultat.status === 'translated' ? lecture.resultat.instruction.kind : '',
        code: lecture.resultat.status === 'translated'
          ? (lecture.resultat.fragments[0]?.code ?? '').replace(/\n$/u, '') : '',
      })),
      message: 'Cette phrase a ' + distincts.size + ' lectures de sens différent. C-A ne choisit pas : '
        + 'reformulez avec l’une des phrases du catalogue.' };
  }

  // `distincts` porte exactement une entrée ici : les cas 0 et ≥2 sont
  // traités au-dessus. L'invariant est vérifié plutôt que supposé.
  const retenue = [...distincts.values()][0];
  if (retenue === undefined) throw new Error('Invariant interne : une lecture unique était attendue.');
  return {
    verdict: essais.length === 1 ? 'normalise' : 'resolu',
    source: phrase, canonique: retenue.essai, resultat: retenue.resultat,
    lecturesEssayees: essais.length, lecturesValides: acceptees.length,
  };
}
