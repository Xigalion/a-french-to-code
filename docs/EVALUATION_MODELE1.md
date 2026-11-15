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
| Compilation | — | **AUCUNE** |
| Exécution | — | **AUCUNE** |
| Tests hôte VS Code | `npm run test:vscode` | **échec de lancement**, cause identifiée |

Artefacts : `exercice/journal/journal.md` (version brute),
`journal-corrige.md`, `matrice.md`, `exercice/ca/`, `exercice/corrige/`,
`exercice/retouches.md`, `exercice/AUDIT_C17.md`,
`exercice/compiler.cmd`.

Le chemin de code exercé est **celui de l'hôte** : `translate` puis
`planPlacement` puis application de l'unique édition du plan. Seule
l'interface manque, et c'est précisément ce que les 97 tests hôte
couvriraient.

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
| Partiellement vérifiée — traduite, placée **et** exercée | **65** | le genre d'instruction apparaît dans les fichiers produits |
| Traduite et placée, **non exercée** | **19** | la sonde passe, mais l'exercice ne l'emploie pas |
| Refus attendu, obtenu | **1** | `Vérifie que "n = 0".` → `ASSIGNMENT_IN_CONDITION` |
| **Bloquée** | **6** | champ tableau, lecture de chaîne, définition `static`, initialiseur `{…}`, `limits.h`, macro de limite |
| **Vérifiée** | **0** | aucune : il faudrait compilation **et** exécution |

**Aucune compétence n'est « vérifiée ».** C'est la conclusion la plus
importante du rapport, et elle tient à une cause unique : l'absence de
compilateur.

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

### 5.5 Ce que la formule donne aujourd'hui

État des preuves, mesuré : P1 et P2 acquis pour 85 compétences sur 91 ;
P5 acquis pour celles dont le diagnostic ou l'information a été observé ;
**P3 et P4 nuls partout**.

Le plafond atteignable sans compilateur est donc :

    0,15 + 0,20 + 0,15 = 0,50     soit 50 % au maximum

et la complétion réelle est **inférieure** à ce plafond, puisque 6
compétences sont bloquées et 19 n'ont pas de preuve P5 observée dans
l'exercice.

**Je ne donne pas de pourcentage.** Le calcul serait exact et trompeur :
il dirait « environ 45 % » alors que la seule information utile est que
**la moitié du barème est inaccessible faute de compilateur**. Le chiffre
n'a de sens qu'une fois `exercice/compiler.cmd` exécuté.

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
| **4** | **Compiler l'exercice** | débloque 50 % du barème ; aucune ligne de code à écrire, seulement un compilateur | — |
| **5** | **Exécuter les 97 tests hôte** | seule preuve du parcours réel ; remédiation documentée, PID identifiés | — |
| **6** | Saut de ligne dans les affichages | gêne d'usage immédiate, aucune difficulté technique | aucune — nouvelle |
| **7** | Lecture de chaîne et de caractère depuis un fichier | ferme le domaine 7 pour un programme réel | aucune |
| **8** | Définition de fonction `static` | le prototype interne existe, la définition non : asymétrie gênante | aucune |
| **9** | Initialiseurs `{…}` pour les tableaux | évite une suite d'affectations pour un tableau constant | D6 : à réexaminer |
| **10** | Revoir le volume des informations | 94 informations pour 98 instructions : à mesurer à l'usage avant d'agir | décision 4 : décider sur observation |

Les rangs 1 à 3 sont des **corrections**. Les rangs 4 et 5 sont des
**preuves manquantes**, pas du code. Les rangs 6 à 10 sont des
**améliorations**, et le rang 10 ne doit rien changer avant d'avoir été
observé en usage réel, conformément à la décision 4.

---

## 7. Ce que ce rapport ne dit pas

- Que le C produit compile. **Rien ne le prouve.**
- Que le programme fait ce qu'il annonce. **Rien ne le prouve.**
- Que le parcours de l'éditeur fonctionne. Les 97 tests hôte n'ont pas
  tourné ; voir `docs/VALIDATION_MANUELLE_VSCODE.md`.
- Que les 91 compétences sondées épuisent les neuf domaines. La liste est
  la mienne, elle est discutable, et c'est le point 2 du §5.6.
