/** Le Python que C-A écrit, et le seul endroit où il s'écrit.
 *
 * Lot P3. Ce module reçoit une intention **déjà analysée** par `translate` et
 * en écrit le Python, ou refuse en nommant la construction. Il ne lit pas de
 * français, ne décide pas du placement — `src/langages/python/placement.ts`
 * s'en charge, par indentation — et n'ajoute aucune ligne qui n'a pas été
 * demandée.
 *
 * Ce qu'il n'est pas : une traduction du C. Les intentions portées ici le sont
 * parce que la notion existe en Python, pas parce que C-A savait déjà
 * l'écrire. Les autres sont refusées, chacune avec la construction native qui
 * enseigne la même compétence (`src/langages/python/raisons.ts`).
 *
 * Décisions du fondateur appliquées ici, et elles sont validées :
 *   - **D8** le caractère est une chaîne de longueur 1, dit comme tel ;
 *   - **D9** une annotation de type est écrite quand la phrase l'a donnée ;
 *   - **D10** `end=""` partout, sans exception : `print` ajoute sinon un saut
 *     de ligne que personne n'a demandé ;
 *   - les différences de sens entre C et Python sont **refusées**, pas lissées.
 */
import type { DisplayFormat, Instruction } from '../../translate.ts';
import { renderStringLiteral } from '../../stringLiteral.ts';
import { rendreExpressionPython, nomPythonValide } from './expression.ts';
import type { RenduExpression } from './expression.ts';

export type RenduPython =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

/** Les intentions que Python porte au lot P3. Trois familles :
 *  - les **15 intentions communes** du lot P3 (17 moins les deux accès à un
 *    champ, qui attendent la décision D6) ;
 *  - l'**affichage**, ouvert par la décision D10 ;
 *  - les **blocs**, dont la forme Python ne demande aucune décision.
 */
export const PORTEES_PYTHON: ReadonlySet<string> = new Set([
  // Communes — valeurs, noms, calcul
  'INIT_INT', 'ASSIGN_INT', 'ASSIGN_EXPRESSION', 'NUMERIC_INIT', 'NUMERIC_ASSIGN',
  // Communes — transfert et retour
  'BREAK', 'CONTINUE', 'RETURN', 'RETURN_INT', 'RETURN_EXPRESSION', 'RETURN_NUMERIC',
  // Communes — appel
  'CALL', 'CALL_ASSIGN',
  // Communes — élément de séquence
  'ARRAY_ASSIGN_INT', 'ARRAY_ASSIGN_EXPRESSION',
  // Affichage (D10)
  'PRINT_INT', 'PRINT_TEXT', 'PRINT_NEWLINE', 'PRINT_FORMATTED', 'NUMERIC_PRINT',
  'PRINT_CHAR', 'PRINT_STRING', 'ARRAY_PRINT', 'ARRAY_PRINT_CHAR',
  // Caractère (D8)
  'INIT_CHAR', 'ASSIGN_CHAR', 'ARRAY_ASSIGN_CHAR',
  // Ecriture de texte dans un fichier (lot P6). La phrase du catalogue
  // partage dit exactement ce que Python fait, et son rendu differe : c'est
  // la definition d'une intention ADAPTABLE, et la dupliquer dans le
  // catalogue natif aurait cree une intention morte — le catalogue partage
  // gagne toujours.
  'FILE_WRITE_TEXT',
  // Blocs
  'IF', 'ELSE_IF', 'ELSE', 'WHILE', 'FUNC_DEF',
]);

/** Les genres dont le rendu ouvre un bloc : leur en-tête finit par « : », et
 * leur corps reste à écrire. C-A n'écrit **pas** de `pass` : ce serait une
 * instruction que personne n'a demandée. */
export const EN_TETES_PYTHON: ReadonlySet<string> = new Set(['IF', 'ELSE_IF', 'ELSE', 'WHILE', 'FUNC_DEF']);

const TYPES: Partial<Record<string, string>> = { int: 'int', float: 'float', double: 'float', char: 'str', void: 'None' };

const NON_SIGNE = 'Python n’a pas d’entier non signé : ses entiers sont signés et de précision arbitraire. '
  + 'Écrire « int » perdrait exactement l’information que l’étudiant a donnée, et l’écrire quand même '
  + 'enseignerait un type qui n’existe pas.';

function typePython(type: string): { python: string } | { refus: string } {
  if (type === 'unsigned int') return { refus: NON_SIGNE };
  const python = TYPES[type];
  return python === undefined ? { refus: 'Type non porté en Python : ' + type + '.' } : { python };
}

/** Rend une intention en Python. Aucun chemin ne produit un code vide : c'est
 * un rendu ou un refus motivé. */
export function rendrePython(instruction: Instruction): RenduPython {
  const rendu = (code: string): RenduPython => ({ status: 'rendu', code });
  const refus = (raison: string): RenduPython => ({ status: 'refus', raison });
  /** Rend une expression, en propageant son refus tel quel. */
  const expr = (resultat: RenduExpression, suite: (code: string) => RenduPython): RenduPython =>
    (resultat.status === 'refus' ? refus(resultat.raison) : suite(resultat.code));
  /** Un nom donné par la phrase doit être un identifiant Python. */
  const nom = (valeur: string, suite: () => RenduPython): RenduPython => {
    const probleme = nomPythonValide(valeur);
    return probleme === undefined ? suite() : refus(probleme);
  };
  /** Tout affichage passe par là : `end=""` sans exception (D10). */
  const affiche = (contenu: string): RenduPython => rendu(`print(${contenu}, end="")\n`);

  switch (instruction.kind) {
    // ---- valeurs, noms, calcul -------------------------------------------
    case 'INIT_INT': {
      const { name, value } = instruction.parameters;
      return nom(name, () => rendu(`${name} = ${value}\n`));
    }
    case 'ASSIGN_INT': {
      const { name, value } = instruction.parameters;
      return nom(name, () => rendu(`${name} = ${value}\n`));
    }
    case 'ASSIGN_EXPRESSION': {
      const { name, expression } = instruction.parameters;
      return nom(name, () => expr(rendreExpressionPython(expression), code => rendu(`${name} = ${code}\n`)));
    }
    // D9 : l'annotation vient de la phrase, Python sait l'écrire, rien n'est
    // inventé. Conserver ce que l'étudiant a dit coûte zéro.
    case 'NUMERIC_INIT': {
      const { type, name, expression } = instruction.parameters;
      const cible = typePython(type);
      if ('refus' in cible) return refus(cible.refus);
      return nom(name, () => expr(rendreExpressionPython(expression),
        code => rendu(`${name}: ${cible.python} = ${code}\n`)));
    }
    case 'NUMERIC_ASSIGN': {
      const { name, expression } = instruction.parameters;
      return nom(name, () => expr(rendreExpressionPython(expression), code => rendu(`${name} = ${code}\n`)));
    }
    // ---- caractère (D8) ---------------------------------------------------
    // L'orthographe de l'étudiant est conservée : `'A'` est du Python valide,
    // et c'est une chaîne de longueur 1. L'information passive le dit.
    case 'INIT_CHAR': {
      const { name, literal } = instruction.parameters;
      return nom(name, () => rendu(`${name}: str = ${literal}\n`));
    }
    case 'ASSIGN_CHAR': {
      const { name, literal } = instruction.parameters;
      return nom(name, () => rendu(`${name} = ${literal}\n`));
    }
    // ---- élément de séquence ---------------------------------------------
    case 'ARRAY_ASSIGN_INT':
      return expr(rendreExpressionPython(instruction.parameters.element),
        cible => rendu(`${cible} = ${instruction.parameters.value}\n`));
    case 'ARRAY_ASSIGN_CHAR':
      return expr(rendreExpressionPython(instruction.parameters.element),
        cible => rendu(`${cible} = ${instruction.parameters.literal}\n`));
    case 'ARRAY_ASSIGN_EXPRESSION':
      return expr(rendreExpressionPython(instruction.parameters.element),
        cible => expr(rendreExpressionPython(instruction.parameters.expression),
          valeur => rendu(`${cible} = ${valeur}\n`)));
    // ---- transfert et retour ---------------------------------------------
    case 'BREAK': return rendu('break\n');
    case 'CONTINUE': return rendu('continue\n');
    case 'RETURN': return rendu('return\n');
    case 'RETURN_INT': return rendu(`return ${instruction.parameters.value}\n`);
    case 'RETURN_EXPRESSION':
      return expr(rendreExpressionPython(instruction.parameters.expression), code => rendu(`return ${code}\n`));
    case 'RETURN_NUMERIC':
      return expr(rendreExpressionPython(instruction.parameters.expression), code => rendu(`return ${code}\n`));
    // ---- appel ------------------------------------------------------------
    case 'CALL': {
      const { name, args } = instruction.parameters;
      return nom(name, () => rendreArguments(args, liste => rendu(`${name}(${liste})\n`)));
    }
    case 'CALL_ASSIGN': {
      const { target, name, args } = instruction.parameters;
      return nom(target, () => nom(name, () =>
        rendreArguments(args, liste => rendu(`${target} = ${name}(${liste})\n`))));
    }
    // ---- affichage (D10) --------------------------------------------------
    case 'PRINT_INT': return nom(instruction.parameters.name, () => affiche(instruction.parameters.name));
    case 'PRINT_CHAR': return nom(instruction.parameters.name, () => affiche(instruction.parameters.name));
    case 'PRINT_STRING': return nom(instruction.parameters.name, () => affiche(instruction.parameters.name));
    case 'PRINT_TEXT': return affiche(renderStringLiteral(instruction.parameters.text));
    // `write` n'ajoute AUCUN saut de ligne, et il n'accepte qu'une chaine :
    // les deux sont dits par l'information passive.
    case 'FILE_WRITE_TEXT':
      return nom(instruction.parameters.name,
        () => rendu(`${instruction.parameters.name}.write(${renderStringLiteral(instruction.parameters.text)})\n`));
    // Le saut de ligne est écrit explicitement, et `end=""` reste posé : la
    // règle « aucun séparateur ajouté » n'a aucune exception.
    case 'PRINT_NEWLINE': return affiche('"\\n"');
    case 'ARRAY_PRINT': case 'ARRAY_PRINT_CHAR':
      return expr(rendreExpressionPython(instruction.parameters.element), code => affiche(code));
    // La base d'affichage s'écrit par une spécification de format, pas par une
    // conversion : `hex(x)` ajouterait le préfixe « 0x », que personne n'a
    // demandé.
    case 'PRINT_FORMATTED': {
      const specifications: Record<DisplayFormat, string> = { decimal: '', hexadecimal: ':x', octal: ':o' };
      const { name, format } = instruction.parameters;
      return nom(name, () => (format === 'decimal'
        ? affiche(name)
        : affiche(`f"{${name}${specifications[format]}}"`)));
    }
    case 'NUMERIC_PRINT': {
      const parametres = instruction.parameters;
      if (parametres.format === 'unsigned') return refus(NON_SIGNE);
      const suffixe = parametres.format === 'fixed' ? 'f' : 'e';
      return nom(parametres.name,
        () => affiche(`f"{${parametres.name}:.${parametres.precision}${suffixe}}"`));
    }
    // ---- blocs ------------------------------------------------------------
    // Aucun corps n'est écrit, et surtout aucun `pass` : le corps est à
    // l'étudiant. Le fichier est donc incomplet jusqu'à ce qu'il l'écrive,
    // et une information passive le dit — c'est une différence réelle avec
    // C17, où le bloc est fermé et le fichier reste compilable.
    case 'IF':
      return expr(rendreExpressionPython(instruction.parameters.condition), code => rendu(`if ${code}:\n`));
    case 'ELSE_IF':
      return expr(rendreExpressionPython(instruction.parameters.condition), code => rendu(`elif ${code}:\n`));
    case 'ELSE': return rendu('else:\n');
    case 'WHILE':
      return expr(rendreExpressionPython(instruction.parameters.condition), code => rendu(`while ${code}:\n`));
    case 'FUNC_DEF': {
      const { returnType, name, params, internal } = instruction.parameters;
      if (internal) {
        return refus('Python n’a pas de liaison interne : un module n’exporte pas, il est importé. '
          + 'Le préfixe « _ » est une convention de lecture, pas une règle du langage, et l’ajouter '
          + 'serait inventer une information que l’étudiant n’a pas donnée.');
      }
      const retour = typePython(returnType);
      if ('refus' in retour) return refus(retour.refus);
      const annotations: string[] = [];
      for (const parametre of params) {
        const probleme = nomPythonValide(parametre.name);
        if (probleme !== undefined) return refus(probleme);
        const type = typePython(parametre.type);
        if ('refus' in type) return refus(type.refus);
        annotations.push(`${parametre.name}: ${type.python}`);
      }
      return nom(name, () => rendu(`def ${name}(${annotations.join(', ')}) -> ${retour.python}:\n`));
    }
    default:
      return refus('Intention non portée par le lot P3 : ' + instruction.kind + '.');
  }
}

function rendreArguments(args: readonly Parameters<typeof rendreExpressionPython>[0][],
  suite: (liste: string) => RenduPython): RenduPython {
  const codes: string[] = [];
  for (const argument of args) {
    const resultat = rendreExpressionPython(argument);
    if (resultat.status === 'refus') return { status: 'refus', raison: resultat.raison };
    codes.push(resultat.code);
  }
  return suite(codes.join(', '));
}
