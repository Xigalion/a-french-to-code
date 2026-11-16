# Refaire l'exercice dans VS Code, sans taper une ligne de C

**Pour qui :** la personne qui veut vérifier C-A **dans son interface
réelle**, et non seulement par son moteur.

> Le seul texte saisi est du **français**. Aucune ligne de C n'est tapée ni
> collée : chaque instruction passe par la commande, son aperçu et sa
> confirmation.
>
> Date : 16 novembre 2026. C-A 0.4.0, VS Code 1.138.0.

---

## 1. Le résultat déjà obtenu

    node scripts/dictee-vscode.mjs cloture

| | |
|---|---|
| instructions insérées par l'interface réelle | **101** |
| refus | **0** |
| gestes d'éditeur (touche `Entrée`) | **17** |
| C produit **identique** à celui du moteur hors éditeur | **OUI**, octet pour octet |
| compilation du fichier sorti de VS Code | **code 0**, `-std=c17 -Wall -Wextra -pedantic`, aucun avertissement |
| exécution | **code 0**, sortie conforme, `resultat.txt` conforme |

C'est la vérification qui manquait : jusqu'ici, les campagnes prouvaient le
**moteur**. Celle-ci prouve que **l'interface écrit la même chose**.

La comparaison est automatique et **échoue** si les deux C diffèrent : le
script imprime alors la première ligne divergente des deux côtés.

## 2. Ce que la dictée automatise, et ce qu'elle ne peut pas automatiser

Automatisé : l'ouverture du document, le placement du curseur, l'appel de la
commande, la saisie de la phrase, la validation de l'aperçu, la confirmation
de l'insertion, l'enregistrement, et la comparaison des deux C.

**Irréductiblement manuel** — trois gestes, les mêmes que la recette hôte :

1. la **frappe physique** de `Ctrl+K` puis `A` (la dictée appelle la commande
   par son identifiant, pas par le clavier) ;
2. la **composition IME** et la disposition du clavier ;
3. le **contrôle visuel** du focus, de l'aperçu et du diff.

Une dictée verte ne dit donc rien de la lisibilité du diff. Elle dit que le
chemin saisie → aperçu → confirmation → insertion produit le bon texte.

## 3. Lancer une dictée

    npm run check                 # ne rien vérifier sur un moteur inconnu
    npm run build:extension
    node scripts/dictee-vscode.mjs cloture      # l'exercice de clôture
    node scripts/dictee-vscode.mjs ex1          # un exercice du cahier
    node scripts/dictee-vscode.mjs ex6          # … ex1 à ex9

Le script ouvre **une instance isolée** de VS Code : profil, dossier de
travail et dossier d'extensions séparés, dans `.cache/dictee/`. Rien de
l'installation de l'utilisateur n'est touché, et aucune extension tierce
n'est chargée.

Sorties :

| Fichier | Contenu |
|---|---|
| `.cache/dictee/produit-<nom>.c` | le C écrit **par l'interface** |
| `.cache/dictee/rapport.json` | insertions, refus, gestes, journal phrase par phrase |
| `.cache/dictee/comparaison.txt` | le verdict d'identité |

Le code de sortie est 0 **seulement si** zéro refus et C identique.

## 4. Refaire la même chose à la main

La dictée automatique ne remplace pas une séance humaine : elle garantit
qu'une séance humaine n'a pas à taper de C. Pour la refaire à la main :

1. ouvrir un fichier `.c` vide, enregistré sur le disque ;
2. ouvrir **Affichage → Sortie → « C-A — Pédagogie »** ;
3. prendre la liste des phrases dans l'ordre :
   - exercice de clôture : `exercice/promotion/journal/production.md`
   - cahier : `docs/TEST_EXERCICES_PALIER1.md`
4. pour chaque phrase : curseur sur la **dernière ligne blanche**, `Ctrl+K`
   puis `A`, coller la phrase, `Entrée`, **lire l'aperçu**, confirmer ;
5. quand une ligne blanche manque à un niveau d'indentation : se placer en
   fin de la dernière ligne de ce niveau et appuyer sur `Entrée`. C'est le
   geste que le journal note « geste d'éditeur » — **17 fois** pour
   l'exercice de clôture ;
6. à la fin, comparer avec la référence :

       fc /N votre-fichier.c exercice\promotion\ca\notes.c

   `fc` ne doit signaler aucune différence. S'il en signale une, c'est une
   remontée (`docs/TEST_FICHE_REMONTEE.md`), pas une faute de frappe à
   corriger en silence.

## 5. Ce que la dictée a coûté en défauts trouvés

Un seul, dans la dictée elle-même et non dans C-A : le calcul de la colonne
du curseur devenait négatif sur un document d'une seule ligne vide, et
l'hôte refusait la position. Corrigé, avec la raison en commentaire sur
place.

Aucun défaut de l'extension n'a été trouvé par cette dictée. C'est une
information, pas une preuve d'absence : une dictée exerce **un** chemin, avec
un placement de curseur calculé, pas la main d'un étudiant.
