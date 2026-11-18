# Journal des versions

Les versions suivent le numéro de l'extension (`extension/package.json`).
Ce journal commence à la première version publiable ; l'historique détaillé
des 32 lots est dans `docs/LOT*.md`.

---

## 0.6.0 — 18 novembre 2026 — trois langages cibles

**Toujours un prototype pédagogique.** Pas un produit.

### Ce que cette version ajoute

**Java 21 comme troisième langage cible**, avec son **propre catalogue
pédagogique** — et non un portage du C :

- **144 formulations** : 30 reprises du catalogue partagé, 27 **adaptations
  sémantiques**, et **87 natives** ;
- **27 refus nommés**, chacun désignant la construction Java qui enseigne la
  même compétence ;
- **28 informations pédagogiques passives**, dont trois qui **corrigent une
  règle apprise ailleurs** et deux qui disent une **lacune de A** ;
- **neuf domaines** couverts : types et point d'entrée, affichage et saisie,
  expressions et chaînes, contrôle, méthodes, tableaux et collections, objets
  et constructeurs, héritage et interfaces, exceptions et fichiers ;
- un **placement propre**, par accolades mais à **quatre portées** — fichier,
  classe, méthode, interface.

**Java 21 LTS, sans aucune fonctionnalité en avant-première.** Les classes
implicites et le `main` d'instance sont *preview* dans cette version du
langage : le code produit exigerait deux drapeaux et cesserait de compiler
quand la fonctionnalité changerait. Le point d'entrée est donc une classe
**explicite** et un `main` **explicite**, commandés par deux phrases. Le
premier programme Java demande **trois** phrases là où Python en demande une :
c'est Java qui l'exige, pas A qui se complique.

### Le réglage, et l'identifiant

Un réglage de plus, **actif par défaut** comme les deux autres :

| Réglage | À `false` |
|---|---|
| `c-a.souplesse` | restaure le **mode strict** |
| `c-a.python` | n'ouvre pas les `.py` |
| `c-a.java` | n'ouvre pas les `.java` |

**L'identifiant technique ne change toujours pas** : `projet-a-local.c-a`.
Une mise à jour depuis la 0.5.0 se fait normalement, sans rien désinstaller.

### Ce que l'étiquette « accolades » ne suffisait pas à dire

Java porte la même étiquette de blocs que C17, et son placement a pourtant
dû être **écrit**. `planPlacement` encode des règles **du C**, pas des règles
**des accolades** : en Java, rien d'exécutable ne vit à la portée fichier —
pas même une affectation —, une méthode exige une **classe** (deux niveaux,
pas un), et `package` précède les `import` qui précèdent le type, un ordre
**à trois temps** que le C n'a pas.

### Le français souple, réutilisé tel quel

Les **98 reformulations** de la 0.5.0 servent sans modification : ce sont des
règles français → français, elles ne savent pas quel langage les consomme.
Mesuré sur un corpus indépendant : **36 phrases claires sur 36 reconnues**,
**0 acceptée à tort**, **0 erreur de sens**.

Et cette mesure a trouvé **un défaut de sens** qui touchait aussi les deux
autres langages : la garde des identifiants ne connaissait que « nommé » et
« appelé ». Dans « Appelle la méthode afficher de e. », le mot `afficher` est
au lexique, et la couche produisait `e.Affiche();` — **A renommait
silencieusement la méthode de l'utilisateur**. Corrigé, puis corrigé une
seconde fois parce que la correction sur-protégeait à son tour.

Six infinitifs ont été ajoutés au lexique — `importer`, `ajouter`, `appeler`,
`lancer`, `retirer`, `sortir` —, et trois d'entre eux profitent aussi à C17.
La table porte sa propre règle : elle ne grandit **que sur une formulation
mesurée**.

### Ce que cette version NE change pas

**C-A et Python-A sont strictement préservés.** Le différentiel contre la
0.5.0 : **1 335 559 comparaisons, 0 régression, 0 capacité perdue**. La
partition des 84 genres du moteur n'a pas été touchée, et un test l'impose
toujours exhaustive.

### Preuves

| | |
|---|---|
| tests | **4 438** Node, **121** hôte VS Code |
| exercice de clôture Java | **4 fichiers, 96 phrases, 0 retouche manuelle** |
| compilation | `javac --release 21 -encoding UTF-8 -Xlint:all` : code 0, **aucun avertissement** |
| exécution | `java -ea` : code 0, sortie conforme au **calcul fait à la main** |
| français souple en Java | **36/36**, 0 acceptée à tort, 0 erreur de sens |
| différentiel contre la 0.5.0 | **0 régression, 0 capacité perdue** |

### Ses limites

- **aucune vérification** de symboles, de types, de bornes — ni, en Java, de
  **visibilité**. Lire un champ `private` depuis une autre classe est accepté
  par A et refusé par `javac` ;
- **trois obligations de Java que A ne satisfait pas pour vous** : les
  exceptions vérifiées, `static`, et le nom du fichier. Les trois sont
  **dites** par des informations passives, et aucune n'est refermée ;
- `record`, le `switch` fléché et `var` sont **refusés**, délibérément ;
- **un seul JDK** essayé — Temurin 21.0.13 —, sur **Windows** seulement ;
- **aucun essai par un utilisateur**, dans aucun des trois langages.

Tout cela est détaillé dans [`docs/LIMITES_CONNUES.md`](docs/LIMITES_CONNUES.md).

### Le dépôt a changé de nom

Il s'appelle désormais **`a-french-to-code`**. GitHub assure la **redirection
permanente** depuis l'ancien nom — vérifié, il répond 301.

---

## 0.5.0 — 17 novembre 2026 — deux langages cibles

**Toujours un prototype pédagogique.** Pas un produit.

### Le projet se décline

Le projet s'appelle **A**. Il se décline par langage cible : **C-A** vers
C17, **Python-A** vers Python. Le nom affiché de l'extension devient
« **A — Français vers Code** », et sa description nomme les deux déclinaisons.

**L'identifiant technique ne change pas** : `projet-a-local.c-a`. C'est la clé
par laquelle VS Code reconnaît une installation ; la changer en installerait
une seconde à côté de l'ancienne, les deux déclarant la même commande. Une
mise à jour depuis la 0.4.0 se fait donc normalement, sans rien désinstaller.

### Ce que cette version ajoute

**Python comme second langage cible**, avec son **propre catalogue
pédagogique** — et non un portage du C :

- **97 intentions** : 33 reprises du catalogue partagé, **64 natives** ;
- **51 refus nommés**, chacun désignant la construction Python qui enseigne
  la même compétence — l'aliasing d'une liste pour les pointeurs, `len` pour
  `sizeof` (en disant que c'est une autre notion), `import` pour `#include` ;
- **49 informations pédagogiques passives** propres à Python, dont trois qui
  **corrigent** une règle apprise en C : `match` ne traverse pas, `with` ferme
  tout seul, un indice négatif compte depuis la fin ;
- placement par **indentation**, module séparé de celui des accolades ;
- les différences sémantiques sont **refusées, pas lissées** : `/` et `%`
  n'ont pas le même sens dans les deux langages, et chacun a sa phrase.

**Français souple**, désactivé par défaut : un lexique fini de synonymes et de
variantes, et **98 reformulations** syntaxiques déterministes — changements
d'ordre, formes courtes, verbes synonymes. Une phrase ambiguë reste
**refusée**, avec ses lectures nommées, et le commentaire de traçabilité
conserve **votre** phrase, pas celle que C-A a lue.

### Preuves livrées avec cette version

| | |
|---|---|
| programmes Python écrits par C-A et **exécutés** | **9**, dont six pour l'exercice de clôture |
| instructions de l'exercice de clôture | **238**, **0 retouche manuelle** |
| intentions Python employées par un programme exécuté | **97 / 97** |
| informations Python rencontrées | **49 / 49** |
| reconnaissance du français souple, corpus **gelé** | 95,1 % (58/61), **0 erreur de sens** |
| tests | **4 375** Node, **109** hôte VS Code |

### Ce que cette version ne fait pas

- **les classes Python**, le `else` de boucle et la boucle à test final n'y
  sont pas, et c'est délibéré ;
- **aucune vérification de symboles, de types ni de portées**, pas plus en
  Python qu'en C17 ;
- **aucun essai hors Windows**, et **aucun essai par un utilisateur** : les
  neuf programmes Python sont écrits par un script qui dicte des phrases.

### Les deux réglages, et comment revenir en arrière

| Réglage | Par défaut | À `false` |
|---|---|---|
| `c-a.python` | **actif** | n'ouvre que les fichiers `.c` |
| `c-a.souplesse` | **actif** | restaure le **mode strict** : seules les phrases exactes du catalogue sont acceptées |

Les deux sont actifs depuis la validation finale. Le mode strict reste
accessible, et la commande « A : Basculer entre français strict et français
souple » le fait en un geste.

### Vérifier le paquet

Le `.vsix` est **reproductible au bit** : deux constructions du même commit,
depuis deux clones différents, donnent le même fichier et donc le même
hachage. Les horodatages des entrées de l'archive sont normalisés pour cela.

```
sha256  1567c46ac7251011388dab82c8b91c7bddb5f801785116960fcd947d4bef909f
taille  163 843 octets, 51 entrées
```

---

## 0.4.0 — 17 novembre 2026 — première version publique

**Prototype pédagogique en test utilisateur supervisé.** Pas un produit.

### Ce que cette version fait

Traduire une phrase française **du catalogue** en **une** instruction C17,
dans VS Code : aperçu, confirmation, puis insertion — une seule modification
annulable. La phrase est conservée **exactement** en commentaire au-dessus du
code produit.

- **les neuf domaines** du parcours C17 sont couverts, en 32 lots ;
- **84 intentions** reconnues, catalogue figé et publié
  (`docs/CATALOGUE.md`) ;
- informations pédagogiques **passives** dans un canal séparé — ni erreurs,
  ni avertissements ;
- **aucune dépendance d'exécution**, aucun accès réseau, aucune télémétrie.

### Preuves livrées avec cette version

| | |
|---|---|
| tests Node | **3 834**, 0 échec |
| tests hôte VS Code | **99 / 99**, neuf passages verts consécutifs |
| programmes écrits par C-A et compilés en C17 `-Wall -Wextra -pedantic` | **19** |
| programmes exécutés, sortie vérifiée contre un calcul fait à la main | **18** |
| retouches manuelles du C produit | **0** |
| intentions employées dans un programme compilé | **84 / 84** |
| dictée dans l'interface réelle | **101 instructions**, C identique à celui du moteur |
| complétion pondérée, barème historique | **93,9 %** (87 / 91 sondes) |

### Limites connues de cette version

**C-A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements.** Une insertion acceptée n'est pas un
programme correct, et ne garantit pas qu'il compile.

- périmètre **fini** et volontaire : tout ce qui n'est pas au catalogue est
  refusé (ni `goto`, ni énumérations, ni unions, ni tableaux à plusieurs
  dimensions, ni listes d'initialisation, un seul niveau d'indirection) ;
- **palier 1** seulement : la formulation doit être précise, accents exigés ;
- **plateforme** : validé sur **Windows** avec VS Code 1.138 et GCC 16.2.0
  uniquement. macOS et Linux n'ont jamais été exécutés, et `Cmd+K A` n'a
  jamais été essayé ;
- trois gestes restent **manuels** : frappe physique de `Ctrl+K A`,
  composition IME, contrôle visuel du focus et du diff ;
- **0 séance** d'usage réel : la validation technique est close, l'usage ne
  l'est pas.

Liste complète : `docs/LIMITES_CONNUES.md`.

### Pour cette publication

- licence **Apache-2.0** (`LICENSE`, `NOTICE`) ;
- documentation publique : `README.md`, `CONTRIBUTING.md`,
  `docs/ETAT_DU_PROJET.md`, `docs/LIMITES_CONNUES.md`,
  `docs/REPERES_GIT.md` ;
- trois modèles de tickets, tickets vides désactivés ;
- l'historique a été **réécrit une fois avant publication** pour en retirer
  des chemins locaux et une adresse personnelle : les documents citent des
  **étiquettes**, jamais des identifiants de commit
  (`docs/REPERES_GIT.md`) ;
- `node scripts/pre-publication.mjs` revérifie l'ensemble en **19 contrôles**,
  et échoue si le dépôt n'est pas publiable.

### Derniers changements fonctionnels

- **lot 32** — le champ d'un **élément** de tableau de structures devient
  assignable et affichable (`promo[i].total = total;`). Lacune trouvée par
  l'exercice de clôture : la lecture fonctionnait depuis le lot 20, l'écriture
  non ; un tableau de structures était donc déclarable et jamais remplissable.
  Aucune intention nouvelle, 1 335 559 comparaisons différentielles,
  0 régression.
- **lots 30 et 31** — intention morte rendue atteignable, information sur
  l'arithmétique de pointeurs, définition de fonction interne, lecture de
  chaîne bornée, et correction d'un type de retour `static` mal lu.
- **lot 29** — `Affiche un retour à la ligne.`, et l'information qui dit
  qu'aucun séparateur n'est ajouté.
- **lots 26 à 28** — refus d'une instruction hors d'un corps de fonction,
  champs de structure de type tableau, `limits.h`.
