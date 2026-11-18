# Phase 2 — carte des livrables

> **La phase 2 est close depuis le 18 novembre 2026.** Le bilan, les défauts
> trouvés et ce qui reste ouvert : [CLOTURE.md](CLOTURE.md).

Branche `phase-2-architecture`, **fusionnée dans `main` le 18 novembre 2026**
en avance rapide, et publiée sous l'étiquette **`v0.5.0`**.
`node scripts/progression-phase2.mjs` lit l'état réel du dépôt — il ne
l'affirme plus en dur, parce qu'une affirmation codée en dur ne se périme pas.

*Les documents de lot ci-dessous gardent leur formulation d'origine, qui dit
souvent « `main` reste la V1 publique ». C'était vrai à leur date : un compte
rendu daté ne se réécrit pas.*

| Lot | État | Preuve |
|---|---|---|
| **P0** extraction du rendu C17 | **livré** | 1 335 559 comparaisons, 0 régression, 0 extension, 0 perte |
| **P1** registre de capacités | **livré** | 6 tests, dont l'identité avec `translate` |
| **P2** placement par indentation | **livré** | 18 tests, les quatre différences avec C |
| couche de variantes | **écrite, désactivée** | 16 tests, borne mesurée sur corpus |
| P3 à P6 | **non commencés** | dépendent des douze décisions |

| Document | Contenu |
|---|---|
| [`AUDIT_ARCHITECTURE.md`](AUDIT_ARCHITECTURE.md) | l'audit : quatre classes de composants, les 84 intentions par portabilité, l'estimation Python |
| [`MESURES.md`](MESURES.md) | **généré** par `scripts/audit-architecture.mjs` : aucun chiffre de l'audit n'est écrit à la main |
| [`SOCLE_COMMUN.md`](SOCLE_COMMUN.md) | l'architecture proposée, et les **six décisions** qui attendent le fondateur |
| [`STRATEGIE_LINGUISTIQUE.md`](STRATEGIE_LINGUISTIQUE.md) | le mécanisme de souplesse déterministe, et ce qu'il refuse |
| [`RISQUES_REGRESSION.md`](RISQUES_REGRESSION.md) | les cinq risques nommés, les filets, et le retour arrière |
| [`PLAN_PYTHON.md`](PLAN_PYTHON.md) | sept lots, **douze décisions de contrat**, et le travail réutilisable chiffré |
| [`INVENTAIRE_PYTHON.md`](INVENTAIRE_PYTHON.md) | les **neuf domaines** de Python, les quatre catégories d'intentions, et ce que chaque refus de portage **remplace** |
| [`DECISIONS_PYTHON.md`](DECISIONS_PYTHON.md) | les **douze décisions de contrat** : formulation exacte, conséquences, recommandation |
| [`LOT_P0_CONTRAT.md`](LOT_P0_CONTRAT.md) | contrat **et bilan** du lot P0 : l'extraction du rendu, prouvée neutre |
| [`MESURES_SOUPLESSE.md`](MESURES_SOUPLESSE.md) | **généré** : la borne de substitutions mesurée sur un corpus dérivé du catalogue |
| `etat-phase2.json` | l'état chiffré, lu par `scripts/progression-phase2.mjs` |

## Les deux sondes, jetables

| Sonde | Ce qu'elle a établi |
|---|---|
| `experiences/python/` | **37 des 84 intentions** rendues en Python depuis l'AST, **sans modifier `src/`** ; un programme de 23 phrases françaises exécuté par `python3`, sortie conforme au calcul fait à la main ; **47 refus nommés** |
| `experiences/souplesse/` | **20 cas sur 20** conformes ; **140 phrases du catalogue traversent la couche sans réécriture** ; l'ambiguïté est refusée, l'information manquante n'est jamais inventée |

Les relancer :

    node --experimental-strip-types scripts/audit-architecture.mjs
    node --experimental-strip-types scripts/mesurer-souplesse.mjs
    node --experimental-strip-types experiences/python/mesurer.mjs
    node --experimental-strip-types experiences/souplesse/mesurer.mjs
    node scripts/progression-phase2.mjs
    npm run check        # 3 874 tests, typecheck compris

## Ce qui attend une décision

1. les **six décisions d'architecture** (`SOCLE_COMMUN.md` §5) — bloquantes :
   rien ne commence avant ;
2. les **douze décisions de contrat** Python (`PLAN_PYTHON.md` §2) — à
   trancher avant le lot P4, pas avant P0 ;
3. la **souplesse linguistique** : prototype validé, intégration non
   commencée, mode strict intact par construction.

Rien d'autre n'a été entrepris. En particulier : aucune migration, aucun
développement du second langage, et aucun modèle pédagogique supérieur.
