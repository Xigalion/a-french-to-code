# Catalogue Java-A — spécification, table complète

*Fichier **généré**. Ne pas l’éditer : `node scripts/catalogue-java.mjs --markdown`
le réécrit depuis `catalogue-java.json`, qui est la source.*

| | |
|---|---|
| formulations | **144** |
| dont reprises du catalogue partagé | 30 |
| dont adaptations sémantiques | 27 |
| dont propres à Java | **87** |
| intentions partagées à porter, couvertes | 57 / 57 |

Origine : **reprise** = phrase et sens inchangés ; **adaptation** = la phrase ou la
sortie change, et une information dit pourquoi ; **native** = aucune racine dans C
ni Python.

## J1 — Fondamentaux, point d’entrée, types  (18)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Crée la fonction principale.` | `public static void main(String[] args) {` | adaptation · `MAIN` |
| `Crée un booléen nommé {NOM} de valeur faux.` | `boolean fini = false;` | native |
| `Crée un booléen nommé {NOM} de valeur vrai.` | `boolean fini = true;` | native |
| `Crée un caractère nommé {NOM} de valeur {CAR}.` | `char initiale = 'A';` | reprise · `INIT_CHAR` |
| `Crée un entier long nommé {NOM} de valeur {ENTIER}.` | `long grand = 10000000000L;` | native |
| `Crée un entier nommé {NOM} de valeur {ENTIER}.` | `int age = 20;` | reprise · `INIT_INT` |
| `Crée un réel nommé {NOM} de valeur {EXPR}.` | `double moyenne = 1.5;` | reprise · `NUMERIC_INIT` |
| `Crée un réel simple nommé {NOM} de valeur {EXPR}.` | `float x = 1.5f;` | native |
| `Crée un tableau de type char nommé {NOM} de dimension {ENTIER} avec le texte {TEXTE}.` | `String s = "hello";` | adaptation · `STRING_INIT` |
| `Crée une classe interne nommée {CLASSE}.` | `class Noeud {` | native |
| `Crée une classe nommée {CLASSE}.` | `public class Eleve {` | native |
| `Crée une constante entière de classe nommée {NOM} de valeur {ENTIER}.` | `static final int MAX = 100;` | native |
| `Déclare un booléen nommé {NOM}.` | `boolean fini;` | native |
| `Déclare un caractère nommé {NOM}.` | `char c;` | reprise · `DECL_CHAR` |
| `Déclare un entier nommé {NOM}.` | `int n;` | reprise · `DECL_INT` |
| `Déclare un réel nommé {NOM}.` | `double x;` | reprise · `NUMERIC_DECL` |
| `Déclare une chaîne nommée {NOM}.` | `String nom;` | native |
| `Déclare une constante de type {TYPE} nommée {NOM} avec le résultat de {EXPR}.` | `final int MAX = 100;` | adaptation · `CONST_DECL` |

## J2 — Affichage et saisie  (12)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Affiche la chaîne {NOM}.` | `System.out.print(nom);` | adaptation · `PRINT_STRING` |
| `Affiche la valeur de {NOM} et passe à la ligne.` | `System.out.println(n);` | native |
| `Affiche la valeur de {NOM}.` | `System.out.print(n);` | adaptation · `PRINT_INT` |
| `Affiche le caractère {NOM}.` | `System.out.print(c);` | adaptation · `PRINT_CHAR` |
| `Affiche le texte {TEXTE} et passe à la ligne.` | `System.out.println("bonjour");` | native |
| `Affiche le texte {TEXTE}.` | `System.out.print("bonjour");` | adaptation · `PRINT_TEXT` |
| `Affiche un retour à la ligne.` | `System.out.println();` | adaptation · `PRINT_NEWLINE` |
| `Affiche {NOM} en décimal.` | `System.out.printf("%d", n);` | adaptation · `PRINT_FORMATTED` |
| `Affiche {NOM} en notation fixe avec {ENTIER} décimales.` | `System.out.printf("%.2f", x);` | adaptation · `NUMERIC_PRINT` |
| `Crée un lecteur de saisie nommé {NOM}.` | `Scanner lecteur = new Scanner(System.in);` | native |
| `Lis un entier depuis le lecteur de saisie {NOM} dans {NOM}.` | `n = lecteur.nextInt();` | native |
| `Lis une ligne depuis le lecteur de saisie {NOM} dans {NOM}.` | `ligne = lecteur.nextLine();` | native |

## J3 — Expressions et calculs  (14)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Affecte la valeur {ENTIER} à {NOM}.` | `n = 20;` | reprise · `ASSIGN_INT` |
| `Affecte le caractère {CAR} à {NOM}.` | `c = 'A';` | reprise · `ASSIGN_CHAR` |
| `Affecte le texte {TEXTE} à {NOM}.` | `s = "Ada";` | native |
| `Affecte à {NOM} la comparaison des chaînes {NOM} et {NOM}.` | `egal = a.equals(b);` | native |
| `Affecte à {NOM} la concaténation de {NOM} et {TEXTE}.` | `s = s + "!";` | native |
| `Affecte à {NOM} la conversion en entier de la chaîne {NOM}.` | `n = Integer.parseInt(s);` | native |
| `Affecte à {NOM} la longueur de la chaîne {NOM}.` | `n = s.length();` | native |
| `Affecte à {NOM} le caractère d’indice {EXPR} de la chaîne {NOM}.` | `c = s.charAt(i);` | native |
| `Affecte à {NOM} le résultat converti en entier de {EXPR}.` | `n = (int) x;` | native |
| `Affecte à {NOM} le résultat converti en réel de {EXPR}.` | `x = (double) n;` | native |
| `Affecte à {NOM} le résultat de {EXPR}.` | `n = a + b;` | reprise · `ASSIGN_EXPRESSION` |
| `Affecte à {NOM} le résultat numérique de {EXPR}.` | `x = a / 2.0;` | reprise · `NUMERIC_ASSIGN` |
| `Décrémente {NOM}.` | `n -= 1;` | native |
| `Incrémente {NOM}.` | `n += 1;` | native |

## J4 — Structures de contrôle  (16)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Ajoute le cas par défaut.` | `default:` | reprise · `CASE_DEFAULT` |
| `Ajoute un cas pour la valeur {ENTIER}.` | `case 1:` | reprise · `CASE_INT` |
| `Ajoute un cas pour le caractère {CAR}.` | `case 'A':` | reprise · `CASE_CHAR` |
| `Ajoute un cas pour le texte {TEXTE}.` | `case "lundi":` | native |
| `Ajoute une branche sinon si {EXPR}.` | `} else if (x < 0) {` | reprise · `ELSE_IF` |
| `Ajoute une branche sinon.` | `} else {` | reprise · `ELSE` |
| `Crée un aiguillage sur {EXPR}.` | `switch (jour) {` | reprise · `SWITCH` |
| `Crée un bloc si {EXPR}.` | `if (x > 0) {` | reprise · `IF` |
| `Crée une boucle avec test final tant que {EXPR}.` | `do {` | reprise · `DO_WHILE` |
| `Crée une boucle pour chaque {TYPE} nommé {NOM} de la liste {NOM}.` | `for (int v : notes) {` | native |
| `Crée une boucle pour chaque {TYPE} nommé {NOM} du tableau {NOM}.` | `for (int v : notes) {` | native |
| `Crée une boucle pour {NOM} de valeur initiale {EXPR} tant que {EXPR} avec mise à jour {EXPR}.` | `for (i = 0; i < 10; i = (i + 1)) {` | reprise · `FOR` |
| `Crée une boucle tant que {EXPR}.` | `while (i < 10) {` | reprise · `WHILE` |
| `Passe à l’itération suivante de la boucle la plus intérieure.` | `continue;` | reprise · `CONTINUE` |
| `Sors de la boucle la plus intérieure.` | `break;` | reprise · `BREAK` |
| `Sors de l’aiguillage.` | `break;` | reprise · `BREAK_SWITCH` |

## J5 — Méthodes  (17)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Affecte à {NOM} le résultat de l’appel de la méthode {NOM} de {NOM}.` | `n = e.getAge();` | native |
| `Affecte à {NOM} le résultat de l’appel de {NOM} avec {EXPR}.` | `n = f(a);` | reprise · `CALL_ASSIGN` |
| `Appelle la méthode {NOM} de {NOM}.` | `e.afficher();` | native |
| `Appelle {NOM}.` | `f();` | reprise · `CALL` |
| `Crée une fonction nommée {NOM} qui retourne un {TYPE}.` | `static void affiche() {` | adaptation · `FUNC_DEF` |
| `Crée une méthode de classe nommée {NOM} qui ne retourne rien et peut lancer {CLASSE}.` | `static void lire() throws IOException {` | native |
| `Crée une méthode de classe nommée {NOM} qui ne retourne rien.` | `static void f() {` | native |
| `Crée une méthode privée nommée {NOM} qui ne retourne rien.` | `private void verifier() {` | native |
| `Crée une méthode publique nommée {NOM} qui ne retourne rien.` | `public void afficher() {` | native |
| `Crée une méthode publique nommée {NOM} qui retourne un {TYPE}.` | `public int getAge() {` | native |
| `Crée une méthode redéfinie nommée {NOM} qui ne retourne rien.` | `@Override<br>public void afficher() {` | native |
| `Retourne la chaîne {NOM}.` | `return nom;` | native |
| `Retourne la valeur {ENTIER}.` | `return 0;` | reprise · `RETURN_INT` |
| `Retourne le résultat de {EXPR}.` | `return a + b;` | reprise · `RETURN_EXPRESSION` |
| `Retourne le résultat numérique de {EXPR}.` | `return total / n;` | reprise · `RETURN_NUMERIC` |
| `Retourne le texte {TEXTE}.` | `return "fini";` | native |
| `Retourne.` | `return;` | reprise · `RETURN` |

## J6 — Tableaux et collections  (25)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Affecte la valeur {ENTIER} à l’élément {EXPR} de {NOM}.` | `t[0] = 5;` | adaptation · `ARRAY_ASSIGN_INT` |
| `Affecte la valeur {ENTIER} à l’élément {EXPR} du tableau {NOM}.` | `t[0] = 5;` | native |
| `Affecte le caractère {CAR} à l’élément {EXPR} de {NOM}.` | `t[0] = 'A';` | adaptation · `ARRAY_ASSIGN_CHAR` |
| `Affecte le caractère {CAR} à l’élément {EXPR} du tableau {NOM}.` | `t[0] = 'A';` | native |
| `Affecte à l’élément {EXPR} de {NOM} le résultat numérique de {EXPR}.` | `t[i] = (a + 1);` | adaptation · `ARRAY_ASSIGN_EXPRESSION` |
| `Affecte à l’élément {EXPR} du tableau {NOM} le résultat numérique de {EXPR}.` | `t[i] = (a + 1);` | native |
| `Affecte à {NOM} la taille de la liste {NOM}.` | `n = notes.size();` | native |
| `Affecte à {NOM} la taille du tableau {NOM}.` | `n = notes.length;` | native |
| `Affecte à {NOM} la valeur de la clé {TEXTE} dans la table {NOM}.` | `n = notes.get("ada");` | native |
| `Affecte à {NOM} l’élément {EXPR} de la liste {NOM}.` | `n = notes.get(0);` | native |
| `Affiche le caractère de l’élément {EXPR} de {NOM}.` | `System.out.print(s[i]);` | adaptation · `ARRAY_PRINT_CHAR` |
| `Affiche le caractère de l’élément {EXPR} du tableau {NOM}.` | `System.out.print(s[i]);` | native |
| `Affiche l’élément {EXPR} de {NOM}.` | `System.out.print(t[0]);` | adaptation · `ARRAY_PRINT` |
| `Affiche l’élément {EXPR} du tableau {NOM}.` | `System.out.print(t[0]);` | native |
| `Ajoute le texte {TEXTE} à la fin de la liste {NOM}.` | `noms.add("Ada");` | native |
| `Ajoute {EXPR} à la fin de la liste {NOM}.` | `notes.add(15);` | native |
| `Ajoute {EXPR} à l’ensemble {NOM}.` | `vus.add(3);` | native |
| `Associe {EXPR} à la clé {TEXTE} dans la table {NOM}.` | `notes.put("ada", 15);` | native |
| `Crée un ensemble de type {TYPE} nommé {NOM}.` | `Set<Integer> vus = new HashSet<>();` | native |
| `Crée une boucle pour chaque clé textuelle nommée {NOM} de la table {NOM}.` | `for (String cle : notes.keySet()) {` | native |
| `Crée une liste de type {TYPE} nommée {NOM}.` | `List<Integer> notes = new ArrayList<>();` | native |
| `Crée une table de type {TYPE} nommée {NOM} avec des clés textuelles.` | `Map<String, Integer> notes = new HashMap<>();` | native |
| `Déclare un tableau de type {TYPE} nommé {NOM} de dimension {ENTIER}.` | `int[] t = new int[10];` | adaptation · `ARRAY_DECL` |
| `Déclare un tableau de type {TYPE} nommé {NOM}.` | `int[] notes;` | native |
| `Retire l’élément {EXPR} de la liste {NOM}.` | `notes.remove(0);` | native |

## J7 — Classes, objets, constructeurs, encapsulation  (15)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Affecte au champ {NOM} de {NOM} le résultat numérique de {EXPR}.` | `p.x = (a + 1);` | adaptation · `MEMBER_ASSIGN_EXPRESSION` |
| `Affecte au champ {NOM} la valeur du paramètre {NOM}.` | `this.age = age;` | native |
| `Affecte la valeur {ENTIER} au champ {NOM} de {NOM}.` | `p.x = 5;` | adaptation · `MEMBER_ASSIGN_INT` |
| `Affecte le caractère {CAR} au champ {NOM} de {NOM}.` | `e.initiale = 'A';` | adaptation · `MEMBER_ASSIGN_CHAR` |
| `Affecte à {NOM} le champ {NOM} de {NOM}.` | `n = e.age;` | native |
| `Affiche le champ {NOM} de {NOM}.` | `System.out.print(p.x);` | adaptation · `MEMBER_PRINT` |
| `Ajoute un champ de type chaîne nommé {NOM}.` | `String nom;` | native |
| `Ajoute un champ de type {TYPE} nommé {NOM}.` | `int x;` | adaptation · `STRUCT_FIELD` |
| `Ajoute un champ privé de type {TYPE} nommé {NOM}.` | `private int age;` | native |
| `Ajoute un champ tableau de type {TYPE} nommé {NOM} de dimension {ENTIER}.` | `int[] notes = new int[10];` | native |
| `Crée un constructeur qui ne prend rien.` | `public Eleve() {` | native |
| `Crée un constructeur qui prend un {TYPE} nommé {NOM}.` | `public Eleve(int age) {` | native |
| `Crée un objet nommé {NOM} de la classe {CLASSE} avec {EXPR}.` | `Eleve e = new Eleve(20);` | native |
| `Déclare une structure nommée {CLASSE}.` | `class Point {` | adaptation · `STRUCT_DECL` |
| `Déclare une variable de type structure {CLASSE} nommée {NOM}.` | `Point p = new Point();` | adaptation · `STRUCT_VAR` |

## J8 — Héritage, interfaces, polymorphisme  (13)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Ajoute une méthode abstraite nommée {NOM} qui retourne un {TYPE}.` | `abstract int aire();` | native |
| `Ajoute une méthode attendue nommée {NOM} qui ne retourne rien.` | `void afficher();` | native |
| `Ajoute une méthode attendue nommée {NOM} qui retourne un {TYPE}.` | `int taille();` | native |
| `Appelle la méthode {NOM} de la classe parente.` | `super.afficher();` | native |
| `Appelle le constructeur de la classe parente avec {EXPR}.` | `super(20);` | native |
| `Appelle le constructeur de la classe parente.` | `super();` | native |
| `Crée une classe abstraite nommée {CLASSE}.` | `public abstract class Forme {` | native |
| `Crée une classe nommée {CLASSE} qui hérite de {CLASSE}.` | `public class Etudiant extends Personne {` | native |
| `Crée une classe nommée {CLASSE} qui implémente {CLASSE}.` | `public class Eleve implements Affichable {` | native |
| `Crée une interface nommée {CLASSE}.` | `public interface Affichable {` | native |
| `Crée une variable de type {CLASSE} nommée {NOM} comme un objet de la classe {CLASSE} avec {EXPR}.` | `Affichable a = new Eleve(12);` | native |
| `Crée une variable de type {CLASSE} nommée {NOM} comme un objet de la classe {CLASSE}.` | `Affichable a = new Eleve();` | native |
| `Déclare une variable de type {CLASSE} nommée {NOM}.` | `Affichable a;` | native |

## J9 — Exceptions, paquetages, fichiers  (14)

| Phrase française | Java produit | Origine |
|---|---|---|
| `Affiche le message de l’exception {NOM}.` | `System.out.print(e.getMessage());` | native |
| `Ajoute une branche attrape {CLASSE} nommée {NOM}.` | `catch (IOException e) {` | native |
| `Ajoute une branche finalement.` | `finally {` | native |
| `Crée un bloc essaie avec un lecteur nommé {NOM} sur le fichier {TEXTE}.` | `try (BufferedReader lecteur = new BufferedReader(new FileReader("notes.txt"))) {` | native |
| `Crée un bloc essaie avec un écrivain nommé {NOM} sur le fichier {TEXTE}.` | `try (PrintWriter f = new PrintWriter("sortie.txt")) {` | native |
| `Crée un bloc essaie.` | `try {` | native |
| `Déclare le paquetage {NOM}.` | `package ecole;` | native |
| `Importe {CLASSE}.` | `import java.util.List;` | native |
| `Lance une exception {CLASSE} avec le texte {TEXTE}.` | `throw new IllegalArgumentException("âge négatif");` | native |
| `Lis une chaîne de dimension {ENTIER} depuis le fichier {NOM} dans {NOM}.` | `s = f.readLine();` | adaptation · `FILE_READ_STRING` |
| `Lis une ligne depuis le lecteur {NOM} dans {NOM}.` | `ligne = lecteur.readLine();` | native |
| `Vérifie que {EXPR}.` | `assert x > 0;` | reprise · `ASSERT` |
| `Écris la valeur de {NOM} dans le fichier {NOM}.` | `f.print(x);` | adaptation · `FILE_WRITE_INT` |
| `Écris le texte {TEXTE} dans le fichier {NOM}.` | `f.print("bonjour");` | adaptation · `FILE_WRITE_TEXT` |

