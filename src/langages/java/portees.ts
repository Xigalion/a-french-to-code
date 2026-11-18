/** Où une instruction Java peut figurer — la seule question que ce module
 * répond, et il n'en répond aucune autre.
 *
 * Lot J2. C'est l'équivalent Java de `src/statementScope.ts`, et il est
 * **séparé** de lui pour une raison qui n'est pas de style : la partition des
 * 84 genres y est imposée **exhaustive** par un test, et déplacer un genre
 * serait une régression du C17. Java ne touche donc pas à ce fichier ; il
 * tient le sien.
 *
 * **Quatre portées, là où C17 en a deux.** C'est la différence de fond entre
 * les deux langages à accolades, et la raison pour laquelle l'étiquette
 * `accolades` du registre ne suffisait pas :
 *
 * | Portée | Ce qui y vit |
 * |---|---|
 * | `fichier` | `package`, `import`, et les déclarations de type |
 * | `classe` | champs, méthodes, constructeurs, classes internes |
 * | `methode` | **tout** l'exécutable |
 * | `interface` | des signatures **sans corps**, et rien d'autre |
 *
 * En C17, le lot 26 avait établi qu'une instruction exécutable exige un corps
 * de fonction. En Java elle exige un corps de **méthode**, elle-même dans une
 * **classe** : deux niveaux, pas un. Et à l'inverse de Python, où une
 * instruction à la portée module est parfaitement valide, **rien** d'exécutable
 * ne vit à la portée fichier en Java.
 */

export type Portee = 'fichier' | 'classe' | 'methode' | 'interface';

/** Les genres qui déclarent un **type**, et se placent donc au fichier ou
 * dans une classe — une classe interne est légale. */
export const GENRES_TYPE: ReadonlySet<string> = new Set([
  'STRUCT_DECL',
  // J8 : les déclarations du catalogue natif. La liste est explicite ici
  // plutôt qu'importée du rendu, pour que le placement ne dépende pas de lui.
  'JAVA_CLASSE', 'JAVA_CLASSE_INTERNE', 'JAVA_CLASSE_HERITE', 'JAVA_CLASSE_ABSTRAITE',
  'JAVA_CLASSE_IMPLEMENTE', 'JAVA_INTERFACE',
]);

/** Les genres qui déclarent un **membre** : ils exigent un corps de classe.
 * Une méthode au fichier ne compile pas, et un champ non plus. */
export const GENRES_MEMBRE: ReadonlySet<string> = new Set([
  'MAIN', 'FUNC_DEF', 'STRUCT_FIELD',
  'JAVA_METHODE_STATIQUE', 'JAVA_METHODE_STATIQUE_VIDE', 'JAVA_METHODE_PUBLIQUE',
  'JAVA_METHODE_PUBLIQUE_VIDE', 'JAVA_METHODE_PRIVEE', 'JAVA_METHODE_REDEFINIE',
  'JAVA_METHODE_LANCE', 'JAVA_CONSTRUCTEUR', 'JAVA_CONSTRUCTEUR_PARAMETRE',
  'JAVA_CHAMP_PRIVE', 'JAVA_CHAMP_CHAINE', 'JAVA_CHAMP_TABLEAU',
  'JAVA_CONSTANTE_CLASSE', 'JAVA_METHODE_ABSTRAITE',
]);

/** Les genres qui déclarent une méthode **attendue** : corps d'interface
 * seulement. Une signature sans corps dans une classe ne compile pas, sauf si
 * la classe est abstraite — et A ne sait pas si elle l'est. */
export const GENRES_INTERFACE: ReadonlySet<string> = new Set([
  'JAVA_METHODE_ATTENDUE', 'JAVA_METHODE_ATTENDUE_RETOUR',
]);

/** Les directives de fichier, et **elles seules** y vivent. */
export const GENRES_FICHIER: ReadonlySet<string> = new Set([
  'JAVA_PAQUETAGE', 'JAVA_IMPORT',
]);

/** La portée exigée par un genre. Tout ce qui n'est pas listé ci-dessus est
 * **exécutable**, et exige donc un corps de méthode : c'est le défaut le plus
 * sûr, parce qu'il refuse plutôt qu'il n'autorise. */
export function porteesDe(kind: string): ReadonlySet<Portee> {
  if (GENRES_FICHIER.has(kind)) return new Set<Portee>(['fichier']);
  if (GENRES_TYPE.has(kind)) return new Set<Portee>(['fichier', 'classe']);
  if (GENRES_MEMBRE.has(kind)) return new Set<Portee>(['classe']);
  if (GENRES_INTERFACE.has(kind)) return new Set<Portee>(['interface']);
  return new Set<Portee>(['methode']);
}

/** Le nom de la portée, tel qu'un message le dit à l'utilisateur. */
export const NOM_PORTEE: Readonly<Record<Portee, string>> = {
  fichier: 'la portée fichier',
  classe: 'un corps de classe',
  methode: 'un corps de méthode',
  interface: 'un corps d’interface',
};
