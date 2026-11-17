// EXPÉRIENCE — ce que la couche de souplesse accepte, résout et refuse.
//
//   node --experimental-strip-types experiences/souplesse/mesurer.mjs
//
// Chaque cas porte le verdict attendu : la sonde échoue si un seul diffère.
// C'est une sonde, pas un test livré — mais une sonde qui ne vérifie rien ne
// mesure rien.
import { mkdirSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { BUDGET, LEXIQUE, normaliser } from './normaliser.mjs';

const ici = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
mkdirSync(ici + 'sortie', { recursive: true });

const CAS = [
  // 1. Le mode strict n'est pas touché : une phrase du catalogue passe sans
  //    aucune réécriture.
  ['strict', 'Crée un entier nommé age de valeur 20.', 'phrase du catalogue, inchangée'],
  ['strict', 'Affiche la valeur de age.', 'phrase du catalogue, inchangée'],

  // 2. Variantes grammaticales : infinitif, impératif pluriel.
  ['normalise', 'Créer un entier nommé age de valeur 20.', 'infinitif'],
  ['normalise', 'Créez un entier nommé age de valeur 20.', 'impératif pluriel'],
  ['normalise', 'Afficher la valeur de age.', 'infinitif'],
  ['normalise', 'Déclarer un entier nommé compteur.', 'infinitif'],

  // 3. Synonymes et formulations équivalentes.
  ['normalise', 'Crée un entier appelé age de valeur 20.', 'synonyme de « nommé »'],
  ['normalise', 'Crée un entier nommé age valant 20.', 'synonyme de « de valeur »'],
  ['normalise', 'Crée un entier nommé age initialisé à 20.', 'synonyme de « de valeur »'],
  ['normalise', 'Crée un nombre entier nommé age de valeur 20.', 'synonyme de « entier »'],
  ['normalise', 'Sors de la boucle.', 'forme courte d’une phrase longue'],
  ['normalise', 'Passe à l’itération suivante.', 'forme courte'],

  // 4. Cumul de variantes dans une même phrase, et la borne qui l'arrête.
  ['normalise', 'Créer un entier appelé age valant 20.', 'trois substitutions, sous le budget'],
  ['refus', 'Créer un nombre entier appelé age valant 20.',
    'QUATRE substitutions : au-delà du budget, la phrase se reformule, elle ne se devine pas'],

  // 5. Homonyme tranché par le CONTEXTE : « Mets » peut affecter ou ajouter,
  //    mais une seule lecture appartient au catalogue.
  ['resolu', 'Mets la valeur 5 à x.', '« Mets » → Affecte (Ajoute ne parse pas)'],
  ['resolu', 'Mets une branche sinon.', '« Mets » → Ajoute (Affecte ne parse pas)'],

  // 6. Ambiguïté NON résolue : les deux lectures appartiennent au catalogue
  //    et n'ont pas le même sens. C-A ne choisit pas.
  ['ambigu', 'Montre c.', 'affichage en %d ou en %c : C-A ne connaît pas le type'],

  // 7. Refus : rien n'est deviné.
  ['refus', 'Fabrique un entier nommé age de valeur 20.', 'verbe hors lexique'],
  ['refus', 'Créer un entier appelé age.', 'variante connue, mais valeur absente : rien n’est inventé'],
  ['refus', 'Créer un entier nommé age valant.', 'valeur manquante après un synonyme'],
];

const resultats = [];
let echecs = 0;
for (const [attendu, phrase, pourquoi] of CAS) {
  const v = normaliser(phrase);
  const ok = v.verdict === attendu;
  if (!ok) echecs++;
  resultats.push({ attendu, obtenu: v.verdict, ok, phrase, pourquoi, v });
}

// Le mode strict reste intact : aucune phrase du catalogue ne change de sens
// parce que la couche existe. On le vérifie sur TOUT le catalogue.
import { readFileSync } from 'node:fs';
const racine = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const phrasesCatalogue = readFileSync(racine + 'docs/CATALOGUE.md', 'utf8').split('\n')
  .filter(l => l.startsWith('| `')).map(l => /^\| `(.+?)` \|/u.exec(l)?.[1]).filter(Boolean);
let intactes = 0;
let horsPortee = 0;
let alterees = [];
for (const phrase of phrasesCatalogue) {
  const direct = translate(phrase);
  if (direct.status !== 'translated') { horsPortee++; continue; }
  const v = normaliser(phrase);
  if (v.verdict === 'strict' && v.canonique === phrase) intactes++;
  else alterees.push({ phrase, verdict: v.verdict });
}
if (alterees.length > 0) echecs += alterees.length;

const lignes = ['# Expérience — souplesse linguistique déterministe', '',
  'Produit par `node --experimental-strip-types experiences/souplesse/mesurer.mjs`.',
  '**Sonde jetable** : la couche vit dans `experiences/`, et `src/` n’est pas touché.', '',
  '## 1. Principe', '',
  'La couche réécrit la phrase libre en phrases **candidates du catalogue**, et',
  'c’est le **moteur strict qui arbitre** : une lecture n’est retenue que s’il',
  'l’accepte. Une seule lecture valide → acceptée ; aucune → refus ; plusieurs',
  'de sens différent → **refus d’ambiguïté**, les lectures montrées.', '',
  '| Borne | Valeur |', '|---|---|',
  '| entrées du lexique | ' + LEXIQUE.length + ' |',
  '| substitutions par phrase | ' + BUDGET.substitutions + ' |',
  '| lectures candidates | ' + BUDGET.candidates + ' |', '',
  '## 2. Les ' + CAS.length + ' cas', '',
  '| Attendu | Obtenu | Phrase libre | Ce que la couche en fait | Pourquoi |',
  '|---|---|---|---|---|'];
for (const r of resultats) {
  const quoi = r.v.verdict === 'ambigu'
    ? r.v.lectures.map(l => '`' + l.code + '`').join(' **ou** ')
    : r.v.verdict === 'refus' ? '`' + r.v.code + '`'
      : '`' + (r.v.resultat?.fragments[0].code.replace(/\n$/u, '') ?? '') + '`';
  lignes.push('| ' + r.attendu + ' | ' + (r.ok ? r.obtenu : '**' + r.obtenu + '**') + ' | `'
    + r.phrase + '` | ' + quoi + ' | ' + r.pourquoi + ' |');
}
lignes.push('', '## 3. Le mode strict est-il intact ?', '',
  '| | |', '|---|---|',
  '| lignes de phrase relevées dans le catalogue | ' + phrasesCatalogue.length + ' |',
  '| non traduisibles seules (fragments de tableaux d’exemples) | ' + horsPortee + ' |',
  '| phrases réellement traduites | ' + (phrasesCatalogue.length - horsPortee) + ' |',
  '| rendues **sans aucune réécriture** | **' + intactes + '** |',
  '| altérées par la couche | ' + (alterees.length === 0 ? '**0**' : '**' + alterees.length + '**') + ' |', '',
  alterees.length === 0
    ? 'Aucune phrase du catalogue ne traverse la couche : la première chose qu’elle'
      + ' fait est d’essayer le moteur strict, et de s’effacer s’il accepte.'
    : 'ALTÉRÉES : ' + alterees.map(a => '`' + a.phrase + '` → ' + a.verdict).join(', '), '',
  '## 4. Ce que la couche ne fait pas', '',
  '- elle **n’invente aucune valeur** : « Créer un entier appelé age. » reste un refus,',
  '  parce que la valeur manque — la variante connue ne comble pas le trou ;',
  '- elle **ne choisit pas** entre deux lectures de sens différent ;',
  '- elle **ne corrige pas** la phrase de l’utilisateur : le commentaire inséré',
  '  garde ce qu’il a écrit, et la phrase canonique n’est qu’un intermédiaire ;',
  '- elle **n’est pas une inférence** : hors du lexique, rien n’est tenté.', '',
  '## 5. Verdict de la sonde', '',
  echecs === 0 ? '**' + CAS.length + ' cas sur ' + CAS.length + ' conformes, et '
    + intactes + ' phrases du catalogue inchangées.**'
    : '**' + echecs + ' écart(s)** — la sonde échoue.', '');
writeFileSync(ici + 'sortie/MESURES.md', lignes.join('\n') + '\n', 'utf8');

for (const r of resultats) {
  console.log((r.ok ? '  ok   ' : '  ÉCART') + ' ' + r.attendu.padEnd(10) + ' ' + r.phrase);
  if (!r.ok) console.log('         obtenu : ' + r.obtenu + ' ' + (r.v.code ?? '') + ' ' + (r.v.message ?? ''));
}
console.log('catalogue intact :', intactes, '/', phrasesCatalogue.length, '| altérées :', alterees.length);
console.log('écarts :', echecs);
console.log('rapport : experiences/souplesse/sortie/MESURES.md');
process.exit(echecs === 0 ? 0 : 1);
