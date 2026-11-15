// Ouvre la protection d’en-tête nommée CARNET_H.
#ifndef CARNET_H
#define CARNET_H

// Déclare une structure nommée Eleve.
struct Eleve {
    // Ajoute un champ de type int nommé note.
    int note;
    // Ajoute un champ de type char nommé initiale.
    char initiale;
    // Ajoute un champ de type char nommé nom de dimension 32.
    char nom[32];
    // Ajoute un champ pointeur de type structure Eleve nommé suivant.
    struct Eleve *suivant;
    
};
// Déclare le synonyme Eleve pour la structure Eleve.
typedef struct Eleve Eleve;

// Déclare le prototype d’une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.
double moyenneDe(int total, int n);

// Déclare le prototype d’une fonction nommée meilleureNote qui retourne un int et prend un int nommé n.
int meilleureNote(int n);

// Déclare le prototype d’une fonction nommée mention qui ne retourne rien et prend un int nommé note.
void mention(int note);

// Déclare la variable externe de type int nommée compteur.
extern int compteur;

// Ferme la protection d’en-tête.
#endif

