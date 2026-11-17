/** Placement Python — par INDENTATION, et indépendant du placement C.
 *
 * Décision 2 du socle : deux modules, non unifiés. Les accolades et
 * l'indentation ne sont pas deux cas d'une même idée, et les mélanger
 * produirait un module plus difficile à lire que les deux réunis.
 *
 * Ce module ne partage avec le placement C que la **forme** de ses réponses :
 * un plan, ou un refus nommé. Il ne partage aucun code de balayage.
 *
 * Quatre différences de fond avec C, et elles sont la raison d'être du
 * module :
 *   1. l'indentation est **significative** : la colonne où l'on insère
 *      décide du bloc auquel l'instruction appartient ;
 *   2. une instruction à la portée **module** est valide — Python n'a pas
 *      besoin d'une fonction, et le refus `STATEMENT_AT_FILE_SCOPE` du lot 26
 *      n'a donc pas d'équivalent ici ;
 *   3. un en-tête de bloc **exige** un corps plus indenté : un bloc vide est
 *      une erreur de syntaxe, là où C accepte `{}` ;
 *   4. une chaîne `if` / `elif` / `else` se reconnaît par la **colonne**, pas
 *      par une accolade fermante.
 */

export type Intervalle = { start: number; end: number };

export type DiagnosticPython = {
  code: 'LIGNE_NON_BLANCHE' | 'INDENTATION_INCONNUE' | 'BRANCHE_SANS_SI'
  | 'TRANSFERT_HORS_BOUCLE' | 'RETOUR_HORS_FONCTION' | 'CORPS_ATTENDU'
  | 'EN_TETE_SANS_CORPS' | 'CODE_VIDE';
  message: string;
  range: Intervalle;
};

export type PlanPython =
  | { status: 'planifie'; edits: readonly [{ range: Intervalle; newText: string }];
    indentation: number; cursor?: { offset: number } }
  | { status: 'refuse'; diagnostics: readonly [DiagnosticPython] };

/** Ce dont le placement a besoin : le document, le curseur, et le texte à
 * insérer. Il ne traduit pas et ne rend pas : il pose. */
export type DemandePython = {
  readonly document: { readonly text: string };
  readonly cursorOffset: number;
  /** Le commentaire de traçabilité, déjà écrit par l'appelant. */
  readonly comment: string;
  /** Le code rendu par le langage, une ou plusieurs lignes, sans indentation. */
  readonly code: string;
  /** L'intention, pour les règles qui dépendent du genre. */
  readonly kind: string;
  /** La fin de ligne du document. Trouvée par l'intégration à l'éditeur : le
   * module écrivait LF sans regarder, ce qui mélange les fins de ligne dans un
   * fichier CRLF. Par défaut LF, qui est ce que Python écrit. */
  readonly eol?: '\n' | '\r\n';
  /** Le pas d'indentation de l'éditeur. Python n'en impose aucun — PEP 8
   * recommande 4 — et refuser une indentation de 2 au nom d'un 4 code en dur
   * serait refuser un réglage légitime. */
  readonly pas?: number;
};

/** Valeur par défaut, et seulement par défaut : c'est la recommandation de
 * PEP 8, pas une règle du langage. */
const PAS_DEFAUT = 4;

/** Les genres qui ouvrent un bloc en Python : leur en-tête finit par « : ». */
const EN_TETES = new Set(['IF', 'ELSE_IF', 'ELSE', 'WHILE', 'FUNC_DEF',
  // Lot P4 : les en-tetes du catalogue NATIF. La liste est explicite ici
  // plutot qu'importee, pour que le placement ne depende pas du rendu.
  'PY_POUR_INTERVALLE', 'PY_POUR_CHAQUE', 'PY_SI_PRINCIPAL']);
/** Les genres qui continuent une chaîne conditionnelle. */
const BRANCHES = new Set(['ELSE_IF', 'ELSE']);
/** Les genres qui exigent une boucle englobante. */
const TRANSFERTS = new Set(['BREAK', 'CONTINUE']);
/** Les genres qui exigent une fonction englobante. */
const RETOURS = new Set(['RETURN', 'RETURN_INT', 'RETURN_EXPRESSION', 'RETURN_NUMERIC']);

type Ligne = {
  /** Décalage du premier caractère de la ligne dans le document. */
  debut: number;
  fin: number;
  texte: string;
  blanche: boolean;
  /** Indentation en espaces. Une tabulation vaut un caractère : Python les
   * interdit mélangées, et ce module ne tente pas de les réconcilier. */
  indentation: number;
  /** Premier mot, pour reconnaître `if`, `elif`, `else`, `while`, `def`. */
  mot: string;
  /** La ligne ouvre un bloc : elle finit par « : ». */
  enTete: boolean;
};

function decouper(texte: string): Ligne[] {
  const lignes: Ligne[] = [];
  let debut = 0;
  for (const brut of texte.split('\n')) {
    // Un CR final appartient a la fin de ligne, pas au contenu : le laisser
    // ferait echouer le test de ligne blanche dans un fichier CRLF.
    const contenu = brut.endsWith('\r') ? brut.slice(0, -1) : brut;
    const sansIndentation = contenu.replace(/^[ \t]*/u, '');
    const blanche = sansIndentation.trim() === '';
    lignes.push({
      debut, fin: debut + contenu.length, texte: contenu, blanche,
      indentation: contenu.length - sansIndentation.length,
      mot: /^([A-Za-z_]+)/u.exec(sansIndentation)?.[1] ?? '',
      enTete: /:\s*(#.*)?$/u.test(sansIndentation) && sansIndentation !== '',
    });
    debut += brut.length + 1;
  }
  return lignes;
}

function refus(code: DiagnosticPython['code'], message: string, range: Intervalle): PlanPython {
  return { status: 'refuse', diagnostics: [{ code, message, range }] };
}

/**
 * Planifie l'insertion. Ne modifie rien : l'hôte applique, après
 * confirmation, exactement comme pour le C.
 */
export function planifierPython(demande: DemandePython): PlanPython {
  const { text } = demande.document;
  const PAS = demande.pas === undefined ? PAS_DEFAUT : demande.pas;
  if (!Number.isSafeInteger(PAS) || PAS < 1) {
    return refus('INDENTATION_INCONNUE',
      'Le pas d’indentation doit être un nombre entier d’espaces supérieur à zéro.',
      { start: demande.cursorOffset, end: demande.cursorOffset });
  }
  const eol = demande.eol === undefined ? '\n' : demande.eol;
  if (demande.code.trim() === '') {
    return refus('CODE_VIDE', 'Aucun code à placer : le langage n’a rien rendu.',
      { start: demande.cursorOffset, end: demande.cursorOffset });
  }

  const lignes = decouper(text);
  const index = lignes.findIndex(ligne => demande.cursorOffset >= ligne.debut && demande.cursorOffset <= ligne.fin);
  const rang = index === -1 ? lignes.length - 1 : index;
  // `decouper` rend toujours au moins une ligne, meme pour un document vide :
  // l'invariant est verifie, pas suppose.
  const courante = lignes[rang];
  if (courante === undefined) throw new Error('Invariant interne : document sans ligne.');

  // 1. La ligne doit être blanche : C-A n'écrit jamais par-dessus du code.
  if (!courante.blanche) {
    return refus('LIGNE_NON_BLANCHE',
      'Le curseur doit être sur une ligne blanche : C-A ne remplace jamais une ligne existante.',
      { start: courante.debut, end: courante.fin });
  }

  // 2. L'indentation de la ligne blanche décide du bloc. En Python, ce n'est
  //    pas une mise en forme : c'est la structure.
  const cible = courante.texte.length;
  if (cible % PAS !== 0) {
    return refus('INDENTATION_INCONNUE',
      'L’indentation de cette ligne (' + cible + ' espaces) n’est pas un multiple de ' + PAS
      + ' : C-A ne devine pas à quel bloc elle appartient.',
      { start: courante.debut, end: courante.fin });
  }

  /** Les lignes non blanches précédentes, du plus proche au plus lointain. */
  const precedentes = lignes.slice(0, rang).filter(ligne => !ligne.blanche).reverse();
  const [precedente] = precedentes;

  // 3. Un en-tête exige un corps PLUS indenté. C'est propre à Python : un
  //    bloc vide y est une erreur de syntaxe, et C-A ne doit pas en écrire.
  if (precedente?.enTete && cible <= precedente.indentation) {
    return refus('CORPS_ATTENDU',
      'La ligne précédente ouvre un bloc : en Python, son corps doit être indenté de '
      + PAS + ' espaces de plus. Un bloc vide est une erreur de syntaxe.',
      { start: courante.debut, end: courante.fin });
  }

  // 4. Une indentation plus profonde que tout bloc ouvert n'appartient à rien.
  if (precedente !== undefined && cible > precedente.indentation && !precedente.enTete) {
    return refus('INDENTATION_INCONNUE',
      'Cette ligne est plus indentée que la précédente, qui n’ouvre pas de bloc : '
      + 'aucun bloc ne la contient.',
      { start: courante.debut, end: courante.fin });
  }

  // 5. `elif` et `else` : la chaîne se reconnaît par la colonne. La première
  //    ligne non blanche d'indentation ≤ cible doit être un `if` ou un `elif`
  //    à la MÊME colonne.
  if (BRANCHES.has(demande.kind)) {
    const ancre = precedentes.find(ligne => ligne.indentation <= cible);
    if (ancre === undefined || ancre.indentation !== cible || !['if', 'elif'].includes(ancre.mot)) {
      return refus('BRANCHE_SANS_SI',
        'Aucune chaîne « if » ne se termine à cette colonne : une branche se place à la même '
        + 'indentation que le « if » qu’elle continue.',
        { start: courante.debut, end: courante.fin });
    }
  }

  // 6. `break` et `continue` : une boucle doit englober, et une fonction
  //    rencontrée avant arrête la recherche — une boucle hors de la fonction
  //    n'englobe pas.
  if (TRANSFERTS.has(demande.kind)) {
    let trouvee = false;
    let colonne = cible;
    for (const ligne of precedentes) {
      if (ligne.indentation >= colonne || !ligne.enTete) continue;
      if (['while', 'for'].includes(ligne.mot)) { trouvee = true; break; }
      if (ligne.mot === 'def') break;
      colonne = ligne.indentation;
    }
    if (!trouvee) {
      return refus('TRANSFERT_HORS_BOUCLE',
        'Aucune boucle n’englobe cette ligne : « break » et « continue » n’ont de sens que dans une boucle.',
        { start: courante.debut, end: courante.fin });
    }
  }

  // 7. `return` : une fonction doit englober. À la portée module, Python le
  //    refuse — et c'est la seule parenté avec le lot 26.
  if (RETOURS.has(demande.kind)) {
    const fonction = precedentes.some(ligne => ligne.enTete && ligne.mot === 'def' && ligne.indentation < cible);
    if (!fonction) {
      return refus('RETOUR_HORS_FONCTION',
        'Aucune fonction n’englobe cette ligne : « return » n’existe que dans une fonction.',
        { start: courante.debut, end: courante.fin });
    }
  }

  // 8. Le texte inséré : commentaire de traçabilité, puis code, chaque ligne
  //    portée à l'indentation cible. Aucune ligne n'est ajoutée au-delà.
  const marge = ' '.repeat(cible);
  const corps = demande.code.replace(/\n$/u, '').split('\n')
    .map(ligne => (ligne.trim() === '' ? '' : marge + ligne));
  const inserees = [marge + demande.comment, ...corps];
  const newText = inserees.join(eol);

  const plan: PlanPython = {
    status: 'planifie',
    edits: [{ range: { start: courante.debut, end: courante.fin }, newText }],
    indentation: cible,
  };
  // 9. Un en-tête laisse le curseur DANS le bloc, un cran plus loin : le
  //    corps est à écrire, et C-A n'en écrit aucune ligne.
  if (EN_TETES.has(demande.kind)) {
    return { ...plan, cursor: { offset: courante.debut + newText.length + eol.length + cible + PAS } };
  }
  return plan;
}
