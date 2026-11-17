# Phase 2 — risques de régression

**Pour qui :** le fondateur, pour juger ce que la phase 2 met en danger.

> La V1 publique est la référence stable : 3 834 tests Node, 99 tests hôte,
> 19 programmes compilés, 93,9 % de complétion pondérée, zéro retouche
> manuelle. **Tout ce qui suit est ce qui pourrait abîmer ce chiffre.**
>
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Ce qui est en danger, et ce qui ne l'est pas

| Hors de danger | Pourquoi |
|---|---|
| `main` et le dépôt public | la phase 2 vit sur une branche ; `main` n'a reçu aucun commit |
| l'extension installée | le paquet publié ne change pas |
| les scores des campagnes | ils ne sont jamais recalculés, et aucune sonde ne les touche |
| les trois instantanés gelés du dossier `test` | ils doivent rester intacts : c'est le filet |

| En danger | Gravité |
|---|---|
| le rendu C, s'il est extrait de `translate.ts` | **élevée** |
| les trois profils, si leur littéral est unifié | **élevée** |
| le placement C, si un module de placement générique est tenté | **très élevée** |
| les 69 diagnostics, si leurs codes sont renommés par langage | moyenne |
| les 67 informations, si leur canal est réorganisé | moyenne |
| la lisibilité de l'ensemble, si l'abstraction est poussée trop loin | **élevée, et irréversible en pratique** |

## 2. Les cinq risques nommés

### R1 — L'extraction du rendu change une sortie, une seule

**Ce qui se passe.** Les 198 lignes de `render` deviendraient un module
dédié au rendu C17, sous `src/langages/c17/` (chemin **proposé**, inexistant
à ce jour). Un `break` oublié, une interpolation déplacée,
et une intention sur 84 produit un caractère de différence. Les tests
couvrent les 84, mais une sortie **identique dans les tests et différente
dans un cas limite** reste possible : les tests citent 163 assertions de C,
pas les 84 × toutes leurs formes.

**Probabilité** moyenne. **Gravité** élevée : une régression silencieuse dans
le code produit est le pire défaut possible pour ce projet.

**Comment on la voit.** `node scripts/differentiel.mjs v0.4.0 --no-loss` —
1,3 million de comparaisons, arbres, diagnostics, intervalles, budgets,
fragments **et** plans de placement. Le lot P0 doit afficher **0 régression
et 0 extension** : une extraction qui change quoi que ce soit a échoué.

**Condition d'acceptation.** P0 ne livre **aucune capacité nouvelle**. Si le
différentiel signale une seule divergence, on revient.

### R2 — L'unification des littéraux déplace un diagnostic

**Ce qui se passe.** Le profil entier nomme son littéral `integer`, le
numérique `literal`. Les unifier touche `expressionCore.ts`, c'est-à-dire le
noyau de **tous** les profils, dont le profil entier **gelé depuis le lot 6**.

**Probabilité** faible. **Gravité** élevée : le profil entier est gelé par
contrat, et les instantanés des lots 4, 5 et 6 l'imposent.

**Comment on la voit.** `--frozen-stages "^entier"` interdit toute indulgence
sur ce profil, et les trois instantanés gelés échouent au moindre écart.

**Alternative à considérer d'abord.** Ne **pas** unifier, et faire traiter les
deux noms par chaque rendu — c'est ce que fait la sonde Python, en une ligne.
Coût : deux noms pour une idée, à documenter. Bénéfice : le noyau gelé n'est
pas touché. **Je recommande cette alternative**, et de ne réviser que si un
troisième profil apparaît.

### R3 — Le placement générique rend le C illisible

**Ce qui se passe.** La tentation sera forte de modéliser « un bloc »
indépendamment de sa délimitation, pour écrire un seul module de placement.
Les 1 154 lignes actuelles deviendraient une abstraction, plus deux
implémentations — et la logique la plus délicate du projet (chaîne `if`,
boucle englobante, portée d'instruction, préfixe lexical) serait à relire à
travers cette abstraction.

**Probabilité** élevée si personne ne l'interdit. **Gravité très élevée** :
c'est le composant où une erreur insère du code au mauvais endroit, dans le
fichier de l'utilisateur.

**Comment on l'évite.** La décision 2 du socle : **deux modules, non
unifiés**. Et une règle de relecture : si le placement C devient plus long ou
plus indirect après la phase 2, l'abstraction a échoué, quel que soit le gain
affiché pour Python.

### R4 — La couche linguistique devient un second catalogue

**Ce qui se passe.** Le lexique grossit, les formulations acceptées cessent
d'être dénombrables, et « tout ce qui n'est pas au catalogue est refusé »
devient faux sans que personne l'ait décidé.

**Probabilité** élevée sur la durée. **Gravité** moyenne techniquement,
**élevée pédagogiquement** : c'est la promesse du projet qui s'effrite.

**Comment on la tient.** Les trois garde-fous de
`STRATEGIE_LINGUISTIQUE.md` §7 : lexique **généré** dans la documentation,
entrée justifiée par une formulation **réellement rencontrée**, et un test
qui refuse une entrée morte. Plus la propriété mesurée : **140 phrases du
catalogue traversent la couche sans réécriture** — à revérifier à chaque
entrée ajoutée.

### R5 — Python tire le C vers le bas

**Ce qui se passe.** Pour qu'une intention « marche dans les deux langages »,
on simplifie la version C : on retire une information pédagogique, on
assouplit un refus, on renonce à une distinction que Python n'a pas.

**Probabilité** moyenne, et c'est le risque le plus insidieux : chaque pas
paraît raisonnable.

**Comment on l'évite.** Le socle autorise explicitement un langage à
**refuser** une intention. Aucune intention C ne doit être modifiée pour
qu'un autre langage la porte. Et la mesure existe : les 67 informations de C
doivent rester 67.

## 3. Les filets déjà en place, et ce qu'ils couvrent

| Filet | Couvre | Ne couvre pas |
|---|---|---|
| 3 834 tests Node | les 84 intentions, les diagnostics, les limites, les placements | les combinaisons non écrites |
| différentiel (1,3 M de comparaisons) | arbres, diagnostics, intervalles, budgets, fragments, plans | ce que le corpus ne génère pas — **à étendre à chaque capacité** |
| 3 instantanés gelés | les sorties historiques des lots 4, 5, 6 | les lots postérieurs |
| 99 tests hôte | le cycle complet dans un vrai VS Code | les trois gestes manuels |
| dictée VS Code | l'identité entre le C de l'IHM et celui du moteur | un seul exercice |
| 19 programmes compilés | que ce C-là compile et s'exécute | tout le reste du catalogue |
| `pre-publication.mjs` (19 contrôles) | la publication, les données personnelles, les liens | le sens des documents |

**Le filet le plus important est le différentiel**, et il a une faiblesse
connue, documentée au lot 24 : enrichir les paramètres d'une intention change
la sortie **structurée**, donc `--no-loss` se déclenche même quand le C
produit est identique. Procédure : comparer les **fragments** et les
**éditions de placement**, pas le JSON entier.

## 4. Ce que la phase 2 doit s'interdire

1. **toucher `main` avant validation** de l'architecture ;
2. **régénérer un instantané gelé** pour faire passer un test — règle
   existante, et le lot 28 montre la seule procédure acceptable : amender une
   entrée, la documenter, et ne changer qu'un verdict quand le contrat l'exige ;
3. **livrer P0 avec une capacité nouvelle** : l'extraction du rendu doit être
   prouvée neutre, ou elle n'est pas faite ;
4. **introduire un comportement implicite** dans le modèle 1 — y compris une
   valeur par défaut « juste pour Python » ;
5. **unifier le placement** ;
6. **abaisser une exigence du C** pour qu'une intention soit portable.

## 5. Scénario de retour arrière

| Étape | Retour |
|---|---|
| sondes et documents | supprimer la branche : `main` n'a rien reçu |
| P0 (extraction du rendu) | un seul commit, `git revert` ; les 3 834 tests et le différentiel le valident dans les deux sens |
| P1 (registre) | additif : le registre sans second langage est un indirection de plus, supprimable |
| P2 (placement Python) | module séparé : sa suppression ne touche pas le placement C |
| P3 à P6 | capacités Python, additives par construction |

**Le seul commit réellement risqué est P0.** Tout le reste est additif, et
c'est le but de l'architecture proposée : un second langage qui ne peut pas
abîmer le premier.
