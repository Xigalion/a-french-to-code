/** Le Java des intentions **natives** : un genre, une ligne.
 *
 * Lots J3 à J8. Ce module ne lit pas de français : il reçoit une intention
 * déjà analysée par `catalogue.ts`. Il ne décide pas du placement, et n'ajoute
 * aucune ligne que personne n'a demandée.
 *
 * Trois règles d'écriture, et elles sont toutes les trois pédagogiques :
 *
 *  1. **aucun `import` n'est ajouté.** `List`, `Map`, `Scanner`,
 *     `BufferedReader` en exigent un, et `Importe …` est une phrase. Ajouter
 *     l'import tout seul violerait la règle 3, et le cacher empêcherait
 *     d'apprendre que Java range ses classes en paquetages ;
 *  2. **aucun `throws` n'est ajouté à une signature déjà écrite**, et aucun
 *     `try` n'est ouvert à la place de l'utilisateur. Décision J6 ;
 *  3. **le nom de la classe n'est pas inventé** : un constructeur le lit dans
 *     son contexte, et c'est l'hôte qui le lui donne.
 */
import { renderStringLiteral } from '../../stringLiteral.ts';
import { rendreExpressionJava, nomJavaValide } from './expression.ts';
import type { InstructionJava, TypeJava } from './instructions.ts';

export type RenduNatifJava =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

/** Le type primitif Java. `chaine` devient `String`, qui n'est pas primitif —
 * et c'est précisément ce qu'une information passive enseigne. */
const PRIMITIF: Readonly<Record<TypeJava, string>> = {
  int: 'int', long: 'long', float: 'float', double: 'double',
  char: 'char', boolean: 'boolean', chaine: 'String',
};

/** Le type **enveloppé**, exigé par une collection : `List<int>` n'existe
 * pas, il faut `List<Integer>`. C'est la source du piège de `==` sur deux
 * `Integer`, et l'information `JAVA_GENERICS_BOX_PRIMITIVES` le dit. */
const ENVELOPPE: Readonly<Record<TypeJava, string>> = {
  int: 'Integer', long: 'Long', float: 'Float', double: 'Double',
  char: 'Character', boolean: 'Boolean', chaine: 'String',
};

/** Les genres dont le rendu ouvre un bloc. */
export const EN_TETES_NATIFS_JAVA: ReadonlySet<string> = new Set([
  'JAVA_CLASSE', 'JAVA_CLASSE_INTERNE', 'JAVA_CLASSE_HERITE', 'JAVA_CLASSE_ABSTRAITE',
  'JAVA_CLASSE_IMPLEMENTE', 'JAVA_INTERFACE', 'JAVA_METHODE_STATIQUE_VIDE',
  'JAVA_METHODE_PUBLIQUE', 'JAVA_METHODE_PUBLIQUE_VIDE', 'JAVA_METHODE_PRIVEE',
  'JAVA_METHODE_REDEFINIE', 'JAVA_METHODE_LANCE', 'JAVA_CONSTRUCTEUR',
  'JAVA_CONSTRUCTEUR_PARAMETRE', 'JAVA_POUR_CHAQUE_TABLEAU', 'JAVA_POUR_CHAQUE_LISTE',
  'JAVA_POUR_CHAQUE_CLE', 'JAVA_ESSAIE', 'JAVA_ATTRAPE', 'JAVA_FINALEMENT',
  'JAVA_ESSAIE_LECTEUR', 'JAVA_ESSAIE_ECRIVAIN',
]);

export function rendreJavaNatif(instruction: InstructionJava, classeEnglobante?: string): RenduNatifJava {
  const rendu = (code: string): RenduNatifJava => ({ status: 'rendu', code });
  const refus = (raison: string): RenduNatifJava => ({ status: 'refus', raison });
  const bloc = (entete: string): RenduNatifJava => rendu(`${entete} {\n    \n}\n`);
  /** Vérifie un nom avant de l'écrire, et propage le refus. */
  const nom = (valeur: string, suite: () => RenduNatifJava): RenduNatifJava => {
    const probleme = nomJavaValide(valeur);
    return probleme === undefined ? suite() : refus(probleme);
  };
  const expr = (noeud: Parameters<typeof rendreExpressionJava>[0],
    suite: (code: string) => RenduNatifJava): RenduNatifJava => {
    const resultat = rendreExpressionJava(noeud);
    return resultat.status === 'refus' ? refus(resultat.raison) : suite(resultat.code);
  };

  const p = instruction.parameters as Record<string, never>;
  void p;

  switch (instruction.kind) {
    // ---------------- J1 — types et classes -----------------------------
    case 'JAVA_CLASSE':
      return bloc(`public class ${instruction.parameters.classe}`);
    // Une seule classe PUBLIQUE par fichier : la seconde n'en porte pas, et
    // ce n'est pas un choix de A, c'est une règle de Java.
    case 'JAVA_CLASSE_INTERNE':
      return bloc(`class ${instruction.parameters.classe}`);
    case 'JAVA_LONG': {
      const { nom: cible, valeur } = instruction.parameters;
      // Le suffixe `L` n'est pas un ajout : sans lui, le compilateur refuse
      // LE LITTÉRAL dès qu'il dépasse `int`, et la phrase dit « long ».
      return nom(cible, () => rendu(`long ${cible} = ${valeur}L;\n`));
    }
    case 'JAVA_FLOAT': {
      const { nom: cible, expression } = instruction.parameters;
      return nom(cible, () => expr(expression, code => rendu(
        `float ${cible} = ${expression.kind === 'literal' && /[.eE]/u.test(code) ? code + 'f' : code};\n`)));
    }
    case 'JAVA_BOOLEEN': {
      const { nom: cible, valeur } = instruction.parameters;
      return nom(cible, () => rendu(`boolean ${cible} = ${valeur ? 'true' : 'false'};\n`));
    }
    case 'JAVA_DECL_BOOLEEN':
      return nom(instruction.parameters.nom, () => rendu(`boolean ${instruction.parameters.nom};\n`));
    case 'JAVA_DECL_CHAINE':
      return nom(instruction.parameters.nom, () => rendu(`String ${instruction.parameters.nom};\n`));
    case 'JAVA_CONSTANTE_CLASSE': {
      const { nom: cible, valeur } = instruction.parameters;
      return nom(cible, () => rendu(`static final int ${cible} = ${valeur};\n`));
    }

    // ---------------- J2 — affichage et saisie --------------------------
    case 'JAVA_AFFICHE_LIGNE':
      return nom(instruction.parameters.nom, () => rendu(`System.out.println(${instruction.parameters.nom});\n`));
    case 'JAVA_AFFICHE_TEXTE_LIGNE':
      return rendu(`System.out.println(${renderStringLiteral(instruction.parameters.texte)});\n`);
    // Pas d'affichage hexadécimal ici : « Affiche n en hexadécimal. » est la
    // phrase de PRINT_FORMATTED du catalogue partagé, consulté d'abord. Le
    // motif natif était une intention MORTE, et un test l'a dit.
    case 'JAVA_LECTEUR_SAISIE':
      return nom(instruction.parameters.nom,
        () => rendu(`Scanner ${instruction.parameters.nom} = new Scanner(System.in);\n`));
    case 'JAVA_LIRE_ENTIER_SAISIE': {
      const { lecteur, cible } = instruction.parameters;
      return nom(lecteur, () => nom(cible, () => rendu(`${cible} = ${lecteur}.nextInt();\n`)));
    }
    case 'JAVA_LIRE_LIGNE_SAISIE': {
      const { lecteur, cible } = instruction.parameters;
      return nom(lecteur, () => nom(cible, () => rendu(`${cible} = ${lecteur}.nextLine();\n`)));
    }

    // ---------------- J3 — expressions et chaînes -----------------------
    case 'JAVA_AFFECTE_TEXTE':
      return nom(instruction.parameters.nom, () => rendu(
        `${instruction.parameters.nom} = ${renderStringLiteral(instruction.parameters.texte)};\n`));
    // `n += 1`, pas `n++` : l'affectation augmentée dit ce que la phrase dit —
    // « augmente de un » — là où `++` cache un effet de bord et pose la
    // question du pré et du post-incrément, qui n'est pas la notion visée.
    case 'JAVA_INCREMENTE':
      return nom(instruction.parameters.nom, () => rendu(`${instruction.parameters.nom} += 1;\n`));
    case 'JAVA_DECREMENTE':
      return nom(instruction.parameters.nom, () => rendu(`${instruction.parameters.nom} -= 1;\n`));
    case 'JAVA_CONVERTI_ENTIER':
      return nom(instruction.parameters.nom, () => expr(instruction.parameters.expression,
        code => rendu(`${instruction.parameters.nom} = (int) ${code};\n`)));
    case 'JAVA_CONVERTI_REEL':
      return nom(instruction.parameters.nom, () => expr(instruction.parameters.expression,
        code => rendu(`${instruction.parameters.nom} = (double) ${code};\n`)));
    case 'JAVA_CONCATENE': {
      const { cible, source, texte } = instruction.parameters;
      return nom(cible, () => nom(source, () => rendu(
        `${cible} = ${source} + ${renderStringLiteral(texte)};\n`)));
    }
    case 'JAVA_LONGUEUR_CHAINE': {
      const { cible, chaine } = instruction.parameters;
      return nom(cible, () => nom(chaine, () => rendu(`${cible} = ${chaine}.length();\n`)));
    }
    case 'JAVA_CARACTERE_INDICE': {
      const { cible, indice, chaine } = instruction.parameters;
      return nom(cible, () => nom(chaine, () => expr(indice,
        code => rendu(`${cible} = ${chaine}.charAt(${code});\n`))));
    }
    // `equals`, et jamais `==` : sur deux chaînes, `==` compare des
    // RÉFÉRENCES et peut être faux pour deux textes identiques. C'est la
    // raison d'être de cette phrase.
    case 'JAVA_COMPARE_CHAINES': {
      const { cible, gauche, droite } = instruction.parameters;
      return nom(cible, () => nom(gauche, () => nom(droite, () => rendu(
        `${cible} = ${gauche}.equals(${droite});\n`))));
    }
    case 'JAVA_CHAINE_VERS_ENTIER': {
      const { cible, chaine } = instruction.parameters;
      return nom(cible, () => nom(chaine, () => rendu(`${cible} = Integer.parseInt(${chaine});\n`)));
    }

    // ---------------- J4 — contrôle -------------------------------------
    case 'JAVA_POUR_CHAQUE_TABLEAU': {
      const { type, nom: variable, tableau } = instruction.parameters;
      return nom(variable, () => nom(tableau, () => bloc(
        `for (${PRIMITIF[type]} ${variable} : ${tableau})`)));
    }
    // Sur une liste, la variable prend le type ENVELOPPÉ ou primitif : Java
    // déballe tout seul, et écrire le primitif est ce qu'un cours écrit.
    case 'JAVA_POUR_CHAQUE_LISTE': {
      const { type, nom: variable, liste } = instruction.parameters;
      return nom(variable, () => nom(liste, () => bloc(
        `for (${PRIMITIF[type]} ${variable} : ${liste})`)));
    }
    case 'JAVA_CAS_TEXTE':
      return rendu(`case ${renderStringLiteral(instruction.parameters.texte)}:\n`);

    // ---------------- J5 — méthodes -------------------------------------
    case 'JAVA_METHODE_STATIQUE_VIDE':
      return nom(instruction.parameters.nom, () => bloc(`static void ${instruction.parameters.nom}()`));
    case 'JAVA_METHODE_PUBLIQUE': {
      const { nom: cible, retour } = instruction.parameters;
      return nom(cible, () => bloc(`public ${PRIMITIF[retour]} ${cible}()`));
    }
    case 'JAVA_METHODE_PUBLIQUE_VIDE':
      return nom(instruction.parameters.nom, () => bloc(`public void ${instruction.parameters.nom}()`));
    case 'JAVA_METHODE_PRIVEE':
      return nom(instruction.parameters.nom, () => bloc(`private void ${instruction.parameters.nom}()`));
    // `@Override` ne CRÉE pas une redéfinition : il demande au compilateur de
    // vérifier qu'il y en a une. C'est le seul endroit du catalogue Java où
    // javac protège d'une faute que A ne voit pas.
    case 'JAVA_METHODE_REDEFINIE':
      return nom(instruction.parameters.nom, () => rendu(
        `@Override\npublic void ${instruction.parameters.nom}() {\n    \n}\n`));
    case 'JAVA_METHODE_LANCE': {
      const { nom: cible, exception } = instruction.parameters;
      return nom(cible, () => bloc(`static void ${cible}() throws ${exception}`));
    }
    case 'JAVA_RETOURNE_TEXTE':
      return rendu(`return ${renderStringLiteral(instruction.parameters.texte)};\n`);
    case 'JAVA_RETOURNE_CHAINE':
      return nom(instruction.parameters.nom, () => rendu(`return ${instruction.parameters.nom};\n`));
    case 'JAVA_APPELLE_METHODE': {
      const { methode, objet } = instruction.parameters;
      return nom(methode, () => nom(objet, () => rendu(`${objet}.${methode}();\n`)));
    }
    case 'JAVA_APPELLE_METHODE_ASSIGNE': {
      const { cible, methode, objet } = instruction.parameters;
      return nom(cible, () => nom(methode, () => nom(objet, () => rendu(
        `${cible} = ${objet}.${methode}();\n`))));
    }

    // ---------------- J6 — tableaux et collections ----------------------
    case 'JAVA_DECL_TABLEAU': {
      const { type, nom: cible } = instruction.parameters;
      return nom(cible, () => rendu(`${PRIMITIF[type]}[] ${cible};\n`));
    }
    case 'JAVA_TABLEAU_ASSIGNE': {
      const { valeur, indice, tableau } = instruction.parameters;
      return nom(tableau, () => expr(indice, code => rendu(`${tableau}[${code}] = ${valeur};\n`)));
    }
    case 'JAVA_TABLEAU_ASSIGNE_CAR': {
      const { litteral, indice, tableau } = instruction.parameters;
      return nom(tableau, () => expr(indice, code => rendu(`${tableau}[${code}] = ${litteral};\n`)));
    }
    case 'JAVA_TABLEAU_ASSIGNE_EXPR': {
      const { indice, tableau, expression } = instruction.parameters;
      return nom(tableau, () => expr(indice, cible => expr(expression,
        valeur => rendu(`${tableau}[${cible}] = ${valeur};\n`))));
    }
    case 'JAVA_TABLEAU_AFFICHE': {
      const { indice, tableau } = instruction.parameters;
      return nom(tableau, () => expr(indice, code => rendu(`System.out.print(${tableau}[${code}]);\n`)));
    }
    case 'JAVA_TABLEAU_AFFICHE_CAR': {
      const { indice, tableau } = instruction.parameters;
      return nom(tableau, () => expr(indice, code => rendu(`System.out.print(${tableau}[${code}]);\n`)));
    }
    case 'JAVA_TAILLE_TABLEAU': {
      const { cible, tableau } = instruction.parameters;
      return nom(cible, () => nom(tableau, () => rendu(`${cible} = ${tableau}.length;\n`)));
    }
    // `List<Integer>` et non `List<int>` : les génériques n'acceptent pas un
    // type primitif. L'information passive le dit, et dit aussi ce qu'il en
    // coûte — `==` entre deux `Integer` compare des références.
    case 'JAVA_LISTE': {
      const { type, nom: cible } = instruction.parameters;
      return nom(cible, () => rendu(
        `List<${ENVELOPPE[type]}> ${cible} = new ArrayList<>();\n`));
    }
    case 'JAVA_LISTE_AJOUTE': {
      const { expression, liste } = instruction.parameters;
      return nom(liste, () => expr(expression, code => rendu(`${liste}.add(${code});\n`)));
    }
    case 'JAVA_LISTE_AJOUTE_TEXTE': {
      const { texte, liste } = instruction.parameters;
      return nom(liste, () => rendu(`${liste}.add(${renderStringLiteral(texte)});\n`));
    }
    case 'JAVA_LISTE_ELEMENT': {
      const { cible, indice, liste } = instruction.parameters;
      return nom(cible, () => nom(liste, () => expr(indice,
        code => rendu(`${cible} = ${liste}.get(${code});\n`))));
    }
    case 'JAVA_LISTE_TAILLE': {
      const { cible, liste } = instruction.parameters;
      return nom(cible, () => nom(liste, () => rendu(`${cible} = ${liste}.size();\n`)));
    }
    case 'JAVA_LISTE_RETIRE': {
      const { indice, liste } = instruction.parameters;
      return nom(liste, () => expr(indice, code => rendu(`${liste}.remove(${code});\n`)));
    }
    case 'JAVA_TABLE': {
      const { type, nom: cible } = instruction.parameters;
      return nom(cible, () => rendu(
        `Map<String, ${ENVELOPPE[type]}> ${cible} = new HashMap<>();\n`));
    }
    case 'JAVA_TABLE_ASSOCIE': {
      const { expression, cle, table } = instruction.parameters;
      return nom(table, () => expr(expression, code => rendu(
        `${table}.put(${renderStringLiteral(cle)}, ${code});\n`)));
    }
    case 'JAVA_TABLE_VALEUR': {
      const { cible, cle, table } = instruction.parameters;
      return nom(cible, () => nom(table, () => rendu(
        `${cible} = ${table}.get(${renderStringLiteral(cle)});\n`)));
    }
    case 'JAVA_ENSEMBLE': {
      const { type, nom: cible } = instruction.parameters;
      return nom(cible, () => rendu(`Set<${ENVELOPPE[type]}> ${cible} = new HashSet<>();\n`));
    }
    case 'JAVA_ENSEMBLE_AJOUTE': {
      const { expression, ensemble } = instruction.parameters;
      return nom(ensemble, () => expr(expression, code => rendu(`${ensemble}.add(${code});\n`)));
    }
    case 'JAVA_POUR_CHAQUE_CLE': {
      const { nom: variable, table } = instruction.parameters;
      return nom(variable, () => nom(table, () => bloc(
        `for (String ${variable} : ${table}.keySet())`)));
    }

    // ---------------- J7 — objets ---------------------------------------
    case 'JAVA_CHAMP_PRIVE': {
      const { type, nom: cible } = instruction.parameters;
      return nom(cible, () => rendu(`private ${PRIMITIF[type]} ${cible};\n`));
    }
    case 'JAVA_CHAMP_CHAINE':
      return nom(instruction.parameters.nom, () => rendu(`String ${instruction.parameters.nom};\n`));
    case 'JAVA_CHAMP_TABLEAU': {
      const { type, nom: cible, dimension } = instruction.parameters;
      return nom(cible, () => rendu(
        `${PRIMITIF[type]}[] ${cible} = new ${PRIMITIF[type]}[${dimension}];\n`));
    }
    // Le nom de la classe vient du CONTEXTE, jamais de la phrase : c'est ce
    // que `structTarget.ts` fait depuis le lot 20, et l'hôte le fournit. Sans
    // contexte, le refus est nommé et aucun fragment n'est produit.
    case 'JAVA_CONSTRUCTEUR': {
      if (classeEnglobante === undefined) return refus(SANS_CLASSE);
      return bloc(`public ${classeEnglobante}()`);
    }
    case 'JAVA_CONSTRUCTEUR_PARAMETRE': {
      if (classeEnglobante === undefined) return refus(SANS_CLASSE);
      const { type, nom: parametre } = instruction.parameters;
      return nom(parametre, () => bloc(
        `public ${classeEnglobante}(${PRIMITIF[type]} ${parametre})`));
    }
    // `this.` n'est pas décoratif : sans lui, `age = age;` affecte le
    // paramètre à lui-même et ne fait RIEN. L'information passive le dit.
    case 'JAVA_CHAMP_PARAMETRE': {
      const { champ, parametre } = instruction.parameters;
      return nom(champ, () => nom(parametre, () => rendu(`this.${champ} = ${parametre};\n`)));
    }
    case 'JAVA_OBJET_ARGUMENT': {
      const { nom: cible, classe, expression } = instruction.parameters;
      return nom(cible, () => expr(expression, code => rendu(
        `${classe} ${cible} = new ${classe}(${code});\n`)));
    }
    case 'JAVA_LIT_CHAMP_OBJET': {
      const { cible, champ, objet } = instruction.parameters;
      return nom(cible, () => nom(champ, () => nom(objet, () => rendu(
        `${cible} = ${objet}.${champ};\n`))));
    }

    // ---------------- J8 — héritage, interfaces -------------------------
    case 'JAVA_CLASSE_HERITE': {
      const { classe, parente } = instruction.parameters;
      return bloc(`public class ${classe} extends ${parente}`);
    }
    case 'JAVA_CLASSE_ABSTRAITE':
      return bloc(`public abstract class ${instruction.parameters.classe}`);
    case 'JAVA_INTERFACE':
      return bloc(`public interface ${instruction.parameters.classe}`);
    case 'JAVA_CLASSE_IMPLEMENTE': {
      const { classe, interface: contrat } = instruction.parameters;
      return bloc(`public class ${classe} implements ${contrat}`);
    }
    // Une méthode attendue n'a PAS de corps : A écrit une ligne, pas un bloc.
    // Un `{` y serait une erreur de syntaxe.
    case 'JAVA_METHODE_ATTENDUE':
      return nom(instruction.parameters.nom, () => rendu(`void ${instruction.parameters.nom}();\n`));
    case 'JAVA_METHODE_ATTENDUE_RETOUR': {
      const { nom: cible, retour } = instruction.parameters;
      return nom(cible, () => rendu(`${PRIMITIF[retour]} ${cible}();\n`));
    }
    case 'JAVA_METHODE_ABSTRAITE': {
      const { nom: cible, retour } = instruction.parameters;
      return nom(cible, () => rendu(`abstract ${PRIMITIF[retour]} ${cible}();\n`));
    }
    case 'JAVA_SUPER': return rendu('super();\n');
    case 'JAVA_SUPER_ARGUMENT':
      return expr(instruction.parameters.expression, code => rendu(`super(${code});\n`));
    case 'JAVA_SUPER_METHODE':
      return nom(instruction.parameters.methode,
        () => rendu(`super.${instruction.parameters.methode}();\n`));
    case 'JAVA_DECL_TYPE_CLASSE': {
      const { classe, nom: cible } = instruction.parameters;
      return nom(cible, () => rendu(`${classe} ${cible};\n`));
    }
    // Le polymorphisme en une ligne : le type DÉCLARÉ décide de ce qu'on peut
    // appeler, le type CRÉÉ décide de ce qui s'exécute.
    case 'JAVA_OBJET_POLYMORPHE': {
      const { declare, nom: cible, concrete } = instruction.parameters;
      return nom(cible, () => rendu(`${declare} ${cible} = new ${concrete}();\n`));
    }

    // ---------------- J9 — exceptions, paquetages, fichiers -------------
    case 'JAVA_PAQUETAGE':
      return nom(instruction.parameters.nom, () => rendu(`package ${instruction.parameters.nom};\n`));
    case 'JAVA_IMPORT': return rendu(`import ${instruction.parameters.classe};\n`);
    case 'JAVA_ESSAIE': return bloc('try');
    // Une branche remplace l'accolade fermante : le placement l'exige, et le
    // rendu l'écrit.
    case 'JAVA_ATTRAPE': {
      const { exception, nom: variable } = instruction.parameters;
      return nom(variable, () => rendu(`} catch (${exception} ${variable}) {\n    \n`));
    }
    case 'JAVA_FINALEMENT': return rendu('} finally {\n    \n');
    case 'JAVA_LANCE': {
      const { exception, texte } = instruction.parameters;
      return rendu(`throw new ${exception}(${renderStringLiteral(texte)});\n`);
    }
    case 'JAVA_MESSAGE_EXCEPTION':
      return nom(instruction.parameters.nom, () => rendu(
        `System.out.print(${instruction.parameters.nom}.getMessage());\n`));
    // Le bloc essaie AVEC ressource ferme le fichier tout seul, même si une
    // exception survient : il n'y a pas de fermeture à écrire, donc pas de
    // fermeture à oublier.
    case 'JAVA_ESSAIE_LECTEUR': {
      const { nom: cible, chemin } = instruction.parameters;
      return nom(cible, () => bloc(
        `try (BufferedReader ${cible} = new BufferedReader(new FileReader(${renderStringLiteral(chemin)})))`));
    }
    case 'JAVA_ESSAIE_ECRIVAIN': {
      const { nom: cible, chemin } = instruction.parameters;
      return nom(cible, () => bloc(
        `try (PrintWriter ${cible} = new PrintWriter(${renderStringLiteral(chemin)}))`));
    }
    case 'JAVA_LIRE_LIGNE_FICHIER': {
      const { lecteur, cible } = instruction.parameters;
      return nom(lecteur, () => nom(cible, () => rendu(`${cible} = ${lecteur}.readLine();\n`)));
    }
  }
}

const SANS_CLASSE = 'Un constructeur porte le nom de sa classe, et A ne l’invente pas : placez le '
  + 'curseur dans le corps d’une classe, et il le lira là. Hors d’une classe, un constructeur n’a pas '
  + 'de nom à porter.';
