# Lot 11 — Boucles et répétitions : découpage proposé et contrat du premier incrément

**Statut au 12 novembre 2026 : découpage et contrat 11A approuvés par le porteur, 11A implémenté.** Voir le [bilan du lot 11A](LOT11A_BILAN.md). Les sections 1 à 3, 5, 7 à 9 de ce document constituent le contrat exécuté ; la section 4 reste une liste de candidates **non approuvées** et la section 6 décrit un travail **non commencé**. Les incréments 11B, 11C et 11D exigent chacun leur propre contrat, leur propre autorisation et leur propre bilan.

*Statut d’origine, 7 novembre 2026 : proposition documentaire à valider, aucune implémentation autorisée ou commencée. Les lots 1 à 10 étaient alors les seuls livrés.* Les résultats rapportés du lot 10 (1 983 tests Node et 68 hôte, aucun échec, TypeScript sans diagnostic) sont historiques, pas de nouveaux passages.

Trois travaux restent explicitement ouverts : la recette GCC complète Expressions et calculs ; la [recette manuelle du lot 10](RECETTE_LOT10.md), à intégrer à la recette finale du domaine 3 ; la qualification mutex/N-API de l'hôte VS Code. Aucun code applicatif, test, configuration, dépendance ou tâche VS Code n'est modifié pendant cette préparation.

## 1. Découpage recommandé : quatre incréments, pas un lot monolithique

Les suffixes 11A–11D sont des repères proposés à valider, pas des numéros réservant les domaines futurs. Une autre numérotation reste possible. Chaque incrément nécessite son autorisation et son bilan propres ; approuver le premier n'autorise pas les trois suivants.

| Incrément proposé | Compétences et dépendances | Différence technique qui justifie la séparation | Preuve pédagogique |
|---|---|---|---|
| **11A — while, premier contrat détaillé ici** | Test initial, zéro/non-zéro, condition de poursuite, initialisation et progression explicites par instructions existantes, traces, invariant/variant simples, imbrication et if dans la boucle | Réutiliser Condition et le placement d'un bloc complet vide ; aucun rattachement à une boucle existante nécessaire | Prévoir 0, 1 et plusieurs tours ; remplir soi-même le corps et expliquer pourquoi la progression atteint l'arrêt |
| **11B — test final do/while** | Dépend de 11A ; distinguer le moment du test et la première exécution si la boucle est atteinte | Bloc avec condition après la fermeture et point-virgule obligatoire ; distinguer sa terminaison de l'accolade seule attendue par certains reconnaisseurs | Comparer while et do/while pour une condition initialement fausse ; ne pas confondre corps exécuté et condition atteinte en présence de transferts futurs |
| **11C — for et progression structurée** | Dépend de 11A ; réemploie expressions/conditions et comparaison avec 11B | Trois clauses explicites, budgets communs à définir, grammaire bornée d'initialisation/mise à jour, choix de déclarer ou non le compteur ; pas de simple copie libre d'une ligne C | Expliquer initialisation une fois, test avant chaque tour, progression après le corps ; bornes et erreurs d'une unité |
| **11D — break/continue et cible englobante** | Après les trois formes : comprendre les points de reprise distincts et les imbrications | Reconnaissance contextuelle bornée de la boucle englobante ; break doit distinguer boucle et switch ; aucune recherche de cible depuis l'indentation | Identifier la structure quittée ou reprise ; montrer comment continue peut sauter une progression manuelle et empêcher l'arrêt |

Le découpage suit les contrats de comportement, pas le nombre de mots-clés : 11A comprend déjà répétition, progression, terminaison raisonnée, imbrication et conditions composées. 11D regroupe deux instructions parce qu'elles partagent le besoin de preuve contextuelle et exigent la compréhension préalable des trois points de reprise. Regrouper 11B et 11C serait envisageable, mais cumulerait le nouveau point de test et un nouveau langage de clauses ; je recommande de conserver deux validations courtes. Un lot unique est faisable techniquement, mais trop large pour isoler les régressions de génération, rattachement et transfert de contrôle.

La subdivision ne restreint pas les compétences selon un palier de liberté. Tous les paliers ont vocation à donner accès aux mêmes constructions dans les capacités prises en charge ; seuls les choix d'interaction diffèrent. Aucun palier futur n'est défini ici. switch et return ne sont pas ajoutés à ces incréments par anticipation.

## 2. Référentiel d'acquisition et limites de responsabilité

Le premier incrément doit permettre de décrire séparément : valeur initiale, condition de poursuite, condition d'arrêt par fausseté, corps, progression et état après sortie. Un while peut exécuter zéro tour. Le test est repris avant chaque tour ; l'ordre des instructions du corps reste celui du document. L'étudiant explique aussi qu'une condition vraie n'est pas synonyme de progression.

Une condition composée conserve la précédence et le court-circuit des lots 9–10. Une variable locale créée dans un corps est soumise aux portées du C : A ne déplace pas sa déclaration ni ne rend sa valeur persistante d'un tour à l'autre. L'imbrication ajoute des cycles distincts ; le compteur intérieur doit être réinitialisé explicitement si le programme le demande.

Terminaison : demander une prévision, un invariant simple et une quantité qui décroît vers une borne, sous des hypothèses écrites sur les valeurs/types. Aucun calcul général, recherche d'affectations dans le document ou preuve automatique. Une mise à jour peut dépendre d'une branche, être modifiée manuellement ou ne jamais être atteinte : sa présence textuelle ne suffit pas à garantir l'arrêt. Le dépassement d'entier et les conversions peuvent invalider un raisonnement mathématique. Ne pas assimiler un essai qui s'arrête à une preuve pour toutes les entrées.

La distinction test initial/test final sera enseignée au 11B ; la reprise de continue au 11D. Ces compétences font partie de l'objectif du domaine, mais ne sont pas annoncées acquises ou disponibles au 11A.

## 3. Premier incrément : formulation et sortie exactes proposées

Nouvelle intention **WHILE** :

```text
Crée une boucle tant que "{condition}".
```

Exemple exact de fragment traduit, avec LF terminal et quatre espaces sur la ligne intérieure :

```c
// Crée une boucle tant que "i < limite".
while (i < limite) {
    
}
```

| Saisie de condition | Première ligne C, avant adaptation d'indentation |
|---|---|
| `i < limite` | `while (i < limite) {` |
| `actif` | `while (actif) {` |
| `0` | `while (0) {` |
| `1` | `while (1) {` |
| `i + 1 < limite` | `while ((i + 1) < limite) {` |
| `i < limite && !suspendu` | `while (((i < limite) && (!suspendu))) {` |
| `a || b && c` | `while ((a || (b && c))) {` |
| `!a == b` | `while ((!a) == b) {` |
| `!(a == b)` | `while ((!(a == b))) {` |

La condition est exactement celle du lot 10, y compris ses restrictions numériques, comparaisons non chaînées, !/&&/||, casts et règles de rendu. Ne pas introduire un profil plus permissif pour les boucles. Les guillemets délimitent une condition, jamais une chaîne C.

Règles lexicales historiques : point final facultatif et attaché au guillemet fermant ; mots fixes insensibles à la casse avec accents exigés ; espaces/tabulations ordinaires entre les mots et en périphérie ; une seule ligne ; identifiants et paramètres sensibles à la casse selon les règles existantes. La phrase originale entière reste dans le commentaire, sans normalisation ni correction.

Un seul fragment primary, code et texte en LF à la traduction, cursor relatif après les quatre espaces intérieurs comme pour IF. Pas de point-virgule après while ou après la fermeture. Aucun main, en-tête, compteur, initialisation, incrément, affectation ou instruction de sortie ajouté. La ligne blanche est un emplacement pédagogique à remplir, pas une progression générée.

Une condition constante ou un nom inconnu reste traduisible : `while (1)` n'est ni remplacé ni refusé comme une erreur de compréhension. Un corps vide ne constitue pas une invitation à exécuter le programme incomplet ; la recette prévoit son remplissage et sa revue avant toute exécution. A ne choisit pas « jusqu'à » comme synonyme : transformer une condition d'arrêt en condition de poursuite impliquerait une négation non demandée.

## 4. Formulations candidates des incréments suivants — non contractuelles à ce stade

Ces formulations servent à vérifier la cohérence du découpage ; elles devront avoir leurs propres règles/diagnostics approuvés avant implémentation.

| Incrément | Formulation candidate | Exemple de code attendu, corps vide |
|---|---|---|
| 11B | `Crée une boucle avec test final tant que "i < limite".` | `do {` puis ligne intérieure puis `} while (i < limite);` |
| 11C | `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | `for (i = 0; i < 3; i = (i + 1)) {` puis ligne intérieure puis `}` |
| 11D | `Sors de la boucle la plus intérieure.` | `break;`, seulement si la cible effective est prouvée être cette boucle |
| 11D | `Passe à l'itération suivante de la boucle la plus intérieure.` | `continue;`, seulement si une boucle englobante prise en charge est reconnue |

Le candidat for utilise une variable explicitement nommée et déjà déclarée par l'étudiant ; il n'invente pas son type ni sa déclaration. Les deux affectations d'en-tête correspondent aux champs explicitement demandés. Pas de ++, valeur initiale 0 ou pas 1 par défaut ; pas de clause vide interprétée automatiquement comme vrai. La possibilité d'une déclaration dans l'en-tête, la portée du compteur, les champs absents et le budget commun des trois clauses restent à valider au contrat 11C.

Pour do/while, la condition est donnée à la création : ne pas demander plus tard au moteur de retrouver un do ouvert à fermer automatiquement. La structure complète reste le modèle ; le point-virgule après la condition est syntaxique, pas une instruction ajoutée implicitement.

## 5. Placement, indentation et code existant au 11A

Réutiliser planPlacement et son traitement de structure complète, en ajoutant WHILE à la liste canonique actuellement MAIN/IF/ELSE_IF/ELSE. Le rendu du bloc while a les mêmes trois lignes que IF : en-tête, ligne intérieure, fermeture. Aucun besoin d'un analyseur général des corps ni d'un état persistant de boucle.

1. Cible unique : une ligne contenant seulement espaces/tabulations. Remplacer cette ligne entière et son EOL éventuel, comme actuellement. EOF occupée refusée ; ligne blanche à EOF sans EOL admissible.
2. Soit B l'indentation complète de la cible et U l'indentUnit capturé. Commentaire, en-tête et fermeture reçoivent B ; ligne intérieure B+U. Ne pas déduire B depuis des accolades. Curseur après B+U sur la ligne intérieure.
3. Aucune ligne de saisie créée après la fermeture. Une instruction simple suivante remplace la ligne intérieure et laisse sa ligne de saisie ordinaire ; pas de concaténation ni accumulation automatique de lignes blanches.
4. Un while intérieur est créé par une nouvelle demande au curseur intérieur. Son corps reste vide, sa fermeture est propre ; la fermeture extérieure et tout le suffixe restent inchangés. Pour revenir au corps extérieur, l'utilisateur place/crée explicitement une ligne blanche au bon endroit.
5. Dans IF/ELSE_IF/ELSE, les mêmes règles s'appliquent. Un if et sa chaîne peuvent être insérés dans le corps du while avec les règles du lot 10. Ajouter ELSE après la fermeture d'un while reste refusé : while n'est pas une chaîne if et A ne remonte pas à un if voisin.
6. Conserver LF/CRLF, repli EOL, frontières UTF-16, contrôle du préfixe lexical, vérification canonique des fragments et fraîcheur d'aperçu. Une seule modification annulable par confirmation. La création du bloc et l'insertion de son contenu sont des opérations distinctes.
7. Texte avant/après exactement conservé hors de la ligne remplacée. Aucun contenu adjacent absorbé dans la boucle, aucune accolade ancienne déplacée ou supprimée. Le document modifié manuellement reste la source de vérité.

Comme IF au lot 9, WHILE n'a pas besoin d'une preuve de portée pour sa création documentaire : un while global, un nom absent ou un type incompatible peut être traduit et placé si la ligne est lexicalement admissible. Ces erreurs C ne sont pas des impossibilités de placement. Cette règle ne rend pas légale une insertion d'instruction entre un if et son else : les placements ordinaires ne réparent pas l'association du programme. Le contrôle renforcé du lot 10 reste propre à l'ajout de branches ; pas de nouvelle analyse globale appliquée silencieusement aux intentions historiques.

## 6. break/continue : pourquoi le contexte doit attendre

Une traduction isolée de ces mots-clés ne prouve pas qu'ils contrôlent la boucle voulue. Un if ne constitue pas une cible de break ou continue ; une boucle intérieure intercepte ces transferts, qui ne doivent pas être présentés comme visant l'extérieur.

En C17, break quitte le plus petit switch ou la plus petite boucle qui l'englobe ; continue concerne la plus petite boucle englobante. Un switch écrit manuellement peut donc empêcher `break;` de réaliser la phrase « sors de la boucle ». Il faudra refuser ce cas, pas réécrire en goto ni supposer que switch est absent parce que C-A ne le génère pas. continue dans un switch situé dans une boucle vise la boucle, mais ne sera accepté que si le reconnaisseur borné de 11D sait l'établir.

La reprise n'est pas identique : while revient au test initial ; do/while atteint le test final ; for atteint sa progression, puis son test. Un continue avant une progression manuelle située plus bas dans un while peut la sauter. C-A ne déplace pas cette progression et ne l'ajoute pas avant continue. break et continue n'ont pas la signification de return.

11D exigera un reconnaisseur contextuel distinct de la résolution de fin de chaîne du lot 10 : pile de structures englobantes et délimiteurs, boucles bracées identifiées, frontières de fonction et switch, commentaires/littéraux ignorés, bornes, refus d'ambiguïté et de contexte non pris en charge. Une simple profondeur d'accolades ou le dernier mot while ne suffit pas. Rien de ce reconnaisseur ni de ces instructions n'est requis ou implémenté au premier incrément.

Référence de sémantique : [continue en C, Microsoft](https://learn.microsoft.com/en-us/cpp/c-language/continue-statement-c?view=msvc-170). Les règles de reprise sont enseignées sans exécuter de cas potentiellement non terminant.

## 7. Diagnostics, informations, avertissements et limites du 11A

Réutiliser les codes du lot 10 pour la condition, avec les nouveaux décalages d'enveloppe. Un diagnostic bloquant prioritaire, category understanding, plages absolues [début, fin) UTF-16 dans la phrase originale. Aucun code applicable en cas de refus ; la nouvelle intention n'autorise pas la traduction partielle de la condition ou du corps.

| Cas | Diagnostic proposé | Plage |
|---|---|---|
| Condition absente ou vide | MISSING_CONDITION, « Il manque la condition de la boucle. » | Absence vide avant le point éventuel ou le guillemet fermant |
| Condition non délimitée | MISSING_CONDITION_DELIMITER | Point d'ouverture attendu, sans recadrer une expression libre |
| Guillemets ouverts | UNTERMINATED_CONDITION | Du guillemet ouvrant à la fin utile, sans retirer un point appartenant à la condition non fermée |
| Droite de &&/|| ou opérande de ! absent | MISSING_OPERAND | Vide devant le token fautif ou à la fin utile |
| Affectation =, comparaison chaînée, opérateur exclu | Codes historiques du lot 10, messages conservés | Opérateur ou sous-arbre fautif ; aucune réparation |
| Identifiant, littéral, parenthèse, séparateur, suffixe invalide | Codes historiques applicables | Plages originales sans normalisation |
| Budget dépassé | EXPRESSION_TOO_COMPLEX | Premier token qui dépasse la borne ; pas d'AST partiel applicable |

Oracles UTF-16 à automatiser après autorisation :

| Phrase exacte | Attendu proposé |
|---|---|
| `Crée une boucle tant que` | MISSING_CONDITION [24,24) |
| `Crée une boucle tant que "".` | MISSING_CONDITION [26,26) |
| `Crée une boucle tant que "i &&".` | MISSING_OPERAND [30,30) |
| `Crée une boucle tant que "i = 3".` | ASSIGNMENT_IN_CONDITION [28,29) |
| `Crée une boucle tant que "A😀B < 3".` | INVALID_IDENTIFIER [26,30) |
| `Crée une boucle tant que "i < 3` | UNTERMINATED_CONDITION [25,31) |

Limites : même budget global de 1 024 tokens et 64 niveaux de parenthèses, !, négations et casts pour toute la condition ; pas de remise à zéro entre termes. Nombres gardés textuellement, sans conversion Number ; aucune évaluation, simulation, recherche de symboles/types ni analyse de toutes les affectations du document. Aucun nouveau plafond global de nombre de boucles dans le document n'est ajouté au placement ordinaire. Les bornes du reconnaisseur de branches restent propres aux opérations ELSE_IF/ELSE.

Étendre analyzeCalculations et explainConditions au nouvel AST WHILE, sans nouveaux motifs de calcul : avertissements du lot 8 dans tous les sous-arbres, y compris à droite d'un court-circuit ; informations &&/||/! passives inchangées. Une condition dangereuse reste traduite fidèlement avec son avis non bloquant. Le corps n'existe pas dans la traduction de création : il n'est ni analysé ni évalué à partir du document.

Information supplémentaire proposée, à approuver : WHILE_PRETEST, severity information, localisée sur la plage de la condition sans guillemets, dans « C-A — Pédagogie ». Message : « La condition est testée avant chaque itération ; le corps peut ne jamais être exécuté. Aucune progression ni terminaison n'est déduite. » Aucun Warning « boucle infinie », « progression manquante », « arrêt garanti » ou compte d'itérations calculé. Ne pas changer le compteur de Warning ni ouvrir le canal automatiquement. L'absence d'avis n'est jamais un certificat d'arrêt ou de sûreté.

Les diagnostics de placement/intégration restent distincts et concernent le document, pas la saisie. Le diagnostic MISSING_CONDITION signifie une phrase incomplète ; l'absence de progression dans un bloc volontairement vide n'est pas une erreur de compréhension. Les changements manuels du document ou des réglages invalident l'aperçu sans déplacement de cible.

Nuance C17 pour la formation : le comportement d'une boucle sans effet observable ne doit pas être présenté comme une expérience portable de blocage. Certaines boucles à condition non constante, sans E/S, accès volatile ou opérations atomiques/synchronisation, peuvent être supposées terminantes par l'implémentation (règle 6.8.5). Voir [discussion WG14 C11/C17, issue 0436](https://open-std.org/JTC1/SC22/WG14/issues/c11c17/issue0436.html). Cette règle ne justifie aucune analyse ou transformation dans C-A ; les exercices risqués restent sur papier, et le programme exécuté doit être complet et revu.

## 8. Architecture minimale et plan de tests

Ajouter WHILE avec parameters.condition: Condition à Instruction ; garder les anciens champs/rendus strictement identiques. Réutiliser parseCondition/renderCondition ; enveloppe française spécifique et rendu `while (...)` seulement. Ajouter WHILE à la liste des blocs canoniques à curseur intérieur ; conserver retraduction et plan pur. Le contrôleur, le diff et l'application restent génériques ; adaptation d'aide et tests, pas une nouvelle interface. Aucune API VS Code dans les moteurs, aucune dépendance ni intégration GCC.

| Groupe de tests futurs | Exigences |
|---|---|
| Traduction | Condition simple/directe/composée, négations/casts, exemples du §3, constantes 0/1, noms non déclarés ; aucun ajout implicite ; commentaire exact ; point/casse/tabulations ; sérialisation et déterminisme |
| Refus et UTF-16 | Six oracles du §7, accents décomposés, astral et unités isolées, séparateurs, guillemets, suffixes et tentative de deuxième instruction ; mêmes exclusions que IF ; aucune insertion partielle |
| Budgets | 1 024/1 025 tokens et 64/65 niveaux combinés, conditions binaires longues, littéraux très grands préservés ; aucune nouvelle limite par sous-terme |
| Placement | Fichier vide, ligne blanche à EOF sans EOL, EOF occupée, ligne de commentaire/code ; espaces/tabulations, LF/CRLF, repli EOL ; curseurs exacts et données gelées |
| Séquences | MAIN → initialisations → WHILE → plusieurs instructions ; while dans if/else ; if/chaîne dans while ; deux while imbriqués ; retour explicite au corps extérieur et code après la boucle |
| Préservation | Préfixe/suffixe et accolades anciennes exactement inchangés ; pas de code absorbé ni ligne extérieure ajoutée ; ELSE après WHILE refusé sans remonter à un if voisin |
| Invariants | Source, AST, commentaire, code et curseur falsifiés refusés ; plans périmés ; document/curseur/EOL/options changés ; pureté/déterminisme |
| Pédagogie | Motifs du lot 8 conservés, court-circuit sans suppression d'avis, information WHILE_PRETEST séparée des Warning si approuvée ; pas de détection automatique de terminaison |
| Hôte | Même parcours natif, document non enregistré, diff exact, confirmation unique, fermeture/changement d'éditeur, annuler/rétablir bloc puis contenu, informations sans prise de focus |
| Non-régression | Base rapportée du lot 10 : 1 983 tests Node et 68 hôte ; sorties historiques inchangées, refus de do/for/break/continue maintenus ; TypeScript sans diagnostic attendu après implémentation |

Aucun test de terminaison du programme utilisateur n'est ajouté : pas d'exécution du C dans le moteur, pas de timeout présenté comme preuve d'arrêt. Les tests applicatifs ne sont pas lancés pour cette préparation documentaire.

## 9. Projet pédagogique et recette finale du domaine 3

**Projet progressif : classer une série de valeurs fixées, sans tableau ni saisie interactive.** Premier jalon réalisable après 11A seulement : créer explicitement stdio.h et MAIN ; initialiser `i` à 0 et `limite` à 3 ; demander la boucle `i < limite`. Dans son corps, construire la chaîne IF `i == 0`, ELSE_IF `i == 1`, ELSE, puis leurs affichages explicites « début\n », « milieu\n », « fin\n ». Après la chaîne et toujours dans la boucle, demander explicitement `Affecte à i le résultat de "i + 1".` La création des lignes de saisie après les fermetures reste manuelle.

Les données du programme sûr restent de petits int (limite 0, 1 ou 3). Avant toute éventuelle exécution, vérifier que la progression est hors de toutes les branches mais dans la boucle, et que le programme est entièrement rempli. Les seules sorties proposées sont des prévisions, pas des résultats observés ici :

| limite fixée | Tours prévus | Affichages prévus, retours explicitement demandés |
|---:|---:|---|
| 0 | 0 | Aucun affichage du corps |
| 1 | 1 | début |
| 3 | 3 | début, milieu, fin |

L'apprenant explique l'invariant 0 ≤ i ≤ limite pour ces données, le variant limite−i qui diminue de 1 à chaque tour terminé, et pourquoi ces calculs restent représentables dans ce programme précis. Rien de ce raisonnement n'est fait par C-A. Une progression placée dans une seule branche ou omise est étudiée sur papier, sans lancer le programme incomplet. Les limites générales des types ne sont pas extrapolées des petites valeurs.

Deuxième exercice 11A : ajouter une boucle intérieure sur `j < 2`, avec remise à zéro explicite de j au début de chaque tour extérieur, progression j dans l'intérieur et progression i après sa fermeture. Prévoir 3×2 passages pour limite=3 ; identifier les niveaux d'indentation et les variables dont l'état doit changer. Réutiliser une condition composée avec un indicateur fixé et expliquer le court-circuit sans exécuter une opération dangereuse.

Jalons ultérieurs, non disponibles au 11A : au 11B comparer l'entrée de corps avec condition initialement fausse ; au 11C écrire l'en-tête for entièrement explicite et justifier son équivalence sous hypothèses ; au 11D expliquer puis tester sur un exemple sûr break/continue dans des imbrications. Ne pas demander la sortie d'une boucle extérieure par un break visant une boucle intérieure. Ne pas transformer le projet en dépendance à une saisie, une bibliothèque ou un mécanisme d'arrêt non encore livré.

### Matrice de recette finale du domaine 3, encore ouverte

- Lot 9 : deux gestes confirmés manuellement ; le référentiel complet ne l'est pas.
- Lot 10 : [protocole existant](RECETTE_LOT10.md) à intégrer et à effectuer, dont précédence, court-circuit, choix de racine, branches progressives, refus, péremption et annulation.
- 11A proposé : prévision/trace pour 0/1/plusieurs tours, progression et imbrication ; validations physiques du curseur et du focus.
- 11B–11D proposés : test final, clauses for et transferts, seulement après contrats et implémentations distincts.
- Commun : dossier entrées/prévisions/chemins/observations/conclusions avec environnement, messages et LF/CRLF. Une compilation manuelle future du seul programme sûr ne clôt pas rétroactivement la recette GCC Expressions et calculs.

Les critères d'acquisition sont la capacité à produire **et expliquer** chaque chemin et chaque reprise, le choix d'un test initial/final, l'initialisation/progression explicites et la justification d'arrêt sous hypothèses. La réussite des seuls tests de C-A ne constitue pas cette acquisition. Aucun nouveau résultat manuel, GCC ou de tests automatisés n'est revendiqué dans cette préparation.

## 10. Décisions à valider avant tout code

1. Subdivision en 11A/11B/11C/11D et convention de numérotation ; approuver d'abord while seul, sans do/for ni transfert.
2. Formulation WHILE et sorties exactes, réutilisation stricte de Condition du lot 10, acceptation fidèle des conditions constantes et absence d'initialisation/progression implicites.
3. Placement ordinaire de structure canonique, curseur intérieur, imbrication sans analyse générale des portées, règles de préservation et exclusions inchangées.
4. Réemploi des avertissements/informations existants et ajout proposé de WHILE_PRETEST au canal passif ; aucun avertissement automatique de terminaison ou de progression manquante.
5. Projet à petits entiers, critères d'acquisition, intégration de la recette lot 10 à la recette finale du domaine 3 et maintien des trois suivis ouverts. Les formulations candidates des incréments suivants ne sont pas approuvées par anticipation.
