# A / C-A — V1 corrigée : livraison

> Suite de `docs/MODELE1_LIVRAISON.md` (modèle 1) et de
> `docs/EVALUATION_MODELE1.md` (évaluation, 81,7 %).
>
> Lots 26 à 29, les cinq décisions du fondateur du 15 novembre 2026.
> Validation : `docs/CAMPAGNE2_VALIDATION.md`.

---

## 1. Les cinq décisions, et ce qui a été fait

| # | Décision | Livré | Preuve |
|---|---|---|---|
| **1** | portée fichier — priorité maximale | **lot 26** | 1 036 divergences auditées, 0 refus à l'intérieur d'une fonction |
| **2** | tableaux dans les structures | **lot 27** | `char nom[32];` écrit par C-A, retouche manuelle disparue |
| **3** | portabilité et `limits.h` | **lot 28** | `#include <limits.h>`, `INT_MAX` compilé et exécuté |
| **4** | diagnostics — `UNSUPPORTED_HEADER` | **lot 28** | message réécrit, 9 entrées d'instantané amendées |
| **5** | affichage sans séparateur | **lot 29** | sortie de l'exercice devenue lisible, sans rien d'automatique |

## 2. Chiffres de la V1

| Mesure | Modèle 1 | V1 corrigée |
|---|---|---|
| tests Node | 3 580 | **3 787** |
| erreurs TypeScript | 0 | **0** |
| tests hôte VS Code | 99/99 | **99/99** |
| genres d'intention | 81 | **83** |
| lignes de formulation du catalogue | 123 | **131**, toutes conformes au moteur |
| compilation GCC C17 | sortie 0 | **sortie 0** |
| retouches manuelles de l'exercice | 1 | **0** |
| blocages recensés | 8 | **4** restants, 2 levés, 1 délibéré, 1 non signalé |
| complétion pondérée | 81,7 % | **83,7 %** |

## 3. Ce que la V1 refuse désormais, et qu'elle acceptait

C'est le changement de comportement le plus important, et il **retire** des
placements. Annoncé, audité, et voulu.

Une instruction **exécutable** — affectation, affichage, appel, bloc, boucle,
aiguillage, assertion, allocation, libération, opération de fichier — n'est
plaçable que dans le corps d'une fonction. Ailleurs :

    STATEMENT_AT_FILE_SCOPE
      En C17, une instruction exécutable n'existe que dans le corps d'une
      fonction. À la portée fichier, seules les déclarations, les définitions
      et les directives sont valides.

Les **déclarations** (24 genres) et les **directives** restent plaçables
partout où elles l'étaient : `int age = 20;` à la portée fichier est une
définition valide, et la refuser aurait été une perte.

Les 14 familles dont le contexte était déjà vérifié avant — retours,
`break`/`continue`, étiquettes, sortie d'aiguillage, branches `sinon`,
champs, définitions de fonction — gardent **exactement** leurs diagnostics,
messages et portées.

## 4. Nouveautés du catalogue

| Phrase | Code C | Lot |
|---|---|---|
| `Ajoute un champ de type char nommé nom de dimension 32.` | `char nom[32];` | 27 |
| `Ajoute un champ de type int nommé notes de dimension 10.` | `int notes[10];` | 27 |
| `Ajoute un champ de type structure Point nommé sommets de dimension 4.` | `struct Point sommets[4];` | 27 |
| `Inclue la bibliothèque limits.h.` | `#include <limits.h>` | 28 |
| `Affiche un retour à la ligne.` | `printf("\n");` | 29 |

Et une route qui existait sans être documentée : les macros de `<limits.h>`
s'écrivent dans une expression, parce que `INT_MAX` est un identifiant C
valide.

    Affecte à m le résultat numérique de "INT_MAX".   →   m = INT_MAX;

**Aucune commande ne nomme une limite**, et c'est volontaire : elle
donnerait l'illusion que C-A connaît les bornes. Il ne les connaît pas, ne
vérifie pas que l'en-tête a été inclus, et ne signale aucun dépassement.

## 5. Limitations résiduelles

### 5.1 Blocages restants de l'exercice

| Blocage | Nature |
|---|---|
| définition de fonction `static` | manque : le prototype interne existe, la définition non |
| lecture de chaîne depuis un fichier | manque : `fgets` non livré |
| initialiseur entre accolades `{…}` | manque, décision D6 à réexaminer |
| arithmétique de pointeur `p + 1` | **accepté sans avertissement** — le plus gênant des quatre |
| macro de limite par une commande | **refus délibéré**, pas une lacune (§4) |
| indexation dans le profil entier | fermé par la décision 4 du fondateur |

### 5.2 Ce que C-A ne vérifie pas, et ne prétend pas vérifier

- **aucun symbole** : `Affecte la valeur 5 à x.` dans une fonction où `x`
  n'existe pas est acceptée ;
- **aucun type** : une expression syntaxiquement entière peut ne pas l'être ;
- **aucune borne** : une dimension est écrite une fois, jamais retenue ;
- **aucune inclusion** : rien ne vérifie qu'un en-tête nécessaire est là ;
- **aucun dépassement d'entier** ;
- une **déclaration** reste plaçable entre les accolades d'une structure, où
  seul un champ est valide en C17.

Chacun de ces points est tenu par au moins un test nommé, pour qu'aucun ne
puisse être présenté comme une garantie.

### 5.3 Dettes du projet

- `MEMBER_ASSIGN_CHAR` est un genre **mort** : déclaré dans le type et rendu
  par `translate.ts`, mais aucun analyseur ne le construit. Ni supprimé ni
  implémenté — hors mandat — mais un test interdit de le présenter comme
  disponible. **Décision à prendre.**
- le volume d'informations augmente : le lot 29 en ajoute une par affichage
  sans séparateur. Point ouvert n° 8 de l'évaluation, arbitrage du fondateur.
- recette GCC du domaine 2, recettes manuelles des domaines 3 et 4 et du
  lot 10 : toujours non exécutées. Un compilateur est désormais disponible,
  donc la première n'est plus bloquée.
- trois gestes hôte restent irréductiblement manuels : touches physiques,
  composition IME, contrôle visuel du focus et du diff.

## 6. Usage dans VS Code

Inchangé depuis le modèle 1.

    npm run check            # 3 787 tests, 0 échec
    npm run build:extension
    # puis F5 dans VS Code, et Ctrl+K puis A dans un .c

Une différence à connaître : **le curseur doit être dans un corps de
fonction** pour une instruction. Sur une ligne blanche à la portée fichier,
une affectation ou un affichage est maintenant refusé, avec le message du
§3. C'est la correction de rang 1, et elle se voit en dix secondes.

## 7. Ce que cette livraison n'affirme pas

**La V1 n'est pas « totalement validée ».** Les preuves réunies sont
réelles — 3 787 tests, 99 tests hôte, une compilation et une exécution GCC
C17, 1 036 divergences auditées une par une — et elles ne couvrent pas tout :

- un seul programme a été compilé ;
- 19 des 91 compétences sondées n'ont **aucune** preuve de compilation ni
  d'exécution, et le score ne les compte pas ;
- le score de 83,7 % est une **part de preuve**, pas un verdict de qualité.

Ce qui reste à décider revient au fondateur : le genre mort du §5.3, le
volume d'informations, les quatre blocages du §5.1, et la validation du
barème lui-même — les cinq preuves, les trois coefficients et le classement
des 91 sondes, qui est le mien et reste discutable.
