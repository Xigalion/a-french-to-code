// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue la bibliothèque stdlib.h.
#include <stdlib.h>

// Inclue la bibliothèque assert.h.
#include <assert.h>

// Déclare une structure nommée Etudiant.
struct Etudiant {
    // Ajoute un champ de type char nommé initiale.
    char initiale;
    // Ajoute un champ de type int nommé total.
    int total;
    
};

// Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b et un int nommé c.
int somme(int a, int b, int c) {
    // Retourne le résultat de "a + b + c".
    return ((a + b) + c);
    
}

// Crée une fonction nommée moyenne qui retourne un double et prend un int nommé total et un int nommé effectif.
double moyenne(int total, int effectif) {
    // Retourne le résultat numérique de "(double) total / effectif".
    return (((double) total) / effectif);
    
}

// Crée la fonction principale.
int main(void) {
    // Déclare un tableau de type structure Etudiant nommé promo de dimension 3.
    struct Etudiant promo[3];
    // Déclare un tableau de type int nommé notes de dimension 9.
    int notes[9];
    // Déclare un tableau de type int nommé rang de dimension 3.
    int rang[3];
    // Crée un tableau de type char nommé initiales de dimension 4 avec le texte "ABC".
    char initiales[4] = "ABC";
    // Déclare un entier nommé i.
    int i;
    // Déclare un entier nommé j.
    int j;
    // Déclare un entier nommé note.
    int note;
    // Déclare un entier nommé total.
    int total;
    // Déclare un entier nommé temp.
    int temp;
    // Déclare un entier nommé cumul.
    int cumul;
    // Déclare un entier nommé meilleur.
    int meilleur;
    // Déclare un entier nommé bons.
    int bons;
    // Déclare un entier nommé k.
    int k;
    // Déclare un caractère nommé mention.
    char mention;
    // Déclare une variable de type double nommée moy.
    double moy;
    // Déclare un fichier nommé f.
    FILE *f;
    // Déclare un fichier nommé g.
    FILE *g;
    // Affecte à f l’ouverture du fichier "notes.txt" en lecture.
    f = fopen("notes.txt", "r");
    // Vérifie que "f != 0".
    assert(f != 0);
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 9" avec mise à jour "i + 1".
    for (i = 0; i < 9; i = (i + 1)) {
        // Lis un entier depuis le fichier f dans note.
        fscanf(f, "%d", &note);
        // Affecte à l’élément "i" de notes le résultat numérique de "note".
        notes[i] = note;
        
    }
    // Crée un bloc si la fin du fichier f est atteinte.
    if (feof(f)) {
        // Affiche le texte "fichier incomplet".
        printf("%s", "fichier incomplet");
        
    }
    // Ferme le fichier f.
    fclose(f);
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
    for (i = 0; i < 3; i = (i + 1)) {
        // Affecte à total le résultat de l’appel de somme avec "notes[i * 3]" et "notes[i * 3 + 1]" et "notes[i * 3 + 2]".
        total = somme(notes[(i * 3)], notes[((i * 3) + 1)], notes[((i * 3) + 2)]);
        // Affecte au champ total de l’élément "i" de promo le résultat numérique de "total".
        promo[i].total = total;
        // Affecte au champ initiale de l’élément "i" de promo le résultat numérique de "initiales[i]".
        promo[i].initiale = initiales[i];
        // Affecte à l’élément "i" de rang le résultat numérique de "total".
        rang[i] = total;
        
    }
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 2" avec mise à jour "i + 1".
    for (i = 0; i < 2; i = (i + 1)) {
        // Crée une boucle pour j de valeur initiale "0" tant que "j < 2" avec mise à jour "j + 1".
        for (j = 0; j < 2; j = (j + 1)) {
            // Crée un bloc si "rang[j] < rang[j + 1]".
            if (rang[j] < rang[(j + 1)]) {
                // Affecte à temp le résultat numérique de "rang[j]".
                temp = rang[j];
                // Affecte à l’élément "j" de rang le résultat numérique de "rang[j + 1]".
                rang[j] = rang[(j + 1)];
                // Affecte à l’élément "j + 1" de rang le résultat numérique de "temp".
                rang[(j + 1)] = temp;
                
            }
        }
    }
    // Affecte la valeur 0 à meilleur.
    meilleur = 0;
    // Crée une boucle pour i de valeur initiale "1" tant que "i < 3" avec mise à jour "i + 1".
    for (i = 1; i < 3; i = (i + 1)) {
        // Crée un bloc si "promo[i].total > promo[meilleur].total".
        if (promo[i].total > promo[meilleur].total) {
            // Affecte à meilleur le résultat numérique de "i".
            meilleur = i;
            
        }
    }
    // Affecte la valeur 0 à bons.
    bons = 0;
    // Affecte la valeur 0 à i.
    i = 0;
    // Crée une boucle tant que "i < 9".
    while (i < 9) {
        // Crée un bloc si "notes[i] >= 10".
        if (notes[i] >= 10) {
            // Affecte à bons le résultat de "bons + 1".
            bons = (bons + 1);
            
        }
        // Affecte à i le résultat de "i + 1".
        i = (i + 1);
        
    }
    // Affecte la valeur 0 à k.
    k = 0;
    // Crée une boucle avec test final tant que "k < 3".
    do {
        // Affecte à k le résultat de "k + 1".
        k = (k + 1);
        
    } while (k < 3);
    // Affecte à cumul le résultat de l’appel de somme avec "promo[0].total" et "promo[1].total" et "promo[2].total".
    cumul = somme(promo[0].total, promo[1].total, promo[2].total);
    // Affecte à moy le résultat de l’appel de moyenne avec "cumul" et "9".
    moy = moyenne(cumul, 9);
    // Affiche moy en notation fixe avec 2 décimales.
    printf("%.2f", moy);
    // Affiche un retour à la ligne.
    printf("\n");
    // Crée un bloc si "moy >= 14".
    if (moy >= 14) {
        // Affecte le caractère 'B' à mention.
        mention = 'B';
        
    }
    // Ajoute une branche sinon si "moy >= 10".
    else if (moy >= 10) {
        // Affecte le caractère 'P' à mention.
        mention = 'P';
        
    }
    // Ajoute une branche sinon.
    else {
        // Affecte le caractère 'E' à mention.
        mention = 'E';
        
    }
    // Crée un aiguillage sur "mention".
    switch (mention) {
        // Ajoute un cas pour le caractère 'B'.
        case 'B':
        // Affiche le texte "bien".
        printf("%s", "bien");
        // Sors de l’aiguillage.
        break;
        // Ajoute un cas pour le caractère 'P'.
        case 'P':
        // Affiche le texte "passable".
        printf("%s", "passable");
        // Sors de l’aiguillage.
        break;
        // Ajoute le cas par défaut.
        default:
        // Affiche le texte "insuffisant".
        printf("%s", "insuffisant");
        // Sors de l’aiguillage.
        break;
        
    }
    // Affiche un retour à la ligne.
    printf("\n");
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
    for (i = 0; i < 3; i = (i + 1)) {
        // Affiche l’élément "i" de rang.
        printf("%d", rang[i]);
        // Affiche le texte " ".
        printf("%s", " ");
        
    }
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche le champ initiale de l’élément "meilleur" de promo.
    printf("%d", promo[meilleur].initiale);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche la valeur de bons.
    printf("%d", bons);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche la valeur de k.
    printf("%d", k);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte à g l’ouverture du fichier "resultat.txt" en écriture.
    g = fopen("resultat.txt", "w");
    // Vérifie que "g != 0".
    assert(g != 0);
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
    for (i = 0; i < 3; i = (i + 1)) {
        // Affecte à temp le résultat numérique de "rang[i]".
        temp = rang[i];
        // Écris la valeur de temp dans le fichier g.
        fprintf(g, "%d", temp);
        // Écris le texte " " dans le fichier g.
        fprintf(g, "%s", " ");
        
    }
    // Ferme le fichier g.
    fclose(g);
    // Affiche la taille du type structure Etudiant.
    printf("%zu", sizeof(struct Etudiant));
    // Affiche un retour à la ligne.
    printf("\n");
    // Retourne la valeur 0.
    return 0;
    
}
