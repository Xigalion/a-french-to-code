# Publication 0.7.0 — ce qui est fait, ce qui reste

> **Fusionné, étiqueté, poussé le 19 novembre 2026.** La **release GitHub**
> reste à créer : aucun outil de la session ne la crée. Le lien, le titre et
> les deux fichiers sont au §7.

Dépôt : **`Xigalion/a-french-to-code`**.

**Ce document distingue partout ce qui a été réellement exécuté de ce qui est
seulement préparé.**

| Opération | État |
|---|---|
| fusion de `phase-4-sql` dans `main`, en **squash** | **FAIT** — §4, et la raison y est |
| étiquette annotée `v0.7.0` | **FAIT** |
| poussée de `main` et de `v0.7.0`, **par son nom** | **FAIT** |
| **release GitHub 0.7.0, en *pre-release*, avec le `.vsix`** | **À FAIRE à la main** — §7 |

---

## 1. L'état vérifié

| Vérification | Résultat | Commande |
|---|---|---|
| tests Node | **4 487**, 0 échec | `npm test` |
| typecheck moteur et extension | vert | `npm run typecheck` |
| tests hôte, **sources**, VS Code 1.138.0 | **130**, 0 échec | `npm run test:vscode` |
| tests hôte, **paquet**, VS Code 1.138.0 | **130**, 0 échec | `CA_EXTENSION_PATH=<dossier isolé>` |
| tests hôte, **paquet**, VS Code **1.96.4** (version minimale) | **130**, 0 échec | idem, avec `VSCODE_EXECUTABLE` |
| différentiel contre `v0.6.0` | **0 régression, 0 capacité perdue** sur 1 335 559 comparaisons | `node scripts/differentiel.mjs v0.6.0 --no-loss` |
| exercice de clôture SQL | 9 fichiers, 109 phrases, 0 retouche, `psql` en code 0, 3 épreuves négatives conformes | `node exercice/sql/cloture.mjs` |
| français souple en SQL | **39/40**, 0 acceptée à tort, 0 erreur de sens | `node scripts/mesurer-sql.mjs` |
| français souple en Java | **36/36**, inchangé | `node scripts/mesurer-java.mjs` |
| français souple, corpus **gelé** C17 | **95,1 %**, inchangé | `node scripts/mesurer-reformulations.mjs` |
| liens et chemins cités | **0 problème**, et **sans aucune exception** | `node scripts/liens.mjs` |
| contrôles de pré-publication | **20/20**, relancés **sur `main`** | `node scripts/pre-publication.mjs --rapide` |
| paquet reproductible **au bit** | **trois** constructions indépendantes | §2 |
| mise à niveau depuis la 0.6.0 | une seule extension, identifiant inchangé | §3 |

**Une instabilité est signalée, et non cachée** : la suite hôte a échoué une
fois sur six aujourd'hui, puis a passé 130/130 cinq fois de suite sans aucune
modification. Deux hypothèses testées, deux réfutées ; la cause n'est pas
trouvée. Détail : `docs/phase4/CLOTURE.md` §5.

## 2. Le paquet

```
dist/c-a-0.7.0.vsix
sha256  63ec159b9ff3d380406b69bf6afda3ec315c2aa1a024c289814034d39ae86a2a
taille  246 435 octets
entrées 72
```

**Reproductible au bit depuis trois constructions indépendantes** : le poste
de développement et **deux clones propres**, `npm ci`, construction, paquet —
et la même empreinte à chaque fois.

```bash
git clone --branch v0.7.0 https://github.com/Xigalion/a-french-to-code.git verification
cd verification && npm ci && npm run build:extension && node scripts/paquet.mjs
```

**Et cette vérification a trouvé un défaut.** Au premier essai, le paquet du
poste différait de celui d'un clone propre par **10 octets** : des **CRLF**
dans l'arbre de travail local, là où `.gitattributes` impose `eol=lf`. Le
contenu normalisé étant identique, `git status` était muet. Un vingtième
contrôle de pré-publication regarde désormais le **disque**, et il a attrapé
son propre fichier au premier passage.

## 3. La mise à niveau depuis la 0.6.0 — vérifiée

```
1. code --extensions-dir <isolé> --install-extension dist/c-a-0.6.0.vsix
   → projet-a-local.c-a@0.6.0
2. code --extensions-dir <isolé> --install-extension dist/c-a-0.7.0.vsix
   → projet-a-local.c-a@0.7.0        ← UNE seule extension listée
```

- `extensions.json` ne contient qu'**une** entrée, en **0.7.0** ;
- `.obsolete` marque le dossier de la 0.6.0 : `{"projet-a-local.c-a-0.6.0":true}` ;
- **rien n'a été désinstallé**, et l'identifiant `projet-a-local.c-a` est
  inchangé — un test l'exige.

## 4. La fusion — en **squash**, et voici pourquoi

```bash
git checkout main
git merge --squash phase-4-sql
git commit                  # un seul commit, dont l'arbre est celui de la branche
git diff --stat main phase-4-sql   # vide
```

Les livraisons précédentes fusionnaient en **avance rapide**. Pas celle-ci, et
ce n'est pas un choix de style : **deux commits intermédiaires de la branche
portaient un chemin personnel** dans le journal de l'exercice — `psql`
préfixe ses erreurs du chemin absolu du script.

Le contrôle « aucun nom d'utilisateur dans l'historique de `main` » scanne
**tout** l'historique, par `git log main -S`. Une fusion ordinaire aurait donc
rendu ce chemin **publiquement atteignable depuis `main`**. Le squash l'évite,
et le contrôle le confirme : **20/20 sur `main`**.

**Ce que cela coûte** : `main` ne porte plus les douze commits par lot. Le
détail reste sur la branche, et `docs/phase4/BILAN_SQL_V1.md` le recense lot
par lot.

**Ce qui reste à nettoyer** : la branche `phase-4-sql` existe **au distant**,
et ses deux commits portent toujours le chemin. La retirer demande soit la
suppression de la branche distante, soit une réécriture d'un historique
poussé — que les conventions du dépôt interdisent de faire sans décision
explicite. **C'est le seul point d'hygiène ouvert**, et il est signalé plutôt
que tu.

### Retour arrière

Avant la poussée, `git reset --hard ORIG_HEAD`. **Après**, le retour se fait
par un **nouveau commit** qui annule : ce dépôt ne réécrit pas `main`.

**Ne pas utiliser `v0.6.0`** pour revenir : comme ses deux aînées, cette
étiquette n'est pas le sommet de `main`.

## 5. L'étiquette

```bash
git tag -a v0.7.0 -m "A 0.7.0 — quatre langages cibles : C17, Python, Java 21, SQL"
```

Posée **après** la fusion, sur `main`.

## 6. La poussée

```bash
git push origin main
git push origin v0.7.0
```

**Ne pas pousser `--tags`** : cela enverrait aussi les étiquettes de
sauvegarde `avant-*`, qui contiennent des chemins personnels. Deux contrôles
l'interdisent, et l'étiquette se pousse donc par son nom.

## 7. La release GitHub — le seul geste manuel

Aucun outil de cette session ne crée une release : le serveur GitHub
disponible ne sait que **lire** les releases, et `gh` n'est pas installé.

**Lien** — l'étiquette est déjà au distant :

    https://github.com/Xigalion/a-french-to-code/releases/new?tag=v0.7.0

**Titre :**

    A 0.7.0 — quatre langages cibles

**Les deux fichiers :**

| Rôle | Chemin |
|---|---|
| à **joindre** | `dist/c-a-0.7.0.vsix` |
| à **coller**, en entier | `dist/notes-release-v0.7.0.md` |

Le corps se **produit**, il ne se repère pas à l'œil :

    node scripts/notes-release.mjs 0_7_0

Le script refuse de produire un corps où l'en-tête du gabarit aurait survécu —
c'est le défaut de la 0.5.0.

**Cocher « Set as a pre-release ».** Décision du fondateur, maintenue : la
version reste en avant-première **tant que la validation humaine n'a pas eu
lieu**, et `0/10` séances la justifient.

**Ne pas cocher « Save draft »** : un brouillon n'est visible que du
propriétaire, et la vérification anonyme échouerait.

## 8. Ce que cette publication ne règle pas

- **aucun essai par un utilisateur**, dans aucun des **quatre** langages.
  `0/10` séances, et c'est le même zéro depuis la phase 1 ;
- **aucun essai hors Windows** ; un seul compilateur C, un seul interpréteur
  Python, un seul JDK, un seul serveur SQL ;
- l'**instabilité du harnais hôte**, observée et non expliquée (§1) ;
- la branche distante `phase-4-sql`, à nettoyer (§4) ;
- les éléments secondaires du dépôt — étiquettes de tickets, sujets, onglet
  Projects, brouillon de release de la 0.5.0 — **écartés sur consigne**, et
  toujours vrais.
