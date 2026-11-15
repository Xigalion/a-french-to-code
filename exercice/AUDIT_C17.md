# Audit manuel du C produit — et ce que cet audit NE vaut pas

> **Aucun compilateur n'a été exécuté.** Il n'existe dans cet environnement
> ni `gcc`, ni `clang`, ni `cl.exe`, et WSL n'est pas installé — vérifié.
> Ce document est une **relecture humaine** du C produit, à la lumière de
> C17. Ce n'est **pas** une preuve de compilation, et il ne doit pas être
> lu comme telle. Les prédictions ci-dessous sont à confirmer par
> `exercice/compiler.cmd`.

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

**C'est une prédiction, pas un résultat.**

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
