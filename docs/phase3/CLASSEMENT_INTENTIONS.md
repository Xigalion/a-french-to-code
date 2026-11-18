# Phase 3 — les 84 intentions du catalogue partagé, classées pour Java

Quatre colonnes, et une seule règle pour les remplir : **une intention est
« reprise » seulement si la phrase française ET le sens restent identiques.**
Si la phrase doit changer, c'est une adaptation ; si le sens doit changer, c'est
un refus.

Cette partition sera **imposée par un test**, comme celle de Python : le
registre ne tient pas son propre inventaire, qui divergerait.

**Rappel de méthode, appris de Python :** un refus n'est pas une interdiction
d'enseigner la compétence. Chacun **désigne** la construction Java qui
l'enseigne.

---

## 1. Le décompte

| Classe | Nombre | Ce que ça veut dire |
|---|---|---|
| **A — reprise directe** | **31** | phrase et sens inchangés, sortie Java écrite par le module de rendu |
| **B — adaptation sémantique** | **26** | la phrase ou la sortie change, et une information dit pourquoi |
| **C — refus nommé** | **25** | Java n'a pas la notion ; le refus désigne son équivalent |
| **D — propre à Java** | **101** | aucune racine dans C ni Python (voir le catalogue) |

Les 82 premières lignes couvrent les 84 genres moins les deux genres de
**diagnostic** — `STATEMENT_AT_FILE_SCOPE` et
`UNSUPPORTED_ENCLOSING_CONTEXT` — qui ne sont pas des intentions traduisibles
mais des refus du placement.

**Comparaison avec Python, qui éclaire :** Python reprenait **33** intentions
et en refusait **51**. Java en reprend 31 et n'en refuse que **25** : Java est
**typé statiquement et à accolades**, donc structurellement plus proche du C
que Python ne l'est. L'écart ne se joue pas sur la syntaxe, il se joue sur
**l'objet** — d'où 101 intentions propres, contre 64 pour Python.

## 2. Classe A — reprise directe (31)

**Contrôle du flot (13).** `IF`, `ELSE_IF`, `ELSE`, `WHILE`, `DO_WHILE`,
`FOR`, `BREAK`, `CONTINUE`, `SWITCH`, `CASE_INT`, `CASE_CHAR`,
`CASE_DEFAULT`, `BREAK_SWITCH`.

Java écrit ces treize **exactement** comme C17, accolades et point-virgules
compris. Et il en fait **plus** : `case "lundi":` sur une chaîne est légal en
Java et illégal en C17 — une capacité en plus, livrée par une phrase native de
J4.

**Variables et affectations (10).** `DECL_INT`, `INIT_INT`, `ASSIGN_INT`,
`ASSIGN_EXPRESSION`, `NUMERIC_DECL`, `NUMERIC_INIT`, `NUMERIC_ASSIGN`,
`DECL_CHAR`, `INIT_CHAR`, `ASSIGN_CHAR`.

**Méthodes et retours (8).** `RETURN`, `RETURN_INT`, `RETURN_EXPRESSION`,
`RETURN_NUMERIC`, `CALL`, `CALL_ASSIGN`, et les deux formes d'appel déjà
couvertes par le profil d'expression.

**Le cas heureux, et il faut le dire parce qu'il a coûté cher en phase 2 :**
`/` et `%` se reportent **sans adaptation**. La division entière tronque, le
signe du modulo suit le dividende — comme en C17. Les deux phrases distinctes
que Python avait exigées n'ont pas d'équivalent ici.

## 3. Classe B — adaptation sémantique (26)

### B.1 Les affichages (8) — un renversement de sens

`PRINT_INT`, `PRINT_TEXT`, `PRINT_CHAR`, `PRINT_STRING`, `PRINT_FORMATTED`,
`PRINT_NEWLINE`, `ARRAY_PRINT`, `ARRAY_PRINT_CHAR`.

`printf` n'ajoute rien ; `println` ajoute un retour à la ligne. Porter
`Affiche la valeur de n.` vers `println` changerait le **sens** d'une phrase
du catalogue, et contredirait l'information `OUTPUT_HAS_NO_SEPARATOR` du
lot 29.

**Adaptation retenue (décision J2) :** vers `System.out.print`, qui n'ajoute
rien. `println` reçoit sa **propre** phrase : `… et passe à la ligne.`

### B.2 Le point d'entrée (1)

`MAIN`. `Crée la fonction principale.` devient `Crée la méthode principale.`,
et produit `public static void main(String[] args) {`. Elle n'est plaçable que
**dans une classe**, et son refus hors classe est `METHODE_HORS_CLASSE`.

### B.3 Les tableaux et les chaînes (6)

`ARRAY_DECL`, `ARRAY_ASSIGN_INT`, `ARRAY_ASSIGN_CHAR`,
`ARRAY_ASSIGN_EXPRESSION`, `STRING_INIT`, plus l'indexation comme terme
d'expression.

Trois adaptations, chacune pour une raison précise :

| Point | C17 | Java |
|---|---|---|
| déclaration dimensionnée | `int t[10];` — mémoire indéterminée | `int[] t = new int[10];` — **tout à zéro** |
| le mot dans la phrase | `l'élément "0" de t` | `l'élément "0" du tableau t` — décision **J10** |
| une chaîne | `char s[32] = "Ada";` | `String s = "Ada";` — un **objet**, pas un tableau |

### B.4 Les structures devenues classes (6)

`STRUCT_DECL`, `STRUCT_VAR`, `STRUCT_FIELD`, `MEMBER_ASSIGN_INT`,
`MEMBER_ASSIGN_CHAR`, `MEMBER_ASSIGN_EXPRESSION`, `MEMBER_PRINT`.

Java n'a pas de `struct`. Une `class` en tient le rôle **et bien plus** : elle
porte des méthodes, de la visibilité, un constructeur. L'accès `.` est
identique ; `->` n'existe pas, faute de pointeurs.

**Conséquence assumée :** A accepte `e.age` sur un champ `private` et `javac`
le refuse. L'information `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` le dit, et la
lacune reste ouverte — A ne vérifie aucune visibilité, comme il ne vérifie
aucun type.

### B.5 Les méthodes (2)

`FUNC_DEF` et `CONST_DECL`.

Une méthode Java porte une **visibilité** et un **`static`** que C ignore. Une
constante s'écrit `final`, et `static final` dans une classe. Les deux
reçoivent des phrases distinctes plutôt qu'un défaut choisi par A.

### B.6 Les fichiers (3)

`FILE_WRITE_TEXT`, `FILE_WRITE_INT`, `FILE_READ_STRING`.

Les seules des huit intentions de fichier dont le **sens** se transpose. Elles
passent par un *écrivain* ou un *lecteur* déclaré dans un **bloc essaie avec
ressource** — qui ferme tout seul — et elles traînent avec elles l'obligation
d'attraper `IOException`. Décision **J6**.

## 4. Classe C — refus nommés (25)

| Intentions | Pourquoi Java refuse | Ce que le refus désigne |
|---|---|---|
| `DECL_POINTER`, `INIT_POINTER`, `ASSIGN_ADDRESS`, `PRINT_POINTED`, `ASSIGN_POINTED_INT`, `ASSIGN_POINTED_EXPRESSION` (6) | **pas de pointeurs** | les objets, qui sont déjà des références |
| `ALLOCATE`, `REALLOCATE`, `FREE`, `SIZEOF_ASSIGN`, `SIZEOF_PRINT` (5) | **ramasse-miettes** ; aucune taille à demander | `new`, et `taille du tableau` pour une longueur |
| `INCLUDE_STDIO`, `INCLUDE_STDLIB`, `INCLUDE_ASSERT`, `INCLUDE_LIMITS`, `INCLUDE_LOCAL` (5) | **pas de préprocesseur** | `Importe {CLASSE}.`, et les constantes `Integer.MAX_VALUE` |
| `GUARD_OPEN`, `GUARD_CLOSE` (2) | **aucune double inclusion possible** | rien à remplacer : le problème n'existe pas |
| `FUNC_PROTOTYPE` (1) | **pas de déclaration séparée** | l'ordre des méthodes est libre dans une classe |
| `LINKAGE_DECL` (1) | `static`/`extern` du C ne sont pas ceux de Java | la **visibilité** : `public`, `private` |
| `TYPE_ALIAS` (1) | **pas de `typedef`** | une `class`, ou un `record` — décision J7 |
| `FILE_DECL`, `FILE_OPEN`, `FILE_CLOSE`, `FILE_READ_INT`, `FILE_AT_END` (4) | un `FILE*` n'a pas d'équivalent ; la fermeture est automatique | le **bloc essaie avec ressource**, et `readLine` |

**Le refus de `FILE_CLOSE` mérite son mot**, parce qu'il enseigne quelque
chose : en C il **faut** fermer, en Python `with` ferme, en Java le bloc
essaie avec ressource ferme. Trois langages, trois réponses à la même
question — et c'est le genre de chose qu'un catalogue multilangage peut
montrer et qu'un cours sur un seul langage ne montre pas.

## 5. Classe D — propre à Java (101)

Le détail est dans `CATALOGUE_JAVA_PROPOSE.md`. Les familles, et pourquoi
aucune n'a de racine dans l'existant :

| Famille | Formulations | Pourquoi c'est neuf |
|---|---|---|
| classes, objets, constructeurs, `this` | 14 | **Python-A n'a pas de classes** : rien à reprendre |
| héritage, interfaces, polymorphisme | 12 | aucun des deux langages livrés n'a la notion |
| collections — `List`, `Map`, `Set` | 11 | Python a listes et dictionnaires, mais **sans type déclaré ni import** |
| exceptions — `try`, `catch`, `finally`, `throw` | 7 | C n'en a pas ; Python en a, mais **sans exception vérifiée** |
| paquetages et imports | 2 | ni `#include` ni `import` de Python n'ont la contrainte de **répertoire** |
| chaînes comme objets — `length()`, `charAt`, `equals` | 5 | en C une chaîne est un tableau ; en Python, un type sans méthode déclarée |
| visibilité, `static`, `final`, `abstract` | 9 | aucune racine |
| booléen comme type à part entière | 3 | en C17, `0` et non-zéro ; A n'avait pas de `booléen` |
| `long`, `float` et leurs suffixes de littéral | 4 | A n'avait ni `long` ni suffixe |
| saisie par `Scanner`, affichage `println` | 6 | — |
| boucle « pour chaque », taille, itération de clés | 4 | — |
| fichiers par lecteur et écrivain | 6 | — |
| le reste des fondamentaux de J1 à J4 | 18 | — |

## 6. Ce que ce classement ne règle pas

Il dit **quoi** porter, pas **comment placer**. Une intention de classe A peut
être parfaitement traduisible et rester **non plaçable** : en Java, rien
d'exécutable ne vit à la portée fichier, et `int n = 0;` tout seul dans un
`.java` ne compile pas davantage que dans un `.c` depuis le lot 26.

Le placement est traité par les décisions **J3**, **J4** et **J5**, et il est
le vrai travail de la phase 3 — pas le classement ci-dessus.
