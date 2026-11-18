/** Le Java que A écrit pour les intentions du **catalogue partagé**, et le
 * seul endroit où il s'écrit.
 *
 * Lot J1. Ce module reçoit une intention déjà analysée par `translate` et en
 * écrit le Java, ou refuse en nommant la construction. Il ne lit pas de
 * français, ne décide pas du placement, et n'ajoute aucune ligne que personne
 * n'a demandée.
 *
 * Les 57 intentions portées ici le sont parce que la notion existe en Java,
 * pas parce que A savait déjà l'écrire en C. Les 27 autres sont refusées,
 * chacune avec la construction Java qui enseigne la même compétence
 * (`raisons.ts`). La partition des 84 est écrite dans
 * `docs/phase3/classement-java.json`, et un test l'impose.
 *
 * Décisions du fondateur appliquées ici, toutes validées le 18 novembre 2026 :
 *   - **J1** aucune classe ni `main` implicite : le point d'entrée est une
 *     phrase, et A ne produit aucun code en avant-première ;
 *   - **J2** les affichages existants rendent `print`, qui n'ajoute rien.
 *     `println` a sa propre phrase. Le sens d'une phrase française ne dépend
 *     pas du langage cible ;
 *   - **J3** `static` et la visibilité sont dans la phrase, jamais choisis ;
 *   - **J6** rien d'implicite autour des exceptions vérifiées : A informe, et
 *     ne choisit ni `try`/`catch` ni `throws` ;
 *   - **J10** le mot « tableau » ou « liste » est dans la phrase.
 */
import type { DisplayFormat, Instruction } from '../../translate.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import { renderStringLiteral } from '../../stringLiteral.ts';
import { rendreExpressionJava, nomJavaValide } from './expression.ts';
import type { RenduExpression } from './expression.ts';

export type RenduJava =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

/** Les 57 intentions du catalogue partagé que Java porte — 30 reprises et 27
 * adaptations. La liste est tenue **ici**, et `test/java.test.mjs` vérifie
 * qu'elle correspond exactement à `docs/phase3/classement-java.json` : deux
 * inventaires qui divergent valent moins qu'un seul. */
export const PORTEES_JAVA: ReadonlySet<string> = new Set([
  // ---- A, contrôle du flot : écrit comme C17, à la lettre
  'IF', 'ELSE_IF', 'ELSE', 'WHILE', 'DO_WHILE', 'FOR', 'BREAK', 'CONTINUE',
  'SWITCH', 'CASE_INT', 'CASE_CHAR', 'CASE_DEFAULT', 'BREAK_SWITCH',
  // ---- A, variables et affectations
  'DECL_INT', 'INIT_INT', 'ASSIGN_INT', 'ASSIGN_EXPRESSION',
  'NUMERIC_DECL', 'NUMERIC_INIT', 'NUMERIC_ASSIGN',
  'DECL_CHAR', 'INIT_CHAR', 'ASSIGN_CHAR',
  // ---- A, retours, appels, assertion
  'RETURN', 'RETURN_INT', 'RETURN_EXPRESSION', 'RETURN_NUMERIC', 'CALL', 'CALL_ASSIGN',
  'ASSERT',
  // ---- B, affichages : `print`, jamais `println` (J2)
  'PRINT_INT', 'PRINT_TEXT', 'PRINT_CHAR', 'PRINT_STRING', 'PRINT_FORMATTED',
  'PRINT_NEWLINE', 'NUMERIC_PRINT',
  // ---- B, tableaux et chaînes
  'ARRAY_DECL', 'ARRAY_ASSIGN_INT', 'ARRAY_ASSIGN_CHAR', 'ARRAY_ASSIGN_EXPRESSION',
  'ARRAY_PRINT', 'ARRAY_PRINT_CHAR', 'STRING_INIT',
  // ---- B, structures devenues classes
  'STRUCT_DECL', 'STRUCT_VAR', 'STRUCT_FIELD',
  'MEMBER_ASSIGN_INT', 'MEMBER_ASSIGN_CHAR', 'MEMBER_ASSIGN_EXPRESSION', 'MEMBER_PRINT',
  // ---- B, méthodes et constantes
  'FUNC_DEF', 'CONST_DECL',
  // ---- B, point d'entrée
  'MAIN',
  // ---- B, fichiers dont le sens se transpose
  'FILE_WRITE_TEXT', 'FILE_WRITE_INT', 'FILE_READ_STRING',
]);

/** Les genres dont le rendu **ouvre un bloc**. A écrit l'accolade fermante et
 * laisse le corps vide : aucun `return`, aucune instruction ajoutée. */
export const EN_TETES_JAVA: ReadonlySet<string> = new Set([
  'IF', 'ELSE_IF', 'ELSE', 'WHILE', 'DO_WHILE', 'FOR', 'SWITCH', 'FUNC_DEF', 'MAIN', 'STRUCT_DECL',
]);

const NON_SIGNE = 'Java n’a aucun entier non signé : tous ses types entiers sont signés. Écrire « int » '
  + 'perdrait exactement l’information que vous avez donnée, et l’écrire quand même enseignerait un type '
  + 'qui n’existe pas dans ce langage.';

const TYPES: Partial<Record<string, string>> = {
  int: 'int', float: 'float', double: 'double', char: 'char',
};

/** Le type Java d'un type du catalogue, ou le refus qui le remplace. */
function typeJava(type: string): { type: string } | { refus: string } {
  if (type === 'unsigned int') return { refus: NON_SIGNE };
  if (type === 'void') return { type: 'void' };
  const cible = TYPES[type];
  return cible === undefined ? { refus: 'Type non porté en Java : ' + type + '.' } : { type: cible };
}

/** Java exige le suffixe `f` sur un littéral décimal affecté à un `float` :
 * `float x = 1.5;` **ne compile pas**, là où C17 l'accepte. Le suffixe est une
 * façon d'écrire le type que la phrase a nommé — comme « int » pour
 * « entier » —, et il n'est posé que sur un **littéral**, jamais sur une
 * expression : l'accoler à `a + b` serait faux. */
function suffixeFlottant(type: string, expression: NumericExpression, code: string): string {
  if (type !== 'float') return code;
  if (expression.kind !== 'literal') return code;
  return /[.eE]/u.test(code) ? code + 'f' : code;
}

export function rendreJava(instruction: Instruction): RenduJava {
  const rendu = (code: string): RenduJava => ({ status: 'rendu', code });
  const refus = (raison: string): RenduJava => ({ status: 'refus', raison });
  /** Rend une expression, en propageant le refus. */
  const expr = (resultat: RenduExpression, suite: (code: string) => RenduJava): RenduJava =>
    (resultat.status === 'refus' ? refus(resultat.raison) : suite(resultat.code));
  /** Vérifie un nom contre les mots réservés de Java avant de l'écrire. */
  const nom = (valeur: string, suite: () => RenduJava): RenduJava => {
    const probleme = nomJavaValide(valeur);
    return probleme === undefined ? suite() : refus(probleme);
  };
  const bloc = (entete: string): RenduJava => rendu(`${entete} {\n    \n}\n`);
  const affiche = (argument: string): RenduJava => rendu(`System.out.print(${argument});\n`);

  switch (instruction.kind) {
    // ---- point d'entrée (J1) -------------------------------------------
    // `String[] args` n'est pas un ajout : c'est la signature que la machine
    // virtuelle exige pour reconnaître un point d'entrée. Sans elle, la
    // classe compile et refuse de démarrer.
    case 'MAIN': return bloc('public static void main(String[] args)');

    // ---- contrôle du flot ------------------------------------------------
    case 'IF': return expr(rendreExpressionJava(instruction.parameters.condition), c => bloc(`if (${c})`));
    case 'ELSE_IF': return expr(rendreExpressionJava(instruction.parameters.condition), c => bloc(`else if (${c})`));
    case 'ELSE': return bloc('else');
    case 'WHILE': return expr(rendreExpressionJava(instruction.parameters.condition), c => bloc(`while (${c})`));
    case 'DO_WHILE': return expr(rendreExpressionJava(instruction.parameters.condition),
      c => rendu(`do {\n    \n} while (${c});\n`));
    // Aucune déclaration de la variable de boucle : écrire « for (int i = … »
    // serait une déclaration que personne n'a demandée. Comme en C17, la
    // variable se déclare par sa propre phrase.
    case 'FOR': {
      const { name, initial, condition, update } = instruction.parameters;
      return nom(name, () => expr(rendreExpressionJava(initial), debut =>
        expr(rendreExpressionJava(condition), test =>
          expr(rendreExpressionJava(update), suite =>
            bloc(`for (${name} = ${debut}; ${test}; ${name} = ${suite})`)))));
    }
    case 'BREAK': return rendu('break;\n');
    case 'CONTINUE': return rendu('continue;\n');
    case 'SWITCH': return expr(rendreExpressionJava(instruction.parameters.expression),
      c => bloc(`switch (${c})`));
    case 'CASE_INT': return rendu(`case ${instruction.parameters.value}:\n`);
    case 'CASE_CHAR': return rendu(`case ${instruction.parameters.literal}:\n`);
    case 'CASE_DEFAULT': return rendu('default:\n');
    case 'BREAK_SWITCH': return rendu('break;\n');

    // ---- variables et affectations ---------------------------------------
    case 'DECL_INT': return nom(instruction.parameters.name, () => rendu(`int ${instruction.parameters.name};\n`));
    case 'INIT_INT': return nom(instruction.parameters.name,
      () => rendu(`int ${instruction.parameters.name} = ${instruction.parameters.value};\n`));
    case 'ASSIGN_INT': return nom(instruction.parameters.name,
      () => rendu(`${instruction.parameters.name} = ${instruction.parameters.value};\n`));
    case 'ASSIGN_EXPRESSION': return nom(instruction.parameters.name,
      () => expr(rendreExpressionJava(instruction.parameters.expression),
        code => rendu(`${instruction.parameters.name} = ${code};\n`)));
    case 'NUMERIC_DECL': {
      const { type, name } = instruction.parameters;
      const cible = typeJava(type);
      if ('refus' in cible) return refus(cible.refus);
      return nom(name, () => rendu(`${cible.type} ${name};\n`));
    }
    case 'NUMERIC_INIT': {
      const { type, name, expression } = instruction.parameters;
      const cible = typeJava(type);
      if ('refus' in cible) return refus(cible.refus);
      return nom(name, () => expr(rendreExpressionJava(expression),
        code => rendu(`${cible.type} ${name} = ${suffixeFlottant(type, expression, code)};\n`)));
    }
    case 'NUMERIC_ASSIGN': return nom(instruction.parameters.name,
      () => expr(rendreExpressionJava(instruction.parameters.expression),
        code => rendu(`${instruction.parameters.name} = ${code};\n`)));
    case 'DECL_CHAR': return nom(instruction.parameters.name, () => rendu(`char ${instruction.parameters.name};\n`));
    case 'INIT_CHAR': return nom(instruction.parameters.name,
      () => rendu(`char ${instruction.parameters.name} = ${instruction.parameters.literal};\n`));
    case 'ASSIGN_CHAR': return nom(instruction.parameters.name,
      () => rendu(`${instruction.parameters.name} = ${instruction.parameters.literal};\n`));
    case 'CONST_DECL': {
      const { type, name, expression } = instruction.parameters;
      const cible = typeJava(type);
      if ('refus' in cible) return refus(cible.refus);
      return nom(name, () => expr(rendreExpressionJava(expression),
        code => rendu(`final ${cible.type} ${name} = ${suffixeFlottant(type, expression, code)};\n`)));
    }

    // ---- affichages : `print`, et rien de plus (J2) -----------------------
    case 'PRINT_INT': return nom(instruction.parameters.name, () => affiche(instruction.parameters.name));
    case 'PRINT_CHAR': return nom(instruction.parameters.name, () => affiche(instruction.parameters.name));
    case 'PRINT_STRING': return nom(instruction.parameters.name, () => affiche(instruction.parameters.name));
    case 'PRINT_TEXT': return affiche(renderStringLiteral(instruction.parameters.text));
    // La seule phrase qui demande un séparateur, et la seule qui en écrit un.
    case 'PRINT_NEWLINE': return rendu('System.out.println();\n');
    case 'PRINT_FORMATTED': {
      const specificateurs: Record<DisplayFormat, string> = { decimal: '%d', hexadecimal: '%x', octal: '%o' };
      return nom(instruction.parameters.name, () => rendu(
        `System.out.printf("${specificateurs[instruction.parameters.format]}", ${instruction.parameters.name});\n`));
    }
    case 'NUMERIC_PRINT': {
      const parametres = instruction.parameters;
      if (parametres.format === 'unsigned') {
        return refus('Le format « décimal signé » du C affiche un entier NON signé, et Java n’a pas '
          + 'd’entier non signé. Il n’y a donc rien à afficher de cette façon : la notation fixe et la '
          + 'notation scientifique, elles, sont portées.');
      }
      const lettre = parametres.format === 'fixed' ? 'f' : 'e';
      return nom(parametres.name, () => rendu(
        `System.out.printf("%.${parametres.precision}${lettre}", ${parametres.name});\n`));
    }

    // ---- tableaux et chaînes ---------------------------------------------
    // `new` est écrit parce que la phrase donne une dimension : en Java, un
    // tableau dimensionné EST une allocation. Tout est mis à zéro, ce que C
    // ne fait pas, et l'information passive le dit.
    case 'ARRAY_DECL': {
      const { type, name, dimension } = instruction.parameters;
      // Un tableau de structures devient un tableau d'objets. `new Point[4]`
      // crée les quatre CASES, et non les quatre objets : elles valent
      // `null`, et l'information passive le dit — c'est le piège exact de ce
      // tableau, et il n'existe pas en C17.
      if (typeof type !== 'string') {
        return nom(type.tag, () => nom(name, () => rendu(
          `${type.tag}[] ${name} = new ${type.tag}[${dimension}];\n`)));
      }
      const cible = typeJava(type);
      if ('refus' in cible) return refus(cible.refus);
      return nom(name, () => rendu(`${cible.type}[] ${name} = new ${cible.type}[${dimension}];\n`));
    }
    case 'ARRAY_ASSIGN_INT': return expr(rendreExpressionJava(instruction.parameters.element),
      cible => rendu(`${cible} = ${instruction.parameters.value};\n`));
    case 'ARRAY_ASSIGN_CHAR': return expr(rendreExpressionJava(instruction.parameters.element),
      cible => rendu(`${cible} = ${instruction.parameters.literal};\n`));
    case 'ARRAY_ASSIGN_EXPRESSION': return expr(rendreExpressionJava(instruction.parameters.element),
      cible => expr(rendreExpressionJava(instruction.parameters.expression),
        valeur => rendu(`${cible} = ${valeur};\n`)));
    case 'ARRAY_PRINT': case 'ARRAY_PRINT_CHAR':
      return expr(rendreExpressionJava(instruction.parameters.element), code => affiche(code));
    // Une chaîne Java est un OBJET : la dimension de la phrase n'a pas
    // d'équivalent, et il n'y a pas de terminateur à loger. A ne l'invente
    // pas, il dit qu'elle est sans effet.
    case 'STRING_INIT': return nom(instruction.parameters.name, () => rendu(
      `String ${instruction.parameters.name} = ${renderStringLiteral(instruction.parameters.text)};\n`));

    // ---- structures devenues classes -------------------------------------
    case 'STRUCT_DECL': return nom(instruction.parameters.tag, () => bloc(`class ${instruction.parameters.tag}`));
    case 'STRUCT_FIELD': {
      const { type, pointer, name, dimension } = instruction.parameters;
      if (pointer) {
        return refus('Java n’a pas de pointeur : un champ qui désigne un autre objet se déclare avec le '
          + 'type de cet objet, sans étoile. Écrivez « Ajoute un champ de type … », avec la classe visée.');
      }
      // Un champ de type structure devient un champ du type de la CLASSE, et
      // le nom de la classe suffit : pas de mot-clé « struct » en Java.
      if (type.kind === 'struct') {
        return nom(type.tag, () => nom(name, () => rendu(dimension === undefined
          ? `${type.tag} ${name};\n`
          : `${type.tag}[] ${name} = new ${type.tag}[${dimension}];\n`)));
      }
      const cible = typeJava(type.type);
      if ('refus' in cible) return refus(cible.refus);
      return nom(name, () => rendu(dimension === undefined
        ? `${cible.type} ${name};\n`
        : `${cible.type}[] ${name} = new ${cible.type}[${dimension}];\n`));
    }
    // Une variable de type structure devient un objet, et un objet ne naît
    // pas vide : `new` est écrit parce que la phrase demande une variable de
    // ce type. Le constructeur sans argument doit exister, et A ne le sait
    // pas : l'information passive le dit.
    case 'STRUCT_VAR': {
      const { tag, name } = instruction.parameters;
      return nom(tag, () => nom(name, () => rendu(`${tag} ${name} = new ${tag}();\n`)));
    }
    case 'MEMBER_ASSIGN_INT': return expr(cible(instruction.parameters.target),
      acces => rendu(`${acces} = ${instruction.parameters.value};\n`));
    case 'MEMBER_ASSIGN_CHAR': return expr(cible(instruction.parameters.target),
      acces => rendu(`${acces} = ${instruction.parameters.literal};\n`));
    case 'MEMBER_ASSIGN_EXPRESSION': return expr(cible(instruction.parameters.target),
      acces => expr(rendreExpressionJava(instruction.parameters.expression),
        valeur => rendu(`${acces} = ${valeur};\n`)));
    case 'MEMBER_PRINT': return expr(cible(instruction.parameters.target), acces => affiche(acces));

    // ---- méthodes (J3) ---------------------------------------------------
    // `static` est écrit parce que la phrase du catalogue partagé décrit une
    // fonction libre, et qu'une méthode appelée depuis `main` doit l'être.
    // Les méthodes d'instance ont leurs propres phrases.
    case 'FUNC_DEF': {
      const { returnType, name, params, internal } = instruction.parameters;
      if (internal) {
        return refus('Java n’a pas de liaison interne : ce qu’elle protégeait s’obtient par la '
          + 'visibilité. Écrivez « Crée une méthode privée … », qui dit la même chose dans les termes '
          + 'du langage.');
      }
      const retour = typeJava(returnType);
      if ('refus' in retour) return refus(retour.refus);
      const ecrits: string[] = [];
      for (const parametre of params) {
        const type = typeJava(parametre.type);
        if ('refus' in type) return refus(type.refus);
        const probleme = nomJavaValide(parametre.name);
        if (probleme !== undefined) return refus(probleme);
        ecrits.push(`${type.type} ${parametre.name}`);
      }
      return nom(name, () => bloc(`static ${retour.type} ${name}(${ecrits.join(', ')})`));
    }
    case 'RETURN': return rendu('return;\n');
    case 'RETURN_INT': return rendu(`return ${instruction.parameters.value};\n`);
    case 'RETURN_EXPRESSION': case 'RETURN_NUMERIC':
      return expr(rendreExpressionJava(instruction.parameters.expression), code => rendu(`return ${code};\n`));
    case 'CALL': {
      const { name, args } = instruction.parameters;
      const ecrits: string[] = [];
      for (const argument of args) {
        const resultat = rendreExpressionJava(argument);
        if (resultat.status === 'refus') return refus(resultat.raison);
        ecrits.push(resultat.code);
      }
      return nom(name, () => rendu(`${name}(${ecrits.join(', ')});\n`));
    }
    case 'CALL_ASSIGN': {
      const { target, name, args } = instruction.parameters;
      const ecrits: string[] = [];
      for (const argument of args) {
        const resultat = rendreExpressionJava(argument);
        if (resultat.status === 'refus') return refus(resultat.raison);
        ecrits.push(resultat.code);
      }
      return nom(target, () => nom(name, () => rendu(`${target} = ${name}(${ecrits.join(', ')});\n`)));
    }

    // ---- fiabilité -------------------------------------------------------
    case 'ASSERT': return expr(rendreExpressionJava(instruction.parameters.condition),
      code => rendu(`assert ${code};\n`));

    // ---- fichiers (J6) ---------------------------------------------------
    // Aucun `throws` n'est ajouté, aucun `try` n'est ouvert : la décision J6
    // interdit à A de choisir entre les deux. L'information passive énonce
    // l'obligation et nomme les deux issues légales.
    case 'FILE_WRITE_TEXT': return nom(instruction.parameters.name, () => rendu(
      `${instruction.parameters.name}.print(${renderStringLiteral(instruction.parameters.text)});\n`));
    case 'FILE_WRITE_INT': return nom(instruction.parameters.name, () => rendu(
      `${instruction.parameters.name}.print(${instruction.parameters.value});\n`));
    case 'FILE_READ_STRING': {
      const { name, target } = instruction.parameters;
      return nom(name, () => nom(target, () => rendu(`${target} = ${name}.readLine();\n`)));
    }

    default: return refus('Intention non portée par Java : ' + instruction.kind + '.');
  }
}

/** L'accès à un champ, écrit en Java. La flèche n'existe pas, et l'élément
 * d'un tableau de structures passe par le rendu d'expression — qui refuse
 * lui-même ce qu'il ne porte pas. */
function cible(target: { object: string; member: string; arrow: boolean; element?: NumericExpression }): RenduExpression {
  if (target.arrow) {
    return { status: 'refus', raison: 'La flèche « -> » n’existe pas en Java, faute de pointeurs : '
      + 'l’accès à un champ s’écrit toujours avec un point.' };
  }
  const probleme = nomJavaValide(target.member);
  if (probleme !== undefined) return { status: 'refus', raison: probleme };
  if (target.element !== undefined) {
    const element = rendreExpressionJava(target.element);
    return element.status === 'refus' ? element
      : { status: 'rendu', code: `${element.code}.${target.member}` };
  }
  const objet = nomJavaValide(target.object);
  return objet === undefined
    ? { status: 'rendu', code: `${target.object}.${target.member}` }
    : { status: 'refus', raison: objet };
}
