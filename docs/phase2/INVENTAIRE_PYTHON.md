# Phase 2 — inventaire des domaines fondamentaux de Python

**Pour qui :** le fondateur, pour décider du **périmètre pédagogique** de
Python V1 — qui n'est pas le périmètre de réutilisation de C-A.

> Précision que ce document applique : **les 37 intentions portables sont un
> potentiel de réutilisation, pas un catalogue**. Python a ses propres
> notions fondamentales, et un refus de portage n'interdit jamais
> d'enseigner la construction native équivalente — il dit seulement que la
> phrase du C ne convient pas.
>
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

> **Deux corrections apportées par le lot P3, le 17 novembre 2026.** Les
> adaptables sont **37**, pas 22, et 6 intentions de plus forment la classe
> « structure de blocs » : la somme exacte est `17 + 37 + 6 + 24 = 84`. Et
> `NUMERIC_CONVERT` n'existe pas : la conversion explicite est un nœud
> `cast` dans une expression, pas une intention. Et les intentions natives
> proposées sont **55**, pas 31 : le compte des tableaux de la section 2
> n'avait jamais été additionné. Un test compare désormais les noms de ce
> document à ceux de la proposition. Le nom venait de la table
> de `scripts/audit-architecture.mjs`, qui signalait les classes
> orphelines sans échouer ; elle échoue désormais.
> Voir `docs/phase2/LOT_P3_CONTRAT_ET_BILAN.md` §7.

## 1. Les quatre catégories, et ce qu'elles décident

| Catégorie | Nombre | Ce qu'on en fait |
|---|---|---|
| **communes** | 17 | réutilisées telles quelles : la phrase et le code changent à peine |
| **adaptables** | 37 | réutilisées, autre forme produite ; la phrase française reste |
| **structure de blocs** | 6 | réutilisées, mais leur POSE change : `if`, `elif`, `else`, `while`, `for`, `def` |
| **propres à C** | 24 | **non portées**, et chacune nomme la construction Python qui enseigne la même compétence |
| **nouvelles, propres à Python** | **55 proposées** | à concevoir : c'est là qu'est le vrai travail pédagogique. Formulations exactes dans `CATALOGUE_NATIF_PYTHON_PROPOSE.md` |

**Python V1 viserait donc ~70 intentions**, et il faudra donc CHOISIR : 32
sont portées depuis C-A au lot P3, et 55 natives sont proposées, soit 87 si
tout était livré. Aucune des 55 n'existe aujourd'hui. Le chiffre de 37 mesuré par la sonde n'était pas un périmètre :
c'était la part de C-A qui se recycle.

### Une correction à la mesure de la sonde

La sonde comptait **37** intentions rendues. Deux de plus le sont en réalité :
`NUMERIC_ASSIGN` et `RETURN_NUMERIC`. Elles n'ont été refusées que parce que
la phrase d'exemple du catalogue contient une **division** — le seul faux ami
d'expression. Le refus porte donc sur `/`, pas sur l'intention.
**Portables : 39 sur 84.**

## 2. Les neuf domaines fondamentaux de Python

Le découpage suit la logique d'un parcours d'initiation, pas celle du C.

### D1 — Valeurs, noms, affichage

| Catégorie | Intentions |
|---|---|
| communes | `INIT_INT`, `ASSIGN_INT`, `ASSIGN_EXPRESSION` |
| adaptables | `PRINT_INT`, `PRINT_TEXT`, `PRINT_FORMATTED`, `NUMERIC_PRINT`, `PRINT_NEWLINE`, `NUMERIC_INIT` |
| propres à C | `DECL_INT`, `NUMERIC_DECL`, `DECL_CHAR` — Python **n'a pas** de déclaration sans valeur |
| **nouvelles Python** | `PY_INIT_STR` (chaîne), `PY_INIT_BOOL` (booléen), `PY_INIT_NONE` (absence de valeur, explicite), `PY_INPUT` (lire une saisie), `PY_PRINT_PLUSIEURS` (afficher plusieurs valeurs, séparateur **explicite**) |

Ce que `DECL_INT` enseignait — « un nom existe avant d'avoir une valeur » —
n'a pas d'équivalent Python, et c'est **une leçon en soi** : une information
passive le dira, au lieu d'un refus muet.

### D2 — Types et expressions

| Catégorie | Intentions |
|---|---|
| communes | `NUMERIC_ASSIGN` |
| adaptables | les conversions explicites — **pas une intention** mais un nœud `cast` dans une expression : `(int) x` devient `int(x)`, et `(unsigned int) x` est refusé |
| propres à C | `CONST_DECL` — Python n'a pas de constante ; `SIZEOF_PRINT`, `SIZEOF_ASSIGN` |
| **nouvelles Python** | `PY_DIV_ENTIERE` (`//`), `PY_DIV_REELLE` (`/`), `PY_PUISSANCE` (`**`), `PY_LONGUEUR` (`len`), `PY_TYPE_DE` (`type`), `PY_CONVERSION` (explicite, nommée) |

**La division est la décision la plus importante du domaine** : deux phrases
distinctes, parce que ce sont deux opérations distinctes. C'est l'inverse
d'un faux ami masqué.

### D3 — Décisions

| Catégorie | Intentions |
|---|---|
| communes | — |
| adaptables | `IF`, `ELSE_IF` (→ `elif`), `ELSE` |
| propres à C | `SWITCH`, `CASE_INT`, `CASE_CHAR`, `CASE_DEFAULT`, `BREAK_SWITCH` |
| **nouvelles Python** | `PY_APPARTIENT` (`in`), `PY_EST_NONE` (`is None`), `PY_MATCH` + `PY_CAS` + `PY_CAS_DEFAUT` (sémantique **sans traversée**, donc phrases propres) |

`switch` n'est pas interdit d'enseignement : il est remplacé par un
`match` qui dit ce qu'il fait, et dont les phrases ne mentent pas sur la
traversée des cas.

### D4 — Boucles

| Catégorie | Intentions |
|---|---|
| communes | `BREAK`, `CONTINUE` |
| adaptables | `WHILE` |
| propres à C | `FOR` (trois clauses), `DO_WHILE` |
| **nouvelles Python** | `PY_POUR_CHAQUE` (`for x in liste`), `PY_POUR_INTERVALLE` (`for i in range(a, b)`), `PY_POUR_INDICE_ET_VALEUR` (`enumerate`), `PY_SINON_DE_BOUCLE` (`else` de boucle, propre à Python) |

Le `for` à trois clauses ne se porte pas, et **c'est tant mieux** : le
`for` de Python enseigne le parcours d'un itérable, qui est la notion que
l'étudiant doit acquérir.

### D5 — Séquences : listes et tuples

| Catégorie | Intentions |
|---|---|
| communes | `ARRAY_ASSIGN_INT`, `ARRAY_ASSIGN_EXPRESSION` (affectation d'élément) |
| adaptables | `ARRAY_PRINT`, `ARRAY_PRINT_CHAR` |
| propres à C | `ARRAY_DECL` (dimension fixe, remplissage à inventer) |
| **nouvelles Python** | `PY_LISTE_VIDE`, `PY_LISTE_VALEURS` (contenu **explicite**), `PY_AJOUTER` (`append`), `PY_INSERER`, `PY_RETIRER`, `PY_TRANCHE` (`t[a:b]`), `PY_INDICE_NEGATIF`, `PY_TUPLE`, `PY_DEPAQUETER` (`a, b = …`) |

`ARRAY_DECL` est refusée parce qu'une dimension seule obligerait à inventer
un remplissage. La compétence — « créer une séquence de taille connue » —
s'enseigne par `PY_LISTE_VALEURS`, où les valeurs sont **écrites**.

### D6 — Dictionnaires et ensembles

Aucune intention de C-A ne s'y applique : c'est un domaine **entièrement
neuf**, et l'un des plus utiles de Python.

| **nouvelles Python** |
|---|
| `PY_DICT_VIDE`, `PY_DICT_PAIRES`, `PY_DICT_LIRE`, `PY_DICT_ECRIRE`, `PY_DICT_PARCOURIR` (`items`), `PY_ENSEMBLE` |

### D7 — Chaînes

| Catégorie | Intentions |
|---|---|
| adaptables | `STRING_INIT`, `PRINT_STRING`, `INIT_CHAR` et `ASSIGN_CHAR` (chaîne d'un caractère, avec une information qui dit que Python n'a pas de type caractère) |
| propres à C | le terminateur nul, la dimension à prévoir — **notions C**, remplacées par l'immuabilité |
| **nouvelles Python** | `PY_CONCATENER`, `PY_DECOUPER` (`split`), `PY_JOINDRE` (`join`), `PY_MAJUSCULES`, `PY_NETTOYER` (`strip`), `PY_FORMATER` (f-chaîne, champs **nommés**) |

### D8 — Fonctions

| Catégorie | Intentions |
|---|---|
| communes | `RETURN`, `RETURN_INT`, `RETURN_EXPRESSION`, `RETURN_NUMERIC`, `CALL`, `CALL_ASSIGN` |
| adaptables | `FUNC_DEF` (annotations conservées) |
| propres à C | `FUNC_PROTOTYPE`, `LINKAGE_DECL` |
| **nouvelles Python** | `PY_PARAM_NOMME` (appel par nom), `PY_RETOUR_MULTIPLE` (tuple), `PY_PARAM_DEFAUT` — **à n'ouvrir qu'avec une valeur écrite dans la phrase**, jamais déduite |

`PY_PARAM_DEFAUT` est le seul endroit où le mot « défaut » apparaît, et il ne
contredit pas la règle 3 : la valeur est **dans la phrase**.

### D9 — Fichiers, erreurs, modules

| Catégorie | Intentions |
|---|---|
| adaptables | `FILE_OPEN`, `FILE_CLOSE`, `FILE_WRITE_TEXT`, `FILE_WRITE_INT`, `FILE_READ_STRING`, `ASSERT` |
| propres à C | `FILE_DECL`, `FILE_AT_END`, `FILE_READ_INT`, `INCLUDE_*`, `GUARD_*` |
| **nouvelles Python** | `PY_AVEC_FICHIER` (`with`, qui ferme tout seul — et l'information dira pourquoi), `PY_LIRE_LIGNES`, `PY_ESSAYER` / `PY_SAUF` (`try`/`except`), `PY_LEVER` (`raise`), `PY_IMPORTER`, `PY_IMPORTER_DE` |

`with` **ferme le fichier sans qu'on le demande**. C'est un ajout du langage,
pas de C-A : l'information passive devra le dire clairement, sinon
l'étudiant croira que fermer n'existe pas.

## 3. Ce que chaque refus de portage remplace

C'est le tableau que la mission demande explicitement : **un refus n'est pas
une interdiction d'enseigner**.

| Refus de portage | Compétence visée | Construction Python qui l'enseigne |
|---|---|---|
| `DECL_INT`, `NUMERIC_DECL`, `DECL_CHAR` | un nom avant sa valeur | **rien** — et une information dira que Python ne le permet pas |
| `ARRAY_DECL` | créer une séquence de taille connue | `PY_LISTE_VALEURS` : les valeurs sont écrites |
| `DECL_POINTER`, `INIT_POINTER`, `ASSIGN_ADDRESS`, `PRINT_POINTED`, `ASSIGN_POINTED_*` | l'indirection, l'aliasing | `PY_ALIAS_DE_LISTE` : deux noms, une même liste — l'aliasing **existe** en Python, et s'enseigne |
| `ALLOCATE`, `REALLOCATE`, `FREE` | le coût de la mémoire | `PY_AJOUTER` + information sur l'agrandissement d'une liste |
| `SIZEOF_PRINT`, `SIZEOF_ASSIGN` | la taille d'une donnée | `PY_LONGUEUR` (`len`), notion **différente** et dite comme telle |
| `FOR` | répéter un nombre connu de fois | `PY_POUR_INTERVALLE` (`range`) |
| `DO_WHILE` | exécuter au moins une fois | `PY_BOUCLE_PUIS_TEST` : `while True` + `break` — forme idiomatique, à enseigner comme telle |
| `SWITCH`, `CASE_*`, `BREAK_SWITCH` | brancher sur une valeur | `PY_MATCH` et ses cas, **sans traversée** |
| `CONST_DECL` | une valeur qui ne change pas | `PY_CONSTANTE_PAR_CONVENTION` + information : Python ne l'empêche pas |
| `INCLUDE_*`, `GUARD_*` | réutiliser du code d'ailleurs | `PY_IMPORTER`, `PY_IMPORTER_DE` |
| `FUNC_PROTOTYPE`, `LINKAGE_DECL` | déclarer avant d'employer | **rien** — Python n'en a pas besoin, et l'information le dira |
| `STRUCT_*`, `MEMBER_*`, `TYPE_ALIAS` | regrouper des données nommées | `PY_DICT_PAIRES` d'abord ; une classe plus tard, dans un domaine à part |
| `FILE_DECL` | un flux est un objet | `PY_AVEC_FICHIER` |
| `FILE_AT_END` | détecter la fin | `PY_LIRE_LIGNES` : la fin se constate en parcourant |
| `FILE_READ_INT` | lire un nombre | `PY_LIRE_LIGNES` + `PY_CONVERSION` explicite |
| `MAIN` | un point d'entrée | `PY_SI_PRINCIPAL` (`if __name__ == "__main__":`), **avec** son information : c'est une convention |

Aucune ligne de ce tableau ne dit « impossible à enseigner ». Dix-sept
lignes, et deux seulement n'ont pas d'équivalent — parce que la notion
n'existe pas, pas parce qu'on refuse de l'enseigner.

## 4. Volume, et ce qu'il change à l'estimation

| | Audit du 17 novembre | Après cet inventaire |
|---|---|---|
| intentions Python | 37 | **~70** (39 réutilisées + 31 neuves) |
| rendu Python | ~300 lignes | **~550 lignes** |
| informations pédagogiques | ~35 | **~60** |
| tests | ~1 500 à 2 000 lignes | **~2 500 à 3 000 lignes** |
| décisions de contrat | 12 | 12 **+ 31 contrats de phrase neufs** |

L'estimation de l'audit valait pour un **portage**. Un vrai Python V1 est
une **conception**, et coûte environ le double : de l'ordre de 6 000 à
7 000 lignes, moitié tests. C'est l'échelle des domaines 1 à 5 du C réunis.

**Je ne recommande pas de viser les 70 d'un coup.** Un premier jalon à ~45
intentions — D1 à D5 — donne un Python qui enseigne vraiment quelque chose,
et les quatre derniers domaines suivent par lots.

## 5. Ce que cet inventaire n'est pas

- ce n'est **pas un contrat** : aucune formulation française n'y figure, et
  chaque intention neuve demandera le sien ;
- ce n'est **pas une liste fermée** : un domaine de Python manque sûrement, et
  un test utilisateur le dira mieux que moi ;
- les noms `PY_*` sont des **étiquettes de travail**, pas des noms d'intention
  définitifs ;
- rien ici ne touche au **palier 2** ni aux modèles pédagogiques supérieurs.
