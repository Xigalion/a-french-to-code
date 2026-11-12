# A — Vision du langage assisté C

## Finalité
A est le projet global de langages assistés pédagogiques. **C-A** est son premier traducteur : il traduit un français contrôlé vers du C17 pour faciliter l'apprentissage sans masquer les concepts, les types, les dépendances et la structure du programme. Le code produit reste destiné à des fichiers `.c`, sans extension propre à C-A. De futurs traducteurs pourront suivre la convention Rust-A ou Java-A.

## Principes validés
- Le fichier C est la source de vérité, visible et librement modifiable. A n'écrase jamais automatiquement les modifications manuelles.
- Le fichier initial est entièrement vide. A n'invente ni variable, ni conversion, ni logique, ni fonction englobante, ni main.
- Une phrase reconnue reçoit sa traduction fidèle, même si le programme comporte une erreur de programmation. A ne garantit pas sa compilation ni son comportement.
- Une phrase non reconnue ou incomplète ne produit aucune insertion, même partielle.
- Le curseur fixe l'emplacement demandé. A refuse une insertion qu'il ne sait pas effectuer sans altérer incorrectement le document ; il explique sa limite sans analyser tout C17.
- Une demande explicite de fonction produit sa structure complète avec accolades. Aucun return 0; n'est ajouté implicitement.
- Les en-têtes sont inclus uniquement sur demande explicite, isolée au lot 4 ; une formulation combinée reste future.
- La phrase française est conservée en commentaire au-dessus du fragment. Elle indique son origine, pas son équivalence permanente après modification manuelle.
- L'aperçu montre toutes les modifications avant validation par Entrée. Compilation et exécution restent distinctes par défaut ; les diagnostics GCC originaux sont conservés.
- La V1 finale vise une barre personnalisée VS Code avec localisation des erreurs ; une interface provisoire plus simple est autorisée.
- Le moteur est déterministe, indépendant de VS Code, local et utilisable hors ligne. L'extension est légère ; l'intégration GCC est séparée.

## Portée et progression
La [documentation fondatrice](../../A_DOCUMENTATION_FONDATRICE.md) explique la raison d'être de A, sa philosophie, son fonctionnement et son évolution. Les capacités livrées et leur grammaire restent décrites dans SPECIFICATIONS.md ; les arbitrages sont consignés dans DECISIONS.md.

La première direction pédagogique officiellement lancée est **Algorithmique et développement logiciel en C17** : permettre à un débutant de concevoir, développer, compiler, tester, déboguer et maintenir un logiciel modulaire et fiable. Le référentiel initial couvre fondations ; expressions et calculs ; décisions et répétitions ; fonctions et décomposition ; tableaux, chaînes et pointeurs ; structures et mémoire dynamique ; fichiers et modularité ; algorithmes et structures de données ; fiabilité et maîtrise avancée. Il évoluera selon les compétences et leurs dépendances, sans calendrier de lots figé. La fiabilité s'enseigne dès les premiers exercices.

Deux dimensions sont indépendantes : les compétences acquises et les **paliers de liberté** de l'interaction (appelés « niveaux » dans les lots antérieurs). Tous les paliers doivent permettre les mêmes résultats de programmation, dans les capacités prises en charge. Le palier 1 exige la précision et explique les manques ; les paliers futurs pourront autoriser davantage de décisions implicites tout en permettant la précision explicite. Aucun palier futur n'est implémenté. Aucune définition détaillée du palier 3 n'a été retrouvée dans les décisions présentes ; ce point du document fondateur reste à clarifier.

Le [contrat approuvé du lot 6](../../LOT6_CONTRAT_PROPOSE.md) est implémenté : calculs élémentaires sur les entiers et petite calculatrice à données fixées dans le programme. Les expressions entre guillemets utilisent les opérateurs du C ; les guillemets ne créent pas de chaîne C. Chaque opération est parenthésée dans le code produit. L'analyse est purement syntaxique : une traduction réussie ne garantit ni compilation ni exécution valide. Le porteur confirme manuellement l'addition entre variables, la priorité des opérations et les parenthèses explicites. La [recette manuelle](../../RECETTE_LOT6.md) reste partielle ; sa validation complète sera regroupée à la fin du lot 8 avec celle du domaine Expressions et calculs.

Le [lot 7 — Types numériques et conversions](../../LOT7_CONTRAT_PROPOSE.md) est approuvé et implémenté : types int, unsigned int, float et double explicitement demandés ; déclarations et initialisations ; littéraux et casts ; formats %u et flottants avec précision obligatoire de 0 à 20. Une branche « résultat numérique » et un AST dédié conservent intégralement le fonctionnement du lot 6. L'analyse reste syntaxique, sans choix automatique de type, cast, suffixe ou format. Les conversions implicites normales du C restent applicables ; une conversion flottant vers entier hors plage peut avoir un comportement indéfini. Le laboratoire prévoit des inclusions manuelles explicites de limits.h et float.h ; aucune bibliothèque n'est ajoutée par C-A. Le lot 8 est désormais livré ; la recette complète du domaine reste à effectuer selon son protocole final.

Le catalogue et les tests figurent dans SPECIFICATIONS.md. Le lot 1 a été autorisé : MAIN, DECL_INT, INIT_INT et ASSIGN_INT sont implémentés dans un moteur autonome. Le point final est facultatif, les mots fixes sont insensibles à la casse et les tabulations sont admises comme séparateurs ; les identifiants et le commentaire original ne sont pas normalisés. L'instruction reste monoligne.

Le lot 2 a ensuite été autorisé et implémenté : plan de placement des quatre fragments sur une ligne blanche, indentation fondée sur cette ligne, analyse lexicale conservatrice et vérification des plans périmés. Les restrictions de ce lot sont temporaires, pas des limites définitives de C-A. Aucun fichier utilisateur n'est écrit par le moteur.

Le lot 3 a été autorisé : une première extension VS Code bureau est implémentée pour les fichiers .c ordinaires, y compris non enregistrés après modification. Elle utilise une InputBox native, un diff avant/après en lecture seule puis une confirmation QuickPick. La première Entrée prépare seulement l'aperçu ; seule l'action « Insérer » autorise une édition unique annulable. Une instruction par session ; commande réutilisable par Ctrl+K puis A (Cmd+K puis A sur macOS).

La cible est capturée explicitement et n'est pas remplacée par l'éditeur du diff. Un changement du document, du curseur, des sélections, de l'indentation ou de la convention LF/CRLF invalide le plan. Les moteurs restent indépendants de VS Code ; une option générique de repli de fin de ligne permet de respecter le réglage de l'éditeur lorsqu'un fichier ne contient encore aucun saut de ligne.

Le lot 4 ajoute INCLUDE_STDIO, PRINT_INT et PRINT_TEXT. Les affichages n’ajoutent aucun retour à la ligne : seul un échappement explicitement saisi le demande. Les inclusions sont placées au curseur, répétées si redemandées, sans ajout implicite ni réorganisation. Le texte littéral possède une grammaire fermée, sans format printf fourni par l’utilisateur. La recette manuelle du lot 3 a été validée par le porteur ; interface persistante, publication, autres instructions et GCC restent hors périmètre.

Le lot 5 ajoute les formats explicitement demandés décimal, hexadécimal et octal. Au niveau 1 destiné aux débutants, une information manquante est expliquée sans proposer de réponse ; aucune instruction incomplète ne peut être insérée. Les sept intentions historiques restent disponibles. A comportera trois niveaux : niveau 1 explicite et pédagogique ; niveau 2 avec formulations plus concises et choix implicites possibles, précision toujours disponible ; niveau 3 à définir séparément. Seul le niveau 1 est implémenté.

La revue de stabilisation du lot 1 vérifie les quatre traductions, la séparation des commentaires, les positions UTF-16 et la conservation des littéraux. Les tests et le contrôle statique TypeScript sont exécutables séparément. Le compilateur TypeScript est une dépendance de développement uniquement ; le moteur reste sans dépendance d'exécution.

Public : débutants, étudiants et enseignants en C, notamment systèmes et embarqué. Le premier parcours proposé concerne un programme hébergé simple ; il ne garantit pas les conventions de démarrage propres à l'embarqué.

Dépôt GitHub initialement privé ; publication après validation de la V1.

## Évolutions et exclusions
Pas d'analyseur C17 complet, de correction automatique ni d'agent autonome. Les conditions simples du lot 9 sont étendues au lot 10 par la logique et les branches explicites ; boucles, fonctions à paramètres et configuration de projets multifichiers restent hors catalogue actuel.

Évolutions futures : niveaux 2 et 3 selon des contrats séparés, paramètres et gabarits enseignants, autocomplétion avancée, autres langues naturelles et langages cibles. Elles ne modifient pas les exigences actuelles du niveau 1.

## Lot 8 — Fiabilité des calculs

Le [contrat Fiabilité des calculs](../../LOT8_CONTRAT_PROPOSE.md) est approuvé et implémenté au 3 novembre 2026, sans changement des paliers. La traduction reste syntaxique ; un canal distinct d'avis locaux explique le diviseur littéralement nul et l'opérande directement flottant de `%`, sans correction ni preuve de sûreté. Ces avis sont non bloquants, visibles avant confirmation et consultables dans « C-A — Pédagogie ». Le porteur confirme le 5 novembre leur vérification manuelle. La [recette finale de domaine](../../RECETTE_EXPRESSIONS_CALCULS.md) reste ouverte dans VS Code et avec GCC ; cette confirmation partielle ne la clôt pas. Les limites et preuves historiques figurent au [bilan](../../LOT8_BILAN.md).

## Domaine 3 — Décisions et répétitions, lot 9 livré

Le porteur ouvre ce domaine puis autorise le [contrat du lot 9](../../LOT9_CONTRAT_PROPOSE.md), désormais implémenté : comparaisons, vérité zéro/non-zéro et bloc if explicite. Les conditions composées/branches multiples puis répétitions/terminaison restent futures ; aucun lot 10 commencé. Les compétences restent indépendantes des paliers de liberté. Les lots 1 à 8 sont préservés et la recette GCC complète Expressions et calculs reste ouverte. Aucun choix de condition, contenu de bloc ou branche supplémentaire n'est délégué au palier 1. La réussite automatique ne vaut pas validation manuelle pédagogique ; voir bilan et limites dans le contrat.

## Lot 10 — conditions composées et branches livrées, 6 novembre 2026

Le porteur confirme manuellement deux gestes du lot 9 : créer un if et insérer une instruction dans son bloc. Le [contrat du lot 10](../../LOT10_CONTRAT_PROPOSE.md) est maintenant approuvé et implémenté : logique &&/||/!, branches explicites ELSE_IF/ELSE, curseur contrôlé exclusivement. Le rattachement est reconnu dans un sous-ensemble bracé borné ou refusé ; aucune branche, condition ou contenu n'est inventé et aucune accolade existante n'est modifiée. Les informations pédagogiques restent passives, sans garantie de sûreté. Les compétences restent indépendantes des paliers. La [recette manuelle du lot 10](../../RECETTE_LOT10.md), la recette GCC complète Expressions et calculs et la qualification mutex/N-API restent ouvertes. Aucun lot 11 commencé.

## Lot 11 — préparation des boucles, 7 novembre 2026

La [proposition de découpage et premier contrat](../../LOT11_CONTRAT_PROPOSE.md) recommande while d'abord, puis test final, clauses for et enfin break/continue contextualisés, sous autorisations distinctes. Les paliers restent indépendants des compétences. Le palier 1 n'invente ni condition, valeur initiale, progression ou instruction ; le premier bloc serait vide et rempli par demandes explicites. C-A ne cherche pas à prouver la terminaison ou analyser tout le programme. Aucune boucle nouvelle n'est implémentée. La recette manuelle du lot 10 doit être intégrée à la recette finale du domaine 3 ; elle reste ouverte, de même que la recette GCC complète Expressions et calculs et la qualification mutex/N-API.

## Responsabilités
- Porteur du projet : vision, priorités et validation fonctionnelle et pédagogique.
- ChatGPT : conception, exemples, critères d'acceptation et analyse des propositions.
- Codex : architecture, revue, implémentation après autorisation, tests et maintenance des documents.
