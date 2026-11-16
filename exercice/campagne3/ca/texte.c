// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée une fonction interne nommée longueurMax qui retourne un int.
static int longueurMax(void) {
    // Retourne la valeur 16.
    return 16;
    
}
// Crée la fonction principale.
int main(void) {
    // Déclare un fichier nommé sortie.
    FILE *sortie;
    // Affecte à sortie l’ouverture du fichier "texte.txt" en écriture.
    sortie = fopen("texte.txt", "w");
    // Crée un bloc si "sortie == NULL".
    if (sortie == NULL) {
        // Retourne la valeur 1.
        return 1;
        
    }
    // Écris le texte "bonjour" dans le fichier sortie.
    fprintf(sortie, "%s", "bonjour");
    // Ferme le fichier sortie.
    fclose(sortie);
    // Déclare un fichier nommé entree.
    FILE *entree;
    // Affecte à entree l’ouverture du fichier "texte.txt" en lecture.
    entree = fopen("texte.txt", "r");
    // Crée un bloc si "entree == NULL".
    if (entree == NULL) {
        // Retourne la valeur 1.
        return 1;
        
    }
    // Crée un tableau de type char nommé ligne de dimension 16 avec le texte "".
    char ligne[16] = "";
    // Lis une chaîne de dimension 16 depuis le fichier entree dans ligne.
    fgets(ligne, 16, entree);
    // Affiche la chaîne ligne.
    printf("%s", ligne);
    // Affiche un retour à la ligne.
    printf("\n");
    // Ferme le fichier entree.
    fclose(entree);
    // Déclare un entier nommé max.
    int max;
    // Affecte à max le résultat de l’appel de longueurMax.
    max = longueurMax();
    // Affiche la valeur de max.
    printf("%d", max);
    // Affiche un retour à la ligne.
    printf("\n");
    // Retourne la valeur 0.
    return 0;
    
}
