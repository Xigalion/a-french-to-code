# Crée un dictionnaire nommé notes avec la clé "ada" valant "15".
notes: dict = {"ada": 15}
# Affecte "12" à la clé "bob" de notes.
notes["bob"] = 12
# Affecte à nombre le nombre d’éléments de notes.
nombre = len(notes)
# Crée un entier nommé total de valeur 0.
total = 0
# Crée une boucle pour la clé nom et la valeur note de notes.
for nom, note in notes.items():
    # Affecte à total le résultat numérique de "total + note".
    total = (total + note)
# Affecte à moyenne le quotient réel de "total" par "nombre".
moyenne = (total / nombre)
# Affiche le texte "moyenne = ".
print("moyenne = ", end="")
# Affiche moyenne en notation fixe avec 2 décimales.
print(f"{moyenne:.2f}", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une liste vide nommée noms.
noms: list = []
# Crée une boucle pour la clé nom et la valeur note de notes.
for nom, note in notes.items():
    # Ajoute "nom" à la fin de noms.
    noms.append(nom)
# Affecte à liste les éléments de noms joints par le texte ", ".
liste = ", ".join(noms)
# Affiche la chaîne liste.
print(liste, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un bloc à essayer.
try:
    # Affecte à inconnue la valeur de la clé "zoe" de notes.
    inconnue = notes["zoe"]
# Ajoute une branche en cas d’erreur de type KeyError.
except KeyError:
    # Affiche le texte "absente".
    print("absente", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée un filtrage sur "nombre".
match nombre:
    # Ajoute un motif pour la valeur 2.
    case 2:
        # Affiche le texte "deux notes".
        print("deux notes", end="")
        # Affiche un retour à la ligne.
        print("\n", end="")
    # Ajoute le motif qui accepte tout.
    case _:
        # Affiche le texte "autre compte".
        print("autre compte", end="")
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
# Crée un ensemble nommé vus avec les valeurs "1", "2" et "1".
vus: set = {1, 2, 1}
# Affecte à distincts le nombre d’éléments de vus.
distincts = len(vus)
# Affiche la valeur de distincts.
print(distincts, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à cri le texte de liste en majuscules.
cri = liste.upper()
# Affiche la chaîne cri.
print(cri, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à ligne le texte "total {total}" avec le champ total valant total.
ligne = f"total {total}"
# Affiche la chaîne ligne.
print(ligne, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à debut la tranche de noms de "0" jusqu’avant "1".
debut = noms[0:1]
# Affecte à combien le nombre d’éléments de debut.
combien = len(debut)
# Affiche la valeur de combien.
print(combien, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affiche le dernier élément de noms.
print(noms[-1], end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un nom appelé copie qui désigne la même liste que noms.
copie = noms
# Ajoute le texte "cleo" à la fin de copie.
copie.append("cleo")
# Affecte à apres le nombre d’éléments de noms.
apres = len(noms)
# Affiche la valeur de apres.
print(apres, end="")
# Affiche un retour à la ligne.
print("\n", end="")
