# Phase 2 — les douze décisions de contrat Python

**Pour qui :** le fondateur. Chaque décision est présentée avec **la
formulation française exacte**, ce qui se passe si on l'accepte, ce qui se
passe si on la refuse, et ma recommandation.

> Les travaux qui n'en dépendent pas **avancent déjà** : P0, P1 et le
> placement Python sont livrés, la couche de variantes est prototypée et
> testée. Ces douze décisions n'ouvrent que les lots P3 et P4.
>
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## Comment lire ce document

Pour chaque décision : la phrase du catalogue C, ce que Python en ferait,
les deux conséquences, et une recommandation. **Dix refus sur douze**, et un
refus ne ferme jamais l'enseignement de la notion : la construction native
qui la remplace est nommée (`INVENTAIRE_PYTHON.md` §3).

---

## D1 — Déclarer sans valeur

**Phrase exacte** : `Déclare un entier nommé n.`
Et ses sœurs : `Déclare une variable de type double nommée x.`,
`Déclare un caractère nommé c.`

| Si on porte | Si on refuse |
|---|---|
| Python écrirait `n = 0` : une valeur **inventée**, contraire à la règle 3. Ou `n: int` seul, qui n'est qu'une annotation et ne crée aucun nom — l'étudiant croirait la variable créée | la phrase est refusée avec sa raison, et une **information passive** enseigne que Python ne sépare pas déclaration et initialisation |

**Recommandation : refuser.** C'est la décision la plus simple des douze :
porter obligerait à inventer, et inventer est interdit depuis le lot 1.

---

## D2 — La fonction principale

**Phrase exacte** : `Crée la fonction principale.`

| Si on porte | Si on refuse |
|---|---|
| `def main():` seul laisse un programme **qui ne fait rien** ; ajouter `main()` ou `if __name__ == "__main__":` est un **ajout implicite** | le code Python se place à la portée module, ce que le placement P2 autorise déjà |

**Recommandation : refuser cette phrase, et créer `PY_SI_PRINCIPAL`** —
`Crée le point d'entrée principal.` → `if __name__ == "__main__":`, avec son
information : en Python c'est une **convention**, pas une exigence.

---

## D3 — La division

**Phrases exactes** : `Affecte à x le résultat de "a / b".` et
`Affecte à x le résultat numérique de "a / b".`

| Si on porte `/` tel quel | Si on refuse |
|---|---|
| le **sens change en silence** : `7 / 2` vaut 3 en C et 3.5 en Python. Le même texte français produirait deux programmes différents | l'expression est refusée, et deux phrases distinctes la remplacent |

**Recommandation : refuser `/` dans les expressions portées, et créer deux
intentions** :

- `Affecte à x le quotient entier de "a" par "b".` → `x = a // b`
- `Affecte à x le quotient réel de "a" par "b".` → `x = a / b`

C'est le seul faux ami d'expression du langage, et le rendre **visible** vaut
mieux que le masquer. Conséquence assumée : une expression contenant `/` est
refusée en Python, avec un message qui nomme les deux phrases.

---

## D4 — La boucle `pour` à trois clauses

**Phrase exacte** :
`Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".`

| Si on porte | Si on refuse |
|---|---|
| il faudrait écrire `i = 0` puis `while i < 3:` puis placer la mise à jour **à la fin du corps** — une restructuration que C-A n'a pas le droit de faire, et un corps que l'étudiant croirait vide | la phrase est refusée, et le `for` de Python est enseigné pour ce qu'il est |

**Recommandation : refuser, et créer trois intentions** :
`PY_POUR_INTERVALLE` (`for i in range(0, 3):`), `PY_POUR_CHAQUE`
(`for x in liste:`), `PY_POUR_INDICE_ET_VALEUR` (`enumerate`).

---

## D5 — L'aiguillage

**Phrases exactes** : `Crée un aiguillage sur "jour".`,
`Ajoute un cas pour la valeur 5.`, `Ajoute le cas par défaut.`,
`Sors de l'aiguillage.`

| Si on porte vers `match` | Si on refuse |
|---|---|
| `match` **ne traverse pas** les cas : les informations `SWITCH_FALLTHROUGH` et `BREAK_LEAVES_SWITCH` deviendraient fausses, et `Sors de l'aiguillage.` n'aurait aucun sens | les quatre phrases sont refusées, et `match` reçoit ses propres phrases, sans mensonge sur la traversée |

**Recommandation : refuser les quatre, et créer `PY_MATCH`, `PY_CAS`,
`PY_CAS_DEFAUT`** — sans phrase de sortie, puisqu'il n'y en a pas besoin.

---

## D6 — Les structures

**Phrases exactes** : `Déclare une structure nommée Point.`,
`Ajoute un champ de type int nommé x.`,
`Déclare une variable de type structure Point nommée p.`, et les six accès.

| Si on porte vers une classe | Si on refuse |
|---|---|
| une classe exige un constructeur : `Ajoute un champ` n'a pas d'équivalent sans **inventer** une valeur ou un `dataclass` que l'étudiant n'a pas demandé | les neuf phrases sont refusées au premier jet, et le regroupement de données nommées s'enseigne d'abord par un **dictionnaire** |

**Recommandation : refuser au premier jet.** Les classes méritent un domaine
entier, avec leur propre contrat — pas un portage.

---

## D7 — Le tableau de dimension fixe

**Phrase exacte** : `Déclare un tableau de type int nommé t de dimension 10.`

| Si on porte | Si on refuse |
|---|---|
| `t = [0] * 10` **invente** le zéro et la notion de remplissage | la phrase est refusée, et `PY_LISTE_VALEURS` crée une liste dont les valeurs sont **écrites** |

**Recommandation : refuser**, et créer `PY_LISTE_VIDE` et
`PY_LISTE_VALEURS`.

---

## D8 — Le caractère

**Phrases exactes** : `Crée un caractère nommé c de valeur 'A'.`,
`Affecte le caractère 'A' à c.`, `Affiche le caractère c.`

| Si on porte | Si on refuse |
|---|---|
| Python n'a pas de type caractère : `c = "A"` est une **chaîne d'un caractère**. L'information doit le dire, sinon l'étudiant croit à un type | on perd trois phrases utiles pour rien : la notion existe, la forme diffère |

**Recommandation : porter**, avec une information passive —
*« Python n'a pas de type caractère : ceci est une chaîne de longueur 1, et
`'A' + 1` y est une erreur, pas 66. »* C'est l'un des deux « oui ».

---

## D9 — Les annotations de type

**Phrase exacte** :
`Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.`

| Si on porte les annotations | Si on les jette |
|---|---|
| `def somme(a: int, b: int) -> int:` — l'information **vient de la phrase**, Python sait l'écrire, rien n'est inventé | `def somme(a, b):` perd une information que l'étudiant a donnée, et C-A n'a pas à la perdre |

**Recommandation : porter les annotations.** Deuxième « oui », et le plus
facile : conserver ce que l'utilisateur a dit coûte zéro.

---

## D10 — L'affichage et le séparateur

**Phrases exactes** : `Affiche la valeur de age.`, `Affiche le texte "…".`,
`Affiche un retour à la ligne.`

| Si on écrit `print(age)` | Si on écrit `print(age, end="")` |
|---|---|
| Python ajoute **un saut de ligne** que personne n'a demandé : la règle « aucun séparateur ajouté » et l'information `OUTPUT_HAS_NO_SEPARATOR` deviendraient fausses | le comportement est **identique à celui du C**, et `Affiche un retour à la ligne.` reste la seule façon d'obtenir un saut |

**Recommandation : `end=""` partout, sans exception.** Ce n'est pas un choix
de style : c'est la règle 3 appliquée au rendu. Et une information dira que
`print` ajoute normalement un saut, que C-A a désactivé **parce qu'il n'a pas
été demandé**.

---

## D11 — La fin de fichier

**Phrase exacte** : `Crée un bloc si la fin du fichier f est atteinte.`

| Si on porte | Si on refuse |
|---|---|
| Python n'a **pas** d'indicateur de fin : il faudrait tester le retour d'une lecture, donc restructurer | la phrase est refusée, et `PY_LIRE_LIGNES` enseigne le parcours, où la fin se constate |

**Recommandation : refuser**, et créer `PY_LIRE_LIGNES` et
`PY_AVEC_FICHIER` — ce dernier avec une information sur la fermeture
automatique, qui est un **ajout du langage** et non de C-A.

---

## D12 — Lire un entier depuis un flux

**Phrase exacte** : `Lis un entier depuis le fichier f dans x.`

| Si on porte | Si on refuse |
|---|---|
| il faut lire **puis convertir** : `x = int(f.readline())` enchaîne deux opérations qu'une seule phrase cacherait, et lève une exception sur une ligne vide | la phrase est refusée, et deux phrases explicites la remplacent |

**Recommandation : refuser**, et exiger deux phrases : `PY_LIRE_LIGNES` puis
`PY_CONVERSION`. Une phrase qui cache une conversion et une exception
possible est précisément ce que la règle 6 interdit de laisser croire sûr.

---

## Récapitulatif

| # | Décision | Recommandation | Remplacée par |
|---|---|---|---|
| D1 | déclarer sans valeur | **refuser** | information passive |
| D2 | fonction principale | **refuser** | `PY_SI_PRINCIPAL` |
| D3 | division | **refuser** | quotient entier / quotient réel |
| D4 | `for` à trois clauses | **refuser** | `range`, `for each`, `enumerate` |
| D5 | aiguillage | **refuser** | `PY_MATCH` sans traversée |
| D6 | structures | **refuser au premier jet** | dictionnaire, puis classes |
| D7 | tableau de dimension fixe | **refuser** | liste à valeurs écrites |
| D8 | caractère | **porter** | information sur l'absence de type |
| D9 | annotations de type | **porter** | — |
| D10 | séparateur d'affichage | **`end=""` partout** | information |
| D11 | fin de fichier | **refuser** | `PY_LIRE_LIGNES` |
| D12 | lire un entier d'un flux | **refuser** | lecture + conversion |

**Dix refus, deux portages, et zéro notion abandonnée** : chaque refus nomme
la construction Python qui enseigne la même compétence.

## Ce qui avance sans ces décisions

| Livré | État |
|---|---|
| P0 — extraction du rendu C17 | **livré**, 0 régression sur 1,3 M de comparaisons |
| P1 — registre de capacités | **livré**, 6 tests |
| P2 — placement par indentation | **livré**, 18 tests |
| couche de variantes | **prototypée et testée**, 16 tests, désactivée par défaut |
| borne de substitutions | **mesurée sur corpus** |
| inventaire des domaines Python | **livré** |

Les décisions n'ouvrent que **P3** (les 17 intentions communes) et **P4**
(les adaptables, et les premières intentions natives). Rien n'attend en
dehors de ces deux lots.
