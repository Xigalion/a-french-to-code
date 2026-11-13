# Lot 14 — Caractères et type `char`

**Contrat du §3 de `docs/DOMAINE5_CONTRAT_PROPOSE.md`, autorisé le
13 novembre 2026, implémenté et livré le même jour.**

Premier lot pédagogique du domaine 5. Il introduit le type `char` dans les
constructions où il a du sens, une grammaire finie de littéral caractère, et
trois informations pédagogiques passives qui distinguent le caractère, le code
numérique et la représentation en mémoire.

---

## 1. Formulations et sorties C exactes

### 1.1 Les quatre formulations dédiées

| Phrase française | Code C produit | Information |
|---|---|---|
| `Déclare un caractère nommé c.` | `char c;` | `CHARACTER_STORAGE` |
| `Crée un caractère nommé c de valeur 'A'.` | `char c = 'A';` | `CHARACTER_IS_INTEGER` |
| `Affecte le caractère 'A' à c.` | `c = 'A';` | `CHARACTER_IS_INTEGER` |
| `Affiche le caractère c.` | `printf("%c", c);` | `CHARACTER_FORMAT` |

Le point final reste facultatif, les mots fixes restent insensibles à la casse,
les accents restent exigés, et le commentaire inséré contient **exactement** la
phrase saisie.

### 1.2 Grammaire du littéral caractère

Apostrophes **ASCII droites**, et entre elles soit un caractère **ASCII
imprimable** (`0x20` à `0x7E`), soit l'un des quatre échappements :

| Accepté | |
|---|---|
| `'A'` `'z'` `'0'` `' '` `'}'` `'"'` `'%'` `'~'` | un caractère imprimable |
| `'\'` + `''` , `'\\'` , `'\n'` , `'\t'` | les quatre échappements |

**Le littéral n'est jamais évalué.** `'A'` n'est remplacé par `65` nulle part :
ni dans le fragment, ni dans l'arbre, ni dans un message. Un test le vérifie
explicitement, y compris du côté des avertissements de calcul.

### 1.3 `char` dans le système de types — décision D2

| Phrase française | Code C produit |
|---|---|
| `Déclare une variable de type char nommée c.` | `char c;` |
| `Crée une variable de type char nommée c avec le résultat de "65".` | `char c = 65;` |
| `Crée une fonction nommée lire qui retourne un char.` | `char lire(void) { … }` |
| `… et prend un char nommé c.` | `… (char c)` |
| `Affecte à n le résultat numérique de "(char) 65".` | `n = ((char) 65);` |
| `Retourne le résultat numérique de "(char) a".` | `return ((char) a);` |

`unsigned char` et `signed char` restent refusés : seule la désignation nue
rejoint le catalogue.

---

## 2. Les six diagnostics

| Cas | Code | Plage |
|---|---|---|
| Littéral absent | `MISSING_CHARACTER` | point d'insertion |
| Pas d'apostrophe ASCII ouvrante | `MISSING_CHARACTER_DELIMITER` | le caractère fautif |
| Apostrophe fermante absente | `UNTERMINATED_CHARACTER` | ouvrante → fin utile |
| Vide ou plus d'un caractère | `INVALID_CHARACTER` | le littéral entier |
| Échappement inconnu | `INVALID_CHARACTER_ESCAPE` | `\` + le caractère |
| Contenu non pris en charge | `UNSUPPORTED_CHARACTER_CONTENT` | le caractère |

Toutes les plages sont des intervalles UTF-16 semi-ouverts absolus dans la
phrase d'origine, **sans normalisation**. Un caractère astral occupe ses deux
unités ; un demi-codet isolé occupe la sienne. Les codes de nom
(`INVALID_IDENTIFIER`, `C_KEYWORD_IDENTIFIER`) et de texte supplémentaire
(`UNEXPECTED_TEXT`) sont réutilisés tels quels.

---

## 3. Informations pédagogiques

Trois entrées **passives**, sur le canal « C-A — Pédagogie ». Aucune n'est un
avertissement et aucune ne contient de valeur numérique.

**`CHARACTER_IS_INTEGER`** — sur la plage du littéral, pour `INIT_CHAR` et
`ASSIGN_CHAR` :

> En C17, une constante caractère comme celle-ci a le type **int**, pas `char` :
> sa valeur est le code du caractère dans le jeu d'exécution, que le standard
> ne fixe pas. Aucune valeur n'est calculée ici.

**`CHARACTER_STORAGE`** — sur le nom, pour `DECL_CHAR` :

> Une variable `char` occupe exactement un octet et contient un code numérique,
> pas un symbole. C17 laisse à l'implémentation le soin de dire si ce type est
> signé. Aucune valeur initiale n'est écrite ici.

**`CHARACTER_FORMAT`** — sur le nom, pour `PRINT_CHAR` :

> `%c` affiche le caractère correspondant au code stocké ; `%d` afficherait ce
> même code en décimal. C-A ne vérifie ni que cette variable existe, ni qu'elle
> est de type `char`.

### Une correction apportée au contrat

Le §3.5 du contrat proposait « un caractère est un petit entier ». C'est flou et
cela laissait croire que `'A'` a le type `char`. **En C17, une constante
caractère ordinaire a le type `int`** (6.4.4.4) ; c'est la variable `char` qui
occupe un octet. Le message a été réécrit sur cette base, conformément à la
précision donnée à l'autorisation du lot. La distinction est séparée en deux
entrées : la constante d'un côté, la variable de l'autre.

---

## 4. Deux précisions prises sur le contrat

Le contrat approuvé ne tranchait pas ces deux points ; les voici, pour revue.

**Contenu restreint à l'ASCII imprimable.** Le contrat refusait explicitement
les caractères de contrôle, l'apostrophe typographique et les caractères
astraux, sans statuer sur `'é'`. J'ai refusé tout ce qui sort de `0x20`–`0x7E`,
avec `UNSUPPORTED_CHARACTER_CONTENT`. Raison : dans une source UTF-8, `'é'` est
une constante **multicaractère** dont C17 laisse la valeur définie par
l'implémentation. La traduire silencieusement produirait un C légal dont la
valeur dépend du compilateur — exactement ce que C-A s'interdit. Le message du
diagnostic a été élargi en conséquence : « Seuls les caractères ASCII
imprimables sont pris en charge entre apostrophes. »

**`'\0'` refusé.** Le caractère nul n'est pas dans la liste d'échappements du
contrat. Il est refusé avec `INVALID_CHARACTER_ESCAPE`, et le lot 16 l'ouvrira :
c'est là qu'il devient l'objet enseigné, pas une commodité ajoutée en passant.

---

## 5. Architecture

Aucun quatrième analyseur d'expressions n'a été créé.

| Fichier | Rôle |
|---|---|
| `src/characterLiteral.ts` (nouveau, 78 l.) | scanner **de terminal** : une constante caractère, puis il s'arrête |
| `src/characterInstructions.ts` (nouveau, 116 l.) | les quatre enveloppes françaises, sur le modèle de `numericInstructions.ts` |

`characterLiteral.ts` n'est pas un analyseur d'expressions : il reconnaît un
terminal et rend la main. Un littéral caractère **dans** une expression reste
refusé par les trois profils, inchangés.

Les enveloppes scannent le littéral depuis la **source brute**, pas depuis les
jetons séparés par des espaces : `' '` est un littéral valide qu'une découpe par
espaces couperait en deux. Les mots fixes avant et après restent lus sur les
jetons.

La séparation traduction / diagnostic / placement est intacte :
`characterLiteral.ts` et `characterInstructions.ts` n'importent ni `vscode`, ni
le document, ni `planPlacement`. Aucun changement n'a été nécessaire dans
`planPlacement.ts`, `enclosingStructures.ts` ni dans aucun reconnaisseur
contextuel : les quatre instructions sont des instructions simples.

### Le noyau du lot 13 a servi

`char` n'a pas été ajouté par une liste en dur de plus. La liste des types
acceptés par une conversion est devenue une **capacité explicite**,
`castTypes`, dans `ExpressionCapabilities` :

| Capacité | Entier | Numérique | Condition |
|---|---|---|---|
| `castTypes` | `[]` | `int, unsigned int, float, double, char` | idem |

Ajouter un type à une conversion est désormais une ligne visible dans un
enregistrement de capacités, verrouillée par un test d'égalité stricte. Le lot
17 ajoutera ses conversions de pointeur au même endroit. C'est précisément le
bénéfice que le lot 13 devait produire, et c'est la première fois qu'il sert.

---

## 6. Tests

    npm run check     # typecheck moteur + extension, puis suite Node

| | Avant (lot 13) | Après |
|---|---|---|
| Tests | 2 662 | **2 765** |
| Réussis | 2 662 | **2 765** |
| Échecs | 0 | **0** |

`test/characters.test.mjs` (nouveau, 101 tests) couvre : les sorties exactes des
quatre formulations avec et sans point final ; la casse et les accents exigés ;
les douze littéraux valides dont les quatre échappements ; la preuve que le
littéral n'est jamais évalué ; treize refus de littéral avec leurs plages
UTF-16 exactes ; le caractère astral sur ses deux unités et le demi-codet isolé
sur la sienne ; vingt-six refus d'enveloppe ; le scanner appelé seul avec des
décalages absolus ; les sept formulations du système de types ; le refus
maintenu de `unsigned char`, `signed char`, `long`, `short` ; le refus maintenu
de `a[0]`, `&a`, `* a`, `p->x`, `'A'`, `"texte"` dans les expressions ; les
trois informations avec leur ancrage et leur absence ailleurs ; six
combinaisons de placement LF/CRLF × indentation ; la séquence complète
déclaration → affectation → affichage avec document final exact ; un littéral
contenant `}` qui ne trouble pas le placement ; et les voisins immédiats
inchangés.

### Tests historiques adaptés

Trois, tous des refus de `char` que la décision D2 transforme en acceptations.
Aucun n'a été supprimé en silence : chacun porte un commentaire disant quel lot
l'a rendu obsolète et où l'acceptation est désormais vérifiée.

| Fichier | Refus retiré |
|---|---|
| `test/functions.test.mjs` | `qui retourne un char` → `UNSUPPORTED_NUMERIC_TYPE` |
| `test/callsAndParameters.test.mjs` | `prend un char nommé c` → `UNSUPPORTED_NUMERIC_TYPE` |
| `test/expressionCore.test.mjs` | `(char) a` → `UNSUPPORTED_NUMERIC_TYPE`, et l'enregistrement de capacités qui gagne `castTypes` |

**Aucun autre fichier de test existant n'a été modifié.** Les instantanés de
compatibilité des lots 4, 5 et 6 sont intacts.

---

## 7. Comparaison différentielle

    node scripts/differentiel.mjs HEAD --extensions "caract|char"

Le harnais du lot 13 a été étendu : il range désormais les divergences en deux
seaux. Celles dont l'entrée correspond au motif `--extensions` sont des
**extensions approuvées**, imprimées mais non bloquantes ; toutes les autres
sont des **régressions** et font échouer la commande.

| Référence | Comparaisons | Extensions | Régressions |
|---|---|---|---|
| `HEAD` (lot 13) | 1 323 444 | 469 | **0** |
| (identifiant antérieur à la réécriture) (avant le lot 13) | 1 323 444 | 469 | **0** |

Le second chiffre dit que les lots 13 et 14 **ensemble** n'ont rien changé hors
du périmètre approuvé.

Le corpus a été étendu à la surface du lot 14 : vingt littéraux valides et
invalides dans les deux enveloppes qui en prennent un, les quatre formulations
sur onze noms, les refus d'enveloppe, et les trois instructions caractère
placées dans les vingt-deux documents de référence.

### Le motif n'a pas été cru sur parole

Un motif appliqué à l'entrée entière peut **sur-capturer** : une phrase
historique placée dans un document contenant le mot `char` y correspondrait
aussi. L'option `--all` a donc été ajoutée, et les 469 entrées ont été listées
et relues une par une. Toutes sont du périmètre du lot 14 : une conversion
`char`, une désignation de type `char`, ou l'une des quatre formulations
nouvelles. Aucune phrase historique n'y figure.

---

## 8. Limites connues

### Propres au lot 14

- **Aucun littéral caractère dans une expression.** `"'A' + 1"`, `"c == 'A'"`
  restent refusés dans les trois profils. Ce n'est pas un oubli : ouvrir le
  littéral aux expressions demande une capacité nouvelle dans le noyau, et donc
  un contrat.
- **Aucune vérification que la valeur tient dans un `char`.**
  `Crée une variable de type char nommée c avec le résultat de "300".` produit
  `char c = 300;` sans un mot. C-A n'évalue rien et ne connaît pas `CHAR_MAX`.
- **Aucune résolution de symbole.** `Affiche le caractère c.` ne vérifie ni que
  `c` existe, ni qu'il est de type `char`. L'information `CHARACTER_FORMAT` le
  dit explicitement à l'utilisateur.
- **`char` est accepté comme conversion dans le profil condition aussi.**
  `Crée un bloc si "(char) a < 5".` est désormais traduit. Les conversions sont
  une capacité unique ; les séparer entre profils aurait été arbitraire. Signalé
  ici parce que le §3.4 du contrat ne citait que l'exemple numérique.
- **L'ASCII imprimable est une décision de ce lot**, pas du contrat : voir §4.

### Héritées, toujours ouvertes

1. Recette GCC complète du domaine « Expressions et calculs ».
2. Recettes manuelles des domaines 3 et 4, et du lot 10.
3. Qualification des avertissements de l'hôte VS Code (`mutex already exists`,
   DEP0168/N-API).
4. **Aucune vérification générale des types, symboles et portées**, et **aucune
   garantie de compilation** du C produit.
5. Confirmation en recette de la compatibilité C17 des fonctions.
6. **97 tests hôte VS Code non exécutés**, le mutex de mise à jour restant
   bloquant. Ils ne sont **pas** présentés comme réussis. Le lot 14 ne modifie
   ni `extension/`, ni `test/vscode/`.

**La réussite des 2 765 tests automatisés mesure la conformité du code à ses
contrats. Elle ne mesure pas la complétion du modèle 1.**

---

## 9. Fichiers

### Créés

| Fichier | Lignes |
|---|---|
| `src/characterLiteral.ts` | 78 |
| `src/characterInstructions.ts` | 116 |
| `test/characters.test.mjs` | 372 |
| `docs/LOT14_BILAN.md` | ce document |

### Modifiés

| Fichier | Nature |
|---|---|
| `src/translate.ts` | quatre intentions, six codes, quatre rendus, un aiguillage |
| `src/expressionCore.ts` | capacité `castTypes`, `char` dans `CoreNumericType` |
| `src/numericExpression.ts` | `char` dans `NumericType` |
| `src/numericInstructions.ts` | `char` accepté comme type de variable |
| `src/functionInstructions.ts` | `char` accepté en retour et en paramètre |
| `src/pedagogicalInformation.ts` | trois informations caractère |
| `scripts/differentiel.mjs` | seaux extensions/régressions, `--all`, corpus du lot 14 |
| `test/functions.test.mjs`, `test/callsAndParameters.test.mjs`, `test/expressionCore.test.mjs` | trois refus adaptés, documentés |
| `package.json`, `CLAUDE.md`, `docs/CATALOGUE.md`, `docs/DOMAINE5_CONTRAT_PROPOSE.md` | enregistrement et documentation |

### Non modifiés

`src/planPlacement.ts`, `src/placementLexical.ts`, `src/enclosingStructures.ts`,
`src/branchTarget.ts`, `src/loopTarget.ts`, `src/functionContext.ts`,
`src/condition.ts`, `src/expression.ts`, `src/calculationAdvisories.ts`, tout
`extension/`, et tous les autres fichiers de test.

---

## 10. Décisions pour le lot 15

Deux points à trancher au contrat du lot 15 ; **aucun n'est bloquant pour la
revue du lot 14**.

**L1 — Le littéral caractère entre-t-il dans les expressions, et quand ?**
Le lot 15 ouvre l'indexation, donc `t[0]`. Faut-il que `t[0] = 'A'` ou
`"c == 'A'"` deviennent possibles au lot 15, ou attendre le lot 16 où les
chaînes rendent la comparaison de caractères indispensable ? Ma
recommandation : **au lot 16**, parce que c'est là que la comparaison au `\0`
donne à la construction sa raison d'être pédagogique. Le lot 15 resterait sur
des tableaux d'entiers.

**L2 — Le type d'un tableau de caractères.**
`char t[10];` relève-t-il du lot 15 (tableaux) ou du lot 16 (chaînes) ? Ma
recommandation : **lot 15**, comme simple tableau d'un type déjà connu, le lot
16 n'ajoutant alors que le `\0` et `%s`. Cela évite d'enseigner « tableau de
char » et « chaîne » comme deux notions distinctes.

Aucune ligne du lot 15 n'est écrite.
