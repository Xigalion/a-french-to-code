# Tests hôte VS Code — diagnostic, remédiation et résultat

> **Résolu le 15 novembre 2026.** Le fondateur a autorisé l'arrêt des deux
> processus d'installateur orphelins. Le mutex est retombé, et la suite
> hôte a été **exécutée** :
>
>     VS Code 1.138.0 — 99 cas, 99 réussis, 0 échec, 3 gestes manuels
>
> Un échec a été trouvé au premier passage, et il **datait du lot 11D** :
> voir le §8. La procédure de validation manuelle du §6 reste utile comme
> recette d'usage, mais elle n'est plus la seule preuve disponible.

## 1. Le diagnostic, reproduit

**La cause documentée depuis des semaines était inexacte**, et je la
corrige. Le projet notait « le téléchargement de VS Code échoue sur un
mutex ». Or `scripts/test-vscode.mjs` **ne télécharge rien** : il exige un
VS Code **déjà installé**, et cette précondition est remplie —
`%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe` existe, et `code` est
sur le `PATH`.

La vraie cause, obtenue en exécutant `npm run test:vscode` :

    [main] checkInnoSetupMutex: vscode-updating is held, waiting up to 30s…
    [main] checkInnoSetupMutex: vscode-updating still held after 31054ms, giving up
    [main] Error: Code is currently being updated. Please wait for the update
           to complete before launching.
    Error: L’hôte VS Code n’a pas produit de rapport (code de sortie : 1).

Ce n'est pas le harnais du projet qui échoue : c'est **VS Code lui-même
qui refuse de démarrer** une nouvelle instance.

## 2. Qui détient le verrou

Un mutex Windows n'existe que si un processus le détient. Recherche des
processus concernés :

| PID | Processus | Démarré |
|---|---|---|
| 22160 | `CodeSetup-stable-69047191fc….exe` | **12/11/2026 08:43:44** |
| 21432 | `CodeSetup-stable-69047191fc….tmp` | **12/11/2026 08:43:45** |

Deux processus d'**installateur Inno Setup**, vivants depuis trois jours,
sans fenêtre (`MainWindowTitle` vide), `Responding = True`, 0,8 s et 73 s
de CPU cumulés. Ils sont **orphelins** : ils ne font rien et ne rendent pas
le mutex.

## 3. La mise à jour est-elle à moitié appliquée ? Non

C'est la question qui décide si l'on peut les arrêter sans risque.

    …\Programs\Microsoft VS Code\69047191fc    écrit le 12/11/2026 08:47:01
    …\Programs\Microsoft VS Code\bin           écrit le 12/11/2026 08:47:58
    …\Temp\vscode-stable-user-x64\CodeSetup-…exe   286 Mo, 11/11 19:14
    …\Temp\vscode-stable-user-x64\…flag            4 octets, 12/11 08:43

Le répertoire de la version cible `69047191fc` **existe et a été écrit
entièrement** le 12 novembre à 08:47, et `bin` a été mis à jour à 08:47:58.
L'installation a donc **abouti sur le disque** quatre minutes après le
lancement. Seuls les deux processus n'ont jamais rendu la main.

**Conclusion : il n'y a pas d'état à moitié appliqué.** Arrêter les deux
processus relâche le mutex sans rien laisser d'incohérent.

## 4. Ce que je n'ai pas fait, et pourquoi

**Je n'ai arrêté aucun processus.** Ce sont des processus de ta machine qui
touchent l'installation de ton éditeur, et plusieurs fenêtres VS Code sont
ouvertes en ce moment. La consigne était de diagnostiquer « sans supprimer
aveuglément les fichiers ou verrous » ; le diagnostic est fait, l'action
te revient.

**Je n'ai supprimé aucun fichier** : ni le `.flag`, ni le `CodeSetup…exe`
de 286 Mo, ni le cache `.cache/vscode-test`.

## 5. Remédiation, si tu la valides

Dans un terminal, après avoir **enregistré ton travail** dans VS Code :

    # 1. confirmer que ce sont bien ces deux processus, et eux seuls
    Get-Process | Where-Object { $_.ProcessName -like 'CodeSetup*' } |
      Select-Object Id, ProcessName, StartTime

    # 2. les arrêter
    Stop-Process -Id 22160, 21432 -Force

    # 3. vérifier que le verrou est tombé : une nouvelle fenêtre doit s'ouvrir
    code --new-window

    # 4. relancer les 97 tests hôte
    npm run test:vscode

Les PID changent à chaque redémarrage de la machine : **relis-les** avant
d'arrêter quoi que ce soit. Un simple redémarrage de Windows libère aussi
le mutex, et c'est l'option la plus sûre si tu préfères ne rien arrêter.

Si les tests passent, le rapport est écrit dans
`.cache/vscode-test/results.json`, et les journaux de l'hôte dans
`.cache/vscode-test/profile/logs`.

## 6. Validation manuelle, en attendant

Dix gestes, dans l'ordre. Chacun a un résultat **observable**. Noter ce qui
est vu, pas ce qui est attendu.

### Préparation

    npm run check              # doit afficher 3 580 tests, 0 échec
    npm run build:extension

Ouvrir le dossier `A` dans VS Code, puis `F5` → une seconde fenêtre
s'ouvre avec C-A chargée. Y créer `essai.c`.

### Les dix gestes

| # | Geste | Résultat à observer |
|---|---|---|
| 1 | Curseur sur une ligne blanche, `Ctrl+K` puis `A` | une zone de saisie s'ouvre |
| 2 | Saisir `Crée la fonction principale.` puis `Entrée` | un **aperçu diff en lecture seule** s'ouvre ; **rien n'est encore écrit** dans `essai.c` |
| 3 | Choisir **Insérer** | `// Crée la fonction principale.` puis `int main(void) {` … `}` apparaissent, curseur **à l'intérieur** |
| 4 | `Ctrl+Z` une seule fois | **tout** le fragment disparaît d'un coup |
| 5 | `Ctrl+Y`, puis saisir `Déclare un entier nommé x.` sur la ligne blanche du corps | `int x;` inséré à l'indentation du corps |
| 6 | Saisir `Affecte la valeur 5 à y.` puis **Annuler** à l'aperçu | **rien** n'est inséré, le document est inchangé |
| 7 | Saisir `Déclare un entier nommé 1x.` | refus, message sur **`1x`** précisément |
| 8 | Saisir `Affecte à n le résultat numérique de "1 / 0".` | insertion, **et** un avertissement de calcul |
| 9 | Ouvrir *Affichage → Sortie*, canal **« C-A — Pédagogie »** | les informations des instructions insérées, en **information** et jamais en avertissement |
| 10 | Placer le curseur sur une ligne **non blanche** et appeler la commande | refus explicite, aucune modification |

### Trois gestes qui doivent échouer

| # | Geste | Refus attendu |
|---|---|---|
| 11 | `Sors de la boucle la plus intérieure.` hors de toute boucle | `LOOP_TARGET_NOT_FOUND` |
| 12 | `Ajoute un cas pour la valeur 1.` hors de tout aiguillage | `SWITCH_TARGET_NOT_FOUND` |
| 13 | `Retourne la valeur 0.` à la portée fichier | `NO_ENCLOSING_FUNCTION` |

### Le geste qui révèle la lacune du §4 de l'évaluation

| # | Geste | Ce qui va se passer |
|---|---|---|
| 14 | Après la dernière accolade de `main`, sur une ligne blanche, saisir `Affecte la valeur 5 à x.` | **l'insertion est acceptée**, et le C obtenu ne compile pas |

C'est la lacune la plus importante trouvée par l'évaluation. Ce geste la
rend visible en dix secondes.

## 7. Ce que la validation manuelle ne remplace pas

Les 97 tests hôte couvrent le détail que l'œil ne voit pas : les
offsets exacts de l'édition, l'unicité de l'annulation, le contenu du
document virtuel d'aperçu, la révision du document entre l'aperçu et
l'insertion, le comportement en CRLF, et le refus en cas de modification
concurrente. **La validation manuelle ne les remplace pas**, et aucune
conclusion sur l'hôte ne doit être tirée de son seul succès.


---

## 8. Le test périmé trouvé au premier passage, et depuis quand

Le premier passage a donné **98 réussis, 1 échec** :

    ECHEC : lot 11A refus sans insertion : UNKNOWN_FORMULATION
            Sors de la boucle la plus intéri…
    AssertionError : + actual 'placement'   - expected 'translation'

Le test attendait que `Sors de la boucle la plus intérieure.` soit refusée
**à la traduction** avec `UNKNOWN_FORMULATION`.

**Diagnostic.** L'attente était juste au lot 11A, où cette phrase
n'existait pas. Le **lot 11D** en a fait une formulation **valide**, qui se
traduit en `break;`. Son refus a donc changé d'étape : il vient maintenant
du **placement**, avec `LOOP_TARGET_NOT_FOUND`. Vérifié directement :

    traduction : translated   break;
    placement  : rejected     LOOP_TARGET_NOT_FOUND

**Depuis quand.** L'attente a été écrite au commit (identifiant antérieur à la réécriture) (lot 11A), et
la formulation est devenue valide au commit (identifiant antérieur à la réécriture) (lot 11D). Le lot 11D
n'a pas mis ce test à jour. Il **échouait donc depuis le lot 11D**, sans que
personne le voie — précisément parce que la suite hôte ne pouvait pas
s'exécuter. Le fichier `test/vscode/suite.cjs` n'a pas été modifié depuis le
lot 12 : aucun de mes lots 13 à 25 ne l'a touché.

**Correction.** L'entrée a quitté la liste des refus de traduction, avec la
raison en commentaire sur place, et un test nouveau vérifie le refus **au
placement**. Second passage : 99 cas, 99 réussis.

**Ce que cet épisode enseigne.** Une suite de tests qu'on ne peut pas
exécuter ne protège de rien, et se périme en silence. Le chiffre « 97 tests
hôte » répété dans la documentation du projet était lui-même périmé : la
suite en compte **99**, et elle en comptait déjà 99 avant ma correction.
