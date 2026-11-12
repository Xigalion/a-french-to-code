# Lot 12 — Correctif : fonctions imbriquées, `MAIN` comprise

**Date : 12 novembre 2026.** Correctif ciblé demandé par le porteur après
revue du [bilan du lot 12](LOT12_CONTRAT_ET_BILAN.md).

**Décisions du lot 12 approuvées par le porteur à cette revue :**
vérification locale et conservatrice des retours `void` / non-`void` sans
prétendre vérifier le type complet des expressions ; absence de résolution
générale des symboles et signatures lors des appels, avec
`CALL_NOT_RESOLVED` ; mutualisation du balayage contextuel dans
`enclosingStructures.ts`, sous réserve de non-régression ; généralisation
de `pedagogicalInformation.ts` ; extension des avertissements du lot 8 aux
expressions de retour et aux arguments d'appel.

**Point corrigé ici :** en C17 standard, une définition de fonction ne peut
pas être imbriquée dans une autre. Le lot 12 acceptait néanmoins de placer
une nouvelle définition dans un corps de fonction.

---

## 1. Ce que fait le correctif

Une nouvelle intention `FUNC_DEF` n'est placée qu'à la **portée fichier** :
aucune accolade ne doit être encore ouverte avant la ligne cible.

C'est une vérification **locale et structurelle** sur un seul balayage.
**Aucun analyseur général de portées n'a été créé** : le correctif réutilise
le balayage déjà partagé par les deux reconnaisseurs contextuels, et ne
résout aucun symbole.

### Décision par contexte

| Contexte de la ligne cible | Décision |
|---|---|
| Portée fichier : fichier vide, après une déclaration, une inclusion simple, un commentaire, ou une fonction **refermée** | **accepté** |
| Dans un corps de fonction, à n'importe quelle profondeur — directement, dans une boucle, un `if`, un `switch` | refusé `FUNCTION_DEFINITION_NESTED` |
| Toute autre accolade encore ouverte : `struct`, `enum`, initialisateur, bloc nu, accolades déséquilibrées | refusé `UNSUPPORTED_ENCLOSING_CONTEXT` |
| Position qui n'est pas une position d'instruction | refusé `NOT_A_STATEMENT_POSITION` |
| Commentaire ouvert, directive non prise en charge, trigraphe, continuation de ligne | refusé, codes lexicaux existants |

**En contexte ambigu, l'insertion est refusée**, jamais supposée valide.
C'est le sens de la deuxième ligne du tableau : C-A ne sait pas si un
`struct` ouvert rend la position légale, donc il refuse au lieu de parier.

Une accolade qui n'est fermée que dans un commentaire, une chaîne ou un
littéral de caractère ne ferme rien : `int g(void) { // }` reste un corps
de fonction ouvert, et la définition y est refusée (vérifié par test).

### Diagnostic

`FUNCTION_DEFINITION_NESTED`, catégorie `placement`, raison
`unsafe-location`, plage sur le **nom de la fonction englobante la plus
proche** — jamais une fonction extérieure ni une fonction déjà refermée.

> En C17, une définition de fonction ne peut pas être imbriquée dans une
> autre : placez-la en dehors de tout corps de fonction.

Le message indique **où placer** la définition sans réécrire la phrase ni
déplacer quoi que ce soit. Aucune correction automatique, aucune insertion
partielle.

La traduction reste **indépendante du document** : `translate()` continue à
produire le fragment, et seul le placement connaît le contexte — exactement
comme pour les branches, les transferts et les retours.

### Fraîcheur du plan

`FUNC_DEF` rejoint les intentions à plan contextuel : si la ligne devient
intérieure à une fonction après l'aperçu, le plan est périmé et
« Insérer » disparaît (vérifié par test).

---

## 2. `MAIN` aligné sur `FUNC_DEF`

**Décision du porteur, 12 novembre 2026 : option 2 retenue.**
`Crée la fonction principale.` respecte désormais les mêmes contraintes
structurelles de placement que toute autre définition de fonction. C'est
une **exception explicitement approuvée au contrat historique du lot 2**.

### Ancien comportement

Le lot 2 avait décidé de ne contrôler **aucune accolade** pour aucune
intention. `test/placement.test.mjs` l'affirmait dans un test nommé
**« erreurs C et accolades non contrôlées »** : `MAIN` était placée après
chacun de ces préfixes, et le fragment inséré produisait un `int main`
imbriqué, donc du C invalide.

```
int main(void) {        → acceptée, produisait un main imbriqué
} } {                   → acceptée, accolades déséquilibrées
int main(void) {}       → acceptée, portée fichier
int age;                → acceptée, portée fichier
```

Un second test, « MAIN imbriqué conserve uniquement l'indentation de la
ligne cible », vérifiait l'indentation d'une insertion de `MAIN` **dans**
`main`.

### Raison du changement

En C17 standard, une définition de fonction ne peut pas être imbriquée.
Après le correctif du §1, deux phrases demandant la même chose — définir
une fonction — recevaient deux réponses opposées sur la même ligne :
`FUNC_DEF` refusée, `MAIN` acceptée. Les deux produisaient du C invalide ;
une seule était refusée. L'incohérence était signalée comme élément ouvert
et le porteur l'a tranchée en faveur de l'alignement.

### Implémentation

**Trois lignes dans `src/planPlacement.ts`**, réutilisant
`resolveFileScope()` à l'identique :

- `MAIN` rejoint `FUNC_DEF` dans la condition qui déclenche la
  vérification de portée fichier ;
- `MAIN` rejoint les intentions à **plan contextuel**, donc son aperçu
  devient périmé si la ligne cesse d'être à la portée fichier.

**Aucun nouvel analyseur de portées**, aucune résolution de symbole,
aucune détection de doublon : un second `int main` est traduit et placé,
c'est une erreur C que l'étudiant doit voir.

### Impact

| Ce qui change | Ce qui ne change pas |
|---|---|
| `MAIN` est refusée dans un corps de fonction (`FUNCTION_DEFINITION_NESTED`) | **La traduction de `MAIN` est préservée à l'identique** : même intention, mêmes paramètres, même code, même identifiant et rôle de fragment, même curseur intérieur, même tolérance de casse, d'accents et de point final |
| `MAIN` est refusée si une autre accolade reste ouverte (`UNSUPPORTED_ENCLOSING_CONTEXT`) | Les règles d'indentation, de LF/CRLF, de repli d'EOL et de curseur |
| `MAIN` est refusée hors position d'instruction | Les protections lexicales, qui restent prioritaires |
| Le plan de `MAIN` devient contextuel, donc périmable sur ce critère | L'aperçu, la confirmation unique et l'annulation en une seule modification |
| | **Toutes les autres intentions historiques**, qui ignorent toujours les accolades : déclaration, affectation, affichage, inclusion, blocs `if`, boucles |

`src/translate.ts` n'est **pas modifié** par cet alignement : le seul
fichier de `src/` touché est `planPlacement.ts`. Les sorties de traduction
historiques sont donc inchangées par construction, ce que les instantanés
de compatibilité des lots 4 à 6 confirment.

### Tests adaptés

Deux tests validaient volontairement des insertions de `MAIN` dans des
contextes invalides. Ils sont **adaptés, pas supprimés** :

| Test | Adaptation |
|---|---|
| « erreurs C et accolades non contrôlées » | les deux préfixes à accolade ouverte attendent désormais un refus, avec son code et sa raison ; les deux préfixes à portée fichier restent acceptés ; **l'intention non-définition reste acceptée dans les quatre cas**, ce qui prouve que le lot 2 tient pour le reste |
| « MAIN imbriqué conserve uniquement l'indentation » | la couverture d'indentation passe à un bloc `if`, qui s'imbrique légitimement, et un test distinct vérifie que `MAIN` imbriquée est maintenant refusée **sans déduction d'indentation** |

## 3. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/functionContext.ts` | `resolveFileScope()` ajouté, plus le code `FUNCTION_DEFINITION_NESTED` |
| `src/planPlacement.ts` | `FUNC_DEF` passe par la vérification de portée fichier et rejoint les plans contextuels |
| `test/functions.test.mjs` | 1 test inversé, **65 tests ciblés ajoutés** (25 pour `FUNC_DEF`, 40 pour `MAIN`) |
| `test/placement.test.mjs` | 2 tests historiques adaptés, 1 test ajouté |
| `test/vscode/suite.cjs` | 1 test hôte ajouté, couvrant les deux intentions et une intention non-définition |

`src/translate.ts`, `src/enclosingStructures.ts`, `src/loopTarget.ts`,
`src/branchTarget.ts`, `src/pedagogicalInformation.ts`,
`src/calculationAdvisories.ts` : **inchangés**. Aucune dépendance ajoutée.
Aucun instantané de compatibilité régénéré.

## 4. Résultats de tests

### Exécuté et vérifié

```
npm run check
  tsc --project tsconfig.json && tsc --project tsconfig.extension.json --noEmit
  → aucun diagnostic TypeScript

  ℹ tests 2648
  ℹ pass 2648
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
```

**2 648 tests Node réussis.** Les 2 583 du lot 12 sont inclus ; **trois**
ont changé de sens — celui qui affirmait l'ancien comportement de `FUNC_DEF`
et les deux qui validaient volontairement `MAIN` dans un contexte invalide —
et **66 tests ciblés** ont été ajoutés.

Non-régression vérifiée explicitement : les retours, les transferts et les
chaînes de branches sont inchangés ; les instantanés de compatibilité des
lots 4 à 6 et les 105 tests du lot 11D passent sans modification ; les
séquences complètes de construction de programme des suites `session`,
`display` et `callsAndParameters`, qui créent toutes `MAIN` à la portée
fichier, passent inchangées.

Détail des 66 tests ajoutés.

**`FUNC_DEF`, 25 tests :** 8 contextes de portée fichier acceptés ;
7 contextes imbriqués refusés avec vérification de la plage sur la fonction
englobante la plus proche ; 5 contextes ambigus refusés ; positions hors
instruction et contextes lexicaux ; accolades dans un commentaire, une
chaîne ou un littéral de caractère ; indépendance de la traduction vis-à-vis
du document ; péremption du plan ; retours, transferts et branches non
affectés.

**`MAIN`, 40 tests :** traduction historique préservée à l'identique, champ
par champ, avec et sans point final et avec la tolérance de casse et de
tabulations ; les 8 mêmes contextes de portée fichier acceptés ; les
7 mêmes contextes imbriqués refusés ; les 5 mêmes contextes ambigus
refusés ; accolades fermées seulement dans un commentaire, une chaîne ou un
caractère, puis les mêmes réellement fermées ; fonction refermée
n'empêchant pas la suivante ; 6 combinaisons LF/CRLF × indentation
acceptées à la portée fichier et 6 refusées dans un corps ; priorité des
protections lexicales et des contrôles de requête ; aperçu périmé ; une
seule modification annulable sans toucher au reste ; absence de détection
de doublon de `main` ; et les autres intentions historiques vérifiées
inchangées sur trois contextes à accolade ouverte.

**`placement`, 1 test ajouté :** `MAIN` imbriquée refusée sans déduction
d'indentation.

### Non exécuté — toujours bloqué

**Les 97 tests hôte VS Code ne sont pas réussis : ils n'ont pas été
exécutés.** Sixième tentative, la dernière le 12 novembre 2026 à 16:01 :

```
checkInnoSetupMutex: vscode-updating is held, waiting up to 30s for setup to finish...
checkInnoSetupMutex: vscode-updating still held after 31029ms, giving up
Error: Code is currently being updated. Please wait for the update to complete before launching.
```

Diagnostic factuel : une mise à jour de VS Code est en attente sur la
machine. Le mutex Inno Setup `vscode-updating` est détenu par l'instance en
cours d'exécution, et `scripts/test-vscode.mjs` lance l'installation locale
`%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe`. L'installation
contient six dossiers de version empilés
(`261c84cb1e`, `69047191fc`, `7debcd0e2a`, `a717861c07`, `c4453f8ea4`,
`dcd3ad6e36`), ce qui est cohérent avec des mises à jour successives non
appliquées. Aucune autre installation de VS Code n'est présente.

**Aucun verrou n'a été supprimé et l'installation n'a pas été modifiée.**
Aucune substitution d'exécutable n'a été tentée : pointer le script vers un
autre produit ne constituerait pas une vérification de l'hôte VS Code.

Reprise, après redémarrage de VS Code par l'utilisateur :

```powershell
npm.cmd run test:vscode
```

Attendu, **non vérifié** : 97 tests hôte, dont 68 hérités du lot 10, 25 du
lot 11, 3 du lot 12 et 1 ajouté par ce correctif, ce dernier couvrant
`FUNC_DEF`, `MAIN` et une intention non-définition sur la même ligne. En cas de nouvel échec,
le rapport et les journaux se trouvent sous `.cache/vscode-test/`.

## 5. Éléments ouverts, conservés

1. Recette GCC complète du domaine 2 « Expressions et calculs ».
2. [Recette manuelle du domaine 3](RECETTE_DOMAINE3.md).
3. [Recette manuelle du domaine 4](RECETTE_DOMAINE4.md).
4. Qualification des avertissements hôte `mutex already exists`,
   DEP0168/N-API — à qualifier avec le blocage ci-dessus.
5. **Vérification de la compatibilité C17 des fonctions** : l'arbitrage de
   `MAIN` est tranché et implémenté. Reste à vérifier à la recette que les
   deux intentions de définition se comportent identiquement sur une
   machine, et à confirmer qu'aucun autre cas d'invalidité C17 structurelle
   n'est accepté par le placement.
6. Exécution des 97 tests hôte.

Le domaine 5 n'est pas commencé. Les paliers de liberté ne sont pas
spécifiés.
