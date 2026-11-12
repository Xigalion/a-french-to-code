# Lot 10 — Conditions composées et branches multiples : contrat approuvé et implémenté

**Statut au 6 novembre 2026 : contrat approuvé par le porteur et implémenté.** Le chemin historique est conservé ; les formulations « proposé » du corps gardent la trace de préparation. Le ciblage A au curseur contrôlé est le seul implémenté ; B reste une alternative future. Les informations passives couvrent &&, || et !. Le bilan est au §12 et la [recette manuelle](RECETTE_LOT10.md) reste à effectuer. La confirmation manuelle de deux gestes du lot 9 ne couvre pas les branches nouvelles. Aucun lot 11 commencé.

La recette GCC complète du domaine Expressions et calculs reste ouverte. La qualification des avertissements mutex/N-API de l'hôte VS Code reste ouverte. Les 1 847 tests Node et 61 tests hôte sont les résultats historiques du lot 9, distincts du bilan du §12. Aucune dépendance ajoutée ni modification de .vscode/tasks.json ; seules les capacités autorisées du lot 10 sont développées.

## 1. Objectifs pédagogiques et périmètre

L'étudiant compose des tests, explique leur regroupement et les expressions susceptibles d'être évaluées, puis choisit entre chemins exclusifs. Il distingue deux if indépendants d'une chaîne if/else if/else. Il cible explicitement une chaîne existante et préserve son contenu. Ces compétences restent indépendantes des paliers de liberté ; aucune décision de condition, branche, ordre des branches ou contenu n'est déléguée au palier 1.

Prérequis : conditions simples du lot 9 et limites numériques du domaine 2. La progression n'efface pas la recette GCC encore ouverte. Ni boucles, ni switch, ni return nouveau, ni opérateur ternaire, appel, affectation, incrément, accès mémoire ou analyse complète des portées.

Proposition : un seul lot 10, développé en étapes testables après autorisation : conditions composées ; reconnaissance documentaire des chaînes ; placement des branches ; intégration/recette. La reconnaissance des chaînes est la principale complexité nouvelle ; elle ne doit pas être remplacée par la recherche du dernier mot if ou de la dernière accolade.

## 2. Formulations françaises proposées

| Intention | Formulation exacte de base | Fragment C, hors commentaire |
|---|---|---|
| IF, existante | `Crée un bloc si "{condition}".` | `if ({condition rendue}) {` puis ligne intérieure puis `}` |
| ELSE_IF, nouvelle | `Ajoute une branche sinon si "{condition}".` | `else if ({condition rendue}) {` puis ligne intérieure puis `}` |
| ELSE, nouvelle | `Ajoute une branche sinon.` | `else {` puis ligne intérieure puis `}` |

Point final facultatif, attaché au guillemet fermant ou au dernier mot. Mots français fixes insensibles à la casse avec accents exigés ; espaces et tabulations ordinaires aux séparateurs ; une seule ligne. Les identifiants, types, suffixes et contenus restent sensibles à la casse selon les contrats précédents. Guillemets ASCII pour les conditions ; pas d'échappement de chaîne dans une condition. Pas de synonyme « autrement », ni de condition ajoutée à ELSE. Le commentaire conserve exactement la saisie après le préfixe `// `.

Un fragment primary par demande, LF terminal dans la traduction et ligne intérieure de quatre espaces avant placement. Les nouveaux fragments ont un curseur relatif intérieur comme IF. translate reste indépendant du document : il peut traduire une demande ELSE sans avoir de cible, mais ce fragment contextuel n'obtient aucun plan applicable tant que son rattachement n'est pas validé. Un else isolé est un refus de placement, pas une formulation inconnue ni un faux diagnostic GCC.

Exemples de code proposé :

```c
// Crée un bloc si "age >= 18 && actif".
if (((age >= 18) && actif)) {
    
}
```

```c
// Ajoute une branche sinon si "age >= 16".
else if (age >= 16) {
    
}
```

```c
// Ajoute une branche sinon.
else {
    
}
```

Les commentaires entre `}` et `else` sont permis par la syntaxe C ; ils ne constituent pas une instruction intermédiaire. Aucun point-virgule et aucune modification de l'accolade existante ne sont ajoutés.

## 3. Conditions composées : grammaire et précédence

Étendre le parseur du lot 9, sans modifier les deux parseurs arithmétiques historiques. Les comparaisons ne sont plus limitées à une seule dans toute la condition : on peut relier plusieurs comparaisons par && ou ||. Chaque comparaison reste binaire ; `0 < age < 100` et `(a < b) == 1` restent refusés, sans transformation en intervalle ou en logique inventée.

Hiérarchie syntaxique proposée, du moins prioritaire au plus prioritaire :

```text
condition  := ou
ou         := et ('||' et)*
et         := comparaison ('&&' comparaison)*
comparaison:= somme [comparateur somme]
somme      := produit (('+' | '-') produit)*
produit    := unaire (('*' | '/' | '%') unaire)*
unaire     := '!' unaire | '-' unaire | cast unaire
            | '(' condition ')' | nom | littéral
comparateur:= '==' | '!=' | '<' | '>' | '<=' | '>='
cast       := '(' type_numérique_du_lot_7 ')'
```

Cette grammaire est accompagnée de restrictions syntaxiques, sans inférence de types :

- Les opérateurs arithmétiques, la négation - et les casts continuent à porter uniquement sur les expressions numériques du lot 7. Les résultats de comparaison ou de logique ne deviennent pas des opérandes arithmétiques dans ce lot. Ainsi `(a < b) + 1`, `-!a` et `(int)(a && b)` restent hors périmètre.
- Une comparaison accepte des opérandes numériques ou une négation logique explicite, mais pas directement un autre arbre de comparaison ou un binaire &&/||. Cette règle maintient les refus de comparaisons chaînées/imbriquées du lot 9. Les regroupements nécessaires à ! sont autorisés : `!(a == b)` et `!(actif || suspendu)` sont reconnus.
- ! est unaire et suit la précédence C, pas la portée d'une phrase française. `!a == b` signifie `(!a) == b`, jamais `!(a == b)`. ! peut porter sur un numérique, sur un autre !, ou sur une condition parenthésée. Aucun regroupement implicite contraire au C.
- && est plus prioritaire que || ; ces deux binaires sont associatifs à gauche dans l'AST. !, la négation et les casts s'associent à droite. Les parenthèses redéfinissent le regroupement sans modifier les noms ni évaluer les valeurs.
- La hiérarchie unique de comparaison suffit dans ce sous-ensemble : les opérandes directement comparatifs y sont exclus. L'étendre aux expressions relationnelles générales et à leur usage arithmétique serait un autre contrat, pas une approximation de la précédence C.

Cette restriction évite de transformer le lot en parseur de toutes les expressions C. Une forme C légale hors de ce sous-ensemble est refusée comme non prise en charge, jamais déclarée illégale en C. Aucun opérateur &, | ou ~ n'est assimilé à un opérateur logique ; aucun `and`, `or`, `not` n'est ajouté au catalogue.

### Rendu exact et compatibilité

Le rendu des anciens nœuds numeric-test et comparison reste inchangé. Le rendu d'un opérande logique reprend ce rendu, en entourant une comparaison de parenthèses. Un nouveau binaire logique est rendu `({gauche} && {droite})` ou `({gauche} || {droite})` ; une négation logique est rendue `(!{opérande})`. Les opérandes déjà rendus comme nouveaux nœuds logiques sont déjà parenthésés. L'enveloppe IF/ELSE_IF ajoute ses parenthèses obligatoires, même si cela produit des parenthèses redondantes. Pas de simplification booléenne.

| Condition saisie | Première ligne C proposée |
|---|---|
| `age >= 18` | `if (age >= 18) {` — inchangée |
| `actif` | `if (actif) {` — inchangée |
| `a && b` | `if ((a && b)) {` |
| `a || b && c` | `if ((a || (b && c))) {` |
| `(a || b) && c` | `if (((a || b) && c)) {` |
| `age >= 18 && age < 65` | `if (((age >= 18) && (age < 65))) {` |
| `!actif` | `if ((!actif)) {` |
| `!!actif` | `if ((!(!actif))) {` |
| `!(age >= 18)` | `if ((!(age >= 18))) {` |
| `!a == b` | `if ((!a) == b) {` |
| `a != 0 && 20 / a > 2` | `if (((a != 0) && ((20 / a) > 2))) {` |

Les nœuds historiques et leurs champs/plages restent identiques sur les entrées déjà acceptées. Seuls les tests négatifs portant explicitement sur les nouveaux opérateurs autorisés doivent être actualisés, en gardant une preuve distincte des exclusions restantes.

### Limites globales proposées

Conserver 1 024 tokens pour toute la condition, y compris &&, || et ! ; 64 niveaux cumulés de parenthèses, !, négations et casts sur un chemin. Ne pas réinitialiser ces budgets entre termes logiques. Les limites ne représentent pas le nombre maximal de comparaisons ; une expression plate peut en contenir plusieurs dans le budget commun. Les grandes chaînes binaires sont traitées itérativement ou de façon bornée pour éviter une récursion incontrôlée au rendu/parcours. Aucune conversion des nombres en Number JavaScript.

## 4. Court-circuit sans exécution

Garanties C17 à enseigner : && évalue à droite seulement si la valeur de gauche est non nulle ; || seulement si elle est nulle. La gauche est évaluée avant la droite éventuelle. ! évalue son opérande et inverse son test zéro/non-zéro ; il n'introduit pas de court-circuit binaire. Les résultats logiques sont des int 0/1. La priorité détermine le regroupement, pas un ordre général gauche/droite pour les opérateurs arithmétiques. Voir la [documentation C des opérateurs logiques](https://learn.microsoft.com/en-us/cpp/c-language/c-logical-operators?view=msvc-170) et le [manuel GNU, logique et comparaisons](https://www.gnu.org/software/c-intro-and-ref/manual/html_node/Logicals-and-Comparison.html).

Exercices de raisonnement, sans évaluateur dans C-A :

| Condition | Explication et limite |
|---|---|
| `d != 0 && 20 / d > 2` | Pour un int d initialisé, la division n'est pas évaluée si d vaut 0 ; les autres risques d'un programme ne sont pas certifiés absents |
| `d == 0 || 20 / d > 2` | Si le premier test est vrai, la division de droite n'est pas évaluée |
| `20 / d > 2 && d != 0` | Le test de droite ne protège pas la division déjà placée à gauche |
| `d != 0 || 20 / d > 2` | Pour d égal à 0, la droite est nécessaire : cette formulation ne protège pas la division |
| `0 && 7 / 0` | L'opérande droit n'est pas évalué si cette condition est évaluée ; conserver néanmoins l'avis syntaxique local, formulé conditionnellement à l'exécution de l'opération |
| `0 && 5.0 % 2` | Le court-circuit ne supprime pas la violation des contraintes de % ; compiler n'est pas exécuter |

### Avis historiques et informations pédagogiques

Parcourir tous les sous-arbres numériques, même à droite de && ou ||, avec exactement les motifs, messages, codes, classifications et plages du lot 8. Ne pas supprimer un avis par calcul de 0/1, propager une hypothèse sur une variable, inventer une preuve de protection ou simuler la sélection des branches. La classification certain-error indique le motif local déjà défini ; le message de diviseur nul reste « si cette opération est exécutée ». Une branche non choisie à l'exécution n'efface pas ses contraintes C.

Pour expliquer sans exécuter, je propose deux couches : documentation/exercices de trace, puis informations structurelles facultatives dans le canal passif existant. Pour chaque &&/||, une information constante explique sous quelle condition sa droite sera évaluée. Codes proposés SHORT_CIRCUIT_AND et SHORT_CIRCUIT_OR, severity information, plage de l'opérateur, séparés des avertissements calcul et du compteur de Warning. Aucun nouvel avertissement « dangereux », « protégé », « toujours vrai/faux » ou « sûr ». Les informations ne modifient ni la traduction canonique ni le plan et n'ouvrent pas de panneau automatiquement. Cette couche d'information reste un choix à valider ; la sémantique doit être documentée même si elle est reportée.

## 5. Deux approches pour cibler les branches

| Critère | A — curseur contrôlé | B — sélection explicite de la chaîne |
|---|---|---|
| Geste | Curseur sur la première ligne blanche immédiatement après la fermeture terminale de la chaîne voulue | Une sélection unique couvre exactement le if racine et toute sa chaîne jusqu'à la fermeture terminale |
| Choix de la cible | Déduit uniquement du point de rattachement syntaxique adjacent et vérifié ; aucun choix parmi des if voisins | La sélection désigne le if racine ; son contenu doit encore être reconnu et vérifié |
| Sûreté | Nécessite de reconnaître l'origine de la chaîne et l'absence de else suivant ; ambiguïtés refusées | Rend l'intention plus visible, mais une sélection peut être partielle, périmée ou omettre une branche existante ; mêmes contrôles structurels nécessaires |
| Compatibilité actuelle | Conserve curseur unique sans sélection et ligne blanche | L'extension refuse actuellement les sélections non vides ; nouvelle exception, capture d'une plage et invalidation de cette plage nécessaires |
| Placement | Remplace seulement la ligne blanche choisie | Ne remplace jamais le texte sélectionné ; il faudrait une règle explicite d'insertion après la chaîne sélectionnée, avec ligne blanche requise |
| Ergonomie | Peu de gestes, naturel après avoir rempli un bloc ; les refus de disposition doivent être explicites | Plus lourd avec chaînes longues, plus facile à contrôler visuellement en imbrication ; risque de croire que la sélection sera remplacée |

**Recommandation pour le lot 10 : A seulement**, sous les restrictions du §6. B est une alternative réelle à approuver si vous préférez son geste explicite ; ne pas implémenter les deux chemins dès le premier lot. B ne résout pas à lui seul le problème du else isolé ou d'une branche déjà présente. Aucun mode n'autorise la recherche du if « le plus proche » sans preuve structurelle.

Si B était retenu, il faudrait sélectionner la chaîne entière (commentaire français initial extérieur à la sélection), conserver son texte octet logique pour octet logique, exiger une ligne blanche immédiatement après, afficher la cible et appliquer uniquement l'insertion sur cette ligne. Sélection multiple, demi-paire UTF-16, chaîne incomplète, omission d'un else if/else existant ou périmption : refus. Ce mode changerait explicitement la règle actuelle de sélection, sans changer le placement des instructions historiques ; il n'est pas le mode recommandé.

## 6. Contrat recommandé de rattachement au curseur

### Reconnaissance structurelle limitée

Un petit reconnaisseur documentaire pur suit les commentaires, chaînes, caractères, délimiteurs et mots-clés if/else. Il reconnaît la forme `if (condition opaque équilibrée) {corps}` suivie de zéro ou plusieurs `else if (...) {corps}`, puis d'au plus un `else {corps}`. Les conditions/corps existants ne sont ni retraduits ni régénérés ; une condition modifiée manuellement peut contenir du C hors catalogue, sans que C-A en vérifie les types ou l'évalue. Les accolades des chaînes ciblées sont obligatoires.

Il faut établir à la fois : la fermeture terminale, la racine if correspondante et le fait qu'elle constitue une instruction à une frontière reconnue, pas le corps sans accolades d'un autre if/else ou contrôle. Au sous-ensemble proposé, la racine doit suivre le début du fichier ou un délimiteur d'instruction reconnu (`{`, `}`, `;`) hors parenthèses/crochets/littéraux. Étiquette, préfixe opaque ou contrôle englobant sans accolades non identifiable : refus de construction non prise en charge. Aucun comptage de braces dans des chaînes/commentaires.

Les corps bracés sont parcourus pour l'équilibrage lexical, pas analysés comme un programme complet : pas de table des portées ni de preuve de compilation. Les délimiteurs non équilibrés dans la région nécessaire au rattachement empêchent la reconnaissance, sans être présentés comme une analyse générale des erreurs du programme. Les macros ne sont pas développées et peuvent modifier le sens du source après prétraitement ; la garantie est celle du sous-ensemble documentaire reconnu, pas une garantie de sémantique après expansion.

Conserver les refus actuels de préfixe (directives hors inclusions directes simples, continuations et trigraphes). Pour les nouvelles branches seulement, examiner aussi le suffixe nécessaire : ignorer les commentaires/espaces pour chercher le prochain token significatif et détecter un else/else if déjà présent après la cible. Une directive ou une construction lexicale indéterminée dans cette recherche entraîne un refus, pas une supposition d'absence de branche. Ne pas appliquer cette nouvelle analyse structurelle aux placements historiques ordinaires.

Bornes proposées, à valider : 1 048 576 unités UTF-16 pour la région de document examinée (préfixe jusqu'à la cible et recherche du token suivant), 50 000 tokens significatifs, 128 niveaux de délimiteurs et 64 branches dans la chaîne résultante, if initial compris. Dépassement : refus explicite de limite ; pas de recherche tronquée suivie d'une insertion. Ces limites de placement sont distinctes des 1 024/64 de la nouvelle condition.

### Préconditions exactes et édition

1. Ligne cible entièrement blanche, immédiatement après la ligne de fermeture terminale ; cette ligne précédente contient seulement indentation, `}` et espaces/tabulations finaux. Une ligne blanche plus éloignée, une ligne de fermeture avec commentaire, `};`, ou `} else ...` non terminale ne convient pas. L'utilisateur crée la ligne cible si nécessaire : aucun réaménagement automatique.
2. Une seule chaîne cible doit être reconnue à ce point. Le reconnaisseur ne remonte pas vers un autre if si la fermeture correspond à autre chose ou à une chaîne terminée par else.
3. La prochaine branche éventuelle du suffixe fait partie de la chaîne existante : insertion au milieu refusée. Une chaîne déjà terminée par else refuse ELSE et ELSE_IF. Un else isolé, le `}` de main ou un bloc autonome ne constituent pas une cible.
4. Le if racine commence sa ligne après une indentation seule. L'indentation de la ligne cible, de la fermeture terminale et de cet en-tête racine doit être identique. Sinon refus, sans réindenter le document ni choisir une indentation depuis les accolades. La ligne intérieure de la nouvelle branche reçoit cette indentation plus indentUnit, selon les options capturées de l'éditeur.
5. Remplacer uniquement la ligne blanche et son EOL éventuel par commentaire exact, en-tête else if/else, ligne intérieure et fermeture. Aucun caractère du bloc existant ne change. Aucune instruction du suffixe n'est absorbée : la nouvelle branche est fermée avant le suffixe.
6. Conserver le choix LF/CRLF et le repli EOF existants, les offsets UTF-16 et la vérification des paires de substitution. Si la fermeture est en fin de fichier sans ligne cible blanche, refuser ; ne pas créer implicitement cette ligne.
7. Curseur final après l'indentation intérieure du nouveau bloc. Pour ajouter une branche suivante, l'étudiant remplit le bloc puis choisit/crée une ligne blanche après sa fermeture. Aucune insertion automatique après un else et aucune transformation d'un else existant en else if.
8. Aperçu complet avant/après, cible racine identifiée par ligne et extrait de l'en-tête dans la confirmation ; un seul emplacement admissible, pas une liste de cibles choisies par l'outil. Seule la confirmation autorise une édition annulable. Annuler cette édition retire la branche et son commentaire ; remplir son bloc reste une opération distincte.

### Cas d'association

| Situation au curseur | Résultat proposé |
|---|---|
| Juste après un if bracé sans suite | Ajouter ELSE_IF ou ELSE à ce if |
| Après le dernier else if d'une chaîne sans else | Ajouter à la même chaîne, pas au if imbriqué d'un de ses corps |
| Après le else terminal | Refuser les deux nouvelles intentions |
| Après le if extérieur contenant un if intérieur | Cibler l'extérieur si sa fermeture est celle qui précède immédiatement la ligne cible |
| Après le if intérieur, avant la fermeture extérieure | Cibler l'intérieur ; aucune remontée au if extérieur |
| Entre un if et son else existant plus loin | Refuser l'insertion au milieu, même avec commentaires/lignes blanches intermédiaires |
| `if (a) if (b) { ... }` puis curseur | Refuser le contexte sans accolades englobantes non pris en charge ; ne pas résoudre le dangling else par l'indentation |
| Dernière ligne occupée ou absence de if reconnu | Refuser, sans fragment documentaire applicable |

## 7. Architecture minimale proposée

Étendre Condition par logical-not et logical-binary (&&/||), avec range et operatorRange absolus UTF-16 sur les nouveaux nœuds ; conserver les champs des anciens nœuds pour les entrées historiques. Ajouter les intentions ELSE_IF(condition) et ELSE sans paramètre. translate rend un fragment canonique, sans cible ni accès au document.

planPlacement conserve sa signature générale ; les nouvelles intentions déclenchent une résolution interne pure de chaîne, uniquement en mode curseur recommandé. Aucun état persistant de chaîne, identifiant de provenance ou fichier annexe : le document courant reste la source de vérité. Le code manuel n'est jamais reconstruit depuis ses commentaires. La sélection B, si choisie, exigerait un champ de plage explicite distinct et une adaptation du contrôleur ; ne pas l'ajouter anticipativement.

Le plan peut recevoir un champ facultatif attachment pour les seules branches : plage du if racine, plage de fermeture terminale et nombre de branches antérieures, référencées au document initial. Il sert à expliquer la cible affichée, pas à appliquer une autre modification. Conserver edits, placedFragments et cursorAfter ; une seule édition remplace la ligne cible. Les sorties de plan historiques restent strictement identiques.

Retraduction canonique des fragments, validation de fraîcheur par identité/révision/texte intégral, capture du curseur et des réglages maintenues. Avant application, refaire la reconnaissance de rattachement sur le même instantané et comparer au plan confirmé ; toute différence invalide l'aperçu. Pas de recalcul silencieux suivi d'une insertion sur une nouvelle cible. Une confirmation est consommée une seule fois.

Le parcours InputBox → diff → QuickPick reste inchangé. La cible affichée et les informations pédagogiques sont des adaptations de contenu, pas une nouvelle interface. Aucun nouveau bouton, compilateur, sauvegarde, exécution ou service externe.

## 8. Diagnostics proposés, sans code partiel

Conserver les catégories compréhension, placement et intégration. Les diagnostics de compréhension portent sur la phrase ; ceux de placement portent sur le document. Dans l'interface, nommer explicitement cet espace de coordonnées, sans utiliser une plage du document pour souligner la saisie. Tous les intervalles sont UTF-16, début inclus/fin exclue.

### Compréhension

- Réutiliser les enveloppes MISSING_CONDITION, MISSING_CONDITION_DELIMITER, UNTERMINATED_CONDITION pour IF et ELSE_IF, avec les positions originales de chacune des deux formulations.
- MISSING_OPERAND pour une droite absente de &&/|| ou l'opérande de ! : intervalle vide à la fin utile ou devant le token fautif. MISSING_OPERATOR conserve son intervalle vide historique.
- ASSIGNMENT_IN_CONDITION sur = ; aucun remplacement par ==. CHAINED_COMPARISON sur le deuxième comparateur d'une comparaison chaînée, même avec parenthèses, sans interdire deux comparaisons séparées par &&/||.
- UNSUPPORTED_CONDITION_OPERATOR sur &, |, ^, ~, ++, ?:, etc. Les anciens refus de &&/||/! sont remplacés uniquement là où la grammaire les autorise.
- Nouveau CONDITION_FORM_NOT_SUPPORTED sur un sous-arbre logique/comparatif employé comme opérande arithmétique ou cast hors sous-ensemble ; expliquer qu'il s'agit d'une limite de C-A, pas d'une erreur C.
- Parenthèses, identifiants, littéraux, séparateurs, suffixes et complexité : conserver les codes applicables. ELSE avec condition ou texte supplémentaire est refusé intégralement ; ne jamais supprimer sa condition pour insérer un else.

Oracles proposés à vérifier lors du développement :

| Phrase exacte | Diagnostic / intervalle |
|---|---|
| `Crée un bloc si "a &&".` | MISSING_OPERAND [21,21) |
| `Crée un bloc si "!".` | MISSING_OPERAND [18,18) |
| `Crée un bloc si "a | b".` | UNSUPPORTED_CONDITION_OPERATOR [19,20) |
| `Crée un bloc si "A😀B && actif".` | INVALID_IDENTIFIER [17,21) |

operatorRange de && dans le premier exemple : [19,21). La position d'absence est avant le guillemet fermant. Un caractère astral vaut deux unités ; aucune normalisation des accents, des espaces ou de la casse des noms ne décale les plages.

### Placement et intégration

| Code proposé | Message de référence / classement | Plage dans le document |
|---|---|---|
| BRANCH_TARGET_NOT_FOUND | Aucune chaîne if prise en charge ne se termine juste avant cette ligne. / unsafe-location | Ligne cible, ou intervalle vide à son début |
| BRANCH_TARGET_AMBIGUOUS | Le rattachement de cette branche ne peut pas être établi sans ambiguïté. / unsafe-location | Région des candidats, sans en choisir un |
| BRANCH_NOT_AT_CHAIN_END | Cette ligne se trouve avant une branche existante ; placez le curseur après la chaîne complète. / unsafe-location | Token else de la suite existante |
| BRANCH_AFTER_ELSE | Cette chaîne possède déjà une branche sinon finale. / unsafe-location | Token else terminal existant |
| UNSUPPORTED_BRANCH_CONTEXT | Cette disposition ou ce contexte ne permet pas un rattachement pris en charge. / unsupported-construct | Racine, fermeture ou délimiteur qui empêche la reconnaissance |
| BRANCH_INDENT_MISMATCH | L'indentation de la ligne cible ne correspond pas à celle de la chaîne. / unsupported-construct | Indentation de la ligne cible |
| BRANCH_SCAN_LIMIT | La reconnaissance de cette chaîne dépasse les limites documentaires prises en charge. / unsupported-construct | Token dépassant la borne, ou intervalle vide au point d'arrêt |

Les codes existants de ligne occupée, préfixe dangereux, fragment modifié et plan périmé restent applicables et prioritaires avant toute édition. Après ces contrôles : limite/lexique structural, cible unique, position en fin de chaîne, else terminal, disposition/indentation. Si plusieurs motifs coexistent, retourner un refus déterministe, pas plusieurs choix de cible. L'absence de cible est une impossibilité de cette opération documentaire ; aucune correction du programme C n'est proposée. Tout refus laisse le document exactement intact.

## 9. Plan de tests automatisés et de non-régression

| Groupe | Tests à écrire après autorisation |
|---|---|
| Conditions | &&, ||, !, !! ; tests numériques et comparaisons ; `a || b && c`, `(a || b) && c`, `!a == b`, `!(a == b)` ; sorties exactes et absence de simplification |
| Compatibilité | Sorties et AST des anciens cas acceptés ; ancienne arithmétique et casts ; comparaisons chaînées et usages comparatifs arithmétiques encore refusés ; actualisation documentée des seuls refus sur opérateurs devenus autorisés |
| Limites/UTF-16 | 1 024/1 025 tokens globaux, 64/65 niveaux mêlant !/casts/parenthèses ; longs binaires plats ; accents, astral, demi-surrogate et positions ELSE_IF décalées ; aucun refus partiel |
| Avis | Motifs du lot 8 dans chaque sous-arbre, y compris derrière `0 &&` ; % flottant encore signalé ; aucun avis supprimé par évaluation ; aucun certificat de protection ; informations structurelles distinctes et plages d'opérateurs exactes |
| Reconnaissance | Chaînes C-A et modifiées à la main ; else if multiples ; else terminal ; corps bracés imbriqués, chaînes/commentaires contenant if/else/accolades ; commentaires entre branches ; portée globale lexicalement reconnue mais C potentiellement incorrect |
| Refus de rattachement | Else isolé, accolade de main/bloc autonome, racine sans frontière reconnue, contexte sans accolades, sélection non vide en mode A, ligne éloignée/occupée, branches déjà présentes dans le suffixe, étiquette, préprocesseur, continuation, trigraphe, délimiteur ouvert et dépassement des bornes |
| Placement | LF/CRLF, EOF avec/sans ligne cible, espaces/tabulations ; curseur intérieur ; préfixe/suffixe exactement inchangés ; fermeture existante intacte ; jamais de code absorbé ni de bloc ajouté implicitement |
| Progression | IF rempli → ELSE_IF rempli → second ELSE_IF → ELSE ; ajout refusé après ELSE ; branche intérieure puis extérieure à des curseurs explicites ; remplissage indépendant des blocs |
| Plans | Retraduction canonique, données falsifiées, informations de cible altérées, document/curseur/options changés, validation juste avant application ; pas de recalcul vers une autre cible après confirmation |
| Hôte | Vrais widgets, diff complet et cible affichée ; brouillon non enregistré, navigation/focus, fermeture, confirmations répétées, annuler/rétablir branche puis contenu ; warnings non bloquants et informations passives |

Conserver les 1 847 tests Node et 61 hôte rapportés au lot 9 comme base ; ils ne sont pas relancés pour cette préparation. Les cas négatifs explicitement devenus nouveaux cas positifs doivent être identifiés dans le futur bilan. Aucun test GCC automatique ni recette physique n'est promis par ces suites. Les tests d'association doivent vérifier l'identité de la racine, pas seulement la présence du mot else dans le résultat.

## 10. Projet pédagogique proposé : décision d'accès à données fixées

Créer explicitement stdio.h, MAIN et les entiers `age`, `autorisation`, `suspendu`. Sans saisie interactive ni boucle, construire progressivement :

1. IF : `!suspendu && (age >= 18 || autorisation)` ; contenu ajouté ensuite : affichage « Accès autorisé\n » avec retour explicitement saisi.
2. ELSE_IF : `suspendu` ; contenu : « Accès suspendu\n ».
3. ELSE : contenu « Accès refusé\n ».

Prévoir les chemins pour (age=20, autorisation=0, suspendu=0), (16,1,0), (16,0,0) et (20,1,1). Pour chaque cas : donner les valeurs de vérité, les tests effectivement nécessaires, le premier chemin sélectionné et l'affichage exact. Aucune branche n'est créée ou remplie par C-A sans demande distincte.

Faire expliquer la différence avec trois if indépendants, puis avec une permutation de branches : les premières conditions vraies d'une chaîne déterminent ce qui peut encore être testé. Exiger une trace pour `a || b && c` et `!(a || b)`, sans prétendre que les expressions omises à l'exécution n'ont pas de contraintes de compilation.

Exercice complémentaire sur papier : pour un int d initialisé à 0, 5, -5, expliquer `d != 0 && 20 / d > 2`, puis la version où la division est à gauche. Ne jamais lancer la version dangereuse avec d=0. Montrer un if intérieur et un if extérieur et demander de désigner la fermeture qui reçoit une branche ; refuser de décider depuis la seule indentation. Observer ensuite le refus après ELSE et un aperçu périmé sans modification.

Critères d'acquisition : regroupement correct et justification des trois opérateurs ; distinction court-circuit/évaluation générale ; couverture de chaque branche ; identification de la bonne racine et maintien du code existant ; compréhension d'un refus pédagogique et d'un avis non bloquant. La future compilation manuelle du programme sûr reste une recette distincte, et ne clôt pas rétroactivement le domaine Expressions et calculs. Aucun résultat de ce projet n'est observé pendant la préparation actuelle.

## 11. Décisions approuvées par le porteur

1. Les deux formulations nouvelles ELSE_IF/ELSE et l'extension de IF ; grammaire restreinte, précédence C de !, restrictions des usages logiques comme nombres et rendu exact parenthésé du §3.
2. Mode A au curseur contrôlé exclusivement pour cette version. Mode B par sélection non implémenté.
3. Reconnaissance documentaire bracée, frontière de racine, ligne immédiatement adjacente, égalité d'indentation et inspection du suffixe ; limites 1 048 576/50 000/128/64 proposées. Accepter ces refus conservateurs plutôt qu'une cible devinée.
4. Conservation des motifs du lot 8 sans analyse de protection ; informations structurelles &&/||/! ajoutées au canal passif, séparées des Warning, sans garantie de sûreté ni notification intrusive.
5. Projet d'accès, critères d'acquisition et recette manuelle ; maintenir explicitement ouvertes la recette GCC du domaine 2 et la qualification mutex/N-API. Aucun lot 11 engagé par cette validation future.

## 12. Bilan de livraison — 6 novembre 2026

Livré : AST et parseur logique dans src/condition.ts ; ELSE_IF/ELSE dans translate ; reconnaisseur documentaire source-only borné dans src/branchTarget.ts ; placement et revalidation des branches ; informations séparées dans src/conditionInformation.ts et canal passif existant. Les deux parseurs arithmétiques historiques ne sont pas modifiés. La confirmation indique la ligne et l'en-tête du if racine. Aucun contenu existant n'est régénéré depuis les commentaires.

Un plan de branche porte attachment et branchContext.indentUnit : ce contexte permet sa reconstruction exacte sur la ligne confirmée juste avant application. Un changement du plan, de sa cible ou du document provoque un refus, jamais une redirection. Les plans historiques ne reçoivent aucun champ nouveau. Les corps/conditions manuels restent opaques pour la sémantique ; ni expansion de macros ni analyse générale des portées.

Résultats observés : **1 983 tests Node et 68 tests hôte VS Code Windows 1.96.4 réussis, 0 échoué, 0 ignoré ; TypeScript sans diagnostic**, soit **2 051 réussis**. Trois anciens tests négatifs des opérateurs désormais autorisés ont été remplacés par des cas positifs ; les opérateurs logiques mal placés restent refusés et testés. Les 61 scénarios hôte précédents sont conservés et sept scénarios sont ajoutés. Le délai global du lanceur hôte passe de 120 à 240 secondes pour la suite étendue, sans augmenter les délais individuels. Aucune dépendance ajoutée.

Les tests couvrent les bornes exactes, les commentaires/tokens à la limite du suffixe, la précédence, l'imbrication, les chaînes progressives, LF/CRLF, les curseurs, le code adjacent, les plans modifiés/périmés et annuler/rétablir branche puis contenu. Les informations SHORT_CIRCUIT_AND, SHORT_CIRCUIT_OR et LOGICAL_NOT restent séparées des avertissements calcul. Aucun avis du lot 8 n'est supprimé au motif d'une non-évaluation supposée.

Les refus conservateurs restent effectifs : ligne immédiatement adjacente et blanche, indentation identique à la racine et à sa fermeture, chaîne bracée reconnue à une frontière d'instruction, aucune branche existante après la cible, aucun else terminal. Digraphes structuraux et contextes hors sous-ensemble sont refusés. La reconnaissance n'est pas une preuve de compilation ou de sûreté générale.

Les avertissements « Error mutex already exists » et DEP0168/N-API réapparaissent dans l'hôte portable isolé malgré le rapport sans échec ; leur qualification reste ouverte. Aucune nouvelle compilation/exécution C17, recette physique ou validation macOS/Linux n'est revendiquée. Le [protocole manuel du lot 10](RECETTE_LOT10.md) est prêt mais non effectué ; la recette GCC complète Expressions et calculs reste ouverte. Aucun lot 11 commencé.
