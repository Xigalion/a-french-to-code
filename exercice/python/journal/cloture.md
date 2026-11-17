# Lot P6 — exercice de cloture Python, et ses complements

Produit par `node exercice/python/cloture.mjs`. Ne pas editer a la main.

| Programme | Instructions | Informations | Execution |
|---|---|---|---|
| `carnet.py` — Carnet de notes — les neuf domaines | 88 | 32 | conforme |
| `complement-portees.py` — Intentions du catalogue partagé, rendues en Python | 52 | 12 | conforme |
| `complement-fichier.py` — Dictionnaire vide, parcours, fichiers lus et écrits, saisie, point d’entrée | 23 | 14 | conforme |
| `complement-sequences.py` — Séquences : tranche, indice négatif, insertion, retrait, aliasing, tuple | 23 | 14 | conforme |
| `complement-collections.py` — Dictionnaires et ensembles : textes, doublons, parcours | 22 | 11 | conforme |
| `complement-chaines.py` — Chaînes, saisie, conversion, erreurs levées, décrémentation | 30 | 13 | conforme |
| **total** | **238** | **49** | toutes conformes |

- retouches manuelles : **0**
- phrases refusees : **0** — rendus refuses : **0** — placements refuses : **0**
- chemin emprunte : `PythonTranslationSession`, celui de l’editeur

## Couverture du catalogue

- intentions natives livrees : **64**
- intentions du catalogue partage portees : **33**
- intentions EMPLOYEES par ces six programmes : **97** sur 97
- informations passives rencontrees par ces programmes : **49**

> **Un compte d’intentions employees n’est pas un compte de competences.**
> C’est la lecon du barème des 91 sondes de la V1 : ces programmes montrent
> que les intentions marchent ensemble, pas qu’elles enseignent tout.

### Les intentions que ces programmes n’emploient pas


  PY_ALIASING_IS_NOT_A_COPY, PY_ANNOTATION_NOT_CHECKED, PY_AUGMENTED_ASSIGNMENT_IS_IN_PLACE, PY_BLOCK_NEEDS_A_BODY, PY_BOOL_IS_AN_INT, PY_CASE_IS_NOT_REVERSIBLE, PY_CHAR_IS_A_STRING, PY_CONSTANT_IS_ONLY_A_CONVENTION, PY_CONVERSION_CAN_RAISE, PY_DEFAULT_IS_EVALUATED_ONCE, PY_DEL_SHIFTS_THE_REST, PY_EMPTY_BRACES_IS_A_DICT, PY_EXCEPT_NEEDS_A_TYPE, PY_FLOOR_DIVISION_ROUNDS_DOWN, PY_FSTRING_IS_EVALUATED_NOW, PY_IMPORT_RUNS_THE_MODULE, PY_INDEX_CAN_BE_NEGATIVE, PY_INPUT_IS_ALWAYS_A_STRING, PY_INT_IS_UNBOUNDED, PY_IS_IS_IDENTITY, PY_ITERATING_WHILE_MODIFYING, PY_JOIN_IS_ON_THE_SEPARATOR, PY_LEN_IS_NOT_SIZEOF, PY_LIST_GROWS, PY_LIST_IS_MUTABLE, PY_LOOP_VARIABLE_SURVIVES, PY_MAIN_IS_A_CONVENTION, PY_MATCH_DOES_NOT_FALL_THROUGH, PY_MEMBERSHIP_IS_LINEAR, PY_MISSING_KEY_RAISES, PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN, PY_MULTIPLE_RETURN_IS_A_TUPLE, PY_NAME_REBINDS, PY_NONE_IS_A_VALUE, PY_NO_SEPARATOR_ADDED, PY_POWER_IS_EXACT_ON_INTEGERS, PY_RAISE_STOPS_THE_FUNCTION, PY_RANGE_EXCLUDES_THE_END, PY_REAL_DIVISION_IS_ALWAYS_REAL, PY_SEPARATOR_IS_EXPLICIT, PY_SET_REMOVES_DUPLICATES, PY_SLICE_COPIES, PY_STRING_IS_IMMUTABLE, PY_TEXT_IS_NOT_A_NUMBER, PY_TRUTHINESS, PY_TUPLE_IS_IMMUTABLE, PY_TYPE_IS_NOT_A_CHECK, PY_WITH_CLOSES_FOR_YOU, PY_WRITE_NEEDS_A_STRING

## carnet.py

### Sortie attendue, calculee a la main

```
somme = 47
moyenne = 15.67
entiere et reste = 15 2
décidé
0 ada 15
1 bob 15
2 cleo 15
ADA, BOB, CLEO
total 47
bonjour ADA, BOB, CLEO
clé absente
mention de 20 = 3
mention de 12 = 2

```

### Sortie reelle de python3

```
somme = 47
moyenne = 15.67
entiere et reste = 15 2
décidé
0 ada 15
1 bob 15
2 cleo 15
ADA, BOB, CLEO
total 47
bonjour ADA, BOB, CLEO
clé absente
mention de 20 = 3
mention de 12 = 2

```

## complement-portees.py

### Sortie attendue, calculee a la main

```
9
5
Z
B
8
1.5
1
3
8
4.0
2

```

### Sortie reelle de python3

```
9
5
Z
B
8
1.5
1
3
8
4.0
2

```

## complement-fichier.py

### Sortie attendue, calculee a la main

```
Ada
alpha
beta
beta
bonjour
lancé

```

### Sortie reelle de python3

```
Ada
alpha
beta
beta
bonjour
lancé

```

## complement-sequences.py

### Sortie attendue, calculee a la main

```
2
15
4
81
bob

```

### Sortie reelle de python3

```
2
15
4
81
bob

```

## complement-collections.py

### Sortie attendue, calculee a la main

```
Londres
nom=Ada
ville=Londres
2
1
Londres / Paris

```

### Sortie reelle de python3

```
Londres
nom=Ada
ville=Londres
2
1
Londres / Paris

```

## complement-chaines.py

### Sortie attendue, calculee a la main

```
42
41
2
4241
rien
attrapée
10
<class 'int'>

```

### Sortie reelle de python3

```
42
41
2
4241
rien
attrapée
10
<class 'int'>

```
