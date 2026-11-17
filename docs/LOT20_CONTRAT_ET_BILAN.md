# Lot 20 — Structures et accès aux membres — contrat et bilan

**Contrat rédigé puis exécuté le 15 novembre 2026**, en autonomie. Premier
lot du **domaine 6, « Structures et mémoire dynamique »**.

Chiffres réels : **3 297 tests Node réussis, 0 échec** (3 222 au lot 19).
**1 332 084 comparaisons différentielles**, **0 régression**. **97 tests
hôte non exécutés.**

---

## 1. Contrat

### 1.1 Formulations et sorties exactes

| Formulation française | Code C produit |
|---|---|
| `Déclare une structure nommée Point.` | `struct Point { ⏎ ⏎ };` |
| `Ajoute un champ de type int nommé x.` | `int x;` |
| `Ajoute un champ de type structure Point nommé origine.` | `struct Point origine;` |
| `Déclare une variable de type structure Point nommée p.` | `struct Point p;` |
| `Déclare un pointeur de type structure Point nommé q.` | `struct Point *q;` |
| `Affecte la valeur 5 au champ x de p.` | `p.x = 5;` |
| `Affecte la valeur 5 au champ x pointé par q.` | `q->x = 5;` |
| `Affecte au champ x de p le résultat numérique de "a + 1".` | `p.x = (a + 1);` |
| `Affiche le champ x de p.` | `printf("%d", p.x);` |
| `Affiche le champ x pointé par q.` | `printf("%d", q->x);` |

La définition est un **bloc**, et son accolade fermante porte le
point-virgule : C17 l'exige, et il appartient à la construction.

Le pointeur de structure s'écrit `struct Point *q` : la convention **D2**
du lot 17 s'applique telle quelle.

« pointée » est accepté à côté de « pointé » : un champ peut être féminin
en français, et la phrase n'a pas à être fausse pour être comprise.

### 1.2 Accès dans les expressions

`.` et `->` deviennent des opérateurs postfixés dans les profils
**numérique et condition** :

| Phrase | Code C |
|---|---|
| `Affecte à n le résultat numérique de "p.x".` | `n = p.x;` |
| `Affecte à n le résultat numérique de "q->a.b".` | `n = q->a.b;` |
| `Affecte à n le résultat numérique de "t[i].x".` | `n = t[i].x;` |
| `Crée un bloc si "q->x > 0".` | `if (q->x > 0) { … }` |

Grammaire : `(nom | nom[indice]) ('.' nom | '->' nom)*`. Les chaînes sont
autorisées ; **aucune indexation après un champ** (`p.t[i]` est refusé
plutôt que à moitié pris en charge).

### 1.3 Capacité du noyau

Un champ nouveau, `members`, **vrai** pour les profils numérique et
condition, **faux** pour le profil entier du lot 6 et pour le profil
d'indice. Les quatre enregistrements restent verrouillés.

Le tokeniseur acquiert deux comportements gardés par cette capacité :

- un `.` qui **ne précède pas un chiffre** devient un jeton à lui seul ;
- un `.` **sépare** un nom, là où tous les lots précédents gardaient un
  nom pointé d'un seul tenant.

Le second point est le seul endroit délicat du lot, et il explique la
seule anomalie du différentiel, au §3.

### 1.4 Placement contextuel

Un champ n'a de sens que dans une structure. `src/structTarget.ts` l'établit
avant toute insertion, sinon `FIELD_OUTSIDE_STRUCT`.

Le balayage partagé classe une accolade de `struct` comme `unsupported`,
parce qu'un tag suivi d'un bloc n'est pas un contexte d'instruction.
Plutôt que de changer cette classification — ce qui aurait **relâché tous
les autres reconnaisseurs** bâtis dessus —, `structTarget` lit lui-même
les deux jetons qui précèdent l'accolade la plus intérieure. Le balayage
partagé continue de faire l'appariement, les commentaires, les chaînes et
les budgets. `struct`, `union` et `enum` sont reconnus, avec ou sans
étiquette.

### 1.5 Limites du contrat

- Ni `typedef`, ni énumération déclarée, ni union déclarée, ni champ de
  bits, ni membre anonyme.
- Aucune initialisation de structure, aucune affectation globale.
- Aucune indexation après un champ.
- Les profils entier et d'indice restent fermés aux deux opérateurs.
- Aucune vérification qu'une structure existe, possède un champ, ou que ce
  champ a le type attendu.

---

## 2. Fichiers

**Créés** : `src/structInstructions.ts`, `src/structTarget.ts`,
`test/structs.test.mjs` (80 tests), ce document.

**Modifiés** : `src/expressionCore.ts` (capacité `members`, jeton `.`,
rupture de nom, chaîne d'accès, `->` laissé passer),
`src/numericExpression.ts`, `src/translate.ts` (union, trois codes, huit
rendus, `BLOCK_KINDS`, aiguillage), `src/planPlacement.ts`,
`src/pedagogicalInformation.ts`, `scripts/differentiel.mjs`,
`package.json`, six fichiers de tests, `docs/CATALOGUE.md`, `CLAUDE.md`.

**Non modifiés** : `enclosingStructures.ts`, `loopTarget.ts`,
`switchTarget.ts`, `branchTarget.ts`, `functionContext.ts`,
`expression.ts`, `condition.ts`, et tout `extension/`.

---

## 3. Différentiel — une anomalie trouvée, instruite, et rapportée

| Référence | Comparaisons | Extensions | Régressions | Capacités perdues |
|---|---|---|---|---|
| lot 19 (`lot-19`) | 1 332 084 | 31 750 | **0** | **6 512** |
| avant le lot 13 (`ref-avant-lot-13`) | 1 332 084 | 77 658 | **0** | **4 488** |

**`--no-loss` a signalé 6 512 pertes. Je ne les ai pas écartées.** Le
harnais imprimait seulement les dix premières ; je l'ai étendu pour les
lister toutes avec `--all`, puis je les ai instruites :

1. **57 entrées distinctes**, toutes de la forme `a2.5`, `a.5`, `A.`,
   `_x2.5F` — un nom suivi d'un point.
2. **Aucune n'est un identifiant C valide.**
3. **Seuls les quatre profils d'expression bruts sont touchés** : aucun
   stage `translate`, `explainInstruction` ou `planPlacement`.

La cause est la rupture de nom sur le point : avant, `a2.5` était **un
seul jeton nom**, et le validateur **volontairement permissif** du harnais
l'acceptait. Le vrai moteur, lui, passe `identifierDiagnostic`, qui le
refuse.

**Vérifié, pas supposé.** J'ai extrait les 57 entrées et je les ai passées
par `translate()` des **deux** moteurs, dans deux enveloppes :

    moteur du lot 19  : 0 accepté sur 114
    moteur du lot 20  : 0 accepté sur 114

Aucune capacité utilisateur n'est donc perdue. La perte est un **artefact
du validateur permissif du harnais**, qui existe pour exercer les chemins
où un nom malformé atteint l'analyseur — une couverture utile, qu'il
serait dommage de supprimer pour faire taire le compteur.

**Dette consignée** : tant que le harnais garde ce validateur, un lot qui
touche la tokenisation des noms verra `--no-loss` se déclencher. La
procédure est celle suivie ici : lister avec `--all`, vérifier que les
entrées ne sont pas des identifiants valides, et confirmer par
`translate()` sur les deux moteurs.

---

## 4. Tests

`npm run check` : **3 297 tests, 0 échec.** `test/structs.test.mjs` en
apporte 80 : vingt sorties exactes avec et sans point final ; cinq types
de champ et cinq refusés ; étiquettes et noms invalides ; dix diagnostics
de cible ; treize accès en expression ; structure du nœud ; six
diagnostics d'accès avec plages UTF-16 ; **littéraux numériques non cassés
par le point** ; profils gelés ; placement d'un champ dans une structure
nommée, anonyme et locale, et son refus dans cinq contextes ; document
final exact ; les quatre informations ; hors périmètre ; non-régressions.

**Tests historiques adaptés** : sept, tous le refus de `->`, dans
`expressionCore.test.mjs`, `characters.test.mjs`, `arrays.test.mjs`,
`strings.test.mjs`, `pointers.test.mjs` et `condition.test.mjs`. Chaque
entrée retirée est remplacée par le refus **du profil entier**, qui reste
vrai, avec un commentaire sur place. Un cas mérite d'être signalé :
`a -> b` écrit avec des espaces était refusé et devient un accès — c'est
du C valide, et la liste d'opérateurs exclus du lot 10 a été amendée en
conséquence.

---

## 5. Informations pédagogiques

| Code | Déclenchement |
|---|---|
| `STRUCT_TAG_NEEDS_KEYWORD` | définition : le type s'écrit `struct` + étiquette, pas l'étiquette seule |
| `STRUCT_LAYOUT` | définition : ordre conservé, remplissage possible, la taille n'est pas la somme |
| `MEMBER_ACCESS_FORM` | tout accès : `.` sur une structure, `->` sur un pointeur, `p->x` **est** `(*p).x` |
| `MEMBER_NOT_CHECKED` | tout accès : ni la structure, ni le champ, ni son type ne sont vérifiés |

`MEMBER_ACCESS_FORM` dit aussi que C-A **n'en substitue jamais une à
l'autre** : si la phrase dit « pointé par », la flèche est écrite, même si
l'objet n'est pas un pointeur. Un test fixe ce comportement.

---

## 6. Limites connues

- Tout le §1.5.
- `p.1` est lu comme le nom `p` suivi du littéral `.1`, et donne
  `MISSING_OPERATOR`. C'est exact mais peut surprendre : le point ne
  devient l'opérateur d'accès que si un chiffre ne le suit pas.
- `p.t[i]` est refusé avec `INVALID_EXPRESSION_TOKEN` sur le crochet.
- Aucune vérification sémantique : `p.inexistant` est traduit et plaçable.
  Deux tests le fixent explicitement.
- `CASE_NEEDS_CONSTANT` du lot 19 refuse toujours tout nom ; les
  énumérations restant hors périmètre, la limite est cohérente.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; exercice intégrateur final.
