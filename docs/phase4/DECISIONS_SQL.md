# Les onze décisions de la phase 4 — S1 à S11

**19 novembre 2026.** Rien n'est implémenté, et rien ne doit l'être avant que
ces onze décisions soient tranchées.

Le décompte est donné une fois : la série va de **S1 à S11**, soit **onze**
décisions. *(La phase 3 avait annoncé « onze lots » pour J0 à J11, qui en fait
douze : une borne comptée sur deux. Le piège est évité ici en nommant la série
plutôt qu'en comptant un intervalle.)*

Cinq orientations sont déjà **approuvées** par le fondateur le 19 novembre
2026 : PostgreSQL comme dialecte de référence avec priorité au standard, un
moteur **natif** sans transposition artificielle, un **profil SQL** du noyau
d'expressions avec préservation intégrale des trois autres langages, la
construction **progressive par insertion pure**, et l'échappement des
apostrophes. Les décisions ci-dessous précisent ce que ces orientations
impliquent, et tranchent ce qu'elles laissent ouvert.

---

## Le tableau complet

| # | Question à trancher | Options | Recommandation | Conséquences pédagogiques | Conséquences techniques |
|---|---|---|---|---|---|
| **S1** | Faut-il porter des intentions du catalogue partagé vers SQL ? | **(a)** aucune, SQL-A entièrement natif · **(b)** porter `STRUCT_DECL`→`CREATE TABLE`, `STRUCT_FIELD`→colonne, `TYPE_ALIAS`→`CREATE DOMAIN` · **(c)** porter seulement `TYPE_ALIAS`, le seul équivalent exact | **(a)** | L'apprenant n'apprend **aucune** fausse équivalence. Le prix : il ne réemploie aucune phrase connue, et le premier contact est entièrement nouveau | 84 refus nommés, groupés en **10 raisons** ; `portees` vide. SQL-A n'hérite d'**aucune** des vérifications des lots 1 à 25 : dette de test à construire entière |
| **S2** | Comment composer une requête à plusieurs clauses sans violer la règle 9 ? | **(a)** une requête = un **bloc** multi-lignes, `;` seul sur sa ligne, clauses insérées sur la ligne blanche · **(b)** une phrase = une requête complète, clauses comprises · **(c)** A **modifie** la requête sous le curseur pour y ajouter la clause | **(a)** | L'apprenant voit la requête **se construire clause par clause**, et comprend que l'ordre des clauses est une règle du langage. Avec (b), les phrases deviennent des paragraphes ; avec (c), il n'apprend plus où une clause se place | (a) est une **insertion pure** : aucun caractère existant touché, règles 3, 8 et 9 tiennent sans exception. (c) exigerait de suspendre la règle 9, ce qui n'est pas négociable |
| **S3** | Que faire du signe `=` dans une condition citée ? | **(a)** l'apprenant écrit `"age == 18"` · **(b)** capacité additive `egaliteSimple` au noyau, à `false` partout sauf SQL · **(c)** aucune expression citée : une phrase française par prédicat | **(b)**, en gardant **(c)** là où le symbole mentirait | Avec (a), l'apprenant devrait écrire une syntaxe **qui n'existe pas en SQL** pour obtenir celle qui existe : intenable. Avec (b), il écrit le SQL qu'il lira. (c) reste **obligatoire** pour `IS NULL` et `LIKE`, parce que `= NULL` est faux et qu'aucune expression citée ne doit pouvoir l'écrire | Touche le **noyau gelé depuis le lot 13**, couvert par 1 335 559 comparaisons. Mesuré : `expressionCore.ts` ligne 231 refuse `=` avec `ASSIGNMENT_IN_CONDITION`. **Condition de sûreté : 0 régression et 0 capacité perdue** au différentiel contre `v0.6.0` pour C17, Python et Java — sinon le lot S3 est refusé et le drapeau retiré |
| **S4** | Comment ajouter une colonne à une table déjà déclarée ? | **(a)** `ALTER TABLE … ADD COLUMN` · **(b)** insertion dans la liste parenthésée du `CREATE TABLE`, virgule en tête · **(c)** `CREATE TABLE` complet en une seule phrase | **(a)** | L'apprenant apprend `ALTER TABLE`, qu'il rencontrera dès que la table existe déjà — c'est-à-dire presque toujours, en vrai | (a) n'exige aucune modification de ligne. (b) demande d'insérer **entre** la dernière colonne et la parenthèse fermante : faisable, mais la mise en page devient fragile. `CREATE TABLE` est rendu avec sa **première** colonne, parce qu'une table sans colonne n'est pas du SQL standard et qu'en inventer une violerait la règle 3 |
| **S5** | Où placer virgules et opérateurs dans une liste composée ? | **(a)** **en tête** de ligne (`, age` / `AND x`) · **(b)** en fin de ligne, comme l'usage courant · **(c)** tout sur une ligne | **(a)** | Disposition **inhabituelle** pour qui ne la connaît pas, et c'est le coût visible de la règle 9 — à chaque requête. En contrepartie, elle rend l'ajout d'un terme lisible comme ce qu'il est : une ligne de plus | (a) est la **seule** disposition où ajouter un terme ne touche pas la ligne précédente. (b) exigerait d'ajouter une virgule sur une ligne existante, donc de modifier du code non autorisé |
| **S6** | Standard ou PostgreSQL, quand les deux diffèrent ? | **(a)** standard écrit, forme PostgreSQL **refusée nommément** · **(b)** PostgreSQL écrit, car c'est ce que l'apprenant verra en ligne · **(c)** les deux acceptées | **(a)** | L'apprenant verra `FETCH FIRST 3 ROWS ONLY` là où tous les exemples d'Internet écrivent `LIMIT 3` : inconfort immédiat contre **compétence transférable**. Chaque refus **nomme** la forme standard qui enseigne la même chose | 8 refus de dialecte : `LIMIT`, `serial`, `::`, `ILIKE`, `RETURNING`, `ON CONFLICT`, `text`, `BEGIN`. **Une exception assumée** : `CREATE INDEX` n'est pas dans le standard et reste au catalogue — aucune base réelle ne s'en passe, et une information passive le dit. Une règle qui se tait sur son exception n'est pas une règle |
| **S7** | Comment écrire un texte contenant une apostrophe ? | **(a)** la **doubler** (`'O''Brien'`) · **(b)** refuser la phrase · **(c)** `$$…$$` de PostgreSQL | **(a)**, avec une information passive | Le commentaire de traçabilité garde `O'Brien` **tel que tapé** — règle 2 — tandis que le littéral écrit `O''Brien`. Les deux lignes diffèrent à l'œil, et **sans explication l'apprenant y verra une faute de A** | Ce n'est **pas** un ajout implicite : la valeur ne change pas, c'est son encodage — même nature que `\n` dans `printf`. (c) est propre à PostgreSQL, donc exclu par S6. (b) interdirait la moitié des noms propres français |
| **S8** | Que faire d'un `.sql` écrit à la main, requête sur une seule ligne ? | **(a)** **refuser**, diagnostic `CLAUSE_SUR_UNE_LIGNE_UNIQUE` · **(b)** réécrire la requête en plusieurs lignes, puis insérer · **(c)** insérer la clause dans la ligne | **(a)** | L'apprenant apprend que A **n'arrange pas** son fichier : il insère ou il refuse, et il dit pourquoi. C'est la règle 5 — diagnostic, pas correction | (b) et (c) **modifient** du code non autorisé. (a) est une **limite réelle**, conséquence directe de la règle 9, et elle doit figurer dans `docs/LIMITES_CONNUES.md` **avant** la première séance, pas après |
| **S9** | Quelle étiquette de blocs pour SQL ? | **(a)** troisième valeur `'terminateur'` · **(b)** réutiliser `'accolades'` · **(c)** abstraire les trois placements en un seul | **(a)** | Aucune conséquence visible pour l'apprenant | Modification **additive** : ni C17, ni Python, ni Java ne changent. (b) mentirait : SQL n'a pas d'accolades. (c) effacerait ce que Java a prouvé — l'étiquette commune ne garantit pas la règle commune. C'est la **décision 2 du socle**, que SQL confirme une **troisième** fois |
| **S10** | Qui nomme une contrainte ? | **(a)** l'**utilisateur**, le nom est exigé par la phrase · **(b)** le serveur, forme sans nom · **(c)** A engendre un nom (`pk_<table>`) | **(a)** | L'apprenant nomme ce qu'il crée, donc il peut le **citer** pour le supprimer. Avec (b), il doit interroger le catalogue de la base pour retrouver un nom qu'il n'a pas choisi | (c) serait une **invention** interdite par la règle 3. (b) délègue l'invention au serveur : A n'invente pas, mais le résultat est le même pour l'apprenant — un nom qu'il ne connaît pas |
| **S11** | Comment valider sans serveur SQL installé ? | **(a)** PostgreSQL **portable**, hors dépôt, amas isolé, port non standard · **(b)** se contenter des tests unitaires · **(c)** SQLite, plus léger | **(a)** — **autorisée par le fondateur le 19 novembre 2026** | (b) reviendrait à annoncer SQL-A V1 sans qu'une seule instruction ait été exécutée : exactement ce que ce projet refuse depuis trois phases | (c) est exclue : SQLite n'est pas PostgreSQL et n'accepte ni `FETCH FIRST … ROWS ONLY`, ni `ALTER COLUMN ADD GENERATED`, ni les rôles. Sans (a), les lots **S0 à S3** avancent mais **aucune livraison n'est annonçable** |

---

## P1 — La version de PostgreSQL recommandée

**PostgreSQL 18, actuellement 18.7.** Vérifié sur la page de versionnement du
projet :

| Version | Mineure courante | Première publication | **Fin de vie** |
|---|---|---|---|
| **18** | **18.7** | 25 septembre 2025 | **14 novembre 2030** |
| 17 | 17.12 | 26 septembre 2024 | 8 novembre 2029 |
| 16 | 16.16 | 14 septembre 2023 | 9 novembre 2028 |
| 15 | 15.20 | 13 octobre 2022 | 11 novembre 2027 |
| 14 | 14.25 | 30 septembre 2021 | **12 novembre 2026 — passée** |

Trois raisons, dans cet ordre :

1. **la fin de vie est en 2030** : la référence ne changera pas au milieu du
   projet. PostgreSQL 14 est sorti du support **il y a une semaine**, ce qui
   montre que le choix n'est pas théorique ;
2. **le risque est faible** : toutes les formes du catalogue proposé existent
   depuis PostgreSQL 10 ou avant — `GENERATED … AS IDENTITY` est la plus
   récente, livrée en 10. Le choix du majeur ne change donc rien à ce que
   SQL-A écrit ;
3. **c'est le majeur courant** : un apprenant qui installe PostgreSQL
   aujourd'hui obtient 18.

*Les documents de la phase 4 qui citent « PostgreSQL 18 » ont été écrits avant
cette vérification et sont corrigés.*

### L'intégrité, et un écart honnête avec la phase 3

Temurin publiait un `sha256` officiel, et il a été comparé. **PostgreSQL n'en
publie aucun** : ni la page de téléchargement Windows de postgresql.org, ni
la page des binaires d'EDB ne mentionnent de somme de contrôle ou de
signature pour l'archive.

Par conséquent, l'intégrité ne peut **pas** être établie de la même façon, et
il serait malhonnête d'annoncer « sha256 conforme » comme à la phase 3. Ce qui
est fait à la place, par ordre de force :

1. **la signature Authenticode des binaires extraits** — vérifiable
   localement, elle prouve l'éditeur et l'absence d'altération. C'est **plus
   fort** qu'un hachage publié sur la même page que le fichier, qu'un
   attaquant qui tient la page tiendrait aussi ;
2. l'empreinte `sha256` de l'archive, **relevée et consignée** — non pas
   comme une vérification, mais pour que la reproductibilité soit possible ;
3. le transport TLS vers l'hôte officiel.

**Cadre d'installation**, identique à celui tenu pour Temurin : **hors du
dépôt**, `PATH` système **inchangé**, **aucun service Windows**, amas créé par
`initdb` dans un dossier local, **port non standard**, localisation par chemin
**relatif**, et **aucun chemin personnel dans un fichier versionné** — un
contrôle de pré-publication le vérifie déjà.

## P2 — Les requêtes imbriquées : la stratégie

**Une sous-requête est produite *entière* par une seule phrase. Elle n'est
jamais composée clause par clause.**

La raison est une ambiguïté que A refuserait de lever en devinant : si le
curseur est posé dans une requête qui en contient une autre, « Ne garde que
les lignes où … » peut viser **l'une ou l'autre**. Une insertion sûre exige de
savoir laquelle, et rien dans le document ne le dit.

| Forme | Phrase | Composable ? |
|---|---|---|
| `IN (SELECT …)` | `Ne garde que les lignes où {colonne} figure parmi les {colonne2} de la table {table}.` | **non**, rendue entière |
| `EXISTS (SELECT 1 … WHERE …)` | `Ne garde que les lignes pour lesquelles il existe une ligne de la table {table} où "{condition}".` | **non** |
| `WITH … AS (…)` | `Crée une expression de table nommée {alias} qui lit la colonne {colonne} de la table {table}.` | **oui**, mais au niveau **extérieur** |
| `UNION` / `INTERSECT` / `EXCEPT` | `Ajoute sans doublon les {colonne} de la table {table}.` | **oui**, clause du niveau courant |

**La conséquence pédagogique est assumée** : une sous-requête complexe n'est
pas exprimable. L'**expression de table** (`WITH`) est la réponse, et c'est
une bonne nouvelle déguisée — elle est plus lisible qu'une imbrication, et
c'est ce qu'on enseigne de toute façon.

**Et une limite dite d'avance** : A ne vérifiera pas qu'une sous-requête
renvoie **une seule colonne**, comme `IN` l'exige. Le serveur le refusera ;
A ne le sait pas.

Le `SELECT 1` de `EXISTS` mérite sa justification : la syntaxe **exige** une
projection, et `EXISTS` l'ignore. Ce n'est pas un ajout implicite au sens de
la règle 3 — c'est une obligation du langage, de la même nature que
`String[] args` dans le `main` de Java. L'information passive
`SQL_EXISTE_IGNORE_LA_PROJECTION` le dit à l'endroit où ça compte.

## P3 — Les règles sur NULL

**NULL n'est pas une valeur, c'est une absence.** Trois règles, et une
conséquence sur le catalogue.

1. **`= NULL` ne doit jamais pouvoir s'écrire.** C'est pourquoi « est nulle »
   et « n'est pas nulle » ont leurs **phrases dédiées**, qui rendent `IS NULL`
   et `IS NOT NULL`. Une expression citée ne doit pas pouvoir produire
   `= NULL` : l'expression serait **acceptée** par le serveur et ne serait
   **jamais vraie**, ce qui est la pire combinaison — ni erreur, ni résultat.
   Si la décision S3 est prise, le profil SQL doit donc **refuser** le jeton
   `NULL` comme opérande de comparaison, et renvoyer vers la phrase dédiée ;
2. **`COUNT(*)` et `COUNT(colonne)` sont deux phrases distinctes**, parce
   qu'ils ne comptent pas la même chose dès que la colonne admet des nuls.
   Les confondre est l'erreur de débutant la plus fréquente sur les agrégats ;
3. **l'ordre des nuls est explicite ou subi.** Vérifié dans la documentation :
   sans `NULLS FIRST`/`NULLS LAST`, le défaut est `NULLS LAST` en `ASC` et
   `NULLS FIRST` en `DESC` — « thus, the default is to act as though nulls are
   larger than non-nulls ». La phrase `Place les valeurs nulles en dernier.`
   existe pour que l'apprenant ne **dépende pas** d'un défaut qu'il ignore.

**Ce que A ne fera pas** : il n'ajoutera jamais `COALESCE`, ni `IS NOT NULL`,
ni une valeur de remplacement. Une colonne nullable traitée comme si elle ne
l'était pas est une erreur de **conception**, pas de frappe, et la corriger en
silence l'empêcherait d'être apprise.

Deux informations passives portent ces règles :
`SQL_NUL_NEST_PAS_UNE_VALEUR` et `SQL_COMPTE_ETOILE`.

## P4 — Les opérations destructives

C'est le seul domaine où SQL est **plus dangereux** que les trois autres
langages : un `DELETE` sans filtre ne plante pas, il réussit — et les données
ne reviennent pas.

| Règle | Conséquence |
|---|---|
| **A n'ajoute jamais de `WHERE`** | un filtre inventé changerait le sens de l'ordre donné. Règle 3, sans exception |
| **A n'enlève jamais un `WHERE`** | — |
| **une modification sans filtre exige que la phrase le dise** | `Modifie toutes les lignes de la table {table} …` et `Supprime toutes les lignes de la table {table}.` Sans les mots « toutes les lignes », la phrase n'est pas reconnue. L'intention destructive doit être **écrite**, pas déduite |
| **une information passive est émise** | `SQL_MODIFICATION_SANS_FILTRE` : « Cette instruction touche TOUTES les lignes de la table. C'est ce que votre phrase a demandé, et SQL-A n'ajoutera jamais de filtre à votre place » |
| **passive, jamais bloquante** | elle n'incrémente pas le compteur d'avertissements, et ne se transforme pas en confirmation supplémentaire. L'aperçu **est** la confirmation — règle 8 — et en ajouter une seconde pour ce cas-là apprendrait à cliquer sans lire |
| **`DROP TABLE` et `DROP VIEW` existent au catalogue** | refuser la suppression d'une table rendrait le domaine 1 inenseignable. L'aperçu la montre, l'utilisateur confirme |
| **aucun `TRUNCATE`** | hors standard, et son irréversibilité n'a aucune valeur pédagogique ici |
| **la transaction est enseignée au domaine 9, et l'exercice de clôture en annule une** | c'est la vraie réponse au risque : non pas un garde-fou de A, mais `ROLLBACK`, que l'apprenant apprend à utiliser |

**Ce que cela ne protège pas, et qui doit être dit avant la première séance :**
A ne sait pas si la table visée contient dix lignes ou dix millions, ni si
c'est une base de test ou de production. `docs/LIMITES_CONNUES.md` doit
porter cette phrase, et le protocole de séance doit exiger une base **de
test**.

## P5 — Les scénarios de validation sur données réelles

L'exercice de clôture est **défini maintenant, avant la première ligne de
code** — la règle apprise en phase 3, où cinq des quinze défauts n'étaient
visibles pour aucun test unitaire.

**Sujet : une bibliothèque de prêt.** Trois tables, des données de départ, et
des résultats **calculés à la main avant l'exécution**.

### Les données de départ

| `livres` | `lecteurs` | `emprunts` |
|---|---|---|
| 6 livres, dont 2 du même auteur | 4 lecteurs, dont **un sans aucun emprunt** | 7 emprunts, dont **2 non rendus** |
| un titre contenant une **apostrophe** (`L'Étranger`) | un nom contenant une apostrophe (`O'Brien`) | une date de retour **nulle** pour les non rendus |

Trois choix délibérés : le lecteur **sans emprunt** distingue la jointure
interne de la jointure gauche ; la date de retour **nulle** éprouve toutes les
règles de P3 ; les **apostrophes** éprouvent la décision S7.

### Les douze scénarios, et ce que chacun prouve

| # | Scénario | Ce qu'il prouve, et qu'aucun test unitaire ne prouve |
|---|---|---|
| 1 | créer les trois tables, clés primaires **nommées**, une clé étrangère, `NOT NULL`, `UNIQUE`, `CHECK`, valeur par défaut, identité engendrée | le domaine 1 et le domaine 9 tiennent **ensemble**, et l'ordre des instructions est jouable tel quel |
| 2 | insérer les données, apostrophes comprises | la décision S7 : `'L''Étranger'` ressort **exactement** `L'Étranger` à la lecture |
| 3 | projection simple, avec alias, avec `DISTINCT` | le domaine 2 |
| 4 | **composer** un filtre en quatre phrases : `WHERE`, `AND`, `ORDER BY`, `FETCH FIRST` | **l'épreuve de la décision S2** : quatre insertions pures, et le SQL obtenu s'exécute |
| 5 | compter les emprunts par lecteur, `GROUP BY` puis `HAVING` | le domaine 5, et que l'ordre des rangs de clauses est respecté |
| 6 | `COUNT(*)` contre `COUNT(date_retour)` sur la même table | **P3 règle 2** : les deux chiffres **diffèrent**, et le calcul fait à la main dit de combien |
| 7 | jointure **interne** puis jointure **gauche** | le lecteur sans emprunt **disparaît** de l'une et **apparaît** dans l'autre, avec des nuls |
| 8 | `IN (SELECT …)`, `EXISTS`, puis `EXCEPT` | **P2** : les trois formes sont rendues entières et s'exécutent |
| 9 | tri sans `NULLS LAST`, puis avec | **P3 règle 3** : la place des nuls **change**, et l'apprenant voit pourquoi la phrase existe |
| 10 | `UPDATE` filtré, `DELETE` filtré, puis `UPDATE` **sur toutes les lignes** | **P4** : la phrase doit dire « toutes les lignes », et l'information passive est journalisée |
| 11 | une vue, un index, et une **transaction annulée** | le domaine 9, et que `ROLLBACK` **ramène** les données à leur état d'avant — vérifié par un `COUNT` avant et après |
| 12 | trois **épreuves négatives** : violation de `CHECK`, violation de clé étrangère, suppression d'un lecteur qui a des emprunts | le chemin d'erreur. Un exercice qui ne fait que réussir ne prouve que la moitié |

### Les critères d'acceptation

| Critère | Seuil |
|---|---|
| exécution | `psql --set ON_ERROR_STOP=1 -f …` en **code 0** |
| justesse | sortie **conforme au calcul fait à la main**, comparée octet par octet |
| retouches manuelles | **zéro**. Une instruction à corriger à la main est un défaut du produit, et le lot correspondant est rouvert |
| épreuves négatives | les trois **échouent**, chacune avec l'erreur attendue du serveur |
| encodage | base et client en `UTF8`, apostrophes et accents **relus identiques** |

**`ON_ERROR_STOP=1` n'est pas un détail de confort : sans lui, `psql` continue
après une erreur et renvoie 0.** Un script faux passerait pour bon, et toute
la chaîne de preuves deviendrait décorative. C'est la leçon de `javac` sans
`-encoding UTF-8`, transposée — et cette fois elle est connue **avant** d'y
perdre une demi-journée.

---

## Ce qui n'est **pas** demandé ici

- **le modèle pédagogique 2**, ni aucun palier de liberté nouveau ;
- les **fonctions de fenêtrage**, `MERGE`, `WITH RECURSIVE`, les déclencheurs,
  PL/pgSQL, les procédures stockées, les types tableau et JSON, le réglage de
  performance : hors catalogue du modèle 1, et dits comme tels ;
- **Rust**, qui vient après le modèle 2 ;
- la **factorisation des quatre sessions de l'hôte**, qui effacerait ce que
  trois langages ont prouvé.
