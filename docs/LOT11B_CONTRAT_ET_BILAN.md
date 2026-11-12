# Lot 11B — `do/while` : contrat exécuté et bilan

**Date : 12 novembre 2026.**

**Statut de l'autorisation.** Le porteur a approuvé le découpage 11A-11D puis
délégué l'exécution des incréments suivants sans validation intermédiaire,
en demandant un travail séquentiel jusqu'à une v1. Ce document tient donc
lieu à la fois de contrat et de bilan : le contrat est dérivé de la
formulation candidate du §4 du [contrat du lot 11](LOT11_CONTRAT_PROPOSE.md)
et des exigences du §1 (colonne 11B) et du §2. Les décisions prises sont
listées au §2 ci-dessous pour relecture.

Dépendance : [lot 11A](LOT11A_BILAN.md), livré.

---

## 1. Contrat

### Formulation et sortie exactes

    Crée une boucle avec test final tant que "{condition}".

```c
// Crée une boucle avec test final tant que "i < limite".
do {
    
} while (i < limite);
```

Trois lignes de code : `do {`, la ligne intérieure, puis
`} while ({condition});`. Le curseur est placé sur la ligne intérieure,
après `B + U`. Le point-virgule final est **syntaxique** : il fait partie
de la structure `do/while` du C, ce n'est pas une instruction ajoutée.

| Saisie de condition | Ligne de fermeture produite |
|---|---|
| `i < limite` | `} while (i < limite);` |
| `actif` | `} while (actif);` |
| `0` / `1` | `} while (0);` / `} while (1);` |
| `i + 1 < limite` | `} while ((i + 1) < limite);` |
| `i < limite && !suspendu` | `} while (((i < limite) && (!suspendu)));` |
| `a \|\| b && c` | `} while ((a \|\| (b && c)));` |
| `!a == b` | `} while ((!a) == b);` |
| `!(a == b)` | `} while ((!(a == b)));` |

La condition est **exactement** celle du lot 10, avec ses restrictions, ses
codes de diagnostic, ses plages UTF-16 et ses budgets. Aucun profil plus
permissif n'est introduit. Les guillemets délimitent une condition, jamais
une chaîne C.

### Règles préservées

- Règles lexicales historiques : point final facultatif attaché au
  guillemet fermant, mots fixes insensibles à la casse mais **accents
  exigés**, espaces et tabulations ordinaires, une seule ligne, phrase
  d'origine conservée telle quelle dans le commentaire.
- Aucun `main`, en-tête, compteur, initialisation, progression,
  affectation ni instruction de sortie ajouté.
- La condition est donnée **à la création**. Le moteur ne se verra jamais
  demander de retrouver un `do` ouvert pour le fermer automatiquement : la
  structure complète est le modèle.
- Aucun synonyme : `jusqu’à`, `do while`, `test finale` sont refusés.

### Compétence visée au 11B

Distinguer le **moment du test** et la **première exécution si la boucle
est atteinte**. Comparer `while` et `do/while` pour une condition
initialement fausse : la forme à test initial peut n'exécuter aucun tour,
la forme à test final exécute le corps au moins une fois si la boucle est
atteinte. Ne pas confondre « corps exécuté » et « condition atteinte » en
présence de transferts de contrôle, qui ne sont pas livrés.

### Diagnostics

Codes du lot 10 pour la condition, avec les nouveaux décalages d'enveloppe.
Le préfixe fixe `Crée une boucle avec test final tant que` mesure
**40 unités UTF-16** ; les oracles automatisés en dépendent et un test
vérifie cette longueur.

| Phrase exacte | Attendu |
|---|---|
| `Crée une boucle avec test final tant que` | `MISSING_CONDITION` [40,40) |
| `… tant que "".` | `MISSING_CONDITION` [42,42) |
| `… tant que "i &&".` | `MISSING_OPERAND` [46,46) |
| `… tant que "i = 3".` | `ASSIGNMENT_IN_CONDITION` [44,45) |
| `… tant que "A😀B < 3".` | `INVALID_IDENTIFIER` [42,46) |
| `… tant que "i < 3` | `UNTERMINATED_CONDITION` [41,47) |

Préfixes incomplets : `INCOMPLETE_INSTRUCTION` à `[fin, fin)`, nommant le
mot fixe attendu (« test », « final », « tant », « que »), sans proposer de
phrase complète à recopier.

### Information pédagogique

`DO_WHILE_POSTTEST`, `severity: 'information'`, canal « C-A — Pédagogie »,
plage = la condition sans les guillemets :

> La condition est testée après chaque itération ; si la boucle est
> atteinte, le corps est exécuté au moins une fois. Aucune progression ni
> terminaison n’est déduite.

Aucun avertissement de boucle infinie, de progression manquante, d'arrêt
garanti ou de nombre d'itérations. Le compteur d'avertissements n'est pas
touché.

### Placement

`DO_WHILE` rejoint la liste canonique des blocs à curseur intérieur. Cible
unique : une ligne de seuls espaces ou tabulations. Indentation `B` sur le
commentaire, `do {` et la ligne de fermeture ; `B + U` sur la ligne
intérieure. Aucune ligne de saisie créée après la fermeture. LF/CRLF,
repli d'EOL, frontières UTF-16, contrôle du préfixe lexical, vérification
canonique et fraîcheur d'aperçu : inchangés. Une seule modification
annulable par confirmation ; la création du bloc et le remplissage du corps
restent deux opérations distinctes.

**Une fermeture `} while (…);` ne peut jamais être lue comme la fin d'une
chaîne `if`** : elle ne se termine pas par une accolade seule. Aucune
branche `sinon` ne s'y rattache, et C-A ne remonte pas à un `if` voisin.
`branchTarget.ts` est inchangé.

---

## 2. Décisions d'implémentation à relire

1. **Aiguillage des formes de boucle rendu table-driven.** Après le préfixe
   `Crée une boucle`, la forme est sélectionnée sur son premier mot fixe
   (`tant` → `WHILE`, `avec` → `DO_WHILE`), puis tous ses mots sont
   vérifiés un à un. Cela prépare 11C sans rouvrir 11A.
2. **Message d'incomplétude du 11A modifié.** `Crée une boucle` seul
   produisait « Instruction incomplète : « tant que » attendu. » ; il
   produit désormais « Instruction incomplète : la forme de la boucle est
   attendue. » Le code (`INCOMPLETE_INSTRUCTION`) et la plage sont
   identiques, et la phrase reste refusée : seule la formulation du message
   change, parce que « tant que » n'est plus la seule suite possible.
   Conforme au palier 1 : on indique ce qui manque sans proposer de menu.
3. **Trois constantes partagées extraites** plutôt que des listes de `kind`
   dupliquées : `BLOCK_KINDS` (blocs à curseur intérieur, utilisé par le
   traducteur et le planificateur) et `instructionCondition()` (accès à la
   condition d'une intention, utilisé par les deux modules pédagogiques).
   Aucun comportement historique n'en dépend autrement.
4. **Message de condition absente** : « Il manque la condition de la
   boucle. », partagé avec `WHILE`. Le message d'`IF` est inchangé.

---

## 3. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/translate.ts` | intention `DO_WHILE`, rendu, `BLOCK_KINDS`, `instructionCondition`, aiguillage table-driven |
| `src/planPlacement.ts` | `isBlock` fondé sur `BLOCK_KINDS` |
| `src/calculationAdvisories.ts` | condition obtenue par `instructionCondition` |
| `src/conditionInformation.ts` | `DO_WHILE_POSTTEST` et table des moments de test |
| `test/doWhile.test.mjs` | **nouveau** — 68 tests |
| `test/loops.test.mjs` | le cas `do/while` quitte la liste « non livré » |
| `test/vscode/suite.cjs` | 4 tests hôte ajoutés ; l'ancien refus 11A devient `test finale` |
| `package.json` | `test/doWhile.test.mjs` ajouté à `npm test` |

Aucune dépendance ajoutée. Aucun instantané de compatibilité régénéré.

## 4. Résultats de tests

### Exécuté et vérifié

```
npm run check
  → aucun diagnostic TypeScript
  ℹ tests 2206
  ℹ pass 2206
  ℹ fail 0
  ℹ skipped 0
```

**2 206 tests Node réussis.** Base du lot 11A incluse et inchangée.

Couverture de `test/doWhile.test.mjs` : vérification de la longueur du
préfixe ; 22 rendus exacts avec et sans point final, dont le comptage du
point-virgule unique ; conservation de la phrase ; refus des synonymes et
des accents absents ; quatre préfixes incomplets avec mot attendu nommé ;
les six oracles UTF-16 ; égalité des codes de refus entre `DO_WHILE`,
`WHILE` et `IF` sur neuf conditions ; budgets de profondeur et de tokens
sans remise à zéro ; placement sur six combinaisons LF/CRLF × indentation
avec document final exact ; fichier vide ; cibles non blanches ; six refus
de rattachement de branche après une fermeture `do/while` ; imbrication
`while` dans un corps `do` ; quatre falsifications de traduction ;
`DO_WHILE_POSTTEST` et son ordonnancement ; distinction explicite du
moment du test entre les deux formes ; avis du lot 8 dans trois
conditions ; absence d'avertissement de terminaison ; parcours de session ;
formes non livrées toujours refusées ; sorties du lot 11A et historiques
réaffirmées.

### Non exécuté — toujours bloqué

La suite hôte VS Code reste inexécutable : mise à jour de VS Code en
attente sur la machine, mutex Inno Setup `vscode-updating` détenu par
l'instance en cours. Les 4 tests hôte écrits pour le 11B **n'ont jamais
été exécutés**, pas plus que les 9 du 11A ni les 68 du lot 10. Reprise :
redémarrer VS Code, puis `npm run test:vscode`. Résultat attendu, **non
vérifié** : 81 tests hôte.

## 5. Limites, inchangées

- Aucune analyse de terminaison, de progression ou de nombre d'itérations.
- `DO_WHILE_POSTTEST` dit **quand** la condition est évaluée, rien de plus.
  « Si la boucle est atteinte » est une condition explicite du message :
  l'accessibilité du `do` n'est pas analysée.
- Le corps n'existe pas dans la traduction de création.
- Aucune vérification de types, symboles ou portées ; aucune garantie de
  compilation ni de sûreté du C produit.
- `break` et `continue` ne sont pas livrés : les règles de reprise propres
  au `do/while` (la condition finale est atteinte par `continue`) relèvent
  du 11D et ne sont ni implémentées ni enseignées ici.
