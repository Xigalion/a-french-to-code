# Catalogue SQL-A

> **Engendré depuis le moteur** par `node scripts/catalogue-sql-public.mjs --markdown`.
> Chaque ligne sort de `analyserCatalogueSql` puis de `rendreSqlNatif` ; rien n’y est écrit
> de mémoire, et un test compare ce document à la spécification approuvée.

SQL-A traduit une phrase française en **une** instruction SQL, ou en **une clause** d’une
requête ouverte. Dialecte de référence : **PostgreSQL 18**, avec **priorité au SQL standard**.

**SQL-A n’exécute jamais rien.** Il écrit dans votre fichier, et c’est vous qui lancez le
script contre la base de votre choix.

| | |
|---|---|
| formulations | **93** |
| intentions du catalogue partagé portées | **0** — SQL-A est entièrement natif |
| intentions refusées, avec leur raison | **84** en **10** raisons |
| informations pédagogiques passives | **17** |
| portées de placement | **3** : fichier, requête, projection |

## Domaine 1 — Fondamentaux : tables, colonnes et types

**13 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Crée une table nommée eleves avec une colonne entière nommée id.` | `CREATE TABLE eleves (` + `  id integer` + `);` |
| `Ajoute à la table eleves une colonne entière nommée age.` | `ALTER TABLE eleves ADD COLUMN age integer;` |
| `Ajoute à la table eleves une colonne de texte nommée nom de longueur 50.` | `ALTER TABLE eleves ADD COLUMN nom varchar(50);` |
| `Ajoute à la table notes une colonne décimale nommée valeur de précision 4 et d’échelle 2.` | `ALTER TABLE notes ADD COLUMN valeur numeric(4, 2);` |
| `Ajoute à la table eleves une colonne booléenne nommée actif.` | `ALTER TABLE eleves ADD COLUMN actif boolean;` |
| `Ajoute à la table emprunts une colonne de date nommée pris.` | `ALTER TABLE emprunts ADD COLUMN pris date;` |
| `Ajoute à la table emprunts une colonne d’horodatage nommée cree.` | `ALTER TABLE emprunts ADD COLUMN cree timestamp;` |
| `Renomme la colonne nom de la table eleves en nom_complet.` | `ALTER TABLE eleves RENAME COLUMN nom TO nom_complet;` |
| `Supprime la colonne actif de la table eleves.` | `ALTER TABLE eleves DROP COLUMN actif;` |
| `Supprime la table eleves.` | `DROP TABLE eleves;` |
| `Renomme la table eleves en etudiants.` | `ALTER TABLE eleves RENAME TO etudiants;` |
| `Crée un domaine nommé note fondé sur le type entier.` | `CREATE DOMAIN note AS integer;` |
| `Crée un schéma nommé ecole.` | `CREATE SCHEMA ecole;` |

## Domaine 2 — Interrogation et projection

**8 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Crée une requête qui lit la colonne nom de la table eleves.` | `SELECT nom` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit les colonnes nom et age de la table eleves.` | `SELECT nom` + `     , age` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit toutes les colonnes de la table eleves.` | `SELECT *` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit les valeurs distinctes de la colonne ville de la table eleves.` | `SELECT DISTINCT ville` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit la colonne nom de la table eleves sous le nom intitule.` | `SELECT nom AS intitule` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit le résultat de "age + 1" de la table eleves sous le nom futur.` | `SELECT (age + 1) AS futur` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit la colonne e.nom de la table eleves désignée par e.` | `SELECT e.nom` + `FROM eleves AS e` + `` + `;` |
| `Lis aussi la colonne age.` | `     , age` |

## Domaine 3 — Filtrage des lignes

**10 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Ne garde que les lignes où "age > 18".` | `WHERE age > 18` |
| `Ne garde que les lignes où rendu est nulle.` | `WHERE rendu IS NULL` |
| `Ne garde que les lignes où rendu n’est pas nulle.` | `WHERE rendu IS NOT NULL` |
| `Ne garde que les lignes où ville vaut le texte "Lyon".` | `WHERE ville = 'Lyon'` |
| `Ne garde que les lignes où nom commence par "O".` | `WHERE nom LIKE 'O%'` |
| `Ne garde que les lignes où nom contient "ie".` | `WHERE nom LIKE '%ie%'` |
| `Ne garde que les lignes où age est comprise entre 15 et 20.` | `WHERE age BETWEEN 15 AND 20` |
| `Ne garde que les lignes où age vaut 15 ou 20.` | `WHERE age IN (15, 20)` |
| `Exige aussi que "age < 30".` | `  AND age < 30` |
| `Accepte aussi les lignes où "age > 60".` | `   OR age > 60` |

## Domaine 4 — Tri et limitation

**6 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Ordonne les lignes par nom en ordre croissant.` | `ORDER BY nom ASC` |
| `Ordonne les lignes par age en ordre décroissant.` | `ORDER BY age DESC` |
| `Ordonne ensuite les lignes par nom en ordre croissant.` | `        , nom ASC` |
| `Place les valeurs nulles en dernier.` | `        NULLS LAST` |
| `Ne garde que les 3 premières lignes.` | `FETCH FIRST 3 ROWS ONLY` |
| `Ignore les 2 premières lignes.` | `OFFSET 2 ROWS` |

## Domaine 5 — Agregats et regroupement

**11 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Crée une requête qui compte les lignes de la table eleves.` | `SELECT COUNT(*)` + `FROM eleves` + `` + `;` |
| `Crée une requête qui compte les valeurs non nulles de la colonne rendu de la table emprunts.` | `SELECT COUNT(rendu)` + `FROM emprunts` + `` + `;` |
| `Crée une requête qui somme la colonne age de la table eleves.` | `SELECT SUM(age)` + `FROM eleves` + `` + `;` |
| `Crée une requête qui calcule la moyenne de la colonne age de la table eleves.` | `SELECT AVG(age)` + `FROM eleves` + `` + `;` |
| `Crée une requête qui cherche la plus petite valeur de la colonne age de la table eleves.` | `SELECT MIN(age)` + `FROM eleves` + `` + `;` |
| `Crée une requête qui cherche la plus grande valeur de la colonne age de la table eleves.` | `SELECT MAX(age)` + `FROM eleves` + `` + `;` |
| `Crée une requête qui lit la colonne ville et le nombre de lignes de la table eleves.` | `SELECT ville` + `     , COUNT(*)` + `FROM eleves` + `` + `;` |
| `Regroupe les lignes par ville.` | `GROUP BY ville` |
| `Regroupe ensuite les lignes par age.` | `       , age` |
| `Ne garde que les groupes où "age > 18".` | `HAVING age > 18` |
| `Ne garde que les groupes de plus de 1 lignes.` | `HAVING COUNT(*) > 1` |

## Domaine 6 — Jointures

**6 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Joins la table emprunts sur "emprunts.eleve = eleves.id".` | `INNER JOIN emprunts ON emprunts.eleve = eleves.id` |
| `Joins la table emprunts désignée par m sur "m.eleve = eleves.id".` | `INNER JOIN emprunts AS m ON m.eleve = eleves.id` |
| `Joins la table emprunts en gardant toutes les lignes de gauche sur "emprunts.eleve = eleves.id".` | `LEFT OUTER JOIN emprunts ON emprunts.eleve = eleves.id` |
| `Joins la table emprunts en gardant toutes les lignes de droite sur "emprunts.eleve = eleves.id".` | `RIGHT OUTER JOIN emprunts ON emprunts.eleve = eleves.id` |
| `Joins la table emprunts en gardant toutes les lignes des deux côtés sur "emprunts.eleve = eleves.id".` | `FULL OUTER JOIN emprunts ON emprunts.eleve = eleves.id` |
| `Joins la table villes sans condition.` | `CROSS JOIN villes` |

## Domaine 7 — Sous-requetes, expressions de table et ensembles

**7 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Ne garde que les lignes où id figure parmi les eleve de la table emprunts.` | `WHERE id IN (` + `        SELECT eleve` + `        FROM emprunts` + `      )` |
| `Ne garde que les lignes pour lesquelles il existe une ligne de la table emprunts où "emprunts.eleve = eleves.id".` | `WHERE EXISTS (` + `        SELECT 1` + `        FROM emprunts` + `        WHERE emprunts.eleve = eleves.id` + `      )` |
| `Crée une requête fondée sur l’expression de table nommée majeurs qui lit la colonne id de la table eleves.` | `WITH majeurs AS (` + `  SELECT id` + `  FROM eleves` + `)` + `SELECT id` + `FROM majeurs` + `` + `;` |
| `Ajoute sans doublon les nom de la table anciens.` | `UNION` + `SELECT nom` + `FROM anciens` |
| `Ajoute avec les doublons les nom de la table anciens.` | `UNION ALL` + `SELECT nom` + `FROM anciens` |
| `Ne garde que ce qui figure aussi parmi les nom de la table anciens.` | `INTERSECT` + `SELECT nom` + `FROM anciens` |
| `Retire ce qui figure parmi les nom de la table anciens.` | `EXCEPT` + `SELECT nom` + `FROM anciens` |

## Domaine 8 — Modification des donnees

**11 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Insère dans la table eleves une ligne dont id vaut 1.` | `INSERT INTO eleves (id)` + `VALUES (1);` |
| `Insère dans la table eleves une ligne dont nom vaut le texte "Zoe".` | `INSERT INTO eleves (nom)` + `VALUES ('Zoe');` |
| `Insère dans la table emprunts une ligne dont id vaut 1 et lecteur vaut 2.` | `INSERT INTO emprunts (id, lecteur)` + `VALUES (1, 2);` |
| `Insère dans la table eleves une ligne dont id vaut 1 et nom vaut le texte "Zoe".` | `INSERT INTO eleves (id, nom)` + `VALUES (1, 'Zoe');` |
| `Insère dans la table anciens la colonne nom lue dans la table eleves.` | `INSERT INTO anciens (nom)` + `SELECT nom` + `FROM eleves` + `` + `;` |
| `Modifie la table eleves en donnant à nom le texte "Ada" là où "id = 1".` | `UPDATE eleves` + `SET nom = 'Ada'` + `WHERE id = 1;` |
| `Modifie la table eleves en donnant à age la valeur 21 là où "id = 1".` | `UPDATE eleves` + `SET age = 21` + `WHERE id = 1;` |
| `Modifie la table eleves en donnant à age le résultat de "age + 1" là où "id = 1".` | `UPDATE eleves` + `SET age = (age + 1)` + `WHERE id = 1;` |
| `Modifie toutes les lignes de la table eleves en donnant à age la valeur 0.` | `UPDATE eleves` + `SET age = 0;` |
| `Supprime de la table eleves les lignes où "age < 10".` | `DELETE FROM eleves` + `WHERE age < 10;` |
| `Supprime toutes les lignes de la table eleves.` | `DELETE FROM eleves;` |

## Domaine 9 — Integrite, vues, index et transactions

**21 formulations.**

| Phrase française | SQL produit |
|---|---|
| `Fais de id la clé primaire de la table eleves, sous la contrainte nommée pk_eleves.` | `ALTER TABLE eleves` + `ADD CONSTRAINT pk_eleves PRIMARY KEY (id);` |
| `Fais de eleve une clé étrangère de la table emprunts vers id de la table eleves, sous la contrainte nommée fk_emprunts.` | `ALTER TABLE emprunts` + `ADD CONSTRAINT fk_emprunts FOREIGN KEY (eleve) REFERENCES eleves (id);` |
| `Exige que id de la table eleves ne soit jamais nulle.` | `ALTER TABLE eleves` + `ALTER COLUMN id SET NOT NULL;` |
| `Exige que nom de la table eleves soit unique, sous la contrainte nommée uq_eleves_nom.` | `ALTER TABLE eleves` + `ADD CONSTRAINT uq_eleves_nom UNIQUE (nom);` |
| `Exige de la table eleves que "age >= 0", sous la contrainte nommée ck_eleves_age.` | `ALTER TABLE eleves` + `ADD CONSTRAINT ck_eleves_age CHECK (age >= 0);` |
| `Donne à age de la table eleves la valeur par défaut 0.` | `ALTER TABLE eleves` + `ALTER COLUMN age SET DEFAULT 0;` |
| `Fais de id de la table eleves une identité engendrée par défaut.` | `ALTER TABLE eleves` + `ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY;` |
| `Supprime la contrainte pk_eleves de la table eleves.` | `ALTER TABLE eleves` + `DROP CONSTRAINT pk_eleves;` |
| `Crée une vue nommée noms qui lit la colonne nom de la table eleves.` | `CREATE VIEW noms AS` + `SELECT nom` + `FROM eleves` + `` + `;` |
| `Supprime la vue noms.` | `DROP VIEW noms;` |
| `Crée un index nommé ix_eleves_nom sur nom de la table eleves.` | `CREATE INDEX ix_eleves_nom ON eleves (nom);` |
| `Supprime l’index ix_eleves_nom.` | `DROP INDEX ix_eleves_nom;` |
| `Ouvre une transaction.` | `START TRANSACTION;` |
| `Valide la transaction.` | `COMMIT;` |
| `Annule la transaction.` | `ROLLBACK;` |
| `Pose un point de reprise nommé avant_purge.` | `SAVEPOINT avant_purge;` |
| `Reviens au point de reprise avant_purge.` | `ROLLBACK TO SAVEPOINT avant_purge;` |
| `Crée un rôle nommé lecteur.` | `CREATE ROLE lecteur;` |
| `Accorde la lecture de la table eleves au rôle lecteur.` | `GRANT SELECT ON eleves TO lecteur;` |
| `Accorde l’insertion dans la table eleves au rôle lecteur.` | `GRANT INSERT ON eleves TO lecteur;` |
| `Retire la lecture de la table eleves au rôle lecteur.` | `REVOKE SELECT ON eleves FROM lecteur;` |

## Les 84 intentions du catalogue partagé, et pourquoi aucune ne passe

### 11 intentions

Le SQL standard n’a pas de variable : il n’y a rien à déclarer ni à affecter en dehors d’une ligne de table. Ce que cette intention veut dire se dit en SQL avec une COLONNE — « Ajoute à la table … une colonne … » — et une affectation de variable devient un UPDATE, qui touche des lignes et non une case mémoire.

`ASSIGN_CHAR` `ASSIGN_EXPRESSION` `ASSIGN_INT` `CONST_DECL` `DECL_CHAR` `DECL_INT` `INIT_CHAR` `INIT_INT` `NUMERIC_ASSIGN` `NUMERIC_DECL` `NUMERIC_INIT`

### 13 intentions

Le SQL standard est déclaratif : on décrit l’ensemble de lignes voulu, et le serveur choisit comment l’obtenir. Il n’y a ni boucle ni branchement à écrire. Un test devient un PRÉDICAT — « Ne garde que les lignes où … » —, et une répétition devient le fait même qu’une instruction porte sur toutes les lignes à la fois.

`BREAK` `BREAK_SWITCH` `CASE_CHAR` `CASE_DEFAULT` `CASE_INT` `CONTINUE` `DO_WHILE` `ELSE` `ELSE_IF` `FOR` `IF` `SWITCH` `WHILE`

### 10 intentions

Définir une fonction, retourner une valeur ou appeler un sous-programme relève d’un langage procédural dans la base — PL/pgSQL par exemple —, pas du SQL. Ce langage-là n’est pas une cible du modèle 1, et le dire est plus honnête que de rendre une approximation.

`CALL` `CALL_ASSIGN` `FUNC_DEF` `FUNC_PROTOTYPE` `LINKAGE_DECL` `MAIN` `RETURN` `RETURN_EXPRESSION` `RETURN_INT` `RETURN_NUMERIC`

### 12 intentions

Une instruction SQL ne fait rien afficher : elle renvoie un ensemble de lignes, et c’est le client — psql, un tableur, un programme — qui décide de la façon de le montrer. Lire des données se dit « Crée une requête qui lit … » ; le format d’affichage n’appartient pas au langage.

`ARRAY_PRINT` `ARRAY_PRINT_CHAR` `MEMBER_PRINT` `NUMERIC_PRINT` `PRINT_CHAR` `PRINT_FORMATTED` `PRINT_INT` `PRINT_NEWLINE` `PRINT_POINTED` `PRINT_STRING` `PRINT_TEXT` `SIZEOF_PRINT`

### 8 intentions

Ouvrir, lire et fermer un fichier est une opération du système, et le SQL standard n’en a pas. Les données vivent dans des tables ; les y faire entrer se dit INSERT, et les importer d’un fichier relève d’un outil du serveur, non du langage.

`FILE_AT_END` `FILE_CLOSE` `FILE_DECL` `FILE_OPEN` `FILE_READ_INT` `FILE_READ_STRING` `FILE_WRITE_INT` `FILE_WRITE_TEXT`

### 10 intentions

Il n’y a ni adresse, ni pointeur, ni allocation à libérer : la gestion de la mémoire appartient entièrement au serveur. Ce qui s’en rapproche le plus — désigner une ligne précise — se fait par une CLÉ, qui est une donnée, pas une adresse.

`ALLOCATE` `ASSIGN_ADDRESS` `ASSIGN_POINTED_EXPRESSION` `ASSIGN_POINTED_INT` `DECL_POINTER` `FREE` `INIT_POINTER` `REALLOCATE` `SIZEOF_ASSIGN` `STRUCT_POINTER`

### 7 intentions

Il n’y a pas de phase de préprocesseur : rien n’est inclus, et aucune garde ne protège d’une double inclusion. Un script SQL joue ses instructions dans l’ordre, et se protéger d’un rejeu se fait par une transaction ou par une contrainte, pas par une directive.

`GUARD_CLOSE` `GUARD_OPEN` `INCLUDE_ASSERT` `INCLUDE_LIMITS` `INCLUDE_LOCAL` `INCLUDE_STDIO` `INCLUDE_STDLIB`

### 11 intentions

C’est le refus qui demande le plus d’attention, parce que la ressemblance est trompeuse. Une structure est un TYPE : elle décrit la forme d’une valeur, et une variable de ce type contient UNE valeur. Une table est une RELATION : elle contient un ensemble de lignes, sans ordre et sans compte fixe. Rendre « Déclare une structure » par CREATE TABLE enseignerait la confusion exacte qui fait ensuite écrire des boucles sur une base de données. Les tables ont donc leurs propres phrases.

`ARRAY_ASSIGN_CHAR` `ARRAY_ASSIGN_EXPRESSION` `ARRAY_ASSIGN_INT` `ARRAY_DECL` `MEMBER_ASSIGN_CHAR` `MEMBER_ASSIGN_EXPRESSION` `MEMBER_ASSIGN_INT` `STRING_INIT` `STRUCT_DECL` `STRUCT_FIELD` `STRUCT_VAR`

### 1 intentions

Il n’y a pas d’assertion qui arrête un script. Ce qui en tient le rôle est une CONTRAINTE — CHECK, NOT NULL, UNIQUE —, et la différence compte : une assertion vérifie une fois, au passage ; une contrainte est vérifiée à chaque écriture, pour toujours, par le serveur.

`ASSERT`

### 1 intentions

C’est la seule intention du catalogue partagé qui ait un équivalent réel : CREATE DOMAIN. Elle est pourtant refusée, parce que sa phrase française parle d’un synonyme de type du C et de ses spécificateurs, qui n’ont pas de sens ici. Le domaine SQL a donc sa propre phrase, « Crée un domaine nommé … fondé sur le type entier. », et une seule chose se perd : l’illusion qu’une phrase pouvait servir deux fois.

`TYPE_ALIAS`

## Refus de dialecte

Chacun nomme la forme **standard** qui enseigne la même compétence.

| Sujet | Raison |
|---|---|
| `LIMIT n` | `LIMIT` est une extension de PostgreSQL. La forme standard est `FETCH FIRST n ROWS ONLY`, et c'est elle que SQL-A ecrit : « Ne garde que les {n} premieres lignes. » |
| `serial` | `serial` est une extension de PostgreSQL. La forme standard est `GENERATED BY DEFAULT AS IDENTITY`, ecrite par « Fais de {colonne} ... une identite engendree par defaut. » |
| `x::type` | `::` est propre a PostgreSQL. La forme standard est `CAST(x AS type)`. |
| `ILIKE` | `ILIKE` est propre a PostgreSQL. En SQL standard, on compare `LOWER(colonne)` a un motif en minuscules. |
| `RETURNING` | `RETURNING` est propre a PostgreSQL : une modification n'y renvoie pas de lignes en SQL standard. |
| `ON CONFLICT` | `ON CONFLICT` est propre a PostgreSQL ; l'equivalent standard, `MERGE`, n'est pas au catalogue du modele 1. |
| `text` | `text` n'est pas un type du SQL standard. `varchar(n)` l'est, et la longueur fait partie de ce qu'il faut decider. |
| `BEGIN` | `BEGIN` ouvre une transaction dans PostgreSQL, mais en SQL standard c'est `START TRANSACTION` ; `BEGIN` y ouvre un bloc de code. |
| `fonctions de fenetrage` | `OVER (PARTITION BY ...)` n'est pas au catalogue du modele 1 : c'est une notion du niveau suivant, et l'annoncer serait promettre ce qui n'est pas livre. |
| `WITH RECURSIVE` | Une expression de table recursive n'est pas au catalogue du modele 1. |
| `PL/pgSQL, declencheurs, procedures` | Un langage procedural dans la base sort du SQL : c'est un autre langage cible, et il n'est pas livre. |
| `commandes de psql (\dt, \d)` | Les commandes a antislash appartiennent au client `psql`, pas au langage SQL : elles ne s'ecrivent pas dans un fichier de script portable. |

