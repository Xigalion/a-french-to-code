import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JavaTranslationSession } from '../extension/out/extension/src/sessionJava.js';

// `extension.ts` importe `vscode` et n'est pas chargeable ici : le DEFAUT du
// manifeste est donc lu dans le manifeste, qui est ce que l'utilisateur
// recoit. Le scenario hote verifie l'autre moitie — que le code et le
// manifeste disent la meme chose.
const MANIFESTE = JSON.parse(
  readFileSync(new URL('../extension/package.json', import.meta.url), 'utf8'));

// Lots J9 et J10 — la session Java, et le francais souple.
//
// Ce que les tests doivent etablir :
//   1. le parcours complet : saisie, apercu, confirmation, insertion ;
//   2. le commentaire conserve LA PHRASE DE L UTILISATEUR, pas celle que A a
//      lue — c'est la regle 2, et la couche de variantes la met a l'epreuve ;
//   3. le mode strict est INTACT : sans l'option, aucune reformulation ;
//   4. une phrase ambigue est refusee avec ses lectures nommees ;
//   5. une reformulation n'invente jamais une information absente ;
//   6. la classe englobante est lue du document, et le constructeur la prend.

const CLASSE = 'public class Eleve {\n\n}\n';

function cible(texte, decalage, unite = '    ') {
  return {
    document: { id: 'file:///Eleve.java', revision: 1, text: texte },
    cursorOffset: decalage, singleCursor: true,
    indentUnit: unite, indentSignature: unite + '|4', open: true, eol: '\n',
  };
}

/** Le parcours complet, jusqu'au document resultant. */
function dicter(texte, decalage, phrase, options = {}) {
  const target = cible(texte, decalage);
  const session = new JavaTranslationSession(target, '', options);
  session.updateText(phrase);
  const diagnostic = session.diagnose(target);
  if (diagnostic !== undefined) return { diagnostic, session };
  const apercu = session.prepare(target);
  assert.equal(apercu.status, 'preview', JSON.stringify(apercu));
  assert.ok(session.reviewReady(apercu.preview.token, target));
  const applique = session.beginApply(apercu.preview.token, target);
  assert.equal(applique.status, 'apply', JSON.stringify(applique));
  session.finishApply(true);
  return { apres: applique.expectedAfter, plan: applique.plan, session, apercu: apercu.preview };
}

test('J10 : le parcours complet insere dans un corps de classe', () => {
  const { apres, session } = dicter(CLASSE, CLASSE.indexOf('\n\n') + 1,
    'Crée la fonction principale.');
  assert.equal(apres,
    'public class Eleve {\n'
    + '    // Crée la fonction principale.\n'
    + '    public static void main(String[] args) {\n'
    + '        \n'
    + '    }\n'
    + '}\n');
  assert.equal(session.phase, 'done');
  assert.equal(session.langage, 'java');
});

test('J10 : la classe englobante est LUE du document, et montree', () => {
  const target = cible(CLASSE, CLASSE.indexOf('\n\n') + 1);
  const session = new JavaTranslationSession(target);
  assert.equal(session.attachmentLabel, 'classe Eleve');
  const auFichier = new JavaTranslationSession(cible('\n', 0));
  assert.equal(auFichier.attachmentLabel, undefined);
});

test('J10 : un constructeur prend le nom de sa classe, sans qu on le lui dise', () => {
  const { apres } = dicter(CLASSE, CLASSE.indexOf('\n\n') + 1,
    'Crée un constructeur qui prend un int nommé age.');
  assert.ok(apres.includes('public Eleve(int age) {'), apres);
  // Hors d une classe, le refus est nomme et rien n est insere.
  const { diagnostic } = dicter('\n', 0, 'Crée un constructeur qui ne prend rien.');
  assert.notEqual(diagnostic, undefined);
  // C'est le RENDU qui refuse, et avant le placement : la session resout la
  // phrase d'abord. Et c'est le bon ordre ici, parce que le message du rendu
  // est le plus instructif des deux — « un constructeur porte le nom de sa
  // classe » apprend plus que « cette instruction exige un corps de classe ».
  assert.equal(diagnostic.stage, 'rendu');
  assert.equal(diagnostic.code, 'CONSTRUCTION_NON_PORTEE');
  assert.ok(diagnostic.message.includes('nom de sa classe'), diagnostic.message);
});

test('J10 : rien d executable a la portee fichier, meme par la session', () => {
  const { diagnostic } = dicter('\n', 0, 'Affiche la valeur de n.');
  assert.notEqual(diagnostic, undefined);
  assert.equal(diagnostic.code, 'PORTEE_INTERDITE');
  assert.ok(diagnostic.message.includes('portée fichier'));
});

test('J10 : les informations passives sont montrees, et pas les avis de C17', () => {
  const target = cible(CLASSE, CLASSE.indexOf('\n\n') + 1);
  const session = new JavaTranslationSession(target);
  session.updateText('Ajoute un champ privé de type int nommé age.');
  const codes = session.information.map(i => i.code);
  assert.ok(codes.includes('JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'), codes.join(', '));
  // Aucun avis de calcul : les informations de Java-A les disent, dans ses
  // propres termes. Deux canaux qui disent la meme chose en seraient un de
  // trop.
  assert.deepEqual(session.advisories, []);
});

test('J9 : le mode strict est INTACT — aucune reformulation sans l option', () => {
  const stricte = dicter(CLASSE, CLASSE.indexOf('\n\n') + 1, 'Créer un constructeur qui ne prend rien.');
  assert.notEqual(stricte.diagnostic, undefined, 'le mode strict a accepte une reformulation');
  const souple = dicter(CLASSE, CLASSE.indexOf('\n\n') + 1,
    'Créer un constructeur qui ne prend rien.', { souple: true });
  assert.equal(souple.diagnostic, undefined, JSON.stringify(souple.diagnostic));
  assert.ok(souple.apres.includes('public Eleve() {'), souple.apres);
});

test('J9 : le commentaire conserve LA PHRASE DE L UTILISATEUR', () => {
  // Regle 2, et c est la couche de variantes qui la met a l epreuve : le
  // commentaire doit porter ce qui a ete tape, pas la phrase canonique que A
  // a reconnue.
  const phrase = 'Créer un constructeur qui ne prend rien.';
  const { apres, plan } = dicter(CLASSE, CLASSE.indexOf('\n\n') + 1, phrase, { souple: true });
  assert.ok(apres.includes('// ' + phrase), apres);
  assert.ok(!apres.includes('// Crée un constructeur'), 'la phrase canonique a remplace la votre');
  assert.equal(plan.source.text, phrase);
});

test('J9 : la normalisation est montree, avec la phrase canonique', () => {
  const target = cible(CLASSE, CLASSE.indexOf('\n\n') + 1);
  const session = new JavaTranslationSession(target, '', { souple: true });
  session.updateText('Créer un constructeur qui ne prend rien.');
  const normalisation = session.normalisation;
  assert.notEqual(normalisation, undefined);
  assert.equal(normalisation.source, 'Créer un constructeur qui ne prend rien.');
  assert.ok(normalisation.canonique.startsWith('Crée un constructeur'), normalisation.canonique);
});

test('J9 : une reformulation n invente aucune information absente', () => {
  // « Augmente compteur. » ne dit pas le pas. Ni le mode strict ni le mode
  // souple ne doivent le deviner.
  const methode = 'public class E {\n    static void f() {\n\n    }\n}\n';
  const curseur = methode.indexOf('{\n\n', methode.indexOf('f()')) + 2;
  for (const options of [{}, { souple: true }]) {
    const { diagnostic } = dicter(methode, curseur, 'Augmente compteur.', options);
    assert.notEqual(diagnostic, undefined, 'le pas a ete devine, souple=' + (options.souple === true));
    assert.equal(diagnostic.code, 'MISSING_STEP');
  }
  // Et « Incrémente compteur. », qui porte son pas, passe dans les deux modes.
  for (const options of [{}, { souple: true }]) {
    const { apres, diagnostic } = dicter(methode, curseur, 'Incrémente compteur.', options);
    assert.equal(diagnostic, undefined, JSON.stringify(diagnostic));
    assert.ok(apres.includes('compteur += 1;'), apres);
  }
});

test('J9 : une candidate que Java refuse n est pas retenue par la couche', () => {
  // L arbitre doit ecarter une lecture que le langage rejettera : sinon la
  // couche proposerait une phrase qui echoue a l etape suivante.
  const methode = 'public class E {\n    static void f() {\n\n    }\n}\n';
  const curseur = methode.indexOf('{\n\n', methode.indexOf('f()')) + 2;
  const { diagnostic } = dicter(methode, curseur, 'Libérer la mémoire pointée par p.', { souple: true });
  assert.notEqual(diagnostic, undefined, 'Java a accepte une liberation de memoire');
});

test('J10 : la tabulation est acceptee — Java l autorise', () => {
  const texte = 'public class E {\n\tstatic void f() {\n\n\t}\n}\n';
  const target = cible(texte, texte.indexOf('{\n\n', texte.indexOf('f()')) + 2, '\t');
  const session = new JavaTranslationSession(target);
  session.updateText('Affiche la valeur de n.');
  assert.equal(session.diagnose(target), undefined);
  const apercu = session.prepare(target);
  assert.equal(apercu.status, 'preview');
  assert.ok(apercu.preview.after.includes('\t\tSystem.out.print(n);'), JSON.stringify(apercu.preview.after));
});

test('J10 : un apercu perime est refuse, et rien n est insere', () => {
  const target = cible(CLASSE, CLASSE.indexOf('\n\n') + 1);
  const session = new JavaTranslationSession(target);
  session.updateText('Affiche la valeur de n.');
  const bouge = { ...target, document: { ...target.document, revision: 2 } };
  const diagnostic = session.diagnose(bouge);
  assert.notEqual(diagnostic, undefined);
  assert.equal(diagnostic.code, 'STALE_PREVIEW');
});

test('J10 : l annulation ne laisse rien derriere elle', () => {
  const target = cible(CLASSE, CLASSE.indexOf('\n\n') + 1);
  const session = new JavaTranslationSession(target);
  session.updateText('Crée la fonction principale.');
  const apercu = session.prepare(target);
  assert.equal(apercu.status, 'preview');
  session.cancel();
  assert.equal(session.phase, 'cancelled');
  const apres = session.beginApply(apercu.preview.token, target);
  assert.equal(apres.status, 'error');
});

test('J10 : Java est actif par defaut dans le manifeste, et le reglage existe', () => {
  const reglage = MANIFESTE.contributes.configuration.properties['c-a.java'];
  assert.notEqual(reglage, undefined, 'le reglage c-a.java est absent du manifeste');
  assert.equal(reglage.default, true);
  assert.equal(reglage.type, 'boolean');
  // Et la description annonce la limite, comme celles des deux autres.
  assert.ok(reglage.markdownDescription.includes('visibilité'), reglage.markdownDescription);
});
