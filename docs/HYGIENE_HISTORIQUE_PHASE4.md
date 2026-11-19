# Supprimer une branche n'efface rien — mesuré le 19 novembre 2026

Quatre commits de la branche `phase-4-sql` portaient un **chemin personnel**
dans le journal de l'exercice SQL : `psql` préfixe ses erreurs du chemin
absolu du script, et le journal est versionné.

Ce document dit ce qui a été fait, **ce que cela a changé**, et surtout **ce
que cela n'a pas effacé**. Il ne présente pas la suppression de la branche
comme une garantie.

---

## 1. Ce qui a été fait

| Geste | Effet |
|---|---|
| anonymisation **à la source** dans `exercice/sql/cloture.mjs` | les journaux produits ensuite ne portent plus de chemin |
| fusion dans `main` en **squash** | l'historique de `main` ne contient **aucun** des quatre commits |
| suppression de la branche **distante** `phase-4-sql` | les commits ne sont plus atteignables par un ref |
| branche **locale** conservée | l'historique de développement reste consultable hors ligne |

**Le contrôle de pré-publication le confirme** : `git log main -S<utilisateur>`
ne trouve rien, et les 20 contrôles passent sur `main`.

## 2. Ce que la suppression **n'a pas** effacé — mesuré

Après la suppression de la branche distante, interrogé **anonymement** :

| Épreuve | Résultat |
|---|---|
| `git clone` anonyme, puis `git cat-file` sur l'un des quatre commits | **échoue** — l'objet n'est pas servi à un clone |
| API `repos/…/commits/<sha>` pour les quatre | **200** — les quatre répondent |
| `raw.githubusercontent.com/…/<sha>/exercice/sql/journal/cloture.json` | **200**, et le contenu **porte encore le chemin** |

**Conclusion, sans adoucissement : le contenu reste lisible par quiconque
connaît le hachage.** GitHub continue de servir les objets devenus
inatteignables jusqu'à une collecte qu'il ne déclenche pas de lui-même.

## 3. Ce qui protège réellement, aujourd'hui

Une seule chose, et elle est fragile : **les hachages ne sont publiés nulle
part**. La convention du dépôt interdit de citer un hachage dans un document,
et un contrôle de pré-publication l'impose — « aucune citation de hachage
dans les documents ». Sans le hachage, l'objet n'est pas trouvable : il n'est
listé par aucune branche, aucune étiquette, aucune comparaison.

C'est une protection par **obscurité**, pas par effacement. Elle suffit à un
chemin de dossier ; **elle ne suffirait pas à un secret**. Si un jeton, une
clé ou un mot de passe avait été commis, cette page dirait qu'il faut le
**révoquer**, et non le cacher.

## 4. Ce qu'il faudrait pour effacer vraiment

Trois voies, de la plus simple à la plus lourde :

1. **demander à l'assistance GitHub** de collecter les objets devenus
   inatteignables. C'est la procédure que GitHub documente lui-même après une
   réécriture d'historique, et c'est la seule qui retire l'objet sans toucher
   au dépôt ;
2. **supprimer et recréer le dépôt** en poussant un historique propre — coûte
   les étoiles, les tickets, les permaliens et la redirection de l'ancien nom ;
3. **ne rien faire**, en acceptant que le chemin reste lisible à qui connaît
   le hachage.

**Aucune n'est engagée** : la décision appartient au fondateur. Ce qui est
engagé, c'est de ne pas prétendre que le problème est réglé.

## 5. Ce qui empêche la récidive

| Garde | Ce qu'elle arrête |
|---|---|
| anonymisation **à la source**, par motif et non par comparaison littérale | un nettoyage séparé s'oublie ; et la casse — `c:/Users` contre `C:\Users` — suffisait à faire échouer un remplacement littéral |
| contrôle « aucun chemin personnel dans les fichiers suivis » | un fichier versionné qui en porterait un |
| contrôle « aucun nom d'utilisateur dans l'historique de `main` » | une fusion qui en ferait entrer un, puisqu'il scanne **tout** l'historique |
| contrôle « aucune citation de hachage dans les documents » | la publication du pointeur qui rendrait l'objet trouvable |

**Et une leçon de méthode, parce que je l'ai apprise ici :** mon premier
dénombrement annonçait **deux** commits concernés. Il en manquait la moitié,
parce qu'il cherchait le motif dans tous les fichiers au lieu du journal, et
qu'un faux positif — un document citant `C:\Users\<nom>` comme *exemple* —
avait masqué les vrais. **Un dénombrement approximatif d'une fuite est pire
qu'aucun dénombrement** : il rassure. Ils sont **quatre**.
