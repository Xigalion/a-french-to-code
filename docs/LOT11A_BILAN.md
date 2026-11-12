# Lot 11A — `while` : bilan de livraison

**Date : 12 novembre 2026.** Contrat de référence : [LOT11_CONTRAT_PROPOSE.md](LOT11_CONTRAT_PROPOSE.md), §§1-3, 5, 7-9, approuvé par le porteur le 12 novembre 2026 (découpage 11A/11B/11C/11D, formulation `Crée une boucle tant que "{condition}".`, réutilisation stricte de la condition du lot 10, ajout de l'information `WHILE_PRETEST`).

---

## 1. Périmètre livré

Une seule intention nouvelle, `WHILE` :

    Crée une boucle tant que "{condition}".

Produit, sur une ligne blanche d'indentation `B` et avec une unité `U` :

```c
// Crée une boucle tant que "i < limite".
while (i < limite) {
    
}
```

Le curseur est placé sur la ligne intérieure, après `B + U`. Le corps est
vide : aucun compteur, initialisation, progression, instruction de sortie,
`main`, en-tête ni point-virgule n'est ajouté.

**Hors périmètre, refusé comme avant :** `do/while`, `for`, `break`,
`continue`, `switch`, `return`. Les formulations candidates des incréments
11B à 11D ne sont pas reconnues.

## 2. Décisions d'implémentation

| Décision | Choix retenu |
|---|---|
| Grammaire de la condition | `parseCondition` du lot 10 **réutilisé sans modification**, mêmes codes, mêmes plages, mêmes budgets. Aucun profil plus permissif pour les boucles. |
| Message de condition absente | Seul écart de formulation : « Il manque la condition de la boucle. » Le paramètre est optionnel et le message historique d'`IF` (« … du bloc. ») est inchangé. |
| Enveloppe française | `translateIf` généralisé à `'IF' \| 'ELSE_IF' \| 'WHILE'` : délimiteurs, point final facultatif attaché au guillemet fermant, refus du texte supplémentaire et plages UTF-16 strictement identiques. |
| Placement | `WHILE` ajouté à la liste canonique des blocs à curseur intérieur, aux côtés de `MAIN`/`IF`/`ELSE_IF`/`ELSE`. Aucun nouvel analyseur, aucun état de boucle persistant. |
| Rattachement de branche | **Aucun changement** à `branchTarget.ts`. Un `}` de boucle ne constitue pas une fin de chaîne `if` : `ELSE`/`ELSE_IF` après une boucle est refusé, et le reconnaisseur ne remonte pas à un `if` voisin (vérifié par test). |
| Avis de calcul | `analyzeCalculations` étendu à la condition `WHILE` ; **aucun nouveau motif**. Les deux motifs du lot 8 s'appliquent dans tous les sous-arbres, y compris à droite d'un court-circuit. |
| Information pédagogique | `WHILE_PRETEST`, `severity: 'information'`, canal « C-A — Pédagogie », plage = la condition sans les guillemets, placée **avant** les informations d'opérateurs. |

### Écart assumé par rapport au contrat

Le contrat ne traite pas les **préfixes français incomplets**. Plutôt que de
laisser `Crée une boucle` retomber sur la sélection générique de règle (qui
aurait produit `UNKNOWN_FORMULATION` sur le mot « une », comparé à
`Crée la fonction principale`), l'enveloppe reconnaît le préfixe
`Crée une boucle` et émet :

| Saisie | Diagnostic |
|---|---|
| `Crée une boucle` | `INCOMPLETE_INSTRUCTION` — « Instruction incomplète : « tant que » attendu. » |
| `Crée une boucle tant` | `INCOMPLETE_INSTRUCTION` — « Instruction incomplète : « que » attendu. » |
| `Crée une boucle jusqu’à "…"` | `UNKNOWN_FORMULATION` sur « jusqu’à » |
| `Crée une boucle avec test final …` | `UNKNOWN_FORMULATION` sur « avec » |

C'est un diagnostic **plus localisé**, pas une nouvelle capacité : aucune
phrase auparavant refusée n'est désormais acceptée, et aucune phrase
auparavant acceptée ne change de sortie. Le refus de « jusqu’à » applique
explicitement la règle du §3 : transformer une condition d'arrêt en
condition de poursuite impliquerait une négation non demandée.

Les incréments 11B et 11C devront élargir ce point de reconnaissance pour
leurs propres mots (`avec test final`, `pour`), ce qui relèvera de leurs
contrats.

## 3. Fichiers modifiés

| Fichier | Nature |
|---|---|
| `src/translate.ts` | intention `WHILE`, rendu, curseur intérieur, enveloppe généralisée, aiguillage de la formulation |
| `src/condition.ts` | message de condition absente paramétrable (défaut inchangé) |
| `src/planPlacement.ts` | `WHILE` dans la liste des blocs canoniques |
| `src/calculationAdvisories.ts` | condition `WHILE` incluse dans l'analyse |
| `src/conditionInformation.ts` | code `WHILE_PRETEST` et son ordonnancement |
| `extension/src/extension.ts` | exemple de la zone de saisie |
| `extension/package.json` | description et version `0.4.0` |
| `test/loops.test.mjs` | **nouveau** — 156 tests |
| `test/vscode/suite.cjs` | 9 tests hôte ajoutés pour le lot 11A |
| `package.json` | `test/loops.test.mjs` ajouté à `npm test` |

Aucune dépendance ajoutée. Aucun instantané de compatibilité régénéré.

## 4. Résultats de tests

### Exécuté et vérifié

```
npm run check
  tsc --project tsconfig.json && tsc --project tsconfig.extension.json --noEmit
  → aucun diagnostic TypeScript

  ℹ tests 2139
  ℹ pass 2139
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
```

**2 139 tests Node réussis**, dont les 1 983 de la base du lot 10,
inchangés, et 156 nouveaux tests du lot 11A.

Couverture du nouveau fichier `test/loops.test.mjs`, suivant le §8 du
contrat : rendus exacts du §3 et comparateurs ; conservation de la phrase,
casse, accents et tabulations ; point final facultatif ; les six oracles
UTF-16 du §7 avec plages exactes ; 27 refus d'enveloppe et de condition ;
égalité des codes de refus entre `WHILE` et `IF` ; budgets 64/65 niveaux,
1 024/1 025 tokens, absence de remise à zéro entre termes logiques ;
littéral de 4 096 chiffres conservé ; placement sur six combinaisons
LF/CRLF × indentation avec curseur exact ; fichier vide, ligne blanche à
EOF, EOF occupée, huit refus de placement ; séquence complète du projet
pédagogique du §9 comparée à un document final exact ; imbrication ;
préservation du préfixe, du suffixe et des accolades ; branche refusée
après une boucle dans trois dispositions ; six falsifications du résultat
de traduction ; trois péremptions de plan ; `WHILE_PRETEST` et son
ordonnancement ; avis du lot 8 dans cinq conditions, court-circuit
compris ; parcours de session et session périmée ; sept formes non livrées
toujours refusées ; douze sorties historiques réaffirmées.

### Non exécuté — bloqué

**La suite hôte VS Code n'a pas pu être lancée.** Deux tentatives,
10:00 et 10:01 le 12 novembre 2026 :

```
checkInnoSetupMutex: vscode-updating is held, waiting up to 30s for setup to finish...
checkInnoSetupMutex: vscode-updating still held after 31017ms, giving up
Error: Code is currently being updated. Please wait for the update to complete before launching.
```

Une mise à jour de VS Code est **mise en attente sur la machine** : le
mutex Inno Setup `vscode-updating` est détenu par l'instance en cours
d'exécution, et `scripts/test-vscode.mjs` lance l'installation locale
(`%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe`). Tant que VS Code
n'a pas été redémarré pour appliquer sa mise à jour, aucun hôte de
développement ne peut démarrer.

**En conséquence :**

- Les 68 tests hôte du lot 10 **n'ont pas été reconfirmés** dans cette
  livraison ; ils restent un résultat historique.
- Les 9 tests hôte ajoutés pour le lot 11A **n'ont jamais été exécutés**.
  Ils sont écrits et versionnés, pas validés.
- Reprise attendue : redémarrer VS Code, puis `npm run test:vscode`.
  Résultat attendu, **non vérifié** : 77 tests hôte.

Ce blocage est distinct de l'élément ouvert n° 4 (`mutex already exists`,
DEP0168/N-API), qui concernait des avertissements d'un hôte **qui
démarrait**. Il s'y rattache néanmoins et doit être qualifié avec lui.

## 5. Limites, inchangées

- Aucune analyse de terminaison, de progression ou de nombre d'itérations.
  `WHILE_PRETEST` dit **quand** la condition est évaluée, rien de plus.
- Aucun avertissement « boucle infinie » ; `while (1)` est traduit
  fidèlement, sans substitution ni refus.
- Le corps n'existe pas dans la traduction de création : il n'est ni
  analysé ni évalué à partir du document.
- Aucune vérification des types, symboles ou portées : un `while` global,
  un nom absent ou un type incompatible est traduit et placé si la ligne
  est lexicalement admissible. Ces erreurs C ne sont pas des
  impossibilités de placement.
- Aucune garantie que le C produit compile ou s'exécute sans danger.
- Nuance C17 à ne pas extrapoler : une boucle sans effet observable peut
  être supposée terminante par l'implémentation (6.8.5) ; cette règle ne
  justifie aucune analyse ni transformation dans C-A.

## 6. Chantiers ouverts après le lot 11A

1. **Suite hôte VS Code non exécutable** (mise à jour en attente) — bloque
   la confirmation des 68 + 9 tests hôte.
2. Recette GCC complète du domaine « Expressions et calculs ».
3. Recette manuelle complète du lot 10, à intégrer à la recette finale du
   domaine 3.
4. Recette manuelle du lot 11A : prévision et trace pour 0, 1 et plusieurs
   tours, progression, imbrication, vérifications physiques du curseur et
   du focus.
5. Qualification des avertissements hôte `mutex already exists` et
   DEP0168/N-API.
6. Contrats 11B (`do/while`), 11C (`for`), 11D (`break`/`continue`) à
   rédiger et approuver ; aucune de ces formes n'est livrée.
