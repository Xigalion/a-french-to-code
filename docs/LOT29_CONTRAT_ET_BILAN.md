# Lot 29 — Séparateurs d'affichage : contrat et bilan

> **Décision 5** du fondateur du 15 novembre 2026 : « Examine le problème des
> sorties successives de `printf` sans séparateur. Propose une solution
> pédagogique explicite, **sans ajouter automatiquement** des espaces ou des
> retours à la ligne que l'utilisateur n'a pas demandés. »
>
> Référence différentielle : (identifiant antérieur à la réécriture) (lot 28).

---

## 1. Chiffres réels

| Mesure | Résultat |
|---|---|
| `npm run typecheck` | **0 erreur** |
| `npm test` | **3 785 tests, 0 échec** (25 nouveaux) |
| `differentiel.mjs 82a2c33` | **1 334 722 comparaisons** |
| extensions approuvées | **145**, toutes des phrases d'affichage |
| régressions | **0** |
| `--no-loss` | **0 capacité perdue** |
| `--frozen-stages "^entier"` | **0 régression** — profil entier scellé |

## 2. Le fait qui a décidé du lot

**La capacité existait déjà.** La grammaire du texte du lot 16 accepte les
échappements, donc avant ce lot on pouvait écrire :

    Affiche le texte "\n".   →   printf("%s", "\n");

Rien n'était bloqué. Le problème observé dans l'exercice intégrateur — onze
`printf` produisant une seule suite de chiffres illisible — n'était pas un
manque de pouvoir mais un manque de **découvrabilité** et d'**explication** :
rien, nulle part, ne disait qu'un affichage n'écrit pas de séparateur, ni
qu'on pouvait en écrire un.

J'ai vérifié ce point **avant** de concevoir quoi que ce soit, et il a changé
la réponse : le lot n'ajoute presque aucune capacité, il rend visible et
enseigne celle qui existait.

## 3. Ce qui est livré

### 3.1 Une formulation explicite

    Affiche un retour à la ligne.   →   printf("\n");

Trois raisons de ne pas s'en passer, alors que `Affiche le texte "\n".`
suffisait :

1. elle est **trouvable** dans le catalogue, là où un échappement dans un
   texte ne l'était pas ;
2. elle rend l'intention lisible dans le commentaire au-dessus du code ;
3. elle produit le `printf("\n")` qu'un étudiant en C écrit vraiment.

**Pourquoi la chaîne de format est passée directement ici**, alors que tout
affichage de texte passe par `%s` : parce que `"\n"` est une constante écrite
par C-A, jamais du texte de l'auteur. La propriété de sûreté du lot 4 —
`Affiche le texte "age = %d".` produit `printf("%s", "age = %d")`, où le `%d`
est une donnée et non une conversion — est intacte, et deux tests la
vérifient à cette occasion.

`Passe à la ligne.` **reste refusée**, volontairement : elle frôle
`Passe à l'itération suivante…` et le palier 1 ne devine aucune
approximation. Sept variantes voisines sont testées comme refus.

Reconnue **avant la tokenisation**, comme `Affiche le texte`, donc la table
de règles figée du lot 4 et ses instantanés ne voient rien de nouveau. Trois
assertions de voisinage lexical le prouvent.

### 3.2 Une information passive, émise là où elle apprend quelque chose

`OUTPUT_HAS_NO_SEPARATOR` :

> Cet affichage n'écrit rien de plus que la valeur : ni espace, ni retour à
> la ligne. Deux affichages de suite se collent donc l'un à l'autre. Un
> séparateur est une instruction à part entière, que C-A n'ajoutera jamais de
> lui-même.

**Émise** sur les dix affichages qui n'écrivent jamais de séparateur :
`PRINT_INT`, `PRINT_FORMATTED`, `PRINT_CHAR`, `PRINT_STRING`,
`PRINT_POINTED`, `NUMERIC_PRINT`, `ARRAY_PRINT`, `ARRAY_PRINT_CHAR`,
`MEMBER_PRINT`, `SIZEOF_PRINT` — et sur `PRINT_TEXT` dont le texte **ne se
termine pas** par un séparateur.

**Non émise** :

- sur un texte qui finit déjà par `\n`, `\t`, `\r` ou une espace. L'auteur a
  manifestement compris ; le lui dire quand même apprendrait à ignorer le
  canal de pédagogie ;
- sur `Affiche un retour à la ligne.` : il **est** le séparateur ;
- sur tout ce qui n'affiche pas.

C'est une règle **sans état** : elle n'a pas besoin de savoir ce que la ligne
précédente faisait, ce que C-A ne peut pas savoir de toute façon.

Implantation : `explainInstruction` est devenu une enveloppe de trois lignes
qui concatène l'information de séparateur à celles de l'intention. **Aucune
branche de la chaîne existante n'a été touchée.**

## 4. Ce que le lot n'a pas fait, et c'est le cœur de la décision 5

**Aucun séparateur n'est ajouté au C produit.** Un test l'énonce sur cinq
affichages en comparant le code rendu caractère par caractère, et un autre
compose deux affichages successifs dans un document, vérifie qu'ils se
collent toujours, et qu'aucun `printf("\n")` ni `" "` n'a été inséré entre
eux.

Le seul changement observable sur un document est donc : **rien**. Seule
l'explication est nouvelle.

Je n'ai pas ajouté `Affiche un espace.` ni `Affiche une tabulation.` : elles
s'écrivent par `Affiche le texte " ".` et `"\t"`, et le problème observé
portait sur le retour à la ligne.

## 5. Tests historiques adaptés

Quatre, tous pour la même raison — une information de plus sur un affichage —
chacune documentée sur place :

| Fichier | Adaptation |
|---|---|
| `pointers.test.mjs` | `Affiche la valeur pointée par p.` attend trois codes au lieu de deux |
| `strings.test.mjs` | `Affiche le caractère de l'élément "i" de s.` idem |
| `characters.test.mjs` | la table d'informations gagne une colonne « combien » ; le test vérifie toujours que la **première** information est celle que la ligne nomme, avec sa portée exacte |
| `statementScope.test.mjs` | partition : 42 → 43 instructions |

## 6. Interaction avec le point ouvert n° 8 de l'évaluation

L'évaluation notait, au rang 8, « revoir le volume des informations : 94
informations pour 98 instructions ». **Ce lot augmente ce volume**, d'une
information par affichage sans séparateur — environ onze de plus sur
l'exercice intégrateur.

Je le signale plutôt que de le passer sous silence, et je l'assume : c'est
précisément l'information qui manquait quand la sortie de l'exercice s'est
révélée illisible. L'exemption sur les textes déjà terminés par un séparateur
limite le bruit pour qui a compris. Le volume global reste une question
d'usage réel, et c'est l'arbitrage du fondateur, conformément à la
décision 4 du 15 novembre.

## 7. Limites

- aucune formulation pour l'espace ou la tabulation seuls (§4) ;
- l'information ne sait pas si la ligne précédente était un affichage : C-A
  n'a pas d'état entre deux instructions, par construction ;
- `Passe à la ligne.` reste refusée (§3.1) ;
- rien ne garantit que la sortie soit lisible : C-A explique, il ne met pas
  en forme.
