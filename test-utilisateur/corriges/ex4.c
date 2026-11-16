// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé i.
    int i;
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 5" avec mise à jour "i + 1".
    for (i = 0; i < 5; i = (i + 1)) {
        // Crée un bloc si "i == 2".
        if (i == 2) {
            // Passe à l’itération suivante de la boucle la plus intérieure.
            continue;
            
        }
        // Affiche la valeur de i.
        printf("%d", i);
        
    }
    // Affecte la valeur 0 à i.
    i = 0;
    // Crée une boucle tant que "i < 5".
    while (i < 5) {
        // Affiche la valeur de i.
        printf("%d", i);
        // Affecte à i le résultat de "i + 1".
        i = (i + 1);
        // Crée un bloc si "i == 2".
        if (i == 2) {
            // Sors de la boucle la plus intérieure.
            break;
            
        }
    }
    // Retourne la valeur 0.
    return 0;
    
}
