/** Le catalogue pédagogique **natif** de SQL-A : les motifs, et le moteur.
 *
 * Lots S1 à S8. La forme est celle des catalogues Python et Java, et ce n'est
 * pas de la paresse : elle a été corrigée par des défauts réels, et repartir
 * d'une page blanche aurait été repayer ces corrections.
 *
 * Les trois leçons reprises telles quelles :
 *   1. les motifs sont compilés avec le drapeau **`d`**, pour les positions
 *      exactes des captures ;
 *   2. une seule entrée publique ;
 *   3. la règle de **texte en trop** est générale, pas une par motif.
 *
 * Et une quatrième, propre à SQL : les **genres** et les **formulations** sont
 * confrontés à `docs/phase4/catalogue-sql.json` par un test. La
 * spécification approuvée et le code doivent dire la même chose, et c'est un
 * test qui le vérifie, pas une relecture.
 */
import { parseStringLiteral } from '../../stringLiteral.ts';
import { analyserConditionSql, analyserExpressionSql, verifierNomsSql, nomSqlValide } from './expression.ts';
import type { AnalyseSql, DiagnosticSql, GenreSql, InstructionSql } from './instructions.ts';

const CAPTURES: Readonly<Record<string, string>> = {
  /** Un nom de table, de colonne, de vue, de rôle. Les points sont admis pour
   * une colonne qualifiée : `eleves.id` est un nom, pas deux. */
  NOM: '([A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)?)',
  ENTIER: '(-?[0-9]+)',
  COND: '"([^"]*)"',
  EXPR: '"([^"]*)"',
  TEXTE: '"((?:[^"\\\\]|\\\\.)*)"',
  MOT: '([^\\s.]+)',
};

type Motif = { readonly forme: string; readonly kind: GenreSql; readonly demonstration: string };

/** Les premiers mots qui font entrer une phrase dans ce catalogue. Hors de
 * cette liste, le module **décline** et le diagnostic du catalogue partagé
 * survit — « je ne reconnais pas » n'est pas « je refuse ». */
const AMORCES: readonly string[] = [
  'crée', 'créé', 'ajoute', 'supprime', 'renomme', 'insère', 'insere', 'modifie',
  'ne', 'exige', 'accepte', 'ordonne', 'place', 'ignore', 'regroupe', 'joins',
  'lis', 'retire', 'fais', 'donne', 'ouvre', 'valide', 'annule', 'pose',
  'reviens', 'accorde', 'intersecte',
];

export const MOTIFS: readonly Motif[] = [
  // ======================= domaine 1 — tables, colonnes, types ==========
  { forme: 'Crée une table nommée {NOM} avec une colonne entière nommée {NOM}',
    kind: 'SQL_TABLE_CREE',
    demonstration: 'Crée une table nommée eleves avec une colonne entière nommée id.' },
  { forme: 'Ajoute à la table {NOM} une colonne entière nommée {NOM}',
    kind: 'SQL_COLONNE_ENTIERE',
    demonstration: 'Ajoute à la table eleves une colonne entière nommée age.' },
  { forme: 'Ajoute à la table {NOM} une colonne de texte nommée {NOM} de longueur {ENTIER}',
    kind: 'SQL_COLONNE_TEXTE',
    demonstration: 'Ajoute à la table eleves une colonne de texte nommée nom de longueur 50.' },
  { forme: 'Ajoute à la table {NOM} une colonne décimale nommée {NOM} de précision {ENTIER} et d’échelle {ENTIER}',
    kind: 'SQL_COLONNE_DECIMALE',
    demonstration: 'Ajoute à la table notes une colonne décimale nommée valeur de précision 4 et d’échelle 2.' },
  { forme: 'Ajoute à la table {NOM} une colonne booléenne nommée {NOM}',
    kind: 'SQL_COLONNE_BOOLEENNE',
    demonstration: 'Ajoute à la table eleves une colonne booléenne nommée actif.' },
  { forme: 'Ajoute à la table {NOM} une colonne de date nommée {NOM}',
    kind: 'SQL_COLONNE_DATE',
    demonstration: 'Ajoute à la table emprunts une colonne de date nommée pris.' },
  { forme: 'Ajoute à la table {NOM} une colonne d’horodatage nommée {NOM}',
    kind: 'SQL_COLONNE_HORODATAGE',
    demonstration: 'Ajoute à la table emprunts une colonne d’horodatage nommée cree.' },
  { forme: 'Renomme la colonne {NOM} de la table {NOM} en {NOM}',
    kind: 'SQL_COLONNE_RENOMME',
    demonstration: 'Renomme la colonne nom de la table eleves en nom_complet.' },
  { forme: 'Supprime la colonne {NOM} de la table {NOM}',
    kind: 'SQL_COLONNE_SUPPRIME',
    demonstration: 'Supprime la colonne actif de la table eleves.' },
  { forme: 'Supprime la table {NOM}', kind: 'SQL_TABLE_SUPPRIME',
    demonstration: 'Supprime la table eleves.' },
  { forme: 'Renomme la table {NOM} en {NOM}', kind: 'SQL_TABLE_RENOMME',
    demonstration: 'Renomme la table eleves en etudiants.' },
  { forme: 'Crée un domaine nommé {NOM} fondé sur le type entier', kind: 'SQL_DOMAINE_CREE',
    demonstration: 'Crée un domaine nommé note fondé sur le type entier.' },
  { forme: 'Crée un schéma nommé {NOM}', kind: 'SQL_SCHEMA_CREE',
    demonstration: 'Crée un schéma nommé ecole.' },

  // ======================= domaine 2 — interrogation ====================
  { forme: 'Crée une requête qui lit la colonne {NOM} de la table {NOM}',
    kind: 'SQL_REQUETE_COLONNE',
    demonstration: 'Crée une requête qui lit la colonne nom de la table eleves.' },
  { forme: 'Crée une requête qui lit les colonnes {NOM} et {NOM} de la table {NOM}',
    kind: 'SQL_REQUETE_COLONNES',
    demonstration: 'Crée une requête qui lit les colonnes nom et age de la table eleves.' },
  { forme: 'Crée une requête qui lit toutes les colonnes de la table {NOM}',
    kind: 'SQL_REQUETE_TOUTES',
    demonstration: 'Crée une requête qui lit toutes les colonnes de la table eleves.' },
  { forme: 'Crée une requête qui lit les valeurs distinctes de la colonne {NOM} de la table {NOM}',
    kind: 'SQL_REQUETE_DISTINCT',
    demonstration: 'Crée une requête qui lit les valeurs distinctes de la colonne ville de la table eleves.' },
  { forme: 'Crée une requête qui lit la colonne {NOM} de la table {NOM} sous le nom {NOM}',
    kind: 'SQL_REQUETE_ALIAS_COLONNE',
    demonstration: 'Crée une requête qui lit la colonne nom de la table eleves sous le nom intitule.' },
  { forme: 'Crée une requête qui lit le résultat de {EXPR} de la table {NOM} sous le nom {NOM}',
    kind: 'SQL_REQUETE_EXPRESSION',
    demonstration: 'Crée une requête qui lit le résultat de "age + 1" de la table eleves sous le nom futur.' },
  { forme: 'Crée une requête qui lit la colonne {NOM} de la table {NOM} désignée par {NOM}',
    kind: 'SQL_REQUETE_ALIAS_TABLE',
    demonstration: 'Crée une requête qui lit la colonne e.nom de la table eleves désignée par e.' },
  { forme: 'Lis aussi la colonne {NOM}', kind: 'SQL_PROJECTION_AJOUTE',
    demonstration: 'Lis aussi la colonne age.' },

  // ======================= domaine 3 — filtrage =========================
  { forme: 'Ne garde que les lignes où {COND}', kind: 'SQL_FILTRE_CONDITION',
    demonstration: 'Ne garde que les lignes où "age > 18".' },
  { forme: 'Ne garde que les lignes où {NOM} est nulle', kind: 'SQL_FILTRE_NUL',
    demonstration: 'Ne garde que les lignes où rendu est nulle.' },
  { forme: 'Ne garde que les lignes où {NOM} n’est pas nulle', kind: 'SQL_FILTRE_NON_NUL',
    demonstration: 'Ne garde que les lignes où rendu n’est pas nulle.' },
  { forme: 'Ne garde que les lignes où {NOM} vaut le texte {TEXTE}', kind: 'SQL_FILTRE_TEXTE',
    demonstration: 'Ne garde que les lignes où ville vaut le texte "Lyon".' },
  { forme: 'Ne garde que les lignes où {NOM} commence par {TEXTE}', kind: 'SQL_FILTRE_COMMENCE',
    demonstration: 'Ne garde que les lignes où nom commence par "O".' },
  { forme: 'Ne garde que les lignes où {NOM} contient {TEXTE}', kind: 'SQL_FILTRE_CONTIENT',
    demonstration: 'Ne garde que les lignes où nom contient "ie".' },
  { forme: 'Ne garde que les lignes où {NOM} est comprise entre {ENTIER} et {ENTIER}',
    kind: 'SQL_FILTRE_INTERVALLE',
    demonstration: 'Ne garde que les lignes où age est comprise entre 15 et 20.' },
  { forme: 'Ne garde que les lignes où {NOM} vaut {ENTIER} ou {ENTIER}', kind: 'SQL_FILTRE_PARMI',
    demonstration: 'Ne garde que les lignes où age vaut 15 ou 20.' },
  { forme: 'Exige aussi que {COND}', kind: 'SQL_FILTRE_ET',
    demonstration: 'Exige aussi que "age < 30".' },
  { forme: 'Accepte aussi les lignes où {COND}', kind: 'SQL_FILTRE_OU',
    demonstration: 'Accepte aussi les lignes où "age > 60".' },

  // ======================= domaine 4 — tri et limitation ================
  { forme: 'Ordonne les lignes par {NOM} en ordre croissant', kind: 'SQL_ORDRE_CROISSANT',
    demonstration: 'Ordonne les lignes par nom en ordre croissant.' },
  { forme: 'Ordonne les lignes par {NOM} en ordre décroissant', kind: 'SQL_ORDRE_DECROISSANT',
    demonstration: 'Ordonne les lignes par age en ordre décroissant.' },
  { forme: 'Ordonne ensuite les lignes par {NOM} en ordre croissant', kind: 'SQL_ORDRE_ENSUITE',
    demonstration: 'Ordonne ensuite les lignes par nom en ordre croissant.' },
  { forme: 'Place les valeurs nulles en dernier', kind: 'SQL_ORDRE_NULS_FIN',
    demonstration: 'Place les valeurs nulles en dernier.' },
  { forme: 'Ne garde que les {ENTIER} premières lignes', kind: 'SQL_LIMITE',
    demonstration: 'Ne garde que les 3 premières lignes.' },
  { forme: 'Ignore les {ENTIER} premières lignes', kind: 'SQL_DECALAGE',
    demonstration: 'Ignore les 2 premières lignes.' },

  // ======================= domaine 5 — agrégats =========================
  { forme: 'Crée une requête qui compte les lignes de la table {NOM}', kind: 'SQL_AGREGAT_COMPTE',
    demonstration: 'Crée une requête qui compte les lignes de la table eleves.' },
  { forme: 'Crée une requête qui compte les valeurs non nulles de la colonne {NOM} de la table {NOM}',
    kind: 'SQL_AGREGAT_COMPTE_COLONNE',
    demonstration: 'Crée une requête qui compte les valeurs non nulles de la colonne rendu de la table emprunts.' },
  { forme: 'Crée une requête qui somme la colonne {NOM} de la table {NOM}', kind: 'SQL_AGREGAT_SOMME',
    demonstration: 'Crée une requête qui somme la colonne age de la table eleves.' },
  { forme: 'Crée une requête qui calcule la moyenne de la colonne {NOM} de la table {NOM}',
    kind: 'SQL_AGREGAT_MOYENNE',
    demonstration: 'Crée une requête qui calcule la moyenne de la colonne age de la table eleves.' },
  { forme: 'Crée une requête qui cherche la plus petite valeur de la colonne {NOM} de la table {NOM}',
    kind: 'SQL_AGREGAT_MIN',
    demonstration: 'Crée une requête qui cherche la plus petite valeur de la colonne age de la table eleves.' },
  { forme: 'Crée une requête qui cherche la plus grande valeur de la colonne {NOM} de la table {NOM}',
    kind: 'SQL_AGREGAT_MAX',
    demonstration: 'Crée une requête qui cherche la plus grande valeur de la colonne age de la table eleves.' },
  { forme: 'Crée une requête qui lit la colonne {NOM} et le nombre de lignes de la table {NOM}',
    kind: 'SQL_REQUETE_COLONNE_ET_COMPTE',
    demonstration: 'Crée une requête qui lit la colonne ville et le nombre de lignes de la table eleves.' },
  { forme: 'Regroupe les lignes par {NOM}', kind: 'SQL_GROUPE',
    demonstration: 'Regroupe les lignes par ville.' },
  { forme: 'Regroupe ensuite les lignes par {NOM}', kind: 'SQL_GROUPE_ENSUITE',
    demonstration: 'Regroupe ensuite les lignes par age.' },
  { forme: 'Ne garde que les groupes où {COND}', kind: 'SQL_GROUPE_FILTRE',
    demonstration: 'Ne garde que les groupes où "age > 18".' },
  { forme: 'Ne garde que les groupes de plus de {ENTIER} lignes', kind: 'SQL_GROUPE_FILTRE_COMPTE',
    demonstration: 'Ne garde que les groupes de plus de 1 lignes.' },

  // ======================= domaine 6 — jointures ========================
  { forme: 'Joins la table {NOM} sur {COND}', kind: 'SQL_JOINTURE_INTERNE',
    demonstration: 'Joins la table emprunts sur "emprunts.eleve = eleves.id".' },
  { forme: 'Joins la table {NOM} désignée par {NOM} sur {COND}', kind: 'SQL_JOINTURE_INTERNE_ALIAS',
    demonstration: 'Joins la table emprunts désignée par m sur "m.eleve = eleves.id".' },
  { forme: 'Joins la table {NOM} en gardant toutes les lignes de gauche sur {COND}',
    kind: 'SQL_JOINTURE_GAUCHE',
    demonstration: 'Joins la table emprunts en gardant toutes les lignes de gauche sur "emprunts.eleve = eleves.id".' },
  { forme: 'Joins la table {NOM} en gardant toutes les lignes de droite sur {COND}',
    kind: 'SQL_JOINTURE_DROITE',
    demonstration: 'Joins la table emprunts en gardant toutes les lignes de droite sur "emprunts.eleve = eleves.id".' },
  { forme: 'Joins la table {NOM} en gardant toutes les lignes des deux côtés sur {COND}',
    kind: 'SQL_JOINTURE_COMPLETE',
    demonstration: 'Joins la table emprunts en gardant toutes les lignes des deux côtés sur "emprunts.eleve = eleves.id".' },
  { forme: 'Joins la table {NOM} sans condition', kind: 'SQL_JOINTURE_CROISEE',
    demonstration: 'Joins la table villes sans condition.' },

  // ======================= domaine 7 — sous-requêtes, ensembles =========
  { forme: 'Ne garde que les lignes où {NOM} figure parmi les {NOM} de la table {NOM}',
    kind: 'SQL_SOUS_REQUETE_PARMI',
    demonstration: 'Ne garde que les lignes où id figure parmi les eleve de la table emprunts.' },
  { forme: 'Ne garde que les lignes pour lesquelles il existe une ligne de la table {NOM} où {COND}',
    kind: 'SQL_SOUS_REQUETE_EXISTE',
    demonstration: 'Ne garde que les lignes pour lesquelles il existe une ligne de la table emprunts où "emprunts.eleve = eleves.id".' },
  { forme: 'Crée une requête fondée sur l’expression de table nommée {NOM} qui lit la colonne {NOM} de la table {NOM}',
    kind: 'SQL_EXPRESSION_TABLE',
    demonstration: 'Crée une requête fondée sur l’expression de table nommée majeurs qui lit la colonne id de la table eleves.' },
  { forme: 'Ajoute sans doublon les {NOM} de la table {NOM}', kind: 'SQL_UNION_SANS_DOUBLON',
    demonstration: 'Ajoute sans doublon les nom de la table anciens.' },
  { forme: 'Ajoute avec les doublons les {NOM} de la table {NOM}', kind: 'SQL_UNION_AVEC_DOUBLONS',
    demonstration: 'Ajoute avec les doublons les nom de la table anciens.' },
  { forme: 'Ne garde que ce qui figure aussi parmi les {NOM} de la table {NOM}',
    kind: 'SQL_INTERSECTION',
    demonstration: 'Ne garde que ce qui figure aussi parmi les nom de la table anciens.' },
  { forme: 'Retire ce qui figure parmi les {NOM} de la table {NOM}', kind: 'SQL_DIFFERENCE',
    demonstration: 'Retire ce qui figure parmi les nom de la table anciens.' },

  // ======================= domaine 8 — modification =====================
  { forme: 'Insère dans la table {NOM} une ligne dont {NOM} vaut {ENTIER}',
    kind: 'SQL_INSERE_UNE_COLONNE',
    demonstration: 'Insère dans la table eleves une ligne dont id vaut 1.' },
  { forme: 'Insère dans la table {NOM} une ligne dont {NOM} vaut le texte {TEXTE}',
    kind: 'SQL_INSERE_TEXTE',
    demonstration: 'Insère dans la table eleves une ligne dont nom vaut le texte "Zoe".' },
  { forme: 'Insère dans la table {NOM} une ligne dont {NOM} vaut {ENTIER} et {NOM} vaut {ENTIER}',
    kind: 'SQL_INSERE_DEUX_ENTIERS',
    demonstration: 'Insère dans la table emprunts une ligne dont id vaut 1 et lecteur vaut 2.' },
  { forme: 'Insère dans la table {NOM} une ligne dont {NOM} vaut {ENTIER} et {NOM} vaut le texte {TEXTE}',
    kind: 'SQL_INSERE_DEUX_COLONNES',
    demonstration: 'Insère dans la table eleves une ligne dont id vaut 1 et nom vaut le texte "Zoe".' },
  { forme: 'Insère dans la table {NOM} la colonne {NOM} lue dans la table {NOM}',
    kind: 'SQL_INSERE_DEPUIS_REQUETE',
    demonstration: 'Insère dans la table anciens la colonne nom lue dans la table eleves.' },
  { forme: 'Modifie la table {NOM} en donnant à {NOM} le texte {TEXTE} là où {COND}',
    kind: 'SQL_MODIFIE_TEXTE',
    demonstration: 'Modifie la table eleves en donnant à nom le texte "Ada" là où "id = 1".' },
  { forme: 'Modifie la table {NOM} en donnant à {NOM} la valeur {ENTIER} là où {COND}',
    kind: 'SQL_MODIFIE_VALEUR',
    demonstration: 'Modifie la table eleves en donnant à age la valeur 21 là où "id = 1".' },
  { forme: 'Modifie la table {NOM} en donnant à {NOM} le résultat de {EXPR} là où {COND}',
    kind: 'SQL_MODIFIE_EXPRESSION',
    demonstration: 'Modifie la table eleves en donnant à age le résultat de "age + 1" là où "id = 1".' },
  { forme: 'Modifie toutes les lignes de la table {NOM} en donnant à {NOM} la valeur {ENTIER}',
    kind: 'SQL_MODIFIE_TOUTES',
    demonstration: 'Modifie toutes les lignes de la table eleves en donnant à age la valeur 0.' },
  { forme: 'Supprime de la table {NOM} les lignes où {COND}', kind: 'SQL_SUPPRIME_LIGNES',
    demonstration: 'Supprime de la table eleves les lignes où "age < 10".' },
  { forme: 'Supprime toutes les lignes de la table {NOM}', kind: 'SQL_SUPPRIME_TOUTES',
    demonstration: 'Supprime toutes les lignes de la table eleves.' },

  // ======================= domaine 9 — intégrité, vues, transactions ====
  { forme: 'Fais de {NOM} la clé primaire de la table {NOM}, sous la contrainte nommée {NOM}',
    kind: 'SQL_CLE_PRIMAIRE',
    demonstration: 'Fais de id la clé primaire de la table eleves, sous la contrainte nommée pk_eleves.' },
  { forme: 'Fais de {NOM} une clé étrangère de la table {NOM} vers {NOM} de la table {NOM}, sous la contrainte nommée {NOM}',
    kind: 'SQL_CLE_ETRANGERE',
    demonstration: 'Fais de eleve une clé étrangère de la table emprunts vers id de la table eleves, sous la contrainte nommée fk_emprunts.' },
  { forme: 'Exige que {NOM} de la table {NOM} ne soit jamais nulle', kind: 'SQL_NON_NUL',
    demonstration: 'Exige que id de la table eleves ne soit jamais nulle.' },
  { forme: 'Exige que {NOM} de la table {NOM} soit unique, sous la contrainte nommée {NOM}',
    kind: 'SQL_UNIQUE',
    demonstration: 'Exige que nom de la table eleves soit unique, sous la contrainte nommée uq_eleves_nom.' },
  { forme: 'Exige de la table {NOM} que {COND}, sous la contrainte nommée {NOM}',
    kind: 'SQL_VERIFICATION',
    demonstration: 'Exige de la table eleves que "age >= 0", sous la contrainte nommée ck_eleves_age.' },
  { forme: 'Donne à {NOM} de la table {NOM} la valeur par défaut {ENTIER}', kind: 'SQL_DEFAUT',
    demonstration: 'Donne à age de la table eleves la valeur par défaut 0.' },
  { forme: 'Fais de {NOM} de la table {NOM} une identité engendrée par défaut', kind: 'SQL_IDENTITE',
    demonstration: 'Fais de id de la table eleves une identité engendrée par défaut.' },
  { forme: 'Supprime la contrainte {NOM} de la table {NOM}', kind: 'SQL_CONTRAINTE_SUPPRIME',
    demonstration: 'Supprime la contrainte pk_eleves de la table eleves.' },
  { forme: 'Crée une vue nommée {NOM} qui lit la colonne {NOM} de la table {NOM}',
    kind: 'SQL_VUE_CREE',
    demonstration: 'Crée une vue nommée noms qui lit la colonne nom de la table eleves.' },
  { forme: 'Supprime la vue {NOM}', kind: 'SQL_VUE_SUPPRIME',
    demonstration: 'Supprime la vue noms.' },
  { forme: 'Crée un index nommé {NOM} sur {NOM} de la table {NOM}', kind: 'SQL_INDEX_CREE',
    demonstration: 'Crée un index nommé ix_eleves_nom sur nom de la table eleves.' },
  { forme: 'Supprime l’index {NOM}', kind: 'SQL_INDEX_SUPPRIME',
    demonstration: 'Supprime l’index ix_eleves_nom.' },
  { forme: 'Ouvre une transaction', kind: 'SQL_TRANSACTION_OUVRE',
    demonstration: 'Ouvre une transaction.' },
  { forme: 'Valide la transaction', kind: 'SQL_TRANSACTION_VALIDE',
    demonstration: 'Valide la transaction.' },
  { forme: 'Annule la transaction', kind: 'SQL_TRANSACTION_ANNULE',
    demonstration: 'Annule la transaction.' },
  { forme: 'Pose un point de reprise nommé {NOM}', kind: 'SQL_POINT_DE_REPRISE',
    demonstration: 'Pose un point de reprise nommé avant_purge.' },
  { forme: 'Reviens au point de reprise {NOM}', kind: 'SQL_RETOUR_AU_POINT',
    demonstration: 'Reviens au point de reprise avant_purge.' },
  { forme: 'Crée un rôle nommé {NOM}', kind: 'SQL_ROLE_CREE',
    demonstration: 'Crée un rôle nommé lecteur.' },
  { forme: 'Accorde la lecture de la table {NOM} au rôle {NOM}', kind: 'SQL_DROIT_LECTURE',
    demonstration: 'Accorde la lecture de la table eleves au rôle lecteur.' },
  { forme: 'Accorde l’insertion dans la table {NOM} au rôle {NOM}', kind: 'SQL_DROIT_ECRITURE',
    demonstration: 'Accorde l’insertion dans la table eleves au rôle lecteur.' },
  { forme: 'Retire la lecture de la table {NOM} au rôle {NOM}', kind: 'SQL_DROIT_RETIRE',
    demonstration: 'Retire la lecture de la table eleves au rôle lecteur.' },
];

/** Les formes **incomplètes** les plus probables. Sans elles, « Crée une
 * requête. » ne recevrait qu'un « formulation inconnue », qui n'apprend rien. */
const PROCHES: readonly { forme: string; code: string; message: string }[] = [
  { forme: 'Crée une table nommée {NOM}', code: 'SQL_TABLE_SANS_COLONNE',
    message: 'Il manque la première colonne. Une table sans aucune colonne n’est pas du SQL '
      + 'standard, et SQL-A n’en invente pas : ajoutez « avec une colonne entière nommée … ».' },
  { forme: 'Crée une requête', code: 'SQL_REQUETE_SANS_SOURCE',
    message: 'Il manque ce que la requête lit et où elle le lit. Par exemple : « Crée une '
      + 'requête qui lit la colonne nom de la table eleves. »' },
  { forme: 'Ajoute à la table {NOM} une colonne de texte nommée {NOM}',
    code: 'SQL_TEXTE_SANS_LONGUEUR',
    message: 'Il manque la longueur. En SQL standard, « varchar » sans longueur et « text » ne '
      + 'sont pas interchangeables, et choisir à votre place serait inventer : ajoutez « de '
      + 'longueur 50 ».' },
  { forme: 'Fais de {NOM} la clé primaire de la table {NOM}', code: 'SQL_CONTRAINTE_SANS_NOM',
    message: 'Il manque le nom de la contrainte. Sans lui, c’est le serveur qui en invente un, '
      + 'que vous ne pourrez pas citer pour la supprimer : ajoutez « , sous la contrainte nommée '
      + 'pk_… ».' },
  { forme: 'Supprime les lignes de la table {NOM}', code: 'SQL_SUPPRESSION_AMBIGUE',
    message: 'Cette phrase ne dit pas QUELLES lignes. Pour un filtre, « Supprime de la table … '
      + 'les lignes où "…". » ; pour toutes, « Supprime toutes les lignes de la table …. » — et '
      + 'il faut l’écrire, parce que SQL-A n’ajoute jamais de filtre et n’en retire jamais.' },
  { forme: 'Modifie la table {NOM} en donnant à {NOM} la valeur {ENTIER}',
    code: 'SQL_MODIFICATION_AMBIGUE',
    message: 'Cette phrase ne dit pas QUELLES lignes modifier. Ajoutez « là où "…" », ou dites '
      + '« Modifie toutes les lignes de la table … » si c’est bien ce que vous voulez.' },
];

function echapper(texte: string): string {
  return texte
    .replace(/[.*+?^${}()|[\]\\]/gu, caractere => '\\' + caractere)
    // Les deux apostrophes sont acceptées : un utilisateur tape l'une ou
    // l'autre selon son clavier, et refuser la droite serait refuser une
    // phrase juste.
    .replace(/['’]/gu, '[\'’]')
    .replace(/[ \t]+/gu, '[ \\t]+');
}

function compiler(forme: string): { motif: RegExp; types: string[] } {
  let corps = '';
  let position = 0;
  const types: string[] = [];
  while (position < forme.length) {
    const ouvrant = forme.indexOf('{', position);
    if (ouvrant === -1) { corps += echapper(forme.slice(position)); break; }
    corps += echapper(forme.slice(position, ouvrant));
    const fermant = forme.indexOf('}', ouvrant);
    if (fermant === -1) throw new Error('Motif mal formé : ' + forme);
    const nom = forme.slice(ouvrant + 1, fermant);
    const capture = CAPTURES[nom];
    if (capture === undefined) throw new Error('Capture inconnue dans : ' + forme);
    corps += capture;
    types.push(nom);
    position = fermant + 1;
  }
  // Le drapeau `d` donne les POSITIONS exactes des captures.
  return { motif: new RegExp('^[ \\t]*' + corps + '[ \\t]*\\.?[ \\t]*$', 'diu'), types };
}

const COMPILES = MOTIFS.map(entree => ({ ...entree, ...compiler(entree.forme) }));
const PROCHES_COMPILES = PROCHES.map(entree => ({ ...entree, ...compiler(entree.forme) }));

type Lues = {
  noms: string[]; entiers: string[]; textes: string[];
  conditions: import('../../condition.ts').Condition[];
  /** Séparée des conditions : une expression de projection n'est pas une
   * condition, et les mélanger avait produit un refus de rendu. */
  expressions: import('../../numericExpression.ts').NumericExpression[];
};

function minuscule(mot: string): string { return mot.toLocaleLowerCase('fr'); }

const refus = (code: string, message: string, debut: number, fin: number): DiagnosticSql =>
  ({ code, category: 'understanding', severity: 'error', message, range: { start: debut, end: fin } });

function lire(phrase: string, trouve: RegExpExecArray, types: string[]): Lues | DiagnosticSql {
  const lues: Lues = { noms: [], entiers: [], textes: [], conditions: [], expressions: [] };
  const budget = { count: 0 };
  for (const [index, type] of types.entries()) {
    const valeur = trouve[index + 1];
    const position = trouve.indices?.[index + 1];
    if (valeur === undefined || position === undefined) {
      throw new Error('Invariant interne : capture absente.');
    }
    const [debut, fin] = position;
    switch (type) {
      case 'NOM': {
        // Un nom qualifié `e.nom` est valide : chaque partie est vérifiée.
        for (const partie of valeur.split('.')) {
          if (!nomSqlValide(partie)) {
            return refus('SQL_MOT_RESERVE',
              `« ${partie} » est un mot réservé de SQL, ou n’est pas un nom valide. SQL-A `
              + 'n’entoure jamais un identifiant de guillemets — cela le rendrait sensible à la '
              + 'casse à votre insu —, il faut donc un autre nom.', debut, fin);
          }
        }
        lues.noms.push(valeur);
        break;
      }
      case 'ENTIER': lues.entiers.push(valeur); break;
      case 'TEXTE': {
        const lu = parseStringLiteral(phrase, debut - 1, fin + 1);
        if (lu.status === 'rejected') {
          return { ...lu.diagnostic, category: 'understanding', severity: 'error' };
        }
        lues.textes.push(lu.literal.value);
        break;
      }
      case 'COND': {
        const analyse = analyserConditionSql(phrase, debut, fin, 'Il manque la condition.', budget);
        if (analyse.status === 'rejected') {
          return { ...analyse.diagnostic, category: 'understanding', severity: 'error' };
        }
        const noms = verifierNomsSql(analyse.condition);
        if (noms !== undefined) return noms;
        lues.conditions.push(analyse.condition);
        break;
      }
      case 'EXPR': {
        const analyse = analyserExpressionSql(phrase, debut, fin, 'Il manque l’expression.', budget);
        if (analyse.status === 'rejected') {
          return { ...analyse.diagnostic, category: 'understanding', severity: 'error' };
        }
        const noms = verifierNomsSql(analyse.expression);
        if (noms !== undefined) return noms;
        lues.expressions.push(analyse.expression);
        break;
      }
      case 'MOT': break;
      default: throw new Error('Placeholder non traité : ' + type);
    }
  }
  return lues;
}

/** Construit l'intention. Les champs sont nommés comme dans
 * `InstructionSql`, et TypeScript vérifie l'exhaustivité. */
function construire(kind: GenreSql, c: Lues, phrase: string): InstructionSql | DiagnosticSql {
  const range = { start: 0, end: phrase.length };
  const n = (i: number): string => {
    const valeur = c.noms[i];
    if (valeur === undefined) throw new Error('Invariant interne : nom absent.');
    return valeur;
  };
  const e = (i: number): string => {
    const valeur = c.entiers[i];
    if (valeur === undefined) throw new Error('Invariant interne : entier absent.');
    return valeur;
  };
  const t = (i: number): string => {
    const valeur = c.textes[i];
    if (valeur === undefined) throw new Error('Invariant interne : texte absent.');
    return valeur;
  };
  const k = (i: number): import('../../condition.ts').Condition => {
    const valeur = c.conditions[i];
    if (valeur === undefined) throw new Error('Invariant interne : condition absente.');
    return valeur;
  };
  const x = (i: number): import('../../numericExpression.ts').NumericExpression => {
    const valeur = c.expressions[i];
    if (valeur === undefined) throw new Error('Invariant interne : expression absente.');
    return valeur;
  };
  switch (kind) {
    case 'SQL_TABLE_CREE': return { kind, table: n(0), colonne: n(1), range };
    case 'SQL_COLONNE_ENTIERE': return { kind, table: n(0), colonne: n(1), range };
    case 'SQL_COLONNE_TEXTE': return { kind, table: n(0), colonne: n(1), longueur: e(0), range };
    case 'SQL_COLONNE_DECIMALE':
      return { kind, table: n(0), colonne: n(1), precision: e(0), echelle: e(1), range };
    case 'SQL_COLONNE_BOOLEENNE': return { kind, table: n(0), colonne: n(1), range };
    case 'SQL_COLONNE_DATE': return { kind, table: n(0), colonne: n(1), range };
    case 'SQL_COLONNE_HORODATAGE': return { kind, table: n(0), colonne: n(1), range };
    case 'SQL_COLONNE_RENOMME': return { kind, colonne: n(0), table: n(1), nouvelle: n(2), range };
    case 'SQL_COLONNE_SUPPRIME': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_TABLE_SUPPRIME': return { kind, table: n(0), range };
    case 'SQL_TABLE_RENOMME': return { kind, table: n(0), nouvelle: n(1), range };
    case 'SQL_DOMAINE_CREE': return { kind, domaine: n(0), range };
    case 'SQL_SCHEMA_CREE': return { kind, schema: n(0), range };
    case 'SQL_REQUETE_COLONNE': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_REQUETE_COLONNES': return { kind, colonne: n(0), colonne2: n(1), table: n(2), range };
    case 'SQL_REQUETE_TOUTES': return { kind, table: n(0), range };
    case 'SQL_REQUETE_DISTINCT': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_REQUETE_ALIAS_COLONNE': return { kind, colonne: n(0), table: n(1), alias: n(2), range };
    case 'SQL_REQUETE_EXPRESSION': return { kind, expression: x(0), table: n(0), alias: n(1), range };
    case 'SQL_REQUETE_ALIAS_TABLE': return { kind, colonne: n(0), table: n(1), alias: n(2), range };
    case 'SQL_PROJECTION_AJOUTE': return { kind, colonne: n(0), range };
    case 'SQL_FILTRE_CONDITION': return { kind, condition: k(0), range };
    case 'SQL_FILTRE_NUL': return { kind, colonne: n(0), range };
    case 'SQL_FILTRE_NON_NUL': return { kind, colonne: n(0), range };
    case 'SQL_FILTRE_TEXTE': return { kind, colonne: n(0), texte: t(0), range };
    case 'SQL_FILTRE_COMMENCE': return { kind, colonne: n(0), texte: t(0), range };
    case 'SQL_FILTRE_CONTIENT': return { kind, colonne: n(0), texte: t(0), range };
    case 'SQL_FILTRE_INTERVALLE': return { kind, colonne: n(0), bas: e(0), haut: e(1), range };
    case 'SQL_FILTRE_PARMI': return { kind, colonne: n(0), bas: e(0), haut: e(1), range };
    case 'SQL_FILTRE_ET': return { kind, condition: k(0), range };
    case 'SQL_FILTRE_OU': return { kind, condition: k(0), range };
    case 'SQL_ORDRE_CROISSANT': return { kind, colonne: n(0), range };
    case 'SQL_ORDRE_DECROISSANT': return { kind, colonne: n(0), range };
    case 'SQL_ORDRE_ENSUITE': return { kind, colonne: n(0), range };
    case 'SQL_ORDRE_NULS_FIN': return { kind, range };
    case 'SQL_LIMITE': return { kind, combien: e(0), range };
    case 'SQL_DECALAGE': return { kind, combien: e(0), range };
    case 'SQL_AGREGAT_COMPTE': return { kind, table: n(0), range };
    case 'SQL_AGREGAT_COMPTE_COLONNE': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_AGREGAT_SOMME': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_AGREGAT_MOYENNE': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_AGREGAT_MIN': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_AGREGAT_MAX': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_REQUETE_COLONNE_ET_COMPTE': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_GROUPE': return { kind, colonne: n(0), range };
    case 'SQL_GROUPE_ENSUITE': return { kind, colonne: n(0), range };
    case 'SQL_GROUPE_FILTRE': return { kind, condition: k(0), range };
    case 'SQL_GROUPE_FILTRE_COMPTE': return { kind, combien: e(0), range };
    case 'SQL_JOINTURE_INTERNE': return { kind, table: n(0), condition: k(0), range };
    case 'SQL_JOINTURE_INTERNE_ALIAS':
      return { kind, table: n(0), alias: n(1), condition: k(0), range };
    case 'SQL_JOINTURE_GAUCHE': return { kind, table: n(0), condition: k(0), range };
    case 'SQL_JOINTURE_DROITE': return { kind, table: n(0), condition: k(0), range };
    case 'SQL_JOINTURE_COMPLETE': return { kind, table: n(0), condition: k(0), range };
    case 'SQL_JOINTURE_CROISEE': return { kind, table: n(0), range };
    case 'SQL_SOUS_REQUETE_PARMI':
      return { kind, colonne: n(0), colonne2: n(1), table: n(2), range };
    case 'SQL_SOUS_REQUETE_EXISTE': return { kind, table: n(0), condition: k(0), range };
    case 'SQL_EXPRESSION_TABLE': return { kind, alias: n(0), colonne: n(1), table: n(2), range };
    case 'SQL_UNION_SANS_DOUBLON': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_UNION_AVEC_DOUBLONS': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_INTERSECTION': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_DIFFERENCE': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_INSERE_UNE_COLONNE': return { kind, table: n(0), colonne: n(1), valeur: e(0), range };
    case 'SQL_INSERE_TEXTE': return { kind, table: n(0), colonne: n(1), texte: t(0), range };
    case 'SQL_INSERE_DEUX_COLONNES':
      return { kind, table: n(0), colonne: n(1), valeur: e(0), colonne2: n(2), texte: t(0), range };
    case 'SQL_INSERE_DEUX_ENTIERS':
      return { kind, table: n(0), colonne: n(1), valeur: e(0), colonne2: n(2), valeur2: e(1), range };
    case 'SQL_INSERE_DEPUIS_REQUETE':
      return { kind, table: n(0), colonne: n(1), table2: n(2), range };
    case 'SQL_MODIFIE_VALEUR':
      return { kind, table: n(0), colonne: n(1), valeur: e(0), condition: k(0), range };
    case 'SQL_MODIFIE_EXPRESSION':
      return { kind, table: n(0), colonne: n(1), expression: x(0), condition: k(0), range };
    case 'SQL_MODIFIE_TEXTE':
      return { kind, table: n(0), colonne: n(1), texte: t(0), condition: k(0), range };
    case 'SQL_MODIFIE_TOUTES': return { kind, table: n(0), colonne: n(1), valeur: e(0), range };
    case 'SQL_SUPPRIME_LIGNES': return { kind, table: n(0), condition: k(0), range };
    case 'SQL_SUPPRIME_TOUTES': return { kind, table: n(0), range };
    case 'SQL_CLE_PRIMAIRE': return { kind, colonne: n(0), table: n(1), contrainte: n(2), range };
    case 'SQL_CLE_ETRANGERE':
      return { kind, colonne: n(0), table: n(1), colonne2: n(2), table2: n(3), contrainte: n(4), range };
    case 'SQL_NON_NUL': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_UNIQUE': return { kind, colonne: n(0), table: n(1), contrainte: n(2), range };
    case 'SQL_VERIFICATION': return { kind, table: n(0), condition: k(0), contrainte: n(1), range };
    case 'SQL_DEFAUT': return { kind, colonne: n(0), table: n(1), valeur: e(0), range };
    case 'SQL_IDENTITE': return { kind, colonne: n(0), table: n(1), range };
    case 'SQL_CONTRAINTE_SUPPRIME': return { kind, contrainte: n(0), table: n(1), range };
    case 'SQL_VUE_CREE': return { kind, vue: n(0), colonne: n(1), table: n(2), range };
    case 'SQL_VUE_SUPPRIME': return { kind, vue: n(0), range };
    case 'SQL_INDEX_CREE': return { kind, index: n(0), colonne: n(1), table: n(2), range };
    case 'SQL_INDEX_SUPPRIME': return { kind, index: n(0), range };
    case 'SQL_TRANSACTION_OUVRE': return { kind, range };
    case 'SQL_TRANSACTION_VALIDE': return { kind, range };
    case 'SQL_TRANSACTION_ANNULE': return { kind, range };
    case 'SQL_POINT_DE_REPRISE': return { kind, point: n(0), range };
    case 'SQL_RETOUR_AU_POINT': return { kind, point: n(0), range };
    case 'SQL_ROLE_CREE': return { kind, role: n(0), range };
    case 'SQL_DROIT_LECTURE': return { kind, table: n(0), role: n(1), range };
    case 'SQL_DROIT_ECRITURE': return { kind, table: n(0), role: n(1), range };
    case 'SQL_DROIT_RETIRE': return { kind, table: n(0), role: n(1), range };
  }
}

/** Analyse une phrase du catalogue **SQL**.
 *
 * `undefined` signifie « ce n'est pas une phrase de ce catalogue » : l'appelant
 * garde alors le diagnostic du catalogue partagé. C'est la différence entre
 * « je ne reconnais pas » et « je reconnais et je refuse ». */
export function analyserCatalogueSql(phrase: string): AnalyseSql | undefined {
  const premier = /^[ \t]*([^\s.]+)/u.exec(phrase)?.[1];
  if (premier === undefined || !AMORCES.includes(minuscule(premier))) return undefined;

  for (const { motif, types, kind } of COMPILES) {
    const trouve = motif.exec(phrase);
    if (!trouve) continue;
    const lues = lire(phrase, trouve, types);
    if ('code' in lues) return { status: 'refuse', diagnostic: lues };
    const construite = construire(kind, lues, phrase);
    if ('code' in construite) {
      return { status: 'refuse',
        diagnostic: { ...construite, range: { start: 0, end: phrase.length } } };
    }
    return { status: 'reconnu', instruction: construite };
  }
  for (const { motif, code, message } of PROCHES_COMPILES) {
    if (!motif.exec(phrase)) continue;
    return { status: 'refuse',
      diagnostic: { code, category: 'understanding', severity: 'error', message,
        range: { start: 0, end: phrase.length } } };
  }
  return texteSupplementaire(phrase);
}

/** Du texte en trop après une phrase juste. Règle **générale** : on retire les
 * mots de la fin, un par un, et si ce qui reste est reconnu, le reste est du
 * texte supplémentaire. */
function texteSupplementaire(phrase: string): AnalyseSql | undefined {
  const mots = [...phrase.matchAll(/[^\s]+/gu)];
  for (let garde = mots.length - 1; garde >= 2; garde--) {
    const dernier = mots[garde - 1];
    const premierEnTrop = mots[garde];
    if (dernier === undefined || premierEnTrop === undefined) continue;
    const tete = phrase.slice(0, dernier.index + dernier[0].length);
    if (!COMPILES.some(compile => compile.motif.test(tete))) continue;
    return { status: 'refuse',
      diagnostic: { code: 'UNEXPECTED_TEXT', category: 'understanding', severity: 'error',
        message: 'Ce texte supplémentaire n’est pas accepté : la phrase est complète avant lui.',
        range: { start: premierEnTrop.index, end: phrase.length } } };
  }
  return undefined;
}

/** Les phrases de démonstration. Un test exige que chacune soit reconnue, et
 * que son rendu soit exactement celui de la spécification approuvée. */
export const EXEMPLES_SQL: readonly { phrase: string; kind: GenreSql }[] =
  MOTIFS.map(({ demonstration, kind }) => ({ phrase: demonstration, kind }));
