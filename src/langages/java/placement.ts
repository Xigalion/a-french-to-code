/** Placement Java — par **accolades**, et pourtant indépendant du placement
 * C17.
 *
 * Lot J2. Java porte la même étiquette `accolades` que C17 au registre, et
 * c'est exactement pour cela que ce module existe : `src/planPlacement.ts`
 * n'encode pas des règles **des accolades**, il encode des règles **du C**.
 * Quatre d'entre elles sont fausses en Java :
 *
 *   1. une instruction exécutable y exige un corps de **fonction** ; en Java,
 *      un corps de **méthode**, elle-même dans une **classe** — deux niveaux ;
 *   2. une déclaration y est plaçable à la portée fichier ; en Java, un champ
 *      exige un corps de classe, et **rien** d'exécutable ne vit au fichier ;
 *   3. une directive y précède tout le reste ; en Java, `package` précède les
 *      `import`, qui précèdent le type — un ordre **à trois temps** ;
 *   4. une définition de fonction y est plaçable au fichier ; en Java, non.
 *
 * Ce module partage avec les deux autres la **forme** de ses réponses : un
 * plan, ou un refus nommé, et un intervalle UTF-16 semi-ouvert relatif à la
 * source d'origine. Il ne partage aucun code de balayage, et la décision 2 du
 * socle est ici **confirmée** plutôt que contredite : deux langages à
 * accolades n'ont pas les mêmes portées.
 *
 * Il **planifie** ; seul l'hôte applique, après confirmation.
 */
import { NOM_PORTEE, porteesDe } from './portees.ts';
import type { Portee } from './portees.ts';

export type Intervalle = { start: number; end: number };

export type DiagnosticJava = {
  code: 'LIGNE_NON_BLANCHE' | 'CODE_VIDE' | 'PORTEE_INTERDITE' | 'ACCOLADE_NON_FERMEE'
  | 'BRANCHE_SANS_SI' | 'TRANSFERT_HORS_BOUCLE' | 'RETOUR_HORS_METHODE'
  | 'CAS_HORS_AIGUILLAGE' | 'PAQUETAGE_PAS_EN_PREMIER' | 'IMPORT_APRES_LE_TYPE'
  | 'INDENTATION_INCONNUE';
  message: string;
  range: Intervalle;
};

export type PlanJava =
  | { status: 'planifie'; edits: readonly [{ range: Intervalle; newText: string }];
    indentation: number; portee: Portee; cursor?: { offset: number } }
  | { status: 'refuse'; diagnostics: readonly [DiagnosticJava] };

export type DemandeJava = {
  readonly document: { readonly text: string };
  readonly cursorOffset: number;
  /** Le commentaire de traçabilité, déjà écrit par l'appelant. */
  readonly comment: string;
  /** Le code rendu, une ou plusieurs lignes, sans indentation. */
  readonly code: string;
  readonly kind: string;
  readonly eol?: '\n' | '\r\n';
  /** Le pas d'indentation de l'éditeur, en espaces. Java n'en impose aucun :
   * la convention est 4, et refuser un réglage de 2 au nom d'un 4 codé en dur
   * serait refuser un réglage légitime. */
  readonly pas?: number;
  /** L'unité d'indentation littérale, quand ce n'est pas une suite d'espaces.
   *
   * Java, contrairement à Python, **autorise** la tabulation et n'interdit pas
   * de mélanger : refuser un fichier indenté par tabulations reviendrait à
   * refuser un réglage d'éditeur parfaitement légal. Quand elle est donnée,
   * c'est elle qui est répétée ; `pas` ne sert alors qu'à l'intervalle
   * annoncé. */
  readonly unite?: string;
};

const PAS_DEFAUT = 4;

/** Les genres dont le rendu ouvre un bloc : le curseur va DANS le bloc. */
const EN_TETES = new Set([
  'IF', 'ELSE_IF', 'ELSE', 'WHILE', 'DO_WHILE', 'FOR', 'SWITCH', 'FUNC_DEF', 'MAIN', 'STRUCT_DECL',
  'JAVA_CLASSE', 'JAVA_CLASSE_INTERNE', 'JAVA_CLASSE_HERITE', 'JAVA_CLASSE_ABSTRAITE',
  'JAVA_CLASSE_IMPLEMENTE', 'JAVA_INTERFACE', 'JAVA_METHODE_STATIQUE',
  'JAVA_METHODE_STATIQUE_VIDE', 'JAVA_METHODE_PUBLIQUE', 'JAVA_METHODE_PUBLIQUE_VIDE',
  'JAVA_METHODE_PRIVEE', 'JAVA_METHODE_REDEFINIE', 'JAVA_METHODE_LANCE',
  'JAVA_CONSTRUCTEUR', 'JAVA_CONSTRUCTEUR_PARAMETRE', 'JAVA_POUR_CHAQUE_TABLEAU',
  'JAVA_POUR_CHAQUE_LISTE', 'JAVA_POUR_CHAQUE_CLE', 'JAVA_ESSAIE', 'JAVA_ATTRAPE',
  'JAVA_FINALEMENT', 'JAVA_ESSAIE_LECTEUR', 'JAVA_ESSAIE_ECRIVAIN',
]);

/** Les genres qui continuent une chaîne : ils remplacent l'accolade fermante. */
const BRANCHES = new Set(['ELSE_IF', 'ELSE', 'JAVA_ATTRAPE', 'JAVA_FINALEMENT']);
const TRANSFERTS = new Set(['BREAK', 'CONTINUE']);
const RETOURS = new Set(['RETURN', 'RETURN_INT', 'RETURN_EXPRESSION', 'RETURN_NUMERIC',
  'JAVA_RETOURNE_TEXTE', 'JAVA_RETOURNE_CHAINE']);
const ETIQUETTES = new Set(['CASE_INT', 'CASE_CHAR', 'CASE_DEFAULT', 'BREAK_SWITCH', 'JAVA_CAS_TEXTE']);

/** Ce qu'une accolade ouvrante a ouvert. */
type Cadre = 'classe' | 'interface' | 'methode' | 'bloc' | 'boucle' | 'aiguillage';

/** Un cadre ouvert, et le nom du type quand il en a un. Le nom sert au
 * CONTEXTE : un constructeur Java prend le nom de sa classe englobante, et A
 * ne l'invente pas. */
type CadreOuvert = { cadre: Cadre; nom?: string };

type Etat = {
  /** La pile des cadres ouverts, du plus extérieur au plus intérieur. */
  pile: CadreOuvert[];
  /** Un type a-t-il déjà été déclaré au fichier ? Décide de l'ordre des
   * `import`, que Java impose. */
  typeDeclare: boolean;
  /** Du texte significatif a-t-il déjà été écrit ? Décide si `package` peut
   * encore être la première instruction. */
  quelqueChose: boolean;
  /** Une accolade a-t-elle été fermée en trop ? */
  desequilibre: boolean;
  /** L'en-tête du dernier bloc FERMÉ à la profondeur courante, pour
   * reconnaître une chaîne `if` / `try`. */
  dernierFerme: Cadre | undefined;
  /** Le mot-clé de l'en-tête du dernier bloc fermé. */
  dernierMot: string;
};

/** Classe un en-tête de bloc par ses mots-clés. Reconnaisseur **borné** : il
 * ne comprend pas Java, il reconnaît ce que A écrit et ce qu'un humain écrit
 * normalement. Un en-tête qu'il ne reconnaît pas devient un `bloc`, et c'est
 * le défaut sûr : un bloc n'autorise ni membre ni champ. */
function classer(entete: string, dans: Cadre | undefined): { cadre: Cadre; mot: string; nom?: string } {
  const texte = entete.replace(/\s+/gu, ' ').trim();
  const mot = /(?:^|[^\p{L}])(if|else|while|for|do|switch|try|catch|finally|synchronized)\s*(?:\(|\{|$)/u
    .exec(texte)?.[1] ?? '';
  const nomType = /(?:^|[^\p{L}])(?:class|interface|enum|record)[ 	]+([A-Za-z][A-Za-z0-9_]*)/u.exec(texte)?.[1];
  if (/(?:^|[^\p{L}])interface(?![\p{L}\p{N}_])/u.test(texte)) {
    return { cadre: 'interface', mot: 'interface', ...(nomType === undefined ? {} : { nom: nomType }) };
  }
  if (/(?:^|[^\p{L}])(?:class|enum|record)(?![\p{L}\p{N}_])/u.test(texte)) {
    return { cadre: 'classe', mot: 'class', ...(nomType === undefined ? {} : { nom: nomType }) };
  }
  if (mot === 'while' || mot === 'for' || mot === 'do') return { cadre: 'boucle', mot };
  if (mot === 'switch') return { cadre: 'aiguillage', mot };
  if (mot !== '') return { cadre: 'bloc', mot };
  // Pas de mot-clé de contrôle, et des parenthèses : une méthode ou un
  // constructeur — mais SEULEMENT dans un corps de classe ou d'interface.
  // Dans une méthode, `(` peut venir d'un initialiseur de tableau ou d'une
  // expression, et appeler cela une méthode ouvrirait un faux cadre.
  if (/\)\s*(?:throws[^{]*)?$/u.test(texte) && (dans === 'classe' || dans === 'interface')) {
    return { cadre: 'methode', mot: '' };
  }
  return { cadre: 'bloc', mot: '' };
}

/** Balaie le préfixe lexical jusqu'à `fin`, en ignorant commentaires,
 * chaînes et constantes caractère. Borné, sans retour arrière. */
function balayer(texte: string, fin: number): Etat {
  const etat: Etat = { pile: [], typeDeclare: false, quelqueChose: false,
    desequilibre: false, dernierFerme: undefined, dernierMot: '' };
  let i = 0;
  /** Début du fragment courant : ce qui suit le dernier `;`, `{` ou `}`. */
  let ancre = 0;
  while (i < fin) {
    const c = texte[i] ?? '';
    const suivant = texte[i + 1] ?? '';
    if (c === '/' && suivant === '/') {
      const saut = texte.indexOf('\n', i);
      i = saut === -1 ? fin : saut;
      continue;
    }
    if (c === '/' && suivant === '*') {
      const sortie = texte.indexOf('*/', i + 2);
      i = sortie === -1 ? fin : sortie + 2;
      continue;
    }
    if (c === '"' || c === '\'') {
      i++;
      while (i < fin) {
        if (texte[i] === '\\') { i += 2; continue; }
        if (texte[i] === c) { i++; break; }
        i++;
      }
      etat.quelqueChose = true;
      continue;
    }
    if (c === '{') {
      const dans = etat.pile.at(-1)?.cadre;
      const { cadre, mot, nom } = classer(texte.slice(ancre, i), dans);
      if (cadre === 'classe' || cadre === 'interface') {
        if (etat.pile.length === 0) etat.typeDeclare = true;
      }
      etat.pile.push({ cadre, ...(nom === undefined ? {} : { nom }) });
      etat.dernierFerme = undefined;
      etat.dernierMot = mot;
      etat.quelqueChose = true;
      ancre = i + 1;
      i++;
      continue;
    }
    if (c === '}') {
      const sorti = etat.pile.pop();
      if (sorti === undefined) etat.desequilibre = true;
      else { etat.dernierFerme = sorti.cadre; }
      etat.quelqueChose = true;
      ancre = i + 1;
      i++;
      continue;
    }
    if (c === ';') { etat.quelqueChose = true; ancre = i + 1; i++; continue; }
    if (!/\s/u.test(c)) etat.quelqueChose = true;
    i++;
  }
  return etat;
}

/** La portée courante, déduite de la pile. */
function porteeDe(pile: readonly CadreOuvert[]): Portee {
  const haut = pile.at(-1)?.cadre;
  if (haut === undefined) return 'fichier';
  if (haut === 'classe') return 'classe';
  if (haut === 'interface') return 'interface';
  return 'methode';
}

/** Le nom du type le plus proche qui englobe le curseur, ou `undefined`.
 *
 * C'est le CONTEXTE dont un constructeur a besoin : il porte le nom de sa
 * classe, et A ne l'invente pas. Même procédé que `structTarget.ts` au lot 20,
 * qui lit la structure englobante au lieu de demander son nom dans la phrase.
 */
export function classeEnglobante(texte: string, decalage: number): string | undefined {
  const etat = balayer(texte, decalage);
  if (etat.desequilibre) return undefined;
  for (let i = etat.pile.length - 1; i >= 0; i--) {
    const cadre = etat.pile[i];
    if (cadre === undefined) continue;
    if ((cadre.cadre === 'classe' || cadre.cadre === 'interface') && cadre.nom !== undefined) {
      return cadre.nom;
    }
  }
  return undefined;
}

function refus(code: DiagnosticJava['code'], message: string, range: Intervalle): PlanJava {
  return { status: 'refuse', diagnostics: [{ code, message, range }] };
}

/** Le mot-clé qui a ouvert le dernier bloc fermé juste avant le curseur, en
 * relisant le texte à l'envers. Sert aux branches `else` / `catch`, qui
 * remplacent une accolade fermante. */
function moteDuBlocFerme(texte: string, avant: number): string {
  // La dernière accolade fermante avant le curseur.
  let i = avant - 1;
  while (i >= 0 && /\s/u.test(texte[i] ?? '')) i--;
  if (texte[i] !== '}') return '';
  // Remonter jusqu'à son ouvrante, en comptant.
  let profondeur = 0;
  for (; i >= 0; i--) {
    const c = texte[i];
    if (c === '}') profondeur++;
    else if (c === '{') {
      profondeur--;
      if (profondeur !== 0) continue;
      // L'en-tête va du début de l'instruction jusqu'à cette accolade. Le
      // chercher par une expression régulière ancrée à la fin avait un défaut
      // trouvé par l'exercice de clôture : un `try (BufferedReader f = new
      // BufferedReader(new FileReader("x")))` contient des parenthèses
      // IMBRIQUÉES, que « \([^)]*\) » ne traverse pas. On remonte donc au
      // séparateur d'instruction, et on lit le PREMIER mot-clé de l'en-tête.
      let debut = i - 1;
      while (debut >= 0 && !';{}'.includes(texte[debut] ?? '')) debut--;
      const entete = texte.slice(debut + 1, i);
      return /(?:^|[^\p{L}])(if|else|try|catch|finally)(?![\p{L}\p{N}_])/u.exec(entete)?.[1] ?? '';
    }
  }
  return '';
}

export function planifierJava(demande: DemandeJava): PlanJava {
  const { text } = demande.document;
  const curseur = { start: demande.cursorOffset, end: demande.cursorOffset };
  const PAS = demande.pas === undefined ? PAS_DEFAUT : demande.pas;
  if (!Number.isSafeInteger(PAS) || PAS < 1) {
    return refus('INDENTATION_INCONNUE',
      'Le pas d’indentation doit être un nombre entier d’espaces supérieur à zéro.', curseur);
  }
  const eol = demande.eol === undefined ? '\n' : demande.eol;
  if (demande.code.trim() === '') {
    return refus('CODE_VIDE', 'Aucun code à placer : le langage n’a rien rendu.', curseur);
  }

  // 1. La ligne du curseur, et elle doit être blanche : A n'écrit jamais
  //    par-dessus du code existant — règle 9.
  // `lastIndexOf('\n', 0)` trouve le saut de ligne D'INDICE 0 : avec un
  // curseur en tête d'un document qui commence par une ligne blanche, la
  // ligne calculée commençait APRÈS ce saut, et l'intervalle d'édition
  // devenait inversé. Le cas est explicite plutôt que corrigé par un max().
  const debutLigne = demande.cursorOffset === 0
    ? 0
    : text.lastIndexOf('\n', demande.cursorOffset - 1) + 1;
  const sautSuivant = text.indexOf('\n', debutLigne);
  const finBrute = sautSuivant === -1 ? text.length : sautSuivant;
  const contenu = text.slice(debutLigne, finBrute).replace(/\r$/u, '');
  const finLigne = debutLigne + contenu.length;
  if (contenu.trim() !== '') {
    return refus('LIGNE_NON_BLANCHE',
      'Le curseur doit être sur une ligne blanche : A ne remplace jamais une ligne existante.',
      { start: debutLigne, end: finLigne });
  }

  // 2. Le contexte, par un balayage borné du préfixe.
  const etat = balayer(text, debutLigne);
  if (etat.desequilibre) {
    return refus('ACCOLADE_NON_FERMEE',
      'Une accolade fermante de trop se trouve avant le curseur : A ne devine pas la structure '
      + 'd’un fichier déséquilibré.', { start: debutLigne, end: finLigne });
  }
  const portee = porteeDe(etat.pile);

  // 3. La portée exigée par le genre. C'est le cœur du lot, et c'est aussi
  //    le premier endroit où Java RETIRE des placements que C17 autorise.
  const admises = porteesDe(demande.kind);
  if (!admises.has(portee)) {
    const attendues = [...admises].map(p => NOM_PORTEE[p]).join(' ou ');
    return refus('PORTEE_INTERDITE',
      'Cette instruction ne peut pas figurer dans ' + NOM_PORTEE[portee] + ' : en Java, elle exige '
      + attendues + '. '
      + (portee === 'fichier'
        ? 'Rien d’exécutable ne vit à la portée fichier en Java — pas même une affectation.'
        : 'Placez le curseur à l’endroit qui la porte.'),
      { start: debutLigne, end: finLigne });
  }

  // 4. `package` doit être la PREMIÈRE instruction du fichier, et les
  //    `import` doivent précéder le type. Deux contraintes d'ordre que le
  //    placement C17 n'a pas : il n'en connaît qu'une.
  if (demande.kind === 'JAVA_PAQUETAGE' && etat.quelqueChose) {
    return refus('PAQUETAGE_PAS_EN_PREMIER',
      'La déclaration de paquetage doit être la **première** instruction du fichier : rien ne peut '
      + 'la précéder, pas même un import. Seul un commentaire est permis au-dessus.',
      { start: debutLigne, end: finLigne });
  }
  if (demande.kind === 'JAVA_IMPORT' && etat.typeDeclare) {
    return refus('IMPORT_APRES_LE_TYPE',
      'Un import doit précéder la déclaration de la classe ou de l’interface : ici, un type est déjà '
      + 'déclaré au-dessus.', { start: debutLigne, end: finLigne });
  }

  // 5. `else`, `else if`, `catch`, `finally` : la chaîne doit exister. Ils
  //    remplacent une accolade fermante, et sans elle ils ne continuent rien.
  if (BRANCHES.has(demande.kind)) {
    const mot = moteDuBlocFerme(text, debutLigne);
    const attenduIf = demande.kind === 'ELSE' || demande.kind === 'ELSE_IF';
    const chaine = attenduIf ? ['if', 'else'] : ['try', 'catch'];
    if (!chaine.includes(mot)) {
      return refus('BRANCHE_SANS_SI',
        attenduIf
          ? 'Aucune chaîne « if » ne se termine juste avant le curseur : une branche « sinon » se place '
            + 'après l’accolade fermante du bloc qu’elle continue.'
          : 'Aucun bloc « essaie » ne se termine juste avant le curseur : une branche « attrape » ou '
            + '« finalement » se place après l’accolade fermante du bloc qu’elle continue.',
        { start: debutLigne, end: finLigne });
    }
  }

  // 6. `break` et `continue` : une boucle doit englober. `break` est aussi
  //    légal dans un aiguillage, et c'est la seule différence entre les deux.
  if (TRANSFERTS.has(demande.kind)) {
    const cadres = etat.pile.map(ouvert => ouvert.cadre);
    const admis: Cadre[] = demande.kind === 'BREAK' ? ['boucle', 'aiguillage'] : ['boucle'];
    // La recherche s'arrête à la méthode : une boucle hors de la méthode
    // n'englobe pas, et il n'y en a pas en Java de toute façon.
    let trouve = false;
    for (let i = cadres.length - 1; i >= 0; i--) {
      const cadre = cadres[i];
      if (cadre === 'methode' || cadre === 'classe' || cadre === 'interface') break;
      if (cadre !== undefined && admis.includes(cadre)) { trouve = true; break; }
    }
    if (!trouve) {
      return refus('TRANSFERT_HORS_BOUCLE',
        demande.kind === 'BREAK'
          ? 'Aucune boucle ni aiguillage n’englobe cette ligne : « sors de la boucle » n’a de sens que '
            + 'dans l’un des deux.'
          : 'Aucune boucle n’englobe cette ligne : « passe à l’itération suivante » n’a de sens que dans '
            + 'une boucle.', { start: debutLigne, end: finLigne });
    }
  }

  // 7. Une étiquette de cas, et la sortie d'aiguillage, exigent l'aiguillage.
  if (ETIQUETTES.has(demande.kind)) {
    if (etat.pile.at(-1)?.cadre !== 'aiguillage') {
      return refus('CAS_HORS_AIGUILLAGE',
        'Aucun aiguillage n’englobe directement cette ligne : un cas se place dans le corps du '
        + '« switch », pas dans un bloc imbriqué.', { start: debutLigne, end: finLigne });
    }
  }

  // 8. `return` : une méthode doit englober. En Java, c'est garanti par la
  //    règle 3 — l'exécutable exige `methode` — mais le dire explicitement
  //    produit un message juste au lieu d'un message générique.
  if (RETOURS.has(demande.kind) && !etat.pile.some(ouvert => ouvert.cadre === 'methode')) {
    return refus('RETOUR_HORS_METHODE',
      'Aucune méthode n’englobe cette ligne : « retourne » n’existe que dans une méthode ou un '
      + 'constructeur.', { start: debutLigne, end: finLigne });
  }

  // 9. Le texte inséré. L'indentation vient de la PROFONDEUR, pas de la ligne
  //    blanche : en Java l'indentation est une mise en forme, et s'en servir
  //    comme d'une structure — ce que Python fait — serait faux ici.
  const profondeur = etat.pile.length;
  const marge = demande.unite === undefined
    ? ' '.repeat(profondeur * PAS)
    : demande.unite.repeat(profondeur);
  // Une ligne blanche du rendu garde SON indentation : c'est le corps vide
  // d'un bloc, et c'est là que le curseur doit pouvoir se poser. La vider
  // laisserait le curseur en colonne zéro, dans un bloc indenté.
  const corps = demande.code.replace(/\n$/u, '').split('\n')
    .map(ligne => (ligne === '' ? '' : marge + ligne));
  const inserees = [marge + demande.comment, ...corps];
  const newText = inserees.join(eol);

  const plan: PlanJava = {
    status: 'planifie',
    edits: [{ range: { start: debutLigne, end: finLigne }, newText }],
    indentation: profondeur * PAS,
    portee,
  };
  // 10. Un en-tête laisse le curseur DANS le bloc, un cran plus loin. Le
  //     corps reste à écrire : A n'en écrit aucune ligne.
  if (EN_TETES.has(demande.kind)) {
    // La dernière ligne insérée est l'accolade fermante ; celle d'avant est le
    // corps vide. Le curseur se pose à sa FIN, prêt à écrire.
    const avantFermante = newText.lastIndexOf(eol);
    if (avantFermante !== -1) return { ...plan, cursor: { offset: debutLigne + avantFermante } };
  }
  return plan;
}
