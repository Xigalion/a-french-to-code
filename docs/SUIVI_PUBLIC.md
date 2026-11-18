# Suivre les tickets et les contributions publiques

**Pour qui :** celui qui tient le dépôt public. Une commande, un rythme, et
un classement décidé d'avance.

> Le dépôt est public depuis le 17 novembre 2026 :
> **https://github.com/Xigalion/a-french-to-code**
>
> Un dépôt public sans suivi est pire qu'un dépôt privé : il promet une
> écoute qu'il ne tient pas. Ce document existe pour que la promesse soit
> petite et tenue.

---

## 1. Le geste, deux fois par semaine

    node scripts/suivi-public.mjs            # ce qui attend une réponse
    node scripts/suivi-public.mjs --tout     # avec les tickets fermés et les forks

Lecture seule, API publique, **aucun jeton nécessaire** — 60 requêtes par
heure suffisent. `GITHUB_TOKEN` est utilisé s'il existe, jamais affiché.

Le script imprime : l'état du dépôt, les tickets et contributions ouverts avec
leur âge, les étiquettes manquantes, le classement à appliquer, et ce qui
reste à faire côté GitHub.

**Deux fois par semaine suffit.** Un ticket sans réponse pendant dix jours
coûte plus qu'un ticket mal répondu en trois : ce qu'un rapporteur retient,
c'est d'avoir été lu.

## 2. Les quatre étiquettes à créer — sinon le classement est perdu

GitHub applique l'étiquette demandée par un formulaire **seulement si elle
existe déjà**. Sans ces quatre-là, les tickets arrivent nus, en silence.

| Étiquette | Couleur | Description |
|---|---|---|
| `refus` | `#5319e7` | Un refus que le message n'a pas suffi à expliquer |
| `pédagogie` | `#0075ca` | Un message à revoir, pas un défaut du moteur |
| `moteur` | `#d73a4a` | Un C produit faux, mal formé ou mal placé |
| `périmètre` | `#c2e0c6` | Une formulation absente du catalogue, volontairement ou non |

Dans l'interface : **Issues → Labels → New label**, quatre fois. Ou, si
`gh` est installé un jour :

    gh label create refus      --color 5319e7 --description "Un refus que le message n'a pas suffi a expliquer"
    gh label create pédagogie  --color 0075ca --description "Un message a revoir, pas un defaut du moteur"
    gh label create moteur     --color d73a4a --description "Un C produit faux, mal forme ou mal place"
    gh label create périmètre  --color c2e0c6 --description "Une formulation absente du catalogue"

`node scripts/suivi-public.mjs` vérifie leur présence à chaque passage.

## 3. Classer avant de répondre

Le classement est **celui du protocole d'observation**
(`docs/TEST_PROTOCOLE_OBSERVATION.md` §4), et il ne change pas parce que le
rapport vient d'un inconnu. Trois questions, chacune outillée :

    grep -n "<un morceau de la phrase>" docs/CATALOGUE.md
    node scripts/rejouer.mjs "<la phrase exacte>"
    node scripts/rejouer.mjs --dans-main "<la phrase exacte>"

| Constat | Catégorie | Étiquette | Suite |
|---|---|---|---|
| la phrase est au catalogue et `rejouer.mjs` la refuse | **défaut du moteur** | `moteur` | test de reproduction **écrit d'abord**, puis un lot nommé |
| `rejouer.mjs` l'accepte, mais VS Code a montré autre chose | **défaut de l'hôte** | `moteur` | reproduire dans `test/vscode/suite.cjs`, chercher la **cause** |
| hors catalogue, mais une phrase du catalogue fait la chose | **erreur de formulation** | `refus` | montrer la phrase ; **compter** les récidives |
| hors catalogue, et rien ne la fait | **limitation volontaire** | `périmètre` | aucune correction ; vérifier qu'elle est dans `LIMITES_CONNUES.md` |
| le refus est juste, mais incompris après lecture | **incompréhension pédagogique** | `pédagogie` | proposer une reformulation, **ne pas la livrer seul** |
| C-A a accepté, le compilateur a refusé | **limitation volontaire** | `périmètre` | c'est déclaré et testé ; **compter** les occurrences |

**Deux seuils, posés d'avance** — ils évitent de décider au cas par cas :

1. **trois rapporteurs différents inventent la même phrase** → ce n'est plus
   une erreur de formulation : la phrase du catalogue n'est pas trouvable, et
   le ticket devient `pédagogie` ;
2. **le cas « C-A accepte, GCC refuse » revient souvent** → ce n'est plus une
   limitation : c'est une question de périmètre pour le fondateur.

## 4. Répondre : court, factuel, sans promesse

Trois réponses couvrent presque tout. Les écrire courtes n'est pas de la
sécheresse : une réponse longue promet une attention qui ne durera pas.

**Hors catalogue, mais faisable.** « Cette formulation n'est pas au
catalogue, et C-A refuse par construction tout ce qui n'y figure pas. La
phrase qui fait cela est : *…* (`docs/CATALOGUE.md`, domaine *n*). »

**Limitation volontaire.** « C'est une limite assumée, documentée dans
`docs/LIMITES_CONNUES.md` §*n*. Contournement : *…*. Elle ne sera pas levée
sans une décision de périmètre. »

**Défaut du moteur.** « Reproduit. Un test est écrit avant la correction, et
la correction viendra dans un lot nommé, avec son contrat et son
différentiel. Pas de date. »

Et la phrase à ne jamais écrire : **« ce sera corrigé dans la prochaine
version »**. Rien dans ce projet n'a de date, et l'annoncer serait la
première promesse non tenue.

## 5. Les contributions

Une contribution se lit **dans l'ordre de `CONTRIBUTING.md` §3**, et la
première question n'est pas le code :

1. la **lacune est-elle démontrée** ? Un programme qu'on ne peut pas écrire,
   un refus injusté — pas une idée ;
2. le **contrat** est-il écrit : formulations exactes, sorties exactes,
   diagnostics avec leurs plages, **et ce que le lot n'ajoute pas** ;
3. les **tests** sont-ils là, et le **différentiel** joint ?
4. `npm run check` et `npm run test:vscode` passent-ils ?

Refusé d'avance, et le dire tôt est une politesse : une dépendance
d'exécution, un `import vscode` dans `src/`, une correction silencieuse d'une
phrase, une insertion sans confirmation, la régénération d'un instantané gelé
pour faire passer un test, une fonctionnalité sans lacune démontrée, et toute
forme d'IA ou de complétion.

Ce que le fondateur seul décide : la vision, les principes pédagogiques, le
périmètre des versions, les paliers de liberté et les arbitrages
d'architecture. Une proposition qui y touche **se discute avant d'être
écrite**.

## 6. Ce que le suivi compte, et ce qu'il ne mélange pas

| Compté | Où | Attendu |
|---|---|---|
| tickets par catégorie (les 4) | ce document, à la main | la répartition est le résultat |
| récidives d'une même phrase inventée | idem | seuil : 3 rapporteurs |
| occurrences de « accepté par C-A, refusé par GCC » | idem | seuil : « souvent » → question de périmètre |
| contributions reçues, et ce qui les a bloquées | idem | aucune attente |

**Les tickets publics ne sont pas des séances observées.** Le compteur
`usageReel` de `test-utilisateur/etat.json` reste à **0 / 10** jusqu'à une
vraie séance encadrée : un ticket dit ce qui a bloqué quelqu'un, pas comment
il a travaillé. Les mélanger gonflerait un chiffre sans rien apprendre.

Et les scores des campagnes ne bougent pas, jamais, pour aucun ticket.

## 7. Ce qui reste à faire côté GitHub

Le script le répète à chaque passage tant que ce n'est pas fait :

- **créer les quatre étiquettes** (§2) ;
- **ajouter des sujets** au dépôt — sans eux il est introuvable par
  recherche : `c`, `c17`, `vscode-extension`, `pedagogy`, `french`,
  `typescript`, `education` ;
- **désactiver l'onglet Projects**, actif et non suivi (Settings → General →
  Features) ;
- **publier la release `v0.4.0`** si elle est encore en brouillon : sans
  elle, le `.vsix` n'est pas téléchargeable
  (`docs/PUBLICATION.md` §4.3).
