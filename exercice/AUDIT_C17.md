# Audit manuel du C produit — et ce que cet audit NE vaut pas

> **Audit écrit avant toute compilation, puis confronté à GCC le 15
> novembre 2026.** Ce document était une **relecture humaine** du C produit
> à la lumière de C17, faite quand aucun compilateur n'existait dans cet
> environnement. Un compilateur a depuis été installé (WinLibs GCC 16.2.0),
> et le §4 confronte chaque prédiction au résultat réel. Le texte des
> prédictions est **laissé tel qu'il était écrit** — y compris là où il se
> trompe — parce qu'un audit réécrit après coup ne prouve rien.
>
> Résultat global : **les prédictions de compilation sont exactes**, et la
> prédiction de sortie contient **une erreur**, relevée au §4.3.

---

## 1. Ce qui est produit

| Fichier | Lignes | Instructions C-A |
|---|---|---|
| `corrige/carnet.h` | 32 | 11 phrases + 1 retouche manuelle |
| `corrige/calcul.c` | 35 | 12 phrases |
| `corrige/carnet.c` | 172 | 75 phrases |

98 instructions insérées, 0 refus, 6 gestes d'éditeur.

---

## 2. Prédictions pour la version corrigée

### Ce qui devrait compiler sans rien dire

- La garde d'en-tête, la structure, le `typedef`, les trois prototypes et
  le `extern` : formes C17 ordinaires.
- `char titre[7] = "Carnet";` — « Carnet » fait 6 caractères, plus le nul,
  donc 7. La dimension est juste, et c'était la leçon du lot 16.
- `int main(void)` avec `return 0;` et `return 1;`.
- Les déclarations mêlées aux instructions : autorisées depuis C99.
- `printf("%zu", sizeof(struct Eleve));` — `%zu` est le spécificateur de
  `size_t`, correct en C17.
- `eleves->note` après la garde `if (eleves == NULL) return 1;`.
- `premiere = (*(notes + 0));` — équivalent à `notes[0]`.

### L'avertissement attendu, et voulu

    calcul.c : dans « dangereuse » — division par zéro [-Wdiv-by-zero]

`dangereuse` existe pour exercer l'avertissement de calcul du lot 8, qui
**s'est bien déclenché** côté C-A :
`INTEGER_ZERO_DIVISOR / certain-error`. La fonction n'est jamais appelée,
donc le comportement indéfini n'est pas atteint à l'exécution ; mais le
compilateur doit le dire, et c'est le but.

### Ce dont je ne suis pas sûr

- `assert(eleves != NULL);` placé **après** `if (eleves == NULL) return 1;`
  est redondant. Certains compilateurs ne diront rien ; d'autres pourraient
  émettre une remarque d'analyse. À constater.
- `-Wextra` pourrait signaler quelque chose que je n'ai pas vu. C'est
  précisément pourquoi l'audit ne remplace pas la compilation.
- La valeur de `sizeof(struct Eleve)` est **définie par l'implémentation** :
  avec `int`, `char`, `char[32]` et un pointeur, on peut attendre 48 sur
  x86-64, mais C-A a raison de ne pas la prédire et je ne la prédis pas non
  plus.

### Sortie attendue à l'exécution

Les `printf` n'ont aucun saut de ligne — C-A n'en ajoute pas, et aucune
phrase n'en demande. La sortie devrait donc être **une seule ligne** :

    Carnet de notesCarnetCarnet3122?1513.67a revoir17

où `?` est `sizeof(struct Eleve)`, et où « Carnet » apparaît deux fois :
une fois par `%s`, une fois caractère par caractère par le parcours. Le
fichier `resultat.txt` devrait contenir `Meilleure note17`.

**C'est une prédiction, pas un résultat.** Voir le §4.3 : elle est
partiellement fausse.

---

## 3. La version brute, et son défaut

`exercice/ca/` devrait **échouer à l'édition de liens** :

    carnet.o : définition multiple de « compteur » ; calcul.o : défini ici

Parce que `int compteur;` est défini dans les deux unités de traduction.
C'est une faute de mon scénario, et `EXTERNAL_LINKAGE` l'avait annoncée
mot pour mot : « il faut exactement une définition dans un seul fichier du
projet. C-A ne la cherche pas. »

Le conserver tel quel a une valeur : il montre qu'une **information
passive juste** ne suffit pas si personne ne la lit, et que C-A ne protège
de rien.

---

## 4. Ce que cet audit a trouvé et que les 3 580 tests n'avaient pas vu

1. **C-A accepte des instructions à la portée fichier.** Une affectation,
   un `printf`, un `if`, une boucle, une assertion, un `free` posés après
   la dernière accolade sont **placés sans un mot**, et le C obtenu ne
   compile pas. Seuls `return`, `break`/`continue`, les étiquettes de `case`
   et les champs de structure ont leur contexte vérifié. Mesuré sur treize
   sondes dans `docs/EVALUATION_MODELE1.md`.

2. **Sortir d'un bloc demande un geste hors C-A.** Un bloc consomme la
   ligne blanche où il est posé ; sa ligne de corps est à l'intérieur. Il
   n'existe donc aucune ligne blanche au niveau englobant, et l'utilisateur
   doit en créer une. Six fois dans cet exercice.

3. **Un champ de structure ne peut pas être un tableau**, ce qui était déjà
   connu, mais l'exercice montre que le blocage est **structurant** et non
   marginal : sans lui, `struct Eleve` n'a pas de nom.

---

## 4. Confrontation à GCC — ce que l'audit a vu juste, et ce qu'il a raté

Preuves : `exercice/journal/compilation.txt`. Compilateur gcc 16.2.0
(MinGW-W64 UCRT), options `-std=c17 -Wall -Wextra -pedantic`.

### 4.1 Les prédictions de compilation : exactes

| Prédiction du §2 | Résultat réel |
|---|---|
| la version corrigée compile | **oui**, code de sortie 0 |
| un seul avertissement, `-Wdiv-by-zero` sur `total / 0` | **oui**, exactement un, à `calcul.c:33:19` |
| aucun autre diagnostic sous `-Wall -Wextra -pedantic` | **oui**, aucun |
| la version brute échoue à l'édition de liens sur `compteur` | **oui**, `multiple definition of 'compteur'` |
| `resultat.txt` contient `Meilleure note17` | **oui**, au mot |

Les deux points « dont je ne suis pas sûr » sont tranchés : l'`assert`
redondant après la garde `NULL` **ne produit aucune remarque**, et
`-Wextra` n'a rien signalé que l'audit n'avait pas vu.

Deux vérifications que l'audit n'avait pas prévues ont été faites en plus :
la **compilation séparée** en `.o` suivie de l'édition de liens fonctionne
et donne la même sortie, et la **garde d'en-tête** tient sous double
inclusion de `carnet.h`.

### 4.2 `sizeof(struct Eleve)` = 48

L'audit a **refusé de prédire** cette valeur, au motif qu'elle est définie
par l'implémentation, en notant seulement qu'« on peut attendre 48 sur
x86-64 ». La valeur réelle est **48**. Ce n'est donc pas une prédiction
confirmée : c'est une abstention correcte, et l'ordre de grandeur annoncé
se trouve être le bon. La distinction compte, et C-A a raison de ne jamais
afficher cette valeur lui-même.

### 4.3 L'erreur de l'audit : la ligne de sortie

L'audit annonçait :

    Carnet de notesCarnetCarnet3122?1513.67a revoir17

La sortie réelle est :

    Carnet de notesCarnetCarnet312481513.67a revoir17

En remplaçant `?` par 48, la prédiction aurait dû donner
`…Carnet312<48>1513.67…` ; elle porte **un chiffre `2` de trop** avant le
marqueur. Chaque valeur attendue est au bon endroit — `*p` = 3,
`premiere` = 12, puis `sizeof`, `eleves->note` = 15, `moyenne` = 13.67, la
branche `a revoir`, `meilleure` = 17 — mais la chaîne écrite à la main
comporte une valeur parasite, et une relecture humaine d'une concaténation
de onze `printf` sans séparateur est exactement le genre d'exercice où
l'œil se trompe.

**Ce que cela enseigne.** La prédiction structurelle (ce qui compile, ce qui
avertit, ce qui échoue) a tenu ; la prédiction caractère par caractère n'a
pas tenu. C'est aussi l'argument le plus concret en faveur de la correction
de rang 4 du rapport d'évaluation : des affichages sans aucun séparateur
sont illisibles, pour la machine comme pour l'humain.
