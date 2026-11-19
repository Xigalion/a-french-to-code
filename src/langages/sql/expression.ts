/** Le profil d'expressions **SQL**, et le rendu des conditions en SQL.
 *
 * Lot S3. Deux choses, et elles sont séparées :
 *
 *   1. `SQL_CAPABILITIES` : le profil, qui ouvre `simpleEquality` — en SQL,
 *      `=` **est** l'égalité, et `<>` l'inégalité. C'est la seule capacité qui
 *      change par rapport au profil condition, et les quatre profils publiés
 *      la gardent fermée ;
 *   2. le **rendu**, qui écrit `=`, `<>`, `AND`, `OR`, `NOT` là où C17 écrit
 *      `==`, `!=`, `&&`, `||`, `!`. Python l'avait déjà fait pour `and` et
 *      `or` : le précédent existe, et il tient.
 *
 * Ce module ne partage pas le rendu du C17, délibérément : celui-ci écrit
 * `&x`, `*p` et `o->champ`, qui n'ont aucun sens en SQL.
 */
import { parseCore, asCondition } from '../../expressionCore.ts';
import type { ExpressionCapabilities } from '../../expressionCore.ts';
import type { Condition } from '../../condition.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import type { Diagnostic } from '../../translate.ts';

/** Le profil SQL : le profil condition, **plus** `simpleEquality`, et moins
 * tout ce que SQL n'a pas. Les capacités sont listées en entier plutôt que
 * dérivées, pour que l'écart avec le profil condition soit lisible d'un coup.
 */
export const SQL_CAPABILITIES: ExpressionCapabilities = {
  literals: 'numeric',
  literalKind: 'literal',
  // L'indexation, les caractères, l'adresse, le déréférencement et le
  // décalage de pointeur n'existent pas en SQL. Les fermer n'est pas une
  // restriction : c'est l'absence de la notion.
  indexing: false,
  characters: false,
  addressOf: false,
  dereference: false,
  pointerOffset: false,
  // `.` est le séparateur de qualification : `eleves.id` désigne une colonne
  // d'une table. L'arbre `member` du noyau le porte exactement, et le rendu
  // SQL écrit le point. C'est la seule capacité du C qui se transpose sans
  // changer de sens.
  members: true,
  // Les transtypages du C (`(int) x`) ne sont pas ceux de SQL
  // (`CAST(x AS integer)`), et les confondre apprendrait une syntaxe fausse.
  casts: false,
  castTypes: [],
  logic: true,
  simpleEquality: true,
  invalidTokenMessage: 'Cet élément n’appartient pas à une expression SQL prise en charge.',
  invariantMessage: 'Invariant interne : expression SQL analysée absente.',
};

export type ConditionSqlResult =
  | { status: 'parsed'; condition: Condition }
  | { status: 'rejected'; diagnostic: Diagnostic | DiagnosticNomSql };

/** `==` et `!=` : refusés, et c'est une décision, pas un oubli.
 *
 * Le noyau les accepte — ils sont dans sa grammaire historique — et le rendu
 * SQL écrirait `=` et `<>`. Ce serait une **correction silencieuse** d'une
 * syntaxe qui n'existe pas en SQL standard, et la règle 5 l'interdit :
 * diagnostic, pas correction. Trouvé en exerçant le profil, pas par un test.
 *
 * `!=` est d'ailleurs accepté par PostgreSQL mais **absent du standard** : le
 * refuser est aussi l'application de la décision S6.
 */
export function verifierOperateursSql(source: string, start: number, end: number): DiagnosticNomSql | undefined {
  const texte = source.slice(start, end);
  for (const [motif, mot, remplacant] of [[/==/u, '==', '='], [/!=/u, '!=', '<>']] as const) {
    const trouve = motif.exec(texte);
    if (trouve === null) continue;
    return { code: 'SQL_OPERATEUR_DU_C', category: 'understanding', severity: 'error',
      message: `« ${mot} » n’existe pas en SQL : c’est l’opérateur du C, de Python et de Java. `
        + `Écrivez « ${remplacant} ». SQL-A ne le remplace pas à votre place : il vous le dit, `
        + 'parce qu’une correction silencieuse vous laisserait croire que les deux syntaxes '
        + 'existent.',
      range: { start: start + trouve.index, end: start + trouve.index + mot.length } };
  }
  return undefined;
}

/** Les mots que SQL se réserve et qui ne peuvent donc pas nommer une table,
 * une colonne ni une contrainte sans guillemets — et SQL-A n'en met jamais,
 * par décision S6/§3.1. La liste est celle des mots réservés **du standard**
 * que le catalogue peut rencontrer ; elle n'est pas exhaustive du SQL entier,
 * et un test le dit plutôt qu'un commentaire optimiste.
 */
export const MOTS_RESERVES_SQL: ReadonlySet<string> = new Set([
  'all', 'alter', 'and', 'any', 'as', 'asc', 'between', 'by', 'case', 'cast',
  'check', 'column', 'commit', 'constraint', 'create', 'cross', 'current_date',
  'current_timestamp', 'default', 'delete', 'desc', 'distinct', 'domain',
  'drop', 'else', 'end', 'except', 'exists', 'fetch', 'first', 'for',
  'foreign', 'from', 'full', 'grant', 'group', 'having', 'in', 'index',
  'inner', 'insert', 'intersect', 'into', 'is', 'join', 'key', 'left', 'like',
  'not', 'null', 'offset', 'on', 'only', 'or', 'order', 'outer', 'primary',
  'references', 'revoke', 'right', 'rollback', 'rows', 'savepoint', 'schema',
  'select', 'set', 'start', 'table', 'then', 'to', 'transaction', 'union',
  'unique', 'update', 'values', 'view', 'when', 'where', 'with',
]);

export function nomSqlValide(nom: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]*$/u.test(nom) && !MOTS_RESERVES_SQL.has(nom.toLowerCase());
}

export type DiagnosticNomSql = { code: string; category: 'understanding'; severity: 'error';
  message: string; range: { start: number; end: number } };

/** `NULL` dans une comparaison, et les noms malformés.
 *
 * La vérification est faite **après** l'analyse, en parcourant l'arbre, et non
 * par le validateur de noms du noyau : celui-ci renvoie un `Diagnostic` dont
 * le code appartient à une union **fermée**, et y ajouter deux codes SQL
 * aurait élargi un type partagé par les quatre langages. Parcourir l'arbre
 * coûte un passage et ne touche rien.
 */
export function verifierNomsSql(noeud: NumericExpression | Condition): DiagnosticNomSql | undefined {
  const pile: (NumericExpression | Condition)[] = [noeud];
  while (pile.length > 0) {
    const courant = pile.pop();
    if (courant === undefined) continue;
    switch (courant.kind) {
      case 'name': {
        if (courant.name.toLowerCase() === 'null') {
          return { code: 'SQL_NULL_DANS_COMPARAISON', category: 'understanding', severity: 'error',
            message: 'En SQL, « = NULL » n’est jamais vrai, même quand la colonne est nulle : NULL '
              + 'est une absence, pas une valeur. Le serveur accepterait cette condition et elle ne '
              + 'renverrait aucune ligne — ni erreur, ni résultat. Employez la phrase dédiée, '
              + '« … où {colonne} est nulle. », qui écrit « IS NULL ».',
            range: courant.range };
        }
        if (!/^[A-Za-z][A-Za-z0-9_]*$/u.test(courant.name)) {
          return { code: 'SQL_NOM_INVALIDE', category: 'understanding', severity: 'error',
            message: `« ${courant.name} » n’est pas un nom de colonne valide : une lettre, puis `
              + 'des lettres, des chiffres ou des soulignés.',
            range: courant.range };
        }
        break;
      }
      case 'member': pile.push(courant.object); break;
      case 'negation': case 'cast': pile.push(courant.operand); break;
      case 'binary': pile.push(courant.left, courant.right); break;
      case 'index': pile.push(courant.array, courant.index); break;
      case 'numeric-test': pile.push(courant.expression); break;
      case 'comparison': pile.push(courant.left, courant.right); break;
      case 'logical-not': pile.push(courant.operand); break;
      case 'logical-binary': pile.push(courant.left, courant.right); break;
      default: break;
    }
  }
  return undefined;
}

/** Analyse une condition SQL — un prédicat de `WHERE`, `HAVING`, `ON` ou
 * `CHECK`. Même noyau, même budget, mêmes intervalles que les trois autres
 * langages : seules les capacités et le rendu diffèrent. */
export function analyserConditionSql(source: string, start: number, end: number,
  messageManquant = 'Il manque la condition.', budget: { count: number } = { count: 0 }): ConditionSqlResult {
  const operateur = verifierOperateursSql(source, start, end);
  if (operateur !== undefined) return { status: 'rejected', diagnostic: operateur };
  const resultat = parseCore(source, start, end, () => undefined, SQL_CAPABILITIES, messageManquant, budget);
  if (resultat.status === 'rejected') return resultat;
  return { status: 'parsed', condition: asCondition(resultat.node) as unknown as Condition };
}

export type ExpressionSqlResult =
  | { status: 'parsed'; expression: NumericExpression }
  | { status: 'rejected'; diagnostic: Diagnostic | DiagnosticNomSql };

/** Une expression **numérique** SQL : la même grammaire, sans la logique.
 * Employée par `SET colonne = …` et par la projection calculée.
 *
 * Le nœud est renvoyé **déballé**. `asCondition` enveloppe un nœud sans
 * logique dans un `numeric-test`, et c'est juste pour une condition — mais
 * une expression de projection n'est pas une condition. Caster l'enveloppe en
 * expression produisait un refus « cette construction n'a pas de rendu SQL »,
 * trouvé en confrontant le moteur à la spécification approuvée. */
export function analyserExpressionSql(source: string, start: number, end: number,
  messageManquant = 'Il manque l’expression.', budget: { count: number } = { count: 0 }): ExpressionSqlResult {
  const sansLogique: ExpressionCapabilities = { ...SQL_CAPABILITIES, logic: false, simpleEquality: false };
  const resultat = parseCore(source, start, end, () => undefined, sansLogique, messageManquant, budget);
  if (resultat.status === 'rejected') return resultat;
  return { status: 'parsed', expression: resultat.node as unknown as NumericExpression };
}

export type RenduSql = { status: 'rendu'; code: string } | { status: 'refus'; raison: string };

const refus = (raison: string): RenduSql => ({ status: 'refus', raison });
const rendu = (code: string): RenduSql => ({ status: 'rendu', code });

/** `==` → `=`, `!=` → `<>`. Le noyau a produit le jeton canonique ; c'est ici
 * que le SQL s'écrit. */
const COMPARAISONS: Readonly<Record<string, string>> = {
  '==': '=', '!=': '<>', '<': '<', '>': '>', '<=': '<=', '>=': '>=',
};

export function rendreExpressionSql(noeud: NumericExpression): RenduSql {
  const sous = (enfant: NumericExpression, suite: (code: string) => RenduSql): RenduSql => {
    const resultat = rendreExpressionSql(enfant);
    return resultat.status === 'refus' ? resultat : suite(resultat.code);
  };
  switch (noeud.kind) {
    case 'literal': return rendu(noeud.value);
    case 'name': return rendu(noeud.name);
    case 'member': {
      if (noeud.arrow) {
        return refus('La flèche « -> » n’existe pas en SQL. Une colonne d’une table se qualifie '
          + 'avec un point : « eleves.id ».');
      }
      return sous(noeud.object, objet => rendu(objet + '.' + noeud.member));
    }
    case 'negation': return sous(noeud.operand, operande => rendu('(-' + operande + ')'));
    case 'binary': return sous(noeud.left, gauche => sous(noeud.right, droite =>
      rendu(`(${gauche} ${noeud.operator} ${droite})`)));
    case 'cast':
      return refus('Le transtypage du C, « (integer) x », n’existe pas en SQL. La forme standard '
        + 'est « CAST(x AS integer) », et aucune phrase du catalogue ne l’écrit encore.');
    case 'index':
      return refus('L’indexation « t[i] » n’existe pas en SQL : on ne désigne pas une ligne par '
        + 'son rang. Une ligne se désigne par une condition, et c’est tout l’objet du WHERE.');
    case 'character':
      return refus('Une constante caractère « \'A\' » du C n’existe pas en SQL : les apostrophes '
        + 'y délimitent une CHAÎNE. Employez la phrase dédiée au texte.');
    case 'address': case 'dereference': case 'pointer-sum':
      return refus('Il n’y a ni adresse ni pointeur en SQL : la mémoire appartient au serveur. '
        + 'Ce qui s’en rapproche le plus — désigner une ligne précise — se fait par une CLÉ, '
        + 'qui est une donnée.');
    default:
      return refus('Cette construction n’a pas de rendu SQL.');
  }
}

export function rendreConditionSql(condition: Condition): RenduSql {
  switch (condition.kind) {
    case 'numeric-test':
      return refus('En SQL, une valeur n’est pas une condition : « WHERE age » ne compile pas, là '
        + 'où C17 l’accepte en lisant zéro comme faux. Écrivez la comparaison que vous voulez — '
        + 'par exemple « age <> 0 » —, car l’ajouter à votre place serait choisir un sens que '
        + 'vous n’avez pas donné.');
    case 'comparison': {
      const operateur = COMPARAISONS[condition.operator];
      if (operateur === undefined) return refus('Comparaison sans rendu SQL.');
      const gauche = rendreValeurSql(condition.left);
      if (gauche.status === 'refus') return gauche;
      const droite = rendreValeurSql(condition.right);
      if (droite.status === 'refus') return droite;
      return rendu(`${gauche.code} ${operateur} ${droite.code}`);
    }
    case 'logical-not': {
      const operande = rendreConditionSql(condition.operand);
      return operande.status === 'refus' ? operande : rendu(`NOT (${operande.code})`);
    }
    case 'logical-binary': {
      const mot = condition.operator === '&&' ? 'AND' : 'OR';
      const gauche = rendreConditionSql(condition.left);
      if (gauche.status === 'refus') return gauche;
      const droite = rendreConditionSql(condition.right);
      if (droite.status === 'refus') return droite;
      return rendu(`(${gauche.code} ${mot} ${droite.code})`);
    }
  }
}

function rendreValeurSql(valeur: NumericExpression | Extract<Condition, { kind: 'logical-not' }>): RenduSql {
  return 'operand' in valeur && valeur.kind === 'logical-not'
    ? rendreConditionSql(valeur)
    : rendreExpressionSql(valeur as NumericExpression);
}
