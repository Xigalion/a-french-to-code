// CAMPAGNE 1 UNIQUEMENT — sans objet depuis le lot 27, qui rend ce champ
// écrivable par C-A. La campagne 2 n'a aucune retouche manuelle. Conservé
// pour que la campagne 1 reste reproductible telle qu'elle s'est déroulée.
//
// Applique la SEULE retouche manuelle de l'exercice, de façon reproductible
// et idempotente : le champ de type tableau que C-A refuse d'écrire.
//
//   node --experimental-strip-types exercice/retoucher.mjs
//
// Elle est scriptée et non tapée, pour trois raisons : elle survit à une
// régénération de exercice/corrige, elle reste visible dans le dépôt, et elle
// ne peut pas être confondue avec du C produit par C-A — le commentaire
// inséré le dit dans le fichier même.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const cible = root + 'corrige/carnet.h';
const avant = `    // Ajoute un champ de type char nommé initiale.
    char initiale;
`;
const apres = `    // Ajoute un champ de type char nommé initiale.
    char initiale;
    /* RETOUCHE MANUELLE — C-A refuse « Ajoute un champ de type char nommé nom
       de dimension 32. » avec UNEXPECTED_TEXT, et « Ajoute un tableau … » avec
       UNKNOWN_FORMULATION. Cette ligne n'est donc PAS produite par C-A.
       Voir exercice/retouches.md. */
    char nom[32];
`;

const texte = readFileSync(cible, 'utf8');
if (texte.includes('char nom[32];')) {
  console.log('retouche deja presente, rien a faire');
} else if (!texte.includes(avant)) {
  console.error('ancrage introuvable : la retouche n’a PAS été appliquée');
  process.exit(1);
} else {
  writeFileSync(cible, texte.replace(avant, apres), 'utf8');
  console.log('retouche appliquee a corrige/carnet.h : champ char nom[32]');
}
