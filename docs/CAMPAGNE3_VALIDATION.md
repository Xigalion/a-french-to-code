# Campagne 3 — élargissement des preuves

> Les campagnes 1 et 2 sont **intactes** : `exercice/` et
> `exercice/campagne2/`. Leurs scores — **81,7 %** et **83,7 %** — ne sont
> ni recalculés ni modifiés. La campagne 3 vit dans `exercice/campagne3/`.
>
> Date : 16 novembre 2026. Corrections validées : lots 30 et 31.
> Audit du barème : `docs/AUDIT_BAREME.md`, produit séparément.

---

## 1. Ce que la campagne 3 ajoute

La campagne 2 laissait **19 compétences sans aucune preuve de compilation**.
Elles se traduisaient et se plaçaient, mais aucun programme ne les employait.
Le score de 83,7 % ne les comptait donc pas, et la sensibilité annonçait
93,6 % si elles étaient exercées.

La campagne 3 les exerce, par **quatre programmes indépendants du carnet de
notes**, et mesure **93,9 %** — à 0,3 point de la prédiction.

| | Campagne 1 | Campagne 2 | Campagne 3 |
|---|---|---|---|
| **Complétion pondérée** | 81,7 % | 83,7 % | **93,9 %** |
| fondamentale (×3) | 85,9 % | 88,6 % | **93,2 %** |
| structurante (×2) | 86,7 % | 86,7 % | **97,2 %** |
| complémentaire (×1) | 69,3 % | 74,4 % | **88,3 %** |
| compétences **vérifiées** | 65 | 67 | **87** |
| **sans preuve de compilation** | 19 | 19 | **0** |
| refus attendu obtenu | 1 | 1 | 1 |
| **bloquées** | 6 | 4 | **3** |

`87 + 0 + 1 + 3 = 91`.

## 2. Les quatre programmes

Aucun ne ressemble au carnet de notes, et aucun n'a été retouché à la main :
**le C compilé est exactement celui de `campagne3/ca/`.**

| Programme | Ce qu'il exerce | Sortie |
|---|---|---|
| `classement.c` | cibles 1 à 15 : initialisation à la déclaration, priorités, hexadécimal, `sinon si`, `sinon`, `do while`, `for`, `break`, `continue`, étiquette caractère, type et littéral caractère, affichage caractère, affichage d'élément, déréférencement en écriture | `1a` `moyen` `3` `023` `B` `7` `5` |
| `inventaire.c` | cibles 16, 17 et 22 : variable de type structure, réallocation, affectation de caractère à un champ | `3` `67` `9` |
| `journal.c` | cibles 18 et 19 : lecture d'entier, fin de fichier | `42` `fin` |
| `texte.c` | cibles 20 et 21 : définition de fonction interne, lecture de chaîne bornée | `bonjour` `16` |

**GCC 16.2.0, `-std=c17 -Wall -Wextra -pedantic` : quatre fois code de sortie
0, et ZERO avertissement.** Quatre exécutions, code 0. Journal :
`exercice/campagne3/journal/compilation.txt`.

### Les sorties ne sont pas seulement présentes, elles sont expliquées

`exercice/campagne3/journal/verifications.txt` justifie chaque valeur. Deux
exemples, parce qu'ils démontrent plus que « ça tourne » :

- `1a` : `20 + 3 * 2` vaut 26, et `1a` est 26 en hexadécimal. Si la priorité
  du produit n'était pas respectée, le résultat serait `(20 + 3) * 2 = 46`,
  soit `2e`. La sortie **prouve** la priorité ;
- `023` : la boucle `for` de 0 à 4 saute `j = 1` par `continue` et s'arrête à
  `j = 4` par `break`. La sortie prouve les deux transferts d'un coup ;
- `67` : le champ `initiale` vaut `'C'`, affiché avec `%d`. La sortie prouve
  l'affectation **et** la leçon `CHARACTER_IS_INTEGER`.

## 3. Les corrections : lots 30 et 31

Étiquette `lots-30-31`.

### 3.1 Intentions déclarées mais inaccessibles — audit complet

Deux méthodes croisées : recherche des sites de construction dans `src/`, et
traduction de **toutes** les lignes du catalogue. Une seule intention morte :
`MEMBER_ASSIGN_CHAR`, déclarée au lot 20, rendue par `translate.ts`, et
construite par aucun analyseur.

Elle est désormais atteignable :

    Affecte le caractère 'A' au champ initiale de e.   →   e.initiale = 'A';

Le littéral est lu dans la **source brute** et non dans les jetons, parce que
`' '` contient une espace que la tokenisation couperait en deux.

Le test du lot 26 qui interdisait de la présenter comme disponible est
remplacé par une **garde générale** : aucun genre déclaré ne doit être
inatteignable. Un lot futur qui en déclare un sans l'exposer échoue.

### 3.2 Arithmétique de pointeur — dite, pas vérifiée

`POINTER_ARITHMETIC_ABSENT`, information passive posée à la **déclaration**
d'un pointeur — le seul endroit où C-A sait qu'il s'agit d'un pointeur.

**La lacune n'est pas refermée, et le dire est le point.** C-A est sans état
d'une instruction à l'autre : dans `Affecte à p le résultat numérique de
"p + 1".`, rien ne lui dit que `p` est un pointeur. Prétendre le détecter
serait simuler une vérification mémoire, ce que la décision interdit. Un test
vérifie que `p + 1` et `p - q` restent acceptés **sans** avertissement.

### 3.3 Redondance : mesurée, pas supposée

| Mesure | Résultat |
|---|---|
| codes répétés sur une même instruction | **0** |
| messages identiques sur une même instruction | **0** |
| paires toujours solidaires | 2 blocs : `MEMBER_ACCESS_FORM + MEMBER_NOT_CHECKED` (11×), et le quatuor du lot 18 (4×) |

**Il n'y a aucune redondance au sens strict.** Je n'ai donc pas fusionné de
messages pour baisser un compte : ce serait cosmétique et perdrait des leçons
distinctes. Une seule réduction réelle était justifiée — la clause « C-A ne
vérifie ni les bornes, ni la validité de l'adresse formée » était dite **deux
fois** dans le bloc du lot 18 ; elle l'est maintenant une seule, par le
message dont c'est le sujet.

Volume après les lots 30 et 31 : **1,41 information par phrase** du
catalogue, contre 1,39 avant. Le point ouvert n° 8 reste ouvert, et c'est
l'arbitrage du fondateur.

### 3.4 Lot 31 — deux lacunes qui se tenaient

**Définition de fonction interne.** Le lot 23 avait livré le *prototype*
interne sans la définition : on pouvait déclarer une fonction à liaison
interne sans pouvoir l'écrire, donc la liaison interne était inutilisable.

    Crée une fonction interne nommée aide qui retourne un int.
      →  static int aide(void) { … }

**Et un vrai défaut exposé au passage** : `static int f(void)` était lu comme
un type de retour « static int », non pris en charge, donc un `return` y était
refusé. La capacité aurait été livrée à moitié. Les spécificateurs de classe
de stockage sont désormais écartés du type ; le message de diagnostic garde ce
que l'auteur a écrit. Ce défaut touchait aussi le C **écrit à la main**, en
silence, depuis toujours.

**Lecture de chaîne bornée.**

    Lis une chaîne de dimension 32 depuis le fichier f dans s.
      →  fgets(s, 32, f);

`fgets` plutôt que `fscanf("%s")`, qui n'a aucune borne. La borne est
**écrite**, jamais déduite : C-A ne connaît pas la dimension du tableau de
destination, et un test vérifie qu'une borne de 9999 sur un tableau de 8 est
acceptée **sans un mot**.

### 3.5 Différentiel

Contre `campagne-2` : **1 334 965 comparaisons**, 415 extensions approuvées,
**0 régression**.

`--no-loss` a signalé 176 entrées. Auditées par la procédure du lot 24 —
comparer les **fragments** et les **éditions de placement**, pas le JSON — sur
391 entrées distinctes :

| | |
|---|---|
| refus devenus acceptations | **17** |
| fragment **et** édition identiques | **351** |
| fragments différents | **0** |
| éditions de placement différentes | **0** |
| codes de refus changés | 23, **tous** vers un code plus précis |

Le corpus différentiel a été étendu aux trois capacités neuves : sans cela, il
prouvait l'absence de régression sans couvrir ce qui était livré.

## 4. Stabilité des tests hôte — cause trouvée

L'instabilité de la campagne 2 n'était pas un mystère de minutage à subir.

**Cause** : le scénario `lot 9 : IF imbriqués` était le **seul** des six sites
qui posent `editor.options` à attendre par un **délai fixe** de 100 ms, là où
tous ses voisins attendent la condition réelle. Si l'éditeur n'avait pas
appliqué `tabSize` à temps, la session capturait la mauvaise signature
d'indentation et le document attendu ne correspondait plus.

**Correction** : l'attente de l'état, comme ses voisins. Ce n'est pas une
nouvelle tentative, c'est l'attente de ce qui doit être vrai.

**Trois passages consécutifs après correction, puis trois après les lots 30 et
31** : journaux `hote-stabilite.txt` et `hote-stabilite-final.txt`, rapports
individuels conservés.

**Ce que cela ne démontre pas.** Six passages verts ne prouvent pas l'absence
d'instabilité ; ils montrent qu'un site identifié a été corrigé et que rien
d'autre ne s'est manifesté. Trois gestes restent irréductiblement manuels :
touches physiques, composition IME, contrôle visuel du focus et du diff.

## 5. Les trois blocages restants, classés

| Blocage | Classement | Pourquoi |
|---|---|---|
| **Initialiseur entre accolades** `{1, 2, 3}` | **limitation fonctionnelle acceptable et documentée** | composable : chaque élément s'affecte séparément, et c'est le choix pédagogique du projet depuis la décision D6. Rien n'est impossible, seulement plus long. |
| **Macro de limite par une commande** | **défaut de validation, pas du produit** | aucune commande ne nomme une limite, **volontairement** : elle ferait croire que C-A connaît les bornes. Les macros s'écrivent dans une expression, et la campagne 3 le prouve — `2147483647` imprimé en campagne 2. La sonde mesure l'absence d'une commande que le projet refuse d'écrire. |
| **Lecture de chaîne sans borne** | **défaut de validation, pas du produit** | la sonde emploie `Lis une chaîne depuis le fichier f dans s.`, **sans** dimension. Cette forme n'a jamais été livrée et ne le sera pas : une lecture sans borne déborde. Le lot 31 a livré la forme **bornée**, compilée et exécutée dans `texte.c`. |

**Aucun des trois n'est bloquant pour une V1 utilisable.** Les deux derniers
sont des défauts de **mesure** : la sonde ne teste pas ce que son libellé
annonce. Je ne les ai **pas** corrigés en changeant la sonde — cela aurait
modifié l'instrument de mesure et rendu les trois campagnes incomparables.
Ils sont signalés dans `docs/AUDIT_BAREME.md`, et le score historique reste
tel quel.

Si les deux sondes nommaient les formes réellement livrées, la complétion
serait de **95,9 %** au lieu de 93,9 % — c'est la ligne « si les blocages
étaient levés » de la sensibilité.

### Les deux blocages levés depuis la campagne 2

- **définition `static`** : livrée (lot 31), compilée dans `texte.c` ;
- **lecture de chaîne** : livrée sous sa forme bornée (lot 31), compilée dans
  `texte.c`.

## 6. Ce que la campagne 3 ne prouve toujours pas

- que **tout** le C produit par C-A compile. Cinq programmes au total l'ont
  fait — un en campagne 2, quatre en campagne 3. C'est cinq, pas tous ;
- que C-A garantisse un programme correct. Il refuse une instruction hors
  d'une fonction ; il ne vérifie **ni** symboles, **ni** types, **ni** bornes,
  **ni** inclusions, **ni** dépassements, et chacun de ces points est tenu par
  un test nommé ;
- que les 91 sondes épuisent les neuf domaines. La liste est la mienne ;
- que 93,9 % soit un seuil de livraison. L'audit du barème montre qu'il
  mesure **deux** choses et non cinq.
