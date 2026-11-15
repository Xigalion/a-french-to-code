# Lot 26 — Portée des instructions : contrat

> **Correction de rang 1** de `docs/EVALUATION_MODELE1.md` §3.1, autorisée
> par la décision 1 du 15 novembre 2026. C'est le **premier lot qui retire
> délibérément des placements** jusqu'ici acceptés. Ce retrait est l'objet
> du lot, pas un effet de bord, et le §6 dit exactement ce qu'il recouvre.

---

## 1. La lacune, telle qu'elle a été observée

`planPlacement` vérifie le contexte de **sept** familles d'intentions :
retours (`resolveFunctionContext`), `break`/`continue` (`resolveLoopTarget`),
étiquettes et sortie d'aiguillage (`resolveSwitchTarget`), champs
(`resolveStructTarget`), branches `sinon` (`resolveBranchTarget`),
définitions de fonction (`resolveFileScope`), et les directives via
`inspectPrefix`.

**Toutes les autres tombent dans une branche finale qui n'inspecte que le
préfixe lexical.** Conséquence mesurée par l'exercice intégrateur : une
affectation, un affichage, un appel, un bloc, une boucle, une assertion ou
une libération posés à la **portée fichier** sont acceptés, insérés, et
produisent du C non compilable **sans un mot**.

C'est la seule lacune connue qui trahit la règle 4 de la philosophie —
« refus explicites » — puisque C-A ne refuse pas et ne prévient pas.

## 2. Ce que le lot corrige, et ce qu'il ne corrige pas

**Corrige** : une intention dont le rendu C est une **instruction
exécutable** n'est placée que dans un contexte où C17 autorise une
instruction. Sinon : refus explicite, diagnostic précis, aucun fragment.

**Ne corrige pas**, et le dit :

- aucune vérification de types, de symboles ni de portées du code
  utilisateur n'est introduite. Le lot répond à **une** question
  structurelle : « une instruction peut-elle figurer ici ? » ;
- une déclaration reste acceptée partout où elle l'était, y compris là où
  elle est douteuse — par exemple `int x = 0;` entre les accolades d'une
  structure, qui n'est pas un champ valide en C17. Ce n'est pas une
  question de portée et le lot n'y touche pas (limite résiduelle, §7) ;
- rien n'est déplacé. Le lot **refuse**, il ne relocalise jamais, et il ne
  propose pas la phrase correcte à recopier (règle 5).

## 3. Classement des 81 intentions du catalogue

### 3.1 Déclarations, définitions et directives — portée fichier **valide**

Placement **inchangé**, à la portée fichier comme dans un bloc.

`INCLUDE_STDIO`, `INCLUDE_STDLIB`, `INCLUDE_ASSERT`, `INCLUDE_LOCAL`,
`GUARD_OPEN`, `GUARD_CLOSE`, `DECL_INT`, `INIT_INT`, `DECL_CHAR`,
`INIT_CHAR`, `NUMERIC_DECL`, `NUMERIC_INIT`, `ARRAY_DECL`, `STRING_INIT`,
`DECL_POINTER`, `INIT_POINTER`, `CONST_DECL`, `STRUCT_DECL`, `STRUCT_VAR`,
`STRUCT_POINTER`, `TYPE_ALIAS`, `FUNC_PROTOTYPE`, `LINKAGE_DECL`,
`FILE_DECL` — **24**.

Justification C17 : une déclaration d'objet à la portée fichier est une
définition à durée de stockage statique, avec ou sans initialiseur
constant. `int age = 20;` y est valide ; C-A n'a donc aucune raison de le
refuser, et le refuser serait une perte de capacité.

### 3.2 Instructions exécutables — **corps de fonction exigé**

`ASSIGN_INT`, `ASSIGN_CHAR`, `ASSIGN_EXPRESSION`, `NUMERIC_ASSIGN`,
`ASSIGN_ADDRESS`, `ASSIGN_POINTED_INT`, `ASSIGN_POINTED_EXPRESSION`,
`ARRAY_ASSIGN_INT`, `ARRAY_ASSIGN_CHAR`, `ARRAY_ASSIGN_EXPRESSION`,
`MEMBER_ASSIGN_INT`, `MEMBER_ASSIGN_CHAR`, `MEMBER_ASSIGN_EXPRESSION`,
`PRINT_INT`, `PRINT_CHAR`, `PRINT_TEXT`, `PRINT_FORMATTED`, `PRINT_STRING`,
`PRINT_POINTED`, `NUMERIC_PRINT`, `ARRAY_PRINT`, `ARRAY_PRINT_CHAR`,
`MEMBER_PRINT`, `SIZEOF_PRINT`, `CALL`, `CALL_ASSIGN`, `SIZEOF_ASSIGN`,
`ALLOCATE`, `REALLOCATE`, `FREE`, `FILE_OPEN`, `FILE_CLOSE`,
`FILE_READ_INT`, `FILE_WRITE_INT`, `FILE_WRITE_TEXT`, `ASSERT`, `IF`,
`WHILE`, `DO_WHILE`, `FOR`, `SWITCH`, `FILE_AT_END` — **42**.

`MEMBER_ASSIGN_CHAR` figure dans cette liste bien qu'**aucune phrase
française ne l'atteigne** : le genre existe dans le type et dans le rendu,
mais aucun analyseur ne le construit. Il est classé pour que la partition
soit complète, et un test interdit de le présenter comme disponible.

Les trois `*_ASSIGN` de la mémoire et de `sizeof` sont ici parce que leur
rendu est une **affectation** (`n = sizeof(double);`, `p = malloc(…);`),
pas une déclaration. Les six intentions de bloc sont ici parce qu'une
instruction composée est une instruction.

### 3.3 Contexte déjà vérifié avant ce lot — **intactes**

`RETURN`, `RETURN_INT`, `RETURN_EXPRESSION`, `RETURN_NUMERIC`, `BREAK`,
`CONTINUE`, `CASE_INT`, `CASE_CHAR`, `CASE_DEFAULT`, `BREAK_SWITCH`,
`ELSE`, `ELSE_IF`, `STRUCT_FIELD`, `FUNC_DEF`, `MAIN` — **15**.

Aucune de leurs vérifications n'est touchée, ni affaiblie, ni doublée.

**24 + 42 + 15 = 81.** Un test vérifie cette partition : tout genre
d'instruction du catalogue appartient à **exactement un** des trois
ensembles, et les trois ensembles sont disjoints. Un lot futur qui ajoute
une intention sans la classer fera échouer ce test.

Les 81 genres sont ceux que le moteur déclare ; 80 seulement sont atteints
par une phrase du catalogue, pour la raison dite plus haut.

## 4. La règle de portée, exactement

Nouveau module `src/statementScope.ts`, construit sur le balayage partagé
`scanEnclosing`, sans le modifier.

    resolveStatementScope(text, lineStart)

1. balayage ; un rejet du balayage est propagé tel quel ;
2. **aucune accolade ouverte** → refus `STATEMENT_AT_FILE_SCOPE` ;
3. accolade la plus intérieure dont le genre n'est **pas** un contexte
   d'instruction (`function`, `block`, `if`, `else`, `while`, `for`, `do`,
   `switch`) → refus `UNSUPPORTED_ENCLOSING_CONTEXT`, code existant,
   portée sur l'accolade ;
4. **aucune trame de fonction** dans la pile → refus
   `STATEMENT_AT_FILE_SCOPE`, portée sur l'accolade ouverte ;
5. sinon → résolu.

**`checkStatementPosition` n'est volontairement pas appliqué.** Un corps de
boucle ou de `si` sans accolades est un emplacement **valide** pour une
instruction, et l'y refuser retirerait une capacité sans rapport avec la
portée. Même raison qu'au lot 12 pour le retour.

### Diagnostic

`STATEMENT_AT_FILE_SCOPE`, `reason: 'unsafe-location'`, deux messages selon
le cas, tous deux explicatifs et non correctifs :

- sans aucune accolade ouverte :
  « En C17, une instruction exécutable n'existe que dans le corps d'une
  fonction. À la portée fichier, seules les déclarations, les définitions
  et les directives sont valides. » — portée `[lineStart, lineStart)` ;
- avec des accolades ouvertes mais aucune fonction :
  « Aucune fonction n'englobe cette ligne : une instruction exécutable ne
  peut pas y figurer. » — portée sur l'accolade la plus intérieure.

## 5. Fraîcheur du plan : décision argumentée

Les statements **ne sont pas** ajoutés à la condition `contextual` de
`validatePlan`, et ce n'est pas un oubli.

`validatePlan` refuse déjà tout plan dont `base.text` diffère du document :
**aucune** modification du document ne peut donc passer. La reconstruction
contextuelle sert aux reconnaisseurs qui **capturent une cible dans le
plan** (trame de boucle, d'aiguillage, de structure, de fonction) et dont
l'identité doit être réétablie. Une instruction ordinaire ne capture rien.

Les y ajouter obligerait à poser un `recognizerContext` sur 43 intentions,
donc à **changer la forme structurée du plan** de la moitié du catalogue,
pour une garantie déjà acquise par l'égalité du texte. Un test prouve
qu'une modification de la portée entre l'aperçu et l'insertion est bien
refusée, par `STALE_PLAN`.

## 6. Ce que le lot retire — annoncé, pas découvert

Première fois depuis le lot 1 qu'un lot **retire** des placements. Ce que
cela recouvre, exhaustivement :

| Situation | Avant | Après |
|---|---|---|
| instruction exécutable, aucune accolade ouverte | insérée | `STATEMENT_AT_FILE_SCOPE` |
| instruction exécutable, accolades ouvertes sans fonction | insérée | `STATEMENT_AT_FILE_SCOPE` |
| instruction exécutable entre les accolades d'une structure | insérée | `UNSUPPORTED_ENCLOSING_CONTEXT` |
| tout le reste | inchangé | inchangé |

`differentiel.mjs --no-loss` **doit** se déclencher sur ce lot, et
beaucoup : c'est le signe que la correction agit. Le bilan listera les
entrées concernées avec `--all` et vérifiera, une par une, qu'aucune n'est
un placement que C17 autorise. Une perte **non** couverte par le tableau
ci-dessus serait une régression.

Aucune **traduction** ne change : `translate()` est intact, et les
instantanés gelés des lots 4, 5 et 6 ne portent que sur des traductions.

## 7. Limites résiduelles, après ce lot

- une déclaration reste plaçable entre les accolades d'une structure, où
  seule une déclaration de champ est valide ;
- aucune vérification de symboles : `Affecte la valeur 5 à x.` dans une
  fonction où `x` n'existe pas reste acceptée ;
- `sinon` et `sinon si` restent vérifiés par leur reconnaisseur de chaîne,
  qui ne demande pas de fonction englobante ; une chaîne `si` écrite à la
  main à la portée fichier garderait donc son `sinon`. Le `si` lui-même est
  désormais refusé là, ce qui ferme le chemin par C-A.

## 8. Plan de tests

1. **partition** : les 81 genres classés une fois et une seule.
2. **refus** : pour chacune des 43 instructions, un refus à la portée
   fichier, code et portée vérifiés.
3. **acceptation inchangée** : les mêmes 43 dans un corps de `main`.
4. **déclarations** : les 24 toujours acceptées à la portée fichier.
5. **contextes valides** : instruction dans un bloc nu, dans un `si`, une
   boucle, un `switch`, un corps de boucle **sans accolades**.
6. **structure** : instruction entre les accolades d'une `struct` refusée.
7. **intactes** : les 14 familles déjà vérifiées gardent diagnostic,
   message et portée identiques.
8. **fraîcheur** : portée modifiée après l'aperçu → `STALE_PLAN`.
9. **hôte** : un geste de bout en bout montrant le refus sans insertion.
10. **différentiel** contre le lot 25, audité intégralement avec `--all`.
