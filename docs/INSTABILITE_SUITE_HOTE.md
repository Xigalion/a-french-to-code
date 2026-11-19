# L'instabilité de la suite hôte — observée, pas expliquée

**19 novembre 2026.** Ce document existe pour qu'un chiffre de la suite hôte
ne soit pas lu comme plus solide qu'il ne l'est. **Son origine n'est pas
établie**, et rien ici ne prétend le contraire.

Aucune campagne de développement n'est ouverte pour ce seul problème : c'est
une décision du fondateur du 19 novembre 2026, et elle est juste — le produit
n'est pas en cause, et courir après un phénomène intermittent coûterait plus
que ce qu'il apprendrait.

---

## 1. Ce qui est observé

La suite hôte compte **130 scénarios**. Sur les passages du 19 novembre 2026 :

| Passage | Contexte | Résultat |
|---|---|---|
| 1 | paquet 0.7.0 installé, VS Code 1.138.0 | **103 / 130** |
| 2 à 6 | **le même binaire, sans aucune modification** | **130 / 130**, cinq fois |
| 7, 8 | dossier d'extensions **neuf** | **130 / 130** |
| 9 | VS Code **1.96.4**, version minimale | **130 / 130** |
| 10, 11 | paquet **téléchargé depuis la release** | **130 / 130** |

Le même phénomène avait été vu la veille, lors de la vérification de la
0.6.0 : **1**, puis **26**, puis **0** échec sur 121, à binaire identique.

## 2. La signature des échecs

Deux familles, et aucune n'est un refus du moteur :

- des **assertions sur le contenu du document** — le texte attendu n'y est pas,
  ou le texte d'un scénario précédent y est encore ;
- des **dépassements de délai**, notamment sur l'attente « annulation en une
  fois ».

Autrement dit : les scénarios échouent sur l'**état de l'éditeur**, pas sur ce
que le moteur traduit. C'est pourquoi le produit n'est pas en cause — le même
paquet passe 130/130 au passage suivant.

## 3. Ce qui a été corrigé, et qui a réduit la fréquence sans la supprimer

Le dossier de travail et le profil de VS Code étaient **réutilisés** d'un
passage à l'autre : un passage laissait environ 130 fichiers derrière lui, et
`files.hotExit` n'était pas désarmé — un éditeur non enregistré pouvait donc
porter le texte d'un passage dans le suivant.

`scripts/test-vscode.mjs` repart désormais de rien à chaque passage, et
`files.hotExit` est à `off`. **La causalité n'a jamais été prouvée** : c'était
de l'hygiène, pas une théorie, et le phénomène a reparu après.

## 4. Deux hypothèses testées, deux réfutées

| Hypothèse | Épreuve | Verdict |
|---|---|---|
| `code --install-extension` laisse un processus VS Code qui entre en concurrence | comptage des processus `Code` avant et après une installation | **réfutée** : 48 avant, 48 après, et 48 trois secondes plus tard |
| le **premier** passage contre un dossier d'extensions neuf échoue, VS Code devant construire son cache | dossier neuf, puis deux passages consécutifs | **réfutée** : le premier passage donne 130/130 |

Une troisième piste n'a **pas** été instruite, et elle est nommée pour qui
reprendra : la machine fait tourner **48 processus `Code`** appartenant à
l'éditeur de l'utilisateur pendant toute la mesure. La concurrence pour les
mêmes ressources — disque, mutex d'extension, ordonnanceur — reste plausible
et n'est pas écartée. Elle n'est pas non plus établie.

## 5. Ce que cela change pour la lecture des chiffres

**Les 130/130 annoncés sont exacts** : chacun a été observé. Mais :

> **Un chiffre juste obtenu sur un harnais intermittent ne garantit pas la
> reproductibilité.**

C'est la formulation retenue, et elle vaut aussi pour les campagnes
antérieures : les 121/121 de la 0.6.0 et les 114/114 de la 0.5.0 ont été
obtenus sur le même harnais. Ils ne sont pas faux ; ils sont **moins solides
qu'un chiffre déterministe**.

Ce qu'un échec isolé ne permet **pas** de conclure : ni qu'une régression
existe, ni qu'il n'en existe pas. Il faut relancer, et c'est tout ce que l'on
peut dire aujourd'hui.

## 6. La règle de conduite retenue

1. **ne pas réessayer automatiquement.** Un harnais qui masque ses échecs par
   une reprise silencieuse ne protège plus de rien : c'est précisément ce que
   ce projet a écrit vouloir éviter ;
2. **un échec se consigne**, puis se relance à la main. Si le second passage
   est au vert, le résultat retenu est « au vert, après un échec non
   reproduit », et non « au vert » ;
3. **aucune campagne pour ce seul problème**, sur décision du fondateur ;
4. si le phénomène devient **fréquent ou reproductible**, il change de nature
   et mérite alors son propre lot — pas avant.

## 7. Ce que ce document ne dit pas

Il ne dit pas que la cause est connue. Il ne dit pas que c'est la faute de
l'éditeur de l'utilisateur, ni de VS Code, ni du système. Il dit ce qui a été
**vu**, ce qui a été **essayé**, et ce qui reste **ouvert**.

*Chantier n° 3 du projet — « qualification des avertissements de l'hôte
VS Code » — toujours ouvert, et désormais documenté avec ses mesures.*
