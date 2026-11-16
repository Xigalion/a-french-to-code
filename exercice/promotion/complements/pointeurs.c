// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Inclue la bibliothèque stdlib.h.
#include <stdlib.h>

// Inclue la bibliothèque assert.h.
#include <assert.h>

// Inclue la bibliothèque limits.h.
#include <limits.h>

// Crée la fonction principale.
int main(void) {
    // Déclare une constante de type int nommée MAX avec le résultat de "100".
    const int MAX = 100;
    // Crée un entier nommé x de valeur 7.
    int x = 7;
    // Crée un entier nommé a de valeur 2.
    int a = 2;
    // Crée une variable de type double nommée ratio avec le résultat de "1.5".
    double ratio = 1.5;
    // Déclare un entier nommé n.
    int n;
    // Crée un pointeur de type int nommé p avec l’adresse de x.
    int *p = &x;
    // Déclare un pointeur de type int nommé q.
    int *q;
    // Déclare un pointeur de type int nommé bloc.
    int *bloc;
    // Affiche la valeur pointée par p.
    printf("%d", *p);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte la valeur 5 à la valeur pointée par p.
    *p = 5;
    // Affecte à la valeur pointée par p le résultat numérique de "a + 1".
    *p = (a + 1);
    // Affecte l’adresse de x à q.
    q = &x;
    // Affiche la valeur pointée par q.
    printf("%d", *q);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte à n la taille du type double.
    n = sizeof(double);
    // Affiche n en décimal.
    printf("%d", n);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affiche MAX en décimal.
    printf("%d", MAX);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte à n le résultat numérique de "INT_MAX / 1000000".
    n = (INT_MAX / 1000000);
    // Affiche n en décimal.
    printf("%d", n);
    // Affiche un retour à la ligne.
    printf("\n");
    // Affecte à bloc l’allocation de 3 éléments de type int.
    bloc = malloc(3 * sizeof(int));
    // Vérifie que "bloc != 0".
    assert(bloc != 0);
    // Affecte la valeur 11 à la valeur pointée par bloc.
    *bloc = 11;
    // Affecte à q la réallocation de bloc pour 6 éléments de type int.
    q = realloc(bloc, 6 * sizeof(int));
    // Vérifie que "q != 0".
    assert(q != 0);
    // Affiche la valeur pointée par q.
    printf("%d", *q);
    // Affiche un retour à la ligne.
    printf("\n");
    // Libère la mémoire pointée par q.
    free(q);
    // Affiche ratio en notation fixe avec 2 décimales.
    printf("%.2f", ratio);
    // Affiche un retour à la ligne.
    printf("\n");
    // Retourne la valeur 0.
    return 0;
    
}
