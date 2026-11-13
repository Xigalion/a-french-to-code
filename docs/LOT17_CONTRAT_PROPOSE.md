# Lot 17 — Pointeurs fondamentaux : adresses et déréférencement

**Statut : contrat rédigé à partir de l'autorisation du 13 novembre 2026,
puis exécuté.** Bilan d'exécution : `docs/LOT17_BILAN.md`.

Avant-dernier lot du domaine 5. Il installe l'adresse, le pointeur et le
déréférencement ; le lot 18 traitera la relation tableau/pointeur et la
seule arithmétique bornée du modèle 1.

---

## 1. Décisions reçues

| | Décision |
|---|---|
| **D1** | `NULL` et `stddef.h` **reportés** : aucune bibliothèque implicite, aucune instruction d'inclusion nouvelle dans ce lot |
| **D2** | Déclarateurs écrits `int *p;`, jamais `int* p;`, de façon cohérente pour tous les types |
| **D3** | Fonctions retournant un pointeur **hors périmètre** ; `functionContext.ts` n'est pas touché |
| **D4** | `&` et `*` ouverts par **capacités explicites**, profil entier préservé, aucune ouverture globale |

Contraintes reçues avec l'autorisation : un seul niveau d'indirection ;
nom et type explicites ; ni pointeurs de fonctions, ni pointeurs
multiples, ni allocation dynamique ; ne pas confondre le `&` unaire et le
`&` binaire ; ne rien inventer comme variable ou cible ; préserver la
différence entre `p`, `&variable` et `*p` ; aucune arithmétique de
pointeurs ; aucun accès aux membres ; aucune analyse des types, des
symboles ou de la mémoire.

---

## 2. Formulations et sorties exactes

### 2.1 Six enveloppes nouvelles

| Formulation française | Code C produit |
|---|---|
| `Déclare un pointeur de type int nommé p.` | `int *p;` |
| `Crée un pointeur de type int nommé p avec l'adresse de x.` | `int *p = &x;` |
| `Affecte l'adresse de x à p.` | `p = &x;` |
| `Affiche la valeur pointée par p.` | `printf("%d", *p);` |
| `Affecte la valeur 5 à la valeur pointée par p.` | `*p = 5;` |
| `Affecte à la valeur pointée par p le résultat numérique de "a + 1".` | `*p = (a + 1);` |

Les six calquent les familles déjà installées : `Déclare` n'écrit aucune
valeur et `Crée` en écrit une, comme aux lots 15 et 16 ;
`Affecte la valeur … à …` et `Affecte à … le résultat numérique de "…"`
gardent leur ordre de mots, seule la **cible** change et devient
`la valeur pointée par {nom}`.

L'écriture `int *p` suit **D2** : l'étoile est collée au nom, parce
qu'elle appartient au déclarateur et non au type. C'est visible dans le
code produit, qui est la référence.

### 2.2 Deux opérateurs unaires dans les expressions

| Formulation française | Code C produit |
|---|---|
| `Affecte à n le résultat numérique de "*p + 1".` | `n = ((*p) + 1);` |
| `Crée un bloc si "*p > 0".` | `if ((*p) > 0) { … }` |
| `Appelle lire avec "&x".` | `lire((&x));` |
| `Affecte à p le résultat numérique de "&t[0]".` | `p = (&t[0]);` |
| `Crée un bloc si "*p == 'A'".` | `if ((*p) == 'A') { … }` |

Chaque opérateur unaire est **parenthésé dans le C produit**, comme la
négation `(-a)` l'est depuis le lot 6. Ce n'est pas de la décoration :
`*p + 1` devient `((*p) + 1)` et jamais `*(p + 1)`, donc la priorité que
l'étudiant lit est celle qui s'applique.

---

## 3. Grammaire des deux opérateurs

### 3.1 `&` unaire — l'adresse

    adresse := '&' ( nom | nom '[' indice ']' )

L'opérande est une **variable nommée** ou un **élément de tableau**. Un
élément est admis parce que c'est lui qui donne au pointeur un référent
concret, ce que le découpage du domaine 5 avait retenu pour placer le lot
17 après le lot 15.

Refusés, avec `INVALID_ADDRESS_OPERAND` : `&5`, `&(a + b)`, `&'A'`, `&-x`.
Deux adresses enchaînées, `& &x`, donnent `UNSUPPORTED_INDIRECTION_LEVEL`.

`&&x` **n'est pas** deux adresses : `&&` est un seul jeton, et il garde
exactement son diagnostic d'avant ce lot — `UNSUPPORTED_EXPRESSION_OPERATOR`
dans le profil numérique, `MISSING_OPERAND` dans le profil condition, où
`&&` est le ET logique.

**Le `&` binaire n'est pas confondu avec lui.** `a & b` continue de
produire `UNSUPPORTED_EXPRESSION_OPERATOR` dans le profil numérique et
`UNSUPPORTED_CONDITION_OPERATOR` dans le profil condition, sur la même
plage qu'avant, parce que la reconnaissance du `&` unaire n'a lieu qu'en
position d'opérande. `&&` reste le ET logique du profil condition.

### 3.2 `*` unaire — le déréférencement

    déréférencement := '*' nom

L'opérande est un **pointeur nommé**, et rien d'autre. Ce n'est pas une
limite arbitraire : elle ferme d'un seul coup les deux constructions que
ce lot ne doit pas ouvrir.

- `* *p` : `UNSUPPORTED_INDIRECTION_LEVEL` — un seul niveau d'indirection.
- `*(p + 1)` : `INVALID_DEREFERENCE_OPERAND` — c'est de l'arithmétique de
  pointeurs, et elle appartient au lot 18.

`*t[0]` et `*5` sont refusés de même ; `*&x` donne
`UNSUPPORTED_INDIRECTION_LEVEL`. `*(p)` est **accepté** et rend `(*p)` :
les parenthèses ne changent pas la nature de l'opérande.

`**p` **n'est pas** deux déréférencements : `**` est un seul jeton depuis
le lot 6 et garde son diagnostic d'opérateur non pris en charge, identique
à celui de `a ** b`.

**Le `*` binaire n'est pas confondu avec lui.** `a * b` reste un produit :
le produit consomme son opérateur avant d'analyser l'opérande droit.
`a * *b` devient `(a * (*b))`, là où le lot 16 répondait `MISSING_OPERAND` ;
c'est une extension assumée, documentée au §7.

---

## 4. Capacités du noyau

Deux champs nouveaux :

| Profil | `addressOf` | `dereference` |
|---|---|---|
| `INTEGER_CAPABILITIES` (lot 6) | **false** | **false** |
| `NUMERIC_CAPABILITIES` (lot 7) | **true** | **true** |
| `CONDITION_CAPABILITIES` (lots 9-10) | **true** | **true** |
| `INDEX_CAPABILITIES` (lot 15) | **false** | **false** |

Conformément à **D4**, le profil entier du lot 6 reste scellé, comme aux
lots 15 et 16 : `&a` et `* a` y gardent exactement leurs diagnostics
historiques. Le profil d'indice reste fermé lui aussi, donc `t[*p]` et
`t[&x]` sont refusés — un indice reste une expression entière.

Les quatre enregistrements restent verrouillés par égalité stricte.

---

## 5. Diagnostics

| Cas | Code | Message |
|---|---|---|
| `&5`, `&(a + b)` | `INVALID_ADDRESS_OPERAND` | « L'adresse ne peut être prise que d'une variable ou d'un élément de tableau. » |
| `*5`, `*(p + 1)`, `*t[0]` | `INVALID_DEREFERENCE_OPERAND` | « Le déréférencement porte sur un pointeur nommé, et sur rien d'autre. » |
| `**p`, `&&x` hors condition | `UNSUPPORTED_INDIRECTION_LEVEL` | « Un seul niveau d'indirection est pris en charge. » |
| `int **p` par enveloppe | `UNSUPPORTED_INDIRECTION_LEVEL` | idem |

Réutilisés tels quels : `MISSING_NUMERIC_TYPE`, `UNSUPPORTED_NUMERIC_TYPE`,
`INVALID_IDENTIFIER`, `C_KEYWORD_IDENTIFIER`, `INVALID_INTEGER`,
`MISSING_EXPRESSION*`, `UNEXPECTED_TEXT`, `INCOMPLETE_INSTRUCTION`,
`UNKNOWN_FORMULATION`, ainsi que les codes d'opérateur historiques pour
`a & b`.

Plages UTF-16 semi-ouvertes absolues dans la phrase d'origine.

---

## 6. Informations pédagogiques passives

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `ADDRESS_OF` | `&` écrit, en enveloppe ou en expression | une adresse est l'emplacement d'un objet en mémoire, pas sa valeur |
| `POINTER_VS_OBJECT` | déclaration de pointeur | `p` et `*p` sont deux choses distinctes : le pointeur et l'objet pointé |
| `DEREFERENCE_MEANING` | `*` écrit, en enveloppe ou en expression | `*p` désigne l'objet dont `p` contient l'adresse, en lecture comme en écriture |
| `UNINITIALIZED_POINTER` | déclaration **sans** adresse | un pointeur non initialisé contient une valeur indéterminée ; le déréférencer a un comportement indéfini |
| `ADDRESS_NOT_CHECKED` | tout déréférencement | C-A ne vérifie ni que le pointeur a reçu une adresse, ni qu'elle est encore valide |

Aucune n'incrémente le compteur d'avertissements. Aucune ne prétend
analyser un type, un symbole ou la mémoire.

---

## 7. Limites explicites, et ce que ce lot ne peut pas refuser

- Un seul niveau d'indirection.
- Ni pointeurs de fonctions, ni tableaux de pointeurs, ni pointeurs vers
  tableau, ni `void *`, ni `const`.
- Ni allocation dynamique, ni `NULL`, ni `stddef.h` (**D1**).
- Aucune fonction ne retourne un pointeur (**D3**) ; aucun paramètre de
  type pointeur.
- Aucune arithmétique de pointeurs, et aucune comparaison de pointeurs.
- Le profil entier et le profil d'indice restent fermés aux deux
  opérateurs.

**Ce que C-A ne peut pas refuser, et qu'il ne faut pas prétendre
refuser.** C-A ne résout aucun symbole : il ignore si `p` est un pointeur.
`Affecte à p le résultat numérique de "p + 1".` produit donc `p = (p + 1);`,
qui est de l'arithmétique de pointeurs si `p` en est un. La garantie de ce
lot est qu'**aucune de ses formulations** ne produit d'arithmétique de
pointeurs, et que toute arithmétique écrite **sous** un déréférencement
est refusée. C'est une garantie syntaxique, pas sémantique, et le bilan le
dit en ces termes.

De même, `Affiche la valeur pointée par p.` produit `printf("%d", *p);`
sans vérifier que `p` pointe vers un `int` — exactement comme
`Affiche la valeur de x.` ne vérifie pas le type de `x` depuis le lot 3.

### Extensions assumées sur les profils ouverts

| Entrée | Avant le lot 17 | Après |
|---|---|---|
| `&a` | `UNSUPPORTED_EXPRESSION_OPERATOR` / `UNSUPPORTED_CONDITION_OPERATOR` | accepté |
| `* a` | `MISSING_OPERAND` | accepté |
| `a * * b` | `MISSING_OPERAND` | `(a * (*b))` |
| `a & b` | inchangé | inchangé |

---

## 8. Plan de tests

Sorties exactes des six enveloppes, avec et sans point final ; les cinq
types de pointeur et les types refusés ; `int **p` refusé ; prise
d'adresse d'une variable et d'un élément ; déréférencement en lecture, en
écriture et en expression ; priorité `*p + 1` contre `*(p + 1)` ;
distinction `p`, `&x`, `*p` dans trois sorties différentes ; `a & b` et
`a * b` inchangés ; `&` et `*` refusés dans les profils entier et indice ;
arithmétique sous déréférencement refusée ; `**p`, `&&x`, `&*p`, `*&x`
refusés avec plages UTF-16 ; les cinq informations et leur absence
ailleurs ; verrouillage des quatre enregistrements de capacités ;
intégration avec boucle, condition, appel, tableau et chaîne ; placement
et séquence complète avec document final exact ; non-régression des lots 1
à 16 ; refus maintenu des constructions du lot 18 et des domaines
ultérieurs.
