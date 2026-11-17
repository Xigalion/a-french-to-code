// Lot P6 — l'exercice de CLOTURE de Python V1.
//
//   node exercice/python/cloture.mjs
//
// Un programme representatif des NEUF domaines de Python, ecrit par la session
// de l'hote, sans une retouche, puis execute. Plus trois programmes
// complementaires pour les intentions que le premier n'emploie pas.
//
// Le script refuse d'ecrire un fichier si une phrase, un rendu ou un placement
// est refuse, et il refuse de conclure si une sortie differe du calcul fait a
// la main. Une couverture annoncee sur un programme ampute serait une preuve
// fausse : c'est exactement ce que la sonde du lot P3 avait fait.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PythonTranslationSession } from '../../extension/out/extension/src/sessionPython.js';
import { NATIVES_PYTHON } from '../../src/langages/python/renduNatif.ts';
import { PORTEES_PYTHON } from '../../src/langages/python/rendu.ts';
import { translate } from '../../src/translate.ts';
import { PYTHON } from '../../src/langages/python/langage.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');

/** L'exercice de cloture : gestion d'un carnet de notes, les neuf domaines. */
const CLOTURE = {
  fichier: 'carnet.py',
  titre: 'Carnet de notes — les neuf domaines',
  etapes: [
    // --- D9 : modules -----------------------------------------------------
    [0, 'Importe le module math.'],

    // --- D8 : fonctions ---------------------------------------------------
    [0, 'Crée une fonction nommée moyenne qui retourne un double et prend un int nommé somme et un int nommé combien.'],
    [4, 'Crée un bloc si "combien == 0".'],
    [8, 'Retourne le résultat numérique de "0".'],
    [4, 'Affecte à exacte le quotient réel de "somme" par "combien".'],
    [4, 'Retourne le résultat numérique de "exacte".'],

    [0, 'Crée une fonction nommée mention qui retourne un int et prend un int nommé note.'],
    [4, 'Crée un filtrage sur "note".'],
    [8, 'Ajoute un motif pour la valeur 20.'],
    [12, 'Retourne la valeur 3.'],
    [8, 'Ajoute le motif qui accepte tout.'],
    [12, 'Crée un bloc si "note >= 10".'],
    [16, 'Retourne la valeur 2.'],
    [12, 'Ajoute une branche sinon.'],
    [16, 'Retourne la valeur 1.'],

    [0, 'Crée une fonction nommée salue qui ne retourne rien et prend un str nommé nom valant le texte "éleve".'],
    [4, 'Affiche le texte "bonjour ".'],
    [4, 'Affiche la chaîne nom.'],
    [4, 'Affiche un retour à la ligne.'],

    // --- D6 : dictionnaires -----------------------------------------------
    [0, 'Crée un dictionnaire nommé carnet avec la clé "ada" valant "15".'],
    [0, 'Affecte "12" à la clé "bob" de carnet.'],
    [0, 'Affecte "20" à la clé "cleo" de carnet.'],

    // --- D5 : séquences ---------------------------------------------------
    [0, 'Crée une liste vide nommée noms.'],
    [0, 'Crée une liste vide nommée valeurs.'],

    // --- D1 et D4 : valeurs, affichage, boucles ---------------------------
    [0, 'Crée un entier nommé somme de valeur 0.'],
    [0, 'Crée une boucle pour la clé nom et la valeur note de carnet.'],
    [4, 'Ajoute "nom" à la fin de noms.'],
    [4, 'Ajoute "note" à la fin de valeurs.'],
    [4, 'Affecte à somme le résultat numérique de "somme + note".'],

    [0, 'Affecte à combien le nombre d’éléments de carnet.'],
    [0, 'Affiche le texte "somme = ".'],
    [0, 'Affiche la valeur de somme.'],
    [0, 'Affiche un retour à la ligne.'],

    // --- D2 : types et expressions ----------------------------------------
    [0, 'Affecte à exacte le résultat de l’appel de moyenne avec "somme" et "combien".'],
    [0, 'Affiche le texte "moyenne = ".'],
    [0, 'Affiche exacte en notation fixe avec 2 décimales.'],
    [0, 'Affiche un retour à la ligne.'],
    [0, 'Affecte à entiere le quotient entier de "somme" par "combien".'],
    [0, 'Affecte à reste le reste entier de "somme" par "combien".'],
    [0, 'Affiche le texte "entiere et reste = ".'],
    [0, 'Affiche entiere et reste séparés par le texte " ".'],
    [0, 'Affiche un retour à la ligne.'],

    // --- D3 : décisions ---------------------------------------------------
    [0, 'Crée un booléen nommé assez de valeur faux.'],
    [0, 'Crée un bloc si "entiere >= 15".'],
    [4, 'Crée un booléen nommé assez de valeur vrai.'],
    [0, 'Crée un bloc si assez est sans valeur.'],
    [4, 'Affiche le texte "indéterminé".'],
    [4, 'Affiche un retour à la ligne.'],
    [0, 'Ajoute une branche sinon.'],
    [4, 'Affiche le texte "décidé".'],
    [4, 'Affiche un retour à la ligne.'],

    [0, 'Crée un bloc si "0" appartient à valeurs.'],
    [4, 'Affiche le texte "un zéro".'],
    [4, 'Affiche un retour à la ligne.'],

    // --- D4 : boucle à bornes et enumerate ---------------------------------
    [0, 'Crée une boucle pour i de "0" jusqu’avant "combien".'],
    [4, 'Affecte à note la valeur de la clé "ada" de carnet.'],
    [4, 'Incrémente i.'],
    [0, 'Crée une boucle pour l’indice rang et la valeur nom de noms.'],
    [4, 'Affiche la valeur de rang.'],
    [4, 'Affiche le texte " ".'],
    [4, 'Affiche la chaîne nom.'],
    [4, 'Affiche le texte " ".'],
    [4, 'Affecte à rangnote la valeur de la clé "ada" de carnet.'],
    [4, 'Affiche la valeur de rangnote.'],
    [4, 'Affiche un retour à la ligne.'],

    // --- D7 : chaînes ------------------------------------------------------
    [0, 'Affecte à liste les éléments de noms joints par le texte ", ".'],
    [0, 'Affecte à cri le texte de liste en majuscules.'],
    [0, 'Affiche la chaîne cri.'],
    [0, 'Affiche un retour à la ligne.'],
    [0, 'Affecte à ligne le texte "total {somme}" avec le champ somme valant somme.'],
    [0, 'Affiche la chaîne ligne.'],
    [0, 'Affiche un retour à la ligne.'],
    [0, 'Appelle salue avec le paramètre nom valant "cri".'],

    // --- D9 : fichiers et erreurs ------------------------------------------
    [0, 'Crée un bloc avec le fichier "exercice/python/journal/carnet.txt" ouvert en écriture nommé sortie.'],
    [4, 'Écris le texte "fin" dans le fichier sortie.'],
    [0, 'Crée un bloc à essayer.'],
    [4, 'Affecte à absente la valeur de la clé "zoe" de carnet.'],
    [0, 'Ajoute une branche en cas d’erreur de type KeyError.'],
    [4, 'Affiche le texte "clé absente".'],
    [4, 'Affiche un retour à la ligne.'],

    // --- D8 : mention, et le filtrage qui ne traverse pas ------------------
    [0, 'Affecte à rang le résultat de l’appel de mention avec "20".'],
    [0, 'Affiche le texte "mention de 20 = ".'],
    [0, 'Affiche la valeur de rang.'],
    [0, 'Affiche un retour à la ligne.'],
    [0, 'Affecte à rang le résultat de l’appel de mention avec "12".'],
    [0, 'Affiche le texte "mention de 12 = ".'],
    [0, 'Affiche la valeur de rang.'],
    [0, 'Affiche un retour à la ligne.'],
  ],
  /** Calcul fait a la main, AVANT toute execution.
   *
   *   carnet = {"ada":15, "bob":12, "cleo":20}, dans cet ordre d'insertion
   *   noms = ["ada","bob","cleo"], valeurs = [15,12,20], somme = 47, combien = 3
   *   moyenne(47,3) = 47/3 = 15.666... -> « 15.67 »
   *   47 // 3 = 15, 47 % 3 = 2 -> « 15 2 »
   *   entiere = 15 >= 15 -> assez = True ; True n'est pas None -> « decide »
   *   0 n'appartient pas a [15,12,20] -> rien
   *   enumerate(noms) -> « 0 ada 15 », « 1 bob 15 », « 2 cleo 15 »
   *     (rangnote relit toujours la cle "ada" : c'est VOULU, le catalogue n'a
   *      pas de lecture de cle par un nom de variable — limite consignee)
   *   liste = « ada, bob, cleo » -> cri = « ADA, BOB, CLEO »
   *   ligne = f"total {somme}" -> « total 47 »
   *   salue(nom=cri) -> « bonjour ADA, BOB, CLEO »
   *   carnet["zoe"] leve KeyError -> « cle absente »
   *   mention(20) : le motif 20 correspond -> 3, et match NE TRAVERSE PAS
   *   mention(12) : motif « _ », 12 >= 10 -> 2
   */
  attendu: 'somme = 47\n'
    + 'moyenne = 15.67\n'
    + 'entiere et reste = 15 2\n'
    + 'décidé\n'
    + '0 ada 15\n'
    + '1 bob 15\n'
    + '2 cleo 15\n'
    + 'ADA, BOB, CLEO\n'
    + 'total 47\n'
    + 'bonjour ADA, BOB, CLEO\n'
    + 'clé absente\n'
    + 'mention de 20 = 3\n'
    + 'mention de 12 = 2\n',
};

/** Les programmes complementaires : les intentions que l'exercice n'emploie
 * pas. Chacun est execute, et chacun a sa sortie attendue. */
const COMPLEMENTS = [
  {
    fichier: 'complement-portees.py',
    titre: 'Intentions du catalogue partagé, rendues en Python',
    etapes: [
      [0, 'Importe sqrt du module math.'],
      [0, 'Crée une fonction nommée deux qui retourne un int et prend un int nommé n.'],
      [4, 'Crée un bloc si "n > 0".'],
      [8, 'Retourne le résultat de "n * 2".'],
      [4, 'Retourne la valeur 0.'],
      [0, 'Crée une fonction nommée rien qui ne retourne rien.'],
      [4, 'Retourne.'],
      [0, 'Crée une fonction nommée paire qui retourne un int.'],
      [4, 'Retourne les résultats de "1" et "2".'],

      [0, 'Crée une liste nommée notes avec les valeurs "1", "2" et "3".'],
      [0, 'Affecte la valeur 9 à l’élément "0" de notes.'],
      [0, 'Affecte à l’élément "1" de notes le résultat numérique de "2 + 3".'],
      [0, 'Affiche l’élément "0" de notes.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Affiche l’élément "1" de notes.'],
      [0, 'Affiche un retour à la ligne.'],

      [0, 'Crée une liste nommée lettres avec les textes "a" et "b".'],
      [0, 'Affecte le caractère \'Z\' à l’élément "0" de lettres.'],
      [0, 'Affiche le caractère de l’élément "0" de lettres.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée un caractère nommé c de valeur \'A\'.'],
      [0, 'Affecte le caractère \'B\' à c.'],
      [0, 'Affiche le caractère c.'],
      [0, 'Affiche un retour à la ligne.'],

      [0, 'Crée un entier nommé total de valeur 0.'],
      [0, 'Affecte la valeur 7 à total.'],
      [0, 'Affecte à total le résultat de "total + 1".'],
      [0, 'Affiche total en hexadécimal.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée une variable de type double nommée ratio avec le résultat de "1.5".'],
      [0, 'Affiche ratio en notation fixe avec 1 décimales.'],
      [0, 'Affiche un retour à la ligne.'],

      [0, 'Crée un entier nommé i de valeur 0.'],
      [0, 'Crée une boucle tant que "i < 5".'],
      [4, 'Affecte à i le résultat de "i + 1".'],
      [4, 'Crée un bloc si "i == 2".'],
      [8, 'Passe à l’itération suivante de la boucle la plus intérieure.'],
      [4, 'Ajoute une branche sinon si "i == 4".'],
      [8, 'Sors de la boucle la plus intérieure.'],
      [4, 'Affiche la valeur de i.'],
      [4, 'Affiche un retour à la ligne.'],

      [0, 'Affecte à doubleN le résultat de l’appel de deux avec "4".'],
      [0, 'Affiche la valeur de doubleN.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Appelle rien.'],
      [0, 'Affecte à racine le résultat de l’appel de sqrt avec "16".'],
      [0, 'Affiche racine en notation fixe avec 1 décimales.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Affecte à duo le résultat de l’appel de paire.'],
      [0, 'Affecte à un et deuxieme les valeurs de duo.'],
      [0, 'Affiche la valeur de deuxieme.'],
      [0, 'Affiche un retour à la ligne.'],
    ],
    /** notes = [1,2,3] -> notes[0]=9, notes[1]=2+3=5 -> affiche 9 puis 5
     *  lettres = ["a","b"] -> lettres[0]='Z' -> affiche Z
     *  c = 'A' puis 'B' -> affiche B
     *  total = 0 puis 7 puis 7+1 = 8 -> en hexadecimal : 8
     *  ratio = 1.5 -> « 1.5 »
     *  boucle : i=1 affiche 1 ; i=2 continue ; i=3 affiche 3 ; i=4 break
     *  deux(4) = 8 ; sqrt(16) = 4.0 -> « 4.0 »
     *  paire() = (1,2) -> deuxieme = 2
     */
    attendu: '9\n5\nZ\nB\n8\n1.5\n1\n3\n8\n4.0\n2\n',
  },
  {
    fichier: 'complement-fichier.py',
    titre: 'Dictionnaire vide, parcours, fichiers lus et écrits, saisie, point d’entrée',
    etapes: [
      [0, 'Crée un dictionnaire vide nommé index.'],
      [0, 'Affecte le texte "Ada" à la clé "a" de index.'],
      [0, 'Affecte à qui la valeur de la clé "a" de index.'],
      [0, 'Affiche la chaîne qui.'],
      [0, 'Affiche un retour à la ligne.'],

      [0, 'Crée une liste vide nommée mots.'],
      [0, 'Ajoute le texte "beta" à la fin de mots.'],
      [0, 'Insère le texte "alpha" à la position "0" de mots.'],
      [0, 'Crée une boucle pour chaque mot de mots.'],
      [4, 'Affiche la chaîne mot.'],
      [4, 'Affiche un retour à la ligne.'],

      [0, 'Crée un bloc avec le fichier "exercice/python/journal/relu.txt" ouvert en écriture nommé sortie.'],
      [4, 'Écris la chaîne mot dans le fichier sortie.'],
      [4, 'Écris le texte "\\n" dans le fichier sortie.'],
      [0, 'Crée un bloc avec le fichier "exercice/python/journal/relu.txt" ouvert en lecture nommé entree.'],
      [4, 'Crée une boucle pour chaque ligne ligne de entree.'],
      [8, 'Affiche la chaîne ligne.'],

      [0, 'Lis une saisie dans reponse.'],
      [0, 'Affiche la chaîne reponse.'],
      [0, 'Affiche un retour à la ligne.'],

      [0, 'Crée le point d’entrée principal.'],
      [4, 'Affiche le texte "lancé".'],
      [4, 'Affiche un retour à la ligne.'],
    ],
    entree: 'bonjour\n',
    /** index = {} puis ["a"]="Ada" -> affiche « Ada »
     *  mots = ["beta"] puis insert(0,"alpha") -> ["alpha","beta"]
     *  parcours -> « alpha », « beta » ; apres la boucle, mot vaut « beta »
     *  le fichier recoit « beta » + un saut ; relu ligne par ligne -> « beta »
     *  la saisie vaut « bonjour » -> affiche « bonjour »
     *  le module est lance directement -> le bloc principal s'execute
     */
    attendu: 'Ada\nalpha\nbeta\nbeta\nbonjour\nlancé\n',
  },
  {
    fichier: 'complement-sequences.py',
    titre: 'Séquences : tranche, indice négatif, insertion, retrait, aliasing, tuple',
    etapes: [
      [0, 'Crée une liste nommée notes avec les valeurs "12", "15" et "9".'],
      [0, 'Insère "20" à la position "0" de notes.'],
      [0, 'Retire l’élément à la position "3" de notes.'],
      [0, 'Affecte à debut la tranche de notes de "0" jusqu’avant "2".'],
      [0, 'Affecte à combien le nombre d’éléments de debut.'],
      [0, 'Affiche la valeur de combien.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Affiche le dernier élément de notes.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée un nom appelé alias qui désigne la même liste que notes.'],
      [0, 'Ajoute "1" à la fin de alias.'],
      [0, 'Affecte à apres le nombre d’éléments de notes.'],
      [0, 'Affiche la valeur de apres.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée un tuple nommé point avec les valeurs "3" et "4".'],
      [0, 'Affecte à x et y les valeurs de point.'],
      [0, 'Affecte à p le résultat de "x" élevé à la puissance "y".'],
      [0, 'Affiche la valeur de p.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée un tuple nommé paire avec les textes "ada" et "bob".'],
      [0, 'Affecte à a et b les valeurs de paire.'],
      [0, 'Affiche la chaîne b.'],
      [0, 'Affiche un retour à la ligne.'],
    ],
    /** notes = [12,15,9] -> insert(0,20) -> [20,12,15,9] -> del [3] -> [20,12,15]
     *  debut = notes[0:2] -> 2 elements ; notes[-1] = 15
     *  alias designe la MEME liste : append(1) -> 4 elements
     *  point = (3,4) -> x=3, y=4, p = 3**4 = 81
     *  paire = ("ada","bob") -> b = « bob »
     */
    attendu: '2\n15\n4\n81\nbob\n',
  },
  {
    fichier: 'complement-collections.py',
    titre: 'Dictionnaires et ensembles : textes, doublons, parcours',
    etapes: [
      [0, 'Crée un dictionnaire nommé profil avec la clé "nom" valant le texte "Ada".'],
      [0, 'Affecte le texte "Londres" à la clé "ville" de profil.'],
      [0, 'Affecte à ville la valeur de la clé "ville" de profil.'],
      [0, 'Affiche la chaîne ville.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée une boucle pour la clé cle et la valeur valeur de profil.'],
      [4, 'Affiche la chaîne cle.'],
      [4, 'Affiche le texte "=".'],
      [4, 'Affiche la chaîne valeur.'],
      [4, 'Affiche un retour à la ligne.'],
      [0, 'Crée un ensemble nommé vus avec les valeurs "1", "2" et "1".'],
      [0, 'Affecte à distincts le nombre d’éléments de vus.'],
      [0, 'Affiche la valeur de distincts.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée un ensemble nommé mots avec les textes "ada" et "ada".'],
      [0, 'Affecte à uniques le nombre d’éléments de mots.'],
      [0, 'Affiche la valeur de uniques.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée une liste nommée villes avec les textes "Londres" et "Paris".'],
      [0, 'Affecte à jointes les éléments de villes joints par le texte " / ".'],
      [0, 'Affiche la chaîne jointes.'],
      [0, 'Affiche un retour à la ligne.'],
    ],
    /** profil = {"nom":"Ada"} puis ["ville"]="Londres"
     *  ville = « Londres » ; parcours -> « nom=Ada », « ville=Londres »
     *  vus = {1,2,1} -> 2 ; mots = {"ada","ada"} -> 1
     *  villes jointes -> « Londres / Paris »
     */
    attendu: 'Londres\nnom=Ada\nville=Londres\n2\n1\nLondres / Paris\n',
  },
  {
    fichier: 'complement-chaines.py',
    titre: 'Chaînes, saisie, conversion, erreurs levées, décrémentation',
    etapes: [
      [0, 'Crée une chaîne nommée brut avec le texte "  42  ".'],
      [0, 'Affecte à propre le texte de brut sans les espaces des extrémités.'],
      [0, 'Affecte à n l’entier obtenu de propre.'],
      [0, 'Affiche la valeur de n.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Décrémente n.'],
      [0, 'Affiche la valeur de n.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Affecte à texte le texte obtenu de n.'],
      [0, 'Affecte à mots les morceaux de texte séparés par le texte "1".'],
      [0, 'Affecte à combien le nombre d’éléments de mots.'],
      [0, 'Affiche la valeur de combien.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Affecte à ensemble le texte de propre suivi de texte.'],
      [0, 'Affiche la chaîne ensemble.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Crée un nom appelé vide sans valeur.'],
      [0, 'Crée un bloc si vide est sans valeur.'],
      [4, 'Affiche le texte "rien".'],
      [4, 'Affiche un retour à la ligne.'],
      [0, 'Crée un bloc à essayer.'],
      [4, 'Lève une erreur de type ValueError avec le texte "stop".'],
      [0, 'Ajoute une branche en cas d’erreur de type ValueError.'],
      [4, 'Affiche le texte "attrapée".'],
      [4, 'Affiche un retour à la ligne.'],
      [0, 'Crée une valeur fixe par convention nommée TAILLE de valeur 10.'],
      [0, 'Affiche la valeur de TAILLE.'],
      [0, 'Affiche un retour à la ligne.'],
      [0, 'Affiche le type de TAILLE.'],
      [0, 'Affiche un retour à la ligne.'],
    ],
    /** brut = «   42   » -> propre = « 42 » -> n = 42
     *  n -= 1 -> 41 ; texte = « 41 » ; « 41 ».split("1") -> ["4",""] -> 2
     *  ensemble = « 42 » + « 41 » = « 4241 »
     *  vide is None -> « rien » ; raise ValueError attrape -> « attrapee »
     *  TAILLE = 10 ; type(10) -> « <class 'int'> »
     */
    attendu: '42\n41\n2\n4241\nrien\nattrapée\n10\n<class \'int\'>\n',
  },
];

function cible(texte, offset, identifiant) {
  return { document: { id: 'file:///' + identifiant, revision: 1, text: texte }, cursorOffset: offset,
    singleCursor: true, indentUnit: '    ', indentSignature: 'true:4', eol: '\n', open: true };
}

/** Ecrit un programme, instruction par instruction, par la session de l'hote.
 * Rend le texte, le compte d'instructions, et les genres rencontres. */
/** Le genre d'intention d'une phrase : le catalogue partage d'abord, puis le
 * natif. C'est le meme ordre que la session, donc la meme reponse. */
function genreDe(phrase) {
  const strict = translate(phrase);
  if (strict.status === 'translated') return strict.instruction.kind;
  const natif = PYTHON.natif(phrase);
  return natif !== undefined && natif.status === 'rendu' ? natif.kind : '?';
}

function ecrire(programme) {
  let document = '';
  const informations = new Set();
  const genres = new Set();
  for (const [indentation, phrase] of programme.etapes) {
    const avant = document + ' '.repeat(indentation);
    const courante = cible(avant, avant.length, programme.fichier);
    const session = new PythonTranslationSession(courante, phrase);
    const diagnostic = session.diagnose(courante);
    if (diagnostic) {
      console.error('REFUSÉ [' + diagnostic.stage + ' / ' + diagnostic.code + '] ' + phrase
        + '\n  ' + diagnostic.message);
      process.exit(1);
    }
    const apercu = session.prepare(courante);
    if (apercu.status !== 'preview') { console.error('APERÇU REFUSÉ : ' + phrase); process.exit(1); }
    session.reviewReady(apercu.preview.token, courante);
    for (const information of session.information) informations.add(information.code);
    const applique = session.beginApply(apercu.preview.token, courante);
    if (applique.status !== 'apply') { console.error('CONFIRMATION REFUSÉE : ' + phrase); process.exit(1); }
    if (applique.expectedAfter !== apercu.preview.after) {
      console.error('INCOHÉRENCE APERÇU / APPLICATION : ' + phrase);
      process.exit(1);
    }
    genres.add(genreDe(phrase));
    document = applique.expectedAfter + '\n';
    session.finishApply(true);
  }
  return { document, instructions: programme.etapes.length, informations, genres };
}

const sortie = join(ici, 'cloture');
mkdirSync(sortie, { recursive: true });
mkdirSync(join(ici, 'journal'), { recursive: true });

const resultats = [];
let total = 0;
const toutesLesInformations = new Set();
const tousLesGenres = new Set();

for (const programme of [CLOTURE, ...COMPLEMENTS]) {
  const { document, instructions, informations, genres } = ecrire(programme);
  writeFileSync(join(sortie, programme.fichier), document, 'utf8');
  let execute;
  try {
    execute = execFileSync('python3', ['exercice/python/cloture/' + programme.fichier],
      { cwd: racine, encoding: 'utf8', timeout: 15000, maxBuffer: 1 << 20,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        // Une saisie est fournie quand le programme en lit une : sans elle,
        // `input()` verrait une fin de flux et leverait une erreur.
        ...(programme.entree === undefined ? {} : { input: programme.entree }) });
  } catch (erreur) {
    console.error('EXÉCUTION EN ÉCHEC (' + programme.fichier + ') : '
      + (erreur.stderr ?? erreur.message));
    process.exit(1);
  }
  const normalise = execute.split('\r\n').join('\n');
  const conforme = normalise === programme.attendu;
  for (const code of informations) toutesLesInformations.add(code);
  total += instructions;
  for (const genre of genres) tousLesGenres.add(genre);
  resultats.push({ ...programme, instructions, informations, genres, sortie: normalise, conforme });
  console.log((conforme ? 'OK   ' : 'ÉCART') + ' ' + programme.fichier + ' — '
    + instructions + ' instructions, ' + informations.size + ' informations');
  if (!conforme) {
    console.error('  attendu : ' + JSON.stringify(programme.attendu));
    console.error('  obtenu  : ' + JSON.stringify(normalise));
  }
}

const ecarts = resultats.filter(resultat => !resultat.conforme);

const journal = ['# Lot P6 — exercice de cloture Python, et ses complements',
  '',
  'Produit par `node exercice/python/cloture.mjs`. Ne pas editer a la main.',
  '',
  '| Programme | Instructions | Informations | Execution |',
  '|---|---|---|---|',
  ...resultats.map(resultat => `| \`${resultat.fichier}\` — ${resultat.titre} | ${resultat.instructions} `
    + `| ${resultat.informations.size} | ${resultat.conforme ? 'conforme' : '**ECART**'} |`),
  `| **total** | **${total}** | **${toutesLesInformations.size}** | ${ecarts.length === 0 ? 'toutes conformes' : ecarts.length + ' ecart(s)'} |`,
  '',
  '- retouches manuelles : **0**',
  '- phrases refusees : **0** — rendus refuses : **0** — placements refuses : **0**',
  '- chemin emprunte : `PythonTranslationSession`, celui de l’editeur',
  '',
  '## Couverture du catalogue',
  '',
  `- intentions natives livrees : **${NATIVES_PYTHON.size}**`,
  `- intentions du catalogue partage portees : **${PORTEES_PYTHON.size}**`,
  `- intentions EMPLOYEES par ces six programmes : **${tousLesGenres.size}**`
    + ` sur ${NATIVES_PYTHON.size + PORTEES_PYTHON.size}`,
  `- informations passives rencontrees par ces programmes : **${toutesLesInformations.size}**`,
  '',
  '> **Un compte d\u2019intentions employees n\u2019est pas un compte de competences.**',
  '> C\u2019est la lecon du barème des 91 sondes de la V1 : ces programmes montrent',
  '> que les intentions marchent ensemble, pas qu\u2019elles enseignent tout.',
  '',
  '### Les intentions que ces programmes n\u2019emploient pas',
  '',
  ...[...NATIVES_PYTHON, ...PORTEES_PYTHON].filter(genre => !tousLesGenres.has(genre)).sort()
    .map(genre => '- `' + genre + '`'),
  '',
  '  ' + [...toutesLesInformations].sort().join(', '),
  '',
  ...resultats.flatMap(resultat => ['## ' + resultat.fichier, '', '### Sortie attendue, calculee a la main',
    '', '```', resultat.attendu, '```', '', '### Sortie reelle de python3', '', '```', resultat.sortie,
    '```', '']),
];
writeFileSync(join(ici, 'journal', 'cloture.md'), journal.join('\n'), 'utf8');

console.log('');
console.log('total : ' + total + ' instructions, ' + toutesLesInformations.size + ' informations');
console.log('journal : exercice/python/journal/cloture.md');
if (ecarts.length) {
  console.error('ÉCHEC : ' + ecarts.length + ' programme(s) dont la sortie differe du calcul fait a la main.');
  process.exitCode = 1;
}
// La couverture est une EXIGENCE du lot P6 : une intention livree et jamais
// employee dans un programme execute n'est pas prouvee. Le script echoue si
// une seule manque, au lieu d'annoncer un chiffre partiel.
const nonEmployees = [...NATIVES_PYTHON, ...PORTEES_PYTHON].filter(genre => !tousLesGenres.has(genre));
if (nonEmployees.length) {
  console.error('ÉCHEC : ' + nonEmployees.length + ' intention(s) livrée(s) et jamais employée(s) : '
    + nonEmployees.sort().join(', '));
  process.exitCode = 1;
}
