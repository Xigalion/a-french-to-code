# C-A — installation pour un test utilisateur, et retour arrière

**Pour qui :** la personne qui installe C-A sur le poste d'un étudiant, et
qui doit pouvoir le désinstaller sans laisser de trace.

> Version testable : **C-A 0.4.0**, paquet local `dist/c-a-0.4.0.vsix`.
> Aucun lot fonctionnel n'a été ajouté pour ce test : le moteur est
> exactement celui de la campagne 3 (commit (identifiant antérieur à la réécriture)).
>
> Date : 16 novembre 2026.

---

## 1. Ce qui est installé, et ce qui ne l'est pas

| | |
|---|---|
| installé | une extension VS Code locale, `projet-a-local.c-a@0.4.0` |
| taille | 36 fichiers, du JavaScript compilé, **aucune dépendance** |
| réseau | **aucun accès réseau**, aucune télémétrie, aucun compte |
| écrit | rien, sauf le document `.c` que l'étudiant confirme lui-même |
| **pas** installé | aucun compilateur. C-A écrit du C ; il ne le compile pas |

C-A n'est **pas** publié sur la place de marché VS Code et ne doit pas
l'être : c'est un prototype de test supervisé.

## 2. Prérequis

1. **VS Code ≥ 1.96** (validé sur 1.138.0).
2. **Node.js ≥ 24.12** — seulement pour *fabriquer* le paquet. Le poste de
   l'étudiant n'en a pas besoin.
3. Un compilateur C17 si l'étudiant doit compiler son code. Les campagnes
   ont employé **WinLibs GCC 16.2.0**, hors du dépôt. Sans compilateur,
   l'étudiant lit son C mais ne l'exécute pas — c'est un test valable, et
   plus pauvre.

## 3. Fabriquer le paquet

    npm install
    npm run check            # 3 820 tests ; ne pas installer si un seul échoue
    npm run build:extension
    node scripts/paquet.mjs

La dernière commande affiche :

    paquet   : …\dist\c-a-0.4.0.vsix
    entrées  : 37
    vérifié  : les 4 entrées requises sont présentes, aucun séparateur « \ ».

**Elle échoue si le paquet est invalide**, au lieu de produire un fichier
qui s'installerait sans son manifeste. Un `.vsix` est une archive ZIP ; le
script l'écrit sans dépendance, parce que le projet s'interdit d'en ajouter.

## 4. Installer

    code --install-extension dist\c-a-0.4.0.vsix

Puis vérifier, et ne rien croire sur parole :

    code --list-extensions --show-versions
    → projet-a-local.c-a@0.4.0

**Fait et vérifié le 16 novembre 2026** sur VS Code 1.138.0 : installation
en code de sortie 0, extension listée, 36 fichiers présents dans
`%USERPROFILE%\.vscode\extensions\projet-a-local.c-a-0.4.0`.

### Variante sans la ligne de commande

Dans VS Code : **Extensions** → menu `…` → **Installer depuis un VSIX…**,
choisir le fichier. Même résultat.

### Variante sans paquet

Copier le dossier `dist\paquet\extension` dans
`%USERPROFILE%\.vscode\extensions\projet-a-local.c-a-0.4.0`, puis
redémarrer VS Code. C'est le même contenu, sans archive.

## 5. Vérifier que l'installation est vivante

Trois contrôles, dans cet ordre. Si l'un échoue, ne pas commencer la séance.

1. Ouvrir un fichier **`.c` enregistré sur le disque** (pas un onglet « sans
   titre » : la commande est volontairement désactivée ailleurs).
2. `Ctrl+Maj+P` → taper `C-A`. La commande
   **« C-A : Saisir une instruction »** doit apparaître.
3. L'exécuter, saisir `Crée un entier nommé age de valeur 20.`, `Entrée`.
   Un **aperçu en lecture seule** doit s'ouvrir, et **rien ne doit être
   inséré** avant le choix « Insérer ».

Le canal **« C-A — Pédagogie »** (Affichage → Sortie) reçoit les
informations passives. L'ouvrir avant la séance : c'est une moitié de ce
qu'on observe.

## 6. Retour arrière

    code --uninstall-extension projet-a-local.c-a

Ou **Extensions → C-A → Désinstaller**, puis redémarrer VS Code.

Ce qui reste après désinstallation :

| | |
|---|---|
| les fichiers `.c` écrits par l'étudiant | **conservés** — ce sont ses fichiers |
| réglages VS Code | aucun ajouté, donc rien à nettoyer |
| dossier d'extension | supprimé par la désinstallation |
| raccourci `Ctrl+K A` | rendu, il n'était attaché qu'aux fichiers `.c` |

Vérifier le retour arrière :

    code --list-extensions | findstr c-a
    → aucune sortie

### Revenir à une version antérieure

Le paquet porte sa version. Pour revenir à la 0.4.0 après avoir essayé
autre chose : désinstaller, puis réinstaller `dist\c-a-0.4.0.vsix`. Garder
le `.vsix` **hors du dépôt** (`dist/` est produit, non versionné).

## 7. Ce qu'il faut dire à l'étudiant avant de commencer

Trois phrases, pas plus. Elles évitent les trois quarts des malentendus :

1. « C-A n'accepte qu'un **catalogue** de phrases. Une phrase refusée n'est
   pas une faute de ta part : c'est une phrase hors catalogue. »
2. « C-A **n'invente rien** et **ne corrige rien**. Il explique ce qui
   manque ; il ne te donne pas la phrase correcte à recopier. »
3. « Une insertion acceptée **ne veut pas dire que le programme est juste**.
   C-A ne vérifie ni les noms, ni les types, ni les bornes. »

## 8. Limites connues, à ne pas découvrir en séance

- C-A ne vérifie **ni symboles, ni types, ni bornes, ni inclusions, ni
  dépassements**. `Affecte la valeur 5 à inexistant.` est accepté et produit
  `inexistant = 5;` sans un mot.
- Une instruction exécutable est **refusée hors d'un corps de fonction**
  (`STATEMENT_AT_FILE_SCOPE`) ; les déclarations, elles, sont acceptées
  partout où elles l'étaient.
- **Une phrase par ligne**, curseur sur une **ligne blanche**.
- Les accents sont **exigés** ; le point final est facultatif.
- Les blocs sont créés **vides**, à l'étudiant de les remplir.
- Trois gestes de la recette hôte restent manuels : touches physiques,
  composition IME, contrôle visuel du focus et du diff
  (`docs/VALIDATION_MANUELLE_VSCODE.md`).

Le périmètre complet est dans `docs/CATALOGUE.md` : **tout ce qui n'y
figure pas est refusé**, et c'est voulu.

## 9. Suite

- parcours de première séance : `docs/TEST_PARCOURS_DECOUVERTE.md`
- exercices progressifs : `docs/TEST_EXERCICES_PALIER1.md`
- fiche de remontée : `docs/TEST_FICHE_REMONTEE.md`
- protocole d'observation et classement : `docs/TEST_PROTOCOLE_OBSERVATION.md`
- tableau de suivi : `docs/TEST_SUIVI_RESULTATS.md`
