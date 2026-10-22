# Spécification de départ — Phase 1

## Chaîne fonctionnelle
1. Saisie d'une phrase en français contrôlé.
2. Analyse lexicale et syntaxique, avec plage précise des mots non reconnus.
3. Construction d'une opération typée, sans déduction non autorisée.
4. Génération d'un fragment C17 et d'un commentaire reprenant la phrase.
5. Aperçu dans l'éditeur ; validation par Entrée ; insertion au point choisi.
6. Compilation facultative par GCC, avec message original et explication en français.

## Catalogue initial candidat (à faire valider)
| Identifiant | Phrase | C produit | Condition |
|---|---|---|---|
| VAR_DECL | Déclare un entier nommé age. | `int age;` | identifiant libre |
| VAR_INIT | Crée un entier nommé age de valeur 20. | `int age = 20;` | identifiant libre |
| ASSIGN | Affecte la valeur 25 à age. | `age = 25;` | `age` déclaré et compatible |
| ADD_EXPR | Additionne age et 5. | `age + 5;` | opérandes compatibles ; résultat ignoré |
| PRINT_INT | Affiche la valeur de age. | `printf("%d\\n", age);` | `age` entier ; `stdio.h` disponible |

## Erreurs
- **Traduction** : mot ou structure inconnue, ambiguïté, paramètre absent. Ne pas insérer silencieusement du code supposé.
- **Compilation** : conserver le diagnostic GCC exact, puis proposer une reformulation pédagogique ; ne pas corriger.
- **Exécution** : ne pas promettre de diagnostic automatique pour tout comportement indéfini en C.

## Invariants
- Le texte source français ne remplace jamais le code C comme fichier exécutable.
- La phrase source reste attachée au bloc généré.
- Toute transformation de type, allocation, variable ou bibliothèque implicite doit être documentée et approuvée dans le contrat du niveau strict.
- Un programme ne doit pas être lancé automatiquement sur une instruction non validée.

## Critères d'acceptation Phase 1
- Catalogue et formulations approuvés.
- Cas valides, incomplets et ambigus documentés.
- Règles de diagnostic, d'insertion et de dépendances C explicitées.
- Architecture revue par Codex avant développement.
