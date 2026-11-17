# Lot S4 — la souplesse linguistique dans l'éditeur

**Piste souplesse, étape 4 sur 4.** Contrat et bilan dans le même document :
le contrat a été écrit d'abord, la mesure ensuite, et rien n'a été réécrit
pour faire coïncider les deux.

> Ce lot **n'est pas** P3. P3 est le premier lot Python (les intentions
> communes). La souplesse est une piste séparée, comme la décision 6 du socle
> le demande, et elle n'attend aucune des douze décisions Python.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Ce que le lot livre

| Livrable | Où |
|---|---|
| mode souple **activable par l'utilisateur**, désactivé par défaut | réglage `c-a.souplesse`, commande « C-A : Activer ou désactiver le mode souple » |
| la phrase d'origine conservée dans le commentaire | `originalSentence` de `planPlacement` |
| la phrase canonique **montrée** avant l'aperçu | invite du champ de saisie, détail de « Insérer », titre de la confirmation, canal « C-A — Pédagogie » |
| refus d'ambiguïté dans l'éditeur | nouvelle étape de diagnostic `variantes` |
| corpus écrit à la main, **indépendant du catalogue** | `test-utilisateur/corpus/corpus-libre.json`, 94 phrases |
| mesure des cinq comptes demandés | `scripts/mesurer-corpus.mjs` → `docs/phase2/MESURES_CORPUS.md` |

## 2. Les quatre règles que le lot ne devait pas plier

1. **Le mode strict est la référence.** Une phrase du catalogue ne traverse
   jamais la couche : `lire()` appelle d'abord `translate`, et ne consulte le
   lexique **que** sur un refus. Un test le prouve en comparant, pour la même
   phrase, l'aperçu d'une session souple et celui d'une session stricte.
2. **Aucun comportement implicite.** Une normalisation invisible serait un
   comportement implicite, donc interdite par la règle 3. L'invite du champ de
   saisie annonce « C-A lit « … » » **avant** toute préparation d'aperçu, le
   titre de la confirmation porte « mode souple », et le canal Pédagogie en
   garde la trace.
3. **Le commentaire porte la phrase de l'utilisateur.** C'est la règle 2, et
   c'est la seule modification faite au moteur de placement : un paramètre
   optionnel `originalSentence`, refusé s'il contient un saut de ligne, et
   **enregistré dans le plan** pour que la revérification de fraîcheur
   reconstruise le même commentaire. Laissé absent, rien ne change.
4. **Un refus ne devient pas une correction.** Sur un refus que la couche ne
   résout pas, le diagnostic affiché est **celui du moteur strict**, mot pour
   mot : c'est lui qui nomme ce qui manque. La couche n'ajoute un message que
   pour une **ambiguïté**, qu'elle seule peut détecter, et ce message nomme
   les deux lectures sans en choisir une.

## 3. Mesures

| Mesure | Résultat |
|---|---|
| tests Node | **3 979**, dont 9 nouveaux sur la session souple et 96 sur le corpus |
| tests hôte VS Code | **104 réussis, 0 échec** (VS Code 1.138.0), dont 5 nouveaux |
| différentiel contre le lot P0 | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |

Le différentiel à zéro est la preuve attendue : le paramètre de placement est
optionnel, et par défaut il n'existe pas.

## 4. Le corpus écrit à la main, et ce qu'il mesure

Le corpus de `docs/phase2/MESURES_SOUPLESSE.md` est **dérivé du catalogue**
par substitution inverse. Il mesure la combinatoire du mécanisme, et il ne
peut rien dire du français spontané : chacune de ses phrases a été fabriquée
pour être reconnue. **Il ne doit jamais être présenté comme une validation du
français spontané.**

Le corpus de ce lot est écrit à la main, hors du catalogue et hors du lexique,
avec l'attente écrite **avant** la mesure. 94 phrases.

| Classe | Nombre |
|---|---|
| formulations naturelles reconnues, **au sens exact attendu** | **38 / 38** |
| **différences de sens introduites par erreur** | **0** |
| **instructions incorrectement acceptées** | **0** |
| ambiguïtés correctement détectées | **3 / 3** |
| formulations claires pour un humain, refusées par C-A | **43** |
| formulations incomplètes, refusées — refus correct | **10** |

**43 phrases sur 94 sont claires et refusées.** C'est le chiffre important, et
il dit que la souplesse actuelle couvre les **variantes morphologiques** d'une
phrase du catalogue, pas les **reformulations**. « Mettre 20 dans age. »,
« Renvoyer 0. », « Incrémenter compteur. », « Pour chaque note du tableau,
afficher la note. » sont refusées, et le resteront jusqu'à ce qu'une décision
de périmètre dise si ces formes appartiennent au palier 1 ou au palier 2.

**Limite à dire, et à ne pas oublier :** ce corpus est écrit par l'auteur de la
couche. Il est indépendant du catalogue et du mécanisme, **pas** du français
spontané d'un débutant. Seul l'indicateur 2b — l'usage réel observé, à
**0/10 séances** — mesure cela.

## 5. Deux attentes du corpus étaient fausses

La première mesure a signalé **deux** phrases « acceptées à tort » :

- `créer un entier nommé age de valeur 20` (sans point final) ;
- `CRÉER UN ENTIER NOMMÉ AGE DE VALEUR 20.`

Instruction faite : dans les deux cas, c'est le **moteur strict** qui accepte,
depuis le lot 1. Le point final est facultatif, et les mots fixes sont
comparés sans tenir compte de la casse — c'est écrit dans `sameWord`. La
couche de variantes n'y est pour rien : `Crée un entier nommé age de valeur 20`
et `CRÉE UN ENTIER NOMMÉ AGE DE VALEUR 20.` sont acceptées telles quelles.

**Ce sont mes attentes qui étaient fausses**, et elles ont été corrigées, avec
leur raison écrite dans le corpus. L'identifiant reste `AGE` : C-A ne
normalise pas un nom, et c'est volontaire.

## 6. Deux entrées ajoutées au lexique, et pourquoi elles n'en sont pas une concession

Le corpus a trouvé **deux infinitifs manquants** : `affecter` et `inclure`.
Leurs quatre frères — `créer`, `afficher`, `déclarer`, `retourner` — étaient
déjà au lexique ; leur absence était un oubli du prototype, pas une décision.
Ils sont ajoutés, avec le motif « trouvé par le corpus libre ».

Le lexique ne grandit **que** sur une formulation mesurée. Aucune entrée n'a
été ajoutée par symétrie ou par anticipation, et la garde du lot 30 appliquée
au lexique — toute entrée doit produire au moins une lecture valide — refuse
une entrée morte.

## 7. La borne de substitutions

Le corpus dérivé compte désormais **240 phrases** (le lexique a grandi de deux
entrées) : 238 résolues, 2 ambiguës, 0 refusée, 2 lectures candidates au
maximum. Les bornes mesurées :

| Borne | Résolues | Perdues |
|---|---|---|
| 1 | 167 | 71 |
| 2 | 223 | 15 |
| 3 | 236 | 2 |
| **4** | **238** | **0** |
| 5 | 238 | 0 |

La borne **4** est acceptée provisoirement par le fondateur. Au-delà, elle ne
gagne rien sur ce corpus : la relever serait une décision sans mesure.

## 8. Ce qui n'est pas fait, et dit comme tel

- La couche ne connaît **que** des substitutions de mots et de suites de mots.
  Elle ne réordonne rien, ne supprime rien, n'ajoute rien. « age vaut 20. » est
  hors de sa portée **par construction**, pas par oubli.
- Aucune mesure sur du français réellement spontané. 0/10 séances.
- Le mode souple n'a pas été essayé par un débutant, et la question de savoir
  s'il aide ou s'il brouille la règle « formulation précise » du palier 1 est
  une **question d'usage**. Elle reste ouverte.
- Le réglage est lu **une fois par session de saisie** : changer le mode
  pendant qu'un aperçu est préparé n'a aucun effet sur cet aperçu. C'est
  voulu — un aperçu confirmé doit valoir ce qu'il montrait.
