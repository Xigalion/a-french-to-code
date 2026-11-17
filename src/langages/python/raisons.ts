/** Pourquoi Python ne porte pas une intention — une raison par intention.
 *
 * Lot P3. Un refus sans raison n'apprend rien, et le registre le traite comme
 * un défaut. Chaque raison écrite ici respecte la consigne du fondateur :
 *
 *   « Les refus de portage ne doivent pas devenir des interdictions
 *     définitives d'enseigner les constructions natives équivalentes. »
 *
 * Donc chaque raison dit **deux** choses : pourquoi la forme C ne se traduit
 * pas, et par quelle construction **native** Python la compétence s'enseignera.
 * Une raison qui ne dirait que la première moitié serait une interdiction
 * déguisée.
 *
 * Trois sortes de refus, et elles ne se confondent pas :
 *   - `ATTENTE` : une décision de contrat est ouverte (D1 à D13). Le refus est
 *     **provisoire**, et la décision est nommée.
 *   - `NOTION_ABSENTE` : la notion n'existe pas en Python. La compétence, si,
 *     et la construction qui l'enseigne est nommée.
 *   - `FORME_AUTRE` : la notion existe, mais sous une forme qui demande ses
 *     propres phrases — ce sont les intentions neuves de l'inventaire.
 */

type Famille = { raison: string; genres: readonly string[] };

const FAMILLES: readonly Famille[] = [
  {
    // D1, validée comme recommandation, pas encore comme décision.
    raison: 'ATTENTE (décision D1) — Python ne sépare pas la déclaration de l’initialisation : un nom naît '
      + 'avec sa valeur. Écrire « n = 0 » inventerait un zéro, et une annotation seule ne crée aucun nom. '
      + 'La notion de variable s’enseigne donc par la phrase qui donne la valeur, et une information passive '
      + 'explique la différence.',
    genres: ['DECL_INT', 'NUMERIC_DECL', 'DECL_CHAR'],
  },
  {
    raison: 'ATTENTE (décision D2) — « Crée la fonction principale. » n’a pas d’équivalent : en Python, le code '
      + 'd’un module s’exécute à l’import, et le placement par indentation autorise déjà une instruction à la '
      + 'portée module. La convention « if __name__ == "__main__": » recevra sa propre phrase, avec '
      + 'l’information qu’elle est une convention et non une exigence.',
    genres: ['MAIN'],
  },
  {
    raison: 'ATTENTE (décision D4) — la boucle « pour » à trois clauses demanderait de placer la mise à jour '
      + 'à la fin du corps, donc de restructurer ce que l’étudiant a écrit. Python parcourt une séquence : '
      + '« range », « for each » et « enumerate » recevront leurs propres phrases, et elles enseignent la '
      + 'même compétence de répétition bornée.',
    genres: ['FOR'],
  },
  {
    raison: 'NOTION_ABSENTE — Python n’a pas de boucle à test final. La compétence « exécuter au moins une '
      + 'fois, puis répéter tant que » s’écrit avec une boucle « while » et une sortie explicite, et elle '
      + 'recevra sa propre phrase plutôt qu’une traduction qui réordonnerait le corps.',
    genres: ['DO_WHILE'],
  },
  {
    raison: 'ATTENTE (décision D5) — « match » ne traverse pas les cas, là où « switch » les traverse : les '
      + 'informations SWITCH_FALLTHROUGH et BREAK_LEAVES_SWITCH deviendraient fausses, et « Sors de '
      + 'l’aiguillage. » n’aurait aucun sens. Le filtrage par motif recevra ses propres phrases, sans '
      + 'traversée et sans sortie.',
    genres: ['SWITCH', 'CASE_INT', 'CASE_CHAR', 'CASE_DEFAULT', 'BREAK_SWITCH'],
  },
  {
    raison: 'ATTENTE (décision D6) — Python n’a pas de structure. Le regroupement de données nommées '
      + 's’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une '
      + 'classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine '
      + 'entier, avec leur propre contrat.',
    genres: ['STRUCT_DECL', 'STRUCT_FIELD', 'STRUCT_VAR', 'STRUCT_POINTER',
      'MEMBER_ASSIGN_INT', 'MEMBER_ASSIGN_CHAR', 'MEMBER_ASSIGN_EXPRESSION', 'MEMBER_PRINT'],
  },
  {
    raison: 'ATTENTE (décision D7) — un tableau de dimension fixe demanderait d’inventer un remplissage : '
      + '« [0] * 10 » écrit un zéro que personne n’a demandé. Une liste dont les valeurs sont **écrites**, '
      + 'et une liste vide, recevront leurs propres phrases ; la compétence d’indexation, elle, est déjà '
      + 'portée : l’affectation et l’affichage d’un élément fonctionnent.',
    genres: ['ARRAY_DECL'],
  },
  {
    raison: 'FORME_AUTRE — une chaîne Python n’a ni dimension à prévoir ni terminateur nul, et elle est '
      + 'immuable. Porter « Crée un tableau de type char … avec le texte … » perdrait la dimension que '
      + 'l’étudiant a donnée, ou la garderait sans qu’elle veuille dire quoi que ce soit. La création d’une '
      + 'chaîne recevra sa propre phrase, et l’immuabilité son information.',
    genres: ['STRING_INIT'],
  },
  {
    raison: 'NOTION_ABSENTE — Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique '
      + 'de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence '
      + 'entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la '
      + 'même leçon avec les outils du langage.',
    genres: ['DECL_POINTER', 'INIT_POINTER', 'ASSIGN_ADDRESS', 'PRINT_POINTED',
      'ASSIGN_POINTED_INT', 'ASSIGN_POINTED_EXPRESSION'],
  },
  {
    raison: 'NOTION_ABSENTE — « sizeof » mesure une taille en octets, que Python n’expose pas pour ses '
      + 'objets. La compétence proche — connaître le nombre d’éléments — s’enseigne par « len », et c’est '
      + 'une **autre notion** : le dire est le but, pas le cacher derrière le même mot.',
    genres: ['SIZEOF_PRINT', 'SIZEOF_ASSIGN'],
  },
  {
    raison: 'NOTION_ABSENTE — Python gère la mémoire lui-même : il n’y a ni allocation explicite, ni '
      + 'réallocation, ni libération, et donc ni fuite à la main ni libération double. La compétence '
      + '« faire grandir une collection » s’enseignera par l’agrandissement d’une liste, avec une '
      + 'information disant ce que le langage fait à votre place.',
    genres: ['ALLOCATE', 'REALLOCATE', 'FREE'],
  },
  {
    raison: 'NOTION_ABSENTE — Python n’a pas de prototype ni de liaison : une fonction est définie, et un '
      + 'nom est visible une fois le module exécuté. La compétence « déclarer avant d’utiliser » n’existe '
      + 'pas sous cette forme : la compétence « organiser un programme en morceaux réutilisables » '
      + 's’enseignera par « import » et par l’ordre de définition dans le module, avec une information '
      + 'qui dit ce que l’ordre garantit et ce qu’il ne garantit pas.',
    genres: ['FUNC_PROTOTYPE', 'LINKAGE_DECL'],
  },
  {
    raison: 'NOTION_ABSENTE — Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde '
      + 'd’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence '
      + '« réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du '
      + 'langage et non une copie de texte, et la différence vaut d’être dite.',
    genres: ['INCLUDE_STDIO', 'INCLUDE_STDLIB', 'INCLUDE_ASSERT', 'INCLUDE_LIMITS', 'INCLUDE_LOCAL',
      'GUARD_OPEN', 'GUARD_CLOSE'],
  },
  {
    raison: 'NOTION_ABSENTE — Python n’a pas de constante : un nom en majuscules est une **convention** de '
      + 'lecture, que rien n’empêche de réaffecter. Écrire cette convention comme si elle protégeait quoi '
      + 'que ce soit enseignerait une garantie fausse. La compétence s’enseignera avec son information.',
    genres: ['CONST_DECL'],
  },
  {
    raison: 'FORME_AUTRE — un synonyme de type en Python est une affectation de type, pas une déclaration, '
      + 'et il ne crée aucun type nouveau. La notion recevra sa propre phrase quand les classes seront '
      + 'au programme, là où elle commence à servir.',
    genres: ['TYPE_ALIAS'],
  },
  {
    raison: 'FORME_AUTRE — les fichiers existent en Python, et c’est une des familles les plus utiles ; mais '
      + 'ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont '
      + 'pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et '
      + 'd’écriture **sont écrites** pour cette forme (lots P5 et P6), et non portées depuis '
      + '« fopen » et « feof » : un bloc « with », un parcours de lignes, et deux écritures.',
    genres: ['FILE_DECL', 'FILE_OPEN', 'FILE_CLOSE', 'FILE_WRITE_INT',
      'FILE_READ_STRING', 'FILE_AT_END'],
  },
  {
    raison: 'NOTION_ABSENTE — la méthode d’écriture de Python n’accepte qu’une CHAÎNE : écrire un '
      + 'nombre demande de le convertir d’abord, et C-A ne convertit pas à votre place. La compétence '
      + 's’enseigne par deux phrases, la conversion puis l’écriture — « Écris le texte … » et '
      + '« Écris la chaîne … » sont, elles, portées.',
    genres: ['FILE_WRITE_INT'],
  },
  {
    raison: 'ATTENTE (décision D12) — « Lis un entier depuis le fichier f dans x. » cacherait deux '
      + 'opérations en une phrase : lire une ligne, puis la convertir, avec une exception possible si la '
      + 'ligne est vide. La règle 6 interdit de laisser croire sûr ce qui ne l’est pas : la lecture et la '
      + 'conversion recevront deux phrases distinctes.',
    genres: ['FILE_READ_INT'],
  },
  {
    raison: 'FORME_AUTRE — « assert » existe en Python, mais il est désactivé par l’option « -O » et il lève '
      + 'une exception au lieu d’arrêter le processus. Porter la phrase sans dire cela enseignerait une '
      + 'garantie que le langage ne donne pas. L’assertion recevra sa phrase avec son information, et la '
      + 'vérification d’une donnée se fera par une exception explicite.',
    genres: ['ASSERT'],
  },
];

/** `genre → raison`, pour toutes les intentions que Python ne porte pas. */
export const RAISONS_PYTHON: ReadonlyMap<string, string> = new Map(
  FAMILLES.flatMap(famille => famille.genres.map(genre => [genre, famille.raison] as const)),
);
