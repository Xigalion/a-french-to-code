# Phase 2 — la borne de substitutions, mesurée sur corpus

Produit par `node --experimental-strip-types scripts/mesurer-souplesse.mjs`.

## 1. Le corpus

Il n’est **pas inventé** : il est dérivé du catalogue. Pour chacune des **138** phrases que le moteur accepte, les formes canoniques sont
remplacées par leurs équivalents libres — l’opération inverse de la couche —
hors des guillemets, des littéraux caractère et des identifiants.

| | |
|---|---|
| phrases du catalogue traduites | 138 |
| entrées du lexique | 18 |
| **phrases libres engendrées** | **249** |

## 2. Ce que la couche en fait, par nombre de substitutions

| k | phrases | résolues | ambiguës | refusées | lectures max | lectures moyennes | temps |
|---|---|---|---|---|---|---|---|
| **1** | 173 | **171** | 2 | 0 | 2 | 1.1 | 36 ms |
| **2** | 60 | **60** | 0 | 0 | 2 | 1.1 | 7 ms |
| **3** | 14 | **14** | 0 | 0 | 1 | 1 | 2 ms |
| **4** | 2 | **2** | 0 | 0 | 1 | 1 | 0 ms |

*Mesuré **sans borne** (substitutions 99, lectures 4096) : ce tableau dit ce
que la couche saurait faire, et la borne se choisit ensuite.*

## 3. Ce que chaque borne coûterait

| Borne | phrases résolues | phrases perdues par la borne |
|---|---|---|
| 1 | **171** | 76 |
| 2 | **231** | 16 |
| 3 | **245** | 2 |
| 4 | **247** | 0 |
| 5 | **247** | 0 |
| 6 | **247** | 0 |

## 4. Lecture des chiffres

- **la combinatoire n’explose pas** : sur tout le corpus, les lectures
  candidates plafonnent à **2**. La raison est structurelle :
  seules deux entrées du lexique ont plusieurs formes, donc la plupart des
  substitutions ne multiplient rien ;
- **le temps est négligeable** : 45 ms pour 249 phrases, moteur strict appelé
  pour chaque lecture ;
- **les ambiguïtés ne viennent pas du cumul** : 2 sur 249, toutes à k = 1, et
  toutes dues aux deux entrées homonymes du lexique. Ajouter des substitutions
  n’en crée pas ;
- **aucune phrase du corpus n’est refusée** : chaque phrase libre dérivée du
  catalogue se résout, ou est signalée ambiguë — jamais perdue en silence.

Un défaut de cette mesure, trouvé en relisant les chiffres : la première
version cherchait les formes canoniques dans l’ordre du lexique, si bien que
« Affiche » masquait « Affiche la valeur de » et que le corpus n’engendrait
**aucun** homonyme. Elle annonçait zéro ambiguïté, ce qui était trop beau.
Les formes sont désormais cherchées de la plus longue à la plus courte.

## 5. Recommandation

La borne du prototype était **3**, posée a priori. Les mesures montrent
qu’elle écarte 2 phrases que la couche
résout sans ambiguïté, pour un gain nul en temps comme en lectures.

**Borne recommandée : 4**, et la raison n’est pas la combinatoire — c’est la
**prévisibilité pour l’étudiant**. Au-delà de quatre mots remplacés, la
phrase saisie ne ressemble plus à celle du catalogue, et l’accepter
apprendrait la mauvaise leçon : que la forme n’a pas d’importance.
La borne n’est donc pas une limite technique, elle est **pédagogique**, et
ces chiffres existent pour qu’elle soit choisie en connaissance de cause.

**Ce que la mesure ne dit pas** : quelle borne un étudiant trouve naturelle.
Le corpus est dérivé du catalogue, pas de phrases réellement saisies — il
n’y en a aucune, puisque la case « usage réel observé » est toujours vide.

