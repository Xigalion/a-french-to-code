-- Crée une requête qui lit la colonne nom de la table lecteurs.
SELECT nom
FROM lecteurs
-- Ne garde que les lignes où id figure parmi les lecteur de la table emprunts.
WHERE id IN (
        SELECT lecteur
        FROM emprunts
      )
-- Ordonne les lignes par nom en ordre croissant.
ORDER BY nom ASC

;

-- Crée une requête qui lit la colonne lecteurs.nom de la table lecteurs.
SELECT lecteurs.nom
FROM lecteurs
-- Ne garde que les lignes pour lesquelles il existe une ligne de la table emprunts où "emprunts.lecteur = lecteurs.id".
WHERE EXISTS (
        SELECT 1
        FROM emprunts
        WHERE emprunts.lecteur = lecteurs.id
      )
-- Ordonne les lignes par lecteurs.nom en ordre croissant.
ORDER BY lecteurs.nom ASC

;

-- Crée une requête qui lit la colonne id de la table lecteurs.
SELECT id
FROM lecteurs
-- Retire ce qui figure parmi les lecteur de la table emprunts.
EXCEPT
SELECT lecteur
FROM emprunts

;

-- Crée une requête fondée sur l’expression de table nommée majeurs qui lit la colonne id de la table lecteurs.
WITH majeurs AS (
  SELECT id
  FROM lecteurs
)
SELECT id
FROM majeurs

;

-- Crée une requête qui lit la colonne nom de la table lecteurs désignée par l.
SELECT nom
FROM lecteurs AS l

;
