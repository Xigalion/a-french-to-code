« Written for: le fondateur, comme analyse critique du barème — document
séparé du calcul, qu'il ne modifie pas. »

# Audit du barème — analyse critique indépendante

> Demandé **séparément** du score. Cet audit ne recalcule rien, ne réécrit
> aucun résultat de campagne, et ne touche pas `exercice/matrice.mjs`.
>
> Il est produit par `exercice/campagne3/auditBareme.mjs`, qui **lit** les
> poids et les deux expressions régulières de coefficient dans
> `exercice/matrice.mjs` au lieu de les réécrire. Journal :
> `exercice/campagne3/journal/audit-bareme.txt`.
>
> **Correction d'une erreur de ma méthode, signalée ici parce qu'elle aurait
> invalidé l'audit.** À son premier essai, ce script réimplémentait les
> coefficients de mémoire et comptait 13 / 20 / 58 sondes au lieu de
> 11 / 38 / 42. Un audit qui réimplémente le barème audite autre chose que le
> barème. L'extraction est faite depuis la source, et le script échoue si elle
> ne donne pas cinq poids.

---

## 1. Conclusion, d'abord

**Le barème annonce cinq preuves ; il en mesure deux.** Ce n'est pas une
nuance : c'est le résultat principal de cet audit, et il change la manière de
lire les trois scores.

Les quatre premières preuves — traduction, placement, compilation, exécution —
**coïncident sur 100 % des 91 compétences**, dans les trois campagnes. Sur
32 profils possibles, **trois** existent :

| profil `p1p2p3p4p5` | compétences | lecture |
|---|---|---|
| `11111` | 65 | tout prouvé, information comprise |
| `11110` | 22 | tout prouvé, aucune information émise |
| `00001` | 4 | refusée — seul P5 est acquis, un refus portant un message |

Les 85 points répartis entre P1, P2, P3 et P4 se comportent donc comme **un
seul bloc de 85**. Toute redistribution entre eux donne exactement le même
score : l'audit le vérifie en rejouant trois pondérations très différentes,
qui donnent **97,4 %** toutes les trois.

Formule équivalente du score de la campagne 3 :

    82,7 %  (part du poids qui compile et s'exécute)
  + 11,1 %  (part du poids qui porte une information pédagogique)
  = 93,9 %  — exactement le score historique.

### Pourquoi c'était inévitable

Ce n'est pas un bogue, c'est une dépendance logique inscrite dans la méthode :

- **P3 implique P1 et P2.** Une compétence n'obtient la preuve de compilation
  que si son genre d'intention a été **exercé** par un programme, donc traduit
  et placé. Il n'existe aucun chemin vers P3 qui ne passe pas par P1 et P2 ;
- **P4 suit P3.** C'est le même programme qui compile et qui s'exécute. Une
  compétence ne peut pas être compilée sans être exécutée, ni l'inverse.

**Ce que cela invalide** : la phrase « la compilation pèse 30 % », répétée
depuis l'évaluation du modèle 1, suggère une précision que le barème n'a pas.
Les trois scores restent comparables entre eux — ils sont calculés de la même
façon — mais leur décomposition en cinq poids est décorative.

## 2. Doublons

| Recherche | Résultat |
|---|---|
| deux sondes avec la **même phrase** | **0** |
| deux sondes avec le **même libellé** | **0** |
| genres d'intention mesurés par **plusieurs** sondes | **8** |

Les huit genres partagés :

| Genre | Sondes | Jugement |
|---|---|---|
| `NUMERIC_ASSIGN` | **6** | **surpondéré** — voir ci-dessous |
| `FUNC_DEF` | 4 | acceptable : définition, sans retour, paramètres, `static` sont quatre aspects distincts |
| `STRUCT_FIELD` | 4 | acceptable : champ scalaire, structure, pointeur, tableau |
| `IF` | 3 | acceptable : bloc, opérateurs logiques, composition |
| `NUMERIC_PRINT`, `ARRAY_DECL`, `MEMBER_PRINT`, `LINKAGE_DECL` | 2 chacun | acceptable |

**Le cas `NUMERIC_ASSIGN` est un vrai défaut.** Six sondes — conversion
explicite, diviseur nul, indexation en expression, relation
tableau/pointeur, accès en expression, élément de tableau de structures —
passent toutes par la même intention. Elles obtiennent donc **les mêmes
preuves P3 et P4**, puisque c'est le même genre qui est exercé. Six sondes
pèsent ainsi pour une seule vérification de compilation.

Un partage de genre n'est pas un doublon **si les preuves diffèrent**. Ici
elles ne diffèrent pas : P3 et P4 sont attribués par genre. C'est donc
l'endroit où le barème compte six fois ce qu'il a vérifié une fois.

## 3. Compétences surpondérées ou sous-pondérées

### Les coefficients sont attribués par expression régulière

C'est le point le plus fragile de la méthode, et il est structurel :

    const FONDAMENTALE = /variable entière|Affectation|Affichage d'une valeur|…/u;
    const STRUCTURANTE = /[Tt]ableau|chaîne|pointeur|[Ss]tructure|Champ|…/u;
    const coef = (label) => FONDAMENTALE.test(label) ? 3 : STRUCTURANTE.test(label) ? 2 : 1;

**Reformuler le libellé d'une sonde change son coefficient sans que personne
ne le décide.** Trois conséquences observées :

| Répartition | Sondes | Part du poids total |
|---|---|---|
| coefficient 3 — fondamentale | **11** | 21,9 % |
| coefficient 2 — structurante | **38** | 50,3 % |
| coefficient 1 — complémentaire | **42** | 27,8 % |

Poids total : **151**.

### Sous-pondérations visibles

Les onze sondes de coefficient 3 sont : Affectation, Affectation d'élément,
Affichage d'un texte, Affichage d'une valeur, Boucle à test initial,
Condition et bloc, Définition de fonction, Expression entière et priorités,
Fonction principale, Instruction de base, Retour de valeur.

Deux manques me paraissent nets, et ce sont des effets de l'expression
régulière, non des décisions :

- **`Inclusion de bibliothèque`** est coefficient **2**, parce que
  « Inclusion » figure dans `STRUCTURANTE`. Sans `#include <stdio.h>`, aucun
  affichage ne compile : c'est aussi fondamental qu'un affichage ;
- **`Appel sans résultat`** et **`Appel avec résultat`** sont coefficient
  **2**, par « Appel » dans `STRUCTURANTE`. Appeler une fonction est le
  pendant de la définir, qui est coefficient 3.

### Surpondération visible

- **`Affectation d'élément`** est coefficient **3**, parce que
  « Affectation » est dans `FONDAMENTALE` et testé en premier. Affecter un
  élément de tableau est structurant, pas fondamental : le mot a gagné par
  ordre de test, pas par jugement.

## 4. Compétences bloquées — la sonde mesure-t-elle ce qu'elle annonce ?

Trois sondes sont bloquées en campagne 3. **Deux des trois mesurent autre
chose que leur libellé.**

| Sonde | Refus | La sonde mesure-t-elle la compétence ? |
|---|---|---|
| `INITIALISEUR ENTRE ACCOLADES` | `UNEXPECTED_TEXT` | **oui** — la forme `{1, 2, 3}` n'existe pas, et la sonde la demande |
| `LECTURE DE CHAÎNE` | `UNKNOWN_FORMULATION` | **non** — la sonde demande `Lis une chaîne depuis le fichier f dans s.`, **sans borne**. Cette forme n'a jamais été livrée et ne le sera pas : une lecture sans borne déborde. La forme **bornée** est livrée au lot 31 et compilée dans `texte.c` |
| `MACRO DE LIMITE` | `UNKNOWN_FORMULATION` | **non** — la sonde demande une **commande** nommant une limite, que le projet refuse délibérément d'écrire. Les macros s'écrivent dans une expression, et `2147483647` a été imprimé par un programme compilé |

**Je n'ai pas corrigé ces deux sondes.** Changer la sonde changerait
l'instrument de mesure et rendrait les trois campagnes incomparables ; et ce
serait exactement « modifier les scénarios pour améliorer le pourcentage ».
Le chiffre reste donc 93,9 %, en sachant qu'il sous-estime de **2 points** :
si les deux sondes nommaient les formes réellement livrées, il serait de
**95,9 %**.

## 5. Refus attendus — un défaut de notation

**Une** sonde a un refus pour résultat attendu : `Assertion : affectation
refusée`, qui doit produire `ASSIGNMENT_IN_CONDITION`. Elle le produit.

Et elle est notée **15 %**.

`matrice.mjs` pose `p1 = !refus`. Pour une sonde dont le refus est le
résultat **attendu et obtenu**, P1 à P4 valent donc `false`, et seul P5 est
acquis. Une sonde qui a fait exactement ce qu'on lui demandait est comptée
comme presque entièrement échouée.

| | |
|---|---|
| score historique | **93,9 %** |
| si un refus attendu obtenu comptait pour 1 | **94,4 %** |
| écart | **0,6 point** |

Le défaut est **conceptuel plus que numérique**, mais il fausse aussi le
décompte des états : cette compétence est rangée à part, ni vérifiée ni
bloquée, ce qui est la raison de l'écart 91/90 déjà signalé en campagne 2.

## 6. Compétences non testées

**Zéro** en campagne 3, contre 19 en campagnes 1 et 2. C'est l'objet même de
la campagne.

Mais le mot « testée » demande une précision que le barème ne fait pas :
P3 et P4 sont attribués **par genre d'intention**, pas par variante. Deux
conséquences :

- `static int aide(void)` est compilé dans `texte.c`, donc le genre `FUNC_DEF`
  porte P3 — et les quatre sondes qui partagent ce genre en bénéficient, y
  compris celles dont la variante exacte n'a jamais été compilée ;
- inversement, une variante compilée ne prouve rien pour les autres.

C'est la même cause que le §2 : **la granularité de la preuve est le genre,
celle de la sonde est l'aspect.** Les deux ne coïncident pas.

## 7. Sensibilité du score aux hypothèses

| Hypothèse | Campagne 3 |
|---|---|
| **barème historique** | **93,9 %** |
| sans coefficients, toutes compétences égales | 92,6 % |
| cinq preuves à poids égal (20 % chacune) | 92,7 % |
| sans P5, pédagogie non comptée | 97,4 % |
| compilation et exécution portées à 80 % | 97,4 % |
| traduction et placement portés à 80 % | 97,4 % |

**Amplitude : 4,7 points**, de 92,6 % à 97,4 %.

Le score est donc **robuste aux pondérations** — mais pour la mauvaise
raison : les trois dernières lignes donnent le même chiffre parce que P1 à P4
sont inséparables (§1). La seule décision qui déplace vraiment le score est
**compter P5 ou non**, soit 3,5 points.

Autrement dit : discuter les poids de P1 à P4 est sans effet. La seule
question de pondération qui compte est « une compétence sans information
pédagogique est-elle moins prouvée ? », et c'est une question pédagogique,
pas arithmétique.

## 8. Recommandations

Par ordre d'importance, et aucune n'est appliquée sans décision du fondateur :

1. **Garder le barème historique tel quel**, pour que les trois campagnes
   restent comparables. Les défauts ci-dessus n'empêchent pas la comparaison :
   ils affectent les trois scores de la même façon.
2. **Publier à côté les deux nombres qu'il mesure réellement** : la part du
   poids qui compile et s'exécute (82,7 %), et la part qui porte une
   information pédagogique (11,1 %). C'est plus honnête que cinq poids dont
   quatre sont liés.
3. **Corriger la notation d'un refus attendu obtenu** (§5). Un changement de
   trois lignes, qui vaut 0,6 point et supprime une catégorie bâtarde.
4. **Reformuler les deux sondes qui mesurent autre chose que leur libellé**
   (§4) — mais alors en le datant explicitement, et en conservant l'ancien
   calcul à côté, sans quoi les campagnes cessent d'être comparables.
5. **Remplacer l'attribution des coefficients par expression régulière par
   une table explicite** (§3) : 91 lignes, un coefficient par ligne, décidé
   et relu. C'est fastidieux et c'est le seul moyen que le coefficient cesse
   de dépendre du choix des mots d'un libellé.
6. **Distinguer la granularité de la preuve** (§2, §6) : soit une sonde par
   genre, soit une preuve par variante. Aujourd'hui six sondes partagent une
   vérification.

## 9. Ce que cet audit ne dit pas

- qu'un autre barème donnerait un chiffre plus juste. Je n'en propose pas :
  le périmètre de cette campagne est d'auditer celui-ci ;
- que 93,9 % soit faux. Il est exact **selon sa méthode**, et c'est bien le
  problème : la méthode mesure moins de choses qu'elle n'en annonce ;
- que les 91 sondes soient les bonnes. Leur choix est le mien, il n'a jamais
  été validé, et il reste le point 2 ouvert du §5.6 de l'évaluation initiale.
