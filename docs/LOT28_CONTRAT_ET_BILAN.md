# Lot 28 — `limits.h`, portabilité, et le message d'en-tête : contrat et bilan

> **Décisions 3 et 4** du fondateur du 15 novembre 2026. Les deux sont
> traitées ensemble parce qu'elles touchent le **même** contrat gelé : la
> règle d'inclusion du lot 4 et son message, figés par les instantanés de
> compatibilité.
>
> Référence différentielle : `lot-27` (lot 27).

---

## 1. Chiffres réels

| Mesure | Résultat |
|---|---|
| `npm run typecheck` | **0 erreur** |
| `npm test` | **3 759 tests, 0 échec** |
| `differentiel.mjs d90aeb9` | **1 334 689 comparaisons** |
| extensions approuvées (`/bibliothèque/`) | **12** (7 entrées distinctes) |
| régressions | **0** |
| `--no-loss` | **0 capacité perdue** |
| sur-capture du motif | **0** sur 12 |
| entrées d'instantané amendées | **9**, dont **1** changement de verdict |

## 2. Ce qui est livré, et ce qui ne demandait aucun code

### 2.1 L'en-tête

    Inclue la bibliothèque limits.h.   →   #include <limits.h>

Accepté par sa propre branche dans `reliabilityInstructions.ts`, avant que
la règle historique ne soit atteinte — exactement le chemin que `stdlib.h`
suit depuis le lot 21 et `assert.h` depuis le lot 25.

`float.h` **reste refusé** : la décision 3 ne nomme que `limits.h`, et je
ne l'ai pas étendue de moi-même.

### 2.2 Les macros ne demandaient aucun code — et c'est le point du lot

`INT_MAX`, `INT_MIN`, `UINT_MAX`, `CHAR_BIT`, `CHAR_MAX`, `CHAR_MIN` sont
des **identifiants C valides**. La grammaire des noms les a donc toujours
acceptés, dans les trois profils d'expression, le profil entier gelé
compris :

    Affecte à m le résultat numérique de "INT_MAX".   →   m = INT_MAX;
    Crée un bloc si "x < INT_MAX".                    →   if (x < INT_MAX) { … }
    Affecte à b le résultat numérique de "CHAR_BIT * 2".  →  b = (CHAR_BIT * 2);

**Aucune ligne du noyau d'expressions n'a été touchée, et
`INTEGER_CAPABILITIES` reste scellé.** C'est le meilleur résultat possible :
la capacité existait, il manquait seulement le droit d'inclure l'en-tête
qui la rend légale.

C'est aussi la **limite honnête**, et deux tests l'énoncent :

- il n'existe **aucune** formulation qui nomme une limite. « Affiche la
  limite maximale du type int. » est refusée, et le restera : une telle
  commande donnerait l'illusion que C-A connaît les bornes ;
- `INT_MAX` passe parce que c'est un identifiant valide, **pas** parce que
  C-A sait de quoi il s'agit. `LIMITE_INEXISTANTE` passe tout aussi bien.
  C-A ne vérifie pas que l'en-tête a été inclus, ne connaît aucune valeur,
  et ne signale aucun dépassement d'entier signé.

### 2.3 Deux informations passives

Sur l'inclusion, et sur elle seule — car C-A ne peut pas savoir qu'une
macro est utilisée sans parcourir chaque expression, ce qui dépasse le lot :

| Code | Ce qu'elle dit |
|---|---|
| `LIMITS_ARE_IMPLEMENTATION_DEFINED` | les bornes sont **définies par l'implémentation**, changent de machine en machine, et C-A ne les connaît pas |
| `LIMIT_MACROS_NOT_KNOWN` | un nom comme `INT_MAX` est accepté comme identifiant ; C-A ne vérifie ni l'inclusion, ni l'existence de la macro, ni qu'un calcul tient dans son type |

## 3. Le message de `UNSUPPORTED_HEADER` (décision 4)

### Avant

    Seul l’en-tête stdio.h, écrit exactement ainsi, est pris en charge.

**Ce message était faux depuis le lot 21.** `stdlib.h` était accepté, puis
`assert.h` au lot 25. Le point avait été signalé au fondateur comme une
décision de périmètre ouverte, et conservé en l'état parce que les
instantanés des lots 4 et 5 le figeaient.

### Après

    Les en-têtes de la bibliothèque standard pris en charge sont stdio.h,
    stdlib.h, assert.h et limits.h, écrits exactement ainsi.

Il énonce le **périmètre**, comme l'ancien, et ne donne **aucune phrase à
recopier** : la règle 5 — diagnostic ≠ correction — est respectée. Il ne
mentionne pas la formulation des en-têtes du projet, qui est une autre
instruction et non une correction de celle-ci.

## 4. L'amendement des instantanés gelés

C'est le point le plus sensible du lot, et la raison pour laquelle il a été
fait par un **script qui imprime chaque modification** plutôt qu'à la main.

Les instantanés ont le format « une entrée par ligne », et il est préservé :
le diff git se lit ligne à ligne.

| Instantané | Entrées amendées | Nature |
|---|---|---|
| `lot4-compatibility.json` | **7** | message seul |
| `lot5-compatibility.json` | **0** | — |
| `lot6-compatibility.json` | **2** | 1 message seul (`float.h`), 1 **verdict** (`limits.h`) |

Les 7 entrées du lot 4 sont toutes des variantes d'écriture de `stdio.h`
(majuscules, points doublés, tabulations) : leur **refus est toujours
correct**, seul le texte du message change. Le script le **vérifie
mécaniquement** — il lève une erreur si le `status`, le `code` ou la
`range` d'une entrée changent — et il s'arrête plutôt que d'écrire si c'est
le cas.

L'unique entrée dont le verdict change, `Inclue la bibliothèque limits.h.`,
a été **reconstruite depuis le moteur** (`translate()`), pas corrigée à la
main.

**Ce que cela ne dit pas** : qu'amender un instantané soit devenu
ordinaire. La règle du projet reste « ne jamais les régénérer pour faire
passer un test ». Ici, l'ancienne attente était devenue **incompatible avec
un contrat approuvé**, ce que la décision 3 nomme explicitement comme le
seul cas autorisé.

## 5. Tests historiques adaptés

Quatre, chacun avec sa raison sur place :

| Test | Adaptation |
|---|---|
| `memory.test.mjs` : « le contrat gelé de l'inclusion n'a pas bougé » | renommé « …, sauf son message » ; genre, sortie, code et portée toujours vérifiés |
| `modules.test.mjs` : « les deux formes d'inclusion restent distinctes » | message attendu mis à jour ; grammaire et verdict inchangés |
| `reliability.test.mjs` : « limits.h et float.h restent refusés » | remplacé par « limits.h est livré, float.h reste refusé », **plus** deux tests neufs sur les macros et sur les informations |
| `reliability.test.mjs` : « les **trois** en-têtes livrés » | renommé « les **quatre** » — un test vert qui affirme une chose fausse est pire qu'un échec |

Ce dernier mérite d'être souligné : il **passait** après le lot, parce
qu'il vérifiait trois en-têtes sans vérifier qu'il n'y en avait pas un
quatrième. Son titre affirmait « et eux seuls ». Je l'ai corrigé pour cette
raison seule, et non parce qu'il échouait.

## 6. Limites, après ce lot

- `float.h` et ses macros : hors décision 3 ;
- aucune formulation ne nomme une limite, par choix pédagogique (§2.2) ;
- aucune information lorsqu'une macro est **utilisée** : il faudrait
  parcourir toutes les expressions de toutes les intentions. L'information
  est portée par l'inclusion ;
- C-A ne vérifie jamais qu'un en-tête nécessaire a été inclus, pour
  `limits.h` comme pour `stdio.h` ;
- aucun dépassement d'entier n'est signalé — ni ici, ni au lot 8, dont les
  avertissements portent sur la division et le modulo.
