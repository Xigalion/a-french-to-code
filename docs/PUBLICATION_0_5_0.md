# Publication 0.5.0 — fusion, étiquette, notes

> **Fait le 18 novembre 2026** : `main` est fusionné en avance rapide,
> l'étiquette `v0.5.0` est posée, et les deux sont poussés. Il reste **deux
> gestes sur l'interface GitHub**, décrits en §9 : créer la release avec le
> `.vsix`, et renommer le dépôt. Aucun outil disponible dans la session qui a
> fait la publication ne sait faire l'un ou l'autre.

Ce document contient les commandes exactes, dans l'ordre, et ce que chacune
change. Il est conservé tel quel, y compris les étapes désormais faites : une
procédure qu'on efface après usage ne sert pas la fois suivante.

Date : 18 novembre 2026. Branche `phase-2-architecture`, **23 commits** en
avance sur `main`.

**Le dépôt est déjà public**, et `main` y est au sommet `v0.4.0` + quatre
commits documentaires, avec les 16 étiquettes citées par les documents et
**aucune** étiquette de sauvegarde `avant-*`. La 0.5.0 est donc une **mise à
jour** d'un dépôt public, pas une première ouverture : c'est ce qui rend
`--force-with-lease` inutile ici, et une poussée forcée inacceptable.

---

## 1. L'état vérifié avant la fusion

| Vérification | Résultat | Commande |
|---|---|---|
| tests Node | **4 376**, 0 échec | `npm test` |
| typecheck moteur et extension | vert | `npm run typecheck` |
| tests hôte VS Code | **114**, 0 échec, VS Code **1.138.0 installée** | `npm run test:vscode` |
| différentiel contre `v0.4.0` | **0 régression, 0 extension, 0 capacité perdue** | `node scripts/differentiel.mjs v0.4.0 --no-loss` |
| liens et chemins cités | 0 problème | `node scripts/liens.mjs` |
| contrôles de pré-publication | 18/18 | `node scripts/pre-publication.mjs --rapide` |
| exercice de clôture Python | 6 programmes, 238 instructions, 0 retouche | `node exercice/python/cloture.mjs` |
| corpus de validation gelé | 95,1 %, 0 erreur de sens | `node scripts/mesurer-reformulations.mjs` |
| paquet reproductible **au bit** | depuis un clone neuf **et depuis le clone public anonyme** | §2 |
| suite hôte contre le **paquet installé** | **114**, 0 échec, deux fois | `CA_EXTENSION_PATH=<dossier> npm run test:vscode` |

**La fusion est une avance rapide** : `main` est un ancêtre de la branche, et
`git merge-tree` ne signale aucun conflit.

À noter, parce que c'est un piège : **l'étiquette `v0.4.0` n'est pas le sommet
de `main`**. Quatre commits documentaires l'ont suivie, et un retour arrière
vers cette étiquette les perdrait. La §3 n'utilise donc **ni étiquette ni
hachage** pour le retour, mais `ORIG_HEAD`, que `git merge` pose lui-même.

## 2. Le paquet, et comment le vérifier

```
dist/c-a-0.5.0.vsix
sha256  1567c46ac7251011388dab82c8b91c7bddb5f801785116960fcd947d4bef909f
taille  163 843 octets
entrées 51
```

Le paquet est **reproductible au bit** : deux constructions du même commit,
depuis deux clones différents, donnent exactement le même fichier. Vérifié en
clonant la branche dans un répertoire vide, `npm ci`, `npm run build:extension`,
`node scripts/paquet.mjs`, puis comparaison des empreintes.

Pour le refaire :

```bash
git clone --branch v0.5.0 <dépôt> verification
cd verification && npm ci && npm run build:extension && node scripts/paquet.mjs
# puis comparer l'empreinte au sha256 ci-dessus
```

## 3. La fusion — commandes exactes

```bash
# 1. l'avance rapide est-elle possible ? Cette commande ne modifie rien, et
#    elle échoue si main a divergé.
git merge-base --is-ancestor main phase-2-architecture && echo "avance rapide possible"

# 2. passer sur main, et vérifier qu'il n'y a rien en cours
git checkout main
git status --short            # doit être vide

# 3. avance rapide, sans commit de fusion : l'historique reste linéaire
git merge --ff-only phase-2-architecture

# 4. vérifier que l'arbre est bien celui de la branche
git diff --stat phase-2-architecture   # doit être vide
```

**Pourquoi `--ff-only`** : il **échoue** si l'avance rapide n'est pas
possible, au lieu de fabriquer un commit de fusion silencieux. Si la commande
échoue, c'est que `main` a bougé entre-temps, et il faut relire avant de
décider.

### Retour arrière

Avant toute poussée, le retour est immédiat, et il ne demande **ni étiquette
ni hachage** : `git merge` pose `ORIG_HEAD` sur le sommet d'avant la fusion.

```bash
git reset --hard ORIG_HEAD
git log -1 --oneline          # doit afficher le dernier commit documentaire de main
```

**Ne pas utiliser `v0.4.0`** pour revenir. Cette étiquette est **quatre
commits avant** le sommet de `main` — la vérification du dépôt public, le
suivi des tickets, le renvoi de `CONTRIBUTING` et l'alignement du compte de
contrôles l'ont suivie —, et un retour vers elle les perdrait.

Après une poussée, il faudrait une poussée forcée, qui réécrit un historique
public : **ne pas pousser avant d'être sûr**.

## 4. L'étiquette

```bash
git tag -a v0.5.0 -m "A 0.5.0 — deux langages cibles, C17 et Python"
git tag --list v0.5.0            # vérifier qu'elle existe
git show v0.5.0 --stat | head    # vérifier qu'elle pointe le bon commit
```

L'étiquette doit être posée **après** la fusion, sur `main`, pour qu'elle
désigne le même arbre que la branche.

## 5. La poussée

```bash
git push origin main
git push origin v0.5.0
```

**`--force-with-lease` n'est pas nécessaire** : la fusion est une avance
rapide, et l'historique public n'est pas réécrit. C'est la différence avec la
publication de la 0.4.0, qui avait réécrit l'historique.

**Ne pas pousser `--tags`** : cela enverrait aussi les étiquettes de
sauvegarde `avant-*`, qui contiennent des chemins personnels. Deux contrôles
de `scripts/pre-publication.mjs` l'interdisent déjà, et l'étiquette se pousse
donc par son nom.

## 6. La release GitHub

Titre : **A 0.5.0 — deux langages cibles**

Le corps est dans `docs/NOTES_PUBLICATION_0_5_0.md`, prêt à coller.

Fichier à joindre : **`dist/c-a-0.5.0.vsix`**, et son empreinte sha256 est
dans les notes pour que quiconque puisse vérifier.

## 7. Après la publication, et pas avant

Le renommage du dépôt en **`a-french-to-code`** : la procédure est en
`docs/phase2/ETUDE_RENOMMAGE.md` §4. Dans l'ordre — renommer sur GitHub,
mettre à jour les six fichiers qui citent le nom, puis
`git remote set-url origin`. L'inverse laisse une fenêtre où les documents
citent un dépôt qui n'existe pas.

**L'identifiant de l'extension, lui, ne change pas** : `projet-a-local.c-a`.
Un test l'exige.

## 8. Ce que cette publication ne règle pas

- **les plateformes autres que Windows**, jamais essayées, et `Cmd+K A`
  jamais pressé. Les 114 scénarios passent désormais sur la version
  **installée, 1.138.0** — les deux processus `CodeSetup` orphelins qui
  détenaient le mutex ont disparu, et **aucun processus n'a été arrêté par
  C-A** —, mais sur une seule machine et un seul système ;
- **aucun essai par un utilisateur**, ni en C ni en Python ;
- **aucun essai hors Windows**, et un seul interpréteur Python.

## 9. Ce qui reste, et pourquoi je ne l'ai pas fait

Deux gestes, tous les deux sur **github.com**. Ni le serveur GitHub branché
sur cette session ni `git` ne savent les faire : le premier n'expose que des
lectures sur les releases, et aucun outil ne renomme un dépôt. Lire le jeton
du gestionnaire d'identifiants pour appeler l'API directement **a été refusé**,
et c'est la bonne réponse — un jeton de poussée n'a pas à traverser un agent.

### 9.1 La release v0.5.0

1. ouvrir **https://github.com/Xigalion/c-a-french-to-c/releases/new?tag=v0.5.0**
   — l'étiquette existe déjà, GitHub la propose telle quelle, **sans créer de
   commit** ;
2. titre : **`A 0.5.0 — deux langages cibles`** ;
3. corps : coller `docs/NOTES_PUBLICATION_0_5_0.md` **à partir du trait
   horizontal**, sans son premier titre ni la ligne en italique ;
4. joindre **`dist/c-a-0.5.0.vsix`** — l'empreinte annoncée dans les notes est
   `1567c46a…`, et elle est reproductible depuis le dépôt public ;
5. ne pas cocher « pre-release », ni « set as a draft ».

*Aucune release n'existe sur ce dépôt, pas même pour la 0.4.0.* Si vous
publiez aussi la 0.4.0, son paquet est `dist/c-a-0.4.0.vsix` et ses notes
`dist/notes-de-release-v0.4.0.md`.

### 9.2 Le renommage en `a-french-to-code`

**Dans cet ordre**, parce que l'inverse laisse une fenêtre où les documents
citent un dépôt qui n'existe pas :

1. **Settings → General → Repository name** → `a-french-to-code` → *Rename*.
   GitHub installe une **redirection permanente** depuis l'ancien nom : les
   liens déjà partagés et les `git clone` existants continuent de fonctionner ;
2. mettre à jour les fichiers qui citent le nom — la liste exacte est en
   `docs/phase2/ETUDE_RENOMMAGE.md` §4 —, committer, pousser ;
3. puis, en local :

        git remote set-url origin https://github.com/Xigalion/a-french-to-code.git
        git ls-remote origin HEAD        # doit répondre sans redirection

**L'identifiant de l'extension ne bouge pas** : `projet-a-local.c-a`. Un test
l'exige, et c'est ce qui fait qu'une installation 0.4.0 se met à jour en place
au lieu de cohabiter avec une seconde extension.

### 9.3 Trois réglages mineurs, tant qu'on y est

- la **description** du dépôt ne parle que de C17 : elle est antérieure à
  Python-A. Proposition : *« A traduit une phrase en français contrôlé en une
  instruction d'un vrai langage : C17 avec C-A, Python avec Python-A. Outil
  pédagogique, aperçu avant insertion, aucun ajout implicite. »* ;
- les **quatre étiquettes** de classement des tickets (`docs/SUIVI_PUBLIC.md`
  §2) : sans elles, les formulaires de tickets arrivent nus ;
- l'onglet **Projects**, à désactiver : il promet un suivi qui n'existe pas.
