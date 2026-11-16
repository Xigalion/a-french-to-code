// Exécute l'exercice intégrateur par le moteur et le planificateur RÉELS de
// C-A : `translate` puis `planPlacement`, puis application de l'unique
// édition du plan. C'est le même chemin de code que l'hôte VS Code emprunte ;
// seule l'interface manque.
//
//   node --experimental-strip-types exercice/executer.mjs
//
// Campagne 3 : produit exercice/campagne3/ca/*.c et son journal.
import { mkdirSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { planPlacement } from '../../src/planPlacement.ts';
import { explainInstruction } from '../../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../../src/calculationAdvisories.ts';
import { FILES3, REFUS_ATTENDUS } from './scenario3.mjs';

const CORRIGE = false;
const SOURCES = FILES3;
const DOSSIER = CORRIGE ? 'corrige' : 'ca';
const JOURNAL = CORRIGE ? 'journal/journal-corrige.md' : 'journal/journal.md';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
mkdirSync(root + DOSSIER, { recursive: true });
mkdirSync(root + 'journal', { recursive: true });

/** The last line of the document that holds only spaces or tabs. */
function lastBlankLine(text) {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^[ \t]*$/u.test(lines[i]) && (i < lines.length - 1 || lines[i].length)) {
      return lines.slice(0, i).reduce((n, l) => n + l.length + 1, 0) + lines[i].length;
    }
  }
  return undefined;
}

/** The one editor gesture C-A cannot perform: the user clicks at the end of
 * the last line at depth `indent` and presses Enter, creating a blank line at
 * that depth. A block consumes the blank line it is placed on, so without this
 * there is no way back out to an enclosing level. Counted and journalled. */
function nouvelleLigneBlanche(text, indent) {
  const lines = text.split('\n');
  const prefix = ' '.repeat(indent);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/[^ \t]/u.test(line) && line.startsWith(prefix) && !line.startsWith(prefix + ' ')) {
      lines.splice(i + 1, 0, prefix);
      return lines.join('\n');
    }
  }
  return text;
}

const journal = [];
const counts = { translated: 0, refusedTranslate: 0, refusedPlacement: 0, informations: 0, advisories: 0, gestes: 0 };
const blocages = [];

for (const file of SOURCES) {
  let text = '';
  journal.push({ kind: 'file', name: file.name });
  for (const [where, sentence] of file.steps) {
    if (where === 'nl') {
      text = nouvelleLigneBlanche(text, sentence);
      counts.gestes++;
      journal.push({ kind: 'geste', file: file.name, indent: sentence });
      continue;
    }
    const entry = { kind: 'step', file: file.name, sentence, where };
    const result = translate(sentence);
    if (result.status !== 'translated') {
      entry.outcome = 'refus-traduction';
      entry.code = result.diagnostics[0].code;
      entry.message = result.diagnostics[0].message;
      entry.extrait = sentence.slice(result.diagnostics[0].range.start, result.diagnostics[0].range.end);
      counts.refusedTranslate++;
      blocages.push(entry);
      journal.push(entry);
      continue;
    }
    if (where === 'eof') text += text.endsWith('\n') || text === '' ? '\n' : '\n\n';
    const cursor = lastBlankLine(text) ?? text.length;
    const plan = planPlacement({ document: { id: file.name, revision: 1, text }, cursorOffset: cursor, translation: result });
    if (plan.status !== 'planned') {
      entry.outcome = 'refus-placement';
      entry.code = plan.diagnostics[0].code;
      entry.message = plan.diagnostics[0].message;
      counts.refusedPlacement++;
      blocages.push(entry);
      journal.push(entry);
      continue;
    }
    const [edit] = plan.plan.edits;
    text = text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
    const informations = explainInstruction(result).map((i) => i.code);
    const advisories = analyzeCalculations(result).advisories.map((a) => `${a.code}/${a.assessment}`);
    counts.translated++;
    counts.informations += informations.length;
    counts.advisories += advisories.length;
    entry.outcome = 'insere';
    entry.intention = result.instruction.kind;
    entry.code_c = result.fragments[0].code.replace(/\n$/u, '');
    entry.informations = informations;
    entry.advisories = advisories;
    journal.push(entry);
  }
  writeFileSync(root + DOSSIER + '/' + file.name, text, 'utf8');
  journal.push({ kind: 'file-done', name: file.name, bytes: text.length, lines: text.split('\n').length - 1 });
}

// Confirmation des blocages recensés par l'énoncé.
const attendus = REFUS_ATTENDUS.map(([label, sentence]) => {
  const r = translate(sentence);
  return { label, sentence,
    verdict: r.status === 'translated' ? 'ACCEPTE' : 'REFUSE',
    detail: r.status === 'translated' ? r.fragments[0].code.replace(/\n$/u, '') : r.diagnostics[0].code };
});

const lines = [];
lines.push('# Journal d’exécution de l’exercice intégrateur', '');
lines.push('Produit par `exercice/executer.mjs`, qui appelle `translate` puis');
lines.push('`planPlacement` du moteur réel et applique l’unique édition du plan.', '');
lines.push('## Compteurs', '');
lines.push('| | |', '|---|---|');
lines.push(`| Instructions insérées | **${counts.translated}** |`);
lines.push(`| Refus à la traduction | **${counts.refusedTranslate}** |`);
lines.push(`| Refus au placement | **${counts.refusedPlacement}** |`);
lines.push(`| Informations pédagogiques émises | ${counts.informations} |`);
lines.push(`| Avertissements de calcul émis | ${counts.advisories} |`);
lines.push(`| **Gestes d’éditeur hors C-A** (ligne blanche ajoutée) | **${counts.gestes}** |`, '');
lines.push('## Blocages recensés par l’énoncé', '');
lines.push('| Blocage annoncé | Verdict | Détail |', '|---|---|---|');
for (const a of attendus) lines.push(`| ${a.label} | **${a.verdict}** | \`${a.detail}\` |`);
lines.push('');
lines.push('## Déroulé', '');
for (const e of journal) {
  if (e.kind === 'file') lines.push('', `### ${e.name}`, '');
  else if (e.kind === 'geste') lines.push(`- *(geste d’éditeur : ligne blanche créée à l’indentation ${e.indent} — C-A ne le fait pas)*`);
  else if (e.kind === 'file-done') lines.push('', `*${e.name} : ${e.lines} lignes, ${e.bytes} octets.*`);
  else if (e.outcome === 'insere') {
    const extra = [e.informations.length ? 'info ' + e.informations.join(', ') : '',
      e.advisories.length ? '**avertissement ' + e.advisories.join(', ') + '**' : ''].filter(Boolean).join(' · ');
    lines.push(`- \`${e.sentence}\` → \`${e.code_c}\`${extra ? '  — ' + extra : ''}`);
  } else {
    lines.push(`- **${e.outcome.toUpperCase()}** \`${e.sentence}\` → \`${e.code}\``
      + (e.extrait ? ` sur « ${e.extrait} »` : '') + `  — ${e.message}`);
  }
}
writeFileSync(root + JOURNAL, lines.join('\n') + '\n', 'utf8');
// Les intentions réellement insérées, pour que la matrice les apparie par
// genre plutôt que par texte : les noms de variables des sondes diffèrent.
writeFileSync(root + 'journal/' + (CORRIGE ? 'intentions-corrige.json' : 'intentions.json'),
  JSON.stringify([...new Set(journal.filter((e) => e.outcome === 'insere').map((e) => e.intention))].sort(), null, 2), 'utf8');

console.log('inserees            :', counts.translated);
console.log('refus traduction    :', counts.refusedTranslate);
console.log('refus placement     :', counts.refusedPlacement);
console.log('informations emises :', counts.informations);
console.log('avertissements      :', counts.advisories);
console.log('gestes hors C-A     :', counts.gestes);
for (const b of blocages) console.log('  BLOCAGE', b.outcome, b.code, '|', b.sentence);
for (const a of attendus) console.log('  attendu', a.verdict.padEnd(8), a.label, '->', a.detail);
