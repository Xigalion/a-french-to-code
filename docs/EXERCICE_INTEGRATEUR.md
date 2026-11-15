# Exercice intégrateur du modèle 1 — énoncé proposé

**Objet.** Mesurer la **complétion réelle** du modèle 1 de C-A, en
écrivant un programme C17 complet **uniquement** avec les formulations du
catalogue, dans VS Code, par le parcours saisie → aperçu → confirmation →
insertion.

**La réussite des tests automatisés ne vaut pas complétion.** C'est cet
exercice qui doit la mesurer. Il est conçu pour **échouer de façon utile** :
chaque point de blocage est une lacune à consigner, pas une faute.

---

## 1. Règle du jeu

1. Tout le code C est produit par C-A. Aucune frappe directe dans le `.c`,
   sauf là où l'énoncé le dit explicitement.
2. À chaque instruction, noter : la phrase écrite, si elle a été acceptée,
   et le diagnostic exact en cas de refus.
3. Quand une étape est impossible, **ne pas contourner en tapant le C à la
   main sans le noter**. Écrire « blocage », la phrase tentée, le
   diagnostic, puis contourner en le signalant.
4. À la fin, compiler avec `gcc -std=c17 -Wall -Wextra -pedantic` et noter
   **tous** les messages.

---

## 2. Ce que le programme doit faire

Un carnet de notes en mémoire dynamique :

- une structure `Eleve` : un `nom` de 32 caractères et une `note` entière ;
- un tableau de `Eleve` alloué dynamiquement pour `n` élèves ;
- le remplissage des élèves ;
- le calcul de la moyenne, avec assertion que `n` est strictement positif ;
- la recherche de la meilleure note ;
- l'écriture du résultat dans un fichier ;
- la libération de la mémoire ;
- le tout séparé en un en-tête protégé et deux fichiers source.

---

## 3. Parcours par domaine

### Domaine 1 — Fondations

Dans `carnet.c` :

    Inclue la bibliothèque stdio.h.
    Crée la fonction principale.
    Déclare un entier nommé n.
    Affecte la valeur 3 à n.
    Affiche la valeur de n.
    Affiche le texte "Carnet de notes".

### Domaine 2 — Expressions et calculs

    Déclare une variable de type double nommée moyenne.
    Affecte à moyenne le résultat numérique de "(double) total / n".
    Affiche moyenne en notation fixe avec 2 décimales.
    Affecte à n le résultat de "n * 2 + 1".

Vérifier qu'un diviseur nul est **signalé** :
`Affecte à moyenne le résultat numérique de "total / 0".`

### Domaine 3 — Décisions et répétitions

    Crée un bloc si "n > 0".
    Ajoute une branche sinon.
    Crée une boucle pour i de valeur initiale "0" tant que "i < n" avec mise à jour "i + 1".
    Sors de la boucle la plus intérieure.
    Crée un aiguillage sur "mention".
    Ajoute un cas pour la valeur 1.
    Sors de l'aiguillage.
    Ajoute le cas par défaut.

**À observer :** placer `Sors de la boucle la plus intérieure.` à
l'intérieur de l'aiguillage doit être **refusé**
(`BREAK_TARGET_IS_SWITCH`), et l'inverse aussi.

### Domaine 4 — Fonctions et décomposition

    Crée une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.
    Retourne le résultat numérique de "(double) total / n".
    Appelle afficheCarnet avec "n".
    Affecte à moyenne le résultat de l'appel de moyenneDe avec "total" et "n".

### Domaine 5 — Tableaux, chaînes et pointeurs

    Déclare un tableau de type int nommé notes de dimension 3.
    Affecte la valeur 12 à l'élément "0" de notes.
    Affiche l'élément "0" de notes.
    Crée un tableau de type char nommé titre de dimension 8 avec le texte "Carnet".
    Affiche la chaîne titre.
    Déclare un entier nommé i.
    Crée une boucle tant que "titre[i] != '\0'".
    Affiche le caractère de l'élément "i" de titre.
    Déclare un pointeur de type int nommé p.
    Affecte l'adresse de n à p.
    Affiche la valeur pointée par p.
    Affecte à n le résultat numérique de "*(notes + i)".

**À observer :** l'information `ARRAY_POINTER_EQUIVALENCE` doit dire que
`notes[i]` et `*(notes + i)` désignent le même élément.

### Domaine 6 — Structures et mémoire dynamique

    Déclare une structure nommée Eleve.
    Ajoute un champ de type int nommé note.
    Ajoute un champ de type char nommé initiale.
    Déclare un pointeur de type structure Eleve nommé eleves.
    Inclue la bibliothèque stdlib.h.
    Affecte à eleves l'allocation de n éléments de type structure Eleve.
    Affiche la taille du type structure Eleve.
    Affecte la valeur 15 au champ note pointé par eleves.
    Affiche le champ note pointé par eleves.
    Libère la mémoire pointée par eleves.

**À observer :** le champ `nom` de 32 caractères **n'est pas écrivable**
par C-A — un tableau n'est pas un type de champ. C'est une lacune
attendue : la consigner.

### Domaine 7 — Fichiers et modularité

Dans `carnet.h` :

    Ouvre la protection d'en-tête nommée CARNET_H.
    Déclare le prototype d'une fonction nommée moyenneDe qui retourne un double et prend un int nommé total et un int nommé n.
    Déclare la variable externe de type int nommée compteur.
    Ferme la protection d'en-tête.

Dans `carnet.c` :

    Inclue l'en-tête "carnet.h".
    Déclare un fichier nommé sortie.
    Affecte à sortie l'ouverture du fichier "resultat.txt" en écriture.
    Crée un bloc si "sortie == NULL".
    Écris le texte "Moyenne" dans le fichier sortie.
    Écris la valeur de total dans le fichier sortie.
    Ferme le fichier sortie.
    Crée un bloc si la fin du fichier sortie est atteinte.

### Domaine 8 — Algorithmes et structures de données

    Déclare le synonyme Eleve pour la structure Eleve.
    Ajoute un champ pointeur de type structure Eleve nommé suivant.
    Déclare un tableau de type structure Eleve nommé promo de dimension 3.
    Déclare un entier nommé meilleure.
    Affecte la valeur 0 à meilleure.
    Crée un bloc si "promo[i].note > meilleure".
    Affecte à meilleure le résultat numérique de "promo[i].note".
    Déclare un entier nommé temporaire.
    Affecte à temporaire le résultat numérique de "notes[i]".
    Affecte à l'élément "i" de notes le résultat numérique de "notes[j]".
    Affecte à l'élément "j" de notes le résultat numérique de "temporaire".

**À observer :** aucune commande ne trie ni ne cherche. C'est voulu.

### Domaine 9 — Fiabilité et maîtrise avancée

    Inclue la bibliothèque assert.h.
    Vérifie que "n > 0".
    Déclare une constante de type int nommée MAX_NOTE avec le résultat de "20".
    Vérifie que "note <= MAX_NOTE".

**À observer :** `Vérifie que "n = 0".` doit être **refusé** avec
`ASSIGNMENT_IN_CONDITION`.

---

## 4. Blocages attendus, à confirmer ou démentir

Ces points sont **connus** et consignés dans les bilans. L'exercice doit
dire s'ils gênent réellement, et à quel point.

| Attendu | Domaine | Référence |
|---|---|---|
| Un champ de type tableau (`char nom[32];`) est impossible | 6 | lot 20 |
| `limits.h` et `float.h` sont refusés, donc pas de `INT_MAX` | 9 | lot 25, §2 |
| Aucune définition de fonction `static` | 7 | lot 23 |
| Aucune lecture de chaîne ou de caractère depuis un fichier | 7 | lot 22 |
| Aucun initialiseur `{1, 2, 3}` | 5 | lot 15 |
| Une étiquette de `case` seule avant `}` ne compile pas | 3 | lot 19 |
| `p + 1` sur un pointeur est traduit sans être signalé | 5 | lot 18 |
| Le profil entier refuse `t[0]`, `'A'`, `*p`, `p.x` | 2 | lots 15 à 20 |

---

## 5. Ce que la copie doit rendre

1. Le journal des instructions : phrase, accepté ou refusé, diagnostic.
2. Les fichiers `.c` et `.h` produits.
3. La sortie complète de `gcc -std=c17 -Wall -Wextra -pedantic`.
4. Le résultat de l'exécution, ou la raison de son absence.
5. La liste des blocages rencontrés, **y compris ceux qui ne sont pas dans
   le tableau du §4** : ceux-là sont les plus précieux.
6. Les informations pédagogiques lues dans le canal « C-A — Pédagogie »
   qui ont été utiles, et celles qui ont gêné par leur volume.

---

## 6. Critère de complétion

Le modèle 1 sera dit **complet** si :

- les neuf sections s'écrivent sans blocage **hors** du tableau du §4 ;
- le C produit compile sans erreur, et chaque avertissement est expliqué
  par l'énoncé ou par une information pédagogique ;
- aucun refus n'est incompréhensible : chaque diagnostic désigne la bonne
  partie de la phrase.

Tout écart devient une entrée de la liste des corrections, avec son
domaine et sa phrase.
