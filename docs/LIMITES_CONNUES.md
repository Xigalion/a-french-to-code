# Limites connues de C-A

**Pour qui :** quiconque s'apprête à utiliser C-A, ou à ouvrir un ticket.
À lire **avant** de conclure à un défaut.

> Ce document liste ce que C-A **ne fait pas**. Le miroir — ce qu'il fait,
> avec la sortie C exacte — est `docs/CATALOGUE.md`. **Tout ce qui ne figure
> pas au catalogue est refusé**, et c'est le périmètre, pas une panne.
>
> État au 16 novembre 2026, C-A 0.4.0.

---

## 1. La limite qui compte plus que toutes les autres

**C-A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements.**

```
Affecte la valeur 5 à inexistant.      →  inexistant = 5;      accepté, sans un mot
```

Aucune variable `inexistant` n'existe. C-A l'accepte parce qu'il est **sans
état d'une instruction à l'autre** : il ne relit pas votre document pour
savoir ce qui y est déclaré. Le compilateur, lui, refusera.

Conséquence à retenir : **une insertion acceptée n'est pas un programme
correct, et ne garantit même pas qu'il compile.** Dix programmes écrits par
C-A compilent et s'exécutent dans ce dépôt — c'est dix, pas tous.

Une exception, et une seule : **le placement**. Depuis le lot 26, une
instruction exécutable est refusée hors d'un corps de fonction
(`STATEMENT_AT_FILE_SCOPE`), et une définition de fonction est refusée à
l'intérieur d'une autre (`FUNCTION_DEFINITION_NESTED`). C-A lit alors les
accolades du document — c'est la seule famille de vérifications
contextuelles qu'il sait faire.

## 2. Ce que le langage couvert ne contient pas

| Absent | Détail |
|---|---|
| types | pas de `long`, `short`, `unsigned char`, `signed char`, `_Bool`. Les types sont `int`, `unsigned int`, `float`, `double`, `char`, `void` |
| `goto` | n'appartient à aucune notion des neuf domaines |
| `typedef` | sauf le **synonyme de structure** (`typedef struct Noeud Noeud;`) |
| énumérations, unions déclarées, champs de bits | non livrés |
| tableaux à plusieurs dimensions | non livrés |
| listes d'initialisation `{1, 2, 3}` | non livrées — **composables** élément par élément |
| dimension déduite `char s[] = "…"` | non livrée : la dimension est toujours écrite |
| affectation globale d'un tableau ou d'une chaîne | non livrée |
| pointeurs | **un seul niveau** d'indirection ; ni pointeur de fonction, ni `void *`, ni paramètre ou retour de type pointeur |
| arithmétique de pointeurs | **uniquement** `*(nom + décalage entier)`. Ni soustraction, ni `p - q`, ni `++`/`--` |
| bibliothèques | `stdio.h`, `stdlib.h`, `assert.h`, `limits.h` et les en-têtes locaux. Pas de `string.h`, `float.h`, `stddef.h`, ni `NULL` |
| préprocesseur | gardes d'en-tête seulement. Pas de macro à remplacement, ni `#if`/`#ifdef`, ni `#define X 1` |
| divers | `calloc`, `sizeof` sur une **expression**, `fputs`, `fread`, `fseek`, `errno`, `static_assert` |

## 3. Les trois profils d'expression, et ce que chacun ferme

C-A analyse les expressions avec **trois profils** aux capacités
différentes. La même sous-expression peut donc être acceptée dans une phrase
et refusée dans une autre : ce n'est pas une incohérence, c'est le profil.

| Profil | Phrases | Ferme |
|---|---|---|
| **entier** (gelé depuis le lot 6) | `le résultat de "…"`, `Retourne le résultat de "…"`, l'expression d'un aiguillage | l'indexation `t[i]`, les littéraux caractères, `&` et `*` unaires, les conversions |
| **numérique** | `le résultat numérique de "…"` | rien de ce qui précède ; accepte conversions, indexation, membres, pointeurs |
| **indice** | entre les guillemets d'une désignation d'élément | les littéraux caractères, `*p`, `&x` |

Exemple vécu, et c'est le piège le plus fréquent :

```
Affecte à x le résultat de "(double) 7 / 2".            →  refusé : C_KEYWORD_IDENTIFIER
Affecte à x le résultat numérique de "(double) 7 / 2".  →  x = (((double) 7) / 2);
```

Le profil entier ne connaît pas les conversions : il lit `double` comme un
nom, et refuse un mot-clé C17 comme nom.

## 4. La désignation d'élément n'est pas disponible partout

`l’élément "{indice}" de {tableau}` est accepté comme cible d'affectation,
d'affichage, et — depuis le lot 32 — comme objet d'un **champ de structure**.
Elle **n'est pas** acceptée :

| Phrase | État |
|---|---|
| `Lis un entier depuis le fichier f dans l’élément "i" de t.` | **non livrée** — lire dans un scalaire, puis affecter l'élément |
| `Écris la valeur de l’élément "i" de t dans le fichier f.` | **non livrée** — copier dans un scalaire, puis écrire |
| `Affecte à l’élément "i" de t le résultat de l’appel de f avec "…".` | **non livrée** — affecter à un scalaire, puis à l'élément |

Chacune se contourne en **une ligne de plus**. C'est documenté, mesuré, et
tenu par un test pour éviter de les croire livrées.

## 5. Autres limites de formulation

- **une phrase par ligne**, curseur sur une **ligne blanche** ;
- les **accents sont exigés** ; le point final est facultatif ; les mots fixes
  sont insensibles à la casse ;
- les blocs (`si`, boucles, fonctions, aiguillage, structure) sont créés
  **vides** : à l'utilisateur de les remplir ;
- **sortir d'un bloc** est un geste d'éditeur, pas une commande : se placer en
  fin de la dernière ligne du niveau voulu et appuyer sur `Entrée` ;
- aucune formulation n'affiche un **champ** avec `%c` : un champ de type
  `char` s'affiche en `%d`, comme un entier ;
- la **flèche** n'est pas offerte sur un élément : `promo[i]->x` exigerait un
  tableau de pointeurs, qu'aucune formulation ne déclare ;
- aucune commande ne **nomme** une limite (`INT_MAX` s'écrit dans une
  expression, comme un nom) : une commande ferait croire que C-A connaît les
  bornes de l'implémentation ;
- **aucun séparateur n'est ajouté** entre deux affichages. Deux `printf` de
  suite collent leurs sorties, et `Affiche un retour à la ligne.` est une
  phrase à part entière.

## 6. Ce que C-A ne fait pas par principe

| Non | Pourquoi |
|---|---|
| corriger votre phrase | un diagnostic explique ; il ne fournit pas la phrase correcte à recopier. L'effort de chercher fait partie de l'apprentissage |
| inventer une valeur, un nom, un type | « aucun ajout implicite » : si l'information manque, C-A le dit |
| insérer sans confirmation | aperçu, puis confirmation, puis insertion — jamais de modification automatique |
| toucher une autre ligne que celle visée | une insertion est **une** modification annulable |
| compléter, suggérer, deviner (IA) | hors du périmètre du modèle 1, et contraire à la règle précédente |
| trier, chercher, échanger à votre place | aucune commande d'algorithme n'existe : un tri s'**écrit** avec les boucles et les affectations du catalogue |

## 7. Paliers de liberté

Le **palier 1** (actuel) exige une formulation **précise**. Le palier 2
autorisera des formulations plus concises et des valeurs par défaut
documentées ; il n'est pas livré. Le palier 3 n'a aucune définition de
référence.

**Invariant :** compétence de programmation et liberté linguistique sont
**indépendantes**. Un palier ne réserve aucune capacité de programmation : le
palier 1 donne accès aux neuf domaines, il les fait seulement écrire plus
longuement.

## 8. Limites de l'outillage, pas du produit

- la suite hôte VS Code exige **VS Code déjà installé** et ne le télécharge
  pas ;
- trois gestes de la recette restent **irréductiblement manuels** : frappe
  physique de `Ctrl+K A`, composition IME, contrôle visuel du focus et du
  diff ;
- le dépôt ne contient **aucun compilateur**. Les journaux de compilation ont
  été produits avec GCC 16.2.0 (MinGW-W64 UCRT), installé hors du dépôt ;
- `scripts/differentiel.mjs` exige une **référence git** : c'est un outil, pas
  un test, et il n'est pas dans `npm test`.

## 9. Ce que les chiffres de ce dépôt ne prouvent pas

- que **tout** le C produit par C-A compile — dix programmes l'ont fait ;
- que le score de complétion des campagnes soit une note : c'est une **part
  de preuve**, et l'audit `docs/AUDIT_BAREME.md` montre que le barème mesure
  **deux** choses et non cinq ;
- que les 91 sondes de ce barème épuisent les neuf domaines : leur choix n'a
  jamais été validé par un tiers ;
- qu'une suite verte démontre la stabilité : huit passages hôte verts
  consécutifs montrent qu'un site identifié est corrigé, rien de plus.
