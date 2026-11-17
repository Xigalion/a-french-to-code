# C-A — du français contrôlé vers du C17

**C-A traduit une phrase française en une instruction C17, montre un aperçu,
et n'insère rien sans confirmation.**

```
Crée un entier nommé age de valeur 20.
```

```c
// Crée un entier nommé age de valeur 20.
int age = 20;
```

Le commentaire conserve **exactement** la phrase saisie, sans normalisation
ni correction. Le code produit est la référence : c'est lui que l'on lit, que
l'on modifie et que l'on compile.

---

## Ce que c'est

**A** est un projet de programmation assistée : traduire une intention
exprimée en **langue naturelle contrôlée** vers du code d'un langage
**réel et existant**. **C-A** en est la première incarnation —
**français → C17**, intégrée à **VS Code**, moteur en TypeScript.

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
| version | 0.4.0 |
| domaines du parcours C17 couverts | **9 / 9** |
| formulations reconnues | voir [`docs/CATALOGUE.md`](docs/CATALOGUE.md) — **tout ce qui n'y figure pas est refusé** |
| tests | **3 834** tests Node, **99** tests hôte VS Code |
| dépendances d'exécution | **aucune** |
| preuves de compilation | 10 programmes écrits par C-A, compilés en C17 `-Wall -Wextra -pedantic`, exécutés |

**C-A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements.** Une insertion acceptée n'est pas un
programme correct, et ne garantit même pas qu'il compile. C'est une limite
assumée, documentée et testée : voir
[`docs/LIMITES_CONNUES.md`](docs/LIMITES_CONNUES.md).

## Installer

Prérequis : **VS Code ≥ 1.96** et **Node.js ≥ 24.12** (pour fabriquer le
paquet ; le poste qui utilise l'extension n'en a pas besoin).

```sh
npm install
npm run check            # 3 834 tests ; ne rien installer si un seul échoue
npm run build:extension
node scripts/paquet.mjs  # écrit dist/c-a-<version>.vsix
code --install-extension dist/c-a-0.4.0.vsix
code --list-extensions --show-versions   # doit lister projet-a-local.c-a
```

Retour arrière : `code --uninstall-extension projet-a-local.c-a`. Rien
d'autre n'est écrit : aucun réglage ajouté, aucun fichier modifié hors de
ceux que vous confirmez.

Procédure complète, prérequis, vérifications et désinstallation :
[`docs/TEST_INSTALLATION.md`](docs/TEST_INSTALLATION.md).

## Utiliser

1. ouvrir un fichier `.c` **enregistré sur le disque**, curseur sur une
   **ligne blanche** ;
2. **« C-A : Saisir une instruction »** (`Ctrl+K` puis `A`) ;
3. saisir la phrase, `Entrée` → un **aperçu diff en lecture seule** s'ouvre,
   et **rien n'est inséré** ;
4. confirmer « Insérer », modifier la phrase, ou annuler ;
5. l'insertion est **une seule modification annulable**.

Les informations pédagogiques arrivent dans le canal de sortie
**« C-A — Pédagogie »** : ni erreurs, ni avertissements — des explications
passives sur la notion C que la phrase vient de toucher.

Première séance guidée :
[`docs/TEST_PARCOURS_DECOUVERTE.md`](docs/TEST_PARCOURS_DECOUVERTE.md).
Neuf exercices progressifs :
[`docs/TEST_EXERCICES_PALIER1.md`](docs/TEST_EXERCICES_PALIER1.md).

## Où est quoi

| Dossier | Contenu |
|---|---|
| `src/` | le moteur : analyse, AST d'intention, rendu C, diagnostics. **N'importe jamais `vscode`** |
| `extension/` | l'hôte VS Code : saisie, aperçu, confirmation, insertion |
| `test/` | 3 834 tests Node et la suite hôte VS Code |
| `exercice/` | les exercices de validation, leur C brut, leurs journaux de compilation |
| `test-utilisateur/` | le cahier d'exercices, ses corrigés et ses preuves |
| `docs/` | catalogue, contrats et bilans de lots, campagnes de validation, audits |
| `scripts/` | paquet, différentiel, dictée VS Code, progression |

Documents d'entrée :
[`docs/ETAT_DU_PROJET.md`](docs/ETAT_DU_PROJET.md) (ce qui est construit, ce
qui est prouvé, ce qui reste ouvert),
[`docs/CATALOGUE.md`](docs/CATALOGUE.md) (ce que C-A accepte),
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
