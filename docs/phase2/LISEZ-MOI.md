# Phase 2 — carte des livrables

Branche `phase-2-architecture`. **`main` n'a rien reçu** : la V1 publique
reste la référence stable, et aucune ligne de `src/`, `extension/` ou `test/`
n'est modifiée — `node scripts/progression-phase2.mjs` le vérifie.

| Document | Contenu |
|---|---|
| [`AUDIT_ARCHITECTURE.md`](AUDIT_ARCHITECTURE.md) | l'audit : quatre classes de composants, les 84 intentions par portabilité, l'estimation Python |
| [`MESURES.md`](MESURES.md) | **généré** par `scripts/audit-architecture.mjs` : aucun chiffre de l'audit n'est écrit à la main |
| [`SOCLE_COMMUN.md`](SOCLE_COMMUN.md) | l'architecture proposée, et les **six décisions** qui attendent le fondateur |
| [`STRATEGIE_LINGUISTIQUE.md`](STRATEGIE_LINGUISTIQUE.md) | le mécanisme de souplesse déterministe, et ce qu'il refuse |
| [`RISQUES_REGRESSION.md`](RISQUES_REGRESSION.md) | les cinq risques nommés, les filets, et le retour arrière |
| [`PLAN_PYTHON.md`](PLAN_PYTHON.md) | sept lots, **douze décisions de contrat**, et le travail réutilisable chiffré |
| `etat-phase2.json` | l'état chiffré, lu par `scripts/progression-phase2.mjs` |

## Les deux sondes, jetables

| Sonde | Ce qu'elle a établi |
|---|---|
| `experiences/python/` | **37 des 84 intentions** rendues en Python depuis l'AST, **sans modifier `src/`** ; un programme de 23 phrases françaises exécuté par `python3`, sortie conforme au calcul fait à la main ; **47 refus nommés** |
| `experiences/souplesse/` | **20 cas sur 20** conformes ; **140 phrases du catalogue traversent la couche sans réécriture** ; l'ambiguïté est refusée, l'information manquante n'est jamais inventée |

Les relancer :

    node --experimental-strip-types scripts/audit-architecture.mjs
    node --experimental-strip-types experiences/python/mesurer.mjs
    node --experimental-strip-types experiences/souplesse/mesurer.mjs
    node scripts/progression-phase2.mjs

## Ce qui attend une décision

1. les **six décisions d'architecture** (`SOCLE_COMMUN.md` §5) — bloquantes :
   rien ne commence avant ;
2. les **douze décisions de contrat** Python (`PLAN_PYTHON.md` §2) — à
   trancher avant le lot P4, pas avant P0 ;
3. la **souplesse linguistique** : prototype validé, intégration non
   commencée, mode strict intact par construction.

Rien d'autre n'a été entrepris. En particulier : aucune migration, aucun
développement du second langage, et aucun modèle pédagogique supérieur.
