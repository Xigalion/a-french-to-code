// Campagne 3 — scénarios complémentaires, INDÉPENDANTS du carnet de notes.
//
// But unique : donner une preuve de compilation et d'exécution aux 19
// compétences que les campagnes 1 et 2 traduisaient et plaçaient sans
// jamais les employer. Elles sont listées nommément ci-dessous, et chaque
// étape qui en couvre une porte son numéro en commentaire.
//
// Rien n'est ajouté « pour faire nombre » : les trois programmes sont les
// plus petits qui emploient ces 19 compétences et qui ont un résultat
// observable.
const Q = "'";

/** Les 19 compétences sans preuve de compilation après la campagne 2,
 * telles que `exercice/campagne2/journal/matrice.md` les nomme. */
export const CIBLES = [
  [1, 'Initialisation à la déclaration'],
  [2, 'Expression entière et priorités'],
  [3, 'Format hexadécimal'],
  [4, 'Branche sinon si'],
  [5, 'Branche sinon'],
  [6, 'Boucle à test final'],
  [7, 'Boucle pour'],
  [8, 'Sortie de boucle'],
  [9, 'Itération suivante'],
  [10, 'Étiquette caractère'],
  [11, 'Type caractère'],
  [12, 'Littéral caractère'],
  [13, 'Affichage caractère'],
  [14, 'Affichage d’élément'],
  [15, 'Déréférencement en écriture'],
  [16, 'Variable de type structure'],
  [17, 'Réallocation'],
  [18, 'Lecture d’entier'],
  [19, 'Fin de fichier'],
  // Ajoutées après les lots 30 et 31 : capacités neuves, donc sans preuve.
  [20, 'Définition de fonction interne'],
  [21, 'Lecture de chaîne bornée'],
  [22, 'Affectation de caractère à un champ'],
];

export const FILES3 = [
  {
    name: 'classement.c',
    // Couvre les cibles 1 à 15.
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Crée la fonction principale.'],

      // 1 — initialisation à la déclaration, 2 — priorités, 3 — hexadécimal
      ['last', 'Crée un entier nommé base de valeur 20.'],
      ['last', 'Déclare un entier nommé calcul.'],
      ['last', 'Affecte à calcul le résultat de "base + 3 * 2".'],
      ['last', 'Affiche calcul en hexadécimal.'],
      ['last', 'Affiche un retour à la ligne.'],

      // 4 — sinon si, 5 — sinon
      ['last', 'Crée un bloc si "calcul > 100".'],
      ['last', 'Affiche le texte "grand".'],
      ['nl', 4],
      ['last', 'Ajoute une branche sinon si "calcul > 20".'],
      ['last', 'Affiche le texte "moyen".'],
      ['nl', 4],
      ['last', 'Ajoute une branche sinon.'],
      ['last', 'Affiche le texte "petit".'],
      ['nl', 4],
      ['last', 'Affiche un retour à la ligne.'],

      // 6 — boucle à test final
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Affecte la valeur 0 à i.'],
      ['last', 'Crée une boucle avec test final tant que "i < 3".'],
      ['last', 'Affecte à i le résultat numérique de "i + 1".'],
      ['nl', 4],
      ['last', 'Affiche la valeur de i.'],
      ['last', 'Affiche un retour à la ligne.'],

      // 7 — boucle pour, 8 — sortie de boucle, 9 — itération suivante
      ['last', 'Déclare un entier nommé j.'],
      ['last', 'Crée une boucle pour j de valeur initiale "0" tant que "j < 5" avec mise à jour "j + 1".'],
      ['last', 'Crée un bloc si "j == 1".'],
      ['last', 'Passe à l’itération suivante de la boucle la plus intérieure.'],
      ['nl', 8],
      ['last', 'Crée un bloc si "j == 4".'],
      ['last', 'Sors de la boucle la plus intérieure.'],
      ['nl', 8],
      ['last', 'Affiche la valeur de j.'],
      ['nl', 4],
      ['last', 'Affiche un retour à la ligne.'],

      // 10 — étiquette caractère, 11 — type caractère, 12 — littéral,
      // 13 — affichage caractère
      ['last', `Crée un caractère nommé lettre de valeur ${Q}A${Q}.`],
      ['last', 'Déclare un caractère nommé copie.'],
      ['last', 'Crée un aiguillage sur "lettre".'],
      ['last', `Ajoute un cas pour le caractère ${Q}A${Q}.`],
      ['last', `Affecte le caractère ${Q}B${Q} à copie.`],
      ['last', 'Sors de l’aiguillage.'],
      ['last', 'Ajoute le cas par défaut.'],
      ['last', `Affecte le caractère ${Q}Z${Q} à copie.`],
      ['nl', 4],
      ['last', 'Affiche le caractère copie.'],
      ['last', 'Affiche un retour à la ligne.'],

      // 14 — affichage d'élément
      ['last', 'Déclare un tableau de type int nommé t de dimension 3.'],
      ['last', 'Affecte la valeur 7 à l’élément "0" de t.'],
      ['last', 'Affiche l’élément "0" de t.'],
      ['last', 'Affiche un retour à la ligne.'],

      // 15 — déréférencement en écriture
      ['last', 'Déclare un entier nommé n.'],
      ['last', 'Déclare un pointeur de type int nommé p.'],
      ['last', 'Affecte l’adresse de n à p.'],
      ['last', 'Affecte la valeur 5 à la valeur pointée par p.'],
      ['last', 'Affiche la valeur de n.'],
      ['last', 'Affiche un retour à la ligne.'],

      ['last', 'Retourne la valeur 0.'],
    ],
  },
  {
    name: 'inventaire.c',
    // Couvre les cibles 16 et 17.
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue la bibliothèque stdlib.h.'],
      ['eof', 'Déclare une structure nommée Point.'],
      ['last', 'Ajoute un champ de type int nommé x.'],
      ['last', 'Ajoute un champ de type int nommé y.'],
      // Lot 30 — un champ caractère, pour que l'affectation ci-dessous ait
      // une cible réelle et compilée.
      ['last', 'Ajoute un champ de type char nommé initiale.'],
      ['eof', 'Crée la fonction principale.'],

      // 16 — variable de type structure
      ['last', 'Déclare une variable de type structure Point nommée centre.'],
      ['last', 'Affecte la valeur 3 au champ x de centre.'],
      ['last', 'Affecte la valeur 4 au champ y de centre.'],
      // Lot 30 — affectation d'un caractère à un champ, genre qu'aucune
      // phrase n'atteignait avant.
      ['last', `Affecte le caractère ${Q}C${Q} au champ initiale de centre.`],
      ['last', 'Affiche le champ x de centre.'],
      ['last', 'Affiche un retour à la ligne.'],
      // L'effet de l'affectation de caractère doit être OBSERVABLE : le champ
      // est affiché avec « %d », donc son code numérique — 'C' vaut 67. C'est
      // exactement la leçon de CHARACTER_IS_INTEGER.
      ['last', 'Affiche le champ initiale de centre.'],
      ['last', 'Affiche un retour à la ligne.'],

      // 17 — réallocation
      ['last', 'Déclare un pointeur de type int nommé tab.'],
      ['last', 'Affecte à tab l’allocation de 2 éléments de type int.'],
      ['last', 'Crée un bloc si "tab == NULL".'],
      ['last', 'Retourne la valeur 1.'],
      ['nl', 4],
      ['last', 'Affecte la valeur 1 à l’élément "0" de tab.'],
      ['last', 'Déclare un pointeur de type int nommé grand.'],
      ['last', 'Affecte à grand la réallocation de tab pour 4 éléments de type int.'],
      ['last', 'Crée un bloc si "grand == NULL".'],
      ['last', 'Libère la mémoire pointée par tab.'],
      ['last', 'Retourne la valeur 1.'],
      ['nl', 4],
      ['last', 'Affecte la valeur 9 à l’élément "2" de grand.'],
      ['last', 'Affiche l’élément "2" de grand.'],
      ['last', 'Affiche un retour à la ligne.'],
      ['last', 'Libère la mémoire pointée par grand.'],
      ['last', 'Retourne la valeur 0.'],
    ],
  },
  {
    name: 'journal.c',
    // Couvre les cibles 18 et 19.
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare un fichier nommé sortie.'],
      ['last', 'Affecte à sortie l’ouverture du fichier "donnees.txt" en écriture.'],
      ['last', 'Crée un bloc si "sortie == NULL".'],
      ['last', 'Retourne la valeur 1.'],
      ['nl', 4],
      ['last', 'Déclare un entier nommé ecrit.'],
      ['last', 'Affecte la valeur 42 à ecrit.'],
      ['last', 'Écris la valeur de ecrit dans le fichier sortie.'],
      ['last', 'Ferme le fichier sortie.'],

      // 18 — lecture d'entier
      ['last', 'Déclare un fichier nommé entree.'],
      ['last', 'Affecte à entree l’ouverture du fichier "donnees.txt" en lecture.'],
      ['last', 'Crée un bloc si "entree == NULL".'],
      ['last', 'Retourne la valeur 1.'],
      ['nl', 4],
      ['last', 'Déclare un entier nommé valeur.'],
      ['last', 'Lis un entier depuis le fichier entree dans valeur.'],
      ['last', 'Affiche la valeur de valeur.'],
      ['last', 'Affiche un retour à la ligne.'],

      // 19 — fin de fichier
      ['last', 'Crée un bloc si la fin du fichier entree est atteinte.'],
      ['last', 'Affiche le texte "fin".'],
      ['last', 'Affiche un retour à la ligne.'],
      ['nl', 4],
      ['last', 'Ferme le fichier entree.'],
      ['last', 'Retourne la valeur 0.'],
    ],
  },
];

/** Quatrième programme, ajouté après les lots 30 et 31 : les deux capacités
 * neuves — définition de fonction INTERNE et lecture de chaîne BORNÉE —
 * doivent être compilées et exécutées, pas seulement traduites. Une
 * capacité livrée sans preuve de compilation est exactement ce que la
 * campagne 3 existe pour corriger. */
FILES3.push({
  name: 'texte.c',
  steps: [
    ['eof', 'Inclue la bibliothèque stdio.h.'],

    // Lot 31 — définition de fonction interne. Elle est APPELÉE plus bas :
    // une fonction static jamais utilisée déclenche un avertissement du
    // compilateur, et ce programme doit compiler sans un seul.
    ['eof', 'Crée une fonction interne nommée longueurMax qui retourne un int.'],
    ['last', 'Retourne la valeur 16.'],

    ['eof', 'Crée la fonction principale.'],
    ['last', 'Déclare un fichier nommé sortie.'],
    ['last', 'Affecte à sortie l’ouverture du fichier "texte.txt" en écriture.'],
    ['last', 'Crée un bloc si "sortie == NULL".'],
    ['last', 'Retourne la valeur 1.'],
    ['nl', 4],
    ['last', 'Écris le texte "bonjour" dans le fichier sortie.'],
    ['last', 'Ferme le fichier sortie.'],

    ['last', 'Déclare un fichier nommé entree.'],
    ['last', 'Affecte à entree l’ouverture du fichier "texte.txt" en lecture.'],
    ['last', 'Crée un bloc si "entree == NULL".'],
    ['last', 'Retourne la valeur 1.'],
    ['nl', 4],

    // Lot 31 — lecture de chaîne bornée. Le tableau est initialisé AVANT la
    // lecture : fgets renvoie NULL en fin de fichier sans rien écrire, et
    // C-A n'offre aucune formulation pour tester ce retour. Un tableau non
    // initialisé serait alors lu sans valeur définie.
    ['last', 'Crée un tableau de type char nommé ligne de dimension 16 avec le texte "".'],
    ['last', 'Lis une chaîne de dimension 16 depuis le fichier entree dans ligne.'],
    ['last', 'Affiche la chaîne ligne.'],
    ['last', 'Affiche un retour à la ligne.'],
    ['last', 'Ferme le fichier entree.'],

    // L'appel qui rend la fonction interne utilisée.
    ['last', 'Déclare un entier nommé max.'],
    ['last', 'Affecte à max le résultat de l’appel de longueurMax.'],
    ['last', 'Affiche la valeur de max.'],
    ['last', 'Affiche un retour à la ligne.'],
    ['last', 'Retourne la valeur 0.'],
  ],
});

/** Refus attendus, à vérifier comme tels : ce que la campagne 3 ne doit PAS
 * pouvoir écrire, pour que les limites restent des limites. */
export const REFUS_ATTENDUS = [
  ['tableau à deux dimensions', 'Déclare un tableau de type int nommé grille de dimension 3 de dimension 4.'],
  ['liste d’initialisation', 'Déclare un tableau de type int nommé t de dimension 3 avec les valeurs 1, 2, 3.'],
  // La forme SANS borne reste refusée, et c'est voulu : le lot 31 exige
  // « de dimension {entier} », pour que la borne soit écrite et non déduite.
  ['lecture de chaîne sans borne', 'Lis une chaîne depuis le fichier entree dans texte.'],
  ['commande de limite', 'Affiche la limite maximale du type int.'],
  ['soustraction de pointeurs', 'Affecte à n le résultat numérique de "p - q".'],
];
