import type { DisplayFormat, Instruction } from '../../translate.ts';
import { renderExpression } from '../../expression.ts';
import { renderNumericExpression } from '../../numericExpression.ts';
import { renderCondition } from '../../condition.ts';
import { renderStringLiteral } from '../../stringLiteral.ts';
import { renderMemberTarget } from '../../structInstructions.ts';
import { renderMeasuredType } from '../../memoryInstructions.ts';

/** Le C17 que C-A ecrit, et le seul endroit ou il s'ecrit.
 *
 * Lot P0 : ces 84 cas vivaient au milieu de `translate.ts`. Les deplacer ne
 * change pas une sortie — le differentiel l'exige — et rend un second rendu
 * possible sans toucher a l'analyse de la phrase.
 *
 * Ce module ne sait rien du francais : il recoit une intention deja analysee.
 * Il ne decide ni du placement, ni du curseur, ni des informations
 * pedagogiques : seulement du texte produit.
 */
export function renderC17(instruction: Instruction): string {
  let code: string;
  switch (instruction.kind) {
    case 'MAIN': code = 'int main(void) {\n    \n}\n'; break;
    case 'IF': code = `if (${renderCondition(instruction.parameters.condition)}) {\n    \n}\n`; break;
    case 'ELSE_IF': code = `else if (${renderCondition(instruction.parameters.condition)}) {\n    \n}\n`; break;
    case 'ELSE': code = 'else {\n    \n}\n'; break;
    // No semicolon after the header or the closing brace, and no counter,
    // initialisation or progression is ever generated with the loop.
    case 'WHILE': code = `while (${renderCondition(instruction.parameters.condition)}) {\n    \n}\n`; break;
    // The semicolon after the final condition is C syntax, not an added
    // statement: do/while is generated whole or not at all.
    case 'DO_WHILE': code = `do {\n    \n} while (${renderCondition(instruction.parameters.condition)});\n`; break;
    // The two header assignments render exactly the fields that were asked
    // for: no ++, no default initial value and no clause left empty.
    case 'FOR': {
      const { name, initial, condition, update } = instruction.parameters;
      code = `for (${name} = ${renderNumericExpression(initial)}; ${renderCondition(condition)}; `
        + `${name} = ${renderNumericExpression(update)}) {\n    \n}\n`;
      break;
    }
    case 'DECL_INT': code = `int ${instruction.parameters.name};\n`; break;
    case 'INIT_INT': code = `int ${instruction.parameters.name} = ${instruction.parameters.value};\n`; break;
    case 'ASSIGN_INT': code = `${instruction.parameters.name} = ${instruction.parameters.value};\n`; break;
    case 'ASSIGN_EXPRESSION': code = `${instruction.parameters.name} = ${renderExpression(instruction.parameters.expression)};\n`; break;
    case 'NUMERIC_DECL': code = `${instruction.parameters.type} ${instruction.parameters.name};\n`; break;
    case 'NUMERIC_INIT': code = `${instruction.parameters.type} ${instruction.parameters.name} = ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'NUMERIC_ASSIGN': code = `${instruction.parameters.name} = ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'NUMERIC_PRINT': {
      const parameters = instruction.parameters;
      const format = parameters.format === 'unsigned' ? '%u' : `%.${parameters.precision}${parameters.format === 'fixed' ? 'f' : 'e'}`;
      code = `printf("${format}", ${parameters.name});\n`;
      break;
    }
    // Neither has the meaning of return: the transfer stays inside the loop.
    case 'BREAK': code = 'break;\n'; break;
    case 'CONTINUE': code = 'continue;\n'; break;
    // A function body is created empty: no return is ever added implicitly,
    // and no parameter list is invented beyond the explicit « (void) ».
    case 'FUNC_DEF': {
      // « (void) » is written when there is no parameter: an empty list would
      // mean something else in C, and is never produced here.
      const { returnType, name, params, internal } = instruction.parameters;
      const list = params.length ? params.map(parameter => `${parameter.type} ${parameter.name}`).join(', ') : 'void';
      // Lot 31: `static` belongs to the declaration specifiers, before the
      // return type, exactly as the lot 23 prototype writes it.
      code = `${internal ? 'static ' : ''}${returnType} ${name}(${list}) {\n    \n}\n`;
      break;
    }
    // Same signature, no body, and a semicolon: a declaration, not a
    // definition. `static` makes it internal to the translation unit.
    case 'FUNC_PROTOTYPE': {
      const { returnType, name, params, internal } = instruction.parameters;
      const list = params.length ? params.map(parameter => `${parameter.type} ${parameter.name}`).join(', ') : 'void';
      code = `${internal ? 'static ' : ''}${returnType} ${name}(${list});\n`;
      break;
    }
    case 'CALL': code = `${instruction.parameters.name}(${instruction.parameters.args.map(renderNumericExpression).join(', ')});\n`; break;
    case 'CALL_ASSIGN': code = `${instruction.parameters.target} = ${instruction.parameters.name}`
      + `(${instruction.parameters.args.map(renderNumericExpression).join(', ')});\n`; break;
    case 'RETURN': code = 'return;\n'; break;
    case 'RETURN_INT': code = `return ${instruction.parameters.value};\n`; break;
    case 'RETURN_EXPRESSION': code = `return ${renderExpression(instruction.parameters.expression)};\n`; break;
    case 'RETURN_NUMERIC': code = `return ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    // The character constant is written back exactly as it was typed: no
    // numeric code is ever computed and no conversion is ever added.
    case 'DECL_CHAR': code = `char ${instruction.parameters.name};\n`; break;
    case 'INIT_CHAR': code = `char ${instruction.parameters.name} = ${instruction.parameters.literal};\n`; break;
    case 'ASSIGN_CHAR': code = `${instruction.parameters.name} = ${instruction.parameters.literal};\n`; break;
    case 'PRINT_CHAR': code = `printf("%c", ${instruction.parameters.name});\n`; break;
    // A dimension is written exactly as it was given, and no initialiser is
    // ever added: an array declared here holds no value yet.
    case 'ARRAY_DECL': {
      const element = instruction.parameters.type;
      const spelling = typeof element === 'string' ? element : `struct ${element.tag}`;
      code = `${spelling} ${instruction.parameters.name}[${instruction.parameters.dimension}];\n`;
      break;
    }
    case 'ARRAY_ASSIGN_INT': code = `${renderNumericExpression(instruction.parameters.element)} = ${instruction.parameters.value};\n`; break;
    case 'ARRAY_ASSIGN_CHAR': code = `${renderNumericExpression(instruction.parameters.element)} = ${instruction.parameters.literal};\n`; break;
    case 'ARRAY_ASSIGN_EXPRESSION': code = `${renderNumericExpression(instruction.parameters.element)} `
      + `= ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'ARRAY_PRINT': code = `printf("%d", ${renderNumericExpression(instruction.parameters.element)});\n`; break;
    case 'ARRAY_PRINT_CHAR': code = `printf("%c", ${renderNumericExpression(instruction.parameters.element)});\n`; break;
    // The dimension is the one that was given, never one deduced from the
    // text; the compiler writes the final null character inside it.
    case 'STRING_INIT': code = `char ${instruction.parameters.name}[${instruction.parameters.dimension}] `
      + `= ${renderStringLiteral(instruction.parameters.text)};\n`; break;
    case 'PRINT_STRING': code = `printf("%s", ${instruction.parameters.name});\n`; break;
    // The star is written against the name, not against the type: it belongs
    // to the declarator, and the produced C is what the student reads.
    case 'DECL_POINTER': code = `${instruction.parameters.type} *${instruction.parameters.name};\n`; break;
    case 'INIT_POINTER': code = `${instruction.parameters.type} *${instruction.parameters.name} = &${instruction.parameters.target};\n`; break;
    case 'ASSIGN_ADDRESS': code = `${instruction.parameters.name} = &${instruction.parameters.target};\n`; break;
    case 'PRINT_POINTED': code = `printf("%d", *${instruction.parameters.name});\n`; break;
    case 'ASSIGN_POINTED_INT': code = `*${instruction.parameters.name} = ${instruction.parameters.value};\n`; break;
    case 'ASSIGN_POINTED_EXPRESSION': code = `*${instruction.parameters.name} `
      + `= ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    // A switch body is created empty, like every other block. Its labels are
    // written one per instruction, and no label is ever added implicitly.
    case 'SWITCH': code = `switch (${renderExpression(instruction.parameters.expression)}) {\n    \n}\n`; break;
    case 'CASE_INT': code = `case ${instruction.parameters.value}:\n`; break;
    case 'CASE_CHAR': code = `case ${instruction.parameters.literal}:\n`; break;
    case 'CASE_DEFAULT': code = 'default:\n'; break;
    // A structure definition is a block whose closing brace carries a
    // semicolon: C17 requires it, and it belongs to the construct.
    case 'STRUCT_DECL': code = `struct ${instruction.parameters.tag} {\n    \n};\n`; break;
    // The star of a pointer field stays against the name, as decision D2 of
    // lot 17 settled for every declarator in the catalogue.
    case 'STRUCT_FIELD': {
      const field = instruction.parameters;
      const spelling = field.type.kind === 'scalar' ? field.type.type : `struct ${field.type.tag}`;
      // Lot 27: the dimension belongs to the declarator, after the name.
      const bound = field.dimension === undefined ? '' : `[${field.dimension}]`;
      code = `${spelling} ${field.pointer ? '*' : ''}${field.name}${bound};\n`;
      break;
    }
    case 'STRUCT_VAR': code = `struct ${instruction.parameters.tag} ${instruction.parameters.name};\n`; break;
    // An alias, not a new type; the tag may be named before the structure is
    // defined, which is what a self-referential structure needs.
    case 'TYPE_ALIAS': code = `typedef struct ${instruction.parameters.tag} ${instruction.parameters.alias};\n`; break;
    case 'STRUCT_POINTER': code = `struct ${instruction.parameters.tag} *${instruction.parameters.name};\n`; break;
    case 'MEMBER_ASSIGN_INT': code = `${renderMemberTarget(instruction.parameters.target)} = ${instruction.parameters.value};\n`; break;
    case 'MEMBER_ASSIGN_CHAR': code = `${renderMemberTarget(instruction.parameters.target)} = ${instruction.parameters.literal};\n`; break;
    case 'MEMBER_ASSIGN_EXPRESSION': code = `${renderMemberTarget(instruction.parameters.target)} `
      + `= ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'MEMBER_PRINT': code = `printf("%d", ${renderMemberTarget(instruction.parameters.target)});\n`; break;
    // Not the same intent as « sors de la boucle » : the target is the switch.
    case 'BREAK_SWITCH': code = 'break;\n'; break;
    case 'INCLUDE_STDIO': code = '#include <stdio.h>\n'; break;
    case 'INCLUDE_LIMITS': code = '#include <limits.h>\n'; break;
    case 'INCLUDE_STDLIB': code = '#include <stdlib.h>\n'; break;
    // `sizeof` yields a size_t, whose C17 conversion specifier is `%zu`.
    case 'SIZEOF_PRINT': code = `printf("%zu", sizeof(${renderMeasuredType(instruction.parameters.type)}));\n`; break;
    case 'SIZEOF_ASSIGN': code = `${instruction.parameters.name} = sizeof(${renderMeasuredType(instruction.parameters.type)});\n`; break;
    // The product is written out, never folded: the student reads the count
    // and the element size separately, which is the point of the lesson.
    case 'ALLOCATE': code = `${instruction.parameters.name} = malloc(${instruction.parameters.count.text} `
      + `* sizeof(${renderMeasuredType(instruction.parameters.type)}));\n`; break;
    case 'REALLOCATE': code = `${instruction.parameters.name} = realloc(${instruction.parameters.source}, `
      + `${instruction.parameters.count.text} * sizeof(${renderMeasuredType(instruction.parameters.type)}));\n`; break;
    case 'FREE': code = `free(${instruction.parameters.name});\n`; break;
    // A stream is a pointer to FILE, which stdio.h declares; the star stays
    // against the name, as decision D2 of lot 17 settled for every pointer.
    case 'FILE_DECL': code = `FILE *${instruction.parameters.name};\n`; break;
    case 'FILE_OPEN': code = `${instruction.parameters.name} = fopen(${renderStringLiteral(instruction.parameters.path)}, `
      + `"${instruction.parameters.mode}");\n`; break;
    case 'FILE_CLOSE': code = `fclose(${instruction.parameters.name});\n`; break;
    case 'FILE_WRITE_TEXT': code = `fprintf(${instruction.parameters.name}, "%s", `
      + `${renderStringLiteral(instruction.parameters.text)});\n`; break;
    case 'FILE_WRITE_INT': code = `fprintf(${instruction.parameters.name}, "%d", ${instruction.parameters.value});\n`; break;
    // The address operator is written out: fscanf needs where to store, and
    // seeing `&` here is the lesson, not an implementation detail.
    case 'FILE_READ_INT': code = `fscanf(${instruction.parameters.name}, "%d", &${instruction.parameters.target});\n`; break;
    case 'FILE_READ_STRING': {
      const read = instruction.parameters;
      code = `fgets(${read.target}, ${read.dimension}, ${read.name});\n`;
      break;
    }
    case 'FILE_AT_END': code = `if (feof(${instruction.parameters.name})) {\n    \n}\n`; break;
    // A local header is included with quotes, a library one with angles: the
    // two forms mean different search rules, and neither is rewritten.
    case 'INCLUDE_LOCAL': code = `#include "${instruction.parameters.path}"\n`; break;
    // Two directives, written together because they are one gesture. The
    // closing `#endif` is a separate instruction the student must write.
    case 'GUARD_OPEN': code = `#ifndef ${instruction.parameters.macro}\n#define ${instruction.parameters.macro}\n`; break;
    case 'GUARD_CLOSE': code = '#endif\n'; break;
    case 'INCLUDE_ASSERT': code = '#include <assert.h>\n'; break;
    // A development check, not error handling: the condition is written as it
    // was given, and no message is invented alongside it.
    case 'ASSERT': code = `assert(${renderCondition(instruction.parameters.condition)});\n`; break;
    case 'CONST_DECL': code = `const ${instruction.parameters.type} ${instruction.parameters.name} `
      + `= ${renderNumericExpression(instruction.parameters.expression)};\n`; break;
    case 'LINKAGE_DECL': code = `${instruction.parameters.linkage} ${instruction.parameters.type} ${instruction.parameters.name};\n`; break;
    case 'PRINT_INT': code = `printf("%d", ${instruction.parameters.name});\n`; break;
    case 'PRINT_FORMATTED': {
      const specifiers: Record<DisplayFormat, string> = { decimal: '%d', hexadecimal: '%x', octal: '%o' };
      code = `printf("${specifiers[instruction.parameters.format]}", ${instruction.parameters.name});\n`;
      break;
    }
    case 'PRINT_TEXT': code = `printf("%s", ${renderStringLiteral(instruction.parameters.text)});\n`; break;
    // The format string here is a constant written by C-A, never author text,
    // so passing it directly carries none of the risk that makes every other
    // display route through "%s".
    case 'PRINT_NEWLINE': code = 'printf("\\n");\n'; break;
  }
  return code;
}
