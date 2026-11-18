# Phase 3 — audit du socle multilangage, vu depuis Java

**Question posée :** qu'est-ce qui existe déjà et sert pour Java **tel quel**,
qu'est-ce qui sert **avec un paramètre**, et qu'est-ce qui n'existe pas.

Mesuré en lisant les fichiers, pas de mémoire. Chiffres au 18 novembre 2026.

---

## 1. Le socle, en lignes

| Module | Lignes | Pour Java |
|---|---|---|
| `src/langages/registre.ts` | 111 | **tel quel** |
| `src/langue/variantes.ts` | 320 | **tel quel**, arbitre à écrire |
| `src/langue/reformulations.ts` | 521 | **tel quel** |
| `src/expressionCore.ts` + les trois profils | — | **tel quel** |
| `src/planPlacement.ts` (accolades) | 332 | **à ne pas réutiliser** — §4.1 |
| `src/statementScope.ts` | 83 | **à étendre sans y toucher** — §4.3 |
| `src/langages/python/*` | 2 170 | **modèle à imiter**, aucun code partagé |

## 2. Réutilisable tel quel — rien à écrire

### Le registre

Un langage y déclare sept choses, et aucune n'est propre au C ou à Python :
`nom`, `extensions`, `blocs`, `commentaire`, `portees`, `raisons`, `rendre`,
et `natif` en option.

Java s'y inscrit sans modifier une ligne du registre :

| Champ | Valeur Java |
|---|---|
| `nom` | `'java'` |
| `extensions` | `['.java']` |
| `blocs` | `'accolades'` — **la même étiquette que C17** |
| `commentaire` | `(phrase) => '// ' + phrase` — **identique au C17** |

Le type `RenduResultat` distingue déjà les deux refus dont Java aura besoin :
`INTENTION_NON_PORTEE` (le langage n'a pas la notion) et
`CONSTRUCTION_NON_PORTEE` (il l'a, mais pas ce qu'elle contient). Un pointeur
dans une expression Java relève du second, exactement comme en Python.

### Le noyau d'expressions

Les trois profils publiés — entier, numérique, condition — sont définis par un
**enregistrement de capacités**. Java n'a besoin d'aucun profil nouveau : ses
opérateurs arithmétiques, de comparaison et logiques sont ceux du C, avec la
même priorité. Deux capacités sont simplement **fermées** : l'adresse `&` et
le déréférencement `*` unaires.

**Et une bonne nouvelle, mesurable :** en Java, `/` entre entiers tronque vers
zéro et le signe de `%` suit le dividende — **comme en C17, contrairement à
Python**. Les deux sémantiques que Python a obligé à séparer par des phrases
distinctes se reportent ici **sans adaptation**.

### Le français souple

`normaliser<C>(phrase, { budget, arbitre })` est déjà **paramétré par un
arbitre**. Les 98 reformulations sont des règles **français → français** :
elles ne savent pas quel langage les consomme, et n'ont donc pas à changer.

Le seul travail est un `ARBITRE_JAVA`, sur le modèle exact d'`ARBITRE_PYTHON` :
il écarte les candidates que Java ne porte pas, pour que la couche ne retienne
jamais une lecture que le langage refusera.

Une conséquence à écrire noir sur blanc : les reformulations qui désignent des
notions du C — `Libère la mémoire de p.` — ne deviennent pas des pièges, elles
tombent simplement comme non acceptées par l'arbitre. C'est déjà le
comportement observé pour Python.

## 3. Réutilisable comme modèle — à réécrire, pas à partager

Le catalogue natif Python est un **patron** éprouvé, et c'est sa forme qu'il
faut reprendre, pas son contenu :

| Fichier Python | Rôle | Équivalent Java à écrire |
|---|---|---|
| `catalogue.ts` (632 l.) | motifs ancrés, placeholders typés, drapeau `d` | un catalogue natif Java (J3 à J8) |
| `instructions.ts` (221 l.) | l'union des genres natifs | son union de genres (J3 à J8) |
| `renduNatif.ts` (355 l.) | le rendu, un genre une ligne | son rendu natif (J3 à J8) |
| `rendu.ts` (238 l.) | les intentions **portées** du catalogue partagé | `src/langages/java/rendu.ts` — **livré au lot J1** |
| `raisons.ts` (167 l.) | un refus **nommé** par intention absente | `src/langages/java/raisons.ts` — **livré au lot J1** |
| `informations.ts` (325 l.) | les informations passives | des informations passives (J3 à J8) |
| `placement.ts` (244 l.) | le placement propre au langage | §4.1 |
| `langage.ts` (58 l.) | l'inscription au registre | `src/langages/java/langage.ts` — **livré au lot J1** |

Trois leçons du patron à ne pas réapprendre :

1. **les motifs sont compilés avec le drapeau `d`.** Localiser une capture par
   `indexOf` avait résolu un texte `" "` sur la première espace de la phrase ;
2. **une seule entrée `natif`** par langage : analyse, rendu et informations
   d'un coup, parce que pour une intention native la phrase française et le
   code produit appartiennent au même module ;
3. **une règle générale de texte en trop**, pas une par motif. Deux
   diagnostics avaient été perdus en la particularisant.

## 4. Ce qui n'existe pas et qu'il faut construire

### 4.1 Le placement : l'étiquette `accolades` ne suffit pas

Java porte l'étiquette `accolades`, mais `planPlacement` encode des règles
**du C**, et non des règles **des accolades** :

| Règle de `planPlacement` | Vraie en Java ? |
|---|---|
| une instruction exécutable exige un corps de **fonction** | **non** : elle exige une **méthode**, elle-même dans une **classe** — deux niveaux, pas un |
| une déclaration est plaçable à la portée fichier | **non** : un champ se place dans une classe, et rien d'exécutable ne vit à la portée fichier |
| une directive se place avant tout le reste | partiellement : `package` précède les `import`, qui précèdent la classe — un ordre **à trois temps** que le C n'a pas |
| une définition de fonction se place à la portée fichier | **non** : une méthode se place dans une classe |

**Conclusion : un module de placement propre à Java**, comme Python en a un. La
décision 2 du socle — les modules de placement se **sélectionnent**, ils ne
s'unifient pas — est ici **confirmée** plutôt que contredite : deux langages à
accolades n'ont pas les mêmes portées.

Ce qui **est** réutilisable : la **forme** des réponses (`planifie` /
`refuse`, un intervalle UTF-16 semi-ouvert, un plan que seul l'hôte applique),
et l'idée du reconnaisseur contextuel borné — `structTarget.ts`,
`switchTarget.ts` — dont Java aura besoin pour savoir dans quelle **classe**
on écrit.

### 4.2 Deux contraintes que ni C ni Python n'ont jamais posées

Elles touchent le **système de fichiers**, et aucun module existant ne les
connaît :

1. **le nom du fichier.** `javac` exige qu'une classe `public` vive dans un
   fichier portant **son nom** : `public class Eleve` ⇒ `Eleve.java`. Une
   phrase acceptée peut donc produire un fichier qui ne compile pas **pour une
   raison qui n'est pas dans le code** ;
2. **le paquetage.** `package ecole;` exige que le fichier vive dans un
   répertoire `ecole/`.

Ce sont les premières contraintes de A qui dépendent de **où** le fichier est,
pas de **ce qu'il contient**. Traitées en `DECISIONS_JAVA.md`, décisions **J4**
et **J5**.

### 4.3 Le `statementScope` à étendre

La partition des 84 genres répond à « une instruction peut-elle figurer
ici ? » avec **deux** réponses : portée fichier, ou corps de fonction. Java en
demande **quatre** :

| Portée Java | Ce qui y vit |
|---|---|
| fichier | `package`, `import` |
| corps de classe | champs, méthodes, constructeurs |
| corps de méthode | tout l'exécutable |
| corps d'interface | des signatures **sans corps** |

L'extension doit se faire **sans toucher** à la partition existante : un test
l'impose exhaustive sur les 84 genres, et un genre déplacé serait une
régression du C.

## 5. L'hôte VS Code

Trois points d'accroche, tous déjà prévus pour un langage de plus :

| Point | État |
|---|---|
| `CIBLES` dans `extension.ts` | une ligne : `{ langage: 'java', extension: '.java', languageId: 'java' }` |
| une session par langage | `SessionControleur` est un **contrat structurel** que les deux sessions satisfont déjà |
| un réglage par langage | `c-a.python` existe ; `c-a.java` sur le même modèle |

**Un point d'attention, pas un blocage :** `sessionPython.ts` fait 366 lignes,
et une `sessionJava.ts` les dupliquerait en grande partie. La décision **J9**
pose la question — factoriser maintenant ou après — et recommande **après** :
une abstraction tirée de **deux** cas se trompe plus souvent qu'une
abstraction tirée de trois.

## 6. Ce que cet audit ne dit pas

Il ne dit pas que Java ira plus vite que Python parce que le socle existe.
L'audit de la phase 2 avait estimé un volume et s'était trompé de **4 %** —
bonne nouvelle, mais sur un travail dont la **nature** était connue.

Java introduit une nature nouvelle : l'objet comme unité obligatoire, les
exceptions vérifiées, et deux contraintes de système de fichiers. **Aucune
ligne du socle actuel n'a jamais eu à les traiter.**
