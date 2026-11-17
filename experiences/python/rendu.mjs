// EXPÉRIENCE — rendu Python depuis l'AST d'intention de C-A.
//
// But : mesurer ce qui se réutilise réellement, pas l'imaginer. Rien ici
// n'est destiné à être livré : c'est une sonde jetable, isolée dans
// `experiences/`, qui ne touche ni `src/` ni les tests.
//
// Ce que la sonde doit établir :
//   1. l'analyse française et l'AST se réutilisent-ils sans modification ?
//   2. quelles intentions se rendent en Python sans rien inventer ?
//   3. lesquelles exigent d'inventer une information — donc un REFUS ;
//   4. où les règles du projet (aucun ajout implicite, aucun séparateur)
//      obligent un rendu différent de l'évidence.
//
// Chaque refus porte sa raison : c'est la donnée la plus utile de la sonde.

/** Opérateurs logiques : même sens, autre écriture. */
const LOGIQUE = { '&&': 'and', '||': 'or' };

/** Un type C devient une annotation Python quand l'équivalent existe. Aucune
 * invention : l'information vient de la phrase, et Python sait l'écrire. */
const ANNOTATIONS = { int: 'int', 'unsigned int': 'int', float: 'float', double: 'float', char: 'str', void: 'None' };

export class Refus extends Error {
  constructor(code, raison) { super(raison); this.code = code; this.raison = raison; }
}
const refuser = (code, raison) => { throw new Refus(code, raison); };

export function expr(n) {
  switch (n.kind) {
    // Le profil entier nomme son litteral « integer », le profil numerique
    // « literal » : les trois profils publient des AST de formes voisines
    // mais NON unifiees. La sonde l'a decouvert en echouant ici.
    case 'integer': case 'literal': return n.value;
    case 'name': return n.name;
    case 'character': return n.value;
    case 'negation': return '-' + expr(n.operand);
    case 'index': return n.array.name + '[' + expr(n.index) + ']';
    case 'member':
      // Python n'a pas de flèche : « q->x » et « p.x » s'écriraient pareil.
      // Écrire la même chose pour deux phrases différentes violerait
      // « C-A écrit la forme demandée et n'en substitue jamais une à l'autre ».
      if (n.arrow) {
        refuser('ARROW_HAS_NO_PYTHON_FORM', 'La flèche désigne un pointeur vers une structure : '
          + 'Python n’a ni pointeur ni flèche, et écrire « p.x » pour « p->x » substituerait une forme à l’autre.');
      }
      return expr(n.object) + '.' + n.member;
    case 'cast': {
      const cible = ANNOTATIONS[n.type];
      if (cible === undefined || cible === 'str') {
        refuser('CAST_HAS_NO_PYTHON_FORM', 'La conversion vers « ' + n.type + ' » n’a pas d’équivalent direct.');
      }
      return cible + '(' + expr(n.operand) + ')';
    }
    case 'binary':
      // « / » est le seul faux ami : en C entre entiers il tronque, en Python
      // il produit un flottant. Le rendre « / » changerait le sens en
      // silence ; « // » l'inventerait pour des flottants.
      if (n.operator === '/') {
        refuser('DIVISION_CHANGES_MEANING', 'La division entière de C tronque, celle de Python produit '
          + 'un flottant : le même texte ne dit pas la même chose. Décision de contrat, pas rendu.');
      }
      return '(' + expr(n.left) + ' ' + n.operator + ' ' + expr(n.right) + ')';
    case 'address': case 'dereference': case 'pointer-sum':
      refuser('POINTERS_HAVE_NO_PYTHON_FORM', 'Python n’expose ni adresse ni déréférencement.');
      break;
    default:
      refuser('UNKNOWN_EXPRESSION_NODE', 'Nœud d’expression inconnu de la sonde : ' + n.kind);
  }
}

export function cond(c) {
  switch (c.kind) {
    case 'numeric-test': return expr(c.expression);
    case 'comparison': return expr(c.left) + ' ' + c.operator + ' ' + expr(c.right);
    case 'logical-not': return 'not ' + cond(c.operand);
    case 'logical-binary': return '(' + cond(c.left) + ' ' + LOGIQUE[c.operator] + ' ' + cond(c.right) + ')';
    default: refuser('UNKNOWN_CONDITION_NODE', 'Nœud de condition inconnu : ' + c.kind);
  }
}

/** Les intentions dont le CONCEPT n'existe pas en Python, ou n'y existe pas
 * sous cette forme : refus nommé, avec sa raison. Les forcer produirait du
 * Python qui mime du C. */
export const SANS_EQUIVALENT = {
  INCLUDE_STDIO: 'Python n’a pas d’en-tête à inclure : « print » est intégré.',
  INCLUDE_STDLIB: 'Python n’a pas d’en-tête à inclure.',
  INCLUDE_ASSERT: '« assert » est un mot-clé de Python, sans en-tête.',
  INCLUDE_LIMITS: 'Les entiers de Python n’ont pas de borne de représentation.',
  INCLUDE_LOCAL: 'Un module Python s’importe par son nom, pas par un chemin de fichier.',
  GUARD_OPEN: 'Python n’a pas de préprocesseur ; un module n’est exécuté qu’une fois.',
  GUARD_CLOSE: 'Python n’a pas de préprocesseur.',
  FUNC_PROTOTYPE: 'Python ne déclare pas avant de définir.',
  LINKAGE_DECL: 'Python n’a pas de liaison externe ; un module expose ses noms.',
  DECL_INT: 'Python ne déclare pas sans valeur : écrire « n = 0 » inventerait ce 0.',
  NUMERIC_DECL: 'Python ne déclare pas sans valeur.',
  DECL_CHAR: 'Python ne déclare pas sans valeur.',
  DECL_POINTER: 'Python n’a pas de pointeur.',
  INIT_POINTER: 'Python n’a pas de pointeur.',
  ASSIGN_ADDRESS: 'Python n’expose pas d’adresse.',
  PRINT_POINTED: 'Python n’a pas de déréférencement.',
  ASSIGN_POINTED_INT: 'Python n’a pas de déréférencement.',
  ASSIGN_POINTED_EXPRESSION: 'Python n’a pas de déréférencement.',
  STRUCT_POINTER: 'Python n’a pas de pointeur vers une structure.',
  SIZEOF_PRINT: 'La taille d’un objet Python ne se demande pas à son type.',
  SIZEOF_ASSIGN: 'La taille d’un objet Python ne se demande pas à son type.',
  ALLOCATE: 'Python alloue à la création : il n’y a rien à demander.',
  REALLOCATE: 'Une liste Python se redimensionne d’elle-même.',
  FREE: 'Python libère par ramasse-miettes : libérer explicitement n’existe pas.',
  TYPE_ALIAS: 'Un synonyme de structure n’a pas d’objet ici.',
  CONST_DECL: 'Python n’a pas de constante : une convention de nom n’en est pas une.',
  NUMERIC_CONVERT: 'La conversion sans perte n’a pas de forme Python unique.',
  ARRAY_DECL: 'Une liste Python n’existe qu’avec son contenu : une dimension seule obligerait '
    + 'à inventer une valeur de remplissage.',
  STRUCT_DECL: 'Une classe Python ne déclare pas de champs sans valeur : le concept existe, '
    + 'pas sous cette forme — décision de contrat.',
  STRUCT_FIELD: 'Voir STRUCT_DECL : décision de contrat, pas rendu.',
  STRUCT_VAR: 'Voir STRUCT_DECL : une instance exige un constructeur.',
  MEMBER_ASSIGN_INT: 'Voir STRUCT_DECL.',
  MEMBER_ASSIGN_CHAR: 'Voir STRUCT_DECL.',
  MEMBER_ASSIGN_EXPRESSION: 'Voir STRUCT_DECL.',
  MEMBER_PRINT: 'Voir STRUCT_DECL.',
  DO_WHILE: 'Python n’a pas de boucle à test final.',
  BREAK_SWITCH: 'Python n’a pas d’aiguillage à sortie explicite.',
  SWITCH: 'Le « match » de Python ne traverse pas les cas : même mot, autre sémantique — '
    + 'décision de contrat.',
  CASE_INT: 'Voir SWITCH.', CASE_CHAR: 'Voir SWITCH.', CASE_DEFAULT: 'Voir SWITCH.',
  FOR: 'Le « for » de C a trois clauses ; celui de Python parcourt un itérable. Les faire '
    + 'correspondre demanderait de restructurer la phrase — décision de contrat.',
  MAIN: 'En Python, « main » est une convention et non une exigence : la créer sans l’appeler '
    + 'laisse un programme qui ne fait rien, et l’appeler serait un ajout implicite.',
  FILE_DECL: 'Un fichier Python n’est pas déclaré avant d’être ouvert.',
  FILE_READ_INT: 'Lire un entier depuis un flux Python demande une conversion explicite — '
    + 'décision de contrat.',
  FILE_AT_END: 'Python n’a pas d’indicateur de fin de fichier : la fin se constate à la lecture.',
};

/** « print » de Python ajoute un saut de ligne. La règle « aucun séparateur
 * n'est ajouté » impose donc end="" partout : c'est le rendu FIDÈLE, pas le
 * rendu évident. C'est la découverte la plus instructive de la sonde. */
const FIN = ', end=""';

/**
 * @returns {{lignes: string[], ouvre: boolean}} les lignes Python produites,
 * et si l'instruction ouvre un bloc — donc si la suite s'indente.
 */
export function rendre(instruction) {
  const p = instruction.parameters ?? {};
  const seul = (ligne) => ({ lignes: [ligne], ouvre: false });
  const bloc = (ligne) => ({ lignes: [ligne], ouvre: true });
  const car = (litteral) => litteral.replace(/^'(.*)'$/u, '"$1"');

  if (instruction.kind in SANS_EQUIVALENT) refuser('NO_PYTHON_CONCEPT', SANS_EQUIVALENT[instruction.kind]);

  switch (instruction.kind) {
    case 'INIT_INT': case 'ASSIGN_INT': return seul(p.name + ' = ' + p.value);
    case 'ASSIGN_EXPRESSION': return seul(p.name + ' = ' + expr(p.expression));
    case 'NUMERIC_INIT': return seul(p.name + ': ' + ANNOTATIONS[p.type] + ' = ' + expr(p.expression));
    case 'NUMERIC_ASSIGN': return seul(p.name + ' = ' + expr(p.expression));
    case 'INIT_CHAR': case 'ASSIGN_CHAR': return seul(p.name + ' = ' + car(p.literal));

    case 'PRINT_INT': case 'PRINT_CHAR': case 'PRINT_STRING': return seul('print(' + p.name + FIN + ')');
    case 'PRINT_FORMATTED': {
      const suffixe = { decimal: '', hexadecimal: ':x', octal: ':o' }[p.format];
      if (suffixe === undefined) refuser('FORMAT_HAS_NO_PYTHON_FORM', 'Format inconnu : ' + p.format);
      return seul('print(f"{' + p.name + suffixe + '}"' + FIN + ')');
    }
    case 'NUMERIC_PRINT': {
      if (p.format === 'unsigned') refuser('UNSIGNED_HAS_NO_PYTHON_FORM', 'Python n’a pas d’entier non signé.');
      return seul('print(f"{' + p.name + ':.' + p.precision + (p.format === 'fixed' ? 'f' : 'e') + '}"' + FIN + ')');
    }
    case 'PRINT_TEXT': return seul('print(' + JSON.stringify(p.text ?? '') + FIN + ')');
    case 'PRINT_NEWLINE': return seul('print()');
    case 'ARRAY_PRINT': case 'ARRAY_PRINT_CHAR': return seul('print(' + expr(p.element) + FIN + ')');

    case 'STRING_INIT': return seul(p.name + ' = ' + JSON.stringify(p.text));
    case 'ARRAY_ASSIGN_INT': return seul(expr(p.element) + ' = ' + p.value);
    case 'ARRAY_ASSIGN_CHAR': return seul(expr(p.element) + ' = ' + car(p.literal));
    case 'ARRAY_ASSIGN_EXPRESSION': return seul(expr(p.element) + ' = ' + expr(p.expression));

    case 'IF': return bloc('if ' + cond(p.condition) + ':');
    case 'ELSE_IF': return bloc('elif ' + cond(p.condition) + ':');
    case 'ELSE': return bloc('else:');
    case 'WHILE': return bloc('while ' + cond(p.condition) + ':');
    case 'BREAK': return seul('break');
    case 'CONTINUE': return seul('continue');

    case 'FUNC_DEF': {
      if (p.internal) refuser('INTERNAL_LINKAGE_HAS_NO_PYTHON_FORM', 'Python n’a pas de liaison interne.');
      const params = p.params.map(x => x.name + ': ' + ANNOTATIONS[x.type]).join(', ');
      return bloc('def ' + p.name + '(' + params + ') -> ' + ANNOTATIONS[p.returnType] + ':');
    }
    case 'RETURN': return seul('return');
    case 'RETURN_INT': return seul('return ' + p.value);
    case 'RETURN_EXPRESSION': case 'RETURN_NUMERIC': return seul('return ' + expr(p.expression));
    case 'CALL': return seul(p.name + '(' + p.args.map(expr).join(', ') + ')');
    case 'CALL_ASSIGN': return seul(p.target + ' = ' + p.name + '(' + p.args.map(expr).join(', ') + ')');

    case 'ASSERT': return seul('assert ' + cond(p.condition));

    case 'FILE_OPEN': return seul(p.name + ' = open(' + JSON.stringify(p.path) + ', ' + JSON.stringify(p.mode) + ')');
    case 'FILE_CLOSE': return seul(p.name + '.close()');
    case 'FILE_WRITE_TEXT': return seul(p.file + '.write(' + JSON.stringify(p.text) + ')');
    case 'FILE_WRITE_INT': return seul(p.file + '.write(str(' + p.name + '))');
    case 'FILE_READ_STRING': return seul(p.target + ' = ' + p.file + '.readline(' + p.dimension + ')');

    default: refuser('NOT_IN_PROBE', 'Intention hors de la sonde : ' + instruction.kind);
  }
}
