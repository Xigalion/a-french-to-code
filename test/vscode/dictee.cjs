// Dictée — rejoue un exercice entier dans l'interface RÉELLE de VS Code.
//
// Chaque phrase passe par la commande « C-A : Saisir une instruction », son
// aperçu et sa confirmation. Rien de ce qui est inséré n'est tapé : le seul
// texte saisi est du français. C'est la réponse automatisable à « réaliser
// l'exercice dans VS Code sans saisie manuelle du code C généré ».
//
// Ce que ce runner ne remplace pas, et qui reste manuel : la frappe physique
// de Ctrl+K A, la composition IME, et le contrôle visuel du focus et du diff.
//
// Entrées (variables d'environnement) :
//   CA_TEST_WORKSPACE  dossier de travail
//   CA_TEST_REPORT     rapport JSON à écrire
//   CA_DICTEE          fichier JSON : { name, steps: [["last"|"eof"|"nl", …]] }
//   CA_DICTEE_OUT      où recopier le .c produit
const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');

exports.run = async function run() {
  const report = process.env.CA_TEST_REPORT;
  const workspace = process.env.CA_TEST_WORKSPACE;
  const dictee = JSON.parse(fs.readFileSync(process.env.CA_DICTEE, 'utf8'));
  const sortie = process.env.CA_DICTEE_OUT;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const value = await predicate();
      if (value) return value;
      await delay(30);
    }
    throw new Error('Délai dépassé : ' + label);
  }

  const journal = [];
  let inserees = 0;
  let refus = 0;
  let gestes = 0;
  let erreur;

  // Même règle que `scripts/ecrirePhrases.mjs` : la dernière ligne qui ne
  // contient que des espaces. Les deux chemins doivent viser le même endroit,
  // sinon comparer leurs sorties ne voudrait rien dire.
  function derniereLigneBlanche(text) {
    const lignes = text.split('\n');
    for (let i = lignes.length - 1; i >= 0; i--) {
      if (/^[ \t]*$/u.test(lignes[i]) && (i < lignes.length - 1 || lignes[i].length)) {
        return lignes.slice(0, i).reduce((n, l) => n + l.length + 1, 0) + lignes[i].length;
      }
    }
    return undefined;
  }

  try {
    const extension = vscode.extensions.getExtension('projet-a-local.c-a');
    if (!extension) throw new Error('Extension C-A absente de l’hôte');
    const api = await extension.activate();

    const fichier = path.join(workspace, dictee.name);
    fs.writeFileSync(fichier, '', 'utf8');
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(fichier));
    const editor = await vscode.window.showTextDocument(document, { preview: false });
    editor.options = { insertSpaces: true, tabSize: 4, indentSize: 'tabSize' };
    await waitFor(() => editor.options.tabSize === 4 && editor.options.insertSpaces === true,
      'réglages d’indentation résolus');
    const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    /** Le geste d'éditeur : l'utilisateur appuie sur Entrée pour obtenir une
     * ligne blanche à l'indentation voulue. C-A ne le fait jamais. */
    async function entree(indent) {
      const texte = document.getText().split(eol);
      const prefixe = ' '.repeat(indent);
      for (let i = texte.length - 1; i >= 0; i--) {
        const ligne = texte[i];
        if (/[^ \t]/u.test(ligne) && ligne.startsWith(prefixe) && !ligne.startsWith(prefixe + ' ')) {
          const position = new vscode.Position(i, ligne.length);
          await editor.edit(constructeur => constructeur.insert(position, eol + prefixe));
          gestes++;
          return;
        }
      }
      throw new Error('Aucune ligne à l’indentation ' + indent);
    }

    async function placerCurseur(ou) {
      let texte = document.getText();
      if (ou === 'eof') {
        const ajout = texte === '' ? eol : texte.endsWith(eol) ? eol : eol + eol;
        const fin = document.positionAt(texte.length);
        await editor.edit(constructeur => constructeur.insert(fin, ajout));
        texte = document.getText();
      }
      const plat = texte.split(eol).join('\n');
      const offset = derniereLigneBlanche(plat) ?? plat.length;
      // Reconversion de l'offset « \n » vers l'offset du document.
      const avant = plat.slice(0, offset).split('\n').length - 1;
      // `lastIndexOf` traite un index négatif comme 0 et trouverait alors le
      // saut de ligne de la position 0 : la colonne deviendrait négative.
      const colonne = offset === 0 ? 0 : offset - (plat.lastIndexOf('\n', offset - 1) + 1);
      const position = new vscode.Position(avant, colonne);
      editor.selection = new vscode.Selection(position, position);
    }

    for (const [ou, phrase] of dictee.steps) {
      if (ou === 'nl') { await entree(phrase); journal.push({ geste: phrase }); continue; }
      await placerCurseur(ou);
      const avant = document.getText();

      await vscode.commands.executeCommand('c-a.translate', phrase);
      await waitFor(() => api.inspect()?.ui === 'input', 'champ de saisie : ' + phrase);
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

      // Soit l'aperçu s'ouvre, soit la session se referme : un refus n'offre
      // aucune confirmation, et c'est exactement ce qu'on veut constater.
      const etat = await waitFor(() => {
        const vu = api.inspect();
        if (!vu) return { ferme: true };
        return vu.ui === 'confirmation' ? { confirmation: true } : undefined;
      }, 'aperçu ou refus : ' + phrase);

      if (etat.ferme) {
        refus++;
        journal.push({ phrase, resultat: 'refus (aucun aperçu)' });
        continue;
      }
      await vscode.commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
      await waitFor(() => !api.inspect(), 'fin de l’insertion : ' + phrase);
      if (document.getText() === avant) {
        refus++;
        journal.push({ phrase, resultat: 'aucune modification du document' });
        continue;
      }
      inserees++;
      journal.push({ phrase, resultat: 'inséré' });
    }

    await document.save();
    fs.writeFileSync(sortie, document.getText(), 'utf8');
  } catch (error) {
    erreur = error.stack ?? String(error);
  }

  const resultat = {
    vscode: vscode.version, dictee: path.basename(process.env.CA_DICTEE),
    inserees, refus, gestes, erreur,
    passed: erreur === undefined && refus === 0 ? 1 : 0,
    failed: erreur === undefined && refus === 0 ? 0 : 1,
    journal,
    manualRemaining: ['Frappe physique Ctrl+K puis A', 'Composition IME et disposition de clavier',
      'Contrôle visuel du focus, de l’aperçu et du diff'],
  };
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(report, JSON.stringify(resultat, null, 2));
  if (resultat.failed) throw new Error('Dictée en échec : ' + (erreur ?? refus + ' refus'));
};
