# Repères git du dépôt

**Pour qui :** quiconque veut rejouer une comparaison différentielle, relire
un lot, ou comprendre pourquoi les documents citent des **étiquettes** et
jamais des identifiants de commit.

---

## 1. Les documents citent des étiquettes, pas des hachages

Un identifiant de commit n'est **pas durable** : il change dès que
l'historique est réécrit, et ce dépôt l'a été une fois, juste avant sa
publication, pour en retirer des chemins locaux et une adresse personnelle.
Vingt-deux citations seraient alors devenues fausses en silence.

Les bilans de lots citent donc des étiquettes :

    node scripts/differentiel.mjs lot-16      # et non un hachage

## 2. Les étiquettes

| Étiquette | Ce qu'elle marque |
|---|---|
| `v0.4.0` | **première version publique identifiable** |
| `ref-avant-lot-13` | l'état d'avant le noyau d'expressions unifié : la référence des différentiels des lots 14 à 20 |
| `lot-11a` | boucle `while` |
| `lot-11d` | `break` et `continue` |
| `lot-16` | chaînes C17 |
| `lot-17` | pointeurs fondamentaux |
| `lot-19` | aiguillage `switch` |
| `lot-23` | modularité |
| `lot-26` | portée des instructions |
| `lot-27` | champs de structure de type tableau |
| `lot-28` | `limits.h` |
| `lots-30-31` | lacunes des campagnes 2 et 3 |
| `evaluation-modele-1` | première évaluation chiffrée (81,7 %) |
| `campagne-2` | V1 corrigée (83,7 %) |
| `campagne-3` | preuves élargies (93,9 %) |
| `kit-test-utilisateur` | paquet installable, cahier, protocole |

Seuls les commits **cités par un document** portent une étiquette. Les
autres se retrouvent par leur message :

    git log --oneline --grep "Lot 24"

## 3. Si un identifiant ancien apparaît quelque part

Dans une note personnelle, une capture d'écran ou un message antérieur au
16 novembre 2026, un identifiant de commit peut ne plus exister. Il ne
désigne rien dans ce dépôt : les commits auxquels il renvoyait ont été
remplacés par des commits de **contenu identique** mais d'identifiant
différent.

Retrouver le bon repère : chercher le **message** du commit, pas son
identifiant.

## 4. Conventions

- un commit par lot ou par étape documentaire ; message **en français**, à
  l'impératif, préfixé du lot concerné ;
- jamais de `--no-verify`, jamais de réécriture d'un historique **poussé** ;
- une étiquette est posée quand un document a besoin de citer un état.
