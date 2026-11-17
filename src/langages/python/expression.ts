/** Rendu Python d'une expression déjà analysée.
 *
 * Lot P3. Ce module ne lit pas de français et n'analyse rien : il reçoit un
 * arbre produit par les trois profils publiés (`expression.ts`,
 * `numericExpression.ts`, `condition.ts`) et l'écrit en Python, ou **refuse**
 * en nommant la construction.
 *
 * Deux principes, et ils sont tous les deux pédagogiques :
 *
 *  1. **Le parenthésage est conservé.** Comme en C depuis le lot 6, chaque
 *     opérateur binaire reçoit ses parenthèses : la priorité que l'étudiant
 *     lit est la priorité qui s'applique. Python a ses propres priorités, et
 *     s'y fier produirait un texte où `a + b * c` se lit autrement que ce que
 *     l'étudiant a écrit.
 *  2. **Un opérateur dont le SENS change est refusé, pas traduit.** C'est le
 *     cœur du lot : `/` et `%` existent dans les deux langages et n'y font pas
 *     la même chose. Les écrire tels quels produirait, à partir de la même
 *     phrase française, deux programmes différents sans un mot.
 */
import type { Expression } from '../../expression.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import type { Condition } from '../../condition.ts';

export type RenduExpression =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

/** Les trois profils réunis. Le rendu n'a pas besoin de savoir duquel vient
 * l'arbre : il traite les genres de nœuds, et refuse ceux qu'il ne porte pas. */
type Noeud = Expression | NumericExpression | Condition;

/** Les mots réservés de Python 3.12. C-A valide les noms contre les mots-clés
 * de C17 : `lambda`, `None` ou `pass` sont donc des identifiants valides pour
 * le moteur, et du Python invalide. Le langage cible doit les refuser, et
 * c'est à lui de le faire — le moteur n'a pas à connaître Python. */
export const MOTS_RESERVES_PYTHON: ReadonlySet<string> = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  // `match` et `case` sont des mots-clés « doux » : légaux comme noms, mais
  // les refuser évite d'enseigner un nom qui piège.
  'match', 'case',
]);

export function nomPythonValide(nom: string): string | undefined {
  if (MOTS_RESERVES_PYTHON.has(nom)) {
    return 'En Python, « ' + nom + ' » est un mot réservé du langage : il ne peut pas nommer une variable, '
      + 'une fonction ni un paramètre. En C17 il est permis, et C-A l’a donc accepté dans la phrase.';
  }
  return undefined;
}

const DIVISION = 'L’opérateur « / » ne fait pas la même chose dans les deux langages : en C17, 7 / 2 vaut 3, '
  + 'et en Python 3.5. Traduire « / » tel quel changerait le sens du programme sans un mot. La compétence '
  + 'se nommera par deux phrases distinctes, le quotient entier et le quotient réel, quand la décision D3 '
  + 'sera tranchée.';

const MODULO = 'L’opérateur « % » ne fait pas la même chose dans les deux langages sur un opérande négatif : '
  + 'en C17, -7 % 2 vaut -1, et en Python 1. La différence est silencieuse, exactement comme celle de « / », '
  + 'et elle demande la même décision de périmètre (D13, ouverte par le lot P3).';

const POINTEUR = 'Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. '
  + 'La compétence visée — deux noms qui désignent le même objet — s’enseignera par l’aliasing d’une liste, '
  + 'avec ses propres phrases.';

const MEMBRE = 'L’accès à un champ attend la décision D6 : Python n’a pas de structure, et le regroupement '
  + 'de données nommées s’enseigne d’abord par un dictionnaire, puis par une classe.';

const TYPES_PYTHON: Partial<Record<string, string>> = { int: 'int', float: 'float', double: 'float', char: 'str' };

export function rendreExpressionPython(noeud: Noeud): RenduExpression {
  const rendu = (code: string): RenduExpression => ({ status: 'rendu', code });
  const refus = (raison: string): RenduExpression => ({ status: 'refus', raison });
  /** Rend un sous-arbre, en propageant le premier refus rencontré. */
  const sous = (enfant: Noeud, suite: (code: string) => RenduExpression): RenduExpression => {
    const resultat = rendreExpressionPython(enfant);
    return resultat.status === 'refus' ? resultat : suite(resultat.code);
  };

  switch (noeud.kind) {
    // Les deux représentations de littéraux coexistent, décision validée : le
    // profil entier dit `integer`, les deux autres `literal`.
    case 'integer': return rendu(noeud.value);
    case 'literal': return rendu(noeud.value);
    case 'name': {
      const probleme = nomPythonValide(noeud.name);
      return probleme === undefined ? rendu(noeud.name) : refus(probleme);
    }
    // Décision D8 validée : un littéral caractère est une chaîne de longueur 1
    // en Python, et l'orthographe de l'étudiant est conservée telle quelle.
    // `'A'` et `'\0'` sont du Python valide.
    case 'character': return rendu(noeud.value);
    case 'address': case 'dereference': case 'pointer-sum': return refus(POINTEUR);
    case 'member': return refus(MEMBRE);
    case 'index': return sous(noeud.index, indice => rendu(`${noeud.array.name}[${indice}]`));
    case 'negation': return sous(noeud.operand, operande => rendu(`(-${operande})`));
    case 'cast': {
      const cible = TYPES_PYTHON[noeud.type];
      if (noeud.type === 'unsigned int') {
        return refus('Python n’a pas d’entier non signé : ses entiers sont de précision arbitraire et signés. '
          + 'Une conversion vers « unsigned int » n’a donc aucun équivalent, et l’écrire en « int » perdrait '
          + 'exactement ce que l’étudiant a demandé.');
      }
      if (cible === undefined) return refus('Type de conversion non porté en Python : ' + noeud.type + '.');
      return sous(noeud.operand, operande => rendu(`${cible}(${operande})`));
    }
    case 'binary': {
      if (noeud.operator === '/') return refus(DIVISION);
      if (noeud.operator === '%') return refus(MODULO);
      return sous(noeud.left, gauche => sous(noeud.right, droite =>
        rendu(`(${gauche} ${noeud.operator} ${droite})`)));
    }
    // Une expression numérique employée comme condition. En Python comme en C,
    // zéro est faux : le texte est donc le même, et aucune comparaison n'est
    // ajoutée. L'information passive dit que la règle diffère pour une liste.
    case 'numeric-test': return rendreExpressionPython(noeud.expression);
    case 'comparison': return sous(noeud.left, gauche => sous(noeud.right, droite =>
      rendu(`${gauche} ${noeud.operator} ${droite}`)));
    case 'logical-not': return sous(noeud.operand, operande =>
      rendu(`(not ${operande})`));
    case 'logical-binary': {
      const mot = noeud.operator === '&&' ? 'and' : 'or';
      const operande = (enfant: Condition, code: string): string =>
        (enfant.kind === 'comparison' ? `(${code})` : code);
      return sous(noeud.left, gauche => sous(noeud.right, droite =>
        rendu(`(${operande(noeud.left, gauche)} ${mot} ${operande(noeud.right, droite)})`)));
    }
  }
}
