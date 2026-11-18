import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { rendre } from '../src/langages/registre.ts';
import { JAVA } from '../src/langages/java/langage.ts';
import { planifierJava } from '../src/langages/java/placement.ts';
import { porteesDe } from '../src/langages/java/portees.ts';

// Lot J2 — le placement propre a Java, et ses QUATRE portees.
//
// C'est le lot qui RETIRE des placements : une instruction executable, que
// C17 accepte dans un corps de fonction, exige ici une methode DANS une
// classe. Et rien d'executable ne vit a la portee fichier.

/** Plan d'une phrase a un curseur donne, avec le rendu Java reel. */
function placer(source, phrase, curseur, pas) {
  const traduit = translate(phrase);
  assert.equal(traduit.status, 'translated', 'phrase refusee par le moteur : ' + phrase);
  const rendu = rendre(JAVA, traduit.instruction);
  assert.equal(rendu.status, 'rendu', phrase + ' → ' + JSON.stringify(rendu).slice(0, 160));
  return planifierJava({
    document: { text: source },
    cursorOffset: curseur,
    comment: JAVA.commentaire(phrase),
    code: rendu.code,
    kind: traduit.instruction.kind,
    ...(pas === undefined ? {} : { pas }),
  });
}

/** Le document apres application du plan — ce que l'hote ecrirait. */
function appliquer(source, plan) {
  assert.equal(plan.status, 'planifie', JSON.stringify(plan).slice(0, 200));
  const [edit] = plan.edits;
  return source.slice(0, edit.range.start) + edit.newText + source.slice(edit.range.end);
}

const CLASSE_VIDE = 'public class Programme {\n\n}\n';
const METHODE_VIDE = 'public class Programme {\n    public static void main(String[] args) {\n\n    }\n}\n';

test('J2 : rien d executable ne vit a la portee fichier', () => {
  // La lacune la plus grave trouvee en C17 par l'exercice du lot 26 : A
  // acceptait une affectation a la portee fichier et produisait du C non
  // compilable sans un mot. Java doit la refuser DES LE DEPART.
  const executables = [
    'Affecte la valeur 20 à age.',
    'Affiche la valeur de n.',
    'Appelle somme avec "1" et "2".',
    'Crée un bloc si "x > 0".',
    'Crée une boucle tant que "i < 10".',
    'Retourne la valeur 0.',
    'Vérifie que "x > 0".',
    'Sors de la boucle la plus intérieure.',
  ];
  for (const phrase of executables) {
    const plan = placer('\n', phrase, 0);
    assert.equal(plan.status, 'refuse', 'aurait du etre refuse au fichier : ' + phrase);
    assert.equal(plan.diagnostics[0].code, 'PORTEE_INTERDITE', phrase);
    assert.ok(plan.diagnostics[0].message.includes('portée fichier'), phrase);
  }
});

test('J2 : les MEMES instructions sont placees dans un corps de methode', () => {
  // Le lot 26 avait appris a verifier les deux sens : retirer un placement
  // sans verifier que le placement legitime reste ouvert ne prouve rien.
  const curseur = METHODE_VIDE.indexOf('\n\n') + 1;
  for (const phrase of ['Affecte la valeur 20 à age.', 'Affiche la valeur de n.',
    'Crée un bloc si "x > 0".', 'Retourne la valeur 0.', 'Vérifie que "x > 0".']) {
    const plan = placer(METHODE_VIDE, phrase, curseur);
    assert.equal(plan.status, 'planifie', 'aurait du etre place : ' + phrase);
    assert.equal(plan.portee, 'methode', phrase);
  }
});

test('J2 : un champ exige un corps de CLASSE, pas un corps de methode', () => {
  const auFichier = placer('\n', 'Ajoute un champ de type int nommé x.', 0);
  assert.equal(auFichier.status, 'refuse');
  assert.equal(auFichier.diagnostics[0].code, 'PORTEE_INTERDITE');

  const dansClasse = placer(CLASSE_VIDE, 'Ajoute un champ de type int nommé x.',
    CLASSE_VIDE.indexOf('\n\n') + 1);
  assert.equal(dansClasse.status, 'planifie');
  assert.equal(dansClasse.portee, 'classe');
  assert.equal(appliquer(CLASSE_VIDE, dansClasse),
    'public class Programme {\n'
    + '    // Ajoute un champ de type int nommé x.\n'
    + '    int x;\n'
    + '}\n');

  // Dans une methode, un champ n'est pas un champ : la portee est refusee.
  const dansMethode = placer(METHODE_VIDE, 'Ajoute un champ de type int nommé x.',
    METHODE_VIDE.indexOf('\n\n') + 1);
  assert.equal(dansMethode.status, 'refuse');
  assert.equal(dansMethode.diagnostics[0].code, 'PORTEE_INTERDITE');
});

test('J2 : une methode exige un corps de classe — DEUX niveaux, pas un', () => {
  const auFichier = placer('\n', 'Crée la fonction principale.', 0);
  assert.equal(auFichier.status, 'refuse');
  assert.equal(auFichier.diagnostics[0].code, 'PORTEE_INTERDITE');
  assert.ok(auFichier.diagnostics[0].message.includes('corps de classe'));

  const dansClasse = placer(CLASSE_VIDE, 'Crée la fonction principale.', CLASSE_VIDE.indexOf('\n\n') + 1);
  assert.equal(dansClasse.status, 'planifie');
  assert.equal(appliquer(CLASSE_VIDE, dansClasse),
    'public class Programme {\n'
    + '    // Crée la fonction principale.\n'
    + '    public static void main(String[] args) {\n'
    + '        \n'
    + '    }\n'
    + '}\n');
});

test('J2 : une classe se place au fichier ET dans une classe', () => {
  const auFichier = placer('\n', 'Déclare une structure nommée Point.', 0);
  assert.equal(auFichier.status, 'planifie');
  assert.equal(auFichier.portee, 'fichier');
  assert.equal(appliquer('\n', auFichier),
    '// Déclare une structure nommée Point.\nclass Point {\n    \n}\n');

  const interne = placer(CLASSE_VIDE, 'Déclare une structure nommée Point.',
    CLASSE_VIDE.indexOf('\n\n') + 1);
  assert.equal(interne.status, 'planifie');
  assert.equal(interne.portee, 'classe');
});

test('J2 : le curseur se pose DANS le bloc vide, a la bonne colonne', () => {
  const plan = placer(CLASSE_VIDE, 'Crée la fonction principale.', CLASSE_VIDE.indexOf('\n\n') + 1);
  assert.equal(plan.status, 'planifie');
  const applique = appliquer(CLASSE_VIDE, plan);
  assert.ok(plan.cursor !== undefined, 'un en-tete doit poser le curseur');
  // Le curseur est a la FIN de la ligne blanche du corps : ce qui precede est
  // de l'espace, ce qui suit est la fin de ligne.
  const avant = applique.slice(0, plan.cursor.offset);
  assert.ok(avant.endsWith('        '), JSON.stringify(avant.slice(-14)));
  assert.ok(applique.slice(plan.cursor.offset).startsWith('\n    }'));
});

test('J2 : l indentation vient de la PROFONDEUR, pas de la ligne blanche', () => {
  // C'est la difference de fond avec Python : en Java l'indentation est une
  // mise en forme, et s'en servir comme d'une structure serait faux. Une
  // ligne blanche mal indentee produit donc le MEME resultat.
  const source = 'public class P {\n    public static void main(String[] args) {\n';
  for (const blanche of ['', '  ', '            ']) {
    const texte = source + blanche + '\n    }\n}\n';
    const plan = placer(texte, 'Affiche la valeur de n.', source.length);
    assert.equal(plan.status, 'planifie', JSON.stringify(plan));
    assert.equal(plan.indentation, 8, 'profondeur 2 → 8 espaces, quelle que soit la ligne blanche');
  }
});

test('J2 : le pas d indentation de l editeur est respecte', () => {
  const plan = placer(CLASSE_VIDE, 'Ajoute un champ de type int nommé x.',
    CLASSE_VIDE.indexOf('\n\n') + 1, 2);
  assert.equal(plan.status, 'planifie');
  assert.equal(plan.indentation, 2);
  const refuse = placer(CLASSE_VIDE, 'Ajoute un champ de type int nommé x.',
    CLASSE_VIDE.indexOf('\n\n') + 1, 0);
  assert.equal(refuse.status, 'refuse');
  assert.equal(refuse.diagnostics[0].code, 'INDENTATION_INCONNUE');
});

test('J2 : une ligne non blanche est refusee, toujours', () => {
  const plan = placer(METHODE_VIDE, 'Affiche la valeur de n.', 10);
  assert.equal(plan.status, 'refuse');
  assert.equal(plan.diagnostics[0].code, 'LIGNE_NON_BLANCHE');
});

test('J2 : une branche sinon exige une chaine si qui se termine', () => {
  const sans = 'public class P {\n    static void f() {\n\n    }\n}\n';
  const plan = placer(sans, 'Ajoute une branche sinon.', sans.indexOf('\n\n') + 1);
  assert.equal(plan.status, 'refuse');
  assert.equal(plan.diagnostics[0].code, 'BRANCHE_SANS_SI');

  const avec = 'public class P {\n    static void f() {\n        if (x > 0) {\n        }\n\n    }\n}\n';
  const bon = placer(avec, 'Ajoute une branche sinon.', avec.indexOf('}\n\n') + 2);
  assert.equal(bon.status, 'planifie', JSON.stringify(bon));
});

test('J2 : break et continue exigent une boucle, break accepte l aiguillage', () => {
  const sans = 'public class P {\n    static void f() {\n\n    }\n}\n';
  for (const phrase of ['Sors de la boucle la plus intérieure.',
    'Passe à l’itération suivante de la boucle la plus intérieure.']) {
    const plan = placer(sans, phrase, sans.indexOf('\n\n') + 1);
    assert.equal(plan.status, 'refuse', phrase);
    assert.equal(plan.diagnostics[0].code, 'TRANSFERT_HORS_BOUCLE', phrase);
  }
  const boucle = 'public class P {\n    static void f() {\n        while (i < 10) {\n\n        }\n    }\n}\n';
  for (const phrase of ['Sors de la boucle la plus intérieure.',
    'Passe à l’itération suivante de la boucle la plus intérieure.']) {
    const plan = placer(boucle, phrase, boucle.indexOf('{\n\n') + 2);
    assert.equal(plan.status, 'planifie', phrase + ' → ' + JSON.stringify(plan));
  }
  // Dans un aiguillage : `break` oui, `continue` non.
  const aiguillage = 'public class P {\n    static void f() {\n        switch (j) {\n\n        }\n    }\n}\n';
  const curseur = aiguillage.indexOf('{\n\n', aiguillage.indexOf('switch')) + 2;
  const sortie = placer(aiguillage, 'Sors de l’aiguillage.', curseur);
  assert.equal(sortie.status, 'planifie', JSON.stringify(sortie));
  const suite = placer(aiguillage, 'Passe à l’itération suivante de la boucle la plus intérieure.', curseur);
  assert.equal(suite.status, 'refuse');
  assert.equal(suite.diagnostics[0].code, 'TRANSFERT_HORS_BOUCLE');
});

test('J2 : un cas exige le corps direct de l aiguillage', () => {
  const aiguillage = 'public class P {\n    static void f() {\n        switch (j) {\n\n        }\n    }\n}\n';
  const curseur = aiguillage.indexOf('{\n\n', aiguillage.indexOf('switch')) + 2;
  const plan = placer(aiguillage, 'Ajoute un cas pour la valeur 1.', curseur);
  assert.equal(plan.status, 'planifie', JSON.stringify(plan));

  const horsAiguillage = 'public class P {\n    static void f() {\n\n    }\n}\n';
  const refuse = placer(horsAiguillage, 'Ajoute un cas pour la valeur 1.', horsAiguillage.indexOf('\n\n') + 1);
  assert.equal(refuse.status, 'refuse');
  assert.equal(refuse.diagnostics[0].code, 'CAS_HORS_AIGUILLAGE');
});

test('J2 : les commentaires et les chaines ne trompent pas le balayage', () => {
  // Une accolade dans une chaine ou un commentaire n'ouvre rien. Si elle
  // trompait le balayage, la portee serait fausse et le refus arbitraire.
  const piege = 'public class P {\n'
    + '    // une accolade dans un commentaire : {\n'
    + '    static void f() {\n'
    + '        String s = "} { }";\n'
    + '        char c = \'{\';\n'
    + '        /* et un bloc : { */\n'
    + '\n'
    + '    }\n'
    + '}\n';
  const plan = placer(piege, 'Affiche la valeur de n.', piege.indexOf('*/\n\n') + 3);
  assert.equal(plan.status, 'planifie', JSON.stringify(plan));
  assert.equal(plan.portee, 'methode');
  assert.equal(plan.indentation, 8);
});

test('J2 : une accolade fermante de trop est refusee, pas devinee', () => {
  const casse = 'public class P {\n}\n}\n\n';
  const plan = placer(casse, 'Déclare une structure nommée Point.', casse.length - 1);
  assert.equal(plan.status, 'refuse');
  assert.equal(plan.diagnostics[0].code, 'ACCOLADE_NON_FERMEE');
});

test('J2 : la partition des portees couvre les 57 intentions portees', () => {
  // Le defaut par defaut est « executable », donc aucun genre ne peut etre
  // sans portee. Ce que le test verifie, c'est qu'aucune portee n'est VIDE :
  // une portee qu'aucun genre ne demande serait du code mort.
  const vues = new Set();
  for (const genre of JAVA.portees) for (const p of porteesDe(genre)) vues.add(p);
  assert.deepEqual([...vues].sort(), ['classe', 'fichier', 'methode']);
  // `interface` n'est demandee par aucune intention du catalogue PARTAGE :
  // les methodes attendues sont natives, et arrivent au lot J7.
  assert.deepEqual([...porteesDe('JAVA_METHODE_ATTENDUE')], ['interface']);
});

test('J2 : CRLF est respecte, et aucune fin de ligne n est melangee', () => {
  const source = 'public class P {\r\n    static void f() {\r\n\r\n    }\r\n}\r\n';
  const traduit = translate('Affiche la valeur de n.');
  const rendu = rendre(JAVA, traduit.instruction);
  const plan = planifierJava({
    document: { text: source },
    cursorOffset: source.indexOf('{\r\n\r\n', source.indexOf('f()')) + 3,
    comment: JAVA.commentaire('Affiche la valeur de n.'),
    code: rendu.code,
    kind: traduit.instruction.kind,
    eol: '\r\n',
  });
  assert.equal(plan.status, 'planifie', JSON.stringify(plan));
  assert.ok(plan.edits[0].newText.includes('\r\n'));
  assert.ok(!/[^\r]\n/u.test(plan.edits[0].newText), 'un LF nu a ete ecrit dans un document CRLF');
});
