// Mesure le français souple **en Java**, sur un corpus indépendant.
//
//   node scripts/mesurer-java.mjs          # le tableau
//   node scripts/mesurer-java.mjs --tout   # chaque entrée, avec son verdict
//
// Cinq comptes, et le cinquième est le seul qui compte vraiment :
//
//   1. formulations naturelles **reconnues** ;
//   2. formulations compréhensibles mais **refusées** ;
//   3. **ambiguïtés** correctement détectées ;
//   4. instructions **incorrectement acceptées** ;
//   5. **différences de sens** introduites par erreur.
//
// Les deux derniers doivent rester à **zéro**, et aucun taux ne les rachète :
// une phrase acceptée dont le sens est faux est pire qu'une phrase refusée.
//
// Le biais du corpus est écrit dans le corpus lui-même : il n'a enrichi aucune
// reformulation — les 98 viennent de la phase 2 et n'ont pas bougé d'une ligne
// pour Java — mais il a été écrit par l'auteur du mécanisme.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JavaTranslationSession } from '../extension/out/extension/src/sessionJava.js';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(join(racine, 'test-utilisateur', 'corpus', 'corpus-java.json'), 'utf8'));

/** Un document qui offre les trois portées : fichier, classe, méthode. Chaque
 * phrase est essayée là où sa portée l'autorise — mesurer la LANGUE ne doit
 * pas être mesurer le placement. */
const CONTEXTES = [
  { nom: 'fichier', texte: '\n' },
  { nom: 'classe', texte: 'public class Eleve {\n\n}\n' },
  { nom: 'methode', texte: 'public class Eleve {\n    static void f() {\n\n    }\n}\n' },
  // Deux contextes ajoutés après une première mesure : « Sortir de la boucle »
  // et « Ajouter une branche finalement » étaient comptés comme des refus de
  // LANGUE alors que c'étaient des refus de PLACEMENT — aucune boucle, aucun
  // bloc essaie ne les englobait. Mesurer la langue ne doit pas être mesurer
  // le placement.
  { nom: 'boucle',
    texte: 'public class Eleve {\n    static void f() {\n        while (i < 10) {\n\n        }\n    }\n}\n' },
  { nom: 'apres-essaie',
    texte: 'public class Eleve {\n    static void f() {\n        try {\n        }\n\n    }\n}\n' },
];

function essayer(phrase) {
  let dernier;
  for (const contexte of CONTEXTES) {
    // La DERNIÈRE ligne blanche du contexte : dans les deux contextes
    // profonds, la première n'est pas celle qu'on veut.
    const decalage = contexte.texte.lastIndexOf('\n\n') + 1;
    const target = {
      document: { id: 'file:///Eleve.java', revision: 1, text: contexte.texte },
      cursorOffset: decalage, singleCursor: true,
      indentUnit: '    ', indentSignature: '    |4', open: true, eol: '\n',
    };
    const session = new JavaTranslationSession(target, '', { souple: true });
    session.updateText(phrase);
    const diagnostic = session.diagnose(target);
    if (diagnostic === undefined) {
      const apercu = session.prepare(target);
      if (apercu.status !== 'preview') { dernier = { refus: 'apercu' }; continue; }
      // Le code produit : la ligne du fragment, sans l'indentation ni le
      // commentaire de traçabilité.
      const lignes = apercu.preview.after.split('\n').map(l => l.trim());
      const commentaire = lignes.findIndex(l => l === '// ' + phrase.replace(/\.$/u, '.'));
      const code = lignes[commentaire + 1] ?? '';
      return { reconnue: true, code, portee: contexte.nom, normalisation: session.normalisation };
    }
    dernier = { refus: diagnostic.code, stage: diagnostic.stage, message: diagnostic.message };
  }
  return { reconnue: false, ...dernier };
}

const comptes = {
  reconnues: 0, refuseesAttendues: 0, comprehensiblesRefusees: 0,
  accepteesAtort: 0, erreursDeSens: 0,
};
const details = [];

for (const entree of corpus.entrees) {
  const resultat = essayer(entree.phrase);
  const attenduReconnue = entree.attendu === 'reconnue';
  if (resultat.reconnue && attenduReconnue) {
    // Reconnue comme attendu : reste à vérifier le SENS.
    //  : deux chemins peuvent ecrire deux textes JUSTES et
    // equivalents -- « n += 1 » par le catalogue natif, « n = (n + 1) » par
    // une reformulation historique. Confondre cela avec une erreur de sens
    // rendrait la mesure fausse dans le sens alarmiste, ce qui n est pas
    // mieux que l inverse.
    const sens = [entree.sens, entree.sensAlternatif].filter(v => v !== undefined);
    if (sens.length > 0 && !sens.includes(resultat.code)) {
      comptes.erreursDeSens++;
      details.push(['ERREUR DE SENS', entree.phrase, resultat.code + '  ≠  ' + sens.join(' ou ')]);
    } else {
      comptes.reconnues++;
      details.push(['reconnue', entree.phrase, resultat.code]);
    }
  } else if (!resultat.reconnue && !attenduReconnue) {
    comptes.refuseesAttendues++;
    details.push(['refusée, comme attendu', entree.phrase, String(resultat.refus)]);
  } else if (!resultat.reconnue && attenduReconnue) {
    comptes.comprehensiblesRefusees++;
    details.push(['COMPRÉHENSIBLE MAIS REFUSÉE', entree.phrase, String(resultat.refus)]);
  } else {
    comptes.accepteesAtort++;
    details.push(['ACCEPTÉE À TORT', entree.phrase, resultat.code]);
  }
}

const clairesTotal = corpus.entrees.filter(e => e.attendu === 'reconnue').length;
const taux = clairesTotal === 0 ? 0 : (comptes.reconnues / clairesTotal) * 100;

if (process.argv.includes('--tout')) {
  for (const [verdict, phrase, note] of details) {
    console.log(verdict.padEnd(30) + ' | ' + phrase);
    if (note !== '' && note !== 'undefined') console.log(' '.repeat(33) + note);
  }
  console.log('');
}

console.log('corpus                             : ' + corpus.entrees.length + ' entrées, écrit le ' + corpus.ecritLe);
console.log('phrases claires et dans le périmètre : ' + clairesTotal);
console.log('');
console.log('1. reconnues                       : ' + comptes.reconnues
  + '  (' + taux.toFixed(1) + ' % des phrases claires)');
console.log('2. compréhensibles mais refusées   : ' + comptes.comprehensiblesRefusees);
console.log('3. refusées comme attendu          : ' + comptes.refuseesAttendues);
console.log('4. acceptées à tort                : ' + comptes.accepteesAtort);
console.log('5. erreurs de SENS                 : ' + comptes.erreursDeSens);
console.log('');
if (comptes.accepteesAtort > 0 || comptes.erreursDeSens > 0) {
  console.log('ÉCHEC : une phrase acceptée à tort ou un sens faux ne se rachète par aucun taux.');
  process.exitCode = 1;
} else {
  console.log('0 acceptée à tort, 0 erreur de sens.');
}
console.log('');
console.log('Le biais de ce corpus est écrit dans le corpus : il n’a enrichi aucune');
console.log('reformulation, et il a été écrit par l’auteur du mécanisme. Il mesure la');
console.log('PORTÉE du mécanisme sur un langage nouveau, pas le français spontané.');
