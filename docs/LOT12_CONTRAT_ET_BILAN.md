# Lot 12 — Fonctions et décomposition : contrat exécuté et bilan

**Date : 12 novembre 2026.** Ouverture du **domaine 4**.

**Statut de l'autorisation.** Le porteur lève le périmètre restreint du
sprint initial : le cadre strict visait à observer la méthode de travail,
et, les tests étant jugés concluants, il accorde une page blanche et
annonce qu'il organisera lui-même un test final plus complexe pour une
pédagogie de base. Le passage à un modèle moins restrictif — les paliers de
liberté — reste prévu **après** et n'est pas engagé ici.

Aucun contrat préalable n'existait pour ce domaine. Ce document est donc à
la fois le contrat et le bilan, et il isole au §2 les décisions qui méritent
relecture.

Dépendances : lots 1 à 11D livrés.

---

## 1. Contrat livré, en trois incréments

### 12A — Définition de fonction et `return`

    Crée une fonction nommée {nom} qui ne retourne rien.
    Crée une fonction nommée {nom} qui retourne un {type}.

```c
// Crée une fonction nommée somme qui retourne un int.
int somme(void) {
    
}
```

Types de retour pris en charge : `int`, `unsigned int`, `float`, `double`,
plus l'absence de retour (`void`). Le corps est créé **vide**, curseur à
l'intérieur. `(void)` est écrit explicitement : une liste vide signifierait
autre chose en C et n'est jamais produite.

Quatre formulations de retour, calquées sur les précédents historiques :

| Formulation | Code produit | Profil |
|---|---|---|
| `Retourne.` | `return;` | — |
| `Retourne la valeur {entier}.` | `return 0;` | entier littéral, comme `Affecte la valeur … à …` |
| `Retourne le résultat de "{expr}".` | `return (a + 1);` | profil entier du lot 6 |
| `Retourne le résultat numérique de "{expr}".` | `return (7.0 / 2);` | profil numérique du lot 7 |

La distinction « résultat » / « résultat numérique » est **exactement** celle
des enveloppes d'affectation existantes. Aucune convention nouvelle.

### 12B — Paramètres

    … et prend un {type} nommé {nom} et un {type} nommé {nom}.

```c
// Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.
int somme(int a, int b) {
    
}
```

Chaque paramètre est écrit **en entier** : aucun type n'est partagé entre
deux paramètres, et `et prend un int nommé a et b.` est refusé. Le mot est
`nommé` (masculin, accordé au type), distinct du `nommée` de la fonction.
Un nom de paramètre répété est refusé (`DUPLICATE_PARAMETER_NAME`) :
c'est une erreur C détectable **localement**, sans aucune table de symboles.
Borne documentée : **16 paramètres**.

### 12C — Appels

| Formulation | Code produit |
|---|---|
| `Appelle {nom}.` | `f();` |
| `Appelle {nom} avec "{expr}" et "{expr}".` | `somme(2, 3);` |
| `Affecte à {cible} le résultat de l'appel de {nom}.` | `r = f();` |
| `Affecte à {cible} le résultat de l'appel de {nom} avec "{expr}".` | `r = f(2);` |

Les arguments sont des expressions numériques délimitées par des
guillemets, jointes par `et`. Borne documentée : **16 arguments**, qui
partagent **un seul budget de 1 024 tokens**, comme les trois clauses du
`for`. Les deux apostrophes de `l'appel` sont acceptées, comme au lot 11D.

---

## 2. Décisions à relire

### 2.1 Le contrat de retour est vérifié, au placement

`Retourne.` dans une fonction qui déclare un type est **refusé**
(`RETURN_NEEDS_VALUE`) ; retourner une valeur depuis une fonction `void`
l'est aussi (`RETURN_IN_VOID_FUNCTION`).

C'est le même raisonnement qu'au lot 11D pour `break` face à un `switch` :
la phrase de l'étudiant serait **fausse**, donc elle est refusée plutôt que
traduite. La vérification a lieu au **placement**, jamais à la traduction,
parce qu'elle dépend du document — exactement comme le rattachement d'une
branche ou la cible d'un transfert.

**Ce n'est pas un vérificateur de types.** Le type de retour est lu
syntaxiquement dans **un** en-tête de fonction. Rien ne vérifie le type de
l'expression retournée : une fonction `int` qui retourne `1.5` est traduite
et placée, et l'étudiant voit l'erreur C.

| Contexte | Décision |
|---|---|
| Aucune fonction englobante | `NO_ENCLOSING_FUNCTION` |
| Type déclaré absent ou non pris en charge (`long`, `char*`, `static int`) | `UNSUPPORTED_RETURN_TYPE` |
| Position hors instruction | `NOT_A_STATEMENT_POSITION` |
| Structure englobante non classifiable | `UNSUPPORTED_ENCLOSING_CONTEXT` |

La fonction retenue est **la plus proche encore ouverte**, jamais une
fonction refermée. Un corps de boucle sans accolades **est** une position
valable pour un `return`, contrairement à un transfert : un `return` ne
dépend pas de la boucle qui l'entoure.

### 2.2 Aucune résolution de symbole pour les appels

C-A ne cherche **ni la déclaration de la fonction appelée, ni son nombre de
paramètres, ni leurs types**. Un appel d'arité incohérente est traduit, pas
refusé : c'est une erreur C que l'étudiant doit voir.

C'est un choix conservateur assumé. Le faire supposerait de résoudre des
symboles à travers les en-têtes, les déclarations anticipées et l'ordre des
définitions — soit l'analyse générale que le projet refuse depuis le début.
L'information passive `CALL_NOT_RESOLVED` le dit explicitement à
l'étudiant.

### 2.3 Une définition de fonction imbriquée n'est pas refusée

Placée dans un corps, une définition de fonction produit du C invalide.
Elle est néanmoins traduite et placée, **par cohérence avec
`Crée la fonction principale.`**, qui n'a jamais vérifié sa portée non plus,
et avec la règle du lot 9 : une erreur C n'est pas une impossibilité de
placement.

### 2.4 Mutualisation du balayage contextuel

Le lot 11D avait son propre balayage. Un troisième usage arrivant, la
tokenisation, l'appariement des délimiteurs et la **classification des
accolades** passent dans `src/enclosingStructures.ts`, partagé par
`loopTarget` (11D) et `functionContext` (12A).

`loopTarget` **mappe** les codes génériques du module partagé vers ceux que
son contrat a publiés (`TRANSFER_SCAN_LIMIT`, `UNSUPPORTED_LOOP_CONTEXT`),
pour ne pas modifier un contrat livré. Les 105 tests du lot 11D passent
inchangés. `branchTarget.ts` (lot 10) reste **entièrement à part**, avec ses
propres budgets : il répond à une autre question.

### 2.5 Le canal pédagogique n'est plus réservé aux conditions

`src/conditionInformation.ts` devient `src/pedagogicalInformation.ts`, et
`explainConditions` devient `explainInstruction`. Les entrées existantes et
leur ordre sont inchangés (vérifié par test). Quatre motifs ajoutés :

| Code | Porté par | Contenu |
|---|---|---|
| `FUNCTION_SCOPE` | `FUNC_DEF` | corps vide, aucun `return` ajouté, durée de vie des variables locales |
| `PARAMETERS_BY_VALUE` | `FUNC_DEF` avec au moins un paramètre | un paramètre reçoit une **copie** ; le modifier ne modifie pas la variable de l'appelant |
| `RETURN_ENDS_FUNCTION` | les quatre retours | `return` termine l'exécution ; la suite du corps n'est pas exécutée |
| `CALL_NOT_RESOLVED` | `CALL`, `CALL_ASSIGN` | arguments évalués avant l'entrée, dans un ordre **non spécifié** par C17 ; aucune résolution |

Tous passifs, aucun n'incrémente le compteur d'avertissements.
`PARAMETERS_BY_VALUE` couvre la compétence centrale du domaine 4.

### 2.6 Deux corrections d'un manque antérieur

Les avertissements du lot 8 ne couvraient **ni les expressions de retour ni
les arguments d'appel**. C'est corrigé : les deux motifs du lot 8 sont
désormais recherchés dans toutes les expressions de toutes les intentions
qui en portent. Aucun nouveau motif n'a été ajouté.

---

## 3. Fichiers

| Fichier | Nature |
|---|---|
| `src/enclosingStructures.ts` | **nouveau** — balayage et classification partagés |
| `src/functionContext.ts` | **nouveau** — fonction englobante et type de retour déclaré |
| `src/functionInstructions.ts` | **nouveau** — enveloppes de définition, de retour et d'appel |
| `src/pedagogicalInformation.ts` | renommé depuis `conditionInformation.ts`, quatre motifs ajoutés |
| `src/loopTarget.ts` | réécrit sur le balayage partagé, codes du 11D préservés par mappage |
| `src/translate.ts` | sept intentions, rendus, aiguillage |
| `src/planPlacement.ts` | contrat de retour, `functionContext` dans le plan, fraîcheur |
| `src/calculationAdvisories.ts` | retours et arguments d'appel inspectés |
| `extension/src/session.ts` | la cible affichée couvre la fonction d'un retour |
| `test/functions.test.mjs` | **nouveau** — 111 tests (12A) |
| `test/callsAndParameters.test.mjs` | **nouveau** — 71 tests (12B, 12C) |
| `test/vscode/suite.cjs` | 3 tests hôte ajoutés |

Aucune dépendance ajoutée. Aucun instantané de compatibilité régénéré.
`src/branchTarget.ts`, `src/condition.ts`, `src/expression.ts`,
`src/placementLexical.ts` : **inchangés**.

## 4. Résultats de tests

### Exécuté et vérifié

```
npm run check
  → aucun diagnostic TypeScript
  ℹ tests 2583
  ℹ pass 2583
  ℹ fail 0
  ℹ skipped 0
```

**2 583 tests Node réussis.** Les 2 402 des lots 1 à 11D sont inclus et
inchangés, le renommage du module d'information compris.

Couverture : 12 définitions exactes avec et sans point final, vérifiant
l'absence de `return`, de `;` et de liste vide ; conservation de la phrase ;
`Crée la fonction principale.` toujours distincte ; 16 refus de définition ;
9 rendus de retour sur les quatre formulations ; les deux profils
d'expression ; 17 refus de retour ; budgets et avis des retours ; 9 contrats
de retour respectés et 17 refusés ; type lu sans analyse de type ; fonction
englobante la plus proche ; pureté de `resolveFunctionContext` ; péremption
quand le type déclaré change ; placement sur six combinaisons
LF/CRLF × indentation ; définition imbriquée acceptée ; séquence complète
avec document final exact ; les quatre motifs pédagogiques et leur
ordonnancement ; 12 refus de paramètre ; bornes 16 paramètres et
16 arguments ; budget partagé des arguments ; avis du lot 8 sur les
arguments ; arité incohérente traduite ; décomposition complète en deux
fonctions avec exactement deux `return` demandés ; sessions ; 26 sorties
historiques réaffirmées.

### Non exécuté — toujours bloqué

La suite hôte VS Code reste inexécutable : mise à jour de VS Code en
attente sur la machine, mutex Inno Setup `vscode-updating` détenu par
l'instance en cours. Trois tentatives, la dernière à 10:24. Les 3 tests
hôte écrits pour le lot 12 **n'ont jamais été exécutés**, pas plus que les
25 du lot 11 ni les 68 du lot 10. Reprise : redémarrer VS Code, puis
`npm run test:vscode`. Résultat attendu, **non vérifié** : 96 tests hôte.

## 5. Limites

- **Aucune résolution de symbole** : ni existence, ni arité, ni types des
  arguments d'un appel.
- **Aucune vérification de type de retour contre l'expression retournée.**
  Seul l'accord entre la **forme de la phrase** et le type **déclaré** est
  vérifié.
- Aucune vérification de portée : une variable utilisée hors de sa portée
  est traduite, et une définition de fonction imbriquée est acceptée.
- Aucune analyse d'accessibilité : `RETURN_ENDS_FUNCTION` dit que la suite
  du corps n'est pas exécutée, sans jamais désigner du code mort.
- Une fonction non `void` sans `return` atteint n'est pas signalée : C-A
  n'analyse pas les chemins de son corps.
- L'ordre d'évaluation des arguments n'est pas spécifié par C17 ; C-A
  l'énonce et ne le choisit pas.
- Types limités à `int`, `unsigned int`, `float`, `double`, `void`. Pas de
  pointeur, de tableau, de `struct`, de `char`, de `long`, de `static`.
- Aucune garantie de compilation ni de sûreté du C produit.

## 6. Reste ouvert

1. **Suite hôte VS Code inexécutable** — bloque la confirmation de 96 tests.
2. Recette GCC complète du domaine « Expressions et calculs ».
3. [Recette manuelle du domaine 3](RECETTE_DOMAINE3.md).
4. [Recette manuelle du domaine 4](RECETTE_DOMAINE4.md) : protocole rédigé,
   **non effectuée**. Elle prépare le test final plus complexe annoncé par le
   porteur.
5. Qualification des avertissements hôte `mutex already exists`,
   DEP0168/N-API.
6. Domaines 5 à 9 : aucun contrat.
7. Paliers de liberté : le modèle moins restrictif reste à spécifier, après
   le test de pédagogie de base.
