# Corrigés des neuf exercices — journal de production

Produit par `test-utilisateur/generer.mjs`. **Aucune retouche manuelle.**

## ex1.c — Exercice 1 — afficher une valeur

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Crée un entier nommé age de valeur 20.` → `int age = 20;`
- `Affiche la valeur de age.` → `printf("%d", age);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex1.c : 6 instructions, 0 gestes d’éditeur, 2 informations, 0 avertissements, 0 refus.*

## ex2.c — Exercice 2 — calculer

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé resultat.` → `int resultat;`
- `Affecte à resultat le résultat de "2 + 3 * 4".` → `resultat = (2 + (3 * 4));`
- `Affiche la valeur de resultat.` → `printf("%d", resultat);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Déclare une variable de type double nommée moyenne.` → `double moyenne;`
- `Affecte à moyenne le résultat numérique de "(double) 7 / 2".` → `moyenne = (((double) 7) / 2);`
- `Affiche moyenne en notation fixe avec 2 décimales.` → `printf("%.2f", moyenne);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex2.c : 9 instructions, 0 gestes d’éditeur, 3 informations, 0 avertissements, 0 refus.*

## ex3.c — Exercice 3 — décider

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Crée un entier nommé age de valeur 20.` → `int age = 20;`
- `Crée un bloc si "age >= 18".` → `if (age >= 18) {
    
}`
- `Affiche le texte "majeur".` → `printf("%s", "majeur");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Ajoute une branche sinon si "age >= 12".` → `else if (age >= 12) {
    
}`
- `Affiche le texte "adolescent".` → `printf("%s", "adolescent");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Ajoute une branche sinon.` → `else {
    
}`
- `Affiche le texte "enfant".` → `printf("%s", "enfant");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex3.c : 10 instructions, 3 gestes d’éditeur, 4 informations, 0 avertissements, 0 refus.*

## ex4.c — Exercice 4 — répéter

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé i.` → `int i;`
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 5" avec mise à jour "i + 1".` → `for (i = 0; i < 5; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Crée un bloc si "i == 2".` → `if (i == 2) {
    
}`
- `Passe à l’itération suivante de la boucle la plus intérieure.` → `continue;`
- *(geste d’éditeur : ligne blanche à l’indentation 8)*
- `Affiche la valeur de i.` → `printf("%d", i);`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affecte la valeur 0 à i.` → `i = 0;`
- `Crée une boucle tant que "i < 5".` → `while (i < 5) {
    
}`  — info WHILE_PRETEST
- `Affiche la valeur de i.` → `printf("%d", i);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affecte à i le résultat de "i + 1".` → `i = (i + 1);`
- `Crée un bloc si "i == 2".` → `if (i == 2) {
    
}`
- `Sors de la boucle la plus intérieure.` → `break;`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex4.c : 14 instructions, 3 gestes d’éditeur, 5 informations, 0 avertissements, 0 refus.*

## ex5.c — Exercice 5 — découper

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.` → `int somme(int a, int b) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Retourne le résultat de "a + b".` → `return (a + b);`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé total.` → `int total;`
- `Affecte à total le résultat de l’appel de somme avec "2" et "3".` → `total = somme(2, 3);`  — info CALL_NOT_RESOLVED
- `Affiche la valeur de total.` → `printf("%d", total);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex5.c : 8 instructions, 1 gestes d’éditeur, 6 informations, 0 avertissements, 0 refus.*

## ex6.c — Exercice 6 — grouper

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un tableau de type int nommé notes de dimension 3.` → `int notes[3];`  — info ARRAY_NOT_ASSIGNABLE
- `Affecte la valeur 12 à l’élément "0" de notes.` → `notes[0] = 12;`  — info INDEX_NOT_CHECKED
- `Affecte la valeur 15 à l’élément "1" de notes.` → `notes[1] = 15;`  — info INDEX_NOT_CHECKED
- `Affecte la valeur 9 à l’élément "2" de notes.` → `notes[2] = 9;`  — info INDEX_NOT_CHECKED
- `Affiche l’élément "1" de notes.` → `printf("%d", notes[1]);`  — info INDEX_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Crée un entier nommé cumul de valeur 0.` → `int cumul = 0;`
- `Déclare un entier nommé i.` → `int i;`
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` → `for (i = 0; i < 3; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Affecte à cumul le résultat numérique de "cumul + notes[i]".` → `cumul = (cumul + notes[i]);`  — info INDEX_NOT_CHECKED
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affiche la valeur de cumul.` → `printf("%d", cumul);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Crée un tableau de type char nommé mot de dimension 6 avec le texte "hello".` → `char mot[6] = "hello";`  — info NULL_TERMINATOR, ARRAY_SIZE_VS_LENGTH
- `Affiche la chaîne mot.` → `printf("%s", mot);`  — info STRING_TERMINATOR_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche le caractère de l’élément "0" de mot.` → `printf("%c", mot[0]);`  — info INDEX_NOT_CHECKED, ELEMENT_CHARACTER_FORMAT, OUTPUT_HAS_NO_SEPARATOR
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex6.c : 16 instructions, 1 gestes d’éditeur, 17 informations, 0 avertissements, 0 refus.*

## ex7.c — Exercice 7 — désigner

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé x.` → `int x;`
- `Crée un pointeur de type int nommé p avec l’adresse de x.` → `int *p = &x;`  — info ADDRESS_OF, POINTER_VS_OBJECT, POINTER_ARITHMETIC_ABSENT
- `Affecte la valeur 5 à la valeur pointée par p.` → `*p = 5;`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED
- `Affiche la valeur pointée par p.` → `printf("%d", *p);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affecte à x le résultat numérique de "*p + 1".` → `x = ((*p) + 1);`  — info DEREFERENCE_MEANING, ADDRESS_NOT_CHECKED
- `Affiche la valeur de x.` → `printf("%d", x);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex7.c : 9 instructions, 0 gestes d’éditeur, 12 informations, 0 avertissements, 0 refus.*

## ex8.c — Exercice 8 — assembler

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Déclare une structure nommée Point.` → `struct Point {
    
};`  — info STRUCT_TAG_NEEDS_KEYWORD, STRUCT_LAYOUT
- `Ajoute un champ de type int nommé x.` → `int x;`
- `Ajoute un champ de type int nommé y.` → `int y;`
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Crée un entier nommé x de valeur 7.` → `int x = 7;`
- `Déclare une variable de type structure Point nommée centre.` → `struct Point centre;`
- `Affecte la valeur 3 au champ x de centre.` → `centre.x = 3;`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affiche le champ x de centre.` → `printf("%d", centre.x);`  — info MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Déclare un fichier nommé f.` → `FILE *f;`  — info FILE_MUST_BE_CLOSED
- `Affecte à f l’ouverture du fichier "sortie.txt" en écriture.` → `f = fopen("sortie.txt", "w");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Écris la valeur de x dans le fichier f.` → `fprintf(f, "%d", x);`
- `Ferme le fichier f.` → `fclose(f);`  — info FILE_MUST_BE_CLOSED
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex8.c : 14 instructions, 1 gestes d’éditeur, 12 informations, 0 avertissements, 0 refus.*

## ex9.c — Exercice 9 — un avertissement, pas un refus

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un entier nommé resultat.` → `int resultat;`
- `Affecte à resultat le résultat de "10 / 0".` → `resultat = (10 / 0);`  — **avertissement INTEGER_ZERO_DIVISOR**
- `Affiche la valeur de resultat.` → `printf("%d", resultat);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*ex9.c : 6 instructions, 0 gestes d’éditeur, 2 informations, 1 avertissements, 0 refus.*

## Refus annoncés par les énoncés

| Cas | Verdict | Code |
|---|---|---|
| ex1 — mot-clé comme nom — `Déclare un entier nommé int.` | refusée | `C_KEYWORD_IDENTIFIER` |
| ex2 — profil entier et conversion — `Affecte à moyenne le résultat de "(double) 7 / 2".` | refusée | `C_KEYWORD_IDENTIFIER` |
| ex2 — opérande manquant — `Affecte à resultat le résultat de "2 +".` | refusée | `MISSING_OPERAND` |
| ex3 — affectation en condition — `Crée un bloc si "age => 18".` | refusée | `ASSIGNMENT_IN_CONDITION` |
| ex4 — boucle pour abrégée — `Crée une boucle pour i de "0" tant que "i < 5".` | refusée | `UNKNOWN_FORMULATION` |
| ex6 — dimension nulle — `Déclare un tableau de type int nommé t de dimension 0.` | refusée | `INVALID_ARRAY_DIMENSION` |
| ex6 — indice sans guillemets — `Affecte la valeur 12 à l’élément 0 de notes.` | refusée | `MISSING_EXPRESSION_DELIMITER` |
| ex7 — déréférencement d’une valeur — `Affiche la valeur pointée par 5.` | refusée | `INVALID_IDENTIFIER` |
| parcours — hors catalogue — `Crée un entier age = 20.` | refusée | `UNKNOWN_FORMULATION` |
| parcours — entier en lettres — `Crée un entier nommé age de valeur vingt.` | refusée | `INVALID_INTEGER` |
