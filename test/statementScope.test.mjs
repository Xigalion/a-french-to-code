import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { resolveStatementScope, DECLARATION_KINDS, STATEMENT_KINDS, CONTEXT_VERIFIED_KINDS } from '../src/statementScope.ts';

// Lot 26. The catalogue is generated from the engine and verified against it,
// so it is the reference for which intents exist: a lot that adds one without
// classifying it fails the partition test below.
const CATALOGUE = readFileSync(new URL('../docs/CATALOGUE.md', import.meta.url), 'utf8');
const SENTENCES = CATALOGUE.split('\n')
  .filter(line => line.startsWith('| `'))
  .map(line => /^\| `(.+?)` \|/u.exec(line)?.[1])
  .filter(sentence => sentence !== undefined);

const CORPS = 'int main(void) {\n';
function input(text, source, cursorOffset = text.length) {
  const translation = translate(source);
  assert.equal(translation.status, 'translated', source + ' : ' + JSON.stringify(translation));
  return { document: { id: 'scope.c', revision: 0, text }, cursorOffset, translation };
}

/** One catalogue sentence per intent kind, so every kind is exercised with a
 * sentence the engine really accepts rather than one written by hand here. */
const byKind = new Map();
for (const source of SENTENCES) {
  const result = translate(source);
  if (result.status !== 'translated') continue;
  if (!byKind.has(result.instruction.kind)) byKind.set(result.instruction.kind, source);
}

// ---------------------------------------------------------------------------
// 1. Partition
// ---------------------------------------------------------------------------

test('lot 26 : les trois ensembles sont disjoints', () => {
  const all = [...DECLARATION_KINDS, ...STATEMENT_KINDS, ...CONTEXT_VERIFIED_KINDS];
  assert.equal(new Set(all).size, all.length, 'un genre est classé deux fois');
  // Lot 28 a ajouté INCLUDE_LIMITS aux déclarations : 24 -> 25.
  assert.equal(DECLARATION_KINDS.length, 25);
  // Lot 29 a ajouté PRINT_NEWLINE aux instructions : 42 -> 43.
  assert.equal(STATEMENT_KINDS.length, 43);
  assert.equal(CONTEXT_VERIFIED_KINDS.length, 15);
  assert.equal(all.length, 83);
});

test('lot 26 : MEMBER_ASSIGN_CHAR est déclaré mais inatteignable', () => {
  // Trouvé en classant les 81 genres. Ce genre existe dans le type
  // `StructInstruction` et translate.ts sait le rendre, mais AUCUN analyseur
  // ne le construit : aucune phrase française ne mène à lui. Il est donc
  // classé pour que la partition soit complète, et ce test est là pour que
  // personne ne le présente comme disponible. Voir LOT26_BILAN.md §5.
  assert.ok(STATEMENT_KINDS.includes('MEMBER_ASSIGN_CHAR'));
  assert.equal(byKind.has('MEMBER_ASSIGN_CHAR'), false);
  for (const source of [
    'Affecte le caractère \'A\' au champ initiale de e.',
    'Affecte le caractère \'A\' au champ initiale pointé par p.',
  ]) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('lot 26 : tout genre du catalogue est classé exactement une fois', () => {
  const classified = new Set([...DECLARATION_KINDS, ...STATEMENT_KINDS, ...CONTEXT_VERIFIED_KINDS]);
  const unclassified = [...byKind.keys()].filter(kind => !classified.has(kind));
  assert.deepEqual(unclassified, [], 'genres du catalogue non classés par le lot 26');
});

// ---------------------------------------------------------------------------
// 2. Refus : chaque instruction exécutable, à la portée fichier
// ---------------------------------------------------------------------------

for (const kind of STATEMENT_KINDS) {
  const source = byKind.get(kind);
  if (source === undefined) continue;
  test(`lot 26 refus à la portée fichier : ${kind}`, () => {
    const result = planPlacement(input('', source));
    assert.equal(result.status, 'rejected', `${kind} : ${source}`);
    assert.equal(result.diagnostics.length, 1);
    const diagnostic = result.diagnostics[0];
    assert.equal(diagnostic.code, 'STATEMENT_AT_FILE_SCOPE');
    assert.equal(diagnostic.category, 'placement');
    assert.equal(diagnostic.reason, 'unsafe-location');
    assert.equal(diagnostic.severity, 'error');
    assert.deepEqual(diagnostic.range, { start: 0, end: 0 });
    assert.match(diagnostic.message, /instruction exécutable/u);
    // No partial fragment, and no plan at all.
    assert.ok(!('plan' in result));
  });

  test(`lot 26 acceptation inchangée dans un corps : ${kind}`, () => {
    const result = planPlacement(input(CORPS, source));
    assert.equal(result.status, 'planned', `${kind} : ${source} : ${JSON.stringify(result)}`);
  });
}

// ---------------------------------------------------------------------------
// 3. Les déclarations restent plaçables à la portée fichier
// ---------------------------------------------------------------------------

for (const kind of DECLARATION_KINDS) {
  const source = byKind.get(kind);
  if (source === undefined) continue;
  test(`lot 26 déclaration toujours acceptée à la portée fichier : ${kind}`, () => {
    const result = planPlacement(input('', source));
    assert.equal(result.status, 'planned', `${kind} : ${source} : ${JSON.stringify(result)}`);
  });
}

// ---------------------------------------------------------------------------
// 4. Contextes valides pour une instruction
// ---------------------------------------------------------------------------

const statement = 'Affecte la valeur 5 à x.';
for (const [label, prefix] of [
  ['corps de fonction', 'int main(void) {\n'],
  ['bloc nu dans une fonction', 'int main(void) {\n{\n'],
  ['bloc si', 'int main(void) {\nif (a) {\n'],
  ['bloc sinon', 'int main(void) {\nif (a) {\n} else {\n'],
  ['boucle tant que', 'int main(void) {\nwhile (a) {\n'],
  ['boucle pour', 'int main(void) {\nfor (i = 0; i < 3; i++) {\n'],
  ['boucle à test final', 'int main(void) {\ndo {\n'],
  ['aiguillage', 'int main(void) {\nswitch (j) {\n'],
  ['après une étiquette', 'int main(void) {\nswitch (j) {\ncase 1:\n'],
  ['fonction autre que main', 'void g(int n) {\n'],
  ['fonction au type de retour non pris en charge', 'long g(void) {\n'],
  ['imbrication profonde', 'int main(void) {\nwhile (a) {\nif (b) {\n{\n'],
]) {
  test(`lot 26 contexte valide : ${label}`, () => {
    const result = planPlacement(input(prefix, statement));
    assert.equal(result.status, 'planned', `${label} : ${JSON.stringify(result)}`);
  });
}

test('lot 26 : un corps de boucle sans accolades reste un emplacement valide', () => {
  // checkStatementPosition is deliberately not applied to statements: an
  // unbraced body is valid C and refusing it would remove a capability that
  // has nothing to do with scope.
  for (const prefix of ['int main(void) {\nwhile (a)\n', 'int main(void) {\nif (a)\n', 'int main(void) {\nfor (;;)\n']) {
    assert.equal(planPlacement(input(prefix, statement)).status, 'planned', prefix);
  }
});

// ---------------------------------------------------------------------------
// 5. Contextes refusés
// ---------------------------------------------------------------------------

for (const [label, prefix, code] of [
  ['document vide', '', 'STATEMENT_AT_FILE_SCOPE'],
  ['après une déclaration', 'int x;\n', 'STATEMENT_AT_FILE_SCOPE'],
  ['après une fonction fermée', 'int main(void) {\n}\n', 'STATEMENT_AT_FILE_SCOPE'],
  ['après une directive', '#include <stdio.h>\n', 'STATEMENT_AT_FILE_SCOPE'],
  ['bloc nu à la portée fichier', '{\n', 'STATEMENT_AT_FILE_SCOPE'],
  ['corps de structure', 'struct P {\n', 'UNSUPPORTED_ENCLOSING_CONTEXT'],
  ['corps de structure dans une fonction', 'int main(void) {\nstruct P {\n', 'UNSUPPORTED_ENCLOSING_CONTEXT'],
  ['accolade fermante orpheline', '} } {\n', 'UNSUPPORTED_ENCLOSING_CONTEXT'],
]) {
  test(`lot 26 contexte refusé : ${label}`, () => {
    const result = planPlacement(input(prefix, statement));
    assert.equal(result.status, 'rejected', label);
    assert.equal(result.diagnostics[0].code, code, `${label} : ${JSON.stringify(result.diagnostics[0])}`);
  });
}

test('lot 26 : le refus porte sur la ligne cible, pas sur la phrase', () => {
  const text = 'int x;\n';
  const result = planPlacement(input(text, statement));
  assert.deepEqual(result.diagnostics[0].range, { start: text.length, end: text.length });
});

test('lot 26 : à la portée fichier le diagnostic nomme la règle, sans donner la phrase correcte', () => {
  const message = planPlacement(input('', statement)).diagnostics[0].message;
  assert.match(message, /^En C17, une instruction exécutable n’existe que dans le corps d’une fonction\./u);
  assert.match(message, /seules les déclarations, les définitions et les directives sont valides\./u);
  // Diagnostic is not correction: no sentence to copy, no suggested fix.
  assert.ok(!/Crée la fonction principale/u.test(message));
  assert.ok(!/essayez|écrivez|remplacez/iu.test(message));
});

test('lot 26 : accolades ouvertes sans fonction, message distinct et portée sur l’accolade', () => {
  const text = '{\n';
  const diagnostic = planPlacement(input(text, statement)).diagnostics[0];
  assert.equal(diagnostic.code, 'STATEMENT_AT_FILE_SCOPE');
  assert.match(diagnostic.message, /^Aucune fonction n’englobe cette ligne/u);
  assert.deepEqual(diagnostic.range, { start: 0, end: 1 });
});

// ---------------------------------------------------------------------------
// 6. Les familles déjà vérifiées ne changent pas
// ---------------------------------------------------------------------------

for (const [source, text, code] of [
  ['Retourne la valeur 0.', '', 'NO_ENCLOSING_FUNCTION'],
  ['Sors de la boucle la plus intérieure.', '', 'LOOP_TARGET_NOT_FOUND'],
  ['Passe à l’itération suivante de la boucle la plus intérieure.', '', 'LOOP_TARGET_NOT_FOUND'],
  ['Ajoute un cas pour la valeur 1.', '', 'SWITCH_TARGET_NOT_FOUND'],
  ['Sors de l’aiguillage.', '', 'SWITCH_TARGET_NOT_FOUND'],
  ['Ajoute un champ de type int nommé x.', '', 'FIELD_OUTSIDE_STRUCT'],
  ['Crée la fonction principale.', 'int main(void) {\n', 'FUNCTION_DEFINITION_NESTED'],
]) {
  test(`lot 26 : diagnostic historique intact — ${source}`, () => {
    const result = planPlacement(input(text, source));
    assert.equal(result.status, 'rejected', source);
    assert.equal(result.diagnostics[0].code, code, `${source} : ${JSON.stringify(result.diagnostics[0])}`);
  });
}

test('lot 26 : les retours et transferts valides ne sont pas doublés d’un contrôle de portée', () => {
  assert.equal(planPlacement(input('int main(void) {\n', 'Retourne la valeur 0.')).status, 'planned');
  assert.equal(planPlacement(input('void g(void) {\n', 'Retourne.')).status, 'planned');
  assert.equal(planPlacement(input('int main(void) {\nwhile (a) {\n', 'Sors de la boucle la plus intérieure.')).status, 'planned');
  assert.equal(planPlacement(input('int main(void) {\nswitch (j) {\n', 'Ajoute le cas par défaut.')).status, 'planned');
  assert.equal(planPlacement(input('struct P {\n', 'Ajoute un champ de type int nommé x.')).status, 'planned');
});

// ---------------------------------------------------------------------------
// 7. Le résolveur lui-même
// ---------------------------------------------------------------------------

test('lot 26 : resolveStatementScope est pur et déterministe', () => {
  for (const text of ['', 'int main(void) {\n', 'struct P {\n', '{\n']) {
    const first = resolveStatementScope(text, text.length);
    assert.deepEqual(resolveStatementScope(text, text.length), first);
    assert.deepEqual(first, JSON.parse(JSON.stringify(first)));
  }
});

test('lot 26 : un rejet du balayage partagé est propagé tel quel', () => {
  // The scan already refuses these; the scope resolver must not reinterpret.
  for (const [text, code] of [
    ['/* ouvert\n', 'TARGET_IN_COMMENT'],
    ['#define X 1\n', 'UNSUPPORTED_DIRECTIVE'],
    ['// x\\\n', 'UNSUPPORTED_LINE_CONTINUATION'],
  ]) {
    const resolved = resolveStatementScope(text, text.length);
    assert.equal(resolved.status, 'rejected', text);
    assert.equal(resolved.diagnostic.code, code, text);
  }
});

// ---------------------------------------------------------------------------
// 8. Fraîcheur : la portée ne peut pas changer sous un plan accepté
// ---------------------------------------------------------------------------

test('lot 26 : supprimer la fonction entre l’aperçu et l’insertion invalide le plan', () => {
  const text = CORPS;
  const planned = planPlacement(input(text, statement));
  assert.equal(planned.status, 'planned');
  // The statement captures no target, so freshness rests on text equality,
  // which no document edit can survive. See LOT26_CONTRAT_PROPOSE.md §5.
  assert.equal(validatePlan(planned.plan, { id: 'scope.c', revision: 0, text }).status, 'current');
  assert.equal(validatePlan(planned.plan, { id: 'scope.c', revision: 1, text: '' }).status, 'rejected');
  assert.equal(validatePlan(planned.plan, { id: 'scope.c', revision: 1, text: '' }).diagnostics[0].code, 'STALE_PLAN');
});

// ---------------------------------------------------------------------------
// 9. Le C produit n’est pas garanti pour autant
// ---------------------------------------------------------------------------

test('lot 26 : une portée valide ne garantit ni les symboles ni la compilation', () => {
  // The lot answers one structural question. It does not resolve names, and
  // this must never be presented as a guarantee that the C compiles.
  assert.equal(planPlacement(input(CORPS, 'Affecte la valeur 5 à jamais_declare.')).status, 'planned');
  assert.equal(planPlacement(input(CORPS, 'Affiche la valeur de inconnu.')).status, 'planned');
  assert.equal(planPlacement(input(CORPS, 'Libère la mémoire pointée par p.')).status, 'planned');
});
