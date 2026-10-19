#!/usr/bin/env node
/* Requêt'R — vérificateur du Store, de Progression, de Session et de Mission (lot 4). Hors livrable.
   Usage : node verifier-progression.mjs
   Charge les VRAIS fichiers de src/ dans Node, sans navigateur (même principe que verifier-comparateur.mjs,
   D038) : contenu.js, moteur.js, comparateur.js, exercices.js, app.js, store.js, progression.js, routeur.js.
   `localStorage` n'existe pas sous Node : un petit magasin en mémoire le remplace, avant de charger store.js.
   Sortie : un tableau « critère / attendu / obtenu » ; code retour 1 au moindre écart. */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = f => readFileSync(join(RACINE, "src", f), "utf8").replace(/\r\n/g, "\n");

function charger(fichiers, exports) {
  return (0, eval)(fichiers.map(source).join("\n") + `\n;({ ${exports.join(", ")} })`);
}

/* Globaux que le navigateur fournit avant les scripts de src/. */
globalThis.initSqlJs = require("./vendor/sql-wasm.js");
globalThis.WASM_B64 = readFileSync(join(RACINE, "vendor", "sql-wasm.wasm")).toString("base64");
globalThis.SEED_SQL = source("seed.sql");
globalThis.SEED_SALE_SQL = source("seed-sale.sql");   // second jeu de donnees (D027) : moteur.js ne le lit que si on le demande

/* `localStorage` : magasin en mémoire, assez fidèle pour Store (getItem/setItem/removeItem). */
function creerLocalStorage() {
  const magasin = new Map();
  return {
    getItem: k => (magasin.has(k) ? magasin.get(k) : null),
    setItem: (k, v) => { magasin.set(k, String(v)); },
    removeItem: k => { magasin.delete(k); },
    _magasin: magasin
  };
}
globalThis.localStorage = creerLocalStorage();

/* DOM minimal : un faux élément qui accepte tout ce que `el()` (app.js) lui fait (className, setAttribute,
   append, replaceChildren, dataset…) sans rien vérifier — Store/Progression/Session/Mission n'ont pas besoin
   d'un vrai rendu, seulement de ne pas planter quand ils en construisent un (ligneProgres, carteRetour…). */
function elementFactice(tag) {
  const enfants = [];
  const noeud = {
    tagName: tag, className: "", dataset: {}, style: {}, disabled: false, hidden: false,
    attributs: new Map(),
    setAttribute(k, v) { noeud.attributs.set(k, v); },
    getAttribute(k) { return noeud.attributs.has(k) ? noeud.attributs.get(k) : null; },
    removeAttribute(k) { noeud.attributs.delete(k); },
    hasAttribute(k) { return noeud.attributs.has(k); },
    addEventListener() {}, removeEventListener() {},
    append(...items) { enfants.push(...items); },
    appendChild(item) { enfants.push(item); return item; },
    replaceChildren(...items) { enfants.length = 0; enfants.push(...items); },
    get children() { return enfants; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    remove() {}, focus() {}, click() {}, scrollIntoView() {},
    set innerHTML(_v) {}, get innerHTML() { return ""; },
    set textContent(_v) {}, get textContent() { return ""; },
    get offsetParent() { return null; },
    classList: { add() {}, remove() {}, toggle() {} }
  };
  return noeud;
}
globalThis.Node = function Node() {};
globalThis.document = {
  createElement: elementFactice,
  createElementNS: (_ns, tag) => elementFactice(tag),
  createTextNode: texte => ({ nodeType: 3, textContent: String(texte) }),
  addEventListener() {}, removeEventListener() {},
  getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; },
  body: elementFactice("body")
};
globalThis.window = { addEventListener() {}, scrollTo() {} };
globalThis.location = { hash: "" };
globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });

/* UN SEUL chargement : tout (CONTENU, Moteur, Comparateur, TYPES_EXERCICE, Store, Progression, Session,
   Mission, Parcours, Contenu, Packs…) doit venir de la MÊME évaluation indirecte, sinon Session/Mission
   référenceraient un Store distinct de celui que ce script manipule (deux `const Store` de deux eval()
   différents ne sont PAS le même objet, même après une affectation sur globalThis). */
const FICHIERS = ["contenu.js", "moteur.js", "comparateur.js", "exercices.js", "app.js", "store.js", "progression.js", "routeur.js"];
const {
  CONTENU, PALIERS, CLAUSES, CHAPITRES, CONFIG, Bus, Toast,
  Moteur, nouvelleBase, Comparateur, TYPES_EXERCICE, Indices, Attendus,
  Store, Progression, PROGRESSION_CONFIG, Session, Mission, Parcours, Contenu, Packs
} = charger(FICHIERS, [
  "CONTENU", "PALIERS", "CLAUSES", "CHAPITRES", "CONFIG", "Bus", "Toast",
  "Moteur", "nouvelleBase", "Comparateur", "TYPES_EXERCICE", "Indices", "Attendus",
  "Store", "Progression", "PROGRESSION_CONFIG", "Session", "Mission", "Parcours", "Contenu", "Packs"
]);
await Moteur.initialiser();

/* ── Outils ─────────────────────────────────────────────────── */
const resultats = [];
function condition(id, titre, ok, attendu, obtenu) {
  resultats.push({ id, titre, attendu, obtenu: typeof obtenu === "string" ? obtenu : JSON.stringify(obtenu), ok: !!ok });
}
function proteger(id, titre, fn) {
  try { fn(); } catch (e) { resultats.push({ id, titre, attendu: "pas d'exception", obtenu: `exception : ${e && e.stack}`, ok: false }); }
}
const approx = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

/* Repart d'un Store neuf avant chaque groupe de critères : jamais le même état d'un cas à l'autre. */
function neuf() { Store.reinitialiser(); }

/* ═══ STORE — persistance, migration, export/import ═══ */
proteger("ST-01", "etatInitial : une entrée par compétence du catalogue, maîtrise à 0", () => {
  neuf();
  const ids = Object.keys(Store.etat.competences);
  condition("ST-01", "etatInitial : une entrée par compétence du catalogue, maîtrise à 0",
    ids.length === CONTENU.competences.length && ids.every(id => Store.etat.competences[id].maitrise === 0),
    `${CONTENU.competences.length} compétences à 0`, `${ids.length} compétences`);
});

proteger("ST-02", "modifier() sauve (localStorage contient la clé après le délai de 180 ms)", async () => {
  neuf();
  Store.modifier(e => { e.xp = 42; });
  await new Promise(r => setTimeout(r, 220));
  const brut = localStorage.getItem(CONFIG.cle);
  condition("ST-02", "modifier() sauve (localStorage contient la clé après le délai de 180 ms)",
    brut && JSON.parse(brut).xp === 42, "xp:42 persisté", brut);
});

proteger("ST-03", "charger() après modifier() : la progression survit à un rechargement", async () => {
  neuf();
  Store.modifier(e => { e.xp = 77; e.profil.prenom = "Lou"; });
  await new Promise(r => setTimeout(r, 220));
  const relu = Store.charger();
  condition("ST-03", "charger() après modifier() : la progression survit à un rechargement",
    relu.xp === 77 && relu.profil.prenom === "Lou", "xp:77, prenom:Lou", `xp:${relu.xp}, prenom:${relu.profil.prenom}`);
});

proteger("ST-04", "migrer() réconcilie : une compétence absente d'un état ancien est recréée à 0", () => {
  neuf();
  const etatAncien = { ...Store.etat, competences: {} };
  localStorage.setItem(CONFIG.cle, JSON.stringify(etatAncien));
  const relu = Store.charger();
  const ids = Object.keys(relu.competences);
  condition("ST-04", "migrer() réconcilie : une compétence absente d'un état ancien est recréée à 0",
    ids.length === CONTENU.competences.length && ids.every(id => relu.competences[id].maitrise === 0),
    `${CONTENU.competences.length} compétences réconciliées`, `${ids.length}`);
});

proteger("ST-05", "export puis import restaure un état strictement identique", () => {
  neuf();
  Store.modifier(e => { e.xp = 230; e.competences[CONTENU.competences[0].id].maitrise = 61.5; e.certifications["premier-pas"] = { obtenueLe: "2026-01-01T00:00:00.000Z" }; });
  const avant = JSON.parse(JSON.stringify(Store.etat));
  const texte = Store.exporter();
  neuf();
  Store.importer(texte);
  const apres = JSON.parse(JSON.stringify(Store.etat));
  delete avant.dernierExport; delete apres.dernierExport;   // horodaté par exporter() : hors du périmètre de l'identité
  condition("ST-05", "export puis import restaure un état strictement identique",
    JSON.stringify(avant) === JSON.stringify(apres), "identiques", "voir diff");
});

proteger("ST-06", "importer() refuse un fichier qui n'a pas la forme d'une progression", () => {
  neuf();
  let leve = false;
  try { Store.importer(JSON.stringify({ pasUneProgression: true })); } catch (e) { leve = true; }
  condition("ST-06", "importer() refuse un fichier qui n'a pas la forme d'une progression", leve, "exception", leve ? "exception" : "aucune exception");
});

proteger("ST-07", "reinitialiser() repart d'un état neuf et retire la clé de stockage", () => {
  neuf();
  Store.modifier(e => { e.xp = 999; });
  Store.reinitialiser();
  condition("ST-07", "reinitialiser() repart d'un état neuf et retire la clé de stockage",
    Store.etat.xp === 0 && localStorage.getItem(CONFIG.cle) === null, "xp:0, clé absente", `xp:${Store.etat.xp}, clé:${localStorage.getItem(CONFIG.cle)}`);
});

/* ═══ PROGRESSION — XP, niveaux ═══ */
proteger("PG-01", "seuilCumul(1) = 100, seuilCumul(2) = 300 (50n²+50n)", () => {
  condition("PG-01", "seuilCumul(1) = 100, seuilCumul(2) = 300 (50n²+50n)",
    PROGRESSION_CONFIG.seuilCumul(1) === 100 && PROGRESSION_CONFIG.seuilCumul(2) === 300,
    "100, 300", `${PROGRESSION_CONFIG.seuilCumul(1)}, ${PROGRESSION_CONFIG.seuilCumul(2)}`);
});

proteger("PG-02", "niveau() : 0 XP → niveau 1 Novice ; 100 XP → niveau 2", () => {
  neuf();
  const n0 = Progression.niveau();
  Store.modifier(e => { e.xp = 100; });
  const n1 = Progression.niveau();
  condition("PG-02", "niveau() : 0 XP → niveau 1 Novice ; 100 XP → niveau 2",
    n0.niveau === 1 && n0.titre === "Novice" && n1.niveau === 2, "1/Novice puis 2", `${n0.niveau}/${n0.titre} puis ${n1.niveau}`);
});

/* ═══ MAÎTRISE — succès/échec dans les proportions de Classe'R ═══ */
proteger("MA-01", "une réussite sans indice augmente la maîtrise de alphaMaitrise·poids·(100-maitrise)", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  Store.modifier(e => { e.competences[id].maitrise = 40; });
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 1 });
  const attendu = 40 + 0.25 * 1 * (100 - 40);   // difficulte 2 → poids 1
  condition("MA-01", "une réussite sans indice augmente la maîtrise de alphaMaitrise·poids·(100-maitrise)",
    approx(Store.etat.competences[id].maitrise, attendu), attendu, Store.etat.competences[id].maitrise);
});

proteger("MA-02", "un échec diminue la maîtrise de min(perteMax, alphaEchec·poids·maitrise)", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  Store.modifier(e => { e.competences[id].maitrise = 40; });
  Progression.enregistrerResultat({ competences: [id], reussi: false, difficulte: 2, facteur: 1 });
  const attendu = 40 - Math.min(15, 0.15 * 1 * 40);
  condition("MA-02", "un échec diminue la maîtrise de min(perteMax, alphaEchec·poids·maitrise)",
    approx(Store.etat.competences[id].maitrise, attendu), attendu, Store.etat.competences[id].maitrise);
});

proteger("MA-03", "un échec ne peut jamais retirer plus de perteMax (15) points, même à 100 %", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  Store.modifier(e => { e.competences[id].maitrise = 100; });
  Progression.enregistrerResultat({ competences: [id], reussi: false, difficulte: 3, facteur: 1 });
  condition("MA-03", "un échec ne peut jamais retirer plus de perteMax (15) points, même à 100 %",
    approx(Store.etat.competences[id].maitrise, 85), 85, Store.etat.competences[id].maitrise);
});

proteger("MA-04", "consolidation : 3 réussites sans indice d'affilée, maîtrise ≥ 80, force à 100", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  Store.modifier(e => { e.competences[id].maitrise = 82; });
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 1 });
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 1 });
  const avantConsolidation = Store.etat.competences[id].maitrise;
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 1 });
  condition("MA-04", "consolidation : 3 réussites sans indice d'affilée, maîtrise ≥ 80, force à 100",
    avantConsolidation < 100 && Store.etat.competences[id].maitrise === 100, "< 100 puis 100", `${avantConsolidation} puis ${Store.etat.competences[id].maitrise}`);
});

proteger("MA-05", "consolidation : un indice utilisé (facteur < 0.99) casse la série", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  Store.modifier(e => { e.competences[id].maitrise = 82; });
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 1 });
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 0.5 });  // indice utilisé : série cassée
  Progression.enregistrerResultat({ competences: [id], reussi: true, difficulte: 2, facteur: 1 });
  condition("MA-05", "consolidation : un indice utilisé (facteur < 0.99) casse la série",
    Store.etat.competences[id].maitrise < 100, "< 100 (série cassée, pas encore 3 d'affilée)", Store.etat.competences[id].maitrise);
});

/* ═══ DÉCROISSANCE D'OUBLI — déterministe, horloge en PARAMÈTRE (D001, D045.H) ═══ */
proteger("OU-01", "aucune perte avant jouisAvantOubli (7) jours, sans dépendre de l'horloge réelle", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  const t0 = Date.UTC(2026, 0, 1);
  Store.modifier(e => { e.competences[id].maitrise = 60; e.competences[id].tentatives = 1; e.competences[id].derniereActivite = new Date(t0).toISOString(); });
  const apres6j = Progression.maitrise(id, t0 + 6 * 86400000);
  condition("OU-01", "aucune perte avant jouisAvantOubli (7) jours, sans dépendre de l'horloge réelle",
    apres6j.effective === 60, 60, apres6j.effective);
});

proteger("OU-02", "après le délai de grâce : 1,2 point perdu par jour, sans horloge réelle", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  const t0 = Date.UTC(2026, 0, 1);
  Store.modifier(e => { e.competences[id].maitrise = 60; e.competences[id].tentatives = 1; e.competences[id].derniereActivite = new Date(t0).toISOString(); });
  const apres10j = Progression.maitrise(id, t0 + 10 * 86400000);   // 3 jours au-delà des 7 de grâce
  condition("OU-02", "après le délai de grâce : 1,2 point perdu par jour, sans horloge réelle",
    approx(apres10j.effective, 60 - 3 * 1.2), 60 - 3 * 1.2, apres10j.effective);
});

proteger("OU-03", "le plancher de décroissance est la moitié de la maîtrise brute, jamais moins", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  const t0 = Date.UTC(2026, 0, 1);
  Store.modifier(e => { e.competences[id].maitrise = 60; e.competences[id].tentatives = 1; e.competences[id].derniereActivite = new Date(t0).toISOString(); });
  const unAn = Progression.maitrise(id, t0 + 365 * 86400000);
  condition("OU-03", "le plancher de décroissance est la moitié de la maîtrise brute, jamais moins",
    unAn.effective === 30, 30, unAn.effective);
});

proteger("OU-04", "la fonction est pure : même état, même « maintenant », même résultat (deux appels)", () => {
  neuf();
  const id = CONTENU.competences[0].id;
  const t0 = Date.UTC(2026, 0, 1);
  Store.modifier(e => { e.competences[id].maitrise = 60; e.competences[id].tentatives = 1; e.competences[id].derniereActivite = new Date(t0).toISOString(); });
  const a = Progression.maitrise(id, t0 + 9 * 86400000), b = Progression.maitrise(id, t0 + 9 * 86400000);
  condition("OU-04", "la fonction est pure : même état, même « maintenant », même résultat (deux appels)",
    a.effective === b.effective, b.effective, a.effective);
});

proteger("OU-05", "jamais travaillée (0 tentative) : brute et effective à 0, quel que soit « maintenant »", () => {
  neuf();
  const id = CONTENU.competences[1].id;
  const r = Progression.maitrise(id, Date.UTC(2030, 0, 1));
  condition("OU-05", "jamais travaillée (0 tentative) : brute et effective à 0, quel que soit « maintenant »",
    r.jamaisTravaillee && r.brute === 0 && r.effective === 0, "0, 0, jamaisTravaillee", `${r.brute}, ${r.effective}, ${r.jamaisTravaillee}`);
});

/* ═══ pointsFaibles ═══ */
proteger("PF-01", "pointsFaibles trie par maîtrise effective croissante, jamais-travaillée en tête", () => {
  neuf();
  const [c0, c1] = CONTENU.competences;
  Store.modifier(e => { e.competences[c1.id].maitrise = 90; e.competences[c1.id].tentatives = 3; e.competences[c1.id].derniereActivite = new Date().toISOString(); });
  const pf = Progression.pointsFaibles(CONTENU.competences.length);
  condition("PF-01", "pointsFaibles trie par maîtrise effective croissante, jamais-travaillée en tête",
    pf[0].id === c0.id && pf[pf.length - 1].id === c1.id, `${c0.id} en tête, ${c1.id} en dernier`, `${pf[0].id} en tête, ${pf[pf.length - 1].id} en dernier`);
});

/* ═══ CERTIFICATIONS — se déclenchent sur leur condition, jamais deux fois ═══ */
proteger("CE-01", "premier-pas se déclenche à la première réussite d'un exercice", () => {
  neuf();
  const avant = Progression.verifierCertifications();
  condition("CE-01a", "avant toute réussite : premier-pas n'est pas encore obtenue", !avant.some(c => c.id === "premier-pas"), "absente", avant.map(c => c.id));
  Progression.enregistrerResultat({ competences: [], reussi: true, difficulte: 1, idExercice: "demo-qcm" });
  const certifs = Progression.verifierCertifications();
  condition("CE-01b", "premier-pas se déclenche à la première réussite d'un exercice",
    !!Store.etat.certifications["premier-pas"], "obtenue", Store.etat.certifications["premier-pas"]);
});

proteger("CE-02", "une certification déjà obtenue n'est jamais réannoncée (idempotence)", () => {
  Progression.enregistrerResultat({ competences: [], reussi: true, difficulte: 1, idExercice: "demo-qcm" });
  const certifs = Progression.verifierCertifications();
  condition("CE-02", "une certification déjà obtenue n'est jamais réannoncée (idempotence)",
    !certifs.some(c => c.id === "premier-pas"), "pas réannoncée", certifs.map(c => c.id));
});

proteger("CE-03", "chasseur-de-null : se déclenche à 60 %, pas juste avant", () => {
  neuf();
  const id = "valeurs-manquantes";
  Store.modifier(e => { e.competences[id].maitrise = 59; e.competences[id].tentatives = 1; e.competences[id].derniereActivite = new Date().toISOString(); });
  const avant = Progression.verifierCertifications();
  condition("CE-03a", "59 % : pas encore obtenue", !avant.some(c => c.id === "chasseur-de-null"), "absente", avant.map(c => c.id));
  Store.modifier(e => { e.competences[id].maitrise = 60; });
  const apres = Progression.verifierCertifications();
  condition("CE-03b", "60 % : obtenue", apres.some(c => c.id === "chasseur-de-null"), "présente", apres.map(c => c.id));
});

proteger("CE-04", "assidu : 7 jours de pratique d'affilée", () => {
  neuf();
  Store.modifier(e => { e.serie.jours = 7; });
  const certifs = Progression.verifierCertifications();
  condition("CE-04", "assidu : 7 jours de pratique d'affilée", certifs.some(c => c.id === "assidu"), "présente", certifs.map(c => c.id));
});

proteger("CE-05", "polyvalent : exige les 9 compétences actives à 50 %, pas 8 sur 9", () => {
  neuf();
  CONTENU.competences.forEach(c => { Store.etat.competences[c.id].maitrise = 50; Store.etat.competences[c.id].tentatives = 1; Store.etat.competences[c.id].derniereActivite = new Date().toISOString(); });
  Store.etat.competences[CONTENU.competences[0].id].maitrise = 49;
  const presque = Progression.verifierCertifications();
  condition("CE-05a", "8 compétences sur 9 : pas encore polyvalent", !presque.some(c => c.id === "polyvalent"), "absente", presque.map(c => c.id));
  Store.etat.competences[CONTENU.competences[0].id].maitrise = 50;
  const complet = Progression.verifierCertifications();
  condition("CE-05b", "9 compétences sur 9 à 50 % : polyvalent", complet.some(c => c.id === "polyvalent"), "présente", complet.map(c => c.id));
});

/* ═══ Session — choix pondéré, bilan ═══ */
proteger("SE-01", "Session.demarrer choisit parmi les exercices accessibles, jusqu'à nb", () => {
  neuf();
  const ok = Session.demarrer(null, 5);
  condition("SE-01", "Session.demarrer choisit parmi les exercices accessibles, jusqu'à nb",
    ok && Session.courante.liste.length === Math.min(5, CONTENU.exercices.length), Math.min(5, CONTENU.exercices.length), Session.courante && Session.courante.liste.length);
});

proteger("SE-02", "Session.demarrer filtre par compétence quand elle est précisée", () => {
  neuf();
  const comp = CONTENU.exercices[0].competence;
  Session.demarrer(comp, 10);
  condition("SE-02", "Session.demarrer filtre par compétence quand elle est précisée",
    Session.courante.liste.every(ex => ex.competence === comp), comp, Session.courante.liste.map(ex => ex.competence));
});

proteger("SE-03", "Session.repondre (qcm, bonne réponse) incrémente reussites et les tentatives de l'exercice", () => {
  neuf();
  Session.demarrer(null, CONTENU.exercices.length);
  const iQcm = Session.courante.liste.findIndex(ex => ex.type === "qcm");
  if (iQcm === -1) throw new Error("pas d'exercice qcm dans la liste de test");
  Session.courante.index = iQcm;
  const ex = Session.courante.liste[iQcm];
  Session.repondre(ex.reponse);
  condition("SE-03", "Session.repondre (qcm, bonne réponse) incrémente reussites et les tentatives de l'exercice",
    Session.courante.reussites === 1 && Store.etat.exercices[ex.id].tentatives === 1, "1 et 1", `${Session.courante.reussites} et ${Store.etat.exercices[ex.id].tentatives}`);
});

proteger("SE-04", "Session.suivant() passe en bilan après la dernière question, et compte une série parfaite", () => {
  neuf();
  Session.demarrer(null, CONTENU.exercices.length);
  const n = Session.courante.liste.length;
  for (let i = 0; i < n; i++) {
    const ex = Session.courante.liste[i];
    const rep = ex.type === "qcm" ? ex.reponse
      : ex.type === "predire" ? String(ex.predit === "nbLignes" ? Attendus.predire(ex).nbLignes : Attendus.predire(ex).valeur)
      : ex.solution;
    Session.repondre(rep);
    Session.suivant();
  }
  condition("SE-04", "Session.suivant() passe en bilan après la dernière question, et compte une série parfaite",
    Session.courante.etat === "bilan" && Store.etat.stats.seriesParfaites === 1, "bilan, 1 série parfaite", `${Session.courante.etat}, ${Store.etat.stats.seriesParfaites}`);
});

/* ═══ Mission — une seule forme de validation (requête ↔ Comparateur), étoiles, brouillon ═══ */
const MISSION_TEST = {
  id: "test-mission", titre: "Mission de test (verifier-progression.mjs, jamais dans CONTENU.missions)",
  difficulte: 1, competences: [CONTENU.competences[0].id],
  etapes: [
    { consigne: "Combien de catégories ?", solution: "SELECT COUNT(*) FROM categories", comparer: {} },
    { consigne: "Combien de clients ?", solution: "SELECT COUNT(*) FROM clients", comparer: {} }
  ]
};

proteger("MI-01", "Mission.demarrer charge la première étape, sans brouillon", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    const ok = Mission.demarrer("test-mission");
    condition("MI-01", "Mission.demarrer charge la première étape, sans brouillon",
      ok && Mission.courante.etape === 0 && Mission.courante.brouillon === "", "étape 0, brouillon vide", `étape ${Mission.courante && Mission.courante.etape}`);
  } finally { CONTENU.missions.pop(); }
});

proteger("MI-02", "Mission.verifier refuse une mauvaise requête, sans avancer l'étape", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    Mission.demarrer("test-mission");
    const res = Mission.verifier("SELECT 999");
    condition("MI-02", "Mission.verifier refuse une mauvaise requête, sans avancer l'étape",
      !res.reussi && Mission.courante.etape === 0, "refusé, étape 0", `${res.reussi}, étape ${Mission.courante.etape}`);
  } finally { CONTENU.missions.pop(); }
});

proteger("MI-03", "Mission.verifier accepte la bonne requête et avance d'une étape", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    Mission.demarrer("test-mission");
    const res = Mission.verifier("SELECT COUNT(*) FROM categories");
    condition("MI-03", "Mission.verifier accepte la bonne requête et avance d'une étape",
      res.reussi && Mission.courante.etape === 1, "accepté, étape 1", `${res.reussi}, étape ${Mission.courante.etape}`);
  } finally { CONTENU.missions.pop(); }
});

proteger("MI-04", "Mission.terminer à la dernière étape : 3 étoiles sans indice, XP, Store.etat.missions à jour", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    Mission.demarrer("test-mission");
    Mission.verifier("SELECT COUNT(*) FROM categories");
    Mission.verifier("SELECT COUNT(*) FROM clients");
    condition("MI-04", "Mission.terminer à la dernière étape : 3 étoiles sans indice, XP, Store.etat.missions à jour",
      Mission.courante.etat === "bilan" && Mission.courante.etoiles === 3 && Store.etat.missions["test-mission"].statut === "terminee" && Mission.courante.xp === 30,
      "bilan, 3 étoiles, terminee, 30 XP",
      `${Mission.courante.etat}, ${Mission.courante.etoiles} étoiles, ${Store.etat.missions["test-mission"].statut}, ${Mission.courante.xp} XP`);
  } finally { CONTENU.missions.pop(); }
});

proteger("MI-05", "un indice utilisé baisse les étoiles à 2, et l'XP suit max(0.3, 1-0.1·indicesTotal)", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    Mission.demarrer("test-mission");
    Mission.indice();
    Mission.verifier("SELECT COUNT(*) FROM categories");
    Mission.verifier("SELECT COUNT(*) FROM clients");
    const xpAttendu = Math.round(30 * 1 * Math.max(0.3, 1 - 0.1 * 1));
    condition("MI-05", "un indice utilisé baisse les étoiles à 2, et l'XP suit max(0.3, 1-0.1·indicesTotal)",
      Mission.courante.etoiles === 2 && Mission.courante.xp === xpAttendu, `2 étoiles, ${xpAttendu} XP`, `${Mission.courante.etoiles} étoiles, ${Mission.courante.xp} XP`);
  } finally { CONTENU.missions.pop(); }
});

proteger("MI-06", "sauvegarderBrouillon persiste le texte de l'étape dans Store.etat.missions", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    Mission.demarrer("test-mission");
    Mission.sauvegarderBrouillon("SELECT 1");
    condition("MI-06", "sauvegarderBrouillon persiste le texte de l'étape dans Store.etat.missions",
      Store.etat.missions["test-mission"].brouillon === "SELECT 1", "SELECT 1", Store.etat.missions["test-mission"].brouillon);
  } finally { CONTENU.missions.pop(); }
});

proteger("MI-07", "demarrer() reprend le brouillon et l'étape sauvegardés (reprise après abandon)", () => {
  neuf();
  CONTENU.missions.push(MISSION_TEST);
  try {
    Mission.demarrer("test-mission");
    Mission.verifier("SELECT COUNT(*) FROM categories");    // avance à l'étape 1
    Mission.sauvegarderBrouillon("SELECT 2");
    Mission.quitter();
    Mission.demarrer("test-mission");
    condition("MI-07", "demarrer() reprend le brouillon et l'étape sauvegardés (reprise après abandon)",
      Mission.courante.etape === 1 && Mission.courante.brouillon === "SELECT 2", "étape 1, « SELECT 2 »", `étape ${Mission.courante.etape}, « ${Mission.courante.brouillon} »`);
  } finally { CONTENU.missions.pop(); }
});

/* Le contrôle par mutation (casser une règle dans une copie jetable de src/, relancer, constater l'échec,
   comme au lot 3 : DECISIONS.md D038) est fait à la main après une exécution verte de ce script — pas ici :
   un « mutant » qui s'auto-évalue avec la même formule mutée ne prouve rien (c'est tautologique). */

/* ── Bilan ─────────────────────────────────────────────────── */
const echecs = resultats.filter(r => !r.ok);
resultats.forEach(r => console.log(`${r.ok ? "✔" : "✘"} ${r.id.padEnd(9)} ${r.titre.slice(0, 90)}`));
if (echecs.length) {
  console.log(`\n${echecs.length} critère(s) en échec :`);
  echecs.forEach(r => console.log(`  - ${r.id} ${r.titre}\n    attendu : ${r.attendu}\n    obtenu  : ${r.obtenu}`));
  process.exit(1);
}
console.log(`\n✔ ${resultats.length} critères satisfaits`);
