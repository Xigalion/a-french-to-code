// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Déclare un fichier nommé sortie.
    FILE *sortie;
    // Affecte à sortie l’ouverture du fichier "donnees.txt" en écriture.
    sortie = fopen("donnees.txt", "w");
    // Crée un bloc si "sortie == NULL".
    if (sortie == NULL) {
        // Retourne la valeur 1.
        return 1;
        
    }
    // Déclare un entier nommé ecrit.
    int ecrit;
    // Affecte la valeur 42 à ecrit.
    ecrit = 42;
    // Écris la valeur de ecrit dans le fichier sortie.
    fprintf(sortie, "%d", ecrit);
    // Ferme le fichier sortie.
    fclose(sortie);
    // Déclare un fichier nommé entree.
    FILE *entree;
    // Affecte à entree l’ouverture du fichier "donnees.txt" en lecture.
    entree = fopen("donnees.txt", "r");
    // Crée un bloc si "entree == NULL".
    if (entree == NULL) {
        // Retourne la valeur 1.
        return 1;
        
    }
    // Déclare un entier nommé valeur.
    int valeur;
    // Lis un entier depuis le fichier entree dans valeur.
    fscanf(entree, "%d", &valeur);
    // Affiche la valeur de valeur.
    printf("%d", valeur);
    // Affiche un retour à la ligne.
    printf("\n");
    // Crée un bloc si la fin du fichier entree est atteinte.
    if (feof(entree)) {
        // Affiche le texte "fin".
        printf("%s", "fin");
        // Affiche un retour à la ligne.
        printf("\n");
        
    }
    // Ferme le fichier entree.
    fclose(entree);
    // Retourne la valeur 0.
    return 0;
    
}
