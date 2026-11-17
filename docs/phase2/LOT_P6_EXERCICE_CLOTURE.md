# Lot P6 — l'exercice de clôture de Python V1

Un exercice représentatif des **neuf domaines** de Python, plus cinq
programmes complémentaires. Tous écrits par la session de l'hôte, tous
exécutés, **zéro retouche manuelle**.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Les preuves

`node exercice/python/cloture.mjs` → `exercice/python/cloture/`,
journal dans `exercice/python/journal/cloture.md`.

| Programme | Instructions | Informations | Exécution |
|---|---|---|---|
| `carnet.py` — les neuf domaines | **88** | 32 | conforme |
| `complement-portees.py` — intentions du catalogue partagé | **52** | 12 | conforme |
| `complement-fichier.py` — fichiers, saisie, point d'entrée | **23** | 14 | conforme |
| `complement-sequences.py` — tranches, aliasing, tuples | **23** | 14 | conforme |
| `complement-collections.py` — dictionnaires et ensembles | **22** | 11 | conforme |
| `complement-chaines.py` — chaînes, conversions, erreurs | **30** | 13 | conforme |
| **total** | **238** | **49** | **6/6 conformes** |

| Mesure | Chiffre |
|---|---|
| retouches manuelles | **0** |
| phrases refusées — rendus refusés — placements refusés | **0 — 0 — 0** |
| chemin emprunté | `PythonTranslationSession`, **celui de l'éditeur** |
| **intentions employées** | **97 / 97** |
| **informations passives rencontrées** | **49 / 49** |

Chaque sortie a été **calculée à la main avant toute exécution**, et le script
refuse de conclure si une seule diffère. Il refuse aussi d'écrire un fichier
si une phrase, un rendu ou un placement est refusé — une couverture annoncée
sur un programme amputé serait une preuve fausse, et c'est exactement ce que
la sonde du lot P3 avait fait.

**La couverture est une exigence, pas un chiffre affiché** : le script
**échoue** si une seule intention livrée n'est employée par aucun programme
exécuté. Une intention qui n'a jamais tourné n'est pas prouvée.

### Les neuf domaines, dans `carnet.py`

| Domaine | Ce que le programme en fait |
|---|---|
| D1 valeurs, noms, affichage | entier, booléen, chaîne, affichages formatés, séparateur explicite |
| D2 types et expressions | les deux quotients, le reste, la conversion, l'affichage à 2 décimales |
| D3 décisions | `if`/`elif`/`else`, `is None`, `in`, et un `match` à trois motifs |
| D4 boucles | `range` à deux bornes, `enumerate`, `items()`, et une incrémentation |
| D5 séquences | deux listes construites par ajout |
| D6 dictionnaires | création, écriture de clé, parcours, et une `KeyError` attrapée |
| D7 chaînes | jointure, majuscules, f-chaîne |
| D8 fonctions | trois fonctions, dont une à valeur par défaut, un appel nommé, deux retours |
| D9 fichiers, erreurs, modules | `import`, un bloc `with` en écriture, `try`/`except` |

## 2. Quatre lacunes trouvées par l'exercice

Aucune n'était visible avant de l'écrire. C'est la même mécanique que
l'exercice de clôture de la V1, qui avait trouvé le défaut du lot 32.

### Écrire dans un fichier n'existait pas

La raison de refus de la famille « fichiers » annonçait que « les phrases
d'ouverture, de parcours et **d'écriture** seront écrites ». Les deux
premières l'étaient ; la troisième non. Un programme qui ouvre un fichier en
écriture ne pouvait donc rien y écrire.

Corrigé en deux temps, et le second est le plus intéressant :

- `FILE_WRITE_TEXT` du catalogue **partagé** est désormais **portée** :
  `Écris le texte "fin" dans le fichier f.` → `f.write("fin")`. Même phrase,
  même sens, rendu différent — c'est la définition d'une intention adaptable,
  et la dupliquer dans le catalogue natif aurait créé une **intention morte**,
  puisque le catalogue partagé gagne toujours ;
- `PY_ECRIRE_CHAINE` est native, parce qu'écrire une **chaîne nommée** n'a pas
  d'équivalent dans le catalogue C.

`FILE_WRITE_INT` reste refusée, et sa raison est réécrite : la méthode
d'écriture de Python n'accepte qu'une chaîne, convertir à votre place serait
un ajout implicite, et la compétence s'enseigne par deux phrases.

### Un appel nommé à un seul paramètre n'existait pas

`PY_PARAM_NOMME` n'avait qu'une forme, à **deux** paramètres. Appeler une
fonction d'un paramètre obligeait à répéter le même nom, et Python refuse
`salue(nom=cri, nom=cri)` **à l'analyse**. Le programme s'écrivait sans un mot
de refus et ne démarrait pas.

Corrigé par une forme à un paramètre, et par un refus nouveau : un **nom de
paramètre répété** est une erreur de *forme*, visible sans rien savoir du
programme. C-A la refuse au lieu d'écrire un fichier que Python ne lirait pas.

### Les deux lacunes du lot P5, comblées avant

Ajouter un **texte** à une liste, et une valeur textuelle de dictionnaire :
elles sont livrées, avec sept formulations qui emploient le mot « texte ». La
raison est structurelle et vaut d'être redite — les guillemets délimitent une
**expression** partout dans le catalogue, donc `"15"` vaut l'entier 15, et
rien ne permet de devenir qu'on voulait la chaîne. Le mot « texte » le dit.

## 3. Ce que ces 238 instructions ne prouvent pas

**Un compte d'intentions employées n'est pas un compte de compétences.**
C'est la leçon du barème des 91 sondes de la V1, et elle vaut ici : ces
programmes montrent que les 97 intentions **marchent ensemble**, pas qu'elles
enseignent tout ce qu'il faut savoir de Python.

Trois limites, dites comme telles :

- **aucune vérification de symboles, de types ni de portées.** `carnet.py`
  contient un `rangnote` qui relit toujours la même clé, parce que le
  catalogue n'a pas de lecture de clé **par un nom de variable**. Le programme
  est valide, son résultat est celui qui est calculé à la main, et la
  formulation manque — c'est une capacité absente, consignée ;
- **aucun programme écrit par un humain.** Les six sont écrits par un script
  qui dicte des phrases ; personne n'a tapé dans l'éditeur ;
- **un seul interpréteur, une seule plateforme.** `python3` sous Windows, avec
  `PYTHONIOENCODING=utf-8` imposé — sans quoi la console réécrit les accents.
  Ce n'est pas une retouche du code produit, c'est un réglage de la mesure, et
  le script le dit en commentaire.

## 4. Ce que les tests protègent

`test/clotureP6.test.mjs`, 9 tests, rejoués à chaque `npm test` :

- les six `.py` portent **une ligne de commentaire par instruction** — la
  règle 2 se compte ;
- aucun `pass`, aucun `print` sans `end=`, aucune indentation qui ne soit pas
  un multiple de quatre ;
- le journal annonce **six exécutions conformes**, et le test échoue s'il
  annonce un écart — un bilan qui dirait « conforme » pendant qu'un programme
  échoue est exactement ce que ce projet refuse ;
- le journal annonce la couverture **complète**, et il porte la phrase qui
  empêche de la lire comme une note ;
- `carnet.py` est **reproduit** par le moteur, trait pour trait, depuis les
  phrases relues dans le script générateur. Le `.py` commité ne peut donc pas
  vieillir en silence.

## 5. Mesures du lot

| Mesure | Résultat |
|---|---|
| tests Node | **4 374** |
| différentiel contre le lot précédent | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |
| intentions Python | **97** : 33 portées + 64 natives |
| informations passives Python | **49**, toutes atteintes par un programme exécuté |
| corpus de validation gelé | 95,1 % (58/61), 0 erreur de sens |
