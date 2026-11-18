# Catalogue Java — ce que Java-A écrit, et ce qu’il refuse

*Fichier **engendré** : `node scripts/catalogue-java-public.mjs`. Chaque ligne sort du
moteur, pas d’une rédaction. Un catalogue écrit à la main se périme en silence, et ce
projet l’a déjà payé une fois.*

**Java 21 LTS**, sans aucune fonctionnalité en avant-première. Java-A ne vérifie **ni**
les types, **ni** les symboles, **ni** les bornes, **ni** la visibilité : une insertion
acceptée n’est pas un programme correct, et ne garantit pas qu’il compile.

| | |
|---|---|
| intentions du catalogue partagé **rendues** | **57** |
| intentions du catalogue partagé **non portées** | **27**, dont 27 atteignables par une phrase du catalogue |
| intentions portées dont la **construction** est refusée | **10** |
| intentions **natives** de Java | **87** |
| informations pédagogiques passives | **28** |
| portées de placement | **4** — la portée fichier, un corps de classe, un corps de méthode, un corps d’interface |

---

## 1. Les intentions du catalogue partagé que Java rend

Une phrase écrite pour C17 produit du Java, **ou un refus nommé**. Jamais une
approximation.

| Phrase française | Java produit | Information |
|---|---|---|
| `Crée la fonction principale.` | `public static void main(String[] args) {` + `    ` + `}` | `JAVA_STATIC_CANNOT_CALL_INSTANCE` |
| `Déclare un entier nommé age.` | `int age;` | — |
| `Crée un entier nommé age de valeur 20.` | `int age = 20;` | — |
| `Affecte la valeur 25 à age.` | `age = 25;` | — |
| `Affiche la valeur de age.` | `System.out.print(age);` | `JAVA_PRINTLN_ADDS_A_LINE` |
| `Affiche age en décimal.` | `System.out.printf("%d", age);` | — |
| `Affiche le texte "Bonjour\n".` | `System.out.print("Bonjour\n");` | `JAVA_PRINTLN_ADDS_A_LINE` |
| `Affiche un retour à la ligne.` | `System.out.println();` | — |
| `Affecte à resultat le résultat de "2 + 3 * 4".` | `resultat = (2 + (3 * 4));` | `JAVA_INTEGER_DIVISION_TRUNCATES`, `JAVA_MODULO_FOLLOWS_DIVIDEND` |
| `Déclare une variable de type double nommée x.` | `double x;` | — |
| `Crée une variable de type double nommée x avec le résultat de "1.5".` | `double x = 1.5;` | `JAVA_FLOAT_NEEDS_SUFFIX` |
| `Affecte à x le résultat numérique de "(double) 7 / 2".` | `x = ((double) 7 / 2);` | `JAVA_INTEGER_DIVISION_TRUNCATES`, `JAVA_MODULO_FOLLOWS_DIVIDEND` |
| `Affiche x en notation fixe avec 2 décimales.` | `System.out.printf("%.2f", x);` | — |
| `Ajoute une branche sinon si "age >= 12".` | `else if (age >= 12) {` + `    ` + `}` | — |
| `Ajoute une branche sinon.` | `else {` + `    ` + `}` | — |
| `Crée une boucle tant que "i < limite".` | `while (i < limite) {` + `    ` + `}` | — |
| `Crée une boucle avec test final tant que "i < limite".` | `do {` + `    ` + `} while (i < limite);` | — |
| `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | `for (i = 0; i < 3; i = (i + 1)) {` + `    ` + `}` | — |
| `Sors de la boucle la plus intérieure.` | `break;` | — |
| `Passe à l’itération suivante de la boucle la plus intérieure.` | `continue;` | — |
| `Crée une fonction nommée affiche qui ne retourne rien.` | `static void affiche() {` + `    ` + `}` | `JAVA_STATIC_CANNOT_CALL_INSTANCE`, `JAVA_THROWS_IS_PART_OF_THE_SIGNATURE` |
| `Retourne.` | `return;` | — |
| `Retourne la valeur 0.` | `return 0;` | — |
| `Retourne le résultat de "a + b".` | `return (a + b);` | — |
| `Retourne le résultat numérique de "(double) a / b".` | `return ((double) a / b);` | — |
| `Appelle affiche.` | `affiche();` | — |
| `Affecte à total le résultat de l’appel de somme avec "2" et "3".` | `total = somme(2, 3);` | — |
| `Déclare un caractère nommé c.` | `char c;` | `JAVA_CHAR_IS_16_BIT` |
| `Crée un caractère nommé c de valeur 'A'.` | `char c = 'A';` | `JAVA_CHAR_IS_16_BIT` |
| `Affecte le caractère 'A' à c.` | `c = 'A';` | `JAVA_CHAR_IS_16_BIT` |
| `Affiche le caractère c.` | `System.out.print(c);` | `JAVA_PRINTLN_ADDS_A_LINE` |
| `Déclare un tableau de type int nommé t de dimension 10.` | `int[] t = new int[10];` | `JAVA_NEW_ARRAY_IS_ZEROED`, `JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE` |
| `Affecte la valeur 5 à l'élément "0" de t.` | `t[0] = 5;` | `JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE` |
| `Affecte le caractère 'A' à l'élément "0" de t.` | `t[0] = 'A';` | — |
| `Affecte à l'élément "i" de t le résultat numérique de "a + 1".` | `t[i] = (a + 1);` | — |
| `Affiche l'élément "0" de t.` | `System.out.print(t[0]);` | `JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE` |
| `Crée un bloc si "t[i] > 0".` | `if (t[i] > 0) {` + `    ` + `}` | — |
| `Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".` | `String s = "hello";` | `JAVA_EQUALS_NOT_DOUBLE_EQUAL` |
| `Affiche la chaîne s.` | `System.out.print(s);` | `JAVA_PRINTLN_ADDS_A_LINE` |
| `Affiche le caractère de l'élément "i" de s.` | `System.out.print(s[i]);` | — |
| `Crée un aiguillage sur "jour".` | `switch (jour) {` + `    ` + `}` | `JAVA_SWITCH_FALLS_THROUGH` |
| `Ajoute un cas pour la valeur 5.` | `case 5:` | `JAVA_SWITCH_FALLS_THROUGH` |
| `Ajoute un cas pour le caractère 'A'.` | `case 'A':` | `JAVA_SWITCH_FALLS_THROUGH` |
| `Ajoute le cas par défaut.` | `default:` | `JAVA_SWITCH_FALLS_THROUGH` |
| `Sors de l'aiguillage.` | `break;` | — |
| `Déclare une structure nommée Point.` | `class Point {` + `    ` + `}` | `JAVA_CLASS_NAME_IS_FILE_NAME` |
| `Ajoute un champ de type int nommé x.` | `int x;` | `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` |
| `Déclare une variable de type structure Point nommée p.` | `Point p = new Point();` | `JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS` |
| `Affecte la valeur 5 au champ x de p.` | `p.x = 5;` | `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` |
| `Affecte au champ x de p le résultat numérique de "a + 1".` | `p.x = (a + 1);` | — |
| `Affecte le caractère 'A' au champ initiale de e.` | `e.initiale = 'A';` | — |
| `Affiche le champ x de p.` | `System.out.print(p.x);` | `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` |
| `Écris le texte "bonjour" dans le fichier f.` | `f.print("bonjour");` | `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` |
| `Écris la valeur de x dans le fichier f.` | `f.print(x);` | `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` |
| `Lis une chaîne de dimension 32 depuis le fichier f dans s.` | `s = f.readLine();` | `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` |
| `Vérifie que "x > 0".` | `assert x > 0;` | `JAVA_ASSERT_IS_DISABLED_BY_DEFAULT` |
| `Déclare une constante de type int nommée MAX avec le résultat de "100".` | `final int MAX = 100;` | `JAVA_FLOAT_NEEDS_SUFFIX` |

## 2. Les intentions que Java refuse, et ce qui les remplace

Un refus de portage n’est **pas** une interdiction d’apprendre la notion : chacun
désigne la construction Java qui enseigne la même compétence.

### 2.1 Java n’a pas la notion — `INTENTION_NON_PORTEE`

| Phrase française | Pourquoi, et ce qui la remplace |
|---|---|
| `Affecte à p l'allocation de 10 éléments de type int.` | Java a un ramasse-miettes : la mémoire ne s’alloue ni ne se libère à la main, et une allocation oubliée n’existe pas comme défaut. Ce que « new » demande suffit, et pour une longueur ce sont « la taille du tableau » ou « la taille de la liste » qui répondent. |
| `Affecte l'adresse de x à p.` | Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, il ne la supprime pas. |
| `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` | Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, il ne la supprime pas. |
| `Affecte la valeur 5 à la valeur pointée par p.` | Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, il ne la supprime pas. |
| `Déclare un pointeur de type int nommé p.` | Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, il ne la supprime pas. |
| `Crée un bloc si la fin du fichier f est atteinte.` | Java n’a pas d’indicateur de fin de fichier à interroger : « readLine » rend une valeur nulle quand il n’y a plus de ligne, et c’est **cela** que la boucle teste. Le détour par un indicateur, qui en C mène au défaut classique de la dernière ligne lue deux fois, n’existe pas ici. |
| `Ferme le fichier f.` | Le bloc essaie **avec ressource** ferme le fichier tout seul, même si une exception survient : il n’y a pas de fermeture à écrire, et donc pas de fermeture à oublier. C’est la même leçon que « with » en Python, et l’inverse exact de C17, où il **faut** fermer. |
| `Déclare un fichier nommé f.` | Java n’a pas de « FILE* » à déclarer : le lecteur ou l’écrivain naît **avec** le fichier qu’il ouvre, dans un bloc essaie avec ressource. « Crée un bloc essaie avec un lecteur nommé f sur le fichier "notes.txt". » déclare et ouvre d’un seul geste. |
| `Affecte à f l'ouverture du fichier "donnees.txt" en lecture.` | L’ouverture n’est pas une instruction séparée en Java : elle se fait à la création du lecteur ou de l’écrivain, dans un bloc essaie avec ressource. Les modes du C — lecture, écriture, ajout — se choisissent en choisissant la classe, pas une lettre. |
| `Lis un entier depuis le fichier f dans x.` | Java lit une **ligne**, pas un entier : « lire un entier » y est deux gestes, et les confondre cacherait l’endroit où une saisie invalide échoue. Lisez la ligne, puis convertissez — « Affecte à n la conversion en entier de la chaîne ligne. ». |
| `Libère la mémoire pointée par p.` | Java a un ramasse-miettes : rien ne se libère à la main, et il n’y a donc pas de double libération possible. La discipline que « free » enseignait — savoir qui possède une donnée — reste utile, mais elle ne s’écrit plus dans le code. |
| `Déclare le prototype d'une fonction nommée somme qui retourne un int et prend un int nommé a.` | Java n’a pas de déclaration séparée : l’ordre des méthodes dans une classe est libre, et une méthode peut en appeler une autre écrite plus bas. Le prototype n’y a aucun rôle, et ce qu’il protégeait — se mettre d’accord sur une signature avant de l’écrire — s’obtient par une **interface**. |
| `Ferme la protection d'en-tête.` | Une double inclusion est impossible en Java : il n’y a aucune garde à fermer, parce qu’il n’y en a aucune à ouvrir. |
| `Ouvre la protection d'en-tête nommée CALCUL_H.` | Une double inclusion est impossible en Java : rien n’est inclus textuellement, donc le problème que la garde résout n’existe pas. Il n’y a rien à écrire à la place — et c’est le seul refus de cette liste qui ne désigne aucun remplacement. |
| `Inclue la bibliothèque assert.h.` | Java n’a pas de préprocesseur, et « assert » est un **mot du langage** : rien ne s’inclut pour l’obtenir. Il est en revanche inactif sans l’option « -ea » à l’exécution, ce que l’information passive de l’assertion rappelle. |
| `Inclue la bibliothèque limits.h.` | Java n’a pas de préprocesseur : rien n’est inclus textuellement avant la compilation. Ce qu’un en-tête apportait s’obtient par « Importe … », qui nomme une classe et non un fichier. Les limites des types entiers sont des constantes de classe — « Integer.MAX_VALUE » — et s’écrivent dans une expression comme n’importe quel nom. |
| `Inclue l'en-tête "calcul.h".` | Java n’inclut pas de fichier : il **importe des classes**, et une classe du même paquetage est visible sans rien écrire. « Importe … » nomme une classe, jamais un chemin. |
| `Inclue la bibliothèque stdio.h.` | Java n’a pas de préprocesseur, et l’affichage ne demande aucune inclusion : « System.out » est toujours disponible. Les classes de lecture de fichier, elles, s’importent : « Importe java.io.BufferedReader. ». |
| `Inclue la bibliothèque stdlib.h.` | Java n’a pas de préprocesseur : rien n’est inclus textuellement avant la compilation. Ce qu’un en-tête apportait s’obtient par « Importe … », qui nomme une classe et non un fichier. Les limites des types entiers sont des constantes de classe — « Integer.MAX_VALUE » — et s’écrivent dans une expression comme n’importe quel nom. |
| `Crée un pointeur de type int nommé p avec l'adresse de x.` | Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, il ne la supprime pas. |
| `Déclare la variable externe de type int nommée compteur.` | Les « static » et « extern » du C décrivent une liaison à l’édition de liens, une étape que Java n’a pas. Ce qu’ils enseignaient — ce qui est visible depuis l’extérieur — s’écrit ici par la **visibilité** : « Crée une méthode privée … », « Ajoute un champ privé … ». |
| `Affiche la valeur pointée par p.` | Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, il ne la supprime pas. |
| `Affecte à q la réallocation de p pour 20 éléments de type int.` | Java a un ramasse-miettes, et un tableau ne se redimensionne pas : sa dimension est fixée à sa création. Ce que « realloc » permettait s’obtient par une **liste**, qui grandit quand on y ajoute — « Ajoute 15 à la fin de la liste notes. ». |
| `Affecte à n la taille du type double.` | Java ne demande aucune taille de type : la taille d’un « int » y est fixée par le langage, pas par la machine, et aucune allocation ne la réclame. Pour la longueur d’un tableau, « Affecte à n la taille du tableau notes. ». |
| `Affiche la taille du type int.` | Java ne demande aucune taille de type, et il n’y a donc rien à en afficher. Pour la longueur d’un tableau ou d’une liste, les deux phrases de taille existent. |
| `Déclare un pointeur de type structure Point nommé q.` | Java n’a pas de pointeur, et une variable de type classe désigne déjà un objet sans qu’on l’écrive. « Crée un objet nommé n de la classe Noeud. » dit ce que vous voulez ; une liste chaînée s’y écrit avec un champ du type de la classe elle-même, sans étoile. |
| `Déclare le synonyme Noeud pour la structure Noeud.` | Java n’a pas de synonyme de type : un nom de type **est** le nom d’une classe ou d’une interface, et il n’y a rien à renommer. Un regroupement nommé de données se déclare directement — « Crée une classe nommée Noeud. » —, et une classe peut se référencer elle-même sans déclaration préalable, ce qui suffit à une liste chaînée. |

**27 intentions** ne sont pas portées en tout ; les 0 qui manquent ici ne sont pas atteignables
par une phrase du catalogue imprimée, et leurs raisons sont dans
`src/langages/java/raisons.ts`.

### 2.2 Java a la notion, mais pas ce qu’elle contient — `CONSTRUCTION_NON_PORTEE`

La distinction compte : ici l’intention existe, et c’est son **contenu** qui est
refusé. Un pointeur dans une expression, un entier employé comme condition, un mot
réservé de Java que C17 accepte comme nom.

| Phrase française | Pourquoi |
|---|---|
| `Appelle lire avec "&x".` | Java n’a pas de pointeur : ni adresse à prendre, ni déréférencement à écrire, ni arithmétique de pointeurs. Un objet **est** déjà une référence, et c’est par là que la compétence s’enseigne — deux noms qui désignent le même objet. |
| `Crée une fonction nommée taille qui retourne un unsigned int.` | Java n’a aucun entier non signé : tous ses types entiers sont signés. Écrire « int » perdrait exactement l’information que vous avez donnée, et l’écrire quand même enseignerait un type qui n’existe pas dans ce langage. |
| `Crée un bloc si "age >= 18 && !suspendu".` | En Java, un nombre n’est pas une condition : « si "n" » ne compile pas, là où C17 l’accepte en lisant zéro comme faux. Écrivez la comparaison que vous voulez — par exemple « n != 0 » —, car l’ajouter à votre place serait choisir un sens que vous n’avez pas donné. |
| `Affecte le caractère 'A' au champ initiale pointé par p.` | La flèche « -> » n’existe pas en Java, faute de pointeurs : l’accès à un champ s’écrit toujours avec un point. |
| `Affecte la valeur 5 au champ x pointé par q.` | La flèche « -> » n’existe pas en Java, faute de pointeurs : l’accès à un champ s’écrit toujours avec un point. |
| `Affiche le champ x pointé par q.` | La flèche « -> » n’existe pas en Java, faute de pointeurs : l’accès à un champ s’écrit toujours avec un point. |
| `Affecte à n le résultat numérique de "*p + 1".` | Java n’a pas de pointeur : ni adresse à prendre, ni déréférencement à écrire, ni arithmétique de pointeurs. Un objet **est** déjà une référence, et c’est par là que la compétence s’enseigne — deux noms qui désignent le même objet. |
| `Affiche n en décimal non signé.` | Le format « décimal signé » du C affiche un entier NON signé, et Java n’a pas d’entier non signé. Il n’y a donc rien à afficher de cette façon : la notation fixe et la notation scientifique, elles, sont portées. |
| `Retourne le résultat numérique de "*(t + i * 2)".` | Java n’a pas de pointeur : ni adresse à prendre, ni déréférencement à écrire, ni arithmétique de pointeurs. Un objet **est** déjà une référence, et c’est par là que la compétence s’enseigne — deux noms qui désignent le même objet. |
| `Ajoute un champ pointeur de type structure Noeud nommé suivant.` | Java n’a pas de pointeur : un champ qui désigne un autre objet se déclare avec le type de cet objet, sans étoile. Écrivez « Ajoute un champ de type … », avec la classe visée. |

## 3. Les intentions natives de Java

Celles qu’aucun catalogue C ne porte : l’objet, l’interface, l’exception, la
collection typée. La colonne **portée** dit où l’instruction est plaçable — en Java,
rien d’exécutable ne vit à la portée fichier.

| Phrase française | Java produit | Portée |
|---|---|---|
| `Crée une classe nommée Eleve.` | `public class Eleve {` + `    ` + `}` | la portée fichier ou un corps de classe |
| `Crée une classe interne nommée Noeud.` | `class Noeud {` + `    ` + `}` | la portée fichier ou un corps de classe |
| `Crée un entier long nommé grand de valeur 10000000000.` | `long grand = 10000000000L;` | un corps de méthode |
| `Crée un réel simple nommé x de valeur "1.5".` | `float x = 1.5f;` | un corps de méthode |
| `Crée un booléen nommé fini de valeur vrai.` | `boolean fini = true;` | un corps de méthode |
| `Crée un booléen nommé fini de valeur faux.` | `boolean fini = false;` | un corps de méthode |
| `Déclare un booléen nommé fini.` | `boolean fini;` | un corps de méthode |
| `Déclare une chaîne nommée nom.` | `String nom;` | un corps de méthode |
| `Crée une constante entière de classe nommée MAX de valeur 100.` | `static final int MAX = 100;` | un corps de classe |
| `Affiche la valeur de n et passe à la ligne.` | `System.out.println(n);` | un corps de méthode |
| `Affiche le texte "bonjour" et passe à la ligne.` | `System.out.println("bonjour");` | un corps de méthode |
| `Crée un lecteur de saisie nommé lecteur.` | `Scanner lecteur = new Scanner(System.in);` | un corps de méthode |
| `Lis un entier depuis le lecteur de saisie lecteur dans n.` | `n = lecteur.nextInt();` | un corps de méthode |
| `Lis une ligne depuis le lecteur de saisie lecteur dans ligne.` | `ligne = lecteur.nextLine();` | un corps de méthode |
| `Affecte le texte "Ada" à s.` | `s = "Ada";` | un corps de méthode |
| `Incrémente n.` | `n += 1;` | un corps de méthode |
| `Décrémente n.` | `n -= 1;` | un corps de méthode |
| `Affecte à n le résultat converti en entier de "x".` | `n = (int) x;` | un corps de méthode |
| `Affecte à x le résultat converti en réel de "n".` | `x = (double) n;` | un corps de méthode |
| `Affecte à s la concaténation de s et "!".` | `s = s + "!";` | un corps de méthode |
| `Affecte à n la longueur de la chaîne s.` | `n = s.length();` | un corps de méthode |
| `Affecte à c le caractère d’indice "i" de la chaîne s.` | `c = s.charAt(i);` | un corps de méthode |
| `Affecte à egal la comparaison des chaînes a et b.` | `egal = a.equals(b);` | un corps de méthode |
| `Affecte à n la conversion en entier de la chaîne s.` | `n = Integer.parseInt(s);` | un corps de méthode |
| `Crée une boucle pour chaque int nommé v du tableau notes.` | `for (int v : notes) {` + `    ` + `}` | un corps de méthode |
| `Crée une boucle pour chaque int nommé v de la liste notes.` | `for (int v : notes) {` + `    ` + `}` | un corps de méthode |
| `Ajoute un cas pour le texte "lundi".` | `case "lundi":` | un corps de méthode |
| `Crée une méthode de classe nommée afficher qui ne retourne rien.` | `static void afficher() {` + `    ` + `}` | un corps de classe |
| `Crée une méthode publique nommée getAge qui retourne un int.` | `public int getAge() {` + `    ` + `}` | un corps de classe |
| `Crée une méthode publique nommée afficher qui ne retourne rien.` | `public void afficher() {` + `    ` + `}` | un corps de classe |
| `Crée une méthode privée nommée verifier qui ne retourne rien.` | `private void verifier() {` + `    ` + `}` | un corps de classe |
| `Crée une méthode redéfinie nommée afficher qui ne retourne rien.` | `@Override` + `public void afficher() {` + `    ` + `}` | un corps de classe |
| `Crée une méthode de classe nommée lire qui ne retourne rien et peut lancer IOException.` | `static void lire() throws IOException {` + `    ` + `}` | un corps de classe |
| `Retourne le texte "fini".` | `return "fini";` | un corps de méthode |
| `Retourne la chaîne nom.` | `return nom;` | un corps de méthode |
| `Appelle la méthode afficher de e.` | `e.afficher();` | un corps de méthode |
| `Affecte à n le résultat de l’appel de la méthode getAge de e.` | `n = e.getAge();` | un corps de méthode |
| `Déclare un tableau de type int nommé notes.` | `int[] notes;` | un corps de méthode |
| `Affecte la valeur 5 à l’élément "0" du tableau notes.` | `notes[0] = 5;` | un corps de méthode |
| `Affecte le caractère 'A' à l’élément "0" du tableau lettres.` | `lettres[0] = 'A';` | un corps de méthode |
| `Affecte à l’élément "i" du tableau notes le résultat numérique de "a + 1".` | `notes[i] = (a + 1);` | un corps de méthode |
| `Affiche l’élément "0" du tableau notes.` | `System.out.print(notes[0]);` | un corps de méthode |
| `Affiche le caractère de l’élément "i" du tableau lettres.` | `System.out.print(lettres[i]);` | un corps de méthode |
| `Affecte à n la taille du tableau notes.` | `n = notes.length;` | un corps de méthode |
| `Crée une liste de type int nommée notes.` | `List<Integer> notes = new ArrayList<>();` | un corps de méthode |
| `Ajoute "15" à la fin de la liste notes.` | `notes.add(15);` | un corps de méthode |
| `Ajoute le texte "Ada" à la fin de la liste noms.` | `noms.add("Ada");` | un corps de méthode |
| `Affecte à n l’élément "0" de la liste notes.` | `n = notes.get(0);` | un corps de méthode |
| `Affecte à n la taille de la liste notes.` | `n = notes.size();` | un corps de méthode |
| `Retire l’élément "0" de la liste notes.` | `notes.remove(0);` | un corps de méthode |
| `Crée une table de type int nommée notes avec des clés textuelles.` | `Map<String, Integer> notes = new HashMap<>();` | un corps de méthode |
| `Associe "15" à la clé "ada" dans la table notes.` | `notes.put("ada", 15);` | un corps de méthode |
| `Affecte à n la valeur de la clé "ada" dans la table notes.` | `n = notes.get("ada");` | un corps de méthode |
| `Crée un ensemble de type int nommé vus.` | `Set<Integer> vus = new HashSet<>();` | un corps de méthode |
| `Ajoute "3" à l’ensemble vus.` | `vus.add(3);` | un corps de méthode |
| `Crée une boucle pour chaque clé textuelle nommée cle de la table notes.` | `for (String cle : notes.keySet()) {` + `    ` + `}` | un corps de méthode |
| `Ajoute un champ privé de type int nommé age.` | `private int age;` | un corps de classe |
| `Ajoute un champ de type chaîne nommé nom.` | `String nom;` | un corps de classe |
| `Ajoute un champ tableau de type int nommé notes de dimension 10.` | `int[] notes = new int[10];` | un corps de classe |
| `Crée un constructeur qui ne prend rien.` | `public Eleve() {` + `    ` + `}` | un corps de classe |
| `Crée un constructeur qui prend un int nommé age.` | `public Eleve(int age) {` + `    ` + `}` | un corps de classe |
| `Affecte au champ age la valeur du paramètre age.` | `this.age = age;` | un corps de méthode |
| `Crée un objet nommé e de la classe Eleve avec "20".` | `Eleve e = new Eleve(20);` | un corps de méthode |
| `Affecte à n le champ age de e.` | `n = e.age;` | un corps de méthode |
| `Crée une classe nommée Etudiant qui hérite de Personne.` | `public class Etudiant extends Personne {` + `    ` + `}` | la portée fichier ou un corps de classe |
| `Crée une classe abstraite nommée Forme.` | `public abstract class Forme {` + `    ` + `}` | la portée fichier ou un corps de classe |
| `Crée une interface nommée Affichable.` | `public interface Affichable {` + `    ` + `}` | la portée fichier ou un corps de classe |
| `Crée une classe nommée Eleve qui implémente Affichable.` | `public class Eleve implements Affichable {` + `    ` + `}` | la portée fichier ou un corps de classe |
| `Ajoute une méthode attendue nommée afficher qui ne retourne rien.` | `void afficher();` | un corps d’interface |
| `Ajoute une méthode attendue nommée taille qui retourne un int.` | `int taille();` | un corps d’interface |
| `Ajoute une méthode abstraite nommée aire qui retourne un int.` | `abstract int aire();` | un corps de classe |
| `Appelle le constructeur de la classe parente.` | `super();` | un corps de méthode |
| `Appelle le constructeur de la classe parente avec "20".` | `super(20);` | un corps de méthode |
| `Appelle la méthode afficher de la classe parente.` | `super.afficher();` | un corps de méthode |
| `Déclare une variable de type Affichable nommée a.` | `Affichable a;` | un corps de méthode |
| `Crée une variable de type Affichable nommée a comme un objet de la classe Eleve.` | `Affichable a = new Eleve();` | un corps de méthode |
| `Crée une variable de type Affichable nommée a comme un objet de la classe Eleve avec "12".` | `Affichable a = new Eleve(12);` | un corps de méthode |
| `Déclare le paquetage ecole.` | `package ecole;` | la portée fichier |
| `Importe java.util.List.` | `import java.util.List;` | la portée fichier |
| `Crée un bloc essaie.` | `try {` + `    ` + `}` | un corps de méthode |
| `Ajoute une branche attrape IOException nommée e.` | `catch (IOException e) {` + `    ` + `}` | un corps de méthode |
| `Ajoute une branche finalement.` | `finally {` + `    ` + `}` | un corps de méthode |
| `Lance une exception IllegalArgumentException avec le texte "âge négatif".` | `throw new IllegalArgumentException("âge négatif");` | un corps de méthode |
| `Affiche le message de l’exception e.` | `System.out.print(e.getMessage());` | un corps de méthode |
| `Crée un bloc essaie avec un lecteur nommé lecteur sur le fichier "notes.txt".` | `try (BufferedReader lecteur = new BufferedReader(new FileReader("notes.txt"))) {` + `    ` + `}` | un corps de méthode |
| `Crée un bloc essaie avec un écrivain nommé f sur le fichier "sortie.txt".` | `try (PrintWriter f = new PrintWriter("sortie.txt")) {` + `    ` + `}` | un corps de méthode |
| `Lis une ligne depuis le lecteur lecteur dans ligne.` | `ligne = lecteur.readLine();` | un corps de méthode |

## 4. Les informations pédagogiques passives

Elles ne bloquent rien. Elles disent ce que le langage fait, et ce que **A ne vérifie
pas**. Trois corrigent une règle apprise en C17 ou en Python ; deux disent une lacune
de A, pas une propriété de Java.

| Code | Ce qu’elle enseigne |
|---|---|
| `JAVA_STATIC_CANNOT_CALL_INSTANCE` | La méthode principale est « static », et une méthode d’instance n’y est pas appelable sans objet. A est SANS ÉTAT : en écrivant un appel, il ne sait pas si la méthode visée est « static », et il peut donc produire du code que le compilateur refusera. Cette lacune n’est pas refermée. |
| `JAVA_PRINTLN_ADDS_A_LINE` | Deux affichages, deux phrases : « Affiche … » n’ajoute RIEN, et « Affiche … et passe à la ligne » ajoute un retour à la ligne. En C17, « printf » n’ajoute jamais rien, et c’est pourquoi A ne choisit pas pour vous. |
| `JAVA_INTEGER_DIVISION_TRUNCATES` | Entre deux entiers, « / » tronque vers zéro : 7 / 2 vaut 3. C’est le comportement de C17, et non celui de Python, où la même écriture donne 3.5. |
| `JAVA_MODULO_FOLLOWS_DIVIDEND` | Le signe du reste suit celui du dividende : -7 % 2 vaut -1. C’est le comportement de C17, et non celui de Python, où la même écriture donne 1. |
| `JAVA_FLOAT_NEEDS_SUFFIX` | En Java, « float x = 1.5; » ne compile pas : un littéral décimal est un « double », et il faut écrire « 1.5f ». C17 l’acceptait en convertissant en silence. |
| `JAVA_THROWS_IS_PART_OF_THE_SIGNATURE` | La déclaration « peut lancer » fait partie de la SIGNATURE d’une méthode. A ne l’ajoute pas à une signature déjà écrite : il ne modifie jamais une ligne que vous n’avez pas désignée. Si une méthode doit lancer une exception vérifiée, dites-le en la créant. |
| `JAVA_CHAR_IS_16_BIT` | Le type « char » vaut 16 bits en Java, et 8 en C17. Un même programme n’y range donc pas les mêmes caractères, et une valeur qui débordait en C ne débordera pas ici. |
| `JAVA_NEW_ARRAY_IS_ZEROED` | Un tableau créé avec une dimension est ALLOUÉ et mis entièrement à zéro — à « false » pour des booléens, à « null » pour des objets. En C17, la mémoire restait indéterminée, et lire une case non écrite y était un défaut. |
| `JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE` | Le mot « tableau » ou « liste » fait partie de la phrase, et ce n’est pas une lourdeur : un élément de tableau s’écrit « t[0] », un élément de liste « t.get(0) ». A est sans état et ne sait pas ce que le nom désigne — le mot que vous ajoutez EST l’information manquante. |
| `JAVA_EQUALS_NOT_DOUBLE_EQUAL` | Sur deux chaînes, « == » compare des RÉFÉRENCES et non des contenus : il peut être faux pour deux textes identiques. C’est pourquoi la comparaison de chaînes a sa propre phrase, qui écrit « equals ». |
| `JAVA_SWITCH_FALLS_THROUGH` | Un cas sans sortie TOMBE dans le suivant, comme en C17. C’est l’inverse exact de « match » en Python, qui ne traverse jamais : si vous venez de Python, la sortie explicite n’est pas une formalité. |
| `JAVA_CLASS_NAME_IS_FILE_NAME` | En Java, une classe « public » doit vivre dans un fichier portant SON nom : une classe « Eleve » exige « Eleve.java ». A ne renomme aucun fichier et ne le vérifie pas : si les deux noms diffèrent, le compilateur refusera le fichier pour une raison qui n’est pas dans le code. |
| `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A` | A n’applique AUCUN contrôle de visibilité : lire ou écrire un champ « private » depuis une autre classe est accepté par A et refusé par le compilateur. Comme pour les types et les bornes, A ne vérifie rien de ce que le langage vérifie. |
| `JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS` | Dès qu’un constructeur est écrit, le constructeur sans argument CESSE D’EXISTER : « new Eleve() » ne compile plus. Si vous voulez les deux, écrivez les deux — A ne sait pas lesquels existent. |
| `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` | Lire ou écrire un fichier peut lever une exception VÉRIFIÉE, et Java impose de la traiter : il y a exactement deux issues légales — l’attraper dans une branche « attrape », ou la déclarer dans la signature de la méthode. A ne choisit NI l’une NI l’autre : choisir pour vous reviendrait à décider de votre traitement d’erreur. |
| `JAVA_ASSERT_IS_DISABLED_BY_DEFAULT` | Les assertions sont INACTIVES par défaut : sans l’option « -ea » à l’exécution, la ligne ne vérifie rien. Une assertion qui ne se déclenche jamais n’est donc pas une preuve que la condition est vraie. |
| `JAVA_LONG_NEEDS_SUFFIX` | Un littéral entier qui dépasse la capacité d’un « int » exige le suffixe « L ». Sans lui, le compilateur refuse LE LITTÉRAL, et non l’affectation : l’erreur désigne le nombre, pas la variable. |
| `JAVA_COLLECTION_NEEDS_AN_IMPORT` | Les classes de collection et de saisie — liste, table, ensemble, lecteur — exigent un « import ». A ne l’ajoute pas : ce serait une ligne que vous n’avez pas demandée. Écrivez « Importe java.util.ArrayList. » et les autres dont vous avez besoin. |
| `JAVA_SCANNER_LEAVES_THE_NEWLINE` | Après la lecture d’un entier, le retour à la ligne reste dans le flux : une lecture de ligne qui suit immédiatement lira une ligne VIDE. C’est un piège du langage, pas un défaut de A, et il se contourne en lisant une ligne de plus. |
| `JAVA_FOREACH_HAS_NO_INDEX` | La boucle « pour chaque » ne donne pas d’indice : elle donne la VALEUR. Si l’indice est nécessaire, c’est la boucle « pour » classique qu’il faut, avec son compteur écrit. |
| `JAVA_GENERICS_BOX_PRIMITIVES` | Une collection ne peut pas contenir un type primitif : « List<int> » n’existe pas, et A écrit donc « List<Integer> ». Java emballe et déballe tout seul, mais « == » entre deux « Integer » compare des références — utilisez « equals » pour comparer des valeurs emballées. |
| `JAVA_OVERRIDE_IS_CHECKED_BY_JAVAC` | L’annotation « @Override » ne CRÉE pas une redéfinition : elle demande au compilateur de vérifier qu’il y en a une. C’est le seul endroit du catalogue Java où le compilateur vous protège d’une faute que A ne voit pas. |
| `JAVA_LIST_GROWS_ARRAY_DOES_NOT` | Une liste grandit quand on y ajoute ; un tableau a une dimension FIXE, décidée à sa création. C’est la raison principale de choisir l’une plutôt que l’autre. |
| `JAVA_THIS_DISAMBIGUATES` | « this. » n’est pas décoratif quand le champ et le paramètre portent le même nom : sans lui, la ligne affecte le paramètre à lui-même et ne fait RIEN. Le compilateur ne dira rien non plus. |
| `JAVA_INTERFACE_METHOD_HAS_NO_BODY` | Une méthode attendue n’a pas de corps : A écrit une LIGNE, pas un bloc. Une accolade y serait une erreur de syntaxe, et toute classe qui implémente l’interface devra fournir le corps. |
| `JAVA_DECLARED_TYPE_DECIDES_WHAT_YOU_CAN_CALL` | Le type DÉCLARÉ décide de ce que vous pouvez appeler ; le type CRÉÉ décide de ce qui s’exécute. C’est tout le polymorphisme, et c’est aussi pourquoi une méthode absente de l’interface n’est pas appelable, même si l’objet la possède. |
| `JAVA_PACKAGE_NEEDS_A_DIRECTORY` | Une déclaration de paquetage exige que le fichier vive dans un répertoire du même nom, relativement à la racine de compilation. A ne déplace aucun fichier et ne le vérifie pas. |
| `JAVA_TRY_WITH_RESOURCES_CLOSES` | Le bloc essaie AVEC ressource ferme le fichier tout seul, même si une exception survient : il n’y a pas de fermeture à écrire, donc pas de fermeture à oublier. C’est la même leçon que « with » en Python, et l’inverse de C17, où il FAUT fermer. |

## 5. Ce que Java-A ne fait pas

- **aucune fonctionnalité en avant-première.** Les classes implicites et le `main`
  d’instance de Java 21 sont *preview* : le code produit cesserait de compiler. Le
  point d’entrée est une classe **explicite** et un `main` **explicite**, commandés ;
- **`record`, le `switch` fléché et `var` sont refusés**, parce qu’ils cachent
  précisément ce que les domaines concernés enseignent : le constructeur, la
  traversée des cas, et le type ;
- **aucun `import` n’est ajouté**, et aucun `throws` n’est ajouté à une signature
  déjà écrite. Les deux sont des **phrases** ;
- **aucun contrôle de visibilité.** Lire un champ `private` depuis une autre classe
  est accepté par A et refusé par `javac` ;
- **le nom du fichier et le répertoire du paquetage ne sont pas vérifiés.** A informe
  et ne renomme rien : un fichier accepté peut ne pas compiler pour une raison qui
  n’est pas dans le code.
