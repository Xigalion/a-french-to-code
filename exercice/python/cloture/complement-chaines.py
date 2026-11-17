# Crée une chaîne nommée brut avec le texte "  42  ".
brut: str = "  42  "
# Affecte à propre le texte de brut sans les espaces des extrémités.
propre = brut.strip()
# Affecte à n l’entier obtenu de propre.
n = int(propre)
# Affiche la valeur de n.
print(n, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Décrémente n.
n -= 1
# Affiche la valeur de n.
print(n, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à texte le texte obtenu de n.
texte = str(n)
# Affecte à mots les morceaux de texte séparés par le texte "1".
mots = texte.split("1")
# Affecte à combien le nombre d’éléments de mots.
combien = len(mots)
# Affiche la valeur de combien.
print(combien, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à ensemble le texte de propre suivi de texte.
ensemble = (propre + texte)
# Affiche la chaîne ensemble.
print(ensemble, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un nom appelé vide sans valeur.
vide = None
# Crée un bloc si vide est sans valeur.
if vide is None:
    # Affiche le texte "rien".
    print("rien", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée un bloc à essayer.
try:
    # Lève une erreur de type ValueError avec le texte "stop".
    raise ValueError("stop")
# Ajoute une branche en cas d’erreur de type ValueError.
except ValueError:
    # Affiche le texte "attrapée".
    print("attrapée", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée une valeur fixe par convention nommée TAILLE de valeur 10.
TAILLE = 10
# Affiche la valeur de TAILLE.
print(TAILLE, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affiche le type de TAILLE.
print(type(TAILLE), end="")
# Affiche un retour à la ligne.
print("\n", end="")
