/** Les 84 intentions du catalogue partagé, refusées, et pourquoi.
 *
 * Lot S0, décision **S1**. SQL-A n'en porte **aucune** : le catalogue partagé
 * décrit des variables, des boucles, des branchements, des fonctions, des
 * affichages, des fichiers, de la mémoire et un préprocesseur, et un langage
 * de requêtes n'a aucun de ces objets.
 *
 * Les raisons sont **mutualisées** en dix groupes. Ce n'est pas une
 * facilité : Python écrit déjà 51 refus avec 19 textes, et écrire 84
 * paragraphes distincts serait du remplissage qui dirait moins.
 *
 * Chaque raison **nomme la construction SQL** qui enseigne la même
 * compétence. Un refus qui dit seulement « non » n'apprend rien.
 */
import { GENRES } from '../registre.ts';

const PAS_DE_VARIABLE = 'Le SQL standard n’a pas de variable : il n’y a rien à déclarer ni à '
  + 'affecter en dehors d’une ligne de table. Ce que cette intention veut dire se dit en SQL avec '
  + 'une COLONNE — « Ajoute à la table … une colonne … » — et une affectation de variable devient '
  + 'un UPDATE, qui touche des lignes et non une case mémoire.';

const PAS_DE_CONTROLE = 'Le SQL standard est déclaratif : on décrit l’ensemble de lignes voulu, et '
  + 'le serveur choisit comment l’obtenir. Il n’y a ni boucle ni branchement à écrire. Un test '
  + 'devient un PRÉDICAT — « Ne garde que les lignes où … » —, et une répétition devient le fait '
  + 'même qu’une instruction porte sur toutes les lignes à la fois.';

const PAS_DE_FONCTION = 'Définir une fonction, retourner une valeur ou appeler un sous-programme '
  + 'relève d’un langage procédural dans la base — PL/pgSQL par exemple —, pas du SQL. Ce '
  + 'langage-là n’est pas une cible du modèle 1, et le dire est plus honnête que de rendre une '
  + 'approximation.';

const PAS_D_AFFICHAGE = 'Une instruction SQL ne fait rien afficher : elle renvoie un ensemble de '
  + 'lignes, et c’est le client — psql, un tableur, un programme — qui décide de la façon de le '
  + 'montrer. Lire des données se dit « Crée une requête qui lit … » ; le format d’affichage '
  + 'n’appartient pas au langage.';

const PAS_DE_FICHIER = 'Ouvrir, lire et fermer un fichier est une opération du système, et le SQL '
  + 'standard n’en a pas. Les données vivent dans des tables ; les y faire entrer se dit INSERT, '
  + 'et les importer d’un fichier relève d’un outil du serveur, non du langage.';

const PAS_DE_MEMOIRE = 'Il n’y a ni adresse, ni pointeur, ni allocation à libérer : la gestion de '
  + 'la mémoire appartient entièrement au serveur. Ce qui s’en rapproche le plus — désigner une '
  + 'ligne précise — se fait par une CLÉ, qui est une donnée, pas une adresse.';

const PAS_DE_PREPROCESSEUR = 'Il n’y a pas de phase de préprocesseur : rien n’est inclus, et '
  + 'aucune garde ne protège d’une double inclusion. Un script SQL joue ses instructions dans '
  + 'l’ordre, et se protéger d’un rejeu se fait par une transaction ou par une contrainte, pas '
  + 'par une directive.';

const PAS_UNE_STRUCTURE = 'C’est le refus qui demande le plus d’attention, parce que la '
  + 'ressemblance est trompeuse. Une structure est un TYPE : elle décrit la forme d’une valeur, '
  + 'et une variable de ce type contient UNE valeur. Une table est une RELATION : elle contient '
  + 'un ensemble de lignes, sans ordre et sans compte fixe. Rendre « Déclare une structure » par '
  + 'CREATE TABLE enseignerait la confusion exacte qui fait ensuite écrire des boucles sur une '
  + 'base de données. Les tables ont donc leurs propres phrases.';

const PAS_D_ASSERTION = 'Il n’y a pas d’assertion qui arrête un script. Ce qui en tient le rôle '
  + 'est une CONTRAINTE — CHECK, NOT NULL, UNIQUE —, et la différence compte : une assertion '
  + 'vérifie une fois, au passage ; une contrainte est vérifiée à chaque écriture, pour '
  + 'toujours, par le serveur.';

const SYNONYME_A_SA_PHRASE = 'C’est la seule intention du catalogue partagé qui ait un équivalent '
  + 'réel : CREATE DOMAIN. Elle est pourtant refusée, parce que sa phrase française parle d’un '
  + 'synonyme de type du C et de ses spécificateurs, qui n’ont pas de sens ici. Le domaine SQL a '
  + 'donc sa propre phrase, « Crée un domaine nommé … fondé sur le type entier. », et une seule '
  + 'chose se perd : l’illusion qu’une phrase pouvait servir deux fois.';

/** Les dix groupes. Les listes sont **confrontées** à `GENRES` plus bas : un
 * genre oublié ou inventé fait échouer le chargement du module, pas un test
 * lointain. */
const GROUPES: readonly { raison: string; genres: readonly string[] }[] = [
  { raison: PAS_DE_VARIABLE, genres: ['ASSIGN_CHAR', 'ASSIGN_EXPRESSION', 'ASSIGN_INT',
    'CONST_DECL', 'DECL_CHAR', 'DECL_INT', 'INIT_CHAR', 'INIT_INT',
    'NUMERIC_ASSIGN', 'NUMERIC_DECL', 'NUMERIC_INIT'] },
  { raison: PAS_DE_CONTROLE, genres: ['BREAK', 'BREAK_SWITCH', 'CASE_CHAR', 'CASE_DEFAULT',
    'CASE_INT', 'CONTINUE', 'DO_WHILE', 'ELSE', 'ELSE_IF', 'FOR', 'IF', 'SWITCH', 'WHILE'] },
  { raison: PAS_DE_FONCTION, genres: ['CALL', 'CALL_ASSIGN', 'FUNC_DEF', 'FUNC_PROTOTYPE',
    'LINKAGE_DECL', 'MAIN', 'RETURN', 'RETURN_EXPRESSION', 'RETURN_INT', 'RETURN_NUMERIC'] },
  { raison: PAS_D_AFFICHAGE, genres: ['ARRAY_PRINT', 'ARRAY_PRINT_CHAR', 'MEMBER_PRINT',
    'NUMERIC_PRINT', 'PRINT_CHAR', 'PRINT_FORMATTED', 'PRINT_INT', 'PRINT_NEWLINE',
    'PRINT_POINTED', 'PRINT_STRING', 'PRINT_TEXT', 'SIZEOF_PRINT'] },
  { raison: PAS_DE_FICHIER, genres: ['FILE_AT_END', 'FILE_CLOSE', 'FILE_DECL', 'FILE_OPEN',
    'FILE_READ_INT', 'FILE_READ_STRING', 'FILE_WRITE_INT', 'FILE_WRITE_TEXT'] },
  { raison: PAS_DE_MEMOIRE, genres: ['ALLOCATE', 'ASSIGN_ADDRESS', 'ASSIGN_POINTED_EXPRESSION',
    'ASSIGN_POINTED_INT', 'DECL_POINTER', 'FREE', 'INIT_POINTER', 'REALLOCATE',
    'SIZEOF_ASSIGN', 'STRUCT_POINTER'] },
  { raison: PAS_DE_PREPROCESSEUR, genres: ['GUARD_CLOSE', 'GUARD_OPEN', 'INCLUDE_ASSERT',
    'INCLUDE_LIMITS', 'INCLUDE_LOCAL', 'INCLUDE_STDIO', 'INCLUDE_STDLIB'] },
  { raison: PAS_UNE_STRUCTURE, genres: ['ARRAY_ASSIGN_CHAR', 'ARRAY_ASSIGN_EXPRESSION',
    'ARRAY_ASSIGN_INT', 'ARRAY_DECL', 'MEMBER_ASSIGN_CHAR', 'MEMBER_ASSIGN_EXPRESSION',
    'MEMBER_ASSIGN_INT', 'STRING_INIT', 'STRUCT_DECL', 'STRUCT_FIELD', 'STRUCT_VAR'] },
  { raison: PAS_D_ASSERTION, genres: ['ASSERT'] },
  { raison: SYNONYME_A_SA_PHRASE, genres: ['TYPE_ALIAS'] },
];

const construites = new Map<string, string>();
for (const groupe of GROUPES) {
  for (const genre of groupe.genres) {
    if (!GENRES.has(genre)) {
      throw new Error('Raison SQL écrite pour « ' + genre + " », qui n'est pas un genre du moteur.");
    }
    if (construites.has(genre)) throw new Error('Genre classé deux fois pour SQL : ' + genre);
    construites.set(genre, groupe.raison);
  }
}
// Exhaustivité vérifiée au CHARGEMENT, et non par un test seulement : c'est
// la faute « 82 intentions classées pour 84 » de la phase 3, rendue
// impossible. Un genre nouveau dans le moteur casse SQL-A tout de suite.
const oublies = [...GENRES].filter(genre => !construites.has(genre));
if (oublies.length > 0) {
  throw new Error('Genres du moteur sans raison SQL (' + oublies.length + ') : ' + oublies.join(', '));
}

export const RAISONS_SQL: ReadonlyMap<string, string> = construites;

/** Vide, et c'est la décision S1. Aucune intention du catalogue partagé n'est
 * portée : `rendre()` refuse donc toutes les 84 avant d'appeler le rendu. */
export const PORTEES_SQL: ReadonlySet<string> = new Set<string>();
