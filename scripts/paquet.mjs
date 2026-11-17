// Fabrique un paquet « .vsix » installable de l'extension C-A.
//
// Pourquoi à la main plutôt qu'avec `vsce` : le projet s'interdit toute
// dépendance hors `typescript` et `@types/vscode`, et un paquet .vsix n'est
// qu'une archive ZIP contenant trois choses nommées. La fabriquer ici garde
// la contrainte intacte et rend le format visible, donc vérifiable.
//
// Usage : node scripts/paquet.mjs
// Produit : dist/c-a-<version>.vsix et dist/paquet/ (contenu non compressé).

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'extension');
const compile = join(source, 'out', 'extension', 'src', 'extension.js');

if (!existsSync(compile)) {
  console.error('ERREUR : ' + compile + ' est absent.');
  console.error('Lance « npm run build:extension » d’abord : le paquet ne compile rien lui-même.');
  process.exit(1);
}

// Un `out/` jamais nettoyé garde les modules renommés depuis : le paquet
// embarquait ainsi `conditionInformation.js`, renommé au lot 12, que le même
// paquet rebâti depuis un clone propre ne contient pas. Un artefact publié
// doit être reproductible, donc le paquet refuse un out/ périmé.
const perimes = [];
for (const [sortie, sources] of [[join(source, 'out', 'src'), join(racine, 'src')],
  [join(source, 'out', 'extension', 'src'), join(source, 'src')]]) {
  if (!existsSync(sortie)) continue;
  for (const nom of readdirSync(sortie)) {
    if (!nom.endsWith('.js')) continue;
    if (!existsSync(join(sources, nom.replace(/\.js$/u, '.ts')))) perimes.push(join(sortie, nom));
  }
}
if (perimes.length > 0) {
  console.error('ERREUR : ' + perimes.length + ' fichier(s) compilé(s) sans source correspondante :');
  for (const chemin of perimes) console.error('  ' + chemin);
  console.error('Supprime « extension/out » puis relance « npm run build:extension » :');
  console.error('le paquet doit être exactement celui qu’un clone propre produit.');
  process.exit(1);
}

const manifeste = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
const { name, version, publisher, displayName, description, engines } = manifeste;

const dist = join(racine, 'dist');
const paquet = join(dist, 'paquet');
rmSync(paquet, { recursive: true, force: true });
mkdirSync(join(paquet, 'extension'), { recursive: true });

// Seuls les fichiers nécessaires à l'exécution. Pas de sources TypeScript,
// pas de tests, pas de node_modules : l'extension n'a aucune dépendance.
cpSync(join(source, 'package.json'), join(paquet, 'extension', 'package.json'));
cpSync(join(source, 'out'), join(paquet, 'extension', 'out'), { recursive: true });

const lisezMoi = [
  '# C-A — ' + displayName,
  '',
  'Prototype pédagogique. Version ' + version + ', paquet local, non publié.',
  '',
  'C-A traduit une phrase française **du catalogue** en une instruction C17,',
  'montre un aperçu, et n’insère **qu’après confirmation**.',
  '',
  'Il ne vérifie **ni** les symboles, **ni** les types, **ni** les bornes :',
  'un fragment accepté n’est pas un programme correct.',
  '',
  '- commande : « C-A : Saisir une instruction » (`Ctrl+K` puis `A`)',
  '- ne s’active que dans un fichier `.c` enregistré sur le disque',
  '- parcours de découverte : `docs/TEST_PARCOURS_DECOUVERTE.md`',
  '- installation et retour arrière : `docs/TEST_INSTALLATION.md`',
  '',
].join('\n');
writeFileSync(join(paquet, 'extension', 'README.md'), lisezMoi, 'utf8');

const vsixmanifest = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011"'
    + ' xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">',
  '  <Metadata>',
  '    <Identity Language="en-US" Id="' + name + '" Version="' + version + '" Publisher="' + publisher + '" />',
  '    <DisplayName>' + displayName + '</DisplayName>',
  '    <Description xml:space="preserve">' + description + '</Description>',
  '    <Categories>Programming Languages</Categories>',
  '    <Properties>',
  '      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="' + engines.vscode + '" />',
  '      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value="" />',
  '      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value="" />',
  '    </Properties>',
  '  </Metadata>',
  '  <Installation>',
  '    <InstallationTarget Id="Microsoft.VisualStudio.Code" />',
  '  </Installation>',
  '  <Dependencies/>',
  '  <Assets>',
  '    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />',
  '    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />',
  '  </Assets>',
  '</PackageManifest>',
  '',
].join('\n');
writeFileSync(join(paquet, 'extension.vsixmanifest'), vsixmanifest, 'utf8');

const types = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
  '  <Default Extension=".json" ContentType="application/json" />',
  '  <Default Extension=".js" ContentType="application/javascript" />',
  '  <Default Extension=".md" ContentType="text/markdown" />',
  '  <Default Extension=".vsixmanifest" ContentType="text/xml" />',
  '</Types>',
  '',
].join('\n');
writeFileSync(join(paquet, '[Content_Types].xml'), types, 'utf8');

const vsix = join(dist, name + '-' + version + '.vsix');
rmSync(vsix, { force: true });

// Les noms d'entrées sont écrits un par un, avec des séparateurs « / ».
// Mesuré : sur cet hôte, `ZipFile::CreateFromDirectory` et
// `Compress-Archive` écrivent tous deux des « \ », que VS Code ne lit pas —
// le paquet s'installe alors sans son manifeste, donc pas du tout.
function lister(repertoire, prefixe) {
  const trouves = [];
  for (const entree of readdirSync(repertoire, { withFileTypes: true })) {
    const chemin = join(repertoire, entree.name);
    const nom = prefixe === '' ? entree.name : prefixe + '/' + entree.name;
    if (entree.isDirectory()) trouves.push(...lister(chemin, nom));
    else trouves.push([nom, chemin]);
  }
  return trouves;
}

const fichiers = lister(paquet, '');
const inventaire = join(dist, 'entrees.txt');
writeFileSync(inventaire, fichiers.map(([nom, chemin]) => nom + '|' + chemin).join('\n'), 'utf8');

// Les horodatages des entrées sont FIGÉS, et les entrées sont écrites dans
// l'ordre de l'inventaire. Sans cela, deux constructions du même commit
// donnaient un .vsix identique entrée par entrée mais de hachage différent,
// parce qu'un ZIP embarque la date de chaque entrée. Un paquet qu'on ne peut
// pas vérifier par son hachage n'est pas reproductible, seulement « pareil ».
//
// La date retenue — 2026-01-01 00:00 — n'a aucun sens métier, et c'est voulu :
// une date issue du commit ferait dépendre le paquet de l'historique, et une
// date courante ramènerait le problème.
const zip = [
  'Add-Type -AssemblyName System.IO.Compression.FileSystem;',
  "$a = [System.IO.Compression.ZipFile]::Open('" + vsix + "', 'Create');",
  "$fige = New-Object DateTimeOffset(2026, 1, 1, 0, 0, 0, [TimeSpan]::Zero);",
  "foreach ($l in Get-Content -LiteralPath '" + inventaire + "' -Encoding UTF8) {",
  "  $p = $l -split '\\|', 2;",
  '  $e = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($a, $p[1], $p[0],',
  '    [System.IO.Compression.CompressionLevel]::Optimal);',
  '  $e.LastWriteTime = $fige; }',
  '$a.Dispose();',
].join(' ');
execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', zip], { stdio: 'inherit' });
rmSync(inventaire, { force: true });

// Vérification du paquet produit, pas seulement de son existence : un .vsix
// sans ces trois entrées, nommées exactement ainsi, est refusé à l'installation.
const liste = [
  'Add-Type -AssemblyName System.IO.Compression.FileSystem;',
  "$a = [System.IO.Compression.ZipFile]::OpenRead('" + vsix + "');",
  '$a.Entries | ForEach-Object { $_.FullName }; $a.Dispose();',
].join(' ');
const entrees = execFileSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', liste], { encoding: 'utf8' })
  .split(/\r?\n/u).map(ligne => ligne.trim()).filter(ligne => ligne.length > 0);

const requis = ['extension.vsixmanifest', '[Content_Types].xml', 'extension/package.json',
  'extension/out/extension/src/extension.js'];
const manquants = requis.filter(chemin => !entrees.includes(chemin));
const antislash = entrees.filter(chemin => chemin.includes('\\'));

console.log('paquet   : ' + vsix);
console.log('entrées  : ' + entrees.length);
console.log('dossier  : ' + paquet + ' (installable tel quel, voir docs/TEST_INSTALLATION.md)');

if (manquants.length > 0) {
  console.error('ERREUR : entrées requises absentes — ' + manquants.join(', '));
  process.exit(1);
}
if (antislash.length > 0) {
  console.error('ERREUR : ' + antislash.length + ' entrée(s) avec un séparateur « \\ », illisibles par VS Code.');
  process.exit(1);
}
console.log('vérifié  : les 4 entrées requises sont présentes, aucun séparateur « \\ ».');
