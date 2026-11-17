# Crée un dictionnaire vide nommé index.
index: dict = {}
# Affecte le texte "Ada" à la clé "a" de index.
index["a"] = "Ada"
# Affecte à qui la valeur de la clé "a" de index.
qui = index["a"]
# Affiche la chaîne qui.
print(qui, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée une liste vide nommée mots.
mots: list = []
# Ajoute le texte "beta" à la fin de mots.
mots.append("beta")
# Insère le texte "alpha" à la position "0" de mots.
mots.insert(0, "alpha")
# Crée une boucle pour chaque mot de mots.
for mot in mots:
    # Affiche la chaîne mot.
    print(mot, end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée un bloc avec le fichier "exercice/python/journal/relu.txt" ouvert en écriture nommé sortie.
with open("exercice/python/journal/relu.txt", "w") as sortie:
    # Écris la chaîne mot dans le fichier sortie.
    sortie.write(mot)
    # Écris le texte "\n" dans le fichier sortie.
    sortie.write("\n")
# Crée un bloc avec le fichier "exercice/python/journal/relu.txt" ouvert en lecture nommé entree.
with open("exercice/python/journal/relu.txt", "r") as entree:
    # Crée une boucle pour chaque ligne ligne de entree.
    for ligne in entree:
        # Affiche la chaîne ligne.
        print(ligne, end="")
# Lis une saisie dans reponse.
reponse = input()
# Affiche la chaîne reponse.
print(reponse, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée le point d’entrée principal.
if __name__ == "__main__":
    # Affiche le texte "lancé".
    print("lancé", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
