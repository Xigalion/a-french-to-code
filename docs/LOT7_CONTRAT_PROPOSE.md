# C-A — Lot 7 : Types numériques et conversions — contrat approuvé

**Statut : contrat approuvé par le porteur et implémenté.** Le nom de fichier historique est conservé pour les liens. La recette manuelle complète du domaine sera effectuée après le lot 8 ; ce lot reste à définir et n’est pas commencé.

Direction 1 : Algorithmique et développement logiciel en C17. Étape 2 : Expressions et calculs. Références : [document fondateur](A_DOCUMENTATION_FONDATRICE.md), [lot 6 approuvé](LOT6_CONTRAT_PROPOSE.md), [spécifications livrées](A-phase1/docs/SPECIFICATIONS.md), [décisions](A-phase1/docs/DECISIONS.md).

## 1. Situation et principes conservés

Le lot 6 est livré. Le porteur confirme manuellement l'addition entre variables, la priorité des opérations et les parenthèses explicites. Cette confirmation partielle ne vaut pas validation exhaustive. La recette complète des lots du domaine Expressions et calculs sera regroupée à la fin du lot 8 ; le présent contrat ne définit ni n'autorise le contenu du lot 8.

Les compétences sont indépendantes des paliers de liberté. Tous les paliers doivent donner accès aux mêmes résultats dans les capacités prises en charge. Ici, seul le palier 1 est concerné : type, conversion explicitement demandée, destination et format ne sont jamais inventés. Aucun comportement des autres paliers, aucune règle du palier 3.

Une décision de C-A se distingue d'une règle du C : choisir explicitement le type d'une variable et écrire une expression peut entraîner les conversions implicites définies par C17. C-A les laisse se produire, sans ajouter de cast, suffixe ou transformation. Les rendre toutes explicites automatiquement masquerait précisément ce que l'apprenant doit comprendre.

Analyse syntaxique seule : aucune table des symboles, déduction du type d'une variable depuis le document, vérification de déclaration/initialisation, évaluation, simulation des limites, simplification, réparation ou compilation automatique. Une traduction réussie ne garantit ni compilation ni exécution valide. « Opérandes compatibles » désigne ici des opérations arithmétiques autorisées par le C et ses conversions usuelles, sans prétendre que int et double sont des types compatibles au sens technique du langage.

Une affectation n'est pas une nouvelle déclaration : elle ne demande pas de répéter le type de sa destination, et C-A n'en suppose aucun. De même, choisir un format demande une forme d'affichage ; cela ne vérifie ni ne modifie le type de la variable.

## 2. Périmètre livré

Quatre types explicitement nommés : **int, unsigned int, float, double**. Déclaration et initialisation numériques, littéraux décimaux avec écritures de type explicites, expressions + - * / % et négation, conversions C par casts vers ces quatre types, affichage signé/non signé et flottant à précision choisie.

Les variables, types de stockage, types des littéraux, types des expressions, conversions d'affectation et types transmis à printf sont étudiés séparément. L'objectif est de savoir expliquer un résultat, pas d'apprendre une table de sorties par cœur.

Hors périmètre : char/short/long/long long/long double comme nouveaux types demandables, tailles garanties, nombres décimaux exacts pour calcul financier, types complexes, pointeurs, typedef, sizeof dans les expressions C-A, fonctions mathématiques, lecture clavier/scanf, conditions, comparaisons, boucles, sélection automatique d'un format, %g/%a, formats printf libres, locale configurable et réglages du compilateur. Les casts de pointeurs ne sont pas acceptés. Les connaissances nécessaires à ces sujets pourront être évoquées sans ajouter leur syntaxe au moteur.

## 3. Compétences, instructions, limites, tests et acquisition

Prérequis : compétences du lot 6 ; déclaration/initialisation ; nom et valeur ; division entière/reste ; priorité et parenthèses ; affichage explicite ; compilation/exécution manuelle d'un .c. Aucun palier supérieur n'est un prérequis.

| Compétence | Instruction et C17 représentatifs | Limites et tests proposés | Exercice et preuve d'acquisition |
|---|---|---|---|
| Choisir stockage entier signé/non signé | Déclare une variable de type unsigned int nommée compteur. → `unsigned int compteur;` | Quatre types seulement ; aucune largeur supposée ; chaque type, casse et nom testés | Choisir un type pour température entière et compteur, justifier signe et domaine ; une absence de signe négatif ne suffit pas à justifier tout usage de unsigned |
| Déclarer sans initialiser, puis initialiser explicitement | Crée une variable de type int nommée n avec le résultat de "7". → `int n = 7;` | Pas d'initialisation implicite de la déclaration ; tests int/unsigned int/float/double et variables locales non initialisées | Expliquer la différence entre `int n;` et `int n = 7;` ; ne pas exécuter la lecture d'une variable locale non initialisée |
| Lire les littéraux et leurs types | Crée une variable de type float nommée f avec le résultat de "0.1f". → `float f = 0.1f;` ; double d avec "0.1" → `double d = 0.1;` | Écriture exacte préservée ; pas de suffixe ajouté ; tests 7/7u/7.0/7.0f/1e-3 | Distinguer valeur mathématique, écriture du littéral et type ; prévoir où une conversion d'initialisation intervient |
| Comprendre taille, représentation et limites | Affiche UINT_MAX en décimal non signé. → `printf("%u", UINT_MAX);` ; Affiche FLT_EPSILON en notation scientifique avec 8 décimales. → `printf("%.8e", FLT_EPSILON);` | Macros utilisables comme noms ordinaires ; en-têtes limits.h/float.h ajoutés manuellement et explicitement dans le laboratoire, pas automatiquement ; observations dépendantes de la cible | Relever les limites sur sa cible, distinguer taille, plage et précision ; expliquer pourquoi FLT_MIN n'est pas la valeur la plus négative |
| Distinguer division entière et flottante | Affecte à q le résultat numérique de "7 / 2". → `q = (7 / 2);` ; avec "7.0 / 2.0" → `q = (7.0 / 2.0);` | Le type de q ne change pas l'opération préalable ; vérifier 3 puis 3.5 après stockage dans un double | Expliquer pourquoi `double q = 7 / 2;` donne 3.0, puis modifier les opérandes pour obtenir 3.5 |
| Comprendre les conversions arithmétiques implicites | Affecte à r le résultat numérique de "f + 1.0". → `r = (f + 1.0);` | Types réels des noms non vérifiés par C-A ; les exercices spécifient f en float ; tests aussi avec 1.0f et un entier | Repérer la conversion vers double due au littéral 1.0 et distinguer le calcul de la conversion finale de stockage |
| Demander et positionner une conversion explicite | Affecte à q le résultat numérique de "(double) a / b". → `q = (((double) a) / b);` | Cast vers un des quatre types ; aucun cast ne répare une division déjà effectuée ; test opposé `(double) (a / b)` | Avec a=7,b=2, expliquer et vérifier 3.5 contre 3.0 ; convertir une sous-expression choisie plutôt que placer un cast au hasard |
| Comprendre troncature et perte d'information | Affecte à n le résultat numérique de "(int) -3.75". → `n = ((int) (-3.75));` | Cas représentables seulement dans les essais exécutés ; pas d'arrondi au plus proche promis ; tests -3.75/3.75, double→float | Prédire -3 et 3 ; expliquer pourquoi reconvertir un float en double ne restaure pas l'information perdue |
| Comprendre unsigned et mélanges signés/non signés | Crée une variable de type unsigned int nommée u avec le résultat de "7u". → `unsigned int u = 7u;` ; calcul "u + 1u" → `(u + 1u)` | Pas de saturation, ni garde ajoutée ; ne pas généraliser les règles de unsigned aux conversions depuis float | Expliquer `(unsigned int) -1` à l'aide de UINT_MAX ; étudier 1u - 2u et le mélange -1 + 1u sans supposer 32 bits |
| Distinguer précision de calcul et présentation | Affiche f en notation fixe avec 9 décimales. → `printf("%.9f", f);` ; même instruction avec d | Précision demandée 0..20 ; float promu en double pour printf ; aucune précision recréée par l'affichage | Comparer f=0.1f et d=0.1 sur une cible documentée ; expliquer pourquoi davantage de chiffres affichés ne rend pas le calcul plus précis |

Chaque exercice exige une prédiction écrite, une lecture du C généré, une compilation manuelle et une comparaison expliquée. Un second jeu de valeurs vérifie le transfert de compétence.

## 4. Catalogue exact livré et génération

### 4.1 Déclaration et initialisation

```text
Déclare une variable de type {type} nommée {nom}.
Crée une variable de type {type} nommée {nom} avec le résultat de "{expression}".
```

| Saisie exacte | Code hors commentaire et LF terminal |
|---|---|
| Déclare une variable de type int nommée n. | `int n;` |
| Déclare une variable de type unsigned int nommée u. | `unsigned int u;` |
| Déclare une variable de type float nommée f. | `float f;` |
| Déclare une variable de type double nommée d. | `double d;` |
| Crée une variable de type int nommée n avec le résultat de "7". | `int n = 7;` |
| Crée une variable de type unsigned int nommée u avec le résultat de "7u". | `unsigned int u = 7u;` |
| Crée une variable de type float nommée f avec le résultat de "1.25f". | `float f = 1.25f;` |
| Crée une variable de type double nommée d avec le résultat de "1.25". | `double d = 1.25;` |
| Crée une variable de type float nommée f avec le résultat de "0.1". | `float f = 0.1;` |
| Crée une variable de type double nommée q avec le résultat de "7 / 2". | `double q = (7 / 2);` |

Le dernier exemple ne devient jamais 7.0/2.0 ; l'exemple float ne reçoit jamais de suffixe f ajouté par C-A. Initialiser avec un nom ou une expression composée est possible dans cette seule nouvelle famille.

Les types externes aux guillemets sont les mots contrôlés int, unsigned int, float, double, insensibles à la casse selon les règles françaises actuelles ; sortie canonique en minuscules. unsigned seul, signed int, real, entier/flottant comme alias et long double ne sont pas admis par cette nouvelle formulation. Les anciennes formulations avec « un entier » restent inchangées.

### 4.2 Affectation et conversions

```text
Affecte à {nom} le résultat numérique de "{expression}".
```

Une branche numérique explicite est adoptée pour préserver **exactement** la grammaire et les diagnostics de la formulation du lot 6 `Affecte à {nom} le résultat de "{expression}".` Les nouveaux littéraux et casts ne sont acceptés que dans cette nouvelle branche et dans la nouvelle initialisation. Une expression entière reste également admise dans la branche numérique. Cette duplication limitée de formulation est approuvée.

| Expression dans la nouvelle formulation | Affectation attendue à r |
|---|---|
| a + b | `r = (a + b);` |
| a * -b | `r = (a * (-b));` |
| 7.0 / 2 | `r = (7.0 / 2);` |
| (double) a / b | `r = (((double) a) / b);` |
| (double) (a / b) | `r = ((double) (a / b));` |
| (int) -3.75 | `r = ((int) (-3.75));` |
| (unsigned int) -1 | `r = ((unsigned int) (-1));` |
| (double) (float) x | `r = ((double) ((float) x));` |
| 1.0f + 2.0f | `r = (1.0f + 2.0f);` |
| 1.0f + 2.0 | `r = (1.0f + 2.0);` |

Toute opération, cast compris, est parenthésée. Les priorités + - * / % et l'associativité du lot 6 sont conservées. Cast et négation se groupent de droite à gauche. `-(double) a` produit `(-((double) a))`. Un cast transforme une valeur ; il ne change pas le type de la variable source. Il n'y a pas de type de calcul choisi à partir de la destination.

### 4.3 Affichage

| Formulation exacte | C17 produit | Argument attendu |
|---|---|---|
| Affiche {nom} en décimal. | `printf("%d", {nom});` | int ; historique inchangé |
| Affiche {nom} en décimal non signé. | `printf("%u", {nom});` | unsigned int |
| Affiche {nom} en hexadécimal. | `printf("%x", {nom});` | unsigned int ; sortie historique inchangée |
| Affiche {nom} en octal. | `printf("%o", {nom});` | unsigned int ; sortie historique inchangée |
| Affiche {nom} en notation fixe avec {p} décimales. | `printf("%.{p}f", {nom});` | double après promotions ; float ou double avant appel |
| Affiche {nom} en notation scientifique avec {p} décimales. | `printf("%.{p}e", {nom});` | double après promotions ; float ou double avant appel |

Par exemple, p=3 donne `printf("%.3f", f);` ou `printf("%.3e", d);`. La précision est un entier décimal ASCII de 0 à 20 inclus, sans + ni zéro initial sauf 0. Elle indique les chiffres après le séparateur décimal, dans la mantisse pour e, pas le nombre total de chiffres significatifs. La borne 20 est une borne de produit pédagogique, pas une garantie de précision des types du C.

Aucun défaut de précision (notamment 6) n'est choisi par C-A. Aucun cast n'est ajouté par l'affichage ; aucune vérification du type réel du nom. Le format est construit depuis cette grammaire fermée, jamais accepté comme texte printf libre. Aucune largeur de champ, séparation, nouvelle ligne ou bibliothèque implicite. Le point de la syntaxe du littéral C et le séparateur effectivement imprimé sont deux sujets distincts ; C-A ne lance pas setlocale. Les exemples exécutés utilisent la locale C et son point.

## 5. Sous-ensemble de littéraux et grammaire numérique

Littéraux entiers décimaux : 0 ou un chiffre 1..9 suivi de chiffres, avec suffixe optionnel u/U. Littéraux flottants décimaux : une suite de chiffres et un point, avec chiffres fractionnaires facultatifs ; ou un point suivi d'au moins un chiffre ; ces deux formes peuvent recevoir un exposant. Une suite de chiffres suivie d'un exposant est également flottante. Exposant : e/E, signe optionnel +/-, au moins un chiffre. Suffixe flottant optionnel f/F. Les chiffres initiaux 0 sont admis dans un flottant décimal, sans en faire une constante octale. Aucun espace interne. Le signe initial moins reste une négation, pas une partie du token.

Exemples acceptés : 7, 7u, 7U, 0.5, .5, 1., 00.5, 0.5f, 1e3, 1.0e-3F. Le point d'un littéral est à l'intérieur des guillemets ; il ne se confond pas avec le point final de l'instruction. Écritures exclues : 020, 0x10, 0x1p2, 7l, 7ull, 1.0L, 1f, 1,5, séparateurs de chiffres, inf et nan comme littéraux spéciaux. Certaines sont valides en C17 ; leur refus signifie une limite du catalogue, pas une erreur du C. Un nom valide `nan` reste un nom ordinaire sans interprétation spéciale ni garantie d'existence. Ce sous-ensemble est approuvé.

Une constante flottante sans suffixe est double ; avec f/F, float. Un entier décimal sans suffixe n'est pas garanti int lorsqu'il est très grand ; un suffixe u ne garantit pas unsigned int au-delà de sa plage. C17 choisit alors parmi les types permis par l'écriture et la représentabilité. Les exercices utilisent de petits entiers et distinguent ce fait des quatre types de variables demandables. Le traducteur conserve les très grands lexèmes sans conversion JavaScript, limitation à 32 bits ni promesse de représentabilité.

```text
expression = somme
somme      = produit { ("+" | "-") produit }
produit    = conversion { ("*" | "/" | "%") conversion }
conversion = "-" conversion | "(" type_C ")" conversion | primaire
primaire   = littéral_numérique | nom | "(" expression ")"
type_C     = "int" | "unsigned" "int" | "float" | "double"
```

Les types dans les casts sont des mots-clés C, en minuscules exactes. Le type hors guillemets relève de la grammaire française contrôlée et peut être saisi en majuscules. Les typedef ne sont pas devinés. `(a)` reste un regroupement ; `(double)` reconnaît un cast auquel il manque un opérande ; `() a` ne prouve pas une intention de conversion et signale un opérande manquant. Les types C non pris en charge dans un cast sont explicitement refusés. `(DOUBLE)` peut être un regroupement du nom DOUBLE, sans interprétation automatique comme cast.

Bornes approuvées : 1 024 tokens et 64 niveaux cumulés de parenthèses, négations et casts imbriqués pour le nouveau profil. Un littéral avec exposant est un token, même avec signe d'exposant. Le cast compte pour un niveau ; ses parenthèses ne comptent pas une deuxième fois, mais sont des tokens. Les deux mots de unsigned int sont deux tokens. La grammaire et le comptage du profil du lot 6 restent inchangés.

## 6. Conversions, précision et risques à enseigner

Trois lieux de conversion doivent être distingués : les opérandes d'une opération, la valeur affectée/initialisée, et les arguments d'un appel variadique. Un cast est un quatrième choix, demandé explicitement dans l'expression.

| Cas | Explication pédagogique et limite |
|---|---|
| int avec int ; unsigned int avec unsigned int | Arithmétique entière ; / tronque vers zéro ; % demande des opérandes entiers ; unsigned opère modulo UINT_MAX+1 pour les opérations concernées, sans protection contre un diviseur nul |
| int avec unsigned int | Pour ces deux types de même rang, conversion vers unsigned int ; une valeur négative peut changer fortement de valeur apparente |
| Entier avec float ; float avec float | Le calcul relève du type float selon les conversions usuelles ; ce n'est pas une promotion automatique systématique en double |
| float avec double ; entier avec double | Le type commun est double dans ce périmètre ; les sous-expressions déjà calculées ne sont pas recalculées en double |
| Affectation à double après a/b entiers | La division entière a déjà eu lieu ; le stockage peut convertir 3 en 3.0, pas en 3.5 |
| float vers double | La valeur float est conservée ; les chiffres perdus lors du stockage en float ne reviennent pas |
| double vers float, entier vers flottant | La conversion peut perdre de la précision ; ne pas affirmer que tous les int sont exactement représentables en float ou en double sur toute cible |
| Flottant fini vers entier | Troncature vers zéro lorsque la partie entière est représentable ; hors plage, ne pas promettre une saturation ni un résultat portable |
| Entier vers unsigned int | Conversion modulo UINT_MAX+1 ; cette règle ne s'applique pas comme telle à un flottant hors plage converti en unsigned |
| unsigned vers int hors plage | Résultat ou signal défini par l'implémentation en C17 ; ne pas le confondre avec le cas flottant vers entier |

Les casts ne rendent pas une opération sûre et n'évitent pas une perte déjà survenue. L'addition flottante n'est pas une arithmétique réelle exacte ni généralement associative ; écrire davantage de décimales dans printf ne change pas le stockage. Sur des cibles binaires usuelles, 0.1 est une approximation. Les exemples binary32/binary64, 24/53 bits de significande, tailles de 4/8 octets et valeurs courantes des limites sont des observations de cible, pas des garanties universelles de C17. Ni complément à deux pour int ni IEEE 754 ne sont postulés par le contrat.

La précision d'évaluation intermédiaire peut dépasser celle du type annoncé selon l'implémentation et FLT_EVAL_METHOD. Un exemple pédagogique ne doit donc pas imposer partout une suite unique de dernières décimales observée sur un seul ordinateur. L'observation de double n'assure pas qu'il est strictement plus précis que float sur toute implémentation.

**Limite de diagnostic volontaire :** faute de contrôle de type, `5.0 % 2.0` ou un nom de type inadapté à printf ne sont pas rejetés s'ils respectent la grammaire ; leur C produit peut être invalide ou avoir un comportement indéfini. Le compilateur et l'analyse de l'apprenant restent nécessaires. Les essais exécutés utilisent uniquement les opérations et conversions définies. Une vérification sémantique locale ou documentaire nécessiterait un autre arbitrage ; elle n'est pas introduite implicitement ici.

## 7. printf : contrat et pièges spécifiques

Le format ne convertit pas le type de l'argument. `%d` attend int ; `%u`, `%x`, `%o` attendent unsigned int. `%f` et `%e` attendent double dans la partie variadique. Un float y est promu en double par le C ; C-A ne génère pas de cast supplémentaire. Un int n'est pas promu en double par le seul choix de `%f`. Une incompatibilité peut rendre le comportement indéfini ; ne pas l'enseigner comme un simple changement de présentation.

Dans printf C17, `%lf` n'est pas un format distinct permettant de sélectionner double : le modificateur l n'a pas d'effet pour cette conversion. `%Lf` concerne long double, hors périmètre. La distinction `%f` pour float* / `%lf` pour double* appartient à scanf, pas à printf ; scanf n'est pas implémenté dans ce lot. Une promotion float→double lors de printf ne signifie pas que les opérations float précédentes ont été calculées en double.

Les instructions historiques `%d`, `%x`, `%o` restent strictement inchangées, sans cast réparateur et sans vérification du nom. Pour les exercices hexadécimaux et octaux, choisir explicitement une variable unsigned int compatible. Ne pas étendre une recette historique d'insertion correcte à une garantie générale de validité de ses arguments.

Le cas `Affiche f.` conserve « Il manque le format d’affichage. » ; C-A ne déduit jamais le format d'une déclaration antérieure. De même, un format flottant sans précision n'utilise pas silencieusement la précision standard de printf.

## 8. Diagnostics pédagogiques livrés

Dans le nouveau profil, INVALID_EXPRESSION_TOKEN emploie le message « Cet élément n’appartient pas à une expression numérique prise en charge. » ; le message entier historique reste inchangé. Une précision absente avant son unité reste MISSING_DISPLAY_PRECISION.

Un seul diagnostic prioritaire, category understanding, severity error, intervalle [start,end) UTF-16 dans la saisie originale. Refus sans instruction ni fragment. Aucun menu, liste de réponses, formulation complète proposée, choix de type, cast, suffixe ou paramètre ajouté. Les règles communes de casse, accents, noms, espaces, point facultatif et commentaire original sont conservées.

| Saisie ou situation | Code | Message exact / règle de localisation |
|---|---|---|
| Déclare une variable nommée x. ; de type suivi de nommée ou de la fin | MISSING_NUMERIC_TYPE | Il manque le type numérique. — intervalle vide avant nommée ou au point d'absence |
| Type long, unsigned seul ou long double dans la nouvelle famille ou un cast | UNSUPPORTED_NUMERIC_TYPE | Ce type numérique n’est pas pris en charge. — désignation entière |
| Nom absent | INCOMPLETE_INSTRUCTION | Il manque le nom de la variable. — intervalle vide au point d'absence |
| Initialisation ou affectation numérique sans expression | MISSING_EXPRESSION | Message du lot 6 ; emplacement attendu ou intérieur vide des guillemets |
| Cast (double) sans opérande | MISSING_OPERAND | Il manque un opérande. — intervalle vide avant la fin ou le token suivant |
| (double a | MISSING_CAST_CLOSING_PARENTHESIS | Il manque la parenthèse fermante du type de conversion. — intervalle vide avant a |
| Littéral 1e, 1e+ ou 1e- | INCOMPLETE_NUMERIC_LITERAL | Il manque l’exposant du littéral numérique. — intervalle vide après e ou son signe |
| 020, 1f, 1.0L, 1,5 ou lexème numérique mal formé | UNSUPPORTED_NUMERIC_LITERAL | Cette écriture de littéral numérique n’est pas prise en charge. — lexème entier, sans réécriture |
| Affiche f en notation fixe. ; scientifique sans précision | MISSING_DISPLAY_PRECISION | Il manque la précision d’affichage. — intervalle vide au point d'absence |
| Précision -1, 02, 2.5, vingt ou 21 | INVALID_DISPLAY_PRECISION | La précision d’affichage doit être un entier entre 0 et 20. — token entier |
| Précision présente sans son unité finale | INCOMPLETE_INSTRUCTION | Il manque l’unité de précision d’affichage. — intervalle vide |
| Format absent/non pris en charge | Codes du lot 5 | Messages historiques conservés hors nouveaux préfixes explicitement pris en charge |
| Identifiant, mot-clé, opérateur, opérande, parenthèse de groupe, guillemet, séparateur ou suffixe incorrect | Codes historiques applicables | Messages existants ; mêmes conventions de plages |
| Plus de 1 024 tokens ou de 64 niveaux | EXPRESSION_TOO_COMPLEX | Message du lot 6 ; premier token qui dépasse la limite |

Une écriture numérique refusée reste un lexème entier : 1e- ne devient pas trois tokens, 1,5 n'est ni deux arguments ni une virgule corrigée. Hors lexème numérique, une virgule reste un caractère d'expression non pris en charge. Une erreur de séparateur reste prioritaire. Ensuite, enveloppe de gauche à droite, guillemet fermant, expression de gauche à droite, suffixe. Pour l'affichage : nom, notation, précision puis unité et suffixe. Les noms et types sont validés avant les expressions.

Le mot conversion n'est pas deviné à partir de parenthèses vides : `() a` reste MISSING_OPERAND. Les préfixes français explicites « une variable de type », « résultat numérique », « décimal non signé » et « notation fixe/scientifique » délimitent les cas nouvellement reconnus. Les branches historiques de texte littéral et les ambiguïtés la/le/en restent protégées. Les nouveaux préfixes incomplets font partie des changements de diagnostic approuvés ; les autres refus historiques restent identiques.

## 9. Laboratoire de représentation et de précision

Le laboratoire comprend une partie C écrite/lue explicitement par l'apprenant : ajout manuel de `#include <limits.h>` et `#include <float.h>` en plus de stdio.h demandé avec C-A. La commande Inclue conserve son catalogue actuel ; ces deux nouveaux en-têtes ne sont pas ajoutés à son moteur dans ce lot. Leur ajout manuel n'est pas une capacité de traduction de C-A.

En-têtes explicitement présents dans le fichier de laboratoire :

```c
#include <stdio.h>
#include <limits.h>
#include <float.h>
```

Extraits C17 de référence, ajoutés explicitement dans le programme de laboratoire, pas générés par une nouvelle commande :

```c
printf("%zu %zu %zu %zu\n", sizeof(int), sizeof(unsigned int), sizeof(float), sizeof(double));
printf("%d %d %u\n", INT_MIN, INT_MAX, UINT_MAX);
printf("%d %d %d %d\n", CHAR_BIT, FLT_RADIX, FLT_DIG, DBL_DIG);
printf("%e %e\n", (double) FLT_MIN, (double) FLT_MAX);
```

sizeof mesure des bytes C de CHAR_BIT bits, pas nécessairement des octets de huit bits. Pour relier le laboratoire aux instructions, l'apprenant peut afficher UINT_MAX et FLT_EPSILON avec les nouvelles formulations et INT_MAX avec l'affichage historique. Il doit distinguer FLT_MIN (minimum positif normalisé), FLT_TRUE_MIN si fourni, FLT_MAX, FLT_EPSILON et les chiffres significatifs utiles. Les macros ne sont pas évaluées par C-A.

Ne pas déduire une tolérance universelle de FLT_EPSILON, ni promettre une égalité exacte à partir d'un affichage arrondi. Les comparaisons programmées et les critères d'erreur seront traités selon les capacités validées ultérieurement ; ce lot permet déjà de raisonner sur les écarts observés. Aucun nouveau mécanisme de mesure ou de compilation dans l'extension.

## 10. Tests d'acceptation et non-régression

1. Déclaration et initialisation pour les quatre types ; sorties exactes, noms et lexèmes conservés ; commentaires intacts ; un fragment ; LF terminal sans sortie supplémentaire. Tester casse des mots français, accents, tabulations et point facultatif.
2. Petits entiers, suffixes u/U, flottants avec/sans f/F, exposants avec/sans signe, zéro et négation ; très grands lexèmes sans passage par Number. Tous les lexèmes hors sous-ensemble sont refusés avec plage entière ; ne pas imposer la représentabilité de la cible dans le traducteur.
3. AST numérique et génération entièrement parenthésée pour -f, -(a+b), a * -b, casts simples et imbriqués, priorité des casts/négations, (double)a/b et (double)(a/b). Groupement non confondu avec un cast ; aucun typedef déduit.
4. Sorties exactes de %u, %.0f, %.20f, %.0e, %.20e, et précisions intermédiaires ; aucune valeur par défaut ; aucune interpolation de format libre ou injection. Même code de format pour une variable float et une variable double ; absence de cast ajouté par printf.
5. Tous les diagnostics ci-dessus : code, message et intervalle UTF-16 exacts ; caractère astral/demi-surrogate dans nom ou expression ; manque avant point/espaces finaux ; aucun fragment ; priorités stables ; aucun exemple de réponse dans un diagnostic de manque.
6. Seuils de tokens et de profondeur à la limite et de part et d'autre, y compris casts mixtes avec parenthèses/négations ; signe d'exposant non compté comme opérateur. Limites inchangées du lot 6 et contrôle déterministe au premier dépassement.
7. Rejouer tous les résultats historiques. En particulier la branche du lot 6 conserve ses AST, son rendu et ses refus de 1.5, 7u et des casts ; les formulations historiques de déclaration/initialisation et les formats %d/%x/%o/%s restent identiques. Une fixture avant modification doit isoler précisément les nouveaux préfixes dont les diagnostics évoluent.
8. Placement, indentation, LF/CRLF et curseur successif ; contrôle canonique du type demandé, du lexème, du cast, du format et de sa précision ; refus des résultats altérés, pas de nouvelle règle de placement.
9. Session et vrai hôte VS Code : type, expression, conversion ou précision incomplets sans insertion ; correction puis aperçu/confirmation ; annuler/rétablir ; jeton ancien inopérant ; aucune sauvegarde, compilation ou correction automatique.
10. Contrôle TypeScript, suites Node et hôte VS Code. Les résultats réellement obtenus figurent au bilan de livraison ci-dessous.

Les tests du traducteur vérifient le code produit, pas une valeur numérique calculée en JavaScript. Les observations de comportement relèvent des programmes C17 compilés séparément.

## 11. Exercices d'acquisition et recette de domaine à la fin du lot 8

| Atelier | Programme ou comparaison | Critère d'acquisition |
|---|---|---|
| Quatre types, quatre stockages | int n=7, unsigned int u=7u, float f=1.25f, double d=1.25 ; formats explicitement adaptés | L'apprenant justifie type, littéral et format séparément |
| Trois divisions | double recevant 7/2, 7.0/2 et (double)7/2 | Il prédit 3.0, 3.5, 3.5 et localise la conversion |
| Deux positions de cast | (double)(a/b) et (double)a/b avec a=7,b=2 | Il explique pourquoi convertir après le calcul ne le répare pas |
| Réduction et élargissement | double d=0.1 ; float f=(float)d ; double retour=(double)f | Il explique la perte possible et l'impossibilité de recréer les chiffres perdus |
| Réel vers entier | (int)3.75 et (int)-3.75 | Il prédit 3 et -3, distingue troncature et arrondi |
| Signed/unsigned | (unsigned int)-1 ; 1u-2u ; -1+1u | Il relie les résultats à UINT_MAX et aux conversions, sans supposer 32 bits |
| Valeur et affichage | Un même double avec 2 puis 8 décimales ; float 0.1f et double 0.1 avec 17 décimales | Il distingue précision d'affichage, valeur stockée et promotion d'argument ; il documente sa cible plutôt qu'imposer une sortie universelle |
| Bornes de la cible | Laboratoire sizeof, limits.h et float.h | Il relève les mesures, explique les unités, les limites et les hypothèses de représentation |

Les cas exécutés ont des variables initialisées, des arguments printf corrects et des opérations/conversions définies. Les cas incompatibles servent à lire des diagnostics de compilation, sans exécuter un programme à comportement indéfini. Compiler manuellement en C17, par exemple avec GCC -std=c17 -Wall -Wextra -Wformat=2 ; -Wconversion peut être utilisé explicitement pour observer les conversions, sans considérer tout avertissement comme une erreur de C-A. Les options et la version du compilateur doivent figurer au compte rendu.

À la fin du lot 8, la recette du domaine devra regrouper les acquis des lots 6 à 8 : constructions C-A, prédictions, C généré, compilation, exécution, explications et non-régression du parcours. Les vérifications non effectuées restent marquées ouvertes. Le présent contrat ne présume ni les résultats de cette recette ni les fonctionnalités du lot 8.

## 12. Architecture et fichiers du lot livré

Conserver translate(text), les deux statuts et le moteur sans I/O. Ajouter des intentions structurées nouvelles pour déclaration numérique, initialisation numérique et affectation numérique ; paramètres type explicite, nom et AST selon le cas. Ajouter une intention d'affichage de précision explicite, sans changer PRINT_FORMATTED historique ; le nouveau format unsigned peut également être porté par cette intention numérique. Noms internes adoptés : NUMERIC_DECL, NUMERIC_INIT, NUMERIC_ASSIGN, NUMERIC_PRINT.

Un profil numérique reconnaît les nouveaux lexèmes et un nœud cast {type,operand,range}. Les anciens nœuds/paramètres du lot 6 conservent leur structure publique et leurs plages. Les éléments lexicaux numériques sont stockés en chaînes, avec leur écriture originale ; leur reconnaissance n'est pas une analyse de type documentaire. Une petite table fermée décrit types demandables et formats ; les messages restent séparés de la génération. Les exigences du palier 1 sont isolées, sans branche de palier futur.

| Fichier | Mise en œuvre |
|---|---|
| src/translate.ts | Dispatch des nouveaux préfixes, intentions, génération et codes de diagnostic |
| src/numericInstructions.ts (nouveau) | Enveloppes, exigences explicites de type/précision, diagnostics et analyse des nouvelles instructions |
| src/expression.ts | Fichier inchangé ; ses constantes de bornes sont importées par le profil numérique |
| src/numericExpression.ts (nouveau) | Profil numérique, littéraux, casts et rendu, avec AST dédié évitant de changer les résultats du lot 6 |
| test/numeric.test.mjs et test/lot6-compatibility.json (nouveaux) | Catalogue, grammaire, diagnostics, formats et résultats avant modification |
| test/expression.test.mjs, test/arithmetic.test.mjs | Non-régression du lot 6 ; ajout ciblé de tests de partage si nécessaire |
| test/session.test.mjs et test/vscode/suite.cjs | Refus sans insertion et intégration au parcours inchangé |
| package.json | Inclure les nouvelles suites, sans dépendance supplémentaire |
| Documents de référence et recette de domaine | Marquer les capacités disponibles seulement après livraison et garder les observations manuelles distinctes |

src/planPlacement.ts, src/placementLexical.ts, les contrôleurs/widgets de production de l'extension et .vscode/tasks.json sont inchangés, avec vérification d'empreinte avant/après. Aucune modification de l'installation VS Code personnelle. Aucun compilateur embarqué, nouveau réglage public, serveur ou dépendance d'exécution.

## 13. Décisions approuvées

1. Les quatre types, le périmètre sans contrôle sémantique et le sous-ensemble de littéraux : décimaux C usuels, suffixes u/U et f/F, exposants ; autres bases et types exclus.
2. Les formulations génériques de déclaration/initialisation et la branche « résultat numérique » préservant exactement le lot 6.
3. Les casts C explicites dans les guillemets ; aucune conversion, suffixe ou type ajouté ; conversions implicites du C enseignées comme telles.
4. %u, notation fixe/scientifique avec précision obligatoire 0..20 ; aucun %g, %lf distinct ou format libre demandé à C-A.
5. Les diagnostics, leurs priorités, les plages UTF-16 et le comptage 1 024 tokens / 64 niveaux incluant les casts du nouveau profil.
6. Laboratoire de représentation avec ajouts manuels explicites limits.h/float.h, sans élargir la commande d'inclusion ni ajouter sizeof au moteur.
7. Les exercices/critères de maîtrise et la recette complète du domaine regroupée à la fin du lot 8.

## 14. Sources techniques et limites d'application

Les règles ciblent C17, avec pour repères normatifs les sections 6.2.5/6.2.6 (types/représentation), 6.3.1.3 à 6.3.1.8 (conversions), 6.4.4 (constantes), 6.5.2.2 (promotions d'arguments), 6.5.4 (casts) et 7.21.6.1 (printf). Les choix de sous-ensemble, de formulation et de précision 0..20 sont des choix validés de C-A, pas des restrictions de C17.

Sources primaires d'explication consultées : [constantes flottantes GNU](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Floating-Constants.html), [conversions explicites GNU](https://www.gnu.org/software/c-intro-and-ref/manual/c-intro-and-ref.html#Explicit-Type-Conversion), [types communs et promotions GNU](https://www.gnu.org/software/c-intro-and-ref/manual/c-intro-and-ref.html#Common-Type), [formats flottants glibc](https://sourceware.org/glibc/manual/2.27/html_node/Floating_002dPoint-Conversions.html), [formats entiers glibc](https://sourceware.org/glibc/manual/2.27/html_node/Integer-Conversions.html), [conversions depuis les flottants, documentation C de Microsoft](https://learn.microsoft.com/en-us/cpp/c-language/conversions-from-floating-point-types?view=msvc-170), [précision d'évaluation GCC](https://gcc.gnu.org/onlinedocs/gcc/Floating-point-implementation.html).

Les particularités GNU/MSVC et extensions de ces manuels ne deviennent pas des garanties de C17. En particulier, aucune taille IEEE usuelle ou représentation signée propre à une cible n'est généralisée. Le lot 7 est maintenant implémenté. Ces particularités ne sont pas ajoutées au catalogue ; les capacités livrées sont celles du contrat approuvé.

La règle du modificateur l sans effet sur f est également vérifiable dans le [projet historique WG14 N843, fprintf](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n843.htm) ; ce document ancien n'est pas présenté comme le texte de C17.

## 15. Bilan de livraison

Contrôle TypeScript sans diagnostic ; **1 530 tests Node réussis, 0 échoué, 0 ignoré ; 45 tests hôte VS Code Windows 1.96.4 réussis, 0 échoué**, soit **1 575 réussis**. Les suites historiques sont conservées, complétées par numeric.test.mjs et une fixture de 57 résultats du lot 6 capturés avant modification. Les scénarios de l'hôte couvrent aperçu, confirmation, curseur et refus sans insertion.

Aucune nouvelle recette manuelle du domaine ni compilation C17 n'est revendiquée ; GCC n'est pas accessible dans le terminal de cette session. La recette complète sera effectuée après le lot 8. Les avertissements mutex/N-API de l'hôte portable sont consignés dans DECISIONS.md : rapport 45/0 et sortie 0, origine précise à qualifier. Les limites sémantiques, de représentation et de précision restent celles décrites plus haut. Aucun lot 8 n'est commencé et aucune règle de palier futur n'est inventée.
