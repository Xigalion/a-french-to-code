# Décisions de conception

| ID | Décision | Statut |
|---|---|---|
| D-001 | C17 comme premier langage cible | Adoptée |
| D-002 | Français contrôlé, phrases grammaticales | Adoptée |
| D-003 | Code C comme source de vérité | Adoptée |
| D-004 | Instruction validée conservée en commentaire adjacent | Adoptée |
| D-005 | Prévisualisation avant insertion | Adoptée |
| D-006 | Entrée insère ; compilation/exécution séparées par défaut | Proposition à confirmer |
| D-007 | GCC pour compilation et diagnostics | Adoptée |
| D-008 | Aucune correction automatique de logique | Adoptée |
| D-009 | Fonctionnement local et hors ligne | Adoptée |
| D-010 | VS Code comme interface cible | Adoptée |
| D-011 | Niveaux de liberté futurs, noms provisoires | Adoptée |

## Questions ouvertes
- Grammaire exacte de chaque instruction, y compris accents et ponctuation.
- Comportement de « crée 6 » : expression littérale isolée ou instruction non insérable en C selon le contexte.
- Politique d'insertion lorsque la traduction est partielle.
- Gestion des includes et du squelette main : explicite ou gabarit pédagogique affiché.
- Correspondance entre fragments C, commentaires et erreurs GCC.
