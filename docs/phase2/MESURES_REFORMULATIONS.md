# Phase 2 — souplesse linguistique : les deux corpus du lot S5

Généré par `node scripts/mesurer-reformulations.mjs`. Ne pas éditer à la main.

## Corpus de développement

- Écrit à la main, domaine par domaine, en français courant. Aucune phrase n'est dérivée du catalogue ni de la table de reformulations.
- Ce corpus a le droit de servir à ÉTENDRE la table : c'est son rôle. Il ne mesure donc pas la généralisation.
- Le corpus de VALIDATION (corpus-validation.json) est gelé et n'a jamais servi à enrichir quoi que ce soit : c'est lui qui donne le chiffre honnête.
- « perimetre » dit si l'INTENTION existe dans le catalogue C-A, indépendamment de la formulation. Une phrase hors périmètre ne peut pas être reconnue, et la compter dans un taux de reconnaissance serait tricher dans l'autre sens.
- « code » est la sortie C attendue, écrite à la main AVANT toute mesure.

| Classe | Nombre |
|---|---|
| reconnues au sens exact attendu | **51** |
| **différences de sens** | **0** |
| claires et complètes, non reconnues | **0** |
| ambiguïtés correctement détectées | **1** |
| ambiguïtés non détectées (refus d’un autre genre) | **0** |
| refus corrects | **9** |
| **acceptées à tort** | **0** |
| total | 61 |

**Taux de reconnaissance, phrases dans le périmètre : 51 / 51 = 100.0 %.**

Erreurs de sens : **0**. Acceptations à tort : **0**. Ces deux chiffres doivent rester à zéro ;
un taux obtenu en les laissant monter ne vaudrait rien.

## Corpus de validation (gelé)

- Écrit à la main le 17 novembre 2026, AVANT toute mesure du corpus de développement, et avant toute extension de la table de reformulations faite à partir de celui-ci.
- Aucune de ses phrases n'a servi à écrire une entrée du lexique ni une reformulation. C'est ce qui le rend indépendant, et c'est la seule raison pour laquelle son chiffre vaut quelque chose.
- ENGAGEMENT : ce fichier n'est pas modifié pour faire monter un taux. Si une phrase y est mal classée, la correction est documentée dans le bilan du lot, avec sa raison.
- « perimetre » dit si l'INTENTION existe dans le catalogue C-A. Le taux de reconnaissance ne se calcule que sur les phrases DANS le périmètre, claires et complètes : y mélanger des phrases hors périmètre gonflerait le dénominateur, et les en retirer sans le dire gonflerait le taux.
- LIMITE À DIRE : écrit par l'auteur du mécanisme. Indépendant de la table et du catalogue, PAS du français spontané d'un débutant. Seul l'usage réel observé mesure cela, et il est à 0 séance.

| Classe | Nombre |
|---|---|
| reconnues au sens exact attendu | **58** |
| **différences de sens** | **0** |
| claires et complètes, non reconnues | **3** |
| ambiguïtés correctement détectées | **2** |
| ambiguïtés non détectées (refus d’un autre genre) | **0** |
| refus corrects | **14** |
| **acceptées à tort** | **0** |
| total | 77 |

**Taux de reconnaissance, phrases dans le périmètre : 58 / 61 = 95.1 %.**

Erreurs de sens : **0**. Acceptations à tort : **0**. Ces deux chiffres doivent rester à zéro ;
un taux obtenu en les laissant monter ne vaudrait rien.

### Phrases claires, dans le périmètre, non reconnues

- « Place la valeur 7 dans largeur. » — refus
- « Attribue 7 à largeur. » — refus
- « Écrase largeur avec 7. » — refus

