# Phase 3 — catalogue pédagogique Java proposé

**Proposition, pas livraison.** Rien de ce document n'est implémenté. Chaque
ligne donne la **phrase française exacte** et la **sortie Java exacte**, pour
qu'une décision porte sur du concret et non sur une intention.

**Aucun plafond n'est fixé.** Le catalogue compte ce que l'enseignement de
Java exige : **134 formulations** réparties en neuf domaines, dont **101
natives** et **33 reprises** du catalogue partagé (voir
`CLASSEMENT_INTENTIONS.md`).

Conventions du document : `{NOM}` un identifiant, `{ENTIER}` un entier,
`{TEXTE}` un texte entre guillemets, `{EXPR}` une expression entre
guillemets, `{TYPE}` un type du catalogue, `{CLASSE}` un nom de classe.

---

## Domaine J1 — Fondamentaux, point d'entrée, types

| Phrase française | Java produit |
|---|---|
| `Crée une classe nommée {CLASSE}.` | `public class Eleve {` … `}` |
| `Crée une classe interne nommée {CLASSE}.` | `class Noeud {` … `}` *(sans `public` : une seule classe publique par fichier)* |
| `Crée la méthode principale.` | `public static void main(String[] args) {` … `}` |
| `Déclare un entier nommé {NOM}.` | `int n;` |
| `Crée un entier nommé {NOM} de valeur {ENTIER}.` | `int age = 20;` |
| `Crée un entier long nommé {NOM} de valeur {ENTIER}.` | `long grand = 10000000000L;` |
| `Crée un réel nommé {NOM} de valeur {EXPR}.` | `double moyenne = 1.5;` |
| `Crée un réel simple nommé {NOM} de valeur {EXPR}.` | `float x = 1.5f;` |
| `Crée un caractère nommé {NOM} de valeur {CAR}.` | `char initiale = 'A';` |
| `Crée un booléen nommé {NOM} de valeur vrai.` | `boolean fini = true;` |
| `Crée un booléen nommé {NOM} de valeur faux.` | `boolean fini = false;` |
| `Crée une chaîne nommée {NOM} avec le texte {TEXTE}.` | `String nom = "Ada";` |
| `Déclare une chaîne nommée {NOM}.` | `String nom;` |
| `Crée une constante entière nommée {NOM} de valeur {ENTIER}.` | `final int MAX = 100;` |
| `Crée une constante entière de classe nommée {NOM} de valeur {ENTIER}.` | `static final int MAX = 100;` |

**Trois informations passives du domaine :**

- `JAVA_CLASS_NAME_IS_FILE_NAME` — une classe `public` exige un fichier
  portant son nom. A ne renomme aucun fichier ;
- `JAVA_CHAR_IS_16_BIT` — `char` vaut **16 bits** en Java, 8 en C17 : un même
  programme n'y range pas les mêmes caractères ;
- `JAVA_LONG_NEEDS_SUFFIX` — un littéral entier dépassant `int` exige le
  suffixe `L`, sans quoi le compilateur refuse **le littéral**, pas
  l'affectation.

## Domaine J2 — Affichage et saisie

| Phrase française | Java produit |
|---|---|
| `Affiche la valeur de {NOM}.` | `System.out.print(n);` |
| `Affiche la valeur de {NOM} et passe à la ligne.` | `System.out.println(n);` |
| `Affiche le texte {TEXTE}.` | `System.out.print("bonjour");` |
| `Affiche le texte {TEXTE} et passe à la ligne.` | `System.out.println("bonjour");` |
| `Affiche un retour à la ligne.` | `System.out.println();` |
| `Affiche {NOM} en décimal.` | `System.out.printf("%d", n);` |
| `Affiche {NOM} en hexadécimal.` | `System.out.printf("%x", n);` |
| `Affiche {NOM} avec {ENTIER} chiffres après la virgule.` | `System.out.printf("%.2f", x);` |
| `Affiche la chaîne {NOM}.` | `System.out.print(nom);` |
| `Affiche le caractère {NOM}.` | `System.out.print(c);` |
| `Crée un lecteur de saisie nommé {NOM}.` | `Scanner lecteur = new Scanner(System.in);` |
| `Lis un entier depuis {NOM} dans {NOM}.` | `n = lecteur.nextInt();` |
| `Lis une ligne depuis {NOM} dans {NOM}.` | `ligne = lecteur.nextLine();` |

**Deux informations passives :**

- `JAVA_PRINTLN_ADDS_A_LINE` — `print` n'ajoute rien, `println` ajoute un
  retour à la ligne. Les deux ont **leur** phrase : A ne choisit pas pour vous ;
- `JAVA_SCANNER_LEAVES_THE_NEWLINE` — `nextInt()` laisse le retour à la ligne
  dans le flux, et un `nextLine()` qui suit lit une ligne **vide**. C'est un
  piège du langage, pas un défaut de A.

## Domaine J3 — Expressions et calculs

Les trois profils d'expression du socle sont **réutilisés tels quels**.

| Phrase française | Java produit |
|---|---|
| `Affecte la valeur {ENTIER} à {NOM}.` | `n = 20;` |
| `Affecte à {NOM} le résultat de {EXPR}.` | `n = a + b;` |
| `Affecte à {NOM} le résultat numérique de {EXPR}.` | `x = a / 2.0;` |
| `Affecte le texte {TEXTE} à {NOM}.` | `nom = "Ada";` |
| `Affecte le caractère {CAR} à {NOM}.` | `c = 'A';` |
| `Incrémente {NOM}.` | `n += 1;` |
| `Décrémente {NOM}.` | `n -= 1;` |
| `Affecte à {NOM} le résultat converti en entier de {EXPR}.` | `n = (int) x;` |
| `Affecte à {NOM} le résultat converti en réel de {EXPR}.` | `x = (double) n;` |
| `Affecte à {NOM} la concaténation de {NOM} et {TEXTE}.` | `s = s + "!";` |
| `Affecte à {NOM} la longueur de la chaîne {NOM}.` | `n = s.length();` |
| `Affecte à {NOM} le caractère d'indice {EXPR} de la chaîne {NOM}.` | `c = s.charAt(i);` |
| `Affecte à {NOM} la comparaison des chaînes {NOM} et {NOM}.` | `egal = a.equals(b);` |

**Trois informations passives, et la troisième est la plus utile du
domaine :**

- `JAVA_INTEGER_DIVISION_TRUNCATES` — `7 / 2` vaut `3`, **comme en C17** ;
- `JAVA_MODULO_FOLLOWS_DIVIDEND` — `-7 % 2` vaut `-1`, **comme en C17** et
  contrairement à Python ;
- `JAVA_EQUALS_NOT_DOUBLE_EQUAL` — `==` entre deux chaînes compare des
  **références**, pas des contenus. `a == b` peut être faux pour deux chaînes
  identiques. C'est la raison pour laquelle `Compare les chaînes` a sa propre
  phrase, et pourquoi `Affecte à egal le résultat de "a == b"` sur des chaînes
  est **refusé** par `CONSTRUCTION_NON_PORTEE`.

## Domaine J4 — Structures de contrôle

| Phrase française | Java produit |
|---|---|
| `Crée un bloc si {EXPR}.` | `if (x > 0) {` … `}` |
| `Ajoute une branche sinon si {EXPR}.` | `} else if (x < 0) {` |
| `Ajoute une branche sinon.` | `} else {` |
| `Crée une boucle tant que {EXPR}.` | `while (i < 10) {` … `}` |
| `Crée une boucle avec test final tant que {EXPR}.` | `do {` … `} while (i < 10);` |
| `Crée une boucle pour {NOM} de valeur initiale {EXPR} tant que {EXPR} avec mise à jour {EXPR}.` | `for (int i = 0; i < 10; i += 1) {` |
| `Crée une boucle pour chaque {TYPE} nommé {NOM} de {NOM}.` | `for (int v : notes) {` |
| `Sors de la boucle la plus intérieure.` | `break;` |
| `Passe à l'itération suivante de la boucle la plus intérieure.` | `continue;` |
| `Crée un aiguillage sur {EXPR}.` | `switch (jour) {` … `}` |
| `Ajoute un cas pour la valeur {ENTIER}.` | `case 1:` |
| `Ajoute un cas pour le caractère {CAR}.` | `case 'A':` |
| `Ajoute un cas pour le texte {TEXTE}.` | `case "lundi":` |
| `Ajoute le cas par défaut.` | `default:` |
| `Sors de l'aiguillage.` | `break;` |

**Une information passive :** `JAVA_SWITCH_FALLS_THROUGH` — comme en C17, un
cas sans `break` **tombe** dans le suivant. L'inverse exact de `match` en
Python, et la forme fléchée `case 1 ->` qui évite cela relève de la décision
**J7**.

**À noter, et c'est volontaire :** `switch` sur une **chaîne** est légal en
Java et illégal en C17. C'est une capacité **en plus**, pas une adaptation.

## Domaine J5 — Méthodes

| Phrase française | Java produit |
|---|---|
| `Crée une méthode de classe nommée {NOM} qui retourne un {TYPE}.` | `static int f() {` … `}` |
| `Crée une méthode de classe nommée {NOM} qui ne retourne rien.` | `static void f() {` |
| `Crée une méthode de classe nommée {NOM} qui retourne un {TYPE} et prend un {TYPE} nommé {NOM}.` | `static int f(int a) {` |
| `Crée une méthode publique nommée {NOM} qui retourne un {TYPE}.` | `public int getAge() {` |
| `Crée une méthode privée nommée {NOM} qui ne retourne rien.` | `private void verifier() {` |
| `Crée une méthode redéfinie nommée {NOM} qui ne retourne rien.` | `@Override`<br>`public void afficher() {` |
| `Crée une méthode de classe nommée {NOM} qui ne retourne rien et peut lancer {CLASSE}.` | `static void lire() throws IOException {` |
| `Retourne.` | `return;` |
| `Retourne la valeur {ENTIER}.` | `return 0;` |
| `Retourne le résultat de {EXPR}.` | `return a + b;` |
| `Retourne le texte {TEXTE}.` | `return "fini";` |
| `Appelle {NOM} avec {EXPR} et {EXPR}.` | `f(a, b);` |
| `Affecte à {NOM} le résultat de l'appel de {NOM} avec {EXPR}.` | `n = f(a);` |
| `Appelle la méthode {NOM} de {NOM}.` | `e.afficher();` |
| `Affecte à {NOM} le résultat de l'appel de la méthode {NOM} de {NOM}.` | `n = e.getAge();` |

**Deux informations passives :**

- `JAVA_STATIC_CANNOT_CALL_INSTANCE` — `main` est `static`, et une méthode
  **d'instance** ne peut pas y être appelée sans objet. A est sans état : il ne
  sait pas, en écrivant un appel, si la méthode visée est `static`. **La
  lacune n'est pas refermée**, et l'information le dit ;
- `JAVA_THROWS_IS_PART_OF_THE_SIGNATURE` — une méthode qui peut lancer une
  exception vérifiée le déclare **dans sa signature**. A ne peut pas l'ajouter
  après coup à une signature déjà écrite : règle 9. Voir décision **J6**.

## Domaine J6 — Tableaux et collections

| Phrase française | Java produit |
|---|---|
| `Crée un tableau de type {TYPE} nommé {NOM} de dimension {ENTIER}.` | `int[] notes = new int[10];` |
| `Déclare un tableau de type {TYPE} nommé {NOM}.` | `int[] notes;` |
| `Affecte la valeur {ENTIER} à l'élément {EXPR} du tableau {NOM}.` | `notes[0] = 15;` |
| `Affiche l'élément {EXPR} du tableau {NOM}.` | `System.out.print(notes[0]);` |
| `Affecte à {NOM} la taille du tableau {NOM}.` | `n = notes.length;` |
| `Crée une liste de type {TYPE} nommée {NOM}.` | `List<Integer> notes = new ArrayList<>();` |
| `Ajoute {EXPR} à la fin de la liste {NOM}.` | `notes.add(15);` |
| `Ajoute le texte {TEXTE} à la fin de la liste {NOM}.` | `noms.add("Ada");` |
| `Affecte à {NOM} l'élément {EXPR} de la liste {NOM}.` | `n = notes.get(0);` |
| `Affecte à {NOM} la taille de la liste {NOM}.` | `n = notes.size();` |
| `Retire l'élément {EXPR} de la liste {NOM}.` | `notes.remove(0);` |
| `Crée une table de type {TYPE} nommée {NOM} avec des clés textuelles.` | `Map<String, Integer> notes = new HashMap<>();` |
| `Associe {EXPR} à la clé {TEXTE} dans la table {NOM}.` | `notes.put("ada", 15);` |
| `Affecte à {NOM} la valeur de la clé {TEXTE} dans la table {NOM}.` | `n = notes.get("ada");` |
| `Crée un ensemble de type {TYPE} nommé {NOM}.` | `Set<Integer> vus = new HashSet<>();` |
| `Ajoute {EXPR} à l'ensemble {NOM}.` | `vus.add(3);` |
| `Crée une boucle pour chaque clé textuelle nommée {NOM} de la table {NOM}.` | `for (String cle : notes.keySet()) {` |

**Le mot `tableau` ou `liste` est dans la phrase, et ce n'est pas une
lourdeur : c'est la décision J10.** `notes[0]` et `notes.get(0)` sont deux
codes différents, et A — sans état — ne sait pas si `notes` est un tableau ou
une `List`. Une phrase unique serait **ambiguë**, donc refusée ; deux phrases
distinctes sont la seule issue qui n'invente rien.

**Trois informations passives :**

- `JAVA_NEW_ARRAY_IS_ZEROED` — `new int[10]` met **tout à zéro**, là où le C
  laisse la mémoire indéterminée ;
- `JAVA_COLLECTION_NEEDS_AN_IMPORT` — `List`, `ArrayList`, `Map`, `Scanner`…
  exigent un `import`. A ne l'ajoute pas : règle 3. `Importe {CLASSE}.` est une
  phrase, et son absence est une erreur de compilation que A **ne masque pas** ;
- `JAVA_GENERICS_BOX_PRIMITIVES` — une `List<Integer>` range des **objets**
  `Integer`, pas des `int`. `==` entre deux `Integer` compare des références.

## Domaine J7 — Classes, objets, constructeurs, encapsulation

| Phrase française | Java produit |
|---|---|
| `Ajoute un champ de type {TYPE} nommé {NOM}.` | `int age;` |
| `Ajoute un champ privé de type {TYPE} nommé {NOM}.` | `private int age;` |
| `Ajoute un champ de type chaîne nommé {NOM}.` | `String nom;` |
| `Ajoute un champ tableau de type {TYPE} nommé {NOM} de dimension {ENTIER}.` | `int[] notes = new int[10];` |
| `Crée un constructeur qui ne prend rien.` | `public Eleve() {` … `}` |
| `Crée un constructeur qui prend un {TYPE} nommé {NOM}.` | `public Eleve(int age) {` |
| `Affecte au champ {NOM} la valeur du paramètre {NOM}.` | `this.age = age;` |
| `Affecte la valeur {ENTIER} au champ {NOM}.` | `this.age = 20;` |
| `Affecte au champ {NOM} le résultat numérique de {EXPR}.` | `this.moyenne = total / n;` |
| `Crée un objet nommé {NOM} de la classe {CLASSE}.` | `Eleve e = new Eleve();` |
| `Crée un objet nommé {NOM} de la classe {CLASSE} avec {EXPR}.` | `Eleve e = new Eleve(20);` |
| `Affiche le champ {NOM} de {NOM}.` | `System.out.print(e.age);` |
| `Affecte au champ {NOM} de {NOM} la valeur {ENTIER}.` | `e.age = 20;` |
| `Affecte à {NOM} le champ {NOM} de {NOM}.` | `n = e.age;` |

**Le nom de la classe n'est pas dans la phrase du constructeur.** Il est lu
dans le **contexte** — la classe englobante —, exactement comme le lot 20 lit
la structure englobante par `structTarget.ts`. Hors d'une classe, le refus est
`CONSTRUCTEUR_HORS_CLASSE`, et il ne produit aucun fragment.

**Deux informations passives :**

- `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` — A n'applique **aucun** contrôle de
  visibilité. Écrire `e.age` sur un champ `private` depuis une autre classe est
  accepté par A et **refusé par `javac`** ;
- `JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS` — dès qu'un constructeur est écrit, le
  constructeur sans argument **cesse d'exister**. `new Eleve()` ne compile
  plus, et A ne le sait pas.

## Domaine J8 — Héritage, interfaces, polymorphisme

| Phrase française | Java produit |
|---|---|
| `Crée une classe nommée {CLASSE} qui hérite de {CLASSE}.` | `public class Etudiant extends Personne {` |
| `Crée une classe abstraite nommée {CLASSE}.` | `public abstract class Forme {` |
| `Crée une interface nommée {CLASSE}.` | `public interface Affichable {` |
| `Crée une classe nommée {CLASSE} qui implémente {CLASSE}.` | `public class Eleve implements Affichable {` |
| `Ajoute une méthode attendue nommée {NOM} qui ne retourne rien.` | `void afficher();` |
| `Ajoute une méthode attendue nommée {NOM} qui retourne un {TYPE}.` | `int taille();` |
| `Ajoute une méthode abstraite nommée {NOM} qui retourne un {TYPE}.` | `abstract int aire();` |
| `Appelle le constructeur de la classe parente.` | `super();` |
| `Appelle le constructeur de la classe parente avec {EXPR}.` | `super(20);` |
| `Appelle la méthode {NOM} de la classe parente.` | `super.afficher();` |
| `Déclare une variable de type {CLASSE} nommée {NOM}.` | `Affichable a;` |
| `Crée une variable de type {CLASSE} nommée {NOM} comme un objet de la classe {CLASSE}.` | `Affichable a = new Eleve();` |

**Deux informations passives :**

- `JAVA_OVERRIDE_IS_CHECKED_BY_JAVAC` — `@Override` ne **crée** pas une
  redéfinition, il demande au compilateur de **vérifier** qu'il y en a une.
  C'est le seul endroit du catalogue Java où le compilateur protège
  l'utilisateur d'une faute que A ne voit pas ;
- `JAVA_INTERFACE_METHOD_HAS_NO_BODY` — une méthode attendue n'a **pas** de
  corps, et A crée donc une ligne, pas un bloc. Un `{` y serait une erreur de
  syntaxe.

## Domaine J9 — Exceptions, paquetages, fichiers

| Phrase française | Java produit |
|---|---|
| `Déclare le paquetage {NOM}.` | `package ecole;` |
| `Importe {CLASSE}.` | `import java.util.List;` |
| `Crée un bloc essaie.` | `try {` … `}` |
| `Ajoute une branche attrape {CLASSE} nommée {NOM}.` | `} catch (IOException e) {` |
| `Ajoute une branche finalement.` | `} finally {` |
| `Lance une exception {CLASSE} avec le texte {TEXTE}.` | `throw new IllegalArgumentException("âge négatif");` |
| `Affiche le message de l'exception {NOM}.` | `System.out.print(e.getMessage());` |
| `Vérifie que {EXPR}.` | `assert x > 0;` |
| `Crée un bloc essaie avec un lecteur nommé {NOM} sur le fichier {TEXTE}.` | `try (BufferedReader lecteur = new BufferedReader(new FileReader("notes.txt"))) {` |
| `Crée un bloc essaie avec un écrivain nommé {NOM} sur le fichier {TEXTE}.` | `try (PrintWriter f = new PrintWriter("sortie.txt")) {` |
| `Lis une ligne depuis le lecteur {NOM} dans {NOM}.` | `ligne = lecteur.readLine();` |
| `Écris le texte {TEXTE} dans l'écrivain {NOM}.` | `f.print("fin");` |
| `Écris la valeur de {NOM} dans l'écrivain {NOM}.` | `f.print(n);` |

**Trois informations passives :**

- `JAVA_TRY_WITH_RESOURCES_CLOSES` — le bloc essaie **avec** ressource ferme
  le fichier tout seul. Même leçon que `with` en Python, et l'inverse de
  `fclose` en C17, qui doit être appelé ;
- `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` — lire un fichier **oblige** à
  attraper `IOException` ou à la déclarer. Ce n'est pas un conseil : sans l'un
  des deux, `javac` **refuse** ;
- `JAVA_ASSERT_IS_DISABLED_BY_DEFAULT` — les assertions sont **inactives**
  sans `-ea` à l'exécution. Une `assert` qui ne se déclenche jamais n'est pas
  une preuve que la condition est vraie.

---

## Décompte

| Domaine | Formulations |
|---|---|
| J1 — fondamentaux, point d'entrée, types | 15 |
| J2 — affichage et saisie | 13 |
| J3 — expressions et calculs | 13 |
| J4 — structures de contrôle | 15 |
| J5 — méthodes | 15 |
| J6 — tableaux et collections | 17 |
| J7 — classes, objets, constructeurs | 14 |
| J8 — héritage, interfaces, polymorphisme | 12 |
| J9 — exceptions, paquetages, fichiers | 13 |
| **total** | **127** |

Plus les **7** reprises directes du catalogue partagé dont la phrase **et** la
sortie sont inchangées — `if`, `else`, `while`, `break`, `continue`, `return`,
`do while` — déjà comptées dans J4 et J5 ; et les **24** informations passives
nommées ci-dessus.

**Ce décompte est une proposition.** Il peut monter : rien ne le plafonne. Il
peut aussi descendre, si une décision retire un domaine du périmètre V1.
