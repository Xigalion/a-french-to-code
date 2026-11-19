-- Insère dans la table lecteurs une ligne dont id vaut 99 et nom vaut le texte "Negatif".
INSERT INTO lecteurs (id, nom)
VALUES (99, 'Negatif');

-- Modifie la table lecteurs en donnant à age la valeur -5 là où "id = 99".
UPDATE lecteurs
SET age = -5
WHERE id = 99;
