// Rejoue une phrase remontée par un étudiant, hors de VS Code.
//
// Sert au tri d'une remontée (docs/TEST_PROTOCOLE_OBSERVATION.md §4) : il
// répond à la seule question qui sépare un défaut du moteur d'un défaut de
// l'hôte — « hors de l'éditeur, le moteur fait-il la même chose ? ».
//
// Il n'écrit rien, ne modifie rien, et ne corrige pas la phrase.
//
// Usage :
//   node scripts/rejouer.mjs "Affiche la valeur de age."
//   node scripts/rejouer.mjs --dans-main "Affiche la valeur de age."
//   node scripts/rejouer.mjs --document chemin.c "Ajoute une branche sinon."
//
// Sans option, la phrase est placée à la portée fichier, document vide :
// c'est le contexte le plus pauvre, donc celui qui révèle le plus.

import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';

const args = process.argv.slice(2);
let texte = '';
let etiquette = 'portée fichier, document vide';

if (args[0] === '--dans-main') {
  args.shift();
  texte = 'int main(void) {\n';
  etiquette = 'dans un corps de fonction';
} else if (args[0] === '--document') {
  args.shift();
  const chemin = args.shift();
  texte = readFileSync(chemin, 'utf8');
  etiquette = 'document ' + chemin + ', curseur en fin de fichier';
}

const phrase = args.join(' ');
if (phrase === '') {
  console.error('Usage : node scripts/rejouer.mjs [--dans-main | --document <fichier.c>] "<phrase>"');
  process.exit(2);
}

console.log('phrase   : ' + JSON.stringify(phrase));
console.log('contexte : ' + etiquette);

const traduction = translate(phrase);
if (traduction.status === 'rejected') {
  const d = traduction.diagnostics[0];
  console.log('TRADUCTION REFUSÉE');
  console.log('  code     : ' + d.code);
  console.log('  message  : ' + d.message);
  console.log('  plage    : [' + d.range.start + ', ' + d.range.end + ') → '
    + JSON.stringify(phrase.slice(d.range.start, d.range.end)));
  console.log('');
  console.log('→ La phrase n’est pas comprise. Tri : §4, question 1 du protocole.');
  process.exit(0);
}

console.log('TRADUITE');
console.log('  intention: ' + traduction.instruction.kind);
for (const fragment of traduction.fragments) {
  console.log('  commentaire : ' + fragment.comment);
  for (const ligne of fragment.code.replace(/\n+$/u, '').split('\n')) console.log('  code        : ' + ligne);
}

const avertissements = analyzeCalculations(traduction).advisories;
for (const a of avertissements) console.log('  AVERTISSEMENT ' + a.code + ' : ' + a.message);

const informations = explainInstruction(traduction);
for (const i of informations) console.log('  information ' + i.code);
console.log('  total    : ' + avertissements.length + ' avertissement(s), '
  + informations.length + ' information(s)');

const plan = planPlacement({
  document: { id: 'rejeu.c', revision: 0, text: texte },
  cursorOffset: texte.length,
  translation: traduction,
});

if (plan.status === 'rejected') {
  const d = plan.diagnostics[0];
  console.log('PLACEMENT REFUSÉ à cet endroit');
  console.log('  code     : ' + d.code);
  console.log('  message  : ' + d.message);
  console.log('');
  console.log('→ Comprise mais refusée ici. Essaie --dans-main, ou --document'
    + ' avec le vrai fichier de l’étudiant : le contexte décide.');
} else {
  console.log('PLACEMENT PLANIFIÉ (' + plan.status + ')');
  console.log('');
  console.log('→ Le moteur accepte, hors de VS Code. Si l’étudiant a vu autre'
    + ' chose, le défaut est dans l’hôte, pas dans le moteur.');
}
