# Phase 3 — plan d'implémentation et de validation de Java-A V1

**Rien n'est implémenté.** Ce plan attend la validation des orientations
fondamentales (`DECISIONS_JAVA.md`). Il donne des **critères mesurables**, pas
des intentions.

---

## 1. La règle qui gouverne tout le plan

**Préserver intégralement C et Python.** Opérationnellement, cela veut dire
une chose vérifiable à chaque lot :

    node scripts/differentiel.mjs v0.5.0 --no-loss

**0 régression, 0 extension, 0 capacité perdue.** Java n'a aucune raison de
faire bouger un seul diagnostic du C ou de Python : il **s'ajoute**. Tout
écart au différentiel est un défaut de la phase 3, jamais une amélioration.

Deux lots sont des exceptions **déclarées d'avance**, et chacune devra être
auditée entrée par entrée :

- **J2**, qui étend `statementScope` de deux à quatre portées. L'extension ne
  doit déplacer **aucun** des 84 genres existants, et un test l'impose ;
- **J1**, si la décision J4 passe le nom du fichier en paramètre au moteur :
  un paramètre nouveau change la signature, pas le comportement, et le
  différentiel doit rester à zéro **avec** le paramètre absent.

## 2. Les lots

| Lot | Objet | Critère de sortie **mesurable** |
|---|---|---|
| **J0** | audit et mesure : volume réel, duplication des sessions, portées | un chiffre de volume, et l'écart avec l'estimation de `DECISIONS_JAVA.md` §J11 |
| **J1** | socle : `java/langage.ts`, inscription, `rendu.ts` des 31 reprises, `raisons.ts` des 25 refus | les **82** genres partitionnés par un test ; 31 rendus, 25 refus nommés, 0 genre sans classement |
| **J2** | portées : `statementScope` à quatre portées, `java/placement.ts` | les 84 genres existants **inchangés** ; `package` / `import` / classe dans le bon ordre ; refus `METHODE_HORS_CLASSE` et `INSTRUCTION_HORS_METHODE` |
| **J3** | catalogue natif J1–J4 : types, affichage, expressions, contrôle | 56 formulations ; un instantané figé ; `javac` sur un programme couvrant les quatre domaines |
| **J4** | méthodes et tableaux : J5, J6 partie tableaux | 25 formulations ; décision J3 appliquée ; `JAVA_STATIC_CANNOT_CALL_INSTANCE` posée et testée |
| **J5** | collections : `List`, `Map`, `Set`, « pour chaque », imports | 13 formulations ; décision J10 appliquée ; refus de la phrase ambiguë prouvé par un test |
| **J6** | objets : classes, champs, constructeurs, `this`, visibilité | 14 formulations ; le constructeur lu dans le **contexte** de classe, comme `structTarget` ; refus hors classe |
| **J7** | héritage, interfaces, polymorphisme | 12 formulations ; une méthode attendue produit **une ligne**, pas un bloc |
| **J8** | exceptions, paquetages, fichiers | 20 formulations ; décision J6 appliquée ; try-with-resources ; **aucun** `throws` ajouté à une signature existante |
| **J9** | français souple : `ARBITRE_JAVA` | le mode strict **intact** sur tout le catalogue Java ; aucune reformulation n'invente un type |
| **J10** | hôte VS Code : `sessionJava.ts`, cible `.java`, réglage `c-a.java` | la suite hôte passe, scénarios Java compris, sur la version **installée** |
| **J11** | exercice de clôture | voir §4 |

**Onze lots.** Python en a demandé neuf pour moins de surface ; annoncer moins
serait se mentir.

## 3. Les critères mesurables, et comment chacun se mesure

| Critère | Seuil | Commande |
|---|---|---|
| tests Node | **0 échec**, et le total **augmente** à chaque lot | `npm test` |
| typage | 0 diagnostic | `npm run typecheck` |
| non-régression C et Python | **0 régression, 0 extension, 0 capacité perdue** | `node scripts/differentiel.mjs v0.5.0 --no-loss` |
| partition des genres | **exhaustive**, imposée par un test | `test/registre.test.mjs` étendu |
| compilation Java | **code de sortie 0**, `-Xlint:all` sans avertissement non voulu | `javac --release 21 -Xlint:all` |
| exécution | **code de sortie 0**, sortie conforme à un calcul **fait à la main** | `java` |
| hôte VS Code | 0 échec, sur la version **installée** | `npm run test:vscode` |
| hôte contre le **paquet** | 0 échec | `CA_EXTENSION_PATH=… npm run test:vscode` |
| couverture du catalogue | **100 %** des formulations livrées employées par un programme **compilé** | journal de l'exercice J11 |
| français souple | strict **intact**, 0 erreur de sens, 0 accepté à tort | `node scripts/mesurer-reformulations.mjs` |

**Deux chiffres interdits comme critères**, et c'est voulu :

- un **taux** de reconnaissance du français spontané. Le corpus gelé donne
  95,1 % et le corpus de développement donnait 30 % à sa première mesure : un
  seuil fixé d'avance inviterait à choisir le corpus qui l'atteint ;
- un **nombre d'intentions**. Aucun plafond, aucun plancher. Le catalogue
  compte ce que l'enseignement exige.

## 4. L'exercice de clôture, défini maintenant pour ne pas être ajusté après

Un programme Java **écrit comme un programmeur Java l'écrirait**, pas comme
une liste de phrases à cocher. Contraintes fixées d'avance :

- **plusieurs fichiers** : au moins une classe publique, une classe interne ou
  seconde classe, une interface, et un paquetage ;
- il **lit un fichier** et traite donc une exception vérifiée ;
- il utilise **au moins une collection** et **au moins un tableau**, pour
  éprouver la décision J10 sur un cas réel ;
- il **compile** par `javac --release 21` et **s'exécute**, code de sortie 0 ;
- **zéro retouche manuelle.** Toute ligne que A ne sait pas écrire est un
  **manque consigné**, comblée par un lot, et l'exercice rejoué.

C'est cette contrainte-là qui a trouvé les vrais défauts aux deux phases
précédentes : le `char nom[32];` du lot 27, et le champ d'un élément de tableau
de structures du lot 32 — tous deux invisibles pour 3 500 tests.

Puis, comme pour les deux autres langages, une **dictée dans l'IHM réelle** :
le même programme saisi par l'interface, et un C — ici un Java — **identique**
à celui du moteur.

## 5. Ce qui ne sera pas fait dans la phase 3

- **SQL**, et les modèles pédagogiques supérieurs ;
- `record`, `switch` fléché, `var` — décisions J7 et J8 ;
- la **factorisation** des trois sessions de l'hôte — décision J9, après mesure ;
- le **renommage GitHub**. Le dépôt s'appelle toujours `c-a-french-to-c`, le
  nom `a-french-to-code` répond 404, et **aucune référence ne sera changée**
  tant que le renommage n'est pas vérifié ;
- toute vérification de types, de symboles, de bornes ou de **visibilité**. A
  n'en fait pas en C, n'en fait pas en Python, n'en fera pas en Java.

## 6. Le blocage externe, et il est réel

**Aucun JDK n'est installé sur cette machine** — vérifié : `java` et `javac`
absents du `PATH`, `C:\Program Files\Java` et
`C:\Program Files\Eclipse Adoptium` inexistants.

Sans JDK, les lots J3 à J11 produiraient des tests unitaires et **aucune preuve
de compilation**. Or le projet a déjà écrit, et vérifié deux fois, que **la
réussite des tests automatisés ne vaut pas complétion**.

**Demande d'autorisation externe**, sur le modèle exact de GCC en novembre :

| Point | Proposition |
|---|---|
| quoi | **Eclipse Temurin JDK 21 LTS**, archive `.zip` |
| où | **hors du dépôt**, comme WinLibs GCC |
| `PATH` | **non modifié** ; appel par chemin relatif |
| journal | `exercice/java/journal/compilation.txt`, chemins **relatifs** — la cause des 7 chemins personnels de l'audit de publication |
| vérification | empreinte de l'archive consignée avant usage |

**Ce qui peut avancer sans JDK :** J0, J1, J2 et le gros de J3 — l'analyse des
phrases, le rendu, les refus, le placement et leurs tests ne demandent pas de
compilateur. **Ce qui ne peut pas :** tout critère de compilation et
d'exécution, donc la sortie de J3 et tous les lots suivants.

Je continue sur J0 à J2 sans attendre, dès que les orientations sont validées.

## 7. Les risques, nommés d'avance

| Risque | Pourquoi il est crédible | Parade |
|---|---|---|
| le placement à **quatre** portées casse le C | le lot 26 est **le seul lot qui a retiré des placements**, et il a demandé un oracle écrit indépendamment | partition existante **intouchée**, test d'exhaustivité, différentiel à chaque lot |
| A produit du Java qui ne compile pas, en silence | déjà vrai en C — c'est la lacune n°4 des chantiers ouverts — et Java ajoute `static`, la visibilité et les exceptions vérifiées | informations passives **à la déclaration**, et chacune dit que la lacune **reste ouverte** |
| trois sessions d'hôte divergent | 366 lignes dupliquées | contrat `SessionControleur`, déjà imposé par les tests |
| le catalogue gonfle sans fin | aucun plafond, par consigne | le critère n'est pas un nombre : c'est **100 % des formulations employées par un programme compilé** |
| l'estimation de volume est fausse | elle l'a été de 4 % en phase 2, sur un travail de nature connue ; Java est de nature **nouvelle** | J0 **mesure** avant d'annoncer |
