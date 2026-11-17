# Procédure de publication, et retour arrière

**Pour qui :** la personne qui va publier le dépôt. Les commandes sont
écrites pour être copiées ; **aucune n'a été exécutée**.

> **Rien n'est publié à ce jour.** Aucun envoi, aucun changement de
> visibilité, aucune création de dépôt n'a été effectué, et aucun ne le sera
> sans confirmation explicite de la destination.
>
> État au 17 novembre 2026. Version à publier : **0.4.0**.

---

## 1. Avant tout : le contrôle d'avant publication

    node scripts/pre-publication.mjs

Quatorze contrôles, dont : aucune donnée personnelle dans les fichiers **ni
dans l'historique de `main`**, aucun octet nul, aucun binaire suivi, aucune
citation d'identifiant de commit, chaque étiquette citée existe, licence
Apache-2.0 complète et annoncée partout, versions accordées, liens internes
valides, et `npm run check` au vert.

**S'il échoue, on ne publie pas.** Il imprime ce qui manque, et il dit aussi
ce qu'il ne prouve pas.

## 2. Ce qui doit être décidé avant la première commande

| Décision | État |
|---|---|
| licence | **Apache-2.0**, prise le 16 novembre 2026 |
| auteur des commits | **réécrit** vers l'adresse de redirection GitHub |
| **nom public du dépôt** | proposé : **`c-a-french-to-c`** — *à confirmer* |
| **destination** | `github.com/<compte>/c-a-french-to-c` — *à confirmer* |
| visibilité | le dépôt distant actuel est **privé** ; le rendre public est un geste séparé |

Le nom proposé est déjà écrit dans deux liens d'aide des modèles de tickets
(`.github/ISSUE_TEMPLATE/config.yml`). S'il change, une seule commande
suffit :

    node -e "const f='.github/ISSUE_TEMPLATE/config.yml',s=require('fs');s.writeFileSync(f,s.readFileSync(f,'utf8').replace(/c-a-french-to-c/g,'NOUVEAU-NOM'))"

Puis relancer `node scripts/pre-publication.mjs --rapide`.

## 3. Renommer le dépôt distant

Le dépôt distant s'appelle aujourd'hui `A`. Renommer **avant** de pousser
évite de changer l'URL deux fois.

- Interface GitHub : **Settings → Repository name** → `c-a-french-to-c` →
  *Rename*. GitHub conserve une redirection depuis l'ancien nom.
- Puis, en local :

      git remote set-url origin https://github.com/<compte>/c-a-french-to-c.git
      git remote -v

Un second remote nommé `public` a été préparé localement vers le nom
proposé, pour que la destination soit visible sans toucher à `origin` :

    git remote get-url public

**Il n'a jamais servi à pousser.** Si le nom retenu diffère :

    git remote set-url public https://github.com/<compte>/<nom-retenu>.git

## 4. Publier

Les trois commandes, dans cet ordre.

### 4.1 Envoyer l'historique

    git push --force-with-lease origin main

**Pourquoi forcé.** L'historique a été réécrit une fois avant publication,
pour en retirer des chemins locaux et une adresse personnelle. Le dépôt
distant contient encore l'ancien « Initial commit », qui n'est plus un
ancêtre de `main`.

`--force-with-lease` et non `--force` : il refuse si quelqu'un a poussé
entre-temps.

### 4.2 Envoyer les étiquettes

    git push origin --tags

Dix-sept étiquettes, dont **`v0.4.0`** qui marque la version publiée. Les
documents citent ces étiquettes et non des identifiants : sans elles, les
bilans de lots perdent leurs références (`docs/REPERES_GIT.md`).

### 4.3 Rendre public

Interface GitHub : **Settings → General → Danger Zone → Change visibility →
Make public**, puis confirmer.

**C'est le geste irréversible de la série.** Tout ce qui est public peut être
copié, forké, mis en cache et indexé dans les minutes qui suivent.

### 4.4 Finitions, après vérification du contenu distant

    # une fois le contenu distant VÉRIFIÉ, et pas avant :
    git tag -d avant-reecriture-auteur
    git update-ref -d refs/original/refs/heads/main
    git reflog expire --expire=now --all && git gc --prune=now

Ces trois lignes effacent la **seule copie locale** de l'ancien historique.
Elles ne sont pas urgentes : rien de local n'est publié.

### 4.5 Ce qui n'est pas automatique, et reste à faire à la main

- **la description et les sujets** du dépôt GitHub : une phrase et quelques
  mots-clés, sinon le dépôt est introuvable. Suggestion : *« Traduire du
  français contrôlé en C17 dans VS Code — prototype pédagogique »*, sujets
  `c`, `vscode-extension`, `pedagogy`, `french`, `typescript` ;
- **la release** : créer une publication GitHub sur `v0.4.0`, en collant la
  section 0.4.0 de `CHANGELOG.md` et en joignant le `.vsix` produit par
  `node scripts/paquet.mjs` ;
- **désactiver** ce qui n'est pas tenu : Wiki, Projects, Discussions, si
  personne ne les suivra ;
- **ne pas** publier l'extension sur la place de marché VS Code : c'est un
  prototype de test supervisé, et `README.md` le dit.

## 5. Vérifier après publication

    git ls-remote --heads --tags origin | head -20
    git log --oneline origin/main -3

Puis, dans un navigateur, sur le dépôt public :

- le `README` s'affiche, et ses liens relatifs fonctionnent ;
- les trois modèles de tickets apparaissent à l'ouverture d'un ticket, et les
  tickets vides sont désactivés ;
- la licence détectée par GitHub est bien **Apache-2.0** ;
- aucun fichier inattendu à la racine.

## 6. Retour arrière

### 6.1 Redevenir privé

**Settings → General → Danger Zone → Change visibility → Make private.**

Immédiat côté GitHub, et **inefficace sur ce qui a déjà été copié** : forks,
caches de moteurs de recherche, archives tierces. Un retour arrière n'est pas
une annulation.

### 6.2 Annuler l'envoi, sans dépublier

Pour revenir au contenu distant d'avant publication, tant qu'il existe
encore localement :

    git push --force-with-lease origin avant-reecriture-auteur:main

Et pour retirer les étiquettes poussées :

    git push origin --delete v0.4.0 lot-11a lot-11d lot-16 lot-17 lot-19 \
      lot-23 lot-26 lot-27 lot-28 lots-30-31 campagne-2 campagne-3 \
      evaluation-modele-1 kit-test-utilisateur ref-avant-lot-13

### 6.3 Supprimer le dépôt distant

**Settings → General → Danger Zone → Delete this repository.** Irréversible,
et cela casse toute URL déjà partagée. Le dépôt local reste intact : il
contient l'intégralité du travail.

### 6.4 Retirer un fichier publié par erreur

Si un fichier n'aurait pas dû partir, le retirer du dernier commit **ne
suffit pas** : il reste dans l'historique public.

1. le retirer de l'historique localement (`git filter-branch` ou
   `git filter-repo`) ;
2. `git push --force-with-lease origin main` ;
3. demander à GitHub de purger les caches et les vues de forks — c'est une
   **demande au support**, pas une commande ;
4. considérer le contenu comme compromis s'il s'agit d'un secret : le
   révoquer, pas seulement le retirer.

C'est précisément pour éviter ce scénario que l'audit a été fait **avant**.

## 7. Ce que je n'exécuterai pas sans confirmation explicite

- `git push`, sous toutes ses formes, et en particulier `--force-with-lease` ;
- la création, le renommage ou la suppression d'un dépôt distant ;
- tout changement de visibilité ;
- la publication d'une release ou d'un paquet.

Ce qui est fait, et seulement cela : le dépôt local est **prêt**, vérifié par
`scripts/pre-publication.mjs`, et la destination attend d'être confirmée.
