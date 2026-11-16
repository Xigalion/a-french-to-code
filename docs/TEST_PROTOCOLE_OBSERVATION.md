# C-A — protocole d'observation et méthode de classement

**Pour qui :** l'encadrant qui observe une séance, puis trie ce qu'il a vu.
Deux parties indépendantes : **observer** (§1 à §3), puis **classer**
(§4 à §6), après la séance et pas pendant.

> Règle qui domine tout le document : **pendant une séance, on ne modifie
> rien.** Ni le moteur, ni les énoncés, ni les messages. Une observation
> faite sur un outil qui bouge ne mesure rien.

---

## 1. Ce qu'on observe, et pourquoi ces trois choses

C-A parle par **trois canaux**, et la confusion entre eux est le risque
principal du test. Ils doivent être comptés séparément.

| canal | ce qui se passe | où le lire | ce qu'il mesure |
|---|---|---|---|
| **refus** | **rien n'est inséré** | notification et aperçu | le périmètre : la phrase est hors catalogue, ou invalide, ou mal placée |
| **avertissement** | inséré, danger nommé | aperçu, `severity: warning` | un calcul dont le comportement est indéfini |
| **information** | inséré, notion expliquée | canal « C-A — Pédagogie » | la part pédagogique, **passive** |

Une information **n'est pas** un avertissement et **n'incrémente jamais**
le compteur d'avertissements : c'est une séparation tenue dans le code, et
elle doit être tenue dans les notes.

Trois questions, une par canal, et ce sont les seules que la séance doit
trancher :

1. **Les refus sont-ils compréhensibles sans aide ?**
2. **Les avertissements sont-ils remarqués ?**
3. **Les informations sont-elles lues, et jusqu'à quand ?**

## 2. Avant la séance

- [ ] `npm run check` au vert — **3 820 tests**. Ne pas observer un moteur
      dont on ne sait rien.
- [ ] extension installée et les trois contrôles de
      `docs/TEST_INSTALLATION.md` §5 passés.
- [ ] canal « C-A — Pédagogie » **ouvert et visible** avant la première
      phrase. S'il est fermé, l'observation du canal 3 ne vaut rien.
- [ ] fiche `docs/TEST_FICHE_REMONTEE.md` copiée et en-tête rempli.
- [ ] chronomètre, et de quoi noter l'heure de chaque incident.
- [ ] version de C-A, de VS Code et du compilateur notées. Une observation
      sans version n'est pas reproductible.

## 3. Pendant la séance

### La règle des 60 secondes

Quand l'étudiant est bloqué : **attendre 60 secondes avant d'aider**, et
noter ce qu'il essaie. Ce qu'il tente seul est la donnée ; l'aide qu'on lui
donne détruit cette donnée.

Après 60 secondes, aider par **paliers**, en notant lequel a suffi :

| palier | aide | ce que son usage démontre |
|---|---|---|
| A1 | « relis le message de C-A » | le message est là, mais pas lu |
| A2 | « le message dit ceci : … » | le message est lu mais pas compris |
| A3 | « regarde le catalogue, domaine n » | la phrase n'est pas trouvable |
| A4 | donner la phrase exacte | ni le message ni le catalogue ne suffisent |

**Le palier atteint est la mesure la plus utile de toute la séance.** A4
répété sur une même notion est un défaut de l'outil, pas de l'étudiant.

### À noter systématiquement

- chaque **refus**, avec son **code exact** et la phrase **exacte** ;
- chaque **retouche manuelle** du C produit, même d'un caractère, avec le
  avant/après. Zéro retouche sur les cinq programmes des campagnes : toute
  retouche en séance est donc une information neuve ;
- chaque **anomalie de l'hôte** : aperçu qui ne s'ouvre pas, commande
  absente, insertion au mauvais endroit, indentation inattendue. Ces
  anomalies sont d'une autre nature que les refus — les séparer dès la prise
  de notes ;
- le moment où l'étudiant **arrête de lire** le canal pédagogique. Une heure
  précise, pas une impression.

### À ne pas faire

- ne pas souffler la phrase avant les 60 secondes ;
- ne pas corriger le C produit à la place de l'étudiant ;
- ne pas expliquer qu'une limite « sera corrigée » : plusieurs sont
  **volontaires** et le resteront ;
- ne pas lancer de nouveau lot, ni retoucher un message, entre deux séances
  de la même campagne.

## 4. Classer une remontée — la méthode

Après la séance. Quatre catégories, et une seule par remontée. L'ordre des
questions compte : **chaque question a un test exécutable**, pas une
appréciation.

### Question 1 — la phrase est-elle dans le catalogue ?

    grep -n "<un morceau de la phrase>" docs/CATALOGUE.md

### Question 2 — que fait le moteur, hors de VS Code ?

    node scripts/rejouer.mjs "<la phrase exacte>"
    node scripts/rejouer.mjs --dans-main "<la phrase exacte>"
    node scripts/rejouer.mjs --document <le fichier de l'étudiant> "<la phrase>"

### Question 3 — une phrase du catalogue fait-elle ce que l'étudiant voulait ?

Chercher dans `docs/CATALOGUE.md` le domaine concerné, et répondre par oui
ou par non — **pas** par « presque ».

### L'arbre

| # | constat | catégorie |
|---|---|---|
| 1 | la phrase **est** au catalogue, et `rejouer.mjs` la **refuse** dans le contexte où elle devait marcher | **défaut du moteur** |
| 2 | la phrase est au catalogue, `rejouer.mjs` l'**accepte**, mais VS Code a montré autre chose | **défaut du moteur (hôte)** |
| 3 | la phrase n'est pas au catalogue, **une phrase du catalogue** fait ce que l'étudiant voulait | **erreur de formulation** |
| 4 | la phrase n'est pas au catalogue, et **aucune** phrase du catalogue ne le fait | **limitation volontaire** |
| 5 | le refus est juste, mais l'étudiant **n'a pas compris pourquoi** après lecture (palier d'aide A2) | **incompréhension pédagogique** |
| 6 | le code C produit est juste, mais l'étudiant **attendait autre chose** | **incompréhension pédagogique** |
| 7 | C-A a **accepté** et le compilateur a refusé | **limitation volontaire** — voir ci-dessous |

### Les deux pièges du classement

**Piège 1 — le cas 7 n'est pas un défaut du moteur.** C-A ne vérifie ni
symboles, ni types, ni bornes : c'est déclaré, testé, et documenté. Le
classer en défaut ferait croire à une régression là où il n'y a qu'une
limite connue. Mais si ce cas revient **souvent**, ce n'est plus une
limitation : c'est une **question de périmètre** pour le fondateur, et elle
se compte (§6).

**Piège 2 — un cas 3 répété devient un cas 5.** Si plusieurs étudiants
inventent la **même** phrase hors catalogue, ce n'est plus une erreur de
formulation : la formulation du catalogue n'est pas trouvable. Le seuil est
posé d'avance, et il n'est pas négociable après coup : **trois étudiants
sur la même phrase**.

## 5. Ce que chaque catégorie déclenche

| catégorie | suite |
|---|---|
| **défaut du moteur** | test de reproduction écrit **d'abord**, puis correction dans un lot nommé, puis différentiel contre la référence précédente |
| **défaut du moteur (hôte)** | reproduction dans `test/vscode/suite.cjs` ; chercher la **cause**, jamais réessayer jusqu'à ce que ça passe |
| **erreur de formulation** | aucune correction du moteur. Montrer la phrase du catalogue. Compter : trois occurrences → piège 2 |
| **incompréhension pédagogique** | **proposer** une reformulation du message au fondateur. Ne pas la livrer seul : un message est un contrat |
| **limitation volontaire** | aucune correction. Vérifier qu'elle est écrite dans `docs/CATALOGUE.md` ; si elle n'y est pas, le défaut est **documentaire** |

Deux interdits qui valent pour les cinq lignes :

1. **Ne pas modifier le moteur pendant la campagne.** Les corrections
   s'accumulent et se livrent après, en lot, avec contrat et bilan.
2. **Ne pas modifier un énoncé pour faire monter un chiffre.** Les trois
   campagnes de validation ont tenu cette règle, dont deux fois en laissant
   un défaut de mesure visible plutôt que de changer la sonde.

## 6. Compter, sans pondérer

Le test utilisateur produit des **comptes bruts**, et rien de plus. Il
n'alimente **pas** le barème des 91 sondes, et ne modifie **aucun** score
de campagne.

| à compter | pourquoi |
|---|---|
| remontées par catégorie (les 4) | la répartition est le résultat principal |
| paliers d'aide atteints (A1 à A4) | mesure ce que l'outil explique vraiment |
| refus par code de diagnostic | un code qui domine est un message à revoir |
| occurrences du cas 7 | la seule donnée qui peut rouvrir une question de périmètre |
| retouches manuelles | zéro attendu ; toute retouche est neuve |
| anomalies de l'hôte | à comparer aux six passages verts de la suite hôte |
| minute d'abandon du canal pédagogique | répond au point ouvert n° 8 |

**Pourquoi pas de pondération.** L'audit du barème a montré que ses cinq
preuves n'en mesurent que deux, et qu'un poids mal placé se discute pendant
des semaines sans déplacer un chiffre (`docs/AUDIT_BAREME.md`). Un compte
brut de dix séances vaut mieux qu'un indice pondéré d'une seule.

Les comptes se reportent dans `docs/TEST_SUIVI_RESULTATS.md`, qui est le
seul endroit où ils s'additionnent.
