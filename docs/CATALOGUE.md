# Catalogue C-A — état au 13 novembre 2026

**Toutes les formulations reconnues, avec leur sortie C exacte.** Ce
document est **généré depuis le moteur puis relu** : chaque ligne a été
produite par `translate()`, pas écrite de mémoire.

Il sert de référence pour concevoir une épreuve : tout ce qui n'y figure
pas est refusé.

Conventions de lecture :

- `⏎` marque une fin de ligne dans le fragment produit ; les blocs ont
  trois lignes et un corps vide.
- La colonne « Information » donne les motifs pédagogiques **passifs**
  envoyés dans « C-A — Pédagogie ». Aucun n'est un avertissement.
- Le point final est **facultatif**, attaché au dernier mot ou guillemet.
- Les mots fixes sont **insensibles à la casse**, mais **les accents sont
  exigés**. Les deux apostrophes `’` et `'` sont équivalentes.
- Une instruction tient sur **une seule ligne**.
- Le commentaire inséré au-dessus du code contient **exactement** la phrase
  saisie, sans normalisation.

---

## Domaine 1 — Fondations et premiers programmes

| Phrase française | Code C produit | Information |
|---|---|---|
| `Inclue la bibliothèque stdio.h.` | `#include <stdio.h>` | — |
| `Crée la fonction principale.` | `int main(void) { ⏎ ⏎ }` | — |
| `Déclare un entier nommé age.` | `int age;` | — |
| `Crée un entier nommé age de valeur 20.` | `int age = 20;` | — |
| `Affecte la valeur 25 à age.` | `age = 25;` | — |
| `Affiche la valeur de age.` | `printf("%d", age);` | — |
| `Affiche age en décimal.` | `printf("%d", age);` | — |
| `Affiche age en hexadécimal.` | `printf("%x", age);` | — |
| `Affiche age en octal.` | `printf("%o", age);` | — |
| `Affiche le texte "Bonjour\n".` | `printf("%s", "Bonjour\n");` | — |

Échappements acceptés dans un texte : `\"`, `\\`, `\n`, `\t`. Seul
`stdio.h`, écrit exactement ainsi, est pris en charge.

## Domaine 2 — Expressions et calculs

| Phrase française | Code C produit | Information |
|---|---|---|
| `Affecte à resultat le résultat de "2 + 3 * 4".` | `resultat = (2 + (3 * 4));` | — |
| `Déclare une variable de type double nommée x.` | `double x;` | — |
| `Crée une variable de type double nommée x avec le résultat de "1.5".` | `double x = 1.5;` | — |
| `Affecte à x le résultat numérique de "(double) 7 / 2".` | `x = (((double) 7) / 2);` | — |
| `Affiche x en notation fixe avec 2 décimales.` | `printf("%.2f", x);` | — |
| `Affiche x en notation scientifique avec 3 décimales.` | `printf("%.3e", x);` | — |
| `Affiche n en décimal non signé.` | `printf("%u", n);` | — |

Opérateurs : `+`, `-`, `*`, `/`, `%`, parenthèses, moins unaire.
Types : `int`, `unsigned int`, `float`, `double`. Conversions explicites
par cast. Précision d'affichage de 0 à 20 décimales.

**« le résultat de »** utilise le profil **entier** du lot 6 ;
**« le résultat numérique de »** le profil **numérique** du lot 7, seul à
accepter les flottants et les casts. Cette distinction s'applique partout.

### Avertissements de calcul, non bloquants

Deux motifs seulement, cherchés dans **toutes** les expressions de toutes
les intentions, y compris à droite d'un court-circuit :

| Code | Déclencheur |
|---|---|
| `INTEGER_ZERO_DIVISOR` | diviseur entier littéralement nul |
| `ZERO_DIVISOR` | diviseur nul dont les types ne sont pas établis |
| `FLOAT_REMAINDER_OPERAND` | opérande flottant littéral avec `%` |

## Domaine 3 — Décisions et répétitions

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée un bloc si "age >= 18 && !suspendu".` | `if (((age >= 18) && (!suspendu))) { ⏎ ⏎ }` | `SHORT_CIRCUIT_AND`, `LOGICAL_NOT` |
| `Ajoute une branche sinon si "age >= 12".` | `else if (age >= 12) { ⏎ ⏎ }` | — |
| `Ajoute une branche sinon.` | `else { ⏎ ⏎ }` | — |
| `Crée une boucle tant que "i < limite".` | `while (i < limite) { ⏎ ⏎ }` | `WHILE_PRETEST` |
| `Crée une boucle avec test final tant que "i < limite".` | `do { ⏎ ⏎ } while (i < limite);` | `DO_WHILE_POSTTEST` |
| `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | `for (i = 0; i < 3; i = (i + 1)) { ⏎ ⏎ }` | `FOR_CLAUSE_ORDER` |
| `Sors de la boucle la plus intérieure.` | `break;` | — |
| `Passe à l’itération suivante de la boucle la plus intérieure.` | `continue;` | — |

Comparateurs : `==`, `!=`, `<`, `>`, `<=`, `>=`, non chaînables.
Logique : `!`, `&&`, `||`, avec leur précédence et leur court-circuit.
Un test numérique direct est accepté : `if (actif)` n'est **pas** réécrit
en `actif != 0`.

### Ce qui est vérifié dans le document

| Intention | Vérification au placement |
|---|---|
| `sinon` / `sinon si` | se rattache à une chaîne `if` bracée qui se termine juste avant la ligne ; refus si isolée, ambiguë, après un `sinon` final, ou avant une branche existante |
| `break` | la structure englobante la plus proche doit être une **boucle** ; un `switch` écrit à la main la refuse |
| `continue` | une boucle englobante doit exister ; un `switch` intermédiaire est traversé |

## Domaine 4 — Fonctions et décomposition

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée une fonction nommée affiche qui ne retourne rien.` | `void affiche(void) { ⏎ ⏎ }` | `FUNCTION_SCOPE` |
| `Crée une fonction nommée taille qui retourne un unsigned int.` | `unsigned int taille(void) { ⏎ ⏎ }` | `FUNCTION_SCOPE` |
| `Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.` | `int somme(int a, int b) { ⏎ ⏎ }` | `FUNCTION_SCOPE`, `PARAMETERS_BY_VALUE` |
| `Retourne.` | `return;` | `RETURN_ENDS_FUNCTION` |
| `Retourne la valeur 0.` | `return 0;` | `RETURN_ENDS_FUNCTION` |
| `Retourne le résultat de "a + b".` | `return (a + b);` | `RETURN_ENDS_FUNCTION` |
| `Retourne le résultat numérique de "(double) a / b".` | `return (((double) a) / b);` | `RETURN_ENDS_FUNCTION` |
| `Appelle affiche.` | `affiche();` | `CALL_NOT_RESOLVED` |
| `Appelle somme avec "2" et "3".` | `somme(2, 3);` | `CALL_NOT_RESOLVED` |
| `Affecte à total le résultat de l’appel de somme avec "2" et "3".` | `total = somme(2, 3);` | `CALL_NOT_RESOLVED` |

Types de retour et de paramètre : `int`, `unsigned int`, `float`,
`double`, plus `void` en retour. Bornes : **16 paramètres**,
**16 arguments**.

### Ce qui est vérifié dans le document

| Intention | Vérification au placement |
|---|---|
| `Crée une fonction nommée …` **et** `Crée la fonction principale.` | doivent être à la **portée fichier** : aucune accolade encore ouverte. Dans un corps de fonction → refusé ; tout autre contexte non classifiable → refusé. Les autres intentions historiques ne sont pas vérifiées |
| `Retourne.` | la fonction englobante doit déclarer `void` |
| les trois retours de valeur | la fonction englobante ne doit **pas** déclarer `void` |
| tous les retours | une fonction englobante bracée doit exister, avec un type de retour pris en charge écrit dans son en-tête |

---

## Domaine 5 — Caractères (lot 14)

Les quatre formulations dédiées. Le littéral n'est **jamais évalué** :
`'A'` n'est pas remplacé par son code.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare un caractère nommé c.` | `char c;` | CHARACTER_STORAGE |
| `Crée un caractère nommé c de valeur 'A'.` | `char c = 'A';` | CHARACTER_IS_INTEGER |
| `Affecte le caractère 'A' à c.` | `c = 'A';` | CHARACTER_IS_INTEGER |
| `Affiche le caractère c.` | `printf("%c", c);` | CHARACTER_FORMAT |
| `Crée un caractère nommé fin de valeur '\n'.` | `char fin = '\n';` | CHARACTER_IS_INTEGER |

Littéral caractère : apostrophes **ASCII droites**, exactement un
caractère **ASCII imprimable** (`0x20` à `0x7E`), ou l'un des
échappements `\'`, `\`, `\n`, `\t`, auxquels le **lot 16** a ajouté `\0`.
Tout le reste est refusé, y compris `''`, `'ab'`, `'é'`, `'😀'` et `’A’`.

`char` est aussi devenu un type à part entière (décision D2) :

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare une variable de type char nommée c.` | `char c;` | — |
| `Crée une fonction nommée lire qui retourne un char.` | `char lire(void) { ⏎ ⏎ }` | FUNCTION_SCOPE |
| `Crée une fonction nommée ecrire qui ne retourne rien et prend un char nommé c.` | `void ecrire(char c) { ⏎ ⏎ }` | FUNCTION_SCOPE, PARAMETERS_BY_VALUE |
| `Affecte à n le résultat numérique de "(char) 65".` | `n = ((char) 65);` | — |

`unsigned char` et `signed char` restent refusés. Un littéral caractère
**dans une expression** a été ouvert au lot 16 pour les profils numérique
et condition seulement.

---

## Domaine 5 — Tableaux et indexation (lot 15)

Cinq formulations dédiées. Aucune dimension, valeur ni initialisation
n'est inventée, et **aucune borne n'est vérifiée**.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare un tableau de type int nommé t de dimension 10.` | `int t[10];` | ARRAY_NOT_ASSIGNABLE |
| `Déclare un tableau de type char nommé t de dimension 10.` | `char t[10];` | ARRAY_NOT_ASSIGNABLE, CHAR_ARRAY_NOT_STRING |
| `Affecte la valeur 5 à l'élément "0" de t.` | `t[0] = 5;` | INDEX_NOT_CHECKED |
| `Affecte le caractère 'A' à l'élément "0" de t.` | `t[0] = 'A';` | INDEX_NOT_CHECKED |
| `Affecte à l'élément "i" de t le résultat numérique de "a + 1".` | `t[i] = (a + 1);` | INDEX_NOT_CHECKED |
| `Affiche l'élément "0" de t.` | `printf("%d", t[0]);` | INDEX_NOT_CHECKED |

L'indexation est aussi devenue un **terme d'expression** dans les profils
numérique et condition, sans enveloppe nouvelle :

| Phrase française | Code C produit | Information |
|---|---|---|
| `Affecte à somme le résultat numérique de "somme + t[i]".` | `somme = (somme + t[i]);` | INDEX_NOT_CHECKED |
| `Crée un bloc si "t[i] > 0".` | `if (t[i] > 0) { ⏎ ⏎ }` | INDEX_NOT_CHECKED |
| `Retourne le résultat numérique de "t[0]".` | `return t[0];` | INDEX_NOT_CHECKED, RETURN_ENDS_FUNCTION |
| `Appelle traiter avec "t[i]".` | `traiter(t[i]);` | INDEX_NOT_CHECKED, CALL_NOT_RESOLVED |

Types de tableau : `int`, `unsigned int`, `float`, `double`, `char`.
Dimension : un entier décimal **strictement positif** écrit en chiffres,
jamais une expression ni un nom.

Grammaire de l'indexation : `nom[indice]` seulement. L'indice est une
**expression entière** quel que soit le profil englobant — ni flottant,
ni conversion, ni comparaison, ni opérateur logique. `t[i][j]` est refusé
(`UNSUPPORTED_ARRAY_DIMENSIONS`), `t[u[i]]` est accepté.

Le **profil entier historique n'est pas ouvert** : `Affecte à x le
résultat de "t[0]".` et `Retourne le résultat de "t[0]".` restent refusés.
Aucune liste d'initialisation `{…}`, aucune affectation globale de
tableau, aucun affichage `%s` ou `%c` d'un élément.

---

## Domaine 5 — Chaînes C17 et caractère nul (lot 16)

Trois formulations dédiées. Aucune dimension n'est déduite, aucun
terminateur n'est vérifié dans un tableau existant.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".` | `char s[6] = "hello";` | NULL_TERMINATOR, ARRAY_SIZE_VS_LENGTH |
| `Affiche la chaîne s.` | `printf("%s", s);` | STRING_TERMINATOR_NOT_CHECKED |
| `Affiche le caractère de l'élément "i" de s.` | `printf("%c", s[i]);` | INDEX_NOT_CHECKED, ELEMENT_CHARACTER_FORMAT |

La **dimension est donnée par l'utilisateur** et doit loger le caractère
nul final : `dimension ≥ longueur décodée + 1`. `… de dimension 5 avec le
texte "hello".` est refusé (`INSUFFICIENT_ARRAY_DIMENSION`). C17
autoriserait ce tableau sans terminateur ; le refus est **pédagogique** et
le diagnostic le dit. Un texte n'initialise qu'un tableau de `char`
(`STRING_REQUIRES_CHAR`). `Déclare` n'écrit aucune valeur, `Crée` en écrit
une : les deux verbes gardent leur sens.

`'\0'` rejoint la grammaire finie du littéral caractère, donc toutes les
formulations des lots 14 et 15 :

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée un caractère nommé fin de valeur '\0'.` | `char fin = '\0';` | CHARACTER_IS_INTEGER |
| `Affecte le caractère '\0' à l'élément "5" de s.` | `s[5] = '\0';` | INDEX_NOT_CHECKED |

Un littéral caractère est devenu un **terme d'expression** dans les
profils numérique et condition :

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée un bloc si "s[i] != '\0'".` | `if (s[i] != '\0') { ⏎ ⏎ }` | INDEX_NOT_CHECKED, CHARACTER_IS_INTEGER |
| `Crée une boucle tant que "s[i] != '\0'".` | `while (s[i] != '\0') { ⏎ ⏎ }` | INDEX_NOT_CHECKED, CHARACTER_IS_INTEGER, WHILE_PRETEST |
| `Affecte à n le résultat numérique de "'z' - 'a'".` | `n = ('z' - 'a');` | CHARACTER_IS_INTEGER |

Le **parcours n'a pas de commande** : il s'écrit avec la boucle, la
condition, l'indice et l'affichage déjà existants, et la boucle reste
visible. Le profil entier et le profil d'indice restent fermés aux
littéraux caractères : `t['A']` est refusé, un indice est entier.

---

## Domaine 5 — Adresses et pointeurs (lot 17)

Six formulations dédiées, **un seul niveau d'indirection**. Le déclarateur
s'écrit `int *p` : l'étoile appartient au déclarateur, pas au type.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare un pointeur de type int nommé p.` | `int *p;` | UNINITIALIZED_POINTER, POINTER_VS_OBJECT |
| `Crée un pointeur de type int nommé p avec l'adresse de x.` | `int *p = &x;` | ADDRESS_OF, POINTER_VS_OBJECT |
| `Affecte l'adresse de x à p.` | `p = &x;` | ADDRESS_OF, POINTER_VS_OBJECT |
| `Affiche la valeur pointée par p.` | `printf("%d", *p);` | DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED |
| `Affecte la valeur 5 à la valeur pointée par p.` | `*p = 5;` | DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED |
| `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` | `*p = (a + 1);` | DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED |

`&` et `*` unaires sont aussi des **termes d'expression** dans les profils
numérique et condition :

| Phrase française | Code C produit | Information |
|---|---|---|
| `Affecte à n le résultat numérique de "*p + 1".` | `n = ((*p) + 1);` | DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED |
| `Crée un bloc si "*p > 0".` | `if ((*p) > 0) { ⏎ ⏎ }` | DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED |
| `Appelle lire avec "&x".` | `lire((&x));` | ADDRESS_OF, CALL_NOT_RESOLVED |
| `Affecte à q le résultat numérique de "&t[0]".` | `q = (&t[0]);` | INDEX_NOT_CHECKED, ADDRESS_OF |

Chaque opérateur unaire est **parenthésé** dans le C produit, comme la
négation depuis le lot 6 : `*p + 1` devient `((*p) + 1)` et jamais
`*(p + 1)`.

**Grammaire.** `&` porte sur une variable nommée ou un élément de tableau ;
`*` porte sur un pointeur nommé, et sur rien d'autre. Refusés :
`&5`, `&(a + b)`, `&-x` (`INVALID_ADDRESS_OPERAND`) ; `*5`, `*(p + 1)`,
`*t[0]` (`INVALID_DEREFERENCE_OPERAND`) ; `* *p`, `& &x`, `*&x`
(`UNSUPPORTED_INDIRECTION_LEVEL`). `*(p)` est accepté et rend `(*p)`.

**Les opérateurs binaires ne sont pas confondus avec les unaires.**
`a & b`, `a && b`, `a * b` et `a ** b` gardent exactement leurs
diagnostics et leurs sorties d'avant le lot. `a * *b` devient `(a * (*b))`,
là où le lot 16 répondait `MISSING_OPERAND`.

Le profil entier et le profil d'indice restent fermés aux deux opérateurs.

---

## Domaine 5 — Relation tableaux/pointeurs (lot 18)

**Aucune enveloppe nouvelle** : la relation à enseigner est une relation
d'expressions, elle s'écrit donc dans les expressions existantes.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Affecte à n le résultat numérique de "*(t + i)".` | `n = (*(t + i));` | DEREFERENCE_MEANING, ARRAY_POINTER_EQUIVALENCE, POINTER_ARITHMETIC_LIMITS, OUT_OF_BOUNDS_UNDEFINED, OFFSET_TYPE_NOT_CHECKED |
| `Crée un bloc si "*(t + i) > 0".` | `if ((*(t + i)) > 0) { ⏎ ⏎ }` | les cinq mêmes |
| `Retourne le résultat numérique de "*(t + i * 2)".` | `return (*(t + (i * 2)));` | + RETURN_ENDS_FUNCTION |
| `Appelle traiter avec "*(t + i)".` | `traiter((*(t + i)));` | + CALL_NOT_RESOLVED |
| `Affiche l'élément "i" de t.` | `printf("%d", t[i]);` | INDEX_NOT_CHECKED |

Les deux dernières lignes sont la leçon du lot : `t[i]` et `*(t + i)`
désignent **le même élément**.

**Grammaire, strictement** : `*(nom + décalage)`, un seul `+`, un seul
niveau de parenthèses, membre gauche un **nom**, décalage dans la
grammaire **entière** du lot 15 (noms, entiers décimaux, `+ - * / %`,
parenthèses, négation, indexation).

Refusés avec `INVALID_POINTER_OFFSET` : `*(p - i)`, `*(t + i + j)`,
`*(t * i)`, `*(t + 1.5)`, `*(t + (int) 1)`, `*(t + 'A')`, `*(t + *q)`,
`*(t + &x)`, `*(t[0] + i)`, `*(-t + i)`. Acceptés : `*(p)`, `*((t) + i)`,
`*(t + (i + 1))`.

**Ce que la grammaire ne garantit pas.** `*(p + q)` et `*(i + t)` sont
acceptés : un identifiant est syntaxiquement une expression entière et
C-A ne résout aucun symbole. `OFFSET_TYPE_NOT_CHECKED` le dit à chaque
occurrence — une forme acceptée ici **ne garantit pas** que le C produit
soit correct.

Ni `p - i`, ni `p - q`, ni `ptrdiff_t`, ni `++`/`--` sur un pointeur.

---

## Domaine 3 — Aiguillage `switch` (lot 19)

Dernier manque du domaine 3, que la documentation fondatrice signalait
comme non livré. `switch` était déjà **reconnu** par le balayage
contextuel ; il est désormais **produit**.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée un aiguillage sur "jour".` | `switch (jour) { ⏎ ⏎ }` | SWITCH_INTEGER_ONLY |
| `Ajoute un cas pour la valeur 5.` | `case 5:` | SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT |
| `Ajoute un cas pour le caractère 'A'.` | `case 'A':` | SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT |
| `Ajoute le cas par défaut.` | `default:` | + DEFAULT_OPTIONAL |
| `Sors de l'aiguillage.` | `break;` | BREAK_LEAVES_SWITCH |

L'expression contrôlée est analysée par le **profil entier du lot 6**,
inchangé : ni flottant, ni conversion, ni comparaison. Une étiquette exige
une **constante** — entier décimal, signe moins admis, ou constante
caractère. Un nom est refusé (`CASE_NEEDS_CONSTANT`) : C-A ne résout aucun
symbole et ne peut pas distinguer une énumération d'une variable.

**Placement contextuel symétrique.** Une étiquette et la sortie
d'aiguillage exigent un `switch` englobant prouvé
(`SWITCH_TARGET_NOT_FOUND` sinon). Et les deux sorties se refusent
mutuellement quand l'autre structure est plus proche :

| Situation | Phrase | Résultat |
|---|---|---|
| `switch` plus proche | `Sors de la boucle la plus intérieure.` | `BREAK_TARGET_IS_SWITCH` (lot 11D) |
| boucle plus proche | `Sors de l'aiguillage.` | `BREAK_TARGET_IS_LOOP` (lot 19) |

Dans les deux sens la phrase serait **fausse**, et C-A refuse plutôt que
de produire un `break;` qui ne fait pas ce qui est annoncé.

Non livré : plages de cas (`case 1 ... 5:`, extension GNU), cas groupés en
une phrase, vérification d'unicité ou de couverture, et `goto`.

---

## Domaine 6 — Structures et accès aux membres (lot 20)

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare une structure nommée Point.` | `struct Point { ⏎ ⏎ };` | STRUCT_TAG_NEEDS_KEYWORD, STRUCT_LAYOUT |
| `Ajoute un champ de type int nommé x.` | `int x;` | — |
| `Ajoute un champ de type structure Point nommé origine.` | `struct Point origine;` | — |
| `Déclare une variable de type structure Point nommée p.` | `struct Point p;` | — |
| `Déclare un pointeur de type structure Point nommé q.` | `struct Point *q;` | — |
| `Affecte la valeur 5 au champ x de p.` | `p.x = 5;` | MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED |
| `Affecte la valeur 5 au champ x pointé par q.` | `q->x = 5;` | idem |
| `Affecte au champ x de p le résultat numérique de "a + 1".` | `p.x = (a + 1);` | idem |
| `Affiche le champ x de p.` | `printf("%d", p.x);` | idem |
| `Affiche le champ x pointé par q.` | `printf("%d", q->x);` | idem |

La définition est un **bloc** et son accolade fermante porte le
point-virgule. Un champ ne se place **que** dans une structure
(`FIELD_OUTSIDE_STRUCT` sinon) ; `struct`, `union` et `enum` écrits à la
main sont reconnus comme cible, avec ou sans étiquette.

`.` et `->` sont aussi des opérateurs postfixés dans les profils numérique
et condition :

| Phrase française | Code C produit |
|---|---|
| `Affecte à n le résultat numérique de "p.x".` | `n = p.x;` |
| `Affecte à n le résultat numérique de "q->a.b".` | `n = q->a.b;` |
| `Affecte à n le résultat numérique de "t[i].x".` | `n = t[i].x;` |
| `Crée un bloc si "q->x > 0".` | `if (q->x > 0) { ⏎ ⏎ }` |

Grammaire : `(nom | nom[indice]) ('.' nom | '->' nom)*`. Les chaînes sont
autorisées ; **aucune indexation après un champ**. Le point ne devient
l'opérateur d'accès que si un chiffre ne le suit pas : `p.1` est lu comme
`p` suivi du littéral `.1`.

C-A **n'écrit jamais une forme à la place de l'autre** : si la phrase dit
« pointé par », la flèche est produite, et rien ne vérifie que l'objet est
un pointeur. Ni la structure, ni le champ, ni son type ne sont vérifiés.

Non livré : `typedef`, énumérations, unions déclarées, champs de bits,
membres anonymes, initialisation ou affectation globale de structure.

---

## Domaine 6 — `sizeof` et mémoire dynamique (lot 21)

| Phrase française | Code C produit | Information |
|---|---|---|
| `Inclue la bibliothèque stdlib.h.` | `#include <stdlib.h>` | HEADER_DECLARES_ONLY |
| `Affiche la taille du type int.` | `printf("%zu", sizeof(int));` | SIZEOF_IS_BYTES |
| `Affiche la taille du type structure Point.` | `printf("%zu", sizeof(struct Point));` | SIZEOF_IS_BYTES |
| `Affecte à n la taille du type double.` | `n = sizeof(double);` | SIZEOF_IS_BYTES |
| `Affecte à p l'allocation de 10 éléments de type int.` | `p = malloc(10 * sizeof(int));` | ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, ALLOCATION_NOT_INITIALIZED |
| `Affecte à q la réallocation de p pour 20 éléments de type int.` | `q = realloc(p, 20 * sizeof(int));` | ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, REALLOC_MAY_MOVE |
| `Libère la mémoire pointée par p.` | `free(p);` | FREE_ONCE |

« du type » et « de type » se lisent tous deux ; « 1 élément » comme
« 10 éléments ». Le produit `4 * sizeof(int)` est **écrit, jamais
replié** : le nombre d'éléments et la taille d'un élément restent
visibles séparément. **Aucune conversion** n'est ajoutée au résultat de
`malloc` : C17 n'en a pas besoin.

Types mesurés : les cinq scalaires, ou `structure {tag}`. Nombre
d'éléments : un entier décimal positif **ou un nom**, sans qu'aucune
vérification ait lieu.

`NULL` s'écrit comme un nom ordinaire et fonctionne parce que `stdlib.h`
le déclare ; aucune formulation ne l'introduit, et `ALLOCATION_CAN_FAIL`
**nomme la phrase à écrire** sans l'écrire.

Non livré : `calloc`, `aligned_alloc`, `sizeof` sur une expression, toute
vérification de durée de vie, de cohérence ou de fuite.

---

## Domaine 7 — Fichiers et flux (lot 22)

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare un fichier nommé f.` | `FILE *f;` | FILE_MUST_BE_CLOSED |
| `Affecte à f l'ouverture du fichier "donnees.txt" en lecture.` | `f = fopen("donnees.txt", "r");` | FOPEN_CAN_FAIL, FILE_MODE_MEANING |
| `Ferme le fichier f.` | `fclose(f);` | FILE_MUST_BE_CLOSED |
| `Écris le texte "bonjour" dans le fichier f.` | `fprintf(f, "%s", "bonjour");` | — |
| `Écris la valeur de x dans le fichier f.` | `fprintf(f, "%d", x);` | — |
| `Lis un entier depuis le fichier f dans x.` | `fscanf(f, "%d", &x);` | SCANF_NEEDS_ADDRESS |
| `Crée un bloc si la fin du fichier f est atteinte.` | `if (feof(f)) { ⏎ ⏎ }` | EOF_AFTER_READ |

Six modes : `lecture`, `écriture`, `ajout`, chacun suivi ou non de
`binaire` — soit `r`, `w`, `a`, `rb`, `wb`, `ab`. Les modes de mise à jour
`r+`, `w+`, `a+` ne sont pas pris en charge.

Les chemins et les textes écrits obéissent à la **grammaire de texte du
lot 16**, partagée telle quelle ; un chemin peut contenir des espaces.
`stdio.h` n'est **jamais ajouté** de lui-même.

Non livré : `fgets`, `fputs`, `fgetc`, `fputc`, `fread`, `fwrite`,
`fseek`, `ftell`, `rewind`, `fflush`, `remove`, `rename`, `errno`,
`perror`, `ferror`, `stdin`/`stdout`/`stderr` nommés, lecture d'autre
chose qu'un entier, et toute vérification de flux, de chemin ou d'ordre.

---

## Domaine 7 — Modularité : en-têtes, prototypes et liaison (lot 23)

| Phrase française | Code C produit | Information |
|---|---|---|
| `Inclue l'en-tête "calcul.h".` | `#include "calcul.h"` | LOCAL_HEADER_SEARCH |
| `Ouvre la protection d'en-tête nommée CALCUL_H.` | `#ifndef CALCUL_H` ⏎ `#define CALCUL_H` | GUARD_PREVENTS_DOUBLE_INCLUSION, GUARD_NOT_EVALUATED |
| `Ferme la protection d'en-tête.` | `#endif` | — |
| `Déclare le prototype d'une fonction nommée somme qui retourne un int et prend un int nommé a.` | `int somme(int a);` | PROTOTYPE_DECLARES_ONLY |
| `Déclare le prototype d'une fonction interne nommée aide qui retourne un int.` | `static int aide(void);` | + INTERNAL_LINKAGE |
| `Déclare la variable externe de type int nommée compteur.` | `extern int compteur;` | EXTERNAL_LINKAGE |
| `Déclare la variable interne de type double nommée total.` | `static double total;` | INTERNAL_LINKAGE |

Une garde est **deux instructions**, et l'information d'ouverture nomme la
phrase de fermeture. Un nom de protection s'écrit en **majuscules ASCII**.
Un chemin d'en-tête local n'accepte ni espace, ni échappement, ni
délimiteur interne.

Le prototype réutilise **exactement** la queue de phrase du lot 12 : même
analyse, mêmes diagnostics, et le prototype est l'en-tête de la définition
avec un point-virgule au lieu du corps.

**Directives acceptées avant la ligne cible** : `#include`, et depuis ce
lot `#ifndef IDENT`, `#define IDENT` **sans** liste de remplacement, et
`#endif`. `#define X 1` reste refusé : C-A n'expanse aucune macro et ne
doit pas lire du code dont une macro pourrait avoir changé les jetons.

Non livré : macros à remplacement, `typedef`, `#if`/`#ifdef`/`#else`,
`#pragma`, définition de fonction `static`, et toute vérification de
projet — un prototype sans définition ou deux gardes de même nom sont
traduits sans un mot.

---

## Domaine 8 — Structures de données (lot 24)

Le domaine se **compose** avec l'existant : ce lot ne comble que les trois
manques qui le rendaient impossible.

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare le synonyme Noeud pour la structure Noeud.` | `typedef struct Noeud Noeud;` | TYPEDEF_IS_AN_ALIAS |
| `Ajoute un champ pointeur de type structure Noeud nommé suivant.` | `struct Noeud *suivant;` | POINTER_FIELD_OWNS_NOTHING |
| `Ajoute un champ pointeur de type int nommé donnees.` | `int *donnees;` | POINTER_FIELD_OWNS_NOTHING |
| `Déclare un tableau de type structure Point nommé t de dimension 10.` | `struct Point t[10];` | STRUCT_ARRAY_LAYOUT |

**Aucune commande de tri, de recherche ou d'échange n'existe, et c'est
voulu** : elle cacherait exactement ce que le domaine enseigne. Une liste
chaînée, une recherche séquentielle, un échange et un parcours s'écrivent
entièrement avec le catalogue, et quatre tests le démontrent avec des
documents finaux exacts.

C-A **n'invente jamais** la variable temporaire d'un échange : l'étudiant
la déclare.

Non livré : tableau de pointeurs, pointeur de tableau, double indirection
dans un champ, `typedef` d'autre chose qu'une structure, et toute
information de complexité — C-A ne lit pas le document et ne peut rien
dire du coût d'un algorithme.

---

## Limites de complexité

| Limite | Valeur |
|---|---|
| Tokens par expression ou condition | **1 024** |
| Niveaux d'imbrication | **64** |
| Clauses d'un `for` / arguments d'un appel | budget de tokens **commun**, profondeur propre à chacun |
| Unités balayées avant la ligne cible | 1 048 576 |
| Tokens et profondeur du balayage contextuel | 50 000 et 128 |
| Branches d'une chaîne `if` | 64 |

Les budgets de tokens ne sont **jamais** remis à zéro entre les
sous-expressions ni entre les clauses d'une même instruction.

## Ce que C-A ne fait pas

- **Rien d'implicite** : aucun `main`, `return`, `#include`, déclaration,
  compteur, initialisation, progression ni format n'est ajouté.
- **Aucune résolution de symbole** : ni existence, ni arité, ni type d'un
  argument, ni portée d'une variable.
- **Aucune vérification de type** au-delà de l'accord entre la forme d'une
  phrase de retour et le type **déclaré** dans l'en-tête.
- **Aucune analyse** de terminaison, de progression, de nombre de tours,
  d'accessibilité ou de code mort.
- **Aucune évaluation** : les nombres sont conservés textuellement, jamais
  convertis ni calculés.
- **Aucune correction silencieuse**, aucun synonyme, aucune valeur
  inventée, aucune proposition de phrase complète à recopier.
- **Aucune garantie** que le C produit compile ou s'exécute sans danger.
  L'absence d'avertissement n'est jamais un certificat.

## Non livré

`switch`, `goto`, `struct`, mémoire dynamique, fichiers, compilation
séparée, `string.h`, `stddef.h` et `NULL`. Tableaux à plusieurs
dimensions, listes d'initialisation `{…}`, affectation globale d'un
tableau ou d'une chaîne, dimension déduite (`char s[] = "…"`). Pointeurs :
un seul niveau d'indirection, ni pointeur de fonction, ni `void *`, ni
retour ou paramètre de type pointeur, ni arithmétique de pointeurs. Types
`long`, `short`, `unsigned char`, `signed char`, `static` : refusés. Le
profil d'expression entier reste fermé à l'indexation, aux littéraux
caractères et aux deux opérateurs de pointeur. Paliers de liberté 2 et 3 :
non spécifiés.
