# Phase 2 — audit architectural de C-A

**Pour qui :** le fondateur, pour décider si l'architecture peut porter un
second langage, et à quel prix.

> Tous les chiffres viennent de `node --experimental-strip-types
> scripts/audit-architecture.mjs` (→ `MESURES.md`) et des deux sondes
> exécutées, `experiences/python/` et `experiences/souplesse/`. **Aucun n'est
> écrit de mémoire.**
>
> Branche de travail : `phase-2-architecture`. `main` reste la référence
> publique, intacte.
>
> Date : 17 novembre 2026.

---

## 1. Le résultat en une page

| Mesure | Valeur |
|---|---|
| moteur `src/` | **5 745 lignes**, 30 modules |
| hôte `extension/` | 634 lignes, et **0 module de `src/` n'importe `vscode`** |
| **tout le rendu C** | **198 lignes**, 84 cas, dans une seule fonction |
| modules sans une seule trace de C dans leurs chaînes | **11**, soit 964 lignes |
| placement (9 modules) | **1 154 lignes**, soit **20 %** du moteur, et **tout repose sur les accolades** |
| diagnostics | 69 codes : **22** parlent de la phrase, **47** nomment une notion du langage cible |
| informations pédagogiques | 67, **toutes** des leçons de C17 |
| intentions | 84 : 17 communes, 37 adaptables, 6 de structure, **24 propres à C** |
| tests | 3 834, dans 35 fichiers, 11 194 lignes |

**La bonne nouvelle est structurelle et mesurée : écrire du C ne représente
que 198 lignes sur 5 745.** L'analyse du français, le noyau d'expressions,
les budgets, les intervalles, les refus de forme et la machine à états de
l'hôte ne savent rien du C.

**La mauvaise nouvelle est tout aussi structurelle : le placement, 20 % du
moteur, repose entièrement sur `{` et `}`.** Un langage à blocs indentés n'a
pas ces jetons — ce n'est pas une adaptation, c'est un second module.

### Preuve, pas conviction

La sonde `experiences/python/` rend du Python **depuis l'AST de C-A, sans
modifier une ligne de `src/`**. Un programme de 23 phrases françaises du
catalogue, inchangées, a été rendu en Python, **exécuté par `python3`**, et
sa sortie est conforme au résultat calculé à la main avant exécution :

    36
    12.00
    admis
    134

Sur les 84 intentions, **37 se rendent en Python sans rien inventer** et
**47 sont refusées avec une raison nommée**. Ces 47 refus sont le vrai
livrable de l'expérience : chacun est une décision de contrat à prendre.

## 2. Les quatre classes de composants

### 2.1 Indépendants du langage cible — réutilisables tels quels

| Composant | Lignes | Pourquoi il ne sait rien du C |
|---|---|---|
| `expressionCore.ts` | 564 | tokeniseur, descente récursive, budgets, intervalles. Les opérateurs viennent d'un **enregistrement de capacités**, pas du langage |
| `expression.ts`, `numericExpression.ts`, `condition.ts` | 160 | enveloppes minces des profils ; **zéro trace de C** dans leurs chaînes |
| `characterLiteral.ts`, `stringLiteral.ts`, `elementDesignation.ts` | 232 | scanners bornés de littéraux et de désignations |
| `calculationAdvisories.ts` | 96 | avertissements de calcul : division par zéro, reste flottant — **des faits d'arithmétique**, pas de C |
| `branchTarget.ts`, `loopTarget.ts`, `switchTarget.ts` | 407 | reconnaisseurs **de forme** ; ils dépendent des accolades, pas du C (voir 2.4) |
| machine à états de l'hôte (`session.ts`) | 181 | saisie → aperçu → confirmation → insertion : aucun rapport avec le langage produit |

**Total brut réutilisable : environ 1 640 lignes**, dont 964 sans la moindre
trace de C.

### 2.2 Spécifiques à C17 — à écrire pour chaque langage

| Composant | Mesure | Nature |
|---|---|---|
| la fonction `render` de `translate.ts` | **198 lignes**, 84 cas, 151 motifs de syntaxe C | **le seul endroit où du C est écrit** |
| les 24 intentions propres à C | 24 / 84 | pointeurs (6), mémoire (5), en-têtes et gardes (6), prototype et liaison (2), `char` déclaré, `do/while`, `break` d'aiguillage, synonyme de type, `sizeof` (2) |
| les 67 informations pédagogiques | 659 lignes | **toutes** nomment une notion de C17 : bornes de tableau, terminateur nul, `realloc` qui déplace, `NDEBUG`… |
| les 47 diagnostics qui nomment une notion du langage | 47 / 69 | `UNSUPPORTED_POINTER_ARRAY_FIELD`, `RETURN_NEEDS_VALUE`, `STRING_REQUIRES_CHAR`… |

### 2.3 Réutilisables après adaptation

| Composant | Ce qui change |
|---|---|
| les **enveloppes françaises** par domaine (`numericInstructions`, `arrayInstructions`, `characterInstructions`, `fileInstructions`…), ~1 500 lignes | la **phrase** reste, la **table des types** change : `int`/`double`/`char` n'ont pas la même liste en Python. L'analyse de la phrase est réutilisable, la table de types ne l'est pas |
| les 37 intentions **adaptables** | même concept, autre forme : déclaration, formats d'affichage, ouverture de fichier |
| `statementScope.ts` (84 genres partitionnés) | la **question** — « cette instruction peut-elle figurer ici ? » — est universelle ; la **réponse** dépend du langage : Python admet du code à la portée module, C non |
| les 22 diagnostics de forme de phrase | réutilisables mot pour mot : `UNKNOWN_FORMULATION`, `INVALID_INTEGER`, `UNEXPECTED_TEXT`, `INCOMPLETE_INSTRUCTION` |

### 2.4 Fortement couplés — à restructurer

| Composant | Lignes | Le couplage |
|---|---|---|
| `enclosingStructures.ts` | 196 | **balaye les accolades** pour classifier le contexte. C'est le cœur du placement, et il n'a aucun sens en Python |
| `planPlacement.ts` | 312 | planifie une insertion **ligne blanche + accolades**, et retraduit pour comparer |
| `placementLexical.ts` | 118 | inspection du préfixe lexical : commentaires, chaînes, directives `#` |
| `functionContext.ts` | 89 | retrouve la fonction englobante **par les accolades**, et lit son type de retour |
| les 4 reconnaisseurs de cible | 407 | dépendent du balayage ci-dessus |
| `translate.ts` lui-même | 857 | **mélange** l'analyse de la phrase (659 lignes) et le rendu C (198 lignes) dans un seul fichier |

**Deux dettes de structure, mesurées :**

1. **le rendu n'est pas un module.** Il est une fonction au milieu de
   l'analyseur. L'extraire est mécanique — 198 lignes et une interface — mais
   c'est un préalable à tout second langage ;
2. **les trois profils ne publient pas le même AST.** La sonde Python l'a
   découvert en échouant : le profil entier nomme son littéral `integer`, le
   profil numérique `literal`. Deux noms pour une même idée, et tout rendu
   devra traiter les deux.

## 3. Les 84 intentions, par portabilité

| Classe | Nombre | Part | Ce que cela veut dire |
|---|---|---|---|
| **commune** | 17 | 20,2 % | le concept existe dans tout langage impératif enseigné : affectation, retour, appel, `break` |
| **adaptable** | 37 | 44,0 % | le concept existe, la forme change : déclaration, formats d'affichage, fichiers, structures |
| **structure** | 6 | 7,1 % | le concept existe, mais sa **pose** dépend de la syntaxe de blocs : `if`, `else`, `while`, `for`, `else if`, définition de fonction |
| **propre à C** | 24 | 28,6 % | rien à porter, et le forcer ailleurs serait une faute |

**28,6 % des intentions ne doivent PAS être portées.** C'est le chiffre le
plus important de cet audit : il dit que le socle commun doit permettre à un
langage de **refuser** une intention, et non la simuler.

La sonde Python le confirme par l'autre bout : 47 des 84 refusées, dont les
raisons se rangent en quatre familles.

| Famille | Exemples | Ce qu'il faut en faire |
|---|---|---|
| le concept **n'existe pas** | pointeurs, `sizeof`, `malloc`, en-têtes, gardes, `do/while` | refus définitif, nommé, documenté |
| le concept existe mais **exigerait d'inventer** | `Déclare un entier nommé n.` → Python écrirait `n = 0` et inventerait ce 0 ; `Déclare un tableau … de dimension 3` → inventerait un remplissage | refus, **conforme à la règle 3** |
| le mot est le même, **le sens diffère** | `switch`/`match` (pas de traversée), `for` (trois clauses contre itérable), `/` (tronque contre flottant) | **décision de contrat**, jamais un rendu silencieux |
| la **convention** remplace la règle | `main` est une convention Python ; la créer sans l'appeler laisse un programme inerte, l'appeler serait un ajout implicite | décision de contrat |

### Trois faux amis que la sonde a rendus visibles

1. **`print` de Python ajoute un saut de ligne.** La règle « aucun séparateur
   n'est ajouté » impose donc `print(x, end="")` partout. Le rendu *évident*
   aurait violé une règle fondamentale, en silence.
2. **`/` entre entiers tronque en C et produit un flottant en Python.** Le
   même texte ne dit pas la même chose : la sonde **refuse** plutôt que de
   choisir.
3. **La flèche n'a pas de forme Python.** Écrire `p.x` pour `p->x`
   substituerait une forme à une autre — ce que la règle 2 interdit.

## 4. Estimation du travail pour ajouter Python

### 4.1 Ce qui se réutilise sans y toucher

| Acquis | Mesure | Confiance |
|---|---|---|
| analyse du français et AST | **toute la chaîne**, prouvée par la sonde sans modifier `src/` | **mesurée** |
| noyau d'expressions, budgets, intervalles | 564 lignes + 160 d'enveloppes | **mesurée** |
| 22 diagnostics de forme de phrase | 22 / 69 | mesurée |
| machine à états de l'hôte, aperçu, confirmation | 634 lignes | haute : l'hôte ne connaît que du texte |
| harnais : différentiel, dictée, liens, pré-publication, catalogue généré | ~1 500 lignes de scripts | haute |
| **souplesse linguistique** | sonde complète, 20 cas conformes | mesurée |

### 4.2 Ce qu'il faut écrire

| Chantier | Volume estimé | Base de l'estimation |
|---|---|---|
| extraire le rendu C en module dédié (chemin proposé : `src/langages/c17/`) | ~250 lignes déplacées, 0 nouvelle | les 198 lignes mesurées, plus l'interface |
| unifier le littéral des trois profils | ~30 lignes, et un différentiel | la divergence `integer`/`literal` trouvée par la sonde |
| rendu Python | **~300 lignes** | la sonde en fait 37 intentions en 230 lignes, refus compris |
| table des types et des formats Python | ~80 lignes | `ANNOTATIONS` de la sonde, à compléter |
| **placement par indentation** | **~500 à 700 lignes** | les 1 154 lignes du placement C, dont ~40 % de logique de forme réutilisable |
| portée des instructions en Python | ~100 lignes | `statementScope` fait 84 lignes pour C |
| 30 à 40 informations pédagogiques Python | ~250 lignes | 67 informations pour C en 659 lignes |
| catalogue Python généré et vérifié | ~150 lignes d'outillage | le catalogue C existe déjà |
| tests du langage Python | **~1 500 à 2 000 lignes** | 11 194 lignes pour C, mais 37 intentions et non 84 |
| exercice de clôture Python, compilé et exécuté | ~300 lignes | l'exercice C fait 101 instructions |
| **décisions de contrat** | 47 refus à instruire, dont ~12 non triviaux | la liste de la sonde, nominative |

**Total : de l'ordre de 3 500 à 4 500 lignes à écrire**, dont **la moitié de
tests**, pour un périmètre de **37 intentions sur 84** — soit un Python
nettement plus pauvre que le C actuel, et c'est normal : 24 intentions sont
propres à C, et 10 autres demandent des phrases nouvelles que Python mérite
(parcours d'itérable, listes, dictionnaires).

### 4.3 En lots, l'unité du projet

| Lot | Contenu | Risque |
|---|---|---|
| **P0** | extraire le rendu, unifier les littéraux, **aucune capacité nouvelle** | **le seul lot qui touche `src/`** : différentiel obligatoire, 0 régression exigée |
| **P1** | socle multilangage : registre de langages, refus nommé par intention non portée | faible : rien n'est encore rendu |
| **P2** | placement par indentation, sans aucune intention | **le plus risqué** : c'est une réécriture, pas une adaptation |
| **P3** | les 17 intentions communes en Python, exécutées | faible |
| **P4** | les 20 adaptables retenues, décisions de contrat écrites | moyen : 12 décisions non triviales |
| **P5** | informations pédagogiques Python | moyen : elles portent la valeur pédagogique |
| **P6** | exercice de clôture Python, exécuté, et campagne de validation | faible |

**Sept lots**, dont un seul touche le moteur existant. À la cadence des lots
26 à 32 — un lot livré avec contrat, tests, différentiel et bilan — cela
représente un chantier comparable au **domaine 5 entier** (lots 13 à 18).

### 4.4 Ce que cette estimation ne dit pas

- elle suppose **37 intentions**, pas 84 : un Python au périmètre du C
  demanderait des phrases que ce document ne conçoit pas ;
- elle ne compte **aucune décision pédagogique** : les 47 refus sont listés,
  pas tranchés, et douze demandent un arbitrage du fondateur ;
- elle ne couvre pas un **troisième** langage : le socle est conçu pour, mais
  tant qu'un seul autre langage existe, toute généralisation reste une
  hypothèse. La deuxième incarnation prouve l'architecture ; la troisième
  prouve la généralité.

## 5. Interface VS Code

| Constat | Conséquence |
|---|---|
| **0 module de `src/` n'importe `vscode`** | la séparation tient : l'hôte est remplaçable, le moteur est testable sans éditeur |
| la commande est `enablement`-conditionnée à `editorLangId == c` | une ligne de manifeste par langage, plus une table |
| l'aperçu, la confirmation, l'édition unique annulable | **aucun rapport avec le langage** : réutilisés tels quels |
| le canal « C-A — Pédagogie » | réutilisé ; son contenu change avec le langage |
| la dictée et les 99 tests hôte | réutilisables ; les scénarios citent du C et seront à doubler |

**L'hôte est le composant le mieux préparé au multilangage**, et ce n'est pas
un hasard : la règle « `src/` n'importe jamais `vscode` » a produit l'effet
inverse de celui qu'on en attendait d'abord. Elle protégeait le moteur ; elle
a surtout rendu l'hôte indifférent au moteur.
