# C-A — parcours de découverte (première séance, ~45 minutes)

**Pour qui :** un étudiant débutant qui n'a jamais utilisé C-A, accompagné
d'un encadrant. À lire dans l'ordre, sans sauter les étapes « Essaie ».

> Les phrases de ce document ont toutes été **passées au moteur** : la
> colonne « code produit » est ce que C-A écrit réellement, pas une
> prévision. Le test `test/testUtilisateur.test.mjs` le revérifie à chaque
> `npm test`.

Légende des tableaux :

| marque | sens |
|---|---|
| ✓ | phrase **acceptée**, le code C produit est donné |
| ✗ | phrase **refusée à la traduction**, le code du refus est donné |
| ⊘ | phrase comprise mais **refusée à cet endroit** du fichier |

---

## 1. Ce que fait C-A, en une page

Tu écris une phrase en français. C-A la traduit en **une** instruction C17,
te montre le résultat, et **attend ta confirmation** avant d'écrire quoi que
ce soit dans ton fichier.

Au-dessus de chaque instruction insérée, C-A écrit ta phrase **exactement
comme tu l'as tapée**, en commentaire. C'est la trace : tu peux toujours
relire pourquoi cette ligne est là.

Trois choses que C-A **ne fait pas**, et qu'il ne fera pas :

1. Il **n'invente rien**. Pas de `main`, pas de `return`, pas d'`#include`
   que tu n'as pas demandés.
2. Il **ne corrige pas**. Si ta phrase ne va pas, il explique ce qui manque ;
   il ne te donne pas la bonne phrase à recopier. C'est à toi de la trouver.
3. Il **ne vérifie pas ton programme**. Une insertion acceptée ne veut pas
   dire que ton programme est juste, ni même qu'il compile.

## 2. Le geste de base

1. Ouvre un fichier `.c` enregistré (par exemple `bonjour.c`).
2. Place le curseur sur une **ligne blanche**.
3. `Ctrl+K` puis `A` (ou `Ctrl+Maj+P` → « C-A : Saisir une instruction »).
4. Tape ta phrase, `Entrée`.
5. Un **aperçu** s'ouvre : à gauche ton fichier, à droite ce qu'il
   deviendrait. **Rien n'est encore écrit.**
6. Choisis **Insérer**, ou **Modifier la phrase**, ou **Annuler**.

L'insertion est **une seule modification annulable** : un `Ctrl+Z` la
retire entièrement.

## 3. Ton premier programme

Six phrases, dans cet ordre. Après chacune, **lis l'aperçu avant de
confirmer**.

| marque | phrase à saisir | code produit |
|---|---|---|
| ✓ | `Inclue la bibliothèque stdio.h.` | `#include <stdio.h>` |
| ✓ | `Crée la fonction principale.` | `int main(void) { ⏎ ⏎ }` |
| ✓ | `Crée un entier nommé age de valeur 20.` | `int age = 20;` |
| ✓ | `Affiche la valeur de age.` | `printf("%d", age);` |
| ✓ | `Affiche un retour à la ligne.` | `printf("\n");` |
| ✓ | `Retourne la valeur 0.` | `return 0;` |

Le bloc `main` est créé **vide**, et ton curseur est placé **à
l'intérieur** : les quatre dernières phrases s'écrivent donc dans le corps
de la fonction.

Ton fichier doit maintenant ressembler à ceci — chaque ligne précédée de ta
phrase :

    // Inclue la bibliothèque stdio.h.
    #include <stdio.h>

    // Crée la fonction principale.
    int main(void) {
        // Crée un entier nommé age de valeur 20.
        int age = 20;
        // Affiche la valeur de age.
        printf("%d", age);
        // Affiche un retour à la ligne.
        printf("\n");
        // Retourne la valeur 0.
        return 0;
    }

Si tu as un compilateur, compile-le :

    gcc -std=c17 -Wall -Wextra -pedantic bonjour.c -o bonjour
    .\bonjour

Attendu : `20`, puis un retour à la ligne.

## 4. Essaie : les quatre expériences qui apprennent le plus

Ces quatre essais sont **volontaires**. Ce ne sont pas des erreurs de ta
part : ils montrent où sont les limites de C-A, et ces limites sont le
cœur de l'outil.

### Expérience 1 — une phrase hors catalogue

| marque | phrase à saisir | refus |
|---|---|---|
| ✗ | `Crée un entier age = 20.` | `UNKNOWN_FORMULATION` |

C-A dit que la formulation n'appartient pas au catalogue. Il **ne te donne
pas** la bonne phrase. Retrouve-la : elle est dans le tableau du §3.

### Expérience 2 — un mot à la place d'un nombre

| marque | phrase à saisir | refus |
|---|---|---|
| ✗ | `Crée un entier nommé age de valeur vingt.` | `INVALID_INTEGER` |

Le refus **pointe le mot fautif**. Un entier s'écrit en chiffres.

### Expérience 3 — une instruction au mauvais endroit

Place le curseur **avant** `int main`, hors de toute fonction, et saisis :

| marque | phrase à saisir | refus de placement |
|---|---|---|
| ⊘ | `Affiche la valeur de age.` | `STATEMENT_AT_FILE_SCOPE` |

C-A a **compris** la phrase, mais il refuse de l'écrire là : en C17, une
instruction exécutable n'existe que dans le corps d'une fonction. Il ne la
déplace pas pour toi — il te dit pourquoi.

### Expérience 4 — ce que C-A laisse passer

| marque | phrase à saisir | code produit |
|---|---|---|
| ✓ | `Affecte la valeur 5 à inexistant.` | `inexistant = 5;` |

**Accepté, sans un mot** — alors qu'aucune variable `inexistant` n'existe.
C-A ne vérifie pas les noms. Le compilateur, lui, refusera. Retire cette
ligne (`Ctrl+Z`) et retiens la leçon : **C-A accepté ≠ programme correct**.

## 5. Les informations pédagogiques

Ouvre **Affichage → Sortie**, puis choisis le canal **« C-A — Pédagogie »**.

C-A y écrit des informations **passives** : ni erreurs, ni avertissements.
Elles expliquent une notion C que la phrase vient de toucher. Par exemple,
après `Affiche la valeur de age.`, C-A signale que **l'affichage n'ajoute
aucun séparateur** : deux affichages de suite collent leurs sorties.

Lis-les. Elles ne t'obligent à rien, et elles ne disparaissent pas.

## 6. Ce qu'on te demande de signaler

Pendant toute la séance, dès que **l'une** de ces quatre choses arrive,
remplis une ligne de `docs/TEST_FICHE_REMONTEE.md` :

1. tu ne trouves pas la phrase à écrire ;
2. un refus que tu ne comprends pas ;
3. un code C produit qui te surprend ;
4. un message que tu trouves faux, flou ou inutile.

Il n'y a **pas** de mauvaise remontée. Une phrase qu'on ne devine pas est
un défaut de l'outil, pas du lecteur.

## 7. Après cette séance

Les exercices progressifs : `docs/TEST_EXERCICES_PALIER1.md`. Ils reprennent
ce parcours et ajoutent, un domaine à la fois, les conditions, les boucles,
les fonctions, les tableaux, les pointeurs, les structures et les fichiers.

Le catalogue complet est dans `docs/CATALOGUE.md`. **Tout ce qui n'y figure
pas est refusé** : ce n'est pas un manque de chance, c'est le périmètre.
