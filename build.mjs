#!/usr/bin/env node
/* Requêt'R — build : assemble src/ et vendor/ en un seul fichier requeter.html autonome.
   Usage : node build.mjs
   Idempotent : aucune date, aucun horodatage, sortie identique à chaque exécution. */

import { readFileSync, writeFileSync, renameSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = dirname(fileURLToPath(import.meta.url));
const chemin = (...p) => join(RACINE, ...p);

const SOURCES = {
  gabarit:     "src/template.html",
  app:         "src/app.js",
  contenu:     "src/contenu.js",
  moteur:      "src/moteur.js",
  comparateur: "src/comparateur.js",
  exercices:   "src/exercices.js",
  store:       "src/store.js",
  progression: "src/progression.js",
  routeur:     "src/routeur.js",
  seed:        "src/seed.sql",
  seedSale:    "src/seed-sale.sql",
  sqljs:   "vendor/sql-wasm.js",
  wasm:    "vendor/sql-wasm.wasm"
};
const SORTIE = "requeter.html";

function echec(message) {
  console.error(`\nÉCHEC DU BUILD — ${message}\n`);
  process.exit(1);
}

/* 1. Toutes les sources doivent exister avant de commencer. */
const manquantes = Object.values(SOURCES).filter(f => !existsSync(chemin(f)) || !statSync(chemin(f)).isFile());
if (manquantes.length) {
  echec(`fichier(s) source manquant(s) :\n  - ${manquantes.join("\n  - ")}\nRestaure-les (vendor/ vient de sql.js, voir DECISIONS.md D004) puis relance.`);
}

/* 2. Lecture : texte en UTF-8, fins de ligne normalisées ; le binaire n'est jamais décodé. */
const texte = f => readFileSync(chemin(f), "utf8").replace(/\r\n/g, "\n");
const gabarit = texte(SOURCES.gabarit);
const wasmB64 = readFileSync(chemin(SOURCES.wasm)).toString("base64");
if (!wasmB64.length) echec(`${SOURCES.wasm} est vide.`);

/* Un script inliné ne doit contenir ni </script ni <!-- : le navigateur couperait le bloc. */
function verifierInlinable(fichier, contenu) {
  for (const interdit of ["</script", "<!--"]) {
    if (contenu.toLowerCase().includes(interdit)) {
      echec(`${fichier} contient « ${interdit} », ce qui casserait la balise <script> du fichier final.`);
    }
  }
}

/* Les seeds sont injectés comme littéraux JS : JSON.stringify, plus « < » échappé par prudence.
   Le second (D027) est le jeu « sale » du palier 5, chargé à la place du premier par nouvelleBase(SEED_SALE_SQL). */
const litteralSeed = f => JSON.stringify(texte(f)).replace(/</g, "\\u003c");

const valeurs = {
  VENDOR_SQLJS: texte(SOURCES.sqljs),
  WASM_B64:     wasmB64,
  SEED_SQL:      litteralSeed(SOURCES.seed),
  SEED_SALE_SQL: litteralSeed(SOURCES.seedSale),
  CONTENU:      texte(SOURCES.contenu),
  MOTEUR:       texte(SOURCES.moteur),
  COMPARATEUR:  texte(SOURCES.comparateur),
  EXERCICES:    texte(SOURCES.exercices),
  APP:          texte(SOURCES.app),
  STORE:        texte(SOURCES.store),
  PROGRESSION:  texte(SOURCES.progression),
  ROUTEUR:      texte(SOURCES.routeur)
};
verifierInlinable(SOURCES.sqljs, valeurs.VENDOR_SQLJS);
verifierInlinable(SOURCES.contenu, valeurs.CONTENU);
verifierInlinable(SOURCES.moteur, valeurs.MOTEUR);
verifierInlinable(SOURCES.comparateur, valeurs.COMPARATEUR);
verifierInlinable(SOURCES.exercices, valeurs.EXERCICES);
verifierInlinable(SOURCES.app, valeurs.APP);
verifierInlinable(SOURCES.store, valeurs.STORE);
verifierInlinable(SOURCES.progression, valeurs.PROGRESSION);
verifierInlinable(SOURCES.routeur, valeurs.ROUTEUR);

/* 3. Chaque marqueur du gabarit doit être connu et présent exactement une fois. */
const trouves = [...gabarit.matchAll(/@@([A-Z0-9_]+)@@/g)].map(m => m[1]);
const inconnus = trouves.filter(n => !(n in valeurs));
if (inconnus.length) echec(`marqueur(s) inconnu(s) dans ${SOURCES.gabarit} : ${[...new Set(inconnus)].join(", ")}`);
for (const nom of Object.keys(valeurs)) {
  const n = trouves.filter(t => t === nom).length;
  if (n !== 1) echec(`le marqueur @@${nom}@@ doit apparaître une fois dans ${SOURCES.gabarit} (trouvé ${n} fois).`);
}

/* 4. Un seul passage : ce qui est injecté n'est jamais re-parcouru (le JS de sql.js peut contenir « @@ » ou « $& »). */
const html = gabarit.replace(/@@([A-Z0-9_]+)@@/g, (_, nom) => valeurs[nom]);

/* 5. Écriture atomique : jamais de requeter.html à moitié écrit. */
const sortie = chemin(SORTIE);
const temporaire = sortie + ".tmp";
writeFileSync(temporaire, html, "utf8");
renameSync(temporaire, sortie);

/* 6. Bilan : taille et empreinte, pour suivre la dérive du poids lot après lot. */
const octets = Buffer.byteLength(html, "utf8");
const sha = createHash("sha256").update(readFileSync(sortie)).digest("hex");
const ko = (octets / 1024).toFixed(1).replace(".", ",");
const mo = (octets / 1048576).toFixed(3).replace(".", ",");
console.log(`✔ ${relative(process.cwd(), sortie) || SORTIE} construit`);
console.log(`  taille  : ${octets.toLocaleString("fr-FR")} octets (${ko} Ko, ${mo} Mo)`);
console.log(`  SHA-256 : ${sha}`);
