/** Les trois portées de SQL, et le rang des clauses.
 *
 * Lot S2. SQL ne demande pas « à quelle profondeur suis-je ? » — il n'y a
 * aucune imbrication — mais « **où en suis-je dans l'ordre des clauses** ? ».
 * Dix rangs, et une clause de rang inférieur au rang atteint ne s'écrit pas.
 */
import type { GenreSql } from './instructions.ts';

export type Portee = 'fichier' | 'requete' | 'projection';

export const NOM_PORTEE: Readonly<Record<Portee, string>> = {
  fichier: 'la portée fichier',
  requete: 'une requête ouverte',
  projection: 'la liste de projection d’une requête',
};

/** Les clauses, par rang. Le rang **croît** dans l'ordre où SQL les exige.
 * `unique` dit si la clause ne peut apparaître qu'une fois. */
export type Clause = {
  readonly rang: number;
  readonly unique: boolean;
  /** Le mot SQL qui l'ouvre, tel qu'il apparaît en tête de la ligne rendue.
   * `undefined` : la clause est une SUITE — une virgule ou un opérateur en
   * tête de ligne — et elle exige qu'une clause mère soit déjà écrite. */
  readonly mot?: string;
  /** La clause mère exigée, pour une suite. */
  readonly suiteDe?: number;
};

/** Rangs : 1 projection, 2 FROM, 3 JOIN, 4 WHERE, 5 GROUP BY, 6 HAVING,
 * 7 ensembles, 8 ORDER BY, 9 OFFSET, 10 FETCH. */
export const CLAUSES: Readonly<Record<string, Clause>> = {
  SQL_PROJECTION_AJOUTE: { rang: 1, unique: false, suiteDe: 1 },
  SQL_JOINTURE_INTERNE: { rang: 3, unique: false, mot: 'INNER JOIN' },
  SQL_JOINTURE_INTERNE_ALIAS: { rang: 3, unique: false, mot: 'INNER JOIN' },
  SQL_JOINTURE_GAUCHE: { rang: 3, unique: false, mot: 'LEFT OUTER JOIN' },
  SQL_JOINTURE_DROITE: { rang: 3, unique: false, mot: 'RIGHT OUTER JOIN' },
  SQL_JOINTURE_COMPLETE: { rang: 3, unique: false, mot: 'FULL OUTER JOIN' },
  SQL_JOINTURE_CROISEE: { rang: 3, unique: false, mot: 'CROSS JOIN' },
  SQL_FILTRE_CONDITION: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_NUL: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_NON_NUL: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_TEXTE: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_COMMENCE: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_CONTIENT: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_INTERVALLE: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_PARMI: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_SOUS_REQUETE_PARMI: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_SOUS_REQUETE_EXISTE: { rang: 4, unique: true, mot: 'WHERE' },
  SQL_FILTRE_ET: { rang: 4, unique: false, suiteDe: 4 },
  SQL_FILTRE_OU: { rang: 4, unique: false, suiteDe: 4 },
  SQL_GROUPE: { rang: 5, unique: true, mot: 'GROUP BY' },
  SQL_GROUPE_ENSUITE: { rang: 5, unique: false, suiteDe: 5 },
  SQL_GROUPE_FILTRE: { rang: 6, unique: true, mot: 'HAVING' },
  SQL_GROUPE_FILTRE_COMPTE: { rang: 6, unique: true, mot: 'HAVING' },
  SQL_UNION_SANS_DOUBLON: { rang: 7, unique: false, mot: 'UNION' },
  SQL_UNION_AVEC_DOUBLONS: { rang: 7, unique: false, mot: 'UNION ALL' },
  SQL_INTERSECTION: { rang: 7, unique: false, mot: 'INTERSECT' },
  SQL_DIFFERENCE: { rang: 7, unique: false, mot: 'EXCEPT' },
  SQL_ORDRE_CROISSANT: { rang: 8, unique: true, mot: 'ORDER BY' },
  SQL_ORDRE_DECROISSANT: { rang: 8, unique: true, mot: 'ORDER BY' },
  SQL_ORDRE_ENSUITE: { rang: 8, unique: false, suiteDe: 8 },
  SQL_ORDRE_NULS_FIN: { rang: 8, unique: false, suiteDe: 8 },
  SQL_DECALAGE: { rang: 9, unique: true, mot: 'OFFSET' },
  SQL_LIMITE: { rang: 10, unique: true, mot: 'FETCH FIRST' },
};

/** Le nom lisible d'un rang, pour un diagnostic qui NOMME ce qui bloque. */
export const NOM_RANG: Readonly<Record<number, string>> = {
  1: 'la liste de projection', 2: 'le FROM', 3: 'une jointure', 4: 'le WHERE',
  5: 'le GROUP BY', 6: 'le HAVING', 7: 'un opérateur d’ensemble', 8: 'l’ORDER BY',
  9: 'l’OFFSET', 10: 'le FETCH FIRST',
};

/** La portée d'une intention. Le défaut est `fichier` : une instruction
 * complète, qui porte son point-virgule. */
export function porteeDe(kind: GenreSql): Portee {
  if (kind === 'SQL_PROJECTION_AJOUTE') return 'projection';
  return kind in CLAUSES ? 'requete' : 'fichier';
}

/** Les intentions qui **ouvrent** une requête multi-lignes : le fragment se
 * termine par une ligne blanche puis `;`, et le curseur est posé dedans.
 * Décision S2. */
export const OUVRE_UNE_REQUETE: ReadonlySet<string> = new Set<GenreSql>([
  'SQL_REQUETE_COLONNE', 'SQL_REQUETE_COLONNES', 'SQL_REQUETE_TOUTES',
  'SQL_REQUETE_DISTINCT', 'SQL_REQUETE_ALIAS_COLONNE', 'SQL_REQUETE_EXPRESSION',
  'SQL_REQUETE_ALIAS_TABLE', 'SQL_AGREGAT_COMPTE', 'SQL_AGREGAT_COMPTE_COLONNE',
  'SQL_AGREGAT_SOMME', 'SQL_AGREGAT_MOYENNE', 'SQL_AGREGAT_MIN', 'SQL_AGREGAT_MAX',
  'SQL_REQUETE_COLONNE_ET_COMPTE', 'SQL_EXPRESSION_TABLE', 'SQL_VUE_CREE',
  'SQL_INSERE_DEPUIS_REQUETE',
]);
