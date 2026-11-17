# Importe le module math.
import math
# Crée une fonction nommée moyenne qui retourne un double et prend un int nommé somme et un int nommé combien.
def moyenne(somme: int, combien: int) -> float:
    # Crée un bloc si "combien == 0".
    if combien == 0:
        # Retourne le résultat numérique de "0".
        return 0
    # Affecte à exacte le quotient réel de "somme" par "combien".
    exacte = (somme / combien)
    # Retourne le résultat numérique de "exacte".
    return exacte
# Crée une fonction nommée mention qui retourne un int et prend un int nommé note.
def mention(note: int) -> int:
    # Crée un filtrage sur "note".
    match note:
        # Ajoute un motif pour la valeur 20.
        case 20:
            # Retourne la valeur 3.
            return 3
        # Ajoute le motif qui accepte tout.
        case _:
            # Crée un bloc si "note >= 10".
            if note >= 10:
                # Retourne la valeur 2.
                return 2
            # Ajoute une branche sinon.
            else:
                # Retourne la valeur 1.
                return 1
# Crée une fonction nommée salue qui ne retourne rien et prend un str nommé nom valant le texte "éleve".
def salue(nom: str = "éleve") -> None:
    # Affiche le texte "bonjour ".
    print("bonjour ", end="")
    # Affiche la chaîne nom.
    print(nom, end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée un dictionnaire nommé carnet avec la clé "ada" valant "15".
carnet: dict = {"ada": 15}
# Affecte "12" à la clé "bob" de carnet.
carnet["bob"] = 12
# Affecte "20" à la clé "cleo" de carnet.
carnet["cleo"] = 20
# Crée une liste vide nommée noms.
noms: list = []
# Crée une liste vide nommée valeurs.
valeurs: list = []
# Crée un entier nommé somme de valeur 0.
somme = 0
# Crée une boucle pour la clé nom et la valeur note de carnet.
for nom, note in carnet.items():
    # Ajoute "nom" à la fin de noms.
    noms.append(nom)
    # Ajoute "note" à la fin de valeurs.
    valeurs.append(note)
    # Affecte à somme le résultat numérique de "somme + note".
    somme = (somme + note)
# Affecte à combien le nombre d’éléments de carnet.
combien = len(carnet)
# Affiche le texte "somme = ".
print("somme = ", end="")
# Affiche la valeur de somme.
print(somme, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à exacte le résultat de l’appel de moyenne avec "somme" et "combien".
exacte = moyenne(somme, combien)
# Affiche le texte "moyenne = ".
print("moyenne = ", end="")
# Affiche exacte en notation fixe avec 2 décimales.
print(f"{exacte:.2f}", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à entiere le quotient entier de "somme" par "combien".
entiere = (somme // combien)
# Affecte à reste le reste entier de "somme" par "combien".
reste = (somme % combien)
# Affiche le texte "entiere et reste = ".
print("entiere et reste = ", end="")
# Affiche entiere et reste séparés par le texte " ".
print(entiere, reste, sep=" ", end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un booléen nommé assez de valeur faux.
assez: bool = False
# Crée un bloc si "entiere >= 15".
if entiere >= 15:
    # Crée un booléen nommé assez de valeur vrai.
    assez: bool = True
# Crée un bloc si assez est sans valeur.
if assez is None:
    # Affiche le texte "indéterminé".
    print("indéterminé", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Ajoute une branche sinon.
else:
    # Affiche le texte "décidé".
    print("décidé", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée un bloc si "0" appartient à valeurs.
if 0 in valeurs:
    # Affiche le texte "un zéro".
    print("un zéro", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Crée une boucle pour i de "0" jusqu’avant "combien".
for i in range(0, combien):
    # Affecte à note la valeur de la clé "ada" de carnet.
    note = carnet["ada"]
    # Incrémente i.
    i += 1
# Crée une boucle pour l’indice rang et la valeur nom de noms.
for rang, nom in enumerate(noms):
    # Affiche la valeur de rang.
    print(rang, end="")
    # Affiche le texte " ".
    print(" ", end="")
    # Affiche la chaîne nom.
    print(nom, end="")
    # Affiche le texte " ".
    print(" ", end="")
    # Affecte à rangnote la valeur de la clé "ada" de carnet.
    rangnote = carnet["ada"]
    # Affiche la valeur de rangnote.
    print(rangnote, end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Affecte à liste les éléments de noms joints par le texte ", ".
liste = ", ".join(noms)
# Affecte à cri le texte de liste en majuscules.
cri = liste.upper()
# Affiche la chaîne cri.
print(cri, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à ligne le texte "total {somme}" avec le champ somme valant somme.
ligne = f"total {somme}"
# Affiche la chaîne ligne.
print(ligne, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Appelle salue avec le paramètre nom valant "cri".
salue(nom=cri)
# Crée un bloc avec le fichier "exercice/python/journal/carnet.txt" ouvert en écriture nommé sortie.
with open("exercice/python/journal/carnet.txt", "w") as sortie:
    # Écris le texte "fin" dans le fichier sortie.
    sortie.write("fin")
# Crée un bloc à essayer.
try:
    # Affecte à absente la valeur de la clé "zoe" de carnet.
    absente = carnet["zoe"]
# Ajoute une branche en cas d’erreur de type KeyError.
except KeyError:
    # Affiche le texte "clé absente".
    print("clé absente", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Affecte à rang le résultat de l’appel de mention avec "20".
rang = mention(20)
# Affiche le texte "mention de 20 = ".
print("mention de 20 = ", end="")
# Affiche la valeur de rang.
print(rang, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Affecte à rang le résultat de l’appel de mention avec "12".
rang = mention(12)
# Affiche le texte "mention de 12 = ".
print("mention de 12 = ", end="")
# Affiche la valeur de rang.
print(rang, end="")
# Affiche un retour à la ligne.
print("\n", end="")
