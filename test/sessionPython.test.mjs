// Lot P4a — la session Python de l'hôte.
//
// Ce qu'ils doivent établir : le cycle complet (saisie → aperçu →
// confirmation → insertion), les quatre étapes de diagnostic, le commentaire
// « # » de traçabilité, le refus du langage cible, et le fait qu'une
// indentation par tabulations est refusée au lieu d'être devinée.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PythonTranslationSession } from '../extension/out/extension/src/sessionPython.js';

function cible(text = '', cursorOffset = text.length, options = {}) {
  return { document: { id: 'file:///demo.py', revision: 1, text }, cursorOffset,
    singleCursor: true, indentUnit: '    ', indentSignature: 'true:4', eol: '\n', open: true, ...options };
}
const session = (courante, draft, options) => new PythonTranslationSession(courante, draft, options);
function apercu(s, courante) {
  const resultat = s.prepare(courante);
  assert.equal(resultat.status, 'preview', JSON.stringify(resultat));
  return resultat.preview;
}

test('P4a : cycle complet — aperçu, confirmation, insertion', () => {
  const courante = cible('');
  const s = session(courante, 'Crée un entier nommé age de valeur 20.');
  assert.equal(s.langage, 'python');
  assert.equal(s.diagnose(courante), undefined);
  const vue = apercu(s, courante);
  assert.equal(vue.before, '');
  assert.equal(vue.after, '# Crée un entier nommé age de valeur 20.\nage = 20');
  // Aucune insertion avant confirmation.
  assert.equal(s.beginApply(vue.token, courante).status, 'error');
  assert.equal(s.reviewReady(vue.token, courante), true);
  const applique = s.beginApply(vue.token, courante);
  assert.equal(applique.status, 'apply');
  assert.equal(applique.expectedAfter, vue.after);
  assert.equal(applique.plan.edits.length, 1);
  assert.equal(applique.plan.source.text, 'Crée un entier nommé age de valeur 20.');
  s.finishApply(true);
  assert.equal(s.phase, 'done');
});

test('P4a : le commentaire de traçabilité est celui de Python, et la phrase est exacte', () => {
  const courante = cible('');
  const s = session(courante, 'Affiche la valeur de age.');
  const vue = apercu(s, courante);
  assert.ok(vue.after.startsWith('# Affiche la valeur de age.\n'));
  assert.ok(!vue.after.includes('//'));
});

test('P4a : une instruction s’indente à la colonne de la ligne blanche', () => {
  const base = 'while i < 3:\n    ';
  const courante = cible(base);
  const s = session(courante, 'Affiche la valeur de i.');
  const vue = apercu(s, courante);
  assert.equal(vue.after, 'while i < 3:\n    # Affiche la valeur de i.\n    print(i, end="")');
});

test('P4a : un en-tête place le curseur dans le bloc, un cran plus loin', () => {
  const courante = cible('');
  const s = session(courante, 'Crée un bloc si "x > 0".');
  const vue = apercu(s, courante);
  assert.equal(vue.after, '# Crée un bloc si "x > 0".\nif x > 0:');
  s.reviewReady(vue.token, courante);
  const applique = s.beginApply(vue.token, courante);
  assert.equal(applique.plan.cursorAfter, vue.after.length + 1 + 4);
});

test('P4a : quatre étapes de diagnostic, et chacune porte son nom', () => {
  // 1. traduction : la phrase n'est pas du catalogue.
  let courante = cible('');
  assert.equal(session(courante, 'Afficher la valeur de age.').diagnose(courante)?.stage, 'translation');
  // 2. rendu : l'intention existe, Python ne la porte pas.
  assert.equal(session(courante, 'Déclare un entier nommé n.').diagnose(courante)?.stage, 'rendu');
  // 3. rendu : l'intention est portée, la construction non.
  const division = session(courante, 'Affecte à r le résultat numérique de "a / b".').diagnose(courante);
  assert.equal(division?.stage, 'rendu');
  assert.equal(division.code, 'CONSTRUCTION_NON_PORTEE');
  assert.match(division.message, /7 \/ 2 vaut 3/u);
  // 4. placement : la ligne n'est pas blanche.
  courante = cible('age = 20\n', 2);
  assert.equal(session(courante, 'Affiche la valeur de age.').diagnose(courante)?.stage, 'placement');
});

test('P4a : un refus du langage cible n’autorise aucun aperçu', () => {
  const courante = cible('');
  const s = session(courante, 'Déclare un pointeur de type int nommé p.');
  const resultat = s.prepare(courante);
  assert.equal(resultat.status, 'error');
  assert.equal(resultat.diagnostic.stage, 'rendu');
  assert.equal(resultat.diagnostic.code, 'INTENTION_NON_PORTEE');
  assert.match(resultat.diagnostic.message, /aliasing/u);
  assert.equal(courante.document.text, '');
});

test('P4a : une indentation par tabulations est refusée, pas devinée', () => {
  const courante = cible('', 0, { indentUnit: '\t', indentSignature: 'false:4' });
  const s = session(courante, 'Crée un entier nommé age de valeur 20.');
  const diagnostic = s.diagnose(courante);
  assert.equal(diagnostic?.stage, 'integration');
  assert.equal(diagnostic.code, 'INDENT_UNIT_NOT_SPACES');
  assert.match(diagnostic.message, /interdit de mélanger/u);
});

test('P4a : un pas d’indentation de 2 est respecté, pas corrigé', () => {
  const base = 'while i < 3:\n  ';
  const courante = cible(base, base.length, { indentUnit: '  ', indentSignature: 'true:2' });
  const s = session(courante, 'Affiche la valeur de i.');
  const vue = apercu(s, courante);
  assert.equal(vue.after, 'while i < 3:\n  # Affiche la valeur de i.\n  print(i, end="")');
});

test('P4a : CRLF — les lignes insérées portent la fin de ligne du document', () => {
  const base = 'while i < 3:\r\n    ';
  const courante = cible(base, base.length, { eol: '\r\n' });
  const s = session(courante, 'Affiche la valeur de i.');
  const vue = apercu(s, courante);
  assert.equal(vue.after, 'while i < 3:\r\n    # Affiche la valeur de i.\r\n    print(i, end="")');
  assert.ok(!/[^\r]\n/u.test(vue.after), 'aucune fin de ligne LF isolée ne doit apparaître');
});

test('P4a : aucun avis de calcul — ceux de C17 seraient faux en Python', () => {
  const courante = cible('');
  // En C17, cette phrase produit deux avertissements de calcul. En Python, la
  // division est refusée, et les règles de C17 n'y ont aucun sens.
  const s = session(courante, 'Affecte à r le résultat numérique de "7 / 0 + 5.0 % 2".');
  assert.deepEqual(s.advisories, []);
  assert.equal(s.diagnose(courante)?.stage, 'rendu');
});

test('P4a : les informations passives sont celles de Python', () => {
  const courante = cible('');
  const s = session(courante, 'Crée un caractère nommé c de valeur \'A\'.');
  const codes = s.information.map(information => information.code);
  assert.ok(codes.includes('PY_CHAR_IS_A_STRING'));
  assert.ok(codes.every(code => code.startsWith('PY_')), codes.join(', '));
  for (const information of s.information) assert.equal(information.severity, 'information');
});

test('P4a : le document change sous l’aperçu — plan périmé, aucune insertion', () => {
  const courante = cible('');
  const s = session(courante, 'Crée un entier nommé age de valeur 20.');
  const vue = apercu(s, courante);
  s.reviewReady(vue.token, courante);
  const change = cible('x = 1\n\n');
  change.document.revision = 2;
  const resultat = s.beginApply(vue.token, change);
  assert.equal(resultat.status, 'error');
  assert.equal(resultat.diagnostic.code, 'STALE_PREVIEW');
  assert.equal(s.phase, 'stale');
});

test('P4a : annulation après aperçu — document intact', () => {
  const courante = cible('');
  const s = session(courante, 'Crée un entier nommé age de valeur 20.');
  const vue = apercu(s, courante);
  s.reviewReady(vue.token, courante);
  s.cancel();
  assert.equal(s.phase, 'cancelled');
  assert.deepEqual(s.information, []);
  assert.equal(s.beginApply(vue.token, courante).status, 'error');
  assert.equal(courante.document.text, '');
});

test('P4a : le mode souple marche aussi en Python, et garde la phrase d’origine', () => {
  const courante = cible('');
  const stricte = session(courante, 'Afficher la valeur de age.');
  assert.equal(stricte.diagnose(courante)?.stage, 'translation');
  const souple = session(courante, 'Afficher la valeur de age.', { souple: true });
  assert.equal(souple.diagnose(courante), undefined);
  assert.equal(souple.normalisation.canonique, 'Affiche la valeur de age.');
  const vue = apercu(souple, courante);
  // Le commentaire porte la phrase de l'utilisateur, en syntaxe Python.
  assert.equal(vue.after, '# Afficher la valeur de age.\nprint(age, end="")');
});

test('P4a : une phrase ambiguë reste refusée en Python', () => {
  const courante = cible('');
  const s = session(courante, 'Montre c.', { souple: true });
  const diagnostic = s.diagnose(courante);
  assert.equal(diagnostic?.stage, 'variantes');
  assert.equal(diagnostic.code, 'AMBIGUITE_NON_RESOLUE');
  assert.equal(s.prepare(courante).status, 'error');
});

test('P4a : un bloc sans corps est refusé par le placement, comme Python l’exige', () => {
  const base = 'if x > 0:\n';
  const courante = cible(base);
  const s = session(courante, 'Affiche la valeur de x.');
  const diagnostic = s.diagnose(courante);
  assert.equal(diagnostic?.stage, 'placement');
  assert.equal(diagnostic.code, 'CORPS_ATTENDU');
});

// --------------------------------------------------------------------------
// Lot S5 — la souplesse arbitre AUSSI le catalogue natif
// --------------------------------------------------------------------------
test('S5 Python : une phrase native à l’infinitif est reconnue', () => {
  const courante = cible('');
  // Lacune annoncée au lot P4, et elle ne demandait qu'un paramètre : la
  // couche de variantes ne connaissait que le catalogue partagé.
  const stricte = session(courante, 'Créer une liste vide nommée notes.');
  assert.equal(stricte.diagnose(courante)?.stage, 'translation');
  const souple = session(courante, 'Créer une liste vide nommée notes.', { souple: true });
  assert.equal(souple.diagnose(courante), undefined);
  assert.equal(souple.normalisation.canonique, 'Crée une liste vide nommée notes.');
  const vue = apercu(souple, courante);
  // Le commentaire porte LA PHRASE DE L'UTILISATEUR, en syntaxe Python.
  assert.equal(vue.after, '# Créer une liste vide nommée notes.\nnotes: list = []');
});

test('S5 Python : les informations passives natives survivent à la normalisation', () => {
  const courante = cible('');
  const souple = session(courante, 'Créez une liste vide nommée notes.', { souple: true });
  const codes = souple.information.map(information => information.code);
  assert.ok(codes.includes('PY_LIST_GROWS'), codes.join(', '));
});

test('S5 Python : un refus INSTRUIT remplace le « formulation inconnue »', () => {
  const courante = cible('');
  // « Créer une liste nommée notes. » n'est pas du catalogue partagé ; sa
  // forme canonique est reconnue par le catalogue natif ET refusée, avec une
  // raison précise. C'est cette raison qu'il faut lire.
  const souple = session(courante, 'Créer une liste nommée notes.', { souple: true });
  const diagnostic = souple.diagnose(courante);
  assert.equal(diagnostic?.code, 'MISSING_LIST_CONTENT');
  assert.match(diagnostic.message, /n’en invente ni le contenu ni la taille/u);
  // Et sans le mode souple, le diagnostic reste celui du catalogue partagé.
  const stricte = session(courante, 'Créer une liste nommée notes.');
  assert.equal(stricte.diagnose(courante)?.code, 'UNKNOWN_FORMULATION');
});

test('S5 Python : une intention que Python ne porte PAS n’est pas une lecture valide', () => {
  const courante = cible('');
  // « Déclarer l'entier n. » se reformule en « Déclare un entier nommé n. »,
  // que le catalogue partagé accepte et que Python REFUSE (décision D1). La
  // couche ne doit pas retenir une candidate que le langage refusera.
  const souple = session(courante, 'Déclarer l\'entier n.', { souple: true });
  const diagnostic = souple.diagnose(courante);
  assert.ok(diagnostic !== undefined, 'acceptée alors que Python ne porte pas la déclaration sans valeur');
  assert.equal(courante.document.text, '');
});
