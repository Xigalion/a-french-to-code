import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';

const B = String.fromCharCode(92);

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', `${source} aurait dû être traduite : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', `${source} aurait dû être refusée`);
  assert.equal(result.diagnostics[0].code, code, source);
  if (range) assert.deepEqual(result.diagnostics[0].range, range, source);
  return result.diagnostics[0];
}
function applied(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

// ---------------------------------------------------------------------------
// 1. Les sept formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Déclare un fichier nommé f.', 'FILE *f;\n', 'FILE_DECL'],
  ['Affecte à f l’ouverture du fichier "donnees.txt" en lecture.', 'f = fopen("donnees.txt", "r");\n', 'FILE_OPEN'],
  ['Ferme le fichier f.', 'fclose(f);\n', 'FILE_CLOSE'],
  ['Écris le texte "bonjour" dans le fichier f.', 'fprintf(f, "%s", "bonjour");\n', 'FILE_WRITE_TEXT'],
  ['Écris la valeur de x dans le fichier f.', 'fprintf(f, "%d", x);\n', 'FILE_WRITE_INT'],
  ['Lis un entier depuis le fichier f dans x.', 'fscanf(f, "%d", &x);\n', 'FILE_READ_INT'],
  ['Crée un bloc si la fin du fichier f est atteinte.', 'if (feof(f)) {\n    \n}\n', 'FILE_AT_END'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 22 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
  });
  test(`lot 22 sortie exacte sans point final : ${source}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('seule la fin de fichier est un bloc', () => {
  assert.ok(translated('Crée un bloc si la fin du fichier f est atteinte.').fragments[0].cursor);
  for (const [source] of EXACT.slice(0, 6)) assert.equal(translated(source).fragments[0].cursor, undefined);
});

test('le déclarateur du flux suit la convention D2 du lot 17', () => {
  const code = translated('Déclare un fichier nommé f.').fragments[0].code;
  assert.equal(code, 'FILE *f;\n');
  assert.ok(!code.includes('FILE* f'), code);
});

test('l’adresse est écrite dans la lecture, et c’est la leçon', () => {
  const code = translated('Lis un entier depuis le fichier f dans x.').fragments[0].code;
  assert.equal(code, 'fscanf(f, "%d", &x);\n');
  assert.ok(code.includes('&x'), code);
});

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('FERME LE FICHIER f.').fragments[0].code, 'fclose(f);\n');
  assert.equal(translated('ÉCRIS LA VALEUR DE x DANS LE FICHIER f.').fragments[0].code, 'fprintf(f, "%d", x);\n');
  refused('Ecris la valeur de x dans le fichier f.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. Les six modes d’ouverture
// ---------------------------------------------------------------------------

for (const [mode, letter] of [['lecture', 'r'], ['écriture', 'w'], ['ajout', 'a'],
  ['lecture binaire', 'rb'], ['écriture binaire', 'wb'], ['ajout binaire', 'ab']]) {
  test(`mode d’ouverture : ${mode}`, () => {
    assert.equal(translated(`Affecte à f l’ouverture du fichier "d.txt" en ${mode}.`).fragments[0].code,
      `f = fopen("d.txt", "${letter}");\n`);
  });
}
for (const mode of ['mise à jour', 'lecture-écriture', 'texte', 'append', 'r']) {
  test(`mode refusé : ${mode}`, () => {
    const diagnostic = refused(`Affecte à f l’ouverture du fichier "d.txt" en ${mode}.`,
      mode === 'mise à jour' ? 'UNSUPPORTED_FILE_MODE' : 'UNSUPPORTED_FILE_MODE');
    assert.match(diagnostic.message, /lecture, écriture, ajout/u);
    assert.match(diagnostic.message, /binaire/u);
  });
}
test('mode absent ou mal introduit', () => {
  refused('Affecte à f l’ouverture du fichier "d.txt".', 'MISSING_FILE_MODE');
  refused('Affecte à f l’ouverture du fichier "d.txt" lecture.', 'UNKNOWN_FORMULATION');
  refused('Affecte à f l’ouverture du fichier "d.txt" en.', 'MISSING_FILE_MODE');
  refused('Affecte à f l’ouverture du fichier "d.txt" en lecture rapide.', 'UNEXPECTED_TEXT');
  refused('Affecte à f l’ouverture du fichier "d.txt" en lecture binaire rapide.', 'UNEXPECTED_TEXT');
});

// ---------------------------------------------------------------------------
// 3. Chemins : la grammaire de texte du lot 16, partagée
// ---------------------------------------------------------------------------

for (const [written, produced] of [['d.txt', 'd.txt'], ['', ''], ['mon dossier/d.txt', 'mon dossier/d.txt'],
  [`c:${B}${B}d.txt`, `c:${B}${B}d.txt`], ['é.txt', 'é.txt']]) {
  test(`chemin accepté : ${JSON.stringify(written)}`, () => {
    assert.equal(translated(`Affecte à f l’ouverture du fichier "${written}" en lecture.`).fragments[0].code,
      `f = fopen("${produced}", "r");\n`);
  });
}
test('un chemin obéit à la grammaire de texte, pas à une autre', () => {
  refused(`Affecte à f l’ouverture du fichier "a${B}qb" en lecture.`, 'INVALID_STRING_ESCAPE');
  refused('Affecte à f l’ouverture du fichier "a??=b" en lecture.', 'UNSUPPORTED_STRING_CONTENT');
  refused('Affecte à f l’ouverture du fichier "d.txt en lecture.', 'UNTERMINATED_STRING');
  refused('Affecte à f l’ouverture du fichier d.txt en lecture.', 'UNKNOWN_FORMULATION');
  // A path may contain spaces, which is why it is read from the raw source.
  assert.ok(translated('Affecte à f l’ouverture du fichier "a b c" en lecture.').fragments[0].code
    .includes('"a b c"'));
});
test('un texte écrit obéit à la même grammaire', () => {
  assert.equal(translated(`Écris le texte "l${B}nm" dans le fichier f.`).fragments[0].code,
    `fprintf(f, "%s", "l${B}nm");\n`);
  refused(`Écris le texte "a${B}qb" dans le fichier f.`, 'INVALID_STRING_ESCAPE');
  assert.ok(translated('Écris le texte "a b" dans le fichier f.').fragments[0].code.includes('"a b"'));
});

// ---------------------------------------------------------------------------
// 4. Diagnostics des enveloppes
// ---------------------------------------------------------------------------

test('diagnostics des sept enveloppes', () => {
  refused('Déclare un fichier f.', 'UNKNOWN_FORMULATION');
  refused('Déclare un fichier nommé.', 'INCOMPLETE_INSTRUCTION');
  refused('Déclare un fichier nommé 1f.', 'INVALID_IDENTIFIER');
  refused('Déclare un fichier nommé f encore.', 'UNEXPECTED_TEXT');
  refused('Ferme le fichier.', 'INCOMPLETE_INSTRUCTION');
  refused('Ferme le fichier 1f.', 'INVALID_IDENTIFIER');
  refused('Affecte à f l’ouverture fichier "d" en lecture.', 'UNKNOWN_FORMULATION');
  refused('Affecte à 1f l’ouverture du fichier "d" en lecture.', 'INVALID_IDENTIFIER');
  refused('Écris le texte "a" le fichier f.', 'UNKNOWN_FORMULATION');
  refused('Écris le texte "a" dans le fichier.', 'INCOMPLETE_INSTRUCTION');
  refused('Écris le texte "a" dans le fichier 1f.', 'INVALID_IDENTIFIER');
  refused('Écris le texte "a" dans le fichier f encore.', 'UNEXPECTED_TEXT');
  refused('Écris la valeur de 1x dans le fichier f.', 'INVALID_IDENTIFIER');
  refused('Lis un entier du fichier f dans x.', 'UNKNOWN_FORMULATION');
  refused('Lis un entier depuis le fichier f dans.', 'INCOMPLETE_INSTRUCTION');
  refused('Lis un entier depuis le fichier f dans x encore.', 'UNEXPECTED_TEXT');
  refused('Lis un flottant depuis le fichier f dans x.', 'UNKNOWN_FORMULATION');
  refused('Crée un bloc si la fin du fichier f est atteint.', 'UNKNOWN_FORMULATION');
  refused('Crée un bloc si la fin du fichier est atteinte.', 'UNKNOWN_FORMULATION');
});

test('les trois formes de « Crée un bloc si » coexistent', () => {
  assert.equal(translated('Crée un bloc si la fin du fichier f est atteinte.').fragments[0].code,
    'if (feof(f)) {\n    \n}\n');
  assert.equal(translated('Crée un bloc si "f == NULL".').fragments[0].code, 'if (f == NULL) {\n    \n}\n');
  assert.equal(translated('Crée un bloc si "a > 0".').fragments[0].code, 'if (a > 0) {\n    \n}\n');
  // And the historical diagnostics of the condition envelope are untouched.
  refused('Crée un bloc si a > 0.', 'MISSING_CONDITION_DELIMITER');
  refused('Crée un bloc si.', 'MISSING_CONDITION');
  refused('Crée un bloc si "a > 0" encore.', 'UNEXPECTED_TEXT');
});

// ---------------------------------------------------------------------------
// 5. Informations pédagogiques
// ---------------------------------------------------------------------------

test('l’ouverture porte l’échec et le sens du mode', () => {
  const source = 'Affecte à f l’ouverture du fichier "d.txt" en écriture.';
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code), ['FOPEN_CAN_FAIL', 'FILE_MODE_MEANING']);
  assert.equal(source.slice(entries[0].range.start, entries[0].range.end), 'f');
  assert.equal(source.slice(entries[1].range.start, entries[1].range.end), 'écriture');
  assert.match(entries[0].message, /renvoie NULL si le fichier ne peut pas être ouvert/u);
  assert.match(entries[0].message, /C-A n’ajoute aucun test/u);
  assert.match(entries[0].message, /f == NULL/u);
  assert.match(entries[1].message, /« w » le crée et efface son contenu existant/u);
  assert.match(entries[1].message, /« a » écrit à la fin/u);
  assert.match(entries[1].message, /mode binaire/u);
  for (const entry of entries) assert.equal(entry.severity, 'information');
});

test('FILE_MUST_BE_CLOSED porte sur la déclaration et sur la fermeture', () => {
  for (const source of ['Déclare un fichier nommé f.', 'Ferme le fichier f.']) {
    const [entry] = explainInstruction(translated(source));
    assert.equal(entry.code, 'FILE_MUST_BE_CLOSED', source);
    assert.match(entry.message, /doit être fermé/u);
    assert.match(entry.message, /encore que dans le tampon/u);
    assert.match(entry.message, /C-A ne suit aucun flux/u);
  }
});

test('SCANF_NEEDS_ADDRESS explique le & et n’annonce aucun test', () => {
  const [entry] = explainInstruction(translated('Lis un entier depuis le fichier f dans x.'));
  assert.equal(entry.code, 'SCANF_NEEDS_ADDRESS');
  assert.match(entry.message, /il lui faut donc son adresse/u);
  assert.match(entry.message, /combien de conversions ont réussi/u);
  assert.match(entry.message, /C-A ne la teste pas/u);
});

test('EOF_AFTER_READ corrige l’erreur classique', () => {
  const [entry] = explainInstruction(translated('Crée un bloc si la fin du fichier f est atteinte.'));
  assert.equal(entry.code, 'EOF_AFTER_READ');
  assert.match(entry.message, /ne regarde pas devant/u);
  assert.match(entry.message, /seulement après une lecture qui a échoué/u);
  assert.match(entry.message, /fait lire une fois de trop/u);
});

test('aucune information de fichier sur les instructions voisines', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affiche le texte "a".', 'Crée un bloc si "a > 0".',
    'Déclare un pointeur de type int nommé p.', 'Libère la mémoire pointée par p.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['FOPEN_CAN_FAIL', 'FILE_MODE_MEANING', 'FILE_MUST_BE_CLOSED',
      'SCANF_NEEDS_ADDRESS', 'EOF_AFTER_READ']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 6. Hors périmètre, et ce qui n’est pas garanti
// ---------------------------------------------------------------------------

test('aucune autre opération de flux', () => {
  for (const source of ['Lis une ligne depuis le fichier f dans s.', 'Positionne le fichier f au début.',
    'Vide le tampon du fichier f.', 'Affiche la taille du fichier f.',
    'Lis un caractère depuis le fichier f dans c.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('aucune vérification de flux, de chemin ni d’ordre', () => {
  // Nothing is resolved: writing to a stream never opened is translated.
  assert.equal(translated('Écris le texte "a" dans le fichier jamaisOuvert.').fragments[0].code,
    'fprintf(jamaisOuvert, "%s", "a");\n');
  // Closing twice is translated twice; C-A does not read the document.
  assert.equal(translated('Ferme le fichier f.').fragments[0].code, 'fclose(f);\n');
  // A path is a text, not a verified location.
  assert.equal(translated('Affecte à f l’ouverture du fichier "" en lecture.').fragments[0].code,
    'f = fopen("", "r");\n');
});

test('stdio.h n’est jamais ajouté de lui-même', () => {
  // FILE, fopen, fprintf and feof all need stdio.h, and C-A never adds it.
  assert.ok(!translated('Déclare un fichier nommé f.').fragments[0].code.includes('#include'));
  assert.ok(!translated('Ferme le fichier f.').fragments[0].code.includes('#include'));
});

// ---------------------------------------------------------------------------
// 7. Placement et séquence complète
// ---------------------------------------------------------------------------

test('cycle complet d’un fichier : document final exact', () => {
  let document = 'int main(void) {\n    \n}\n';
  let at = 21;
  for (const source of [
    'Déclare un fichier nommé f.',
    'Affecte à f l’ouverture du fichier "sortie.txt" en écriture.',
    'Écris le texte "bonjour" dans le fichier f.',
    'Ferme le fichier f.',
  ]) {
    document = applied(document, source, at);
    at = document.indexOf('\n    \n') + 1 + 4;
  }
  assert.equal(document, 'int main(void) {\n'
    + '    // Déclare un fichier nommé f.\n    FILE *f;\n'
    + '    // Affecte à f l’ouverture du fichier "sortie.txt" en écriture.\n    f = fopen("sortie.txt", "w");\n'
    + '    // Écris le texte "bonjour" dans le fichier f.\n    fprintf(f, "%s", "bonjour");\n'
    + '    // Ferme le fichier f.\n    fclose(f);\n'
    + '    \n}\n');
});

test('le bloc de fin de fichier se place comme tout autre bloc', () => {
  for (const [text, offset] of [['', 0], ['int main(void) {\n    \n}\n', 21], ['int main(void) {\r\n    \r\n}\r\n', 22]]) {
    const result = applied(text, 'Crée un bloc si la fin du fichier f est atteinte.', offset);
    assert.ok(result.includes('if (feof(f)) {'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  }
});

test('une boucle de lecture s’écrit avec les constructions existantes', () => {
  // No monolithic read loop: the student composes it.
  assert.equal(translated('Crée une boucle tant que "a".').fragments[0].code, 'while (a) {\n    \n}\n');
  assert.equal(translated('Lis un entier depuis le fichier f dans x.').fragments[0].code, 'fscanf(f, "%d", &x);\n');
  assert.equal(translated('Sors de la boucle la plus intérieure.').fragments[0].code, 'break;\n');
});

// ---------------------------------------------------------------------------
// 8. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
  ['Affiche le texte "bonjour".', 'printf("%s", "bonjour");\n'],
  ['Affiche la valeur de x.', 'printf("%d", x);\n'],
  ['Déclare un entier nommé x.', 'int x;\n'],
  ['Crée un bloc si "a > 0".', 'if (a > 0) {\n    \n}\n'],
  ['Ajoute une branche sinon.', 'else {\n    \n}\n'],
  ['Déclare un pointeur de type int nommé p.', 'int *p;\n'],
  ['Affecte à p l’allocation de 4 éléments de type int.', 'p = malloc(4 * sizeof(int));\n'],
  ['Déclare une structure nommée Point.', 'struct Point {\n    \n};\n'],
]) {
  test(`non-régression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
