// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé resultat.
    int resultat;
    // Affecte à resultat le résultat de "2 + 3 * 4".
    resultat = (2 + (3 * 4));
    // Affiche la valeur de resultat.
    printf("%d", resultat);
    // Déclare une variable de type double nommée moyenne.
    double moyenne;
    // Affecte à moyenne le résultat numérique de "(double) 7 / 2".
    moyenne = (((double) 7) / 2);
    // Affiche moyenne en notation fixe avec 2 décimales.
    printf("%.2f", moyenne);
    // Retourne la valeur 0.
    return 0;
    
}
