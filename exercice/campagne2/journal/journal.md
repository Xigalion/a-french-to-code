# Journal d’exécution de l’exercice intégrateur

Produit par `exercice/executer.mjs`, qui appelle `translate` puis
`planPlacement` du moteur réel et applique l’unique édition du plan.

## Compteurs

| | |
|---|---|
| Instructions insérées | **100** |
| Refus à la traduction | **0** |
| Refus au placement | **0** |
| Informations pédagogiques émises | 108 |
| Avertissements de calcul émis | 1 |
| **Gestes d’éditeur hors C-A** (ligne blanche ajoutée) | **5** |

## Blocages recensés par l’énoncé

| Blocage annoncé | Verdict | Détail |
|---|---|---|
| macro de limite : aucune commande dédiée | **REFUSE** | `UNKNOWN_FORMULATION` |
| définition static | **REFUSE** | `UNKNOWN_FORMULATION` |
| lecture de chaîne depuis un fichier | **REFUSE** | `UNKNOWN_FORMULATION` |
| initialiseur entre accolades | **REFUSE** | `UNEXPECTED_TEXT` |
| arithmétique de pointeur non signalée | **ACCEPTE** | `p = (p + 1);` |
| profil entier fermé à l’indexation | **REFUSE** | `INVALID_EXPRESSION_TOKEN` |

## Déroulé


### carnet.h

- `Ouvre la protection d’en-tête nommée CARNET_H.` → `#ifndef CARNET_H
#define CARNET_H`  — info GUARD_PREVENTS_DOUBLE_INCLUSION, GUARD_NOT_EVALUATED
- `Déclare une structure nommée Eleve.` → `struct Eleve {
    
};`  — info STRUCT_TAG_NEEDS_KEYWORD, STRUCT_LAYOUT
- `Ajoute un champ de type int nommé note.` → `int note;`
- `Ajoute un champ de type char nommé initiale.` → `char initiale;`
- `Ajoute un champ de type char nommé nom de dimension 32.` → `char nom[32];`  — info ARRAY_NOT_ASSIGNABLE, STRUCT_ARRAY_LAYOUT, CHAR_ARRAY_NOT_STRING
- `Ajoute un champ pointeur de type structure Eleve nommé suivant.` → `struct Eleve *suivant;`  — info POINTER_FIELD_OWNS_NOTHING
- `Déclare le synonyme Eleve pour la structure Eleve.` → `typedef struct Eleve Eleve;`  — info TYPEDEF_IS_AN_ALIAS
- `Déclare le prototype d’une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.` → `double moyenneDe(int total, int n);`  — info PROTOTYPE_DECLARES_ONLY
- `Déclare le prototype d’une fonction nommée meilleureNote qui retourne un int et prend un int nommé n.` → `int meilleureNote(int n);`  — info PROTOTYPE_DECLARES_ONLY
- `Déclare le prototype d’une fonction nommée mention qui ne retourne rien et prend un int nommé note.` → `void mention(int note);`  — info PROTOTYPE_DECLARES_ONLY
- `Déclare la variable externe de type int nommée compteur.` → `extern int compteur;`  — info EXTERNAL_LINKAGE
- `Ferme la protection d’en-tête.` → `#endif`

*carnet.h : 34 lignes, 1088 octets.*

### calcul.c

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue la bibliothèque assert.h.` → `#include <assert.h>`
- `Inclue l’en-tête "carnet.h".` → `#include "carnet.h"`  — info LOCAL_HEADER_SEARCH
- `Déclare une variable de type int nommée compteur.` → `int compteur;`
- `Déclare une constante de type int nommée MAX_NOTE avec le résultat de "20".` → `const int MAX_NOTE = 20;`  — info CONST_IS_NOT_A_MACRO
- `Crée une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.` → `double moyenneDe(int total, int n) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Vérifie que "n > 0".` → `assert(n > 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Retourne le résultat numérique de "(double) total / n".` → `return (((double) total) / n);`  — info RETURN_ENDS_FUNCTION
- `Crée une fonction nommée verifieNote qui ne retourne rien et prend un int nommé note.` → `void verifieNote(int note) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Vérifie que "note <= MAX_NOTE".` → `assert(note <= MAX_NOTE);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Crée une fonction nommée dangereuse qui retourne un double et prend un int nommé total.` → `double dangereuse(int total) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Retourne le résultat numérique de "total / 0".` → `return (total / 0);`  — info RETURN_ENDS_FUNCTION · **avertissement ZERO_DIVISOR/undetermined**

*calcul.c : 35 lignes, 1036 octets.*

### carnet.c

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue la bibliothèque stdlib.h.` → `#include <stdlib.h>`  — info HEADER_DECLARES_ONLY
- `Inclue la bibliothèque assert.h.` → `#include <assert.h>`
- `Inclue l’en-tête "carnet.h".` → `#include "carnet.h"`  — info LOCAL_HEADER_SEARCH
- `Inclue la bibliothèque limits.h.` → `#include <limits.h>`  — info LIMITS_ARE_IMPLEMENTATION_DEFINED, LIMIT_MACROS_NOT_KNOWN
- `Déclare une variable de type int nommée compteur.` → `int compteur;`
- `Crée une fonction nommée meilleureNote qui retourne un int et prend un int nommé n.` → `int meilleureNote(int n) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Déclare un tableau de type int nommé notes de dimension 3.` → `int notes[3];`  — info ARRAY_NOT_ASSIGNABLE
- `Déclare un entier nommé i.` → `int i;`
- `Déclare un entier nommé meilleure.` → `int meilleure;`
- `Affecte la valeur 12 à l’élément "0" de notes.` → `notes[0] = 12;`  — info INDEX_NOT_CHECKED
- `Affecte la valeur 17 à l’élément "1" de notes.` → `notes[1] = 17;`  — info INDEX_NOT_CHECKED
- `Affecte la valeur 9 à l’élément "2" de notes.` → `notes[2] = 9;`  — info INDEX_NOT_CHECKED
- `Affecte la valeur 0 à meilleure.` → `meilleure = 0;`
- `Affecte la valeur 0 à i.` → `i = 0;`
- `Crée une boucle tant que "i < n".` → `while (i < n) {
    
}`  — info WHILE_PRETEST
- `Crée un bloc si "notes[i] > meilleure".` → `if (notes[i] > meilleure) {
    
}`  — info INDEX_NOT_CHECKED
- `Affecte à meilleure le résultat numérique de "notes[i]".` → `meilleure = notes[i];`  — info INDEX_NOT_CHECKED
- *(geste d’éditeur : ligne blanche créée à l’indentation 8 — C-A ne le fait pas)*
- `Affecte à i le résultat numérique de "i + 1".` → `i = (i + 1);`
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Retourne le résultat numérique de "meilleure".` → `return meilleure;`  — info RETURN_ENDS_FUNCTION
- `Crée une fonction nommée mention qui ne retourne rien et prend un int nommé note.` → `void mention(int note) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Crée un aiguillage sur "note".` → `switch (note) {
    
}`  — info SWITCH_INTEGER_ONLY
- `Ajoute un cas pour la valeur 20.` → `case 20:`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT
- `Affiche le texte "parfait".` → `printf("%s", "parfait");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- `Ajoute le cas par défaut.` → `default:`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT, DEFAULT_OPTIONAL
- `Affiche le texte "a revoir".` → `printf("%s", "a revoir");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé n.` → `int n;`
- `Affecte la valeur 3 à n.` → `n = 3;`
- `Vérifie que "n > 0".` → `assert(n > 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Affiche le texte "Carnet de notes".` → `printf("%s", "Carnet de notes");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Crée un tableau de type char nommé titre de dimension 7 avec le texte "Carnet".` → `char titre[7] = "Carnet";`  — info NULL_TERMINATOR, ARRAY_SIZE_VS_LENGTH
- `Affiche la chaîne titre.` → `printf("%s", titre);`  — info STRING_TERMINATOR_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Déclare un entier nommé i.` → `int i;`
- `Affecte la valeur 0 à i.` → `i = 0;`
- `Crée une boucle tant que "titre[i] != '\0'".` → `while (titre[i] != '\0') {
    
}`  — info INDEX_NOT_CHECKED, CHARACTER_IS_INTEGER, WHILE_PRETEST
- `Affiche le caractère de l’élément "i" de titre.` → `printf("%c", titre[i]);`  — info INDEX_NOT_CHECKED, ELEMENT_CHARACTER_FORMAT, OUTPUT_HAS_NO_SEPARATOR
- `Affecte à i le résultat numérique de "i + 1".` → `i = (i + 1);`
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Déclare un pointeur de type int nommé p.` → `int *p;`  — info UNINITIALIZED_POINTER, POINTER_VS_OBJECT
- `Affecte l’adresse de n à p.` → `p = &n;`  — info ADDRESS_OF, POINTER_VS_OBJECT
- `Affiche la valeur pointée par p.` → `printf("%d", *p);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Déclare un tableau de type int nommé notes de dimension 3.` → `int notes[3];`  — info ARRAY_NOT_ASSIGNABLE
- `Affecte la valeur 12 à l’élément "0" de notes.` → `notes[0] = 12;`  — info INDEX_NOT_CHECKED
- `Déclare un entier nommé premiere.` → `int premiere;`
- `Affecte à premiere le résultat numérique de "*(notes + 0)".` → `premiere = (*(notes + 0));`  — info DEREFERENCE_MEANING, ARRAY_POINTER_EQUIVALENCE, POINTER_ARITHMETIC_LIMITS, OUT_OF_BOUNDS_UNDEFINED, OFFSET_TYPE_NOT_CHECKED
- `Affiche la valeur de premiere.` → `printf("%d", premiere);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Déclare un pointeur de type structure Eleve nommé eleves.` → `struct Eleve *eleves;`
- `Affecte à eleves l’allocation de n éléments de type structure Eleve.` → `eleves = malloc(n * sizeof(struct Eleve));`  — info ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, ALLOCATION_NOT_INITIALIZED
- `Crée un bloc si "eleves == NULL".` → `if (eleves == NULL) {
    
}`
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affiche la taille du type structure Eleve.` → `printf("%zu", sizeof(struct Eleve));`  — info SIZEOF_IS_BYTES, OUTPUT_HAS_NO_SEPARATOR
- `Vérifie que "eleves != NULL".` → `assert(eleves != NULL);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Affecte la valeur 15 au champ note pointé par eleves.` → `eleves->note = 15;`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affiche le champ note pointé par eleves.` → `printf("%d", eleves->note);`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Déclare un entier nommé temporaire.` → `int temporaire;`
- `Affecte à temporaire le résultat numérique de "notes[0]".` → `temporaire = notes[0];`  — info INDEX_NOT_CHECKED
- `Affecte à l’élément "0" de notes le résultat numérique de "notes[1]".` → `notes[0] = notes[1];`  — info INDEX_NOT_CHECKED
- `Affecte à l’élément "1" de notes le résultat numérique de "temporaire".` → `notes[1] = temporaire;`  — info INDEX_NOT_CHECKED
- `Déclare une variable de type double nommée moyenne.` → `double moyenne;`
- `Affecte à moyenne le résultat de l’appel de moyenneDe avec "41" et "n".` → `moyenne = moyenneDe(41, n);`  — info CALL_NOT_RESOLVED
- `Affiche moyenne en notation fixe avec 2 décimales.` → `printf("%.2f", moyenne);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Appelle mention avec "17".` → `mention(17);`  — info CALL_NOT_RESOLVED
- `Déclare un entier nommé meilleure.` → `int meilleure;`
- `Affecte à meilleure le résultat de l’appel de meilleureNote avec "n".` → `meilleure = meilleureNote(n);`  — info CALL_NOT_RESOLVED
- `Affiche la valeur de meilleure.` → `printf("%d", meilleure);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Déclare un entier nommé plafond.` → `int plafond;`
- `Affecte à plafond le résultat numérique de "INT_MAX".` → `plafond = INT_MAX;`
- `Affiche la valeur de plafond.` → `printf("%d", plafond);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Déclare un fichier nommé sortie.` → `FILE *sortie;`  — info FILE_MUST_BE_CLOSED
- `Affecte à sortie l’ouverture du fichier "resultat.txt" en écriture.` → `sortie = fopen("resultat.txt", "w");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Écris le texte "Meilleure note" dans le fichier sortie.` → `fprintf(sortie, "%s", "Meilleure note");`
- `Écris la valeur de meilleure dans le fichier sortie.` → `fprintf(sortie, "%d", meilleure);`
- `Ferme le fichier sortie.` → `fclose(sortie);`  — info FILE_MUST_BE_CLOSED
- `Libère la mémoire pointée par eleves.` → `free(eleves);`  — info FREE_ONCE
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 0 — C-A ne le fait pas)*

*carnet.c : 174 lignes, 5608 octets.*
