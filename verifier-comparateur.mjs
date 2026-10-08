#!/usr/bin/env node
/* Requêt'R — vérificateur du comparateur et des exercices (lot 3). Hors livrable : il n'entre pas dans requeter.html.
   Usage : node verifier-comparateur.mjs
   Charge les VRAIS fichiers de src/ (comparateur.js, puis moteur.js, exercices.js quand ils existent) dans Node, sans navigateur,
   et rejoue une paire (résultat attendu, résultat obtenu) par cas tranché dans DECISIONS.md (D028 à D036).
   Filet de sécurité de tout le contenu à venir : à relancer après TOUTE modification de src/comparateur.js, src/moteur.js,
   src/exercices.js ou src/contenu.js. Sortie : un tableau « critère / attendu / obtenu » ; code retour 1 au moindre écart. */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = f => readFileSync(join(RACINE, "src", f), "utf8").replace(/\r\n/g, "\n");

/* Les fichiers de src/ sont des scripts classiques qui partagent leur portée globale dans le navigateur.
   On les concatène dans UNE évaluation indirecte (même royaume que ce script : pas de piège d'instanceof entre contextes). */
function charger(fichiers, exports) {
  return (0, eval)(fichiers.map(source).join("\n") + `\n;({ ${exports.join(", ")} })`);
}

/* Globaux que le build fournit au navigateur avant les scripts de src/ : sql.js, le WASM en base64, le seed. */
globalThis.initSqlJs = require("./vendor/sql-wasm.js");
globalThis.WASM_B64 = readFileSync(join(RACINE, "vendor", "sql-wasm.wasm")).toString("base64");
globalThis.SEED_SQL = source("seed.sql");

const { Comparateur } = charger(["comparateur.js"], ["Comparateur"]);

/* Le moteur : le vrai src/moteur.js, initialisé comme dans le navigateur. Un échec de chargement devient un critère en échec. */
let Moteur = null, nouvelleBase = null, erreurMoteur = null;
try {
  ({ Moteur, nouvelleBase } = charger(["comparateur.js", "moteur.js"], ["Moteur", "nouvelleBase"]));
  await Moteur.initialiser();
} catch (e) { erreurMoteur = e && e.message; }

/* ── Outils ─────────────────────────────────────────────────── */
const resultats = [];
const json = v => JSON.stringify(v);
function egal(id, titre, obtenu, attendu) {
  resultats.push({ id, titre, attendu: json(attendu), obtenu: json(obtenu), ok: json(obtenu) === json(attendu) });
}
function condition(id, titre, ok, attendu, obtenu) {
  resultats.push({ id, titre, attendu, obtenu: typeof obtenu === "string" ? obtenu : json(obtenu), ok: !!ok });
}
/** Exécute `fn` ; une exception devient un échec lisible au lieu d'interrompre toute la suite. */
function proteger(id, titre, fn) {
  try { fn(); }
  catch (e) { resultats.push({ id, titre, attendu: "pas d'exception", obtenu: `exception : ${e && e.message}`, ok: false }); }
}

const J = (colonnes, ...lignes) => ({ colonnes, lignes });
const un = v => J(["v"], [v]);                              // résultat d'une seule cellule

/** Un cas = une paire (attendu, obtenu), des options d'exercice, et le verdict espéré : { egal } ou { code }. */
function cas(id, titre, attendu, obtenu, options, espere) {
  proteger(id, titre, () => {
    const v = Comparateur.comparer(attendu, obtenu, options);
    if ("egal" in espere) egal(id, titre, v.egal, espere.egal);
    if ("code" in espere) egal(id, `${titre} (code)`, v.code, espere.code);
    if ("pasCode" in espere) condition(id, `${titre} (code exclu)`, v.code !== espere.pasCode, `≠ ${espere.pasCode}`, v.code);
  });
}
const EGAL = { egal: true }, DIFF = { egal: false };

/* ═══ NOMBRES — D031 : tolérance relative 1e-9, 1 et 1.0 sont le même résultat ═══ */
cas("NB-01", "1 et 1.0 sont le même résultat", un(1), un(1.0), {}, EGAL);
cas("NB-02", "0,1 + 0,2 et 0,3 : le bruit des flottants n'est pas une erreur", un(0.3), un(0.1 + 0.2), {}, EGAL);
cas("NB-03", "AVG non arrondi et AVG arrondi à 2 décimales ne sont PAS confondus", un(165.31), un(165.30833333333334), {}, DIFF);
cas("NB-04", "plancher absolu : 1e-10 est égal à 0", un(0), un(1e-10), {}, EGAL);
cas("NB-05", "plancher absolu : 1e-8 n'est pas égal à 0", un(0), un(1e-8), {}, DIFF);
cas("NB-06", "relatif : 12 387 et 12 387 + 1e-10 sont égaux", un(12387), un(12387 + 1e-10), {}, EGAL);
cas("NB-07", "relatif : 12 387 et 12 387,01 sont différents", un(12387), un(12387.01), {}, DIFF);
cas("NB-08", "-0 et 0 sont égaux", un(0), un(-0), {}, EGAL);
cas("NB-09", "Q2 : au-delà de 2^53 deux entiers se confondent (acceptation, jamais refus)", un(9007199254740992), un(9007199254740993), {}, EGAL);
cas("NB-10", "tri tolérant : deux lignes aux flottants quasi égaux s'apparient quel que soit l'ordre",
  J(["x", "t"], [0.30000000000000004, "x"], [0.3, "y"]), J(["x", "t"], [0.3, "y"], [0.30000000000000004, "x"]), {}, EGAL);

/* ═══ NULL — D031 : NULL n'est égal qu'à NULL (piège P3) ═══ */
cas("NU-01", "NULL et NULL sont égaux", un(null), un(null), {}, EGAL);
cas("NU-02", "NULL n'est pas 0", un(null), un(0), {}, DIFF);
cas("NU-03", "NULL n'est pas la chaîne vide", un(null), un(""), {}, DIFF);
cas("NU-04", "NULL n'est pas la chaîne « NULL »", un(null), un("NULL"), {}, DIFF);
cas("NU-05", "0 n'est pas NULL (sens inverse)", un(0), un(null), {}, DIFF);
cas("NU-06", "les NULL se trient et s'apparient : [NULL, 1] contre [1, NULL]", J(["v"], [null], [1]), J(["v"], [1], [null]), {}, EGAL);

/* ═══ TEXTE — D031 : strict, NFC invisible, « souple » en option d'exercice ═══ */
cas("TX-01", "strict : « Lyon » n'est pas « lyon »", un("Lyon"), un("lyon"), {}, DIFF);
cas("TX-02", "strict : un espace de bord compte", un("Lyon"), un(" Lyon"), {}, DIFF);
cas("TX-03", "souple : la casse ne compte plus", un("Lyon"), un("lyon"), { texte: "souple" }, EGAL);
cas("TX-04", "souple : les espaces de bord ne comptent plus", un("Lyon"), un("  LYON "), { texte: "souple" }, EGAL);
cas("TX-05", "souple : « Lyon » n'est pas « Lyonn »", un("Lyon"), un("Lyonn"), { texte: "souple" }, DIFF);
cas("TX-06", "NFC : é composé et é décomposé sont le même texte", un("été"), un("été"), {}, EGAL);
cas("TX-07", "souple ne touche pas aux nombres : 1 n'est pas 2", un(1), un(2), { texte: "souple" }, DIFF);
cas("TX-08", "souple ne retire que les espaces de bord : un espace intérieur compte encore", un("Léa Martin"), un("Léa  Martin"), { texte: "souple" }, DIFF);

/* ═══ TYPES MIXTES — D031 cas 9 : un texte égal à l'affichage d'un nombre est ce nombre ═══ */
cas("MX-01", "« 2025 » (strftime) et 2025 (CAST) s'affichent pareil : égaux", un(2025), un("2025"), {}, EGAL);
cas("MX-02", "sens inverse : 2025 attendu, « 2025 » obtenu", un("2025"), un(2025), {}, EGAL);
cas("MX-03", "« 007 » n'est pas 7 (code postal) : l'affichage diffère", un(7), un("007"), {}, DIFF);
cas("MX-04", "« 3.50 » n'est pas 3.5 (mise en forme printf) : l'affichage diffère", un(3.5), un("3.50"), {}, DIFF);
cas("MX-05", "« 3.5 » est 3.5", un(3.5), un("3.5"), {}, EGAL);
cas("MX-06", "« 1e3 » n'est pas 1000", un(1000), un("1e3"), {}, DIFF);
cas("MX-07", "la chaîne vide n'est pas 0", un(0), un(""), {}, DIFF);
cas("MX-08", "strict : « 12 » avec espace n'est pas 12", un(12), un(" 12"), {}, DIFF);
cas("MX-09", "souple : « 12 » avec espace est 12", un(12), un(" 12"), { texte: "souple" }, EGAL);
cas("MX-10", "« -5 » est -5", un(-5), un("-5"), {}, EGAL);
cas("MX-11", "un texte non numérique n'est pas 0", un(0), un("abc"), {}, DIFF);

/* ═══ BLOB — D031 cas 11 : octet par octet ═══ */
cas("BL-01", "deux blobs identiques sont égaux", un(new Uint8Array([1, 2, 3])), un(new Uint8Array([1, 2, 3])), {}, EGAL);
cas("BL-02", "deux blobs différents ne le sont pas", un(new Uint8Array([1, 2, 3])), un(new Uint8Array([1, 2, 4])), {}, DIFF);
cas("BL-03", "un blob n'est pas le texte de mêmes octets", un(new Uint8Array([65])), un("A"), {}, DIFF);

/* ═══ LIGNES — D029 : multi-ensemble par défaut (l'ordre est ignoré, les doublons comptent) ═══ */
cas("LG-01", "l'ordre des lignes est ignoré par défaut", J(["v"], [1], [2], [3]), J(["v"], [3], [1], [2]), {}, EGAL);
cas("LG-02", "les doublons comptent : [1,1,2] contre [1,2,2]", J(["v"], [1], [1], [2]), J(["v"], [1], [2], [2]), {}, DIFF);
cas("LG-03", "un doublon en trop : [1,1] contre [1]", J(["v"], [1]), J(["v"], [1], [1]), {}, DIFF);
cas("LG-04", "l'appariement est ligne à ligne, pas colonne à colonne", J(["a", "b"], [1, "a"], [2, "b"]), J(["a", "b"], [2, "b"], [1, "a"]), {}, EGAL);
cas("LG-05", "mêmes valeurs par colonne mais lignes recomposées : différent", J(["a", "b"], [1, "a"], [2, "b"]), J(["a", "b"], [2, "a"], [1, "b"]), {}, DIFF);
cas("LG-06", "deux résultats vides de mêmes colonnes sont égaux", J(["a"]), J(["a"]), {}, EGAL);

/* ═══ ORDRE — D029 : ordonne:true (ordre exact) ou ordonne:{cles} (ex æquo libres) ═══ */
const classement = J(["nom", "prix"], ["a", 10], ["b", 10], ["c", 5]);
cas("OR-01", "ordonne:true, même ordre : égal", classement, J(["nom", "prix"], ["a", 10], ["b", 10], ["c", 5]), { ordonne: true }, EGAL);
cas("OR-02", "ordonne:true, deux lignes permutées : ordre-lignes", classement, J(["nom", "prix"], ["b", 10], ["a", 10], ["c", 5]), { ordonne: true }, { code: "ordre-lignes" });
cas("OR-03", "cles:[1], ex æquo permutés : égal (le départage n'est pas exigé)", classement, J(["nom", "prix"], ["b", 10], ["a", 10], ["c", 5]), { ordonne: { cles: [1] } }, EGAL);
cas("OR-04", "cles:[1], la clé n'est plus dans l'ordre : ordre-lignes", classement, J(["nom", "prix"], ["c", 5], ["a", 10], ["b", 10]), { ordonne: { cles: [1] } }, { code: "ordre-lignes" });
cas("OR-05", "cles:[1], tri croissant au lieu de décroissant : ordre-lignes", classement, J(["nom", "prix"], ["c", 5], ["b", 10], ["a", 10]), { ordonne: { cles: [1] } }, { code: "ordre-lignes" });
cas("OR-06", "cles composite [1,2] : ex æquo sur les deux clés permutés, égal",
  J(["n", "p", "q"], ["a", 10, 1], ["b", 10, 2], ["c", 10, 2], ["d", 5, 1]),
  J(["n", "p", "q"], ["a", 10, 1], ["c", 10, 2], ["b", 10, 2], ["d", 5, 1]), { ordonne: { cles: [1, 2] } }, EGAL);
cas("OR-07", "cles composite : le second critère est exigé (q croissant, pas décroissant)",
  J(["n", "p", "q"], ["a", 10, 1], ["b", 10, 2], ["d", 5, 1]),
  J(["n", "p", "q"], ["b", 10, 2], ["a", 10, 1], ["d", 5, 1]), { ordonne: { cles: [1, 2] } }, { code: "ordre-lignes" });
cas("OR-08", "ordonne:false, ordre inversé : égal", classement, J(["nom", "prix"], ["c", 5], ["b", 10], ["a", 10]), { ordonne: false }, EGAL);
cas("OR-09", "cles : les valeurs de clé sont comparées avec la tolérance numérique",
  J(["n", "x"], ["a", 0.30000000000000004], ["b", 0.3]), J(["n", "x"], ["b", 0.3], ["a", 0.30000000000000004]), { ordonne: { cles: [1] } }, EGAL);
cas("OR-10", "tri alphabétique croissant attendu, décroissant obtenu : ordre-lignes",
  J(["nom"], ["Ana"], ["Bob"], ["Cléo"]), J(["nom"], ["Cléo"], ["Bob"], ["Ana"]), { ordonne: true }, { code: "ordre-lignes" });
cas("OR-11", "les séquences d'ex æquo doivent rester à leur place : [x1,y1,z2] contre [x1,z2,y1]",
  J(["n", "k"], ["x", 1], ["y", 1], ["z", 2]), J(["n", "k"], ["x", 1], ["z", 2], ["y", 1]), { ordonne: { cles: [1] } }, { code: "ordre-lignes" });
cas("OR-12", "lignes différentes ET ordre différent : ce n'est pas un simple problème d'ordre",
  classement, J(["nom", "prix"], ["c", 5], ["a", 10]), { ordonne: { cles: [1] } }, { pasCode: "ordre-lignes" });
proteger("OR-13", "cles hors des colonnes : erreur de configuration explicite", () => {
  let message = null;
  try { Comparateur.comparer(classement, classement, { ordonne: { cles: [5] } }); } catch (e) { message = e.message; }
  condition("OR-13", "cles hors des colonnes : erreur de configuration explicite", message && /cles/.test(message), "exception mentionnant « cles »", message || "aucune exception");
});

/* ═══ COLONNES — D030 : noms ignorés par défaut, ordre positionnel ═══ */
const deuxCol = J(["nom", "prix"], ["a", 10], ["b", 5]);
cas("CO-01", "noms de colonnes ignorés par défaut", deuxCol, J(["x", "y"], ["a", 10], ["b", 5]), {}, EGAL);
cas("CO-02", "colonnes:true, mêmes noms à la casse et aux espaces de bord près : égal", J(["Total"], [1], [2]), J([" total "], [1], [2]), { colonnes: true }, EGAL);
cas("CO-03", "colonnes:true, noms différents : noms-colonnes", J(["total"], [1], [2]), J(["total_ventes"], [1], [2]), { colonnes: true }, { code: "noms-colonnes" });
cas("CO-04", "colonnes:true, bons noms : égal", deuxCol, J(["nom", "prix"], ["a", 10], ["b", 5]), { colonnes: true }, EGAL);
cas("CO-05", "ordre des colonnes positionnel : colonnes-ordre", J(["a", "b"], [1, "x"], [2, "y"]), J(["b", "a"], ["x", 1], ["y", 2]), {}, { code: "colonnes-ordre" });
cas("CO-06", "une colonne en trop, lignes identiques après projection : colonne-en-trop", J(["v"], [1], [2]), J(["v", "w"], [1, "a"], [2, "b"]), {}, { code: "colonne-en-trop" });
cas("CO-07", "une colonne en moins, lignes identiques : colonne-manquante", J(["v", "w"], [1, "a"], [2, "b"]), J(["v"], [1], [2]), {}, { code: "colonne-manquante" });
cas("CO-08", "colonnes différentes en nombre ET lignes différentes : colonnes-nombre", J(["v"], [1], [2]), J(["v", "w"], [9, "a"], [8, "b"]), {}, { code: "colonnes-nombre" });
cas("CO-09", "aucune ligne obtenue : aucune-ligne, même si les colonnes diffèrent", J(["v", "w"], [1, "a"]), J(["z"]), {}, { code: "aucune-ligne" });
cas("CO-10", "colonne en trop au milieu, ordre conservé : colonne-en-trop", J(["a", "c"], [1, 3], [2, 4]), J(["a", "b", "c"], [1, 9, 3], [2, 9, 4]), {}, { code: "colonne-en-trop" });
cas("CO-11", "colonne en trop ET colonnes permutées : colonne-en-trop", J(["a", "b"], [1, "x"], [2, "y"]), J(["b", "z", "a"], ["x", 0, 1], ["y", 0, 2]), {}, { code: "colonne-en-trop" });
cas("CO-12", "colonnes:true avec cles:[1] : bons noms et ex æquo permutés, égal", classement, J(["nom", "prix"], ["b", 10], ["a", 10], ["c", 5]), { colonnes: true, ordonne: { cles: [1] } }, EGAL);

/* ═══ MOTEUR — D032 (deux exécutions), D036 (plafond de lecture, délai) ; src/moteur.js ═══ */
condition("MO-00", "src/moteur.js se charge et s'initialise sous Node comme dans le navigateur", !erreurMoteur, "aucune erreur", erreurMoteur || "aucune erreur");
const sondage = (id, titre, fn) => proteger(id, titre, fn);

sondage("MO-01", "executerIsole : un SELECT renvoie ses lignes, sans erreur, sans écriture", () => {
  const r = Moteur.executerIsole("SELECT COUNT(*) AS n FROM clients");
  egal("MO-01", "executerIsole : un SELECT renvoie ses lignes, sans erreur, sans écriture",
    { jeux: r.jeux, erreur: r.erreur, instructions: r.instructions, ecritures: r.ecritures },
    { jeux: [{ colonnes: ["n"], lignes: [[40]], tronque: false }], erreur: null, instructions: 1, ecritures: false });
});
sondage("MO-02", "deux instructions : deux jeux, instructions = 2", () => {
  const r = Moteur.executerIsole("SELECT 1; SELECT 2;");
  egal("MO-02", "deux instructions : deux jeux, instructions = 2", [r.instructions, r.jeux.map(j => j.lignes[0][0])], [2, [1, 2]]);
});
sondage("MO-03", "INSERT … RETURNING : renvoie des colonnes ET est détecté comme écriture (F2)", () => {
  const r = Moteur.executerIsole("INSERT INTO categories(id, nom) VALUES (99, 'Test') RETURNING id;");
  egal("MO-03", "INSERT … RETURNING : renvoie des colonnes ET est détecté comme écriture (F2)", [r.jeux.length, r.ecritures, r.erreur], [1, true, null]);
});
sondage("MO-04", "CREATE TABLE : aucune colonne, mais détecté comme écriture (schema_version)", () => {
  const r = Moteur.executerIsole("CREATE TABLE t(a);");
  egal("MO-04", "CREATE TABLE : aucune colonne, mais détecté comme écriture (schema_version)", [r.jeux.length, r.ecritures], [0, true]);
});
sondage("MO-05", "PRAGMA sans colonne : ni jeu ni écriture", () => {
  const r = Moteur.executerIsole("PRAGMA foreign_keys = OFF;");
  egal("MO-05", "PRAGMA sans colonne : ni jeu ni écriture", [r.jeux.length, r.ecritures, r.instructions], [0, false, 1]);
});
sondage("MO-06", "DELETE sur lignes_commande : écriture ; sur commandes : refusé par la clé étrangère, aucune écriture", () => {
  const a = Moteur.executerIsole("DELETE FROM lignes_commande WHERE commande_id = 1001;");
  const b = Moteur.executerIsole("DELETE FROM commandes WHERE id = 1001;");
  egal("MO-06", "DELETE sur lignes_commande : écriture ; sur commandes : refusé par la clé étrangère, aucune écriture",
    [a.ecritures, a.erreur, b.ecritures, b.erreur], [true, null, false, "FOREIGN KEY constraint failed"]);
});
sondage("MO-07", "requête vide ou commentaires seuls : aucune instruction, aucune erreur", () => {
  const vide = Moteur.executerIsole(""), com = Moteur.executerIsole("-- rien\n/* x */");
  egal("MO-07", "requête vide ou commentaires seuls : aucune instruction, aucune erreur",
    [vide.instructions, vide.erreur, com.instructions, com.erreur], [0, null, 0, null]);
});
sondage("MO-08", "erreur de syntaxe : le message SQLite brut, tel quel", () => {
  const r = Moteur.executerIsole("SELEC 1;");
  egal("MO-08", "erreur de syntaxe : le message SQLite brut, tel quel", [r.erreur, r.jeux.length], ['near "SELEC": syntax error', 0]);
});
sondage("MO-09", "C7 — un DELETE lancé sur la base vivante ne fausse pas une exécution isolée", () => {
  const vivant = Moteur.executer("DELETE FROM lignes_commande;");
  const vue = Moteur.executer("SELECT COUNT(*) FROM lignes_commande;");
  const isole = Moteur.executerIsole("SELECT COUNT(*) FROM lignes_commande;");
  nouvelleBase();
  egal("MO-09", "C7 — un DELETE lancé sur la base vivante ne fausse pas une exécution isolée",
    [vivant.ecritures, vue.jeux[0].lignes[0][0], isole.jeux[0].lignes[0][0]], [true, 0, 142]);
});
sondage("MO-10", "C8 — le produit cartésien de 4 tables est tronqué à 10 000 lignes, vite", () => {
  const t0 = Date.now();
  const r = Moteur.executerIsole("SELECT * FROM clients, commandes, lignes_commande, produits");
  const duree = Date.now() - t0;
  egal("MO-10", "C8 — le produit cartésien de 4 tables est tronqué à 10 000 lignes, vite",
    [r.jeux[0].lignes.length, r.jeux[0].tronque, r.tronque, r.limiteLecture, duree < 3000], [10000, true, true, 10000, true]);
});
sondage("MO-11", "frontière du plafond : exactement N lignes ne tronque pas, N + 1 tronque", () => {
  const juste = Moteur.executerIsole("SELECT id FROM produits WHERE id <= 105", { limiteLecture: 5 });   // 101 à 105 : 5 lignes
  const trop = Moteur.executerIsole("SELECT id FROM produits WHERE id <= 106", { limiteLecture: 5 });    // 6 lignes
  egal("MO-11", "frontière du plafond : exactement N lignes ne tronque pas, N + 1 tronque",
    [juste.jeux[0].lignes.length, juste.tronque, trop.jeux[0].lignes.length, trop.tronque], [5, false, 5, true]);
});
sondage("MO-12", "plafond: false : une solution de référence n'est jamais plafonnée", () => {
  const r = Moteur.executerIsole("SELECT * FROM clients, commandes, lignes_commande WHERE lignes_commande.commande_id < 1010", { plafond: false });
  condition("MO-12", "plafond: false : une solution de référence n'est jamais plafonnée", !r.tronque && r.jeux[0].lignes.length > 10000, "> 10 000 lignes, non tronqué", r.jeux[0].lignes.length);
});
sondage("MO-13", "délai : la lecture est interrompue entre deux lignes, le jeu partiel est conservé", () => {
  const t0 = Date.now();
  const r = Moteur.executerIsole("SELECT * FROM clients, commandes, lignes_commande, produits", { limiteLecture: Infinity, delaiMs: 30 });
  const duree = Date.now() - t0;
  condition("MO-13", "délai : la lecture est interrompue entre deux lignes, le jeu partiel est conservé", r.interrompu && r.jeux.length === 1 && r.jeux[0].lignes.length > 0 && duree < 2000, "interrompu, jeu partiel, < 2 s", { interrompu: r.interrompu, lignes: r.jeux[0] && r.jeux[0].lignes.length, ms: duree });
});
sondage("MO-14", "un blob revient intact après la fermeture de la base jetable", () => {
  const r = Moteur.executerIsole("SELECT x'0102'");
  egal("MO-14", "un blob revient intact après la fermeture de la base jetable", Array.from(r.jeux[0].lignes[0][0]), [1, 2]);
});
sondage("MO-15", "nouvelleBase() : base neuve, clés étrangères actives, temps mesuré (D023)", () => {
  Moteur.executer("DELETE FROM lignes_commande;");
  const ms = nouvelleBase();
  const r = Moteur.executer("SELECT (SELECT COUNT(*) FROM lignes_commande), (SELECT foreign_keys FROM pragma_foreign_keys)");
  egal("MO-15", "nouvelleBase() : base neuve, clés étrangères actives, temps mesuré (D023)", [r.jeux[0].lignes[0], typeof ms, ms === Moteur.etat.msBase], [[142, 1], "number", true]);
});
sondage("MO-16", "nouvelleBase(autreSeed) puis nouvelleBase() : le seed principal revient (D027)", () => {
  nouvelleBase("CREATE TABLE x(a);");
  const autre = Moteur.nbTables();
  nouvelleBase();
  egal("MO-16", "nouvelleBase(autreSeed) puis nouvelleBase() : le seed principal revient (D027)", [autre, Moteur.nbTables()], [1, 5]);
});
sondage("MO-17", "Moteur.executer : même rapport que l'exécution isolée, base vivante conservée entre deux appels", () => {
  Moteur.executer("CREATE TABLE note_vivante(a); INSERT INTO note_vivante VALUES (7);");
  const r = Moteur.executer("SELECT a FROM note_vivante;");
  nouvelleBase();
  egal("MO-17", "Moteur.executer : même rapport que l'exécution isolée, base vivante conservée entre deux appels", [r.jeux[0].lignes, r.limite], [[[7]], 500]);
});

/* ═══ DIAGNOSTICS — D034 : le constat est toujours vrai ; la piste n'est donnée que si c'est un fait ou un lieu où regarder.
   Chaque code du catalogue est déclenché ici par un cas réel du seed gelé. ═══ */
const jeuSQL = (sql, opts) => {
  const r = Moteur.executerIsole(sql, opts);
  if (r.erreur) throw new Error(`${sql} → ${r.erreur}`);
  return r.jeux[r.jeux.length - 1];
};
const comparerSQL = (ref, tent, options) => Comparateur.comparer(jeuSQL(ref, { plafond: false }), jeuSQL(tent), options);

/** att : { code, contient[], pistesContiennent[], pistes: 0, absent[] (ne doit apparaître ni dans le constat, ni dans les pistes, ni dans l'écart),
 *          masque, attenduNul, ecart: { champ: valeur } } */
const messages = [];                       // pour `node verifier-comparateur.mjs --messages` : les textes tels que l'apprenant les lira
function diag(id, titre, ref, tent, options, att) {
  proteger(id, titre, () => {
    const v = comparerSQL(ref, tent, options);
    messages.push({ id, code: v.code, masque: v.masque, constat: v.constat, pistes: v.pistes });
    const echecs = [];
    const enPistes = v.pistes.join(" ¶ ");
    const visible = JSON.stringify({ c: v.constat, p: v.pistes, e: v.ecart, a: v.attendu });
    if ("code" in att && v.code !== att.code) echecs.push(`code « ${v.code} » au lieu de « ${att.code} »`);
    for (const s of att.contient || []) if (!v.constat.includes(s)) echecs.push(`constat sans « ${s} »`);
    for (const s of att.pistesContiennent || []) if (!enPistes.includes(s)) echecs.push(`pistes sans « ${s} »`);
    if (att.pistes === 0 && v.pistes.length) echecs.push(`aucune piste attendue, reçu : ${json(v.pistes)}`);
    for (const s of att.absent || []) if (visible.includes(s)) echecs.push(`« ${s} » ne doit apparaître nulle part (constat, pistes, écart, attendu)`);
    if ("masque" in att && v.masque !== att.masque) echecs.push(`masque = ${v.masque}`);
    if (att.attenduNul && v.attendu !== null) echecs.push("attendu devrait être null");
    for (const [k, valeur] of Object.entries(att.ecart || {})) if (json(v.ecart && v.ecart[k]) !== json(valeur)) echecs.push(`ecart.${k} = ${json(v.ecart && v.ecart[k])} au lieu de ${json(valeur)}`);
    resultats.push({ id, titre, attendu: json(att.code), obtenu: echecs.length ? `${echecs.join(" ; ")}  |  constat : ${v.constat}` : "conforme", ok: !echecs.length });
  });
}

const PRODUITS_100 = "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC, id";
const ORDRE_PRIX = { ordonne: { cles: [1] } };

diag("DG-01", "code 1 — jointure sur de mauvaises colonnes (D013) : aucune ligne",
  "SELECT c.id AS client, o.id AS commande FROM clients c JOIN commandes o ON o.client_id = c.id",
  "SELECT c.id AS client, o.id AS commande FROM clients c JOIN commandes o ON c.id = o.id", {},
  { code: "aucune-ligne", contient: ["Aucune ligne obtenue", "70 attendues"], pistesContiennent: ["WHERE", "ON"] });
diag("DG-02", "code 1 — NOT IN face à des NULL (P9) : aucune ligne, et AUCUNE piste sur NOT IN (précise mais incertaine)",
  "SELECT id FROM clients c WHERE NOT EXISTS (SELECT 1 FROM clients f WHERE f.parrain_id = c.id)",
  "SELECT id FROM clients WHERE id NOT IN (SELECT parrain_id FROM clients)", {},
  { code: "aucune-ligne", contient: ["Aucune ligne obtenue", "31 attendues"], absent: ["NOT IN"] });
diag("DG-03", "code 2 — une colonne en trop, lignes identiques après projection",
  PRODUITS_100, "SELECT id, nom, prix FROM produits WHERE prix > 100 ORDER BY id", {},
  { code: "colonne-en-trop", contient: ["une colonne de trop", "« id »", "colonne n° 1"], pistesContiennent: ["SELECT"], ecart: { colonnesEnTrop: [{ position: 1, nom: "id" }] } });
diag("DG-04", "code 2 — une colonne manquante, lignes identiques après projection",
  PRODUITS_100, "SELECT nom FROM produits WHERE prix > 100", {},
  { code: "colonne-manquante", contient: ["il en manque une", "« prix »", "colonne n° 2"], pistesContiennent: ["SELECT"] });
diag("DG-05", "code 3 — nombre de colonnes différent et lignes différentes",
  PRODUITS_100, "SELECT * FROM produits WHERE prix > 500", {},
  { code: "colonnes-nombre", contient: ["5 colonnes obtenues, 2 attendues", "2 lignes obtenues, 6 attendues"], pistesContiennent: ["SELECT"] });
diag("DG-06", "code 4 — mêmes lignes, tri croissant au lieu de décroissant",
  PRODUITS_100, "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix", ORDRE_PRIX,
  { code: "ordre-lignes", contient: ["pas dans l'ordre demandé"], pistesContiennent: ["ORDER BY"] });
diag("DG-07", "C2 — le tri sur la seule clé (ex æquo non départagés) est accepté : 1 299 ×2 et 449 ×2",
  PRODUITS_100, "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC", ORDRE_PRIX,
  { code: "ok" });
diag("DG-08", "code 5 — colonnes:true, bonne valeur, mauvais nom",
  "SELECT statut, COUNT(*) AS total FROM commandes GROUP BY statut", "SELECT statut, COUNT(*) AS total_ventes FROM commandes GROUP BY statut", { colonnes: true },
  { code: "noms-colonnes", contient: ["« total »", "« total_ventes »", "colonne 2"], pistesContiennent: ["AS"] });
diag("DG-09", "code 6 — les bonnes colonnes dans un autre ordre",
  PRODUITS_100, "SELECT prix, nom FROM produits WHERE prix > 100 ORDER BY prix DESC, id", {},
  { code: "colonnes-ordre", contient: ["autre ordre", "« nom » puis « prix »"], pistesContiennent: ["SELECT"] });
diag("DG-10", "code 7 — justes à la casse près (libellé saisi par l'apprenant)",
  "SELECT id, CASE WHEN prix > 100 THEN 'haut' ELSE 'bas' END AS niveau FROM produits",
  "SELECT id, CASE WHEN prix > 100 THEN 'Haut' ELSE 'bas' END AS niveau FROM produits", {},
  { code: "casse-espaces", contient: ["à la casse", "« Haut »", "« haut »"], pistes: 0 });
diag("DG-11", "code 8 — une seule ligne : agrégat sans GROUP BY",
  "SELECT statut, COUNT(*) AS n FROM commandes GROUP BY statut", "SELECT statut, COUNT(*) AS n FROM commandes", {},
  { code: "une-seule-ligne", contient: ["Une seule ligne obtenue", "5 attendues"], pistesContiennent: ["GROUP BY", "LIMIT"] });
diag("DG-12", "code 8 (inverse) — plusieurs lignes pour un attendu 1×1 : constat seul, valeur attendue jamais exposée",
  "SELECT COUNT(*) AS n FROM commandes", "SELECT id FROM commandes", {},
  { code: "plusieurs-lignes", contient: ["70 lignes obtenues", "une seule attendue"], pistes: 0, masque: true, attenduNul: true });
diag("DG-13", "code 9 — jointure qui duplique : 142 lignes pour 70 commandes, sans doublons on retrouve l'attendu",
  "SELECT id FROM commandes", "SELECT o.id FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id", {},
  { code: "doublons", contient: ["142 lignes obtenues, 70 attendues", "supprimez les doublons"], pistesContiennent: ["jointure", "DISTINCT"] });
diag("DG-14", "code 9 — attendu avec doublons : l'énoncé reste vrai (lignes distinctes égales, répétitions en trop)",
  "SELECT ville FROM clients c WHERE EXISTS (SELECT 1 FROM commandes o WHERE o.client_id = c.id)", "SELECT c.ville FROM clients c JOIN commandes o ON o.client_id = c.id", {},
  { code: "doublons", contient: ["répétées plus souvent que prévu"] });
diag("DG-15", "code 10 — des lignes en trop : <> 'annulee' ramène les retournées (P7)",
  "SELECT id FROM commandes WHERE statut NOT IN ('annulee', 'retournee')", "SELECT id FROM commandes WHERE statut <> 'annulee'", {},
  { code: "lignes-en-trop", contient: ["5 lignes en trop", "toutes les lignes attendues sont présentes"], pistesContiennent: ["WHERE", "Écart"], ecart: { nbEnTrop: 5, communes: 54 } });
diag("DG-16", "code 11 — des lignes manquantes : INNER JOIN contre LEFT JOIN (P1, 34 contre 40)",
  "SELECT c.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id ORDER BY c.id", "SELECT c.id FROM clients c INNER JOIN commandes o ON o.client_id = c.id GROUP BY c.id", {},
  { code: "lignes-manquantes", contient: ["6 lignes manquantes", "34 obtenues, 40 attendues"], pistesContiennent: ["WHERE", "Écart"], ecart: { nbManquantes: 6, manquantes: [[215], [222], [228]] } });
diag("DG-17", "code 11 — ville <> 'Lyon' ne ramène pas les NULL (P3, 30 contre 34)",
  "SELECT id FROM clients WHERE ville <> 'Lyon' OR ville IS NULL", "SELECT id FROM clients WHERE ville <> 'Lyon'", {},
  { code: "lignes-manquantes", contient: ["4 lignes manquantes"], ecart: { nbManquantes: 4, manquantes: [[205], [211], [223]], absentsAttendus: [2, 7, 18, 24] } });   // positions de 205, 211, 223, 230 parmi les 34 lignes attendues (les clients de Lyon 202, 204, 209, 216, 226 les précèdent)
diag("DG-18", "code 11 — DISTINCT en trop : les lignes distinctes sont les bonnes, l'attendu en répète",
  "SELECT ville FROM clients WHERE ville IS NOT NULL", "SELECT DISTINCT ville FROM clients WHERE ville IS NOT NULL", {},
  { code: "lignes-manquantes", contient: ["en répète certaines"], pistesContiennent: ["DISTINCT", "GROUP BY"] });
diag("DG-19", "code 12 — COUNT(*) contre COUNT(o.id) : même forme, 6 cellules en écart",
  "SELECT c.id, COUNT(o.id) AS n FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id ORDER BY c.id",
  "SELECT c.id, COUNT(*) AS n FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id", {},
  { code: "valeurs", contient: ["Même forme", "6 lignes diffèrent", "ligne 15", "colonne « n »", "1 obtenu, 0 attendu"], pistes: 0 });
diag("DG-20", "code 12 — NULL contre 0 (COALESCE) : le NULL est nommé, avec le rappel que ce n'est pas 0",
  "SELECT id, COALESCE(note, 0) AS note FROM commandes", "SELECT id, note FROM commandes", {},
  { code: "valeurs", contient: ["NULL obtenu, 0 attendu"], pistesContiennent: ["ni 0 ni une chaîne vide"] });
diag("DG-21", "code 12 — valeurs proches (P10 : 12 387 contre 12 445, 0,47 %), résultat 1×1 : l'attendu n'est pas exposé",
  "SELECT SUM(l.quantite * l.prix_unitaire) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id WHERE o.statut NOT IN ('annulee','retournee')",
  "SELECT SUM(l.quantite * p.prix) FROM lignes_commande l JOIN commandes o ON o.id = l.commande_id JOIN produits p ON p.id = l.produit_id WHERE o.statut NOT IN ('annulee','retournee')", {},
  { code: "valeurs", contient: ["Même forme", "la valeur est différente", "proches (moins de 10 %)"], pistesContiennent: ["lignes prises en compte"], masque: true, attenduNul: true, absent: ["12387", "12 387", "0,47"] });
diag("DG-22", "code 12 — AVG non arrondi, attendu ROUND(…, 2) : l'arrondi est nommé sans livrer la valeur (1×1)",
  "SELECT ROUND(AVG(prix), 2) FROM produits", "SELECT AVG(prix) FROM produits", {},
  { code: "valeurs", contient: ["arrondie à 2 décimales", "exactement la valeur attendue"], pistesContiennent: ["ROUND(valeur, 2)"], masque: true, absent: ["165,31", "165.31"] });
diag("DG-23", "code 12 — l'apprenant a arrondi, l'attendu non (1×1)",
  "SELECT AVG(prix) FROM produits", "SELECT ROUND(AVG(prix), 2) FROM produits", {},
  { code: "valeurs", contient: ["Vous avez arrondi", "n'est pas arrondie"], masque: true, absent: ["165,308"] });
diag("DG-24", "code 12 — partie entière : la division de deux entiers (P8), 1×1",
  "SELECT SUM(quantite) * 1.0 / COUNT(*) FROM lignes_commande", "SELECT SUM(quantite) / COUNT(*) FROM lignes_commande", {},
  { code: "valeurs", contient: ["partie entière"], pistesContiennent: ["division de deux entiers"], masque: true, absent: ["1,3098"] });
diag("DG-25", "code 12 — valeurs franchement différentes (AVG contre SUM/COUNT, P3) : constat seul, 1×1",
  "SELECT AVG(note) FROM commandes", "SELECT SUM(note) * 1.0 / COUNT(*) FROM commandes", {},
  { code: "valeurs", contient: ["la valeur est différente"], pistes: 0, masque: true, attenduNul: true, absent: ["3,75", "3.75"] });
diag("DG-26", "code 12 — plus d'une cellule attendue (1 ligne × 2 colonnes) : l'attendu EST affiché",
  "SELECT MIN(prix) AS petit, MAX(prix) AS grand FROM produits", "SELECT MIN(prix) AS petit, MIN(prix) AS grand FROM produits", {},
  { code: "valeurs", masque: false, contient: ["colonne « grand »", "3,5 obtenu, 1299 attendu"] });
diag("DG-27", "code 13 — recouvrement partiel : des lignes en commun, des manquantes, des en trop",
  "SELECT id FROM produits WHERE prix > 100", "SELECT id FROM produits WHERE categorie_id = 1", {},
  { code: "partiel", contient: ["en commun", "en trop"], pistesContiennent: ["Écart"] });
diag("DG-28", "code 12 — NULL en jeu dans un 1×1 : NULL est nommé sans dire dans quel sens",
  "SELECT note FROM commandes WHERE id = 1005", "SELECT COALESCE(note, 0) FROM commandes WHERE id = 1005", {},
  { code: "valeurs", masque: true, contient: ["NULL"], pistesContiennent: ["ni 0 ni une chaîne vide"], absent: ["NULL attendu", "attendu : NULL", "NULL est attendu"] });

/* Forme du verdict (D034) : { egal, code, constat, pistes, ecart, masque, attendu, obtenu } */
proteger("DG-30", "verdict de réussite : constat vide, aucune piste, aucun écart", () => {
  const v = Comparateur.comparer(un(1), un(1.0), {});
  egal("DG-30", "verdict de réussite : constat vide, aucune piste, aucun écart", [v.egal, v.code, v.constat, v.pistes, v.ecart], [true, "ok", "", [], null]);
});
proteger("DG-31", "masque : vrai seulement pour un attendu d'UNE cellule ; l'obtenu est toujours rendu", () => {
  const m1 = Comparateur.comparer(un(1), un(2), {});
  const m2 = Comparateur.comparer(J(["a", "b"], [1, 2]), J(["a", "b"], [1, 3]), {});
  const m3 = Comparateur.comparer(J(["a"], [1], [2]), J(["a"], [1], [3]), {});
  egal("DG-31", "masque : vrai seulement pour un attendu d'UNE cellule ; l'obtenu est toujours rendu",
    [m1.masque, m1.attendu, m1.obtenu.lignes, m2.masque, m2.attendu !== null, m3.masque, m3.attendu !== null],
    [true, null, [[2]], false, true, false, true]);
});
proteger("DG-32", "le comparateur est déterministe : même entrée, même verdict, deux fois", () => {
  const a = comparerSQL("SELECT id FROM commandes", "SELECT o.id FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id", {});
  const b = comparerSQL("SELECT id FROM commandes", "SELECT o.id FROM commandes o JOIN lignes_commande l ON l.commande_id = o.id", {});
  egal("DG-32", "le comparateur est déterministe : même entrée, même verdict, deux fois", json(a), json(b));
});

/* ═══ GARDE-FOUS — D032 (vide, écriture, instructions multiples, plafond, délai) et D033 (déterminisme côté apprenant) ═══ */
const BASE = { dateReference: "2026-06-30", dateReferenceTexte: "30 juin 2026" };
const evalSQL = (ref, tent, options, base) =>
  Comparateur.evaluer({ attendu: jeuSQL(ref, { plafond: false }), rapport: Moteur.executerIsole(tent), options: options || {}, sql: tent, base });
const COMPTE_CLIENTS = "SELECT COUNT(*) AS n FROM clients";

/** att : { statut, code, contient[], absent[], notes: [codes], compte } — vérifie le verdict d'évaluation d'une tentative. */
function eval_(id, titre, ref, tent, options, base, att) {
  proteger(id, titre, () => {
    const v = evalSQL(ref, tent, options, base);
    const echecs = [];
    const visible = [v.constat, ...(v.pistes || []), ...(v.notes || []).map(n => n.texte), v.details || ""].join(" ¶ ");
    messages.push({ id, code: `${v.statut}/${v.code}`, masque: v.masque, constat: v.constat + (v.details ? `  [écart : ${v.details}]` : "") + (v.notes && v.notes.length ? `  [notes : ${v.notes.map(n => n.texte).join(" | ")}]` : ""), pistes: v.pistes || [] });
    if ("statut" in att && v.statut !== att.statut) echecs.push(`statut « ${v.statut} » au lieu de « ${att.statut} »`);
    if ("code" in att && v.code !== att.code) echecs.push(`code « ${v.code} » au lieu de « ${att.code} »`);
    if ("compte" in att && v.compte !== att.compte) echecs.push(`compte = ${v.compte}`);
    if ("constat" in att && v.constat !== att.constat) echecs.push(`constat « ${v.constat} » au lieu de « ${att.constat} »`);
    for (const s of att.contient || []) if (!visible.includes(s)) echecs.push(`rien ne dit « ${s} »`);
    for (const s of att.absent || []) if (visible.includes(s)) echecs.push(`« ${s} » ne devrait pas apparaître`);
    if (att.notes && json((v.notes || []).map(n => n.code)) !== json(att.notes)) echecs.push(`notes ${json((v.notes || []).map(n => n.code))} au lieu de ${json(att.notes)}`);
    resultats.push({ id, titre, attendu: `${att.statut}/${att.code || "-"}`, obtenu: echecs.length ? `${echecs.join(" ; ")}  |  ${v.statut}/${v.code} : ${v.constat}` : "conforme", ok: !echecs.length });
  });
}

eval_("EV-01", "C6 — requête vide : non évaluée, ne compte pas comme une tentative", COMPTE_CLIENTS, "", {}, BASE,
  { statut: "non-evalue", code: "vide", constat: "Requête vide.", compte: false });
eval_("EV-02", "C6 — commentaires seuls : requête vide", COMPTE_CLIENTS, "-- rien\n/* x */", {}, BASE, { statut: "non-evalue", code: "vide" });
eval_("EV-03", "C6 — SELEC : le message SQLite brut, tel quel, sans rien d'autre", COMPTE_CLIENTS, "SELEC 1;", {}, BASE,
  { statut: "non-evalue", code: "erreur-sql", constat: 'near "SELEC": syntax error', compte: false });
eval_("EV-04", "C6 — table inconnue : le message SQLite brut", COMPTE_CLIENTS, "SELECT * FROM inconnue;", {}, BASE,
  { statut: "non-evalue", code: "erreur-sql", constat: "no such table: inconnue" });
eval_("EV-05", "C6 — INSERT … RETURNING : refusé comme écriture bien qu'il renvoie des colonnes (F2)", COMPTE_CLIENTS,
  "INSERT INTO categories(id, nom) VALUES (99, 'Test') RETURNING id;", {}, BASE,
  { statut: "non-evalue", code: "ecriture", contient: ["hors programme"], compte: false });
eval_("EV-06", "C6 — DELETE réussi : refusé comme écriture, même suivi d'un SELECT correct", COMPTE_CLIENTS,
  "DELETE FROM lignes_commande WHERE commande_id = 1001; SELECT COUNT(*) AS n FROM clients;", {}, BASE,
  { statut: "non-evalue", code: "ecriture" });
eval_("EV-07", "C6 — DELETE sur commandes : refusé par la clé étrangère, erreur SQLite brute (rien n'a été écrit)", COMPTE_CLIENTS,
  "DELETE FROM commandes WHERE id = 1001;", {}, BASE, { statut: "non-evalue", code: "erreur-sql", constat: "FOREIGN KEY constraint failed" });
eval_("EV-08", "C6 — PRAGMA seul : aucun jeu de résultats", COMPTE_CLIENTS, "PRAGMA foreign_keys = OFF;", {}, BASE,
  { statut: "non-evalue", code: "aucun-jeu", contient: ["ne renvoie aucune ligne"] });
eval_("EV-09", "D028 — deux SELECT, le dernier est bon : réussite avec une note", COMPTE_CLIENTS,
  "SELECT 1; SELECT COUNT(*) AS n FROM clients;", {}, BASE, { statut: "reussi", code: "ok", notes: ["instructions"], contient: ["2 instructions"], compte: true });
eval_("EV-10", "D028 — deux SELECT, le dernier est faux : incorrect (c'est le dernier qu'on juge), avec la note", COMPTE_CLIENTS,
  "SELECT COUNT(*) AS n FROM clients; SELECT 1;", {}, BASE, { statut: "incorrect", notes: ["instructions"], compte: true });
eval_("EV-11", "réussite : statut reussi, compte, aucune note", COMPTE_CLIENTS, COMPTE_CLIENTS, {}, BASE,
  { statut: "reussi", code: "ok", notes: [], compte: true });
eval_("EV-12", "résultat faux : statut incorrect, code du comparateur, compte comme tentative", COMPTE_CLIENTS, "SELECT COUNT(ville) AS n FROM clients", {}, BASE,
  { statut: "incorrect", code: "valeurs", compte: true, contient: ["la valeur est différente"] });
eval_("EV-13", "C4 — date('now') dans une requête au résultat CORRECT : acceptée, avec une note (« pas demain »)", "SELECT COUNT(*) FROM commandes",
  "SELECT COUNT(*) FROM commandes WHERE date('now') > '2000-01-01'", {}, BASE,
  { statut: "reussi", code: "ok", notes: ["temporel"], contient: ["date('now')", "aujourd'hui", "30 juin 2026"] });
eval_("EV-14", "C4 — date('now') au résultat FAUX : message dédié renvoyant à la date de référence, écart conservé à part", "SELECT '1999-01-01' AS d",
  "SELECT date('now') AS d", {}, BASE,
  { statut: "incorrect", code: "temporel", contient: ["date du jour", "date('now')", "30 juin 2026", "'2026-06-30'", "Même forme"], compte: true });
eval_("EV-15", "D033 — julianday('now') est détecté (la forme que P11 appelle)", "SELECT 2 AS retards",
  "SELECT COUNT(*) AS retards FROM commandes WHERE statut = 'expediee' AND julianday('now') - julianday(date_commande) > -10000", {}, BASE,
  { statut: "incorrect", code: "temporel", contient: ["julianday('now')"] });
eval_("EV-16", "D033 — date() sans argument lit la date du jour : détecté", "SELECT '1999-01-01' AS d", "SELECT date() AS d", {}, BASE,
  { statut: "incorrect", code: "temporel", contient: ["date()"] });
eval_("EV-17", "D033 — random() : message sur le hasard, pas sur la date de référence", "SELECT 1 AS x", "SELECT random() AS x", {}, BASE,
  { statut: "incorrect", code: "temporel", contient: ["hasard", "random()"], absent: ["30 juin 2026"] });
eval_("EV-18", "D033 — sans date de référence fournie, le message reste valable", "SELECT '1999-01-01' AS d", "SELECT date('now') AS d", {}, undefined,
  { statut: "incorrect", code: "temporel", contient: ["date du jour", "date de référence"] });
eval_("EV-19", "D033 — une erreur SQLite n'est jamais habillée d'un message sur la date", "SELECT 1", "SELEC date('now')", {}, BASE,
  { statut: "non-evalue", code: "erreur-sql", absent: ["date du jour"] });
eval_("EV-20", "C8 — résultat tronqué au plafond de lecture : incorrect, sans comparer des lignes qu'on n'a pas toutes lues", "SELECT COUNT(*) AS n FROM clients",
  "SELECT * FROM clients, commandes, lignes_commande, produits", {}, BASE,
  { statut: "incorrect", code: "trop-de-lignes", contient: ["Plus de 10 000 lignes obtenues, une seule attendue"], compte: true });
proteger("EV-21", "délai dépassé : non évalué, avec la durée en clair", () => {
  const rapport = Moteur.executerIsole("SELECT * FROM clients, commandes, lignes_commande, produits", { limiteLecture: Infinity, delaiMs: 30 });
  const v = Comparateur.evaluer({ attendu: jeuSQL(COMPTE_CLIENTS), rapport, options: {}, sql: "…", base: BASE });
  egal("EV-21", "délai dépassé : non évalué, avec la durée en clair", [v.statut, v.code, v.compte, /interrompue au bout de 30 ms/.test(v.constat)], ["non-evalue", "interrompu", false, true]);
});
proteger("EV-22", "un verdict non évalué ne porte aucune valeur attendue", () => {
  const v = evalSQL(COMPTE_CLIENTS, "", {}, BASE);
  egal("EV-22", "un verdict non évalué ne porte aucune valeur attendue", [v.attendu, v.reussi], [null, false]);
});
eval_("EV-23", "options transmises au comparateur : ordre exigé sur la clé, ex æquo libres", PRODUITS_100,
  "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC", ORDRE_PRIX, BASE, { statut: "reussi", code: "ok" });

/* Détection des constructions non déterministes : pure, sans moteur. Entre guillemets, ce n'est pas du SQL exécutable. */
const detecte = sql => Comparateur.construitsTemporels(sql).map(c => `${c.type}:${c.libelle}`);
const DETECTION = [
  ["SELECT date('now')", ["date:date('now')"]],
  ["SELECT DATE('NOW')", ["date:date('now')"]],
  ["SELECT julianday('now') - julianday(date_commande) FROM commandes", ["date:julianday('now')"]],
  ["SELECT strftime('%Y', 'now')", ["date:strftime('now')"]],
  ["SELECT datetime('now', 'localtime')", ["date:datetime('now')"]],
  ["SELECT date('now', '-1 month'), date('now')", ["date:date('now')"]],
  ["SELECT date()", ["date:date()"]],
  ["SELECT time()", ["date:time()"]],
  ["SELECT datetime()", ["date:datetime()"]],
  ["SELECT julianday()", ["date:julianday()"]],
  ["SELECT unixepoch()", ["date:unixepoch()"]],
  ["SELECT strftime('%Y')", ["date:strftime(format) sans date"]],
  ["SELECT CURRENT_TIMESTAMP", ["date:CURRENT_TIMESTAMP"]],
  ["SELECT current_date, current_time", ["date:CURRENT_DATE", "date:CURRENT_TIME"]],
  ["SELECT random()", ["hasard:random()"]],
  ["SELECT * FROM clients ORDER BY RANDOM() LIMIT 1", ["hasard:random()"]],
  ["SELECT randomblob(4)", ["hasard:randomblob()"]],
  ["SELECT date('now'), random()", ["date:date('now')", "hasard:random()"]]
];
const SANS_DETECTION = [
  "SELECT strftime('%Y', date_commande) FROM commandes",
  "SELECT date(date_commande) FROM commandes",
  "SELECT date('2026-06-30', '+1 day')",
  "SELECT julianday('2026-06-30') - julianday(date_commande) FROM commandes",
  "SELECT 'now' AS mot",
  "SELECT * FROM commandes WHERE statut = 'now'",
  "SELECT 'date(''now'')' AS texte",
  "-- date('now')\nSELECT 1",
  "/* random() */ SELECT 1",
  "SELECT date_commande FROM commandes",
  'SELECT "random" FROM t',
  "SELECT current_dates FROM t"
];
DETECTION.forEach(([sql, attendu], i) => proteger(`DT-${String(i + 1).padStart(2, "0")}`, `détecte : ${sql.replace(/\n/g, " ")}`, () =>
  egal(`DT-${String(i + 1).padStart(2, "0")}`, `détecte : ${sql.replace(/\n/g, " ")}`, detecte(sql), attendu)));
SANS_DETECTION.forEach((sql, i) => proteger(`DN-${String(i + 1).padStart(2, "0")}`, `ne détecte rien : ${sql.replace(/\n/g, " ")}`, () =>
  egal(`DN-${String(i + 1).padStart(2, "0")}`, `ne détecte rien : ${sql.replace(/\n/g, " ")}`, detecte(sql), [])));

/* ═══ FORMULATIONS — C1 : plusieurs écritures d'une même requête correcte sont TOUTES acceptées ═══
   Une famille = une référence + des formulations correctes (toutes acceptées) + des formulations fautives (refusées, avec leur code). */
function famille(prefixe, titre, ref, options, acceptees, refusees) {
  acceptees.forEach((sql, i) => {
    const id = `${prefixe}-${String(i + 1).padStart(2, "0")}`, t = `${titre} : acceptée — ${sql.replace(/\s+/g, " ").slice(0, 70)}`;
    proteger(id, t, () => {
      const v = evalSQL(ref, sql, options, BASE);
      resultats.push({ id, titre: t, attendu: "reussi", obtenu: v.reussi ? "reussi" : `${v.statut}/${v.code} : ${v.constat}`, ok: v.reussi });
    });
  });
  refusees.forEach(([sql, code], i) => {
    const id = `${prefixe}-R${i + 1}`, t = `${titre} : refusée (${code}) — ${sql.replace(/\s+/g, " ").slice(0, 60)}`;
    proteger(id, t, () => {
      const v = evalSQL(ref, sql, options, BASE);
      resultats.push({ id, titre: t, attendu: `incorrect/${code}`, obtenu: `${v.statut}/${v.code}`, ok: v.statut === "incorrect" && v.code === code });
    });
  });
}

famille("FM1", "commandes par client (clients sans commande compris)",
  "SELECT c.id, COUNT(o.id) AS nb_commandes FROM clients AS c LEFT JOIN commandes AS o ON o.client_id = c.id GROUP BY c.id", {},
  [
    "SELECT c.id, COUNT(o.id) AS nb FROM clients AS c LEFT JOIN commandes AS o ON o.client_id = c.id GROUP BY c.id",
    "SELECT c.id, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id",
    "SELECT c.id, COUNT(o.statut) AS total FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id",
    "SELECT id, (SELECT COUNT(*) FROM commandes o WHERE o.client_id = c.id) AS total FROM clients c",
    "WITH n AS (SELECT client_id, COUNT(*) AS k FROM commandes GROUP BY client_id) SELECT c.id, COALESCE(n.k, 0) FROM clients c LEFT JOIN n ON n.client_id = c.id",
    "select  c.id ,  count( o.id )  as   NB\nfrom clients as c\nleft  join commandes as o on o.client_id=c.id\ngroup by c.id order by c.id desc",
    "SELECT c.id, COUNT(o.id) FROM commandes o RIGHT JOIN clients c ON o.client_id = c.id GROUP BY c.id",
    "SELECT c.id, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY 1"
  ],
  [
    ["SELECT c.id, COUNT(*) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id", "valeurs"],
    ["SELECT c.id, COUNT(o.id) FROM clients c INNER JOIN commandes o ON o.client_id = c.id GROUP BY c.id", "lignes-manquantes"],
    ["SELECT c.id FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id", "colonne-manquante"]
  ]);

famille("FM2", "produit et nom de sa catégorie",
  "SELECT p.nom, c.nom AS categorie FROM produits AS p JOIN categories AS c ON c.id = p.categorie_id", {},
  [
    "SELECT p.nom, c.nom FROM produits AS p INNER JOIN categories AS c ON c.id = p.categorie_id",
    "SELECT p.nom, c.nom FROM produits p, categories c WHERE p.categorie_id = c.id",
    "SELECT nom, (SELECT nom FROM categories c WHERE c.id = p.categorie_id) FROM produits p",
    "WITH pc AS (SELECT p.nom AS n, c.nom AS k FROM produits p JOIN categories c ON c.id = p.categorie_id) SELECT n, k FROM pc",
    "SELECT p.nom AS produit, c.nom AS rayon FROM produits p JOIN categories c ON c.id = p.categorie_id ORDER BY p.id DESC",
    "SELECT p.nom, c.nom FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id"
  ],
  [
    ["SELECT c.nom, p.nom FROM produits p JOIN categories c ON c.id = p.categorie_id", "colonnes-ordre"],
    ["SELECT p.nom, c.nom FROM categories c LEFT JOIN produits p ON c.id = p.categorie_id", "lignes-en-trop"]
  ]);

famille("FM3", "produits à plus de 100 €, du plus cher au moins cher (ex æquo libres)",
  "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC, id", ORDRE_PRIX,
  [
    "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC",
    "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY 2 DESC",
    "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC, nom",
    "SELECT nom, prix FROM produits WHERE NOT prix <= 100 ORDER BY prix DESC",
    "SELECT nom, prix FROM produits WHERE prix >= 100.25 ORDER BY prix DESC",
    "SELECT p.nom AS produit, p.prix AS euros FROM produits AS p WHERE p.prix > 100.0 ORDER BY p.prix DESC, p.id",
    "SELECT nom, prix FROM (SELECT * FROM produits WHERE prix > 100) ORDER BY prix DESC"
  ],
  [
    ["SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix", "ordre-lignes"],
    ["SELECT nom, prix FROM produits WHERE prix > 100", "ordre-lignes"],
    ["SELECT nom, prix FROM produits WHERE prix > 500 ORDER BY prix DESC", "lignes-manquantes"]   // (> 200 serait ACCEPTÉ : aucun produit entre 100 et 200 €, même résultat)
  ]);

proteger("FM4", "C3 — AVG calculé par deux chemins : accepté ; ROUND contre non arrondi : refusé", () => {
  const a = evalSQL("SELECT AVG(prix) FROM produits", "SELECT SUM(prix) * 1.0 / COUNT(prix) FROM produits", {}, BASE);
  const b = evalSQL("SELECT AVG(prix) FROM produits", "SELECT ROUND(AVG(prix), 2) FROM produits", {}, BASE);
  const c = evalSQL("SELECT AVG(note) FROM commandes", "SELECT SUM(note) * 1.0 / COUNT(note) FROM commandes", {}, BASE);
  egal("FM4", "C3 — AVG calculé par deux chemins : accepté ; ROUND contre non arrondi : refusé", [a.reussi, b.reussi, c.reussi], [true, false, true]);
});

/* ═══ EXERCICES — D035 (predire), structure par entrées ; src/exercices.js et src/contenu.js ═══ */
let Ex = null, erreurEx = null;
try {
  Ex = charger(["comparateur.js", "moteur.js", "contenu.js", "exercices.js"], ["Comparateur", "Moteur", "CONTENU", "CLAUSES", "TYPES_EXERCICE", "Indices", "Attendus", "validerRequete", "lireValeurAnnoncee"]);
  await Ex.Moteur.initialiser();
} catch (e) { erreurEx = e && e.message; }
condition("EX-00", "src/exercices.js et src/contenu.js se chargent sous Node, sans DOM", !erreurEx, "aucune erreur", erreurEx || "aucune erreur");

/* Fixtures locales, un exercice par type (D038/D051) : ces tests exercent le MOTEUR (comparateur, types
   d'exercice, indices), jamais le contenu pédagogique — qui change de lot en lot (lot 6 : chapitre 0 et
   palier 1) et ne doit jamais faire casser les tests du moteur. Ce sont les quatre exercices `demo: true`
   du lot 3, retirés de src/contenu.js au lot 6 : conservés ici, à l'identique, pour que ces tests restent
   indépendants de ce que src/contenu.js contient à un instant donné. */
const FIXTURE_QCM = {
  id: "demo-qcm", type: "qcm",
  niveau: "P2", competence: "agreger", categorie: "Comprendre", difficulte: 1,
  titre: "COUNT(*) ou COUNT(ville) ?",
  question: "Dans la table clients, certains clients n'ont pas de ville renseignée (la valeur est NULL). Que donne SELECT COUNT(ville) FROM clients, comparé à SELECT COUNT(*) FROM clients ?",
  options: [
    "Un nombre plus petit : COUNT(ville) ne compte que les villes renseignées",
    "Le même nombre : COUNT compte toujours toutes les lignes",
    "Une erreur : COUNT n'accepte pas de nom de colonne",
    "NULL, parce qu'au moins une ville manque"
  ],
  reponse: 0,
  piste: "COUNT(*) compte des lignes ; COUNT(ville) compte des valeurs. Une ville vide est-elle une valeur ?",
  clause: "COUNT",
  exemple: "SELECT COUNT(*), COUNT(note) FROM commandes; renvoie 70 puis 32, parce que 38 commandes n'ont pas de note.",
  explication: "COUNT(*) compte toutes les lignes ; COUNT(ville) saute celles où la ville est NULL. Ici : 40 clients, mais 36 villes renseignées.",
  retenir: "COUNT(*) compte les lignes ; COUNT(colonne) ignore les NULL."
};
const FIXTURE_REQUETE = {
  id: "demo-requete", type: "requete",
  niveau: "P3", competence: "joindre", categorie: "Mise en pratique", difficulte: 2,
  titre: "Les commandes de chaque client",
  question: "Pour chaque client, affiche son identifiant et son nombre de commandes. Les clients qui n'ont jamais commandé doivent apparaître, avec 0.",
  consigne: "Deux colonnes, dans cet ordre : l'identifiant du client, puis le nombre de commandes.",
  solution: "SELECT c.id, COUNT(o.id) AS nb_commandes\nFROM clients AS c\nLEFT JOIN commandes AS o ON o.client_id = c.id\nGROUP BY c.id",
  comparer: {},
  piste: "Une jointure ordinaire écarte les clients qui n'ont aucune commande. Laquelle les garde ?",
  clause: "LEFT JOIN",
  exemple: "SELECT p.nom, c.nom FROM produits AS p LEFT JOIN categories AS c ON c.id = p.categorie_id;",
  explication: "LEFT JOIN garde tous les clients, même ceux sans commande : leurs colonnes de commandes valent alors NULL. COUNT(o.id) ne compte que les identifiants de commande renseignés : un client sans commande obtient 0. Le nom de la colonne du résultat n'a pas d'importance, ni l'ordre des lignes.",
  retenir: "Après un LEFT JOIN, COUNT(colonne) ne compte pas les lignes sans correspondance, COUNT(*) les compte."
};
const FIXTURE_CORRIGER = {
  id: "demo-corriger", type: "corriger",
  niveau: "P1", competence: "lire-filtrer", categorie: "Détection d'erreur", difficulte: 1,
  titre: "Du plus cher au moins cher",
  question: "Cette requête devrait afficher les produits à plus de 100 €, du plus cher au moins cher. Elle ne le fait pas : répare-la.",
  consigne: "Deux colonnes, dans cet ordre : le nom, puis le prix.",
  depart: "SELECT nom, prix\nFROM produits\nWHERE prix > 100\nORDER BY prix",
  solution: "SELECT nom, prix\nFROM produits\nWHERE prix > 100\nORDER BY prix DESC, id",
  comparer: { ordonne: { cles: [1] } },
  piste: "Exécute la requête : les bonnes lignes sortent-elles dans le bon sens ?",
  clause: "ORDER BY",
  exemple: "SELECT nom FROM clients ORDER BY nom DESC;",
  explication: "ORDER BY trie par défaut du plus petit au plus grand ; DESC inverse le tri. Deux produits ont le même prix (1 299 € pour deux d'entre eux, 449 € pour deux autres) : la consigne ne demande pas de les départager, leur ordre relatif n'a donc pas d'importance.",
  retenir: "ORDER BY colonne trie du plus petit au plus grand ; ajoute DESC pour l'inverse."
};
const FIXTURE_PREDIRE = {
  id: "demo-predire", type: "predire",
  niveau: "P3", competence: "joindre", categorie: "Comprendre", difficulte: 2,
  titre: "Combien de lignes ?",
  question: "Sans l'exécuter : combien de lignes cette requête renvoie-t-elle ?",
  requete: "SELECT c.id, o.id AS commande\nFROM clients AS c\nLEFT JOIN commandes AS o ON o.client_id = c.id",
  predit: "nbLignes",
  piste: "Chaque commande donne une ligne. Un client qui n'a aucune commande disparaît-il, avec un LEFT JOIN ?",
  clause: "LEFT JOIN",
  exemple: "Avec 3 articles dont un jamais commandé, articles LEFT JOIN commandes renvoie une ligne par commande, plus une ligne (avec NULL) pour l'article jamais commandé.",
  explication: "Les 70 commandes donnent chacune une ligne ; le LEFT JOIN ajoute une ligne, avec NULL, pour chacun des 6 clients sans commande : 76 lignes. Un JOIN ordinaire n'en aurait renvoyé que 70.",
  retenir: "LEFT JOIN renvoie au moins une ligne par ligne de la table de gauche."
};
const FIXTURES = [FIXTURE_QCM, FIXTURE_REQUETE, FIXTURE_CORRIGER, FIXTURE_PREDIRE];
const demos = () => FIXTURES;
proteger("EX-01", "quatre exercices de démonstration, un par type, identifiants uniques", () => {
  const d = demos();
  egal("EX-01", "quatre exercices de démonstration, un par type, identifiants uniques",
    [d.map(e => e.type).sort(), new Set(d.map(e => e.id)).size, d.every(e => e.id.startsWith("demo-"))],
    [["corriger", "predire", "qcm", "requete"], 4, true]);
});
proteger("EX-02", "chaque exercice porte titre, question, explication et « à retenir »", () => {
  const manque = demos().filter(e => !(e.titre && e.question && e.explication && e.retenir)).map(e => e.id);
  egal("EX-02", "chaque exercice porte titre, question, explication et « à retenir »", manque, []);
});
proteger("EX-03", "chaque type de TYPES_EXERCICE sait se rendre et se valider (une entrée par type)", () => {
  const types = Object.keys(Ex.TYPES_EXERCICE).sort();
  const incomplets = types.filter(t => typeof Ex.TYPES_EXERCICE[t].rendre !== "function" || typeof Ex.TYPES_EXERCICE[t].valider !== "function");
  egal("EX-03", "chaque type de TYPES_EXERCICE sait se rendre et se valider (une entrée par type)", [types, incomplets], [["corriger", "predire", "qcm", "requete"], []]);
});

const sqlDe = e => [e.solution, e.depart, e.requete].filter(Boolean);
proteger("EX-04", "D001 — aucune requête d'exercice (solution, départ, énoncé) ne dépend de la date du jour ni du hasard", () => {
  const fautifs = demos().filter(e => sqlDe(e).some(s => Ex.Comparateur.construitsTemporels(s).length)).map(e => e.id);
  egal("EX-04", "D001 — aucune requête d'exercice (solution, départ, énoncé) ne dépend de la date du jour ni du hasard", fautifs, []);
});
proteger("EX-05", "D001 — chaque solution s'exécute sans erreur, renvoie ≥ 1 ligne, et donne le même résultat deux fois", () => {
  const problemes = [];
  for (const e of demos().filter(x => x.type === "requete" || x.type === "corriger")) {
    const a = Ex.Moteur.executerIsole(e.solution, { plafond: false }), b = Ex.Moteur.executerIsole(e.solution, { plafond: false });
    if (a.erreur) problemes.push(`${e.id} : ${a.erreur}`);
    else if (!a.jeux.length || !a.jeux[a.jeux.length - 1].lignes.length) problemes.push(`${e.id} : résultat vide`);
    else if (json(a.jeux) !== json(b.jeux)) problemes.push(`${e.id} : résultat instable`);
    if (e.type === "corriger" && Ex.Moteur.executerIsole(e.depart).erreur) problemes.push(`${e.id} : la requête de départ plante`);
  }
  egal("EX-05", "D001 — chaque solution s'exécute sans erreur, renvoie ≥ 1 ligne, et donne le même résultat deux fois", problemes, []);
});
proteger("EX-06", "C11 — la solution de chaque exercice SQL est acceptée par le comparateur", () => {
  const refusees = demos().filter(e => e.type === "requete" || e.type === "corriger").filter(e => !Ex.TYPES_EXERCICE[e.type].valider(e, e.solution).reussi).map(e => e.id);
  egal("EX-06", "C11 — la solution de chaque exercice SQL est acceptée par le comparateur", refusees, []);
});
proteger("EX-07", "C11 — corriger : la requête de départ est REFUSÉE (sinon l'exercice est déjà résolu)", () => {
  const ex = demos().find(e => e.type === "corriger");
  const v = Ex.TYPES_EXERCICE.corriger.valider(ex, ex.depart);
  egal("EX-07", "C11 — corriger : la requête de départ est REFUSÉE (sinon l'exercice est déjà résolu)", [v.statut, v.code], ["incorrect", "ordre-lignes"]);
});
proteger("EX-08", "corriger : la réparation attendue (ajouter DESC) est acceptée, un départage différent aussi", () => {
  const ex = demos().find(e => e.type === "corriger");
  const a = Ex.TYPES_EXERCICE.corriger.valider(ex, "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC");
  const b = Ex.TYPES_EXERCICE.corriger.valider(ex, "SELECT nom, prix FROM produits WHERE prix > 100 ORDER BY prix DESC, nom");
  egal("EX-08", "corriger : la réparation attendue (ajouter DESC) est acceptée, un départage différent aussi", [a.reussi, b.reussi], [true, true]);
});
proteger("EX-09", "requete : les formulations alternatives de l'exercice « commandes par client » sont acceptées", () => {
  const ex = demos().find(e => e.type === "requete");
  const formulations = [
    "SELECT c.id, COUNT(o.id) FROM clients c LEFT JOIN commandes o ON o.client_id = c.id GROUP BY c.id",
    "SELECT id, (SELECT COUNT(*) FROM commandes o WHERE o.client_id = c.id) AS total FROM clients c",
    "WITH n AS (SELECT client_id, COUNT(*) AS k FROM commandes GROUP BY client_id) SELECT c.id, COALESCE(n.k, 0) FROM clients c LEFT JOIN n ON n.client_id = c.id"
  ];
  egal("EX-09", "requete : les formulations alternatives de l'exercice « commandes par client » sont acceptées", formulations.map(f => Ex.TYPES_EXERCICE.requete.valider(ex, f).reussi), [true, true, true]);
});

/* predire (D035) : la bonne réponse est CALCULÉE en exécutant la requête, jamais saisie */
const predire = () => demos().find(e => e.type === "predire");
proteger("PR-01", "predire nbLignes : la réponse calculée (76) est acceptée, avec ou sans « lignes »", () => {
  const ex = predire();
  egal("PR-01", "predire nbLignes : la réponse calculée (76) est acceptée, avec ou sans « lignes »",
    ["76", " 76 ", "76 lignes", "76 lignes"].map(s => Ex.TYPES_EXERCICE.predire.valider(ex, s).reussi), [true, true, true, true]);
});
proteger("PR-02", "predire : une mauvaise réponse est dite avec les deux nombres, et compte comme une tentative", () => {
  const v = Ex.TYPES_EXERCICE.predire.valider(predire(), "70");
  egal("PR-02", "predire : une mauvaise réponse est dite avec les deux nombres, et compte comme une tentative",
    [v.statut, v.compte, /70/.test(v.constat), /76/.test(v.constat)], ["incorrect", true, true, true]);
});
proteger("PR-03", "predire : une saisie illisible est non évaluée (ne compte pas) et demande un nombre entier", () => {
  const ex = predire();
  const v = Ex.TYPES_EXERCICE.predire.valider(ex, "beaucoup");
  const w = Ex.TYPES_EXERCICE.predire.valider(ex, "");
  const x = Ex.TYPES_EXERCICE.predire.valider(ex, "75,5");
  egal("PR-03", "predire : une saisie illisible est non évaluée (ne compte pas) et demande un nombre entier",
    [v.statut, v.code, v.compte, w.code, x.code, /nombre entier/.test(v.constat)], ["non-evalue", "saisie-invalide", false, "saisie-invalide", "saisie-invalide", true]);
});
proteger("PR-04", "predire : le vrai résultat est rendu dans le verdict, pour être montré après la réponse", () => {
  const v = Ex.TYPES_EXERCICE.predire.valider(predire(), "70");
  egal("PR-04", "predire : le vrai résultat est rendu dans le verdict, pour être montré après la réponse", [v.resultat.lignes.length, v.resultat.colonnes], [76, ["id", "commande"]]);
});
proteger("PR-05", "predire valeur : un nombre (point ou virgule), NULL en toutes lettres, un texte", () => {
  const T = Ex.TYPES_EXERCICE.predire;
  const ville = { id: "t-ville", type: "predire", requete: "SELECT COUNT(ville) FROM clients", predit: "valeur" };
  const prix = { id: "t-prix", type: "predire", requete: "SELECT MIN(prix) FROM produits", predit: "valeur" };
  const nul = { id: "t-nul", type: "predire", requete: "SELECT note FROM commandes WHERE id = 1005", predit: "valeur" };
  const texte = { id: "t-texte", type: "predire", requete: "SELECT nom FROM categories WHERE id = 7", predit: "valeur" };
  egal("PR-05", "predire valeur : un nombre (point ou virgule), NULL en toutes lettres, un texte", [
    T.valider(ville, "36").reussi, T.valider(ville, "40").reussi,
    T.valider(prix, "3,5").reussi, T.valider(prix, "3.5").reussi, T.valider(prix, "3,50").reussi,
    T.valider(nul, "NULL").reussi, T.valider(nul, "null").reussi, T.valider(nul, "0").reussi, T.valider(nul, "").code,
    T.valider(texte, "Jardin").reussi, T.valider(texte, "jardin").reussi
  ], [true, false, true, true, true, true, true, false, "saisie-invalide", true, false]);
});
proteger("PR-06", "predire valeur : la requête doit renvoyer UNE cellule (erreur d'auteur sinon)", () => {
  let message = null;
  try { Ex.TYPES_EXERCICE.predire.valider({ id: "t-mal", type: "predire", requete: "SELECT id, nom FROM categories", predit: "valeur" }, "1"); } catch (e) { message = e.message; }
  condition("PR-06", "predire valeur : la requête doit renvoyer UNE cellule (erreur d'auteur sinon)", message && /une seule cellule/.test(message), "exception « une seule cellule »", message || "aucune exception");
});

/* qcm : repris de Classe'R (mélange déterministe, contrôle de distribution) */
const qcm = () => demos().find(e => e.type === "qcm");
proteger("QC-01", "qcm : ordreAffichage est une permutation, identique d'un appel à l'autre", () => {
  const ex = qcm();
  const a = Ex.TYPES_EXERCICE.qcm.ordreAffichage(ex), b = Ex.TYPES_EXERCICE.qcm.ordreAffichage(ex);
  egal("QC-01", "qcm : ordreAffichage est une permutation, identique d'un appel à l'autre", [json(a) === json(b), [...a].sort().join(), a.length], [true, ex.options.map((_, i) => i).join(), ex.options.length]);
});
proteger("QC-02", "qcm : l'ordre diffère d'un exercice à l'autre (dérivé de l'identifiant)", () => {
  const ordres = new Set(["q1", "q2", "q3", "q4", "q5", "q6"].map(id => Ex.TYPES_EXERCICE.qcm.ordreAffichage({ id, options: ["a", "b", "c", "d"] }).join()));
  condition("QC-02", "qcm : l'ordre diffère d'un exercice à l'autre (dérivé de l'identifiant)", ordres.size >= 3, "≥ 3 ordres différents sur 6 identifiants", ordres.size);
});
proteger("QC-03", "qcm : la bonne réponse est acceptée, une autre refusée avec la bonne réponse dite", () => {
  const ex = qcm();
  const bon = Ex.TYPES_EXERCICE.qcm.valider(ex, ex.reponse), mauvais = Ex.TYPES_EXERCICE.qcm.valider(ex, (ex.reponse + 1) % ex.options.length);
  egal("QC-03", "qcm : la bonne réponse est acceptée, une autre refusée avec la bonne réponse dite",
    [bon.reussi, bon.compte, mauvais.reussi, mauvais.compte, mauvais.constat.includes(ex.options[ex.reponse])], [true, true, false, true, true]);
});
/* Les contrôles de l'Autotest (lot 5) qu'on peut déjà poser : options sans doublon, réponse dans les options, distribution des positions. */
const controlerQcm = ex => {
  const echecs = [];
  if (!Array.isArray(ex.options) || !(ex.reponse >= 0 && ex.reponse < ex.options.length)) echecs.push("réponse hors des options");
  else if (new Set(ex.options.map(o => String(o).trim().toLowerCase())).size !== ex.options.length) echecs.push("deux options identiques");
  return echecs;
};
proteger("QC-04", "contrôle des options : doublon et réponse hors des options sont détectés, le QCM de démonstration passe", () => {
  egal("QC-04", "contrôle des options : doublon et réponse hors des options sont détectés, le QCM de démonstration passe",
    [controlerQcm(qcm()), controlerQcm({ options: ["a", " A ", "b"], reponse: 0 }), controlerQcm({ options: ["a", "b"], reponse: 2 })],
    [[], ["deux options identiques"], ["réponse hors des options"]]);
});
/* ── Q5 : mélange (FNV-1a) et contrôle de distribution BILATÉRAL ─────────────────────────────────
   Le contrôle voit la sur-représentation (plafond 45 %, dès 10 QCM) ET la sous-représentation (plancher, dès 20 QCM). Le plancher
   dépend de la taille de l'échantillon, plafonné à 15 % : un plancher fixe à 15 % se déclencherait sur 16 à 38 % des lots parfaitement
   aléatoires de 30 à 40 QCM (mesuré sur un tirage uniforme parfait). */
const QCM = () => Ex.TYPES_EXERCICE.qcm;
const positionsDe = (ids, k = 4) => ids.map(id => { const ex = { id, options: Array.from({ length: k }, (_, i) => (i ? `faux ${i}` : "bonne")), reponse: 0 }; return QCM().ordreAffichage(ex).indexOf(0); });
const sequence = (prefixe, n, pad = 2) => Array.from({ length: n }, (_, i) => prefixe + String(i + 1).padStart(pad, "0"));
const comptes = (positions, k = 4) => { const c = Array(k).fill(0); positions.forEach(p => c[p]++); return c; };
/** L'ancien mélange de Classe'R (hachage de somme de caractères, congruentiel) : TÉMOIN, uniquement pour montrer ce que le nouveau contrôle voit. */
const melangeAncien = (id, n) => { let g = 0; for (const c of String(id)) g = (g * 31 + c.charCodeAt(0)) % 100000;
  const s = () => (g = (g * 1103515245 + 12345) % 2147483648) / 2147483648;
  const o = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(s() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };

proteger("QC-05", "contrôle bilatéral : plafond (sur-représentation) ET plancher (sous-représentation), chacun avec sa raison", () => {
  const C = QCM().controleDistribution;
  const equilibre = C(Array.from({ length: 40 }, (_, i) => i % 4)), trop = C([...Array(20).fill(0), ...Array.from({ length: 20 }, (_, i) => 1 + (i % 3))]);
  const sous = C([...Array.from({ length: 37 }, (_, i) => i % 3), 3, 3, 3]);          // D ne porte que 3 bonnes réponses sur 40 (7,5 %)
  egal("QC-05", "contrôle bilatéral : plafond (sur-représentation) ET plancher (sous-représentation), chacun avec sa raison", [
    equilibre.ok, trop.ok, /trop souvent/.test(trop.raison), /position A/.test(trop.raison),
    sous.ok, /rarement/.test(sous.raison), /position D/.test(sous.raison), sous.comptes
  ], [true, false, true, true, false, true, true, [13, 12, 12, 3]]);
});
proteger("QC-06", "le plancher dépend de la taille de l'échantillon, plafonné à 15 % ; il n'existe pas avant 20 QCM, le plafond dès 10", () => {
  const C = QCM().controleDistribution;
  const seuil = n => Math.round(C(Array.from({ length: n }, (_, i) => i % 4)).plancher * 1000) / 10;
  const peuAvant = C([0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3]);        // 19 QCM, A à 8/19 : sous 45 %, pas de plancher encore
  egal("QC-06", "le plancher dépend de la taille de l'échantillon, plafonné à 15 % ; il n'existe pas avant 20 QCM, le plafond dès 10",
    [seuil(20), seuil(40), seuil(100), seuil(400), peuAvant.plancher, C([0, 0, 0, 0, 0, 0, 1, 2, 3, 1]).ok, C([0, 0, 0]).ok, C(Array(9).fill(0)).ok],
    [0.8, 7.9, 14.2, 15, null, false, true, true]);
});
proteger("QC-07", "le contrôle s'adapte au nombre d'options (3 et 5) : plancher et plafond suivent 1/k", () => {
  const C = QCM().controleDistribution;
  const b3 = C(Array.from({ length: 45 }, (_, i) => i % 3), 3), b5 = C(Array.from({ length: 50 }, (_, i) => i % 5), 5);
  const sous5 = C([...Array.from({ length: 48 }, (_, i) => i % 4), 4, 4], 5);          // E ne porte que 2 bonnes réponses sur 50 (4 % < plancher 5,9 %)
  const normal5 = C([...Array.from({ length: 46 }, (_, i) => i % 4), 4, 4, 4, 4], 5);  // 4 sur 50 (8 %) : un écart de hasard ordinaire, pas une alerte
  egal("QC-07", "le contrôle s'adapte au nombre d'options (3 et 5) : plancher et plafond suivent 1/k", [b3.ok, b5.ok, b3.comptes, sous5.ok, /position E/.test(sous5.raison), normal5.ok, b5.plancher < b3.plancher], [true, true, [15, 15, 15], false, true, true, true]);
});
proteger("QC-08", "FNV-1a : la graine d'un identifiant est le FNV-1a 32 bits de ses octets UTF-8 (vecteurs de référence)", () => {
  const g = QCM().graine;
  egal("QC-08", "FNV-1a : la graine d'un identifiant est le FNV-1a 32 bits de ses octets UTF-8 (vecteurs de référence)",
    [g(""), g("a"), g("foobar"), g("qcm-01") !== g("qcm-02"), g("é")], [0x811c9dc5, 0xe40c292c, 0xbf9cf968, true, g("é")]);
});
proteger("QC-09", "ordreAffichage : permutation pour 2 à 6 options, reproductible, dépendante de l'identifiant seul", () => {
  const permutations = [2, 3, 4, 5, 6].every(k => ["qcm-01", "qcm-02", "x", ""].every(id => [...QCM().ordreAffichage({ id, options: Array(k).fill("o") })].sort((a, b) => a - b).join() === Array.from({ length: k }, (_, i) => i).join()));
  const stable = JSON.stringify(QCM().ordreAffichage({ id: "qcm-07", options: ["a", "b", "c", "d"] })) === JSON.stringify(QCM().ordreAffichage({ id: "qcm-07", options: ["w", "x", "y", "z"] }));
  const vaut = QCM().ordreAffichage({ id: "qcm-07", options: ["a", "b", "c", "d"] });
  egal("QC-09", "ordreAffichage : permutation pour 2 à 6 options, reproductible, dépendante de l'identifiant seul", [permutations, stable, vaut.length], [true, true, 4]);
});
proteger("QC-10", "qcm-01 à qcm-40 : la distribution tient des DEUX côtés (aucune position sous 15 %, aucune au-dessus de 45 %)", () => {
  const c = comptes(positionsDe(sequence("qcm-", 40)));
  const r = QCM().controleDistribution(positionsDe(sequence("qcm-", 40)));
  condition("QC-10", "qcm-01 à qcm-40 : la distribution tient des DEUX côtés (aucune position sous 15 %, aucune au-dessus de 45 %)",
    r.ok && Math.min(...c) / 40 >= 0.15 && Math.max(...c) / 40 <= 0.45, "comptes dans [6 ; 18] sur 40", c);
});
/* Familles d'identifiants séquentiels réalistes, déterministes : 30 préfixes × 2 largeurs de numéro × 40 identifiants. */
const FAMILLES = (() => {
  const mots = ["qcm", "ex", "select", "where", "jointure", "agreger", "null", "case", "cte", "fenetre", "mission", "clause", "p1-qcm", "p2-qcm", "p3-qcm", "p4-qcm", "p5-qcm", "union", "having", "dates", "texte", "tri", "limit", "distinct", "alias", "left", "inner", "exists", "rang", "cumul"];
  return mots.flatMap(m => [2, 3].map(pad => sequence(m + "-", 40, pad)));
})();
proteger("QC-11", "sur 60 familles d'identifiants séquentiels : uniforme au cumul (χ² sous le seuil à 1 %) et peu d'alertes du contrôle (≈ hasard pur)", () => {
  const total = Array(4).fill(0); let alertes = 0;
  for (const ids of FAMILLES) { const p = positionsDe(ids); comptes(p).forEach((v, i) => { total[i] += v; }); if (!QCM().controleDistribution(p).ok) alertes++; }
  const attendu = FAMILLES.length * 40 / 4, khi2 = total.reduce((s, v) => s + (v - attendu) ** 2 / attendu, 0);
  condition("QC-11", "sur 60 familles d'identifiants séquentiels : uniforme au cumul (χ² sous le seuil à 1 %) et peu d'alertes du contrôle (≈ hasard pur)",
    khi2 < 11.34 && alertes / FAMILLES.length <= 0.1, "χ² < 11,34 (3 ddl) et ≤ 10 % de familles en alerte (hasard pur ≈ 3 %)", { khi2: Math.round(khi2 * 10) / 10, cumul: total, alertes: `${alertes}/${FAMILLES.length}` });
});
proteger("QC-12", "le nouveau contrôle VOIT ce que l'ancien mélange produisait : ex-001…ex-040 (8, 15, 14, 3) est refusé, et l'ancien alerte bien plus souvent que le nouveau", () => {
  const ancienEx = comptes(sequence("ex-", 40, 3).map(id => melangeAncien(id, 4).indexOf(0)));
  const alertesAncien = FAMILLES.filter(ids => !QCM().controleDistribution(ids.map(id => melangeAncien(id, 4).indexOf(0))).ok).length;
  const alertesNouveau = FAMILLES.filter(ids => !QCM().controleDistribution(positionsDe(ids)).ok).length;
  condition("QC-12", "le nouveau contrôle VOIT ce que l'ancien mélange produisait : ex-001…ex-040 (8, 15, 14, 3) est refusé, et l'ancien alerte bien plus souvent que le nouveau",
    json(ancienEx) === "[8,15,14,3]" && !QCM().controleDistribution([...Array(8).fill(0), ...Array(15).fill(1), ...Array(14).fill(2), ...Array(3).fill(3)]).ok && alertesAncien >= 2 * alertesNouveau && alertesAncien >= 5,
    "témoin [8,15,14,3] refusé ; alertes ancien ≥ 2 × nouveau", { ancienEx, alertesAncien, alertesNouveau });
});

/* Indices : Piste → Clause → Exemple → Solution (verrouillée) */
proteger("IN-01", "C12 — Indices.pour : Piste, Clause (tirée de CLAUSES), Exemple, puis la solution révélée en dernier", () => {
  const ex = demos().find(e => e.type === "requete");
  const liste = Ex.Indices.pour(ex);
  egal("IN-01", "C12 — Indices.pour : Piste, Clause (tirée de CLAUSES), Exemple, puis la solution révélée en dernier",
    [liste.map(i => i.titre), liste.map(i => !!i.revele), liste[1].texte.includes(Ex.CLAUSES[ex.clause].syntaxe), liste[liste.length - 1].texte === ex.solution],
    [["Piste", "Clause", "Exemple", "Une solution possible"], [false, false, false, true], true, true]);
});
proteger("IN-02", "Indices.pour : un exercice sans clause connue n'invente pas de niveau « Clause »", () => {
  const liste = Ex.Indices.pour({ type: "requete", piste: "p", clause: "INCONNUE", solution: "SELECT 1" });
  egal("IN-02", "Indices.pour : un exercice sans clause connue n'invente pas de niveau « Clause »", liste.map(i => i.titre), ["Piste", "Une solution possible"]);
});
proteger("IN-03", "Indices.pour : chaque exercice de démonstration SQL ou qcm finit par une solution révélée ; predire n'en révèle aucune", () => {
  const sansFin = demos().filter(e => e.type !== "predire").filter(e => { const l = Ex.Indices.pour(e); return !(l.length >= 2 && l[l.length - 1].revele); }).map(e => e.id);
  const predireRevele = Ex.Indices.pour(predire()).some(i => i.revele);
  egal("IN-03", "Indices.pour : chaque exercice de démonstration SQL ou qcm finit par une solution révélée ; predire n'en révèle aucune", [sansFin, predireRevele], [[], false]);
});
proteger("IN-04", "toutes les clauses citées par les exercices existent dans CLAUSES", () => {
  // Pas de plafond sur la taille de CLAUSES (D051) : le ≤ 6 d'origine n'était qu'une borne de démonstration du lot 3 ;
  // le lexique complet du lot 6+ la dépassera forcément, et un lexique n'a pas de taille maximale.
  const inconnues = demos().filter(e => e.clause && !Ex.CLAUSES[e.clause]).map(e => e.id);
  egal("IN-04", "toutes les clauses citées par les exercices existent dans CLAUSES", inconnues, []);
});

/* Pureté (C9) : le comparateur n'utilise ni date, ni hasard, ni DOM, ni horloge */
const sansCommentaires = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
for (const fichier of ["comparateur.js"]) {
  proteger("PU-01", `C9 — ${fichier} est pur : ni Date, ni Math.random, ni DOM, ni horloge, ni stockage`, () => {
    const trouves = sansCommentaires(source(fichier)).match(/\b(Date|Math\.random|document|window|performance|localStorage|sessionStorage|setTimeout|fetch)\b/g) || [];
    egal("PU-01", `C9 — ${fichier} est pur : ni Date, ni Math.random, ni DOM, ni horloge, ni stockage`, trouves, []);
  });
}
proteger("PU-02", "les `valider` d'exercices (et leurs aides) n'appellent aucune fonction du DOM", () => {
  const fonctions = [
    ...Object.entries(Ex.TYPES_EXERCICE).map(([t, d]) => [`${t}.valider`, d.valider]),
    ["validerRequete", Ex.validerRequete], ["lireValeurAnnoncee", Ex.lireValeurAnnoncee], ["Attendus.de", Ex.Attendus.de], ["Attendus.predire", Ex.Attendus.predire]
  ];
  const fautives = fonctions.filter(([, f]) => /\b(el|Toast|tableResultat|editeurSQL|blocsExecution)\s*\(|\b(document|window)\b/.test(sansCommentaires(String(f)))).map(([n]) => n);
  egal("PU-02", "les `valider` d'exercices (et leurs aides) n'appellent aucune fonction du DOM", [fonctions.length, fautives], [4 + 4, []]);
});

/* ── Rapport ────────────────────────────────────────────────── */
const L = { id: 9, titre: 78 };
const coupe = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
console.log(`\nVérification du comparateur : ${resultats.length} critères\n`);
for (const r of resultats) {
  console.log(`${r.ok ? "✔" : "✘"} ${r.id.padEnd(L.id)} ${coupe(r.titre, L.titre).padEnd(L.titre)}${r.ok ? "" : `\n    attendu : ${r.attendu}\n    obtenu  : ${r.obtenu}`}`);
}
if (process.argv.includes("--messages")) {
  console.log("\nMessages tels que l'apprenant les lit (code ; * = attendu 1×1 masqué) :");
  for (const m of messages) {
    console.log(`\n  ${m.id} — ${m.code}${m.masque ? " *" : ""}\n    ${m.constat || "(réussite)"}`);
    for (const p of m.pistes) console.log(`    › ${p}`);
  }
}
const ko = resultats.filter(r => !r.ok);
console.log(`\n${ko.length ? `✘ ${ko.length} critère(s) en échec sur ${resultats.length}` : `✔ ${resultats.length} critères satisfaits`}\n`);
process.exit(ko.length ? 1 : 0);
