import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { resolveBranchTarget, MAX_BRANCH_UNITS, MAX_BRANCH_TOKENS, MAX_BRANCH_DEPTH, MAX_CHAIN_BRANCHES } from '../src/branchTarget.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const command = (condition, branch=false) => `${branch?'Ajoute une branche sinon si':'Crée un bloc si'} "${condition}".`;
const otherwise = 'Ajoute une branche sinon.';
function translated(source) {
  const result=translate(source);
  assert.equal(result.status,'translated',JSON.stringify(result));
  assert.deepEqual(translate(source),result);
  assert.equal(result.fragments.length,1);
  assert.equal(result.fragments[0].comment,'// '+source);
  return result;
}
function refused(source,code,token) {
  const result=translate(source);
  assert.equal(result.status,'rejected',JSON.stringify(result));
  assert.ok(!('fragments' in result));
  if(code) assert.equal(result.diagnostics[0].code,code);
  if(token) assert.equal(source.slice(result.diagnostics[0].range.start,result.diagnostics[0].range.end),token);
  return result;
}
const expressions=[
  ['a && b','(a && b)'],['a || b','(a || b)'],['!a','(!a)'],['!!a','(!(!a))'],
  ['a || b && c','(a || (b && c))'],['(a || b) && c','((a || b) && c)'],
  ['!a == b','(!a) == b'],['!(a == b)','(!(a == b))'],
  ['age >= 18 && age < 65','((age >= 18) && (age < 65))'],
  ['!(a || b)','(!(a || b))'], ['a && b && c','((a && b) && c)'],
  ['a || b || c','((a || b) || c)'],['a && !b || c','((a && (!b)) || c)'],
  ['d != 0 && 20 / d > 2','((d != 0) && ((20 / d) > 2))'],
  ['0 && 7 / 0','(0 && (7 / 0))'], ['0 && 5.0 % 2','(0 && (5.0 % 2))'],
  ['!a > !b','(!a) > (!b)'], ['!((double) a)','(!((double) a))'],
  ['a < b || !(b >= c && actif)','((a < b) || (!((b >= c) && actif)))'],
];
for(const [expression,expected] of expressions) for(const branch of [false,true]) {
  test(`lot 10 rendu ${branch?'ELSE_IF':'IF'} ${expression}`,()=>{
    const source=command(expression,branch), result=translated(source);
    assert.equal(result.fragments[0].code,`${branch?'else if':'if'} (${expected}) {\n    \n}\n`);
    assert.equal(result.fragments[0].text.slice(result.fragments[0].cursor.offset),'\n}\n');
  });
}
for(const source of ['AJOUTE\tune BRANCHE sinon', ' Ajoute une branche sinon.\t']) {
  test('ELSE commentaire exact '+JSON.stringify(source),()=>assert.equal(translated(source).fragments[0].code,'else {\n    \n}\n'));
}
for(const expression of ['a < b < c','(a < b) == 1','a < (b < c)','a == b == c']) {
  test('lot 10 comparaison chaînée refusée '+expression,()=>refused(command(expression),'CHAINED_COMPARISON'));
}
for(const expression of ['!a + 1','-!a','(int)(a && b)','(a < b) + 1','(a && b) == c']) {
  test('lot 10 usage numérique hors contrat '+expression,()=>refused(command(expression),'CONDITION_FORM_NOT_SUPPORTED'));
}
for(const operator of ['&','|','^','~','++','--','+=','?']) {
  test('lot 10 opérateur encore exclu '+operator,()=>refused(command('a '+operator+' b'),'UNSUPPORTED_CONDITION_OPERATOR',operator));
}
for(const [expression,at] of [['a &&',21],['!',18],['a ||',21]]) {
  test('lot 10 opérande absent '+expression,()=>assert.deepEqual(refused(command(expression),'MISSING_OPERAND').diagnostics[0].range,{start:at,end:at}));
}
test('lot 10 opérateurs logiques mal placés sans traduction partielle',()=>{
  refused(command('a ! b'),'INVALID_EXPRESSION_TOKEN','!');
  refused(command('a && && b'),'MISSING_OPERAND');
  refused(command('a || || b'),'MISSING_OPERAND');
});
test('lot 10 plages UTF16 ELSE_IF décalées et noms astraux',()=>{
  const source=command('A😀B && actif',true);
  const result=refused(source,'INVALID_IDENTIFIER','A😀B');
  assert.equal(result.diagnostics[0].range.start,source.indexOf('A😀B'));
  const good=command('a && !b || c',true);
  assert.deepEqual(explainInstruction(translated(good)).map(x=>good.slice(x.range.start,x.range.end)),['&&','!','||']);
});
for(const source of ['Ajoute une branche sinon si','Ajoute une branche sinon si "', 'Ajoute une branche sinon "a".',otherwise+' autre',command('a')+' '+otherwise]) {
  test('lot 10 phrase incomplète/suffixe '+source,()=>refused(source));
}
for(const form of [n=>'!'.repeat(n)+'a',n=>'('.repeat(n)+'a && b'+')'.repeat(n),n=>'!'.repeat(n)+'(int) a']) {
  test('lot 10 profondeur bornée globale',()=>{
    const count=form(0).includes('(int)')?63:64;
    translated(command(form(count)));
    refused(command(form(count+1)),'EXPRESSION_TOO_COMPLEX');
  });
}
test('lot 10 budget global 1024/1025 tokens, longues chaînes binaires',()=>{
  const source='!'+Array(512).fill('a').join(' && ');
  translated(command(source));
  refused(command('!'+source),'EXPRESSION_TOO_COMPLEX');
});
for(const condition of ['0 && 7 / 0','1 || 7 / 0','!((int)(7 / 0))','a && 5.0 % 2','(7 / 0 > 0) || (5.0 % 2 == 0)']) {
  test('lot 10 avis conservés derrière la logique '+condition,()=>{
    const result=translated(command(condition));
    const original=structuredClone(result);
    const warnings=analyzeCalculations(result).advisories;
    assert.ok(warnings.length);
    assert.deepEqual(result,original);
    assert.ok(warnings.every(w=>w.severity==='warning'));
    const info=explainInstruction(result);
    assert.ok(info.length);
    assert.ok(info.every(x=>x.severity==='information' && x.message.includes('sûreté')));
  });
}

function input(text,source=otherwise,unit='    ',eol='\n',cursorOffset=text.length) {
  return {document:{id:'branches.c',revision:0,text},cursorOffset,translation:translated(source),indentUnit:unit,fallbackEol:eol};
}
function planned(request) {
  const original=structuredClone(request);
  const result=planPlacement(request);
  assert.equal(result.status,'planned',JSON.stringify(result));
  assert.deepEqual(request,original);
  assert.deepEqual(planPlacement(request),result);
  const plan=result.plan;
  assert.equal(validatePlan(plan,request.document).status,'current');
  assert.equal(plan.edits.length,1);
  const edit=plan.edits[0];
  const text=request.document.text.slice(0,edit.range.start)+edit.newText+request.document.text.slice(edit.range.end);
  assert.equal(text.slice(0,edit.range.start),request.document.text.slice(0,edit.range.start));
  assert.equal(text.slice(edit.range.start+edit.newText.length),request.document.text.slice(edit.range.end));
  assert.equal(text.slice(plan.cursorAfter,plan.cursorAfter+plan.eol.length),plan.eol);
  return {plan,text};
}
function placementRefused(request,code) {
  const result=planPlacement(request);
  assert.equal(result.status,'rejected',JSON.stringify(result));
  if(code) assert.equal(result.diagnostics[0].code,code);
  assert.ok(!('plan' in result));
}
for(const eol of ['\n','\r\n']) for(const unit of ['  ','    ','\t']) {
  test(`lot 10 chaîne progressive et conservation ${JSON.stringify([eol,unit])}`,()=>{
    const prefix='// 😀 début'+eol+'int main(void) {'+eol;
    let text=prefix+unit+'if (a) {'+eol+unit.repeat(2)+'int manuel = 1;'+eol+unit+'}'+eol+unit+eol+unit+'int apres = 9;'+eol+'}'+eol;
    const oldPrefix=text.slice(0,text.indexOf(unit+'int apres')-unit.length-eol.length);
    let cursor=text.indexOf(unit+'int apres')-eol.length;
    for(const source of [command('b && !c',true),command('d',true),otherwise]) {
      const result=planned(input(text,source,unit,eol,cursor));
      assert.equal(result.plan.attachment.rootIfRange.start,prefix.length+unit.length);
      assert.ok(result.text.includes(unit.repeat(2)+'int manuel = 1;'));
      assert.ok(result.text.endsWith(unit+'int apres = 9;'+eol+'}'+eol));
      text=result.text;
      // Student explicitly creates a blank line after the newly inserted branch.
      const closing=text.indexOf(unit+'}'+eol,result.plan.cursorAfter);
      const end=closing+unit.length+1+eol.length;
      text=text.slice(0,end)+unit+eol+text.slice(end);
      cursor=end+unit.length;
    }
    assert.ok(text.startsWith(oldPrefix));
    placementRefused(input(text,otherwise,unit,eol,cursor),'BRANCH_AFTER_ELSE');
    placementRefused(input(text,command('x',true),unit,eol,cursor),'BRANCH_AFTER_ELSE');
  });
  test(`lot 10 association intérieure/extérieure ${JSON.stringify([eol,unit])}`,()=>{
    const lines=['int main(void) {',unit+'if (outer) {',unit.repeat(2)+'if (inner) {',unit.repeat(2)+'}',unit.repeat(2),'',unit+'}',unit,'}'];
    const text=lines.join(eol);
    const innerAt=text.indexOf(unit.repeat(2)+eol)+unit.length*2;
    const inner=planned(input(text,otherwise,unit,eol,innerAt));
    assert.equal(inner.plan.attachment.rootIfRange.start,text.indexOf('if (inner)'));
    const outerAt=text.lastIndexOf(unit+eol)+unit.length;
    const outer=planned(input(text,otherwise,unit,eol,outerAt));
    assert.equal(outer.plan.attachment.rootIfRange.start,text.indexOf('if (outer)'));
  });
  for(const ending of ['',eol]) {
    test(`lot 10 ligne EOF ${JSON.stringify([eol,unit,ending])}`,()=>{
      const text='if (a) {'+eol+'}'+eol+ending;
      planned(input(text,otherwise,unit,eol,text.length-ending.length));
    });
  }
}
const refusalCases=[
  ['', 'BRANCH_TARGET_NOT_FOUND'], ['int main(void) {\n}\n', 'UNSUPPORTED_BRANCH_CONTEXT'],
  ['{\n}\n', 'UNSUPPORTED_BRANCH_CONTEXT'], ['if (a) {}\n','BRANCH_TARGET_NOT_FOUND'],
  ['if (a) {\n}\n\n','BRANCH_TARGET_NOT_FOUND'],
  ['if (a) {\n}\n ', 'BRANCH_INDENT_MISMATCH'],
  ['if (a)\n if (b) {\n }\n ', 'UNSUPPORTED_BRANCH_CONTEXT'],
  ['label:\nif (a) {\n}\n', 'UNSUPPORTED_BRANCH_CONTEXT'],
  ['if (a) {\n} // note\n','BRANCH_TARGET_NOT_FOUND'],
  ['if (a) {\n}\nelse {\n}\n','BRANCH_AFTER_ELSE'],
  ['if (a) {\n}\n#unknown\n','UNSUPPORTED_DIRECTIVE'],
];
for(const [text,code] of refusalCases) test('lot 10 refus placement '+JSON.stringify(text),()=>placementRefused(input(text),code));
for(const suffix of ['else {\n}\n','/* note */\nelse if (b) {\n}\n','// note\n\nelse {\n}\n','#if X\nelse','/* ouvert','// continuation\\                    \nelse {\n}','??/\nelse {\n}']) {
  test('lot 10 suffixe interdit '+JSON.stringify(suffix),()=>{
    const prefix='if (a) {\n}\n';
    placementRefused(input(prefix+'\n'+suffix,otherwise,'    ','\n',prefix.length));
  });
}
test('lot 10 corps opaques, commentaires et chaînes ne fabriquent pas de cible',()=>{
  const text='#include <stdio.h>\nif ((a)) {\n printf("} else if { ");\n char c = \'}\';\n /* { if(x) } */\n if (b) { int x = 2; }\n}\n';
  const result=planned(input(text));
  assert.equal(result.plan.attachment.rootIfRange.start,text.indexOf('if ((a))'));
});
for(const altered of ['attachment','code','source','context']) {
  test('lot 10 plan modifié et périmé '+altered,()=>{
    const request=input('if (a) {\n}\n');
    const {plan}=planned(request);
    if(altered==='attachment') plan.attachment.rootIfRange.start++;
    if(altered==='code') plan.edits[0].newText+='inject;';
    if(altered==='source') plan.source.text='Ajoute une branche sinon si "x".';
    if(altered==='context') plan.branchContext.indentUnit='\t';
    assert.equal(validatePlan(plan,request.document).status,'rejected');
  });
}
test('lot 10 fragments modifiés refusés avant rattachement',()=>{
  const request=input('if (a) {\n}\n');
  request.translation.fragments[0].cursor.offset++;
  placementRefused(request,'INVALID_TRANSLATION_RESULT');
});
test('lot 10 bornes de reconnaissance unités, tokens, profondeur et branches',()=>{
  assert.equal(resolveBranchTarget(' '.repeat(MAX_BRANCH_UNITS+1),MAX_BRANCH_UNITS+1,MAX_BRANCH_UNITS+1,'').diagnostic.code,'BRANCH_SCAN_LIMIT');
  const base='if (a) {\n'+ ';'.repeat(MAX_BRANCH_TOKENS)+'\n}\n';
  placementRefused(input(base),'BRANCH_SCAN_LIMIT');
  const deep='if (a) {\n'+'{'.repeat(MAX_BRANCH_DEPTH)+'}'.repeat(MAX_BRANCH_DEPTH)+'\n}\n';
  placementRefused(input(deep),'BRANCH_SCAN_LIMIT');
  const chain='if (a) {\n}\n'+Array(MAX_CHAIN_BRANCHES-1).fill('else if (a) {\n}\n').join('');
  placementRefused(input(chain),'BRANCH_SCAN_LIMIT');
  planned(input('if (a) {\n}\n'+Array(MAX_CHAIN_BRANCHES-2).fill('else if (a) {\n}\n').join('')));
});
test('lot 10 bornes exactes acceptées et suffixe tronqué refusé',()=>{
  const end='\nif (a) {\n}\n';
  const prefix='//'+ 'x'.repeat(MAX_BRANCH_UNITS-2-end.length)+end;
  planned(input(prefix));
  planned(input('if (a) {\n'+';'.repeat(MAX_BRANCH_TOKENS-6)+'\n}\n'));
  planned(input('if (a) {\n'+'{'.repeat(MAX_BRANCH_DEPTH-1)+'}'.repeat(MAX_BRANCH_DEPTH-1)+'\n}\n'));
  const short=prefix.slice(0,2)+'x'.repeat(MAX_BRANCH_UNITS-4-end.length)+end;
  placementRefused(input(short+'\nelse {\n}\n',otherwise,'    ','\n',short.length),'BRANCH_SCAN_LIMIT');
  const begin='if (a) {\n}\n';
  const comment='/*'+'x'.repeat(MAX_BRANCH_UNITS-begin.length-4)+'*/';
  placementRefused(input(begin+'\n'+comment,otherwise,'    ','\n',begin.length),'BRANCH_SCAN_LIMIT');
});
for(const condition of ['a = b','a && (b = c)','!(a = 1)','a || (b < c < d)']) {
  test('lot 10 aucune correction ou comparaison chaînée cachée '+condition,()=>refused(command(condition)));
}
for(const text of ['if (a) {\n int x<:2:>;\n}\n','if (a) {\n {]\n}\n','if (a) {\n}\n// ??/\n']) {
  test('lot 10 préfixe hors sous-ensemble '+JSON.stringify(text),()=>placementRefused(input(text)));
}
for(const mutation of ['document','cursor','options','close','draft']) {
  test('lot 10 session périmée '+mutation,()=>{
    const current={document:{id:'x.c',revision:1,text:'if (a) {\n}\n'},cursorOffset:13,singleCursor:true,indentUnit:'    ',indentSignature:'4',eol:'\n',open:true};
    current.cursorOffset=current.document.text.length;
    const session=new TranslationSession(current,command('!b || c',true));
    const prepared=session.prepare(current);
    assert.equal(prepared.status,'preview');
    session.reviewReady(prepared.preview.token,current);
    const next=structuredClone(current);
    if(mutation==='document') {next.document.text+=' ';next.document.revision++;}
    if(mutation==='cursor') next.cursorOffset--;
    if(mutation==='options') next.indentSignature='8';
    if(mutation==='close') next.open=false;
    if(mutation==='draft') session.updateText(otherwise);
    assert.equal(session.beginApply(prepared.preview.token,next).status,'error');
    assert.deepEqual(session.information,[]);
  });
}
test('lot 10 session cible visible, informations passives et confirmation unique',()=>{
  const current={document:{id:'x.c',revision:1,text:'if (a) {\n}\n'},cursorOffset:13,singleCursor:true,indentUnit:'    ',indentSignature:'4',eol:'\n',open:true};
  current.cursorOffset=current.document.text.length;
  const session=new TranslationSession(current,command('!b && c || 0',true));
  const prepared=session.prepare(current);
  assert.equal(prepared.status,'preview',JSON.stringify(prepared));
  assert.equal(session.information.length,3);
  assert.equal(session.advisories.length,0);
  assert.match(session.attachmentLabel,/ligne 1/);
  session.reviewReady(prepared.preview.token,current);
  const result=session.beginApply(prepared.preview.token,current);
  assert.equal(result.status,'apply');
  assert.equal(session.beginApply(prepared.preview.token,current).status,'error');
});
