# A / C-A — Première version complète du modèle 1

**15 novembre 2026.** Les **neuf domaines** du parcours « Algorithmique et
développement logiciel en C17 » sont couverts, des lots 1 à 25.

Ce document est la livraison demandée. Il dit ce qui est **réellement
implémenté**, ce qui a été **réellement exécuté**, et ce qui **ne
fonctionne pas**. Il n'affirme rien qui n'ait été mesuré.

> **La réussite des tests automatisés ne vaut pas complétion.** C'est
> l'exercice intégrateur (`docs/EXERCICE_INTEGRATEUR.md`) qui doit mesurer
> la complétion réelle, et il n'a pas encore été exécuté.

---

## 1. Catalogue des compétences et des formulations

Le catalogue complet, avec la sortie C exacte de chaque phrase et les
informations pédagogiques associées, est dans **`docs/CATALOGUE.md`**.

**Il a été vérifié contre le moteur, pas relu.** Un rejeu des 123 lignes
de phrase du catalogue donne :

    lignes de catalogue verifiees : 123
    conformes                     : 123
    ecarts                        : 0

### Les neuf domaines et leurs lots

| Domaine | Lots | État |
|---|---|---|
| 1 — Fondations | 1 à 5 | livré |
| 2 — Expressions et calculs | 6 à 8 | livré ; recette GCC ouverte |
| 3 — Décisions et répétitions | 9 à 11D, **19** | livré ; `switch` ajouté au lot 19 |
| 4 — Fonctions et décomposition | 12, **23** | livré ; prototypes ajoutés au lot 23 |
| 5 — Tableaux, chaînes et pointeurs | 13 à 18 | livré |
| 6 — Structures et mémoire dynamique | **20, 21** | livré |
| 7 — Fichiers et modularité | **22, 23** | livré |
| 8 — Algorithmes et structures de données | **24** | livré |
| 9 — Fiabilité et maîtrise avancée | **25** | livré, moins `limits.h` — voir §4 |

### Mesures du catalogue

| | |
|---|---|
| Intentions distinctes exercées par le catalogue | **80** |
| Intentions créant un bloc à corps vide | 11 |
| Codes de diagnostic publiés | 68 |
| Informations pédagogiques distinctes émises | **60** |

---

## 2. Fonctionnalités réellement implémentées

### Ce que C-A fait

- Traduit une phrase de français contrôlé en **un fragment C17**, avec la
  phrase conservée **exactement** dans un commentaire `//` au-dessus.
- Produit un **aperçu diff en lecture seule**, puis attend la confirmation,
  puis insère en **une seule modification annulable**.
- Refuse explicitement, avec un diagnostic qui désigne la bonne partie de
  la phrase par un **intervalle UTF-16 absolu**, sans normalisation.
- **Vérifie le contexte** avant de placer : un `break` exige sa boucle, un
  `case` son aiguillage, un `return` sa fonction et son type de retour, un
  champ sa structure, une définition de fonction la portée fichier.
- Émet des **informations pédagogiques passives** sur un canal distinct,
  qui n'incrémentent jamais le compteur d'avertissements.
- Émet des **avertissements de calcul** non bloquants (division par zéro,
  reste flottant).

### Ce que C-A ne fait pas, par conception

- Il n'invente **rien** : ni `main`, ni `return`, ni `#include`, ni
  variable, ni initialisation, ni dimension, ni format d'affichage.
- Il ne **corrige** pas : il explique l'erreur sans fournir
  systématiquement la phrase correcte à recopier.
- Il ne **résout aucun symbole** : il ignore si un nom désigne un tableau,
  un pointeur, une structure, ou n'existe pas.
- Il ne **vérifie ni type, ni portée, ni borne, ni durée de vie**.
- Il ne **garantit pas** que le C produit compile. L'absence
  d'avertissement n'est pas un certificat.

### Architecture

28 fichiers de moteur, 5 282 lignes, **aucune dépendance runtime**
(`typescript` et `@types/vscode` seulement). `src/` n'importe **jamais**
`vscode`. Toute position est un intervalle UTF-16 semi-ouvert. Le
placement **planifie** ; seul l'hôte applique, après confirmation.

Un **noyau d'expressions unifié** (lot 13) porte quatre profils définis
par enregistrements de capacités explicites :

| Profil | Ouvert à |
|---|---|
| entier (lot 6) | **rien de plus depuis le lot 6** |
| numérique (lot 7) | conversions, `char`, indexation, littéraux caractères, `&`, `*`, décalage, `.`/`->` |
| condition (lots 9-10) | idem, plus la logique |
| indice (lot 15) | grammaire entière plus indexation imbriquée |

Le profil entier est resté **scellé pendant dix lots consécutifs**. C'est
la propriété que le différentiel vérifie à chaque lot avec
`--frozen-stages "^entier"`.

---

## 3. Résultats des tests exécutés

### Ce qui a été exécuté

    npm run check   →   3 580 tests Node réussis, 0 échec
                        contrôle TypeScript du moteur et de l'extension : propre

29 fichiers de tests, 9 824 lignes.

    npm run build:extension   →   réussi
                                  extension/out/extension/src/extension.js produit,
                                  conforme au « main » du manifeste

### Différentiel

`scripts/differentiel.mjs` rejoue le moteur d'une référence git **à côté**
du moteur courant sur un corpus généré, et compare arbres, diagnostics,
messages, intervalles, budgets, fragments, avertissements, informations et
plans de placement.

Contre la référence d'avant la refonte du noyau (`ref-avant-lot-13`), avec un motif
d'extensions **universel** :

    comparaisons           : 1 334 392
    extensions approuvées  : 79 517
    régressions            : 0

Trois audits encadrent ce chiffre, parce qu'un motif d'extensions ne se
vérifie pas lui-même :

- `--frozen-stages "^entier"` : aucune indulgence sur le profil gelé. Une
  mutation de contrôle qui y fait fuiter une capacité donne **6 462
  régressions**.
- `--no-loss` : une extension peut transformer un refus, jamais retirer ce
  qui était accepté.
- injection de mutations : à chaque lot, des mutations de contrôle ont été
  injectées et détectées, et le témoin remis à zéro.

**Deux déclenchements de `--no-loss` ont été instruits, pas écartés** :
lot 20 (6 512 pertes, artefact du validateur permissif du harnais, prouvé
en rejouant 57 entrées par `translate()` des deux moteurs) et lot 24 (88
pertes, ajout d'un champ aux paramètres d'une intention, fragments et
éditions de placement identiques).

### Ce qui a été exécuté depuis — mise à jour du 15 novembre 2026

Trois dettes annoncées ici comme non réglées l'ont été le jour même, après
autorisation du fondateur. Le texte d'origine est remplacé, parce qu'il est
devenu faux ; les preuves sont des fichiers, pas des affirmations.

| Dette | État | Preuve |
|---|---|---|
| Tests hôte VS Code | **99 cas, 99 réussis, 0 échec** sur VS Code 1.138.0 | `exercice/journal/hote.txt`, `docs/VALIDATION_MANUELLE_VSCODE.md` |
| Compilation GCC de l'exercice | **code de sortie 0**, un seul avertissement, voulu | `exercice/journal/compilation.txt` |
| Exécution | **code de sortie 0**, sortie et fichier conformes | `exercice/journal/sortie-execution.txt` |
| Exercice intégrateur | **exécuté**, 98 instructions, 0 refus | `docs/EVALUATION_MODELE1.md` |

Deux rectifications, puisqu'elles touchent des chiffres répétés dans toute
la documentation du projet :

- la cause du blocage hôte **n'était pas** un téléchargement. Le script ne
  télécharge rien : deux processus d'installateur orphelins détenaient le
  mutex `vscode-updating` ;
- la suite hôte compte **99 cas**, pas 97. Le chiffre « 97 » était périmé,
  et un de ces tests échouait en silence **depuis le lot 11D** — invisible
  précisément parce que la suite ne pouvait pas s'exécuter.

**Toujours non exécuté** : la recette GCC du domaine 2 et les recettes
manuelles des domaines 3 et 4 et du lot 10. Un compilateur est désormais
disponible, donc la première n'est plus bloquée, seulement à faire.

---

## 4. Limites et problèmes connus

### Deux décisions qui t'attendent

**(a) Les instantanés de compatibilité gèlent la règle d'inclusion.**
`test/lot4-compatibility.json`, `lot5-` et `lot6-` gèlent le message de
`UNSUPPORTED_HEADER` et le **refus** de `limits.h` et `float.h`. Trois
en-têtes sont désormais pris en charge — `stdio.h`, `stdlib.h`,
`assert.h` — par des branches distinctes, et le message gelé en
sous-estime deux.

Conséquence réelle : **pas de `INT_MAX`**, donc la pièce « portabilité »
du domaine 9 manque. J'ai implémenté les macros, le test d'instantané a
échoué, et j'ai **retiré la capacité** plutôt que de toucher l'instantané —
livrer une macro sans pouvoir inclure son en-tête produirait du C qui ne
compile pas.

> Autorises-tu un amendement **explicite et minimal** de ces instantanés,
> limité aux entrées d'en-tête, pour unifier la règle d'inclusion et
> ouvrir `limits.h` et `float.h` ?

**(b) Un champ de structure ne peut pas être un tableau.**
`char nom[32];` comme champ est impossible : `Ajoute un champ …` n'accepte
ni dimension, ni type tableau. C'est le manque le plus visible du domaine
6 pour tout programme qui stocke des noms. Vérifié :
`Ajoute un champ de type char nommé nom de dimension 32.` →
`UNEXPECTED_TEXT`.

### Ce qui n'est pas livré

`goto`, macros à remplacement, `#if`/`#ifdef`, énumérations, unions
déclarées, champs de bits, `typedef` d'autre chose qu'une structure,
définition de fonction `static`, `static_assert`, `calloc`,
`sizeof` sur une expression, `string.h`, `errno`, `fgets`/`fputs`/
`fread`/`fseek`, lecture d'autre chose qu'un entier depuis un fichier,
`limits.h`, `float.h`, tableaux multidimensionnels, initialiseurs `{…}`,
affectation globale de tableau ou de chaîne, dimension déduite
(`char s[] = "…"`), tableau de pointeurs, pointeur de tableau, double
indirection, pointeur de fonction, retour ou paramètre de type pointeur,
soustraction de pointeurs, `++`/`--`, tests automatisés, débogage, mesure
de temps, couverture.

Types : `int`, `unsigned int`, `float`, `double`, `char`, `void`. Pas de
`long`, `short`, `unsigned char`, `signed char`.

### Pièges connus du C produit

| Situation | Comportement |
|---|---|
| Une étiquette de `case` seule avant `}` | **ne compile pas** en C17 ; `CASE_NEEDS_STATEMENT` le dit |
| `p + 1` écrit sur un nom | traduit en `p = (p + 1);` sans un mot : C-A ignore que `p` est un pointeur |
| `*(p + q)` avec deux noms | accepté ; `OFFSET_TYPE_NOT_CHECKED` dit que la forme ne garantit rien |
| `t = u;` sur deux noms | traduit ; C-A ne sait pas que `t` est un tableau |
| `NULL` | lu comme un nom ordinaire ; fonctionne si `stdlib.h` est inclus |
| `calloc(10, 4)` | traduit comme un appel ordinaire ; C-A ne connaît pas ce nom |
| `char c = 300;` | traduit sans vérification de représentabilité |
| `t[300]` sur `int t[3];` | traduit et plaçable ; aucune borne n'est vérifiée |

Chacun de ces points est **couvert par un test** qui fixe le comportement
réel, et par une information passive quand il y en a une à dire.

### Dettes du harnais différentiel

1. Son validateur de noms est volontairement **permissif**, pour exercer
   les chemins où un nom malformé atteint l'analyseur. Un lot qui touche
   la tokenisation des noms verra donc `--no-loss` se déclencher à tort.
2. Enrichir les paramètres d'une intention déjà publiée change la sortie
   **structurée** et le plan qui l'embarque, donc `--no-loss` se
   déclenche même quand le C est identique.

Dans les deux cas la procédure est la même : lister avec `--all`, puis
comparer les **fragments** et les **éditions de placement**, pas le JSON
entier.

---

## 5. Utiliser cette version dans VS Code

### Préparation

    cd <DOSSIER-PERSONNEL>\Downloads\A
    npm install
    npm run check              # 3 580 tests, contrôle TypeScript
    npm run build:extension    # produit extension/out/

### Lancer l'extension

1. Ouvrir le dossier `A` dans VS Code.
2. `F5`, ou **Exécuter et déboguer → Run Extension**. Une seconde fenêtre
   VS Code s'ouvre, avec C-A chargée.
3. Dans cette fenêtre, ouvrir ou créer un fichier **`.c`** — l'extension
   n'est active que sur `editorLangId == c` et `resourceExtname == .c`,
   dans un fichier sur disque.

### Écrire une instruction

1. Placer le curseur sur une **ligne blanche** (uniquement espaces ou
   tabulations). Une ligne non blanche est refusée
   (`TARGET_LINE_NOT_BLANK`).
2. `Ctrl+K` puis `A`, ou la palette → **« C-A : Saisir une instruction »**.
3. Saisir la phrase française. `Entrée` prépare un **aperçu diff en
   lecture seule** : rien n'est encore écrit.
4. Choisir **Insérer**, **Modifier la phrase**, ou **Annuler**.
5. L'insertion est **une seule modification annulable** : un `Ctrl+Z` la
   défait entièrement.

### Lire les explications

Les informations pédagogiques s'affichent dans le canal de sortie
**« C-A — Pédagogie »** : *Affichage → Sortie*, puis choisir ce canal. Ce
sont des **informations**, jamais des avertissements.

### Compiler le résultat

    gcc -std=c17 -Wall -Wextra -pedantic carnet.c -o carnet

C-A ne compile pas et ne garantit pas que le C produit compile. Si le
compilateur se plaint, le code source est la référence : il est là pour
être lu, modifié et compris.

L'exercice intégrateur a été compilé ainsi et **passe** (GCC 16.2.0, code
de sortie 0). Cela ne vaut que pour ce programme : rien ne garantit la
compilation d'un autre, et la lacune la plus sérieuse du modèle 1 est
justement que C-A accepte des instructions à la portée fichier, ce qui
produit du C non compilable sans un mot.

### Tests hôte

`npm run test:vscode` exige un VS Code **déjà installé** et ne télécharge
rien. Il passe : **99 cas, 99 réussis**. Si la commande échoue avec
« Code is currently being updated », un installateur orphelin détient le
mutex : voir `docs/VALIDATION_MANUELLE_VSCODE.md`.

---

## 6. Exercice intégrateur — proposé, puis exécuté

> **Exécuté le 15 novembre 2026.** 98 instructions insérées, 0 refus, le C
> produit compile et s'exécute, et la complétion pondérée mesurée est de
> **81,7 %** avec 65 compétences vérifiées sur 91 et 6 bloquées. Rapport :
> `docs/EVALUATION_MODELE1.md`.

L'énoncé complet est dans **`docs/EXERCICE_INTEGRATEUR.md`** : un carnet
de notes en mémoire dynamique, séparé en un en-tête protégé et deux
fichiers source, traversant les neuf domaines.

Il a été **vérifié avant livraison** : les **71 phrases** de l'énoncé
passent toutes par le moteur, et les **8 blocages annoncés** au §4 de
l'énoncé ont tous été confirmés empiriquement, diagnostic par diagnostic.

L'énoncé est conçu pour **échouer utilement** : il demande de consigner
chaque phrase, chaque refus et chaque diagnostic, puis de compiler avec
`-Wall -Wextra -pedantic` et de tout noter. Les blocages **hors** de sa
liste attendue sont les plus précieux : ce sont les lacunes que ni les
tests ni le différentiel ne pouvaient voir.

---

## 7. Méthode suivie

Chaque lot a reçu son **contrat écrit avant l'implémentation**, ses tests,
son **bilan chiffré**, et une mise à jour du catalogue et de `CLAUDE.md`.
26 commits, un par lot ou par étape documentaire.

Les refus historiques qu'un lot ouvrait délibérément ont été **adaptés sur
place, avec un commentaire nommant le lot et la décision**, jamais
supprimés en silence. Les instantanés de compatibilité des lots 4, 5 et 6
n'ont **jamais** été régénérés — une tentative a eu lieu au lot 21, elle a
été refusée, et c'était la bonne décision.

Les bilans détaillés sont dans `docs/LOT{n}_BILAN.md` et
`docs/LOT{n}_CONTRAT_ET_BILAN.md`, du lot 13 au lot 25.
