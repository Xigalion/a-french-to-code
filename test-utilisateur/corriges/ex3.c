// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Crée un entier nommé age de valeur 20.
    int age = 20;
    // Crée un bloc si "age >= 18".
    if (age >= 18) {
        // Affiche le texte "majeur".
        printf("%s", "majeur");
        
    }
    // Ajoute une branche sinon si "age >= 12".
    else if (age >= 12) {
        // Affiche le texte "adolescent".
        printf("%s", "adolescent");
        
    }
    // Ajoute une branche sinon.
    else {
        // Affiche le texte "enfant".
        printf("%s", "enfant");
        
    }
    // Retourne la valeur 0.
    return 0;
    
}
