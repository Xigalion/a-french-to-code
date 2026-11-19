# Les douze lots de la phase 4, commit par commit

La fusion dans `main` a été faite en **squash** : `main` ne porte donc qu'un
seul commit pour toute la phase 4. Ce document conserve ce que le squash a
laissé derrière — **les messages de commit**, qui sont la seule chose utile
que l'arbre ne portait pas.

Pourquoi le squash : quatre commits de la branche portaient un **chemin
personnel** dans le journal de l'exercice, et le contrôle « aucun nom
d'utilisateur dans l'historique de `main` » scanne tout l'historique par
`git log -S`. Détail : [`../PUBLICATION_0_7_0.md`](../PUBLICATION_0_7_0.md) §4.

**Les hachages ne sont pas cités**, par la convention du dépôt : un hachage
pourrit, et la branche distante a été supprimée. Les messages, eux, disent ce
qui a été fait.

---

## 1. Phase 4 ouverte : les orientations de SQL-A, et rien d'implémenté

Audit **mesuré** sur le moteur : C17 porte 84 intentions du catalogue partagé
sur 84, Java 57, Python 33, SQL **zéro**. Obstacle trouvé **dans** le code :
`expressionCore.ts` refusait `=` seul, alors qu'en SQL `=` est l'égalité.
Aucun compteur écrit à la main — et le vérificateur a immédiatement attrapé
une omission, 83 genres classés pour 84 réels.

## 2. Un chemin annoncé n'est pas un chemin mort, et pas un chemin historique

Le vérificateur de liens signalait les huit fichiers que la phase annonçait.
Les ranger dans les chemins *historiques* aurait été faux : ils n'avaient pas
existé, ils n'existaient **pas encore**. Catégorie séparée, comptée et
affichée — une liste d'exceptions muette finit par cacher un vrai lien mort.
*(Retirée au lot 9, ses huit chemins existant alors.)*

## 3. PostgreSQL 18.7 portable : installé, et il a déjà trouvé un défaut

Hors du dépôt, chemin relatif, `PATH` inchangé, aucun service, port 55432.
PostgreSQL ne publie **aucune somme de contrôle** : écart honnête avec
Temurin, et l'intégrité repose sur la **signature Authenticode**. Quinze
affirmations passées de « lues » à « exécutées », et l'une a trouvé un défaut
du catalogue proposé — `ADD GENERATED` exige un `NOT NULL` préalable.

## 4. S0 à S8 : le moteur SQL natif, 91 formulations, 84 refus en 10 raisons

Le noyau reçoit `simpleEquality`, **additive et fermée** dans les quatre
profils publiés. Le test du contrat des capacités a fait son travail en
**échouant**. `==` et `!=` sont **refusés** et non corrigés : la règle 5
interdit la correction silencieuse. `RAISONS_SQL` vérifie son exhaustivité
**au chargement**.

## 5. S11 : l'exercice de la bibliothèque, exécuté, et trois défauts trouvés

109 phrases, 0 retouche. L'insertion de clause **consommait** la ligne
blanche — la décision S2 ne tenait pas. `WITH … AS (…)` suivi d'un
point-virgule n'est pas du SQL valide ; c'est le serveur qui l'a dit. Et deux
lacunes du catalogue : deux colonnes entières, et l'affectation d'un texte.

## 6. S9 et S10 : la quatrième session, et le français souple mesuré en SQL

Session distincte, à **deux** voies au lieu de trois : le catalogue partagé
n'est jamais consulté. 39/40, **0 erreur de sens**. Le risque était
**prévisible** : les sept noms communs de SQL sont dans la garde des
identifiants **avant** la mesure.

## 7. S10 : neuf scénarios hôte pour SQL, 130/130 par l'IHM réelle

Trois n'ont d'équivalent dans aucun autre langage : la composition de **deux**
clauses d'affilée, le refus d'une clause hors requête, et le refus d'une
clause dans le mauvais ordre dont le message **nomme** la clause qui bloque.

## 8. S11 : l'exercice est verrouillé par un test qui relit son journal

Les chiffres du calcul fait à la main sont **écrits** dans le test, pas lus du
journal : un journal qui se vérifierait lui-même ne vérifierait rien.

## 9. S11 : phase 4 close, documents publics à jour, et un chemin personnel retiré

Le contrôle d'hygiène a trouvé un chemin personnel dans le journal —
anonymisé **à la source**, par motif et non par comparaison littérale, la
casse suffisant à faire échouer le remplacement.

## 10. 0.7.0 : documents publics des quatre langages, et le bilan consolidé

Le tableau comparatif est **mesuré** sur le moteur. Cinq enseignements
consignés, dont celui qui vaut pour les quatre : **un test unitaire ne voit
pas ce qu'un programme entier montre.**

## 11. Un `git status` propre ne prouve pas que le disque est canonique

La reproductibilité au bit **était cassée** : des CRLF locaux là où le dépôt
stocke des LF, invisibles à git puisque le contenu normalisé était identique.
48 fichiers concernés. Vingtième contrôle de pré-publication, qui regarde le
**disque** — et qui a attrapé son propre fichier.

## 12. La fusion, l'étiquette et la clôture

Fusion en squash, étiquette `v0.7.0`, release publiée en *pre-release*.
Bilan : [`BILAN_SQL_V1.md`](BILAN_SQL_V1.md). Clôture :
[`CLOTURE.md`](CLOTURE.md).
