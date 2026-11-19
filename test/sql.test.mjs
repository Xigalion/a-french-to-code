import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GENRES, rendre, langagePour } from '../src/langages/registre.ts';
import { SQL } from '../src/langages/sql/langage.ts';
import { RAISONS_SQL, PORTEES_SQL } from '../src/langages/sql/raisons.ts';
import { EXEMPLES_SQL, MOTIFS } from '../src/langages/sql/catalogue.ts';
import { CODES_SQL, expliquerSql } from '../src/langages/sql/informations.ts';
import { analyserConditionSql, rendreConditionSql, verifierNomsSql, verifierOperateursSql,
  SQL_CAPABILITIES } from '../src/langages/sql/expression.ts';
import { porteeDe, OUVRE_UNE_REQUETE, CLAUSES } from '../src/langages/sql/portees.ts';

const spec = JSON.parse(readFileSync(new URL('../docs/phase4/catalogue-sql.json', import.meta.url), 'utf8'));
const rendu = (phrase) => SQL.natif(phrase);

test('SQL est inscrit, et son étiquette de blocs est « terminateur »', () => {
  assert.equal(langagePour('.sql'), SQL);
  assert.equal(SQL.blocs, 'terminateur');
  assert.equal(SQL.commentaire('Phrase.'), '-- Phrase.');
});

// Décision S1. Le chiffre n'est pas écrit : il est LU du moteur, pour que
// l'ajout d'un genre au catalogue partagé casse ce test au lieu de passer.
test('décision S1 : aucune des intentions du catalogue partagé n’est portée', () => {
  assert.equal(PORTEES_SQL.size, 0);
  assert.equal(RAISONS_SQL.size, GENRES.size);
  for (const genre of GENRES) {
    const raison = RAISONS_SQL.get(genre);
    assert.ok(raison !== undefined, `aucune raison pour ${genre}`);
    assert.ok(raison.length > 80, `raison trop courte pour ${genre} : elle doit NOMMER la construction SQL`);
  }
});

test('les raisons sont mutualisées, et aucune n’est écrite pour un non-genre', () => {
  assert.equal(new Set(RAISONS_SQL.values()).size, 10);
  for (const genre of RAISONS_SQL.keys()) {
    assert.ok(GENRES.has(genre), `${genre} n’est pas un genre du moteur`);
  }
});

test('une intention du catalogue partagé est refusée avec sa raison', () => {
  const resultat = rendre(SQL, { kind: 'DECL_INT', name: 'x', range: { start: 0, end: 1 } });
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'INTENTION_NON_PORTEE');
  assert.match(resultat.raison, /COLONNE/u);
});

test('le refus de la structure explique la différence entre un type et une relation', () => {
  const resultat = rendre(SQL, { kind: 'STRUCT_DECL', name: 'eleve', range: { start: 0, end: 1 } });
  assert.equal(resultat.status, 'refus');
  assert.match(resultat.raison, /RELATION/u);
  assert.match(resultat.raison, /TYPE/u);
});

test('les 92 phrases de démonstration sont reconnues et rendues', () => {
  assert.equal(MOTIFS.length, spec.formulations.length);
  for (const { phrase, kind } of EXEMPLES_SQL) {
    const resultat = rendu(phrase);
    assert.ok(resultat !== undefined, `non reconnue : ${phrase}`);
    assert.equal(resultat.status, 'rendu', `refusée : ${phrase}`);
    assert.equal(resultat.kind, kind);
    assert.ok(resultat.code.trim() !== '');
  }
});

// C'est le test qui empêche la dérive entre le contrat approuvé et le code.
test('le moteur rend exactement ce que la spécification approuvée décrit', () => {
  const echapper = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/gu, (c) => '\\' + c).replace(/['’]/gu, '[\'’]');
  for (const entree of spec.formulations) {
    const exemple = EXEMPLES_SQL.find((candidat) => candidat.kind === entree.genre);
    assert.ok(exemple !== undefined, `${entree.genre} absent du moteur`);
    const noms = [...entree.phrase.matchAll(/\{(\w+)\}/gu)].map((trouve) => trouve[1]);
    let motif = '^';
    let position = 0;
    for (const trouve of entree.phrase.matchAll(/\{(\w+)\}/gu)) {
      motif += echapper(entree.phrase.slice(position, trouve.index)) + '(.+?)';
      position = trouve.index + trouve[0].length;
    }
    motif += echapper(entree.phrase.slice(position)) + '$';
    const lu = new RegExp(motif, 'u').exec(exemple.phrase.trim());
    assert.ok(lu !== null, `la démonstration de ${entree.genre} ne suit pas le gabarit approuvé`);
    let attendu = entree.sql;
    for (const [index, nom] of noms.entries()) attendu = attendu.split('{' + nom + '}').join(lu[index + 1]);
    assert.equal(rendu(exemple.phrase).code, attendu, entree.genre);
  }
});

test('chaque domaine annoncé porte au moins une formulation', () => {
  for (const domaine of spec.domaines) {
    const combien = spec.formulations.filter((entree) => entree.domaine === domaine.numero).length;
    assert.ok(combien > 0, `domaine ${domaine.numero} vide`);
  }
  assert.equal(spec.domaines.length, 9);
});

// ----------------------------- décision S3 -----------------------------
test('décision S3 : le profil SQL ouvre simpleEquality, et lui seul', () => {
  assert.equal(SQL_CAPABILITIES.simpleEquality, true);
  // Et il ferme ce que SQL n'a pas. Listé, pas déduit.
  assert.equal(SQL_CAPABILITIES.indexing, false);
  assert.equal(SQL_CAPABILITIES.characters, false);
  assert.equal(SQL_CAPABILITIES.addressOf, false);
  assert.equal(SQL_CAPABILITIES.dereference, false);
  assert.equal(SQL_CAPABILITIES.pointerOffset, false);
  assert.equal(SQL_CAPABILITIES.casts, false);
  assert.equal(SQL_CAPABILITIES.members, true);
});

test('« = » est l’égalité, « <> » l’inégalité', () => {
  for (const [source, attendu] of [['age = 18', 'age = 18'], ['age <> 18', 'age <> 18'],
    ['age >= 10 || age <= 2', '(age >= 10 OR age <= 2)'],
    ['a = 1 && b = 2', '(a = 1 AND b = 2)'],
    ['!(age = 1)', 'NOT (age = 1)'],
    ['eleves.id = emprunts.eleve', 'eleves.id = emprunts.eleve']]) {
    const analyse = analyserConditionSql(source, 0, source.length);
    assert.equal(analyse.status, 'parsed', source);
    assert.equal(rendreConditionSql(analyse.condition).code, attendu);
  }
});

// Règle 5 : diagnostic, pas correction. Rendre `==` par `=` aurait été une
// correction silencieuse d'une syntaxe qui n'existe pas en SQL.
test('« == » et « != » sont REFUSÉS, pas corrigés', () => {
  for (const source of ['age == 18', 'age != 18']) {
    const analyse = analyserConditionSql(source, 0, source.length);
    assert.equal(analyse.status, 'rejected', source);
    assert.equal(analyse.diagnostic.code, 'SQL_OPERATEUR_DU_C');
    assert.match(analyse.diagnostic.message, /ne le remplace pas à votre place/u);
  }
  assert.equal(verifierOperateursSql('a = 1', 0, 5), undefined);
});

// Règle P3.1. Le pire des deux mondes : accepté par le serveur, jamais vrai.
test('« = NULL » est refusé, et renvoie vers la phrase dédiée', () => {
  const source = 'rendu = NULL';
  const analyse = analyserConditionSql(source, 0, source.length);
  assert.equal(analyse.status, 'parsed');
  const diagnostic = verifierNomsSql(analyse.condition);
  assert.ok(diagnostic !== undefined);
  assert.equal(diagnostic.code, 'SQL_NULL_DANS_COMPARAISON');
  assert.match(diagnostic.message, /IS NULL/u);
});

test('une valeur nue n’est pas une condition en SQL', () => {
  const source = 'age';
  const analyse = analyserConditionSql(source, 0, source.length);
  assert.equal(analyse.status, 'parsed');
  const resultat = rendreConditionSql(analyse.condition);
  assert.equal(resultat.status, 'refus');
  assert.match(resultat.raison, /n’est pas une condition/u);
});

test('les constructions du C sont refusées avec une raison SQL', () => {
  for (const [source, motif] of [['t[0] = 1', /INVALID_EXPRESSION_TOKEN|n’appartient pas/u],
    ['a & b', /UNSUPPORTED_CONDITION_OPERATOR/u]]) {
    const analyse = analyserConditionSql(source, 0, source.length);
    assert.equal(analyse.status, 'rejected', source);
    assert.match(analyse.diagnostic.code + ' ' + analyse.diagnostic.message, motif);
  }
});

// ----------------------------- décision S7 -----------------------------
test('décision S7 : l’apostrophe d’un texte est doublée, et la phrase intacte', () => {
  const phrase = 'Insère dans la table clients une ligne dont nom vaut le texte "O\'Brien".';
  const resultat = rendu(phrase);
  assert.equal(resultat.status, 'rendu');
  assert.match(resultat.code, /VALUES \('O''Brien'\);/u);
  // Règle 2 : le commentaire garde la phrase EXACTE, apostrophe simple.
  assert.equal(SQL.commentaire(phrase), '-- ' + phrase);
  assert.match(SQL.commentaire(phrase), /O'Brien/u);
});

// ----------------------------- décision S10 ----------------------------
test('décision S10 : une contrainte sans nom est refusée, et la phrase le dit', () => {
  const resultat = rendu('Fais de id la clé primaire de la table eleves.');
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'SQL_CONTRAINTE_SANS_NOM');
  assert.match(resultat.message, /serveur qui en invente un/u);
});

// ----------------------------- décision P4 -----------------------------
test('décision P4 : une modification sans filtre exige que la phrase le dise', () => {
  assert.equal(rendu('Supprime les lignes de la table eleves.').code, 'SQL_SUPPRESSION_AMBIGUE');
  assert.equal(rendu('Modifie la table eleves en donnant à age la valeur 0.').code,
    'SQL_MODIFICATION_AMBIGUE');
  // Et avec les mots « toutes les lignes », elle passe — plus une information.
  const toutes = rendu('Supprime toutes les lignes de la table eleves.');
  assert.equal(toutes.status, 'rendu');
  assert.equal(toutes.code, 'DELETE FROM eleves;');
  const codes = toutes.informations.map((information) => information.code);
  assert.ok(codes.includes('SQL_MODIFICATION_SANS_FILTRE'));
  assert.ok(codes.includes('SQL_AUCUNE_EXECUTION'));
});

test('aucune phrase ne produit un WHERE que l’utilisateur n’a pas écrit', () => {
  for (const { phrase } of EXEMPLES_SQL) {
    const resultat = rendu(phrase);
    if (resultat.status !== 'rendu') continue;
    if (/WHERE/u.test(resultat.code)) {
      assert.match(phrase, /où|là où|que "|existe/u,
        `${phrase} produit un WHERE sans que la phrase ne le demande`);
    }
  }
});

// ----------------------------- informations ----------------------------
test('les informations passives sont un canal distinct, et toutes atteignables', () => {
  assert.equal(CODES_SQL.length, 17);
  const emises = new Set();
  for (const { phrase } of EXEMPLES_SQL) {
    const resultat = rendu(phrase);
    if (resultat.status !== 'rendu') continue;
    for (const information of resultat.informations) {
      assert.equal(information.severity, 'information');
      emises.add(information.code);
    }
  }
  const mortes = CODES_SQL.filter((code) => !emises.has(code));
  assert.deepEqual(mortes, [], 'informations qu’aucune phrase du catalogue n’émet');
});

test('les transactions distinguent l’annulable du définitif', () => {
  const ouvre = rendu('Ouvre une transaction.').informations.map((i) => i.code);
  assert.ok(ouvre.includes('SQL_TRANSACTION_ANNULABLE'));
  const valide = rendu('Valide la transaction.').informations.map((i) => i.code);
  assert.ok(valide.includes('SQL_TRANSACTION_DEFINITIVE'));
  const texte = expliquerSql('SQL_TRANSACTION_VALIDE', { start: 0, end: 1 })[0].message;
  assert.match(texte, /DÉFINITIVES/u);
});

test('A dit qu’il n’exécute jamais rien', () => {
  const texte = expliquerSql('SQL_SUPPRIME_TOUTES', { start: 0, end: 1 })
    .find((information) => information.code === 'SQL_AUCUNE_EXECUTION').message;
  assert.match(texte, /ne l’exécute JAMAIS/u);
});

// ----------------------------- portées ---------------------------------
test('les trois portées, et les dix rangs de clauses', () => {
  assert.equal(porteeDe('SQL_TABLE_CREE'), 'fichier');
  assert.equal(porteeDe('SQL_FILTRE_CONDITION'), 'requete');
  assert.equal(porteeDe('SQL_PROJECTION_AJOUTE'), 'projection');
  const rangs = new Set(Object.values(CLAUSES).map((clause) => clause.rang));
  assert.deepEqual([...rangs].sort((a, b) => a - b), [1, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('une clause ne porte jamais de point-virgule, une instruction toujours', () => {
  for (const { phrase, kind } of EXEMPLES_SQL) {
    const resultat = rendu(phrase);
    if (resultat.status !== 'rendu') continue;
    if (porteeDe(kind) === 'fichier') {
      assert.ok(resultat.code.trimEnd().endsWith(';'), `${kind} sans point-virgule`);
    } else {
      assert.ok(!resultat.code.includes(';'), `${kind} : une clause ne doit pas porter de ;`);
    }
  }
});

test('une requête ouvre un bloc : ligne blanche puis point-virgule seul', () => {
  for (const kind of OUVRE_UNE_REQUETE) {
    const exemple = EXEMPLES_SQL.find((candidat) => candidat.kind === kind);
    assert.ok(exemple !== undefined, kind);
    const code = rendu(exemple.phrase).code;
    const lignes = code.split('\n');
    assert.equal(lignes.at(-1), ';', `${kind} : le point-virgule doit être seul sur la dernière ligne`);
    assert.equal(lignes.at(-2), '', `${kind} : il manque la ligne blanche du curseur`);
  }
});

test('un mot réservé de SQL est refusé comme nom', () => {
  const resultat = rendu('Crée une table nommée select avec une colonne entière nommée id.');
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'SQL_MOT_RESERVE');
  assert.match(resultat.message, /guillemets/u);
});

test('une phrase hors catalogue SQL n’est pas reconnue, et non refusée', () => {
  // La différence compte : `undefined` laisse vivre le diagnostic du
  // catalogue partagé, un refus l'écraserait.
  assert.equal(SQL.natif('Déclare un entier nommé x.'), undefined);
  assert.equal(SQL.natif('Bonjour.'), undefined);
});

test('du texte en trop est refusé, la phrase étant complète avant lui', () => {
  const resultat = rendu('Supprime la table eleves tout de suite.');
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'UNEXPECTED_TEXT');
});
