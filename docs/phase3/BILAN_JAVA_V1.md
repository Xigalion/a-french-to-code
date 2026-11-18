# Phase 3 — bilan de Java-A V1

Les quatre colonnes que le fondateur demande de ne jamais confondre :
**couverture du catalogue**, **implémentation**, **validation technique**,
**usage humain réel**. La quatrième est à zéro, et elle le reste.

    node scripts/progression-phase3.mjs

---

## 1. Couverture du catalogue

**144 formulations**, calculées et non annoncées
(`node scripts/catalogue-java.mjs`) :

| | |
|---|---|
| reprises directes du catalogue partagé | **30** |
| adaptations sémantiques | **27** |
| propres à Java | **87** |
| intentions partagées à porter, couvertes | **57 / 57** |
| refus nommés | **27** |
| informations passives | **28** |
| domaines | **9 / 9** |

Par domaine : J1 18, J2 13, J3 14, J4 16, J5 17, J6 25, J7 15, J8 13, J9 13.

**Aucun plafond n'a été appliqué**, et le nombre a bougé quatre fois en cours
de route : 127 → 139 → 143 → 144. Chaque mouvement a une cause nommée, et
aucune n'est un arrondi.

| Mouvement | Cause |
|---|---|
| 127 → 139 | des intentions **portées** qu'aucune phrase n'atteignait : des intentions **mortes** |
| 139 → 143 | la décision J10 appliquée des **deux** côtés, et une phrase native qui doublait une phrase partagée |
| 143 → 144 | un **manque** trouvé par l'exercice de clôture : la création polymorphe avec argument |

## 2. Implémentation

| Module | Rôle |
|---|---|
| `src/langages/java/expression.ts` | rendu Java d'une expression, et les refus |
| `src/langages/java/rendu.ts` | les 57 intentions du catalogue partagé |
| `src/langages/java/raisons.ts` | les 27 refus nommés |
| `src/langages/java/portees.ts` | la partition des **quatre** portées |
| `src/langages/java/placement.ts` | le placement par accolades, propre à Java |
| `src/langages/java/catalogue.ts` | le moteur déclaratif, 87 motifs et 7 formes proches |
| `src/langages/java/instructions.ts` | l'union des genres natifs |
| `src/langages/java/renduNatif.ts` | le rendu natif, un genre une ligne |
| `src/langages/java/informations.ts` | les 28 informations passives |
| `src/langages/java/langage.ts` | l'inscription au registre |
| `extension/src/sessionJava.ts` | la session de l'hôte, et `ARBITRE_JAVA` |

**Ce qui n'a pas été écrit, et c'est le résultat le plus utile de l'audit :**
le registre, le noyau d'expressions et les **98 reformulations** servent tels
quels. Zéro ligne ajoutée à `src/langue/`.

**Ce qui a dû être écrit malgré l'étiquette commune :** le placement.
`planPlacement` encode des règles **du C**, pas des règles **des accolades**.
Java exige une méthode **dans** une classe — deux niveaux —, n'accepte rien
d'exécutable à la portée fichier, et impose un ordre **à trois temps** entre
`package`, les `import` et le type.

**Une seule modification du socle**, additive : le registre accepte un
`ContexteNatif`, parce qu'un constructeur Java prend le nom de sa classe
englobante. Python l'ignore.

## 3. Validation technique

| Preuve | Chiffre |
|---|---|
| tests Node | **4 438**, 0 échec |
| typecheck moteur et extension | vert |
| différentiel contre `v0.5.0` | **1 335 559** comparaisons, **0 régression, 0 capacité perdue** |
| exercice de clôture | **4 fichiers, 96 phrases, 11 gestes, 0 retouche** |
| compilation | `javac --release 21 -encoding UTF-8 -Xlint:all`, code 0, **aucun avertissement** |
| exécution | `java -ea`, code 0, sortie conforme au **calcul fait à la main** |
| programme de bout en bout (J2) | 29 phrases, 1 geste, 0 retouche, compilé et exécuté |
| chaîne d'outils | **Temurin 21.0.13+9**, empreinte conforme à celle d'Adoptium |

Le différentiel à zéro est la garantie demandée : **Java s'ajoute, il ne
déplace rien.** La partition des 84 genres de `src/statementScope.ts` n'a pas
été touchée, et un test l'impose toujours exhaustive.

## 4. Usage humain réel

**0 / 10 séances.** Personne n'a écrit un programme Java avec A.

Les 96 phrases de l'exercice de clôture sont dictées par un script. Elles
prouvent que les intentions fonctionnent **ensemble** — c'est beaucoup, et ce
n'est pas la même chose que ce qu'une personne tape quand elle hésite.

C'est le même zéro qu'en phase 2, et il n'a pas bougé d'un langage à l'autre.

---

## 5. Les onze défauts trouvés, et par quoi

Ils comptent plus que les chiffres, parce qu'ils disent où le travail se trompe
quand personne ne regarde.

| Défaut | Trouvé par |
|---|---|
| « 82 intentions classées » là où la partition en compte **84** | une relecture, après la demande du fondateur |
| « 134 = 101 + 33 » à côté d'un tableau totalisant **127** | la même |
| « onze lots » pour **J0 à J11**, soit douze | la même |
| les phrases des **adaptations** n'étaient pas celles du catalogue partagé | l'implémentation du rendu |
| `for (int i = 0; …)` — une **déclaration implicite** de la variable de boucle | l'implémentation du rendu |
| `NUMERIC_PRINT` décrit comme « la valeur réelle », et son format `%u` non refusé | l'implémentation du rendu |
| `lastIndexOf('\n', 0)` : intervalle d'édition **inversé** en tête de document | un test de placement |
| sans `-encoding UTF-8`, `javac` **corrompt** les accents dans le fichier compilé | le premier programme compilé |
| le `try` **avec ressource** et ses parenthèses imbriquées | l'exercice de clôture |
| le rendu de `catch` écrivait **deux** accolades fermantes | l'exercice de clôture |
| une intention **morte** : `Affiche n en hexadécimal` doublait le catalogue partagé | un test général |
| la création polymorphe **avec argument** manquait au catalogue | `javac`, dans l'exercice de clôture |
| des `.class` suivis par git — **la même leçon que le `.pyc`** | le contrôle de pré-publication |

**Quatre d'entre eux n'étaient visibles pour aucun test unitaire** : il fallait
un programme entier, plusieurs fichiers, et un vrai compilateur. C'est
exactement la raison pour laquelle l'énoncé de l'exercice de clôture est fixé
**avant** l'implémentation.

## 6. Les limites réelles, sans rien dissimuler

### Ce que A ne vérifie pas, en Java pas plus qu'ailleurs

**Ni les types, ni les symboles, ni les bornes, ni — et c'est nouveau — la
visibilité.** `e.age` sur un champ `private` depuis une autre classe est
accepté par A et refusé par `javac`. L'information
`JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` le dit, et la lacune **reste ouverte**.

### Deux lacunes nommées, et non refermées

- **`JAVA_STATIC_CANNOT_CALL_INSTANCE`.** A est sans état : en écrivant un
  appel, il ne sait pas si la méthode visée est `static`. Il peut donc produire
  du code que le compilateur refusera. L'information est posée **à la
  déclaration**, faute de pouvoir l'être à l'usage — le même procédé, et la
  même honnêteté, que `POINTER_ARITHMETIC_ABSENT` au lot 30 ;
- **le nom du fichier et le répertoire du paquetage.** `javac` exige qu'une
  classe `public` vive dans un fichier portant son nom, et qu'un `package`
  corresponde à un répertoire. A **informe** et ne renomme rien : décisions J4
  et J5. Un fichier accepté peut donc ne pas compiler pour une raison qui
  n'est pas dans le code.

### Ce qui est hors du périmètre, par décision

`record`, le `switch` fléché et `var` sont **refusés** — décisions J7 et J8 —
parce qu'ils cachent précisément ce que les domaines J4, J7 et J1 enseignent :
le `fall-through`, le constructeur, et le type.

Aucun code en **avant-première** n'est produit : décision J1. Le point d'entrée
est une classe explicite et un `main` explicite, et le premier programme Java
demande donc **trois** phrases là où Python en demande une. C'est Java qui
l'exige.

### Ce qui n'a pas été essayé

- **une seule machine, un seul système** — Windows ;
- **un seul JDK**, Temurin 21.0.13 ; aucun autre fournisseur, aucune autre
  version ;
- **la suite hôte VS Code n'a pas été relancée** depuis l'ajout de Java : les
  scénarios Java y manquent encore, et c'est le premier travail de la suite ;
- **aucun essai avec un paquetage à plusieurs niveaux** (`ecole.notes`), ni
  avec une classe générique écrite par l'utilisateur ;
- **IME, documents longs, claviers non français** : jamais.

### Une asymétrie à assumer

**Java-A a les classes, et Python-A ne les a pas.** La décision D6 de la phase
2 les avait refusées au premier jet pour Python ; en Java, une classe est
obligatoire pour exécuter la moindre ligne. Ce n'est pas un retard de
Python-A : c'est le langage qui parle.

## 7. Ce qui reste à faire avant de parler de V1 publiable

1. **relancer la suite hôte VS Code** avec des scénarios Java, sur la version
   installée **et** contre le paquet ;
2. **mesurer** le français souple en Java sur un corpus indépendant, comme en
   phase 2 — le mécanisme est branché et testé, sa **couverture** en Java n'est
   pas chiffrée ;
3. mettre à jour les documents publics : `README.md`, `CHANGELOG.md`,
   `docs/CATALOGUE.md`, `docs/LIMITES_CONNUES.md`, `docs/ETAT_DU_PROJET.md` ;
4. fabriquer et vérifier le `.vsix`.

Rien de tout cela n'est commencé, et rien n'est fusionné dans `main`.
