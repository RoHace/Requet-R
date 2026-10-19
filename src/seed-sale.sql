-- Requêt'R — SECOND jeu de données : « l'export brut » (DECISIONS.md D027, documenté dans SCHEMA-EXPORT.md).
-- Ce fichier n'est PAS le seed principal : il se charge à sa place par nouvelleBase(SEED_SALE_SQL), pour le palier 5.
-- Il est VOLONTAIREMENT sale, et volontairement sans aucune contrainte : pas de clé primaire, pas de clé étrangère,
-- pas de CHECK, pas de NOT NULL, toutes les colonnes en TEXT, et aucun PRAGMA foreign_keys (donc 0, comme un export).
-- L'absence de contrainte est la raison pour laquelle les saletés sont entrées : c'est la première leçon du palier.
-- Chaque anomalie est VOULUE et vérifiée par verifier-seed-sale.mjs (A1 à A15). Une anomalie qui disparaîtrait
-- rendrait des exercices insolubles.
-- D001 : constantes littérales uniquement, aucune fonction d'horloge, aucun tirage aléatoire. Identifiants ASCII (D017).
-- Plages d'identifiants disjointes de celles du seed principal (D013) : commandes 5001-5030, livraisons L-001 à L-016.

CREATE TABLE export_clients (
  id               TEXT,
  nom_complet      TEXT,
  email            TEXT,
  ville            TEXT,
  date_inscription TEXT,
  points_fidelite  TEXT
);

CREATE TABLE export_commandes_2025 (
  id             TEXT,
  client_id      TEXT,
  date_commande  TEXT,
  date_livraison TEXT,
  montant        TEXT,
  statut         TEXT
);

CREATE TABLE export_commandes_2026 (
  id             TEXT,
  client_id      TEXT,
  date_commande  TEXT,
  date_livraison TEXT,
  montant        TEXT,
  statut         TEXT
);

CREATE TABLE export_livraisons (
  id              TEXT,
  commande_id     TEXT,
  transporteur    TEXT,
  date_expedition TEXT,
  date_reception  TEXT,
  poids_kg        TEXT
);

-- 20 lignes. Le nom et le prénom sont dans UNE colonne ; la ville est saisie à la main ; les points sont du texte.
-- Doublons : l'identifiant 204 est présent deux fois (A2) ; 205 et 206 sont la même personne (A3, même e-mail à la
-- casse près). L'identifiant ' 208' porte un espace de tête (A5) : une jointure sur la colonne brute le rate.
INSERT INTO export_clients (id, nom_complet, email, ville, date_inscription, points_fidelite) VALUES
('201','Camille DURAND','camille.durand@exemple.test','Lyon','2024-03-12','120'),
('202','nolan martin','nolan.martin@exemple.test','LYON','12/04/2024','80'),
('203',' Ines BERNARD ','ines.bernard@exemple.test',' lyon ','2024-05-02','1 200'),
('204','Lise Petit','LISE.PETIT@exemple.test','Lyon ','2024/06/18','0'),
('204','Lise Petit','lise.petit@exemple.test','Lyon','2024-06-18','0'),
('205','Hugo Robert','hugo.robert@exemple.test','Marseille','2024-07-01','N/A'),
('206','HUGO ROBERT','Hugo.Robert@exemple.test','MARSEILLE ','2024-07-01','45'),
('207','Jade Moreau','jade.moreau@exemple.test','marseille','14 mars 2025','45'),
(' 208','Thomas Laurent','thomas.laurent@exemple.test','Paris','2025-01-09','-50'),
('209','Lucas Michel','lucas.michel@exemple.test','Paris','2025-02-20',''),
('210','Emma Fontaine','emma.fontaine@exemple.test',' Paris','2025-03-31','30'),
('211','Louis Girard','louis.girard@exemple.test','Bordeaux','31/02/2025','15'),
('212','Alice Faure','alice.faure@exemple.test','bordeaux','2025-04-11','--'),
('213','Noah Blanc','noah.blanc@exemple.test',NULL,'2025-05-05','60'),
('214','Lina Roux','lina.roux@exemple.test','','2025-06-21','60'),
('215','Paul Mercier','N/A','N/A','2025-08-30','10'),
('216','Eva Dumas','eva.dumas@exemple.test','--','inconnue','10'),
('217','Tom Leroy','tom.leroy@exemple.test','Lille','2025-10-02','200'),
('218','Zoe Pires','zoe.pires@exemple.test','LILLE','2025-11-19','9'),
('219','Marc Olivier','marc.olivier@exemple.test','Nantes ','2026-01-07','100');

-- 18 lignes. L'export a été paginé par période : les deux dernières lignes (5017, 5018) sont AUSSI dans le fichier
-- 2026 (A15, recouvrement de la frontière d'année). Montants en texte (A8), statuts en casse libre (A4),
-- une livraison antérieure à la commande (5009, A11), un montant négatif (5010, A12), des client_id qui ne
-- retombent sur personne (5003 vers '999', 5013 vers '', A13), un statut hors liste (5008, 5016, A14).
INSERT INTO export_commandes_2025 (id, client_id, date_commande, date_livraison, montant, statut) VALUES
('5001','201','2025-01-06','2025-01-09','1249.00','livree'),
('5002','202','2025-02-14','2025-02-20','149,50','Livree'),
('5003','999','2025-03-03','2025-03-07','75.00','LIVREE'),
('5004','203','2025-03-18','','1 250','livree'),
('5005','204','2025-04-02','2025-04-06','89.00','livree'),
('5006','205','2025-04-25','N/A','34.00','expediee'),
('5007','206','2025-05-11','2025-05-14','12.50','livree'),
('5008','207','2025-06-07','--','449.00','en cours'),
('5009','208','2025-06-29','2025-06-21','29.00','livree'),
('5010','209','2025-07-15',NULL,'-30.00','annulee'),
('5011','210','2025-08-03','2025-08-08','54.00','livree'),
('5012','211','2025-09-12','2025-09-15','3.50','livree'),
('5013','','2025-10-01','2025-10-04','16.00','livree'),
('5014','212','2025-10-22','2025-10-26','N/A','livree'),
('5015','213','2025-11-09','2025-11-12','129.00','retournee'),
('5016','214','2025-11-30','','65.00',''),
('5017','215','2025-12-28','2026-01-02','219.00','expediee'),
('5018','216','2025-12-31','2026-01-05','74.00','livree');

-- 14 lignes. Les deux premières sont le recouvrement (A15) : 5017 est IDENTIQUE à l'octet près à sa jumelle de 2025
-- (UNION la supprime), 5018 ne diffère que par un espace final sur le statut (UNION la garde, TRIM seul les réunit).
-- Une date au format français (5021, A6), un client_id dans le vide (5024 vers '888', A13), une livraison antérieure
-- à la commande (5025, A11), un montant à virgule (5027, A8).
INSERT INTO export_commandes_2026 (id, client_id, date_commande, date_livraison, montant, statut) VALUES
('5017','215','2025-12-28','2026-01-02','219.00','expediee'),
('5018','216','2025-12-31','2026-01-05','74.00','livree '),
('5019','217','2026-01-14','2026-01-18','1299.00','livree'),
('5020','218','2026-02-02','2026-02-05','44.00','livree'),
('5021','219','11/03/2026','2026-03-15','89.00','livree'),
('5022','201','2026-03-27','','139.00','expediee'),
('5023','202','2026-04-08','2026-04-11','9.00','livree'),
('5024','888','2026-04-19','2026-04-23','24.50','livree'),
('5025','203','2026-05-05','2026-05-02','349.00','livree'),
('5026','204','2026-05-21','N/A','19.50','annulee'),
('5027','205','2026-06-02','2026-06-06','1,20','livree'),
('5028','206','2026-06-11','','59.00','Expediee'),
('5029','207','2026-06-18','2026-06-22','72.00','livree'),
('5030','208','2026-06-29','','26.00','en_preparation');

-- 16 lignes, le fichier du transporteur. La livraison de la commande 5019 a été exportée DEUX fois (L-011 et L-012,
-- A2) à la casse du transporteur et au séparateur décimal près. Deux réceptions précèdent l'expédition (L-006,
-- L-015, A11), un poids est négatif (L-013, A12), deux commande_id ne retombent sur rien (L-014 vers '7777',
-- L-016 vers '', A13), et le transporteur est écrit de trois façons (A4, A5).
INSERT INTO export_livraisons (id, commande_id, transporteur, date_expedition, date_reception, poids_kg) VALUES
('L-001','5001','Colissimo','2025-01-07','2025-01-09','2.4'),
('L-002','5002','COLISSIMO ','2025-02-15','2025-02-20','1,2'),
('L-003','5003','colissimo','2025-03-04','2025-03-07','0.8'),
('L-004','5005','Chronopost','2025-04-03','2025-04-06','5.0'),
('L-005','5007','Chronopost','2025-05-12','2025-05-14','0.3'),
('L-006','5009','Colissimo','2025-06-22','2025-06-21','1.5'),
('L-007','5011','Mondial Relay','2025-08-04','2025-08-08','3.2'),
('L-008','5012','Colissimo','2025-09-13','2025-09-15','0.2'),
('L-009','5014','Colissimo','2025-10-23','2025-10-26','N/A'),
('L-010','5015','Chronopost','2025-11-10','2025-11-12','4.5'),
('L-011','5019','Colissimo','2026-01-15','2026-01-18','6.0'),
('L-012','5019','COLISSIMO','2026-01-15','2026-01-18','6,0'),
('L-013','5020','Mondial Relay','2026-02-03','2026-02-05','-1.0'),
('L-014','7777','Colissimo','2026-03-02','2026-03-05','1.1'),
('L-015','5025','Chronopost','2026-05-06','2026-05-02','2.2'),
('L-016','','Colissimo','2026-06-12','','0.5');
