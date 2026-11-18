# Publication 0.6.0 — fusion, étiquette, release

> **Rien n'est fusionné, rien n'est étiqueté, rien n'est publié.** Ce document
> contient les commandes exactes, dans l'ordre, et ce que chacune change.

Date : 18 novembre 2026. Branche `phase-3-java`, **12 commits** en avance sur
`main`. Dépôt : **`Xigalion/a-french-to-code`** — le renommage **a pris
effet**, et l'ancien nom répond 301.

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
| contrôles de pré-publication | **19/19** | `node scripts/pre-publication.mjs --rapide` |
| paquet reproductible **au bit** | depuis **deux** clones propres | §2 |
| mise à niveau depuis la 0.5.0 | une seule extension, identifiant inchangé | §3 |

**La fusion est une avance rapide** : `main` est un ancêtre de la branche, et
`git merge-tree` ne signale aucun conflit.

## 2. Le paquet, et comment le vérifier

```
dist/c-a-0.6.0.vsix
sha256  49e56b55b0f5b9ab7cffccc6a941351f5a99c1a314e3d3c6d9ee8596debc3cab
taille  210 661 octets
entrées 62
```

**Reproductible au bit** : deux clones propres du même commit, `npm ci`,
`npm run build:extension`, `node scripts/paquet.mjs` — et la même empreinte,
identique à celle du poste de développement.

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

## 4. La fusion — commandes exactes

```bash
# 1. l'avance rapide est-elle possible ? Cette commande ne modifie rien, et
#    elle échoue si main a divergé.
git merge-base --is-ancestor main phase-3-java && echo "avance rapide possible"

# 2. passer sur main, et vérifier qu'il n'y a rien en cours
git checkout main
git status --short            # doit être vide

# 3. avance rapide, sans commit de fusion : l'historique reste linéaire
git merge --ff-only phase-3-java

# 4. vérifier que l'arbre est bien celui de la branche
git diff --stat phase-3-java   # doit être vide
```

**Pourquoi `--ff-only`** : il **échoue** si l'avance rapide n'est pas possible,
au lieu de fabriquer un commit de fusion silencieux.

### Retour arrière

Avant toute poussée, le retour est immédiat, et il ne demande **ni étiquette
ni hachage** : `git merge` pose `ORIG_HEAD` sur le sommet d'avant la fusion.

```bash
git reset --hard ORIG_HEAD
git log -1 --oneline
```

**Ne pas utiliser `v0.5.0`** pour revenir : comme `v0.4.0` avant elle, cette
étiquette n'est pas le sommet de `main`. Des commits documentaires l'ont
suivie, et un retour vers elle les perdrait. C'est le piège que la procédure de
la 0.5.0 avait documenté après l'avoir trouvé.

## 5. L'étiquette

```bash
git tag -a v0.6.0 -m "A 0.6.0 — trois langages cibles : C17, Python, Java 21"
git tag --list v0.6.0
git show v0.6.0 --stat | head
```

Posée **après** la fusion, sur `main`, pour qu'elle désigne le même arbre que
la branche.

## 6. La poussée

```bash
git push origin main
git push origin v0.6.0
```

**`--force-with-lease` n'est pas nécessaire** : la fusion est une avance
rapide, et l'historique public n'est pas réécrit.

**Ne pas pousser `--tags`** : cela enverrait aussi les étiquettes de sauvegarde
`avant-*`, qui contiennent des chemins personnels. Deux contrôles de
`scripts/pre-publication.mjs` l'interdisent, et l'étiquette se pousse donc par
son nom.

## 7. La release GitHub

Titre : **A 0.6.0 — trois langages cibles**

Le corps se **produit**, il ne se repère pas à l'œil :

    node scripts/notes-release.mjs 0_6_0     # écrit dist/notes-release-v0.6.0.md

On colle ce fichier **entier**. Le script refuse de produire un corps où
l'en-tête du gabarit aurait survécu — c'est le défaut de la 0.5.0, dont la
release est partie avec son titre en double et la ligne « prêt à coller »
visible par les lecteurs.

Fichier à joindre : **`dist/c-a-0.6.0.vsix`**, et son empreinte sha256 est dans
les notes pour que quiconque puisse vérifier.

Ne cocher **ni** « Set as a pre-release » **ni** « Save draft ». La release
0.5.0 est partie en *pre-release*, et le dépôt n'a donc affiché **aucune**
« Latest release » : `/releases/latest` répondait 404 côté API et redirigeait
vers la liste côté page.

## 8. Les retouches qui restent sur la 0.5.0

Elles n'ont rien à voir avec la 0.6.0, mais elles sont encore vraies :

1. la release **0.5.0** est marquée *pre-release* — à décocher, ou à laisser si
   la 0.6.0 devient la « latest » ;
2. un **brouillon de release en double** subsiste (`untagged-e186af3a…`), à
   supprimer ;
3. le corps de la 0.5.0 contient l'en-tête du gabarit.

## 9. Ce que cette publication ne règle pas

- **aucun essai par un utilisateur**, dans aucun des trois langages. `0/10`
  séances, et c'est le même zéro depuis la phase 1 ;
- **aucun essai hors Windows**, un seul compilateur C, un seul interpréteur
  Python, un seul JDK ;
- les **quatre étiquettes** de classement des tickets ne sont toujours pas
  créées (`docs/SUIVI_PUBLIC.md` §2), ni les sujets du dépôt, et l'onglet
  **Projects** est toujours actif alors qu'il promet un suivi qui n'existe pas.
