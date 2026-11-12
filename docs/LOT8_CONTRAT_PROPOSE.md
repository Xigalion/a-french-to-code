# Lot 8 — Fiabilité des calculs : contrat approuvé et implémenté

**Suivi au 5 novembre 2026 :** le porteur confirme manuellement les deux familles d’avertissements pédagogiques du lot 8. La recette GCC complète Expressions et calculs reste ouverte ; aucun résultat C17 supplémentaire n’est inventé. Après la préparation, le [lot 9](LOT9_CONTRAT_PROPOSE.md) a reçu son autorisation distincte et est implémenté, sans clôture de cette recette. Les mentions d’absence de domaine suivant dans les bilans historiques restent datées de leur livraison.

Statut au 3 novembre 2026 : **contrat approuvé par le porteur et implémenté**. Son chemin historique est conservé. Les formulations « proposé » et « à valider » dans le corps gardent la trace du contrat du 2 novembre ; les six points du §9 ont été approuvés avec les précisions de classification et d'interface du porteur. Le résultat de traduction demeure syntaxique ; l'analyse locale des risques est un canal séparé. Aucun domaine suivant n'est engagé. Voir le [bilan de livraison](LOT8_BILAN.md) et le [protocole final de recette](RECETTE_EXPRESSIONS_CALCULS.md). La recette physique et GCC du domaine reste à effectuer.

## 1. Objectif, prérequis et acquisition

L'apprenant sait lire les expressions et leurs regroupements du lot 6, choisir explicitement les quatre types, casts, suffixes et formats du lot 7, puis compiler manuellement avec GCC. Il doit désormais distinguer résultat mathématique, résultat C défini, comportement dépendant de l'implémentation, violation de contrainte et comportement indéfini. Observer une valeur une fois ne prouve ni validité ni portabilité.

Les compétences restent indépendantes des paliers de liberté. Le palier 1 ne choisit aucune correction ; aucun comportement des paliers suivants, notamment du palier 3, n'est défini ici.

| Compétence | Travail et exemples C17 | Critère d'acquisition et exercice |
|---|---|---|
| Division et reste | `7 / 2` vaut 3 ; `-7 / 3` vaut -2 ; `-7 % 3` vaut -1. `/` et `%` entiers avec diviseur nul ont un comportement indéfini. Le quotient doit aussi être représentable. | Prévoir quotient et reste avec signes ; classer les cas de diviseur nul sans les exécuter. Expliquer pourquoi `%` n'est pas le reste flottant. |
| Division flottante par zéro | Le C17 général ne garantit pas une infinité : sa règle de division par zéro conduit au comportement indéfini. Une implémentation appliquant l'annexe F fournit des garanties IEC 60559 supplémentaires : par exemple une valeur finie non nulle divisée par zéro peut produire une infinité avec exception flottante ; zéro divisé par zéro relève de l'opération invalide et d'un NaN. Les modes de traitement des exceptions et le profil effectif comptent. | Distinguer règle générale et profil optionnel ; ne pas déduire les garanties d'un simple affichage `inf`, du seul matériel ou de la seule option `-std=c17`. Aucun essai par zéro dans le programme exécuté. |
| Dépassement signé | Avec les macros et types appropriés, `INT_MAX + 1` et `INT_MIN - 1` dépassent la plage de `int` : comportement indéfini. `INT_MIN / -1`, `INT_MIN % -1` et `-INT_MIN` sont problématiques si le quotient ou l'opposé n'est pas représentable ; C17 n'impose pas universellement le complément à deux. | Identifier le type de l'opération avant de raisonner sur la destination ; proposer des cas à la borne et juste à l'intérieur, sans exécuter les cas hors plage. Ne pas supposer `int` sur 32 bits. |
| Non signé | `UINT_MAX + 1u` vaut 0 ; `0u - 1u` vaut `UINT_MAX`, modulo `UINT_MAX + 1` mathématique. Ce comportement défini peut rester une erreur de conception. Un mélange signé/non signé peut convertir les opérandes avant le calcul. | Expliquer le retour à zéro et distinguer ce mécanisme du dépassement signé. Prédire `-1 + 1u` (0) et justifier la conversion. |
| Conversions | `(int)3.75` vaut 3 ; `(int)-3.75` vaut -3. La partie entière d'un flottant doit être représentable dans le type entier ; sinon comportement indéfini en C17 général, avec dispositions particulières de l'annexe F. La conversion entier vers non signé est modulaire ; flottant vers non signé n'a pas cette garantie. `(unsigned int)-0.5` donne 0, car la partie entière est 0. Conversion vers un entier signé hors plage : résultat défini par l'implémentation ou signal défini par l'implémentation, pas une règle générale de modulo. | Séparer troncature, arrondi, réduction modulaire et conversion hors plage. Examiner les limites du type réel avant tout essai. Un cast exprime une décision, sans rendre une valeur représentable. |
| Précision flottante | Les plages, la base et la précision proviennent de `float.h`. Une valeur représentable en `double` peut perdre de la précision en `float`. Un résultat flottant hors plage n'est pas assimilé automatiquement à une infinité portable. L'exemple 0.1 est à relier à la base observée, sans imposer IEEE 754 à tout C17. | Comparer stockage et affichage ; expliquer pourquoi davantage de décimales affichées ne restaure pas l'information perdue. `FLT_EPSILON` n'est pas une tolérance universelle ; `FLT_MIN` est la borne positive normalisée, pas la valeur la plus négative. |
| Valeurs limites et GCC | Choisir 0, ±1, bornes et voisins représentables ; noter version, cible et options. Lire les avertissements sans les confondre avec une preuve de sûreté. | Produire une fiche prévision/justification/observation/conclusion et expliquer un écart. Les cas non définis restent étudiés sur papier ou en compilation seule. |

Précisions pour les conversions : une valeur entière exactement représentable en flottant est conservée ; dans la plage mais non exactement représentable, le C17 général permet le voisin supérieur ou inférieur selon un choix défini par l'implémentation. Hors plage, le comportement est indéfini dans le socle général. De même, une réduction flottante dans la plage peut arrondir ; hors plage, ne pas présumer une saturation ou une infinité portable. Les dispositions de l'annexe F doivent être étudiées séparément. Les cas de valeurs finies représentables sont ceux utilisés dans le laboratoire exécuté.

La perte de précision n'est pas systématiquement une erreur : l'apprenant doit définir la précision nécessaire, identifier une réduction volontaire et justifier une tolérance adaptée à son calcul. La conversion finale vers une destination plus large n'annule ni division entière antérieure, ni dépassement antérieur, ni arrondi déjà subi. Aucun exercice ne confond nombre de décimales affichées, chiffres significatifs et précision interne.

## 2. Périmètre et instructions

**Aucune nouvelle instruction française proposée.** Les instructions existantes suffisent pour les exercices, par exemple :

| Saisie existante | Code, hors commentaire français original conservé exactement |
|---|---|
| `Affecte à r le résultat de "7 / 2".` | `r = (7 / 2);` |
| `Affecte à q le résultat numérique de "7.0 / 2".` | `q = (7.0 / 2);` |
| `Affecte à q le résultat numérique de "(double) a / b".` | `q = (((double) a) / b);` |
| `Affecte à q le résultat numérique de "(double) (a / b)".` | `q = ((double) (a / b));` |
| `Affecte à u le résultat numérique de "0u - 1u".` | `u = (0u - 1u);` |
| `Affiche u en décimal non signé.` | `printf("%u", u);` |
| `Affiche q en notation fixe avec 6 décimales.` | `printf("%.6f", q);` |

Les guillemets délimitent l'expression, sans générer de chaîne C. Aucun saut de ligne, cast, garde, valeur, format ou en-tête implicite. `limits.h` et `float.h` restent ajoutés explicitement et manuellement ; la commande d'inclusion n'est pas élargie.

Exclusions : table des variables, analyse du programme C environnant, propagation de valeurs, évaluation générale d'expressions constantes, simulation des formats binaires, preuve de sûreté, correction automatique, compilation intégrée, conditions et boucles. Pas de vérification automatique de l'adéquation variable/format `printf` : les types réels restent inconnus.

## 3. Analyse locale minimale proposée

Ajouter un passage distinct sur l'AST déjà accepté, sans changer `translate`, sa grammaire, ses résultats canoniques ou ses diagnostics. Cette analyse dépasse la seule syntaxe dans un sens précisément borné : reconnaître un littéral nul et quelques contraintes C locales. Cette extension doit être validée explicitement ; elle n'autorise pas un évaluateur général.

Deux familles automatiques seulement :

1. **Diviseur littéralement nul** dans `/` ou `%` : reconnaître la mantisse composée uniquement de zéros, indépendamment de l'exposant, et les entiers `0`, `0u`, `0U`. Parenthèses et négations sont transparentes pour ce seul motif. Exemples : `0.0`, `.0`, `00.0`, `0e-999`, `-0.0`. Ne pas convertir le texte avec les nombres JavaScript ; ne pas confondre `1e-999` avec zéro. Ne pas traverser un cast pour établir cette preuve au lot 8.
2. **Opérande directement flottant de `%`** : littéral flottant, éventuellement parenthésé ou nié. La contrainte C exige des opérandes entiers. Priorité sur l'avis de diviseur nul pour le même opérateur : `7 % 0.0` produit ce seul avis. Les opérations imbriquées indépendantes gardent leurs avis.

Une opération dont les deux opérandes sont des littéraux entiers directs et dont le diviseur est nul permet une conclusion certaine, sous réserve que le C accepte les littéraux et que l'opération soit exécutée. La représentabilité de grands littéraux n'est pas vérifiée. Un diviseur flottant nul ou un numérateur directement flottant permet un avis dépendant du profil flottant. Avec `a / 0`, la nullité est certaine mais le type réel de `a` et les garanties applicables restent indéterminés. **Le profil syntaxique entier du lot 6 ne prouve pas que ses identifiants désignent réellement des entiers.**

Ne pas signaler automatiquement `a / b`, `7 / (1 - 1)`, `7 / (int)0`, `INT_MAX + 1`, `0u - 1u`, `(int)3.75` ou `0.1 + 0.2`. Certains sont risqués, d'autres définis ; l'absence d'avis exprime une couverture limitée, jamais une validation de sûreté. Ne pas consulter une déclaration précédente, même `b = 0`.

Les autres compétences sont enseignées et vérifiées dans le laboratoire, sans heuristiques bruyantes sur chaque calcul. Les types de littéraux ne sont pas propagés à travers des expressions composées.

## 4. Diagnostics et avis structurés

Les diagnostics de traduction restent des erreurs bloquantes, avec codes, textes, catégories et intervalles historiques inchangés. Une expression incomplète ne produit aucun fragment ni avis qui permette son insertion. Pas de nouvelles suggestions de réponses.

Les avis sont **non bloquants, y compris lorsqu'une erreur de calcul est certaine** : les lots 6 et 7 acceptent déjà syntaxiquement ces expressions, et C-A ne les exécute pas. Ce choix protège la compatibilité et doit être validé. Un avis ne change jamais le C demandé.

| Code proposé | Évaluation | Message proposé |
|---|---|---|
| `INTEGER_ZERO_DIVISOR` | `certain-error` | « Le diviseur entier est nul. Si cette opération est exécutée, son comportement est indéfini. » |
| `ZERO_DIVISOR` avec opérande flottant direct | `possible-risk` | « Le diviseur est nul. Les garanties de cette division flottante dépendent du profil C17 de l’implémentation. » |
| `ZERO_DIVISOR` avec type inconnu | `undetermined` | « Le diviseur est nul. Les types réels des opérandes sont nécessaires pour préciser les conséquences. » |
| `FLOAT_REMAINDER_OPERAND` | `certain-error` | « L’opérateur % exige des opérandes entiers ; cet opérande est flottant. » |

`certain-error` signifie ici violation certaine d'une contrainte ou opération entière non définie si exécutée ; `possible-risk` indique un contexte de garanties optionnelles ; `undetermined` conserve la distinction entre fait local connu et conséquence inconnue. Une exception flottante n'est pas une exception JavaScript ni une promesse d'arrêt du processus.

Modèle séparé proposé : `{code, category: 'calculation', severity: 'warning', assessment, message, range: {start, end}}`, dans un rapport lié au texte source exact. Intervalles UTF-16 semi-ouverts, relatifs à la phrase française originale. Pour zéro : plage de l'opérande droit complet, négation et parenthèses comprises selon l'AST ; pour `%` flottant : plage de l'opérande flottant (gauche prioritaire si les deux le sont). Aucun nouvel intervalle d'opérateur n'est nécessaire. Ordonner par début, fin puis code ; au plus un avis par opérateur.

Analyse uniquement après traduction réussie. Aucun ajout de champ dans le résultat canonique transmis au placement : son contrôle d'intégrité compare déjà les données exactes. La complexité de parcours reste bornée par les **1 024 tokens et 64 niveaux existants**, casts compris. Parcours linéaire de l'AST et des textes de littéraux ; tri des avis en O(k log k), mémoire O(n). Aucune limite supplémentaire ou troncature silencieuse des avis.

## 5. Parcours VS Code proposé

Conserver saisie → aperçu diff → confirmation → insertion, les choix existants, la validation de péremption et le placement. Les erreurs de traduction/placement ont toujours priorité.

- Saisie : utiliser `InputBoxValidationMessage` avec sévérité **Warning**, jamais une chaîne simple qui représente une erreur. VS Code permet alors toujours Entrée. Afficher le premier avis et le nombre d'avis.
- Confirmation existante : indiquer le nombre d'avis dans le titre et le premier dans le détail, sans nouvelle étape ni choix.
- Pour rendre tous les textes consultables sans troncature : canal de sortie passif **« C-A — Pédagogie »**, alimenté une seule fois par jeton d'aperçu, sans ouverture automatique ni prise de focus. Il présente la phrase et les avis structurés ; aucun envoi externe. Ce petit ajout d'interface est soumis à validation.
- Lier les avis au texte et au jeton de l'aperçu ; les invalider sur modification, péremption, annulation ou changement de cible, comme le plan existant. Le canal garde un historique clairement étiqueté, qui ne constitue pas l'état actif.
- Ne placer aucun avertissement dans le code, les commentaires français ou le diff. Ne pas sélectionner automatiquement une plage pour un simple avis. Aucun avis ne peut réactiver un jeton expiré.

## 6. Fichiers envisagés pour l'implémentation ultérieure

| Fichier | Intervention envisagée après validation |
|---|---|
| `src/calculationAdvisories.ts` (nouveau) | Types et analyse locale pure sur AST accepté |
| `test/calculationAdvisories.test.mjs` (nouveau) | Motifs, limites, plages, déterminisme et exclusions |
| `extension/src/session.ts` | Rapport séparé, cycle de vie lié au texte/jeton ; `diagnose` reste bloquant uniquement |
| `extension/src/extension.ts` | Affichage non bloquant et canal passif |
| Tests de session et suites hôte sous `test` / `extension` | Préservation du parcours, avis et péremption |
| `package.json` si nécessaire | Inclusion de la nouvelle suite selon le mécanisme actuel, aucune dépendance |
| Documentation et recette de domaine | Statut approuvé/livré, résultats réellement observés |

Pas de refonte prévue de `expression.ts`, `numericExpression.ts`, `numericInstructions.ts`, `translate.ts`, du placement ni du stockage de l'aperçu. Aucun changement de `.vscode/tasks.json` ni de l'installation personnelle de VS Code.

## 7. Tests automatisés à réaliser après validation

1. Rejouer intégralement les suites historiques et fixtures exactes : mêmes traductions, commentaires, AST, diagnostics et plages. Les 1 530 tests Node et 45 tests hôte du bilan lot 7 constituent une référence, pas un nouveau résultat.
2. Zéros : `7/0`, `7u%0U`, `7/(-0)`, `1.0/0.0`, `a/0`, `a/0.0`, `.0`, `00.0`, `0e-999`, `-0.0` ; messages et évaluations exacts. Non-zéros minuscules `1e-999` sans faux avis.
3. `%` flottant gauche/droite, négations, parenthèses, deux côtés, priorité de `7%0.0` ; avis indépendants imbriqués et ordre déterministe.
4. Exclusions explicites : identifiants, macro `INT_MAX`, zéros calculés, casts, conversions, débordements apparents sur hypothèse 32 bits ; aucun calcul ni recherche de symbole. Un littéral très long n'est pas évalué en JavaScript.
5. Plages UTF-16 exactes avec accents, espaces initiaux, fins de lignes, parenthèses et négations. Un caractère non BMP dans une phrase invalide conserve le diagnostic historique et aucun avis ; tester aussi le calcul d'offset UTF-16 sur fixtures source/ranges sans élargir la grammaire des identifiants.
6. Bornes historiques : 1 023/1 024/1 025 tokens, 63/64/65 niveaux avec casts ; rejet inchangé au-delà, aucun avis sur résultat rejeté. Expressions longues avec nombreux opérateurs sans exception ni résultat non déterministe.
7. Résultats canoniques et placement strictement identiques avec/sans consultation des avis ; LF/CRLF, indentation, curseur, non-sauvegarde, annuler/rétablir.
8. VS Code : Entrée ouvre l'aperçu malgré l'avis ; choix Insérer toujours disponible ; C inchangé dans un fichier d'étude jamais exécuté. Erreur incomplète bloque toujours. Modifier, annuler, déplacement du curseur et édition concurrente invalident les avis actifs et le jeton. Pas de focus volé par le canal ; journalisation unique par aperçu ; tous les avis consultables.
9. Contrôle TypeScript, tests Node, tests hôte Windows. Aucun test ne valide la valeur d'une expression indéfinie par son exécution. Les essais GCC manuels sont séparés, sans mécanisme de compilation ajouté au produit.

## 8. Recette, état des preuves et avertissement d'environnement

Le [protocole complet du domaine](RECETTE_EXPRESSIONS_CALCULS.md) fournit le programme de synthèse sûr, les variantes, les cas de lecture seule et la fiche de résultat. La recette n'est pas déclarée passée à ce stade. Lot 6 : addition entre variables, priorité et parenthèses seules confirmées manuellement. Lot 7 : bilan automatisé livré, recette complète encore ouverte. Les trois scénarios manuels précis du lot 5 restent ceux du document fondateur, sans extension implicite.

Au lot 7, l'hôte portable Windows VS Code 1.96.4 a émis **« Error mutex already exists »** et **DEP0168 / « Uncaught N-API callback exception »** au lancement/arrêt. Le rapport final indiquait 45 tests hôte réussis, 0 échoué et sortie 0. Origine non qualifiée ; ni résolution revendiquée, ni attribution certaine à C-A, ni classement définitivement bloquant ou non bloquant. Lors de la prochaine recette, consigner version, profil, instances actives, instant, pile, code de sortie et effets visibles. Conserver les traces disponibles (`.cache/lot7-vscode.log`, `.cache/vscode-test/results.json`, journaux du profil isolé). Si une session ne démarre pas ou un scénario échoue, noter le blocage concret de cette session séparément du résultat fonctionnel. Ne pas réinitialiser silencieusement l'installation ou tuer des instances utilisateur.

## 9. Décisions soumises à validation

1. Aucun ajout de grammaire ; compétences principalement enseignées par laboratoire et lecture du C.
2. Extension locale strictement limitée aux deux familles ci-dessus, sans propagation de types/valeurs, casts transparents ni évaluation générale.
3. Avis séparés et non bloquants, même pour une erreur certaine, afin de préserver les traductions historiques.
4. Taxonomie, codes, messages, plages et priorités proposés.
5. Présentation dans les widgets existants et canal de sortie passif pour l'intégralité des avis, sans nouveau passage obligatoire.
6. Programme exécuté uniquement défini ; division flottante par zéro et cas hors plage étudiés sans exécution dans la recette standard, sans expérience annexe F supplémentaire.

## Références techniques

Les règles concernées sont C17 §6.2.5, §6.3.1.3–5, §6.5 et §6.5.5, §7.21.6.1, annexe F. Les [documents publics du WG14](https://www.open-std.org/jtc1/sc22/wg14/www/docs/) permettent d'en suivre les travaux ; [N1548](https://www.open-std.org/jtc1/sc22/wg14/www/docs/n1548.pdf) est un brouillon **antérieur à C17**, cité pour les clauses correspondantes, pas présenté comme l'édition C17. Le contrat distingue le socle C17 des dispositions optionnelles de l'annexe F.

GCC documente séparément [les avertissements et `-fsyntax-only`](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html) et [l'instrumentation](https://gcc.gnu.org/onlinedocs/gcc/Instrumentation-Options.html). Les diagnostics ne couvrent pas tous les comportements indéfinis ; les contrôles d'exécution ne constituent pas une preuve de sûreté. En particulier, le contrôle flottant de division par zéro est distinct de `-fsanitize=undefined`.
