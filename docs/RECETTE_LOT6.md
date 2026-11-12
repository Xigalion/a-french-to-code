# C-A — Recette manuelle du lot 6 dans VS Code

Statut : **recette partielle**, distincte des tests automatiques. Le porteur confirme manuellement l'addition entre variables, la priorité des opérations et les parenthèses explicites. Les saisies exactes et valeurs de ces confirmations n'étant pas détaillées, aucun résultat supplémentaire n'est inventé. La recette complète sera regroupée avec celle du domaine Expressions et calculs à la fin du lot 8 ; les autres étapes ci-dessous restent à vérifier.

## Préparer et lancer

Ouvrir le dépôt dans VS Code avec les dépendances installées. Exécuter `npm.cmd run check`, puis F5 avec « C-A : lancer le prototype ». La tâche existante compile seulement l'extension. Le profil personnel, les tâches et l'installation VS Code ne sont pas modifiés par le lot 6.

Dans la fenêtre de développement, créer et enregistrer `calculatrice_lot6.c` vide. Le langage doit être C et le fichier éditable. Lancer C-A avec Ctrl+K puis A (Cmd+K puis A sur macOS). Après chaque instruction : vérifier le commentaire et le C dans le diff ; vérifier que le fichier cible reste inchangé avant confirmation ; choisir Insérer. Le curseur doit rester prêt pour l'instruction suivante sur une ligne blanche. Une instruction par ouverture de la commande.

## Construire la calculatrice

Saisir successivement :

```text
Inclue la bibliothèque stdio.h.
Crée la fonction principale.
Crée un entier nommé a de valeur 17.
Crée un entier nommé b de valeur 5.
Déclare un entier nommé resultat.
```

L'inclusion reste au curseur ; après main, les variables et calculs sont insérés dans sa ligne intérieure. Aucun en-tête ni déclaration n'est ajouté automatiquement.

Pour chaque ligne du tableau, saisir séparément les trois instructions suivantes, en remplaçant seulement {expression} :

```text
Affecte à resultat le résultat de "{expression}".
Affiche resultat en décimal.
Affiche le texte "\n".
```

L'expression utilise les opérateurs du C. Ses guillemets ne deviennent pas une chaîne C. Le \n est demandé explicitement par la troisième instruction.

| Expression | Affectation attendue | Valeur attendue |
|---|---|---:|
| a + b | `resultat = (a + b);` | 22 |
| a - b | `resultat = (a - b);` | 12 |
| a * b | `resultat = (a * b);` | 85 |
| a / b | `resultat = (a / b);` | 3 |
| a % b | `resultat = (a % b);` | 2 |
| a + b * 3 | `resultat = (a + (b * 3));` | 32 |
| (a + b) * 3 | `resultat = ((a + b) * 3);` | 66 |
| -a | `resultat = (-a);` | -17 |
| -(a + b) | `resultat = (-(a + b));` | -22 |
| a * -b | `resultat = (a * (-b));` | -85 |

## Vérifier les refus et le contrôle utilisateur

Depuis une ligne blanche, noter le texte et la position du curseur, puis essayer :

| Saisie | Diagnostic attendu |
|---|---|
| Affecte à resultat le résultat de "a +". | Il manque un opérande. |
| Affecte à resultat le résultat de "". | Il manque l’expression à calculer. |
| Affecte à resultat le résultat de "(a + b". | Il manque une parenthèse fermante. |
| Affecte à resultat le résultat de "a b". | Il manque un opérateur. |
| Affecte à resultat le résultat de "a == b". | Cet opérateur n’est pas pris en charge. |
| Affecte à resultat le résultat de "a + 😀". | Élément hors expression entière prise en charge, plage de deux unités UTF-16 |

Entrée ne doit pas ouvrir un aperçu applicable ni insérer de code. Aucun choix de réponse ne doit être proposé. Corriger ensuite la phrase avec `a + b` : un nouvel aperçu et une confirmation restent nécessaires. Annuler un aperçu doit conserver le fichier. Après insertion, Annuler/Rétablir doit retirer/restaurer cette seule édition. Déplacer le curseur ou modifier le document après aperçu doit rendre le plan périmé.

Rejouer au besoin dans un fichier LF puis CRLF et avec une indentation différente : source, aperçu, code appliqué et curseur doivent rester cohérents. Vérifier physiquement le raccourci, le focus, les accents saisis avec le clavier et l'IME, séparément des tests automatisés.

## Compiler et observer, manuellement

Enregistrer explicitement le fichier, puis dans son répertoire avec GCC installé et accessible :

```powershell
gcc -std=c17 -Wall -Wextra calculatrice_lot6.c -o calculatrice_lot6.exe
.\calculatrice_lot6.exe
```

Attendu : dix lignes, dans l'ordre 22, 12, 85, 3, 2, 32, 66, -17, -22, -85. Comparer à des prédictions écrites avant exécution. Refaire les divisions avec a=-7 et b=3 : quotient -2 et reste -1. Garder des opérations définies et des valeurs représentables.

C-A ne lance pas ces commandes. Une traduction réussie ne garantit pas une exécution valide : variables absentes/non initialisées, types incompatibles, diviseur nul et dépassements ne sont pas vérifiés. `10 / 0` reste syntaxiquement traduisible ; ne pas l'exécuter comme test de résultat.

## Bornes et compte rendu

Les limites sont 1 024 tokens (espaces exclus) et 64 niveaux cumulés de parenthèses/négations. Les tests automatiques vérifient les seuils exacts et leurs plages UTF-16 ; ce ne sont pas des limites de caractères ou de taille d'un littéral.

Consigner version VS Code, système, version GCC, saisies, sorties, diagnostics, LF/CRLF, raccourci/IME/focus et annulation. Distinguer scénarios réussis, échecs et vérifications non effectuées. La recette n'est complète qu'après observation, pas à la lecture du protocole. Le lot 7 est approuvé et implémenté ; la recette complète du domaine sera effectuée après le lot 8. Aucun lot 8 n'est commencé.
