import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dicterTout, FICHIERS } from '../exercice/java/dictee.mjs';

// Lot J11 — l'exercice de cloture de Java-A, REJOUE a chaque `npm test`.
//
// Il ne compile pas ici : `npm test` ne doit pas exiger un JDK. Une suite de
// tests qu'on ne peut pas executer ne protege de rien, et la phase 2 l'a
// appris a ses frais. `node exercice/java/cloture.mjs` ajoute javac et java.
//
// Ce que ce test etablit :
//   1. les 96 phrases passent TOUTES, sans une retouche. Une seule qui tombe
//      fait echouer la suite, avec son diagnostic ;
//   2. le Java produit est EXACTEMENT celui qui est commite — un changement
//      de rendu ne peut pas passer inapercu ;
//   3. les cinq contraintes de l'enonce, fixees avant l'implementation, sont
//      tenues par le programme produit.

const { documents, phrases, gestes, informations } = dicterTout();

test('J11 : les 96 phrases passent, sans une retouche', () => {
  assert.equal(documents.size, 4);
  assert.equal(phrases, 96);
  assert.equal(gestes, 11);
  // Les informations passives REELLEMENT rencontrees par un programme qui
  // compile et s'execute. Le chiffre ne doit pas s'effondrer en silence.
  assert.ok(informations.size >= 20, 'informations vues : ' + informations.size);
});

test('J11 : le Java produit est exactement celui qui est commite', () => {
  for (const [chemin, contenu] of documents) {
    const commite = new URL('../exercice/java/cloture/' + chemin, import.meta.url);
    assert.ok(existsSync(commite), 'fichier absent du depot : ' + chemin);
    assert.equal(contenu, readFileSync(commite, 'utf8'),
      'le rendu a change et le fichier commite ne suit pas : ' + chemin
      + '\nRelancez « node exercice/java/cloture.mjs ».');
  }
});

test('J11 : les cinq contraintes de l enonce sont tenues', () => {
  const tout = [...documents.values()].join('\n');
  // 1. plusieurs fichiers : une classe publique, une classe seconde, une
  //    interface, un paquetage.
  assert.equal(documents.size, 4);
  assert.ok(tout.includes('public interface Affichable {'), 'aucune interface');
  assert.ok(tout.includes('public class Promotion {'), 'aucune classe publique');
  assert.ok(/^class Compteur \{/mu.test(tout), 'aucune classe seconde non publique');
  assert.ok(tout.includes('package ecole;'), 'aucun paquetage');
  assert.ok(tout.includes('implements Affichable'), 'aucune implementation d interface');
  assert.ok(tout.includes('extends Eleve'), 'aucun heritage');
  assert.ok(tout.includes('super(age);'), 'aucun appel au constructeur parent');
  assert.ok(tout.includes('@Override'), 'aucune redefinition');

  // 2. il LIT un fichier, donc il traite une exception VERIFIEE. Et A n'a
  //    choisi ni le try ni le throws : les deux sont des phrases.
  assert.ok(tout.includes('new BufferedReader(new FileReader("notes.txt"))'), 'aucune lecture');
  assert.ok(tout.includes('catch (IOException e) {'), 'aucune exception verifiee traitee');
  assert.ok(!tout.includes('throws'), 'un throws a ete ajoute, alors qu aucune phrase ne le demande');

  // 3. une COLLECTION et un TABLEAU, cote a cote : c'est la decision J10 mise
  //    a l epreuve. Deux phrases, deux codes.
  assert.ok(tout.includes('int[] bulletins = new int[3];'), 'aucun tableau');
  assert.ok(tout.includes('List<Integer> notes = new ArrayList<>();'), 'aucune liste');
  assert.ok(tout.includes('bulletins[0] = 12;'), 'aucun acces par indice de tableau');
  assert.ok(tout.includes('notes.add(valeur);'), 'aucun ajout a une liste');
  assert.ok(tout.includes('Map<String, Integer> parNom = new HashMap<>();'), 'aucune table');

  // 4. et 5. sont prouvees par `node exercice/java/cloture.mjs`, qui compile
  //    et execute. Ce test-ci ne peut pas s en charger sans JDK.
});

test('J11 : chaque ligne de code porte son commentaire de tracabilite', () => {
  // Regle 2, verifiee sur un programme ENTIER et non sur un fragment : chaque
  // ligne non blanche qui n'est pas un commentaire, une accolade fermante ou
  // une annotation doit etre precedee d'un commentaire « // ».
  for (const [chemin, contenu] of documents) {
    const lignes = contenu.split('\n');
    for (const [index, ligne] of lignes.entries()) {
      const nue = ligne.trim();
      if (nue === '' || nue.startsWith('//') || nue === '}' || nue.startsWith('@')) continue;
      const precedentes = lignes.slice(0, index).map(l => l.trim()).filter(l => l !== '');
      const precedente = precedentes.at(-1) ?? '';
      assert.ok(precedente.startsWith('//') || precedente.startsWith('@'),
        chemin + ':' + (index + 1) + ' sans commentaire de tracabilite : ' + nue);
    }
  }
});

test('J11 : aucun import n a ete ajoute par A', () => {
  // Regle 3. Les huit imports du programme viennent de huit PHRASES, et on le
  // verifie en les comptant des deux cotes.
  const promotion = documents.get('ecole/Promotion.java') ?? '';
  const ecrits = [...promotion.matchAll(/^import .+;$/gmu)].length;
  const demandes = (FICHIERS.find(f => f.chemin === 'ecole/Promotion.java')?.phrases ?? [])
    .filter(phrase => phrase.startsWith('Importe ')).length;
  assert.equal(ecrits, demandes, 'imports ecrits : ' + ecrits + ', demandes : ' + demandes);
  assert.equal(ecrits, 8);
});
