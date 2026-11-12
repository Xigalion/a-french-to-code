# A — Documentation fondatrice

**Version :** 0.1 — 23 octobre 2026  
**Statut :** document vivant, destiné à guider le développement et à préparer une documentation publique.  
**Périmètre actuel :** C-A, assistance à la programmation en C17 dans Visual Studio Code.

> **Principe directeur :** A doit aider à programmer et à comprendre les décisions prises, tout en permettant, selon le palier de liberté choisi, de déléguer davantage de ces décisions. Le résultat réalisable ne doit pas dépendre du palier.

## 1. Pourquoi créer A ?

Apprendre un langage de programmation implique deux difficultés distinctes : comprendre **ce que l'on souhaite faire** et connaître **la syntaxe permettant de le faire**. Au début, la syntaxe peut monopoliser l'attention au détriment du raisonnement. À l'inverse, un outil qui écrit tout le programme sans explication peut masquer les mécanismes qu'il faudrait apprendre.

A cherche une voie intermédiaire : permettre d'exprimer des intentions de programmation en français contrôlé, puis de voir précisément leur traduction dans un langage existant. L'objectif n'est ni de remplacer le langage cible ni de dispenser de l'apprendre, mais de rendre explicite le lien entre intention, code et comportement.

A est également pensé pour des utilisateurs plus expérimentés : lorsque les mécanismes sont compris, ils doivent pouvoir travailler plus vite, avec moins de précisions obligatoires, sans perdre la possibilité de reprendre le contrôle.

## 2. Qu'est-ce que A ? Et qu'est-ce que C-A ?

**A** désigne le projet général : une approche d'assistance à la programmation susceptible de s'appliquer à plusieurs langages.

**C-A** est sa première déclinaison, consacrée au **C17**. C-A ne constitue **pas un nouveau langage de programmation** : il génère du C ordinaire, dans des fichiers `.c`, qui peuvent ensuite être compilés avec un compilateur C tel que GCC.

D'autres déclinaisons pourront être étudiées plus tard, sans présumer de leur réalisation ni de leur calendrier.

## 3. Deux dimensions à ne jamais confondre

### 3.1. Compétences : ce que l'on apprend à maîtriser

Les compétences suivent des parcours pédagogiques : variables, expressions, structures de contrôle, mémoire, architecture logicielle, etc. Elles progressent selon les objectifs de l'apprenant et les domaines d'application du C.

### 3.2. Liberté : ce que l'on choisit de déléguer

Les **paliers de liberté** déterminent le degré de précision demandé à l'utilisateur et les décisions que A peut prendre en son nom. Ils ne constituent **ni un classement de compétence ni une limite sur les programmes réalisables**.

**Invariant fondamental :** un même résultat doit pouvoir être obtenu quel que soit le palier. Le chemin peut être plus détaillé à un palier et plus concis à un autre, mais le palier ne doit pas réserver certaines capacités de programmation à certains utilisateurs.

- **Palier 1 — précision pédagogique (actuel) :** chaque décision pertinente doit être exprimée. Si une information nécessaire manque, A indique **ce qui manque**, sans proposer une liste de réponses toutes faites et sans choisir silencieusement. Une demande incomplète ne produit pas de code applicable.
- **Palier 2 — liberté accrue (futur) :** pour des utilisateurs déjà à l'aise avec les mécanismes précédents, A pourra accepter des formulations plus concises et prendre certaines décisions par défaut. L'utilisateur pourra toujours expliciter ces décisions lorsqu'il le souhaite.
- **Palier 3 — futur :** son fonctionnement détaillé relève des décisions antérieures du projet et devra être repris de sa définition de référence avant d'être documenté ou implémenté. Ne pas en inventer les règles.

**Clarification lors du lot 6 :** aucune définition détaillée de référence du palier 3 n'a été retrouvée dans les documents présents. La mention précédente n'en établit donc aucune ; aucune règle n'est inventée ou implémentée.

Ces paliers représentent un **choix d'interaction**, pas un prérequis imposé par le niveau scolaire ou professionnel.

## 4. Principes de conception

1. **Le code source est la référence.** L'utilisateur peut lire, modifier et compiler le C généré.
2. **Traçabilité.** Chaque traduction insère immédiatement au-dessus du fragment C un commentaire `//` contenant exactement la phrase française d'origine.
3. **Pas de modification silencieuse au palier 1.** Aucun en-tête, `main`, `return`, variable, correction ou format d'affichage n'est ajouté sans demande explicite.
4. **Refus explicites.** Une demande incomprise, incomplète ou incompatible avec le contexte d'insertion ne doit pas générer un fragment partiel.
5. **Séparation des responsabilités.** Compréhension de l'intention, exigences du palier, génération C, placement dans le fichier et diagnostics doivent rester conceptuellement distincts.
6. **Compatibilité.** Les instructions déjà reconnues ne sont pas supprimées ou modifiées sans nécessité forte et décision documentée.
7. **Contrôle de l'utilisateur.** L'insertion suit un aperçu et une confirmation ; A ne déplace pas automatiquement le code vers un autre endroit.
8. **Pédagogie sans devinette.** En cas de manque, indiquer l'information absente plutôt que proposer des choix à sélectionner au hasard.
9. **Évolution incrémentale.** Définir un contrat, développer un lot limité, exécuter les tests automatiques, puis vérifier manuellement l'expérience.

## 5. Comment C-A fonctionne aujourd'hui

Dans le prototype actuel, l'utilisateur ouvre un fichier `.c` dans **VS Code**, place le curseur sur une **ligne vide**, puis lance la commande **« C-A : Saisir une instruction »** (raccourci Windows : `Ctrl+K`, puis `A`).

Le parcours est le suivant :

1. Saisir une instruction française appartenant au catalogue reconnu.
2. Lire le résultat de traduction ou, en cas de refus, le diagnostic français.
3. Examiner l'aperçu des modifications du fichier.
4. Choisir **Insérer**, **Modifier la phrase** ou **Annuler**.
5. Retrouver le code C inséré à l'emplacement choisi, avec la phrase française en commentaire.

Le prototype utilise actuellement une boîte de saisie ponctuelle : il faut rouvrir la commande pour l'instruction suivante. Une interface plus persistante est envisagée, mais n'est pas encore développée.

**Limites actuelles :** insertion sur ligne blanche uniquement ; contrôles lexicaux conservateurs ; aucune compilation automatique ; aucune vérification automatique de l'existence ou du type des variables ; aucun ajout automatique de bibliothèques. Les erreurs propres au C peuvent être révélées plus tard par le compilateur.

## 6. Catalogue actuellement disponible (lots 1 à 7)

Les phrases ci-dessous sont des exemples des formulations reconnues. Le point final est facultatif dans les formes prises en charge.

| Intention en français | Fragment C produit |
|---|---|
| `Crée la fonction principale.` | `int main(void) { ... }` |
| `Déclare un entier nommé age.` | `int age;` |
| `Crée un entier nommé age de valeur 20.` | `int age = 20;` |
| `Affecte la valeur 25 à age.` | `age = 25;` |
| `Affecte à resultat le résultat de "a * -b".` | `resultat = (a * (-b));` |
| `Déclare une variable de type double nommée q.` | `double q;` |
| `Crée une variable de type float nommée f avec le résultat de "0.1f".` | `float f = 0.1f;` |
| `Affecte à q le résultat numérique de "(double) 7 / 2".` | `q = (((double) 7) / 2);` |
| `Affiche u en décimal non signé.` | `printf("%u", u);` |
| `Affiche f en notation fixe avec 9 décimales.` | `printf("%.9f", f);` |
| `Affiche q en notation scientifique avec 3 décimales.` | `printf("%.3e", q);` |
| `Inclue la bibliothèque stdio.h.` | `#include <stdio.h>` |
| `Affiche la valeur de age.` | `printf("%d", age);` (formulation historique conservée) |
| `Affiche le texte "Bonjour".` | `printf("%s", "Bonjour");` |
| `Affiche age en décimal.` | `printf("%d", age);` |
| `Affiche age en hexadécimal.` | `printf("%x", age);` |
| `Affiche age en octal.` | `printf("%o", age);` |

Le lot 5 ajoute la reconnaissance de demandes incomplètes :

- `Affiche age.` → **« Il manque le format d’affichage. »** Aucun code inséré.
- `Affiche age en binaire.` → **« Ce format d’affichage n’est pas pris en charge. »** Aucun code inséré.

Le format d'affichage est explicite dans les nouvelles instructions. La formulation historique `Affiche la valeur de age.` reste disponible afin d'éviter une rupture de compatibilité inutile.

Le lot 6 accepte les opérateurs du C +, -, *, /, %, la négation unaire et les parenthèses dans l'expression entre guillemets ASCII. Les guillemets ne produisent aucune chaîne C. Toutes les opérations sont parenthésées dans le code. Limites : 1 024 tokens d'expression et 64 niveaux cumulés de parenthèses/négations. L'analyse est purement syntaxique, sans évaluation ni vérification de l'existence ou du type des variables ; une traduction réussie ne garantit pas une exécution valide. La calculatrice utilise des données fixées dans le programme ; les entrées interactives restent futures.

Le lot 7 ajoute int, unsigned int, float et double dans des déclarations/initialisations explicites, et une branche « résultat numérique » distincte acceptant littéraux numériques et casts. Chaque cast est demandé dans l'expression et rendu parenthésé. Les limites restent 1 024 tokens et 64 niveaux, en comptant les casts du nouveau profil. Les affichages flottants exigent une précision de 0 à 20 ; celle-ci ne garantit pas la précision de stockage. printf reçoit les float promus en double par le C, sans cast ajouté par C-A. Aucun type, suffixe, cast ou format manquant n'est inventé. Les conversions implicites normales du C restent applicables ; une conversion flottant vers entier hors plage peut provoquer un comportement indéfini. Le laboratoire utilise limits.h et float.h ajoutés manuellement dans le C, sans élargissement de la commande d'inclusion ni ajout automatique.

## 7. Exemple d'utilisation complet

L'utilisateur demande successivement l'inclusion de `stdio.h`, la création de la fonction principale, l'initialisation d'un entier et deux affichages.

```c
// Inclue la bibliothèque stdio.h.
#include <stdio.h>

// Crée la fonction principale.
int main(void) {
    // Crée un entier nommé age de valeur 20.
    int age = 20;
    // Affiche la valeur de age.
    printf("%d", age);
    // Affiche le texte "Bonjour".
    printf("%s", "Bonjour");

}
```

Avec GCC installé et accessible dans le terminal, un exemple de compilation depuis le dossier contenant le fichier `essai_lot4.c` est :

```powershell
gcc -std=c17 -Wall -Wextra essai_lot4.c -o essai_lot4.exe
.\essai_lot4.exe
```

Le résultat observé lors de la recette manuelle a été **`20Bonjour`**. Aucune séparation ni retour à la ligne n'a été ajouté implicitement. La compilation et l'exécution ont été faites manuellement, **en dehors de C-A**.

## 8. Historique de développement et validation

- **Lot 1 :** traduction déterministe des premières instructions C17.
- **Lot 2 :** planification et sécurisation du placement dans le document.
- **Lot 3 :** extension native VS Code, saisie, aperçu et confirmation.
- **Lot 4 :** inclusion explicite de `stdio.h`, affichage entier et littéral, sans saut de ligne implicite.
- **Lot 5 :** affichages décimal, hexadécimal et octal explicites ; diagnostics distinguant information manquante et format non pris en charge ; préparation interne des futurs paliers.
- **Lot 6 :** affectation d'expressions entières, priorités, parenthèses et négation ; diagnostics syntaxiques et limites déterministes ; parcours VS Code conservé. [Contrat approuvé](LOT6_CONTRAT_PROPOSE.md) et [recette manuelle à effectuer](RECETTE_LOT6.md).
- **Lot 7 :** types numériques, déclarations/initialisations explicites, expressions numériques et casts ; formats non signé/fixe/scientifique ; précision exigée, diagnostics UTF-16 et limites. [Contrat approuvé et livré](LOT7_CONTRAT_PROPOSE.md). La recette complète du domaine reste prévue après le lot 8.

Selon le rapport de développement du lot 5 : **799 tests Node réussis**, **28 tests VS Code réussis**, **aucun échec**, **aucun diagnostic TypeScript**. Ces chiffres proviennent du rapport d'implémentation ; ils ne remplacent pas les vérifications indépendantes et manuelles.

Bilan automatisé du lot 6 : **1 186 tests Node réussis, 36 tests hôte VS Code Windows 1.96.4 réussis, aucun échec ni test ignoré, aucun diagnostic TypeScript**. Le placement et le parcours de l'extension sont conservés. Le porteur a ensuite confirmé manuellement l'addition entre variables, la priorité des opérations et les parenthèses explicites. La recette complète du lot 6 sera regroupée avec celle du domaine Expressions et calculs après le lot 8 ; ces trois confirmations ne valent pas validation exhaustive. Aucun nouvel essai GCC n'est revendiqué par le rapport de livraison du lot 6.

Bilan automatisé historique, lot 7 : **1 530 tests Node réussis, 45 tests hôte VS Code Windows 1.96.4 réussis, aucun échec ni test ignoré, aucun diagnostic TypeScript**. Les 1 186 tests Node et 36 tests hôte précédents sont conservés. Aucun nouvel essai manuel du domaine ni compilation C17 n'est revendiqué par ce bilan ; la recette complète reste prévue après le lot 8.

Des tests manuels ont confirmé les traductions et diagnostics principaux des lots 4 et 5. Un programme généré a été compilé et exécuté avec GCC sous Windows. Les essais sur macOS et Linux, ainsi que certaines vérifications d'interface et de saisie, restent à réaliser.

**Recette manuelle du lot 5 précisée par le porteur :** les trois scénarios suivants ont été confirmés directement dans VS Code.

| Scénario | Saisie exacte | Résultat observé |
|---|---|---|
| Format manquant | `Affiche age.` | Diagnostic : « Il manque le format d’affichage. » |
| Format hexadécimal | `Affiche age en hexadécimal.` | Insertion de `printf("%x", age);` avec le commentaire français original |
| Format non pris en charge | `Affiche age en binaire.` | Diagnostic : « Ce format d’affichage n’est pas pris en charge. » |

Les autres scénarios du lot 5 n'ont pas tous été vérifiés manuellement. Cette confirmation ne constitue donc pas une recette exhaustive. Les vérifications physiques du raccourci, de l'IME, du focus et du diff, ainsi que macOS/Linux, restent ouvertes tant qu'elles ne sont pas attestées séparément. La confirmation partielle du lot 6 rapportée ci-dessus reste distincte de ces trois scénarios du lot 5.

## 9. Comment choisir les prochaines fonctionnalités

Nous ne développons plus C-A uniquement en ajoutant des constructions C isolées. Nous partons des **raisons pour lesquelles les personnes apprennent le C**.

Pour chaque **direction d'apprentissage** :

1. Définir les activités et problèmes professionnels qu'elle permet de résoudre.
2. Décrire ce qu'un praticien expérimenté doit savoir concevoir, expliquer, tester et maintenir.
3. Décomposer cette maîtrise en compétences progressives, avec dépendances et exercices concrets.
4. Regrouper les étapes en lots de développement C-A cohérents et testables.
5. Réutiliser les compétences communes dans les autres directions plutôt que les reconstruire.

Directions envisagées : **algorithmique et développement logiciel**, **systèmes embarqués**, **programmation système**, **réseaux et cybersécurité**, **calcul scientifique et performance**, **robotique et contrôle industriel**. La liste n'est pas fermée.

### Première direction retenue : algorithmique et développement logiciel en C17

**Objectif de maîtrise :** concevoir, développer, tester, déboguer et maintenir de manière autonome un logiciel modulaire en C17, en comprenant les données, les ressources, les erreurs, les interfaces et les limites du langage.

**Progression de travail provisoire :**

| Étapes | Lots indicatifs | Notions |
|---|---|---|
| Fondations | 1 à 5, déjà développés | Instructions de base, VS Code, variables, affichage, diagnostics |
| Expressions et calculs | 6 à 8 livrés ; recette complète du domaine ouverte | Opérateurs, priorités, types numériques, représentation, précision, conversions et fiabilité des calculs |
| Décisions et répétitions | **Lots 9 à 11D implémentés : domaine complet côté moteur.** Deux gestes du lot 9 confirmés ; recette manuelle du domaine ouverte ([protocole](RECETTE_DOMAINE3.md)) | Comparaisons, branches, `while` ([11A](LOT11A_BILAN.md)), `do/while` ([11B](LOT11B_CONTRAT_ET_BILAN.md)), `for` ([11C](LOT11C_CONTRAT_ET_BILAN.md)), `break`/`continue` ([11D](LOT11D_CONTRAT_ET_BILAN.md)). `switch` et `return` non livrés |
| Fonctions et décomposition | **Lot 12 implémenté : 12A définition et retour, 12B paramètres, 12C appels** ([contrat et bilan](LOT12_CONTRAT_ET_BILAN.md)). Recette manuelle du domaine à rédiger | Définition, type de retour vérifié contre la forme de la phrase, paramètres explicites passés par valeur, appels sans résolution de symbole |
| Tableaux, chaînes et pointeurs | À définir | Collections, accès et adresses |
| Structures et mémoire dynamique | À définir | Données composées, allocation et durée de vie |
| Fichiers et modularité | À définir | Entrées/sorties, erreurs, interfaces et compilation séparée |
| Algorithmes et structures de données | À définir | Conception, structures, recherche, tri et complexité |
| Fiabilité et maîtrise avancée | Transversal, puis approfondissement | Tests, débogage, comportements indéfinis, portabilité, maintenance et performance |

**Attention :** ces numéros sont indicatifs, pas des engagements figés. Chaque lot devra être défini par un contrat spécifique. Les bonnes pratiques et les risques pertinents doivent être enseignés au fur et à mesure, et non seulement à la fin du parcours.

L'étape 2 distingue désormais : calcul entier et regroupement (lot 6), choix des types, littéraux, conversions et formats (lot 7), puis fiabilité des calculs (lot 8). Les trois lots sont livrés ; la recette complète du domaine reste ouverte. Pour chaque compétence, l'apprenant doit prévoir un résultat, lire le C, tester et expliquer ses limites. Les paliers de liberté restent indépendants de cette progression. Au 5 novembre, le porteur ouvre le domaine 3 puis autorise le lot 9, désormais implémenté ; la recette GCC du domaine 2 n'est pas clôturée.

### Lot 8 — approuvé et livré le 3 novembre 2026

Le [contrat « Fiabilité des calculs »](LOT8_CONTRAT_PROPOSE.md), préparé le 2 novembre puis approuvé par le porteur, est implémenté. Le [protocole final de recette des lots 6 à 8](RECETTE_EXPRESSIONS_CALCULS.md) distingue programme sûr à exécuter et cas problématiques étudiés sans exécution. Au 5 novembre, le porteur confirme manuellement les deux familles d'avertissements pédagogiques du lot 8. Cette confirmation n'est pas une recette GCC complète ; le lot 9 du domaine suivant a reçu une autorisation distincte, sans clôture de cette recette.

Les avis locaux livrés sont séparés des diagnostics bloquants : diviseur littéralement nul et opérande directement flottant de `%`, sans correction, évaluation générale ou analyse des variables ; aucune nouvelle instruction française. Ils sont non bloquants et consultables dans « C-A — Pédagogie ». Les principes et paliers restent inchangés. Dernier bilan automatisé : **1 659 tests Node et 53 tests hôte VS Code Windows 1.96.4 réussis, aucun échec, contrôle TypeScript sans diagnostic**, soit 1 712 réussis. Voir le [bilan détaillé](LOT8_BILAN.md). Les trois acquis manuels confirmés du lot 6 ne valent pas recette complète. Les avertissements hôte mutex et DEP0168/N-API ont réapparu et restent à qualifier, sans résolution ni classement définitivement bloquant.

### Domaine 3 — lot 9 approuvé et implémenté le 5 novembre 2026

Le [référentiel détaillé et contrat approuvé du lot 9](LOT9_CONTRAT_PROPOSE.md) distingue les compétences de comparaison, vérité C, décision, composition, choix de branches et terminaison. Lot 9 livré : un bloc if explicite avec une condition simple ; lot 10 futur : composition et branches multiples ; lot 11 futur : répétitions, avec subdivision possible à discuter. switch reste à positionner séparément. Les compétences restent indépendantes des paliers de liberté.

IF est implémenté : grammaire bornée indépendante des profils historiques, curseur dans le bloc vide, diagnostics UTF-16 et réutilisation des seuls motifs d'avis du lot 8. Bilan observé : **1 847 tests Node et 61 hôte VS Code Windows 1.96.4 réussis, 0 échoué/ignoré, TypeScript sans diagnostic**. Les 1 659 tests Node et 53 hôte précédents restent inchangés. Le projet de seuils et l'acquisition pédagogique restent à vérifier manuellement. Les avertissements hôte mutex/N-API restent ouverts ; aucune recette GCC complète Expressions et calculs n'est validée par cette livraison et aucun lot 10 n'est commencé.

### Lot 10 — approuvé et implémenté le 6 novembre 2026

Le porteur confirme la création d'un bloc if et l'insertion d'une instruction à l'intérieur au lot 9. Cette confirmation reste partielle : elle ne certifie ni tous les scénarios du lot 9 ni les branches du lot 10.

Le [contrat du lot 10](LOT10_CONTRAT_PROPOSE.md) est approuvé et implémenté : &&, ||, !, ELSE_IF et ELSE, ciblage au curseur contrôlé seulement. Le reconnaisseur vérifie le rattachement dans un sous-ensemble bracé ou refuse ; aucune accolade ni instruction existante n'est modifiée. Les informations de logique sont passives et les avertissements calcul restent distincts. Bilan : **1 983 tests Node et 68 tests hôte VS Code Windows 1.96.4 réussis, 0 échec/ignoré, TypeScript sans diagnostic**. Les anciens refus d'opérateurs désormais autorisés ont été actualisés. La [recette manuelle du lot 10](RECETTE_LOT10.md) reste à effectuer. La recette GCC complète Expressions et calculs et la qualification mutex/N-API restent ouvertes. Aucun lot 11 commencé.

### Lot 11 — préparation du découpage, 7 novembre 2026

Le [contrat proposé des boucles](LOT11_CONTRAT_PROPOSE.md) recommande quatre incréments soumis à validations distinctes : 11A while et progression explicite, 11B test final do/while, 11C clauses for, 11D break/continue et contexte englobant. Ce découpage suit les dépendances de raisonnement, d'en-tête et de rattachement ; il ne réserve pas les domaines suivants ni ne restreint les compétences selon les paliers de liberté.

Seul le contrat du premier incrément est détaillé : un bloc WHILE complet vide, mêmes conditions que le lot 10, aucune initialisation/progression inventée, curseur intérieur et préservation documentaire. La terminaison reste un raisonnement de l'étudiant, sans preuve ni correction automatique par C-A. Les formulations ultérieures sont des candidates, non approuvées. **Aucun code applicatif ni test n'est modifié ou livré pendant cette préparation.** Les 1 983 tests Node/68 hôte du lot 10 restent des résultats historiques ; aucune nouvelle exécution revendiquée.

Le projet de classification de petites valeurs décrit la progression, l'imbrication et les critères d'acquisition ; sa matrice de recette finale reprend la [recette manuelle du lot 10](RECETTE_LOT10.md), toujours ouverte. La recette GCC complète Expressions et calculs et la qualification mutex/N-API restent également ouvertes.

### Lot 11A — approuvé et implémenté le 12 novembre 2026

Le porteur approuve le découpage en quatre incréments, la formulation `Crée une boucle tant que "{condition}".`, la réutilisation stricte de la condition du lot 10 et l'ajout d'un motif pédagogique passif. Le [bilan du lot 11A](LOT11A_BILAN.md) détaille la livraison.

WHILE est implémenté : bloc complet vide, curseur intérieur, condition identique au lot 10 sans profil plus permissif, aucune initialisation ni progression inventée, `while (1)` traduit fidèlement. L'information `WHILE_PRETEST` indique **quand** la condition est évaluée et reste passive : elle n'incrémente pas le compteur d'avertissements et ne prétend rien sur la terminaison. Une branche `sinon` après une boucle reste refusée, sans remontée vers un `if` voisin.

Bilan observé : **2 139 tests Node réussis, 0 échec, 0 ignoré, TypeScript sans diagnostic.** Les 1 983 tests du lot 10 sont inclus, inchangés.

**La suite hôte VS Code n'a pas pu être exécutée** : une mise à jour de VS Code est en attente sur la machine et le mutex Inno Setup `vscode-updating` empêche tout démarrage d'hôte de développement. Les 68 tests hôte du lot 10 ne sont donc pas reconfirmés et les 9 tests hôte écrits pour le lot 11A n'ont jamais été exécutés. Aucun résultat hôte n'est revendiqué pour cette livraison.

Restent ouverts : cette exécution hôte, la recette GCC Expressions et calculs, la recette manuelle du lot 10, la recette manuelle du lot 11A, la qualification mutex/N-API, et les contrats 11B à 11D. Aucune autre forme de boucle ni transfert de contrôle n'est livré.

### Lots 11B, 11C et 11D — implémentés le 12 novembre 2026

Après le 11A, le porteur délègue l'exécution séquentielle des trois incréments restants sans validation intermédiaire. Chacun a son document de contrat exécuté et de bilan, qui liste les décisions prises pour relecture.

**[Lot 11B — `do/while`](LOT11B_CONTRAT_ET_BILAN.md).** `Crée une boucle avec test final tant que "{condition}".` produit la structure complète ; le point-virgule final est syntaxique. La condition est donnée à la création : le moteur ne cherche jamais à fermer un `do` déjà ouvert dans le document. Information passive `DO_WHILE_POSTTEST`, distincte de celle du `while`. Une fermeture `} while (…);` ne peut pas être lue comme une fin de chaîne `if`.

**[Lot 11C — `for`](LOT11C_CONTRAT_ET_BILAN.md).** Les quatre points laissés ouverts par le contrat du lot 11 sont tranchés : **aucune déclaration dans l'en-tête** — le compteur est déclaré par l'étudiant, donc A n'invente aucun type et la valeur survit à la boucle ; **les trois clauses sont obligatoires**, aucune clause vide n'est interprétée comme vraie ; **les trois clauses partagent un seul budget de 1 024 tokens**, donc découper une expression entre les champs ne contourne pas la limite, tandis que la profondeur de 64 niveaux reste propre à chaque clause ; un paramètre de budget partagé optionnel est ajouté aux deux parseurs, avec budget neuf par défaut, de sorte qu'aucune instruction historique ne change de limite. Jamais de `++` ni de valeur par défaut. Information passive `FOR_CLAUSE_ORDER` sur l'ordre d'exécution des clauses. Les avis du lot 8 sont recherchés dans les trois clauses.

**[Lot 11D — `break` et `continue`](LOT11D_CONTRAT_ET_BILAN.md).** Nouveau module `src/loopTarget.ts`, distinct de `branchTarget.ts` comme le contrat l'exige. Il classifie chaque accolade ouvrante par les tokens qui la précèdent, ignore commentaires et littéraux, s'arrête à la fonction englobante, et refuse tout contexte qu'il ne sait pas établir — jamais une profondeur d'accolades, jamais le dernier mot `while` rencontré, jamais l'indentation. Application de la règle C17 : un `switch` entre le curseur et la boucle fait échouer la phrase « sors de la boucle », donc le cas est **refusé**, ni réécrit en `goto` ni traité en supposant `switch` absent ; `continue` traverse un `switch` et vise bien la boucle ; un corps sans accolades est refusé, et C-A n'ajoute pas d'accolades ; une boucle intérieure intercepte toujours le transfert. La cible résolue est affichée avant confirmation et re-établie à la validation.

Bilan observé pour l'ensemble du lot 11 : **2 402 tests Node réussis, 0 échec, 0 ignoré, TypeScript sans diagnostic.** Les 1 983 tests du lot 10 sont inclus, inchangés.

**Aucun résultat hôte n'est revendiqué pour aucun de ces incréments.** La suite hôte VS Code est restée inexécutable pendant toute la livraison : une mise à jour de VS Code est en attente sur la machine et le mutex Inno Setup `vscode-updating`, détenu par l'instance en cours d'exécution, empêche tout démarrage d'hôte de développement. Les 68 tests hôte du lot 10 ne sont pas reconfirmés, et les 25 tests hôte écrits pour le lot 11 n'ont jamais été exécutés. Reprise attendue : redémarrer VS Code, puis `npm run test:vscode`.

Restent ouverts : cette exécution hôte, la recette GCC complète Expressions et calculs, la [recette manuelle du domaine 3](RECETTE_DOMAINE3.md) qui intègre celle du lot 10, et la qualification mutex/N-API. `switch`, `return` et `goto` ne sont ni générés ni interprétés ; `switch` est seulement **reconnu** s'il a été écrit à la main, parce qu'il change le sens de `break`.

### Domaine 4 — lot 12 implémenté le 12 novembre 2026

Le porteur lève le périmètre restreint du sprint initial : le cadre strict visait à observer la méthode de travail, et, les tests étant jugés concluants, il accorde une page blanche et annonce qu'il organisera lui-même un test final plus complexe pour une pédagogie de base. Le passage à un modèle moins restrictif — les paliers de liberté — reste prévu **après** ce test et n'est pas engagé.

Le [contrat et bilan du lot 12](LOT12_CONTRAT_ET_BILAN.md) couvre les trois incréments : définition de fonction et `return` (12A), paramètres (12B), appels (12C). Sept intentions nouvelles. Les corps de fonction sont créés vides, `(void)` est écrit explicitement, et aucun `return` n'est jamais ajouté.

**Le contrat de retour est vérifié au placement**, selon le raisonnement du lot 11D : `Retourne.` dans une fonction qui déclare un type, ou une valeur retournée d'une fonction `void`, rendrait la phrase de l'étudiant fausse, donc la demande est refusée plutôt que traduite. Le type déclaré est lu **syntaxiquement dans un en-tête** ; ce n'est pas un vérificateur de types et rien ne vérifie le type de l'expression retournée. **Aucune résolution de symbole** n'est faite pour les appels : ni existence, ni arité, ni types des arguments. Une définition de fonction imbriquée reste acceptée, par cohérence avec `Crée la fonction principale.`

Mutualisation : le balayage contextuel et la classification des accolades passent dans `src/enclosingStructures.ts`, partagés par `loopTarget` (11D) et `functionContext` (12). `loopTarget` mappe les codes génériques vers ceux que son contrat a publiés, pour ne pas modifier un contrat livré ; `branchTarget.ts` du lot 10 reste entièrement à part. `conditionInformation.ts` devient `pedagogicalInformation.ts` : le canal n'est plus réservé aux conditions. Quatre motifs passifs ajoutés, dont `PARAMETERS_BY_VALUE`, qui porte la compétence centrale du domaine. Deux manques antérieurs corrigés : les avertissements du lot 8 ne couvraient ni les expressions de retour ni les arguments d'appel.

Bilan observé : **2 583 tests Node réussis, 0 échec, 0 ignoré, TypeScript sans diagnostic.** Les 2 402 des lots 1 à 11D sont inclus et inchangés.

**Aucun résultat hôte n'est revendiqué.** La suite hôte VS Code est restée inexécutable pendant toute la session : une mise à jour de VS Code est en attente sur la machine et le mutex Inno Setup `vscode-updating`, détenu par l'instance en cours d'exécution, empêche tout démarrage d'hôte de développement. Trois tentatives. Les 96 tests hôte existants n'ont pas été exécutés.

Le [catalogue complet](CATALOGUE.md) des formulations reconnues et de leurs sorties exactes est généré depuis le moteur ; il sert de référence pour concevoir une épreuve. Restent ouverts : cette exécution hôte, la recette GCC Expressions et calculs, les recettes manuelles des [domaines 3](RECETTE_DOMAINE3.md) et [4](RECETTE_DOMAINE4.md), la qualification mutex/N-API, les domaines 5 à 9 sans contrat, et la spécification du modèle moins restrictif.

## 10. Modèle de fiche pour chaque futur lot

Chaque lot doit documenter :

- **Direction et objectif pédagogique :** pourquoi cette compétence est utile.
- **Prérequis :** connaissances et fonctionnalités nécessaires.
- **Compétences visées :** ce que l'utilisateur doit comprendre et savoir réaliser.
- **Instructions françaises :** formulations exactes et fragments C attendus.
- **Diagnostics :** informations manquantes, demandes non prises en charge et erreurs de placement.
- **Invariants :** décisions que A ne doit pas prendre silencieusement au palier 1.
- **Tests :** automatisés, non-régression, scénarios manuels et programme de synthèse.
- **Preuve de maîtrise :** résultat que l'apprenant doit pouvoir produire **et expliquer**.
- **Compatibilité et perspectives :** réutilisation dans les autres directions et futurs paliers de liberté.

## 11. Préparer la publication

Cette documentation est une **base interne et publique en devenir**, non une promesse que toutes les fonctionnalités décrites sont disponibles. Avant une mise en ligne, il faudra distinguer clairement :

- ce qui fonctionne déjà ;
- ce qui est expérimental ;
- ce qui est prévu ;
- ce qui constitue la vision à long terme.

La documentation publique pourra ensuite être organisée en **Présentation / Pourquoi A / Démarrage rapide / Guide C-A / Catalogue des instructions / Parcours d'apprentissage / Limites / Historique et feuille de route / Contribution**.

## 12. Questions ouvertes et décisions à documenter ultérieurement

- Définition exacte et validée du palier 3, à récupérer dans les décisions antérieures.
- Interface de saisie persistante et signalement visuel des phrases incomplètes.
- Politique de gestion des valeurs par défaut pour les futurs paliers.
- Organisation des parcours pédagogiques et mesure des acquis.
- Portabilité et distribution de l'extension.
- Intégration éventuelle d'outils de compilation, de diagnostic et de débogage, sans perdre le contrôle explicite de l'utilisateur.

---

**Règle de maintenance de ce document :** mettre à jour les décisions de conception et les capacités réellement disponibles après chaque lot validé. Ne jamais présenter une fonctionnalité envisagée comme déjà implémentée. Si une décision nouvelle contredit une ancienne, conserver la trace du changement et sa justification.
