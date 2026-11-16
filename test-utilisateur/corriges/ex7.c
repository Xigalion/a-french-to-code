// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé x.
    int x;
    // Crée un pointeur de type int nommé p avec l’adresse de x.
    int *p = &x;
    // Affecte la valeur 5 à la valeur pointée par p.
    *p = 5;
    // Affiche la valeur pointée par p.
    printf("%d", *p);
    // Affecte à x le résultat numérique de "*p + 1".
    x = ((*p) + 1);
    // Affiche la valeur de x.
    printf("%d", x);
    // Retourne la valeur 0.
    return 0;
    
}
