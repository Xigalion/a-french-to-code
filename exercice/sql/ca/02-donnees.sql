-- Insère dans la table livres une ligne dont id vaut 1 et titre vaut le texte "L’Étranger".
INSERT INTO livres (id, titre)
VALUES (1, 'L’Étranger');

-- Insère dans la table livres une ligne dont id vaut 2 et titre vaut le texte "La Peste".
INSERT INTO livres (id, titre)
VALUES (2, 'La Peste');

-- Insère dans la table livres une ligne dont id vaut 3 et titre vaut le texte "Le Rouge et le Noir".
INSERT INTO livres (id, titre)
VALUES (3, 'Le Rouge et le Noir');

-- Insère dans la table livres une ligne dont id vaut 4 et titre vaut le texte "Nadja".
INSERT INTO livres (id, titre)
VALUES (4, 'Nadja');

-- Insère dans la table livres une ligne dont id vaut 5 et titre vaut le texte "Aurélia".
INSERT INTO livres (id, titre)
VALUES (5, 'Aurélia');

-- Insère dans la table livres une ligne dont id vaut 6 et titre vaut le texte "Les Chants de Maldoror".
INSERT INTO livres (id, titre)
VALUES (6, 'Les Chants de Maldoror');

-- Insère dans la table lecteurs une ligne dont id vaut 1 et nom vaut le texte "O'Brien".
INSERT INTO lecteurs (id, nom)
VALUES (1, 'O''Brien');

-- Insère dans la table lecteurs une ligne dont id vaut 2 et nom vaut le texte "Zoe".
INSERT INTO lecteurs (id, nom)
VALUES (2, 'Zoe');

-- Insère dans la table lecteurs une ligne dont id vaut 3 et nom vaut le texte "Ali".
INSERT INTO lecteurs (id, nom)
VALUES (3, 'Ali');

-- Insère dans la table lecteurs une ligne dont id vaut 4 et nom vaut le texte "Lou".
INSERT INTO lecteurs (id, nom)
VALUES (4, 'Lou');

-- Modifie la table lecteurs en donnant à age la valeur 34 là où "id = 1".
UPDATE lecteurs
SET age = 34
WHERE id = 1;

-- Modifie la table lecteurs en donnant à age la valeur 20 là où "id = 2".
UPDATE lecteurs
SET age = 20
WHERE id = 2;

-- Modifie la table lecteurs en donnant à age la valeur 51 là où "id = 3".
UPDATE lecteurs
SET age = 51
WHERE id = 3;

-- Modifie la table lecteurs en donnant à age la valeur 17 là où "id = 4".
UPDATE lecteurs
SET age = 17
WHERE id = 4;

-- Insère dans la table emprunts une ligne dont id vaut 1 et lecteur vaut 1.
INSERT INTO emprunts (id, lecteur)
VALUES (1, 1);

-- Insère dans la table emprunts une ligne dont id vaut 2 et lecteur vaut 1.
INSERT INTO emprunts (id, lecteur)
VALUES (2, 1);

-- Insère dans la table emprunts une ligne dont id vaut 3 et lecteur vaut 1.
INSERT INTO emprunts (id, lecteur)
VALUES (3, 1);

-- Insère dans la table emprunts une ligne dont id vaut 4 et lecteur vaut 2.
INSERT INTO emprunts (id, lecteur)
VALUES (4, 2);

-- Insère dans la table emprunts une ligne dont id vaut 5 et lecteur vaut 2.
INSERT INTO emprunts (id, lecteur)
VALUES (5, 2);

-- Insère dans la table emprunts une ligne dont id vaut 6 et lecteur vaut 3.
INSERT INTO emprunts (id, lecteur)
VALUES (6, 3);

-- Insère dans la table emprunts une ligne dont id vaut 7 et lecteur vaut 3.
INSERT INTO emprunts (id, lecteur)
VALUES (7, 3);

-- Modifie la table emprunts en donnant à livre la valeur 1 là où "id = 1".
UPDATE emprunts
SET livre = 1
WHERE id = 1;

-- Modifie la table emprunts en donnant à livre la valeur 2 là où "id = 2".
UPDATE emprunts
SET livre = 2
WHERE id = 2;

-- Modifie la table emprunts en donnant à livre la valeur 3 là où "id = 3".
UPDATE emprunts
SET livre = 3
WHERE id = 3;

-- Modifie la table emprunts en donnant à livre la valeur 4 là où "id = 4".
UPDATE emprunts
SET livre = 4
WHERE id = 4;

-- Modifie la table emprunts en donnant à livre la valeur 5 là où "id = 5".
UPDATE emprunts
SET livre = 5
WHERE id = 5;

-- Modifie la table emprunts en donnant à livre la valeur 6 là où "id = 6".
UPDATE emprunts
SET livre = 6
WHERE id = 6;

-- Modifie la table emprunts en donnant à livre la valeur 1 là où "id = 7".
UPDATE emprunts
SET livre = 1
WHERE id = 7;

-- Modifie la table emprunts en donnant à rendu le texte "2026-01-05" là où "id = 1".
UPDATE emprunts
SET rendu = '2026-01-05'
WHERE id = 1;

-- Modifie la table emprunts en donnant à rendu le texte "2026-01-06" là où "id = 2".
UPDATE emprunts
SET rendu = '2026-01-06'
WHERE id = 2;

-- Modifie la table emprunts en donnant à rendu le texte "2026-01-07" là où "id = 4".
UPDATE emprunts
SET rendu = '2026-01-07'
WHERE id = 4;

-- Modifie la table emprunts en donnant à rendu le texte "2026-01-08" là où "id = 5".
UPDATE emprunts
SET rendu = '2026-01-08'
WHERE id = 5;

-- Modifie la table emprunts en donnant à rendu le texte "2026-01-09" là où "id = 6".
UPDATE emprunts
SET rendu = '2026-01-09'
WHERE id = 6;
