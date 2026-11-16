// Exercice de clôture — gestion des notes d'une promotion.
//
// Conçu comme un programmeur C le ferait pour ce domaine, et NON pour
// contourner les limites de C-A : un tableau de structures pour la promotion,
// deux fonctions, un tri, des fichiers et des contrôles d'erreurs. Si une
// phrase manque au catalogue, le journal doit le dire — c'est l'objet de
// l'exercice, pas un accident à éviter.
//
// Mobilisé, domaine par domaine :
//   1 fondations      : includes, main, déclarations, affichages, retour
//   2 calculs         : expressions entières, conversion, double, format .2f
//   3 décisions       : si / sinon si / sinon, aiguillage sur un caractère
//   4 boucles         : pour, tant que, avec test final, boucles imbriquées
//   5 fonctions       : deux définitions, paramètres, retours, appels
//   6 tableaux        : trois tableaux, indices calculés, chaîne initialisée
//   7 structures      : structure, champs, tableau de structures, accès
//   8 classement      : tri à bulles décroissant avec échange
//   9 fichiers/erreurs: lecture, écriture, fin de fichier, assertions

export const FICHIERS = [
  {
    name: 'notes.c',
    titre: 'gestion des notes d’une promotion de trois étudiants',
    steps: [
      // --- en-têtes et type -------------------------------------------------
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue la bibliothèque stdlib.h.'],
      ['eof', 'Inclue la bibliothèque assert.h.'],

      ['eof', 'Déclare une structure nommée Etudiant.'],
      ['last', 'Ajoute un champ de type char nommé initiale.'],
      ['last', 'Ajoute un champ de type int nommé total.'],
      ['nl', 0],

      // --- deux fonctions ---------------------------------------------------
      ['eof', 'Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b et un int nommé c.'],
      ['last', 'Retourne le résultat de "a + b + c".'],
      ['nl', 0],

      ['eof', 'Crée une fonction nommée moyenne qui retourne un double et prend un int nommé total et un int nommé effectif.'],
      ['last', 'Retourne le résultat numérique de "(double) total / effectif".'],
      ['nl', 0],

      // --- programme principal ---------------------------------------------
      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare un tableau de type structure Etudiant nommé promo de dimension 3.'],
      ['last', 'Déclare un tableau de type int nommé notes de dimension 9.'],
      ['last', 'Déclare un tableau de type int nommé rang de dimension 3.'],
      ['last', 'Crée un tableau de type char nommé initiales de dimension 4 avec le texte "ABC".'],
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Déclare un entier nommé j.'],
      ['last', 'Déclare un entier nommé note.'],
      ['last', 'Déclare un entier nommé total.'],
      ['last', 'Déclare un entier nommé temp.'],
      ['last', 'Déclare un entier nommé cumul.'],
      ['last', 'Déclare un entier nommé meilleur.'],
      ['last', 'Déclare un entier nommé bons.'],
      ['last', 'Déclare un entier nommé k.'],
      ['last', 'Déclare un caractère nommé mention.'],
      ['last', 'Déclare une variable de type double nommée moy.'],
      ['last', 'Déclare un fichier nommé f.'],
      ['last', 'Déclare un fichier nommé g.'],

      // --- lecture du fichier, avec contrôle d'erreur -----------------------
      ['last', 'Affecte à f l’ouverture du fichier "notes.txt" en lecture.'],
      ['last', 'Vérifie que "f != 0".'],
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 9" avec mise à jour "i + 1".'],
      ['last', 'Lis un entier depuis le fichier f dans note.'],
      ['last', 'Affecte à l’élément "i" de notes le résultat numérique de "note".'],
      ['nl', 4],
      ['last', 'Crée un bloc si la fin du fichier f est atteinte.'],
      ['last', 'Affiche le texte "fichier incomplet".'],
      ['nl', 4],
      ['last', 'Ferme le fichier f.'],

      // --- totaux par étudiant : appel de fonction et champs ----------------
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".'],
      ['last', 'Affecte à total le résultat de l’appel de somme avec "notes[i * 3]" et "notes[i * 3 + 1]" et "notes[i * 3 + 2]".'],
      ['last', 'Affecte au champ total de l’élément "i" de promo le résultat numérique de "total".'],
      ['last', 'Affecte au champ initiale de l’élément "i" de promo le résultat numérique de "initiales[i]".'],
      ['last', 'Affecte à l’élément "i" de rang le résultat numérique de "total".'],
      ['nl', 4],

      // --- classement : tri à bulles décroissant ----------------------------
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 2" avec mise à jour "i + 1".'],
      ['last', 'Crée une boucle pour j de valeur initiale "0" tant que "j < 2" avec mise à jour "j + 1".'],
      ['last', 'Crée un bloc si "rang[j] < rang[j + 1]".'],
      ['last', 'Affecte à temp le résultat numérique de "rang[j]".'],
      ['last', 'Affecte à l’élément "j" de rang le résultat numérique de "rang[j + 1]".'],
      ['last', 'Affecte à l’élément "j + 1" de rang le résultat numérique de "temp".'],
      ['nl', 4],

      // --- meilleur étudiant : lecture d'un champ d'élément -----------------
      ['last', 'Affecte la valeur 0 à meilleur.'],
      ['last', 'Crée une boucle pour i de valeur initiale "1" tant que "i < 3" avec mise à jour "i + 1".'],
      ['last', 'Crée un bloc si "promo[i].total > promo[meilleur].total".'],
      ['last', 'Affecte à meilleur le résultat numérique de "i".'],
      ['nl', 4],

      // --- notes au-dessus de la moyenne : boucle tant que ------------------
      ['last', 'Affecte la valeur 0 à bons.'],
      ['last', 'Affecte la valeur 0 à i.'],
      ['last', 'Crée une boucle tant que "i < 9".'],
      ['last', 'Crée un bloc si "notes[i] >= 10".'],
      ['last', 'Affecte à bons le résultat de "bons + 1".'],
      ['nl', 8],
      ['last', 'Affecte à i le résultat de "i + 1".'],
      ['nl', 4],

      // --- boucle à test final ----------------------------------------------
      ['last', 'Affecte la valeur 0 à k.'],
      ['last', 'Crée une boucle avec test final tant que "k < 3".'],
      ['last', 'Affecte à k le résultat de "k + 1".'],
      ['nl', 4],

      // --- moyenne générale et mention --------------------------------------
      ['last', 'Affecte à cumul le résultat de l’appel de somme avec "promo[0].total" et "promo[1].total" et "promo[2].total".'],
      ['last', 'Affecte à moy le résultat de l’appel de moyenne avec "cumul" et "9".'],
      ['last', 'Affiche moy en notation fixe avec 2 décimales.'],
      ['last', 'Affiche un retour à la ligne.'],

      ['last', 'Crée un bloc si "moy >= 14".'],
      ['last', 'Affecte le caractère \'B\' à mention.'],
      ['nl', 4],
      ['last', 'Ajoute une branche sinon si "moy >= 10".'],
      ['last', 'Affecte le caractère \'P\' à mention.'],
      ['nl', 4],
      ['last', 'Ajoute une branche sinon.'],
      ['last', 'Affecte le caractère \'E\' à mention.'],
      ['nl', 4],

      // --- aiguillage sur un caractère --------------------------------------
      ['last', 'Crée un aiguillage sur "mention".'],
      ['last', 'Ajoute un cas pour le caractère \'B\'.'],
      ['last', 'Affiche le texte "bien".'],
      ['last', 'Sors de l’aiguillage.'],
      ['last', 'Ajoute un cas pour le caractère \'P\'.'],
      ['last', 'Affiche le texte "passable".'],
      ['last', 'Sors de l’aiguillage.'],
      ['last', 'Ajoute le cas par défaut.'],
      ['last', 'Affiche le texte "insuffisant".'],
      ['last', 'Sors de l’aiguillage.'],
      ['nl', 4],

      // --- restitution -------------------------------------------------------
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".'],
      ['last', 'Affiche l’élément "i" de rang.'],
      ['last', 'Affiche le texte " ".'],
      ['nl', 4],
      ['last', 'Affiche un retour à la ligne.'],
      // Le champ est de type char et s'affiche en %d : aucune formulation
      // n'affiche un champ en %c, pas même sur une structure simple. Limitation
      // documentée, hors du périmètre du lot 32.
      ['last', 'Affiche le champ initiale de l’élément "meilleur" de promo.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affiche la valeur de bons.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Affiche la valeur de k.'],
      ['last', 'Affiche un retour à la ligne.'],

      // --- écriture du classement, avec contrôle d'erreur -------------------
      ['last', 'Affecte à g l’ouverture du fichier "resultat.txt" en écriture.'],
      ['last', 'Vérifie que "g != 0".'],
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".'],
      ['last', 'Affecte à temp le résultat numérique de "rang[i]".'],
      ['last', 'Écris la valeur de temp dans le fichier g.'],
      ['last', 'Écris le texte " " dans le fichier g.'],
      ['nl', 4],
      ['last', 'Ferme le fichier g.'],

      // --- empreinte mémoire du type ----------------------------------------
      ['last', 'Affiche la taille du type structure Etudiant.'],
      ['last', 'Affiche un retour à la ligne.'],

      ['last', 'Retourne la valeur 0.'],
    ],
  },
];

/** Le fichier de données que le programme lit. Neuf notes, trois étudiants.
 * A : 12 15 9 = 36 ; B : 18 14 16 = 48 ; C : 8 11 10 = 29. */
export const DONNEES = { 'notes.txt': '12 15 9 18 14 16 8 11 10\n' };

/** Les refus que l'exercice doit obtenir, pour que le périmètre soit vérifié
 * et pas seulement affirmé. */
export const REFUS_ATTENDUS = [
  ['liste d’initialisation entre accolades', 'Crée un tableau de type int nommé t de dimension 3 avec les valeurs 1, 2, 3.'],
  ['paramètre de type structure', 'Crée une fonction nommée afficher qui ne retourne rien et prend une structure Etudiant nommée e.'],
  ['tableau à deux dimensions', 'Déclare un tableau de type int nommé grille de dimension 3 de dimension 3.'],
  ['affichage d’une chaîne de structure', 'Affiche la chaîne promo[i].nom.'],
  ['tri fourni par une commande', 'Trie le tableau rang par ordre décroissant.'],
];
