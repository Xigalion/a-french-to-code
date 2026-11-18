// Déclare le paquetage ecole.
package ecole;
// Crée une classe nommée Eleve qui implémente Affichable.
public class Eleve implements Affichable {
    // Ajoute un champ privé de type int nommé age.
    private int age;
    // Ajoute un champ de type chaîne nommé nom.
    String nom;
    // Crée un constructeur qui prend un int nommé age.
    public Eleve(int age) {
        // Affecte au champ age la valeur du paramètre age.
        this.age = age;
        // Affecte le texte "sans nom" à nom.
        nom = "sans nom";

    }
    // Crée une méthode publique nommée getAge qui retourne un int.
    public int getAge() {
        // Retourne le résultat de "age".
        return age;

    }
    // Crée une méthode redéfinie nommée afficher qui ne retourne rien.
    @Override
    public void afficher() {
        // Affiche la chaîne nom.
        System.out.print(nom);
        // Affiche le texte " a ".
        System.out.print(" a ");
        // Affiche la valeur de age
        System.out.print(age);
        // Affiche le texte " ans" et passe à la ligne.
        System.out.println(" ans");

    }
}
