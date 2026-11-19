/** Le rendu SQL des 91 intentions natives.
 *
 * Lots S1 à S8. Trois règles de mise en page, et elles ne sont pas
 * esthétiques — elles viennent de la règle 9 :
 *
 *   1. une **instruction** porte son `;` ;
 *   2. une **requête** est multi-lignes, avec une ligne blanche puis `;` seul
 *      sur la dernière : c'est ce qui rend l'ajout de clause possible ;
 *   3. les virgules et les opérateurs de liste sont **en tête de ligne**
 *      (décision S5), seule disposition où ajouter un terme ne touche pas la
 *      ligne précédente.
 *
 * Et une règle d'encodage : une apostrophe dans un littéral est **doublée**
 * (décision S7). Ce n'est pas une invention — c'est la seule façon de l'écrire.
 */
import { rendreConditionSql, rendreExpressionSql } from './expression.ts';
import type { InstructionSql } from './instructions.ts';
import type { Condition } from '../../condition.ts';
import type { NumericExpression } from '../../numericExpression.ts';

export type RenduNatifSql = { status: 'rendu'; code: string } | { status: 'refus'; raison: string };

const rendu = (code: string): RenduNatifSql => ({ status: 'rendu', code });

/** Un littéral de texte SQL. L'apostrophe est **doublée**, décision S7. */
function litteral(texte: string): string {
  return "'" + texte.replace(/'/gu, "''") + "'";
}

/** Le squelette d'une requête : les clauses, puis une **ligne blanche**, puis
 * le `;` seul. Le curseur se posera sur la ligne blanche. */
function requete(...lignes: readonly string[]): string {
  return [...lignes, '', ';'].join('\n');
}

export function rendreSqlNatif(instruction: InstructionSql): RenduNatifSql {
  const cond = (condition: Condition): RenduNatifSql => rendreConditionSql(condition);
  const expr = (expression: NumericExpression): RenduNatifSql => rendreExpressionSql(expression);

  switch (instruction.kind) {
    // ---------------- domaine 1 ----------------
    case 'SQL_TABLE_CREE':
      return rendu(`CREATE TABLE ${instruction.table} (\n  ${instruction.colonne} integer\n);`);
    case 'SQL_COLONNE_ENTIERE':
      return rendu(`ALTER TABLE ${instruction.table} ADD COLUMN ${instruction.colonne} integer;`);
    case 'SQL_COLONNE_TEXTE':
      return rendu(`ALTER TABLE ${instruction.table} ADD COLUMN ${instruction.colonne} varchar(${instruction.longueur});`);
    case 'SQL_COLONNE_DECIMALE':
      return rendu(`ALTER TABLE ${instruction.table} ADD COLUMN ${instruction.colonne} numeric(${instruction.precision}, ${instruction.echelle});`);
    case 'SQL_COLONNE_BOOLEENNE':
      return rendu(`ALTER TABLE ${instruction.table} ADD COLUMN ${instruction.colonne} boolean;`);
    case 'SQL_COLONNE_DATE':
      return rendu(`ALTER TABLE ${instruction.table} ADD COLUMN ${instruction.colonne} date;`);
    case 'SQL_COLONNE_HORODATAGE':
      return rendu(`ALTER TABLE ${instruction.table} ADD COLUMN ${instruction.colonne} timestamp;`);
    case 'SQL_COLONNE_RENOMME':
      return rendu(`ALTER TABLE ${instruction.table} RENAME COLUMN ${instruction.colonne} TO ${instruction.nouvelle};`);
    case 'SQL_COLONNE_SUPPRIME':
      return rendu(`ALTER TABLE ${instruction.table} DROP COLUMN ${instruction.colonne};`);
    case 'SQL_TABLE_SUPPRIME': return rendu(`DROP TABLE ${instruction.table};`);
    case 'SQL_TABLE_RENOMME':
      return rendu(`ALTER TABLE ${instruction.table} RENAME TO ${instruction.nouvelle};`);
    case 'SQL_DOMAINE_CREE': return rendu(`CREATE DOMAIN ${instruction.domaine} AS integer;`);
    case 'SQL_SCHEMA_CREE': return rendu(`CREATE SCHEMA ${instruction.schema};`);

    // ---------------- domaine 2 ----------------
    case 'SQL_REQUETE_COLONNE':
      return rendu(requete(`SELECT ${instruction.colonne}`, `FROM ${instruction.table}`));
    case 'SQL_REQUETE_COLONNES':
      return rendu(requete(`SELECT ${instruction.colonne}`,
        `     , ${instruction.colonne2}`, `FROM ${instruction.table}`));
    case 'SQL_REQUETE_TOUTES':
      return rendu(requete('SELECT *', `FROM ${instruction.table}`));
    case 'SQL_REQUETE_DISTINCT':
      return rendu(requete(`SELECT DISTINCT ${instruction.colonne}`, `FROM ${instruction.table}`));
    case 'SQL_REQUETE_ALIAS_COLONNE':
      return rendu(requete(`SELECT ${instruction.colonne} AS ${instruction.alias}`,
        `FROM ${instruction.table}`));
    case 'SQL_REQUETE_EXPRESSION': {
      const e = expr(instruction.expression);
      if (e.status === 'refus') return e;
      return rendu(requete(`SELECT ${e.code} AS ${instruction.alias}`, `FROM ${instruction.table}`));
    }
    case 'SQL_REQUETE_ALIAS_TABLE':
      return rendu(requete(`SELECT ${instruction.colonne}`,
        `FROM ${instruction.table} AS ${instruction.alias}`));
    case 'SQL_PROJECTION_AJOUTE': return rendu(`     , ${instruction.colonne}`);

    // ---------------- domaine 3 ----------------
    case 'SQL_FILTRE_CONDITION': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`WHERE ${c.code}`);
    }
    case 'SQL_FILTRE_NUL': return rendu(`WHERE ${instruction.colonne} IS NULL`);
    case 'SQL_FILTRE_NON_NUL': return rendu(`WHERE ${instruction.colonne} IS NOT NULL`);
    case 'SQL_FILTRE_TEXTE':
      return rendu(`WHERE ${instruction.colonne} = ${litteral(instruction.texte)}`);
    case 'SQL_FILTRE_COMMENCE':
      return rendu(`WHERE ${instruction.colonne} LIKE ${litteral(instruction.texte + '%')}`);
    case 'SQL_FILTRE_CONTIENT':
      return rendu(`WHERE ${instruction.colonne} LIKE ${litteral('%' + instruction.texte + '%')}`);
    case 'SQL_FILTRE_INTERVALLE':
      return rendu(`WHERE ${instruction.colonne} BETWEEN ${instruction.bas} AND ${instruction.haut}`);
    case 'SQL_FILTRE_PARMI':
      return rendu(`WHERE ${instruction.colonne} IN (${instruction.bas}, ${instruction.haut})`);
    case 'SQL_FILTRE_ET': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`  AND ${c.code}`);
    }
    case 'SQL_FILTRE_OU': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`   OR ${c.code}`);
    }

    // ---------------- domaine 4 ----------------
    case 'SQL_ORDRE_CROISSANT': return rendu(`ORDER BY ${instruction.colonne} ASC`);
    case 'SQL_ORDRE_DECROISSANT': return rendu(`ORDER BY ${instruction.colonne} DESC`);
    case 'SQL_ORDRE_ENSUITE': return rendu(`        , ${instruction.colonne} ASC`);
    case 'SQL_ORDRE_NULS_FIN': return rendu('        NULLS LAST');
    case 'SQL_LIMITE': return rendu(`FETCH FIRST ${instruction.combien} ROWS ONLY`);
    case 'SQL_DECALAGE': return rendu(`OFFSET ${instruction.combien} ROWS`);

    // ---------------- domaine 5 ----------------
    case 'SQL_AGREGAT_COMPTE':
      return rendu(requete('SELECT COUNT(*)', `FROM ${instruction.table}`));
    case 'SQL_AGREGAT_COMPTE_COLONNE':
      return rendu(requete(`SELECT COUNT(${instruction.colonne})`, `FROM ${instruction.table}`));
    case 'SQL_AGREGAT_SOMME':
      return rendu(requete(`SELECT SUM(${instruction.colonne})`, `FROM ${instruction.table}`));
    case 'SQL_AGREGAT_MOYENNE':
      return rendu(requete(`SELECT AVG(${instruction.colonne})`, `FROM ${instruction.table}`));
    case 'SQL_AGREGAT_MIN':
      return rendu(requete(`SELECT MIN(${instruction.colonne})`, `FROM ${instruction.table}`));
    case 'SQL_AGREGAT_MAX':
      return rendu(requete(`SELECT MAX(${instruction.colonne})`, `FROM ${instruction.table}`));
    case 'SQL_REQUETE_COLONNE_ET_COMPTE':
      return rendu(requete(`SELECT ${instruction.colonne}`, '     , COUNT(*)',
        `FROM ${instruction.table}`));
    case 'SQL_GROUPE': return rendu(`GROUP BY ${instruction.colonne}`);
    case 'SQL_GROUPE_ENSUITE': return rendu(`       , ${instruction.colonne}`);
    case 'SQL_GROUPE_FILTRE': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`HAVING ${c.code}`);
    }
    case 'SQL_GROUPE_FILTRE_COMPTE': return rendu(`HAVING COUNT(*) > ${instruction.combien}`);

    // ---------------- domaine 6 ----------------
    case 'SQL_JOINTURE_INTERNE': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`INNER JOIN ${instruction.table} ON ${c.code}`);
    }
    case 'SQL_JOINTURE_INTERNE_ALIAS': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c
        : rendu(`INNER JOIN ${instruction.table} AS ${instruction.alias} ON ${c.code}`);
    }
    case 'SQL_JOINTURE_GAUCHE': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`LEFT OUTER JOIN ${instruction.table} ON ${c.code}`);
    }
    case 'SQL_JOINTURE_DROITE': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`RIGHT OUTER JOIN ${instruction.table} ON ${c.code}`);
    }
    case 'SQL_JOINTURE_COMPLETE': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`FULL OUTER JOIN ${instruction.table} ON ${c.code}`);
    }
    case 'SQL_JOINTURE_CROISEE': return rendu(`CROSS JOIN ${instruction.table}`);

    // ---------------- domaine 7 ----------------
    case 'SQL_SOUS_REQUETE_PARMI':
      return rendu([`WHERE ${instruction.colonne} IN (`,
        `        SELECT ${instruction.colonne2}`, `        FROM ${instruction.table}`,
        '      )'].join('\n'));
    case 'SQL_SOUS_REQUETE_EXISTE': {
      const c = cond(instruction.condition);
      if (c.status === 'refus') return c;
      // Le `SELECT 1` est exigé par la syntaxe d'EXISTS, qui ignore la
      // projection. Ce n'est pas un ajout implicite mais une obligation du
      // langage, et une information passive le dit.
      return rendu(['WHERE EXISTS (', '        SELECT 1', `        FROM ${instruction.table}`,
        `        WHERE ${c.code}`, '      )'].join('\n'));
    }
    case 'SQL_EXPRESSION_TABLE':
      // Le SELECT extérieur fait partie de l'instruction, et ce n'est pas un
      // ajout implicite : la phrase demande une REQUÊTE « fondée sur »
      // l'expression de table, « qui lit la colonne X ».
      //
      // Un `WITH … AS (…)` suivi d'un point-virgule n'est PAS du SQL valide.
      // La première formulation le produisait, aucun test unitaire ne l'avait
      // vu, et c'est le serveur qui l'a dit — « syntax error at or near ";" ».
      return rendu([`WITH ${instruction.alias} AS (`, `  SELECT ${instruction.colonne}`,
        `  FROM ${instruction.table}`, ')', `SELECT ${instruction.colonne}`,
        `FROM ${instruction.alias}`, '', ';'].join('\n'));
    case 'SQL_UNION_SANS_DOUBLON':
      return rendu(`UNION\nSELECT ${instruction.colonne}\nFROM ${instruction.table}`);
    case 'SQL_UNION_AVEC_DOUBLONS':
      return rendu(`UNION ALL\nSELECT ${instruction.colonne}\nFROM ${instruction.table}`);
    case 'SQL_INTERSECTION':
      return rendu(`INTERSECT\nSELECT ${instruction.colonne}\nFROM ${instruction.table}`);
    case 'SQL_DIFFERENCE':
      return rendu(`EXCEPT\nSELECT ${instruction.colonne}\nFROM ${instruction.table}`);

    // ---------------- domaine 8 ----------------
    case 'SQL_INSERE_UNE_COLONNE':
      return rendu(`INSERT INTO ${instruction.table} (${instruction.colonne})\nVALUES (${instruction.valeur});`);
    case 'SQL_INSERE_TEXTE':
      return rendu(`INSERT INTO ${instruction.table} (${instruction.colonne})\nVALUES (${litteral(instruction.texte)});`);
    case 'SQL_INSERE_DEUX_COLONNES':
      return rendu(`INSERT INTO ${instruction.table} (${instruction.colonne}, ${instruction.colonne2})\n`
        + `VALUES (${instruction.valeur}, ${litteral(instruction.texte)});`);
    case 'SQL_INSERE_DEUX_ENTIERS':
      return rendu(`INSERT INTO ${instruction.table} (${instruction.colonne}, ${instruction.colonne2})
`
        + `VALUES (${instruction.valeur}, ${instruction.valeur2});`);
    case 'SQL_INSERE_DEPUIS_REQUETE':
      return rendu([`INSERT INTO ${instruction.table} (${instruction.colonne})`,
        `SELECT ${instruction.colonne}`, `FROM ${instruction.table2}`, '', ';'].join('\n'));
    case 'SQL_MODIFIE_VALEUR': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c
        : rendu(`UPDATE ${instruction.table}\nSET ${instruction.colonne} = ${instruction.valeur}\nWHERE ${c.code};`);
    }
    case 'SQL_MODIFIE_EXPRESSION': {
      const e = expr(instruction.expression);
      if (e.status === 'refus') return e;
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c
        : rendu(`UPDATE ${instruction.table}\nSET ${instruction.colonne} = ${e.code}\nWHERE ${c.code};`);
    }
    case 'SQL_MODIFIE_TEXTE': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c
        : rendu(`UPDATE ${instruction.table}
SET ${instruction.colonne} = ${litteral(instruction.texte)}
WHERE ${c.code};`);
    }
    case 'SQL_MODIFIE_TOUTES':
      return rendu(`UPDATE ${instruction.table}\nSET ${instruction.colonne} = ${instruction.valeur};`);
    case 'SQL_SUPPRIME_LIGNES': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c : rendu(`DELETE FROM ${instruction.table}\nWHERE ${c.code};`);
    }
    case 'SQL_SUPPRIME_TOUTES': return rendu(`DELETE FROM ${instruction.table};`);

    // ---------------- domaine 9 ----------------
    case 'SQL_CLE_PRIMAIRE':
      return rendu(`ALTER TABLE ${instruction.table}\nADD CONSTRAINT ${instruction.contrainte} PRIMARY KEY (${instruction.colonne});`);
    case 'SQL_CLE_ETRANGERE':
      return rendu(`ALTER TABLE ${instruction.table}\nADD CONSTRAINT ${instruction.contrainte} `
        + `FOREIGN KEY (${instruction.colonne}) REFERENCES ${instruction.table2} (${instruction.colonne2});`);
    case 'SQL_NON_NUL':
      return rendu(`ALTER TABLE ${instruction.table}\nALTER COLUMN ${instruction.colonne} SET NOT NULL;`);
    case 'SQL_UNIQUE':
      return rendu(`ALTER TABLE ${instruction.table}\nADD CONSTRAINT ${instruction.contrainte} UNIQUE (${instruction.colonne});`);
    case 'SQL_VERIFICATION': {
      const c = cond(instruction.condition);
      return c.status === 'refus' ? c
        : rendu(`ALTER TABLE ${instruction.table}\nADD CONSTRAINT ${instruction.contrainte} CHECK (${c.code});`);
    }
    case 'SQL_DEFAUT':
      return rendu(`ALTER TABLE ${instruction.table}\nALTER COLUMN ${instruction.colonne} SET DEFAULT ${instruction.valeur};`);
    case 'SQL_IDENTITE':
      return rendu(`ALTER TABLE ${instruction.table}\nALTER COLUMN ${instruction.colonne} ADD GENERATED BY DEFAULT AS IDENTITY;`);
    case 'SQL_CONTRAINTE_SUPPRIME':
      return rendu(`ALTER TABLE ${instruction.table}\nDROP CONSTRAINT ${instruction.contrainte};`);
    case 'SQL_VUE_CREE':
      return rendu([`CREATE VIEW ${instruction.vue} AS`, `SELECT ${instruction.colonne}`,
        `FROM ${instruction.table}`, '', ';'].join('\n'));
    case 'SQL_VUE_SUPPRIME': return rendu(`DROP VIEW ${instruction.vue};`);
    case 'SQL_INDEX_CREE':
      return rendu(`CREATE INDEX ${instruction.index} ON ${instruction.table} (${instruction.colonne});`);
    case 'SQL_INDEX_SUPPRIME': return rendu(`DROP INDEX ${instruction.index};`);
    case 'SQL_TRANSACTION_OUVRE': return rendu('START TRANSACTION;');
    case 'SQL_TRANSACTION_VALIDE': return rendu('COMMIT;');
    case 'SQL_TRANSACTION_ANNULE': return rendu('ROLLBACK;');
    case 'SQL_POINT_DE_REPRISE': return rendu(`SAVEPOINT ${instruction.point};`);
    case 'SQL_RETOUR_AU_POINT': return rendu(`ROLLBACK TO SAVEPOINT ${instruction.point};`);
    case 'SQL_ROLE_CREE': return rendu(`CREATE ROLE ${instruction.role};`);
    case 'SQL_DROIT_LECTURE':
      return rendu(`GRANT SELECT ON ${instruction.table} TO ${instruction.role};`);
    case 'SQL_DROIT_ECRITURE':
      return rendu(`GRANT INSERT ON ${instruction.table} TO ${instruction.role};`);
    case 'SQL_DROIT_RETIRE':
      return rendu(`REVOKE SELECT ON ${instruction.table} FROM ${instruction.role};`);
  }
}
