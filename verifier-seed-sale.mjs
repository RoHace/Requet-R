#!/usr/bin/env node
/* Requêt'R — vérificateur du SECOND jeu de données, « l'export brut » (D027, D068). Hors livrable.
   Usage : node verifier-seed-sale.mjs
   Charge vendor/sql-wasm.js et src/seed-sale.sql dans Node (aucune dépendance), puis contrôle que chaque anomalie
   VOULUE (A1 à A15, documentées dans SCHEMA-EXPORT.md) est bien PRÉSENTE. C'est l'inverse de verifier-seed.mjs, qui
   contrôle qu'aucune saleté n'est entrée dans le seed principal : ici, une anomalie disparue par mégarde rendrait des
   exercices du palier 5 insolubles, et aucune relecture humaine ne le verrait.
   Le vérificateur du seed principal reste, lui, SANS AUCUNE EXCEPTION (D027) : les deux jeux ne se mélangent jamais.
   Sortie : un tableau « critère / attendu / obtenu », puis les valeurs de référence ; code retour 1 au moindre écart.
   À relancer après TOUTE modification de src/seed-sale.sql (le jeu est gelé : voir DECISIONS.md D068). */

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

const SEED = readFileSync(join(RACINE, "src", "seed-sale.sql"), "utf8").replace(/\r\n/g, "\n");
const TABLES = ["export_clients", "export_commandes_2025", "export_commandes_2026", "export_livraisons"];
/* Les deux fichiers de commandes empilés : c'est ainsi que les exercices les lisent (A15). */
const COMMANDES = "(SELECT * FROM export_commandes_2025 UNION ALL SELECT * FROM export_commandes_2026)";
/* Les cinq statuts que le système d'origine était censé écrire (les mêmes que le seed principal). */
const STATUTS = "('livree','expediee','annulee','retournee','en_preparation')";
/* Les quatre façons de ne rien dire (A10). NULL est traité à part : ce n'est pas une chaîne. */
const RIEN = "('', 'N/A', '--')";

/* ── Outils (mêmes conventions que verifier-seed.mjs) ───────── */
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

/* ── GEL : le jeu est gelé depuis la validation du lot 10 (même mécanique que D025 pour le seed principal) ──
   Toute modification du jeu fait échouer ce critère : 38 exercices du palier 5 dépendent de ses valeurs exactes.
   Seule une nouvelle décision dans DECISIONS.md autorise à mettre cette constante à jour.
   Empreinte des 8 137 octets de src/seed-sale.sql, fins de ligne normalisées en \n (comme le fait build.mjs),
   donc indépendante de la conversion CRLF de Git. */
const GEL_SHA256 = "8468498026513942d0653e9162d82e43956878a64f2efd6f6e8df4e77fc740cb";
const empreinte = createHash("sha256").update(SEED, "utf8").digest("hex");
if (GEL_SHA256 === null) {
  info("GEL — jeu PAS ENCORE gelé, empreinte à recopier dans GEL_SHA256", empreinte);
} else {
  condition("GEL", "Le jeu sale est celui qui a été gelé (empreinte SHA-256, D068)", empreinte === GEL_SHA256,
    GEL_SHA256.slice(0, 16) + "…", empreinte === GEL_SHA256 ? "identique" : `modifié depuis le gel : ${empreinte}`);
}

/* ── C1 / C2 : poids, déterminisme (D001) ───────────────────── */
const octets = Buffer.byteLength(SEED, "utf8");
condition("C1", "Poids du jeu sale (plafond 40 Ko, et bien plus petit que le seed principal)", octets < 40 * 1024, "< 40 960 o", octets);

const INTERDITS = /'now'|datetime\s*\(|current_(timestamp|date|time)\b|random\s*\(|randomblob/i;
condition("C2a", "Aucune construction non déterministe (D001)", !INTERDITS.test(SEED), "aucune occurrence", INTERDITS.test(SEED) ? SEED.match(INTERDITS)[0] : "aucune");
const photo = d => TABLES.map(t => lignes(d, `SELECT * FROM ${t} ORDER BY rowid`));
condition("C2b", "Deux constructions successives donnent des contenus identiques", json(photo(construire())) === json(photo(construire())), "identiques", "voir comparaison");

/* ── C3 : volumes ───────────────────────────────────────────── */
const nb = Object.fromEntries(TABLES.map(t => [t, val(db, `SELECT COUNT(*) FROM ${t}`)]));
egal("C3a", "Lignes par fichier (clients, commandes 2025, commandes 2026, livraisons)", TABLES.map(t => nb[t]), [20, 18, 14, 16]);
const total = Object.values(nb).reduce((a, b) => a + b, 0);
condition("C3b", "Volume total plus petit que le seed principal (289 lignes) et inspectable à l'œil", total === 68 && total < 289, "68 lignes", total);
condition("C3c", "Aucun fichier ne dépasse 20 lignes (une table s'inspecte entièrement)", Math.max(...Object.values(nb)) <= 20, "≤ 20 par table", Math.max(...Object.values(nb)));

/* ══ A1 — AUCUNE CONTRAINTE : la méta-anomalie, et la raison de toutes les autres ══ */
const colonnes = TABLES.flatMap(t => lignes(db, `PRAGMA table_info(${t})`).map(([, nom, type, notnull, , pk]) => ({ t, nom, type, notnull, pk })));
egal("A1a", "A1 · 24 colonnes, toutes déclarées TEXT", [colonnes.length, [...new Set(colonnes.map(c => c.type))]], [24, ["TEXT"]]);
egal("A1b", "A1 · aucune colonne NOT NULL, aucune clé primaire", [colonnes.filter(c => c.notnull).length, colonnes.filter(c => c.pk).length], [0, 0]);
egal("A1c", "A1 · aucune clé étrangère déclarée", TABLES.flatMap(t => lignes(db, `PRAGMA foreign_key_list(${t})`)), []);
egal("A1d", "A1 · PRAGMA foreign_keys sur une base neuve (le fichier ne l'active pas)", val(db, "PRAGMA foreign_keys"), 0);
const ddl = colonne(db, "SELECT sql FROM sqlite_master WHERE type = 'table'").join("\n");
condition("A1e", "A1 · le DDL ne contient ni CHECK, ni PRIMARY KEY, ni NOT NULL, ni REFERENCES",
  !/\bCHECK\b|\bPRIMARY KEY\b|\bNOT NULL\b|\bREFERENCES\b/i.test(ddl), "aucune contrainte dans le DDL",
  (ddl.match(/\bCHECK\b|\bPRIMARY KEY\b|\bNOT NULL\b|\bREFERENCES\b/i) || ["aucune"])[0]);
let accepte = "refusé";
try {
  const d = construire();
  d.exec("INSERT INTO export_commandes_2026 (id, client_id, montant) VALUES ('9999', '0000', 'pas un nombre')");
  accepte = val(d, "SELECT COUNT(*) FROM export_commandes_2026") === 15 ? "accepté" : "refusé";
} catch (e) { accepte = `refusé : ${e.message}`; }
egal("A1f", "A1 · une ligne incohérente est ACCEPTÉE (l'inverse de C3e du seed principal)", accepte, "accepté");

/* ══ A2 — la même entité deux fois, à des différences mineures près ══ */
egal("A2a", "A2 · identifiant de client présent deux fois", lignes(db, "SELECT id, COUNT(*) FROM export_clients GROUP BY id HAVING COUNT(*) > 1"), [["204", 2]]);
egal("A2b", "A2 · les deux lignes du client 204 diffèrent (e-mail, format de date)",
  lignes(db, "SELECT COUNT(DISTINCT email), COUNT(DISTINCT date_inscription) FROM export_clients WHERE id = '204'")[0], [2, 2]);
egal("A2c", "A2 · la livraison de la commande 5019 est exportée deux fois",
  lignes(db, "SELECT commande_id, COUNT(*) FROM export_livraisons GROUP BY commande_id HAVING COUNT(*) > 1"), [["5019", 2]]);

/* ══ A3 — la même personne sous deux identifiants ══ */
egal("A3", "A3 · e-mails en double une fois normalisés (casse et bords)",
  lignes(db, `SELECT LOWER(TRIM(email)) AS e, COUNT(*) FROM export_clients GROUP BY e HAVING COUNT(*) > 1 ORDER BY e`),
  [["hugo.robert@exemple.test", 2], ["lise.petit@exemple.test", 2]]);

/* ══ A4 — casse incohérente ══ */
egal("A4a", "A4 · villes distinctes : brutes contre normalisées",
  lignes(db, "SELECT COUNT(DISTINCT ville), COUNT(DISTINCT UPPER(TRIM(ville))) FROM export_clients")[0], [17, 9]);
egal("A4b", "A4 · statuts distincts (deux fichiers empilés) : bruts contre normalisés",
  lignes(db, `SELECT COUNT(DISTINCT statut), COUNT(DISTINCT LOWER(TRIM(statut))) FROM ${COMMANDES}`)[0], [11, 7]);
egal("A4c", "A4 · transporteurs distincts : bruts contre normalisés",
  lignes(db, "SELECT COUNT(DISTINCT transporteur), COUNT(DISTINCT UPPER(TRIM(transporteur))) FROM export_livraisons")[0], [6, 3]);

/* ══ A5 — espaces parasites ══ */
egal("A5a", "A5 · villes entourées d'espaces", val(db, "SELECT COUNT(*) FROM export_clients WHERE ville <> TRIM(ville)"), 5);
egal("A5b", "A5 · un identifiant de client porte un espace de tête", colonne(db, "SELECT id FROM export_clients WHERE id <> TRIM(id)"), [" 208"]);
egal("A5c", "A5 · un nom complet entouré d'espaces", val(db, "SELECT COUNT(*) FROM export_clients WHERE nom_complet <> TRIM(nom_complet)"), 1);
egal("A5d", "A5 · un transporteur et un statut avec un espace final",
  [val(db, "SELECT COUNT(*) FROM export_livraisons WHERE transporteur <> TRIM(transporteur)"),
   val(db, `SELECT COUNT(*) FROM ${COMMANDES} WHERE statut <> TRIM(statut)`)], [1, 1]);

/* ══ A6 — dates en plusieurs formats ══ */
egal("A6a", "A6 · dates d'inscription que date() ne sait pas lire", val(db, "SELECT COUNT(*) FROM export_clients WHERE date(date_inscription) IS NULL"), 5);
egal("A6b", "A6 · celles qui sont au format jj/mm/aaaa", colonne(db, "SELECT date_inscription FROM export_clients WHERE date_inscription LIKE '__/__/____' ORDER BY date_inscription"), ["12/04/2024", "31/02/2025"]);
egal("A6c", "A6 · une date de commande au format français", colonne(db, `SELECT date_commande FROM ${COMMANDES} WHERE date(date_commande) IS NULL`), ["11/03/2026"]);
egal("A6d", "A6 · une date écrite en mots, une en texte libre",
  colonne(db, "SELECT date_inscription FROM export_clients WHERE date_inscription IN ('14 mars 2025', 'inconnue') ORDER BY date_inscription"), ["14 mars 2025", "inconnue"]);

/* ══ A7 — la date impossible, et ce que la réparation en fait ══ */
const reparee = val(db, `SELECT substr(date_inscription,7,4)||'-'||substr(date_inscription,4,2)||'-'||substr(date_inscription,1,2)
                         FROM export_clients WHERE date_inscription = '31/02/2025'`);
egal("A7a", "A7 · la réparation par substr de 31/02/2025 donne une date inexistante", reparee, "2025-02-31");
egal("A7b", "A7 · que date() décale SILENCIEUSEMENT au 3 mars", val(db, `SELECT date('${reparee}')`), "2025-03-03");

/* ══ A8 — nombres stockés en texte, et la coercition silencieuse ══ */
egal("A8a", "A8 · somme brute des points de fidélité (le séparateur de milliers est tronqué)", val(db, "SELECT SUM(points_fidelite) FROM export_clients"), 735);
egal("A8b", "A8 · somme une fois les espaces retirés", val(db, "SELECT SUM(CAST(REPLACE(points_fidelite, ' ', '') AS INTEGER)) FROM export_clients"), 1934);
egal("A8c", "A8 · ce que la coercition fait de chaque forme",
  lignes(db, "SELECT '1 200'+0, '149,50'+0, 'N/A'+0, ''+0, '--'+0")[0], [1, 149, 0, 0, 0]);
egal("A8d", "A8 · somme brute des montants contre somme réparée (virgule et espace)",
  lignes(db, `SELECT SUM(montant), SUM(CAST(REPLACE(REPLACE(montant, ' ', ''), ',', '.') AS REAL)) FROM ${COMMANDES}`)[0], [5042, 6291.7]);
egal("A8e", "A8 · montants à virgule et à séparateur de milliers présents",
  colonne(db, `SELECT montant FROM ${COMMANDES} WHERE montant LIKE '%,%' OR montant LIKE '% %' ORDER BY montant`), ["1 250", "1,20", "149,50"]);
egal("A8f", "A8 · un poids à virgule dans le fichier du transporteur", val(db, "SELECT COUNT(*) FROM export_livraisons WHERE poids_kg LIKE '%,%'"), 2);

/* ══ A9 — trier du texte n'est pas trier des nombres ══ */
egal("A9a", "A9 · premier client par points, en tri de TEXTE", lignes(db, "SELECT id, points_fidelite FROM export_clients ORDER BY points_fidelite DESC, id LIMIT 1")[0], ["205", "N/A"]);
egal("A9b", "A9 · premier client par points, en tri de NOMBRE",
  lignes(db, "SELECT id, points_fidelite FROM export_clients ORDER BY CAST(REPLACE(points_fidelite, ' ', '') AS INTEGER) DESC, id LIMIT 1")[0], ["203", "1 200"]);
egal("A9c", "A9 · en texte, « 9 » passe avant « 100 »", val(db, "SELECT '9' > '100'"), 1);

/* ══ A10 — quatre façons d'exprimer « rien » ══ */
egal("A10a", "A10 · ville : NULL, chaîne vide, N/A, --",
  lignes(db, `SELECT SUM(ville IS NULL), SUM(ville = ''), SUM(TRIM(ville) = 'N/A'), SUM(TRIM(ville) = '--') FROM export_clients`)[0], [1, 1, 1, 1]);
egal("A10b", "A10 · IS NOT NULL seul laisse passer 19 lignes sur 20 ; les quatre formes écartées, il en reste 16",
  [val(db, "SELECT COUNT(*) FROM export_clients WHERE ville IS NOT NULL"),
   val(db, `SELECT COUNT(*) FROM export_clients WHERE ville IS NOT NULL AND TRIM(ville) NOT IN ${RIEN}`)], [19, 16]);
egal("A10c", "A10 · les mêmes formes sur date_livraison et montant",
  [val(db, `SELECT COUNT(*) FROM ${COMMANDES} WHERE date_livraison IS NULL`),
   val(db, `SELECT COUNT(*) FROM ${COMMANDES} WHERE date_livraison IN ${RIEN}`),
   val(db, `SELECT COUNT(*) FROM ${COMMANDES} WHERE montant IN ${RIEN}`)], [1, 8, 1]);
egal("A10d", "A10 · un e-mail vaut « N/A »", colonne(db, "SELECT id FROM export_clients WHERE email = 'N/A'"), ["215"]);

/* ══ A11 — incohérence métier : une date de livraison antérieure à la commande ══ */
egal("A11a", "A11 · commandes livrées avant d'être passées",
  colonne(db, `SELECT id FROM ${COMMANDES} WHERE date(date_livraison) IS NOT NULL AND date(date_commande) IS NOT NULL
               AND date_livraison < date_commande ORDER BY id`), ["5009", "5025"]);
egal("A11b", "A11 · livraisons reçues avant d'être expédiées",
  colonne(db, "SELECT id FROM export_livraisons WHERE date_reception <> '' AND date_reception < date_expedition ORDER BY id"), ["L-006", "L-015"]);

/* ══ A12 — valeurs aberrantes qu'aucun CHECK n'a bloquées ══ */
egal("A12a", "A12 · un montant négatif", colonne(db, `SELECT id FROM ${COMMANDES} WHERE CAST(REPLACE(REPLACE(montant, ' ', ''), ',', '.') AS REAL) < 0`), ["5010"]);
egal("A12b", "A12 · des points de fidélité négatifs", colonne(db, "SELECT TRIM(id) FROM export_clients WHERE CAST(points_fidelite AS INTEGER) < 0"), ["208"]);
egal("A12c", "A12 · un poids négatif", colonne(db, "SELECT id FROM export_livraisons WHERE CAST(REPLACE(poids_kg, ',', '.') AS REAL) < 0"), ["L-013"]);

/* ══ A13 — clé étrangère dans le vide (rien ne l'empêchait) ══ */
egal("A13a", "A13 · commandes orphelines : jointure BRUTE contre jointure sur la clé nettoyée",
  [val(db, `SELECT COUNT(*) FROM ${COMMANDES} o LEFT JOIN export_clients c ON c.id = o.client_id WHERE c.id IS NULL`),
   val(db, `SELECT COUNT(*) FROM ${COMMANDES} o LEFT JOIN export_clients c ON TRIM(c.id) = TRIM(o.client_id) WHERE c.id IS NULL`)], [5, 3]);
egal("A13b", "A13 · les trois vraies orphelines, et le client qu'elles désignent",
  lignes(db, `SELECT o.id, o.client_id FROM ${COMMANDES} o LEFT JOIN export_clients c ON TRIM(c.id) = TRIM(o.client_id)
              WHERE c.id IS NULL ORDER BY o.id`), [["5003", "999"], ["5013", ""], ["5024", "888"]]);
egal("A13c", "A13 · les deux lignes que seule la clé non nettoyée perdait (client ' 208')",
  colonne(db, `SELECT o.id FROM ${COMMANDES} o LEFT JOIN export_clients c ON c.id = o.client_id
               WHERE c.id IS NULL AND TRIM(o.client_id) = '208' ORDER BY o.id`), ["5009", "5030"]);
egal("A13d", "A13 · livraisons qui ne retombent sur aucune commande",
  colonne(db, `SELECT l.id FROM export_livraisons l LEFT JOIN ${COMMANDES} o ON o.id = l.commande_id WHERE o.id IS NULL ORDER BY l.id`), ["L-014", "L-016"]);

/* ══ A14 — statut hors liste ══ */
egal("A14", "A14 · statuts hors des cinq valeurs attendues, après normalisation",
  lignes(db, `SELECT id, statut FROM ${COMMANDES} WHERE LOWER(TRIM(statut)) NOT IN ${STATUTS} ORDER BY id`), [["5008", "en cours"], ["5016", ""]]);

/* ══ A15 — les deux fichiers se recouvrent : ce que UNION dédoublonne, et ce qu'il laisse passer ══ */
egal("A15a", "A15 · UNION ALL, UNION, puis identifiants distincts",
  [val(db, `SELECT COUNT(*) FROM (SELECT * FROM export_commandes_2025 UNION ALL SELECT * FROM export_commandes_2026)`),
   val(db, `SELECT COUNT(*) FROM (SELECT * FROM export_commandes_2025 UNION SELECT * FROM export_commandes_2026)`),
   val(db, `SELECT COUNT(DISTINCT id) FROM ${COMMANDES}`)], [32, 31, 30]);
egal("A15b", "A15 · la ligne que UNION ne dédoublonne pas, et ce qui l'en empêche",
  lignes(db, `SELECT id, COUNT(*), GROUP_CONCAT('['||statut||']') FROM (SELECT * FROM export_commandes_2025 UNION SELECT * FROM export_commandes_2026)
              GROUP BY id HAVING COUNT(*) > 1`), [["5018", 2, "[livree],[livree ]"]]);
egal("A15c", "A15 · une fois le statut nettoyé, UNION réunit bien les deux lignes",
  val(db, `SELECT COUNT(*) FROM (SELECT id, client_id, date_commande, date_livraison, montant, TRIM(statut) AS statut FROM export_commandes_2025
           UNION SELECT id, client_id, date_commande, date_livraison, montant, TRIM(statut) AS statut FROM export_commandes_2026)`), 30);

/* ── Valeurs de référence à reporter dans SCHEMA-EXPORT.md ──── */
info("Lignes au total (4 fichiers)", total);
info("Poids du jeu", `${octets} o`);
info("Villes réelles après UPPER(TRIM(…)), non-valeurs écartées",
  lignes(db, `SELECT UPPER(TRIM(ville)), COUNT(*) FROM export_clients WHERE ville IS NOT NULL AND TRIM(ville) NOT IN ${RIEN}
              GROUP BY UPPER(TRIM(ville)) ORDER BY COUNT(*) DESC, 1`).map(l => `${l[0]} ${l[1]}`).join(" · "));
info("Points de fidélité : somme brute / somme réparée", `${val(db, "SELECT SUM(points_fidelite) FROM export_clients")} / ${val(db, "SELECT SUM(CAST(REPLACE(points_fidelite,' ','') AS INTEGER)) FROM export_clients")}`);
info("Montants : somme brute / somme réparée", `${val(db, `SELECT SUM(montant) FROM ${COMMANDES}`)} / ${val(db, `SELECT SUM(CAST(REPLACE(REPLACE(montant,' ',''),',','.') AS REAL)) FROM ${COMMANDES}`)}`);
info("Commandes empilées : UNION ALL / UNION / id distincts", "32 / 31 / 30");
info("Dates d'inscription illisibles par date()", val(db, "SELECT COUNT(*) FROM export_clients WHERE date(date_inscription) IS NULL"));
info("Statuts distincts : bruts / normalisés", `${val(db, `SELECT COUNT(DISTINCT statut) FROM ${COMMANDES}`)} / ${val(db, `SELECT COUNT(DISTINCT LOWER(TRIM(statut))) FROM ${COMMANDES}`)}`);

/* ── Rapport ────────────────────────────────────────────────── */
const large = Math.max(...resultats.map(r => r.titre.length));
console.log(`\nVérification du jeu sale (« l'export brut ») — ${resultats.length} critères\n`);
for (const r of resultats) {
  console.log(`${r.ok ? "✔" : "✘"} ${r.id.padEnd(5)} ${r.titre.padEnd(large)}  ${r.ok ? "" : `\n      attendu : ${r.attendu}\n      obtenu  : ${r.obtenu}`}`);
}
console.log("\nValeurs de référence (à reporter dans SCHEMA-EXPORT.md) :");
for (const [libelle, valeur] of infos) console.log(`  ${libelle} : ${valeur}`);

const echecs = resultats.filter(r => !r.ok);
console.log(echecs.length ? `\n${echecs.length} critère(s) en échec : ${echecs.map(r => r.id).join(", ")}\n` : "\nTous les critères sont au vert.\n");
db.close();
process.exit(echecs.length ? 1 : 0);
