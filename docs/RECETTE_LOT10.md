# Lot 10 — Protocole de recette manuelle

**Suivi au 7 novembre 2026 :** cette recette reste ouverte et doit être intégrée à la [matrice de recette finale du domaine 3](LOT11_CONTRAT_PROPOSE.md#9-projet-pédagogique-et-recette-finale-du-domaine-3). La préparation du découpage des boucles ne valide aucun scénario ci-dessous. La recette GCC complète Expressions et calculs et la qualification mutex/N-API restent également ouvertes.

**Statut au 6 novembre 2026 : protocole prêt, recette manuelle non effectuée.** Les tests automatisés ne valent pas validation pédagogique. La recette GCC complète Expressions et calculs et la qualification mutex/N-API restent ouvertes. Aucun lot 11 engagé.

## 1. Préparation

Ouvrir un fichier ordinaire `recette_lot10.c` vide dans VS Code bureau avec l'extension recompilée (`npm.cmd run build:extension`, puis hôte de développement F5). Noter OS, version VS Code, unité d'indentation, LF ou CRLF. Désactiver les actions de sauvegarde/formatage externes pour distinguer les changements de C-A. Ne pas employer une tâche GCC automatique pour cette recette d'interface.

Une commande par session : Ctrl+K puis A sous Windows, Cmd+K puis A sous macOS si testé. La première Entrée prépare le diff ; seule « Insérer » modifie le document. Les contrôles physiques clavier/IME et plateformes non testées doivent être consignés séparément.

## 2. Construction progressive sûre

Depuis le fichier vide, demander successivement :

```text
Inclue la bibliothèque stdio.h.
Crée la fonction principale.
Crée un entier nommé age de valeur 20.
Crée un entier nommé autorisation de valeur 0.
Crée un entier nommé suspendu de valeur 0.
Crée un bloc si "!suspendu && (age >= 18 || autorisation)".
Affiche le texte "Accès autorisé\n".
```

Après chaque instruction, vérifier commentaire exact, aperçu complet, absence de modification avant confirmation et curseur sur la ligne de saisie intérieure. Aucun en-tête, contenu ou return supplémentaire.

Pour ajouter une branche, déplacer explicitement le curseur sur la fermeture du if, créer une ligne blanche immédiatement après, **à la même indentation que le if racine et sa fermeture**. Cette ligne doit être avant la fermeture de main. Ne pas laisser le curseur dans le corps du if et ne rien sélectionner.

Demander :

```text
Ajoute une branche sinon si "suspendu".
Affiche le texte "Accès suspendu\n".
```

Avant la confirmation de la branche, vérifier dans « Insérer » la ligne et l'en-tête de la cible. Le commentaire est au-dessus du nouveau else if ; l'accolade du if précédent et ses instructions restent intactes. Le curseur arrive à l'intérieur de la nouvelle branche.

Créer ensuite explicitement une ligne blanche après la fermeture du else if, alignée sur la chaîne, puis demander :

```text
Ajoute une branche sinon.
Affiche le texte "Accès refusé\n".
```

Vérifier une chaîne unique if → else if → else. Aucun contenu n'est déplacé d'une branche à l'autre. Un nouvel ajout après else doit être refusé avec BRANCH_AFTER_ELSE. Annuler ce refus sans changement.

## 3. Prévisions et critères pédagogiques

Changer soi-même les valeurs initiales ; aucune boucle ni saisie interactive :

| age | autorisation | suspendu | Chemin et affichage attendus du programme sûr |
|---:|---:|---:|---|
| 20 | 0 | 0 | Première branche, `Accès autorisé` puis retour explicitement demandé |
| 16 | 1 | 0 | Première branche, même affichage |
| 16 | 0 | 0 | Else, `Accès refusé` puis retour |
| 20 | 1 | 1 | Else if, `Accès suspendu` puis retour |

Avant toute observation, expliquer la valeur de chaque test et les opérandes logiques qui ne seraient pas évalués. Distinguer les tests de la première condition et les conditions de branches alternatives. Donner un contre-exemple à l'assimilation de trois if indépendants à une chaîne exclusive.

En aperçu uniquement, vérifier `a || b && c`, `!a == b` et `!(a == b)` : les regroupements doivent correspondre au contrat, sans simplification ni condition inventée. Les noms peuvent être non déclarés : la traduction n'en garantit pas la compilation.

## 4. Rattachement et préservation

- Ajouter manuellement un if intérieur bracé dans le premier bloc. Sur une ligne blanche juste après sa fermeture, demander ELSE et vérifier que la cible affichée est l'intérieur. Annuler, puis recommencer après la fermeture extérieure : la racine doit être l'extérieur.
- Conserver une instruction manuelle après la chaîne : elle doit rester après la fermeture de la nouvelle branche, jamais être absorbée.
- Essayer une branche isolée dans un fichier vide, une ligne occupée, une ligne blanche éloignée, une indentation incompatible et une ligne avant un else existant : refus sans modification.
- Étudier `if (a) if (b) { ... }` dans un fichier séparé de démonstration : le contexte sans accolades reconnues doit être refusé, sans choix d'un if depuis l'indentation.
- Tester commentaires/chaînes contenant les mots if/else ou des accolades ; ils ne doivent pas créer de cible. Les directives non prises en charge, continuations et trigraphes restent des limites explicites.
- Refaire un cas avec tabulations et CRLF, puis avec une ligne blanche à EOF sans EOL terminal. Une fermeture à EOF sans ligne blanche cible doit être refusée.

## 5. Court-circuit et canal pédagogique passif

Ouvrir volontairement Affichage → Sortie → « C-A — Pédagogie ». Sur un aperçu contenant &&, || et !, vérifier SHORT_CIRCUIT_AND, SHORT_CIRCUIT_OR et LOGICAL_NOT, leurs plages UTF-16 et la mention d'absence de garantie de sûreté. Les informations ne sont pas des Warning ; sans motif de calcul, le compteur d'avertissements n'augmente pas. Le canal ne doit jamais s'ouvrir automatiquement ni voler le focus.

Dans une session séparée, préparer `Crée un bloc si "0 && 7 / 0 || 5.0 % 2".` ; vérifier que les deux motifs du lot 8 restent consultables avec les informations logiques. **Ne pas intégrer cet extrait au programme exécuté ; annuler après l'aperçu.** La non-évaluation d'une opération n'efface pas les contraintes de compilation de %. Aucune notification intrusive, correction ou preuve automatique de protection.

## 6. Annulation, péremption et diagnostics

Après une branche puis une instruction dans son corps : première annulation retire l'instruction seule ; deuxième annulation retire la branche et son commentaire sans modifier la chaîne précédente. Deux rétablissements restaurent exactement les deux états. Une confirmation répétée ne doit pas doubler une branche.

Après préparation d'une branche, modifier le document, le curseur ou les réglages d'indentation : l'aperçu devient périmé et « Insérer » disparaît. Fermer le document cible ou changer d'éditeur ne doit pas rediriger l'insertion. Annuler avec Échap ne change rien et respecte le retour au fichier.

Vérifier `a &&` (opérande manquant), `age = 18` (affectation refusée), `0 < age < 100` (comparaison chaînée), un nom contenant un caractère astral et les suffixes non reconnus. Les diagnostics de compréhension concernent la phrase ; ceux de placement concernent le document. Aucun fragment partiel applicable.

## 7. GCC manuel facultatif et fiche de résultat

Cette étape, si effectuée par le porteur, concerne uniquement le programme sûr du §2 ; elle n'est pas une intégration GCC à C-A ni une clôture de la recette Expressions et calculs. Après revue des types, formats et valeurs, on peut compiler manuellement :

```powershell
gcc -std=c17 -Wall -Wextra -Wpedantic -Wformat=2 recette_lot10.c -o recette_lot10.exe
.\recette_lot10.exe
```

Aucun résultat GCC n'est revendiqué par la livraison. Consigner pour chaque scénario : environnement, texte avant, instruction exacte, cible affichée, prévision, résultat observé, diagnostic, annulation et statut réussi/échoué/non effectué. Les avertissements mutex/N-API doivent rester consignés séparément de la réussite des scénarios ; ne pas les déclarer résolus à partir d'un rapport sans échec.
