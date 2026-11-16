# Exercice de clôture — production du C brut

Produit par `scripts/ecrirePhrases.mjs` : `translate` puis `planPlacement`,
puis application de l’unique édition du plan. **Aucune retouche manuelle.**

## notes.c — gestion des notes d’une promotion de trois étudiants

- `Inclue la bibliothèque stdio.h.` → `#include <stdio.h>`
- `Inclue la bibliothèque stdlib.h.` → `#include <stdlib.h>`  — info HEADER_DECLARES_ONLY
- `Inclue la bibliothèque assert.h.` → `#include <assert.h>`
- `Déclare une structure nommée Etudiant.` → `struct Etudiant {
    
};`  — info STRUCT_TAG_NEEDS_KEYWORD, STRUCT_LAYOUT
- `Ajoute un champ de type char nommé initiale.` → `char initiale;`
- `Ajoute un champ de type int nommé total.` → `int total;`
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b et un int nommé c.` → `int somme(int a, int b, int c) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Retourne le résultat de "a + b + c".` → `return ((a + b) + c);`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée une fonction nommée moyenne qui retourne un double et prend un int nommé total et un int nommé effectif.` → `double moyenne(int total, int effectif) {
    
}`  — info FUNCTION_SCOPE, PARAMETERS_BY_VALUE
- `Retourne le résultat numérique de "(double) total / effectif".` → `return (((double) total) / effectif);`  — info RETURN_ENDS_FUNCTION
- *(geste d’éditeur : ligne blanche à l’indentation 0)*
- `Crée la fonction principale.` → `int main(void) {
    
}`
- `Déclare un tableau de type structure Etudiant nommé promo de dimension 3.` → `struct Etudiant promo[3];`  — info STRUCT_ARRAY_LAYOUT
- `Déclare un tableau de type int nommé notes de dimension 9.` → `int notes[9];`  — info ARRAY_NOT_ASSIGNABLE
- `Déclare un tableau de type int nommé rang de dimension 3.` → `int rang[3];`  — info ARRAY_NOT_ASSIGNABLE
- `Crée un tableau de type char nommé initiales de dimension 4 avec le texte "ABC".` → `char initiales[4] = "ABC";`  — info NULL_TERMINATOR, ARRAY_SIZE_VS_LENGTH
- `Déclare un entier nommé i.` → `int i;`
- `Déclare un entier nommé j.` → `int j;`
- `Déclare un entier nommé note.` → `int note;`
- `Déclare un entier nommé total.` → `int total;`
- `Déclare un entier nommé temp.` → `int temp;`
- `Déclare un entier nommé cumul.` → `int cumul;`
- `Déclare un entier nommé meilleur.` → `int meilleur;`
- `Déclare un entier nommé bons.` → `int bons;`
- `Déclare un entier nommé k.` → `int k;`
- `Déclare un caractère nommé mention.` → `char mention;`  — info CHARACTER_STORAGE
- `Déclare une variable de type double nommée moy.` → `double moy;`
- `Déclare un fichier nommé f.` → `FILE *f;`  — info FILE_MUST_BE_CLOSED
- `Déclare un fichier nommé g.` → `FILE *g;`  — info FILE_MUST_BE_CLOSED
- `Affecte à f l’ouverture du fichier "notes.txt" en lecture.` → `f = fopen("notes.txt", "r");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Vérifie que "f != 0".` → `assert(f != 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 9" avec mise à jour "i + 1".` → `for (i = 0; i < 9; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Lis un entier depuis le fichier f dans note.` → `fscanf(f, "%d", &note);`  — info SCANF_NEEDS_ADDRESS
- `Affecte à l’élément "i" de notes le résultat numérique de "note".` → `notes[i] = note;`  — info INDEX_NOT_CHECKED
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Crée un bloc si la fin du fichier f est atteinte.` → `if (feof(f)) {
    
}`  — info EOF_AFTER_READ
- `Affiche le texte "fichier incomplet".` → `printf("%s", "fichier incomplet");`  — info OUTPUT_HAS_NO_SEPARATOR
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Ferme le fichier f.` → `fclose(f);`  — info FILE_MUST_BE_CLOSED
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` → `for (i = 0; i < 3; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Affecte à total le résultat de l’appel de somme avec "notes[i * 3]" et "notes[i * 3 + 1]" et "notes[i * 3 + 2]".` → `total = somme(notes[(i * 3)], notes[((i * 3) + 1)], notes[((i * 3) + 2)]);`  — info INDEX_NOT_CHECKED, CALL_NOT_RESOLVED
- `Affecte au champ total de l’élément "i" de promo le résultat numérique de "total".` → `promo[i].total = total;`  — info INDEX_NOT_CHECKED, MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte au champ initiale de l’élément "i" de promo le résultat numérique de "initiales[i]".` → `promo[i].initiale = initiales[i];`  — info INDEX_NOT_CHECKED, MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte à l’élément "i" de rang le résultat numérique de "total".` → `rang[i] = total;`  — info INDEX_NOT_CHECKED
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 2" avec mise à jour "i + 1".` → `for (i = 0; i < 2; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Crée une boucle pour j de valeur initiale "0" tant que "j < 2" avec mise à jour "j + 1".` → `for (j = 0; j < 2; j = (j + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Crée un bloc si "rang[j] < rang[j + 1]".` → `if (rang[j] < rang[(j + 1)]) {
    
}`  — info INDEX_NOT_CHECKED
- `Affecte à temp le résultat numérique de "rang[j]".` → `temp = rang[j];`  — info INDEX_NOT_CHECKED
- `Affecte à l’élément "j" de rang le résultat numérique de "rang[j + 1]".` → `rang[j] = rang[(j + 1)];`  — info INDEX_NOT_CHECKED
- `Affecte à l’élément "j + 1" de rang le résultat numérique de "temp".` → `rang[(j + 1)] = temp;`  — info INDEX_NOT_CHECKED
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affecte la valeur 0 à meilleur.` → `meilleur = 0;`
- `Crée une boucle pour i de valeur initiale "1" tant que "i < 3" avec mise à jour "i + 1".` → `for (i = 1; i < 3; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Crée un bloc si "promo[i].total > promo[meilleur].total".` → `if (promo[i].total > promo[meilleur].total) {
    
}`  — info INDEX_NOT_CHECKED, MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED
- `Affecte à meilleur le résultat numérique de "i".` → `meilleur = i;`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affecte la valeur 0 à bons.` → `bons = 0;`
- `Affecte la valeur 0 à i.` → `i = 0;`
- `Crée une boucle tant que "i < 9".` → `while (i < 9) {
    
}`  — info WHILE_PRETEST
- `Crée un bloc si "notes[i] >= 10".` → `if (notes[i] >= 10) {
    
}`  — info INDEX_NOT_CHECKED
- `Affecte à bons le résultat de "bons + 1".` → `bons = (bons + 1);`
- *(geste d’éditeur : ligne blanche à l’indentation 8)*
- `Affecte à i le résultat de "i + 1".` → `i = (i + 1);`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affecte la valeur 0 à k.` → `k = 0;`
- `Crée une boucle avec test final tant que "k < 3".` → `do {
    
} while (k < 3);`  — info DO_WHILE_POSTTEST
- `Affecte à k le résultat de "k + 1".` → `k = (k + 1);`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affecte à cumul le résultat de l’appel de somme avec "promo[0].total" et "promo[1].total" et "promo[2].total".` → `cumul = somme(promo[0].total, promo[1].total, promo[2].total);`  — info INDEX_NOT_CHECKED, MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, CALL_NOT_RESOLVED
- `Affecte à moy le résultat de l’appel de moyenne avec "cumul" et "9".` → `moy = moyenne(cumul, 9);`  — info CALL_NOT_RESOLVED
- `Affiche moy en notation fixe avec 2 décimales.` → `printf("%.2f", moy);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Crée un bloc si "moy >= 14".` → `if (moy >= 14) {
    
}`
- `Affecte le caractère 'B' à mention.` → `mention = 'B';`  — info CHARACTER_IS_INTEGER
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Ajoute une branche sinon si "moy >= 10".` → `else if (moy >= 10) {
    
}`
- `Affecte le caractère 'P' à mention.` → `mention = 'P';`  — info CHARACTER_IS_INTEGER
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Ajoute une branche sinon.` → `else {
    
}`
- `Affecte le caractère 'E' à mention.` → `mention = 'E';`  — info CHARACTER_IS_INTEGER
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Crée un aiguillage sur "mention".` → `switch (mention) {
    
}`  — info SWITCH_INTEGER_ONLY
- `Ajoute un cas pour le caractère 'B'.` → `case 'B':`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT
- `Affiche le texte "bien".` → `printf("%s", "bien");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- `Ajoute un cas pour le caractère 'P'.` → `case 'P':`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT
- `Affiche le texte "passable".` → `printf("%s", "passable");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- `Ajoute le cas par défaut.` → `default:`  — info SWITCH_FALLTHROUGH, CASE_NEEDS_STATEMENT, DEFAULT_OPTIONAL
- `Affiche le texte "insuffisant".` → `printf("%s", "insuffisant");`  — info OUTPUT_HAS_NO_SEPARATOR
- `Sors de l’aiguillage.` → `break;`  — info BREAK_LEAVES_SWITCH
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` → `for (i = 0; i < 3; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Affiche l’élément "i" de rang.` → `printf("%d", rang[i]);`  — info INDEX_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche le texte " ".` → `printf("%s", " ");`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche le champ initiale de l’élément "meilleur" de promo.` → `printf("%d", promo[meilleur].initiale);`  — info INDEX_NOT_CHECKED, MEMBER_ACCESS_FORM, MEMBER_NOT_CHECKED, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche la valeur de bons.` → `printf("%d", bons);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affiche la valeur de k.` → `printf("%d", k);`  — info OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Affecte à g l’ouverture du fichier "resultat.txt" en écriture.` → `g = fopen("resultat.txt", "w");`  — info FOPEN_CAN_FAIL, FILE_MODE_MEANING
- `Vérifie que "g != 0".` → `assert(g != 0);`  — info ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING
- `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` → `for (i = 0; i < 3; i = (i + 1)) {
    
}`  — info FOR_CLAUSE_ORDER
- `Affecte à temp le résultat numérique de "rang[i]".` → `temp = rang[i];`  — info INDEX_NOT_CHECKED
- `Écris la valeur de temp dans le fichier g.` → `fprintf(g, "%d", temp);`
- `Écris le texte " " dans le fichier g.` → `fprintf(g, "%s", " ");`
- *(geste d’éditeur : ligne blanche à l’indentation 4)*
- `Ferme le fichier g.` → `fclose(g);`  — info FILE_MUST_BE_CLOSED
- `Affiche la taille du type structure Etudiant.` → `printf("%zu", sizeof(struct Etudiant));`  — info SIZEOF_IS_BYTES, OUTPUT_HAS_NO_SEPARATOR
- `Affiche un retour à la ligne.` → `printf("\n");`
- `Retourne la valeur 0.` → `return 0;`  — info RETURN_ENDS_FUNCTION

*notes.c : 101 instructions, 17 gestes d’éditeur, 92 informations, 0 avertissements, 0 refus.*

