# Catalogue Python — ce que C-A écrit aujourd’hui

Engendré par `node scripts/catalogue-python.mjs`. **Ne pas éditer à la main.**

> **Ce document n’est pas le catalogue pédagogique de Python.** Il dit ce que
> les intentions du catalogue **C** deviennent en Python, et ce qu’elles ne
> deviennent pas. Les intentions **natives** — `range`, `for each`,
> `enumerate`, les dictionnaires, les ensembles, les méthodes de chaînes,
> `with`, `match` — n’existent pas encore : elles sont proposées dans
> `docs/phase2/CATALOGUE_NATIF_PYTHON_PROPOSE.md`, et c’est là qu’est le
> travail pédagogique.
>
> État : **lot P3**, branche `phase-2-architecture`. Python n’est pas dans
> la version publique, et la commande VS Code n’ouvre pas encore de `.py`.

Le symbole ⏎ marque une fin de ligne dans le code produit.

## 1. Les 30 intentions rendues

| Phrase française | Python produit | Informations passives |
|---|---|---|
| `Crée un entier nommé age de valeur 20.` | `age = 20` | PY_INT_IS_UNBOUNDED |
| `Affecte la valeur 25 à age.` | `age = 25` | PY_NAME_REBINDS |
| `Affiche la valeur de age.` | `print(age, end="")` | PY_NO_SEPARATOR_ADDED |
| `Affiche age en décimal.` | `print(age, end="")` | PY_NO_SEPARATOR_ADDED |
| `Affiche le texte "Bonjour\n".` | `print("Bonjour\n", end="")` | PY_NO_SEPARATOR_ADDED |
| `Affiche un retour à la ligne.` | `print("\n", end="")` | PY_NO_SEPARATOR_ADDED |
| `Affecte à resultat le résultat de "2 + 3 * 4".` | `resultat = (2 + (3 * 4))` | PY_NAME_REBINDS |
| `Crée une variable de type double nommée x avec le résultat de "1.5".` | `x: float = 1.5` | PY_ANNOTATION_NOT_CHECKED, PY_INT_IS_UNBOUNDED |
| `Affiche x en notation fixe avec 2 décimales.` | `print(f"{x:.2f}", end="")` | PY_NO_SEPARATOR_ADDED |
| `Crée un bloc si "age >= 18 && !suspendu".` | `if ((age >= 18) and (not suspendu)):` | PY_BLOCK_NEEDS_A_BODY, PY_TRUTHINESS |
| `Ajoute une branche sinon si "age >= 12".` | `elif age >= 12:` | PY_BLOCK_NEEDS_A_BODY, PY_TRUTHINESS |
| `Ajoute une branche sinon.` | `else:` | PY_BLOCK_NEEDS_A_BODY |
| `Crée une boucle tant que "i < limite".` | `while i < limite:` | PY_BLOCK_NEEDS_A_BODY, PY_TRUTHINESS |
| `Sors de la boucle la plus intérieure.` | `break` | — |
| `Passe à l’itération suivante de la boucle la plus intérieure.` | `continue` | — |
| `Crée une fonction nommée affiche qui ne retourne rien.` | `def affiche() -> None:` | PY_BLOCK_NEEDS_A_BODY, PY_ANNOTATION_NOT_CHECKED |
| `Retourne.` | `return` | — |
| `Retourne la valeur 0.` | `return 0` | — |
| `Retourne le résultat de "a + b".` | `return (a + b)` | — |
| `Appelle affiche.` | `affiche()` | — |
| `Affecte à total le résultat de l’appel de somme avec "2" et "3".` | `total = somme(2, 3)` | — |
| `Crée un caractère nommé c de valeur 'A'.` | `c: str = 'A'` | PY_CHAR_IS_A_STRING, PY_ANNOTATION_NOT_CHECKED |
| `Affecte le caractère 'A' à c.` | `c = 'A'` | PY_CHAR_IS_A_STRING |
| `Affiche le caractère c.` | `print(c, end="")` | PY_CHAR_IS_A_STRING, PY_NO_SEPARATOR_ADDED |
| `Affecte la valeur 5 à l'élément "0" de t.` | `t[0] = 5` | — |
| `Affecte le caractère 'A' à l'élément "0" de t.` | `t[0] = 'A'` | PY_CHAR_IS_A_STRING |
| `Affecte à l'élément "i" de t le résultat numérique de "a + 1".` | `t[i] = (a + 1)` | — |
| `Affiche l'élément "0" de t.` | `print(t[0], end="")` | PY_NO_SEPARATOR_ADDED |
| `Affiche la chaîne s.` | `print(s, end="")` | PY_NO_SEPARATOR_ADDED |
| `Affiche le caractère de l'élément "i" de s.` | `print(s[i], end="")` | PY_NO_SEPARATOR_ADDED |

**Aucun bloc ne reçoit de corps**, et aucun `pass` n’est écrit : le corps est
à l’étudiant. Le fichier est donc incomplet — et invalide — jusqu’à ce qu’il
l’écrive. C’est une différence réelle avec C17, où le bloc fermé laisse le
fichier compilable.

### Deux intentions portées qui n’apparaissent pas ci-dessus

Le lot P3 porte **32** intentions, et le tableau n’en montre que
**30**. La différence vient de la **phrase d’exemple** du catalogue C,
pas de l’intention :

- `NUMERIC_ASSIGN` : l’exemple est `Affecte à x le résultat numérique de "(double) 7 / 2".`, et il contient une division.
- `RETURN_NUMERIC` : l’exemple est `Retourne le résultat numérique de "(double) a / b".`, et il contient une division.

C’est la même observation qui avait corrigé la mesure de la sonde : le refus
porte sur `/`, pas sur l’intention. Elles se rendent dès que l’expression n’en
contient pas.

## 2. Les 52 intentions refusées

Un refus n’est pas une interdiction d’enseigner la notion : chaque raison
nomme la construction **native** qui porte la même compétence. Trois sortes :
`ATTENTE` (une décision de contrat est ouverte, et elle est nommée),
`NOTION_ABSENTE` (la notion n’existe pas en Python), `FORME_AUTRE` (elle
existe sous une autre forme, qui demande ses propres phrases).

| Intention | Phrase française | Sorte | Raison |
|---|---|---|---|
| `ALLOCATE` | `Affecte à p l'allocation de 10 éléments de type int.` | NOTION_ABSENTE | Python gère la mémoire lui-même : il n’y a ni allocation explicite, ni réallocation, ni libération, et donc ni fuite à la main ni libération double. La compétence « faire grandir une collection » s’enseignera par l’agrandissement d’une liste, avec une information disant ce que le langage fait à votre place. |
| `ARRAY_DECL` | `Déclare un tableau de type int nommé t de dimension 10.` | ATTENTE | un tableau de dimension fixe demanderait d’inventer un remplissage : « [0] * 10 » écrit un zéro que personne n’a demandé. Une liste dont les valeurs sont **écrites**, et une liste vide, recevront leurs propres phrases ; la compétence d’indexation, elle, est déjà portée : l’affectation et l’affichage d’un élément fonctionnent. |
| `ASSERT` | `Vérifie que "x > 0".` | FORME_AUTRE | « assert » existe en Python, mais il est désactivé par l’option « -O » et il lève une exception au lieu d’arrêter le processus. Porter la phrase sans dire cela enseignerait une garantie que le langage ne donne pas. L’assertion recevra sa phrase avec son information, et la vérification d’une donnée se fera par une exception explicite. |
| `ASSIGN_ADDRESS` | `Affecte l'adresse de x à p.` | NOTION_ABSENTE | Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la même leçon avec les outils du langage. |
| `ASSIGN_POINTED_EXPRESSION` | `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` | NOTION_ABSENTE | Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la même leçon avec les outils du langage. |
| `ASSIGN_POINTED_INT` | `Affecte la valeur 5 à la valeur pointée par p.` | NOTION_ABSENTE | Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la même leçon avec les outils du langage. |
| `BREAK_SWITCH` | `Sors de l'aiguillage.` | ATTENTE | « match » ne traverse pas les cas, là où « switch » les traverse : les informations SWITCH_FALLTHROUGH et BREAK_LEAVES_SWITCH deviendraient fausses, et « Sors de l’aiguillage. » n’aurait aucun sens. Le filtrage par motif recevra ses propres phrases, sans traversée et sans sortie. |
| `CASE_CHAR` | `Ajoute un cas pour le caractère 'A'.` | ATTENTE | « match » ne traverse pas les cas, là où « switch » les traverse : les informations SWITCH_FALLTHROUGH et BREAK_LEAVES_SWITCH deviendraient fausses, et « Sors de l’aiguillage. » n’aurait aucun sens. Le filtrage par motif recevra ses propres phrases, sans traversée et sans sortie. |
| `CASE_DEFAULT` | `Ajoute le cas par défaut.` | ATTENTE | « match » ne traverse pas les cas, là où « switch » les traverse : les informations SWITCH_FALLTHROUGH et BREAK_LEAVES_SWITCH deviendraient fausses, et « Sors de l’aiguillage. » n’aurait aucun sens. Le filtrage par motif recevra ses propres phrases, sans traversée et sans sortie. |
| `CASE_INT` | `Ajoute un cas pour la valeur 5.` | ATTENTE | « match » ne traverse pas les cas, là où « switch » les traverse : les informations SWITCH_FALLTHROUGH et BREAK_LEAVES_SWITCH deviendraient fausses, et « Sors de l’aiguillage. » n’aurait aucun sens. Le filtrage par motif recevra ses propres phrases, sans traversée et sans sortie. |
| `CONST_DECL` | `Déclare une constante de type int nommée MAX avec le résultat de "100".` | NOTION_ABSENTE | Python n’a pas de constante : un nom en majuscules est une **convention** de lecture, que rien n’empêche de réaffecter. Écrire cette convention comme si elle protégeait quoi que ce soit enseignerait une garantie fausse. La compétence s’enseignera avec son information. |
| `DECL_CHAR` | `Déclare un caractère nommé c.` | ATTENTE | Python ne sépare pas la déclaration de l’initialisation : un nom naît avec sa valeur. Écrire « n = 0 » inventerait un zéro, et une annotation seule ne crée aucun nom. La notion de variable s’enseigne donc par la phrase qui donne la valeur, et une information passive explique la différence. |
| `DECL_INT` | `Déclare un entier nommé age.` | ATTENTE | Python ne sépare pas la déclaration de l’initialisation : un nom naît avec sa valeur. Écrire « n = 0 » inventerait un zéro, et une annotation seule ne crée aucun nom. La notion de variable s’enseigne donc par la phrase qui donne la valeur, et une information passive explique la différence. |
| `DECL_POINTER` | `Déclare un pointeur de type int nommé p.` | NOTION_ABSENTE | Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la même leçon avec les outils du langage. |
| `DO_WHILE` | `Crée une boucle avec test final tant que "i < limite".` | NOTION_ABSENTE | Python n’a pas de boucle à test final. La compétence « exécuter au moins une fois, puis répéter tant que » s’écrit avec une boucle « while » et une sortie explicite, et elle recevra sa propre phrase plutôt qu’une traduction qui réordonnerait le corps. |
| `FILE_AT_END` | `Crée un bloc si la fin du fichier f est atteinte.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FILE_CLOSE` | `Ferme le fichier f.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FILE_DECL` | `Déclare un fichier nommé f.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FILE_OPEN` | `Affecte à f l'ouverture du fichier "donnees.txt" en lecture.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FILE_READ_INT` | `Lis un entier depuis le fichier f dans x.` | ATTENTE | « Lis un entier depuis le fichier f dans x. » cacherait deux opérations en une phrase : lire une ligne, puis la convertir, avec une exception possible si la ligne est vide. La règle 6 interdit de laisser croire sûr ce qui ne l’est pas : la lecture et la conversion recevront deux phrases distinctes. |
| `FILE_READ_STRING` | `Lis une chaîne de dimension 32 depuis le fichier f dans s.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FILE_WRITE_INT` | `Écris la valeur de x dans le fichier f.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FILE_WRITE_TEXT` | `Écris le texte "bonjour" dans le fichier f.` | FORME_AUTRE | les fichiers existent en Python, et c’est une des familles les plus utiles ; mais ils s’ouvrent dans un bloc « with » qui ferme tout seul, se parcourent ligne par ligne, et n’ont pas d’indicateur de fin de fichier à tester. Les phrases d’ouverture, de parcours et d’écriture seront écrites pour cette forme, pas portées depuis « fopen » et « feof ». |
| `FOR` | `Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".` | ATTENTE | la boucle « pour » à trois clauses demanderait de placer la mise à jour à la fin du corps, donc de restructurer ce que l’étudiant a écrit. Python parcourt une séquence : « range », « for each » et « enumerate » recevront leurs propres phrases, et elles enseignent la même compétence de répétition bornée. |
| `FREE` | `Libère la mémoire pointée par p.` | NOTION_ABSENTE | Python gère la mémoire lui-même : il n’y a ni allocation explicite, ni réallocation, ni libération, et donc ni fuite à la main ni libération double. La compétence « faire grandir une collection » s’enseignera par l’agrandissement d’une liste, avec une information disant ce que le langage fait à votre place. |
| `FUNC_PROTOTYPE` | `Déclare le prototype d'une fonction nommée somme qui retourne un int et prend un int nommé a.` | NOTION_ABSENTE | Python n’a pas de prototype ni de liaison : une fonction est définie, et un nom est visible une fois le module exécuté. La compétence « déclarer avant d’utiliser » n’existe pas sous cette forme : la compétence « organiser un programme en morceaux réutilisables » s’enseignera par « import » et par l’ordre de définition dans le module, avec une information qui dit ce que l’ordre garantit et ce qu’il ne garantit pas. |
| `GUARD_CLOSE` | `Ferme la protection d'en-tête.` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `GUARD_OPEN` | `Ouvre la protection d'en-tête nommée CALCUL_H.` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `INCLUDE_ASSERT` | `Inclue la bibliothèque assert.h.` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `INCLUDE_LIMITS` | `Inclue la bibliothèque limits.h.` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `INCLUDE_LOCAL` | `Inclue l'en-tête "calcul.h".` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `INCLUDE_STDIO` | `Inclue la bibliothèque stdio.h.` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `INCLUDE_STDLIB` | `Inclue la bibliothèque stdlib.h.` | NOTION_ABSENTE | Python n’a pas de préprocesseur : pas de directive d’inclusion, pas de garde d’en-tête, et un module n’est exécuté qu’une fois même importé deux fois. La compétence « réutiliser du code écrit ailleurs » s’enseignera par « import », qui est une instruction du langage et non une copie de texte, et la différence vaut d’être dite. |
| `INIT_POINTER` | `Crée un pointeur de type int nommé p avec l'adresse de x.` | NOTION_ABSENTE | Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la même leçon avec les outils du langage. |
| `LINKAGE_DECL` | `Déclare la variable externe de type int nommée compteur.` | NOTION_ABSENTE | Python n’a pas de prototype ni de liaison : une fonction est définie, et un nom est visible une fois le module exécuté. La compétence « déclarer avant d’utiliser » n’existe pas sous cette forme : la compétence « organiser un programme en morceaux réutilisables » s’enseignera par « import » et par l’ordre de définition dans le module, avec une information qui dit ce que l’ordre garantit et ce qu’il ne garantit pas. |
| `MAIN` | `Crée la fonction principale.` | ATTENTE | « Crée la fonction principale. » n’a pas d’équivalent : en Python, le code d’un module s’exécute à l’import, et le placement par indentation autorise déjà une instruction à la portée module. La convention « if __name__ == "__main__": » recevra sa propre phrase, avec l’information qu’elle est une convention et non une exigence. |
| `MEMBER_ASSIGN_CHAR` | `Affecte le caractère 'A' au champ initiale de e.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `MEMBER_ASSIGN_EXPRESSION` | `Affecte au champ x de p le résultat numérique de "a + 1".` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `MEMBER_ASSIGN_INT` | `Affecte la valeur 5 au champ x de p.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `MEMBER_PRINT` | `Affiche le champ x de p.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `NUMERIC_DECL` | `Déclare une variable de type double nommée x.` | ATTENTE | Python ne sépare pas la déclaration de l’initialisation : un nom naît avec sa valeur. Écrire « n = 0 » inventerait un zéro, et une annotation seule ne crée aucun nom. La notion de variable s’enseigne donc par la phrase qui donne la valeur, et une information passive explique la différence. |
| `PRINT_POINTED` | `Affiche la valeur pointée par p.` | NOTION_ABSENTE | Python n’a pas de pointeur : ni adresse, ni déréférencement, ni arithmétique de pointeurs. La compétence visée — deux noms qui désignent le **même** objet, et la différence entre modifier l’objet et rebinder le nom — s’enseignera par l’aliasing d’une liste, qui est la même leçon avec les outils du langage. |
| `REALLOCATE` | `Affecte à q la réallocation de p pour 20 éléments de type int.` | NOTION_ABSENTE | Python gère la mémoire lui-même : il n’y a ni allocation explicite, ni réallocation, ni libération, et donc ni fuite à la main ni libération double. La compétence « faire grandir une collection » s’enseignera par l’agrandissement d’une liste, avec une information disant ce que le langage fait à votre place. |
| `SIZEOF_ASSIGN` | `Affecte à n la taille du type double.` | NOTION_ABSENTE | « sizeof » mesure une taille en octets, que Python n’expose pas pour ses objets. La compétence proche — connaître le nombre d’éléments — s’enseigne par « len », et c’est une **autre notion** : le dire est le but, pas le cacher derrière le même mot. |
| `SIZEOF_PRINT` | `Affiche la taille du type int.` | NOTION_ABSENTE | « sizeof » mesure une taille en octets, que Python n’expose pas pour ses objets. La compétence proche — connaître le nombre d’éléments — s’enseigne par « len », et c’est une **autre notion** : le dire est le but, pas le cacher derrière le même mot. |
| `STRING_INIT` | `Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".` | FORME_AUTRE | une chaîne Python n’a ni dimension à prévoir ni terminateur nul, et elle est immuable. Porter « Crée un tableau de type char … avec le texte … » perdrait la dimension que l’étudiant a donnée, ou la garderait sans qu’elle veuille dire quoi que ce soit. La création d’une chaîne recevra sa propre phrase, et l’immuabilité son information. |
| `STRUCT_DECL` | `Déclare une structure nommée Point.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `STRUCT_FIELD` | `Ajoute un champ de type int nommé x.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `STRUCT_POINTER` | `Déclare un pointeur de type structure Point nommé q.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `STRUCT_VAR` | `Déclare une variable de type structure Point nommée p.` | ATTENTE | Python n’a pas de structure. Le regroupement de données nommées s’enseigne d’abord par un **dictionnaire**, puis par une **classe** avec son constructeur ; une classe exige un constructeur, que « Ajoute un champ. » ne donne pas. Les deux recevront un domaine entier, avec leur propre contrat. |
| `SWITCH` | `Crée un aiguillage sur "jour".` | ATTENTE | « match » ne traverse pas les cas, là où « switch » les traverse : les informations SWITCH_FALLTHROUGH et BREAK_LEAVES_SWITCH deviendraient fausses, et « Sors de l’aiguillage. » n’aurait aucun sens. Le filtrage par motif recevra ses propres phrases, sans traversée et sans sortie. |
| `TYPE_ALIAS` | `Déclare le synonyme Noeud pour la structure Noeud.` | FORME_AUTRE | un synonyme de type en Python est une affectation de type, pas une déclaration, et il ne crée aucun type nouveau. La notion recevra sa propre phrase quand les classes seront au programme, là où elle commence à servir. |

## 3. Ce qui est refusé à l’intérieur d’une intention portée

L’intention est portée, mais ce qu’elle contient ne l’est pas. Le registre
répond alors `CONSTRUCTION_NON_PORTEE`.

| Construction | Pourquoi |
|---|---|
| `a / b` | En C17, `7 / 2` vaut **3** ; en Python, **3.5**. Décision **D3**, ouverte. |
| `a % b` | En C17, `-7 % 2` vaut **-1** ; en Python, **1**. Décision **D13**, ouverte par le lot P3. |
| `&x`, `*p`, `*(t + i)` | Python n’a pas de pointeur. L’aliasing d’une liste enseigne la même leçon. |
| `(unsigned int) x` | Les entiers Python sont signés et de précision arbitraire ; écrire `int` perdrait l’information donnée. |
| `o.champ`, `o->champ` | Décision **D6** : ni structure ni classe au premier jet. |
| un nom réservé en Python | `lambda`, `None`, `pass` sont des identifiants **C17 valides** : le moteur les accepte, et c’est au langage cible de les refuser. |

## 4. Vérification

- intentions du catalogue C balayées : **84**
- intentions portées par le lot P3 : **32**, dont **30** avec une phrase d’exemple rendable
- intentions non portées : **52**
- raisons écrites au registre : **52**

La partition est vérifiée par `test/python.test.mjs` : chacune des 84
intentions est soit rendue, soit refusée avec une raison, jamais les deux,
et aucune raison ne porte un nom qui n’est pas une intention.
