/** Rendu Java d'une expression déjà analysée.
 *
 * Lot J1. Ce module ne lit pas de français et n'analyse rien : il reçoit un
 * arbre produit par les trois profils publiés (`expression.ts`,
 * `numericExpression.ts`, `condition.ts`) et l'écrit en Java, ou **refuse** en
 * nommant la construction.
 *
 * Il aurait été tentant d'appeler directement les rendus C17 : la syntaxe des
 * opérateurs portés y est **identique**. Deux raisons de ne pas le faire, et
 * la seconde est la vraie :
 *
 *  1. le rendu C17 écrit `&x`, `*p` et `o->champ`, qui ne sont **pas** du Java
 *    valide. Un rendu partagé produirait du code faux sans un mot ;
 *  2. une syntaxe identique aujourd'hui n'est pas une syntaxe identique par
 *    construction. Partager le rendu lierait les deux langages pour une
 *    coïncidence, et c'est exactement ce que la décision 2 du socle écarte
 *    pour le placement.
 *
 * **La bonne nouvelle, elle, est mesurée** : `/` tronque vers zéro et le signe
 * de `%` suit le dividende, comme en C17. Vérifié par exécution — `7 / 2`
 * donne 3 et `-7 % 2` donne -1. Les deux refus que Python a dû poser n'ont
 * donc **aucun** équivalent ici, et le parenthésage du lot 6 est conservé tel
 * quel : la priorité que l'étudiant lit est celle qui s'applique.
 */
import type { Expression } from '../../expression.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import type { Condition } from '../../condition.ts';

export type RenduExpression =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

type Noeud = Expression | NumericExpression | Condition;

/** Les mots réservés de Java 21, plus les trois littéraux `true`, `false` et
 * `null`, qui ne sont pas des mots-clés mais ne peuvent pas davantage nommer
 * une variable. C-A valide les noms contre les mots-clés de **C17** : `class`,
 * `new` ou `final` sont donc des identifiants valides pour le moteur, et du
 * Java invalide. C'est au langage cible de les refuser. */
export const MOTS_RESERVES_JAVA: ReadonlySet<string> = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while', '_',
  // Littéraux : pas des mots-clés, mais interdits comme identifiants.
  'true', 'false', 'null',
]);

export function nomJavaValide(nom: string): string | undefined {
  if (MOTS_RESERVES_JAVA.has(nom)) {
    return 'En Java, « ' + nom + ' » est un mot réservé du langage : il ne peut nommer ni une variable, '
      + 'ni un champ, ni une méthode, ni un paramètre. En C17 il est permis, et C-A l’a donc accepté '
      + 'dans la phrase — c’est le langage cible qui le refuse, pas l’analyse du français.';
  }
  return undefined;
}

const POINTEUR = 'Java n’a pas de pointeur : ni adresse à prendre, ni déréférencement à écrire, ni '
  + 'arithmétique de pointeurs. Un objet **est** déjà une référence, et c’est par là que la compétence '
  + 's’enseigne — deux noms qui désignent le même objet.';

const FLECHE = 'La flèche « -> » n’existe pas en Java, faute de pointeurs : l’accès à un champ s’écrit '
  + 'toujours avec un point, que l’on parte d’un objet ou d’une variable. Écrivez l’accès avec « . ».';

const TYPES_JAVA: Partial<Record<string, string>> = {
  int: 'int', float: 'float', double: 'double', char: 'char',
};

const NON_SIGNE = 'Java n’a aucun entier non signé : tous ses types entiers sont signés. Convertir vers '
  + '« unsigned int » n’a donc pas d’équivalent, et l’écrire en « int » perdrait exactement l’information '
  + 'que vous avez donnée.';

export function rendreExpressionJava(noeud: Noeud): RenduExpression {
  const rendu = (code: string): RenduExpression => ({ status: 'rendu', code });
  const refus = (raison: string): RenduExpression => ({ status: 'refus', raison });
  const sous = (enfant: Noeud, suite: (code: string) => RenduExpression): RenduExpression => {
    const resultat = rendreExpressionJava(enfant);
    return resultat.status === 'refus' ? resultat : suite(resultat.code);
  };

  switch (noeud.kind) {
    // Les deux représentations de littéraux coexistent : le profil entier dit
    // `integer`, les deux autres `literal`.
    case 'integer': return rendu(noeud.value);
    case 'literal': return rendu(noeud.value);
    case 'name': {
      const probleme = nomJavaValide(noeud.name);
      return probleme === undefined ? rendu(noeud.name) : refus(probleme);
    }
    // `'A'` et `'\0'` sont du Java valide, et `char` y existe. L'orthographe
    // de l'étudiant est conservée telle quelle.
    case 'character': return rendu(noeud.value);
    case 'address': case 'dereference': case 'pointer-sum': return refus(POINTEUR);
    case 'member': {
      if (noeud.arrow) return refus(FLECHE);
      return sous(noeud.object, objet => rendu(`${objet}.${noeud.member}`));
    }
    case 'index': return sous(noeud.index, indice => {
      const probleme = nomJavaValide(noeud.array.name);
      return probleme === undefined ? rendu(`${noeud.array.name}[${indice}]`) : refus(probleme);
    });
    case 'negation': return sous(noeud.operand, operande => rendu(`(-${operande})`));
    case 'cast': {
      if (noeud.type === 'unsigned int') return refus(NON_SIGNE);
      const cible = TYPES_JAVA[noeud.type];
      if (cible === undefined) return refus('Type de conversion non porté en Java : ' + noeud.type + '.');
      return sous(noeud.operand, operande => rendu(`(${cible}) ${operande}`));
    }
    // `/` et `%` se reportent SANS adaptation : même troncature, même signe de
    // reste qu'en C17. C'est la seule famille d'opérateurs où Java coûte moins
    // que Python, et il faut le dire plutôt que de le taire.
    case 'binary': return sous(noeud.left, gauche => sous(noeud.right, droite =>
      rendu(`(${gauche} ${noeud.operator} ${droite})`)));
    // Une expression numérique employée comme condition. En Java, un entier
    // n'est PAS une condition : `if (n)` ne compile pas. L'écrire tel quel
    // produirait du code faux, et le comparer à zéro de notre propre chef
    // ajouterait une comparaison que personne n'a demandée — règle 3.
    case 'numeric-test': return refus('En Java, un nombre n’est pas une condition : « si "n" » ne compile '
      + 'pas, là où C17 l’accepte en lisant zéro comme faux. Écrivez la comparaison que vous voulez — '
      + 'par exemple « n != 0 » —, car l’ajouter à votre place serait choisir un sens que vous n’avez pas '
      + 'donné.');
    case 'comparison': return sous(noeud.left, gauche => sous(noeud.right, droite =>
      rendu(`${gauche} ${noeud.operator} ${droite}`)));
    case 'logical-not': return sous(noeud.operand, operande => rendu(`(!${operande})`));
    case 'logical-binary': return sous(noeud.left, gauche => sous(noeud.right, droite =>
      rendu(`(${gauche} ${noeud.operator} ${droite})`)));
  }
}
