// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Crée un entier nommé base de valeur 20.
    int base = 20;
    // Déclare un entier nommé calcul.
    int calcul;
    // Affecte à calcul le résultat de "base + 3 * 2".
    calcul = (base + (3 * 2));
    // Affiche calcul en hexadécimal.
    printf("%x", calcul);
    // Affiche un retour à la ligne.
    printf("\n");
    // Crée un bloc si "calcul > 100".
    if (calcul > 100) {
        // Affiche le texte "grand".
        printf("%s", "grand");
        
    }
    // Ajoute une branche sinon si "calcul > 20".
    else if (calcul > 20) {
        // Affiche le texte "moyen".
        printf("%s", "moyen");
        
    }
    // Ajoute une branche sinon.
    else {
        // Affiche le texte "petit".
        printf("%s", "petit");
        
    }
    // Affiche un retour à la ligne.
    printf("\n");
    // Déclare un entier nommé i.
    int i;
    // Affecte la valeur 0 à i.
    i = 0;
    // Crée une boucle avec test final tant que "i < 3".
    do {
        // Affecte à i le résultat numérique de "i + 1".
        i = (i + 1);
        
    } while (i < 3);
    // Affiche la valeur de i.
    printf("%d", i);
    // Affiche un retour à la ligne.
    printf("\n");
    // Déclare un entier nommé j.
    int j;
    // Crée une boucle pour j de valeur initiale "0" tant que "j < 5" avec mise à jour "j + 1".
    for (j = 0; j < 5; j = (j + 1)) {
        // Crée un bloc si "j == 1".
        if (j == 1) {
            // Passe à l’itération suivante de la boucle la plus intérieure.
            continue;
            
        }
        // Crée un bloc si "j == 4".
        if (j == 4) {
            // Sors de la boucle la plus intérieure.
            break;
            
        }
        // Affiche la valeur de j.
        printf("%d", j);
        
    }
    // Affiche un retour à la ligne.
    printf("\n");
    // Crée un caractère nommé lettre de valeur 'A'.
    char lettre = 'A';
    // Déclare un caractère nommé copie.
    char copie;
    // Crée un aiguillage sur "lettre".
    switch (lettre) {
        // Ajoute un cas pour le caractère 'A'.
        case 'A':
        // Affecte le caractère 'B' à copie.
        copie = 'B';
        // Sors de l’aiguillage.
        break;
        // Ajoute le cas par défaut.
        default:
        // Affecte le caractère 'Z' à copie.
        copie = 'Z';
        
    }
    // Affiche le caractère copie.
    printf("%c", copie);
    // Affiche un retour à la ligne.
    printf("\n");
    // Déclare un tableau de type int nommé t de dimension 3.
    int t[3];
    // Affecte la valeur 7 à l’élément "0" de t.
    t[0] = 7;
    // Affiche l’élément "0" de t.
    printf("%d", t[0]);
    // Affiche un retour à la ligne.
    printf("\n");
    // Déclare un entier nommé n.
    int n;
    // Déclare un pointeur de type int nommé p.
    int *p;
    // Affecte l’adresse de n à p.
    p = &n;
    // Affecte la valeur 5 à la valeur pointée par p.
    *p = 5;
    // Affiche la valeur de n.
    printf("%d", n);
    // Affiche un retour à la ligne.
    printf("\n");
    // Retourne la valeur 0.
    return 0;
    
}
