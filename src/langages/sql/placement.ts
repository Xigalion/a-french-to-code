/** Le placement propre à SQL : **insertion pure**, et l'ordre des clauses.
 *
 * Lot S2, décision **S2**. Trois choses qu'aucun placement existant ne fait :
 *
 *   1. SQL n'a **ni accolades ni indentation** : ses instructions sont
 *      séparées par `;`. L'étiquette de blocs est `terminateur` ;
 *   2. une requête est un **bloc multi-lignes** dont le `;` est seul sur sa
 *      dernière ligne, avec une ligne blanche avant lui. Ajouter une clause
 *      est donc une **insertion pure** : aucun caractère existant n'est
 *      touché, et la règle 9 tient sans exception ;
 *   3. il n'y a aucune profondeur à mesurer, mais **dix rangs** de clauses à
 *      respecter. Une clause de rang inférieur au rang atteint ne s'écrit pas,
 *      et le diagnostic **nomme** la clause qui bloque.
 *
 * Ce module ne lit pas le SQL : il lit les **mots en tête de ligne** des
 * lignes déjà présentes, ce qui suffit parce que c'est SQL-A qui les a
 * écrites. Un fichier écrit à la main dont la requête tient sur une seule
 * ligne est refusé — décision S8 —, et c'est dit plutôt que deviné.
 */
import { CLAUSES, NOM_RANG, NOM_PORTEE, OUVRE_UNE_REQUETE, porteeDe } from './portees.ts';
import type { Portee } from './portees.ts';
import type { GenreSql } from './instructions.ts';

export type Intervalle = { start: number; end: number };

export type DiagnosticSqlPlacement = {
  code: 'LIGNE_NON_BLANCHE' | 'CODE_VIDE' | 'CLAUSE_HORS_REQUETE'
  | 'INSTRUCTION_DANS_UNE_REQUETE' | 'CLAUSE_DANS_LE_MAUVAIS_ORDRE' | 'CLAUSE_EN_DOUBLE'
  | 'SUITE_SANS_CLAUSE' | 'REQUETE_NON_TERMINEE' | 'PROJECTION_FERMEE'
  | 'CLAUSE_SUR_UNE_LIGNE_UNIQUE' | 'INDENTATION_INCONNUE';
  category: 'placement'; severity: 'error'; message: string; range: Intervalle;
};

export type PlanSql =
  | { status: 'planifie'; edits: readonly [{ range: Intervalle; newText: string }];
    indentation: number; portee: Portee; cursor?: { offset: number } }
  | { status: 'refuse'; diagnostics: readonly [DiagnosticSqlPlacement] };

export type DemandeSql = {
  readonly document: { readonly text: string };
  readonly cursorOffset: number;
  readonly comment: string;
  readonly code: string;
  readonly kind: string;
  readonly eol?: '\n' | '\r\n';
};

const refus = (code: DiagnosticSqlPlacement['code'], message: string,
  range: Intervalle): PlanSql =>
  ({ status: 'refuse', diagnostics: [{ code, category: 'placement', severity: 'error', message, range }] });

/** Les mots qui **ouvrent** une instruction complète. Lus en tête de ligne. */
const DEBUTS = ['select', 'insert', 'update', 'delete', 'create', 'alter', 'drop',
  'with', 'grant', 'revoke', 'start', 'commit', 'rollback', 'savepoint', 'comment'];

/** Le rang d'une ligne déjà écrite, d'après son premier mot. `undefined` :
 * la ligne n'est pas une clause reconnue. */
function rangDeLaLigne(ligne: string): number | undefined {
  const nu = ligne.trim().toLowerCase();
  if (nu === '') return undefined;
  if (nu.startsWith(',')) return undefined;          // une suite : elle ne change pas le rang
  if (nu.startsWith('select') || nu.startsWith('with')) return 1;
  if (nu.startsWith('from')) return 2;
  if (nu.startsWith('inner join') || nu.startsWith('left outer join')
    || nu.startsWith('right outer join') || nu.startsWith('full outer join')
    || nu.startsWith('cross join') || nu.startsWith('join')) return 3;
  if (nu.startsWith('where')) return 4;
  if (nu.startsWith('and') || nu.startsWith('or ')) return 4;
  if (nu.startsWith('group by')) return 5;
  if (nu.startsWith('having')) return 6;
  if (nu.startsWith('union') || nu.startsWith('intersect') || nu.startsWith('except')) return 7;
  if (nu.startsWith('order by')) return 8;
  if (nu.startsWith('nulls ')) return 8;
  if (nu.startsWith('offset')) return 9;
  if (nu.startsWith('fetch')) return 10;
  return undefined;
}

type Etat = {
  /** Une instruction est-elle ouverte au point d'insertion ? */
  readonly ouverte: boolean;
  /** Le rang le plus élevé déjà écrit dans cette instruction. */
  readonly rangAtteint: number;
  /** Les rangs **uniques** déjà posés, pour refuser un deuxième WHERE. */
  readonly posesUniques: ReadonlySet<number>;
  /** Le `FROM` est-il écrit ? La liste de projection est alors fermée. */
  readonly projectionFermee: boolean;
  /** Une requête ouverte dont le `;` manque : A ne sait pas où elle finit. */
  readonly sansPointVirgule: boolean;
  /** Une instruction tenant sur une seule ligne, non complétable. */
  readonly surUneLigne: boolean;
};

/** Lit les lignes **avant** le point d'insertion, et en déduit l'état.
 *
 * Borné : un seul passage, pas de retour en arrière. Les commentaires `--`
 * sont ignorés, car ce sont ceux de traçabilité que A a lui-même écrits.
 */
export function etatAvant(texte: string, offset: number): Etat {
  const avant = texte.slice(0, offset);
  const lignes = avant.split('\n');
  let ouverte = false;
  let rangAtteint = 0;
  let projectionFermee = false;
  let surUneLigne = false;
  const posesUniques = new Set<number>();
  for (const brute of lignes) {
    const ligne = brute.replace(/--.*$/u, '').trim();
    if (ligne === '') continue;
    const premier = ligne.toLowerCase();
    if (!ouverte && DEBUTS.some(mot => premier.startsWith(mot))) {
      ouverte = true; rangAtteint = 0; projectionFermee = false; surUneLigne = false;
      posesUniques.clear();
      // Une instruction qui porte plusieurs clauses sur la MÊME ligne ne peut
      // pas être complétée par insertion : décision S8.
      const clauses = (premier.match(/\b(from|where|group by|having|order by|fetch|offset)\b/gu) ?? []).length;
      if (clauses >= 1 && !premier.startsWith('from')) surUneLigne = true;
    }
    const rang = rangDeLaLigne(ligne);
    if (rang !== undefined) {
      if (rang > rangAtteint) rangAtteint = rang;
      if (rang === 2) projectionFermee = true;
      const clause = Object.values(CLAUSES).find(entree => entree.rang === rang && entree.unique);
      if (clause !== undefined && rang !== 4) posesUniques.add(rang);
      else if (rang === 4 && /^where\b/u.test(premier)) posesUniques.add(4);
      if (rang === 5 && /^group by\b/u.test(premier)) posesUniques.add(5);
      if (rang === 8 && /^order by\b/u.test(premier)) posesUniques.add(8);
    }
    if (ligne.includes(';')) {
      ouverte = false; rangAtteint = 0; projectionFermee = false; surUneLigne = false;
      posesUniques.clear();
    }
  }
  // Le `;` d'une requête ouverte par A est APRÈS le curseur : on le cherche
  // donc dans la suite, sans dépasser la prochaine instruction.
  let sansPointVirgule = false;
  if (ouverte) {
    const apres = texte.slice(offset);
    const finLigne = apres.indexOf(';');
    sansPointVirgule = finLigne === -1;
  }
  return { ouverte, rangAtteint, posesUniques, projectionFermee, sansPointVirgule, surUneLigne };
}

export function planifierSql(demande: DemandeSql): PlanSql {
  const { text } = demande.document;
  const curseur = { start: demande.cursorOffset, end: demande.cursorOffset };
  const eol = demande.eol === undefined ? '\n' : demande.eol;
  if (demande.code.trim() === '') {
    return refus('CODE_VIDE', 'Aucun code à placer : le langage n’a rien rendu.', curseur);
  }

  // 1. La ligne du curseur doit être blanche. A n'écrit jamais par-dessus du
  //    code existant — règle 9. Le cas `cursorOffset === 0` est explicite :
  //    `lastIndexOf('\n', 0)` trouve le saut d'indice 0 et inverse
  //    l'intervalle. Défaut trouvé au lot J2, et il ne se reproduit pas.
  const debutLigne = demande.cursorOffset === 0
    ? 0
    : text.lastIndexOf('\n', demande.cursorOffset - 1) + 1;
  const sautSuivant = text.indexOf('\n', debutLigne);
  const finLigne = sautSuivant === -1 ? text.length : sautSuivant;
  const ligne = text.slice(debutLigne, finLigne);
  if (ligne.trim() !== '') {
    return refus('LIGNE_NON_BLANCHE',
      'La ligne du curseur n’est pas blanche. SQL-A insère, il ne remplace pas : placez le '
      + 'curseur sur une ligne vide.', { start: debutLigne, end: finLigne });
  }

  const kind = demande.kind as GenreSql;
  const portee = porteeDe(kind);
  const etat = etatAvant(text, debutLigne);

  // 2. La portée. Une instruction complète dans une requête ouverte, ou une
  //    clause hors de toute requête, sont deux refus distincts : les
  //    confondre cacherait laquelle des deux il faut traiter.
  if (portee === 'fichier' && etat.ouverte) {
    return refus('INSTRUCTION_DANS_UNE_REQUETE',
      'Une instruction complète ne se place pas dans une requête ouverte : le point-virgule de '
      + 'la requête est plus bas. Terminez-la, puis placez le curseur après son point-virgule.',
      curseur);
  }
  if (portee !== 'fichier' && !etat.ouverte) {
    return refus('CLAUSE_HORS_REQUETE',
      'Cette phrase ajoute une clause à une requête, et aucune requête n’est ouverte ici. '
      + 'Commencez par « Crée une requête qui lit … », puis placez le curseur dans le bloc '
      + 'qu’elle ouvre.', curseur);
  }
  if (portee !== 'fichier' && etat.surUneLigne) {
    return refus('CLAUSE_SUR_UNE_LIGNE_UNIQUE',
      'Cette requête est écrite sur une seule ligne. Y ajouter une clause demanderait de '
      + 'modifier cette ligne, et SQL-A ne modifie jamais du code que vous ne lui avez pas '
      + 'demandé de modifier. Réécrivez-la une clause par ligne, ou insérez la clause '
      + 'vous-même.', { start: debutLigne, end: finLigne });
  }
  if (portee !== 'fichier' && etat.sansPointVirgule) {
    return refus('REQUETE_NON_TERMINEE',
      'Cette requête n’a pas de point-virgule : SQL-A ne sait donc pas où elle finit, et il ne '
      + 'devine pas. Terminez-la par un point-virgule sur sa propre ligne.', curseur);
  }

  // 3. L'ordre des clauses.
  if (portee === 'requete' || portee === 'projection') {
    const clause = CLAUSES[kind];
    if (clause === undefined) {
      return refus('CLAUSE_HORS_REQUETE', 'Cette intention n’est pas une clause de requête.', curseur);
    }
    if (clause.suiteDe !== undefined && etat.rangAtteint < clause.suiteDe) {
      const nom = NOM_RANG[clause.suiteDe] ?? 'la clause attendue';
      return refus('SUITE_SANS_CLAUSE',
        `Cette phrase prolonge ${nom}, et ${nom} n’est pas encore écrit. Écrivez-le d’abord : `
        + 'une suite ne tient pas debout seule.', curseur);
    }
    if (portee === 'projection' && etat.projectionFermee) {
      return refus('PROJECTION_FERMEE',
        'La liste de projection est fermée : le FROM est déjà écrit, et une colonne de plus se '
        + 'placerait après lui. Placez le curseur au-dessus du FROM, ou écrivez la requête avec '
        + 'ses deux colonnes.', curseur);
    }
    if (clause.suiteDe === undefined && clause.rang < etat.rangAtteint) {
      const bloque = NOM_RANG[etat.rangAtteint] ?? 'une clause plus tardive';
      const moi = NOM_RANG[clause.rang] ?? 'cette clause';
      return refus('CLAUSE_DANS_LE_MAUVAIS_ORDRE',
        `En SQL, ${moi} vient AVANT ${bloque}, et ${bloque} est déjà écrit au-dessus du curseur. `
        + 'Remontez le curseur avant lui.', curseur);
    }
    if (clause.unique && etat.posesUniques.has(clause.rang)) {
      const moi = NOM_RANG[clause.rang] ?? 'cette clause';
      return refus('CLAUSE_EN_DOUBLE',
        `${moi} est déjà écrit dans cette requête, et il ne peut y figurer qu’une fois. Pour `
        + 'ajouter une condition, employez « Exige aussi que … » ; pour un second critère de '
        + 'tri, « Ordonne ensuite les lignes par … ».', curseur);
    }
  }

  // 4. Le fragment. Le commentaire de traçabilité, puis le code.
  const lignesCode = demande.code.replace(/\n$/u, '').split('\n');
  const corps = [demande.comment, ...lignesCode].join(eol);

  // Une CLAUSE s'insère **sans rien remplacer** : l'intervalle est de largeur
  // nulle au début de la ligne blanche, et le fragment finit par un saut de
  // ligne. La ligne blanche SURVIT donc, sous la clause, et la clause
  // suivante a où aller.
  //
  // Le premier jet remplaçait la ligne blanche, et l'exercice de clôture l'a
  // montré tout de suite : « Exige aussi que … » recevait LIGNE_NON_BLANCHE
  // juste après le WHERE qu'il devait prolonger. Composer une requête était
  // donc impossible — la décision S2 ne tenait pas. Insérer sans rien
  // remplacer est aussi la forme la plus pure de la règle 9 : zéro caractère
  // existant touché, pas même un blanc.
  if (portee !== 'fichier') {
    const newText = corps + eol;
    return {
      status: 'planifie',
      edits: [{ range: { start: debutLigne, end: debutLigne }, newText }],
      indentation: 0,
      portee,
      cursor: { offset: debutLigne + newText.length },
    };
  }
  const newText = corps;

  // Une requête ouvre un bloc : le curseur se pose sur la ligne blanche que
  // le fragment contient, avant le `;`. C'est le même geste que pour un bloc
  // `if` de C-A, et c'est ce qui rend la composition possible.
  let cursor: { offset: number } | undefined;
  if (OUVRE_UNE_REQUETE.has(kind)) {
    const avantPointVirgule = lignesCode.lastIndexOf('');
    if (avantPointVirgule !== -1) {
      const jusque = [demande.comment, ...lignesCode.slice(0, avantPointVirgule)].join(eol);
      cursor = { offset: debutLigne + jusque.length + eol.length };
    }
  }

  return {
    status: 'planifie',
    edits: [{ range: { start: debutLigne, end: finLigne }, newText }],
    indentation: 0,
    portee,
    ...(cursor === undefined ? {} : { cursor }),
  };
}

export { NOM_PORTEE };
