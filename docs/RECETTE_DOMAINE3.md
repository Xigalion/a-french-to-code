# Domaine 3 — « Décisions et répétitions » : protocole de recette finale

**Statut au 12 novembre 2026 : protocole prêt, recette manuelle non
effectuée.** Les lots 9 à 11D sont implémentés et couverts par 2 402 tests
Node automatisés réussis. **Les tests automatisés ne valent pas validation
pédagogique**, et aucun test hôte n'a pu être exécuté pendant la livraison
du lot 11 (voir §0).

Ce document **intègre** le [protocole du lot 10](RECETTE_LOT10.md), qui
reste la référence détaillée pour les chaînes de branches : ses sections 1
à 7 sont à exécuter telles quelles, puis les sections ci-dessous les
complètent pour les boucles et les transferts. La recette GCC complète
« Expressions et calculs » reste **ouverte** et n'est pas clôturée par ce
document.

---

## 0. Blocage à lever avant de commencer

**La suite hôte VS Code n'a pas pu être exécutée le 12 novembre 2026.**

```
checkInnoSetupMutex: vscode-updating is held, waiting up to 30s for setup to finish...
checkInnoSetupMutex: vscode-updating still held after 31017ms, giving up
Error: Code is currently being updated. Please wait for the update to complete before launching.
```

Une mise à jour de VS Code est en attente sur la machine ; le mutex Inno
Setup `vscode-updating` est détenu par l'instance en cours d'exécution, et
`scripts/test-vscode.mjs` lance l'installation locale. **Premier geste de
la recette : redémarrer VS Code pour appliquer sa mise à jour, puis**

```powershell
npm run test:vscode
```

Résultat attendu, **non vérifié à ce jour** : 93 tests hôte, dont 68
hérités du lot 10 et 25 écrits pour le lot 11. Consigner la version de
VS Code obtenue : elle différera de la 1.96.4 des bilans antérieurs, ce qui
doit être noté, pas masqué.

Tant que cette exécution n'a pas eu lieu, **aucun résultat hôte ne doit
être revendiqué** pour les lots 11A à 11D.

---

## 1. Préparation

Reprendre le §1 du [protocole du lot 10](RECETTE_LOT10.md) : fichier
ordinaire vide, extension recompilée (`npm run build:extension` puis hôte
de développement F5), relevé de l'OS, de la version VS Code, de l'unité
d'indentation et de LF/CRLF, désactivation des actions de sauvegarde et de
formatage externes, aucune tâche GCC automatique.

Une commande par session : `Ctrl+K` puis `A`. La première Entrée prépare le
diff ; seule « Insérer » modifie le document. Les contrôles physiques
clavier et IME se consignent séparément.

Exécuter d'abord **intégralement** les §2 à §7 du protocole du lot 10.
Noter chaque scénario réussi, échoué ou non effectué avant de passer aux
boucles.

---

## 2. Projet progressif — `while` (lot 11A)

Fichier `recette_domaine3_while.c` vide. Demander successivement, en
replaçant explicitement le curseur quand la ligne de saisie n'est pas déjà
au bon endroit :

```text
Inclue la bibliothèque stdio.h.
Crée la fonction principale.
Crée un entier nommé i de valeur 0.
Crée un entier nommé limite de valeur 3.
Crée une boucle tant que "i < limite".
Crée un bloc si "i == 0".
Affiche le texte "début\n".
```

Puis, en créant **soi-même** une ligne blanche après la fermeture du `if`,
alignée sur la chaîne :

```text
Ajoute une branche sinon si "i == 1".
Affiche le texte "milieu\n".
Ajoute une branche sinon.
Affiche le texte "fin\n".
```

Enfin, en créant soi-même une ligne blanche **après la chaîne complète et
toujours dans la boucle** :

```text
Affecte à i le résultat de "i + 1".
```

Après chaque instruction, vérifier : commentaire exact, aperçu complet,
aucune modification avant confirmation, curseur à l'intérieur du bloc pour
les boucles et les chaînes, ligne de saisie ordinaire pour les instructions
simples. **Aucun compteur, initialisation, progression, `return` ni
en-tête ajouté.**

### Prévisions à écrire avant toute exécution

| `limite` | Tours prévus | Affichages prévus |
|---:|---:|---|
| 0 | 0 | aucun affichage du corps |
| 1 | 1 | `début` |
| 3 | 3 | `début`, `milieu`, `fin` |

Avant d'envisager une exécution, vérifier que **la progression est hors de
toutes les branches mais dans la boucle**, et que le programme est
entièrement rempli. Expliquer l'invariant `0 ≤ i ≤ limite` pour ces
données, le variant `limite − i` qui diminue de 1 à chaque tour terminé, et
pourquoi ces calculs restent représentables dans ce programme précis.

**Rien de ce raisonnement n'est fait par C-A.** Une progression placée dans
une seule branche, ou omise, s'étudie sur papier, **sans lancer le
programme incomplet**. Ne pas extrapoler les limites générales des types à
partir de ces petites valeurs.

### Deuxième exercice — imbrication

Ajouter une boucle intérieure sur `j < 2`, avec remise à zéro **explicite**
de `j` au début de chaque tour extérieur, progression de `j` dans la boucle
intérieure, progression de `i` après sa fermeture. Prévoir 3 × 2 passages
pour `limite = 3`. Identifier les niveaux d'indentation et les variables
dont l'état doit changer. Réutiliser une condition composée avec un
indicateur fixé et expliquer le court-circuit **sans exécuter d'opération
dangereuse**.

Vérifier que la fermeture de la boucle extérieure et toute instruction
suivante restent intactes, et qu'aucune ligne blanche ne s'accumule.

---

## 3. Test initial contre test final (lot 11B)

Fichier séparé. Avec une condition **initialement fausse**, comparer les
deux formes :

```text
Crée un entier nommé i de valeur 5.
Crée une boucle tant que "i < 3".
```
puis, dans un autre fichier :
```text
Crée un entier nommé i de valeur 5.
Crée une boucle avec test final tant que "i < 3".
```

Écrire la prévision **avant** de remplir les corps : la forme à test
initial n'exécute aucun tour ; la forme à test final exécute le corps **une
fois** si la boucle est atteinte. Remplir chaque corps d'un affichage
explicite, vérifier la prévision, puis expliquer la différence.

Vérifier en aperçu :

- la structure `do { … } while (…);` est produite **entière**, avec un seul
  point-virgule, celui que le C exige après la condition finale ;
- le curseur arrive à l'intérieur du corps vide ;
- aucune ligne de saisie n'est créée après la ligne de fermeture ;
- `Ajoute une branche sinon.` sur une ligne blanche après `} while (…);`
  est **refusé**, et la cible n'est pas reportée sur un `if` voisin.

Ne pas confondre « corps exécuté » et « condition atteinte » : les
transferts du 11D ne sont pas encore en jeu à cette étape.

---

## 4. Clauses du `for` (lot 11C)

Déclarer soi-même le compteur, puis demander :

```text
Déclare un entier nommé i.
Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".
```

Vérifier en aperçu :

- l'en-tête produit est `for (i = 0; i < 3; i = (i + 1)) {`, exactement les
  champs demandés ;
- **aucune déclaration n'est ajoutée dans l'en-tête** : la déclaration
  écrite par l'étudiant est seule, et son `i` **survit à la boucle** ;
- aucun `++`, aucune valeur par défaut, aucune clause vide.

Écrire l'en-tête entièrement explicite, puis **justifier son équivalence
avec le `while` du §2 sous hypothèses écrites** : initialisation une fois
avant le premier test, test avant chaque tour, mise à jour après le corps.
C-A n'affirme aucune équivalence ; c'est le raisonnement de l'étudiant.

Étudier les **erreurs d'une unité** : `i < 3` contre `i <= 3`, `i = 1`
comme valeur initiale. Prévoir le nombre de tours dans chaque cas, puis
vérifier. Expliquer pourquoi la présence textuelle d'une mise à jour ne
garantit pas l'arrêt : elle peut dépendre d'une branche, être modifiée à la
main, ou ne jamais être atteinte.

Vérifier les refus, **sans insertion** : clause vide (le champ manquant est
nommé), `i++` en mise à jour, `incrément` au lieu de `mise à jour`,
`mise a jour` sans accent, et un découpage d'expression entre les trois
champs qui dépasse le budget commun de 1 024 tokens.

---

## 5. Transferts et points de reprise (lot 11D)

**Aucun des cas de cette section ne doit être exécuté avant revue.** Les
programmes exécutés restent les programmes sûrs des §2 à §4.

### 5.1 Cible affichée

Dans le corps d'une boucle bracée, préparer :

```text
Sors de la boucle la plus intérieure.
```

Avant de confirmer, lire la **cible affichée** dans « Insérer » : elle doit
nommer la ligne et l'en-tête de la boucle visée. Confirmer, vérifier que
`break;` est inséré avec son commentaire, et qu'**aucun `return` ni `goto`**
n'apparaît.

### 5.2 La boucle intérieure intercepte toujours

Construire deux boucles imbriquées bracées. Depuis le corps intérieur,
préparer le même transfert : la cible affichée doit être la **boucle
intérieure**. **Ne pas demander la sortie d'une boucle extérieure par un
`break` intérieur** : c'est impossible, et C-A ne doit jamais le proposer.

### 5.3 Le `switch` écrit à la main

Écrire soi-même un `switch` bracé dans le corps d'une boucle, avec une
étiquette `case`. Depuis l'intérieur du `switch` :

- `Sors de la boucle la plus intérieure.` doit être **refusé**
  (`BREAK_TARGET_IS_SWITCH`), sans insertion et sans réécriture : en C17,
  `break;` quitterait le `switch`, pas la boucle, donc la phrase serait
  fausse ;
- `Passe à l’itération suivante de la boucle la plus intérieure.` doit être
  **accepté**, et la cible affichée doit être la boucle, non le `switch`.

Expliquer la règle C17 dans les deux cas. Ne pas conclure que `switch` est
absent du document parce que C-A ne le génère pas.

### 5.4 Points de reprise distincts

Sur trois fichiers de démonstration, un par forme de boucle, placer un
`continue;` et **expliquer où l'exécution reprend** :

| Forme | Reprise de `continue` |
|---|---|
| `while` | au test initial |
| `do/while` | à la condition finale |
| `for` | à la mise à jour, puis au test |

### 5.5 Progression sautée

Dans un `while` dont la progression manuelle est écrite **en fin de corps**,
insérer un `continue;` au-dessus. Vérifier que C-A **ne déplace pas** cette
progression et n'en ajoute aucune avant le transfert. Expliquer que ce
`continue` la saute et peut empêcher l'arrêt. **Ne pas exécuter ce
programme.**

### 5.6 Refus de contexte

Vérifier chaque refus, sans insertion ni correction :

- hors de toute boucle, et dans un corps de fonction seul →
  `LOOP_TARGET_NOT_FOUND` ;
- corps de boucle **sans accolades** (`while (a)` puis ligne suivante) →
  `UNBRACED_LOOP_BODY` ; C-A **n'ajoute pas** d'accolades ;
- juste après la fermeture d'une boucle → refus, la boucle est close ;
- boucle intérieure déjà fermée, avec une ligne cible **indentée comme
  elle** → la cible doit être la boucle extérieure encore ouverte : la
  cible n'est **jamais** déduite de l'indentation ;
- commentaire ou chaîne contenant `while (…) {` → ne crée aucune cible ;
- directive non prise en charge, continuation de ligne, trigraphe → limites
  explicites.

### 5.7 Péremption

Après l'aperçu d'un transfert, remplacer `while` par `switch` dans
l'en-tête de la boucle visée. L'aperçu doit devenir périmé et « Insérer »
disparaître. Annuler : aucun changement.

---

## 6. Canal pédagogique passif

Ouvrir volontairement Affichage → Sortie → « C-A — Pédagogie ». Vérifier,
sur des aperçus séparés :

| Intention | Entrée attendue |
|---|---|
| `Crée une boucle tant que "…"` | `WHILE_PRETEST [information]` |
| `Crée une boucle avec test final tant que "…"` | `DO_WHILE_POSTTEST [information]` |
| `Crée une boucle pour … ` | `FOR_CLAUSE_ORDER [information]` |
| `Sors de la boucle…` / `Passe à l’itération…` | **aucune** entrée |

Pour les trois boucles, vérifier que l'information porte sur la plage
UTF-16 de la condition **sans les guillemets**, qu'elle précède les
informations d'opérateurs `&&`, `||` et `!` sans les supprimer, et qu'elle
énonce **quand** la condition est évaluée, jamais une garantie d'arrêt.

Vérifier qu'aucune de ces informations **n'incrémente le compteur
d'avertissements** et que le titre de confirmation ne mentionne pas
« avertissement ». Le canal ne doit jamais s'ouvrir automatiquement ni
voler le focus.

Dans une session séparée, préparer une boucle dont une clause contient un
motif du lot 8, par exemple une mise à jour `"i + 10 / 0"` :
l'avertissement doit apparaître **en plus** de l'information, le compteur
doit augmenter, et la traduction rester fidèle. **Annuler après l'aperçu ;
ne pas intégrer cet extrait au programme exécuté.**

**L'absence d'avertissement n'est jamais un certificat d'arrêt ni de
sûreté.**

---

## 7. Annulation, EOL et indentation

- Après une boucle puis une instruction dans son corps : la première
  annulation retire l'instruction seule, la seconde retire la boucle et son
  commentaire. Deux rétablissements restaurent exactement les deux états.
  Une confirmation répétée ne double jamais une insertion.
- Refaire au moins un cas de chaque forme de boucle avec **tabulations** et
  **CRLF**, puis avec une ligne blanche à EOF sans EOL terminal. Une fin de
  fichier occupée doit être refusée.
- Modifier les réglages d'indentation après un aperçu : l'aperçu devient
  périmé. Fermer le document cible ou changer d'éditeur ne doit jamais
  rediriger l'insertion.

---

## 8. Critères d'acquisition du domaine

La recette est réussie quand l'apprenant sait **produire et expliquer** :

1. chaque chemin d'une chaîne `if` / `else if` / `else`, et pourquoi elle
   n'est pas trois `if` indépendants ;
2. le choix d'un test initial ou d'un test final, et ce qu'il change pour
   une condition initialement fausse ;
3. une initialisation et une progression **explicites**, et pourquoi une
   condition vraie n'est pas synonyme de progression ;
4. une justification d'arrêt **sous hypothèses écrites** : invariant,
   variant, représentabilité ;
5. l'ordre d'exécution des trois clauses d'un `for` et son équivalence
   raisonnée avec un `while` ;
6. la structure quittée ou reprise par chaque transfert, y compris en
   présence d'un `switch` écrit à la main ;
7. pourquoi un `continue` peut sauter une progression manuelle.

**La réussite des seuls tests automatisés de C-A ne constitue pas cette
acquisition.**

---

## 9. Fiche de résultat

Consigner pour chaque scénario : environnement (OS, version VS Code, unité
d'indentation, LF/CRLF), texte avant, instruction exacte, cible affichée,
prévision écrite, résultat observé, diagnostic obtenu, annulation, et
statut **réussi / échoué / non effectué**.

Les avertissements de l'hôte `mutex already exists` et DEP0168/N-API se
consignent **séparément** de la réussite des scénarios : ne pas les
déclarer résolus à partir d'un rapport sans échec. Le blocage du §0 est à
qualifier avec eux.

### GCC manuel facultatif

Sur les seuls programmes sûrs des §2 à §4, après revue des types, formats
et valeurs :

```powershell
gcc -std=c17 -Wall -Wextra -Wpedantic -Wformat=2 recette_domaine3_while.c -o recette.exe
.\recette.exe
```

Une compilation manuelle réussie ici **ne clôt pas** la recette GCC
« Expressions et calculs », et n'est pas une intégration de GCC à C-A.

Nuance C17 à ne pas extrapoler : une boucle sans effet observable peut être
supposée terminante par l'implémentation (6.8.5). Le comportement d'un
programme qui semble s'arrêter n'est donc **pas** une expérience portable,
et un essai qui s'arrête n'est pas une preuve pour toutes les entrées.
