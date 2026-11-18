# Clôture de la phase 2 — 18 novembre 2026

La phase 2 est **close**. Elle avait un objet : faire de A un projet
**multilangage** sans abîmer C-A, et le prouver. Ce document dit ce qui a été
construit, ce qui a été mesuré, ce qui a été trouvé en route, et ce qui reste
ouvert — sans arrondir.

Le troisième langage n'est pas commencé. Les modèles pédagogiques supérieurs
non plus.

---

## 1. Ce qui existe maintenant et n'existait pas

| | |
|---|---|
| langages cibles | **deux** : C17 par C-A, Python par Python-A |
| registre de langages | `src/langages/registre.ts` — un langage déclare ses blocs, ses portées, sa forme de commentaire, ses refus |
| placement | **deux modules non unifiés** : accolades et indentation. L'unification a été écartée, et c'est une décision, pas un oubli |
| catalogue Python | **97 intentions** — 64 natives, 33 reprises du catalogue partagé |
| refus Python nommés | **51**, chacun désignant la construction Python qui enseigne la même compétence |
| informations passives Python | **49**, dont trois qui **corrigent** une règle apprise en C |
| français souple | lexique fini + **98 reformulations** déterministes, arbitrées, avec refus en cas d'ambiguïté |
| hôte VS Code | deux sessions distinctes, un réglage par nouveauté, strict toujours accessible |

## 2. Ce qui a été mesuré, et comment

| Mesure | Chiffre | Ce qu'elle ne dit pas |
|---|---|---|
| tests Node | **4 376**, 0 échec | qu'un programme produit compile |
| tests hôte | **114**, 0 échec, sur la **1.138.0 installée** | qu'un autre système se comporte pareil |
| tests hôte contre le **paquet installé** | **114**, 0 échec, **deux fois** | rien de plus : c'est le même code |
| différentiel contre `v0.4.0` | **1 335 559** comparaisons, **0 régression, 0 extension, 0 capacité perdue** | que les capacités conservées soient bonnes |
| programmes Python exécutés | **9**, dont un exercice de clôture de **6 programmes et 238 instructions** | qu'un humain écrirait ces phrases |
| couverture du catalogue par l'exécution | **97/97** intentions, **49/49** informations | que le catalogue soit complet |
| corpus de validation **gelé** | **95,1 %** (58/61), **0 erreur de sens**, **0 accepté à tort** | le français spontané |
| paquet | reproductible **au bit**, y compris depuis un clone **anonyme** du dépôt public | qu'il soit utile |

**Le seul chiffre qui compte vraiment est encore à zéro.** `0/10` séances :
personne n'a jamais écrit un programme avec A. Les neuf programmes de preuve
sont **dictés par des scripts**. Ils prouvent que les intentions fonctionnent
ensemble ; ils ne disent rien de ce qu'une personne tape quand elle hésite.

Et le 95,1 % porte son biais écrit : le corpus gelé n'a jamais servi à
enrichir le mécanisme, mais il a été écrit par l'auteur de ce mécanisme. Le
corpus de développement, fait pour sonder des formes non tabulées, donnait
**30 %** à sa première mesure. **L'écart entre ces deux nombres est la mesure
honnête de ce qu'on ignore.**

## 3. Les défauts que la phase a trouvés — chez elle-même

Ils comptent plus que les chiffres, parce qu'ils disent où le travail se
trompe quand personne ne regarde.

| Défaut | Ce qu'il enseigne |
|---|---|
| une reformulation **inventait un type** (`age vaut 20.` → « Crée un entier ») | la règle « rien d'implicite » ne se respecte pas d'intention : il faut une garde, et son exemption doit être **vérifiée**, pas accordée |
| l'apostrophe droite lue comme un littéral caractère | une phrase valide refusée **en silence** depuis plusieurs lots |
| `\b` est **ASCII** : `int` reconnu dans `intérieure` | les classes de caractères par défaut ne connaissent pas le français |
| captures localisées par `indexOf` : un texte `" "` résolu sur la première espace | les intervalles doivent venir du moteur d'expressions régulières, pas d'une recherche |
| deux diagnostics **perdus** par une refonte « sans changement » | une refonte n'est pas prouvée par les tests que l'ancien code passait déjà |
| un `.pyc` suivi portait le **chemin absolu de la machine** | le contrôle de pré-publication a servi : un artefact de compilation n'est pas inerte |
| ma **procédure de retour arrière était fausse** (`v0.4.0` n'est pas le sommet de `main`) | une procédure non exécutée n'est pas une procédure |
| le contrôle de progression imprimait « non fusionnée » **en dur** | une affirmation codée en dur ne se périme pas, elle **ment** |
| un lanceur écrit pour l'occasion a rendu 113 puis 89 là où le témoin donnait 114 | **un harnais non validé ne prouve rien, dans aucun sens** |
| la release est partie avec l'en-tête du gabarit visible | une consigne qui demande de « repérer un trait horizontal » échoue ; le corps se **produit** |

## 4. Ce qui reste ouvert

**Côté GitHub**, et seulement là — détail et commandes en
`docs/PUBLICATION_0_5_0.md` §9 à §11 :

- le **renommage** en `a-french-to-code` n'a pas pris effet ;
- la release est en **pre-release**, donc le dépôt n'affiche aucune
  « Latest release » ;
- un **brouillon de release en double** subsiste ;
- la **description** du dépôt ne parle que de C17.

**Côté produit**, inchangé et assumé :

- **aucune vérification** de symboles, de types, de bornes ni de clés, dans
  aucun des deux langages ;
- **une seule machine, un seul système**, un compilateur C, un interpréteur
  Python ;
- trois gestes irréductiblement manuels : touches physiques, composition IME,
  contrôle visuel du focus et du diff ;
- **33/84** intentions du catalogue C rendues en Python — les 51 autres sont
  refusées **avec une raison écrite**, et c'est voulu.

L'inventaire complet est `docs/phase2/LIMITES_RESTANTES_0_5_0.md`.

## 5. Ce que la phase 2 ne décide pas

La suite du projet. Elle sera définie ensemble.

Une seule chose mérite d'être posée d'avance, parce qu'elle était déjà vraie
à la fin de la phase 1 et qu'elle l'est restée : **la prochaine information
utile ne viendra pas d'un lot de plus.** Elle viendra de la première personne
qui essaie d'écrire un programme avec A et n'y arrive pas comme prévu.
