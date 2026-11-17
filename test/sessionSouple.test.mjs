// Lot S4 — la couche de variantes DANS la session de l'hôte.
//
// Ce que ces tests mesurent est exactement ce que le fondateur a demandé de
// vérifier : insertion, diagnostics, annulation, conservation du commentaire
// d'origine, refus ambigus. Et une propriété qui n'est pas négociable : le
// mode strict, par défaut, reste bit pour bit ce qu'il était.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TranslationSession } from '../extension/out/extension/src/session.js';
import { translate } from '../src/translate.ts';

function target(text = '', cursorOffset = text.length) {
  return { document: { id: 'file:///demo.c', revision: 1, text }, cursorOffset,
    singleCursor: true, indentUnit: '    ', indentSignature: 'true:4', eol: '\n', open: true };
}
const CORPS = 'int main(void) {\n';
const inMain = () => target(CORPS);
const souple = (current, draft) => new TranslationSession(current, draft, { souple: true });

test('souplesse hôte : désactivée par défaut, une variante reste refusée', () => {
  const current = inMain();
  const stricte = new TranslationSession(current, 'Afficher la valeur de age.');
  const diagnostic = stricte.diagnose(current);
  assert.equal(diagnostic?.stage, 'translation');
  assert.equal(stricte.flexible, false);
  assert.equal(stricte.normalisation, undefined);
  assert.equal(stricte.prepare(current).status, 'error');
  // Et le même diagnostic, mot pour mot, que sans la couche.
  assert.equal(diagnostic.message, translate('Afficher la valeur de age.').diagnostics[0].message);
});

test('souplesse hôte : activée, la variante traverse et s’insère', () => {
  const current = inMain();
  const session = souple(current, 'Afficher la valeur de age.');
  assert.equal(session.diagnose(current), undefined);
  assert.deepEqual(session.normalisation,
    { source: 'Afficher la valeur de age.', canonique: 'Affiche la valeur de age.', lectures: 1 });
  const preview = session.prepare(current).preview;
  // LE POINT : le commentaire porte la phrase de L'UTILISATEUR, pas la
  // phrase canonique. Règle 2, et la couche ne doit pas la réécrire.
  assert.equal(preview.after,
    `${CORPS}// Afficher la valeur de age.\nprintf("%d", age);\n\n`);
  assert.equal(session.reviewReady(preview.token, current), true);
  const applied = session.beginApply(preview.token, current);
  assert.equal(applied.status, 'apply');
  assert.equal(applied.expectedAfter, preview.after);
  // Le plan garde la trace de la phrase d'origine, pour que la revérification
  // de fraîcheur reconstruise le MÊME commentaire.
  assert.equal(applied.plan.originalSentence, 'Afficher la valeur de age.');
  assert.equal(applied.plan.source.text, 'Affiche la valeur de age.');
  session.finishApply(true);
});

test('souplesse hôte : le mode strict ne traverse jamais la couche', () => {
  const current = inMain();
  const session = souple(current, 'Affiche la valeur de age.');
  assert.equal(session.diagnose(current), undefined);
  // Aucune normalisation : la phrase est du catalogue, la couche n'a rien fait.
  assert.equal(session.normalisation, undefined);
  const preview = session.prepare(current).preview;
  assert.equal(preview.after,
    `${CORPS}// Affiche la valeur de age.\nprintf("%d", age);\n\n`);
  const temoin = new TranslationSession(current, 'Affiche la valeur de age.');
  assert.equal(temoin.prepare(current).preview.after, preview.after);
});

test('souplesse hôte : une ambiguïté est refusée, et les deux lectures nommées', () => {
  const current = inMain();
  const session = souple(current, 'Montre c.');
  const diagnostic = session.diagnose(current);
  assert.equal(diagnostic?.stage, 'variantes');
  assert.equal(diagnostic.code, 'AMBIGUITE_NON_RESOLUE');
  assert.match(diagnostic.message, /PRINT_INT/u);
  assert.match(diagnostic.message, /PRINT_CHAR/u);
  // Refus explicite : aucun aperçu, donc aucune insertion possible.
  assert.equal(session.prepare(current).status, 'error');
  assert.equal(session.normalisation, undefined);
  assert.equal(current.document.text, CORPS);
});

test('souplesse hôte : une information manquante le reste, diagnostic strict conservé', () => {
  const current = target();
  const session = souple(current, 'Créer un entier appelé age.');
  const diagnostic = session.diagnose(current);
  assert.equal(diagnostic?.stage, 'translation');
  // Aucune valeur inventée nulle part dans le message.
  assert.ok(!/\b0\b/u.test(diagnostic.message), diagnostic.message);
  assert.equal(session.prepare(current).status, 'error');
});

test('souplesse hôte : annulation après aperçu normalisé, document intact', () => {
  const current = inMain();
  const session = souple(current, 'Afficher la valeur de age.');
  const preview = session.prepare(current).preview;
  session.reviewReady(preview.token, current);
  session.cancel();
  assert.equal(session.phase, 'cancelled');
  assert.equal(session.normalisation, undefined);
  assert.equal(session.beginApply(preview.token, current).status, 'error');
  assert.equal(current.document.text, CORPS);
});

test('souplesse hôte : une modification de phrase abandonne la normalisation', () => {
  const current = inMain();
  const session = souple(current, 'Afficher la valeur de age.');
  const preview = session.prepare(current).preview;
  session.reviewReady(preview.token, current);
  session.updateText('Montre c.');
  assert.equal(session.phase, 'editing');
  assert.equal(session.normalisation, undefined);
  assert.equal(session.diagnose(current)?.stage, 'variantes');
  assert.equal(session.beginApply(preview.token, current).status, 'error');
});

test('souplesse hôte : le placement refuse la variante comme il refuse la stricte', () => {
  // Portée fichier, lot 26 : l'affichage n'y est pas plaçable. La couche de
  // variantes ne doit RIEN assouplir du placement.
  const current = target();
  const session = souple(current, 'Afficher la valeur de age.');
  const diagnostic = session.diagnose(current);
  assert.equal(diagnostic?.stage, 'placement');
  assert.equal(diagnostic.code, 'STATEMENT_AT_FILE_SCOPE');
});

test('souplesse hôte : les informations pédagogiques décrivent le C réellement écrit', () => {
  const current = inMain();
  const session = souple(current, 'Afficher la valeur de age.');
  const temoin = new TranslationSession(inMain(), 'Affiche la valeur de age.');
  assert.deepEqual(session.information.map(info => info.code), temoin.information.map(info => info.code));
});
