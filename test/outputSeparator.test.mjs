import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { STATEMENT_KINDS } from '../src/statementScope.ts';

// Lot 29 — séparateurs d'affichage. Décision 5 du fondateur du 15 novembre
// 2026 : « Propose une solution pédagogique explicite, sans ajouter
// automatiquement des espaces ou des retours à la ligne que l'utilisateur
// n'a pas demandés. »
//
// Le problème a été trouvé par l'exercice intégrateur, dont onze printf
// successifs produisaient une seule suite de chiffres illisible, sans que
// C-A dise un mot.

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', source + ' : ' + JSON.stringify(result));
  assert.deepEqual(result, translate(source));
  return result;
}
function codes(source) {
  return explainInstruction(translated(source)).map(entry => entry.code);
}

// ---------------------------------------------------------------------------
// 1. La capacité existait déjà — c'est le fait qui a décidé du lot
// ---------------------------------------------------------------------------

test('lot 29 : un retour à la ligne était déjà écrivable avant ce lot', () => {
  // Rien n'était bloqué : la grammaire du texte du lot 16 accepte les
  // échappements. Le lot ne débloque donc aucune capacité ; il rend celle-ci
  // trouvable et il l'explique.
  assert.equal(translated('Affiche le texte "\\n".').fragments[0].code, 'printf("%s", "\\n");\n');
  assert.equal(translated('Affiche le texte " ".').fragments[0].code, 'printf("%s", " ");\n');
  assert.equal(translated('Affiche le texte "\\t".').fragments[0].code, 'printf("%s", "\\t");\n');
});

test('lot 29 : un texte de l’auteur n’est jamais une chaîne de format', () => {
  // Propriété de sûreté du lot 4, vérifiée ici parce qu'elle explique
  // pourquoi tout affichage de texte passe par « %s » — et pourquoi le
  // nouveau printf("\n") peut s'en passer.
  assert.equal(translated('Affiche le texte "age = %d".').fragments[0].code, 'printf("%s", "age = %d");\n');
  assert.equal(translated('Affiche le texte "%n%s".').fragments[0].code, 'printf("%s", "%n%s");\n');
});

// ---------------------------------------------------------------------------
// 2. La formulation explicite
// ---------------------------------------------------------------------------

test('lot 29 : Affiche un retour à la ligne.', () => {
  const result = translated('Affiche un retour à la ligne.');
  assert.equal(result.instruction.kind, 'PRINT_NEWLINE');
  assert.deepEqual(result.instruction.parameters, {});
  assert.equal(result.fragments[0].code, 'printf("\\n");\n');
  assert.equal(result.fragments[0].comment, '// Affiche un retour à la ligne.');
  assert.equal(result.fragments[0].text, '// Affiche un retour à la ligne.\nprintf("\\n");\n');
});

test('lot 29 : la phrase tolère la ponctuation et les espaces comme les autres', () => {
  for (const source of ['Affiche un retour à la ligne.', 'Affiche un retour à la ligne',
    '  Affiche un retour à la ligne.  ', 'Affiche\tun\tretour\tà\tla\tligne.',
    'affiche un retour à la ligne.', 'AFFICHE UN RETOUR À LA LIGNE.']) {
    assert.equal(translate(source).instruction.kind, 'PRINT_NEWLINE', source);
  }
});

test('lot 29 : les variantes approchantes restent refusées', () => {
  // Palier 1 : la formulation est précise, et aucune approximation n'est
  // devinée. « Passe à la ligne. » en particulier reste hors catalogue, pour
  // ne pas se confondre avec « Passe à l'itération suivante… ».
  for (const source of ['Passe à la ligne.', 'Affiche un retour à la ligne maintenant.',
    'Affiche un retour.', 'Affiche la ligne.', 'Affiche un saut de ligne.',
    'Affiche deux retours à la ligne.', 'Affiche un retour à la ligne et un espace.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('lot 29 : la table figée du lot 4 n’est pas touchée', () => {
  // La phrase est reconnue avant la tokenisation, comme « Affiche le
  // texte », donc ni la table de règles du lot 4 ni ses instantanés ne
  // voient quoi que ce soit de nouveau. Le voisinage lexical le prouve.
  assert.equal(translate('Passe à l’itération suivante de la boucle la plus intérieure.').instruction.kind, 'CONTINUE');
  assert.equal(translate('Affiche la valeur de age.').instruction.kind, 'PRINT_INT');
  assert.equal(translate('Affiche le texte "x".').instruction.kind, 'PRINT_TEXT');
});

test('lot 29 : un retour à la ligne est une instruction, donc hors portée fichier', () => {
  assert.ok(STATEMENT_KINDS.includes('PRINT_NEWLINE'));
  const refused = planPlacement({ document: { id: 'x.c', revision: 0, text: '' }, cursorOffset: 0,
    translation: translated('Affiche un retour à la ligne.') });
  assert.equal(refused.status, 'rejected');
  assert.equal(refused.diagnostics[0].code, 'STATEMENT_AT_FILE_SCOPE');
  const head = 'int main(void) {\n';
  const planned = planPlacement({ document: { id: 'x.c', revision: 0, text: head }, cursorOffset: head.length,
    translation: translated('Affiche un retour à la ligne.') });
  assert.equal(planned.status, 'planned', JSON.stringify(planned));
});

// ---------------------------------------------------------------------------
// 3. L'information : émise là où elle apprend quelque chose, et nulle part ailleurs
// ---------------------------------------------------------------------------

for (const source of [
  'Affiche la valeur de age.',
  'Affiche age en hexadécimal.',
  'Affiche le caractère c.',
  'Affiche la chaîne s.',
  'Affiche la valeur pointée par p.',
  'Affiche l’élément "i" de t.',
  'Affiche le caractère de l’élément "i" de s.',
  'Affiche la taille du type int.',
  'Affiche le champ note de e.',
  'Affiche f en notation fixe avec 2 décimales.',
]) {
  test(`lot 29 information émise : ${source}`, () => {
    const entries = explainInstruction(translated(source));
    const separator = entries.filter(entry => entry.code === 'OUTPUT_HAS_NO_SEPARATOR');
    assert.equal(separator.length, 1, source);
    assert.equal(separator[0].severity, 'information');
    // Elle vient en dernier : les informations propres à l'intention d'abord.
    assert.equal(entries.at(-1).code, 'OUTPUT_HAS_NO_SEPARATOR');
  });
}

test('lot 29 : aucune information quand l’auteur a déjà écrit un séparateur', () => {
  // Le dire quand même apprendrait à ignorer le canal de pédagogie.
  for (const text of ['\\n', ' ', '\\t', 'Total : ', 'ligne\\n']) {
    assert.deepEqual(codes(`Affiche le texte "${text}".`), [], text);
  }
});

test('lot 29 : information sur un texte qui ne finit pas par un séparateur', () => {
  assert.deepEqual(codes('Affiche le texte "age = %d".'), ['OUTPUT_HAS_NO_SEPARATOR']);
  assert.deepEqual(codes('Affiche le texte "Total".'), ['OUTPUT_HAS_NO_SEPARATOR']);
  assert.deepEqual(codes('Affiche le texte "".'), ['OUTPUT_HAS_NO_SEPARATOR']);
});

test('lot 29 : aucune information sur le retour à la ligne lui-même', () => {
  // Il EST le séparateur ; l'avertir serait absurde.
  assert.deepEqual(codes('Affiche un retour à la ligne.'), []);
});

test('lot 29 : rien n’est ajouté aux instructions qui n’affichent pas', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affecte la valeur 5 à x.',
    'Inclue la bibliothèque stdio.h.', 'Crée la fonction principale.',
    'Retourne la valeur 0.', 'Crée un bloc si "a".']) {
    assert.ok(!codes(source).includes('OUTPUT_HAS_NO_SEPARATOR'), source);
  }
});

test('lot 29 : le message explique, et n’est jamais un avertissement', () => {
  const entry = explainInstruction(translated('Affiche la valeur de age.')).at(-1);
  assert.equal(entry.severity, 'information');
  assert.match(entry.message, /ni espace, ni retour à la ligne/u);
  assert.match(entry.message, /se collent donc l’un à l’autre/u);
  assert.match(entry.message, /C-A n’ajoutera jamais de lui-même/u);
  assert.ok(!/avertissement/iu.test(entry.message));
  // Diagnostic ≠ correction : aucune phrase à recopier.
  assert.ok(!/Affiche un retour à la ligne/u.test(entry.message));
});

// ---------------------------------------------------------------------------
// 4. Rien n'est ajouté automatiquement — le cœur de la décision 5
// ---------------------------------------------------------------------------

test('lot 29 : aucun affichage ne gagne un séparateur dans le C produit', () => {
  // La vérification qui compte. Le C produit est exactement ce qu'il était
  // avant le lot : aucun \n, aucun espace, nulle part.
  for (const [source, code] of [
    ['Affiche la valeur de age.', 'printf("%d", age);\n'],
    ['Affiche le caractère c.', 'printf("%c", c);\n'],
    ['Affiche la chaîne s.', 'printf("%s", s);\n'],
    ['Affiche le texte "Total".', 'printf("%s", "Total");\n'],
    ['Affiche la valeur pointée par p.', 'printf("%d", *p);\n'],
  ]) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});

test('lot 29 : deux affichages successifs restent collés, et C-A le dit', () => {
  // Le document produit est inchangé ; seule l'explication est nouvelle.
  let text = 'int main(void) {\n    \n}\n';
  for (const source of ['Affiche la valeur de a.', 'Affiche la valeur de b.']) {
    const cursor = text.lastIndexOf('    \n') + 4;
    const result = planPlacement({ document: { id: 'x.c', revision: 0, text }, cursorOffset: cursor,
      translation: translated(source) });
    assert.equal(result.status, 'planned', source);
    const edit = result.plan.edits[0];
    text = text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
    assert.ok(codes(source).includes('OUTPUT_HAS_NO_SEPARATOR'), source);
  }
  assert.ok(text.includes('printf("%d", a);'), text);
  assert.ok(text.includes('printf("%d", b);'), text);
  // Aucun séparateur inséré entre les deux.
  assert.equal(text.includes('printf("\\n")'), false);
  assert.equal(text.includes('" "'), false);
});

test('lot 29 : la sortie lisible s’écrit, elle ne s’obtient pas', () => {
  // Composition, pas commande monolithique : trois instructions explicites.
  const sentences = ['Affiche le texte "age = ".', 'Affiche la valeur de age.', 'Affiche un retour à la ligne.'];
  const produced = sentences.map(source => translated(source).fragments[0].code);
  assert.deepEqual(produced, ['printf("%s", "age = ");\n', 'printf("%d", age);\n', 'printf("\\n");\n']);
});
