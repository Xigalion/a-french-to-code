# A — du français contrôlé vers du code

**A traduit une phrase française en une instruction, montre un aperçu, et
n'insère rien sans confirmation.** Trois déclinaisons : **C-A** vers **C17**,
**Python-A** vers **Python**, **Java-A** vers **Java 21**.

```
Crée un entier nommé age de valeur 20.
```

```c
// Crée un entier nommé age de valeur 20.
int age = 20;
```

La même phrase, dans un fichier `.py` :

```python
# Crée un entier nommé age de valeur 20.
age = 20
```

Et dans un fichier `.java` :

```java
// Crée un entier nommé age de valeur 20.
int age = 20;
```

Chaque langage a **son propre catalogue**, pour ses notions propres :

```
Crée un dictionnaire nommé notes avec la clé "ada" valant "15".
```

```python
# Crée un dictionnaire nommé notes avec la clé "ada" valant "15".
notes: dict = {"ada": 15}
```

```
Crée une classe nommée Eleve qui implémente Affichable.
```

```java
// Crée une classe nommée Eleve qui implémente Affichable.
public class Eleve implements Affichable {

}
```

Le commentaire conserve **exactement** la phrase saisie, sans normalisation
ni correction. Le code produit est la référence : c'est lui que l'on lit, que
l'on modifie et que l'on compile.

---

## Ce que c'est

**A** est un projet de programmation assistée : traduire une intention
exprimée en **langue naturelle contrôlée** vers du code d'un langage
**réel et existant**. Il se décline par langage cible : **C-A** vers C17,
**Python-A** vers Python, **Java-A** vers Java 21. Une seule extension
**VS Code** les porte tous les trois, moteur en TypeScript.

L'extension garde l'identifiant technique `projet-a-local.c-a` : c'est la clé
par laquelle VS Code reconnaît une installation, et la changer en
installerait une seconde à côté de l'ancienne. Le nom affiché, lui, est
« A — Français vers Code ».

**Aucun langage n'est un portage d'un autre.** Chacun a son **propre
catalogue pédagogique**, adapté à ses notions : listes, dictionnaires, `with`
et `match` pour Python ; classes, interfaces, collections typées, exceptions
vérifiées et bloc essaie avec ressource pour Java. Et ce que le C sait dire
mais que le langage cible ne connaît pas est **refusé avec sa raison**, qui
nomme la construction équivalente : les pointeurs renvoient à l'aliasing
d'une liste en Python, à la référence d'objet en Java ; `sizeof` à `len` ou à
la taille d'un tableau ; `#include` à `import`.

Et les différences de sens ne sont **jamais lissées**. `7 / 2` vaut 3 en C17
et en Java, 3.5 en Python ; `-7 % 2` vaut -1 en C17 et en Java, 1 en Python.
Chaque langage a ses phrases, et une information passive dit ce qui change.

L'idée tient en une phrase : *l'assistance doit réduire les difficultés
inutiles sans supprimer la nécessité de comprendre ce que l'on programme.*

## Ce que ce n'est pas

Ni un nouveau langage, ni un compilateur, ni un générateur de programmes à
partir de demandes vagues, ni un correcteur silencieux. C-A **n'invente
jamais** une information manquante : il explique ce qui manque.

En particulier, il **n'ajoute rien** que vous n'avez pas demandé — pas de
`main`, pas de `return`, pas d'`#include`, pas d'initialisation — et il
**ne corrige pas** : un refus explique l'erreur sans fournir la phrase
correcte à recopier.

## État du projet

**Prototype pédagogique, en test utilisateur supervisé.** Pas un produit.

| | |
|---|---|
| version | 0.6.0 |
| langages cibles | **trois** : C17, Python, Java 21 |
| domaines couverts | **9 / 9** par langage |
| formulations C17 | [`docs/CATALOGUE.md`](docs/CATALOGUE.md) — **tout ce qui n'y figure pas est refusé** |
| formulations Python | [`docs/CATALOGUE_PYTHON.md`](docs/CATALOGUE_PYTHON.md) — 33 portées, 64 natives, 51 refus nommés |
| formulations Java | [`docs/CATALOGUE_JAVA.md`](docs/CATALOGUE_JAVA.md) — 57 portées, 87 natives, 27 refus nommés |
| tests | **4 438** tests Node, **121** tests hôte VS Code |
| dépendances d'exécution | **aucune** |
| preuves d'exécution | 19 programmes C compilés en C17 `-Wall -Wextra -pedantic`, **9 programmes Python exécutés**, et **2 programmes Java compilés par `javac --release 21 -Xlint:all` et exécutés**, dont un de **quatre fichiers** |

**Les trois réglages sont actifs par défaut**, et chacun se ferme :

| Réglage | À `false` |
|---|---|
| `c-a.souplesse` | restaure le **mode strict** : seules les phrases exactes du catalogue |
| `c-a.python` | n'ouvre pas les fichiers `.py` |
| `c-a.java` | n'ouvre pas les fichiers `.java` |

Le mode strict reste la référence, et il reste **accessible** : la commande
« A : Basculer entre français strict et français souple » le fait en un geste.

**A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements — ni, en Java, la visibilité.** Une insertion
acceptée n'est pas un programme correct, et ne garantit même pas qu'il
compile ou qu'il s'exécute. C'est une limite assumée, documentée et testée :
voir [`docs/LIMITES_CONNUES.md`](docs/LIMITES_CONNUES.md).

**Et le chiffre qui compte le plus est encore à zéro :** personne n'a écrit un
programme avec A. Les programmes de preuve sont dictés par des scripts.

## Installer

Prérequis : **VS Code ≥ 1.96** et **Node.js ≥ 24.12** (pour fabriquer le
paquet ; le poste qui utilise l'extension n'en a pas besoin). Pour **rejouer
les preuves de compilation**, et pour cela seulement : un compilateur C17, un
interpréteur Python 3, et un **JDK 21** — aucun des trois n'est dans le dépôt,
et aucun n'est nécessaire pour utiliser A.

```sh
npm install
npm run check            # 4 438 tests ; ne rien installer si un seul échoue
npm run build:extension
node scripts/paquet.mjs  # écrit dist/c-a-<version>.vsix
code --install-extension dist/c-a-0.6.0.vsix
code --list-extensions --show-versions   # doit lister projet-a-local.c-a
```

Retour arrière : `code --uninstall-extension projet-a-local.c-a`. Rien
d'autre n'est écrit : aucun réglage ajouté, aucun fichier modifié hors de
ceux que vous confirmez.

Procédure complète, prérequis, vérifications et désinstallation :
[`docs/TEST_INSTALLATION.md`](docs/TEST_INSTALLATION.md).

## Utiliser

1. ouvrir un fichier `.c`, `.py` ou `.java` **enregistré sur le disque**,
   curseur sur une **ligne blanche** ;
2. **« A : Saisir une instruction »** (`Ctrl+K` puis `A`) ;
3. saisir la phrase, `Entrée` → un **aperçu diff en lecture seule** s'ouvre,
   et **rien n'est inséré** ;
4. confirmer « Insérer », modifier la phrase, ou annuler ;
5. l'insertion est **une seule modification annulable**.

Les informations pédagogiques arrivent dans le canal de sortie
**« C-A — Pédagogie »** : ni erreurs, ni avertissements — des explications
passives sur la notion que la phrase vient de toucher, dans les termes du
langage cible. Certaines **corrigent une règle apprise ailleurs** : le
`switch` de Java traverse les cas comme en C17, alors que le `match` de
Python ne les traverse jamais.

Première séance guidée :
[`docs/TEST_PARCOURS_DECOUVERTE.md`](docs/TEST_PARCOURS_DECOUVERTE.md).
Neuf exercices progressifs :
[`docs/TEST_EXERCICES_PALIER1.md`](docs/TEST_EXERCICES_PALIER1.md).

## Où est quoi

| Dossier | Contenu |
|---|---|
| `src/` | le moteur : analyse, AST d'intention, rendu, diagnostics. **N'importe jamais `vscode`** |
| `src/langages/` | un dossier par langage cible : `c17/`, `python/`, `java/` |
| `extension/` | l'hôte VS Code : saisie, aperçu, confirmation, insertion. Une session par langage |
| `test/` | 4 438 tests Node et la suite hôte VS Code |
| `exercice/` | les exercices de validation, leur code brut, leurs journaux de compilation |
| `test-utilisateur/` | le cahier d'exercices, ses corrigés et ses preuves |
| `docs/` | catalogue, contrats et bilans de lots, campagnes de validation, audits |
| `scripts/` | paquet, différentiel, dictée VS Code, progression |

Documents d'entrée :
[`docs/ETAT_DU_PROJET.md`](docs/ETAT_DU_PROJET.md) (ce qui est construit, ce
qui est prouvé, ce qui reste ouvert),
[`docs/CATALOGUE.md`](docs/CATALOGUE.md) (C17),
[`docs/CATALOGUE_PYTHON.md`](docs/CATALOGUE_PYTHON.md) (Python),
[`docs/CATALOGUE_JAVA.md`](docs/CATALOGUE_JAVA.md) (Java),
[`docs/LIMITES_CONNUES.md`](docs/LIMITES_CONNUES.md) (ce qu'il ne fait pas),
[`CHANGELOG.md`](CHANGELOG.md) (cette version et ses limites),
[`CONTRIBUTING.md`](CONTRIBUTING.md) (comment contribuer sans casser la
philosophie).

Les documents citent des **étiquettes** git, jamais des identifiants de
commit : [`docs/REPERES_GIT.md`](docs/REPERES_GIT.md) dit pourquoi.

## Signaler, contribuer, suivre

Trois formulaires de tickets : **refus incompris**, **C produit inattendu**,
**formulation manquante** — avec, dans les trois cas, la **phrase exacte** et
le **code du diagnostic**. Avant d'ouvrir : `docs/CATALOGUE.md` dit ce qui est
accepté, `docs/LIMITES_CONNUES.md` ce qui ne le sera pas.

Pour contribuer : [`CONTRIBUTING.md`](CONTRIBUTING.md). Une contribution part
d'une **lacune démontrée** — un programme qu'on ne peut pas écrire — pas
d'une idée.

Côté mainteneur, le suivi tient en une commande et un classement décidé
d'avance : [`docs/SUIVI_PUBLIC.md`](docs/SUIVI_PUBLIC.md).

    node scripts/suivi-public.mjs

## Vérifier soi-même

```sh
npm run check                        # typecheck + tests Node
npm run test:vscode                  # suite hôte dans une instance isolée
node scripts/dictee-vscode.mjs cloture   # rejoue un exercice dans l'IHM réelle
node scripts/progression.mjs             # les indicateurs d'avancement
node scripts/pre-publication.mjs         # 18 contrôles avant toute publication
node scripts/catalogue-java-public.mjs   # regénère le catalogue Java depuis le moteur
node scripts/mesurer-java.mjs            # le français souple, mesuré en Java
node scripts/suivi-public.mjs            # tickets et contributions en attente
```

Les preuves ne sont pas des affirmations : chaque programme de validation est
dans le dépôt avec son journal de compilation et sa sortie attendue, calculée
à la main avant exécution.

## Licence

**Apache License 2.0** — voir [`LICENSE`](LICENSE) et [`NOTICE`](NOTICE).

Réutilisation, modification et distribution libres, y compris commerciales,
à condition de conserver la mention de paternité, d'indiquer les
modifications apportées et de joindre la licence. Elle comporte une **clause
de brevet** explicite. Toute contribution proposée est réputée soumise à
cette même licence.

---

*English, in short:* C-A translates **controlled French** sentences into
**C17** statements inside VS Code, keeping the original sentence as a comment
above the generated code. It never invents missing information and never
fixes your sentence for you: it explains what is missing. Pedagogical
prototype, French-language interface, no runtime dependencies.
