/** Les intentions **natives** de SQL-A, et leurs types.
 *
 * Lot S0. SQL-A ne porte **aucune** des 84 intentions du catalogue partagé —
 * décision S1 —, donc tout ce qu'il sait faire est ici. C'est le premier
 * langage dans ce cas.
 */
import type { SourceRange } from '../../translate.ts';
import type { Condition } from '../../condition.ts';
import type { NumericExpression } from '../../numericExpression.ts';

export type DiagnosticSql = {
  code: string; category: 'understanding'; severity: 'error';
  message: string; range: SourceRange;
};

/** Les types de colonne que le catalogue écrit. Tous sont du SQL **standard** :
 * `text` en est absent par la décision S6. */
export type TypeSql = 'integer' | 'varchar' | 'numeric' | 'boolean' | 'date' | 'timestamp';

export type InstructionSql =
  // ---- domaine 1 : tables, colonnes, types ----
  | { kind: 'SQL_TABLE_CREE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_ENTIERE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_TEXTE'; table: string; colonne: string; longueur: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_DECIMALE'; table: string; colonne: string; precision: string; echelle: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_BOOLEENNE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_DATE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_HORODATAGE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_RENOMME'; table: string; colonne: string; nouvelle: string; range: SourceRange }
  | { kind: 'SQL_COLONNE_SUPPRIME'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_TABLE_SUPPRIME'; table: string; range: SourceRange }
  | { kind: 'SQL_TABLE_RENOMME'; table: string; nouvelle: string; range: SourceRange }
  | { kind: 'SQL_DOMAINE_CREE'; domaine: string; range: SourceRange }
  | { kind: 'SQL_SCHEMA_CREE'; schema: string; range: SourceRange }
  // ---- domaine 2 : interrogation et projection ----
  | { kind: 'SQL_REQUETE_COLONNE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_COLONNES'; table: string; colonne: string; colonne2: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_TOUTES'; table: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_DISTINCT'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_ALIAS_COLONNE'; table: string; colonne: string; alias: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_EXPRESSION'; table: string; expression: NumericExpression; alias: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_ALIAS_TABLE'; table: string; colonne: string; alias: string; range: SourceRange }
  | { kind: 'SQL_PROJECTION_AJOUTE'; colonne: string; range: SourceRange }
  // ---- domaine 3 : filtrage ----
  | { kind: 'SQL_FILTRE_CONDITION'; condition: Condition; range: SourceRange }
  | { kind: 'SQL_FILTRE_NUL'; colonne: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_NON_NUL'; colonne: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_TEXTE'; colonne: string; texte: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_COMMENCE'; colonne: string; texte: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_CONTIENT'; colonne: string; texte: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_INTERVALLE'; colonne: string; bas: string; haut: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_PARMI'; colonne: string; bas: string; haut: string; range: SourceRange }
  | { kind: 'SQL_FILTRE_ET'; condition: Condition; range: SourceRange }
  | { kind: 'SQL_FILTRE_OU'; condition: Condition; range: SourceRange }
  // ---- domaine 4 : tri et limitation ----
  | { kind: 'SQL_ORDRE_CROISSANT'; colonne: string; range: SourceRange }
  | { kind: 'SQL_ORDRE_DECROISSANT'; colonne: string; range: SourceRange }
  | { kind: 'SQL_ORDRE_ENSUITE'; colonne: string; range: SourceRange }
  | { kind: 'SQL_ORDRE_NULS_FIN'; range: SourceRange }
  | { kind: 'SQL_LIMITE'; combien: string; range: SourceRange }
  | { kind: 'SQL_DECALAGE'; combien: string; range: SourceRange }
  // ---- domaine 5 : agrégats et regroupement ----
  | { kind: 'SQL_AGREGAT_COMPTE'; table: string; range: SourceRange }
  | { kind: 'SQL_AGREGAT_COMPTE_COLONNE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_AGREGAT_SOMME'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_AGREGAT_MOYENNE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_AGREGAT_MIN'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_AGREGAT_MAX'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_REQUETE_COLONNE_ET_COMPTE'; table: string; colonne: string; range: SourceRange }
  | { kind: 'SQL_GROUPE'; colonne: string; range: SourceRange }
  | { kind: 'SQL_GROUPE_ENSUITE'; colonne: string; range: SourceRange }
  | { kind: 'SQL_GROUPE_FILTRE'; condition: Condition; range: SourceRange }
  | { kind: 'SQL_GROUPE_FILTRE_COMPTE'; combien: string; range: SourceRange }
  // ---- domaine 6 : jointures ----
  | { kind: 'SQL_JOINTURE_INTERNE'; table: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_JOINTURE_INTERNE_ALIAS'; table: string; alias: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_JOINTURE_GAUCHE'; table: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_JOINTURE_DROITE'; table: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_JOINTURE_COMPLETE'; table: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_JOINTURE_CROISEE'; table: string; range: SourceRange }
  // ---- domaine 7 : sous-requêtes, expressions de table, ensembles ----
  | { kind: 'SQL_SOUS_REQUETE_PARMI'; colonne: string; colonne2: string; table: string; range: SourceRange }
  | { kind: 'SQL_SOUS_REQUETE_EXISTE'; table: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_EXPRESSION_TABLE'; alias: string; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_UNION_SANS_DOUBLON'; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_UNION_AVEC_DOUBLONS'; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_INTERSECTION'; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_DIFFERENCE'; colonne: string; table: string; range: SourceRange }
  // ---- domaine 8 : modification des données ----
  | { kind: 'SQL_INSERE_UNE_COLONNE'; table: string; colonne: string; valeur: string; range: SourceRange }
  | { kind: 'SQL_INSERE_TEXTE'; table: string; colonne: string; texte: string; range: SourceRange }
  | { kind: 'SQL_INSERE_DEUX_COLONNES'; table: string; colonne: string; valeur: string; colonne2: string; texte: string; range: SourceRange }
  | { kind: 'SQL_INSERE_DEUX_ENTIERS'; table: string; colonne: string; valeur: string; colonne2: string; valeur2: string; range: SourceRange }
  | { kind: 'SQL_INSERE_DEPUIS_REQUETE'; table: string; colonne: string; table2: string; range: SourceRange }
  | { kind: 'SQL_MODIFIE_VALEUR'; table: string; colonne: string; valeur: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_MODIFIE_EXPRESSION'; table: string; colonne: string; expression: NumericExpression; condition: Condition; range: SourceRange }
  | { kind: 'SQL_MODIFIE_TEXTE'; table: string; colonne: string; texte: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_MODIFIE_TOUTES'; table: string; colonne: string; valeur: string; range: SourceRange }
  | { kind: 'SQL_SUPPRIME_LIGNES'; table: string; condition: Condition; range: SourceRange }
  | { kind: 'SQL_SUPPRIME_TOUTES'; table: string; range: SourceRange }
  // ---- domaine 9 : intégrité, vues, index, transactions, droits ----
  | { kind: 'SQL_CLE_PRIMAIRE'; colonne: string; table: string; contrainte: string; range: SourceRange }
  | { kind: 'SQL_CLE_ETRANGERE'; colonne: string; table: string; colonne2: string; table2: string; contrainte: string; range: SourceRange }
  | { kind: 'SQL_NON_NUL'; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_UNIQUE'; colonne: string; table: string; contrainte: string; range: SourceRange }
  | { kind: 'SQL_VERIFICATION'; table: string; condition: Condition; contrainte: string; range: SourceRange }
  | { kind: 'SQL_DEFAUT'; colonne: string; table: string; valeur: string; range: SourceRange }
  | { kind: 'SQL_IDENTITE'; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_CONTRAINTE_SUPPRIME'; contrainte: string; table: string; range: SourceRange }
  | { kind: 'SQL_VUE_CREE'; vue: string; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_VUE_SUPPRIME'; vue: string; range: SourceRange }
  | { kind: 'SQL_INDEX_CREE'; index: string; colonne: string; table: string; range: SourceRange }
  | { kind: 'SQL_INDEX_SUPPRIME'; index: string; range: SourceRange }
  | { kind: 'SQL_TRANSACTION_OUVRE'; range: SourceRange }
  | { kind: 'SQL_TRANSACTION_VALIDE'; range: SourceRange }
  | { kind: 'SQL_TRANSACTION_ANNULE'; range: SourceRange }
  | { kind: 'SQL_POINT_DE_REPRISE'; point: string; range: SourceRange }
  | { kind: 'SQL_RETOUR_AU_POINT'; point: string; range: SourceRange }
  | { kind: 'SQL_ROLE_CREE'; role: string; range: SourceRange }
  | { kind: 'SQL_DROIT_LECTURE'; table: string; role: string; range: SourceRange }
  | { kind: 'SQL_DROIT_ECRITURE'; table: string; role: string; range: SourceRange }
  | { kind: 'SQL_DROIT_RETIRE'; table: string; role: string; range: SourceRange };

export type GenreSql = InstructionSql['kind'];

export type AnalyseSql =
  | { status: 'reconnu'; instruction: InstructionSql }
  | { status: 'refuse'; diagnostic: DiagnosticSql };
