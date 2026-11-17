import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TranslationSession } from '../extension/out/extension/src/session.js';

test('lot 8 warnings are nonblocking, copied and consumed with the preview', () => {
  const current = inMain();
  const source = 'Affecte à r le résultat numérique de "7 / 0 + 5.0 % 2".';
  const session = new TranslationSession(current, source);
  assert.equal(session.diagnose(current), undefined);
  assert.equal(session.advisories.length, 2);
  const preview = prepare(session, current);
  const copy = session.advisories;
  copy[0].range.start = -100;
  copy.pop();
  assert.equal(session.advisories.length, 2);
  assert.ok(session.advisories[0].range.start >= 0);
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  assert.equal(session.reviewReady(preview.token, current), true);
  assert.equal(session.advisories.length, 2);
  assert.equal(session.beginApply(preview.token, current).expectedAfter,
    `${CORPS}// ${source}\nr = ((7 / 0) + (5.0 % 2));\n\n`);
  assert.deepEqual(session.advisories, []);
  session.finishApply(true);
  assert.deepEqual(session.advisories, []);
});

for (const action of ['text', 'edit', 'stale', 'cancel']) {
  test(`lot 8 advisory lifecycle: ${action}`, () => {
    const current = inMain();
    const session = new TranslationSession(current, 'Affecte à r le résultat de "7 / 0".');
    const old = prepare(session, current);
    session.reviewReady(old.token, current);
    if (action === 'text') session.updateText('Affecte à r le résultat de "7 / 2".');
    if (action === 'edit') {
      session.editAgain();
      assert.equal(session.advisories.length, 1); // A fresh editing analysis, not a pending preview.
      session.updateText('Affecte à r le résultat de "a +".');
      assert.equal(session.prepare(current).status, 'error');
    }
    if (action === 'stale') session.observe({ ...current, cursorOffset: 1 });
    if (action === 'cancel') session.cancel();
    assert.deepEqual(session.advisories, []);
    assert.equal(session.beginApply(old.token, current).status, 'error');
    assert.equal(current.document.text, CORPS);
  });
}

for (const eol of ['\n', '\r\n']) {
  test(`lot 8 advisories do not change placement ${JSON.stringify(eol)}`, () => {
    const text = `int main(void) {${eol}    ${eol}}${eol}`;
    const current = target(text, text.indexOf('    ') + 4);
    current.eol = eol;
    const source = 'Affecte à r le résultat de "7 / 0".';
    const session = new TranslationSession(current, source);
    const preview = prepare(session, current);
    assert.equal(preview.after, `int main(void) {${eol}    // ${source}${eol}    r = (7 / 0);${eol}    ${eol}}${eol}`);
    session.reviewReady(preview.token, current);
    assert.equal(session.beginApply(preview.token, current).expectedAfter, preview.after);
  });
}

function target(text = '', cursorOffset = text.length) {
  return { document: { id: 'file:///demo.c', revision: 1, text }, cursorOffset,
    singleCursor: true, indentUnit: '    ', indentSignature: 'true:4', eol: '\n', open: true };
}
const main = 'Crée la fonction principale';
// Lot 26 : une instruction exécutable n'existe que dans le corps d'une
// fonction. Les tests dont le sujet est le CYCLE de la session — refus,
// correction, aperçu, confirmation, avis de calcul — plaçaient leur
// instruction dans un document vide, donc à la portée fichier. Ils utilisent
// désormais cette cible, qui porte l'en-tête écrit par l'auteur ; leur sujet
// est inchangé. Les tests qui ne placent qu'une déclaration ou une définition
// gardent la cible vide. Le refus à la portée fichier est couvert par
// test/statementScope.test.mjs.
const CORPS = 'int main(void) {\n';
const inMain = () => target(CORPS);
function prepare(session, current) {
  const result = session.prepare(current);
  assert.equal(result.status, 'preview', JSON.stringify(result));
  return result.preview;
}

test('première Entrée : aperçu complet sans autorisation d’appliquer', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const original = structuredClone(current);
  const preview = prepare(session, current);
  assert.deepEqual(current, original);
  assert.equal(preview.before, '');
  assert.equal(preview.after, '// Crée la fonction principale\nint main(void) {\n    \n}\n');
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  assert.equal(session.phase, 'preparing');
});

test('seul le plan affiché et prêt est consommé une fois', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const preview = prepare(session, current);
  assert.equal(session.reviewReady(preview.token, current), true);
  const result = session.beginApply(preview.token, current);
  assert.equal(result.status, 'apply');
  const edit = result.plan.edits[0];
  assert.equal(current.document.text.slice(0, edit.range.start) + edit.newText + current.document.text.slice(edit.range.end), preview.after);
  assert.equal(result.expectedAfter, preview.after);
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  session.finishApply(true);
  assert.equal(session.phase, 'done');
});

const changes = [
  ['texte', state => { state.document.text = ' '; }],
  ['révision', state => { state.document.revision++; }],
  ['identité', state => { state.document.id = 'file:///autre.c'; }],
  ['curseur', state => { state.cursorOffset++; }],
  ['sélection', state => { state.singleCursor = false; }],
  ['unité d’indentation', state => { state.indentUnit = '\t'; }],
  ['taille visuelle de tabulation', state => { state.indentSignature = 'false:8'; }],
  ['fin de ligne de l’éditeur', state => { state.eol = '\r\n'; }],
  ['fermeture', state => { state.open = false; }],
];
for (const [name, change] of changes) {
  test(`invalidation stricte : ${name}`, () => {
    const current = target();
    const session = new TranslationSession(current, main);
    const preview = prepare(session, current);
    session.reviewReady(preview.token, current);
    const changed = structuredClone(current);
    change(changed);
    assert.equal(session.beginApply(preview.token, changed).status, 'error');
    assert.equal(session.phase, 'stale');
    assert.equal(session.beginApply(preview.token, current).status, 'error');
    assert.equal(session.draft, main);
    assert.equal(session.prepare(current).diagnostic.code, 'STALE_PREVIEW');
  });
  test(`modification pendant l’ouverture du diff : ${name}`, () => {
    const current = target();
    const session = new TranslationSession(current, main);
    const preview = prepare(session, current);
    const changed = structuredClone(current);
    change(changed);
    session.observe(changed);
    assert.equal(session.reviewReady(preview.token, current), false);
  });
}

for (const phase of ['editing', 'preparing', 'review']) {
  test(`Échap à l’étape ${phase} annule sans autorisation d’édition`, () => {
    const current = target();
    const session = new TranslationSession(current, main);
    let token = 0;
    if (phase !== 'editing') token = prepare(session, current).token;
    if (phase === 'review') session.reviewReady(token, current);
    session.cancel();
    assert.equal(session.phase, 'cancelled');
    assert.equal(session.beginApply(token, current).status, 'error');
    assert.equal(current.document.text, '');
  });
}

test('retour à la saisie invalide le jeton précédent', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const first = prepare(session, current);
  session.reviewReady(first.token, current);
  session.editAgain();
  session.updateText('Déclare un entier nommé Age');
  const second = prepare(session, current);
  assert.equal(session.reviewReady(first.token, current), false);
  assert.equal(session.reviewReady(second.token, current), true);
  assert.equal(session.beginApply(first.token, current).status, 'error');
  const confirmed = session.beginApply(second.token, current);
  assert.equal(confirmed.status, 'apply');
  assert.ok(confirmed.expectedAfter.includes('int Age;'));
  assert.ok(!confirmed.expectedAfter.includes('main'));
});

test('nouvelle phrase pendant la préparation : l’ancien retour asynchrone reste inactif', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const preview = prepare(session, current);
  session.updateText('Affecte la valeur 2 à absent');
  assert.equal(session.reviewReady(preview.token, current), false);
  assert.equal(session.beginApply(preview.token, current).status, 'error');
});

test('traduction et placement ont des diagnostics séparés en français', () => {
  const translation = new TranslationSession(target(), 'Déclare un entier nommé int.').prepare(target());
  assert.equal(translation.diagnostic.stage, 'translation');
  assert.equal(translation.diagnostic.code, 'C_KEYWORD_IDENTIFIER');
  assert.deepEqual(translation.diagnostic.range, { start: 24, end: 27 });
  const state = target('int x;');
  const placement = new TranslationSession(state, main).prepare(state);
  assert.equal(placement.diagnostic.stage, 'placement');
  assert.equal(placement.diagnostic.code, 'TARGET_LINE_NOT_BLANK');
  assert.equal(state.document.text, 'int x;');
});

test('le brouillon non enregistré est la source de l’aperçu', () => {
  const current = target('// é😀 non enregistré\r\n');
  const preview = prepare(new TranslationSession(current, main), current);
  assert.equal(preview.before, current.document.text);
  assert.ok(preview.after.startsWith(current.document.text));
  assert.ok(preview.after.includes('\r\nint main(void)'));
});

test('une erreur C ne devient pas un refus de l’interface', () => {
  // Lot 26 : l'affectation exige un corps de fonction, fourni ici par
  // l'auteur. Le sujet du test reste entier : « absent » n'est déclaré nulle
  // part, C-A ne vérifie aucun symbole, et l'aperçu est produit sans que
  // l'interface transforme cette erreur C en refus.
  const current = inMain();
  const preview = prepare(new TranslationSession(current, 'Affecte la valeur 42 à absent'), current);
  assert.ok(preview.after.includes('absent = 42;'));
  assert.ok(!preview.after.includes('#include'));
  // Aucun main inventé : le seul présent est celui que l'auteur a écrit.
  assert.equal(preview.after.split('int main(void) {').length - 1, 1);
});

test('un échec d’édition exige un nouvel aperçu et conserve la phrase', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const first = prepare(session, current);
  session.reviewReady(first.token, current);
  session.beginApply(first.token, current);
  session.finishApply(false);
  assert.equal(session.draft, main);
  assert.equal(session.beginApply(first.token, current).status, 'error');
  assert.notEqual(prepare(session, current).token, first.token);
});

test('modification puis retour à l’état initial : l’aperçu reste invalidé', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const first = prepare(session, current);
  session.observe({ ...current, cursorOffset: 1 });
  session.observe(current);
  assert.equal(session.reviewReady(first.token, current), false);
});

test('session terminée : ni changement de phrase ni confirmation supplémentaire', () => {
  const current = target();
  const session = new TranslationSession(current, main);
  const first = prepare(session, current);
  session.reviewReady(first.token, current);
  session.beginApply(first.token, current);
  session.updateText('autre');
  session.cancel();
  assert.equal(session.phase, 'applying');
  assert.equal(session.draft, main);
  session.finishApply(true);
  session.updateText('autre');
  assert.equal(session.draft, main);
});

test('trois sessions successives réutilisent le curseur calculé', () => {
  let current = target();
  for (const phrase of [main, 'Déclare un entier nommé age', 'Affecte la valeur 25 à age']) {
    const session = new TranslationSession(current, phrase);
    const preview = prepare(session, current);
    session.reviewReady(preview.token, current);
    const result = session.beginApply(preview.token, current);
    current = { ...current, cursorOffset: result.plan.cursorAfter,
      document: { ...current.document, revision: current.document.revision + 1, text: result.expectedAfter } };
    session.finishApply(true);
  }
  assert.equal(current.document.text, '// Crée la fonction principale\nint main(void) {\n    // Déclare un entier nommé age\n    int age;\n    // Affecte la valeur 25 à age\n    age = 25;\n    \n}\n');
});

test('manifeste : raccourci limité au C éditable, aucune exécution externe', () => {
  const manifest = JSON.parse(readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8'));
  const binding = manifest.contributes.keybindings[0];
  assert.equal(binding.key, 'ctrl+k a');
  assert.equal(binding.mac, 'cmd+k a');
  assert.ok(binding.when.includes('editorTextFocus') && binding.when.includes('!editorReadonly'));
  assert.ok(binding.when.includes('resourceScheme == file') && binding.when.includes('resourceExtname == .c'));
  // Adapte au lot S4 : une seconde commande existe, « c-a.souplesse », qui
  // ne fait que basculer un reglage. Elle n'a VOLONTAIREMENT aucun raccourci :
  // changer de mode ne doit pas pouvoir arriver par une frappe.
  assert.equal(manifest.contributes.commands.length, 2);
  assert.equal(manifest.contributes.commands[0].command, binding.command);
  assert.equal(manifest.contributes.commands[1].command, 'c-a.souplesse');
  assert.equal(manifest.contributes.keybindings.length, 1);
  // Le mode souple est ACTIF par defaut depuis la 0.5.0, apres validation
  // finale ; le mode strict reste accessible, et un test dedie le verifie plus
  // bas. Ce test-ci ne porte que sur le raccourci et l'absence d'execution
  // externe : son sujet est inchange.
  assert.equal(typeof manifest.contributes.configuration.properties['c-a.souplesse'].default, 'boolean');
  assert.equal(manifest.browser, undefined);
});

for (const source of ['Affiche age.', 'Affiche age en.', 'Affiche en décimal.', 'Affiche age en binaire.']) {
  test(`lot 5 aucun aperçu ni insertion : ${source}`, () => {
    const current = inMain();
    const session = new TranslationSession(current, source);
    const result = session.prepare(current);
    assert.equal(result.status, 'error');
    assert.equal(result.diagnostic.stage, 'translation');
    assert.equal(session.phase, 'editing');
    assert.equal(session.reviewReady(1, current), false);
    assert.equal(session.beginApply(1, current).status, 'error');
    assert.equal(current.document.text, CORPS);
    session.updateText('Affiche age en hexadécimal.');
    const preview = prepare(session, current);
    assert.equal(session.beginApply(preview.token, current).status, 'error');
    assert.equal(session.reviewReady(preview.token, current), true);
    assert.equal(session.beginApply(preview.token, current).expectedAfter, CORPS + '// Affiche age en hexadécimal.\nprintf("%x", age);\n\n');
  });
}
test('lot 5 une instruction incomplète invalide aussi un aperçu précédent', () => {
  const current = inMain();
  const session = new TranslationSession(current, 'Affiche age en octal.');
  const preview = prepare(session, current);
  session.reviewReady(preview.token, current);
  session.editAgain();
  session.updateText('Affiche age.');
  assert.equal(session.prepare(current).diagnostic.code, 'MISSING_DISPLAY_FORMAT');
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  assert.equal(session.reviewReady(preview.token, current), false);
  assert.equal(current.document.text, CORPS);
});

for (const source of ['Affecte à r le résultat de "a +".', 'Affecte à r le résultat de "".',
  'Affecte à r le résultat de "(a + b".', 'Affecte à r le résultat de "a + 😀".',
  'Affecte à r le résultat de "' + '('.repeat(65) + 'a' + ')'.repeat(65) + '".']) {
  test(`lot 6 refus, correction et confirmation : ${source.slice(0, 80)}`, () => {
    const current = inMain();
    const session = new TranslationSession(current, source);
    assert.equal(session.prepare(current).status, 'error');
    assert.equal(session.phase, 'editing');
    assert.equal(session.reviewReady(1, current), false);
    assert.equal(session.beginApply(1, current).status, 'error');
    assert.equal(current.document.text, CORPS);
    session.updateText('Affecte à r le résultat de "a * -b".');
    const preview = prepare(session, current);
    assert.equal(session.beginApply(preview.token, current).status, 'error');
    assert.equal(session.reviewReady(preview.token, current), true);
    assert.equal(session.beginApply(preview.token, current).expectedAfter,
      CORPS + '// Affecte à r le résultat de "a * -b".\nr = (a * (-b));\n\n');
  });
}
test('lot 6 une expression incomplète invalide un ancien aperçu', () => {
  const current = inMain();
  const session = new TranslationSession(current, 'Affecte à r le résultat de "-a".');
  const preview = prepare(session, current);
  assert.equal(session.reviewReady(preview.token, current), true);
  session.updateText('Affecte à r le résultat de "a +".');
  assert.equal(session.prepare(current).diagnostic.code, 'MISSING_OPERAND');
  assert.equal(session.reviewReady(preview.token, current), false);
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  assert.equal(current.document.text, CORPS);
});

for (const source of ['Déclare une variable de type.', 'Crée une variable de type float nommée f avec le résultat de "".',
  'Affecte à q le résultat numérique de "(double)".', 'Affiche f en notation fixe.',
  'Affiche f en notation fixe avec 21 décimales.']) {
  test(`lot 7 refus, correction, aperçu et confirmation : ${source}`, () => {
    const current = inMain();
    const session = new TranslationSession(current, source);
    assert.equal(session.prepare(current).status, 'error');
    assert.equal(session.reviewReady(1, current), false);
    assert.equal(session.beginApply(1, current).status, 'error');
    assert.equal(current.document.text, CORPS);
    session.updateText('Affecte à q le résultat numérique de "(double) 7 / 2".');
    const preview = prepare(session, current);
    assert.equal(session.beginApply(preview.token, current).status, 'error');
    assert.equal(session.reviewReady(preview.token, current), true);
    assert.equal(session.beginApply(preview.token, current).expectedAfter,
      CORPS + '// Affecte à q le résultat numérique de "(double) 7 / 2".\nq = (((double) 7) / 2);\n\n');
  });
}
test('lot 7 changer une précision invalide le jeton précédent', () => {
  const current = inMain();
  const session = new TranslationSession(current, 'Affiche f en notation fixe avec 3 décimales.');
  const preview = prepare(session, current);
  assert.equal(session.reviewReady(preview.token, current), true);
  session.updateText('Affiche f en notation fixe.');
  assert.equal(session.prepare(current).diagnostic.code, 'MISSING_DISPLAY_PRECISION');
  assert.equal(session.reviewReady(preview.token, current), false);
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  assert.equal(current.document.text, CORPS);
});

test('v0.5.0 : les deux modes sont actifs par defaut, et chacun reste desactivable', () => {
  // Le fondateur a demande de preparer le francais souple comme mode par
  // defaut apres validation finale, en gardant le mode strict accessible.
  // La preparation est une constante et un reglage, et ce test exige que les
  // deux disent la MEME chose — sinon la bascule en oublierait une.
  const manifest = JSON.parse(readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8'));
  const reglage = manifest.contributes.configuration.properties['c-a.souplesse'];
  // Bascule FAITE le 17 novembre 2026, apres validation finale. Ce qui reste
  // verifie est l'essentiel : que les deux endroits disent la meme chose, et
  // que le mode strict soit annonce comme accessible.
  assert.equal(reglage.default, true);
  const source = readFileSync(new URL('../extension/src/extension.ts', import.meta.url), 'utf8');
  const constante = /export const SOUPLESSE_PAR_DEFAUT = (true|false);/u.exec(source);
  assert.ok(constante, 'la constante de bascule a disparu');
  assert.equal(constante[1], String(reglage.default),
    'la constante et le reglage ne disent pas la meme chose : la bascule en oublierait un');
  // Le reglage dit comment REVENIR au mode strict : sans cette phrase, la
  // bascule enleverait un choix sans le dire.
  assert.match(reglage.description, /mode strict/iu);
  assert.match(reglage.description, /false/u);
  // Python aussi : meme exigence, meme raison.
  const python = manifest.contributes.configuration.properties['c-a.python'];
  assert.equal(python.default, true);
  const constantePython = /export const PYTHON_PAR_DEFAUT = (true|false);/u.exec(source);
  assert.ok(constantePython, 'la constante Python a disparu');
  assert.equal(constantePython[1], String(python.default));
  assert.match(python.description, /false/u);
  // Et la commande de bascule nomme les DEUX modes.
  const bascule = manifest.contributes.commands.find(commande => commande.command === 'c-a.souplesse');
  assert.match(bascule.title, /strict/iu);
  assert.match(bascule.title, /souple/iu);
});
