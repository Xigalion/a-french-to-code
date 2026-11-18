# Phase 3 — Java 21 LTS comme version de référence, et ses contraintes

**Proposition : Java 21 LTS.** Ce document dit pourquoi, et surtout ce que ce
choix **oblige** et **interdit**. Les faits de version ont été vérifiés contre
les JEP et les notes de version, pas cités de mémoire.

---

## 1. Pourquoi 21, et pas autre chose

| Candidat | Verdict |
|---|---|
| **21 LTS** (sept. 2023) | **proposé** — LTS, largement installé, enseigné |
| 17 LTS | plus ancien ; rien n'y gagne pédagogiquement |
| 25 LTS | plus récent, mais aligne A sur une version que les établissements n'ont pas encore |
| non-LTS (22, 23, 24) | support court : un enseignement ne se cale pas dessus |

**L'argument décisif n'est pas la nouveauté.** C'est que `--release 21` donne
un compilateur qui **refuse** ce qui n'existe pas en 21, donc un code produit
dont la validité est vérifiable, et le même dans dix ans.

## 2. Ce qui est **final** en 21 et qu'on peut donc produire sans drapeau

| Fonctionnalité | Depuis |
|---|---|
| `record` | 16 |
| classes scellées (`sealed`) | 17 |
| `switch` à motifs, motifs de `record` | **21** |
| collections séquencées (`SequencedCollection`) | **21** |
| fils virtuels | **21** |
| `var` (inférence locale) | 10 |
| blocs de texte (`"""`) | 15 |

**Aucune de ces sept n'est nécessaire au catalogue V1.** Elles sont listées
pour une raison inverse : savoir ce qu'on **choisit de ne pas utiliser**, et
pouvoir le dire. Voir la décision **J8** pour `var`, et **J7** pour `record`.

## 3. Ce qui est **preview** en 21 — et ce que ça décide

**JEP 445, « classes implicites et méthodes `main` d'instance », est une
fonctionnalité *preview* en Java 21.** Elle permettrait d'écrire un programme
sans classe ni `static` :

```java
void main() {
    System.out.println("bonjour");
}
```

C'est exactement ce qu'un débutant voudrait écrire. **Et c'est un piège pour
A**, pour trois raisons mesurables :

1. il faut **deux drapeaux** : `javac --release 21 --enable-preview` puis
   `java --enable-preview`. Sans eux, le fichier **ne compile pas** ;
2. le compilateur émet un **avertissement obligatoire** de fonctionnalité en
   avant-première, à chaque compilation ;
3. une *preview* **peut changer**, et elle a changé : la suite de ce travail
   est passée par un second *preview* avant d'être finalisée dans une version
   ultérieure. Un code enseigné par A cesserait de compiler.

**Conséquence, et c'est la décision J1 :** Java-A V1 produit une **classe
explicite** et un `public static void main(String[] args)` **explicite**, tous
deux **commandés par une phrase**. A n'ajoute ni classe ni `main` de lui-même
— règle 3 — et ne produit **aucun code en avant-première**.

Le coût est assumé et il est pédagogique : le premier programme Java demande
**trois** phrases là où Python en demande une. C'est une propriété de Java, pas
une maladresse de A, et une information passive le dira.

## 4. Les contraintes du compilateur que A doit connaître

### 4.1 Nom de fichier imposé

`javac` refuse une classe `public` dont le nom diffère de celui du fichier :

    class Eleve is public, should be declared in a file named Eleve.java

**C'est la première contrainte de A qui ne porte pas sur le code.** Deux
réponses possibles, décision **J4** :

- produire `class Eleve` **sans** `public` quand le nom ne correspond pas — A
  choisirait à la place de l'utilisateur : **écarté** ;
- **informer** : accepter, produire `public class Eleve`, et émettre une
  information passive disant que le fichier doit s'appeler `Eleve.java`.
  **Recommandé** — A diagnostique, il ne corrige pas (règle 5).

### 4.2 Paquetage imposé

`package ecole;` exige que le fichier vive dans `ecole/`, relativement à la
racine de compilation. Même traitement proposé : accepter, et **informer**.

### 4.3 Exceptions vérifiées

Une méthode qui lit un fichier **doit** déclarer `throws IOException` ou
attraper l'exception. Sinon :

    unreported exception java.io.IOException; must be caught or declared to be thrown

**C'est la contrainte la plus lourde de toute la phase 3**, parce qu'elle fait
dépendre une ligne d'une **autre ligne déjà écrite** : la signature de la
méthode englobante. Ajouter `throws` tout seul violerait la règle 9 — ne jamais
modifier une portion de code que l'utilisateur n'a pas autorisée. Décision
**J6**.

### 4.4 `static`, et le piège du premier programme

`main` est `static`. Une méthode d'instance appelée depuis `main` ne compile
pas :

    non-static method afficher() cannot be referenced from a static context

C'est **l'erreur la plus fréquente du débutant Java**, et A peut la produire
sans un mot : A est **sans état** et ne sait pas, en écrivant un appel, si la
méthode visée est `static`. Décision **J3**, et une information passive dès la
déclaration de méthode — le même procédé que `POINTER_ARITHMETIC_ABSENT` au
lot 30, posé à la déclaration faute de pouvoir le poser à l'usage.

### 4.5 Ce que Java **n'a pas**, et qu'il faut refuser nommément

| Notion du catalogue C | En Java |
|---|---|
| pointeurs, `&`, `*`, arithmétique de pointeurs | **absents** |
| `malloc`, `free`, `realloc`, `sizeof` | **absents** — ramasse-miettes |
| `unsigned int` | **absent** — pas d'entier non signé |
| `struct`, `typedef` | **autrement** : `class` ou `record` |
| `#include`, gardes d'en-tête | **autrement** : `import`, et aucune garde |
| `printf` sans retour à la ligne | **existe** (`System.out.printf`), mais voir §5 |

Chacune donnera un **refus nommé** désignant la construction Java qui enseigne
la même compétence. C'est le modèle des 51 refus de Python.

## 5. Un renversement de sens à ne pas laisser passer

`System.out.println` **ajoute un retour à la ligne**. `printf` en C
**n'ajoute rien**, et le lot 29 avait livré une information passive,
`OUTPUT_HAS_NO_SEPARATOR`, précisément pour l'enseigner.

Porter `Affiche la valeur de n.` vers `println` **changerait le sens** d'une
phrase du catalogue. Décision **J2** : la porter vers `System.out.print(n)`,
qui n'ajoute rien, et donner à `println` sa **propre phrase**. Le sens d'une
phrase française ne change pas selon le langage cible.

## 6. La chaîne d'outils : absente de cette machine

Mesuré le 18 novembre 2026 :

| Outil | État |
|---|---|
| `java` | **absent du `PATH`** |
| `javac` | **absent du `PATH`** |
| `C:\Program Files\Java` | **inexistant** |
| `C:\Program Files\Eclipse Adoptium` | **inexistant** |

**Aucun JDK n'est installé.** Or le plan de validation exige des compilations
`javac` réelles et des exécutions réelles : sans JDK, la phase 3 produirait des
documents et des tests unitaires, mais **aucune preuve de compilation** — et le
projet a déjà écrit que la réussite des tests automatisés ne vaut pas
complétion.

**C'est une autorisation externe à demander**, exactement comme GCC en
novembre : un **JDK Temurin 21 portable** (archive `.zip`, hors du dépôt,
lancé par chemin relatif, rien ajouté au `PATH` du système). Voir
`PLAN_JAVA.md` §6.
