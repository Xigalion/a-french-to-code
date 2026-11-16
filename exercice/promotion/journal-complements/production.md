# Tests complémentaires — production du C brut

Produit par `scripts/ecrirePhrases.mjs` : `translate` puis `planPlacement`,
puis application de l’unique édition du plan. **Aucune retouche manuelle.**

## pointeurs.c — pointeurs, mémoire dynamique, constante et limites

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue la bibliothèque stdlib.h.` → `#include <stdlib.h>`  — info HEADER_DECLARES_ONLY
- `Inclue la bibliothèque assert.h.` → `#include <assert.h>`
- `Inclue la bibliothèque limits.h.` → `#include <limits.h>`  — info LIMITS_ARE_IMPLEMENTATION_DEFINED, LIMIT_MACROS_NOT_KNOWN
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare une constante de type int nommée MAX avec le résultat de "100".` → `const int MAX = 100;`  — info CONST_IS_NOT_A_MACRO
- `Crée un entier nommé x de valeur 7.` → `int x = 7;`
- `Crée un entier nommé a de valeur 2.` → `int a = 2;`
- `Crée une variable de type double nommée ratio avec le résultat de "1.5".` → `double ratio = 1.5;`
- `Déclare un entier nommé n.` → `int n;`
- `Crée un pointeur de type int nommé p avec l’adresse de x.` → `int *p = &x;`  — info ADDRESS_OF, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Déclare un pointeur de type int nommé q.` → `int *q;`  — info UNINITIALIZED_POINTER, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Déclare un pointeur de type int nommé bloc.` → `int *bloc;`  — info UNINITIALIZED_POINTER, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affiche la valeur pointée par p.` → `printf("%d", *p);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte la valeur 5 à la valeur pointée par p.` → `*p = 5;`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED
- `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` → `*p = (a + 1);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED
- `Affecte l’adresse de x à q.` → `q = &x;`  — info ADDRESS_OF, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affiche la valeur pointée par q.` → `printf("%d", *q);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte à n la taille du type double.` → `n = sizeof(double);`  — info SIZEOF_IS_BYTES
- `Affiche n en décimal.` → `printf("%d", n);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche MAX en décimal.` → `printf("%d", MAX);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte à n le résultat numérique de "INT_MAX / 1000000".` → `n = (INT_MAX / 1000000);`
- `Affiche n en décimal.` → `printf("%d", n);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte à bloc l’allocation de 3 éléments de type int.` → `bloc = malloc(3 * sizeof(int));`  — info ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, ALLOCATION_NOT_INITIALIZED
- `Vérifie que "bloc != 0".` → `assert(bloc != 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Affecte la valeur 11 à la valeur pointée par bloc.` → `*bloc = 11;`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED
- `Affecte à q la réallocation de bloc pour 6 éléments de type int.` → `q = realloc(bloc, 6 * sizeof(int));`  — info ALLOCATION_CAN_FAIL, SIZEOF_IS_BYTES, REALLOC_MAY_MOVE
- `Vérifie que "q != 0".` → `assert(q != 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Affiche la valeur pointée par q.` → `printf("%d", *q);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Libère la mémoire pointée par q.` → `free(q);`  — info FREE_ONCE
- `Affiche ratio en notation fixe avec 2 décimales.` → `printf("%.2f", ratio);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*pointeurs.c : 39 instructions, 0 gestes d’éditeur, 48 informations, 0 avertissements, 0 refus.*

## caracteres.c — caractères, éléments, chaîne lue, structure et aiguillage entier

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue la bibliothèque assert.h.` → `#include <assert.h>`
- `Déclare une structure nommée Point.` → `struct Point {
    
};`  — info STRUCT_TAG_NEEDS_KEYWORD, STRUCT_LAYOUT
- `Ajoute un champ de type int nommé x.` → `int x;`
- `Ajoute un champ de type char nommé code.` → `char code;`
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Déclare le synonyme Repere pour la structure Point.` → `typedef struct Point Repere;`  — info TYPEDEF_IS_AN_ALIAS
- `Crée une fonction nommée annonce qui ne retourne rien.` → `void annonce(void) {
    
}`  — info FUNCTION_SCOPE
- `Affiche le texte "ok".` → `printf("%s", "ok");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne.` → `return;`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare une variable de type structure Point nommée p.` → `struct Point p;`
- `Déclare un pointeur de type structure Point nommé q.` → `struct Point *q;`
- `Crée un caractère nommé c de valeur 'A'.` → `char c = 'A';`  — info CHARACTER_IS_INTEGER
- `Déclare un tableau de type char nommé mot de dimension 16.` → `char mot[16];`  — info ARRAY_NOT_ASSIGNABLE, CHAR_ARRAY_NOT_STRING
- `Déclare un tableau de type int nommé t de dimension 3.` → `int t[3];`  — info ARRAY_NOT_ASSIGNABLE
- `Déclare un entier nommé i.` → `int i;`
- `Déclare un fichier nommé f.` → `FILE *f;`  — info FILE_MUST_BE_CLOSED
- `Appelle annonce.` → `annonce();`  — info CALL_NOT_RESOLVED
- `Affecte la valeur 5 au champ x de p.` → `p.x = 5;`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte le caractère 'B' au champ code de p.` → `p.code = 'B';`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte l’adresse de p à q.` → `q = &p;`  — info ADDRESS_OF, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affiche le champ x pointé par q.` → `printf("%d", q->x);`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche le caractère c.` → `printf("%c", c);`  — info CHARACTER_FORMAT, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte la valeur 5 à l’élément "0" de t.` → `t[0] = 5;`  — info INDEX_NOT_CHECKED
- `Affiche l’élément "0" de t.` → `printf("%d", t[0]);`  — info INDEX_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte le caractère 'Z' à l’élément "0" de mot.` → `mot[0] = 'Z';`  — info INDEX_NOT_CHECKED
- `Affiche le caractère de l’élément "0" de mot.` → `printf("%c", mot[0]);`  — info INDEX_NOT_CHECKED, ELEMENT_CHARACTER_FORMAT, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` → `for (i = 0; i < 3; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Crée un bloc si "i == 1".` → `if (i == 1) {
    
}`
- `Passe à l’itération suivante de la boucle la plus intérieure.` → `continue;`
- *(geste d’éditeur : ligne blanche à l’indentation 8)*
- `Crée un aiguillage sur "i".` → `switch (i) {
    
}`  — info SWITCH_INTEGER_ONLY
- `Ajoute un cas pour la valeur 0.` → `case 0:`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT
- `Affiche la valeur de i.` → `printf("%d", i);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- `Ajoute le cas par défaut.` → `default:`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT, DEFAULT_OPTIONAL
- `Affiche le texte "?".` → `printf("%s", "?");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- *(geste d’éditeur : ligne blanche à l’indentation 8)*
- `Crée un bloc si "i == 2".` → `if (i == 2) {
    
}`
- `Sors de la boucle la plus intérieure.` → `break;`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte à f l’ouverture du fichier "mot.txt" en lecture.` → `f = fopen("mot.txt", "r");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Vérifie que "f != 0".` → `assert(f != 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Lis une chaîne de dimension 16 depuis le fichier f dans mot.` → `fgets(mot, 16, f);`  — info FGETS_KEEPS_NEWLINE, FGETS_BOUND_NOT_CHECKED
- `Ferme le fichier f.` → `fclose(f);`  — info FILE_MUST_BE_CLOSED
- `Affiche la chaîne mot.` → `printf("%s", mot);`  — info STRING_TERMINATOR_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*caracteres.c : 51 instructions, 5 gestes d’éditeur, 52 informations, 0 avertissements, 0 refus.*

## calcul.h — en-tête : protection, prototype et liaison externe

- `Ouvre la protection d’en-tête nommée CALCUL_H.` → `#ifndef CALCUL_H
#define CALCUL_H`  — info GUARD_PREVENTS_DOUBLE_INCLUSION, GUARD_NOT_EVALUATED
- `Déclare le prototype d’une fonction nommée double_de qui retourne un int et prend un int nommé a.` → `int double_de(int a);`  — info PROTOTYPE_DECLARES_ONLY
- `Déclare la variable externe de type int nommée compteur.` → `extern int compteur;`  — info EXTERNAL_LINKAGE
- `Ferme la protection d’en-tête.` → `#endif`

*calcul.h : 4 instructions, 0 gestes d’éditeur, 4 informations, 0 avertissements, 0 refus.*

## module.c — module : en-tête local, définition et compteur partagé

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue l’en-tête "calcul.h".` → `#include "calcul.h"`  — info LOCAL_HEADER_SEARCH
- `Crée un entier nommé compteur de valeur 0.` → `int compteur = 0;`
- `Crée une fonction nommée double_de qui retourne un int et prend un int nommé a.` → `int double_de(int a) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Affecte à compteur le résultat de "compteur + 1".` → `compteur = (compteur + 1);`
- `Retourne le résultat de "a * 2".` → `return (a * 2);`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé r.` → `int r;`
- `Affecte à r le résultat de l’appel de double_de avec "21".` → `r = double_de(21);`  — info CALL_NOT_RESOLVED
- `Affiche la valeur de r.` → `printf("%d", r);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche la valeur de compteur.` → `printf("%d", compteur);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*module.c : 14 instructions, 1 gestes d’éditeur, 8 informations, 0 avertissements, 0 refus.*

