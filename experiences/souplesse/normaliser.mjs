// EXPÉRIENCE — souplesse linguistique déterministe, en AMONT du moteur gelé.
//
// Principe : ne pas toucher à l'analyseur strict. Une couche de
// normalisation réécrit la phrase de l'utilisateur en phrases CANDIDATES du
// catalogue, et c'est le moteur strict qui arbitre. Il reste le seul juge de
// ce qui est une phrase valide.
//
//   phrase libre → substitutions du lexique → N candidates → translate()
//     1 lecture acceptée  → acceptée, et la phrase d'origine est conservée
//     0 lecture acceptée  → refus : rien n'est deviné
//     ≥2 lectures de SENS DIFFÉRENT → refus d'ambiguïté, les deux montrées
//     ≥2 lectures de MÊME sens      → acceptée : il n'y a pas d'ambiguïté
//
// Quatre propriétés, et ce sont elles qui font la différence entre souplesse
// linguistique et relâchement pédagogique :
//   - DÉTERMINISME : un lexique est une table, jamais une inférence ;
//   - AUCUNE INVENTION : une information absente reste absente, le refus le
//     dit, et aucune valeur par défaut n'est ajoutée ;
//   - MODE STRICT PRÉSERVÉ : la couche est désactivée par défaut ;
//   - TRAÇABILITÉ : le commentaire inséré garde la phrase DE L'UTILISATEUR.

import { translate } from '../../src/translate.ts';

/** Le lexique : des suites de mots, vers une ou plusieurs formes du
 * catalogue. Plusieurs cibles = un homonyme, que le contexte tranchera ou
 * pas. Rien ici n'est déduit : tout est écrit. */
export const LEXIQUE = [
  // Variantes grammaticales d'un même verbe : infinitif, impératif pluriel.
  { libre: 'créer', formes: ['Crée'] },
  { libre: 'créez', formes: ['Crée'] },
  { libre: 'afficher', formes: ['Affiche'] },
  { libre: 'affichez', formes: ['Affiche'] },
  { libre: 'déclarer', formes: ['Déclare'] },
  { libre: 'déclarez', formes: ['Déclare'] },
  { libre: 'retourner', formes: ['Retourne'] },

  // Synonymes stricts : un seul sens possible.
  { libre: 'appelé', formes: ['nommé'] },
  { libre: 'appelée', formes: ['nommée'] },
  { libre: 'valant', formes: ['de valeur'] },
  { libre: 'initialisé à', formes: ['de valeur'] },
  { libre: 'nombre entier', formes: ['entier'] },

  // Formulations équivalentes, plus courtes que la forme du catalogue.
  { libre: 'sors de la boucle', formes: ['Sors de la boucle la plus intérieure'] },
  { libre: 'passe à l’itération suivante', formes: ['Passe à l’itération suivante de la boucle la plus intérieure'] },

  // Homonymes : plusieurs lectures, c'est le contexte qui tranche — ou le
  // refus. « Mets » peut affecter ou ajouter ; « Montre » peut afficher une
  // valeur ou un caractère, et C-A ne connaît pas le type de la variable.
  { libre: 'mets', formes: ['Affecte', 'Ajoute'] },
  { libre: 'montre', formes: ['Affiche la valeur de', 'Affiche le caractère'] },
];

/** Bornes : la combinatoire doit rester visible et finie. Au-delà, refus —
 * jamais un essai partiel. */
export const BUDGET = { substitutions: 3, candidates: 32 };

const minuscule = (texte) => texte.toLowerCase().replace(/'/gu, '’');

/** Les occurrences du lexique dans la phrase, de la plus longue à la plus
 * courte pour qu'une suite de mots gagne sur un mot seul. */
function trouver(phrase) {
  const bas = minuscule(phrase);
  const trouvees = [];
  for (const entree of [...LEXIQUE].sort((a, b) => b.libre.length - a.libre.length)) {
    const position = bas.indexOf(minuscule(entree.libre));
    if (position === -1) continue;
    if (trouvees.some(t => position < t.fin && position + entree.libre.length > t.debut)) continue;
    trouvees.push({ debut: position, fin: position + entree.libre.length, entree });
  }
  return trouvees.sort((a, b) => a.debut - b.debut);
}

/** Produit les phrases candidates par substitution, sans rien réordonner. */
function candidates(phrase, trouvees) {
  let liste = [phrase];
  for (const { debut, fin, entree } of [...trouvees].reverse()) {
    const suivantes = [];
    for (const partielle of liste) {
      for (const forme of entree.formes) suivantes.push(partielle.slice(0, debut) + forme + partielle.slice(fin));
    }
    liste = suivantes;
  }
  return [...new Set(liste)];
}

/** Deux lectures ont le même sens si leur instruction traduite est
 * identique, paramètres compris. Les intervalles sont exclus : ils désignent
 * des positions dans des phrases différentes. */
function sens(resultat) {
  return JSON.stringify(resultat.instruction, (cle, valeur) =>
    (cle === 'range' || cle.endsWith('Range') ? undefined : valeur));
}

/**
 * @returns un verdict explicite. Jamais de phrase corrigée rendue à
 * l'utilisateur sans qu'il la voie : `canonique` est ce que le moteur a lu,
 * `source` reste ce qu'il a écrit.
 */
export function normaliser(phrase) {
  // 1. Le mode strict d'abord : si la phrase est déjà du catalogue, la
  //    couche ne fait rien du tout. Aucune réécriture inutile.
  const directe = translate(phrase);
  if (directe.status === 'translated') {
    return { verdict: 'strict', source: phrase, canonique: phrase, resultat: directe };
  }

  const trouvees = trouver(phrase);
  if (trouvees.length === 0) {
    return { verdict: 'refus', code: 'AUCUNE_VARIANTE_CONNUE', source: phrase,
      message: 'Cette formulation n’appartient pas au catalogue, et aucun mot du lexique ne s’y '
        + 'trouve : il n’y a rien à normaliser. ' + directe.diagnostics[0].message };
  }
  if (trouvees.length > BUDGET.substitutions) {
    return { verdict: 'refus', code: 'TROP_DE_SUBSTITUTIONS', source: phrase,
      message: trouvees.length + ' mots du lexique dans une seule phrase, au-delà des '
        + BUDGET.substitutions + ' autorisés. La phrase est reformulée par l’utilisateur, pas devinée.' };
  }

  const essais = candidates(phrase, trouvees);
  if (essais.length > BUDGET.candidates) {
    return { verdict: 'refus', code: 'TROP_DE_LECTURES', source: phrase,
      message: essais.length + ' lectures possibles, au-delà des ' + BUDGET.candidates + ' autorisées.' };
  }

  // 2. Le moteur strict est l'arbitre : une candidate n'est retenue que s'il
  //    l'accepte. La couche ne décide jamais qu'une phrase est valide.
  const acceptees = [];
  for (const essai of essais) {
    const resultat = translate(essai);
    if (resultat.status === 'translated') acceptees.push({ essai, resultat, sens: sens(resultat) });
  }

  if (acceptees.length === 0) {
    return { verdict: 'refus', code: 'AUCUNE_LECTURE_VALIDE', source: phrase, essais,
      message: 'Aucune des ' + essais.length + ' lectures du lexique n’appartient au catalogue. '
        + 'Ce qui manque n’est pas deviné : ' + directe.diagnostics[0].message };
  }

  const distincts = new Map();
  for (const a of acceptees) if (!distincts.has(a.sens)) distincts.set(a.sens, a);
  if (distincts.size > 1) {
    return { verdict: 'ambigu', code: 'AMBIGUITE_NON_RESOLUE', source: phrase,
      lectures: [...distincts.values()].map(a => ({
        phrase: a.essai, intention: a.resultat.instruction.kind,
        code: a.resultat.fragments[0].code.replace(/\n$/u, ''),
      })),
      message: 'Cette phrase a ' + distincts.size + ' lectures de sens différent. C-A ne choisit pas : '
        + 'reformulez avec l’une des phrases du catalogue.' };
  }

  // 3. Une seule lecture : acceptée. Le contexte a tranché si plusieurs
  //    candidates existaient, parce qu'une seule appartenait au catalogue.
  const [retenue] = distincts.values();
  return { verdict: acceptees.length === essais.length && essais.length === 1 ? 'normalise' : 'resolu',
    source: phrase, canonique: retenue.essai, resultat: retenue.resultat,
    lecturesEssayees: essais.length, lecturesValides: acceptees.length };
}
