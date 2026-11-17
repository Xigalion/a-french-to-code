# Lot P3 — les premières intentions Python

Contrat et bilan dans le même document. Le contrat a été écrit d'abord ; les
chiffres sont mesurés, et deux d'entre eux ont corrigé le contrat plutôt que
l'inverse.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Périmètre, et pourquoi il n'est pas celui du plan

Le plan annonçait pour P3 « les 17 intentions communes ». Deux constats l'ont
déplacé, et les deux sont mesurés :

1. **Les 17 communes ne suffisent pas à écrire un programme qui affiche quoi
   que ce soit.** `PRINT_INT` est classée « adaptable », pas « commune ». Le
   critère de P3 — « un programme Python exécuté, sortie conforme à un calcul
   fait à la main » — était donc inatteignable avec les 17 seules. C'est un
   défaut du plan, pas une surprise du langage.
2. **Le fondateur a validé quatre décisions** le 17 novembre : le caractère
   (D8), les annotations de type (D9), l'absence de séparateur implicite
   (D10) et le respect des différences sémantiques. Les intentions qu'elles
   ouvrent n'attendent plus rien, et la consigne est explicite : « Commence
   les intentions Python dont le contrat est déjà suffisamment défini. »

**P3 porte donc 32 intentions sur 84** :

| Famille | Nombre | Ce qui l'ouvre |
|---|---|---|
| communes | **15** | rien ; elles n'attendaient aucune décision |
| affichage | **9** | décision **D10**, validée |
| caractère | **3** | décision **D8**, validée |
| blocs (`if`, `elif`, `else`, `while`, `def`) | **5** | rien : leur forme Python ne demande aucune décision |

**15 et non 17** : `MEMBER_ASSIGN_INT` et `MEMBER_ASSIGN_EXPRESSION` sont bien
communes par le concept, mais elles désignent un champ de structure, et
Python n'en a pas. Leur refus est **provisoire** et porte la mention
`ATTENTE (décision D6)`. Un test l'impose.

Les **52 autres** sont des refus nommés, chacun avec sa raison écrite.
`32 + 52 = 84`, et un test vérifie la partition : ni trou, ni doublon, ni nom
fantôme.

## 2. Les trois sortes de refus, qui ne se confondent pas

Chaque raison commence par sa sorte, et un test l'exige :

| Sorte | Nombre | Ce qu'elle dit |
|---|---|---|
| `ATTENTE` | 20 | une décision de contrat est ouverte, et elle est **nommée** (D1, D2, D4, D5, D6, D7, D12) |
| `NOTION_ABSENTE` | 22 | la notion n'existe pas en Python ; la compétence, si |
| `FORME_AUTRE` | 10 | la notion existe sous une autre forme, qui demande ses propres phrases |

Et la consigne du fondateur est vérifiée par un test, pas par une intention :

> « Les refus de portage ne doivent pas devenir des interdictions définitives
> d'enseigner les constructions natives équivalentes. »

Chaque raison doit nommer **par quoi la compétence passe** — l'aliasing d'une
liste pour les pointeurs, `len` pour `sizeof` (en disant que c'est une autre
notion), `import` pour `#include`, le dictionnaire puis la classe pour les
structures, `range` pour la boucle à trois clauses. Un test échoue sur toute
raison qui refuse sans dire la suite ; il a d'ailleurs échoué une fois, sur
`FUNC_PROTOTYPE`, et c'est la **raison** qui a été réécrite.

## 3. Ce que le lot refuse à l'intérieur d'une intention portée

Nouveau code de refus au registre : `CONSTRUCTION_NON_PORTEE`. L'intention est
portée, mais ce qu'elle contient ne l'est pas. Cinq cas, tous testés :

| Construction | Refus |
|---|---|
| `/` | `7 / 2` vaut **3** en C17 et **3.5** en Python. Décision D3, ouverte |
| `%` | `-7 % 2` vaut **-1** en C17 et **1** en Python. **Trouvé par ce lot** |
| `&x`, `*p`, `*(t + i)` | Python n'a pas de pointeur ; l'aliasing d'une liste enseigne la même leçon |
| `unsigned int` | les entiers Python sont signés et de précision arbitraire ; écrire `int` perdrait l'information donnée |
| un nom réservé en Python | `lambda`, `None`, `pass` sont des identifiants **C17 valides** : le moteur les accepte, et c'est au langage cible de les refuser |

### Une treizième décision à trancher : le modulo

`%` est le **second** faux ami d'expression, et il n'était pas dans les douze.
Sur un opérande négatif, C17 tronque vers zéro et Python arrondit vers le bas.
La différence est aussi silencieuse que celle de `/`, et elle mérite le même
traitement : refus, puis deux phrases distinctes si la notion est au
programme. Le lot ouvre donc **D13**, avec la même recommandation que D3.

### Les noms réservés : une lacune du moteur, pas de Python

`translate` valide un identifiant contre les mots-clés de **C17**. Rien dans
`src/` ne connaît Python, et c'est voulu. Le garde vit donc dans
`src/langages/python/expression.ts`, et `Crée un entier nommé lambda de
valeur 1.` est traduite par le moteur puis refusée par le langage. C'est la
bonne frontière, et un test la fixe dans les deux sens.

## 4. Aucun ajout implicite — la règle 3 en Python

| Tentation | Ce que C-A fait |
|---|---|
| `pass` dans un bloc vide | **rien**. Le fichier est incomplet jusqu'à ce que l'étudiant écrive le corps, et une information passive le dit. C'est une différence réelle avec C17, où le bloc fermé laisse le fichier compilable |
| le saut de ligne de `print` | `end=""` **partout, sans exception** ; `Affiche un retour à la ligne.` écrit `print("\n", end="")` |
| une valeur pour une déclaration sans valeur | refus (D1) ; aucun zéro n'apparaît nulle part |
| `-> None` déduit | écrit **seulement** quand la phrase dit « qui ne retourne rien » |
| le préfixe `_` d'une fonction interne | refus : c'est une convention de lecture, pas une liaison |
| `hex(x)` pour l'affichage hexadécimal | `f"{x:x}"` : `hex` ajouterait le préfixe `0x` que personne n'a demandé |

Le **parenthésage complet** du C est conservé : `a + b * c` devient
`(a + (b * c))`. Python a ses propres priorités, et s'y fier produirait un
texte où l'étudiant lit autre chose que ce qu'il a écrit.

## 5. Sept informations pédagogiques passives

`src/langages/python/informations.ts`, canal propre à Python. Ce ne sont pas
les ~30 de l'inventaire — c'est P5 qui les écrira toutes — mais celles que les
décisions **déjà validées** exigent : une décision qui dit « avec une
explication de son fonctionnement réel » n'est pas appliquée tant que
l'explication n'existe pas.

`PY_CHAR_IS_A_STRING`, `PY_NO_SEPARATOR_ADDED`, `PY_BLOCK_NEEDS_A_BODY`,
`PY_TRUTHINESS`, `PY_ANNOTATION_NOT_CHECKED`, `PY_INT_IS_UNBOUNDED`,
`PY_NAME_REBINDS`. Toutes atteignables, et un test le vérifie — la garde du
lot 30 appliquée au canal Python.

**Limite assumée :** la portée est la phrase entière. Pointer le mot exact
demande les intervalles de chaque enveloppe française, et c'est du travail de
P5. Poser un intervalle approximatif serait pire que de le dire.

## 6. Preuve : un programme Python écrit par C-A, et exécuté

`node exercice/python/generer.mjs` → `exercice/python/ca/cumul.py`.

| Preuve | Chiffre |
|---|---|
| instructions | **16** |
| phrases refusées | **0** |
| placements refusés | **0** |
| retouches manuelles | **0** |
| exécution `python3` | code 0 |
| sortie | `total = 15` puis `assez` — **conforme au calcul fait à la main** |

Le script **refuse d'écrire le fichier** si une phrase ou un placement est
refusé. La sonde du lot précédent avait justement produit un programme amputé
qui bouclait à l'infini parce qu'une ligne refusée avait été sautée en
silence ; l'erreur ne peut plus se reproduire.

Les fins de ligne sont normalisées avant comparaison, et le journal le dit :
sur Windows, `python` écrit CRLF en mode texte là où le programme écrit LF.
C'est la plateforme, pas le code produit.

Et `test/python.test.mjs` **reconstruit** le `.py` à chaque `npm test` : un
programme commité qui aurait vieilli fait échouer la suite. L'exécution, elle,
demande `python3` et reste un outil, comme GCC.

### Ce que le programme ne peut pas faire, et pourquoi

Il n'utilise **aucune liste**. `ARRAY_DECL` est refusée (D7 : `[0] * 10`
inventerait un zéro), donc rien ne peut créer la liste que
`ARRAY_ASSIGN_INT` saurait modifier. L'indexation est portée et testée, mais
elle n'est pas **utilisable** dans un programme complet avant D7. C'est la
conséquence la plus concrète d'une décision en attente, et elle est mesurée,
pas supposée.

## 7. Un fantôme trouvé, et le garde-fou qui manquait

`NUMERIC_CONVERT` n'existe pas. La conversion explicite n'est pas une
intention : c'est un nœud `cast` **dans** une expression. Le nom vivait
pourtant dans deux documents — la table de `scripts/audit-architecture.mjs`
et `docs/phase2/INVENTAIRE_PYTHON.md` — parce que le script **signalait** les
classes orphelines sans échouer.

Corrigé : le nom est retiré des deux endroits, et l'audit **échoue** désormais
sur toute classe posée pour un nom qui n'est pas un genre. Le garde-fou a été
vérifié en l'armant exprès avec un faux nom : code de sortie 1.

Au même endroit, deux chiffres de l'inventaire étaient faux : les adaptables
sont **37**, pas 22, et il y a **6** intentions de structure de blocs. La
somme exacte est `17 + 37 + 6 + 24 = 84`. Les 17 communes et les 24 propres à
C étaient justes.

## 8. Mesures

| Mesure | Résultat |
|---|---|
| tests Node | **4 030**, dont 51 nouveaux pour P3 |
| différentiel contre le lot S4 | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |
| lignes ajoutées | 4 modules Python (rendu, expression, raisons, informations) + l'inscription |

Le différentiel à zéro est attendu et nécessaire : P3 est **entièrement
additif**. Rien dans `src/translate.ts`, `src/expressionCore.ts` ni les trois
profils n'a été touché, et le profil entier gelé n'a pas bougé d'un caractère.
La seule modification d'un module partagé est l'ajout au registre du champ
`commentaire` — la syntaxe du commentaire de traçabilité est une propriété du
langage, et l'hôte n'a pas à la connaître.

## 9. Ce qui n'est pas fait

- **Aucune des 31 intentions natives Python** de l'inventaire. C'est là
  qu'est le travail pédagogique, et il demande les décisions D1 à D13.
- **Aucune intégration à l'hôte VS Code.** La commande C-A n'ouvre que des
  `.c` ; ouvrir un `.py` demande de choisir le langage par l'extension — le
  registre sait déjà le faire — et d'adapter la session au placement par
  indentation. C'est un lot à part, et il vaut mieux qu'il attende que le
  catalogue Python existe.
- **Le catalogue Python généré** (`docs/CATALOGUE_PYTHON.md`) : il n'aurait
  aujourd'hui que des portages, et donnerait une fausse idée du périmètre.
- Aucune mesure d'usage : Python n'a été essayé par personne.
