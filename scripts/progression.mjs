// Imprime les deux indicateurs d'avancement, à coller dans un bilan.
//
// Deux indicateurs, jamais un seul : la couverture des neuf domaines dit ce
// qui est CONSTRUIT, la validation dit ce qui est PROUVÉ. Les additionner
// produirait un chiffre qui ne veut rien dire, et ce script refuse de le
// faire.
//
// Usage : node scripts/progression.mjs
// Source : test-utilisateur/etat.json, édité à la main après chaque séance.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const etat = JSON.parse(readFileSync(join(racine, 'test-utilisateur', 'etat.json'), 'utf8'));

const LARGEUR = 24;
function barre(part, total) {
  if (total <= 0) return '[' + '·'.repeat(LARGEUR) + ']';
  const pleins = Math.min(LARGEUR, Math.round((part / total) * LARGEUR));
  return '[' + '█'.repeat(pleins) + '·'.repeat(LARGEUR - pleins) + ']';
}
function pourcent(part, total) {
  if (total <= 0) return '—';
  return (Math.round((part / total) * 1000) / 10).toFixed(1).replace('.', ',') + ' %';
}

const c = etat.couverture;
const p = etat.preuves;
const u = etat.usageReel;

console.log('C-A — avancement au ' + etat.miseAJour + ' (' + etat.version + ')');
console.log('');
console.log('1. Couverture des neuf domaines du modèle 1 — ce qui est CONSTRUIT');
console.log('   ' + barre(c.domaines, c.domainesTotal) + '  ' + c.domaines + '/' + c.domainesTotal
  + '  ' + pourcent(c.domaines, c.domainesTotal));
console.log('   source : ' + c.source);
console.log('');
console.log('2. Validation réelle — ce qui est PROUVÉ (deux mesures, non fusionnées)');
console.log('   2a. preuves outillées');
console.log('       ' + barre(p.sondesVerifiees, p.sondesTotal) + '  '
  + p.sondesVerifiees + '/' + p.sondesTotal + ' sondes  — complétion pondérée '
  + String(p.completionPonderee).replace('.', ',') + ' %');
console.log('       barème : ' + p.bareme);
if (p.cloture) {
  const c = p.cloture;
  console.log('   2a bis. exercice de clôture — couverture des INTENTIONS du catalogue');
  console.log('       ' + barre(c.intentionsEmployees, c.intentionsCatalogue) + '  '
    + c.intentionsEmployees + '/' + c.intentionsCatalogue + ' intentions employées dans un programme compilé');
  console.log('       ' + c.programmesCompiles + ' programmes compilés, ' + c.programmesExecutes
    + ' exécutés, ' + c.retouchesManuelles + ' retouche manuelle');
  console.log('       ' + c.note);
}
console.log('   2b. usage réel observé');
console.log('       ' + barre(u.seancesObservees, u.seancesObjectif) + '  '
  + u.seancesObservees + '/' + u.seancesObjectif + ' séances, ' + u.etudiants + ' étudiant(s)');
console.log('');
console.log('   Limites de la mesure 2a — à citer avec le chiffre, jamais après :');
for (const limite of p.limites) console.log('     - ' + limite);
console.log('');

if (etat.publication) {
  const pub = etat.publication;
  console.log('3. Publication — ' + pub.etat);
  console.log('   ' + barre(pub.controlesPasses, pub.controlesTotal) + '  '
    + pub.controlesPasses + '/' + pub.controlesTotal + ' contrôles d’avant publication');
  console.log('   licence ' + pub.licence + ' | version ' + pub.versionPublique
    + ' | ' + pub.etiquettes + ' étiquettes | nom public ' + pub.nomPublicPropose);
  if (pub.url) console.log('   ' + pub.url);
  // Deux listes, jamais une seule. Confondre « fait » et « prepare » est
  // exactement l'erreur que ce fichier existe pour empecher : la 0.5.0 a ete
  // annoncee renommee alors que le nouveau nom repondait 404.
  for (const item of pub.fait ?? []) console.log('   FAIT     : ' + item);
  for (const item of pub.preparePasFait ?? []) console.log('   PREPARE  : ' + item);
  for (const item of pub.resteCoteGitHub ?? []) console.log('   reste côté GitHub : ' + item);
  console.log('   procédure et retour arrière : ' + pub.procedure
    + (pub.suivi ? ' | suivi : ' + pub.suivi : ''));
  console.log('');
}

const total = Object.values(u.remontees).reduce((a, b) => a + b, 0);
console.log('4. Comptes bruts du test utilisateur (aucune pondération)');
console.log('   remontées            : ' + total);
for (const [nom, valeur] of Object.entries(u.remontees)) console.log('     ' + nom.padEnd(28) + valeur);
console.log('   paliers d’aide       : '
  + Object.entries(u.paliersAide).map(([k, v]) => k + '=' + v).join('  '));
console.log('   insertions confirmées: ' + u.insertionsConfirmees);
console.log('   refus rencontrés     : ' + u.refusRencontres);
console.log('   retouches manuelles  : ' + u.retouchesManuelles + '  (0 attendu)');
console.log('   anomalies de l’hôte  : ' + u.anomaliesHote);
console.log('   exercices terminés   : ' + u.exercicesTermines + '/' + u.exercicesProposes);
console.log('');

if (u.seancesObservees === 0) {
  console.log('AUCUNE séance observée : la mesure 2b est vide, et la validation réelle');
  console.log('n’est donc PAS acquise. Le chiffre de 2a reste une part de preuve.');
}
