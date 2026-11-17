# Phase 2 — proposition de socle commun multilangage

**Pour qui :** le fondateur, pour valider ou refuser une architecture **avant**
qu'une ligne de migration soit écrite.

> Rien de cette proposition n'est implémenté. Les deux sondes
> (`experiences/python/`, `experiences/souplesse/`) existent pour l'étayer, et
> elles sont jetables.
>
> Date : 17 novembre 2026. Branche `phase-2-architecture`.

---

## 1. Le principe, et ce qu'il refuse

**Un langage cible est un enregistrement de capacités, pas une famille de
`if`.** Le projet a déjà fait ce choix une fois, au lot 13, pour les trois
profils d'expression : un enregistrement de capacités explicite, et un noyau
qui ne peut rien construire en dehors. Le socle multilangage applique le même
principe un niveau plus haut.

Ce que la proposition refuse, nommément :

| Refusé | Pourquoi |
|---|---|
| un rendu « générique » paramétré par des gabarits (`"{type} {nom} = {valeur};"`) | le C et le Python ne diffèrent pas par la ponctuation mais par les **concepts** ; un gabarit forcerait `n = 0` là où Python doit **refuser** |
| une intention « commune » qui se rend *toujours* | 24 intentions sur 84 n'ont **pas** d'équivalent Python : un langage doit pouvoir refuser |
| un plus petit dénominateur commun | il faudrait retirer au C ses pointeurs et sa mémoire, c'est-à-dire l'essentiel de ce qu'il enseigne |
| une couche d'abstraction « universelle » du placement | les accolades et l'indentation ne sont pas deux cas d'une même idée ; les mélanger produirait un module que personne ne peut lire |

## 2. L'architecture proposée

```
                    phrase française
                           │
        ┌──────────────────▼──────────────────┐
        │  COUCHE LINGUISTIQUE (commune)      │   lexique par langue
        │  mode strict, ou normalisation       │   → STRATEGIE_LINGUISTIQUE.md
        └──────────────────┬──────────────────┘
                           │  phrase canonique
        ┌──────────────────▼──────────────────┐
        │  ANALYSE (commune)                  │   5 745 − 198 lignes
        │  enveloppes françaises, noyau        │   déjà écrites
        │  d'expressions, 22 diagnostics       │
        │  de forme                            │
        └──────────────────┬──────────────────┘
                           │  AST d'intention
                           │  (déjà indépendant : prouvé)
        ┌──────────────────▼──────────────────┐
        │  REGISTRE DE LANGAGES               │   nouveau, ~150 lignes
        │  capacités : intentions portées,     │
        │  types, formats, portée, blocs       │
        └────┬───────────────────────┬─────────┘
             │                       │
   ┌─────────▼────────┐    ┌─────────▼────────┐
   │  C17             │    │  PYTHON          │
   │  rendu (198 l.)  │    │  rendu (~300 l.) │
   │  placement       │    │  placement par   │
   │  accolades       │    │  indentation     │
   │  67 informations │    │  ~35 informations│
   └─────────┬────────┘    └─────────┬────────┘
             └───────────┬───────────┘
                         │  fragment + plan d'insertion
        ┌────────────────▼────────────────────┐
        │  HÔTE VS CODE (commun, 634 lignes)  │   aperçu, confirmation,
        │  déjà indifférent au langage        │   édition unique annulable
        └─────────────────────────────────────┘
```

### 2.1 Ce qui existe déjà et ne bouge pas

L'analyse du français, le noyau d'expressions, les budgets, les intervalles
UTF-16, les 22 diagnostics de forme, l'hôte et tout le harnais. **Prouvé par
la sonde Python : elle rend du Python depuis l'AST sans modifier une ligne de
`src/`.**

### 2.2 Le registre de langages — le seul vrai composant nouveau

```ts
export type Langage = {
  readonly nom: 'c17' | 'python';
  readonly extensions: readonly string[];        // '.c' | '.py'
  /** Les intentions que ce langage PORTE. Toute autre est refusée, avec sa
   *  raison : c'est la pièce qui évite de forcer le C dans Python. */
  readonly portees: ReadonlyMap<string, RaisonOuRendu>;
  readonly types: ReadonlyMap<string, string>;   // 'int' -> 'int' | annotation
  readonly blocs: 'accolades' | 'indentation';
  readonly rendre: (instruction: Instruction) => Fragment | Refus;
  readonly placer: (document: string, curseur: number, instruction: Instruction) => Plan | Refus;
  readonly expliquer: (resultat: TranslationResult) => Information[];
};
```

Trois propriétés tiennent toute la proposition :

1. **une intention non portée est un refus nommé**, jamais un rendu
   approximatif. La sonde en produit déjà 47, avec leur raison ;
2. **`blocs` est une étiquette, pas une abstraction** : elle sélectionne
   l'implémentation de placement, elle ne tente pas de les unifier ;
3. **`rendre` et `placer` peuvent refuser**. Le socle n'a pas de chemin où un
   langage doit produire quelque chose qu'il ne sait pas dire.

### 2.3 Arborescence proposée

```
src/                      analyse, noyau, profils — inchangé, 0 trace de langage cible
src/langages/registre.ts  le registre et ses types
src/langages/c17/         rendu.ts, placement/, informations.ts, types.ts
src/langages/python/      rendu.ts, placement/, informations.ts, types.ts
extension/                inchangé : une table d'extensions de fichier en plus
docs/langages/c17/        CATALOGUE.md et bilans actuels
docs/langages/python/     catalogue généré, et ses propres limites connues
```

### 2.4 Le placement : deux modules, assumés

| | C17 | Python |
|---|---|---|
| délimitation | `{` et `}` | indentation, et la ligne d'en-tête terminée par `:` |
| sortie de bloc | accolade fermante | **diminution** de l'indentation |
| ligne blanche | sans signification | **significative** dans un bloc |
| contexte englobant | balayage des accolades (196 lignes) | pile d'indentations à écrire |
| réutilisable | — | la **forme** des reconnaisseurs (chaîne `if`, boucle englobante), soit ~40 % |

**Ne pas unifier ces deux modules est une décision, pas un renoncement.** Un
`EnclosingScanner` abstrait devrait modéliser « un bloc » indépendamment de
sa délimitation : il produirait un module plus difficile à lire que les deux
réunis, pour un gain nul — il n'y a que deux langages, et le second n'est pas
écrit.

### 2.5 Ce qui reste strictement commun, et doit le rester

- **les neuf règles** : code source de référence, traçabilité, aucun ajout
  implicite, refus explicites, diagnostic ≠ correction, traduction valide ≠
  programme sûr, préservation de l'historique, aperçu puis confirmation,
  aucune modification non autorisée ;
- le **cycle** saisie → aperçu → confirmation → insertion unique annulable ;
- les **trois canaux** : refus, avertissement, information passive ;
- les **intervalles UTF-16** absolus, sans normalisation ;
- la **méthode** : contrat, tests, différentiel, bilan chiffré.

## 3. Comment une intention se décline, en pratique

Trois cas, et le troisième est celui qui compte.

**Cas 1 — portée telle quelle** (17 intentions). `ASSIGN_INT` :

    Affecte la valeur 5 à x.   →  C17 : x = 5;        Python : x = 5

**Cas 2 — portée sous une autre forme** (37 intentions). `NUMERIC_PRINT` :

    Affiche moyenne en notation fixe avec 2 décimales.
      C17    : printf("%.2f", moyenne);
      Python : print(f"{moyenne:.2f}", end="")

Noter `end=""` : la règle « aucun séparateur ajouté » **impose** cette forme.
Le rendu évident aurait violé une règle fondamentale en silence. C'est la
sonde qui l'a trouvé, pas une relecture.

**Cas 3 — non portée** (24 intentions, plus 10 décisions de contrat) :

    Déclare un entier nommé n.
      C17    : int n;
      Python : REFUS — « Python ne déclare pas sans valeur : écrire n = 0
               inventerait ce 0. »

**C'est le cas 3 qui justifie l'architecture.** Un socle qui ne sait pas
refuser produirait `n = 0`, c'est-à-dire exactement ce que la règle 3
interdit depuis le premier lot.

## 4. Ce que le socle ne résout pas

| Problème | État |
|---|---|
| les **12 décisions de contrat** non triviales | listées par la sonde ; elles appartiennent au fondateur, pas à l'architecture |
| les intentions que **Python mérite** et que C n'a pas (parcours d'itérable, liste, dictionnaire) | hors périmètre : ce sont des lots de domaine, pas du socle |
| la **vérification des symboles** | toujours absente, dans les deux langages |
| un **troisième** langage | le socle est conçu pour, rien ne le prouve. La deuxième incarnation valide l'architecture ; la troisième seule la généralise |
| la **cohabitation** de deux catalogues dans l'esprit d'un étudiant | question pédagogique ouverte, et elle n'est pas technique |

## 5. Ce que je recommande de décider maintenant

| # | Décision | Ma recommandation |
|---|---|---|
| 1 | socle en **registre de capacités** plutôt qu'en gabarits | oui — c'est le choix déjà validé au lot 13, un niveau plus haut |
| 2 | **deux modules de placement** non unifiés | oui — unifier coûterait de la lisibilité sans rien acheter |
| 3 | une intention non portée est un **refus nommé** | oui, sans exception : c'est la règle 3 appliquée au multilangage |
| 4 | périmètre Python du **premier jet : 37 intentions** | oui — annoncer un Python plus pauvre que le C, et le dire au lieu de le masquer |
| 5 | **P0 avant tout** : extraire le rendu, unifier les littéraux, zéro capacité nouvelle | oui — c'est le seul lot qui touche `main`, et il doit être prouvé neutre par différentiel |
| 6 | la souplesse linguistique est un **module séparé**, désactivé par défaut | oui — voir `STRATEGIE_LINGUISTIQUE.md` |

**Aucune de ces six décisions n'est prise.** Tant qu'elles ne le sont pas, la
branche `phase-2-architecture` ne contient que des mesures, deux sondes
jetables et ces documents — et `main` reste la V1 publique, intacte.
