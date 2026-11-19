-- Modifie la table lecteurs en donnant à age le résultat de "age + 1" là où "id = 2".
UPDATE lecteurs
SET age = (age + 1)
WHERE id = 2;

-- Supprime de la table emprunts les lignes où "id = 7".
DELETE FROM emprunts
WHERE id = 7;

-- Crée une vue nommée titres qui lit la colonne titre de la table livres.
CREATE VIEW titres AS
SELECT titre
FROM livres

;

-- Ouvre une transaction.
START TRANSACTION;

-- Supprime toutes les lignes de la table emprunts.
DELETE FROM emprunts;

-- Annule la transaction.
ROLLBACK;

-- Crée une requête qui compte les lignes de la table emprunts.
SELECT COUNT(*)
FROM emprunts

;

-- Supprime la vue titres.
DROP VIEW titres;

-- Crée un rôle nommé bibliothecaire.
CREATE ROLE bibliothecaire;

-- Accorde la lecture de la table livres au rôle bibliothecaire.
GRANT SELECT ON livres TO bibliothecaire;

-- Retire la lecture de la table livres au rôle bibliothecaire.
REVOKE SELECT ON livres FROM bibliothecaire;
