import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SQL } from '../src/langages/sql/langage.ts';
import { planifierSql } from '../src/langages/sql/placement.ts';

/** Le journal de l'exercice de clôture. S'il manque, le test le dit plutôt
 * que de passer : un exercice qu'on ne peut pas relire ne prouve rien. */
const chemin = new URL('../exercice/sql/journal/cloture.json', import.meta.url);

test('S11 : le journal de l’exercice existe et porte ses chiffres', () => {
  assert.ok(existsSync(chemin), 'exercice/sql/journal/cloture.json absent : relancez node exercice/sql/cloture.mjs');
  const journal = JSON.parse(readFileSync(chemin, 'utf8'));
  assert.ok(journal.phrases >= 100, 'phrases dictées : ' + journal.phrases);
  assert.equal(journal.fichiers.length, 9);
  assert.match(journal.postgres ?? '', /PostgreSQL/u);
});

test('S11 : les six fichiers s’exécutent en code 0', () => {
  const journal = JSON.parse(readFileSync(chemin, 'utf8'));
  const positifs = journal.resultats.filter(resultat => resultat.negative !== true);
  assert.equal(positifs.length, 6);
  for (const resultat of positifs) {
    assert.equal(resultat.code, 0, resultat.fichier + ' : code ' + resultat.code);
  }
});

// Un exercice qui ne fait que réussir ne prouve que la moitié.
test('S11 : les trois épreuves négatives échouent, chacune comme prévu', () => {
  const journal = JSON.parse(readFileSync(chemin, 'utf8'));
  const negatives = journal.resultats.filter(resultat => resultat.negative === true);
  assert.equal(negatives.length, 3);
  for (const resultat of negatives) {
    assert.notEqual(resultat.code, 0, resultat.fichier + ' aurait dû échouer');
    assert.equal(resultat.attendue, true, resultat.fichier + ' a échoué pour la mauvaise raison');
  }
});

/** Les chiffres que le calcul à la main donne. Écrits ici, et non lus du
 * journal : c'est tout l'intérêt. Un journal qui se vérifierait lui-même ne
 * vérifierait rien. */
test('S11 : les résultats sont conformes au calcul fait à la main', () => {
  const journal = JSON.parse(readFileSync(chemin, 'utf8'));
  // Les fins de ligne sont normalisées : `psql` écrit des CRLF sur Windows,
  // et une assertion sur le CONTENU ne doit pas dépendre de cela.
  const sortie = journal.resultats.map(resultat => resultat.sortie).join('\n')
    .split('\r\n').join('\n');
  // 7 emprunts, dont 5 rendus : COUNT(*) et COUNT(rendu) DOIVENT différer.
  assert.match(sortie, /\n\s+7\n/u, 'COUNT(*) attendu à 7');
  assert.match(sortie, /\n\s+5\n/u, 'COUNT(rendu) attendu à 5');
  // 4 lecteurs : (34 + 20 + 51 + 17) / 4 = 30,5.
  assert.match(sortie, /30\.50+/u, 'moyenne attendue à 30,5');
  // L'apostrophe traverse l'écriture et la lecture sans s'abîmer.
  assert.match(sortie, /O'Brien/u);
  assert.match(sortie, /L’Étranger/u);
  // Le lecteur SANS emprunt n'apparaît que dans la jointure gauche : 7 lignes
  // d'un côté, 8 de l'autre.
  assert.match(sortie, /\(7 lignes\)/u);
  assert.match(sortie, /\(8 lignes\)/u);
  // La transaction annulée ramène les données : 6 après le ROLLBACK.
  assert.match(sortie, /\n\s+6\n/u, 'compte après ROLLBACK attendu à 6');
});

/** La propriété centrale de la décision S2, revérifiée hors de l'exercice :
 * aucune insertion ne remplace un caractère non blanc. */
test('S11 : composer une requête ne touche AUCUN caractère existant', () => {
  const phrases = [
    { phrase: 'Crée une requête qui lit les colonnes nom et age de la table eleves.' },
    { phrase: 'Ne garde que les lignes où "age > 18".', dansLeBloc: true },
    { phrase: 'Exige aussi que "age < 60".', dansLeBloc: true },
    { phrase: 'Regroupe les lignes par nom.', dansLeBloc: true },
    { phrase: 'Ne garde que les groupes de plus de 1 lignes.', dansLeBloc: true },
    { phrase: 'Ordonne les lignes par nom en ordre croissant.', dansLeBloc: true },
    { phrase: 'Ignore les 1 premières lignes.', dansLeBloc: true },
    { phrase: 'Ne garde que les 2 premières lignes.', dansLeBloc: true },
  ];
  let texte = '';
  let curseur = 0;
  for (const entree of phrases) {
    const resultat = SQL.natif(entree.phrase);
    assert.equal(resultat.status, 'rendu', entree.phrase);
    if (entree.dansLeBloc !== true) curseur = texte.length;
    const plan = planifierSql({ document: { text: texte }, cursorOffset: curseur,
      comment: SQL.commentaire(entree.phrase), code: resultat.code, kind: resultat.kind, eol: '\n' });
    assert.equal(plan.status, 'planifie', entree.phrase + ' : ' + JSON.stringify(plan.diagnostics?.[0]));
    const edition = plan.edits[0];
    assert.equal(texte.slice(edition.range.start, edition.range.end).trim(), '',
      'insertion impure pour ' + entree.phrase);
    texte = texte.slice(0, edition.range.start) + edition.newText + texte.slice(edition.range.end);
    curseur = plan.cursor?.offset ?? edition.range.start + edition.newText.length;
  }
  // Les huit clauses, dans l'ordre que SQL exige.
  const lignes = texte.split('\n').filter(ligne => !ligne.startsWith('--') && ligne.trim() !== '');
  assert.deepEqual(lignes, [
    'SELECT nom', '     , age', 'FROM eleves', 'WHERE age > 18', '  AND age < 60',
    'GROUP BY nom', 'HAVING COUNT(*) > 1', 'ORDER BY nom ASC', 'OFFSET 1 ROWS',
    'FETCH FIRST 2 ROWS ONLY', ';',
  ]);
});
