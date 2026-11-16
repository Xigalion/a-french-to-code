# C-A — suivi des résultats du test utilisateur

**Pour qui :** le fondateur et l'encadrant. C'est le seul endroit où les
comptes des séances s'additionnent.

> **Les scores historiques ne bougent pas.** Les campagnes 1, 2 et 3 valent
> 81,7 %, 83,7 % et 93,9 %, mesurés au même barème sur les mêmes 91 sondes.
> Ce document **n'en recalcule aucun** et n'y ajoute rien : le test
> utilisateur produit des comptes bruts d'une autre nature.
>
> État de référence : `test-utilisateur/etat.json`.
> Barre imprimable : `node scripts/progression.mjs`.

---

## 1. Les deux indicateurs, et pourquoi deux

| indicateur | question à laquelle il répond | ce qu'il ne dit pas |
|---|---|---|
| **couverture des neuf domaines** | qu'est-ce qui est **construit** ? | si cela marche, et pour qui |
| **validation réelle** | qu'est-ce qui est **prouvé** ? | ce qu'il reste à construire |

**Ils ne se fusionnent jamais.** Un seul chiffre mélangeant « 9 domaines
livrés » et « 87 sondes prouvées » n'aurait aucun sens : le premier compte
des capacités, le second des preuves, et les deux peuvent diverger. Au 16
novembre 2026, la couverture est complète et la validation ne l'est pas —
c'est précisément ce que la barre doit montrer.

## 2. Barre de progression — à reproduire dans chaque bilan

    1. Couverture des neuf domaines du modèle 1 — ce qui est CONSTRUIT
       [████████████████████████]  9/9  100,0 %

    2. Validation réelle — ce qui est PROUVÉ (deux mesures, non fusionnées)
       2a. preuves outillées
           [███████████████████████·]  87/91 sondes  — complétion pondérée 93,9 %
       2b. usage réel observé
           [························]  0/10 séances, 0 étudiant(s)

Produite par `node scripts/progression.mjs`, qui lit
`test-utilisateur/etat.json`. Le script **imprime les limites de la mesure
2a sous le chiffre**, et pas en annexe : un pourcentage de preuve cité seul
se lit comme une note.

Trois règles de présentation, à tenir dans tous les bilans à venir :

1. la mesure **2b** est affichée **même à zéro**. Une case vide est une
   information ;
2. les limites de 2a sont citées **avec** le chiffre ;
3. aucun total général. Il n'y a pas de « C-A est à 96 % ».

## 3. Méthode de mesure de chaque indicateur

### 3.1 Couverture des neuf domaines — `9/9`

**Ce qu'on compte.** Un domaine est couvert quand chacune de ses notions
retenues a **au moins une formulation** du catalogue qui la produit, et un
test qui le vérifie.

**Ce que ça ne prouve pas.** Ni que les formulations sont trouvables, ni que
le C produit compile dans tous les cas, ni que les notions retenues épuisent
le domaine — **la liste des notions est la nôtre** et n'a jamais été validée
par un tiers.

**Comment c'est vérifié.** `npm run check` (3 820 tests), plus le test de
partition qui impose que **chaque genre déclaré soit atteignable** par une
phrase (lot 30).

### 3.2 Validation réelle — deux mesures

**2a, preuves outillées : 87/91 sondes, complétion pondérée 93,9 %.**
Barème historique, inchangé depuis la campagne 1 : cinq preuves, trois
coefficients, 91 sondes. Méthode et chiffres dans
`docs/CAMPAGNE3_VALIDATION.md` ; critique du barème lui-même dans
`docs/AUDIT_BAREME.md`.

Ses quatre limites, à citer avec lui :

- deux sondes mesurent une formulation **jamais livrée** — défauts de mesure
  laissés en place pour que les trois campagnes restent comparables ;
- le choix des 91 sondes **n'a jamais été validé** ;
- **cinq programmes** compilés, pas l'ensemble du catalogue ;
- le barème **annonce cinq preuves et n'en mesure que deux**.

**2b, usage réel : 0/10 séances.** Objectif de 10 séances posé d'avance,
pour que le dénominateur ne soit pas choisi après coup en fonction du
résultat. Rien n'est encore mesuré, et il ne faut pas écrire le contraire.

## 4. Journal des séances

Une ligne par séance, remplie depuis la fiche de remontée. Ne rien agréger
ici : les totaux sont en §5.

| # | date | étudiant | exercices faits | insertions | refus | remontées | retouches | anomalies hôte | palier d'aide max | compilé ? |
|---|---|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — | — | — |

*(aucune séance au 16 novembre 2026)*

## 5. Totaux par catégorie

Reportés dans `test-utilisateur/etat.json`, imprimés par
`scripts/progression.mjs`. **Aucune pondération** : voir
`docs/TEST_PROTOCOLE_OBSERVATION.md` §6.

| catégorie de remontée | total | ce que ce total déclenche |
|---|---|---|
| erreur de formulation | 0 | rien, sauf trois occurrences de la **même** phrase → à reclasser |
| incompréhension pédagogique | 0 | proposition de reformulation, décision du fondateur |
| défaut du moteur | 0 | test de reproduction, puis lot nommé |
| défaut du moteur (hôte) | 0 | reproduction dans la suite hôte, cause cherchée |
| limitation volontaire | 0 | rien ; vérifier qu'elle est au catalogue |

| autre compte | total | attendu |
|---|---|---|
| retouches manuelles du C produit | 0 | **0** — aucune sur les cinq programmes des campagnes |
| anomalies de l'hôte | 0 | **0** — six passages verts consécutifs de la suite hôte |
| paliers d'aide A4 | 0 | pas d'attendu : c'est ce qu'on cherche à savoir |
| minute d'abandon du canal pédagogique | — | pas d'attendu ; répond au point ouvert n° 8 |

## 6. Les trois questions que ce suivi doit trancher

Ce sont les trois questions laissées ouvertes par la campagne 3, et aucune
ne se tranche par raisonnement.

| # | question | donnée qui y répond | seuil décidé **d'avance** |
|---|---|---|---|
| 1 | le volume d'informations (1,41 par phrase) est-il supportable ? | minute d'abandon du canal, réponse Q1 de la fiche | abandon avant 20 minutes chez ≥ 5 étudiants sur 10 → le volume est à revoir |
| 2 | à quelle fréquence l'absence de vérification des noms bloque-t-elle ? | occurrences du cas 7 du protocole | ≥ 3 occurrences par séance en moyenne → question de périmètre rouverte |
| 3 | le palier 1 est-il vivable ? | paliers d'aide A3 et A4, réponse Q3 | A4 sur une même notion chez ≥ 3 étudiants → la formulation n'est pas trouvable |

Les seuils sont posés maintenant, avant la première séance, **pour ne pas
les choisir en fonction du résultat**. Les trois campagnes ont tenu cette
discipline ; un test utilisateur sans seuil préalable se lit comme on veut.

## 7. Ce que ce document n'autorise pas

- recalculer un score de campagne — jamais, pour aucune raison ;
- additionner les deux indicateurs ;
- modifier un énoncé ou un message pendant une campagne d'observation ;
- déclarer la V1 « validée » parce que dix séances se sont bien passées :
  dix séances prouvent dix séances.
