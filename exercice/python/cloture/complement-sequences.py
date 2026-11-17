# Crée une liste nommée notes avec les valeurs "12", "15" et "9".
notes: list = [12, 15, 9]
# Insère "20" à la position "0" de notes.
notes.insert(0, 20)
# Retire l’élément à la position "3" de notes.
del notes[3]
# Affecte à debut la tranche de notes de "0" jusqu’avant "2".
debut = notes[0:2]
# Affecte à combien le nombre d’éléments de debut.
combien = len(debut)
# Affiche la valeur de combien.
print(combien, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affiche le dernier élément de notes.
print(notes[-1], end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un nom appelé alias qui désigne la même liste que notes.
alias = notes
# Ajoute "1" à la fin de alias.
alias.append(1)
# Affecte à apres le nombre d’éléments de notes.
apres = len(notes)
# Affiche la valeur de apres.
print(apres, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un tuple nommé point avec les valeurs "3" et "4".
point: tuple = (3, 4)
# Affecte à x et y les valeurs de point.
x, y = point
# Affecte à p le résultat de "x" élevé à la puissance "y".
p = (x ** y)
# Affiche la valeur de p.
print(p, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un tuple nommé paire avec les textes "ada" et "bob".
paire: tuple = ("ada", "bob")
# Affecte à a et b les valeurs de paire.
a, b = paire
# Affiche la chaîne b.
print(b, end="")
# Affiche un retour à la ligne.
print("\n", end="")
