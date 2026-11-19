# Clôture de la phase 4 — 19 novembre 2026

La phase 4 est **close**. Elle avait un objet : faire de SQL un quatrième
langage cible de A, de plein droit, sans abîmer les trois premiers — et le
prouver.

**Les quatre langages fondamentaux de la feuille de route sont désormais
techniquement réalisés.** Le modèle pédagogique 2 n'est pas ouvert, et Rust
n'est pas commencé.

> **Fusionnée dans `main` et étiquetée `v0.7.0`.** La release GitHub reste à
> créer à la main, en ***pre-release*** : `docs/PUBLICATION_0_7_0.md`.

---

## 1. Ce qui existe maintenant et n'existait pas

| | |
|---|---|
| langages cibles | **quatre** : C17, Python, Java 21, **SQL** |
| formulations SQL | **93**, **toutes natives** |
| intentions du catalogue partagé portées | **0** — c'est le premier langage dans ce cas |
| refus nommés | **84**, groupés en **10 raisons** |
| informations passives | **17** |
| portées de placement | **3**, plus **10 rangs de clauses** |
| catalogue publié | `docs/CATALOGUE_SQL.md`, **engendré depuis le moteur** |

**Le socle a tenu, et une seule pièce a bougé.** Le registre, les 98
reformulations et la machine à états de l'hôte servent **tels quels**. Le
noyau d'expressions a reçu **une** capacité, `simpleEquality`, fermée dans les
quatre profils publiés — en C17, en Python et en Java, `=` affecte, et le refus
y est juste.

## 2. Le résultat le plus utile, et il est encore négatif

> Le catalogue partagé ne décrit pas « la programmation ». Il décrit la
> programmation **impérative**.

Mesuré sur le moteur, et non lu :

| Langage | intentions portées sur 84 |
|---|---|
| C17 | **84** |
| Java | **57** |
| Python | **33** |
| **SQL** | **0** |

La pente suit la distance au langage pour lequel le catalogue a été conçu, et
SQL en est le terme. Le refus qui demande le plus d'attention est celui qui
ressemble le plus à un oui : une structure est un **type**, une table est une
**relation**. Les rendre identiques enseignerait la confusion exacte qui fait
ensuite écrire des boucles sur une base de données.

L'étiquette de blocs a reçu une **troisième** valeur, `terminateur`. C'est la
**troisième confirmation** de la décision 2 du socle : les placements se
*sélectionnent*, ils ne s'unifient pas.

## 3. Ce qui est mesuré, et ce que chaque chiffre ne dit pas

| Mesure | Chiffre | Ce qu'elle ne dit **pas** |
|---|---|---|
| tests Node | **4 487**, 0 échec | qu'une instruction s'exécute |
| tests hôte | **130**, sur **trois** combinaisons | qu'un autre système se comporte pareil |
| différentiel contre `v0.6.0` | **1 335 559** comparaisons, **0 régression, 0 capacité perdue** | que les capacités conservées soient bonnes |
| exercice de clôture | **109 phrases, 9 fichiers, 0 retouche** | qu'un humain écrirait ces phrases |
| exécution | `psql --set ON_ERROR_STOP=1` : **code 0** | que le résultat soit juste — c'est le **calcul fait à la main** qui le dit |
| épreuves **négatives** | **3 / 3** échouent comme prévu | — |
| français souple en SQL | **39/40**, 0 acceptée à tort, **0 erreur de sens** | le français spontané |
| paquet | reproductible **au bit**, **trois** constructions | qu'il soit utile |

**Le seul chiffre qui compte vraiment est encore à zéro.** `0/10` séances :
personne n'a écrit un programme avec A, dans **aucun** des quatre langages.

## 4. Les huit défauts trouvés, et par quoi

| Défaut | Trouvé par |
|---|---|
| l'insertion de clause **consommait** la ligne blanche : composer une requête était impossible, et la décision S2 ne tenait pas | **l'exercice de clôture** |
| `WITH … AS (…)` suivi d'un `;` **n'est pas du SQL valide** | **le serveur** |
| insérer deux colonnes **entières** était inexprimable | l'exercice |
| affecter un **texte ou une date** par `UPDATE` était inexprimable | l'exercice |
| une expression enveloppée dans un `numeric-test`, castée au lieu d'être déballée | la confrontation **moteur ↔ spécification** |
| `ALTER COLUMN … ADD GENERATED` exige un `NOT NULL` préalable | **le serveur**, avant la première ligne de moteur |
| `==` rendu `=` en silence : une **correction** d'une syntaxe inexistante, interdite par la règle 5 | l'exercice du profil à la main |
| **la reproductibilité au bit était cassée** : des CRLF locaux là où le dépôt stocke des LF | la vérification depuis un clone propre |

**Cinq des huit n'étaient visibles pour aucun test unitaire.** Il fallait un
programme entier, un vrai serveur, ou une construction depuis un clone.

Et un neuvième, qui n'est pas dans le produit mais dans ma méthode : mon
premier comparateur moteur ↔ spécification comparait des **squelettes de
mots-clés**, et déclarait identiques des sorties qui différaient par leurs
identifiants. **Un comparateur approximatif ne vérifie rien : il rassure.**

### Le dernier mérite d'être expliqué

Le paquet construit sur le poste de développement différait de celui d'un
clone propre par **10 octets**. `.gitattributes` impose `eol=lf`, le dépôt
stocke donc des LF — mais un outil qui écrit un fichier sur Windows peut y
mettre des CRLF sans que git ne signale rien : le contenu **normalisé** est
identique, donc `git status` est muet, et pourtant le fichier **sur le
disque** diffère.

Deux entrées du paquet en portaient la trace : `extension/package.json`, copié
tel quel, et `renduNatif.js`, parce qu'un littéral de gabarit multiligne de
TypeScript garde ses fins de ligne à la compilation. 48 fichiers suivis
étaient concernés.

**Un `git status` propre ne prouve pas que le disque est canonique.** Le
vingtième contrôle de pré-publication regarde désormais le disque, et il a
attrapé son propre fichier au premier passage.

## 5. Une instabilité que je n'ai pas expliquée

La suite hôte a échoué **une fois sur six** aujourd'hui — 103 réussis sur 130,
avec des assertions de contenu et un dépassement de délai — puis a passé
**130/130** cinq fois de suite, **sans aucune modification**.

Deux hypothèses testées, **deux réfutées** :

1. l'installation du paquet laisserait un processus VS Code : **non**, le
   compte de processus est identique avant et après ;
2. le premier passage contre un dossier d'extensions **neuf** échouerait :
   **non**, un dossier neuf passe du premier coup.

**La cause n'est pas trouvée.** C'est écrit ici plutôt que caché : le même
binaire passe, donc le produit n'est pas en cause, mais **un harnais
intermittent affaiblit tout chiffre qu'il produit**. Le nettoyage
déterministe du lot précédent a réduit la fréquence, pas supprimé le
phénomène.

**Aucune campagne n'est ouverte pour ce seul problème** — décision du
fondateur du 19 novembre 2026. Le phénomène, ses mesures, les deux hypothèses
réfutées, la troisième laissée ouverte et la règle de conduite retenue sont
consignés dans [`../INSTABILITE_SUITE_HOTE.md`](../INSTABILITE_SUITE_HOTE.md).

## 6. Ce qui reste ouvert

**Côté produit**, nommé et assumé : aucune vérification de symboles, de types,
de bornes, ni de **droits** ; **A n'exécute jamais rien** ; une requête écrite
sur une seule ligne ne se complète pas ; une sous-requête complexe n'est pas
exprimable ; « ou » sans accent n'est pas reconnu, et ne le sera pas.

**Côté environnement** : une machine, **Windows**, un serveur PostgreSQL, un
compilateur C, un interpréteur Python, un JDK.

**Côté historique publié** : la branche `phase-4-sql` existe au distant et
**quatre de ses commits portent un chemin personnel** dans le journal de
l'exercice. C'est pourquoi la fusion dans `main` a été faite en **squash** :
l'historique de `main` est propre, et le contrôle qui scanne tout
`git log main -S` le confirme. **La branche distante, elle, reste à nettoyer**,
et cela demande soit sa suppression, soit une réécriture d'un historique
poussé — que les conventions du dépôt m'interdisent de faire seul.

**Côté usage** : `0/10`, et c'est le même zéro depuis la phase 1.

## 7. Ce que la phase 4 ne décide pas

La suite. La feuille de route place le **modèle pédagogique 2** après les
quatre fondamentaux, puis **Rust** — mais le fondateur a dit vouloir définir
le modèle 2 **ensemble**, et rien n'oblige à enchaîner.

Une chose mérite d'être redite une quatrième fois, parce qu'elle est restée
vraie à la fin de chaque phase : **la prochaine information utile ne viendra
pas d'un langage de plus.** Elle viendra de la première personne qui essaie
d'écrire un programme avec A et n'y arrive pas comme prévu.
