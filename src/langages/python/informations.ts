/** Informations pédagogiques **passives** propres à Python.
 *
 * Lot P3, et volontairement incomplet : l'inventaire en prévoit une
 * trentaine, et c'est le lot P5 qui les écrira toutes. Celles-ci sont les
 * informations que les décisions **déjà validées** exigent — une décision qui
 * dit « avec une explication de son fonctionnement réel » n'est pas appliquée
 * tant que l'explication n'existe pas.
 *
 * Mêmes règles que le canal C17 :
 *   - `severity: 'information'`, jamais un avertissement déguisé ;
 *   - passives : elles n'empêchent rien, ne corrigent rien, ne proposent
 *     aucune formulation à recopier ;
 *   - elles énoncent ce que le langage fait, jamais ce que le programme fait.
 *
 * La portée est, à ce lot, la phrase entière. Pointer le mot exact demande les
 * intervalles de chaque enveloppe française : c'est du travail de P5, et le
 * dire vaut mieux que poser un intervalle approximatif.
 */
import type { SourceRange, TranslationResult } from '../../translate.ts';

export type InformationPython = {
  code: 'PY_CHAR_IS_A_STRING' | 'PY_NO_SEPARATOR_ADDED' | 'PY_BLOCK_NEEDS_A_BODY'
  | 'PY_TRUTHINESS' | 'PY_ANNOTATION_NOT_CHECKED' | 'PY_INT_IS_UNBOUNDED'
  | 'PY_NAME_REBINDS';
  severity: 'information';
  range: SourceRange;
  message: string;
};

const TEXTES: Readonly<Record<InformationPython['code'], string>> = {
  // Décision D8, validée : « avec une explication de son fonctionnement réel ».
  PY_CHAR_IS_A_STRING:
    'Python n’a pas de type caractère : ceci est une chaîne de longueur 1. '
    + '« \'A\' + 1 » y est une erreur, pas 66, et « \'A\' + \'B\' » vaut « \'AB\' ». '
    + 'L’annotation écrite est donc « str ».',
  // Décision D10, validée : aucun séparateur implicite.
  PY_NO_SEPARATOR_ADDED:
    'print ajoute normalement un saut de ligne à la fin. C-A l’a désactivé avec « end="" » '
    + 'parce que personne ne l’a demandé : pour obtenir un saut de ligne, il faut l’afficher.',
  PY_BLOCK_NEEDS_A_BODY:
    'En Python, un bloc ne peut pas rester vide : le fichier est incomplet, et donc invalide, '
    + 'jusqu’à ce que vous écriviez au moins une instruction indentée dessous. C-A n’écrit pas '
    + '« pass » à votre place : ce serait une instruction que vous n’avez pas demandée.',
  PY_TRUTHINESS:
    'Une valeur numérique nulle est fausse, comme en C17. Mais en Python, une chaîne vide, '
    + 'une liste vide et None sont fausses aussi : la règle est plus large que « différent de zéro ».',
  PY_ANNOTATION_NOT_CHECKED:
    'L’annotation de type n’est pas vérifiée à l’exécution : Python l’enregistre et la laisse '
    + 'aux outils de lecture. Elle dit votre intention, elle ne la garantit pas.',
  PY_INT_IS_UNBOUNDED:
    'Les entiers Python n’ont pas de taille fixe : ils grandissent avec la valeur, et il n’y a '
    + 'donc ni débordement ni entier non signé. Ce que C17 enseigne sur les bornes ne s’y applique pas.',
  PY_NAME_REBINDS:
    'Affecter un nom ne modifie pas l’objet précédent : le nom désigne désormais un autre objet. '
    + 'Deux noms peuvent désigner le même objet, et c’est par là que l’aliasing s’enseigne.',
};

/** Les genres qui ouvrent un bloc : leur corps reste à écrire. */
const EN_TETES = new Set(['IF', 'ELSE_IF', 'ELSE', 'WHILE', 'FUNC_DEF']);
const AFFICHAGES = new Set(['PRINT_INT', 'PRINT_TEXT', 'PRINT_NEWLINE', 'PRINT_FORMATTED',
  'NUMERIC_PRINT', 'PRINT_CHAR', 'PRINT_STRING', 'ARRAY_PRINT', 'ARRAY_PRINT_CHAR']);
const CARACTERES = new Set(['INIT_CHAR', 'ASSIGN_CHAR', 'ARRAY_ASSIGN_CHAR', 'PRINT_CHAR']);
const ANNOTATIONS = new Set(['NUMERIC_INIT', 'INIT_CHAR', 'FUNC_DEF']);
const AFFECTATIONS = new Set(['ASSIGN_INT', 'ASSIGN_EXPRESSION', 'NUMERIC_ASSIGN']);

/** Les informations passives d'une intention rendue en Python. Ordre stable :
 * il est lu par un humain dans un canal de sortie. */
export function expliquerPython(resultat: TranslationResult): InformationPython[] {
  if (resultat.status !== 'translated') return [];
  const kind = resultat.instruction.kind;
  const range: SourceRange = { start: 0, end: resultat.source.text.length };
  const codes: InformationPython['code'][] = [];

  if (CARACTERES.has(kind)) codes.push('PY_CHAR_IS_A_STRING');
  if (AFFICHAGES.has(kind)) codes.push('PY_NO_SEPARATOR_ADDED');
  if (EN_TETES.has(kind)) codes.push('PY_BLOCK_NEEDS_A_BODY');
  if (kind === 'IF' || kind === 'ELSE_IF' || kind === 'WHILE') codes.push('PY_TRUTHINESS');
  if (ANNOTATIONS.has(kind)) codes.push('PY_ANNOTATION_NOT_CHECKED');
  if (kind === 'INIT_INT' || kind === 'NUMERIC_INIT') codes.push('PY_INT_IS_UNBOUNDED');
  if (AFFECTATIONS.has(kind)) codes.push('PY_NAME_REBINDS');

  return codes.map(code => ({ code, severity: 'information', range, message: TEXTES[code] }));
}
