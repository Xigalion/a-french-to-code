// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue la bibliothèque assert.h.
#include <assert.h>

// Déclare une structure nommée Point.
struct Point {
    // Ajoute un champ de type int nommé x.
    int x;
    // Ajoute un champ de type char nommé code.
    char code;
    
};

// Déclare le synonyme Repere pour la structure Point.
typedef struct Point Repere;

// Crée une fonction nommée annonce qui ne retourne rien.
void annonce(void) {
    // Affiche le texte "ok".
    printf("%s", "ok");
    // Affiche un retour à la ligne.
    printf("\n");
    // Retourne.
    return;
    
}

// Crée la fonction principale.
int main(void) {
    // Déclare une variable de type structure Point nommée p.
    struct Point p;
    // Déclare un pointeur de type structure Point nommé q.
    struct Point *q;
    // Crée un caractère nommé c de valeur 'A'.
    char c = 'A';
    // Déclare un tableau de type char nommé mot de dimension 16.
    char mot[16];
    // Déclare un tableau de type int nommé t de dimension 3.
    int t[3];
    // Déclare un entier nommé i.
    int i;
    // Déclare un fichier nommé f.
    FILE *f;
    // Appelle annonce.
    annonce();
    // Affecte la valeur 5 au champ x de p.
    p.x = 5;
    // Affecte le caractère 'B' au champ code de p.
    p.code = 'B';
    // Affecte l’adresse de p à q.
    q = &p;
    // Affiche le champ x pointé par q.
    printf("%d", q->x);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche le caractère c.
    printf("%c", c);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte la valeur 5 à l’élément "0" de t.
    t[0] = 5;
    // Affiche l’élément "0" de t.
    printf("%d", t[0]);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte le caractère 'Z' à l’élément "0" de mot.
    mot[0] = 'Z';
    // Affiche le caractère de l’élément "0" de mot.
    printf("%c", mot[0]);
    // Affiche un retour à la ligne.
    printf("\n");
    // Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
    for (i = 0; i < 3; i = (i + 1)) {
        // Crée un bloc si "i == 1".
        if (i == 1) {
            // Passe à l’itération suivante de la boucle la plus intérieure.
            continue;
            
        }
        // Crée un aiguillage sur "i".
        switch (i) {
            // Ajoute un cas pour la valeur 0.
            case 0:
            // Affiche la valeur de i.
            printf("%d", i);
            // Sors de l’aiguillage.
            break;
            // Ajoute le cas par défaut.
            default:
            // Affiche le texte "?".
            printf("%s", "?");
            // Sors de l’aiguillage.
            break;
            
        }
        // Crée un bloc si "i == 2".
        if (i == 2) {
            // Sors de la boucle la plus intérieure.
            break;
            
        }
    }
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte à f l’ouverture du fichier "mot.txt" en lecture.
    f = fopen("mot.txt", "r");
    // Vérifie que "f != 0".
    assert(f != 0);
    // Lis une chaîne de dimension 16 depuis le fichier f dans mot.
    fgets(mot, 16, f);
    // Ferme le fichier f.
    fclose(f);
    // Affiche la chaîne mot.
    printf("%s", mot);
    // Retourne la valeur 0.
    return 0;
    
}
