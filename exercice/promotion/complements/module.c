// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue l’en-tête "calcul.h".
#include "calcul.h"

// Crée un entier nommé compteur de valeur 0.
int compteur = 0;

// Crée une fonction nommée double_de qui retourne un int et prend un int nommé a.
int double_de(int a) {
    // Affecte à compteur le résultat de "compteur + 1".
    compteur = (compteur + 1);
    // Retourne le résultat de "a * 2".
    return (a * 2);
    
}

// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé r.
    int r;
    // Affecte à r le résultat de l’appel de double_de avec "21".
    r = double_de(21);
    // Affiche la valeur de r.
    printf("%d", r);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche la valeur de compteur.
    printf("%d", compteur);
    // Affiche un retour à la ligne.
    printf("\n");
    // Retourne la valeur 0.
    return 0;
    
}
