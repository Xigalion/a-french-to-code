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
import { analyserCataloguePython } from './instructions.ts';
import { rendrePythonNatif } from './renduNatif.ts';
import { expliquerNatifPython } from './informations.ts';

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
  // Le catalogue NATIF, lot P4. Une seule entrée : analyse, rendu et
  // informations d'un coup, parce que pour une intention native la phrase
  // française et le code produit appartiennent au même module. L'intérieur
  // reste séparé en trois fichiers, chacun testé pour lui-même.
  natif: (text) => {
    const analyse = analyserCataloguePython(text);
    if (analyse === undefined) return undefined;
    if (analyse.status === 'refuse') {
      return { status: 'refus', code: analyse.diagnostic.code,
        message: analyse.diagnostic.message, range: analyse.diagnostic.range };
    }
    const rendu = rendrePythonNatif(analyse.instruction);
    if (rendu.status === 'refus') {
      return { status: 'refus', code: 'CONSTRUCTION_NON_PORTEE',
        message: rendu.raison, range: { start: 0, end: text.length } };
    }
    return { status: 'rendu', kind: analyse.instruction.kind, code: rendu.code,
      informations: expliquerNatifPython(analyse.instruction.kind, { start: 0, end: text.length }) };
  },
};

inscrire(PYTHON);
