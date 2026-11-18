// Déclare le paquetage ecole.
package ecole;
// Crée une classe nommée Etudiant qui hérite de Eleve.
public class Etudiant extends Eleve {
    // Crée un constructeur qui prend un int nommé age.
    public Etudiant(int age) {
        // Appelle le constructeur de la classe parente avec "age".
        super(age);
        // Affecte le texte "étudiant" à nom.
        nom = "étudiant";

    }
}
