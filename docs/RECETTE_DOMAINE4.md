# Domaine 4 — « Fonctions et décomposition » : protocole de recette finale

**Statut au 12 novembre 2026 : protocole prêt, recette manuelle non
effectuée.** Le lot 12 est implémenté et couvert par 2 583 tests Node
automatisés réussis. **Les tests automatisés ne valent pas validation
pédagogique**, et aucun test hôte n'a pu être exécuté (voir §0).

Référence des sorties exactes : [CATALOGUE.md](CATALOGUE.md).
Protocole du domaine précédent : [RECETTE_DOMAINE3.md](RECETTE_DOMAINE3.md).

---

## 0. Blocage à lever avant de commencer

**La suite hôte VS Code n'a jamais pu démarrer, sur trois tentatives.**
Une mise à jour de VS Code est en attente sur la machine et le mutex Inno
Setup `vscode-updating` est détenu par l'instance en cours.

**Premier geste : redémarrer VS Code, puis `npm run test:vscode`.**
Résultat attendu, **non vérifié** : 96 tests hôte, dont 68 hérités du
lot 10, 25 du lot 11 et 3 du lot 12. Consigner la version de VS Code
obtenue. Tant que cette exécution n'a pas eu lieu, **aucun résultat hôte ne
doit être revendiqué** pour les lots 11 et 12.

---

## 1. Préparation

Reprendre le §1 du [protocole du lot 10](RECETTE_LOT10.md) : fichier
ordinaire vide, extension recompilée, relevé de l'OS, de la version
VS Code, de l'unité d'indentation et de LF/CRLF, désactivation des actions
de sauvegarde et de formatage externes, aucune tâche GCC automatique.

Une commande par session : `Ctrl+K` puis `A`. La première Entrée prépare
le diff ; seule « Insérer » modifie le document.

---

## 2. Projet progressif — décomposer un calcul

Fichier `recette_domaine4.c` vide. Demander successivement, en replaçant
explicitement le curseur quand la ligne de saisie n'est pas déjà au bon
endroit.

### 2.1 Une fonction qui calcule

```text
Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.
Retourne le résultat de "a + b".
```

Vérifier en aperçu :

- l'en-tête est `int somme(int a, int b) {`, exactement les champs
  demandés ;
- le corps est **vide**, curseur à l'intérieur ;
- **aucun `return` n'a été ajouté** à la création : il a fallu le demander ;
- aucune déclaration, aucun `#include`, aucun `main`.

### 2.2 Un programme qui l'appelle

Créer **soi-même** une ligne blanche après la fermeture de `somme`, puis :

```text
Crée la fonction principale.
Déclare un entier nommé total.
Affecte à total le résultat de l’appel de somme avec "2" et "3".
Affiche la valeur de total.
Retourne la valeur 0.
```

Document attendu, à comparer ligne à ligne :

```c
int somme(int a, int b) {
    return (a + b);
}

int main(void) {
    int total;
    total = somme(2, 3);
    printf("%d", total);
    return 0;
}
```

(aux commentaires près, qui conservent chaque phrase française)

Vérifier qu'il y a **exactement deux `return`**, tous deux demandés, et
**aucun `#include`** : l'appel à `printf` en exige un, et c'est à
l'étudiant de le demander. Le demander, puis prévoir l'affichage.

### 2.3 Prévisions à écrire avant toute exécution

| Arguments | Valeur de `total` prévue | Affichage prévu |
|---|---:|---|
| `"2"` et `"3"` | 5 | `5` |
| `"0"` et `"0"` | 0 | `0` |
| `"-1"` et `"1"` | 0 | `0` |

Expliquer, **avant** de regarder : l'ordre dans lequel `somme` est
exécutée par rapport à l'affectation, et le fait que `a` et `b` sont des
copies.

---

## 3. Le passage par valeur

Compétence centrale du domaine. Dans un fichier séparé :

```text
Crée une fonction nommée incremente qui ne retourne rien et prend un int nommé n.
Affecte à n le résultat de "n + 1".
```

Puis, dans `main`, déclarer `compteur` à 0, appeler `incremente avec "compteur"`,
et afficher `compteur`.

**Écrire la prévision avant d'exécuter.** La valeur affichée doit être `0`,
pas `1` : `n` est une **copie**. Vérifier dans « C-A — Pédagogie » que
l'information `PARAMETERS_BY_VALUE` est présente sur la définition, et
qu'elle dit exactement cela.

Puis corriger le programme **soi-même**, de la seule manière disponible
aujourd'hui : faire retourner la valeur et l'affecter à l'appelant.
Expliquer pourquoi. Noter que la solution par pointeur n'est **pas**
livrée, et ne pas la demander à C-A.

---

## 4. Le contrat de retour

Vérifier chaque refus, **sans insertion ni correction** :

| Document | Phrase | Refus attendu |
|---|---|---|
| dans `int f(void) { … }` | `Retourne.` | `RETURN_NEEDS_VALUE` |
| dans `void g(void) { … }` | `Retourne la valeur 0.` | `RETURN_IN_VOID_FUNCTION` |
| hors de toute fonction | `Retourne.` | `NO_ENCLOSING_FUNCTION` |
| dans `long f(void) { … }` écrit à la main | `Retourne la valeur 0.` | `UNSUPPORTED_RETURN_TYPE` |
| dans `static int f(void) { … }` | `Retourne la valeur 0.` | `UNSUPPORTED_RETURN_TYPE` |

Dans chaque cas, lire le message et expliquer **pourquoi la phrase serait
fausse**. Vérifier que le document n'a pas changé et qu'aucune correction
n'a été proposée.

Vérifier ensuite ce qui est **accepté** et comprendre la limite :

- dans `int f(void)`, `Retourne le résultat numérique de "1.5".` est
  **accepté**. C-A vérifie l'accord entre la forme de la phrase et le type
  **déclaré**, **pas** le type de l'expression. Compiler ce cas à la main
  et lire l'avertissement de GCC : c'est l'illustration de la limite.
- une fonction `int` **sans aucun `return`** est acceptée : C-A n'analyse
  pas les chemins de son corps.

Vérifier enfin la **cible affichée** : avant de confirmer un retour, elle
nomme la ligne et l'en-tête de la fonction concernée. Dans un fichier à
deux fonctions, se placer dans la seconde et vérifier que la cible est bien
la seconde, jamais la première refermée.

---

## 5. Ce que C-A ne résout pas, et qu'il faut voir

Vérifier que chacun de ces cas est **traduit et placé**, puis expliquer
l'erreur C et la constater à la compilation manuelle :

| Cas | Ce que C-A fait |
|---|---|
| `Appelle somme avec "1".` alors que `somme` prend deux paramètres | traduit : aucune arité n'est vérifiée |
| `Appelle jamais_declaree.` | traduit : aucune déclaration n'est recherchée |
| une définition de fonction demandée **dans** un corps de fonction | traduite : aucune portée n'est vérifiée |
| une variable utilisée hors de sa portée | traduite |

Vérifier dans « C-A — Pédagogie » que l'information `CALL_NOT_RESOLVED` le
dit explicitement, et qu'elle mentionne que l'**ordre d'évaluation des
arguments n'est pas spécifié** par C17. Construire un exemple où cet ordre
importerait, et expliquer pourquoi il ne faut pas en dépendre — **sans**
l'exécuter pour en « déduire » l'ordre de l'implémentation.

---

## 6. Refus de formulation

Vérifier, sans insertion :

- `… et prend un int nommé a et b.` → refusé : chaque paramètre est écrit
  en entier, aucun type n'est partagé ;
- `… et prend un int nommé a et un int nommé a.` → `DUPLICATE_PARAMETER_NAME` ;
- `… et prend un char nommé c.` → type non pris en charge ;
- `… et prend un int nommée a.` → refusé : le paramètre prend `nommé`,
  accordé au type, la fonction prend `nommée` ;
- `Appelle somme avec 2.` → refusé : un argument est une expression entre
  guillemets ;
- 17 paramètres, puis 17 arguments → bornes refusées ;
- `Retourne 0.` et `Retourne rien.` → refusés : seules les quatre
  formulations du catalogue existent.

Les accents sont exigés partout ; les deux apostrophes de `l’appel` sont
équivalentes.

---

## 7. Canal pédagogique passif

Ouvrir volontairement Affichage → Sortie → « C-A — Pédagogie ». Vérifier :

| Intention | Entrées attendues |
|---|---|
| définition sans paramètre | `FUNCTION_SCOPE` |
| définition avec paramètre | `FUNCTION_SCOPE`, `PARAMETERS_BY_VALUE` |
| les quatre retours | `RETURN_ENDS_FUNCTION` |
| les deux appels | `CALL_NOT_RESOLVED` |

Aucune de ces informations ne doit incrémenter le compteur
d'avertissements, ni faire apparaître « avertissement » dans le titre de
confirmation. Le canal ne doit jamais s'ouvrir automatiquement ni voler le
focus.

Dans une session séparée, préparer `Appelle f avec "10 / 0".` :
l'avertissement du lot 8 doit apparaître **en plus** de l'information, et
le compteur doit augmenter. **Annuler après l'aperçu.**

---

## 8. Annulation, EOL et préservation

- Après une définition puis une instruction dans son corps : la première
  annulation retire l'instruction, la seconde retire la définition et son
  commentaire. Deux rétablissements restaurent les deux états.
- Refaire un cas complet avec **tabulations** et **CRLF**.
- Modifier le type déclaré d'une fonction après un aperçu de retour :
  l'aperçu doit devenir **périmé** et « Insérer » disparaître.
- Conserver une fonction manuelle après la zone de travail : elle doit
  rester intacte, jamais absorbée.

---

## 9. Critères d'acquisition du domaine

La recette est réussie quand l'apprenant sait **produire et expliquer** :

1. la différence entre **définir** et **appeler** une fonction ;
2. le contrat d'une fonction : son type de retour engage chacun de ses
   `return` ;
3. que `return` **termine** l'exécution de la fonction et rend la main ;
4. que les paramètres sont des **copies**, et ce que cela empêche ;
5. la durée de vie d'une variable locale, d'un appel au suivant ;
6. la décomposition d'un calcul en une fonction réutilisable, et pourquoi
   elle se justifie ici ;
7. **ce que C-A ne vérifie pas** : arité, existence, types des arguments,
   portée, accessibilité — et comment le constater autrement.

Le point 7 est un critère à part entière : savoir où s'arrête l'outil fait
partie de la compétence.

**La réussite des seuls tests automatisés de C-A ne constitue pas cette
acquisition.**

---

## 10. Fiche de résultat

Consigner pour chaque scénario : environnement (OS, version VS Code, unité
d'indentation, LF/CRLF), texte avant, instruction exacte, cible affichée,
prévision écrite, résultat observé, diagnostic obtenu, annulation, et
statut **réussi / échoué / non effectué**.

Les avertissements de l'hôte `mutex already exists` et DEP0168/N-API se
consignent **séparément** de la réussite des scénarios. Le blocage du §0
est à qualifier avec eux.

### GCC manuel

Sur le seul programme sûr du §2, après revue :

```powershell
gcc -std=c17 -Wall -Wextra -Wpedantic -Wformat=2 recette_domaine4.c -o recette.exe
.\recette.exe
```

Utiliser aussi GCC **délibérément** sur les cas du §5 pour constater les
erreurs que C-A ne cherche pas : arité incorrecte, fonction non déclarée,
fonction imbriquée. C'est la contrepartie pédagogique de ces limites.

Une compilation manuelle réussie ici **ne clôt pas** la recette GCC
« Expressions et calculs », toujours ouverte.
