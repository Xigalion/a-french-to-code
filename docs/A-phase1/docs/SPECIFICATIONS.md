# A — Spécifications fonctionnelles V1

**État au 7 novembre 2026 :** lots 1 à 10 autorisés et implémentés : seize intentions. Conditions composées, branches au curseur contrôlé et informations pédagogiques passives sont livrées. Sorties historiques préservées. **Lot 11 — découpage et contrat du premier incrément en préparation, sans autorisation d'implémentation.** Deux gestes du lot 9 confirmés ; recette lot 10 ouverte, à intégrer à la recette finale du domaine 3. La recette GCC complète Expressions et calculs et la qualification mutex/N-API restent ouvertes. Interface persistante et intégration GCC hors périmètre.

La [documentation fondatrice](../../A_DOCUMENTATION_FONDATRICE.md) présente le projet et sa première direction, Algorithmique et développement logiciel en C17. Les compétences du parcours sont indépendantes des paliers de liberté : le palier ne restreint pas les résultats réalisables dans les capacités prises en charge. Les mentions historiques « niveau 1 » désignent le palier de liberté actuel. Le [contrat du lot 6](../../LOT6_CONTRAT_PROPOSE.md) est approuvé et implémenté ; son nom de fichier historique est conservé pour les liens. La [recette manuelle](../../RECETTE_LOT6.md) reste distincte des tests automatiques.

Le [contrat du lot 7 — Types numériques et conversions](../../LOT7_CONTRAT_PROPOSE.md) est approuvé et implémenté, avec quatre intentions nouvelles et des profils distincts préservant les lots 1 à 6. Le porteur confirme trois acquis manuels du lot 6 : addition entre variables, priorité et parenthèses explicites. Le lot 8 est désormais livré ; la recette complète du domaine Expressions et calculs reste à effectuer, sans étendre ces confirmations partielles.

A désigne le projet global ; **C-A** désigne son premier traducteur pour C17. Les fichiers C restent des `.c`. Le moteur du lot 1 retourne du texte : il ne crée aucun fichier.

## Lot 8 — approuvé et implémenté le 3 novembre 2026

Le [contrat approuvé](../../LOT8_CONTRAT_PROPOSE.md) ajoute deux motifs d'avis locaux : diviseur littéralement nul et opérande directement flottant de `%`. Le résultat canonique de traduction, les diagnostics historiques et le placement restent inchangés. Les avis sont structurés avec plages UTF-16, séparés et non bloquants, sans correction ni analyse globale. La division entière par zéro est distinguée de la violation de contrainte `%` flottant ; les garanties optionnelles flottantes ne sont pas présumées. Le champ Warning et la confirmation présentent le résumé ; le canal passif « C-A — Pédagogie » conserve les avis par aperçu sans ouverture automatique.

La [recette complète finale](../../RECETTE_EXPRESSIONS_CALCULS.md) couvre les lots 6 à 8 : synthèse sûre avec GCC manuel et étude sans exécution des calculs indéfinis. Elle reste à effectuer. Le [bilan du lot 8](../../LOT8_BILAN.md) rapporte **1 659 tests Node réussis, 53 tests hôte réussis, 0 échoué**, contrôle TypeScript sans diagnostic. Les suites historiques sont conservées. Les avertissements mutex/N-API ont réapparu et restent ouverts ; ni résolution ni blocage définitif n'est affirmé. Aucun nouvel essai GCC revendiqué ; l'ouverture documentaire du domaine 3 ne clôt pas cette recette.

## Domaine 3 — lot 9 approuvé et implémenté

Le [contrat du lot 9](../../LOT9_CONTRAT_PROPOSE.md) a introduit IF : `Crée un bloc si "{condition}".`, six comparateurs et tests numériques directs, avec bloc complet vide et curseur intérieur. Sa limitation initiale d'une comparaison globale est remplacée par la composition logique du lot 10 ; les comparaisons chaînées restent refusées. Les limites communes restent 1 024 tokens et 64 niveaux. Les avis calcul sont conservés dans les sous-expressions. Bilan historique du lot 9 : **1 847 tests Node + 61 hôte réussis, 0 échec** ; le bilan courant du lot 10 figure ci-dessous. Le [tableau de progression](../../A_DOCUMENTATION_FONDATRICE.md#9-comment-choisir-les-prochaines-fonctionnalités) distingue livraison et recettes manuelles encore ouvertes.

## Lot 10 — approuvé et implémenté

Le [contrat du lot 10](../../LOT10_CONTRAT_PROPOSE.md) définit la grammaire logique et ELSE_IF/ELSE : un bloc complet vide à une ligne blanche immédiatement après une chaîne bracée reconnue. Curseur contrôlé exclusivement ; aucune sélection non vide, réécriture d'accolades ni instruction déplacée. Les informations &&/||/! sont passives et distinctes des avertissements du lot 8, conservés sans analyse de protection. La confirmation identifie la racine par sa ligne et son en-tête ; un seul edit annulable, sans redirection de cible. Bornes documentaires : 1 048 576 unités UTF-16, 50 000 tokens, 128 niveaux et 64 branches résultantes ; limites de condition communes 1 024 tokens/64 niveaux. Bilan : **1 983 tests Node + 68 hôte réussis, 0 échec, TypeScript sans diagnostic**. [Recette manuelle à effectuer](../../RECETTE_LOT10.md). Aucun lot 11 engagé ; recette GCC du domaine 2 et mutex/N-API toujours ouverts.

## Lot 11 — proposition documentaire, aucune boucle implémentée

Le [découpage et contrat du premier incrément](../../LOT11_CONTRAT_PROPOSE.md) proposent 11A while, 11B do/while, 11C for, puis 11D break/continue avec preuve contextuelle limitée. Le premier réutiliserait Condition du lot 10 et le placement de structure complète, sans déduire initialisation, progression ou terminaison. Les formulations et informations pédagogiques proposées ne font pas partie du catalogue actuel. Les seize intentions des lots 1 à 10 restent les seules disponibles. Le plan de tests et le projet de validation sont à approuver ; aucun résultat applicatif nouveau n'est revendiqué. Les trois suivis ouverts sont rappelés dans la matrice de recette finale du domaine 3, sans clôture de recette GCC.

## 1. Contrat validé
Français contrôlé vers C17 ; GCC pour compilation et diagnostics. Le fichier commence vide. Toute fonction et tout ajout d'en-tête sont explicitement demandés. Une fonction demandée reçoit ses accolades complètes, sans return implicite.

Une phrase reconnue est traduite fidèlement, même si le programme est incorrect. A ne répare pas les erreurs de programmation. Une phrase non reconnue ne produit aucune insertion partielle. Le curseur fixe la cible ; une insertion documentaire non sûre est refusée et expliquée. A ne développe pas d'analyseur C17 complet.

L'aperçu précède Entrée et présente toutes les modifications. Les phrases restent en commentaires ; aucune modification manuelle n'est écrasée automatiquement. Compilation et exécution restent distinctes par défaut.

**Les §2 à §4 et les contrats des lots 9–10 décrivent les seize intentions implémentées. Fonctions ordinaires, blocs autonomes, retours, boucles et formulation combinée « avec stdio.h » restent hors catalogue. L'arithmétique suit les profils historiques des lots 6 et 7 ; les conditions possèdent leur grammaire propre.**

## 2. Grammaire implémentée
Une seule phrase monoligne. Les mots fixes sont insensibles à la casse, comparés par mise en minuscules Unicode sans normalisation des accents ; les accents restent exigés. Le point final est facultatif et doit, s'il est présent, être directement attaché au dernier mot ou paramètre. Un seul point est permis. Aucune autre ponctuation finale n'est acceptée.

Un ou plusieurs espaces ordinaires U+0020 ou tabulations U+0009 séparent les mots ; ils sont également admis en périphérie et ignorés pour l'analyse. Hors contenu littéral, retours à la ligne et autres caractères d'espacement reconnus par JavaScript (dont espace insécable, séparateurs de ligne Unicode et BOM) sont refusés. Aucun synonyme, correction d'accent ou variante « grâce à ».

La saisie originale est conservée dans le commentaire. Les diagnostics utilisent des intervalles [début, fin) en unités UTF-16 dans cette saisie ; une absence peut être localisée par un intervalle vide. La normalisation d'espaces ne doit pas fausser ces positions.

Un accent précomposé occupe généralement une unité UTF-16 ; un caractère astral en occupe deux. Un accent décomposé n'est pas normalisé et peut rendre un mot fixe non reconnu. Les diagnostics signalent le token invalide complet, sans promettre une position par graphème visuel. Les paramètres nom/entier excluent les caractères invisibles, contrôles et demi-surrogates. Le contenu littéral Unicode suit le §3. CRLF est refusé dès CR : un seul diagnostic prioritaire est retourné.

- `{nom}` et `{fonction}` : `[A-Za-z][A-Za-z0-9_]*`, sensibles à la casse, hors mots-clés C17. Les noms commençant par un soulignement sont hors grammaire minimale. Les collisions avec les noms existants ne sont pas corrigées.
- `{entier}` : `0` ou `-?[1-9][0-9]*`. Pas de signe +, zéro initial, virgule, expression ou nombre écrit en lettres. Reproduction exacte du littéral, sans conversion ni hypothèse de int sur 32 bits. Représentabilité et conversions relèvent de GCC et de la cible.

Un nom syntaxiquement valide mais non déclaré reste traduisible. Un paramètre hors grammaire provoque un refus de compréhension.

## 3. Catalogue implémenté : seize intentions
Le point final est facultatif. Chaque instruction produit un fragment primary unique, précédé du commentaire exact, avec un LF terminal dans le moteur de traduction. Ce LF de structure ne signifie pas un saut de ligne affiché.

| ID | Formulation | Code produit, hors commentaire |
|---|---|---|
| MAIN | « Crée la fonction principale. » | int main(void) { puis ligne intérieure puis } |
| IF | « Crée un bloc si "{condition}". » | `if ({condition rendue}) {` puis ligne intérieure puis `}` ; voir contrat du lot 9 |
| ELSE_IF | « Ajoute une branche sinon si "{condition}". » | `else if ({condition rendue}) {` puis ligne intérieure puis `}` ; rattachement obligatoire |
| ELSE | « Ajoute une branche sinon. » | `else {` puis ligne intérieure puis `}` ; rattachement obligatoire |
| DECL_INT | « Déclare un entier nommé {nom}. » | int {nom}; |
| INIT_INT | « Crée un entier nommé {nom} de valeur {entier}. » | int {nom} = {entier}; |
| ASSIGN_INT | « Affecte la valeur {entier} à {nom}. » | {nom} = {entier}; |
| ASSIGN_EXPRESSION | « Affecte à {nom} le résultat de "{expression}". » | `{nom} = {expression parenthésée};` |
| NUMERIC_DECL | « Déclare une variable de type {type} nommée {nom}. » | `{type} {nom};` |
| NUMERIC_INIT | « Crée une variable de type {type} nommée {nom} avec le résultat de "{expression}". » | `{type} {nom} = {expression parenthésée};` |
| NUMERIC_ASSIGN | « Affecte à {nom} le résultat numérique de "{expression}". » | `{nom} = {expression numérique parenthésée};` |
| NUMERIC_PRINT | Décimal non signé ou notation fixe/scientifique avec précision explicite | `%u` ou `%.{p}f` / `%.{p}e` |
| INCLUDE_STDIO | « Inclue la bibliothèque stdio.h. » | `#include <stdio.h>` |
| PRINT_INT | « Affiche la valeur de {nom}. » | printf("%d", {nom}); |
| PRINT_FORMATTED | Trois formulations exactes ci-dessous | Format explicitement demandé |
| PRINT_TEXT | « Affiche le texte "{texte}". » | printf("%s", "{texte échappé}"); |

Les affichages n'ajoutent aucun retour à la ligne. PRINT_INT ne vérifie ni existence ni type du nom ; son format reste %d. Aucun en-tête n'est ajouté à un affichage. stdio.h est un nom sensible à la casse, écrit sans chevrons ni guillemets dans la commande ; aucun autre en-tête n'est reconnu.

### Types numériques et conversions — lot 7

Les nouvelles formulations sont définies dans le contrat approuvé. Types demandables : int, unsigned int, float, double. La déclaration n'initialise pas automatiquement. L'initialisation emploie une expression délimitée par des guillemets ASCII qui ne génèrent aucune chaîne C. Une affectation emploie la branche distincte « résultat numérique » ; « résultat de » conserve exactement le profil entier du lot 6, ses résultats et ses diagnostics.

Les types dans la phrase française sont insensibles à la casse et rendus en minuscules. Dans les casts, les mots-clés C sont en minuscules exactes ; typedef et types hors périmètre ne sont pas devinés. Les littéraux décimaux peuvent porter u/U ou f/F selon leur grammaire ; exposants e/E avec signe optionnel admis, formes .5 et 1. admises. Les lexèmes restent exacts, y compris les grands littéraux. Ni suffixe, type, cast ni format n'est ajouté implicitement. Les conversions normales de C17 restent applicables.

Toute opération et tout cast est parenthésé : `7 / 2` → `(7 / 2)` ; `7.0 / 2` → `(7.0 / 2)` ; `(double) 7 / 2` → `(((double) 7) / 2)` ; `(double) (7 / 2)` → `((double) (7 / 2))`. Une conversion après une division entière ne refait pas la division. Aucun calcul, table de symboles ou contrôle de type/existence/initialisation/plage n'est introduit. Une traduction réussie ne garantit pas une exécution correcte ; une conversion flottant vers entier hors plage peut avoir un comportement indéfini.

Formats : « Affiche {nom} en décimal non signé. » → `printf("%u", {nom});` ; « Affiche {nom} en notation fixe avec {p} décimales. » → `printf("%.{p}f", {nom});` ; notation scientifique → `printf("%.{p}e", {nom});`. Précision obligatoire : entier ASCII de 0 à 20, sans zéro initial sauf 0, stocké textuellement. Aucun défaut 6, format libre, cast ou retour affiché ajouté. Un argument float est promu en double par le C pour printf ; la précision d'affichage ne garantit pas la précision de stockage. Le format ne convertit pas un argument int en double.

Bornes : 1 024 tokens et 64 niveaux cumulés de parenthèses, négations et casts. Un cast compte pour un niveau ; ses parenthèses et mots de type sont comptés comme tokens (unsigned int = deux mots). Un littéral avec exposant signé reste un token. Diagnostic sur le premier token au-delà de la borne. Le profil entier et son comptage sont inchangés.

Codes ajoutés : MISSING_NUMERIC_TYPE, UNSUPPORTED_NUMERIC_TYPE, MISSING_CAST_CLOSING_PARENTHESIS, INCOMPLETE_NUMERIC_LITERAL, UNSUPPORTED_NUMERIC_LITERAL, MISSING_DISPLAY_PRECISION, INVALID_DISPLAY_PRECISION. Codes et messages historiques sont réutilisés lorsqu'applicables ; INVALID_EXPRESSION_TOKEN parle d'« expression numérique » dans le nouveau profil et conserve son message entier dans l'ancien. Les plages sont [start,end) UTF-16 dans la saisie exacte ; aucune suggestion de formulation ou liste de réponses ; aucun fragment en cas de refus. Les préfixes nouveaux et leurs incomplétudes sont les seules extensions de reconnaissance.

API : NUMERIC_DECL {type,name}, NUMERIC_INIT {type,name,expression}, NUMERIC_ASSIGN {name,expression}, NUMERIC_PRINT {name,format:'unsigned'} ou {name,format:'fixed'/'scientific',precision}. AST numérique : literal {value,range}, name {name,range}, negation {operand,range}, cast {type,operand,range}, binary {operator,left,right,range}, chacun avec kind. src/numericExpression.ts porte le profil indépendant ; src/numericInstructions.ts porte enveloppes, exigences et diagnostics. L'API translate(text), le placement et les contrôleurs de production VS Code restent inchangés.

Le laboratoire de représentation prévoit des inclusions **manuelles et explicites** de limits.h et float.h dans le programme C. Le catalogue de la commande Inclue reste stdio.h seul ; aucun nouvel en-tête automatique ou commande d'introspection n'est ajouté. Mesures sizeof/limites/précision dépendantes de la cible. Les tailles usuelles IEEE ne sont pas des garanties générales du contrat C17.

### Expressions entières — lot 6

Formulation unique : `Affecte à {nom} le résultat de "{expression}".` Les guillemets ASCII délimitent une expression utilisant les opérateurs du C ; ils ne génèrent aucune chaîne C. Exemples : `-a` → `(-a)` ; `-(a + b)` → `(-(a + b))` ; `a * -b` → `(a * (-b))` ; `2 + 3 * 4` → `(2 + (3 * 4))`. Chaque opération est entièrement parenthésée. Les parenthèses redondantes de la saisie peuvent disparaître du code ; le commentaire reste exact.

Grammaire : somme de produits ; produits d'expressions unaires ; négation unaire ou primaire ; primaire = littéral décimal, nom ou expression parenthésée. Priorité négation, puis * / %, puis + -. Les opérateurs binaires de même priorité s'associent à gauche. Nombres : 0 ou [1-9][0-9]*, conservés en chaînes ; - est un opérateur. -0 est donc accepté ici, sans modifier les règles des anciens littéraux. Plus unaire et opérateurs ++/-- contigus exclus. `a - -b` est accepté ; `a--b` est refusé. Pas de produit implicite, appel, effet de bord interne, conversion, flottant ou autre base. Les espaces/tabulations peuvent séparer les tokens. Les règles communes de casse, accents, identifiants, séparateurs et point final restent applicables.

Analyse purement syntaxique, sans évaluation, simplification, table des symboles ni contrôle de type, initialisation, représentabilité ou existence. `10 / 0` et `10 % 0` restent traduisibles. **Une traduction réussie ne garantit ni compilation ni exécution valide.** Aucun en-tête, variable, main, conversion ou contrôle automatique n'est ajouté. Compilation et exécution restent manuelles.

Bornes : **1 024 tokens d'expression**, opérateurs et parenthèses compris, espaces exclus ; **64 niveaux cumulés de parenthèses et négations imbriquées**. Les chaînes binaires ne consomment pas cette profondeur. Un très grand littéral reste un seul token. Le premier token qui dépasse une borne reçoit EXPRESSION_TOO_COMPLEX : « Cette expression dépasse les limites de complexité prises en charge. » Sa plage est entière, dans la phrase originale.

Les dix nouveaux codes sont MISSING_EXPRESSION, MISSING_EXPRESSION_DELIMITER, UNTERMINATED_EXPRESSION, MISSING_OPERAND, MISSING_OPERATOR, MISSING_CLOSING_PARENTHESIS, UNEXPECTED_CLOSING_PARENTHESIS, UNSUPPORTED_EXPRESSION_OPERATOR, INVALID_EXPRESSION_TOKEN, EXPRESSION_TOO_COMPLEX. Leurs messages et plages sont définis dans le contrat du lot 6. Aucun choix ni réponse complète n'est proposé. Refus sans instruction, fragment ou code partiel ; intervalles [start,end) UTF-16 absolus. Un guillemet fermant absent est prioritaire sur une erreur interne ; l'analyse de l'expression précède le suffixe. Les contrôles lexicaux communs restent prioritaires. La limite est contrôlée à la lecture du token ; une erreur syntaxique antérieure reste prioritaire.

src/expression.ts contient lexer, AST, analyse bornée et génération ; src/translate.ts porte l'enveloppe et les exigences du palier 1. AST : integer {value,range}, name {name,range}, negation {operand,range}, binary {operator,left,right,range}, chacun avec kind. Les plages d'un nœud regroupé incluent ses parenthèses. ASSIGN_EXPRESSION porte {name,expression:AST}. La branche Affecte à est distincte de Affecte la valeur. Les anciennes sorties et diagnostics restent inchangés, hors formulations inconnues désormais reconnues. Le placement vérifie le nouvel AST par retraduction canonique, sans nouvel algorithme.

### Formats explicites et pédagogie du niveau 1 — lot 5

| Formulation exacte | Sortie C17 hors commentaire et LF terminal |
|---|---|
| Affiche {nom} en décimal. | `printf("%d", {nom});` |
| Affiche {nom} en hexadécimal. | `printf("%x", {nom});` |
| Affiche {nom} en octal. | `printf("%o", {nom});` |

PRINT_FORMATTED porte `{ name, format: 'decimal' | 'hexadecimal' | 'octal' }`. Les règles communes du §2 restent applicables. Aucun format libre, synonyme, correction d'accent, normalisation Unicode, conversion, préfixe 0x, saut de ligne affiché, en-tête ou fragment supplémentaire. Aucun contrôle d'existence ou de type. PRINT_INT conserve exactement son ancienne structure et sa traduction %d, par compatibilité ; le modèle pédagogique privilégié devient explicite.

L'analyse partielle reste interne : reconnaissance de l'intention, vérification des exigences du niveau 1, génération uniquement après validation et construction centralisée des diagnostics. L'API translate(text) reste inchangée. TranslationResult ajoute uniquement le type d'instruction et les codes ci-dessous. Ni configuration publique ni comportement des niveaux futurs. Le niveau 2 pourra assouplir les exigences ; ses choix ne sont pas implémentés. Le niveau 3 sera défini séparément.

Priorités : les branches historiques Affiche la valeur de et Affiche le texte conservent leurs sorties et diagnostics. Affiche seul, Affiche la et Affiche le restent historiques. Pour la/le, la nouvelle branche n'est sélectionnée que si le token suivant est en. Affiche la en octal et Affiche le en décimal désignent donc les variables la/le. Affiche en en hexadécimal désigne la variable en ; Affiche en décimal indique un nom absent. Plus généralement, en suivi d'un token autre que en est interprété comme la liaison après un nom absent. Aucun rapprochement approximatif.

Après les contrôles lexicaux existants, les exigences sont vérifiées de gauche à droite : nom, liaison en, format, suffixe. Affiche 2age signale le nom invalide avant le format absent. Un seul diagnostic est retourné, sans résultat partiel.

| Saisie / situation | Code | Message exact / convention |
|---|---|---|
| Affiche age. ou Affiche age en. | MISSING_DISPLAY_FORMAT | Il manque le format d’affichage. |
| Affiche en décimal. | INCOMPLETE_INSTRUCTION | Il manque le nom à afficher. |
| Affiche age en binaire. | UNSUPPORTED_DISPLAY_FORMAT | Ce format d’affichage n’est pas pris en charge. |
| Affiche age décimal. | UNKNOWN_FORMULATION | Message historique, token décimal |
| Affiche age en octal ensuite. | UNEXPECTED_TEXT | Message historique, suffixe entier |

Les nouveaux diagnostics ne proposent ni liste de formats, ni formulation complète, ni choix. category reste understanding et severity reste error. Intervalles UTF-16 [start, end) dans la saisie originale : absence de format après le dernier token reconnu, avant point et espaces finaux ; absence de nom au début de en ; format non pris en charge sur son token entier. Exemples : Affiche age. → [11,11), Affiche age en. → [14,14), Affiche en décimal. → [8,8), Affiche age en binaire. → [15,22), Affiche 😀 en octal. → INVALID_IDENTIFIER [8,10).

Aucune insertion ni aperçu confirmable pour une instruction incomplète. Modifier une phrase déjà prévisualisée invalide son ancien jeton. Placement, curseur, LF/CRLF et parcours natif restent inchangés. Le placement vérifie aussi les nouvelles traductions par retraduction canonique.

Les tests couvrent les trois formats, variantes lexicales, identifiants et tous les mots-clés C17, erreurs UTF-16, ambiguïtés, refus sans suggestions, placements successifs LF/CRLF et altérations du résultat. La fixture lot4-compatibility.json fige les résultats historiques (traductions et diagnostics) du moteur sans les ajouts du lot 5. Les tests de session et d'hôte vérifient le blocage des instructions incomplètes et la confirmation obligatoire.

### Texte littéral
Guillemets ASCII obligatoires ; contenu vide accepté. Les mots fixes sont insensibles à la casse, le contenu est conservé. Unicode valide accepté, y compris caractères astraux et espaces insécables dans le contenu, sans normalisation. L'encodage d'exécution dépend du compilateur et du terminal.

Seuls quatre échappements sont acceptés : `\"`, `\\`, `\n`, `\t` (guillemet, antislash, LF explicitement demandé, tabulation). Le moteur décode le contenu puis le réencode en littéral C ; aucune expression C n’est acceptée. Le format reste %s : les caractères % ne deviennent jamais des directives de format.

Les caractères de contrôle U+0000–001F et U+007F–009F, les unités UTF-16 isolées et les neuf trigraphes sont refusés. Les retours physiques CR/LF et les séparateurs U+2028/U+2029 sont refusés dans toute la commande. Une tabulation réelle dans le contenu est refusée ; utiliser l'échappement prévu. Les espaces/tabulations hors guillemets restent des séparateurs. Un point dans les guillemets appartient au texte ; le point final facultatif suit immédiatement le guillemet fermant.

Diagnostics nouveaux : UNSUPPORTED_HEADER (jeton entier), UNTERMINATED_STRING (guillemet ouvrant à la fin), INVALID_STRING_ESCAPE (antislash et caractère suivant s'il existe), UNSUPPORTED_STRING_CONTENT (caractère fautif ou trois unités du trigraphe). Tous sont de compréhension, en UTF-16 ; aucun fragment en cas de refus. Les suffixes supplémentaires sont refusés intégralement. Pour PRINT_TEXT, un retour physique est prioritaire, puis l'analyse du littéral procède de gauche à droite. Une absence de texte utilise un intervalle vide après les séparateurs, avant le point éventuel lorsqu'il est attaché au guillemet fermant.

### Préconditions et refus
Les sept intentions utilisent la ligne blanche et les protections du §4. MAIN reçoit sa structure complète sans return. L'inclusion ne recherche ni préambule ni doublon et ne vérifie pas la portée C. Une inclusion redemandée est reproduite au curseur. Les erreurs de programmation (appel global, nom absent, type incompatible, inclusion mal située) ne sont pas des impossibilités de placement.

## 4. Lot 2 implémenté : placement documentaire
### API et invariant des fragments
`planPlacement(request: PlacementRequest): PlacementResult`, exportée par src/planPlacement.ts. Entrée :
- `document: { id: string, revision: string | number, text: string }` : identité opaque non vide, révision opaque (nombre fini ou chaîne) et texte courant, sans accès au fichier.
- `cursorOffset: number` : entier UTF-16 compris entre zéro et text.length, sans couper CRLF ou une paire de surrogates.
- `translation: SuccessfulTranslation` : résultat réussi, intégral et non modifié de translate.
- `indentUnit?: string` : quatre espaces par défaut ; une tabulation ou un nombre non nul d'espaces sont admis.
- `fallbackEol?: "\n" | "\r\n"` : LF par défaut, option générique ajoutée au lot 3 pour les documents ne contenant encore aucune fin de ligne à la cible ou avant elle. Ce n'est ni un type ni une dépendance VS Code.

Le moteur retraduit la source du résultat reçu puis compare sa structure et ses valeurs au résultat canonique, indépendamment de l'ordre des clés d'objet. Intention, paramètres, fragment unique, rôle, identifiant, commentaire original, code, rendu, LF terminal, diagnostics vides et curseur relatif sont ainsi vérifiés. Aucune réparation des données reçues. Les entrées sont des objets de données ordinaires conformes aux types de l'API ; les proxys et accesseurs hostiles ne constituent pas une interface prise en charge.

### Ligne cible et indentation
Un seul document et un seul curseur ; les sélections et curseurs multiples sont hors signature et devront être refusés par l'intégration. La ligne cible doit contenir uniquement espaces/tabulations, ou être entièrement vide. Le document vide est admissible. EOF n'est admissible que s'il appartient à une telle ligne : pas d'ajout de retour à la ligne pour contourner une ligne de code occupée.

Quel que soit l'emplacement du curseur dans son indentation, la ligne blanche entière, avec sa fin de ligne éventuelle, est remplacée par une seule modification. Aucun texte hors de cet intervalle n'est changé. Une ligne de code ou même une ligne de commentaire est refusée.

Tous les espaces/tabulations de la ligne cible forment l'indentation de base. Ils précèdent le commentaire et chaque ligne du code. Pour MAIN, la ligne intérieure reçoit en plus indentUnit ; aucun niveau n'est déduit des accolades. Les quatre espaces du gabarit autonome constituent un niveau relatif. Une ligne non indentée dans une fonction reste non indentée.

MAIN, IF, ELSE_IF et ELSE conservent leur fermeture et reçoivent le curseur sur la ligne intérieure, après l'indentation cible plus indentUnit. Ce traitement est limité à ces quatre intentions canoniques, vérifiées par retraduction. Les autres instructions sont suivies d'une ligne blanche de même indentation ; le curseur y est placé. Cette ligne se termine aussi par la fin de ligne choisie, même à EOF. Chaque demande suivante remplace cette même ligne de saisie : pas d'accumulation de lignes blanches ni de concaténation d'instructions. Aucun suffixe existant n'est déplacé dans un bloc ; aucune ligne supplémentaire n'est créée après la fermeture d'une structure.

Pour les placements historiques ordinaires, les accolades, portées, noms et types ne sont pas validés. Un deuxième main, une fonction imbriquée, une affectation globale ou des accolades déséquilibrées ne bloquent pas à eux seuls le placement. Ce sont des erreurs possibles de programmation, pas des impossibilités documentaires. Les branches nouvelles exigent toutefois une structure bracée reconnue pour prouver leur rattachement, sans garantir la validité C globale.

### Protection lexicale conservatrice
Pour les placements historiques, seul le préfixe avant le début de la ligne cible est analysé. Le scanner distingue code, commentaires de ligne et de bloc, chaînes, caractères et leurs échappements. Une cible située dans un commentaire multiligne est dangereuse ; un littéral non terminé avant la cible empêche aussi un placement sûr. Pour ELSE_IF/ELSE seulement, le reconnaisseur examine également le suffixe jusqu'au premier token significatif, dans ses bornes, pour refuser une branche déjà existante ou un contexte indéterminé.

Avant cette analyse, refus des continuations physiques dans le préfixe : antislash suivi de LF/CRLF, y compris séparé par espaces, tabulations ou, par conservatisme, espaces verticaux/form-feed. Les neuf trigraphes C17 sont également refusés dans ce préfixe, même dans un commentaire ou un littéral. Les échappements textuels comme `"\\n"` ne sont pas des continuations physiques. Un caractère NUL dans le préfixe entraîne un refus explicite de prise en charge, y compris dans une inclusion ou un commentaire.

Seules les inclusions directes simples sont admises avant la cible : espaces/tabulations initiaux éventuels, #, espaces/tabulations éventuels, include, au moins un espace/tabulation, nom non vide entre chevrons ou guillemets, puis espaces/tabulations éventuels et éventuellement commentaire // sur cette ligne. Le nom ne peut contenir antislash, chevrons ou guillemets imbriqués. Pas de commentaire de bloc avant ou après la directive sur la même ligne. Aucun en-tête n'est ajouté, déplacé ou dédoublonné.

Les autres directives (#define, #if, #pragma, #line, etc.), inclusions par macro et directives par digraphe rencontrées dans ce préfixe sont refusées. Les mêmes caractères dans un commentaire ou littéral fermé ne sont pas considérés comme des directives. Les directives ou continuations après la cible restent inchangées et ne sont pas inspectées.

Ce sont des limites temporaires du lot 2, et non une définition du C valide ni des limites définitives de C-A. Le scanner ne développe pas les macros et ne construit pas d'arbre syntaxique C.

### Fins de ligne et offsets
Les lignes générées utilisent la fin de ligne de la cible si elle en possède une ; sinon celle de la dernière ligne précédente ; sinon fallbackEol (LF sans option). Les documents mixtes LF/CRLF sont admis par le moteur sans normalisation globale. Un CR isolé n'importe où dans le document est refusé comme convention non prise en charge. L'intégration VS Code travaille sur le texte effectif de son modèle, qui peut déjà normaliser un fichier lors de son ouverture.

L'original du commentaire est conservé intégralement après son préfixe d'indentation ; le rendu du code seul est adapté à la fin de ligne locale. Tous les intervalles sont UTF-16 et semi-ouverts. Les offsets du plan sont calculés après adaptation de l'indentation et des fins de ligne, sans normalisation Unicode.

### Plan, péremption et diagnostics
Succès : `{ status: "planned", plan, diagnostics: [] }`. Le plan contient :
- `base: { documentId, revision, text }` : instantané exact ; aucune référence mutable à la traduction reçue.
- `source: { text, instruction }` : phrase et intention vérifiée.
- `edits: [{ range, newText }]` : une modification unique ; intervalle dans le document initial.
- `placedFragments: [{ fragmentId, range }]` : plage dans le document résultant, commentaire et code compris, LF/CRLF terminal compris, hors ligne de saisie suivante.
- `cursorAfter` dans le document résultant et `eol` choisi.

Refus : `{ status: "rejected", diagnostics: [diagnostic] }`, sans plan. Chaque diagnostic contient code, catégorie placement, sévérité error, message français, reason et une plage du document initial lorsque pertinente. reason distingue invalid-request, unsafe-location, unsupported-construct et stale-plan ; aucun diagnostic de placement ne prétend être un diagnostic de compilation.

Codes : INVALID_DOCUMENT, INVALID_CURSOR, INVALID_INDENT_UNIT, INVALID_EOL, INVALID_TRANSLATION_RESULT, TARGET_LINE_NOT_BLANK, TARGET_IN_COMMENT, LEXICAL_CONTEXT_UNDETERMINED, UNSUPPORTED_LINE_CONTINUATION, UNSUPPORTED_TRIGRAPH, UNSUPPORTED_DIRECTIVE, UNSUPPORTED_LINE_ENDING, STALE_PLAN. INVALID_EOL signale une option de repli invalide, pas une erreur C. LEXICAL_CONTEXT_UNDETERMINED correspond à unsafe-location pour un littéral non terminé et à unsupported-construct pour NUL.

Priorité déterministe : document, curseur, indentation, repli de fin de ligne, résultat de traduction, CR isolé, ligne occupée ; puis premier risque brut entre continuation/trigraphe ; puis NUL ; puis analyse lexicale de gauche à droite. Un offset invalide n'est jamais utilisé pour insérer ; sa plage diagnostique est vide et bornée au texte (NaN : zéro).

`validatePlan(plan, document): PlanValidationResult`, exportée par le même module, vérifie identité, révision et texte exact. Retour current avec diagnostics vides, ou refus STALE_PLAN sans tentative de recalage. Un changement de révision invalide le plan même si le texte est redevenu identique. Cette fonction vérifie la fraîcheur d'un plan produit par le moteur, pas l'authenticité d'un plan arbitrairement modifié.

Ces API sont pures, déterministes, sérialisables et ne touchent ni fichier, ni réseau, ni VS Code, ni GCC. Le lot 2 ne livre aucun applicateur de fichier : ses tests utilisent un adaptateur en mémoire. L'adaptateur VS Code du lot 3 revalide immédiatement avant son édition unique et vérifie sa réussite ; aucun mécanisme autonome de verrouillage du document n'est revendiqué.

### Inclusions explicites au curseur — lot 4
INCLUDE_STDIO suit le placement ordinaire : commentaire puis directive, indentation de la ligne cible, une seule modification. Aucune recherche de préambule, déduplication, réorganisation ni analyse de portée C. Une ligne occupée est refusée ; l'utilisateur crée lui-même une ligne blanche avant main s'il souhaite y placer l'en-tête. La formulation combinée « avec stdio.h » n'est pas reconnue.

### Aperçu et application : prototype du lot 3
Le parcours natif, l'édition unique, les contrôles de fraîcheur et leurs limites sont décrits au §10. La composition de texte relève du contrôle natif et reste à vérifier manuellement : aucune garantie supplémentaire d'IME n'est revendiquée.

## 5. Provenance : fragment unique implémenté, navigation future
Commentaire minimal : `// {phrase originale}` immédiatement au-dessus du fragment. Le plan du lot 2 associe une phrase et une intention à la plage résultante d'un fragment unique. Pour de futures insertions multiples, la proposition est de répéter la phrase au-dessus de l'inclusion et de l'appel et de les associer dans le plan ; ce cas n'est pas implémenté. Une inclusion déjà présente n’est jamais modifiée ; le lot 4 ajoute un nouveau fragment si elle est redemandée.

Pas d'identifiant persistant ni de fichier annexe dans ce périmètre. La navigation par plages pendant une session VS Code et la reconstruction après réouverture restent à développer ; aucune association persistante n'est actuellement reconstruite. La proposition future reste de ne reconstruire une association que si commentaire et fragment sont reconnus sans ambiguïté. Des phrases identiques ne sont pas des identifiants uniques.

Le commentaire indique une origine, pas une équivalence actuelle. Aucune régénération après modification, déplacement ou suppression manuels. Malgré le point facultatif, la grammaire fermée refuse un suffixe antislash ou trigraphique : il ne peut donc pas prolonger le commentaire C sur la ligne suivante.

Garantie historique du lot 1 : chaque commentaire accepté occupe une seule ligne, sans antislash, séquence trigraphique de continuation ou délimiteur de commentaire injecté. Le LF de séparation est généré indépendamment du texte utilisateur ; le code a également son LF terminal. Le lot 1 ne reçoit aucun document. Le lot 2 complète cette garantie par le contrôle du préfixe documentaire décrit au §4, sans prétendre vérifier tout C17.

## 6. Tests d'acceptation
La base historique comprend 367 tests Node et 21 tests hôte VS Code. Un ancien test qui refusait « Affiche la valeur de age. » est actualisé vers une formulation toujours inconnue ; le nouveau comportement est testé positivement.

test/display.test.mjs vérifie les trois nouvelles intentions, sorties exactes sans retour implicite, casse, ponctuation, tabulations, commentaire original, noms et en-têtes invalides, chaînes vides/Unicode, %, quatre échappements, contrôles, Unicode invalide, neuf trigraphes, phrases incomplètes, absence de traduction partielle, plages UTF-16 et déterminisme. Il vérifie aussi le parcours depuis le document vide en LF/CRLF, les inclusions répétées, l'affichage sans en-tête, les invariants de fragments, la fraîcheur et les curseurs.

Les suites historiques de traduction, placement et sessions restent exécutées. Le test hôte supplémentaire parcourt inclusion répétée, main, initialisation, affichages littéral/entier et retour explicitement demandé, vérifie le diff exact et annuler/rétablir. Aucun test GCC ou d'exécution C n'est revendiqué.

## 7. Diagnostics et architecture validée
- Compréhension : formulation inconnue, paramètre invalide, phrase incomplète ; localisation dans la saisie, aucune insertion.
- Placement / limite de A : demande comprise mais opération documentaire non prise en charge ; aucune insertion.
- Défaut de traduction : sortie contraire au contrat pour une demande acceptée ; défaut de A, pas erreur de l'étudiant.
- Compilation : message GCC original et localisation ; explication pédagogique facultative.
- Édition de liens : catégorie distincte, par exemple absence de main pour un exécutable.
- Exécution : sortie, code de retour et faits observables ; pas de garantie de détecter tous les comportements indéfinis.
- Environnement : outil absent ou lancement/configuration impossible.

Le moteur déterministe retourne diagnostics ou plan à partir de phrase et contexte, sans API VS Code ni exécution. L'extension gère saisie, cible, aperçu et application. Un adaptateur séparé gère GCC en sélectionnant explicitement C17. Aucun serveur, agent ou base de données n'est requis.

La barre personnalisée finale localise les erreurs ; une interface native provisoire avec message est autorisée. Vérification sans liens, construction d'exécutable et exécution doivent être distinguées.

## 8. Lot 1 implémenté : API et exécution
API publique : `translate(text: string): TranslationResult`, exportée par src/translate.ts. Fonction pure, sans import externe, accès disque, réseau, horloge, hasard, document C ou état de session. Aucun placement, ajout implicite d’en-tête, VS Code ou GCC. Un appel réussit entièrement ou retourne un refus sans instruction ni fragment. Une entrée non textuelle est hors du contrat de cette API TypeScript.

Succès : `status: "translated"`, `source: { text }`, `instruction: { kind, parameters }`, `fragments`, `diagnostics: []`. MAIN et INCLUDE_STDIO ont des paramètres vides ; DECL_INT et PRINT_INT ont `name` ; INIT_INT et ASSIGN_INT ont `name` et `value` ; PRINT_TEXT a `text` décodé ; PRINT_FORMATTED a `name` et `format` ; ASSIGN_EXPRESSION a `name` et `expression` (AST) ; les quatre intentions NUMERIC_* ont les paramètres décrits au §3. Les lexèmes numériques et précisions restent des chaînes. `translated` ne signifie ni insérable, ni compilable, ni exécutable sans erreur.

Chaque fragment contient `id: "fragment-1"` (local et déterministe), `role: "primary"`, `comment`, `code` et `text`. Le rendu est toujours `comment + LF + code`. Commentaire : `// ` suivi de la saisie originale intégrale, espaces et tabulations compris. Code isolé en LF avec LF terminal. MAIN, IF, ELSE_IF et ELSE contiennent une ligne intérieure de quatre espaces et `cursor: { offset }`, position UTF-16 relative au rendu complet après ces espaces. IF et ELSE_IF portent `parameters.condition`, AST de test numérique, comparaison ou logique avec plages absolues ; ELSE n'a pas de paramètre. Les diagnostics sont détaillés dans les contrats des lots 9–10. Pas de curseur suggéré pour les autres intentions.

Refus : seulement `status: "rejected"`, `source: { text }` et `diagnostics`, sans code ni résultat partiel. Un diagnostic prioritaire comporte `code`, `category: "understanding"`, `severity: "error"`, `message` français et `range: { start, end }` dans la saisie originale. Les codes historiques sont ci-dessous ; les quatre codes du lot 4 sont définis au §3 :

| Code | Situation |
|---|---|
| EMPTY_INPUT | Saisie vide ou seulement espaces/tabulations |
| INVALID_SEPARATOR | Retour à la ligne ou autre séparateur interdit |
| UNKNOWN_FORMULATION | Mot fixe non reconnu à la première divergence |
| INCOMPLETE_INSTRUCTION | Mot ou paramètre attendu mais absent |
| INVALID_IDENTIFIER | Nom hors grammaire |
| C_KEYWORD_IDENTIFIER | Nom égal à l'un des 44 mots-clés C17, casse C respectée |
| INVALID_INTEGER | Littéral hors grammaire |
| UNEXPECTED_TEXT | Tokens supplémentaires après les éléments attendus |

Pour les instructions sans littéral, priorité : séparateur interdit d'abord ; puis saisie vide ; puis première divergence dans la règle ayant le plus long préfixe de mots fixes et emplacements de paramètres. Les paramètres sont validés après ce choix. Une absence est localisée avant le point éventuel et les espaces périphériques, par intervalle vide. Une ponctuation interdite attachée à un token invalide ce token ; un suffixe séparé produit UNEXPECTED_TEXT. Pas de MISSING_FINAL_PERIOD puisque le point est facultatif.

Le lot 2 utilise désormais ce résultat et un instantané de document pour construire un plan via planPlacement (voir §4). translate reste indépendant du placement et ne produit toujours aucune position documentaire fictive.

Outillage des moteurs : TypeScript à syntaxe effaçable exécuté nativement par Node.js >=24.12.0, testé sur 24.18.0 ; tests JavaScript avec node:test et node:assert. Aucune dépendance d'exécution. Les dépendances de développement sont désormais TypeScript **5.9.3** et **@types/vscode 1.96.0**, versions exactes verrouillées. Ni @types/node, ni framework de tests supplémentaire ne sont nécessaires. L'extension est compilée en JavaScript CommonJS compatible avec l'hôte ; elle ne dépend pas de l'effacement natif TypeScript de Node 24 pour fonctionner dans VS Code.

Commandes depuis la racine (utiliser `npm.cmd` sous PowerShell si npm.ps1 est bloqué) :

```text
npm ci --ignore-scripts
npm run typecheck
npm test
npm run check
```

`typecheck` vérifie séparément les moteurs (tsconfig.json, sans types d'hôte) puis l'extension (tsconfig.extension.json avec --noEmit). Mode strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns et contrôles des éléments inutilisés sont actifs. Les moteurs ne dépendent d'aucun type Node, DOM ou VS Code. Les tests JavaScript sont exécutés, pas vérifiés statiquement.

`check` enchaîne contrôle statique et `test`. `test` compile l'extension, puis exécute les suites traduction, placement et session. La compilation réécrit les imports relatifs .ts en .js dans extension/out ; aucun outil de bundling n'est ajouté. Les seuls tests des moteurs restent exécutables sans installation via `node --test test/translate.test.mjs test/placement.test.mjs`. Les tests dans VS Code sont séparés via `npm run test:vscode`.

Référence historique de stabilisation du lot 1 : **185 tests réussis, 0 échoué, 0 ignoré ; tsc sans diagnostic**. Les 50 tests alors ajoutés couvrent notamment les attaques de commentaire sur chaque intention, les accents décomposés, les caractères astraux et demi-surrogates, les contrôles invisibles, les mots manquants et les littéraux signés de 4096 chiffres. À cette étape, les scénarios B/C et les sept intentions futures étaient hors validation. Le bilan actuel combiné est donné au §6.

Revue : aucun défaut fonctionnel confirmé des quatre traductions, des offsets ou de la conservation des valeurs. Les accès indexés ont été explicitement sécurisés pour le contrôle statique strict ; les assertions non nulles des paramètres ont été remplacées par une vérification d'invariant interne. Un invariant de grammaire cassé déclencherait une exception interne, jamais un diagnostic imputé à l'utilisateur. Les sorties publiques restent identiques.

Le lot 2 a ajouté src/planPlacement.ts et src/placementLexical.ts. Le prototype natif du lot 3 est désormais implémenté ; l'extension du catalogue, les inclusions multiples, la navigation persistante, l'interface personnalisée et GCC restent hors réalisation actuelle.

## 9. Clôture documentaire
- [x] Revue technique effectuée et orientations arbitrées.
- [x] Catalogue minimal et tests d'acceptation préparés.
- [x] Architecture moteur / extension / GCC retenue.
- [x] Formulations du lot 1 et ajustements lexicaux approuvés ; architecture structurée validée.
- [x] Autorisation distincte du lot 1 reçue ; quatre intentions implémentées et testées.
- [x] Autorisation distincte du lot 2 reçue ; placement, contrôle lexical conservateur et détection de péremption implémentés et testés.
- [x] Autorisation distincte du lot 3 reçue ; prototype natif et tests automatisés implémentés.
- [x] Recette manuelle du prototype lot 3 validée par le porteur. Les tests automatiques ne simulent pas le clavier physique ni l’IME.
- [x] Lot 4 autorisé : bibliothèques et affichage, sept intentions reconnues. Les autres extensions restent soumises à autorisation.

Les autres choix proposés ne sont pas implémentés. Toute extension du périmètre nécessite une autorisation distincte.

## 10. Lot 3 : extension VS Code native
### Architecture et périmètre
extension/package.json déclare C-A 0.3.0 pour VS Code bureau >=1.96.0. extension/src/extension.ts adapte les API VS Code ; session.ts porte le contrôleur de session, indépendant des widgets ; preview.ts expose les instantanés virtuels en lecture seule. Les moteurs restent dans src, sans import VS Code ni accès fichier. L'API d'observation inspect() expose un état en lecture seule pour les tests ; elle ne permet ni confirmation ni édition directe.

Une seule session active et une instruction par session. Fichier local file: dont le nom finit par .c, langage c, éditeur texte ordinaire, un seul curseur et aucune sélection non vide. Documents sans nom, autres schémas, éditeurs spéciaux et interface web hors prototype. Les brouillons non enregistrés sont lus avec getText(), jamais depuis le disque.

### Parcours utilisable
1. Ouvrir un .c en mode C, placer le curseur sur une ligne blanche.
2. Exécuter « C-A : Saisir une instruction » depuis la palette, ou Ctrl+K puis A ; macOS : Cmd+K puis A. La seconde touche A se presse après relâchement du premier accord. Le raccourci est limité à l'éditeur C de fichier ordinaire, avec focus texte et hors mode lecture seule ; aucune interception globale d'Entrée.
3. Saisir la phrase dans l'InputBox native. Les diagnostics français distinguent Traduction, Placement refusé et Intégration. Le texte original est conservé ; en cas de validation refusée, le contrôleur conserve aussi l'intervalle UTF-16 concerné.
4. La première Entrée calcule le plan et ouvre un diff complet avant/après ; aucun changement source n'est fait. Les deux ressources sont des instantanés virtuels, immuables pour cet aperçu et sans fichier temporaire. Les options visuelles de diff de VS Code ne sont pas modifiées globalement.
5. Le QuickPick propose Insérer, Modifier la phrase, Annuler. Sa confirmation n'est disponible qu'après préparation du diff. Le titre indique LF ou CRLF. Naviguer dans les documents d'aperçu ne remplace jamais la cible.
6. Entrée sur Insérer seule autorise le plan affiché. Révéler la source peut être asynchrone ; après ce retour, le contrôleur revalide document, version, texte, curseur, sélection, indentation et LF/CRLF. Aucun await ne sépare cette dernière validation de TextEditor.edit.
7. Un seul appel edit, borné par undoStopBefore/After, applique le remplacement. Pas de snippet, sauvegarde, formatage global, commande GCC ou reprise automatique. Confirmation consommée une fois avant l'attente du résultat.
8. Sur réussite, le diff et les contrôles de la session sont fermés ; le focus revient au fichier et le curseur au point calculé. Si le document a de nouveau changé entre-temps, aucun ancien offset n'est imposé. Une nouvelle commande ouvre la session suivante.

C-A ne demande aucune sauvegarde et ne change pas le réglage Auto Save de VS Code ; un éventuel enregistrement automatique déjà configuré dans l'éditeur relève de ce réglage utilisateur. Les tests de non-sauvegarde utilisent un profil isolé avec Auto Save désactivé.

Échap/fermeture d'un contrôle natif annule sans édition. Une annulation ou un refus conserve le brouillon en mémoire pour la prochaine commande ; un succès l'efface. Modifier la phrase ferme l'ancien aperçu et exige une nouvelle préparation. Une fermeture inattendue ne vaut jamais confirmation.

### Indentation, fins de ligne et contrôle de fraîcheur
La ligne cible fournit l'indentation de base. Pour le niveau intérieur de MAIN, insertSpaces=true utilise l'indentSize effectif ; insertSpaces=false utilise une tabulation. tabSize est aussi mémorisé pour l'invalidation. Les réglages doivent être résolus ; aucune valeur de remplacement silencieuse n'est choisie.

La métadonnée document.eol est transmise au moteur comme fallbackEol. Elle ne remplace jamais une fin de ligne existante choisie par le moteur. Cela évite la conversion implicite LF vers CRLF de VS Code sur un fichier vide et conserve l'identité entre aperçu, texte appliqué et curseur. C-A ne modifie pas la métadonnée EOL séparément ; un écart avant édition entraîne un refus.

Une modification de source/version, fermeture/disparition de la vue cible, déplacement du curseur, sélection, options d'indentation ou métadonnée LF/CRLF invalide la session. Activer un autre fichier ne le rend pas cible. Insérer est retiré du QuickPick périmé ; le brouillon est conservé et l'utilisateur doit revenir à la source puis relancer la commande. Pas de recalage automatique.

Chaque aperçu possède un jeton de session ; les retours asynchrones anciens ne peuvent pas réarmer une confirmation. Les URI virtuelles sont également propres à l'activation pour éviter la réutilisation d'un modèle d'aperçu en cache après rechargement de l'hôte. Le nettoyage ne ferme que les onglets d'aperçu appartenant à C-A.

### Installation des dépendances et lancement local
Depuis la racine du dépôt, avec Node >=24.12.0 et VS Code bureau installé :

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run build:extension
code.cmd --new-window --extensionDevelopmentPath "$PWD\extension" .
```

Ce lancement charge l'extension localement dans un hôte de développement ; il ne publie pas le produit et ne l'installe pas durablement dans le profil personnel. Alternative : ouvrir le dépôt dans VS Code, puis F5 avec la configuration « C-A : lancer le prototype ». La tâche compile l'extension avant son ouverture. Les artefacts extension/out sont ignorés par Git et doivent être reconstruits après récupération du dépôt.

### Vérifications automatiques et recette restante
`npm.cmd run check` : 367 tests Node réussis (334 moteurs, dont les 328 historiques conservés ; 33 sessions), aucun échec, contrôle TypeScript sans diagnostic. Les tests de session exécutent le JavaScript CommonJS réellement compilé.

**Bilan lot 4 : 434 tests Node et 22 tests hôte VS Code Windows 1.96.4 réussis, soit 456 réussis, aucun échec ni test ignoré. Contrôle TypeScript sans diagnostic.** Les 388 tests historiques sont conservés avec actualisation du test négatif devenu une instruction autorisée.

`npm.cmd run test:vscode` : compilation puis tests dans un VS Code bureau installé, avec profil, extensions et fichiers de test isolés sous .cache/vscode-test. Le lanceur n'installe ni ne télécharge automatiquement VS Code. Sous Windows, il cherche l'installation utilisateur habituelle ; sinon fournir VSCODE_EXECUTABLE vers l'exécutable bureau. Exemple avec l'archive de test locale utilisée ici :

```powershell
$env:VSCODE_EXECUTABLE = "$PWD\.cache\vscode-1.96.4\Code.exe"
npm.cmd run test:vscode
```

La suite est dans test/vscode/suite.cjs ; scripts/test-vscode.mjs lance l'hôte. Le rapport .cache/vscode-test/results.json contient version, cas, succès/échecs et recette manuelle restante. Les fixtures sont créées et nettoyées par les tests ; leurs sauvegardes de nettoyage ne sont pas des sauvegardes effectuées par C-A.

La version Windows testée est 1.96.4. Les tests utilisent les vrais InputBox, QuickPick, diff et TextEditor.edit, avec les commandes natives d'acceptation/fermeture : ils ne simulent pas les touches physiques. Leurs cas couvrent parcours depuis vide, insertions successives, brouillons non enregistrés, navigation du diff, fermeture de cible, autre fichier actif, curseur, indentSize/tabSize, LF/CRLF, UTF-16, confirmations répétées, annulation/rétablissement et diagnostics séparés. La recette physique Ctrl+K puis A/Cmd+K puis A, IME, disposition du clavier et rendu visuel reste manuelle ; macOS/Linux ne sont pas revendiqués comme testés.

Pour lancer manuellement le prototype avec l'archive officielle locale si l'installation habituelle est indisponible :

```powershell
& "$PWD\.cache\vscode-1.96.4\Code.exe" --new-window --disable-gpu --in-process-gpu --user-data-dir "$PWD\.cache\c-a-dev-profile" --extensions-dir "$PWD\.cache\c-a-dev-extensions" --extensionDevelopmentPath "$PWD\extension" .
```

Ce profil de développement est distinct du profil personnel et de celui des tests. Dans sa fenêtre, ouvrir ou créer un .c, exécuter C-A, puis vérifier le raccourci physique, Échap, l'IME et l'affichage du diff avant la recette finale.

Difficultés rencontrées : installation utilisateur VS Code 1.138.0 bloquée par une mise à jour ; premier lancement restreint échouant côté GPU. Les tests ont été poursuivis dans une archive officielle portable 1.96.4, sans modification ni arrêt de l'installation personnelle. Les tests réels ont révélé la normalisation LF/CRLF et le comportement d'annulation de la métadonnée EOL : la solution finale est fallbackEol, pas une édition EOL supplémentaire. Les tests attendent les options effectives de l'éditeur avant de commencer une session, sans affaiblir l'invalidation du produit.


## Bilan automatisé du lot 5 — 23 octobre 2026

`npm.cmd run check` : contrôle TypeScript sans diagnostic, **799 tests Node réussis, 0 échoué, 0 ignoré**. Les 434 tests Node historiques du lot 4 sont conservés. `npm.cmd run test:vscode`, avec VS Code portable Windows 1.96.4 et profil isolé : **28 tests réussis, 0 échoué**, dont les 22 historiques. Total : **827 réussis**.

Les six nouveaux tests hôte vérifient cinq refus sans édition (format absent, nom absent, format non pris en charge, identifiant astral invalide) et les trois formats successifs avec aperçu avant édition, confirmation obligatoire, curseur et absence de sauvegarde. Le premier lancement dans le bac à sable a quitté sans rapport ; la relance autorisée hors bac à sable a produit le rapport complet.

Recette physique clavier/IME et vérification visuelle à effectuer pour le lot 5 ; macOS/Linux non testés. Aucun nouvel essai GCC ni compilation C automatique. Aucun lot suivant autorisé ou engagé.

## Bilan du lot 6 — 23 octobre 2026

Contrat approuvé et implémenté. `npm.cmd run check` : **1 186 tests Node réussis, 0 échoué, 0 ignoré**, contrôle TypeScript sans diagnostic. `npm.cmd run test:vscode`, hôte portable Windows 1.96.4 avec profil et fixtures isolés : **36 réussis, 0 échoué**, soit **1 222 réussis** au total. Les 799 tests Node et 28 tests hôte du lot 5 sont conservés. Les suites expression.test.mjs et arithmetic.test.mjs sont incluses dans npm test, sans nouvelle dépendance ; une fixture complémentaire conserve 55 résultats du moteur avant le lot 6.

Les tests vérifient explicitement -a, -(a + b), a * -b, les plages UTF-16, les diagnostics sans suggestions, les bornes de longueur/profondeur, le placement LF/CRLF et le refus d'insertion pour une demande incomplète. Le contrôle canonique vérifie aussi l'AST. La version finale est vérifiée dans l'hôte réel ; les widgets et contrôleurs de production restent inchangés.

La [recette manuelle du lot 6](../../RECETTE_LOT6.md) est partielle : le porteur confirme addition entre variables, priorité et parenthèses explicites ; sa recette complète sera regroupée avec celle du domaine après le lot 8. GCC n'était pas accessible dans le terminal de la session de livraison ; aucun nouvel essai C17 n'y est revendiqué. Le porteur confirme directement dans VS Code trois scénarios manuels du lot 5 : format manquant (`Affiche age.`), insertion hexadécimale (`Affiche age en hexadécimal.`) et format non pris en charge (`Affiche age en binaire.`). Les résultats exacts sont consignés dans le document fondateur §8. Les autres scénarios n'ont pas tous été vérifiés manuellement ; clavier physique, IME, focus/diff et portabilité restent ouverts sauf attestation séparée. Aucun comportement de palier 3 n'est inventé ; le lot 7 est désormais approuvé et implémenté.

## Bilan du lot 7 — 23 octobre 2026

`npm.cmd run check` : **1 530 tests Node réussis, 0 échoué, 0 ignoré**, contrôle TypeScript sans diagnostic. `npm.cmd run test:vscode`, hôte portable Windows 1.96.4 avec profil et fixtures isolés : **45 tests réussis, 0 échoué**, soit **1 575 réussis** au total. Les 1 186 tests Node et 36 tests hôte du lot 6 restent présents. La fixture lot6-compatibility.json capture 57 résultats supplémentaires avant modification, notamment les refus des flottants/casts dans la branche entière et des en-têtes hors catalogue.

Les nouveaux tests couvrent les quatre types, littéraux/suffixes/exposants, divisions 7/2 et 7.0/2, casts, négations, AST et plages UTF-16, les 21 précisions autorisées dans les deux notations, les diagnostics sans insertion, les bornes avec casts et mots de type comptés, le placement LF/CRLF et la vérification canonique. Aucun calcul n'est évalué par le moteur, même lorsque la syntaxe produit du C à opération invalide ; ces cas ne sont jamais exécutés comme tests de valeur.

Les empreintes du parseur entier, du placement, des contrôleurs/widgets VS Code et de .vscode/tasks.json sont inchangées. Aucun ajout de dépendance ni changement du parcours. Aucun nouvel essai manuel ou compilation C17 : GCC n'est pas accessible dans le terminal de cette session ; la recette complète du domaine reste prévue après le lot 8. Les avertissements mutex/N-API de l'hôte portable lors du lancement/arrêt sont consignés au journal ; rapport 45/0 et sortie de test 0, origine à qualifier séparément. Aucun lot 8 n'est commencé.
