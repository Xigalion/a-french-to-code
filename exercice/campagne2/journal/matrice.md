# Matrice de couverture des compétences du modèle 1

Générée par `exercice/matrice.mjs` : chaque ligne est une **mesure**.

Les cinq preuves, et comment chacune est obtenue :

- **P1 traduction** : `translate()` accepte la phrase sonde.
- **P2 placement** : `planPlacement()` produit un plan dans un document représentatif.
- **P3 compilation** : le fichier contenant ce genre d’instruction a été compilé
  par **GCC 16.2.0** en `-std=c17 -Wall -Wextra -pedantic`.
- **P4 exécution** : le programme le contenant a tourné, **code de sortie 0**,
  sortie conforme à la prédiction de l’audit.
- **P5 diagnostic** : une information pédagogique est émise, ou le refus porte
  un intervalle non vide dans la phrase.

**P3 et P4 sont des preuves collectives**, au niveau du fichier et du
programme, non isolées instruction par instruction. Preuves brutes dans
`journal/compilation.txt`.

| Dom. | Compétence | État | C produit | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|---|---|
| 1 | Instruction de base, variable entière | vérifiée | `int x;` | oui | oui | oui | oui | — |
| 1 | Initialisation à la déclaration | traduite et placée, non exercée | `int x = 20;` | oui | oui | — | — | — |
| 1 | Affectation | vérifiée | `x = 5;` | oui | oui | oui | oui | — |
| 1 | Affichage d’une valeur | vérifiée | `printf("%d", x);` | oui | oui | oui | oui | oui |
| 1 | Affichage d’un texte | vérifiée | `printf("%s", "bonjour");` | oui | oui | oui | oui | oui |
| 1 | Inclusion de bibliothèque | vérifiée | `#include <stdio.h>` | oui | oui | oui | oui | — |
| 1 | Fonction principale | vérifiée | `int main(void) { ⏎      ⏎ }` | oui | oui | oui | oui | — |
| 2 | Expression entière et priorités | traduite et placée, non exercée | `x = (a + (b * 2));` | oui | oui | — | — | — |
| 2 | Types numériques explicites | vérifiée | `double x;` | oui | oui | oui | oui | — |
| 2 | Conversion explicite | vérifiée | `n = ((int) 1.5);` | oui | oui | oui | oui | — |
| 2 | Format non signé | vérifiée | `printf("%u", x);` | oui | oui | oui | oui | oui |
| 2 | Format fixe avec précision | vérifiée | `printf("%.2f", x);` | oui | oui | oui | oui | oui |
| 2 | Format hexadécimal | traduite et placée, non exercée | `printf("%x", x);` | oui | oui | — | — | oui |
| 2 | Fiabilité : diviseur nul signalé | vérifiée | `n = (1 / 0);` | oui | oui | oui | oui | — |
| 3 | Condition et bloc | vérifiée | `if (a > 0) { ⏎      ⏎ }` | oui | oui | oui | oui | — |
| 3 | Branche sinon si | traduite et placée, non exercée | `else if (a > 5) { ⏎      ⏎ }` | oui | oui | — | — | — |
| 3 | Branche sinon | traduite et placée, non exercée | `else { ⏎      ⏎ }` | oui | oui | — | — | — |
| 3 | Opérateurs logiques | vérifiée | `if (((a > 0) && (!fini))) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 3 | Boucle à test initial | vérifiée | `while (i < 3) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 3 | Boucle à test final | traduite et placée, non exercée | `do { ⏎      ⏎ } while (i < 3);` | oui | oui | — | — | oui |
| 3 | Boucle pour | traduite et placée, non exercée | `for (i = 0; i < 3; i = (i + 1)) { ⏎      ⏎ }` | oui | oui | — | — | oui |
| 3 | Sortie de boucle | traduite et placée, non exercée | `break;` | oui | oui | — | — | — |
| 3 | Itération suivante | traduite et placée, non exercée | `continue;` | oui | oui | — | — | — |
| 3 | Aiguillage | vérifiée | `switch (jour) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 3 | Étiquette entière | vérifiée | `case 5:` | oui | oui | oui | oui | oui |
| 3 | Étiquette caractère | traduite et placée, non exercée | `case 'A':` | oui | oui | — | — | oui |
| 3 | Cas par défaut | vérifiée | `default:` | oui | oui | oui | oui | oui |
| 3 | Sortie d’aiguillage | vérifiée | `break;` | oui | oui | oui | oui | oui |
| 4 | Définition de fonction | vérifiée | `int f(void) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 4 | Fonction sans retour | vérifiée | `void f(void) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 4 | Paramètres explicites | vérifiée | `int f(int a, double b) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 4 | Retour de valeur | vérifiée | `return 0;` | oui | oui | oui | oui | oui |
| 4 | Retour d’expression | vérifiée | `return (a + 1);` | oui | oui | oui | oui | oui |
| 4 | Appel sans résultat | vérifiée | `f(1);` | oui | oui | oui | oui | oui |
| 4 | Appel avec résultat | vérifiée | `x = f(1);` | oui | oui | oui | oui | oui |
| 5 | Type caractère | traduite et placée, non exercée | `char c;` | oui | oui | — | — | oui |
| 5 | Littéral caractère | traduite et placée, non exercée | `char c = 'A';` | oui | oui | — | — | oui |
| 5 | Affichage caractère | traduite et placée, non exercée | `printf("%c", c);` | oui | oui | — | — | oui |
| 5 | Tableau à dimension explicite | vérifiée | `int t[3];` | oui | oui | oui | oui | oui |
| 5 | Affectation d’élément | vérifiée | `t[0] = 5;` | oui | oui | oui | oui | oui |
| 5 | Affichage d’élément | traduite et placée, non exercée | `printf("%d", t[0]);` | oui | oui | — | — | oui |
| 5 | Indexation en expression | vérifiée | `n = (t[i] + 1);` | oui | oui | oui | oui | oui |
| 5 | Chaîne initialisée | vérifiée | `char s[6] = "hello";` | oui | oui | oui | oui | oui |
| 5 | Affichage de chaîne | vérifiée | `printf("%s", s);` | oui | oui | oui | oui | oui |
| 5 | Caractère nul en condition | vérifiée | `while (s[i] != '\0') { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 5 | Déclaration de pointeur | vérifiée | `int *p;` | oui | oui | oui | oui | oui |
| 5 | Prise d’adresse | vérifiée | `p = &x;` | oui | oui | oui | oui | oui |
| 5 | Déréférencement en lecture | vérifiée | `printf("%d", *p);` | oui | oui | oui | oui | oui |
| 5 | Déréférencement en écriture | traduite et placée, non exercée | `*p = 5;` | oui | oui | — | — | oui |
| 5 | Relation tableau/pointeur | vérifiée | `n = (*(t + i));` | oui | oui | oui | oui | oui |
| 6 | Définition de structure | vérifiée | `struct Point { ⏎      ⏎ };` | oui | oui | oui | oui | oui |
| 6 | Champ scalaire | vérifiée | `int x;` | oui | oui | oui | oui | — |
| 6 | Champ structure | vérifiée | `struct Date d;` | oui | oui | oui | oui | — |
| 6 | Champ pointeur | vérifiée | `struct Point *suivant;` | oui | oui | oui | oui | oui |
| 6 | CHAMP TABLEAU | vérifiée | `char nom[32];` | oui | oui | oui | oui | oui |
| 6 | Variable de type structure | traduite et placée, non exercée | `struct Point p;` | oui | oui | — | — | — |
| 6 | Pointeur de structure | vérifiée | `struct Point *q;` | oui | oui | oui | oui | — |
| 6 | Accès par point | vérifiée | `printf("%d", p.x);` | oui | oui | oui | oui | oui |
| 6 | Accès par flèche | vérifiée | `printf("%d", q->x);` | oui | oui | oui | oui | oui |
| 6 | Accès en expression | vérifiée | `n = q->x;` | oui | oui | oui | oui | oui |
| 6 | Taille d’un type | vérifiée | `printf("%zu", sizeof(struct Point));` | oui | oui | oui | oui | oui |
| 6 | Allocation dynamique | vérifiée | `p = malloc(4 * sizeof(int));` | oui | oui | oui | oui | oui |
| 6 | Réallocation | traduite et placée, non exercée | `q = realloc(p, 8 * sizeof(int));` | oui | oui | — | — | oui |
| 6 | Libération | vérifiée | `free(p);` | oui | oui | oui | oui | oui |
| 7 | Déclaration de flux | vérifiée | `FILE *f;` | oui | oui | oui | oui | oui |
| 7 | Ouverture avec mode | vérifiée | `f = fopen("d.txt", "w");` | oui | oui | oui | oui | oui |
| 7 | Écriture de texte | vérifiée | `fprintf(f, "%s", "a");` | oui | oui | oui | oui | — |
| 7 | Écriture de valeur | vérifiée | `fprintf(f, "%d", x);` | oui | oui | oui | oui | — |
| 7 | Lecture d’entier | traduite et placée, non exercée | `fscanf(f, "%d", &x);` | oui | oui | — | — | oui |
| 7 | Fin de fichier | traduite et placée, non exercée | `if (feof(f)) { ⏎      ⏎ }` | oui | oui | — | — | oui |
| 7 | Fermeture | vérifiée | `fclose(f);` | oui | oui | oui | oui | oui |
| 7 | LECTURE DE CHAÎNE | bloquée | REFUS UNKNOWN_FORMULATION | — | — | — | — | oui |
| 7 | Inclusion locale | vérifiée | `#include "carnet.h"` | oui | oui | oui | oui | oui |
| 7 | Garde d’en-tête, ouverture | vérifiée | `#ifndef H ⏎ #define H` | oui | oui | oui | oui | oui |
| 7 | Garde d’en-tête, fermeture | vérifiée | `#endif` | oui | oui | oui | oui | — |
| 7 | Prototype | vérifiée | `int f(void);` | oui | oui | oui | oui | oui |
| 7 | Liaison externe | vérifiée | `extern int v;` | oui | oui | oui | oui | oui |
| 7 | Liaison interne | vérifiée | `static int v;` | oui | oui | oui | oui | oui |
| 7 | DÉFINITION STATIC | bloquée | REFUS UNKNOWN_FORMULATION | — | — | — | — | oui |
| 8 | Synonyme de type | vérifiée | `typedef struct Noeud Noeud;` | oui | oui | oui | oui | oui |
| 8 | Tableau de structures | vérifiée | `struct Point t[3];` | oui | oui | oui | oui | oui |
| 8 | Élément de tableau de structures | vérifiée | `n = t[i].x;` | oui | oui | oui | oui | oui |
| 8 | Recherche par composition | vérifiée | `if (t[i] > meilleure) { ⏎      ⏎ }` | oui | oui | oui | oui | oui |
| 8 | Échange par variable temporaire | vérifiée | `t[0] = t[1];` | oui | oui | oui | oui | oui |
| 8 | INITIALISEUR ENTRE ACCOLADES | bloquée | REFUS UNEXPECTED_TEXT | — | — | — | — | oui |
| 9 | Inclusion assert.h | vérifiée | `#include <assert.h>` | oui | oui | oui | oui | — |
| 9 | Assertion | vérifiée | `assert(n > 0);` | oui | oui | oui | oui | oui |
| 9 | Assertion : affectation refusée | refus attendu, obtenu | REFUS ASSIGNMENT_IN_CONDITION | — | — | — | — | oui |
| 9 | Constante qualifiée | vérifiée | `const int MAX = 20;` | oui | oui | oui | oui | oui |
| 9 | LIMITS.H | vérifiée | `#include <limits.h>` | oui | oui | oui | oui | oui |
| 9 | MACRO DE LIMITE | bloquée | REFUS UNKNOWN_FORMULATION | — | — | — | — | oui |

## Décompte des états

| État | Nombre |
|---|---|
| **Vérifiée** — les cinq preuves | 67 |
| Partiellement vérifiée | 0 |
| Traduite et placée, non exercée | 19 |
| Refus attendu, obtenu | 1 |
| **Bloquée** | **4** |
| Total | 91 |

## Complétion pondérée

Poids des preuves : P1 15 %, P2 20 %, **P3 30 %**, P4 20 %, P5 15 %.
Coefficients : fondamentale 3, structurante 2, complémentaire 1.

| Niveau | Compétences | Poids total | Score | Complétion |
|---|---|---|---|---|
| Fondamentale (×3) | 11 | 33 | 29.25 | 88.6 % |
| Structurante (×2) | 38 | 76 | 65.90 | 86.7 % |
| Complémentaire (×1) | 42 | 42 | 31.25 | 74.4 % |
| **Ensemble** | **91** | **151** | **126.40** | **83.7 %** |

## Sensibilité du chiffre

| Hypothèse | Complétion |
|---|---|
| **Mesurée aujourd’hui** | **83.7 %** |
| Si l’exercice employait aussi les 19 compétences non exercées | 93.6 % |
| Si, en plus, les 4 blocages étaient levés | 95.9 % |
| Plafond sans compilateur, pour mémoire | 50,0 % |

L’écart entre la première et la deuxième ligne mesure **mon scénario**,
pas le produit : ces compétences se traduisent et se placent déjà, mais
l’exercice ne les emploie pas. L’écart entre la deuxième et la troisième
mesure les **vraies lacunes** du modèle 1.
