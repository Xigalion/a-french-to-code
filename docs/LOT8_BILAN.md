# Lot 8 — Bilan de livraison, 3 novembre 2026

**Suivi au 5 novembre 2026 :** le porteur confirme manuellement les deux familles d’avertissements pédagogiques du lot 8. La recette GCC complète Expressions et calculs reste ouverte ; aucun résultat C17 supplémentaire n’est inventé. Après la préparation, le [lot 9](LOT9_CONTRAT_PROPOSE.md) a reçu son autorisation distincte et est implémenté, sans clôture de cette recette. Les mentions d’absence de domaine suivant dans les bilans historiques restent datées de leur livraison.

Le [contrat approuvé](LOT8_CONTRAT_PROPOSE.md) est implémenté. Aucune nouvelle instruction, aucun domaine suivant ni palier futur n'est engagé. La validation manuelle complète du domaine reste ouverte selon le [protocole final des lots 6 à 8](RECETTE_EXPRESSIONS_CALCULS.md).

## Comportement livré

`analyzeCalculations` examine l'AST accepté dans un canal séparé. Le résultat de `translate`, ses fragments, commentaires et diagnostics restent inchangés. Les deux motifs sont le diviseur littéralement nul et l'opérande directement flottant de `%`. Parenthèses/négations sont transparentes pour identifier ces littéraux ; les casts ne le sont pas. Le parcours visite néanmoins les opérations à l'intérieur des casts.

| Exemple d'expression | Code de l'avis | Classification |
|---|---|---|
| `7 / 0`, `7u % 0u` | `INTEGER_ZERO_DIVISOR` | `certain-error` : comportement indéfini si l'opération entière est évaluée |
| `1.0 / 0.0`, `a / 0.0` | `ZERO_DIVISOR` | `possible-risk` : profil flottant C17/annexe F à connaître |
| `a / 0` | `ZERO_DIVISOR` | `undetermined` : nullité connue, types réels inconnus |
| `7 % 0.0`, `5.0 % 2` | `FLOAT_REMAINDER_OPERAND` | `certain-error` : violation des contraintes C17, distincte de la division entière par zéro |
| `7 / (1 - 1)`, `7 / (int)0`, `a / b`, `INT_MAX + 1` | Aucun | Exclusions volontaires, pas une preuve de sûreté |

Pour un même `%`, l'avis de contrainte flottante est prioritaire sur celui de zéro. Les avis indépendants restent tous présents, triés par début/fin/code. Messages et plages UTF-16 semi-ouvertes sont ceux du contrat. Aucune évaluation de littéraux en nombres JavaScript : `0e-999` est identifié comme zéro, `1e-999` ne l'est pas. Aucune hypothèse de taille ou de représentation des types.

Les avertissements sont non bloquants, même pour une erreur certaine : l'utilisateur reste responsable du programme et C-A ne l'exécute pas. Le champ affiche une validation Warning, donc Entrée prépare toujours le diff. La confirmation conserve Insérer/Modifier la phrase/Annuler ; son titre indique le nombre d'avis, le détail d'Insérer montre le premier. Le canal **C-A — Pédagogie** conserve tous les textes, classifications et intervalles par session/jeton, une seule entrée par aperçu avec avis, sans ouverture automatique ni notification. Une nouvelle demande d'aperçu peut légitimement créer une nouvelle entrée historique.

Les avis actifs sont liés au texte et au cycle du jeton : modification, péremption et annulation invalident l'aperçu ; aucun avis ne restaure un ancien plan. Le canal conserve un historique explicitement étiqueté, pas un état actif. Aucun texte pédagogique n'est ajouté au C ou au diff, aucun cast/protection/correction n'est généré. Une expression incomplète reste bloquée sans fragment.

## Vérifications finales

| Contrôle | Résultat |
|---|---|
| `npm.cmd run check` : TypeScript moteur et extension | Réussi, aucun diagnostic |
| Tests Node | **1 659 réussis, 0 échoué, 0 ignoré** |
| `npm.cmd run test:vscode` : VS Code portable Windows 1.96.4, profil isolé | **53 réussis, 0 échoué**, sortie 0 |
| Total final | **1 712 tests réussis, 0 échoué** |

Les 1 530 tests Node et 45 tests hôte historiques restent présents. Ajouts : 129 tests Node et huit tests hôte. Ils couvrent les deux familles, les classifications, les messages/plages, la priorité de `%`, le déterminisme, les refus sans insertion, les exclusions, les littéraux longs, les bornes de tokens/profondeur, l'intégrité du placement, LF/CRLF, le cycle des avis et les interactions natives avec confirmation, insertion et annuler/rétablir. Les insertions de sources problématiques en test hôte ne sont jamais compilées ou exécutées comme programmes C.

Les empreintes du parseur entier, de `planPlacement.ts`, `placementLexical.ts`, du stockage d'aperçu et de `.vscode/tasks.json` sont identiques à la référence conservée avant le lot 7. Les deux parseurs, les enveloppes numériques et `translate.ts` n'ont pas été modifiés dans ce lot. Le contrôle canonique n'accepte aucun enrichissement du résultat de traduction.

Traces finales locales : `.cache/lot8-check.log`, `.cache/lot8-vscode.log`, `.cache/vscode-test/results.json`. Aucun ajout de dépendance, ni changement du fichier de verrouillage. Les commandes existantes ont été utilisées ; aucun mécanisme GCC ajouté.

## Limites et environnement

La couverture locale est volontairement étroite. Aucun suivi de variables/macros, propagation de types, pliage de constantes, vérification de plage, détection générale de dépassements, vérification variable/format ou preuve de précision. Une traduction réussie et l'absence d'avis ne garantissent ni compilation ni exécution correcte. Les bornes existantes restent **1 024 tokens et 64 niveaux**, casts compris selon le lot 7 ; elles ne bornent pas le nombre de caractères d'un littéral. Le parcours lexical est linéaire dans la taille parcourue, avec tri des k avis en O(k log k).

GCC n'est pas accessible dans le PATH de cette session : **aucune compilation ou exécution C17 nouvelle revendiquée**. La recette physique clavier/IME, le contrôle visuel du focus/diff et macOS/Linux restent ouverts. Les trois acquis manuels du lot 6 et les trois scénarios manuels du lot 5 gardent strictement leur périmètre ; aucun nouveau scénario manuel du domaine n'est déclaré validé.

Un premier lancement de l'hôte dans le bac à sable a quitté avec code 1 avant tout rapport et sans nouveau journal exploitable. La suite a ensuite été exécutée hors de ce bac à sable, dans l'hôte portable du dépôt et son profil isolé. La version finale rapporte 53/0 et sortie 0. Aucun changement de l'installation personnelle ou arrêt d'une instance utilisateur n'a été effectué.

Les messages **« Error mutex already exists »** et **DEP0168 / « Uncaught N-API callback exception »**, déjà observés au lot 7, ont réapparu au lancement/arrêt de l'hôte portable. Leur origine reste non qualifiée ; ils ne sont déclarés ni résolus ni définitivement bloquants. Leur présence est séparée du rapport fonctionnel réussi. Les traces, versions et effets devront être consignés lors de la recette ; un échec de démarrage éventuel reste un incident concret de session à qualifier.

## Fichiers modifiés ou créés par ce lot

- `src/calculationAdvisories.ts` : nouveau module pur d'avis locaux et types structurés.
- `extension/src/session.ts` : rapport séparé et cycle de vie des avis, copie des plages exposées.
- `extension/src/extension.ts` : Warning natif, résumé avant confirmation, canal passif et observabilité en lecture seule.
- `test/calculationAdvisories.test.mjs` : nouvelle suite moteur/placement/exclusions/limites.
- `test/session.test.mjs` : avis non bloquants, péremption, copie et LF/CRLF.
- `test/vscode/suite.cjs` : huit scénarios hôte supplémentaires, sans exécution C.
- `package.json` : inclusion de la nouvelle suite Node, sans dépendance supplémentaire.
- `docs/LOT8_CONTRAT_PROPOSE.md` : statut approuvé/implémenté, propositions historiques conservées.
- `docs/RECETTE_EXPRESSIONS_CALCULS.md` : protocole final, accès au canal, synthèse et séparation des cas dangereux.
- `docs/LOT8_BILAN.md` : présent bilan.
- `docs/A_DOCUMENTATION_FONDATRICE.md`, `docs/A-phase1/docs/VISION.md`, `docs/A-phase1/docs/SPECIFICATIONS.md`, `docs/A-phase1/docs/DECISIONS.md` : capacités livrées, preuves, limites et décisions approuvées.

Les changements Git préexistants ne sont ni indexés, ni réorganisés, ni supprimés. Aucun commit ou publication.
