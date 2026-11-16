// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé resultat.
    int resultat;
    // Affecte à resultat le résultat de "10 / 0".
    resultat = (10 / 0);
    // Affiche la valeur de resultat.
    printf("%d", resultat);
    // Retourne la valeur 0.
    return 0;
    
}
