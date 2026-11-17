« Written for: le fondateur, pour décider si la V1 passe en test
utilisateur. »

# V1 — livraison après la campagne 3

> Suite de `docs/V1_LIVRAISON.md` (lots 26 à 29, campagne 2, 83,7 %).
> Détail : `docs/CAMPAGNE3_VALIDATION.md`. Audit du barème, séparé :
> `docs/AUDIT_BAREME.md`.
>
> Date : 16 novembre 2026.

---

## 1. Corrections effectuées et leurs commits

| Commit | Contenu |
|---|---|
| `lots-30-31` | **lots 30 et 31** — audit des intentions inaccessibles, `MEMBER_ASSIGN_CHAR`, information sur l'arithmétique des pointeurs, réduction de la clause en double, cause de l'instabilité hôte, définition de fonction interne, lecture de chaîne bornée, correctif du type de retour `static` |

Détail des six corrections autorisées :

| # | Autorisation | Fait | Preuve |
|---|---|---|---|
| 1 | rendre `MEMBER_ASSIGN_CHAR` accessible | **oui** | 5 formulations testées, compilée dans `inventaire.c`, sortie `67` |
| 2 | auditer les autres intentions inaccessibles | **oui** | deux méthodes croisées, **une seule** trouvée ; garde générale ajoutée |
| 3 | information sur l'arithmétique des pointeurs | **oui** | `POINTER_ARITHMETIC_ABSENT` à la déclaration, sans simuler de vérification |
| 4 | réduire les informations redondantes | **mesuré : zéro doublon** | une seule réduction réelle, une clause dite deux fois |
| 5 | examiner l'instabilité hôte | **cause trouvée et corrigée** | 6 passages verts consécutifs |
| — | corriger les blocages bloquants | **2 levés** | définition `static`, lecture de chaîne bornée |

Sur le point 4, je n'ai pas fusionné de messages pour baisser un compte : la
mesure montre **0 code et 0 message répétés** sur une instruction. Fusionner
aurait perdu des leçons distinctes pour un gain cosmétique.

## 2. Nouveaux programmes de validation

`exercice/campagne3/`, quatre programmes **indépendants du carnet de notes**,
code **brut** de C-A, **aucune retouche manuelle**.

| Programme | Lignes C-A | Ce qu'il prouve |
|---|---|---|
| `classement.c` | 59 | 15 compétences des domaines 2, 3 et 5 |
| `inventaire.c` | 28 | structure, réallocation, caractère dans un champ |
| `journal.c` | 24 | lecture d'entier, fin de fichier |
| `texte.c` | 22 | fonction interne, lecture de chaîne bornée |

126 instructions insérées, **0 refus de traduction, 0 refus de placement**.

## 3. Résultats GCC et d'exécution

GCC 16.2.0 (MinGW-W64 UCRT), `-std=c17 -Wall -Wextra -pedantic`.

| Programme | Compilation | Avertissements | Exécution | Sortie |
|---|---|---|---|---|
| `classement.c` | **0** | **0** | **0** | `1a` `moyen` `3` `023` `B` `7` `5` |
| `inventaire.c` | **0** | **0** | **0** | `3` `67` `9` |
| `journal.c` | **0** | **0** | **0** | `42` `fin` |
| `texte.c` | **0** | **0** | **0** | `bonjour` `16` |

**Zéro avertissement sur les quatre**, là où la campagne 2 en avait un — et
celui-là était voulu (`total / 0`, pour exercer l'avertissement de calcul).

Chaque sortie est justifiée dans `journal/verifications.txt`. Trois qui
prouvent plus que « ça tourne » :

- `1a` = 26 en hexadécimal, donc `20 + 3 * 2` et non `(20 + 3) * 2`, qui
  donnerait `2e` : **la priorité est prouvée par la sortie** ;
- `023` : la boucle saute `j = 1` par `continue` et s'arrête à `j = 4` par
  `break` — les deux transferts d'un coup ;
- `67` : le champ vaut `'C'`, affiché en `%d` — l'affectation **et** la leçon
  « un caractère est un entier ».

Fichiers écrits par les programmes : `donnees.txt` = `42`,
`texte.txt` = `bonjour`.

## 4. Compétences nouvellement vérifiées

**+20 compétences** passent de « sans preuve de compilation » à « vérifiée » :
les 19 que la campagne 2 laissait sans preuve, plus la définition `static`.

| | Campagne 2 | Campagne 3 |
|---|---|---|
| vérifiées — cinq preuves | 67 | **87** |
| sans preuve de compilation | 19 | **0** |
| bloquées | 4 | **3** |

## 5. Blocages restants, classés

Aucun n'est bloquant pour une V1 utilisable.

| Blocage | Classement |
|---|---|
| initialiseur entre accolades `{1, 2, 3}` | **limitation fonctionnelle acceptable et documentée** — composable élément par élément, choix pédagogique assumé depuis D6 |
| sonde « macro de limite » | **défaut de mesure** — la sonde demande une commande que le projet refuse d'écrire ; les macros fonctionnent, prouvé par `2147483647` imprimé |
| sonde « lecture de chaîne » sans borne | **défaut de mesure** — la forme sans borne n'a jamais été livrée ; la forme bornée l'est, et elle est compilée |

Les deux défauts de mesure n'ont **pas** été corrigés en changeant la sonde :
cela aurait modifié l'instrument et rendu les campagnes incomparables. Ils
sous-estiment le score de **2 points**.

### Défaut pédagogique restant

**L'arithmétique de pointeur reste acceptée sans avertissement** là où elle
est écrite. `Affecte à p le résultat numérique de "p + 1".` et
`"p - q"` produisent du C sans un mot. L'information est posée à la
**déclaration**, faute de mieux : C-A est sans état d'une instruction à
l'autre et ne sait pas qu'un nom désigne un pointeur dans une expression.
Fermer cette lacune demanderait de suivre les déclarations à travers le
document — un changement d'architecture, donc une décision de périmètre.

## 6. Stabilité des tests hôte

| Campagne | Passages | Résultat |
|---|---|---|
| 2 | 2 | 98/99 puis 99/99 — instabilité non reproductible |
| 3, après correction | 3 | **99/99, 99/99, 99/99** |
| 3, après lots 30 et 31 | 3 | **99/99, 99/99, 99/99** |

**Cause trouvée** : un seul des six sites qui posent `editor.options`
attendait par un délai fixe de 100 ms au lieu d'attendre la condition réelle.
Corrigé par une attente d'état, pas par une nouvelle tentative.

**Six passages verts ne démontrent pas la stabilité** — ils montrent qu'un
site identifié est corrigé et que rien d'autre ne s'est manifesté. Trois
gestes restent irréductiblement manuels.

## 7. Score de campagne 3, barème historique

**93,9 %** — fondamentale 93,2 %, structurante 97,2 %, complémentaire 88,3 %.
87 compétences vérifiées sur 91, 0 sans preuve, 3 bloquées, 1 refus attendu.

| | Campagne 1 | Campagne 2 | Campagne 3 |
|---|---|---|---|
| complétion | 81,7 % | 83,7 % | **93,9 %** |

Les scores des campagnes 1 et 2 ne sont pas recalculés. Même barème, mêmes
91 sondes, mêmes poids, mêmes coefficients : seules les preuves changent.

## 8. Audit du barème — ce qu'il faut en retenir

Document séparé : `docs/AUDIT_BAREME.md`. Trois résultats comptent ici.

**(a) Le barème annonce cinq preuves, il en mesure deux.** P1, P2, P3 et P4
coïncident sur **100 %** des 91 compétences, dans les trois campagnes : trois
profils existent sur 32 possibles. P3 implique P1 et P2 par construction — une
compétence n'est compilée que si elle a été traduite et placée — et P4 suit
P3, puisque c'est le même programme. Les 85 points répartis entre les quatre
se comportent comme un seul bloc, et le score s'écrit :

    82,7 % (part qui compile et s'exécute) + 11,1 % (part qui explique) = 93,9 %

**Conséquence directe : « la compilation pèse 30 % » est décoratif.** Discuter
les poids de P1 à P4 n'a aucun effet mesurable. La seule décision de
pondération qui déplace le score est de compter P5 ou non, soit 3,5 points.

**(b) Six sondes partagent un seul genre.** `NUMERIC_ASSIGN` est mesuré par
six sondes qui obtiennent **les mêmes** P3 et P4 : six sondes pèsent pour une
seule vérification de compilation.

**(c) Les coefficients dépendent du choix des mots.** Ils sont attribués par
expression régulière sur le libellé. `Inclusion de bibliothèque` est
coefficient 2 alors que rien ne compile sans elle ; `Affectation d'élément`
est coefficient 3 parce que « Affectation » est testé en premier.

Un défaut de notation aussi : une sonde dont le refus était **attendu et
obtenu** est notée 15 %. Correction à trois lignes, 0,6 point.

## 9. Recommandation motivée

**La V1 est prête pour un test utilisateur supervisé. Elle n'est pas
entièrement validée, et je ne la présente pas comme telle.**

### Ce qui justifie le test

- la lacune de rang 1 est fermée et **vérifiée instruction par instruction** :
  les huit instructions que la campagne 1 plaçait en silence à la portée
  fichier sont refusées, et les huit mêmes dans un corps de fonction sont
  toujours placées ;
- **zéro retouche manuelle** sur cinq programmes, dont quatre sans le moindre
  avertissement du compilateur ;
- 3 820 tests Node, 0 échec ; 99 tests hôte, six passages verts consécutifs ;
- aucune intention morte, et une garde qui empêche d'en réintroduire une ;
- les questions qui restent sont des questions d'**usage**, pas de
  correction — et seul un test utilisateur peut y répondre.

### Les questions d'usage que seul un test tranchera

1. **Le volume d'informations.** 1,41 par phrase. Mesuré, jamais observé en
   situation. Trop ? Au bon niveau ? Le point ouvert n° 8 attend cette
   réponse, et aucun raisonnement ne la remplacera.
2. **La fréquence du mur « aucun symbole vérifié ».** C-A accepte
   `Affecte la valeur 5 à x.` quand `x` n'existe pas. C'est conforme à la
   philosophie — expliquer, pas corriger — mais c'est la première chose
   qu'un étudiant rencontrera. À quelle fréquence, et avec quel effet sur
   l'apprentissage, je n'en sais rien.
3. **Le palier 1 est-il vivable ?** Les formulations sont longues et exactes
   par construction. Personne n'a encore saisi cent phrases d'affilée.

### Pourquoi « supervisé » et pas « ouvert »

C-A ne vérifie **ni symboles, ni types, ni bornes, ni inclusions, ni
dépassements**. Un étudiant seul peut produire du C non compilable sans
comprendre pourquoi, et C-A ne l'aidera pas : il n'a jamais prétendu le
faire. Un encadrant qui lit le C produit avec l'étudiant transforme cette
limite en leçon ; sans encadrant, elle devient un obstacle.

### Ce qui me ferait changer d'avis

Si l'objectif est qu'un étudiant obtienne du C compilable **sans
supervision**, alors le test est prématuré : il faudrait d'abord suivre les
déclarations à travers le document pour vérifier les symboles. C'est un
changement d'architecture — C-A est aujourd'hui sans état d'une instruction
à l'autre — donc une décision de périmètre qui t'appartient, et pas une
correction que je puisse prendre seul.

### Ce que je recommande de ne pas faire maintenant

Ajouter des fonctionnalités. Les trois blocages restants ne gênent personne :
un est composable, deux sont des défauts de la mesure et non du produit. Les
corrections suivantes devraient venir de ce que le test révèle, pas de ce que
j'imagine.

## 10. Ce que cette livraison n'affirme pas

- que tout le C produit par C-A compile : cinq programmes l'ont fait, pas
  tous ;
- que 93,9 % soit un seuil : l'audit montre que le barème mesure deux choses
  et non cinq, et que deux sondes mesurent autre chose que leur libellé ;
- que six passages hôte verts démontrent la stabilité ;
- que les 91 sondes épuisent les neuf domaines — leur choix est le mien et
  n'a jamais été validé.
