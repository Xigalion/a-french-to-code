# Phase 2 — mesure de la souplesse sur un corpus écrit à la main

Généré par `node scripts/mesurer-corpus.mjs`. Ne pas éditer à la main.

## Ce que ce corpus est, et ce qu’il n’est pas

- Chaque phrase est écrite à la main, en français courant, SANS être dérivée du catalogue par substitution inverse.
- Le corpus mesuré dans docs/phase2/MESURES_SOUPLESSE.md est, lui, dérivé du catalogue : il mesure la combinatoire, pas le français.
- Celui-ci mesure l'écart entre ce qu'une personne écrirait et ce que la couche accepte.
- LIMITE À DIRE : il est écrit par l'auteur de la couche. Il est indépendant du catalogue et du mécanisme, PAS du français spontané d'un débutant.
- Seules les séances d'usage réel (indicateur 2b) mesurent le français spontané. Elles sont à 0/10.
- Le champ « code » est la sortie C que l'auteur du corpus attend, écrite à la main AVANT toute mesure.
- « attendu » vaut accepte, refuse ou ambigu. « humain » dit si un lecteur humain comprend la phrase sans hésiter : claire, ou incomplete.

## Les cinq comptes

| Classe | Nombre | Part |
|---|---|---|
| formulations naturelles reconnues, au sens attendu | **38** | 40.4 % |
| formulations claires GAGNÉES par le lot S5, sens vérifié | **19** | 20.2 % |
| formulations claires devenues reconnues SANS vérification de sens | **0** | 0.0 % |
| formulations compréhensibles mais refusées | **24** | 25.5 % |
| formulations incomplètes, refusées — refus correct | **10** | 10.6 % |
| ambiguïtés correctement détectées | **3** | 3.2 % |
| instructions incorrectement acceptées | **0** | 0.0 % |
| différences de sens introduites par erreur | **0** | 0.0 % |
| **total** | **94** | 100 % |

## Lecture

- **38 / 38** des phrases que l’auteur du corpus attendait acceptées le sont, **au sens exact attendu**.
- **0** différence(s) de sens : une phrase acceptée dont le C produit n’est pas celui attendu. C’est la classe la plus grave, et elle doit rester à zéro.
- **0** instruction(s) acceptée(s) à tort : une phrase que l’attente écrite voulait refusée.
- **3** ambiguïté(s) correctement détectée(s) sur 3 attendue(s).
- **19** phrase(s) claires **gagnées** par les reformulations du lot S5, chacune avec son sens vérifié à la main.
- **24** phrase(s) claires pour un lecteur humain et refusées par C-A : c’est la mesure de l’écart, et c’est le chiffre qui dit où la souplesse s’arrête aujourd’hui.
- **10** phrase(s) incomplètes refusées : refus correct, aucune information inventée.

Une phrase refusée n’est pas un défaut : c’est une capacité absente, et la
dire ainsi est la seule façon de décider si elle vaut d’être ajoutée.

## Les phrases claires GAGNÉES par le lot S5

- « Mettre 20 dans age. » → `Affecte la valeur 20 à age.` → `age = 20;`
- « Donne à age la valeur 20. » → `Affecte la valeur 20 à age.` → `age = 20;`
- « age vaut 20. » → `Affecte la valeur 20 à age.` → `age = 20;`
- « Ajouter 1 à compteur. » → `Affecte à compteur le résultat de "compteur + 1".` → `compteur = (compteur + 1);`
- « Incrémenter compteur. » → `Affecte à compteur le résultat de "compteur + 1".` → `compteur = (compteur + 1);`
- « Écrire la valeur de age. » → `Affiche la valeur de age.` → `printf("%d", age);`
- « Imprimer la valeur de age. » → `Affiche la valeur de age.` → `printf("%d", age);`
- « Montrer la valeur de age. » → `Affiche la valeur de age.` → `printf("%d", age);`
- « Affiche la variable age. » → `Affiche la valeur de age.` → `printf("%d", age);`
- « Répéter tant que "i < 3". » → `Crée une boucle tant que "i < 3".` → `while (i < 3) {⏎    ⏎}`
- « Sortir de la boucle. » → `Sors de la boucle la plus intérieure.` → `break;`
- « Quitter la boucle. » → `Sors de la boucle la plus intérieure.` → `break;`
- « Continuer la boucle. » → `Passe à l’itération suivante de la boucle la plus intérieure.` → `continue;`
- « Renvoyer 0. » → `Retourne la valeur 0.` → `return 0;`
- « Renvoyer la valeur 0. » → `Retourne la valeur 0.` → `return 0;`
- « Retourner 0. » → `Retourne la valeur 0.` → `return 0;`
- « Fermer le fichier f. » → `Ferme le fichier f.` → `fclose(f);`
- « Libérer la mémoire de p. » → `Libère la mémoire pointée par p.` → `free(p);`
- « Créer un flottant nommé prix de valeur 1.5. » → `Crée une variable de type float nommée prix avec le résultat de "1.5".` → `float prix = 1.5;`

## Les phrases claires que C-A refuse

- « Fais un entier age qui vaut 20. » — refus
- « age est un entier qui vaut 20. » — refus
- « Je veux un entier age égal à 20. » — refus
- « Affiche age. » — ambigu
- « Si x est plus grand que 0 alors. » — refus
- « Tant que i est inférieur à 3, répéter. » — refus
- « Boucler sur i de 0 à 10. » — refus
- « Pour chaque note du tableau, afficher la note. » — refus
- « Créer un tableau de 10 entiers nommé notes. » — refus
- « Déclarer un tableau notes de 10 entiers. » — refus
- « Créer un pointeur p vers un int. » — refus
- « Faire pointer p sur age. » — refus
- « Créer une structure Point avec deux entiers x et y. » — refus
- « Ouvrir le fichier "notes.txt" en lecture. » — refus
- « Vérifier que x n’est pas nul. » — refus
- « Déclarer un réel nommé moyenne. » — refus
- « Créer un entier nommé age de valeur vingt. » — refus
- « Crée un entier nommé 2age de valeur 20. » — refus
- « Crée un entier nommé int de valeur 20. » — refus
- « Afficher la valeur de age en couleur. » — refus
- « Afficher la valeur de age et de total. » — refus
- « Créer un entier nommé age de valeur 20 et afficher age. » — refus
- « Créer un entier nommé age de valeur 20 svp. » — refus
- « Creer un entier nomme age de valeur 20. » — refus

