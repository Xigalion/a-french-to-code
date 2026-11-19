# Limites connues de A — C-A, Python-A, Java-A

**Pour qui :** quiconque s'apprête à utiliser C-A, ou à ouvrir un ticket.
À lire **avant** de conclure à un défaut.

> Ce document liste ce que C-A **ne fait pas**. Les miroirs — ce qu'il fait,
> avec la sortie exacte — sont `docs/CATALOGUE.md` pour C17 et
> `docs/CATALOGUE_PYTHON.md` pour Python. **Tout ce qui ne figure pas à un
> catalogue est refusé**, et c'est le périmètre, pas une panne.
>
> État au 17 novembre 2026, C-A 0.5.0. Les limites ci-dessous valent pour les
> **deux** langages, sauf mention contraire ; celles qui sont propres à Python
> sont regroupées à la fin.

---

## 1. La limite qui compte plus que toutes les autres

**C-A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements.**

```
Affecte la valeur 5 à inexistant.      →  inexistant = 5;      accepté, sans un mot
```

Aucune variable `inexistant` n'existe. C-A l'accepte parce qu'il est **sans
état d'une instruction à l'autre** : il ne relit pas votre document pour
savoir ce qui y est déclaré. Le compilateur, lui, refusera.

Conséquence à retenir : **une insertion acceptée n'est pas un programme
correct, et ne garantit même pas qu'il compile.** Dix programmes écrits par
C-A compilent et s'exécutent dans ce dépôt — c'est dix, pas tous.

Une exception, et une seule : **le placement**. Depuis le lot 26, une
instruction exécutable est refusée hors d'un corps de fonction
(`STATEMENT_AT_FILE_SCOPE`), et une définition de fonction est refusée à
l'intérieur d'une autre (`FUNCTION_DEFINITION_NESTED`). C-A lit alors les
accolades du document — c'est la seule famille de vérifications
contextuelles qu'il sait faire.

## 2. Ce que le langage couvert ne contient pas

| Absent | Détail |
|---|---|
| types | pas de `long`, `short`, `unsigned char`, `signed char`, `_Bool`. Les types sont `int`, `unsigned int`, `float`, `double`, `char`, `void` |
| `goto` | n'appartient à aucune notion des neuf domaines |
| `typedef` | sauf le **synonyme de structure** (`typedef struct Noeud Noeud;`) |
| énumérations, unions déclarées, champs de bits | non livrés |
| tableaux à plusieurs dimensions | non livrés |
| listes d'initialisation `{1, 2, 3}` | non livrées — **composables** élément par élément |
| dimension déduite `char s[] = "…"` | non livrée : la dimension est toujours écrite |
| affectation globale d'un tableau ou d'une chaîne | non livrée |
| pointeurs | **un seul niveau** d'indirection ; ni pointeur de fonction, ni `void *`, ni paramètre ou retour de type pointeur |
| arithmétique de pointeurs | **uniquement** `*(nom + décalage entier)`. Ni soustraction, ni `p - q`, ni `++`/`--` |
| bibliothèques | `stdio.h`, `stdlib.h`, `assert.h`, `limits.h` et les en-têtes locaux. Pas de `string.h`, `float.h`, `stddef.h`, ni `NULL` |
| préprocesseur | gardes d'en-tête seulement. Pas de macro à remplacement, ni `#if`/`#ifdef`, ni `#define X 1` |
| divers | `calloc`, `sizeof` sur une **expression**, `fputs`, `fread`, `fseek`, `errno`, `static_assert` |

## 3. Les trois profils d'expression, et ce que chacun ferme

C-A analyse les expressions avec **trois profils** aux capacités
différentes. La même sous-expression peut donc être acceptée dans une phrase
et refusée dans une autre : ce n'est pas une incohérence, c'est le profil.

| Profil | Phrases | Ferme |
|---|---|---|
| **entier** (gelé depuis le lot 6) | `le résultat de "…"`, `Retourne le résultat de "…"`, l'expression d'un aiguillage | l'indexation `t[i]`, les littéraux caractères, `&` et `*` unaires, les conversions |
| **numérique** | `le résultat numérique de "…"` | rien de ce qui précède ; accepte conversions, indexation, membres, pointeurs |
| **indice** | entre les guillemets d'une désignation d'élément | les littéraux caractères, `*p`, `&x` |

Exemple vécu, et c'est le piège le plus fréquent :

```
Affecte à x le résultat de "(double) 7 / 2".            →  refusé : C_KEYWORD_IDENTIFIER
Affecte à x le résultat numérique de "(double) 7 / 2".  →  x = (((double) 7) / 2);
```

Le profil entier ne connaît pas les conversions : il lit `double` comme un
nom, et refuse un mot-clé C17 comme nom.

## 4. La désignation d'élément n'est pas disponible partout

`l’élément "{indice}" de {tableau}` est accepté comme cible d'affectation,
d'affichage, et — depuis le lot 32 — comme objet d'un **champ de structure**.
Elle **n'est pas** acceptée :

| Phrase | État |
|---|---|
| `Lis un entier depuis le fichier f dans l’élément "i" de t.` | **non livrée** — lire dans un scalaire, puis affecter l'élément |
| `Écris la valeur de l’élément "i" de t dans le fichier f.` | **non livrée** — copier dans un scalaire, puis écrire |
| `Affecte à l’élément "i" de t le résultat de l’appel de f avec "…".` | **non livrée** — affecter à un scalaire, puis à l'élément |

Chacune se contourne en **une ligne de plus**. C'est documenté, mesuré, et
tenu par un test pour éviter de les croire livrées.

## 5. Autres limites de formulation

- **une phrase par ligne**, curseur sur une **ligne blanche** ;
- les **accents sont exigés** ; le point final est facultatif ; les mots fixes
  sont insensibles à la casse ;
- les blocs (`si`, boucles, fonctions, aiguillage, structure) sont créés
  **vides** : à l'utilisateur de les remplir ;
- **sortir d'un bloc** est un geste d'éditeur, pas une commande : se placer en
  fin de la dernière ligne du niveau voulu et appuyer sur `Entrée` ;
- aucune formulation n'affiche un **champ** avec `%c` : un champ de type
  `char` s'affiche en `%d`, comme un entier ;
- la **flèche** n'est pas offerte sur un élément : `promo[i]->x` exigerait un
  tableau de pointeurs, qu'aucune formulation ne déclare ;
- aucune commande ne **nomme** une limite (`INT_MAX` s'écrit dans une
  expression, comme un nom) : une commande ferait croire que C-A connaît les
  bornes de l'implémentation ;
- **aucun séparateur n'est ajouté** entre deux affichages. Deux `printf` de
  suite collent leurs sorties, et `Affiche un retour à la ligne.` est une
  phrase à part entière.

## 6. Ce que C-A ne fait pas par principe

| Non | Pourquoi |
|---|---|
| corriger votre phrase | un diagnostic explique ; il ne fournit pas la phrase correcte à recopier. L'effort de chercher fait partie de l'apprentissage |
| inventer une valeur, un nom, un type | « aucun ajout implicite » : si l'information manque, C-A le dit |
| insérer sans confirmation | aperçu, puis confirmation, puis insertion — jamais de modification automatique |
| toucher une autre ligne que celle visée | une insertion est **une** modification annulable |
| compléter, suggérer, deviner (IA) | hors du périmètre du modèle 1, et contraire à la règle précédente |
| trier, chercher, échanger à votre place | aucune commande d'algorithme n'existe : un tri s'**écrit** avec les boucles et les affectations du catalogue |

## 7. Paliers de liberté

Le **palier 1** (actuel) exige une formulation **précise**. Le palier 2
autorisera des formulations plus concises et des valeurs par défaut
documentées ; il n'est pas livré. Le palier 3 n'a aucune définition de
référence.

**Invariant :** compétence de programmation et liberté linguistique sont
**indépendantes**. Un palier ne réserve aucune capacité de programmation : le
palier 1 donne accès aux neuf domaines, il les fait seulement écrire plus
longuement.

## 8. Limites de l'outillage, pas du produit

- la suite hôte VS Code exige **VS Code déjà installé** et ne le télécharge
  pas ;
- trois gestes de la recette restent **irréductiblement manuels** : frappe
  physique de `Ctrl+K A`, composition IME, contrôle visuel du focus et du
  diff ;
- le dépôt ne contient **aucun compilateur**. Les journaux de compilation ont
  été produits avec GCC 16.2.0 (MinGW-W64 UCRT), installé hors du dépôt ;
- `scripts/differentiel.mjs` exige une **référence git** : c'est un outil, pas
  un test, et il n'est pas dans `npm test`.

## 9. Ce que les chiffres de ce dépôt ne prouvent pas

- que **tout** le C produit par C-A compile — dix programmes l'ont fait ;
- que le score de complétion des campagnes soit une note : c'est une **part
  de preuve**, et l'audit `docs/AUDIT_BAREME.md` montre que le barème mesure
  **deux** choses et non cinq ;
- que les 91 sondes de ce barème épuisent les neuf domaines : leur choix n'a
  jamais été validé par un tiers ;
- qu'une suite verte démontre la stabilité : huit passages hôte verts
  consécutifs montrent qu'un site identifié est corrigé, rien de plus.

---

## Limites propres à Python

### Ce qui n'existe pas, et ne viendra pas dans cette version

| Notion | Pourquoi |
|---|---|
| les **classes** | elles méritent un domaine entier, avec leur propre contrat. Le regroupement de données nommées s'enseigne d'abord par un dictionnaire |
| le `else` d'une boucle | il s'exécute si la boucle n'a pas été interrompue par `break`, et il surprend plus qu'il n'aide un débutant |
| la boucle à **test final** | l'écrire demanderait de restructurer le corps, ce que C-A n'a pas le droit de faire |
| `except` nu | il attrape tout, interruption au clavier comprise, et ne se diagnostique pas. **Jamais écrit**, à aucun palier |
| `dict.get(clé)` | il rendrait `None` en silence sur une clé absente. C-A écrit l'accès direct, qui lève une erreur, et l'information le dit |
| une lecture de clé **par un nom de variable** | aucune formulation ne l'exprime. Mesuré par l'exercice de clôture, et consigné |
| insérer un **texte** ailleurs que dans une liste | les guillemets délimitent une expression ; le mot « texte » lève l'ambiguïté là où une formulation existe, pas partout |

### Ce que Python refuse là où C17 acceptait

C'est le point qui surprend le plus : **une phrase du catalogue C17 peut être
refusée dans un fichier `.py`**, et c'est voulu.

| Phrase | En C17 | En Python |
|---|---|---|
| `Déclare un entier nommé n.` | `int n;` | **refusée** : Python ne sépare pas déclaration et initialisation, et `n = 0` inventerait une valeur |
| `… le résultat de "a / b".` | `a / b` | **refusée** : `7 / 2` vaut 3 en C17 et 3.5 en Python. Deux phrases distinctes les remplacent |
| `… le résultat de "a % b".` | `a % b` | **refusée** : `-7 % 2` vaut -1 en C17 et 1 en Python |
| `Crée la fonction principale.` | `int main(void) {…}` | **refusée** : une phrase native écrit `if __name__ == "__main__":`, et dit que c'est une convention |
| `Déclare un tableau … de dimension 10.` | `int t[10];` | **refusée** : `[0] * 10` inventerait le zéro |
| `Crée un aiguillage sur "jour".` | `switch` | **refusée** : `match` ne traverse pas les cas, et porter la phrase rendrait fausses deux informations |
| `Écris la valeur de x dans le fichier f.` | `fprintf(f, "%d", x)` | **refusée** : la méthode d'écriture n'accepte qu'une chaîne, et convertir à votre place serait un ajout |
| tout ce qui touche aux **pointeurs** | `int *p`, `&x`, `*p` | **refusé** : Python n'en a pas. La compétence s'enseigne par l'aliasing d'une liste |

Chacun de ces refus **nomme** la construction native qui enseigne la même
compétence. Un refus de portage n'est pas une interdiction d'apprendre la
notion.

### Un nom valide en C17 peut être refusé en Python

`lambda`, `None`, `pass`, `class` sont des identifiants **C17 parfaitement
légaux** : le moteur les accepte, et c'est le langage cible qui les refuse,
parce que Python les réserve.

### Ce qui n'est pas vérifié, en Python non plus

Ni les symboles, ni les types, ni les bornes, ni les clés. Un programme Python
écrit par C-A peut lever une erreur à la première ligne — une liste parcourue
avant d'exister, une clé absente, une conversion impossible. **Les
annotations de type écrites ne sont pas vérifiées** : Python les enregistre et
les laisse aux outils de lecture.

### Ce qui n'a jamais été essayé

- **aucun utilisateur** n'a écrit un programme Python avec C-A : les neuf
  programmes de preuve sont dictés par un script ;
- **un seul interpréteur**, `python3`, sur **Windows** uniquement ;
- la sortie des programmes de preuve est comparée avec
  `PYTHONIOENCODING=utf-8` imposé — sans quoi la console réécrit les accents.
  C'est un réglage de la mesure, pas une retouche du code produit.

---

## Limites propres à Java

### Ce qui n'existe pas, et ne viendra pas dans cette version

| Notion | Pourquoi |
|---|---|
| les **classes implicites** et le `main` d'instance | ils sont *preview* en Java 21 : le code produit exigerait `--enable-preview` à la compilation **et** à l'exécution, et cesserait de compiler quand la fonctionnalité changerait. Le point d'entrée est donc une classe **explicite** et un `main` **explicite**, commandés par deux phrases |
| `record` | il cache le constructeur, les champs et les accesseurs — c'est-à-dire **tout ce que le domaine des objets enseigne** |
| le `switch` **fléché** (`case 1 ->`) | il supprime la traversée des cas, qui est précisément la notion à comprendre — y compris pour comprendre pourquoi les formes modernes l'ont supprimée |
| `var` | il cache le type, et le type est la notion que le premier domaine enseigne |
| les **génériques écrits par l'utilisateur** | aucune formulation ne les exprime. Les collections du catalogue sont typées, mais leur type vient d'une liste finie |
| un paquetage à **plusieurs niveaux** | `Déclare le paquetage ecole.` écrit un seul segment. Jamais essayé avec `ecole.notes` |
| une **classe publique seconde** dans un fichier | Java l'interdit, et A n'en écrit pas : une classe qui hérite vit donc dans **son** fichier |

### Ce que Java refuse là où C17 acceptait

Comme pour Python : **une phrase du catalogue C17 peut être refusée dans un
fichier `.java`**, et c'est voulu. **27 intentions** sur 84 le sont.

| Phrase | En C17 | En Java |
|---|---|---|
| tout ce qui touche aux **pointeurs** | `int *p`, `&x`, `*p` | **refusé** : un objet **est** déjà une référence |
| `Alloue … octets …`, `Libère la mémoire …` | `malloc`, `free` | **refusé** : ramasse-miettes. Une allocation oubliée n'existe pas comme défaut |
| `Affiche la taille du type int.` | `sizeof` | **refusé** : la taille d'un `int` est fixée par le langage, pas par la machine |
| `Inclue la bibliothèque stdio.h.` | `#include` | **refusé** : pas de préprocesseur. `Importe …` nomme une **classe** |
| `Ouvre la garde d'en-tête …` | `#ifndef` | **refusé** : aucune double inclusion n'est possible. **Le seul refus qui ne désigne aucun remplacement** — le problème n'existe pas |
| `Déclare la fonction …` (prototype) | déclaration séparée | **refusé** : l'ordre des méthodes dans une classe est libre |
| `Déclare le synonyme …` | `typedef` | **refusé** : un nom de type **est** un nom de classe |
| `Déclare un fichier nommé f.`, `Ferme le fichier f.` | `FILE*`, `fclose` | **refusé** : le **bloc essaie avec ressource** ouvre et ferme |
| `Lis un entier depuis le fichier f dans n.` | `fscanf` | **refusé** : Java lit une **ligne**. Lire un entier y est deux gestes, et les confondre cacherait où une saisie invalide échoue |

Et **dix** phrases portées voient leur **construction** refusée : un pointeur
dans une expression, un entier employé comme condition — `si "n"` ne compile
pas en Java, et ajouter `!= 0` choisirait un sens que personne n'a donné —, le
format `%u` faute d'entier non signé, et la flèche `->` qui n'existe pas.

### Un nom valide en C17 peut être refusé en Java

`class`, `new`, `final`, `static`, `true` sont des identifiants **C17
parfaitement légaux** : le moteur les accepte, et c'est le langage cible qui
les refuse, parce que Java les réserve.

### Trois obligations de Java que A ne peut pas satisfaire pour vous

**Et ce sont les trois endroits où A sera le plus frustrant.**

1. **Les exceptions vérifiées.** Lire ou écrire un fichier **oblige** à
   attraper l'exception ou à la déclarer dans la signature. A ne choisit **ni**
   l'une **ni** l'autre : ajouter un `throws` modifierait une signature que
   vous n'avez pas désignée, et ouvrir un `try` choisirait votre traitement
   d'erreur. L'information `JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED` énonce
   l'obligation et nomme les **deux** issues légales ;
2. **`static`.** `main` est `static`, et une méthode d'instance n'y est pas
   appelable sans objet. **A est sans état** : en écrivant un appel, il ne sait
   pas si la méthode visée est `static`. Il peut donc produire du code que le
   compilateur refusera. L'information est posée **à la déclaration**, faute de
   pouvoir l'être à l'usage, et **la lacune n'est pas refermée** ;
3. **le nom du fichier et le répertoire du paquetage.** `javac` exige qu'une
   classe `public` vive dans un fichier portant **son nom**, et qu'un
   `package` corresponde à un répertoire. A **informe** et ne renomme rien :
   un fichier accepté peut ne pas compiler **pour une raison qui n'est pas
   dans le code**.

### Ce qui n'est pas vérifié, en Java non plus — et une chose de plus

Ni les symboles, ni les types, ni les bornes. **Et la visibilité** : lire ou
écrire un champ `private` depuis une autre classe est **accepté par A** et
refusé par `javac`. C'est une limite de plus que dans les deux autres
langages, parce que Java est le seul des trois à avoir la notion.

### Un piège d'encodage, trouvé et contourné

`javac` lit une source dans l'encodage de la **plate-forme**. A écrit du
français dans les commentaires **et** dans les chaînes affichées, en UTF-8 :
sans `-encoding UTF-8`, le compilateur corrompt les accents **dans le fichier
compilé**. Le programme compile en code 0, s'exécute en code 0, et **affiche
faux**. Les journaux de ce dépôt passent donc l'option ; si vous compilez à la
main, passez-la aussi.

### Ce qui n'a jamais été essayé

- **aucun utilisateur** n'a écrit un programme Java avec A : les deux
  programmes de preuve sont dictés par un script ;
- **un seul JDK**, Temurin 21.0.13, sur **Windows** uniquement. Aucun autre
  fournisseur, aucune autre version ;
- aucun **paquetage à plusieurs niveaux**, aucune classe générique écrite par
  l'utilisateur.

## Ce que SQL-A ne fait pas

SQL-A traduit vers du **SQL standard**, vérifié sur **PostgreSQL 18**. Il
couvre les neuf domaines par **93 formulations**, toutes natives : **aucune**
des 84 intentions du catalogue C17 n'y est portée, parce qu'un langage de
requêtes n'a ni variable, ni boucle, ni fonction, ni affichage, ni fichier, ni
mémoire, ni préprocesseur.

**Il n'exécute jamais rien.** Il écrit l'instruction dans votre fichier, et
c'est vous qui lancez le script contre la base de votre choix. SQL-A ne sait
pas à quelle base ce fichier sera soumis, ni si elle contient dix lignes ou dix
millions. **Employez une base de test.**

### Ce qu'il ne vérifie pas

Ni les symboles, ni les types, ni les bornes, ni les **droits**. Il ne sait pas
si la table existe, ni de quel type est la colonne, ni qu'une sous-requête
`IN` doit ne renvoyer qu'une colonne. Une instruction acceptée n'est pas une
instruction qui s'exécutera.

### Les limites de forme, et leur raison

| Limite | Pourquoi |
|---|---|
| une requête écrite **sur une seule ligne** ne se complète pas | y insérer une clause demanderait de modifier cette ligne, et A ne modifie jamais du code que vous ne lui avez pas demandé de modifier |
| les virgules et les `AND` s'écrivent **en tête de ligne** | c'est la seule disposition où ajouter un terme ne touche aucune ligne existante |
| une **sous-requête** est produite entière, jamais composée | le curseur ne dit pas dans laquelle des deux requêtes la clause irait, et A ne devine pas. L'**expression de table** est la réponse |
| une contrainte doit être **nommée** | sinon c'est le serveur qui invente un nom, que vous ne pourrez pas citer pour la supprimer |
| une table est créée **avec sa première colonne** | une table sans colonne n'est pas du SQL standard |
| « ou » sans accent n'est pas reconnu | `ou` et `où` sont deux mots différents ; les confondre changerait le sens |

### Les formes refusées, et ce qu'il faut écrire

| Refusé | Forme standard écrite par SQL-A |
|---|---|
| `LIMIT n` | `FETCH FIRST n ROWS ONLY` |
| `serial` | `GENERATED BY DEFAULT AS IDENTITY` |
| `x::type` | `CAST(x AS type)` |
| `ILIKE` | `LOWER(colonne) LIKE …` |
| `text` | `varchar(n)` |
| `BEGIN` | `START TRANSACTION` |
| `==` et `!=` | `=` et `<>` — et le refus le **dit**, il ne corrige pas |
| `= NULL` | `IS NULL`, qui a sa propre phrase |
| `RETURNING`, `ON CONFLICT` | rien : ce sont des extensions de PostgreSQL |

**Une exception assumée** : `CREATE INDEX` n'est pas dans le SQL standard, et
il est pourtant au catalogue — aucune base réelle ne s'en passe, et une
information passive le dit.

### Hors catalogue, délibérément

Fonctions de fenêtrage, `MERGE`, `WITH RECURSIVE`, déclencheurs, PL/pgSQL,
procédures stockées, types tableau et JSON, `TRUNCATE`.

### Les opérations destructives

**A n'ajoute jamais de `WHERE`, et n'en retire jamais.** Une modification sans
filtre n'est reconnue que si la phrase dit « **toutes les lignes** » :
l'intention destructive doit être écrite, pas déduite. Une information passive
le rappelle, et elle ne bloque pas — l'aperçu **est** la confirmation.

`DROP TABLE` et `DROP VIEW` sont au catalogue : les refuser rendrait le
domaine 1 inenseignable. La vraie réponse au risque n'est pas un garde-fou de
A, c'est `ROLLBACK`, enseigné au domaine 9.
