# Lot 24 — Structures de données — contrat et bilan

**Contrat rédigé puis exécuté le 15 novembre 2026**, en autonomie.
**Le domaine 8, « Algorithmes et structures de données », est complet.**

Chiffres réels : **3 527 tests Node réussis, 0 échec** (3 495 au lot 23).
**1 334 047 comparaisons différentielles**, **369 extensions**, **0
régression**. **97 tests hôte non exécutés.**

---

## 1. Le constat qui définit ce lot

Le domaine 8 — « conception, structures, recherche, tri, complexité » — ne
demande **presque aucune syntaxe nouvelle** : il se compose avec les
boucles, les conditions, les fonctions, les tableaux, les pointeurs et les
structures déjà livrés.

En écrivant une liste chaînée et un tri avec le catalogue du lot 23, trois
manques — et seulement trois — empêchaient réellement le domaine :

1. **Aucun champ pointeur.** Sans `struct Noeud *suivant;`, aucune
   structure chaînée n'est possible. C'était le manque bloquant.
2. **Aucun tableau de structures.** Le lecteur de type du lot 15
   n'acceptait que les scalaires.
3. **Aucun synonyme de type.** `typedef struct Noeud Noeud;` est la forme
   qui permet de nommer une structure avant de la définir.

Ce lot comble ces trois manques, et **rien d'autre**. Il n'ajoute ni
commande de tri, ni commande de recherche : une telle commande cacherait
exactement ce que le domaine enseigne.

---

## 2. Contrat

| Formulation française | Code C produit | Information |
|---|---|---|
| `Déclare le synonyme Noeud pour la structure Noeud.` | `typedef struct Noeud Noeud;` | TYPEDEF_IS_AN_ALIAS |
| `Ajoute un champ pointeur de type structure Noeud nommé suivant.` | `struct Noeud *suivant;` | POINTER_FIELD_OWNS_NOTHING |
| `Ajoute un champ pointeur de type int nommé donnees.` | `int *donnees;` | POINTER_FIELD_OWNS_NOTHING |
| `Déclare un tableau de type structure Point nommé t de dimension 10.` | `struct Point t[10];` | STRUCT_ARRAY_LAYOUT |

Le `*` reste contre le nom : la convention **D2** du lot 17 s'applique à
tous les déclarateurs du catalogue.

Un texte n'initialise toujours qu'un tableau de `char` : un tableau de
structures avec `avec le texte` est refusé (`STRING_REQUIRES_CHAR`).

### Informations

| Code | Fait énoncé |
|---|---|
| `TYPEDEF_IS_AN_ALIAS` | un second nom pour le **même** type, pas un type nouveau ; l'étiquette peut être nommée **avant** que la structure soit définie, ce qui permet à un champ de pointer vers elle |
| `POINTER_FIELD_OWNS_NOTHING` | une adresse, pas un objet ; la structure ne possède pas la mémoire visée et sa taille ne compte que le pointeur ; **rien n'est alloué ici** |
| `STRUCT_ARRAY_LAYOUT` | les objets eux-mêmes, contigus, chacun avec son remplissage ; `t[i].x` désigne un champ d'un élément, et **aucun des deux indices n'est vérifié** |

---

## 3. Ce que les tests démontrent du domaine

Quatre tests écrivent le domaine avec le catalogue, sans rien de nouveau :

- une **liste chaînée** complète, du synonyme au champ pointeur, avec
  document final exact ;
- une **recherche séquentielle** entière, huit instructions ;
- un **échange de deux éléments**, qui montre que C-A n'invente jamais la
  variable temporaire : l'étudiant la déclare ;
- un **parcours de liste chaînée** avec `courant->suivant`.

Et trois refus fixent la limite voulue : `Trie le tableau t.`,
`Cherche la valeur 5 dans le tableau t.` et
`Échange les éléments "i" et "j" de t.` n'existent pas, et ne doivent pas
exister.

---

## 4. Différentiel — 88 pertes, instruites et expliquées

| Référence | Comparaisons | Extensions | Régressions | Capacités perdues |
|---|---|---|---|---|
| lot 23 ((identifiant antérieur à la réécriture)) | 1 334 047 | 369 | **0** | **88** |

Répartition : 82 au stage `planPlacement`, 6 au stage `translate`.

**Cause.** `STRUCT_FIELD` a gagné un paramètre `pointer`. La **sortie
structurée** de `translate()` change donc pour tout
`Ajoute un champ …`, et le plan de placement l'embarque, d'où les 82.

**Vérifié, pas supposé.** J'ai comparé les deux moteurs sur treize entrées
touchées, en regardant ce qui compte :

    fragments C différents            : 0
    éditions de placement différentes : 0
    paramètres structurés différents   : 6

Le **C produit et les éditions de placement sont identiques**. Seule la
forme de l'objet `parameters` diffère, par l'ajout d'un champ.

**Ce que cela veut dire, et ce que cela ne veut pas dire.** Aucune
capacité utilisateur n'est perdue. Mais ajouter un champ aux paramètres
d'une intention publiée **est** observable pour tout consommateur de
`translate()` : c'est une extension de contrat, pas un détail interne.
L'hôte VS Code ne consomme que les fragments et les plans, donc rien ne
casse de ce côté.

**Dette consignée** : un lot qui enrichit les paramètres d'une intention
déjà publiée verra `--no-loss` se déclencher. La procédure est celle
suivie ici — comparer les fragments et les éditions, et non le JSON entier.

---

## 5. Fichiers

**Modifiés** : `src/structInstructions.ts` (champ pointeur, `TYPE_ALIAS`),
`src/arrayInstructions.ts` (type élément structure),
`src/translate.ts` (deux rendus réécrits, un ajouté),
`src/pedagogicalInformation.ts` (trois informations),
`scripts/differentiel.mjs`, `package.json`, `docs/CATALOGUE.md`,
`CLAUDE.md`.

**Créés** : `test/dataStructures.test.mjs` (32 tests), ce document.

**Non modifiés** : `expressionCore.ts` et les quatre profils,
`planPlacement.ts`, tous les reconnaisseurs contextuels, les instantanés
de compatibilité, et tout `extension/`. **Aucun test historique adapté.**

---

## 6. Limites connues

- Ni tableau de pointeurs, ni pointeur de tableau, ni double indirection
  dans un champ.
- Synonyme pour une **structure** seulement : ni `typedef` d'un scalaire,
  ni d'un pointeur, ni d'une fonction.
- Aucune commande de tri, de recherche ou d'échange — **par construction**.
- Aucune vérification de cohérence : un champ pointeur vers une structure
  inexistante, un synonyme d'une structure jamais définie, un tableau
  d'une structure inconnue sont tous traduits. Trois tests le fixent.
- Aucune information de complexité : C-A ne lit pas le document et ne peut
  rien dire du coût d'un algorithme. Le dire serait inventer.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; message `UNSUPPORTED_HEADER` sous-estimé (lot 21 §2) ;
exercice intégrateur final.
