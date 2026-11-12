# Lot 11C — `for` : contrat exécuté et bilan

**Date : 12 novembre 2026.**

**Statut de l'autorisation.** Même délégation que pour le
[lot 11B](LOT11B_CONTRAT_ET_BILAN.md) : découpage approuvé, exécution
séquentielle déléguée jusqu'à une v1. Contrat dérivé de la formulation
candidate du §4 et des exigences du §1 (colonne 11C) du
[contrat du lot 11](LOT11_CONTRAT_PROPOSE.md). Le §4 laissait
**quatre points explicitement ouverts** ; ils sont tranchés au §2 ci-dessous.

Dépendance : [lot 11A](LOT11A_BILAN.md) livré. Comparaison avec le
[lot 11B](LOT11B_CONTRAT_ET_BILAN.md) livré.

---

## 1. Contrat

### Formulation et sortie exactes

    Crée une boucle pour {nom} de valeur initiale "{expression}" tant que "{condition}" avec mise à jour "{expression}".

```c
// Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
for (i = 0; i < 3; i = (i + 1)) {
    
}
```

| Clauses demandées | En-tête produit |
|---|---|
| `i`, `0`, `i < 3`, `i + 1` | `for (i = 0; i < 3; i = (i + 1)) {` |
| `i`, `limite`, `i > 0`, `i - 1` | `for (i = limite; i > 0; i = (i - 1)) {` |
| `compteur`, `0`, `compteur < n && actif`, `compteur + pas` | `for (compteur = 0; ((compteur < n) && actif); compteur = (compteur + pas)) {` |
| `i`, `(int) 0.0`, `i < 3`, `(int) (i + 1)` | `for (i = ((int) 0.0); i < 3; i = ((int) (i + 1))) {` |
| `i`, `0`, `1`, `i + 1` | `for (i = 0; 1; i = (i + 1)) {` |

Les deux affectations d'en-tête correspondent **exactement** aux champs
demandés. Jamais de `++`, jamais de `--`, jamais de valeur initiale par
défaut, jamais de clause vide. La condition est celle du lot 10 ; les deux
expressions sont celles du profil numérique du lot 7. Les trois clauses
sont obligatoires.

Le curseur est placé sur la ligne intérieure, après `B + U`.

---

## 2. Les quatre points ouverts du §4, tranchés

### 2.1 Déclaration dans l'en-tête : **non**

Le compteur doit avoir été **déclaré par l'étudiant**. Aucune déclaration
n'est générée dans l'en-tête.

Raisons : A ne doit pas inventer un type ; déclarer dans l'en-tête introduit
une règle de portée supplémentaire (le compteur cesse d'exister après la
boucle) qui mérite d'être enseignée explicitement, pas obtenue comme effet
de bord d'une formulation. Une forme déclarative explicite reste possible
dans un incrément futur ; elle n'est **pas** livrée.

### 2.2 Portée du compteur : **celle que l'étudiant lui a donnée**

Comme le compteur est déclaré ailleurs, sa portée est celle de sa
déclaration et sa valeur **survit** à la boucle. C'est une différence
observable avec un `for (int i = …)` écrit à la main, et elle doit être
enseignée comme telle.

### 2.3 Champs absents : **refusés, un par un**

Aucune clause n'est optionnelle et aucune clause vide n'est interprétée
comme vraie. Chaque champ manquant reçoit un diagnostic qui le **nomme**,
sans proposer de phrase complète à recopier :

| Saisie | Diagnostic |
|---|---|
| `… de valeur initiale ""` | `MISSING_EXPRESSION` — « Il manque la valeur initiale du compteur. » |
| `… tant que ""` | `MISSING_CONDITION` — « Il manque la condition de la boucle. » |
| `… avec mise à jour ""` | `MISSING_EXPRESSION` — « Il manque la mise à jour du compteur. » |
| `Crée une boucle pour` | `INCOMPLETE_INSTRUCTION` — « Il manque le nom du compteur. » |
| `… pour i de` | `INCOMPLETE_INSTRUCTION` — « Instruction incomplète : « valeur » attendu. » |

Les plages sont `[fin, fin)` pour un mot absent, et `[guillemet fermant,
guillemet fermant)` pour une clause vide.

### 2.4 Budget commun des trois clauses : **un seul budget de 1 024 tokens**

Les trois clauses **partagent un unique compteur de tokens**. Découper une
expression entre les trois champs ne permet donc pas de contourner la
limite globale, conformément au §26 de la documentation fondatrice.

Un paramètre optionnel de budget partagé a été ajouté à `parseCondition` et
`parseNumericExpression`. Par défaut, chaque appel reçoit un budget neuf :
**aucune instruction historique à expression unique ne change de limite**
(vérifié par test).

La **profondeur de 64 niveaux reste propre à chaque clause**, parce que la
profondeur mesure l'imbrication *à l'intérieur* d'une expression et que les
trois clauses sont des expressions sœurs, pas emboîtées.

---

## 3. Autres règles du contrat

- Mots fixes insensibles à la casse mais **accents exigés** : `mise a jour`
  est refusé sur le mot `a`. Aucun synonyme : `jusqu’à`, `incrément`,
  `valeur depart` sont refusés sur le mot fautif.
- Point final facultatif, attaché au dernier guillemet fermant.
- Une seule ligne ; phrase d'origine conservée telle quelle.
- Aucun `main`, en-tête, déclaration, affectation ou instruction ajoutée.
- **Les guillemets sont lus par paires.** Une clause laissée ouverte au
  milieu de la phrase se manifeste par un mot suivant inattendu
  (`UNKNOWN_FORMULATION`) et non par un diagnostic de guillemet : C-A ne
  devine pas lequel a été oublié. Une dernière clause non fermée donne
  `UNTERMINATED_EXPRESSION`.
- **Une fermeture de `for` est une accolade seule**, comme celle d'un `if`.
  Le reconnaisseur de branches ne lui trouve pourtant aucune chaîne `if` :
  `ELSE`/`ELSE_IF` est refusé après une boucle `for`, et C-A ne remonte pas
  à un `if` voisin. `branchTarget.ts` est inchangé.

### Information pédagogique

`FOR_CLAUSE_ORDER`, `severity: 'information'`, canal « C-A — Pédagogie »,
plage = la condition sans les guillemets :

> L’initialisation est exécutée une fois avant le premier test ; la
> condition est testée avant chaque itération ; la mise à jour est exécutée
> après le corps, avant le test suivant. Aucune progression ni terminaison
> n’est déduite.

C'est exactement la compétence visée au 11C. Les trois formes de boucle ont
désormais trois informations de moment distinctes : `WHILE_PRETEST`,
`DO_WHILE_POSTTEST`, `FOR_CLAUSE_ORDER`.

### Avis de calcul

Les deux motifs du lot 8 sont recherchés dans **les trois clauses**, pas
seulement dans la condition. Trois clauses fautives produisent trois avis,
triés par position.

---

## 4. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/translate.ts` | intention `FOR`, rendu de l'en-tête, enveloppe `translateFor` à trois clauses, aiguillage |
| `src/condition.ts` | paramètre de budget partagé optionnel |
| `src/numericExpression.ts` | paramètre de budget partagé et message d'expression absente optionnels |
| `src/calculationAdvisories.ts` | les trois clauses du `for` inspectées |
| `src/conditionInformation.ts` | `FOR_CLAUSE_ORDER` |
| `test/forLoop.test.mjs` | **nouveau** — 94 tests |
| `test/loops.test.mjs`, `test/doWhile.test.mjs` | le cas `for` quitte les listes « non livré » |
| `test/vscode/suite.cjs` | 7 tests hôte ajoutés |
| `package.json` | `test/forLoop.test.mjs` ajouté à `npm test` |

Aucune dépendance ajoutée. Aucun instantané de compatibilité régénéré.

## 5. Résultats de tests

### Exécuté et vérifié

```
npm run check
  → aucun diagnostic TypeScript
  ℹ tests 2299
  ℹ pass 2299
  ℹ fail 0
  ℹ skipped 0
```

**2 299 tests Node réussis.** Bases des lots 11A et 11B incluses et
inchangées.

Couverture de `test/forLoop.test.mjs` : 22 rendus exacts avec et sans point
final, dont le comptage des deux points-virgules et l'absence de `++` et de
déclaration dans l'en-tête ; nom et casse du compteur conservés ; compteur
non déclaré traduisible ; conservation de la phrase ; trois clauses vides
refusées avec le champ nommé ; 13 préfixes incomplets avec plage
`[fin, fin)` et mot attendu nommé ; cinq mots fixes refusés sur le mot
fautif ; 17 autres refus, dont `i++`, `i = i + 1` et une comparaison en
clause de mise à jour ; budget partagé des trois clauses vérifié dans les
deux sens ; profondeur propre à chaque clause ; littéral de 2 048 chiffres ;
placement sur six combinaisons LF/CRLF × indentation avec document final
exact ; fichier vide sans déclaration ajoutée ; cibles non blanches ;
quatre refus de rattachement de branche ; imbrication `for` dans `for`,
`for` dans `if`, `if` dans `for` ; quatre falsifications de traduction ;
`FOR_CLAUSE_ORDER`, son ordonnancement et sa distinction des deux autres
formes ; avis du lot 8 dans chacune des trois clauses, puis trois avis
triés ; absence d'avertissement de terminaison ; parcours de session ;
transferts de contrôle toujours refusés ; sorties des lots 11A, 11B et
historiques réaffirmées ; bornes historiques du budget d'une expression
unique inchangées.

### Non exécuté — toujours bloqué

La suite hôte VS Code reste inexécutable : mise à jour de VS Code en
attente, mutex Inno Setup `vscode-updating` détenu par l'instance en cours.
Les 7 tests hôte écrits pour le 11C **n'ont jamais été exécutés**, pas plus
que ceux des lots 11A, 11B et 10. Reprise : redémarrer VS Code, puis
`npm run test:vscode`. Résultat attendu, **non vérifié** : 88 tests hôte.

## 6. Limites

- Aucune analyse de terminaison, de progression, de nombre de tours ni
  d'erreur de bornes. `FOR_CLAUSE_ORDER` décrit l'**ordre d'exécution** des
  clauses, rien de plus.
- Aucune équivalence `for`/`while` n'est calculée ni affirmée par C-A :
  c'est un raisonnement de l'étudiant, sous hypothèses écrites.
- Aucune vérification que la mise à jour fait progresser quoi que ce soit,
  ni qu'elle est atteinte : elle peut dépendre d'une branche du corps,
  être modifiée à la main, ou ne jamais être exécutée.
- Le dépassement d'entier et les conversions peuvent invalider un
  raisonnement mathématique sur les bornes.
- Aucune vérification de types, symboles ou portées ; aucune garantie de
  compilation ni de sûreté du C produit.
- `break` et `continue` ne sont pas livrés. Le point de reprise propre au
  `for` (la mise à jour est atteinte par `continue`) relève du 11D et n'est
  ni implémenté ni enseigné ici.
