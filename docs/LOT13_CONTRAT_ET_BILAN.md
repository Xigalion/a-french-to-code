# Lot 13 — Noyau d'expressions unifié

**Contrat approuvé le 13 novembre 2026 (décision D1), implémenté et livré le
même jour.**

Refonte **exclusivement interne**. Aucune nouvelle formulation, aucun opérateur
supplémentaire, aucun changement de comportement observable. Le lot 13 ne
livre **aucune capacité nouvelle à l'utilisateur** : il prépare les lots 14 à 18
en supprimant la duplication qui rendait impossible l'extension des expressions
sans toucher à trois analyseurs à la fois.

---

## 1. Problème traité

Trois analyseurs d'expressions coexistaient, chacun né d'un lot différent :

| Fichier | Lot d'origine | Profil |
|---|---|---|
| `src/expression.ts` | 6 | entier |
| `src/numericExpression.ts` | 7 | numérique, conversions |
| `src/condition.ts` | 9 et 10 | numérique, conversions, logique |

Ils partageaient **environ 85 % de leur code** par copie : même tokeniseur, même
descente récursive, mêmes budgets, mêmes codes de diagnostic, mêmes intervalles.
Chaque copie était un choix délibéré et justifié à son époque — un profil
indépendant garantissait que le lot 7 ne pouvait pas casser le lot 6.

Ce choix ne tient plus sur un périmètre de neuf domaines. Le domaine 5 demande
l'indexation, les littéraux caractère et chaîne, l'adresse et le déréférencement
dans **les trois** profils ; le domaine 6 demanderait `.`, `->` et `sizeof`. À
ce rythme, chaque ajout se paie trois à six fois, et la probabilité qu'une copie
diverge d'une autre croît à chaque lot.

---

## 2. Architecture livrée

### 2.1 Le noyau

`src/expressionCore.ts` (nouveau, 303 lignes) contient l'analyse syntaxique
complète : tokeniseur, descente récursive, budgets, diagnostics, intervalles.
Il est pur, borné, sans E/S, et n'importe de `translate.ts` que deux types.

Il expose :

| Export | Rôle |
|---|---|
| `parseCore(source, start, end, validateName, capabilities, missingMessage, budget?)` | l'analyse elle-même |
| `CoreNode` | l'union **superset** de tous les nœuds que les profils peuvent construire |
| `ExpressionCapabilities` | le registre de capacités |
| `INTEGER_CAPABILITIES`, `NUMERIC_CAPABILITIES`, `CONDITION_CAPABILITIES` | les trois profils historiques |
| `MAX_EXPRESSION_TOKENS`, `MAX_EXPRESSION_DEPTH` | 1 024 et 64, inchangés |
| `isComparison`, `asCondition` | partagés par le profil logique |

### 2.2 Les capacités

Le type `ExpressionCapabilities` est un enregistrement **explicite** : chaque
champ nomme une différence historique réelle entre les profils publiés. Rien
n'est déduit d'un autre champ, même quand la corrélation est actuellement
parfaite — un lot ultérieur pourrait vouloir des conversions sans littéraux
numériques, ou l'inverse.

| Champ | Entier | Numérique | Condition | Ce qu'il commande |
|---|---|---|---|---|
| `literals` | `'integer'` | `'numeric'` | `'numeric'` | grammaire des littéraux, tokenisation des nombres, le `.` accepté comme suite de jeton |
| `casts` | `false` | `true` | `true` | `(type) opérande` |
| `logic` | `false` | `false` | `true` | comparaisons, `!`, `&&`, `||`, et leurs diagnostics propres |
| `invalidTokenMessage` | « expression entière » | « expression numérique » | « expression numérique » | message de `INVALID_EXPRESSION_TOKEN` |
| `invariantMessage` | « expression analysée absente » | « expression numérique analysée absente » | idem | message de l'invariant interne, inatteignable par construction |

### 2.3 Les trois profils publiés

`src/expression.ts`, `src/numericExpression.ts` et `src/condition.ts` conservent
**exactement** leurs noms exportés, leurs types publiés, leurs signatures et
leurs valeurs par défaut. Chacun devient une enveloppe mince qui :

1. appelle `parseCore` avec son enregistrement de capacités ;
2. **réduit** `CoreNode` à son type publié (`Expression`, `NumericExpression`,
   `Condition`).

Cette réduction est **garantie, pas supposée** : une capacité non déclarée rend
le nœud correspondant inconstructible. Le profil entier ne déclarant ni
`numeric`, ni `casts`, ni `logic`, `parseCore` ne peut produire aucun nœud hors
de `Expression`. Un test l'exerce et vérifie l'ensemble exact des `kind`
produits.

Les trois fonctions de **rendu** (`renderExpression`, `renderNumericExpression`,
`renderCondition`) restent dans leurs fichiers, inchangées. Elles diffèrent
réellement, le lot 13 ne les concerne pas, et les laisser tranquilles réduit la
surface du changement.

---

## 3. Vérification

### 3.1 Suite automatisée

    npm run check     # typecheck moteur + extension, puis suite Node

| | Avant | Après |
|---|---|---|
| Tests | 2 648 | **2 662** |
| Réussis | 2 648 | **2 662** |
| Échecs | 0 | **0** |
| Tests historiques modifiés | — | **0** |

Les 14 tests supplémentaires sont `test/expressionCore.test.mjs`, ajouté par ce
lot. **Aucun fichier de test existant n'a été touché** : `git diff -- test/` est
vide en dehors du nouveau fichier.

### 3.2 Pourquoi la suite ne suffisait pas

Une refonte censée ne rien changer n'est pas prouvée par les tests que l'ancien
code passait déjà : ces tests ne couvrent que ce que quelqu'un a pensé à écrire.
La preuve demandait de comparer le nouveau moteur à **l'ancien lui-même**.

`scripts/differentiel.mjs` (nouveau) extrait le moteur d'une référence git dans
un dossier temporaire et l'exécute **côte à côte** avec l'arbre de travail. Sont
comparés, octet pour octet après tri des clés : l'arbre analysé, le code du
diagnostic, son message, sa catégorie, sa sévérité, ses intervalles UTF-16, le
budget de jetons consommé, le fragment produit, les avertissements de calcul,
les informations pédagogiques et le plan de placement.

    node scripts/differentiel.mjs HEAD

| Résultat | |
|---|---|
| Comparaisons | **1 322 877** |
| Divergences | **0** |

Le corpus combine : les 74 atomes significatifs du langage pris deux à deux avec
et sans espace, 120 000 entrées pseudo-aléatoires **déterministes** (graine fixe,
donc tout échec est reproductible), les cas limites de budget et de profondeur
(1 100 termes, 70 parenthèses, 70 négations), les conversions valides et
invalides, et plus de 900 phrases françaises couvrant toutes les intentions des
domaines 1 à 4. Chaque entrée est analysée deux fois — isolée, puis **insérée
dans une phrase plus longue** — pour comparer des décalages UTF-16 absolus et
non simplement relatifs. Les cinq variantes de profil incluent les messages
d'enveloppe personnalisés et le budget partagé entre expressions sœurs.

### 3.3 Le harnais détecte-t-il vraiment quelque chose ?

Un comparateur qui affiche toujours zéro ne vaut rien. Quatre mutations
délibérées ont été injectées dans le noyau, puis retirées :

| Mutation injectée | Divergences détectées |
|---|---|
| Un accent retiré d'un message de diagnostic | 19 626 |
| `logic: true` dans le profil **entier** (fuite de capacité) | 107 392 |
| Un intervalle décalé d'un caractère | 19 626 |
| Budget remis à zéro entre expressions sœurs | 1 055 532 |
| Un `0` rendu `0 ` dans le fragment produit (bout en bout) | 4 |

Le noyau a été restauré à l'identique après chaque essai (`diff` vide), et
`npm run check` repasse à 2 662/2 662.

---

## 4. Divergences constatées

**Aucune.** Rien à signaler au titre du point 5 du contrat.

Deux points méritent toutefois d'être consignés, car ce sont des
**équivalences démontrées**, pas des évidences :

1. **Budget du profil entier.** `parseExpression` comptait ses jetons dans une
   variable locale ; le noyau utilise un objet `budget` dont la valeur par
   défaut est allouée à chaque appel. Les deux sont équivalents parce que
   `parseExpression` n'expose aucun paramètre de budget et qu'aucun appelant ne
   lui en passe. Si un lot ultérieur veut partager un budget entre expressions
   entières sœurs, ce sera un **changement de contrat à faire approuver**, pas
   un détail d'implémentation.

2. **`asNumeric` appliqué inconditionnellement.** Le profil condition passait ses
   opérandes par `asNumeric` dans `product`, `sum` et `cast` ; les deux autres
   profils non. Le noyau l'applique partout. C'est sans effet hors du profil
   logique, puisque `asNumeric` ne rejette que les nœuds `comparison`,
   `logical-not` et `logical-binary`, inconstructibles sans la capacité `logic`.
   Le différentiel le confirme sur l'ensemble du corpus.

---

## 5. Limites et dettes

### Propres au lot 13

- **Les rendus ne sont pas unifiés.** Trois fonctions de rendu subsistent. Elles
  divergent réellement et le lot 13 ne les touche pas. Si le domaine 5 fait
  converger leurs besoins, ce sera un lot distinct.
- **`scripts/differentiel.mjs` est un outil, pas un test.** Il exige une
  référence git et n'est donc pas dans `npm test`. Il doit être relancé
  **manuellement** à chaque lot du domaine 5, contre la référence du lot
  précédent, et son résultat consigné dans le bilan du lot.
- **La réduction de type utilise une conversion explicite** dans chaque
  enveloppe. Elle est justifiée par les capacités et exercée par un test, mais
  elle n'est pas vérifiée par le compilateur. Un lot qui ajoute une capacité
  doit vérifier que les enveloppes des profils qui ne la déclarent pas restent
  correctes.

### Héritées, toujours ouvertes

Inchangées par ce lot, rappelées pour que rien ne se perde :

1. Recette GCC complète du domaine « Expressions et calculs ».
2. Recette manuelle complète du lot 10 et des domaines 3 et 4.
3. Qualification des avertissements de l'hôte VS Code (`mutex already exists`,
   DEP0168/N-API).
4. **Aucune vérification générale des types, symboles et portées** du code
   utilisateur, et **aucune garantie de compilation** du C produit. Le lot 13 ne
   change rien à cela : unifier un analyseur **syntaxique** n'apporte aucune
   analyse **sémantique**.
5. Confirmation en recette de la compatibilité C17 des fonctions.
6. **97 tests hôte VS Code non exécutés**, le mutex de mise à jour restant
   bloquant. Ils ne sont **pas** présentés comme réussis. Le lot 13 ne modifie
   ni `extension/`, ni `test/vscode/`.

**La réussite des 2 662 tests automatisés mesure la conformité du code à ses
contrats. Elle ne mesure pas la complétion du modèle 1.**

---

## 6. Fichiers

### Créés

| Fichier | Lignes |
|---|---|
| `src/expressionCore.ts` | 303 |
| `test/expressionCore.test.mjs` | 110 |
| `scripts/differentiel.mjs` | 222 |
| `docs/LOT13_CONTRAT_ET_BILAN.md` | ce document |

### Modifiés

| Fichier | Nature |
|---|---|
| `src/expression.ts` | 134 → 34 lignes ; enveloppe du profil entier |
| `src/numericExpression.ts` | 179 → 37 lignes ; enveloppe du profil numérique |
| `src/condition.ts` | 277 → 58 lignes ; enveloppe du profil condition |
| `package.json` | enregistrement de `test/expressionCore.test.mjs` |
| `CLAUDE.md` | table d'architecture, état du dépôt |
| `docs/DOMAINE5_CONTRAT_PROPOSE.md` | décisions validées, lot 13 livré |

### Non modifiés

`src/translate.ts`, `src/planPlacement.ts`, `src/functionInstructions.ts`,
`src/numericInstructions.ts`, `src/calculationAdvisories.ts`,
`src/pedagogicalInformation.ts`, tout `extension/`, et **tous** les fichiers de
test existants, instantanés de compatibilité des lots 4, 5 et 6 compris.

---

## 7. Suite

Le lot 14 (le type `char`) attend la **revue de ce lot 13**. Son contrat est au
§3 de `docs/DOMAINE5_CONTRAT_PROPOSE.md` ; les décisions D2 à D6 qu'il met en
jeu sont approuvées. Aucune ligne du lot 14 n'est écrite.
