"use strict";
/* ═══════════════════════════════════════════════════════════
   REQUÊT'R — moteur SQL (sorti de app.js au lot 3 : verifier-comparateur.mjs exerce ainsi le vrai code, pas une copie)
   SQLite (sql.js) tournant en mémoire. Aucun DOM : ce fichier se charge aussi sous Node.
   Globaux fournis par le build : initSqlJs (vendor), WASM_B64, SEED_SQL.
   ═══════════════════════════════════════════════════════════ */

/** SQLite (sql.js) tournant en mémoire. Le binaire WASM est décodé depuis WASM_B64 :
 *  on passe wasmBinary et JAMAIS l'option de localisation du fichier, qui déclencherait une requête réseau. */
const Moteur = (() => {
  let SQL = null, db = null;
  const etat = { version: null, msInit: null, msBase: null };
  const LIMITE_LIGNES = 500;       // AFFICHAGE seulement : au-delà, la table de résultats est tronquée
  const LIMITE_LECTURE = 10000;    // lignes LUES par jeu de résultats (D036) : protège la mémoire d'un produit cartésien
  const DELAI_MS = 3000;           // durée de lecture au-delà de laquelle on abandonne (D036), contrôlée toutes les 256 lignes

  function decoderBase64(b64) {
    const binaire = atob(b64);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return octets;
  }

  /** Repart d'une base propre : seed rejoué, rien d'autre. Les clés étrangères sont activées par le seed lui-même
   *  (PRAGMA foreign_keys = ON, désactivées par défaut dans sql.js). Le seed est un paramètre (D027) : par défaut le
   *  seed principal, mais un autre jeu pourra être chargé à sa place. Préférer nouvelleBase(), qui mesure. */
  function reinitialiser(seed = SEED_SQL) {
    if (db) db.close();
    db = new SQL.Database();
    if (seed.trim()) db.exec(seed);
  }

  async function initialiser() {
    const debut = performance.now();
    SQL = await initSqlJs({ wasmBinary: decoderBase64(WASM_B64).buffer });
    nouvelleBase();
    etat.version = db.exec("SELECT sqlite_version()")[0].values[0][0];
    etat.msInit = Math.round(performance.now() - debut);
    return etat;
  }

  /** Compteurs d'écriture d'une base : lignes modifiées depuis l'ouverture, et version du schéma (CREATE, DROP, ALTER). */
  const compteurs = base => [base.exec("SELECT total_changes()")[0].values[0][0], base.exec("PRAGMA schema_version")[0].values[0][0]];

  /** Exécute un script (une ou plusieurs instructions) sur `base` et en rend compte (D010, D032, D036).
   *  - jeux : un par instruction qui renvoie des colonnes, même sans ligne (db.exec, lui, omettrait un SELECT vide) ;
   *  - erreur : le message SQLite brut, les jeux produits avant l'erreur sont conservés ;
   *  - instructions : leur nombre (0 pour un script vide ou réduit à des commentaires) ;
   *  - ecritures : vrai si le script a modifié des lignes ou le schéma. « A des colonnes » ne suffit pas : un
   *    INSERT … RETURNING en renvoie ET écrit, un CREATE n'en renvoie pas ;
   *  - tronque / interrompu : plafond de lecture ou délai atteints (le jeu partiel est conservé). */
  function rapport(base, sql, { limiteLecture = LIMITE_LECTURE, delaiMs = DELAI_MS } = {}) {
    const debut = performance.now();
    const avant = compteurs(base);
    const jeux = [];
    let erreur = null, instructions = 0, tronque = false, interrompu = false;
    try {
      for (const st of base.iterateStatements(sql)) {
        instructions++;
        try {
          const colonnes = st.getColumnNames();
          if (colonnes.length) {
            const lignes = [];
            let coupe = false;
            while (st.step()) {
              if (lignes.length >= limiteLecture) { coupe = true; break; }     // une ligne de plus existe : « plus de limiteLecture lignes »
              lignes.push(st.get());
              if ((lignes.length & 255) === 0 && performance.now() - debut > delaiMs) { interrompu = true; break; }
            }
            if (coupe) tronque = true;
            jeux.push({ colonnes, lignes, tronque: coupe });
          } else {
            st.step();               // CREATE, INSERT… : il faut l'exécuter, pas seulement le préparer
          }
        } finally { st.free(); }
        if (interrompu) break;
      }
    } catch (err) {
      erreur = err.message;
    }
    const apres = compteurs(base);
    return {
      jeux, erreur, instructions, tronque, interrompu,
      ecritures: apres[0] !== avant[0] || apres[1] !== avant[1],
      ms: Math.round((performance.now() - debut) * 10) / 10,
      limite: LIMITE_LIGNES, limiteLecture, delaiMs
    };
  }

  /** Exécute sur la base VIVANTE (celle que l'explorateur affiche) : « Exécuter », écritures possibles. */
  function executer(sql) { return rapport(db, sql); }

  /** Exécute sur une base JETABLE reconstruite à neuf, puis la ferme : « Vérifier » et calcul des résultats attendus.
   *  Rien de ce qu'a fait l'apprenant sur la base vivante ne peut fausser le verdict (D032).
   *  `plafond: false` (solutions de référence, écrites par les auteurs) lève le plafond de lecture et le délai. */
  function executerIsole(sql, { seed = SEED_SQL, plafond = true, limiteLecture, delaiMs } = {}) {
    const base = new SQL.Database();
    try {
      if (seed.trim()) base.exec(seed);
      return rapport(base, sql, plafond ? { limiteLecture, delaiMs } : { limiteLecture: Infinity, delaiMs: Infinity });
    } finally { base.close(); }
  }

  function nbTables() {
    return db.exec("SELECT count(*) FROM sqlite_master WHERE type = 'table'")[0].values[0][0];
  }

  /** Description de la base courante, en LECTURE SEULE (sert l'explorateur) : tables, colonnes, clés primaires et
   *  étrangères, nombre de lignes, aperçu des 5 premières lignes (par rowid : ordre stable). */
  function schema() {
    const cite = n => `"${String(n).replace(/"/g, '""')}"`;
    const lire = sql => { const r = db.exec(sql); return r.length ? r[0].values : []; };
    return lire("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid").map(([nom, sql]) => {
      let apercu;
      try { apercu = lire(`SELECT * FROM ${cite(nom)} ORDER BY rowid LIMIT 5`); }
      catch (e) { apercu = lire(`SELECT * FROM ${cite(nom)} LIMIT 5`); }      // table WITHOUT ROWID
      return {
        nom, sql,
        colonnes: lire(`PRAGMA table_info(${cite(nom)})`).map(([, n, type, obligatoire, , pk]) => ({ nom: n, type, obligatoire: !!obligatoire, pk })),
        cles: lire(`PRAGMA foreign_key_list(${cite(nom)})`).map(([, , table, de, vers]) => ({ de, table, vers })),
        lignes: lire(`SELECT count(*) FROM ${cite(nom)}`)[0][0],
        apercu
      };
    });
  }

  return { initialiser, reinitialiser, executer, executerIsole, nbTables, schema, etat };
})();

/** Base neuve depuis un seed : appelée à l'entrée de chaque exercice (D008, chaque exercice repart d'une base propre).
 *  Sans argument, c'est le seed principal (gelé, D025). Un autre jeu de données — typiquement le jeu « sale » du
 *  palier 5 (D027) — se charge à sa place en le passant en paramètre : nouvelleBase(autreSeed). Rien n'est mémorisé :
 *  l'appel suivant sans argument revient au seed principal.
 *  Mesure le temps de reconstruction et le consigne dans Moteur.etat.msBase (en ms, au dixième) ; le renvoie aussi. */
function nouvelleBase(seed = SEED_SQL) {
  const debut = performance.now();
  Moteur.reinitialiser(seed);
  Moteur.etat.msBase = Math.round((performance.now() - debut) * 10) / 10;
  return Moteur.etat.msBase;
}
