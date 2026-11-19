const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

exports.run = async function run() {
  const cases = [];
  const report = process.env.CA_TEST_REPORT;
  const workspace = process.env.CA_TEST_WORKSPACE;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      const value = await predicate();
      if (value) return value;
      await delay(40);
    }
    throw new Error('Délai dépassé : ' + label);
  }
  let api;
  let fixtureNumber = 0;
  const documents = [];
  // Lot 26 : une instruction exécutable n'existe que dans le corps d'une
  // fonction. Les scénarios hôte dont le sujet est la mécanique de l'éditeur
  // ou le cycle saisie → aperçu → confirmation plaçaient leur instruction dans
  // un document vide, donc à la portée fichier. Ils passent désormais cet
  // en-tête, écrit par l'auteur du document ; leur sujet est inchangé. Les
  // scénarios qui créent une fonction, une déclaration ou une directive
  // gardent le document vide, parce que C17 les y admet.
  const CORPS = 'int main(void) {\n';
  async function fixture(text = '', cursor = text.length) {
    const file = path.join(workspace, `scenario-${++fixtureNumber}.c`);
    fs.writeFileSync(file, text, 'utf8');
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
    const editor = await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
    editor.options = { insertSpaces: true, tabSize: 4, indentSize: 'tabSize' };
    const position = document.positionAt(cursor);
    editor.selection = new vscode.Selection(position, position);
    documents.push(document);
    await delay(100);
    return { file, document, editor };
  }
  async function start(phrase) {
    await vscode.commands.executeCommand('c-a.translate', phrase);
    await waitFor(() => api.inspect()?.ui === 'input', 'champ de saisie');
    await delay(100);
  }
  async function accept() {
    await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
    await delay(100);
  }
  async function preview(phrase) {
    await start(phrase);
    await accept();
    await waitFor(() => {
      const state = api.inspect();
      if (state?.phase === 'stale') throw new Error('Session invalidée pendant la préparation : ' + JSON.stringify(state.diagnostic));
      return state?.ui === 'confirmation';
    }, 'confirmation après diff');
    assert.equal(api.inspect().phase, 'review', JSON.stringify(api.inspect()));
    await delay(100);
  }
  async function cancel() {
    if (api?.inspect()) {
      await vscode.commands.executeCommand('workbench.action.closeQuickOpen');
      await waitFor(() => !api.inspect(), 'fermeture de session');
    }
  }
  async function inserted() {
    await accept();
    await waitFor(() => !api.inspect(), 'fin de l’insertion');
  }
  async function test(name, body) {
    try { await body(); cases.push({ name, status: 'passed' }); }
    catch (error) { cases.push({ name, status: 'failed', error: error.stack ?? String(error) }); }
    finally {
      try {
        await cancel();
        // Test fixtures only. Production C-A never calls save(). Check disk before teardown.
        for (const document of documents.splice(0)) if (!document.isClosed && document.isDirty) await document.save();
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
      } catch (error) { cases.push({ name: name + ' / nettoyage', status: 'failed', error: String(error) }); }
    }
  }
  try {
    const extension = vscode.extensions.getExtension('projet-a-local.c-a');
    assert.ok(extension, 'Extension C-A chargée dans l’hôte de développement');
    api = await extension.activate();
    assert.ok((await vscode.commands.getCommands()).includes('workbench.action.acceptSelectedQuickOpenItem'));

    await test('InputBox : Échap annule, aucun changement', async () => {
      const { document } = await fixture();
      await start('Crée la fonction principale');
      assert.equal(document.getText(), '');
      await cancel();
      assert.equal(document.getText(), '');
    });
    await test('première Entrée : diff complet en lecture seule, sans insertion', async () => {
      const { document } = await fixture();
      await preview('Crée la fonction principale');
      const state = api.inspect();
      const before = await vscode.workspace.openTextDocument(vscode.Uri.parse(state.preview.before));
      const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(state.preview.after));
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      assert.equal(before.getText(), '');
      assert.equal(after.getText(), '// Crée la fonction principale\nint main(void) {\n    \n}\n'.replaceAll('\n', eol));
      assert.equal(document.getText(), '');
      assert.equal(before.isDirty, false);
      assert.equal(after.isDirty, false);
      const diff = vscode.window.tabGroups.all.flatMap(group => group.tabs).find(tab => tab.input instanceof vscode.TabInputTextDiff);
      assert.ok(diff);
      await cancel();
      assert.equal(document.getText(), '');
    });
    await test('MAIN : confirmation native, retour au curseur, annulation et rétablissement', async () => {
      const { document, file } = await fixture();
      const originalEol = document.eol;
      await preview('Crée la fonction principale');
      await inserted();
      const expected = '// Crée la fonction principale\nint main(void) {\n    \n}\n'.replaceAll('\n', originalEol === vscode.EndOfLine.CRLF ? '\r\n' : '\n');
      assert.equal(document.getText(), expected);
      assert.equal(document.isDirty, true);
      assert.equal(fs.readFileSync(file, 'utf8'), '');
      const editor = vscode.window.activeTextEditor;
      assert.equal(editor.document, document);
      assert.equal(document.offsetAt(editor.selection.active), expected.indexOf('    ') + 4);
      await vscode.commands.executeCommand('undo');
      assert.equal(document.getText(), '');
      assert.equal(document.eol, originalEol);
      await vscode.commands.executeCommand('redo');
      assert.equal(document.getText(), expected);
    });
    await test('trois sessions successives, sans accumulation de lignes blanches', async () => {
      const { document } = await fixture();
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      for (const phrase of ['Crée la fonction principale', 'Déclare un entier nommé age', 'Affecte la valeur 25 à age']) {
        await preview(phrase);
        await inserted();
      }
      assert.equal(document.getText(), '// Crée la fonction principale\nint main(void) {\n    // Déclare un entier nommé age\n    int age;\n    // Affecte la valeur 25 à age\n    age = 25;\n    \n}\n'.replaceAll('\n', eol));
    });
    await test('brouillon non enregistré utilisé et jamais sauvegardé par C-A', async () => {
      const { document, editor, file } = await fixture();
      await editor.edit(builder => builder.insert(new vscode.Position(0, 0), '// brouillon é😀\n'));
      const draft = document.getText();
      const position = document.positionAt(document.getText().length);
      editor.selection = new vscode.Selection(position, position);
      await preview('Crée la fonction principale');
      const before = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.before));
      assert.equal(before.getText(), draft);
      await inserted();
      assert.ok(document.getText().startsWith(draft));
      assert.equal(fs.readFileSync(file, 'utf8'), '');
    });
    await test('navigation dans le diff ne redirige pas l’insertion', async () => {
      const { document } = await fixture();
      await preview('Crée la fonction principale');
      const virtualEditor = vscode.window.visibleTextEditors.find(editor => editor.document.uri.scheme === 'c-a-preview');
      assert.ok(virtualEditor);
      virtualEditor.selection = new vscode.Selection(0, 0, 0, 0);
      virtualEditor.revealRange(new vscode.Range(0, 0, 0, 0));
      await delay(100);
      assert.equal(api.inspect().phase, 'review');
      await inserted();
      assert.ok(document.getText().includes('int main(void)'));
      assert.equal(virtualEditor.document.isDirty, false);
    });
    await test('modification du document après aperçu : Insérer disparaît', async () => {
      const { document, editor } = await fixture();
      await preview('Crée la fonction principale');
      await editor.edit(builder => builder.insert(new vscode.Position(0, 0), '// manuel\n'));
      const manualText = document.getText();
      await waitFor(() => api.inspect()?.phase === 'stale', 'aperçu périmé');
      assert.ok(!api.inspect().choices.includes('Insérer'));
      await accept();
      await waitFor(() => !api.inspect(), 'retour sans insertion');
      assert.equal(document.getText(), manualText);
    });
    await test('déplacement du curseur invalide le plan même sur la même ligne', async () => {
      const { document, editor } = await fixture('    ', 4);
      await preview('Crée la fonction principale');
      editor.selection = new vscode.Selection(0, 0, 0, 0);
      await waitFor(() => api.inspect()?.phase === 'stale', 'curseur changé');
      assert.ok(!api.inspect().choices.includes('Insérer'));
      assert.equal(document.getText(), '    ');
    });
    await test('réglages d’indentation modifiés : aperçu périmé', async () => {
      const { editor } = await fixture();
      await preview('Crée la fonction principale');
      editor.options = { insertSpaces: false, tabSize: 8 };
      await waitFor(() => api.inspect()?.phase === 'stale', 'indentation changée');
      assert.ok(!api.inspect().choices.includes('Insérer'));
    });
    await test('fermeture du document cible : aucun autre éditeur modifié', async () => {
      const { document } = await fixture();
      await preview('Crée la fonction principale');
      const tab = vscode.window.tabGroups.all.flatMap(group => group.tabs).find(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.toString() === document.uri.toString());
      assert.ok(tab);
      await vscode.window.tabGroups.close(tab, true);
      await waitFor(() => api.inspect()?.phase === 'stale', 'cible fermée');
      assert.ok(!api.inspect().choices.includes('Insérer'));
    });
    await test('confirmations natives répétées : une seule insertion', async () => {
      const { document } = await fixture();
      await preview('Crée la fonction principale');
      await Promise.all([accept(), accept()]);
      await waitFor(() => !api.inspect(), 'une seule session appliquée');
      assert.equal(document.getText().split('int main(void)').length - 1, 1);
    });
    await test('diagnostic de traduction : français, UTF-16, aucune édition', async () => {
      const { document } = await fixture();
      await start('Déclare un entier nommé int.');
      assert.equal(api.inspect().diagnostic.stage, 'translation');
      assert.deepEqual(api.inspect().diagnostic.range, { start: 24, end: 27 });
      await accept();
      assert.equal(api.inspect().ui, 'input');
      assert.equal(document.getText(), '');
    });
    await test('diagnostic de placement séparé, sans correction du fichier', async () => {
      const { document } = await fixture('int x;');
      await start('Déclare un entier nommé age');
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.equal(api.inspect().diagnostic.code, 'TARGET_LINE_NOT_BLANK');
      await accept();
      assert.equal(document.getText(), 'int x;');
    });
    await test('réglage deux espaces transmis à MAIN', async () => {
      const { document, editor } = await fixture();
      editor.options = { insertSpaces: true, tabSize: 2 };
      await waitFor(() => editor.options.tabSize === 2 && editor.options.indentSize === 2, 'réglages deux espaces résolus');
      await preview('Crée la fonction principale');
      await inserted();
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      assert.ok(document.getText().includes('{' + eol + '  ' + eol + '}'));
    });
    for (const eol of ['\n', '\r\n']) {
      await test(`texte existant ${JSON.stringify(eol)} et UTF-16 : insertion et curseur exacts`, async () => {
        const prefix = '// é😀' + eol + 'int main(void) {' + eol;
        const original = prefix + '    ' + eol + '}' + eol;
        const { document, file } = await fixture(original, prefix.length + 4);
        await preview('Crée un entier nommé Age de valeur -20');
        await inserted();
        const expected = prefix + '    // Crée un entier nommé Age de valeur -20' + eol + '    int Age = -20;' + eol + '    ' + eol + '}' + eol;
        assert.equal(document.getText(), expected);
        assert.equal(document.offsetAt(vscode.window.activeTextEditor.selection.active), expected.lastIndexOf('    ' + eol) + 4);
        assert.equal(fs.readFileSync(file, 'utf8'), original);
      });
    }
    await test('changement de métadonnée LF/CRLF dans un fichier vide : plan périmé', async () => {
      const { document, editor } = await fixture();
      await preview('Crée la fonction principale');
      await editor.edit(builder => builder.setEndOfLine(document.eol === vscode.EndOfLine.LF ? vscode.EndOfLine.CRLF : vscode.EndOfLine.LF));
      await waitFor(() => api.inspect()?.phase === 'stale', 'métadonnée de fin de ligne changée');
      assert.ok(!api.inspect().choices.includes('Insérer'));
      assert.equal(document.getText(), '');
    });
    await test('un autre fichier actif ne devient jamais la cible', async () => {
      const original = await fixture();
      await preview('Crée la fonction principale');
      const other = await fixture();
      await waitFor(() => api.inspect()?.phase === 'stale', 'autre fichier actif');
      assert.equal(api.inspect().targetUri, original.document.uri.toString());
      assert.ok(!api.inspect().choices.includes('Insérer'));
      await cancel();
      assert.equal(original.document.getText(), '');
      assert.equal(other.document.getText(), '');
    });
    await test('Modifier la phrase réouvre le brouillon et impose un nouvel aperçu', async () => {
      const { document } = await fixture();
      await preview('Crée la fonction principale');
      const first = api.inspect().preview.after;
      await vscode.commands.executeCommand('workbench.action.quickOpenSelectNext');
      await accept();
      await waitFor(() => api.inspect()?.ui === 'input', 'retour à la saisie');
      assert.equal(api.inspect().draft, 'Crée la fonction principale');
      assert.equal(document.getText(), '');
      await accept();
      await waitFor(() => api.inspect()?.ui === 'confirmation', 'nouvel aperçu');
      assert.notEqual(api.inspect().preview.after, first);
      await inserted();
      assert.equal(document.getText().split('int main(void)').length - 1, 1);
    });
    await test('indentSize distinct de tabSize respecté sans reformatter le texte', async () => {
      const { document, editor } = await fixture();
      editor.options = { insertSpaces: true, tabSize: 8, indentSize: 2 };
      await waitFor(() => editor.options.tabSize === 8 && editor.options.indentSize === 2, 'indentSize distinct résolu');
      await preview('Crée la fonction principale');
      await inserted();
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      assert.ok(document.getText().includes('{' + eol + '  ' + eol + '}'));
    });
    await test('lot 4 : inclusion, main, entier et affichages sans retour implicite', async () => {
      const { document } = await fixture();
      for (const phrase of ['Inclue la bibliothèque stdio.h.', 'Inclue la bibliothèque stdio.h.',
        'Crée la fonction principale.', 'Crée un entier nommé age de valeur 20.',
        'Affiche le texte "Âge : 100 % ".', 'Affiche la valeur de age.',
        String.raw`Affiche le texte "\n".`]) {
        const before = document.getText();
        await preview(phrase);
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        const expected = after.getText();
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected);
      }
      assert.equal(document.getText().split('#include <stdio.h>').length - 1, 2);
      assert.ok(document.getText().includes('printf("%d", age);'));
      assert.ok(document.getText().includes('printf("%s", "Âge : 100 % ");'));
      assert.ok(document.getText().includes('printf("%s", "\\n");'));
      const beforeUndo = document.getText();
      await vscode.commands.executeCommand('undo');
      assert.ok(!document.getText().includes('printf("%s", "\\n");'));
      await vscode.commands.executeCommand('redo');
      assert.equal(document.getText(), beforeUndo);
    });
    for (const [phrase, code, message, range] of [
      ['Affiche age.', 'MISSING_DISPLAY_FORMAT', 'Il manque le format d’affichage.', { start: 11, end: 11 }],
      ['Affiche age en.', 'MISSING_DISPLAY_FORMAT', 'Il manque le format d’affichage.', { start: 14, end: 14 }],
      ['Affiche en décimal.', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom à afficher.', { start: 8, end: 8 }],
      ['Affiche age en binaire.', 'UNSUPPORTED_DISPLAY_FORMAT', 'Ce format d’affichage n’est pas pris en charge.', { start: 15, end: 22 }],
      ['Affiche 😀 en octal.', 'INVALID_IDENTIFIER', undefined, { start: 8, end: 10 }],
    ]) {
      await test(`lot 5 refus sans insertion : ${phrase}`, async () => {
        const { document, file } = await fixture();
        await start(phrase);
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.stage, 'translation');
        assert.equal(diagnostic.code, code);
        assert.deepEqual(diagnostic.range, range);
        if (message) assert.equal(diagnostic.message, message);
        await accept();
        await accept();
        assert.equal(api.inspect().ui, 'input');
        assert.ok(!api.inspect().choices.includes('Insérer'));
        assert.equal(document.getText(), '');
        assert.equal(fs.readFileSync(file, 'utf8'), '');
      });
    }
    await test('lot 5 formats explicites : aperçu, confirmation et curseur successif', async () => {
      const { document, file } = await fixture(CORPS);
      let expected = CORPS;
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      for (const [word, specifier] of [['décimal', '%d'], ['hexadécimal', '%x'], ['octal', '%o']]) {
        const phrase = `Affiche age en ${word}.`;
        const before = document.getText();
        await preview(phrase);
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        expected += `// ${phrase}${eol}printf("${specifier}", age);${eol}`;
        assert.equal(after.getText(), expected + eol);
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected + eol);
        assert.equal(document.offsetAt(vscode.window.activeTextEditor.selection.active), expected.length);
        assert.equal(fs.readFileSync(file, 'utf8'), CORPS);
      }
    });
    for (const [expression, code, token] of [
      ['a +', 'MISSING_OPERAND', ''], ['', 'MISSING_EXPRESSION', ''],
      ['(a + b', 'MISSING_CLOSING_PARENTHESIS', ''],
      ['a + 😀', 'INVALID_EXPRESSION_TOKEN', '😀'],
      ['a == b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '=='],
      ['('.repeat(65) + 'a' + ')'.repeat(65), 'EXPRESSION_TOO_COMPLEX', undefined],
      [Array(513).fill('a').join('+'), 'EXPRESSION_TOO_COMPLEX', undefined],
    ]) {
      await test(`lot 6 refus sans insertion : ${code} ${expression.slice(0, 24)}`, async () => {
        const { document, file } = await fixture();
        const source = `Affecte à resultat le résultat de "${expression}".`;
        await start(source);
        assert.equal(api.inspect().diagnostic.stage, 'translation');
        assert.equal(api.inspect().diagnostic.code, code);
        if (token !== undefined) {
          const start = token ? source.indexOf(token) : source.lastIndexOf('"');
          assert.deepEqual(api.inspect().diagnostic.range, { start, end: start + token.length });
        }
        await accept();
        await accept();
        assert.equal(api.inspect().ui, 'input');
        assert.ok(!api.inspect().choices.includes('Insérer'));
        assert.equal(document.getText(), '');
        assert.equal(fs.readFileSync(file, 'utf8'), '');
      });
    }
    await test('lot 6 négations, calculs et confirmation : source, aperçu et curseur exacts', async () => {
      const { document, file } = await fixture(CORPS);
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      let expected = CORPS;
      for (const [expression, code] of [['-a', '(-a)'], ['-(a + b)', '(-(a + b))'],
        ['a * -b', '(a * (-b))'], ['2 + 3 * 4', '(2 + (3 * 4))'], ['a / b', '(a / b)'], ['a % b', '(a % b)']]) {
        const source = `Affecte à resultat le résultat de "${expression}".`;
        const before = document.getText();
        await preview(source);
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        expected += `// ${source}${eol}resultat = ${code};${eol}`;
        assert.equal(after.getText(), expected + eol);
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected + eol);
        assert.equal(document.offsetAt(vscode.window.activeTextEditor.selection.active), expected.length);
        assert.equal(fs.readFileSync(file, 'utf8'), CORPS);
      }
      const applied = document.getText();
      await vscode.commands.executeCommand('undo');
      assert.equal(document.getText().includes('resultat = (a % b);'), false);
      await vscode.commands.executeCommand('redo');
      assert.equal(document.getText(), applied);
    });
    for (const [phrase, code] of [
      ['Déclare une variable de type.', 'MISSING_NUMERIC_TYPE'],
      ['Déclare une variable de type long double nommée d.', 'UNSUPPORTED_NUMERIC_TYPE'],
      ['Affecte à r le résultat numérique de "(double)".', 'MISSING_OPERAND'],
      ['Affecte à r le résultat numérique de "1e-".', 'INCOMPLETE_NUMERIC_LITERAL'],
      ['Affiche f en notation fixe.', 'MISSING_DISPLAY_PRECISION'],
      ['Affiche f en notation scientifique avec 21 décimales.', 'INVALID_DISPLAY_PRECISION'],
      ['Affecte à r le résultat numérique de "a + 😀".', 'INVALID_EXPRESSION_TOKEN'],
      ['Affecte à r le résultat numérique de "' + '(double) '.repeat(65) + 'a".', 'EXPRESSION_TOO_COMPLEX'],
    ]) {
      await test(`lot 7 refus sans insertion : ${code}`, async () => {
        const { document, file } = await fixture();
        await start(phrase);
        assert.equal(api.inspect().diagnostic.stage, 'translation');
        assert.equal(api.inspect().diagnostic.code, code);
        if (phrase.includes('😀')) assert.deepEqual(api.inspect().diagnostic.range, { start: phrase.indexOf('😀'), end: phrase.indexOf('😀') + 2 });
        await accept();
        await accept();
        assert.equal(api.inspect().ui, 'input');
        assert.ok(!api.inspect().choices.includes('Insérer'));
        assert.equal(document.getText(), '');
        assert.equal(fs.readFileSync(file, 'utf8'), '');
      });
    }
    await test('lot 7 types, divisions, casts et formats : parcours inchangé', async () => {
      const { document, file } = await fixture(CORPS);
      const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      let expected = CORPS;
      for (const [phrase, code] of [
        ['Déclare une variable de type double nommée q.', 'double q;'],
        ['Crée une variable de type unsigned int nommée u avec le résultat de "7u".', 'unsigned int u = 7u;'],
        ['Crée une variable de type float nommée f avec le résultat de "0.1f".', 'float f = 0.1f;'],
        ['Affecte à q le résultat numérique de "7 / 2".', 'q = (7 / 2);'],
        ['Affecte à q le résultat numérique de "7.0 / 2".', 'q = (7.0 / 2);'],
        ['Affecte à q le résultat numérique de "(double) 7 / 2".', 'q = (((double) 7) / 2);'],
        ['Affiche u en décimal non signé.', 'printf("%u", u);'],
        ['Affiche f en notation fixe avec 9 décimales.', 'printf("%.9f", f);'],
        ['Affiche q en notation scientifique avec 3 décimales.', 'printf("%.3e", q);'],
      ]) {
        const before = document.getText();
        await preview(phrase);
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        expected += `// ${phrase}${eol}${code}${eol}`;
        assert.equal(after.getText(), expected + eol);
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected + eol);
        assert.equal(document.offsetAt(vscode.window.activeTextEditor.selection.active), expected.length);
        assert.equal(fs.readFileSync(file, 'utf8'), CORPS);
      }
      const applied = document.getText();
      await vscode.commands.executeCommand('undo');
      assert.equal(document.getText().includes('printf("%.3e", q);'), false);
      await vscode.commands.executeCommand('redo');
      assert.equal(document.getText(), applied);
    });
    for (const [expression, codes] of [
      ['7 / 0', ['INTEGER_ZERO_DIVISOR']],
      ['1.0 / 0.0', ['ZERO_DIVISOR']],
      ['a / 0', ['ZERO_DIVISOR']],
      ['7 % 0.0', ['FLOAT_REMAINDER_OPERAND']],
      ['7 / 0 + 5.0 % 2', ['INTEGER_ZERO_DIVISOR', 'FLOAT_REMAINDER_OPERAND']],
    ]) {
      await test(`lot 8 nonblocking warnings and unchanged insertion: ${expression}`, async () => {
        const { document, file } = await fixture(CORPS);
        const phrase = `Affecte à r le résultat numérique de "${expression}".`;
        await start(phrase);
        const editing = api.inspect();
        assert.equal(editing.diagnostic, undefined);
        assert.equal(editing.validation.severity, vscode.InputBoxValidationSeverity.Warning);
        assert.deepEqual(editing.advisories.map(a => a.code), codes);
        assert.equal(editing.loggedPreviews, 0);
        await accept();
        await waitFor(() => api.inspect()?.ui === 'confirmation', 'lot 8 warning allows preview');
        const state = api.inspect();
        assert.equal(state.phase, 'review');
        assert.deepEqual(state.choices, ['Insérer', 'Modifier la phrase', 'Annuler']);
        assert.ok(state.confirmationTitle.includes(`${codes.length} avertissement(s)`));
        assert.equal(state.loggedPreviews, 1);
        assert.ok(state.pedagogyEntry.includes(phrase));
        for (const code of codes) assert.ok(state.pedagogyEntry.includes(code));
        assert.equal(vscode.window.activeTextEditor?.document.uri.scheme, 'c-a-preview');
        await vscode.commands.executeCommand('c-a.translate'); // Focus existing UI, no second log entry.
        assert.equal(api.inspect().loggedPreviews, 1);
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(state.preview.after));
        const shown = after.getText();
        assert.ok(shown.includes('// ' + phrase));
        assert.ok(!shown.includes('avertissement'));
        assert.equal(document.getText(), CORPS);
        await inserted(); // Source only: no C compilation or execution in this suite.
        assert.equal(document.getText(), shown);
        assert.equal(fs.readFileSync(file, 'utf8'), CORPS);
        assert.ok(document.offsetAt(vscode.window.activeTextEditor.selection.active) > 0);
        await vscode.commands.executeCommand('undo');
        assert.equal(document.getText(), CORPS);
        await vscode.commands.executeCommand('redo');
        assert.equal(document.getText(), shown);
      });
    }
    await test('lot 8 edit/cancel drops warned preview; incomplete new phrase cannot insert', async () => {
      const { document } = await fixture(CORPS);
      await preview('Affecte à r le résultat de "7 / 0".');
      assert.equal(api.inspect().advisories.length, 1);
      await vscode.commands.executeCommand('workbench.action.quickOpenSelectNext');
      await accept();
      await waitFor(() => api.inspect()?.ui === 'input', 'lot 8 edit again');
      assert.equal(api.inspect().loggedPreviews, 1);
      await cancel();
      await start('Affecte à r le résultat de "a +".');
      assert.equal(api.inspect().diagnostic.code, 'MISSING_OPERAND');
      assert.equal(api.inspect().loggedPreviews, 0);
      assert.deepEqual(api.inspect().advisories, []);
      await accept();
      assert.equal(api.inspect().ui, 'input');
      assert.equal(document.getText(), CORPS);
    });
    await test('lot 8 stale preview clears active warnings and insertion choices', async () => {
      const { editor, document } = await fixture(CORPS);
      await preview('Affecte à r le résultat de "7 / 0".');
      await editor.edit(builder => builder.insert(new vscode.Position(0, 0), ' '));
      await waitFor(() => api.inspect()?.phase === 'stale', 'lot 8 stale');
      assert.deepEqual(api.inspect().advisories, []);
      assert.ok(!api.inspect().choices.includes('Insérer'));
      assert.equal(api.inspect().loggedPreviews, 1);
      await cancel();
      assert.equal(document.getText(), ' ' + CORPS);
    });
    await test('lot 8 deliberate exclusions have no warning or log', async () => {
      await fixture(CORPS);
      await preview('Affecte à r le résultat numérique de "7 / (1 - 1)".');
      assert.deepEqual(api.inspect().advisories, []);
      assert.equal(api.inspect().loggedPreviews, 0);
      await cancel();
    });
    for (const eol of ['\n', '\r\n']) {
      for (const unit of ['  ', '\t']) {
        await test(`lot 9 : IF imbriqués et insertions successives ${JSON.stringify([eol, unit])}`, async () => {
          const prefix = '// 😀 avant' + eol + 'int main(void) {' + eol;
          const suffix = unit + 'printf("après");' + eol + '}' + eol;
          const initial = prefix + unit + eol + suffix;
          const { document, editor, file } = await fixture(initial, prefix.length + unit.length);
          editor.options = { insertSpaces: unit !== '\t', tabSize: 2, indentSize: 'tabSize' };
          // Instabilité trouvée à la campagne 2 : ce site était le SEUL à
          // attendre les réglages par un délai fixe, là où tous ses voisins
          // attendent la condition réelle. Si l’éditeur n’avait pas appliqué
          // tabSize en 100 ms, la session capturait la mauvaise signature
          // d’indentation et le document attendu ne correspondait plus. Ce
          // n'est pas une nouvelle tentative : c'est l'attente de l'état.
          await waitFor(() => editor.options.tabSize === 2 && editor.options.indentSize === 2
            && editor.options.insertSpaces === (unit !== '\t'), 'réglages d’indentation résolus');
          let previous = initial;
          for (const source of ['Crée un bloc si "age >= 18".', 'Déclare un entier nommé x.',
            'Affecte la valeur 1 à x.', 'Crée un bloc si "x == 1".', 'Affiche la valeur de x.']) {
            await preview(source);
            const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
            const expected = after.getText();
            assert.equal(document.getText(), previous);
            await inserted();
            assert.equal(document.getText(), expected);
            assert.equal(vscode.window.activeTextEditor.document.uri.toString(), document.uri.toString());
            const cursor = document.offsetAt(editor.selection.active);
            assert.equal(document.getText().slice(cursor, cursor + eol.length), eol);
            assert.ok(document.getText().startsWith(prefix));
            assert.ok(document.getText().endsWith(suffix));
            previous = expected;
          }
          assert.ok(document.getText().includes(unit.repeat(2) + 'int x;' + eol));
          assert.ok(document.getText().includes(unit.repeat(2) + 'if (x == 1) {' + eol));
          assert.ok(document.getText().includes(unit.repeat(3) + 'printf("%d", x);' + eol));
          assert.equal(editor.selection.active.character, unit.length * 3);
          assert.equal(fs.readFileSync(file, 'utf8'), initial);
          await vscode.commands.executeCommand('undo');
          assert.ok(!document.getText().includes('printf("%d", x);'));
          assert.ok(document.getText().includes('if (x == 1)'));
          await vscode.commands.executeCommand('undo');
          assert.ok(!document.getText().includes('if (x == 1)'));
          await vscode.commands.executeCommand('redo');
          await vscode.commands.executeCommand('redo');
          assert.equal(document.getText(), previous);
        });
      }
    }
    // Lot 26 : le document n'est plus vide — un bloc si est une instruction, et
    // C17 ne l'admet qu'en corps de fonction. Le sujet subsiste : C-A n'invente
    // aucun main, et le seul présent est celui que l'auteur a écrit.
    await test('lot 9 : IF complet sans main implicite et annulation', async () => {
      const { document, editor } = await fixture(CORPS);
      await preview('Crée un bloc si "actif".');
      const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
      const expected = after.getText();
      assert.equal(document.getText(), CORPS);
      await inserted();
      assert.equal(document.getText(), expected);
      assert.equal(document.getText().split('int main(void) {').length - 1, 1);
      assert.equal(editor.selection.active.character, 4);
      await vscode.commands.executeCommand('undo');
      assert.equal(document.getText(), CORPS);
      await vscode.commands.executeCommand('redo');
      assert.equal(document.getText(), expected);
    });
    await test('lot 9 : IF périmé ne s’applique pas', async () => {
      const { document, editor } = await fixture(CORPS);
      await preview('Crée un bloc si "age > 0".');
      await editor.edit(builder => builder.insert(new vscode.Position(0, 0), ' '));
      await waitFor(() => api.inspect()?.phase === 'stale', 'IF périmé');
      assert.ok(!api.inspect().choices.includes('Insérer'));
      await cancel();
      assert.equal(document.getText(), ' ' + CORPS);
    });
    await test('lot 9 : avis historiques dans les conditions, sans blocage', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée un bloc si "7 / 0 < 5.0 % 2".');
      assert.deepEqual(api.inspect().advisories.map(item => item.code), ['INTEGER_ZERO_DIVISOR', 'FLOAT_REMAINDER_OPERAND']);
      assert.ok(api.inspect().choices.includes('Insérer'));
      await inserted();
      assert.ok(document.getText().includes('if ((7 / 0) < (5.0 % 2))'));
    });
    await test('lot 9 : affectation refusée, aucune insertion ou correction', async () => {
      const { document } = await fixture();
      await start('Crée un bloc si "age = 18".');
      await accept();
      assert.equal(api.inspect().ui, 'input');
      assert.equal(api.inspect().diagnostic.code, 'ASSIGNMENT_IN_CONDITION');
      assert.equal(document.getText(), '');
      await cancel();
    });
    await test('lot 10 : précédence et informations passives sans Warning', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée un bloc si "!a == b || c && d".');
      assert.deepEqual(api.inspect().advisories, []);
      assert.equal(api.inspect().information.length, 3);
      assert.match(api.inspect().pedagogyEntry, /SHORT_CIRCUIT_AND/);
      assert.match(api.inspect().pedagogyEntry, /LOGICAL_NOT/);
      assert.ok(!api.inspect().confirmationTitle.includes('avertissement'));
      await inserted();
      assert.ok(document.getText().includes('if ((((!a) == b) || (c && d)))'));
    });
    for (const eol of ['\n', '\r\n']) {
      await test(`lot 10 : chaîne progressive, cible et annulations ${JSON.stringify(eol)}`, async () => {
        const before = 'int main(void) {' + eol + '    if (a) {' + eol + '    }' + eol + '    ' + eol + '    int apres = 9;' + eol + '}' + eol;
        const { document, editor, file } = await fixture(before, before.indexOf('    int apres') - eol.length);
        for (const source of ['Ajoute une branche sinon si "b && !c".', 'Ajoute une branche sinon si "d".', 'Ajoute une branche sinon.']) {
          const previous = document.getText();
          await preview(source);
          assert.match(api.inspect().attachmentLabel, /ligne 2/);
          const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
          const expected = after.getText();
          assert.equal(document.getText(), previous);
          await inserted();
          assert.equal(document.getText(), expected);
          assert.equal(editor.selection.active.character, 8);
          const emptyBranch = document.getText();
          await preview('Affiche le texte "branche".');
          await inserted();
          const filled = document.getText();
          await vscode.commands.executeCommand('undo');
          assert.equal(document.getText(), emptyBranch);
          await vscode.commands.executeCommand('undo');
          assert.equal(document.getText(), previous);
          await vscode.commands.executeCommand('redo');
          await vscode.commands.executeCommand('redo');
          assert.equal(document.getText(), filled);
          // A manual empty line after the branch is an explicit student action.
          const cursor = document.offsetAt(editor.selection.active);
          const closing = document.getText().indexOf('    }' + eol, cursor);
          const offset = closing + 5 + eol.length;
          await editor.edit(builder => builder.insert(document.positionAt(offset), '    ' + eol));
          const position = document.positionAt(offset + 4);
          editor.selection = new vscode.Selection(position, position);
          await delay(100);
        }
        assert.ok(document.getText().endsWith('    int apres = 9;' + eol + '}' + eol));
        assert.equal(fs.readFileSync(file, 'utf8'), before);
        await start('Ajoute une branche sinon si "x".');
        await accept();
        assert.equal(api.inspect().diagnostic.code, 'BRANCH_AFTER_ELSE');
        await cancel();
      });
    }
    await test('lot 10 : rattachement imbriqué explicite', async () => {
      const before = 'int main(void) {\n    if (outer) {\n        if (inner) {\n        }\n        \n    }\n    \n}\n';
      const { document, editor } = await fixture(before, before.indexOf('        \n') + 8);
      await preview('Ajoute une branche sinon.');
      assert.match(api.inspect().attachmentLabel, /ligne 3/);
      await inserted();
      const outside = document.getText().lastIndexOf('    \n') + 4;
      const position = document.positionAt(outside);
      editor.selection = new vscode.Selection(position, position);
      await delay(100);
      await preview('Ajoute une branche sinon.');
      assert.match(api.inspect().attachmentLabel, /ligne 2/);
      await inserted();
      assert.ok(document.getText().includes('        else {'));
      assert.ok(document.getText().includes('\n    else {'));
    });
    await test('lot 10 : branche isolée et branche existante refusées', async () => {
      let fixtureState = await fixture();
      await start('Ajoute une branche sinon.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.equal(fixtureState.document.getText(), '');
      await cancel();
      const text = 'if (a) {\n}\n\nelse {\n}\n';
      fixtureState = await fixture(text, text.indexOf('\n\n') + 1);
      await start('Ajoute une branche sinon.');
      await accept();
      assert.equal(api.inspect().diagnostic.code, 'BRANCH_NOT_AT_CHAIN_END');
      assert.equal(fixtureState.document.getText(), text);
      await cancel();
    });
    await test('lot 10 : branche périmée sans redirection de cible', async () => {
      const { document, editor } = await fixture('if (a) {\n}\n');
      await preview('Ajoute une branche sinon.');
      await editor.edit(builder => builder.insert(new vscode.Position(0, 0), '// changé\n'));
      await waitFor(() => api.inspect()?.phase === 'stale', 'branche périmée');
      assert.ok(!api.inspect().choices.includes('Insérer'));
      await cancel();
      assert.ok(!document.getText().includes('else'));
    });
    await test('lot 10 : court-circuit ne supprime pas les avis calcul', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée un bloc si "0 && 7 / 0 || 5.0 % 2".');
      assert.equal(api.inspect().advisories.length, 2);
      assert.equal(api.inspect().information.length, 2);
      assert.match(api.inspect().pedagogyEntry, /FLOAT_REMAINDER_OPERAND/);
      assert.match(api.inspect().pedagogyEntry, /SHORT_CIRCUIT_OR/);
      assert.equal(document.getText(), CORPS);
      await cancel();
    });
    for (const eol of ['\n', '\r\n']) {
      await test(`lot 11A : boucle, curseur intérieur, annuler puis rétablir ${JSON.stringify(eol)}`, async () => {
        const before = 'int main(void) {' + eol + '    int i = 0;' + eol + '    ' + eol + '    int apres = 9;' + eol + '}' + eol;
        const { document, editor, file } = await fixture(before, before.indexOf('    ' + eol) + 4);
        await preview('Crée une boucle tant que "i < limite".');
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        const expected = after.getText();
        // The preview alone never touches the document.
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected);
        assert.ok(document.getText().includes('    while (i < limite) {'));
        // Cursor is inside the empty body, one unit past the base indent.
        assert.equal(editor.selection.active.character, 8);
        const emptyLoop = document.getText();
        // Body content is a separate, separately undoable operation.
        await preview('Affiche le texte "tour".');
        await inserted();
        const filled = document.getText();
        assert.ok(filled.includes('        printf("%s", "tour");'));
        await vscode.commands.executeCommand('undo');
        assert.equal(document.getText(), emptyLoop);
        await vscode.commands.executeCommand('undo');
        assert.equal(document.getText(), before);
        await vscode.commands.executeCommand('redo');
        await vscode.commands.executeCommand('redo');
        assert.equal(document.getText(), filled);
        // Nothing after the loop was absorbed, and nothing was written to disk.
        assert.ok(document.getText().endsWith('    int apres = 9;' + eol + '}' + eol));
        assert.equal(fs.readFileSync(file, 'utf8'), before);
      });
    }
    await test('lot 11A : WHILE_PRETEST journalisé en information, sans Warning', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée une boucle tant que "i < limite && !suspendu".');
      assert.deepEqual(api.inspect().advisories, []);
      assert.equal(api.inspect().information.length, 3);
      assert.equal(api.inspect().information[0].code, 'WHILE_PRETEST');
      assert.match(api.inspect().pedagogyEntry, /WHILE_PRETEST \[information\]/);
      assert.match(api.inspect().pedagogyEntry, /SHORT_CIRCUIT_AND/);
      // An information never becomes a warning on the confirmation title.
      assert.ok(!api.inspect().confirmationTitle.includes('avertissement'));
      assert.ok(!/boucle infinie|terminaison garantie/u.test(api.inspect().pedagogyEntry));
      await inserted();
      assert.ok(document.getText().includes('while (((i < limite) && (!suspendu))) {'));
    });
    await test('lot 11A : avis de calcul conservé dans la condition de boucle', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée une boucle tant que "i < 10 / 0".');
      assert.equal(api.inspect().advisories.length, 1);
      assert.equal(api.inspect().advisories[0].code, 'INTEGER_ZERO_DIVISOR');
      assert.match(api.inspect().confirmationTitle, /avertissement/);
      assert.match(api.inspect().pedagogyEntry, /INTEGER_ZERO_DIVISOR/);
      assert.match(api.inspect().pedagogyEntry, /WHILE_PRETEST/);
      assert.equal(document.getText(), CORPS);
      await cancel();
    });
    for (const [phrase, code] of [
      ['Crée une boucle tant que', 'MISSING_CONDITION'],
      ['Crée une boucle tant que "i = 3".', 'ASSIGNMENT_IN_CONDITION'],
      ['Crée une boucle jusqu’à "i == 3".', 'UNKNOWN_FORMULATION'],
      ['Crée une boucle avec test finale tant que "i < 3".', 'UNKNOWN_FORMULATION'],
      // « Sors de la boucle la plus intérieure. » a quitté cette liste : le lot
      // 11D en a fait une formulation VALIDE, qui se traduit en « break; ». Son
      // refus a donc changé d'étape — de la traduction vers le placement — et
      // cette attente datait du lot 11A. Elle échouait depuis le lot 11D sans
      // que personne le voie, la suite hôte n'ayant pas pu s'exécuter. Le refus
      // au placement est vérifié juste en dessous.
    ]) {
      await test(`lot 11A refus sans insertion : ${code} ${phrase.slice(0, 32)}`, async () => {
        const { document } = await fixture();
        await start(phrase);
        await accept();
        assert.equal(api.inspect().ui, 'input');
        assert.equal(api.inspect().diagnostic.stage, 'translation');
        assert.equal(api.inspect().diagnostic.code, code);
        assert.equal(document.getText(), '');
        await cancel();
      });
    }
    await test('lot 11D : un transfert hors boucle est refusé au placement, pas à la traduction', async () => {
      const { document } = await fixture();
      await start('Sors de la boucle la plus intérieure.');
      await accept();
      assert.equal(api.inspect().ui, 'input');
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.equal(api.inspect().diagnostic.code, 'LOOP_TARGET_NOT_FOUND');
      assert.equal(document.getText(), '');
      await cancel();
    });
    await test('lot 11A : boucles imbriquées puis branche refusée après la boucle', async () => {
      const before = 'int main(void) {\n    \n}\n';
      const { document, editor } = await fixture(before, before.indexOf('    \n') + 4);
      await preview('Crée une boucle tant que "i < limite".');
      await inserted();
      await preview('Crée une boucle tant que "j < 2".');
      await inserted();
      assert.ok(document.getText().includes('    while (i < limite) {'));
      assert.ok(document.getText().includes('        while (j < 2) {'));
      assert.equal(editor.selection.active.character, 12);
      // Returning to the outer body is an explicit student action.
      const text = document.getText();
      const closing = text.indexOf('        }\n');
      const offset = closing + 10;
      await editor.edit(builder => builder.insert(document.positionAt(offset), '        \n'));
      const position = document.positionAt(offset + 8);
      editor.selection = new vscode.Selection(position, position);
      await delay(100);
      // A loop is not an if chain: no else may attach to it, and C-A never
      // climbs to some neighbouring if instead.
      await start('Ajoute une branche sinon.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.ok(!document.getText().includes('else'));
      await cancel();
    });
    for (const eol of ['\n', '\r\n']) {
      await test(`lot 11B : do/while, fermeture avec condition et annulation ${JSON.stringify(eol)}`, async () => {
        const before = 'int main(void) {' + eol + '    ' + eol + '}' + eol;
        const { document, editor, file } = await fixture(before, before.indexOf('    ' + eol) + 4);
        await preview('Crée une boucle avec test final tant que "i < limite".');
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        const expected = after.getText();
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected);
        assert.ok(document.getText().includes('    do {'));
        assert.ok(document.getText().includes('    } while (i < limite);'));
        assert.equal(editor.selection.active.character, 8);
        const empty = document.getText();
        await preview('Affiche le texte "tour".');
        await inserted();
        await vscode.commands.executeCommand('undo');
        assert.equal(document.getText(), empty);
        await vscode.commands.executeCommand('undo');
        assert.equal(document.getText(), before);
        assert.equal(fs.readFileSync(file, 'utf8'), before);
      });
    }
    await test('lot 11B : DO_WHILE_POSTTEST journalisé, sans Warning', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée une boucle avec test final tant que "i < limite && !fini".');
      assert.deepEqual(api.inspect().advisories, []);
      assert.equal(api.inspect().information[0].code, 'DO_WHILE_POSTTEST');
      assert.match(api.inspect().pedagogyEntry, /DO_WHILE_POSTTEST \[information\]/);
      assert.ok(!api.inspect().confirmationTitle.includes('avertissement'));
      await inserted();
      assert.ok(document.getText().includes('} while (((i < limite) && (!fini)));'));
    });
    await test('lot 11B : aucune branche sinon ne se rattache à une fermeture do/while', async () => {
      const text = 'do {\n} while (a);\n\n';
      const { document } = await fixture(text, text.length);
      await start('Ajoute une branche sinon.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.equal(document.getText(), text);
      await cancel();
    });
    for (const eol of ['\n', '\r\n']) {
      await test(`lot 11C : for à trois clauses explicites ${JSON.stringify(eol)}`, async () => {
        const before = 'int main(void) {' + eol + '    int i;' + eol + '    ' + eol + '}' + eol;
        const { document, editor, file } = await fixture(before, before.indexOf('    ' + eol) + 4);
        await preview('Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".');
        const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
        const expected = after.getText();
        assert.equal(document.getText(), before);
        await inserted();
        assert.equal(document.getText(), expected);
        assert.ok(document.getText().includes('    for (i = 0; i < 3; i = (i + 1)) {'));
        // The declaration the student wrote is untouched, and none is added.
        assert.ok(document.getText().includes('    int i;'));
        assert.equal((document.getText().match(/int i;/gu) ?? []).length, 1);
        assert.ok(!document.getText().includes('i++'));
        assert.equal(editor.selection.active.character, 8);
        await vscode.commands.executeCommand('undo');
        assert.equal(document.getText(), before);
        assert.equal(fs.readFileSync(file, 'utf8'), before);
      });
    }
    await test('lot 11C : FOR_CLAUSE_ORDER journalisé, sans Warning', async () => {
      await fixture(CORPS);
      await preview('Crée une boucle pour i de valeur initiale "0" tant que "i < n && actif" avec mise à jour "i + pas".');
      assert.deepEqual(api.inspect().advisories, []);
      assert.equal(api.inspect().information[0].code, 'FOR_CLAUSE_ORDER');
      assert.match(api.inspect().pedagogyEntry, /FOR_CLAUSE_ORDER \[information\]/);
      assert.ok(!api.inspect().confirmationTitle.includes('avertissement'));
      await inserted();
    });
    await test('lot 11C : avis dans la clause de mise à jour, sans insertion forcée', async () => {
      const { document } = await fixture(CORPS);
      await preview('Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 10 / 0".');
      assert.equal(api.inspect().advisories.length, 1);
      assert.equal(api.inspect().advisories[0].code, 'INTEGER_ZERO_DIVISOR');
      assert.match(api.inspect().confirmationTitle, /avertissement/);
      assert.equal(document.getText(), CORPS);
      await cancel();
    });
    for (const [phrase, code] of [
      ['Crée une boucle pour', 'INCOMPLETE_INSTRUCTION'],
      ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec incrément "i + 1".', 'UNKNOWN_FORMULATION'],
      ['Crée une boucle pour i de valeur initiale "0" tant que "" avec mise à jour "i + 1".', 'MISSING_CONDITION'],
      ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i++".', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
    ]) {
      await test(`lot 11C refus sans insertion : ${code}`, async () => {
        const { document } = await fixture();
        await start(phrase);
        await accept();
        assert.equal(api.inspect().ui, 'input');
        assert.equal(api.inspect().diagnostic.code, code);
        assert.equal(document.getText(), '');
        await cancel();
      });
    }
    await test('lot 11D : break dans une boucle, cible affichée et annulation', async () => {
      const before = 'int main(void) {\n    while (actif) {\n        \n    }\n}\n';
      const { document, editor, file } = await fixture(before, before.indexOf('        \n') + 8);
      await preview('Sors de la boucle la plus intérieure.');
      assert.match(api.inspect().attachmentLabel, /ligne 2/);
      assert.deepEqual(api.inspect().information, []);
      const after = await vscode.workspace.openTextDocument(vscode.Uri.parse(api.inspect().preview.after));
      const expected = after.getText();
      assert.equal(document.getText(), before);
      await inserted();
      assert.equal(document.getText(), expected);
      assert.ok(document.getText().includes('        break;'));
      assert.ok(!document.getText().includes('return'));
      assert.ok(!document.getText().includes('goto'));
      await vscode.commands.executeCommand('undo');
      assert.equal(document.getText(), before);
      assert.equal(fs.readFileSync(file, 'utf8'), before);
      void editor;
    });
    await test('lot 11D : continue traverse un switch, break y est refusé', async () => {
      const before = 'while (actif) {\n    switch (x) {\n    case 1:\n        \n    }\n}\n';
      let state = await fixture(before, before.indexOf('        \n') + 8);
      await start('Sors de la boucle la plus intérieure.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.equal(api.inspect().diagnostic.code, 'BREAK_TARGET_IS_SWITCH');
      assert.equal(state.document.getText(), before);
      await cancel();
      state = await fixture(before, before.indexOf('        \n') + 8);
      await preview('Passe à l’itération suivante de la boucle la plus intérieure.');
      assert.match(api.inspect().attachmentLabel, /ligne 1/);
      await inserted();
      assert.ok(state.document.getText().includes('        continue;'));
    });
    await test('lot 11D : un break intérieur ne sort pas de la boucle extérieure', async () => {
      const before = 'while (outer) {\n    while (inner) {\n        \n    }\n}\n';
      const { document } = await fixture(before, before.indexOf('        \n') + 8);
      await preview('Sors de la boucle la plus intérieure.');
      // The label names the inner loop, on line 2, never the outer one.
      assert.match(api.inspect().attachmentLabel, /ligne 2/);
      assert.match(api.inspect().attachmentLabel, /while \(inner\)/);
      await inserted();
      assert.ok(document.getText().includes('        break;'));
    });
    await test('lot 11D : transfert hors boucle et corps sans accolades refusés', async () => {
      for (const [text, code] of [['int main(void) {\n    \n}\n', 'LOOP_TARGET_NOT_FOUND'],
        ['while (actif)\n    \n', 'UNBRACED_LOOP_BODY']]) {
        const { document } = await fixture(text, text.indexOf('    \n', 10) + 4);
        await start('Sors de la boucle la plus intérieure.');
        await accept();
        assert.equal(api.inspect().diagnostic.code, code, text);
        assert.equal(document.getText(), text);
        await cancel();
      }
    });
    await test('lot 11D : structure englobante modifiée après aperçu : plan périmé', async () => {
      const before = 'while (actif) {\n    \n}\n';
      const { document, editor } = await fixture(before, before.indexOf('    \n') + 4);
      await preview('Sors de la boucle la plus intérieure.');
      await editor.edit(builder => builder.replace(new vscode.Range(0, 0, 0, 5), 'switch'));
      await waitFor(() => api.inspect()?.phase === 'stale', 'plan de transfert périmé');
      assert.ok(!api.inspect().choices.includes('Insérer'));
      await cancel();
      assert.ok(!document.getText().includes('break'));
    });
    await test('lot 12 : fonction, paramètres, retour et appel', async () => {
      const { document, editor, file } = await fixture();
      await preview('Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.');
      assert.equal(api.inspect().information[0].code, 'FUNCTION_SCOPE');
      assert.equal(api.inspect().information[1].code, 'PARAMETERS_BY_VALUE');
      assert.deepEqual(api.inspect().advisories, []);
      await inserted();
      assert.ok(document.getText().includes('int somme(int a, int b) {'));
      assert.equal(editor.selection.active.character, 4);
      await preview('Retourne le résultat de "a + b".');
      assert.equal(api.inspect().information[0].code, 'RETURN_ENDS_FUNCTION');
      assert.match(api.inspect().attachmentLabel, /ligne 2/);
      await inserted();
      assert.ok(document.getText().includes('    return (a + b);'));
      // No return and no include was ever added on its own.
      assert.equal((document.getText().match(/return/gu) ?? []).length, 1);
      assert.ok(!document.getText().includes('#include'));
      assert.equal(fs.readFileSync(file, 'utf8'), '');
    });
    await test('lot 12 : contrat de retour refusé sans insertion', async () => {
      for (const [text, phrase, code] of [
        ['void f(void) {\n    \n}\n', 'Retourne la valeur 0.', 'RETURN_IN_VOID_FUNCTION'],
        ['int f(void) {\n    \n}\n', 'Retourne.', 'RETURN_NEEDS_VALUE'],
        ['int x;\n\n', 'Retourne.', 'NO_ENCLOSING_FUNCTION'],
        ['long f(void) {\n    \n}\n', 'Retourne la valeur 0.', 'UNSUPPORTED_RETURN_TYPE'],
      ]) {
        const { document } = await fixture(text, text.indexOf('    \n') === -1 ? text.length : text.indexOf('    \n') + 4);
        await start(phrase);
        await accept();
        assert.equal(api.inspect().diagnostic.stage, 'placement', `${text} / ${phrase}`);
        assert.equal(api.inspect().diagnostic.code, code, `${text} / ${phrase}`);
        assert.equal(document.getText(), text);
        await cancel();
      }
    });
    await test('lot 12 : appel avec arguments, avis conservé et cible affichée', async () => {
      const { document } = await fixture('int main(void) {\n    \n}\n', 21);
      await preview('Affecte à total le résultat de l’appel de somme avec "2" et "3".');
      assert.equal(api.inspect().information[0].code, 'CALL_NOT_RESOLVED');
      await inserted();
      assert.ok(document.getText().includes('    total = somme(2, 3);'));
      await preview('Appelle f avec "10 / 0".');
      assert.equal(api.inspect().advisories.length, 1);
      assert.match(api.inspect().confirmationTitle, /avertissement/);
      await cancel();
    });
    await test('lot 12 : définition de fonction imbriquée refusée, MAIN inchangé', async () => {
      const nested = 'int main(void) {\n    \n}\n';
      let state = await fixture(nested, nested.indexOf('    \n') + 4);
      await start('Crée une fonction nommée f qui retourne un int.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'placement');
      assert.equal(api.inspect().diagnostic.code, 'FUNCTION_DEFINITION_NESTED');
      assert.equal(state.document.getText(), nested);
      await cancel();
      // MAIN is aligned on the same rule, by the approved exception to its
      // lot 2 contract: refused on the very same line.
      state = await fixture(nested, nested.indexOf('    \n') + 4);
      await start('Crée la fonction principale.');
      await accept();
      assert.equal(api.inspect().diagnostic.code, 'FUNCTION_DEFINITION_NESTED');
      assert.equal(state.document.getText(), nested);
      await cancel();
      // At file scope, both definitions are accepted.
      state = await fixture('int x;\n\n', 7);
      await preview('Crée une fonction nommée f qui retourne un int.');
      await inserted();
      assert.ok(state.document.getText().includes('int f(void) {'));
      state = await fixture('int x;\n\n', 7);
      await preview('Crée la fonction principale.');
      await inserted();
      assert.ok(state.document.getText().includes('int main(void) {'));
      // Other historical intentions still ignore braces entirely.
      state = await fixture(nested, nested.indexOf('    \n') + 4);
      await preview('Déclare un entier nommé age.');
      await inserted();
      assert.ok(state.document.getText().includes('    int age;'));
    });
    // Lot S4 — la souplesse linguistique DANS l'editeur reel. Le reglage est
    // remis a false apres chaque scenario : le mode strict est la reference,
    // et un scenario qui laisserait le mode souple actif contaminerait les suivants.
    async function avecSouplesse(body) {
      try {
        await vscode.workspace.getConfiguration('c-a').update('souplesse', true, vscode.ConfigurationTarget.Global);
        await waitFor(() => vscode.workspace.getConfiguration('c-a').get('souplesse') === true, 'reglage souplesse actif');
        await body();
      } finally {
        await vscode.workspace.getConfiguration('c-a').update('souplesse', false, vscode.ConfigurationTarget.Global);
      }
    }
    await test('lot S4 : mode strict par defaut, une variante reste refusee', async () => {
      assert.equal(vscode.workspace.getConfiguration('c-a').get('souplesse'), false);
      const state = await fixture(CORPS);
      await start('Afficher la valeur de age.');
      await accept();
      assert.equal(api.inspect().souple, false);
      assert.equal(api.inspect().diagnostic.stage, 'translation');
      assert.equal(api.inspect().normalisation, undefined);
      assert.equal(state.document.getText(), CORPS);
    });
    await test('lot S4 : la commande bascule le reglage, dans les deux sens', async () => {
      assert.equal(vscode.workspace.getConfiguration('c-a').get('souplesse'), false);
      try {
        await vscode.commands.executeCommand('c-a.souplesse');
        await waitFor(() => vscode.workspace.getConfiguration('c-a').get('souplesse') === true, 'souplesse activee');
        await vscode.commands.executeCommand('c-a.souplesse');
        await waitFor(() => vscode.workspace.getConfiguration('c-a').get('souplesse') === false, 'souplesse desactivee');
      } finally {
        await vscode.workspace.getConfiguration('c-a').update('souplesse', false, vscode.ConfigurationTarget.Global);
      }
    });
    await test('lot S4 : une variante inseree garde LA PHRASE DE L UTILISATEUR en commentaire', async () => {
      await avecSouplesse(async () => {
        const state = await fixture(CORPS);
        await preview('Afficher la valeur de age.');
        assert.equal(api.inspect().souple, true);
        assert.equal(api.inspect().normalisation.canonique, 'Affiche la valeur de age.');
        // L'utilisateur VOIT que le mode souple a lu une autre phrase.
        assert.match(api.inspect().confirmationTitle, /mode souple/);
        await inserted();
        assert.equal(state.document.getText(),
          CORPS + '// Afficher la valeur de age.\nprintf("%d", age);\n\n');
        // Une seule modification annulable, comme en mode strict.
        await vscode.commands.executeCommand('undo');
        await waitFor(() => state.document.getText() === CORPS, 'annulation en une fois');
      });
    });
    await test('lot S4 : une phrase ambigue est refusee dans l editeur', async () => {
      await avecSouplesse(async () => {
        const state = await fixture(CORPS);
        await start('Montre c.');
        await accept();
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.stage, 'variantes');
        assert.equal(diagnostic.code, 'AMBIGUITE_NON_RESOLUE');
        assert.match(String(api.inspect().validation), /Ambigu/);
        assert.equal(state.document.getText(), CORPS);
      });
    });
    await test('lot S4 : la normalisation est journalisee dans le canal Pedagogie', async () => {
      await avecSouplesse(async () => {
        await fixture(CORPS);
        await preview('Afficher la valeur de age.');
        assert.match(api.inspect().pedagogyEntry, /NORMALISATION/);
        assert.match(api.inspect().pedagogyEntry, /Affiche la valeur de age\./);
        await cancel();
      });
    });
    // Lot P4a — Python dans l'editeur reel. Le reglage c-a.python est remis a
    // false apres chaque scenario : il est desactive par defaut, et un
    // scenario qui le laisserait actif contaminerait les suivants.
    async function fixturePython(text = '', cursor = text.length) {
      const file = path.join(workspace, `scenario-${++fixtureNumber}.py`);
      fs.writeFileSync(file, text, 'utf8');
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
      const editor = await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
      editor.options = { insertSpaces: true, tabSize: 4, indentSize: 'tabSize' };
      const position = document.positionAt(cursor);
      editor.selection = new vscode.Selection(position, position);
      documents.push(document);
      await delay(100);
      return { file, document, editor };
    }
    async function avecPython(body) {
      try {
        await vscode.workspace.getConfiguration('c-a').update('python', true, vscode.ConfigurationTarget.Global);
        await waitFor(() => vscode.workspace.getConfiguration('c-a').get('python') === true, 'reglage python actif');
        await body();
      } finally {
        await vscode.workspace.getConfiguration('c-a').update('python', false, vscode.ConfigurationTarget.Global);
      }
    }
    await test('lot P4a : sans le reglage, un fichier .py est refuse', async () => {
      assert.equal(vscode.workspace.getConfiguration('c-a').get('python'), false);
      const state = await fixturePython('');
      await vscode.commands.executeCommand('c-a.translate', 'Cree un entier nomme age de valeur 20.');
      // Aucune session ne s'ouvre : la commande a refuse la cible.
      await delay(300);
      assert.equal(api.inspect(), undefined);
      assert.equal(state.document.getText(), '');
    });
    await test('lot P4a : avec le reglage, une instruction Python est inseree', async () => {
      await avecPython(async () => {
        const state = await fixturePython('');
        await preview('Cr\u00e9e un entier nomm\u00e9 age de valeur 20.');
        assert.equal(api.inspect().langage, 'python');
        await inserted();
        // La fin de ligne est celle du DOCUMENT : sur Windows, un fichier vide
        // ouvre en CRLF, et le lot P4a a justement corrige le placement qui
        // ecrivait LF sans regarder.
        const fin = state.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        assert.equal(state.document.getText(),
          '# Cr\u00e9e un entier nomm\u00e9 age de valeur 20.' + fin + 'age = 20');
        // Une seule modification annulable.
        await vscode.commands.executeCommand('undo');
        await waitFor(() => state.document.getText() === '', 'annulation en une fois');
      });
    });
    await test('lot P4a : un bloc Python laisse le curseur dans le corps', async () => {
      await avecPython(async () => {
        const state = await fixturePython('');
        await preview('Cr\u00e9e un bloc si "x > 0".');
        await inserted();
        const texte = state.document.getText();
        const fin = state.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        assert.equal(texte, '# Cr\u00e9e un bloc si "x > 0".' + fin + 'if x > 0:');
        // Aucun `pass` n'a ete ecrit : le corps est a l'etudiant.
        assert.ok(!texte.includes('pass'));
      });
    });
    await test('lot P4a : une intention que Python ne porte pas est refusee, et nommee', async () => {
      await avecPython(async () => {
        const state = await fixturePython('');
        await start('D\u00e9clare un entier nomm\u00e9 n.');
        await accept();
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.stage, 'rendu');
        assert.match(String(api.inspect().validation), /Langage cible/);
        assert.equal(state.document.getText(), '');
      });
    });
    await test('lot P4a : le .c continue de fonctionner quand Python est actif', async () => {
      await avecPython(async () => {
        const state = await fixture(CORPS);
        await preview('Affiche la valeur de age.');
        assert.equal(api.inspect().langage, 'c17');
        await inserted();
        assert.ok(state.document.getText().includes('printf("%d", age);'));
      });
    });
    // Lot P4 — les intentions NATIVES de Python, dans l'editeur reel.
    await test('lot P4 : une intention native est inseree, avec son information', async () => {
      await avecPython(async () => {
        const state = await fixturePython('');
        await preview('Cr\u00e9e une liste nomm\u00e9e notes avec les valeurs "12", "15" et "9".');
        const codes = api.inspect().information.map(i => i.code);
        assert.ok(codes.includes('PY_LIST_IS_MUTABLE'), codes.join(', '));
        assert.ok(codes.every(code => code.startsWith('PY_')), codes.join(', '));
        await inserted();
        const fin = state.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        assert.equal(state.document.getText(),
          '# Cr\u00e9e une liste nomm\u00e9e notes avec les valeurs "12", "15" et "9".'
          + fin + 'notes: list = [12, 15, 9]');
      });
    });
    await test('lot P4 : une boucle native place le curseur dans son corps', async () => {
      await avecPython(async () => {
        const state = await fixturePython('');
        await preview('Cr\u00e9e une boucle pour chaque note de notes.');
        await inserted();
        const texte = state.document.getText();
        assert.ok(texte.endsWith('for note in notes:'), texte);
        assert.ok(!texte.includes('pass'));
      });
    });
    await test('lot P4 : une liste sans contenu est refusee, et rien n est invente', async () => {
      await avecPython(async () => {
        const state = await fixturePython('');
        await start('Cr\u00e9e une liste nomm\u00e9e notes.');
        await accept();
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.code, 'MISSING_LIST_CONTENT');
        assert.equal(diagnostic.stage, 'translation');
        assert.equal(state.document.getText(), '');
      });
    });
    await test('lot P4 : une phrase native est refusee dans un fichier .c', async () => {
      // La propriete qui garantit que le moteur C17 n'a pas bouge : le
      // catalogue natif de Python n'est atteignable que par un .py.
      const state = await fixture(CORPS);
      await start('Cr\u00e9e une liste vide nomm\u00e9e notes.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'translation');
      assert.equal(state.document.getText(), CORPS);
    });
    // ================= Java-A, lot J10 ================================
    //
    // La suite ne contenait aucun scenario Java : la session etait couverte
    // par 14 tests Node, ce qui n'est pas la meme chose. Ici c'est l'IHM
    // REELLE -- InputBox, diff, QuickPick, TextEditor.edit -- qui ecrit.
    const EOL = process.platform === 'win32' ? '\r\n' : '\n';
    async function fixtureJava(text = '', cursor = text.length) {
      const file = path.join(workspace, `Eleve${++fixtureNumber}.java`);
      fs.writeFileSync(file, text, 'utf8');
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
      const editor = await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
      editor.options = { insertSpaces: true, tabSize: 4, indentSize: 'tabSize' };
      const position = document.positionAt(cursor);
      editor.selection = new vscode.Selection(position, position);
      documents.push(document);
      await delay(100);
      return { file, document, editor };
    }
    async function avecJava(body) {
      try {
        await vscode.workspace.getConfiguration('c-a').update('java', true, vscode.ConfigurationTarget.Global);
        await waitFor(() => vscode.workspace.getConfiguration('c-a').get('java') === true, 'reglage java actif');
        await body();
      } finally {
        await vscode.workspace.getConfiguration('c-a').update('java', false, vscode.ConfigurationTarget.Global);
      }
    }
    await test('lot J10 : sans le reglage, un fichier .java est refuse', async () => {
      assert.equal(vscode.workspace.getConfiguration('c-a').get('java'), false);
      const state = await fixtureJava('');
      await vscode.commands.executeCommand('c-a.translate', 'Cree une classe nommee Eleve.');
      // Aucune session ne s'ouvre : la commande a refuse la cible.
      await delay(300);
      assert.equal(api.inspect(), undefined);
      assert.equal(state.document.getText(), '');
    });
    await test('lot J10 : avec le reglage, une classe Java est inseree', async () => {
      await avecJava(async () => {
        const state = await fixtureJava('');
        await preview('Crée une classe nommée Eleve.');
        assert.equal(api.inspect().langage, 'java');
        await inserted();
        const eol = state.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        assert.equal(state.document.getText(),
          '// Crée une classe nommée Eleve.' + eol + 'public class Eleve {' + eol + '    ' + eol + '}');
        // Une seule modification annulable.
        await vscode.commands.executeCommand('undo');
        await waitFor(() => state.document.getText() === '', 'annulation en une fois');
      });
    });
    await test('lot J10 : rien d executable a la portee fichier', async () => {
      // La lacune que le lot 26 avait trouvee en C17, refusee ici DES LE
      // DEPART : en Java, pas meme une affectation ne vit au fichier.
      await avecJava(async () => {
        const state = await fixtureJava('');
        await start('Affiche la valeur de n.');
        await accept();
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.code, 'PORTEE_INTERDITE');
        assert.equal(diagnostic.stage, 'placement');
        assert.equal(state.document.getText(), '');
      });
    });
    await test('lot J10 : un champ est insere dans un corps de classe', async () => {
      await avecJava(async () => {
        const corps = 'public class Eleve {' + EOL + EOL + '}' + EOL;
        const state = await fixtureJava(corps, corps.indexOf('}') - EOL.length);
        await preview('Ajoute un champ privé de type int nommé age.');
        // L'etiquette de rattachement montre la classe LUE du document.
        assert.equal(api.inspect().attachmentLabel, 'classe Eleve');
        await inserted();
        assert.ok(state.document.getText().includes('    private int age;'),
          JSON.stringify(state.document.getText()));
      });
    });
    await test('lot J10 : un constructeur prend le nom de sa classe, lu du document', async () => {
      await avecJava(async () => {
        const corps = 'public class Eleve {' + EOL + EOL + '}' + EOL;
        const state = await fixtureJava(corps, corps.indexOf('}') - EOL.length);
        await preview('Crée un constructeur qui prend un int nommé age.');
        await inserted();
        assert.ok(state.document.getText().includes('    public Eleve(int age) {'),
          JSON.stringify(state.document.getText()));
      });
    });
    await test('lot J10 : une information passive est journalisee', async () => {
      await avecJava(async () => {
        const corps = 'public class Eleve {' + EOL + EOL + '}' + EOL;
        await fixtureJava(corps, corps.indexOf('}') - EOL.length);
        await preview('Ajoute un champ privé de type int nommé age.');
        const codes = api.inspect().information.map(item => item.code);
        assert.ok(codes.includes('JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'), codes.join(', '));
        // Aucun avis de calcul : Java-A dit ces regles sur SON canal.
        assert.deepEqual(api.inspect().advisories, []);
      });
    });
    await test('lot J10 : une phrase native Java est refusee dans un fichier .c', async () => {
      // La propriete qui garantit que le moteur C17 n'a pas bouge : le
      // catalogue natif de Java n'est atteignable que par un .java.
      const state = await fixture(CORPS);
      await start('Crée une classe nommée Eleve.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'translation');
      assert.equal(state.document.getText(), CORPS);
    });
    // ================= SQL-A, lot S10 =================================
    //
    // L'IHM REELLE ecrit du SQL. Huit scenarios, dont trois qui n'ont
    // d'equivalent dans aucun autre langage : la composition d'une requete
    // par insertions pures, le refus d'une clause hors requete, et l'ordre
    // des clauses.
    async function fixtureSql(text = '', cursor = text.length) {
      const file = path.join(workspace, `essai${++fixtureNumber}.sql`);
      fs.writeFileSync(file, text, 'utf8');
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
      const editor = await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.One });
      editor.options = { insertSpaces: true, tabSize: 2, indentSize: 'tabSize' };
      const position = document.positionAt(cursor);
      editor.selection = new vscode.Selection(position, position);
      documents.push(document);
      await delay(100);
      return { file, document, editor };
    }
    async function avecSql(body) {
      try {
        await vscode.workspace.getConfiguration('c-a').update('sql', true, vscode.ConfigurationTarget.Global);
        await waitFor(() => vscode.workspace.getConfiguration('c-a').get('sql') === true, 'reglage sql actif');
        await body();
      } finally {
        await vscode.workspace.getConfiguration('c-a').update('sql', false, vscode.ConfigurationTarget.Global);
      }
    }
    await test('lot S10 : sans le reglage, un fichier .sql est refuse', async () => {
      assert.equal(vscode.workspace.getConfiguration('c-a').get('sql'), false);
      const state = await fixtureSql('');
      await vscode.commands.executeCommand('c-a.translate', 'Supprime la table eleves.');
      await delay(300);
      assert.equal(api.inspect(), undefined);
      assert.equal(state.document.getText(), '');
    });
    await test('lot S10 : avec le reglage, une instruction SQL est inseree', async () => {
      await avecSql(async () => {
        const state = await fixtureSql('');
        await preview('Supprime la table eleves.');
        assert.equal(api.inspect().langage, 'sql');
        await inserted();
        const eol = state.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        assert.equal(state.document.getText(),
          '-- Supprime la table eleves.' + eol + 'DROP TABLE eleves;');
        await vscode.commands.executeCommand('undo');
        await waitFor(() => state.document.getText() === '', 'annulation en une fois');
      });
    });
    await test('lot S10 : une requete ouvre un bloc, point-virgule seul sur sa ligne', async () => {
      await avecSql(async () => {
        const state = await fixtureSql('');
        await preview('Crée une requête qui lit la colonne nom de la table eleves.');
        await inserted();
        const texte = state.document.getText();
        assert.ok(/SELECT nom/u.test(texte), JSON.stringify(texte));
        assert.ok(/FROM eleves/u.test(texte), JSON.stringify(texte));
        assert.ok(/\r?\n\r?\n;$/u.test(texte), JSON.stringify(texte));
      });
    });
    await test('lot S10 : une clause s insere dans la requete, SANS rien remplacer', async () => {
      await avecSql(async () => {
        const requete = 'SELECT nom' + EOL + 'FROM eleves' + EOL + EOL + ';' + EOL;
        const state = await fixtureSql(requete, requete.indexOf(';') - EOL.length);
        await preview('Ne garde que les lignes où "age > 18".');
        assert.equal(api.inspect().attachmentLabel, 'requête ouverte');
        await inserted();
        const texte = state.document.getText();
        assert.ok(texte.includes('WHERE age > 18'), JSON.stringify(texte));
        // RIEN n'a ete remplace, et la ligne blanche du curseur a SURVECU :
        // c'est elle qui rend la clause suivante possible.
        assert.ok(texte.includes('SELECT nom'), texte);
        assert.ok(texte.includes('FROM eleves'), texte);
        assert.ok(/\r?\n\r?\n;/u.test(texte), JSON.stringify(texte));
      });
    });
    await test('lot S10 : deux clauses de suite, composees par l IHM', async () => {
      await avecSql(async () => {
        const requete = 'SELECT nom' + EOL + 'FROM eleves' + EOL + EOL + ';' + EOL;
        const state = await fixtureSql(requete, requete.indexOf(';') - EOL.length);
        await preview('Ne garde que les lignes où "age > 18".');
        await inserted();
        // Le curseur est reste sur la ligne blanche : on enchaine.
        const texte = state.document.getText();
        const blanche = texte.lastIndexOf(EOL + EOL + ';') + EOL.length;
        const editor = vscode.window.activeTextEditor;
        const position = editor.document.positionAt(blanche);
        editor.selection = new vscode.Selection(position, position);
        await delay(100);
        await preview('Exige aussi que "age < 60".');
        await inserted();
        const final = state.document.getText();
        assert.ok(final.includes('WHERE age > 18'), JSON.stringify(final));
        assert.ok(final.includes('AND age < 60'), JSON.stringify(final));
        assert.ok(final.indexOf('WHERE') < final.indexOf('AND age'), JSON.stringify(final));
      });
    });
    await test('lot S10 : une clause hors de toute requete est refusee', async () => {
      await avecSql(async () => {
        const state = await fixtureSql('');
        await start('Ne garde que les lignes où "age > 18".');
        await accept();
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.code, 'CLAUSE_HORS_REQUETE');
        assert.equal(diagnostic.stage, 'placement');
        assert.equal(state.document.getText(), '');
      });
    });
    await test('lot S10 : une clause dans le mauvais ordre est refusee, et le message la NOMME', async () => {
      await avecSql(async () => {
        const requete = 'SELECT nom' + EOL + 'FROM eleves' + EOL + 'ORDER BY nom ASC' + EOL + EOL + ';' + EOL;
        await fixtureSql(requete, requete.indexOf(';') - EOL.length);
        await start('Ne garde que les lignes où "age > 18".');
        await accept();
        const diagnostic = api.inspect().diagnostic;
        assert.equal(diagnostic.code, 'CLAUSE_DANS_LE_MAUVAIS_ORDRE');
        assert.ok(/WHERE/u.test(diagnostic.message), diagnostic.message);
      });
    });
    await test('lot S10 : une information passive de SQL est journalisee', async () => {
      await avecSql(async () => {
        await fixtureSql('');
        await preview('Supprime toutes les lignes de la table eleves.');
        const codes = api.inspect().information.map(item => item.code);
        assert.ok(codes.includes('SQL_MODIFICATION_SANS_FILTRE'), codes.join(', '));
        assert.ok(codes.includes('SQL_AUCUNE_EXECUTION'), codes.join(', '));
        assert.deepEqual(api.inspect().advisories, []);
      });
    });
    await test('lot S10 : une phrase SQL est refusee dans un fichier .c', async () => {
      const state = await fixture(CORPS);
      await start('Supprime la table eleves.');
      await accept();
      assert.equal(api.inspect().diagnostic.stage, 'translation');
      assert.equal(state.document.getText(), CORPS);
    });
    await test('v0.5.0 : les deux reglages sont ACTIFS par defaut dans le manifeste', async () => {
      // Le profil de test les epingle a false pour que les scenarios soient
      // deterministes. Le defaut du MANIFESTE, lui, est ce que verra un
      // utilisateur qui n'a rien regle : il se lit par `inspect`, et c'est la
      // seule facon de le verifier sans dependre du profil.
      const souplesse = vscode.workspace.getConfiguration('c-a').inspect('souplesse');
      const python = vscode.workspace.getConfiguration('c-a').inspect('python');
      const java = vscode.workspace.getConfiguration('c-a').inspect('java');
      const sql = vscode.workspace.getConfiguration('c-a').inspect('sql');
      assert.equal(souplesse.defaultValue, true, 'le francais souple doit etre actif par defaut');
      assert.equal(python.defaultValue, true, 'Python doit etre actif par defaut');
      assert.equal(java.defaultValue, true, 'Java doit etre actif par defaut');
      assert.equal(sql.defaultValue, true, 'SQL doit etre actif par defaut');
      // Et le mode strict reste ACCESSIBLE : le profil le prouve, puisqu'il
      // l'a epingle a false et que les scenarios stricts passent.
      assert.equal(vscode.workspace.getConfiguration('c-a').get('souplesse'), false);
      assert.equal(vscode.workspace.getConfiguration('c-a').get('python'), false);
      assert.equal(vscode.workspace.getConfiguration('c-a').get('java'), false);
      assert.equal(vscode.workspace.getConfiguration('c-a').get('sql'), false);
    });
    await test('changer indentSize seul invalide le plan', async () => {
      const { editor } = await fixture();
      await preview('Crée la fonction principale');
      editor.options = { indentSize: 2 };
      await waitFor(() => api.inspect()?.phase === 'stale', 'indentSize changé');
      assert.ok(!api.inspect().choices.includes('Insérer'));
    });
  } catch (error) {
    cases.push({ name: 'initialisation hôte', status: 'failed', error: error.stack ?? String(error) });
  }
  const result = { vscode: vscode.version, passed: cases.filter(item => item.status === 'passed').length,
    failed: cases.filter(item => item.status === 'failed').length, cases,
    manualRemaining: ['Touches physiques Ctrl+K puis A / Cmd+K puis A', 'Composition IME et disposition de clavier', 'Vérification visuelle du focus et du diff'] };
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(report, JSON.stringify(result, null, 2));
  if (result.failed) throw new Error(`${result.failed} test(s) VS Code en échec ; voir le rapport.`);
};
