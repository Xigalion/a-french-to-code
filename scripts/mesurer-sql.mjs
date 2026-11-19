// Mesure le français souple **en SQL**, sur un corpus indépendant.
//
//   node scripts/mesurer-sql.mjs          # le tableau
//   node scripts/mesurer-sql.mjs --tout   # chaque entrée, avec son verdict
//
// Cinq comptes, et le cinquième est le seul qui compte vraiment :
//
//   1. formulations naturelles **reconnues** ;
//   2. formulations compréhensibles mais **refusées** ;
//   3. refus **attendus** ;
//   4. instructions **incorrectement acceptées** ;
//   5. **différences de sens** introduites par erreur.
//
// Les deux derniers doivent rester à **zéro**, et aucun taux ne les rachète :
// une phrase acceptée dont le sens est faux est pire qu'une phrase refusée.
// C'est cette mesure qui a trouvé, en phase 3, que A renommait silencieusement
// la méthode de l'utilisateur.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqlTranslationSession } from '../extension/out/extension/src/sessionSql.js';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(join(racine, 'test-utilisateur', 'corpus', 'corpus-sql.json'), 'utf8'));

/** Deux contextes : la portée fichier, et une requête ouverte. Une clause
 * essayée hors d'une requête serait comptée comme un refus de LANGUE alors que
 * c'est un refus de PLACEMENT — l'erreur commise une première fois en phase 3,
 * et corrigée là aussi en ajoutant des contextes. */
const CONTEXTES = [
  { nom: 'fichier', texte: '\n' },
  { nom: 'requete', texte: 'SELECT nom\nFROM eleves\n\n;\n' },
  // Une requête qui porte déjà un WHERE : « Exige aussi que … » n'a de sens
  // qu'ici, et le compter ailleurs mesurerait le placement.
  { nom: 'apres-where', texte: 'SELECT nom\nFROM eleves\nWHERE age > 1\n\n;\n' },
];

function essayer(phrase) {
  let dernier;
  for (const contexte of CONTEXTES) {
    const decalage = contexte.texte.lastIndexOf('\n\n') + 1;
    const target = {
      document: { id: 'file:///essai.sql', revision: 1, text: contexte.texte },
      cursorOffset: decalage, singleCursor: true,
      indentUnit: '  ', indentSignature: '  |2', open: true, eol: '\n',
    };
    const session = new SqlTranslationSession(target, '', { souple: true });
    session.updateText(phrase);
    const diagnostic = session.diagnose(target);
    if (diagnostic === undefined) {
      const apercu = session.prepare(target);
      if (apercu.status !== 'preview') { dernier = { refus: 'apercu' }; continue; }
      // La PREMIÈRE ligne du fragment, sans son commentaire de traçabilité.
      const lignes = apercu.preview.after.split('\n');
      const commentaire = lignes.findIndex(ligne => ligne === '-- ' + phrase);
      const code = (lignes[commentaire + 1] ?? '').replace(/\s+$/u, '');
      return { reconnue: true, code, portee: contexte.nom, normalisation: session.normalisation };
    }
    dernier = { refus: diagnostic.code, stage: diagnostic.stage, message: diagnostic.message };
  }
  return { reconnue: false, ...dernier };
}

const comptes = { reconnues: 0, refuseesAttendues: 0, comprehensiblesRefusees: 0,
  accepteesAtort: 0, erreursDeSens: 0 };
const details = [];

for (const entree of corpus.entrees) {
  const resultat = essayer(entree.phrase);
  const attenduReconnue = entree.attendu === 'reconnue';
  if (resultat.reconnue && attenduReconnue) {
    const sens = [entree.sens, entree.sensAlternatif].filter(valeur => valeur !== undefined);
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
    details.push(['COMPRÉHENSIBLE MAIS REFUSÉE', entree.phrase, String(resultat.refus) + ' — ' + (resultat.message ?? '')]);
  } else {
    comptes.accepteesAtort++;
    details.push(['ACCEPTÉE À TORT', entree.phrase, resultat.code]);
  }
}

const clairesTotal = corpus.entrees.filter(entree => entree.attendu === 'reconnue').length;
const taux = clairesTotal === 0 ? 0 : (comptes.reconnues / clairesTotal) * 100;

if (process.argv.includes('--tout')) {
  for (const [verdict, phrase, note] of details) {
    console.log(verdict.padEnd(30) + ' | ' + phrase);
    if (note !== '' && note !== 'undefined') console.log(' '.repeat(33) + note);
  }
  console.log('');
}

console.log('corpus                               : ' + corpus.entrees.length + ' entrées, écrit le ' + corpus.ecritLe);
console.log('phrases claires et dans le périmètre : ' + clairesTotal);
console.log('');
console.log('1. reconnues                         : ' + comptes.reconnues
  + '  (' + taux.toFixed(1) + ' % des phrases claires)');
console.log('2. compréhensibles mais refusées     : ' + comptes.comprehensiblesRefusees);
console.log('3. refusées comme attendu            : ' + comptes.refuseesAttendues);
console.log('4. acceptées à tort                  : ' + comptes.accepteesAtort);
console.log('5. erreurs de SENS                   : ' + comptes.erreursDeSens);
console.log('');
if (comptes.accepteesAtort > 0 || comptes.erreursDeSens > 0) {
  console.log('ÉCHEC : une phrase acceptée à tort ou un sens faux ne se rachète par aucun taux.');
  process.exitCode = 1;
} else {
  console.log('0 acceptée à tort, 0 erreur de sens.');
}
console.log('');
console.log('Le biais de ce corpus est écrit dans le corpus : il n’a enrichi aucune');
console.log('reformulation — les 98 viennent de la phase 2 et n’ont pas bougé d’une ligne');
console.log('pour SQL — et il a été écrit par l’auteur du mécanisme. Il mesure la PORTÉE');
console.log('du mécanisme sur un langage nouveau, pas le français spontané.');
