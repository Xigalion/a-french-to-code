# Lot 22 — Fichiers et flux — contrat et bilan

**Contrat rédigé puis exécuté le 15 novembre 2026**, en autonomie. Première
moitié du **domaine 7, « Fichiers et modularité »**.

Chiffres réels : **3 416 tests Node réussis, 0 échec** (3 357 au lot 21).
**1 333 121 comparaisons différentielles**, **387 extensions**, **0
régression**, **0 capacité perdue**. **97 tests hôte non exécutés.**

---

## 1. Contrat

| Formulation française | Code C produit |
|---|---|
| `Déclare un fichier nommé f.` | `FILE *f;` |
| `Affecte à f l'ouverture du fichier "donnees.txt" en lecture.` | `f = fopen("donnees.txt", "r");` |
| `Ferme le fichier f.` | `fclose(f);` |
| `Écris le texte "bonjour" dans le fichier f.` | `fprintf(f, "%s", "bonjour");` |
| `Écris la valeur de x dans le fichier f.` | `fprintf(f, "%d", x);` |
| `Lis un entier depuis le fichier f dans x.` | `fscanf(f, "%d", &x);` |
| `Crée un bloc si la fin du fichier f est atteinte.` | `if (feof(f)) { … }` |

Six modes : `lecture`, `écriture`, `ajout`, chacun suivi ou non de
`binaire`, soit `r`, `w`, `a`, `rb`, `wb`, `ab`. Les modes de mise à jour
`r+`, `w+`, `a+` sont **volontairement absents** : ils demandent une
discipline de positionnement qu'aucune formulation d'ici n'enseigne.

Le déclarateur suit la convention **D2** du lot 17 : `FILE *f`, jamais
`FILE* f`.

**L'adresse est écrite dans la lecture.** `fscanf(f, "%d", &x)` montre le
`&` : c'est la leçon, pas un détail d'implémentation.

Les chemins et les textes écrits passent par le **scanner de texte partagé
du lot 16** : même grammaire, mêmes échappements, mêmes refus. Un chemin
peut contenir des espaces, raison pour laquelle il est lu depuis la source
brute et non depuis les mots.

---

## 2. Une collision d'ordre, traitée explicitement

`Crée un bloc si la fin du fichier f est atteinte.` partage ses quatre
premiers mots avec l'enveloppe de condition du lot 9, qui est sélectionnée
très tôt dans `translate`.

L'aiguillage des fichiers est donc placé **avant** la branche `IF`, et
seulement à cause d'elle. Le module décline toute phrase qui ne porte pas
ses sept préfixes, donc rien d'autre ne bouge. Un test vérifie que les
**trois** formes coexistent et que les diagnostics historiques de
l'enveloppe de condition (`MISSING_CONDITION_DELIMITER`,
`MISSING_CONDITION`, `UNEXPECTED_TEXT`) sont intacts.

---

## 3. Informations pédagogiques

| Code | Déclenchement | Fait énoncé |
|---|---|---|
| `FOPEN_CAN_FAIL` | ouverture | `fopen` renvoie `NULL` ; **C-A n'ajoute aucun test** et nomme la phrase à écrire |
| `FILE_MODE_MEANING` | ouverture | `r` échoue si absent, `w` **efface**, `a` écrit à la fin, `b` ne traduit pas les fins de ligne |
| `FILE_MUST_BE_CLOSED` | déclaration et fermeture | sans fermeture, des données peuvent rester dans le tampon et ne jamais atteindre le fichier |
| `SCANF_NEEDS_ADDRESS` | lecture | le `&` donne l'adresse où écrire ; la valeur renvoyée dit combien de conversions ont réussi, et **C-A ne la teste pas** |
| `EOF_AFTER_READ` | fin de fichier | `feof` **ne regarde pas devant** : le tester avant de lire fait lire une fois de trop |

`EOF_AFTER_READ` corrige l'erreur la plus répandue du domaine, et
`FILE_MODE_MEANING` dit que `w` efface — deux faits qu'un étudiant ne peut
pas deviner du code produit.

---

## 4. Fichiers

**Créés** : `src/fileInstructions.ts`, `test/files.test.mjs` (59 tests),
ce document.

**Modifiés** : `src/translate.ts` (union, deux codes, sept rendus,
`BLOCK_KINDS`, aiguillage remonté), `src/pedagogicalInformation.ts`,
`scripts/differentiel.mjs`, `package.json`, `docs/CATALOGUE.md`,
`CLAUDE.md`.

**Non modifiés** : `expressionCore.ts` et les quatre profils,
`planPlacement.ts`, tous les reconnaisseurs contextuels, `stringLiteral.ts`
(réutilisé tel quel), les instantanés de compatibilité, et tout
`extension/`. **Aucun test historique adapté**, et **aucune capacité du
noyau modifiée** — le troisième lot de suite dans ce cas.

---

## 5. Limites connues

- Ni `fgets`, ni `fputs`, ni `fgetc`/`fputc`, ni `fread`/`fwrite`, ni
  `fseek`/`ftell`/`rewind`, ni `fflush`, ni `remove`/`rename`.
- Ni lecture de flottant, de caractère ou de chaîne : seul l'entier.
- Ni `stdin`, `stdout`, `stderr` nommés explicitement.
- Ni `errno`, ni `perror`, ni `ferror`.
- Aucun mode de mise à jour.
- `stdio.h` n'est **jamais ajouté** : `FILE`, `fopen`, `fprintf` et `feof`
  en dépendent, et c'est à l'étudiant de l'inclure. Deux tests le fixent.
- **Aucune vérification de flux, de chemin ni d'ordre.** Écrire dans un
  flux jamais ouvert est traduit ; fermer deux fois est traduit deux fois ;
  un chemin vide est traduit. Trois tests fixent ce comportement réel.

Héritées : recette GCC du domaine 2 ; recettes manuelles des domaines 3 et
4 et du lot 10 ; qualification mutex/N-API ; **97 tests hôte non
exécutés** ; message `UNSUPPORTED_HEADER` sous-estimé (lot 21 §2) ;
exercice intégrateur final.
