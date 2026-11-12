# Lot 12 — Correctif : fonctions imbriquées

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

## 2. `MAIN` : examiné séparément, **inchangé**

Le porteur a demandé d'examiner à part toute modification éventuelle du
comportement de `MAIN`. **Aucune modification n'a été faite**, pour une
raison factuelle et non par prudence :

`test/placement.test.mjs`, dans un test nommé
**« erreurs C et accolades non contrôlées »**, affirme explicitement que
`Crée la fonction principale.` est placée après chacun de ces préfixes :

```
int main(void) {
} } {
int main(void) {}
int age;
```

C'est une **décision approuvée du lot 2** : les accolades ne sont
volontairement pas contrôlées pour les intentions historiques. Modifier
`MAIN` reviendrait à changer un contrat livré et testé sous ce nom précis.

### Conséquence : une incohérence assumée, à arbitrer

À ce jour, sur la même ligne blanche à l'intérieur de `main` :

| Phrase | Résultat |
|---|---|
| `Crée une fonction nommée f qui retourne un int.` | **refusé** `FUNCTION_DEFINITION_NESTED` |
| `Crée la fonction principale.` | **accepté**, produit un `int main` imbriqué |

Les deux produisent du C invalide ; une seule est refusée. Les deux
comportements sont vérifiés par test, côté moteur et côté hôte.

**Trois options, pour décision du porteur** — aucune n'est engagée :

1. **Statu quo.** `MAIN` garde son contrat de lot 2 ; l'incohérence est
   documentée. C'est l'état actuel.
2. **Aligner `MAIN` sur `FUNC_DEF`.** Cohérent et plus pédagogique, mais
   c'est une modification de contrat historique : il faut réécrire le test
   « erreurs C et accolades non contrôlées » et justifier la rupture.
3. **Aligner par une information passive.** `MAIN` reste plaçable, mais un
   motif pédagogique signale l'imbrication sans bloquer. Préserve le
   contrat, informe l'étudiant, n'interdit rien.

Cette question est consignée comme élément ouvert : **vérification de la
compatibilité C17 des fonctions**.

---

## 3. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/functionContext.ts` | `resolveFileScope()` ajouté, plus le code `FUNCTION_DEFINITION_NESTED` |
| `src/planPlacement.ts` | `FUNC_DEF` passe par la vérification de portée fichier et rejoint les plans contextuels |
| `test/functions.test.mjs` | 1 test inversé, **25 tests ciblés ajoutés** |
| `test/vscode/suite.cjs` | 1 test hôte ajouté |

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

  ℹ tests 2608
  ℹ pass 2608
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
```

**2 608 tests Node réussis.** Les 2 583 du lot 12 sont inclus ; **un seul**
a changé de sens, celui qui affirmait l'ancien comportement, et
**25 tests ciblés** ont été ajoutés.

Non-régression vérifiée explicitement : les 4 préfixes du test historique
« erreurs C et accolades non contrôlées » placent toujours `MAIN` ; les
retours, les transferts et les chaînes de branches sont inchangés ; le
reste des 2 583 tests passe sans modification, les 105 du lot 11D et les
instantanés de compatibilité des lots 4 à 6 compris.

Détail des 25 tests ajoutés : 8 contextes de portée fichier acceptés ;
7 contextes imbriqués refusés avec vérification de la plage sur la fonction
englobante la plus proche ; 5 contextes ambigus refusés ; positions hors
instruction et contextes lexicaux ; accolades dans un commentaire, une
chaîne ou un littéral de caractère ; indépendance de la traduction vis-à-vis
du document ; péremption du plan ; `MAIN` historique préservé ; retours,
transferts et branches non affectés.

### Non exécuté — toujours bloqué

**Les 97 tests hôte VS Code ne sont pas réussis : ils n'ont pas été
exécutés.** Cinquième tentative, la dernière à 10:56 :

```
checkInnoSetupMutex: vscode-updating is held, waiting up to 30s for setup to finish...
checkInnoSetupMutex: vscode-updating still held after 31050ms, giving up
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
lot 11, 3 du lot 12 et 1 ajouté par ce correctif. En cas de nouvel échec,
le rapport et les journaux se trouvent sous `.cache/vscode-test/`.

## 5. Éléments ouverts, conservés

1. Recette GCC complète du domaine 2 « Expressions et calculs ».
2. [Recette manuelle du domaine 3](RECETTE_DOMAINE3.md).
3. [Recette manuelle du domaine 4](RECETTE_DOMAINE4.md).
4. Qualification des avertissements hôte `mutex already exists`,
   DEP0168/N-API — à qualifier avec le blocage ci-dessus.
5. **Vérification de la compatibilité C17 des fonctions**, dont l'arbitrage
   du comportement de `MAIN` décrit au §2.
6. Exécution des 97 tests hôte.

Le domaine 5 n'est pas commencé. Les paliers de liberté ne sont pas
spécifiés.
