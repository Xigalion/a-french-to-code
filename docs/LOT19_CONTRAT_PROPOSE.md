# Lot 19 — `switch`, `case`, `default` et sortie d'aiguillage

**Statut : contrat rédigé en autonomie le 15 novembre 2026, puis exécuté.**
Bilan : `docs/LOT19_BILAN.md`.

## Pourquoi ce lot

La documentation fondatrice décrit le domaine 3, « Décisions et
répétitions », comme **complet côté moteur** mais note explicitement :
« `switch` et `return` non livrés ». `return` a été livré au lot 12.
`switch` est donc le dernier manque du domaine 3, et un modèle 1 qui
couvre les neuf domaines ne peut pas le laisser ouvert.

Jusqu'ici, `switch` était **reconnu sans être produit** :
`enclosingStructures.ts` le classe déjà, et le lot 11D refuse
`« Sors de la boucle la plus intérieure. »` lorsqu'un `switch` écrit à la
main s'interpose, parce que `break` en sortirait. Ce lot ajoute la
production, et ferme la symétrie.

---

## 1. Formulations et sorties exactes

| Formulation française | Code C produit |
|---|---|
| `Crée un aiguillage sur "jour".` | `switch (jour) { ⏎ ⏎ }` |
| `Ajoute un cas pour la valeur 5.` | `case 5:` |
| `Ajoute un cas pour le caractère 'A'.` | `case 'A':` |
| `Ajoute le cas par défaut.` | `default:` |
| `Sors de l'aiguillage.` | `break;` |

`Crée un aiguillage` est un **bloc** : corps créé vide, curseur placé à
l'intérieur, comme `if`, `while` et `for` depuis le lot 9.

L'expression contrôlée est analysée par le profil **entier** du lot 6 :
`switch` exige en C17 une expression de type entier, et c'est le seul
profil qui ne laisse passer ni flottant, ni conversion, ni comparaison.
C'est aussi le premier usage de ce profil depuis cinq lots, et il reste
inchangé : aucune capacité ne lui est ajoutée.

---

## 2. Les étiquettes exigent une constante

`case` exige en C17 une **expression constante entière**. Le lot n'accepte
donc que deux écritures, et refuse tout le reste :

- un entier décimal, signe `-` admis : `Ajoute un cas pour la valeur -1.`
- une constante caractère de la grammaire du lot 14, `'\0'` comprise.

Un **nom** est refusé (`CASE_NEEDS_CONSTANT`) : sans résolution de
symbole, C-A ne peut pas savoir s'il désigne une énumération ou une
variable, et une variable ne serait pas une expression constante.

C-A ne vérifie **pas** que deux `case` ont des valeurs distinctes, ce qui
serait une erreur de compilation : il ne relit pas le document.

---

## 3. Placement contextuel

`case`, `default` et `Sors de l'aiguillage.` n'ont de sens qu'à
l'intérieur d'un `switch`. Un reconnaisseur `src/switchTarget.ts`, calqué
sur `loopTarget.ts` du lot 11D et bâti sur le **même** balayage partagé,
établit la cible avant toute insertion.

| Cas | Code | Comportement |
|---|---|---|
| aucun `switch` englobant | `SWITCH_TARGET_NOT_FOUND` | refus |
| une boucle est plus proche que le `switch` | `BREAK_TARGET_IS_LOOP` | refus, **symétrique** de `BREAK_TARGET_IS_SWITCH` du lot 11D |
| position qui n'est pas une instruction | codes partagés du balayage | refus |

La symétrie est le point important : le lot 11D refuse
`« Sors de la boucle la plus intérieure. »` quand un `switch` s'interpose ;
ce lot refuse `« Sors de l'aiguillage. »` quand une boucle s'interpose.
Dans les deux sens, la phrase serait **fausse**, et C-A refuse plutôt que
de produire un `break;` qui ne fait pas ce que la phrase annonce.

---

## 4. Informations pédagogiques passives

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `SWITCH_INTEGER_ONLY` | `Crée un aiguillage` | l'expression contrôlée doit être entière ; chaque `case` exige une constante entière distincte, que C-A ne vérifie pas |
| `SWITCH_FALLTHROUGH` | `case` et `default` | sans `break`, l'exécution **continue** dans l'étiquette suivante ; ce n'est pas une erreur en C17, c'est le comportement par défaut |
| `CASE_NEEDS_STATEMENT` | `case` et `default` | en C17, une étiquette doit être suivie d'une **instruction** ; une étiquette seule avant `}` ne compile pas |
| `DEFAULT_OPTIONAL` | `default` | `default` est facultatif ; sans lui, une valeur qui ne correspond à aucun `case` ne fait rien |
| `BREAK_LEAVES_SWITCH` | `Sors de l'aiguillage.` | `break` quitte le `switch`, pas la fonction, et pas une boucle englobante |

`CASE_NEEDS_STATEMENT` est la plus importante : C-A crée les blocs vides
par principe, et une étiquette vide est le seul cas où cette convention
produit un C qui **ne compile pas**. Le dire est préférable à le cacher.

---

## 5. Limites

- Aucune plage de `case` (`case 1 ... 5:`), extension GNU hors C17.
- Aucun `case` groupé en une phrase : une étiquette par instruction.
- Aucune vérification d'unicité des valeurs, ni de présence d'un
  `default`, ni de couverture.
- Aucun `goto` : il n'est dans aucune notion des neuf domaines, et une
  commande qui le produirait irait contre la lisibilité enseignée. Il
  reste explicitement non livré.
- Le profil entier du lot 6 n'est pas modifié : un `switch` sur une
  expression flottante ou une comparaison est refusé par ses diagnostics.

---

## 6. Plan de tests

Cinq sorties exactes avec et sans point final ; expression entière exigée
et formes refusées ; étiquettes constantes, entier négatif, caractère,
`'\0'` ; nom refusé ; placement d'un `case` dans un `switch`, refus hors
d'un `switch` ; symétrie des deux refus de `break` ; les cinq
informations ; document final exact d'un aiguillage complet à trois
étiquettes ; non-régression des lots 1 à 18, en particulier de
`« Sors de la boucle la plus intérieure. »`.
