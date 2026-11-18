// La DICTEE de l'exercice de clôture : les quatre fichiers, et la machine qui
// les écrit par la session réelle de l'hôte.
//
// Séparée de la compilation pour une raison apprise en phase 2 : `npm test`
// doit pouvoir rejouer la dictée à chaque exécution, et ne peut pas exiger un
// JDK. Une suite de tests qu'on ne peut pas exécuter ne protège de rien.
//
// `exercice/java/cloture.mjs` ajoute la compilation et l'exécution.
import { JavaTranslationSession } from '../../extension/out/extension/src/sessionJava.js';

const FICHIERS = [
  {
    chemin: 'ecole/Affichable.java',
    phrases: [
      'Déclare le paquetage ecole.',
      'Crée une interface nommée Affichable.',
      'Ajoute une méthode attendue nommée afficher qui ne retourne rien.',
    ],
  },
  {
    chemin: 'ecole/Eleve.java',
    phrases: [
      'Déclare le paquetage ecole.',
      'Crée une classe nommée Eleve qui implémente Affichable.',
      'Ajoute un champ privé de type int nommé age.',
      'Ajoute un champ de type chaîne nommé nom.',
      'Crée un constructeur qui prend un int nommé age.',
      'Affecte au champ age la valeur du paramètre age.',
      'Affecte le texte "sans nom" à nom.',
      'sortir',
      'Crée une méthode publique nommée getAge qui retourne un int.',
      'Retourne le résultat de "age".',
      'sortir',
      'Crée une méthode redéfinie nommée afficher qui ne retourne rien.',
      'Affiche la chaîne nom.',
      'Affiche le texte " a ".',
      'Affiche la valeur de age',
      'Affiche le texte " ans" et passe à la ligne.',
    ],
  },
  {
    chemin: 'ecole/Etudiant.java',
    phrases: [
      'Déclare le paquetage ecole.',
      // Une classe qui hérite vit dans SON fichier : Java n'accepte qu'une
      // classe publique par fichier, et A n'écrit pas de classe publique
      // seconde. C'est une contrainte du langage, pas une limite de A.
      'Crée une classe nommée Etudiant qui hérite de Eleve.',
      'Crée un constructeur qui prend un int nommé age.',
      'Appelle le constructeur de la classe parente avec "age".',
      'Affecte le texte "étudiant" à nom.',
    ],
  },
  {
    chemin: 'ecole/Promotion.java',
    phrases: [
      'Déclare le paquetage ecole.',
      // Les imports sont des PHRASES : A n'en ajoute aucun de lui-même.
      'Importe java.io.BufferedReader.',
      'Importe java.io.FileReader.',
      'Importe java.io.IOException.',
      'Importe java.io.PrintWriter.',
      'Importe java.util.ArrayList.',
      'Importe java.util.HashMap.',
      'Importe java.util.List.',
      'Importe java.util.Map.',
      'Crée une classe nommée Promotion.',
      'Crée la fonction principale.',
      // --- un TABLEAU, dimension fixe, mis à zéro par `new`
      'Déclare un tableau de type int nommé bulletins de dimension 3.',
      'Affecte la valeur 12 à l’élément "0" du tableau bulletins.',
      'Affecte la valeur 15 à l’élément "1" du tableau bulletins.',
      'Affecte la valeur 9 à l’élément "2" du tableau bulletins.',
      // --- écrire le fichier, dans un bloc essaie AVEC ressource
      'Crée un bloc essaie avec un écrivain nommé sortie sur le fichier "notes.txt".',
      'Écris le texte "12\\n" dans le fichier sortie.',
      'Écris le texte "15\\n" dans le fichier sortie.',
      'Écris le texte "9\\n" dans le fichier sortie.',
      'sortir',
      // L'exception VÉRIFIÉE : A ne l'a pas attrapée tout seul, c'est une
      // phrase. Décision J6.
      'Ajoute une branche attrape IOException nommée e.',
      'Affiche le texte "écriture impossible : ".',
      'Affiche le message de l’exception e.',
      'sortir',
      // --- une COLLECTION, qui grandit
      'Crée une liste de type int nommée notes.',
      'Déclare une chaîne nommée ligne.',
      'Déclare un entier nommé valeur.',
      'Crée un bloc essaie avec un lecteur nommé lecteur sur le fichier "notes.txt".',
      'Lis une ligne depuis le lecteur lecteur dans ligne.',
      'Affecte à valeur la conversion en entier de la chaîne ligne.',
      'Ajoute "valeur" à la fin de la liste notes.',
      'Lis une ligne depuis le lecteur lecteur dans ligne.',
      'Affecte à valeur la conversion en entier de la chaîne ligne.',
      'Ajoute "valeur" à la fin de la liste notes.',
      'Lis une ligne depuis le lecteur lecteur dans ligne.',
      'Affecte à valeur la conversion en entier de la chaîne ligne.',
      'Ajoute "valeur" à la fin de la liste notes.',
      'sortir',
      'Ajoute une branche attrape IOException nommée e.',
      'Affiche le texte "lecture impossible : ".',
      'Affiche le message de l’exception e.',
      'sortir',
      // --- parcourir le TABLEAU et la LISTE : deux phrases, deux codes
      'Déclare un entier nommé totalTableau.',
      'Affecte la valeur 0 à totalTableau.',
      'Crée une boucle pour chaque int nommé b du tableau bulletins.',
      'Affecte à totalTableau le résultat numérique de "totalTableau + b".',
      'sortir',
      'Déclare un entier nommé totalListe.',
      'Affecte la valeur 0 à totalListe.',
      'Crée une boucle pour chaque int nommé v de la liste notes.',
      'Affecte à totalListe le résultat numérique de "totalListe + v".',
      'sortir',
      'Affiche le texte "total tableau = ".',
      'Affiche la valeur de totalTableau et passe à la ligne.',
      'Affiche le texte "total liste = ".',
      'Affiche la valeur de totalListe et passe à la ligne.',
      // --- l'assertion : inactive sans -ea, et l'information le dit
      'Vérifie que "totalTableau == totalListe".',
      // --- une TABLE à clés textuelles
      'Crée une table de type int nommée parNom avec des clés textuelles.',
      'Associe "totalTableau" à la clé "tableau" dans la table parNom.',
      'Affecte à valeur la valeur de la clé "tableau" dans la table parNom.',
      'Affiche le texte "relu dans la table = ".',
      'Affiche la valeur de valeur et passe à la ligne.',
      // --- un aiguillage sur une CHAÎNE : légal en Java, illégal en C17
      'Déclare une chaîne nommée jour.',
      'Affecte le texte "lundi" à jour.',
      'Crée un aiguillage sur "jour".',
      'Ajoute un cas pour le texte "lundi".',
      'Affiche le texte "début de semaine" et passe à la ligne.',
      'Sors de l’aiguillage.',
      'Ajoute le cas par défaut.',
      'Affiche le texte "autre jour" et passe à la ligne.',
      'Sors de l’aiguillage.',
      'sortir',
      // --- les OBJETS et le POLYMORPHISME
      'Crée un objet nommé premier de la classe Eleve avec "12".',
      'Appelle la méthode afficher de premier.',
      'Crée une variable de type Affichable nommée second comme un objet de la classe Etudiant avec "15".',
      'Appelle la méthode afficher de second.',
      'Affecte à valeur le résultat de l’appel de la méthode getAge de premier.',
      'Affiche le texte "age du premier = ".',
      'Affiche la valeur de valeur et passe à la ligne.',
      'sortir',
      'sortir',
      // --- une classe SECONDE, non publique, dans le même fichier
      'Crée une classe interne nommée Compteur.',
      'Ajoute un champ de type int nommé total.',
    ],
  },
];


/** Dicte un fichier entier par la session réelle : saisie, aperçu,
 * confirmation, insertion. Rend le document, et compte au passage.
 *
 * `sortir` fait remonter le curseur d'un bloc : c'est un geste d'éditeur, et
 * les gestes sont COMPTÉS, jamais cachés. */
export function dicterFichier({ chemin, phrases }, compteurs) {
  let document = '\n';
  let curseur = 0;
  for (const phrase of phrases) {
    if (phrase === 'sortir') {
      const fermante = document.indexOf('}', curseur);
      if (fermante === -1) throw new Error('aucun bloc à fermer dans ' + chemin);
      const finLigne = document.indexOf('\n', fermante);
      const coupe = finLigne === -1 ? document.length : finLigne + 1;
      document = document.slice(0, coupe) + '\n' + document.slice(coupe);
      curseur = coupe;
      compteurs.gestes++;
      continue;
    }
    const target = {
      document: { id: 'file:///' + chemin, revision: 1, text: document },
      cursorOffset: curseur, singleCursor: true,
      indentUnit: '    ', indentSignature: '    |4', open: true, eol: '\n',
    };
    const session = new JavaTranslationSession(target);
    session.updateText(phrase);
    const diagnostic = session.diagnose(target);
    if (diagnostic !== undefined) {
      throw new Error('MANQUE dans ' + chemin + ' : ' + JSON.stringify(phrase) + '\n'
        + diagnostic.stage + ' / ' + diagnostic.code + ' : ' + diagnostic.message);
    }
    for (const information of session.information) compteurs.informations.add(information.code);
    const apercu = session.prepare(target);
    if (apercu.status !== 'preview') throw new Error('aperçu refusé : ' + phrase);
    if (!session.reviewReady(apercu.preview.token, target)) throw new Error('revue refusée : ' + phrase);
    const applique = session.beginApply(apercu.preview.token, target);
    if (applique.status !== 'apply') throw new Error('confirmation refusée : ' + phrase);
    session.finishApply(true);
    document = applique.expectedAfter;
    compteurs.phrases++;
    const edit = applique.plan.edits[0];
    const finInsertion = edit.range.start + edit.newText.length;
    if (applique.plan.cursorAfter !== finInsertion) {
      curseur = applique.plan.cursorAfter;
    } else {
      document = document.slice(0, finInsertion) + '\n' + document.slice(finInsertion);
      curseur = finInsertion + 1;
    }
  }
  return document;
}

/** Dicte les quatre fichiers. Rend les documents et les comptes. */
export function dicterTout() {
  const compteurs = { phrases: 0, gestes: 0, informations: new Set() };
  const documents = new Map();
  for (const fichier of FICHIERS) documents.set(fichier.chemin, dicterFichier(fichier, compteurs));
  return { documents, ...compteurs };
}

export { FICHIERS };
