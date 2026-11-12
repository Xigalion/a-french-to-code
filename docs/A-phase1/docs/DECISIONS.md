# A — Journal des décisions

Ce document doit évoluer avec le projet. Toute modification significative du comportement du traducteur doit mettre à jour les spécifications et ce journal dans le même changement de code.

| ID | Décision | Statut |
|---|---|---|
| D-078 | Préparer le contrat du lot 8 — Fiabilité des calculs, sans implémentation ; préserver les lots 1 à 7 | Préparation demandée le 2 novembre 2026 |
| D-079 | Avis locaux séparés, non bloquants, deux familles seulement et canal de sortie passif | Approuvée et implémentée le 3 novembre 2026 |
| D-080 | Recette de domaine avec programme sûr ; cas indéfinis étudiés sans exécution ; suivi mutex/N-API non résolu | Protocole final après approbation ; recette manuelle encore ouverte |
| D-081 | Division entière par zéro et contrainte de % flottant distinguées ; profil flottant/annexe F non présumé ; absence d'avis sans garantie de sûreté | Approuvée et vérifiée par les tests du lot 8 |
| D-082 | Préserver code, commentaires, résultat canonique, placement et parcours ; attente initiale de validation du domaine Expressions et calculs avant le domaine suivant | Livraison et limites dans [LOT8_BILAN.md](../../LOT8_BILAN.md) ; attente remplacée pour la préparation seulement par D-083, recette toujours ouverte |
| D-083 | Ouvrir officiellement le domaine 3 Décisions et répétitions et préparer le contrat du lot 9 sans implémentation ; confirmer les deux avertissements pédagogiques du lot 8 manuellement | Demandée par le porteur le 5 novembre 2026 ; aucune clôture de recette GCC complète du domaine 2 |
| D-084 | Contrat IF, conditions simples, blocs, curseur, diagnostics et réemploi des avis ; découpage 9/10/11 et référentiel détaillé | Approuvé par le porteur pour le lot 9 et implémenté ; lots 10–11 non engagés |
| D-085 | Placement intérieur limité à MAIN et IF canoniques, sans analyse générale des portées ; tests numériques et une comparaison au plus ; aucune correction de = | Adoptée et implémentée ; détails et résultats au [bilan du lot 9](../../LOT9_CONTRAT_PROPOSE.md#11-bilan-dimplémentation-du-lot-9--5-novembre-2026) |
| D-086 | Préserver la recette GCC ouverte du domaine 2, les motifs du lot 8 et les sorties historiques ; aucun lot 10 commencé | 1 847 tests Node et 61 hôte VS Code Windows 1.96.4 réussis, 0 échec/ignoré ; TypeScript sans diagnostic ; mutex/N-API toujours à qualifier |
| D-087 | Préparer le lot 10 puis implémenter après approbation distincte | Autorisation reçue du porteur ; [contrat approuvé et bilan](../../LOT10_CONTRAT_PROPOSE.md) |
| D-088 | Logique C17 et ciblage au curseur contrôlé exclusivement ; refus conservateurs ; sélection reportée | Adoptée et implémentée au lot 10 ; aucune branche devinée ni accolade existante modifiée |
| D-089 | Création d'un bloc if et insertion d'une instruction intérieure au lot 9 vérifiées manuellement | Attestation du porteur le 6 novembre ; portée limitée à ces deux gestes. Recette GCC complète Expressions et calculs et qualification mutex/N-API toujours ouvertes |
| D-090 | &&, || et ! avec précédence C17 ; anciennes sorties acceptées conservées, limites globales 1 024/64 | Adoptée et implémentée |
| D-091 | ELSE_IF/ELSE sur une ligne adjacente reconnue, sans else terminal ni suite existante ; bornes documentaires et revalidation exacte du plan | Adoptée et implémentée ; aucun contenu déplacé |
| D-092 | Informations passives &&/||/! dans C-A — Pédagogie, séparées des Warning ; motifs du lot 8 conservés dans les sous-expressions | Adoptée et implémentée sans évaluation ou garantie de sûreté |
| D-093 | Recette GCC Expressions et calculs et qualification mutex/N-API maintenues ouvertes ; aucun lot 11 | 1 983 tests Node et 68 hôte réussis, 0 échec/ignoré ; TypeScript sans diagnostic ; [recette manuelle lot 10 à effectuer](../../RECETTE_LOT10.md) |
| D-094 | Préparer le découpage des boucles et le contrat du premier incrément, sans code applicatif ni implémentation | Demandée par le porteur le 7 novembre 2026 ; [proposition lot 11](../../LOT11_CONTRAT_PROPOSE.md) |
| D-095 | 11A while, 11B test final, 11C for, 11D break/continue ; bloc vide, progression explicite, conditions réutilisées et information passive de pré-test | Propositions à valider, non adoptées et non implémentées ; formulations futures non contractuelles |
| D-096 | Maintenir la recette GCC Expressions et calculs, intégrer la recette manuelle lot 10 à la recette finale du domaine 3, qualifier mutex/N-API | Trois suivis explicitement ouverts ; aucun résultat de recette ou de test nouveau revendiqué par cette préparation |
| D-001 | Premier langage cible : C17 | Adoptée |
| D-002 | Langue de saisie V1 : français contrôlé | Adoptée |
| D-003 | Le code C généré est la source de vérité | Adoptée |
| D-004 | Phrase validée conservée en commentaire au-dessus du bloc C | Adoptée |
| D-005 | Aperçu avant insertion ; validation par Entrée | Adoptée |
| D-006 | Compilation et exécution distinctes de l'insertion par défaut | Adoptée |
| D-007 | GCC pour compiler et produire les diagnostics | Adoptée |
| D-008 | Aucune correction ou inférence logique silencieuse | Adoptée |
| D-009 | Fonctionnement local et hors ligne visé | Adoptée |
| D-010 | Interface cible : extension VS Code | Adoptée |
| D-011 | Niveaux de liberté futurs, noms provisoires (dont « Master ») | Adoptée |
| D-012 | Le fichier C commence entièrement vide | Adoptée |
| D-013 | `main` doit être demandé et construit explicitement | Adoptée |
| D-014 | Toute bibliothèque doit être demandée explicitement en V1 | Adoptée |
| D-015 | La bibliothèque peut être nommée dans la même phrase que l'opération | Possibilité future ; explicitement reportée au lot 4 par D-050 |
| D-016 | Ajout automatique de bibliothèques réservé au degré de liberté ultérieur | Adoptée |
| D-017 | Contrôle des bibliothèques par l'enseignant réservé à une évolution | Adoptée |
| D-018 | Autocomplétion et texte fantôme : évolution ultérieure, sans IA requise | Adoptée |
| D-019 | Une intention définie au catalogue par phrase ; une demande explicite peut produire une structure complète ou une opération avec son en-tête | Adoptée ; précisée par la validation de la revue |
| D-020 | Dépôt GitHub initialement privé, publication après validation V1 | Adoptée |

## Validation de la revue technique — 22 octobre 2026
Les arbitrages suivants sont validés par le porteur du projet. Ils remplacent les propositions divergentes de la revue, notamment le rejet systématique des noms inconnus ou des dépendances absentes.

| ID | Décision | Statut |
|---|---|---|
| D-021 | Une phrase reconnue est traduite fidèlement même si le programme est incorrect ; aucune correction silencieuse | Adoptée |
| D-022 | Une phrase non reconnue ou incomplète ne provoque aucune insertion, même partielle | Adoptée |
| D-023 | Le curseur détermine l'emplacement demandé ; refus expliqué si l'insertion documentaire ne peut être effectuée sûrement, sans analyseur C17 complet | Adoptée |
| D-024 | Une demande explicite de fonction produit ses accolades complètes ; aucun return 0; implicite | Adoptée |
| D-025 | Le code est librement modifiable ; aucune modification manuelle n'est écrasée automatiquement | Adoptée |
| D-026 | Barre personnalisée VS Code finale avec aperçu et localisation ; interface provisoire simplifiée autorisée | Adoptée |
| D-027 | Moteur déterministe indépendant, extension légère, intégration GCC séparée | Adoptée |
| D-028 | Mise à jour documentaire et préparation des tests autorisées ; développement applicatif soumis à une autorisation ultérieure du premier lot | Adoptée |

## Autorisation et réalisation du lot 1 — 22 octobre 2026
D-028 décrit la restriction initiale. L'autorisation ultérieure ci-dessous ouvre uniquement le lot 1, pas les lots suivants.

| ID | Décision | Statut |
|---|---|---|
| D-029 | Lot 1 autorisé : MAIN, DECL_INT, INIT_INT, ASSIGN_INT ; aucun placement documentaire, extension VS Code ou GCC | Adoptée et implémentée |
| D-030 | Point final facultatif, mots fixes insensibles à la casse, tabulations acceptées comme séparateurs ; instruction monoligne | Adoptée et implémentée |
| D-031 | Identifiants sensibles à la casse, phrase originale intégralement conservée ; positions UTF-16, aucun code en cas de refus | Adoptée et implémentée |
| D-032 | Résultats structurés séparant intention, paramètres, fragments et diagnostics ; étape indépendante de planification documentaire | Adoptée ; traduction au lot 1, placement désormais implémenté au lot 2 |

Choix techniques du lot : TypeScript exécuté par Node >=24.12.0, sans dépendance d'exécution ; tests natifs Node. L'effacement des types n'effectue pas de vérification statique. La stabilisation ajoute le contrôle tsc décrit ci-dessous. Diagnostics et commandes exactes sont documentés dans SPECIFICATIONS.md §8.

## Nommage validé et stabilisation du lot 1 — 22 octobre 2026

| ID | Décision | Statut |
|---|---|---|
| D-033 | A est le nom du projet global | Adoptée par le porteur du projet |
| D-034 | C-A est le nom du premier traducteur, ciblant C17 | Adoptée par le porteur du projet |
| D-035 | Le code C produit reste destiné à des fichiers `.c`, sans extension spécifique C-A | Adoptée par le porteur du projet |
| D-036 | Les futurs traducteurs pourront suivre la convention Rust-A, Java-A, etc. | Adoptée par le porteur du projet |

Dans le cadre de la revue autorisée, Codex ajoute un contrôle technique `tsc --noEmit` : TypeScript 5.9.3, seule dépendance de développement, sans ajout de dépendance d'exécution. Version verrouillée, configuration stricte, aucun fichier compilé produit. `npm run check` exécute ce contrôle puis les tests. Ce choix d'outillage ne modifie ni les formulations ni leur signification pédagogique.

La revue confirme les quatre traductions et la conservation exacte des littéraux ; aucun défaut fonctionnel confirmé. Les accès indexés et invariants de paramètres sont renforcés pour le contrôle statique. Bilan de cette étape : 185 tests réussis, aucun échec ; contrôle statique sans diagnostic. La sécurité des commentaires est vérifiée pour les fragments autonomes ; la sûreté vis-à-vis du document adjacent n'est pas revendiquée au lot 1. À ce stade, le lot 2 n'était pas encore autorisé ; son autorisation ultérieure est consignée ci-dessous.

## Autorisation et réalisation du lot 2 — 22 octobre 2026

| ID | Décision | Statut |
|---|---|---|
| D-037 | Placement documentaire indépendant de VS Code autorisé pour les quatre intentions du lot 1 ; aucune écriture de fichier, compilation ou correction du programme | Adoptée et implémentée |
| D-038 | Ligne blanche uniquement, indentation de cette ligne sans inférence depuis les accolades, contrôle lexical conservateur et refus explicites | Adoptée et implémentée ; restrictions temporaires propres au lot 2 |
| D-039 | Résultat sous forme de plan structuré, offsets UTF-16, texte extérieur inchangé, curseur final permettant les insertions successives | Adoptée et implémentée |
| D-040 | Vérification des invariants des traductions reçues et refus d'un plan périmé sur changement d'identité, révision ou texte | Adoptée et implémentée |

API : planPlacement et validatePlan, détaillées dans SPECIFICATIONS.md §4. Les erreurs C ne sont pas contrôlées par le placement. Les diagnostics distinguent requête invalide, emplacement dangereux, construction non prise en charge et plan périmé. Les inclusions directes simples déjà présentes sont conservées ; macros, conditions et autres directives avant la cible sont refusées, sans prétendre qu'elles sont du C incorrect. Aucun en-tête n'est ajouté.

Les contrôles de continuité physiques incluent, par conservatisme, tabulations et espaces verticaux/form-feed après l'antislash. NUL avant la cible est également refusé comme construction non prise en charge. Aucun élargissement du catalogue ou ajout de dépendance n'est introduit.

Bilan de cette étape : 143 tests de placement ajoutés, soit 328 tests réussis, aucun échec ; tsc sans diagnostic. Le lot 3 n'était pas encore autorisé. Son autorisation et son bilan sont consignés ci-dessous.

## Lot 3 — interface native VS Code autorisée et implémentée

| ID | Décision | Statut |
|---|---|---|
| D-041 | Prototype natif : InputBox, diff complet avant/après en lecture seule, QuickPick de confirmation | Adoptée et implémentée |
| D-042 | Première Entrée : aperçu uniquement ; seule l'action Insérer autorise l'édition | Adoptée et implémentée |
| D-043 | VS Code bureau, fichiers .c ordinaires locaux, brouillons non enregistrés inclus, une instruction par session | Adoptée et implémentée |
| D-044 | Cible capturée explicitement ; invalidation stricte du document, curseur, sélection, indentation et LF/CRLF ; aucune redirection depuis le diff | Adoptée et implémentée |
| D-045 | Commande réutilisable c-a.translate ; raccourci Ctrl+K puis A, Cmd+K puis A sur macOS ; contrôleur séparé des widgets pour une future interface persistante | Implémentée dans le périmètre autorisé ; touche physique à vérifier manuellement |
| D-046 | Une seule édition annulable par confirmation, aucune sauvegarde, compilation GCC ou correction automatique | Adoptée et vérifiée automatiquement dans l'hôte |

Choix technique d'intégration : option pure facultative fallbackEol dans planPlacement, LF par défaut, prise en compte seulement sans fin de ligne existante à la cible ou avant elle. VS Code transmet sa métadonnée LF/CRLF. Les 328 tests historiques et les comportements par défaut des moteurs restent inchangés ; aucun type VS Code n'entre dans les moteurs. Une modification EOL séparée a été écartée après un test réel montrant qu'elle n'était pas annulée avec le remplacement textuel.

Les réglages effectifs insertSpaces, indentSize et tabSize sont lus depuis l'éditeur capturé, pas depuis une configuration globale supposée. L'extension est compilée en CommonJS pour l'hôte, sans dépendance à l'exécution TypeScript native de Node 24. @types/vscode 1.96.0 est ajouté comme seule dépendance de développement supplémentaire.

La commande et les documents virtuels ne donnent aucun accès direct à un applicateur sans confirmation. Les URI d'aperçu sont propres à l'activation pour éviter la réutilisation d'un modèle périmé en cache. Les contrôles de frappe physiques et d'IME restent une recette manuelle : les tests hôte acceptent/ferment les vrais widgets avec des commandes natives, sans simuler le clavier physique.

Les commandes de lancement local et de vérification figurent dans SPECIFICATIONS.md §10. Aucune fonctionnalité avancée, interface personnalisée ou intégration GCC n'est autorisée par cette livraison.

Bilan final automatisé : 367 tests Node réussis (334 moteurs et 33 sessions), 21 tests dans un vrai hôte VS Code Windows 1.96.4 réussis, aucun échec ; contrôle TypeScript sans diagnostic. Clavier physique, IME et recette visuelle restent à vérifier manuellement. L'installation utilisateur étant bloquée par une mise à jour, les tests d'hôte ont utilisé une archive officielle portable, un profil isolé et des fixtures sous .cache, sans modifier l'installation personnelle.

## Lot 4 — bibliothèques et affichage autorisés

| ID | Décision | Statut |
|---|---|---|
| D-047 | Recette manuelle du prototype lot 3 validée par le porteur ; interface persistante reportée | Validée |
| D-048 | INCLUDE_STDIO, PRINT_INT et PRINT_TEXT selon SPECIFICATIONS.md §3 | Adoptée et implémentée |
| D-049 | Aucun saut de ligne implicite ; formats constants %d et %s | Adoptée et implémentée |
| D-050 | Inclusion au curseur, répétée si demandée ; ni préambule, ni déduplication, ni commande combinée | Adoptée et implémentée |
| D-051 | Chaînes Unicode valides, guillemets ASCII, quatre échappements ; contrôles et trigraphes refusés ; diagnostics UTF-16 | Adoptée et implémentée |
| D-052 | Un fragment par instruction ; interface native inchangée, aucune dépendance supplémentaire ni GCC | Adoptée et implémentée |

D-049 remplace la proposition P-002 d'affichage avec fin de ligne. D-050 remplace la proposition de zone d'en-têtes de P-003 et la suppression des doublons. P-001 est partiellement réalisée : fonctions ordinaires, blocs, retours, arithmétique et commande combinée restent non reconnus. La navigation persistante et les insertions multiples de P-004 restent futures. Le contrat courant est SPECIFICATIONS.md ; les anciens candidats ne constituent pas le comportement actuel.

## Répartition des tâches
- **Porteur du projet :** décisions de produit, validation des phrases et des explications.
- **ChatGPT :** rédaction du contrat, conception des tests pédagogiques, revue des propositions.
- **Codex :** recommandations d'architecture, moteur, extension, intégration GCC, tests automatisés et maintien à jour des documents.

Bilan du lot 4 : 434 tests Node et 22 tests dans l’hôte VS Code Windows 1.96.4 réussis, 0 échec, 0 ignoré ; TypeScript sans diagnostic. Base historique de 388 tests conservée ; le refus historique de PRINT_INT a été remplacé par une formulation inconnue et la nouvelle intention est vérifiée positivement. Aucun ajout de dépendance. Le lancement hôte dans le bac à sable a échoué sans rapport ; la relance autorisée hors bac à sable avec profil isolé a réussi.

## Lot 5 — formats explicites et diagnostics pédagogiques — 23 octobre 2026

| ID | Décision | Statut |
|---|---|---|
| D-053 | Contrat du lot 5 validé par le porteur : formats explicites décimal, hexadécimal et octal, sorties exactes %d, %x et %o | Adoptée et implémentée |
| D-054 | PRINT_FORMATTED distinct ; conservation des sept intentions historiques, de leurs sorties et diagnostics, sauf formulations auparavant inconnues désormais prises en charge | Adoptée et vérifiée |
| D-055 | Niveau 1 : format absent expliqué sans réponse suggérée ; distinction MISSING_DISPLAY_FORMAT / UNSUPPORTED_DISPLAY_FORMAT ; absence de nom via INCOMPLETE_INSTRUCTION | Adoptée et implémentée |
| D-056 | Intervalles UTF-16 dans la saisie originale ; refus sans fragment et sans insertion ; priorités la/le/en protégeant les branches historiques | Adoptée et vérifiée |
| D-057 | Séparation interne minimale : analyse partielle, exigences du niveau 1, génération et construction des diagnostics ; API translate(text) conservée, aucune configuration de niveau | Adoptée et implémentée |
| D-058 | Trois niveaux progressifs ; seul le niveau 1 est implémenté. Niveau 2 à préciser ultérieurement ; aucune règle inventée pour le niveau 3 | Adoptée |

Le commentaire conserve exactement la saisie. Aucun saut de ligne affiché, en-tête, conversion de type ou fragment implicite. Aucun contrôle d'existence/type des variables, modification du placement ou du parcours VS Code, dépendance ou mécanisme de compilation supplémentaire. PRINT_INT reste inchangé pour compatibilité.

Les détails de grammaire, diagnostics et ambiguïtés figurent dans SPECIFICATIONS.md §3. Une fixture de 182 résultats du moteur historique protège exactement les sept intentions et leurs diagnostics. Les tests ajoutés couvrent les trois formats, les variantes lexicales, tous les mots-clés C17, les intervalles UTF-16, les refus sans suggestions, les placements successifs LF/CRLF, la vérification canonique et le blocage des anciens jetons après modification de phrase.

Bilan automatisé du lot 5 : **799 tests Node réussis, 0 échoué, 0 ignoré ; contrôle TypeScript sans diagnostic ; 28 tests réussis dans l'hôte VS Code Windows 1.96.4, 0 échoué**, soit 827 tests réussis. Les 434 tests Node et 22 tests hôte du lot 4 sont conservés. L'hôte portable utilise le profil et les fixtures isolés du projet. Le premier lancement dans le bac à sable n'a produit aucun rapport (sortie 1) ; la relance autorisée hors bac à sable a réussi.

Limites : recette physique clavier/IME et vérification visuelle du lot 5 non effectuées ; macOS/Linux non testés. Aucun nouvel essai GCC n'est revendiqué pour ce lot et aucune compilation C automatique n'a été ajoutée. Aucun autre lot n'est engagé.

## Lancement de la direction 1 et préparation du lot 6 — 23 octobre 2026

| ID | Décision | Statut |
|---|---|---|
| D-059 | Première direction officielle : Algorithmique et développement logiciel en C17 ; objectif de conception, développement, compilation, tests, débogage et maintenance d'un logiciel modulaire et fiable | Adoptée par le porteur |
| D-060 | Compétences de programmation et paliers de liberté sont indépendants ; tous les paliers donnent accès aux mêmes résultats dans les capacités prises en charge ; les mentions historiques « niveaux » désignent les paliers de liberté | Adoptée ; aucun palier futur implémenté |
| D-061 | Référentiel initial en neuf domaines, évolutif et sans calendrier rigide ; fiabilité et validation enseignées progressivement | Adoptée |
| D-062 | Préparer le contrat du lot 6 : calculs entiers, expressions, priorités, parenthèses, division/reste et calculatrice ; préserver catalogue, placement et extension | Préparation autorisée ; implémentation non autorisée |

Le document fondateur effectivement présent est [A_DOCUMENTATION_FONDATRICE.md](../../A_DOCUMENTATION_FONDATRICE.md). Il couvre raison d'être, philosophie, fonctionnement, utilisation et évolution. Il est ajouté à l'index Git sans copie ni réécriture de ses principes. Le contrat proposé est [LOT6_CONTRAT_PROPOSE.md](../../LOT6_CONTRAT_PROPOSE.md) ; ses formulations, codes de diagnostic, limites et architecture ne sont pas des décisions adoptées ni des fonctionnalités disponibles.

### Revue de cohérence : points signalés, sans résolution silencieuse

- **Palier 3 :** le document fondateur (§3 et §12) renvoie à une définition antérieure à retrouver. Aucune définition détaillée n'a été identifiée dans les décisions présentes ; D-058 et VISION.md indiquent qu'il reste à définir séparément. La référence n'est pas remplacée ni interprétée comme une autorisation d'inventer ses règles. Clarification attendue du porteur.
- **Recette manuelle :** le document fondateur (§8) rapporte des tests manuels des lots 4 et 5 et une exécution GCC. Le bilan technique du lot 5 consigne les vérifications non effectuées lors de sa livraison. Il peut s'agir d'une validation postérieure, mais les cas précis et le périmètre clavier/IME/visuel ne sont pas établis par les pièces présentes. Les deux rapports sont conservés et aucune recette complète du lot 5 n'est revendiquée ici.
- **Calendrier :** les numéros futurs du document fondateur (§9) sont explicitement indicatifs. Le lancement officiel retient le référentiel en neuf domaines demandé par le porteur ; les regroupements du tableau fondateur ne fixent pas le découpage des lots.
- **Compatibilité :** la formulation historique d'affichage à format %d reste l'exception de compatibilité déjà explicitée dans le document fondateur et au lot 5 ; elle n'autorise aucun nouveau choix implicite au palier 1.

Les principes généraux sont cohérents : source C de référence, français original conservé, refus sans insertion partielle, aperçu et confirmation, compilation séparée, aucune correction silencieuse. Les écarts ci-dessus ont été signalés avant toute éventuelle résolution. Le document fondateur reste intact.

Suivi Git : les suppressions des anciens chemins langage-assiste-c/docs et les autres fichiers non suivis étaient déjà présents avant cette préparation ; ils ne sont ni indexés ni réorganisés par cette intervention. Seul le document fondateur est ajouté à l'index. Aucun commit ni publication.

## Lot 6 — contrat approuvé et implémentation — 23 octobre 2026

| ID | Décision | Statut |
|---|---|---|
| D-063 | Implémentation du lot 6 autorisée après D-062 : Affecte à {nom} le résultat de "{expression}" ; guillemets ASCII délimitant des opérateurs du C, aucune chaîne C générée | Adoptée et implémentée |
| D-064 | Analyse syntaxique seule, sans évaluation ni vérification d'existence/type des variables ; traduction réussie sans garantie de compilation ou d'exécution valide | Adoptée et vérifiée |
| D-065 | ASSIGN_EXPRESSION et AST avec plages UTF-16 ; chaque opération parenthésée ; négation unaire, notamment -a, -(a + b), a * -b | Adoptée et vérifiée |
| D-066 | 1 024 tokens d'expression (espaces exclus), 64 niveaux cumulés de parenthèses/négations ; diagnostic déterministe sur le premier token au-delà de la limite | Adoptée et vérifiée |
| D-067 | Catalogue et diagnostics historiques, placement et parcours VS Code préservés ; aucun en-tête, variable, conversion ou compilation automatique ajouté | Adoptée et vérifiée |
| D-068 | Palier 3 sans règles inventées ; distinguer les trois scénarios manuels confirmés du lot 5 des vérifications encore ouvertes | Adoptée ; scénarios précisés par le porteur et consignés dans le document fondateur §8 |

Le contrat reste à [son chemin historique](../../LOT6_CONTRAT_PROPOSE.md), avec statut approuvé et livré. Le document fondateur est mis à jour pour refléter le lot 6 et les clarifications ci-dessus, sans changer ses principes. Le [protocole de recette manuelle](../../RECETTE_LOT6.md) décrit lancement, calculatrice, négations, refus sans insertion, confirmation, curseur, LF/CRLF, clavier/IME et compilation GCC manuelle.

Les 799 tests Node du lot 5 sont conservés. Une nouvelle fixture de 55 cas du lot 5, capturés avant modification, complète les 182 cas de la fixture du lot 4 sans les dupliquer. Les nouvelles suites couvrent AST, génération exacte, priorité et associativité, negations, caractères Unicode invalides, diagnostics et intervalles, limites à 63/64/65 niveaux et 1 023/1 024/1 025 tokens, placement, contrôle canonique et péremption des aperçus. Les calculs syntaxiquement valides comportant /0 ou %0 sont testés comme traductions, jamais exécutés.

**Bilan automatisé final : 1 186 tests Node réussis, 0 échoué, 0 ignoré ; contrôle TypeScript sans diagnostic ; 36 tests hôte VS Code Windows 1.96.4 réussis, 0 échoué**, soit **1 222 tests réussis**. Les 28 tests hôte historiques sont conservés ; les huit ajouts couvrent sept refus et les calculs/négations avec aperçu, confirmation, curseur et annulation/rétablissement. Exécution portable autorisée avec profil et fixtures isolés. Aucun ajout de dépendance. Un contrôle complémentaire de 1 728 expressions courtes n'a provoqué aucune exception ni plage hors source ; il ne remplace pas les suites.

**Recette manuelle et limites :** le porteur a précisé les trois scénarios du lot 5 confirmés directement dans VS Code : `Affiche age.` → « Il manque le format d’affichage. » ; `Affiche age en hexadécimal.` → insertion de `printf("%x", age);` avec le commentaire français original ; `Affiche age en binaire.` → « Ce format d’affichage n’est pas pris en charge. » Le tableau de référence figure dans le document fondateur §8. Cette précision clôt la demande d'énumération formulée lors de la livraison, sans étendre la confirmation aux autres scénarios du lot 5, qui n'ont pas tous été vérifiés manuellement. Restent ouverts, sauf attestation séparée, clavier physique, IME, focus/diff, macOS et Linux. Aucune nouvelle recette manuelle du lot 6 n'est revendiquée. GCC n'est pas accessible dans le terminal de la session de livraison : aucun nouvel essai de compilation/exécution C17 n'est revendiqué. Les bornes concernent les tokens et la profondeur syntaxique, pas le nombre de chiffres d'un littéral. La validité sémantique des opérations et du programme relève toujours de l'apprenant et de ses outils C17.

Aucun lot 7 ni comportement de palier futur n'est engagé. Les anciens chemins supprimés et autres changements préexistants restent hors intervention ; aucune réorganisation Git, commit ou publication.

## Étape 2 — préparation du contrat du lot 7

| ID | Décision | Statut |
|---|---|---|
| D-069 | Le porteur confirme manuellement trois acquis du lot 6 : addition entre variables, priorité des opérations, parenthèses explicites | Confirmée ; recette partielle, sans extension aux autres cas |
| D-070 | Préparer le lot 7 — Types numériques et conversions : contrat pédagogique et technique avant développement | Préparation autorisée ; implémentation non autorisée |
| D-071 | Regrouper la recette complète du lot 6 avec celle du domaine Expressions et calculs à la fin du lot 8 | Adoptée ; contenu du lot 8 à définir séparément |

Le [contrat proposé du lot 7](../../LOT7_CONTRAT_PROPOSE.md) présente les compétences, formulations, C17, limites, diagnostics, exercices et tests envisagés. Les quatre types, nouvelles branches, profils d'expression, formats et bornes qui y figurent sont des propositions soumises à validation, pas des fonctionnalités disponibles ni des décisions fondamentales modifiées.

Le référentiel du document fondateur replace les lots 6 à 8 dans le domaine Expressions et calculs. Les anciennes affectations de numéros aux domaines suivants étaient indicatives ; elles sont remplacées par « à définir » pour ne pas inventer un décalage de calendrier. Les neuf domaines et l'indépendance compétences/paliers sont conservés. Les confirmations manuelles du lot 5 restent distinctes de celles du lot 6.

Cette intervention ne modifie que la documentation. Aucun fichier source, test applicatif, dépendance, configuration, tâche VS Code ou installation personnelle n'est modifié. Aucun test du lot 7 ni nouvelle recette C17 n'est revendiqué ; les anciens bilans restent des bilans de livraison. Aucun développement du lot 7 ou définition du palier 3 n'est engagé.

## Lot 7 — approbation et livraison — 23 octobre 2026

| ID | Décision | Statut |
|---|---|---|
| D-072 | Contrat du lot 7 approuvé : int, unsigned int, float, double ; déclarations/initialisations explicites, littéraux, expressions et casts | Adoptée et implémentée |
| D-073 | Branche distincte « Affecte à {nom} le résultat numérique de ... » ; grammaire, AST, sorties et diagnostics historiques conservés dans les lots 1 à 6 | Adoptée et vérifiée |
| D-074 | Aucun type, suffixe, cast ou format choisi par C-A ; conversions implicites normales de C17 conservées ; analyse syntaxique sans garantie d'exécution valide | Adoptée et vérifiée |
| D-075 | Formats %u, %f et %e ; précision flottante obligatoire 0..20 ; bornes de 1 024 tokens et 64 niveaux, casts compris selon le contrat | Adoptée et vérifiée |
| D-076 | Laboratoire avec inclusions manuelles et explicites de limits.h/float.h ; pas d'élargissement de la commande Inclue ou d'inclusion automatique | Adoptée et documentée |
| D-077 | Recette complète du domaine après le lot 8 ; aucun démarrage du lot 8 avant examen du bilan et contrat distinct | Adoptée ; aucune recette complète revendiquée |

Le [contrat approuvé et livré](../../LOT7_CONTRAT_PROPOSE.md) conserve son chemin historique. L'AST numérique et ses enveloppes sont isolés dans src/numericExpression.ts et src/numericInstructions.ts. src/translate.ts intègre les quatre intentions NUMERIC_DECL/INIT/ASSIGN/PRINT sans refondre les branches historiques. Le parseur entier, les fichiers de placement, les trois fichiers de production de l'extension et .vscode/tasks.json ont des empreintes identiques à celles relevées avant le développement.

Les messages propres aux manques de type, précision, exposant ou parenthèse de cast sont sans liste de réponses. Dans le profil numérique, INVALID_EXPRESSION_TOKEN précise « expression numérique » ; le message entier historique reste inchangé. Une précision absente avant son unité est signalée comme manquante, sans valeur choisie. Le commentaire original est conservé exactement. Les casts, opérateurs et précisions demandés sont reproduits sans simplification ni évaluation. Une conversion flottant vers entier hors plage peut provoquer un comportement indéfini ; la précision d'affichage ne garantit pas celle du stockage.

**Bilan final : 1 530 tests Node réussis, 0 échoué, 0 ignoré ; TypeScript sans diagnostic ; 45 tests hôte VS Code Windows 1.96.4 réussis, 0 échoué ; total 1 575 réussis.** Les 1 186 tests Node et 36 tests hôte historiques sont conservés ; 57 résultats de compatibilité complémentaires ont été capturés avant modification. Aucun ajout de dépendance. Les neuf tests hôte ajoutés couvrent huit refus sans édition et le parcours des quatre familles avec divisions, casts, suffixes et formats ; aperçu, confirmation, curseur, non-sauvegarde et annulation/rétablissement sont vérifiés.

**Limites et points ouverts :** analyse purement syntaxique, sans contrôle de symboles, de type réel, de plage ou de précision de calcul. Aucun nouvel essai GCC : l'outil n'est pas accessible dans le terminal de cette session. La recette manuelle complète reste prévue après le lot 8, et les confirmations partielles précédentes gardent leur périmètre. L'hôte portable émet « Error mutex already exists » et un avertissement DEP0168/N-API au lancement/arrêt ; les tests produisent néanmoins un rapport 45 réussis/0 échoué et une sortie 0. La pile de l'erreur mutex désigne le main.js de l'hôte VS Code ; son origine précise reste à qualifier, sans l'attribuer à C-A ni l'assimiler à un échec de scénario. macOS/Linux et la recette physique clavier/IME restent non validés par ces tests.

Aucun palier futur ni règle du palier 3 n'est implémenté. Aucun lot 8 n'est commencé, aucune réorganisation du dépôt, aucun commit ni publication.
