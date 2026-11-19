# Bilan de SQL-A V1 — 19 novembre 2026

**Les douze lots S0 à S11 sont livrés.** Ce document distingue partout quatre
choses, et ne les fusionne jamais : la **couverture du catalogue**, l'**implé­
mentation**, la **validation technique** et l'**usage humain réel**.

Le quatrième est à **zéro**, et c'est le seul qui compte encore.

---

## 1. Les quatre indicateurs

| Indicateur | Mesure | Ce qu'il ne dit **pas** |
|---|---|---|
| **couverture du catalogue** | **93 formulations**, 9 domaines sur 9 | qu'elles s'exécutent |
| **implémentation** | 12 lots, **4 487** tests Node, **130** scénarios hôte | qu'un programme soit juste |
| **validation technique** | **109 phrases** jouées contre PostgreSQL 18.7, 6 fichiers en code 0, 3 épreuves négatives qui échouent comme prévu, résultats **conformes au calcul fait à la main** | qu'un humain écrirait ces phrases |
| **usage humain réel** | **0 / 10 séances** | — et c'est le même zéro qu'aux phases 1, 2 et 3 |

## 2. Ce qui existe et n'existait pas

| | |
|---|---|
| langages cibles | **quatre** : C17, Python, Java 21, **SQL** |
| formulations SQL | **93**, **toutes natives** |
| intentions du catalogue partagé portées | **0** — décision S1 |
| intentions refusées, avec leur raison | **84**, groupées en **10** raisons |
| informations pédagogiques passives | **17** |
| portées de placement | **3** : fichier, requête, projection |
| rangs de clauses imposés | **10** |
| diagnostics de placement | **10**, dont **8** propres à SQL |

**SQL-A est le premier langage entièrement natif.** Il n'hérite d'aucune des
vérifications accumulées par les lots 1 à 25, et sa dette de test a donc été
construite en entier : 44 tests Node propres à SQL, et 9 scénarios hôte.

### Le socle a tenu, et une seule pièce a bougé

| Élément | Verdict |
|---|---|
| registre de langages | **tel quel**, `portees` vide et 84 raisons sont des valeurs légales |
| noyau d'expressions | **une capacité ajoutée**, `simpleEquality`, fermée dans les quatre profils publiés |
| 98 reformulations du français souple | **telles quelles**, zéro ligne ajoutée à `src/langue/` pour que SQL fonctionne — six **entrées de lexique** en revanche, trouvées par la mesure |
| machine à états de l'hôte | **telle quelle** |
| outillage (différentiel, liens, pré-publication) | **tel quel** |

L'étiquette de blocs a reçu une **troisième** valeur, `terminateur` : SQL n'a
ni accolades ni indentation. L'ajout est additif, et il **confirme une
troisième fois** la décision 2 du socle — les placements se *sélectionnent*,
ils ne s'unifient pas.

## 3. La préservation de C17, Python et Java — prouvée

```
différentiel contre v0.6.0   1 335 559 comparaisons
régressions                  0
capacités perdues            0
corpus gelé C17              95,1 % — inchangé
```

Relancé **deux fois** : après l'extension du noyau (lot S3), puis après
l'extension du lexique (lot S9). C'est la condition que le fondateur avait
posée, et elle est tenue des deux côtés.

**Et un test a fait son travail en échouant.** `test/expressionCore.test.mjs`
écrit les quatre enregistrements de capacités en toutes lettres, précisément
pour qu'un ajout soit visible. Il a échoué à l'ajout de `simpleEquality`,
comme prévu, et il a été étendu avec la raison sur place.

## 4. Les six défauts trouvés, et par quoi

Ils comptent plus que les chiffres.

| Défaut | Trouvé par |
|---|---|
| l'insertion de clause **consommait** la ligne blanche : composer une requête était impossible, et la décision S2 ne tenait pas | **l'exercice de clôture** |
| `WITH … AS (…)` suivi d'un point-virgule **n'est pas du SQL valide** | **le serveur**, « syntax error at or near ";" » |
| insérer deux colonnes **entières** — le cas le plus banal d'une table de liaison — était inexprimable | **l'exercice de clôture** |
| affecter un **texte ou une date** par `UPDATE` était inexprimable | **l'exercice de clôture** |
| `asCondition` enveloppe une expression sans logique dans un `numeric-test`, que je castais au lieu de déballer : deux formulations refusaient | la confrontation **moteur ↔ spécification** |
| `ALTER COLUMN … ADD GENERATED` exige un `NOT NULL` préalable | **le serveur**, avant même la première ligne de moteur |

**Quatre des six n'étaient visibles pour aucun test unitaire.** Il fallait un
programme entier, ou un vrai serveur. C'est exactement la raison pour laquelle
l'énoncé de l'exercice a été fixé **avant** l'implémentation.

Et un septième, qui n'est pas un défaut du produit mais de ma méthode : mon
premier comparateur moteur ↔ spécification comparait des **squelettes de
mots-clés**, et déclarait identiques des sorties qui différaient par leurs
identifiants. **Un comparateur approximatif ne vérifie rien : il rassure.**

### Le défaut de sens, cette fois **prévu**

La phase 3 avait trouvé que A renommait silencieusement la méthode de
l'utilisateur, parce que la garde des identifiants ne connaissait que « nommé »
et « appelé ». SQL introduit **sept** noms communs qui nomment des
identifiants — `table`, `colonne`, `vue`, `index`, `contrainte`, `schéma`,
`rôle` —, donc le risque était de la **même forme**.

Il a été fermé **avant** la mesure, et la mesure l'a confirmé : **0 erreur de
sens** sur un corpus qui l'éprouve exprès, avec des colonnes nommées `compte`,
`affiche`, `somme` et `cree`.

## 5. Le français souple, réutilisé

| | |
|---|---|
| corpus indépendant | **54 entrées**, 40 claires |
| reconnues | **39** — **97,5 %** |
| acceptées à tort | **0** |
| erreurs de **sens** | **0** |

Première mesure : **34/40**. Six **infinitifs** manquaient au lexique —
`supprimer`, `ordonner`, `regrouper`, `insérer`, `ouvrir`, `modifier`. La règle
de cette table est qu'elle ne grandit **que sur une formulation mesurée**, et
c'était le cas.

**Le seul refus restant n'est pas corrigé, et c'est délibéré** : « Ne garde que
les lignes **ou** "age > 18". », sans accent. `ou` et `où` sont **deux mots
différents** ; substituer l'un à l'autre serait exactement l'interprétation
hasardeuse que la consigne interdit. C'est une limite, et elle est écrite.

## 6. Les preuves d'exécution

```
PostgreSQL 18.7, portable, hors du dépôt, port 55432, 127.0.0.1 seulement
psql --set ON_ERROR_STOP=1 -f …
```

| Preuve | Chiffre |
|---|---|
| phrases dictées | **109**, **0 refus**, **0 retouche manuelle** |
| gestes d'éditeur | 91 |
| fichiers | **9** — 6 positifs, 3 négatifs |
| exécution des six | **code 0** |
| épreuves négatives | **3 / 3 échouent**, chacune avec la contrainte attendue |
| conformité | **au calcul fait à la main** — voir §7 |

`ON_ERROR_STOP=1` n'est pas un confort : **sans lui, `psql` continue après une
erreur et renvoie 0.** La preuve que le réglage agit a été faite avant d'en
dépendre.

## 7. Ce que le calcul à la main dit, et ce que le serveur a répondu

| Attendu, calculé à la main | Observé |
|---|---|
| 7 emprunts, 5 rendus → `COUNT(*)` ≠ `COUNT(rendu)` | **7** et **5** |
| (34 + 20 + 51 + 17) / 4 | **30,5** |
| jointure interne : le lecteur sans emprunt **disparaît** | **7 lignes** |
| jointure gauche : il **apparaît**, avec des nuls | **8 lignes** |
| `HAVING COUNT(*) > 2` : un seul lecteur en a 3 | **1 ligne** |
| tri croissant : les deux nuls **en dernier** | conforme |
| `ROLLBACK` après avoir tout supprimé | **6**, les données reviennent |
| `'O''Brien'` relu | **`O'Brien`**, intact |

Un test relit ce journal à chaque `npm test`, et les chiffres attendus y sont
**écrits**, pas lus : un journal qui se vérifierait lui-même ne vérifierait
rien.

## 8. Ce qui reste ouvert — les limites réelles

**Côté produit, nommé et assumé :**

- **aucune vérification** de symboles, de types, de bornes, ni de **droits**.
  SQL-A ne sait pas si la table existe, ni de quel type est la colonne. Une
  instruction acceptée n'est pas une instruction qui s'exécutera ;
- **A n'exécute jamais rien** — et c'est une décision, pas une lacune. Il
  écrit dans le fichier, et c'est l'utilisateur qui lance le script. Une
  information passive le dit sur les instructions destructrices ;
- **A ne sait pas si la base a dix lignes ou dix millions**, ni si c'est une
  base de test ou de production. Le protocole de séance devra exiger une base
  de test ;
- une requête écrite **sur une seule ligne** ne se complète pas (décision S8).
  C'est une conséquence directe de la règle 9 ;
- **une sous-requête complexe n'est pas exprimable** : elles sont rendues
  entières, et l'expression de table est la réponse (décision P2). A ne
  vérifiera pas qu'une sous-requête ne renvoie qu'une colonne, comme `IN`
  l'exige ;
- `ou` sans accent n'est pas reconnu, et ne le sera pas ;
- **hors catalogue, délibérément** : fonctions de fenêtrage, `MERGE`,
  `WITH RECURSIVE`, déclencheurs, PL/pgSQL, procédures stockées, types tableau
  et JSON, `TRUNCATE` ;
- **refusés par la décision S6** : `LIMIT`, `serial`, `::`, `ILIKE`,
  `RETURNING`, `ON CONFLICT`, `text`, `BEGIN`. Et une **exception assumée** :
  `CREATE INDEX`, hors standard, est au catalogue parce qu'aucune base réelle
  ne s'en passe.

**Côté environnement :** une seule machine, **Windows**, un seul serveur
PostgreSQL, un seul compilateur C, un seul interpréteur Python, un seul JDK.
Rien n'est su de PostgreSQL sur Linux, ni d'aucun autre dialecte SQL.

**Côté intégrité :** PostgreSQL ne publie **aucune somme de contrôle** pour
ses binaires Windows — écart honnête avec Temurin. L'intégrité repose sur la
**signature Authenticode**, vérifiée, émise par EnterpriseDB Corporation.

**Côté usage : `0/10` séances.** Personne n'a écrit un programme avec A, dans
aucun des **quatre** langages. Les 109 phrases de l'exercice sont dictées par
un script, et le 97,5 % du corpus SQL porte son biais écrit — il a été rédigé
par l'auteur du mécanisme. Le corpus **gelé** de la phase 2, à **95,1 %**,
reste l'ordre de grandeur honnête.

## 9. Les barres

```
catalogue — 9 domaines couverts   [████████████████████████]  9/9      100 %
84 intentions classées            [████████████████████████]  84/84    100 %
décisions validées                [████████████████████████]  11/11    100 %
lots implémentés                  [████████████████████████]  12/12    100 %
préservation de C, Python, Java   [████████████████████████]  1/1      100 %
chaîne d'outils PostgreSQL        [████████████████████████]  1/1      100 %
exécution réelle                  [████████████████████████]  1/1      100 %
exercice de clôture               [████████████████████████]  12/12    100 %
épreuves négatives                [████████████████████████]  3/3      100 %
intégration VS Code               [████████████████████████]  1/1      100 %
français souple mesuré en SQL     [████████████████████████]  1/1      100 %
usage humain réel                 [························]  0/10       0 %
```

**Rien n'est fusionné dans `main`, et aucune release n'est publiée.**
