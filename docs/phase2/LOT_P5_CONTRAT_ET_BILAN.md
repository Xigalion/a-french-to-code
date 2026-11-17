# Lot P5 — le catalogue natif Python, et une refonte en table

Contrat et bilan dans le même document. Ce lot fait passer Python de quatorze
à **cinquante-quatre** intentions natives, et il remplace deux mécanismes
d'analyse par un seul.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Ce que le lot livre

| Livrable | Où |
|---|---|
| **54 intentions natives**, 57 formulations françaises | `src/langages/python/catalogue.ts` (table) |
| leur rendu | `src/langages/python/renduNatif.ts` |
| **26 informations pédagogiques passives** de plus | `src/langages/python/informations.ts` |
| un instantané **figé** des 57 sorties | `test/pythonP5.test.mjs` |
| un second programme natif, **exécuté** | `exercice/python/natif2.mjs`, 54 instructions |
| le catalogue engendré depuis le moteur | `docs/CATALOGUE_PYTHON.md` §0 |

Les domaines ouverts : **dictionnaires et ensembles** (entièrement neufs),
**chaînes** et leurs méthodes, **tuples** et dépaquetage, tranches et indice
négatif, **aliasing**, `match`/`case`, `with`, `try`/`except`/`raise`,
`import`, paramètres nommés, retour multiple, puissance, `None` explicite,
valeur fixe par convention.

## 2. Une table, et non plus deux mécanismes

Le lot P4 analysait ses quatorze intentions **à la main**, chacune avec son
parcours de jetons. À cinquante-quatre, ce n'était plus tenable : ajouter une
intention voulait dire ajouter une branche de code.

Le lot remplace cela par **trois tables** et **un moteur** :

- `MOTIFS` — 56 formes françaises ancrées sur la phrase entière, avec l'ordre
  de leurs captures ;
- `PROCHES` — les formes **incomplètes** les plus probables, avec leur
  diagnostic précis ;
- `AMORCES` — les premiers mots qui font entrer une phrase dans ce catalogue.
  Hors de cette liste, le module **décline**, et le diagnostic du catalogue
  partagé survit.

**Les trente-huit tests du lot P4 prouvent que la refonte est neutre** : aucun
n'a été réécrit pour qu'il passe, et les trois qui ont changé l'ont fait pour
élargir leur portée — un compte de 14 à 54, un compte d'en-têtes de 3 à 14, et
une règle de texte supplémentaire qui vaut désormais pour **tous** les motifs
au lieu de trois cas choisis.

## 3. Trois défauts, et aucun n'était visible avant

### Les captures étaient localisées par `indexOf`

Le moteur retrouvait la position d'une capture en cherchant son **texte** dans
la phrase. Pour une capture courte, il trouvait la première occurrence
ailleurs : le texte `" "` de `Affiche a et b séparés par le texte " ".`
renvoyait la **première espace de la phrase**, et le littéral était relu au
mauvais endroit.

Trois formulations sur cinquante-sept échouaient, toutes celles dont un texte
est court. Corrigé par le drapeau `d` des expressions régulières, qui donne
les positions **exactes** des captures. Le défaut valait pour toutes les
captures, pas seulement les textes : un nom répété deux fois dans une phrase
aurait été lu au mauvais endroit lui aussi.

### Deux diagnostics perdus par la refonte, et restaurés plus largement

L'analyse à la main donnait `UNSUPPORTED_BOOLEAN` pour
`Crée un booléen nommé actif de valeur 1.` et `UNEXPECTED_TEXT` pour
`Crée une liste vide nommée notes maintenant.` La table ne les donnait plus :
elle ne reconnaissait pas la phrase, donc elle déclinait.

Un test l'a dit, et les deux sont restaurés — **en mieux** :

- la forme proche du booléen accepte n'importe quel mot, pas seulement un
  identifiant ;
- le texte supplémentaire est une **règle générale** : on retire les mots de
  la fin, un par un, et si ce qui reste est reconnu, le reste est du texte en
  trop. Elle vaut pour les cinquante-six motifs à la fois, là où l'analyse à
  la main ne la donnait que pour les quelques formes dont elle parcourait les
  jetons. Un test l'exige sur **chaque** exemple publié.

### Une lacune trouvée par l'exercice : on ne pouvait pas ajouter un texte

`Ajoute "cleo" à la fin de noms.` lisait `cleo` comme un **nom**, parce que
les guillemets délimitent une *expression* et que le profil d'expression ne
porte pas de littéral de chaîne. Le programme s'écrivait sans un mot de
refus, et **échouait à l'exécution** : `NameError: name 'cleo' is not
defined`.

C'est le même mécanisme de découverte que l'exercice de clôture de la V1, qui
avait trouvé le défaut du lot 32. Corrigé par une **54ᵉ intention** :
`Ajoute le texte "cleo" à la fin de noms.` → `noms.append("cleo")`.

**Et la lacune symétrique reste ouverte, dite comme telle :** insérer un
texte à une position, ou mettre un texte en valeur de clé, n'a pas de
formulation. La même phrase y lirait un nom. Ce n'est pas un défaut caché —
c'est une capacité absente, et elle attend une décision de périmètre.

## 4. Les décisions validées, appliquées

| Décision | Ce que le lot en a fait |
|---|---|
| **D5** `match` sans traversée | `PY_MATCH`, `PY_CAS`, `PY_CAS_DEFAUT`. Aucune phrase de sortie : il n'y en a pas besoin. `Ajoute un motif par défaut.` est **refusé** — `case _` n'est pas un défaut atteint après une traversée, et le mot induirait la règle du C |
| **D6** dictionnaires selon leur propre contrat | six intentions. Les classes restent dehors : elles méritent leur domaine |
| **D11** fichiers avec `with` | `PY_AVEC_FICHIER` en lecture et en écriture, `PY_LIRE_LIGNES`. L'information dit que la fermeture est un **ajout du langage** |
| **D12** lecture et conversion distinctes | `PY_LIRE_LIGNES` puis `PY_CONVERSION`. Aucune phrase ne fait les deux |

## 5. Les endroits où Python offrait une valeur par défaut

Cinq, tous écartés, chacun avec son commentaire dans le code :

| Tentation | Ce que C-A fait |
|---|---|
| `range(n)` à un argument | **refusé** : il sous-entend un zéro |
| le `sep` de `print` | écrit dans la phrase : `Affiche a et b séparés par le texte " ".` |
| `input("invite")` | **rien** : une invite serait un texte que personne n'a écrit |
| `dict.get(cle)` | **non écrit** : il rendrait `None` en silence. L'accès direct lève `KeyError`, et l'information le dit |
| `except:` nu | **refusé** : il attrape tout, interruption au clavier comprise, et ne se diagnostique pas |

Et deux choix de rendu qui refusent de réécrire l'étudiant :

- **aucune majuscule n'est imposée** au nom d'une valeur fixe par convention :
  la convention est une convention ;
- une f-chaîne dont le texte ne contient pas le champ nommé est **refusée** :
  C-A n'ajoute pas un champ au texte, et n'en déduit aucun.

## 6. Vingt-six informations de plus, dont trois qui corrigent le C17

Quarante-six au total pour Python. Les trois qui comptent le plus ne décrivent
pas Python — elles **corrigent une règle apprise en C**, et un test l'exige :

| Information | Ce qu'elle corrige |
|---|---|
| `PY_MATCH_DOES_NOT_FALL_THROUGH` | l'inverse exact de `SWITCH_FALLTHROUGH` : « si vous venez du C, c'est la règle à oublier » |
| `PY_WITH_CLOSES_FOR_YOU` | l'inverse de `FILE_MUST_BE_CLOSED`, en disant que c'est le **langage** qui ferme |
| `PY_INDEX_CAN_BE_NEGATIVE` | en C17 un indice négatif lit hors du tableau ; en Python il compte depuis la fin |

Un test impose que **chaque** intention native porte au moins une
information, qu'aucune ne soit un ordre déguisé, et qu'aucun message ne
contienne du Python prêt à recopier.

## 7. Preuve : un second programme, exécuté

`node exercice/python/natif2.mjs` → `exercice/python/ca/collections.py`.

| Preuve | Chiffre |
|---|---|
| instructions | **54** |
| phrases refusées — rendus refusés — placements refusés | **0 — 0 — 0** |
| retouches manuelles | **0** |
| chemin emprunté | `PythonTranslationSession`, **celui de l'éditeur** |
| informations passives rencontrées | **26** distinctes |
| exécution `python3` | code 0 |
| sortie | conforme au calcul fait à la main |

Le programme calcule une moyenne depuis un **dictionnaire**, joint une liste
de clés, attrape une `KeyError` sur une clé absente, filtre par `match`,
dépaquette un tuple, élève à une puissance, compte les éléments d'un
**ensemble** qui a perdu son doublon, met une chaîne en majuscules, construit
une f-chaîne, prend une tranche, lit le dernier élément par un indice négatif,
et **démontre l'aliasing** : un ajout à `copie` fait grandir `noms`.

Cette dernière ligne est la raison d'être de `PY_ALIAS_DE_LISTE` : c'est la
leçon des pointeurs du C, avec les outils de Python, et le programme la
**montre** au lieu de l'affirmer.

Deux programmes Python au total : 41 + 54 = **95 instructions**, 0 retouche,
2 exécutions conformes.

## 8. Mesures

| Mesure | Résultat |
|---|---|
| tests Node | **4 353**, dont 80 nouveaux pour le lot P5 |
| différentiel contre le lot S5 | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |
| intentions que Python sait écrire | **86** : 32 portées + 54 natives |
| en-têtes natifs | 14, tous vérifiés comme finissant par « : » |

## 9. Ce qui n'est pas fait

- **Les classes.** La décision D6 les garde pour un domaine à part, avec leur
  propre contrat, et c'est la bonne place.
- **`PY_SINON_DE_BOUCLE`** — le `else` d'une boucle — n'est **pas** livrée.
  Je maintiens ma recommandation du catalogue proposé : elle coûte plus
  qu'elle ne rend à un débutant, et la décision D4 ne la mentionne pas.
- **`PY_BOUCLE_PUIS_TEST`** non livrée, et sans formulation proposée : elle
  demanderait de restructurer le corps.
- **Le texte en valeur**, hors de l'ajout à une liste : insérer un texte à une
  position, ou l'écrire comme valeur de clé, n'a pas de formulation.
- **Aucun exercice dicté dans l'IHM réelle** pour Python.
- **Aucune vérification de symboles, de types ni de portées.** Le Python
  produit peut être invalide — une liste parcourue avant d'exister, une clé
  qui n'existe pas. C-A vérifie la forme de la pose, pas la cohérence du
  programme, et c'est vrai en C17 depuis le début.
- **Aucun essai par un utilisateur**, et aucun essai hors Windows.
