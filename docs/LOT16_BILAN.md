# Lot 16 — Chaînes C17, caractère nul, affichage et parcours — bilan

**Livré le 13 novembre 2026.** Contrat exécuté :
`docs/LOT16_CONTRAT_PROPOSE.md`.

Chiffres réels : **2 977 tests Node réussis, 0 échec** (2 889 au lot 15).
**1 326 876 comparaisons différentielles**, **0 régression**, **0 capacité
perdue**, contre le lot 15, contre le lot 14 et contre la référence
d'avant le lot 13. **97 tests hôte VS Code toujours non exécutés.**

---

## 1. Fichiers

**Créés**

| Fichier | Rôle |
|---|---|
| `src/stringLiteral.ts` | scanner et encodeur de texte, **partagés** avec `Affiche le texte` |
| `test/strings.test.mjs` | 93 tests, neuf sections |
| `docs/LOT16_CONTRAT_PROPOSE.md` | contrat exécuté |
| `docs/LOT16_BILAN.md` | ce document |

**Modifiés**

| Fichier | Nature |
|---|---|
| `src/characterLiteral.ts` | `\0` ajouté à la grammaire finie, message mis à jour |
| `src/expressionCore.ts` | capacité `characters`, branche de tokenisation gardée, nœud `character` |
| `src/numericExpression.ts` | variante `character`, rendu |
| `src/arrayInstructions.ts` | trois enveloppes, contrôle de dimension |
| `src/translate.ts` | union, codes, rendus, `translateLiteral` réduit à son enveloppe |
| `src/pedagogicalInformation.ts` | quatre informations nouvelles, balayage des littéraux |
| `src/calculationAdvisories.ts` | intention d'affichage de caractère |
| `scripts/differentiel.mjs` | corpus des textes élargi, corpus du lot |
| `package.json` | enregistrement de `test/strings.test.mjs` |
| `test/characters.test.mjs`, `test/expressionCore.test.mjs`, `test/arrays.test.mjs` | cinq refus historiques adaptés, commentés sur place |
| `docs/CATALOGUE.md`, `CLAUDE.md` | documentation |

**Non modifiés** : `planPlacement.ts`, `placementLexical.ts`,
`enclosingStructures.ts`, `branchTarget.ts`, `loopTarget.ts`,
`functionContext.ts`, `expression.ts`, `condition.ts`,
`characterInstructions.ts`, `functionInstructions.ts`,
`numericInstructions.ts`, et **tout `extension/`**. Instantanés des lots 4
à 6 intacts.

---

## 2. Formulations et sorties, telles que le moteur les produit

| Phrase française | Code C | Information |
|---|---|---|
| `Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".` | `char s[6] = "hello";` | `NULL_TERMINATOR`, `ARRAY_SIZE_VS_LENGTH` |
| `Affiche la chaîne s.` | `printf("%s", s);` | `STRING_TERMINATOR_NOT_CHECKED` |
| `Affiche le caractère de l'élément "i" de s.` | `printf("%c", s[i]);` | `INDEX_NOT_CHECKED`, `ELEMENT_CHARACTER_FORMAT` |
| `Crée un caractère nommé fin de valeur '\0'.` | `char fin = '\0';` | `CHARACTER_IS_INTEGER` |
| `Affecte le caractère '\0' à l'élément "5" de s.` | `s[5] = '\0';` | `INDEX_NOT_CHECKED` |
| `Crée un bloc si "s[i] != '\0'".` | `if (s[i] != '\0') { … }` | `INDEX_NOT_CHECKED`, `CHARACTER_IS_INTEGER` |
| `Crée une boucle tant que "s[i] != '\0'".` | `while (s[i] != '\0') { … }` | + `WHILE_PRETEST` |
| `Affecte à n le résultat numérique de "'z' - 'a'".` | `n = ('z' - 'a');` | `CHARACTER_IS_INTEGER` |

`'\0'` n'est jamais remplacé par `0` : un test vérifie qu'aucun code
numérique n'apparaît dans le C produit.

### Le parcours est composé, pas commandé

Un test place les six instructions d'un parcours complet et compare le
document final caractère par caractère :

    int main(void) {
        // Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".
        char s[6] = "hello";
        // Déclare un entier nommé i.
        int i;
        // Affecte la valeur 0 à i.
        i = 0;
        // Crée une boucle tant que "s[i] != '\0'".
        while (s[i] != '\0') {
            // Affiche le caractère de l'élément "i" de s.
            printf("%c", s[i]);
            // Affecte à i le résultat numérique de "i + 1".
            i = (i + 1);
            
        }
    }

Aucune commande de parcours n'existe, et un test refuse quatre
formulations qui en auraient tenu lieu.

---

## 3. Capacités du parseur

Un champ nouveau, `characters` :

| Profil | `characters` |
|---|---|
| `INTEGER_CAPABILITIES` | **false** |
| `NUMERIC_CAPABILITIES` | **true** |
| `CONDITION_CAPABILITIES` | **true** |
| `INDEX_CAPABILITIES` | **false** |

Les quatre enregistrements restent verrouillés par égalité stricte.

Le tokeniseur reçoit une branche **gardée par cette capacité** : lorsque
`characters` est déclarée, une apostrophe ouvre un littéral lu d'un seul
tenant par le scanner du lot 14. C'est nécessaire et pas seulement
commode : `' '` est un littéral valide que la découpe en mots couperait en
deux. Un test l'exerce explicitement.

`s['A']` reste refusé. C17 l'autorise, puisqu'une constante caractère a le
type `int`, mais indexer par un code de caractère n'a aucune valeur
pédagogique ici et confondrait un code et une position.

---

## 4. Le scanner de texte est devenu partagé

`Affiche le texte "…"` et l'initialisation de chaîne lisent désormais le
même `parseStringLiteral` et écrivent avec le même `renderStringLiteral`.
`translateLiteral` est réduit à son enveloppe : neuf lignes au lieu de
quarante-cinq.

Une refonte censée ne rien changer ne se prouve pas par les tests que
l'ancien code passait déjà. Deux mesures l'ont établie :

1. Le motif d'extensions a été relancé **sans le mot `texte`**, pour que
   toute divergence sur `Affiche le texte "…"` tombe dans les régressions
   au lieu d'être absoute. Résultat identique : **0 régression**, et le
   même nombre d'extensions, donc aucune de ces entrées n'a divergé.
2. Le corpus de textes du différentiel est passé de 6 à 35 contenus, dont
   les quatre échappements isolés et combinés, les trigraphes, les
   contrôles, un demi-codet isolé, l'apostrophe et les accolades, chacun
   décliné en quatre phrases. La première mutation de contrôle n'était
   détectée que par **une seule** entrée avant cet élargissement ; elle
   l'est par treize ensuite.

---

## 5. Tests

`npm run check` : **2 977 tests, 2 977 réussis, 0 échec.**
`test/strings.test.mjs` en apporte 93, en neuf sections : sorties exactes
avec et sans point final ; dimensions suffisantes, tout juste suffisantes
et insuffisantes, avec la plage du diagnostic ; longueur **décodée** et
non tapée ; refus du texte sur quatre types non `char` ; distinction des
verbes `Déclare` et `Crée` ; grammaire du texte, neuf contenus acceptés et
cinq refusés, avec stabilité du réencodage ; `'\0'` dans les trois
enveloppes qui l'accueillent ; huit formulations à littéral caractère en
expression ; fermeture des profils entier et indice ; sept diagnostics de
littéral en expression avec plages UTF-16 ; refus des lots 17 et 18 ;
cinq informations et leur absence ailleurs ; parcours complet avec
document final exact ; placement sur quatre combinaisons ; huit
non-régressions voisines.

### Tests historiques adaptés

Cinq, tous portant sur des refus que les décisions 1, 2 et 4 ouvrent
délibérément, chacun commenté sur place :

| Fichier | Entrée retirée | Remplacement |
|---|---|---|
| `test/characters.test.mjs` | `'\0'` dans les refus de littéral | acceptation vérifiée en §4 de `strings.test.mjs` |
| `test/characters.test.mjs` | `'A'` et `'\n'` dans « lots 15 à 18 fermés » | test dédié au **profil entier** seul |
| `test/characters.test.mjs` | « refusé dans toutes les enveloppes d'expression » | « refusé dans le profil entier » |
| `test/characters.test.mjs` | `Affiche la chaîne s.` hors catalogue | déclaration de chaîne sans dimension, toujours hors catalogue |
| `test/expressionCore.test.mjs` | `'A'` dans `REFUSED` | profil entier seul |
| `test/arrays.test.mjs` | `'A'` dans « lots 16 à 18 fermés » | `t['A']` conservé : l'indice reste entier |

Aucun autre test existant n'a été touché, aucun instantané régénéré.

---

## 6. Différentiel

Commande :

    node scripts/differentiel.mjs <ref> \
      --extensions "'|élément|chaîne|caract|char|tableau|\[|\]" \
      --frozen-stages "^entier" --no-loss

| Référence | Comparaisons | Extensions | Régressions | Capacités perdues |
|---|---|---|---|---|
| `HEAD` (lot 15) | 1 326 876 | 15 418 | **0** | **0** |
| lot 14 | 1 326 462 | 18 382 | **0** | **0** |
| avant le lot 13 | 1 326 462 | 18 856 | **0** | **0** |

Le nombre d'extensions est élevé parce qu'une apostrophe apparaît dans
beaucoup d'entrées du corpus aléatoire ; c'est précisément pourquoi le
seau approuvé n'est pas cru sur parole et reste encadré par les deux
audits.

### Validation du harnais par mutation

| Mutation | Détection |
|---|---|
| `characters: true` dans le profil entier (fuite) | **3 636 régressions**, grâce à `--frozen-stages` |
| échappement `\n` retiré de la grammaire du texte | **13 régressions** après élargissement du corpus, **1 seule** avant |
| `printf("%s"` devenu `printf("%S"` | 12 régressions |

Témoin après restauration : 0 régression, 0 capacité perdue.

---

## 7. Informations pédagogiques et limites

| Code | Déclenchement | Ancrage |
|---|---|---|
| `NULL_TERMINATOR` | initialisation par un texte | le texte |
| `ARRAY_SIZE_VS_LENGTH` | initialisation par un texte | la dimension |
| `STRING_TERMINATOR_NOT_CHECKED` | `%s` | le nom |
| `ELEMENT_CHARACTER_FORMAT` | `%c` d'un élément | la désignation de l'indice |
| `CHARACTER_IS_INTEGER` | littéral caractère en expression | le littéral |

`ARRAY_SIZE_VS_LENGTH` cite les deux nombres réels de la phrase, la
dimension et la longueur, sans en recalculer aucun par la suite.
`CHAR_ARRAY_NOT_STRING` du lot 15 **ne se déclenche pas** sur une
initialisation par texte : un tableau initialisé ainsi **est** une chaîne,
et les deux déclarations enseignent les deux moitiés du même fait. Un test
vérifie les deux sens.

Aucune information n'incrémente le compteur d'avertissements, et un test
refuse tout vocabulaire de vérification dans le message de `%s`.

### Limites connues

- Aucun pointeur, adresse, déréférencement ni arithmétique.
- Aucune fonction de `string.h` : D4 reste reportée.
- Aucun initialiseur `{…}`, aucun tableau multidimensionnel, aucune
  dimension déduite (`char s[] = "…"` n'a pas de formulation).
- Aucune affectation globale de chaîne après déclaration, ce que C17
  n'autorise pas davantage.
- Aucune vérification qu'un tableau déclaré ailleurs contient un
  terminateur, ni qu'un indice reste dans les bornes.
- Le profil entier et le profil d'indice restent fermés aux littéraux
  caractères ; `s['A']` est refusé.
- Le refus de `char s[5] = "hello";` est **pédagogique** et non une règle
  de C17 ; le diagnostic le dit, mais C-A n'offre aucun moyen d'écrire ce
  tableau non terminé.
- `Affiche la chaîne s.` ne vérifie pas que `s` est un tableau de `char`.

Héritées et toujours ouvertes : recette GCC du domaine « Expressions et
calculs » ; recettes manuelles des domaines 3 et 4 et du lot 10 ;
qualification des avertissements de l'hôte VS Code (`mutex already
exists`, DEP0168/N-API) ; absence de toute vérification générale des
types, symboles et portées ; confirmation en recette de la compatibilité
C17 des fonctions ; exercice de synthèse final.

---

## 8. Décisions nécessaires pour le lot 17

1. **`NULL` et `stddef.h`.** D3 laissait l'alternative ouverte : pointeur
   nul explicite avec `stddef.h`, ou refusé. Seul `stdio.h` est pris en
   charge aujourd'hui et `UNSUPPORTED_HEADER` est testé ; ouvrir un
   deuxième en-tête est une décision en soi.
2. **La déclaration de pointeur.** `int* p;` ou `int *p;` — le C produit
   doit choisir une écriture, et ce choix est enseignant. Je recommande
   `int *p;`, qui rend visible que l'étoile tient au déclarateur et non au
   type, mais c'est un arbitrage pédagogique à trancher.
3. **Le retour de type pointeur reste refusé** selon D3, car
   `functionContext` lit le type déclaré par mots et s'arrête sur `*`.
   Confirmer que le lot 17 ne l'ouvre pas, sous peine d'un lot à lui seul.
4. **`&` et `*` dans les profils.** Même question qu'aux lots 15 et 16 :
   quels profils, et le profil entier reste-t-il scellé ? Il l'est depuis
   trois lots ; je recommande de le maintenir.

Aucune n'est bloquante pour la revue du lot 16. **Aucune ligne du lot 17
n'est écrite.**
