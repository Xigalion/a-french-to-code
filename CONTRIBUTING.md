# Contribuer à C-A

Merci de l'intérêt. Ce projet a des **contraintes permanentes** qui passent
avant toute fonctionnalité : une contribution qui les enfreint sera refusée,
même si elle est utile et bien écrite. Les lire d'abord fait gagner du temps
aux deux côtés.

---

## 1. Les neuf règles non négociables

1. **Le code source est la référence.** L'utilisateur lit, modifie et compile
   le C produit.
2. **Traçabilité.** Chaque fragment inséré porte au-dessus un commentaire
   `//` contenant **exactement** la phrase française.
3. **Aucun ajout implicite.** Pas de `main`, `return`, `#include`, variable,
   initialisation, progression ni format d'affichage non demandé.
4. **Refus explicites.** Une demande incomplète, ambiguë ou hors périmètre ne
   produit **aucun** fragment partiel.
5. **Diagnostic ≠ correction.** Expliquer l'erreur, pas la réparer, et ne pas
   fournir systématiquement la formulation correcte à recopier.
6. **Traduction valide ≠ programme sûr.** L'absence d'avertissement n'est
   jamais un certificat de sûreté ni de terminaison.
7. **Préservation de l'historique.** Une nouveauté ne supprime ni ne modifie
   silencieusement une formulation historique valide.
8. **Contrôle de l'utilisateur.** Aperçu, puis confirmation, puis insertion.
   Jamais de modification automatique du document.
9. **Ne jamais modifier une portion de code que l'utilisateur n'a pas
   explicitement autorisé C-A à modifier.**

## 2. Ce qui est refusé d'avance

| Proposition | Pourquoi elle est refusée |
|---|---|
| ajouter une dépendance d'exécution | le projet n'a **que** `typescript` et `@types/vscode`, en développement. Zéro dépendance d'exécution. |
| importer `vscode` depuis `src/` | le moteur est pur, déterministe, sans E/S. L'hôte est seul à connaître l'éditeur. |
| « corriger » une phrase, deviner un nom, compléter une valeur | règles 3 et 5. Un refus qui explique vaut mieux qu'une devinette juste. |
| insérer sans confirmation, ou modifier une autre ligne | règles 8 et 9. |
| régénérer un instantané gelé pour faire passer un test | `test/lot*-compatibility.json` sont figés. Un écart est une **régression**, pas un instantané périmé. |
| une fonctionnalité sans lacune démontrée | le projet avance par lacunes observées, pas par idées. Montrer d'abord le programme qu'on ne peut pas écrire. |
| de l'IA, une complétion, une suggestion automatique | hors périmètre du modèle 1, et contraire à la règle 5. |

## 3. Comment une capacité s'ajoute

Le travail avance par **lots**. Un lot livre une capacité, pas une idée.

1. **Montrer la lacune.** Un programme qu'on ne peut pas écrire avec le
   catalogue actuel, ou un refus injustifié. Un journal, une sortie, un
   diagnostic : du constat, pas une impression.
2. **Écrire le contrat** (`docs/LOT{n}_CONTRAT_PROPOSE.md`) : formulations
   exactes, sorties C exactes, diagnostics avec leurs plages UTF-16,
   placement, limites explicites, plan de tests. Dire aussi **ce que le lot
   n'ajoute pas**.
3. **Implémenter**, avec tests d'exactitude, de diagnostics, de limites, de
   non-régression et d'intégration hôte.
4. **Prouver l'absence de régression** avec le différentiel :

       node scripts/differentiel.mjs <référence git> \
         --extensions "<motif des entrées nouvelles>" --no-loss --all

   Une extension peut transformer un refus ; **jamais** retirer une capacité.
   Étendre le corpus du différentiel aux formes nouvelles : sinon il prouve
   l'absence de régression sans couvrir ce que le lot livre.
5. **Écrire le bilan** (`docs/LOT{n}_BILAN.md`) avec les **chiffres réels**,
   et mettre à jour `docs/CATALOGUE.md` et `docs/ETAT_DU_PROJET.md`.

**Ne jamais supposer qu'un contrat est implémenté, ni qu'un test a été
exécuté sans résultat affiché.**

## 4. Avant d'ouvrir une pull request

```sh
npm run check        # typecheck + 3 834 tests Node — tout au vert
npm run test:vscode  # suite hôte, 99 tests, instance isolée
```

Puis, selon ce que la contribution touche :

```sh
node scripts/differentiel.mjs <ref> --extensions "<motif>" --no-loss
node --experimental-strip-types test-utilisateur/generer.mjs    # les énoncés tiennent-ils ?
node --experimental-strip-types exercice/promotion/generer.mjs  # l'exercice de clôture ?
node scripts/anonymiser.mjs   # aucun chemin personnel dans les journaux
```

## 5. Conventions de code

- TypeScript strict, `verbatimModuleSyntax`, imports avec extension `.ts`.
- Aucun `any` non justifié ; `unknown` plus garde de type aux frontières.
- Commentaires de code **en anglais** dans `src/`, concis, expliquant
  *pourquoi* — une contrainte, une limite volontaire — jamais *quoi*.
- Messages utilisateur, diagnostics et documentation **en français**, avec
  apostrophes typographiques (`’`).
- Fonctions pures autant que possible ; pas d'état global mutable.
- Toute position est un **intervalle UTF-16 semi-ouvert `[début, fin)`**
  relatif à la source d'origine, sans normalisation Unicode.

## 6. Commits et historique

- un commit par lot ou par étape documentaire ; message **en français**, à
  l'impératif, préfixé du lot concerné ;
- jamais de `--no-verify`, jamais de réécriture d'un historique poussé ;
- ne pas committer de binaire, de journal de travail, ni de chemin absolu
  contenant un nom d'utilisateur.

## 7. Signaler un problème sans contribuer de code

C'est utile, et souvent plus utile. Trois formulaires :

- **refus incompris** — une phrase refusée dont le message ne vous a pas
  suffi ;
- **C produit inattendu** — une phrase acceptée dont le C surprend ;
- **formulation manquante** — un programme que le catalogue ne permet pas
  d'écrire.

Dans les trois cas : la **phrase exacte**, le **code du diagnostic**, la
version de C-A et de VS Code. Une phrase recopiée « au propre » perd
l'information qu'elle portait.

## 8. Licence des contributions

Le projet est sous **Apache License 2.0** (`LICENSE`). En proposant une
contribution, tu acceptes qu'elle soit distribuée sous cette même licence,
avec la clause de brevet qu'elle comporte. Conserve les mentions de
paternité existantes et signale tes modifications, comme la licence le
demande.

## 9. Ce que le fondateur seul décide

La vision, les principes pédagogiques, le périmètre des versions, les
**paliers de liberté** et les arbitrages d'architecture. Une
proposition qui touche à l'un de ces points se discute **avant** d'être
écrite : c'est une question, pas une pull request.
