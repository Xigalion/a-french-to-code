# Lot 26 — Portée des instructions : bilan

> Contrat : `docs/LOT26_CONTRAT_PROPOSE.md`. Référence différentielle :
> (identifiant antérieur à la réécriture). **Premier lot du projet qui retire des placements**, par la
> décision 1 du fondateur du 15 novembre 2026.

---

## 1. Chiffres réels

| Mesure | Résultat |
|---|---|
| `npm run typecheck` | **0 erreur** |
| `npm test` | **3 726 tests, 0 échec** (3 581 avant le lot, dont 145 nouveaux) |
| `npm run test:vscode` | voir §6 |
| `differentiel.mjs a5712f5` | **1 334 392 comparaisons**, 1 036 divergences |
| divergences au stade **traduction** | **0** |
| divergences au stade **placement** | 1 036, **toutes** auditées |
| refus apparus **à l'intérieur d'une fonction** | **0** |

## 2. Ce qui est livré

Un module, `src/statementScope.ts`, qui répond à **une** question :
une instruction exécutable peut-elle figurer sur la ligne cible ?

Il est bâti sur `scanEnclosing` **sans le modifier** — donc sans relâcher
ni durcir aucun des cinq reconnaisseurs contextuels existants — et il
publie la partition des 81 genres du catalogue en trois ensembles :
**24** déclarations, **42** instructions, **15** genres déjà vérifiés
avant ce lot.

Un diagnostic nouveau, `STATEMENT_AT_FILE_SCOPE`, avec deux messages selon
que des accolades sont ouvertes ou non. Les deux énoncent la règle C17 et
**ne donnent pas la phrase correcte à recopier** : un test l'impose
(`/essayez|écrivez|remplacez/` interdit dans le message).

`checkStatementPosition` n'est pas appliqué aux instructions : un corps de
boucle ou de `si` **sans accolades** reste un emplacement valide, et trois
tests le vérifient. L'y refuser aurait retiré une capacité sans rapport
avec la portée.

## 3. L'audit des 1 036 divergences

Le contrat exigeait de les instruire une par une, pas de leur faire
confiance. Un oracle de profondeur d'accolades **écrit indépendamment** de
`src/` — il ne partage aucune ligne avec `resolveStatementScope` — a
reclassé chaque couple (document, curseur) :

| Classement | Nombre | Code émis |
|---|---|---|
| portée fichier, **aucune** accolade ouverte | **1 008** | `STATEMENT_AT_FILE_SCOPE` |
| accolade fermante orpheline (`} } {`) | **28** | `UNSUPPORTED_ENCLOSING_CONTEXT` |
| **refus à l'intérieur d'une fonction** | **0** | — |
| non couvert par le tableau du contrat | **0** | — |

L'audit a porté sur **1 036 sur 1 036**. Le point qui comptait était le
troisième : le corpus du harnais contient des documents comme
`int main(void) {\n\n}\n`, où selon le curseur la cible est **dans** le
corps ou **après** l'accolade fermante. Un refus du premier cas aurait été
une régression réelle. Il n'y en a aucun.

Le corpus du harnais ne produit pas de document à accolades ouvertes sans
fonction (corps de structure) : ce chemin est couvert par les tests
unitaires, pas par le différentiel.

## 4. Les tests historiques adaptés, et pourquoi

**163 tests ont échoué** au premier passage. Aucun n'a été supprimé ni
affaibli. Tous encodaient l'ancien comportement : ils plaçaient une
instruction dans un **document vide**, donc à la portée fichier. Chaque
adaptation porte sa raison **en commentaire sur place**.

| Fichier | Adaptation |
|---|---|
| `condition.test.mjs` | fixture `corps()` ; 24 tests de mécanique replacés dans un corps |
| `session.test.mjs` | fixture `inMain()` ; 23 tests de cycle de session |
| `placement.test.mjs` | `tete(phrase)` : seule `phrases[3]` est une instruction |
| `display.test.mjs` | 10 tests d'affichage replacés dans un corps |
| `loops`, `forLoop`, `doWhile` | « fichier vide, aucun main implicite » : refus **puis** rendu dans un corps |
| `switch`, `files`, `reliability`, `memory`, `arrayPointer` | la ligne « document vide » devient le corps de fonction minimal |
| `functions.test.mjs` | ancien test **scindé** en deux (§4.1) |

### 4.1 Le seul contrat amendé

`test/functions.test.mjs` affirmait : « les autres intentions historiques
ignorent toujours les accolades ». C'était le **contrat du lot 2**, et il
est désormais partiellement faux. Le test est scindé, sans rien perdre :

- « les **déclarations** historiques ignorent toujours les accolades » —
  ce qui subsiste du lot 2, vérifié dans `int main(void) {`, `} } {` et
  `struct P { int x;` ;
- « lot 26 : les **instructions exécutables** ne les ignorent plus » —
  l'autre moitié, qui vérifie le placement dans un corps ouvert et le
  refus partout ailleurs.

Deux cas ont été conservés comme **refus vérifiés** plutôt que contournés :

- `placement.test.mjs`, repli de fin de ligne : un document **sans aucune
  fin de ligne** ne peut pas porter à la fois un en-tête de fonction et une
  ligne blanche cible. Le repli CRLF est donc hors d'atteinte pour une
  instruction. Le test l'énonce et vérifie le refus ;
- `une erreur C ne devient pas un refus de l'interface` : son sujet est
  intact — `absent` n'est déclaré nulle part, C-A ne vérifie aucun symbole,
  l'aperçu est produit. Son assertion « aucun main » est devenue un
  **comptage** : le seul `main` présent est celui que l'auteur a écrit.

## 5. Un défaut trouvé en classant : `MEMBER_ASSIGN_CHAR` est mort

En établissant la partition, un genre s'est révélé **déclaré mais
inatteignable**. `MEMBER_ASSIGN_CHAR` existe dans le type
`StructInstruction` (`src/structInstructions.ts:21`) et `translate.ts`
sait le rendre (`src/translate.ts:341`), mais **aucun analyseur ne le
construit** : aucune phrase française n'y mène. Vérifié sur les deux
formulations plausibles, toutes deux `UNKNOWN_FORMULATION`.

C'est pourquoi le catalogue atteint **80** genres et le moteur en déclare
**81**.

Je ne l'ai **pas** supprimé et **pas** implémenté : les deux dépassent le
mandat du lot. Il est classé parmi les instructions pour que la partition
soit complète, et un test nommé interdit de le présenter comme disponible
(`lot 26 : MEMBER_ASSIGN_CHAR est déclaré mais inatteignable`). Décision à
prendre : câbler la formulation, ou retirer le genre mort.

## 6. Suite hôte

Voir le journal `exercice/journal/hote-lot26.txt`. La suite a été relancée
parce que le lot change le placement, donc le comportement de bout en bout.

## 7. Limites, inchangées ou nouvelles

- une **déclaration** reste plaçable entre les accolades d'une structure,
  où seule une déclaration de champ est valide en C17. Hors mandat ;
- **aucune** vérification de symboles : `Affecte la valeur 5 à x.` dans une
  fonction où `x` n'existe pas reste acceptée, et trois tests l'affirment
  explicitement pour que la portée valide ne soit **jamais** présentée
  comme une garantie de compilation ;
- `sinon` et `sinon si` ne demandent toujours pas de fonction englobante :
  ils demandent une chaîne `si`. Une chaîne écrite à la main à la portée
  fichier garderait donc son `sinon`. Le `si` lui-même y est maintenant
  refusé, ce qui ferme le chemin par C-A mais pas le cas écrit à la main ;
- la fraîcheur du plan d'une instruction repose sur l'égalité du texte du
  document, pas sur une reconstruction contextuelle. Argumenté au §5 du
  contrat, et vérifié par un test.
