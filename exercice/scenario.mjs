// Scénario de l'exercice intégrateur, exécuté par le moteur et le
// planificateur réels de C-A. Chaque étape nomme sa phrase et l'endroit du
// curseur, exactement comme un utilisateur le ferait dans l'éditeur.
//
//   'last' : la dernière ligne blanche du document — ce que laisse
//            l'insertion précédente, donc la frappe naturelle à la suite.
//   'eof'  : une nouvelle ligne blanche ajoutée en fin de fichier, pour
//            sortir d'un bloc et continuer à la portée fichier.
const NUL = "'" + String.fromCharCode(92) + "0'";

export const FILES = [
  {
    name: 'carnet.h',
    steps: [
      ['eof', 'Ouvre la protection d’en-tête nommée CARNET_H.'],
      ['eof', 'Déclare une structure nommée Eleve.'],
      ['last', 'Ajoute un champ de type int nommé note.'],
      ['last', 'Ajoute un champ de type char nommé initiale.'],
      // Blocage attendu : un champ de type tableau.
      ['last', 'Ajoute un champ de type char nommé nom de dimension 32.'],
      ['last', 'Ajoute un champ pointeur de type structure Eleve nommé suivant.'],
      ['eof', 'Déclare le synonyme Eleve pour la structure Eleve.'],
      ['eof', 'Déclare le prototype d’une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.'],
      ['eof', 'Déclare le prototype d’une fonction nommée meilleureNote qui retourne un int et prend un int nommé n.'],
      ['eof', 'Déclare le prototype d’une fonction nommée mention qui ne retourne rien et prend un int nommé note.'],
      ['eof', 'Déclare la variable externe de type int nommée compteur.'],
      ['eof', 'Ferme la protection d’en-tête.'],
    ],
  },
  {
    name: 'calcul.c',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue la bibliothèque assert.h.'],
      ['eof', 'Inclue l’en-tête "carnet.h".'],
      ['eof', 'Déclare une variable de type int nommée compteur.'],
      ['eof', 'Déclare une constante de type int nommée MAX_NOTE avec le résultat de "20".'],
      ['eof', 'Crée une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.'],
      ['last', 'Vérifie que "n > 0".'],
      ['last', 'Retourne le résultat numérique de "(double) total / n".'],
      ['eof', 'Crée une fonction nommée verifieNote qui ne retourne rien et prend un int nommé note.'],
      ['last', 'Vérifie que "note <= MAX_NOTE".'],
      // Domaine 2 : l'avertissement de division par zéro doit se déclencher.
      ['eof', 'Crée une fonction nommée dangereuse qui retourne un double et prend un int nommé total.'],
      ['last', 'Retourne le résultat numérique de "total / 0".'],
    ],
  },
  {
    name: 'carnet.c',
    steps: [
      ['eof', 'Inclue la bibliothèque stdio.h.'],
      ['eof', 'Inclue la bibliothèque stdlib.h.'],
      ['eof', 'Inclue la bibliothèque assert.h.'],
      ['eof', 'Inclue l’en-tête "carnet.h".'],
      ['eof', 'Déclare une variable de type int nommée compteur.'],

      // Domaine 8 — recherche de la meilleure note, par composition.
      ['eof', 'Crée une fonction nommée meilleureNote qui retourne un int et prend un int nommé n.'],
      ['last', 'Déclare un tableau de type int nommé notes de dimension 3.'],
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Déclare un entier nommé meilleure.'],
      ['last', 'Affecte la valeur 12 à l’élément "0" de notes.'],
      ['last', 'Affecte la valeur 17 à l’élément "1" de notes.'],
      ['last', 'Affecte la valeur 9 à l’élément "2" de notes.'],
      ['last', 'Affecte la valeur 0 à meilleure.'],
      ['last', 'Affecte la valeur 0 à i.'],
      ['last', 'Crée une boucle tant que "i < n".'],
      ['last', 'Crée un bloc si "notes[i] > meilleure".'],
      ['last', 'Affecte à meilleure le résultat numérique de "notes[i]".'],
      // Sortir d'un bloc demande une ligne blanche que C-A ne crée pas : un
      // bloc consomme la ligne où il est posé. Geste consigné.
      ['nl', 8],
      ['last', 'Affecte à i le résultat numérique de "i + 1".'],
      ['nl', 4],
      ['last', 'Retourne le résultat numérique de "meilleure".'],

      // Domaine 3 — aiguillage.
      ['eof', 'Crée une fonction nommée mention qui ne retourne rien et prend un int nommé note.'],
      ['last', 'Crée un aiguillage sur "note".'],
      ['last', 'Ajoute un cas pour la valeur 20.'],
      ['last', 'Affiche le texte "parfait".'],
      ['last', 'Sors de l’aiguillage.'],
      ['last', 'Ajoute le cas par défaut.'],
      ['last', 'Affiche le texte "a revoir".'],

      // Domaines 1, 5, 6, 7, 9 — le programme principal.
      ['eof', 'Crée la fonction principale.'],
      ['last', 'Déclare un entier nommé n.'],
      ['last', 'Affecte la valeur 3 à n.'],
      ['last', 'Vérifie que "n > 0".'],
      ['last', 'Affiche le texte "Carnet de notes".'],

      // Domaine 5 — chaîne, parcours, pointeur, décalage.
      ['last', 'Crée un tableau de type char nommé titre de dimension 7 avec le texte "Carnet".'],
      ['last', 'Affiche la chaîne titre.'],
      ['last', 'Déclare un entier nommé i.'],
      ['last', 'Affecte la valeur 0 à i.'],
      ['last', `Crée une boucle tant que "titre[i] != ${NUL}".`],
      ['last', 'Affiche le caractère de l’élément "i" de titre.'],
      ['last', 'Affecte à i le résultat numérique de "i + 1".'],
      ['nl', 4],
      ['last', 'Déclare un pointeur de type int nommé p.'],
      ['last', 'Affecte l’adresse de n à p.'],
      ['last', 'Affiche la valeur pointée par p.'],
      ['last', 'Déclare un tableau de type int nommé notes de dimension 3.'],
      ['last', 'Affecte la valeur 12 à l’élément "0" de notes.'],
      ['last', 'Déclare un entier nommé premiere.'],
      ['last', 'Affecte à premiere le résultat numérique de "*(notes + 0)".'],
      ['last', 'Affiche la valeur de premiere.'],

      // Domaine 6 — structure, allocation, accès, libération.
      ['last', 'Déclare un pointeur de type structure Eleve nommé eleves.'],
      ['last', 'Affecte à eleves l’allocation de n éléments de type structure Eleve.'],
      ['last', 'Crée un bloc si "eleves == NULL".'],
      ['last', 'Retourne la valeur 1.'],
      ['nl', 4],
      ['last', 'Affiche la taille du type structure Eleve.'],
      ['last', 'Vérifie que "eleves != NULL".'],
      ['last', 'Affecte la valeur 15 au champ note pointé par eleves.'],
      ['last', 'Affiche le champ note pointé par eleves.'],

      // Domaine 8 — échange de deux éléments, sans variable inventée.
      ['last', 'Déclare un entier nommé temporaire.'],
      ['last', 'Affecte à temporaire le résultat numérique de "notes[0]".'],
      ['last', 'Affecte à l’élément "0" de notes le résultat numérique de "notes[1]".'],
      ['last', 'Affecte à l’élément "1" de notes le résultat numérique de "temporaire".'],

      // Domaine 4 — appels.
      ['last', 'Déclare une variable de type double nommée moyenne.'],
      ['last', 'Affecte à moyenne le résultat de l’appel de moyenneDe avec "41" et "n".'],
      ['last', 'Affiche moyenne en notation fixe avec 2 décimales.'],
      ['last', 'Appelle mention avec "17".'],
      ['last', 'Déclare un entier nommé meilleure.'],
      ['last', 'Affecte à meilleure le résultat de l’appel de meilleureNote avec "n".'],
      ['last', 'Affiche la valeur de meilleure.'],

      // Domaine 7 — fichier.
      ['last', 'Déclare un fichier nommé sortie.'],
      ['last', 'Affecte à sortie l’ouverture du fichier "resultat.txt" en écriture.'],
      ['last', 'Écris le texte "Meilleure note" dans le fichier sortie.'],
      ['last', 'Écris la valeur de meilleure dans le fichier sortie.'],
      ['last', 'Ferme le fichier sortie.'],
      ['last', 'Libère la mémoire pointée par eleves.'],
      ['last', 'Retourne la valeur 0.'],
      ['nl', 0],
    ],
  },
];

/** Blocages recensés par l'énoncé, à confirmer ou démentir. */
export const BLOCAGES_ATTENDUS = [
  ['champ de type tableau', 'Ajoute un champ de type char nommé nom de dimension 32.'],
  ['limits.h refusé', 'Inclue la bibliothèque limits.h.'],
  ['macro de limite', 'Affiche la limite maximale du type int.'],
  ['définition static', 'Crée une fonction interne nommée aide qui retourne un int.'],
  ['lecture de chaîne depuis un fichier', 'Lis une chaîne depuis le fichier f dans s.'],
  ['initialiseur entre accolades', 'Déclare un tableau de type int nommé t de dimension 3 avec les valeurs 1, 2, 3.'],
  ['arithmétique de pointeur non signalée', 'Affecte à p le résultat numérique de "p + 1".'],
  ['profil entier fermé à l’indexation', 'Affecte à x le résultat de "notes[0]".'],
];

/** Variante corrigée. Les corrections sont faites PAR C-A, en changeant les
 * phrases, partout où C-A peut les exprimer. La seule chose qu'il ne peut pas
 * écrire — un champ de type tableau — est appliquée à la main et isolée dans
 * `exercice/retouches.md`. */
export const FILES_CORRIGE = FILES.map((file) => {
  const steps = file.steps
    // Le compteur est DÉFINI une seule fois, dans calcul.c : l'information
    // EXTERNAL_LINKAGE le disait, et la version brute l'avait ignorée.
    .filter((step) => !(file.name === 'carnet.c' && step[1] === 'Déclare une variable de type int nommée compteur.'))
    // Le champ tableau est refusé par C-A ; la retouche est appliquée à part.
    .filter((step) => step[1] !== 'Ajoute un champ de type char nommé nom de dimension 32.');
  const corrige = [];
  for (const step of steps) {
    // notes[1] était lu sans avoir été écrit.
    if (file.name === 'carnet.c' && step[1] === 'Déclare un entier nommé premiere.') {
      corrige.push(['last', 'Affecte la valeur 17 à l’élément "1" de notes.']);
    }
    // fopen n'était pas testé : FOPEN_CAN_FAIL le disait.
    if (file.name === 'carnet.c' && step[1] === 'Écris le texte "Meilleure note" dans le fichier sortie.') {
      corrige.push(['last', 'Crée un bloc si "sortie == NULL".']);
      corrige.push(['last', 'Libère la mémoire pointée par eleves.']);
      corrige.push(['last', 'Retourne la valeur 1.']);
      corrige.push(['nl', 4]);
    }
    corrige.push(step);
  }
  return { name: file.name, steps: corrige };
});
