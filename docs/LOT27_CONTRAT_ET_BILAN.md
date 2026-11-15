# Lot 27 — Champs de structure de type tableau : contrat et bilan

> **Correction de rang 2** de `docs/EVALUATION_MODELE1.md`, et décision 2 du
> fondateur du 15 novembre 2026. Référence différentielle : (identifiant antérieur à la réécriture)
> (lot 26).
>
> C'était la **seule retouche manuelle** que l'exercice intégrateur avait
> exigée : `char nom[32];`, écrit à la main parce que C-A refusait la phrase.

---

## 1. Chiffres réels

| Mesure | Résultat |
|---|---|
| `npm run typecheck` | **0 erreur** |
| `npm test` | **3 757 tests, 0 échec** (31 nouveaux) |
| `differentiel.mjs 8395696` | **1 334 689 comparaisons** |
| extensions approuvées (`/de dimension|de taille/`) | **78** |
| régressions | **0** |
| `--no-loss` | **0 capacité perdue** |
| sur-capture du motif | **0** entrée sur 78 hors motif |

## 2. Formulation

Une **queue optionnelle** sur la formulation de champ du lot 20, dans les
mots déjà employés par le tableau du lot 15 — « de dimension {entier} » :

    Ajoute un champ de type char nommé nom de dimension 32.      → char nom[32];
    Ajoute un champ de type int nommé notes de dimension 10.     → int notes[10];
    Ajoute un champ de type structure Point nommé sommets de dimension 4.
                                                                 → struct Point sommets[4];

La dimension est portée par le **déclarateur**, après le nom, comme en C17.
Le type reste exactement ce qu'il était : `{ kind: 'scalar', type: 'char' }`,
pas un type « tableau de char ».

**Aucune formulation nouvelle n'est introduite.** Un champ sans dimension
garde une sortie structurée **identique au bit près** : la clé `dimension`
est absente, et non présente à `undefined`. Un test le vérifie en comparant
la liste des clés.

## 3. Grammaire de la dimension : celle du lot 15, sans indulgence nouvelle

Même motif, `/^[1-9][0-9]*$/`, et mêmes codes de diagnostic :

| Entrée | Diagnostic |
|---|---|
| `de dimension 0.`, `-1`, `01`, `3.5`, `n`, `trois`, `0x10` | `INVALID_ARRAY_DIMENSION` |
| `de dimension.` | `MISSING_ARRAY_DIMENSION` |
| `de taille 3.` | `UNKNOWN_FORMULATION`, portée sur **`taille`** |
| `de dimension 3 et plus.` | `UNEXPECTED_TEXT` |
| `de dimension 3 de dimension 4.` | `UNEXPECTED_TEXT` |

Le cas `de taille` mérite un mot : le diagnostic porte sur le mot fautif
plutôt que d'annoncer une dimension manquante. C'est plus juste — la
dimension ne manque pas, c'est `taille` qui n'appartient pas au catalogue —
et c'était une attente **fausse de ma part**, corrigée d'après le moteur.

Aucune dimension n'est **retenue** : elle est écrite une fois et jamais
réutilisée pour vérifier un indice plus tard. `Affecte la valeur 1 à
l'élément "999" de notes.` reste accepté sur un champ de dimension 10, et un
test l'énonce pour que la forme valide ne soit jamais lue comme une garantie.

## 4. La combinaison pointeur + tableau est refusée

`int *t[10]` est un **tableau de pointeurs**, une construction qu'aucune
autre formulation du catalogue ne produit. Plutôt que de la rendre en
silence :

    Ajoute un champ pointeur de type int nommé donnees de dimension 10.
      → UNSUPPORTED_POINTER_ARRAY_FIELD
        « Un champ ne peut pas être à la fois un pointeur et un tableau :
          C-A ne produit pas de tableau de pointeurs. »

Le message dit la règle et **ne donne pas la phrase correcte** ; un test
interdit « essayez / écrivez / remplacez / supprimez » dans son texte. Un
champ pointeur **sans** dimension est inchangé.

## 5. Informations pédagogiques : aucun message inventé

Deux informations pour un champ tableau, trois si le type est `char`, toutes
en `severity: 'information'`, donc jamais comptées comme avertissements.
Les trois **codes existent déjà** pour la déclaration de tableau du lot 15 ;
seul le libellé est écrit pour un champ :

| Code | Ce qu'elle dit |
|---|---|
| `ARRAY_NOT_ASSIGNABLE` | un champ tableau ne s'affecte pas globalement — et copier la structure entière copie le tableau, ce qui **n'est pas** le cas d'un champ pointeur |
| `STRUCT_ARRAY_LAYOUT` | la dimension entre dans la taille de la structure, C-A ne la retient pas, aucun élément n'est initialisé |
| `CHAR_ARRAY_NOT_STRING` | un `char[n]` n'est une chaîne que si l'un de ses éléments vaut le caractère nul, et C-A ne l'écrit pas |

La première porte sur le nom, la deuxième sur **le nombre**, ce qu'un test
vérifie par sa plage UTF-16. Un champ scalaire n'émet **aucune** information
nouvelle : `explainInstruction` retourne `[]` comme avant.

## 6. Placement : rien n'a changé

Un champ tableau est un champ. Il passe par `resolveStructTarget` comme
avant, capture la même `structTarget` dans le plan, et reste refusé avec
`FIELD_OUTSIDE_STRUCT` hors d'une structure — document vide, corps de
fonction, structure refermée.

Aucune ligne de `structTarget.ts`, `planPlacement.ts` ni du balayage partagé
n'est touchée.

## 7. Ce que le lot ferme : la retouche manuelle de l'exercice

Un test écrit la structure `Eleve` de l'exercice intégrateur **entièrement
avec C-A**, les quatre champs par les quatre phrases, et vérifie qu'aucun
`=` n'apparaît — donc aucun initialiseur inventé — et que chaque phrase
figure en commentaire :

    struct Eleve {
        // Ajoute un champ de type char nommé nom de dimension 32.
        char nom[32];
        // Ajoute un champ de type int nommé note.
        int note;
        // Ajoute un champ de type char nommé initiale.
        char initiale;
        // Ajoute un champ pointeur de type structure Eleve nommé suivant.
        struct Eleve *suivant;
    };

`exercice/retoucher.mjs` et `exercice/retouches.md` deviennent donc
**sans objet** pour cette ligne. Ils sont conservés tant que la campagne 2
n'a pas été exécutée, pour que la campagne 1 reste lisible telle qu'elle
s'est déroulée ; la campagne 2 dira si une retouche subsiste.

## 8. Corpus différentiel étendu

Le motif `/de dimension|de taille/` ne capturait **rien** au premier essai :
le corpus de `differentiel.mjs` contenait des phrases de champ, mais aucune
avec une dimension. Un différentiel à 0 extension aurait prouvé l'absence de
régression sans couvrir la capacité nouvelle — et je l'aurais présenté comme
une validation.

Le corpus a donc été étendu : neuf dimensions valides et fautives, la forme
`de taille`, et la combinaison pointeur + dimension, pour chacun des types.
D'où les 78 extensions, auditées avec `--all` : **aucune** des 78 ne sort du
motif.

## 9. Limites, après ce lot

- **pas** de dimension déduite (`char s[] = "…"`), **pas** de liste
  d'initialisation `{…}`, **pas** de plusieurs dimensions — tous refusés, et
  trois tests le vérifient ;
- **pas** de tableau de pointeurs, par la décision du §4 ;
- aucune vérification de borne, ni ici ni ailleurs ;
- une déclaration ordinaire reste plaçable entre les accolades d'une
  structure, où seul un champ est valide en C17. Limite du lot 26, inchangée.
