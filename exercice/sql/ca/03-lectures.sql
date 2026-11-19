-- Crée une requête qui lit la colonne titre de la table livres.
SELECT titre
FROM livres

;

-- Crée une requête qui lit la colonne nom de la table lecteurs sous le nom lecteur.
SELECT nom AS lecteur
FROM lecteurs

;

-- Crée une requête qui lit les valeurs distinctes de la colonne lecteur de la table emprunts.
SELECT DISTINCT lecteur
FROM emprunts

;

-- Crée une requête qui lit les colonnes nom et age de la table lecteurs.
SELECT nom
     , age
FROM lecteurs
-- Ne garde que les lignes où "age > 18".
WHERE age > 18
-- Exige aussi que "age < 60".
  AND age < 60
-- Ordonne les lignes par age en ordre décroissant.
ORDER BY age DESC
-- Ne garde que les 2 premières lignes.
FETCH FIRST 2 ROWS ONLY

;

-- Crée une requête qui lit les colonnes id et rendu de la table emprunts.
SELECT id
     , rendu
FROM emprunts
-- Ordonne les lignes par rendu en ordre croissant.
ORDER BY rendu ASC
-- Place les valeurs nulles en dernier.
        NULLS LAST

;
