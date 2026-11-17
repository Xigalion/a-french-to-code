# Phase 2 — mesures de l’architecture

Produit par `node --experimental-strip-types scripts/audit-architecture.mjs`.
Aucun chiffre de `docs/phase2/AUDIT_ARCHITECTURE.md` n’est écrit à la main.

## 1. Modules du moteur

`C` compte les marqueurs de C17 écrits en dur dans le module (noms de
fonctions de la bibliothèque, mots-clés de type, formats). `Syntaxe` compte
les motifs de syntaxe C dans les chaînes produites : accolade de bloc,
point-virgule terminal, étoile de pointeur.

| Module | Lignes | C | Syntaxe | Importe | Importé par |
|---|---|---|---|---|---|
| `src/translate.ts` | 857 | 91 | 102 | 15 | 29 |
| `src/pedagogicalInformation.ts` | 659 | 26 | 0 | 2 | — |
| `src/expressionCore.ts` | 564 | 25 | 0 | 2 | 3 |
| `src/planPlacement.ts` | 312 | 2 | 0 | 9 | — |
| `src/structInstructions.ts` | 298 | 15 | 0 | 4 | 1 |
| `src/functionInstructions.ts` | 279 | 26 | 0 | 3 | 1 |
| `src/arrayInstructions.ts` | 253 | 14 | 0 | 5 | 1 |
| `src/fileInstructions.ts` | 213 | 2 | 0 | 2 | 1 |
| `src/enclosingStructures.ts` | 196 | 10 | 0 | 2 | 6 |
| `src/branchTarget.ts` | 179 | 0 | 0 | 2 | 1 |
| `src/pointerInstructions.ts` | 176 | 11 | 0 | 2 | 1 |
| `src/memoryInstructions.ts` | 174 | 16 | 0 | 2 | 1 |
| `src/reliabilityInstructions.ts` | 141 | 11 | 0 | 3 | 1 |
| `src/numericInstructions.ts` | 133 | 12 | 0 | 2 | 1 |
| `src/placementLexical.ts` | 118 | 2 | 0 | 1 | 3 |
| `src/characterInstructions.ts` | 117 | 0 | 0 | 2 | 1 |
| `src/moduleInstructions.ts` | 117 | 15 | 0 | 2 | 1 |
| `src/switchInstructions.ts` | 113 | 0 | 0 | 3 | 1 |
| `src/calculationAdvisories.ts` | 96 | 0 | 0 | 4 | — |
| `src/functionContext.ts` | 89 | 22 | 1 | 2 | 1 |
| `src/statementScope.ts` | 84 | 1 | 0 | 2 | 1 |
| `src/characterLiteral.ts` | 80 | 0 | 0 | 1 | 5 |
| `src/stringLiteral.ts` | 78 | 0 | 0 | 1 | 3 |
| `src/elementDesignation.ts` | 77 | 0 | 0 | 2 | 2 |
| `src/numericExpression.ts` | 72 | 6 | 2 | 2 | 12 |
| `src/loopTarget.ts` | 71 | 0 | 0 | 2 | 1 |
| `src/condition.ts` | 59 | 0 | 0 | 3 | 4 |
| `src/switchTarget.ts` | 59 | 0 | 0 | 2 | 1 |
| `src/structTarget.ts` | 46 | 5 | 0 | 2 | 1 |
| `src/expression.ts` | 35 | 0 | 0 | 2 | 4 |

**Total moteur : 5745 lignes** sur 30 modules.

| Partage | Modules | Lignes |
|---|---|---|
| **aucun marqueur de C** | 11 | 964 |
| au moins un marqueur | 19 | 4781 |

Modules sans aucun marqueur de C : `branchTarget`, `calculationAdvisories`, `characterInstructions`, `characterLiteral`, `condition`, `elementDesignation`, `expression`, `loopTarget`, `stringLiteral`, `switchInstructions`, `switchTarget`.

## 2. Les 84 intentions, par portabilité

*Classes posées pour des genres absents du catalogue : NUMERIC_CONVERT.*

| Classe | Nombre | Part |
|---|---|---|
| commune | **17** | 20,2 % |
| adaptable | **37** | 44,0 % |
| structure | **6** | 7,1 % |
| specifique | **24** | 28,6 % |

**commune** (17) : `ARRAY_ASSIGN_EXPRESSION`, `ARRAY_ASSIGN_INT`, `ASSIGN_EXPRESSION`, `ASSIGN_INT`, `BREAK`, `CALL`, `CALL_ASSIGN`, `CONTINUE`, `INIT_INT`, `MEMBER_ASSIGN_EXPRESSION`, `MEMBER_ASSIGN_INT`, `NUMERIC_ASSIGN`, `NUMERIC_INIT`, `RETURN`, `RETURN_EXPRESSION`, `RETURN_INT`, `RETURN_NUMERIC`

**adaptable** (37) : `ARRAY_ASSIGN_CHAR`, `ARRAY_DECL`, `ARRAY_PRINT`, `ARRAY_PRINT_CHAR`, `ASSERT`, `ASSIGN_CHAR`, `CASE_CHAR`, `CASE_DEFAULT`, `CASE_INT`, `CONST_DECL`, `DECL_INT`, `FILE_AT_END`, `FILE_CLOSE`, `FILE_DECL`, `FILE_OPEN`, `FILE_READ_INT`, `FILE_READ_STRING`, `FILE_WRITE_INT`, `FILE_WRITE_TEXT`, `INCLUDE_LOCAL`, `INIT_CHAR`, `MAIN`, `MEMBER_ASSIGN_CHAR`, `MEMBER_PRINT`, `NUMERIC_DECL`, `NUMERIC_PRINT`, `PRINT_CHAR`, `PRINT_FORMATTED`, `PRINT_INT`, `PRINT_NEWLINE`, `PRINT_STRING`, `PRINT_TEXT`, `STRING_INIT`, `STRUCT_DECL`, `STRUCT_FIELD`, `STRUCT_VAR`, `SWITCH`

**structure** (6) : `ELSE`, `ELSE_IF`, `FOR`, `FUNC_DEF`, `IF`, `WHILE`

**specifique** (24) : `ALLOCATE`, `ASSIGN_ADDRESS`, `ASSIGN_POINTED_EXPRESSION`, `ASSIGN_POINTED_INT`, `BREAK_SWITCH`, `DECL_CHAR`, `DECL_POINTER`, `DO_WHILE`, `FREE`, `FUNC_PROTOTYPE`, `GUARD_CLOSE`, `GUARD_OPEN`, `INCLUDE_ASSERT`, `INCLUDE_LIMITS`, `INCLUDE_STDIO`, `INCLUDE_STDLIB`, `INIT_POINTER`, `LINKAGE_DECL`, `PRINT_POINTED`, `REALLOCATE`, `SIZEOF_ASSIGN`, `SIZEOF_PRINT`, `STRUCT_POINTER`, `TYPE_ALIAS`

## 3. Diagnostics

| | Nombre |
|---|---|
| codes de diagnostic | **69** |
| nomment un défaut de **la phrase** | 22 |
| nomment une notion **du langage cible** | 47 |

Défauts de la phrase : `CONDITION_FORM_NOT_SUPPORTED`, `MISSING_CONDITION`, `MISSING_CONDITION_DELIMITER`, `UNTERMINATED_CONDITION`, `CHAINED_COMPARISON`, `EMPTY_INPUT`, `INVALID_SEPARATOR`, `UNKNOWN_FORMULATION`, `MISSING_DISPLAY_FORMAT`, `UNSUPPORTED_DISPLAY_FORMAT`, `MISSING_CLOSING_PARENTHESIS`, `UNEXPECTED_CLOSING_PARENTHESIS`, `MISSING_CAST_CLOSING_PARENTHESIS`, `MISSING_DISPLAY_PRECISION`, `INVALID_DISPLAY_PRECISION`, `DUPLICATE_PARAMETER_NAME`, `TOO_MANY_PARAMETERS`, `TOO_MANY_ARGUMENTS`, `INVALID_IDENTIFIER`, `MISSING_CLOSING_BRACKET`, `UNSUPPORTED_INDIRECTION_LEVEL`, `UNEXPECTED_TEXT`.

## 4. Informations pédagogiques

| | Nombre |
|---|---|
| codes d’information | **67** |

Elles sont, par construction, des leçons **sur le langage cible** : chacune
nomme une notion de C17. Aucune n’est réutilisable telle quelle pour un
autre langage ; leur **canal** et leur mécanique, eux, le sont.

## 5. Placement

| | |
|---|---|
| modules de placement | 9 |
| lignes | **1154** (20,1 % du moteur) |
| occurrences d’accolades dans le balayage partagé | 6 |

Le placement est **le point le plus couplé** : toute la reconnaissance de
contexte repose sur les accolades `{` et `}`. Un langage à blocs
indentés n’a pas ces jetons.

## 6. Interface VS Code

| Module | Lignes | importe `vscode` |
|---|---|---|
| `extension/src/extension.ts` | 401 | oui |
| `extension/src/preview.ts` | 54 | oui |
| `extension/src/session.ts` | 182 | non |

Modules du **moteur** important `vscode` : **0**.

