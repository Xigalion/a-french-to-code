
# Retouches manuelles — ce que C-A n'a pas écrit

> **Document de la campagne 1, conservé tel quel.** La retouche décrite
> plus bas — `char nom[32];` — n’est **plus nécessaire** : le lot 27 la
> rend écrivable par C-A. La campagne 2 ne comporte **aucune** retouche
> manuelle, et `exercice/retoucher.mjs` est sans objet pour elle. Ce
> fichier reste parce que la campagne 1 doit rester lisible telle qu’elle
> s’est déroulée. Voir `docs/CAMPAGNE2_VALIDATION.md` §3.

`exercice/ca/` est le résultat **brut** de C-A. `exercice/corrige/` est la
version qui doit compiler et s'exécuter. Ce document dit **exactement** ce
qui les sépare, et par quel moyen.

## 1. Corrections faites PAR C-A, en changeant la phrase

Trois défauts de la version brute venaient de **mon scénario**, pas de
C-A, et dans les trois cas **C-A avait prévenu**. Ils sont corrigés en
écrivant d'autres phrases, donc toujours par C-A.

| Défaut de la version brute | Phrase ajoutée ou retirée | L'information qui le disait |
|---|---|---|
| `int compteur;` **défini deux fois** (`calcul.c` et `carnet.c`) → symbole dupliqué à l'édition de liens | retrait de `Déclare une variable de type int nommée compteur.` dans `carnet.c` | `EXTERNAL_LINKAGE` : « il faut exactement une définition dans un seul fichier du projet » |
| `notes[1]` **lu sans avoir été écrit** → valeur indéterminée | ajout de `Affecte la valeur 17 à l'élément "1" de notes.` | aucune — C-A ne suit aucune donnée ; c'est une limite, pas un oubli |
| `fopen` **non testé** avant `fprintf` | ajout de `Crée un bloc si "sortie == NULL".`, `Libère la mémoire pointée par eleves.`, `Retourne la valeur 1.` | `FOPEN_CAN_FAIL` : « C-A n'ajoute aucun test : écrire … revient à l'étudiant » |

Ces trois corrections sont donc **dans le scénario corrigé**
(`FILES_CORRIGE` de `exercice/scenario.mjs`), et le C qui en résulte est
produit par le moteur.

## 2. La seule retouche écrite à la main

Une seule ligne de C a été écrite à la main, dans
`exercice/corrige/carnet.h` :

```c
    /* RETOUCHE MANUELLE — C-A refuse « Ajoute un champ de type char nommé nom
       de dimension 32. » avec UNEXPECTED_TEXT. Voir exercice/retouches.md. */
    char nom[32];
```

**Pourquoi la main.** `Ajoute un champ …` n'accepte ni dimension, ni type
tableau. Vérifié :

    Ajoute un champ de type char nommé nom de dimension 32.   → UNEXPECTED_TEXT
    Ajoute un tableau de type char nommé nom de dimension 32. → UNKNOWN_FORMULATION

**Pourquoi c'est nécessaire.** L'énoncé demande un `nom` de 32 caractères.
Sans lui, la structure `Eleve` n'a pas de nom, et le programme perd son
objet. Le contournement n'est donc pas cosmétique.

**Ce que cela coûte.** Dans la version corrigée, `struct Eleve` n'est plus
entièrement traçable à une phrase française : une de ses lignes vient de
moi. C'est exactement la situation que la décision 3 du fondateur demande
de supprimer, et c'est la correction la plus prioritaire.

## 3. Gestes d'éditeur qui ne sont pas du C écrit à la main

Le journal compte séparément **6 gestes d'éditeur** dans la version
corrigée : la création d'une ligne blanche à une indentation donnée.

Ce n'est pas écrire du C — c'est appuyer sur Entrée. Mais il faut le
compter, parce qu'il révèle une contrainte réelle du parcours : **un bloc
consomme la ligne blanche sur laquelle il est posé**, et sa ligne blanche
de corps est à l'intérieur. Pour revenir au niveau englobant après avoir
fermé un bloc, il n'existe **aucune** ligne blanche où poser le curseur :
l'utilisateur doit en créer une.

Dans l'éditeur, c'est naturel et invisible. Dans un parcours automatisé,
c'est une étape qui n'est pas de C-A, et elle est consignée comme telle.
