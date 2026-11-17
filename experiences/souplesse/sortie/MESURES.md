# Expérience — souplesse linguistique déterministe

Produit par `node --experimental-strip-types experiences/souplesse/mesurer.mjs`.
**Sonde jetable** : la couche vit dans `experiences/`, et `src/` n’est pas touché.

## 1. Principe

La couche réécrit la phrase libre en phrases **candidates du catalogue**, et
c’est le **moteur strict qui arbitre** : une lecture n’est retenue que s’il
l’accepte. Une seule lecture valide → acceptée ; aucune → refus ; plusieurs
de sens différent → **refus d’ambiguïté**, les lectures montrées.

| Borne | Valeur |
|---|---|
| entrées du lexique | 16 |
| substitutions par phrase | 3 |
| lectures candidates | 32 |

## 2. Les 20 cas

| Attendu | Obtenu | Phrase libre | Ce que la couche en fait | Pourquoi |
|---|---|---|---|---|
| strict | strict | `Crée un entier nommé age de valeur 20.` | `int age = 20;` | phrase du catalogue, inchangée |
| strict | strict | `Affiche la valeur de age.` | `printf("%d", age);` | phrase du catalogue, inchangée |
| normalise | normalise | `Créer un entier nommé age de valeur 20.` | `int age = 20;` | infinitif |
| normalise | normalise | `Créez un entier nommé age de valeur 20.` | `int age = 20;` | impératif pluriel |
| normalise | normalise | `Afficher la valeur de age.` | `printf("%d", age);` | infinitif |
| normalise | normalise | `Déclarer un entier nommé compteur.` | `int compteur;` | infinitif |
| normalise | normalise | `Crée un entier appelé age de valeur 20.` | `int age = 20;` | synonyme de « nommé » |
| normalise | normalise | `Crée un entier nommé age valant 20.` | `int age = 20;` | synonyme de « de valeur » |
| normalise | normalise | `Crée un entier nommé age initialisé à 20.` | `int age = 20;` | synonyme de « de valeur » |
| normalise | normalise | `Crée un nombre entier nommé age de valeur 20.` | `int age = 20;` | synonyme de « entier » |
| normalise | normalise | `Sors de la boucle.` | `break;` | forme courte d’une phrase longue |
| normalise | normalise | `Passe à l’itération suivante.` | `continue;` | forme courte |
| normalise | normalise | `Créer un entier appelé age valant 20.` | `int age = 20;` | trois substitutions, sous le budget |
| refus | refus | `Créer un nombre entier appelé age valant 20.` | `TROP_DE_SUBSTITUTIONS` | QUATRE substitutions : au-delà du budget, la phrase se reformule, elle ne se devine pas |
| resolu | resolu | `Mets la valeur 5 à x.` | `x = 5;` | « Mets » → Affecte (Ajoute ne parse pas) |
| resolu | resolu | `Mets une branche sinon.` | `else {
    
}` | « Mets » → Ajoute (Affecte ne parse pas) |
| ambigu | ambigu | `Montre c.` | `printf("%d", c);` **ou** `printf("%c", c);` | affichage en %d ou en %c : C-A ne connaît pas le type |
| refus | refus | `Fabrique un entier nommé age de valeur 20.` | `AUCUNE_VARIANTE_CONNUE` | verbe hors lexique |
| refus | refus | `Créer un entier appelé age.` | `AUCUNE_LECTURE_VALIDE` | variante connue, mais valeur absente : rien n’est inventé |
| refus | refus | `Créer un entier nommé age valant.` | `AUCUNE_LECTURE_VALIDE` | valeur manquante après un synonyme |

## 3. Le mode strict est-il intact ?

| | |
|---|---|
| lignes de phrase relevées dans le catalogue | 148 |
| non traduisibles seules (fragments de tableaux d’exemples) | 8 |
| phrases réellement traduites | 140 |
| rendues **sans aucune réécriture** | **140** |
| altérées par la couche | **0** |

Aucune phrase du catalogue ne traverse la couche : la première chose qu’elle fait est d’essayer le moteur strict, et de s’effacer s’il accepte.

## 4. Ce que la couche ne fait pas

- elle **n’invente aucune valeur** : « Créer un entier appelé age. » reste un refus,
  parce que la valeur manque — la variante connue ne comble pas le trou ;
- elle **ne choisit pas** entre deux lectures de sens différent ;
- elle **ne corrige pas** la phrase de l’utilisateur : le commentaire inséré
  garde ce qu’il a écrit, et la phrase canonique n’est qu’un intermédiaire ;
- elle **n’est pas une inférence** : hors du lexique, rien n’est tenté.

## 5. Verdict de la sonde

**20 cas sur 20 conformes, et 140 phrases du catalogue inchangées.**

