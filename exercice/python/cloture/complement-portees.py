# Importe sqrt du module math.
from math import sqrt
# Crée une fonction nommée deux qui retourne un int et prend un int nommé n.
def deux(n: int) -> int:
    # Crée un bloc si "n > 0".
    if n > 0:
        # Retourne le résultat de "n * 2".
        return (n * 2)
    # Retourne la valeur 0.
    return 0
# Crée une fonction nommée rien qui ne retourne rien.
def rien() -> None:
    # Retourne.
    return
# Crée une fonction nommée paire qui retourne un int.
def paire() -> int:
    # Retourne les résultats de "1" et "2".
    return 1, 2
# Crée une liste nommée notes avec les valeurs "1", "2" et "3".
notes: list = [1, 2, 3]
# Affecte la valeur 9 à l’élément "0" de notes.
notes[0] = 9
# Affecte à l’élément "1" de notes le résultat numérique de "2 + 3".
notes[1] = (2 + 3)
# Affiche l’élément "0" de notes.
print(notes[0], end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affiche l’élément "1" de notes.
print(notes[1], end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une liste nommée lettres avec les textes "a" et "b".
lettres: list = ["a", "b"]
# Affecte le caractère 'Z' à l’élément "0" de lettres.
lettres[0] = 'Z'
# Affiche le caractère de l’élément "0" de lettres.
print(lettres[0], end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un caractère nommé c de valeur 'A'.
c: str = 'A'
# Affecte le caractère 'B' à c.
c = 'B'
# Affiche le caractère c.
print(c, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un entier nommé total de valeur 0.
total = 0
# Affecte la valeur 7 à total.
total = 7
# Affecte à total le résultat de "total + 1".
total = (total + 1)
# Affiche total en hexadécimal.
print(f"{total:x}", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une variable de type double nommée ratio avec le résultat de "1.5".
ratio: float = 1.5
# Affiche ratio en notation fixe avec 1 décimales.
print(f"{ratio:.1f}", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un entier nommé i de valeur 0.
i = 0
# Crée une boucle tant que "i < 5".
while i < 5:
    # Affecte à i le résultat de "i + 1".
    i = (i + 1)
    # Crée un bloc si "i == 2".
    if i == 2:
        # Passe à l’itération suivante de la boucle la plus intérieure.
        continue
    # Ajoute une branche sinon si "i == 4".
    elif i == 4:
        # Sors de la boucle la plus intérieure.
        break
    # Affiche la valeur de i.
    print(i, end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Affecte à doubleN le résultat de l’appel de deux avec "4".
doubleN = deux(4)
# Affiche la valeur de doubleN.
print(doubleN, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Appelle rien.
rien()
# Affecte à racine le résultat de l’appel de sqrt avec "16".
racine = sqrt(16)
# Affiche racine en notation fixe avec 1 décimales.
print(f"{racine:.1f}", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à duo le résultat de l’appel de paire.
duo = paire()
# Affecte à un et deuxieme les valeurs de duo.
un, deuxieme = duo
# Affiche la valeur de deuxieme.
print(deuxieme, end="")
# Affiche un retour à la ligne.
print("\n", end="")
