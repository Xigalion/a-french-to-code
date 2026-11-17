// Mesure la souplesse sur les corpus du lot S5.
//
//   node scripts/mesurer-reformulations.mjs                 # les deux corpus
//   node scripts/mesurer-reformulations.mjs developpement   # un seul
//
// Deux corpus, et la différence est tout l'intérêt :
//
//   - DÉVELOPPEMENT : il a le droit de servir à étendre la table. Son taux ne
//     mesure donc pas la généralisation, seulement la couverture de ce qu'on
//     a déjà regardé ;
//   - VALIDATION : gelé, jamais utilisé pour enrichir quoi que ce soit. C'est
//     son taux qui vaut quelque chose, et c'est celui qu'il faut citer.
//
// Le taux de reconnaissance ne se calcule que sur les phrases DANS le
// périmètre dont l'attente écrite est « accepte ». Y mêler des phrases hors
// périmètre gonflerait le dénominateur ; les retirer sans le dire gonflerait
// le taux. Les deux chiffres sont donc imprimés.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normaliser } from '../src/langue/variantes.ts';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const demandes = process.argv.slice(2).filter(argument => !argument.startsWith('--'));
const CORPUS = [
  { cle: 'developpement', fichier: 'corpus-developpement.json', titre: 'développement' },
  { cle: 'validation', fichier: 'corpus-validation.json', titre: 'validation (gelé)' },
].filter(candidat => demandes.length === 0 || demandes.includes(candidat.cle));

const accepte = verdict => ['strict', 'normalise', 'resolu'].includes(verdict.verdict);
const codeDe = resultat => (resultat.fragments[0]?.code ?? '').replace(/\n$/u, '');

const lignes = [];
const dire = texte => { lignes.push(texte); console.log(texte); };

dire('# Phase 2 — souplesse linguistique : les deux corpus du lot S5');
dire('');
dire('Généré par `node scripts/mesurer-reformulations.mjs`. Ne pas éditer à la main.');
dire('');

let echecs = 0;

for (const { fichier, titre } of CORPUS) {
  const corpus = JSON.parse(readFileSync(join(racine, 'test-utilisateur', 'corpus', fichier), 'utf8'));
  const classes = { reconnue: [], sens_different: [], manquee: [], ambiguite: [], refus_correct: [],
    acceptee_a_tort: [], ambiguite_manquee: [] };

  for (const entree of corpus.entrees) {
    const verdict = normaliser(entree.phrase);
    const ok = accepte(verdict);
    const code = ok ? codeDe(verdict.resultat) : undefined;
    const item = { ...entree, verdict: verdict.verdict, code, canonique: verdict.canonique };
    if (entree.attendu === 'accepte') {
      classes[!ok ? 'manquee' : code === entree.code ? 'reconnue' : 'sens_different'].push(item);
    } else if (entree.attendu === 'ambigu') {
      classes[ok ? 'acceptee_a_tort' : verdict.verdict === 'ambigu' ? 'ambiguite' : 'ambiguite_manquee'].push(item);
    } else {
      classes[ok ? 'acceptee_a_tort' : 'refus_correct'].push(item);
    }
  }

  const dansPerimetre = corpus.entrees.filter(entree => entree.perimetre && entree.attendu === 'accepte');
  const reconnuesDansPerimetre = classes.reconnue.filter(item => item.perimetre).length;
  const taux = dansPerimetre.length === 0 ? 0 : reconnuesDansPerimetre / dansPerimetre.length * 100;

  dire(`## Corpus de ${titre}`);
  dire('');
  for (const ligne of corpus.methode) dire('- ' + ligne);
  dire('');
  dire('| Classe | Nombre |');
  dire('|---|---|');
  dire(`| reconnues au sens exact attendu | **${classes.reconnue.length}** |`);
  dire(`| **différences de sens** | **${classes.sens_different.length}** |`);
  dire(`| claires et complètes, non reconnues | **${classes.manquee.length}** |`);
  dire(`| ambiguïtés correctement détectées | **${classes.ambiguite.length}** |`);
  dire(`| ambiguïtés non détectées (refus d’un autre genre) | **${classes.ambiguite_manquee.length}** |`);
  dire(`| refus corrects | **${classes.refus_correct.length}** |`);
  dire(`| **acceptées à tort** | **${classes.acceptee_a_tort.length}** |`);
  dire(`| total | ${corpus.entrees.length} |`);
  dire('');
  dire(`**Taux de reconnaissance, phrases dans le périmètre : ${reconnuesDansPerimetre} / ${dansPerimetre.length}`
    + ` = ${taux.toFixed(1)} %.**`);
  dire('');
  dire(`Erreurs de sens : **${classes.sens_different.length}**. Acceptations à tort : `
    + `**${classes.acceptee_a_tort.length}**. Ces deux chiffres doivent rester à zéro ;`);
  dire('un taux obtenu en les laissant monter ne vaudrait rien.');
  dire('');

  if (classes.manquee.length) {
    dire('### Phrases claires, dans le périmètre, non reconnues');
    dire('');
    for (const item of classes.manquee) {
      dire(`- « ${item.phrase} » — ${item.verdict}${item.perimetre ? '' : ' (hors périmètre)'}`);
    }
    dire('');
  }
  if (classes.sens_different.length || classes.acceptee_a_tort.length || classes.ambiguite_manquee.length) {
    dire('### À instruire');
    dire('');
    for (const cle of ['sens_different', 'acceptee_a_tort', 'ambiguite_manquee']) {
      for (const item of classes[cle]) {
        dire(`- \`${cle}\` « ${item.phrase} » → ${item.verdict}`
          + (item.code === undefined ? '' : `, code \`${item.code.replace(/\n/gu, '⏎')}\``)
          + (item.attendu === 'accepte' ? `, attendu \`${String(item.code).replace(/\n/gu, '⏎')}\`` : ''));
      }
    }
    dire('');
    echecs += classes.sens_different.length + classes.acceptee_a_tort.length;
  }
  console.log(`-- ${titre} : ${taux.toFixed(1)} % (${reconnuesDansPerimetre}/${dansPerimetre.length}), `
    + `${classes.sens_different.length} erreur(s) de sens, ${classes.acceptee_a_tort.length} acceptée(s) à tort`);
}

mkdirSync(join(racine, 'docs', 'phase2'), { recursive: true });
writeFileSync(join(racine, 'docs', 'phase2', 'MESURES_REFORMULATIONS.md'), lignes.join('\n') + '\n', 'utf8');
console.log('rapport : docs/phase2/MESURES_REFORMULATIONS.md');

// L'outil échoue sur les deux seules classes qui sont des DÉFAUTS. Le taux de
// reconnaissance, lui, est une mesure de périmètre : il ne fait pas échouer.
if (echecs) {
  console.error('ÉCHEC : ' + echecs + ' entrée(s) de sens différent ou acceptée(s) à tort.');
  process.exitCode = 1;
}
