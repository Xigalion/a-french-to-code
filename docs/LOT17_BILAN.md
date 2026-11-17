# Lot 17 — Pointeurs fondamentaux — bilan

**Livré le 13 novembre 2026.** Contrat exécuté :
`docs/LOT17_CONTRAT_PROPOSE.md`, rédigé avant toute ligne de code.

Chiffres réels : **3 061 tests Node réussis, 0 échec** (2 977 au lot 16).
**1 329 017 comparaisons différentielles**, **0 régression**, **0 capacité
perdue**, contre le lot 16 comme contre la référence d'avant le lot 13.
**97 tests hôte VS Code toujours non exécutés.**

---

## 1. Fichiers

**Créés**

| Fichier | Rôle |
|---|---|
| `src/pointerInstructions.ts` | les six enveloppes françaises du lot |
| `test/pointers.test.mjs` | 89 tests, douze sections |
| `docs/LOT17_CONTRAT_PROPOSE.md` | contrat exécuté |
| `docs/LOT17_BILAN.md` | ce document |

**Modifiés**

| Fichier | Nature |
|---|---|
| `src/expressionCore.ts` | capacités `addressOf` et `dereference`, nœuds `address` et `dereference`, règle `indirection`, `&` binaire préservé |
| `src/numericExpression.ts` | deux variantes, rendu parenthésé |
| `src/translate.ts` | union, trois codes, six rendus, aiguillage |
| `src/pedagogicalInformation.ts` | cinq informations, balayage structurel générique |
| `src/calculationAdvisories.ts` | opérateurs transparents, intention d'affectation indirecte |
| `scripts/differentiel.mjs` | corpus du lot, documents à pointeurs |
| `package.json` | enregistrement de `test/pointers.test.mjs` |
| `test/expressionCore.test.mjs`, `test/characters.test.mjs`, `test/arrays.test.mjs`, `test/strings.test.mjs` | refus historiques adaptés, commentés sur place |
| `docs/CATALOGUE.md`, `CLAUDE.md`, `docs/DOMAINE5_CONTRAT_PROPOSE.md` | documentation |

**Non modifiés** : `planPlacement.ts`, `placementLexical.ts`,
`enclosingStructures.ts`, `branchTarget.ts`, `loopTarget.ts`,
**`functionContext.ts` (D3)**, `expression.ts`, `condition.ts`,
`characterLiteral.ts`, `stringLiteral.ts`, `characterInstructions.ts`,
`arrayInstructions.ts`, `functionInstructions.ts`,
`numericInstructions.ts`, et **tout `extension/`**. Instantanés des lots 4
à 6 intacts.

---

## 2. Formulations et sorties, telles que le moteur les produit

| Phrase française | Code C | Information |
|---|---|---|
| `Déclare un pointeur de type int nommé p.` | `int *p;` | `UNINITIALIZED_POINTER`, `POINTER_VS_OBJECT` |
| `Crée un pointeur de type int nommé p avec l'adresse de x.` | `int *p = &x;` | `ADDRESS_OF`, `POINTER_VS_OBJECT` |
| `Affecte l'adresse de x à p.` | `p = &x;` | `ADDRESS_OF`, `POINTER_VS_OBJECT` |
| `Affiche la valeur pointée par p.` | `printf("%d", *p);` | `DEREFERENCE_MEANING`, `ADDRESS_NOT_CHECKED` |
| `Affecte la valeur 5 à la valeur pointée par p.` | `*p = 5;` | idem |
| `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` | `*p = (a + 1);` | idem |

Expressions, sans enveloppe nouvelle :

| Phrase française | Code C |
|---|---|
| `Affecte à n le résultat numérique de "*p + 1".` | `n = ((*p) + 1);` |
| `Crée un bloc si "*p > 0".` | `if ((*p) > 0) { … }` |
| `Appelle echange avec "&a" et "&b".` | `echange((&a), (&b));` |
| `Affecte à q le résultat numérique de "&t[i + 1]".` | `q = (&t[(i + 1)]);` |
| `Affecte à n le résultat numérique de "-*p".` | `n = (-(*p));` |

**D2 est tenue** : les cinq types produisent `int *p;`, `char *p;` … et un
test vérifie qu'aucune sortie ne contient `* p` ni `int* p`.

**Les trois écritures restent distinctes** : `p`, `&x` et `*p` produisent
`n = p;`, `n = (&x);` et `n = (*p);`, et un test vérifie que les trois
sorties sont bien trois.

---

## 3. Capacités du parseur

| Profil | `addressOf` | `dereference` |
|---|---|---|
| `INTEGER_CAPABILITIES` | **false** | **false** |
| `NUMERIC_CAPABILITIES` | **true** | **true** |
| `CONDITION_CAPABILITIES` | **true** | **true** |
| `INDEX_CAPABILITIES` | **false** | **false** |

Les quatre enregistrements restent verrouillés par égalité stricte. Le
profil entier est scellé depuis quatre lots ; le profil d'indice reste
entier, donc `t[*p]` et `t[&x]` sont refusés.

### Ne pas confondre l'unaire et le binaire

C'est le point délicat du lot, et il est traité en deux endroits précis.

- **`&`** : le tokeniseur **laisse passer** un `&` isolé au lieu de le
  refuser, et c'est l'analyseur qui tranche. En position d'opérande, c'est
  l'adresse. Partout ailleurs, `missingOperator` réémet exactement le
  diagnostic historique — `UNSUPPORTED_EXPRESSION_OPERATOR` ou
  `UNSUPPORTED_CONDITION_OPERATOR`, sur la même plage. `&&` n'est pas
  touché : c'est un jeton distinct depuis le lot 9.
- **`*`** : le produit consomme son opérateur **avant** de lire l'opérande
  droit, donc `a * b` ne passe jamais par la règle unaire. Seul le `*` en
  position d'opérande est un déréférencement.

Un test dédié vérifie `a & b`, `a && b`, `a * b`, `a * b * c`, `a ** b`,
`**p` et `&&x` dans les deux profils, codes **et** intervalles.

### Les deux opérandes sont contraints

`&` porte sur un nom ou un élément de tableau ; `*` porte sur un nom seul.
Ce n'est pas arbitraire : cette seule contrainte ferme d'un coup les deux
constructions que le lot ne doit pas ouvrir — un second niveau
d'indirection, et l'arithmétique de pointeurs sous un déréférencement.

---

## 4. Tests

`npm run check` : **3 061 tests, 3 061 réussis, 0 échec.**
`test/pointers.test.mjs` en apporte 89, en douze sections : six sorties
exactes avec et sans point final ; D2 sur cinq types ; six types refusés ;
niveaux d'indirection ; cibles jamais inventées ; distinction `p` / `&x` /
`*p` ; onze formulations à opérateur unaire ; priorité `*p + 1` ;
structure des nœuds et intervalles d'opérateur ; binaires inchangés ;
treize diagnostics avec plages UTF-16 ; profils gelés ; refus du lot 18 et
des domaines ultérieurs ; cinq informations et leur absence ailleurs ;
budget et profondeur ; placement sur quatre combinaisons ; séquence
complète de cinq instructions avec document final exact ; dix
non-régressions voisines.

### Tests historiques adaptés

Quatre fichiers, tous pour le même motif : D4 ouvre `&` et `*` unaires
dans deux profils. Chaque entrée retirée est remplacée par un test qui
verrouille le **profil entier** seul, et chacun porte un commentaire sur
place nommant le lot et la décision.

| Fichier | Entrées retirées |
|---|---|
| `test/expressionCore.test.mjs` | `&a`, `* a`, `a * * b` du tableau partagé |
| `test/characters.test.mjs` | `&a`, `* a` |
| `test/arrays.test.mjs` | `&a`, `&t[0]`, `* p` |
| `test/strings.test.mjs` | `&s[0]`, `* p` |

Aucun autre test existant n'a été touché, aucun instantané régénéré.

---

## 5. Différentiel

Commande :

    node scripts/differentiel.mjs <ref> \
      --extensions "&|\*|pointeur|adresse|point" \
      --frozen-stages "^entier" --no-loss

| Référence | Comparaisons | Extensions | Régressions | Capacités perdues |
|---|---|---|---|---|
| `HEAD` (lot 16) | 1 329 017 | 27 997 | **0** | **0** |
| lot 16 (`lot-16`) | 1 329 017 | 27 997 | **0** | **0** |
| avant le lot 13 (`ref-avant-lot-13`) | 1 329 017 | 46 910 | **0** | **0** |

### Ce que ce motif ne prouve pas, et ce qui le compense

Le motif de ce lot est **nécessairement très large** : il contient `&` et
`*`, donc il capture toute multiplication du corpus aléatoire. Pris seul,
il absoudrait une régression sur `a * b`. Deux choses l'en empêchent :

- **`--no-loss`** fait ici le vrai travail. Une extension n'a le droit de
  changer qu'un **refus**. `a * b` était accepté avant ce lot ; s'il avait
  changé de quelque façon, il aurait été compté en capacité perdue. Le
  compteur est à zéro, donc aucune entrée acceptée avant n'a bougé.
- **`--frozen-stages "^entier"`** retire toute indulgence sur le profil du
  lot 6, où une fuite de capacité se serait sinon cachée.

### Validation du harnais par mutation

| Mutation | Détection |
|---|---|
| `addressOf` et `dereference` vrais dans le profil entier | **6 462 régressions**, grâce à `--frozen-stages` |
| rendu `(*p)` devenu `(* p)` | **0 régression — non détectée** |

La seconde mutation est instructive et je la rapporte telle quelle : le
différentiel **ne garde pas** le rendu de la surface neuve. C'est attendu
— il compare au moteur précédent, pour qui `*p` était un refus — et ce
n'est pas un trou, parce que la même mutation fait **échouer 11 tests** de
`test/pointers.test.mjs`, qui fixent les sorties exactes. Le partage des
rôles est donc : le différentiel garde l'existant, les tests du lot
gardent le neuf. Les deux ont été exercés.

---

## 6. Informations pédagogiques

| Code | Déclenchement | Ancrage |
|---|---|---|
| `ADDRESS_OF` | `&` écrit, en enveloppe ou en expression | la variable, ou l'opérateur |
| `POINTER_VS_OBJECT` | déclaration de pointeur | le nom du pointeur |
| `DEREFERENCE_MEANING` | `*` écrit, en enveloppe ou en expression | le pointeur, ou l'opérateur |
| `UNINITIALIZED_POINTER` | déclaration **sans** adresse | le nom du pointeur |
| `ADDRESS_NOT_CHECKED` | tout déréférencement | le pointeur, ou l'opérateur |

Les deux dernières couvrent les deux risques demandés : la valeur
indéterminée d'un pointeur non initialisé, et l'absence totale de
vérification. `ADDRESS_NOT_CHECKED` dit « C-A ne vérifie ni que ce
pointeur a reçu une adresse, ni qu'elle est encore valide, ni qu'elle
désigne bien le type attendu. Aucune mémoire n'est analysée ici. » Un test
refuse tout vocabulaire de vérification.

`UNINITIALIZED_POINTER` ne se déclenche **pas** sur une déclaration avec
adresse ; un test vérifie les deux sens.

Les informations d'expression pointent l'**opérateur** lui-même, pas tout
l'opérande, grâce à un balayage structurel générique des paramètres —
même mécanisme qu'aux lots 15 et 16, factorisé cette fois.

---

## 7. Limites connues

Propres au lot :

- Un seul niveau d'indirection ; ni pointeur de fonction, ni tableau de
  pointeurs, ni `void *`, ni `const`.
- Aucun retour ni paramètre de type pointeur (**D3**, `functionContext.ts`
  non touché).
- Ni `NULL`, ni `stddef.h`, ni allocation dynamique (**D1**).
- `Affiche la valeur pointée par p.` produit `%d` sans vérifier que `p`
  pointe un `int`, exactement comme `Affiche la valeur de x.` depuis le
  lot 3.
- Le profil entier et le profil d'indice restent fermés aux deux
  opérateurs.

**Deux choses que C-A ne peut pas refuser, et que je ne présente pas comme
refusées :**

1. **L'arithmétique de pointeurs écrite sur un nom.** C-A ne résout aucun
   symbole et ignore si `p` est un pointeur :
   `Affecte à p le résultat numérique de "p + 1".` produit `p = (p + 1);`.
   La garantie du lot est **syntaxique** : aucune de ses formulations ne
   produit d'arithmétique de pointeurs, et toute arithmétique écrite
   **sous** un déréférencement est refusée (`*(p + 1)`).
2. **`NULL`.** D1 le reporte, et aucune formulation ne l'introduit. Mais
   `NULL` n'est pas un mot-clé C17 : C-A le lit comme un nom ordinaire, et
   `Affecte à p le résultat numérique de "NULL".` produit `p = NULL;`, qui
   ne compile pas sans en-tête. Un test fixe ce comportement réel plutôt
   que de le masquer.

Héritées et toujours ouvertes : recette GCC du domaine « Expressions et
calculs » ; recettes manuelles des domaines 3 et 4 et du lot 10 ;
qualification des avertissements de l'hôte VS Code (`mutex already
exists`, DEP0168/N-API) ; absence de toute vérification générale des
types, symboles et portées ; confirmation en recette de la compatibilité
C17 des fonctions ; exercice de synthèse final.

---

## 8. Décisions nécessaires pour le lot 18

1. **Périmètre exact de l'arithmétique.** D3 du domaine 5 annonçait
   `p + entier` et `p - entier` seulement, plus `==` et `!=` entre
   pointeurs. Faut-il aussi `p - q`, qui donne un `ptrdiff_t` et
   rouvrirait la question de `stddef.h` que D1 vient de reporter ? Je
   recommande de l'exclure pour cette raison.
2. **`*(t + i)` contre `t[i]`.** C'est la leçon centrale du lot 18 :
   montrer que les deux désignent le même élément. Cela suppose de
   desserrer la contrainte d'opérande du `*`, aujourd'hui limitée à un nom
   — c'est-à-dire de rouvrir volontairement ce que ce lot a fermé, dans un
   cadre précis. Il faut dire lequel : `*(nom + expression entière)` et
   rien d'autre, me semble le bon périmètre.
3. **La décroissance.** `Appelle f avec "t".` passe déjà un tableau par
   son nom et produit `f(t);`. Faut-il une information passive expliquant
   la conversion implicite en pointeur, ou une formulation dédiée ? Je
   recommande l'information seule : il n'y a pas de syntaxe nouvelle.
4. **Comparaison de pointeurs.** `p == q` passe déjà, puisque ce sont deux
   noms ; seule une information la distinguerait d'une comparaison de
   valeurs. À trancher avec le point 3.

Aucune n'est bloquante pour la revue du lot 17. **Aucune ligne du lot 18
n'est écrite.**
