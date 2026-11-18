// Déclare le paquetage ecole.
package ecole;
// Importe java.io.BufferedReader.
import java.io.BufferedReader;
// Importe java.io.FileReader.
import java.io.FileReader;
// Importe java.io.IOException.
import java.io.IOException;
// Importe java.io.PrintWriter.
import java.io.PrintWriter;
// Importe java.util.ArrayList.
import java.util.ArrayList;
// Importe java.util.HashMap.
import java.util.HashMap;
// Importe java.util.List.
import java.util.List;
// Importe java.util.Map.
import java.util.Map;
// Crée une classe nommée Promotion.
public class Promotion {
    // Crée la fonction principale.
    public static void main(String[] args) {
        // Déclare un tableau de type int nommé bulletins de dimension 3.
        int[] bulletins = new int[3];
        // Affecte la valeur 12 à l’élément "0" du tableau bulletins.
        bulletins[0] = 12;
        // Affecte la valeur 15 à l’élément "1" du tableau bulletins.
        bulletins[1] = 15;
        // Affecte la valeur 9 à l’élément "2" du tableau bulletins.
        bulletins[2] = 9;
        // Crée un bloc essaie avec un écrivain nommé sortie sur le fichier "notes.txt".
        try (PrintWriter sortie = new PrintWriter("notes.txt")) {
            // Écris le texte "12\n" dans le fichier sortie.
            sortie.print("12\n");
            // Écris le texte "15\n" dans le fichier sortie.
            sortie.print("15\n");
            // Écris le texte "9\n" dans le fichier sortie.
            sortie.print("9\n");

        }
        // Ajoute une branche attrape IOException nommée e.
        catch (IOException e) {
            // Affiche le texte "écriture impossible : ".
            System.out.print("écriture impossible : ");
            // Affiche le message de l’exception e.
            System.out.print(e.getMessage());

        }
        // Crée une liste de type int nommée notes.
        List<Integer> notes = new ArrayList<>();
        // Déclare une chaîne nommée ligne.
        String ligne;
        // Déclare un entier nommé valeur.
        int valeur;
        // Crée un bloc essaie avec un lecteur nommé lecteur sur le fichier "notes.txt".
        try (BufferedReader lecteur = new BufferedReader(new FileReader("notes.txt"))) {
            // Lis une ligne depuis le lecteur lecteur dans ligne.
            ligne = lecteur.readLine();
            // Affecte à valeur la conversion en entier de la chaîne ligne.
            valeur = Integer.parseInt(ligne);
            // Ajoute "valeur" à la fin de la liste notes.
            notes.add(valeur);
            // Lis une ligne depuis le lecteur lecteur dans ligne.
            ligne = lecteur.readLine();
            // Affecte à valeur la conversion en entier de la chaîne ligne.
            valeur = Integer.parseInt(ligne);
            // Ajoute "valeur" à la fin de la liste notes.
            notes.add(valeur);
            // Lis une ligne depuis le lecteur lecteur dans ligne.
            ligne = lecteur.readLine();
            // Affecte à valeur la conversion en entier de la chaîne ligne.
            valeur = Integer.parseInt(ligne);
            // Ajoute "valeur" à la fin de la liste notes.
            notes.add(valeur);

        }
        // Ajoute une branche attrape IOException nommée e.
        catch (IOException e) {
            // Affiche le texte "lecture impossible : ".
            System.out.print("lecture impossible : ");
            // Affiche le message de l’exception e.
            System.out.print(e.getMessage());

        }
        // Déclare un entier nommé totalTableau.
        int totalTableau;
        // Affecte la valeur 0 à totalTableau.
        totalTableau = 0;
        // Crée une boucle pour chaque int nommé b du tableau bulletins.
        for (int b : bulletins) {
            // Affecte à totalTableau le résultat numérique de "totalTableau + b".
            totalTableau = (totalTableau + b);

        }
        // Déclare un entier nommé totalListe.
        int totalListe;
        // Affecte la valeur 0 à totalListe.
        totalListe = 0;
        // Crée une boucle pour chaque int nommé v de la liste notes.
        for (int v : notes) {
            // Affecte à totalListe le résultat numérique de "totalListe + v".
            totalListe = (totalListe + v);

        }
        // Affiche le texte "total tableau = ".
        System.out.print("total tableau = ");
        // Affiche la valeur de totalTableau et passe à la ligne.
        System.out.println(totalTableau);
        // Affiche le texte "total liste = ".
        System.out.print("total liste = ");
        // Affiche la valeur de totalListe et passe à la ligne.
        System.out.println(totalListe);
        // Vérifie que "totalTableau == totalListe".
        assert totalTableau == totalListe;
        // Crée une table de type int nommée parNom avec des clés textuelles.
        Map<String, Integer> parNom = new HashMap<>();
        // Associe "totalTableau" à la clé "tableau" dans la table parNom.
        parNom.put("tableau", totalTableau);
        // Affecte à valeur la valeur de la clé "tableau" dans la table parNom.
        valeur = parNom.get("tableau");
        // Affiche le texte "relu dans la table = ".
        System.out.print("relu dans la table = ");
        // Affiche la valeur de valeur et passe à la ligne.
        System.out.println(valeur);
        // Déclare une chaîne nommée jour.
        String jour;
        // Affecte le texte "lundi" à jour.
        jour = "lundi";
        // Crée un aiguillage sur "jour".
        switch (jour) {
            // Ajoute un cas pour le texte "lundi".
            case "lundi":
            // Affiche le texte "début de semaine" et passe à la ligne.
            System.out.println("début de semaine");
            // Sors de l’aiguillage.
            break;
            // Ajoute le cas par défaut.
            default:
            // Affiche le texte "autre jour" et passe à la ligne.
            System.out.println("autre jour");
            // Sors de l’aiguillage.
            break;

        }
        // Crée un objet nommé premier de la classe Eleve avec "12".
        Eleve premier = new Eleve(12);
        // Appelle la méthode afficher de premier.
        premier.afficher();
        // Crée une variable de type Affichable nommée second comme un objet de la classe Etudiant avec "15".
        Affichable second = new Etudiant(15);
        // Appelle la méthode afficher de second.
        second.afficher();
        // Affecte à valeur le résultat de l’appel de la méthode getAge de premier.
        valeur = premier.getAge();
        // Affiche le texte "age du premier = ".
        System.out.print("age du premier = ");
        // Affiche la valeur de valeur et passe à la ligne.
        System.out.println(valeur);

    }

}
// Crée une classe interne nommée Compteur.
class Compteur {
    // Ajoute un champ de type int nommé total.
    int total;

}
