/** Les intentions **propres à Python** : leurs types, leur catalogue publié,
 * et l'entrée unique de leur analyse.
 *
 * Lot P4, refondu au lot P5. Les quatorze premières intentions étaient
 * analysées à la main, chacune avec son parcours de jetons. À cinquante-quatre,
 * ce n'était plus tenable : l'analyse est désormais **une table**, dans
 * `catalogue.ts`, et ce module ne garde que l'AST, les exemples publiés et le
 * point d'entrée. Les trente-huit tests du lot P4 prouvent que la refonte est
 * neutre.
 *
 * **Ce module n'est appelé par personne dans `src/translate.ts`.** C'est la
 * propriété qui garantit que le moteur C17 n'a pas bougé : une phrase écrite
 * dans un `.c` ne peut pas atteindre le catalogue Python. La session Python
 * l'appelle après que le catalogue partagé a refusé, jamais avant.
 */
import type { SourceRange } from '../../translate.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import { analyserCatalogueNatif } from './catalogue.ts';

export type ConversionPython = 'int' | 'float' | 'str';

export type InstructionPython =
  // ---- valeurs et noms ----------------------------------------------------
  | { kind: 'PY_LISTE_VIDE'; parameters: { name: string } }
  | { kind: 'PY_LISTE_VALEURS'; parameters: { name: string; valeurs: NumericExpression[] } }
  | { kind: 'PY_INIT_STR'; parameters: { name: string; texte: string } }
  | { kind: 'PY_INIT_BOOL'; parameters: { name: string; valeur: boolean } }
  | { kind: 'PY_INIT_NONE'; parameters: { name: string } }
  | { kind: 'PY_CONSTANTE_PAR_CONVENTION'; parameters: { name: string; valeur: string } }
  | { kind: 'PY_ALIAS_DE_LISTE'; parameters: { name: string; source: string } }
  | { kind: 'PY_TUPLE'; parameters: { name: string; valeurs: NumericExpression[] } }
  | { kind: 'PY_SI_PRINCIPAL'; parameters: Record<string, never> }
  // ---- calcul et conversion ----------------------------------------------
  | { kind: 'PY_DIV_ENTIERE'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_DIV_REELLE'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_MODULO'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_PUISSANCE'; parameters: { name: string; gauche: NumericExpression; droite: NumericExpression } }
  | { kind: 'PY_LONGUEUR'; parameters: { name: string; source: string } }
  | { kind: 'PY_CONVERSION'; parameters: { name: string; conversion: ConversionPython; source: string } }
  | { kind: 'PY_INPUT'; parameters: { name: string } }
  | { kind: 'PY_TYPE_DE'; parameters: { name: string } }
  | { kind: 'PY_PRINT_PLUSIEURS'; parameters: { premier: string; second: string; separateur: string } }
  // ---- séquences ----------------------------------------------------------
  | { kind: 'PY_AJOUTER'; parameters: { name: string; valeur: NumericExpression } }
  /** Ajouter un TEXTE : lacune trouvee par l'exercice du lot P5. Le profil
   * d'expression ne porte pas de litteral de chaine, donc « Ajoute "cleo" a
   * la fin de noms. » lisait `cleo` comme un NOM, et le programme echouait a
   * l'execution. Une phrase separee, et le texte y est un texte. */
  | { kind: 'PY_AJOUTER_TEXTE'; parameters: { name: string; texte: string } }
  /** Incrementation et decrementation. En Python, la forme NATIVE est
   * l'affectation augmentee « += », qui modifie l'objet SUR PLACE quand il est
   * mutable — ce que « x = x + 1 » ne fait pas. Les deux semantiques ne se
   * confondent pas, et c'est pourquoi Python a sa propre intention la ou le C
   * passe par une reformulation vers l'affectation d'expression. */
  | { kind: 'PY_INCREMENTER'; parameters: { name: string } }
  | { kind: 'PY_DECREMENTER'; parameters: { name: string } }
  /** Les variantes TEXTUELLES. Les guillemets delimitent une EXPRESSION
   * partout dans le catalogue : « "15" » vaut donc l'entier 15, et il n'y a
   * aucun moyen de deviner qu'on voulait la chaine « "15" ». Le mot « texte »
   * le dit, et c'est la seule facon de le dire sans ambiguite. */
  | { kind: 'PY_LISTE_TEXTES'; parameters: { name: string; textes: string[] } }
  | { kind: 'PY_ENSEMBLE_TEXTES'; parameters: { name: string; textes: string[] } }
  | { kind: 'PY_TUPLE_TEXTES'; parameters: { name: string; textes: string[] } }
  | { kind: 'PY_INSERER_TEXTE'; parameters: { name: string; position: NumericExpression; texte: string } }
  | { kind: 'PY_DICT_PAIRES_TEXTE'; parameters: { name: string; cle: string; texte: string } }
  | { kind: 'PY_DICT_ECRIRE_TEXTE'; parameters: { name: string; cle: string; texte: string } }
  /** Une fonction a un parametre dont la valeur par defaut est ECRITE. C'est
   * le seul endroit du projet ou le mot « defaut » apparait, et il ne
   * contredit pas la regle 3 : la valeur est dans la phrase. */
  | { kind: 'PY_FONCTION_DEFAUT'; parameters: { name: string; parametre: string; type: string; texte: string } }
  | { kind: 'PY_INSERER'; parameters: { name: string; position: NumericExpression; valeur: NumericExpression } }
  | { kind: 'PY_RETIRER'; parameters: { name: string; position: NumericExpression } }
  | { kind: 'PY_TRANCHE'; parameters: { name: string; source: string; debut: NumericExpression; fin: NumericExpression } }
  | { kind: 'PY_INDICE_NEGATIF'; parameters: { name: string } }
  | { kind: 'PY_DEPAQUETER'; parameters: { premier: string; second: string; source: string } }
  // ---- dictionnaires et ensembles ----------------------------------------
  | { kind: 'PY_DICT_VIDE'; parameters: { name: string } }
  | { kind: 'PY_DICT_PAIRES'; parameters: { name: string; cle: string; valeur: NumericExpression } }
  | { kind: 'PY_DICT_LIRE'; parameters: { name: string; cle: string; source: string } }
  | { kind: 'PY_DICT_ECRIRE'; parameters: { name: string; cle: string; valeur: NumericExpression } }
  | { kind: 'PY_DICT_PARCOURIR'; parameters: { cle: string; valeur: string; source: string } }
  | { kind: 'PY_ENSEMBLE'; parameters: { name: string; valeurs: NumericExpression[] } }
  // ---- chaînes ------------------------------------------------------------
  | { kind: 'PY_CONCATENER'; parameters: { name: string; gauche: string; droite: string } }
  | { kind: 'PY_DECOUPER'; parameters: { name: string; source: string; separateur: string } }
  | { kind: 'PY_JOINDRE'; parameters: { name: string; source: string; separateur: string } }
  | { kind: 'PY_MAJUSCULES'; parameters: { name: string; source: string } }
  | { kind: 'PY_NETTOYER'; parameters: { name: string; source: string } }
  | { kind: 'PY_FORMATER'; parameters: { name: string; gabarit: string; champ: string; source: string } }
  // ---- décisions ----------------------------------------------------------
  | { kind: 'PY_APPARTIENT'; parameters: { valeur: NumericExpression; collection: string } }
  | { kind: 'PY_EST_NONE'; parameters: { name: string } }
  | { kind: 'PY_MATCH'; parameters: { expression: NumericExpression } }
  | { kind: 'PY_CAS'; parameters: { valeur: string } }
  | { kind: 'PY_CAS_DEFAUT'; parameters: Record<string, never> }
  // ---- boucles ------------------------------------------------------------
  | { kind: 'PY_POUR_CHAQUE'; parameters: { name: string; collection: string } }
  | { kind: 'PY_POUR_INDICE_ET_VALEUR'; parameters: { indice: string; valeur: string; collection: string } }
  | { kind: 'PY_POUR_INTERVALLE'; parameters: { name: string; debut: NumericExpression; fin: NumericExpression } }
  // ---- fonctions ----------------------------------------------------------
  | { kind: 'PY_PARAM_NOMME'; parameters: { name: string; arguments: { nom: string; valeur: NumericExpression }[] } }
  | { kind: 'PY_RETOUR_MULTIPLE'; parameters: { valeurs: NumericExpression[] } }
  // ---- fichiers, erreurs, modules ----------------------------------------
  | { kind: 'PY_AVEC_FICHIER'; parameters: { chemin: string; name: string; mode: 'r' | 'w' } }
  /** Genre de TABLE seulement : il se construit en `PY_AVEC_FICHIER` avec le
   * mode « w ». Il n'apparaît jamais dans un AST. */
  | { kind: 'PY_AVEC_FICHIER_ECRITURE'; parameters: { chemin: string; name: string; mode: 'r' | 'w' } }
  | { kind: 'PY_LIRE_LIGNES'; parameters: { name: string; fichier: string } }
  | { kind: 'PY_ESSAYER'; parameters: Record<string, never> }
  | { kind: 'PY_SAUF'; parameters: { erreur: string } }
  | { kind: 'PY_LEVER'; parameters: { erreur: string; message: string } }
  | { kind: 'PY_IMPORTER'; parameters: { module: string } }
  | { kind: 'PY_IMPORTER_DE'; parameters: { nom: string; module: string } };

export type DiagnosticPy = {
  code: string; category: 'understanding'; severity: 'error'; message: string; range: SourceRange;
};
export type AnalysePython =
  | { status: 'reconnu'; instruction: InstructionPython }
  | { status: 'refuse'; diagnostic: DiagnosticPy };

/** Une phrase d'exemple par intention native, et c'est le catalogue publié.
 *
 * Elles ne sont pas là pour la décoration : `docs/CATALOGUE_PYTHON.md` est
 * engendré à partir d'elles, et un test vérifie que chaque intention rendue en
 * a une et que chaque exemple est reconnu. Un catalogue rédigé à la main se
 * périme en silence — ce projet l'a déjà payé une fois.
 */
export const EXEMPLES_NATIFS: readonly string[] = [
  // valeurs et noms
  'Crée une liste vide nommée notes.',
  'Crée une liste nommée notes avec les valeurs "12", "15" et "9".',
  'Crée une chaîne nommée nom avec le texte "Ada".',
  'Crée un booléen nommé actif de valeur vrai.',
  'Crée un nom appelé resultat sans valeur.',
  'Crée une valeur fixe par convention nommée TAILLE de valeur 10.',
  'Crée un nom appelé copie qui désigne la même liste que notes.',
  'Crée un tuple nommé point avec les valeurs "1" et "2".',
  'Crée le point d’entrée principal.',
  // calcul et conversion
  'Affecte à q le quotient entier de "total" par "nombre".',
  'Affecte à q le quotient réel de "total" par "nombre".',
  'Affecte à r le reste entier de "total" par "nombre".',
  'Affecte à p le résultat de "a" élevé à la puissance "b".',
  'Affecte à nombre le nombre d’éléments de notes.',
  'Affecte à n l’entier obtenu de texte.',
  'Affecte à x le réel obtenu de texte.',
  'Affecte à s le texte obtenu de n.',
  'Lis une saisie dans reponse.',
  'Affiche le type de valeur.',
  'Affiche a et b séparés par le texte " ".',
  // séquences
  'Ajoute "18" à la fin de notes.',
  'Ajoute le texte "cleo" à la fin de noms.',
  'Incrémente compteur.',
  'Décrémente compteur.',
  'Crée une liste nommée noms avec les textes "ada" et "bob".',
  'Crée un ensemble nommé vus avec les textes "ada" et "bob".',
  'Crée un tuple nommé paire avec les textes "ada" et "bob".',
  'Insère le texte "cleo" à la position "0" de noms.',
  'Crée un dictionnaire nommé index avec la clé "ada" valant le texte "quinze".',
  'Affecte le texte "absente" à la clé "zoe" de index.',
  'Crée une fonction nommée salue qui ne retourne rien et prend un str nommé nom valant le texte "Ada".',
  'Insère "12" à la position "0" de notes.',
  'Retire l’élément à la position "0" de notes.',
  'Affecte à debut la tranche de notes de "0" jusqu’avant "3".',
  'Affiche le dernier élément de notes.',
  'Affecte à x et y les valeurs de point.',
  // dictionnaires et ensembles
  'Crée un dictionnaire vide nommé index.',
  'Crée un dictionnaire nommé index avec la clé "ada" valant "15".',
  'Affecte à n la valeur de la clé "ada" de index.',
  'Affecte "15" à la clé "ada" de index.',
  'Crée une boucle pour la clé nom et la valeur note de index.',
  'Crée un ensemble nommé vus avec les valeurs "1" et "2".',
  // chaînes
  'Affecte à phrase le texte de debut suivi de fin.',
  'Affecte à mots les morceaux de phrase séparés par le texte " ".',
  'Affecte à phrase les éléments de mots joints par le texte " ".',
  'Affecte à cri le texte de phrase en majuscules.',
  'Affecte à propre le texte de phrase sans les espaces des extrémités.',
  'Affecte à ligne le texte "Bonjour {nom}" avec le champ nom valant nom.',
  // décisions
  'Crée un bloc si "x" appartient à notes.',
  'Crée un bloc si resultat est sans valeur.',
  'Crée un filtrage sur "jour".',
  'Ajoute un motif pour la valeur 5.',
  'Ajoute le motif qui accepte tout.',
  // boucles
  'Crée une boucle pour chaque note de notes.',
  'Crée une boucle pour l’indice i et la valeur note de notes.',
  'Crée une boucle pour i de "0" jusqu’avant "10".',
  // fonctions
  'Appelle somme avec le paramètre a valant "1" et le paramètre b valant "2".',
  'Retourne les résultats de "a" et "b".',
  // fichiers, erreurs, modules
  'Crée un bloc avec le fichier "notes.txt" ouvert en lecture nommé f.',
  'Crée un bloc avec le fichier "notes.txt" ouvert en écriture nommé f.',
  'Crée une boucle pour chaque ligne ligne de f.',
  'Crée un bloc à essayer.',
  'Ajoute une branche en cas d’erreur de type ValueError.',
  'Lève une erreur de type ValueError avec le texte "note invalide".',
  'Importe le module math.',
  'Importe sqrt du module math.',
];

/** L'entrée unique du catalogue Python. */
export function analyserCataloguePython(text: string): AnalysePython | undefined {
  // Une instruction tient sur une seule ligne, comme dans le moteur strict :
  // un séparateur interdit n'est pas une phrase de ce catalogue.
  if (/[^\S \t]/u.test(text)) return undefined;
  return analyserCatalogueNatif(text);
}
