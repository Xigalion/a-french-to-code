# Lot 18 — Relation tableaux/pointeurs

**Statut : contrat rédigé à partir de l'autorisation du 13 novembre 2026,
puis exécuté.** Bilan : `docs/LOT18_BILAN.md`. Dernier lot du domaine 5.

---

## 1. Décisions reçues

1. `p - q` et `ptrdiff_t` **reportés**.
2. `*(nom + expression entière)` autorisé dans un **cadre syntaxique strict**.
3. Enseigner explicitement la relation entre `t[i]` et `*(t + i)`.
4. **Aucune** arithmétique générale des pointeurs.
5. `NULL` et `stddef.h` restent reportés.
6. **Aucune** commande monolithique de parcours.

---

## 2. Ce que le lot ajoute

**Aucune enveloppe française nouvelle.** La décision 6 interdit une
commande de parcours, et la relation à enseigner est une relation
d'**expressions** : elle s'écrit donc dans les expressions déjà
délimitées par des guillemets.

| Formulation française | Code C produit |
|---|---|
| `Affecte à n le résultat numérique de "*(t + i)".` | `n = (*(t + i));` |
| `Affecte à n le résultat numérique de "*(t + 0)".` | `n = (*(t + 0));` |
| `Crée un bloc si "*(t + i) > 0".` | `if ((*(t + i)) > 0) { … }` |
| `Crée une boucle tant que "*(s + i) != '\0'".` | `while ((*(s + i)) != '\0') { … }` |
| `Retourne le résultat numérique de "*(t + i * 2)".` | `return (*(t + (i * 2)));` |
| `Appelle traiter avec "*(t + i)".` | `traiter((*(t + i)));` |

La forme indexée équivalente reste celle du lot 15 :
`Affiche l'élément "i" de t.` donne `printf("%d", t[i]);`.

L'écriture est **parenthésée** comme tout opérateur unaire depuis le lot
6 : `*(t + i) + 1` devient `((*(t + i)) + 1)`, jamais `*(t + i + 1)`.

---

## 3. Grammaire, strictement

    déréférencement := '*' nom
                     | '*' '(' nom '+' décalage ')'

    décalage := expression de la grammaire ENTIÈRE du lot 15
                (noms, entiers décimaux, `+ - * / %`, parenthèses,
                 négation, indexation)

Un seul `+`, un seul niveau de parenthèses, et le membre gauche est un
**nom**.

### Refusé, avec `INVALID_POINTER_OFFSET`

| Entrée | Raison |
|---|---|
| `*(p - i)` | la soustraction n'est pas dans le cadre (décision 1 et 4) |
| `*(t + i + j)` | `(t + i) + j` : le membre gauche n'est plus un nom |
| `*(t * i)` | l'opérateur n'est pas `+` |
| `*(t + 1.5)` | le décalage n'est pas entier |
| `*(t + (char) 1)` | conversion hors grammaire entière |
| `*(t + 'A')` | littéral caractère hors grammaire entière |
| `*(t + *q)` | déréférencement imbriqué dans le décalage |
| `*(t + &x)` | adresse dans le décalage |
| `*(t[0] + i)` | le membre gauche est un élément, pas un nom |
| `*(-t + i)` | le membre gauche est une négation |

### Inchangé

`**p` reste l'opérateur `**` du lot 6. `* *p`, `&*p`, `*&x` restent
`UNSUPPORTED_INDIRECTION_LEVEL`. `*5`, `*t[0]`, `*(p)` gardent le
comportement du lot 17 — `*(p)` est accepté et rend `(*p)`.

### Ce que la grammaire ne peut pas garantir

`*(p + q)` est **accepté** lorsque `q` est un nom : un identifiant est
syntaxiquement une expression entière, et C-A ne résout aucun symbole. Il
ne sait donc ni que `p` est un pointeur ou un tableau, ni que `q` n'en est
pas un. **La contrainte grammaticale n'est pas une garantie sémantique**,
et l'information `OFFSET_TYPE_NOT_CHECKED` le dit à chaque occurrence
plutôt que de laisser croire à une vérification.

De même, `*(i + t)` est accepté : la grammaire ne peut pas désigner lequel
des deux membres est le pointeur. C'est l'autre moitié du même aveu.

---

## 4. Capacités du noyau

Un champ nouveau, `pointerOffset` :

| Profil | `pointerOffset` |
|---|---|
| `INTEGER_CAPABILITIES` (lot 6) | **false** |
| `NUMERIC_CAPABILITIES` | **true** |
| `CONDITION_CAPABILITIES` | **true** |
| `INDEX_CAPABILITIES` (lot 15) | **false** |

Le profil entier reste gelé pour le cinquième lot consécutif. Le profil
d'indice reste fermé, donc `t[*(u + i)]` est refusé : un indice reste une
expression entière simple.

Le **décalage** est validé par un contrôle structurel de l'arbre produit,
avec la même liste de formes que `INDEX_CAPABILITIES` : noms, littéraux
d'écriture entière, négation, opérations binaires, indexation. Tout autre
nœud est refusé à l'endroit exact où il apparaît.

---

## 5. Informations pédagogiques passives

Sur un `*(nom + décalage)`, cinq informations :

| Code | Fait énoncé |
|---|---|
| `DEREFERENCE_MEANING` | lot 17, inchangé : `*` désigne l'objet à cette adresse |
| `ARRAY_POINTER_EQUIVALENCE` | `t[i]` et `*(t + i)` désignent **le même élément** en C17 ; dans une expression, le nom d'un tableau est converti en pointeur vers son premier élément — mais un tableau et un pointeur **ne sont pas du même type** |
| `POINTER_ARITHMETIC_LIMITS` | l'addition se compte en **éléments**, pas en octets ; elle n'est définie qu'à l'intérieur du tableau et **une position au-delà du dernier élément**, qui peut être formée mais **pas déréférencée** |
| `OUT_OF_BOUNDS_UNDEFINED` | un accès hors des limites a un **comportement indéfini** ; C-A ne vérifie ni les bornes, ni la validité de l'adresse, et rien ne le signale à l'exécution |
| `OFFSET_TYPE_NOT_CHECKED` | la forme écrite est **syntaxiquement** celle d'un décalage ; C-A ne vérifie ni que ce nom désigne un tableau ou un pointeur, ni que le décalage est bien un entier |

`ADDRESS_NOT_CHECKED` du lot 17 n'est **pas** émise ici : son fait est
couvert, plus précisément, par `OUT_OF_BOUNDS_UNDEFINED`. Sur un `*p`
ordinaire, elle reste émise comme avant.

Aucune information n'incrémente le compteur d'avertissements. Aucune
n'affirme que tableau et pointeur sont le même type.

---

## 6. Limites

- Ni `p - i`, ni `p - q`, ni `ptrdiff_t`, ni `++`/`--` sur un pointeur.
- Aucune comparaison de pointeurs enseignée : `p == q` passe déjà comme
  comparaison de deux noms, sans information dédiée.
- Un seul `+` et un seul niveau de parenthèses.
- Aucune enveloppe n'écrit **à travers** un décalage : pour écrire dans un
  élément, la forme indexée du lot 15 reste la seule.
- Aucune vérification de bornes, de type, de taille ou de validité.
- `NULL`, `stddef.h`, allocation dynamique : hors périmètre.

---

## 7. Plan de tests

`t[i]` et `*(t + i)` côte à côte ; décalages constants, noms et
expressions ; les six formulations ; priorité et parenthésage ; décalages
imbriqués autorisés (`*(t + i * 2)`, `*(t + u[i])`) ; les dix formes
refusées avec leurs plages UTF-16 ; profils entier et indice fermés ; les
cinq informations et leur absence ailleurs ; verrouillage des cinq
enregistrements de capacités ; intégration avec déclaration, affectation,
fonction, boucle, tableau et chaîne ; **tests démontrant explicitement
qu'une forme acceptée ne garantit pas la validité sémantique du C
produit** ; non-régression des lots 1 à 17.
