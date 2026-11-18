// Déclare une structure nommée Moyennes.
class Moyennes {
    // Crée la fonction principale.
    public static void main(String[] args) {
        // Déclare un tableau de type int nommé notes de dimension 5.
        int[] notes = new int[5];
        // Affecte la valeur 12 à l’élément "0" de notes.
        notes[0] = 12;
        // Affecte la valeur 15 à l’élément "1" de notes.
        notes[1] = 15;
        // Affecte la valeur 8 à l’élément "2" de notes.
        notes[2] = 8;
        // Affecte la valeur 17 à l’élément "3" de notes.
        notes[3] = 17;
        // Affecte la valeur 11 à l’élément "4" de notes.
        notes[4] = 11;
        // Crée un entier nommé total de valeur 0.
        int total = 0;
        // Crée un entier nommé i de valeur 0.
        int i = 0;
        // Crée une boucle tant que "i < 5".
        while (i < 5) {
            // Affecte à total le résultat numérique de "total + notes[i]".
            total = (total + notes[i]);
            // Affecte à i le résultat numérique de "i + 1".
            i = (i + 1);

        }
        // Affiche le texte "total = ".
        System.out.print("total = ");
        // Affiche la valeur de total.
        System.out.print(total);
        // Affiche un retour à la ligne.
        System.out.println();
        // Crée un entier nommé moyenne de valeur 0.
        int moyenne = 0;
        // Affecte à moyenne le résultat numérique de "total / 5".
        moyenne = (total / 5);
        // Affiche le texte "moyenne entière = ".
        System.out.print("moyenne entière = ");
        // Affiche la valeur de moyenne.
        System.out.print(moyenne);
        // Affiche un retour à la ligne.
        System.out.println();
        // Crée un entier nommé reste de valeur 0.
        int reste = 0;
        // Affecte à reste le résultat numérique de "total % 5".
        reste = (total % 5);
        // Affiche le texte "reste = ".
        System.out.print("reste = ");
        // Affiche la valeur de reste.
        System.out.print(reste);
        // Affiche un retour à la ligne.
        System.out.println();
        // Crée un bloc si "moyenne > 10".
        if (moyenne > 10) {
            // Affiche le texte "moyenne au-dessus de 10".
            System.out.print("moyenne au-dessus de 10");
            // Affiche un retour à la ligne.
            System.out.println();

        }
    }
}
