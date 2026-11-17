# Lot S5 — les reformulations syntaxiques

Contrat et bilan dans le même document. Ce lot a trouvé **trois défauts**, dont
**un dans sa propre table** : une reformulation qui inventait un type. C'est
le résultat le plus utile du lot.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Le problème que le lot S4 avait mesuré

Le corpus écrit à la main du lot S4 avait classé **43 phrases sur 94** comme
« claires pour un lecteur humain, et refusées ». La raison n'était pas le
périmètre : c'était la **forme**. « Mettre 20 dans age. » n'est pas la phrase
du catalogue avec d'autres mots, c'est la même intention dans un autre ordre.

Le lexique du lot S4 ne savait substituer que des mots. Il couvrait les
variantes **morphologiques** et ne pouvait rien pour les reformulations
**syntaxiques**.

## 2. Ce que le lot livre

| Livrable | Où |
|---|---|
| **98 reformulations** déterministes, chacune avec sa raison et sa démonstration | `src/langue/reformulations.ts` |
| la couche composée : lexique **puis** reformulations, et un **arbitre paramétrable** | `src/langue/variantes.ts` |
| corpus de **développement** (61 phrases), qui a le droit d'enrichir la table | `test-utilisateur/corpus/corpus-developpement.json` |
| corpus de **validation** (77 phrases), **gelé** | `test-utilisateur/corpus/corpus-validation.json` |
| les 18 gains du corpus historique, chacun avec son sens vérifié | `test-utilisateur/corpus/corpus-libre-evolution.json` |
| la mesure des deux corpus | `scripts/mesurer-reformulations.mjs` → `docs/phase2/MESURES_REFORMULATIONS.md` |
| 154 tests | `test/reformulations.test.mjs` |

## 3. Comment une reformulation est contrainte

Une reformulation est une **table**, jamais une inférence. Quatre garanties,
et chacune a son test :

1. **Son motif est ancré sur la phrase entière.** Un motif partiel réécrirait
   un morceau et laisserait le reste au hasard. `Mets 20 dans age puis affiche
   age.` ne produit **aucune** candidate : l'ancrage refuse, il ne découpe pas.
2. **Les captures sont recopiées telles quelles.** Un nom, un entier, une
   expression, un texte, un littéral caractère passent sans être relus.
   `Calcule "mets + 1" dans total.` donne `total = (mets + 1);` : le mot
   `mets`, qui est au lexique, n'est pas touché parce qu'il est **dans**
   l'expression.
3. **Le moteur strict arbitre.** La table produit des phrases candidates ; elle
   ne décide jamais qu'une phrase est valide.
4. **Deux lectures de sens différent sont refusées**, et les deux sont
   montrées. `Affiche x.` a trois lectures — `%d`, `%c`, `%s` — et C-A n'en
   choisit aucune.

## 4. Le défaut que ce lot a trouvé chez lui

J'avais écrit **deux** reformulations pour `{nom} vaut {entier}`, afin que la
phrase soit refusée comme ambiguë — « déclarer ou affecter ? ». La seconde
produisait `Crée un entier nommé age de valeur 20.`

**Elle inventait le type.** La phrase « age vaut 20. » ne dit rien d'un type ;
écrire « entier » est exactement l'ajout implicite que la règle 3 interdit. La
lecture « créer » n'est donc pas une lecture **concurrente** : elle est
**impossible**.

Conséquence : la reformulation est retirée, et `age vaut 20.` est désormais
acceptée comme une affectation — une seule lecture, qui n'invente rien.

Et une **garde générale** a été écrite pour que cela ne se reproduise pas : si
la phrase libre d'une reformulation ne contient aucun mot de type, sa phrase
canonique n'a pas le droit d'en contenir un. L'exemption pour les formes à
plusieurs lectures — comme `Affiche {nom}` — n'est pas accordée, elle est
**vérifiée** : le test exige que la forme finisse réellement en ambiguïté.

Deux corrections de corpus en découlent, et les voici en clair :

| Fichier | Entrée | Correction |
|---|---|---|
| `corpus-validation.json` | `x vaut 5.` | attendait « ambigu », devient « accepte » → `x = 5;`. **Seule correction du corpus gelé**, et elle porte sa raison dans le fichier |
| `corpus-libre-evolution.json` | `age vaut 20.` | était classée « toujours refusée pour ambiguïté » ; c'est un **gain** |

## 5. Les deux autres défauts, tous deux trouvés par un corpus

### Une apostrophe française prise pour un littéral caractère

`zonesProtegees` reconnaissait un littéral caractère par `'[^']*'?` — guillemet
fermant **facultatif**. Une apostrophe droite dans un mot français ouvrait donc
une zone protégée qui avalait la fin de la phrase, et la substitution du
lexique était annulée **en silence**.

`Passe à l'itération suivante.` — ce que produit la plupart des claviers —
était refusée, là où `Passe à l’itération suivante.` marchait. Un défaut
présent depuis le lot S4, et que seul un corpus écrit avec une apostrophe
droite pouvait révéler.

Corrigé : un littéral caractère est reconnu par sa forme exacte — un
caractère, ou une échappement, entre deux apostrophes. Une apostrophe isolée
n'en est plus un, et le moteur strict refuse de toute façon un littéral non
terminé. Les tests vérifient que `'A'` et `'\0'` restent intouchables.

### Un gabarit qui produisait une phrase inexistante

`Libérer la mémoire de p.` était reformulée en `Libère la mémoire de p.` — une
phrase qui **n'existe pas** : le catalogue dit « Libère la mémoire **pointée
par** p. ». La reformulation était donc morte sans que rien ne le signale.

Corrigé, et un test général ajouté : **toute** reformulation doit produire au
moins une phrase que le moteur accepte. Un gabarit faux est désormais un test
qui échoue.

## 6. Les mesures, et ce qu'elles valent

### Le corpus de développement : 100 % — et ce chiffre ne vaut rien

| Corpus | Taux dans le périmètre | Erreurs de sens | Acceptées à tort |
|---|---|---|---|
| développement, 61 phrases | **50 / 50 = 100 %** | **0** | **0** |

Il a servi à **écrire** 37 des 98 reformulations. Son taux mesure la
couverture de ce qu'on a déjà regardé, pas la généralisation. Le citer comme
un résultat serait malhonnête, et c'est pour cela qu'il est nommé « corpus de
développement ».

### Le corpus de validation : 94,9 %

| Corpus | Taux dans le périmètre | Erreurs de sens | Acceptées à tort |
|---|---|---|---|
| validation, 77 phrases, **gelé** | **56 / 59 = 94,9 %** | **0** | **0** |

Il dépasse l'objectif indicatif de 90 %, avec **zéro erreur de sens**.

**Et il faut dire tout de suite ce qu'il ne prouve pas.** Il est gelé, il n'a
jamais servi à enrichir la table — mais il a été écrit par **l'auteur du
mécanisme**. Je connaissais la table en l'écrivant, et ses phrases en
reprennent les formes. Sa première mesure, avant l'extension, donnait déjà
91,4 % : c'est la preuve qu'il était biaisé dès le départ, parce qu'un corpus
réellement indépendant aurait donné un chiffre bas, comme le corpus de
développement l'a fait (30 % à sa première mesure).

**Le seul chiffre qui mesurera le français spontané viendra de quelqu'un
d'autre.** L'usage réel observé est à **0 séance**, et aucune des quatre
mesures ci-dessus ne peut le remplacer.

### Les trois phrases du corpus gelé qui restent refusées

- « Place la valeur 7 dans largeur. » — la table a `Place {entier} dans {nom}`,
  pas `Place la valeur {entier} dans {nom}` ;
- « Attribue 7 à largeur. » — verbe absent de la table ;
- « Écrase largeur avec 7. » — forme absente de la table.

**Je ne les ai pas ajoutées**, et c'est délibéré : les ajouter reviendrait à
enrichir la table depuis le corpus de validation, et il cesserait de mesurer
quoi que ce soit. Elles iront dans le corpus de développement d'un prochain
lot.

### Le corpus historique du lot S4

Inchangé, comme demandé. Sa relecture donne maintenant :

| Classe | Lot S4 | Lot S5 |
|---|---|---|
| reconnues au sens attendu | 38 | 38 |
| **gagnées**, sens vérifié un par un | — | **18** |
| claires mais refusées | 43 | **25** |
| incomplètes, refusées | 10 | 10 |
| ambiguïtés détectées | 3 | 3 |
| **erreurs de sens** | **0** | **0** |
| **acceptées à tort** | **0** | **0** |

Le corpus dérivé du catalogue passe de 240 à **249 phrases**, toujours 0
refusée et 2 ambiguës, et la borne de 4 substitutions reste celle qui ne perd
rien.

## 7. L'arbitre devient un paramètre

`normaliser` prend désormais un **arbitre** : une fonction qui juge une phrase
candidate et rend son *sens*. Par défaut, `ARBITRE_C17`, bâti sur `translate`.

Deux conséquences :

- la couche ne dépend plus de `TranslationResult` dans sa logique : elle
  travaille sur des phrases et des clés de sens. C'est ce que « indépendante du
  langage cible » veut dire ;
- un second arbitre — catalogue partagé **puis** catalogue natif Python —
  rendra les reformulations utilisables en Python. **Ce n'est pas fait** : la
  lacune annoncée au lot P4 reste ouverte, et elle est maintenant à un
  paramètre près.

## 8. Mesures

| Mesure | Résultat |
|---|---|
| tests Node | **4 269**, dont 154 nouveaux pour les reformulations |
| différentiel contre le lot P4 | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |
| reformulations | **98**, aucune morte, aucune au gabarit faux |
| mode strict | **138 phrases du catalogue** traversent sans une réécriture |

Le mode strict est vérifié phrase par phrase : pour chacune des 138
formulations du catalogue, le verdict doit être `strict` et la phrase
canonique doit être **la phrase elle-même**. La couche ne touche à rien de ce
que le moteur accepte déjà.

## 9. Ce qui n'est pas fait, et les questions ouvertes

- **Les reformulations ne s'appliquent pas au catalogue Python.** Un
  paramètre d'arbitre suffit ; le lot ne l'a pas posé pour ne pas mêler deux
  mesures.
- **Aucune mesure sur du français écrit par quelqu'un d'autre.** C'est la
  limite qui compte, et aucun des quatre corpus ne la franchit.
- **Trois formes du corpus gelé restent refusées**, volontairement.
- **L'hôte ne montre pas le genre de la reformulation.** Le verdict porte
  désormais `genre` — ordre, synonyme, forme courte, affectation,
  composition —, et l'invite de saisie n'en dit rien. Une information du
  type « C-A a lu votre phrase comme un changement d'ordre » aiderait peut-être
  l'étudiant à comprendre ce qui a été reconnu. C'est une question
  pédagogique, et je ne la tranche pas.

### Une question que je laisse au fondateur

**`Ajoute 1 à compteur.` est la seule reformulation qui COMPOSE.** Elle produit
`Affecte à compteur le résultat de "compteur + 1".` : la cible apparaît
**deux fois** dans la phrase canonique, alors qu'elle n'apparaît qu'une fois
dans la phrase libre.

Rien n'est inventé — la cible et l'opérande sont tous les deux écrits —, et
c'est pourquoi je l'ai livrée. Mais c'est la frontière, et `Incrémente
compteur.` est de l'autre côté : le pas n'y est pas écrit, donc elle reste
refusée. Si cette frontière doit bouger, c'est une décision pédagogique, pas
une décision technique.
