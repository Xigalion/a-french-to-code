# Lot 18 — Relation tableaux/pointeurs — bilan

**Livré le 15 novembre 2026.** Contrat :
`docs/LOT18_CONTRAT_PROPOSE.md`, rédigé avant toute ligne de code.
**Le domaine 5 est complet.**

Chiffres réels : **3 149 tests Node réussis, 0 échec** (3 061 au lot 17).
**1 330 390 comparaisons différentielles**, **0 régression**, **0 capacité
perdue**, contre le lot 17 comme contre la référence d'avant le lot 13.
**97 tests hôte VS Code toujours non exécutés.**

---

## 1. Fichiers

**Créés** : `test/arrayPointer.test.mjs` (88 tests, huit sections),
`docs/LOT18_CONTRAT_PROPOSE.md`, `docs/LOT18_BILAN.md`.

**Modifiés** : `src/expressionCore.ts` (capacité `pointerOffset`, nœud
`pointer-sum`, contrôle structurel du décalage), `src/numericExpression.ts`
(variante et rendu), `src/translate.ts` (un code), `src/pedagogicalInformation.ts`
(quatre informations), `src/calculationAdvisories.ts` (nœud transparent),
`scripts/differentiel.mjs`, `package.json`,
`test/expressionCore.test.mjs` et `test/pointers.test.mjs` (refus adaptés),
`docs/CATALOGUE.md`, `CLAUDE.md`.

**Aucune enveloppe française nouvelle** (décision 6), et **aucun fichier
de placement ni d'extension touché**.

---

## 2. Formulations et sorties

| Phrase française | Code C |
|---|---|
| `Affecte à n le résultat numérique de "*(t + i)".` | `n = (*(t + i));` |
| `Affecte à n le résultat numérique de "t[i]".` | `n = t[i];` |
| `Crée un bloc si "*(t + i) > 0".` | `if ((*(t + i)) > 0) { … }` |
| `Crée une boucle tant que "*(s + i) != '\0'".` | `while ((*(s + i)) != '\0') { … }` |
| `Retourne le résultat numérique de "*(t + i * 2)".` | `return (*(t + (i * 2)));` |
| `Appelle traiter avec "*(t + i)".` | `traiter((*(t + i)));` |
| `Affecte à n le résultat numérique de "*(t + i) + *(u + j)".` | `n = ((*(t + i)) + (*(u + j)));` |

Priorité : `*(t + i) + 1` donne `((*(t + i)) + 1)` et jamais
`*(t + i + 1)`. Un test le vérifie dans les deux sens.

---

## 3. Capacités du parseur

| Profil | `pointerOffset` |
|---|---|
| `INTEGER_CAPABILITIES` | **false** |
| `NUMERIC_CAPABILITIES` | **true** |
| `CONDITION_CAPABILITIES` | **true** |
| `INDEX_CAPABILITIES` | **false** |

Le profil entier est gelé pour le **cinquième lot consécutif**. Le profil
d'indice reste fermé : `t[*(u + i)]` est refusé.

Le **décalage** n'est pas analysé par un profil séparé : l'arbre produit
est validé nœud par nœud contre la liste des formes entières (nom,
littéral d'écriture entière, négation, binaire, indexation). Le
diagnostic tombe donc **à l'endroit exact** du nœud fautif — `*(t + 1.5)`
pointe `1.5`, pas toute la parenthèse. C'était le moyen le plus simple
d'obtenir des intervalles justes sans rouvrir la mécanique de bascule de
profil du lot 15.

---

## 4. Tests

`npm run check` : **3 149 tests, 0 échec.** `test/arrayPointer.test.mjs`
en apporte 88 : les deux écritures côte à côte ; quinze sorties exactes
avec et sans point final ; priorité et structure du nœud ; quatorze
décalages acceptés ; treize formes refusées avec plages UTF-16 ; messages
de refus ; profils gelés ; les cinq informations, leur ordre et leurs
ancrages ; **trois tests démontrant qu'une forme acceptée ne garantit
rien sémantiquement** ; parcours complet avec document final exact ;
placement ; dix non-régressions voisines.

**Tests historiques adaptés** : cinq, tous sur `*(p + 1)` que la décision
2 transforme en acceptation, dans `test/pointers.test.mjs` et
`test/expressionCore.test.mjs`. Chaque entrée retirée est remplacée par la
forme **soustractive**, qui reste refusée, avec un commentaire sur place.
Aucun autre test touché, aucun instantané régénéré.

---

## 5. Différentiel

| Référence | Comparaisons | Extensions | Régressions | Capacités perdues |
|---|---|---|---|---|
| lot 17 (`lot-17`) | 1 330 390 | 604 | **0** | **0** |
| avant le lot 13 (`ref-avant-lot-13`) | 1 330 390 | 47 558 | **0** | **0** |

Les 604 extensions contre le lot 17 sont un chiffre **sain** : le lot
n'ouvre qu'une forme syntaxique étroite, et le compteur le montre, là où
le lot 17 en comptait 27 997. `--frozen-stages "^entier"` et `--no-loss`
restent actifs ; aucune entrée acceptée par le lot 17 n'a bougé.

---

## 6. Informations pédagogiques

Sur un `*(nom + décalage)`, cinq informations dans cet ordre :
`DEREFERENCE_MEANING`, `ARRAY_POINTER_EQUIVALENCE`,
`POINTER_ARITHMETIC_LIMITS`, `OUT_OF_BOUNDS_UNDEFINED`,
`OFFSET_TYPE_NOT_CHECKED`.

`ADDRESS_NOT_CHECKED` du lot 17 **cède la place** à
`OUT_OF_BOUNDS_UNDEFINED`, plus précis ici ; elle reste émise sur un `*p`
ordinaire. Un test vérifie les deux cas.

`ARRAY_POINTER_EQUIVALENCE` dit que les deux **expressions** désignent le
même élément, que le nom d'un tableau est converti en pointeur vers son
premier élément dans une expression, et que les deux **ne sont pas du
même type**. Un test refuse tout vocabulaire d'identité de types.

### Choix soumis à revue

`ARRAY_POINTER_EQUIVALENCE` est émise sur `*(t + i)` et **non** sur
`t[i]`. La relation est donc enseignée du côté de la forme nouvelle, où
elle est l'objet du lot. L'émettre aussi du côté indexé l'aurait ajoutée
à toutes les instructions du lot 15, ce qui aurait changé des sorties
livrées sans gain pédagogique net. Si tu préfères l'autre choix, c'est une
ligne et une mise à jour des listes d'informations attendues.

---

## 7. Limites connues

- Ni `p - i`, ni `p - q`, ni `ptrdiff_t`, ni `++`/`--` sur un pointeur.
- Un seul `+`, un seul niveau de parenthèses : `*(t + i + j)` est refusé,
  `*(t + (i + j))` est accepté.
- Aucune enveloppe n'écrit **à travers** un décalage ; pour écrire dans un
  élément, la forme indexée du lot 15 reste la seule.
- Aucune comparaison de pointeurs enseignée : `p == q` passe comme
  comparaison de deux noms, sans information dédiée.
- `NULL`, `stddef.h`, allocation dynamique : hors périmètre.
- **La garantie est syntaxique, pas sémantique.** `*(p + q)` et `*(i + t)`
  sont acceptés ; C-A ne résout aucun symbole et le dit par
  `OFFSET_TYPE_NOT_CHECKED`. Trois tests fixent ce fait explicitement,
  dont un qui produit un C invalide à dessein.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; aucune vérification générale des types, symboles et portées ;
exercice de synthèse final.
