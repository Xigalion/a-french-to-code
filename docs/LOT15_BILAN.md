# Lot 15 — Tableaux, dimensions explicites et indexation — bilan

**Livré le 13 novembre 2026.** Contrat exécuté :
`docs/LOT15_CONTRAT_PROPOSE.md`, rédigé à partir de l'autorisation et de
ses cinq décisions pédagogiques.

Chiffres réels : **2 889 tests Node réussis, 0 échec** (2 765 au lot 14).
**1 325 045 comparaisons différentielles**, **0 régression**, **0 capacité
perdue**, contre le lot 14 comme contre la référence d'avant le lot 13.
**97 tests hôte VS Code toujours non exécutés.**

---

## 1. Fichiers

**Créés**

| Fichier | Rôle |
|---|---|
| `src/arrayInstructions.ts` | les cinq enveloppes françaises du lot |
| `test/arrays.test.mjs` | 125 tests, dix sections |
| `docs/LOT15_CONTRAT_PROPOSE.md` | contrat exécuté |
| `docs/LOT15_BILAN.md` | ce document |

**Modifiés**

| Fichier | Nature |
|---|---|
| `src/expressionCore.ts` | nœud `index`, capacités `indexing` et `literalKind`, `INDEX_CAPABILITIES`, sous-grammaire de l'indice |
| `src/numericExpression.ts` | variante `index`, `parseIndexExpression`, rendu |
| `src/calculationAdvisories.ts` | descente dans l'indice, quatre intentions nouvelles |
| `src/pedagogicalInformation.ts` | trois informations, balayage structurel des indices |
| `src/translate.ts` | union, codes, rendus, aiguillage |
| `scripts/differentiel.mjs` | corpus du lot, `--frozen-stages`, `--no-loss` |
| `package.json` | enregistrement de `test/arrays.test.mjs` |
| `test/expressionCore.test.mjs`, `test/condition.test.mjs`, `test/numeric.test.mjs`, `test/characters.test.mjs` | quatre refus historiques adaptés, commentés sur place |
| `docs/CATALOGUE.md`, `docs/DOMAINE5_CONTRAT_PROPOSE.md`, `CLAUDE.md` | documentation |

**Non modifiés** : `planPlacement.ts`, `placementLexical.ts`,
`enclosingStructures.ts`, `branchTarget.ts`, `loopTarget.ts`,
`functionContext.ts`, `expression.ts`, `condition.ts`,
`characterLiteral.ts`, `characterInstructions.ts`,
`functionInstructions.ts`, `numericInstructions.ts`, et **tout
`extension/`**. Les instantanés des lots 4 à 6 sont intacts.

---

## 2. Formulations et sorties, telles que le moteur les produit

| Phrase française | Code C | Information |
|---|---|---|
| `Déclare un tableau de type int nommé t de dimension 10.` | `int t[10];` | `ARRAY_NOT_ASSIGNABLE` |
| `Déclare un tableau de type char nommé t de dimension 10.` | `char t[10];` | `ARRAY_NOT_ASSIGNABLE`, `CHAR_ARRAY_NOT_STRING` |
| `Affecte la valeur 5 à l'élément "0" de t.` | `t[0] = 5;` | `INDEX_NOT_CHECKED` |
| `Affecte le caractère 'A' à l'élément "0" de t.` | `t[0] = 'A';` | `INDEX_NOT_CHECKED` |
| `Affecte à l'élément "i" de t le résultat numérique de "a + 1".` | `t[i] = (a + 1);` | `INDEX_NOT_CHECKED` |
| `Affiche l'élément "0" de t.` | `printf("%d", t[0]);` | `INDEX_NOT_CHECKED` |

Indexation en expression, sans enveloppe nouvelle :

| Phrase française | Code C |
|---|---|
| `Affecte à somme le résultat numérique de "somme + t[i]".` | `somme = (somme + t[i]);` |
| `Crée un bloc si "t[i] > 0".` | `if (t[i] > 0) { … }` |
| `Retourne le résultat numérique de "t[0]".` | `return t[0];` |
| `Appelle traiter avec "t[i]".` | `traiter(t[i]);` |
| `Crée une variable de type int nommée v avec le résultat de "t[i + 1]".` | `int v = t[(i + 1)];` |

Les deux apostrophes, `'` et `’`, désignent le même élément ; la phrase
est conservée telle quelle dans le commentaire.

---

## 3. Modifications des capacités du parseur

Deux champs nouveaux, et un quatrième enregistrement :

| Profil | `literals` | `literalKind` | `indexing` | `casts` | `logic` |
|---|---|---|---|---|---|
| `INTEGER_CAPABILITIES` | integer | integer | **false** | false | false |
| `NUMERIC_CAPABILITIES` | numeric | literal | **true** | true | false |
| `CONDITION_CAPABILITIES` | numeric | literal | **true** | true | true |
| `INDEX_CAPABILITIES` | integer | literal | true | false | false |

Les quatre enregistrements sont verrouillés par une égalité stricte dans
`test/expressionCore.test.mjs` : élargir un profil restera un changement
visible et relisible.

**`INDEX_CAPABILITIES` n'est pas un quatrième profil publié.** Il n'est
sélectionné qu'entre `[` et `]`, et toujours restauré. C'est ce qui rend
l'indice entier quel que soit le profil englobant : `t[1.5]`,
`t[(int) i]`, `t[i < 3]` et `t[a && b]` sont refusés dans le profil
numérique comme dans le profil condition.

`literalKind` existe parce que la sous-grammaire de l'indice emprunte la
grammaire entière tout en construisant les nœuds de l'arbre numérique qui
l'entoure. Sans ce champ, `t[2]` produirait un nœud `integer` au milieu
d'un arbre que le rendu numérique ne sait pas écrire.

Le **profil entier du lot 6 n'a pas été touché** : c'est la question Q1
soumise à revue au §7.

---

## 4. Informations pédagogiques

| Code | Déclenchement | Ancrage |
|---|---|---|
| `INDEX_NOT_CHECKED` | toute indexation | les délimiteurs de l'indice, `"0"` ou `[i]` |
| `ARRAY_NOT_ASSIGNABLE` | déclaration de tableau | le nom du tableau |
| `CHAR_ARRAY_NOT_STRING` | déclaration de tableau de `char` | le nom du tableau |

Aucune n'incrémente le compteur d'avertissements ; un test le vérifie.
Aucune ne prétend avoir détecté un dépassement — le message dit
explicitement « Aucun dépassement n'est ici détecté ni exclu », et un test
refuse tout vocabulaire de détection.

`INDEX_NOT_CHECKED` est produite par un **balayage structurel** des
paramètres de l'instruction, pas par un aiguillage par intention. Elle se
combine donc avec les informations d'enveloppe existantes sans que
celles-ci aient été modifiées : `WHILE_PRETEST`, `CALL_NOT_RESOLVED`,
`RETURN_ENDS_FUNCTION` et `SHORT_CIRCUIT_AND` apparaissent toujours, après
elle.

---

## 5. Tests

`npm run check` : **2 889 tests, 2 889 réussis, 0 échec.**
`test/arrays.test.mjs` en apporte 125, en dix sections : sorties exactes
avec et sans point final, apostrophes, casse et accents ; cinq types et
sept types refusés ; huit dimensions refusées ; indexation dans les deux
profils ouverts et sa fermeture dans le profil entier ; huit indices
acceptés et huit refusés ; dix diagnostics d'indexation avec plages
UTF-16 ; douze diagnostics d'enveloppe ; refus maintenus des lots 16 à
18 ; les trois informations et leur absence ailleurs ; budget partagé,
dépassement de budget et de profondeur ; placement sur six combinaisons
LF/CRLF × indentation, plus une séquence de quatre instructions avec
document final exact ; dix non-régressions voisines.

### Tests historiques adaptés

Quatre, tous portant sur le même refus que le lot 15 ouvre
délibérément, chacun commenté sur place :

| Fichier | Entrée retirée | Remplacement |
|---|---|---|
| `test/expressionCore.test.mjs` | `a[0]`, `t[i] + 1` dans `REFUSED` | quatre cas verrouillant le **profil entier** seul |
| `test/condition.test.mjs` | `a[0]` dans « pas de syntaxe hors contrat » | renvoi à `arrays.test.mjs` |
| `test/numeric.test.mjs` | `a[0]` dans les diagnostics du lot 7 | renvoi à `arrays.test.mjs` |
| `test/characters.test.mjs` | `a[0]` dans « lots 15 à 18 fermés » | renvoi à `arrays.test.mjs` |

Aucun autre test existant n'a été touché, et aucun instantané de
compatibilité n'a été régénéré.

---

## 6. Différentiel

Le harnais a reçu deux audits nouveaux, parce que le motif d'extensions
s'applique à l'**entrée entière** et que le corpus aléatoire contient `[`
et `]` comme atomes ordinaires : lui faire confiance aurait caché des
divergences réelles.

- **`--frozen-stages <motif>`** : sur un profil que le contrat déclare
  gelé, une entrée qui correspond au motif n'achète aucune indulgence ;
  toute divergence y est une régression. Sans cela, une fuite de
  l'indexation dans le profil entier se serait rangée dans le seau des
  extensions approuvées, puisque l'entrée qui la révèle contient `[`.
- **`--no-loss`** : une extension peut transformer un refus en acceptation
  ou en un autre refus, **jamais** retirer ce que le moteur précédent
  acceptait. Toute entrée acceptée avant est signalée et fait échouer.

Commande exécutée :

    node scripts/differentiel.mjs <ref> \
      --extensions "\[|\]|élément|element|tableau" \
      --frozen-stages "^entier" --no-loss

| Référence | Comparaisons | Extensions | Régressions | Capacités perdues |
|---|---|---|---|---|
| `HEAD` (lot 14) | 1 325 045 | 2 964 | **0** | **0** |
| `ref-avant-lot-13` (avant le lot 13) | 1 325 045 | 3 434 | **0** | **0** |

Le second chiffre dit que les lots 13, 14 et 15 **ensemble** n'ont rien
changé hors des périmètres approuvés.

### Validation du harnais par mutation

Quatre mutations de contrôle injectées, chacune détectée, le témoin
revenant ensuite à zéro :

| Mutation | Détection |
|---|---|
| `indexing: true` dans le profil entier (fuite) | **532 régressions** — c'est exactement ce que `--frozen-stages` existe pour voir |
| message `MISSING_OPERAND` modifié | 153 649 régressions |
| `printf("%d"` devenu `printf("%i"` | 7 régressions |
| `DECL_INT` modifié sous un motif volontairement sur-capturant | **7 capacités perdues** — `--no-loss` voit ce que le motif aurait avalé |

---

## 7. Choix soumis à revue

**Q1 — Le profil entier reste fermé à l'indexation.** L'autorisation
interdisait d'ouvrir `[` et `]` « globalement dans toutes les expressions
par simple effet de bord ». J'ai ouvert les deux profils qui en ont un
besoin démontré et laissé scellé celui du lot 6. Conséquence visible :
`le résultat numérique de "t[0]"` fonctionne, `le résultat de "t[0]"` non.
C'est la même asymétrie que `(char) 65` a introduite au lot 14. L'ouvrir
serait un changement d'une ligne de capacité, plus les quatre tests
historiques correspondants.

**Q2 — `t[u[i]]` est accepté.** L'indexation imbriquée tombe de la
récursion de la grammaire ; ce n'est pas un tableau à deux dimensions, et
elle reste bornée par le budget de jetons et la profondeur. `t[i][j]` est
refusé explicitement.

**Q3 — Deux informations au-delà de `INDEX_NOT_CHECKED`.** Les décisions 3
et 4 énoncent deux faits que l'étudiant ne peut pas déduire du code
produit. `ARRAY_NOT_ASSIGNABLE` et `CHAR_ARRAY_NOT_STRING` les disent à la
déclaration, passivement.

**Q4 — L'indice est entre guillemets même constant.** `l'élément "0" de t`
plutôt que `l'élément 0 de t` : une seule règle, la même que partout
ailleurs pour une expression.

---

## 8. Limites connues

Propres au lot :

- Aucune vérification de bornes, d'existence, de type ou de dimension. La
  dimension écrite n'est jamais retenue ni réutilisée.
- `t[300]` sur `int t[3];` est traduit et plaçable sans un mot de plus que
  l'information passive.
- Aucune liste d'initialisation `{…}`, aucune affectation globale de
  tableau, aucun tableau à plusieurs dimensions.
- Aucun affichage `%c` ou `%s` d'un élément : l'affichage d'élément est
  décimal, comme `PRINT_INT`, et sans vérification de type.
- Le profil entier n'accepte pas l'indexation.
- `t[(int) i]` est refusé avec `C_KEYWORD_IDENTIFIER`, parce que la
  sous-grammaire de l'indice ne déclare pas la capacité de conversion et
  lit donc `int` comme un nom. Le code est exact, le message est celui du
  nom et non celui de la conversion.
- C-A ne résout aucun symbole : il ne peut pas savoir qu'un nom désigne un
  tableau. `Affecte à t le résultat numérique de "u".` produit toujours
  `t = u;`, qui ne compile pas si `t` est un tableau. La garantie du lot
  est qu'**aucune de ses formulations** ne produit une affectation globale.

Héritées et toujours ouvertes : recette GCC du domaine « Expressions et
calculs » ; recettes manuelles des domaines 3 et 4 et du lot 10 ;
qualification des avertissements de l'hôte VS Code (`mutex already
exists`, DEP0168/N-API) ; absence de toute vérification générale des
types, symboles et portées ; confirmation en recette de la compatibilité
C17 des fonctions ; exercice de synthèse final.

---

## 9. Décisions nécessaires pour le lot 16

1. **Le littéral chaîne.** Grammaire, échappements retenus, et surtout :
   `char s[6] = "hello";` est la forme à enseigner selon D6 — faut-il une
   enveloppe dédiée, ou étendre `Déclare un tableau … de dimension …` avec
   une clause de valeur ? La seconde voie rouvre la question des
   initialisateurs que ce lot a tenue fermée.
2. **Le caractère nul.** `'\0'` est refusé depuis le lot 14 et réservé au
   lot 16 ; il faut décider s'il entre comme échappement du littéral
   caractère, comme terme d'expression (pour `s[i] != '\0'`), ou les deux.
   La décision 1 reçue implique les deux, ce qui suppose d'ouvrir le
   littéral caractère dans les profils numérique et condition.
3. **L'affichage.** `%s` sur un tableau de `char`, et `%c` sur un élément,
   sont les deux formulations qui manquent aujourd'hui. Les ouvrir sans
   présenter un tableau de `char` comme une chaîne, conformément à la
   décision 3, demande une formulation explicite plutôt qu'une inférence.
4. **`string.h`** reste reportée par D4 ; rien dans le lot 16 ne doit en
   dépendre.

Aucune n'est bloquante pour la revue du lot 15. **Aucune ligne du lot 16
n'est écrite.**
