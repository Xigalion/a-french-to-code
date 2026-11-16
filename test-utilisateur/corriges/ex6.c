// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Déclare un tableau de type int nommé notes de dimension 3.
    int notes[3];
    // Affecte la valeur 12 à l’élément "0" de notes.
    notes[0] = 12;
    // Affecte la valeur 15 à l’élément "1" de notes.
    notes[1] = 15;
    // Affecte la valeur 9 à l’élément "2" de notes.
    notes[2] = 9;
    // Affiche l’élément "1" de notes.
    printf("%d", notes[1]);
    // Crée un entier nommé cumul de valeur 0.
    int cumul = 0;
    // Déclare un entier nommé i.
    int i;
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
    for (i = 0; i < 3; i = (i + 1)) {
        // Affecte à cumul le résultat numérique de "cumul + notes[i]".
        cumul = (cumul + notes[i]);
        
    }
    // Affiche la valeur de cumul.
    printf("%d", cumul);
    // Crée un tableau de type char nommé mot de dimension 6 avec le texte "hello".
    char mot[6] = "hello";
    // Affiche la chaîne mot.
    printf("%s", mot);
    // Affiche le caractère de l’élément "0" de mot.
    printf("%c", mot[0]);
    // Retourne la valeur 0.
    return 0;
    
}
