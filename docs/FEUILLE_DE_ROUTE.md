# Feuille de route du projet A — décidée le 18 novembre 2026

Document de **périmètre**, pas de planning. Il dit quels langages A traduira,
dans quel ordre, et ce qui vient après. Il ne promet aucune date.

---

## 1. La décision

**Quatre langages fondamentaux**, avant tout modèle pédagogique supérieur :

| Ordre | Langage | Déclinaison | État au 18 novembre 2026 |
|---|---|---|---|
| 1 | **C17** | C-A | **livré** — V1 publique, 84 intentions, 19 programmes compilés |
| 2 | **Python** | Python-A | **livré** — 0.5.0, 97 intentions, 9 programmes exécutés |
| 3 | **Java** | Java-A | **phase 3 ouverte** le 18 novembre 2026 |
| 4 | **SQL** | SQL-A | **pas commencé**, et ne doit pas l'être |

Puis, et seulement ensuite : le **modèle pédagogique 2** — le palier de
liberté linguistique où des formulations plus concises et des valeurs par
défaut documentées deviennent acceptables.

**Rust** sera intégré **ultérieurement**, après les quatre fondamentaux et
sans engagement de rang.

## 2. Pourquoi cet ordre tient

Ce n'est pas un ordre de difficulté, c'est un ordre de **ce que chaque
langage oblige à construire**.

- **C17** a fixé le socle : une phrase, une instruction, un commentaire exact,
  un aperçu avant insertion. Il a aussi fixé la limite la plus dure : A ne
  vérifie **ni** symboles, **ni** types, **ni** bornes ;
- **Python** a obligé à inventer le **registre de langages** et un second
  placement — par indentation. Il a prouvé qu'un second langage n'est pas un
  portage : 51 intentions du C y sont **refusées avec une raison** ;
- **Java** oblige à affronter ce que ni C ni Python ne demandaient :
  l'**objet** comme unité obligatoire, des contraintes de **système de
  fichiers** (nom de classe = nom de fichier, paquetage = répertoire), et les
  **exceptions vérifiées**, qui sont une obligation du compilateur et non un
  choix du programmeur ;
- **SQL** obligera à affronter autre chose encore : un langage **déclaratif**,
  sans flot d'exécution, sans variables au sens des trois autres. C'est la
  raison de le garder pour la fin, pas de le considérer facile.

## 3. Ce que la feuille de route ne décide pas

- **le nombre d'intentions** d'un langage. Aucun plafond n'est fixé : le
  catalogue d'un langage est celui que son enseignement exige ;
- **la parité entre langages.** Python-A n'a pas de classes, Java-A en aura
  forcément — une classe est obligatoire pour exécuter la moindre ligne. Une
  asymétrie n'est pas un retard : c'est le langage qui parle ;
- **quand un langage est « fini ».** Le seul juge prévu reste un **exercice
  intégrateur** compilé et exécuté, puis l'usage réel.

## 4. L'invariant, inchangé depuis la phase 1

**Compétence de programmation et liberté linguistique sont indépendantes.**
Un palier ne réserve aucune capacité de programmation, et un langage de plus
n'allège aucune des neuf règles non négociables.

Et celle qui compte le plus ici : **A n'invente jamais une information
manquante.** Java rendra cette règle plus coûteuse que jamais — il réclame des
choses que l'utilisateur n'a pas dites (une classe, un `static`, un `throws`),
et la tentation de les ajouter en silence sera forte. Elles seront **demandées
ou refusées**, jamais supposées.
