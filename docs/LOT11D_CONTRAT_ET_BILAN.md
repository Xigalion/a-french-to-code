# Lot 11D — `break` et `continue` : contrat exécuté et bilan

**Date : 12 novembre 2026.**

**Statut de l'autorisation.** Même délégation que pour les lots
[11B](LOT11B_CONTRAT_ET_BILAN.md) et [11C](LOT11C_CONTRAT_ET_BILAN.md).
Contrat dérivé du §4 (formulations candidates) et du **§6 entier** du
[contrat du lot 11](LOT11_CONTRAT_PROPOSE.md), qui énumère précisément ce
que le reconnaisseur contextuel doit établir.

Dépendances : lots [11A](LOT11A_BILAN.md), 11B et 11C livrés — les trois
formes de boucle existent, donc les trois points de reprise peuvent être
enseignés.

---

## 1. Contrat

### Formulations et sorties exactes

    Sors de la boucle la plus intérieure.
    Passe à l’itération suivante de la boucle la plus intérieure.

```c
// Sors de la boucle la plus intérieure.
break;
```
```c
// Passe à l’itération suivante de la boucle la plus intérieure.
continue;
```

Ce sont des **instructions simples**, pas des blocs : aucun curseur
intérieur, et une ligne de saisie ordinaire suit l'insertion, comme pour
toute instruction simple.

**Ni l'un ni l'autre n'a le sens de `return`.** Aucun `goto` n'est jamais
produit, en aucune circonstance.

### La règle C17 qui commande tout

`break` quitte le **plus petit `switch` ou la plus petite boucle**
englobante. `continue` concerne la **plus petite boucle** englobante.

Conséquence directe : un `switch` écrit à la main entre le curseur et la
boucle **empêche `break;` de réaliser la phrase « sors de la boucle »**. Ce
cas est **refusé**. Il n'est ni réécrit en `goto`, ni traité en supposant
que `switch` est absent parce que C-A ne le génère pas.

`continue` placé dans un `switch` situé dans une boucle vise bien la
boucle : c'est accepté, parce que le reconnaisseur sait l'établir.

### Décision de chaque cas

| Contexte de la ligne cible | `break` | `continue` |
|---|---|---|
| Corps bracé de `while` / `for` / `do` | accepté | accepté |
| `if`, `else` ou bloc nu dans un corps de boucle | accepté | accepté |
| Boucle intérieure bracée dans une boucle extérieure | **boucle intérieure** | **boucle intérieure** |
| `switch` bracé dans une boucle | refusé `BREAK_TARGET_IS_SWITCH` | accepté, cible la boucle |
| `switch` sans boucle englobante | refusé `BREAK_TARGET_IS_SWITCH` | refusé `LOOP_TARGET_NOT_FOUND` |
| Aucune boucle englobante, ou corps de fonction seul | refusé `LOOP_TARGET_NOT_FOUND` | refusé `LOOP_TARGET_NOT_FOUND` |
| Corps **sans accolades** d'une boucle ou d'un `switch` | refusé `UNBRACED_LOOP_BODY` | refusé `UNBRACED_LOOP_BODY` |
| Position qui n'est pas une position d'instruction | refusé `NOT_A_STATEMENT_POSITION` | idem |
| Structure englobante non classifiable | refusé `UNSUPPORTED_LOOP_CONTEXT` | idem |
| Au-delà des bornes de reconnaissance | refusé `TRANSFER_SCAN_LIMIT` | idem |

Un `do {` dont le `while (…) ;` final n'a pas encore été écrit **est** une
cible syntaxique valable : le ciblage de `break`/`continue` est purement
syntaxique, et le C incomplet reste l'affaire de l'étudiant.

### Diagnostics de compréhension

Les deux formulations entrent dans la table de règles historique, donc
elles héritent de ses diagnostics : `INCOMPLETE_INSTRUCTION` quand la
phrase s'arrête trop tôt, `UNKNOWN_FORMULATION` sur le mot fautif,
`UNEXPECTED_TEXT` pour un ajout. `Sors de la boucle la plus extérieure.`
est refusé sur « extérieure » : C-A ne propose pas de cible de rechange.

### Pédagogie

Les transferts **n'ont ni condition, ni avis de calcul, ni information
passive**. Les trois points de reprise s'enseignent par les informations
déjà livrées sur les trois formes de boucle (`WHILE_PRETEST`,
`DO_WHILE_POSTTEST`, `FOR_CLAUSE_ORDER`) et par la **cible affichée** avant
confirmation : « Cible : ligne N — … », qui nomme la structure quittée ou
reprise. L'étudiant voit donc explicitement quelle boucle est visée avant
d'insérer.

**C-A ne déplace jamais une progression manuelle** et n'en ajoute jamais
avant un `continue`. Un `continue` placé au-dessus d'une progression écrite
en fin de corps la sautera : c'est un fait à étudier, pas un défaut à
corriger automatiquement (vérifié par test).

---

## 2. Le reconnaisseur contextuel

Nouveau module **`src/loopTarget.ts`**, distinct de `src/branchTarget.ts`.

**Pourquoi un module séparé** : le §6 l'exige explicitement, et les deux
recognisseurs répondent à deux questions différentes (fin de chaîne `if`
contre structures englobantes). Les mutualiser aurait fait dépendre le
lot 10, livré et testé, d'un code réécrit pour le lot 11D. Le duplicata de
balayage est assumé ; `branchTarget.ts` est **inchangé**.

Ce qu'il établit, conformément au §6 :

1. **Pile de structures englobantes et de délimiteurs.** Chaque `{` est
   **classifié** par les tokens qui le précèdent : `while`/`for`/`switch`/`if`
   via sa parenthèse appariée, `do`, `else`, bloc nu après `{`, `}`, `;` ou
   `:`, définition de fonction au seul niveau fichier. Tout le reste est
   `unsupported`.
2. **Boucles bracées identifiées**, jamais une profondeur d'accolades ni le
   dernier mot `while` rencontré. Une boucle déjà fermée n'est plus une
   cible, et un `while` en commentaire ou dans une chaîne n'en est pas une
   (vérifié par test).
3. **Frontières de fonction et de `switch`.** Le parcours s'arrête à la
   fonction englobante ; un `switch` arrête `break` et est traversé par
   `continue`.
4. **Commentaires et littéraux ignorés**, y compris `}` dans un commentaire,
   dans un caractère ou dans une chaîne.
5. **Bornes propres** : `MAX_TRANSFER_UNITS` 1 048 576,
   `MAX_TRANSFER_TOKENS` 50 000, `MAX_TRANSFER_DEPTH` 128. Ce sont des
   budgets distincts de ceux du reconnaisseur de branches.
6. **Refus de l'ambiguïté et du contexte non pris en charge** : délimiteurs
   non appariés, délimiteur resté ouvert, structure non classifiable,
   position hors instruction, corps sans accolades, trigraphes, continuations
   de ligne, directives autres qu'une inclusion simple, NUL, littéral non
   terminé.
7. **Aucune recherche de cible depuis l'indentation.** L'indentation de la
   ligne cible n'est jamais lue (vérifié par test : une boucle intérieure
   fermée n'est pas visée même si l'indentation la suggère).

Le **suffixe** du document n'est pas balayé : les structures englobantes sont
entièrement déterminées par les accolades restées ouvertes avant la ligne
cible. C'est une différence assumée avec le lot 10, qui devait refuser une
insertion avant un `else` existant.

### Fraîcheur du plan

`validatePlan` reconstruit le plan de transfert sur exactement la ligne
confirmée et compare la structure canonique, y compris la cible résolue.
Transformer la boucle en `switch` après l'aperçu rend donc le plan périmé
(vérifié par test, moteur et hôte).

---

## 3. Décisions à relire

1. **Les deux apostrophes sont acceptées.** `l’itération` (U+2019) et
   `l'itération` (U+0027) sont reconnues. Ce n'est pas une tolérance de
   synonyme : c'est le même caractère pour un lecteur, et seul le clavier
   décide lequel est produit. La comparaison des mots fixes normalise donc
   l'apostrophe ; aucune formulation historique n'en contient, donc aucune
   n'est affectée. La phrase reste conservée avec l'apostrophe réellement
   saisie.
2. **`BREAK_TARGET_IS_SWITCH` est un refus, pas un avertissement.** La
   phrase demandée serait fausse ; produire `break;` en signalant que ça ne
   fait pas ce qui est demandé revient à laisser C-A écrire du code dont il
   sait qu'il trahit l'intention.
3. **`NOT_A_STATEMENT_POSITION`** est une vérification nouvelle : la ligne
   cible doit suivre `{`, `}`, `;`, `:`, `else` ou une parenthèse fermante
   de `if`. Elle ne concerne que les transferts ; aucune intention
   historique ne la subit.
4. **Le corps sans accolades est refusé, pas complété.** C-A n'ajoute pas
   d'accolades à une boucle écrite à la main.

---

## 4. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/loopTarget.ts` | **nouveau** — reconnaisseur contextuel borné |
| `src/translate.ts` | intentions `BREAK` et `CONTINUE`, deux règles, normalisation de l'apostrophe |
| `src/planPlacement.ts` | résolution de cible de transfert, `loopTarget` dans le plan, fraîcheur |
| `extension/src/session.ts` | la cible affichée couvre aussi la boucle visée |
| `test/transfer.test.mjs` | **nouveau** — 105 tests |
| `test/loops.test.mjs`, `test/doWhile.test.mjs`, `test/forLoop.test.mjs` | les transferts quittent les listes « non livré » |
| `test/vscode/suite.cjs` | 5 tests hôte ajoutés |
| `package.json` | `test/transfer.test.mjs` ajouté à `npm test` |

`src/branchTarget.ts`, `src/condition.ts`, `src/placementLexical.ts` :
**inchangés**. Aucune dépendance ajoutée. Aucun instantané de compatibilité
régénéré.

## 5. Résultats de tests

### Exécuté et vérifié

```
npm run check
  → aucun diagnostic TypeScript
  ℹ tests 2402
  ℹ pass 2402
  ℹ fail 0
  ℹ skipped 0
```

**2 402 tests Node réussis.** Bases des lots 11A à 11C incluses et
inchangées.

Couverture de `test/transfer.test.mjs` : quatre rendus exacts avec et sans
point final, vérifiant l'absence de curseur intérieur, de `return`, de
`goto` et d'accolade ; conservation de la phrase ; les deux apostrophes ;
14 refus de compréhension, dont « la plus extérieure », « interieure » sans
accent, « Sors du switch » et « Sors de la fonction » ; absence de
condition, d'avis et d'information ; **20 contextes acceptés** avec forme de
boucle et nombre de `switch` traversés vérifiés ; **28 contextes refusés**
avec leur code ; cible non déduite de l'indentation ; cible non déduite du
dernier mot `while` malgré un commentaire et une chaîne qui en contiennent ;
`do` sans `while` final ; les trois bornes du reconnaisseur ; indépendance
vis-à-vis du reconnaisseur de branches dans les deux sens ; placement sur
six combinaisons LF/CRLF × indentation avec document final exact ; aucun
code adjacent absorbé ; plan périmé quand la boucle devient un `switch` ;
quatre falsifications de plan ou de traduction ; `continue` accepté dans
les trois formes ; progression manuelle non déplacée ; impossibilité de
sortir de la boucle extérieure par un `break` intérieur ; parcours de
session et session périmée ; `switch`, `return` et `goto` toujours non
livrés ; onze sorties historiques réaffirmées ; une chaîne de branches
toujours constructible. S'y ajoutent **13 contextes adverses** : boucle
intérieure refermée dans un `do`, chaîne `if`/`else if`/`else` complète,
`for (;;)`, `while(a){` sans espaces, opérateur ternaire, commentaires de
ligne et de bloc contenant une accolade, BOM, et enfin `goto` et étiquettes
— qui ne changent pas le ciblage, celui-ci étant purement syntaxique.

### Non exécuté — toujours bloqué

La suite hôte VS Code reste inexécutable : mise à jour de VS Code en
attente sur la machine, mutex Inno Setup `vscode-updating` détenu par
l'instance en cours. Les 5 tests hôte écrits pour le 11D **n'ont jamais été
exécutés**, pas plus que ceux des lots 11A, 11B, 11C et 10. Reprise :
redémarrer VS Code, puis `npm run test:vscode`. Résultat attendu, **non
vérifié** : 93 tests hôte.

## 6. Limites

- Le ciblage est **syntaxique et borné**. Il ne prouve pas que la ligne
  sera atteinte, ni que la boucle terminera, ni que le programme est
  correct.
- Un contexte refusé n'est pas un contexte interdit en C : c'est un
  contexte que ce reconnaisseur ne sait pas établir. Le refus protège
  l'étudiant d'une insertion dont le sens ne serait pas celui de sa phrase.
- `switch` n'est pas générable par C-A, mais il est **reconnu** s'il a été
  écrit à la main, précisément parce qu'il change le sens de `break`.
- `goto` n'est ni généré ni interprété. Une étiquette dans le document ne
  change pas le ciblage de `break`/`continue`, qui est purement syntaxique.
- `continue` dans un `do/while` atteint la condition finale ; dans un `for`
  il atteint la mise à jour puis le test. Ces faits sont enseignés par les
  informations des lots 11A à 11C et par la cible affichée ; **C-A ne les
  vérifie pas à l'exécution** et n'exécute aucun programme.
- Aucune vérification de types, symboles ou portées ; aucune garantie de
  compilation ni de sûreté du C produit.
