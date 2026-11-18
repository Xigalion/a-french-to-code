# A — état du projet, méthode et preuves

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
> État au 18 novembre 2026, version **0.6.0** — **trois** langages cibles :
> C17 avec C-A, Python avec Python-A, Java 21 avec Java-A. Les trois réglages
> — français souple, Python, Java — sont **actifs par défaut**, et chacun se
> ferme.

---

## 1. Le projet

**A** est un projet de programmation assistée : traduire une intention
exprimée en **langue naturelle contrôlée** vers du code d'un langage **réel
et existant**. **C-A** en est la première incarnation : **français → C17 et
Python**,
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
| `src/translate.ts` | analyse de la phrase, AST d'intention, diagnostics |
| `src/langages/registre.ts` | le registre : un langage y déclare ses extensions, ses blocs, son commentaire, ses intentions portées et ses refus |
| `src/langages/c17/`, `python/`, `java/` | un dossier par langage cible : rendu, refus nommés, informations, catalogue natif, placement |
| `src/expressionCore.ts` | noyau d'analyse d'expressions unifié |
| trois profils | `expression`, `numericExpression`, `condition` — enveloppes minces, chacune définie par un **enregistrement de capacités** explicite |
| trois placements | `planPlacement` (accolades C17), `python/placement` (indentation), `java/placement` (accolades à **quatre portées**). Ils **ne sont pas unifiés**, et c'est une décision : deux langages à accolades n'ont pas les mêmes portées |
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
| tests Node | **4 375**, 0 échec |
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

---

## Python — second langage cible, version 0.5.0

Python n'est **pas un portage du C**. Il a son propre catalogue pédagogique,
et ce que le C sait dire mais que Python ne connaît pas est refusé **avec sa
raison**, qui nomme la construction native équivalente.

| | |
|---|---|
| intentions que Python écrit | **97** — 33 reprises du catalogue partagé, **64 natives** |
| refus nommés | **51**, chacun désignant la construction Python qui enseigne la même compétence |
| informations pédagogiques passives | **49**, dont trois qui **corrigent** une règle apprise en C |
| placement | par **indentation**, module séparé de celui des accolades |
| catalogue publié | [`docs/CATALOGUE_PYTHON.md`](CATALOGUE_PYTHON.md), engendré depuis le moteur |
| programmes écrits par C-A et **exécutés** | **9**, dont six pour l'exercice de clôture |
| exercice de clôture | **238 instructions**, **0 retouche**, **97/97** intentions employées, **49/49** informations |

Les différences sémantiques entre les deux langages sont **refusées, pas
lissées** : `/` ne donne pas le même résultat en C17 et en Python, `%` non
plus sur un opérande négatif, et chacune a sa phrase française distincte.
Trois informations disent explicitement ce qui **change** par rapport au C :
`match` ne traverse pas les cas, `with` ferme le fichier tout seul, et un
indice négatif compte depuis la fin au lieu de lire hors du tableau.

**Ce que Python ne fait pas** : les classes, le `else` de boucle, la boucle à
test final. Les trois sont délibérés, et les raisons sont dans
`docs/phase2/LOT_P5_CONTRAT_ET_BILAN.md`.

## Java — troisième langage cible, version 0.6.0

Java n'est **pas un portage du C** non plus. Et il introduit ce que ni C17 ni
Python-A n'avaient : l'**objet** comme unité obligatoire, les **exceptions
vérifiées**, et deux contraintes de **système de fichiers**.

| | |
|---|---|
| formulations | **144** — 30 reprises, 27 **adaptations sémantiques**, **87 natives** |
| refus nommés | **27**, chacun désignant la construction Java qui enseigne la même compétence |
| informations pédagogiques passives | **28**, dont trois qui **corrigent** une règle apprise en C17 ou en Python, et **deux qui disent une lacune de A** |
| placement | par **accolades**, mais à **quatre portées** : fichier, classe, méthode, interface |
| catalogue publié | [`docs/CATALOGUE_JAVA.md`](CATALOGUE_JAVA.md), engendré depuis le moteur |
| programmes compilés et exécutés | **2**, dont un de **quatre fichiers** |
| exercice de clôture | **96 phrases**, **0 retouche**, `javac --release 21 -Xlint:all` code 0 **sans un avertissement**, `java -ea` code 0 |

**Java 21 LTS, sans aucune fonctionnalité en avant-première.** Les classes
implicites et le `main` d'instance sont *preview* dans cette version : le code
produit exigerait deux drapeaux et vieillirait. Le point d'entrée est donc
explicite, et le premier programme Java demande **trois** phrases là où Python
en demande une.

**Ce que l'étiquette « accolades » ne suffisait pas à dire.** Java la porte
comme C17, et son placement a pourtant dû être écrit : rien d'exécutable ne
vit à la portée fichier — pas même une affectation —, une méthode exige une
**classe** (deux niveaux, pas un), et `package` précède les `import` qui
précèdent le type.

**Trois obligations de Java que A ne satisfait pas pour vous**, et ce sont les
trois endroits où il sera le plus frustrant : les **exceptions vérifiées** —
A ne choisit ni `try`/`catch` ni `throws` —, **`static`** — A est sans état et
ne sait pas si une méthode l'est —, et le **nom du fichier**, que `javac`
impose et que A ne renomme pas. Les trois sont **dites** par des informations
passives, et **aucune n'est refermée**.

**Une asymétrie assumée :** Java-A a les classes, Python-A ne les a pas. En
Java, une classe est obligatoire pour exécuter la moindre ligne ; en Python,
le regroupement de données s'enseigne d'abord par un dictionnaire. Ce n'est
pas un retard de Python-A, c'est le langage qui parle.

**Ce que Java-A ne fait pas** : `record`, le `switch` fléché et `var` sont
refusés, parce qu'ils cachent précisément ce que les domaines concernés
enseignent — le constructeur, la traversée des cas, et le type. Et **aucun
contrôle de visibilité** : lire un champ `private` depuis une autre classe est
accepté par A et refusé par `javac`.

## Français souple — version 0.6.0, ACTIF par défaut

Si une phrase est refusée par le catalogue, et **seulement** dans ce cas, A
essaie un lexique fini de synonymes et **98 reformulations** syntaxiques
déterministes : changements d'ordre, formes courtes, verbes synonymes. Les
mêmes règles servent les **trois** langages : ce sont des règles
français → français, elles ne savent pas quel langage les consomme.

Quatre garanties, chacune testée :

- le **mode strict est intact** — une phrase du catalogue ne traverse rien, et
  les 138 formulations publiées le vérifient une par une ;
- rien n'est **inventé** : une reformulation n'a pas le droit d'introduire un
  mot de type ou un nombre absent de la phrase, et l'exemption des quatre
  formes qui portent un pas de 1 est **déclarée et vérifiée** ;
- une phrase **ambiguë** est refusée, avec ses lectures nommées : « Affiche
  x. » a trois lectures — `%d`, `%c`, `%s` — et C-A n'en choisit aucune ;
- le commentaire de traçabilité conserve **votre** phrase, pas celle que C-A
  a lue.

| Mesure | Résultat |
|---|---|
| corpus de validation **gelé** (C17) | 95,1 % (58/61) des phrases du périmètre |
| corpus **Java** | **100 %** (36/36) des phrases du périmètre |
| erreurs de sens | **0** |
| phrases acceptées à tort | **0** |

**Ce que ce chiffre ne prouve pas :** le corpus est gelé et n'a jamais servi à
enrichir le mécanisme, mais il a été écrit par l'auteur de ce mécanisme. Le
français spontané n'est mesuré par personne, et aucune mesure interne ne peut
remplacer un utilisateur.

Le français souple est **actif par défaut** depuis la 0.5.0. Le mode strict
reste accessible par le réglage `c-a.souplesse`, et la commande « A : Basculer
entre français strict et français souple » le fait en un geste.

**Et la mesure Java a trouvé un défaut de sens** qui touchait aussi les deux
autres langages : la garde des identifiants ne connaissait que « nommé » et
« appelé », et dans « Appelle la méthode afficher de e. » le mot `afficher`
est au lexique — la couche produisait `e.Affiche();`, et **A renommait
silencieusement la méthode de l'utilisateur**. C'est la faute la plus grave de
la classification, et la seule qu'aucun taux ne rachète. Corrigée, puis
corrigée une seconde fois parce que la correction sur-protégeait à son tour.
