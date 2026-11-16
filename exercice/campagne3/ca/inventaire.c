// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue la bibliothèque stdlib.h.
#include <stdlib.h>

// Déclare une structure nommée Point.
struct Point {
    // Ajoute un champ de type int nommé x.
    int x;
    // Ajoute un champ de type int nommé y.
    int y;
    // Ajoute un champ de type char nommé initiale.
    char initiale;
    
};
// Crée la fonction principale.
int main(void) {
    // Déclare une variable de type structure Point nommée centre.
    struct Point centre;
    // Affecte la valeur 3 au champ x de centre.
    centre.x = 3;
    // Affecte la valeur 4 au champ y de centre.
    centre.y = 4;
    // Affecte le caractère 'C' au champ initiale de centre.
    centre.initiale = 'C';
    // Affiche le champ x de centre.
    printf("%d", centre.x);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche le champ initiale de centre.
    printf("%d", centre.initiale);
    // Affiche un retour à la ligne.
    printf("\n");
    // Déclare un pointeur de type int nommé tab.
    int *tab;
    // Affecte à tab l’allocation de 2 éléments de type int.
    tab = malloc(2 * sizeof(int));
    // Crée un bloc si "tab == NULL".
    if (tab == NULL) {
        // Retourne la valeur 1.
        return 1;
        
    }
    // Affecte la valeur 1 à l’élément "0" de tab.
    tab[0] = 1;
    // Déclare un pointeur de type int nommé grand.
    int *grand;
    // Affecte à grand la réallocation de tab pour 4 éléments de type int.
    grand = realloc(tab, 4 * sizeof(int));
    // Crée un bloc si "grand == NULL".
    if (grand == NULL) {
        // Libère la mémoire pointée par tab.
        free(tab);
        // Retourne la valeur 1.
        return 1;
        
    }
    // Affecte la valeur 9 à l’élément "2" de grand.
    grand[2] = 9;
    // Affiche l’élément "2" de grand.
    printf("%d", grand[2]);
    // Affiche un retour à la ligne.
    printf("\n");
    // Libère la mémoire pointée par grand.
    free(grand);
    // Retourne la valeur 0.
    return 0;
    
}
