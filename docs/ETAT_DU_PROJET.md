# A / C-A — état du projet, méthode et preuves

**Pour qui :** un lecteur extérieur qui veut savoir ce qui est construit, ce
qui est prouvé, comment le projet travaille, et ce qu'il ne faut pas croire.

> **C'est le document d'état du projet, et le seul publié.** Le fichier de
> travail interne qui lui a servi de source — instructions de travail,
> conventions, dettes, points ouverts — est **gardé hors du dépôt** : il
> n'est ni suivi par git, ni présent dans l'historique. Rien n'en a été
> perdu ; ce document en reprend la substance, ordonnée pour un lecteur qui
> arrive.
>
> Les bilans de lots mentionnent parfois `CLAUDE.md` dans leurs tables de
> fichiers touchés : c'est un **fait historique** — le lot l'avait bien mis
> à jour — et non un fichier manquant du dépôt.
>
> État au 17 novembre 2026, version **0.4.0**.

---

## 1. Le projet

**A** est un projet de programmation assistée : traduire une intention
exprimée en **langue naturelle contrôlée** vers du code d'un langage **réel
et existant**. **C-A** en est la première incarnation : **français → C17**,
intégrée à VS Code, moteur en TypeScript.

    Crée un entier nommé age de valeur 20.

    // Crée un entier nommé age de valeur 20.
    int age = 20;

Le commentaire conserve **exactement** la phrase d'origine. Le code produit
est la référence : c'est lui que l'utilisateur lit, modifie et compile.

### Les neuf règles qui ne se négocient pas

1. le **code source** est la référence ;
2. **traçabilité** : chaque fragment porte sa phrase en commentaire ;
3. **aucun ajout implicite** — pas de `main`, `return`, `#include`, variable
   ni format d'affichage non demandé ;
4. **refus explicites** : aucune production partielle ;
5. **diagnostic ≠ correction** : expliquer, sans fournir la phrase correcte à
   recopier ;
6. **traduction valide ≠ programme sûr** ;
7. **préservation** des formulations historiques valides ;
8. aperçu, **puis** confirmation, **puis** insertion ;
9. ne jamais modifier une portion de code non autorisée.

### Paliers de liberté

Le **palier 1**, actuel, exige une formulation **précise**. Le palier 2
autorisera des formulations plus concises et des valeurs par défaut
documentées ; il n'est pas livré. **Invariant** : compétence de programmation
et liberté linguistique sont indépendantes — un palier ne réserve aucune
capacité de programmation, il la fait seulement écrire plus longuement.

## 2. Ce qui est construit

**Les neuf domaines** du parcours « Algorithmique et développement logiciel
en C17 » sont couverts, en **32 lots**. Le catalogue complet, avec la sortie C
exacte de chaque formulation, est dans [`CATALOGUE.md`](CATALOGUE.md) :
**tout ce qui n'y figure pas est refusé**, et c'est le périmètre.

| Domaine | Livré |
|---|---|
| 1 fondations | en-têtes, `main`, déclarations, affectations, affichages, formats |
| 2 expressions | entiers, `unsigned`, `float`, `double`, `char`, conversions, précision |
| 3 décisions | `si` / `sinon si` / `sinon`, aiguillage `switch` et ses étiquettes |
| 4 boucles | `tant que`, test final, `pour`, `break`, `continue` |
| 5 fonctions et données | définitions, paramètres, retours, appels ; tableaux, chaînes, pointeurs |
| 6 mémoire | `sizeof`, `malloc`, `realloc`, `free` |
| 7 modularité | en-têtes locaux, gardes, prototypes, liaisons interne et externe |
| 8 structures de données | structures, champs, tableaux de structures, synonymes de type |
| 9 fiabilité et fichiers | assertions, constantes, `limits.h`, fichiers et flux |

### Architecture

| Élément | Rôle |
|---|---|
| `src/translate.ts` | analyse de la phrase, AST d'intention, rendu C, diagnostics |
| `src/expressionCore.ts` | noyau d'analyse d'expressions unifié |
| trois profils | `expression`, `numericExpression`, `condition` — enveloppes minces, chacune définie par un **enregistrement de capacités** explicite |
| `src/planPlacement.ts` | **planifie** l'insertion ; n'écrit rien |
| reconnaisseurs contextuels | fonction englobante, chaîne `if`, boucle, aiguillage, structure, portée d'instruction |
| `extension/` | l'hôte VS Code : saisie, aperçu, confirmation, insertion |

Deux règles d'architecture : `src/` **n'importe jamais `vscode`** — moteurs
purs, déterministes, sans E/S ; et seule la couche hôte applique une
modification, après confirmation. Toute position est un intervalle UTF-16
semi-ouvert relatif à la source, sans normalisation Unicode.

## 3. La méthode

Le travail avance par **lots**. Un lot livre une capacité, pas une idée :

1. **montrer la lacune** — un programme qu'on ne peut pas écrire ;
2. écrire le **contrat** : formulations exactes, sorties exactes, diagnostics
   avec leurs plages, placement, **limites explicites**, plan de tests ;
3. implémenter, avec les tests ;
4. **prouver l'absence de régression** avec le harnais différentiel, qui
   compare arbres, diagnostics, intervalles, budgets, fragments et plans de
   placement entre deux états du moteur, sur un corpus généré ;
5. écrire le **bilan**, avec les chiffres réels.

Deux principes de mesure, appris à leurs dépens :

- **une suite de tests qu'on ne peut pas exécuter ne protège de rien** — un
  test de la suite hôte a échoué pendant plusieurs lots sans que personne le
  voie, parce que la suite ne pouvait pas tourner ;
- **la réussite des tests ne vaut pas complétion** — d'où les campagnes de
  validation par exercices compilés et exécutés.

## 4. Les preuves, et ce qu'elles valent

| Preuve | Chiffre |
|---|---|
| tests Node | **3 834**, 0 échec |
| tests hôte VS Code | **99 / 99**, neuf passages verts consécutifs |
| programmes écrits par C-A, **compilés** en C17 `-Wall -Wextra -pedantic` | **19** |
| programmes **exécutés**, sortie vérifiée contre un calcul fait à la main | **18** |
| retouches manuelles du C produit | **0** |
| intentions du catalogue employées dans un programme compilé | **84 / 84** |
| dictée dans l'interface réelle de VS Code | **101 instructions**, C **identique** à celui du moteur |

### Les campagnes de validation

| Campagne | Complétion pondérée | Compétences vérifiées |
|---|---|---|
| 1 — modèle 1 | **81,7 %** | 65 / 91 |
| 2 — V1 corrigée | **83,7 %** | 67 / 91 |
| 3 — preuves élargies | **93,9 %** | 87 / 91 |

Les scores antérieurs ne sont **jamais** recalculés : même barème, mêmes 91
sondes, seules les preuves changent.

**Et le barème lui-même a été audité, contre le projet.** Il annonce cinq
preuves ; il en mesure **deux** : les quatre premières coïncident sur 100 %
des compétences. Le score s'écrit *82,7 % (ce qui compile et s'exécute) +
11,1 % (ce qui explique)*. Conséquence : discuter les poids est décoratif.
Détail dans [`AUDIT_BAREME.md`](AUDIT_BAREME.md).

### Ce que ces chiffres ne prouvent pas

- que **tout** le C produit compile : 19 programmes l'ont fait, pas tous ;
- que 93,9 % soit une note : c'est une **part de preuve** ;
- que les 91 sondes épuisent les neuf domaines — leur choix n'a jamais été
  validé par un tiers ;
- qu'une suite verte démontre la stabilité ;
- que l'outil soit **utilisable** : aucune séance avec un étudiant réel n'a
  encore eu lieu.

## 5. Les limites, en une phrase et en un lien

**C-A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements.** Une insertion acceptée n'est pas un
programme correct. Liste complète, avec les contournements :
[`LIMITES_CONNUES.md`](LIMITES_CONNUES.md).

Une seule exception : depuis le lot 26, une instruction exécutable est
**refusée hors d'un corps de fonction**, et une définition de fonction
**refusée** à l'intérieur d'une autre. C'est la seule famille de
vérifications contextuelles que C-A sait faire.

## 6. Où en est la validation

**Deux indicateurs, jamais fusionnés** (`node scripts/progression.mjs`) :

| Indicateur | État |
|---|---|
| couverture des neuf domaines — ce qui est **construit** | **9 / 9** |
| preuves outillées — ce qui est **prouvé** | 87 / 91 sondes, 93,9 % |
| intentions employées dans un programme compilé | **84 / 84** |
| **usage réel observé** | **0 / 10 séances** |

La dernière ligne est la seule qui compte pour la suite, et elle est vide.
**Recommandation en vigueur : test utilisateur supervisé**, pas usage ouvert,
parce que C-A ne vérifie ni symboles, ni types, ni bornes — un encadrant
transforme cette limite en leçon, son absence en obstacle.

## 7. Questions ouvertes, publiées telles quelles

1. **le volume d'explications** — 1,41 information par phrase, mesuré, jamais
   observé en situation ;
2. **la fréquence du mur « aucun symbole vérifié »** — connue en théorie,
   jamais comptée en séance ;
3. **le palier 1 est-il vivable ?** — personne n'a encore saisi cent phrases
   d'affilée ;
4. **l'arithmétique de pointeurs** reste acceptée sans avertissement là où
   elle est écrite : C-A est sans état d'une instruction à l'autre. Fermer
   cette lacune demanderait de suivre les déclarations à travers le document,
   donc un changement d'architecture ;
5. **plateformes** : rien n'a jamais été exécuté ailleurs que sur Windows, et
   `Cmd+K A` n'a jamais été essayé.

Les seuils qui trancheront les trois premières sont posés **d'avance**, dans
[`TEST_SUIVI_RESULTATS.md`](TEST_SUIVI_RESULTATS.md) §6.

## 8. Ce qui n'est pas en chantier

L'**IA** (analyse, complétion, suggestion), le **score de confiance**, les
**alertes automatiques**, le **palier 2**, et les versions pour d'autres
langages. Le schéma de données les anticipe ; le code ne les contient pas.

## 9. Pour aller au fond

| Document | Contenu |
|---|---|
| [`CATALOGUE.md`](CATALOGUE.md) | toutes les formulations et leur sortie C exacte |
| [`LIMITES_CONNUES.md`](LIMITES_CONNUES.md) | ce que C-A ne fait pas |
| [`EXERCICE_CLOTURE.md`](EXERCICE_CLOTURE.md) | l'exercice de clôture, ses preuves, le classement des défauts |
| [`AUDIT_BAREME.md`](AUDIT_BAREME.md) | la critique du barème, écrite contre le projet |
| [`V1_LIVRAISON_CAMPAGNE3.md`](V1_LIVRAISON_CAMPAGNE3.md) | la livraison de la V1 et sa recommandation |
| [`TEST_PARCOURS_DECOUVERTE.md`](TEST_PARCOURS_DECOUVERTE.md) | première séance d'un débutant |
| [`REPERES_GIT.md`](REPERES_GIT.md) | les étiquettes du dépôt, et pourquoi pas des hachages |
| [`REPERES_GIT.md`](REPERES_GIT.md) | les étiquettes du dépôt, et pourquoi pas des hachages |
