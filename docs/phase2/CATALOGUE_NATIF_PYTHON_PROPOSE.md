# Catalogue natif Python — **proposition**, pour arbitrage

**Pour qui :** le fondateur. Rien ici n'est implémenté. Ce document donne, pour
chaque intention **native** proposée, sa **formulation française exacte**, le
**Python exact** qu'elle produirait, la **décision** dont elle dépend, et
l'**information passive** qu'elle exige.

> C'est le document qui manquait. `docs/CATALOGUE_PYTHON.md` dit ce que les
> intentions du catalogue **C** deviennent en Python — 32 portées, 52
> refusées. Il ne dit rien du catalogue **pédagogique** de Python, et c'est
> pourtant là qu'est le travail : « Python doit posséder son propre catalogue
> pédagogique, adapté à ses concepts natifs. »
>
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 0. Une correction de comptage, d'abord

`docs/phase2/INVENTAIRE_PYTHON.md` annonçait « **31** intentions nouvelles ».
Le compte réel de ses propres tableaux est **55**. Les deux chiffres étaient
dans le même document, et personne ne les avait additionnés — moi compris.

| Chiffre | Valeur mesurée |
|---|---|
| intentions natives proposées | **55** |
| dont bloquées par une décision ouverte | **10** |
| dont libres dès maintenant | **45** |
| portées depuis C-A (lot P3) | **32** |
| **total si tout était livré** | **87** |

La cible « ~70 intentions pour une V1 » suppose donc un **choix** : garder les
32 portées et environ 38 natives sur les 55 proposées. Le jalon intermédiaire de 45 accepté par le
fondateur correspond aux 32 portées plus **13** natives, et la section 11
propose lesquelles.

Les noms `PY_*` sont des **identifiants de travail**, pas des mots que
l'utilisateur tape. Un test vérifie qu'aucun nom n'existe dans un document et
pas dans l'autre.

---

## 1. Valeurs, noms, affichage — 5 intentions, 0 bloquée

| Nom | Formulation française exacte | Python produit |
|---|---|---|
| `PY_INIT_STR` | `Crée une chaîne nommée nom avec le texte "Ada".` | `nom: str = "Ada"` |
| `PY_INIT_BOOL` | `Crée un booléen nommé actif de valeur vrai.` | `actif: bool = True` |
| `PY_INIT_NONE` | `Crée un nom appelé resultat sans valeur.` | `resultat = None` |
| `PY_INPUT` | `Lis une saisie dans reponse.` | `reponse = input()` |
| `PY_PRINT_PLUSIEURS` | `Affiche a et b séparés par le texte " ".` | `print(a, b, sep=" ", end="")` |

**Points d'attention.** `PY_INIT_NONE` écrit `None`, qui *est* une valeur : la
phrase dit « sans valeur » et l'information devra corriger cette intuition —
`None` est l'objet qui représente l'absence, pas l'absence. C'est la seule
formulation où le français et le langage ne disent pas tout à fait la même
chose, et je recommande de la livrer **avec** son information ou pas du tout.

`PY_PRINT_PLUSIEURS` exige le séparateur **dans la phrase** : `sep` a une
valeur par défaut en Python (une espace), et la laisser implicite violerait la
règle 3.

Informations requises : `PY_NONE_IS_A_VALUE`, `PY_INPUT_IS_ALWAYS_A_STRING`,
`PY_BOOL_IS_AN_INT` (en Python, `True + True` vaut 2).

## 2. Types et expressions — 6 intentions, 2 bloquées

| Nom | Formulation française exacte | Python produit | Décision |
|---|---|---|---|
| `PY_DIV_ENTIERE` | `Affecte à q le quotient entier de "a" par "b".` | `q = a // b` | **D3** |
| `PY_DIV_REELLE` | `Affecte à q le quotient réel de "a" par "b".` | `q = a / b` | **D3** |
| `PY_PUISSANCE` | `Affecte à p le résultat de "a" élevé à la puissance "b".` | `p = a ** b` | — |
| `PY_LONGUEUR` | `Affecte à n le nombre d’éléments de notes.` | `n = len(notes)` | — |
| `PY_TYPE_DE` | `Affiche le type de valeur.` | `print(type(valeur), end="")` | — |
| `PY_CONVERSION` | `Affecte à n l’entier obtenu de texte.` | `n = int(texte)` | — |

**Le modulo manque à cette liste, et c'est volontaire :** la décision **D13**
n'est pas prise. S'il est au programme, il lui faut la même paire que la
division — `PY_MODULO` (`a % b`, arrondi vers le bas) avec son information —
et surtout pas un portage silencieux de `%`.

`PY_CONVERSION` lève une exception sur un texte non numérique :
l'information `PY_CONVERSION_CAN_RAISE` est **obligatoire**, sinon la phrase
laisse croire qu'une conversion réussit toujours. Règle 6.

## 3. Décisions — 5 intentions, 3 bloquées

| Nom | Formulation française exacte | Python produit | Décision |
|---|---|---|---|
| `PY_APPARTIENT` | `Crée un bloc si "x" appartient à notes.` | `if x in notes:` | — |
| `PY_EST_NONE` | `Crée un bloc si resultat est sans valeur.` | `if resultat is None:` | — |
| `PY_MATCH` | `Crée un filtrage sur "jour".` | `match jour:` | **D5** |
| `PY_CAS` | `Ajoute un motif pour la valeur 5.` | `case 5:` | **D5** |
| `PY_CAS_DEFAUT` | `Ajoute le motif qui accepte tout.` | `case _:` | **D5** |

`PY_CAS_DEFAUT` ne s'appelle pas « cas par défaut » : `case _` n'est pas un
défaut, c'est un motif qui filtre tout. Le mot « défaut » amènerait l'étudiant
à y voir le `default` de C, qui est atteint **après** une traversée.

Information requise : `PY_MATCH_DOES_NOT_FALL_THROUGH` — et elle doit dire
l'inverse exact de `SWITCH_FALLTHROUGH` du catalogue C, sans quoi l'étudiant
qui passe du C à Python gardera la mauvaise règle.

`PY_EST_NONE` écrit `is`, pas `==` : la différence identité / égalité est une
leçon à part entière, et `PY_IS_IS_IDENTITY` doit l'énoncer.

## 4. Boucles — 4 intentions, 1 bloquée

| Nom | Formulation française exacte | Python produit | Décision |
|---|---|---|---|
| `PY_POUR_CHAQUE` | `Crée une boucle pour chaque note de notes.` | `for note in notes:` | — |
| `PY_POUR_INTERVALLE` | `Crée une boucle pour i de 0 jusqu’avant 10.` | `for i in range(0, 10):` | **D4** |
| `PY_POUR_INDICE_ET_VALEUR` | `Crée une boucle pour l’indice i et la valeur note de notes.` | `for i, note in enumerate(notes):` | — |
| `PY_SINON_DE_BOUCLE` | `Ajoute une branche sinon de boucle.` | `else:` | — |

**« jusqu'avant 10 »** est laid, et c'est le but : `range(0, 10)` ne contient
pas 10, et aucune formulation élégante ne dit cela sans mentir. « de 0 à 10 »
produirait une erreur d'une unité chez tout débutant. Je recommande de garder
la formulation lourde et de laisser l'information
`PY_RANGE_EXCLUDES_THE_END` l'expliquer.

`PY_SINON_DE_BOUCLE` est propre à Python et presque toujours mal comprise :
le `else` d'une boucle s'exécute **si** la boucle n'a pas été interrompue par
`break`. L'information `PY_LOOP_ELSE_MEANS_NO_BREAK` est obligatoire. Si la
notion paraît trop coûteuse pour ce qu'elle rend, je recommande de **ne pas
la livrer** : c'est la seule de la liste dont je doute qu'elle aide un
débutant.

## 5. Séquences — 9 intentions, 1 bloquée

| Nom | Formulation française exacte | Python produit | Décision |
|---|---|---|---|
| `PY_LISTE_VIDE` | `Crée une liste vide nommée notes.` | `notes: list = []` | — |
| `PY_LISTE_VALEURS` | `Crée une liste nommée notes avec les valeurs "12", "15" et "9".` | `notes: list = [12, 15, 9]` | **D7** |
| `PY_AJOUTER` | `Ajoute "12" à la fin de notes.` | `notes.append(12)` | — |
| `PY_INSERER` | `Insère "12" à la position "0" de notes.` | `notes.insert(0, 12)` | — |
| `PY_RETIRER` | `Retire l’élément à la position "0" de notes.` | `del notes[0]` | — |
| `PY_TRANCHE` | `Affecte à debut la tranche de notes de "0" jusqu’avant "3".` | `debut = notes[0:3]` | — |
| `PY_INDICE_NEGATIF` | `Affiche le dernier élément de notes.` | `print(notes[-1], end="")` | — |
| `PY_TUPLE` | `Crée un tuple nommé point avec les valeurs "1" et "2".` | `point: tuple = (1, 2)` | — |
| `PY_DEPAQUETER` | `Affecte à x et y les valeurs de point.` | `x, y = point` | — |

`PY_LISTE_VIDE` est **la pièce qui manque le plus** aujourd'hui : sans elle,
`ARRAY_ASSIGN_INT` est portée mais inutilisable, puisque rien ne peut créer la
liste. C'est la conséquence la plus concrète d'une décision en attente, et
elle est mesurée : l'exercice du lot P3 n'utilise aucune liste.

`PY_RETIRER` écrit `del`, pas `remove` : `remove` cherche une **valeur**,
`del` retire une **position**. La phrase dit « à la position », donc `del`.
Une phrase séparée pour `remove` serait `Retire la première occurrence de
"12" dans notes.` — je ne la propose pas au premier jet : deux manières de
retirer, apprises ensemble, se confondent.

Informations requises : `PY_LIST_GROWS`, `PY_INDEX_CAN_BE_NEGATIVE`,
`PY_SLICE_COPIES`, `PY_TUPLE_IS_IMMUTABLE`, `PY_DEL_SHIFTS_THE_REST`.

## 6. Dictionnaires et ensembles — 6 intentions, 0 bloquée

Domaine **entièrement neuf** : aucune intention de C-A ne s'y applique, et
c'est l'un des plus utiles de Python.

| Nom | Formulation française exacte | Python produit |
|---|---|---|
| `PY_DICT_VIDE` | `Crée un dictionnaire vide nommé notes.` | `notes: dict = {}` |
| `PY_DICT_PAIRES` | `Crée un dictionnaire nommé notes avec la clé "ada" valant "15".` | `notes: dict = {"ada": 15}` |
| `PY_DICT_LIRE` | `Affecte à n la valeur de la clé "ada" de notes.` | `n = notes["ada"]` |
| `PY_DICT_ECRIRE` | `Affecte "15" à la clé "ada" de notes.` | `notes["ada"] = 15` |
| `PY_DICT_PARCOURIR` | `Crée une boucle pour la clé nom et la valeur note de notes.` | `for nom, note in notes.items():` |
| `PY_ENSEMBLE` | `Crée un ensemble nommé vus avec les valeurs "1" et "2".` | `vus: set = {1, 2}` |

`PY_DICT_LIRE` lève `KeyError` sur une clé absente :
`PY_MISSING_KEY_RAISES` est obligatoire. Je ne propose **pas** `get` au
premier jet, parce que `get` renvoie `None` en silence — exactement le genre
de complétion implicite que ce projet refuse d'enseigner comme un réflexe.

`PY_DICT_PAIRES` et `PY_ENSEMBLE` écrivent tous deux des accolades, et c'est
une confusion classique : `{}` vide est un **dictionnaire**, pas un ensemble.
`PY_EMPTY_BRACES_IS_A_DICT` doit le dire, et c'est pourquoi `PY_ENSEMBLE`
n'a pas de variante vide dans cette proposition — `set()` demanderait sa
propre phrase.

## 7. Chaînes — 6 intentions, 0 bloquée

| Nom | Formulation française exacte | Python produit |
|---|---|---|
| `PY_CONCATENER` | `Affecte à phrase le texte de debut suivi de fin.` | `phrase = debut + fin` |
| `PY_DECOUPER` | `Affecte à mots les morceaux de phrase séparés par le texte " ".` | `mots = phrase.split(" ")` |
| `PY_JOINDRE` | `Affecte à phrase les éléments de mots joints par le texte " ".` | `phrase = " ".join(mots)` |
| `PY_MAJUSCULES` | `Affecte à cri le texte de phrase en majuscules.` | `cri = phrase.upper()` |
| `PY_NETTOYER` | `Affecte à propre le texte de phrase sans les espaces des extrémités.` | `propre = phrase.strip()` |
| `PY_FORMATER` | `Affecte à ligne le texte "Bonjour {nom}" avec le champ nom valant nom.` | `ligne = f"Bonjour {nom}"` |

`PY_JOINDRE` est la formulation la plus contre-intuitive du lot : en Python,
c'est le **séparateur** qui joint la liste, pas la liste qui se joint. La
phrase française met volontairement les éléments en premier, et
`PY_JOIN_IS_ON_THE_SEPARATOR` doit expliquer l'inversion — sinon l'étudiant
écrira `mots.join(" ")` dans son propre code et ne comprendra pas l'erreur.

`PY_FORMATER` exige que **chaque champ** de la f-chaîne soit nommé dans la
phrase. Une f-chaîne dont les champs seraient déduits du texte serait une
complétion implicite, et l'analyse du texte entre guillemets est déjà
interdite ailleurs.

`PY_MAJUSCULES` : les méthodes de casse de Python ne sont pas réversibles sur
toutes les langues (`'ß'.upper()` donne `'SS'`). L'information
`PY_CASE_IS_NOT_REVERSIBLE` évite d'enseigner une bijection fausse.

## 8. Fonctions — 3 intentions, 0 bloquée

| Nom | Formulation française exacte | Python produit |
|---|---|---|
| `PY_PARAM_NOMME` | `Appelle somme avec le paramètre a valant "1" et le paramètre b valant "2".` | `somme(a=1, b=2)` |
| `PY_RETOUR_MULTIPLE` | `Retourne les résultats de "a" et "b".` | `return a, b` |
| `PY_PARAM_DEFAUT` | `Crée une fonction nommée salue qui ne retourne rien et prend un str nommé nom valant "Ada".` | `def salue(nom: str = "Ada") -> None:` |

`PY_PARAM_DEFAUT` est le seul endroit du projet où le mot « défaut »
apparaît, et il ne contredit pas la règle 3 : **la valeur est dans la
phrase**. L'information `PY_DEFAULT_IS_EVALUATED_ONCE` est obligatoire, parce
que la valeur par défaut est évaluée à la définition — le piège de la liste
mutable partagée entre deux appels est l'un des plus coûteux de Python.

`PY_RETOUR_MULTIPLE` retourne un **tuple** : `PY_MULTIPLE_RETURN_IS_A_TUPLE`
doit le dire, sinon l'étudiant croit que Python retourne deux valeurs.

## 9. Fichiers, erreurs, modules — 7 intentions, 2 bloquées

| Nom | Formulation française exacte | Python produit | Décision |
|---|---|---|---|
| `PY_AVEC_FICHIER` | `Crée un bloc avec le fichier "notes.txt" ouvert en lecture nommé f.` | `with open("notes.txt", "r") as f:` | **D11** |
| `PY_LIRE_LIGNES` | `Crée une boucle pour chaque ligne de f.` | `for ligne in f:` | **D11** |
| `PY_ESSAYER` | `Crée un bloc à essayer.` | `try:` | — |
| `PY_SAUF` | `Ajoute une branche en cas d’erreur de type ValueError.` | `except ValueError:` | — |
| `PY_LEVER` | `Lève une erreur de type ValueError avec le texte "note invalide".` | `raise ValueError("note invalide")` | — |
| `PY_IMPORTER` | `Importe le module math.` | `import math` | — |
| `PY_IMPORTER_DE` | `Importe sqrt du module math.` | `from math import sqrt` | — |

`with` **ferme le fichier sans qu'on le demande.** C'est un ajout du
**langage**, pas de C-A, et `PY_WITH_CLOSES_FOR_YOU` doit le dire
explicitement : sinon l'étudiant conclut que fermer un fichier n'existe pas,
et il se trompera dès qu'il ouvrira un fichier sans `with`.

`PY_SAUF` exige un **type d'erreur écrit**. Un `except:` nu attrape tout, y
compris l'interruption au clavier, et ne se diagnostique pas : je recommande
de **ne jamais** le rendre atteignable, à aucun palier.

## 10. Les quatre intentions nommées par les refus de portage

Elles apparaissent dans `docs/phase2/DECISIONS_PYTHON.md` et dans les raisons
de refus, et elles n'étaient dans aucun tableau de domaine.

| Nom | Formulation française exacte | Python produit | Décision |
|---|---|---|---|
| `PY_SI_PRINCIPAL` | `Crée le point d’entrée principal.` | `if __name__ == "__main__":` | **D2** |
| `PY_ALIAS_DE_LISTE` | `Crée un nom appelé copie qui désigne la même liste que notes.` | `copie = notes` | — |
| `PY_CONSTANTE_PAR_CONVENTION` | `Crée une valeur fixe par convention nommée TAILLE de valeur 10.` | `TAILLE = 10` | — |
| `PY_BOUCLE_PUIS_TEST` | *aucune formulation proposée* | — | — |

`PY_ALIAS_DE_LISTE` est la pièce qui remplace les pointeurs, et sa
formulation doit dire **« la même liste »**, pas « une copie » : tout le sens
pédagogique est là. `PY_ALIASING_IS_NOT_A_COPY` est obligatoire.

`PY_CONSTANTE_PAR_CONVENTION` : le nom de l'intention porte le mot
« convention » parce que rien n'empêche de réaffecter `TAILLE`.
`PY_CONSTANT_IS_ONLY_A_CONVENTION` doit le dire, sans quoi la phrase promet
une protection que le langage ne donne pas.

**`PY_BOUCLE_PUIS_TEST` n'a pas de formulation, et je recommande de ne pas en
chercher une.** Elle remplacerait `do … while`, qui n'existe pas en Python :
l'écrire demanderait une boucle `while True` et une sortie conditionnelle —
deux instructions pour une phrase, donc une restructuration que C-A n'a pas le
droit de faire. La compétence s'enseigne en composant deux phrases existantes,
comme le parcours de chaîne du lot 16 : **composé, pas commandé**.

## 11. Ce que je recommande pour le jalon de 45 intentions

32 portées (lot P3) + **13** natives, choisies sur un seul critère : rendre
possible un programme complet, pas couvrir un domaine.

| Ordre | Intention | Pourquoi elle est indispensable |
|---|---|---|
| 1 | `PY_LISTE_VIDE` | sans elle, l'indexation portée est inutilisable |
| 2 | `PY_LISTE_VALEURS` | une séquence de contenu connu, valeurs **écrites** (D7) |
| 3 | `PY_AJOUTER` | la seule façon de faire grandir une liste |
| 4 | `PY_LONGUEUR` | parcourir suppose connaître le nombre d'éléments |
| 5 | `PY_POUR_INTERVALLE` | la répétition bornée, qui remplace `FOR` (D4) |
| 6 | `PY_POUR_CHAQUE` | le parcours naturel de Python |
| 7 | `PY_DIV_ENTIERE` | débloque les expressions avec `/` (D3) |
| 8 | `PY_DIV_REELLE` | la paire est indissociable |
| 9 | `PY_INIT_STR` | une chaîne, que `STRING_INIT` ne peut pas porter |
| 10 | `PY_INIT_BOOL` | une condition se range dans un nom |
| 11 | `PY_CONVERSION` | lire une saisie ou un fichier sans convertir ne sert à rien |
| 12 | `PY_INPUT` | un programme qui ne lit rien n'enseigne qu'une moitié |
| 13 | `PY_SI_PRINCIPAL` | la convention d'entrée, dite comme une convention (D2) |

Ce jalon laisse **dehors** les dictionnaires, les ensembles, les méthodes de
chaînes, `match`, `with`, les exceptions et les tuples. C'est un choix : un
programme complet avec peu de notions vaut mieux qu'une couverture large dont
rien ne se tient.

**Quatre décisions suffisent à ouvrir ce jalon : D2, D3, D4 et D7.**

## 12. Les informations passives que cette proposition exige

Vingt-quatre, nommées dans les sections ci-dessus. Trois d'entre elles ne sont
pas des précisions mais des **corrections d'une règle apprise en C**, et ce
sont les plus importantes :

| Information | Ce qu'elle corrige |
|---|---|
| `PY_MATCH_DOES_NOT_FALL_THROUGH` | l'inverse exact de `SWITCH_FALLTHROUGH` |
| `PY_WITH_CLOSES_FOR_YOU` | l'inverse de `FILE_MUST_BE_CLOSED` |
| `PY_INT_IS_UNBOUNDED` | annule ce que `limits.h` enseigne (déjà livrée au lot P3) |

Un étudiant qui passe du C à Python garde ses règles. Une information qui se
contente de décrire Python, sans dire **ce qui change**, le laissera se
tromper avec confiance.
