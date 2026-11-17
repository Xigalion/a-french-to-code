// Tests complémentaires de l'exercice de clôture.
//
// Objet : donner une preuve de compilation et d'exécution aux intentions que
// l'exercice de gestion des notes n'emploie pas. Avec lui, les 84 intentions
// du catalogue sont employées dans un programme compilé.
//
// Rien n'est ajouté « pour faire nombre » : chaque étape porte une intention
// que `journal/couverture.md` désignait comme non employée par la clôture.

export const FICHIERS = [
  {
    name: 'pointeurs.c',
    titre: 'pointeurs, mémoire dynamique, constante et limites',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue la bibliothèque stdlib.h.'],
      ['eof', 'Inclue la bibliothèque assert.h.'],
      ['eof', 'Inclue la bibliothèque limits.h.'],

      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare une constante de type int nommée MAX avec le résultat de "100".'],
      ['last', 'Crée un entier nommé x de valeur 7.'],
      ['last', 'Crée un entier nommé a de valeur 2.'],
      ['last', 'Crée une variable de type double nommée ratio avec le résultat de "1.5".'],
      ['last', 'Déclare un entier nommé n.'],
      ['last', 'Crée un pointeur de type int nommé p avec l’adresse de x.'],
      ['last', 'Déclare un pointeur de type int nommé q.'],
      ['last', 'Déclare un pointeur de type int nommé bloc.'],

      ['last', 'Affiche la valeur pointée par p.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affecte la valeur 5 à la valeur pointée par p.'],
      ['last', 'Affecte à la valeur pointée par p le résultat numérique de "a + 1".'],
      ['last', 'Affecte l’adresse de x à q.'],
      ['last', 'Affiche la valeur pointée par q.'],
      ['last', 'Affiche un retour à la ligne.'],

      ['last', 'Affecte à n la taille du type double.'],
      ['last', 'Affiche n en décimal.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affiche MAX en décimal.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affecte à n le résultat numérique de "INT_MAX / 1000000".'],
      ['last', 'Affiche n en décimal.'],
      ['last', 'Affiche un retour à la ligne.'],

      ['last', 'Affecte à bloc l’allocation de 3 éléments de type int.'],
      ['last', 'Vérifie que "bloc != 0".'],
      ['last', 'Affecte la valeur 11 à la valeur pointée par bloc.'],
      ['last', 'Affecte à q la réallocation de bloc pour 6 éléments de type int.'],
      ['last', 'Vérifie que "q != 0".'],
      ['last', 'Affiche la valeur pointée par q.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Libère la mémoire pointée par q.'],

      ['last', 'Affiche ratio en notation fixe avec 2 décimales.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Retourne la valeur 0.'],
    ],
  },
  {
    name: 'caracteres.c',
    titre: 'caractères, éléments, chaîne lue, structure et aiguillage entier',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue la bibliothèque assert.h.'],

      ['eof', 'Déclare une structure nommée Point.'],
      ['last', 'Ajoute un champ de type int nommé x.'],
      ['last', 'Ajoute un champ de type char nommé code.'],
      ['nl', 0],
      ['eof', 'Déclare le synonyme Repere pour la structure Point.'],

      ['eof', 'Crée une fonction nommée annonce qui ne retourne rien.'],
      ['last', 'Affiche le texte "ok".'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Retourne.'],
      ['nl', 0],

      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare une variable de type structure Point nommée p.'],
      ['last', 'Déclare un pointeur de type structure Point nommé q.'],
      ['last', 'Crée un caractère nommé c de valeur \'A\'.'],
      ['last', 'Déclare un tableau de type char nommé mot de dimension 16.'],
      ['last', 'Déclare un tableau de type int nommé t de dimension 3.'],
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Déclare un fichier nommé f.'],

      ['last', 'Appelle annonce.'],
      ['last', 'Affecte la valeur 5 au champ x de p.'],
      ['last', 'Affecte le caractère \'B\' au champ code de p.'],
      ['last', 'Affecte l’adresse de p à q.'],
      ['last', 'Affiche le champ x pointé par q.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affiche le caractère c.'],
      ['last', 'Affiche un retour à la ligne.'],

      ['last', 'Affecte la valeur 5 à l’élément "0" de t.'],
      // Lu, et pas seulement écrit : sans cette lecture, GCC avertit
      // « variable set but not used », et un avertissement non voulu est une
      // anomalie du test, pas un détail.
      ['last', 'Affiche l’élément "0" de t.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affecte le caractère \'Z\' à l’élément "0" de mot.'],
      ['last', 'Affiche le caractère de l’élément "0" de mot.'],
      ['last', 'Affiche un retour à la ligne.'],

      // Boucle avec les deux transferts, et un aiguillage sur un entier.
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".'],
      ['last', 'Crée un bloc si "i == 1".'],
      ['last', 'Passe à l’itération suivante de la boucle la plus intérieure.'],
      ['nl', 8],
      // L'aiguillage porte sur « i » et non sur « t[0] » : l'expression
      // contrôlée est analysée par le PROFIL ENTIER, gelé depuis le lot 6, où
      // l'indexation est fermée. Le moteur a refusé « t[0] » ici, et il a
      // raison : la limite est écrite dans docs/LIMITES_CONNUES.md.
      ['last', 'Crée un aiguillage sur "i".'],
      ['last', 'Ajoute un cas pour la valeur 0.'],
      ['last', 'Affiche la valeur de i.'],
      ['last', 'Sors de l’aiguillage.'],
      ['last', 'Ajoute le cas par défaut.'],
      ['last', 'Affiche le texte "?".'],
      ['last', 'Sors de l’aiguillage.'],
      ['nl', 8],
      ['last', 'Crée un bloc si "i == 2".'],
      ['last', 'Sors de la boucle la plus intérieure.'],
      ['nl', 4],
      ['last', 'Affiche un retour à la ligne.'],

      // Chaîne lue depuis un fichier, bornée.
      ['last', 'Affecte à f l’ouverture du fichier "mot.txt" en lecture.'],
      ['last', 'Vérifie que "f != 0".'],
      ['last', 'Lis une chaîne de dimension 16 depuis le fichier f dans mot.'],
      ['last', 'Ferme le fichier f.'],
      ['last', 'Affiche la chaîne mot.'],
      ['last', 'Retourne la valeur 0.'],
    ],
  },
  {
    name: 'calcul.h',
    titre: 'en-tête : protection, prototype et liaison externe',
    steps: [
      ['eof', 'Ouvre la protection d’en-tête nommée CALCUL_H.'],
      ['eof', 'Déclare le prototype d’une fonction nommée double_de qui retourne un int et prend un int nommé a.'],
      ['eof', 'Déclare la variable externe de type int nommée compteur.'],
      ['eof', 'Ferme la protection d’en-tête.'],
    ],
  },
  {
    name: 'module.c',
    titre: 'module : en-tête local, définition et compteur partagé',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue l’en-tête "calcul.h".'],
      ['eof', 'Crée un entier nommé compteur de valeur 0.'],

      ['eof', 'Crée une fonction nommée double_de qui retourne un int et prend un int nommé a.'],
      ['last', 'Affecte à compteur le résultat de "compteur + 1".'],
      ['last', 'Retourne le résultat de "a * 2".'],
      ['nl', 0],

      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare un entier nommé r.'],
      ['last', 'Affecte à r le résultat de l’appel de double_de avec "21".'],
      ['last', 'Affiche la valeur de r.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affiche la valeur de compteur.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Retourne la valeur 0.'],
    ],
  },
];

/** Les données lues par les programmes. */
export const DONNEES = { 'mot.txt': 'bonjour\n' };

/** Sorties calculées à la main AVANT exécution.
 * pointeurs.c : *p = 7 ; puis *p = 5 puis *p = a + 1 = 3, donc x = 3 ;
 *   sizeof(double) = 8 ; MAX = 100 ; INT_MAX / 1000000 = 2147 ; *bloc = 11,
 *   conservé par realloc ; ratio = 1.50.
 * caracteres.c : « ok » ; q->x = 5 ; c = A ; mot[0] = Z ; la boucle affiche
 *   i = 0 (aiguillage sur t[0] == 5), saute i = 1 par continue, affiche 2
 *   puis sort par break ; enfin la chaîne lue « bonjour\n ».
 * module.c : 42 puis 1. */
export const ATTENDUS = {
  'pointeurs.c': '7\n3\n8\n100\n2147\n11\n1.50\n',
  'caracteres.c': 'ok\n5\nA\n5\nZ\n0?\nbonjour\n',
  'module.c': '42\n1\n',
};

/** Compilation séparée : `calcul.h` n'est pas une unité de traduction. */
export const ENTETES = ['calcul.h'];
