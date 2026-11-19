# Plan de réalisation et de validation — SQL-A V1

**19 novembre 2026. Rien n'est implémenté.** Ce plan ne devient un contrat
qu'une fois les onze décisions prises.

---

## 1. Le découpage : **douze lots, S0 à S11**

*Douze, pas onze : S0 à S11 fait douze bornes. La phase 3 s'est trompée
exactement là.*

| Lot | Objet | Critère **mesurable** de sortie |
|---|---|---|
| **S0** | socle : `'terminateur'` dans `Blocs`, squelette `src/langages/sql/`, langage enregistré, 84 refus en 10 raisons | `npm test` au vert ; différentiel contre `v0.6.0` à **0 régression, 0 capacité perdue** ; un test impose que les 84 genres aient une raison et qu'aucune raison ne nomme un non-genre |
| **S1** | domaine 1 — tables, colonnes, types, domaines, schémas | les 13 formulations rendues **exactement** comme la spécification ; un test compare le rendu du moteur à `catalogue-sql.json`, entrée par entrée |
| **S2** | placement : les trois portées, les dix rangs de clauses, les neuf diagnostics | chaque diagnostic a **au moins un** test qui le déclenche, et un test vérifie qu'aucune insertion ne modifie un caractère existant |
| **S3** | décision **S3** appliquée : rendu SQL des conditions, `=` comme égalité | différentiel contre `v0.6.0` : **0 régression** pour C17, Python, Java. Sans ce zéro, le lot est **refusé**, drapeau retiré |
| **S4** | domaines 2 et 3 — projection et filtrage | les 18 formulations rendues ; les phrases dédiées `IS NULL` / `LIKE` testées **contre** l'écriture par expression citée |
| **S5** | domaines 4 et 5 — tri, limitation, agrégats, regroupement | les 17 formulations ; un test vérifie l'**ordre des rangs** sur une requête qui porte les dix clauses |
| **S6** | domaine 6 — jointures | les 6 formulations ; un test par type de jointure, et le refus d'un `JOIN` avant le `FROM` |
| **S7** | domaines 7 et 8 — sous-requêtes, ensembles, modification | les 16 formulations ; un test vérifie qu'un `UPDATE` sans « toutes les lignes » **exige** son `WHERE` |
| **S8** | domaine 9 — intégrité, vues, index, transactions, droits | les 21 formulations ; un test vérifie qu'aucune contrainte n'est créée sans nom donné |
| **S9** | français souple mesuré sur un corpus SQL **indépendant** | **0 erreur de sens**, 0 phrase acceptée à tort. Les sept noms communs de SQL — `table`, `colonne`, `vue`, `index`, `contrainte`, `schéma`, `rôle` — dans la garde des identifiants |
| **S10** | hôte VS Code : `.sql`, quatrième session, réglage `c-a.sql` | la suite hôte passe de 121 à **≥ 128** scénarios, tous au vert, et le réglage par défaut est vérifié par un scénario dédié |
| **S11** | exercice de clôture, **défini avant S0** | §4 : exécuté par `psql`, code 0, résultats **conformes au calcul fait à la main**, **0 retouche manuelle** |

**Les lots ne sont pas des étapes de validation.** Ils s'enchaînent, et le
fondateur n'est sollicité que pour un blocage réel, une décision non couverte
ou une autorisation externe.

## 2. Ce qui est mesuré à chaque bilan

Quatre choses, **jamais fusionnées** — la demande de la phase 3, conservée :

| Indicateur | Ce qu'il dit | Ce qu'il ne dit **pas** |
|---|---|---|
| **couverture du catalogue** | combien des 91 formulations sont rendues | qu'elles s'exécutent |
| **implémentation** | lots livrés, tests au vert | qu'un programme soit juste |
| **validation technique** | `psql` en code 0, résultats conformes | qu'un humain écrirait ces phrases |
| **usage humain réel** | séances observées | — et il est à **0/10** depuis la phase 1 |

## 3. L'exercice de clôture — **défini maintenant**, avant la première ligne

C'est la règle apprise en phase 3 : l'énoncé est fixé **avant**
l'implémentation, sinon il mesure ce qui a été fait au lieu de ce qui était
voulu. Les cinq défauts les plus graves de Java ont été trouvés par un
programme entier, pas par un test unitaire.

**Sujet : une bibliothèque de prêt.** Il exige les neuf domaines :

1. trois tables — `livres`, `lecteurs`, `emprunts` — avec clés primaires
   **nommées**, une clé étrangère, un `NOT NULL`, un `UNIQUE`, un `CHECK`,
   une valeur par défaut et une identité engendrée (domaines 1 et 9) ;
2. des données de départ par `INSERT`, dont **un texte contenant une
   apostrophe** — qui éprouve la décision S7 (domaine 8) ;
3. une requête de projection simple, une avec alias, une avec `DISTINCT`
   (domaine 2) ;
4. une requête filtrée composée en **plusieurs phrases** : `WHERE`, puis
   `AND`, puis `ORDER BY`, puis `FETCH FIRST` — c'est **l'épreuve de la
   décision S2** (domaines 3 et 4) ;
5. un décompte par lecteur avec `GROUP BY` et `HAVING` (domaine 5) ;
6. une jointure interne et une jointure gauche, pour montrer la différence sur
   un lecteur sans emprunt (domaine 6) ;
7. une sous-requête `IN` et un `EXISTS`, plus un `EXCEPT` (domaine 7) ;
8. un `UPDATE` filtré et un `DELETE` filtré, puis un `UPDATE` **sur toutes les
   lignes** qui éprouve l'information passive (domaine 8) ;
9. une vue, un index, et une transaction **annulée** dont on vérifie que les
   données sont revenues en arrière (domaine 9).

**Les résultats attendus sont calculés à la main avant l'exécution.** Un
programme qui s'exécute en code 0 ne prouve rien sur la justesse : c'est le
calcul fait à la main qui le prouve, et c'est ce que la phase 3 a établi.

**Critère de clôture : zéro retouche manuelle.** Si une instruction doit être
corrigée à la main, c'est un défaut du produit, et le lot correspondant est
rouvert.

## 4. Le chemin d'erreur, testé lui aussi

Un exercice qui ne fait que réussir ne prouve que la moitié. Trois épreuves
négatives :

1. une violation de `CHECK` → le serveur **refuse** l'insertion, et le script
   s'arrête, parce que `ON_ERROR_STOP=1` ;
2. une violation de clé étrangère → suppression d'un lecteur qui a des
   emprunts, refusée ;
3. une transaction annulée → les données **reviennent** à leur état d'avant.

## 5. Ce que la validation technique exigera, précisément

```
psql --set ON_ERROR_STOP=1 -f exercice.sql    # code 0 exigé
```

`ON_ERROR_STOP=1` n'est pas un détail de confort : **sans lui, `psql`
continue après une erreur et renvoie 0.** Un script faux passerait pour bon,
et toute la chaîne de preuves deviendrait décorative. C'est la leçon de
`javac` sans `-encoding UTF-8`, transposée.

Autres exigences : base en `UTF8`, client en `UTF8`, et les résultats
comparés **octet par octet** à un attendu écrit à la main.

## 6. Le blocage externe, et ce qu'il bloque exactement

**Aucun serveur SQL n'est installé.** Vérifié : `psql`, `postgres`, `initdb`,
`pg_ctl`, `sqlite3`, `docker` absents.

| Avec l'autorisation | Sans l'autorisation |
|---|---|
| les douze lots | **S0 à S3** seulement — catalogue, refus, placement, conditions |
| l'exercice de clôture | aucun |
| une livraison annonçable | **aucune** |

Demande : **PostgreSQL 18 portable**, binaires officiels, hors du dépôt, amas
créé par `initdb` dans un dossier local, port non standard, **aucun service
Windows**, `PATH` système inchangé, **aucun chemin personnel versionné** — le
cadre exact tenu pour Temurin 21, qui n'a laissé aucune trace dans le dépôt.

**Et une chose à dire franchement** : annoncer SQL-A V1 sans une seule
instruction exécutée serait exactement ce que ce projet a passé trois phases à
refuser. « La réussite des tests automatisés ne vaut pas complétion » est
écrit dans sa documentation fondatrice ; en SQL, c'est encore plus vrai
qu'ailleurs, parce que le langage ne fait rien tout seul.

## 7. Ce qui ne sera pas fait dans cette phase

Les fonctions de fenêtrage, `MERGE`, `WITH RECURSIVE`, les déclencheurs,
PL/pgSQL, les procédures stockées, les types tableau et JSON, les
transactions imbriquées au-delà du point de reprise, la réplication, et tout
réglage de performance. **Rust** vient après le modèle pédagogique 2 ; le
**modèle 2** n'est pas ouvert.
