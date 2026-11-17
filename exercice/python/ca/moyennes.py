# Crée une fonction nommée moyenne qui retourne un double et prend un int nommé total et un int nommé nombre.
def moyenne(total: int, nombre: int) -> float:
    # Crée un bloc si "nombre == 0".
    if nombre == 0:
        # Retourne le résultat numérique de "0".
        return 0
    # Affecte à q le quotient réel de "total" par "nombre".
    q = (total / nombre)
    # Retourne le résultat numérique de "q".
    return q
# Crée une liste nommée notes avec les valeurs "12", "15" et "9".
notes: list = [12, 15, 9]
# Ajoute "18" à la fin de notes.
notes.append(18)
# Affecte à nombre le nombre d’éléments de notes.
nombre = len(notes)
# Crée un entier nommé total de valeur 0.
total = 0
# Crée une boucle pour chaque note de notes.
for note in notes:
    # Affecte à total le résultat numérique de "total + note".
    total = (total + note)
# Affiche le texte "somme = ".
print("somme = ", end="")
# Affiche la valeur de total.
print(total, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à entiere le quotient entier de "total" par "nombre".
entiere = (total // nombre)
# Affiche le texte "moyenne entière = ".
print("moyenne entière = ", end="")
# Affiche la valeur de entiere.
print(entiere, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à reste le reste entier de "total" par "nombre".
reste = (total % nombre)
# Affiche le texte "reste = ".
print("reste = ", end="")
# Affiche la valeur de reste.
print(reste, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à exacte le résultat de l’appel de moyenne avec "total" et "nombre".
exacte = moyenne(total, nombre)
# Affiche le texte "moyenne exacte = ".
print("moyenne exacte = ", end="")
# Affiche exacte en notation fixe avec 2 décimales.
print(f"{exacte:.2f}", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une boucle pour i de "0" jusqu’avant "nombre".
for i in range(0, nombre):
    # Affiche le texte "note "
    print("note ", end="")
    # Affiche la valeur de i.
    print(i, end="")
    # Affiche le texte " = ".
    print(" = ", end="")
    # Affiche l’élément "i" de notes.
    print(notes[i], end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée un booléen nommé assez de valeur vrai.
assez: bool = True
# Crée un bloc si "entiere < 12".
if entiere < 12:
    # Crée un booléen nommé assez de valeur faux.
    assez: bool = False
# Crée un bloc si "assez".
if assez:
    # Affiche le texte "au-dessus".
    print("au-dessus", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Ajoute une branche sinon.
else:
    # Affiche le texte "en dessous".
    print("en dessous", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
