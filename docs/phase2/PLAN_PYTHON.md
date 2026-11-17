# Phase 2 — plan de développement du second langage

**Pour qui :** le fondateur. Ce plan **n'est pas commencé** : il attend la
validation de l'architecture.

> Chiffres : `docs/phase2/AUDIT_ARCHITECTURE.md` §4 et les deux sondes.
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Ce que Python serait, et ce qu'il ne serait pas

**Premier jet : 37 intentions sur 84**, soit un Python **nettement plus
pauvre** que le C actuel. Ce n'est pas une étape vers la parité : c'est le
périmètre honnête, et il faut l'annoncer tel quel.

| Porté | Non porté |
|---|---|
| affectations, expressions, conditions | pointeurs, adresses, déréférencement (6 intentions) |
| affichages, formats, précision | `sizeof`, `malloc`, `realloc`, `free` (5) |
| `if` / `elif` / `else`, `while`, `break`, `continue` | en-têtes et gardes (6) |
| fonctions, paramètres annotés, retours, appels | prototype, liaison interne et externe (2) |
| éléments de liste, chaînes | déclaration sans valeur (3) |
| fichiers : ouverture, écriture, fermeture, lecture bornée | `do/while`, `switch` et ses cas, `for` à trois clauses |
| assertions | structures (décision de contrat) |

**Ce que Python mériterait et qui n'est pas dans ce plan** : parcours
d'itérable, listes en compréhension, dictionnaires, `for x in …`. Ce sont des
**lots de domaine**, à concevoir avec la même méthode que les domaines C, et
pas du socle. Les mélanger au plan actuel ferait grossir l'estimation d'un
facteur inconnu.

## 2. Les douze décisions de contrat à trancher avant P4

Elles appartiennent au fondateur. Chacune a une réponse possible « refus
définitif », et c'est souvent la bonne.

| # | Question | Ma recommandation |
|---|---|---|
| 1 | `Déclare un entier nommé n.` en Python ? | **refus** : `n = 0` inventerait le 0 |
| 2 | `Crée la fonction principale.` ? | **refus** : `main` est une convention Python ; la définir sans l'appeler laisse un programme inerte, l'appeler serait un ajout implicite |
| 3 | `/` entre entiers ? | **refus** jusqu'à une phrase explicite : C tronque, Python non — le même texte ne dirait pas la même chose |
| 4 | `for` à trois clauses ? | **refus** ; `for x in …` sera une intention Python propre |
| 5 | `switch` → `match` ? | **refus** : `match` ne traverse pas les cas ; même mot, autre sémantique |
| 6 | structures → classes ? | **refus au premier jet** : une classe exige un constructeur, donc des valeurs à inventer |
| 7 | tableau de dimension fixe → liste ? | **refus** : il faudrait inventer un remplissage |
| 8 | `char` → chaîne d'un caractère ? | **porté**, avec une information passive : Python n'a pas de type caractère |
| 9 | annotations de type (`a: int`) ? | **portées** : l'information vient de la phrase, Python sait l'écrire, rien n'est inventé |
| 10 | `print(..., end="")` partout ? | **oui, obligatoire** : la règle « aucun séparateur ajouté » l'impose |
| 11 | fin de fichier (`feof`) ? | **refus** : Python constate la fin à la lecture |
| 12 | lecture d'entier depuis un flux ? | **refus au premier jet** : exige une conversion explicite, donc une phrase nouvelle |

**Dix refus sur douze.** C'est le signe que l'architecture est la bonne : un
langage doit pouvoir dire non, et le dire souvent.

## 3. Les sept lots

| Lot | Contenu | Touche `src/` ? | Preuve de sortie |
|---|---|---|---|
| **P0** | extraire le rendu C dans un module dédié, sous `src/langages/c17/` (chemin proposé). **Aucune capacité nouvelle** | **oui**, et c'est le seul | différentiel contre `v0.4.0` : **0 régression, 0 extension**, 3 834 tests au vert |
| **P1** | registre de langages : capacités, intentions portées, refus nommé. C17 seul inscrit | additif | les 84 intentions passent par le registre, sortie **identique** |
| **P2** | placement par **indentation**, sans aucune intention Python | additif | tests de pose : ouverture, fermeture, sortie de bloc, ligne blanche significative |
| **P3** | les **17 intentions communes** en Python | additif | un programme Python **exécuté**, sortie conforme à un calcul fait à la main |
| **P4** | les **20 adaptables** retenues, après les 12 décisions | additif | catalogue Python généré, et un second programme exécuté |
| **P5** | **35 informations pédagogiques** Python | additif | une information par notion, canal partagé, aucun avertissement déguisé |
| **P6** | exercice de clôture Python + campagne de validation | additif | exercice exécuté, écarts classés comme en campagne 3 |

**Jalon de validation après P2** : si le placement par indentation n'est pas
au moins aussi lisible que celui du C, on s'arrête et on en discute. Le
placement est le composant où une erreur écrit dans le fichier de
l'utilisateur.

## 4. Ce qui se réutilise, chiffré

| Acquis réutilisé | Mesure | Confiance |
|---|---|---|
| analyse du français, AST, noyau d'expressions | **~1 640 lignes**, dont 964 sans trace de C | **mesurée** : la sonde n'a pas modifié `src/` |
| 22 diagnostics de forme de phrase | 22 / 69 | mesurée |
| hôte VS Code, aperçu, confirmation, insertion | 634 lignes | mesurée : 0 module de `src/` n'importe `vscode` |
| harnais complet | ~1 500 lignes de scripts | haute |
| forme des reconnaisseurs de contexte | ~40 % de 1 154 lignes | **estimée**, à confirmer en P2 |
| souplesse linguistique | sonde complète, 20 cas conformes | mesurée, et **indépendante du langage cible** |

| À écrire | Volume |
|---|---|
| rendu Python, types, formats | ~380 lignes |
| placement par indentation | ~500 à 700 lignes |
| portée des instructions Python | ~100 lignes |
| informations pédagogiques | ~250 lignes |
| registre et extraction (P0, P1) | ~400 lignes, dont 250 déplacées |
| tests | **~1 500 à 2 000 lignes** |
| exercice et catalogue | ~450 lignes |

**Ordre de grandeur : 3 500 à 4 500 lignes**, moitié tests. Comparaison
interne : le **domaine 5** (lots 13 à 18) a produit un volume comparable, et
c'est la meilleure échelle dont le projet dispose — aucune estimation en
jours n'est donnée, parce que rien dans l'historique du projet ne permet de
la fonder.

## 5. Ce qui n'est pas dans ce plan

- **la parité avec le C** : ni visée, ni souhaitable ;
- **les intentions propres à Python** (itérables, listes, dictionnaires) :
  lots de domaine ultérieurs ;
- **un troisième langage** : le socle est conçu pour, le plan ne le couvre
  pas, et la généralité ne sera prouvée qu'au troisième ;
- **les modèles pédagogiques supérieurs** : reportés, comme décidé ;
- **la vérification des symboles** : toujours absente, dans les deux langages.

## 6. Première chose à faire, si l'architecture est validée

**P0, et rien d'autre.** Extraire les 198 lignes de rendu, prouver par
différentiel que rien n'a changé, livrer le bilan. C'est le seul lot qui peut
abîmer la V1 ; tant qu'il n'est pas vert, le reste n'a pas de sens.

Et si P0 révèle que l'extraction n'est pas neutre, l'information vaut plus
que le lot : elle dirait que le rendu est plus couplé que les mesures ne le
montrent.
