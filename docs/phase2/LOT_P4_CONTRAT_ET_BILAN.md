# Lot P4 — les premières intentions **natives** de Python

Contrat et bilan dans le même document. C'est le premier lot où Python écrit
du code qu'aucune phrase du catalogue C ne sait demander : le catalogue
pédagogique de Python commence ici.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Ce que le lot livre

| Livrable | Où |
|---|---|
| 14 intentions natives, 16 formulations françaises | `src/langages/python/instructions.ts` |
| leur rendu, séparé de leur analyse | `src/langages/python/renduNatif.ts` |
| 13 informations pédagogiques passives de plus | `src/langages/python/informations.ts` |
| le catalogue natif branché au registre | champ `natif` de `Langage` |
| les trois voies de résolution, dans l'ordre | `extension/src/sessionPython.ts` |
| un programme de **41 instructions**, écrit par la session de l'hôte et **exécuté** | `exercice/python/natif.mjs` |
| le catalogue engendré depuis le moteur | `docs/CATALOGUE_PYTHON.md` §0 |

## 2. La propriété qui garantit que le moteur C17 n'a pas bougé

`src/langages/python/instructions.ts` **n'est appelé par personne dans
`src/translate.ts`**. C'est la seule garantie qui vaille : une phrase écrite
dans un `.c` ne peut pas atteindre ce module, parce qu'aucun chemin ne l'y
mène.

Deux tests la fixent dans les deux sens :

- pour chacune des 16 formulations natives, `translate(phrase)` doit
  **refuser**. Si le moteur en acceptait une, elle serait masquée en Python
  **et** écrirait du C ;
- un scénario hôte écrit `Crée une liste vide nommée notes.` dans un `.c` et
  vérifie le refus.

Différentiel contre le lot P4a : **1 335 559 comparaisons, 0 régression,
0 extension, 0 capacité perdue.** Le lot est entièrement additif.

## 3. Les trois voies, et leur ordre

`PythonTranslationSession.resoudre()` est la seule fonction qui décide de quel
catalogue vient une phrase. L'ordre est le contrat :

1. **le catalogue partagé**, toujours d'abord. Une phrase qu'il accepte ne
   traverse ni le catalogue natif ni la couche de variantes : elle se comporte
   donc exactement comme en C17, au rendu près ;
2. **le catalogue natif** de Python. `undefined` veut dire « ce n'est pas une
   de mes phrases », et il ne faut pas le confondre avec un refus : dans le
   premier cas, le diagnostic du catalogue partagé est celui que l'utilisateur
   doit lire, et il est conservé ;
3. **la couche de variantes**, et seulement si l'utilisateur l'a activée.

La distinction 2 est ce qui demande le plus de soin. `Affecte à x le résultat
de "a +".` commence par des mots que le module natif connaît ; il **décline**
quand la queue de phrase n'est aucune des siennes, et le diagnostic
d'expression du moteur survit. Un test le vérifie sur trois phrases.

**Limite connue :** la couche de variantes ne connaît que le catalogue
partagé. `Créer une liste vide nommée notes.` — à l'infinitif — n'est donc pas
reconnue. C'est le travail du lot S5, qui doit rendre l'arbitre paramétrable.

## 4. Les quatorze intentions

| Formulation française exacte | Python produit |
|---|---|
| `Crée une liste vide nommée notes.` | `notes: list = []` |
| `Crée une liste nommée notes avec les valeurs "12", "15" et "9".` | `notes: list = [12, 15, 9]` |
| `Ajoute "18" à la fin de notes.` | `notes.append(18)` |
| `Affecte à nombre le nombre d'éléments de notes.` | `nombre = len(notes)` |
| `Crée une boucle pour i de "0" jusqu'avant "10".` | `for i in range(0, 10):` |
| `Crée une boucle pour chaque note de notes.` | `for note in notes:` |
| `Affecte à q le quotient entier de "total" par "nombre".` | `q = (total // nombre)` |
| `Affecte à q le quotient réel de "total" par "nombre".` | `q = (total / nombre)` |
| `Affecte à r le reste entier de "total" par "nombre".` | `r = (total % nombre)` |
| `Crée une chaîne nommée nom avec le texte "Ada".` | `nom: str = "Ada"` |
| `Crée un booléen nommé actif de valeur vrai.` | `actif: bool = True` |
| `Affecte à n l'entier obtenu de texte.` | `n = int(texte)` |
| `Lis une saisie dans reponse.` | `reponse = input()` |
| `Crée le point d'entrée principal.` | `if __name__ == "__main__":` |

Trois conversions — entier, réel, texte — pour une seule intention : d'où
16 formulations pour 14 intentions.

### Un écart assumé avec la proposition validée

La proposition écrivait `Crée une boucle pour i de 0 jusqu'avant 10.`, avec
des **entiers nus**. Livré, c'est `de "0" jusqu'avant "10"`, avec des
expressions entre guillemets.

Raison : des entiers nus interdiraient `jusqu'avant "nombre"`, donc toute
boucle dont la borne est calculée — c'est-à-dire presque toutes. Et les
guillemets délimitent une expression **partout ailleurs** dans le catalogue ;
en faire une exception ici aurait été une incohérence de plus à retenir.
C'est une décision technique locale, et le programme d'exercice s'en sert :
`for i in range(0, nombre):`.

## 5. Les décisions validées, appliquées

| Décision | Ce que le lot en a fait |
|---|---|
| **D1** aucune initialisation inventée | `Crée une liste nommée notes.` est **refusée** : ni le contenu ni l'intention « vide » n'y sont. Le message ne montre aucun contenu possible |
| **D2** point d'entrée natif | `PY_SI_PRINCIPAL`, avec `PY_MAIN_IS_A_CONVENTION` : « rien ne l'appelle automatiquement » |
| **D3** deux quotients distingués, arrondi documenté | deux phrases, et `PY_FLOOR_DIVISION_ROUNDS_DOWN` dit `-7 // 2` vaut **-4** là où C17 écrirait -3. `Affecte à q le quotient de …` sans sa qualité est **refusé** : choisir serait décider à la place de l'étudiant |
| **D4** boucles natives | `range` et le parcours de collection. La formulation « jusqu'avant » est lourde **exprès**, et `PY_RANGE_EXCLUDES_THE_END` explique pourquoi |
| **D7** listes natives, initialisation explicite | liste vide ou valeurs écrites. `[0] * 10` n'existe nulle part |
| **D13** modulo natif, sémantique dite | `PY_MODULO` et `PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN` : « le reste prend le signe du **diviseur** : `-7 % 2` vaut 1, là où C17 donne -1 » |

D5, D6, D11 et D12 ouvrent des domaines entiers — `match`, dictionnaires et
classes, fichiers avec `with`, exceptions. Ils sont le lot P5.

## 6. Aucun ajout implicite, les trois endroits où Python en offrait un

| Tentation du langage | Ce que C-A fait |
|---|---|
| `range(n)` à un seul argument | **refusé** : il sous-entend un zéro que personne n'a écrit. Les deux bornes sont dans la phrase |
| le `sep` de `print` | déjà écarté au lot P3 ; `end=""` partout, sans exception |
| `pass` dans un bloc vide | **rien** n'est écrit. Le fichier est incomplet jusqu'à ce que l'étudiant écrive le corps, et `PY_BLOCK_NEEDS_A_BODY` le dit |
| une invite dans `input()` | **rien** : une invite serait un texte que personne n'a écrit. Pour en afficher une, il y a une phrase d'affichage |

Et un refus qui n'était pas prévu : un **mot réservé de Python** ne peut pas
nommer, même dans une phrase native. `lambda`, `pass`, `None`, `class` sont
des identifiants **C17 parfaitement valides** — le moteur les accepte, et
c'est au langage cible de les refuser. Le garde vit donc dans
`src/langages/python/`, jamais dans `src/`.

## 7. Treize informations passives de plus

Vingt au total pour Python. Les nouvelles :

`PY_LIST_GROWS`, `PY_LIST_IS_MUTABLE`, `PY_RANGE_EXCLUDES_THE_END`,
`PY_LOOP_VARIABLE_SURVIVES`, `PY_FLOOR_DIVISION_ROUNDS_DOWN`,
`PY_REAL_DIVISION_IS_ALWAYS_REAL`, `PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN`,
`PY_LEN_IS_NOT_SIZEOF`, `PY_INPUT_IS_ALWAYS_A_STRING`,
`PY_CONVERSION_CAN_RAISE`, `PY_BOOL_IS_AN_INT`, `PY_MAIN_IS_A_CONVENTION`,
`PY_ITERATING_WHILE_MODIFYING`.

Trois d'entre elles **corrigent une règle apprise en C**, et ce sont les plus
utiles : l'arrondi du quotient entier, le signe du reste, et le fait que `len`
n'est pas `sizeof`. Un étudiant qui passe du C à Python garde ses règles ; une
information qui se contente de décrire Python le laisserait se tromper avec
confiance.

Un test impose que **chaque** intention native porte au moins une information,
et qu'aucune ne soit un ordre déguisé.

## 8. Preuve : un programme Python natif, par le chemin de l'éditeur

`node exercice/python/natif.mjs` → `exercice/python/ca/moyennes.py`.

| Preuve | Chiffre |
|---|---|
| instructions | **41** |
| phrases refusées — rendus refusés — placements refusés | **0 — 0 — 0** |
| retouches manuelles | **0** |
| chemin emprunté | `PythonTranslationSession`, **celui de l'éditeur** |
| informations passives rencontrées | **16** distinctes |
| exécution `python3` | code 0 |
| sortie | conforme au calcul fait à la main |

Deux différences avec le générateur du lot P3, et elles comptent :

1. il passe par la **session de l'hôte** — résolution des trois catalogues,
   placement, plan, aperçu, confirmation, et vérification que le texte
   appliqué est **exactement** celui que l'aperçu montrait. Appeler les
   modules un par un ne prouve pas le chemin de l'éditeur ;
2. il emploie les intentions **natives** : liste, `append`, `len`, parcours,
   `range`, les deux quotients, le reste, un booléen. Le programme du lot P3
   n'avait aucune liste, faute de pouvoir en créer une.

Le programme calcule la somme et les moyennes de quatre notes, affiche chaque
note par son indice, et choisit une branche selon la moyenne. Le calcul fait à
la main : `[12, 15, 9, 18]`, somme 54, `54 // 4 = 13`, `54 % 4 = 2`,
`54 / 4 = 13.50`.

**Une note d'honnêteté sur l'exécution :** `PYTHONIOENCODING=utf-8` est imposé
au processus. Sur Windows, `python` écrit sa sortie dans l'encodage de la
console, et un « è » y devient illisible. Le programme produit est en UTF-8 ;
ce n'est pas une retouche du code, c'est un réglage de la mesure, et le script
le dit en commentaire.

## 9. Mesures

| Mesure | Résultat |
|---|---|
| tests Node | **4 085**, dont 38 nouveaux pour le catalogue natif |
| différentiel contre le lot P4a | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |
| intentions que Python sait écrire | **46** : 32 portées + 14 natives |
| tests hôte VS Code | **non exécutés — bloqués**, voir ci-dessous |

### Les quatre scénarios hôte sont écrits, et n'ont PAS été exécutés

Quatre scénarios ont été ajoutés à `test/vscode/suite.cjs` : insertion d'une
intention native avec son information, curseur dans le corps d'une boucle
native, refus d'une liste sans contenu, et refus d'une phrase native dans un
`.c`. Ils passent le contrôle de syntaxe (`node --check`), et **ils n'ont pas
tourné**.

Cause, mesurée : l'hôte refuse de démarrer sur
`checkInnoSetupMutex: vscode-updating is held`. Une mise à jour de VS Code est
en attente d'application, et le mutex est détenu par **l'instance que le
fondateur utilise en ce moment** — 38 processus `Code.exe`, un seul chemin,
tous démarrés à la même minute. Aucun processus d'installateur orphelin cette
fois : le diagnostic du 15 novembre, qui en avait trouvé deux, ne s'applique
pas.

**Je n'ai pas arrêté ces processus.** C'est l'éditeur de travail du fondateur,
et cette session s'exécute dedans. Le déblocage demande un geste qui lui
appartient : fermer VS Code pour que la mise à jour s'applique, puis
`npm run test:vscode`.

Ce qui tient donc : les **109 tests hôte au vert** du lot P4a, qui couvrent
Python dans l'éditeur — insertion, refus du langage cible, réglage, fins de
ligne, pas d'indentation. Ce qui n'est pas prouvé : les quatre scénarios
natifs. Dit comme tel, parce qu'« une suite qu'on ne peut pas exécuter ne
protège de rien » — et qu'annoncer un chiffre non mesuré serait pire que de
l'annoncer manquant.

## 10. Ce qui n'est pas fait

- **41 des 55 intentions natives proposées** restent à écrire :
  dictionnaires, ensembles, méthodes de chaînes, tuples, `match`, `with`,
  exceptions, paramètres nommés. C'est le lot P5.
- **La couche de variantes ignore le catalogue natif.** Une formulation
  native à l'infinitif n'est pas reconnue. Lot S5.
- **Aucun exercice dicté dans l'IHM réelle** pour Python, comme
  `docs/TEST_VSCODE_DICTEE.md` le fait pour le C.
- **Aucune vérification de symboles, de types ni de portées.** Le Python
  produit peut être invalide : un nom non défini, une liste parcourue avant
  d'exister. C-A vérifie la forme de la pose, pas la cohérence du programme.
  C'est vrai en C17 depuis le début, et ça reste vrai ici.
- **Aucun essai par un utilisateur**, et aucun essai hors Windows.
