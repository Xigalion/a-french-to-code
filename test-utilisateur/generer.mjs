// Écrit les corrigés des neuf exercices avec le moteur RÉEL de C-A :
// `translate`, puis `planPlacement`, puis application de l'unique édition du
// plan — le chemin que l'hôte VS Code emprunte, sans son interface.
//
//   node --experimental-strip-types test-utilisateur/generer.mjs
//
// Produit test-utilisateur/corriges/*.c et journal/corriges.md.
// Aucune retouche à la main : si un exercice n'est pas faisable avec le seul
// catalogue, le journal le dit au lieu de le cacher.
import { mkdirSync, writeFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { EXERCICES, REFUS_ANNONCES } from './enonces.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
mkdirSync(root + 'corriges', { recursive: true });
mkdirSync(root + 'journal', { recursive: true });

/** Dernière ligne du document ne contenant que des espaces ou des tabulations. */
function derniereLigneBlanche(text) {
  const lignes = text.split('\n');
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (/^[ \t]*$/u.test(lignes[i]) && (i < lignes.length - 1 || lignes[i].length)) {
      return lignes.slice(0, i).reduce((n, l) => n + l.length + 1, 0) + lignes[i].length;
    }
  }
  return undefined;
}

/** Le seul geste que C-A ne fait pas : l'étudiant appuie sur Entrée en fin de
 * la dernière ligne d'indentation `indent`. Un bloc consomme la ligne blanche
 * où il est posé ; sans ce geste, on ne remonte jamais d'un niveau. */
function nouvelleLigneBlanche(text, indent) {
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

const journal = ['# Corrigés des neuf exercices — journal de production', '',
  'Produit par `test-utilisateur/generer.mjs`. **Aucune retouche manuelle.**', ''];
const bilan = [];
let echecs = 0;

for (const exercice of EXERCICES) {
  let text = '';
  const compte = { inseres: 0, informations: 0, avertissements: 0, gestes: 0, refus: 0 };
  journal.push('## ' + exercice.name + ' — ' + exercice.titre, '');

  for (const [ou, phrase] of exercice.steps) {
    if (ou === 'nl') {
      text = nouvelleLigneBlanche(text, phrase);
      compte.gestes++;
      journal.push('- *(geste d’éditeur : ligne blanche à l’indentation ' + phrase + ')*');
      continue;
    }
    const resultat = translate(phrase);
    if (resultat.status !== 'translated') {
      compte.refus++;
      echecs++;
      journal.push('- **REFUS DE TRADUCTION** `' + phrase + '` → `'
        + resultat.diagnostics[0].code + '` — ' + resultat.diagnostics[0].message);
      continue;
    }
    if (ou === 'eof') text += text.endsWith('\n') || text === '' ? '\n' : '\n\n';
    const curseur = derniereLigneBlanche(text) ?? text.length;
    const plan = planPlacement({
      document: { id: exercice.name, revision: 1, text },
      cursorOffset: curseur,
      translation: resultat,
    });
    if (plan.status !== 'planned') {
      compte.refus++;
      echecs++;
      journal.push('- **REFUS DE PLACEMENT** `' + phrase + '` → `'
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
    journal.push('- `' + phrase + '` → `' + resultat.fragments[0].code.replace(/\n$/u, '') + '`'
      + (informations.length ? '  — info ' + informations.join(', ') : '')
      + (avertissements.length ? '  — **avertissement ' + avertissements.join(', ') + '**' : ''));
  }

  writeFileSync(root + 'corriges/' + exercice.name, text, 'utf8');
  journal.push('', '*' + exercice.name + ' : ' + compte.inseres + ' instructions, '
    + compte.gestes + ' gestes d’éditeur, ' + compte.informations + ' informations, '
    + compte.avertissements + ' avertissements, ' + compte.refus + ' refus.*', '');
  bilan.push({ name: exercice.name, ...compte, executer: exercice.executer !== false });
}

journal.push('## Refus annoncés par les énoncés', '', '| Cas | Verdict | Code |', '|---|---|---|');
for (const [etiquette, phrase] of REFUS_ANNONCES) {
  const r = translate(phrase);
  const verdict = r.status === 'translated' ? '**ACCEPTÉE — l’énoncé est faux**' : 'refusée';
  if (r.status === 'translated') echecs++;
  journal.push('| ' + etiquette + ' — `' + phrase + '` | ' + verdict + ' | `'
    + (r.status === 'translated' ? r.fragments[0].code.replace(/\n$/u, '') : r.diagnostics[0].code) + '` |');
}

writeFileSync(root + 'journal/corriges.md', journal.join('\n') + '\n', 'utf8');
writeFileSync(root + 'journal/bilan.json', JSON.stringify(bilan, null, 2) + '\n', 'utf8');

for (const b of bilan) {
  console.log(b.name.padEnd(8), 'inserees', String(b.inseres).padStart(3),
    '| gestes', b.gestes, '| infos', String(b.informations).padStart(3),
    '| avert', b.avertissements, '| refus', b.refus);
}
console.log('total refus inattendus :', echecs);
process.exit(echecs === 0 ? 0 : 1);
