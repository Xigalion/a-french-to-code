# Crée un dictionnaire nommé profil avec la clé "nom" valant le texte "Ada".
profil: dict = {"nom": "Ada"}
# Affecte le texte "Londres" à la clé "ville" de profil.
profil["ville"] = "Londres"
# Affecte à ville la valeur de la clé "ville" de profil.
ville = profil["ville"]
# Affiche la chaîne ville.
print(ville, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une boucle pour la clé cle et la valeur valeur de profil.
for cle, valeur in profil.items():
    # Affiche la chaîne cle.
    print(cle, end="")
    # Affiche le texte "=".
    print("=", end="")
    # Affiche la chaîne valeur.
    print(valeur, end="")
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
# Crée un ensemble nommé mots avec les textes "ada" et "ada".
mots: set = {"ada", "ada"}
# Affecte à uniques le nombre d’éléments de mots.
uniques = len(mots)
# Affiche la valeur de uniques.
print(uniques, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une liste nommée villes avec les textes "Londres" et "Paris".
villes: list = ["Londres", "Paris"]
# Affecte à jointes les éléments de villes joints par le texte " / ".
jointes = " / ".join(villes)
# Affiche la chaîne jointes.
print(jointes, end="")
# Affiche un retour à la ligne.
print("\n", end="")
