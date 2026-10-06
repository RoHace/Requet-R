#!/usr/bin/env node
/* Requêt'R — vérificateur du seed. Hors livrable : il n'entre pas dans requeter.html.
   Usage : node verifier-seed.mjs
   Charge vendor/sql-wasm.js et src/seed.sql dans Node (aucune dépendance), puis rejoue les critères du lot 2
   (C2 à C16) : chaque piège pédagogique de SCHEMA.md doit être réellement présent dans les données.
   Il contrôle aussi que le seed n'a pas bougé depuis son gel (critère GEL).
   Sortie : un tableau « critère / attendu / obtenu », puis les valeurs de référence ; code retour 1 au moindre écart.
   À relancer après TOUTE modification de src/seed.sql (le seed est gelé : voir DECISIONS.md). */

import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const initSqlJs = require("./vendor/sql-wasm.js");
const wasm = readFileSync(join(RACINE, "vendor", "sql-wasm.wasm"));
const SQL = await initSqlJs({ wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) });

const SEED = readFileSync(join(RACINE, "src", "seed.sql"), "utf8").replace(/\r\n/g, "\n");
const DATE_REFERENCE = "2026-06-30";
const TABLES = ["categories", "produits", "clients", "commandes", "lignes_commande"];

/* ── Outils ─────────────────────────────────────────────────── */
function construire() { const db = new SQL.Database(); db.exec(SEED); return db; }
const lignes = (db, sql) => { const r = db.exec(sql); return r.length ? r[0].values : []; };
const val = (db, sql) => lignes(db, sql)[0]?.[0];
const colonne = (db, sql) => lignes(db, sql).map(l => l[0]);

const resultats = [];
const infos = [];
const json = v => JSON.stringify(v);
function egal(id, titre, obtenu, attendu) {
  resultats.push({ id, titre, attendu: json(attendu), obtenu: json(obtenu), ok: json(obtenu) === json(attendu) });
}
function condition(id, titre, ok, attendu, obtenu) {
  resultats.push({ id, titre, attendu, obtenu: json(obtenu), ok: !!ok });
}
const info = (libelle, valeur) => infos.push([libelle, valeur]);

const db = construire();

/* ── GEL : le seed est gelé (DECISIONS.md D025) ─────────────── */
/* Empreinte du seed validé au lot 2, fins de ligne normalisées en \n (comme le fait build.mjs). Toute modification du seed
   la change : il faut alors une nouvelle décision, le rejeu de ce vérificateur, puis la mise à jour de cette constante. */
const GEL_SHA256 = "04c2308d1ae580da94274b190e2a5124720e00eaa89f6c2670102af1d806d9c6";
const empreinteSeed = createHash("sha256").update(SEED, "utf8").digest("hex");
condition("GEL", "Le seed est celui qui a été gelé (empreinte SHA-256, D025)", empreinteSeed === GEL_SHA256, GEL_SHA256.slice(0, 16) + "…",
  empreinteSeed === GEL_SHA256 ? "identique" : `modifié depuis le gel : ${empreinteSeed}`);

/* ── C1 / C15 : poids et déterminisme ───────────────────────── */
const octets = Buffer.byteLength(SEED, "utf8");
condition("C1", "Poids du seed (plafond 40 Ko, cible ~18 Ko)", octets < 40 * 1024, "< 40 960 o", octets);

const INTERDITS = /'now'|datetime\s*\(|current_(timestamp|date|time)\b|random\s*\(|randomblob/i;
condition("C15a", "Aucune construction non déterministe dans le seed (D001)", !INTERDITS.test(SEED), "aucune occurrence", INTERDITS.test(SEED) ? SEED.match(INTERDITS)[0] : "aucune");

const empreinte = d => TABLES.map(t => lignes(d, `SELECT * FROM ${t} ORDER BY rowid`));
condition("C15b", "Deux constructions successives donnent des contenus identiques", json(empreinte(construire())) === json(empreinte(construire())), "identiques", "voir comparaison");

/* ── C2 : volume et identifiants ────────────────────────────── */
const nb = Object.fromEntries(TABLES.map(t => [t, val(db, `SELECT COUNT(*) FROM ${t}`)]));
const total = Object.values(nb).reduce((a, b) => a + b, 0);
egal("C2a", "Lignes par table (catégories, produits, clients, commandes, lignes)", TABLES.map(t => nb[t]), [7, 30, 40, 70, 142]);
condition("C2b", "Volume total entre 200 et 400 lignes", total >= 200 && total <= 400, "200 à 400", total);
const plages = { categories: [1, 7], produits: [101, 130], clients: [201, 240], commandes: [1001, 1070] };
for (const [t, [min, max]] of Object.entries(plages)) {
  egal(`C2-id-${t}`, `Plage d'identifiants de ${t} (disjointe des autres)`, lignes(db, `SELECT MIN(id), MAX(id), COUNT(*) FROM ${t}`)[0], [min, max, max - min + 1]);
}

/* ── C3 : intégrité et clés étrangères ──────────────────────── */
egal("C3a", "PRAGMA foreign_key_check", lignes(db, "PRAGMA foreign_key_check"), []);
egal("C3b", "PRAGMA integrity_check", val(db, "PRAGMA integrity_check"), "ok");
egal("C3c", "PRAGMA foreign_keys (appliquées sur une base neuve)", val(db, "PRAGMA foreign_keys"), 1);
const cles = TABLES.flatMap(t => lignes(db, `PRAGMA foreign_key_list(${t})`).map(l => `${t}.${l[3]}->${l[2]}.${l[4]}`));
egal("C3d", "Clés étrangères déclarées (5, dont une auto-référence)", cles.sort(), [
  "clients.parrain_id->clients.id", "commandes.client_id->clients.id", "lignes_commande.commande_id->commandes.id",
  "lignes_commande.produit_id->produits.id", "produits.categorie_id->categories.id"]);
let refus = "aucune erreur";
try { construire().exec("INSERT INTO commandes (id, client_id, date_commande, statut, frais_port) VALUES (9999, 9999, '2026-01-01', 'livree', 0)"); }
catch (e) { refus = e.message; }
egal("C3e", "INSERT d'une commande pour un client inexistant", refus, "FOREIGN KEY constraint failed");

/* ── C4 / C4b : clients sans commande (P1) ──────────────────── */
egal("C4a", "P1 · clients sans aucune commande", val(db, "SELECT COUNT(*) FROM clients WHERE id NOT IN (SELECT client_id FROM commandes)"), 6);
egal("C4b", "P1 · INNER JOIN contre LEFT JOIN (clients distincts)", [
  val(db, "SELECT COUNT(DISTINCT c.id) FROM clients c JOIN commandes o ON o.client_id = c.id"),
  val(db, "SELECT COUNT(DISTINCT c.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id")], [34, 40]);
egal("C4c", "P1 · clients dont toutes les commandes sont annulées (219 : deux, 232 : une)",
  colonne(db, `SELECT c.id FROM clients c WHERE EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id)
               AND NOT EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id AND o.statut <> 'annulee') ORDER BY c.id`), [219, 232]);
const filtreWhere = val(db, "SELECT COUNT(DISTINCT c.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id WHERE o.statut = 'livree'");
const filtreOn = val(db, "SELECT COUNT(DISTINCT c.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id AND o.statut = 'livree'");
condition("C4d", "P1 · filtre en WHERE (tue le LEFT JOIN) contre filtre en ON", filtreWhere < 40 && filtreOn === 40, "< 40 contre 40", [filtreWhere, filtreOn]);
info("Clients ayant au moins une commande livrée (filtre en WHERE)", filtreWhere);

/* ── C5 : produits jamais commandés, catégorie vide (P2) ────── */
egal("C5a", "P2 · produits jamais commandés", val(db, "SELECT COUNT(*) FROM produits p LEFT JOIN lignes_commande l ON l.produit_id = p.id WHERE l.produit_id IS NULL"), 5);
egal("C5b", "P2 · catégories sans produit", lignes(db, "SELECT c.nom FROM categories c LEFT JOIN produits p ON p.categorie_id = c.id WHERE p.id IS NULL"), [["Jardin"]]);
egal("C5c", "P2 · produit commandé uniquement dans des commandes annulées",
  colonne(db, `SELECT p.id FROM produits p WHERE EXISTS (SELECT 1 FROM lignes_commande l WHERE l.produit_id = p.id)
               AND NOT EXISTS (SELECT 1 FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE l.produit_id = p.id AND o.statut <> 'annulee')`), [109]);
egal("C5d", "P2 · produits jamais commandés (identifiants)", colonne(db, "SELECT p.id FROM produits p LEFT JOIN lignes_commande l ON l.produit_id = p.id WHERE l.produit_id IS NULL ORDER BY p.id"), [114, 115, 120, 125, 130]);

/* ── C6 : NULL (P3) et NOT IN + NULL (P9) ───────────────────── */
egal("C6a", "P3 · clients : COUNT(*), COUNT(ville), COUNT(parrain_id)", lignes(db, "SELECT COUNT(*), COUNT(ville), COUNT(parrain_id) FROM clients")[0], [40, 36, 9]);
const note = lignes(db, "SELECT COUNT(*), COUNT(note), AVG(note), SUM(note) * 1.0 / COUNT(*) FROM commandes")[0];
condition("C6b", "P3 · commandes : COUNT(note) = 32 et AVG(note) ≠ SUM(note)/COUNT(*)", note[1] === 32 && note[2] !== note[3], "70, 32, AVG ≠ SUM/COUNT", note);
info("AVG(note) · SUM(note)/COUNT(*)", `${note[2]} · ${note[3]}`);
const lyon = val(db, "SELECT COUNT(*) FROM clients WHERE ville = 'Lyon'");
egal("C6c", "P3 · ville <> 'Lyon' ne ramène pas les 4 NULL (40 − Lyon − NULL)", [val(db, "SELECT COUNT(*) FROM clients WHERE ville <> 'Lyon'"), 40 - lyon - 4], [30, 30]);
egal("C6d", "P3 · GROUP BY ville crée un groupe NULL", val(db, "SELECT COUNT(*) FROM (SELECT ville FROM clients GROUP BY ville) WHERE ville IS NULL"), 1);
egal("C6e", "P9 · NOT IN avec un NULL dans la sous-requête (0) contre NOT EXISTS (31)", [
  val(db, "SELECT COUNT(*) FROM clients WHERE id NOT IN (SELECT parrain_id FROM clients)"),
  val(db, "SELECT COUNT(*) FROM clients c WHERE NOT EXISTS (SELECT 1 FROM clients f WHERE f.parrain_id = c.id)")], [0, 31]);
egal("C6f", "P9 · chaîne de parrainage la plus longue (4 niveaux)", val(db, `WITH RECURSIVE ch(id, niveau) AS (
  SELECT id, 1 FROM clients WHERE parrain_id IS NULL UNION ALL SELECT c.id, ch.niveau + 1 FROM clients c JOIN ch ON c.parrain_id = ch.id)
  SELECT MAX(niveau) FROM ch`), 4);
egal("C6g", "P3 · homonymes (un nom partagé par deux clients)", lignes(db, "SELECT nom, COUNT(*) FROM clients GROUP BY nom HAVING COUNT(*) > 1"), [["Martin", 2]]);

/* ── C7 : plusieurs lignes par commande, gonflement du SUM (P4) */
const vrai = val(db, "SELECT SUM(frais_port) FROM commandes");
const gonfle = val(db, "SELECT SUM(c.frais_port) FROM commandes c JOIN lignes_commande l ON l.commande_id = c.id");
condition("C7a", "P4 · SUM(frais_port) gonflé par la jointure", gonfle > vrai, "gonflé > vrai", [vrai, gonfle]);
info("SUM(frais_port) vrai · après JOIN lignes_commande", `${vrai} · ${gonfle}`);
egal("C7b", "P4 · COUNT(*) après jointure contre nombre de commandes", [val(db, "SELECT COUNT(*) FROM commandes c JOIN lignes_commande l ON l.commande_id = c.id"), nb.commandes], [142, 70]);
const multi = lignes(db, "SELECT COUNT(*), MAX(n) FROM (SELECT COUNT(*) AS n FROM lignes_commande GROUP BY commande_id) WHERE n >= 2")[0];
condition("C7c", "P4 · commandes à ≥ 2 lignes (≥ 45) et maximum de lignes (≥ 5)", multi[0] >= 45 && multi[1] >= 5, "≥ 45 et ≥ 5", multi);
egal("C7d", "P4 · commandes à une seule ligne", val(db, "SELECT COUNT(*) FROM (SELECT commande_id FROM lignes_commande GROUP BY commande_id HAVING COUNT(*) = 1)"), 19);

/* ── C8 : ex æquo (P5) ──────────────────────────────────────── */
const top = lignes(db, `SELECT RANK() OVER (ORDER BY prix DESC), DENSE_RANK() OVER (ORDER BY prix DESC),
  ROW_NUMBER() OVER (ORDER BY prix DESC, id) FROM produits ORDER BY prix DESC, id LIMIT 3`);
egal("C8a", "P5 · prix : RANK / DENSE_RANK / ROW_NUMBER sur les 3 premiers", [top.map(l => l[0]), top.map(l => l[1]), top.map(l => l[2])], [[1, 1, 3], [1, 1, 2], [1, 2, 3]]);
egal("C8b", "P5 · prix dans une catégorie (Informatique) : RANK 1, 2, 2, 4…", colonne(db, `SELECT RANK() OVER (PARTITION BY categorie_id ORDER BY prix DESC)
  FROM produits WHERE categorie_id = 1 ORDER BY prix DESC, id`), [1, 2, 2, 4, 5, 6, 7, 8]);
const CA_CLIENT = `WITH t AS (SELECT c.id, SUM(l.quantite * l.prix_unitaire) AS ca FROM clients c JOIN commandes o ON o.client_id = c.id
  JOIN lignes_commande l ON l.commande_id = o.id WHERE o.statut NOT IN ('annulee', 'retournee') GROUP BY c.id)`;
const cl = lignes(db, `${CA_CLIENT} SELECT id, ca, RANK() OVER (ORDER BY ca DESC), DENSE_RANK() OVER (ORDER BY ca DESC) FROM t ORDER BY ca DESC, id LIMIT 5`);
egal("C8c", "P5 · chiffre d'affaires produits par client : rang 3 partagé (RANK 1,2,3,3,5 · DENSE_RANK 1,2,3,3,4)",
  [cl.map(l => l[2]), cl.map(l => l[3])], [[1, 2, 3, 3, 5], [1, 2, 3, 3, 4]]);
info("Top 5 clients (id : chiffre d'affaires produits)", cl.map(l => `${l[0]} : ${l[1]}`).join(" · "));
const qt = lignes(db, `WITH t AS (SELECT l.produit_id, SUM(l.quantite) AS q FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id
  WHERE o.statut <> 'annulee' GROUP BY l.produit_id) SELECT produit_id, q, RANK() OVER (ORDER BY q DESC) FROM t ORDER BY q DESC, produit_id LIMIT 5`);
egal("C8d", "P5 · quantité vendue par produit : deux produits ex æquo au rang 4", [qt.map(l => l[2]), qt.map(l => l[0])], [[1, 2, 3, 4, 4], [113, 107, 108, 126, 128]]);
egal("C8e", "P5 · prix répétés (1299, 449, 29)", lignes(db, "SELECT prix, COUNT(*) FROM produits GROUP BY prix HAVING COUNT(*) > 1 ORDER BY prix DESC"), [[1299, 2], [449, 2], [29, 2]]);
egal("C8f", "P5 · clients à exactement 2 commandes (ex æquo sur le nombre de commandes)", val(db, "SELECT COUNT(*) FROM (SELECT client_id FROM commandes GROUP BY client_id HAVING COUNT(*) = 2)"), 18);

/* ── C9 : dates (P6) ────────────────────────────────────────── */
egal("C9a", "P6 · commandes par année", lignes(db, "SELECT strftime('%Y', date_commande), COUNT(*) FROM commandes GROUP BY 1 ORDER BY 1"), [["2025", 44], ["2026", 26]]);
egal("C9b", "P6 · mois distincts avec commande (17 sur 18) et mois absent", [
  val(db, "SELECT COUNT(DISTINCT strftime('%Y-%m', date_commande)) FROM commandes"),
  val(db, "SELECT COUNT(*) FROM commandes WHERE strftime('%Y-%m', date_commande) = '2025-08'")], [17, 0]);
egal("C9c", "P6 · première et dernière commande", lignes(db, "SELECT MIN(date_commande), MAX(date_commande) FROM commandes")[0], ["2025-01-06", "2026-06-29"]);
egal("C9d", "P6 · commandes sur la frontière d'année (2025-12-31 et 2026-01-01)", colonne(db, "SELECT date_commande FROM commandes WHERE date_commande IN ('2025-12-31', '2026-01-01') ORDER BY 1"), ["2025-12-31", "2026-01-01"]);
egal("C9e", "P6 · commandes par mois, 1er semestre 2025 puis 2026 (comparables, jamais identiques)", [
  colonne(db, "SELECT COUNT(*) FROM commandes WHERE date_commande BETWEEN '2025-01-01' AND '2025-06-30' GROUP BY strftime('%m', date_commande) ORDER BY strftime('%m', date_commande)"),
  colonne(db, "SELECT COUNT(*) FROM commandes WHERE date_commande BETWEEN '2026-01-01' AND '2026-06-30' GROUP BY strftime('%m', date_commande) ORDER BY strftime('%m', date_commande)")],
  [[3, 3, 4, 3, 4, 5], [4, 2, 5, 4, 3, 8]]);
egal("C9f", "P6 · clients inscrits sur 3 années civiles", colonne(db, "SELECT DISTINCT strftime('%Y', date_inscription) FROM clients ORDER BY 1"), ["2024", "2025", "2026"]);

/* ── C10 / C11 : statuts et définition du chiffre d'affaires (P7) */
egal("C10", "P7 · commandes par statut", lignes(db, "SELECT statut, COUNT(*) FROM commandes GROUP BY statut ORDER BY statut"),
  [["annulee", 11], ["en_preparation", 3], ["expediee", 5], ["livree", 46], ["retournee", 5]]);
const CA = filtre => val(db, `SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id ${filtre}`);
const caTous = CA(""), caNonAnnulee = CA("WHERE o.statut <> 'annulee'"), caLivree = CA("WHERE o.statut = 'livree'");
const caProduits = CA("WHERE o.statut NOT IN ('annulee', 'retournee')");
const portPropre = val(db, "SELECT SUM(frais_port) FROM commandes WHERE statut NOT IN ('annulee', 'retournee')");
const caTotal = caProduits + portPropre;
const caNaif = val(db, `SELECT SUM(l.quantite * l.prix_unitaire) + SUM(o.frais_port) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee', 'retournee')`);
condition("C11a", "P7 · « le chiffre d'affaires » exige un choix : trois totaux strictement décroissants", caTous > caNonAnnulee && caNonAnnulee > caLivree, "tous > non annulées > livrées", [caTous, caNonAnnulee, caLivree]);
condition("C11b", "P7 · chiffre d'affaires produits < chiffre d'affaires total, et la jointure naïve gonfle le total", caProduits < caTotal && caNaif > caTotal, "produits < total < naïf", [caProduits, caTotal, caNaif]);
info("Chiffre d'affaires produits (hors annulées et retournées)", caProduits);
info("Frais de port des mêmes commandes", portPropre);
info("Chiffre d'affaires total (produits + frais de port)", caTotal);
info("Total gonflé par la jointure (piège)", caNaif);
info("CA tous statuts · hors annulées · livrées seules", `${caTous} · ${caNonAnnulee} · ${caLivree}`);

/* ── C12 : montants (P8) et prix facturé (P10) ──────────────── */
egal("C12a", "P8 · prix : minimum, maximum, valeurs distinctes", lignes(db, "SELECT MIN(prix), MAX(prix), COUNT(DISTINCT prix) FROM produits")[0], [3.5, 1299, 27]);
egal("C12b", "P8 · quantités : minimum, maximum, valeurs distinctes", lignes(db, "SELECT MIN(quantite), MAX(quantite), COUNT(DISTINCT quantite) FROM lignes_commande")[0], [1, 6, 5]);
egal("C12c", "P8 · frais de port distincts", colonne(db, "SELECT DISTINCT frais_port FROM commandes ORDER BY 1"), [0, 4.5, 6.5]);
egal("C12d", "P10 · lignes facturées à un prix différent du prix actuel : 22, toutes avant 2025-10-01",
  lignes(db, `SELECT COUNT(*), MAX(o.date_commande) < '2025-10-01' FROM lignes_commande l JOIN produits p ON p.id = l.produit_id
              JOIN commandes o ON o.id = l.commande_id WHERE l.prix_unitaire <> p.prix`)[0], [22, 1]);
egal("C12e", "P8 · tous les montants sont des multiples de 0,25", val(db, `SELECT
  (SELECT COUNT(*) FROM produits WHERE prix * 4 <> CAST(prix * 4 AS INTEGER)) +
  (SELECT COUNT(*) FROM commandes WHERE frais_port * 4 <> CAST(frais_port * 4 AS INTEGER)) +
  (SELECT COUNT(*) FROM lignes_commande WHERE prix_unitaire * 4 <> CAST(prix_unitaire * 4 AS INTEGER))`), 0);
const gros = val(db, `${CA_CLIENT} SELECT COUNT(*) FROM t WHERE ca > 500`);
egal("C12f", "P8 · HAVING SUM(...) > 500 : 7 clients sur les 32 qui ont une commande valide", [gros, val(db, `${CA_CLIENT} SELECT COUNT(*) FROM t`)], [7, 32]);
info("Clients à chiffre d'affaires produits > 500", gros);

/* ── C13 : retards (P11) ────────────────────────────────────── */
egal("C13a", `P11 · commandes expédiées depuis plus de 10 jours au ${DATE_REFERENCE}`, [
  val(db, "SELECT COUNT(*) FROM commandes WHERE statut = 'expediee'"),
  val(db, `SELECT COUNT(*) FROM commandes WHERE statut = 'expediee' AND julianday('${DATE_REFERENCE}') - julianday(date_commande) > 10`)], [5, 2]);
egal("C13b", "P11 · délais de livraison en jours (minimum, maximum)", lignes(db, "SELECT MIN(julianday(date_livraison) - julianday(date_commande)), MAX(julianday(date_livraison) - julianday(date_commande)) FROM commandes")[0], [2, 12]);

/* ── C14 : invariants de cohérence ──────────────────────────── */
const zero = (id, titre, sql) => egal(id, titre, val(db, sql), 0);
zero("C14a", "livree / retournee ⇔ date_livraison renseignée", "SELECT COUNT(*) FROM commandes WHERE (statut IN ('livree', 'retournee')) <> (date_livraison IS NOT NULL)");
zero("C14b", "note renseignée seulement si livree / retournee", "SELECT COUNT(*) FROM commandes WHERE note IS NOT NULL AND statut NOT IN ('livree', 'retournee')");
zero("C14c", "retournee ⇒ note basse (1 ou 2)", "SELECT COUNT(*) FROM commandes WHERE statut = 'retournee' AND (note IS NULL OR note > 2)");
zero("C14d", `inscription ≤ commande ≤ livraison ≤ ${DATE_REFERENCE}`, `SELECT COUNT(*) FROM commandes o JOIN clients c ON c.id = o.client_id
  WHERE c.date_inscription > o.date_commande OR o.date_livraison < o.date_commande OR o.date_commande > '${DATE_REFERENCE}' OR o.date_livraison > '${DATE_REFERENCE}'`);
zero("C14e", "un parrain est inscrit avant son filleul", "SELECT COUNT(*) FROM clients f JOIN clients p ON p.id = f.parrain_id WHERE p.date_inscription > f.date_inscription");
zero("C14f", "toute commande a au moins une ligne", "SELECT COUNT(*) FROM commandes o WHERE NOT EXISTS (SELECT 1 FROM lignes_commande l WHERE l.commande_id = o.id)");
zero("C14g", "frais de port : 4,50 sous 50, 6,50 de 50 à 119,99, 0 dès 120 (total produits de la commande)", `SELECT COUNT(*) FROM (
  SELECT o.frais_port AS p, SUM(l.quantite * l.prix_unitaire) AS t FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id GROUP BY o.id)
  WHERE p <> CASE WHEN t >= 120 THEN 0 WHEN t >= 50 THEN 6.5 ELSE 4.5 END`);
zero("C14h", "dates valides au format AAAA-MM-JJ", `SELECT (SELECT COUNT(*) FROM clients WHERE date(date_inscription) IS NOT date_inscription)
  + (SELECT COUNT(*) FROM commandes WHERE date(date_commande) IS NOT date_commande OR date(date_livraison) IS NOT date_livraison)`);
zero("C14i", "adresses e-mail toutes en @exemple.test", "SELECT COUNT(*) FROM clients WHERE email NOT LIKE '%@exemple.test'");

const initialesOk = [["clients", "prenom"], ["clients", "nom"], ["clients", "ville"], ["produits", "nom"], ["categories", "nom"]].every(([t, c]) =>
  colonne(db, `SELECT ${c} FROM ${t} WHERE ${c} IS NOT NULL`).every(s => /^[A-Za-z]/.test(s)));
condition("C14j", "aucun accent en initiale (nom, prénom, ville, produit, catégorie)", initialesOk, "vrai", initialesOk);
const ascii = colonne(db, "SELECT DISTINCT statut FROM commandes").every(s => /^[a-z_]+$/.test(s)) && colonne(db, "SELECT email FROM clients").every(s => /^[\x20-\x7e]+$/.test(s));
condition("C14k", "statuts et e-mails en ASCII pur", ascii, "vrai", ascii);

const pli = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ordreIntuitif = [["clients", "prenom"], ["clients", "nom"], ["clients", "ville"], ["produits", "nom"], ["categories", "nom"]].filter(([t, c]) => {
  const sqlite = colonne(db, `SELECT DISTINCT ${c} FROM ${t} WHERE ${c} IS NOT NULL ORDER BY ${c}`);
  const attendu = [...sqlite].sort((a, b) => (pli(a) < pli(b) ? -1 : pli(a) > pli(b) ? 1 : 0));
  return json(sqlite) !== json(attendu);
}).map(([t, c]) => `${t}.${c}`);
egal("C14l", "ORDER BY (binaire) = ordre alphabétique attendu, malgré les accents internes", ordreIntuitif, []);

const premiers = t => lignes(db, `SELECT * FROM ${t} ORDER BY rowid LIMIT 5`);
condition("C14m", "Aperçu pédagogique : un NULL dans les 5 premières lignes de clients et de commandes",
  premiers("clients").some(l => l.includes(null)) && premiers("commandes").some(l => l.includes(null)), "vrai", "vrai");

/* ── C16 : lisibilité à la main ─────────────────────────────── */
const exemple = lignes(db, `SELECT p.nom, l.quantite, l.prix_unitaire, l.quantite * l.prix_unitaire FROM lignes_commande l JOIN produits p ON p.id = l.produit_id WHERE l.commande_id = 1038 ORDER BY l.produit_id`);
const sommeExemple = exemple.reduce((s, l) => s + l[3], 0);
const portExemple = val(db, "SELECT frais_port FROM commandes WHERE id = 1038");
egal("C16", "Exemple à refaire à la main : commande 1038 = 34,00 + 29,00 + 2 × 12,50 + 4 × 3,50, port 6,50", [sommeExemple, portExemple, sommeExemple + portExemple], [102, 6.5, 108.5]);
info("Commande 1038 (client 210, livrée)", exemple.map(l => `${l[1]} × ${l[0]} à ${l[2]} = ${l[3]}`).join(" ; "));

/* ── Rapport ────────────────────────────────────────────────── */
const L = { id: 9, titre: 78 };
const coupe = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
console.log(`\nVérification du seed : ${octets.toLocaleString("fr-FR")} octets, ${total} lignes, SQLite ${val(db, "SELECT sqlite_version()")}\n`);
for (const r of resultats) {
  console.log(`${r.ok ? "✔" : "✘"} ${r.id.padEnd(L.id)} ${coupe(r.titre, L.titre).padEnd(L.titre)}${r.ok ? "" : `\n    attendu : ${r.attendu}\n    obtenu  : ${r.obtenu}`}`);
}
console.log("\nValeurs de référence (à reporter dans SCHEMA.md) :");
for (const [l, v] of infos) console.log(`  · ${l} : ${v}`);
const ko = resultats.filter(r => !r.ok);
console.log(`\n${ko.length ? `✘ ${ko.length} critère(s) en échec sur ${resultats.length}` : `✔ ${resultats.length} critères satisfaits`}\n`);
process.exit(ko.length ? 1 : 0);
