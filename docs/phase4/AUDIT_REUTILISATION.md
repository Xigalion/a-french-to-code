# Audit du socle, pour SQL — 19 novembre 2026

**Rien n'est implémenté.** Ce document dit ce qui sert tel quel, ce qui se
paramètre, et ce qui doit être écrit. Chaque chiffre vient d'une mesure sur le
code, pas d'une lecture.

    node --input-type=module -e "…"   # les mesures de §1 sont reproductibles

---

## 1. Ce que le registre porte aujourd'hui, mesuré

| Langage | intentions portées | non portées | raisons | textes distincts | blocs |
|---|---|---|---|---|---|
| C17 | **84 / 84** | 0 | 0 | — | `accolades` |
| Python | **33** | 51 | 51 | **19** | `indentation` |
| Java | **57** | 27 | 27 | **21** | `accolades` |

Deux enseignements immédiats :

1. **les raisons de refus se mutualisent déjà** — Python écrit 51 refus avec
   19 textes. Grouper n'est donc pas une entorse mais la pratique établie, et
   SQL, qui refusera les 84, n'aura pas à écrire 84 paragraphes de remplissage.
2. **la trajectoire est descendante** : 84, puis 57, puis 33. SQL continue la
   pente jusqu'au bout — **zéro**.

## 2. Le résultat principal, et il est négatif

> **Aucune des 84 intentions du catalogue partagé n'est portable en SQL.**

Ce n'est pas une limite de l'implémentation : c'est ce que SQL est. Le
catalogue partagé décrit des variables, des affectations, des boucles, des
branchements, des fonctions, des affichages, des fichiers, de la mémoire et un
préprocesseur. Un langage de requêtes n'a **aucun** de ces neuf objets.

Le détail, intention par intention, est dans
[`CLASSEMENT_INTENTIONS.md`](CLASSEMENT_INTENTIONS.md) ; il est **vérifié
par machine** contre les genres que le moteur publie.

Un refus mérite d'être lu même si l'on ne lit rien d'autre :
`SQL_LA_TABLE_N_EST_PAS_UNE_STRUCTURE`. La ressemblance entre une structure et
une table est la plus séduisante et la plus fausse. Une structure est un
**type** : elle décrit la forme d'**une** valeur. Une table est une
**relation** : elle contient un ensemble de lignes, sans ordre et sans compte
fixe. Rendre « Déclare une structure » par `CREATE TABLE` enseignerait
précisément la confusion qui fait ensuite écrire des boucles sur une base de
données.

**Conséquence de périmètre, à assumer :** SQL-A est le premier langage
**entièrement natif**. Il n'hérite de rien — et donc il ne bénéficie
d'aucune des 3 580 vérifications que les lots 1 à 25 ont accumulées sur le
catalogue partagé. Sa dette de test est à construire en entier.

## 3. Ce qui sert tel quel, sans une ligne

| Élément | Verdict | Pourquoi |
|---|---|---|
| `src/langages/registre.ts` — type `Langage`, refus nommés | **tel quel** | `portees` vide et `raisons` à 84 entrées sont des valeurs légales |
| `commentaire: (phrase) => '-- ' + phrase` | **tel quel** | le registre délègue déjà la syntaxe du commentaire au langage |
| `src/langue/variantes.ts` — `Arbitre<C>`, lexique, 98 reformulations | **tel quel** | `Arbitre` est **génér**ique ; Java l'a prouvé en n'ajoutant zéro ligne |
| `src/stringLiteral.ts` — scanner de texte | **tel quel** | les littéraux SQL sont entre apostrophes simples, mais le **scanner** de la phrase française est le même |
| machine à états de l'hôte : saisie → aperçu → confirmation → insertion | **tel quel** | elle ne connaît pas le langage |
| `scripts/differentiel.mjs`, `scripts/liens.mjs`, `scripts/pre-publication.mjs` | **tel quel** | outillage, indépendant du langage |

## 4. Ce qui se paramètre

**Le noyau d'expressions** (`src/expressionCore.ts`) s'emploie comme
**analyseur**, avec un **rendu** propre à SQL — exactement ce que Java a fait,
et Python avant lui : `src/langages/python/expression.ts` ligne 123 traduit
déjà `&&` en `and`. Le précédent existe, et il tient.

La correspondance de rendu visée :

| Arbre du noyau | C17 | Python | **SQL** |
|---|---|---|---|
| comparaison `==` | `==` | `==` | **`=`** |
| comparaison `!=` | `!=` | `!=` | **`<>`** |
| logique `&&` | `&&` | `and` | **`AND`** |
| logique `\|\|` | `\|\|` | `or` | **`OR`** |
| négation `!` | `!` | `not` | **`NOT`** |

### Et un obstacle réel, mesuré dans le code

`src/expressionCore.ts` ligne 231 :

```ts
return fail(token.text === '=' ? 'ASSIGNMENT_IN_CONDITION' : 'UNSUPPORTED_CONDITION_OPERATOR',
  token.text === '=' ? 'L’opérateur = effectue une affectation ; aucune affectation n’est prise en charge dans cette condition.'
```

**Le signe `=` seul est refusé dans une condition.** En C, en Python et en
Java, c'est juste : `=` y affecte. **En SQL, `=` est l'égalité** — et c'est le
prédicat le plus courant du langage. Réutiliser le profil condition tel quel
refuserait donc `"age = 18"`, la première chose qu'un débutant écrit.

C'est la **décision S3**, et elle n'a pas de réponse évidente : voir
[`DECISIONS_SQL.md`](DECISIONS_SQL.md).

## 5. Ce qui doit être écrit

| À écrire | Pourquoi le socle ne suffit pas |
|---|---|
| `src/langages/sql/placement.ts` | SQL n'a **ni accolades ni indentation** : ses instructions sont séparées par `;`. L'étiquette `Blocs` n'a pas de valeur qui lui convienne |
| une troisième valeur de `Blocs` | `type Blocs = 'accolades' \| 'indentation'` — ajouter `'terminateur'` est **additif**, et ne touche ni C17, ni Python, ni Java |
| `src/langages/sql/portees.ts` | trois portées : `fichier`, `requete`, `projection`. Le modèle de Java (quatre portées) ne s'applique pas : il n'y a **pas d'imbrication**, il y a un **ordre de clauses** |
| `src/langages/sql/catalogue.ts` | 93 formulations natives, aucune héritée |
| `src/langages/sql/renduNatif.ts` | le rendu SQL des formulations natives |
| `src/langages/sql/raisons.ts` | 84 refus nommés, groupés en 10 raisons, **vérifiés au chargement** |
| `src/langages/sql/expression.ts` | le rendu SQL des conditions, et le refus des constructions sans sens ici (pointeurs, caractères, transtypages du C) |
| `src/langages/sql/informations.ts` | 13 informations passives |
| `extension/src/sessionSql.ts` | la quatrième session de l'hôte |

**Et une chose que l'audit refuse de recommander** : factoriser les quatre
sessions de l'hôte. Elles se ressemblent, et la tentation est forte. Mais une
factorisation qui unifierait les placements effacerait précisément ce que
Java a prouvé — que l'étiquette commune ne garantit pas la règle commune.
C'est la **décision 2 du socle**, et SQL la confirme une troisième fois.

## 6. Le français souple : un risque **prévisible**, pas une surprise

Le défaut le plus grave de la phase 3 a été trouvé par la mesure du français
souple : `Appelle la méthode afficher de e.` produisait `e.Affiche();` — **A
renommait silencieusement la méthode de l'utilisateur**, parce que la garde
des identifiants ne connaissait que « nommé » et « appelé », là où Java nomme
des identifiants après un **nom commun**.

SQL en introduit **sept** : `table`, `colonne`, `vue`, `index`, `contrainte`,
`schéma`, `rôle`. Vérifié : aucun des mots SQL candidats n'est aujourd'hui au
lexique, donc rien ne mord **encore**. Mais la phrase
`Supprime la colonne compte de la table ventes.` est exactement de la forme
qui a mordu en Java.

**Le risque est donc connu d'avance, et il doit être mesuré avant la
livraison, pas après.** C'est le lot S9 du plan, et son critère est le même
qu'en Java : **zéro erreur de sens**, le seul chiffre qu'aucun taux ne
rachète.

## 7. Ce qui manque à la machine

| Outil | État |
|---|---|
| `psql` | **absent** |
| serveur `postgres`, `initdb`, `pg_ctl` | **absents** |
| `sqlite3` | absent |
| `docker` | absent |

**Aucune preuve d'exécution n'est possible en l'état**, et c'est plus grave
que l'absence de JDK à la phase 3 : un programme Java se compile puis se
lance seul, tandis qu'une instruction SQL n'a de sens que **jouée contre une
base qui contient des données**. Une suite de tests ne dira jamais si
`FETCH FIRST 3 ROWS ONLY` renvoie trois lignes.

Autorisation externe demandée : [`PLAN_SQL.md`](PLAN_SQL.md) §6.
