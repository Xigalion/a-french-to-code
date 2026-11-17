# Expérience — rendu Python depuis l’AST de C-A

Produit par `node --experimental-strip-types experiences/python/mesurer.mjs`.
**Sonde jetable**, isolée dans `experiences/` : ni `src/` ni les tests ne sont touchés.

## 1. Couverture des 84 intentions

| | Nombre | Part |
|---|---|---|
| **rendues sans rien inventer** | **37** | 44,0 % |
| **refusées, avec leur raison** | **47** | 56,0 % |
| total mesuré | 84 | |

## 2. Le programme rendu, puis exécuté

`23` phrases du catalogue, **inchangées**, rendues en Python et exécutées.

| | |
|---|---|
| incidents de rendu | **aucun** |
| code de sortie de `python3` | **0** |
| sortie obtenue | `"36\n12.00\nadmis\n134\n"` |
| sortie attendue, calculée à la main | `"36\n12.00\nadmis\n134\n"` |
| verdict | **CONFORME** |

Le programme produit :

```python
def somme(a: int, b: int, c: int) -> int:
    return ((a + b) + c)
total = 0
total = somme(12, 15, 9)
print(total, end="")
print()
moyenne: float = 12.0
moyenne = (float(total) * 0.3333)
print(f"{moyenne:.2f}", end="")
print()
if moyenne >= 10:
    print("admis", end="")
else:
    print("ajourne", end="")
print()
i = 0
while i < 4:
    i = (i + 1)
    if i == 2:
        continue
    print(i, end="")
print()
assert total == 36
```

## 3. Ce que Python refuse, et pourquoi

C’est le vrai résultat de l’expérience : chaque ligne est une **décision de
contrat** à prendre avant d’écrire une ligne de code définitif.

| Intention | Phrase française | Raison du refus |
|---|---|---|
| `ALLOCATE` | `Affecte à p l'allocation de 10 éléments de type int.` | Python alloue à la création : il n’y a rien à demander. |
| `ARRAY_DECL` | `Déclare un tableau de type int nommé t de dimension 10.` | Une liste Python n’existe qu’avec son contenu : une dimension seule obligerait à inventer une valeur de remplissage. |
| `ASSIGN_ADDRESS` | `Affecte l'adresse de x à p.` | Python n’expose pas d’adresse. |
| `ASSIGN_POINTED_EXPRESSION` | `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` | Python n’a pas de déréférencement. |
| `ASSIGN_POINTED_INT` | `Affecte la valeur 5 à la valeur pointée par p.` | Python n’a pas de déréférencement. |
| `BREAK_SWITCH` | `Sors de l'aiguillage.` | Python n’a pas d’aiguillage à sortie explicite. |
| `CASE_CHAR` | `Ajoute un cas pour le caractère 'A'.` | Voir SWITCH. |
| `CASE_DEFAULT` | `Ajoute le cas par défaut.` | Voir SWITCH. |
| `CASE_INT` | `Ajoute un cas pour la valeur 5.` | Voir SWITCH. |
| `CONST_DECL` | `Déclare une constante de type int nommée MAX avec le résultat de "100".` | Python n’a pas de constante : une convention de nom n’en est pas une. |
| `DECL_CHAR` | `Déclare un caractère nommé c.` | Python ne déclare pas sans valeur. |
| `DECL_INT` | `Déclare un entier nommé age.` | Python ne déclare pas sans valeur : écrire « n = 0 » inventerait ce 0. |
| `DECL_POINTER` | `Déclare un pointeur de type int nommé p.` | Python n’a pas de pointeur. |
| `DO_WHILE` | `Crée une boucle avec test final tant que "i < limite".` | Python n’a pas de boucle à test final. |
| `FILE_AT_END` | `Crée un bloc si la fin du fichier f est atteinte.` | Python n’a pas d’indicateur de fin de fichier : la fin se constate à la lecture. |
| `FILE_DECL` | `Déclare un fichier nommé f.` | Un fichier Python n’est pas déclaré avant d’être ouvert. |
| `FILE_READ_INT` | `Lis un entier depuis le fichier f dans x.` | Lire un entier depuis un flux Python demande une conversion explicite — décision de contrat. |
| `FOR` | `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | Le « for » de C a trois clauses ; celui de Python parcourt un itérable. Les faire correspondre demanderait de restructurer la phrase — décision de contrat. |
| `FREE` | `Libère la mémoire pointée par p.` | Python libère par ramasse-miettes : libérer explicitement n’existe pas. |
| `FUNC_PROTOTYPE` | `Déclare le prototype d'une fonction nommée somme qui retourne un int et prend un int nommé a.` | Python ne déclare pas avant de définir. |
| `GUARD_CLOSE` | `Ferme la protection d'en-tête.` | Python n’a pas de préprocesseur. |
| `GUARD_OPEN` | `Ouvre la protection d'en-tête nommée CALCUL_H.` | Python n’a pas de préprocesseur ; un module n’est exécuté qu’une fois. |
| `INCLUDE_ASSERT` | `Inclue la bibliothèque assert.h.` | « assert » est un mot-clé de Python, sans en-tête. |
| `INCLUDE_LIMITS` | `Inclue la bibliothèque limits.h.` | Les entiers de Python n’ont pas de borne de représentation. |
| `INCLUDE_LOCAL` | `Inclue l'en-tête "calcul.h".` | Un module Python s’importe par son nom, pas par un chemin de fichier. |
| `INCLUDE_STDIO` | `Inclue la bibliothèque stdio.h.` | Python n’a pas d’en-tête à inclure : « print » est intégré. |
| `INCLUDE_STDLIB` | `Inclue la bibliothèque stdlib.h.` | Python n’a pas d’en-tête à inclure. |
| `INIT_POINTER` | `Crée un pointeur de type int nommé p avec l'adresse de x.` | Python n’a pas de pointeur. |
| `LINKAGE_DECL` | `Déclare la variable externe de type int nommée compteur.` | Python n’a pas de liaison externe ; un module expose ses noms. |
| `MAIN` | `Crée la fonction principale.` | En Python, « main » est une convention et non une exigence : la créer sans l’appeler laisse un programme qui ne fait rien, et l’appeler serait un ajout implicite. |
| `MEMBER_ASSIGN_CHAR` | `Affecte le caractère 'A' au champ initiale de e.` | Voir STRUCT_DECL. |
| `MEMBER_ASSIGN_EXPRESSION` | `Affecte au champ x de p le résultat numérique de "a + 1".` | Voir STRUCT_DECL. |
| `MEMBER_ASSIGN_INT` | `Affecte la valeur 5 au champ x de p.` | Voir STRUCT_DECL. |
| `MEMBER_PRINT` | `Affiche le champ x de p.` | Voir STRUCT_DECL. |
| `NUMERIC_ASSIGN` | `Affecte à x le résultat numérique de "(double) 7 / 2".` | La division entière de C tronque, celle de Python produit un flottant : le même texte ne dit pas la même chose. Décision de contrat, pas rendu. |
| `NUMERIC_DECL` | `Déclare une variable de type double nommée x.` | Python ne déclare pas sans valeur. |
| `PRINT_POINTED` | `Affiche la valeur pointée par p.` | Python n’a pas de déréférencement. |
| `REALLOCATE` | `Affecte à q la réallocation de p pour 20 éléments de type int.` | Une liste Python se redimensionne d’elle-même. |
| `RETURN_NUMERIC` | `Retourne le résultat numérique de "(double) a / b".` | La division entière de C tronque, celle de Python produit un flottant : le même texte ne dit pas la même chose. Décision de contrat, pas rendu. |
| `SIZEOF_ASSIGN` | `Affecte à n la taille du type double.` | La taille d’un objet Python ne se demande pas à son type. |
| `SIZEOF_PRINT` | `Affiche la taille du type int.` | La taille d’un objet Python ne se demande pas à son type. |
| `STRUCT_DECL` | `Déclare une structure nommée Point.` | Une classe Python ne déclare pas de champs sans valeur : le concept existe, pas sous cette forme — décision de contrat. |
| `STRUCT_FIELD` | `Ajoute un champ de type int nommé x.` | Voir STRUCT_DECL : décision de contrat, pas rendu. |
| `STRUCT_POINTER` | `Déclare un pointeur de type structure Point nommé q.` | Python n’a pas de pointeur vers une structure. |
| `STRUCT_VAR` | `Déclare une variable de type structure Point nommée p.` | Voir STRUCT_DECL : une instance exige un constructeur. |
| `SWITCH` | `Crée un aiguillage sur "jour".` | Le « match » de Python ne traverse pas les cas : même mot, autre sémantique — décision de contrat. |
| `TYPE_ALIAS` | `Déclare le synonyme Noeud pour la structure Noeud.` | Un synonyme de structure n’a pas d’objet ici. |

## 4. Les intentions rendues, C puis Python

| Intention | C17 | Python |
|---|---|---|
| `ARRAY_ASSIGN_CHAR` | `t[0] = 'A';` | `t[0] = "A"` |
| `ARRAY_ASSIGN_EXPRESSION` | `t[i] = (a + 1);` | `t[i] = (a + 1)` |
| `ARRAY_ASSIGN_INT` | `t[0] = 5;` | `t[0] = 5` |
| `ARRAY_PRINT` | `printf("%d", t[0]);` | `print(t[0], end="")` |
| `ARRAY_PRINT_CHAR` | `printf("%c", s[i]);` | `print(s[i], end="")` |
| `ASSERT` | `assert(x > 0);` | `assert x > 0` |
| `ASSIGN_CHAR` | `c = 'A';` | `c = "A"` |
| `ASSIGN_EXPRESSION` | `resultat = (2 + (3 * 4));` | `resultat = (2 + (3 * 4))` |
| `ASSIGN_INT` | `age = 25;` | `age = 25` |
| `BREAK` | `break;` | `break` |
| `CALL` | `affiche();` | `affiche()` |
| `CALL_ASSIGN` | `total = somme(2, 3);` | `total = somme(2, 3)` |
| `CONTINUE` | `continue;` | `continue` |
| `ELSE` | `else { ⏎      ⏎ }` | `else:` |
| `ELSE_IF` | `else if (age >= 12) { ⏎      ⏎ }` | `elif age >= 12:` |
| `FILE_CLOSE` | `fclose(f);` | `f.close()` |
| `FILE_OPEN` | `f = fopen("donnees.txt", "r");` | `f = open("donnees.txt", "r")` |
| `FILE_READ_STRING` | `fgets(s, 32, f);` | `s = undefined.readline(32)` |
| `FILE_WRITE_INT` | `fprintf(f, "%d", x);` | `undefined.write(str(f))` |
| `FILE_WRITE_TEXT` | `fprintf(f, "%s", "bonjour");` | `undefined.write("bonjour")` |
| `FUNC_DEF` | `void affiche(void) { ⏎      ⏎ }` | `def affiche() -> None:` |
| `IF` | `if (((age >= 18) && (!suspendu))) { ⏎      ⏎ }` | `if (age >= 18 and not suspendu):` |
| `INIT_CHAR` | `char c = 'A';` | `c = "A"` |
| `INIT_INT` | `int age = 20;` | `age = 20` |
| `NUMERIC_INIT` | `double x = 1.5;` | `x: float = 1.5` |
| `NUMERIC_PRINT` | `printf("%.2f", x);` | `print(f"{x:.2f}", end="")` |
| `PRINT_CHAR` | `printf("%c", c);` | `print(c, end="")` |
| `PRINT_FORMATTED` | `printf("%d", age);` | `print(f"{age}", end="")` |
| `PRINT_INT` | `printf("%d", age);` | `print(age, end="")` |
| `PRINT_NEWLINE` | `printf("\n");` | `print()` |
| `PRINT_STRING` | `printf("%s", s);` | `print(s, end="")` |
| `PRINT_TEXT` | `printf("%s", "Bonjour\n");` | `print("Bonjour\n", end="")` |
| `RETURN` | `return;` | `return` |
| `RETURN_EXPRESSION` | `return (a + b);` | `return (a + b)` |
| `RETURN_INT` | `return 0;` | `return 0` |
| `STRING_INIT` | `char s[6] = "hello";` | `s = "hello"` |
| `WHILE` | `while (i < limite) { ⏎      ⏎ }` | `while i < limite:` |

