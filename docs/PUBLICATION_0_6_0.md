# Publication 0.6.0 — ce qui est fait, ce qui reste

> **Publiée le 18 novembre 2026**, en ***pre-release***, et vérifiée
> anonymement : §10. La release a été créée **à la main** par le fondateur,
> aucun outil de la session ne sachant la créer.

Dépôt : **`Xigalion/a-french-to-code`**. L'ancien nom répond **301**.

**Ce document distingue partout ce qui a été réellement exécuté de ce qui est
seulement préparé.** C'est la leçon de la 0.5.0, dont le suivi avait un temps
annoncé comme faites des opérations qui attendaient encore.

| Opération | État |
|---|---|
| fusion de `phase-3-java` dans `main`, en avance rapide | **FAIT** |
| étiquette annotée `v0.6.0` | **FAIT** |
| poussée de `main` | **FAIT** |
| poussée de `v0.6.0`, **par son nom** | **FAIT** |
| vérifications anonymes du dépôt, de l'étiquette et du paquet | **FAIT** — §8 |
| **release GitHub 0.6.0, en *pre-release*, avec le `.vsix`** | **FAITE à la main** par le fondateur — §7 |
| vérification après publication : release, téléchargement, intégrité | **FAITE** — §10 |
| éléments secondaires du dépôt (étiquettes de tickets, Projects, brouillon de la 0.5.0) | **écartés** sur consigne — §9 |

---

## 1. L'état vérifié avant la fusion

| Vérification | Résultat | Commande |
|---|---|---|
| tests Node | **4 438**, 0 échec | `npm test` |
| typecheck moteur et extension | vert | `npm run typecheck` |
| tests hôte, **sources**, VS Code 1.138.0 | **121**, 0 échec | `npm run test:vscode` |
| tests hôte, **paquet**, VS Code 1.138.0 | **121**, 0 échec | `CA_EXTENSION_PATH=<dossier installé> npm run test:vscode` |
| tests hôte, **paquet**, VS Code **1.96.4** (version minimale) | **121**, 0 échec | idem, avec `VSCODE_EXECUTABLE` |
| différentiel contre `v0.5.0` | **0 régression, 0 capacité perdue** sur 1 335 559 comparaisons | `node scripts/differentiel.mjs v0.5.0 --no-loss` |
| exercice de clôture Java | 4 fichiers, 96 phrases, 0 retouche, `javac` et `java` en code 0 | `node exercice/java/cloture.mjs` |
| français souple en Java | **36/36**, 0 acceptée à tort, 0 erreur de sens | `node scripts/mesurer-java.mjs` |
| français souple, corpus **gelé** C17 | 95,1 %, inchangé | `node scripts/mesurer-reformulations.mjs` |
| liens et chemins cités | 0 problème | `node scripts/liens.mjs` |
| contrôles de pré-publication | **19/19**, relancés **sur `main`** après la fusion | `node scripts/pre-publication.mjs --rapide` |
| paquet reproductible **au bit** | depuis **trois** constructions | §2 |
| mise à niveau depuis la 0.5.0 | une seule extension, identifiant inchangé | §3 |

La fusion était une **avance rapide** : `main` était un ancêtre de la branche.

## 2. Le paquet, et sa correspondance avec le commit étiqueté

```
dist/c-a-0.6.0.vsix
sha256  49e56b55b0f5b9ab7cffccc6a941351f5a99c1a314e3d3c6d9ee8596debc3cab
taille  210 661 octets
entrées 62
```

**Reproductible au bit, et vérifié contre l'étiquette publique** : un clone
**anonyme** de `v0.6.0`, `npm ci`, construction, `node scripts/paquet.mjs` — et
le fichier est **identique octet pour octet** à celui du poste de
développement. Ce n'est donc pas « le paquet d'un commit qui ressemble à
l'étiquette » : c'est le paquet **de** l'étiquette.

```bash
git clone --branch v0.6.0 https://github.com/Xigalion/a-french-to-code.git verification
cd verification && npm ci && npm run build:extension && node scripts/paquet.mjs
# puis comparer l'empreinte au sha256 ci-dessus
```

## 3. La mise à niveau depuis la 0.5.0 — vérifiée

L'identifiant technique ne change pas : **`projet-a-local.c-a`**. Un test
l'exige, et la vérification a été faite dans un dossier d'extensions isolé :

```
1. code --extensions-dir <isolé> --install-extension dist/c-a-0.5.0.vsix
   → projet-a-local.c-a@0.5.0
2. code --extensions-dir <isolé> --install-extension dist/c-a-0.6.0.vsix
   → projet-a-local.c-a@0.6.0        ← UNE seule extension listée
```

Et dans le dossier isolé, après la mise à niveau :

- `extensions.json` ne contient qu'**une** entrée, en **0.6.0** ;
- `.obsolete` marque le dossier de la 0.5.0 ;
- **aucune seconde extension ne cohabite**, et aucune commande n'est déclarée
  deux fois.

## 4. La fusion — ce qui a été exécuté

```bash
git merge-base --is-ancestor main phase-3-java   # avance rapide possible
git checkout main
git merge --ff-only phase-3-java                 # avance rapide, sans commit de fusion
git diff --stat phase-3-java                     # vide
```

**`--ff-only`** a été employé parce qu'il **échoue** si l'avance rapide n'est
pas possible, au lieu de fabriquer un commit de fusion silencieux.
L'historique reste linéaire : **aucun commit de fusion**.

### Retour arrière

Avant la poussée, `ORIG_HEAD` suffisait. **Après la poussée, il ne suffit
plus** : revenir demanderait une poussée forcée sur une branche publique, ce
que ce dépôt s'interdit. Le retour en arrière se fait désormais par un
**nouveau commit** qui annule, pas par une réécriture.

**Ne jamais utiliser `v0.5.0`** pour revenir : comme `v0.4.0` avant elle, cette
étiquette n'est pas le sommet de `main` — des commits documentaires l'ont
suivie, et un retour vers elle les perdrait.

## 5. L'étiquette — posée

```bash
git tag -a v0.6.0 -m "A 0.6.0 — trois langages cibles : C17, Python, Java 21"
```

Posée **après** la fusion, sur `main`, donc elle désigne le même arbre que la
branche. Vérifié : `v0.6.0^{}` et `main` sont le même commit, localement
**et** au distant.

## 6. La poussée — faite

```bash
git push origin main      # avance rapide acceptee par le distant
git push origin v0.6.0    # [new tag]
```

**`--force-with-lease` n'était pas nécessaire** : avance rapide, aucun
historique public réécrit.

**`--tags` n'a pas été employé**, et ne doit pas l'être : cela enverrait aussi
les étiquettes de sauvegarde `avant-*`, qui contiennent des chemins personnels.
Deux contrôles de `scripts/pre-publication.mjs` l'interdisent.

## 7. La release GitHub — le seul geste manuel

Aucun outil de cette session ne crée une release : le serveur GitHub
disponible ne sait que **lire** les releases, et `gh` n'est pas installé.

**Lien** — l'étiquette existe déjà au distant, le formulaire la trouvera :

    https://github.com/Xigalion/a-french-to-code/releases/new?tag=v0.6.0

**Étiquette à choisir :** `v0.6.0` (*Choose a tag* → elle est dans la liste,
il n'y a rien à créer).

**Titre :**

    A 0.6.0 — trois langages cibles

**Fichier à joindre :**

    dist/c-a-0.6.0.vsix
    sha256 49e56b55b0f5b9ab7cffccc6a941351f5a99c1a314e3d3c6d9ee8596debc3cab

**Texte à coller** — il se **produit**, il ne se repère pas à l'œil :

    node scripts/notes-release.mjs 0_6_0     # écrit dist/notes-release-v0.6.0.md

On colle ce fichier **entier**. Le script refuse de produire un corps où
l'en-tête du gabarit aurait survécu — c'est le défaut de la 0.5.0, dont la
release est partie avec son titre en double et la ligne « prêt à coller »
visible par les lecteurs.

**Cocher « Set as a pre-release ».** C'est une **décision du fondateur** du
18 novembre 2026 : la 0.6.0 reste en avant-première **tant que la validation
humaine n'a pas eu lieu**. Et c'est cohérent — `0/10` séances, aucun
utilisateur n'a encore écrit un programme avec A. Conséquence à assumer : le
dépôt continuera de n'afficher **aucune** « Latest release », puisque la 0.5.0
est elle aussi en *pre-release*. Ce n'est pas un défaut mais le reflet exact de
l'état du projet.

**Ne pas cocher « Save draft ».** Un brouillon n'est visible que du
propriétaire, et la vérification anonyme échouerait.

## 8. Les vérifications anonymes — faites

Toutes sans jeton, avec un client générique.

| Vérification | Résultat |
|---|---|
| `github.com/Xigalion/a-french-to-code` | **200** |
| ancien nom `c-a-french-to-c` | **301** vers le nouveau |
| `tree/v0.6.0` | **200** |
| API, référence de l'étiquette `v0.6.0` | **200**, objet annoté déréférencé vers un commit |
| `main` au distant | **le même commit que l'étiquette**, et le même qu'en local |
| `README.md` à l'étiquette | **200**, et il nomme **C17, Python et Java 21** |
| `docs/CATALOGUE_JAVA.md` à l'étiquette | **200** |
| `CHANGELOG.md` sur `main` | **200** |
| paquet reconstruit depuis le clone anonyme de `v0.6.0` | **sha256 identique**, 210 661 octets, `cmp` au vert |

Ce qui **ne peut pas** être vérifié avant la création manuelle : l'accessibilité
anonyme de la **release** et le **téléchargement** du `.vsix` depuis son URL de
release. Les deux commandes à passer après le geste du §7 :

```bash
curl -sS -o /dev/null -w '%{http_code}\n' \
  https://api.github.com/repos/Xigalion/a-french-to-code/releases/tags/v0.6.0
curl -sSL -o verif.vsix \
  https://github.com/Xigalion/a-french-to-code/releases/download/v0.6.0/c-a-0.6.0.vsix
sha256sum verif.vsix   # doit donner 49e56b55…
```

## 9. Ce que cette publication ne règle pas

- **aucun essai par un utilisateur**, dans aucun des trois langages. `0/10`
  séances, et c'est le même zéro depuis la phase 1. C'est précisément pourquoi
  la release reste en *pre-release* ;
- **aucun essai hors Windows**, un seul compilateur C, un seul interpréteur
  Python, un seul JDK ;
- les **éléments secondaires** du dépôt — les quatre étiquettes de classement
  des tickets (`docs/SUIVI_PUBLIC.md` §2), les sujets, l'onglet **Projects**, le
  brouillon de release en double de la 0.5.0 et l'en-tête de gabarit dans son
  corps — sont **écartés sur consigne du fondateur** du 18 novembre 2026. Ils
  restent vrais et restent écrits ici : écartés n'est pas réglé.

## 10. Vérification après publication — 18 novembre 2026

La release **est publiée**, en *pre-release*, et vérifiée **anonymement**,
sans jeton, avec un client générique.

| Vérification | Résultat |
|---|---|
| `api.github.com/.../releases/tags/v0.6.0` | **200** |
| page `releases/tag/v0.6.0` | **200** |
| statut | **`prerelease: true`**, `draft: false` — conforme à la consigne |
| titre | *A 0.6.0 — trois langages cibles* |
| corps | 175 lignes, **sans** l'en-tête de gabarit qui avait abîmé la 0.5.0 |
| corps, trois langages | C17 **7**, Python **13**, Java 21 **4** occurrences |
| corps, empreinte et identifiant | les deux présents, vérifiables par le lecteur |
| fichier joint | `c-a-0.6.0.vsix`, **210 661 octets** |
| **téléchargement anonyme** | **sha256 `49e56b55…`** |

**La chaîne de confiance est complète et close :**

```
commit étiqueté v0.6.0
  → clone ANONYME de l'étiquette, reconstruit
    → paquet du poste de développement
      → paquet TÉLÉCHARGÉ depuis la release
```

Les quatre fichiers sont **identiques octet pour octet** (`cmp` au vert entre
chacun). Le paquet publié contient ses 62 entrées, les 4 requises comprises,
et aucun séparateur `\`.

**Et il s'installe** : `projet-a-local.c-a@0.6.0`, dans un dossier
d'extensions isolé, depuis le fichier **téléchargé** — pas depuis le local.

### Un défaut trouvé par cette vérification, et il est dans le harnais

En lançant la suite hôte **contre le paquet téléchargé**, le résultat a été
instable : **1 échec**, puis **26**, puis **0** sur 121, avec le **même**
binaire. Les échecs n'étaient pas des refus du moteur mais des assertions sur
le **contenu du document** — du résidu.

Cause : le lanceur **réutilisait** le dossier de travail et le profil d'un
passage à l'autre. Un passage laissait **≈130 fichiers** derrière lui, et
`files.hotExit` n'était pas désarmé — un éditeur non enregistré pouvait donc
porter le texte d'un passage dans le suivant.

**La causalité n'est pas prouvée, et la correction ne prétend pas l'être** :
c'est de l'hygiène, pas une théorie. Chaque passage repart de rien, et
`files.hotExit` est à `off`. Mesuré après correction : **trois passages
consécutifs à 121/121** contre le paquet publié, et **121/121** depuis les
sources.

Ce que cela change pour la lecture des chiffres antérieurs : les quatre
combinaisons annoncées à 121/121 restent exactes — chacune a bien été
observée — mais elles ont été obtenues sur un harnais qui pouvait échouer au
passage suivant. **Un chiffre juste obtenu sur un harnais instable n'est pas
une garantie de reproductibilité**, et c'est désormais dit.
