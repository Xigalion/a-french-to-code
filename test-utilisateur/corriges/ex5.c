// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.
int somme(int a, int b) {
    // Retourne le résultat de "a + b".
    return (a + b);
    
}

// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé total.
    int total;
    // Affecte à total le résultat de l’appel de somme avec "2" et "3".
    total = somme(2, 3);
    // Affiche la valeur de total.
    printf("%d", total);
    // Retourne la valeur 0.
    return 0;
    
}
