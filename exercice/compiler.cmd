@echo off
rem Compilation et exécution de l'exercice intégrateur.
rem
rem AUCUN compilateur C n'existait dans l'environnement où l'exercice a été
rem produit : ni gcc, ni clang, ni MSVC, et WSL n'est pas installé. Ce script
rem est donc la procédure à exécuter là où GCC est disponible. Il n'a jamais
rem été exécuté, et aucune preuve de compilation n'est revendiquée.
rem
rem   exercice\compiler.cmd

setlocal
cd /d "%~dp0"

where gcc >nul 2>nul
if errorlevel 1 (
  echo gcc introuvable. Installez MSYS2/MinGW-w64 ou TDM-GCC, puis relancez.
  exit /b 2
)

echo === version du compilateur
gcc --version

echo.
echo === 1. version BRUTE de C-A : exercice\ca
echo     Attendu : au moins une erreur d'edition de liens, « compteur » etant
echo     defini dans calcul.c ET dans carnet.c. C'est le defaut du scenario
echo     brut, que l'information EXTERNAL_LINKAGE annoncait.
gcc -std=c17 -Wall -Wextra -pedantic ca\carnet.c ca\calcul.c -o ca\carnet.exe
echo     code de sortie : %errorlevel%

echo.
echo === 2. version CORRIGEE : exercice\corrige
echo     Attendu : un avertissement -Wdiv-by-zero dans calcul.c, voulu, pour
echo     exercer l'avertissement de calcul du lot 8. Rien d'autre.
gcc -std=c17 -Wall -Wextra -pedantic corrige\carnet.c corrige\calcul.c -o corrige\carnet.exe
echo     code de sortie : %errorlevel%
if errorlevel 1 (
  echo     ECHEC de compilation de la version corrigee : a consigner.
  exit /b 1
)

echo.
echo === 3. execution de la version corrigee
corrige\carnet.exe
echo     code de sortie : %errorlevel%

echo.
echo === 4. fichier produit par le programme
if exist resultat.txt (type resultat.txt) else (echo resultat.txt absent)

echo.
echo === 5. compilation separee, pour verifier l'en-tete et les prototypes
gcc -std=c17 -Wall -Wextra -pedantic -c corrige\calcul.c -o corrige\calcul.o
gcc -std=c17 -Wall -Wextra -pedantic -c corrige\carnet.c -o corrige\carnet.o
gcc corrige\calcul.o corrige\carnet.o -o corrige\carnet-separe.exe
echo     code de sortie : %errorlevel%

endlocal
