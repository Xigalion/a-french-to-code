/** Python, inscrit au registre des langages.
 *
 * Lot P3. Importer ce module **inscrit** Python : c'est le module de langage
 * qui s'inscrit, jamais le moteur, qui ne doit pas connaître la liste de ses
 * langages cibles. Un hôte qui ne veut que du C17 n'importe pas ce fichier.
 *
 * Python n'est pas un C17 amputé. Il porte 32 intentions au lot P3, et les 52
 * autres sont des **refus nommés** qui désignent chacun la construction native
 * enseignant la même compétence. Le catalogue pédagogique Python propre — les
 * 31 intentions neuves de l'inventaire — reste à écrire : c'est là qu'est le
 * travail, pas dans le portage.
 */
import { inscrire } from '../registre.ts';
import type { Langage } from '../registre.ts';
import { PORTEES_PYTHON, rendrePython } from './rendu.ts';
import { RAISONS_PYTHON } from './raisons.ts';

export const PYTHON: Langage = {
  nom: 'python',
  extensions: ['.py'],
  blocs: 'indentation',
  commentaire: (phrase) => '# ' + phrase,
  portees: PORTEES_PYTHON,
  raisons: RAISONS_PYTHON,
  rendre: (instruction) => {
    const resultat = rendrePython(instruction);
    return resultat.status === 'rendu'
      ? { status: 'rendu', code: resultat.code }
      // Un refus qui vient du RENDU, pas du périmètre : l'intention est
      // portée, mais la construction qu'elle contient ne l'est pas — une
      // division, un pointeur dans une expression, un nom réservé.
      : { status: 'refus', code: 'CONSTRUCTION_NON_PORTEE', raison: resultat.raison };
  },
};

inscrire(PYTHON);
