// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue la bibliothèque stdlib.h.
#include <stdlib.h>

// Inclue la bibliothèque assert.h.
#include <assert.h>

// Inclue l’en-tête "carnet.h".
#include "carnet.h"

// Inclue la bibliothèque limits.h.
#include <limits.h>

// Déclare une variable de type int nommée compteur.
int compteur;

// Crée une fonction nommée meilleureNote qui retourne un int et prend un int nommé n.
int meilleureNote(int n) {
    // Déclare un tableau de type int nommé notes de dimension 3.
    int notes[3];
    // Déclare un entier nommé i.
    int i;
    // Déclare un entier nommé meilleure.
    int meilleure;
    // Affecte la valeur 12 à l’élément "0" de notes.
    notes[0] = 12;
    // Affecte la valeur 17 à l’élément "1" de notes.
    notes[1] = 17;
    // Affecte la valeur 9 à l’élément "2" de notes.
    notes[2] = 9;
    // Affecte la valeur 0 à meilleure.
    meilleure = 0;
    // Affecte la valeur 0 à i.
    i = 0;
    // Crée une boucle tant que "i < n".
    while (i < n) {
        // Crée un bloc si "notes[i] > meilleure".
        if (notes[i] > meilleure) {
            // Affecte à meilleure le résultat numérique de "notes[i]".
            meilleure = notes[i];
            
        }
        // Affecte à i le résultat numérique de "i + 1".
        i = (i + 1);
        
    }
    // Retourne le résultat numérique de "meilleure".
    return meilleure;
    
}
// Crée une fonction nommée mention qui ne retourne rien et prend un int nommé note.
void mention(int note) {
    // Crée un aiguillage sur "note".
    switch (note) {
        // Ajoute un cas pour la valeur 20.
        case 20:
        // Affiche le texte "parfait".
        printf("%s", "parfait");
        // Sors de l’aiguillage.
        break;
        // Ajoute le cas par défaut.
        default:
        // Affiche le texte "a revoir".
        printf("%s", "a revoir");
        
    }
}
// Crée la fonction principale.
int main(void) {
    // Déclare un entier nommé n.
    int n;
    // Affecte la valeur 3 à n.
    n = 3;
    // Vérifie que "n > 0".
    assert(n > 0);
    // Affiche le texte "Carnet de notes".
    printf("%s", "Carnet de notes");
    // Crée un tableau de type char nommé titre de dimension 7 avec le texte "Carnet".
    char titre[7] = "Carnet";
    // Affiche la chaîne titre.
    printf("%s", titre);
    // Déclare un entier nommé i.
    int i;
    // Affecte la valeur 0 à i.
    i = 0;
    // Crée une boucle tant que "titre[i] != '\0'".
    while (titre[i] != '\0') {
        // Affiche le caractère de l’élément "i" de titre.
        printf("%c", titre[i]);
        // Affecte à i le résultat numérique de "i + 1".
        i = (i + 1);
        
    }
    // Déclare un pointeur de type int nommé p.
    int *p;
    // Affecte l’adresse de n à p.
    p = &n;
    // Affiche la valeur pointée par p.
    printf("%d", *p);
    // Déclare un tableau de type int nommé notes de dimension 3.
    int notes[3];
    // Affecte la valeur 12 à l’élément "0" de notes.
    notes[0] = 12;
    // Déclare un entier nommé premiere.
    int premiere;
    // Affecte à premiere le résultat numérique de "*(notes + 0)".
    premiere = (*(notes + 0));
    // Affiche la valeur de premiere.
    printf("%d", premiere);
    // Déclare un pointeur de type structure Eleve nommé eleves.
    struct Eleve *eleves;
    // Affecte à eleves l’allocation de n éléments de type structure Eleve.
    eleves = malloc(n * sizeof(struct Eleve));
    // Crée un bloc si "eleves == NULL".
    if (eleves == NULL) {
        // Retourne la valeur 1.
        return 1;
        
    }
    // Affiche la taille du type structure Eleve.
    printf("%zu", sizeof(struct Eleve));
    // Vérifie que "eleves != NULL".
    assert(eleves != NULL);
    // Affecte la valeur 15 au champ note pointé par eleves.
    eleves->note = 15;
    // Affiche le champ note pointé par eleves.
    printf("%d", eleves->note);
    // Déclare un entier nommé temporaire.
    int temporaire;
    // Affecte à temporaire le résultat numérique de "notes[0]".
    temporaire = notes[0];
    // Affecte à l’élément "0" de notes le résultat numérique de "notes[1]".
    notes[0] = notes[1];
    // Affecte à l’élément "1" de notes le résultat numérique de "temporaire".
    notes[1] = temporaire;
    // Déclare une variable de type double nommée moyenne.
    double moyenne;
    // Affecte à moyenne le résultat de l’appel de moyenneDe avec "41" et "n".
    moyenne = moyenneDe(41, n);
    // Affiche moyenne en notation fixe avec 2 décimales.
    printf("%.2f", moyenne);
    // Appelle mention avec "17".
    mention(17);
    // Déclare un entier nommé meilleure.
    int meilleure;
    // Affecte à meilleure le résultat de l’appel de meilleureNote avec "n".
    meilleure = meilleureNote(n);
    // Affiche la valeur de meilleure.
    printf("%d", meilleure);
    // Déclare un entier nommé plafond.
    int plafond;
    // Affecte à plafond le résultat numérique de "INT_MAX".
    plafond = INT_MAX;
    // Affiche la valeur de plafond.
    printf("%d", plafond);
    // Déclare un fichier nommé sortie.
    FILE *sortie;
    // Affecte à sortie l’ouverture du fichier "resultat.txt" en écriture.
    sortie = fopen("resultat.txt", "w");
    // Écris le texte "Meilleure note" dans le fichier sortie.
    fprintf(sortie, "%s", "Meilleure note");
    // Écris la valeur de meilleure dans le fichier sortie.
    fprintf(sortie, "%d", meilleure);
    // Ferme le fichier sortie.
    fclose(sortie);
    // Libère la mémoire pointée par eleves.
    free(eleves);
    // Retourne la valeur 0.
    return 0;
    
}

