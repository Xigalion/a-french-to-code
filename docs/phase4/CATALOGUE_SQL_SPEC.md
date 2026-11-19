# Catalogue SQL-A — spécification proposée

> **Engendré** par `node scripts/catalogue-sql.mjs --markdown` depuis
> `catalogue-sql.json`. Ne pas le modifier à la main : aucun chiffre de ce
> document n’est écrit, ils sont tous calculés.

> **Rien de ceci n’est implémenté.** C’est la proposition soumise à
> validation, et elle ne devient un contrat qu’une fois approuvée.

Dialecte : **SQL standard prioritaire, VERIFIE PAR EXECUTION sur PostgreSQL 18.7**.

## Les chiffres

| | |
|---|---|
| genres du catalogue partagé | **84** |
| repris tels quels | **0** |
| adaptés | **0** |
| refusés | **84** |
| groupes de refus (raisons distinctes) | **10** |
| formulations natives proposées | **91** |
| dont ouvrant une requête (bloc) | **17** |
| dont instructions complètes | **58** |
| dont clauses de requête | **32** |
| dont clauses de projection | **1** |
| domaines couverts | **9** |
| refus de dialecte nommés | **12** |
| informations pédagogiques passives | **14** |

## Les trois portées

| Portée | Ce qu’on y place | Point-virgule |
|---|---|---|
| `fichier` | une instruction complète | **oui**, elle le porte |
| `requete` | une clause, dans une requête ouverte | **non**, il est déjà écrit |
| `projection` | une colonne de plus, avant le `FROM` | **non** |

## Domaine 1 — Fondamentaux : tables, colonnes et types

**13 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Crée une table nommée {table} avec une colonne entière nommée {colonne}.` | `CREATE TABLE {table} (` + `  {colonne} integer` + `);` | fichier |
| `Ajoute à la table {table} une colonne entière nommée {colonne}.` | `ALTER TABLE {table} ADD COLUMN {colonne} integer;` | fichier |
| `Ajoute à la table {table} une colonne de texte nommée {colonne} de longueur {entier}.` | `ALTER TABLE {table} ADD COLUMN {colonne} varchar({entier});` | fichier |
| `Ajoute à la table {table} une colonne décimale nommée {colonne} de précision {entier} et d’échelle {entier2}.` | `ALTER TABLE {table} ADD COLUMN {colonne} numeric({entier}, {entier2});` | fichier |
| `Ajoute à la table {table} une colonne booléenne nommée {colonne}.` | `ALTER TABLE {table} ADD COLUMN {colonne} boolean;` | fichier |
| `Ajoute à la table {table} une colonne de date nommée {colonne}.` | `ALTER TABLE {table} ADD COLUMN {colonne} date;` | fichier |
| `Ajoute à la table {table} une colonne d’horodatage nommée {colonne}.` | `ALTER TABLE {table} ADD COLUMN {colonne} timestamp;` | fichier |
| `Renomme la colonne {colonne} de la table {table} en {colonne2}.` | `ALTER TABLE {table} RENAME COLUMN {colonne} TO {colonne2};` | fichier |
| `Supprime la colonne {colonne} de la table {table}.` | `ALTER TABLE {table} DROP COLUMN {colonne};` | fichier |
| `Supprime la table {table}.` | `DROP TABLE {table};` | fichier |
| `Renomme la table {table} en {table2}.` | `ALTER TABLE {table} RENAME TO {table2};` | fichier |
| `Crée un domaine nommé {domaine} fondé sur le type entier.` | `CREATE DOMAIN {domaine} AS integer;` | fichier |
| `Crée un schéma nommé {schema}.` | `CREATE SCHEMA {schema};` | fichier |

- **SQL_TABLE_CREE** — Une table sans aucune colonne n'est pas du SQL standard. Exiger la premiere colonne evite d'en inventer une.
- **SQL_COLONNE_TEXTE** — La longueur est EXIGEE : `varchar` sans longueur et `text` ne sont pas interchangeables, et choisir a la place de l'apprenant serait inventer.
- **SQL_DOMAINE_CREE** — Le seul equivalent reel d'un synonyme de type en SQL standard. C'est aussi la seule correspondance defendable avec TYPE_ALIAS du catalogue partage.

## Domaine 2 — Interrogation et projection

**8 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Crée une requête qui lit la colonne {colonne} de la table {table}.` | `SELECT {colonne}` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit les colonnes {colonne} et {colonne2} de la table {table}.` | `SELECT {colonne}` + `     , {colonne2}` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit toutes les colonnes de la table {table}.` | `SELECT *` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit les valeurs distinctes de la colonne {colonne} de la table {table}.` | `SELECT DISTINCT {colonne}` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit la colonne {colonne} de la table {table} sous le nom {alias}.` | `SELECT {colonne} AS {alias}` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit le résultat de "{expression}" de la table {table} sous le nom {alias}.` | `SELECT {expression} AS {alias}` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit la colonne {colonne} de la table {table} désignée par {alias}.` | `SELECT {colonne}` + `FROM {table} AS {alias}` + `` + `;` | fichier, bloc |
| `Lis aussi la colonne {colonne}.` | `     , {colonne}` | projection |

- **SQL_REQUETE_COLONNES** — Virgule EN TETE de ligne : c'est la seule disposition qui permette d'ajouter une colonne par une insertion pure, sans toucher a la ligne precedente. Regle 9.
- **SQL_REQUETE_TOUTES** — `*` n'apparait QUE si la phrase dit « toutes les colonnes ». Il n'est jamais un defaut.
- **SQL_PROJECTION_AJOUTE** — Placable UNIQUEMENT sur une ligne blanche de la liste de projection, avant le FROM. C'est la portee `projection`.

## Domaine 3 — Filtrage des lignes

**10 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Ne garde que les lignes où "{condition}".` | `WHERE {condition}` | requete |
| `Ne garde que les lignes où {colonne} est nulle.` | `WHERE {colonne} IS NULL` | requete |
| `Ne garde que les lignes où {colonne} n’est pas nulle.` | `WHERE {colonne} IS NOT NULL` | requete |
| `Ne garde que les lignes où {colonne} vaut le texte "{texte}".` | `WHERE {colonne} = '{texte}'` | requete |
| `Ne garde que les lignes où {colonne} commence par "{texte}".` | `WHERE {colonne} LIKE '{texte}%'` | requete |
| `Ne garde que les lignes où {colonne} contient "{texte}".` | `WHERE {colonne} LIKE '%{texte}%'` | requete |
| `Ne garde que les lignes où {colonne} est comprise entre {entier} et {entier2}.` | `WHERE {colonne} BETWEEN {entier} AND {entier2}` | requete |
| `Ne garde que les lignes où {colonne} vaut {entier} ou {entier2}.` | `WHERE {colonne} IN ({entier}, {entier2})` | requete |
| `Exige aussi que "{condition}".` | `  AND {condition}` | requete |
| `Accepte aussi les lignes où "{condition}".` | `   OR {condition}` | requete |

- **SQL_FILTRE_NUL** — Formulation DEDIEE, parce que `= NULL` est faux en SQL et qu'aucune expression citee ne doit pouvoir l'ecrire.
- **SQL_FILTRE_ET** — Operateur EN TETE de ligne, meme raison que la virgule : ajouter une condition reste une insertion pure.
- **SQL_FILTRE_OU** — Une information passive dira que OR melange a AND sans parentheses suit une priorite que l'apprenant doit connaitre : A n'ajoute pas de parentheses non demandees.

## Domaine 4 — Tri et limitation

**6 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Ordonne les lignes par {colonne} en ordre croissant.` | `ORDER BY {colonne} ASC` | requete |
| `Ordonne les lignes par {colonne} en ordre décroissant.` | `ORDER BY {colonne} DESC` | requete |
| `Ordonne ensuite les lignes par {colonne} en ordre croissant.` | `        , {colonne} ASC` | requete |
| `Place les valeurs nulles en dernier.` | ` NULLS LAST` | requete |
| `Ne garde que les {entier} premières lignes.` | `FETCH FIRST {entier} ROWS ONLY` | requete |
| `Ignore les {entier} premières lignes.` | `OFFSET {entier} ROWS` | requete |

- **SQL_ORDRE_NULS_FIN** — A verifier par execution : l'ordre par defaut des nuls est defini par l'implementation, et PostgreSQL les place en dernier en ordre croissant. La formulation existe pour que l'apprenant ne DEPENDE pas de ce defaut.
- **SQL_LIMITE** — Forme STANDARD. `LIMIT` est une extension de PostgreSQL et sera refusee nommement.

## Domaine 5 — Agregats et regroupement

**11 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Crée une requête qui compte les lignes de la table {table}.` | `SELECT COUNT(*)` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui compte les valeurs non nulles de la colonne {colonne} de la table {table}.` | `SELECT COUNT({colonne})` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui somme la colonne {colonne} de la table {table}.` | `SELECT SUM({colonne})` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui calcule la moyenne de la colonne {colonne} de la table {table}.` | `SELECT AVG({colonne})` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui cherche la plus petite valeur de la colonne {colonne} de la table {table}.` | `SELECT MIN({colonne})` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui cherche la plus grande valeur de la colonne {colonne} de la table {table}.` | `SELECT MAX({colonne})` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Crée une requête qui lit la colonne {colonne} et le nombre de lignes de la table {table}.` | `SELECT {colonne}` + `     , COUNT(*)` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Regroupe les lignes par {colonne}.` | `GROUP BY {colonne}` | requete |
| `Regroupe ensuite les lignes par {colonne}.` | `       , {colonne}` | requete |
| `Ne garde que les groupes où "{condition}".` | `HAVING {condition}` | requete |
| `Ne garde que les groupes de plus de {entier} lignes.` | `HAVING COUNT(*) > {entier}` | requete |

- **SQL_AGREGAT_COMPTE_COLONNE** — Deux formulations distinctes parce que COUNT(*) et COUNT(c) ne comptent pas la meme chose. Une information passive le dira.

## Domaine 6 — Jointures

**6 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Joins la table {table} sur "{condition}".` | `INNER JOIN {table} ON {condition}` | requete |
| `Joins la table {table} désignée par {alias} sur "{condition}".` | `INNER JOIN {table} AS {alias} ON {condition}` | requete |
| `Joins la table {table} en gardant toutes les lignes de gauche sur "{condition}".` | `LEFT OUTER JOIN {table} ON {condition}` | requete |
| `Joins la table {table} en gardant toutes les lignes de droite sur "{condition}".` | `RIGHT OUTER JOIN {table} ON {condition}` | requete |
| `Joins la table {table} en gardant toutes les lignes des deux côtés sur "{condition}".` | `FULL OUTER JOIN {table} ON {condition}` | requete |
| `Joins la table {table} sans condition.` | `CROSS JOIN {table}` | requete |

- **SQL_JOINTURE_INTERNE** — `INNER` est ECRIT, bien que facultatif : le mot absent laisserait croire qu'une jointure sans qualificatif est autre chose qu'une jointure interne.
- **SQL_JOINTURE_CROISEE** — Une information passive dira ce que coute un produit cartesien, sans refuser : c'est une construction legitime.

## Domaine 7 — Sous-requetes, expressions de table et ensembles

**7 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Ne garde que les lignes où {colonne} figure parmi les {colonne2} de la table {table}.` | `WHERE {colonne} IN (` + `        SELECT {colonne2}` + `        FROM {table}` + `      )` | requete |
| `Ne garde que les lignes pour lesquelles il existe une ligne de la table {table} où "{condition}".` | `WHERE EXISTS (` + `        SELECT 1` + `        FROM {table}` + `        WHERE {condition}` + `      )` | requete |
| `Crée une expression de table nommée {alias} qui lit la colonne {colonne} de la table {table}.` | `WITH {alias} AS (` + `  SELECT {colonne}` + `  FROM {table}` + `)` + `` + `;` | fichier, bloc |
| `Ajoute sans doublon les {colonne} de la table {table}.` | `UNION` + `SELECT {colonne}` + `FROM {table}` | requete |
| `Ajoute avec les doublons les {colonne} de la table {table}.` | `UNION ALL` + `SELECT {colonne}` + `FROM {table}` | requete |
| `Ne garde que ce qui figure aussi parmi les {colonne} de la table {table}.` | `INTERSECT` + `SELECT {colonne}` + `FROM {table}` | requete |
| `Retire ce qui figure parmi les {colonne} de la table {table}.` | `EXCEPT` + `SELECT {colonne}` + `FROM {table}` | requete |

- **SQL_SOUS_REQUETE_EXISTE** — Le `1` est exige par la syntaxe d'EXISTS, qui ignore la projection. Ce n'est pas un ajout implicite mais une obligation du langage, comme `String[] args` en Java ; une information passive le dit.

## Domaine 8 — Modification des donnees

**9 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Insère dans la table {table} une ligne dont {colonne} vaut {entier}.` | `INSERT INTO {table} ({colonne})` + `VALUES ({entier});` | fichier |
| `Insère dans la table {table} une ligne dont {colonne} vaut le texte "{texte}".` | `INSERT INTO {table} ({colonne})` + `VALUES ('{texte}');` | fichier |
| `Insère dans la table {table} une ligne dont {colonne} vaut {entier} et {colonne2} vaut le texte "{texte}".` | `INSERT INTO {table} ({colonne}, {colonne2})` + `VALUES ({entier}, '{texte}');` | fichier |
| `Insère dans la table {table} la colonne {colonne} lue dans la table {table2}.` | `INSERT INTO {table} ({colonne})` + `SELECT {colonne}` + `FROM {table2}` + `` + `;` | fichier, bloc |
| `Modifie la table {table} en donnant à {colonne} la valeur {entier} là où "{condition}".` | `UPDATE {table}` + `SET {colonne} = {entier}` + `WHERE {condition};` | fichier |
| `Modifie la table {table} en donnant à {colonne} le résultat de "{expression}" là où "{condition}".` | `UPDATE {table}` + `SET {colonne} = {expression}` + `WHERE {condition};` | fichier |
| `Modifie toutes les lignes de la table {table} en donnant à {colonne} la valeur {entier}.` | `UPDATE {table}` + `SET {colonne} = {entier};` | fichier |
| `Supprime de la table {table} les lignes où "{condition}".` | `DELETE FROM {table}` + `WHERE {condition};` | fichier |
| `Supprime toutes les lignes de la table {table}.` | `DELETE FROM {table};` | fichier |

- **SQL_MODIFIE_TOUTES** — La phrase doit DIRE « toutes les lignes ». A n'ajoute jamais de WHERE, et ne retire jamais celui qui manque : il exige que l'intention soit ecrite.

## Domaine 9 — Integrite, vues, index et transactions

**21 formulations.**

| Phrase française | SQL produit | Portée |
|---|---|---|
| `Fais de {colonne} la clé primaire de la table {table}, sous la contrainte nommée {contrainte}.` | `ALTER TABLE {table}` + `ADD CONSTRAINT {contrainte} PRIMARY KEY ({colonne});` | fichier |
| `Fais de {colonne} une clé étrangère de la table {table} vers {colonne2} de la table {table2}, sous la contrainte nommée {contrainte}.` | `ALTER TABLE {table}` + `ADD CONSTRAINT {contrainte} FOREIGN KEY ({colonne}) REFERENCES {table2} ({colonne2});` | fichier |
| `Exige que {colonne} de la table {table} ne soit jamais nulle.` | `ALTER TABLE {table}` + `ALTER COLUMN {colonne} SET NOT NULL;` | fichier |
| `Exige que {colonne} de la table {table} soit unique, sous la contrainte nommée {contrainte}.` | `ALTER TABLE {table}` + `ADD CONSTRAINT {contrainte} UNIQUE ({colonne});` | fichier |
| `Exige de la table {table} que "{condition}", sous la contrainte nommée {contrainte}.` | `ALTER TABLE {table}` + `ADD CONSTRAINT {contrainte} CHECK ({condition});` | fichier |
| `Donne à {colonne} de la table {table} la valeur par défaut {entier}.` | `ALTER TABLE {table}` + `ALTER COLUMN {colonne} SET DEFAULT {entier};` | fichier |
| `Fais de {colonne} de la table {table} une identité engendrée par défaut.` | `ALTER TABLE {table}` + `ALTER COLUMN {colonne} ADD GENERATED BY DEFAULT AS IDENTITY;` | fichier |
| `Supprime la contrainte {contrainte} de la table {table}.` | `ALTER TABLE {table}` + `DROP CONSTRAINT {contrainte};` | fichier |
| `Crée une vue nommée {vue} qui lit la colonne {colonne} de la table {table}.` | `CREATE VIEW {vue} AS` + `SELECT {colonne}` + `FROM {table}` + `` + `;` | fichier, bloc |
| `Supprime la vue {vue}.` | `DROP VIEW {vue};` | fichier |
| `Crée un index nommé {index} sur {colonne} de la table {table}.` | `CREATE INDEX {index} ON {table} ({colonne});` | fichier |
| `Supprime l’index {index}.` | `DROP INDEX {index};` | fichier |
| `Ouvre une transaction.` | `START TRANSACTION;` | fichier |
| `Valide la transaction.` | `COMMIT;` | fichier |
| `Annule la transaction.` | `ROLLBACK;` | fichier |
| `Pose un point de reprise nommé {point}.` | `SAVEPOINT {point};` | fichier |
| `Reviens au point de reprise {point}.` | `ROLLBACK TO SAVEPOINT {point};` | fichier |
| `Crée un rôle nommé {role}.` | `CREATE ROLE {role};` | fichier |
| `Accorde la lecture de la table {table} au rôle {role}.` | `GRANT SELECT ON {table} TO {role};` | fichier |
| `Accorde l’insertion dans la table {table} au rôle {role}.` | `GRANT INSERT ON {table} TO {role};` | fichier |
| `Retire la lecture de la table {table} au rôle {role}.` | `REVOKE SELECT ON {table} FROM {role};` | fichier |

- **SQL_CLE_PRIMAIRE** — Le nom de la contrainte est EXIGE. Sans lui, c'est le serveur qui en invente un, et un nom invente ne peut pas etre cite dans une phrase de suppression.
- **SQL_IDENTITE** — Forme STANDARD ; `serial` est une extension de PostgreSQL, refusee nommement. DEFAUT TROUVE PAR EXECUTION le 19 novembre 2026 : PostgreSQL refuse cette instruction si la colonne n est pas DEJA declaree NOT NULL -- « column "id" of relation "eleves" must be declared NOT NULL before identity can be added ». L ordre des deux instructions compte donc, et A ne pose PAS le NOT NULL a votre place : il l explique, par SQL_IDENTITE_EXIGE_NON_NUL. C est le traitement decide pour les exceptions verifiees de Java, transpose.
- **SQL_INDEX_CREE** — CREATE INDEX n'est PAS dans le SQL standard, et c'est assume : aucune base reelle ne s'en passe, et le domaine 9 l'enseigne. Une information passive le dira.
- **SQL_TRANSACTION_OUVRE** — Forme STANDARD. `BEGIN` est l'usage de PostgreSQL et sera refusee nommement.

## Refus de dialecte nommés

Chacun désigne la forme standard qui enseigne la même compétence.

| Code | Sujet | Raison |
|---|---|---|
| `SQL_LIMIT_NON_STANDARD` | `LIMIT n` | `LIMIT` est une extension de PostgreSQL. La forme standard est `FETCH FIRST n ROWS ONLY`, et c'est elle que SQL-A ecrit : « Ne garde que les {n} premieres lignes. » |
| `SQL_SERIAL_NON_STANDARD` | `serial` | `serial` est une extension de PostgreSQL. La forme standard est `GENERATED BY DEFAULT AS IDENTITY`, ecrite par « Fais de {colonne} ... une identite engendree par defaut. » |
| `SQL_CAST_ABREGE` | `x::type` | `::` est propre a PostgreSQL. La forme standard est `CAST(x AS type)`. |
| `SQL_ILIKE` | `ILIKE` | `ILIKE` est propre a PostgreSQL. En SQL standard, on compare `LOWER(colonne)` a un motif en minuscules. |
| `SQL_RETURNING` | `RETURNING` | `RETURNING` est propre a PostgreSQL : une modification n'y renvoie pas de lignes en SQL standard. |
| `SQL_ON_CONFLICT` | `ON CONFLICT` | `ON CONFLICT` est propre a PostgreSQL ; l'equivalent standard, `MERGE`, n'est pas au catalogue du modele 1. |
| `SQL_TYPE_TEXT` | `text` | `text` n'est pas un type du SQL standard. `varchar(n)` l'est, et la longueur fait partie de ce qu'il faut decider. |
| `SQL_BEGIN` | `BEGIN` | `BEGIN` ouvre une transaction dans PostgreSQL, mais en SQL standard c'est `START TRANSACTION` ; `BEGIN` y ouvre un bloc de code. |
| `SQL_FENETRE` | `fonctions de fenetrage` | `OVER (PARTITION BY ...)` n'est pas au catalogue du modele 1 : c'est une notion du niveau suivant, et l'annoncer serait promettre ce qui n'est pas livre. |
| `SQL_RECURSIF` | `WITH RECURSIVE` | Une expression de table recursive n'est pas au catalogue du modele 1. |
| `SQL_PROCEDURAL` | `PL/pgSQL, declencheurs, procedures` | Un langage procedural dans la base sort du SQL : c'est un autre langage cible, et il n'est pas livre. |
| `SQL_META_PSQL` | `commandes de psql (\dt, \d)` | Les commandes a antislash appartiennent au client `psql`, pas au langage SQL : elles ne s'ecrivent pas dans un fichier de script portable. |

## Informations pédagogiques passives

Elles n’incrémentent **jamais** le compteur d’avertissements.

**`SQL_IDENTIFIANT_REPLIE`** — *repliement de la casse*

Un identifiant non entoure de guillemets n'est pas lu tel quel : PostgreSQL le replie en MINUSCULES, le SQL standard en MAJUSCULES. `Eleves`, `eleves` et `ELEVES` designent donc la meme table, alors que `"Eleves"` en designe une autre. SQL-A ecrit l'identifiant tel que vous l'avez donne et ne le met jamais entre guillemets.

**`SQL_AUCUNE_VERIFICATION`** — *symboles et types*

SQL-A ne sait pas si cette table, cette colonne ou ce role existent, ni de quel type ils sont. Une instruction acceptee n'est pas une instruction qui s'executera.

**`SQL_MODIFICATION_SANS_FILTRE`** — *UPDATE et DELETE*

Cette instruction touche TOUTES les lignes de la table. C'est ce que votre phrase a demande, et SQL-A n'ajoutera jamais de filtre a votre place : un WHERE invente changerait le sens de votre ordre.

**`SQL_NUL_NEST_PAS_UNE_VALEUR`** — *NULL*

NULL n'est pas une valeur mais une absence : `colonne = NULL` n'est jamais vrai, meme quand la colonne est nulle. C'est pourquoi « est nulle » a sa propre phrase, qui ecrit `IS NULL`.

**`SQL_COMPTE_ETOILE`** — *COUNT(*) et COUNT(colonne)*

`COUNT(*)` compte les lignes ; `COUNT(colonne)` compte les lignes dont cette colonne n'est pas nulle. Les deux chiffres different des que la colonne admet des nuls, et c'est pourquoi les deux ont leur phrase.

**`SQL_PRIORITE_ET_OU`** — *AND et OR*

AND lie plus fort que OR : `a OR b AND c` se lit `a OR (b AND c)`. SQL-A n'ajoute aucune parenthese que vous n'avez pas demandee.

**`SQL_PRODUIT_CARTESIEN`** — *CROSS JOIN*

Une jointure sans condition associe chaque ligne de gauche a chaque ligne de droite : 1 000 lignes de chaque cote en font un million. C'est une construction legitime, et ce n'est presque jamais ce que l'on voulait.

**`SQL_EXISTE_IGNORE_LA_PROJECTION`** — *EXISTS*

EXISTS ne regarde pas CE QUE la sous-requete lit, seulement s'il en sort au moins une ligne. Le `SELECT 1` ecrit ici n'est pas un choix de SQL-A : la syntaxe exige une projection, et `1` est la moins trompeuse.

**`SQL_ORDRE_NON_GARANTI`** — *absence d'ORDER BY*

Sans ORDER BY, l'ordre des lignes n'est pas defini. Il peut sembler stable pendant des mois puis changer : rien ne le promet.

**`SQL_GROUPE_EXIGE_LA_PROJECTION`** — *GROUP BY*

Une colonne lue sans agregat doit figurer dans le GROUP BY. SQL-A ne verifie pas cette regle et ne l'ajoutera pas : c'est le serveur qui refusera, et c'est a vous de l'ecrire.

**`SQL_INDEX_HORS_STANDARD`** — *CREATE INDEX*

CREATE INDEX ne fait pas partie du SQL standard, bien qu'aucune base reelle ne s'en passe. La syntaxe ecrite ici est celle que PostgreSQL accepte.

**`SQL_TRANSACTION_NON_FERMEE`** — *transactions*

Une transaction ouverte et jamais validee ni annulee laisse ses verrous en place. SQL-A n'ajoute ni COMMIT ni ROLLBACK a votre place.

**`SQL_DROIT_CUMULATIF`** — *GRANT*

Un droit accorde s'ajoute a ceux qui existent deja ; il ne les remplace pas. Lire les droits en vigueur demande d'interroger le catalogue de la base, ce que SQL-A ne fait pas.

**`SQL_IDENTITE_EXIGE_NON_NUL`** — *identite engendree*

Cette instruction echouera si la colonne n est pas deja declaree NOT NULL : PostgreSQL l exige avant d ajouter une identite. Il faut donc ecrire d abord « Exige que {colonne} de la table {table} ne soit jamais nulle. ». SQL-A ne l ajoute pas a votre place : l ordre de vos instructions vous appartient.

## Les 84 intentions du catalogue partagé

**0 reprises, 0 adaptations, 84 refus** regroupés en **10** raisons.

### `SQL_PAS_DE_VARIABLE` — 11 intentions

Le SQL standard n'a pas de variable : il n'y a rien a declarer ni a affecter en dehors d'une ligne de table. Ce que cette intention veut dire se dit en SQL avec une COLONNE — que l'on cree par « Ajoute a la table ... une colonne ... » — et une affectation de variable devient un UPDATE, qui touche des lignes et non une case memoire.

`ASSIGN_CHAR` `ASSIGN_EXPRESSION` `ASSIGN_INT` `CONST_DECL` `DECL_CHAR` `DECL_INT` `INIT_CHAR` `INIT_INT` `NUMERIC_ASSIGN` `NUMERIC_DECL` `NUMERIC_INIT`

### `SQL_PAS_DE_FLOT_DE_CONTROLE` — 13 intentions

Le SQL standard est declaratif : on decrit l'ensemble de lignes voulu, et le serveur choisit comment l'obtenir. Il n'y a ni boucle ni branchement a ecrire. Un test devient un PREDICAT — « Ne garde que les lignes ou ... » —, et une repetition devient le fait meme qu'une instruction porte sur toutes les lignes a la fois.

`BREAK` `BREAK_SWITCH` `CASE_CHAR` `CASE_DEFAULT` `CASE_INT` `CONTINUE` `DO_WHILE` `ELSE` `ELSE_IF` `FOR` `IF` `SWITCH` `WHILE`

### `SQL_PAS_DE_FONCTION` — 10 intentions

Definir une fonction, retourner une valeur ou appeler un sous-programme releve d'un langage procedural dans la base — PL/pgSQL par exemple —, pas du SQL. Ce langage-la n'est pas une cible du modele 1, et le dire est plus honnete que de rendre une approximation.

`CALL` `CALL_ASSIGN` `FUNC_DEF` `FUNC_PROTOTYPE` `LINKAGE_DECL` `MAIN` `RETURN` `RETURN_EXPRESSION` `RETURN_INT` `RETURN_NUMERIC`

### `SQL_PAS_D_AFFICHAGE` — 12 intentions

Une instruction SQL ne fait rien afficher : elle renvoie un ensemble de lignes, et c'est le client — psql, un tableur, un programme — qui decide de la facon de le montrer. Lire des donnees se dit « Cree une requete qui lit ... » ; le format d'affichage n'appartient pas au langage.

`ARRAY_PRINT` `ARRAY_PRINT_CHAR` `MEMBER_PRINT` `NUMERIC_PRINT` `PRINT_CHAR` `PRINT_FORMATTED` `PRINT_INT` `PRINT_NEWLINE` `PRINT_POINTED` `PRINT_STRING` `PRINT_TEXT` `SIZEOF_PRINT`

### `SQL_PAS_DE_FICHIER` — 8 intentions

Ouvrir, lire et fermer un fichier est une operation du systeme, et le SQL standard n'en a pas. Les donnees vivent dans des tables ; les y faire entrer se dit INSERT, et les importer d'un fichier releve d'un outil du serveur, non du langage.

`FILE_AT_END` `FILE_CLOSE` `FILE_DECL` `FILE_OPEN` `FILE_READ_INT` `FILE_READ_STRING` `FILE_WRITE_INT` `FILE_WRITE_TEXT`

### `SQL_PAS_DE_MEMOIRE_EXPLICITE` — 10 intentions

Il n'y a ni adresse, ni pointeur, ni allocation a liberer : la gestion de la memoire appartient entierement au serveur. Ce qui s'en rapproche le plus — designer une ligne precise — se fait par une CLE, qui est une donnee, pas une adresse.

`ALLOCATE` `ASSIGN_ADDRESS` `ASSIGN_POINTED_EXPRESSION` `ASSIGN_POINTED_INT` `DECL_POINTER` `FREE` `INIT_POINTER` `REALLOCATE` `SIZEOF_ASSIGN` `STRUCT_POINTER`

### `SQL_PAS_DE_PREPROCESSEUR` — 7 intentions

Il n'y a pas de phase de preprocesseur : rien n'est inclus, et aucune garde ne protege d'une double inclusion. Un script SQL joue ses instructions dans l'ordre, et se proteger d'un rejeu se fait par une transaction ou par une contrainte, pas par une directive.

`GUARD_CLOSE` `GUARD_OPEN` `INCLUDE_ASSERT` `INCLUDE_LIMITS` `INCLUDE_LOCAL` `INCLUDE_STDIO` `INCLUDE_STDLIB`

### `SQL_LA_TABLE_N_EST_PAS_UNE_STRUCTURE` — 11 intentions

C'est le refus qui demande le plus d'attention, parce que la ressemblance est trompeuse. Une structure est un TYPE : elle decrit la forme d'une valeur, et une variable de ce type contient UNE valeur. Une table est une RELATION : elle contient un ensemble de lignes, sans ordre et sans compte fixe. Rendre « Declare une structure » par CREATE TABLE enseignerait la confusion exacte qui fait ensuite ecrire des boucles sur une base de donnees. Les tables ont donc leurs propres phrases.

`ARRAY_ASSIGN_CHAR` `ARRAY_ASSIGN_EXPRESSION` `ARRAY_ASSIGN_INT` `ARRAY_DECL` `MEMBER_ASSIGN_CHAR` `MEMBER_ASSIGN_EXPRESSION` `MEMBER_ASSIGN_INT` `STRING_INIT` `STRUCT_DECL` `STRUCT_FIELD` `STRUCT_VAR`

### `SQL_PAS_D_ASSERTION` — 1 intentions

Il n'y a pas d'assertion qui arrete un script. Ce qui en tient le role est une CONTRAINTE — CHECK, NOT NULL, UNIQUE —, et la difference compte : une assertion verifie une fois, au passage ; une contrainte est verifiee a chaque ecriture, pour toujours, par le serveur.

`ASSERT`

### `SQL_SYNONYME_DE_TYPE_A_SA_PHRASE` — 1 intentions

C'est la seule intention du catalogue partage qui ait un equivalent reel : CREATE DOMAIN. Elle est pourtant refusee, parce que sa phrase francaise parle d'un synonyme de type du C et de ses specificateurs, qui n'ont pas de sens ici. Le domaine SQL a donc sa propre phrase, et une seule chose se perd : l'illusion qu'une phrase pouvait servir deux fois.

`TYPE_ALIAS`

