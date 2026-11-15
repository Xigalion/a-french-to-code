# Lot 23 — Modularité : en-têtes, prototypes et liaison — contrat et bilan

**Contrat rédigé puis exécuté le 15 novembre 2026**, en autonomie.
**Le domaine 7, « Fichiers et modularité », est complet.**

Chiffres réels : **3 495 tests Node réussis, 0 échec** (3 416 au lot 22).
**1 333 717 comparaisons différentielles**, **476 extensions**, **0
régression**, **0 capacité perdue**. **97 tests hôte non exécutés.**

---

## 1. Contrat

| Formulation française | Code C produit |
|---|---|
| `Inclue l'en-tête "calcul.h".` | `#include "calcul.h"` |
| `Ouvre la protection d'en-tête nommée CALCUL_H.` | `#ifndef CALCUL_H` + `#define CALCUL_H` |
| `Ferme la protection d'en-tête.` | `#endif` |
| `Déclare le prototype d'une fonction nommée somme qui retourne un int et prend un int nommé a.` | `int somme(int a);` |
| `Déclare le prototype d'une fonction interne nommée aide qui retourne un int.` | `static int aide(void);` |
| `Déclare la variable externe de type int nommée compteur.` | `extern int compteur;` |
| `Déclare la variable interne de type double nommée total.` | `static double total;` |

**Une garde est deux instructions, pas un bloc.** L'ouverture et la
fermeture s'écrivent séparément, et l'étudiant voit qu'il s'agit de deux
directives distinctes. C'est aussi la raison pour laquelle l'information
d'ouverture **nomme** la phrase de fermeture : l'oublier casse la
compilation.

**Les deux formes d'inclusion restent distinctes.** Guillemets et
chevrons désignent deux règles de recherche différentes, et aucune phrase
n'est réécrite en l'autre. La règle du lot 4 garde sa grammaire et son
message gelés ; un test le vérifie.

Un nom de protection s'écrit **en majuscules ASCII** : C-A l'exige, parce
qu'un nom en minuscules entrerait en collision avec les identifiants
ordinaires.

Un chemin d'en-tête local a une grammaire **volontairement étroite** :
pas d'espace, pas d'échappement, pas de délimiteur interne. C'est ce que
`#include "…"` peut contenir sans que le reconnaisseur de placement perde
sa prise sur la ligne.

---

## 2. Le prototype réutilise la queue de phrase du lot 12

`FUNC_PROTOTYPE` a été ajouté **dans `functionInstructions.ts`**, et non
dans un module séparé, précisément pour que la signature soit analysée par
**le même code** que la définition. Les deux ne peuvent donc pas diverger.

Un test le vérifie structurellement : pour une même queue de phrase, le
prototype est l'en-tête de la définition avec un point-virgule au lieu du
corps. Et les diagnostics du lot 12 — `UNSUPPORTED_NUMERIC_TYPE`,
`INVALID_IDENTIFIER`, `DUPLICATE_PARAMETER_NAME`, `TOO_MANY_PARAMETERS` —
s'appliquent sans être réécrits.

---

## 3. L'élargissement des directives : étroit, et motivé

`placementLexical.ts` n'acceptait que `#include` avant la ligne cible.
Sans élargissement, **rien ne pouvait être placé à l'intérieur d'une
garde**, ce qui rendait le lot inutile.

La grammaire acceptée a donc été élargie à **trois formes, et rien de
plus** :

    #ifndef IDENT
    #define IDENT        (sans liste de remplacement)
    #endif

**`#define X 1` reste refusé, et c'est une propriété de sûreté, pas un
oubli.** C-A n'expanse aucune macro : il ne doit pas lire du code dont une
macro pourrait avoir changé les jetons. Un test énumère douze directives
qui restent refusées, dont `#define X 1`, `#define X (1)`, `#define X Y`,
`#if`, `#ifdef`, `#else`, `#elif`, `#undef`, `#pragma`, et les formes
malformées `#ifndef`, `#endif X`, `#ifndef 1X`.

Deux entrées ont quitté la liste des directives refusées de
`test/placement.test.mjs` — `#ifndef X` et `#endif` — avec un commentaire
sur place, et cinq refus nouveaux ont été ajoutés à la même liste.

**Limite assumée** : `#ifndef` peut désactiver une région. C-A n'évalue
aucune condition de préprocesseur et insère du texte que la région soit
active ou non. L'information `GUARD_NOT_EVALUATED` le dit explicitement.

---

## 4. Informations pédagogiques

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `LOCAL_HEADER_SEARCH` | inclusion locale | guillemets à côté du fichier, chevrons dans le système ; C-A ne vérifie pas que le fichier existe et n'en lit pas le contenu |
| `GUARD_PREVENTS_DOUBLE_INCLUSION` | ouverture de garde | empêche deux déclarations identiques ; **nomme la phrase de fermeture** |
| `GUARD_NOT_EVALUATED` | ouverture de garde | aucune condition évaluée, aucune unicité vérifiée |
| `PROTOTYPE_DECLARES_ONLY` | prototype | déclare la signature sans le corps ; aucune définition correspondante n'est cherchée |
| `EXTERNAL_LINKAGE` | variable externe | définie ailleurs, exactement une fois ; C-A ne la cherche pas |
| `INTERNAL_LINKAGE` | variable ou prototype interne | le nom est réservé à ce fichier ; aucune portée vérifiée |

La fermeture de garde ne porte **aucune** information : elle n'énonce rien
que l'ouverture n'ait déjà dit.

---

## 5. Fichiers

**Créés** : `src/moduleInstructions.ts`, `test/modules.test.mjs` (76
tests), ce document.

**Modifiés** : `src/functionInstructions.ts` (intention `FUNC_PROTOTYPE`,
queue partagée), `src/placementLexical.ts` (trois directives),
`src/translate.ts` (union, trois codes, cinq rendus, aiguillage),
`src/pedagogicalInformation.ts`, `scripts/differentiel.mjs`,
`package.json`, `test/placement.test.mjs` (liste de directives adaptée),
`docs/CATALOGUE.md`, `CLAUDE.md`.

**Non modifiés** : `expressionCore.ts` et les quatre profils,
`planPlacement.ts`, `enclosingStructures.ts` et tous les reconnaisseurs
contextuels, les instantanés de compatibilité, et tout `extension/`.

---

## 6. Limites connues

- Ni macro à remplacement, ni `typedef`, ni `#if`/`#ifdef`/`#else`, ni
  `#pragma`, ni compilation conditionnelle quelconque.
- Ni définition de fonction interne (`static` sur une définition) : seul
  le **prototype** peut être interne. Une définition `static` reste à
  écrire à la main.
- Ni variable globale ordinaire : seules les deux formes de liaison
  explicite. Une variable à la portée fichier s'écrit avec les
  déclarations du lot 7, qui ne portent aucune liaison.
- Chemin d'en-tête local sans espace ni échappement.
- **Aucune vérification de projet.** Un prototype sans définition, un
  `extern` sans définition, deux gardes de même nom : tout est traduit.
  Trois tests fixent ce comportement réel.
- `#ifndef` n'est pas évalué ; voir §3.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; message `UNSUPPORTED_HEADER` sous-estimé (lot 21 §2) ;
exercice intégrateur final.
