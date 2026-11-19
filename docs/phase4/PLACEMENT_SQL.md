# Le placement en SQL — contraintes et conception proposée

**19 novembre 2026. Rien n'est implémenté.**

Le placement a été le vrai travail de la phase 3, et il le sera encore. Mais
le problème n'est pas le même, et c'est ce qui rend la phase 4 intéressante
plutôt que répétitive.

---

## 1. Pourquoi aucun placement existant ne convient

| | C17 | Python | Java | **SQL** |
|---|---|---|---|---|
| délimiteur de bloc | accolades | indentation | accolades | **`;`** |
| imbrication | oui | oui | oui, 4 portées | **non** |
| ordre imposé | directives d'abord | — | `package` → `import` → type | **ordre des clauses** |
| une instruction occupe | une ligne | une ligne | une ligne | **plusieurs lignes** |

Les trois modules existants répondent à la question : **« à quelle profondeur
suis-je ? »** Ils comptent des accolades ou des espaces.

SQL pose une question différente : **« où en suis-je dans l'ordre des clauses
de cette instruction ? »** Il n'y a aucune profondeur à mesurer — et il y a un
ordre strict à respecter.

> `type Blocs = 'accolades' | 'indentation'` n'a pas de valeur qui convienne.
> Une troisième, `'terminateur'`, est **additive** : elle ne touche ni C17, ni
> Python, ni Java, et elle redit la décision 2 du socle — les placements se
> **sélectionnent**.

## 2. L'idée centrale : une requête est un bloc, et une clause s'y **insère**

C'est la clé de voûte, et elle réconcilie SQL avec la règle 9 — *ne jamais
modifier une portion de code que l'utilisateur n'a pas autorisé A à modifier.*

Composer une requête clause par clause semble **exiger** de modifier
l'instruction déjà écrite. Ce serait vrai si l'instruction tenait sur une
ligne. Elle n'y tient pas : SQL ignore les sauts de ligne. Une requête est
donc écrite **une clause par ligne, le `;` seul sur la dernière**, avec une
ligne blanche avant lui :

```sql
-- Crée une requête qui lit la colonne nom de la table eleves.
SELECT nom
FROM eleves
▌
;
```

Le curseur est posé sur la ligne blanche — exactement comme dans un bloc
`if` de C-A. Ajouter une clause est alors une **insertion pure** : aucun
caractère existant n'est touché.

```sql
-- Crée une requête qui lit la colonne nom de la table eleves.
SELECT nom
FROM eleves
-- Ne garde que les lignes où "age > 18".
WHERE age > 18
▌
;
```

**Aucune règle n'est pliée** : règle 3 (rien d'implicite), règle 8 (aperçu puis
confirmation), règle 9 (aucune modification) tiennent toutes les trois.

### Le même raisonnement pour les listes à virgules

Une liste de colonnes pose le même problème sous une autre forme : ajouter
`, age` après `nom` demande de toucher la ligne de `nom`. La solution est la
même, et elle est une convention de mise en page réelle du monde SQL — la
**virgule en tête de ligne** :

```sql
SELECT nom
     , age
FROM eleves
```

Insérer `     , age` ne touche pas la ligne de `nom`. Idem pour `ORDER BY`,
`GROUP BY`, et pour `AND`/`OR` :

```sql
WHERE age > 18
  AND ville = 'Lyon'
```

**C'est laid pour qui ne connaît pas cette convention**, et c'est le prix de
la règle 9. Décision **S5** : on l'assume, ou l'on renonce à composer une
requête en plusieurs phrases.

### Et la liste de colonnes d'un `CREATE TABLE` ?

Là, la virgule en tête ne suffit pas : la parenthèse fermante suit la dernière
colonne, et la ligne blanche utile est **entre** la dernière colonne et `)`.
C'est jouable, mais une autre voie est plus franche et enseigne un vrai ordre
du langage : **`ALTER TABLE … ADD COLUMN`**.

```sql
-- Crée une table nommée eleves avec une colonne entière nommée id.
CREATE TABLE eleves (
  id integer
);

-- Ajoute à la table eleves une colonne de texte nommée nom de longueur 50.
ALTER TABLE eleves ADD COLUMN nom varchar(50);
```

C'est la **décision S4**, et elle est recommandée : aucune ligne existante
n'est touchée, la syntaxe est standard, et l'apprenant apprend `ALTER TABLE`,
qu'il rencontrera de toute façon le jour où la table existe déjà.

## 3. Les trois portées

| Portée | Ce qu'on y place | Comment elle se reconnaît |
|---|---|---|
| `fichier` | une instruction complète, `;` compris | le curseur n'est **dans aucune** instruction ouverte |
| `requete` | une clause : `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `FETCH`, `JOIN`, `UNION` | une instruction est ouverte et la liste de projection est **finie** (un `FROM` a été vu) |
| `projection` | une colonne de plus | une instruction est ouverte et le `FROM` n'est **pas encore** écrit |

Il n'y a **pas** de quatrième portée, et surtout **pas d'imbrication** : une
sous-requête est produite **entière** par une seule phrase, parce que la
composer clause par clause demanderait de savoir dans laquelle des deux
requêtes le curseur se trouve — une ambiguïté que A refuserait de lever en
devinant.

## 4. L'ordre des clauses — la vraie contrainte

Le standard impose un ordre, et une clause placée hors de son rang produit du
SQL qui ne s'exécute pas.

| Rang | Clause | Une seule fois ? |
|---|---|---|
| 1 | `SELECT`, liste de projection | oui |
| 2 | `FROM` | oui |
| 3 | `JOIN … ON` | non, répétable |
| 4 | `WHERE`, puis `AND` / `OR` | `WHERE` une fois, les suites répétables |
| 5 | `GROUP BY`, puis les virgules | une fois |
| 6 | `HAVING` | une fois |
| 7 | `UNION` / `INTERSECT` / `EXCEPT` | répétable |
| 8 | `ORDER BY`, puis les virgules | une fois |
| 9 | `OFFSET` | une fois |
| 10 | `FETCH FIRST` | une fois |

`src/langages/sql/placement.ts` doit donc **lire les clauses déjà présentes**,
en déduire le rang atteint, et refuser toute clause de rang inférieur ou tout
doublon. C'est l'analogue de `package` → `import` → type en Java, mais avec
**dix** rangs au lieu de trois, et des répétitions autorisées pour certains.

**Et c'est là que SQL est plus sévère que Java** : en Java, un `import` mal
placé est refusé par le compilateur à coup sûr. En SQL, une clause mal placée
est refusée par le serveur — mais une clause **manquante** ne l'est pas. Une
requête sans `ORDER BY` s'exécute parfaitement et renvoie les lignes dans un
ordre non défini. SQL-A ne peut donc pas savoir qu'une requête est
*inachevée* : d'où l'information passive `SQL_ORDRE_NON_GARANTI`.

## 5. Les diagnostics proposés

| Code | Quand |
|---|---|
| `LIGNE_NON_BLANCHE` | la ligne du curseur contient autre chose que des blancs |
| `CODE_VIDE` | le langage n'a rien rendu |
| `CLAUSE_HORS_REQUETE` | une clause posée alors qu'aucune instruction n'est ouverte |
| `INSTRUCTION_DANS_UNE_REQUETE` | une instruction complète posée **dans** une requête ouverte |
| `CLAUSE_DANS_LE_MAUVAIS_ORDRE` | rang inférieur au rang déjà atteint — le message **nomme** la clause qui bloque |
| `CLAUSE_EN_DOUBLE` | un deuxième `WHERE`, un deuxième `ORDER BY` |
| `SUITE_SANS_CLAUSE` | `AND` sans `WHERE`, « ordonne ensuite » sans `ORDER BY`, « lis aussi » sans `SELECT` |
| `REQUETE_NON_TERMINEE` | une instruction ouverte dont le `;` manque : A ne sait pas où elle finit, donc il ne place rien |
| `PROJECTION_FERMEE` | une colonne de plus demandée après le `FROM` |
| `CLAUSE_SUR_UNE_LIGNE_UNIQUE` | *sous décision **S8*** — une requête écrite à la main sur une seule ligne, où aucune insertion n'est possible |

Neuf diagnostics arrêtés, dont **sept propres à SQL**, et un dixième suspendu
à la décision S8. Aucun ne « corrige » : chacun
dit ce qui ne va pas et laisse l'utilisateur écrire la suite — règle 5.

## 6. Ce qui reste à décider, et que ce document ne décide pas

1. **le `;` est-il écrit par A ou par l'utilisateur ?** La proposition dit :
   par A, en même temps que la requête, sur sa propre ligne. L'alternative —
   une phrase « Termine la requête. » — rendrait possible d'oublier le `;`, et
   un script SQL dont la dernière instruction n'est pas terminée ne s'exécute
   pas ;
2. **faut-il une phrase pour fermer la ligne blanche restante ?** La
   proposition dit non : une ligne blanche avant le `;` est du SQL valide, et
   insister serait ajouter une cérémonie sans contenu ;
3. **que faire d'un fichier `.sql` écrit à la main, aux clauses sur une seule
   ligne ?** `SELECT nom FROM eleves WHERE age > 18;` est du SQL parfaitement
   correct, et **aucune clause ne peut y être insérée sans modifier la
   ligne**. La proposition : **refuser**, avec un diagnostic qui l'explique —
   `CLAUSE_SUR_UNE_LIGNE_UNIQUE`. C'est une limite réelle, elle sera
   documentée comme telle, et elle découle directement de la règle 9. Décision
   **S8**.
