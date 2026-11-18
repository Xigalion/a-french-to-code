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

## 1. Le décompte — CALCULÉ, plus écrit à la main

    node scripts/catalogue-java.mjs

| Classe | Nombre | Ce que ça veut dire |
|---|---|---|
| **A — reprise directe** | **30** | phrase et sens inchangés |
| **B — adaptation sémantique** | **27** | la phrase ou la sortie change, et une information dit pourquoi |
| **C — refus nommé** | **27** | Java n'a pas la notion ; le refus désigne son équivalent |
| **total** | **84** | la partition entière |

Source de vérité : [`classement-java.json`](classement-java.json), où chaque
intention porte **sa** raison. Le contrôle refuse un genre classé deux fois,
un genre non classé, une raison vide, et un total qui ne tombe pas sur la
partition lue dans `src/statementScope.ts`.

**Correction d'une erreur de la première version.** Elle annonçait « 82
intentions classées » en déduisant deux genres de diagnostic
(`STATEMENT_AT_FILE_SCOPE`, `UNSUPPORTED_ENCLOSING_CONTEXT`) qui **ne sont pas
dans la partition** : ils y existent comme codes de refus du placement, pas
comme entrées des trois listes. La partition en compte **84**, et la somme
annoncée — 31 + 26 + 25 = 82 — était fausse deux fois : mauvais total, et
mauvais compte par classe. Les bons chiffres sont **30, 27, 27**.

**Comparaison avec Python, qui éclaire.** Python reprenait **33** intentions et
en refusait **51**. Java en reprend 30 et n'en refuse que **27** : il est typé
statiquement et à accolades, donc structurellement plus proche du C. L'écart ne
se joue pas sur la syntaxe, il se joue sur **l'objet** — d'où **83**
formulations propres, contre 64 pour Python.

## 2. Classe A — reprise directe (30)

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

**Retours et appels (6).** `RETURN`, `RETURN_INT`, `RETURN_EXPRESSION`,
`RETURN_NUMERIC`, `CALL`, `CALL_ASSIGN`.

**Assertion (1).** `ASSERT`. `Vérifie que "x > 0".` produit `assert x > 0;` —
phrase et sens inchangés. Une information dit que les assertions sont
**inactives sans `-ea`**, ce qui ne change pas le sens de la phrase mais change
ce que le programme fait.

**13 + 10 + 6 + 1 = 30.**

**Le cas heureux, et il faut le dire parce qu'il a coûté cher en phase 2 :**
`/` et `%` se reportent **sans adaptation**. La division entière tronque, le
signe du modulo suit le dividende — comme en C17. Les deux phrases distinctes
que Python avait exigées n'ont pas d'équivalent ici.

## 3. Classe B — adaptation sémantique (27)

### B.1 Les affichages (7) — un renversement de sens

`PRINT_INT`, `PRINT_TEXT`, `PRINT_CHAR`, `PRINT_STRING`, `PRINT_FORMATTED`,
`PRINT_NEWLINE`, `NUMERIC_PRINT`.

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

### B.3 Les tableaux et les chaînes (7)

`ARRAY_DECL`, `ARRAY_ASSIGN_INT`, `ARRAY_ASSIGN_CHAR`,
`ARRAY_ASSIGN_EXPRESSION`, `STRING_INIT`, et les deux affichages d'élément
`ARRAY_PRINT` et `ARRAY_PRINT_CHAR` — qui cumulent l'adaptation de B.1 et le
mot « tableau » de la décision J10.

Trois adaptations, chacune pour une raison précise :

| Point | C17 | Java |
|---|---|---|
| déclaration dimensionnée | `int t[10];` — mémoire indéterminée | `int[] t = new int[10];` — **tout à zéro** |
| le mot dans la phrase | `l'élément "0" de t` | `l'élément "0" du tableau t` — décision **J10** |
| une chaîne | `char s[32] = "Ada";` | `String s = "Ada";` — un **objet**, pas un tableau |

### B.4 Les structures devenues classes (7)

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

**7 + 1 + 7 + 7 + 2 + 3 = 27.**

## 4. Classe C — refus nommés (27)

| Intentions | Pourquoi Java refuse | Ce que le refus désigne |
|---|---|---|
| `DECL_POINTER`, `INIT_POINTER`, `ASSIGN_ADDRESS`, `PRINT_POINTED`, `ASSIGN_POINTED_INT`, `ASSIGN_POINTED_EXPRESSION`, `STRUCT_POINTER` (7) | **pas de pointeurs** | les objets, qui sont déjà des références |
| `ALLOCATE`, `REALLOCATE`, `FREE`, `SIZEOF_ASSIGN`, `SIZEOF_PRINT` (5) | **ramasse-miettes** ; aucune taille à demander | `new`, et `taille du tableau` pour une longueur |
| `INCLUDE_STDIO`, `INCLUDE_STDLIB`, `INCLUDE_ASSERT`, `INCLUDE_LIMITS`, `INCLUDE_LOCAL` (5) | **pas de préprocesseur** | `Importe {CLASSE}.`, et les constantes `Integer.MAX_VALUE` |
| `GUARD_OPEN`, `GUARD_CLOSE` (2) | **aucune double inclusion possible** | rien à remplacer : le problème n'existe pas |
| `FUNC_PROTOTYPE` (1) | **pas de déclaration séparée** | l'ordre des méthodes est libre dans une classe |
| `LINKAGE_DECL` (1) | `static`/`extern` du C ne sont pas ceux de Java | la **visibilité** : `public`, `private` |
| `TYPE_ALIAS` (1) | **pas de `typedef`** | une `class`, ou un `record` — décision J7 |
| `FILE_DECL`, `FILE_OPEN`, `FILE_CLOSE`, `FILE_READ_INT`, `FILE_AT_END` (5) | un `FILE*` n'a pas d'équivalent ; la fermeture est automatique | le **bloc essaie avec ressource**, et `readLine` |

**Le refus de `FILE_CLOSE` mérite son mot**, parce qu'il enseigne quelque
chose : en C il **faut** fermer, en Python `with` ferme, en Java le bloc
essaie avec ressource ferme. Trois langages, trois réponses à la même
question — et c'est le genre de chose qu'un catalogue multilangage peut
montrer et qu'un cours sur un seul langage ne montre pas.

## 5. Classe D — propre à Java (83 formulations)

Compté par domaine, et **calculé** depuis
[`catalogue-java.json`](catalogue-java.json) :

| Domaine | natives | reprises | adaptations | total |
|---|---|---|---|---|
| J1 fondamentaux, point d'entrée, types | 9 | 6 | 3 | 18 |
| J2 affichage et saisie | 7 | 0 | 7 | 14 |
| J3 expressions et calculs | 10 | 4 | 0 | 14 |
| J4 structures de contrôle | 3 | **13** | 0 | 16 |
| J5 méthodes | 10 | 6 | 1 | 17 |
| J6 tableaux et collections | 14 | 0 | 6 | 20 |
| J7 classes, objets, constructeurs | 9 | 0 | 7 | 16 |
| J8 héritage, interfaces, polymorphisme | **12** | 0 | 0 | 12 |
| J9 exceptions, paquetages, fichiers | 9 | 1 | 3 | 13 |
| **total** | **83** | **30** | **27** | **140** |

**Deux lignes de ce tableau disent tout de la phase 3.**

**J4 est à 13 reprises sur 16** : les structures de contrôle de Java sont
celles du C, à la lettre. C'est le domaine où Java-A coûtera le moins.

**J8 est à 12 natives sur 12** : l'héritage, les interfaces et le
polymorphisme n'ont **aucune** racine dans l'existant. Ni C17 ni Python-A ne
portent la notion — et cela vaut aussi pour J7 : **Python-A n'a pas de
classes**.

> **Cette dernière affirmation a été vérifiée, pas supposée.** Le catalogue
> natif Python compte 89 genres et **aucun** ne contient `CLASS`, `OBJET`,
> `CONSTR`, `SELF`, `HERIT` ni `INTERF`. La décision **D6** de la phase 2
> indique « refuser au premier jet », et `docs/CATALOGUE_PYTHON.md` porte le
> refus sur les sept intentions de structure, en nommant « un dictionnaire,
> puis une classe avec son constructeur » comme suite attendue. Les notes de
> publication 0.5.0 l'énoncent aussi : « **les classes Python n'y sont pas** ».
> Les bilans qui parlent de classes Python parlent d'un **contrat à venir**,
> jamais d'une livraison. **Java-A aura donc les classes avant Python-A**, et
> c'est une asymétrie à assumer : une classe est obligatoire pour exécuter la
> moindre ligne de Java.

## 6. Ce que ce classement ne règle pas

Il dit **quoi** porter, pas **comment placer**. Une intention de classe A peut
être parfaitement traduisible et rester **non plaçable** : en Java, rien
d'exécutable ne vit à la portée fichier, et `int n = 0;` tout seul dans un
`.java` ne compile pas davantage que dans un `.c` depuis le lot 26.

Le placement est traité par les décisions **J3**, **J4** et **J5**, et il est
le vrai travail de la phase 3 — pas le classement ci-dessus.
