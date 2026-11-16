# Exercice de clôture — gestion des notes d'une promotion

**Pour qui :** le fondateur, pour clore la validation technique de la V1.

> Tout ce qui est chiffré ici a été **exécuté**. Les sorties attendues sont
> calculées **à la main** avant exécution, et les scripts échouent si la
> sortie diffère : une exécution qui se termine en code 0 ne prouve pas qu'un
> programme calcule juste.
>
> Date : 16 novembre 2026. C-A 0.4.0 + **lot 32**.
> Dossiers : `exercice/promotion/`.

---

## 1. L'exercice

Un programme de gestion des notes d'une promotion de trois étudiants, écrit
**comme un programmeur C l'écrirait** pour ce domaine, et non pour contourner
les limites de C-A. C'est la condition pour que l'exercice **trouve** quelque
chose.

Ce qu'il mobilise, et où :

| Domaine | Dans le programme |
|---|---|
| fondations | trois en-têtes, `main`, déclarations, affichages, retour |
| calculs | somme de trois notes, moyenne en `double` par conversion, format `%.2f` |
| décisions | chaîne `si / sinon si / sinon` sur la moyenne, aiguillage sur un **caractère** de mention |
| boucles | `pour` (×4), `tant que`, **à test final**, et deux boucles **imbriquées** |
| fonctions | deux définitions, trois et deux paramètres, retour `int` et retour `double`, trois appels |
| tableaux | trois tableaux, indices **calculés** (`notes[i * 3 + 2]`), chaîne initialisée |
| structures | une structure, deux champs, un **tableau de structures**, lecture et écriture de champs |
| classement | **tri à bulles** décroissant avec échange par variable temporaire |
| fichiers et erreurs | lecture `fscanf`, test de **fin de fichier**, écriture `fprintf`, deux `fclose`, deux **assertions** |

## 2. Ce que l'exercice a trouvé

À la première exécution, **3 phrases sur 101 ont été refusées**, et ce n'est
pas un accident de rédaction : ce sont les trois seules choses que ce
programme demandait et que C-A ne savait pas faire.

| Refus | Verdict |
|---|---|
| `Affecte au champ total de l’élément "i" de promo le résultat numérique de "total".` | **défaut bloquant** |
| `Affecte au champ initiale de l’élément "i" de promo le résultat numérique de "initiales[i]".` | même défaut |
| `Affiche le caractère du champ initiale de l’élément "meilleur" de promo.` | **limitation documentée** (aucun champ ne s'affiche en `%c`) |

Les deux premiers sont **une seule** lacune, et elle était grave :
`promo[i].total` se **lisait** depuis le lot 20 — dans une condition, dans un
argument d'appel — mais ne pouvait pas être **écrit**. Un tableau de
structures était donc déclarable depuis le lot 24 et **jamais remplissable**.

Corrigé par le **lot 32** (`docs/LOT32_CONTRAT_ET_BILAN.md`) : une troisième
forme d'objet pour les quatre enveloppes existantes, **aucune intention
nouvelle**, 1 335 559 comparaisons différentielles, **0 régression**.

## 3. Résultats vérifiés

### 3.1 Le C brut, écrit par le moteur

| | |
|---|---|
| instructions insérées | **101** |
| refus après le lot 32 | **0** |
| gestes d'éditeur (touche `Entrée`) | **17** |
| informations pédagogiques émises | **92** |
| avertissements de calcul | 0 |
| **retouches manuelles** | **0** |

Journal phrase par phrase : `exercice/promotion/journal/production.md`.

### 3.2 Compilation et exécution

GCC 16.2.0 (MinGW-W64 UCRT), `-std=c17 -Wall -Wextra -pedantic`.

| Vérification | Résultat |
|---|---|
| compilation | **code 0**, `stderr` **vide** — aucun avertissement |
| exécution | **code 0** |
| sortie | `12.56` `passable` `48 36 29` `66` `7` `3` `8` — **conforme au calcul fait à la main** |
| fichier écrit | `resultat.txt` = `48 36 29 ` — conforme |
| `sizeof(struct Etudiant)` | 8 octets, dépendant de l'implémentation : **vérifié comme un nombre**, pas comme une valeur |
| **chemin d'erreur** | `notes.txt` retiré → l'assertion **arrête** le programme (`Assertion failed: f != 0`), code de sortie non nul |

Ce dernier point est le seul qui vérifie un **contrôle d'erreur** : sans le
fichier de données, le programme échoue **bruyamment** au lieu de calculer
n'importe quoi. Journal : `exercice/promotion/journal/compilation.txt`.

Chaque valeur est justifiée : `12.56` est `113 / 9` où `113 = 36 + 48 + 29`,
`48 36 29` est le classement décroissant, `66` est le code ASCII de `B` —
l'étudiant de tête — affiché en `%d` faute de format `%c` pour un champ, et
`7` est le nombre de notes supérieures ou égales à 10.

### 3.3 Dans l'interface réelle de VS Code

    node scripts/dictee-vscode.mjs cloture

| | |
|---|---|
| instructions insérées **par l'IHM** | **101** |
| refus | **0** |
| C produit **identique** à celui du moteur | **OUI**, octet pour octet |
| compilation de ce fichier-là | **code 0**, aucun avertissement, exécution conforme |

C'est la vérification qui manquait à toutes les campagnes : elles prouvaient
le **moteur**. Celle-ci prouve que **l'interface écrit la même chose**, sans
qu'une seule ligne de C ait été tapée. Procédure et limites :
`docs/TEST_VSCODE_DICTEE.md`.

## 4. Tests complémentaires

L'exercice emploie **47** des 84 intentions du catalogue. Les 37 autres sont
couvertes par quatre programmes complémentaires, construits uniquement pour
cela (`exercice/promotion/complements/`).

| Programme | Instructions | Ce qu'il couvre | Sortie |
|---|---|---|---|
| `pointeurs.c` | 39 | pointeurs, adresse, déréférencement, `malloc`/`realloc`/`free`, `sizeof`, constante, `limits.h` | `7 3 8 100 2147 11 1.50` |
| `caracteres.c` | 51 | caractères, éléments, chaîne **lue** par `fgets`, structure et flèche, aiguillage entier, `break`, `continue`, fonction `void` | `ok 5 A 5 Z 0? bonjour` |
| `calcul.h` | 4 | protection d'en-tête, prototype, liaison externe | — |
| `module.c` | 14 | en-tête **local**, définition, compteur partagé | `42 1` |

Les quatre compilent en **code 0 sans aucun avertissement**, les trois
exécutables s'exécutent en code 0, et **chaque sortie est conforme au calcul
fait à la main**. La **garde d'en-tête** est vérifiée sous **double
inclusion** : code 0.

### 4.1 Couverture atteinte

| | |
|---|---|
| intentions du catalogue | **84** |
| employées par la clôture (exercice + compléments) | **84** |
| jamais employées par aucune campagne ni cahier | **0** |

`exercice/promotion/journal/couverture.md`, recalculable par
`node --experimental-strip-types exercice/promotion/couverture.mjs`.

**Ce que cette couverture veut dire, et seulement cela** : chacune des 84
intentions apparaît dans un programme **compilé et exécuté**. Elle ne dit
rien de la justesse sémantique des programmes possibles, ni de la couverture
des **compétences** du parcours — ce que mesure le barème des 91 sondes, et
que cet exercice **ne recalcule pas**.

### 4.2 Un refus trouvé par les compléments

`Crée un aiguillage sur "t[0]".` est **refusé** : l'expression contrôlée d'un
aiguillage est analysée par le **profil entier**, gelé depuis le lot 6, où
l'indexation est fermée. Le moteur a raison, la limite est écrite, et le
complément emploie `Crée un aiguillage sur "i".`. Aucune correction : ce
serait rouvrir un profil gelé pour un confort.

## 5. Classement demandé par les critères de clôture

### 5.1 Défauts bloquants

| Défaut | État |
|---|---|
| champ d'un élément de tableau de structures **non assignable** | **corrigé** (lot 32), vérifié par l'exercice, le différentiel et 10 tests |

**Aucun autre défaut bloquant n'a été trouvé.** C'est une information, pas une
preuve d'absence : un exercice trouve ce qu'il touche.

### 5.2 Limitations pédagogiques documentées

Inchangées, assumées, et toutes dans `docs/LIMITES_CONNUES.md` :

| Limitation | Contournement |
|---|---|
| aucun champ ne s'affiche en `%c` | `%d` ; un caractère **est** un entier, et c'est la leçon |
| la désignation d'élément n'est pas acceptée en cible de lecture/écriture de fichier, ni d'un résultat d'appel | une ligne de plus, par un scalaire intermédiaire |
| profil entier fermé à l'indexation (aiguillage, `le résultat de`) | `le résultat numérique de`, ou une variable intermédiaire |
| liste d'initialisation `{1, 2, 3}` | élément par élément |
| pas de tri, de recherche ni d'échange fournis | ils s'**écrivent** : le tri à bulles de l'exercice le prouve |
| aucun séparateur d'affichage ajouté | `Affiche un retour à la ligne.` |

### 5.3 Compétences non testées

| Non testé | Pourquoi |
|---|---|
| **plateformes autres que Windows** | ni macOS ni Linux n'ont jamais exécuté la suite hôte. Le raccourci `Cmd+K A` n'a **jamais** été essayé |
| autres compilateurs | ni `clang`, ni MSVC, ni WSL. **Un seul** compilateur, une seule version |
| documents longs, sessions longues | aucun test au-delà de ~130 instructions dans un fichier |
| saisie par **IME**, dispositions de clavier non françaises | irréductiblement manuel |
| les 2 sondes « défaut de mesure » du barème de campagne 3 | laissées en place **volontairement** pour que les campagnes restent comparables |
| la justesse sémantique du C produit en général | hors de portée : C-A ne vérifie ni symboles, ni types, ni bornes |

### 5.4 À vérifier manuellement dans VS Code

Trois gestes, et eux seuls, restent à faire par une main humaine :

1. la **frappe physique** de `Ctrl+K` puis `A` ;
2. la **composition IME** et la disposition du clavier ;
3. le **contrôle visuel** du focus, de l'aperçu et du diff.

La dictée automatique couvre tout le reste du chemin saisie → aperçu →
confirmation → insertion. Mode opératoire manuel :
`docs/TEST_VSCODE_DICTEE.md` §4.

## 6. Ce que cet exercice ne prouve pas

- qu'il n'y a **plus** de défaut bloquant : il y en avait un, trouvé par un
  seul programme ; un autre programme en trouvera peut-être un autre ;
- que la **couverture 84/84** soit une couverture des compétences : c'est une
  couverture des **intentions**, et les deux mesures ne se confondent pas ;
- que le barème historique doive bouger. Il **ne bouge pas** : 93,9 % reste le
  score de la campagne 3, et aucune sonde n'a été modifiée pour gagner un
  point. Chercher 100 % du barème aurait demandé de changer l'instrument, ce
  que la consigne interdit et que le bon sens déconseille ;
- qu'une dictée verte dise quelque chose de la **lisibilité** du diff ou du
  confort de l'outil. Cela, seul un test utilisateur le dira.
