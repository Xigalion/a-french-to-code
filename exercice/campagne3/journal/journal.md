# Journal d’exécution de l’exercice intégrateur

Produit par `exercice/executer.mjs`, qui appelle `translate` puis
`planPlacement` du moteur réel et applique l’unique édition du plan.

## Compteurs

| | |
|---|---|
| Instructions insérées | **126** |
| Refus à la traduction | **0** |
| Refus au placement | **0** |
| Informations pédagogiques émises | 108 |
| Avertissements de calcul émis | 0 |
| **Gestes d’éditeur hors C-A** (ligne blanche ajoutée) | **15** |

## Blocages recensés par l’énoncé

| Blocage annoncé | Verdict | Détail |
|---|---|---|
| tableau à deux dimensions | **REFUSE** | `UNEXPECTED_TEXT` |
| liste d’initialisation | **REFUSE** | `UNEXPECTED_TEXT` |
| lecture de chaîne sans borne | **REFUSE** | `UNKNOWN_FORMULATION` |
| commande de limite | **REFUSE** | `UNKNOWN_FORMULATION` |
| soustraction de pointeurs | **ACCEPTE** | `n = (p - q);` |

## Déroulé


### classement.c

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Crée un entier nommé base de valeur 20.` → `int base = 20;`
- `Déclare un entier nommé calcul.` → `int calcul;`
- `Affecte à calcul le résultat de "base + 3 * 2".` → `calcul = (base + (3 * 2));`
- `Affiche calcul en hexadécimal.` → `printf("%x", calcul);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Crée un bloc si "calcul > 100".` → `if (calcul > 100) {
    
}`
- `Affiche le texte "grand".` → `printf("%s", "grand");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Ajoute une branche sinon si "calcul > 20".` → `else if (calcul > 20) {
    
}`
- `Affiche le texte "moyen".` → `printf("%s", "moyen");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Ajoute une branche sinon.` → `else {
    
}`
- `Affiche le texte "petit".` → `printf("%s", "petit");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Déclare un entier nommé i.` → `int i;`
- `Affecte la valeur 0 à i.` → `i = 0;`
- `Crée une boucle avec test final tant que "i < 3".` → `do {
    
} while (i < 3);`  — info DO_WHILE_POSTTEST
- `Affecte à i le résultat numérique de "i + 1".` → `i = (i + 1);`
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affiche la valeur de i.` → `printf("%d", i);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Déclare un entier nommé j.` → `int j;`
- `Crée une boucle pour j de valeur initiale "0" tant que "j < 5" avec mise à jour "j + 1".` → `for (j = 0; j < 5; j = (j + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Crée un bloc si "j == 1".` → `if (j == 1) {
    
}`
- `Passe à l’itération suivante de la boucle la plus intérieure.` → `continue;`
- *(geste d’éditeur : ligne blanche créée à l’indentation 8 — C-A ne le fait pas)*
- `Crée un bloc si "j == 4".` → `if (j == 4) {
    
}`
- `Sors de la boucle la plus intérieure.` → `break;`
- *(geste d’éditeur : ligne blanche créée à l’indentation 8 — C-A ne le fait pas)*
- `Affiche la valeur de j.` → `printf("%d", j);`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Crée un caractère nommé lettre de valeur 'A'.` → `char lettre = 'A';`  — info CHARACTER_IS_INTEGER
- `Déclare un caractère nommé copie.` → `char copie;`  — info CHARACTER_STORAGE
- `Crée un aiguillage sur "lettre".` → `switch (lettre) {
    
}`  — info SWITCH_INTEGER_ONLY
- `Ajoute un cas pour le caractère 'A'.` → `case 'A':`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT
- `Affecte le caractère 'B' à copie.` → `copie = 'B';`  — info CHARACTER_IS_INTEGER
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- `Ajoute le cas par défaut.` → `default:`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT, DEFAULT_OPTIONAL
- `Affecte le caractère 'Z' à copie.` → `copie = 'Z';`  — info CHARACTER_IS_INTEGER
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affiche le caractère copie.` → `printf("%c", copie);`  — info CHARACTER_FORMAT, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Déclare un tableau de type int nommé t de dimension 3.` → `int t[3];`  — info ARRAY_NOT_ASSIGNABLE
- `Affecte la valeur 7 à l’élément "0" de t.` → `t[0] = 7;`  — info INDEX_NOT_CHECKED
- `Affiche l’élément "0" de t.` → `printf("%d", t[0]);`  — info INDEX_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Déclare un entier nommé n.` → `int n;`
- `Déclare un pointeur de type int nommé p.` → `int *p;`  — info UNINITIALIZED_POINTER, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affecte l’adresse de n à p.` → `p = &n;`  — info ADDRESS_OF, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affecte la valeur 5 à la valeur pointée par p.` → `*p = 5;`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED
- `Affiche la valeur de n.` → `printf("%d", n);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*classement.c : 117 lignes, 3185 octets.*

### inventaire.c

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue la bibliothèque stdlib.h.` → `#include <stdlib.h>`  — info HEADER_DECLARES_ONLY
- `Déclare une structure nommée Point.` → `struct Point {
    
};`  — info STRUCT_TAG_NEEDS_KEYWORD, STRUCT_LAYOUT
- `Ajoute un champ de type int nommé x.` → `int x;`
- `Ajoute un champ de type int nommé y.` → `int y;`
- `Ajoute un champ de type char nommé initiale.` → `char initiale;`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare une variable de type structure Point nommée centre.` → `struct Point centre;`
- `Affecte la valeur 3 au champ x de centre.` → `centre.x = 3;`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte la valeur 4 au champ y de centre.` → `centre.y = 4;`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte le caractère 'C' au champ initiale de centre.` → `centre.initiale = 'C';`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affiche le champ x de centre.` → `printf("%d", centre.x);`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche le champ initiale de centre.` → `printf("%d", centre.initiale);`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Déclare un pointeur de type int nommé tab.` → `int *tab;`  — info UNINITIALIZED_POINTER, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affecte à tab l’allocation de 2 éléments de type int.` → `tab = malloc(2 * sizeof(int));`  — info ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, ALLOCATION_NOT_INITIALIZED
- `Crée un bloc si "tab == NULL".` → `if (tab == NULL) {
    
}`
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affecte la valeur 1 à l’élément "0" de tab.` → `tab[0] = 1;`  — info INDEX_NOT_CHECKED
- `Déclare un pointeur de type int nommé grand.` → `int *grand;`  — info UNINITIALIZED_POINTER, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affecte à grand la réallocation de tab pour 4 éléments de type int.` → `grand = realloc(tab, 4 * sizeof(int));`  — info ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, REALLOC_MAY_MOVE
- `Crée un bloc si "grand == NULL".` → `if (grand == NULL) {
    
}`
- `Libère la mémoire pointée par tab.` → `free(tab);`  — info FREE_ONCE
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Affecte la valeur 9 à l’élément "2" de grand.` → `grand[2] = 9;`  — info INDEX_NOT_CHECKED
- `Affiche l’élément "2" de grand.` → `printf("%d", grand[2]);`  — info INDEX_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Libère la mémoire pointée par grand.` → `free(grand);`  — info FREE_ONCE
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*inventaire.c : 70 lignes, 2012 octets.*

### journal.c

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un fichier nommé sortie.` → `FILE *sortie;`  — info FILE_MUST_BE_CLOSED
- `Affecte à sortie l’ouverture du fichier "donnees.txt" en écriture.` → `sortie = fopen("donnees.txt", "w");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Crée un bloc si "sortie == NULL".` → `if (sortie == NULL) {
    
}`
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Déclare un entier nommé ecrit.` → `int ecrit;`
- `Affecte la valeur 42 à ecrit.` → `ecrit = 42;`
- `Écris la valeur de ecrit dans le fichier sortie.` → `fprintf(sortie, "%d", ecrit);`
- `Ferme le fichier sortie.` → `fclose(sortie);`  — info FILE_MUST_BE_CLOSED
- `Déclare un fichier nommé entree.` → `FILE *entree;`  — info FILE_MUST_BE_CLOSED
- `Affecte à entree l’ouverture du fichier "donnees.txt" en lecture.` → `entree = fopen("donnees.txt", "r");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Crée un bloc si "entree == NULL".` → `if (entree == NULL) {
    
}`
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Déclare un entier nommé valeur.` → `int valeur;`
- `Lis un entier depuis le fichier entree dans valeur.` → `fscanf(entree, "%d", &valeur);`  — info SCANF_NEEDS_ADDRESS
- `Affiche la valeur de valeur.` → `printf("%d", valeur);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Crée un bloc si la fin du fichier entree est atteinte.` → `if (feof(entree)) {
    
}`  — info EOF_AFTER_READ
- `Affiche le texte "fin".` → `printf("%s", "fin");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Ferme le fichier entree.` → `fclose(entree);`  — info FILE_MUST_BE_CLOSED
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*journal.c : 55 lignes, 1557 octets.*

### texte.c

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée une fonction interne nommée longueurMax qui retourne un int.` → `static int longueurMax(void) {
    
}`  — info FUNCTION_SCOPE, INTERNAL_LINKAGE
- `Retourne la valeur 16.` → `return 16;`  — info RETURN_ENDS_FUNCTION
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un fichier nommé sortie.` → `FILE *sortie;`  — info FILE_MUST_BE_CLOSED
- `Affecte à sortie l’ouverture du fichier "texte.txt" en écriture.` → `sortie = fopen("texte.txt", "w");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Crée un bloc si "sortie == NULL".` → `if (sortie == NULL) {
    
}`
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Écris le texte "bonjour" dans le fichier sortie.` → `fprintf(sortie, "%s", "bonjour");`
- `Ferme le fichier sortie.` → `fclose(sortie);`  — info FILE_MUST_BE_CLOSED
- `Déclare un fichier nommé entree.` → `FILE *entree;`  — info FILE_MUST_BE_CLOSED
- `Affecte à entree l’ouverture du fichier "texte.txt" en lecture.` → `entree = fopen("texte.txt", "r");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Crée un bloc si "entree == NULL".` → `if (entree == NULL) {
    
}`
- `Retourne la valeur 1.` → `return 1;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche créée à l’indentation 4 — C-A ne le fait pas)*
- `Crée un tableau de type char nommé ligne de dimension 16 avec le texte "".` → `char ligne[16] = "";`  — info NULL_TERMINATOR, ARRAY_SIZE_VS_LENGTH
- `Lis une chaîne de dimension 16 depuis le fichier entree dans ligne.` → `fgets(ligne, 16, entree);`  — info FGETS_KEEPS_NEWLINE, FGETS_BOUND_NOT_CHECKED
- `Affiche la chaîne ligne.` → `printf("%s", ligne);`  — info STRING_TERMINATOR_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Ferme le fichier entree.` → `fclose(entree);`  — info FILE_MUST_BE_CLOSED
- `Déclare un entier nommé max.` → `int max;`
- `Affecte à max le résultat de l’appel de longueurMax.` → `max = longueurMax();`  — info CALL_NOT_RESOLVED
- `Affiche la valeur de max.` → `printf("%d", max);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*texte.c : 57 lignes, 1674 octets.*
