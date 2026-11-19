# Les 84 intentions du catalogue partagé, face à SQL

> **Engendré** par `node scripts/catalogue-sql.mjs --markdown` depuis
> `classement-sql.json`. Les listes sont **confrontées aux genres que le
> moteur publie** : un genre oublié ou inventé fait échouer la commande.

> Rien n’est implémenté. C’est une proposition.

## Le compte

| | |
|---|---|
| genres publiés par le moteur | **84** |
| repris tels quels | **0** |
| adaptés | **0** |
| refusés | **84** |
| raisons distinctes | **10** |

Pour comparaison, mesuré sur le moteur : **C17 84**, **Java 57**,
**Python 33**, **SQL 0**. La pente ne s’arrête pas à SQL par hasard — elle
suit la distance au langage pour lequel le catalogue a été conçu.

## Les raisons, et les intentions qu’elles couvrent

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

