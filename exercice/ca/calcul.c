// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue la bibliothèque assert.h.
#include <assert.h>

// Inclue l’en-tête "carnet.h".
#include "carnet.h"

// Déclare une variable de type int nommée compteur.
int compteur;

// Déclare une constante de type int nommée MAX_NOTE avec le résultat de "20".
const int MAX_NOTE = 20;

// Crée une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.
double moyenneDe(int total, int n) {
    // Vérifie que "n > 0".
    assert(n > 0);
    // Retourne le résultat numérique de "(double) total / n".
    return (((double) total) / n);
    
}
// Crée une fonction nommée verifieNote qui ne retourne rien et prend un int nommé note.
void verifieNote(int note) {
    // Vérifie que "note <= MAX_NOTE".
    assert(note <= MAX_NOTE);
    
}
// Crée une fonction nommée dangereuse qui retourne un double et prend un int nommé total.
double dangereuse(int total) {
    // Retourne le résultat numérique de "total / 0".
    return (total / 0);
    
}
