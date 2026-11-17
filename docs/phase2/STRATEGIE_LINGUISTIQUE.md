# Phase 2 — souplesse linguistique déterministe

**Pour qui :** le fondateur, pour valider un mécanisme **avant** qu'il
touche le moteur.

> Prototype exécuté : `experiences/souplesse/`, **20 cas conformes sur 20**,
> et **140 phrases du catalogue traversent la couche sans une seule
> réécriture**. Rien n'est implémenté dans `src/`.
>
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. La distinction qui gouverne tout le document

| Souplesse **linguistique** | Relâchement **pédagogique** |
|---|---|
| plusieurs manières de **dire la même chose** | une manière de dire **moins de choses** |
| « Créer un entier appelé age valant 20. » | « Crée un entier age. » et C-A choisit 0 |
| l'information est **complète**, la forme varie | l'information **manque**, et l'outil la comble |
| **accepté** | **refusé, définitivement** |

Le mécanisme ci-dessous ne peut pas franchir cette frontière, et pas par
discipline : **par construction**. Il ne sait que remplacer des suites de
mots par d'autres suites de mots issues d'une table. Il n'a aucun moyen
d'ajouter une valeur, un nom ou un type, parce qu'il n'a aucun moyen d'en
produire un.

## 2. Le mécanisme : le moteur strict reste l'arbitre

```
phrase libre
   │
   ├── 1. essai STRICT ─────────────── accepté ? → terminé, rien n'est réécrit
   │
   ├── 2. lexique : repérer les suites de mots connues
   │        aucune → REFUS « rien à normaliser »
   │        plus de 3 → REFUS « trop de substitutions »
   │
   ├── 3. produire les phrases CANDIDATES (≤ 32, sinon REFUS)
   │
   ├── 4. soumettre chaque candidate au MOTEUR STRICT
   │        0 acceptée  → REFUS, avec le diagnostic d'origine
   │        1 sens      → ACCEPTÉE
   │        ≥2 sens     → REFUS D'AMBIGUÏTÉ, les lectures montrées
   │
   └── 5. insertion : le commentaire garde la phrase DE L'UTILISATEUR
```

**La couche ne décide jamais qu'une phrase est valide.** Elle propose des
lectures ; le moteur gelé tranche. C'est ce qui la rend inoffensive pour le
modèle 1 : si elle disparaissait, le comportement strict serait identique.

### 2.1 Le lexique est une table, jamais une inférence

```js
{ libre: 'créer',      formes: ['Crée'] }            // variante grammaticale
{ libre: 'appelé',     formes: ['nommé'] }           // synonyme
{ libre: 'valant',     formes: ['de valeur'] }       // formulation équivalente
{ libre: 'sors de la boucle', formes: ['Sors de la boucle la plus intérieure'] }
{ libre: 'mets',       formes: ['Affecte', 'Ajoute'] }  // homonyme : 2 lectures
{ libre: 'montre',     formes: ['Affiche la valeur de', 'Affiche le caractère'] }
```

Pas de racines, pas de distance d'édition, pas de modèle de langue, pas de
correction orthographique. **Un mot hors de la table n'est pas tenté** :
« Fabrique un entier nommé age de valeur 20. » est refusée, et le refus dit
qu'aucun mot du lexique ne figure dans la phrase.

Conséquence assumée : le lexique **grandit à la main**, lot par lot, chaque
entrée justifiée par une formulation réellement rencontrée. C'est lent, et
c'est le prix du déterminisme.

### 2.2 Les bornes, et pourquoi elles existent

| Borne | Valeur | Raison |
|---|---|---|
| substitutions par phrase | **3** | au-delà, la phrase est trop éloignée du catalogue : elle se reformule, elle ne se devine pas |
| lectures candidates | **32** | la combinatoire doit rester finie et visible |

Le prototype a d'ailleurs **pris ma propre attente en défaut** : j'avais écrit
qu'une phrase à quatre substitutions serait acceptée ; la borne l'a refusée.
J'ai corrigé l'attente, **pas la borne** — régler l'instrument pour faire
passer un cas est exactement ce que ce projet s'interdit.

## 3. Les quatre comportements, mesurés

Extraits des 20 cas de `experiences/souplesse/sortie/MESURES.md`.

### 3.1 Synonymes et variantes grammaticales — acceptés

| Phrase libre | Lue comme | Code produit |
|---|---|---|
| `Créer un entier nommé age de valeur 20.` | infinitif → impératif | `int age = 20;` |
| `Créez un entier nommé age de valeur 20.` | impératif pluriel | `int age = 20;` |
| `Crée un entier appelé age de valeur 20.` | « appelé » → « nommé » | `int age = 20;` |
| `Crée un entier nommé age valant 20.` | « valant » → « de valeur » | `int age = 20;` |
| `Crée un entier nommé age initialisé à 20.` | idem | `int age = 20;` |
| `Sors de la boucle.` | forme courte | `break;` |
| `Créer un entier appelé age valant 20.` | **trois** substitutions | `int age = 20;` |

### 3.2 Homonyme tranché par le contexte — accepté

| Phrase libre | Lectures essayées | Retenue |
|---|---|---|
| `Mets la valeur 5 à x.` | « Affecte… » (valide), « Ajoute… » (hors catalogue) | `x = 5;` |
| `Mets une branche sinon.` | « Ajoute… » (valide), « Affecte… » (hors catalogue) | `else { … }` |

**Le contexte n'est pas interprété : il élimine.** Une seule lecture
appartient au catalogue, donc une seule survit. Aucune heuristique, aucune
préférence, aucun ordre de priorité.

### 3.3 Ambiguïté non résolue — refusée, les deux lectures montrées

| Phrase libre | Lecture A | Lecture B |
|---|---|---|
| `Montre c.` | `printf("%d", c);` | `printf("%c", c);` |

Les deux appartiennent au catalogue et n'ont **pas** le même sens. C-A ne
choisit pas, et le message le dit : *« Cette phrase a 2 lectures de sens
différent. C-A ne choisit pas : reformulez avec l'une des phrases du
catalogue. »*

Pourquoi c'est insoluble **et** sain : C-A est **sans état d'une instruction
à l'autre**, il ne sait pas si `c` est un `char` ou un `int`. Deviner serait
inventer une information manquante — la règle 3. Le refus d'ambiguïté est
donc la même règle, appliquée à la langue.

### 3.4 Information manquante — refusée, même avec une variante connue

| Phrase libre | Verdict |
|---|---|
| `Créer un entier appelé age.` | **refus** : la variante est comprise, **la valeur manque** |
| `Créer un entier nommé age valant.` | **refus** : la valeur manque après le synonyme |

C'est le cas décisif. La couche **a reconnu** « Créer » et « appelé », a
produit une candidate parfaitement normalisée — et le moteur strict l'a
refusée parce qu'il manque la valeur. **Aucun 0 n'est apparu.** La souplesse
porte sur la forme, jamais sur le fond.

## 4. Le mode strict est intact — mesuré, pas affirmé

| | |
|---|---|
| lignes de phrase relevées dans `docs/CATALOGUE.md` | 148 |
| non traduisibles seules (fragments de tableaux d'exemples) | 8 |
| **phrases réellement traduites** | **140** |
| **rendues sans aucune réécriture** | **140** |
| **altérées par la couche** | **0** |

La première chose que fait la couche est d'essayer le moteur strict et de
**s'effacer** s'il accepte. Une phrase du catalogue ne la traverse donc
jamais.

## 5. Comment cela s'insère dans le produit, si c'est validé

| Point | Proposition |
|---|---|
| **désactivé par défaut** | le palier 1 reste strict ; la couche est un réglage explicite, documenté comme palier 2 |
| commande | une seconde commande, ou un réglage de l'extension — jamais un repli silencieux du strict vers le souple |
| **traçabilité** | le commentaire inséré garde la phrase **de l'utilisateur**. La phrase canonique n'est qu'un intermédiaire |
| **l'aperçu montre la lecture** | si la couche a réécrit, l'aperçu l'affiche : « lue comme : *Crée un entier nommé age de valeur 20.* » L'utilisateur confirme une lecture, pas une devinette |
| information passive | une information pourrait nommer la phrase du catalogue, pour que l'étudiant l'apprenne au lieu de rester sur sa variante |
| **lexique par langue** | le lexique est une donnée du français, pas du C : il se partage entre tous les langages cibles |

Le point le plus important est le quatrième : **l'aperçu montre la lecture
retenue**. Sans lui, la couche deviendrait une boîte noire qui corrige en
silence — précisément ce que la règle 5 interdit.

## 6. Ce que ce mécanisme ne fera pas

- **pas de correction orthographique** : « Crèe » reste un refus. Une faute
  n'est pas une variante, et la corriger ferait de C-A un correcteur ;
- **pas de reformulation structurelle** : réordonner une phrase, déplacer un
  complément, deviner un sujet implicite — hors de portée par construction ;
- **pas de valeur par défaut**, jamais, même documentée. Le palier 2 en
  prévoit ; ce mécanisme-ci ne les apporte pas, et les deux sujets doivent
  rester séparés ;
- **pas d'apprentissage** : aucune statistique d'usage, aucun classement des
  lectures par fréquence. Deux utilisateurs obtiennent le même verdict ;
- **pas de résolution par le document** : la couche ne lit pas le fichier
  pour deviner le type de `c`. Ce serait une vérification de symboles, que
  C-A n'a pas, et l'introduire ici par la petite porte serait malhonnête.

## 7. Risque principal, et comment le tenir

**Le lexique peut devenir un deuxième catalogue, non documenté.** Si les
entrées s'accumulent sans contrat, les formulations acceptées cessent d'être
dénombrables — et « tout ce qui n'est pas au catalogue est refusé » devient
faux.

Trois garde-fous, à inscrire dans le contrat du lot s'il est validé :

1. le lexique est **généré dans la documentation** comme le catalogue l'est,
   avec, pour chaque entrée, la phrase du catalogue visée ;
2. une entrée nouvelle demande **une formulation réellement rencontrée** —
   pas une idée. Le test utilisateur alimente le lexique, pas l'imagination ;
3. un test vérifie que **chaque entrée du lexique produit au moins une
   lecture valide**, sinon elle est morte — la même garde que le lot 30 a
   posée sur les intentions mortes.
