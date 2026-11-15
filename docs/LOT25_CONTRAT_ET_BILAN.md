# Lot 25 — Fiabilité et maîtrise avancée — contrat et bilan

**Contrat rédigé puis exécuté le 15 novembre 2026**, en autonomie.
**Le domaine 9 est couvert, et les neuf domaines du modèle 1 le sont
donc tous.**

Chiffres réels : **3 580 tests Node réussis, 0 échec** (3 527 au lot 24).
**1 334 392 comparaisons différentielles**, **278 extensions**, **0
régression**, **0 capacité perdue**. **97 tests hôte non exécutés.**

---

## 1. Contrat

| Formulation française | Code C produit | Information |
|---|---|---|
| `Inclue la bibliothèque assert.h.` | `#include <assert.h>` | — |
| `Vérifie que "x > 0".` | `assert(x > 0);` | ASSERT_DISABLED_BY_NDEBUG, ASSERT_NOT_ERROR_HANDLING |
| `Déclare une constante de type int nommée MAX avec le résultat de "100".` | `const int MAX = 100;` | CONST_IS_NOT_A_MACRO |

### L'assertion réutilise le profil condition du lot 10

C'est le choix central du lot, et il paie immédiatement :
`Vérifie que "x = 0".` est refusé avec `ASSIGNMENT_IN_CONDITION`. C'est
**exactement** le bug que l'assertion est censée aider à éviter, et il est
attrapé avant d'être écrit, par un diagnostic qui existait déjà.

`ASSERT` a été ajouté à `instructionCondition`, donc sa condition reçoit
aussi les **avertissements de calcul du lot 8** et les **informations
d'opérateur du lot 10** : `Vérifie que "1 / 0 > 0".` produit
`INTEGER_ZERO_DIVISOR`, et `Vérifie que "a && b".` porte
`SHORT_CIRCUIT_AND` après les deux faits propres à `assert`. Deux tests
le fixent.

### Informations

| Code | Fait énoncé |
|---|---|
| `ASSERT_DISABLED_BY_NDEBUG` | `assert` **disparaît** si `NDEBUG` est défini, et la condition n'est alors même pas évaluée : n'y mettez jamais un calcul dont le programme a besoin |
| `ASSERT_NOT_ERROR_HANDLING` | sert à détecter une **erreur de programmation**, pas à traiter une erreur d'exécution attendue ; une entrée invalide se traite par une condition ordinaire |
| `CONST_IS_NOT_A_MACRO` | `const` qualifie un **type** : l'objet existe, a une adresse et un type, contrairement à une macro ; le modifier par un autre chemin est indéfini |

---

## 2. Le conflit avec un instantané figé, et ma décision

`limits.h` et ses macros auraient été la pièce « portabilité » naturelle
du domaine 9 : écrire `INT_MAX` plutôt que `2147483647` est précisément la
leçon.

**Je ne les ai pas livrés, et voici pourquoi.**
`test/lot6-compatibility.json` gèle `Inclue la bibliothèque limits.h.` et
`Inclue la bibliothèque float.h.` comme des **refus**, message compris.
Les accepter voudrait dire amender un contrat gelé.

J'ai d'abord implémenté `limits.h` et les macros ; le test d'instantané du
lot 6 a échoué. Plutôt que de modifier l'instantané — ce que `CLAUDE.md`
interdit explicitement, et ce qu'une tentative antérieure au lot 21 s'est
vu refuser —, j'ai **retiré la capacité**.

Le raisonnement : livrer `Affiche la limite maximale du type int.` sans
pouvoir inclure `limits.h` produirait du C qui **ne compile pas**. Entre
une capacité amputée et une absence documentée, l'absence est plus
honnête. Un commentaire dans `src/reliabilityInstructions.ts` le dit à
l'endroit où la capacité manque, et un test vérifie que les deux en-têtes
restent refusés **et** qu'aucune formulation ne produit une macro de
limite.

`assert.h` a pu être livré précisément parce qu'il n'apparaît dans **aucun**
instantané. La différence est documentaire, pas technique.

**Décision demandée au fondateur** — c'est la même que celle du lot 21,
§2, et elle se formule maintenant précisément :

> Les instantanés des lots 4, 5 et 6 gèlent le message de
> `UNSUPPORTED_HEADER` et le refus de `limits.h` et `float.h`. Trois
> en-têtes sont désormais pris en charge (`stdio.h`, `stdlib.h`,
> `assert.h`) par des branches distinctes, et le message gelé en
> sous-estime deux. Autorises-tu un amendement **explicite et minimal** de
> ces instantanés — uniquement les entrées d'en-tête — pour unifier la
> règle d'inclusion et ouvrir `limits.h` et `float.h` ?

Tant que la réponse n'est pas donnée, la portabilité reste enseignée par
les informations déjà livrées : `SIZEOF_IS_BYTES` (taille définie par
l'implémentation), `STRUCT_LAYOUT` (remplissage), `CHARACTER_STORAGE`
(signe de `char`), `POINTER_ARITHMETIC_LIMITS` et
`OUT_OF_BOUNDS_UNDEFINED`.

---

## 3. Fichiers

**Créés** : `src/reliabilityInstructions.ts`,
`test/reliability.test.mjs` (53 tests), ce document.

**Modifiés** : `src/translate.ts` (union, un code, quatre rendus,
`instructionCondition`, aiguillage), `src/pedagogicalInformation.ts`,
`scripts/differentiel.mjs`, `package.json`, `docs/CATALOGUE.md`,
`CLAUDE.md`.

**Non modifiés** : `expressionCore.ts` et les quatre profils,
`planPlacement.ts`, tous les reconnaisseurs contextuels, **les instantanés
de compatibilité**, et tout `extension/`. **Aucun test historique adapté.**

---

## 4. Limites connues

- Ni `limits.h`, ni `float.h`, ni aucune macro de limite ; voir §2.
- Ni `static_assert`, ni `_Static_assert`.
- Ni `errno`, ni `perror`, ni `strerror`.
- Ni test automatisé, ni débogage, ni mesure de temps, ni compteur
  d'appels, ni couverture : C-A traduit des instructions, il n'exécute
  rien et n'instrumente rien. Cinq refus le fixent.
- `const` sur une variable scalaire seulement : ni pointeur `const`, ni
  paramètre `const`, ni membre `const`.
- `assert.h` n'est **jamais ajouté** de lui-même.
- Aucune vérification que l'assertion est atteignable ou vraie :
  `Vérifie que "0".` produit `assert(0);`.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; exercice intégrateur final, qui vient maintenant.
