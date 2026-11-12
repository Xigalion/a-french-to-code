# C-A — Direction 1 : contrat approuvé du lot 6

Date : 23 octobre 2026. **Statut : contrat approuvé par le porteur et implémenté.** Nom de fichier historique conservé pour les liens. [Protocole de recette manuelle](RECETTE_LOT6.md).

Références : [documentation fondatrice](A_DOCUMENTATION_FONDATRICE.md), [vision](A-phase1/docs/VISION.md), [spécifications actuelles](A-phase1/docs/SPECIFICATIONS.md), [décisions](A-phase1/docs/DECISIONS.md).

## 1. Direction et dimensions indépendantes

Direction officielle : **Algorithmique et développement logiciel en C17**. Objectif final : concevoir, développer, compiler, tester, déboguer et maintenir un logiciel modulaire et fiable.

Référentiel initial, évolutif et sans calendrier imposé : fondations et premiers programmes ; expressions et calculs ; décisions et répétitions ; fonctions et décomposition ; tableaux, chaînes et pointeurs ; structures et mémoire dynamique ; fichiers et modularité ; algorithmes et structures de données ; fiabilité et maîtrise avancée. Les tests et les risques pertinents accompagnent chaque étape.

Les compétences décrivent ce que l'apprenant sait réaliser et expliquer. Les paliers de liberté décrivent les décisions qu'il choisit de déléguer. À capacités prises en charge identiques, tous les paliers doivent permettre les mêmes résultats. Le lot 6 concerne uniquement le palier 1 ; aucune configuration ou règle des paliers futurs.

## 2. Compétences précises et prérequis

Prérequis : demander explicitement stdio.h et main ; déclarer et initialiser un entier ; distinguer nom et valeur ; affecter une valeur ; afficher en décimal ; suivre saisie, aperçu et confirmation ; sauvegarder puis compiler/exécuter manuellement un petit programme avec GCC C17.

| Compétence | Preuve attendue |
|---|---|
| Identifier opérateur, opérandes et résultat | Annoter une expression et nommer ses sous-expressions |
| Additionner, soustraire et multiplier | Prédire et vérifier des calculs positifs, nuls et négatifs |
| Distinguer quotient entier et reste | Expliquer 17 / 5 = 3 et 17 % 5 = 2, puis des exemples négatifs |
| Lire les priorités et l'associativité | Expliquer pourquoi 2 + 3 * 4 et (2 + 3) * 4 diffèrent |
| Utiliser les parenthèses | Traduire un regroupement voulu sans changer le problème |
| Réutiliser des variables | Calculer à partir de valeurs existantes et mettre à jour un résultat |
| Tester un calcul | Écrire les résultats attendus avant l'exécution, comparer et expliquer un écart |
| Reconnaître les limites pertinentes | Expliquer pourquoi un diviseur nul ou un résultat non représentable pose problème |

La maîtrise ne se réduit pas à obtenir une sortie correcte ou à recopier une phrase.

## 3. Périmètre approuvé

Une nouvelle instruction d'affectation d'expression entière ; une cible explicitement nommée ; une expression composée de littéraux décimaux, noms, opérateurs + - * / %, négation unaire et parenthèses. Les instructions existantes suffisent pour créer les variables, afficher les résultats et demander les en-têtes.

Projet : **calculatrice d'entiers à données fixées dans le programme**, modifiables entre deux exécutions. Ni lecture clavier, menu, boucle, condition, fonction supplémentaire, flottant, conversion de type, appel de fonction, tableau, pointeur, opérateur composé ni expression dans une instruction d'affichage. Une calculatrice interactive nécessitera des compétences ultérieures.

Pas de contrôle d'existence, d'initialisation ou de type des variables ; pas d'analyse du document C, d'évaluation des calculs, de simplification constante ou de réparation. Les littéraux restent des chaînes exactes, sans conversion JavaScript en Number et sans hypothèse de int sur 32 bits. Les exercices utilisent des valeurs représentables dans int et des opérations définies. A ne garantit pas cela pour une saisie arbitraire.

## 4. Formulation et sorties C17

**Formulation approuvée unique :**

`Affecte à {nom} le résultat de "{expression}".`

Les guillemets ASCII délimitent une expression utilisant les opérateurs du C ; ils ne génèrent aucune chaîne C. Une traduction réussie ne garantit ni compilation ni exécution valide. Aucun échappement ni contenu textuel n'est admis à l'intérieur. La destination, le calcul et l'affectation sont explicitement demandés. La syntaxe symbolique des expressions prépare directement la lecture du C.

Un fragment primary ; commentaire exact ; LF terminal structurel ; aucun saut de ligne affiché ni autre ajout. La sortie parenthèse chaque opération selon l'arbre analysé, afin de rendre le regroupement visible ; elle ne choisit pas un autre calcul.

| Saisie | Code hors commentaire et LF terminal |
|---|---|
| Affecte à resultat le résultat de "a + b". | `resultat = (a + b);` |
| Affecte à resultat le résultat de "a - b". | `resultat = (a - b);` |
| Affecte à resultat le résultat de "a * b". | `resultat = (a * b);` |
| Affecte à quotient le résultat de "a / b". | `quotient = (a / b);` |
| Affecte à reste le résultat de "a % b". | `reste = (a % b);` |
| Affecte à resultat le résultat de "2 + 3 * 4". | `resultat = (2 + (3 * 4));` |
| Affecte à resultat le résultat de "(2 + 3) * 4". | `resultat = ((2 + 3) * 4);` |
| Affecte à resultat le résultat de "20 / 3 / 2". | `resultat = ((20 / 3) / 2);` |
| Affecte à resultat le résultat de "-7 / 3". | `resultat = ((-7) / 3);` |
| Affecte à resultat le résultat de "-(a + b)". | `resultat = (-(a + b));` |
| Affecte à resultat le résultat de "-a". | `resultat = (-a);` |
| Affecte à resultat le résultat de "a * -b". | `resultat = (a * (-b));` |
| Affecte à compteur le résultat de "compteur + 1". | `compteur = (compteur + 1);` |
| Affecte à resultat le résultat de "a". | `resultat = a;` |

Mots fixes insensibles à la casse, accents exigés sans normalisation, noms conservés et validés selon le catalogue actuel. Espaces ordinaires/tabulations facultatifs entre tokens de l'expression ; nécessaires lorsqu'ils séparent deux éléments lexicaux. Les séparateurs interdits restent interdits, y compris entre guillemets. Point final facultatif, attaché au guillemet fermant. Aucun changement des règles des anciennes instructions.

Variantes envisagées mais non recommandées pour ce lot : ajouter une initialisation avec expression ou des phrases « Ajoute ... ». Elles multiplieraient les formulations sans être nécessaires à la calculatrice. Aucune extension de « Affecte la valeur ... à ... » : ses diagnostics historiques restent inchangés.

## 5. Grammaire, priorité et parenthésage

```text
expression = somme
somme      = produit { ("+" | "-") produit }
produit    = unaire { ("*" | "/" | "%") unaire }
unaire     = "-" unaire | primaire
primaire   = entier | nom | "(" expression ")"
entier     = "0" | chiffre_non_nul { chiffre }
```

Les nombres n'ont ni zéro initial, suffixe, séparateur, exposant ni autre base. Le signe moins est un opérateur dans cette nouvelle grammaire : -0 y est accepté comme expression et produit (-0), sans modifier le refus historique du littéral -0. Le plus unaire est hors périmètre. Les séquences contiguës ++ et -- sont refusées comme opérateurs non pris en charge ; `a - -b` est accepté et produit `(a - (-b))`. Les produits implicites et noms collés à un nombre sont refusés, sans découpage opportuniste de 12age en deux opérandes.

Priorités : regroupements explicites, négation, puis * / %, puis + -. Les opérateurs binaires d'un même groupe s'associent à gauche ; les négations à droite. Les parenthèses purement redondantes peuvent disparaître du code canonique ; le commentaire reste intact. Espaces uniques autour des opérateurs binaires, aucun autour du moins unaire.

Ces règles définissent le regroupement, pas un ordre général d'évaluation des opérandes en C. Le lot exclut les effets de bord dans les expressions, hormis l'affectation finale explicitement demandée.

La division entière tronque vers zéro : -7 / 3 donne -2, -7 % 3 donne -1. Le reste n'est pas un pourcentage ni nécessairement un modulo mathématique positif. Pour un quotient représentable et un diviseur non nul, a = (a / b) * b + a % b. Diviseur nul et quotient non représentable rendent / et % indéfinis ; le dépassement signé n'est pas un bouclage garanti. Références techniques : [WG14 N1570, §6.5, §6.5.3, §6.5.5 et §6.5.6](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf) (projet C11 public, référence de ces règles du C) et [rectificatif WG14 DR 415](https://www.open-std.org/jtc1/sc22/wg14/www/docs/dr_415.htm).

**Politique approuvée :** `10 / 0`, `10 % 0` ou un calcul susceptible de dépasser les limites restent traduisibles s'ils sont syntaxiquement valides. Aucun diagnostic pédagogique du traducteur ne prétend les rendre sûrs. Ils servent à expliquer les limites ; les essais d'exécution d'acceptation excluent les comportements indéfinis. Une analyse sémantique éventuelle ferait l'objet d'un autre contrat.

## 6. Incomplétudes et diagnostics approuvés

Un seul diagnostic structuré prioritaire, category understanding, severity error, intervalle [start,end) UTF-16 dans la phrase originale. Aucun code, fragment, plan applicable ou proposition de réponse pour une instruction incomplète. Aucune fermeture automatique de parenthèse, ajout d'opérande ou remplacement d'opérateur.

Ordre : contrôles lexicaux communs ; analyse de la nouvelle enveloppe de gauche à droite jusqu'à l'expression ; présence du guillemet fermant ; analyse de l'expression de gauche à droite ; suffixe « point facultatif » et refus du texte restant. Une absence de guillemet fermant est prioritaire sur une erreur interne d'expression. Une absence d'opérande avant une parenthèse fermante est prioritaire sur une parenthèse ouvrante non refermée.

| Situation | Code | Message exact | Intervalle |
|---|---|---|---|
| Destination absente après Affecte à | INCOMPLETE_INSTRUCTION | Il manque le nom du résultat. | Vide au point d'absence |
| Nom invalide ou mot-clé C17 | Codes historiques | Messages historiques | Nom entier |
| Expression non fournie / guillemets vides | MISSING_EXPRESSION | Il manque l’expression à calculer. | Vide à l'emplacement attendu / dans les guillemets |
| Guillemet ouvrant attendu mais absent | MISSING_EXPRESSION_DELIMITER | Il manque le guillemet ouvrant de l’expression. | Vide au début du contenu présent |
| Guillemet fermant absent | UNTERMINATED_EXPRESSION | Il manque le guillemet fermant de l’expression. | Du guillemet ouvrant à la fin utile |
| "a +", "* a", "()", "a + )" | MISSING_OPERAND | Il manque un opérande. | Vide avant le token fautif ou le guillemet fermant |
| "a b", "2 (a + 1)" | MISSING_OPERATOR | Il manque un opérateur. | Vide avant le second élément |
| "(a + b" | MISSING_CLOSING_PARENTHESIS | Il manque une parenthèse fermante. | Vide avant le guillemet fermant |
| "a + b)" | UNEXPECTED_CLOSING_PARENTHESIS | Cette parenthèse fermante n’a pas de parenthèse ouvrante. | Parenthèse fautive |
| ==, **, ++, --, etc. | UNSUPPORTED_EXPRESSION_OPERATOR | Cet opérateur n’est pas pris en charge. | Séquence opérateur entière |
| Décimal non entier, 020, 0x10, 12age, caractère interdit | INVALID_EXPRESSION_TOKEN | Cet élément n’appartient pas à une expression entière prise en charge. | Élément entier, caractère astral sur deux unités |
| Mot fixe ou suffixe incorrect | UNKNOWN_FORMULATION / UNEXPECTED_TEXT | Messages historiques | Première divergence / suffixe entier |

Un opérande nommé suit les mêmes règles d'identifiant et de mots-clés C17 que la cible. Les contrôles d'espaces restent globaux. `a + * b` relève de MISSING_OPERAND avant *, tandis que ** est reconnu comme séquence non prise en charge. Les guillemets typographiques ne remplacent pas les délimiteurs ASCII.

Pour borner l'analyse : 1 024 tokens d'expression et 64 niveaux cumulés de parenthèses/négations imbriquées ; EXPRESSION_TOO_COMPLEX, « Cette expression dépasse les limites de complexité prises en charge. », sur le premier token qui dépasse la limite. Ces bornes sont approuvées, sans réglage public. Les espaces ne comptent pas comme tokens ; un littéral entier reste un token quelle que soit sa longueur.

## 7. Tests d'acceptation techniques

1. Sorties exactes du tableau, AST conforme, sérialisation déterministe, un fragment et commentaire intégral ; conservation des très grands littéraux sous forme de chaînes.
2. Tous les opérateurs, priorités et associations : 2 + 3 * 4 → 14 ; (2 + 3) * 4 → 20 ; 20 / 3 / 2 → 3 ; 20 / (3 / 2) → 20 ; 10 - 3 - 2 → 5 ; 10 - (3 - 2) → 9 ; négation de groupe et double négation espacée.
3. Division/reste avec les signes : 7 / 3 → 2, 7 % 3 → 1 ; -7 / 3 → -2, -7 % 3 → -1 ; 7 / -3 → -2, 7 % -3 → 1. Zéro comme dividende, diviseur de valeur 1/-1 avec petits opérandes représentables.
4. Variables réutilisées, cible égale à un opérande, noms syntaxiquement valides absents du document, majuscules/minuscules conservées ; tous les mots-clés C17 refusés.
5. Chaque diagnostic avec message, code et plage exacts ; absences aux différents préfixes ; espaces finaux ; point facultatif ; guillemets et parenthèses manquants ; tabulations, accents décomposés, caractère astral et demi-surrogate ; absence de suggestions et de fragments ; priorités des erreurs multiples.
6. Refus des appels f(a), affectations internes, comparaisons, opérateurs composés, chaînes et échappements, virgules, commentaires C, suffixes d'injection, ponctuation doublée, multiplication implicite et formats numériques exclus. Bornes de complexité : juste en dessous, à la limite, juste au-dessus, sans exception interne.
7. Non-régression de tous les résultats et diagnostics historiques, notamment Affecte la valeur ..., INIT_INT, PRINT_TEXT, PRINT_FORMATTED et les ambiguïtés la/le/en ; aucun élargissement silencieux d'une ancienne instruction.
8. Placement LF/CRLF, indentation et curseur successif inchangés ; contrôle canonique refusant AST, code ou commentaire altéré ; aucun en-tête, déclaration, main, sauvegarde ou conversion ajouté.
9. Sessions : instruction incomplète sans aperçu applicable ; jeton antérieur invalidé ; correction possible puis aperçu et confirmation obligatoires. Tests dans l'hôte VS Code avec fichiers/profil isolés et aucun parcours nouveau.
10. Typecheck, tests Node et hôte VS Code existants plus les nouveaux cas ; recette manuelle GCC C17 de la calculatrice à opérations définies. Aucun ajout de compilation automatique à C-A.

Le bilan automatisé de livraison figure dans SPECIFICATIONS.md et DECISIONS.md. La recette manuelle reste distincte et ne doit pas être déclarée réussie avant observation.

## 8. Projet de synthèse et acquisition

L'apprenant crée explicitement stdio.h, main, a=17, b=5 et les variables de résultat. Il demande successivement somme, différence, produit, quotient et reste, puis les affiche en décimal. Les séparateurs et fins de ligne sont demandés par les instructions de texte existantes. Attendus : 22, 12, 85, 3, 2. Il compare ensuite a + b * 3 (32) et (a + b) * 3 (66), puis répète avec de petites valeurs négatives.

Il sauvegarde et compile manuellement avec GCC -std=c17 -Wall -Wextra, exécute et confronte les sorties à son tableau prévu. Le lot ne remplace pas cet apprentissage par une commande de compilation intégrée.

Compétence acquise lorsqu'il sait, sans recopier un corrigé : décomposer un problème en calculs ; choisir la destination ; prévoir les résultats de cas nouveaux ; expliquer priorité, associativité, parenthèses, quotient et reste ; réutiliser des variables ; corriger une expression incomplète à partir du seul manque signalé ; comparer résultat prévu et résultat observé ; expliquer les limites de représentabilité et le diviseur nul. Une seconde série de valeurs et un problème de regroupement différent vérifient le transfert. Il doit pouvoir lire le C produit et justifier chaque opération.

## 9. Architecture et fichiers du lot livré

Un petit analyseur d'expression indépendant, sans analyseur C complet, eval, exécution ou dépendance supplémentaire. Lexer avec offsets UTF-16 absolus ; AST de littéraux, noms, négations et opérations binaires ; analyse descendante selon la grammaire ; exigences du palier 1 ; génération C parenthésée depuis l'AST ; diagnostics centralisés. Les exigences futures pourront évoluer séparément, sans rendre l'AST dépendant d'un palier.

Nouvelle intention : ASSIGN_EXPRESSION, paramètres { name, expression: AST }. Les nœuds portent leurs plages source. Les anciens types INIT_INT/ASSIGN_INT et leurs paramètres restent inchangés. Les littéraux restent textuels. translate(text) conserve son API et ses résultats translated/rejected. La branche nouvelle est sélectionnée par le préfixe Affecte à ; Affecte la valeur reste historique. Le placement retraduit déjà la source pour contrôler le résultat canonique et ne nécessite pas de nouvel algorithme.

| Fichier | Mise en œuvre |
|---|---|
| src/expression.ts (nouveau) | Tokens, AST, analyse, limites et rendu d'expression pur |
| src/translate.ts | Nouvelle branche, intention, exigences et diagnostics |
| test/expression.test.mjs (nouveau) | Priorités, grammaire, plages, rendu et limites |
| test/arithmetic.test.mjs (nouveau) | Traductions et intégration au placement |
| test/lot5-compatibility.json (nouveau) | 55 résultats capturés avant modification, complémentaires aux 182 cas historiques existants |
| test/session.test.mjs | Refus sans insertion et péremption des jetons |
| test/vscode/suite.cjs | Recette du parcours natif avec calculs |
| package.json | Inclusion des nouvelles suites dans la commande de test, sans dépendance |
| Documentation fondatrice, VISION.md, SPECIFICATIONS.md, DECISIONS.md | Mise à jour des capacités seulement après livraison validée |
| docs/RECETTE_LOT6.md (nouveau) | Protocole manuel VS Code et GCC, résultats non présumés |

Placement, widgets et contrôleur de production VS Code, .vscode/tasks.json et installation VS Code personnelle inchangés.

## 10. Décisions approuvées par le porteur

1. Lot limité à l'affectation d'expressions et à une calculatrice non interactive.
2. Formulation unique avec expression entre guillemets ASCII ; syntaxe symbolique et négation unaire ; variantes françaises supplémentaires reportées.
3. Priorités du C, génération parenthésée, -0 propre aux expressions et refus des séquences ++/--.
4. Analyse syntaxique seulement : pas de refus sémantique automatique de division par zéro ou de dépassement.
5. Messages, codes, priorités, plages et bornes de complexité approuvés.
6. Critères d'acquisition et recette manuelle GCC séparée.

Les écarts documentaires ouverts sont consignés dans DECISIONS.md. Aucune décision détaillée du palier 3 n'est inventée. Les lots 6 et 7 sont implémentés conformément à leurs approbations distinctes. La branche du lot 6 reste inchangée ; la recette complète du domaine est prévue après le lot 8, dont le développement n'est pas engagé.

Bilan de livraison : **1 186 tests Node réussis, 36 tests hôte VS Code Windows 1.96.4 réussis, 0 échec, 0 ignoré ; contrôle TypeScript sans diagnostic**. GCC non accessible dans le terminal de développement utilisé lors de cette livraison, donc aucune nouvelle compilation C17 revendiquée dans ce bilan.

Mise à jour lors de la préparation du lot 7 : le porteur confirme manuellement l'addition entre variables, la priorité des opérations et les parenthèses explicites. La recette reste partielle ; sa validation complète sera regroupée avec celle du domaine Expressions et calculs à la fin du lot 8. Cette mise à jour n'élargit ni la grammaire ni l'implémentation du lot 6.
