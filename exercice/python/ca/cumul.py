# Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.
def somme(a: int, b: int) -> int:
    # Retourne le résultat numérique de "a + b".
    return (a + b)
# Crée un entier nommé total de valeur 0.
total = 0
# Crée un entier nommé i de valeur 1.
i = 1
# Crée une boucle tant que "i <= 5".
while i <= 5:
    # Affecte à total le résultat de l’appel de somme avec "total" et "i".
    total = somme(total, i)
    # Affecte à i le résultat numérique de "i + 1".
    i = (i + 1)
# Affiche le texte "total = ".
print("total = ", end="")
# Affiche la valeur de total.
print(total, end="")
# Affiche un retour à la ligne.
print("\n", end="")
# Crée un bloc si "total >= 15".
if total >= 15:
    # Affiche le texte "assez".
    print("assez", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
# Ajoute une branche sinon.
else:
    # Affiche le texte "pas assez".
    print("pas assez", end="")
    # Affiche un retour à la ligne.
    print("\n", end="")
