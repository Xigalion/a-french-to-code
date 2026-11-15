# Campagne 2 — validation de la V1 corrigée

> **Campagne distincte de la première.** La campagne 1 reste intacte dans
> `exercice/`, telle qu'elle s'est déroulée, avec sa retouche manuelle et sa
> sortie illisible. La campagne 2 vit dans `exercice/campagne2/`.
>
> Score de la campagne 1 : **81,7 %**. Il n'est **pas** recalculé et n'est
> **pas** modifié, conformément à la consigne.
>
> Date : 15 novembre 2026. Lots validés : 26, 27, 28, 29.

---

## 1. Les cinq distinctions demandées

| # | Ce qui est distingué | Où |
|---|---|---|
| 1 | **code brut** produit par C-A | `exercice/campagne2/ca/` |
| 2 | **corrections manuelles** | **aucune** — voir §3 |
| 3 | **code compilé** | `exercice/campagne2/corrige/` |
| 4 | **résultats d'exécution** | `exercice/campagne2/journal/compilation.txt` §3 et §4 |
| 5 | **compétences vérifiées et non vérifiées** | `exercice/campagne2/journal/matrice.md` |

## 2. Ce qui a été exécuté

| Preuve | Outil | Campagne 1 | Campagne 2 |
|---|---|---|---|
| Traduction | `translate()` | 98 | **115** |
| Placement | `planPlacement()` + application | 98, 0 refus | **115, 0 refus** |
| Gestes d'éditeur hors C-A | — | 6 | **6** |
| Informations pédagogiques | `explainInstruction()` | 94 | **111** |
| Avertissements de calcul | `analyzeCalculations()` | 1 | **1** |
| **Retouches manuelles** | — | **1** | **0** |
| Tests Node | `npm test` | 3 580 | **3 787, 0 échec** |
| TypeScript | `npm run typecheck` | 0 erreur | **0 erreur** |
| Compilation GCC 16.2.0 C17 | `-Wall -Wextra -pedantic` | sortie 0 | **sortie 0** |
| Exécution | binaire | sortie 0 | **sortie 0** |
| Compilation séparée + liens | `.o` puis `ld` | OK | **OK** |
| Garde d'en-tête, double inclusion | GCC | OK | **OK** |
| Tests hôte VS Code | `npm run test:vscode` | 99/99 | **99/99 au second passage** — voir ci-dessous |

### Les tests hôte : un échec non reproductible, signalé

Premier passage : **98 réussis, 1 échec** — `lot 9 : IF imbriqués et
insertions successives ["
","  "]`. Second passage, **sans aucune
modification du dépôt** : **99 sur 99**.

L'échec n'est donc pas reproductible. Trois éléments l'établissent : le même
scénario tourne six fois, pour trois indentations et deux fins de ligne, et
une seule combinaison a échoué tandis que les cinq autres, de logique
identique, passaient au même passage ; le test n'assertionne aucun compte
d'informations, donc le lot 29 ne peut pas l'affecter ; et le second passage
est vert.

**Ce que cela ne dit pas** : que la suite hôte soit stable. Elle dépend de
délais et d'un éditeur réel. Un échec isolé doit être reproduit avant d'être
tenu pour une régression — et un passage vert unique ne prouve pas davantage
l'absence de problème. Journal : `exercice/campagne2/journal/hote.txt`.

## 3. La retouche manuelle a disparu

C'est le résultat le plus net de la campagne.

La campagne 1 avait exigé **une** correction manuelle : `char nom[32];`, que
C-A refusait d'écrire. Elle était scriptée dans `exercice/retoucher.mjs` et
documentée dans `exercice/retouches.md`.

Le lot 27 l'a rendue inutile. Vérifié dans le fichier produit :

    exercice/campagne2/corrige/carnet.h:12:    char nom[32];

et aucune occurrence de `RETOUCHE MANUELLE` dans l'arborescence de la
campagne 2. **La structure `Eleve` est entièrement écrite par C-A**, ses
quatre champs par quatre phrases françaises.

## 4. La sortie est devenue lisible

Campagne 1, une seule ligne, onze `printf` collés :

    Carnet de notesCarnetCarnet312481513.67a revoir17

Campagne 2, avec des séparateurs **écrits phrase par phrase** par le lot 29 :

    Carnet de notes
    Carnet
    Carnet
    3
    12
    48
    15
    13.67
    a revoir
    17
    2147483647

**C-A n'a ajouté aucun séparateur.** Les dix `Affiche un retour à la ligne.`
sont des étapes explicites du scénario, listées nommément dans
`exercice/campagne2/scenario2.mjs`. Un libellé approximatif n'insère rien —
c'est arrivé au premier essai, et cela s'est vu dans la sortie compilée.

La dernière ligne, `2147483647`, est `INT_MAX` : le lot 28 exercé pour de
vrai, avec son en-tête inclus et le C compilé.

## 5. Les huit blocages de la campagne 1, revus

| # | Blocage de la campagne 1 | État en campagne 2 |
|---|---|---|
| 1 | champ de structure de type tableau | **LEVÉ** (lot 27) — `char nom[32];` |
| 2 | `limits.h` refusé | **LEVÉ** (lot 28) — `#include <limits.h>` |
| 3 | macro de limite | **toujours bloqué, et voulu** : aucune commande ne nomme une limite ; la macro s'écrit dans une expression, et c'est la route exercée |
| 4 | définition de fonction `static` | toujours bloqué |
| 5 | lecture de chaîne depuis un fichier | toujours bloqué |
| 6 | initialiseur entre accolades | toujours bloqué |
| 7 | arithmétique de pointeur non signalée | toujours **accepté sans avertissement** |
| 8 | profil entier fermé à l'indexation | toujours bloqué, par décision 4 du fondateur |

Deux levés, six restants, dont un — le n° 3 — est un refus **délibéré** et non
une lacune.

## 6. La lacune de rang 1, vérifiée instruction par instruction

La campagne 1 avait trouvé que C-A **plaçait en silence** une instruction
exécutable à la portée fichier, et produisait du C non compilable sans un
mot. La campagne 2 le vérifie sur les huit instructions concernées
(`journal/verifications.txt`) :

| Instruction à la portée fichier | Campagne 1 | Campagne 2 |
|---|---|---|
| `Affecte la valeur 5 à compteur.` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Affiche la valeur de compteur.` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Appelle mention avec "15".` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Crée un bloc si "compteur > 0".` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Crée une boucle tant que "compteur > 0".` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Vérifie que "compteur > 0".` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Libère la mémoire pointée par eleves.` | insérée | **`STATEMENT_AT_FILE_SCOPE`** |
| `Affiche un retour à la ligne.` | n'existait pas | **`STATEMENT_AT_FILE_SCOPE`** |

Et les huit mêmes, **dans** un corps de fonction, sont toujours placées : la
correction refuse ce que C17 interdit, pas davantage.

La version **brute** de la campagne 2 échoue toujours à l'édition de liens
sur `multiple definition of 'compteur'`, et c'est voulu : ce défaut-là est
une faute du scénario brut, annoncée par l'information `EXTERNAL_LINKAGE`,
et le conserver montre que C-A ne protège de rien qu'on refuse de lire.

## 7. Score de validation de la campagne 2

Même méthode, mêmes cinq preuves, mêmes poids (P1 15 %, P2 20 %, P3 30 %,
P4 20 %, P5 15 %), mêmes trois coefficients (3 / 2 / 1) et mêmes 91 sondes
que la campagne 1 — c'est la condition pour que les deux chiffres soient
comparables. **Seules les preuves changent.**

| | Campagne 1 | Campagne 2 |
|---|---|---|
| **Complétion pondérée** | **81,7 %** | **83,7 %** |
| fondamentale (×3) | 85,9 % | **88,6 %** |
| structurante (×2) | 86,7 % | **86,7 %** |
| complémentaire (×1) | 69,3 % | **74,4 %** |
| compétences **vérifiées** | 65 | **67** |
| traduites et placées, non exercées | 19 | 19 |
| refus attendu obtenu | 1 | 1 |
| **bloquées** | 6 | **4** |

`65 + 19 + 1 + 6 = 91` et `67 + 19 + 1 + 4 = 91`.

### Sensibilité, inchangée dans sa lecture

| Hypothèse | Campagne 1 | Campagne 2 |
|---|---|---|
| mesurée | 81,7 % | **83,7 %** |
| si l'exercice employait aussi les 19 non exercées | 91,6 % | **93,6 %** |
| si, en plus, les blocages étaient levés | 95,0 % | **95,9 %** |

**Ce que ce chiffre n'est pas.** Ce n'est pas une note de qualité : c'est la
part du barème dont j'ai la preuve. Les 9,9 points entre la première et la
deuxième ligne mesurent **le scénario**, pas le produit. Je n'ai pas enrichi
l'exercice au-delà de ce que les lots 27 à 29 rendaient possible, pour que la
comparaison des deux campagnes reste honnête.

## 8. Ce que la campagne 2 ne prouve toujours pas

- que **tout** le C produit par C-A compile. Un seul programme a été compilé,
  et les 19 compétences non exercées n'ont aucune preuve de compilation ;
- que C-A garantisse un programme correct. Il refuse désormais une
  instruction hors de toute fonction ; il ne vérifie **ni** les symboles,
  **ni** les types, **ni** les bornes, et trois tests du lot 27 et deux du
  lot 28 l'énoncent explicitement ;
- que les 91 sondes épuisent les neuf domaines. La liste est la mienne, et
  c'est le point 2 resté ouvert du §5.6 de l'évaluation ;
- que 83,7 % soit un seuil de livraison. C'est une mesure, pas un verdict.

### Clarification demandée : 91 ou 90 ?

Le résumé de l'évaluation annonçait **91** compétences tandis que la phrase
qui les énumérait en citait **90**. L'écart venait de **ma prose**, pas de la
matrice : j'avais écrit « 65 vérifiées, 19 non exercées, 6 bloquées », soit
90, en omettant la **91ᵉ**, classée « refus attendu, obtenu » —
`Vérifie que "n = 0".` → `ASSIGNMENT_IN_CONDITION`. Elle n'est ni vérifiée ni
bloquée : c'est une sonde dont le résultat **attendu** était un refus, et
elle l'a obtenu. La matrice générée totalisait bien 91 dans les deux
campagnes.
