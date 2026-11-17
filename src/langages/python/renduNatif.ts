/** Le rendu des intentions **propres à Python**.
 *
 * Lots P4 et P5. Séparé de `rendu.ts`, qui ne traite que les intentions du
 * catalogue partagé : les deux catalogues ne se mélangent pas, et un lecteur
 * doit pouvoir voir d'un coup d'œil ce que Python sait écrire de son propre
 * fonds.
 *
 * Aucune de ces intentions ne porte de valeur par défaut, et aucune n'écrit
 * une ligne qui n'a pas été demandée. Les endroits où Python en offrirait une
 * sont tous écartés, et chacun porte son commentaire :
 *   - `range(n)` à un argument sous-entend un zéro ;
 *   - le `sep` de `print` vaut une espace ;
 *   - `input("invite")` afficherait un texte que personne n'a écrit ;
 *   - `dict.get(cle)` rendrait `None` en silence ;
 *   - `except:` nu attraperait tout, interruption au clavier comprise.
 */
import { renderStringLiteral } from '../../stringLiteral.ts';
import { rendreExpressionPython } from './expression.ts';
import type { InstructionPython } from './instructions.ts';

export type RenduNatif =
  | { status: 'rendu'; code: string }
  | { status: 'refus'; raison: string };

/** Les intentions natives qui ouvrent un bloc. Leur corps reste à écrire, et
 * aucun `pass` n'est produit. */
export const EN_TETES_NATIFS: ReadonlySet<string> = new Set([
  'PY_POUR_INTERVALLE', 'PY_POUR_CHAQUE', 'PY_POUR_INDICE_ET_VALEUR', 'PY_DICT_PARCOURIR',
  'PY_LIRE_LIGNES', 'PY_SI_PRINCIPAL', 'PY_APPARTIENT', 'PY_EST_NONE',
  'PY_MATCH', 'PY_CAS', 'PY_CAS_DEFAUT', 'PY_AVEC_FICHIER', 'PY_ESSAYER', 'PY_SAUF',
]);

/** Toutes les intentions natives livrées. Sert au registre et aux tests : une
 * intention déclarée ici et non rendue serait une intention morte. */
export const NATIVES_PYTHON: ReadonlySet<string> = new Set([
  // valeurs et noms
  'PY_LISTE_VIDE', 'PY_LISTE_VALEURS', 'PY_INIT_STR', 'PY_INIT_BOOL', 'PY_INIT_NONE',
  'PY_CONSTANTE_PAR_CONVENTION', 'PY_ALIAS_DE_LISTE', 'PY_TUPLE', 'PY_SI_PRINCIPAL',
  // calcul et conversion
  'PY_DIV_ENTIERE', 'PY_DIV_REELLE', 'PY_MODULO', 'PY_PUISSANCE', 'PY_LONGUEUR',
  'PY_CONVERSION', 'PY_INPUT', 'PY_TYPE_DE', 'PY_PRINT_PLUSIEURS',
  // séquences
  'PY_AJOUTER', 'PY_AJOUTER_TEXTE', 'PY_INSERER', 'PY_RETIRER', 'PY_TRANCHE',
  'PY_INDICE_NEGATIF', 'PY_DEPAQUETER',
  // dictionnaires et ensembles
  'PY_DICT_VIDE', 'PY_DICT_PAIRES', 'PY_DICT_LIRE', 'PY_DICT_ECRIRE', 'PY_DICT_PARCOURIR',
  'PY_ENSEMBLE',
  // chaînes
  'PY_CONCATENER', 'PY_DECOUPER', 'PY_JOINDRE', 'PY_MAJUSCULES', 'PY_NETTOYER', 'PY_FORMATER',
  // décisions
  'PY_APPARTIENT', 'PY_EST_NONE', 'PY_MATCH', 'PY_CAS', 'PY_CAS_DEFAUT',
  // boucles
  'PY_POUR_CHAQUE', 'PY_POUR_INDICE_ET_VALEUR', 'PY_POUR_INTERVALLE',
  // fonctions
  'PY_PARAM_NOMME', 'PY_RETOUR_MULTIPLE',
  // fichiers, erreurs, modules
  'PY_AVEC_FICHIER', 'PY_LIRE_LIGNES', 'PY_ESSAYER', 'PY_SAUF', 'PY_LEVER',
  'PY_IMPORTER', 'PY_IMPORTER_DE',
]);

export function rendrePythonNatif(instruction: InstructionPython): RenduNatif {
  const rendu = (code: string): RenduNatif => ({ status: 'rendu', code });
  const refus = (raison: string): RenduNatif => ({ status: 'refus', raison });
  /** Rend une expression, en propageant son refus tel quel : une division ou
   * un pointeur dans une valeur est refusé ici comme ailleurs. */
  const expr = (noeud: Parameters<typeof rendreExpressionPython>[0],
    suite: (code: string) => RenduNatif): RenduNatif => {
    const resultat = rendreExpressionPython(noeud);
    return resultat.status === 'refus' ? refus(resultat.raison) : suite(resultat.code);
  };
  /** Rend plusieurs expressions, en s'arrêtant au premier refus. */
  const liste = (noeuds: readonly Parameters<typeof rendreExpressionPython>[0][],
    suite: (codes: string[]) => RenduNatif): RenduNatif => {
    const codes: string[] = [];
    for (const noeud of noeuds) {
      const resultat = rendreExpressionPython(noeud);
      if (resultat.status === 'refus') return refus(resultat.raison);
      codes.push(resultat.code);
    }
    return suite(codes);
  };

  switch (instruction.kind) {
    // ======================= valeurs et noms ==============================
    // L'annotation vient de la phrase — « une liste », « une chaîne » — comme
    // la décision D9 l'autorise : conserver ce que l'utilisateur a dit ne
    // coûte rien.
    case 'PY_LISTE_VIDE':
      return rendu(`${instruction.parameters.name}: list = []\n`);
    case 'PY_LISTE_VALEURS':
      return liste(instruction.parameters.valeurs,
        codes => rendu(`${instruction.parameters.name}: list = [${codes.join(', ')}]\n`));
    case 'PY_INIT_STR':
      return rendu(`${instruction.parameters.name}: str = ${renderStringLiteral(instruction.parameters.texte)}\n`);
    case 'PY_INIT_BOOL':
      return rendu(`${instruction.parameters.name}: bool = ${instruction.parameters.valeur ? 'True' : 'False'}\n`);
    // `None` EST une valeur : l'information passive le dit, parce que la
    // phrase française dit « sans valeur » et que l'intuition est fausse.
    case 'PY_INIT_NONE':
      return rendu(`${instruction.parameters.name} = None\n`);
    // Aucune majuscule n'est imposée au nom : la convention est une
    // convention, et l'imposer serait réécrire ce que l'étudiant a écrit.
    case 'PY_CONSTANTE_PAR_CONVENTION':
      return rendu(`${instruction.parameters.name} = ${instruction.parameters.valeur}\n`);
    case 'PY_ALIAS_DE_LISTE':
      return rendu(`${instruction.parameters.name} = ${instruction.parameters.source}\n`);
    case 'PY_TUPLE':
      return liste(instruction.parameters.valeurs,
        codes => rendu(`${instruction.parameters.name}: tuple = (${codes.join(', ')})\n`));
    case 'PY_SI_PRINCIPAL':
      return rendu('if __name__ == "__main__":\n');

    // ======================= calcul et conversion =========================
    // Décision D3 : les deux quotients sont distincts, et chacun porte son
    // opérateur. Le parenthésage est celui du catalogue C, pour la même
    // raison : la priorité lue est la priorité qui s'applique.
    case 'PY_DIV_ENTIERE': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} // ${d})\n`)));
    }
    case 'PY_DIV_REELLE': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} / ${d})\n`)));
    }
    // Décision D13 : le modulo Python a sa propre phrase, parce qu'il n'a pas
    // la sémantique de celui de C17 sur un opérande négatif.
    case 'PY_MODULO': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} % ${d})\n`)));
    }
    case 'PY_PUISSANCE': {
      const { name, gauche, droite } = instruction.parameters;
      return expr(gauche, g => expr(droite, d => rendu(`${name} = (${g} ** ${d})\n`)));
    }
    case 'PY_LONGUEUR':
      return rendu(`${instruction.parameters.name} = len(${instruction.parameters.source})\n`);
    case 'PY_CONVERSION': {
      const { name, conversion, source } = instruction.parameters;
      return rendu(`${name} = ${conversion}(${source})\n`);
    }
    // `input()` sans invite : une invite serait un texte que personne n'a
    // écrit. Pour en afficher une, il y a une phrase d'affichage.
    case 'PY_INPUT':
      return rendu(`${instruction.parameters.name} = input()\n`);
    case 'PY_TYPE_DE':
      return rendu(`print(type(${instruction.parameters.name}), end="")\n`);
    // Le séparateur est écrit dans la phrase : `sep` vaut une espace par
    // défaut en Python, et la laisser implicite violerait la règle 3.
    case 'PY_PRINT_PLUSIEURS': {
      const { premier, second, separateur } = instruction.parameters;
      return rendu(`print(${premier}, ${second}, sep=${renderStringLiteral(separateur)}, end="")\n`);
    }

    // ======================= séquences ====================================
    case 'PY_AJOUTER':
      return expr(instruction.parameters.valeur,
        code => rendu(`${instruction.parameters.name}.append(${code})\n`));
    // Le texte est un TEXTE, pas un nom : c'est toute la raison de cette
    // seconde phrase, et l'exercice du lot P5 l'a trouvee en echouant.
    case 'PY_AJOUTER_TEXTE':
      return rendu(`${instruction.parameters.name}.append(${renderStringLiteral(instruction.parameters.texte)})\n`);
    case 'PY_INSERER': {
      const { name, position, valeur } = instruction.parameters;
      return expr(position, p => expr(valeur, v => rendu(`${name}.insert(${p}, ${v})\n`)));
    }
    // `del` retire une POSITION ; `remove` chercherait une valeur. La phrase
    // dit « à la position », donc `del`.
    case 'PY_RETIRER':
      return expr(instruction.parameters.position,
        code => rendu(`del ${instruction.parameters.name}[${code}]\n`));
    case 'PY_TRANCHE': {
      const { name, source, debut, fin } = instruction.parameters;
      return expr(debut, d => expr(fin, f => rendu(`${name} = ${source}[${d}:${f}]\n`)));
    }
    case 'PY_INDICE_NEGATIF':
      return rendu(`print(${instruction.parameters.name}[-1], end="")\n`);
    case 'PY_DEPAQUETER': {
      const { premier, second, source } = instruction.parameters;
      return rendu(`${premier}, ${second} = ${source}\n`);
    }

    // ======================= dictionnaires et ensembles ===================
    case 'PY_DICT_VIDE':
      return rendu(`${instruction.parameters.name}: dict = {}\n`);
    case 'PY_DICT_PAIRES': {
      const { name, cle, valeur } = instruction.parameters;
      return expr(valeur,
        code => rendu(`${name}: dict = {${renderStringLiteral(cle)}: ${code}}\n`));
    }
    // L'accès direct lève KeyError sur une clé absente, et c'est volontaire :
    // `get` rendrait `None` en silence, ce qui est exactement la complétion
    // implicite que ce projet refuse d'enseigner comme un réflexe.
    case 'PY_DICT_LIRE': {
      const { name, cle, source } = instruction.parameters;
      return rendu(`${name} = ${source}[${renderStringLiteral(cle)}]\n`);
    }
    case 'PY_DICT_ECRIRE': {
      const { name, cle, valeur } = instruction.parameters;
      return expr(valeur, code => rendu(`${name}[${renderStringLiteral(cle)}] = ${code}\n`));
    }
    case 'PY_DICT_PARCOURIR': {
      const { cle, valeur, source } = instruction.parameters;
      return rendu(`for ${cle}, ${valeur} in ${source}.items():\n`);
    }
    // Pas de variante vide : `{}` est un DICTIONNAIRE, et `set()` demanderait
    // sa propre phrase. L'information passive le dit.
    case 'PY_ENSEMBLE':
      return liste(instruction.parameters.valeurs,
        codes => rendu(`${instruction.parameters.name}: set = {${codes.join(', ')}}\n`));

    // ======================= chaînes ======================================
    case 'PY_CONCATENER': {
      const { name, gauche, droite } = instruction.parameters;
      return rendu(`${name} = (${gauche} + ${droite})\n`);
    }
    case 'PY_DECOUPER': {
      const { name, source, separateur } = instruction.parameters;
      return rendu(`${name} = ${source}.split(${renderStringLiteral(separateur)})\n`);
    }
    // En Python, c'est le SÉPARATEUR qui joint la liste. La phrase française
    // met les éléments en premier, et l'information explique l'inversion.
    case 'PY_JOINDRE': {
      const { name, source, separateur } = instruction.parameters;
      return rendu(`${name} = ${renderStringLiteral(separateur)}.join(${source})\n`);
    }
    case 'PY_MAJUSCULES':
      return rendu(`${instruction.parameters.name} = ${instruction.parameters.source}.upper()\n`);
    case 'PY_NETTOYER':
      return rendu(`${instruction.parameters.name} = ${instruction.parameters.source}.strip()\n`);
    // Le champ est nommé dans la phrase : une f-chaîne dont les champs
    // seraient déduits du texte serait une complétion implicite, et le texte
    // entre guillemets n'est jamais analysé.
    case 'PY_FORMATER': {
      const { name, gabarit, champ, source } = instruction.parameters;
      if (!gabarit.includes('{' + champ + '}')) {
        return refus('Le texte ne contient pas le champ « {' + champ + '} » : C-A n’ajoute pas un champ '
          + 'au texte, et n’en déduit aucun. Écrivez le champ dans le texte, entre accolades.');
      }
      const litteral = renderStringLiteral(gabarit);
      return rendu(`${name} = f${litteral}${champ === source ? '' : `  # ${champ} = ${source}`}\n`);
    }

    // ======================= décisions ====================================
    case 'PY_APPARTIENT':
      return expr(instruction.parameters.valeur,
        code => rendu(`if ${code} in ${instruction.parameters.collection}:\n`));
    // `is`, pas `==` : l'identité et l'égalité sont deux notions, et
    // l'information passive le dit.
    case 'PY_EST_NONE':
      return rendu(`if ${instruction.parameters.name} is None:\n`);
    case 'PY_MATCH':
      return expr(instruction.parameters.expression, code => rendu(`match ${code}:\n`));
    case 'PY_CAS':
      return rendu(`case ${instruction.parameters.valeur}:\n`);
    // `case _` n'est pas un défaut atteint après une traversée : c'est un
    // motif qui filtre tout. Le mot « défaut » est écarté exprès.
    case 'PY_CAS_DEFAUT':
      return rendu('case _:\n');

    // ======================= boucles ======================================
    case 'PY_POUR_CHAQUE':
      return rendu(`for ${instruction.parameters.name} in ${instruction.parameters.collection}:\n`);
    case 'PY_POUR_INDICE_ET_VALEUR': {
      const { indice, valeur, collection } = instruction.parameters;
      return rendu(`for ${indice}, ${valeur} in enumerate(${collection}):\n`);
    }
    // Les deux bornes sont écrites, toutes les deux : `range(n)` à un seul
    // argument sous-entend un zéro que personne n'a demandé.
    case 'PY_POUR_INTERVALLE': {
      const { name, debut, fin } = instruction.parameters;
      return expr(debut, d => expr(fin, f => rendu(`for ${name} in range(${d}, ${f}):\n`)));
    }

    // ======================= fonctions ====================================
    case 'PY_PARAM_NOMME': {
      const { name, arguments: args } = instruction.parameters;
      return liste(args.map(argument => argument.valeur), codes => rendu(
        `${name}(${args.map((argument, index) => `${argument.nom}=${codes[index]}`).join(', ')})\n`));
    }
    case 'PY_RETOUR_MULTIPLE':
      return liste(instruction.parameters.valeurs, codes => rendu(`return ${codes.join(', ')}\n`));

    // ======================= fichiers, erreurs, modules ===================
    case 'PY_AVEC_FICHIER': {
      const { chemin, name, mode } = instruction.parameters;
      return rendu(`with open(${renderStringLiteral(chemin)}, "${mode}") as ${name}:\n`);
    }
    // Genre de table seulement : il se construit en PY_AVEC_FICHIER, et il
    // n'atteint donc jamais ce rendu. Le dire vaut mieux que le supposer.
    case 'PY_AVEC_FICHIER_ECRITURE':
      return refus('Genre interne : il se construit en PY_AVEC_FICHIER avec le mode « w ».');
    case 'PY_LIRE_LIGNES':
      return rendu(`for ${instruction.parameters.name} in ${instruction.parameters.fichier}:\n`);
    case 'PY_ESSAYER':
      return rendu('try:\n');
    // Le type d'erreur est exigé : un `except:` nu attrape tout, interruption
    // au clavier comprise, et ne se diagnostique pas.
    case 'PY_SAUF':
      return rendu(`except ${instruction.parameters.erreur}:\n`);
    case 'PY_LEVER': {
      const { erreur, message } = instruction.parameters;
      return rendu(`raise ${erreur}(${renderStringLiteral(message)})\n`);
    }
    case 'PY_IMPORTER':
      return rendu(`import ${instruction.parameters.module}\n`);
    case 'PY_IMPORTER_DE':
      return rendu(`from ${instruction.parameters.module} import ${instruction.parameters.nom}\n`);
  }
}
