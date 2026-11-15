# Lot 19 — Aiguillage `switch` — bilan

**Livré le 15 novembre 2026**, en autonomie. Contrat :
`docs/LOT19_CONTRAT_PROPOSE.md`. **Le domaine 3 est désormais complet.**

Chiffres réels : **3 222 tests Node réussis, 0 échec** (3 149 au lot 18).
**1 330 823 comparaisons différentielles**, **374 extensions approuvées**,
**0 régression**, **0 capacité perdue**. **97 tests hôte non exécutés.**

---

## 1. Fichiers

**Créés** : `src/switchTarget.ts`, `src/switchInstructions.ts`,
`test/switch.test.mjs` (72 tests), `docs/LOT19_CONTRAT_PROPOSE.md`,
`docs/LOT19_BILAN.md`.

**Modifiés** : `src/translate.ts` (union, un code, cinq rendus,
`BLOCK_KINDS`, aiguillage), `src/planPlacement.ts` (branche contextuelle),
`src/pedagogicalInformation.ts` (cinq informations),
`scripts/differentiel.mjs`, `package.json`, `docs/CATALOGUE.md`,
`CLAUDE.md`.

**Non modifiés** : `enclosingStructures.ts`, `loopTarget.ts`,
`branchTarget.ts`, `functionContext.ts`, `expression.ts`,
`expressionCore.ts`, et tout `extension/`. **Aucun test historique
adapté** : le lot n'ouvre aucun refus existant.

---

## 2. Formulations et sorties

| Phrase | Code C |
|---|---|
| `Crée un aiguillage sur "jour".` | `switch (jour) { … }` |
| `Ajoute un cas pour la valeur 5.` | `case 5:` |
| `Ajoute un cas pour le caractère 'A'.` | `case 'A':` |
| `Ajoute le cas par défaut.` | `default:` |
| `Sors de l'aiguillage.` | `break;` |

---

## 3. Capacités du parseur

**Aucune modifiée.** C'est le premier lot depuis le lot 14 dans ce cas :
`switch` exige une expression entière, et le profil entier du lot 6 — gelé
depuis cinq lots — est exactement le bon. Il est réutilisé tel quel, et
ses diagnostics restent les siens : `1.5` donne
`INVALID_EXPRESSION_TOKEN`, `a > 0` donne
`UNSUPPORTED_EXPRESSION_OPERATOR`, `*p` donne `MISSING_OPERAND`.

---

## 4. Placement contextuel et symétrie

`src/switchTarget.ts` est calqué sur `loopTarget.ts` et bâti sur le
**même** `scanEnclosing`. Il remonte les frames jusqu'à la fonction et
s'arrête au premier `switch`.

La symétrie était le point à ne pas rater, et six tests la fixent :

| Situation | Phrase | Résultat |
|---|---|---|
| `switch` plus proche | `Sors de la boucle la plus intérieure.` | `BREAK_TARGET_IS_SWITCH` |
| boucle plus proche | `Sors de l'aiguillage.` | `BREAK_TARGET_IS_LOOP` |
| boucle plus proche, étiquette | `Ajoute un cas pour la valeur 5.` | **accepté** |

Le troisième cas est la raison du paramètre `labelOnly` : une étiquette
n'est pas un transfert, elle traverse une boucle sans que la boucle
devienne sa cible. Un test vérifie que `loopsCrossed` vaut bien 1 dans
cette situation, et qu'un aiguillage imbriqué est la cible la plus
intérieure.

---

## 5. Informations pédagogiques

`SWITCH_INTEGER_ONLY`, `SWITCH_FALLTHROUGH`, `CASE_NEEDS_STATEMENT`,
`DEFAULT_OPTIONAL`, `BREAK_LEAVES_SWITCH`.

`CASE_NEEDS_STATEMENT` est la plus importante, et je la signale comme une
**limite assumée** : C-A crée les blocs vides par principe, et une
étiquette seule avant `}` est le seul endroit où cette convention produit
un C qui **ne compile pas** en C17. L'information le dit au lieu de le
cacher.

`BREAK_LEAVES_SWITCH` nomme explicitement l'autre phrase, pour que
l'étudiant sache laquelle employer pour sortir d'une boucle.

---

## 6. Limites connues

- Aucune plage de `case` (`case 1 ... 5:`, extension GNU hors C17), aucun
  cas groupé en une phrase.
- Aucune vérification d'unicité des valeurs, de couverture, ni de présence
  d'un `default` : C-A ne relit pas le document.
- Une étiquette seule ne compile pas ; c'est **dit**, pas corrigé.
- `CASE_NEEDS_CONSTANT` refuse **tout** nom, y compris une constante
  d'énumération légitime. Sans résolution de symbole, C-A ne peut pas les
  distinguer. À réexaminer si les énumérations entrent dans le modèle 1.
- `goto` reste non livré, et c'est un choix documenté : il n'apparaît dans
  aucune notion des neuf domaines, et une commande qui le produirait irait
  contre la lisibilité enseignée.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; exercice intégrateur final.
