# Lot 15 — Tableaux, dimensions explicites et indexation

**Statut : contrat rédigé à partir de l'autorisation du 13 novembre 2026,
puis exécuté.** Le découpage du domaine 5 (`docs/DOMAINE5_CONTRAT_PROPOSE.md`)
annonçait que le contrat du lot 15 serait rédigé après la revue du lot 14 ;
l'autorisation reçue en tient lieu et fixe cinq décisions pédagogiques. Ce
document les transcrit en formulations, sorties, diagnostics et limites
exactes, et isole au §9 les choix que j'ai pris moi-même, soumis à revue.

Bilan d'exécution : `docs/LOT15_BILAN.md`.

---

## 1. Décisions reçues

1. Les littéraux caractères dans les expressions sont **reportés au lot 16**.
2. Les tableaux de `char`, comme `char t[10];`, **appartiennent au lot 15**.
3. Un tableau de `char` **ne doit pas être présenté automatiquement** comme
   une chaîne C.
4. Les tableaux C **ne peuvent pas être affectés globalement** avec `=` après
   déclaration.
5. Les affectations d'éléments individuels **sont autorisées** dans ce lot.

Contraintes reçues avec l'autorisation : dimension explicite et valide ;
aucune taille, valeur ou initialisation inventée ; pas de tableaux
multidimensionnels ; syntaxe C17 ; distinction tableau / élément préservée ;
aucune arithmétique de pointeurs ; extension du noyau du lot 13 **uniquement
dans les contextes prévus**, sans activation globale de `[` et `]` par effet
de bord ; information passive `INDEX_NOT_CHECKED` ; déclaration puis
affectations explicites, sans listes `{…}` ; aucune résolution générale de
symboles, de types ou de tailles.

---

## 2. Formulations et sorties exactes

| Formulation française | Code C produit |
|---|---|
| `Déclare un tableau de type int nommé t de dimension 10.` | `int t[10];` |
| `Affecte la valeur 5 à l'élément "0" de t.` | `t[0] = 5;` |
| `Affecte le caractère 'A' à l'élément "0" de t.` | `t[0] = 'A';` |
| `Affecte à l'élément "i" de t le résultat numérique de "a + 1".` | `t[i] = (a + 1);` |
| `Affiche l'élément "0" de t.` | `printf("%d", t[0]);` |

Les quatre formulations d'élément calquent la famille scalaire historique
(`Affecte la valeur … à`, `Affecte le caractère … à`, `Affecte à … le
résultat numérique de`, `Affiche la valeur de`) : seule la **cible** change,
`{nom}` devient `l'élément "{indice}" de {nom}`.

L'indice est entre **guillemets ASCII**, comme toute expression du catalogue,
y compris lorsqu'il est une constante. Les deux apostrophes `'` et `’` de
`l'élément` sont acceptées, comme partout ailleurs.

### Indexation dans les expressions

`t[i]` devient par ailleurs un **terme d'expression** dans les profils
numérique et condition, sans aucune enveloppe nouvelle :

| Formulation française | Code C produit |
|---|---|
| `Affecte à somme le résultat numérique de "somme + t[i]".` | `somme = (somme + t[i]);` |
| `Crée un bloc si "t[i] > 0".` | `if (t[i] > 0) { … }` |
| `Retourne le résultat numérique de "t[0]".` | `return t[0];` |
| `Appelle traiter avec "t[i]".` | `traiter(t[i]);` |

---

## 3. Grammaire de l'indexation

Une indexation s'attache **au seul nœud nom**, jamais à une parenthèse, à un
littéral ou à un appel :

    indexation := nom '[' expression-d-indice ']'

- `t[i]`, `t[i + 1]`, `t[2 * i]`, `t[u[i]]` : acceptés.
- `t[i][j]` : **refusé**, `UNSUPPORTED_ARRAY_DIMENSIONS`.
- `1[t]`, `(a + b)[0]` : refusés par le diagnostic historique
  `INVALID_EXPRESSION_TOKEN`, inchangé.

### L'indice est une expression entière

Quel que soit le profil englobant, le contenu entre crochets est analysé avec
un jeu de capacités **entier** : noms, entiers décimaux, `+ - * / %`,
parenthèses, négation, et indexation imbriquée. Ni littéral flottant, ni
conversion, ni comparaison, ni opérateur logique.

C'est une exigence de C17, pas une restriction de confort : l'indice d'un
tableau doit avoir un type entier. `t[1.5]` et `t[(int) x]` sont refusés.

---

## 4. Capacités du noyau — extension approuvée et bornée

Le noyau du lot 13 reçoit deux champs de capacité nouveaux :

| Capacité | Rôle |
|---|---|
| `indexing` | le profil accepte `nom[…]` |
| `literalKind` | nom du nœud produit pour un littéral, `integer` ou `literal` |

Répartition, verrouillée par un test d'égalité stricte sur les quatre
enregistrements :

| Profil | `indexing` | Effet |
|---|---|---|
| `INTEGER_CAPABILITIES` (lot 6) | **false** | `a[0]` reste `INVALID_EXPRESSION_TOKEN`, inchangé |
| `NUMERIC_CAPABILITIES` (lot 7) | **true** | extension approuvée |
| `CONDITION_CAPABILITIES` (lots 9-10) | **true** | extension approuvée |
| `INDEX_CAPABILITIES` (lot 15) | true | jeu interne de l'indice, jamais publié comme profil |

**Le profil entier historique n'est pas touché.** `Affecte à x le résultat de
"t[0]".` et `Retourne le résultat de "t[0]".` restent refusés : ce sont les
deux seules enveloppes qui l'utilisent, et la forme « résultat numérique »
couvre le même besoin. Voir la question Q1 du §9.

`literalKind` existe parce que le profil de l'indice emprunte la **grammaire**
entière tout en produisant les nœuds du tableau englobant : sans ce champ, un
indice constant produirait un nœud `integer` à l'intérieur d'un arbre
numérique, que le rendu numérique ne sait pas écrire.

---

## 5. Diagnostics

| Cas | Code | Message |
|---|---|---|
| `t[]` | `MISSING_INDEX` | « Il manque l'indice de l'élément. » |
| `t[0` | `MISSING_CLOSING_BRACKET` | « Il manque le crochet fermant de l'indice. » |
| `t[i][j]` | `UNSUPPORTED_ARRAY_DIMENSIONS` | « Les tableaux à plusieurs dimensions ne sont pas pris en charge. » |
| dimension absente | `MISSING_ARRAY_DIMENSION` | « Il manque la dimension du tableau. » |
| `de dimension 0`, `-3`, `n`, `3.5` | `INVALID_ARRAY_DIMENSION` | « Une dimension entière strictement positive, écrite en chiffres, est attendue. » |

Les codes de type (`MISSING_NUMERIC_TYPE`, `UNSUPPORTED_NUMERIC_TYPE`), de
nom (`INVALID_IDENTIFIER`, `C_KEYWORD_IDENTIFIER`), d'expression et de texte
supplémentaire (`UNEXPECTED_TEXT`) sont réutilisés tels quels. Toutes les
plages sont des intervalles UTF-16 semi-ouverts absolus dans la phrase
d'origine, sans normalisation.

---

## 6. Informations pédagogiques passives

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `INDEX_NOT_CHECKED` | toute indexation, en enveloppe ou en expression | aucune borne n'est vérifiée, aucun dépassement n'est ni détecté ni exclu |
| `ARRAY_NOT_ASSIGNABLE` | déclaration de tableau | décision 4 : `t = …` n'existe pas en C17 pour un tableau |
| `CHAR_ARRAY_NOT_STRING` | déclaration d'un tableau de `char` | décision 3 : ce n'est une chaîne que si un caractère nul la termine, et aucun n'est écrit ici |

Aucune n'incrémente le compteur d'avertissements. Aucune ne prétend avoir
analysé la dimension, la valeur d'un indice ou le contenu du tableau.

`INDEX_NOT_CHECKED` est produite par un **balayage structurel** des paramètres
de l'instruction, et non par un aiguillage par intention : une enveloppe
future qui accueillera une expression ne perdra pas l'information en silence.

---

## 7. Types et dimensions

Types de tableau acceptés : `int`, `unsigned int`, `float`, `double`, `char`
— exactement les types déjà pris en charge. `void`, `long`, `short`,
`unsigned char`, `signed char` restent refusés.

La dimension est un **entier décimal littéral strictement positif**, écrit en
chiffres. Ni expression, ni nom de constante, ni zéro, ni signe. C-A ne
retient aucune dimension et ne s'en sert jamais pour vérifier un indice.

---

## 8. Limites explicites du lot

- Aucune liste d'initialisation `{…}` : déclaration puis affectations
  explicites, conformément à D6 et à la décision 5.
- Aucune affectation globale de tableau : aucune enveloppe ne la produit.
- Aucun tableau multidimensionnel.
- Aucun littéral caractère dans une expression : report au lot 16, décision 1.
- Aucune adresse, aucun déréférencement, aucune arithmétique de pointeurs.
- Aucune vérification de bornes, d'existence, de type ou de dimension.
- Aucun affichage `%c` d'un élément : il viendra avec le lot 16.
- Le profil entier historique n'accepte pas l'indexation.

---

## 9. Choix pris sur l'autorisation — soumis à revue

**Q1 — Le profil entier reste fermé à l'indexation.** L'autorisation interdit
d'ouvrir `[` et `]` « globalement dans toutes les expressions par simple effet
de bord ». J'ai donc ouvert les deux profils qui en ont un besoin pédagogique
démontré (parcours, condition d'arrêt, accumulation, argument) et laissé
scellé celui du lot 6. La conséquence visible est une asymétrie :
`le résultat numérique de "t[0]"` fonctionne, `le résultat de "t[0]"` non.
C'est la même asymétrie que `(char) 65` a introduite au lot 14. Si elle est
jugée gênante, l'ouvrir est un changement d'une ligne de capacité, plus les
tests historiques correspondants.

**Q2 — `t[u[i]]` est accepté.** L'indexation imbriquée tombe de la récursion
naturelle de la grammaire ; ce n'est pas un tableau à deux dimensions et le
refuser demanderait une machinerie supplémentaire. Bornée par le budget de
jetons et la profondeur.

**Q3 — Deux informations au-delà de `INDEX_NOT_CHECKED`.** Les décisions 3 et
4 énoncent deux faits que l'étudiant ne peut pas deviner du code produit ;
`ARRAY_NOT_ASSIGNABLE` et `CHAR_ARRAY_NOT_STRING` les disent au moment de la
déclaration, passivement.

**Q4 — L'indice est entre guillemets même lorsqu'il est une constante.**
`l'élément "0" de t` plutôt que `l'élément 0 de t` : une seule règle, et la
même que partout ailleurs pour une expression.

---

## 10. Plan de tests

Déclarations valides pour les cinq types, avec et sans point final ; types
refusés ; dimension absente, nulle, négative, non numérique, à zéro initial ;
les cinq formulations avec leur sortie exacte ; indexation en expression dans
les deux profils ouverts et son refus dans le profil entier ; indice entier
exigé ; `t[i][j]` refusé ; `t[]`, `t[0` refusés avec plages UTF-16 ; les trois
informations et leur absence ailleurs ; verrouillage des quatre
enregistrements de capacités ; budget partagé et profondeur ; placement des
cinq formulations ; séquence déclaration → boucle → affectation → affichage
avec document final exact ; non-régression des lots 1 à 14 ; refus maintenu
des constructions des lots 16 à 18 (`'A'` en expression, `&a`, `*p`, `p->x`,
`"texte"`, listes `{…}`).
