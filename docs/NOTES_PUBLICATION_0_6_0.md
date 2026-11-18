# A 0.6.0 — trois langages cibles

*Corps de la release GitHub. Il se **produit**, il ne se recopie pas :*

    node scripts/notes-release.mjs 0_6_0     # écrit dist/notes-release-v0.6.0.md

---

**A** traduit une phrase française en **une** instruction, montre un aperçu, et
n'insère rien sans confirmation. Cette version ajoute un troisième langage
cible : **Java 21**.

Le projet se décline : **C-A** vers C17, **Python-A** vers Python, **Java-A**
vers Java 21. Une seule extension porte les trois.

**Toujours un prototype pédagogique.** Pas un produit.

## Java n'est pas un portage du C

Il a son **propre catalogue pédagogique**, adapté à ses notions :

```
Crée une classe nommée Eleve qui implémente Affichable.
```

```java
// Crée une classe nommée Eleve qui implémente Affichable.
public class Eleve implements Affichable {
    
}
```

| | |
|---|---|
| formulations | **144** — 30 reprises du catalogue partagé, 27 adaptations, **87 natives** |
| refus nommés | **27**, chacun désignant la construction Java qui enseigne la même compétence |
| informations pédagogiques passives | **28** |
| placement | par **accolades**, mais à **quatre portées** : fichier, classe, méthode, interface |

**Et l'étiquette « accolades » ne suffisait pas.** Java la porte comme C17, et
son placement a pourtant dû être écrit : en Java, rien d'exécutable ne vit à
la portée fichier — pas même une affectation —, une méthode exige une
**classe** (deux niveaux, pas un), et `package` précède les `import` qui
précèdent le type.

## Java 21 LTS, sans avant-première

Les classes implicites et le `main` d'instance sont *preview* dans Java 21 :
le code produit exigerait `--enable-preview` à la compilation **et** à
l'exécution, et cesserait de compiler quand la fonctionnalité changerait.

Le point d'entrée est donc une classe **explicite** et un `main` **explicite**,
commandés par deux phrases. Le premier programme Java demande **trois** phrases
là où Python en demande une : c'est Java qui l'exige.

Dans le même esprit, `record`, le `switch` fléché et `var` sont **refusés** —
ils cachent précisément ce que les domaines concernés enseignent : le
constructeur, la traversée des cas, et le type.

## Les différences de sens ne sont jamais lissées

`7 / 2` vaut **3** en C17 **et en Java**, **3.5** en Python. `-7 % 2` vaut
**-1** en C17 et en Java, **1** en Python. Les deux refus que Python avait
exigés n'ont donc **aucun** équivalent en Java — vérifié par exécution, pas
supposé.

Trois informations passives **corrigent une règle apprise ailleurs** :

- le `switch` de Java **traverse** les cas, comme en C17 — l'inverse exact du
  `match` de Python ;
- le bloc essaie **avec ressource** ferme le fichier tout seul, comme `with` en
  Python, et à l'inverse de C17 où il **faut** fermer ;
- `println` **ajoute** un retour à la ligne, là où `printf` n'ajoute rien. Les
  deux ont **leur** phrase.

Et **deux** informations disent une **lacune de A**, pas une propriété de
Java : A est sans état, donc il ne sait pas si une méthode est `static` ; et il
n'applique **aucun** contrôle de visibilité.

## Les trois réglages

Tous **actifs par défaut**, et chacun se ferme :

| Réglage | À `false` |
|---|---|
| `c-a.souplesse` | restaure le **mode strict** : seules les phrases exactes du catalogue |
| `c-a.python` | n'ouvre pas les fichiers `.py` |
| `c-a.java` | n'ouvre pas les fichiers `.java` |

## Le français souple, réutilisé tel quel

Les **98 reformulations** de la 0.5.0 servent sans modification : ce sont des
règles français → français, elles ne savent pas quel langage les consomme.

Mesuré sur un corpus indépendant Java : **36 phrases claires sur 36
reconnues**, **0 acceptée à tort**, **0 erreur de sens**.

**Et cette mesure a trouvé un défaut de sens** qui touchait aussi C17 et
Python : dans « Appelle la méthode afficher de e. », le mot `afficher` est au
lexique, et la couche produisait `e.Affiche();` — **A renommait silencieusement
la méthode de l'utilisateur**. C'est la faute la plus grave de la
classification, et la seule qu'aucun taux ne rachète. Corrigée, puis corrigée
une seconde fois parce que la correction sur-protégeait à son tour.

## Ce que cette version ne change pas

**C-A et Python-A sont strictement préservés.** Différentiel contre la 0.5.0 :
**1 335 559 comparaisons, 0 régression, 0 capacité perdue**. La partition des
84 genres du moteur n'a pas été touchée, et un test l'impose toujours
exhaustive.

## Preuves livrées avec cette version

| | |
|---|---|
| tests | **4 438** Node, **121** hôte VS Code |
| suite hôte | **quatre** combinaisons : sources et **paquet**, × VS Code **1.96.4** et **1.138.0** |
| exercice de clôture Java | **4 fichiers, 96 phrases, 0 retouche manuelle** |
| compilation | `javac --release 21 -encoding UTF-8 -Xlint:all` : code 0, **aucun avertissement** |
| exécution | `java -ea` : code 0, sortie conforme au **calcul fait à la main** |
| français souple en Java | **36/36**, 0 acceptée à tort, 0 erreur de sens |
| différentiel contre la 0.5.0 | **0 régression, 0 capacité perdue** |

## Mettre à jour depuis la 0.5.0

L'identifiant de l'extension **ne change pas** — `projet-a-local.c-a` —, donc
la mise à jour se fait normalement, sans rien désinstaller. **Vérifié** : après
installation de la 0.6.0 par-dessus la 0.5.0, VS Code ne liste qu'**une**
extension, marque l'ancien dossier obsolète, et aucune seconde extension ne
cohabite.

```
code --install-extension c-a-0.6.0.vsix
```

Le paquet est **reproductible au bit** : deux constructions du même commit,
depuis deux clones différents, donnent le même fichier.

```
sha256  49e56b55b0f5b9ab7cffccc6a941351f5a99c1a314e3d3c6d9ee8596debc3cab
taille  210 661 octets, 62 entrées
```

Pour le vérifier vous-même :

```bash
git clone --branch v0.6.0 <dépôt> verification
cd verification && npm ci && npm run build:extension && node scripts/paquet.mjs
```

## Ce que cette version ne fait pas

- **aucune vérification de symboles, de types, de bornes ni de clés**, dans
  aucun des trois langages. Et **aucun contrôle de visibilité** en Java : lire
  un champ `private` depuis une autre classe est accepté par A et refusé par
  `javac`. Une insertion acceptée n'est pas un programme correct ;
- **trois obligations de Java que A ne satisfait pas pour vous** : les
  exceptions vérifiées — A ne choisit ni `try`/`catch` ni `throws` —, `static`,
  et le nom du fichier que `javac` impose. Les trois sont **dites** par des
  informations passives, et **aucune n'est refermée** ;
- **les classes Python** n'y sont toujours pas, ni le `else` de boucle, ni la
  boucle à test final. Java-A a donc les classes avant Python-A : ce n'est pas
  un retard, c'est le langage qui parle — une classe est obligatoire pour
  exécuter la moindre ligne de Java ;
- **aucun essai par un utilisateur**, dans aucun des trois langages. Les
  programmes de preuve sont dictés par des scripts ;
- **aucun essai hors Windows**, un seul compilateur C, un seul interpréteur
  Python, un seul JDK — Temurin 21.0.13.

Tout cela est détaillé dans `docs/LIMITES_CONNUES.md`, à lire **avant** de
conclure à un défaut. *(Chemin écrit en clair et non en lien : ce document est
un gabarit à coller dans une release, où un lien relatif se résout contre la
racine du dépôt et non contre `docs/`.)*

## Le dépôt a changé de nom

Il s'appelle désormais **`a-french-to-code`**. GitHub assure la **redirection
permanente** depuis l'ancien nom.

## Licence

Apache-2.0.
