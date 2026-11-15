# Évaluation du modèle 1 — rapport factuel

**15 novembre 2026.** Exercice intégrateur exécuté par le moteur et le
planificateur réels. **Aucune compilation, aucune exécution** : il n'existe
dans cet environnement ni `gcc`, ni `clang`, ni `cl.exe`, et WSL n'est pas
installé — vérifié, pas supposé.

> **Aucune validation complète n'est annoncée.** Deux des cinq preuves
> demandées — compilation et exécution — manquent entièrement. Le présent
> rapport dit ce qui est prouvé, ce qui ne l'est pas, et par quoi.

---

## 1. Ce qui a été réellement exécuté

| Preuve | Outil | Résultat |
|---|---|---|
| Traduction | `translate()` | **98 instructions** traduites sur 98 tentées (version corrigée) |
| Placement | `planPlacement()` + application de l'édition | **98 placements**, 0 refus |
| Fichiers produits | `exercice/corrige/` | `carnet.h` 32 l., `calcul.c` 35 l., `carnet.c` 172 l. |
| Informations pédagogiques | `explainInstruction()` | **94** émises |
| Avertissements de calcul | `analyzeCalculations()` | **1** (`INTEGER_ZERO_DIVISOR / certain-error`) |
| Tests unitaires | `npm run check` | **3 580 réussis, 0 échec** |
| Compilation | GCC 16.2.0 `-std=c17 -Wall -Wextra -pedantic` | **code de sortie 0**, un seul avertissement, voulu |
| Exécution | binaire produit | **code de sortie 0**, sortie et fichier conformes |
| Compilation séparée + liens | GCC, `.o` puis `ld` | **OK** ; garde d'en-tête tenue sous double inclusion |
| Tests hôte VS Code | `npm run test:vscode` | **99 cas, 99 réussis, 0 échec** (VS Code 1.138.0) |

Artefacts : `exercice/journal/journal.md` (version brute),
`journal-corrige.md`, `matrice.md`, `exercice/ca/`, `exercice/corrige/`,
`exercice/retouches.md`, `exercice/AUDIT_C17.md`,
`exercice/compiler.cmd`.

Le chemin de code exercé est **celui de l'hôte** : `translate` puis
`planPlacement` puis application de l'unique édition du plan. L'interface
elle-même est couverte à part, par la suite hôte, désormais exécutée.

### 1.1 Les preuves de compilation, en détail

Journal brut : `exercice/journal/compilation.txt`.

| # | Ce qui a été compilé | Résultat |
|---|---|---|
| 1 | **version brute de C-A**, `exercice/ca/` | **échec, attendu** : `multiple definition of 'compteur'` à l'édition de liens |
| 2 | **version corrigée**, `exercice/corrige/` | **0**, seul `-Wdiv-by-zero` sur le `total / 0` volontaire |
| 3 | exécution | **0** — `Carnet de notesCarnetCarnet312481513.67a revoir17` |
| 4 | fichier écrit par le programme | `resultat.txt` = `Meilleure note17` |
| 5 | compilation séparée `.o` puis liens | **OK**, même sortie |
| 6 | double inclusion de `carnet.h` | **OK**, aucune redéfinition |

L'échec de la ligne 1 est **le résultat attendu**, et il vaut preuve : il
confirme le blocage n° 2 du §2, où C-A place une définition de variable
globale dans un en-tête sans `extern`. Les deux versions sont conservées
séparément, et leur unique différence est documentée dans
`exercice/retouches.md`.

Le compilateur a été installé pour cette évaluation : **WinLibs GCC
16.2.0** (UCRT, portable), hors du dépôt. Aucun compilateur n'était
disponible auparavant, ce qui est la raison pour laquelle les versions
précédentes de ce rapport ne concluaient rien.

### 1.2 L'audit à la main, confronté au compilateur

`exercice/AUDIT_C17.md` avait été écrit **avant** toute compilation, pour
prédire ce que GCC dirait. La confrontation est au §4 de ce document, et
elle n'est pas un sans-faute :

- **Exactes** : tout ce qui concerne la compilation — la version corrigée
  passe, avec un seul avertissement et le bon, la version brute échoue sur
  `compteur`, `-Wextra` ne signale rien de plus, l'`assert` redondant ne
  produit aucune remarque, `resultat.txt` est conforme au mot.
- **Abstention correcte** : l'audit avait refusé de prédire
  `sizeof(struct Eleve)`, valeur définie par l'implémentation, en notant
  qu'« on peut attendre 48 ». Elle vaut **48**. Ce n'est pas une prédiction
  confirmée, et je ne la compte pas comme telle.
- **Fausse** : la ligne de sortie prédite porte **un chiffre de trop** avant
  la valeur de `sizeof`. Toutes les valeurs attendues sont au bon endroit,
  mais la chaîne écrite à la main est inexacte.

Cette erreur est instructive plutôt que gênante : relire à l'œil une
concaténation de onze `printf` sans séparateur est précisément ce que l'œil
rate, et c'est l'argument le plus concret pour la correction de rang 4
(saut de ligne dans les affichages).

---

## 2. Les huit blocages recensés : vérification

| Blocage annoncé | Verdict | Détail mesuré |
|---|---|---|
| Champ de type tableau | **confirmé** | `UNEXPECTED_TEXT` |
| `limits.h` refusé | **confirmé** | `UNSUPPORTED_HEADER` |
| Macro de limite | **confirmé** | `UNKNOWN_FORMULATION` |
| Définition `static` | **confirmé** | `UNKNOWN_FORMULATION` |
| Lecture de chaîne depuis un fichier | **confirmé** | `UNKNOWN_FORMULATION` |
| Initialiseur entre accolades | **confirmé** | `UNEXPECTED_TEXT` |
| Arithmétique de pointeur non signalée | **confirmé** | `p = (p + 1);` est produit sans un mot |
| Profil entier fermé à l'indexation | **confirmé** | `INVALID_EXPRESSION_TOKEN` |

Huit sur huit. Aucun n'était inexact.

---

## 3. Blocages supplémentaires découverts

### 3.1 C-A accepte des instructions à la portée fichier — **grave**

Treize sondes, curseur sur une ligne blanche **après** la dernière
accolade de `main` :

| Instruction | C17 à la portée fichier | C-A |
|---|---|---|
| `Déclare un entier nommé x.` | légal | placé |
| `Crée une fonction nommée f qui retourne un int.` | légal | placé |
| `Affecte la valeur 5 à x.` | **illégal** | **placé** |
| `Affiche la valeur de x.` | **illégal** | **placé** |
| `Appelle f avec "1".` | **illégal** | **placé** |
| `Crée un bloc si "x > 0".` | **illégal** | **placé** |
| `Crée une boucle tant que "x".` | **illégal** | **placé** |
| `Vérifie que "x > 0".` | **illégal** | **placé** |
| `Libère la mémoire pointée par p.` | **illégal** | **placé** |
| `Retourne la valeur 0.` | illégal | refusé `NO_ENCLOSING_FUNCTION` |
| `Sors de la boucle la plus intérieure.` | illégal | refusé `LOOP_TARGET_NOT_FOUND` |
| `Ajoute un cas pour la valeur 1.` | illégal | refusé `SWITCH_TARGET_NOT_FOUND` |
| `Ajoute un champ de type int nommé v.` | illégal | refusé `FIELD_OUTSIDE_STRUCT` |

**Sept instructions sur treize produisent du C qui ne compile pas, et sont
placées sans un mot.** Le projet a construit quatre reconnaisseurs de
contexte — `loopTarget`, `switchTarget`, `structTarget`, `functionContext` —
et a oublié le plus simple : **une instruction n'est pas une déclaration**.

C'est la première fois que l'exercice voit ce que 3 580 tests ne voyaient
pas, parce que les tests placent toujours le curseur à l'endroit correct.

### 3.2 Sortir d'un bloc demande un geste qui n'est pas de C-A

Un bloc **consomme** la ligne blanche sur laquelle il est posé, et sa ligne
blanche de corps est à l'intérieur. Après avoir fermé un bloc, il n'existe
donc **aucune** ligne blanche au niveau englobant : l'utilisateur doit en
créer une avec `Entrée`.

Mesuré : **6 gestes** pour cet exercice. Ce n'est pas écrire du C, et dans
l'éditeur c'est invisible — mais c'est une étape hors catalogue, et elle est
comptée comme telle dans le journal.

### 3.3 Le champ tableau est structurant, pas marginal

Connu, mais l'exercice en montre le poids : sans `char nom[32];`,
`struct Eleve` n'a pas de nom et le programme perd son objet. C'est la
**seule** ligne de C écrite à la main de tout l'exercice
(`exercice/retouches.md`).

### 3.4 Trois informations justes, ignorées sans conséquence

Dans la version brute, trois défauts réels sont apparus, et **C-A avait
prévenu deux fois sur trois** :

| Défaut | L'information qui le disait |
|---|---|
| `compteur` défini dans deux unités → symbole dupliqué | `EXTERNAL_LINKAGE`, mot pour mot |
| `fopen` non testé avant `fprintf` | `FOPEN_CAN_FAIL`, mot pour mot |
| `notes[1]` lu sans avoir été écrit | aucune — limite assumée |

Les informations étaient **exactes et au bon endroit**. Elles n'empêchent
rien, par conception. L'exercice confirme que le canal passif fonctionne et
qu'il ne protège de rien — les deux à la fois.

### 3.5 Aucun saut de ligne dans les affichages

Aucune formulation ne produit `\n` dans un `printf`, et C-A n'en ajoute
pas. La sortie prédite est donc une **seule ligne** collée. Ce n'est pas un
défaut de correction — c'est une gêne d'usage réelle qu'aucun test n'avait
relevée.

---

## 4. Matrice de couverture

`exercice/journal/matrice.md`, générée par `exercice/matrice.mjs`.
**91 compétences** sondées sur les neuf domaines, chacune mesurée et non
déclarée.

| État | Nombre | Ce que cela signifie |
|---|---|---|
| **Vérifiée** — cinq preuves réunies | **65** | traduite, placée, exercée, compilée **et** exécutée |
| Traduite et placée, **non exercée** | **19** | la sonde passe, mais mon exercice ne l'emploie pas |
| Refus attendu, obtenu | **1** | `Vérifie que "n = 0".` → `ASSIGNMENT_IN_CONDITION` |
| **Bloquée** | **6** | champ tableau, lecture de chaîne, définition `static`, initialiseur `{…}`, `limits.h`, macro de limite |
| Partiellement vérifiée | **0** | — |

**Limite de cette lecture, à ne pas masquer.** P3 et P4 sont des preuves
**collectives** : le programme compile et s'exécute en entier, ce qui vaut
pour tout genre d'instruction qu'il contient, mais pas pour un genre qu'il
ne contient pas. Les 19 compétences « non exercées » ne sont donc pas des
lacunes du produit — elles se traduisent et se placent — mais des lacunes
de **mon scénario**. Le §5.5 chiffre les deux séparément.

---

## 5. Méthode de calcul de la complétion — proposition

### 5.1 Pourquoi une méthode explicite

Compter les tests réussis mesure la **cohérence interne** du moteur, pas sa
complétion. Compter les domaines couverts mesure l'**étendue déclarée**, pas
le fonctionnement. Les deux chiffres sont flatteurs et aucun ne répond à la
question.

### 5.2 Les cinq preuves, et leur poids

Une compétence n'est complète que si cinq choses sont vraies. Les poids
proposés reflètent **ce qu'il faut à l'étudiant**, pas ce qu'il est facile
de mesurer.

| Preuve | Poids | Justification |
|---|---|---|
| **P1 — Traduction** | 15 % | nécessaire mais faible : traduire est le plus facile, et le projet le teste déjà massivement |
| **P2 — Placement sûr** | 20 % | une traduction juste posée au mauvais endroit produit du C faux ; le §3.1 montre que ce n'est pas théorique |
| **P3 — Compilation** | 30 % | **le poids le plus fort** : si le C ne compile pas, l'étudiant n'apprend rien. C'est la preuve qui manque entièrement |
| **P4 — Exécution conforme** | 20 % | le programme doit faire ce que la phrase annonçait, sinon la traçabilité est un mensonge |
| **P5 — Diagnostic ou information juste** | 15 % | la valeur pédagogique propre de C-A : un refus compréhensible, une information exacte et au bon endroit |

### 5.3 Pondération des compétences entre elles

Toutes les compétences ne valent pas la même chose. Trois niveaux :

| Niveau | Coefficient | Critère |
|---|---|---|
| **Fondamentale** | 3 | sans elle, aucun programme du domaine ne s'écrit (déclaration, affectation, affichage, condition, boucle, fonction, retour) |
| **Structurante** | 2 | elle ouvre une famille de programmes (tableau, chaîne, pointeur, structure, allocation, fichier, en-tête) |
| **Complémentaire** | 1 | elle enrichit sans débloquer (formats d'affichage, réallocation, synonyme, assertion, constante) |

### 5.4 La formule

Pour chaque compétence *c* de coefficient *k(c)* :

    score(c) = k(c) × ( 0,15·P1 + 0,20·P2 + 0,30·P3 + 0,20·P4 + 0,15·P5 )

où chaque Pᵢ vaut **1** si la preuve existe, **0** sinon. Pas de valeur
intermédiaire : une preuve partielle n'est pas une preuve.

    complétion = Σ score(c) / Σ k(c)

Une compétence **bloquée** a tous ses Pᵢ à 0 et compte bien dans le
dénominateur : c'est ce qui empêche la complétion de se gonfler en
retirant ce qui ne marche pas.

### 5.5 Ce que la formule donne — chiffre mesuré

Le calcul est désormais possible, puisque P3 et P4 existent. Il est fait
par `exercice/matrice.mjs`, qui **refuse de s'exécuter** si
`journal/compilation.txt` ne contient pas les deux codes de sortie nuls —
le chiffre ne peut donc pas être produit sans ses preuves.

    complétion     81,7 %
      niveau 3 (fondamentale)   85,9 %
      niveau 2 (structurante)   86,7 %
      niveau 1 (complémentaire) 69,3 %

Le dégradé est dans le bon sens : ce qui est fondamental est mieux prouvé
que ce qui est complémentaire.

**Comment lire ce chiffre.** Pas comme une note de qualité du produit, mais
comme la part du barème dont j'ai la preuve. Deux hypothèses le déplacent,
et il faut les distinguer :

| Hypothèse | Complétion |
|---|---|
| **Mesurée aujourd'hui** | **81,7 %** |
| Si l'exercice employait aussi les 19 compétences non exercées | **91,6 %** |
| Si, en plus, les 6 blocages étaient levés | **95,0 %** |

Les points entre la première et la deuxième ligne mesurent **mon
scénario**, pas C-A : ces compétences se traduisent et se placent déjà.
Ceux de la ligne suivante mesurent les **vraies lacunes** du modèle 1. Le
reste est le P5 absent là où aucune information ni aucun diagnostic n'est
émis.

Autrement dit : **le produit vaut mieux que 81,7 %, et la preuve vaut
exactement 81,7 %.** Enrichir l'exercice ferait monter le chiffre, mais ce
serait une autre campagne de mesure, pas une correction — et je ne l'ai pas
faite, pour ne pas confondre les deux.

### 5.6 Ce que je te demande de valider

1. Les **cinq preuves** et leurs poids, en particulier les 30 % de la
   compilation.
2. Les **trois coefficients** de compétence, et le classement de chacune
   des 91 lignes — c'est la partie la plus discutable, et je l'ai faite
   seul.
3. Le principe qu'une compétence **bloquée reste au dénominateur**.

---

## 6. Corrections nécessaires, par priorité

| # | Correction | Pourquoi ce rang | Décision déjà prise |
|---|---|---|---|
| **1** | **Refuser une instruction à la portée fichier** | produit du C non compilable **en silence** ; c'est la seule lacune qui trahit le principe « refus explicite » | aucune — nouvelle |
| **2** | **Champ de structure de type tableau** | sans lui, aucune structure ne porte de nom ; seule retouche manuelle de l'exercice | décision 3 du fondateur : dans le périmètre |
| **3** | **`limits.h`, `float.h` et les macros de portabilité** | pièce manquante du domaine 9 ; demande d'amender un instantané gelé | décision 2 du fondateur : dans le périmètre |
| ~~4~~ | ~~Compiler l'exercice~~ | **fait** : GCC 16.2.0, compilation 0, exécution 0 (§1.1) | — |
| ~~5~~ | ~~Exécuter les tests hôte~~ | **fait** : 99/99 sur VS Code 1.138.0 ; un test périmé depuis le lot 11D trouvé et corrigé | — |
| **4** | Saut de ligne dans les affichages | gêne d'usage immédiate, aucune difficulté technique | aucune — nouvelle |
| **5** | Lecture de chaîne et de caractère depuis un fichier | ferme le domaine 7 pour un programme réel | aucune |
| **6** | Définition de fonction `static` | le prototype interne existe, la définition non : asymétrie gênante | aucune |
| **7** | Initialiseurs `{…}` pour les tableaux | évite une suite d'affectations pour un tableau constant | D6 : à réexaminer |
| **8** | Revoir le volume des informations | 94 informations pour 98 instructions : à mesurer à l'usage avant d'agir | décision 4 : décider sur observation |

Les rangs 1 à 3 sont des **corrections**. Les deux rangs barrés étaient des
**preuves manquantes** : elles sont réunies, et c'est ce qui a rendu le §5.5
calculable. Les rangs 4 à 8 sont des **améliorations**, et le rang 8 ne doit
rien changer avant d'avoir été observé en usage réel, conformément à la
décision 4.

Une neuvième entrée reste ouverte, et ce n'est pas une correction mais un
**arbitrage de périmètre** : le message de `UNSUPPORTED_HEADER`, figé par
les instantanés des lots 4 et 5, affirme que seul `stdio.h` est pris en
charge alors que `stdlib.h`, `assert.h` et les en-têtes de fichiers le sont
aussi. Le message est **sous-estimé**, donc jamais trompeur dans le sens
dangereux ; le corriger demande d'amender un contrat gelé.

---

## 7. Ce que ce rapport ne dit pas

- Que **tout** le C produit par C-A compile. Un seul programme a été
  compilé. Les 19 compétences non exercées n'ont **aucune** preuve de
  compilation, et le §5.5 ne les compte pas.
- Que C-A **empêche** d'écrire du C non compilable. Il ne l'empêche pas :
  c'est la lacune n° 1 du §3.1, et la version brute de l'exercice, qui
  échoue à l'édition de liens, en est la preuve.
- Que les 91 compétences sondées épuisent les neuf domaines. La liste est
  la mienne, elle est discutable, et c'est le point 2 du §5.6.
- Que les tests hôte couvrent tout le parcours. Trois gestes restent
  irréductiblement manuels — touches physiques, composition IME, contrôle
  visuel du focus et du diff ; voir `docs/VALIDATION_MANUELLE_VSCODE.md`.
- Que 81,7 % soit une note de qualité. C'est une **part de preuve**, et le
  §5.5 dit exactement ce qui la déplacerait.
