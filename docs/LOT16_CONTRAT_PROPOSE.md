# Lot 16 — Chaînes C17, caractère nul, affichage et parcours

**Statut : contrat rédigé à partir de l'autorisation du 13 novembre 2026,
puis exécuté.** Bilan d'exécution : `docs/LOT16_BILAN.md`.

Ce lot clôt la progression « type `char` → tableau → chaîne » commencée
aux lots 14 et 15. Il n'introduit **aucun pointeur** et aucune fonction de
`string.h` : la décision D4 reste reportée.

---

## 1. Décisions reçues

1. Enveloppe dédiée produisant `char s[6] = "hello";`, **dimension donnée
   par l'utilisateur**, suffisante pour conserver le caractère nul final,
   refus explicite sinon, sans initialiseurs `{…}` ni déduction
   silencieuse de la dimension.
2. `'\0'` autorisé dans les littéraux caractères ; littéraux caractères
   autorisés dans les profils d'expression pertinents ; un littéral
   caractère ordinaire garde le type `int` en C17 ; `'\0'` n'est jamais
   transformé en valeur numérique.
3. Parcours explicite par indice, condition et boucle, **en réutilisant**
   l'existant, sans commande monolithique.
4. Affichage `%s` d'une chaîne et `%c` d'un élément de tableau de `char`,
   dans une formulation explicite, en distinguant tableau de caractères,
   chaîne terminée et caractère individuel, sans jamais affirmer qu'un
   tableau de `char` est une chaîne valide ni prétendre vérifier le
   terminateur.
5. Extension du noyau aux seules capacités approuvées, profils historiques
   préservés hors extensions documentées, refus des constructions
   réservées aux pointeurs maintenus.
6. Informations passives sur le rôle de `'\0'`, la différence entre taille
   du tableau et longueur de la chaîne, les conditions de `%s`, et
   l'absence de vérification des bornes et du terminateur.

---

## 2. Formulations et sorties exactes

### 2.1 Trois enveloppes nouvelles

| Formulation française | Code C produit |
|---|---|
| `Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".` | `char s[6] = "hello";` |
| `Affiche la chaîne s.` | `printf("%s", s);` |
| `Affiche le caractère de l'élément "i" de s.` | `printf("%c", s[i]);` |

La première suit la distinction déjà établie du catalogue : `Déclare`
n'écrit aucune valeur, `Crée` en écrit une — comme
`Déclare un entier nommé x.` face à `Crée un entier nommé x de valeur 20.`
et comme `Crée une variable de type double nommée x avec le résultat de
"1.5".`. La troisième étend `Affiche le caractère {nom}.` du lot 14 à une
cible indexée, en gardant son article et son ordre de mots.

### 2.2 Deux extensions sans enveloppe nouvelle

`'\0'` rejoint la grammaire finie du littéral caractère du lot 14, donc
les quatre formulations de ce lot et l'enveloppe d'élément du lot 15 :

| Formulation française | Code C produit |
|---|---|
| `Crée un caractère nommé fin de valeur '\0'.` | `char fin = '\0';` |
| `Affecte le caractère '\0' à l'élément "5" de s.` | `s[5] = '\0';` |

Et un littéral caractère devient un **terme d'expression** dans les
profils numérique et condition :

| Formulation française | Code C produit |
|---|---|
| `Crée un bloc si "s[i] != '\0'".` | `if (s[i] != '\0') { … }` |
| `Crée une boucle tant que "s[i] != '\0'".` | `while (s[i] != '\0') { … }` |
| `Affecte à n le résultat numérique de "'z' - 'a'".` | `n = ('z' - 'a');` |

### 2.3 Le parcours est composé, pas commandé

Aucune commande de parcours n'est créée. Un parcours s'écrit avec ce qui
existe déjà, et la boucle reste visible :

    Déclare un entier nommé i.
    Affecte la valeur 0 à i.
    Crée une boucle tant que "s[i] != '\0'".
        Affiche le caractère de l'élément "i" de s.
        Affecte à i le résultat numérique de "i + 1".

---

## 3. Grammaire du littéral texte

Identique à celle de `Affiche le texte "…"` (lot 3), par réemploi du même
scanner, désormais partagé :

- guillemets **ASCII droits** `"` ;
- échappements `\"`, `\\`, `\n`, `\t` ;
- aucun caractère de contrôle brut, aucun demi-codet isolé, aucun
  trigraphe `??=` … ;
- tout autre caractère imprimable est accepté tel quel, sans
  normalisation Unicode.

Le texte est **réencodé** dans le C produit exactement comme `PRINT_TEXT`
le fait déjà, et sa **longueur** est comptée en caractères décodés : c'est
cette longueur, et non le nombre de caractères tapés, qui est comparée à
la dimension. `"a\nb"` occupe trois caractères, pas quatre.

---

## 4. La dimension doit loger le caractère nul

Règle, vérifiée à la traduction : `dimension ≥ longueur décodée + 1`.

| Phrase | Résultat |
|---|---|
| `… de dimension 6 avec le texte "hello".` | `char s[6] = "hello";` |
| `… de dimension 7 avec le texte "hello".` | `char s[7] = "hello";` accepté |
| `… de dimension 5 avec le texte "hello".` | **refusé**, `INSUFFICIENT_ARRAY_DIMENSION` |
| `… de dimension 1 avec le texte "".` | `char s[1] = "";` |

C17 autorise `char s[5] = "hello";`, qui range les cinq caractères **sans**
terminateur : le tableau n'est alors pas une chaîne. Ce lot le refuse
volontairement, parce que son objet est précisément d'apprendre à compter
le `'\0'` dans la dimension. C'est une restriction pédagogique assumée,
pas une règle de C17, et le diagnostic le dit.

Aucune dimension n'est déduite : `char s[] = "hello";` n'a pas de
formulation.

---

## 5. Capacités du noyau — extension approuvée et bornée

Un champ de capacité nouveau, `characters` :

| Profil | `characters` | Effet |
|---|---|---|
| `INTEGER_CAPABILITIES` (lot 6) | **false** | `'A'` reste `INVALID_EXPRESSION_TOKEN` |
| `NUMERIC_CAPABILITIES` (lot 7) | **true** | extension approuvée |
| `CONDITION_CAPABILITIES` (lots 9-10) | **true** | extension approuvée |
| `INDEX_CAPABILITIES` (lot 15) | **false** | `t['A']` reste refusé |

Le profil entier du lot 6 reste scellé, comme au lot 15. L'indice reste
une expression **entière** : `s['A']` est légal en C17, mais indexer par
une constante caractère n'a aucune valeur pédagogique ici et ouvrirait une
confusion entre le code d'un caractère et une position.

Le tokeniseur acquiert une branche gardée par cette capacité : lorsqu'elle
est déclarée, une apostrophe ouvre un littéral lu par le scanner du lot
14, d'un seul tenant. C'est nécessaire, et pas seulement pratique :
`' '` est un littéral valide que la découpe en mots couperait en deux.

---

## 6. Diagnostics

| Cas | Code | Message |
|---|---|---|
| dimension trop petite | `INSUFFICIENT_ARRAY_DIMENSION` | « La dimension doit aussi loger le caractère nul final : ce texte occupe N caractères, donc N+1 au minimum. » |
| texte sur un tableau non `char` | `STRING_REQUIRES_CHAR` | « Seul un tableau de type char peut être initialisé par un texte. » |

Réutilisés tels quels : `UNTERMINATED_STRING`, `INVALID_STRING_ESCAPE`,
`UNSUPPORTED_STRING_CONTENT`, `MISSING_ARRAY_DIMENSION`,
`INVALID_ARRAY_DIMENSION`, `INVALID_CHARACTER*`, `MISSING_INDEX`,
`INVALID_IDENTIFIER`, `C_KEYWORD_IDENTIFIER`, `UNEXPECTED_TEXT`.

Plages UTF-16 semi-ouvertes absolues dans la phrase d'origine, sans
normalisation.

---

## 7. Informations pédagogiques passives

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `NULL_TERMINATOR` | initialisation par un texte | `'\0'` est un caractère de code zéro, écrit par le compilateur à la fin du texte ; c'est lui, et non la dimension, qui marque la fin de la chaîne |
| `ARRAY_SIZE_VS_LENGTH` | initialisation par un texte | la dimension est la place réservée, la longueur est le nombre de caractères avant `'\0'` ; les deux ne coïncident pas |
| `STRING_TERMINATOR_NOT_CHECKED` | affichage `%s` | `%s` lit jusqu'au premier caractère nul ; C-A ne vérifie ni qu'il existe, ni qu'il est atteint |
| `ELEMENT_CHARACTER_FORMAT` | affichage `%c` d'un élément | `%c` affiche le caractère de ce code, `%d` afficherait le code ; aucun type n'est vérifié |
| `CHARACTER_IS_INTEGER` | littéral caractère **dans une expression** | message du lot 14, inchangé : le type est `int`, aucune valeur n'est calculée |

`CHAR_ARRAY_NOT_STRING` du lot 15 continue de ne porter que sur la
déclaration **sans** texte : un tableau initialisé par un texte **est** une
chaîne, et le dire serait faux dans l'autre sens.

Aucune information n'incrémente le compteur d'avertissements, et aucune
n'annonce une vérification qui n'existe pas.

---

## 8. Limites explicites du lot

- Aucun pointeur, aucune adresse, aucun déréférencement, aucune
  arithmétique : `&s[0]`, `*p`, `p->x` restent refusés.
- Aucune fonction de `string.h` (D4 reportée) : ni `strlen`, ni `strcpy`.
- Aucun initialiseur `{…}`, aucun tableau multidimensionnel.
- Aucune déduction de dimension, aucune troncature, aucun remplissage.
- Aucune vérification que le terminateur existe dans un tableau déclaré
  ailleurs, ni qu'un indice reste dans les bornes.
- Aucune affectation globale de chaîne après déclaration : `s = "autre";`
  n'a pas de formulation, et C17 ne l'autorise pas davantage.
- Le profil entier du lot 6 n'accepte ni indexation ni littéral caractère.
- `s['A']` reste refusé : l'indice est entier.

---

## 9. Plan de tests

Sorties exactes des trois enveloppes, avec et sans point final ; les cinq
types de tableau face à `avec le texte` ; dimensions suffisantes, tout
juste suffisantes et insuffisantes ; chaîne vide ; échappements `\"`,
`\\`, `\n`, `\t` et leur effet sur la **longueur décodée** ; trigraphes,
contrôles et demi-codets refusés ; `'\0'` accepté dans les quatre
formulations du lot 14 et dans l'enveloppe d'élément du lot 15 ; littéral
caractère accepté dans les profils numérique et condition et refusé dans
les profils entier et indice ; comparaisons `!= '\0'` et `== '\0'` ;
parcours complet avec boucle, condition, indice et affichage, document
final exact ; `%s` et `%c` ; diagnostics avec plages UTF-16 ;
verrouillage des quatre enregistrements de capacités ; les cinq
informations et leur absence ailleurs ; non-régression des lots 1 à 15 ;
refus maintenu des constructions des lots 17 et 18.
