# Matrice de couverture des compétences du modèle 1

Générée par `exercice/matrice.mjs` : chaque ligne est une **mesure**,
pas une déclaration. Les colonnes « compilation » et « exécution »
sont **vides pour toutes les lignes** : aucun compilateur C n’existe
dans cet environnement, et rien n’a été exécuté.

| Dom. | Compétence | État | C produit | Placement | Dans l’exercice | Compilation | Exécution |
|---|---|---|---|---|---|---|---|
| 1 | Instruction de base, variable entière | partiellement vérifiée | `int x;` | oui | oui | — | — |
| 1 | Initialisation à la déclaration | traduite et placée, non exercée | `int x = 20;` | oui | non | — | — |
| 1 | Affectation | partiellement vérifiée | `x = 5;` | oui | oui | — | — |
| 1 | Affichage d’une valeur | partiellement vérifiée | `printf("%d", x);` | oui | oui | — | — |
| 1 | Affichage d’un texte | partiellement vérifiée | `printf("%s", "bonjour");` | oui | oui | — | — |
| 1 | Inclusion de bibliothèque | partiellement vérifiée | `#include <stdio.h>` | oui | oui | — | — |
| 1 | Fonction principale | partiellement vérifiée | `int main(void) { ⏎      ⏎ }` | oui | oui | — | — |
| 2 | Expression entière et priorités | traduite et placée, non exercée | `x = (a + (b * 2));` | oui | non | — | — |
| 2 | Types numériques explicites | partiellement vérifiée | `double x;` | oui | oui | — | — |
| 2 | Conversion explicite | partiellement vérifiée | `n = ((int) 1.5);` | oui | oui | — | — |
| 2 | Format non signé | partiellement vérifiée | `printf("%u", x);` | oui | oui | — | — |
| 2 | Format fixe avec précision | partiellement vérifiée | `printf("%.2f", x);` | oui | oui | — | — |
| 2 | Format hexadécimal | traduite et placée, non exercée | `printf("%x", x);` | oui | non | — | — |
| 2 | Fiabilité : diviseur nul signalé | partiellement vérifiée | `n = (1 / 0);` | oui | oui | — | — |
| 3 | Condition et bloc | partiellement vérifiée | `if (a > 0) { ⏎      ⏎ }` | oui | oui | — | — |
| 3 | Branche sinon si | traduite et placée, non exercée | `else if (a > 5) { ⏎      ⏎ }` | oui | non | — | — |
| 3 | Branche sinon | traduite et placée, non exercée | `else { ⏎      ⏎ }` | oui | non | — | — |
| 3 | Opérateurs logiques | partiellement vérifiée | `if (((a > 0) && (!fini))) { ⏎      ⏎ }` | oui | oui | — | — |
| 3 | Boucle à test initial | partiellement vérifiée | `while (i < 3) { ⏎      ⏎ }` | oui | oui | — | — |
| 3 | Boucle à test final | traduite et placée, non exercée | `do { ⏎      ⏎ } while (i < 3);` | oui | non | — | — |
| 3 | Boucle pour | traduite et placée, non exercée | `for (i = 0; i < 3; i = (i + 1)) { ⏎      ⏎ }` | oui | non | — | — |
| 3 | Sortie de boucle | traduite et placée, non exercée | `break;` | oui | non | — | — |
| 3 | Itération suivante | traduite et placée, non exercée | `continue;` | oui | non | — | — |
| 3 | Aiguillage | partiellement vérifiée | `switch (jour) { ⏎      ⏎ }` | oui | oui | — | — |
| 3 | Étiquette entière | partiellement vérifiée | `case 5:` | oui | oui | — | — |
| 3 | Étiquette caractère | traduite et placée, non exercée | `case 'A':` | oui | non | — | — |
| 3 | Cas par défaut | partiellement vérifiée | `default:` | oui | oui | — | — |
| 3 | Sortie d’aiguillage | partiellement vérifiée | `break;` | oui | oui | — | — |
| 4 | Définition de fonction | partiellement vérifiée | `int f(void) { ⏎      ⏎ }` | oui | oui | — | — |
| 4 | Fonction sans retour | partiellement vérifiée | `void f(void) { ⏎      ⏎ }` | oui | oui | — | — |
| 4 | Paramètres explicites | partiellement vérifiée | `int f(int a, double b) { ⏎      ⏎ }` | oui | oui | — | — |
| 4 | Retour de valeur | partiellement vérifiée | `return 0;` | oui | oui | — | — |
| 4 | Retour d’expression | partiellement vérifiée | `return (a + 1);` | oui | oui | — | — |
| 4 | Appel sans résultat | partiellement vérifiée | `f(1);` | oui | oui | — | — |
| 4 | Appel avec résultat | partiellement vérifiée | `x = f(1);` | oui | oui | — | — |
| 5 | Type caractère | traduite et placée, non exercée | `char c;` | oui | non | — | — |
| 5 | Littéral caractère | traduite et placée, non exercée | `char c = 'A';` | oui | non | — | — |
| 5 | Affichage caractère | traduite et placée, non exercée | `printf("%c", c);` | oui | non | — | — |
| 5 | Tableau à dimension explicite | partiellement vérifiée | `int t[3];` | oui | oui | — | — |
| 5 | Affectation d’élément | partiellement vérifiée | `t[0] = 5;` | oui | oui | — | — |
| 5 | Affichage d’élément | traduite et placée, non exercée | `printf("%d", t[0]);` | oui | non | — | — |
| 5 | Indexation en expression | partiellement vérifiée | `n = (t[i] + 1);` | oui | oui | — | — |
| 5 | Chaîne initialisée | partiellement vérifiée | `char s[6] = "hello";` | oui | oui | — | — |
| 5 | Affichage de chaîne | partiellement vérifiée | `printf("%s", s);` | oui | oui | — | — |
| 5 | Caractère nul en condition | partiellement vérifiée | `while (s[i] != '\0') { ⏎      ⏎ }` | oui | oui | — | — |
| 5 | Déclaration de pointeur | partiellement vérifiée | `int *p;` | oui | oui | — | — |
| 5 | Prise d’adresse | partiellement vérifiée | `p = &x;` | oui | oui | — | — |
| 5 | Déréférencement en lecture | partiellement vérifiée | `printf("%d", *p);` | oui | oui | — | — |
| 5 | Déréférencement en écriture | traduite et placée, non exercée | `*p = 5;` | oui | non | — | — |
| 5 | Relation tableau/pointeur | partiellement vérifiée | `n = (*(t + i));` | oui | oui | — | — |
| 6 | Définition de structure | partiellement vérifiée | `struct Point { ⏎      ⏎ };` | oui | oui | — | — |
| 6 | Champ scalaire | partiellement vérifiée | `int x;` | oui | oui | — | — |
| 6 | Champ structure | partiellement vérifiée | `struct Date d;` | oui | oui | — | — |
| 6 | Champ pointeur | partiellement vérifiée | `struct Point *suivant;` | oui | oui | — | — |
| 6 | CHAMP TABLEAU | bloquée | REFUS UNEXPECTED_TEXT | — | non | — | — |
| 6 | Variable de type structure | traduite et placée, non exercée | `struct Point p;` | oui | non | — | — |
| 6 | Pointeur de structure | partiellement vérifiée | `struct Point *q;` | oui | oui | — | — |
| 6 | Accès par point | partiellement vérifiée | `printf("%d", p.x);` | oui | oui | — | — |
| 6 | Accès par flèche | partiellement vérifiée | `printf("%d", q->x);` | oui | oui | — | — |
| 6 | Accès en expression | partiellement vérifiée | `n = q->x;` | oui | oui | — | — |
| 6 | Taille d’un type | partiellement vérifiée | `printf("%zu", sizeof(struct Point));` | oui | oui | — | — |
| 6 | Allocation dynamique | partiellement vérifiée | `p = malloc(4 * sizeof(int));` | oui | oui | — | — |
| 6 | Réallocation | traduite et placée, non exercée | `q = realloc(p, 8 * sizeof(int));` | oui | non | — | — |
| 6 | Libération | partiellement vérifiée | `free(p);` | oui | oui | — | — |
| 7 | Déclaration de flux | partiellement vérifiée | `FILE *f;` | oui | oui | — | — |
| 7 | Ouverture avec mode | partiellement vérifiée | `f = fopen("d.txt", "w");` | oui | oui | — | — |
| 7 | Écriture de texte | partiellement vérifiée | `fprintf(f, "%s", "a");` | oui | oui | — | — |
| 7 | Écriture de valeur | partiellement vérifiée | `fprintf(f, "%d", x);` | oui | oui | — | — |
| 7 | Lecture d’entier | traduite et placée, non exercée | `fscanf(f, "%d", &x);` | oui | non | — | — |
| 7 | Fin de fichier | traduite et placée, non exercée | `if (feof(f)) { ⏎      ⏎ }` | oui | non | — | — |
| 7 | Fermeture | partiellement vérifiée | `fclose(f);` | oui | oui | — | — |
| 7 | LECTURE DE CHAÎNE | bloquée | REFUS UNKNOWN_FORMULATION | — | non | — | — |
| 7 | Inclusion locale | partiellement vérifiée | `#include "carnet.h"` | oui | oui | — | — |
| 7 | Garde d’en-tête, ouverture | partiellement vérifiée | `#ifndef H ⏎ #define H` | oui | oui | — | — |
| 7 | Garde d’en-tête, fermeture | partiellement vérifiée | `#endif` | oui | oui | — | — |
| 7 | Prototype | partiellement vérifiée | `int f(void);` | oui | oui | — | — |
| 7 | Liaison externe | partiellement vérifiée | `extern int v;` | oui | oui | — | — |
| 7 | Liaison interne | partiellement vérifiée | `static int v;` | oui | oui | — | — |
| 7 | DÉFINITION STATIC | bloquée | REFUS UNKNOWN_FORMULATION | — | non | — | — |
| 8 | Synonyme de type | partiellement vérifiée | `typedef struct Noeud Noeud;` | oui | oui | — | — |
| 8 | Tableau de structures | partiellement vérifiée | `struct Point t[3];` | oui | oui | — | — |
| 8 | Élément de tableau de structures | partiellement vérifiée | `n = t[i].x;` | oui | oui | — | — |
| 8 | Recherche par composition | partiellement vérifiée | `if (t[i] > meilleure) { ⏎      ⏎ }` | oui | oui | — | — |
| 8 | Échange par variable temporaire | partiellement vérifiée | `t[0] = t[1];` | oui | oui | — | — |
| 8 | INITIALISEUR ENTRE ACCOLADES | bloquée | REFUS UNEXPECTED_TEXT | — | non | — | — |
| 9 | Inclusion assert.h | partiellement vérifiée | `#include <assert.h>` | oui | oui | — | — |
| 9 | Assertion | partiellement vérifiée | `assert(n > 0);` | oui | oui | — | — |
| 9 | Assertion : affectation refusée | refus attendu, obtenu | REFUS ASSIGNMENT_IN_CONDITION | — | non | — | — |
| 9 | Constante qualifiée | partiellement vérifiée | `const int MAX = 20;` | oui | oui | — | — |
| 9 | LIMITS.H | bloquée | REFUS UNSUPPORTED_HEADER | — | non | — | — |
| 9 | MACRO DE LIMITE | bloquée | REFUS UNKNOWN_FORMULATION | — | non | — | — |

## Décompte

| État | Nombre |
|---|---|
| Partiellement vérifiée — traduite, placée **et** exercée | 65 |
| Partiellement vérifiée — traduite et placée, **non exercée** | 19 |
| Refus attendu, obtenu | 1 |
| **Bloquée** | **6** |
| **Vérifiée** (traduite, placée, exercée, compilée, exécutée) | **0** |
| Total | 91 |
