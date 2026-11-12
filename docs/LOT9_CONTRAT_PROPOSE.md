# Direction 1, domaine 3 — Décisions et répétitions ; lot 9 approuvé et implémenté

**Suivi au 6 novembre 2026 :** le porteur confirme la création d'un bloc if et l'insertion d'une instruction dans son bloc. Cela ne constitue pas une recette exhaustive. Le [lot 10 — contrat en préparation](LOT10_CONTRAT_PROPOSE.md) n'est pas implémenté ; les limitations du lot 9 décrites ici restent effectives. La recette GCC complète Expressions et calculs et la qualification mutex/N-API restent ouvertes. Le bilan automatique du §11 est daté de la livraison du 5 novembre, sans nouveau passage revendiqué par cette préparation.

**Statut au 5 novembre 2026 : contrat approuvé par le porteur et implémenté.** Le chemin historique du document est conservé. Les formulations « proposé » dans le corps gardent la trace du contrat préparatoire, désormais approuvé ; les détails de réalisation et les résultats sont au §11. Les lots 1 à 8 sont préservés. Les deux familles d'avertissements pédagogiques du lot 8 sont confirmées manuellement par le porteur ; cela ne clôt pas la [recette GCC complète des expressions et calculs](RECETTE_EXPRESSIONS_CALCULS.md). Aucune compilation ou exécution C nouvelle n'est revendiquée ; recette manuelle pédagogique du lot 9 encore ouverte. Aucun lot 10 commencé.

## 1. Référentiel du troisième domaine

Direction : algorithmique et développement logiciel en C17. Objectif : choisir et justifier le chemin d'exécution, prévoir les cas limites, construire des répétitions qui terminent et vérifier leur comportement. Les compétences sont indépendantes des paliers de liberté ; aucune règle de palier futur n'est définie ici.

Prérequis : lire les variables, types, calculs, conversions et formats des lots 1 à 8 ; savoir distinguer traduction, placement, compilation et exécution. L'ouverture documentaire du domaine 3 ne constitue pas une validation du domaine 2, dont la recette complète reste ouverte.

| Repère | Compétence et dépendances | Preuve attendue | Lot proposé |
|---|---|---|---|
| D3-C01 | Choisir entre ==, !=, <, >, <=, >= ; égalité et ordre | Prédire et justifier vrai/faux pour inférieur, égal et supérieur au seuil ; traduire chaque opérateur dans les deux sens | 9 |
| D3-C02 | Distinguer affectation et comparaison | Expliquer que = modifie une destination et que == compare ; reconnaître qu'une affectation peut être légale dans un if C, tout en étant hors grammaire C-A proposée | 9 |
| D3-C03 | Interpréter zéro/non-zéro et les résultats des comparaisons | Distinguer résultat de comparaison int 0/1 et test d'une valeur négative ou positive non nulle ; aucune hypothèse « seul 1 est vrai » | 9 |
| D3-C04 | Construire un if avec bloc explicite ; dépend de C01/C03 | Tracer condition, bloc exécuté ou ignoré, puis continuation ; remplir le bloc ultérieurement ; aucune branche ajoutée | 9 |
| D3-C05 | Maîtriser frontières et risques numériques ; réemploie le domaine 2 | Tester seuil−1, seuil, seuil+1 sur petits entiers ; expliquer conversions signé/non signé et limites de l'égalité flottante, sans tolérance universelle | 9 puis approfondissement 10 |
| D3-C06 | Composer avec &&, ||, ! ; dépend de C01–C04 | Table de vérité, priorité, parenthèses et court-circuit ; expliquer la protection d'un diviseur avant son utilisation | 10 |
| D3-C07 | Choisir branches alternatives et exclusives | Distinguer deux if indépendants de if/else ; couverture, else if, ordre des tests et rattachement du else ; tester chaque chemin | 10 |
| D3-C08 | Choisir une branche parmi des valeurs discrètes | Comparer chaîne de conditions et switch ; case, default, break et traversée des cases | Domaine visé ; contrat séparé après 10, pas automatiquement inclus |
| D3-C09 | Construire while, do/while et for ; dépend de C03/C04 | Choisir pré-test/post-test ; expliciter initialisation, condition et mise à jour ; tracer 0, 1 et plusieurs itérations | Proposition du 7 novembre : 11A–11C, à valider |
| D3-C10 | Justifier terminaison et bornes | Identifier invariant, progression et variant borné ; détecter oubli de mise à jour, débordement et erreur d'une unité ; ne pas attendre une preuve automatique de C-A | Dès 11A puis transversal, proposition non implémentée |
| D3-C11 | Contrôler une répétition sans confusion de portée | Expliquer break et continue dans la boucle concernée, y compris boucles imbriquées ; distinguer sortie de boucle et return | 11D proposé après les trois formes ; return reste au domaine fonctions |
| D3-C12 | Concevoir les tests de contrôle de flux | Tableau entrées/prévisions/chemins/observations ; tests des frontières, branches et terminaison ; distinguer observation et preuve | Transversal 9–11 |

Le découpage 9/10/11 du domaine est conservé ; les lots 9 et 10 sont livrés. La [préparation du 7 novembre](LOT11_CONTRAT_PROPOSE.md) précise quatre incréments proposés du lot 11 : while, test final do/while, clauses for, puis break/continue contextualisés. Ce sont des propositions non implémentées, nécessitant des autorisations distinctes. switch et return ne sont pas ajoutés discrètement. Les exercices potentiellement non terminants restent d'abord sur papier ; aucune preuve ou exécution de terminaison n'est ajoutée à C-A.

## 2. Objectif et frontière du lot 9

Proposition minimale : une seule nouvelle intention **IF**, une seule condition et un bloc complet vide. Les six comparateurs sont disponibles dans cette condition. Un test numérique sans comparateur est également admis pour enseigner directement zéro/non-zéro. L'apprenant choisit explicitement la valeur ou la comparaison ; C-A ne transforme pas une valeur en comparaison choisie pour lui.

Pas de else, else if, &&, ||, ! logique, ?:, boucle, switch, appel de fonction, affectation ou incrément dans la condition. Pas de contenu généré dans le bloc ; pas de point-virgule après if ou après son accolade fermante. Pas de bool, true, false ni stdbool.h ajoutés. Les comparaisons dans les anciennes affectations restent hors de leurs grammaires : ce lot ne rend pas automatiquement `Affecte à r le résultat de "a < b".` traduisible. Une intention autonome pour stocker une comparaison nécessiterait un élargissement explicite du contrat.

L'imbrication de if simples est possible par insertions explicites successives dans la ligne blanche d'un bloc, sans prise en charge de conditions composées. Aucun contrôle de symboles, de portée, de type réel, de flot global ou de terminaison.

## 3. Formulation et grammaire proposées

**Formulation unique :** `Crée un bloc si "{condition}".`

Point final facultatif et attaché au guillemet fermant, mots français fixes insensibles à la casse avec accents exigés, espaces/tabulations ordinaires entre les mots et en périphérie, une seule ligne. La condition utilise les opérateurs C, pas des synonymes français. Le contenu des guillemets est une condition, pas une chaîne C : aucun échappement de texte littéral. Les identifiants restent sensibles à la casse et suivent les validations existantes ; types de casts et suffixes suivent exactement le profil numérique du lot 7. Aucun changement du traitement des chaînes PRINT_TEXT.

Grammaire bornée conceptuelle :

```text
condition   := numérique | numérique comparateur numérique | '(' condition ')'
comparateur := '==' | '!=' | '<' | '>' | '<=' | '>='
numérique   := expression numérique du lot 7, sans comparaison ni effet de bord
```

Une seule comparaison au total. Les regroupements externes ne créent pas de nouveaux opérateurs. Les parenthèses internes aux opérandes et les casts sont admis suivant la grammaire numérique existante. Le parseur doit distinguer ces regroupements sans découpage naïf sur les caractères < ou >. Exemple accepté : `"((age + 1) >= seuil)"`. Exemple refusé : `"(a < b) == 1"`, qui contient deux comparaisons. Les chaînes `"0 < age < 100"` sont refusées comme hors contrat, pas réécrites en &&. En C elles ont une signification différente du raisonnement mathématique usuel.

Les limites proposées restent 1 024 tokens pour la condition entière et 64 niveaux cumulés de parenthèses, négations et casts sur un chemin. Les opérateurs de comparaison comptent dans le budget ; pas de budget séparé par opérande permettant de doubler la limite. Les plages AST sont absolues dans la phrase d'origine, en unités UTF-16. Nombres conservés comme textes, sans conversion JavaScript ni évaluation.

Les expressions numériques existantes (+, -, *, /, %, négation, noms, littéraux et casts) sont admises : les exclure empêcherait la réutilisation des compétences du domaine 2. Cela ne garantit ni la validité des types ni la sûreté de leur évaluation. `"absent >= 18"` reste traduisible ; `"a / 0 > 1"` reste traduisible avec avis séparé selon le motif du lot 8.

Point de vigilance pédagogique : ne pas confondre « opérandes arithmétiques admis » et « comparaison mathématique sans conversion ». Pour un exercice guidé, `-1 < 1u` est faux par conversion vers unsigned int ; aucun cast correcteur n'est ajouté. Les égalités flottantes comparent les valeurs représentées, pas les nombres décimaux idéaux : ne pas promettre un résultat universel à partir du seul affichage ou fabriquer une tolérance. Les pointeurs, chaînes, appels et valeurs spéciales hors grammaire numérique actuelle ne sont pas de nouveaux paramètres du lot 9.

## 4. Sorties C17 exactes proposées

Dans les exemples suivants, le commentaire reprend la phrase exactement. Le fragment de traduction utilise LF, une ligne intérieure contenant quatre espaces, et un LF terminal.

```c
// Crée un bloc si "age == 18".
if (age == 18) {
    
}
```

| Condition saisie | Première ligne du code, hors commentaire |
|---|---|
| `age == 18` | `if (age == 18) {` |
| `age != 18` | `if (age != 18) {` |
| `age < 18` | `if (age < 18) {` |
| `age > 18` | `if (age > 18) {` |
| `age <= 18` | `if (age <= 18) {` |
| `age >= 18` | `if (age >= 18) {` |
| `actif` | `if (actif) {` |
| `0` | `if (0) {` |
| `-2` | `if ((-2)) {` |
| `age + 1 >= seuil` | `if ((age + 1) >= seuil) {` |
| `(double) total / nombre > 2.5` | `if ((((double) total) / nombre) > 2.5) {` |
| `((age >= 18))` | `if (age >= 18) {` |

Rendu déterministe : les opérandes et les tests numériques utilisent le rendu parenthésé existant. Une comparaison est rendue gauche/opérateur/droite, protégée par les parenthèses obligatoires du if. Les regroupements externes redondants sont conservés dans les plages d'origine, sans duplication dans le C ; leur retrait ne change pas la sémantique. Il n'y a jamais d'évaluation ou de simplification d'une comparaison constante. Chaque ligne du tableau reçoit le même bloc complet vide et son commentaire original.

Les comparateurs produisent un int valant 0 ou 1 ; if teste zéro/non-zéro, y compris une valeur négative. `=` est une affectation C, pas une autre écriture de `==` ; elle peut être légale dans un if écrit manuellement mais reste volontairement hors de cette grammaire. Voir [comparaisons](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Numeric-Comparisons.html) et [if](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/if-Statement.html), documentation GNU, pour ces règles communes au C17. Les extensions GNU ne sont pas admises par ce contrat.

## 5. Blocs, placement et curseur

À la préparation, le placement n'accordait un traitement intérieur spécial qu'à MAIN (`isMain` dans planPlacement). Appliquer son chemin « instruction simple » à IF aurait été incorrect : l'indentation intérieure n'aurait pas suivi indentUnit et le curseur serait allé après le bloc. L'adaptation ciblée MAIN/IF est maintenant réalisée, sans déduction depuis les accolades du document.

Proposition : réutiliser la notion de fragment canonique avec curseur relatif. MAIN et IF sont les deux structures reconnues à ligne intérieure vide. La vérification par retraduction reste obligatoire : un objet reçu ne peut pas injecter un faux bloc ou un curseur arbitraire. Pas de framework de gabarits ni analyse d'accolades du document.

Règles exactes proposées :

1. Le curseur doit rester sur une ligne entièrement blanche ; remplacer uniquement cette ligne et son éventuelle fin de ligne, comme actuellement. Une ligne contenant du C ou un commentaire est refusée, même à EOF.
2. Soit B le texte d'indentation complet de la ligne cible et U l'indentUnit explicite fourni par l'intégration. Commentaire, if et accolade fermante reçoivent B ; la ligne intérieure reçoit B + U. Aucun calcul depuis les accolades existantes.
3. Le curseur final va après B + U sur la ligne intérieure. Pas de ligne de saisie ajoutée après le bloc ; aucun code existant après la cible n'est absorbé dans le if.
4. Une instruction suivante remplace cette ligne intérieure et conserve la fermeture existante. Une instruction simple laisse sa ligne de saisie intérieure ordinaire, sans accumulation de lignes blanches. Un if imbriqué reçoit la même règle, avec sa propre fermeture.
5. Pour continuer après le if, l'étudiant déplace le curseur ou crée lui-même une ligne blanche après la fermeture. Aucun déplacement automatique de code déjà présent.
6. Conserver les choix locaux LF/CRLF, le repli EOL, les refus du préfixe lexical (commentaire ouvert, continuation, trigraphes, directive non prise en charge), les frontières UTF-16 et la validation d'aperçu périmé. La fin de fichier avec ligne blanche sans EOL reste admissible ; une fin de fichier occupée reste refusée.
7. Un seul fragment, une seule édition et une seule annulation par confirmation ; l'insertion du bloc puis de son contenu est constituée de confirmations et annulations distinctes.

Sans analyseur C, un if en portée globale, un nom absent, un type inadapté ou un document à accolades déséquilibrées ne sont pas refusés pour une raison sémantique. L'insertion peut être documentairement sûre et le programme incorrect. Aucun contrôle de portée de variable créée dans le bloc ; cette contrainte du C doit être enseignée, pas réparée silencieusement.

## 6. Diagnostics proposés et intervalles

Toujours un diagnostic bloquant français prioritaire, category understanding, sans code ni fragment partiel. Réutiliser les codes historiques quand la situation est identique ; les noms nouveaux ci-dessous sont proposés, pas disponibles aujourd'hui. Aucun choix automatique d'opérateur ni liste de réponses à sélectionner au hasard.

| Code proposé ou existant | Message de référence | Plage [début, fin), UTF-16 |
|---|---|---|
| MISSING_CONDITION | Il manque la condition du bloc. | Intervalle vide avant le point final éventuel ou, pour une condition vide/blanche délimitée, juste avant le guillemet fermant |
| MISSING_CONDITION_DELIMITER | La condition doit être entourée de guillemets ASCII. | Point où le guillemet ouvrant est attendu, après les séparateurs |
| UNTERMINATED_CONDITION | Il manque le guillemet fermant de la condition. | Du guillemet ouvrant à la fin utile de la saisie, sans retirer un point situé dans la condition non fermée |
| ASSIGNMENT_IN_CONDITION | L'opérateur = effectue une affectation ; aucune affectation n'est prise en charge dans cette condition. | Le = fautif ; ne pas remplacer par == |
| MISSING_OPERAND, existant | Il manque un opérande. | Intervalle vide devant le token fautif, ou à la fin utile de la condition |
| MISSING_OPERATOR, existant | Il manque un opérateur. | Intervalle vide devant le token inattendu, suivant le comportement historique des expressions |
| CHAINED_COMPARISON | Une seule comparaison est prise en charge dans cette condition. | Deuxième comparateur entier, même s'il est dans des parenthèses |
| UNSUPPORTED_CONDITION_OPERATOR | Cet opérateur n'est pas pris en charge dans les conditions du lot 9. | Opérateur entier : &&, ||, !, +=, ++, ?: séparément, etc. |
| MISSING_CLOSING_PARENTHESIS / UNEXPECTED_CLOSING_PARENTHESIS | Messages historiques conservés | Absence vide à la fin de condition ; parenthèse surnuméraire sur son caractère |
| INVALID_IDENTIFIER / C_KEYWORD_IDENTIFIER / diagnostics numériques | Messages et règles historiques | Token complet dans la phrase, sans décalage dû aux guillemets |
| EXPRESSION_TOO_COMPLEX, existant | Message historique conservé | Token qui dépasse le budget, sans produire un AST partiel applicable |
| UNEXPECTED_TEXT / INVALID_SEPARATOR | Messages historiques conservés | Suffixe hors commande / séparateur fautif ; aucune seconde instruction acceptée |

Exemples d'oracles UTF-16 (chaînes exactement telles qu'écrites, sans espaces périphériques) :

| Saisie | Attendu proposé |
|---|---|
| `Crée un bloc si` | MISSING_CONDITION [15,15) |
| `Crée un bloc si "".` | MISSING_CONDITION [17,17) |
| `Crée un bloc si "age >".` | MISSING_OPERAND [22,22) |
| `Crée un bloc si "age = 18".` | ASSIGNMENT_IN_CONDITION [21,22) |
| `Crée un bloc si "age >= 18` | UNTERMINATED_CONDITION [16,26) |
| `Crée un bloc si "âge >= 18".` | INVALID_IDENTIFIER [17,20) |
| `Crée un bloc si "A😀B > 0".` | INVALID_IDENTIFIER [17,21) ; le token entier contient deux unités pour 😀 |

Priorité proposée : restrictions monolignes et sûreté du commentaire ; reconnaissance des mots fixes ; présence et fermeture des délimiteurs ; refus de suffixe ; analyse bornée de gauche à droite. Un opérateur hors contrat est signalé lorsqu'il est rencontré, même si l'opérande précédent est incomplet. Après une première comparaison, un second comparateur déclenche CHAINED_COMPARISON. Les plages des avis sont indépendantes des diagnostics et restent celles des AST acceptés. Les positions ne sont ni des indices d'octets ni des graphèmes ; ne pas couper une paire de substitution dans un token refusé.

Les diagnostics de placement et d'intégration restent inchangés et distincts. Aucun message du moteur ne prétend être un diagnostic GCC. Aucune mise en évidence graphique nouvelle n'est promise par l'InputBox native.

## 7. Avis pédagogiques et architecture minimale envisagée

Conserver translate, planPlacement et validatePlan purs, sans VS Code, E/S ou dépendance supplémentaire. Ajouter une petite analyse de condition bornée et un rendu déterministe ; ne pas élargir silencieusement les profils des expressions historiques. AST proposé : IF avec parameters.condition ; Condition = numeric-test(expression: NumericExpression) ou comparison(operator, left, right), avec range absolue. Aucun AST du contenu du bloc : ce contenu reste dans le document courant.

La comparaison et le test numérique ne nécessitent ni table des symboles ni calcul de valeur. Le lexer peut reconnaître les comparateurs avec priorité aux tokens à deux caractères ; les morceaux numériques conservent les règles existantes. Les budgets sont communs, et les regroupements/casts doivent être analysés explicitement. La réalisation utilise un parseur de condition isolé reprenant les règles lexicales numériques, sans modification des parseurs historiques ; les types d’AST numériques et leur rendu sont réutilisés. Ce choix préserve les anciens diagnostics ; une évolution future des profils devra être vérifiée explicitement dans les deux branches.

Étendre l'analyse locale du lot 8 pour parcourir les expressions numériques de la condition IF avec exactement les mêmes motifs, codes, messages, classifications, plages et ordre. Le traitement des instructions historiques reste identique. `"7 / 0 > 1"` donne INTEGER_ZERO_DIVISOR non bloquant ; `"7 % 0.0 == 0"` donne FLOAT_REMAINDER_OPERAND. Le corps futur du bloc n'est pas analysé : il n'existe pas dans la traduction du if. Aucun nouveau conseil automatique sur « condition toujours vraie », égalité flottante ou conversion signé/non signé : ces notions sont enseignées sans prétendre disposer des types ou d'une évaluation générale. Aucun avis n'autorise à conclure qu'une condition est sûre.

L'extension conserve saisie, diff intégral, confirmation, contrôle de péremption, retour au curseur et canal passif « C-A — Pédagogie ». Adaptations limitées au catalogue/aide et aux tests du curseur multiligne et des avis. Aucune interface persistante ni intégration GCC.

## 8. Tests automatisés du lot 9

| Groupe | Scénarios et oracles |
|---|---|
| Traduction | Six comparateurs ; zéro, positif, négatif et nom seuls ; formats exacts du §4 ; regroupements, casts, entiers énormes et flottants inchangés ; point/casse/tabulations ; source/commentaire exacts ; sérialisation et déterminisme |
| Refus total | Condition absente/vide, guillemets manquants, opérande absent à gauche/droite, = non corrigé, comparaison chaînée ou imbriquée, &&/||/!, appels, ++, virgule, ?:, code injecté et suffixes ; aucun fragment |
| Unicode et limites | Accents précomposés/décomposés, noms astraux et unités isolées, espaces interdits ; plages originales ; 1 024/1 025 tokens et 64/65 niveaux globaux, y compris deux opérandes et casts |
| Placement | IF vide en document vide puis à l'intérieur de MAIN ; espaces/tabulations et indentUnit ; lignes occupées ; EOF avec/sans EOL ; LF/CRLF ; conservation exacte préfixe/suffixe ; curseur dans la ligne intérieure |
| Séquences | MAIN → IF → deux instructions ; deux IF indépendants ; IF imbriqué ; aucune concaténation, fermeture ajoutée, absorption de suffixe ni accumulation de lignes ; insertion après fermeture choisie manuellement |
| Canonique | Fragment, AST, commentaire, curseur et code falsifiés refusés ; plan périmé refusé ; aucun rendu réparateur |
| Avis | Motifs du lot 8 dans le test seul et les deux opérandes, y compris casts traversés ; classement, plages et tri inchangés ; traduction/placement inchangés par les avis ; aucune analyse du document |
| Non-régression | Préserver les 1 659 tests Node et 53 hôte rapportés au lot 8, dont sorties historiques ; seuls les tests négatifs sur une formulation nouvellement autorisée seraient explicitement actualisés |
| Hôte futur | Document non enregistré, diff exact, annuler/rétablir bloc puis contenu séparément, confirmations répétées, fermeture cible, curseur/options modifiés, erreurs distinctes, aperçu périmé, avis non bloquants et focus conservé |

Ces critères ont été automatisés selon le bilan du §11 ; leur réussite ne constitue pas une recette pédagogique ou une simulation du clavier physique. Les contrôles manuels du focus/curseur, raccourci, accents et IME restent distincts. Les avertissements hôte mutex/N-API restent à qualifier ; leur résolution n'est pas affirmée.

## 9. Projet pédagogique de validation proposé

**Rapport de seuils d'un capteur à valeurs fixées**, sans saisie interactive. L'apprenant crée explicitement stdio.h, MAIN et `mesure` de type int, puis six blocs : mesure == 20, != 20, < 20, > 20, <= 20 et >= 20. Dans chaque bloc, il insère ultérieurement un affichage explicite du libellé, terminé par un \n explicitement saisi. Il compare le rapport prévu et observé pour 19, 20 et 21, en modifiant lui-même l'initialisation.

Ajouter un entier `actif`, puis le bloc `Crée un bloc si "actif".` et un affichage à l'intérieur. Répéter avec 0, 1 et -2. Les six if sont indépendants : plusieurs messages peuvent être affichés, et aucune branche else n'est créée. Sur papier, prédire aussi les 0/1 produits par chacune des six comparaisons ; leur stockage n'est pas une nouvelle capacité du lot 9.

Preuves d'acquisition : choisir seul les six comparateurs ; réussir et justifier les trois cas autour de la borne ; expliquer =/== et zéro/non-zéro ; placer au moins deux instructions dans un bloc ; expliquer l'instruction suivant la fermeture et la portée locale d'une variable ; distinguer if indépendants et alternative future ; reconnaître un diagnostic bloquant et un avis non bloquant. Une démonstration de placement avec tabulation ou CRLF complète la recette produit, mais ne mesure pas à elle seule la compréhension algorithmique.

L'enseignant demande enfin une prévision écrite avant observation et l'explication d'un écart éventuel. Les deux risques du lot 8 sont étudiés dans un fichier séparé sans exécution. Les comparaisons signé/non signé et flottantes sont des exercices guidés de raisonnement : ne pas ajouter de cast, seuil ou tolérance choisi par C-A.

La future validation manuelle peut compiler ce petit programme sûr avec GCC C17, à l'initiative de l'utilisateur. Aucun appel GCC n'est implémenté ou exécuté pendant cette préparation ; cette validation du lot 9 ne clôturerait pas rétroactivement la recette du domaine 2. Consigner environnement, prévision, sortie, chemin parcouru et statut par scénario, sans inventer de résultat actuel.

## 10. Décisions approuvées par le porteur

1. Une intention IF, formulation `Crée un bloc si "{condition}".`, six comparateurs et test numérique direct ; aucune affectation de résultat comparatif ni modification des grammaires historiques.
2. Réutilisation des expressions numériques du lot 7 dans les opérandes ; une seule comparaison globale, regroupements externes admis, budgets globaux 1 024/64 ; exclusions et sorties parenthésées du §4.
3. Bloc complet vide, curseur intérieur et adaptation ciblée du placement canonique MAIN/IF ; aucune déduction depuis les accolades ni insertion automatique après fermeture.
4. Diagnostics et plages proposés, extension des seuls motifs d'avis du lot 8 aux conditions ; aucun nouvel avertissement automatique ni correction de =.
5. Projet de seuils et critères d'acquisition ; découpage 9/10/11 conservé, éventuelle subdivision de 11 discutée à son contrat. Ouverture de la préparation du domaine 3 sans clôture de la recette GCC du domaine 2.

Après validation seulement : types/parseur et diagnostics ; traduction et tests exacts ; placement multiligne et invariants ; avis ; tests des sessions et de l'hôte ; recette pédagogique. Chaque étape doit rester testable indépendamment de VS Code lorsque possible.

## 11. Bilan d'implémentation du lot 9 — 5 novembre 2026

Livré : IF et son AST dédié dans src/condition.ts ; enveloppe de traduction dans src/translate.ts ; placement intérieur limité aux structures canoniques MAIN/IF ; parcours des expressions de condition par les motifs existants de calculationAdvisories ; aide de saisie actualisée. Les parseurs src/expression.ts et src/numericExpression.ts, les types numériques historiques et le contrôleur de session ne sont pas modifiés. Aucun ajout de dépendance ni analyse globale de C.

Résultats observés : **1 847 tests Node réussis, 61 tests hôte VS Code Windows 1.96.4 réussis, 0 échoué, 0 ignoré ; TypeScript sans diagnostic**, soit 1 908 tests réussis. Les 1 659 tests Node et 53 hôte précédents sont conservés sans actualisation de leurs assertions. test/condition.test.mjs ajoute 188 tests ; test/vscode/suite.cjs ajoute huit scénarios hôte. Commandes : `npm.cmd run check` ; `npm.cmd run test:vscode` avec VSCODE_EXECUTABLE si nécessaire vers l'hôte bureau installé/portable.

Les nouveaux tests couvrent aussi l'absence d'absorption du suffixe du document, les deux niveaux d'annulation bloc/contenu, les fichiers non enregistrés, l'aperçu intégral exact, les refus sans modification, la fraîcheur, les fragments altérés et les avis non bloquants. Les diagnostics documentaires UTF-16 sont testés, y compris l'intervalle vide du MISSING_OPERATOR historique. Un point séparé après une demande sans condition (`Crée un bloc si .`) ne respecte pas la ponctuation attachée : il déclenche MISSING_CONDITION_DELIMITER, sans traduction partielle.

L'hôte portable isolé émet de nouveau « Error mutex already exists » et DEP0168/N-API ; rapport 61/0, sans timeout de test. Leur résolution ou attribution à C-A n'est pas affirmée. Les tests acceptent les vrais widgets via les commandes natives, sans simuler les touches physiques. Aucune nouvelle recette manuelle du lot 9, GCC C17 ou macOS/Linux n'est revendiquée. La recette GCC complète du domaine 2 reste ouverte, tout comme l'acquisition pédagogique du domaine 3.

Limites : une comparaison globale au plus ; opérateurs logiques, affectations dans la condition, else et boucles refusés ; symboles/types réels/portées non analysés ; ligne cible blanche et restrictions lexicales antérieures conservées ; aucun stockage de comparaison dans les commandes d'affectation historiques. Aucun lot 10 commencé.
