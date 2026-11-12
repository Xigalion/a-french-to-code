# Catalogue C-A — état au 12 novembre 2026

**Toutes les formulations reconnues, avec leur sortie C exacte.** Ce
document est **généré depuis le moteur puis relu** : chaque ligne a été
produite par `translate()`, pas écrite de mémoire.

Il sert de référence pour concevoir une épreuve : tout ce qui n'y figure
pas est refusé.

Conventions de lecture :

- `⏎` marque une fin de ligne dans le fragment produit ; les blocs ont
  trois lignes et un corps vide.
- La colonne « Information » donne les motifs pédagogiques **passifs**
  envoyés dans « C-A — Pédagogie ». Aucun n'est un avertissement.
- Le point final est **facultatif**, attaché au dernier mot ou guillemet.
- Les mots fixes sont **insensibles à la casse**, mais **les accents sont
  exigés**. Les deux apostrophes `’` et `'` sont équivalentes.
- Une instruction tient sur **une seule ligne**.
- Le commentaire inséré au-dessus du code contient **exactement** la phrase
  saisie, sans normalisation.

---

## Domaine 1 — Fondations et premiers programmes

| Phrase française | Code C produit | Information |
|---|---|---|
| `Inclue la bibliothèque stdio.h.` | `#include <stdio.h>` | — |
| `Crée la fonction principale.` | `int main(void) { ⏎ ⏎ }` | — |
| `Déclare un entier nommé age.` | `int age;` | — |
| `Crée un entier nommé age de valeur 20.` | `int age = 20;` | — |
| `Affecte la valeur 25 à age.` | `age = 25;` | — |
| `Affiche la valeur de age.` | `printf("%d", age);` | — |
| `Affiche age en décimal.` | `printf("%d", age);` | — |
| `Affiche age en hexadécimal.` | `printf("%x", age);` | — |
| `Affiche age en octal.` | `printf("%o", age);` | — |
| `Affiche le texte "Bonjour\n".` | `printf("%s", "Bonjour\n");` | — |

Échappements acceptés dans un texte : `\"`, `\\`, `\n`, `\t`. Seul
`stdio.h`, écrit exactement ainsi, est pris en charge.

## Domaine 2 — Expressions et calculs

| Phrase française | Code C produit | Information |
|---|---|---|
| `Affecte à resultat le résultat de "2 + 3 * 4".` | `resultat = (2 + (3 * 4));` | — |
| `Déclare une variable de type double nommée x.` | `double x;` | — |
| `Crée une variable de type double nommée x avec le résultat de "1.5".` | `double x = 1.5;` | — |
| `Affecte à x le résultat numérique de "(double) 7 / 2".` | `x = (((double) 7) / 2);` | — |
| `Affiche x en notation fixe avec 2 décimales.` | `printf("%.2f", x);` | — |
| `Affiche x en notation scientifique avec 3 décimales.` | `printf("%.3e", x);` | — |
| `Affiche n en décimal non signé.` | `printf("%u", n);` | — |

Opérateurs : `+`, `-`, `*`, `/`, `%`, parenthèses, moins unaire.
Types : `int`, `unsigned int`, `float`, `double`. Conversions explicites
par cast. Précision d'affichage de 0 à 20 décimales.

**« le résultat de »** utilise le profil **entier** du lot 6 ;
**« le résultat numérique de »** le profil **numérique** du lot 7, seul à
accepter les flottants et les casts. Cette distinction s'applique partout.

### Avertissements de calcul, non bloquants

Deux motifs seulement, cherchés dans **toutes** les expressions de toutes
les intentions, y compris à droite d'un court-circuit :

| Code | Déclencheur |
|---|---|
| `INTEGER_ZERO_DIVISOR` | diviseur entier littéralement nul |
| `ZERO_DIVISOR` | diviseur nul dont les types ne sont pas établis |
| `FLOAT_REMAINDER_OPERAND` | opérande flottant littéral avec `%` |

## Domaine 3 — Décisions et répétitions

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée un bloc si "age >= 18 && !suspendu".` | `if (((age >= 18) && (!suspendu))) { ⏎ ⏎ }` | `SHORT_CIRCUIT_AND`, `LOGICAL_NOT` |
| `Ajoute une branche sinon si "age >= 12".` | `else if (age >= 12) { ⏎ ⏎ }` | — |
| `Ajoute une branche sinon.` | `else { ⏎ ⏎ }` | — |
| `Crée une boucle tant que "i < limite".` | `while (i < limite) { ⏎ ⏎ }` | `WHILE_PRETEST` |
| `Crée une boucle avec test final tant que "i < limite".` | `do { ⏎ ⏎ } while (i < limite);` | `DO_WHILE_POSTTEST` |
| `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | `for (i = 0; i < 3; i = (i + 1)) { ⏎ ⏎ }` | `FOR_CLAUSE_ORDER` |
| `Sors de la boucle la plus intérieure.` | `break;` | — |
| `Passe à l’itération suivante de la boucle la plus intérieure.` | `continue;` | — |

Comparateurs : `==`, `!=`, `<`, `>`, `<=`, `>=`, non chaînables.
Logique : `!`, `&&`, `||`, avec leur précédence et leur court-circuit.
Un test numérique direct est accepté : `if (actif)` n'est **pas** réécrit
en `actif != 0`.

### Ce qui est vérifié dans le document

| Intention | Vérification au placement |
|---|---|
| `sinon` / `sinon si` | se rattache à une chaîne `if` bracée qui se termine juste avant la ligne ; refus si isolée, ambiguë, après un `sinon` final, ou avant une branche existante |
| `break` | la structure englobante la plus proche doit être une **boucle** ; un `switch` écrit à la main la refuse |
| `continue` | une boucle englobante doit exister ; un `switch` intermédiaire est traversé |

## Domaine 4 — Fonctions et décomposition

| Phrase française | Code C produit | Information |
|---|---|---|
| `Crée une fonction nommée affiche qui ne retourne rien.` | `void affiche(void) { ⏎ ⏎ }` | `FUNCTION_SCOPE` |
| `Crée une fonction nommée taille qui retourne un unsigned int.` | `unsigned int taille(void) { ⏎ ⏎ }` | `FUNCTION_SCOPE` |
| `Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.` | `int somme(int a, int b) { ⏎ ⏎ }` | `FUNCTION_SCOPE`, `PARAMETERS_BY_VALUE` |
| `Retourne.` | `return;` | `RETURN_ENDS_FUNCTION` |
| `Retourne la valeur 0.` | `return 0;` | `RETURN_ENDS_FUNCTION` |
| `Retourne le résultat de "a + b".` | `return (a + b);` | `RETURN_ENDS_FUNCTION` |
| `Retourne le résultat numérique de "(double) a / b".` | `return (((double) a) / b);` | `RETURN_ENDS_FUNCTION` |
| `Appelle affiche.` | `affiche();` | `CALL_NOT_RESOLVED` |
| `Appelle somme avec "2" et "3".` | `somme(2, 3);` | `CALL_NOT_RESOLVED` |
| `Affecte à total le résultat de l’appel de somme avec "2" et "3".` | `total = somme(2, 3);` | `CALL_NOT_RESOLVED` |

Types de retour et de paramètre : `int`, `unsigned int`, `float`,
`double`, plus `void` en retour. Bornes : **16 paramètres**,
**16 arguments**.

### Ce qui est vérifié dans le document

| Intention | Vérification au placement |
|---|---|
| `Retourne.` | la fonction englobante doit déclarer `void` |
| les trois retours de valeur | la fonction englobante ne doit **pas** déclarer `void` |
| tous les retours | une fonction englobante bracée doit exister, avec un type de retour pris en charge écrit dans son en-tête |

---

## Limites de complexité

| Limite | Valeur |
|---|---|
| Tokens par expression ou condition | **1 024** |
| Niveaux d'imbrication | **64** |
| Clauses d'un `for` / arguments d'un appel | budget de tokens **commun**, profondeur propre à chacun |
| Unités balayées avant la ligne cible | 1 048 576 |
| Tokens et profondeur du balayage contextuel | 50 000 et 128 |
| Branches d'une chaîne `if` | 64 |

Les budgets de tokens ne sont **jamais** remis à zéro entre les
sous-expressions ni entre les clauses d'une même instruction.

## Ce que C-A ne fait pas

- **Rien d'implicite** : aucun `main`, `return`, `#include`, déclaration,
  compteur, initialisation, progression ni format n'est ajouté.
- **Aucune résolution de symbole** : ni existence, ni arité, ni type d'un
  argument, ni portée d'une variable.
- **Aucune vérification de type** au-delà de l'accord entre la forme d'une
  phrase de retour et le type **déclaré** dans l'en-tête.
- **Aucune analyse** de terminaison, de progression, de nombre de tours,
  d'accessibilité ou de code mort.
- **Aucune évaluation** : les nombres sont conservés textuellement, jamais
  convertis ni calculés.
- **Aucune correction silencieuse**, aucun synonyme, aucune valeur
  inventée, aucune proposition de phrase complète à recopier.
- **Aucune garantie** que le C produit compile ou s'exécute sans danger.
  L'absence d'avertissement n'est jamais un certificat.

## Non livré

`switch`, `goto`, tableaux, chaînes de caractères, pointeurs, `struct`,
mémoire dynamique, fichiers, compilation séparée. Types `char`, `long`,
`short`, `static`, pointeurs : refusés. Paliers de liberté 2 et 3 : non
spécifiés.
