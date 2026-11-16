# C-A — exercices progressifs du palier 1

**Pour qui :** un étudiant qui a fait `docs/TEST_PARCOURS_DECOUVERTE.md`,
accompagné d'un encadrant. Neuf exercices, un fichier `.c` par exercice,
dans l'ordre.

> Toutes les phrases ont été **passées au moteur** : la colonne « code
> produit » et les codes de refus sont ceux de C-A 0.4.0, relevés le
> 16 novembre 2026, et revérifiés par `test/testUtilisateur.test.mjs` à
> chaque `npm test`.
>
> **Palier 1 = formulation exacte.** Les accents sont exigés, le point final
> est facultatif, une phrase tient sur une ligne. Rien ici n'est à deviner :
> tout est dans `docs/CATALOGUE.md`.

Légende :

| marque | sens |
|---|---|
| ✓ | phrase **acceptée**, code C produit donné |
| ✗ | phrase **refusée à la traduction**, code du refus donné |
| ⊘ | phrase comprise, **refusée à cet endroit** du fichier |

Chaque exercice a la même forme : **objectif**, **phrases**, **à observer**,
**essaie** (un refus volontaire), **compilation mesurée**.

Trois conventions qui valent pour les neuf :

1. **Chaque exercice commence** par `Inclue la bibliothèque stdio.h.` puis
   `Crée la fonction principale.`, et **finit** par
   `Retourne la valeur 0.` — C-A n'en ajoute aucune tout seul.
2. **Pour sortir d'un bloc**, place le curseur en fin de la dernière ligne
   du niveau où tu veux revenir et appuie sur `Entrée`. C'est un geste de
   l'éditeur, pas une commande C-A : un bloc consomme la ligne blanche où
   il est posé.
3. La ligne **« compilation mesurée »** n'est pas une prévision. Les neuf
   corrigés ont été écrits par le moteur dans
   `test-utilisateur/corriges/`, compilés avec **GCC 16.2.0** en
   `-std=c17 -Wall -Wextra -pedantic` et exécutés le 16 novembre 2026 :
   **neuf compilations en code 0, huit exécutions en code 0, zéro
   retouche manuelle**. Journaux : `test-utilisateur/journal/`.
   Si ta sortie diffère de celle annoncée, ce n'est pas un détail — c'est
   une remontée.

---

## Exercice 1 — afficher une valeur · `ex1.c`

**Objectif.** Refaire seul le programme du parcours, sans relire le
parcours. C'est la seule répétition du cahier, et elle est volontaire : le
geste aperçu → confirmation doit être acquis avant d'ajouter des notions.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Inclue la bibliothèque stdio.h.` | `#include <stdio.h>` |
| ✓ | `Crée la fonction principale.` | `int main(void) { ⏎ ⏎ }` |
| ✓ | `Crée un entier nommé age de valeur 20.` | `int age = 20;` |
| ✓ | `Affiche la valeur de age.` | `printf("%d", age);` |
| ✓ | `Affiche un retour à la ligne.` | `printf("\n");` |
| ✓ | `Retourne la valeur 0.` | `return 0;` |

**À observer.** Le commentaire inséré contient ta phrase **exactement**,
accents et ponctuation compris. C-A ne la reformule pas.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ✗ | `Déclare un entier nommé int.` | `C_KEYWORD_IDENTIFIER` |

Un mot-clé C17 ne peut pas servir de nom. Le refus **nomme** le mot fautif.

**Compilation mesurée.** Code de sortie 0, aucun avertissement. Sortie
relevée : `20` puis un retour à la ligne.

---

## Exercice 2 — calculer · `ex2.c`

**Objectif.** Comprendre que C-A **parenthèse** ce qu'il produit, et qu'il
existe **deux profils d'expression** : entier et numérique.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Déclare un entier nommé resultat.` | `int resultat;` |
| ✓ | `Affecte à resultat le résultat de "2 + 3 * 4".` | `resultat = (2 + (3 * 4));` |
| ✓ | `Affiche la valeur de resultat.` | `printf("%d", resultat);` |
| ✓ | `Déclare une variable de type double nommée moyenne.` | `double moyenne;` |
| ✓ | `Affecte à moyenne le résultat numérique de "(double) 7 / 2".` | `moyenne = (((double) 7) / 2);` |
| ✓ | `Affiche moyenne en notation fixe avec 2 décimales.` | `printf("%.2f", moyenne);` |

**À observer.** `2 + 3 * 4` devient `(2 + (3 * 4))` : les parenthèses
**montrent** la priorité au lieu de la supposer. Le résultat affiché doit
être `14`, pas `20` — et c'est la sortie qui le prouve, pas la phrase.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ✗ | `Affecte à moyenne le résultat de "(double) 7 / 2".` | `C_KEYWORD_IDENTIFIER` |
| ✗ | `Affecte à resultat le résultat de "2 +".` | `MISSING_OPERAND` |

Le premier refus est le plus instructif du cahier : `le résultat de` est le
profil **entier**, qui ne connaît pas les conversions ; il lit donc `double`
comme un nom, et refuse un mot-clé. Le profil qui accepte la conversion est
`le résultat numérique de`. **Deux phrases différentes, deux pouvoirs
différents** — ce n'est pas un détail de style.

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée :
`143.50` — c'est-à-dire `14` puis `3.50`, **collés**, parce qu'aucun
affichage n'ajoute de séparateur. Ajoute `Affiche un retour à la ligne.`
entre les deux si tu en veux un.

---

## Exercice 3 — décider · `ex3.c`

**Objectif.** Écrire une chaîne complète `si / sinon si / sinon`, et
découvrir que `sinon` ne se place **que** derrière un `si`.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Crée un entier nommé age de valeur 20.` | `int age = 20;` |
| ✓ | `Crée un bloc si "age >= 18".` | `if (age >= 18) { ⏎ ⏎ }` |
| ✓ | `Affiche le texte "majeur".` | `printf("%s", "majeur");` |
| ✓ | `Ajoute une branche sinon si "age >= 12".` | `else if (age >= 12) { ⏎ ⏎ }` |
| ✓ | `Affiche le texte "adolescent".` | `printf("%s", "adolescent");` |
| ✓ | `Ajoute une branche sinon.` | `else { ⏎ ⏎ }` |
| ✓ | `Affiche le texte "enfant".` | `printf("%s", "enfant");` |

Les blocs sont créés **vides**. Pour écrire dans une branche, place le
curseur à l'intérieur ; pour ajouter la branche suivante, place-le sur la
ligne blanche **juste après** l'accolade fermante.

**À observer.** C-A ne vérifie pas que ta chaîne a un sens : il vérifie
qu'elle a une **cible**. C'est une vérification de structure, pas de
logique.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ⊘ | `Ajoute une branche sinon.` (sans `si` juste avant) | `BRANCH_TARGET_NOT_FOUND` |
| ✗ | `Crée un bloc si "age => 18".` | `ASSIGNMENT_IN_CONDITION` |

Le second refus est une protection réelle : `=` affecte, `==` compare. C-A
ne corrige pas la faute de frappe — il dit ce que `=` ferait.

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée :
`majeur`.

---

## Exercice 4 — répéter · `ex4.c`

**Objectif.** Les trois boucles, et les deux transferts.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Déclare un entier nommé i.` | `int i;` |
| ✓ | `Crée une boucle pour i de valeur initiale "0" tant que "i < 5" avec mise à jour "i + 1".` | `for (i = 0; i < 5; i = (i + 1)) { ⏎ ⏎ }` |
| ✓ | `Crée un bloc si "i == 2".` | `if (i == 2) { ⏎ ⏎ }` |
| ✓ | `Passe à l’itération suivante de la boucle la plus intérieure.` | `continue;` |
| ✓ | `Affiche la valeur de i.` | `printf("%d", i);` |
| ✓ | `Affecte la valeur 0 à i.` | `i = 0;` |
| ✓ | `Crée une boucle tant que "i < 5".` | `while (i < 5) { ⏎ ⏎ }` |
| ✓ | `Affecte à i le résultat de "i + 1".` | `i = (i + 1);` |
| ✓ | `Sors de la boucle la plus intérieure.` | `break;` |

Dans la boucle `pour` : le `si` et son `continue`, puis l'affichage. Dans la
boucle `tant que` : l'affichage, la mise à jour, puis un `si "i == 2"` qui
contient le `break`.

**À observer.** La boucle `pour` déclenche l'information `FOR_CLAUSE_ORDER`,
qui rappelle **l'ordre réel** d'évaluation des trois clauses. La boucle
`tant que` déclenche `WHILE_PRETEST` : le test a lieu **avant** le corps.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ⊘ | `Sors de la boucle la plus intérieure.` (hors de toute boucle) | `LOOP_TARGET_NOT_FOUND` |
| ✗ | `Crée une boucle pour i de "0" tant que "i < 5".` | `UNKNOWN_FORMULATION` |

La boucle `pour` du palier 1 exige **ses trois clauses nommées**. Une forme
abrégée n'existe pas — c'est exactement ce que le palier 2 autorisera un
jour, et ce que le palier 1 refuse aujourd'hui.

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée :
`013401` — `0134` pour la boucle `pour`, où `2` manque parce que `continue`
l'a sauté, puis `01` pour la boucle `tant que`, arrêtée par `break` à
`i == 2`.

Si ta sortie est collée en un seul bloc de chiffres, c'est normal :
**aucun affichage n'ajoute de séparateur**, et c'est ce que dit
l'information `OUTPUT_HAS_NO_SEPARATOR`. Ajoute
`Affiche un retour à la ligne.` si tu en veux un.

---

## Exercice 5 — découper · `ex5.c`

**Objectif.** Définir une fonction, l'appeler, récupérer son résultat.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.` | `int somme(int a, int b) { ⏎ ⏎ }` |
| ✓ | `Retourne le résultat de "a + b".` | `return (a + b);` |
| ✓ | `Déclare un entier nommé total.` | `int total;` |
| ✓ | `Affecte à total le résultat de l’appel de somme avec "2" et "3".` | `total = somme(2, 3);` |
| ✓ | `Affiche la valeur de total.` | `printf("%d", total);` |

L'ordre compte : `somme` doit être **définie avant** `main`, ou le
compilateur protestera. C-A ne t'en avertit pas — il ne connaît pas l'ordre
des symboles.

**À observer.** L'information `CALL_NOT_RESOLVED` dit l'essentiel : C-A
**ne vérifie pas** que `somme` existe, ni qu'elle prend deux arguments. Le
compilateur, lui, le fera.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ⊘ | `Retourne.` (dans une fonction qui retourne un `int`) | `RETURN_NEEDS_VALUE` |
| ⊘ | `Crée la fonction principale.` (dans un corps de fonction) | `FUNCTION_DEFINITION_NESTED` |

Ces deux refus-là **lisent le document** : C-A regarde la fonction
englobante et son type de retour déclaré. C'est la seule famille de
vérifications contextuelles qu'il sait faire.

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée : `5`.

---

## Exercice 6 — grouper · `ex6.c`

**Objectif.** Tableaux, indices, et chaînes de caractères.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Déclare un tableau de type int nommé notes de dimension 3.` | `int notes[3];` |
| ✓ | `Affecte la valeur 12 à l’élément "0" de notes.` | `notes[0] = 12;` |
| ✓ | `Affecte la valeur 15 à l’élément "1" de notes.` | `notes[1] = 15;` |
| ✓ | `Affecte la valeur 9 à l’élément "2" de notes.` | `notes[2] = 9;` |
| ✓ | `Affiche l’élément "1" de notes.` | `printf("%d", notes[1]);` |
| ✓ | `Crée un entier nommé cumul de valeur 0.` | `int cumul = 0;` |
| ✓ | `Déclare un entier nommé i.` | `int i;` |
| ✓ | `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | `for (i = 0; i < 3; i = (i + 1)) { ⏎ ⏎ }` |
| ✓ | `Affecte à cumul le résultat numérique de "cumul + notes[i]".` | `cumul = (cumul + notes[i]);` |
| ✓ | `Affiche la valeur de cumul.` | `printf("%d", cumul);` |
| ✓ | `Crée un tableau de type char nommé mot de dimension 6 avec le texte "hello".` | `char mot[6] = "hello";` |
| ✓ | `Affiche la chaîne mot.` | `printf("%s", mot);` |
| ✓ | `Affiche le caractère de l’élément "0" de mot.` | `printf("%c", mot[0]);` |

**À observer.** La dimension `6` pour cinq lettres : l'information
`NULL_TERMINATOR` explique la place du `'\0'`. Et `INDEX_NOT_CHECKED`
revient à chaque indice — **C-A ne vérifie aucune borne**, jamais.

`cumul` est créé **de valeur 0**, et ce n'est pas un détail de confort :
avec `Déclare un entier nommé cumul.`, la somme partirait d'une valeur
indéterminée et **C-A ne dirait rien**. Il ne vérifie pas plus
l'initialisation que les bornes.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ✗ | `Déclare un tableau de type int nommé t de dimension 0.` | `INVALID_ARRAY_DIMENSION` |
| ✗ | `Affecte la valeur 12 à l’élément 0 de notes.` | `MISSING_EXPRESSION_DELIMITER` |

L'indice s'écrit **entre guillemets**, parce que c'est une expression et pas
un nombre. Le refus pointe le guillemet manquant.

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée :
`1536helloh` — `15` (l'élément 1), `36` (le cumul), `hello`, `h`.

---

## Exercice 7 — désigner · `ex7.c`

**Objectif.** Un pointeur, une adresse, un déréférencement. Un seul niveau
d'indirection : le palier 1 n'en connaît pas d'autre.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Déclare un entier nommé x.` | `int x;` |
| ✓ | `Crée un pointeur de type int nommé p avec l’adresse de x.` | `int *p = &x;` |
| ✓ | `Affecte la valeur 5 à la valeur pointée par p.` | `*p = 5;` |
| ✓ | `Affiche la valeur pointée par p.` | `printf("%d", *p);` |
| ✓ | `Affecte à x le résultat numérique de "*p + 1".` | `x = ((*p) + 1);` |
| ✓ | `Affiche la valeur de x.` | `printf("%d", x);` |

**À observer.** Quatre informations arrivent d'un coup à la déclaration :
`ADDRESS_OF`, `POINTER_VS_OBJECT`, et surtout
**`POINTER_ARITHMETIC_ABSENT`** — qui annonce que C-A **n'analyse pas**
l'arithmétique de pointeurs. `p + 1` serait accepté sans un mot. C'est une
limite déclarée, pas un oubli.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ✗ | `Affiche la valeur pointée par 5.` | `INVALID_IDENTIFIER` |

Le déréférencement porte sur un **nom**, pas sur une valeur.

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée : `56`
— `5` par le pointeur, puis `6` par `x`.

---

## Exercice 8 — assembler · `ex8.c`

**Objectif.** Une structure, un champ, un fichier. Trois domaines d'un coup,
parce qu'à ce stade le geste est acquis et c'est la notion qui compte.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Déclare une structure nommée Point.` | `struct Point { ⏎ ⏎ };` |
| ✓ | `Ajoute un champ de type int nommé x.` | `int x;` |
| ✓ | `Ajoute un champ de type int nommé y.` | `int y;` |
| ✓ | `Crée un entier nommé x de valeur 7.` | `int x = 7;` |
| ✓ | `Déclare une variable de type structure Point nommée centre.` | `struct Point centre;` |
| ✓ | `Affecte la valeur 3 au champ x de centre.` | `centre.x = 3;` |
| ✓ | `Affiche le champ x de centre.` | `printf("%d", centre.x);` |
| ✓ | `Déclare un fichier nommé f.` | `FILE *f;` |
| ✓ | `Affecte à f l’ouverture du fichier "sortie.txt" en écriture.` | `f = fopen("sortie.txt", "w");` |
| ✓ | `Écris la valeur de x dans le fichier f.` | `fprintf(f, "%d", x);` |
| ✓ | `Ferme le fichier f.` | `fclose(f);` |

La structure se déclare **hors** de toute fonction ; les champs vont
**dedans** ; la variable et les affectations vont dans `main`.

**À observer.** `FOPEN_CAN_FAIL` : rien ne garantit que le fichier s'est
ouvert, et C-A n'ajoute **aucun** test pour toi. Écris-le avec un
`Crée un bloc si …` de ton choix si tu veux qu'il existe.

**Essaie.**

| marque | phrase | refus |
|---|---|---|
| ⊘ | `Ajoute un champ de type int nommé x.` (dans `main`) | `FIELD_OUTSIDE_STRUCT` |

**Compilation mesurée.** Code 0, aucun avertissement. Sortie relevée : `3`,
et un fichier `sortie.txt` créé à côté de l'exécutable, contenant `7`.

---

## Exercice 9 (facultatif) — un avertissement, pas un refus

**Objectif.** Voir la différence entre les trois canaux de C-A.

| marque | phrase | code produit |
|---|---|---|
| ✓ | `Affecte à resultat le résultat de "10 / 0".` | `resultat = (10 / 0);` |

**Accepté**, avec un **avertissement** de calcul : « Le diviseur entier est
nul. Si cette opération est exécutée, son comportement est indéfini. »

Trois canaux, trois sens, à ne pas confondre :

| canal | effet | exemple |
|---|---|---|
| **refus** | rien n'est inséré | `UNKNOWN_FORMULATION` |
| **avertissement** | inséré, et un danger est nommé | `INTEGER_ZERO_DIVISOR` |
| **information** | inséré, et une notion est expliquée | `WHILE_PRETEST` |

**Compilation mesurée.** Code 0, et **un** avertissement :
`warning: division by zero [-Wdiv-by-zero]`. C'est le seul exercice du
cahier où un avertissement du compilateur est le résultat attendu.

**N'exécute pas ce programme** : une division entière par zéro a un
comportement **indéfini** en C17, et le corrigé de référence n'est
volontairement pas exécuté non plus. Un avertissement de C-A n'est pas une
permission.

---

## Ce que ces exercices ne couvrent pas

Volontairement : `switch`, `sizeof`, la mémoire dynamique (`malloc`,
`realloc`, `free`), les prototypes et protections d'en-tête, les assertions,
la lecture de fichier. Ils sont **tous** dans le catalogue et tous testés —
ils ne sont pas dans un premier cahier de neuf séances.

Si un étudiant arrive au bout et en veut plus : `docs/CATALOGUE.md`, et
`docs/EXERCICE_INTEGRATEUR.md`, qui couvre les neuf domaines.
