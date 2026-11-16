// Écrit un programme C en passant des phrases françaises par le moteur RÉEL :
// `translate`, puis `planPlacement`, puis application de l'unique édition du
// plan. C'est le chemin de code que l'hôte VS Code emprunte ; seule son
// interface manque.
//
// Un seul exemplaire de cette mécanique, partagé par les cahiers d'exercices
// et par l'exercice de clôture : la dupliquer ferait diverger deux chemins
// censés être le même.
//
// Aucune retouche : si une phrase est refusée, le journal le dit et le
// programme reste tel quel. On ne cache pas un refus en corrigeant à la main.

import { mkdirSync, writeFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';

/** Dernière ligne du document ne contenant que des espaces ou des tabulations. */
export function derniereLigneBlanche(text) {
  const lignes = text.split('\n');
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (/^[ \t]*$/u.test(lignes[i]) && (i < lignes.length - 1 || lignes[i].length)) {
      return lignes.slice(0, i).reduce((n, l) => n + l.length + 1, 0) + lignes[i].length;
    }
  }
  return undefined;
}

/** Le seul geste que C-A ne fait pas : l'utilisateur appuie sur Entrée en fin
 * de la dernière ligne d'indentation `indent`. Un bloc consomme la ligne
 * blanche où il est posé ; sans ce geste, on ne remonte jamais d'un niveau. */
export function nouvelleLigneBlanche(text, indent) {
  const lignes = text.split('\n');
  const prefixe = ' '.repeat(indent);
  for (let i = lignes.length - 1; i >= 0; i--) {
    const ligne = lignes[i];
    if (/[^ \t]/u.test(ligne) && ligne.startsWith(prefixe) && !ligne.startsWith(prefixe + ' ')) {
      lignes.splice(i + 1, 0, prefixe);
      return lignes.join('\n');
    }
  }
  return text;
}

/**
 * @param {Array<{name: string, titre?: string, steps: Array<[string, string|number]>}>} fichiers
 * @param {{dossier: string, journal: string, titre: string}} ou
 * @returns {{bilan: Array<object>, refus: Array<object>, genres: string[]}}
 */
export function ecrire(fichiers, ou) {
  mkdirSync(ou.dossier, { recursive: true });
  mkdirSync(ou.journal, { recursive: true });

  const lignes = ['# ' + ou.titre, '',
    'Produit par `scripts/ecrirePhrases.mjs` : `translate` puis `planPlacement`,',
    'puis application de l’unique édition du plan. **Aucune retouche manuelle.**', ''];
  const bilan = [];
  const refus = [];
  const genres = new Set();

  for (const fichier of fichiers) {
    let text = '';
    const compte = { inseres: 0, informations: 0, avertissements: 0, gestes: 0, refus: 0 };
    lignes.push('## ' + fichier.name + (fichier.titre ? ' — ' + fichier.titre : ''), '');

    for (const [ou2, phrase] of fichier.steps) {
      if (ou2 === 'nl') {
        text = nouvelleLigneBlanche(text, phrase);
        compte.gestes++;
        lignes.push('- *(geste d’éditeur : ligne blanche à l’indentation ' + phrase + ')*');
        continue;
      }
      const resultat = translate(phrase);
      if (resultat.status !== 'translated') {
        compte.refus++;
        refus.push({ fichier: fichier.name, phrase, etape: 'traduction', code: resultat.diagnostics[0].code,
          message: resultat.diagnostics[0].message });
        lignes.push('- **REFUS DE TRADUCTION** `' + phrase + '` → `'
          + resultat.diagnostics[0].code + '` — ' + resultat.diagnostics[0].message);
        continue;
      }
      if (ou2 === 'eof') text += text.endsWith('\n') || text === '' ? '\n' : '\n\n';
      const curseur = derniereLigneBlanche(text) ?? text.length;
      const plan = planPlacement({
        document: { id: fichier.name, revision: 1, text },
        cursorOffset: curseur,
        translation: resultat,
      });
      if (plan.status !== 'planned') {
        compte.refus++;
        refus.push({ fichier: fichier.name, phrase, etape: 'placement', code: plan.diagnostics[0].code,
          message: plan.diagnostics[0].message });
        lignes.push('- **REFUS DE PLACEMENT** `' + phrase + '` → `'
          + plan.diagnostics[0].code + '` — ' + plan.diagnostics[0].message);
        continue;
      }
      const [edition] = plan.plan.edits;
      text = text.slice(0, edition.range.start) + edition.newText + text.slice(edition.range.end);
      const informations = explainInstruction(resultat).map(i => i.code);
      const avertissements = analyzeCalculations(resultat).advisories.map(a => a.code);
      compte.inseres++;
      compte.informations += informations.length;
      compte.avertissements += avertissements.length;
      genres.add(resultat.instruction.kind);
      lignes.push('- `' + phrase + '` → `' + resultat.fragments[0].code.replace(/\n$/u, '') + '`'
        + (informations.length ? '  — info ' + informations.join(', ') : '')
        + (avertissements.length ? '  — **avertissement ' + avertissements.join(', ') + '**' : ''));
    }

    writeFileSync(ou.dossier + '/' + fichier.name, text, 'utf8');
    lignes.push('', '*' + fichier.name + ' : ' + compte.inseres + ' instructions, ' + compte.gestes
      + ' gestes d’éditeur, ' + compte.informations + ' informations, ' + compte.avertissements
      + ' avertissements, ' + compte.refus + ' refus.*', '');
    bilan.push({ name: fichier.name, ...compte, executer: fichier.executer !== false });
  }

  writeFileSync(ou.journal + '/production.md', lignes.join('\n') + '\n', 'utf8');
  writeFileSync(ou.journal + '/genres.json', JSON.stringify([...genres].sort(), null, 2) + '\n', 'utf8');
  writeFileSync(ou.journal + '/bilan.json', JSON.stringify(bilan, null, 2) + '\n', 'utf8');
  return { bilan, refus, genres: [...genres].sort() };
}
