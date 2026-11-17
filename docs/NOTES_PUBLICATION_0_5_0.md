# A 0.5.0 — deux langages cibles

*Corps de la release GitHub, prêt à coller.*

---

**A** traduit une phrase française en **une** instruction, montre un aperçu,
et n'insère rien sans confirmation. Cette version ajoute un second langage
cible : **Python**.

Le projet se décline désormais : **C-A** vers C17, **Python-A** vers Python.
Une seule extension porte les deux.

**Toujours un prototype pédagogique.** Pas un produit.

## Python n'est pas un portage du C

Il a son **propre catalogue pédagogique**, adapté à ses notions :

```
Crée un dictionnaire nommé notes avec la clé "ada" valant "15".
```

```python
# Crée un dictionnaire nommé notes avec la clé "ada" valant "15".
notes: dict = {"ada": 15}
```

| | |
|---|---|
| intentions que Python écrit | **97** — 33 reprises du catalogue partagé, **64 natives** |
| refus nommés | **51**, chacun désignant la construction Python qui enseigne la même compétence |
| informations pédagogiques passives | **49** |
| placement | par **indentation**, module séparé de celui des accolades |

Les différences de sens entre les deux langages sont **refusées, pas
lissées**. `7 / 2` vaut 3 en C17 et 3.5 en Python ; `-7 % 2` vaut -1 et 1.
Chacune a sa phrase française distincte, et une information dit ce qui change.

Trois informations **corrigent une règle apprise en C** :

- `match` ne traverse pas les cas — l'inverse exact du `switch` ;
- `with` ferme le fichier tout seul ;
- un indice négatif compte depuis la fin, au lieu de lire hors du tableau.

Et une phrase du catalogue C17 **peut être refusée** dans un `.py` :
`Déclare un entier nommé n.` n'a pas de sens en Python, où un nom naît avec sa
valeur. Le refus nomme ce qui le remplace. La liste complète est dans
`docs/LIMITES_CONNUES.md`.

## Français souple

Si une phrase est refusée par le catalogue — et **seulement** dans ce cas —
A essaie un lexique fini de synonymes et **98 reformulations** déterministes :
changements d'ordre, formes courtes, verbes synonymes.

```
Mettre 20 dans age.        →  age = 20;
Donne à age la valeur 20.  →  age = 20;
Renvoyer 0.                →  return 0;
```

Quatre garanties, chacune testée :

- **le mode strict est intact** : une phrase du catalogue ne traverse rien, et
  les 138 formulations publiées le vérifient une par une ;
- **rien n'est inventé** : une reformulation n'a pas le droit d'introduire un
  type ou un nombre absent de la phrase. « Augmente compteur. » est **refusée**
  — le pas n'y est pas écrit ;
- **une phrase ambiguë est refusée**, avec ses lectures nommées : « Affiche
  x. » a trois lectures, `%d`, `%c` et `%s`, et A n'en choisit aucune ;
- **le commentaire conserve votre phrase**, pas celle que A a lue.

## Les deux réglages

Les deux nouveautés sont **actives par défaut**, et chacune se désactive :

| Réglage | À `false` |
|---|---|
| `c-a.python` | n'ouvre que les fichiers `.c` |
| `c-a.souplesse` | restaure le **mode strict** : seules les phrases exactes du catalogue |

La commande « A : Basculer entre français strict et français souple » le fait
en un geste.

## Preuves livrées avec cette version

| | |
|---|---|
| programmes Python écrits par A et **exécutés** | **9** |
| exercice de clôture | **6 programmes, 238 instructions, 0 retouche manuelle** |
| intentions Python employées par un programme exécuté | **97 / 97** |
| informations Python rencontrées | **49 / 49** |
| reconnaissance du français souple, corpus **gelé** | 95,1 % (58/61), **0 erreur de sens** |
| tests | **4 376** Node, **114** hôte VS Code |
| différentiel contre la 0.4.0 | **0 régression, 0 extension, 0 capacité perdue** |

## Mettre à jour depuis la 0.4.0

L'identifiant de l'extension **ne change pas** — `projet-a-local.c-a` —, donc
la mise à jour se fait normalement, sans rien désinstaller. Seul le nom
affiché change.

```
code --install-extension c-a-0.5.0.vsix
```

Le paquet est **reproductible au bit** : deux constructions du même commit
donnent le même fichier.

```
sha256  a2e830e1a2358aaac70fe8f211e707def575726df977f8e965173fbbf3912aed
taille  163 508 octets, 51 entrées
```

Pour le vérifier vous-même :

```bash
git clone --branch v0.5.0 <dépôt> verification
cd verification && npm ci && npm run build:extension && node scripts/paquet.mjs
```

## Ce que cette version ne fait pas

- **aucune vérification de symboles, de types, de bornes ni de clés**, pas
  plus en Python qu'en C17. Une insertion acceptée n'est pas un programme
  correct, et ne garantit pas qu'il compile ou qu'il s'exécute ;
- **les classes Python** n'y sont pas, ni le `else` de boucle, ni la boucle à
  test final. Les trois sont délibérés ;
- **aucun essai par un utilisateur**, ni en C ni en Python. Les neuf
  programmes de preuve sont dictés par un script ;
- **aucun essai hors Windows**, un seul compilateur C et un seul interpréteur
  Python ;
- les tests hôte passent sur VS Code **1.96.4** ; la version 1.138.0 installée
  sur la machine de développement refuse de démarrer un hôte de test tant que
  deux processus d'installateur orphelins détiennent son mutex de mise à jour.

Tout cela est détaillé dans [`docs/LIMITES_CONNUES.md`](docs/LIMITES_CONNUES.md),
à lire **avant** de conclure à un défaut.

## Licence

Apache-2.0.
