/** Java, inscrit au registre des langages.
 *
 * Lot J1. Importer ce module **inscrit** Java : c'est le module de langage qui
 * s'inscrit, jamais le moteur, qui ne doit pas connaître la liste de ses
 * langages cibles. Un hôte qui ne veut que du C17 n'importe pas ce fichier.
 *
 * Java-A n'est pas un C17 habillé. Il porte **57** intentions du catalogue
 * partagé — 30 reprises et 27 adaptations — et en refuse **27**, chacune avec
 * la construction Java qui enseigne la même compétence. Son catalogue
 * pédagogique propre, 82 formulations, est l'objet des lots J3 à J8.
 *
 * Java porte l'étiquette `accolades`, **comme C17, et cela ne suffit pas** :
 * ses portées ne sont pas celles du C — rien d'exécutable ne vit à la portée
 * fichier, une méthode exige une classe — et c'est le lot J2 qui s'en charge,
 * dans un module de placement propre.
 */
import { inscrire } from '../registre.ts';
import type { Langage } from '../registre.ts';
import { PORTEES_JAVA, rendreJava } from './rendu.ts';
import { RAISONS_JAVA } from './raisons.ts';

export const JAVA: Langage = {
  nom: 'java',
  extensions: ['.java'],
  blocs: 'accolades',
  // Le commentaire de traçabilité est celui du C17, à la lettre : Java a les
  // mêmes commentaires de ligne. C'est une coïncidence utile, pas une
  // dépendance — chaque langage déclare le sien.
  commentaire: (phrase) => '// ' + phrase,
  portees: PORTEES_JAVA,
  raisons: RAISONS_JAVA,
  rendre: (instruction) => {
    const resultat = rendreJava(instruction);
    return resultat.status === 'rendu'
      ? { status: 'rendu', code: resultat.code }
      // Un refus qui vient du RENDU, pas du périmètre : l'intention est
      // portée, mais ce qu'elle contient ne l'est pas — un pointeur dans une
      // expression, un entier employé comme condition, un mot réservé de Java
      // que C17 accepte comme nom.
      : { status: 'refus', code: 'CONSTRUCTION_NON_PORTEE', raison: resultat.raison };
  },
};

inscrire(JAVA);
