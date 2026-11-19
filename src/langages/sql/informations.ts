/** Les informations pédagogiques **passives** de SQL-A.
 *
 * Elles n'incrémentent **jamais** le compteur d'avertissements : c'est un
 * canal distinct, et les confondre ferait d'une explication un reproche.
 *
 * Quinze codes. Trois corrigent une règle apprise ailleurs, deux disent une
 * **lacune de A** plutôt qu'une propriété de SQL, et une — la quinzième — a
 * été écrite après qu'un serveur réel a refusé une instruction que SQL-A
 * produisait.
 */
import type { InformationLangage } from '../registre.ts';
import type { GenreSql } from './instructions.ts';

const TEXTES: Readonly<Record<string, string>> = {
  SQL_IDENTIFIANT_REPLIE:
    'Un identifiant non entouré de guillemets n’est pas lu tel quel : PostgreSQL le replie en '
    + 'MINUSCULES, le SQL standard en MAJUSCULES. « Eleves », « eleves » et « ELEVES » désignent '
    + 'donc la même table, alors que « "Eleves" » en désigne une autre. SQL-A écrit l’identifiant '
    + 'tel que vous l’avez donné et ne le met jamais entre guillemets.',
  SQL_AUCUNE_VERIFICATION:
    'SQL-A ne sait pas si cette table, cette colonne ou ce rôle existent, ni de quel type ils '
    + 'sont. Une instruction acceptée n’est pas une instruction qui s’exécutera.',
  SQL_MODIFICATION_SANS_FILTRE:
    'Cette instruction touche TOUTES les lignes de la table. C’est ce que votre phrase a demandé, '
    + 'et SQL-A n’ajoutera jamais de filtre à votre place : un WHERE inventé changerait le sens '
    + 'de votre ordre.',
  SQL_NUL_NEST_PAS_UNE_VALEUR:
    'NULL n’est pas une valeur mais une absence : « colonne = NULL » n’est jamais vrai, même '
    + 'quand la colonne est nulle. C’est pourquoi « est nulle » a sa propre phrase, qui écrit '
    + '« IS NULL ».',
  SQL_COMPTE_ETOILE:
    'COUNT(*) compte les lignes ; COUNT(colonne) compte les lignes dont cette colonne n’est pas '
    + 'nulle. Les deux chiffres diffèrent dès que la colonne admet des nuls, et c’est pourquoi '
    + 'les deux ont leur phrase.',
  SQL_PRIORITE_ET_OU:
    'AND lie plus fort que OR : « a OR b AND c » se lit « a OR (b AND c) ». SQL-A n’ajoute aucune '
    + 'parenthèse que vous n’avez pas demandée.',
  SQL_PRODUIT_CARTESIEN:
    'Une jointure sans condition associe chaque ligne de gauche à chaque ligne de droite : 1 000 '
    + 'lignes de chaque côté en font un million. C’est une construction légitime, et ce n’est '
    + 'presque jamais ce que l’on voulait.',
  SQL_EXISTE_IGNORE_LA_PROJECTION:
    'EXISTS ne regarde pas CE QUE la sous-requête lit, seulement s’il en sort au moins une ligne. '
    + 'Le « SELECT 1 » écrit ici n’est pas un choix de SQL-A : la syntaxe exige une projection, et '
    + '1 est la moins trompeuse.',
  SQL_ORDRE_NON_GARANTI:
    'Sans ORDER BY, l’ordre des lignes n’est pas défini. Il peut sembler stable pendant des mois '
    + 'puis changer : rien ne le promet.',
  SQL_GROUPE_EXIGE_LA_PROJECTION:
    'Une colonne lue sans agrégat doit figurer dans le GROUP BY. SQL-A ne vérifie pas cette règle '
    + 'et ne l’ajoutera pas : c’est le serveur qui refusera, et c’est à vous de l’écrire.',
  SQL_INDEX_HORS_STANDARD:
    'CREATE INDEX ne fait pas partie du SQL standard, bien qu’aucune base réelle ne s’en passe. '
    + 'La syntaxe écrite ici est celle que PostgreSQL accepte.',
  SQL_TRANSACTION_ANNULABLE:
    'Tant que COMMIT n’est pas écrit, tout ce que cette transaction modifie peut être défait par '
    + 'ROLLBACK — y compris une suppression de toutes les lignes, et y compris, en PostgreSQL, un '
    + 'changement de structure. Rien n’est encore définitif.',
  SQL_TRANSACTION_DEFINITIVE:
    'COMMIT rend les modifications DÉFINITIVES : ROLLBACK ne les défera plus, et aucune phrase de '
    + 'SQL-A ne les annulera. C’est la frontière entre ce qui est encore annulable et ce qui ne '
    + 'l’est plus.',
  SQL_TRANSACTION_NON_FERMEE:
    'Une transaction ouverte et jamais validée ni annulée laisse ses verrous en place. SQL-A '
    + 'n’ajoute ni COMMIT ni ROLLBACK à votre place.',
  SQL_DROIT_CUMULATIF:
    'Un droit accordé s’ajoute à ceux qui existent déjà ; il ne les remplace pas. Lire les droits '
    + 'en vigueur demande d’interroger le catalogue de la base, ce que SQL-A ne fait pas.',
  SQL_IDENTITE_EXIGE_NON_NUL:
    'Cette instruction échouera si la colonne n’est pas déjà déclarée NOT NULL : PostgreSQL '
    + 'l’exige avant d’ajouter une identité. Écrivez d’abord « Exige que … ne soit jamais '
    + 'nulle. ». SQL-A ne l’ajoute pas à votre place : l’ordre de vos instructions vous '
    + 'appartient.',
  SQL_AUCUNE_EXECUTION:
    'SQL-A écrit cette instruction dans votre fichier et ne l’exécute JAMAIS contre une base. '
    + 'Rien n’est joué sans que vous le lanciez vous-même, et SQL-A ne sait pas à quelle base ce '
    + 'fichier sera soumis — ni si elle contient dix lignes ou dix millions.',
};

/** Quelle information pour quel genre. Un genre peut en porter plusieurs ; un
 * genre sans information n'est pas un oubli, c'est qu'il n'y a rien de
 * particulier à dire. */
const PAR_GENRE: Readonly<Partial<Record<GenreSql, readonly string[]>>> = {
  SQL_TABLE_CREE: ['SQL_IDENTIFIANT_REPLIE', 'SQL_AUCUNE_VERIFICATION'],
  SQL_COLONNE_ENTIERE: ['SQL_AUCUNE_VERIFICATION'],
  SQL_COLONNE_TEXTE: ['SQL_AUCUNE_VERIFICATION'],
  SQL_REQUETE_COLONNE: ['SQL_ORDRE_NON_GARANTI'],
  SQL_REQUETE_COLONNES: ['SQL_ORDRE_NON_GARANTI'],
  SQL_REQUETE_TOUTES: ['SQL_ORDRE_NON_GARANTI'],
  SQL_FILTRE_NUL: ['SQL_NUL_NEST_PAS_UNE_VALEUR'],
  SQL_FILTRE_NON_NUL: ['SQL_NUL_NEST_PAS_UNE_VALEUR'],
  SQL_FILTRE_OU: ['SQL_PRIORITE_ET_OU'],
  SQL_ORDRE_NULS_FIN: ['SQL_NUL_NEST_PAS_UNE_VALEUR'],
  SQL_AGREGAT_COMPTE: ['SQL_COMPTE_ETOILE'],
  SQL_AGREGAT_COMPTE_COLONNE: ['SQL_COMPTE_ETOILE'],
  SQL_REQUETE_COLONNE_ET_COMPTE: ['SQL_GROUPE_EXIGE_LA_PROJECTION'],
  SQL_GROUPE: ['SQL_GROUPE_EXIGE_LA_PROJECTION'],
  SQL_JOINTURE_CROISEE: ['SQL_PRODUIT_CARTESIEN'],
  SQL_SOUS_REQUETE_EXISTE: ['SQL_EXISTE_IGNORE_LA_PROJECTION'],
  SQL_MODIFIE_TOUTES: ['SQL_MODIFICATION_SANS_FILTRE', 'SQL_AUCUNE_EXECUTION'],
  SQL_SUPPRIME_TOUTES: ['SQL_MODIFICATION_SANS_FILTRE', 'SQL_AUCUNE_EXECUTION'],
  SQL_TABLE_SUPPRIME: ['SQL_AUCUNE_EXECUTION'],
  SQL_IDENTITE: ['SQL_IDENTITE_EXIGE_NON_NUL'],
  SQL_INDEX_CREE: ['SQL_INDEX_HORS_STANDARD'],
  SQL_TRANSACTION_OUVRE: ['SQL_TRANSACTION_ANNULABLE', 'SQL_TRANSACTION_NON_FERMEE'],
  SQL_TRANSACTION_VALIDE: ['SQL_TRANSACTION_DEFINITIVE'],
  SQL_TRANSACTION_ANNULE: ['SQL_TRANSACTION_ANNULABLE'],
  SQL_POINT_DE_REPRISE: ['SQL_TRANSACTION_ANNULABLE'],
  SQL_DROIT_LECTURE: ['SQL_DROIT_CUMULATIF'],
  SQL_DROIT_ECRITURE: ['SQL_DROIT_CUMULATIF'],
};

export const CODES_SQL: readonly string[] = Object.keys(TEXTES);

export function expliquerSql(kind: string, range: { start: number; end: number }): readonly InformationLangage[] {
  const codes = PAR_GENRE[kind as GenreSql];
  if (codes === undefined) return [];
  return codes.map(code => {
    const message = TEXTES[code];
    if (message === undefined) throw new Error('Information SQL sans texte : ' + code);
    return { code, severity: 'information' as const, range, message };
  });
}
