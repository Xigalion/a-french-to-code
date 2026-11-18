# Clôture de la phase 3 — 18 novembre 2026

La phase 3 est **close**. Elle avait un objet : faire de Java un troisième
langage cible de A, de plein droit, sans abîmer les deux premiers — et le
prouver.

Le quatrième langage, **SQL**, n'est pas commencé. Les modèles pédagogiques
supérieurs non plus.

---

## 1. Ce qui existe maintenant et n'existait pas

| | |
|---|---|
| langages cibles | **trois** : C17, Python, **Java 21** |
| formulations Java | **144** — 30 reprises, 27 adaptations, **87 natives** |
| refus nommés | **27**, chacun désignant la construction Java équivalente |
| informations passives | **28** |
| portées de placement | **quatre** : fichier, classe, méthode, interface |
| catalogue publié | `docs/CATALOGUE_JAVA.md`, **engendré depuis le moteur** |

**Le socle a tenu.** Le registre de langages, le noyau d'expressions et les
98 reformulations du français souple servent **tels quels** : zéro ligne
ajoutée à `src/langue/` pour les faire fonctionner en Java.

**Une seule modification du socle**, additive : le registre accepte un
`ContexteNatif`, parce qu'un constructeur Java prend le nom de sa classe
englobante. Python l'ignore.

## 2. Ce qui a dû être écrit malgré l'étiquette commune

Java porte la même étiquette de blocs que C17 — `accolades` — et son placement
a pourtant dû être écrit en entier. C'est le **résultat le plus utile** de
l'audit du socle, et il est négatif :

> `planPlacement` n'encode pas des règles **des accolades**. Il encode des
> règles **du C**.

| Règle du placement C17 | Vraie en Java ? |
|---|---|
| une instruction exécutable exige un corps de **fonction** | **non** : une **méthode**, elle-même dans une **classe** — deux niveaux |
| une déclaration est plaçable à la portée fichier | **non** : rien d'exécutable ne vit au fichier, pas même une affectation |
| une directive précède tout le reste | partiellement : `package`, puis les `import`, puis le type — **trois temps** |
| une définition de fonction est plaçable au fichier | **non** |

La décision 2 du socle — les placements se **sélectionnent**, ils ne
s'unifient pas — est donc **confirmée** par Java plutôt que contredite.

## 3. Ce qui est mesuré, et ce que chaque chiffre ne dit pas

| Mesure | Chiffre | Ce qu'elle ne dit pas |
|---|---|---|
| tests Node | **4 438**, 0 échec | qu'un programme produit compile |
| tests hôte | **121**, 0 échec, **quatre combinaisons** : sources et paquet × 1.96.4 et 1.138.0 | qu'un autre système se comporte pareil |
| différentiel contre `v0.5.0` | **1 335 559** comparaisons, **0 régression, 0 capacité perdue** | que les capacités conservées soient bonnes |
| exercice de clôture | **4 fichiers, 96 phrases, 11 gestes, 0 retouche** | qu'un humain écrirait ces phrases |
| compilation | `javac --release 21 -encoding UTF-8 -Xlint:all` : code 0, **aucun avertissement** | que le programme soit juste — c'est le calcul fait à la main qui le dit |
| exécution | `java -ea` : code 0, sortie conforme | — |
| français souple en Java | **36/36**, 0 acceptée à tort, **0 erreur de sens** | le français spontané |
| paquet | reproductible **au bit**, depuis **deux** clones propres | qu'il soit utile |

**Le seul chiffre qui compte vraiment est encore à zéro.** `0/10` séances :
personne n'a écrit un programme Java avec A, ni un programme C, ni un
programme Python. Les deux programmes Java de preuve sont **dictés par un
script**.

Et le 100 % du corpus Java porte son biais écrit : il n'a enrichi aucune
reformulation, mais il a été écrit par l'auteur du mécanisme. Le corpus
**gelé** de la phase 2 reste à 95,1 %, inchangé — c'est lui qui donne
l'ordre de grandeur honnête.

## 4. Les quatorze défauts trouvés, et par quoi

Ils comptent plus que les chiffres.

| Défaut | Trouvé par |
|---|---|
| « 82 intentions classées » là où la partition en compte **84** | une relecture demandée par le fondateur |
| « 134 = 101 + 33 » à côté d'un tableau totalisant **127** | la même |
| « onze lots » pour **J0 à J11**, soit douze | la même |
| les phrases des **adaptations** n'étaient pas celles du catalogue partagé | l'implémentation du rendu |
| `for (int i = 0; …)` — une **déclaration implicite** de la variable de boucle | l'implémentation du rendu |
| `NUMERIC_PRINT` mal décrit, et son format `%u` non refusé | l'implémentation du rendu |
| `lastIndexOf('\n', 0)` : intervalle d'édition **inversé** en tête de document | un test de placement |
| sans `-encoding UTF-8`, `javac` **corrompt** les accents dans le fichier compilé | le premier programme compilé |
| le `try` **avec ressource** et ses parenthèses imbriquées | l'exercice de clôture |
| le rendu de `catch` écrivait **deux** accolades fermantes | l'exercice de clôture |
| une intention **morte** : `Affiche n en hexadécimal` doublait le catalogue partagé | un test général |
| la création polymorphe **avec argument** manquait au catalogue | **`javac`**, dans l'exercice de clôture |
| **une erreur de SENS** : `Appelle la méthode afficher de e.` produisait `e.Affiche();` | la mesure du français souple |
| la correction de cette erreur **sur-protégeait** à son tour | la même mesure, relancée |
| des artefacts de compilation suivis par git — **la troisième fois** | le contrôle de pré-publication |

**Cinq d'entre eux n'étaient visibles pour aucun test unitaire.** Il fallait un
programme entier, plusieurs fichiers, un vrai compilateur, ou une mesure sur
corpus. C'est exactement la raison pour laquelle l'énoncé de l'exercice de
clôture est fixé **avant** l'implémentation.

Et le plus grave de tous est le treizième : **A renommait silencieusement la
méthode de l'utilisateur.** Une phrase acceptée dont le sens est faux est pire
qu'une phrase refusée, et aucun taux ne la rachète. La garde des identifiants
ne connaissait que « nommé » et « appelé » ; Java nomme des identifiants après
un nom commun. Le défaut existait **aussi** pour C17 et Python — il n'y mordait
pas, faute de phrase qui l'expose.

**Le quatorzième a reçu un garde-fou**, parce que je l'ai fait trois fois : un
vingtième contrôle de pré-publication refuse désormais tout artefact de
compilation suivi, et il a été **armé exprès** pour vérifier qu'il se
déclenche. Un `.gitignore` ne retire pas ce qui est déjà suivi.

## 5. Ce qui reste ouvert

**Côté produit**, nommé et assumé :

- **aucune vérification** de symboles, de types, de bornes — ni, en Java, de
  **visibilité** ;
- **trois obligations de Java que A ne satisfait pas** : exceptions vérifiées,
  `static`, nom du fichier. Les trois sont **dites**, aucune n'est refermée ;
- **un seul JDK**, un seul système, une seule machine ;
- `record`, le `switch` fléché et `var` **refusés**, délibérément.

**Côté usage** : `0/10` séances, et c'est le même zéro depuis la phase 1.

L'inventaire complet est `docs/phase3/BILAN_JAVA_V1.md` et, pour le public,
`docs/LIMITES_CONNUES.md`.

## 6. Ce que la phase 3 ne décide pas

L'ordre de la suite. La feuille de route place **SQL** en quatrième langage,
puis le modèle pédagogique 2, puis Rust — mais rien n'oblige à enchaîner.

Une chose mérite d'être redite, parce qu'elle était déjà vraie à la fin des
phases 1 et 2 et qu'elle l'est restée : **la prochaine information utile ne
viendra pas d'un langage de plus.** Elle viendra de la première personne qui
essaie d'écrire un programme avec A et n'y arrive pas comme prévu.
