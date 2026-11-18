// Localise le JDK sans jamais ecrire un chemin personnel dans le depot.
//
// Trois sources, dans cet ordre :
//   1. CA_JAVA_HOME, si elle est posee ;
//   2. un JDK portable a cote du depot, par chemin RELATIF ;
//   3. le PATH, s'il en contient un.
//
// Pourquoi relatif : l'audit de publication avait trouve SEPT chemins absolus
// contenant le nom d'utilisateur, tous venus de journaux de compilation GCC.
// La cause avait ete traitee en lancant le compilateur par chemin relatif ;
// la meme regle vaut ici, et un controle de pre-publication la verifie.
//
//   node scripts/jdk.mjs          # imprime ce qui est trouve, et la version
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Le dossier portable attendu, RELATIF a la racine du depot. Le numero de
 * version n'est pas code en dur : un JDK 21 corrige porte un autre nom. */
const VOISIN = join(racine, '..', 'jdk-portable');

function depuisVoisin() {
  if (!existsSync(VOISIN)) return undefined;
  const candidats = readdirSync(VOISIN)
    .filter((nom) => nom.startsWith('jdk-21'))
    .map((nom) => join(VOISIN, nom))
    .filter((chemin) => existsSync(join(chemin, 'bin', 'javac.exe')) || existsSync(join(chemin, 'bin', 'javac')));
  return candidats.sort().at(-1);
}

/** Le dossier du JDK, ou `undefined`. Ne jette pas : un appelant peut vouloir
 * dire proprement « aucun JDK » plutot que planter. */
export function trouverJdk() {
  const declare = process.env.CA_JAVA_HOME;
  if (declare !== undefined && declare !== '' && existsSync(declare)) return declare;
  const voisin = depuisVoisin();
  if (voisin !== undefined) return voisin;
  try {
    execFileSync('javac', ['-version'], { stdio: 'ignore' });
    return 'PATH';
  } catch { return undefined; }
}

/** Le chemin d'un outil du JDK (`javac`, `java`, `jar`…). */
export function outil(nom) {
  const jdk = trouverJdk();
  if (jdk === undefined) {
    throw new Error('Aucun JDK trouvé. Posez CA_JAVA_HOME, ou placez un JDK 21 portable dans '
      + '« ../jdk-portable » à côté du dépôt. Voir docs/phase3/PLAN_JAVA.md §6.');
  }
  return jdk === 'PATH' ? nom : join(jdk, 'bin', nom);
}

/** La version annoncée par `javac`, pour les journaux. */
export function versionJavac() {
  return execFileSync(outil('javac'), ['-version'], { encoding: 'utf8' }).trim();
}

if (process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/gu, '/'))) {
  const jdk = trouverJdk();
  if (jdk === undefined) { console.log('aucun JDK trouvé'); process.exitCode = 1; }
  else {
    // Jamais le chemin absolu : seul ce qui est publiable est imprime.
    console.log('JDK trouvé : ' + (jdk === 'PATH' ? 'dans le PATH' : 'portable, à côté du dépôt'));
    console.log(versionJavac());
  }
}
