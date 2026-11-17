# Audit du dépôt avant ouverture publique

**Pour qui :** le fondateur, pour décider si le dépôt peut être rendu public,
et sous quelle licence.

> **Le dépôt n'a pas été rendu public, et ne le sera pas sans ton accord
> explicite.** Cet audit prépare la décision ; il ne la prend pas.
>
> Date : 16 novembre 2026. Dernier commit audité : voir §8.

---

## 1. Où en est le dépôt aujourd'hui

| | |
|---|---|
| dépôt distant | `origin` existe déjà et pointe vers un dépôt GitHub personnel |
| visibilité actuelle | **non publique** — une requête anonyme sur l'API GitHub répond 404 |
| contenu poussé | **un seul commit**, « Initial commit » |
| commits locaux **non poussés** | **36** |
| fichiers suivis | 231 |
| taille de l'historique | ~6,4 Mo |

Publier revient donc à **deux** gestes distincts : pousser 36 commits, puis
changer la visibilité. Les deux t'appartiennent.

## 2. Secrets et données personnelles

| Recherche | Résultat |
|---|---|
| clés, jetons, mots de passe (`api_key`, `secret`, `token`, `password`, `BEGIN … PRIVATE KEY`) | **aucune occurrence** hors noms de diagnostics (`INVALID_EXPRESSION_TOKEN`) |
| adresses de courriel dans les fichiers | **aucune** |
| fichiers `.env`, identifiants, configuration de service | **aucun** |
| chemins absolus contenant un **nom d'utilisateur** | **7 occurrences, dans 3 fichiers — corrigées** |
| nom d'utilisateur dans `CLAUDE.md` | **corrigé** (chemin du `CLAUDE.md` parent) |

### 2.1 Les chemins personnels : cause, correction, prévention

Les journaux de compilation publient ce que GCC a cité, et GCC cite le chemin
qu'on lui donne. Comme les scripts lui passaient des chemins **absolus**, les
journaux contenaient `C:\Users\<nom>\…`.

- **Correction de la cause** : les trois scripts de compilation lancent
  désormais GCC **depuis** le dossier de travail, avec des chemins
  **relatifs**. Vérifié : le message d'assertion du programme de clôture dit
  maintenant `file notes.c` et non un chemin absolu.
- **Correction de l'existant** : `node scripts/anonymiser.mjs` liste, puis
  (`--ecrire`) remplace le dossier personnel par `<DOSSIER-PERSONNEL>` dans
  tous les fichiers suivis. Les journaux restent des preuves ; seul le nom
  disparaît.
- **Prévention** : relancer `node scripts/anonymiser.mjs` avant toute
  publication. Il sort 0 fichier quand le dépôt est propre.

### 2.2 Ce qu'un audit de fichiers ne peut pas corriger

**L'adresse de courriel personnelle du fondateur figure dans l'auteur des
37 commits.** Rendre le dépôt public la rend publique, et aucun nettoyage de
fichiers n'y change rien.

Trois options, et c'est une décision, pas un défaut :

1. **accepter** — c'est le cas de la majorité des dépôts personnels ;
2. **réécrire l'historique avant le premier envoi** (`git filter-repo`), avec
   une adresse de redirection GitHub (`…@users.noreply.github.com`). Possible
   **sans douleur** ici, puisque 36 commits sur 37 ne sont pas poussés ;
3. **repartir d'un dépôt neuf** avec un seul commit initial — on perd
   l'historique des lots, qui est une partie de la valeur du projet.

Ma recommandation : **l'option 2**, maintenant. Elle est gratuite avant le
premier envoi et coûteuse après.

**DÉCISION DU FONDATEUR, 16 novembre 2026 : option 2, faite.** Les 38 commits
portent désormais l'adresse de redirection GitHub du compte ; l'arbre est
**identique** avant et après, et les **26 citations** d'anciens identifiants
dans 16 documents ont été mises à jour. La table de correspondance **n'est pas publiée** : elle vit dans
`local/`, hors du dépôt suivi. Les documents citent désormais des
**étiquettes** et non des identifiants (`docs/REPERES_GIT.md`).

**Le premier envoi exigera `git push --force-with-lease origin main`** : le
dépôt distant contient encore l'ancien « Initial commit ».

## 3. Fichiers temporaires, journaux et binaires

| Élément | État |
|---|---|
| `node_modules/`, `.cache/`, `dist/` | **ignorés** |
| exécutables et objets des recettes GCC (`exercice/**/*.exe`, `*.o`) | **ignorés** |
| dossiers de travail de compilation (`test-utilisateur/journal/build/`, `exercice/promotion/journal*/build/`) | **ignorés** |
| `debug.log` à la racine | **ignoré** ; c'est une trace de plantage de VS Code (`crashpad`), 130 octets. Suppressible sans conséquence |
| journaux de validation suivis (`exercice/**/journal/`, `test-utilisateur/journal/`) | **gardés volontairement** : ce sont les preuves des campagnes |
| fichiers binaires suivis | **aucun** |
| fichier suivi non textuel | **aucun**, depuis la correction de `CLAUDE.md` |

### 3.1 Un défaut trouvé par l'audit : `CLAUDE.md` était binaire pour git

Le fichier contenait **deux octets nuls** : `'\0'` y avait été écrit comme un
véritable octet nul au lieu des deux caractères. Git le traitait donc comme un
**fichier binaire** — aucun diff lisible, `git grep` muet sur son contenu.
Corrigé ; le fichier est redevenu du texte, et son sens est inchangé.

## 4. Documentation publique

| Attendu | Fichier | État |
|---|---|---|
| page d'accueil | `README.md` | **écrit** — ce que c'est, ce que ce n'est pas, état réel, installation, usage, carte du dépôt, résumé en anglais |
| ce que l'outil accepte | `docs/CATALOGUE.md` | existait, généré depuis le moteur |
| ce qu'il ne fait pas | `docs/LIMITES_CONNUES.md` | **écrit** — 9 sections, dont les trois profils d'expression et les contournements |
| installation et retour arrière | `docs/TEST_INSTALLATION.md` | existait (phase de test) |
| guide de contribution | `CONTRIBUTING.md` | **écrit** — 9 règles non négociables, ce qui est refusé d'avance, la méthode par lots |
| modèles de tickets | `.github/ISSUE_TEMPLATE/` | **écrits** — 3 formulaires + liens, tickets vides désactivés |
| licence | — | **à décider**, §6 |

### 4.1 À corriger au moment de publier

`.github/ISSUE_TEMPLATE/config.yml` contient deux liens avec
`OWNER/REPO` en place du dépôt réel. **Remplacer** par le chemin définitif,
sinon les deux liens d'aide seront morts. C'est volontairement laissé en
évidence plutôt que deviné.

## 5. Ce que publier expose, en clair

| Exposé | Conséquence |
|---|---|
| l'adresse de courriel des commits | §2.2 |
| les journaux de validation | ils citent des versions de GCC, de VS Code et des dates. Aucun contenu personnel après nettoyage |
| le `CLAUDE.md` de travail | il décrit la méthode, les décisions et les dettes du projet, y compris ses faiblesses. C'est un choix de transparence : à relire une fois dans cette optique |
| les scores de campagnes | **81,7 %**, **83,7 %**, **93,9 %** — avec, à chaque fois, ce qu'ils ne prouvent pas. Publiés tels quels, ils sont honnêtes ; publiés seuls, ils seraient flatteurs |

Rien dans le dépôt ne décrit un tiers, un établissement ou un étudiant réel.

## 6. Licence — décision à prendre

Le dépôt **n'a pas de licence**. En l'absence de licence, le droit d'auteur
par défaut s'applique : personne n'a le droit de réutiliser, modifier ni
redistribuer le code, même publié. Un dépôt public sans licence est donc
lisible mais inutilisable — ce qui est parfois exactement l'intention.

| Option | Ce qu'elle permet | Ce qu'elle coûte |
|---|---|---|
| **aucune licence** | lecture seule ; aucune réutilisation autorisée | aucune contribution externe possible en pratique ; incohérent avec un `CONTRIBUTING.md` |
| **MIT** | tout, y compris commercial, avec mention de la paternité | un tiers peut reprendre C-A dans un produit fermé, sans rien rendre |
| **Apache-2.0** | comme MIT, plus une **clause de brevet** explicite et une obligation de signaler les modifications | texte plus long ; même liberté de reprise commerciale |
| **GPL-3.0** | réutilisation libre, mais toute œuvre dérivée **doit rester libre** | incompatible avec une reprise dans un produit fermé — y compris, plus tard, par toi |
| **sources visibles, droits réservés** (licence propre) | lecture, étude, retours ; pas de reprise | rédaction à faire ; non reconnue par les outils ; décourage les contributions |

**DÉCISION DU FONDATEUR, 16 novembre 2026 : Apache-2.0.** `LICENSE` (texte
canonique, 11 358 octets) et `NOTICE` sont en place, et `README.md` comme
`CONTRIBUTING.md` le disent. Les contributions sont réputées soumises à la
même licence. Aucun en-tête par fichier n'a été ajouté : la licence ne
l'exige pas, et 40 fichiers d'en-têtes seraient du bruit. À reconsidérer si
du code est extrait du dépôt.

La recommandation qui précédait cette décision, conservée telle quelle :

1. le projet **appelle des retours d'usage** et ouvre des formulaires de
   tickets : une licence reconnue lève l'ambiguïté pour ceux qui essaient ;
2. la clause de brevet protège un projet qui décrira des méthodes
   pédagogiques, là où MIT reste muette ;
3. elle laisse ouverte la famille **AD** et toute version commerciale
   ultérieure, ce que GPL-3.0 fermerait.

**Si l'intention est de montrer sans partager**, alors *aucune licence* est
le choix cohérent — et il faut alors retirer `CONTRIBUTING.md`, ou y écrire
que les contributions ne sont pas acceptées.

**Rien n'a été ajouté** : aucun fichier `LICENSE` n'est écrit, et le `README`
renvoie ici. Dis le choix, et je l'ajoute avec l'en-tête correspondant.

## 7. Décisions qui restent, et qui ne m'appartiennent pas

**Tranchées le 16 novembre 2026 :** la licence (**Apache-2.0**, §6) et la
réécriture de l'auteur des commits (**faite**, §2.2).

Restent ouvertes :

1. **publier ou non**, et quand — rien ne sera poussé sans ton accord ;
2. publier le **`CLAUDE.md` de travail** tel quel, avec ses dettes et ses
   points ouverts, ou en extraire une version publique ;
3. le **nom public** du dépôt : `A`, `C-A`, ou autre — le dépôt distant
   s'appelle aujourd'hui `A`, ce qui est introuvable par recherche ;
4. les deux liens `OWNER/REPO` de `.github/ISSUE_TEMPLATE/config.yml` (§4.1).

## 8. Deuxième passe — 17 novembre 2026

La première passe (§1 à §7) est **conservée telle quelle**. Celle-ci ajoute ce
qu'elle avait manqué, et ce que les décisions du fondateur ont rendu
nécessaire.

### 8.1 Ce que la première passe avait manqué : l'historique

La première passe a nettoyé les **fichiers suivis**. Elle n'avait pas
cherché le nom d'utilisateur dans les **commits antérieurs** — et il y était,
dans **6 commits** de `main` : les journaux de compilation des campagnes 1 et
2, et le chemin du `CLAUDE.md` parent.

Nettoyer l'arbre courant ne suffit donc pas : publier l'historique aurait
publié le nom. Correction : **une seconde réécriture complète**, qui remplace
dans tous les fichiers texte de tous les commits :

| Remplacé | Par |
|---|---|
| le dossier personnel, dans ses trois écritures | `<DOSSIER-PERSONNEL>` |
| l'adresse de courriel personnelle, si présente dans un contenu | l'adresse de redirection GitHub |
| toute citation d'identifiant de commit `` `xxxxxxx` `` | `(identifiant antérieur à la réécriture)` |
| `docs/HISTORIQUE_REECRITURE.md` | **supprimé de tous les commits** |

Le dernier point exécute la consigne « ne pas publier les anciennes
références de l'historique réécrit » : la table de correspondance n'existe
plus dans le dépôt suivi, et les identifiants cités par les anciens commits
sont neutralisés au lieu d'être laissés en place.

### 8.2 Les citations d'identifiants deviennent des étiquettes

Vingt-deux citations d'identifiants de commit ont été converties en **noms
d'étiquettes** (`lot-16`, `campagne-3`, `ref-avant-lot-13`…). Raison de fond :
un identifiant ne survit pas à une réécriture, et ce dépôt vient d'en subir
deux. Seize étiquettes sont posées, dont `v0.4.0`, et un contrôle vérifie
que **chaque étiquette citée par un document existe**
(`docs/REPERES_GIT.md`).

### 8.3 Trois défauts de documentation trouvés par le vérificateur de liens

`node scripts/liens.mjs` contrôle 127 liens Markdown et 595 chemins cités. Il
a trouvé, et ils sont corrigés :

1. trois bilans du lot 11 citaient `src/conditionInformation.ts`, renommé au
   lot 12 — la mention est **historiquement juste** et le dit désormais sur
   place ;
2. le bilan du lot 26 citait un journal `exercice/journal/hote-lot26.txt`
   **qui n'a jamais existé** ; le résultat réel est dans
   `exercice/journal/hote.txt` ;
3. trois renvois pointaient vers la table de correspondance, désormais hors
   du dépôt.

### 8.4 Ce que la deuxième passe ajoute au dépôt

| Ajout | Pourquoi |
|---|---|
| `CHANGELOG.md` | une version publique identifiable, **avec ses limites**, et non une liste de nouveautés |
| `docs/ETAT_DU_PROJET.md` | la version publique de `CLAUDE.md`, qui reste dans le dépôt **sans rien perdre** |
| `docs/REPERES_GIT.md` | les étiquettes, et pourquoi pas des hachages |
| `docs/PUBLICATION.md` | la procédure, les commandes exactes, et le **retour arrière** |
| `scripts/liens.mjs` | liens internes et chemins cités |
| `scripts/pre-publication.mjs` | **14 contrôles**, un seul point d'entrée, qui échoue |
| `.gitattributes` | fins de ligne **LF** imposées dans le dépôt (la règle `text=auto` héritée ne suffisait pas) |
| remote `public` | la destination proposée est **visible** en configuration locale, sans toucher à `origin`, et n'a jamais servi à pousser |

### 8.5 Nom public

Proposé par le fondateur : **`c-a-french-to-c`**, sous réserve de
confirmation. Il est écrit dans deux liens d'aide des modèles de tickets et
dans le remote `public` ; `docs/PUBLICATION.md` §2 donne la commande unique
pour le changer. Le dépôt distant s'appelle encore `A`.

### 8.6 Ce que cette passe ne fait pas

- **aucun envoi, aucun changement de visibilité, aucune création de dépôt.**
  Les commandes sont écrites, pas exécutées ;
- elle ne garantit pas qu'aucun secret n'a **jamais** existé dans
  l'historique : elle vérifie des motifs connus, sur l'historique tel qu'il
  sera publié ;
- elle ne relit pas le **sens** de 84 documents. Un lien valide n'est pas une
  phrase vraie.

## 9. État de la vérification

Au 17 novembre 2026, après la deuxième passe :

    node scripts/pre-publication.mjs

- **14 contrôles**, dont `npm run check` (**3 834 tests, 0 échec**) et le
  vérificateur de liens (127 liens, 595 chemins cités, 0 problème) ;
- aucune donnée personnelle dans les fichiers **ni dans l'historique de
  `main`** ;
- aucune citation d'identifiant de commit ; chaque étiquette citée existe ;
- aucun fichier binaire, volumineux ou non textuel suivi ; aucun dossier de
  travail de compilation ;
- licence Apache-2.0 complète et annoncée dans les trois documents publics ;
- une seule branche, donc un envoi explicite sans surprise ;
- suite hôte VS Code : **99 / 99**, neuf passages verts consécutifs.

**Ce que cet audit ne garantit pas.** Il a cherché des motifs connus de
secrets dans les fichiers **suivis à cette date**. Il ne prouve pas qu'aucun
secret n'a jamais existé dans l'historique : si un tel doute apparaît, la
réponse est la même que pour l'adresse de courriel — réécrire l'historique
**avant** le premier envoi, pendant que c'est encore gratuit.
