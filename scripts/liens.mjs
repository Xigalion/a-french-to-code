// Vérifie les liens internes des documents suivis par git.
//
//   node scripts/liens.mjs
//
// Un lien mort dans une page d'accueil publique coûte plus cher qu'un chapitre
// manquant : il apprend au lecteur que la documentation n'est pas tenue.
//
// Ce que le script vérifie :
//   - chaque lien Markdown relatif désigne un fichier qui existe ;
//   - chaque chemin cité entre accents graves et qui ressemble à un fichier du
//     dépôt existe aussi (c'est la forme la plus fréquente ici) ;
//   - aucun lien ne pointe hors du dépôt par un chemin absolu local.
// Ce qu'il ne vérifie pas : les ancres `#section`, et les URL externes — une
// requête réseau dans un contrôle local le rendrait non reproductible.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';

const racine = process.cwd();
const suivis = new Set(execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean).map(chemin => normalize(chemin)));

const documents = [...suivis].filter(chemin => chemin.endsWith('.md'));
const problemes = [];
/** Dossiers ignorés par git : ce qu'on y cite est une trace locale, pas un
 * chemin du dépôt. La liste est explicite, et non déduite de `.gitignore` :
 * un dossier ignoré pour une autre raison ne doit pas devenir invérifiable. */
const TRACES = ['.cache/', 'dist/', 'extension/out/', 'node_modules/'];
let traces = 0;
let liens = 0;
let citations = 0;

/** Extensions des fichiers que ce dépôt cite dans sa documentation. */
const EXTENSIONS = /\.(md|ts|mjs|cjs|json|c|h|txt|yml|vsix|cmd)$/u;

/** Chemins **historiquement** justes : ils existaient au moment du document
 * qui les cite, et le document le dit sur place. Les garder dans une liste
 * explicite plutôt qu'assouplir le contrôle pour tout le monde. */
const HISTORIQUES = new Map([
  ['src/conditionInformation.ts', 'renommé src/pedagogicalInformation.ts au lot 12'],
  ['docs/HISTORIQUE_REECRITURE.md', 'volontairement non publié : gardé dans local/'],
  ['exercice/journal/hote-lot26.txt', 'n’a jamais existé ; l’audit le cite comme défaut corrigé'],
]);


for (const document of documents) {
  const contenu = readFileSync(join(racine, document), 'utf8');
  const base = dirname(document);

  // 1. Liens Markdown [texte](cible)
  for (const trouve of contenu.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/gu)) {
    const cible = trouve[1];
    if (/^(https?:|mailto:|#)/u.test(cible)) continue;
    liens++;
    if (/^[A-Za-z]:[\\/]/u.test(cible) || cible.startsWith('/')) {
      problemes.push(document + ' : lien absolu « ' + cible + ' »');
      continue;
    }
    const sans = cible.split('#')[0];
    if (sans === '') continue;
    const chemin = normalize(join(base, decodeURIComponent(sans)));
    if (!existsSync(resolve(racine, chemin))) {
      problemes.push(document + ' : lien mort « ' + cible + ' »');
    }
  }

  // 2. Chemins cités entre accents graves
  for (const trouve of contenu.matchAll(/`([^`\n]+)`/gu)) {
    const texte = trouve[1];
    if (!EXTENSIONS.test(texte)) continue;
    if (/[ ,;:«»"']/u.test(texte)) continue;          // une phrase, pas un chemin
    if (!texte.includes('/')) continue;                // un simple nom de fichier
    if (texte.startsWith('http') || texte.startsWith('<')) continue;
    if (texte.includes('*') || texte.includes('{')) continue; // un motif, pas un chemin
    if (texte.includes('<') || texte.includes('>')) continue;  // un gabarit, pas un chemin
    if (HISTORIQUES.has(texte)) continue;
    // Une TRACE locale n'est pas un chemin du dépôt : `.cache/`, `dist/` et
    // `extension/out/` sont ignorés par git, et les documents qui les citent
    // le disent (« traces finales locales »). Vérifier leur existence ne
    // mesurait donc que l'état de CETTE machine : le contrôle passait ici et
    // aurait échoué sur un clone neuf. Trouvé le 17 novembre 2026, quand une
    // suite hôte en échec a supprimé le rapport qu'elle produit.
    if (TRACES.some(prefixe => texte.startsWith(prefixe))) { traces++; continue; }
    citations++;
    const chemin = normalize(texte.replace(/^\.\//u, ''));
    const absolu = resolve(racine, chemin);
    const depuisDocument = resolve(racine, normalize(join(dirname(document), chemin)));
    const existe = (p) => { try { statSync(p); return true; } catch { return false; } };
    // Un chemin cité depuis un journal est souvent relatif au dossier de la
    // campagne et non à celui du document : un suffixe suivi par git suffit.
    const suffixe = [...suivis].some(suivi => suivi.endsWith(normalize(chemin)));
    if (!existe(absolu) && !existe(depuisDocument) && !suffixe) {
      problemes.push(document + ' : chemin cité inexistant « ' + texte + ' »');
    }
  }
}

console.log('documents          : ' + documents.length);
console.log('liens Markdown     : ' + liens);
console.log('chemins cités      : ' + citations);
console.log('traces locales      : ' + traces + '  (hors dépôt, non vérifiables)');
console.log('problèmes          : ' + problemes.length);
for (const probleme of problemes) console.log('  ' + probleme);
process.exit(problemes.length === 0 ? 0 : 1);
