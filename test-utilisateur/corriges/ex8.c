// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Déclare une structure nommée Point.
struct Point {
    // Ajoute un champ de type int nommé x.
    int x;
    // Ajoute un champ de type int nommé y.
    int y;
    
};

// Crée la fonction principale.
int main(void) {
    // Crée un entier nommé x de valeur 7.
    int x = 7;
    // Déclare une variable de type structure Point nommée centre.
    struct Point centre;
    // Affecte la valeur 3 au champ x de centre.
    centre.x = 3;
    // Affiche le champ x de centre.
    printf("%d", centre.x);
    // Déclare un fichier nommé f.
    FILE *f;
    // Affecte à f l’ouverture du fichier "sortie.txt" en écriture.
    f = fopen("sortie.txt", "w");
    // Écris la valeur de x dans le fichier f.
    fprintf(f, "%d", x);
    // Ferme le fichier f.
    fclose(f);
    // Retourne la valeur 0.
    return 0;
    
}
