// Campagne 2 — scénario de validation après les lots 26 à 29.
//
// Volontairement DISTINCT de la campagne 1, qui reste intacte dans
// `exercice/` telle qu'elle s'est déroulée. Ce fichier part du même scénario
// — c'est la consigne : « rejoue les scénarios de l'exercice intégrateur » —
// et applique exactement trois différences, chacune justifiée par un lot :
//
//   lot 27 : le champ de type tableau n'est plus un blocage. La retouche
//            manuelle de la campagne 1 disparaît : C-A écrit la ligne.
//   lot 28 : limits.h n'est plus un blocage, et une macro de limite s'écrit
//            dans une expression.
//   lot 29 : des séparateurs explicites, pour que la sortie soit lisible.
//            La campagne 1 avait produit une seule suite de chiffres.
//
// Et une vérification que la campagne 1 ne pouvait pas faire :
//   lot 26 : une instruction posée à la portée fichier doit être REFUSÉE.
//            La campagne 1 la plaçait en silence.
import { FILES } from '../scenario.mjs';

const LOT27 = 'Ajoute un champ de type char nommé nom de dimension 32.';
const LIMITS = 'Inclue la bibliothèque limits.h.';
const MACRO_V1 = 'Affiche la limite maximale du type int.';

/** Scénario brut : le même que la campagne 1, plus les étapes que les lots 27
 * et 28 rendent possibles. Le champ de type tableau était déjà dans le
 * scénario — il y figurait comme blocage attendu, et il passe maintenant.
 *
 * Pour le lot 28, deux ajouts sont nécessaires, et ils disent exactement ce
 * que le lot livre : l'en-tête s'inclut, et la macro s'écrit dans une
 * EXPRESSION. La phrase « Affiche la limite maximale du type int. » de la
 * campagne 1 reste refusée, volontairement : aucune commande ne nomme une
 * limite, et c'est le §2.2 du lot 28. */
export const FILES2 = FILES.map((file) => {
  const steps = [];
  for (const step of file.steps) {
    steps.push(step);
    // L'en-tête, dans le fichier qui l'utilise.
    if (file.name === 'carnet.c' && step[1] === 'Inclue l’en-tête "carnet.h".') {
      steps.push(['eof', 'Inclue la bibliothèque limits.h.']);
    }
    // La macro, par la seule route qui existe : un nom dans une expression.
    if (file.name === 'carnet.c' && step[1] === 'Affiche la valeur de meilleure.') {
      steps.push(['last', 'Déclare un entier nommé plafond.']);
      steps.push(['last', 'Affecte à plafond le résultat numérique de "INT_MAX".']);
      steps.push(['last', 'Affiche la valeur de plafond.']);
    }
  }
  return { name: file.name, steps };
});

/** Les affichages de la campagne 1 qui se collaient les uns aux autres. La
 * liste est EXPLICITE, phrase par phrase : aucun séparateur n'est deviné, et
 * C-A n'en a ajouté aucun. Les libellés sont ceux du scénario, relevés dans
 * `exercice/scenario.mjs` — un libellé approximatif n'insérerait rien, ce qui
 * est arrivé au premier essai et se voyait dans la sortie compilée. */
const SEPARER_APRES = new Set([
  'Affiche le texte "Carnet de notes".',
  'Affiche la chaîne titre.',
  'Affiche la valeur pointée par p.',
  'Affiche la valeur de premiere.',
  'Affiche la taille du type structure Eleve.',
  'Affiche le champ note pointé par eleves.',
  'Affiche moyenne en notation fixe avec 2 décimales.',
  'Affiche la valeur de meilleure.',
  'Affiche la valeur de plafond.',
  'Affiche le texte "parfait".',
  'Affiche le texte "a revoir".',
]);

/** Le parcours caractère par caractère affiche dans une boucle : son
 * séparateur ne peut pas être posé après l'affichage, qui est dans le corps.
 * Il est donc posé AVANT la première instruction qui suit la boucle. */
const SEPARER_AVANT = new Set(['Déclare un pointeur de type int nommé p.']);

/** Variante corrigée. Deux différences avec celle de la campagne 1 :
 *  - le champ tableau n'est plus filtré, donc plus aucune retouche manuelle ;
 *  - des séparateurs explicites rendent la sortie lisible. */
export const FILES2_CORRIGE = FILES2.map((file) => {
  const steps = file.steps
    // Le compteur est DÉFINI une seule fois, dans calcul.c : inchangé.
    .filter((step) => !(file.name === 'carnet.c' && step[1] === 'Déclare une variable de type int nommée compteur.'));
  const corrige = [];
  for (const step of steps) {
    if (file.name === 'carnet.c' && step[1] === 'Déclare un entier nommé premiere.') {
      corrige.push(['last', 'Affecte la valeur 17 à l’élément "1" de notes.']);
    }
    if (file.name === 'carnet.c' && step[1] === 'Écris le texte "Meilleure note" dans le fichier sortie.') {
      corrige.push(['last', 'Crée un bloc si "sortie == NULL".']);
      corrige.push(['last', 'Libère la mémoire pointée par eleves.']);
      corrige.push(['last', 'Retourne la valeur 1.']);
      corrige.push(['nl', 4]);
    }
    // Lot 29 : séparateurs explicites, écrits phrase par phrase.
    if (SEPARER_AVANT.has(step[1])) corrige.push(['last', 'Affiche un retour à la ligne.']);
    corrige.push(step);
    if (SEPARER_APRES.has(step[1])) corrige.push(['last', 'Affiche un retour à la ligne.']);
  }
  return { name: file.name, steps: corrige };
});

/** Blocages encore attendus après les lots 26 à 29. Six, contre huit à la
 * campagne 1 : le champ tableau et limits.h sont levés. */
export const BLOCAGES_CAMPAGNE2 = [
  ['macro de limite : aucune commande dédiée', MACRO_V1],
  ['définition static', 'Crée une fonction interne nommée aide qui retourne un int.'],
  ['lecture de chaîne depuis un fichier', 'Lis une chaîne depuis le fichier f dans s.'],
  ['initialiseur entre accolades', 'Déclare un tableau de type int nommé t de dimension 3 avec les valeurs 1, 2, 3.'],
  ['arithmétique de pointeur non signalée', 'Affecte à p le résultat numérique de "p + 1".'],
  ['profil entier fermé à l’indexation', 'Affecte à x le résultat de "notes[0]".'],
];

/** Blocages LEVÉS par cette campagne, à vérifier comme tels. */
export const BLOCAGES_LEVES = [
  ['lot 27 — champ de type tableau', LOT27, 'char nom[32];'],
  ['lot 28 — limits.h', LIMITS, '#include <limits.h>'],
  ['lot 29 — séparateur explicite', 'Affiche un retour à la ligne.', 'printf("\\n");'],
];

/** Vérifications de portée que la campagne 1 ne pouvait pas faire : le lot 26
 * doit REFUSER chacune de ces instructions posée à la portée fichier. */
export const PORTEE_FICHIER = [
  'Affecte la valeur 5 à compteur.',
  'Affiche la valeur de compteur.',
  'Appelle mention avec "15".',
  'Crée un bloc si "compteur > 0".',
  'Crée une boucle tant que "compteur > 0".',
  'Vérifie que "compteur > 0".',
  'Libère la mémoire pointée par eleves.',
  'Affiche un retour à la ligne.',
];
