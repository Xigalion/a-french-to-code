import test from 'node:test';
import assert from 'node:assert/strict';
import { planifierSql, etatAvant } from '../src/langages/sql/placement.ts';
import { SQL } from '../src/langages/sql/langage.ts';

/** Dicte une suite de phrases comme l'IHM le ferait, et VÉRIFIE à chaque pas
 * qu'aucun caractère non blanc n'est remplacé. C'est la décision S2 mise à
 * l'épreuve, et c'est le seul moyen de la prouver. */
function dicter(phrases) {
  let texte = '';
  let curseur = 0;
  const refus = [];
  for (const entree of phrases) {
    const phrase = typeof entree === 'string' ? entree : entree.phrase;
    const dansLeBloc = typeof entree !== 'string' && entree.dansLeBloc === true;
    const resultat = SQL.natif(phrase);
    assert.ok(resultat !== undefined && resultat.status === 'rendu', `non rendue : ${phrase}`);
    if (!dansLeBloc) {
      if (texte !== '' && !texte.endsWith('\n\n')) texte += texte.endsWith('\n') ? '\n' : '\n\n';
      curseur = texte.length;
    }
    const plan = planifierSql({ document: { text: texte }, cursorOffset: curseur,
      comment: SQL.commentaire(phrase), code: resultat.code, kind: resultat.kind, eol: '\n' });
    if (plan.status === 'refuse') { refus.push(plan.diagnostics[0]); continue; }
    const edition = plan.edits[0];
    const remplace = texte.slice(edition.range.start, edition.range.end);
    assert.equal(remplace.trim(), '', `INSERTION IMPURE : « ${remplace} » remplacé par ${phrase}`);
    texte = texte.slice(0, edition.range.start) + edition.newText + texte.slice(edition.range.end);
    curseur = plan.cursor === undefined ? edition.range.start + edition.newText.length : plan.cursor.offset;
  }
  return { texte, refus, curseur };
}

test('une instruction se place à la portée fichier, sur une ligne blanche', () => {
  const { texte, refus } = dicter(['Supprime la table eleves.']);
  assert.deepEqual(refus, []);
  assert.equal(texte, '-- Supprime la table eleves.\nDROP TABLE eleves;');
});

// L'ÉPREUVE de la décision S2 : quatre clauses, quatre insertions pures.
test('décision S2 : une requête se compose clause par clause, sans rien remplacer', () => {
  const { texte, refus } = dicter([
    { phrase: 'Crée une requête qui lit les colonnes nom et age de la table eleves.' },
    { phrase: 'Ne garde que les lignes où "age > 18".', dansLeBloc: true },
    { phrase: 'Exige aussi que "age < 60".', dansLeBloc: true },
    { phrase: 'Regroupe les lignes par nom.', dansLeBloc: true },
    { phrase: 'Ordonne les lignes par age en ordre décroissant.', dansLeBloc: true },
    { phrase: 'Ne garde que les 2 premières lignes.', dansLeBloc: true },
  ]);
  assert.deepEqual(refus, []);
  const lignes = texte.split('\n').filter((ligne) => !ligne.startsWith('--') && ligne.trim() !== '');
  assert.deepEqual(lignes, [
    'SELECT nom', '     , age', 'FROM eleves',
    'WHERE age > 18', '  AND age < 60', 'GROUP BY nom',
    'ORDER BY age DESC', 'FETCH FIRST 2 ROWS ONLY', ';',
  ]);
  // La ligne blanche du curseur SURVIT à chaque insertion : c'est elle qui
  // rend la composition possible, et sa disparition était le premier défaut
  // trouvé par l'exercice de clôture.
  assert.match(texte, /FETCH FIRST 2 ROWS ONLY\n\n;$/u);
});

test('l’insertion d’une clause est de largeur nulle : zéro caractère touché', () => {
  const { texte } = dicter([{ phrase: 'Crée une requête qui lit la colonne nom de la table eleves.' }]);
  const curseur = texte.indexOf('\n\n;') + 1;
  const resultat = SQL.natif('Ne garde que les lignes où "age > 18".');
  const plan = planifierSql({ document: { text: texte }, cursorOffset: curseur,
    comment: '-- x', code: resultat.code, kind: resultat.kind, eol: '\n' });
  assert.equal(plan.status, 'planifie');
  assert.equal(plan.edits[0].range.start, plan.edits[0].range.end);
});

test('une clause hors de toute requête est refusée', () => {
  const { refus } = dicter(['Ne garde que les lignes où "age > 18".']);
  assert.equal(refus.length, 1);
  assert.equal(refus[0].code, 'CLAUSE_HORS_REQUETE');
  assert.match(refus[0].message, /Crée une requête/u);
});

test('une instruction complète dans une requête ouverte est refusée', () => {
  const { refus } = dicter([
    { phrase: 'Crée une requête qui lit la colonne nom de la table eleves.' },
    { phrase: 'Supprime la table eleves.', dansLeBloc: true },
  ]);
  assert.equal(refus.length, 1);
  assert.equal(refus[0].code, 'INSTRUCTION_DANS_UNE_REQUETE');
});

test('une clause dans le mauvais ordre est refusée, et le message NOMME ce qui bloque', () => {
  const { refus } = dicter([
    { phrase: 'Crée une requête qui lit la colonne nom de la table eleves.' },
    { phrase: 'Ordonne les lignes par nom en ordre croissant.', dansLeBloc: true },
    { phrase: 'Ne garde que les lignes où "age > 18".', dansLeBloc: true },
  ]);
  assert.equal(refus.length, 1);
  assert.equal(refus[0].code, 'CLAUSE_DANS_LE_MAUVAIS_ORDRE');
  assert.match(refus[0].message, /WHERE/u);
  assert.match(refus[0].message, /ORDER BY/u);
});

test('un deuxième WHERE est refusé, et la phrase de rechange est nommée', () => {
  const { refus } = dicter([
    { phrase: 'Crée une requête qui lit la colonne nom de la table eleves.' },
    { phrase: 'Ne garde que les lignes où "age > 18".', dansLeBloc: true },
    { phrase: 'Ne garde que les lignes où "age < 60".', dansLeBloc: true },
  ]);
  assert.equal(refus.length, 1);
  assert.equal(refus[0].code, 'CLAUSE_EN_DOUBLE');
  assert.match(refus[0].message, /Exige aussi que/u);
});

test('une suite sans sa clause mère est refusée', () => {
  const { refus } = dicter([
    { phrase: 'Crée une requête qui lit la colonne nom de la table eleves.' },
    { phrase: 'Exige aussi que "age < 60".', dansLeBloc: true },
  ]);
  assert.equal(refus.length, 1);
  assert.equal(refus[0].code, 'SUITE_SANS_CLAUSE');
  assert.match(refus[0].message, /ne tient pas debout seule/u);
});

test('une colonne de plus après le FROM est refusée', () => {
  const { refus } = dicter([
    { phrase: 'Crée une requête qui lit la colonne nom de la table eleves.' },
    { phrase: 'Lis aussi la colonne age.', dansLeBloc: true },
  ]);
  assert.equal(refus.length, 1);
  assert.equal(refus[0].code, 'PROJECTION_FERMEE');
});

// Décision S8 : une limite réelle, dite plutôt que devinée.
test('décision S8 : une requête écrite sur une seule ligne n’est pas complétable', () => {
  const texte = 'SELECT nom FROM eleves WHERE age > 18;\n\n';
  // Le curseur est AVANT le point-virgule, dans l'instruction : on simule un
  // fichier écrit à la main.
  const aLaMain = 'SELECT nom FROM eleves WHERE age > 18\n\n;\n';
  const resultat = SQL.natif('Ordonne les lignes par nom en ordre croissant.');
  const plan = planifierSql({ document: { text: aLaMain }, cursorOffset: aLaMain.indexOf('\n\n') + 1,
    comment: '-- x', code: resultat.code, kind: resultat.kind, eol: '\n' });
  assert.equal(plan.status, 'refuse');
  assert.equal(plan.diagnostics[0].code, 'CLAUSE_SUR_UNE_LIGNE_UNIQUE');
  assert.match(plan.diagnostics[0].message, /ne modifie jamais/u);
  // Et l'état lu dit bien « sur une ligne ».
  assert.equal(etatAvant(texte, texte.length).ouverte, false);
});

test('la ligne du curseur doit être blanche', () => {
  const resultat = SQL.natif('Supprime la table eleves.');
  const plan = planifierSql({ document: { text: 'DROP TABLE autre;' }, cursorOffset: 4,
    comment: '-- x', code: resultat.code, kind: resultat.kind, eol: '\n' });
  assert.equal(plan.status, 'refuse');
  assert.equal(plan.diagnostics[0].code, 'LIGNE_NON_BLANCHE');
});

// Défaut du lot J2, transposé : `lastIndexOf('\n', 0)` trouve le saut
// d'indice 0 et renvoyait un intervalle INVERSÉ.
test('curseur à l’offset 0 d’un document commençant par une ligne blanche', () => {
  const resultat = SQL.natif('Supprime la table eleves.');
  const plan = planifierSql({ document: { text: '\nDROP TABLE autre;' }, cursorOffset: 0,
    comment: '-- x', code: resultat.code, kind: resultat.kind, eol: '\n' });
  assert.equal(plan.status, 'planifie');
  assert.ok(plan.edits[0].range.start <= plan.edits[0].range.end);
  assert.equal(plan.edits[0].range.start, 0);
});

test('un code vide est refusé', () => {
  const plan = planifierSql({ document: { text: '' }, cursorOffset: 0,
    comment: '-- x', code: '   ', kind: 'SQL_TABLE_SUPPRIME', eol: '\n' });
  assert.equal(plan.status, 'refuse');
  assert.equal(plan.diagnostics[0].code, 'CODE_VIDE');
});

test('les fins de ligne Windows sont respectées', () => {
  const resultat = SQL.natif('Crée une requête qui lit la colonne nom de la table eleves.');
  const plan = planifierSql({ document: { text: '' }, cursorOffset: 0,
    comment: '-- x', code: resultat.code, kind: resultat.kind, eol: '\r\n' });
  assert.equal(plan.status, 'planifie');
  assert.ok(plan.edits[0].newText.includes('\r\n'));
  assert.ok(!/[^\r]\n/u.test(plan.edits[0].newText));
});

test('le curseur est posé sur la ligne blanche du bloc, avant le point-virgule', () => {
  const resultat = SQL.natif('Crée une requête qui lit la colonne nom de la table eleves.');
  const plan = planifierSql({ document: { text: '' }, cursorOffset: 0,
    comment: '-- x', code: resultat.code, kind: resultat.kind, eol: '\n' });
  assert.equal(plan.status, 'planifie');
  assert.ok(plan.cursor !== undefined);
  const texte = plan.edits[0].newText;
  const reste = texte.slice(plan.cursor.offset);
  assert.equal(reste, '\n;');
});

test('l’état lu reconnaît le rang atteint et le FROM', () => {
  const texte = 'SELECT nom\nFROM eleves\nWHERE age > 18\n\n;\n';
  const etat = etatAvant(texte, texte.indexOf('\n\n') + 1);
  assert.equal(etat.ouverte, true);
  assert.equal(etat.rangAtteint, 4);
  assert.equal(etat.projectionFermee, true);
  assert.ok(etat.posesUniques.has(4));
});

test('après un point-virgule, plus aucune requête n’est ouverte', () => {
  const texte = 'SELECT nom\nFROM eleves\n\n;\n\n';
  const etat = etatAvant(texte, texte.length);
  assert.equal(etat.ouverte, false);
  assert.equal(etat.rangAtteint, 0);
});
