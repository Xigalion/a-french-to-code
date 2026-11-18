/** Les intentions **propres à Java** : celles qu'aucune phrase du catalogue
 * partagé ne porte.
 *
 * Lots J3 à J8. Le catalogue partagé a été conçu pour C17, et il ne connaît
 * ni l'objet, ni l'interface, ni l'exception, ni la collection typée. Ces 82
 * intentions ne sont donc pas des variantes de celles du C : ce sont des
 * notions que Java enseigne et que les deux autres langages n'ont pas.
 *
 * Elles n'atteignent jamais un `.c` ni un `.py` : seul le module de langage
 * Java les analyse, par son entrée `natif`, et `src/translate.ts` ne les
 * connaît pas.
 */
import type { NumericExpression } from '../../numericExpression.ts';

export type DiagnosticJv = {
  code: string;
  category: 'understanding';
  severity: 'error';
  message: string;
  range: { start: number; end: number };
};

/** Le type d'un élément, tel que la phrase le nomme. `chaine` est à part :
 * `String` n'est pas un type primitif, et une collection de chaînes s'écrit
 * autrement qu'une collection d'entiers. */
export type TypeJava = 'int' | 'long' | 'float' | 'double' | 'char' | 'boolean' | 'chaine';

export type InstructionJava =
  // ================= J1 — types, point d'entrée, déclarations ============
  | { kind: 'JAVA_CLASSE'; parameters: { classe: string } }
  | { kind: 'JAVA_CLASSE_INTERNE'; parameters: { classe: string } }
  | { kind: 'JAVA_LONG'; parameters: { nom: string; valeur: string } }
  | { kind: 'JAVA_FLOAT'; parameters: { nom: string; expression: NumericExpression } }
  | { kind: 'JAVA_BOOLEEN'; parameters: { nom: string; valeur: boolean } }
  | { kind: 'JAVA_DECL_BOOLEEN'; parameters: { nom: string } }
  | { kind: 'JAVA_DECL_CHAINE'; parameters: { nom: string } }
  | { kind: 'JAVA_CONSTANTE_CLASSE'; parameters: { nom: string; valeur: string } }
  // ================= J2 — affichage et saisie ===========================
  | { kind: 'JAVA_AFFICHE_LIGNE'; parameters: { nom: string } }
  | { kind: 'JAVA_AFFICHE_TEXTE_LIGNE'; parameters: { texte: string } }
  | { kind: 'JAVA_LECTEUR_SAISIE'; parameters: { nom: string } }
  | { kind: 'JAVA_LIRE_ENTIER_SAISIE'; parameters: { lecteur: string; cible: string } }
  | { kind: 'JAVA_LIRE_LIGNE_SAISIE'; parameters: { lecteur: string; cible: string } }
  // ================= J3 — expressions, chaînes, conversions =============
  | { kind: 'JAVA_AFFECTE_TEXTE'; parameters: { nom: string; texte: string } }
  | { kind: 'JAVA_INCREMENTE'; parameters: { nom: string } }
  | { kind: 'JAVA_DECREMENTE'; parameters: { nom: string } }
  | { kind: 'JAVA_CONVERTI_ENTIER'; parameters: { nom: string; expression: NumericExpression } }
  | { kind: 'JAVA_CONVERTI_REEL'; parameters: { nom: string; expression: NumericExpression } }
  | { kind: 'JAVA_CONCATENE'; parameters: { cible: string; source: string; texte: string } }
  | { kind: 'JAVA_LONGUEUR_CHAINE'; parameters: { cible: string; chaine: string } }
  | { kind: 'JAVA_CARACTERE_INDICE'; parameters: { cible: string; indice: NumericExpression; chaine: string } }
  | { kind: 'JAVA_COMPARE_CHAINES'; parameters: { cible: string; gauche: string; droite: string } }
  | { kind: 'JAVA_CHAINE_VERS_ENTIER'; parameters: { cible: string; chaine: string } }
  // ================= J4 — contrôle ======================================
  | { kind: 'JAVA_POUR_CHAQUE_TABLEAU'; parameters: { type: TypeJava; nom: string; tableau: string } }
  | { kind: 'JAVA_POUR_CHAQUE_LISTE'; parameters: { type: TypeJava; nom: string; liste: string } }
  | { kind: 'JAVA_CAS_TEXTE'; parameters: { texte: string } }
  // ================= J5 — méthodes ======================================
  | { kind: 'JAVA_METHODE_STATIQUE_VIDE'; parameters: { nom: string } }
  | { kind: 'JAVA_METHODE_PUBLIQUE'; parameters: { nom: string; retour: TypeJava } }
  | { kind: 'JAVA_METHODE_PUBLIQUE_VIDE'; parameters: { nom: string } }
  | { kind: 'JAVA_METHODE_PRIVEE'; parameters: { nom: string } }
  | { kind: 'JAVA_METHODE_REDEFINIE'; parameters: { nom: string } }
  | { kind: 'JAVA_METHODE_LANCE'; parameters: { nom: string; exception: string } }
  | { kind: 'JAVA_RETOURNE_TEXTE'; parameters: { texte: string } }
  | { kind: 'JAVA_RETOURNE_CHAINE'; parameters: { nom: string } }
  | { kind: 'JAVA_APPELLE_METHODE'; parameters: { methode: string; objet: string } }
  | { kind: 'JAVA_APPELLE_METHODE_ASSIGNE'; parameters: { cible: string; methode: string; objet: string } }
  // ================= J6 — tableaux et collections =======================
  | { kind: 'JAVA_DECL_TABLEAU'; parameters: { type: TypeJava; nom: string } }
  // Décision J10 : les formes où le mot « tableau » est EXPLICITE. Les
  // phrases historiques du catalogue partagé — « de t » — restent valides,
  // règle 7, et produisent le même Java par le rendu partagé.
  | { kind: 'JAVA_TABLEAU_ASSIGNE'; parameters: { valeur: string; indice: NumericExpression; tableau: string } }
  | { kind: 'JAVA_TABLEAU_ASSIGNE_CAR'; parameters: { litteral: string; indice: NumericExpression; tableau: string } }
  | { kind: 'JAVA_TABLEAU_ASSIGNE_EXPR'; parameters: { indice: NumericExpression; tableau: string; expression: NumericExpression } }
  | { kind: 'JAVA_TABLEAU_AFFICHE'; parameters: { indice: NumericExpression; tableau: string } }
  | { kind: 'JAVA_TABLEAU_AFFICHE_CAR'; parameters: { indice: NumericExpression; tableau: string } }
  | { kind: 'JAVA_TAILLE_TABLEAU'; parameters: { cible: string; tableau: string } }
  | { kind: 'JAVA_LISTE'; parameters: { type: TypeJava; nom: string } }
  | { kind: 'JAVA_LISTE_AJOUTE'; parameters: { expression: NumericExpression; liste: string } }
  | { kind: 'JAVA_LISTE_AJOUTE_TEXTE'; parameters: { texte: string; liste: string } }
  | { kind: 'JAVA_LISTE_ELEMENT'; parameters: { cible: string; indice: NumericExpression; liste: string } }
  | { kind: 'JAVA_LISTE_TAILLE'; parameters: { cible: string; liste: string } }
  | { kind: 'JAVA_LISTE_RETIRE'; parameters: { indice: NumericExpression; liste: string } }
  | { kind: 'JAVA_TABLE'; parameters: { type: TypeJava; nom: string } }
  | { kind: 'JAVA_TABLE_ASSOCIE'; parameters: { expression: NumericExpression; cle: string; table: string } }
  | { kind: 'JAVA_TABLE_VALEUR'; parameters: { cible: string; cle: string; table: string } }
  | { kind: 'JAVA_ENSEMBLE'; parameters: { type: TypeJava; nom: string } }
  | { kind: 'JAVA_ENSEMBLE_AJOUTE'; parameters: { expression: NumericExpression; ensemble: string } }
  | { kind: 'JAVA_POUR_CHAQUE_CLE'; parameters: { nom: string; table: string } }
  // ================= J7 — objets ========================================
  | { kind: 'JAVA_CHAMP_PRIVE'; parameters: { type: TypeJava; nom: string } }
  | { kind: 'JAVA_CHAMP_CHAINE'; parameters: { nom: string } }
  | { kind: 'JAVA_CHAMP_TABLEAU'; parameters: { type: TypeJava; nom: string; dimension: string } }
  | { kind: 'JAVA_CONSTRUCTEUR'; parameters: Record<string, never> }
  | { kind: 'JAVA_CONSTRUCTEUR_PARAMETRE'; parameters: { type: TypeJava; nom: string } }
  | { kind: 'JAVA_CHAMP_PARAMETRE'; parameters: { champ: string; parametre: string } }
  | { kind: 'JAVA_OBJET_ARGUMENT'; parameters: { nom: string; classe: string; expression: NumericExpression } }
  // `Affecte la valeur 20 au champ age de e.` n'est PAS ici : c'est
  // exactement la phrase de MEMBER_ASSIGN_INT du catalogue partagé, et la
  // dupliquer aurait créé une intention morte — le défaut que le lot 30 avait
  // trouvé en C. Le catalogue partagé gagne toujours.
  | { kind: 'JAVA_LIT_CHAMP_OBJET'; parameters: { cible: string; champ: string; objet: string } }
  // ================= J8 — héritage, interfaces, polymorphisme ===========
  | { kind: 'JAVA_CLASSE_HERITE'; parameters: { classe: string; parente: string } }
  | { kind: 'JAVA_CLASSE_ABSTRAITE'; parameters: { classe: string } }
  | { kind: 'JAVA_INTERFACE'; parameters: { classe: string } }
  | { kind: 'JAVA_CLASSE_IMPLEMENTE'; parameters: { classe: string; interface: string } }
  | { kind: 'JAVA_METHODE_ATTENDUE'; parameters: { nom: string } }
  | { kind: 'JAVA_METHODE_ATTENDUE_RETOUR'; parameters: { nom: string; retour: TypeJava } }
  | { kind: 'JAVA_METHODE_ABSTRAITE'; parameters: { nom: string; retour: TypeJava } }
  | { kind: 'JAVA_SUPER'; parameters: Record<string, never> }
  | { kind: 'JAVA_SUPER_ARGUMENT'; parameters: { expression: NumericExpression } }
  | { kind: 'JAVA_SUPER_METHODE'; parameters: { methode: string } }
  | { kind: 'JAVA_DECL_TYPE_CLASSE'; parameters: { classe: string; nom: string } }
  | { kind: 'JAVA_OBJET_POLYMORPHE'; parameters: { declare: string; nom: string; concrete: string } }
  | { kind: 'JAVA_OBJET_POLYMORPHE_ARG'; parameters: { declare: string; nom: string; concrete: string;
      expression: NumericExpression } }
  // ================= J9 — exceptions, paquetages, fichiers ==============
  | { kind: 'JAVA_PAQUETAGE'; parameters: { nom: string } }
  | { kind: 'JAVA_IMPORT'; parameters: { classe: string } }
  | { kind: 'JAVA_ESSAIE'; parameters: Record<string, never> }
  | { kind: 'JAVA_ATTRAPE'; parameters: { exception: string; nom: string } }
  | { kind: 'JAVA_FINALEMENT'; parameters: Record<string, never> }
  | { kind: 'JAVA_LANCE'; parameters: { exception: string; texte: string } }
  | { kind: 'JAVA_MESSAGE_EXCEPTION'; parameters: { nom: string } }
  | { kind: 'JAVA_ESSAIE_LECTEUR'; parameters: { nom: string; chemin: string } }
  | { kind: 'JAVA_ESSAIE_ECRIVAIN'; parameters: { nom: string; chemin: string } }
  | { kind: 'JAVA_LIRE_LIGNE_FICHIER'; parameters: { lecteur: string; cible: string } };

export type GenreJava = InstructionJava['kind'];

export type AnalyseJava =
  | { status: 'reconnu'; instruction: InstructionJava }
  | { status: 'refuse'; diagnostic: DiagnosticJv };
