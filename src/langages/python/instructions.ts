/** Les intentions **propres à Python** : leurs phrases françaises et leur AST.
 *
 * Lot P4. Ce module est le catalogue pédagogique de Python, et il n'est pas
 * un portage : aucune de ces intentions n'existe dans le catalogue C17.
 *
 * **Il n'est appelé par personne dans `src/translate.ts`.** C'est la
 * propriété qui garantit que le moteur C17 n'a pas bougé : une phrase écrite
 * dans un `.c` ne peut pas atteindre ce module. La session Python l'appelle
 * après que le catalogue partagé a refusé, jamais avant — une phrase du
 * catalogue partagé se comporte donc exactement comme elle se comportait.
 *
 * Les quatre règles valent ici comme ailleurs :
 *   - aucune information manquante n'est devinée : `Crée une liste nommée t.`
 *     est refusée, parce que ni le contenu ni l'intention « vide » n'y sont ;
 *   - un refus est explicite et ne produit aucun fragment ;
 *   - la phrase exacte est conservée par l'appelant, dans le commentaire ;
 *   - les guillemets délimitent une **expression**, jamais une chaîne C.
 */
import type { SourceRange } from '../../translate.ts';
import { parseNumericExpression } from '../../numericExpression.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import { parseStringLiteral } from '../../stringLiteral.ts';
import { MOTS_RESERVES_PYTHON } from './expression.ts';

export type ConversionPython = 'int' | 'float' | 'str';

export type InstructionPython =
  | { kind: 'PY_LISTE_VIDE'; parameters: { name: string } }
  | { kind: 'PY_LISTE_VALEURS'; parameters: { name: string; valeurs: NumericExpression[] } }
  | { kind: 'PY_AJOUTER'; parameters: { name: string; valeur: NumericExpression } }
  | { kind: 'PY_LONGUEUR'; parameters: { name: string; source: string } }
  | { kind: 'PY_POUR_INTERVALLE'; parameters: { name: string; debut: NumericExpression; fin: NumericExpression } }
  | { kind: 'PY_POUR_CHAQUE'; parameters: { name: string; collection: string } }
  | { kind: 'PY_DIV_ENTIERE'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_DIV_REELLE'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_MODULO'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_INIT_STR'; parameters: { name: string; texte: string } }
  | { kind: 'PY_INIT_BOOL'; parameters: { name: string; valeur: boolean } }
  | { kind: 'PY_CONVERSION'; parameters: { name: string; conversion: ConversionPython; source: string } }
  | { kind: 'PY_INPUT'; parameters: { name: string } }
  | { kind: 'PY_SI_PRINCIPAL'; parameters: Record<string, never> };

export type DiagnosticPy = {
  code: string; category: 'understanding'; severity: 'error'; message: string; range: SourceRange;
};
export type AnalysePython =
  | { status: 'reconnu'; instruction: InstructionPython }
  | { status: 'refuse'; diagnostic: DiagnosticPy };

type Jeton = { text: string; range: SourceRange };

const INCONNUE = 'Cette formulation n’appartient pas au catalogue Python de C-A.';

/** Les premiers mots qui font entrer une phrase dans ce module. Hors de cette
 * liste, le module **décline** : la phrase repart au diagnostic du catalogue
 * partagé, qui est celui que l'utilisateur doit lire. */
const AMORCES: readonly (readonly string[])[] = [
  ['crée', 'une', 'liste'],
  ['crée', 'une', 'chaîne'],
  ['crée', 'un', 'booléen'],
  ['crée', 'le', 'point'],
  ['crée', 'une', 'boucle', 'pour', 'chaque'],
  ['ajoute'],
  ['affecte', 'à'],
  ['lis', 'une', 'saisie'],
];

function minuscule(valeur: string): string {
  return valeur.toLowerCase().replace(/'/gu, '’');
}
const meme = (attendu: string, ecrit: string): boolean => attendu === minuscule(ecrit);

/** Le découpage de `translate`, repris à l'identique pour que les intervalles
 * aient le même sens : une seule ligne, espaces ou tabulations, point final
 * facultatif et collé au dernier mot. */
function decouper(text: string): { tokens: Jeton[]; end: number } | DiagnosticPy {
  const separateur = /[^\S \t]/u.exec(text);
  if (separateur) {
    return { code: 'INVALID_SEPARATOR', category: 'understanding', severity: 'error',
      message: 'Instruction monoligne : utilisez uniquement des espaces ordinaires ou des tabulations.',
      range: { start: separateur.index, end: separateur.index + separateur[0].length } };
  }
  const start = text.search(/[^ \t]/u);
  if (start === -1) {
    return { code: 'EMPTY_INPUT', category: 'understanding', severity: 'error',
      message: 'Saisissez une instruction.', range: { start: text.length, end: text.length } };
  }
  let end = text.length;
  while (end > start && /[ \t]/u.test(text.charAt(end - 1))) end--;
  if (text.charAt(end - 1) === '.' && end > start + 1 && !/[ \t]/u.test(text.charAt(end - 2))) end--;
  const tokens = Array.from(text.slice(start, end).matchAll(/[^ \t]+/gu), trouve => ({
    text: trouve[0],
    range: { start: start + trouve.index, end: start + trouve.index + trouve[0].length },
  }));
  return { tokens, end };
}

/**
 * Analyse une phrase du catalogue **Python**.
 *
 * `undefined` signifie « ce n'est pas une phrase de ce catalogue » : l'appelant
 * doit alors garder le diagnostic du catalogue partagé. C'est la différence
 * entre « je ne reconnais pas » et « je reconnais et je refuse », et les
 * confondre ferait disparaître le diagnostic utile.
 */
export function analyserPython(text: string): AnalysePython | undefined {
  const decoupe = decouper(text);
  if ('code' in decoupe) return undefined;
  const { tokens, end } = decoupe;
  const mot = (index: number): string => minuscule(tokens[index]?.text ?? '');
  if (!AMORCES.some(amorce => amorce.every((attendu, decalage) => mot(decalage) === attendu))) return undefined;

  let diagnostic: DiagnosticPy | undefined;
  /** Enregistre le premier refus et rend `undefined`, comme les enveloppes C. */
  function echec(code: string, message: string, range: SourceRange): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  }
  const finDeTexte = (): SourceRange => ({ start: end, end });
  function attendre(index: number, attendu: string, message?: string): boolean {
    const token = tokens[index];
    if (!token) {
      echec('INCOMPLETE_INSTRUCTION',
        message ?? `Instruction incomplète : « ${attendu} » attendu.`, finDeTexte());
      return false;
    }
    if (!meme(attendu, token.text)) { echec('UNKNOWN_FORMULATION', INCONNUE, token.range); return false; }
    return true;
  }
  function attendreSuite(index: number, mots: readonly string[], message?: string): boolean {
    return mots.every((attendu, decalage) => attendre(index + decalage, attendu, message));
  }
  function termine(index: number): boolean {
    const extra = tokens[index];
    if (!extra) return true;
    echec('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return false;
  }
  /** Un nom donné par la phrase : identifiant ASCII, et pas un mot réservé de
   * Python. La seconde moitié est propre à ce langage, et c'est pour cela
   * qu'elle vit ici et non dans le moteur. */
  function nom(index: number, manquant: string): string | undefined {
    const token = tokens[index];
    if (!token) return echec('MISSING_NAME', manquant, finDeTexte());
    if (MOTS_RESERVES_PYTHON.has(token.text)) {
      return echec('PYTHON_KEYWORD_IDENTIFIER',
        `« ${token.text} » est un mot réservé de Python et ne peut pas nommer une variable.`, token.range);
    }
    if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(token.text)) {
      return echec('INVALID_IDENTIFIER',
        'Le nom doit commencer par une lettre ASCII et contenir uniquement lettres ASCII, chiffres ou soulignements.',
        token.range);
    }
    return token.text;
  }
  /** Une expression entre guillemets ASCII, analysée par le profil numérique
   * partagé — le même que celui des tableaux et des structures. */
  function expression(index: number, manquant: string, budget: { count: number }):
  { expression: NumericExpression; apres: number; fermant: number } | undefined {
    const token = tokens[index];
    if (!token) return echec('MISSING_EXPRESSION', manquant, finDeTexte());
    if (!token.text.startsWith('"')) {
      return echec('MISSING_EXPRESSION_DELIMITER',
        'L’expression doit être entourée de guillemets ASCII.', { start: token.range.start, end: token.range.start });
    }
    const ouvrant = token.range.start;
    const fermant = text.indexOf('"', ouvrant + 1);
    if (fermant === -1 || fermant >= end) {
      return echec('UNTERMINATED_EXPRESSION', 'Il manque le guillemet fermant de l’expression.',
        { start: ouvrant, end });
    }
    const analyse = parseNumericExpression(text, ouvrant + 1, fermant, () => undefined, manquant, budget);
    if (analyse.status === 'rejected') {
      diagnostic ??= { ...analyse.diagnostic, code: analyse.diagnostic.code };
      return undefined;
    }
    // Le jeton suivant est celui qui commence après le guillemet fermant.
    const apres = tokens.findIndex(candidat => candidat.range.start > fermant);
    return { expression: analyse.expression, apres: apres === -1 ? tokens.length : apres, fermant };
  }
  /** Un texte entre guillemets, lu par le scanner partagé du lot 16. */
  function texte(index: number, manquant: string): { valeur: string; apres: number } | undefined {
    const token = tokens[index];
    if (!token) return echec('MISSING_TEXT', manquant, finDeTexte());
    if (!token.text.startsWith('"')) {
      return echec('MISSING_TEXT_DELIMITER', 'Le texte doit être entouré de guillemets ASCII.',
        { start: token.range.start, end: token.range.start });
    }
    const lu = parseStringLiteral(text, token.range.start, end);
    if (lu.status === 'rejected') {
      diagnostic ??= { ...lu.diagnostic };
      return undefined;
    }
    const apres = tokens.findIndex(candidat => candidat.range.start >= lu.end);
    return { valeur: lu.literal.value, apres: apres === -1 ? tokens.length : apres };
  }

  const reconnu = (instruction: InstructionPython): AnalysePython => ({ status: 'reconnu', instruction });
  const refus = (): AnalysePython => ({ status: 'refuse',
    diagnostic: diagnostic ?? { code: 'UNKNOWN_FORMULATION', category: 'understanding', severity: 'error',
      message: INCONNUE, range: tokens[0]?.range ?? finDeTexte() } });

  // ---- Crée une liste … -------------------------------------------------
  if (mot(0) === 'crée' && mot(1) === 'une' && mot(2) === 'liste') {
    // « vide nommée n » ou « nommée n avec les valeurs … » : l'un des deux,
    // jamais un contenu déduit.
    if (mot(3) === 'vide') {
      if (!attendre(4, 'nommée')) return refus();
      const name = nom(5, 'Il manque le nom de la liste.');
      if (name === undefined || !termine(6)) return refus();
      return reconnu({ kind: 'PY_LISTE_VIDE', parameters: { name } });
    }
    if (!attendre(3, 'nommée')) return refus();
    const name = nom(4, 'Il manque le nom de la liste.');
    if (name === undefined) return refus();
    if (tokens[5] === undefined) {
      return { status: 'refuse', diagnostic: { code: 'MISSING_LIST_CONTENT', category: 'understanding',
        severity: 'error',
        message: 'Une liste se crée vide — « Crée une liste vide nommée … » — ou avec ses valeurs écrites. '
          + 'C-A n’en invente ni le contenu ni la taille.',
        range: finDeTexte() } };
    }
    if (!attendreSuite(5, ['avec', 'les', 'valeurs'])) return refus();
    // L'énumération française : des valeurs séparées par des virgules, et
    // « et » devant la dernière. La virgule peut être collée au guillemet
    // fermant ou détachée — les deux s'écrivent naturellement, et aucune des
    // deux ne change le sens. Sans séparateur, l'énumération s'arrête : deux
    // valeurs accolées produisent donc un refus de texte supplémentaire.
    const valeurs: NumericExpression[] = [];
    const budget = { count: 0 };
    let index = 8;
    for (;;) {
      const valeur = expression(index, 'Il manque une valeur de la liste.', budget);
      if (!valeur) return refus();
      valeurs.push(valeur.expression);
      if (text.charAt(valeur.fermant + 1) === ',') { index = valeur.apres; continue; }
      if (mot(valeur.apres) === ',' || mot(valeur.apres) === 'et') { index = valeur.apres + 1; continue; }
      index = valeur.apres;
      break;
    }
    if (!termine(index)) return refus();
    return reconnu({ kind: 'PY_LISTE_VALEURS', parameters: { name, valeurs } });
  }

  // ---- Crée une chaîne nommée n avec le texte "…" ------------------------
  if (mot(0) === 'crée' && mot(1) === 'une' && mot(2) === 'chaîne') {
    if (!attendre(3, 'nommée')) return refus();
    const name = nom(4, 'Il manque le nom de la chaîne.');
    if (name === undefined || !attendreSuite(5, ['avec', 'le', 'texte'])) return refus();
    const lu = texte(8, 'Il manque le texte de la chaîne.');
    if (!lu || !termine(lu.apres)) return refus();
    return reconnu({ kind: 'PY_INIT_STR', parameters: { name, texte: lu.valeur } });
  }

  // ---- Crée un booléen nommé n de valeur vrai | faux ---------------------
  if (mot(0) === 'crée' && mot(1) === 'un' && mot(2) === 'booléen') {
    if (!attendre(3, 'nommé')) return refus();
    const name = nom(4, 'Il manque le nom du booléen.');
    if (name === undefined || !attendreSuite(5, ['de', 'valeur'])) return refus();
    const litteral = mot(7);
    if (litteral !== 'vrai' && litteral !== 'faux') {
      const token = tokens[7];
      if (!token) echec('MISSING_BOOLEAN', 'Il manque la valeur : « vrai » ou « faux ».', finDeTexte());
      else echec('UNSUPPORTED_BOOLEAN',
        'Un booléen vaut « vrai » ou « faux ». Aucune autre valeur n’est acceptée, et aucune n’est déduite.',
        token.range);
      return refus();
    }
    if (!termine(8)) return refus();
    return reconnu({ kind: 'PY_INIT_BOOL', parameters: { name, valeur: litteral === 'vrai' } });
  }

  // ---- Crée le point d’entrée principal ---------------------------------
  if (mot(0) === 'crée' && mot(1) === 'le' && mot(2) === 'point') {
    if (!attendreSuite(3, ['d’entrée', 'principal']) || !termine(5)) return refus();
    return reconnu({ kind: 'PY_SI_PRINCIPAL', parameters: {} });
  }

  // ---- Crée une boucle pour chaque x de collection -----------------------
  if (mot(0) === 'crée' && mot(1) === 'une' && mot(2) === 'boucle' && mot(3) === 'pour' && mot(4) === 'chaque') {
    const name = nom(5, 'Il manque le nom de la variable de parcours.');
    if (name === undefined || !attendre(6, 'de')) return refus();
    const collection = nom(7, 'Il manque le nom de la collection à parcourir.');
    if (collection === undefined || !termine(8)) return refus();
    return reconnu({ kind: 'PY_POUR_CHAQUE', parameters: { name, collection } });
  }

  // ---- Ajoute "v" à la fin de nom ---------------------------------------
  if (mot(0) === 'ajoute') {
    const valeur = expression(1, 'Il manque la valeur à ajouter.', { count: 0 });
    if (!valeur) return refus();
    if (!attendreSuite(valeur.apres, ['à', 'la', 'fin', 'de'])) return refus();
    const name = nom(valeur.apres + 4, 'Il manque le nom de la liste.');
    if (name === undefined || !termine(valeur.apres + 5)) return refus();
    return reconnu({ kind: 'PY_AJOUTER', parameters: { name, valeur: valeur.expression } });
  }

  // ---- Lis une saisie dans nom ------------------------------------------
  if (mot(0) === 'lis' && mot(1) === 'une' && mot(2) === 'saisie') {
    if (!attendre(3, 'dans')) return refus();
    const name = nom(4, 'Il manque le nom qui recevra la saisie.');
    if (name === undefined || !termine(5)) return refus();
    return reconnu({ kind: 'PY_INPUT', parameters: { name } });
  }

  // ---- Affecte à nom … ---------------------------------------------------
  if (mot(0) === 'affecte' && mot(1) === 'à') {
    const name = nom(2, 'Il manque le nom qui reçoit la valeur.');
    if (name === undefined) return refus();
    // Les six queues de phrase, chacune sur ses mots fixes. Aucun synonyme.
    if (mot(3) === 'le' && mot(4) === 'nombre') {
      if (!attendreSuite(5, ['d’éléments', 'de'])) return refus();
      const source = nom(7, 'Il manque le nom de la collection.');
      if (source === undefined || !termine(8)) return refus();
      return reconnu({ kind: 'PY_LONGUEUR', parameters: { name, source } });
    }
    if (mot(3) === 'le' && (mot(4) === 'quotient' || mot(4) === 'reste')) {
      const genre = mot(4);
      const qualite = mot(5);
      const attendus = genre === 'quotient' ? ['entier', 'réel'] : ['entier'];
      if (!attendus.includes(qualite)) {
        const token = tokens[5];
        if (!token) {
          echec('INCOMPLETE_INSTRUCTION',
            genre === 'quotient'
              ? 'Instruction incomplète : « entier » ou « réel » attendu. Les deux quotients de Python ne '
                + 'donnent pas le même résultat, et C-A ne choisit pas.'
              : 'Instruction incomplète : « entier » attendu.',
            finDeTexte());
        } else {
          echec('UNKNOWN_FORMULATION', INCONNUE, token.range);
        }
        return refus();
      }
      if (!attendre(6, 'de')) return refus();
      const budget = { count: 0 };
      const gauche = expression(7, 'Il manque le dividende.', budget);
      if (!gauche || !attendre(gauche.apres, 'par')) return refus();
      const droite = expression(gauche.apres + 1, 'Il manque le diviseur.', budget);
      if (!droite || !termine(droite.apres)) return refus();
      const parameters = { name, gauche: gauche.expression, droite: droite.expression };
      if (genre === 'reste') return reconnu({ kind: 'PY_MODULO', parameters });
      return reconnu({ kind: qualite === 'entier' ? 'PY_DIV_ENTIERE' : 'PY_DIV_REELLE', parameters });
    }
    if (mot(3) === 'l’entier' || mot(3) === 'le' || mot(3) === 'la') {
      const CONVERSIONS: Readonly<Record<string, ConversionPython>> = {
        'l’entier': 'int', 'le réel': 'float', 'le texte': 'str',
      };
      const cle = mot(3) === 'l’entier' ? 'l’entier' : `${mot(3)} ${mot(4)}`;
      const conversion = CONVERSIONS[cle];
      if (conversion !== undefined) {
        const base = mot(3) === 'l’entier' ? 4 : 5;
        if (!attendreSuite(base, ['obtenu', 'de'])) return refus();
        const source = nom(base + 2, 'Il manque le nom à convertir.');
        if (source === undefined || !termine(base + 3)) return refus();
        return reconnu({ kind: 'PY_CONVERSION', parameters: { name, conversion, source } });
      }
    }
    // « Affecte à … » appartient aussi au catalogue partagé : si la queue
    // n'est aucune des nôtres, on DÉCLINE, pour que le diagnostic du
    // catalogue partagé reste celui que l'utilisateur lit.
    return undefined;
  }

  // ---- Crée une boucle pour i de "a" jusqu’avant "b" ---------------------
  // Placé en dernier : « Crée une boucle pour » appartient au catalogue
  // partagé, et seule la présence de « jusqu’avant » nous désigne.
  return undefined;
}

/** `Crée une boucle pour i de "0" jusqu’avant "10".`
 *
 * Analysée à part, parce que son amorce est celle du `for` à trois clauses du
 * catalogue partagé : seul le mot « jusqu’avant » distingue les deux, et il
 * arrive trop tard pour servir d'amorce.
 */
export function analyserBouclePython(text: string): AnalysePython | undefined {
  const decoupe = decouper(text);
  if ('code' in decoupe) return undefined;
  const { tokens, end } = decoupe;
  const mot = (index: number): string => minuscule(tokens[index]?.text ?? '');
  if (!['crée', 'une', 'boucle', 'pour'].every((attendu, i) => mot(i) === attendu)) return undefined;
  if (!tokens.some(token => meme('jusqu’avant', token.text))) return undefined;

  let diagnostic: DiagnosticPy | undefined;
  const echec = (code: string, message: string, range: SourceRange): undefined => {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  };
  const refus = (): AnalysePython => ({ status: 'refuse',
    diagnostic: diagnostic ?? { code: 'UNKNOWN_FORMULATION', category: 'understanding', severity: 'error',
      message: INCONNUE, range: tokens[0]!.range } });

  const nomToken = tokens[4];
  if (!nomToken) return refus();
  if (MOTS_RESERVES_PYTHON.has(nomToken.text)) {
    echec('PYTHON_KEYWORD_IDENTIFIER',
      `« ${nomToken.text} » est un mot réservé de Python et ne peut pas nommer une variable.`, nomToken.range);
    return refus();
  }
  if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(nomToken.text)) {
    echec('INVALID_IDENTIFIER',
      'Le nom doit commencer par une lettre ASCII et contenir uniquement lettres ASCII, chiffres ou soulignements.',
      nomToken.range);
    return refus();
  }
  if (!meme('de', tokens[5]?.text ?? '')) {
    echec('UNKNOWN_FORMULATION', INCONNUE, tokens[5]?.range ?? { start: end, end });
    return refus();
  }
  const budget = { count: 0 };
  const lire = (index: number, manquant: string): { expression: NumericExpression; apres: number } | undefined => {
    const token = tokens[index];
    if (!token) return echec('MISSING_EXPRESSION', manquant, { start: end, end });
    if (!token.text.startsWith('"')) {
      return echec('MISSING_EXPRESSION_DELIMITER', 'L’expression doit être entourée de guillemets ASCII.',
        { start: token.range.start, end: token.range.start });
    }
    const fermant = text.indexOf('"', token.range.start + 1);
    if (fermant === -1 || fermant >= end) {
      return echec('UNTERMINATED_EXPRESSION', 'Il manque le guillemet fermant de l’expression.',
        { start: token.range.start, end });
    }
    const analyse = parseNumericExpression(text, token.range.start + 1, fermant, () => undefined, manquant, budget);
    if (analyse.status === 'rejected') { diagnostic ??= { ...analyse.diagnostic }; return undefined; }
    const apres = tokens.findIndex(candidat => candidat.range.start > fermant);
    return { expression: analyse.expression, apres: apres === -1 ? tokens.length : apres };
  };
  const debut = lire(6, 'Il manque la valeur de départ.');
  if (!debut) return refus();
  if (!meme('jusqu’avant', tokens[debut.apres]?.text ?? '')) {
    echec('UNKNOWN_FORMULATION', INCONNUE, tokens[debut.apres]?.range ?? { start: end, end });
    return refus();
  }
  const fin = lire(debut.apres + 1, 'Il manque la borne de la boucle.');
  if (!fin) return refus();
  const extra = tokens[fin.apres];
  if (extra) {
    echec('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return refus();
  }
  return { status: 'reconnu',
    instruction: { kind: 'PY_POUR_INTERVALLE',
      parameters: { name: nomToken.text, debut: debut.expression, fin: fin.expression } } };
}

/** Une phrase d'exemple par intention native, et c'est le catalogue publié.
 *
 * Elles ne sont pas là pour la décoration : `docs/CATALOGUE_PYTHON.md` est
 * engendré à partir d'elles, et un test vérifie que chaque intention rendue en
 * a une et que chaque exemple est reconnu. Un catalogue rédigé à la main se
 * périme en silence — ce projet l'a déjà payé une fois.
 */
export const EXEMPLES_NATIFS: readonly string[] = [
  'Crée une liste vide nommée notes.',
  'Crée une liste nommée notes avec les valeurs "12", "15" et "9".',
  'Ajoute "18" à la fin de notes.',
  'Affecte à nombre le nombre d’éléments de notes.',
  'Crée une boucle pour i de "0" jusqu’avant "10".',
  'Crée une boucle pour chaque note de notes.',
  'Affecte à q le quotient entier de "total" par "nombre".',
  'Affecte à q le quotient réel de "total" par "nombre".',
  'Affecte à r le reste entier de "total" par "nombre".',
  'Crée une chaîne nommée nom avec le texte "Ada".',
  'Crée un booléen nommé actif de valeur vrai.',
  'Affecte à n l’entier obtenu de texte.',
  'Affecte à x le réel obtenu de texte.',
  'Affecte à s le texte obtenu de n.',
  'Lis une saisie dans reponse.',
  'Crée le point d’entrée principal.',
];

/** L'entrée unique du catalogue Python : les deux analyseurs, dans l'ordre. */
export function analyserCataloguePython(text: string): AnalysePython | undefined {
  return analyserBouclePython(text) ?? analyserPython(text);
}
