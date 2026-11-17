# Étude — renommer le dépôt et l'extension pour le multilangage

**Pour qui :** le fondateur, pour arbitrer. **Rien n'est renommé** : ce
document mesure ce que chaque renommage casse, et recommande.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Les trois noms, et ils n'ont pas le même risque

Il y a **trois** noms distincts, et les confondre est la seule vraie erreur
possible ici :

| Nom | Valeur actuelle | Qui le voit | Ce qu'il casse s'il change |
|---|---|---|---|
| **identifiant de l'extension** | `projet-a-local.c-a` | VS Code, en interne | **tout** : voir §2 |
| **nom affiché** | « C-A — Français contrôlé vers C17 et Python » | l'utilisateur, dans la liste des extensions | **rien** |
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
| `c-a-francais-vers-code` | français → code, sans nommer de langage | redirection, et 6 fichiers à mettre à jour |
| **`projet-a`** | le nom du projet, et il englobe tout | redirection, et 6 fichiers |

**Recommandation : `c-a-francais-vers-code`.** `projet-a` est trop vague pour
être trouvé, et le nom actuel affirme quelque chose de faux. Celui-là dit ce
que l'outil fait sans promettre un langage particulier, et il n'aura pas à
changer quand un troisième langage arrivera.

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

## 5. Ce que je recommande, en trois lignes

1. **ne pas toucher à l'identifiant de l'extension** — `projet-a-local.c-a`
   reste, et le nom affiché porte déjà le multilangage ;
2. **renommer le dépôt** en `c-a-francais-vers-code`, parce que le nom actuel
   affirme quelque chose que la 0.5.0 rend faux ;
3. le faire **après** la validation finale et la publication de la 0.5.0, pas
   avant : un renommage pendant une publication multiplie les points de
   défaillance sans aucun gain.

**Rien n'est fait.** Le renommage du dépôt demande un geste dans l'interface
GitHub, qui appartient au fondateur, et je ne l'ai pas préparé en commandes
pour ne pas donner l'impression qu'il suffit de les lancer.
