# Domaine 5 — « Tableaux, chaînes et pointeurs » : découpage et contrat du premier lot

**Statut au 13 novembre 2026 : découpage approuvé, décisions D1 à D6
validées, lots 13, 14 et 15 livrés.** Les lots 16 à 18 restent à
implémenter et le lot 16 attend la revue du lot 15. Dépôt : **2 889 tests
Node réussis** et **97 tests hôte VS Code non exécutés**.

Le bilan du lot 13 est dans `docs/LOT13_CONTRAT_ET_BILAN.md`. Le §4 de ce
document-ci est le contrat qui y a été exécuté ; il est conservé tel qu'il
a été approuvé, à titre de référence.

Périmètre confirmé par le fondateur : **option B**, le modèle 1 couvre
l'intégralité des neuf domaines. Les domaines 5 à 9 en font partie et ne
sont pas reportés.

Ce document propose un découpage, détaille le contrat du **premier lot**,
et isole au §5 les **décisions réellement bloquantes**. Toutes ont été
tranchées le 13 novembre 2026 ; chaque décision porte désormais son
arbitrage.

---

## 1. Ce que le périmètre exige, et ce qui existe déjà

Compétences à couvrir : `char`, tableaux, indexation, chaînes C, adresses,
pointeurs, déréférencement, relation tableaux/pointeurs.

### 1.1 Bonne nouvelle : le placement est déjà prêt

J'ai vérifié empiriquement que les reconnaisseurs contextuels livrés
traitent déjà correctement les documents que le domaine 5 produira :

| Document | Résultat vérifié |
|---|---|
| `int t[3];` | placement accepté |
| `int t[3] = {1, 2, 3};` | placement accepté, l'initialisateur refermé ne gêne pas |
| `char s[6] = "hello";` | placement accepté, les accolades dans la chaîne ne piègent pas le balayage |
| `void f(int t[], int n) {` | reconnue comme **définition de fonction** ; un `return` y est correctement rattaché |
| `int* p;` | placement accepté |
| `int t[3] = {1, 2, 3};` dans une boucle | `break` correctement rattaché à la boucle |

`enclosingStructures.ts` apparie déjà `[` et `]`, et un initialisateur
`{…}` refermé est correctement dépilé. **Aucune modification des
reconnaisseurs contextuels n'est nécessaire** pour les lots 14 à 16.

### 1.2 Mauvaise nouvelle : les trois profils d'expression sont verrouillés

Le domaine 5 a besoin, dans les expressions, de `[`, de `&` préfixe, de `*`
préfixe et des littéraux caractères. **Les trois profils existants
refusent ces quatre constructions, et ces refus sont verrouillés par des
tests approuvés :**

| Construction | Profil entier (lot 6) | Profil numérique (lot 7) | Profil condition (lots 9-10) |
|---|---|---|---|
| `a[0]` | `INVALID_EXPRESSION_TOKEN` sur `[` | `INVALID_EXPRESSION_TOKEN` sur `[` | idem |
| `a & b` | `UNSUPPORTED_EXPRESSION_OPERATOR` | idem | `UNSUPPORTED_CONDITION_OPERATOR` |
| `* a` | `MISSING_OPERAND` en [0,0) | idem | idem |
| `'A'` | `INVALID_EXPRESSION_TOKEN` | idem | idem |
| `f(a)` | `MISSING_OPERATOR` sur `(` | idem | idem |

Sources : `test/expression.test.mjs` lignes 57-70,
`test/arithmetic.test.mjs` ligne 63, `test/numeric.test.mjs` ligne 166.

**Conséquence : les profils existants ne peuvent pas être étendus en
place.** Toute extension casserait des contrats approuvés.

Ce n'est pas un obstacle imprévu : c'est exactement la situation qu'ont
rencontrée les lots 7 et 9, et le projet y a déjà répondu deux fois de la
même manière — **un profil dédié par domaine**, sélectionné par une
enveloppe française distincte. Les commentaires du code le disent
explicitement : « Independent syntax profile: never changes the integer
parser », « Dedicated bounded condition profile; historical numeric and
integer parsers stay unchanged ».

Le problème est qu'un quatrième profil porterait à **quatre tokeniseurs
quasi identiques**, et que le domaine 6 (`.`, `->`, `sizeof`) en
demanderait un cinquième. C'est l'objet de la décision **D1** au §5.

---

## 2. Découpage proposé

Six lots. Les suffixes sont des repères, pas des numéros réservés.

| Lot | Compétences | Dépendances | Impact parseur |
|---|---|---|---|
| **13 — Profil d'expression unifié** | *aucune compétence nouvelle* : préparation technique à comportement constant | — | refonte interne, **zéro changement de comportement** |
| **14 — Le type `char`** | `char` comme type entier, littéral caractère, affichage `%c` | 13 (ou rien, voir D1) | **aucun** si le littéral reste en position de valeur |
| **15 — Tableaux et indexation** | dimension explicite, `t[i]` en lecture et en écriture, parcours par boucle | 14 | `[` et `]` |
| **16 — Chaînes C** | tableau de `char`, littéral chaîne, terminateur `\0`, `%s`, parcours caractère par caractère | 15 | littéral chaîne en initialisation |
| **17 — Adresses et pointeurs** | `&x`, type pointeur, déclaration, affectation, déréférencement `*p` | 15 | `&` et `*` préfixes |
| **18 — Relation tableaux/pointeurs** | décroissance, `*(t + i)` et `t[i]`, arithmétique bornée | 16, 17 | arithmétique de pointeur |

### Pourquoi ce découpage

**13 d'abord, s'il est retenu**, parce qu'une refonte à comportement
constant se valide sur la base de tests existante : les 2 648 tests
actuels en sont la preuve de non-régression. La faire **après** avoir
ajouté des constructions mêlerait deux sources de régression.

**14 isolé**, parce qu'il n'a **aucun impact sur le parseur** si le littéral
caractère reste en position de valeur directe. C'est un lot court et sûr,
qui installe le type dont tout le reste dépend. Il permet de valider vite
sans engager la chirurgie du parseur.

**15 avant 16**, parce qu'une chaîne C *est* un tableau de `char` : enseigner
la chaîne avant le tableau inverserait la dépendance conceptuelle et ferait
croire à un type primitif.

**17 après 15**, parce que l'adresse d'un élément de tableau donne au
pointeur un référent concret, au lieu d'un concept abstrait.

**18 en dernier**, parce que la relation tableau/pointeur suppose les deux
notions acquises, et c'est le seul lot où l'arithmétique de pointeur
apparaît.

Regrouper 15 et 16 serait possible mais cumulerait l'indexation, le
terminateur `\0` et un nouveau type de littéral. Regrouper 17 et 18
cumulerait le déréférencement et l'arithmétique. Je recommande de garder
quatre validations courtes.

**`switch`, `goto`, `sizeof`, `const`, les tableaux à deux dimensions et
l'allocation dynamique ne sont dans aucun de ces lots.** L'allocation
relève du domaine 6.

---

## 3. Contrat du premier lot pédagogique — Lot 14 — **approuvé et livré**

> **Livré le 13 novembre 2026.** Deux précisions ont été prises sur ce
> contrat et sont soumises à revue : le contenu du littéral est restreint à
> l'ASCII imprimable, et le message du §3.5 a été réécrit parce qu'une
> constante caractère ordinaire a le type `int` en C17, pas `char`. Voir
> `docs/LOT14_BILAN.md`.


Ce contrat est **indépendant de la décision D1** : il n'introduit aucune
construction nouvelle dans les expressions.

### 3.1 Formulations et sorties exactes

Quatre formulations, calquées sur la famille historique des entiers
(`Déclare un entier nommé`, `Crée un entier nommé … de valeur`,
`Affecte la valeur … à`, `Affiche la valeur de`) :

| Formulation | Code produit |
|---|---|
| `Déclare un caractère nommé c.` | `char c;` |
| `Crée un caractère nommé c de valeur 'A'.` | `char c = 'A';` |
| `Affecte le caractère 'A' à c.` | `c = 'A';` |
| `Affiche le caractère c.` | `printf("%c", c);` |

### 3.2 Grammaire du littéral caractère

Entre apostrophes **droites ASCII** `'`, exactement un caractère, ou un
échappement de la liste finie :

| Écriture | Valeur |
|---|---|
| `'A'`, `'z'`, `'0'`, `' '` | le caractère lui-même |
| `'\n'`, `'\t'`, `'\\'`, `'\''` | échappements acceptés |

Refusés, avec un diagnostic propre : apostrophe non fermée, littéral vide
`''`, plus d'un caractère `'ab'`, échappement inconnu `'\q'`, caractère de
contrôle brut, apostrophe typographique `’`, caractère astral.

**Le littéral n'est pas évalué** : aucune valeur numérique n'est calculée
ni affichée. `'A'` n'est jamais remplacé par `65`.

### 3.3 Diagnostics proposés

| Cas | Code | Message |
|---|---|---|
| Littéral absent | `MISSING_CHARACTER` | « Il manque le caractère. » |
| Délimiteur absent | `MISSING_CHARACTER_DELIMITER` | « Le caractère doit être entouré d'apostrophes ASCII. » |
| Apostrophe fermante absente | `UNTERMINATED_CHARACTER` | « Il manque l'apostrophe fermante du caractère. » |
| Vide ou plus d'un caractère | `INVALID_CHARACTER` | « Un caractère exactement est attendu entre les apostrophes. » |
| Échappement inconnu | `INVALID_CHARACTER_ESCAPE` | « Échappement attendu : `\'` , `\\` , `\n` ou `\t`. » |
| Contenu non pris en charge | `UNSUPPORTED_CHARACTER_CONTENT` | « Caractère de contrôle ou Unicode invalide. » |

Plages UTF-16 absolues dans la phrase d'origine, sans normalisation, comme
partout ailleurs. Les codes de nom (`INVALID_IDENTIFIER`,
`C_KEYWORD_IDENTIFIER`) et de texte supplémentaire (`UNEXPECTED_TEXT`)
sont réutilisés tels quels.

### 3.4 `char` dans le système de types — **dépend de D2**

Si D2 est approuvée, `char` rejoint la liste des types pris en charge, ce
qui rend reconnaissables :

| Formulation | Code produit |
|---|---|
| `Déclare une variable de type char nommée c.` | `char c;` |
| `Crée une fonction nommée lire qui retourne un char.` | `char lire(void) { … }` |
| `… et prend un char nommé c.` | `… (char c)` |
| `Affecte à n le résultat numérique de "(char) 65".` | `n = ((char) 65);` |

Si D2 est refusée, seules les quatre formulations du §3.1 existent, et
`de type char` reste refusé. Le lot reste livrable, mais `char` ne pourra
ni être un paramètre, ni un type de retour, ni une cible de conversion —
ce qui bloquera le lot 16, puisqu'une fonction de traitement de chaîne a
besoin de paramètres `char`.

### 3.5 Information pédagogique proposée

`CHARACTER_IS_INTEGER`, `severity: 'information'`, canal « C-A —
Pédagogie », sur la plage du littéral :

> En C, un caractère est un petit entier : `'A'` désigne le code de ce
> caractère dans le jeu d'exécution, dont la valeur n'est pas fixée par le
> standard. Aucune valeur numérique n'est calculée ici.

C'est la compétence centrale du lot, et elle évite deux erreurs
classiques : croire que `'A'` vaut 65 partout, et confondre `'1'` avec `1`.

### 3.6 Placement et limites

Les quatre formulations sont des **instructions simples** : aucun bloc,
aucun curseur intérieur, une ligne de saisie ordinaire après l'insertion.
Aucune vérification contextuelle nouvelle. Les règles d'indentation, de
LF/CRLF, de préfixe lexical, d'aperçu et d'annulation sont inchangées.

Limites explicites du lot 14 :

- aucun littéral caractère **dans une expression** : `"c + 1"` reste refusé
  (ce sera l'objet du lot 15 ou de la décision D1) ;
- aucune conversion implicite, aucun calcul sur les caractères ;
- aucune vérification que la valeur d'un `char` est représentable ;
- le caractère de la phrase française est conservé tel quel dans le
  commentaire, sans normalisation Unicode.

### 3.7 Plan de tests du lot 14

Rendus exacts des quatre formulations, avec et sans point final ; les
quatre échappements ; conservation de la casse, des accents et des
tabulations de la phrase ; les six diagnostics avec leurs plages UTF-16 ;
apostrophe typographique refusée ; caractère astral refusé ; littéral vide
et à deux caractères refusés ; `char` comme type, paramètre, retour et
conversion si D2 est approuvée ; information `CHARACTER_IS_INTEGER` et son
absence sur les autres intentions ; placement sur six combinaisons
LF/CRLF × indentation ; séquence complète déclaration → affectation →
affichage avec document final exact ; non-régression des sorties des lots 1
à 12 ; refus maintenu des constructions des lots 15 à 18.

---

## 4. Contrat du lot préparatoire — Lot 13 — **approuvé et livré**

> **Livré le 13 novembre 2026.** Critère du §4.2 tenu : les 2 648 tests
> existants passent **sans aucune modification**, et 14 tests nouveaux
> s'y ajoutent. Le repli du §4.3 n'a pas été nécessaire. Équivalence avec
> le moteur précédent démontrée sur **1 322 877 comparaisons
> différentielles, zéro divergence**. Voir `docs/LOT13_CONTRAT_ET_BILAN.md`.


**Aucune compétence pédagogique. Aucun changement de comportement
observable.** Un seul objectif : rendre les quatre profils futurs
soutenables.

### 4.1 Ce qui est fait

Un noyau d'analyse unique, paramétré par un **jeu de capacités explicite**
par enveloppe française :

| Profil | Capacités |
|---|---|
| Entier (lot 6) | entiers décimaux, noms, `+ - * / %`, parenthèses, `-` unaire |
| Numérique (lot 7) | ci-dessus + littéraux flottants et suffixes + conversions |
| Condition (lots 9-10) | numérique + comparaisons + `!`, `&&`, `||` |
| *(domaine 5)* | numérique + capacités ajoutées lot par lot |

Les budgets (1 024 tokens, 64 niveaux), les codes de diagnostic, les
plages et les messages restent **identiques**. Une capacité absente produit
**exactement** le diagnostic actuel, au même code et à la même plage : les
tableaux du §1.2 sont la spécification de ce comportement.

### 4.2 Critère de réussite, non négociable

**Les 2 648 tests existants passent sans aucune modification**, les
instantanés de compatibilité des lots 4 à 6 compris. Toute divergence, même
dans un message, est une régression à corriger dans le code, jamais dans le
test. Si une seule divergence ne peut pas être supprimée, le lot 13 est
abandonné et le domaine 5 repart sur un quatrième profil distinct.

### 4.3 Risque et solution de repli

Le risque est réel : trois tokeniseurs ont divergé subtilement en trois
lots (la gestion des signes d'exposant diffère déjà entre `expression.ts`
et `numericExpression.ts`). La refonte peut échouer.

Le repli est propre et sans dette : un quatrième profil dédié, comme aux
lots 7 et 9. Le domaine 5 est livrable dans les deux cas ; c'est le coût
des domaines 6 à 9 qui change.

---

## 5. Décisions réellement bloquantes

### D1 — Stratégie du parseur d'expressions **(bloquante pour le lot 15)**

Les profils existants ne peuvent pas être étendus sans casser des contrats
approuvés. Deux voies :

| | Option A — quatrième profil dédié | Option B — noyau unifié à capacités (lot 13) |
|---|---|---|
| Risque immédiat | **faible**, précédent établi deux fois | moyen, refonte de code livré |
| Coût du domaine 5 | faible | un lot préparatoire |
| Coût des domaines 6 à 9 | **élevé** : un cinquième profil pour `.`/`->`/`sizeof`, puis au-delà | faible : une capacité par besoin |
| Dette finale | 5 à 6 tokeniseurs quasi identiques | 1 noyau, N jeux de capacités |

**Recommandation : option B**, précisément parce que le modèle 1 couvre
désormais les neuf domaines. Sur un périmètre qui s'arrêtait au domaine 4,
l'option A était la bonne ; l'option B ne devient rentable que parce que la
surface d'expression va continuer de croître. Le critère de réussite du
§4.2 et le repli du §4.3 bornent le risque.

*Si tu préfères l'option A, le découpage reste valable : le lot 13
disparaît et le lot 15 crée un profil dédié.*

### D2 — `char` dans le système de types **(bloquante pour les lots 14 et 16)**

`char` est aujourd'hui **refusé** comme type, et ce refus est verrouillé
par trois tests approuvés :

- `test/functions.test.mjs:86` — `qui retourne un char` → `UNSUPPORTED_NUMERIC_TYPE`
- `test/callsAndParameters.test.mjs:70` — `prend un char nommé c` → `UNSUPPORTED_NUMERIC_TYPE`
- `test/numeric.test.mjs:118` — `de type char` → `UNSUPPORTED_NUMERIC_TYPE`

L'ajouter est une **extension de contrat** : elle n'enlève aucune capacité
et ne change aucune sortie existante, mais elle transforme trois refus
approuvés en acceptations, et les trois tests devront être adaptés.

**Recommandation : approuver.** Sans `char` comme type, une fonction ne
peut ni prendre ni retourner un caractère, et le lot 16 est impossible.

### D3 — Profondeur des pointeurs **(bloquante pour les lots 17 et 18)**

Tu as indiqué que la profondeur exacte serait confirmée séparément. Voici
ce que je propose de verrouiller maintenant, parce que le contrat du
lot 17 en dépend :

| Question | Proposition |
|---|---|
| Niveaux d'indirection | **un seul** : `int*`, jamais `int**` |
| Arithmétique de pointeur | **aucune** au lot 17 ; au lot 18, uniquement `p + entier` et `p - entier` |
| Comparaison de pointeurs | `==` et `!=` seulement, au lot 18 |
| Pointeur nul | `NULL` explicite, au lot 17, avec `stddef.h` — **ou** refusé, voir ci-dessous |
| Pointeur de fonction | **hors périmètre du modèle 1** |
| Retour de type pointeur | **refusé** au domaine 5 : `functionContext` lit le type déclaré par mots et s'arrête sur `*`, donc `int* f(void)` donne déjà `UNSUPPORTED_RETURN_TYPE` (vérifié). L'étendre est un lot en soi |

### D4 — `string.h` et les fonctions de chaîne **(bloquante pour le lot 16)**

Seul `stdio.h` est pris en charge, et `UNSUPPORTED_HEADER` est testé.

**Recommandation : ne pas ouvrir `string.h` au domaine 5.** Les chaînes
s'enseignent par parcours explicite avec indexation et test du `\0`, ce qui
est pédagogiquement supérieur au palier 1 : l'étudiant écrit lui-même ce
que `strlen` cache. `string.h` relèvera du domaine 7, avec la modularité.

### D5 — Pas de vérification des bornes, à confirmer explicitement

`t[5]` sur un tableau déclaré `int t[3];` sera **traduit et placé**. C-A ne
résout aucun symbole, ne retrouve aucune dimension et n'évalue aucun
indice. C'est le bug C le plus classique, et un étudiant pourra
légitimement s'attendre à ce que l'outil l'aide.

**Recommandation : le dire explicitement** dans une information passive du
lot 15, `INDEX_NOT_CHECKED`, plutôt que de laisser croire à une
vérification absente.

### D6 — Initialisateurs entre accolades **(bloquante pour les lots 15 et 16)**

`int t[3] = {1, 2, 3};` introduit une syntaxe nouvelle.

**Recommandation : refuser pour les tableaux d'entiers, accepter pour les
chaînes.** Un tableau d'entiers se déclare sans valeurs, puis chaque
élément est affecté explicitement — ce qui respecte « ne pas inventer de
valeurs » et rend le parcours visible. Pour une chaîne, en revanche,
`char message[6] = "hello";` est la forme à enseigner, précisément parce
qu'elle oblige l'étudiant à compter le `\0` dans la dimension. C'est la
leçon du lot 16.

---

## 6. Ce qui n'est pas demandé et ne sera pas fait

- Aucun analyseur général de symboles ou de types : ni existence, ni
  dimension, ni type d'un élément indexé, ni validité d'un déréférencement.
- Aucune dimension, valeur, indice, type ou allocation inventés.
- Aucune modification implicite du code utilisateur.
- Aucune recette générale anticipée.
- Les paliers de liberté ne sont pas redéfinis.
- Le domaine 6 n'est pas préparé.

---

## 7. Éléments ouverts, suivis et non bloquants

Conformément à la méthode confirmée, ces éléments restent documentés et
**ne bloquent pas** l'implémentation des domaines suivants :

1. **97 tests hôte VS Code non exécutés.** Mutex Inno Setup
   `vscode-updating` détenu par l'instance en cours ; six dossiers de
   version empilés dans l'installation. **Non relancés dans cette
   préparation**, conformément à la consigne. Aucun verrou supprimé, aucune
   modification de l'installation.
2. Recette GCC complète du domaine 2.
3. Recette manuelle du domaine 3.
4. Recette manuelle du domaine 4.
5. Qualification des avertissements hôte `mutex already exists`,
   DEP0168/N-API.
6. Vérification en recette de la compatibilité C17 des fonctions.
7. Limites de l'analyse sémantique : aucune résolution de symbole, aucune
   vérification de type au-delà de l'accord entre la forme d'une phrase de
   retour et le type déclaré, aucune analyse d'accessibilité ou de
   terminaison.

**La réussite des 2 648 tests automatisés ne mesure pas la complétion
réelle du modèle 1.** Elle mesure la conformité du code à ses contrats.
L'exercice de synthèse prévu à l'issue de la construction reste le seul
instrument de mesure de la complétion.

---

## 8. État des autorisations

| | État au 13 novembre 2026 |
|---|---|
| D1 — noyau unifié | **approuvée** |
| D2 — `char` dans le système de types | **approuvée pour le lot 14** |
| D3 — pointeurs, un niveau d'indirection | **approuvée**, non définitive |
| D4 — `string.h` | **reportée**, à réexaminer |
| D5 — `INDEX_NOT_CHECKED` au lot 15 | **approuvée** |
| D6 — initialisateurs | **approuvée**, non définitive |
| Lot 13 | **livré** |
| Lot 14 | **livré** |
| Lot 15 | **livré** — contrat dans `docs/LOT15_CONTRAT_PROPOSE.md`, bilan dans `docs/LOT15_BILAN.md` |
| Lots 16 à 18 | découpage approuvé, contrats à rédiger lot par lot |

Les arbitrages D3, D4 et D6 sont explicitement **non définitifs** : ils
fixent la progression pédagogique du domaine 5, pas les limites du modèle 1.
Les domaines 6 à 9 pourront exiger d'autres constructions C17.
