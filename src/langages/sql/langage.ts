/** SQL, inscrit au registre des langages.
 *
 * Lot S0. Importer ce module **inscrit** SQL : c'est le module de langage qui
 * s'inscrit, jamais le moteur.
 *
 * SQL-A est le **premier langage entièrement natif** : il porte **zéro** des
 * 84 intentions du catalogue partagé — décision S1 — et les refuse toutes avec
 * dix raisons qui nomment chacune la construction SQL enseignant la même
 * compétence. Son catalogue propre, 91 formulations sur neuf domaines, est
 * l'objet des lots S1 à S8.
 *
 * L'étiquette de blocs est **`terminateur`** : SQL n'a ni accolades ni
 * indentation, ses instructions sont séparées par `;`. C'est la troisième
 * valeur, ajoutée additivement — et la troisième confirmation de la décision 2
 * du socle : les placements se **sélectionnent**, ils ne s'unifient pas.
 */
import { inscrire } from '../registre.ts';
import type { Langage } from '../registre.ts';
import { PORTEES_SQL, RAISONS_SQL } from './raisons.ts';
import { analyserCatalogueSql } from './catalogue.ts';
import { rendreSqlNatif } from './renduNatif.ts';
import { expliquerSql } from './informations.ts';

export const SQL: Langage = {
  nom: 'sql',
  extensions: ['.sql'],
  blocs: 'terminateur',
  // Le commentaire de ligne du SQL standard. Deux tirets, pas deux barres.
  commentaire: (phrase) => '-- ' + phrase,
  // Vide, et c'est la décision S1 : `rendre()` refuse les 84 avant d'appeler
  // `rendre` ci-dessous, qui n'est donc jamais atteint.
  portees: PORTEES_SQL,
  raisons: RAISONS_SQL,
  rendre: () => ({
    status: 'refus', code: 'INTENTION_NON_PORTEE',
    raison: 'Invariant interne : SQL ne porte aucune intention du catalogue partagé, et '
      + '`rendre()` aurait dû refuser avant d’arriver ici.',
  }),
  // Le catalogue NATIF. `contexte` est ignoré : contrairement à Java, aucune
  // intention SQL n'a besoin d'un renseignement que seul le document porte —
  // une requête ne s'écrit pas « dans » une autre, décision P2.
  natif: (text) => {
    const analyse = analyserCatalogueSql(text);
    if (analyse === undefined) return undefined;
    if (analyse.status === 'refuse') {
      return { status: 'refus', code: analyse.diagnostic.code,
        message: analyse.diagnostic.message, range: analyse.diagnostic.range };
    }
    const rendu = rendreSqlNatif(analyse.instruction);
    if (rendu.status === 'refus') {
      return { status: 'refus', code: 'CONSTRUCTION_NON_PORTEE',
        message: rendu.raison, range: { start: 0, end: text.length } };
    }
    return { status: 'rendu', kind: analyse.instruction.kind, code: rendu.code,
      informations: expliquerSql(analyse.instruction.kind, { start: 0, end: text.length }) };
  },
};

inscrire(SQL);
