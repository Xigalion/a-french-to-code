# Les limites restantes au moment de la 0.5.0

**Pour qui :** le fondateur, et quiconque décide de la suite. Un inventaire,
**sans ouvrir aucun chantier** : chaque ligne dit ce qui manque, ce que ça
coûte de le savoir, et rien de plus.

Date : 17 novembre 2026. Branche `phase-2-architecture`, 21 commits.

---

## 1. La limite qui compte plus que les autres

**Aucun utilisateur n'a jamais écrit un programme avec A.** Ni en C17, ni en
Python.

Les preuves livrées — 10 programmes C compilés, 9 programmes Python exécutés,
238 instructions de l'exercice de clôture sans une retouche — sont **dictées
par des scripts**. Elles prouvent que les intentions marchent ensemble et que
le code produit fait ce qu'un calcul fait à la main annonce. Elles ne prouvent
rien sur ce qu'une personne écrit spontanément, ni sur ce qu'elle comprend
d'un refus.

L'indicateur `0 / 10 séances` est le seul chiffre du projet qu'aucune mesure
interne ne peut remplacer, et il est à zéro depuis le 16 novembre.

## 2. Ce que le chiffre de 95,1 % ne dit pas

Le corpus de validation du français souple est **gelé** et n'a jamais servi à
enrichir le mécanisme. Mais il a été **écrit par l'auteur de ce mécanisme**,
et sa première mesure donnait déjà 91,4 % avant toute extension de la table —
ce qui prouve le biais plutôt que la qualité.

Le corpus de développement, écrit pour sonder des formes **non** tabulées,
donnait 30 % à sa première mesure. L'écart entre ces deux nombres est la
mesure honnête de ce qu'on ignore.

Trois phrases du corpus gelé restent refusées, et **n'ont pas été ajoutées**
à la table : les ajouter détruirait l'indépendance du corpus.

## 3. Ce qui n'est pas vérifié, dans les deux langages

**Ni les symboles, ni les types, ni les portées, ni les bornes, ni les clés.**

```
Affecte la valeur 5 à inexistant.   →  inexistant = 5      accepté, sans un mot
Affiche l’élément "99" de notes.    →  print(notes[99])    accepté, sans un mot
```

Une insertion acceptée n'est pas un programme correct, et ne garantit pas
qu'il compile ni qu'il s'exécute. C'est vrai depuis le lot 1, et la 0.5.0 ne
change rien : c'est une limite **assumée**, pas une dette.

En Python s'y ajoutent les **annotations de type**, que A écrit quand la
phrase les donne et que Python n'évalue pas. Une information passive le dit.

## 4. Ce que Python ne sait pas dire

| Manque | État |
|---|---|
| les **classes** | délibéré : elles méritent un domaine entier, avec leur propre contrat (décision D6) |
| le `else` d'une boucle | délibéré, et recommandé contre : il surprend plus qu'il n'aide |
| la boucle à **test final** | délibéré : l'écrire demanderait de restructurer le corps |
| lire une clé **par un nom de variable** | aucune formulation. **Mesuré** par l'exercice de clôture, qui contient un `rangnote` relisant toujours la même clé |
| insérer un **texte** comme valeur de clé ailleurs que par les phrases livrées | les guillemets délimitent une expression ; le mot « texte » lève l'ambiguïté là où une formulation existe, pas partout |
| `FILE_WRITE_INT` — écrire un nombre dans un fichier | délibéré : la méthode d'écriture n'accepte qu'une chaîne, et convertir à votre place serait un ajout |

Les six premières lignes ne sont pas des bogues : ce sont des capacités
absentes, et chacune a sa raison écrite dans le catalogue ou dans un bilan.

## 5. Ce que le français souple ne sait pas faire

La couche **substitue des mots** et **applique des motifs ancrés sur la phrase
entière**. Elle ne réordonne rien à l'intérieur d'une capture, ne découpe
aucune phrase en deux instructions, et n'invente rien.

Donc : « age vaut 20. » marche, « Augmente compteur. » est refusée, et
« Pour chaque note du tableau, afficher la note. » est hors de sa portée **par
construction**, pas par oubli — le C17 n'a pas de parcours de collection, et
le composer demanderait d'écrire un indice, une condition et une progression
qui ne sont pas dans la phrase.

Le genre de reformulation employée — ordre, synonyme, forme courte,
affectation, composition — est calculé et **n'est pas montré** à
l'utilisateur. Une information du type « A a lu votre phrase comme un
changement d'ordre » aiderait peut-être ; c'est une question pédagogique, et
elle reste ouverte.

## 6. Ce qui n'a jamais été essayé

| | |
|---|---|
| plateformes | **Windows seulement**. `Cmd+K A` n'a jamais été pressé |
| compilateurs C | **un seul**, WinLibs GCC 16.2.0 |
| interpréteurs Python | **un seul**, `python3`, avec `PYTHONIOENCODING=utf-8` imposé pour la mesure |
| hôte VS Code | les 114 scénarios passent sur **1.96.4** ; la **1.138.0** installée n'a pas pu les exécuter |
| IME, documents longs, claviers non français | jamais |

### Le blocage de l'hôte 1.138.0, précisément

Deux processus `CodeSetup-stable-69047191…` — **PID 70352 et 71652**, démarrés
à **15:21:09** — détiennent le mutex `vscode-updating` et ne se terminent pas.
Tout démarrage d'un hôte de test sur la version installée échoue sur
`checkInnoSetupMutex`.

Les 114 scénarios ont donc été exécutés sur une **archive 1.96.4**, qui n'a
pas d'installateur et ne consulte pas ce mutex. C'est la version **minimale**
que le manifeste déclare supporter : la suite est donc prouvée sur le plancher,
pas sur la version que le fondateur utilise.

**Aucun processus n'a été arrêté.** Les relancer sur 1.138.0 demande de
terminer ces deux processus, ce qui appartient au fondateur.

## 7. Les dettes de l'outillage, inchangées

- `scripts/differentiel.mjs` est un **outil**, pas un test : il exige une
  référence git et n'est donc pas dans `npm test`. Il doit être relancé à la
  main à chaque lot ;
- son validateur de noms est volontairement permissif, et `--no-loss` se
  déclenche sur des noms malformés que le vrai moteur refuse de toute façon ;
- enrichir les paramètres d'une intention publiée change la sortie
  **structurée** de `translate`, donc `--no-loss` se déclenche même quand le
  code produit est identique. La procédure est de comparer les **fragments**
  et les **éditions de placement** ;
- l'avertissement `Error mutex already exists` au démarrage de l'hôte de test
  n'est toujours **pas qualifié**. Il est présent depuis le lot 7, n'empêche
  rien, et personne n'en connaît la cause.

## 8. Ce qui n'est pas commencé, et ne doit pas l'être

- le **troisième langage** ;
- les **modèles pédagogiques supérieurs** — le palier 2, le palier 3 ;
- le **score de confiance** et les **alertes** du schéma fondateur.

Aucun de ces trois n'a reçu une ligne de code, et c'est voulu.
