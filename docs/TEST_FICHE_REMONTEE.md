# C-A — fiche de remontée des problèmes

**Pour qui :** l'étudiant qui teste, et l'encadrant qui l'observe. Une
ligne par incident, remplie **sur le moment** et non de mémoire.

> Copier ce fichier sous `test-utilisateur/remontees/<date>-<prénom>.md`
> avant la séance, puis le remplir. L'original reste vide : c'est le gabarit.

---

## Comment remplir

Une **remontée** = un moment où tu as été bloqué, surpris, ou en désaccord.
Quatre déclencheurs, et il suffit d'un seul :

1. tu ne trouves pas la phrase à écrire ;
2. un refus que tu ne comprends pas ;
3. un code C produit qui te surprend ;
4. un message que tu trouves faux, flou ou inutile.

**Il n'y a pas de mauvaise remontée.** Une phrase qu'on ne devine pas est un
défaut de l'outil, pas du lecteur. Et une remontée « finalement c'était
moi » reste utile : elle dit combien de temps a été perdu.

Deux règles de forme, qui valent tout le reste de la fiche :

- **Copie la phrase exactement** comme tu l'as tapée, accents compris. Une
  phrase recopiée « au propre » perd l'information qu'elle portait.
- **Copie le message de C-A tel quel**, avec son code (`UNKNOWN_FORMULATION`,
  `STATEMENT_AT_FILE_SCOPE`, …). Il est écrit en haut à droite de l'aperçu,
  ou dans la notification de refus.

Ne remplis **pas** la colonne « classement » : c'est le travail de
l'encadrant, après la séance, avec
`docs/TEST_PROTOCOLE_OBSERVATION.md` §4.

---

## En-tête de séance

| | |
|---|---|
| date | |
| prénom ou pseudonyme | |
| exercice en cours | |
| a déjà programmé en C ? | oui / non / un peu |
| version C-A | `0.4.0` |
| VS Code | |
| compilateur disponible ? | oui / non |
| durée totale de la séance | |

---

## Tableau des remontées

| # | heure | exercice | phrase saisie **exactement** | ce que j'attendais | ce que C-A a fait (message et code **copiés**) | j'ai pu continuer ? | temps perdu | classement *(encadrant)* |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | oui / non / avec aide | | |
| 2 | | | | | | oui / non / avec aide | | |
| 3 | | | | | | oui / non / avec aide | | |
| 4 | | | | | | oui / non / avec aide | | |
| 5 | | | | | | oui / non / avec aide | | |
| 6 | | | | | | oui / non / avec aide | | |
| 7 | | | | | | oui / non / avec aide | | |
| 8 | | | | | | oui / non / avec aide | | |

*(ajouter des lignes au besoin — une séance sans remontée est une
information, pas un échec)*

---

## Trois questions à la fin de la séance

À remplir par l'étudiant, en une ou deux phrases chacune. Elles portent sur
les trois seules questions que les campagnes de validation **n'ont pas pu**
trancher, et auxquelles seul un usage réel répond.

**Q1 — le volume d'explications.** C-A envoie en moyenne 1,4 information
par phrase dans le canal « C-A — Pédagogie ». Trop ? Pas assez ? Les as-tu
lues, et après combien de temps as-tu arrêté de les lire ?

> 

**Q2 — le mur des noms.** C-A accepte une phrase qui parle d'une variable
inexistante, et c'est le compilateur qui refuse. Cela t'est-il arrivé ?
Combien de fois ? As-tu compris, sur le moment, d'où venait l'erreur ?

> 

**Q3 — la longueur des phrases.** Les phrases du palier 1 sont longues et
exactes. Après une séance : supportable, ou épuisant ? Quelle phrase t'a
coûté le plus cher ?

> 

---

## Ce que l'encadrant ajoute après la séance

| | |
|---|---|
| nombre de remontées | |
| nombre d'insertions confirmées | |
| nombre de refus rencontrés | |
| exercices terminés sur 8 | |
| programmes compilés / exécutés | |
| retouches manuelles du C produit | *(les noter : voir §3 du protocole)* |
| incidents de l'hôte VS Code | *(aperçu qui ne s'ouvre pas, insertion au mauvais endroit, commande absente)* |

**Toute retouche manuelle du C produit se note**, même d'un caractère. Les
trois campagnes de validation ont tenu ce compte et il valait son prix : la
seule retouche de la campagne 1 a produit le lot 27.
