# Phase 4 — SQL-A, carte des livrables

Ouverte le **19 novembre 2026**, branche `phase-4-sql`.

> **SQL-A V1 est livré**, lots S0 à S11, le 19 novembre 2026. Les onze
> décisions ont été validées le même jour, et elles sont implémentées. Le
> bilan, les six défauts trouvés et les limites réelles :
> [BILAN_SQL_V1.md](BILAN_SQL_V1.md).
>
> **Phase 4 définitivement close le 19 novembre 2026.** Fusionnée dans `main`,
> étiquetée `v0.7.0`, et la **release est publiée** en ***pre-release***,
> vérifiée anonymement jusqu'au `sha256` du `.vsix` téléchargé.
>
> Clôture : [CLOTURE.md](CLOTURE.md) · bilan :
> [BILAN_SQL_V1.md](BILAN_SQL_V1.md) · histoire des lots :
> [HISTORIQUE_DES_LOTS.md](HISTORIQUE_DES_LOTS.md).
>
> **Deux points restent ouverts et documentés** :
> [`../INSTABILITE_SUITE_HOTE.md`](../INSTABILITE_SUITE_HOTE.md) — origine non
> établie — et
> [`../HYGIENE_HISTORIQUE_PHASE4.md`](../HYGIENE_HISTORIQUE_PHASE4.md) —
> supprimer une branche n'efface rien.
>
> *Les documents ci-dessous gardent leur formulation d'origine, qui dit
> souvent « rien n'est implémenté ». C'était vrai à leur date : un compte
> rendu daté ne se réécrit pas.*

---

## Dans quel ordre lire

| # | Document | Ce qu'il répond |
|---|---|---|
| 1 | [`AUDIT_REUTILISATION.md`](AUDIT_REUTILISATION.md) | ce qui sert tel quel, ce qui se paramètre, ce qui manque |
| 2 | [`POSTGRESQL_CONTRAINTES.md`](POSTGRESQL_CONTRAINTES.md) | PostgreSQL 18 comme vérificateur, le standard comme priorité |
| 3 | [`CATALOGUE_SQL_SPEC.md`](CATALOGUE_SQL_SPEC.md) | les **91** formulations, phrase et sortie exactes — **engendré** |
| 4 | [`CLASSEMENT_INTENTIONS.md`](CLASSEMENT_INTENTIONS.md) | les 84 intentions existantes, et pourquoi **aucune** ne passe |
| 5 | [`PLACEMENT_SQL.md`](PLACEMENT_SQL.md) | **les contraintes de placement**, et l'idée qui sauve la règle 9 |
| 6 | [`DECISIONS_SQL.md`](DECISIONS_SQL.md) | **les onze décisions à prendre** |
| 7 | [`PLAN_SQL.md`](PLAN_SQL.md) | douze lots, critères mesurables, exercice de clôture, blocage externe |
| 8 | [`POSTGRES_INSTALLATION.md`](POSTGRES_INSTALLATION.md) | le serveur portable, son intégrité, et ce qu'il a prouvé |
| 9 | [`BILAN_SQL_V1.md`](BILAN_SQL_V1.md) | **le bilan de la livraison** : quatre indicateurs, six défauts, limites réelles |

État chiffré : [`etat-phase4.json`](etat-phase4.json).

    node scripts/catalogue-sql.mjs        # vérifie la spécification et compte
    node scripts/progression-phase4.mjs   # les barres, et ce qui est vérifié

**Aucun chiffre de ces documents n'est écrit à la main.** Le tableau du
catalogue est engendré depuis `catalogue-sql.json`, et le classement des 84
est confronté aux genres que le moteur publie. Ce n'est pas du zèle : la phase
3 a produit trois chiffres faux — « 82 intentions » pour 84, « 134 = 101 + 33 »
pour 127, « onze lots » pour douze — tous écrits à la main. Le vérificateur
construit ici a **immédiatement** attrapé une omission de 83 pour 84.

## Les quatre choses à savoir avant de lire le détail

**1. SQL ne reprend rien, et ce n'est pas un appauvrissement.** Le catalogue
partagé décrit des variables, des boucles, des fonctions, des affichages, des
fichiers, de la mémoire. SQL n'a **aucun** de ces objets. Trajectoire des
quatre langages : C17 **84/84**, Java **57**, Python **33**, SQL **0**.

**2. Le refus le plus important est celui qui ressemble le plus à un oui.**
Une structure est un **type** — la forme d'une valeur. Une table est une
**relation** — un ensemble de lignes. Rendre « Déclare une structure » par
`CREATE TABLE` enseignerait la confusion exacte qui fait ensuite écrire des
boucles sur une base de données.

**3. Le placement a une idée, et elle tient en une ligne.** Une requête est un
**bloc multi-lignes** terminé par un `;` sur sa propre ligne ; une clause
s'insère sur la ligne blanche qui précède. Ajouter une clause devient une
**insertion pure**, donc la règle 9 — ne jamais modifier ce qui n'a pas été
autorisé — tient sans exception. Le prix : les virgules et les `AND` s'écrivent
**en tête de ligne**, et un `.sql` écrit sur une seule ligne ne se complétera
pas.

**4. Deux obstacles sont réels et nommés.**

- **le signe `=`** (décision S3) : mesuré dans le code, `=` seul dans une
  condition est refusé — c'est juste pour C, Python et Java, où `=` affecte.
  En SQL, `=` **est** l'égalité, et c'est le prédicat le plus courant du
  langage. Trois options, aucune bonne ;
- **aucun serveur SQL n'est installé** — `psql`, `postgres`, `initdb`,
  `sqlite3`, `docker` tous absents, vérifié. C'est **plus bloquant** qu'à la
  phase 3 : un programme Java se lance seul, une instruction SQL n'a de sens
  que jouée contre des données. Autorisation externe demandée,
  [`PLAN_SQL.md`](PLAN_SQL.md) §6.

## Ce que la phase 4 ne fait pas

Les fonctions de fenêtrage, `MERGE`, `WITH RECURSIVE`, les déclencheurs,
PL/pgSQL, les procédures stockées, les types tableau et JSON, le réglage de
performance. **Rust** vient après le modèle pédagogique 2, et le **modèle 2**
n'est pas ouvert.

Et surtout : elle ne fait **pas** avancer le seul chiffre qui compte encore.
`0/10` séances. Personne n'a écrit un programme avec A, dans aucun des trois
langages déjà livrés.
