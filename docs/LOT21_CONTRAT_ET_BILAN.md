# Lot 21 — `sizeof` et mémoire dynamique — contrat et bilan

**Contrat rédigé puis exécuté le 15 novembre 2026**, en autonomie.
**Le domaine 6, « Structures et mémoire dynamique », est complet.**

Chiffres réels : **3 357 tests Node réussis, 0 échec** (3 297 au lot 20).
**1 332 640 comparaisons différentielles**, **436 extensions**, **0
régression**, **0 capacité perdue**. **97 tests hôte non exécutés.**

---

## 1. Contrat

| Formulation française | Code C produit |
|---|---|
| `Inclue la bibliothèque stdlib.h.` | `#include <stdlib.h>` |
| `Affiche la taille du type int.` | `printf("%zu", sizeof(int));` |
| `Affiche la taille du type structure Point.` | `printf("%zu", sizeof(struct Point));` |
| `Affecte à n la taille du type double.` | `n = sizeof(double);` |
| `Affecte à p l'allocation de 10 éléments de type int.` | `p = malloc(10 * sizeof(int));` |
| `Affecte à q la réallocation de p pour 20 éléments de type int.` | `q = realloc(p, 20 * sizeof(int));` |
| `Libère la mémoire pointée par p.` | `free(p);` |

« du type » et « de type » sont les mêmes mots en français : les deux se
lisent. Le singulier « 1 élément » est accepté comme le pluriel.

**Le produit est écrit, jamais replié.** `4 * sizeof(int)` reste tel quel :
l'étudiant doit voir séparément le nombre d'éléments et la taille d'un
élément, c'est l'objet de la leçon. Un test vérifie que `16` n'apparaît
pas.

**Aucune conversion n'est ajoutée** au résultat de `malloc` : C17 n'en a
pas besoin, et en ajouter une masquerait ce fait.

Types mesurés : les cinq scalaires déjà enseignés, ou `structure {tag}`.
Ni type pointeur, ni type tableau : `sizeof` sur ceux-là demanderait une
grammaire de déclarateur que ce lot n'ouvre pas.

Nombre d'éléments : un entier décimal positif **ou un nom**. C-A ne résout
aucun symbole ; rien ne vérifie qu'un nom désigne un entier positif.

### Aucune capacité du noyau n'est modifiée

`sizeof` et les appels d'allocation vivent entièrement dans les
enveloppes. Les quatre profils d'expression sont inchangés, comme au lot
19.

---

## 2. Le contrat gelé de l'inclusion, et ce que j'ai refusé de faire

`Inclue la bibliothèque {en-tête}.` est figé par les instantanés de
compatibilité des lots 4 et 5 : le genre `INCLUDE_STDIO`, ses paramètres
vides, sa sortie, **et le message de `UNSUPPORTED_HEADER`**.

J'ai d'abord élargi la règle historique à `stdlib.h` et réécrit le
message. Huit tests d'instantané ont échoué. J'ai alors tenté de mettre à
jour la chaîne dans les instantanés — **l'action a été refusée**, et c'est
la bonne décision : `CLAUDE.md` dit « Ne jamais les régénérer pour faire
passer un test ».

Voie retenue : `stdlib.h` est intercepté par une **branche propre au lot
21**, avant que la règle historique ne soit atteinte. La règle et son
message sont donc **strictement identiques**, et un test le vérifie champ
par champ.

**Incohérence connue, assumée, et à trancher par un humain.** Le message
gelé dit « Seul l'en-tête stdio.h … est pris en charge » alors que
`stdlib.h` est désormais accepté. Il est donc **sous-estimé** pour qui
écrit `Inclue la bibliothèque string.h.`. Corriger ce message demande
d'amender un contrat gelé : c'est une décision de périmètre, pas un
détail technique, et je la laisse ouverte plutôt que de la prendre seul.

---

## 3. `NULL` : D1 réexaminée, et laissée ouverte

D1 reportait `NULL` et `stddef.h`, en disant qu'ils seraient réexaminés
« dans les lots suivants du modèle 1 ».

Constat : `stdlib.h` **déclare déjà `NULL`**, et `NULL` n'est pas un
mot-clé C17. `Crée un bloc si "p == NULL".` produit donc déjà
`if (p == NULL) { … }`, sans qu'aucune formulation ne l'introduise.

Je n'ai donc **rien ajouté** : ni formulation dédiée, ni terme réservé
dans les profils. L'information `ALLOCATION_CAN_FAIL` **nomme la phrase à
écrire** sans l'écrire, ce qui respecte « diagnostic ≠ correction ». Un
test fixe ce comportement et la documentation le dit.

`stddef.h` reste refusé : rien dans ce lot ne l'exige.

---

## 4. Informations pédagogiques

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `HEADER_DECLARES_ONLY` | `stdlib.h` | déclare `malloc`, `realloc`, `free` et `NULL` ; aucune allocation ici, et aucun en-tête jamais ajouté |
| `SIZEOF_IS_BYTES` | `sizeof` et toute allocation | taille en **octets**, de type `size_t`, format `%zu` ; ni un nombre d'éléments, ni la somme des champs |
| `ALLOCATION_CAN_FAIL` | allocation et réallocation | `malloc` renvoie `NULL` ; **C-A n'ajoute aucun test**, et nomme la phrase à écrire |
| `ALLOCATION_NOT_INITIALIZED` | allocation seule | la mémoire obtenue n'a aucune valeur ; la lire avant de l'écrire est indéfini |
| `REALLOC_MAY_MOVE` | réallocation seule | le bloc peut **se déplacer** ; sur échec `realloc` renvoie `NULL` sans libérer, donc écraser le pointeur d'origine **perdrait le bloc** |
| `FREE_ONCE` | libération | une fois et une seule ; double libération et usage après libération sont indéfinis ; **C-A ne suit aucune durée de vie** |

`ALLOCATION_NOT_INITIALIZED` n'est **pas** émise sur une réallocation :
`realloc` conserve le contenu existant, et l'affirmer serait faux. Un test
vérifie cette absence.

---

## 5. Fichiers

**Créés** : `src/memoryInstructions.ts`, `test/memory.test.mjs` (60
tests), ce document.

**Modifiés** : `src/translate.ts` (union, six rendus, aiguillage ; **la
règle d'inclusion est restée intacte**), `src/pedagogicalInformation.ts`,
`scripts/differentiel.mjs`, `package.json`, `docs/CATALOGUE.md`,
`CLAUDE.md`.

**Non modifiés** : `expressionCore.ts` et les quatre profils,
`planPlacement.ts`, tous les reconnaisseurs contextuels, les instantanés
de compatibilité, et tout `extension/`. **Aucun test historique adapté.**

---

## 6. Limites connues

- Ni `calloc`, ni `aligned_alloc`, ni allocation à durée de vie
  automatique variable. `calloc` écrit comme un appel ordinaire produit
  `calloc(10, 4);` : C-A ne connaît pas ce nom, n'ajoute pas d'en-tête et
  ne promet rien. Un test fixe ce comportement réel.
- `sizeof` sur une **expression** (`sizeof p`) n'existe pas : seuls les
  types sont mesurés.
- Aucune vérification de durée de vie, de cohérence
  allocation/libération, ni de fuite. `Libère la mémoire pointée par
  inconnu.` est traduit et plaçable ; trois tests le fixent.
- `0 éléments` est accepté : c'est du C17 légal au résultat défini par
  l'implémentation, et il est traduit tel quel.
- Le message de `UNSUPPORTED_HEADER` sous-estime ce qui est pris en
  charge, voir §2.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; exercice intégrateur final.
