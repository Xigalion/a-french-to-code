# Journal des versions

Les versions suivent le numéro de l'extension (`extension/package.json`).
Ce journal commence à la première version publiable ; l'historique détaillé
des 32 lots est dans `docs/LOT*.md`.

---

## 0.4.0 — 17 novembre 2026 — première version publique

**Prototype pédagogique en test utilisateur supervisé.** Pas un produit.

### Ce que cette version fait

Traduire une phrase française **du catalogue** en **une** instruction C17,
dans VS Code : aperçu, confirmation, puis insertion — une seule modification
annulable. La phrase est conservée **exactement** en commentaire au-dessus du
code produit.

- **les neuf domaines** du parcours C17 sont couverts, en 32 lots ;
- **84 intentions** reconnues, catalogue figé et publié
  (`docs/CATALOGUE.md`) ;
- informations pédagogiques **passives** dans un canal séparé — ni erreurs,
  ni avertissements ;
- **aucune dépendance d'exécution**, aucun accès réseau, aucune télémétrie.

### Preuves livrées avec cette version

| | |
|---|---|
| tests Node | **3 834**, 0 échec |
| tests hôte VS Code | **99 / 99**, neuf passages verts consécutifs |
| programmes écrits par C-A et compilés en C17 `-Wall -Wextra -pedantic` | **19** |
| programmes exécutés, sortie vérifiée contre un calcul fait à la main | **18** |
| retouches manuelles du C produit | **0** |
| intentions employées dans un programme compilé | **84 / 84** |
| dictée dans l'interface réelle | **101 instructions**, C identique à celui du moteur |
| complétion pondérée, barème historique | **93,9 %** (87 / 91 sondes) |

### Limites connues de cette version

**C-A ne vérifie ni les symboles, ni les types, ni les bornes, ni les
inclusions, ni les dépassements.** Une insertion acceptée n'est pas un
programme correct, et ne garantit pas qu'il compile.

- périmètre **fini** et volontaire : tout ce qui n'est pas au catalogue est
  refusé (ni `goto`, ni énumérations, ni unions, ni tableaux à plusieurs
  dimensions, ni listes d'initialisation, un seul niveau d'indirection) ;
- **palier 1** seulement : la formulation doit être précise, accents exigés ;
- **plateforme** : validé sur **Windows** avec VS Code 1.138 et GCC 16.2.0
  uniquement. macOS et Linux n'ont jamais été exécutés, et `Cmd+K A` n'a
  jamais été essayé ;
- trois gestes restent **manuels** : frappe physique de `Ctrl+K A`,
  composition IME, contrôle visuel du focus et du diff ;
- **0 séance** d'usage réel : la validation technique est close, l'usage ne
  l'est pas.

Liste complète : `docs/LIMITES_CONNUES.md`.

### Pour cette publication

- licence **Apache-2.0** (`LICENSE`, `NOTICE`) ;
- documentation publique : `README.md`, `CONTRIBUTING.md`,
  `docs/ETAT_DU_PROJET.md`, `docs/LIMITES_CONNUES.md`,
  `docs/REPERES_GIT.md` ;
- trois modèles de tickets, tickets vides désactivés ;
- l'historique a été **réécrit une fois avant publication** pour en retirer
  des chemins locaux et une adresse personnelle : les documents citent des
  **étiquettes**, jamais des identifiants de commit
  (`docs/REPERES_GIT.md`) ;
- `node scripts/pre-publication.mjs` revérifie l'ensemble, et échoue si le
  dépôt n'est pas publiable.

### Derniers changements fonctionnels

- **lot 32** — le champ d'un **élément** de tableau de structures devient
  assignable et affichable (`promo[i].total = total;`). Lacune trouvée par
  l'exercice de clôture : la lecture fonctionnait depuis le lot 20, l'écriture
  non ; un tableau de structures était donc déclarable et jamais remplissable.
  Aucune intention nouvelle, 1 335 559 comparaisons différentielles,
  0 régression.
- **lots 30 et 31** — intention morte rendue atteignable, information sur
  l'arithmétique de pointeurs, définition de fonction interne, lecture de
  chaîne bornée, et correction d'un type de retour `static` mal lu.
- **lot 29** — `Affiche un retour à la ligne.`, et l'information qui dit
  qu'aucun séparateur n'est ajouté.
- **lots 26 à 28** — refus d'une instruction hors d'un corps de fonction,
  champs de structure de type tableau, `limits.h`.
