# Phase 3 — Java-A, carte des livrables

Ouverte le **18 novembre 2026**, branche `phase-3-java`.

> **La phase 3 est close depuis le 18 novembre 2026.** Java-A V1 est livré, et
> la version **0.6.0** est fusionnée dans `main`, étiquetée `v0.6.0` et
> **poussée**. Le bilan, les quatorze défauts trouvés et ce qui reste ouvert :
> [CLOTURE.md](CLOTURE.md) et [BILAN_JAVA_V1.md](BILAN_JAVA_V1.md).
>
> Reste **un seul geste**, manuel : créer la release GitHub, **en
> *pre-release*** tant que la validation humaine n'a pas eu lieu. Lien, fichier
> et texte exact : [`../PUBLICATION_0_6_0.md`](../PUBLICATION_0_6_0.md) §7.

*Les documents ci-dessous gardent leur formulation d'origine, qui dit souvent
« rien n'est implémenté ». C'était vrai à leur date : un compte rendu daté ne
se réécrit pas.*

---

## Dans quel ordre lire

| # | Document | Ce qu'il répond |
|---|---|---|
| 1 | [`../FEUILLE_DE_ROUTE.md`](../FEUILLE_DE_ROUTE.md) | quels langages, dans quel ordre, et ce qui vient après |
| 2 | [`AUDIT_REUTILISATION.md`](AUDIT_REUTILISATION.md) | ce qui sert tel quel, ce qui se paramètre, ce qui manque |
| 3 | [`JAVA21_CONTRAINTES.md`](JAVA21_CONTRAINTES.md) | pourquoi Java 21 LTS, et ce que le compilateur impose |
| 4 | [`CATALOGUE_JAVA_PROPOSE.md`](CATALOGUE_JAVA_PROPOSE.md) | les 127 formulations proposées, phrase et sortie exactes |
| 5 | [`CLASSEMENT_INTENTIONS.md`](CLASSEMENT_INTENTIONS.md) | les 84 intentions existantes : reprises, adaptées, refusées |
| 6 | [`DECISIONS_JAVA.md`](DECISIONS_JAVA.md) | **les onze décisions à prendre** |
| 7 | [`PLAN_JAVA.md`](PLAN_JAVA.md) | onze lots, critères mesurables, et le blocage externe |

État chiffré : [`etat-phase3.json`](etat-phase3.json), édité à la main.

    node scripts/progression-phase3.mjs

## Les trois choses à savoir avant de lire le détail

**1. Le socle tient.** Le registre, le noyau d'expressions et les 98
reformulations servent **sans modification**. Ce qui manque n'est pas une
abstraction : c'est un module de placement, parce que l'étiquette `accolades`
encodait des règles du **C** et non des règles des **accolades**.

**2. Java est plus proche du C que Python ne l'était — sauf sur un point.**
31 intentions se reprennent directement, et `/` comme `%` se reportent sans
adaptation, là où Python avait exigé des phrases distinctes. Mais Java ajoute
l'**objet** comme unité obligatoire : 101 formulations sans aucune racine dans
l'existant, parce que Python-A n'a pas de classes.

**3. Deux obstacles sont réels et nommés.**

- **les exceptions vérifiées** (décision J6) : lire un fichier **oblige** à
  attraper ou à déclarer. A ne peut ni ajouter un `throws` à une signature déjà
  écrite — règle 9 — ni envelopper dans un `try` choisi par lui — règle 3.
  C'est la décision qui rendra A le plus frustrant, et elle doit être prise en
  connaissance de cause ;
- **aucun JDK n'est installé** sur la machine. Sans lui, pas une seule preuve
  de compilation — et ce projet a déjà écrit que la réussite des tests
  automatisés ne vaut pas complétion. Autorisation externe demandée dans
  `PLAN_JAVA.md` §6.

## Ce que la phase 3 ne fait pas

SQL, les modèles pédagogiques supérieurs, `record`, `switch` fléché, `var`, la
factorisation des sessions de l'hôte.

*À l'ouverture de la phase, cette section disait aussi « aucune modification
des références GitHub tant que le renommage n'est pas vérifié : le nom
`a-french-to-code` répond encore 404 ». Le renommage **a pris effet** depuis,
l'ancien nom répond 301, et les références ont été appliquées.*
