# Phase 3 — les décisions fondamentales à prendre avant d'implémenter

**Onze décisions.** Aucune n'est technique au sens où je pourrais la prendre
seul : chacune change ce qu'un débutant apprend, ou ce que A promet.

Chaque entrée dit : la question, les options **réellement** ouvertes, ce que
chacune coûte, et **ma recommandation avec sa raison**. Rien n'est implémenté.

---

## J1 — Le point d'entrée : classe explicite, ou classe implicite *preview* ?

**La question.** Java 21 sait compiler un fichier sans classe ni `static`
(JEP 445), mais **en avant-première seulement** : `--enable-preview` à la
compilation **et** à l'exécution, avertissement obligatoire, et la
fonctionnalité **a changé** dans les versions suivantes.

| Option | Coût |
|---|---|
| **A. classe et `main` explicites, commandés** | le premier programme demande **trois** phrases |
| B. classe implicite *preview* | le code produit **ne compile pas** sans deux drapeaux, et vieillira |
| C. A ajoute la classe tout seul | **viole la règle 3** — pas une option |

**Recommandation : A.** Le coût est réel et il est **honnête** : Java exige
une classe, et masquer cette exigence derrière un drapeau d'avant-première
apprendrait un Java qui n'existe pas durablement. Une information passive
dira pourquoi trois phrases sont nécessaires là où Python en demande une.

## J2 — `print` ou `println` pour les phrases d'affichage existantes ?

**La question.** `printf` n'ajoute rien, `println` ajoute un retour à la
ligne. Quelle sortie pour `Affiche la valeur de n.` ?

**Recommandation : `System.out.print`**, et une phrase distincte
`… et passe à la ligne.` pour `println`.

**La raison n'est pas le confort, c'est un invariant :** le sens d'une phrase
française ne doit pas dépendre du langage cible. Le lot 29 a livré
`OUTPUT_HAS_NO_SEPARATOR` pour enseigner qu'aucun séparateur n'est ajouté ;
rendre la même phrase en `println` démentirait cette information dans un
`.java`.

## J3 — `static` par défaut, ou méthode d'instance par défaut ?

**La question.** `main` est `static`. Une méthode d'instance appelée depuis
`main` **ne compile pas**. Que produit `Crée une méthode nommée f … ` ?

| Option | Coût |
|---|---|
| **A. deux phrases distinctes** : `méthode de classe` → `static`, `méthode publique/privée` → d'instance | le mot « de classe » dans la phrase |
| B. `static` implicite partout | A choisirait, et l'encapsulation de J7 deviendrait inécrivable |
| C. instance par défaut | le premier programme ne compile pas, sans un mot |

**Recommandation : A.** Et avec une limite dite franchement : A est **sans
état**. En écrivant `Appelle f.`, il ne sait pas si `f` est `static`. Il peut
donc produire du code qui ne compile pas, et l'information
`JAVA_STATIC_CANNOT_CALL_INSTANCE` est posée **à la déclaration**, faute de
pouvoir l'être à l'usage — le même procédé, et la même honnêteté, que
`POINTER_ARITHMETIC_ABSENT` au lot 30. **La lacune n'est pas refermée.**

## J4 — Le nom du fichier : informer, ou décider à la place de l'utilisateur ?

**La question.** `javac` exige qu'une classe `public` vive dans un fichier
portant son nom. A ne connaît le nom du fichier que par l'hôte, et ne renomme
rien.

| Option | Coût |
|---|---|
| **A. accepter et informer** | le fichier peut ne pas compiler, et A l'a dit |
| B. produire `class` sans `public` si les noms diffèrent | A **choisit** la visibilité : règle 3 |
| C. refuser | une phrase correcte refusée pour une raison extérieure au code |

**Recommandation : A.** C'est l'application directe de la règle 5 —
**diagnostic ≠ correction**. L'information nomme le fichier attendu
(`Eleve.java`) sans renommer ni modifier quoi que ce soit.

**Un point à trancher avec la décision :** l'hôte connaît le nom du fichier,
le moteur non, et `src/` ne doit **jamais** importer `vscode`. L'information
doit donc être produite par la **session**, pas par le moteur — ou le moteur
reçoit le nom du fichier en paramètre. **Je recommande le paramètre** : une
information produite par l'hôte échapperait aux tests du moteur.

## J5 — Le paquetage et le répertoire

**La question.** `package ecole;` exige que le fichier vive dans `ecole/`.
Même famille que J4, même réponse proposée : **accepter et informer**.

**Et une contrainte de placement, elle, non négociable :** `package` doit être
la **première instruction** du fichier, avant les `import`, qui précèdent la
classe. C'est un ordre **à trois temps** que `planPlacement` ne connaît pas —
il n'en connaît que deux.

## J6 — Les exceptions vérifiées : la décision la plus lourde

**La question.** Lire un fichier **oblige** à attraper `IOException` ou à la
déclarer dans la signature. Que fait A quand on écrit
`Lis une ligne depuis le lecteur f dans ligne.` dans une méthode dont la
signature ne déclare rien ?

| Option | Coût |
|---|---|
| **A. ne rien faire de la signature ; exiger une phrase explicite** | l'utilisateur doit savoir **avant** d'écrire la méthode qu'elle lira un fichier |
| B. ajouter `throws IOException` à la signature existante | **viole la règle 9** — modifier du code non autorisé |
| C. envelopper automatiquement dans un `try` | **viole la règle 3**, et choisit un traitement d'erreur |

**Recommandation : A**, avec deux appuis :

1. la signature se commande : `Crée une méthode … et peut lancer IOException.` ;
2. une information passive, `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED`, posée
   **sur l'instruction de lecture**, qui rappelle l'obligation et nomme les
   **deux** issues légales — attraper, ou déclarer.

**Dit sans détour : c'est le cas où A sera le plus frustrant.** Un débutant
écrira une lecture de fichier, le code sera refusé par `javac`, et A n'aura pas
corrigé. C'est exactement la philosophie du projet — réduire les difficultés
inutiles sans supprimer la nécessité de comprendre —, et c'est la décision qui
la met le plus à l'épreuve. **Elle mérite d'être prise en connaissance de
cause, pas par défaut.**

## J7 — `record`, `switch` fléché : les formes modernes dans la V1 ?

**La question.** Java 21 offre `record Point(int x, int y) {}` et
`case 1 -> …`, plus courts et sans piège de `fall-through`.

**Recommandation : hors de la V1**, et pour une raison pédagogique, pas
technique. Le `switch` **classique** enseigne le `fall-through`, qui est la
notion à comprendre — y compris pour comprendre pourquoi les formes modernes
l'ont supprimé. Un `record` cache le constructeur, les champs et les
accesseurs, c'est-à-dire **tout ce que le domaine J7 enseigne**.

Les deux sont de bonnes candidates pour une V2, une fois les notions acquises.
Deux refus nommés le diront, pour que personne ne croie que A les ignore.

## J8 — `var` : accepté, ou refusé ?

**Recommandation : refusé**, par un refus nommé.

`var n = 0;` cache le type, et le type est **la notion** que J1 enseigne. Ce
refus n'est pas une limite technique : c'est le palier 1 appliqué au typage,
exactement comme il exige une formulation précise plutôt qu'une formulation
concise.

## J9 — Factoriser les sessions de l'hôte maintenant, ou après ?

**La question.** `sessionPython.ts` fait 366 lignes. Une `sessionJava.ts` les
dupliquerait largement.

**Recommandation : après.** Une abstraction tirée de **deux** cas se trompe
plus souvent qu'une abstraction tirée de **trois** : on factorise ce qui se
ressemble, pas ce qui est pareil. Écrire `sessionJava.ts` d'abord, **mesurer**
la duplication réelle, puis décider — et le mesurer avec
`scripts/audit-architecture.mjs`, qui existe et qui avait estimé la phase 2 à
4 % près.

**Le risque assumé :** trois sessions divergent. Il est tenu par le contrat
structurel `SessionControleur`, que les tests imposent déjà.

## J10 — `tableau` et `liste` dans la phrase : lourdeur, ou nécessité ?

**La question.** `notes[0]` et `notes.get(0)` sont deux codes différents, et A
est **sans état** : il ne sait pas si `notes` est un `int[]` ou une
`List<Integer>`.

| Option | Coût |
|---|---|
| **A. le mot est dans la phrase** : `l'élément "0" du tableau notes` | une phrase plus longue |
| B. une phrase unique, A devine | **invente une information manquante** — interdit |
| C. une phrase unique, refusée comme ambiguë | la capacité devient inaccessible |

**Recommandation : A.** C'est le même raisonnement que `Affiche x.` en
français souple, qui est **refusé** parce qu'il a trois lectures : A ne choisit
pas entre deux sens. Ici, le mot ajouté **est** l'information manquante.

**Conséquence sur le catalogue partagé :** les phrases d'indexation du C
(`l'élément "0" de t`) deviennent des phrases Java **différentes**. C'est une
adaptation de classe B, pas une reprise, et le classement en tient compte.

## J11 — Le périmètre de la V1 Java : les neuf domaines, ou moins ?

**La question.** Le catalogue proposé compte 127 formulations sur neuf
domaines. Faut-il les livrer toutes en V1 ?

**Recommandation : tous les neuf**, par cohérence avec les deux précédents —
le modèle 1 du C couvre ses neuf domaines, Python-A aussi — et parce qu'un Java
sans objets n'enseigne pas Java.

**Avec une réserve, et elle est sérieuse.** Python a été livré en **neuf lots**
pour 97 intentions. Java en annonce 127 **plus** un module de placement neuf,
**plus** quatre portées au lieu de deux, **plus** deux contraintes de système
de fichiers. L'estimation honnête est **au-dessus** de la phase 2, pas à son
niveau, et je ne la chiffre pas avant le lot J0 — l'audit de la phase 2 n'était
juste à 4 % que parce qu'il avait **mesuré** d'abord.

---

## Récapitulatif pour décider vite

| # | Question | Recommandation |
|---|---|---|
| **J1** | point d'entrée | classe et `main` **explicites**, pas de *preview* |
| **J2** | affichage | `print` pour les phrases existantes, phrase distincte pour `println` |
| **J3** | `static` | deux phrases distinctes ; lacune de l'appel **assumée et dite** |
| **J4** | nom de fichier | accepter et **informer** ; nom passé en paramètre au moteur |
| **J5** | paquetage | accepter et **informer** ; ordre à trois temps dans le placement |
| **J6** | exceptions vérifiées | **rien d'implicite** ; `peut lancer` est une phrase |
| **J7** | `record`, `switch` fléché | **hors V1**, refus nommés |
| **J8** | `var` | **refusé**, refus nommé |
| **J9** | sessions de l'hôte | factoriser **après** mesure |
| **J10** | `tableau` / `liste` | le mot **dans** la phrase |
| **J11** | périmètre V1 | **les neuf domaines**, volume non chiffré avant J0 |

**Les trois qui changent le plus pour un apprenant : J1, J6 et J10.** Si une
seule devait être discutée, c'est **J6** — c'est elle qui décide à quel point
A sera frustrant le jour où quelqu'un lira un fichier.
