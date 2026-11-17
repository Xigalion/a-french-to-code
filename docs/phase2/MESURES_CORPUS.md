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
| formulations compréhensibles mais refusées | **43** | 45.7 % |
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
- **43** phrase(s) claires pour un lecteur humain et refusées par C-A : c’est la mesure de l’écart, et c’est le chiffre qui dit où la souplesse s’arrête aujourd’hui.
- **10** phrase(s) incomplètes refusées : refus correct, aucune information inventée.

Une phrase refusée n’est pas un défaut : c’est une capacité absente, et la
dire ainsi est la seule façon de décider si elle vaut d’être ajoutée.

## Les phrases claires que C-A refuse

- « Fais un entier age qui vaut 20. » — refus
- « age est un entier qui vaut 20. » — refus
- « Je veux un entier age égal à 20. » — refus
- « Mettre 20 dans age. » — refus
- « Donne à age la valeur 20. » — refus
- « age vaut 20. » — refus
- « Ajouter 1 à compteur. » — refus
- « Incrémenter compteur. » — refus
- « Écrire la valeur de age. » — refus
- « Imprimer la valeur de age. » — refus
- « Montrer la valeur de age. » — refus
- « Affiche age. » — refus
- « Affiche la variable age. » — refus
- « Si x est plus grand que 0 alors. » — refus
- « Tant que i est inférieur à 3, répéter. » — refus
- « Répéter tant que "i < 3". » — refus
- « Boucler sur i de 0 à 10. » — refus
- « Pour chaque note du tableau, afficher la note. » — refus
- « Sortir de la boucle. » — refus
- « Quitter la boucle. » — refus
- « Continuer la boucle. » — refus
- « Renvoyer 0. » — refus
- « Renvoyer la valeur 0. » — refus
- « Retourner 0. » — refus
- « Créer un tableau de 10 entiers nommé notes. » — refus
- « Déclarer un tableau notes de 10 entiers. » — refus
- « Créer un pointeur p vers un int. » — refus
- « Faire pointer p sur age. » — refus
- « Créer une structure Point avec deux entiers x et y. » — refus
- « Ouvrir le fichier "notes.txt" en lecture. » — refus
- « Fermer le fichier f. » — refus
- « Vérifier que x n’est pas nul. » — refus
- « Libérer la mémoire de p. » — refus
- « Déclarer un réel nommé moyenne. » — refus
- « Créer un flottant nommé prix de valeur 1.5. » — refus
- « Créer un entier nommé age de valeur vingt. » — refus
- « Crée un entier nommé 2age de valeur 20. » — refus
- « Crée un entier nommé int de valeur 20. » — refus
- « Afficher la valeur de age en couleur. » — refus
- « Afficher la valeur de age et de total. » — refus
- « Créer un entier nommé age de valeur 20 et afficher age. » — refus
- « Créer un entier nommé age de valeur 20 svp. » — refus
- « Creer un entier nomme age de valeur 20. » — refus

