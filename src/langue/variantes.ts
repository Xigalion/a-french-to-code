import { translate } from '../translate.ts';
import type { TranslationResult } from '../translate.ts';
import { reformuler } from './reformulations.ts';
import type { GenreReformulation } from './reformulations.ts';

/** Souplesse linguistique déterministe — **indépendante du langage cible**.
 *
 * Ce module ne sait rien du C ni de Python : il travaille sur le **français**.
 * Il réécrit une phrase libre en phrases candidates du catalogue, et c'est un
 * **arbitre** — le moteur strict, passé en paramètre — qui tranche. Il n'est
 * appelé par l'hôte que si l'utilisateur a activé le mode souple.
 *
 * Deux mécanismes, et ils se composent :
 *   - le **lexique** (lot S4) : des substitutions de mots et de suites de
 *     mots. Il couvre les variantes morphologiques — infinitifs, impératifs
 *     pluriels, synonymes d'un mot ;
 *   - les **reformulations** (lot S5, `reformulations.ts`) : des motifs ancrés
 *     sur la phrase entière, qui changent l'ordre et la forme. Ils couvrent ce
 *     que le lexique ne peut pas atteindre, et le corpus du lot S4 l'avait
 *     mesuré : 43 phrases claires sur 94 refusées.
 *
 * Cinq propriétés, et ce sont elles qui séparent la souplesse linguistique
 * d'un relâchement pédagogique :
 *   - DÉTERMINISME : deux tables, jamais une inférence ;
 *   - AUCUNE COMPLÉTION : une information absente le reste, et le refus le dit ;
 *   - MODE STRICT INTACT : une phrase du catalogue ne traverse pas la couche ;
 *   - TRAÇABILITÉ : la phrase de l'utilisateur est conservée telle quelle ;
 *   - AMBIGUÏTÉ REFUSÉE : deux lectures de sens différent ne se choisissent
 *     pas. Les deux sont montrées.
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
  // Ces deux infinitifs manquaient au prototype, sans raison : leurs verbes
  // sont au catalogue comme les quatre precedents. Le corpus ecrit a la main
  // les a trouves (docs/phase2/MESURES_CORPUS.md), et le lexique ne grandit
  // que sur une formulation mesuree.
  { libre: 'affecter', formes: ['Affecte'], motif: 'infinitif, trouve par le corpus libre' },
  { libre: 'inclure', formes: ['Inclue'], motif: 'infinitif, trouve par le corpus libre' },
  // Six infinitifs trouves par le corpus JAVA du lot J9
  // (test-utilisateur/corpus/corpus-java.json) : leurs verbes sont au
  // catalogue, exactement comme les six precedents, et la regle de cette
  // table est qu'elle ne grandit que sur une formulation MESUREE.
  //
  // Ils profitent aussi a C17 et a Python, et c'est une EXTENSION assumee :
  // le differentiel la declare et l'audite. Une extension peut transformer un
  // refus ; elle ne retire aucune capacite.
  { libre: 'importer', formes: ['Importe'], motif: 'infinitif, trouve par le corpus java' },
  { libre: 'ajouter', formes: ['Ajoute'], motif: 'infinitif, trouve par le corpus java' },
  { libre: 'appeler', formes: ['Appelle'], motif: 'infinitif, trouve par le corpus java' },
  { libre: 'lancer', formes: ['Lance'], motif: 'infinitif, trouve par le corpus java' },
  { libre: 'retirer', formes: ['Retire'], motif: 'infinitif, trouve par le corpus java' },
  { libre: 'sortir', formes: ['Sors'], motif: 'infinitif, trouve par le corpus java' },
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
const AVANT_IDENTIFIANT = ['nommé', 'nommée', 'nommés', 'nommées', 'appelé', 'appelée', 'nom',
  // DÉFAUT DE SENS corrigé au lot J9, trouvé par le corpus Java.
  //
  // Java nomme des identifiants après un nom commun, là où C17 et Python les
  // nomment presque toujours après « nommé ». Dans « Appelle la méthode
  // afficher de e. », le mot `afficher` est au LEXIQUE : la couche le
  // remplaçait par « Affiche » et produisait `e.Affiche();`. A renommait
  // silencieusement la méthode de l'utilisateur — la faute la plus grave de
  // toute la classification, et la seule qu'aucun taux ne rachète.
  //
  // Cette liste ne peut que PROTÉGER : elle empêche une substitution, elle
  // n'en autorise aucune.
  'méthode', 'champ', 'classe', 'paquetage', 'exception', 'paramètre'];

/** Les mots qui annoncent un nom, et qui ne peuvent donc jamais ÊTRE le nom.
 * Ils échappent à la protection ci-dessus : voir `zonesProtegees`. */
const NOMMAGE: ReadonlySet<string> = new Set(['nommé', 'nommée', 'nommés', 'nommées',
  'appelé', 'appelée', 'appelés', 'appelées']);

/** Ce qu'un arbitre répond d'une phrase candidate.
 *
 * `sens` est la clé d'identité de la LECTURE : deux candidates de même `sens`
 * ne sont pas une ambiguïté, deux de `sens` différents en sont une. `apercu`
 * et `intention` ne servent qu'au message de refus.
 */
export type Jugement<C> =
  /** Refusée. `diagnostic` est renseigné quand l'arbitre a RECONNU la phrase
   * et l'a refusée pour une raison précise — par exemple « une liste se crée
   * vide ou avec ses valeurs écrites ». Ce diagnostic en apprend plus que le
   * « formulation inconnue » du départ, et la couche le fait remonter. */
  | { accepte: false; diagnostic?: { code: string; message: string } }
  | { accepte: true; sens: string; intention: string; apercu: string; resultat: C };
export type Arbitre<C> = (phrase: string) => Jugement<C>;

type Traduite = Extract<TranslationResult, { status: 'translated' }>;

/** Deux lectures ont le même sens si leur instruction est identique,
 * paramètres compris. Les intervalles sont exclus : ils désignent des
 * positions dans des phrases différentes. */
function sensDe(resultat: TranslationResult): string {
  return JSON.stringify(resultat, (cle, valeur) =>
    (cle === 'range' || cle.endsWith('Range') || cle === 'source' || cle === 'fragments'
      ? undefined : valeur));
}

/** L'arbitre du catalogue C17 : le moteur strict, et rien d'autre. */
export const ARBITRE_C17: Arbitre<Traduite> = (phrase) => {
  const resultat = translate(phrase);
  if (resultat.status !== 'translated') return { accepte: false };
  return { accepte: true, sens: sensDe(resultat), intention: resultat.instruction.kind,
    apercu: (resultat.fragments[0]?.code ?? '').replace(/\n$/u, ''), resultat };
};

export type Lecture = { phrase: string; intention: string; code: string };

export type Verdict<C = Traduite> =
  | { verdict: 'strict'; source: string; canonique: string; resultat: C }
  | { verdict: 'normalise' | 'resolu'; source: string; canonique: string; resultat: C;
    lecturesEssayees: number; lecturesValides: number;
    /** Le genre de reformulation employée, quand c'en est une. */
    genre?: GenreReformulation }
  | { verdict: 'ambigu'; code: 'AMBIGUITE_NON_RESOLUE'; source: string; message: string;
    lectures: readonly Lecture[] }
  | { verdict: 'refus'; code: 'AUCUNE_VARIANTE_CONNUE' | 'TROP_DE_SUBSTITUTIONS' | 'TROP_DE_LECTURES'
    | 'AUCUNE_LECTURE_VALIDE'; source: string; message: string; essais?: readonly string[];
    /** Le refus PRÉCIS d'une candidate reconnue, quand il y en a un. */
    diagnostic?: { code: string; message: string } };

const minuscule = (texte: string): string => texte.toLowerCase().replace(/'/gu, '’');

/** Les intervalles du texte où **aucune** substitution n'est permise :
 *  1. tout ce qui est entre guillemets ASCII — texte affiché, expression,
 *     indice, chemin de fichier : ce sont les mots de l'utilisateur ;
 *  2. tout ce qui est entre apostrophes simples — littéral caractère ;
 *  3. le mot qui suit « nommé », « appelé », « de nom » : un identifiant.
 */
export function zonesProtegees(phrase: string): { debut: number; fin: number }[] {
  const zones: { debut: number; fin: number }[] = [];
  // DÉFAUT CORRIGÉ le 17 novembre 2026, trouvé par le corpus de validation.
  // Le motif du littéral caractère était `/'[^']*'?/`, avec guillemet
  // fermant facultatif : une apostrophe DROITE dans un mot français —
  // « Passe à l'itération suivante. », ce que produit la plupart des
  // claviers — ouvrait donc une zone protégée qui avalait la fin de la
  // phrase, et la substitution du lexique était silencieusement annulée.
  // Un littéral caractère est désormais reconnu par sa forme exacte : un
  // caractère, ou une échappement, entre deux apostrophes. Une apostrophe
  // isolée n'est plus un littéral — et le moteur strict refuse de toute
  // façon un littéral non terminé.
  for (const motif of [/"[^"]*"?/gu, /'(?:\\[\s\S]|[^'\\])'/gu]) {
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
      // Un mot de NOMMAGE n'est jamais un identifiant. Sans cette exception,
      // « Crée une classe appelée Eleve. » perdait sa normalisation : le mot
      // `appelée` suivait `classe`, donc il était protégé, donc il n'était
      // plus remplacé par `nommée`. La garde sur-protégeait, et une
      // sur-protection refuse une phrase juste aussi sûrement qu'un trou
      // accepte une phrase fausse. Trouvé par le corpus Java, au lot J9.
      if (NOMMAGE.has(minuscule(identifiant))) continue;
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

/** Les phrases candidates du lexique, par substitution, sans rien réordonner. */
function parLexique(phrase: string, trouvees: { debut: number; fin: number; entree: Entree }[]): string[] {
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

/** Toutes les candidates : le lexique, les reformulations, et les
 * reformulations de chaque candidate du lexique — les deux mécanismes se
 * composent, dans cet ordre, et jamais l'inverse. */
function toutesLesCandidates(phrase: string, lexicales: string[]):
{ phrase: string; genre?: GenreReformulation }[] {
  const liste: { phrase: string; genre?: GenreReformulation }[] = [];
  const vues = new Set<string>();
  const ajouter = (candidate: string, genre?: GenreReformulation): void => {
    if (vues.has(candidate)) return;
    vues.add(candidate);
    liste.push(genre === undefined ? { phrase: candidate } : { phrase: candidate, genre });
  };
  for (const candidate of lexicales) ajouter(candidate);
  for (const candidate of [phrase, ...lexicales]) {
    for (const reformulee of reformuler(candidate)) ajouter(reformulee.phrase, reformulee.genre);
  }
  return liste;
}

/** Le budget est un **paramètre**, pas une constante cachée : la mesure sur
 * corpus doit pouvoir l'explorer sans modifier le module. En usage, il vaut
 * `BUDGET`, et l'arbitre vaut `ARBITRE_C17`. */
export function normaliser<C = Traduite>(phrase: string, options: {
  budget?: { substitutions: number; candidates: number };
  arbitre?: Arbitre<C>;
} = {}): Verdict<C> {
  const budget = options.budget ?? BUDGET;
  const arbitre = options.arbitre ?? (ARBITRE_C17 as unknown as Arbitre<C>);

  // 1. Le mode strict d'abord. Si la phrase est du catalogue, la couche ne
  //    fait rien du tout — et c'est ce qui la rend inoffensive.
  const directe = arbitre(phrase);
  if (directe.accepte) {
    return { verdict: 'strict', source: phrase, canonique: phrase, resultat: directe.resultat };
  }

  const trouvees = trouver(phrase);
  if (trouvees.length > budget.substitutions) {
    return { verdict: 'refus', code: 'TROP_DE_SUBSTITUTIONS', source: phrase,
      message: trouvees.length + ' mots du lexique dans une seule phrase, au-delà des '
        + budget.substitutions + ' autorisés. Une phrase aussi éloignée du catalogue se reformule, '
        + 'elle ne se devine pas.' };
  }
  const lexicales = parLexique(phrase, trouvees);
  const essais = toutesLesCandidates(phrase, lexicales).filter(candidate => candidate.phrase !== phrase);
  if (essais.length === 0) {
    return { verdict: 'refus', code: 'AUCUNE_VARIANTE_CONNUE', source: phrase,
      message: 'Cette formulation n’appartient pas au catalogue, et ni le lexique ni les reformulations '
        + 'connues ne s’y appliquent : il n’y a rien à normaliser.' };
  }
  if (essais.length > budget.candidates) {
    return { verdict: 'refus', code: 'TROP_DE_LECTURES', source: phrase,
      message: essais.length + ' lectures possibles, au-delà des ' + budget.candidates + ' autorisées.' };
  }

  // 2. L'arbitre tranche : une candidate n'est retenue que s'il l'accepte. La
  //    couche ne décide jamais qu'une phrase est valide.
  const acceptees: { essai: string; genre?: GenreReformulation; jugement: Extract<Jugement<C>, { accepte: true }> }[] = [];
  const refusInstruits: { code: string; message: string }[] = [];
  for (const candidate of essais) {
    const jugement = arbitre(candidate.phrase);
    if (!jugement.accepte) {
      if (jugement.diagnostic !== undefined) refusInstruits.push(jugement.diagnostic);
      continue;
    }
    acceptees.push(candidate.genre === undefined
      ? { essai: candidate.phrase, jugement }
      : { essai: candidate.phrase, genre: candidate.genre, jugement });
  }

  if (acceptees.length === 0) {
    // Si une candidate a été reconnue et refusée pour une raison précise, c'est
    // CETTE raison qu'il faut lire : « formulation inconnue » n'apprend rien.
    // La règle est déterministe : la première dans l'ordre de la table.
    const instruit = refusInstruits[0];
    return { verdict: 'refus', code: 'AUCUNE_LECTURE_VALIDE', source: phrase,
      essais: essais.map(candidate => candidate.phrase),
      ...(instruit === undefined ? {} : { diagnostic: instruit }),
      message: instruit === undefined
        ? 'Aucune des ' + essais.length + ' lectures connues n’appartient au catalogue. '
          + 'Ce qui manque n’est pas deviné.'
        : instruit.message };
  }

  const distincts = new Map<string, typeof acceptees[number]>();
  for (const candidate of acceptees) {
    if (!distincts.has(candidate.jugement.sens)) distincts.set(candidate.jugement.sens, candidate);
  }
  if (distincts.size > 1) {
    return { verdict: 'ambigu', code: 'AMBIGUITE_NON_RESOLUE', source: phrase,
      lectures: [...distincts.values()].map(lecture => ({
        phrase: lecture.essai,
        intention: lecture.jugement.intention,
        code: lecture.jugement.apercu,
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
    source: phrase, canonique: retenue.essai, resultat: retenue.jugement.resultat,
    lecturesEssayees: essais.length, lecturesValides: acceptees.length,
    ...(retenue.genre === undefined ? {} : { genre: retenue.genre }),
  };
}
