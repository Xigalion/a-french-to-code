# Procédure de publication, et retour arrière

**Pour qui :** la personne qui va publier le dépôt. Les commandes sont
écrites pour être copiées ; **aucune n'a été exécutée**.

> **État au 17 novembre 2026, après confirmation du fondateur.**
>
> | Étape | État |
> |---|---|
> | envoi de l'historique réécrit (`--force-with-lease`) | **fait** — `main` à jour sur le distant |
> | envoi des **seize** étiquettes publiques | **fait** — aucune sauvegarde `avant-*` poussée |
> | vérification du contenu distant, dépôt encore **privé** | **faite** — §5 |
> | renommage du dépôt en `c-a-french-to-c` | **fait** |
> | passage en **public** | **fait** |
> | vérification anonyme du dépôt public | **faite** — §5 |
> | release `v0.4.0` avec le `.vsix` | **à terminer** — aucune release visible anonymement (§4.3) |
>
> **Le dépôt est public : https://github.com/Xigalion/c-a-french-to-c**
> Version publiée : **0.4.0**. Suivi des tickets : `docs/SUIVI_PUBLIC.md`.

---

## 1. Avant tout : le contrôle d'avant publication

    node scripts/pre-publication.mjs

Dix-neuf contrôles, dont : aucune donnée personnelle dans les fichiers **ni
dans l'historique de `main`**, aucun octet nul, aucun binaire suivi, aucune
citation d'identifiant de commit, chaque étiquette citée existe, licence
Apache-2.0 complète et annoncée partout, versions accordées, liens internes
valides, les étiquettes de sauvegarde identifiées,
les instructions de travail internes **hors du dépôt**, et `npm run check`
au vert.

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

**Pourquoi forcé.** L'historique a été réécrit trois fois avant publication :
l'auteur des commits, puis les chemins locaux et les anciennes références,
puis le retrait des instructions de travail internes. Le dépôt distant
contient encore son « Initial commit » du 22 octobre 2026 — étiqueté en local
`avant-publication-distant` — qui n'est pas un ancêtre de `main`.

**Ce que l'envoi forcé écrase, vérifié fichier par fichier.** Ce commit
distant porte `.gitattributes` et trois documents de phase 1 sous
`langage-assiste-c/docs/`. Leurs successeurs locaux sont bien plus complets
(VISION 72 lignes contre 19, SPECIFICATIONS 388 contre 35, DECISIONS 237
contre 22) : rien de substantiel n'est perdu. Le texte exact de ces trois
fichiers n'existait toutefois que là, et l'étiquette locale
`avant-publication-distant` le conserve.

`--force-with-lease` et non `--force` : il refuse si quelqu'un a poussé
entre-temps.

### 4.2 Envoyer les étiquettes — énumérées, **jamais** `--tags`

    git push origin v0.4.0 ref-avant-lot-13 lot-11a lot-11d lot-16 lot-17       lot-19 lot-23 lot-26 lot-27 lot-28 lots-30-31 evaluation-modele-1       campagne-2 campagne-3 kit-test-utilisateur

Seize étiquettes, dont **`v0.4.0`** qui marque la version publiée. Les
documents citent ces étiquettes et non des identifiants : sans elles, les
bilans de lots perdent leurs références (`docs/REPERES_GIT.md`).

> **Ne pas écrire `git push origin --tags`.** Quatre étiquettes locales,
> `avant-reecriture-auteur`, `avant-nettoyage-historique`,
> `avant-retrait-claude` et `avant-publication-distant`, désignent
> l'historique **d'avant** le nettoyage — celui qui contient encore les
> chemins personnels. `--tags` les pousserait, et publierait exactement ce
> que le nettoyage a retiré. C'est le piège le plus coûteux de cette
> procédure ; un contrôle de `scripts/pre-publication.mjs` vérifie que ce
> document ne contient pas cette commande.

Pour vérifier, avant d'envoyer, quelles étiquettes appartiennent à `main` :

    git for-each-ref --format='%(refname:short) %(objectname:short)' refs/tags |
      while read t h; do git merge-base --is-ancestor "$h" main &&
        echo "publiable  $t" || echo "SAUVEGARDE $t"; done

### 4.3 Release — vérifier qu'elle est bien **publiée**, et pas en brouillon

Un brouillon de release n'est **pas visible** d'un visiteur : l'API publique
répond `404` sur `/releases/latest`, la page de l'étiquette n'affiche que les
archives automatiques, et le `.vsix` n'est **pas** téléchargeable. C'est l'état
constaté le 17 novembre 2026 après la création annoncée.

Le gérer : **Releases** → ouvrir le brouillon → **Publish release**. S'il n'y a
pas de brouillon, créer la release depuis l'étiquette existante :

    https://github.com/Xigalion/c-a-french-to-c/releases/new?tag=v0.4.0

— coller `dist/notes-de-release-v0.4.0.md`, joindre `dist/c-a-0.4.0.vsix`.

**Attention au paquet joint.** Le `.vsix` doit être celui qu'un clone propre
produit : un `extension/out` jamais nettoyé y ajoutait un module renommé
depuis. `node scripts/paquet.mjs` **refuse** désormais un `out/` périmé. Le
paquet de référence fait **102 866 octets** et **37 entrées**.

Vérifier, une fois la release publiée :

    curl -sI -L https://github.com/Xigalion/c-a-french-to-c/releases/download/v0.4.0/c-a-0.4.0.vsix | head -1

### 4.4 Rendre public

Interface GitHub : **Settings → General → Danger Zone → Change visibility →
Make public**, puis confirmer.

**C'est le geste irréversible de la série.** Tout ce qui est public peut être
copié, forké, mis en cache et indexé dans les minutes qui suivent.

### 4.5 Finitions, après vérification du contenu distant

    # une fois le contenu distant VÉRIFIÉ, et pas avant :
    git tag -d avant-reecriture-auteur avant-nettoyage-historique \n      avant-retrait-claude avant-publication-distant
    git update-ref -d refs/original/refs/heads/main
    git reflog expire --expire=now --all && git gc --prune=now

Ces trois lignes effacent la **seule copie locale** de l'ancien historique.
Elles ne sont pas urgentes : rien de local n'est publié.

### 4.6 Ce qui n'est pas automatique, et reste à faire à la main

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

## 5. Vérifier après publication — fait le 17 novembre 2026

Tout ce qui suit a été exécuté **sans identifiants**, donc tel qu'un visiteur
le voit.

| Vérification | Résultat |
|---|---|
| API publique du dépôt | `public`, licence **Apache-2.0**, branche par défaut `main` |
| clone **anonyme** | 49 commits, 281 fichiers, 16 étiquettes |
| étiquettes de sauvegarde `avant-*` côté GitHub | **aucune** |
| branches distantes | **1** (`main`) |
| `CLAUDE.md` côté public | **absent de l'arbre et de l'historique** |
| 12 documents publics en accès brut | **200** chacun |
| pages `/issues`, `/issues/new/choose`, `/tree/main/docs` | **200** |
| les 4 modèles de tickets | présents, et **structurellement valides** |
| release et `.vsix` | **absents** — voir §4.3 |

**Les instructions d'installation du `README` ont été rejouées depuis le clone
anonyme** : `npm install` (2 paquets), `npm run check` (**3 834 tests, 0
échec**), `npm run build:extension`, `node scripts/paquet.mjs`. Le paquet
obtenu est **identique à l'octet près** à celui installé et vérifié
localement — mêmes 37 entrées, même empreinte du contenu.

Pour refaire ces contrôles plus tard :

    node scripts/suivi-public.mjs            # état du dépôt, tickets, ce qui reste
    curl -s https://api.github.com/repos/Xigalion/c-a-french-to-c | grep '"visibility"'
    git -c credential.helper= clone https://github.com/Xigalion/c-a-french-to-c.git /tmp/verif

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
