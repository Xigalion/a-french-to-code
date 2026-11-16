# Lot 32 — le champ d'un élément de tableau de structures

> Contrat et bilan dans un seul document, parce que le lot ferme **une**
> asymétrie trouvée par l'exercice de clôture et ne touche rien d'autre.
>
> Date : 16 novembre 2026. Référence différentielle : (identifiant antérieur à la réécriture).

---

## 1. La lacune, telle que l'exercice l'a montrée

L'exercice de clôture (`exercice/promotion/`) est écrit comme un programmeur
C écrirait une gestion de notes : un **tableau de structures** pour la
promotion. À la première exécution du générateur, trois phrases ont été
refusées sur 101 :

    Affecte au champ total de l’élément "i" de promo le résultat numérique de "total".
      → INVALID_IDENTIFIER
    Affecte au champ initiale de l’élément "i" de promo le résultat numérique de "initiales[i]".
      → INVALID_IDENTIFIER
    Affiche le caractère du champ initiale de l’élément "meilleur" de promo.
      → UNEXPECTED_TEXT

Les deux premières sont **une seule** lacune, et elle est grave :
`promo[i].total` se **lisait** depuis le lot 20 — dans une condition, dans
un argument d'appel, dans une expression numérique — mais ne pouvait pas
être **écrit**. Un tableau de structures était donc déclarable par le lot 24
et **jamais remplissable**.

C'est exactement la forme du défaut que le lot 31 avait corrigé : le lot 23
avait livré le *prototype* d'une fonction interne sans sa *définition*. Une
capacité livrée à moitié n'est pas une limitation documentée, c'est un
défaut.

La troisième phrase est **hors périmètre** : aucune formulation n'affiche un
champ en `%c`, pas même sur une structure simple. Un champ `char` s'affiche
avec `%d`. Limitation documentée, non corrigée ici, et l'exercice emploie la
forme disponible.

## 2. Contrat

### 2.1 Ce que le lot ajoute

**Aucune enveloppe nouvelle.** Une **troisième forme d'objet** pour les
quatre enveloppes `MEMBER_*` du lot 20 :

| Formulation | Code C |
|---|---|
| `Affecte la valeur {entier} au champ {nom} de l’élément "{indice}" de {nom}.` | `promo[0].total = 5;` |
| `Affecte le caractère {littéral} au champ {nom} de l’élément "{indice}" de {nom}.` | `promo[i].initiale = 'A';` |
| `Affecte au champ {nom} de l’élément "{indice}" de {nom} le résultat numérique de "{expr}".` | `promo[(i + 1)].total = t;` |
| `Affiche le champ {nom} de l’élément "{indice}" de {nom}.` | `printf("%d", promo[meilleur].total);` |

L'indice est analysé par le **profil d'indice du lot 15**, inchangé : un
littéral caractère, un déréférencement ou une adresse y restent fermés, avec
les codes de ce profil et non des codes nouveaux.

### 2.2 Ce que le lot n'ajoute pas, et pourquoi

| Non livré | Raison |
|---|---|
| `promo[i]->x` | exigerait un **tableau de pointeurs**, qu'aucune formulation ne déclare. La flèche n'est donc pas offerte sur un élément. |
| affichage d'un champ en `%c` | n'existe pour **aucun** objet, pas même simple. Hors sujet ici. |
| `Lis un entier … dans l’élément "i" de t.` | la désignation d'élément comme cible de **lecture de fichier** est un autre manque, mesuré et laissé ouvert. |
| `Écris la valeur de l’élément "i" de t …` | idem, côté écriture. |
| élément ← résultat d'un **appel** | idem. Contournement d'une ligne : affecter à un scalaire, puis à l'élément. |

Ces quatre manques sont **tenus par un test** (`test/structElement.test.mjs`,
dernier cas) : les nommer empêche de les croire livrés.

### 2.3 Décision d'architecture

Le lecteur de désignation `"{indice}" de {nom}` vivait dans
`arrayInstructions.ts`. Il est **extrait** dans `src/elementDesignation.ts`
et appelé par les deux analyseurs. Une seconde copie aurait divergé, et la
redondance mesurée du lot 30 (0 code, 0 message répétés) serait perdue.

`MemberTarget` gagne un champ **optionnel** `element`. Quand il est absent,
la forme structurée est octet pour octet celle du lot 20 — c'est ce que le
différentiel vérifie.

### 2.4 Information pédagogique

La leçon de bornes du lot 15, `INDEX_NOT_CHECKED`, est émise **en premier**,
ancrée sur la désignation entre guillemets, parce que l'indice est lu avant
le champ. Son texte est désormais une **constante partagée** : un message dit
deux fois serait une redondance.

Aucun avertissement, aucune vérification nouvelle. C-A ne sait toujours ni
si `promo` existe, ni s'il a ce champ, ni si l'indice est dans les bornes.

## 3. Bilan

| | |
|---|---|
| fichiers moteur touchés | `elementDesignation.ts` (nouveau), `arrayInstructions.ts`, `structInstructions.ts`, `pedagogicalInformation.ts` |
| intentions nouvelles | **0** |
| formulations nouvelles | **4** |
| tests Node | **3 834**, 0 échec (dont 10 nouveaux, `test/structElement.test.mjs`) |
| tests historiques adaptés | **0** |
| comparaisons différentielles | **1 335 559** contre (identifiant antérieur à la réécriture) |
| extensions approuvées | **154** (motif `champ .* de l’élément`) |
| régressions | **0** |
| capacités perdues (`--no-loss`) | **0** |
| profil entier (`--frozen-stages "^entier"`) | **intact** |

Les 154 extensions sont de deux sortes seulement : un refus
`INVALID_IDENTIFIER` devenu une acceptation, et les informations qui
l'accompagnent. Aucune n'est un changement de traduction d'une phrase déjà
acceptée.

### 3.1 Preuve par l'exercice

Après le lot, l'exercice de clôture passe de **3 refus** à **0**, écrit
`promo[i].total = total;` et `promo[i].initiale = initiales[i];`, compile en
`-std=c17 -Wall -Wextra -pedantic` **sans un avertissement**, s'exécute en
code 0 et produit la sortie calculée à la main.

Le corpus différentiel a été étendu à **18 formes** de la désignation, dont
onze malformées : sans cela, le différentiel aurait prouvé l'absence de
régression sans couvrir ce que le lot livre.

## 4. Ce que ce lot ne prouve pas

- que `promo[i].total` soit **valide** : ni le tableau, ni le champ, ni
  l'indice ne sont vérifiés, et le test le dit ;
- que la désignation d'élément soit disponible **partout** où un nom est
  attendu. Elle ne l'est pas, et §2.2 liste où elle manque ;
- que l'asymétrie lecture/écriture ait été cherchée **systématiquement** :
  elle a été trouvée par un exercice. Un audit des autres asymétries du même
  genre reste à faire, et n'est pas dans ce lot.
