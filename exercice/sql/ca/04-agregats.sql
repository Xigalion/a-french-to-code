-- Crée une requête qui compte les lignes de la table emprunts.
SELECT COUNT(*)
FROM emprunts

;

-- Crée une requête qui compte les valeurs non nulles de la colonne rendu de la table emprunts.
SELECT COUNT(rendu)
FROM emprunts

;

-- Crée une requête qui lit la colonne lecteur et le nombre de lignes de la table emprunts.
SELECT lecteur
     , COUNT(*)
FROM emprunts
-- Regroupe les lignes par lecteur.
GROUP BY lecteur
-- Ne garde que les groupes de plus de 2 lignes.
HAVING COUNT(*) > 2
-- Ordonne les lignes par lecteur en ordre croissant.
ORDER BY lecteur ASC

;

-- Crée une requête qui lit la colonne lecteurs.nom de la table lecteurs.
SELECT lecteurs.nom
FROM lecteurs
-- Joins la table emprunts sur "emprunts.lecteur = lecteurs.id".
INNER JOIN emprunts ON emprunts.lecteur = lecteurs.id
-- Ordonne les lignes par lecteurs.nom en ordre croissant.
ORDER BY lecteurs.nom ASC

;

-- Crée une requête qui lit la colonne lecteurs.nom de la table lecteurs.
SELECT lecteurs.nom
FROM lecteurs
-- Joins la table emprunts en gardant toutes les lignes de gauche sur "emprunts.lecteur = lecteurs.id".
LEFT OUTER JOIN emprunts ON emprunts.lecteur = lecteurs.id
-- Ordonne les lignes par lecteurs.nom en ordre croissant.
ORDER BY lecteurs.nom ASC

;

-- Crée une requête qui calcule la moyenne de la colonne age de la table lecteurs.
SELECT AVG(age)
FROM lecteurs

;

-- Crée une requête qui cherche la plus grande valeur de la colonne age de la table lecteurs.
SELECT MAX(age)
FROM lecteurs

;

-- Crée une requête qui cherche la plus petite valeur de la colonne age de la table lecteurs.
SELECT MIN(age)
FROM lecteurs

;

-- Crée une requête qui somme la colonne age de la table lecteurs.
SELECT SUM(age)
FROM lecteurs

;
