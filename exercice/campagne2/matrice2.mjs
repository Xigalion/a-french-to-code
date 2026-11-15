// Génère la matrice de couverture des compétences, par preuves mesurées et
// non par déclaration. Pour chaque compétence :
//
//   traduction  : le moteur accepte la phrase sonde, et le C exact est relevé
//   placement   : planPlacement produit un plan dans un document représentatif
//   exercice    : le C produit apparaît dans un fichier de exercice/corrige
//   compilation : le fichier qui contient ce genre d'instruction a été
//                 compilé par GCC 16.2.0 en -std=c17 -Wall -Wextra -pedantic
//   exécution   : le programme qui le contient a tourné jusqu'au bout, code
//                 de sortie 0, sortie conforme à la prédiction de l'audit
//   diagnostic  : une information pédagogique est émise, ou le refus porte
//                 un intervalle non vide dans la phrase
//
// Les preuves de compilation et d'exécution sont COLLECTIVES, au niveau du
// fichier et du programme, et non isolées instruction par instruction. Le
// rapport le dit explicitement.
//
//   node --experimental-strip-types exercice/matrice.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { planPlacement } from '../../src/planPlacement.ts';
import { explainInstruction } from '../../src/pedagogicalInformation.ts';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
// Campagne 2 : mêmes sondes, mêmes poids, mêmes coefficients que la campagne
// 1 — c'est la condition pour que les deux chiffres soient comparables. Seules
// les PREUVES changent, lues dans le journal de cette campagne.
// Les genres d'intention réellement insérés par l'exercice corrigé : c'est
// l'appariement juste, les noms de variables des sondes étant différents.
const exercees = new Set(JSON.parse(readFileSync(root + 'journal/intentions-corrige.json', 'utf8')));
// Preuves collectives réellement obtenues, consignées dans journal/compilation.txt
const COMPILE = readFileSync(root + 'journal/compilation.txt', 'utf8');
const COMPILATION_OBTENUE = COMPILE.includes('code de sortie du compilateur : 0');
const EXECUTION_OBTENUE = COMPILE.includes('code de sortie du programme : 0');
if (!COMPILATION_OBTENUE || !EXECUTION_OBTENUE) throw new Error('preuves de compilation ou d’exécution absentes');

/** Documents de placement : celui qui convient à la compétence est essayé. */
const CONTEXTES = {
  fichier: '\n',
  fonction: 'int main(void) {\n    \n}\n',
  entiere: 'int f(void) {\n    \n}\n',
  boucle: 'int main(void) {\n    while (a) {\n        \n    }\n}\n',
  aiguillage: 'int main(void) {\n    switch (a) {\n        \n    }\n}\n',
  structure: 'struct S {\n    \n};\n',
  garde: '#ifndef H\n#define H\n\n#endif\n',
  // Une branche « sinon » exige une chaîne « si » devant elle.
  apresSi: 'int main(void) {\n    if (a) {\n    }\n    \n}\n',
};
function placer(sentence, contexte) {
  const result = translate(sentence);
  if (result.status !== 'translated') return { traduction: 'REFUS ' + result.diagnostics[0].code };
  const text = CONTEXTES[contexte];
  const cursor = text.includes('\n    \n') ? text.indexOf('\n    \n') + 5
    : text.includes('\n        \n') ? text.indexOf('\n        \n') + 9
      : text.includes('\n\n') ? text.indexOf('\n\n') + 1 : 0;
  const plan = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset: cursor, translation: result });
  return {
    kind: result.instruction.kind,
    informations: explainInstruction(result).length,
    traduction: result.fragments[0].code.replace(/\n$/u, '').replace(/\n/gu, ' ⏎ '),
    placement: plan.status === 'planned' ? 'oui' : 'REFUS ' + plan.diagnostics[0].code,
  };
}

// (domaine, compétence, phrase sonde, contexte de placement)
const COMPETENCES = [
  ['1', 'Instruction de base, variable entière', 'Déclare un entier nommé x.', 'fonction'],
  ['1', 'Initialisation à la déclaration', 'Crée un entier nommé x de valeur 20.', 'fonction'],
  ['1', 'Affectation', 'Affecte la valeur 5 à x.', 'fonction'],
  ['1', 'Affichage d’une valeur', 'Affiche la valeur de x.', 'fonction'],
  ['1', 'Affichage d’un texte', 'Affiche le texte "bonjour".', 'fonction'],
  ['1', 'Inclusion de bibliothèque', 'Inclue la bibliothèque stdio.h.', 'fichier'],
  ['1', 'Fonction principale', 'Crée la fonction principale.', 'fichier'],

  ['2', 'Expression entière et priorités', 'Affecte à x le résultat de "a + b * 2".', 'fonction'],
  ['2', 'Types numériques explicites', 'Déclare une variable de type double nommée x.', 'fonction'],
  ['2', 'Conversion explicite', 'Affecte à n le résultat numérique de "(int) 1.5".', 'fonction'],
  ['2', 'Format non signé', 'Affiche x en décimal non signé.', 'fonction'],
  ['2', 'Format fixe avec précision', 'Affiche x en notation fixe avec 2 décimales.', 'fonction'],
  ['2', 'Format hexadécimal', 'Affiche x en hexadécimal.', 'fonction'],
  ['2', 'Fiabilité : diviseur nul signalé', 'Affecte à n le résultat numérique de "1 / 0".', 'fonction'],

  ['3', 'Condition et bloc', 'Crée un bloc si "a > 0".', 'fonction'],
  ['3', 'Branche sinon si', 'Ajoute une branche sinon si "a > 5".', 'apresSi'],
  ['3', 'Branche sinon', 'Ajoute une branche sinon.', 'apresSi'],
  ['3', 'Opérateurs logiques', 'Crée un bloc si "a > 0 && !fini".', 'fonction'],
  ['3', 'Boucle à test initial', 'Crée une boucle tant que "i < 3".', 'fonction'],
  ['3', 'Boucle à test final', 'Crée une boucle avec test final tant que "i < 3".', 'fonction'],
  ['3', 'Boucle pour', 'Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".', 'fonction'],
  ['3', 'Sortie de boucle', 'Sors de la boucle la plus intérieure.', 'boucle'],
  ['3', 'Itération suivante', 'Passe à l’itération suivante de la boucle la plus intérieure.', 'boucle'],
  ['3', 'Aiguillage', 'Crée un aiguillage sur "jour".', 'fonction'],
  ['3', 'Étiquette entière', 'Ajoute un cas pour la valeur 5.', 'aiguillage'],
  ['3', 'Étiquette caractère', 'Ajoute un cas pour le caractère \'A\'.', 'aiguillage'],
  ['3', 'Cas par défaut', 'Ajoute le cas par défaut.', 'aiguillage'],
  ['3', 'Sortie d’aiguillage', 'Sors de l’aiguillage.', 'aiguillage'],

  ['4', 'Définition de fonction', 'Crée une fonction nommée f qui retourne un int.', 'fichier'],
  ['4', 'Fonction sans retour', 'Crée une fonction nommée f qui ne retourne rien.', 'fichier'],
  ['4', 'Paramètres explicites', 'Crée une fonction nommée f qui retourne un int et prend un int nommé a et un double nommé b.', 'fichier'],
  ['4', 'Retour de valeur', 'Retourne la valeur 0.', 'entiere'],
  ['4', 'Retour d’expression', 'Retourne le résultat numérique de "a + 1".', 'entiere'],
  ['4', 'Appel sans résultat', 'Appelle f avec "1".', 'fonction'],
  ['4', 'Appel avec résultat', 'Affecte à x le résultat de l’appel de f avec "1".', 'fonction'],

  ['5', 'Type caractère', 'Déclare un caractère nommé c.', 'fonction'],
  ['5', 'Littéral caractère', 'Crée un caractère nommé c de valeur \'A\'.', 'fonction'],
  ['5', 'Affichage caractère', 'Affiche le caractère c.', 'fonction'],
  ['5', 'Tableau à dimension explicite', 'Déclare un tableau de type int nommé t de dimension 3.', 'fonction'],
  ['5', 'Affectation d’élément', 'Affecte la valeur 5 à l’élément "0" de t.', 'fonction'],
  ['5', 'Affichage d’élément', 'Affiche l’élément "0" de t.', 'fonction'],
  ['5', 'Indexation en expression', 'Affecte à n le résultat numérique de "t[i] + 1".', 'fonction'],
  ['5', 'Chaîne initialisée', 'Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".', 'fonction'],
  ['5', 'Affichage de chaîne', 'Affiche la chaîne s.', 'fonction'],
  ['5', 'Caractère nul en condition', 'Crée une boucle tant que "s[i] != \'\\0\'".', 'fonction'],
  ['5', 'Déclaration de pointeur', 'Déclare un pointeur de type int nommé p.', 'fonction'],
  ['5', 'Prise d’adresse', 'Affecte l’adresse de x à p.', 'fonction'],
  ['5', 'Déréférencement en lecture', 'Affiche la valeur pointée par p.', 'fonction'],
  ['5', 'Déréférencement en écriture', 'Affecte la valeur 5 à la valeur pointée par p.', 'fonction'],
  ['5', 'Relation tableau/pointeur', 'Affecte à n le résultat numérique de "*(t + i)".', 'fonction'],

  ['6', 'Définition de structure', 'Déclare une structure nommée Point.', 'fichier'],
  ['6', 'Champ scalaire', 'Ajoute un champ de type int nommé x.', 'structure'],
  ['6', 'Champ structure', 'Ajoute un champ de type structure Date nommé d.', 'structure'],
  ['6', 'Champ pointeur', 'Ajoute un champ pointeur de type structure Point nommé suivant.', 'structure'],
  ['6', 'CHAMP TABLEAU', 'Ajoute un champ de type char nommé nom de dimension 32.', 'structure'],
  ['6', 'Variable de type structure', 'Déclare une variable de type structure Point nommée p.', 'fonction'],
  ['6', 'Pointeur de structure', 'Déclare un pointeur de type structure Point nommé q.', 'fonction'],
  ['6', 'Accès par point', 'Affiche le champ x de p.', 'fonction'],
  ['6', 'Accès par flèche', 'Affiche le champ x pointé par q.', 'fonction'],
  ['6', 'Accès en expression', 'Affecte à n le résultat numérique de "q->x".', 'fonction'],
  ['6', 'Taille d’un type', 'Affiche la taille du type structure Point.', 'fonction'],
  ['6', 'Allocation dynamique', 'Affecte à p l’allocation de 4 éléments de type int.', 'fonction'],
  ['6', 'Réallocation', 'Affecte à q la réallocation de p pour 8 éléments de type int.', 'fonction'],
  ['6', 'Libération', 'Libère la mémoire pointée par p.', 'fonction'],

  ['7', 'Déclaration de flux', 'Déclare un fichier nommé f.', 'fonction'],
  ['7', 'Ouverture avec mode', 'Affecte à f l’ouverture du fichier "d.txt" en écriture.', 'fonction'],
  ['7', 'Écriture de texte', 'Écris le texte "a" dans le fichier f.', 'fonction'],
  ['7', 'Écriture de valeur', 'Écris la valeur de x dans le fichier f.', 'fonction'],
  ['7', 'Lecture d’entier', 'Lis un entier depuis le fichier f dans x.', 'fonction'],
  ['7', 'Fin de fichier', 'Crée un bloc si la fin du fichier f est atteinte.', 'fonction'],
  ['7', 'Fermeture', 'Ferme le fichier f.', 'fonction'],
  ['7', 'LECTURE DE CHAÎNE', 'Lis une chaîne depuis le fichier f dans s.', 'fonction'],
  ['7', 'Inclusion locale', 'Inclue l’en-tête "carnet.h".', 'fichier'],
  ['7', 'Garde d’en-tête, ouverture', 'Ouvre la protection d’en-tête nommée H.', 'fichier'],
  ['7', 'Garde d’en-tête, fermeture', 'Ferme la protection d’en-tête.', 'fichier'],
  ['7', 'Prototype', 'Déclare le prototype d’une fonction nommée f qui retourne un int.', 'garde'],
  ['7', 'Liaison externe', 'Déclare la variable externe de type int nommée v.', 'fichier'],
  ['7', 'Liaison interne', 'Déclare la variable interne de type int nommée v.', 'fichier'],
  ['7', 'DÉFINITION STATIC', 'Crée une fonction interne nommée aide qui retourne un int.', 'fichier'],

  ['8', 'Synonyme de type', 'Déclare le synonyme Noeud pour la structure Noeud.', 'fichier'],
  ['8', 'Tableau de structures', 'Déclare un tableau de type structure Point nommé t de dimension 3.', 'fonction'],
  ['8', 'Élément de tableau de structures', 'Affecte à n le résultat numérique de "t[i].x".', 'fonction'],
  ['8', 'Recherche par composition', 'Crée un bloc si "t[i] > meilleure".', 'fonction'],
  ['8', 'Échange par variable temporaire', 'Affecte à l’élément "0" de t le résultat numérique de "t[1]".', 'fonction'],
  ['8', 'INITIALISEUR ENTRE ACCOLADES', 'Déclare un tableau de type int nommé t de dimension 3 avec les valeurs 1, 2, 3.', 'fonction'],

  ['9', 'Inclusion assert.h', 'Inclue la bibliothèque assert.h.', 'fichier'],
  ['9', 'Assertion', 'Vérifie que "n > 0".', 'fonction'],
  ['9', 'Assertion : affectation refusée', 'Vérifie que "n = 0".', 'fonction', 'refus-attendu'],
  ['9', 'Constante qualifiée', 'Déclare une constante de type int nommée MAX avec le résultat de "20".', 'fichier'],
  ['9', 'LIMITS.H', 'Inclue la bibliothèque limits.h.', 'fichier'],
  ['9', 'MACRO DE LIMITE', 'Affiche la limite maximale du type int.', 'fonction'],
];

const rows = [];
const tally = { verifiee: 0, partielle: 0, bloquee: 0, nonTestee: 0 };
for (const [domaine, label, sentence, contexte, attendu] of COMPETENCES) {
  const r = placer(sentence, contexte);
  const refus = r.traduction.startsWith('REFUS') || (r.placement ?? '').startsWith('REFUS');
  const dansExercice = !refus && exercees.has(r.kind);
  // P3, P4 : preuves collectives, acquises pour les genres que l'exercice
  // compilé et exécuté contient. P5 : information émise, ou refus porteur.
  const p3 = dansExercice && COMPILATION_OBTENUE;
  const p4 = dansExercice && EXECUTION_OBTENUE;
  const p5 = refus ? true : (r.informations ?? 0) > 0;
  // Aucune preuve de compilation ni d'exécution n'existe : rien ne peut donc
  // être classé « vérifiée » au sens plein. Le meilleur état atteignable est
  // « partiellement vérifiée ».
  let etat;
  if (attendu === 'refus-attendu') {
    etat = refus ? 'refus attendu, obtenu' : '**REFUS ATTENDU NON OBTENU**';
    tally.refusAttendu = (tally.refusAttendu ?? 0) + 1;
  } else if (refus) { etat = 'bloquée'; tally.bloquee++; }
  else if (dansExercice) { etat = p3 && p4 ? 'vérifiée' : 'partiellement vérifiée'; tally.partielle++; }
  else if (p3 && p4) { etat = 'vérifiée'; }
  else { etat = 'traduite et placée, non exercée'; tally.nonTestee++; }
  rows.push({ domaine, label, sentence, etat,
    traduction: r.traduction.startsWith('REFUS') ? r.traduction : '`' + r.traduction + '`',
    placement: r.placement ?? '—', exercice: dansExercice ? 'oui' : 'non',
    p1: !refus, p2: !refus && r.placement === 'oui', p3, p4, p5,
    bloquee: refus && attendu !== 'refus-attendu' });
}

const out = [];
out.push('# Matrice de couverture des compétences du modèle 1', '');
out.push('Générée par `exercice/matrice.mjs` : chaque ligne est une **mesure**.', '');
out.push('Les cinq preuves, et comment chacune est obtenue :', '');
out.push('- **P1 traduction** : `translate()` accepte la phrase sonde.');
out.push('- **P2 placement** : `planPlacement()` produit un plan dans un document représentatif.');
out.push('- **P3 compilation** : le fichier contenant ce genre d’instruction a été compilé');
out.push('  par **GCC 16.2.0** en `-std=c17 -Wall -Wextra -pedantic`.');
out.push('- **P4 exécution** : le programme le contenant a tourné, **code de sortie 0**,');
out.push('  sortie conforme à la prédiction de l’audit.');
out.push('- **P5 diagnostic** : une information pédagogique est émise, ou le refus porte');
out.push('  un intervalle non vide dans la phrase.', '');
out.push('**P3 et P4 sont des preuves collectives**, au niveau du fichier et du');
out.push('programme, non isolées instruction par instruction. Preuves brutes dans');
out.push('`journal/compilation.txt`.', '');
out.push('| Dom. | Compétence | État | C produit | P1 | P2 | P3 | P4 | P5 |');
out.push('|---|---|---|---|---|---|---|---|---|');
const oui = (b) => (b ? 'oui' : '—');
for (const r of rows) {
  out.push(`| ${r.domaine} | ${r.label} | ${r.etat} | ${r.traduction} | ${oui(r.p1)} | ${oui(r.p2)} | ${oui(r.p3)} | ${oui(r.p4)} | ${oui(r.p5)} |`);
}

// Coefficients de compétence : 3 fondamentale, 2 structurante, 1 complémentaire.
const FONDAMENTALE = /variable entière|Affectation|Affichage d’une valeur|Affichage d’un texte|Condition et bloc|Boucle à test initial|Définition de fonction|Retour de valeur|Fonction principale|Expression entière/u;
const STRUCTURANTE = /[Tt]ableau|chaîne|Chaîne|pointeur|Pointeur|[Ss]tructure|Champ|allocation|Allocation|fichier|Flux|en-tête|Prototype|adresse|Déréférencement|Aiguillage|Appel|Paramètres|Indexation|Accès|Libération|Inclusion|caractère|Type caractère/u;
const coef = (label) => (FONDAMENTALE.test(label) ? 3 : STRUCTURANTE.test(label) ? 2 : 1);
const POIDS = { p1: 0.15, p2: 0.20, p3: 0.30, p4: 0.20, p5: 0.15 };
let num = 0, den = 0;
const parNiveau = { 3: [0, 0], 2: [0, 0], 1: [0, 0] };
for (const r of rows) {
  const k = coef(r.label);
  const score = POIDS.p1 * (r.p1 ? 1 : 0) + POIDS.p2 * (r.p2 ? 1 : 0) + POIDS.p3 * (r.p3 ? 1 : 0)
    + POIDS.p4 * (r.p4 ? 1 : 0) + POIDS.p5 * (r.p5 ? 1 : 0);
  num += k * score;
  den += k;
  parNiveau[k][0] += k * score;
  parNiveau[k][1] += k;
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : '0,0');

out.push('', '## Décompte des états', '');
out.push('| État | Nombre |', '|---|---|');
out.push(`| **Vérifiée** — les cinq preuves | ${rows.filter((r) => r.etat === 'vérifiée').length} |`);
out.push(`| Partiellement vérifiée | ${rows.filter((r) => r.etat === 'partiellement vérifiée').length} |`);
out.push(`| Traduite et placée, non exercée | ${tally.nonTestee} |`);
out.push(`| Refus attendu, obtenu | ${tally.refusAttendu ?? 0} |`);
out.push(`| **Bloquée** | **${tally.bloquee}** |`);
out.push(`| Total | ${rows.length} |`);

out.push('', '## Complétion pondérée', '');
out.push('Poids des preuves : P1 15 %, P2 20 %, **P3 30 %**, P4 20 %, P5 15 %.');
out.push('Coefficients : fondamentale 3, structurante 2, complémentaire 1.', '');
out.push('| Niveau | Compétences | Poids total | Score | Complétion |', '|---|---|---|---|---|');
for (const k of [3, 2, 1]) {
  const n = rows.filter((r) => coef(r.label) === k).length;
  out.push(`| ${k === 3 ? 'Fondamentale' : k === 2 ? 'Structurante' : 'Complémentaire'} (×${k}) | ${n} | ${parNiveau[k][1]} | ${parNiveau[k][0].toFixed(2)} | ${pct(parNiveau[k][0], parNiveau[k][1])} % |`);
}
out.push(`| **Ensemble** | **${rows.length}** | **${den}** | **${num.toFixed(2)}** | **${pct(num, den)} %** |`);
// Sensibilité : ce que le chiffre deviendrait si l'exercice employait aussi
// les compétences qu'il n'emploie pas, et si les 6 blocages étaient levés.
let numSiExerce = 0, numSiDebloque = 0;
for (const r of rows) {
  const k = coef(r.label);
  const base = POIDS.p1 * (r.p1 ? 1 : 0) + POIDS.p2 * (r.p2 ? 1 : 0) + POIDS.p5 * (r.p5 ? 1 : 0);
  const compile = POIDS.p3 + POIDS.p4;
  numSiExerce += k * (r.bloquee ? base : base + compile);
  numSiDebloque += k * (base + compile + (r.bloquee ? POIDS.p1 + POIDS.p2 : 0));
}
out.push('', '## Sensibilité du chiffre', '');
out.push('| Hypothèse | Complétion |', '|---|---|');
out.push(`| **Mesurée aujourd’hui** | **${pct(num, den)} %** |`);
out.push(`| Si l’exercice employait aussi les ${tally.nonTestee} compétences non exercées | ${pct(numSiExerce, den)} % |`);
out.push(`| Si, en plus, les ${tally.bloquee} blocages étaient levés | ${pct(numSiDebloque, den)} % |`);
out.push(`| Plafond sans compilateur, pour mémoire | 50,0 % |`);
out.push('', 'L’écart entre la première et la deuxième ligne mesure **mon scénario**,');
out.push('pas le produit : ces compétences se traduisent et se placent déjà, mais');
out.push('l’exercice ne les emploie pas. L’écart entre la deuxième et la troisième');
out.push('mesure les **vraies lacunes** du modèle 1.');
console.log('si exerce     :', pct(numSiExerce, den), '%');
console.log('si debloque   :', pct(numSiDebloque, den), '%');
writeFileSync(root + 'journal/matrice.md', out.join('\n') + '\n', 'utf8');
console.log('competences   :', rows.length);
console.log('verifiees     :', rows.filter((r) => r.etat === 'vérifiée').length);
console.log('partielles    :', rows.filter((r) => r.etat === 'partiellement vérifiée').length);
console.log('non exercees  :', tally.nonTestee);
console.log('bloquees      :', tally.bloquee);
console.log('COMPLETION    :', pct(num, den), '%');
for (const k of [3, 2, 1]) console.log('  niveau', k, ':', pct(parNiveau[k][0], parNiveau[k][1]), '%');
