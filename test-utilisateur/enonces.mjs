// Les neuf énoncés de docs/TEST_EXERCICES_PALIER1.md, sous la forme que le
// moteur consomme.
//
// But : prouver que chaque exercice est faisable avec le SEUL catalogue, et
// que la ligne « compilation attendue » de l'énoncé est une MESURE et non une
// prévision. La campagne 1 a appris le prix d'une sortie prédite de mémoire.
//
// 'eof'  : la phrase va en fin de fichier, à la portée fichier.
// 'last' : sur la dernière ligne blanche du document.
// ['nl', n] : geste d'éditeur — l'étudiant appuie sur Entrée pour créer une
//             ligne blanche à l'indentation n. C-A ne le fait pas, et chaque
//             usage est compté dans le journal.

const DEBUT = [
  ['eof', 'Inclue la bibliothèque stdio.h.'],
  ['eof', 'Crée la fonction principale.'],
];
const FIN = [['last', 'Retourne la valeur 0.']];

export const EXERCICES = [
  {
    name: 'ex1.c',
    titre: 'Exercice 1 — afficher une valeur',
    steps: [
      ...DEBUT,
      ['last', 'Crée un entier nommé age de valeur 20.'],
      ['last', 'Affiche la valeur de age.'],
      ['last', 'Affiche un retour à la ligne.'],
      ...FIN,
    ],
  },
  {
    name: 'ex2.c',
    titre: 'Exercice 2 — calculer',
    steps: [
      ...DEBUT,
      ['last', 'Déclare un entier nommé resultat.'],
      ['last', 'Affecte à resultat le résultat de "2 + 3 * 4".'],
      ['last', 'Affiche la valeur de resultat.'],
      ['last', 'Déclare une variable de type double nommée moyenne.'],
      ['last', 'Affecte à moyenne le résultat numérique de "(double) 7 / 2".'],
      ['last', 'Affiche moyenne en notation fixe avec 2 décimales.'],
      ...FIN,
    ],
  },
  {
    name: 'ex3.c',
    titre: 'Exercice 3 — décider',
    steps: [
      ...DEBUT,
      ['last', 'Crée un entier nommé age de valeur 20.'],
      ['last', 'Crée un bloc si "age >= 18".'],
      ['last', 'Affiche le texte "majeur".'],
      ['nl', 4],
      ['last', 'Ajoute une branche sinon si "age >= 12".'],
      ['last', 'Affiche le texte "adolescent".'],
      ['nl', 4],
      ['last', 'Ajoute une branche sinon.'],
      ['last', 'Affiche le texte "enfant".'],
      ['nl', 4],
      ...FIN,
    ],
  },
  {
    name: 'ex4.c',
    titre: 'Exercice 4 — répéter',
    steps: [
      ...DEBUT,
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 5" avec mise à jour "i + 1".'],
      ['last', 'Crée un bloc si "i == 2".'],
      ['last', 'Passe à l’itération suivante de la boucle la plus intérieure.'],
      ['nl', 8],
      ['last', 'Affiche la valeur de i.'],
      ['nl', 4],
      ['last', 'Affecte la valeur 0 à i.'],
      ['last', 'Crée une boucle tant que "i < 5".'],
      ['last', 'Affiche la valeur de i.'],
      ['last', 'Affecte à i le résultat de "i + 1".'],
      ['last', 'Crée un bloc si "i == 2".'],
      ['last', 'Sors de la boucle la plus intérieure.'],
      ['nl', 4],
      ...FIN,
    ],
  },
  {
    name: 'ex5.c',
    titre: 'Exercice 5 — découper',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.'],
      ['last', 'Retourne le résultat de "a + b".'],
      ['nl', 0],
      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare un entier nommé total.'],
      ['last', 'Affecte à total le résultat de l’appel de somme avec "2" et "3".'],
      ['last', 'Affiche la valeur de total.'],
      ...FIN,
    ],
  },
  {
    name: 'ex6.c',
    titre: 'Exercice 6 — grouper',
    steps: [
      ...DEBUT,
      ['last', 'Déclare un tableau de type int nommé notes de dimension 3.'],
      ['last', 'Affecte la valeur 12 à l’élément "0" de notes.'],
      ['last', 'Affecte la valeur 15 à l’élément "1" de notes.'],
      ['last', 'Affecte la valeur 9 à l’élément "2" de notes.'],
      ['last', 'Affiche l’élément "1" de notes.'],
      ['last', 'Crée un entier nommé cumul de valeur 0.'],
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".'],
      ['last', 'Affecte à cumul le résultat numérique de "cumul + notes[i]".'],
      ['nl', 4],
      ['last', 'Affiche la valeur de cumul.'],
      ['last', 'Crée un tableau de type char nommé mot de dimension 6 avec le texte "hello".'],
      ['last', 'Affiche la chaîne mot.'],
      ['last', 'Affiche le caractère de l’élément "0" de mot.'],
      ...FIN,
    ],
  },
  {
    name: 'ex7.c',
    titre: 'Exercice 7 — désigner',
    steps: [
      ...DEBUT,
      ['last', 'Déclare un entier nommé x.'],
      ['last', 'Crée un pointeur de type int nommé p avec l’adresse de x.'],
      ['last', 'Affecte la valeur 5 à la valeur pointée par p.'],
      ['last', 'Affiche la valeur pointée par p.'],
      ['last', 'Affecte à x le résultat numérique de "*p + 1".'],
      ['last', 'Affiche la valeur de x.'],
      ...FIN,
    ],
  },
  {
    name: 'ex8.c',
    titre: 'Exercice 8 — assembler',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Déclare une structure nommée Point.'],
      ['last', 'Ajoute un champ de type int nommé x.'],
      ['last', 'Ajoute un champ de type int nommé y.'],
      ['nl', 0],
      ['eof', 'Crée la fonction principale.'],
      ['last', 'Crée un entier nommé x de valeur 7.'],
      ['last', 'Déclare une variable de type structure Point nommée centre.'],
      ['last', 'Affecte la valeur 3 au champ x de centre.'],
      ['last', 'Affiche le champ x de centre.'],
      ['last', 'Déclare un fichier nommé f.'],
      ['last', 'Affecte à f l’ouverture du fichier "sortie.txt" en écriture.'],
      ['last', 'Écris la valeur de x dans le fichier f.'],
      ['last', 'Ferme le fichier f.'],
      ...FIN,
    ],
  },
  {
    name: 'ex9.c',
    titre: 'Exercice 9 — un avertissement, pas un refus',
    // Compilé, PAS exécuté : une division entière par zéro a un comportement
    // indéfini, et l'énoncé le dit à l'étudiant.
    executer: false,
    steps: [
      ...DEBUT,
      ['last', 'Déclare un entier nommé resultat.'],
      ['last', 'Affecte à resultat le résultat de "10 / 0".'],
      ['last', 'Affiche la valeur de resultat.'],
      ...FIN,
    ],
  },
];

/** Les refus que l'énoncé annonce, vérifiés un par un. `test/testUtilisateur.test.mjs`
 * les vérifie déjà depuis les documents ; ils sont rappelés ici pour que le
 * journal du corrigé porte lui aussi la preuve. */
export const REFUS_ANNONCES = [
  ['ex1 — mot-clé comme nom', 'Déclare un entier nommé int.'],
  ['ex2 — profil entier et conversion', 'Affecte à moyenne le résultat de "(double) 7 / 2".'],
  ['ex2 — opérande manquant', 'Affecte à resultat le résultat de "2 +".'],
  ['ex3 — affectation en condition', 'Crée un bloc si "age => 18".'],
  ['ex4 — boucle pour abrégée', 'Crée une boucle pour i de "0" tant que "i < 5".'],
  ['ex6 — dimension nulle', 'Déclare un tableau de type int nommé t de dimension 0.'],
  ['ex6 — indice sans guillemets', 'Affecte la valeur 12 à l’élément 0 de notes.'],
  ['ex7 — déréférencement d’une valeur', 'Affiche la valeur pointée par 5.'],
  ['parcours — hors catalogue', 'Crée un entier age = 20.'],
  ['parcours — entier en lettres', 'Crée un entier nommé age de valeur vingt.'],
];
