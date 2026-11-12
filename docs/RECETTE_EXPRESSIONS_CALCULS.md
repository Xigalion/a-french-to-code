# Recette finale — Domaine « Expressions et calculs », lots 6 à 8

**Suivi au 5 novembre 2026 :** le porteur confirme manuellement les deux familles d’avertissements pédagogiques du lot 8. La recette GCC complète Expressions et calculs reste ouverte ; aucun résultat C17 supplémentaire n’est inventé. Après la préparation, le [lot 9](LOT9_CONTRAT_PROPOSE.md) a reçu son autorisation distincte et est implémenté, sans clôture de cette recette. Les mentions d’absence de domaine suivant dans les bilans historiques restent datées de leur livraison.

Statut au 3 novembre 2026 : **protocole final après approbation et implémentation du lot 8 ; recette manuelle complète non effectuée**. Voir le [contrat](LOT8_CONTRAT_PROPOSE.md) et le [bilan automatisé](LOT8_BILAN.md). Les observations partielles déjà confirmées ne constituent pas une recette complète. Les expressions et comportements décrits au §4 sont désormais pris en charge selon le périmètre approuvé ; « attendu proposé » désigne l'oracle contractuel.

## 1. Préparer et consigner

Noter OS, versions de VS Code/C-A, commit ou état des sources, version GCC (`gcc --version`), cible (`gcc -dumpmachine`), commandes exactes, code de sortie, sorties et diagnostics. Si GCC manque, noter « non exécuté — environnement », sans déclarer le contrôle réussi. Conserver un profil isolé pour les essais automatisés ; la recette physique est à distinguer de ceux-ci.

Créer un fichier C de travail. Ouvrir C-A par la commande habituelle du dépôt ; ne pas modifier les tâches ni les paramètres du parcours. Construire le programme avec les instructions existantes, en relisant chaque aperçu avant confirmation. Ajouter **manuellement et explicitement** `limits.h` et `float.h`. Le C ci-dessous est un oracle de calcul, pas une nouvelle sortie multiligne de C-A : les fragments réellement insérés doivent conserver chacun leur commentaire français original.

## 2. Programme de synthèse sûr

Calculatrice d'entiers enrichie de comparaisons de types, conversions et bornes, sans condition ni boucle. Les nouvelles lignes de présentation et les sauts de ligne sont écrits explicitement ; C-A ne les ajoute pas automatiquement. Les chaînes `\n` ci-dessous sont du C rédigé explicitement dans cet oracle. Pour construire avec C-A, demander séparément les textes et retours à la ligne selon le catalogue existant, ou saisir explicitement ces lignes C de présentation.

```c
#include <stdio.h>
#include <limits.h>
#include <float.h>

int main(void) {
    int a = 7;
    int b = 2;
    int r;
    unsigned int u;
    double q;
    float f;
    double d;

    r = (a + b);             printf("addition=%d\n", r);
    r = (a / b);             printf("division=%d\n", r);
    r = (a % b);             printf("reste=%d\n", r);
    r = (2 + (3 * 4));       printf("priorite=%d\n", r);
    r = ((2 + 3) * 4);       printf("parentheses=%d\n", r);
    r = ((10 - 3) - 2);      printf("associativite=%d\n", r);
    r = (-a);                printf("negation=%d\n", r);
    r = (-(a + b));          printf("negation_groupe=%d\n", r);
    r = (a * (-b));          printf("produit_negatif=%d\n", r);
    r = ((-7) / 3);          printf("quotient_negatif=%d\n", r);
    r = ((-7) % 3);          printf("reste_negatif=%d\n", r);

    q = (7 / 2);             printf("destination_double=%.6f\n", q);
    q = (7.0 / 2);           printf("division_flottante=%.6f\n", q);
    q = (((double) a) / b);  printf("cast_avant=%.6f\n", q);
    q = ((double) (a / b));  printf("cast_apres=%.6f\n", q);
    r = ((int) 3.75);        printf("troncature_positive=%d\n", r);
    r = ((int) (-3.75));     printf("troncature_negative=%d\n", r);

    r = (INT_MAX - 1);       printf("avant_max=%d\n", r);
    r = INT_MAX;             printf("max=%d\n", r);
    r = (INT_MIN + 1);       printf("apres_min=%d\n", r);
    r = INT_MIN;             printf("min=%d\n", r);
    u = UINT_MAX;            printf("unsigned_max=%u\n", u);
    u = (u + 1u);            printf("unsigned_retour=%u\n", u);
    u = (0u - 1u);           printf("unsigned_recul=%u\n", u);
    u = ((-1) + 1u);         printf("melange=%u\n", u);

    f = 0.1f;
    d = 0.1;
    printf("float=%.17f\ndouble=%.17f\n", f, d);
    f = ((float) d);
    q = ((double) f);
    printf("apres_reduction=%.17f\n", q);
    printf("scientifique=%.6e\n", d);
    printf("CHAR_BIT=%d FLT_RADIX=%d FLT_DIG=%d DBL_DIG=%d\n",
           CHAR_BIT, FLT_RADIX, FLT_DIG, DBL_DIG);
    printf("FLT_MIN=%e FLT_MAX=%e FLT_EPSILON=%e\n",
           FLT_MIN, FLT_MAX, FLT_EPSILON);
    printf("DBL_MIN=%e DBL_MAX=%e DBL_EPSILON=%e\n",
           DBL_MIN, DBL_MAX, DBL_EPSILON);
}
```

Les petites constantes utilisées restent représentables sur les implémentations C17 usuelles et conformes aux minima requis ; les observations décimales flottantes sont à interpréter selon le profil mesuré. Aucun résultat numérique précis des approximations de 0.1 n'est imposé à toutes les implémentations. Ne pas déduire un profil annexe F de ce programme.

Prévisions entières : addition 9, division 3, reste 1, priorité 14, parenthèses 20, associativité 5, négation -7, groupe -9, produit -14, quotient -2, reste -1. Destination double et cast après : 3 ; division flottante et cast avant : environ 3.5, affiché normalement `3.500000` avec le profil GCC observé. Troncatures : 3 et -3. Les bornes doivent correspondre aux macros imprimées/consignées, sans oracle imposant 32 bits. Retour non signé et mélange : 0 ; recul non signé : `UINT_MAX`.

Le `float` passé à `printf` est promu en `double` : `%f` et `%e` conviennent aux deux dans ce parcours. Cela ne récupère pas sa précision de stockage. `%u` attend `unsigned int`, `%d` attend `int`. Ne pas tester un mauvais appariement en l'exécutant ; un format incorrect peut lui-même entraîner un comportement indéfini. La précision de 17 utilisée ici est un choix explicite d'observation, pas une garantie universelle de conversion aller-retour pour toute implémentation.

## 3. Vérifier les formulations et le parcours

Pour chaque ligne : saisir, lire le C et le commentaire exact, comparer la prévision, confirmer, contrôler la position et l'absence de sauvegarde automatique.

| Groupe | Saisies ou variantes à couvrir |
|---|---|
| Lot 6 | `Affecte à r le résultat de "a + b".` ; `"2 + 3 * 4"` ; `"(2 + 3) * 4"` ; `"10 - 3 - 2"` ; `"-a"` ; `"-(a + b)"` ; `"a * -b"` ; divisions et restes signés du programme |
| Lot 7 types | `Déclare une variable de type float nommée f.` ; les quatre types ; `Crée une variable de type double nommée q avec le résultat de "7.0 / 2".` ; initialisations explicites analogues pour les autres types |
| Lot 7 calculs | `Affecte à q le résultat numérique de "7 / 2".` ; `"7.0 / 2"` ; `"(double) a / b"` ; `"(double) (a / b)"` ; négations et casts emboîtés ; `0u`, `1U`, `.5`, `1.`, `1e-3`, `0.1f`, `0.1F` |
| Affichage | `Affiche r en décimal.` ; `Affiche u en décimal non signé.` ; `Affiche q en notation fixe avec 6 décimales.` ; notation scientifique ; précisions 0 et 20 |
| Refus historiques | Expression vide/incomplète `"a +"` ; guillemet ou parenthèse manquants ; flottant/cast dans la branche entière ; précision absente/21 ; type absent ; `Affiche age.` et `Affiche age en binaire.`. Même diagnostic historique, intervalle exact et aucune insertion. |
| Compatibilité | Rejouer les instructions historiques des lots 1 à 5 depuis leurs fixtures/contrats : notamment `Affiche la valeur de age.`, décimal/hexadécimal/octal et textes, inclusion explicite stdio, déclarations et affectations historiques. Vérifier avant/après intégral et commentaires. |

Les éléments entre guillemets dans les cellules abrégées remplacent uniquement l'expression de la formulation complète, pas une nouvelle grammaire. Les formats `%x` et `%o` historiques demeurent inchangés ; choisir un argument réellement approprié lors d'une exécution, sans correction automatique par C-A.

Répéter un cas dans LF puis CRLF, avec indentation et curseur au milieu du fichier ; vérifier retour au bon éditeur, navigation clavier, accents et IME. Tester Modifier la phrase, Annuler, fermeture, changement de document/cursor et modification concurrente avant confirmation ; aucune insertion périmée. Vérifier une insertion suivie d'annuler/rétablir. Ces contrôles physiques doivent être attestés séparément, avec OS ; Windows automatisé ne valide pas macOS/Linux.

## 4. Avis du lot 8 : étude sans exécution

Avant l'aperçu, le champ affiche le nombre d'avis et le premier message avec sévérité Warning. Après Entrée, la confirmation conserve ses trois choix et annonce le nombre d'avis ; le premier figure dans le détail d'Insérer. Ouvrir manuellement **Affichage → Sortie**, puis choisir **C-A — Pédagogie** pour consulter l'ensemble des codes, classifications et plages UTF-16. Le canal n'est jamais ouvert automatiquement ; les entrées sont historiques, identifiées par session et jeton d'aperçu. Les avis ne sont pas inscrits dans le C. Si le canal est ouvert pendant la recette, revenir au diff et contrôler le focus avant la confirmation.

Utiliser un fichier d'étude distinct clairement nommé `calculs_ne_pas_executer.c`, jamais envoyé aux tâches d'exécution. Les cas sont traduits et éventuellement insérés pour contrôler la compatibilité, **pas exécutés**. On peut annuler après l'aperçu pour les autres cas. Ne pas intégrer ces expressions au programme sûr.

| Expression | Attendu proposé |
|---|---|
| `7 / 0`, `7u % 0u` | Avis d'erreur entière certaine, non bloquant ; C inchangé |
| `1.0 / 0.0`, `a / 0.0` | Avis flottant dépendant du profil, sans promesse d'infinité |
| `a / 0` | Avis au diviseur, types réels inconnus |
| `7 % 0.0` | Un seul avis de contrainte sur l'opérande flottant |
| `7 / (1 - 1)`, `7 / (int)0`, `a / b` | Aucun avis automatique : exclusion documentée, pas certificat de sûreté |
| `INT_MAX + 1`, `INT_MIN - 1` | Démontrer le dépassement sur papier avec `limits.h` ; absence d'avis local attendue |
| `INT_MIN / -1`, `INT_MIN % -1`, `-INT_MIN` | Raisonner selon la plage réelle ; ne pas supposer le complément à deux et ne pas exécuter |
| Conversion flottant vers entier hors plage ; flottant hors plage de destination | Étudier les conditions sur papier, sans choisir une constante supposée hors plage pour tous les C17 |

Contrôler Entrée malgré l'avis, aperçu inchangé et mêmes choix ; tous les avis dans le canal passif, sans prise de focus ; modification de phrase qui enlève le motif ; retour à un vrai diagnostic bloquant ; absence de doublon dans le journal pour le même aperçu. Un exemple composé `7 / 0 + 5.0 % 2` doit rendre les deux avis consultables et ordonnés.

Si un extrait problématique est soumis à GCC, utiliser uniquement `gcc -std=c17 -Wall -Wextra -Wpedantic -fsyntax-only calculs_ne_pas_executer.c`. Aucun exécutable et aucune exécution. GCC doit diagnostiquer une violation de contrainte comme `%` flottant ; il ne doit pas nécessairement détecter tout comportement indéfini. Ne pas figer le texte localisé des diagnostics.

## 5. GCC et fiche d'observation

Compiler et exécuter **seulement le programme sûr**, après revue des types, plages et formats :

```powershell
gcc -std=c17 -Wall -Wextra -Wpedantic -Wformat=2 -Wconversion -O0 domaine_calculs.c -o domaine_calculs.exe
.\domaine_calculs.exe
```

Ne lancer la seconde commande qu'après compilation réussie et examen des avertissements. Un ancien exécutable ne doit pas servir de preuve si la compilation échoue. Ne pas employer `-ffast-math` ou `-fwrapv` pour masquer une difficulté. La recette n'ajoute aucun mécanisme de compilation à C-A.

Optionnel, si GCC et ses bibliothèques le permettent : compiler **ce même programme sûr** avec `-fsanitize=undefined,float-cast-overflow -fno-sanitize-recover=all`. L'absence de rapport n'est pas une preuve de sûreté. Ne pas ajouter de cas indéfini pour provoquer le sanitizer. Une instrumentation indisponible est une limite d'environnement à consigner. Le contrôle `float-divide-by-zero` est séparé de `undefined` et ne transforme pas les règles du C en garanties universelles.

| Cas | Types/opération prévus | Résultat ou statut prévu | Justification/plage/profil | Résultat observé | Conclusion |
|---|---|---|---|---|---|
| À remplir pour chaque famille | | | | | |

La compétence est acquise si l'apprenant peut justifier chaque cas, distinguer les conversions avant/après opération, proposer des bornes sûres, expliquer les approximations et identifier ce qu'il ne peut conclure. Une exécution réussie ou une absence d'avis C-A seule ne suffit pas. Toute erreur conceptuelle de catégorie (signé/non signé, flottant général/annexe F, stockage/affichage, cast/garantie de plage) doit être retravaillée.

## 6. Clôture et environnement hôte

Consigner séparément TypeScript, nombres de tests Node et hôte, recette physique, essais GCC, cas non exécutés et motifs. Ne reporter aucune validation globale tant que les contrôles obligatoires ne sont pas attestés ; les variantes optionnelles et plateformes non testées restent explicitement ouvertes.

Suivre l'avertissement lot 7 : **« Error mutex already exists »** et **DEP0168 / N-API**, rapport historique 45/0, sortie 0. Relever sa réapparition éventuelle et ses effets, garder logs et profil/version. Origine non qualifiée, ni résolue ni définitivement bloquante. Ne pas fermer d'autres instances utilisateur ou réinitialiser l'environnement silencieusement. Voir le contrat §8 pour les traces et la séparation entre blocage d'environnement et échec fonctionnel.
