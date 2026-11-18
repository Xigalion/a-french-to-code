/** Pourquoi Java ne porte pas une intention — une raison par intention
 * absente de `PORTEES_JAVA`.
 *
 * Lot J1. Un refus sans raison n'apprend rien, et c'est pour cela que le
 * registre en exige une. Trois règles d'écriture, reprises de Python-A parce
 * qu'elles y ont fonctionné :
 *
 *  1. **dire ce que Java n'a pas**, pas ce que Java n'est pas ;
 *  2. **nommer la construction Java qui enseigne la même compétence.** Un
 *     refus de portage n'est pas une interdiction d'apprendre la notion ;
 *  3. **ne jamais suggérer que la notion est inutile.** Les pointeurs sont la
 *     bonne façon d'enseigner l'indirection en C ; Java l'enseigne autrement,
 *     et aucun des deux n'a tort.
 *
 * Les 27 entrées couvrent exactement la classe C de
 * `docs/phase3/classement-java.json`, et un test l'impose : une intention non
 * portée sans raison écrite est un défaut du registre, pas une limite du
 * langage.
 */

const POINTEUR = 'Java n’a pas de pointeur. Un objet **est** déjà une référence : deux noms peuvent '
  + 'désigner le même objet, et c’est par là que l’indirection s’enseigne ici — sans adresse à prendre '
  + 'ni étoile à écrire. Les pointeurs restent la bonne façon de l’enseigner en C17 ; Java la remplace, '
  + 'il ne la supprime pas.';

const MEMOIRE = 'Java a un ramasse-miettes : la mémoire ne s’alloue ni ne se libère à la main, et une '
  + 'allocation oubliée n’existe pas comme défaut. Ce que « new » demande suffit, et pour une longueur '
  + 'ce sont « la taille du tableau » ou « la taille de la liste » qui répondent.';

const PREPROCESSEUR = 'Java n’a pas de préprocesseur : rien n’est inclus textuellement avant la '
  + 'compilation. Ce qu’un en-tête apportait s’obtient par « Importe … », qui nomme une classe et non '
  + 'un fichier. Les limites des types entiers sont des constantes de classe — « Integer.MAX_VALUE » — '
  + 'et s’écrivent dans une expression comme n’importe quel nom.';

export const RAISONS_JAVA: ReadonlyMap<string, string> = new Map([
  // ---- pointeurs (7) ---------------------------------------------------
  ['DECL_POINTER', POINTEUR],
  ['INIT_POINTER', POINTEUR],
  ['ASSIGN_ADDRESS', POINTEUR],
  ['PRINT_POINTED', POINTEUR],
  ['ASSIGN_POINTED_INT', POINTEUR],
  ['ASSIGN_POINTED_EXPRESSION', POINTEUR],
  ['STRUCT_POINTER', 'Java n’a pas de pointeur, et une variable de type classe désigne déjà un objet '
    + 'sans qu’on l’écrive. « Crée un objet nommé n de la classe Noeud. » dit ce que vous voulez ; une '
    + 'liste chaînée s’y écrit avec un champ du type de la classe elle-même, sans étoile.'],

  // ---- mémoire (5) -----------------------------------------------------
  ['ALLOCATE', MEMOIRE],
  ['REALLOCATE', 'Java a un ramasse-miettes, et un tableau ne se redimensionne pas : sa dimension est '
    + 'fixée à sa création. Ce que « realloc » permettait s’obtient par une **liste**, qui grandit quand '
    + 'on y ajoute — « Ajoute 15 à la fin de la liste notes. ».'],
  ['FREE', 'Java a un ramasse-miettes : rien ne se libère à la main, et il n’y a donc pas de double '
    + 'libération possible. La discipline que « free » enseignait — savoir qui possède une donnée — reste '
    + 'utile, mais elle ne s’écrit plus dans le code.'],
  ['SIZEOF_ASSIGN', 'Java ne demande aucune taille de type : la taille d’un « int » y est fixée par le '
    + 'langage, pas par la machine, et aucune allocation ne la réclame. Pour la longueur d’un tableau, '
    + '« Affecte à n la taille du tableau notes. ».'],
  ['SIZEOF_PRINT', 'Java ne demande aucune taille de type, et il n’y a donc rien à en afficher. Pour la '
    + 'longueur d’un tableau ou d’une liste, les deux phrases de taille existent.'],

  // ---- préprocesseur (5) -----------------------------------------------
  ['INCLUDE_STDIO', 'Java n’a pas de préprocesseur, et l’affichage ne demande aucune inclusion : '
    + '« System.out » est toujours disponible. Les classes de lecture de fichier, elles, s’importent : '
    + '« Importe java.io.BufferedReader. ».'],
  ['INCLUDE_STDLIB', PREPROCESSEUR],
  ['INCLUDE_ASSERT', 'Java n’a pas de préprocesseur, et « assert » est un **mot du langage** : rien ne '
    + 's’inclut pour l’obtenir. Il est en revanche inactif sans l’option « -ea » à l’exécution, ce que '
    + 'l’information passive de l’assertion rappelle.'],
  ['INCLUDE_LIMITS', PREPROCESSEUR],
  ['INCLUDE_LOCAL', 'Java n’inclut pas de fichier : il **importe des classes**, et une classe du même '
    + 'paquetage est visible sans rien écrire. « Importe … » nomme une classe, jamais un chemin.'],

  // ---- gardes d'en-tête (2) --------------------------------------------
  ['GUARD_OPEN', 'Une double inclusion est impossible en Java : rien n’est inclus textuellement, donc '
    + 'le problème que la garde résout n’existe pas. Il n’y a rien à écrire à la place — et c’est le seul '
    + 'refus de cette liste qui ne désigne aucun remplacement.'],
  ['GUARD_CLOSE', 'Une double inclusion est impossible en Java : il n’y a aucune garde à fermer, parce '
    + 'qu’il n’y en a aucune à ouvrir.'],

  // ---- modularité (2) ---------------------------------------------------
  ['FUNC_PROTOTYPE', 'Java n’a pas de déclaration séparée : l’ordre des méthodes dans une classe est '
    + 'libre, et une méthode peut en appeler une autre écrite plus bas. Le prototype n’y a aucun rôle, et '
    + 'ce qu’il protégeait — se mettre d’accord sur une signature avant de l’écrire — s’obtient par une '
    + '**interface**.'],
  ['LINKAGE_DECL', 'Les « static » et « extern » du C décrivent une liaison à l’édition de liens, une '
    + 'étape que Java n’a pas. Ce qu’ils enseignaient — ce qui est visible depuis l’extérieur — s’écrit '
    + 'ici par la **visibilité** : « Crée une méthode privée … », « Ajoute un champ privé … ».'],

  // ---- synonyme de type (1) --------------------------------------------
  ['TYPE_ALIAS', 'Java n’a pas de synonyme de type : un nom de type **est** le nom d’une classe ou d’une '
    + 'interface, et il n’y a rien à renommer. Un regroupement nommé de données se déclare directement — '
    + '« Crée une classe nommée Noeud. » —, et une classe peut se référencer elle-même sans déclaration '
    + 'préalable, ce qui suffit à une liste chaînée.'],

  // ---- fichiers (5) -----------------------------------------------------
  ['FILE_DECL', 'Java n’a pas de « FILE* » à déclarer : le lecteur ou l’écrivain naît **avec** le '
    + 'fichier qu’il ouvre, dans un bloc essaie avec ressource. « Crée un bloc essaie avec un lecteur '
    + 'nommé f sur le fichier "notes.txt". » déclare et ouvre d’un seul geste.'],
  ['FILE_OPEN', 'L’ouverture n’est pas une instruction séparée en Java : elle se fait à la création du '
    + 'lecteur ou de l’écrivain, dans un bloc essaie avec ressource. Les modes du C — lecture, écriture, '
    + 'ajout — se choisissent en choisissant la classe, pas une lettre.'],
  ['FILE_CLOSE', 'Le bloc essaie **avec ressource** ferme le fichier tout seul, même si une exception '
    + 'survient : il n’y a pas de fermeture à écrire, et donc pas de fermeture à oublier. C’est la même '
    + 'leçon que « with » en Python, et l’inverse exact de C17, où il **faut** fermer.'],
  ['FILE_READ_INT', 'Java lit une **ligne**, pas un entier : « lire un entier » y est deux gestes, et '
    + 'les confondre cacherait l’endroit où une saisie invalide échoue. Lisez la ligne, puis convertissez '
    + '— « Affecte à n la conversion en entier de la chaîne ligne. ».'],
  ['FILE_AT_END', 'Java n’a pas d’indicateur de fin de fichier à interroger : « readLine » rend une '
    + 'valeur nulle quand il n’y a plus de ligne, et c’est **cela** que la boucle teste. Le détour par un '
    + 'indicateur, qui en C mène au défaut classique de la dernière ligne lue deux fois, n’existe pas ici.'],
]);
