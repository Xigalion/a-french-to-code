# Lot P4a — Python dans l'éditeur

Contrat et bilan dans le même document. L'intégration à l'éditeur était
demandée explicitement ; elle a trouvé **deux défauts réels** dans le
placement indenté, et c'est le meilleur argument pour l'avoir faite
maintenant.

Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Ce que le lot livre

| Livrable | Où |
|---|---|
| session de traduction Python, **distincte** de celle du C | `extension/src/sessionPython.ts` |
| contrat commun que les deux sessions satisfont | `SessionControleur`, dans `extension/src/session.ts` |
| choix du langage **par l'extension du fichier** | `CIBLES` dans `extension/src/extension.ts` |
| réglage `c-a.python`, **désactivé par défaut** | `extension/package.json` |
| nouvelle étape de diagnostic `rendu` | le langage cible refuse, et le dit |
| 16 tests de session + 5 scénarios hôte | `test/sessionPython.test.mjs`, `test/vscode/suite.cjs` |

## 2. Pourquoi Python est derrière un réglage

Ce n'est pas de la prudence de façade. Le catalogue Python compte **32
intentions portées et zéro intention native** : il ne sait pas créer une
liste, ni parcourir une séquence, ni lire une saisie. Un étudiant qui
ouvrirait un `.py` sans le savoir apprendrait un Python infirme, et il
conclurait que le langage ne sait pas faire ce que C-A ne sait pas encore
dire.

Le réglage existe donc pour que Python soit **essayable**, pas pour qu'il soit
rencontré par accident. La description du réglage dit exactement ce qui
manque. C'est la même logique que le mode souple du lot S4, et pour la même
raison : une capacité incomplète s'offre, elle ne s'impose pas.

## 3. Deux sessions, un contrat, zéro unification

La décision 2 du socle dit que les deux placements ne sont pas unifiés. La
conséquence à l'hôte est que les deux **sessions** ne le sont pas non plus.
Ce qu'elles partagent est un contrat, `SessionControleur`, qui énumère ce que
l'IHM appelle — et rien de plus. Les deux classes le satisfont
**structurellement**, sans héritage et sans se connaître.

L'IHM, elle, n'a pas été dupliquée : 400 lignes de VS Code valent mieux une
fois qu'en deux exemplaires qui divergeront.

### Ce que la session Python fait différemment, et pourquoi

| Point | Session C17 | Session Python |
|---|---|---|
| rendu | `translate` écrit le C | `rendre(PYTHON, …)`, qui peut **refuser** |
| étapes de diagnostic | traduction, placement, intégration, variantes | **plus** `rendu` |
| avis de calcul | 2 codes, règles de C17 | **aucun** : ceux de C17 seraient faux |
| informations passives | 67 codes C | 7 codes `PY_*` |
| cible contextuelle montrée | chaîne `if`, boucle, fonction | **aucune** : l'indentation de la ligne est déjà visible |
| fraîcheur | `validatePlan` | **replanification** et comparaison de l'édition |

**Aucun avis de calcul en Python, et c'est un refus réfléchi.** Les deux avis
du lot 8 énoncent des règles de C17 : la division entière de deux entiers, le
modulo flottant. Les répéter en Python serait enseigner du faux. Un test le
vérifie sur la phrase même qui produit deux avertissements en C.

## 4. Deux défauts réels, trouvés par l'intégration

Ni l'un ni l'autre n'était visible depuis les 18 tests du lot P2, qui
travaillaient tous sur des documents en LF et un pas de 4.

### Les fins de ligne

`planifierPython` joignait ses lignes avec `'\n'`, sans regarder le document.
Dans un fichier CRLF — et sur Windows, **un fichier vide s'ouvre en CRLF** —
l'insertion aurait mélangé les fins de ligne. La demande porte désormais
`eol`, le découpage tolère un CR final, et le curseur d'un en-tête compte la
fin de ligne réelle.

Le scénario hôte a d'ailleurs échoué sur **mon** attente, pas sur le moteur :
j'avais écrit LF, le document était en CRLF, et le placement corrigé avait
raison. L'attente a été corrigée.

### Le pas d'indentation

`PAS` valait 4 en dur. Un éditeur réglé sur 2 espaces voyait donc toutes ses
lignes refusées par `INDENTATION_INCONNUE` — un refus devant un réglage
parfaitement légitime, puisque Python n'impose aucun pas (PEP 8 *recommande*
4). Le pas vient maintenant de l'éditeur, et un test vérifie qu'une
indentation de 2 est **respectée, pas corrigée**.

### Et un refus que le lot assume

Une indentation par **tabulations** est refusée, avec
`INDENT_UNIT_NOT_SPACES`. Python interdit de mélanger espaces et tabulations,
et déduire une largeur de tabulation serait inventer une information que
l'éditeur ne donne pas. Le message dit quoi régler ; il ne règle rien.

## 5. La traçabilité, en syntaxe Python

Le commentaire est écrit par le **langage** : `commentaire: (phrase) => '# ' + phrase`
est un champ du registre, et l'hôte n'a pas à connaître la syntaxe des
commentaires de ses langages cibles. C17 garde `// `.

Le mode souple fonctionne aussi en Python, et il y conserve la même
propriété : `Afficher la valeur de age.` est normalisée en
`Affiche la valeur de age.`, le Python produit est `print(age, end="")`, et le
commentaire porte **la phrase de l'utilisateur**.

## 6. Mesures

| Mesure | Résultat |
|---|---|
| tests Node | **4 048**, dont 16 nouveaux pour la session Python |
| tests hôte VS Code | **109 réussis, 0 échec** (VS Code 1.138.0), dont 5 nouveaux |
| différentiel contre le lot précédent | **1 335 559 comparaisons, 0 régression, 0 extension, 0 capacité perdue** |
| typecheck | vert, moteur et extension |

Le scénario hôte qui compte le plus est le dernier : **un `.c` continue de
fonctionner quand Python est actif**. Les 104 scénarios antérieurs passent
inchangés, et aucun n'a été adapté — seules mes deux attentes neuves sur les
fins de ligne l'ont été.

## 7. Ce qui n'est pas fait

- **Aucune intention native.** C'est la limite qui compte, et c'est pourquoi
  le réglage est désactivé par défaut. `docs/phase2/CATALOGUE_NATIF_PYTHON_PROPOSE.md`
  propose les 55 formulations, et le jalon recommandé de 13 d'entre elles.
- **Aucun exercice dicté dans l'IHM réelle**, comme
  `docs/TEST_VSCODE_DICTEE.md` le fait pour le C. Il serait prématuré : le
  programme du lot P3 n'utilise aucune liste, faute de pouvoir en créer une.
- **Aucune vérification de symboles, de types ni de portées**, pas plus qu'en
  C17. Le Python produit peut être parfaitement invalide — un nom non défini,
  une indentation qui ne correspond à aucun bloc du programme réel. C-A
  vérifie la **forme** de la pose, pas la cohérence du programme.
- **Aucun essai hors Windows**, et aucun essai par un utilisateur.
- Le `.vsix` n'est pas refait : Python n'est pas destiné à la version
  publique, et `main` reste la V1 à l'étiquette `v0.4.0`.
