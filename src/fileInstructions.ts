import type { Diagnostic, SourceRange } from './translate.ts';
import { parseStringLiteral } from './stringLiteral.ts';

/** The six modes of this lot, in their C17 spelling. `r+`, `w+` and `a+` are
 * deliberately absent: an update mode needs a positioning discipline that no
 * formulation here teaches. */
const MODES: Readonly<Record<string, string>> = {
  lecture: 'r', écriture: 'w', ajout: 'a',
};

export type FileInstruction =
  | { kind: 'FILE_DECL'; parameters: { name: string; nameRange: SourceRange } }
  | { kind: 'FILE_OPEN'; parameters: { name: string; nameRange: SourceRange; path: string; pathRange: SourceRange; mode: string; modeRange: SourceRange } }
  | { kind: 'FILE_CLOSE'; parameters: { name: string; nameRange: SourceRange } }
  | { kind: 'FILE_WRITE_TEXT'; parameters: { name: string; nameRange: SourceRange; text: string; textRange: SourceRange } }
  | { kind: 'FILE_WRITE_INT'; parameters: { name: string; nameRange: SourceRange; value: string; valueRange: SourceRange } }
  | { kind: 'FILE_READ_INT'; parameters: { name: string; nameRange: SourceRange; target: string; targetRange: SourceRange } }
  /** Lot 31. La borne est ÉCRITE dans la phrase, jamais déduite : C-A ne
   * connaît pas la dimension du tableau de destination et n'a aucun moyen de
   * la retrouver. `fgets` est préféré à `fscanf("%s")`, qui n'a pas de borne
   * du tout. */
  | { kind: 'FILE_READ_STRING'; parameters: { name: string; nameRange: SourceRange; target: string; targetRange: SourceRange;
      dimension: string; dimensionRange: SourceRange } }
  | { kind: 'FILE_AT_END'; parameters: { name: string; nameRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: FileInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the seven new fixed prefixes are intercepted; every historical branch
 * is left untouched. A path is read by the shared text scanner of lot 16, so
 * it obeys exactly the same grammar as every other text of the catalogue.
 */
export function analyzeFileInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase();
  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, range: SourceRange): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  }
  function expect(i: number, expected: string, code: Diagnostic['code'], message: string): boolean {
    const token = tokens[i];
    if (!token) { fail(code, message, { start: end, end }); return false; }
    if (!same(expected, token.text)) { fail('UNKNOWN_FORMULATION', UNKNOWN, token.range); return false; }
    return true;
  }
  function identifier(i: number, message: string): Token | undefined {
    const token = tokens[i];
    if (!token) return fail('INCOMPLETE_INSTRUCTION', message, { start: end, end });
    diagnostic = validateName(token);
    return diagnostic ? undefined : token;
  }
  function finish(i: number): boolean {
    const extra = tokens[i];
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return false;
  }
  /** A quoted text, located without tokenizing: a path may contain spaces. */
  function text(position: number): { value: string; range: SourceRange; end: number } | undefined {
    const scanned = parseStringLiteral(source, position, end);
    if (scanned.status === 'rejected') { diagnostic = scanned.diagnostic; return undefined; }
    return { value: scanned.literal.value, range: { ...scanned.literal.range }, end: scanned.end };
  }
  /** One raw word, where token indices no longer line up after a text. */
  function rawWord(position: number): Token | undefined {
    while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
    if (position === end) return undefined;
    const start = position;
    while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
    return { text: source.slice(start, position), range: { start, end: position } };
  }
  /** `dans le fichier {nom}` after a text or a value. */
  function destination(position: number): Token | undefined {
    for (const expected of ['dans', 'le', 'fichier']) {
      const read = rawWord(position);
      if (!read) return fail('INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${expected} » attendu.`, { start: end, end });
      if (!same(expected, read.text)) return fail('UNKNOWN_FORMULATION', UNKNOWN, read.range);
      position = read.range.end;
    }
    const name = rawWord(position);
    if (!name) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom du fichier.', { start: end, end });
    diagnostic = validateName(name);
    if (diagnostic) return undefined;
    const extra = rawWord(name.range.end);
    if (extra) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return name;
  }

  let instruction: FileInstruction | undefined;
  if (word(0) === 'déclare' && word(1) === 'un' && word(2) === 'fichier') {
    if (expect(3, 'nommé', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du fichier.')) {
      const name = identifier(4, 'Il manque le nom du fichier.');
      if (name && finish(5)) instruction = { kind: 'FILE_DECL', parameters: { name: name.text, nameRange: { ...name.range } } };
    }
  } else if (word(0) === 'ferme' && word(1) === 'le' && word(2) === 'fichier') {
    const name = identifier(3, 'Il manque le nom du fichier.');
    if (name && finish(4)) instruction = { kind: 'FILE_CLOSE', parameters: { name: name.text, nameRange: { ...name.range } } };
  } else if (word(0) === 'affecte' && word(1) === 'à' && same('l’ouverture', tokens[3]?.text ?? '')) {
    const name = identifier(2, 'Il manque le nom du fichier.');
    if (name && expect(4, 'du', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « du fichier » attendu.')
      && expect(5, 'fichier', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « fichier » attendu.')) {
      const path = text(tokens[5]!.range.end);
      if (path) {
        const en = rawWord(path.end);
        if (!en) fail('MISSING_FILE_MODE', 'Il manque le mode d’ouverture.', { start: end, end });
        else if (!same('en', en.text)) fail('UNKNOWN_FORMULATION', UNKNOWN, en.range);
        else {
          const mode = rawWord(en.range.end);
          if (!mode) fail('MISSING_FILE_MODE', 'Il manque le mode d’ouverture.', { start: end, end });
          else {
            const letter = MODES[mode.text.toLowerCase()];
            if (!letter) {
              fail('UNSUPPORTED_FILE_MODE',
                'Modes pris en charge : lecture, écriture, ajout, éventuellement suivis de « binaire ».', mode.range);
            } else {
              const binary = rawWord(mode.range.end);
              let modeEnd = mode.range.end;
              let spelling = letter;
              if (binary && same('binaire', binary.text)) { spelling = letter + 'b'; modeEnd = binary.range.end; }
              else if (binary) { fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: binary.range.start, end }); }
              if (!diagnostic) {
                const extra = rawWord(modeEnd);
                if (extra) fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
                else {
                  instruction = { kind: 'FILE_OPEN', parameters: { name: name.text, nameRange: { ...name.range },
                    path: path.value, pathRange: path.range, mode: spelling,
                    modeRange: { start: mode.range.start, end: modeEnd } } };
                }
              }
            }
          }
        }
      }
    }
  } else if (word(0) === 'écris' && word(1) === 'le' && word(2) === 'texte') {
    const written = text(tokens[2]!.range.end);
    if (written) {
      const name = destination(written.end);
      if (name) {
        instruction = { kind: 'FILE_WRITE_TEXT', parameters: { name: name.text, nameRange: { ...name.range },
          text: written.value, textRange: written.range } };
      }
    }
  } else if (word(0) === 'écris' && word(1) === 'la' && word(2) === 'valeur' && word(3) === 'de') {
    const value = identifier(4, 'Il manque le nom de la valeur à écrire.');
    if (value) {
      const name = destination(value.range.end);
      if (name) {
        instruction = { kind: 'FILE_WRITE_INT', parameters: { name: name.text, nameRange: { ...name.range },
          value: value.text, valueRange: { ...value.range } } };
      }
    }
  } else if (word(0) === 'lis' && word(1) === 'une' && word(2) === 'chaîne') {
    // Lot 31 : « de dimension {entier} », la même queue que les tableaux du
    // lot 15 et les champs du lot 27, pour ne pas inventer un troisième mot.
    if (expect(3, 'de', 'MISSING_ARRAY_DIMENSION', 'Il manque la dimension à lire.')
      && expect(4, 'dimension', 'MISSING_ARRAY_DIMENSION', 'Il manque la dimension à lire.')) {
      const size = tokens[5];
      if (!size) fail('MISSING_ARRAY_DIMENSION', 'Il manque la dimension à lire.', { start: end, end });
      else if (!/^[1-9][0-9]*$/u.test(size.text)) fail('INVALID_ARRAY_DIMENSION',
        'Une dimension entière strictement positive, écrite en chiffres, est attendue.', size.range);
      else if (expect(6, 'depuis', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « depuis » attendu.')
        && expect(7, 'le', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « le » attendu.')
        && expect(8, 'fichier', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « fichier » attendu.')) {
        const name = identifier(9, 'Il manque le nom du fichier.');
        if (name && expect(10, 'dans', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « dans » attendu.')) {
          const target = identifier(11, 'Il manque le nom du tableau à remplir.');
          if (target && finish(12)) {
            instruction = { kind: 'FILE_READ_STRING', parameters: { name: name.text, nameRange: { ...name.range },
              target: target.text, targetRange: { ...target.range },
              dimension: size.text, dimensionRange: { ...size.range } } };
          }
        }
      }
    }
  } else if (word(0) === 'lis' && word(1) === 'un' && word(2) === 'entier') {
    if (expect(3, 'depuis', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « depuis » attendu.')
      && expect(4, 'le', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « le » attendu.')
      && expect(5, 'fichier', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « fichier » attendu.')) {
      const name = identifier(6, 'Il manque le nom du fichier.');
      if (name && expect(7, 'dans', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « dans » attendu.')) {
        const target = identifier(8, 'Il manque le nom de la variable à remplir.');
        if (target && finish(9)) {
          instruction = { kind: 'FILE_READ_INT', parameters: { name: name.text, nameRange: { ...name.range },
            target: target.text, targetRange: { ...target.range } } };
        }
      }
    }
  } else if (word(0) === 'crée' && word(1) === 'un' && word(2) === 'bloc' && word(3) === 'si'
    && word(4) === 'la' && word(5) === 'fin') {
    if (expect(6, 'du', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « du fichier » attendu.')
      && expect(7, 'fichier', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « fichier » attendu.')) {
      const name = identifier(8, 'Il manque le nom du fichier.');
      if (name && expect(9, 'est', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « est atteinte » attendu.')
        && expect(10, 'atteinte', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « atteinte » attendu.')
        && finish(11)) {
        instruction = { kind: 'FILE_AT_END', parameters: { name: name.text, nameRange: { ...name.range } } };
      }
    }
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction de fichier analysée absente.');
  return { status: 'recognized', instruction };
}
