# Phase 3 — le catalogue Java-A : périmètre et informations passives

**La table complète est générée**, elle n'est pas écrite ici :

| | |
|---|---|
| source de vérité | [`catalogue-java.json`](catalogue-java.json) |
| table lisible | [`CATALOGUE_JAVA_SPEC.md`](CATALOGUE_JAVA_SPEC.md) — **générée** |
| contrôle et compteurs | `node scripts/catalogue-java.mjs` |

**Pourquoi ce document ne contient plus de table.** Sa première version
annonçait « 134 formulations = 101 natives + 33 reprises » à côté d'un tableau
qui en totalisait 127 — trois chiffres, aucun juste. La cause n'était pas
l'inattention : c'était un compteur **écrit à la main**. Les compteurs sont
désormais **calculés**, et un contrôle refuse une spécification incohérente.

Chiffres au 18 novembre 2026, calculés :

| | |
|---|---|
| formulations spécifiées | **140** |
| dont reprises du catalogue partagé | **30** |
| dont adaptations sémantiques | **27** |
| dont propres à Java | **83** |
| intentions partagées à porter, couvertes | **57 / 57** |
| domaines | **9** — J1 18, J2 14, J3 14, J4 16, J5 17, J6 20, J7 16, J8 12, J9 13 |

**Aucun plafond.** Le catalogue compte ce que l'enseignement de Java exige, et
ce nombre a déjà bougé une fois : il est passé de 127 à 140 en comblant les
intentions portées qui n'avaient **aucune** formulation pour les atteindre —
des intentions **mortes**, exactement le défaut que le lot 30 avait trouvé en
C. Le contrôle les refuse désormais par construction.

---

## 1. Les 24 informations passives

Elles ne bloquent rien. Elles disent ce que le langage fait et ce que A **ne
vérifie pas**. Trois d'entre elles corrigent une règle apprise en C ou en
Python, et c'est leur raison d'être.

### J1 — types

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_CLASS_NAME_IS_FILE_NAME` | une classe `public` exige un fichier portant **son nom**. A ne renomme aucun fichier |
| `JAVA_CHAR_IS_16_BIT` | `char` vaut **16 bits** en Java, 8 en C17 : un même programme n'y range pas les mêmes caractères |
| `JAVA_LONG_NEEDS_SUFFIX` | un littéral dépassant `int` exige le suffixe `L`, sans quoi le compilateur refuse **le littéral**, pas l'affectation |
| `JAVA_FLOAT_NEEDS_SUFFIX` | `float x = 1.5;` **ne compile pas** : il faut `1.5f`. C17 l'acceptait |

### J2 — affichage et saisie

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_PRINTLN_ADDS_A_LINE` | `print` n'ajoute rien, `println` ajoute un retour à la ligne. Les deux ont **leur** phrase |
| `JAVA_SCANNER_LEAVES_THE_NEWLINE` | `nextInt()` laisse le retour à la ligne dans le flux : un `nextLine()` qui suit lit une ligne **vide** |

### J3 — calculs

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_INTEGER_DIVISION_TRUNCATES` | `7 / 2` vaut **3** — comme C17. Vérifié par exécution |
| `JAVA_MODULO_FOLLOWS_DIVIDEND` | `-7 % 2` vaut **-1** — comme C17, **contrairement à Python** |
| `JAVA_EQUALS_NOT_DOUBLE_EQUAL` | `==` entre deux chaînes compare des **références**. `a == b` peut être faux pour deux chaînes identiques |

### J4 — contrôle

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_SWITCH_FALLS_THROUGH` | un cas sans `break` **tombe** dans le suivant — comme C17, **l'inverse de `match`** en Python |

### J5 — méthodes

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_STATIC_CANNOT_CALL_INSTANCE` | `main` est `static`, et une méthode d'instance n'y est pas appelable sans objet. **A est sans état : la lacune n'est pas refermée** |
| `JAVA_THROWS_IS_PART_OF_THE_SIGNATURE` | `throws` est **dans la signature**. A ne l'ajoute pas à une signature déjà écrite |

### J6 — tableaux et collections

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_NEW_ARRAY_IS_ZEROED` | `new int[10]` met **tout à zéro** ; C laisse la mémoire indéterminée |
| `JAVA_COLLECTION_NEEDS_AN_IMPORT` | `List`, `Map`, `Scanner`… exigent un `import`. A ne l'ajoute pas — règle 3 |
| `JAVA_GENERICS_BOX_PRIMITIVES` | une `List<Integer>` range des **objets**, pas des `int` |
| `JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE` | le mot « tableau » ou « liste » **est** l'information manquante : `notes[0]` et `notes.get(0)` sont deux codes |

### J7 — objets

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` | A n'applique **aucun** contrôle de visibilité. `e.age` sur un champ `private` est accepté par A et **refusé par `javac`** |
| `JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS` | dès qu'un constructeur est écrit, celui sans argument **cesse d'exister** |
| `JAVA_THIS_DISAMBIGUATES` | `this.age = age;` distingue le champ du paramètre de même nom. Sans `this`, la ligne ne fait **rien** |

### J8 — héritage

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_OVERRIDE_IS_CHECKED_BY_JAVAC` | `@Override` ne **crée** pas une redéfinition, il la fait **vérifier**. Le seul endroit où le compilateur protège d'une faute que A ne voit pas |
| `JAVA_INTERFACE_METHOD_HAS_NO_BODY` | une méthode attendue n'a **pas** de corps : A crée une ligne, pas un bloc |

### J9 — exceptions et fichiers

| Code | Ce qu'elle enseigne |
|---|---|
| `JAVA_TRY_WITH_RESOURCES_CLOSES` | le bloc essaie **avec** ressource ferme seul. Même leçon que `with` en Python, l'inverse de `fclose` en C17 |
| `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` | lire un fichier **oblige** à attraper ou à déclarer. **A ne choisit pas entre les deux** — décision J6 |
| `JAVA_ASSERT_IS_DISABLED_BY_DEFAULT` | les assertions sont **inactives** sans `-ea` : une `assert` qui ne se déclenche jamais ne prouve rien |

## 2. Trois choix de formulation, et leur raison

**Le mot « tableau » ou « liste » dans la phrase** — décision J10, validée.
`notes[0]` et `notes.get(0)` sont deux codes différents, et A est **sans
état**. Une phrase unique serait ambiguë, donc refusée ; le mot ajouté **est**
l'information manquante. Même raisonnement que `Affiche x.`, refusé en
français souple parce qu'il a trois lectures.

**Le nom de la classe n'est pas dans la phrase du constructeur.** Il est lu
dans le **contexte** — la classe englobante —, comme le lot 20 lit la
structure englobante par `structTarget.ts`. Hors d'une classe, le refus est
nommé et ne produit aucun fragment.

**`Déclare une structure nommée Point.` est conservée** et produit
`class Point {`. Une phrase historique valide ne disparaît pas — règle 7 — et
un élève venu du C doit retrouver sa phrase, avec l'information qui lui dit ce
qu'une classe apporte de plus.
