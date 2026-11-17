# Lot P0 — extraire le rendu C17, et rien d'autre

**Pour qui :** le fondateur, et quiconque relira ce lot pour comprendre
pourquoi il ne change rien.

> Branche `phase-2-architecture`. `main` reste la V1 publique.
> Date : 17 novembre 2026.

---

## 1. Objet

Déplacer les **198 lignes** qui écrivent du C17 hors de l'analyseur, dans un
module dédié. C'est le préalable mécanique à tout second langage : tant que
le rendu vit au milieu de `translate.ts`, un deuxième rendu ne peut pas
exister sans toucher l'analyseur.

**Le lot ne livre aucune capacité.** Aucune formulation nouvelle, aucun
diagnostic nouveau, aucune sortie modifiée. Un lot qui change quelque chose a
échoué.

## 2. Ce qui bouge, exactement

| Avant | Après |
|---|---|
| `render()` dans `src/translate.ts`, 198 lignes, 84 cas | `renderC17()` dans `src/langages/c17/rendu.ts` |
| `translate.ts` : analyse **et** rendu, 857 lignes | `translate.ts` : analyse, assemblage du fragment, curseur |
| `type DisplayFormat` privé | `export type DisplayFormat`, pour que le rendu l'importe |

Le **texte du `switch` est déplacé sans être retouché** : l'extraction est
faite par script, pas à la main, pour qu'aucune ligne ne soit réécrite de
mémoire.

## 3. Ce qui ne bouge pas

- l'assemblage du fragment (`// phrase` + code, identifiant, texte complet) ;
- le **curseur** des blocs, qui dépend de `BLOCK_KINDS` et reste dans
  `translate.ts` ;
- les cinq fonctions de rendu d'expression, de condition, de littéral, de
  cible de membre et de type mesuré : elles vivent déjà dans leurs modules et
  n'ont aucune raison de bouger ;
- **aucun** fichier de test ;
- **aucun** instantané gelé.

## 4. Preuve exigée

| Contrôle | Exigence |
|---|---|
| `npm run check` | **3 834 tests**, 0 échec |
| `node scripts/differentiel.mjs v0.4.0 --no-loss --all` | **0 régression, 0 extension, 0 capacité perdue** |
| `--frozen-stages "^entier"` | profil entier intact |
| instantanés des lots 4, 5, 6 | inchangés, à l'octet |
| `git diff` sur `test/` | **vide** |

**Zéro extension est une exigence, pas une observation.** Dans les lots
précédents, une extension signalait une capacité nouvelle, approuvée par un
motif. Ici, toute divergence — dans un sens ou dans l'autre — est un défaut
d'extraction.

## 5. Ce que le lot prépare, sans le faire

- le **registre de langages** (P1) : il pourra appeler `renderC17` comme une
  implémentation parmi d'autres ;
- un **rendu Python** (P3) : il s'écrira à côté, sans toucher à `translate.ts` ;
- la **coexistence des deux représentations de littéraux** (`integer` et
  `literal`), acceptée par décision du fondateur : chaque rendu traite les
  deux noms, et le profil entier gelé n'est pas touché.

---

# Bilan du lot P0 — livré le 17 novembre 2026

| Mesure | Valeur |
|---|---|
| `src/translate.ts` | **857 → 676 lignes** (−192, +12) |
| `src/langages/c17/rendu.ts` | **206 lignes**, 84 cas, nouveau |
| fichiers de test touchés | **0** |
| instantanés gelés touchés | **0** |
| `npm run check` | **3 834 tests, 0 échec** |
| différentiel contre `v0.4.0` | **1 335 559 comparaisons** |
| régressions | **0** |
| extensions | **0** |
| capacités perdues (`--no-loss`) | **0** |
| profil entier (`--frozen-stages "^entier"`) | **intact** |

**Le lot ne change rien, et c'est prouvé sur 1,3 million de comparaisons** :
arbres d'intention, codes de diagnostic, messages, intervalles UTF-16,
budgets de jetons, fragments produits **et** plans de placement.

## Comment l'extraction a été faite

Par **script**, pas à la main : le texte du `switch` a été déplacé tel quel,
sans qu'une ligne soit retapée. Les seules modifications écrites
manuellement sont :

1. l'en-tête du nouveau module et ses sept imports ;
2. dans `translate.ts`, le `switch` remplacé par `const code = renderC17(instruction);` ;
3. `type DisplayFormat` devenu `export type DisplayFormat`, pour que le rendu
   l'importe ;
4. six imports de `translate.ts` nettoyés — les cinq fonctions de rendu
   d'expression ne sont plus appelées que par le module de rendu. Le
   typecheck l'a signalé, ligne par ligne.

## Ce que le lot a confirmé de l'audit

L'audit mesurait **198 lignes** de rendu C sur 5 745. Le module fait **206
lignes**, en-tête et imports compris. L'estimation était juste à 4 %, et
l'extraction n'a demandé **aucune réorganisation** du reste : la fonction ne
dépendait que de cinq fonctions de rendu déjà extérieures, et d'aucun état
local de `translate.ts`.

C'est la meilleure nouvelle possible pour la suite : **le couplage mesuré
était le couplage réel.**
