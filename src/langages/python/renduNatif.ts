/** Le rendu des intentions **propres à Python**.
 *
 * Lot P4. Séparé de `rendu.ts`, qui ne traite que les intentions du catalogue
 * partagé : les deux catalogues ne se mélangent pas, et un lecteur doit
 * pouvoir voir d'un coup d'œil ce que Python sait écrire de son propre fonds.
 *
 * Aucune de ces intentions ne porte de valeur par défaut, et aucune n'écrit
 * une ligne qui n'a pas été demandée. Les deux endroits où Python en offrirait
 * une — le `sep` de `print`, la borne de `range` à un seul argument — sont
 * écartés : la phrase donne l'information, ou il n'y a pas de phrase.
 */
import { renderStringLiteral } from '../../stringLiteral.ts';
import { rendreExpressionPython } from './expression.ts';
import type { InstructionPython } from './instructions.ts';

export type RenduNatif =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

/** Les intentions natives qui ouvrent un bloc. Leur corps reste à écrire, et
 * aucun `pass` n'est produit. */
export const EN_TETES_NATIFS: ReadonlySet<string> = new Set([
  'PY_POUR_INTERVALLE', 'PY_POUR_CHAQUE', 'PY_SI_PRINCIPAL',
]);

/** Toutes les intentions natives livrées. Sert au registre et aux tests : une
 * intention déclarée ici et non rendue serait une intention morte. */
export const NATIVES_PYTHON: ReadonlySet<string> = new Set([
  'PY_LISTE_VIDE', 'PY_LISTE_VALEURS', 'PY_AJOUTER', 'PY_LONGUEUR',
  'PY_POUR_INTERVALLE', 'PY_POUR_CHAQUE',
  'PY_DIV_ENTIERE', 'PY_DIV_REELLE', 'PY_MODULO',
  'PY_INIT_STR', 'PY_INIT_BOOL', 'PY_CONVERSION', 'PY_INPUT', 'PY_SI_PRINCIPAL',
]);

export function rendrePythonNatif(instruction: InstructionPython): RenduNatif {
  const rendu = (code: string): RenduNatif => ({ status: 'rendu', code });
  const refus = (raison: string): RenduNatif => ({ status: 'refus', raison });
  /** Rend une expression, en propageant son refus tel quel : une division ou
   * un pointeur dans une valeur de liste est refusé comme ailleurs. */
  const expr = (noeud: Parameters<typeof rendreExpressionPython>[0],
    suite: (code: string) => RenduNatif): RenduNatif => {
    const resultat = rendreExpressionPython(noeud);
    return resultat.status === 'refus' ? refus(resultat.raison) : suite(resultat.code);
  };
  /** Rend une liste d'expressions, en s'arrêtant au premier refus. */
  const liste = (noeuds: readonly Parameters<typeof rendreExpressionPython>[0][],
    suite: (codes: string[]) => RenduNatif): RenduNatif => {
    const codes: string[] = [];
    for (const noeud of noeuds) {
      const resultat = rendreExpressionPython(noeud);
      if (resultat.status === 'refus') return refus(resultat.raison);
      codes.push(resultat.code);
    }
    return suite(codes);
  };

  switch (instruction.kind) {
    // L'annotation vient de la phrase — « une liste » — comme la décision D9
    // l'autorise : conserver ce que l'utilisateur a dit ne coûte rien.
    case 'PY_LISTE_VIDE':
      return rendu(`${instruction.parameters.name}: list = []\n`);
    case 'PY_LISTE_VALEURS':
      return liste(instruction.parameters.valeurs,
        codes => rendu(`${instruction.parameters.name}: list = [${codes.join(', ')}]\n`));
    case 'PY_AJOUTER':
      return expr(instruction.parameters.valeur,
        code => rendu(`${instruction.parameters.name}.append(${code})\n`));
    case 'PY_LONGUEUR':
      return rendu(`${instruction.parameters.name} = len(${instruction.parameters.source})\n`);
    // Les deux bornes sont écrites, toutes les deux : `range(n)` à un seul
    // argument sous-entend un zéro que personne n'a demandé.
    case 'PY_POUR_INTERVALLE': {
      const { name, debut, fin } = instruction.parameters;
      return expr(debut, codeDebut => expr(fin,
        codeFin => rendu(`for ${name} in range(${codeDebut}, ${codeFin}):\n`)));
    }
    case 'PY_POUR_CHAQUE':
      return rendu(`for ${instruction.parameters.name} in ${instruction.parameters.collection}:\n`);
    // Décision D3 : les deux quotients sont distincts, et chacun porte son
    // opérateur. Le parenthésage est celui du catalogue C, pour la même
    // raison : la priorité lue est la priorité qui s'applique.
    case 'PY_DIV_ENTIERE': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} // ${d})\n`)));
    }
    case 'PY_DIV_REELLE': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} / ${d})\n`)));
    }
    // Décision D13 : le modulo Python a sa propre phrase, parce qu'il n'a pas
    // la sémantique de celui de C17 sur un opérande négatif.
    case 'PY_MODULO': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} % ${d})\n`)));
    }
    case 'PY_INIT_STR':
      return rendu(`${instruction.parameters.name}: str = ${renderStringLiteral(instruction.parameters.texte)}\n`);
    case 'PY_INIT_BOOL':
      return rendu(`${instruction.parameters.name}: bool = ${instruction.parameters.valeur ? 'True' : 'False'}\n`);
    case 'PY_CONVERSION': {
      const { name, conversion, source } = instruction.parameters;
      return rendu(`${name} = ${conversion}(${source})\n`);
    }
    // `input()` sans invite : une invite serait un texte que personne n'a
    // écrit. Pour en afficher une, il y a une phrase d'affichage.
    case 'PY_INPUT':
      return rendu(`${instruction.parameters.name} = input()\n`);
    case 'PY_SI_PRINCIPAL':
      return rendu('if __name__ == "__main__":\n');
  }
}
