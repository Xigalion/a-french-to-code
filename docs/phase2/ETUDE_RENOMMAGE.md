# Renommage — l'étude, et la décision prise

**Pour qui :** le fondateur et quiconque reprend le dépôt. L'étude est
conservée telle quelle en §1 à §4 ; la **décision** est en §0, et ce qui en
découle est fait ou préparé.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 0. La décision du fondateur, du 17 novembre 2026

> « Je souhaite conserver **A** comme nom du projet global, avec **C-A** et
> **Python-A** comme déclinaisons. Le nouveau nom envisagé pour le dépôt est
> `a-french-to-code`, et le nom affiché de l'extension « A — Français vers
> Code ». Conserve impérativement l'identifiant technique actuel. »

| Nom | Valeur | État |
|---|---|---|
| projet global | **A** | inchangé — c'était déjà le nom du projet |
| déclinaison C17 | **C-A** | inchangée |
| déclinaison Python | **Python-A** | **nouveau nom**, pour la part Python |
| nom **affiché** de l'extension | « **A — Français vers Code** » | **fait** |
| **identifiant technique** | `projet-a-local.c-a` | **inchangé**, et il doit le rester |
| nom du dépôt | `a-french-to-code` | **préparé, non appliqué** — §4 |

**L'identifiant technique reste `projet-a-local.c-a`.** C'est la clé primaire
d'une extension installée, et la §2 explique en détail ce que la changer
casserait. Le nom affiché, lui, porte désormais le projet entier — c'est ce
que l'utilisateur lit, et c'est là que le multilangage devait apparaître.

Que l'identifiant contienne encore `c-a` n'est pas une incohérence : **C-A est
une déclinaison de A**, et la première. Un identifiant n'est pas un nom
d'usage ; il n'est lu que par VS Code.

### Ce qui reste à faire, et qui n'appartient pas à l'outil

Le renommage du dépôt demande un geste dans l'interface GitHub. La procédure
exacte est en §4, les six fichiers à mettre à jour y sont listés, et
l'ordre — renommer d'abord, mettre à jour ensuite — y est justifié. **Rien
n'est appliqué**, parce qu'un renommage pendant une publication multiplie les
points de défaillance sans aucun gain.

---

## 1. Les trois noms, et ils n'ont pas le même risque

Il y a **trois** noms distincts, et les confondre est la seule vraie erreur
possible ici :

| Nom | Valeur actuelle | Qui le voit | Ce qu'il casse s'il change |
|---|---|---|---|
| **identifiant de l'extension** | `projet-a-local.c-a` | VS Code, en interne | **tout** : voir §2 |
| **nom affiché** | « A — Français vers Code » | l'utilisateur, dans la liste des extensions | **rien** |
| **nom du dépôt** | `c-a-french-to-c` | GitHub, les liens | les liens, temporairement : voir §4 |

Le nom affiché et la description sont **déjà** multilangages dans la version
0.5.0 : c'était la partie gratuite, et elle est faite.

## 2. L'identifiant de l'extension : ne pas y toucher

L'identifiant est `publisher.name`, soit `projet-a-local` + `c-a`. VS Code
s'en sert comme **clé primaire** d'une extension installée.

**Ce qui se passerait si `name` devenait `c-a-multi` :**

1. l'extension installée, `projet-a-local.c-a`, **reste installée** — VS Code
   n'a aucun moyen de savoir qu'elle a été renommée ;
2. la nouvelle, `projet-a-local.c-a-multi`, s'installe **à côté** ;
3. les deux déclarent la commande `c-a.translate` et le raccourci
   `Ctrl+K A`. VS Code accepte deux extensions qui déclarent la même
   commande, et **laquelle répond n'est pas défini** ;
4. les deux déclarent les réglages `c-a.python` et `c-a.souplesse`, qui
   deviennent ambigus ;
5. l'utilisateur doit **désinstaller l'ancienne à la main**, et rien ne le lui
   dit.

C'est exactement ce que la consigne « sans compromettre les installations
existantes » interdit.

**Recommandation : garder `name: "c-a"`, définitivement.** Ce n'est pas une
dette : `c-a` est le nom du projet — « C-A » est la première incarnation de
« A » —, et il ne désigne pas le C. Le lire comme « C → A » serait un
contresens : c'est « A » qui traduit, et « C-A » en est la version qui cible
C17. Que Python s'y ajoute ne change pas le nom du projet.

### Si le fondateur veut malgré tout changer l'identifiant

Il y a une seule façon propre, et elle coûte une version :

1. publier une version **0.5.x de `projet-a-local.c-a`** qui ne fait qu'une
   chose : afficher un message au premier démarrage, disant d'installer le
   nouveau nom et de désinstaller celui-ci ;
2. publier le nouvel identifiant comme une extension neuve ;
3. laisser l'ancienne en place, sans la supprimer, pour que les installations
   existantes ne cassent pas.

Aucune de ces trois étapes n'est automatisable, et aucune n'est réversible.
**Je ne la recommande pas** : le gain est cosmétique, le coût est réel.

## 3. Le nom affiché : fait, et c'est suffisant

| Champ | Avant | Après (0.5.0) |
|---|---|---|
| `displayName` | « C-A — Français contrôlé vers C17 » | « C-A — Français contrôlé vers **C17 et Python** » |
| `description` | « …d'instructions C17 du catalogue C-A » | « …vers **C17 et Python** » |

C'est ce que l'utilisateur lit dans la liste des extensions et sur une page de
place de marché. **Le caractère multilangage est donc déjà reflété là où il
est vu**, et sans casser une installation.

## 4. Le nom du dépôt : faisable, et réversible

GitHub conserve une **redirection** de l'ancien nom vers le nouveau :

- `git fetch` et `git push` continuent de fonctionner depuis un clone existant,
  sans toucher au `remote` ;
- les liens `https://github.com/Xigalion/<ancien-nom>` redirigent ;
- les tickets, les étiquettes et la release suivent.

**La seule faille, et elle est réelle :** la redirection cesse si
**quelqu'un crée un dépôt portant l'ancien nom**. Ce n'est pas théorique pour
un nom aussi spécifique que `c-a-french-to-c`, mais le risque est faible.

### Trois noms possibles, et ce que chacun dit

| Nom | Ce qu'il dit | Ce qu'il coûte |
|---|---|---|
| `c-a-french-to-c` (actuel) | français → C. **Faux depuis la 0.5.0** | rien, mais le nom ment |
| **`a-french-to-code`** | le projet **A**, français → code | redirection, et 6 fichiers à mettre à jour |

**Décidé : `a-french-to-code`.** Il nomme le projet global plutôt qu'une
déclinaison, il ne promet aucun langage particulier, et il n'aura donc pas à
changer quand un troisième arrivera. Il garde aussi la forme anglaise du nom
actuel, ce qui rend la continuité lisible pour quelqu'un qui suivait le
dépôt.

### Ce qu'un renommage de dépôt demande, exactement

Six fichiers citent le nom, et la commande de remplacement existe déjà dans
`docs/PUBLICATION.md` :

| Fichier | Ce qu'il cite |
|---|---|
| `.github/ISSUE_TEMPLATE/config.yml` | l'URL des discussions |
| `docs/PUBLICATION.md` | la procédure, l'URL publique |
| `docs/AUDIT_PUBLICATION.md` | le nom proposé |
| `README.md`, `CONTRIBUTING.md` | les liens de signalement |
| le `remote` local | `git remote set-url origin …` |

Et deux contrôles de `scripts/pre-publication.mjs` le vérifient déjà : aucun
`OWNER/REPO` laissé en gabarit, et tous les liens internes résolus.

**Ordre à respecter :** renommer sur GitHub **d'abord**, puis mettre à jour les
six fichiers, puis `git remote set-url`. L'inverse laisse une fenêtre où les
documents citent un dépôt qui n'existe pas encore.

## 5. Où en est chaque nom

| Nom | État au 17 novembre 2026 |
|---|---|
| identifiant `projet-a-local.c-a` | **inchangé**, et un test l'exige désormais |
| nom affiché « A — Français vers Code » | **fait**, version 0.5.0 |
| description de l'extension | **faite** : « Deux déclinaisons : C-A vers C17, Python-A vers Python » |
| nom du dépôt `a-french-to-code` | **préparé, non appliqué** — un geste dans l'interface GitHub |

Le renommage du dépôt reste à faire **après** la publication de la 0.5.0, et
dans l'ordre de la §4 : renommer sur GitHub, puis mettre à jour les six
fichiers, puis `git remote set-url`. L'inverse laisse une fenêtre où les
documents citent un dépôt qui n'existe pas encore.
